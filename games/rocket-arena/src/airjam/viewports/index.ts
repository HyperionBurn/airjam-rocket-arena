/**
 * Phase 4 — SPLIT-SCREEN PUBLIC API.
 *
 * OWNER: the Phase 4 worker (`src/airjam/viewports/**`).
 *
 * The barrel is split by dependency on purpose, so a consumer that only needs
 * geometry or presets never drags Three.js or the donor into its graph:
 *
 *   layouts, quality, hud-geometry, view-kernel   PURE — no Three, no donor
 *   viewport-application                          structural types only
 *   camera-pool                                   imports the donor camera
 */

export {
  assignPlayers,
  assertGapFree,
  computeViewportRects,
  DEFAULT_LAYOUT_BY_COUNT,
  gridShapeFor,
  LAYOUT_SHAPE,
  layoutCanHost,
  rectsOverlap,
  resolveDefaultLayout,
  tilingDefects,
  toGLViewport,
  toTargetRect,
  totalRectArea,
  viewportAspect,
  type BufferSize,
  type GLRect,
  type LayoutShape,
  type ViewportGeometry,
  type ViewportLayoutName,
  type ViewportRect,
} from "./layouts.js";

export {
  hasExactPreset,
  presetForViewportCount,
  PRESET_BY_VIEWPORTS,
  resolvePresetKey,
  resolveViewportQuality,
  type QualityPreset,
  type ViewportQualityPlan,
} from "./quality.js";

export {
  computeHudGeometry,
  hudGeometryIsContained,
  hudScopeOf,
  placeHudInfo,
  type GlobalHudBand,
  type HudBox,
  type HudGeometry,
  type HudGeometryOptions,
  type HudInfoKind,
  type HudScope,
  type PlayerHudSlot,
} from "./hud-geometry.js";

export {
  assertViewAbi,
  DONOR_CAMERA_SETTINGS,
  DonorViewKernel,
  MirroredViewKernel,
  VIEW_IN,
  VIEW_INPUT_FLOATS,
  VIEW_OUT,
  VIEW_OUTPUT_FLOATS,
  type MirroredViewKernelOptions,
  type ViewKernel,
} from "./view-kernel.js";

export {
  ViewportApplication,
  type Rect4Like,
  type Size2Like,
  type ViewportApplicationOptions,
  type ViewportRendererLike,
  type ViewportTargetLike,
} from "./viewport-application.js";

export {
  PlayerViewPool,
  type CarCameraStateLike,
  type ChaseCameraLike,
  type ChaseCameraSettings,
  type PerspectiveCameraLike,
  type PlayerCamera,
  type PlayerViewPoolOptions,
  type TransformLike,
  type Vec3Like,
} from "./camera-pool.js";
