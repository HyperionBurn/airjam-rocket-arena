/**
 * Frame-time percentiles computed correctly from a synthetic sample, using the
 * donor's own nearest-index convention (`frame-profiler.js:97-101`).
 */
import { describe, expect, it } from "vitest";
import {
  FrameSampler,
  countDroppedFrames,
  createDonorSnapshotSource,
  createRafFrameSource,
  frameBudget,
  nearestIndex,
  percentile,
  summarize,
} from "../frame-sampler.js";

describe("percentile convention", () => {
  it("uses nearest index, not interpolation", () => {
    // The donor's formula is round(q * (n - 1)) on a sorted array
    // (frame-profiler.js:99), so p50 of 1..10 is the 6th value, not 5.5.
    expect(nearestIndex(10, 0.5)).toBe(5);
    expect(nearestIndex(10, 0.95)).toBe(9);
    expect(nearestIndex(1, 0.5)).toBe(0);
    expect(nearestIndex(2, 0)).toBe(0);
    expect(nearestIndex(2, 1)).toBe(1);
  });

  it("computes p50/p95/p99 correctly from a known synthetic sample", () => {
    const sample = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(percentile(sample, 0.5)).toBe(6);
    expect(percentile(sample, 0.95)).toBe(10);
    expect(percentile(sample, 0.99)).toBe(10);
    expect(percentile(sample, 0)).toBe(1);
    expect(percentile(sample, 1)).toBe(10);
  });

  it("does not mutate its input and handles empty input", () => {
    const sample = [5, 1, 3];
    percentile(sample, 0.5);
    expect(sample).toEqual([5, 1, 3]);
    expect(percentile([], 0.5)).toBe(0);
  });

  it("finds the true tail of a skewed sample", () => {
    // 100 healthy frames and two 200ms stalls. The mean is a lie; the tail is
    // not. With n=102, nearest-index p99 lands on index round(0.99*101) = 100,
    // which is the first stall — so p99 catches it while p95 stays clean.
    const sample = [...new Array(100).fill(10), 200, 200];
    const stats = summarize(sample, { budgetMs: 1000 / 60 });
    expect(stats.meanMs).toBeLessThan(20);
    expect(stats.p50Ms).toBe(10);
    expect(stats.p95Ms).toBe(10);
    expect(stats.p99Ms).toBe(200);
    expect(stats.worstMs).toBe(200);
  });
});

describe("summarize", () => {
  it("reports count, mean, fps and window consistently", () => {
    const sample = [10, 20, 30, 40];
    const stats = summarize(sample);
    expect(stats.count).toBe(4);
    expect(stats.meanMs).toBe(25);
    expect(stats.fps).toBe(40);
    expect(stats.windowMs).toBe(100);
  });

  it("returns an all-zero report for no samples rather than NaN", () => {
    const stats = summarize([]);
    expect(stats.count).toBe(0);
    expect(stats.fps).toBe(0);
    expect(stats.p95Ms).toBe(0);
    expect(Number.isNaN(stats.meanMs)).toBe(false);
  });
});

describe("dropped-frame inference", () => {
  it("counts missed vsync intervals, not long frames", () => {
    // budget 16.67ms: 16.67 -> 0 missed, 33.3 -> 1 missed, 50 -> 2 missed.
    expect(countDroppedFrames([16.67], 1000 / 60, 150)).toBe(0);
    expect(countDroppedFrames([33.3], 1000 / 60, 150)).toBe(1);
    expect(countDroppedFrames([50], 1000 / 60, 150)).toBe(2);
  });

  it("excludes pauses above the threshold", () => {
    // A 900ms gap is an alt-tab, not nine dropped frames.
    expect(countDroppedFrames([900], 1000 / 60, 150)).toBe(0);
  });
});

describe("FrameSampler ring", () => {
  it("keeps order and saturates at capacity", () => {
    const sampler = new FrameSampler(4);
    for (const value of [1, 2, 3, 4, 5, 6]) sampler.push(value);
    expect(sampler.count).toBe(4);
    // Oldest two were overwritten; order is preserved.
    expect(sampler.values_in_order()).toEqual([3, 4, 5, 6]);
  });

  it("rejects non-finite and non-positive intervals", () => {
    const sampler = new FrameSampler();
    expect(sampler.push(0)).toBe(false);
    expect(sampler.push(-5)).toBe(false);
    expect(sampler.push(Number.NaN)).toBe(false);
    expect(sampler.count).toBe(0);
    expect(sampler.push(16)).toBe(true);
  });

  it("rejects a nonsensical capacity", () => {
    expect(() => new FrameSampler(0)).toThrow(RangeError);
  });

  it("summarizes what it collected and clears on reset", () => {
    const sampler = new FrameSampler();
    for (let i = 0; i < 10; i += 1) sampler.push(10);
    expect(sampler.stats().p50Ms).toBe(10);
    sampler.reset();
    expect(sampler.count).toBe(0);
  });
});

describe("frame budget", () => {
  it("derives the budget from the refresh rate and caps at the donor's 120", () => {
    expect(frameBudget(60).budgetMs).toBeCloseTo(1000 / 60, 5);
    expect(frameBudget(30).budgetMs).toBeCloseTo(1000 / 30, 5);
    expect(frameBudget(500).targetFps).toBe(120);
  });

  it("falls back to 60 for nonsense input", () => {
    expect(frameBudget(0).targetFps).toBe(60);
    expect(frameBudget(Number.NaN).targetFps).toBe(60);
  });
});

describe("sources are injectable", () => {
  it("drives a rAF source from a fake window", () => {
    // A hand-rolled fake: no DOM, and the exact frame timestamps we want.
    const pending: Array<(t: number) => void> = [];
    const fake = {
      now: () => 0,
      requestAnimationFrame: (cb: (t: number) => void) => pending.push(cb),
      cancelAnimationFrame: () => {},
    };
    const seen: number[] = [];
    const source = createRafFrameSource(fake, (delta) => seen.push(delta.frameMs));
    source.start();
    // First frame only establishes the baseline.
    pending.shift()?.(0);
    expect(seen).toHaveLength(0);
    pending.shift()?.(16);
    pending.shift()?.(32);
    expect(seen).toEqual([16, 16]);
    expect(source.running).toBe(true);
    source.stop();
    expect(source.running).toBe(false);
  });

  it("adapts a donor-shaped profiler, though the port cannot reach one yet", () => {
    // startup.js:561 keeps the instance in a module-local const, so the port has
    // no way to obtain this. The adapter exists so that changes when it does.
    const reader = {
      snapshot: () => ({
        count: 60,
        frame: { avgMs: 16, p50: 16, p95: 17, p99: 18, worstMs: 20, fps: 62.5 },
        refreshHz: 60,
        budgetMs: 16.67,
        overBudgetPct: 1,
        sim: { ticksPerFrame: 2, droppedTicks: 0, clampedFrames: 0, stalls: 0 },
      }),
    };
    const source = createDonorSnapshotSource(reader, () => 1000);
    expect(source.lastDeltaMs()).toBe(16);
    expect(source.trueDeltaMs?.()).toBe(16);
  });
});
