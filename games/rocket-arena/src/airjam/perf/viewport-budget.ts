/**
 * Phase 10 — PER-VIEWPORT BUDGET MODEL.
 *
 * OWNER: the Phase 10 worker (`src/airjam/perf/**`).
 *
 * PURE GEOMETRY + ARITHMETIC. Takes rects and a preset, returns a cost model.
 * No Three, no DOM, no donor import.
 *
 * ---------------------------------------------------------------------------
 * THE STATED FACTS
 * ---------------------------------------------------------------------------
 *  - At 4-way on a 1080p projector, each viewport framebuffer is ~960x540.
 *    The quad layout is 2 rows x 2 cols (`viewports/layouts.ts:80`), so
 *    1920/2 = 960 and 1080/2 = 540. Those rects are pixel-exact at
 *    renderScale 1, not approximate.
 *  - The requirement is to keep effects rich and NOT globally downgrade quality.
 *    This file exists to justify that requirement with arithmetic rather than
 *    with optimism.
 *
 * ---------------------------------------------------------------------------
 * THE CENTRAL FINDING: SPLIT SCREEN IS FILL-RATE NEUTRAL
 * ---------------------------------------------------------------------------
 * Each viewport renders the WHOLE arena through its own camera, so per-viewport
 * cost is dominated by overdraw and by passes that are not fragment-bound.
 * Two consequences follow, and they point in opposite directions:
 *
 *   (A) FRAGMENT WORK IS ~CONSTANT. N viewports x (canvasPixels / N) shaded
 *       pixels per pass = canvasPixels. Splitting the canvas does not reduce
 *       total pixels, and a 1-way view has the same total. So rendering at
 *       1080p and dividing by 4 is NOT a per-player saving in fill rate, and
 *       dropping renderScale below 1 is not the lever it appears to be.
 *
 *   (B) THE POST CHAIN AND DRAW-CALL COUNT ARE xN. The donor renders the scene
 *       once per camera via `renderGame` (`app/startup.js:583-599`), so the
 *       whole post chain runs N times. SSAO at 7 taps and half resolution, times
 *       four viewports, is the single most expensive thing in a 4-way match.
 *
 * Together: the cost of a 4-way match is not "a quarter of a solo match". It is
 * roughly the same FRAGMENT load plus 4x the DRAW CALLS, 4x the CULLING, 4x the
 * STATE CHANGES, and 4x the POST CHAIN. That is why the ladder spends `aoSteps`
 * before it would ever spend `renderScale` — and why "keep effects rich" and
 * "keep the frame budget" are not actually in conflict here.
 *
 * NONE OF THE ABOVE IS A MEASUREMENT. Every number in this file is geometry or
 * a count of draws read from donor source. Real GPU cost of a tap is not known
 * without a GPU and is not claimed. See PROFILING.md.
 */

import { ladderFor, postPlanFor, POST_PLAN_DEFAULTS, type PostPassPlan } from "./quality-ladder.js";
import type { QualityPreset } from "../seam.js";

/** Minimal structural rect, so this module does not couple to `viewports/`. */
export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface ViewportBudgetInput {
  readonly rects: readonly Rect[];
  /** Full-canvas CSS size. */
  readonly canvasWidth: number;
  readonly canvasHeight: number;
  readonly preset: QualityPreset;
  /** Buffer scale, i.e. what the ladder sets. 1 unless profiling says otherwise. */
  readonly renderScale?: number;
  /** Defaults to the donor's shipped graphics defaults (makeup renderer). */
  readonly postInputs?: typeof POST_PLAN_DEFAULTS;
}

/** One draw in the post chain, named so the count is auditable. */
export interface PostDraw {
  readonly pass: string;
  /** Resolution divisor relative to the drawing buffer. 1 = full res. */
  readonly divisor: number;
  /** Shader taps, where the donor makes it explicit. */
  readonly taps: number;
  readonly target: "render-target" | "screen";
}

/**
 * The post chain's actual draw list, in execution order.
 *
 * Read off `rendering/reference-post.js:99-142`. Two accuracy points that a
 * careless count would get wrong:
 *   - FXAA is NOT a pass. `reference-post.js:140` sets `uFXAA` on the SAME
 *     `postFragment` material that always runs, so it adds ALU to a draw that
 *     was already happening.
 *   - The SSAO blur is TWO blurs (`reference-post.js:117`), not one.
 */
export function postDraws(plan: PostPassPlan): readonly PostDraw[] {
  const draws: PostDraw[] = [{ pass: "scene->main", divisor: 1, taps: 1, target: "render-target" }];
  if (plan.autoExposure) {
    draws.push({ pass: "exposureDown", divisor: 64, taps: 1, target: "render-target" });
    draws.push({ pass: "exposureReduce", divisor: 64, taps: 1, target: "render-target" });
  }
  if (plan.aoSteps > 0) {
    draws.push({ pass: "makeupAO", divisor: 2, taps: plan.aoSteps, target: "render-target" });
    draws.push({ pass: "aoBlurH", divisor: 2, taps: 1, target: "render-target" });
    draws.push({ pass: "aoBlurV", divisor: 2, taps: 1, target: "render-target" });
  }
  if (plan.bloom) {
    draws.push({
      pass: "extract",
      divisor: plan.bloomDivisor,
      taps: 1,
      target: "render-target",
    });
    if (plan.makeup) {
      draws.push({ pass: "makeupBloom", divisor: 2, taps: 1, target: "render-target" });
      if (plan.denoiseBloom) {
        draws.push({ pass: "bloomDenoise", divisor: 2, taps: 1, target: "render-target" });
      }
    } else {
      draws.push({ pass: "bloomBlur", divisor: 2, taps: 1, target: "render-target" });
      if (plan.wideBloom) {
        draws.push({ pass: "wideDown", divisor: 8, taps: 1, target: "render-target" });
        draws.push({ pass: "wideBlur", divisor: 8, taps: 1, target: "render-target" });
        draws.push({ pass: "haloDown", divisor: 16, taps: 1, target: "render-target" });
        draws.push({ pass: "haloBlur", divisor: 16, taps: 1, target: "render-target" });
      }
    }
  }
  draws.push({ pass: "postFragment", divisor: 1, taps: 1, target: "screen" });
  return draws;
}

export interface ViewportBudget {
  readonly viewportCount: number;
  readonly preset: QualityPreset;

  readonly canvasPixels: number;
  /** Sum of the shaded area of every viewport rect, at renderScale. */
  readonly totalViewportPixels: number;
  readonly perViewportPixels: readonly number[];

  /**
   * `totalViewportPixels / canvasPixels`. Should be ~1.0 for any gap-free
   * layout — the quantitative statement of "split screen is fill-rate neutral".
   */
  readonly fillRatio: number;

  /** One full scene render per camera (`app/startup.js:583-599`). */
  readonly sceneRenderPasses: number;
  /** Post draws for ONE viewport. */
  readonly postDrawsPerViewport: number;
  /** Post draws across all viewports — the real xN cost. */
  readonly postDrawsTotal: number;
  /** `postDrawsTotal / postDrawsPerViewport`, i.e. how many times the chain runs. */
  readonly postChainMultiplicity: number;
  /**
   * Total SSAO taps per frame across all viewports. The largest single line
   * item at 4+ viewports, and the ladder's first thing to spend.
   */
  readonly aoTapsTotal: number;
  /** A crude, clearly-labelled proxy for relative fragment load. NOT a measurement. */
  readonly fullResEquivalentDraws: number;
  readonly postDrawList: readonly PostDraw[];
}

/**
 * The model. Given viewport rects and a preset, describe the frame's cost
 * shape. Pure — the only inputs are geometry and the preset.
 */
export function buildViewportBudget(input: ViewportBudgetInput): ViewportBudget {
  const renderScale = input.renderScale ?? ladderFor(input.preset).renderScale;
  const postInputs = input.postInputs ?? POST_PLAN_DEFAULTS;
  const plan = postPlanFor(ladderFor(input.preset).donorPreset, postInputs);
  const draws = postDraws(plan);

  const canvasPixels = Math.round(input.canvasWidth * input.canvasHeight * renderScale * renderScale);
  const perViewportPixels = input.rects.map(
    (rect) => Math.round(rect.width * rect.height * renderScale * renderScale),
  );
  const totalViewportPixels = perViewportPixels.reduce((sum, value) => sum + value, 0);

  const sceneRenderPasses = input.rects.length;
  const postDrawsPerViewport = draws.length;
  const postDrawsTotal = postDrawsPerViewport * sceneRenderPasses;

  // Fragment cost proxy: each draw costs (taps / divisor^2) full-res-equivalent
  // draws over its own rect. This is RELATIVE ordering only — a tap on this GPU
  // is not known to cost a unit of anything.
  const perViewportCost = draws.reduce(
    (sum, draw) => sum + draw.taps / (draw.divisor * draw.divisor),
    0,
  );
  const fullResEquivalentDraws = perViewportCost * sceneRenderPasses;

  return {
    viewportCount: input.rects.length,
    preset: input.preset,
    canvasPixels,
    totalViewportPixels,
    perViewportPixels,
    fillRatio: canvasPixels > 0 ? totalViewportPixels / canvasPixels : 0,
    sceneRenderPasses,
    postDrawsPerViewport,
    postDrawsTotal,
    postChainMultiplicity: postDrawsPerViewport > 0 ? sceneRenderPasses : 0,
    aoTapsTotal: (plan.aoSteps > 0 ? plan.aoSteps : 0) * sceneRenderPasses,
    fullResEquivalentDraws,
    postDrawList: draws,
  };
}

/**
 * The per-viewport allocation across N viewports, stated as the ladder step for
 * each supported player count. This is the answer to "give a model for
 * allocating quality across N viewports".
 *
 * The allocation rule is deliberately NOT a linear function of N. Quality is
 * held as high as the post-chain multiplicity allows, and it is the CHAIN that
 * is spent, because (A) in the header says fill rate is not the thing that grows
 * with N.
 */
export interface QualityAllocation {
  readonly viewportCount: number;
  readonly preset: QualityPreset;
  /** What the seam table asks for, before capability capping. */
  readonly baseline: QualityPreset;
  /** Post draws per frame across all viewports at this preset. */
  readonly postDrawsTotal: number;
  /** Fragment-cost proxy, relative — larger is more expensive. */
  readonly fullResEquivalentDraws: number;
  readonly rationale: string;
}

/** The counts the seam lists a preset for. */
export const ALLOCATED_VIEWPORT_COUNTS: readonly number[] = Object.freeze([1, 2, 3, 4, 6]);

/**
 * Grid shape per count, matching the canonical layouts. Needed because the seam
 * lists 3 players (duo-top, 2x2 with one cell empty) and 6 players (2x3), and
 * the xN cost depends on the grid, not the count.
 */
const GRID: Readonly<Record<number, readonly [rows: number, cols: number]>> = Object.freeze({
  1: [1, 1],
  2: [1, 2],
  3: [2, 2],
  4: [2, 2],
  6: [2, 3],
});

/** Rects for a `rows x cols` grid of a canvas, exactly tiling it. */
export function gridRects(
  canvasWidth: number,
  canvasHeight: number,
  rows: number,
  cols: number,
): Rect[] {
  const cellWidth = canvasWidth / cols;
  const cellHeight = canvasHeight / rows;
  const rects: Rect[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      rects.push({ x: col * cellWidth, y: row * cellHeight, width: cellWidth, height: cellHeight });
    }
  }
  return rects;
}

/**
 * The allocation table. Uses a 1080p canvas because that is the stated target,
 * and 1080p is the common projector resolution.
 */
export function allocateQuality(
  viewportCount: number,
  canvasWidth = 1920,
  canvasHeight = 1080,
  baseline: QualityPreset,
): QualityAllocation {
  const grid = GRID[viewportCount] ?? [1, viewportCount];
  const budget = buildViewportBudget({
    rects: gridRects(canvasWidth, canvasHeight, grid[0], grid[1]),
    canvasWidth,
    canvasHeight,
    preset: baseline,
  });
  const layout = `${grid[0]}x${grid[1]}`;
  return {
    viewportCount,
    preset: baseline,
    baseline,
    postDrawsTotal: budget.postDrawsTotal,
    fullResEquivalentDraws: budget.fullResEquivalentDraws,
    rationale:
      `${viewportCount}-way on 1080p is a ${layout} split, so each viewport shades ` +
      `${Math.round(canvasWidth / grid[1])}x${Math.round(canvasHeight / grid[0])}. ` +
      `Total shaded pixels stay ~constant (fill ratio ${budget.fillRatio.toFixed(3)}), so the ` +
      `cost growth is the ${budget.postChainMultiplicity}x post chain and ` +
      `${budget.sceneRenderPasses}x draw calls, not fill.`,
  };
}
