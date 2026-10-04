/**
 * Split-screen field-of-view compensation (pure math).
 */
// @ts-ignore -- untyped donor module (pure math, no imports)
import { widenFov } from "../../donor/app/fov.js";
import { describe, expect, it } from "vitest";

const wide = widenFov as (fov: number, aspect: number) => number;

describe("widenFov", () => {
  it("leaves tiles at or wider than 16:9 exactly as the donor draws them", () => {
    expect(wide(110, 16 / 9)).toBe(110);
    expect(wide(110, 2.2)).toBe(110);
    expect(wide(90, 4)).toBe(90);
  });

  it("widens a narrow tile, but only part of the way to constant horizontal FOV", () => {
    const sideBySide = wide(110, 800 / 740); // a 2-player split
    expect(sideBySide).toBeGreaterThan(110);
    // Full compensation would be ~143 degrees (a fisheye); we stay well under.
    expect(sideBySide).toBeLessThan(118);
  });

  it("is monotonic: the narrower the tile, the wider the view", () => {
    const a = wide(80, 1.5);
    const b = wide(80, 1.0);
    const c = wide(80, 0.7);
    expect(a).toBeGreaterThan(80);
    expect(b).toBeGreaterThan(a);
    expect(c).toBeGreaterThanOrEqual(b);
  });

  it("never exceeds the cap and never narrows the donor's value", () => {
    expect(wide(80, 0.2)).toBeLessThanOrEqual(112);
    expect(wide(125, 0.5)).toBe(125); // the donor's own value already beats the cap
    for (const aspect of [0.3, 0.8, 1.2, 1.6, 1.78, 2.4]) expect(wide(100, aspect)).toBeGreaterThanOrEqual(100);
  });

  it("is safe on garbage", () => {
    expect(wide(Number.NaN, 1)).toBeNaN();
    expect(wide(110, 0)).toBe(110);
    expect(wide(110, Number.NaN)).toBe(110);
    expect(wide(110, -1)).toBe(110);
  });
});
