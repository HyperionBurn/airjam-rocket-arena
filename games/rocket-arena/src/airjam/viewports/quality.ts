/**
 * Phase 4 — QUALITY PRESETS BY VIEWPORT COUNT (pure).
 *
 * OWNER: the Phase 4 worker (`src/airjam/viewports/**`).
 *
 * ---------------------------------------------------------------------------
 * THE RULE THIS ENCODES
 * ---------------------------------------------------------------------------
 * `seam.ts:240-246` gives a starting preset per viewport count. The decision
 * this module adds is what to do for a count the table does not list (5, 7, 8 —
 * 6 players is listed, but 5 is not). The answer is the entry for the largest
 * listed count that is <= the actual count, which keeps the mapping MONOTONIC:
 * more viewports never means a richer preset. 5 players therefore inherits 4's
 * `BALANCED` rather than rounding up to 6's `PERFORMANCE`, and 7 and 8 inherit
 * `PERFORMANCE`.
 *
 * ---------------------------------------------------------------------------
 * WHAT WE DELIBERATELY DO NOT DO
 * ---------------------------------------------------------------------------
 * We do not drop `renderScale`. At 4-way 1080p each viewport framebuffer is
 * ~960x540, so a 4-way split already renders a quarter of the pixels per view;
 * shrinking resolution on top of that is a global quality downgrade for no
 * measured gain, and the brief is explicit that effects stay rich. The preset
 * is the single knob, and it controls effect richness, not resolution. Any
 * future profile should come from measurements, not from this table.
 */

import { DEFAULT_PRESET_BY_VIEWPORTS, type QualityPreset } from "../seam.js";

export type { QualityPreset };

/** The seam's table, re-exported so callers need only one import. */
export const PRESET_BY_VIEWPORTS: Readonly<Record<number, QualityPreset>> =
  DEFAULT_PRESET_BY_VIEWPORTS;

/**
 * Nearest listed count at or below `count` — the "do not be optimistic" step.
 * Exported because it is the one piece of policy worth testing directly.
 */
export function resolvePresetKey(count: number): number {
  const n = Number.isInteger(count) ? count : Math.floor(count);
  if (!Number.isFinite(n) || n < 1) return 1;
  let best = 1;
  for (const key of Object.keys(PRESET_BY_VIEWPORTS)) {
    const k = Number(key);
    if (k <= n && k > best) best = k;
  }
  return best;
}

/**
 * The starting preset for a player count. Clamps to the 1-viewport table entry
 * for nonsense input rather than throwing: quality is a starting hint, and a
 * bad hint must never take down the boot path.
 */
export function presetForViewportCount(count: number): QualityPreset {
  return PRESET_BY_VIEWPORTS[resolvePresetKey(count)];
}

/** True when `count` has its own entry in the seam table (1, 2, 3, 4, 6). */
export function hasExactPreset(count: number): boolean {
  return Number.isInteger(count) && count in PRESET_BY_VIEWPORTS;
}

/** The full plan the host applies when the viewport count changes. */
export interface ViewportQualityPlan {
  readonly viewportCount: number;
  /** The seam table key this plan's preset came from. */
  readonly presetKey: number;
  /** True when `viewportCount` was listed in the seam table directly. */
  readonly presetIsExact: boolean;
  readonly preset: QualityPreset;
  /** Always 1. See the module header: resolution is not a split-screen knob. */
  readonly renderScale: number;
}

/**
 * Resolve the quality plan for a viewport count. Pure — no renderer, no DOM.
 */
export function resolveViewportQuality(count: number): ViewportQualityPlan {
  const presetKey = resolvePresetKey(count);
  return {
    viewportCount: count,
    presetKey,
    presetIsExact: hasExactPreset(count),
    preset: PRESET_BY_VIEWPORTS[presetKey],
    renderScale: 1,
  };
}
