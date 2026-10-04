/**
 * Donor facts the slots layer needs, restated as data.
 *
 * Every number here is copied from the donor's own modules and MUST NOT be
 * "corrected" without re-reading them:
 *
 *  - `physics/state-layout.js:12-50` — `STATE_LAYOUT`, `CAR_STATE_STRIDE = 51`,
 *    and the `CAR_STATE` field offsets.
 *  - `online/prediction.js:19` — the whole snapshot is 510 floats, so the car
 *    block at `CARS + slot * STRIDE` is readable straight out of `sim.state`.
 *  - `online/prediction.js:78-89` — the donor's own `_physics_setCarState` call
 *    site, which is the ground truth for the 24-float pose layout.
 *
 * The donor files themselves are READ-ONLY here: this module re-derives their
 * constants instead of importing them, so the slots core stays DOM-free,
 * Three-free and unit-testable without loading WASM or the arena meshes.
 */

/** `bridge.cpp`: `constexpr int MAX_CARS = 8`. `addCar` refuses past this. */
export const NATIVE_MAX_CARS = 8;

/** `online/protocol.js:6` — the donor's own online ceiling. */
export const PROTOCOL_MAX_CARS = 6;

/** `physics/state-layout.js:12` — header field indices inside `sim.state`. */
export const STATE_HEADER = Object.freeze({
  TICK: 0,
  GOAL: 1,
  NUM_CARS: 2,
  NUM_PADS: 3,
  BALL: 4,
  CARS: 22,
} as const);

/** `physics/state-layout.js:14` — floats per car block. */
export const CAR_STATE_STRIDE = 51;

/** `_physics_setCarState` consumes 24 floats (see `prediction.js:82`). */
export const CAR_POSE_FLOATS = 24;

/** `physics/state-layout.js:22-49` — field offsets WITHIN one car block. */
export const CAR_FIELD = Object.freeze({
  POS: 0,
  FWD: 3,
  RIGHT: 6,
  UP: 9,
  VEL: 12,
  ANG_VEL: 15,
  BOOST: 18,
  ON_GROUND: 19,
  SUPERSONIC: 20,
  DEMOED: 21,
} as const);

/**
 * The six consecutive 3-vectors at the head of a pose, in the order the bridge
 * reads them. Kickoff mirroring (see `kickoff.ts`) treats exactly these as
 * vectors and the remaining floats as scalars.
 */
export const POSE_VECTORS = Object.freeze([
  { at: CAR_FIELD.POS, label: "pos" },
  { at: CAR_FIELD.FWD, label: "fwd" },
  { at: CAR_FIELD.RIGHT, label: "right" },
  { at: CAR_FIELD.UP, label: "up" },
  { at: CAR_FIELD.VEL, label: "vel" },
  { at: CAR_FIELD.ANG_VEL, label: "angVel" },
] as const);

/** First float index of a car's block. `CARS + slot * STRIDE`. */
export const carBase = (slot: number): number =>
  STATE_HEADER.CARS + slot * CAR_STATE_STRIDE;

/** Copy one car's 24-float pose out of the state buffer. */
export const readCarPose = (state: Float32Array, slot: number): number[] => {
  const base = carBase(slot);
  const pose = new Array<number>(CAR_POSE_FLOATS);
  for (let i = 0; i < CAR_POSE_FLOATS; i += 1) pose[i] = state[base + i] ?? 0;
  return pose;
};

/** A pose is only usable if every float is finite and the position is non-zero. */
export const isUsablePose = (pose: readonly number[]): boolean =>
  pose.length >= CAR_POSE_FLOATS &&
  pose.every((value) => Number.isFinite(value)) &&
  pose.some((value) => value !== 0);

/**
 * Live car count, preferring the native counter the donor maintains at
 * `STATE_HEADER.NUM_CARS` and falling back to the highest slot that carries a
 * non-zero pose (a car that exists is always placed, so this is stable even if
 * the header lags one step behind `addCar`).
 */
export const readCarCount = (state: Float32Array, limit = NATIVE_MAX_CARS): number => {
  const declared = state[STATE_HEADER.NUM_CARS] ?? 0;
  const declaredCount = Math.floor(declared);
  if (Number.isFinite(declared) && declaredCount > 0 && declaredCount <= limit) {
    return declaredCount;
  }
  let highest = 0;
  for (let slot = 0; slot < limit; slot += 1) {
    if (isUsablePose(readCarPose(state, slot))) highest = slot + 1;
  }
  return highest;
};

/** `CAR_FIELD.ON_GROUND === 1` means the car is driving, not airborne. */
export const readOnGround = (state: Float32Array, slot: number): boolean =>
  (state[carBase(slot) + CAR_FIELD.ON_GROUND] ?? 0) === 1;

/** `CAR_FIELD.DEMOED === 1` means demolished and waiting for respawn. */
export const readDemoed = (state: Float32Array, slot: number): boolean =>
  (state[carBase(slot) + CAR_FIELD.DEMOED] ?? 0) === 1;
