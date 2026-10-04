/**
 * `CarInputSource` implementation: one Air Jam player → one car slot, with a
 * STABLE LEVEL view of the controls.
 *
 * This is the Phase 2 deliverable. It exists to resolve mismatch #1 from
 * `seam.ts` ("INPUT CADENCE"): Air Jam's input is edge-shaped, the donor's ABI
 * is level-shaped, and this class is the only place the two meet.
 *
 * NOT a React module, on purpose. It owns no hooks, subscribes to no store and
 * imports nothing from `src/donor/**` except through `seam.ts`. That keeps it
 * unit-testable and callable directly from the host loop at `SIM_HZ = 120`,
 * which is the only place it needs to run.
 *
 * ---------------------------------------------------------------------------
 * THE PULSE → LEVEL RULE (read this before changing anything here)
 * ---------------------------------------------------------------------------
 * `jump` is the ONLY edge-semantics field, and it becomes a ONE-SHOT LATCHED
 * PRESS QUEUE:
 *
 *   A press is COUNTED on the rising edge of the delivered `jump` value
 *   (`false → true` between two consecutive reads). A press is CONSUMED by the
 *   first `read()` that reports `jump: true`, and that read decrements the
 *   queue. `jump` is therefore `true` for exactly as many reads as there were
 *   presses, and `false` on every other read.
 *
 *   `jump = queuedJumpPresses > 0`, then `if (jump) queuedJumpPresses--`.
 *
 * WHY NOT SIMPLY PASS `pulse` THROUGH. Two reasons, both load-bearing:
 *
 *  1. NO LOST PRESS. The count happens at the EDGE, and consumption happens at
 *     the READ — they are different moments. A press that arrives while a
 *     previous press is still queued is incremented, not overwritten, so it
 *     survives until some read drains it. The `pulse` behaviour in the SDK
 *     latches a press into a `Set` and deletes it on read
 *     (`input-manager.ts:309-314,341-346`): the press is delivered exactly
 *     once, and the host's read cadence is what decides whether that "once" is
 *     ever observed. Counting first and consuming later means the sim's
 *     120 Hz read cannot outrun a press the 16 ms Air Jam tick delivered.
 *
 *  2. NO REPEAT-JUMP ON A HELD THUMB. This is why `jump` cannot simply be
 *     passed through as a level: `pulse` reports `value === true || pending`
 *     (`:312`), which stays `true` for as long as the button is HELD. A level
 *     `jump` on a held thumb would re-trigger RocketSim's jump every tick and
 *     the car would never come down. The rising-edge count makes one continuous
 *     hold produce exactly one press.
 *
 * DOUBLE-JUMP SURVIVES BECAUSE OF THE QUEUE. RocketSim derives flips from
 * `jump` plus the analog direction held at that instant, and derives double-jump
 * internally — there is no dodge input in the ABI at all (`seam.ts:61-64`). So
 * a double-tap must reach the sim as two DISTINCT presses separated by a
 * `false`. A rapid double-tap gives: `false → true (press 1) → false (release
 * observed) → true (press 2)`, which the queue drains as two `true` reads with
 * a `false` between them, because the sim reads at 120 Hz and the Air Jam tick
 * is 16 ms (62.5 Hz) — the sim always sees at least one `false` per release.
 *
 * ONE SDK LIMITATION, WHICH THIS CANNOT FIX: the `InputManager` latches pulses
 * into a `Set` (`input-manager.ts:275`), so two presses that both arrive between
 * two host reads collapse into one. A double-tap faster than the Air Jam input
 * tick is therefore seen as a single press. No input-layer change can recover a
 * press the SDK already discarded; the only fix would be a higher controller
 * tick rate. The queue is capped at `maxQueuedJumpPresses` so that a consumer
 * that stops reading can never grow the queue without bound.
 *
 * ---------------------------------------------------------------------------
 * GROUND / AIR MAPPING — DONOR-VERIFIED, NOT INVENTED
 * ---------------------------------------------------------------------------
 * The stick maps exactly as the donor's own touch path does
 * (`donor/input/touch.js:204-224`):
 *
 *     throttle = stick.y      steer  = stick.x      pitch = -stick.y
 *     a  = handbrake || airRoll
 *     yaw  = a ? 0 : stick.x
 *     roll = a ? stick.x : 0
 *
 * The donor applies that unconditionally and lets RocketSim ignore rotation
 * while grounded. This layer additionally ZEROES the three air-only axes on the
 * ground, which is behaviourally identical (RocketSim ignores them there) and
 * strictly safer: a self-centring stick can no longer leak a sliver of roll
 * into the physics at the moment of landing.
 *
 * `airRoll` is a separate Air Jam boolean and does NOT set the `handbrake`
 * control — same as the donor, where `airRoll` and `handbrake` are separate
 * hold buttons (`touch.js:209-221`). `handbrake` keeps the donor's own dual
 * meaning: powerslide on the ground, air-roll modifier in the air.
 *
 * `ON_GROUND` is taken as INPUT, never read out of the donor. This class never
 * touches rendering or simulation internals; the host feeds it the flag via
 * {@link ManagedCarInputSource.updateCarState}.
 */

import {
  NEUTRAL_CONTROLS,
  sanitizeControls,
  type CarControls,
  type CarInputSource,
  type NeutralizeReason,
} from "../seam";
import {
  parseRocketArenaInput,
  type LobbyIntent,
  type RocketArenaInput,
} from "./input-contract";
import { shapeStick, type StickShaping } from "./stick";
import {
  installStuckInputGuard,
  type GuardedSource,
  type GuardTarget,
  type PointerPolicy,
} from "./stuck-input-guard";

/** Per-car physical context the host feeds in. Only `onGround` is load-bearing. */
export interface SourceDiagnosis {
  live: boolean;
  slot: number;
  stickyReason: NeutralizeReason | null;
  present: boolean;
  hidden: boolean;
  stale: boolean;
  disposed: boolean;
}

export interface CarStateContext {
  /** RocketSim's `CAR_STATE.ON_GROUND` flag (`donor/physics/state-layout.js:30`). */
  onGround: boolean;
}

/**
 * The full `CarInputSource` contract plus the bits the host loop and the slots
 * worker need. Everything the `CarSlotRegistry` interface does not declare lives
 * here, so the dependency stays one-directional: the registry drives the
 * source, the source never reaches back into the registry.
 */
export interface ManagedCarInputSource extends CarInputSource, GuardedSource {
  /**
   * The phone's lobby choices, read WITHOUT driving a car. Only meaningful in
   * the lobby: reading the raw payload consumes any pending jump pulse, which
   * is irrelevant before a match and must not be called during one.
   */
  peekLobby(): LobbyIntent | null;
  /** Ball-cam button presses since the last call, then reset. */
  takeBallCamToggles(): number;
  /** Why this source is or is not live, for diagnostics. Never throws. */
  describe(): SourceDiagnosis;
  /** The slots worker pushes the assigned slot in. `-1` unassigns. */
  bindSlot(slot: number, team: 0 | 1 | null): void;
  /** The host loop pushes `ON_GROUND` in every tick. */
  updateCarState(state: CarStateContext): void;
  /** From the presence feed. `false` neutralizes immediately and permanently. */
  setPresence(connected: boolean): void;
  /**
   * Re-arm a source that a sticky {@link neutralize} latched shut. ONLY the
   * host may call this, and only when it positively knows the player is back
   * (a fresh claim, a reconnect). Nothing calls it automatically, which is what
   * keeps the stuck-input guarantee intact.
   */
  rearm(): void;
  /** One-tick neutral, for pointer release / cancel / touchcancel. */
  neutralizeImmediately(reason: NeutralizeReason): void;
  /** Neutralize and stop reading input. Idempotent. */
  dispose(): void;
}

export interface AirJamInputSourceOptions {
  /**
   * Returns the controller's latest payload — i.e. `() => getInput(playerId)`.
   * May return `undefined` (the controller has published nothing, or the SDK's
   * schema rejected it). Injected rather than imported so this layer never
   * depends on React or on a mounted runtime.
   */
  readRaw: () => unknown;
  /** Stick shaping. Defaults to the donor-verified deadzone + a mild expo. */
  shaping?: Partial<StickShaping>;
  /** Reuse an existing guard. One is installed if omitted. */
  guard?: ReturnType<typeof installStuckInputGuard>;
  /** DOM target for `isLive()`. Defaults to the ambient document. */
  guardTarget?: GuardTarget;
  /** Pointer release policy. Defaults to `"engaged"`. */
  pointerPolicy?: PointerPolicy;
  /** Clock. Injectable so tests are deterministic. */
  now?: () => number;
  /** Upper bound on queued jump presses. Defaults to 4. */
  maxQueuedJumpPresses?: number;
  /**
   * How long the controller may publish nothing before this source stops being
   * live. Defaults to 1000 ms. A steady held input still refreshes this on
   * every read, so it only trips when the controller truly goes quiet.
   */
  staleAfterMs?: number;
}

const DEFAULT_MAX_QUEUED_JUMP_PRESSES = 4;
const DEFAULT_STALE_AFTER_MS = 1000;

const ambientIsHidden = (): boolean =>
  typeof document !== "undefined" && document.visibilityState === "hidden";

const ambientNow = (): number =>
  typeof performance !== "undefined" ? performance.now() : Date.now();

/**
 * Rocket League drives with a trigger for throttle and a stick for steering. One
 * thumb stick has to do both, so on the ground the throttle axis is boosted: a
 * diagonal push (steering while accelerating) must still be full throttle, or
 * every corner would bleed speed. Boosting also drives the car forward, as it
 * does in the game, so a thumb on BOOST plus a steering flick is enough.
 */
const GROUND_THROTTLE_GAIN = 1.6;
/** Boosting drives forward unless the stick is clearly pulled back (a brake). */
const BOOST_DRIVES_ABOVE = -0.5;
/** Steering reaches full lock a little before the stick is fully pushed. */
const GROUND_STEER_GAIN = 1.15;

const unit = (value: number): number => (value < -1 ? -1 : value > 1 ? 1 : value);

/** Shape a payload into level controls for the given ground/air context. */
const mapToControls = (
  input: RocketArenaInput,
  onGround: boolean,
  jump: boolean,
  shaping: Partial<StickShaping> | undefined,
): CarControls => {
  const stick = shapeStick(input.stick, shaping);
  // The air-roll affordance, exactly as `touch.js:215` composes it.
  const airRollHeld = input.handbrake || input.airRoll;
  // A gamepad sends its trigger throttle; a phone's single stick is throttle too.
  let throttle =
    onGround && input.throttle !== null
      ? input.throttle
      : onGround
        ? unit(stick.y * GROUND_THROTTLE_GAIN)
        : stick.y;
  if (onGround && input.boost && stick.y > BOOST_DRIVES_ABOVE) throttle = 1;
  return sanitizeControls({
    throttle,
    steer: onGround ? unit(stick.x * GROUND_STEER_GAIN) : stick.x,
    // Pitch is the stick's Y with the donor's sign flip (`touch.js:212`), and is
    // ground-suppressed because it is meaningless there.
    pitch: onGround ? 0 : -stick.y,
    yaw: onGround || airRollHeld ? 0 : stick.x,
    roll: onGround ? 0 : airRollHeld ? stick.x : 0,
    jump,
    boost: input.boost,
    handbrake: input.handbrake,
  });
};

class AirJamCarInputSource implements ManagedCarInputSource {
  readonly playerId: string;

  private readonly readRaw: () => unknown;
  private readonly shaping?: Partial<StickShaping>;
  private readonly now: () => number;
  private readonly staleAfterMs: number;
  private readonly maxQueuedJumpPresses: number;
  private readonly unregisterGuard: () => void;
  private readonly isHidden: () => boolean;

  private currentSlot = -1;
  private currentTeam: 0 | 1 | null = null;
  private onGround = true;
  private present = true;
  private stickyReason: NeutralizeReason | null = null;
  private immediatePending = false;
  private lastJumpSample = false;
  private lastBallCamCount: number | null = null;
  private pendingBallCamToggles = 0;
  private queuedJumpPresses = 0;
  private lastPayloadAt: number;
  private disposed = false;

  constructor(playerId: string, options: AirJamInputSourceOptions) {
    this.playerId = playerId;
    this.readRaw = options.readRaw;
    this.shaping = options.shaping;
    this.now = options.now ?? ambientNow;
    this.staleAfterMs = options.staleAfterMs ?? DEFAULT_STALE_AFTER_MS;
    this.maxQueuedJumpPresses = Math.max(
      1,
      options.maxQueuedJumpPresses ?? DEFAULT_MAX_QUEUED_JUMP_PRESSES,
    );
    this.lastPayloadAt = this.now();
    this.isHidden =
      options.guardTarget?.isHidden ??
      (options.guardTarget ? () => false : ambientIsHidden);
    const guard =
      options.guard ??
      installStuckInputGuard({
        target: options.guardTarget,
        pointerPolicy: options.pointerPolicy,
      });
    this.unregisterGuard = guard.register(this);
  }

  get slot(): number {
    return this.currentSlot;
  }

  get team(): 0 | 1 | null {
    return this.currentTeam;
  }

  bindSlot(slot: number, team: 0 | 1 | null): void {
    this.currentSlot = slot;
    this.currentTeam = team;
  }

  updateCarState(state: CarStateContext): void {
    this.onGround = state.onGround;
  }

  setPresence(connected: boolean): void {
    this.present = connected;
    if (!connected) {
      this.neutralize("disconnected");
    } else if (this.stickyReason === "disconnected") {
      // The ONLY latch that clears itself: the controller that caused it is
      // back, and nothing else would ever re-arm it. Blur / hidden / released
      // latches stay sticky on purpose.
      this.rearm();
    }
  }

  rearm(): void {
    this.stickyReason = null;
    this.immediatePending = false;
    this.lastPayloadAt = this.now();
  }

  neutralize(reason: NeutralizeReason): void {
    this.stickyReason = reason;
    this.queuedJumpPresses = 0;
  }

  neutralizeImmediately(_reason: NeutralizeReason): void {
    // A latched neutralize wins: a one-tick neutral must never look like the
    // source recovered when it has not. Drop the queued presses either way —
    // a release means the thumb is off, so an undelivered press is stale.
    if (this.stickyReason === null) {
      this.immediatePending = true;
    }
    this.queuedJumpPresses = 0;
  }

  /** True when no payload has been observed for `staleAfterMs`. */
  private isStale(): boolean {
    return this.now() - this.lastPayloadAt > this.staleAfterMs;
  }

  isLive(): boolean {
    if (this.disposed || this.stickyReason !== null || !this.present) {
      return false;
    }
    if (this.currentSlot < 0) {
      return false;
    }
    if (this.isHidden()) {
      return false;
    }
    return !this.isStale();
  }

  read(): CarControls {
    if (this.stickyReason !== null || this.disposed || this.currentSlot < 0) {
      return NEUTRAL_CONTROLS;
    }
    if (this.immediatePending) {
      this.immediatePending = false;
      return NEUTRAL_CONTROLS;
    }
    if (!this.present || this.isHidden()) {
      return NEUTRAL_CONTROLS;
    }
    // Staleness is judged on the state ENTERING this read, before a payload
    // gets the chance to refresh the clock — otherwise a stale controller would
    // vouch for itself by re-serving its last buffered payload forever.
    if (this.isStale()) {
      return NEUTRAL_CONTROLS;
    }

    const raw = this.readRaw();
    if (raw === undefined || raw === null) {
      // Controller has published nothing usable. Stay neutral rather than
      // guessing, and do NOT refresh the staleness clock.
      return NEUTRAL_CONTROLS;
    }
    this.lastPayloadAt = this.now();
    const input = parseRocketArenaInput(raw);

    // Rising edge → count a press. Consumption happens at the read below.
    if (input.jump && !this.lastJumpSample) {
      if (this.queuedJumpPresses < this.maxQueuedJumpPresses) {
        this.queuedJumpPresses += 1;
      }
    }
    this.lastJumpSample = input.jump;

    const jump = this.queuedJumpPresses > 0;
    if (jump) {
      this.queuedJumpPresses -= 1;
    }

    // Ball cam is a monotonic COUNT from the phone. The first value seen only
    // seeds the baseline (a reconnecting phone must not replay old presses).
    if (input.ballCamPresses !== null) {
      if (this.lastBallCamCount !== null && input.ballCamPresses > this.lastBallCamCount) {
        this.pendingBallCamToggles += input.ballCamPresses - this.lastBallCamCount;
      }
      this.lastBallCamCount = input.ballCamPresses;
    }

    return mapToControls(input, this.onGround, jump, this.shaping);
  }

  peekLobby(): LobbyIntent | null {
    if (this.disposed) return null;
    const raw = this.readRaw();
    if (raw === undefined || raw === null) return null;
    this.lastPayloadAt = this.now();
    return parseRocketArenaInput(raw).lobby;
  }

  describe(): SourceDiagnosis {
    return {
      live: this.isLive(),
      slot: this.currentSlot,
      stickyReason: this.stickyReason,
      present: this.present,
      hidden: this.isHidden(),
      stale: this.isStale(),
      disposed: this.disposed,
    };
  }

  takeBallCamToggles(): number {
    const toggles = this.pendingBallCamToggles;
    this.pendingBallCamToggles = 0;
    return toggles;
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.neutralize("released");
    this.unregisterGuard();
  }
}

/**
 * Create one Air Jam player → car slot input source.
 *
 * The returned object satisfies `CarInputSource` from `seam.ts` and adds
 * `bindSlot` / `updateCarState` / `setPresence` / `rearm` / `dispose` for the
 * host loop and the slots worker.
 */
export const createAirJamInputSource = (
  playerId: string,
  options: AirJamInputSourceOptions,
): ManagedCarInputSource => new AirJamCarInputSource(playerId, options);
