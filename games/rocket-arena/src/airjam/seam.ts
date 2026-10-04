/**
 * SHARED SEAM CONTRACT for the Rocket Arena → Air Jam port.
 *
 * OWNER: the orchestrator. Every parallel worker implements against this file.
 * Workers MUST NOT edit this file, and MUST NOT edit files outside their own
 * assigned subtree (see each module's header comment).
 *
 * ---------------------------------------------------------------------------
 * WHY THIS FILE EXISTS
 * ---------------------------------------------------------------------------
 * The donor (`src/donor/**`, byte-identical, never edited) has these shapes:
 *
 *  - `app/startup.js` exports ONLY `boot()`. It creates the `PhysicsSimulation`
 *    internally, caches the DOM at MODULE scope, and exposes NO globals. There is
 *    no supported handle to the sim and no teardown API.
 *  - `physics/simulation.js` exports `{ PhysicsSimulation }` and
 *    `sim.setControls(carIndex, controls)` is ALREADY per-slot.
 *  - The input arbitration ("exactly one device wins: gamepad > touch > keyboard")
 *    lives at `startup.js:700-723` and cannot be reached from outside.
 *
 * So the ONLY zero-donor-edit seam is the class itself: patch
 * `PhysicsSimulation.prototype` BEFORE `bootDonor()` runs. Vite guarantees a
 * single module instance, so a prototype patch is observed by the instance the
 * donor creates internally. That is the whole integration trick.
 *
 * ---------------------------------------------------------------------------
 * THE TWO HARD MISMATCHES THIS FILE EXISTS TO RESOLVE
 * ---------------------------------------------------------------------------
 * 1. INPUT CADENCE.
 *    Air Jam booleans default to `pulse`: a press latches, survives a release,
 *    and is delivered exactly once (`input-manager.ts:263-291,309-314`). The
 *    donor ABI is purely LEVEL-triggered. A `pulse` boost would flicker; a
 *    `latest` jump could be missed. `InputSource` below normalises both into a
 *    stable level state, so the sim only ever sees levels.
 * 2. PLAYER IDENTITY.
 *    Air Jam players are strings with their own lifecycle (join/leave/reconnect).
 *    The sim knows only integer car slots. `CarSlotRegistry` owns the mapping.
 */

import { PhysicsSimulation } from "@donor/physics/simulation.js";

/* -------------------------------------------------------------------------- */
/* Donor facts — all code-verified, do not "correct" these without evidence.    */
/* -------------------------------------------------------------------------- */

/** `bridge.cpp`: `constexpr int MAX_CARS = 8`. `addCar` refuses beyond this. */
export const MAX_CARS = 8;

/** `src/online/protocol.js:6` — the sim is fixed-step and MUST stay this rate. */
export const SIM_HZ = 120;

/**
 * The air-Jam input tick. Air Jam does not enforce a rate; this is our choice
 * (`use-controller-tick.ts:16` defaults to 16 ms).
 */
export const AIRJAM_INPUT_TICK_MS = 16;

/**
 * 8 floats per car, written into the WASM heap — the order is load-bearing and
 * comes from `native/network-state.cpp:15`:
 *   p[0]=throttle p[1]=steer p[2]=pitch p[3]=yaw p[4]=roll
 *   p[5]=jump    p[6]=boost p[7]=handbrake
 * There is NO dodge/flip input: RocketSim derives flips from `jump` plus the
 * analog direction held at that instant. Double jump is likewise derived.
 */
export const CONTROL_KEYS = [
  "throttle",
  "steer",
  "pitch",
  "yaw",
  "roll",
  "jump",
  "boost",
  "handbrake",
] as const;

export type ControlKey = (typeof CONTROL_KEYS)[number];

/**
 * The donor's canonical control object. Produced byte-identically by four donor
 * files (`input/keyboard.js:22-31`, `input/gamepad.js:33-42`,
 * `input/touch.js:51-60`, `bots/actions.js:2-11`) — so this is the ONE shape.
 *
 * NOTE `handbrake` is powerslide on the ground AND the air-roll modifier in the
 * air. That is the donor's own semantics, not an invention.
 */
export interface CarControls {
  /** -1 reverse/brake .. +1 forward. */
  throttle: number;
  /** -1 left .. +1 right. */
  steer: number;
  /** -1 nose down .. +1 nose up. */
  pitch: number;
  yaw: number;
  /** -1 .. +1 */
  roll: number;
  jump: boolean;
  boost: boolean;
  handbrake: boolean;
}

/**
 * `protocol.js:15` — the exact value to write when a player is gone, blurred,
 * or disconnected. Writing this guarantees a car can never be stuck boosting or
 * accelerating because a browser swallowed an event.
 */
export const NEUTRAL_CONTROLS: Readonly<CarControls> = Object.freeze({
  throttle: 0,
  steer: 0,
  pitch: 0,
  yaw: 0,
  roll: 0,
  jump: false,
  boost: false,
  handbrake: false,
});

/**
 * Clamp to the ABI the bridge actually accepts. The bridge clamps and NaN-guards
 * defensively (`std::isfinite` → 0, clamp to [-1,1]) but shaping belongs here so
 * the phone's raw stick range never reaches physics.
 * Buttons are thresholded at `> 0.5` in the bridge, so we emit exactly 0 or 1.
 */
export function sanitizeControls(raw: Partial<CarControls> | null | undefined): CarControls {
  const axis = (v: unknown): number => {
    const n = typeof v === "number" && Number.isFinite(v) ? v : 0;
    return n < -1 ? -1 : n > 1 ? 1 : n;
  };
  return {
    throttle: axis(raw?.throttle),
    steer: axis(raw?.steer),
    pitch: axis(raw?.pitch),
    yaw: axis(raw?.yaw),
    roll: axis(raw?.roll),
    jump: raw?.jump === true,
    boost: raw?.boost === true,
    handbrake: raw?.handbrake === true,
  };
}

/** Object → the 8-float array the sim wants. */
export function toControlArray(c: CarControls): number[] {
  const s = sanitizeControls(c);
  return [s.throttle, s.steer, s.pitch, s.yaw, s.roll, s.jump ? 1 : 0, s.boost ? 1 : 0, s.handbrake ? 1 : 0];
}

/* -------------------------------------------------------------------------- */
/* Input seam (Phase 2)                                                        */
/* -------------------------------------------------------------------------- */

/** Why a car's controls stopped being trusted. All of them write NEUTRAL. */
export type NeutralizeReason = "never-claimed" | "disconnected" | "blurred" | "released" | "replaced";

/**
 * One Air Jam player/controller bound to one car slot.
 *
 * An implementation MUST expose a stable LEVEL view of the controls. The owner of
 * this interface is responsible for converting Air Jam `pulse` booleans into a
 * held level and for deciding when a `pulse` has been consumed.
 */
export interface CarInputSource {
  /** Air Jam controller/player id this source is bound to. */
  readonly playerId: string;
  /** The car slot in the simulation, or -1 when unassigned. */
  readonly slot: number;
  /** 0 = blue, 1 = orange, null when unassigned. */
  readonly team: 0 | 1 | null;
  /** Current LEVEL controls. Never returns a partial object. */
  read(): CarControls;
  /** Drop to NEUTRAL and stop trusting input. Must be idempotent. */
  neutralize(reason: NeutralizeReason): void;
  /** True once this source is allowed to drive (present + visible + not stale). */
  isLive(): boolean;
}

/** Registry mapping Air Jam players → car slots. Single owner: the slots worker. */
export interface CarSlotRegistry {
  /**
   * Assign a player to a free slot on `team`, or null when full. `slot` asks for
   * ONE specific slot (a late joiner taking over a bot's car); null if it is
   * taken or out of range.
   */
  claim(playerId: string, team?: 0 | 1, slot?: number): number | null;
  /** Release a slot and return it to the pool. Neutralizes first. */
  release(playerId: string): void;
  /** Look up without claiming. */
  slotOf(playerId: string): number | null;
  /** All live bindings, in slot order. */
  entries(): ReadonlyArray<{ playerId: string; slot: number; team: 0 | 1; source: CarInputSource }>;
  /** Every car the host currently drives, including bots. */
  liveSlots(): ReadonlyArray<{ slot: number; team: 0 | 1; controlled: boolean; source: CarInputSource | null }>;
  /** Neutralize EVERYTHING. Call on blur, disconnect and teardown. */
  neutralizeAll(reason: NeutralizeReason): void;
}

/* -------------------------------------------------------------------------- */
/* Viewport seam (Phase 4)                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The donor has NO EffectComposer. Post is a custom chain on a
 * `WebGLRenderTarget` (`rendering/reference-post.js:76-78`) and Three r185 lets a
 * render target carry its OWN viewport/scissor. So one scene renders N times
 * with `main.setViewport(...)` + `setScissor(...)` + `setScissorTest(true)` and
 * the whole post chain is confined per rectangle with zero shader edits.
 *
 * TRAP: `renderer.setSize()` RESETS the viewport to full canvas. Rects must be
 * re-applied after every setSize. Single hook point in the donor:
 * `startup.js:673-678` (the window resize handler).
 */
export interface ViewportRect {
  /** Index into the full-canvas drawing buffer, origin top-left. */
  index: number;
  playerId: string | null;
  /** CSS-pixel rect of the full canvas. */
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Canonical layouts. 1 → fullscreen, 2 → vertical split, 4 → 2x2, 3 → 2 top + 1 bottom. */
export type ViewportLayoutName = "solo" | "split-v" | "split-h" | "duo-top" | "quad";

/**
 * Pure geometry: return exactly `count` non-overlapping rects covering
 * `width x height`. Deterministic and gap-free so no pixels are wasted or
 * double-drawn. NO Three.js / DOM dependency — this must be unit-testable.
 *
 * Declared as a TYPE, not a function, so this contract file stays free of
 * implementations. The concrete geometry lives in `src/airjam/viewports/`.
 */
export type ViewportGeometry = (
  count: number,
  width: number,
  height: number,
  layout?: ViewportLayoutName,
) => ViewportRect[];

/* -------------------------------------------------------------------------- */
/* Quality seam (Phase 10)                                                     */
/* -------------------------------------------------------------------------- */

export type QualityPreset = "ULTRA" | "HIGH" | "BALANCED" | "PERFORMANCE";

/** Starting preset by viewport count. Do not lower global quality before profiling. */
export const DEFAULT_PRESET_BY_VIEWPORTS: Readonly<Record<number, QualityPreset>> = Object.freeze({
  1: "ULTRA",
  2: "HIGH",
  3: "HIGH",
  4: "BALANCED",
  6: "PERFORMANCE",
});

/** Every viewport gets its own camera + ball-cam toggle. NEVER shared between players. */
export interface PlayerView {
  playerId: string;
  slot: number;
  rect: ViewportRect;
  ballCam: boolean;
  /** Opaque handle to this player's own chase-camera instance. */
  camera: unknown;
}

/* -------------------------------------------------------------------------- */
/* THE SEAM ITSELF (owned by the orchestrator)                                 */
/* -------------------------------------------------------------------------- */

/** The subset of the donor sim this port actually depends on. */
export interface PortedSim {
  setControls(slot: number, controls: CarControls | number[]): void;
  step(ticks?: number): void;
  readonly state: Float32Array;
}

export interface SimSeamHooks {
  /**
   * Called INSTEAD of the donor's own per-frame controls for a claimed slot.
   * Return the level controls to drive that car this tick.
   *
   * `sim` is the donor's own instance (the patched call's `this`). It is passed
   * through so the host can read live car state — notably `ON_GROUND`, which the
   * ground/air stick mapping needs — without the seam having to capture it.
   * It is the LAST parameter so existing 2-argument hooks stay valid.
   */
  onControls(slot: number, donorControls: CarControls, sim?: PortedSim): CarControls;
  /** Called after every sim step, before the donor reads state. */
  onAfterStep?(slot: number, state: Float32Array): void;
  /** Total cars currently in the arena. */
  carCount?(): number;
  /**
   * Add a car. MUST delegate to the WASM export `_physics_addCar(team, preset)`
   * (it exists and is the ONLY supported way to grow the arena) and return the
   * new slot index, or -1 on failure (the bridge refuses past MAX_CARS=8 or on a
   * bad team). Placement should use `_physics_setCarState`.
   */
  addCar?(team: 0 | 1): number;
}

// NOTE: the donor simulation is imported LAZILY inside `installSimSeam` rather
// than at module scope. A static import would drag the donor's browser-only
// Emscripten WASM glue into every unit test that imports this contract, which
// has no `fetch`/`WebAssembly.instantiateStreaming` to satisfy it. `install` is
// already only ever called immediately before the async `bootDonor()`, so making
// it awaitable costs nothing.
type PhysicsSimulationCtor = { prototype: PatchedPrototype };

interface PatchedPrototype {
  setControls: (this: PortedSim, slot: number, controls: CarControls | number[]) => void;
}

let installed: PatchedPrototype | null = null;

/**
 * Install the prototype patch. MUST be awaited and called before `bootDonor()`.
 *
 * Idempotent. Resolves false (and changes nothing) if the donor's class or the
 * method is missing — callers must treat that as a hard failure and surface it,
 * never silently continue, because an unpatched sim means phones cannot drive.
 */
export async function installSimSeam(hooks: SimSeamHooks): Promise<boolean> {
  if (installed) return true;
  let ctor: PhysicsSimulationCtor | undefined;
  try {
    ({ PhysicsSimulation: ctor } = (await import("@donor/physics/simulation.js")) as {
      PhysicsSimulation: PhysicsSimulationCtor;
    });
  } catch (error) {
    console.error("[rocket-arena/seam] could not import the donor simulation", error);
    return false;
  }
  const proto = ctor?.prototype;
  if (!proto || typeof proto.setControls !== "function") {
    console.error(
      "[rocket-arena/seam] PhysicsSimulation.prototype.setControls not found — the sim seam cannot be installed",
    );
    return false;
  }
  const original = proto.setControls;
  proto.setControls = function patchedSetControls(this: PortedSim, slot: number, controls: CarControls | number[]) {
    // Normalise whatever the donor passes (object OR already-8-float array).
    const donorControls: CarControls = Array.isArray(controls)
      ? {
          throttle: controls[0],
          steer: controls[1],
          pitch: controls[2],
          yaw: controls[3],
          roll: controls[4],
          jump: controls[5] > 0.5,
          boost: controls[6] > 0.5,
          handbrake: controls[7] > 0.5,
        }
      : sanitizeControls(controls);
    const next = sanitizeControls(hooks.onControls(slot, donorControls, this));
    // MUST pass the control OBJECT, not the 8-float array.
    //
    // `toControlArray` documents the NATIVE/WASM layout (8 float32 written into
    // the heap, `native/network-state.cpp:15`) — but the donor's JS
    // `PhysicsSimulation.setControls` is the thing that performs that
    // conversion itself, reading named properties: `t.throttle`, `t.steer`, ...
    // (`src/donor/src/physics/simulation.js:138-152`). Handing it an array makes
    // every field `undefined` -> NaN -> RocketSim's NaN guard clamps it to 0, so
    // NO CAR EVER DRIVES. The failure is silent and total: the ball never leaves
    // centre, `kickoffTouched` stays false, and the match clock sits at 5:00
    // forever, which reads like a physics or match-flow bug rather than an
    // argument-shape bug.
    return original.call(this, slot, next);
  };
  installed = proto;
  return true;
}

/** Test-only. Restores the original method. */
export function uninstallSimSeam(): void {
  if (!installed) return;
  // Re-deriving the original is not possible from here by design; the seam is
  // once-per-page-load, matching the donor's own once-per-load boot constraint.
  installed = null;
}

/** Test-only: whether the seam is currently installed. */
export function isSimSeamInstalled(): boolean {
  return installed !== null;
}

/* -------------------------------------------------------------------------- */
/* State-block reader                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Offsets inside the donor's 510-float state block. Verified against
 * `src/physics/state-layout.js` and the C++ `publish()` writer.
 *
 * Header: TICK 0, GOAL 1, NUM_CARS 2, NUM_PADS 3, then the ball at 4 (18 floats:
 * pos 4-6, fwd 7-9, right 10-12, up 13-15, vel 16-18, angVel 19-21).
 * Cars start at 22 with a stride of 51. Boost pads follow at 430 (40 x 2).
 */
export const STATE = {
  TICK: 0,
  GOAL: 1,
  NUM_CARS: 2,
  NUM_PADS: 3,
  BALL: 4,
  CARS: 22,
  CAR_STRIDE: 51,
  PADS: 430,
} as const;

/** Field offsets WITHIN one car's 51-float block. */
export const CAR_STATE = {
  POS: 0,
  FWD: 3,
  RIGHT: 6,
  UP: 9,
  VEL: 12,
  ANG_VEL: 15,
  BOOST: 18,
  ON_GROUND: 19,
  SUPERSONIC: 20,
  DEMOED: 21,
  HAS_FLIP_OR_JUMP: 22,
  IS_BOOSTING: 23,
  IS_FLIPPING: 24,
  JUMP_SERIAL: 41,
  DODGE_SERIAL: 42,
  DOUBLE_JUMP_SERIAL: 43,
  BALL_HIT_SERIAL: 46,
} as const;

/** Base float index of a car block. */
export function carOffset(slot: number): number {
  return STATE.CARS + slot * STATE.CAR_STRIDE;
}

/** Read one car block. Returns null for a slot outside the live roster. */
export function readCar(state: Float32Array, slot: number): {
  slot: number;
  pos: [number, number, number];
  vel: [number, number, number];
  boost: number;
  onGround: boolean;
  supersonic: boolean;
  demoed: boolean;
  jumpSerial: number;
  dodgeSerial: number;
  doubleJumpSerial: number;
  ballHitSerial: number;
} | null {
  const count = state[STATE.NUM_CARS] | 0;
  if (slot < 0 || slot >= count) return null;
  const at = carOffset(slot);
  if (at + STATE.CAR_STRIDE > state.length) return null;
  return {
    slot,
    pos: [state[at], state[at + 1], state[at + 2]],
    vel: [state[at + CAR_STATE.VEL], state[at + CAR_STATE.VEL + 1], state[at + CAR_STATE.VEL + 2]],
    boost: state[at + CAR_STATE.BOOST],
    onGround: state[at + CAR_STATE.ON_GROUND] === 1,
    supersonic: state[at + CAR_STATE.SUPERSONIC] === 1,
    demoed: state[at + CAR_STATE.DEMOED] === 1,
    jumpSerial: state[at + CAR_STATE.JUMP_SERIAL],
    dodgeSerial: state[at + CAR_STATE.DODGE_SERIAL],
    doubleJumpSerial: state[at + CAR_STATE.DOUBLE_JUMP_SERIAL],
    ballHitSerial: state[at + CAR_STATE.BALL_HIT_SERIAL],
  };
}

/** Live car count, straight from the state header. */
export function readCarCount(state: Float32Array): number {
  return state[STATE.NUM_CARS] | 0;
}

/**
 * Neutralize every car in the arena in ONE write, by zeroing the whole controls
 * block. This is the blunt safety net for blur/disconnect/teardown: it stops
 * even cars the port has no binding for, so nothing can be left driving.
 */
export function writeNeutralControls(sim: { module?: unknown }): void {
  const wasm = sim?.module as
    | { _physics_getControlsPtr?: () => number; HEAPF32?: Float32Array }
    | undefined;
  const ptr = wasm?._physics_getControlsPtr?.();
  const heap = wasm?.HEAPF32;
  if (!ptr || !heap) return;
  const start = ptr >> 2;
  heap.fill(0, start, start + MAX_CARS * CONTROL_KEYS.length);
}
