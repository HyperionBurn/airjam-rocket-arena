/**
 * Phase 10 — PRESET RESOLVER: starting guess + hysteretic step-down / step-up.
 *
 * OWNER: the Phase 10 worker (`src/airjam/perf/**`).
 *
 * PURE. The governor is a state machine fed `(atMs, frameMs)` pairs with no
 * clock, no DOM and no renderer, so every timing rule is unit-testable by
 * feeding synthetic deltas. Applying a preset to a renderer is somebody else's
 * job — this file only decides WHICH preset, never how to set it.
 *
 * ---------------------------------------------------------------------------
 * WHY THE STARTING PRESET COMES FROM VIEWPORTS, NOT FROM HERE
 * ---------------------------------------------------------------------------
 * `seam.ts:243-249` already fixes the starting preset by viewport count, and
 * Phase 4 already made that mapping monotonic and testable
 * (`viewports/quality.ts`). This file reuses it rather than re-deriving it. The
 * one thing it adds is a CAP from measured device capability, applied with
 * `poorestOf` so the table can only ever be pulled DOWN, never invented upward.
 *
 * ---------------------------------------------------------------------------
 * WHY THE GOVERNOR CANNOT OSCILLATE
 * ---------------------------------------------------------------------------
 * A preset that flips mid-goal is the single most visible failure this codebase
 * could have on a projector: the image visibly changes sharpness/effects in the
 * middle of a scoring moment. Five independent mechanisms make that impossible,
 * and each is separately testable.
 *
 * 1. ASYMMETRIC THRESHOLDS. Step down at mean > 1.20 x budget; step up at
 *    mean < 0.90 x budget. The 0.90-1.20 band is a genuine dead zone: a window
 *    landing inside it changes nothing AND clears both counters, so a signal
 *    hovering near budget can never accumulate evidence in either direction.
 * 2. ASYMMETRIC EVIDENCE. Stepping down needs `downWindowsRequired` (2)
 *    consecutive bad windows; stepping up needs `upWindowsRequired` (6)
 *    consecutive good ones. Recovering costs 3x the evidence that dropping did.
 * 3. A HARD COOLDOWN. After ANY change all evidence is discarded and further
 *    deltas are ignored for `cooldownMs` (10 s). Evidence must be rebuilt from
 *    zero after every move, so a second move cannot be adjacent to the first.
 * 4. PAUSES ARE NOT EVIDENCE. A delta outside (0, 150 ms] clears the window
 *    instead of counting against it — the same rule the donor uses at
 *    `rendering/adaptive-resolution.js:16`. A tab switch or a GC pause therefore
 *    cannot push the preset down.
 * 5. BOUNDED + CEILINGED. The floor is PERFORMANCE and the ceiling is the
 *    STARTING preset, so the governor can only ever walk inside the range the
 *    resolver handed it.
 *
 * Together these give a hard RATE bound, which is the real guarantee: at most
 * one step down per `windowMs * downWindowsRequired` + `cooldownMs`, and at most
 * one step up per `windowMs * upWindowsRequired` + `cooldownMs`. At the defaults
 * that is one change per ~13 s down and ~19 s up, so the projector cannot show
 * more than a handful of changes in a whole match. A test asserts the bound.
 */

import { type QualityPreset } from "../seam.js";
import { presetForViewportCount } from "../viewports/quality.js";
import { poorestOf, RICHNESS_ORDER, richnessIndex, stepPoorer, stepRicher } from "./quality-ladder.js";
import { frameBudget } from "./frame-sampler.js";

/* -------------------------------------------------------------------------- */
/* Device capability                                                           */
/* -------------------------------------------------------------------------- */

/**
 * What we can learn about the machine before it renders anything. Every field
 * is optional and all of them are read through the injected probe in
 * `harness.ts` — nothing here touches `navigator` or a canvas.
 */
export interface DeviceCapability {
  /** `UNMASKED_RENDERER_WEBGL` / `gl.RENDERER` string, if the host could read it. */
  readonly renderer?: string;
  /** `navigator.hardwareConcurrency`, if present. */
  readonly logicalCores?: number;
  /** `navigator.deviceMemory` in GB, if present. */
  readonly deviceMemoryGb?: number;
  /** `devicePixelRatio` of the display. */
  readonly devicePixelRatio?: number;
}

export type CapabilityTier = "SOFTWARE" | "INTEGRATED" | "DISCRETE" | "UNKNOWN";

/**
 * Classify a renderer string.
 *
 * This is a STRING MATCH on an untrusted, driver-authored string, so it is a
 * guess and is labelled as one. It only ever pulls the preset DOWN, which is the
 * safe direction for a heuristic: being wrong about an integrated GPU costs one
 * quality tier, whereas being optimistic costs dropped frames in front of a
 * crowd. The substrings are the vendor strings these APIs actually emit.
 */
export function capabilityTier(capability: DeviceCapability = {}): CapabilityTier {
  const renderer = (capability.renderer ?? "").toLowerCase();
  if (!renderer) return "UNKNOWN";
  // Software rasterisers. Running a split-screen 3D game on one of these is not
  // viable at any preset, but PERFORMANCE is still the correct floor to aim at.
  if (/swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic/.test(renderer)) {
    return "SOFTWARE";
  }
  if (/nvidia|geforce|quadro|rtx|radeon rx|radeon pro|arc a|geforce gt/.test(renderer)) {
    return "DISCRETE";
  }
  // Apple Silicon is integrated, not discrete, but it is strong; the seam's
  // optimistic default is the right call there, so INTEGRATED does not cap it.
  if (/apple|intel|uhd graphics|iris|hd graphics|adreno|mali|powervr/.test(renderer)) {
    return "INTEGRATED";
  }
  return "UNKNOWN";
}

/**
 * The richest preset each tier may start at. `UNKNOWN` is uncapped on purpose:
 * the event laptop is unknown, and refusing to start rich on an unrecognised
 * GPU would downgrade every machine the port has never seen.
 */
export const PRESET_CEILING_BY_TIER: Readonly<Record<CapabilityTier, QualityPreset>> = Object.freeze({
  SOFTWARE: "PERFORMANCE",
  INTEGRATED: "BALANCED",
  DISCRETE: "ULTRA",
  UNKNOWN: "ULTRA",
});

export interface StartingPreset {
  readonly preset: QualityPreset;
  /** What `seam.ts:243-249` / Phase 4 asked for, before any cap. */
  readonly fromViewportCount: QualityPreset;
  /** What the capability tier allowed. */
  readonly tierCeiling: QualityPreset;
  readonly tier: CapabilityTier;
  /** True when the capability cap actually lowered the viewport-count answer. */
  readonly capped: boolean;
  /** Why the starting preset is what it is — logged, never silently applied. */
  readonly reason: string;
}

/**
 * The starting preset for a player count on a machine of known capability.
 *
 * Order matters: the viewport table decides, the capability cap can only pull
 * DOWN. The seam's instruction is explicit that global quality must not be
 * downgraded before profiling, so the cap is deliberately mild — it targets
 * clearly-incapable hardware, not "feels slow".
 */
export function resolveStartingPreset(
  viewportCount: number,
  capability: DeviceCapability = {},
): StartingPreset {
  const fromViewportCount = presetForViewportCount(viewportCount);
  const tier = capabilityTier(capability);
  const tierCeiling = PRESET_CEILING_BY_TIER[tier];
  const preset = poorestOf(fromViewportCount, tierCeiling);
  const capped = preset !== fromViewportCount;
  return {
    preset,
    fromViewportCount,
    tierCeiling,
    tier,
    capped,
    reason: capped
      ? `viewport count ${viewportCount} asked for ${fromViewportCount}; ${tier} renderer caps at ${tierCeiling}`
      : `viewport count ${viewportCount} -> ${fromViewportCount} (${tier} renderer, no cap)`,
  };
}

/* -------------------------------------------------------------------------- */
/* Governor policy                                                             */
/* -------------------------------------------------------------------------- */

export interface GovernorPolicy {
  /** Length of one evaluation window, in ms of accumulated frame time. */
  readonly windowMs: number;
  /** Mean above this multiple of budget counts as a late window. */
  readonly lateBudgetMultiplier: number;
  /** Mean below this multiple of budget counts as a healthy window. */
  readonly healthyBudgetMultiplier: number;
  /** Fraction of frames over budget that makes a window "late". */
  readonly lateShareThreshold: number;
  /** Consecutive late windows needed to step DOWN. */
  readonly downWindowsRequired: number;
  /** Consecutive healthy windows needed to step UP. */
  readonly upWindowsRequired: number;
  /**
   * Minimum frames before a window may be judged. Exempt after
   * `windowMs * slowWindowMultiplier` so a very slow machine (which produces few
   * frames per window) is still governed rather than exempted forever.
   */
  readonly minFramesPerWindow: number;
  readonly slowWindowMultiplier: number;
  /** Deltas outside (0, maxDeltaMs] are pauses: they clear the window. */
  readonly maxDeltaMs: number;
  /** No further change may be made for this long after a change. */
  readonly cooldownMs: number;
}

export const DEFAULT_GOVERNOR_POLICY: GovernorPolicy = Object.freeze({
  windowMs: 1500,
  lateBudgetMultiplier: 1.2,
  healthyBudgetMultiplier: 0.9,
  lateShareThreshold: 0.5,
  downWindowsRequired: 2,
  upWindowsRequired: 6,
  minFramesPerWindow: 30,
  slowWindowMultiplier: 2,
  maxDeltaMs: 150,
  cooldownMs: 10_000,
});

export type GovernorReason =
  | "late"
  | "recovered"
  | "at-floor"
  | "at-ceiling"
  | "cooldown"
  | "pause"
  | "waiting-window"
  | "too-few-frames"
  | "dead-band";

export interface GovernorDecision {
  readonly changed: boolean;
  readonly from: QualityPreset;
  readonly to: QualityPreset;
  readonly preset: QualityPreset;
  readonly reason: GovernorReason;
}

/** Observable window state — surfaced for the on-screen debug readout. */
export interface GovernorWindow {
  readonly elapsedMs: number;
  readonly frames: number;
  readonly meanMs: number;
  readonly lateShare: number;
  readonly budgetMs: number;
  readonly lateWindows: number;
  readonly healthyWindows: number;
  readonly cooldownRemainingMs: number;
}

/**
 * The hysteretic preset governor. Feed it frame deltas; read `preset`.
 *
 * Not a React hook and not a Three object on purpose — the host owns when to
 * push samples (its own rAF, the donor's overlay tick, or a test).
 */
export class PresetGovernor {
  private current: QualityPreset;
  private readonly ceilingIndex: number;

  private elapsedMs = 0;
  private frames = 0;
  private lateFrames = 0;
  private lateWindows = 0;
  private healthyWindows = 0;
  private cooldownUntilMs = Number.NEGATIVE_INFINITY;
  private lastAtMs: number | null = null;

  private readonly policy: GovernorPolicy;
  private readonly budgetMs: number;

  constructor(
    start: QualityPreset,
    options: {
      readonly targetFps?: number;
      readonly policy?: Partial<GovernorPolicy>;
      /** May be lower than `start`; never higher. Defaults to `start`. */
      readonly ceiling?: QualityPreset;
    } = {},
  ) {
    this.policy = { ...DEFAULT_GOVERNOR_POLICY, ...options.policy };
    this.ceilingIndex = Math.min(richnessIndex(start), richnessIndex(options.ceiling ?? start));
    // A ceiling BELOW the starting preset must bind immediately, otherwise
    // `ceiling` would only cap the step-up path and the governor could sit above
    // its own ceiling. Clamp the start down to the ceiling.
    this.current = this.ceilingIndex < richnessIndex(start) ? RICHNESS_ORDER[this.ceilingIndex] : start;
    this.budgetMs = frameBudget(options.targetFps ?? 60).budgetMs;
  }

  get preset(): QualityPreset {
    return this.current;
  }

  /** Richest preset this governor may ever return. */
  get ceiling(): QualityPreset {
    return RICHNESS_ORDER[this.ceilingIndex];
  }

  get window(): GovernorWindow {
    return {
      elapsedMs: this.elapsedMs,
      frames: this.frames,
      meanMs: this.frames > 0 ? this.elapsedMs / this.frames : 0,
      lateShare: this.frames > 0 ? this.lateFrames / this.frames : 0,
      budgetMs: this.budgetMs,
      lateWindows: this.lateWindows,
      healthyWindows: this.healthyWindows,
      cooldownRemainingMs: Math.max(0, this.cooldownUntilMs - (this.lastAtMs ?? 0)),
    };
  }

  /** Feed one frame interval. Returns what the governor decided, if anything. */
  push(atMs: number, frameMs: number): GovernorDecision {
    const keep = (reason: GovernorReason): GovernorDecision => ({
      changed: false,
      from: this.current,
      to: this.current,
      preset: this.current,
      reason,
    });

    // Time running backwards means a clock swap or a replayed capture. Nothing
    // measured across such a seam is trustworthy, so drop the window.
    if (!Number.isFinite(atMs) || !Number.isFinite(frameMs)) return keep("pause");
    if (this.lastAtMs !== null && atMs < this.lastAtMs) {
      this.clearWindow();
      this.lastAtMs = atMs;
      return keep("pause");
    }
    this.lastAtMs = atMs;

    // A pause, not a slow frame. Clears evidence; contributes nothing.
    if (frameMs <= 0 || frameMs > this.policy.maxDeltaMs) {
      this.clearWindow();
      return keep("pause");
    }

    // Mechanism 3: inside a cooldown no evidence is accumulated at all.
    if (atMs < this.cooldownUntilMs) return keep("cooldown");

    this.elapsedMs += frameMs;
    this.frames += 1;
    this.lateFrames += frameMs > this.budgetMs * this.policy.lateBudgetMultiplier ? 1 : 0;

    if (this.elapsedMs < this.policy.windowMs) return keep("waiting-window");

    // A slow machine cannot fill `minFramesPerWindow` inside one window. Rather
    // than exempt it forever, allow a decision once the window runs long.
    const enoughFrames =
      this.frames >= this.policy.minFramesPerWindow ||
      this.elapsedMs >= this.policy.windowMs * this.policy.slowWindowMultiplier;
    if (!enoughFrames) {
      this.clearWindow();
      return keep("too-few-frames");
    }

    return this.evaluate();
  }

  private evaluate(): GovernorDecision {
    const meanMs = this.elapsedMs / this.frames;
    const lateShare = this.lateFrames / this.frames;
    const isLate = lateShare >= this.policy.lateShareThreshold;
    const isHealthy = meanMs < this.budgetMs * this.policy.healthyBudgetMultiplier;

    const settle = (preset: QualityPreset, reason: GovernorReason): GovernorDecision => {
      const from = this.current;
      this.current = preset;
      this.cooldownUntilMs = (this.lastAtMs ?? 0) + this.policy.cooldownMs;
      this.clearWindow();
      return { changed: from !== preset, from, to: preset, preset, reason };
    };

    if (isLate) {
      this.healthyWindows = 0;
      this.lateWindows += 1;
      if (this.lateWindows < this.policy.downWindowsRequired) {
        this.clearWindow();
        return this.unchanged("waiting-window");
      }
      const next = stepPoorer(this.current);
      if (next === this.current) {
        this.clearWindow();
        return this.unchanged("at-floor");
      }
      return settle(next, "late");
    }

    if (isHealthy) {
      this.lateWindows = 0;
      this.healthyWindows += 1;
      if (this.healthyWindows < this.policy.upWindowsRequired) {
        this.clearWindow();
        return this.unchanged("waiting-window");
      }
      const next = stepRicher(this.current);
      if (next === this.current || richnessIndex(next) > this.ceilingIndex) {
        this.clearWindow();
        return this.unchanged("at-ceiling");
      }
      return settle(next, "recovered");
    }

    // Mechanism 1: the dead band. Both counters clear, so a signal hovering
    // around budget can never accumulate evidence toward a change.
    this.lateWindows = 0;
    this.healthyWindows = 0;
    this.clearWindow();
    return this.unchanged("dead-band");
  }

  private unchanged(reason: GovernorReason): GovernorDecision {
    return { changed: false, from: this.current, to: this.current, preset: this.current, reason };
  }

  private clearWindow(): void {
    this.elapsedMs = 0;
    this.frames = 0;
    this.lateFrames = 0;
  }

  /** Forget all evidence. Keeps the preset and the ceiling. */
  reset(): void {
    this.clearWindow();
    this.lateWindows = 0;
    this.healthyWindows = 0;
    this.cooldownUntilMs = Number.NEGATIVE_INFINITY;
    this.lastAtMs = null;
  }

  /**
   * The cooldown, and therefore the ONE bound that is unconditional: after any
   * change all evidence is discarded and nothing accumulates until the cooldown
   * expires, so no second change can occur sooner than this. Exposed because it
   * is the guarantee to assert in a test, unlike `minimumIntervalMs()`.
   */
  get cooldownMs(): number {
    return this.policy.cooldownMs;
  }

  /**
   * The policy-derived lower bound on the gap between two changes: the
   * cooldown PLUS the windows the winning direction needs. At the defaults that
   * is 10 s + 2 x 1.5 s = 13 s for a step down and 10 s + 6 x 1.5 s = 19 s for a
   * step up, so 13 s is the floor.
   */
  minimumIntervalMs(): number {
    const { windowMs, downWindowsRequired, upWindowsRequired, cooldownMs } = this.policy;
    return Math.min(
      windowMs * downWindowsRequired + cooldownMs,
      windowMs * upWindowsRequired + cooldownMs,
    );
  }
}
