/**
 * Phase 9 — reading the donor's own physics debug hook (pure).
 *
 * OWNER: the Phase 9 parity worker (`src/airjam/parity/**`).
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS READS
 * ---------------------------------------------------------------------------
 * The donor exposes exactly one raw, opt-in observation surface:
 * `?physicsDebug=1` installs `window.rocketArenaPhysics`, built by
 * `diagnostics/physics-debug.js:2-21`. `snapshot()` returns
 *
 *   { schema, metadata, metrics, samples[], limitations[] }
 *
 * and every sample is `{ schedulerTick, state[510], mode, phase,
 * physicsSelection, playerControls, botControls, botPending, botTicksRemaining,
 * carConfigurations }` — the trailing fields are the `context()` callback from
 * `app/startup.js:783-785`, spread onto each sample at capture time.
 *
 * `state` is `Array.from(currState)` over a `Float32Array` (`clock.js:62`), so
 * the values are exact — no float32→float64 widening loss. `state[0]` is TICK
 * per the layout the donor itself publishes in `metadata.stateLayout`, which
 * `seam.ts` re-states as `STATE`.
 *
 * ---------------------------------------------------------------------------
 * WHAT IT DELIBERATELY DOES NOT DO
 * ---------------------------------------------------------------------------
 * It does not ask the donor whether the sim is healthy. The donor's own
 * `limitations` array already concedes what it cannot show: scheduler ticks
 * include match countdown ticks, and contact impulses, hidden jump timers and
 * full-state initialisation are not exposed. Those limits are surfaced verbatim
 * by `SNAPSHOT_LIMITATIONS` below so no caller can quote a stronger claim than
 * the instrument supports. `physics-lab.js:41-42` also shows the hook is gated
 * on `?physicsDebug=1`, so a capture that skipped the flag legitimately has no
 * snapshot and must be reported as such rather than as a pass.
 */

import { CAR_STATE, STATE, carOffset, type CarControls } from "../seam.js";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export interface PhysicsDebugMetrics {
  readonly physicsHz: number;
  readonly schedulerTick: number;
  readonly scheduledSeconds: number;
  readonly lastTicks: number;
  readonly lastDropped: number;
  readonly totalDropped: number;
  readonly lastBlocked: number;
  readonly totalBlocked: number;
  readonly lastStalled: number;
  readonly alpha: number;
}

export interface PhysicsDebugMetadata {
  readonly units: string;
  readonly axes: string;
  readonly core: string;
  readonly implementation: string;
  readonly coreSha256: string;
  readonly parity: string;
  readonly carStride: number;
  readonly [key: string]: unknown;
}

export interface PhysicsDebugSample {
  readonly schedulerTick: number;
  /** The 510-float sim state. `state[0]` is TICK. */
  readonly state: readonly number[];
  readonly mode: string;
  readonly phase: string;
  readonly playerControls: Readonly<Record<string, CarControls>>;
  readonly botControls: Readonly<Record<string, CarControls>>;
  readonly raw: Readonly<Record<string, unknown>>;
}

export interface PhysicsDebugSnapshot {
  readonly schema: number;
  readonly metadata: PhysicsDebugMetadata;
  readonly metrics: PhysicsDebugMetrics;
  readonly samples: readonly PhysicsDebugSample[];
  readonly limitations: readonly string[];
}

/** What the donor says about what this instrument cannot show. Quoted, not summarised. */
export const SNAPSHOT_LIMITATIONS = Object.freeze([
  "Scheduler ticks include match countdown ticks; consult raw state for native progress.",
  "Native contact impulses, hidden jump timers, and full-state initialization are not exposed.",
  "Live controls are sampled per scheduled tick, not reconstructed historically during catch-up.",
  "The hook is only installed when the page was loaded with ?physicsDebug=1; a capture that omits the flag has no snapshot, and that is an unverified instrument rather than a passing one.",
]);

/* -------------------------------------------------------------------------- */
/* Parsing                                                                     */
/* -------------------------------------------------------------------------- */

const num = (value: unknown, fallback = 0): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const str = (value: unknown, fallback = ""): string => (typeof value === "string" ? value : fallback);

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

/**
 * Parse the donor's snapshot defensively.
 *
 * Returns null when the shape is not recognisable, and the caller must report
 * that as `unverified` / `BLOCKED_UPSTREAM`. It NEVER returns a partial
 * snapshot dressed up as a good one: a run that read zero samples is a failed
 * instrument, and a run whose state array is the wrong length is a different
 * build's layout, not something to measure against.
 */
export function parsePhysicsSnapshot(raw: unknown): PhysicsDebugSnapshot | null {
  const root = asRecord(raw);
  if (raw === null || raw === undefined || typeof raw !== "object") return null;
  const samplesRaw = Array.isArray(root.samples) ? root.samples : null;
  if (!samplesRaw) return null;
  if (!Array.isArray(root.metrics)) {
    // `metrics` is a plain frozen object, not an array. Presence is the check.
    if (typeof root.metrics !== "object" || root.metrics === null) return null;
  }

  const samples: PhysicsDebugSample[] = [];
  for (const entry of samplesRaw) {
    const sample = asRecord(entry);
    const state = Array.isArray(sample.state) ? sample.state.map((v) => num(v, Number.NaN)) : null;
    if (!state || state.length === 0) continue;
    samples.push(Object.freeze({
      schedulerTick: num(sample.schedulerTick),
      state: Object.freeze(state),
      mode: str(sample.mode, "unknown"),
      phase: str(sample.phase, "unknown"),
      playerControls: asRecord(sample.playerControls) as Readonly<Record<string, CarControls>>,
      botControls: asRecord(sample.botControls) as Readonly<Record<string, CarControls>>,
      raw: Object.freeze({ ...sample }),
    }));
  }

  const metrics = asRecord(root.metrics);
  const metadata = asRecord(root.metadata);

  return Object.freeze({
    schema: num(root.schema, 1),
    metadata: Object.freeze({
      ...metadata,
      units: str(metadata.units, "unknown"),
      axes: str(metadata.axes, "unknown"),
      core: str(metadata.core, "unknown"),
      implementation: str(metadata.implementation, "unknown"),
      coreSha256: str(metadata.coreSha256, ""),
      parity: str(metadata.parity, ""),
      carStride: num(metadata.carStride, 0),
    }) as PhysicsDebugMetadata,
    metrics: Object.freeze({
      physicsHz: num(metrics.physicsHz),
      schedulerTick: num(metrics.schedulerTick),
      scheduledSeconds: num(metrics.scheduledSeconds),
      lastTicks: num(metrics.lastTicks),
      lastDropped: num(metrics.lastDropped),
      totalDropped: num(metrics.totalDropped),
      lastBlocked: num(metrics.lastBlocked),
      totalBlocked: num(metrics.totalBlocked),
      lastStalled: num(metrics.lastStalled),
      alpha: num(metrics.alpha),
    }),
    samples: Object.freeze(samples),
    limitations: Object.freeze(Array.isArray(root.limitations) ? root.limitations.filter((l): l is string => typeof l === "string") : [...SNAPSHOT_LIMITATIONS]),
  });
}

/* -------------------------------------------------------------------------- */
/* Derived observations                                                        */
/* -------------------------------------------------------------------------- */

const toFloat32 = (state: readonly number[]): Float32Array => Float32Array.from(state);

/** One car's readable state at one sample. Mirrors `seam.ts` `readCar`. */
export interface CarObservation {
  readonly slot: number;
  readonly pos: readonly [number, number, number];
  readonly vel: readonly [number, number, number];
  readonly planarSpeedUUps: number;
  readonly yawRateRadPerSec: number;
  readonly boost: number;
  readonly onGround: boolean;
  readonly supersonic: boolean;
  readonly doubleJumpSerial: number;
  readonly ballHitSerial: number;
}

/**
 * Read one car out of a sample. Uses the seam's own `STATE` / `CAR_STATE`
 * offsets rather than re-deriving them, so a layout change in the seam cannot
 * leave a stale copy of the numbers here.
 */
export function readCarObservation(sample: PhysicsDebugSample, slot: number): CarObservation | null {
  const state = toFloat32(sample.state);
  const count = state[STATE.NUM_CARS] | 0;
  if (slot < 0 || slot >= count) return null;
  const at = carOffset(slot);
  if (at + STATE.CAR_STRIDE > state.length) return null;
  const vx = state[at + CAR_STATE.VEL];
  const vy = state[at + CAR_STATE.VEL + 1];
  const vz = state[at + CAR_STATE.VEL + 2];
  // Yaw rate is the car-local angular velocity about its own up axis: the Y
  // component of ANG_VEL, per the baseline's 7-steering scenario note.
  const yawRate = state[at + CAR_STATE.ANG_VEL + 1];
  return Object.freeze({
    slot,
    pos: Object.freeze([state[at], state[at + 1], state[at + 2]]) as readonly [number, number, number],
    vel: Object.freeze([vx, vy, vz]) as readonly [number, number, number],
    planarSpeedUUps: Math.hypot(vx, vy),
    yawRateRadPerSec: yawRate,
    boost: state[at + CAR_STATE.BOOST],
    onGround: state[at + CAR_STATE.ON_GROUND] === 1,
    supersonic: state[at + CAR_STATE.SUPERSONIC] === 1,
    doubleJumpSerial: state[at + CAR_STATE.DOUBLE_JUMP_SERIAL],
    ballHitSerial: state[at + CAR_STATE.BALL_HIT_SERIAL],
  });
}

/** Car count straight from the state header. */
export function carCountOf(sample: PhysicsDebugSample): number {
  return sample.state[STATE.NUM_CARS] | 0;
}

/** The native sim tick (`state[0]`), NOT the scheduler tick. */
export function nativeTickOf(sample: PhysicsDebugSample): number {
  return sample.state[STATE.TICK];
}

/** Samples in the order the donor emitted them, which is oldest-first. */
export function orderedSamples(snapshot: PhysicsDebugSnapshot): readonly PhysicsDebugSample[] {
  return snapshot.samples;
}

/* -------------------------------------------------------------------------- */
/* Did the sim actually run?                                                  */
/* -------------------------------------------------------------------------- */

export type SimProgressStatus = "pass" | "fail" | "blocked-upstream";

export interface SimProgressVerdict {
  readonly status: SimProgressStatus;
  readonly summary: string;
  readonly sampleCount: number;
  /** Last minus first scheduler tick across the sample window. */
  readonly schedulerTickSpan: number;
  /** Last minus first native `state[0]` across the sample window. */
  readonly nativeTickSpan: number;
  readonly phases: readonly string[];
  readonly modes: readonly string[];
  /** The phases other than the opening one that were observed, if any. */
  readonly phasesBeyondOpening: readonly string[];
  readonly detail: string;
}

/** The phase a match sits in before the ball has been touched. */
export const OPENING_PHASES = Object.freeze(["kickoff", "countdown", "waiting", "playing"] as const);

const isOpening = (phase: string): boolean => (OPENING_PHASES as readonly string[]).includes(phase);

/**
 * Decide whether the sim actually stepped during a capture window.
 *
 * This exists because a frozen sim and a healthy sim look IDENTICAL in a
 * screenshot, and the donor's own `limitations` warn that scheduler ticks move
 * during the countdown even when the sim does not. So the verdict is built on
 * the NATIVE tick (`state[0]`) first and the scheduler tick only as corroboration:
 *
 *  - `nativeTickSpan > 0`            -> `pass`. The physics itself advanced.
 *  - no usable samples at all        -> `blocked-upstream`, the instrument never ran.
 *  - `nativeTickSpan === 0`          -> `blocked-upstream` when the match never left
 *    its opening phase, because a match that cannot start is a defect in
 *    something upstream of parity. A run genuinely parked at kickoff for a
 *    different reason (the donor HOLDS the clock at 5:00 until the ball moves —
 *    `match/session.js:70` — but the sim still steps) is distinguished by
 *    exactly this: the clock can be held while the physics runs.
 *
 * `fail` is reserved for the case that is neither of those: the sim advanced but
 * the shape is wrong, e.g. fewer than two cars in the arena.
 */
export function assessSimProgress(snapshot: PhysicsDebugSnapshot | null): SimProgressVerdict {
  if (!snapshot) {
    return Object.freeze({
      status: "blocked-upstream",
      summary: "no physics snapshot",
      sampleCount: 0,
      schedulerTickSpan: 0,
      nativeTickSpan: 0,
      phases: Object.freeze([]),
      modes: Object.freeze([]),
      phasesBeyondOpening: Object.freeze([]),
      detail:
        "window.rocketArenaPhysics was absent. The donor only installs it for ?physicsDebug=1 (app/startup.js:772), so the capture either omitted the flag or the donor never reached the point where the hook is defined.",
    });
  }

  const samples = orderedSamples(snapshot);
  if (samples.length === 0) {
    return Object.freeze({
      status: "blocked-upstream",
      summary: "snapshot carried zero samples",
      sampleCount: 0,
      schedulerTickSpan: 0,
      nativeTickSpan: 0,
      phases: Object.freeze([]),
      modes: Object.freeze([]),
      phasesBeyondOpening: Object.freeze([]),
      detail:
        "The hook exists but recorded nothing, which means clock.onTick never fired (diagnostics/physics-debug.js:6). The render loop reached the donor but the simulation did not step a single tick.",
    });
  }

  const first = samples[0];
  const last = samples[samples.length - 1];
  const schedulerTickSpan = last.schedulerTick - first.schedulerTick;
  const nativeTickSpan = nativeTickOf(last) - nativeTickOf(first);
  const phases = Object.freeze([...new Set(samples.map((s) => s.phase))]);
  const modes = Object.freeze([...new Set(samples.map((s) => s.mode))]);
  const beyond = Object.freeze(phases.filter((p) => !isOpening(p)));

  if (nativeTickSpan > 0) {
    return Object.freeze({
      status: "pass",
      summary: `native tick advanced ${nativeTickSpan} over ${samples.length} samples`,
      sampleCount: samples.length,
      schedulerTickSpan,
      nativeTickSpan,
      phases,
      modes,
      phasesBeyondOpening: beyond,
      detail: `Native state[0] went ${nativeTickOf(first)} -> ${nativeTickOf(last)}; scheduler tick went ${first.schedulerTick} -> ${last.schedulerTick}. Phases observed: ${phases.join(", ")}.`,
    });
  }

  const carCount = carCountOf(last);
  if (carCount >= 2) {
    // The sim did not step, but the arena is populated. That is a running game
    // that is not simulating, which is a real fault rather than a blocked probe.
    return Object.freeze({
      status: "fail",
      summary: `sim did not step, with ${carCount} cars loaded`,
      sampleCount: samples.length,
      schedulerTickSpan,
      nativeTickSpan: 0,
      phases,
      modes,
      phasesBeyondOpening: beyond,
      detail: `state[0] stayed at ${nativeTickOf(last)} for ${samples.length} samples while NUM_CARS was ${carCount}. The arena loaded and the render loop ran; the physics did not advance.`,
    });
  }

  return Object.freeze({
    status: "blocked-upstream",
    summary: `sim did not step; match never left ${phases.join(" / ")}`,
    sampleCount: samples.length,
    schedulerTickSpan,
    nativeTickSpan: 0,
    phases,
    modes,
    phasesBeyondOpening: beyond,
    detail: `state[0] stayed at ${nativeTickOf(last)} across ${samples.length} samples and NUM_CARS was ${carCount}. Phases observed: ${phases.join(", ")} — all opening phases, none beyond. A match that cannot leave its opening phase is a defect upstream of parity: no physics dimension can be measured until it starts. Note this is NOT the donor's benign clock hold (match/session.js:70 holds the clock, not the simulation): here the native tick itself is static.`,
  });
}
