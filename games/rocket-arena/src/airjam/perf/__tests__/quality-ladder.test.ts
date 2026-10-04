/**
 * The quality ladder: every seam preset resolves to a concrete, donor-backed
 * setting set, and the post-plan mirror agrees with the donor's own logic.
 */
import { describe, expect, it } from "vitest";
import { DEFAULT_PRESET_BY_VIEWPORTS, type QualityPreset } from "../../seam.js";
import {
  DONOR_PRESET_IDS,
  EXPENSIVE_POST_CHAINS,
  POST_PLAN_DEFAULTS,
  QUALITY_LADDER,
  RICHNESS_ORDER,
  donorPresetFor,
  expensiveChainsFor,
  ladderFor,
  postPlanFor,
  poorestOf,
  stepPoorer,
  stepRicher,
} from "../quality-ladder.js";

const ALL_PRESETS: readonly QualityPreset[] = ["ULTRA", "HIGH", "BALANCED", "PERFORMANCE"];

describe("ladder coverage", () => {
  it("has an entry for every preset the seam declares", () => {
    const declared = new Set(Object.values(DEFAULT_PRESET_BY_VIEWPORTS));
    expect(new Set(ALL_PRESETS)).toEqual(declared);
    for (const preset of ALL_PRESETS) {
      expect(QUALITY_LADDER[preset]).toBeDefined();
      expect(QUALITY_LADDER[preset].preset).toBe(preset);
    }
  });

  it("maps every preset to a non-empty, concrete donor setting set", () => {
    for (const preset of ALL_PRESETS) {
      const entry = ladderFor(preset);
      // Every field is a real, definite value — not null, not NaN, not 0-unset.
      expect(DONOR_PRESET_IDS).toContain(entry.donorPreset);
      expect(entry.donorPixelRatio).toBeGreaterThan(0);
      expect(entry.renderScale).toBeGreaterThan(0);
      expect(entry.shadowMapSize).toBe(2048);
      expect(entry.environmentUpdateRate).toBe("once-at-startup");
      expect(entry.environmentIntensity).toBe(0.5);
      expect(entry.toneMappingExposure).toBe(1.15);
      expect(entry.colorFilter).toBe("none");
      expect(typeof entry.shadowsEnabled).toBe("boolean");
      expect(typeof entry.antialias).toBe("boolean");
      expect(typeof entry.effectsEnabled).toBe("boolean");
      // Booleans that are always-true/false in the donor are still concrete.
      expect(entry.detailedBall).toBe(true);
      expect(entry.showStadium).toBe(false);
    }
  });

  it("holds render scale at 1 for every preset, matching Phase 4's pin", () => {
    for (const preset of ALL_PRESETS) {
      expect(ladderFor(preset).renderScale).toBe(1);
    }
  });

  it("only spends GPU on the donor's `high` tier", () => {
    // Verified donor fact: potato/balanced differ from high only in pixelRatio
    // and the shadow/effects/antialias/environment booleans
    // (schema.js:55-93). Nothing else varies.
    expect(ladderFor("PERFORMANCE").shadowsEnabled).toBe(false);
    expect(ladderFor("BALANCED").shadowsEnabled).toBe(false);
    expect(ladderFor("HIGH").shadowsEnabled).toBe(true);
    expect(ladderFor("ULTRA").shadowsEnabled).toBe(true);
    expect(ladderFor("HIGH").environmentEnabled).toBe(true);
    expect(ladderFor("BALANCED").environmentEnabled).toBe(false);
  });

  it("collapses ULTRA onto HIGH because the donor has no richer tier", () => {
    // The honest outcome: the donor's richest tier is `high` and there is
    // nothing between `high` and `high`.
    expect(donorPresetFor("ULTRA")).toBe("high");
    expect(donorPresetFor("HIGH")).toBe("high");
    expect(donorPresetFor("BALANCED")).toBe("balanced");
    expect(donorPresetFor("PERFORMANCE")).toBe("potato");
  });

  it("keeps the pixelRatio ordering potato < balanced < high", () => {
    expect(ladderFor("PERFORMANCE").donorPixelRatio).toBe(0.6);
    expect(ladderFor("BALANCED").donorPixelRatio).toBe(0.7);
    expect(ladderFor("HIGH").donorPixelRatio).toBe(2);
  });
});

describe("post plan mirror (reference-graphics.js:65-74)", () => {
  it("turns the expensive chains on only for the high tier", () => {
    const high = postPlanFor("high", POST_PLAN_DEFAULTS);
    expect(high.fxaa).toBe(true);
    expect(high.denoiseBloom).toBe(true);
    expect(high.aoSteps).toBe(7);
    // makeup is the shipped default, so wideBloom is OFF for high: the two
    // chains are mutually exclusive by renderer.
    expect(high.wideBloom).toBe(false);

    for (const preset of ["balanced", "potato"] as const) {
      const plan = postPlanFor(preset, POST_PLAN_DEFAULTS);
      expect(plan.fxaa).toBe(false);
      expect(plan.denoiseBloom).toBe(false);
      expect(plan.aoSteps).toBe(0);
      expect(plan.wideBloom).toBe(false);
    }
  });

  it("gives wideBloom to high+original instead of aoSteps", () => {
    const plan = postPlanFor("high", { ...POST_PLAN_DEFAULTS, renderer: "original" });
    expect(plan.wideBloom).toBe(true);
    expect(plan.aoSteps).toBe(0);
  });

  it("uses the donor's bloomDivisor ladder 16 / 8 / 4", () => {
    expect(postPlanFor("potato", POST_PLAN_DEFAULTS).bloomDivisor).toBe(16);
    expect(postPlanFor("balanced", POST_PLAN_DEFAULTS).bloomDivisor).toBe(8);
    expect(postPlanFor("high", POST_PLAN_DEFAULTS).bloomDivisor).toBe(4);
  });

  it("never reports all four expensive chains at once on the shipped renderer", () => {
    // aoSteps needs `makeup`, wideBloom needs `original`. So on any single
    // renderer, at most three of the four can run.
    for (const preset of ALL_PRESETS) {
      for (const renderer of ["makeup", "original"] as const) {
        const chains = expensiveChainsFor(preset, { ...POST_PLAN_DEFAULTS, renderer });
        expect(chains.length).toBeLessThanOrEqual(3);
        for (const chain of chains) {
          expect(EXPENSIVE_POST_CHAINS).toContain(chain);
        }
      }
    }
  });

  it("reports exactly the makeup chains at ULTRA with the shipped defaults", () => {
    expect(expensiveChainsFor("ULTRA")).toEqual(["aoSteps", "fxaa", "denoiseBloom"]);
  });

  it("drops aoSteps when makeupAO is zero", () => {
    const chains = expensiveChainsFor("ULTRA", { ...POST_PLAN_DEFAULTS, makeupAO: 0 });
    expect(chains).not.toContain("aoSteps");
  });
});

describe("richness ordering", () => {
  it("steps one tier at a time and clamps at both ends", () => {
    expect(stepRicher("PERFORMANCE")).toBe("BALANCED");
    expect(stepRicher("BALANCED")).toBe("HIGH");
    expect(stepRicher("HIGH")).toBe("ULTRA");
    expect(stepRicher("ULTRA")).toBe("ULTRA");

    expect(stepPoorer("ULTRA")).toBe("HIGH");
    expect(stepPoorer("HIGH")).toBe("BALANCED");
    expect(stepPoorer("BALANCED")).toBe("PERFORMANCE");
    expect(stepPoorer("PERFORMANCE")).toBe("PERFORMANCE");
  });

  it("only ever reduces when taking the poorest of two", () => {
    expect(poorestOf("ULTRA", "PERFORMANCE")).toBe("PERFORMANCE");
    expect(poorestOf("PERFORMANCE", "ULTRA")).toBe("PERFORMANCE");
    expect(poorestOf("HIGH", "HIGH")).toBe("HIGH");
  });

  it("is ordered poorest first", () => {
    expect(RICHNESS_ORDER[0]).toBe("PERFORMANCE");
    expect(RICHNESS_ORDER[RICHNESS_ORDER.length - 1]).toBe("ULTRA");
  });
});
