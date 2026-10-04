/**
 * Phase 9 — PARITY VERIFICATION SYSTEM.
 *
 * OWNER: the Phase 9 parity worker (`src/airjam/parity/**`).
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS SUBSYSTEM IS FOR
 * ---------------------------------------------------------------------------
 * This is a PORT of a working game, so the only question that matters is
 * whether the port is the same game. Asserting that is worth nothing; proving
 * it is the entire point of Phase 9. This module tree is the proof apparatus:
 *
 *   checklist.ts     WHAT has to be true, as typed data a human or CI can ask
 *                    "what is left to prove" about. Carries no status field, so
 *                    nothing here can claim a verification nobody performed.
 *   baseline.ts      the FROZEN game-feel numbers, transcribed from the
 *                    donor-side measurement run, with every tolerance justified.
 *   physics-parity.ts compares a captured run against those numbers, and reports
 *                    pass / fail / unverified / blocked-upstream per metric.
 *   snapshot.ts      reads the donor's own `?physicsDebug=1` hook and decides
 *                    whether the simulation actually stepped.
 *   asset-manifest.ts compares the donor's asset tree against the port's in
 *                    BOTH directions, plus the set the physics cannot start without.
 *   capture.ts       the deterministic capture PLAN and the HUD text diff. The
 *                    browser driving lives in `_scratch/parity/`, not here.
 *   image-diff.ts    the pixel-diff METRIC, with an explicit statement of what a
 *                    WebGL diff ratio is and is not allowed to mean.
 *   report.ts        the pass/fail/BLOCKED table and the release gate.
 *
 * Everything here except the two `fs`/browser-dependent call sites is PURE, so
 * the whole checklist and every comparator is unit-testable without a browser.
 * `index.ts` is a barrel: it exists so a script has one import to name, and it
 * deliberately does not export a `run()` — driving a browser and reading the
 * filesystem is the script's job, and putting it in `src/` would drag Node
 * built-ins into the product's typecheck for no gain.
 *
 * Run the whole pass with:
 *   npx tsx C:/Users/Wasif/Documents/airjam-RL/_scratch/parity/run-parity.ts
 */

export {
  BASELINE_PROVENANCE,
  CONTROL_ORDER,
  PHYSICS_BASELINE,
  PHYSICS_CORE_SHA256,
  SIM_ENGINE_FACTS,
  physicsBaseline,
} from "./baseline.js";
export type {
  PhysicsBaselineEntry,
  PhysicsMetricId,
  PhysicsUnit,
  ToleranceReason,
} from "./baseline.js";

export {
  PARITY_AREAS,
  PARITY_CHECKLIST,
  STATUS_ORDER_FOR_TABLES,
  blockingDimensions,
  dimensionsInArea,
  parityDimension,
  summarizeParity,
  validateChecklist,
} from "./checklist.js";
export type {
  AreaSummary,
  DimensionResult,
  ParityArea,
  ParityDimension,
  ParitySummary,
  ParityVerification,
} from "./checklist.js";

export {
  MATCH_START_DEFECT,
  REQUIRES_SCRIPTED_SCENARIO,
  comparePhysicsToBaseline,
  deriveMeasurements,
  summarizePhysicsReport,
  withinTolerance,
} from "./physics-parity.js";
export type {
  DeriveOptions,
  DerivedMeasurements,
  DerivationCoverage,
  MetricVerdict,
  ParityStatus,
  PhysicsMeasurements,
  PhysicsParityReport,
} from "./physics-parity.js";

export {
  OPENING_PHASES,
  SNAPSHOT_LIMITATIONS,
  assessSimProgress,
  carCountOf,
  nativeTickOf,
  orderedSamples,
  parsePhysicsSnapshot,
  readCarObservation,
} from "./snapshot.js";
export type {
  CarObservation,
  PhysicsDebugMetadata,
  PhysicsDebugMetrics,
  PhysicsDebugSample,
  PhysicsDebugSnapshot,
  SimProgressStatus,
  SimProgressVerdict,
} from "./snapshot.js";

export {
  COLLISION_MANIFEST_PATHS,
  COLLISION_MESH_COUNT,
  PHYSICS_RUNTIME_PATHS,
  REQUIRED_PHYSICS_ASSETS,
  checkRequiredPhysicsAssets,
  compareAssetInventories,
  normalizeAssetPath,
} from "./asset-manifest.js";
export type {
  AssetDiff,
  AssetEntry,
  AssetInventory,
  HashMismatch,
  MissingRequiredAsset,
  RequiredAsset,
  RequiredAssetsReport,
  SizeMismatch,
} from "./asset-manifest.js";

export {
  ALL_SCENARIOS,
  CAPTURE_PROVENANCE,
  SCENARIOS,
  buildCapturePlan,
  buildHudDump,
  buildUrl,
  describePlan,
  diffHudDumps,
  meetsGate,
  normalizeHudText,
} from "./capture.js";
export type {
  CapturePlan,
  CaptureProvenance,
  CaptureScenario,
  CaptureStep,
  HudDiff,
  HudDump,
  PlanOverrides,
  ScenarioSpec,
} from "./capture.js";

export {
  DEFAULT_GRADE_THRESHOLDS,
  GRADE_ACTION,
  WEBGL_DIFF_GUIDANCE,
  diffRgba,
  gradeDiff,
  isDiffError,
} from "./image-diff.js";
export type {
  DiffGrade,
  DiffInputError,
  DiffOptions,
  GradeThresholds,
  ImageDiffResult,
  RgbaImage,
} from "./image-diff.js";

export {
  PASS_SECTION_ORDER,
  STATUS_LABEL,
  assetRows,
  buildParityPass,
  captureRows,
  checklistRows,
  formatParityTable,
  gradeOf,
  physicsRows,
  summarizePass,
} from "./report.js";
export type { ParityPass, ParityPassInput, ParityRow } from "./report.js";
