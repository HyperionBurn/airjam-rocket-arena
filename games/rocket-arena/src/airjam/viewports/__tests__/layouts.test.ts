/**
 * The tiling contract: exactly `count` rects, no gap, no overlap, no zero area.
 *
 * This is the Phase 4 test that matters most, because a split-screen bug here
 * is a permanently broken game rather than a visual nit — a 1px seam is a
 * double-drawn column, a missing rect is a player who cannot see.
 */
import { describe, expect, it } from "vitest";
import {
  assertGapFree,
  computeViewportRects,
  gridShapeFor,
  layoutCanHost,
  rectsOverlap,
  resolveDefaultLayout,
  tilingDefects,
  toGLViewport,
  toTargetRect,
  totalRectArea,
  viewportAspect,
} from "../layouts.js";

/** Canonical, real device sizes. */
const CANVASES = [
  { width: 1920, height: 1080, label: "1080p" },
  { width: 2560, height: 1440, label: "1440p" },
  { width: 1280, height: 720, label: "720p" },
  { width: 1921, height: 1081, label: "1080p odd (non-integer split)" },
  { width: 1024, height: 768, label: "4:3" },
  { width: 3440, height: 1440, label: "ultrawide 21:9" },
  { width: 800, height: 600, label: "small 4:3" },
] as const;

describe("computeViewportRects — exact tiling", () => {
  for (const count of [1, 2, 3, 4]) {
    for (const canvas of CANVASES) {
      it(`${count} player(s) tile ${canvas.label} (${canvas.width}x${canvas.height}) with no gap and no overlap`, () => {
        const rects = computeViewportRects(count, canvas.width, canvas.height);

        expect(rects).toHaveLength(count);
        // Single source of truth for the whole postcondition.
        expect(tilingDefects(rects, canvas.width, canvas.height)).toEqual([]);
        // No rect has zero area — a zero-area rect is an invisible player.
        for (const rect of rects) {
          expect(rect.width).toBeGreaterThan(0);
          expect(rect.height).toBeGreaterThan(0);
        }
        // Area equality is the independent check that nothing is unaccounted
        // for: overlaps would inflate it, gaps would deflate it.
        expect(totalRectArea(rects)).toBe(canvas.width * canvas.height);
        // Pairwise disjointness, asserted directly rather than via the helper.
        for (let i = 0; i < rects.length; i++) {
          for (let j = i + 1; j < rects.length; j++) {
            expect(rectsOverlap(rects[i], rects[j])).toBe(false);
          }
        }
        // Indices are dense and ordered, top-to-bottom then left-to-right.
        expect(rects.map((r) => r.index)).toEqual(rects.map((_, i) => i));
      });
    }
  }

  it("covers 6 and 8 players, which have no canonical layout", () => {
    for (const count of [5, 6, 7, 8]) {
      for (const canvas of CANVASES) {
        const rects = computeViewportRects(count, canvas.width, canvas.height);
        expect(rects, `${count}p on ${canvas.label}`).toHaveLength(count);
        expect(tilingDefects(rects, canvas.width, canvas.height)).toEqual([]);
        expect(totalRectArea(rects)).toBe(canvas.width * canvas.height);
      }
    }
  });

  it("is deterministic — same inputs, same rects, object equality", () => {
    const a = computeViewportRects(3, 1920, 1080);
    const b = computeViewportRects(3, 1920, 1080);
    expect(a).toEqual(b);
  });

  it("returns fresh rects so a caller cannot corrupt the next caller", () => {
    const a = computeViewportRects(4, 1920, 1080);
    a[0].x = 999;
    const b = computeViewportRects(4, 1920, 1080);
    expect(b[0].x).toBe(0);
  });

  it("throws rather than shipping a zero-area viewport", () => {
    // 3 viewports stacked need 2 rows; 1px of height cannot give 2 rows.
    expect(() => computeViewportRects(3, 1920, 1)).toThrow(RangeError);
    // 3 viewports side by side need 2 columns; 1px of width cannot give 2.
    expect(() => computeViewportRects(3, 1, 1080)).toThrow(RangeError);
    expect(() => computeViewportRects(0, 1920, 1080)).toThrow(RangeError);
  });

  it("still tiles at the smallest canvas that can hold the grid", () => {
    // 2 columns of 1px is legitimate, not degenerate: no rect has zero area.
    const rects = computeViewportRects(3, 2, 2);
    expect(tilingDefects(rects, 2, 2)).toEqual([]);
    for (const rect of rects) {
      expect(rect.width).toBeGreaterThan(0);
      expect(rect.height).toBeGreaterThan(0);
    }
  });
});

describe("default layout resolution", () => {
  it("maps 1/2/3/4 to the seam's canonical layouts", () => {
    expect(resolveDefaultLayout(1)).toBe("solo");
    expect(resolveDefaultLayout(2)).toBe("split-v");
    expect(resolveDefaultLayout(3)).toBe("duo-top");
    expect(resolveDefaultLayout(4)).toBe("quad");
  });

  it("returns null for counts with no canonical layout, meaning 'grid'", () => {
    expect(resolveDefaultLayout(5)).toBeNull();
    expect(resolveDefaultLayout(6)).toBeNull();
    expect(resolveDefaultLayout(0)).toBeNull();
  });

  it("falls back to the default when a named layout cannot host the count", () => {
    // `quad` is 2x2; asking for it with 2 players must not produce 2 cells of a
    // 4-cell grid, and must not throw either.
    const rects = computeViewportRects(2, 1920, 1080, "quad");
    expect(rects).toHaveLength(2);
    expect(tilingDefects(rects, 1920, 1080)).toEqual([]);
    // It degraded to split-v: two full-height columns.
    expect(rects[0]).toMatchObject({ x: 0, y: 0, width: 960, height: 1080 });
    expect(rects[1]).toMatchObject({ x: 960, y: 0, width: 960, height: 1080 });

    expect(layoutCanHost("quad", 4)).toBe(true);
    expect(layoutCanHost("quad", 2)).toBe(false);
    expect(layoutCanHost("solo", 1)).toBe(true);
    expect(layoutCanHost("solo", 2)).toBe(false);
    // `split-v` (1x2) must not "accept" one player by emitting a full-canvas cell.
    expect(layoutCanHost("split-v", 1)).toBe(false);
  });

  it("honours an explicit layout that fits", () => {
    const rects = computeViewportRects(2, 1920, 1080, "split-h");
    expect(rects).toHaveLength(2);
    expect(tilingDefects(rects, 1920, 1080)).toEqual([]);
    // split-h: two full-width stacked rows.
    expect(rects[0]).toMatchObject({ x: 0, y: 0, width: 1920, height: 540 });
    expect(rects[1]).toMatchObject({ x: 0, y: 540, width: 1920, height: 540 });
  });
});

describe("shapes per count", () => {
  it("duo-top is 2 on top, 1 full-width below", () => {
    const rects = computeViewportRects(3, 1920, 1080);
    expect(rects[0]).toMatchObject({ x: 0, y: 0, width: 960, height: 540 });
    expect(rects[1]).toMatchObject({ x: 960, y: 0, width: 960, height: 540 });
    expect(rects[2]).toMatchObject({ x: 0, y: 540, width: 1920, height: 540 });
  });

  it("quad is 2x2 with 16:9 viewports at 1080p", () => {
    const rects = computeViewportRects(4, 1920, 1080);
    for (const rect of rects) {
      expect(rect.width).toBe(960);
      expect(rect.height).toBe(540);
      // The brief's own number: ~960x540 framebuffers at 4-way 1080p.
      expect(viewportAspect(rect)).toBeCloseTo(16 / 9, 10);
    }
  });

  it("gives 6 players a 3x2 grid, which the seam's layout union cannot express", () => {
    expect(gridShapeFor(6)).toEqual({ rows: 2, cols: 3 });
    const rects = computeViewportRects(6, 1920, 1080);
    expect(rects).toHaveLength(6);
    // 3 columns of 640 across, 2 rows of 540 down.
    expect(rects[0]).toMatchObject({ x: 0, y: 0, width: 640, height: 540 });
    expect(rects[2]).toMatchObject({ x: 1280, y: 0, width: 640, height: 540 });
    expect(rects[5]).toMatchObject({ x: 1280, y: 540, width: 640, height: 540 });
    expect(tilingDefects(rects, 1920, 1080)).toEqual([]);
  });

  it("splits an odd canvas without leaving a seam", () => {
    // 1921 is prime: equal division would put a boundary at 960.5.
    const rects = computeViewportRects(4, 1921, 1081);
    expect(tilingDefects(rects, 1921, 1081)).toEqual([]);
    const widths = rects.map((r) => r.width);
    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(1);
    // Boundaries are shared exactly, so neighbours abut to the pixel: the top
    // row's bottom edge IS the bottom row's top edge, in both directions.
    expect(rects[0].x + rects[0].width).toBe(rects[1].x);
    expect(rects[0].y + rects[0].height).toBe(rects[2].y);
    expect(rects[2].x + rects[2].width).toBe(rects[3].x);
  });
});

describe("aspect handling", () => {
  it("uses the VIEWPORT aspect, not the canvas aspect", () => {
    // 2-way split-v on 16:9 gives portrait columns: 960/1080 = 0.888...
    const rects = computeViewportRects(2, 1920, 1080);
    expect(viewportAspect(rects[0])).toBeCloseTo(960 / 1080, 10);
    expect(viewportAspect(rects[0])).not.toBeCloseTo(1920 / 1080, 3);
  });

  it("flips the y axis exactly once, at the GL boundary", () => {
    const rects = computeViewportRects(4, 1920, 1080);
    // Top-left viewport: GL y is the canvas height minus its bottom edge.
    expect(toGLViewport(rects[0], 1080)).toEqual({ x: 0, y: 540, width: 960, height: 540 });
    // Bottom-left viewport: GL y is 0.
    expect(toGLViewport(rects[2], 1080)).toEqual({ x: 0, y: 0, width: 960, height: 540 });
    // Every rect keeps its area through the flip.
    for (const rect of rects) {
      const gl = toGLViewport(rect, 1080);
      expect(gl.width * gl.height).toBe(rect.width * rect.height);
    }
  });

  it("scales rects into render-target pixels, which are NOT pre-multiplied", () => {
    // The renderer multiplies by the pixel ratio itself (three.js:28581), but
    // setRenderTarget copies a target's viewport verbatim (three.js:29537), so
    // a target needs its own conversion or the chain renders at a quarter size.
    const rects = computeViewportRects(4, 1920, 1080);
    const target = toTargetRect(
      rects[0],
      1080,
      { width: 3840, height: 2160 },
      { width: 1920, height: 1080 },
    );
    expect(target).toEqual({ x: 0, y: 1080, width: 1920, height: 1080 });
  });

  it("scales a half-resolution mip target by ITS own size, not the pixel ratio", () => {
    // reference-post.js:79-84 divides the mip targets again. Using the pixel
    // ratio alone would confine a 960x540 bloom target to a quarter of the
    // intended area.
    const rects = computeViewportRects(4, 1920, 1080);
    const canvas = { width: 1920, height: 1080 };
    const mip = toTargetRect(rects[0], 1080, { width: 960, height: 540 }, canvas);
    expect(mip).toEqual({ x: 0, y: 270, width: 480, height: 270 });
  });

  it("never lets a target rect round away to nothing", () => {
    const rects = computeViewportRects(8, 320, 180);
    for (const rect of rects) {
      const t = toTargetRect(rect, 180, { width: 320, height: 180 }, { width: 320, height: 180 });
      expect(t.width).toBeGreaterThanOrEqual(1);
      expect(t.height).toBeGreaterThanOrEqual(1);
      expect(t.x + t.width).toBeLessThanOrEqual(320);
      expect(t.y + t.height).toBeLessThanOrEqual(180);
    }
  });

  it("reports a zero aspect for a degenerate rect instead of Infinity", () => {
    expect(viewportAspect({ index: 0, playerId: null, x: 0, y: 0, width: 10, height: 0 })).toBe(0);
  });
});

describe("assertGapFree", () => {
  it("passes on real geometry and throws on injected defects", () => {
    expect(() =>
      assertGapFree(computeViewportRects(4, 1920, 1080), 1920, 1080),
    ).not.toThrow();

    const holed = computeViewportRects(4, 1920, 1080);
    holed[3].width -= 4; // punch a hole in the bottom-right viewport
    expect(() => assertGapFree(holed, 1920, 1080)).toThrow(/tiling is broken/);

    const overlapped = computeViewportRects(4, 1920, 1080);
    overlapped[1].x -= 8;
    expect(() => assertGapFree(overlapped, 1920, 1080)).toThrow(/overlap/);
  });
});
