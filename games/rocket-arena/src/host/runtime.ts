/**
 * Host runtime — the single place where Air Jam player identity, the car-slot
 * registry and the donor's simulation are joined together.
 *
 * ---------------------------------------------------------------------------
 * WHY NO HOST LOOP IS NEEDED FOR PHYSICS
 * ---------------------------------------------------------------------------
 * The donor already runs its own `FrameScheduler` and steps its own fixed 120 Hz
 * simulation, calling `sim.setControls(slot, controls)` once per car per frame
 * from its internal arbitration (`startup.js:721-723` for the human, `:753` for
 * a bot). So we do NOT add a second step loop — doing so would double-step the
 * sim and break determinism.
 *
 * Instead we patch `setControls` (see `installSimSeam`) and let the donor's loop
 * drive us. Each time the donor asks "what should car N do this frame", we
 * answer with the Air Jam player's controls when that slot is claimed, and pass
 * the donor's own value straight through when it is not. Bots and the local
 * keyboard keep working untouched.
 *
 * The per-tick sequence is therefore:
 *   donor frame → setControls(slot) → [seam] read ON_GROUND from sim state
 *              → feedCarStates → readAll → return this player's level controls
 *
 * ---------------------------------------------------------------------------
 * WHY THIS FILE ALSO OWNS ARENA GROWTH
 * ---------------------------------------------------------------------------
 * The donor creates ONE physics car at boot (`app/startup.js:247`) and then only
 * ever drives slots 0 and 1 (`:723` and `:753`). Without an `addCar` the arena
 * can never hold more than the cars the donor made for itself, so the slot
 * registry used to book seats for cars that did not exist: a third phone joined,
 * was given slot 2, and drove nothing.
 *
 * Growth is therefore wired HERE rather than left to the lobby, because this is
 * the only place that holds both the sim handle and the claimed seats. The
 * mechanics live in `arena-growth.ts`; the fill plan and the mirrored kickoff
 * poses stay Phase 3's (`growArena` / `planKickoffPlacement`).
 */

import {
  MAX_CARS,
  NEUTRAL_CONTROLS,
  type CarControls,
  type CarInputSource,
  type NeutralizeReason,
  type PortedSim,
  carOffset,
  installSimSeam,
  isSimSeamInstalled,
  readCar,
  sanitizeControls,
  writeNeutralControls,
} from "@/airjam/seam";
import {
  createCarSlotRegistry,
  type ArenaRefusal,
  type GrowArenaResult,
  type ManagedCarSlotRegistry,
  type Team,
} from "@/airjam/slots";
import type { ManagedCarInputSource } from "@/airjam/input/airjam-input-source";
import {
  installInputSources,
  type InputSourcesController,
  type LobbyIntent,
  type PresenceNotice,
} from "@/airjam/input";
import {
  createArenaGrowthHost,
  ensureArenaCapacity,
  isStillAtKickoff,
  type GrowthSim,
} from "@/host/arena-growth";

export interface HostRuntimeOptions {
  /** `() => host.getInput(playerId)` — the raw Air Jam payload for a player. */
  readRaw: (playerId: string) => unknown;
  /** Where to listen for pointer/blur/visibility neutralization. Defaults to window. */
  guardTarget?: Parameters<typeof installInputSources>[0]["guardTarget"];
  /**
   * Grow the donor's arena by one physics car per join. Right for the legacy
   * 1-human-plus-bot donor flow; WRONG once a local match builds the whole
   * roster itself at START (the arena is re-created there), so the shell turns
   * it off. Defaults to true.
   */
  growOnJoin?: boolean;
  /** A phone pressed its ball-cam button. `slot` is the seat/car index. */
  onBallCamToggle?: (slot: number) => void;
  /**
   * Milliseconds without a fresh read before a source counts as stale. The SDK
   * attaches no timestamp to a payload, so an idle phone and a vanished one look
   * identical here; a host that feeds `syncPresence` should pass Infinity and let
   * presence say who is gone.
   */
  staleAfterMs?: number;
}

export interface HostRuntime {
  /**
   * Install the seam. MUST be awaited and completed before `bootDonor()`.
   * Resolves false on failure — an unpatched sim means phones cannot drive, so
   * the host must surface that rather than continue silently.
   */
  install(): Promise<boolean>;
  /** True once the seam is live. */
  readonly installed: boolean;
  /** The slot registry, for lobby wiring. */
  readonly registry: ManagedCarSlotRegistry;
  /** Claim a car for a joining player. `null` when the arena is full. */
  join(playerId: string, team?: Team): number | null;
  /**
   * Grow the arena to hold `target` cars, one per claimed seat. Runs on every
   * `join`, so calling it again is a no-op once the arena is there. Returns
   * null while the donor's sim is not live yet or cannot add cars — the
   * request is remembered and applied as soon as it can be.
   *
   * Never throws: a refusal is reported through `snapshot().growth`.
   */
  ensureCapacity(target: number): GrowArenaResult | null;
  /** Release a car for a leaving player. */
  leave(playerId: string): void;
  /**
   * Re-seat everyone in the given order and teams, so seat i gets slot i. This
   * is how a match launch turns the lobby's roster (teams chosen on the
   * projector) into the dense car list the donor builds. Returns the slot of
   * each seat, in order, or null for a seat that could not be claimed.
   */
  reseat(seats: ReadonlyArray<{ playerId: string; team: Team }>): Array<number | null>;
  /**
   * Put a player on ONE specific car (a late joiner taking over a bot's car, or a
   * reconnecting player getting their own car back). Drops whatever slot the
   * player held. Returns the slot, or null if it is not available.
   */
  takeSeat(playerId: string, slot: number, team: Team): number | null;
  /** The phone's lobby choices (ready/team/name), or null if it has sent none. Lobby only. */
  peekLobby(playerId: string): LobbyIntent | null;
  /** Why a player's source is or is not live (diagnostics). Null for an unknown player. */
  diagnose(playerId: string): ReturnType<ManagedCarInputSource["describe"]> | null;
  /** Feed the presence feed. An absent controller counts as disconnected. */
  syncPresence(notices: ReadonlyArray<PresenceNotice>): void;
  /** Neutralize everything — blur, disconnect storm, teardown. */
  neutralizeAll(reason: NeutralizeReason): void;
  /** Diagnostics for the event/debug overlay. */
  snapshot(): HostSnapshot;
  dispose(): void;
}

export interface HostSnapshot {
  installed: boolean;
  players: ReadonlyArray<{
    playerId: string;
    slot: number;
    team: Team | null;
    live: boolean;
    boost: number;
    onGround: boolean;
  }>;
  /**
   * Cars the SIM actually has, read from the state header's NUM_CARS at offset
   * 2. Not the registry's seat count: those are two different things, and only
   * this one says whether the arena really grew.
   */
  carCount: number;
  /** Cars the arena could still reach, the bridge's own `MAX_CARS`. */
  capacity: number;
  growth: ArenaGrowthReadout;
}

/** How arena growth is going. A refusal here is a product state, not a fault. */
export interface ArenaGrowthReadout {
  /** Growth is queued but the donor's sim is not live yet. */
  pending: boolean;
  /** The sim exposes a way to add a car at all. */
  available: boolean;
  /** Cars this host has added since boot. */
  added: number;
  /** The most recent refusal, or null. */
  refusal: ArenaRefusal | null;
  /** Whether the last growth produced exactly mirrored kickoff spawns. */
  symmetricKickoff: boolean | null;
  /** The last low-level failure message, or null. */
  failure: string | null;
}

/**
 * Decides when the per-tick input snapshot must be recomputed.
 *
 * The donor calls `setControls` once per car per tick, and reading an input
 * source CONSUMES its queued jump press — so recomputing per call would hand a
 * press to the first car asked and drop it for the rest. Calls for one tick
 * arrive microseconds apart, so "same tick number, recently computed" means
 * reuse. A longer gap means the sim is NOT stepping (countdown, pause, replay):
 * the tick number then stays frozen, and reusing it forever would also freeze
 * the sources' liveness clock.
 */
export const createTickGate = (
  recomputeAfterMs = 4,
  clock: () => number = () => (typeof performance !== "undefined" ? performance.now() : Date.now()),
) => {
  let computedForTick = Number.NaN;
  let computedAt = Number.NEGATIVE_INFINITY;
  return {
    /** True when the snapshot for `tick` must be (re)computed now. Marks it computed. */
    shouldCompute(tick: number): boolean {
      const stamp = clock();
      // NaN !== NaN, so an unreadable tick always recomputes.
      if (tick === computedForTick && stamp - computedAt <= recomputeAfterMs) return false;
      computedForTick = tick;
      computedAt = stamp;
      return true;
    },
    /** Forget the cached snapshot (the roster changed under it). */
    invalidate(): void {
      computedForTick = Number.NaN;
      computedAt = Number.NEGATIVE_INFINITY;
    },
  };
};

const CAR_STRIDE = 51;
const ON_GROUND = 19;

export const createHostRuntime = (options: HostRuntimeOptions): HostRuntime => {
  /**
   * Live sim handle, captured from the donor's own instance. The seam hands the
   * instance to `onControls`, so this is filled on the donor's very first frame
   * rather than needing a global.
   */
  let sim: GrowthSim | null = null;
  let reportedTickError = false;

  /**
   * Growth state. `pendingTarget` is what the lobby asked for while the donor
   * was still booting; `openingState` is the car layout on the first frame we
   * ever saw, which is what tells a lobby-time join (safe to reset natively)
   * from a mid-match one (must not be).
   */
  const growth = createArenaGrowthHost(() => sim);
  let pendingTarget = 0;
  let openingState: Float32Array | null = null;
  let lastGrowth: GrowArenaResult | null = null;
  let lastRefusal: ArenaRefusal | null = null;
  let growthFlushScheduled = false;
  let reportedGrowthError = false;
  let reportedNoAddCar = false;

  const reportGrowthError = (message: string, error?: unknown): void => {
    if (reportedGrowthError) return;
    reportedGrowthError = true;
    console.error(`[rocket-arena/host] ${message}`, error);
  };

  /** The sim's state, or null if the handle is gone or the heap is unreachable. */
  const simState = (): Float32Array | null => {
    if (!sim) return null;
    try {
      return sim.state;
    } catch {
      return null;
    }
  };

  const registry = createCarSlotRegistry({
    maxCars: MAX_CARS,
    createSource: (playerId, slot, team) =>
      // The input layer owns pulse→level; we hand it the registry's book-keeping
      // identity so a released/reclaimed slot still resolves to one source.
      createSourceFor(playerId, slot, team),
    sim: undefined as unknown as PortedSim,
  });

  /**
   * The source the REGISTRY holds for a claimed player.
   *
   * `registry.claim` calls this from INSIDE `inputs.register`, so at this point
   * the controller has not created its own source for the player yet — its
   * `byPlayer` entry is written only after `claim` returns. Calling
   * `inputs.register` from here to get one is infinite re-entrancy: it claims,
   * which claims, which claims… and the first `join` dies with `RangeError:
   * Maximum call stack size exceeded`.
   *
   * So this is a thin delegate. It forwards to the controller's source as soon
   * as that exists and stays a safe neutral until then, which keeps
   * `inputs.register` the single owner of live sources while the registry still
   * sees a working `CarInputSource` for the slot it just handed out. The
   * registry's interface cannot be told about a source after the fact (it has no
   * `attach`, and `seam.ts` is not editable), so delegation is the seam.
   */
  function createSourceFor(playerId: string, slot: number, team: Team): CarInputSource {
    const existing = inputs.get(playerId);
    if (existing) return existing;
    return {
      playerId,
      slot,
      team,
      read: () => inputs.get(playerId)?.read() ?? NEUTRAL_CONTROLS,
      neutralize: (reason) => {
        inputs.get(playerId)?.neutralize(reason);
      },
      isLive: () => inputs.get(playerId)?.isLive() ?? false,
    };
  }

  const inputs: InputSourcesController = installInputSources({
    registry,
    readRaw: options.readRaw,
    guardTarget: options.guardTarget,
    staleAfterMs: options.staleAfterMs,
  });

  /** slot → the controls to drive it with this frame. */
  const bySlot = new Map<number, CarControls>();

  /**
   * The physics tick `bySlot` was computed for. The donor calls `setControls`
   * once per car per tick, and reading an input source CONSUMES its queued jump
   * press — so recomputing per call would hand a press to the first car asked
   * and drop it for the rest. Computing once per tick keeps every car's jump.
   */
  const gate = createTickGate();
  const simTick = (): number => (sim ? (simState()?.[0] ?? Number.NaN) : Number.NaN);

  const tick = (): void => {
    bySlot.clear();
    if (!sim) return;

    // RocketSim's ON_GROUND decides whether the stick steers or flies the car.
    const onGround = new Map<number, boolean>();
    for (const entry of registry.liveSlots()) {
      const car = readCar(sim.state, entry.slot);
      if (car) onGround.set(entry.slot, car.onGround);
    }
    inputs.feedCarStates(onGround);

    for (const snapshot of inputs.readAll()) {
      bySlot.set(snapshot.slot, snapshot.controls);
      const toggles = inputs.get(snapshot.playerId)?.takeBallCamToggles() ?? 0;
      // Two taps inside one tick cancel out, exactly as two taps should.
      if (toggles % 2 === 1) options.onBallCamToggle?.(snapshot.slot);
      // The donor only calls setControls for the two cars it made for itself
      // (startup.js:723 and :753), so a car this host grew into slot 2+ would
      // never be asked about and would sit still all match. Writing the block
      // directly is the only way to reach those slots; the seam exposes no
      // unpatched `setControls` and calling the patched one would recurse.
      //
      // Harmless for slots 0 and 1: `seam.ts:363` calls the original with this
      // hook's result right after, so the donor's own write lands last.
      growth.writeSlotControls(snapshot.slot, snapshot.controls);
    }
  };

  /**
   * Apply a growth request that was queued before the donor existed.
   *
   * Deferred out of the donor's fixed step: `onControls` runs INSIDE the frame
   * that calls `n.step(1)`, and adding a car rewrites the native car array that
   * step is about to iterate. A microtask runs once the current frame's
   * synchronous work is done — between steps, never during one.
   *
   * Deliberately NOT called from `ensureArena`: only the sim's first capture
   * can make a queued request runnable, and re-arming the queue from the failure
   * path would spin microtasks forever on a page where the sim never appears.
   */
  const scheduleGrowth = (): void => {
    if (growthFlushScheduled || pendingTarget <= 0) return;
    growthFlushScheduled = true;
    queueMicrotask(() => {
      growthFlushScheduled = false;
      const target = pendingTarget;
      pendingTarget = 0;
      ensureArena(target);
    });
  };

  const captureOpeningState = (target: GrowthSim): void => {
    try {
      openingState = target.state.slice();
    } catch (error) {
      openingState = null;
      // Without this snapshot the host can never prove the match is still at
      // kickoff, so growth falls back to mirrored poses. Not fatal.
      reportGrowthError("could not snapshot the opening car positions", error);
    }
  };

  /**
   * Take the opening snapshot on the first frame the sim has actually
   * PUBLISHED a car count.
   *
   * The state header is written by `step()`, and the donor only steps while its
   * match phase is "playing" (`startup.js:748-753`), so before the first step
   * the whole 510-float buffer is zeros — including NUM_CARS. Snapshotting
   * then would record an empty arena and make `isStillAtKickoff` false forever,
   * costing the native kickoff reset for the whole match.
   */
  const captureOpeningWhenPublished = (): void => {
    if (openingState !== null || !sim) return;
    if (growth.carCount() <= 0) return;
    captureOpeningState(sim);
  };

  /**
   * Ask the sim to hold `target` cars. Idempotent: the arena only ever grows.
   *
   * The target is the highest claimed slot + 1, never the seat count, because
   * the donor's own car(s) may already occupy slots the registry has not
   * claimed. A full arena is reported, never thrown: the running match matters
   * more than the player who could not fit.
   */
  const ensureArena = (target: number): GrowArenaResult | null => {
    // A NaN target would poison `pendingTarget` for the rest of the page's
    // life, so it is normalised away rather than propagated.
    const requested = Math.floor(target);
    const wanted = Number.isFinite(requested) ? Math.max(0, requested) : 0;
    if (wanted <= 0) return null;

    if (!sim) {
      // Nothing can be added yet, and nothing re-arms the queue: the donor's
      // first `setControls` capture is the only event that can retry.
      pendingTarget = Math.max(pendingTarget, wanted);
      return null;
    }
    if (growth.carCount() <= 0) {
      // NUM_CARS is 0 because the sim has not stepped yet, NOT because the
      // arena is empty — the donor creates its own car during boot
      // (`startup.js:247`) and only publishes the header on the first step.
      // Growing against a zero header would add a second car on top of the one
      // that already exists. Defer until the count is real.
      pendingTarget = Math.max(pendingTarget, wanted);
      return null;
    }
    if (!growth.available) {
      // The audit's F2 shape: no `addCar` means no growth. Report it once, keep
      // the seats, and let the lobby show the arena as full.
      if (!reportedNoAddCar) {
        reportedNoAddCar = true;
        console.warn(
          "[rocket-arena/host] this simulation exposes no addCar, so the arena cannot grow past " +
            `${growth.carCount()} car(s); players beyond that stay in the lobby`,
        );
      }
      lastRefusal = {
        kind: "no-addCar",
        detail: "the sim exposes no addCar capability, so the arena cannot be grown",
      };
      return null;
    }

    try {
      const result = ensureArenaCapacity(growth, wanted, {
        teams: registry.teamsBySlot(),
        // Only while every car is still where the engine put it. A mid-match
        // join must not teleport a running match back to kickoff.
        allowNativeReset: isStillAtKickoff(openingState, simState()),
        ceiling: MAX_CARS,
        onRefusal: (refusal) => {
          lastRefusal = refusal;
          console.warn(
            `[rocket-arena/host] arena growth stopped — ${refusal.kind}: ${refusal.detail}`,
          );
        },
      });
      lastGrowth = result;
      return result;
    } catch (error) {
      // `ensureArenaCapacity` does not throw by contract. Belt and braces: this
      // runs while a match may be live, and a throw here is the worst outcome.
      reportGrowthError("arena growth failed; the arena stays as it is", error);
      return null;
    }
  };

  /** Cars the arena should hold: one per claimed seat, lowest slot + 1. */
  const desiredCars = (): number => {
    const slots = registry.liveSlots();
    return slots.reduce((highest, entry) => Math.max(highest, entry.slot + 1), 0);
  };

  const install = async (): Promise<boolean> => {
    if (isSimSeamInstalled()) return true;
    return installSimSeam({
      onControls: (slot, donorControls, donorSim) => {
        if (donorSim && donorSim !== sim) {
          sim = donorSim;
          // Players who joined while the donor was still booting left a growth
          // request behind; apply it now, outside the step.
          scheduleGrowth();
        }
        // Retry a request that was deferred because the sim had not published a
        // car count yet. `scheduleGrowth` only queues ONE microtask, so this
        // costs at most one deferred attempt per frame, and it stops as soon as
        // the request is satisfied (which clears `pendingTarget`).
        captureOpeningWhenPublished();
        if (pendingTarget > 0) scheduleGrowth();

        // Keep the per-tick refresh cheap: one recompute per donor frame, not
        // one per car. `setControls` is called once per car per frame, so without
        // this guard a 4-car frame would recompute the whole input set 4x.
        //
        // This runs INSIDE the donor's fixed-step update, so anything thrown
        // here aborts the step and silently freezes the match while rendering
        // continues — the worst possible failure mode. It must never throw.
        try {
          if (sim) {
            if (gate.shouldCompute(simTick())) tick();
          }
        } catch (error) {
          // One report, not a flood: this fires per car per frame if unguarded.
          if (!reportedTickError) {
            reportedTickError = true;
            console.error("[rocket-arena/host] input tick failed; controls are neutral", error);
          }
          bySlot.clear();
        }

        // A claimed slot is driven by its Air Jam player. Anything else — bots,
        // the local keyboard, the unpatched fallback — passes through untouched.
        return bySlot.get(slot) ?? donorControls;
      },
    });
  };

  return {
    get installed() {
      return isSimSeamInstalled();
    },
    install,
    registry,
    join: (playerId, team) => {
      const source = inputs.register(playerId, team);
      if (!source) return null;
      // A seat is only real if the sim has a car for it. Growing here — rather
      // than leaving it to a lobby effect — means the car exists before the
      // player can touch the stick, and `join` is already the moment the
      // registry hands out a slot.
      if (options.growOnJoin !== false) ensureArena(desiredCars());
      return source.slot;
    },
    takeSeat: (playerId, slot, team) => {
      inputs.unregister(playerId);
      gate.invalidate();
      const source = inputs.register(playerId, team, slot);
      return source ? source.slot : null;
    },
    peekLobby: (playerId) => inputs.get(playerId)?.peekLobby() ?? null,
    diagnose: (playerId) => inputs.get(playerId)?.describe() ?? null,
    reseat: (seats) => {
      for (const source of inputs.sources().map((entry) => entry.playerId)) inputs.unregister(source);
      registry.forgetRetained();
      gate.invalidate();
      return seats.map((seat) => inputs.register(seat.playerId, seat.team)?.slot ?? null);
    },
    ensureCapacity: ensureArena,
    leave: (playerId) => inputs.unregister(playerId),
    syncPresence: (notices) => inputs.syncPresence(notices),
    neutralizeAll: (reason) => {
      inputs.neutralizeAll(reason);
      registry.neutralizeAll(reason);
      // Blunt safety net: zero the whole controls block so even unbound cars stop.
      if (sim) writeNeutralControls(sim);
    },
    snapshot: () => ({
      installed: isSimSeamInstalled(),
      players: inputs.sources().map((source) => {
        const car = sim ? readCar(sim.state, source.slot) : null;
        return {
          playerId: source.playerId,
          slot: source.slot,
          team: source.team,
          live: source.isLive(),
          boost: car?.boost ?? 0,
          onGround: car?.onGround ?? false,
        };
      }),
      // The sim's own NUM_CARS, not the registry's seats: this is the number
      // that proves (or disproves) the arena actually grew.
      carCount: growth.carCount(),
      capacity: MAX_CARS,
      growth: {
        pending: pendingTarget > 0,
        available: growth.available,
        added: lastGrowth?.added.length ?? 0,
        refusal: lastRefusal,
        symmetricKickoff: lastGrowth?.symmetricKickoff ?? null,
        failure: growth.lastFailure,
      },
    }),
    dispose: () => {
      inputs.dispose();
      registry.clear("released");
      sim = null;
      pendingTarget = 0;
      openingState = null;
      lastGrowth = null;
      lastRefusal = null;
    },
  };
};

export { NEUTRAL_CONTROLS, sanitizeControls, carOffset, CAR_STRIDE, ON_GROUND };
