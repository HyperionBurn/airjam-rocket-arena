/**
 * The per-player camera pool.
 *
 * The invariant under test is the one the seam states most forcefully
 * (`seam.ts:248`): every viewport gets its own camera and its own ball-cam
 * toggle, and camera mode is NEVER shared between players. These fakes stand in
 * for the donor's `PerspectiveCamera` so the test needs no WebGL; the donor
 * `ChaseCamera` class itself is exercised as the real implementation.
 */
import { describe, expect, it } from "vitest";
import { computeViewportRects } from "../layouts.js";
import { PlayerViewPool, type TransformLike, type Vec3Like } from "../camera-pool.js";
import type { ViewKernel } from "../view-kernel.js";

/** A `THREE.Vector3` stand-in with a chainable `set`, like the real one. */
function vec3(x = 0, y = 0, z = 0): Vec3Like {
  return {
    x,
    y,
    z,
    set(nx: number, ny: number, nz: number) {
      this.x = nx;
      this.y = ny;
      this.z = nz;
      return this;
    },
  };
}

const transform = (x = 0, y = 0, z = 0): TransformLike => ({
  position: vec3(x, y, z),
  quaternion: { x: 0, y: 0, z: 0, w: 1 },
});

/**
 * A kernel that behaves like the donor's: DESTRUCTIVE, one slot of state, and it
 * records how many times it was stepped. Modelling the shared-solver hazard
 * faithfully is the point — `PlayerViewPool` must route around it.
 */
class SharedKernel implements ViewKernel {
  stepCount = 0;
  resetCount = 0;
  private output = new Float64Array(42);

  stepView(input: Float64Array): Float64Array {
    this.stepCount++;
    const out = this.output;
    out.set(input.subarray(0, 32));
    // A real solver returns its own smoothed state here.
    out[32] = 0;
    out[33] = 270;
    out[34] = -270;
    out[35] = 0;
    out[36] = 0;
    out[37] = 1;
    out[38] = 0;
    out[39] = 1;
    out[40] = 0;
    out[41] = input[21];
    return out;
  }

  resetView(): void {
    this.resetCount++;
  }
}

describe("PlayerViewPool", () => {
  it("gives every player their own camera instance", () => {
    const kernel = new SharedKernel();
    const pool = new PlayerViewPool(kernel);
    const rects = computeViewportRects(4, 1920, 1080);

    const views = rects.map((rect, i) => pool.acquire(`p${i}`, i, rect));
    expect(views).toHaveLength(4);

    // Four distinct donor instances, each with its own PerspectiveCamera.
    const cameras = views.map((v) => v.camera);
    expect(new Set(cameras).size).toBe(4);
    const objects = views.map((v) => (v.camera as { camera: unknown }).camera);
    expect(new Set(objects).size).toBe(4);
  });

  it("never shares ball-cam state between players", () => {
    const kernel = new SharedKernel();
    const pool = new PlayerViewPool(kernel);
    const rects = computeViewportRects(4, 1920, 1080);
    rects.forEach((rect, i) => pool.acquire(`p${i}`, i, rect));

    pool.setBallCam("p1", false);
    pool.setBallCam("p2", true);

    expect(pool.ballCamOf("p0")).toBe(true);
    expect(pool.ballCamOf("p1")).toBe(false);
    expect(pool.ballCamOf("p2")).toBe(true);
    expect(pool.ballCamOf("p3")).toBe(true);
    // And the seam's PlayerView agrees.
    expect(pool.viewOf("p1")!.ballCam).toBe(false);
    expect(pool.viewOf("p2")!.ballCam).toBe(true);
    // The flag lives on each view's own donor instance.
    expect((pool.viewOf("p0")!.camera as { ballCam: boolean }).ballCam).toBe(true);
    expect((pool.viewOf("p1")!.camera as { ballCam: boolean }).ballCam).toBe(false);
  });

  it("toggles one player without disturbing the others", () => {
    const pool = new PlayerViewPool(new SharedKernel());
    const rects = computeViewportRects(2, 1920, 1080);
    pool.acquire("a", 0, rects[0]);
    pool.acquire("b", 1, rects[1]);

    expect(pool.toggleBallCam("a")).toBe(false);
    expect(pool.ballCamOf("a")).toBe(false);
    expect(pool.ballCamOf("b")).toBe(true);
    expect(pool.toggleBallCam("a")).toBe(true);
    expect(pool.ballCamOf("b")).toBe(true);
  });

  it("drives each view from that player's own car, routing around the one solver", () => {
    const kernel = new SharedKernel();
    const pool = new PlayerViewPool(kernel);
    const rects = computeViewportRects(2, 1920, 1080);
    pool.acquire("a", 0, rects[0]);
    pool.acquire("b", 1, rects[1]);

    expect(pool.updateView("a", transform(0, 0, 0), transform(0, 100, 0), 1 / 60, null)).toBe(true);
    expect(pool.updateView("b", transform(500, 0, 500), transform(0, 100, 0), 1 / 60, null)).toBe(true);
    expect(pool.updateView("nobody", transform(), transform(), 0, null)).toBe(false);

    // BOTH views were driven, but the donor's single WASM solver was stepped
    // exactly ONCE. Player "a" holds it; player "b" is mirrored. If this were 2,
    // both players would be reading one shared solver state — the exact bug the
    // kernel seam exists to prevent.
    expect(kernel.stepCount).toBe(1);
  });

  it("gives the WASM kernel to exactly one view and mirrors the rest", () => {
    // The donor has ONE view solver (see view-kernel.ts), so handing it to more
    // than one view would make them all read the same numbers.
    const kernel = new SharedKernel();
    const pool = new PlayerViewPool(kernel);
    const rects = computeViewportRects(4, 1920, 1080);
    rects.forEach((rect, i) => pool.acquire(`p${i}`, i, rect));

    expect(pool.exactViewCount()).toBe(1);
    expect(pool.cameraOf("p0")!.exact).toBe(true);
    expect(pool.cameraOf("p1")!.exact).toBe(false);
    // And the mirrored views' kernels are distinct objects, not the donor's.
    expect(pool.cameraOf("p1")!.kernel).not.toBe(pool.cameraOf("p2")!.kernel);
    expect(pool.cameraOf("p1")!.kernel).not.toBe(pool.cameraOf("p0")!.kernel);
  });

  it("can be configured to mirror every view, for uniform player experience", () => {
    const pool = new PlayerViewPool(new SharedKernel(), { exactViews: 0 });
    const rects = computeViewportRects(2, 1920, 1080);
    rects.forEach((rect, i) => pool.acquire(`p${i}`, i, rect));
    expect(pool.exactViewCount()).toBe(0);
  });

  it("rejects a nonsense exactViews", () => {
    expect(() => new PlayerViewPool(new SharedKernel(), { exactViews: -1 })).toThrow(RangeError);
    expect(() => new PlayerViewPool(new SharedKernel(), { exactViews: 1.5 })).toThrow(RangeError);
  });

  it("sets each camera's aspect to its OWN rect, not the canvas", () => {
    // The donor uses the canvas aspect (startup.js:308, :675). At 4-way 1080p
    // that happens to be right, but a 2-way split gives 960x1080 columns, and
    // feeding them 16:9 shears the image.
    const pool = new PlayerViewPool(new SharedKernel());
    const rects = computeViewportRects(2, 1920, 1080);
    pool.acquire("a", 0, rects[0]);
    pool.acquire("b", 1, rects[1]);

    const cameraA = (pool.viewOf("a")!.camera as { camera: { aspect: number } }).camera;
    expect(cameraA.aspect).toBeCloseTo(960 / 1080, 6);
    expect(cameraA.aspect).not.toBeCloseTo(1920 / 1080, 3);
  });

  it("reuses a player's camera across a rebind, and drops it on release", () => {
    const kernel = new SharedKernel();
    const pool = new PlayerViewPool(kernel);
    const rects = computeViewportRects(2, 1920, 1080);

    const first = pool.acquire("a", 0, rects[0]);
    const again = pool.acquire("a", 0, rects[1]);
    expect(again).toBe(first);
    expect(pool.views()).toHaveLength(1);

    pool.release("a");
    expect(pool.views()).toHaveLength(0);
    // Releasing drops the follow state so a rejoining player does not inherit a
    // camera still flying in from a car they no longer drive.
    expect(kernel.resetCount).toBeGreaterThan(0);
  });

  it("hands out views in acquisition order and empties on dispose", () => {
    const pool = new PlayerViewPool(new SharedKernel());
    const rects = computeViewportRects(2, 1920, 1080);
    pool.acquire("a", 0, rects[0]);
    pool.acquire("b", 1, rects[1]);
    expect(pool.views().map((v) => v.playerId)).toEqual(["a", "b"]);

    pool.dispose();
    expect(pool.views()).toHaveLength(0);
    expect(pool.viewOf("a")).toBeNull();
  });
});
