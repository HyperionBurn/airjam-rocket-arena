/**
 * Stick shaping — pure, DOM-free, unit-tested.
 *
 * A thumb produces noisy analog values: a resting thumb drifts a few percent,
 * a thumb roll overshoots past the zone, and a drag can report coordinates
 * outside the pad. This module turns a raw pad offset into the number physics
 * is allowed to see. It owns the only place in the port where a magnitude is
 * chosen, so it stays a pure function of its inputs.
 *
 * Three stages, in order:
 *   1. CLAMP  — a coordinate beyond the pad radius cannot mean "more than full".
 *   2. DEADZONE — radial (not per-axis), because a diagonal thumb push has
 *      magnitude ~0.7 and per-axis deadzones make diagonals feel broken.
 *   3. EXPO   — remap the surviving band and curve it, so small corrections are
 *      precise and full deflection is still exactly 1.
 *
 * Nothing here knows about the car, the room, or React.
 */

/** Fraction of the pad radius ignored as thumb rest / slop. */
export const STICK_DEADZONE = 0.12;

/**
 * Curve exponent applied to the post-deadzone magnitude. 1 is linear; higher
 * values shrink the first half of the travel. 1.9 keeps fine steering usable
 * at speed while still demanding a real push for a hard turn.
 */
export const STICK_EXPO = 1.9;

export interface StickShapeOptions {
  readonly deadzone?: number;
  readonly expo?: number;
}

export interface ShapedStick {
  readonly x: number;
  readonly y: number;
  /** Magnitude after every stage. Kept for the on-screen readout. */
  readonly magnitude: number;
}

const clampUnit = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  if (value < -1) return -1;
  if (value > 1) return 1;
  return value;
};

/** Finite guard + clamp to the closed unit interval. */
export const clampAxis = (value: number): number => clampUnit(value);

/**
 * Deadzone → expo for a single signed magnitude in [0,1].
 * Returns 0 at or below the deadzone and exactly 1 at full deflection.
 */
export const shapeMagnitude = (
  magnitude: number,
  options: StickShapeOptions = {},
): number => {
  const deadzone = clampUnit(options.deadzone ?? STICK_DEADZONE);
  const expo = options.expo ?? STICK_EXPO;

  const raw = Math.abs(Number.isFinite(magnitude) ? magnitude : 0);
  if (raw <= deadzone) return 0;
  if (deadzone >= 1) return 0;

  // Remap so the usable band spans [0,1] across the travel that remains.
  const normalised = clampUnit((raw - deadzone) / (1 - deadzone));
  const curved = Math.pow(normalised, Math.max(0, expo));
  return clampUnit(curved);
};

/** Shape one signed axis. Symmetric with `shapeMagnitude`, kept for reuse. */
export const shapeAxis = (value: number, options: StickShapeOptions = {}): number => {
  const shaped = shapeMagnitude(value, options);
  return value < 0 ? -shaped : shaped;
};

/**
 * Shape a 2D pad offset. The deadzone is radial, and the offset is clamped to
 * the unit circle BEFORE shaping so a thumb dragged off the pad cannot
 * manufacture magnitude > 1 (which would otherwise survive the clamp later and
 * read as a permanently pinned control).
 *
 * Axis convention: +x is right, +y is UP. The DOM's `clientY` grows downward,
 * so the DOM adapter negates it before calling in.
 */
export const shapeStick = (
  rawX: number,
  rawY: number,
  options: StickShapeOptions = {},
): ShapedStick => {
  const x = Number.isFinite(rawX) ? rawX : 0;
  const y = Number.isFinite(rawY) ? rawY : 0;

  const rawMagnitude = Math.hypot(x, y);
  if (rawMagnitude === 0) {
    return { x: 0, y: 0, magnitude: 0 };
  }

  // Clamp to the unit circle so the shaped magnitude can never exceed 1.
  const scale = rawMagnitude > 1 ? 1 / rawMagnitude : 1;
  const boundedX = clampUnit(x * scale);
  const boundedY = clampUnit(y * scale);

  const magnitude = shapeMagnitude(rawMagnitude, options);
  if (magnitude === 0) {
    return { x: 0, y: 0, magnitude: 0 };
  }

  return {
    x: clampUnit((x * scale) * magnitude),
    y: clampUnit((y * scale) * magnitude),
    magnitude,
  };
};

/**
 * Offset of a finger from the stick origin, in pad-radius units.
 *
 * `radius` is the DOM-measured travel radius in CSS pixels. A `radius` of 0
 * (layout not measured yet, element hidden) yields a centred stick rather
 * than a divide-by-zero.
 *
 * @param pointerX pointer clientX
 * @param pointerY pointer clientY
 * @param originX pad centre, client space
 * @param originY pad centre, client space
 * @param radius travel radius in the same units as origin
 */
export const offsetFromOrigin = (
  pointerX: number,
  pointerY: number,
  originX: number,
  originY: number,
  radius: number,
): { x: number; y: number } => {
  if (!Number.isFinite(radius) || radius <= 0) {
    return { x: 0, y: 0 };
  }
  return {
    x: (pointerX - originX) / radius,
    // Negated: DOM y grows downward, the control wants "up" to be positive.
    y: -(pointerY - originY) / radius,
  };
};
