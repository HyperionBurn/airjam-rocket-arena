/**
 * Quality preset mapping, and the guarantee that `quality.ts` is importable with
 * no WebGL and no WASM.
 *
 * The import of `seam.ts` is the interesting part of this file: `seam.ts` has a
 * runtime import of the donor `PhysicsSimulation`, which drags the WASM loader
 * into the module graph. This suite running green in a plain node environment
 * is the proof that the preset layer is still unit-testable.
 */
import { describe, expect, it } from "vitest";
import {
  DEFAULT_PRESET_BY_VIEWPORTS,
  type QualityPreset,
} from "../../seam.js";
import {
  hasExactPreset,
  presetForViewportCount,
  PRESET_BY_VIEWPORTS,
  resolvePresetKey,
  resolveViewportQuality,
} from "../quality.js";

const ORDER: readonly QualityPreset[] = ["PERFORMANCE", "BALANCED", "HIGH", "ULTRA"];

describe("preset table", () => {
  it("uses the seam's table verbatim, not a copy of it", () => {
    expect(PRESET_BY_VIEWPORTS).toBe(DEFAULT_PRESET_BY_VIEWPORTS);
    expect(PRESET_BY_VIEWPORTS[1]).toBe("ULTRA");
    expect(PRESET_BY_VIEWPORTS[2]).toBe("HIGH");
    expect(PRESET_BY_VIEWPORTS[3]).toBe("HIGH");
    expect(PRESET_BY_VIEWPORTS[4]).toBe("BALANCED");
    expect(PRESET_BY_VIEWPORTS[6]).toBe("PERFORMANCE");
  });
});

describe("presetForViewportCount", () => {
  it("maps the counts the seam lists", () => {
    expect(presetForViewportCount(1)).toBe("ULTRA");
    expect(presetForViewportCount(2)).toBe("HIGH");
    expect(presetForViewportCount(3)).toBe("HIGH");
    expect(presetForViewportCount(4)).toBe("BALANCED");
    expect(presetForViewportCount(6)).toBe("PERFORMANCE");
  });

  it("is monotonic — more viewports never means a richer preset", () => {
    for (let n = 1; n <= 8; n++) {
      const previous = n > 1 ? presetForViewportCount(n - 1) : null;
      const current = presetForViewportCount(n);
      if (previous) {
        expect(ORDER.indexOf(current)).toBeLessThanOrEqual(ORDER.indexOf(previous));
      }
    }
  });

  it("inherits the nearest LOWER listed count for unlisted counts", () => {
    // 5 is not in the table. Rounding UP to 6's PERFORMANCE would hand 5
    // players a worse preset than 4 get for no measured reason.
    expect(hasExactPreset(5)).toBe(false);
    expect(resolvePresetKey(5)).toBe(4);
    expect(presetForViewportCount(5)).toBe("BALANCED");

    // 7 and 8 inherit 6's PERFORMANCE.
    expect(resolvePresetKey(7)).toBe(6);
    expect(resolvePresetKey(8)).toBe(6);
    expect(presetForViewportCount(7)).toBe("PERFORMANCE");
    expect(presetForViewportCount(8)).toBe("PERFORMANCE");
  });

  it("clamps nonsense input to the 1-viewport entry instead of throwing", () => {
    // Quality is a starting hint; a bad hint must never take down the boot.
    expect(presetForViewportCount(0)).toBe("ULTRA");
    expect(presetForViewportCount(-4)).toBe("ULTRA");
    expect(presetForViewportCount(Number.NaN)).toBe("ULTRA");
  });
});

describe("resolveViewportQuality", () => {
  it("reports whether the preset was exact or inherited", () => {
    const exact = resolveViewportQuality(4);
    expect(exact).toMatchObject({ viewportCount: 4, presetKey: 4, presetIsExact: true });
    expect(exact.preset).toBe("BALANCED");

    const inherited = resolveViewportQuality(5);
    expect(inherited).toMatchObject({ viewportCount: 5, presetKey: 4, presetIsExact: false });
    expect(inherited.preset).toBe("BALANCED");
  });

  it("keeps renderScale at 1 — split-screen is not a reason to drop resolution", () => {
    // At 4-way 1080p each viewport framebuffer is already 960x540, a quarter of
    // the pixels. Shrinking further is a global downgrade for no measured gain,
    // and the brief is explicit that effects stay rich. The preset is the knob.
    for (const count of [1, 2, 3, 4, 5, 6, 7, 8]) {
      expect(resolveViewportQuality(count).renderScale).toBe(1);
    }
  });
});
