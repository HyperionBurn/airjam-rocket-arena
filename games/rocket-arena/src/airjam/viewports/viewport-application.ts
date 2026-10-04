/**
 * Phase 4 — VIEWPORT APPLICATION (the renderer + post-target half).
 *
 * OWNER: the Phase 4 worker (`src/airjam/viewports/**`).
 *
 * ---------------------------------------------------------------------------
 * THE MECHANISM (all verified in the vendored Three r185)
 * ---------------------------------------------------------------------------
 * The donor has no EffectComposer. Post is a custom chain over a
 * `WebGLRenderTarget` named `main` plus lazily-created mip targets
 * (`reference-post.js:65-144`). Three r185 pushes a render target's OWN
 * viewport/scissor/scissorTest into GL state on every bind:
 *
 *   three.js:29537-29539  `de.copy(P.viewport); pe.copy(P.scissor); Se = P.scissorTest;`
 *   three.js:29547-29549  `b.viewport(de); b.scissor(pe); b.setScissorTest(Se);`
 *
 * so setting them on the target confines the scene render AND every pass of
 * the post chain, with no shader edits. The final composite
 * (`reference-post.js:142`, `this.pass('postFragment', main, previous)`) goes to
 * the screen, where the RENDERER's own viewport is used instead
 * (`three.js:29540-29543`, reading the stored `We`/`ft` from
 * `setViewport`/`setScissor`). Both must be set, which is what
 * `beginView` does.
 *
 * Note the two units differ, and mixing them is the easiest way to get a
 * quarter-size render: the renderer multiplies by the pixel ratio itself
 * (`three.js:28581`, `28588`) so it takes CSS pixels, while a target's
 * viewport is copied verbatim and its size is the drawing buffer
 * (`reference-post.js:76-78`). `toTargetRect` handles the conversion.
 *
 * Also note `RenderTarget` exposes `viewport`/`scissor`/`scissorTest` as plain
 * public fields (constructor at `three.js:3231-3233`) and has NO setter
 * methods, unlike the renderer. That is why `applyToTarget` assigns the fields
 * rather than calling a method that does not exist.
 *
 * ---------------------------------------------------------------------------
 * THE setSize TRAP, AND WHY `reapply` CANNOT BE FORGOTTEN
 * ---------------------------------------------------------------------------
 * Two independent places reset the viewport to the full canvas:
 *
 *  1. `renderer.setSize(w, h, updateStyle)` ends with
 *     `this.setViewport(0, 0, w, h)` (`three.js:28542`). The donor calls it at
 *     init (`startup.js:600`) and in its window-resize handler
 *     (`startup.js:673-678`).
 *  2. `RenderTarget.setSize` ends with
 *     `this.viewport.set(0, 0, e, t), this.scissor.set(0, 0, e, t)`
 *     (`three.js:3302`) — and `reference-post.js:78` calls
 *     `main.setSize(drawingBufferWidth, drawingBufferHeight)` from INSIDE
 *     `render()`, whenever the drawing buffer size changed.
 *
 * (2) is the one that bites: it fires in the middle of a view's own render
 * call, so simply re-applying at the top of each view is not enough for the
 * first view after a resize. Both are therefore handled by the same mechanism:
 * an INSTANCE-level guard that re-applies the current rect immediately after
 * the reset. This patches the renderer's and the target's own methods on the
 * live objects — it does not touch donor source, and the donor's behaviour is
 * otherwise unchanged. `reapply()` stays public for a host that resizes through
 * some other route.
 *
 * Re-applying is cheap: Three only pushes GL state when it differs
 * (`b.viewport(...)` on the state cache), so doing it once per view per frame
 * is free, and `beginView` skips the work when the rect is unchanged.
 */

import {
  computeViewportRects,
  toGLViewport,
  toTargetRect,
  type BufferSize,
  type ViewportLayoutName,
  type ViewportRect,
} from "./layouts.js";

/* -------------------------------------------------------------------------- */
/* Structural types. Deliberately NOT Three.js types, so this module and its   */
/* tests import and run with no WebGL, no GL context and no donor.            */
/* -------------------------------------------------------------------------- */

/** `THREE.Vector4` — a rect in a render target. */
export interface Rect4Like {
  x: number;
  y: number;
  z: number;
  w: number;
  set(x: number, y: number, z: number, w: number): unknown;
}

/** `THREE.Vector2` — a size. */
export interface Size2Like {
  x: number;
  y: number;
  set(x: number, y: number): unknown;
}
/**
 * The subset of `THREE.WebGLRenderTarget` this layer needs. These are FIELD
 * assignments, not method calls: `RenderTarget` has no `setViewport`.
 */
export interface ViewportTargetLike {
  viewport: Rect4Like;
  scissor: Rect4Like;
  scissorTest: boolean;
  width: number;
  height: number;
  setSize(width: number, height: number, depth?: number): unknown;
}

/** The subset of `THREE.WebGLRenderer` this layer needs. These ARE methods. */
export interface ViewportRendererLike {
  setViewport(x: number, y: number, width: number, height: number): unknown;
  setScissor(x: number, y: number, width: number, height: number): unknown;
  setScissorTest(enabled: boolean): unknown;
  getViewport(target: Rect4Like): unknown;
  getScissor(target: Rect4Like): unknown;
  getScissorTest(): boolean;
  getDrawingBufferSize(target: Size2Like): unknown;
  setSize(width: number, height: number, updateStyle?: boolean): unknown;
}

export interface ViewportApplicationOptions {
  readonly renderer: ViewportRendererLike;
  /**
   * Resolver for every render target the post chain will touch. A function, not
   * an array, because `reference-post.js:66-74` creates and disposes mip targets
   * (`ao`, `aoTemp`, `halo`, `meter`, ...) as the plan changes, so the list is
   * only known at apply time.
   */
  readonly targets: () => Iterable<ViewportTargetLike>;
}

const rectEq = (a: Rect4Like, b: Rect4Like): boolean =>
  a.x === b.x && a.y === b.y && a.z === b.z && a.w === b.w;

/**
 * A `THREE.Vector4` stand-in for the read-back probes.
 *
 * `getViewport`/`getScissor` on the real renderer write into whatever Vector4
 * they are handed (`three.js:28576-28578`, `28583-28585`), so this layer must
 * own its probes rather than ask the caller to supply them — and the probe
 * needs a real `set`, which a plain object literal does not have.
 */
function makeRect4Probe(): Rect4Like {
  return {
    x: 0,
    y: 0,
    z: 0,
    w: 0,
    set(x: number, y: number, z: number, w: number) {
      this.x = x;
      this.y = y;
      this.z = z;
      this.w = w;
      return this;
    },
  };
}

/**
 * Applies one rect at a time to the renderer and to every post target, and
 * makes the rect survive any `setSize` that happens underneath it.
 */
export class ViewportApplication {
  private readonly renderer: ViewportRendererLike;
  private readonly resolveTargets: () => Iterable<ViewportTargetLike>;

  private rects: ViewportRect[] = [];
  private canvasWidth = 0;
  private canvasHeight = 0;
  private count = 0;
  private layout: ViewportLayoutName | undefined;

  private activeIndex = -1;
  private guardsInstalled = false;
  private readonly guardedTargets = new Set<ViewportTargetLike>();
  private readonly viewportProbe = makeRect4Probe();
  private readonly scissorProbe = makeRect4Probe();

  constructor(options: ViewportApplicationOptions) {
    this.renderer = options.renderer;
    this.resolveTargets = options.targets;
  }

  /**
   * Set the viewport count / canvas size / layout and apply the first rect.
   * Returns the rects so the caller can build cameras and HUD from the same
   * geometry the renderer is actually using.
   */
  configure(
    count: number,
    width: number,
    height: number,
    layout?: ViewportLayoutName,
  ): ViewportRect[] {
    this.count = count;
    this.canvasWidth = Math.floor(width);
    this.canvasHeight = Math.floor(height);
    this.layout = layout;
    this.rects = computeViewportRects(count, this.canvasWidth, this.canvasHeight, layout);
    this.activeIndex = -1;
    this.beginView(0);
    return this.rects;
  }

  /** The rects currently in force. Empty until `configure`. */
  getRects(): readonly ViewportRect[] {
    return this.rects;
  }

  getViewportCount(): number {
    return this.count;
  }

  getActiveIndex(): number {
    return this.activeIndex;
  }

  /**
   * Recompute the same layout for a new canvas size — the call to make from the
   * donor's window-resize handler (`startup.js:673-678`) immediately after
   * `renderer.setSize`.
   */
  resize(width: number, height: number, layout?: ViewportLayoutName): ViewportRect[] {
    return this.configure(this.count, width, height, layout ?? this.layout);
  }

  /**
   * Confine the renderer and every post target to rect `index` and return the
   * camera that view should render with. Idempotent and cheap: re-calling with
   * the same index is a no-op, and the Three state cache means even a real
   * change pushes no GL commands until something actually differs.
   */
  beginView(index: number): ViewportRect | null {
    const rect = this.rects[index];
    if (!rect) return null;
    if (this.activeIndex !== index) {
      this.activeIndex = index;
      this.applyCurrent();
    }
    return rect;
  }

  /** Like `beginView`, for callers holding a rect rather than an index. */
  beginRect(rect: ViewportRect): ViewportRect {
    const index = this.rects.indexOf(rect);
    if (index >= 0) this.beginView(index);
    return rect;
  }

  /**
   * Re-apply the active rect. Public because a host may resize the canvas
   * through a route the guards do not cover; idempotent.
   */
  reapply(): void {
    if (this.activeIndex < 0) return;
    this.applyCurrent();
  }

  /**
   * Hand the canvas back: full-canvas viewport, scissor test OFF.
   *
   * This matters more than it looks. The donor renders a home/menu preview
   * through the same renderer (`renderHomePreview`), and leaving a stale scissor
   * test enabled would clip that full-screen draw to a quarter of the canvas.
   * Any non-split-screen draw must be bracketed by `release`.
   */
  release(): void {
    this.activeIndex = -1;
    this.renderer.setScissorTest(false);
    this.renderer.setScissor(0, 0, this.canvasWidth, this.canvasHeight);
    this.renderer.setViewport(0, 0, this.canvasWidth, this.canvasHeight);
    for (const target of this.targets()) {
      target.scissorTest = false;
      target.scissor.set(0, 0, target.width, target.height);
      target.viewport.set(0, 0, target.width, target.height);
    }
  }

  /**
   * True when the renderer and every post target currently carry the active
   * rect. Cheap enough to assert per frame in a dev build; it is how a
   * regression in the re-apply path announces itself instead of silently
   * rendering one player fullscreen.
   */
  isApplied(): boolean {
    const rect = this.rects[this.activeIndex];
    if (!rect) return true;
    if (!this.rendererRectMatches(rect)) return false;
    const canvasCss: BufferSize = { width: this.canvasWidth, height: this.canvasHeight };
    for (const target of this.targets()) {
      if (!targetRectMatches(target, rect, this.canvasHeight, canvasCss)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Install the resize guards. Idempotent.
   *
   * `renderer.setSize` and every `target.setSize` are wrapped so the active
   * rect is restored the instant the reset happens. This is what makes the
   * `reference-post.js:78` in-render resize survivable: the very first view
   * after a resize is correct, not just every view after it.
   */
  installResizeGuards(): void {
    if (this.guardsInstalled) return;
    this.guardsInstalled = true;

    const renderer = this.renderer as ViewportRendererLike & {
      setSize: (...args: unknown[]) => unknown;
    };
    const originalSetSize = renderer.setSize.bind(renderer) as (...args: unknown[]) => unknown;
    renderer.setSize = (...args: unknown[]) => {
      const result = originalSetSize(...args);
      this.reapply();
      return result;
    };

    for (const target of this.targets()) this.guardTarget(target);
  }

  /**
   * Guard one render target's `setSize`. Separate from `installResizeGuards`
   * because `reference-post.js` creates mip targets lazily, so new ones appear
   * after install; call this for each new target (or rely on `applyCurrent`,
   * which touches every live target on each view anyway).
   */
  guardTarget(target: ViewportTargetLike): void {
    if (this.guardedTargets.has(target)) return;
    this.guardedTargets.add(target);
    const original = target.setSize.bind(target) as (...args: unknown[]) => unknown;
    const self = this;
    (target as { setSize: (...args: unknown[]) => unknown }).setSize = (...args: unknown[]) => {
      const result = original(...args);
      self.reapply();
      return result;
    };
  }

  /* ------------------------------------------------------------------ */

  private targets(): ViewportTargetLike[] {
    const list: ViewportTargetLike[] = [];
    for (const target of this.resolveTargets()) {
      if (target) list.push(target);
    }
    return list;
  }

  private applyCurrent(): void {
    const rect = this.rects[this.activeIndex];
    if (!rect) return;
    const gl = toGLViewport(rect, this.canvasHeight);
    const canvasCss: BufferSize = { width: this.canvasWidth, height: this.canvasHeight };

    this.renderer.setViewport(gl.x, gl.y, gl.width, gl.height);
    this.renderer.setScissor(gl.x, gl.y, gl.width, gl.height);
    this.renderer.setScissorTest(true);

    for (const target of this.targets()) {
      this.guardTarget(target);
      const t = toTargetRect(rect, this.canvasHeight, target, canvasCss);
      target.viewport.set(t.x, t.y, t.width, t.height);
      target.scissor.set(t.x, t.y, t.width, t.height);
      target.scissorTest = true;
    }
  }

  private rendererRectMatches(rect: ViewportRect): boolean {
    const expected = toGLViewport(rect, this.canvasHeight);
    this.renderer.getViewport(this.viewportProbe);
    const viewport = this.viewportProbe;
    if (viewport.x !== expected.x || viewport.y !== expected.y) return false;
    if (viewport.z !== expected.width || viewport.w !== expected.height) return false;
    this.renderer.getScissor(this.scissorProbe);
    if (!rectEq(this.scissorProbe, viewport)) return false;
    return this.renderer.getScissorTest() === true;
  }
}

function targetRectMatches(
  target: ViewportTargetLike,
  rect: ViewportRect,
  canvasCssHeight: number,
  canvasCssSize: BufferSize,
): boolean {
  const expected = toTargetRect(rect, canvasCssHeight, target, canvasCssSize);
  if (target.scissorTest !== true) return false;
  return (
    target.viewport.x === expected.x &&
    target.viewport.y === expected.y &&
    target.viewport.z === expected.width &&
    target.viewport.w === expected.height
  );
}
