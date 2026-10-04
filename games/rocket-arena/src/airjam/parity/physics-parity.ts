/**
 * Phase 9 — THE PHYSICS PARITY COMPARATOR (pure).
 *
 * OWNER: the Phase 9 parity worker (`src/airjam/parity/**`).
 *
 * ---------------------------------------------------------------------------
 * THE RULE
 * ---------------------------------------------------------------------------
 * A port is at physics parity when the numbers the player's hands produce are
 * the numbers the donor produced. Not "close to" — the same, to the tolerance
 * `baseline.ts` states and justifies, and with nothing measured asserted that
 * was not actually measured.
 *
 * So the comparator has exactly four possible verdicts per metric and no fifth:
 *
 *   pass                a measurement exists and is within tolerance
 *   fail                a measurement exists and is outside tolerance
 *   unverified          NO measurement was taken. Never reported as a pass.
 *   blocked-upstream    the instrument could not run, so nothing is claimed
 *
 * The `unverified` / `blocked-upstream` split is the point. A run that fails to
 * produce a number has not produced a good number, and collapsing the two would
 * make a broken build look like a clean one — which is the single most
 * expensive way for a parity harness to lie.
 *
 * ---------------------------------------------------------------------------
 * WHY MEASUREMENTS ARE A BAG, NOT A SNAPSHOT
 * ---------------------------------------------------------------------------
 * `deriveMeasurements` below turns samples into numbers, and a script can also
 * hand in numbers it measured another way. Both produce this same flat shape,
 * so the comparator has no idea where a number came from and cannot accidentally
 * trust one source over another. Every field is optional because every one of
 * them is individually unobtainable: gravity needs an airborne window, braking
 * needs a prior acceleration, and the ball test needs the ball in the lane.
 */

import { PHYSICS_BASELINE, type PhysicsMetricId } from "./baseline.js";
import {
  assessSimProgress,
  nativeTickOf,
  orderedSamples,
  readCarObservation,
  type PhysicsDebugSnapshot,
  type PhysicsDebugSample,
} from "./snapshot.js";

/* -------------------------------------------------------------------------- */
/* Measurements                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Every baseline metric a run may report. Optional per field, because a run
 * reports only what it was actually able to measure.
 */
export interface PhysicsMeasurements {
  readonly gravityUUps2?: number;
  readonly topSpeedUUps?: number;
  readonly boostedTopSpeedUUps?: number;
  readonly boostDrainUnitsPerSec?: number;
  readonly jumpPeakAboveRestUU?: number;
  readonly doubleJumpGainUU?: number;
  readonly peakBrakingUUps2?: number;
  readonly steadyYawRadPerSec?: number;
  readonly restHeightUU?: number;
  readonly bigPadBoostUnits?: number;
  readonly determinismMaxDelta?: number;
}

type MeasurementKey = {
  [K in PhysicsMetricId]: keyof PhysicsMeasurements;
};

const MEASUREMENT_KEYS: Readonly<Record<PhysicsMetricId, keyof PhysicsMeasurements>> = Object.freeze({
  gravity: "gravityUUps2",
  "top-speed": "topSpeedUUps",
  "boosted-top-speed": "boostedTopSpeedUUps",
  "boost-drain": "boostDrainUnitsPerSec",
  "jump-peak-above-rest": "jumpPeakAboveRestUU",
  "double-jump-gain": "doubleJumpGainUU",
  "peak-braking": "peakBrakingUUps2",
  "steady-yaw": "steadyYawRadPerSec",
  "rest-height": "restHeightUU",
  "big-pad-boost": "bigPadBoostUnits",
  "determinism-max-delta": "determinismMaxDelta",
} satisfies MeasurementKey);

/* -------------------------------------------------------------------------- */
/* Verdict                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * `blocked` is split from `unverified` because they call for different actions:
 * `unverified` means "nobody has done this yet", `blocked` means "somebody
 * tried and an upstream defect stopped them". Both are honest, both are not a
 * pass, and a report that conflates them hides which one is actionable.
 */
export type ParityStatus = "pass" | "fail" | "unverified" | "blocked-upstream";

export interface MetricVerdict {
  readonly id: PhysicsMetricId;
  readonly label: string;
  readonly unit: string;
  readonly status: ParityStatus;
  readonly baseline: number;
  readonly tolerance: number;
  /** null when nothing was measured. */
  readonly actual: number | null;
  /** null unless an actual was compared. */
  readonly delta: number | null;
  /** `|actual| / |baseline|`, or null when there is nothing to compare. */
  readonly relativeDelta: number | null;
  readonly why: string;
}

export interface PhysicsParityReport {
  readonly verdicts: readonly MetricVerdict[];
  readonly counts: Readonly<Record<ParityStatus, number>>;
  /** Convenience roll-up. A report with no failures is not a pass on its own. */
  readonly status: ParityStatus;
  /** True only when every metric was actually measured and every one passed. */
  readonly atParity: boolean;
  readonly simProgress: ReturnType<typeof assessSimProgress>;
  readonly notes: readonly string[];
}

const EMPTY_COUNTS: Readonly<Record<ParityStatus, number>> = Object.freeze({
  pass: 0,
  fail: 0,
  unverified: 0,
  "blocked-upstream": 0,
});

/* -------------------------------------------------------------------------- */
/* Comparison                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Compare one measurement against its baseline entry.
 *
 * `withinTolerance` is exported because a test needs to assert the boundary
 * itself, not just a value far from it: acceptance at exactly `tolerance` and
 * rejection at the next representable step above it is the behaviour that
 * matters, and it is what proves the tolerance is real rather than decorative.
 */
export function withinTolerance(actual: number, baseline: number, tolerance: number): boolean {
  if (!Number.isFinite(actual)) return false;
  if (!Number.isFinite(baseline) || !Number.isFinite(tolerance)) return false;
  return Math.abs(actual - baseline) <= tolerance;
}

/**
 * Compare a bag of measurements against the frozen baseline.
 *
 * `blocker`, when present, is the reason the measurements could not be taken —
 * the open match-start defect, typically. Every metric that has no measurement
 * is then reported `blocked-upstream` rather than `unverified`, because the
 * reason is known and it is not the reader's job to rediscover it. It is echoed
 * verbatim into `notes` so a pass/fail table on its own stays honest.
 */
export function comparePhysicsToBaseline(
  measurements: PhysicsMeasurements,
  options: { readonly blocker?: string; readonly snapshot?: PhysicsDebugSnapshot | null } = {},
): PhysicsParityReport {
  const notes: string[] = [];

  const verdicts = PHYSICS_BASELINE.map((entry): MetricVerdict => {
    const key = MEASUREMENT_KEYS[entry.id];
    const raw = measurements[key];
    const measured = typeof raw === "number" && Number.isFinite(raw);

    if (!measured) {
      return Object.freeze({
        id: entry.id,
        label: entry.label,
        unit: entry.unit,
        status: options.blocker ? ("blocked-upstream" as const) : ("unverified" as const),
        baseline: entry.value,
        tolerance: entry.tolerance,
        actual: null,
        delta: null,
        relativeDelta: null,
        why: options.blocker
          ? `Not measured. Blocked upstream: ${options.blocker}`
          : `Not measured. Baseline ${entry.value} ${entry.unit} (${entry.baselineKey}). ${entry.measuredFrom}`,
      });
    }

    const ok = withinTolerance(raw, entry.value, entry.tolerance);
    const delta = raw - entry.value;
    return Object.freeze({
      id: entry.id,
      label: entry.label,
      unit: entry.unit,
      status: ok ? ("pass" as const) : ("fail" as const),
      baseline: entry.value,
      tolerance: entry.tolerance,
      actual: raw,
      delta,
      relativeDelta: entry.value === 0 ? null : Math.abs(delta) / Math.abs(entry.value),
      why: ok
        ? `measured ${raw} vs baseline ${entry.value} ${entry.unit} (|delta| ${Math.abs(delta)}, tolerance ${entry.tolerance}, ${entry.toleranceReason})`
        : `measured ${raw} vs baseline ${entry.value} ${entry.unit}: |delta| ${Math.abs(delta)} EXCEEDS tolerance ${entry.tolerance} (${entry.toleranceReason}). This is not a rounding or placement effect.`,
    });
  });

  const counts = { ...EMPTY_COUNTS };
  for (const verdict of verdicts) counts[verdict.status] += 1;

  const simProgress = assessSimProgress(options.snapshot ?? null);
  if (simProgress.status === "blocked-upstream") notes.push(`sim progress: ${simProgress.detail}`);
  if (simProgress.status === "fail") notes.push(`sim progress FAILED: ${simProgress.detail}`);
  if (options.blocker) notes.push(`BLOCKED UPSTREAM: ${options.blocker}`);
  if (counts.unverified > 0) {
    notes.push(
      `${counts.unverified} of ${verdicts.length} baseline metrics were never measured. An unmeasured metric is not a passing metric.`,
    );
  }

  const status: ParityStatus =
    counts.fail > 0 ? "fail" : counts["blocked-upstream"] > 0 ? "blocked-upstream" : counts.unverified > 0 ? "unverified" : "pass";

  return Object.freeze({
    verdicts: Object.freeze(verdicts),
    counts: Object.freeze(counts),
    status,
    atParity: counts.fail === 0 && counts.unverified === 0 && counts["blocked-upstream"] === 0,
    simProgress,
    notes: Object.freeze(notes),
  });
}

/* -------------------------------------------------------------------------- */
/* Deriving measurements from donor samples (pure)                            */
/* -------------------------------------------------------------------------- */

/**
 * What a caller must supply for `deriveMeasurements` to work, and what it
 * cannot invent. The observed maxima are taken across whatever window the
 * samples cover; the caller is responsible for having driven the right
 * controls during that window, and `coverage` records the evidence so a report
 * can say what the window actually contained rather than implying a scenario.
 */
export interface DeriveOptions {
  /** Which car the scenario drove. Defaults to slot 0. */
  readonly slot?: number;
  /** Only airborne samples contribute to height. */
  readonly groundSlot?: number;
}

export interface DerivationCoverage {
  readonly sampleCount: number;
  readonly nativeTickSpan: number;
  /**
   * Peak planar speed seen anywhere in the window. A DIAGNOSTIC, not a metric.
   *
   * This is deliberately NOT reported as `topSpeedUUps`. The baseline's
   * 1410.06 UU/s is the plateau of SIX SECONDS OF FULL THROTTLE on a pad-free
   * lane from rest; a free-running match window contains bots, boost pads,
   * turns and ball contact, so its peak is a different quantity that happens to
   * share a name. Feeding it to the comparator marks the DONOR as failing,
   * which is exactly the confident-wrong-number failure the baseline's own
   * contamination guards warn about — the same mistake that made an early
   * donor run report 4.9 s of boost instead of 3.0 s because small pads were
   * inflating the gauge.
   */
  readonly observedPeakPlanarSpeedUUps: number;
  /** Same caveat: a peak seen while the gauge was above zero is not the
   *  2300 UU/s boosted plateau, which needs boost held from a full gauge. */
  readonly observedPeakWhileBoostingUUps: number | null;
  readonly observedMaxHeightUU: number | null;
  readonly anyAirborne: boolean;
  readonly anyBoosting: boolean;
  readonly anySupersonic: boolean;
  readonly minBoost: number | null;
  readonly maxDoubleJumpSerial: number;
  readonly maxBallHitSerial: number;
  readonly note: string;
}

export interface DerivedMeasurements {
  /**
   * Always EMPTY from an un-scripted window, and that is the correct result.
   * Every baseline metric needs a dedicated scenario with a controlled start
   * pose and controlled controls; a free match supplies none of those. This
   * function exists to prove that gap honestly rather than paper over it.
   */
  readonly measurements: PhysicsMeasurements;
  readonly coverage: DerivationCoverage;
}

/**
 * Turn a window of donor samples into measurements — and, deliberately, into
 * almost none.
 *
 * An un-scripted match window cannot isolate ANY of the eleven baseline
 * metrics: the start pose is unknown, the controls are the bots' and the
 * players', the lane crosses boost pads, and the ball is in the way. Every one
 * of those is a documented contamination risk in the baseline itself.
 *
 * So this reports the raw observations in `coverage` — clearly named as
 * observations rather than metrics — and leaves `measurements` empty. That is
 * not a limitation to be apologised for; it is the difference between a harness
 * that measures and one that flatters itself with a number it cannot defend.
 * The comparators then report every metric `unverified`, which is the truth:
 * a free match is not a physics regression suite.
 */
export function deriveMeasurements(
  snapshot: PhysicsDebugSnapshot,
  options: DeriveOptions = {},
): DerivedMeasurements {
  const slot = options.slot ?? 0;
  const samples = orderedSamples(snapshot);
  const measurements: PhysicsMeasurements = Object.freeze({});

  let maxPlanar = 0;
  let maxPlanarWhileBoosting: number | null = null;
  let maxHeight: number | null = null;
  let minBoost: number | null = null;
  let maxDoubleJump = 0;
  let maxBallHit = 0;
  let anyAirborne = false;
  let anyBoosting = false;
  let anySupersonic = false;
  let sawCar = false;

  for (const sample of samples) {
    const car = readCarObservation(sample, slot);
    if (!car) continue;
    sawCar = true;
    if (car.planarSpeedUUps > maxPlanar) maxPlanar = car.planarSpeedUUps;
    if (car.boost > 0) {
      anyBoosting = true;
      if (car.planarSpeedUUps > (maxPlanarWhileBoosting ?? -Infinity)) {
        maxPlanarWhileBoosting = car.planarSpeedUUps;
      }
    }
    if (!car.onGround) {
      anyAirborne = true;
      if (car.pos[2] > (maxHeight ?? -Infinity)) maxHeight = car.pos[2];
    }
    if (car.supersonic) anySupersonic = true;
    minBoost = minBoost === null ? car.boost : Math.min(minBoost, car.boost);
    if (car.doubleJumpSerial > maxDoubleJump) maxDoubleJump = car.doubleJumpSerial;
    if (car.ballHitSerial > maxBallHit) maxBallHit = car.ballHitSerial;
  }

  const first = samples[0];
  const last = samples[samples.length - 1];

  return Object.freeze({
    measurements,
    coverage: Object.freeze({
      sampleCount: samples.length,
      nativeTickSpan: samples.length > 1 ? nativeTickOf(last) - nativeTickOf(first) : 0,
      observedPeakPlanarSpeedUUps: maxPlanar,
      observedPeakWhileBoostingUUps: maxPlanarWhileBoosting,
      observedMaxHeightUU: maxHeight,
      anyAirborne,
      anyBoosting,
      anySupersonic,
      minBoost: sawCar ? minBoost : null,
      maxDoubleJumpSerial: maxDoubleJump,
      maxBallHitSerial: maxBallHit,
      note:
        "Observations, NOT metrics. A free match window cannot isolate any baseline value: the start pose, the controls, the lane and the ball are all uncontrolled, and the baseline documents boost-pad and lane contamination of exactly this kind. Every metric therefore stays unverified until a dedicated scripted scenario supplies it.",
    }),
  });
}

/**
 * The blocker text for the known open defect: a match that never leaves its
 * opening phase, so the sim does not step and nothing downstream can be
 * measured. Kept as data so the report and the checklist cite one string.
 */
export const MATCH_START_DEFECT = Object.freeze({
  id: "match-never-leaves-opening-phase" as const,
  summary: "The port's match does not start: the donor's sim does not step.",
  consequence:
    "state[0] stays at its opening value, so no physics baseline metric can be measured. Every measurement-dependent dimension is BLOCKED_UPSTREAM, not failing — and not passing either.",
  owner: "another worker, in flight at the time of writing; not owned by Phase 9",
  phase9Action: "Build, exercise and report the harness; do not fix the port build.",
});

/** One-line summary of a report, for logs. */
export function summarizePhysicsReport(report: PhysicsParityReport): string {
  const measured = report.verdicts.filter((v) => v.actual !== null);
  const parts = measured.map((v) => `${v.id}=${v.actual}`);
  return `${report.status}: ${report.counts.pass} pass / ${report.counts.fail} fail / ${report.counts.unverified} unverified / ${report.counts["blocked-upstream"]} blocked (${measured.length} measured${
    parts.length ? `: ${parts.join(", ")}` : ""
  })`;
}

/**
 * Metrics a free match window can NEVER supply. Listed so the gap is explicit
 * rather than discovered: every one needs a dedicated scripted scenario with a
 * controlled start pose, a pad-free lane and a controlled control sequence.
 * Until `capture.ts` gains those scenarios, the honest answer for all eleven is
 * `unverified`.
 */
export const REQUIRES_SCRIPTED_SCENARIO: readonly PhysicsMetricId[] = Object.freeze(
  PHYSICS_BASELINE.map((entry) => entry.id),
);
