/**
 * Phase 10 — QUALITY LADDER: seam presets -> the donor's real settings.
 *
 * OWNER: the Phase 10 worker (`src/airjam/perf/**`).
 *
 * PURE DATA + PURE FUNCTIONS. No Three, no DOM, no donor import, so it is all
 * unit-testable in a plain node environment.
 *
 * ---------------------------------------------------------------------------
 * THE NAMING MISMATCH THAT SHAPES THIS FILE
 * ---------------------------------------------------------------------------
 * `seam.ts:240` declares FOUR presets: ULTRA | HIGH | BALANCED | PERFORMANCE.
 * The donor declares THREE: "potato" | "balanced" | "high" (`schema.js:52`).
 * They are different vocabularies for the same idea, so this file IS the
 * translation table, and two seam presets necessarily collapse onto one donor
 * tier (see `SEAM_TO_DONOR`).
 *
 * There is no fourth donor tier to invent, so nothing here is invented either.
 * Every value below is either (a) read from the donor with a `file:line` in
 * `PROVENANCE`, or (b) explicitly flagged as port policy rather than a donor
 * default.
 *
 * ---------------------------------------------------------------------------
 * WHAT THE DONOR DOES *NOT* HAVE (do not go looking for these knobs)
 * ---------------------------------------------------------------------------
 * The brief asked for a shadow-map-size and a particle-density knob per preset.
 * The donor has NEITHER, and saying so is the honest answer:
 *   - Shadow map size is hard-coded to 2048x2048 (`vehicles/diagnostics.js:10`
 *     consumed at `rendering/world.js:588`) and is identical for all three
 *     tiers. The only per-preset shadow lever is ENABLED or NOT.
 *   - Particle density is not preset-gated anywhere in `src/donor/effects/**`.
 *     `detailedBall` is `true` in all three profiles (`schema.js:61,74,87`), so
 *     it is not a density lever either. The only preset-gated effect object is
 *     the ball speed trail, which is gated on `effects` (`app/startup.js:638`).
 * Both are recorded below as `fixed` with their provenance so a future reader
 * does not waste an hour looking for a setting that does not exist.
 */

import type { QualityPreset } from "../seam.js";

/* -------------------------------------------------------------------------- */
/* Donor vocabulary                                                            */
/* -------------------------------------------------------------------------- */

/**
 * The donor's own preset ids, richest last. `schema.js:52`:
 * `const localQualityPresetIds = ["potato", "balanced", "high"];`
 */
export type DonorPreset = "potato" | "balanced" | "high";

export const DONOR_PRESET_IDS: readonly DonorPreset[] = Object.freeze([
  "potato",
  "balanced",
  "high",
]);

/**
 * The donor profile each seam preset resolves to.
 *
 * ULTRA and HIGH both land on `high`, and that is a real limitation rather than
 * a shortcut: the donor's richest tier is `high`, and there is nothing between
 * `high` and `high`. The only knob that still separates ULTRA from HIGH is
 * `renderScale`, and the port holds that at 1 for both (see below) rather than
 * inventing a 2x-resolution tier the donor cannot express.
 */
export const SEAM_TO_DONOR: Readonly<Record<QualityPreset, DonorPreset>> = Object.freeze({
  ULTRA: "high",
  HIGH: "high",
  BALANCED: "balanced",
  PERFORMANCE: "potato",
});

/** Seam presets ordered poorest -> richest. Index 0 is the floor. */
export const RICHNESS_ORDER: readonly QualityPreset[] = Object.freeze([
  "PERFORMANCE",
  "BALANCED",
  "HIGH",
  "ULTRA",
]);

/** Position of a preset in `RICHNESS_ORDER`. Unknown input clamps to the floor. */
export function richnessIndex(preset: QualityPreset): number {
  const index = RICHNESS_ORDER.indexOf(preset);
  return index < 0 ? 0 : index;
}

/** The poorer of two presets. Pure, and the only way quality is ever reduced. */
export function poorestOf(a: QualityPreset, b: QualityPreset): QualityPreset {
  return richnessIndex(a) <= richnessIndex(b) ? a : b;
}

/* -------------------------------------------------------------------------- */
/* Post chain — a mirror of the donor's own plan                               */
/* -------------------------------------------------------------------------- */

/**
 * The four expensive post chains, named as the donor plans them. These are the
 * only per-preset passes that add real fragment work, and they are worth naming
 * individually because the seam requires knowing whether they run.
 */
export type ExpensivePostChain = "aoSteps" | "wideBloom" | "fxaa" | "denoiseBloom";

export const EXPENSIVE_POST_CHAINS: readonly ExpensivePostChain[] = Object.freeze([
  "aoSteps",
  "wideBloom",
  "fxaa",
  "denoiseBloom",
]);

/** Exact shape of the donor's `referenceRenderPlan` return value. */
export interface PostPassPlan {
  readonly makeup: boolean;
  readonly fxaa: boolean;
  readonly bloom: boolean;
  readonly bloomDivisor: 4 | 8 | 16;
  readonly denoiseBloom: boolean;
  readonly wideBloom: boolean;
  /** 0, or the donor's 7 SSAO taps. */
  readonly aoSteps: number;
  readonly autoExposure: boolean;
}

/** The settings the post plan reads. Defaults are the donor's own defaults. */
export interface PostPlanInputs {
  readonly renderer: "makeup" | "original";
  readonly theme: string;
  readonly makeupBloom: number;
  readonly bloom: number;
  readonly makeupAO: number;
  readonly autoExposure: boolean;
}

/**
 * The donor's shipped graphics defaults, which are the values a fresh install
 * actually runs with (`settings/reference-graphics.js:5-13`).
 *
 * Note `renderer: "makeup"`. That single default decides which of the four
 * expensive chains can ever run, and it is the most consequential line in this
 * file — see `expensiveChainsFor`.
 */
export const POST_PLAN_DEFAULTS: PostPlanInputs = Object.freeze({
  renderer: "makeup",
  theme: "realistic",
  makeupBloom: 0.27,
  bloom: 0.19,
  makeupAO: 0.36,
  autoExposure: false,
});

/**
 * Pure mirror of `referenceRenderPlan` (`settings/reference-graphics.js:65-74`).
 *
 * Hand-written rather than imported on purpose: the port's decision logic has
 * to stay unit-testable with no donor in the module graph, and `vitest.config.mjs`
 * deliberately does not alias `@donor`. The consequence is that this function
 * can drift from the donor, so it is written as a line-for-line transcription
 * with the source line cited inline.
 */
export function postPlanFor(preset: DonorPreset, inputs: PostPlanInputs): PostPassPlan {
  const makeup = inputs.theme === "realistic" && inputs.renderer === "makeup";
  const high = preset === "high";
  return {
    makeup,
    fxaa: high,
    bloom: makeup ? inputs.makeupBloom > 0 : inputs.bloom > 0,
    bloomDivisor: preset === "potato" ? 16 : high ? 4 : 8,
    denoiseBloom: high,
    // Both of these are High-only, and they are MUTUALLY EXCLUSIVE by renderer.
    wideBloom: high && !makeup,
    aoSteps: high && makeup && inputs.makeupAO > 0 ? 7 : 0,
    autoExposure: makeup && inputs.autoExposure,
  };
}

/**
 * Which of the four expensive chains run for a preset + renderer combination.
 *
 * The finding that matters at the projector: `aoSteps` requires the makeup
 * renderer and `wideBloom` requires the original one, so the donor's shipped
 * default (`renderer: "makeup"`) can run at most THREE of the four, not four.
 * Any statement that "the four expensive chains run at ULTRA" would be wrong.
 */
export function expensiveChainsFor(
  preset: QualityPreset,
  inputs: PostPlanInputs = POST_PLAN_DEFAULTS,
): readonly ExpensivePostChain[] {
  const plan = postPlanFor(SEAM_TO_DONOR[preset], inputs);
  return EXPENSIVE_POST_CHAINS.filter((chain) => {
    switch (chain) {
      case "aoSteps":
        return plan.aoSteps > 0;
      case "wideBloom":
        return plan.wideBloom;
      case "fxaa":
        return plan.fxaa;
      case "denoiseBloom":
        return plan.denoiseBloom;
      default:
        return false;
    }
  });
}

/* -------------------------------------------------------------------------- */
/* The ladder                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * One seam preset resolved against the donor's actual knobs.
 *
 * `renderScale` and `donorRenderScaleDefault` are two different numbers on
 * purpose:
 *   - `donorRenderScaleDefault` is what the DONOR would seed on a fresh install
 *     (`schema.js:118` seeds renderScale from `min(1, profile.pixelRatio)`).
 *   - `renderScale` is what the PORT actually sets, and it is 1 at every tier.
 *
 * The port holds renderScale at 1 because lowering it is a global, visible
 * downgrade, and `viewport-budget.ts` shows fill rate is not the bottleneck:
 * splitting a canvas keeps total shaded pixels constant, so shrinking the buffer
 * buys nothing while costing sharpness. See PROFILING.md before changing it.
 */
export interface QualityLadderEntry {
  readonly preset: QualityPreset;
  readonly donorPreset: DonorPreset;

  /** The donor profile's own `pixelRatio` — a SEED, not what the port sets. */
  readonly donorPixelRatio: number;
  /** `min(1, donorPixelRatio)`, i.e. what the donor would seed renderScale to. */
  readonly donorRenderScaleDefault: number;
  /** What the port sets. 1 at every tier: see the note above. */
  readonly renderScale: number;

  readonly antialias: boolean;
  /** MSAA on the default framebuffer. */
  readonly shadowsEnabled: boolean;
  /** Fixed at 2048 by the donor. NOT a preset lever. */
  readonly shadowMapSize: 2048;
  /**
   * True when shadows are on. The donor sets `shadowMap.autoUpdate = false`
   * (`app/startup.js:604`) but then sets `needsUpdate = true` EVERY frame
   * (`app/startup.js:972`), so shadow maps are regenerated per frame anyway.
   * There is no shadow-update-rate knob to schedule against.
   */
  readonly shadowsUpdateEveryFrame: boolean;

  readonly environmentEnabled: boolean;
  /** Always "once": the PMREM probe is generated at boot and never refreshed. */
  readonly environmentUpdateRate: "once-at-startup";
  readonly environmentIntensity: 0.5;

  /** Gates the ball speed trail (`app/startup.js:638,951`). */
  readonly effectsEnabled: boolean;
  /** `true` in all three donor profiles, so it is not a density lever. */
  readonly detailedBall: boolean;
  /** `false` in all three donor profiles. */
  readonly showStadium: boolean;

  readonly toneMappingExposure: 1.15;
  readonly colorFilter: "none";

  readonly expensiveChains: readonly ExpensivePostChain[];
}

/** Every seam preset -> the donor tier it drives. */
export const DONOR_PRESET_FOR: Readonly<Record<QualityPreset, DonorPreset>> = SEAM_TO_DONOR;

/**
 * The one expensive chain that is multiplied by the viewport count and is worth
 * dropping first. With the shipped `makeup` renderer this is the 7-tap SSAO at
 * half resolution, and it is the ONLY chain whose per-viewport cost is large
 * enough to matter. `wideBloom` (4 extra targets) is the `original`-renderer
 * equivalent and is second.
 *
 * Keeping this in code rather than in prose is what makes the ladder actionable:
 * the governor is allowed to spend this chain before it is allowed to spend
 * render scale.
 */
export const FIRST_LEVER_TO_SPEND = "aoSteps" as const;

/* -------------------------------------------------------------------------- */
/* Provenance — every value above, with the line that defines it              */
/* -------------------------------------------------------------------------- */

export const PROVENANCE = Object.freeze({
  donorPixelRatio: "src/donor/settings/schema.js:57 (potato 0.6), :70 (balanced 0.7), :83 (high 2)",
  donorRenderScaleDefault: "src/donor/settings/schema.js:118 — min(1, profile.pixelRatio), clamped to [0.1,1]",
  renderScale: "PORT POLICY = 1. Phase 4 pinned it at src/airjam/viewports/quality.ts:87. Donor seeds 0.85 by default at src/donor/settings/schema.js:107.",
  antialias: "src/donor/settings/schema.js:58 (potato false), :71 (balanced false), :84 (high true)",
  shadowsEnabled: "src/donor/settings/schema.js:59, :72, :85 — consumed at src/donor/app/startup.js:602, :627",
  shadowMapSize:
    "FIXED 2048. src/donor/vehicles/diagnostics.js:10 (`const bc = 2048`) applied at src/donor/rendering/world.js:588 (`n.shadow.mapSize.set(bc, bc)`). Identical for all three tiers.",
  shadowsUpdateEveryFrame:
    "src/donor/app/startup.js:604 sets shadowMap.autoUpdate = false; :972 sets shadowMap.needsUpdate = true every frame. Net effect: per-frame shadow re-render when enabled.",
  environmentEnabled: "src/donor/settings/schema.js:62, :75, :88 — consumed at src/donor/app/startup.js:607",
  environmentUpdateRate:
    "FIXED once. PMREMGenerator.fromScene(RoomEnvironment, 0.04) at src/donor/app/startup.js:609, cached at :616, reused on preset change at :631-637. Never re-rendered.",
  environmentIntensity: "src/donor/app/startup.js:610 sets 0.5 when environment is on, 0 at :613 when it is off.",
  effectsEnabled:
    "src/donor/settings/schema.js:60, :73, :86 — gates the ball speed trail at src/donor/app/startup.js:638, :951 and the fennec post 'lightweight' flag at :596",
  detailedBall: "src/donor/settings/schema.js:61, :74, :87 — TRUE in all three profiles, so not a density lever.",
  showStadium:
    "src/donor/settings/schema.js:63, :76, :89 — false in all three. The stadium is skipped when shadows are off regardless: src/donor/rendering/world.js:211-212.",
  toneMappingExposure: "src/donor/settings/schema.js:65, :78, :91 — 1.15 in all three profiles.",
  colorFilter: "src/donor/settings/schema.js:66, :79, :92 — \"none\" in all three profiles.",
  expensiveChains: "src/donor/settings/reference-graphics.js:65-74 (referenceRenderPlan), consumed at src/donor/rendering/reference-post.js:65-142.",
  postDraws: "src/donor/rendering/reference-post.js:102-142 — the only post targets actually drawn.",
  postFusedFxaa:
    "IMPORTANT: FXAA is NOT an extra pass. reference-post.js:140 sets output.uFXAA on the SAME postFragment material that always runs, so fxaa adds ALU, not a draw.",
});

/* -------------------------------------------------------------------------- */
/* The ladder table                                                            */
/* -------------------------------------------------------------------------- */

const entry = (
  preset: QualityPreset,
  donorPreset: DonorPreset,
  profile: { pixelRatio: number; antialias: boolean; shadows: boolean; effects: boolean },
): QualityLadderEntry => {
  const rich = profile.shadows;
  return {
    preset,
    donorPreset,
    donorPixelRatio: profile.pixelRatio,
    donorRenderScaleDefault: Math.min(1, profile.pixelRatio),
    renderScale: 1,
    antialias: profile.antialias,
    shadowsEnabled: profile.shadows,
    shadowMapSize: 2048,
    shadowsUpdateEveryFrame: rich,
    environmentEnabled: rich,
    environmentUpdateRate: "once-at-startup",
    environmentIntensity: 0.5,
    effectsEnabled: profile.effects,
    // Verified true in all three donor profiles (schema.js:61, :74, :87).
    detailedBall: true,
    showStadium: false,
    toneMappingExposure: 1.15,
    colorFilter: "none",
    expensiveChains: expensiveChainsFor(preset),
  };
};

/**
 * THE LADDER. Every `QualityPreset` in `seam.ts:240` maps to a concrete,
 * non-empty, donor-backed setting set.
 */
export const QUALITY_LADDER: Readonly<Record<QualityPreset, QualityLadderEntry>> = Object.freeze({
  // potato  — schema.js:55-67
  PERFORMANCE: entry("PERFORMANCE", "potato", {
    pixelRatio: 0.6,
    antialias: false,
    shadows: false,
    effects: false,
  }),
  // balanced — schema.js:68-80. Identical to potato except pixelRatio.
  BALANCED: entry("BALANCED", "balanced", {
    pixelRatio: 0.7,
    antialias: false,
    shadows: false,
    effects: false,
  }),
  // high — schema.js:81-93. The only tier that spends anything.
  HIGH: entry("HIGH", "high", { pixelRatio: 2, antialias: true, shadows: true, effects: true }),
  // ULTRA — same donor tier as HIGH; the donor has no tier above `high`.
  ULTRA: entry("ULTRA", "high", { pixelRatio: 2, antialias: true, shadows: true, effects: true }),
});

/** Ladder lookup. Total: every `QualityPreset` has an entry. */
export function ladderFor(preset: QualityPreset): QualityLadderEntry {
  return QUALITY_LADDER[preset];
}

/** The donor tier a seam preset drives. */
export function donorPresetFor(preset: QualityPreset): DonorPreset {
  return SEAM_TO_DONOR[preset];
}

/** Every seam preset, richest first — the order the governor walks. */
export const PRESETS_RICHEST_FIRST: readonly QualityPreset[] = Object.freeze([
  "ULTRA",
  "HIGH",
  "BALANCED",
  "PERFORMANCE",
]);

/** Step one tier richer. Returns `preset` unchanged at the ceiling. */
export function stepRicher(preset: QualityPreset): QualityPreset {
  const index = RICHNESS_ORDER.indexOf(preset);
  return index < 0 || index >= RICHNESS_ORDER.length - 1 ? preset : RICHNESS_ORDER[index + 1];
}

/** Step one tier poorer. Returns `preset` unchanged at the floor. */
export function stepPoorer(preset: QualityPreset): QualityPreset {
  const index = RICHNESS_ORDER.indexOf(preset);
  return index <= 0 ? preset : RICHNESS_ORDER[index - 1];
}
