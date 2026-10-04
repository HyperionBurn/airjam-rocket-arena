/**
 * Phase 9 — THE SCREENSHOT DIFF METRIC (pure).
 *
 * OWNER: the Phase 9 parity worker (`src/airjam/parity/**`).
 *
 * ---------------------------------------------------------------------------
 * WHY THE INPUT IS RAW RGBA AND NOT A PNG
 * ---------------------------------------------------------------------------
 * This module takes decoded 8-bit RGBA byte arrays. It deliberately does not
 * decode PNG: adding a codec dependency to the product's `src/` for a
 * verification tool would be the wrong trade, and the decode is a two-line
 * operation in a browser that is already running — draw the screenshot into a
 * 2D canvas and call `getImageData`. `_scratch/parity/capture.mjs` does exactly
 * that, and it means the diff runs on the pixels the browser composited, not on
 * a re-encode of them.
 *
 * ---------------------------------------------------------------------------
 * WHY THERE IS NO SINGLE "PASS" THRESHOLD, AND WHY THIS FILE SAYS SO LOUDLY
 * ---------------------------------------------------------------------------
 * A WebGL frame is not a pure function of the source tree. Its bytes depend on
 * the GPU vendor's shader compiler, the driver version, the ANGLE backend, the
 * precision of intermediate render targets, and the order in which effects
 * composite — all of which can differ between two machines running the SAME
 * build. On top of that, this project's own captures are taken under
 * SwiftShader (`--use-angle=swiftshader`), a software rasteriser, so they are
 * reproducible on one machine and are not a claim about any real GPU.
 *
 * A pixel-exact threshold is therefore not merely strict, it is WRONG: it would
 * report a correct build as a regression the moment it moved to another
 * machine, and a real regression as pass on the one machine that happens to
 * agree. So the honest shape of a WebGL regression guard is:
 *
 *   - diff a capture only against a reference taken on the SAME machine with the
 *     SAME browser and the SAME launch flags, and record that provenance with
 *     the reference, so a later mismatch can be attributed;
 *   - report a RATIO, not a boolean, and grade it;
 *   - treat "identical" as a strong signal, "noise" as expected, and anything
 *     larger as "review" — a human decision, not an automatic failure.
 *
 * The thresholds in `DEFAULT_GRADE_THRESHOLDS` are calibrated for that
 * same-machine comparison and are documented as such. They are NOT calibrated
 * for cross-machine comparison, and `WEBGL_DIFF_GUIDANCE` says so in the data
 * rather than only in this comment.
 */

export interface RgbaImage {
  readonly width: number;
  readonly height: number;
  /** Exactly `width * height * 4` bytes, row-major, top-left origin. */
  readonly data: Uint8Array;
}

export interface DiffOptions {
  /**
   * Per-channel difference below which two channels count as equal. 0 is exact.
   * Non-zero absorbs dithering and last-bit rounding only — anything larger
   * stops being tolerance and starts being a different image.
   */
  readonly channelTolerance?: number;
  /**
   * A pixel counts as changed when the MAXIMUM of its four channel deltas
   * exceeds `channelTolerance`. Set false to use a luminance-weighted mean
   * instead, which is less sensitive to a single hot pixel.
   */
  readonly maxChannelRule?: boolean;
}

export interface ImageDiffResult {
  readonly width: number;
  readonly height: number;
  readonly totalPixels: number;
  readonly changedPixels: number;
  /** `changedPixels / totalPixels`. 0 means byte-identical. */
  readonly ratio: number;
  /** Largest single-channel delta anywhere in the frame, 0..255. */
  readonly maxChannelDelta: number;
  /** Mean absolute per-channel delta over the whole frame, 0..255. */
  readonly meanChannelDelta: number;
  readonly identical: boolean;
  readonly detail: string;
}

export type DiffGrade = "identical" | "noise" | "review" | "regression";

export interface GradeThresholds {
  /** At or below this ratio the frames are treated as equivalent. */
  readonly noise: number;
  /** At or below this ratio a change is plausible-but-notable: look at it. */
  readonly review: number;
  /** Above this, a change large enough to be a real visual defect. */
  readonly regression: number;
}

/**
 * Upper bounds of the grading bands, in order.
 *
 * A constant names the WORST grade that its ratio still earns, so the bands are
 * cumulative rather than nested: at or below `noise` the frames are `identical`;
 * above that and at or below `review` they are `noise`; above that and at or
 * below `regression` they are `review`; above that, `regression`.
 *
 * Calibrated for a SAME-MACHINE, SAME-BROWSER, SAME-FLAGS comparison of the
 * same build. See the module header for why nothing cross-machine is claimed.
 *
 * `noise` is 0.2 % of pixels: the residue of a non-deterministic effect (the
 * donor's boost turbulence, the field-light worker, antialiasing on moving
 * geometry) sampled at a different moment. `review` is 2 %: a layout, HUD or
 * scale change that a human must confirm. `regression` is 12 %: a changed
 * material, lighting rig, post chain or camera moves far more than this, so
 * crossing it without a source change is a strong signal something real moved.
 */
export const DEFAULT_GRADE_THRESHOLDS: GradeThresholds = Object.freeze({
  noise: 0.002,
  review: 0.02,
  regression: 0.12,
});

/** Machine-readable statement of what a diff ratio is and is not allowed to mean. */
export const WEBGL_DIFF_GUIDANCE = Object.freeze({
  calibratedFor: "same machine, same browser build, same WebGL launch flags, same viewport, same build under test",
  notCalibratedFor: "a different GPU, a different driver, or a different ANGLE backend — including hardware GPU vs SwiftShader",
  whyPixelExactIsWrong:
    "Shader compilation, render-target precision and effect compositing order are driver-dependent, so two correct builds can differ byte-for-byte on different hardware. A zero-tolerance gate would report that as a regression.",
  meaningfulSignal:
    "A large ratio on a same-machine comparison is a real change: a material, lighting, post-chain, camera or HUD change moves a large fraction of pixels, while ordinary runtime noise does not.",
  weakestSignal:
    "A small ratio is weak evidence in BOTH directions. It is consistent with a correct build and also with a subtle change (a colour-space tweak, a font metric, one icon) — which is why `review` is a human decision.",
  capturesUnderSwiftShader:
    "This project's captures run under --use-angle=swiftshader, a software rasteriser. They are reproducible on the capture machine and say nothing about performance or about any real GPU's output.",
});

export type DiffInputError =
  | { readonly ok: false; readonly reason: "dimension-mismatch"; readonly a: string; readonly b: string }
  | { readonly ok: false; readonly reason: "length-mismatch"; readonly expected: number; readonly actual: number }
  | { readonly ok: false; readonly reason: "empty" };

/**
 * Compare two RGBA buffers. Returns a discriminated result rather than
 * throwing: a dimension mismatch is a caller mistake in a verification script,
 * and crashing the harness on it would lose the rest of the report.
 */
export function diffRgba(
  a: RgbaImage,
  b: RgbaImage,
  options: DiffOptions = {},
): ImageDiffResult | DiffInputError {
  if (a.width !== b.width || a.height !== b.height) {
    return Object.freeze({
      ok: false,
      reason: "dimension-mismatch",
      a: `${a.width}x${a.height}`,
      b: `${b.width}x${b.height}`,
    });
  }
  const totalPixels = a.width * a.height;
  const expected = totalPixels * 4;
  if (totalPixels === 0) return Object.freeze({ ok: false, reason: "empty" });
  if (a.data.length !== expected) {
    return Object.freeze({ ok: false, reason: "length-mismatch", expected, actual: a.data.length });
  }
  if (b.data.length !== expected) {
    return Object.freeze({ ok: false, reason: "length-mismatch", expected, actual: b.data.length });
  }

  const tolerance = Math.max(0, Math.trunc(options.channelTolerance ?? 0));
  const useMax = options.maxChannelRule ?? true;

  let changedPixels = 0;
  let maxChannelDelta = 0;
  let sumChannelDelta = 0;

  for (let pixel = 0; pixel < totalPixels; pixel += 1) {
    const at = pixel * 4;
    let pixelChanged = false;
    let pixelMean = 0;
    for (let channel = 0; channel < 4; channel += 1) {
      const delta = Math.abs(a.data[at + channel] - b.data[at + channel]);
      if (delta > maxChannelDelta) maxChannelDelta = delta;
      sumChannelDelta += delta;
      if (delta > tolerance) pixelChanged = true;
      pixelMean += delta;
    }
    if (useMax ? pixelChanged : pixelMean / 4 > tolerance) changedPixels += 1;
  }

  const ratio = changedPixels / totalPixels;
  const meanChannelDelta = sumChannelDelta / (totalPixels * 4);

  return Object.freeze({
    width: a.width,
    height: a.height,
    totalPixels,
    changedPixels,
    ratio,
    maxChannelDelta,
    meanChannelDelta,
    identical: changedPixels === 0,
    detail: `${changedPixels}/${totalPixels} pixels differ (${(ratio * 100).toFixed(3)}%), max channel delta ${maxChannelDelta}/255, mean channel delta ${meanChannelDelta.toFixed(3)}/255 at channel tolerance ${tolerance}.`,
  });
}

export const isDiffError = (value: ImageDiffResult | DiffInputError): value is DiffInputError =>
  (value as DiffInputError).ok === false;

/**
 * Grade a ratio. The result is a REVIEW PROMPT, not a verdict: `regression`
 * means "a human must confirm this", and the harness is expected to say so
 * rather than failing the run on its own.
 */
export function gradeDiff(
  ratio: number,
  thresholds: GradeThresholds = DEFAULT_GRADE_THRESHOLDS,
): DiffGrade {
  if (ratio <= thresholds.noise) return "identical";
  if (ratio <= thresholds.review) return "noise";
  if (ratio <= thresholds.regression) return "review";
  return "regression";
}

export const GRADE_ACTION: Readonly<Record<DiffGrade, string>> = Object.freeze({
  identical: "No pixel changed beyond channel tolerance. Consistent with the same build and the same driver.",
  noise:
    "A small fraction of pixels moved. Expected from a non-deterministic effect sampled at a different instant. Note it and do not act on it alone.",
  review:
    "A meaningful fraction of pixels moved. Look at the two PNGs side by side and decide. This harness will not decide for you: a layout, HUD or font-scale change lands here and so does a subtle regression.",
  regression:
    "A large fraction of pixels moved. Consistent with a material, lighting, post-chain, camera or camera-frustum change. Confirm against the source diff before treating it as a defect.",
});
