/**
 * Stick shaping — the phone's raw stick range → the donor's `[-1, 1]` ABI.
 *
 * WHY THIS EXISTS AT ALL. The WASM bridge does its own defensive clamping
 * (`std::isfinite` → 0, then clamp to `[-1, 1]`) but it does NO shaping: a phone
 * that reports `0.03` of stick travel gets a real 3% of steering authority, and
 * a phone that reports `NaN` gets a silent `0`. Both are inputs we would rather
 * never send. `seam.ts` says so explicitly — "shaping belongs here so the
 * phone's raw stick range never reaches physics" — so ALL of it lives here.
 *
 * DEADZONE IS DONOR-VERIFIED, NOT INVENTED. `donor/input/touch.js:359-362`
 * (`axisWithDeadzone`) is a hard rescale, not a subtract-and-clamp:
 *
 *     |v| <= deadzone ? 0 : sign(v) * (|v| - deadzone) / (1 - deadzone)
 *
 * That renormalises so full travel still reaches exactly 1.0, which is why
 * `DEFAULT_STICK_SHAPING.deadzone` is the donor's own `tA = 0.08` and not a
 * round number. Do not "simplify" it into `v - deadzone`: that would quietly
 * shrink every driver's maximum authority.
 *
 * EXPO IS OURS. The donor's touch path has no expo curve at all, which is
 * tolerable for a keyboard but not for a thumbstick resting on a phone: the
 * first ~10% of travel is all you get while the car is at full steering lock.
 * The expo term below is applied AFTER the deadzone rescale so it never
 * distorts the deadzone boundary, and it leaves full deflection at exactly 1.0
 * (`1 ** expo === 1`), so no driver loses top-end authority.
 *
 * PURE BY DESIGN: no DOM, no React, no SDK import. Unit-testable in isolation
 * and reusable by the host loop.
 */

/** A 2-axis stick reading. Mirrors the shape the Air Jam input manager passes. */
export interface StickVector {
  x: number;
  y: number;
}

/** Tunables for {@link shapeAxis}. */
export interface StickShaping {
  /**
   * Fraction of full travel ignored around centre, rescaled not subtracted.
   * Donor's touch input uses 0.08.
   */
  deadzone: number;
  /**
   * Exponent applied to the deadzoned magnitude. `1` = no shaping, `> 1` = more
   * fine control near centre. Values `< 1` are rejected (they would make the
   * stick MORE twitchy at the centre, the opposite of the intent).
   */
  expo: number;
}

export const DEFAULT_STICK_SHAPING: StickShaping = Object.freeze({
  deadzone: 0.08,
  expo: 1.35,
});

/** Coerce anything into a finite number, else 0. The bridge's NaN guard, done properly. */
const finite = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

/** Clamp to the ABI's `[-1, 1]`. Applied to the RAW value, before any shaping. */
export const clampUnit = (value: number): number => (value < -1 ? -1 : value > 1 ? 1 : value);

/**
 * Normalise a caller-supplied {@link StickShaping}, falling back to the donor's
 * verified defaults for any field that is missing or nonsensical. A bad config
 * must not be able to produce a non-centring stick or a >1 axis.
 */
export const resolveStickShaping = (shaping?: Partial<StickShaping>): StickShaping => {
  const rawDeadzone = finite(shaping?.deadzone);
  const deadzone = rawDeadzone > 0 && rawDeadzone < 1 ? rawDeadzone : DEFAULT_STICK_SHAPING.deadzone;
  const rawExpo = finite(shaping?.expo);
  const expo = rawExpo >= 1 ? rawExpo : DEFAULT_STICK_SHAPING.expo;
  return { deadzone, expo };
};

/**
 * Shape ONE raw axis reading into the donor's `[-1, 1]` range.
 *
 * Order is load-bearing: clamp the raw value first (so an over-range phone
 * cannot skew the deadzone maths), then deadzone-rescale, then expo, then clamp
 * again as a belt-and-braces guard against float drift.
 */
export const shapeAxis = (raw: unknown, shaping?: Partial<StickShaping>): number => {
  const { deadzone, expo } = resolveStickShaping(shaping);
  const value = clampUnit(finite(raw));
  const magnitude = Math.abs(value);
  if (magnitude <= deadzone) {
    return 0;
  }
  // sign * normalised magnitude, renormalised so full travel is still 1.0.
  const rescaled = (magnitude - deadzone) / (1 - deadzone);
  return clampUnit(Math.sign(value) * rescaled ** expo);
};

/**
 * Shape a whole stick reading. Never returns `NaN`, never exceeds `[-1, 1]`,
 * and never returns a partial object.
 *
 * SIGN CONVENTION (matches `donor/input/touch.js:210-212`): `x` is +1 = right,
 * `y` is +1 = forward/up. The Air Jam controller that publishes this must keep
 * that convention; the mapping to the donor's axes happens in the input source.
 */
export const shapeStick = (
  raw: Partial<StickVector> | null | undefined,
  shaping?: Partial<StickShaping>,
): StickVector => ({
  x: shapeAxis(raw?.x, shaping),
  y: shapeAxis(raw?.y, shaping),
});
