/**
 * The `setSize` re-apply guarantee.
 *
 * The fakes below reproduce the two resets that make this necessary, with the
 * vendored line numbers in comments so a reader can check them:
 *
 *   three.js:28542  renderer.setSize() ends with setViewport(0, 0, w, h)
 *   three.js:3302   RenderTarget.setSize() ends with viewport.set(0,0,w,h) and
 *                   scissor.set(0,0,w,h)
 *
 * The second is the one that bites, because `reference-post.js:78` calls
 * `main.setSize(...)` from INSIDE `render()` — so on a resize frame the reset
 * happens in the middle of a view's own render call, after that view's viewport
 * was already applied.
 */
import { describe, expect, it } from "vitest";
import { computeViewportRects, toGLViewport, toTargetRect } from "../layouts.js";
import {
  ViewportApplication,
  type Rect4Like,
  type Size2Like,
  type ViewportRendererLike,
  type ViewportTargetLike,
} from "../viewport-application.js";

/** `THREE.Vector4` stand-in. */
function vec4(x = 0, y = 0, z = 0, w = 0): Rect4Like {
  return {
    x,
    y,
    z,
    w,
    set(nx: number, ny: number, nz: number, nw: number) {
      this.x = nx;
      this.y = ny;
      this.z = nz;
      this.w = nw;
      return this;
    },
  };
}

class FakeRenderer implements ViewportRendererLike {
  viewport = vec4();
  scissor = vec4();
  scissorTest = false;
  pixelRatio = 1;
  cssWidth = 1920;
  cssHeight = 1080;
  setSizeCalls = 0;

  setViewport(x: number, y: number, w: number, h: number) {
    this.viewport.set(x, y, w, h);
  }
  setScissor(x: number, y: number, w: number, h: number) {
    this.scissor.set(x, y, w, h);
  }
  setScissorTest(enabled: boolean) {
    this.scissorTest = enabled;
  }
  getViewport(target: Rect4Like) {
    return target.set(this.viewport.x, this.viewport.y, this.viewport.z, this.viewport.w);
  }
  getScissor(target: Rect4Like) {
    return target.set(this.scissor.x, this.scissor.y, this.scissor.z, this.scissor.w);
  }
  getScissorTest() {
    return this.scissorTest;
  }
  getPixelRatio() {
    return this.pixelRatio;
  }
  getDrawingBufferSize(target: Size2Like) {
    return target.set(
      Math.floor(this.cssWidth * this.pixelRatio),
      Math.floor(this.cssHeight * this.pixelRatio),
    );
  }
  /** Mirrors three.js:28535-28542, including the viewport reset. */
  setSize(width: number, height: number) {
    this.cssWidth = width;
    this.cssHeight = height;
    this.setSizeCalls++;
    this.viewport.set(0, 0, width, height);
  }
}

/** `THREE.WebGLRenderTarget` stand-in: plain fields, no setter methods. */
class FakeTarget implements ViewportTargetLike {
  viewport = vec4();
  scissor = vec4();
  scissorTest = false;
  divisor = 1;
  setSizeCalls = 0;

  constructor(
    public width: number,
    public height: number,
  ) {
    this.viewport.set(0, 0, width, height);
    this.scissor.set(0, 0, width, height);
  }

  /** Mirrors three.js:3290-3302, including the unconditional reset. */
  setSize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.setSizeCalls++;
    this.viewport.set(0, 0, width, height);
    this.scissor.set(0, 0, width, height);
  }
}

function harness(count: number, width: number, height: number, pixelRatio = 1) {
  const renderer = new FakeRenderer();
  renderer.pixelRatio = pixelRatio;
  const main = new FakeTarget(width * pixelRatio, height * pixelRatio);
  const mip = new FakeTarget(
    Math.floor((width * pixelRatio) / 2),
    Math.floor((height * pixelRatio) / 2),
  );
  // reference-post.js:66-74 creates and disposes mip targets as the plan
  // changes, so the applier resolves them per apply rather than caching a list.
  const targets: ViewportTargetLike[] = [main, mip];
  const app = new ViewportApplication({
    renderer,
    targets: () => targets,
  });
  return { renderer, main, mip, app, targets };
}

describe("ViewportApplication — initial application", () => {
  it("applies a rect to the renderer AND every post target", () => {
    const { renderer, main, mip, app } = harness(4, 1920, 1080);
    const rects = app.configure(4, 1920, 1080);

    expect(rects).toHaveLength(4);
    // Renderer: CSS pixels, bottom-left origin.
    expect([renderer.viewport.x, renderer.viewport.y, renderer.viewport.z, renderer.viewport.w]).toEqual(
      [0, 540, 960, 540],
    );
    expect(renderer.scissorTest).toBe(true);

    // `main` is full resolution, so its rect matches the renderer's.
    expect(main.scissorTest).toBe(true);
    expect([
      main.viewport.x,
      main.viewport.y,
      main.viewport.z,
      main.viewport.w,
    ]).toEqual([0, 540, 960, 540]);

    // The mip is HALF resolution (reference-post.js:79-84), so its rect is
    // half the size in target pixels. Getting this wrong is the classic
    // half-size-bloom bug.
    expect(mip.scissorTest).toBe(true);
    expect([mip.viewport.x, mip.viewport.y, mip.viewport.z, mip.viewport.w]).toEqual([
      0, 270, 480, 270,
    ]);

    expect(app.isApplied()).toBe(true);
  });

  it("scales the target rect by the pixel ratio but not the renderer's", () => {
    const { renderer, main, app } = harness(4, 1920, 1080, 2);
    app.configure(4, 1920, 1080);

    // The renderer takes CSS px and multiplies internally (three.js:28581).
    expect([renderer.viewport.x, renderer.viewport.y, renderer.viewport.z, renderer.viewport.w]).toEqual(
      [0, 540, 960, 540],
    );
    // A target's viewport is copied verbatim (three.js:29537), so the same
    // viewport must already be in drawing-buffer pixels.
    expect(main.width).toBe(3840);
    expect([
      main.viewport.x,
      main.viewport.y,
      main.viewport.z,
      main.viewport.w,
    ]).toEqual([0, 1080, 1920, 1080]);
  });

  it("moves to the next rect and stops scissoring on release", () => {
    const { renderer, main, app } = harness(4, 1920, 1080);
    app.configure(4, 1920, 1080);

    app.beginView(3);
    // Bottom-right viewport: GL y is 0.
    expect([renderer.viewport.x, renderer.viewport.y]).toEqual([960, 0]);
    expect(main.scissorTest).toBe(true);
    expect(app.isApplied()).toBe(true);

    // A non-split-screen draw (the donor's home preview) must not inherit a
    // stale scissor or it would be clipped to one quarter of the canvas.
    app.release();
    expect(renderer.scissorTest).toBe(false);
    expect([renderer.viewport.x, renderer.viewport.y, renderer.viewport.z, renderer.viewport.w]).toEqual(
      [0, 0, 1920, 1080],
    );
    expect(main.scissorTest).toBe(false);
    expect([main.viewport.x, main.viewport.y, main.viewport.z, main.viewport.w]).toEqual([
      0, 0, 1920, 1080,
    ]);
  });
});

describe("ViewportApplication — the setSize re-apply", () => {
  it("re-applies the active rect after renderer.setSize (three.js:28542)", () => {
    const { renderer, app } = harness(4, 1920, 1080);
    app.installResizeGuards();
    app.configure(4, 1920, 1080);
    app.beginView(2);

    // The donor's window-resize handler: startup.js:673-678.
    renderer.setSize(1280, 720);

    expect(renderer.setSizeCalls).toBe(1);
    // The reset that three.js:28542 performs is immediately undone. The guard
    // re-applies the geometry the applier currently holds; the host is still
    // responsible for calling resize() to re-tile at the new size.
    const rect = toGLViewport(app.getRects()[2], 1080);
    expect([renderer.viewport.x, renderer.viewport.y, renderer.viewport.z, renderer.viewport.w]).toEqual([
      rect.x,
      rect.y,
      rect.width,
      rect.height,
    ]);
    expect(renderer.scissorTest).toBe(true);
    expect(app.isApplied()).toBe(true);
  });

  it("re-applies after the post chain resizes `main` mid-render (reference-post.js:78)", () => {
    const { main, app } = harness(4, 1920, 1080);
    app.installResizeGuards();
    app.configure(4, 1920, 1080);
    app.beginView(0);

    // This is the nasty one: it happens INSIDE referencePost.render(), after
    // the view's viewport was applied, so per-view re-application at the top of
    // the frame would be too late for the first view on a resize frame.
    main.setSize(1920, 1080);
    expect(main.setSizeCalls).toBe(1);

    expect(main.scissorTest).toBe(true);
    expect([main.viewport.x, main.viewport.y, main.viewport.z, main.viewport.w]).toEqual([
      0, 540, 960, 540,
    ]);
    expect(app.isApplied()).toBe(true);
  });

  it("survives both resets in the order the donor produces them", () => {
    const { renderer, main, mip, app } = harness(4, 1920, 1080);
    app.installResizeGuards();
    app.configure(4, 1920, 1080);
    app.beginView(1);

    renderer.setSize(1280, 720); // startup.js:677
    // The host then re-derives the tiling for the new canvas, as it must.
    const rects = app.resize(1280, 720);
    main.setSize(1280, 720); // reference-post.js:78, inside the same frame
    mip.setSize(640, 360);
    app.beginView(1);

    for (const target of [main, mip]) {
      const expected = toTargetRect(rects[1], 720, target, { width: 1280, height: 720 });
      expect([
        target.viewport.x,
        target.viewport.y,
        target.viewport.z,
        target.viewport.w,
      ]).toEqual([expected.x, expected.y, expected.width, expected.height]);
      expect(target.scissorTest).toBe(true);
    }
    expect(app.isApplied()).toBe(true);
  });

  it("recomputes the tiling for the new size and stays gap-free", () => {
    const { renderer, app } = harness(4, 1920, 1080);
    app.installResizeGuards();
    app.configure(4, 1920, 1080);

    renderer.setSize(2560, 1440);
    const rects = app.resize(2560, 1440);

    expect(rects).toHaveLength(4);
    expect(rects[0]).toMatchObject({ x: 0, y: 0, width: 1280, height: 720 });
    // 2560*1440 fully accounted for.
    expect(rects.reduce((s, r) => s + r.width * r.height, 0)).toBe(2560 * 1440);
    expect(app.isApplied()).toBe(true);
  });

  it("detects drift when the guards are NOT installed — the check is not vacuous", () => {
    const { renderer, main, app } = harness(4, 1920, 1080);
    // Deliberately no installResizeGuards(), so renderer.setSize's reset stands.
    app.configure(4, 1920, 1080);
    app.beginView(0);
    expect(app.isApplied()).toBe(true);

    renderer.setSize(1280, 720);
    expect(renderer.viewport.x === 0 && renderer.viewport.y === 0).toBe(true);
    expect(app.isApplied()).toBe(false);

    // And reapply() is the public escape hatch for a host that resizes by some
    // route the guards do not cover.
    app.reapply();
    expect(app.isApplied()).toBe(true);
    void main;
  });

  it("repairs renderer state as a side effect of a guarded target resize", () => {
    // `applyCurrent` guards every target it touches, so a target resize repairs
    // the renderer too. Worth pinning: it is the difference between the first
    // view after a resize being correct or silently fullscreen.
    const { renderer, main, app } = harness(4, 1920, 1080);
    app.configure(4, 1920, 1080);
    app.beginView(0);

    renderer.setSize(1280, 720);
    expect(app.isApplied()).toBe(false);
    main.setSize(1280, 720); // guarded, because applyCurrent guarded it
    expect(app.isApplied()).toBe(true);
  });

  it("guards a post target that appears after install, as reference-post does", () => {
    // reference-post.js:66-74 creates `ao`, `halo`, `meter` lazily, so a target
    // can first be seen after installResizeGuards() has already run.
    const { app, targets } = harness(4, 1920, 1080);
    app.installResizeGuards();
    app.configure(4, 1920, 1080);

    const late = new FakeTarget(1920, 1080);
    targets.push(late);
    app.beginView(2);

    late.setSize(1920, 1080);
    expect(late.scissorTest).toBe(true);
    // rect[2] of a 4-way 1920x1080 split is the BOTTOM-LEFT quadrant:
    // x 0, GL y 0, 960x540.
    expect([late.viewport.x, late.viewport.y, late.viewport.z, late.viewport.w]).toEqual([
      0, 0, 960, 540,
    ]);
  });

  it("is idempotent when a view is begun twice", () => {
    const { renderer, app } = harness(4, 1920, 1080);
    app.configure(4, 1920, 1080);
    app.beginView(1);
    const before = { ...renderer.viewport };
    app.beginView(1);
    expect({ ...renderer.viewport }).toEqual(before);
    expect(app.isApplied()).toBe(true);
  });

  it("agrees with the pure geometry it was given", () => {
    const { app } = harness(3, 1920, 1080);
    const rects = app.configure(3, 1920, 1080);
    expect([...app.getRects()]).toEqual(computeViewportRects(3, 1920, 1080));
    expect(rects.map((r) => r.playerId)).toEqual([null, null, null]);
  });
});
