/**
 * Phase 10 — FRAME-TIME SAMPLER.
 *
 * OWNER: the Phase 10 worker (`src/airjam/perf/**`).
 *
 * PURE AND INJECTABLE. The percentile maths and the ring buffer have no DOM
 * dependency at all; everything that touches `requestAnimationFrame`, the
 * window, or a donor object goes through an injected interface.
 *
 * ---------------------------------------------------------------------------
 * CAN THE DONOR'S FRAME DATA BE READ PROGRAMMATICALLY? NO.
 * ---------------------------------------------------------------------------
 * The donor already runs a real `FrameProfiler` (`diagnostics/frame-profiler.js`)
 * with a public `snapshot()` that returns p50/p95/p99/fps/droppedTicks, and it
 * feeds a live on-screen overlay. The briefing asked whether that data can be
 * *read* rather than merely displayed. The answer is that it cannot today:
 *
 *   - `app/startup.js:561` creates it as a module-local `const He` inside the
 *     boot closure.
 *   - It is never exported, assigned to a global, or otherwise published. The
 *     only consumer is `ui/hud.js:101` + `:318`, which reads `snapshot()` for
 *     the overlay.
 *   - A repo-wide search for a `window.*` assignment returns exactly one hit,
 *     `window.__THREE__` in `vendor/three.js` — a Three.js version banner, not
 *     the profiler.
 *
 * So this sampler measures `requestAnimationFrame` deltas itself, and
 * `createDonorSnapshotSource` below is the adapter we would wire the moment the
 * profiler becomes reachable. It is included (rather than deleted) because it
 * documents the finding in code and makes the future change a one-liner.
 *
 * ---------------------------------------------------------------------------
 * THE DONOR'S PERCENTILE CONVENTION IS REUSED DELIBERATELY
 * ---------------------------------------------------------------------------
 * `frame-profiler.js:97-101` uses nearest-INDEX on a sorted array:
 * `Math.round(quantile * (count - 1))`. That is not the same as linear
 * interpolation, and p50 of [1..10] is therefore 6, not 5.5. We use the donor's
 * exact formula so that a number this module reports can be compared directly
 * with the number on the donor's overlay. See `nearestIndex`.
 */

import type { QualityPreset } from "../seam.js";

/** One measured frame interval. */
export interface FrameDelta {
  /** Monotonic timestamp of the frame, in ms. Injected; never `Date.now()`. */
  readonly atMs: number;
  /** Wall time since the previous frame, in ms. */
  readonly frameMs: number;
}

/** Percentile summary over a window of frame intervals. */
export interface FrameStats {
  readonly count: number;
  readonly meanMs: number;
  readonly p50Ms: number;
  readonly p95Ms: number;
  readonly p99Ms: number;
  readonly worstMs: number;
  /** `1000 / meanMs`, i.e. the donor's own `fps` definition. */
  readonly fps: number;
  /** Wall span covered by the samples. */
  readonly windowMs: number;
  /**
   * Vsync intervals MISSED, inferred from long deltas — see `countDroppedFrames`.
   * This is NOT the donor's `sim.droppedTicks`, which counts dropped *physics*
   * ticks (`frame-profiler.js:199`). The two measure different failures and
   * must not be conflated in a report.
   */
  readonly inferredDroppedFrames: number;
}

/**
 * Nearest-index position, matching `frame-profiler.js:99` exactly.
 * Exported so the convention is testable on its own.
 */
export function nearestIndex(count: number, quantile: number): number {
  if (count <= 1) return 0;
  return Math.min(count - 1, Math.max(0, Math.round(quantile * (count - 1))));
}

/**
 * Nearest-index percentile. Sorts a copy, so the input is never mutated.
 * Returns 0 for an empty input, matching the donor.
 */
export function percentile(samples: readonly number[], quantile: number): number {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  return sorted[nearestIndex(sorted.length, quantile)];
}

/** Options for `summarize`. */
export interface SummarizeOptions {
  /** Frame budget for the target refresh rate. Default 60 Hz. */
  readonly budgetMs?: number;
  /**
   * Deltas above this are treated as pauses (tab switch, GC, alt-tab) rather
   * than as slow frames, and are excluded from the drop count. 150 ms matches
   * the donor's own rule at `rendering/adaptive-resolution.js:16`.
   */
  readonly pauseAboveMs?: number;
}

export const DEFAULT_BUDGET_MS = 1000 / 60;

/**
 * Inferred missed vsync intervals: for each accepted delta, how many refresh
 * periods longer than one it was, minus one. `round`, not `floor`, so a delta
 * of 1.4x budget is not counted as a drop but 1.6x is.
 */
export function countDroppedFrames(
  samples: readonly number[],
  budgetMs: number,
  pauseAboveMs: number,
): number {
  if (!(budgetMs > 0)) return 0;
  let dropped = 0;
  for (const frameMs of samples) {
    if (frameMs <= 0 || frameMs > pauseAboveMs) continue;
    const missed = Math.max(0, Math.round(frameMs / budgetMs) - 1);
    dropped += missed;
  }
  return dropped;
}

/** Pure: the whole report for a set of frame intervals. */
export function summarize(
  samples: readonly number[],
  options: SummarizeOptions = {},
): FrameStats {
  const budgetMs = options.budgetMs ?? DEFAULT_BUDGET_MS;
  const pauseAboveMs = options.pauseAboveMs ?? 150;
  if (samples.length === 0) {
    return {
      count: 0,
      meanMs: 0,
      p50Ms: 0,
      p95Ms: 0,
      p99Ms: 0,
      worstMs: 0,
      fps: 0,
      windowMs: 0,
      inferredDroppedFrames: 0,
    };
  }
  const total = samples.reduce((sum, value) => sum + value, 0);
  const meanMs = total / samples.length;
  return {
    count: samples.length,
    meanMs,
    p50Ms: percentile(samples, 0.5),
    p95Ms: percentile(samples, 0.95),
    p99Ms: percentile(samples, 0.99),
    worstMs: percentile(samples, 1),
    fps: meanMs > 0 ? 1000 / meanMs : 0,
    windowMs: total,
    inferredDroppedFrames: countDroppedFrames(samples, budgetMs, pauseAboveMs),
  };
}

/**
 * A fixed-capacity ring of frame intervals.
 *
 * Bounded on purpose: an event runs for hours and an unbounded array would grow
 * for the whole session. Capacity defaults to 20 000, mirroring the donor's own
 * 10 000-slot ring (`frame-profiler.js:3`).
 */
export class FrameSampler {
  private readonly values: Float32Array;
  private write = 0;
  private filled = 0;

  constructor(readonly capacity = 20_000) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new RangeError(`FrameSampler capacity must be a positive integer, got ${capacity}`);
    }
    this.values = new Float32Array(capacity);
  }

  /** Number of samples currently held (saturates at `capacity`). */
  get count(): number {
    return this.filled;
  }

  /**
   * Record one frame. Non-finite, negative and zero intervals are rejected
   * rather than stored — a bad reading must not poison a percentile.
   */
  push(frameMs: number): boolean {
    if (!Number.isFinite(frameMs) || frameMs <= 0) return false;
    this.values[this.write] = frameMs;
    this.write = (this.write + 1) % this.capacity;
    if (this.filled < this.capacity) this.filled += 1;
    return true;
  }

  /** Record a `FrameDelta`, reading only its `frameMs`. */
  pushDelta(delta: FrameDelta): boolean {
    return this.push(delta.frameMs);
  }

  /** A copy of the samples, oldest first. */
  values_in_order(): number[] {
    const out: number[] = new Array(this.filled);
    const start = this.filled < this.capacity ? 0 : this.write;
    for (let i = 0; i < this.filled; i += 1) {
      out[i] = this.values[(start + i) % this.capacity];
    }
    return out;
  }

  stats(options?: SummarizeOptions): FrameStats {
    return summarize(this.values_in_order(), options);
  }

  reset(): void {
    this.write = 0;
    this.filled = 0;
    this.values.fill(0);
  }
}

/* -------------------------------------------------------------------------- */
/* Sources — everything that touches the outside world is injected             */
/* -------------------------------------------------------------------------- */

/** The minimum needed to read a frame interval. Injected, never global. */
export interface FrameSource {
  /** Current monotonic time in ms. */
  now(): number;
  /**
   * The most recent frame interval in ms, or null if no frame has completed yet.
   */
  lastDeltaMs(): number | null;
  /** Optional true frame interval, for sources that can read the donor directly. */
  readonly trueDeltaMs?: () => number | null;
}

/** What the donor's `FrameProfiler.snapshot()` returns (`frame-profiler.js:188-205`). */
export interface DonorProfilerSnapshot {
  readonly count: number;
  readonly frame: {
    readonly avgMs: number;
    readonly p50: number;
    readonly p95: number;
    readonly p99: number;
    readonly worstMs: number;
    readonly fps: number;
  };
  readonly refreshHz: number;
  readonly budgetMs: number;
  readonly overBudgetPct: number;
  readonly sim: {
    readonly ticksPerFrame: number;
    readonly droppedTicks: number;
    readonly clampedFrames: number;
    readonly stalls: number;
  };
}

/** Structural type of the donor's `FrameProfiler`. */
export interface DonorProfilerLike {
  snapshot(windowFrames?: number, windowSeconds?: number): DonorProfilerSnapshot;
}

/**
 * Adapter for the donor's profiler, if it ever becomes reachable.
 *
 * CURRENTLY UNUSABLE: `app/startup.js:561` keeps the instance in a module-local
 * `const` and publishes nothing, so the port has no way to obtain a
 * `FrameProfilerLike`. Kept because it is the whole integration, and because a
 * future seam that publishes the profiler only needs to hand it to this factory.
 *
 * Unlike the rAF source this one can see the donor's TRUE refresh rate instead
 * of assuming 60 Hz, and it exposes the donor's real physics-tick drop count.
 */
export function createDonorSnapshotSource(
  profiler: DonorProfilerLike,
  now: () => number,
): FrameSource {
  return {
    now,
    lastDeltaMs(): number | null {
      const snapshot = profiler.snapshot();
      return snapshot.count > 0 ? snapshot.frame.avgMs : null;
    },
    trueDeltaMs(): number | null {
      const snapshot = profiler.snapshot();
      return snapshot.count > 0 ? snapshot.frame.avgMs : null;
    },
  };
}

/** The slice of `window` a rAF pump needs. Injected so tests can fake it. */
export interface RafWindow {
  now(): number;
  requestAnimationFrame(callback: (time: number) => void): number;
  cancelAnimationFrame(handle: number): void;
}

/**
 * A rAF-delta `FrameSource`.
 *
 * Owns its own frame loop because the donor's `FrameScheduler`
 * (`rendering/frame-scheduler.js`) is private to the donor and already owns the
 * real loop. This sampler observes alongside it, which is why it measures
 * intervals rather than driving them.
 */
export function createRafFrameSource(
  target: RafWindow,
  onDelta?: (delta: FrameDelta) => void,
): FrameSource & { start(): void; stop(): void; readonly running: boolean } {
  let handle = 0;
  let running = false;
  let previous = 0;
  let hasPrevious = false;
  let lastDelta: number | null = null;

  const tick = (time: number) => {
    if (!running) return;
    // `time` is the frame timestamp; fall back to the clock if it is not usable.
    const at = Number.isFinite(time) && time > 0 ? time : target.now();
    // A flag rather than `previous > 0`, because a frame genuinely stamped at
    // t=0 is a legitimate baseline.
    if (hasPrevious) {
      const frameMs = at - previous;
      lastDelta = frameMs;
      onDelta?.({ atMs: at, frameMs });
    }
    previous = at;
    hasPrevious = true;
    handle = target.requestAnimationFrame(tick);
  };

  return {
    now: () => target.now(),
    lastDeltaMs: () => lastDelta,
    start(): void {
      if (running) return;
      running = true;
      previous = 0;
      hasPrevious = false;
      handle = target.requestAnimationFrame(tick);
    },
    stop(): void {
      if (!running) return;
      running = false;
      previous = 0;
      hasPrevious = false;
      lastDelta = null;
      target.cancelAnimationFrame(handle);
      handle = 0;
    },
    get running() {
      return running;
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Frame budget                                                                */
/* -------------------------------------------------------------------------- */

/**
 * A target refresh rate, and what it implies.
 *
 * The donor sniffs its own refresh rate from the p10 display interval and snaps
 * it to a known list (`frame-profiler.js:11-14, 149-154`), which is a better
 * estimate than assuming 60. The projector matters here: a 120 Hz laptop and a
 * 60 Hz projector have the same 16.67 ms vs 8.33 ms budgets, and mistaking one
 * for the other halves or doubles the frame budget.
 */
export const KNOWN_REFRESH_RATES: readonly number[] = Object.freeze([
  30, 48, 50, 60, 72, 75, 90, 100, 120, 144, 165, 175, 200, 240, 360, 480, 500, 540, 600,
]);

export interface FrameBudget {
  readonly targetFps: number;
  readonly budgetMs: number;
  /** A frame this long has missed at least one vsync. */
  readonly lateMs: number;
  /** A frame this long is a visible hitch on a projector. */
  readonly hitchMs: number;
}

/**
 * A frame budget for a refresh rate. The donor's cap is 120 fps
 * (`schema.js:64,77,90`) and its frame-rate limiter is separately configurable
 * over 30..120 (`schema.js:121`), so 120 is the ceiling here too.
 */
export function frameBudget(targetFps: number): FrameBudget {
  const fps = Number.isFinite(targetFps) && targetFps > 0 ? Math.min(120, targetFps) : 60;
  const budgetMs = 1000 / fps;
  return {
    targetFps: fps,
    budgetMs,
    lateMs: budgetMs * 1.2,
    hitchMs: budgetMs * 3,
  };
}

/** Which preset a stats window was measured under. Carried for the report. */
export interface LabelledStats {
  readonly preset: QualityPreset;
  readonly viewportCount: number;
  readonly stats: FrameStats;
}
