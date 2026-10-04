/**
 * Phase 4 — split-screen VIEWPORT GEOMETRY (pure).
 *
 * OWNER: the Phase 4 worker. This file is inside `src/airjam/viewports/**`, which
 * is this worker's exclusive subtree. Nothing else in the port may edit it.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS FILE IS PURE
 * ---------------------------------------------------------------------------
 * There is NO Three.js import, NO DOM access and NO donor import at runtime
 * (the seam import is `import type` only, which erases at compile time). The
 * split-screen contract in `seam.ts:207-231` is therefore unit-testable in a
 * plain node environment with no WebGL context and no WASM, which is the whole
 * point: the geometry is where a split-screen bug is cheapest to catch.
 *
 * ---------------------------------------------------------------------------
 * THE TILING INVARIANT
 * ---------------------------------------------------------------------------
 * Exactly `count` rects, covering `width x height`, with NO gap and NO overlap.
 * Two consequences drive the implementation:
 *
 *  1. Rects are INTEGER pixel rects. A rect with fractional edges is not
 *     expressible as a GL scissor rect, and adjacent rects that each round
 *     independently either leave a 1px gap or double-draw a 1px column. So we
 *     never round a *rect*; we round the *shared boundary* between neighbours
 *     and derive both rects from it. `edge()` below is the single source of
 *     every x and y coordinate in the module.
 *  2. The origin is TOP-LEFT (`seam.ts:211-216` — "CSS-pixel rect of the full
 *     canvas", origin top-left). WebGL viewports are BOTTOM-left. The flip is
 *     applied at the very last moment, in `toGLViewport`, which is the only
 *     place a GL coordinate is ever produced.
 *
 * ---------------------------------------------------------------------------
 * LAYOUTS
 * ---------------------------------------------------------------------------
 * All five canonical layouts are the same generic row/column grid with a
 * different (rows, cols) and a possibly-incomplete last row, so there is one
 * algorithm rather than five hand-rolled ones:
 *
 *   solo     rows 1, cols 1   -> 1 full-canvas rect
 *   split-v  rows 1, cols 2   -> 2 side-by-side columns (vertical divider)
 *   split-h  rows 2, cols 1   -> 2 stacked rows (horizontal divider)
 *   duo-top  rows 2, cols 2   -> 2 on top, 1 full-width below  (3 players)
 *   quad     rows 2, cols 2   -> 2x2                             (4 players)
 *
 * A layout is only honoured when it can actually hold `count` (see
 * `layoutCanHost`); otherwise the default for that count is used. Counts with
 * no canonical layout (5, 7, 8) fall back to a balanced grid via
 * `gridShapeFor`, which yields 3x2 for 5 and 6 players and 3x3 for 7 and 8.
 */

import type { ViewportGeometry, ViewportLayoutName, ViewportRect } from "../seam.js";

export type { ViewportGeometry, ViewportLayoutName, ViewportRect };

/**
 * Compile-time conformance with the shared contract.
 *
 * `seam.ts:229-234` declares `ViewportGeometry` as a TYPE (so the contract file
 * carries no implementation) and points at this directory for the real thing.
 * Assigning our function to that type makes the package's typecheck fail loudly
 * if the two ever drift apart — a changed parameter order, a dropped `layout?`
 * argument or a widened return type. A comment cannot do that.
 */
const _conformsToSeam: ViewportGeometry = computeViewportRects;
void _conformsToSeam;

/** A layout as a row/column grid. The last row may be short. */
export interface LayoutShape {
  readonly rows: number;
  readonly cols: number;
}

/** Row/column shape of every canonical layout in `ViewportLayoutName`. */
export const LAYOUT_SHAPE: Readonly<Record<ViewportLayoutName, LayoutShape>> = Object.freeze({
  solo: Object.freeze({ rows: 1, cols: 1 }),
  "split-v": Object.freeze({ rows: 1, cols: 2 }),
  "split-h": Object.freeze({ rows: 2, cols: 1 }),
  "duo-top": Object.freeze({ rows: 2, cols: 2 }),
  quad: Object.freeze({ rows: 2, cols: 2 }),
});

/**
 * The canonical layout for each player count that has one. Mirrors the seam's
 * own summary at `seam.ts:218` ("1 -> fullscreen, 2 -> vertical split,
 * 4 -> 2x2, 3 -> 2 top + 1 bottom").
 *
 * 2 players default to `split-v` (a vertical divider, two columns) rather than
 * `split-h`, which is the conventional split-screen reading and the one the
 * seam documents.
 */
export const DEFAULT_LAYOUT_BY_COUNT: Readonly<Partial<Record<number, ViewportLayoutName>>> =
  Object.freeze({
    1: "solo",
    2: "split-v",
    3: "duo-top",
    4: "quad",
  });

/**
 * Resolve the default layout name for a player count.
 *
 * Returns `null` for counts with no canonical layout (5+), which means "use the
 * balanced grid" — `null` is deliberately a legal answer because
 * `ViewportLayoutName` in the seam has no `grid` member and inventing one would
 * widen the shared contract.
 */
export function resolveDefaultLayout(count: number): ViewportLayoutName | null {
  if (!Number.isInteger(count) || count < 1) return null;
  return DEFAULT_LAYOUT_BY_COUNT[count] ?? null;
}

/**
 * Can `layout` hold exactly `count` rects on a (rows, cols) grid?
 *
 * Three conditions, all necessary:
 *  - `rows * cols >= count`          the grid has the cells;
 *  - `(rows - 1) * cols < count`     the last row is not empty (otherwise we
 *                                     would emit a zero-height strip);
 *  - `count >= cols`                 the first row is full. Without this,
 *                                     `split-v` (1x2) would "accept" 1 player
 *                                     and return a 1-cell full-canvas rect,
 *                                     which is `solo` wearing the wrong name.
 */
export function layoutCanHost(layout: ViewportLayoutName, count: number): boolean {
  if (!Number.isInteger(count) || count < 1) return false;
  const { rows, cols } = LAYOUT_SHAPE[layout];
  return rows * cols >= count && (rows - 1) * cols < count && count >= cols;
}

/**
 * The most balanced grid for an arbitrary player count: as square as possible,
 * with the last row short if the count does not divide evenly.
 *
 * 5 -> 2 rows x 3 cols, 6 -> 2 x 3, 7 -> 3 x 3, 8 -> 3 x 3. This is what makes
 * a 6-player match possible at all, since the seam's `ViewportLayoutName` stops
 * at `quad`.
 */
export function gridShapeFor(count: number): LayoutShape {
  if (!Number.isInteger(count) || count < 1) {
    throw new RangeError(`viewport count must be a positive integer, got ${count}`);
  }
  const cols = Math.min(count, Math.ceil(Math.sqrt(count)));
  const rows = Math.ceil(count / cols);
  return { rows, cols };
}

/**
 * The i-th boundary of `n` equal integer spans across [a, b].
 *
 * This is the load-bearing 4 lines of the whole module: because neighbouring
 * cells call this with the SAME (a, b, n) they receive the SAME boundary value,
 * so cells are contiguous by construction and the tiling is gap-free and
 * overlap-free for any a, b, n — including odd `b - a`, where equal division
 * would otherwise leave a 1px seam.
 */
function edge(a: number, b: number, n: number, i: number): number {
  return a + Math.round(((b - a) * i) / n);
}

/** Build `count` rects on a (rows, cols) grid, short last row allowed. */
function buildGrid(
  count: number,
  width: number,
  height: number,
  shape: LayoutShape,
): ViewportRect[] {
  if (!Number.isInteger(count) || count < 1) {
    throw new RangeError(`viewport count must be a positive integer, got ${count}`);
  }
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    throw new RangeError(`canvas size must be finite, got ${width}x${height}`);
  }
  const w = Math.floor(width);
  const h = Math.floor(height);
  const { rows, cols } = shape;
  if (w < cols) {
    throw new RangeError(
      `canvas width ${w}px is too small for ${cols} viewports side by side (${count} players)`,
    );
  }
  if (h < rows) {
    throw new RangeError(
      `canvas height ${h}px is too small for ${rows} viewport rows (${count} players)`,
    );
  }

  const rects: ViewportRect[] = [];
  for (let row = 0; row < rows; row++) {
    const inRow = Math.min(cols, count - row * cols);
    if (inRow <= 0) break;
    const y0 = edge(0, h, rows, row);
    const y1 = edge(0, h, rows, row + 1);
    for (let col = 0; col < inRow; col++) {
      const x0 = edge(0, w, inRow, col);
      const x1 = edge(0, w, inRow, col + 1);
      rects.push({
        index: rects.length,
        playerId: null,
        x: x0,
        y: y0,
        width: x1 - x0,
        height: y1 - y0,
      });
    }
  }
  /* The guards above make these impossible; assert the postcondition cheaply
     rather than let a future edit ship an off-by-one row. */
  if (rects.length !== count) {
    throw new RangeError(
      `layout produced ${rects.length} rects for ${count} players — refusing to ship a partial tiling`,
    );
  }
  return rects;
}

/**
 * PURE: exactly `count` non-overlapping, gap-free rects covering `width x height`.
 *
 * `layout` is honoured only if it can host `count` (see `layoutCanHost`);
 * otherwise the default for `count` is used, so a bad request degrades to a
 * correct layout instead of throwing or shipping a broken tiling.
 *
 * Throws `RangeError` when the canvas is too small to give every viewport at
 * least one pixel, because a zero-area rect means an invisible player and a
 * silent clamp would hide the mistake.
 */
export function computeViewportRects(
  count: number,
  width: number,
  height: number,
  layout?: ViewportLayoutName,
): ViewportRect[] {
  const chosen = layout && layoutCanHost(layout, count) ? layout : resolveDefaultLayout(count);
  if (chosen) {
    const { rows, cols } = LAYOUT_SHAPE[chosen];
    return buildGrid(count, width, height, { rows, cols });
  }
  return buildGrid(count, width, height, gridShapeFor(count));
}

/** Sum of rect areas. Equals `width * height` exactly when the tiling is sound. */
export function totalRectArea(rects: readonly ViewportRect[]): number {
  return rects.reduce((sum, r) => sum + r.width * r.height, 0);
}

/** True when two rects share any pixel. Touching edges are not an overlap. */
export function rectsOverlap(a: ViewportRect, b: ViewportRect): boolean {
  return (
    a.x < b.x + b.width &&
    b.x < a.x + a.width &&
    a.y < b.y + b.height &&
    b.y < a.y + a.height
  );
}

/**
 * The tiling postcondition, as a single check the host can run in dev and the
 * tests can assert on: no zero-area rect, no overlap, exact total coverage.
 * Returns the list of violations (empty when sound) instead of throwing, so a
 * test can report all of them at once.
 */
export function tilingDefects(
  rects: readonly ViewportRect[],
  width: number,
  height: number,
): string[] {
  const defects: string[] = [];
  const w = Math.floor(width);
  const h = Math.floor(height);

  for (const r of rects) {
    if (r.width <= 0 || r.height <= 0) {
      defects.push(`rect ${r.index} has zero area (${r.width}x${r.height})`);
    }
    if (r.x < 0 || r.y < 0 || r.x + r.width > w || r.y + r.height > h) {
      defects.push(`rect ${r.index} escapes the canvas: ${r.x},${r.y} ${r.width}x${r.height}`);
    }
  }
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      if (rectsOverlap(rects[i], rects[j])) {
        defects.push(`rects ${i} and ${j} overlap`);
      }
    }
  }

  const area = totalRectArea(rects);
  if (area !== w * h) {
    defects.push(
      `coverage ${area}px² != canvas ${w * h}px² (${area - w * h}px² ${area > w * h ? "double-drawn" : "lost"})`,
    );
  }
  return defects;
}

/** Throwing form of `tilingDefects`, for dev-mode assertions. */
export function assertGapFree(rects: readonly ViewportRect[], width: number, height: number): void {
  const defects = tilingDefects(rects, width, height);
  if (defects.length > 0) {
    throw new Error(`viewport tiling is broken:\n  - ${defects.join("\n  - ")}`);
  }
}

/**
 * The camera aspect for a rect: `width / height` of the VIEWPORT, not of the
 * canvas. The donor always uses the canvas aspect (`startup.js:308` and the
 * resize handler at `startup.js:675`), which is correct for a single view and
 * wrong for every sub-rect — at 4-way 1080p a 960x540 viewport is 16:9 while
 * the canvas is 16:9 too, but at 2-way a 960x1080 column is 0.89 and using
 * 1.78 shears the image.
 */
export function viewportAspect(rect: ViewportRect): number {
  return rect.height > 0 ? rect.width / rect.height : 0;
}

/** A GL-space rectangle. Origin is BOTTOM-left, as WebGL expects. */
export interface GLRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * The ONE place a top-left rect becomes a bottom-left GL rect.
 *
 * `renderer.setViewport` passes y straight through to `gl.viewport`
 * (`three.js:28579-28582`) without flipping, so the flip is ours to do.
 * `canvasHeight` is the full canvas height in the same units as the rect.
 */
export function toGLViewport(rect: ViewportRect, canvasHeight: number): GLRect {
  return {
    x: rect.x,
    y: canvasHeight - (rect.y + rect.height),
    width: rect.width,
    height: rect.height,
  };
}

/** A size in device pixels. */
export interface BufferSize {
  width: number;
  height: number;
}

/**
 * Same rect, in RENDER-TARGET pixels.
 *
 * This is NOT the same as `toGLViewport`, and the difference is the single
 * easiest way to get a broken split screen:
 *
 *  - The renderer multiplies the viewport by the pixel ratio itself
 *    (`three.js:28581`, `28588`), so `renderer.setViewport` takes CSS pixels.
 *  - A render target does not: `setRenderTarget` copies `P.viewport` verbatim
 *    into `gl.viewport` (`three.js:29537`, `29547`), so it takes TARGET pixels.
 *
 * The scale is therefore the target's own size relative to the CANVAS IN CSS
 * PIXELS, which folds in both the pixel ratio and any further division. The
 * post chain's mip targets are divided again (`reference-post.js:79-84`,
 * `w = width / divisor`), so scaling by the pixel ratio alone would confine a
 * half-resolution bloom target to a quarter of the intended area.
 *
 * `gl.y` is measured from the bottom in both spaces, so it scales directly with
 * no second flip.
 */
export function toTargetRect(
  rect: ViewportRect,
  canvasCssHeight: number,
  target: BufferSize,
  canvasCssSize: BufferSize,
): GLRect {
  const gl = toGLViewport(rect, canvasCssHeight);
  const scaleX = canvasCssSize.width > 0 ? target.width / canvasCssSize.width : 1;
  const scaleY = canvasCssSize.height > 0 ? target.height / canvasCssSize.height : 1;
  const x = Math.max(0, Math.min(target.width, Math.round(gl.x * scaleX)));
  const y = Math.max(0, Math.min(target.height, Math.round(gl.y * scaleY)));
  // A viewport that rounds away entirely is a lost player, so floor at 1px.
  const width = Math.max(1, Math.min(target.width - x, Math.round(gl.width * scaleX)));
  const height = Math.max(1, Math.min(target.height - y, Math.round(gl.height * scaleY)));
  return { x, y, width, height };
}

/** Stamp player ids onto rects in order, returning the same array. */
export function assignPlayers(
  rects: readonly ViewportRect[],
  playerIds: readonly string[],
): ViewportRect[] {
  return rects.map((rect, i) => ({ ...rect, playerId: playerIds[i] ?? null }));
}
