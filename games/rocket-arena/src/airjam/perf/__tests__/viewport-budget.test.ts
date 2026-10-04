/**
 * The per-viewport budget model and the measurement bar.
 *
 * The load-bearing assertion here is `fillRatio ~= 1`: it is the arithmetic
 * behind the claim that split screen is fill-rate neutral, which is what
 * licenses the decision to keep render scale at 1.
 */
import { describe, expect, it } from "vitest";
import {
  ALLOCATED_VIEWPORT_COUNTS,
  allocateQuality,
  buildViewportBudget,
  gridRects,
  postDraws,
} from "../viewport-budget.js";
import { POST_PLAN_DEFAULTS, postPlanFor } from "../quality-ladder.js";
import {
  DEFAULT_CRITERIA,
  PROJECTOR_CRITERIA,
  MeasurementSession,
  PROVENANCE_SOFTWARE,
  evaluateFrameStats,
  runMeasurement,
} from "../harness.js";
import { summarize } from "../frame-sampler.js";
import type { QualityPreset } from "../../seam.js";

const HD = { canvasWidth: 1920, canvasHeight: 1080 } as const;

describe("viewport geometry", () => {
  it("gives ~960x540 per viewport at 4-way 1080p", () => {
    // The stated fact: quad is a 2x2 grid (viewports/layouts.ts:80), so
    // 1920/2 = 960 and 1080/2 = 540. Pixel-exact, not approximate.
    const rects = gridRects(1920, 1080, 2, 2);
    expect(rects).toHaveLength(4);
    for (const rect of rects) {
      expect(rect.width).toBe(960);
      expect(rect.height).toBe(540);
    }
    const budget = buildViewportBudget({ rects, ...HD, preset: "BALANCED" });
    expect(budget.perViewportPixels[0]).toBe(960 * 540);
  });

  it("keeps total shaded pixels constant as viewports increase (fill-neutral)", () => {
    // THE central claim of viewport-budget.ts. Each viewport shades 1/N of the
    // canvas, so N of them shade the same total as one full-canvas view.
    // Only counts that TILE the canvas exactly are listed: 1, 2, 4 and 6.
    const grids: Array<[count: number, rows: number, cols: number]> = [
      [1, 1, 1],
      [2, 1, 2],
      [4, 2, 2],
      [6, 2, 3],
    ];
    for (const [count, rows, cols] of grids) {
      const rects = gridRects(HD.canvasWidth, HD.canvasHeight, rows, cols);
      const budget = buildViewportBudget({ rects, ...HD, preset: "ULTRA" });
      expect(budget.viewportCount).toBe(count);
      expect(budget.fillRatio).toBeCloseTo(1, 2);
      expect(budget.totalViewportPixels).toBe(budget.canvasPixels);
    }
  });

  it("reports a fill ratio below 1 for a 3-way split, honestly", () => {
    // 3 players is the one count the seam lists that does NOT tile the canvas:
    // the duo-top layout is 2 rows x 2 cols with one cell empty
    // (viewports/layouts.ts:79-80), so it covers 3/4 of the buffer. The model
    // reports that rather than pretending every layout is gap-free.
    const rects = gridRects(HD.canvasWidth, HD.canvasHeight, 2, 2).slice(0, 3);
    const budget = buildViewportBudget({ rects, ...HD, preset: "ULTRA" });
    expect(budget.viewportCount).toBe(3);
    expect(budget.fillRatio).toBeCloseTo(0.75, 2);
  });

  it("reports one scene render and one post chain per viewport", () => {
    const rects = gridRects(1920, 1080, 2, 2);
    const budget = buildViewportBudget({ rects, ...HD, preset: "ULTRA" });
    expect(budget.sceneRenderPasses).toBe(4);
    expect(budget.postDrawsTotal).toBe(budget.postDrawsPerViewport * 4);
    expect(budget.postChainMultiplicity).toBe(4);
  });
});

describe("post draw counting", () => {
  it("does not count FXAA as its own pass", () => {
    // reference-post.js:140 sets uFXAA on the same postFragment material that
    // always runs, so it adds ALU rather than a draw.
    const withFxaa = postDraws(postPlanFor("high", POST_PLAN_DEFAULTS));
    const withoutFxaa = postDraws(postPlanFor("balanced", POST_PLAN_DEFAULTS));
    expect(withFxaa.length).toBeGreaterThan(withoutFxaa.length);
    // The difference is the SSAO chain (1 pass + 2 blurs) and the bloom
    // denoise — not an extra "fxaa" draw.
    expect(withFxaa.some((draw) => draw.pass === "fxaa")).toBe(false);
    expect(withFxaa.some((draw) => draw.pass === "postFragment")).toBe(true);
  });

  it("counts the donor's 7-tap SSAO at half resolution", () => {
    const draws = postDraws(postPlanFor("high", POST_PLAN_DEFAULTS));
    const ao = draws.find((draw) => draw.pass === "makeupAO");
    expect(ao).toBeDefined();
    expect(ao?.taps).toBe(7);
    expect(ao?.divisor).toBe(2);
    // Two blurs, not one (reference-post.js:117).
    expect(draws.filter((draw) => draw.pass.startsWith("aoBlur"))).toHaveLength(2);
  });

  it("scales the SSAO tap count with the viewport count", () => {
    const one = buildViewportBudget({ rects: gridRects(1920, 1080, 1, 1), ...HD, preset: "ULTRA" });
    const four = buildViewportBudget({ rects: gridRects(1920, 1080, 2, 2), ...HD, preset: "ULTRA" });
    expect(four.aoTapsTotal).toBe(one.aoTapsTotal * 4);
  });

  it("reports no SSAO at all for the tiers that disable it", () => {
    const budget = buildViewportBudget({ rects: gridRects(1920, 1080, 2, 2), ...HD, preset: "BALANCED" });
    expect(budget.aoTapsTotal).toBe(0);
  });
});

describe("quality allocation across N viewports", () => {
  it("produces a concrete entry for every count the seam lists", () => {
    const baselines: Record<number, QualityPreset> = {
      1: "ULTRA",
      2: "HIGH",
      3: "HIGH",
      4: "BALANCED",
      6: "PERFORMANCE",
    };
    for (const count of ALLOCATED_VIEWPORT_COUNTS) {
      const allocation = allocateQuality(count, 1920, 1080, baselines[count]);
      expect(allocation.viewportCount).toBe(count);
      expect(allocation.preset).toBe(baselines[count]);
      expect(allocation.postDrawsTotal).toBeGreaterThan(0);
      expect(allocation.rationale).toContain("post chain");
    }
  });

  it("shows 6-way drawing more post work than 1-way, at equal fill", () => {
    const solo = allocateQuality(1, 1920, 1080, "ULTRA");
    const six = allocateQuality(6, 1920, 1080, "ULTRA");
    expect(six.postDrawsTotal).toBe(solo.postDrawsTotal * 6);
  });
});

describe("the measurement bar", () => {
  const healthy = summarize(new Array(600).fill(16.0), { budgetMs: 1000 / 60 });

  it("passes a clean run", () => {
    const verdict = evaluateFrameStats(healthy, PROJECTOR_CRITERIA);
    expect(verdict.pass).toBe(true);
    expect(verdict.failures).toEqual([]);
  });

  it("fails a run with a visible stall, even if the mean looks fine", () => {
    // 599 good frames and one 90ms hitch: the average is still ~16.6ms, which
    // is exactly the failure a mean-based bar would miss on a projector.
    const stats = summarize([...new Array(599).fill(16.0), 90], { budgetMs: 1000 / 60 });
    expect(stats.meanMs).toBeLessThan(1000 / 60);
    const verdict = evaluateFrameStats(stats, PROJECTOR_CRITERIA);
    expect(verdict.pass).toBe(false);
    expect(verdict.failures.join(" ")).toContain("visible stall");
  });

  it("fails an empty run loudly rather than passing vacuously", () => {
    const verdict = evaluateFrameStats(summarize([]), DEFAULT_CRITERIA);
    expect(verdict.pass).toBe(false);
    expect(verdict.failures.join(" ")).toContain("no samples");
  });

  it("is stricter for a projector than the default bar", () => {
    expect(PROJECTOR_CRITERIA.p95BudgetMultiplier).toBeLessThan(
      DEFAULT_CRITERIA.p95BudgetMultiplier,
    );
  });
});

describe("measurement session", () => {
  it("accumulates a run and reports it with provenance", () => {
    const session = new MeasurementSession({
      preset: "BALANCED",
      viewportCount: 4,
      targetFps: 60,
      durationMs: 30_000,
      scenario: "synthetic",
    });
    session.start(0);
    let at = 0;
    while (!session.isComplete()) {
      at += 16;
      session.feed(at, 16);
    }
    const report = session.report(PROVENANCE_SOFTWARE);
    expect(report.stats.count).toBeGreaterThan(1800);
    expect(report.verdict.pass).toBe(true);
    // A software-rendering number must never escape without its label.
    expect(report.provenance).toBe(PROVENANCE_SOFTWARE);
    expect(report.provenance).toContain("SOFTWARE");
  });

  it("refuses to feed before it is started", () => {
    const session = new MeasurementSession({
      preset: "HIGH",
      viewportCount: 1,
      targetFps: 60,
      durationMs: 1000,
      scenario: "synthetic",
    });
    expect(session.feed(16, 16)).toBe(false);
  });
});

describe("runMeasurement", () => {
  it("drives an injected pump to completion", async () => {
    // A fake pump: no DOM, deterministic timestamps, so the test is exact.
    let now = 0;
    const queue: Array<() => void> = [];
    const pump = {
      now: () => now,
      requestFrame: (cb: () => void) => queue.push(cb),
      cancelFrame: () => {},
    };
    const promise = runMeasurement(pump, {
      preset: "ULTRA",
      viewportCount: 1,
      targetFps: 60,
      durationMs: 200,
      scenario: "fake-pump",
    });
    // Drain the queue, advancing the clock one 16ms frame at a time.
    for (let i = 0; i < 100 && queue.length > 0; i += 1) {
      now += 16;
      const cb = queue.shift();
      cb?.();
    }
    const report = await promise;
    expect(report.stats.count).toBeGreaterThan(0);
    expect(report.request.scenario).toBe("fake-pump");
  });
});
