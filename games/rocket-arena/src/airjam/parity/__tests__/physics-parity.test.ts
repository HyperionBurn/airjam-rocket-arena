import { describe, expect, it } from "vitest";

import {
  PHYSICS_BASELINE,
  PHYSICS_CORE_SHA256,
  SIM_ENGINE_FACTS,
  physicsBaseline,
} from "../baseline.js";
import {
  MATCH_START_DEFECT,
  REQUIRES_SCRIPTED_SCENARIO,
  comparePhysicsToBaseline,
  deriveMeasurements,
  summarizePhysicsReport,
  withinTolerance,
  type PhysicsMeasurements,
} from "../physics-parity.js";
import { parsePhysicsSnapshot } from "../snapshot.js";

/** Every metric, reported at exactly its baseline value. */
const allAtBaseline: PhysicsMeasurements = Object.freeze(
  Object.fromEntries(
    PHYSICS_BASELINE.map((entry) => [
      {
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
      }[entry.id],
      entry.value,
    ]),
  ) as PhysicsMeasurements,
);

describe("PHYSICS_BASELINE — the frozen reference itself", () => {
  it("carries the nine headline numbers the brief fixes as authoritative", () => {
    // These are the values the whole port is measured against. If any of them
    // moves, the baseline moved, and a moving baseline proves nothing.
    expect(physicsBaseline("gravity").value).toBeCloseTo(650.0, 3);
    expect(physicsBaseline("top-speed").value).toBeCloseTo(1410.06, 2);
    expect(physicsBaseline("boosted-top-speed").value).toBeCloseTo(2300, 3);
    expect(physicsBaseline("boost-drain").value).toBeCloseTo(33.3334, 4);
    expect(physicsBaseline("jump-peak-above-rest").value).toBeCloseTo(89.1, 1);
    expect(physicsBaseline("double-jump-gain").value).toBeCloseTo(121.93, 2);
    expect(physicsBaseline("peak-braking").value).toBeCloseTo(3499.9, 1);
    expect(physicsBaseline("steady-yaw").value).toBeCloseTo(2.3429, 4);
  });

  it("holds determinism at exactly zero, with zero tolerance", () => {
    const determinism = physicsBaseline("determinism-max-delta");
    expect(determinism.value).toBe(0);
    expect(determinism.tolerance).toBe(0);
    expect(determinism.toleranceReason).toBe("exact-by-measurement");
  });

  it("records the core WASM hash the donor itself enforces", () => {
    expect(PHYSICS_CORE_SHA256).toBe(
      "4d3b9c9f2c2227bc72d292fb5f294ab1f435e34b8ac8300527ee9d833a829405",
    );
  });

  it("states the engine facts every measurement depends on", () => {
    expect(SIM_ENGINE_FACTS.simHz).toBe(120);
    expect(SIM_ENGINE_FACTS.stateFloats).toBe(510);
    expect(SIM_ENGINE_FACTS.carStateStride).toBe(51);
    expect(SIM_ENGINE_FACTS.padStateOffset).toBe(430);
    expect(SIM_ENGINE_FACTS.totalBoostPads).toBe(34);
    expect(SIM_ENGINE_FACTS.bigBoostPads).toBe(6);
  });

  it("gives every metric a source key and a way to measure it", () => {
    for (const entry of PHYSICS_BASELINE) {
      expect(entry.baselineKey.length, `${entry.id} source`).toBeGreaterThan(3);
      expect(entry.measuredFrom.length, `${entry.id} method`).toBeGreaterThan(20);
      expect(entry.tolerance).toBeGreaterThanOrEqual(0);
    }
  });

  it("throws on an unknown metric rather than returning undefined", () => {
    // A typo must not silently produce a report with a hole in it.
    expect(() => physicsBaseline("not-a-metric" as never)).toThrow(/no physics baseline/);
  });
});

describe("withinTolerance — the boundary, not just a value far from it", () => {
  it("accepts a value exactly at the tolerance and rejects just past it", () => {
    const baseline = 650.0001;
    const tolerance = 0.5;
    expect(withinTolerance(baseline + tolerance, baseline, tolerance)).toBe(true);
    expect(withinTolerance(baseline + tolerance + 0.001, baseline, tolerance)).toBe(false);
  });

  it("rejects a non-finite measurement instead of letting it compare", () => {
    // NaN is the dangerous case: every comparison against it is false, so a
    // comparator that did not guard would report it as a drift of undefined
    // rather than as a measurement that never happened.
    expect(withinTolerance(Number.NaN, 650, 0.5)).toBe(false);
    expect(withinTolerance(Number.POSITIVE_INFINITY, 650, 0.5)).toBe(false);
    expect(withinTolerance(650, Number.NaN, 0.5)).toBe(false);
  });
});

describe("comparePhysicsToBaseline — ACCEPTS values equal to the baseline", () => {
  it("passes every metric when every metric is reported at its baseline value", () => {
    const report = comparePhysicsToBaseline(allAtBaseline);
    expect(report.counts.fail).toBe(0);
    expect(report.counts.pass).toBe(PHYSICS_BASELINE.length);
    expect(report.status).toBe("pass");
    expect(report.atParity).toBe(true);
    for (const verdict of report.verdicts) {
      expect(verdict.actual, verdict.id).not.toBeNull();
      expect(verdict.delta, verdict.id).toBe(0);
    }
  });

  it("accepts a value exactly at the edge of its tolerance", () => {
    const report = comparePhysicsToBaseline({ ...allAtBaseline, gravityUUps2: 650.0 + 0.5 });
    const gravity = report.verdicts.find((v) => v.id === "gravity");
    expect(gravity?.status).toBe("pass");
  });
});

describe("comparePhysicsToBaseline — REJECTS drift outside the stated tolerance", () => {
  it("fails a metric whose measurement is outside tolerance", () => {
    const report = comparePhysicsToBaseline({ ...allAtBaseline, topSpeedUUps: 1500 });
    const topSpeed = report.verdicts.find((v) => v.id === "top-speed");
    expect(topSpeed?.status).toBe("fail");
    expect(topSpeed?.baseline).toBeCloseTo(1410.064, 3);
    expect(topSpeed?.delta).toBeCloseTo(1500 - 1410.064, 3);
    expect(report.status).toBe("fail");
    expect(report.atParity).toBe(false);
  });

  it("rejects a 1 % top-speed error even though it is small in absolute terms", () => {
    // 1410 UU/s with a 1 UU/s tolerance: 14 UU/s of drift is a real change,
    // not a rounding effect, and must not be waved through.
    const report = comparePhysicsToBaseline({ ...allAtBaseline, topSpeedUUps: 1410.064 + 14 });
    expect(report.verdicts.find((v) => v.id === "top-speed")?.status).toBe("fail");
  });

  it("rejects ANY non-zero determinism delta, with no tolerance to hide behind", () => {
    const report = comparePhysicsToBaseline({ ...allAtBaseline, determinismMaxDelta: 1e-9 });
    const determinism = report.verdicts.find((v) => v.id === "determinism-max-delta");
    expect(determinism?.status).toBe("fail");
    expect(determinism?.tolerance).toBe(0);
  });

  it("fails a fractional big-pad grant, which is an integer by definition", () => {
    const report = comparePhysicsToBaseline({ ...allAtBaseline, bigPadBoostUnits: 99.5 });
    expect(report.verdicts.find((v) => v.id === "big-pad-boost")?.status).toBe("fail");
  });

  it("reports the relative delta so a reader can see how big the drift was", () => {
    const report = comparePhysicsToBaseline({ ...allAtBaseline, steadyYawRadPerSec: 2.5 });
    const yaw = report.verdicts.find((v) => v.id === "steady-yaw");
    expect(yaw?.status).toBe("fail");
    expect(yaw?.relativeDelta).toBeCloseTo(Math.abs(2.5 - 2.3429) / 2.3429, 6);
  });
});

describe("comparePhysicsToBaseline — refuses to pass what was never measured", () => {
  it("reports a missing measurement as unverified, never as a pass", () => {
    const report = comparePhysicsToBaseline({ topSpeedUUps: 1410.064 });
    expect(report.verdicts.find((v) => v.id === "gravity")?.status).toBe("unverified");
    expect(report.verdicts.find((v) => v.id === "top-speed")?.status).toBe("pass");
    expect(report.atParity).toBe(false);
    expect(report.status).toBe("unverified");
  });

  it("reports missing measurements as blocked-upstream when a blocker is named", () => {
    const report = comparePhysicsToBaseline({}, { blocker: MATCH_START_DEFECT.summary });
    expect(report.verdicts.every((v) => v.status === "blocked-upstream")).toBe(true);
    expect(report.atParity).toBe(false);
    expect(report.status).toBe("blocked-upstream");
    expect(report.notes.join(" ")).toContain("BLOCKED UPSTREAM");
  });

  it("treats a non-finite measurement as absent rather than as a value", () => {
    const report = comparePhysicsToBaseline({ gravityUUps2: Number.NaN });
    expect(report.verdicts.find((v) => v.id === "gravity")?.status).toBe("unverified");
  });

  it("says out loud that unmeasured metrics are not passing metrics", () => {
    const report = comparePhysicsToBaseline({});
    expect(report.notes.join(" ")).toMatch(/unmeasured metric is not a passing metric/);
  });

  it("summarises a run in one honest line", () => {
    const report = comparePhysicsToBaseline({ topSpeedUUps: 1500 });
    expect(summarizePhysicsReport(report)).toMatch(/^fail: 0 pass \/ 1 fail \/ 10 unverified/);
  });
});

describe("deriveMeasurements — claims NOTHING a free match cannot isolate", () => {
  const snapshotOf = (samples: readonly unknown[]): ReturnType<typeof parsePhysicsSnapshot> =>
    parsePhysicsSnapshot({
      schema: 1,
      metadata: { carStride: 51 },
      metrics: { physicsHz: 120, schedulerTick: 3 },
      samples,
      limitations: [],
    });

  /** A 510-float state block with NUM_CARS=2 and a moving car in slot 0. */
  const stateWith = (options: {
    readonly tick: number;
    readonly x: number;
    readonly y: number;
    readonly z?: number;
    readonly boost?: number;
    readonly onGround?: boolean;
  }): number[] => {
    const state = new Array<number>(510).fill(0);
    state[0] = options.tick;
    state[2] = 2;
    const car = 22;
    state[car + 0] = options.x;
    state[car + 1] = options.y;
    state[car + 2] = options.z ?? 17.031987;
    state[car + 12] = options.x === 0 ? 0 : options.x;
    state[car + 18] = options.boost ?? 100;
    state[car + 19] = options.onGround === false ? 0 : 1;
    return state;
  };

  const windowOf = () =>
    snapshotOf([
      { schedulerTick: 1, state: stateWith({ tick: 1, x: 0, y: 0 }), mode: "match", phase: "playing" },
      { schedulerTick: 2, state: stateWith({ tick: 2, x: 1000, y: 0 }), mode: "match", phase: "playing" },
      { schedulerTick: 3, state: stateWith({ tick: 3, x: 300, y: 400 }), mode: "match", phase: "playing" },
    ])!;

  it("reports the peak planar speed as an OBSERVATION, not as the top-speed metric", () => {
    const derived = deriveMeasurements(windowOf());
    // Sample 2 is 1000 UU/s, sample 3 is hypot(300,400) = 500.
    expect(derived.coverage.observedPeakPlanarSpeedUUps).toBeCloseTo(1000, 3);
    expect(derived.coverage.nativeTickSpan).toBe(2);
    expect(derived.coverage.sampleCount).toBe(3);
  });

  it("claims NO baseline metric from an un-scripted window", () => {
    // This is the regression guard for the bug this module was written to avoid:
    // a free match's peak speed is a DIFFERENT quantity from the baseline's
    // six-seconds-of-throttle plateau, and feeding it to the comparator marks
    // the DONOR as failing its own baseline.
    const derived = deriveMeasurements(windowOf());
    expect(Object.keys(derived.measurements)).toEqual([]);
    for (const id of REQUIRES_SCRIPTED_SCENARIO) {
      expect(derived.measurements[id as never], id).toBeUndefined();
    }
  });

  it("leaves every metric unverified in the comparator, donor included", () => {
    const report = comparePhysicsToBaseline(deriveMeasurements(windowOf()).measurements);
    expect(report.counts.pass).toBe(0);
    expect(report.counts.fail).toBe(0);
    expect(report.counts.unverified).toBe(PHYSICS_BASELINE.length);
    expect(report.atParity).toBe(false);
  });

  it("never lets a free-match peak mark the donor as failing", () => {
    // The donor is correct by definition. If a window observation could fail
    // the donor's own baseline, the comparator is measuring the wrong thing.
    const derived = deriveMeasurements(windowOf());
    expect(derived.coverage.observedPeakPlanarSpeedUUps).toBeLessThan(
      physicsBaseline("top-speed").value,
    );
    const report = comparePhysicsToBaseline(derived.measurements);
    expect(report.verdicts.find((v) => v.id === "top-speed")?.status).toBe("unverified");
  });

  it("records the window's coverage so a reader can see what it contained", () => {
    const derived = deriveMeasurements(windowOf());
    expect(derived.coverage.anyAirborne).toBe(false);
    expect(derived.coverage.minBoost).toBe(100);
    expect(derived.coverage.note).toMatch(/Observations, NOT metrics/);
  });
});

describe("comparePhysicsToBaseline — with a real donor-shaped snapshot", () => {
  const healthy = () =>
    parsePhysicsSnapshot({
      schema: 1,
      metadata: { units: "uu", axes: "native", core: "original", implementation: "original embedded core", coreSha256: PHYSICS_CORE_SHA256, parity: "no claim", carStride: 51 },
      metrics: { physicsHz: 120, schedulerTick: 400, scheduledSeconds: 3.33, totalDropped: 0 },
      samples: [
        { schedulerTick: 399, state: buildState(399, 10), mode: "match", phase: "playing" },
        { schedulerTick: 400, state: buildState(400, 20), mode: "match", phase: "playing" },
      ],
      limitations: [],
    });

  function buildState(tick: number, x: number): number[] {
    const state = new Array<number>(510).fill(0);
    state[0] = tick;
    state[2] = 2;
    state[22] = x;
    state[22 + 12] = 0;
    state[22 + 13] = 1410;
    state[22 + 18] = 100;
    state[22 + 19] = 1;
    return state;
  }

  it("reports the sim as stepping when the native tick advanced", () => {
    const report = comparePhysicsToBaseline({}, { snapshot: healthy() });
    expect(report.simProgress.status).toBe("pass");
    expect(report.simProgress.nativeTickSpan).toBe(1);
  });

  it("observes a top speed from the snapshot WITHOUT comparing it to the baseline", () => {
    const snapshot = healthy()!;
    const derived = deriveMeasurements(snapshot);
    // hypot(0, 1410) = 1410, which happens to sit inside the band — but that is
    // a coincidence of the fixture, not a claim. Nothing is compared.
    expect(derived.coverage.observedPeakPlanarSpeedUUps).toBeCloseTo(1410, 3);
    const report = comparePhysicsToBaseline(derived.measurements, { snapshot });
    expect(report.verdicts.find((v) => v.id === "top-speed")?.status).toBe("unverified");
    expect(report.counts.fail).toBe(0);
  });
});
