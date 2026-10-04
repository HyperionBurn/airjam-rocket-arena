import { describe, expect, it } from "vitest";

import {
  PARITY_AREAS,
  PARITY_CHECKLIST,
  blockingDimensions,
  dimensionsInArea,
  parityDimension,
  summarizeParity,
  validateChecklist,
  type DimensionResult,
} from "../checklist.js";

/**
 * The checklist is the deliverable a human asks "what is left to prove" about,
 * so its own integrity is the thing under test. A checklist that is empty, or
 * that contains a dimension with no id, no area, no verification method or no
 * blocking flag, under-reports silently: the run would look complete while
 * proving nothing.
 */
describe("PARITY_CHECKLIST — structure", () => {
  it("is not empty and is large enough to cover the port's surface", () => {
    expect(PARITY_CHECKLIST.length).toBeGreaterThan(0);
    // Floor, not a target: a port with 183 donor files, 11 frozen physics
    // metrics and 7 public asset trees should not be describable in ten lines.
    expect(PARITY_CHECKLIST.length).toBeGreaterThanOrEqual(30);
  });

  it("passes its own structural self-check", () => {
    expect(validateChecklist()).toEqual([]);
  });

  it("gives every dimension an id, an area, a verification method and a blocking flag", () => {
    for (const dimension of PARITY_CHECKLIST) {
      expect(typeof dimension.id, `id of ${dimension.id}`).toBe("string");
      expect(dimension.id.length, `id length of ${dimension.id}`).toBeGreaterThan(0);
      expect(PARITY_AREAS, `area of ${dimension.id}`).toContain(dimension.area);
      expect(dimension.verification, `verification of ${dimension.id}`).toBeTruthy();
      expect(typeof dimension.verification.kind, `verification kind of ${dimension.id}`).toBe("string");
      expect(
        typeof dimension.blocking,
        `blocking flag of ${dimension.id} must be an actual boolean, not undefined`,
      ).toBe("boolean");
    }
  });

  it("has no duplicate ids", () => {
    const ids = PARITY_CHECKLIST.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("states what parity MEANS concretely for every dimension, not just a title", () => {
    for (const dimension of PARITY_CHECKLIST) {
      // A long enough `means` that it had to be written, not filled in.
      expect(dimension.means.length, `means of ${dimension.id}`).toBeGreaterThan(40);
      expect(dimension.means, `means of ${dimension.id}`).not.toMatch(/^(TODO|TBD|FIXME)/i);
    }
  });

  it("covers every area, and each area has at least one dimension", () => {
    for (const area of PARITY_AREAS) {
      expect(dimensionsInArea(area).length, `area ${area}`).toBeGreaterThan(0);
    }
  });

  it("marks the load-bearing dimensions blocking", () => {
    const blocking = new Set(blockingDimensions().map((d) => d.id));
    // If any of these stop being true, the port is not the donor's game.
    for (const id of [
      "physics-core-binary",
      "physics-arena-collision-meshes",
      "physics-sim-steps",
      "physics-gravity",
      "physics-top-speed",
      "physics-determinism",
      "visual-donor-bytes-unmodified",
      "match-leaves-opening-phase",
      "controls-phone-drives-car",
    ]) {
      expect(blocking.has(id), `${id} must be blocking`).toBe(true);
    }
  });

  it("never marks a cosmetic dimension blocking", () => {
    const blocking = new Set(blockingDimensions().map((d) => d.id));
    // These are real parity concerns, but a difference in them is a difference
    // a human should see, not one that means the port is a different game.
    for (const id of ["audio-autoplay-and-settings", "visual-fonts", "ui-icons"]) {
      expect(blocking.has(id), `${id} should not be blocking`).toBe(false);
    }
  });
});

describe("PARITY_CHECKLIST — lookups", () => {
  it("finds a dimension by id and returns undefined for an unknown one", () => {
    expect(parityDimension("physics-gravity")?.area).toBe("physics");
    expect(parityDimension("nope-not-a-dimension")).toBeUndefined();
  });

  it("routes every physics-baseline dimension at real frozen metrics", () => {
    const withMetrics = PARITY_CHECKLIST.filter(
      (d) => d.verification.kind === "physics-baseline",
    );
    expect(withMetrics.length).toBeGreaterThan(0);
    for (const dimension of withMetrics) {
      const verification = dimension.verification as { kind: "physics-baseline"; metrics: readonly string[] };
      expect(verification.metrics.length, `${dimension.id} names no metric`).toBeGreaterThan(0);
    }
  });
});

describe("summarizeParity — the only place a status comes from", () => {
  it("defaults every dimension to unverified when no results are supplied", () => {
    const summary = summarizeParity([]);
    expect(summary.total).toBe(PARITY_CHECKLIST.length);
    expect(summary.byStatus.unverified).toBe(PARITY_CHECKLIST.length);
    expect(summary.byStatus.pass).toBe(0);
    expect(summary.byStatus.fail).toBe(0);
    expect(summary.questions.length).toBe(PARITY_CHECKLIST.length);
  });

  it("never reports a dimension as passing without a result", () => {
    const one: DimensionResult[] = [{ dimensionId: "physics-gravity", status: "pass", evidence: "measured" }];
    const summary = summarizeParity(one);
    expect(summary.byStatus.pass).toBe(1);
    expect(summary.byStatus.unverified).toBe(PARITY_CHECKLIST.length - 1);
  });

  it("distinguishes blocked-upstream from unverified from fail", () => {
    const results: DimensionResult[] = [
      { dimensionId: "physics-gravity", status: "pass" },
      { dimensionId: "physics-top-speed", status: "blocked-upstream" },
      { dimensionId: "physics-boost-drain", status: "fail" },
    ];
    const summary = summarizeParity(results);
    expect(summary.byStatus).toEqual({
      pass: 1,
      fail: 1,
      unverified: PARITY_CHECKLIST.length - 3,
      "blocked-upstream": 1,
    });
  });

  it("blocks the release only on a BLOCKING failure", () => {
    const nonBlockingFail: DimensionResult[] = [
      { dimensionId: "audio-autoplay-and-settings", status: "fail" },
    ];
    expect(summarizeParity(nonBlockingFail).releaseBlocked).toBe(false);

    const blockingFail: DimensionResult[] = [
      { dimensionId: "physics-core-binary", status: "fail" },
    ];
    const blocked = summarizeParity(blockingFail);
    expect(blocked.releaseBlocked).toBe(true);
    expect(blocked.blockingFailures).toEqual(["physics-core-binary"]);
  });

  it("does NOT release-block on a blocked-upstream blocking dimension", () => {
    // A run that could not reach a dimension has not thereby proven it broken.
    const summary = summarizeParity([{ dimensionId: "physics-sim-steps", status: "blocked-upstream" }]);
    expect(summary.releaseBlocked).toBe(false);
    expect(summary.blockingBlocked).toEqual(["physics-sim-steps"]);
    expect(summary.questions).toContain("physics-sim-steps");
  });

  it("lists the still-unproven dimensions so the summary answers its own question", () => {
    const summary = summarizeParity([{ dimensionId: "physics-gravity", status: "pass" }]);
    expect(summary.questions).not.toContain("physics-gravity");
    expect(summary.questions).toContain("match-leaves-opening-phase");
  });

  it("breaks the roll-up down by area with the same totals", () => {
    const summary = summarizeParity([]);
    const summed = summary.byArea.reduce((total, area) => total + area.total, 0);
    expect(summed).toBe(summary.total);
    for (const area of summary.byArea) {
      expect(area.total).toBe(dimensionsInArea(area.area).length);
      expect(area.pass + area.fail + area.blocked + area.unverified).toBe(area.total);
    }
  });
});
