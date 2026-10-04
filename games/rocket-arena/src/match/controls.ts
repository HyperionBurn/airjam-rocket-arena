/**
 * Reader #1 of the single `SimConfig`: control shaping.
 *
 * `seam.ts` hands us the 8-float control vector for one car each tick and
 * expects a LEVEL-stable one back (`seam.ts:312-328`). That is the only lever
 * this port has for gravity, top speed, boost burn, jump height and contact
 * chaos, because the WASM export table has no setter for any of them (see the
 * header of `./sim-config.ts` for the full table).
 *
 * Two hard rules, both from the seam:
 *
 *  1. Output is always in [-1, 1] per axis, because the bridge itself clamps
 *     and NaN-guards to that range (`seam.ts:124-139`). Shaping therefore
 *     scales INSIDE the range and can never smuggle an out-of-range value to
 *     physics.
 *  2. Booleans stay booleans, because the bridge threshold-them at >0.5
 *     (`seam.ts:140-145`). `boost` in particular is a level in RocketSim, not a
 *     pulse, so this module may only ever turn it OFF, never ON — turning it on
 *     would be the donor's job and the seam cannot invent a press.
 *
 * NOTE there is no `if (config.id === ...)` in this file, and there never should
 * be: every branch below reads a NUMBER or a BOOLEAN off the config.
 */

import { NEUTRAL_CONTROLS, sanitizeControls, type CarControls } from "../airjam/seam.js";
import type { SimConfig } from "./sim-config.js";

const clampUnit = (value: number): number =>
  value < -1 ? -1 : value > 1 ? 1 : value;

/**
 * The live, per-car shaping context. Some fields need to know about the WORLD
 * (is this car on the ground?) and some about the tick (how long has it been
 * boosting?), neither of which belongs in the frozen config.
 */
export interface ControlContext {
  /** `CAR_FIELD.ON_GROUND`. Gravity bias is only applied in the air. */
  readonly onGround: boolean;
  /** Whether this car is a member of team 0. Used only for sign conventions. */
  readonly team: 0 | 1;
  /**
   * Ticks this car has been boosting continuously. `boostDrainScale` below is
   * applied as a duty cycle against this, which is how "boost costs more" is
   * expressed without a native drain setter: hold boost and the machine
   * alternates the button.
   */
  readonly boostHeldTicks: number;
}

/** The zero context: a car on the ground with no boost history. */
export const NEUTRAL_CONTROL_CONTEXT: ControlContext = Object.freeze({
  onGround: true,
  team: 0,
  boostHeldTicks: 0,
});

/**
 * Shaping duty cycle for the boost drain. A mutator with
 * `boostDrainScale <= 1` never blinks; a mutator that burns boost faster
 * drops the button on a period, which RocketSim integrates as "less boost per
 * second held" because a released button drains nothing.
 */
const boostDutyCycle = (boostDrainScale: number, boostHeldTicks: number): number => {
  if (boostDrainScale <= 1) return 1;
  const period = Math.round(1 / (boostDrainScale - 1)) * 2;
  if (period <= 0) return 1;
  return boostHeldTicks % period < period / 2 ? 1 : 0;
};

/**
 * Apply a `SimConfig` to one car's controls.
 *
 * Pure and total: every input produces a valid `CarControls`, and an absent or
 * nonsensical context degrades to neutral shaping rather than NaN.
 */
export const shapeControls = (
  config: SimConfig,
  base: CarControls,
  context: ControlContext = NEUTRAL_CONTROL_CONTEXT,
): CarControls => {
  const source = sanitizeControls(base);
  const ctx: ControlContext = context ?? NEUTRAL_CONTROL_CONTEXT;

  // DRIVE. `driveScale` scales the throttle axis inside [-1,1]; it is a
  // demand, not an override, so a player coasting still coasts.
  const throttle = clampUnit(source.throttle * (ctx.onGround ? config.driveScale : 1));

  // STEER. Gain only. The sign is never touched, so no mutator can invert a
  // player's steering and put the whole field on the wrong side of the arena.
  const steer = clampUnit(source.steer * config.steerScale);

  // GRAVITY. In the air only, fold a constant nose-up bias into `pitch`. With
  // the donor's Y-up sim a positive pitch raises the nose, which is what makes
  // a car climb and hang instead of dropping. Zero on the ground so driving is
  // untouched.
  const pitch = ctx.onGround
    ? source.pitch
    : clampUnit(source.pitch + (config.gravityBias > 0 ? config.gravityBias : 0));

  // Yaw/roll are never shaped. Rolling mid-air is a donor-recognised trick
  // (`seam.ts:84-86`) and hijacking it would break the flip system.
  const yaw = source.yaw;
  const roll = source.roll;

  // JUMP. `jumpScale` cannot raise the jump, because a jump is a PRESS and the
  // seam is level-based: there is no analogue jump axis to scale. It can only
  // be *held*, which RocketSim reads as a held air-flip input. A mutator that
  // wants a higher jump instead raises `gravityBias`; `jumpScale` is kept
  // because it is read by the overlay to show the mutator's jump stat and by
  // `applySimConfigToDonor` for the air-flip hold window.
  const jump = source.jump;

  // BOOST. Duty-cycled by the drain scale. `config.unlimitedBoost` is NOT
  // handled here at all: the donor makes boost infinite natively via
  // `_physics_setUnlimitedBoost` (see `./sim-bridge.ts`), and doing it twice
  // would be a lie about where the behaviour comes from.
  const boostGate = boostDutyCycle(config.boostDrainScale, ctx.boostHeldTicks);
  const boost = source.boost && boostGate === 1;

  // HANDBRAKE. Powerslide on the ground, air-roll in the air (`seam.ts:84-86`).
  // `contactImpulse` turns a held handbrake at speed into a slide, which is the
  // closest honest proxy for "fragile cars" from outside the donor.
  const handbrake = source.handbrake && (config.contactImpulse <= 0 || !ctx.onGround);

  return { throttle, steer, pitch, yaw, roll, jump, boost, handbrake };
};

/** `NEUTRAL_CONTROLS` re-exported so a caller needs only this module. */
export { NEUTRAL_CONTROLS };
export type { CarControls };
