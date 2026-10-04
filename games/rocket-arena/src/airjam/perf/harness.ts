/**
 * Phase 10 — MEASUREMENT HARNESS.
 *
 * OWNER: the Phase 10 worker (`src/airjam/perf/**`).
 *
 * WHAT THIS IS FOR
 * ----------------
 * There is NO GPU in the build environment, so this repository cannot produce a
 * single real frame-time number. The deliverable is therefore the INSTRUMENT and
 * the BAR: a harness that turns a real run into a verdict, plus the procedure a
 * human follows on real hardware. See PROFILING.md.
 *
 * The pass/fail numbers below are POLICY TARGETS chosen for a live projector.
 * They are not measurements and are not presented as such. What is measured is
 * whatever the human's run reports; the bar is what it gets compared against.
 *
 * Everything is injected — clock, scheduler, source — so the whole harness is
 * testable in node and nothing here is browser-bound.
 */

import { type QualityPreset } from "../seam.js";
import { FrameSampler, frameBudget, summarize, type FrameStats, type SummarizeOptions } from "./frame-sampler.js";

/* -------------------------------------------------------------------------- */
/* The bar                                                                     */
/* -------------------------------------------------------------------------- */

export interface MeasurementCriteria {
  readonly targetFps: number;
  /** p95 frame time must stay within this multiple of the budget. */
  readonly p95BudgetMultiplier: number;
  /** Fraction of frames allowed to miss a vsync across the window. */
  readonly maxLateFrameShare: number;
  /** A single frame above this multiple of budget is a visible stall. */
  readonly maxSingleFrameBudgetMultiplier: number;
}

export const DEFAULT_CRITERIA: MeasurementCriteria = Object.freeze({
  targetFps: 60,
  p95BudgetMultiplier: 1.1,
  maxLateFrameShare: 0.01,
  maxSingleFrameBudgetMultiplier: 3,
});

/** A criteria set for a projector-grade run. Stricter than `DEFAULT_CRITERIA`. */
export const PROJECTOR_CRITERIA: MeasurementCriteria = Object.freeze({
  targetFps: 60,
  p95BudgetMultiplier: 1.0,
  maxLateFrameShare: 0.005,
  maxSingleFrameBudgetMultiplier: 2,
});

export interface Verdict {
  readonly pass: boolean;
  /** Empty when passing. Each entry is a measured number and its limit. */
  readonly failures: readonly string[];
  readonly measured: {
    readonly p95Ms: number;
    readonly p99Ms: number;
    readonly worstMs: number;
    readonly fps: number;
    readonly lateFrameShare: number;
    readonly budgetMs: number;
  };
}

/**
 * Pure: judge a stats window against the bar.
 *
 * p95 rather than mean, because a mean hides exactly the failure that matters
 * here — an occasional long frame. On a projector a 50 ms frame is a visible
 * hitch, and a run can average 16.7 ms while still hitching.
 */
export function evaluateFrameStats(
  stats: FrameStats,
  criteria: MeasurementCriteria = DEFAULT_CRITERIA,
): Verdict {
  const budget = frameBudget(criteria.targetFps);
  const lateFrameShare = stats.count > 0 ? Math.max(0, (stats.p95Ms / budget.budgetMs) - 1) : 0;
  const failures: string[] = [];

  const p95Limit = budget.budgetMs * criteria.p95BudgetMultiplier;
  if (stats.count > 0 && stats.p95Ms > p95Limit) {
    failures.push(
      `p95 ${stats.p95Ms.toFixed(2)}ms exceeds ${criteria.p95BudgetMultiplier}x budget (${p95Limit.toFixed(2)}ms)`,
    );
  }
  if (stats.count > 0 && stats.worstMs > budget.budgetMs * criteria.maxSingleFrameBudgetMultiplier) {
    failures.push(
      `worst frame ${stats.worstMs.toFixed(2)}ms exceeds ${criteria.maxSingleFrameBudgetMultiplier}x budget (${(budget.budgetMs * criteria.maxSingleFrameBudgetMultiplier).toFixed(2)}ms) — a visible stall`,
    );
  }
  if (stats.count > 0 && lateFrameShare > criteria.maxLateFrameShare) {
    failures.push(
      `frames over budget ${(lateFrameShare * 100).toFixed(2)}% exceeds ${(criteria.maxLateFrameShare * 100).toFixed(2)}%`,
    );
  }
  if (stats.count < 1) {
    failures.push("no samples were collected — the run did not measure anything");
  }

  return {
    pass: failures.length === 0,
    failures,
    measured: {
      p95Ms: stats.p95Ms,
      p99Ms: stats.p99Ms,
      worstMs: stats.worstMs,
      fps: stats.fps,
      lateFrameShare,
      budgetMs: budget.budgetMs,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* A run                                                                       */
/* -------------------------------------------------------------------------- */

export interface MeasurementRequest {
  readonly preset: QualityPreset;
  readonly viewportCount: number;
  readonly targetFps: number;
  /** How long to sample. 30 s is the floor in PROFILING.md; longer is better. */
  readonly durationMs: number;
  /** Free-text scenario label, e.g. "4-way, full arena, both teams boosting". */
  readonly scenario: string;
  readonly criteria?: MeasurementCriteria;
}

export interface MeasurementReport {
  readonly request: MeasurementRequest;
  readonly stats: FrameStats;
  readonly verdict: Verdict;
  /** Wall-clock span actually covered, which may exceed `durationMs`. */
  readonly elapsedMs: number;
  /** Always present in a report so no number can be read without its context. */
  readonly provenance: string;
}

/**
 * What every report carries, so a number can never escape its context.
 *
 * The calibration run quoted in the brief is the cautionary case: a headless
 * SwiftShader run dropping "164 of 1127" frames is a SOFTWARE-RENDERING number.
 * Presented bare it reads as a GPU result and would be badly misleading. So the
 * report says where it ran, every time.
 */
export const PROVENANCE_SOFTWARE = "SOFTWARE RENDERING (SwiftShader/llvmpipe) — not GPU performance";
export const PROVENANCE_GPU = "GPU hardware measurement";

/**
 * Accumulates one measurement. Feed it deltas; ask for the report. The feed /
 * report split is what makes this testable without a browser.
 */
export class MeasurementSession {
  private readonly sampler: FrameSampler;
  private readonly samples: number[] = [];
  private startedAtMs: number | null = null;
  private lastAtMs: number | null = null;
  private elapsedMs = 0;

  constructor(readonly request: MeasurementRequest) {
    this.sampler = new FrameSampler();
  }

  /** Begin the window. `atMs` is an injected monotonic timestamp. */
  start(atMs: number): void {
    this.startedAtMs = atMs;
    this.lastAtMs = atMs;
    this.elapsedMs = 0;
    this.sampler.reset();
    this.samples.length = 0;
  }

  /** Record one frame interval. Returns false if the window has not started. */
  feed(atMs: number, frameMs: number): boolean {
    if (this.startedAtMs === null || this.lastAtMs === null) return false;
    if (!Number.isFinite(frameMs) || frameMs <= 0) return false;
    this.samples.push(frameMs);
    this.elapsedMs = Math.max(0, atMs - this.startedAtMs);
    this.lastAtMs = atMs;
    return this.sampler.push(frameMs);
  }

  /** True once at least `durationMs` of wall time has been covered. */
  isComplete(): boolean {
    return this.elapsedMs >= this.request.durationMs;
  }

  report(provenance: string = PROVENANCE_GPU): MeasurementReport {
    const criteria = this.request.criteria ?? DEFAULT_CRITERIA;
    const options: SummarizeOptions = {
      budgetMs: frameBudget(criteria.targetFps).budgetMs,
      pauseAboveMs: 150,
    };
    const stats = summarize(this.samples, options);
    return {
      request: this.request,
      stats,
      verdict: evaluateFrameStats(stats, criteria),
      elapsedMs: this.elapsedMs,
      provenance,
    };
  }
}

/* -------------------------------------------------------------------------- */
/* Driving a source                                                            */
/* -------------------------------------------------------------------------- */

/** Injected scheduler. The browser's rAF in production, a fake in tests. */
export interface FramePump {
  now(): number;
  requestFrame(callback: () => void): number;
  cancelFrame(handle: number): void;
}

/** Wrap a window as a `FramePump`. */
export function createRafPump(target: {
  now(): number;
  requestAnimationFrame(callback: (time: number) => void): number;
  cancelAnimationFrame(handle: number): void;
}): FramePump {
  return {
    now: () => target.now(),
    requestFrame: (callback) => target.requestAnimationFrame(() => callback()),
    cancelFrame: (handle) => target.cancelAnimationFrame(handle),
  };
}

/**
 * Drive a real measurement to completion.
 *
 * Note what this does NOT do: it never touches `renderer.setPixelRatio` or
 * `setSize`. The donor calls those at init and on preset change only
 * (`app/startup.js:600-601, 626-627, 677`) and there is no per-frame
 * resolution churn to preserve or disturb. Applying a preset is the host's job.
 */
export function runMeasurement(
  pump: FramePump,
  request: MeasurementRequest,
  provenance: string = PROVENANCE_GPU,
): Promise<MeasurementReport> {
  return new Promise((resolve) => {
    const session = new MeasurementSession(request);
    let handle = 0;
    let previousAtMs: number | null = null;
    session.start(pump.now());

    const tick = () => {
      const at = pump.now();
      // Measure against the previous tick, so a slow rAF shows up as a long
      // interval rather than being silently absorbed.
      if (previousAtMs !== null) {
        const delta = at - previousAtMs;
        if (delta > 0 && delta < 1000) session.feed(at, delta);
      }
      previousAtMs = at;
      if (session.isComplete()) {
        pump.cancelFrame(handle);
        resolve(session.report(provenance));
        return;
      }
      handle = pump.requestFrame(tick);
    };

    handle = pump.requestFrame(tick);
  });
}
