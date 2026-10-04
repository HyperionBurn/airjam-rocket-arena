/**
 * Phase 10 — PERFORMANCE INSTRUMENTATION + QUALITY LADDER. Public API.
 *
 * OWNER: the Phase 10 worker (`src/airjam/perf/**`).
 *
 * The barrel is split by dependency on purpose. The decision logic never pulls
 * in a browser, a renderer or the donor, so it stays unit-testable in node:
 *
 *   quality-ladder   PURE data + the donor's post-plan mirror
 *   frame-sampler    PURE percentile maths; the rAF source is the only DOM part
 *   preset-resolver  PURE hysteretic governor
 *   viewport-budget  PURE geometry + draw counting
 *   harness          PURE criteria/verdict; the pump is the only DOM part
 *
 * ---------------------------------------------------------------------------
 * HEADLINE FINDINGS, so a reader does not have to rediscover them
 * ---------------------------------------------------------------------------
 * 1. The donor's `AdaptiveResolution` (`rendering/adaptive-resolution.js`) is
 *    DEAD CODE. A repo-wide search for `AdaptiveResolution` and
 *    `adaptive-resolution` returns only its own definition — it is imported
 *    nowhere and instantiated nowhere. So the donor does NOT already adapt
 *    resolution at runtime; there is no per-frame resolution churn to protect.
 *    Its sampling policy is nonetheless the right reference for ours, and the
 *    governor borrows its pause rule and its 1.5 s window.
 * 2. The donor's `FrameProfiler` has a public `snapshot()` with p50/p95/fps and
 *    dropped-tick counts, but the instance is a module-local `const` at
 *    `app/startup.js:561` and is published nowhere. It cannot be read from
 *    outside, so the port samples rAF itself.
 * 3. The donor has THREE presets (`potato`/`balanced`/`high`) against the seam's
 *    four, and `potato` and `balanced` are identical except for `pixelRatio`.
 *    The ladder records that instead of inventing a fourth tier.
 * 4. The donor has no per-preset shadow-map-size and no particle-density knob.
 *    Shadow size is hard-coded 2048 and density is not preset-gated at all.
 * 5. Split screen is FILL-RATE NEUTRAL: N viewports shading 1/N of the canvas
 *    each shade the same total pixels. The cost that grows with N is the post
 *    chain and the draw-call count, which is why the ladder spends the SSAO
 *    chain rather than render scale. See viewport-budget.ts.
 *
 * NO GPU NUMBER APPEARS ANYWHERE IN THIS DIRECTORY. Every quantity is either
 * geometry, a count read from donor source with a `file:line`, or a target the
 * human is asked to validate. PROFILING.md states what cannot be measured here.
 */

export {
  DONOR_PRESET_FOR,
  DONOR_PRESET_IDS,
  EXPENSIVE_POST_CHAINS,
  FIRST_LEVER_TO_SPEND,
  POST_PLAN_DEFAULTS,
  PRESETS_RICHEST_FIRST,
  PROVENANCE,
  QUALITY_LADDER,
  RICHNESS_ORDER,
  SEAM_TO_DONOR,
  donorPresetFor,
  expensiveChainsFor,
  ladderFor,
  poorestOf,
  postPlanFor,
  richnessIndex,
  stepPoorer,
  stepRicher,
  type DonorPreset,
  type ExpensivePostChain,
  type PostPassPlan,
  type PostPlanInputs,
  type QualityLadderEntry,
} from "./quality-ladder.js";

export {
  DEFAULT_BUDGET_MS,
  FrameSampler,
  KNOWN_REFRESH_RATES,
  countDroppedFrames,
  createDonorSnapshotSource,
  createRafFrameSource,
  frameBudget,
  nearestIndex,
  percentile,
  summarize,
  type DonorProfilerLike,
  type DonorProfilerSnapshot,
  type FrameBudget,
  type FrameDelta,
  type FrameSource,
  type FrameStats,
  type LabelledStats,
  type RafWindow,
  type SummarizeOptions,
} from "./frame-sampler.js";

export {
  DEFAULT_GOVERNOR_POLICY,
  PRESET_CEILING_BY_TIER,
  PresetGovernor,
  capabilityTier,
  resolveStartingPreset,
  type CapabilityTier,
  type DeviceCapability,
  type GovernorDecision,
  type GovernorPolicy,
  type GovernorReason,
  type GovernorWindow,
  type StartingPreset,
} from "./preset-resolver.js";

export {
  ALLOCATED_VIEWPORT_COUNTS,
  allocateQuality,
  buildViewportBudget,
  gridRects,
  postDraws,
  type PostDraw,
  type QualityAllocation,
  type Rect,
  type ViewportBudget,
  type ViewportBudgetInput,
} from "./viewport-budget.js";

export {
  DEFAULT_CRITERIA,
  MeasurementSession,
  PROJECTOR_CRITERIA,
  PROVENANCE_GPU,
  PROVENANCE_SOFTWARE,
  createRafPump,
  evaluateFrameStats,
  runMeasurement,
  type FramePump,
  type MeasurementCriteria,
  type MeasurementReport,
  type MeasurementRequest,
  type Verdict,
} from "./harness.js";
