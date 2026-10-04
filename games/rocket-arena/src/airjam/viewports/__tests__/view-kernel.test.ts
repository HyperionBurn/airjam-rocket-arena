/**
 * The view-kernel seam, including the mirrored solver.
 *
 * The mirror is the part of Phase 4 most entitled to distrust — it stands in for
 * an opaque WASM export — so it is tested here in isolation, with no Three.js
 * and no donor in the graph. The two properties that matter are that it honours
 * the donor's 32-in / 42-out ABI, and that it is genuinely PER INSTANCE, which
 * is the whole reason it exists.
 */
import { describe, expect, it } from "vitest";
import {
  assertViewAbi,
  DONOR_CAMERA_SETTINGS,
  MirroredViewKernel,
  VIEW_IN,
  VIEW_INPUT_FLOATS,
  VIEW_OUT,
  VIEW_OUTPUT_FLOATS,
  type ViewKernel,
} from "../view-kernel.js";

/** Build the donor's 32-float input from readable named fields. */
function makeInput(overrides: Partial<Record<keyof typeof VIEW_IN, number>> = {}): Float64Array {
  const input = new Float64Array(VIEW_INPUT_FLOATS);
  input[VIEW_IN.delta] = 1 / 60;
  input[VIEW_IN.ballCam] = 1;
  input[VIEW_IN.carPosition] = 0;
  input[VIEW_IN.carPosition + 1] = 0;
  input[VIEW_IN.carPosition + 2] = 0;
  // Identity quaternion.
  input[VIEW_IN.carQuaternion + 3] = 1;
  input[VIEW_IN.ballPosition] = 0;
  input[VIEW_IN.ballPosition + 1] = 0;
  input[VIEW_IN.ballPosition + 2] = 0;
  input[VIEW_IN.fov] = DONOR_CAMERA_SETTINGS.fov;
  input[VIEW_IN.distance] = DONOR_CAMERA_SETTINGS.distance;
  input[VIEW_IN.height] = DONOR_CAMERA_SETTINGS.height;
  input[VIEW_IN.angleDeg] = DONOR_CAMERA_SETTINGS.angleDeg;
  input[VIEW_IN.stiffness] = DONOR_CAMERA_SETTINGS.stiffness;
  input[VIEW_IN.transitionSpeed] = DONOR_CAMERA_SETTINGS.transitionSpeed;
  input[VIEW_IN.aspect] = 16 / 9;
  input[VIEW_IN.swivelSpeed] = DONOR_CAMERA_SETTINGS.swivelSpeed;
  input[VIEW_IN.invertSwivel] = 1;
  for (const [key, value] of Object.entries(overrides)) {
    input[VIEW_IN[key as keyof typeof VIEW_IN]] = value;
  }
  return input;
}

const pos = (out: Float64Array) => [
  out[VIEW_OUT.position],
  out[VIEW_OUT.position + 1],
  out[VIEW_OUT.position + 2],
];
const dir = (out: Float64Array) => [
  out[VIEW_OUT.direction],
  out[VIEW_OUT.direction + 1],
  out[VIEW_OUT.direction + 2],
];
const up = (out: Float64Array) => [
  out[VIEW_OUT.up],
  out[VIEW_OUT.up + 1],
  out[VIEW_OUT.up + 2],
];
const len = (v: number[]) => Math.hypot(v[0], v[1], v[2]);

describe("the donor ABI", () => {
  it("is 32 floats in, 42 out, with the donor's own offsets", () => {
    // camera.js: `Aw = 32`, `Sc = 32`, `wc = 35`, `Mc = 38`, `lw = 41`.
    expect(VIEW_INPUT_FLOATS).toBe(32);
    expect(VIEW_OUTPUT_FLOATS).toBe(42);
    expect(VIEW_OUT).toEqual({ position: 32, direction: 35, up: 38, fov: 41 });
  });

  it("mirrors the donor's Ps feel parameters", () => {
    // camera.js:4-14
    expect(DONOR_CAMERA_SETTINGS).toEqual({
      cameraShake: false,
      fov: 110,
      distance: 270,
      height: 100,
      angleDeg: -3,
      stiffness: 0.35,
      swivelSpeed: 4,
      transitionSpeed: 1,
      invertSwivel: true,
    });
  });

  it("rejects an input buffer of the wrong width", () => {
    expect(() => assertViewAbi(new Float64Array(32))).not.toThrow();
    expect(() => assertViewAbi(new Float64Array(31))).toThrow(RangeError);
  });
});

describe("MirroredViewKernel", () => {
  it("satisfies the ViewKernel contract", () => {
    const kernel: ViewKernel = new MirroredViewKernel();
    expect(typeof kernel.stepView).toBe("function");
    expect(typeof kernel.resetView).toBe("function");
  });

  it("returns 42 floats at the donor's output offsets", () => {
    const out = new MirroredViewKernel().stepView(makeInput());
    expect(out.length).toBe(VIEW_OUTPUT_FLOATS);
    expect(Number.isFinite(out[VIEW_OUT.fov])).toBe(true);
  });

  it("emits unit vectors for direction and up", () => {
    const out = new MirroredViewKernel().stepView(makeInput());
    expect(len(dir(out))).toBeCloseTo(1, 6);
    expect(len(up(out))).toBeCloseTo(1, 6);
    // up must stay perpendicular to the view direction or lookAt gimbal-locks.
    const d = dir(out);
    const u = up(out);
    expect(d[0] * u[0] + d[1] * u[1] + d[2] * u[2]).toBeCloseTo(0, 6);
  });

  it("places the camera behind and above the car, not on it", () => {
    // Car at the origin facing +Z, so "behind" is -Z. This is a donor-parameter
    // offset, but a real one: the point is that the camera is NOT
    // `position = car.position + offset` with a zero result.
    const out = new MirroredViewKernel().stepView(makeInput());
    const p = pos(out);
    expect(len(p)).toBeGreaterThan(200);
    expect(p[1]).toBeGreaterThan(0); // raised by `height`
    expect(p[2]).toBeLessThan(0); // behind the car
  });

  it("follows a moving car instead of snapping to it", () => {
    const kernel = new MirroredViewKernel();
    kernel.stepView(makeInput());

    // The car jumps far away; a stiffness-driven follow must lag behind it.
    const moved = makeInput();
    moved[VIEW_IN.carPosition] = 5000;
    const out = kernel.stepView(moved);
    expect(pos(out)[0]).toBeLessThan(5000);
    expect(pos(out)[0]).toBeGreaterThan(0);
  });

  it("snaps on the first solve rather than easing in from the origin", () => {
    // The donor itself calls update with delta 0 at startup.js:800 and :1093.
    const out = new MirroredViewKernel().stepView(makeInput({ delta: 0 }));
    const p = pos(out);
    expect(len(p)).toBeGreaterThan(200);
  });

  it("is PER INSTANCE — two kernels tracking two cars do not interfere", () => {
    // The donor's `_v1` is a WASM singleton, so this is precisely the property
    // the donor cannot provide and the reason the mirror exists.
    const a = new MirroredViewKernel();
    const b = new MirroredViewKernel();

    const inputA = makeInput();
    inputA[VIEW_IN.carPosition] = 1000;
    const inputB = makeInput();
    inputB[VIEW_IN.carPosition] = -4000;

    const outA = a.stepView(inputA);
    const outB = b.stepView(inputB);

    expect(pos(outA)[0]).toBeGreaterThan(0);
    expect(pos(outB)[0]).toBeLessThan(0);
  });

  it("gives each instance independent swivel state", () => {
    const a = new MirroredViewKernel();
    const b = new MirroredViewKernel();

    const look = makeInput({ lookX: 1, lookY: 1 });
    a.stepView(look);
    a.stepView(look);
    const dirA = dir(a.stepView(look));

    const fresh = makeInput();
    const dirB = dir(b.stepView(fresh));

    // Same kernel maths, different accumulated swivel, different direction.
    expect(dirA).not.toEqual(dirB);
  });

  it("widen the fov with speed and keep the base fov when slow", () => {
    const slow = new MirroredViewKernel().stepView(makeInput());
    expect(slow[VIEW_OUT.fov]).toBeCloseTo(DONOR_CAMERA_SETTINGS.fov, 6);

    const fast = makeInput();
    fast[VIEW_IN.velocity] = 100000;
    const fastOut = new MirroredViewKernel().stepView(fast);
    expect(fastOut[VIEW_OUT.fov]).toBeGreaterThan(DONOR_CAMERA_SETTINGS.fov);
  });

  it("clamps the camera to minHeight, its only wall/ceiling response", () => {
    // There is nothing to mirror for the donor's arena bounds: that logic is
    // inside the opaque `_v1`. This is a floor clamp and nothing more.
    const kernel = new MirroredViewKernel({ minHeight: 30 });
    const dropped = makeInput();
    dropped[VIEW_IN.carPosition + 1] = -10000;
    expect(pos(kernel.stepView(dropped))[1]).toBeGreaterThanOrEqual(30);
  });

  it("resetView drops the follow state so a new view does not fly in", () => {
    const kernel = new MirroredViewKernel();
    const moved = makeInput();
    moved[VIEW_IN.carPosition] = 5000;
    kernel.stepView(moved);
    kernel.stepView(moved);

    kernel.resetView();
    const out = kernel.stepView(makeInput());
    // Back at the origin car, i.e. snapped, not 5000 units away.
    expect(Math.abs(pos(out)[0])).toBeLessThan(500);
  });

  it("never emits NaN for any donor setting combination", () => {
    for (const ballCam of [0, 1]) {
      for (const supersonic of [0, 1]) {
        for (const onGround of [0, 1]) {
          const input = makeInput({ ballCam, supersonic, onGround });
          const out = new MirroredViewKernel().stepView(input);
          for (let i = VIEW_OUT.position; i < VIEW_OUTPUT_FLOATS; i++) {
            expect(Number.isFinite(out[i]), `index ${i}`).toBe(true);
          }
        }
      }
    }
  });
});
