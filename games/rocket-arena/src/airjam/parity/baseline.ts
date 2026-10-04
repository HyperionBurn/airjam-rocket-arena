/**
 * Phase 9 — THE AUTHORITATIVE PHYSICS BASELINE (frozen data).
 *
 * OWNER: the Phase 9 parity worker (`src/airjam/parity/**`).
 *
 * ---------------------------------------------------------------------------
 * WHY THIS FILE EXISTS AND WHY IT IS DATA, NOT A CONSTANT
 * ---------------------------------------------------------------------------
 * Every number below was measured tick-by-tick from the REAL RocketSim WASM
 * running headlessly in Node, in `_scratch/physics-baseline/harness.mjs`, and
 * written to `_scratch/physics-baseline/baseline.json`. That JSON is the
 * authority; this module is a transcription of the subset the port must match,
 * plus the tolerances that turn a measured number into an assertion.
 *
 * It lives as data in the repo (rather than being re-measured at test time)
 * because the point of Phase 9 is to catch DRIFT. A comparator that re-derives
 * its expectations from whatever the build happens to do today proves nothing.
 *
 * ---------------------------------------------------------------------------
 * HOW THE TOLERANCES ARE JUSTIFIED (and what they do NOT excuse)
 * ---------------------------------------------------------------------------
 * The sim is fixed-step at 120 Hz and bitwise deterministic, so a correct port
 * should reproduce these to the last float. The tolerances below are NOT slack
 * for "a redesign is fine". They exist only for the two measurement facts the
 * baseline itself documents:
 *
 *  1. The value is rounded in this file to the precision the baseline reports
 *     (4-7 significant digits), so a perfect run can differ from the transcription.
 *  2. A browser run cannot be placed bit-identically: `_physics_setCarState`
 *     round-trips through a Float32 heap, so the settled rest height and the
 *     starting pose can move by a float32 ULP or two, and any peak read over a
 *     real-time tick window inherits that.
 *
 * Every tolerance is therefore small enough that reaching it would require a
 * real behavioural change, and `justification` records which of the two reasons
 * it is there. `DETERMINISM_MAX_DELTA` is the one number with NO tolerance: the
 * baseline measured max absolute delta of exactly 0 across two independently
 * created WASM arenas over 720 ticks, so any non-zero value is a failure.
 */

import { CAR_STATE, STATE } from "../seam.js";

/* -------------------------------------------------------------------------- */
/* Provenance                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * SHA-256 of `public/physics/rocketsim-core.wasm`, the ORIGINAL embedded
 * gameplay core. The donor verifies this itself and throws on mismatch
 * (`ORIGINAL_GAMEPLAY_CORE_SHA256` in `app/startup.js`), so a port that
 * substitutes a different core is not a port. Verified here independently
 * rather than trusted through the donor's own check, because a comparator that
 * reads the donor's verdict cannot detect the donor being wrong.
 */
export const PHYSICS_CORE_SHA256 =
  "4d3b9c9f2c2227bc72d292fb5f294ab1f435e34b8ac8300527ee9d833a829405";

/** Where the numbers came from, for anyone auditing this file. */
export const BASELINE_PROVENANCE = Object.freeze({
  file: "_scratch/physics-baseline/baseline.json",
  harness: "_scratch/physics-baseline/harness.mjs",
  readme: "_scratch/physics-baseline/README.md",
  driver: "server/native.mjs NativeArena over the shipped public/physics/rocketsim-core.wasm",
  node: "v24.18.0",
  platform: "win32/x64",
  everyNumberIs: "sampled from a real WASM run, not fitted or hand-entered",
  determinismClaim:
    "scenario 1 run twice in two independently created WASM arenas, compared every tick across position, velocity, forward vector, angular velocity and boost gauge: max absolute delta 0, bitwise identical",
});

/* -------------------------------------------------------------------------- */
/* The metric vocabulary                                                      */
/* -------------------------------------------------------------------------- */

export type PhysicsMetricId =
  | "gravity"
  | "top-speed"
  | "boosted-top-speed"
  | "boost-drain"
  | "jump-peak-above-rest"
  | "double-jump-gain"
  | "peak-braking"
  | "steady-yaw"
  | "rest-height"
  | "big-pad-boost"
  | "determinism-max-delta";

export type PhysicsUnit =
  | "UU/s^2"
  | "UU/s"
  | "units/s"
  | "UU"
  | "rad/s"
  | "boost-units"
  | "UU/s (mixed)";

export type ToleranceReason =
  /** The baseline's own two gravity derivations already span 1.3e-3 UU/s^2. */
  | "measurement-spread"
  /** This file rounds the baseline's full precision for legibility. */
  | "transcription-rounding"
  /** float32 heap round-trip through `_physics_setCarState` at pose placement. */
  | "pose-placement-ulp"
  /** The baseline measured exactly 0. There is no tolerance and there is none needed. */
  | "exact-by-measurement";

export interface PhysicsBaselineEntry {
  readonly id: PhysicsMetricId;
  readonly label: string;
  readonly value: number;
  readonly unit: PhysicsUnit;
  /** Accepted absolute deviation. Compared as `|actual - value| <= abs`. */
  readonly tolerance: number;
  /** Every tolerance is either a rounding allowance or a float32-placement allowance. */
  readonly toleranceReason: ToleranceReason;
  /** `baseline.json` key path, so a claim can be traced to its source. */
  readonly baselineKey: string;
  /** How a run obtains this number. This is what the comparator measures. */
  readonly measuredFrom: string;
}

/**
 * Typed constructor. `Object.freeze({...})` infers `readonly { id: string }`,
 * which is NOT assignable to `readonly PhysicsBaselineEntry[]`, so an id typo
 * here would be a silent `any` at the call site rather than a compile error.
 * Routing literals through a parameterised helper makes the check real. Same
 * pattern as `confirmed()` in `harden/triage.ts`.
 */
const metric = (entry: PhysicsBaselineEntry): PhysicsBaselineEntry => Object.freeze(entry);

/**
 * The frozen baseline. Read-only by construction; there is deliberately no
 * setter and no "update the baseline" affordance, because a baseline that can be
 * edited in place stops being a baseline.
 */
export const PHYSICS_BASELINE: readonly PhysicsBaselineEntry[] = Object.freeze([
  metric({
    id: "gravity",
    label: "Gravity",
    value: 650.0001,
    unit: "UU/s^2",
    tolerance: 0.5,
    toleranceReason: "measurement-spread",
    baselineKey: "results['6-gravity'].gravityFromParabolaFit_UUps2",
    measuredFrom:
      "Least-squares parabola fit of z(t) over the airborne ticks of a standing jump, excluding the impulse tick, cross-checked against mean per-tick delta of vertical velocity. The two derivations are 650.0001 and 649.9996; the acceptance band spans both.",
  }),
  metric({
    id: "top-speed",
    label: "Top speed, throttle only",
    value: 1410.064,
    unit: "UU/s",
    tolerance: 1,
    toleranceReason: "pose-placement-ulp",
    baselineKey: "results['1-acceleration-top-speed'].peakPlanarSpeedUUps",
    measuredFrom:
      "6 s of throttle=+1 along the pad-free lane x=470, max of the planar (X,Y) speed magnitude over all 720 ticks.",
  }),
  metric({
    id: "boosted-top-speed",
    label: "Top speed while boosting",
    value: 2300,
    unit: "UU/s",
    tolerance: 1,
    toleranceReason: "pose-placement-ulp",
    baselineKey: "results['2-boosted-top-speed'].plateauPlanarSpeedUUps",
    measuredFrom:
      "throttle=+1 with boost held, same pad-free lane, median of the final 1.0 s. Identical to the raw peak, so the plateau is not an averaging artefact.",
  }),
  metric({
    id: "boost-drain",
    label: "Boost drain rate",
    value: 33.3334,
    unit: "units/s",
    tolerance: 0.05,
    toleranceReason: "transcription-rounding",
    baselineKey: "results['2-boosted-top-speed'].boostDrainRate_unitsPerSec",
    measuredFrom:
      "Gauge drop between the first and last boosting tick, divided by the elapsed sim time. A single tick's worth of drain is 0.2786 units, which is why the run-level figure and the per-tick figure differ; the run-level figure is the baseline.",
  }),
  metric({
    id: "jump-peak-above-rest",
    label: "Standing-jump peak above rest",
    value: 89.102833,
    unit: "UU",
    tolerance: 0.5,
    toleranceReason: "pose-placement-ulp",
    baselineKey: "results['4-jump'].peakHeightAboveRestUU",
    measuredFrom:
      "Max car-body-origin Z over the jump, minus that same point's settled rest height. Car body origin, NOT wheel contact, so this is larger than a wheel-to-wheel apex.",
  }),
  metric({
    id: "double-jump-gain",
    label: "Double-jump gain over a single jump",
    value: 121.934028,
    unit: "UU",
    tolerance: 0.5,
    toleranceReason: "pose-placement-ulp",
    baselineKey: "results['5-double-jump'].gainOverSingleJumpUU",
    measuredFrom:
      "Overall peak above rest for the two-press jump (211.036861) minus the single-jump peak above rest (89.102833). Derived from a difference, so it inherits both inputs' placement slop.",
  }),
  metric({
    id: "peak-braking",
    label: "Peak braking deceleration",
    value: 3499.903,
    unit: "UU/s^2",
    tolerance: 2,
    toleranceReason: "pose-placement-ulp",
    baselineKey: "results['3a-braking'].peakBrakingDecelUUps2",
    measuredFrom:
      "Max deceleration over the brake phase after 3 s of acceleration. It is a max over a tick-to-tick difference, so it is the noisiest figure in the table; the mean over the same phase is 3459.559.",
  }),
  metric({
    id: "steady-yaw",
    label: "Steady-state yaw rate",
    value: 2.3429,
    unit: "rad/s",
    tolerance: 0.01,
    toleranceReason: "transcription-rounding",
    baselineKey: "results['7-steering'].steadyStateYawRate_radPerSec",
    measuredFrom:
      "Car-local angular velocity about its own up axis, steer=+1 held with throttle=+1, median of the final 0.5 s. The raw peak over the same window is 2.34293, so the median is what the tolerance band is sized against.",
  }),
  metric({
    id: "rest-height",
    label: "Settled rest height, car body origin",
    value: 17.031987,
    unit: "UU",
    tolerance: 0.01,
    toleranceReason: "measurement-spread",
    baselineKey: "results['4-jump'].settle.restHeightUU",
    measuredFrom:
      "Z of the car body origin after 120 ticks of neutral input. The baseline reports 17.031988 in most scenarios and 17.031986 in the jump and steering scenarios; this is the midpoint of that observed spread, which exists because the car is settled at a marginally different spot each time.",
  }),
  metric({
    id: "big-pad-boost",
    label: "Boost granted by a big pad",
    value: 100,
    unit: "boost-units",
    tolerance: 0,
    toleranceReason: "exact-by-measurement",
    baselineKey: "results['9-boost-pad'].boostAddedUnits",
    measuredFrom:
      "Gauge before and after driving over big pad 0 at (-3584, 0, 73): 0 -> 100. Exactly zero tolerance: this is a discrete integer grant, so a fractional result is a bug rather than measurement noise.",
  }),
  metric({
    id: "determinism-max-delta",
    label: "Run-to-run determinism (max abs delta)",
    value: 0,
    unit: "UU/s (mixed)",
    tolerance: 0,
    toleranceReason: "exact-by-measurement",
    baselineKey: "results['10-determinism'].maxAbsDeltaPosVelFwdAngVelBoost_UUs",
    measuredFrom:
      "The same scripted run in two independently created WASM arenas, compared on every tick. The baseline measured 0. Note the scope limit the baseline itself states: scenario 1 involves no car-to-car or car-to-ball contact, so no RNG-driven demolition/respawn path is covered by this claim.",
  }),
]);

const BY_ID: ReadonlyMap<PhysicsMetricId, PhysicsBaselineEntry> = new Map(
  PHYSICS_BASELINE.map((entry) => [entry.id, entry]),
);

/** Look up one baseline entry. Throws on an unknown id: a typo must not pass silently. */
export function physicsBaseline(id: PhysicsMetricId): PhysicsBaselineEntry {
  const entry = BY_ID.get(id);
  if (!entry) throw new Error(`[rocket-arena/parity] no physics baseline for metric "${id}"`);
  return entry;
}

/* -------------------------------------------------------------------------- */
/* Engine facts the state layout must also match                               */
/* -------------------------------------------------------------------------- */

/**
 * Structural facts about the sim that a port must reproduce for the measured
 * numbers above to mean anything. These are not tolerances: they are exact,
 * because they are integers and memory offsets, not measurements.
 */
export const SIM_ENGINE_FACTS = Object.freeze({
  simHz: 120,
  dt: 1 / 120,
  stateFloats: 510,
  carStateStride: 51,
  padStateOffset: 430,
  maxCars: 8,
  controlFloatsPerCar: 8,
  totalBoostPads: 34,
  bigBoostPads: 6,
  restSpeedThresholdUUps: 0.05,
  settleTicks: 120,
  layout: Object.freeze({ ...STATE }),
  carLayout: Object.freeze({ ...CAR_STATE }),
} as const);

/** The 8 control floats per car, in the order the WASM bridge reads them. */
export const CONTROL_ORDER = Object.freeze([
  "throttle",
  "steer",
  "pitch",
  "yaw",
  "roll",
  "jump",
  "boost",
  "handbrake",
] as const);
