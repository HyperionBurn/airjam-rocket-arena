/**
 * Phase 4 — THE VIEW-KERNEL SEAM.
 *
 * OWNER: the Phase 4 worker (`src/airjam/viewports/**`).
 *
 * ===========================================================================
 * THE FINDING THAT SHAPES THIS WHOLE MODULE
 * ===========================================================================
 * `ChaseCamera`'s second constructor argument is a "kernel" and the donor passes
 * it the PHYSICS SIMULATION, not a camera helper:
 *
 *   startup.js:308   H = new ChaseCamera(window.innerWidth / window.innerHeight, n)
 *                   ...where `n` is the single `PhysicsSimulation` instance.
 *
 * The kernel is used in exactly two places (camera.js:37, camera.js:94):
 *
 *   constructor:  this.kernel.resetView()
 *   update():     const o = this.kernel.stepView(s)
 *
 * and both land in the WASM module behind ONE buffer and ONE entry point:
 *
 *   simulation.js:62   this.viewPtr = this.module._v0()   // ONE malloc, 42 f64
 *   simulation.js:154-161  stepView(e) { ...set(e, 0); this.module._v1(); return this.viewView; }
 *   simulation.js:163-165  resetView() { this.module._v2(); this.viewView = null; }
 *   vendor/legacy-physics.js:5189-5191   _v0/_v1/_v2  are single minified exports
 *
 * So the camera smoothing — the part that uses `stiffness` and
 * `transitionSpeed` — lives in WASM GLOBAL state, and `ChaseCamera` keeps no
 * per-instance copy of it (its only fields are the input buffer, two
 * `Vector3`s it OVERWRITES from the output, and the settings it feeds in).
 * There is exactly ONE view solver, and `stepView` is destructive: it writes the
 * input into the shared buffer and returns the shared 42-float output.
 *
 * CONSEQUENCE, stated plainly: a second `ChaseCamera` instance constructs
 * cleanly and gets its own `PerspectiveCamera` and its own `ballCam` flag, but
 * it CANNOT have independent smoothing. Two instances sharing one kernel do not
 * produce two cameras — the second `stepView` overwrites the first's result and
 * both instances read the same numbers.
 *
 * That is why this file exists in two halves:
 *
 *  - `DonorViewKernel`     the real thing. EXACT donor feel. One camera only.
 *  - `MirroredViewKernel`  a pure-JS reimplementation of the smoothing contract
 *                          for the remaining viewports. It is an APPROXIMATION
 *                          and every view it drives is reported as approximate
 *                          so no caller can mistake it for the donor's solver.
 *
 * This is reported rather than hidden; see the Phase 4 hand-off. Nothing here
 * edits donor source, and `MirroredViewKernel` is not claimed to match `_v1`
 * pixel-for-pixel — that is not verifiable from a minified export.
 *
 * ===========================================================================
 * THE 32-FLOAT INPUT / 42-FLOAT OUTPUT ABI (camera.js:45-103)
 * ===========================================================================
 * The donor packs a fixed 32-float input and reads a 42-float output, where
 * the output IS the input buffer extended by 10 floats. Constants are the
 * donor's own: `Aw = 32`, `Sc = 32`, `wc = 35`, `Mc = 38`, `lw = 41`.
 *
 *   IN  0        delta (seconds)          OUT 32..34  camera position
 *   IN  1        ballCam ? 1 : 0              35..37  view direction
 *   IN  2..4     car position                  38..40  camera up
 *   IN  5..8     car quaternion                41      camera fov
 *   IN  9..11    ball position
 *   IN  12       flag bits: 1 onGround, 2 groundNormal, 4 velocity, 8 supersonic
 *   IN  13       onGround
 *   IN  14..16   ground normal
 *   IN  17..19   velocity
 *   IN  20       supersonic
 *   IN  21       base fov          IN  27  camera aspect
 *   IN  22       distance          IN  28  lookX
 *   IN  23       height            IN  29  lookY
 *   IN  24       angleDeg          IN  30  swivelSpeed
 *   IN  25       stiffness         IN  31  invertSwivel ? 1 : 0
 *   IN  26       transitionSpeed
 *
 * This module is pure arithmetic on Float64Array: NO Three.js, NO donor, NO
 * DOM. The mirror is therefore unit-testable, which matters because it is the
 * part a reviewer is most entitled to distrust.
 */

/** The two methods `ChaseCamera` calls on its kernel. See camera.js:37,94. */
export interface ViewKernel {
  /** `simulation.js:153`. Consumes 32 floats, returns 42. Destructive. */
  stepView(input: Float64Array): Float64Array;
  /** `simulation.js:163`. Drops the solver's internal state. */
  resetView(): void;
}

/** Input width, donor `Aw`. */
export const VIEW_INPUT_FLOATS = 32;
/** Output width: the 32 inputs plus 10 solver outputs. */
export const VIEW_OUTPUT_FLOATS = 42;

/** Output slice offsets, donor `Sc` / `wc` / `Mc` / `lw`. */
export const VIEW_OUT = Object.freeze({
  position: 32,
  direction: 35,
  up: 38,
  fov: 41,
} as const);

/** Input field offsets, so the mirror is auditable against camera.js. */
export const VIEW_IN = Object.freeze({
  delta: 0,
  ballCam: 1,
  carPosition: 2,
  carQuaternion: 5,
  ballPosition: 9,
  flags: 12,
  onGround: 13,
  groundNormal: 14,
  velocity: 17,
  supersonic: 20,
  fov: 21,
  distance: 22,
  height: 23,
  angleDeg: 24,
  stiffness: 25,
  transitionSpeed: 26,
  aspect: 27,
  lookX: 28,
  lookY: 29,
  swivelSpeed: 30,
  invertSwivel: 31,
} as const);

/* -------------------------------------------------------------------------- */
/* The donor's real feel parameters (camera.js:4-14, exported as `Ps`).        */
/* Mirrored here so the default path cannot drift from the donor's numbers.    */
/* -------------------------------------------------------------------------- */

export const DONOR_CAMERA_SETTINGS = Object.freeze({
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

/**
 * Wraps the one `PhysicsSimulation` the donor creates. Exact donor feel.
 *
 * IMPORTANT: one instance of this is one camera. `PlayerViewPool` assigns it to
 * a single view and gives every other view a `MirroredViewKernel`.
 */
export class DonorViewKernel implements ViewKernel {
  constructor(private readonly sim: ViewKernel) {}

  stepView(input: Float64Array): Float64Array {
    return this.sim.stepView(input);
  }

  resetView(): void {
    this.sim.resetView();
  }
}

/* -------------------------------------------------------------------------- */
/* The mirror                                                                  */
/* -------------------------------------------------------------------------- */

export interface MirroredViewKernelOptions {
  /**
   * Which local axis the car model faces. The donor hands us a quaternion and
   * never says which way is forward, so this is the single assumption in this
   * file that cannot be verified from donor source. Exposed as an option rather
   * than hard-coded so it can be flipped without touching the solver.
   * Default: +Z, the Three.js convention for a model's forward.
   */
  readonly forwardAxis?: readonly [number, number, number];
  /** How far ahead of the car the camera aims when not tracking the ball. */
  readonly lookAhead?: number;
  /** Ball share of the look target while ball-cam is on, 0..1. */
  readonly ballWeight?: number;
  /** Speed at which the fov bonus is fully applied, in donor units. */
  readonly fovSpeedRef?: number;
  /** Extra fov at `fovSpeedRef`, in degrees. */
  readonly fovSpeedBonus?: number;
  /** Clamp on accumulated swivel, degrees. */
  readonly maxSwivelYaw?: number;
  readonly maxSwivelPitch?: number;
  /**
   * Minimum camera height. This is the ONLY wall/ceiling response this mirror
   * has: the donor's real arena-bounds handling is inside the opaque `_v1`, so
   * there is nothing to mirror and nothing is claimed.
   */
  readonly minHeight?: number;
}

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

const DEG = Math.PI / 180;

/** Rotate a vector by a quaternion (q * v). */
function rotateByQuat(
  qx: number,
  qy: number,
  qz: number,
  qw: number,
  vx: number,
  vy: number,
  vz: number,
  out: Vec3,
): Vec3 {
  // t = 2 * (q_vec x v)
  const tx = 2 * (qy * vz - qz * vy);
  const ty = 2 * (qz * vx - qx * vz);
  const tz = 2 * (qx * vy - qy * vx);
  out.x = vx + qw * tx + (qy * tz - qz * ty);
  out.y = vy + qw * ty + (qz * tx - qx * tz);
  out.z = vz + qw * tz + (qx * ty - qy * tx);
  return out;
}

function normalise(v: Vec3): Vec3 {
  const len = Math.hypot(v.x, v.y, v.z);
  if (len < 1e-6) return { x: 0, y: 0, z: 1 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

/** Exponential follow. `rate` is the donor's stiffness/transitionSpeed. */
function followAlpha(rate: number, delta: number): number {
  if (!(delta > 0)) return 1;
  return 1 - Math.exp(-Math.max(0, rate) * 60 * delta);
}

/**
 * A per-instance, pure-JS reimplementation of the view solver.
 *
 * It keeps its OWN smoothing state, which is the entire reason it exists: the
 * donor's `_v1` is a singleton, so this is the only way to give each viewport an
 * independent camera without editing donor source.
 *
 * It is an APPROXIMATION. It reproduces the donor's structure — a
 * stiffness-driven follow for position, a transitionSpeed-driven follow for
 * direction/up/fov, the same distance/height/angleDeg offset, ball-cam target
 * blending, swivel from lookX/lookY, and a speed-driven fov — but the donor's
 * exact curves live in WASM and cannot be read. `PlayerViewPool` marks every
 * view driven by one of these as approximate.
 */
export class MirroredViewKernel implements ViewKernel {
  private readonly forwardAxis: readonly [number, number, number];
  private readonly lookAhead: number;
  private readonly ballWeight: number;
  private readonly fovSpeedRef: number;
  private readonly fovSpeedBonus: number;
  private readonly maxSwivelYaw: number;
  private readonly maxSwivelPitch: number;
  private readonly minHeight: number;

  /** Solver state. Per instance — this is the whole point. */
  private position: Vec3 = { x: 0, y: 0, z: 0 };
  private direction: Vec3 = { x: 0, y: 0, z: 1 };
  private up: Vec3 = { x: 0, y: 1, z: 0 };
  private fov = 0;
  private swivelYaw = 0;
  private swivelPitch = 0;
  private primed = false;

  private readonly scratchForward: Vec3 = { x: 0, y: 0, z: 0 };
  private readonly scratchRight: Vec3 = { x: 1, y: 0, z: 0 };
  private readonly scratchUp: Vec3 = { x: 0, y: 1, z: 0 };
  private readonly scratchDesired: Vec3 = { x: 0, y: 0, z: 0 };
  private readonly scratchTarget: Vec3 = { x: 0, y: 0, z: 0 };
  private readonly scratchDir: Vec3 = { x: 0, y: 0, z: 0 };
  /**
   * The 42-float result, one per instance.
   *
   * This MUST be a different, longer array than the input. The donor's kernel
   * returns a 42-float view over the shared heap buffer
   * (`simulation.js:154-161`) and `ChaseCamera.update` then reads `o[32..41]`
   * out of it, while the 32-float input it wrote is a separate array
   * (`camera.js:31`, `camera.js:94`). Returning the input would silently drop
   * every output, because a `Float64Array(32)` ignores a write to index 41.
   */
  private readonly out = new Float64Array(VIEW_OUTPUT_FLOATS);

  constructor(options: MirroredViewKernelOptions = {}) {
    this.forwardAxis = options.forwardAxis ?? [0, 0, 1];
    this.lookAhead = options.lookAhead ?? 300;
    this.ballWeight = options.ballWeight ?? 0.65;
    this.fovSpeedRef = options.fovSpeedRef ?? 3000;
    this.fovSpeedBonus = options.fovSpeedBonus ?? 14;
    this.maxSwivelYaw = options.maxSwivelYaw ?? 60;
    this.maxSwivelPitch = options.maxSwivelPitch ?? 35;
    this.minHeight = options.minHeight ?? 30;
  }

  /** `simulation.js:163` equivalent: drop this view's smoothing state. */
  resetView(): void {
    this.position = { x: 0, y: 0, z: 0 };
    this.direction = { x: 0, y: 0, z: 1 };
    this.up = { x: 0, y: 1, z: 0 };
    this.fov = 0;
    this.swivelYaw = 0;
    this.swivelPitch = 0;
    this.primed = false;
  }

  /** Consumes the donor's 32 floats, writes the 10 output floats in place. */
  stepView(input: Float64Array): Float64Array {
    const delta = input[VIEW_IN.delta];
    const ballCam = input[VIEW_IN.ballCam] === 1;
    const cx = input[VIEW_IN.carPosition];
    const cy = input[VIEW_IN.carPosition + 1];
    const cz = input[VIEW_IN.carPosition + 2];
    const qx = input[VIEW_IN.carQuaternion];
    const qy = input[VIEW_IN.carQuaternion + 1];
    const qz = input[VIEW_IN.carQuaternion + 2];
    const qw = input[VIEW_IN.carQuaternion + 3];
    const bx = input[VIEW_IN.ballPosition];
    const by = input[VIEW_IN.ballPosition + 1];
    const bz = input[VIEW_IN.ballPosition + 2];
    const vx = input[VIEW_IN.velocity];
    const vy = input[VIEW_IN.velocity + 1];
    const vz = input[VIEW_IN.velocity + 2];
    const fovBase = input[VIEW_IN.fov];
    const distance = input[VIEW_IN.distance];
    const height = input[VIEW_IN.height];
    const angleDeg = input[VIEW_IN.angleDeg];
    const stiffness = input[VIEW_IN.stiffness];
    const transitionSpeed = input[VIEW_IN.transitionSpeed];
    const lookX = input[VIEW_IN.lookX];
    const lookY = input[VIEW_IN.lookY];
    const swivelSpeed = input[VIEW_IN.swivelSpeed];
    const invertSwivel = input[VIEW_IN.invertSwivel] === 1;

    // --- car basis -------------------------------------------------------
    rotateByQuat(qx, qy, qz, qw, this.forwardAxis[0], this.forwardAxis[1], this.forwardAxis[2], this.scratchForward);
    const forward = normalise(this.scratchForward);
    rotateByQuat(qx, qy, qz, qw, 0, 1, 0, this.scratchUp);
    const carUp = normalise(this.scratchUp);
    // right = forward x carUp, which keeps it orthonormal and gives a stable
    // axis to apply the angleDeg pitch about.
    const right = normalise({
      x: forward.y * carUp.z - forward.z * carUp.y,
      y: forward.z * carUp.x - forward.x * carUp.z,
      z: forward.x * carUp.y - forward.y * carUp.x,
    });
    this.scratchRight.x = right.x;
    this.scratchRight.y = right.y;
    this.scratchRight.z = right.z;

    // --- swivel ----------------------------------------------------------
    if (delta > 0) {
      const sign = invertSwivel ? -1 : 1;
      const step = swivelSpeed * delta * 60;
      this.swivelYaw = clampDeg(
        this.swivelYaw + sign * lookX * step,
        this.maxSwivelYaw,
      );
      this.swivelPitch = clampDeg(
        this.swivelPitch + sign * lookY * step,
        this.maxSwivelPitch,
      );
    }
    const yaw = this.swivelYaw * DEG;
    const pitch = this.swivelPitch * DEG;
    // Yaw about world up, then pitch about the car's right axis.
    const cosYaw = Math.cos(yaw);
    const sinYaw = Math.sin(yaw);
    const dirX = forward.x * cosYaw + forward.z * sinYaw;
    const dirZ = -forward.x * sinYaw + forward.z * cosYaw;
    const dirY = forward.y;
    const swung = normalise({ x: dirX, y: dirY, z: dirZ });

    // --- desired camera position ----------------------------------------
    // Behind the car by `distance`, raised by `height`, then pitched about the
    // car's right axis by `angleDeg` (the donor's value is -3, a slight
    // downward tilt). This is an OFFSET, but a donor-parameterised one with a
    // swivel and a follow — not `position = car.position + offset`.
    const pitchAngle = angleDeg * DEG;
    const cosP = Math.cos(pitchAngle);
    const sinP = Math.sin(pitchAngle);
    const backX = -swung.x * cosP + carUp.x * sinP;
    const backY = -swung.y * cosP + carUp.y * sinP;
    const backZ = -swung.z * cosP + carUp.z * sinP;
    this.scratchDesired.x = cx + backX * distance + carUp.x * height;
    this.scratchDesired.y = cy + backY * distance + carUp.y * height;
    this.scratchDesired.z = cz + backZ * distance + carUp.z * height;

    // --- look target: ball-cam blends toward the ball -------------------
    const aheadX = cx + swung.x * this.lookAhead;
    const aheadY = cy + swung.y * this.lookAhead;
    const aheadZ = cz + swung.z * this.lookAhead;
    const w = ballCam ? this.ballWeight : 0;
    this.scratchTarget.x = aheadX * (1 - w) + bx * w;
    this.scratchTarget.y = aheadY * (1 - w) + by * w;
    this.scratchTarget.z = aheadZ * (1 - w) + bz * w;

    // --- follow ----------------------------------------------------------
    const posAlpha = followAlpha(stiffness, delta);
    const dirAlpha = followAlpha(transitionSpeed, delta);
    const speed = Math.hypot(vx, vy, vz);
    const fovTarget =
      fovBase + this.fovSpeedBonus * Math.min(1, speed / this.fovSpeedRef);

    if (!this.primed || !(delta > 0)) {
      // First solve, or a zero-delta call (the donor does exactly this at
      // startup.js:800 and :1093): snap instead of easing in from the origin.
      this.position = { ...this.scratchDesired };
      this.scratchDir.x = this.scratchTarget.x - this.scratchDesired.x;
      this.scratchDir.y = this.scratchTarget.y - this.scratchDesired.y;
      this.scratchDir.z = this.scratchTarget.z - this.scratchDesired.z;
      this.direction = normalise(this.scratchDir);
      this.up = { ...carUp };
      this.fov = fovTarget;
      this.primed = true;
    } else {
      this.position.x += (this.scratchDesired.x - this.position.x) * posAlpha;
      this.position.y += (this.scratchDesired.y - this.position.y) * posAlpha;
      this.position.z += (this.scratchDesired.z - this.position.z) * posAlpha;
      this.scratchDir.x = this.scratchTarget.x - this.position.x;
      this.scratchDir.y = this.scratchTarget.y - this.position.y;
      this.scratchDir.z = this.scratchTarget.z - this.position.z;
      const wanted = normalise(this.scratchDir);
      this.direction.x += (wanted.x - this.direction.x) * dirAlpha;
      this.direction.y += (wanted.y - this.direction.y) * dirAlpha;
      this.direction.z += (wanted.z - this.direction.z) * dirAlpha;
      this.direction = normalise(this.direction);
      this.up.x += (carUp.x - this.up.x) * dirAlpha;
      this.up.y += (carUp.y - this.up.y) * dirAlpha;
      this.up.z += (carUp.z - this.up.z) * dirAlpha;
      this.up = normalise(this.up);
      this.fov += (fovTarget - this.fov) * dirAlpha;
    }

    if (this.position.y < this.minHeight) this.position.y = this.minHeight;

    // Keep up perpendicular to the view direction so lookAt cannot gimbal.
    const upOrtho = normalise({
      x: this.up.x - this.direction.x * dot(this.up, this.direction),
      y: this.up.y - this.direction.y * dot(this.up, this.direction),
      z: this.up.z - this.direction.z * dot(this.up, this.direction),
    });

    // The donor returns the 32 inputs followed by the 10 outputs. Nothing is
    // written back into `input`: it is only 32 long, so indices 32..41 would be
    // silently dropped.
    this.out.set(input);
    this.out[VIEW_OUT.position] = this.position.x;
    this.out[VIEW_OUT.position + 1] = this.position.y;
    this.out[VIEW_OUT.position + 2] = this.position.z;
    this.out[VIEW_OUT.direction] = this.direction.x;
    this.out[VIEW_OUT.direction + 1] = this.direction.y;
    this.out[VIEW_OUT.direction + 2] = this.direction.z;
    this.out[VIEW_OUT.up] = upOrtho.x;
    this.out[VIEW_OUT.up + 1] = upOrtho.y;
    this.out[VIEW_OUT.up + 2] = upOrtho.z;
    this.out[VIEW_OUT.fov] = this.fov;
    return this.out;
  }
}

function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function clampDeg(value: number, limit: number): number {
  return value < -limit ? -limit : value > limit ? limit : value;
}

/** `ChaseCamera` reads exactly 32 floats and expects 42 back. */
export function assertViewAbi(input: Float64Array): void {
  if (input.length !== VIEW_INPUT_FLOATS) {
    throw new RangeError(
      `view input must be ${VIEW_INPUT_FLOATS} floats (donor Aw), got ${input.length}`,
    );
  }
}
