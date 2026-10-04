/**
 * Stick shaping tests.
 *
 * Runs in vitest's `node` environment, which is deliberate: the shaping math is
 * pure and needs no DOM, and keeping it DOM-free means the "can this phone get
 * stuck?" guarantee is testable without a browser.
 */

import { describe, expect, it } from "vitest";
import {
  STICK_DEADZONE,
  clampAxis,
  offsetFromOrigin,
  shapeAxis,
  shapeMagnitude,
  shapeStick,
} from "./stick";

describe("stick deadzone", () => {
  it("returns exactly zero at and below the deadzone", () => {
    expect(shapeMagnitude(0)).toBe(0);
    expect(shapeMagnitude(STICK_DEADZONE)).toBe(0);
    expect(shapeMagnitude(STICK_DEADZONE / 2)).toBe(0);
  });

  it("leaves the deadzone immediately past the threshold", () => {
    const justPast = shapeMagnitude(STICK_DEADZONE + 0.001);
    expect(justPast).toBeGreaterThan(0);
    // Exponential shaping means a sliver of travel is a very small value.
    expect(justPast).toBeLessThan(0.01);
  });

  it("is monotonic across the whole travel", () => {
    let previous = -1;
    for (let raw = 0; raw <= 1.0001; raw += 0.02) {
      const shaped = shapeMagnitude(raw);
      expect(shaped).toBeGreaterThanOrEqual(previous);
      previous = shaped;
    }
  });

  it("reaches exactly 1 at full deflection", () => {
    expect(shapeMagnitude(1)).toBe(1);
  });

  it("uses a radial deadzone so diagonals are not dead", () => {
    // A 45-degree push has a large magnitude but a small per-axis component.
    // A per-axis deadzone would kill this; a radial one must not.
    const diagonal = shapeStick(0.12, 0.12);
    expect(diagonal.magnitude).toBeGreaterThan(0);
    expect(diagonal.x).toBeGreaterThan(0);
    expect(diagonal.y).toBeGreaterThan(0);
  });

  it("honours a custom deadzone", () => {
    expect(shapeMagnitude(0.3, { deadzone: 0.4 })).toBe(0);
    expect(shapeMagnitude(0.5, { deadzone: 0.4 })).toBeGreaterThan(0);
  });
});

describe("stick clamping", () => {
  it("clamps every output into [-1, 1]", () => {
    for (const raw of [1, 1.5, 12, 1000, Number.MAX_SAFE_INTEGER]) {
      const shaped = shapeStick(raw, raw);
      expect(shaped.x).toBeLessThanOrEqual(1);
      expect(shaped.y).toBeLessThanOrEqual(1);
      expect(shaped.magnitude).toBeLessThanOrEqual(1);
    }
  });

  it("clamps a drag that ran off the pad instead of pinning the axis", () => {
    // 3-4-5 triangle scaled past the pad radius.
    const shaped = shapeStick(3, 4);
    expect(shaped.magnitude).toBeCloseTo(1, 10);
    expect(shaped.x).toBeCloseTo(0.6, 10);
    expect(shaped.y).toBeCloseTo(0.8, 10);
  });

  it("clamps negative deflection symmetrically", () => {
    const shaped = shapeStick(-2, 0);
    expect(shaped.x).toBeGreaterThanOrEqual(-1);
    expect(shaped.x).toBeCloseTo(-1, 10);
  });

  it("treats non-finite input as centred rather than propagating NaN", () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const shaped = shapeStick(bad, bad);
      expect(Number.isFinite(shaped.x)).toBe(true);
      expect(Number.isFinite(shaped.y)).toBe(true);
      expect(shaped.x).toBe(0);
      expect(shaped.y).toBe(0);
    }
  });

  it("clampsAxis is a total function over the unit interval", () => {
    expect(clampAxis(2)).toBe(1);
    expect(clampAxis(-2)).toBe(-1);
    expect(clampAxis(0.42)).toBe(0.42);
    expect(clampAxis(Number.NaN)).toBe(0);
  });

  it("shapeAxis preserves sign", () => {
    expect(shapeAxis(-1)).toBeCloseTo(-1, 10);
    expect(shapeAxis(1)).toBeCloseTo(1, 10);
    expect(shapeAxis(0.05)).toBe(0);
  });
});

describe("offsetFromOrigin", () => {
  it("reports up as positive even though DOM y grows downward", () => {
    // A finger ABOVE the centre (smaller clientY) must be +y.
    const above = offsetFromOrigin(100, 90, 100, 100, 50);
    expect(above.x).toBeCloseTo(0, 10);
    expect(above.y).toBeCloseTo(0.2, 10);

    const below = offsetFromOrigin(100, 110, 100, 100, 50);
    expect(below.y).toBeCloseTo(-0.2, 10);
  });

  it("degrades to centre when the radius has not been measured", () => {
    expect(offsetFromOrigin(100, 100, 0, 0, 0)).toEqual({ x: 0, y: 0 });
    expect(offsetFromOrigin(100, 100, 0, 0, Number.NaN)).toEqual({ x: 0, y: 0 });
  });
});
