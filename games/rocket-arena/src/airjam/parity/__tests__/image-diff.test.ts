import { describe, expect, it } from "vitest";

import {
  DEFAULT_GRADE_THRESHOLDS,
  GRADE_ACTION,
  WEBGL_DIFF_GUIDANCE,
  diffRgba,
  gradeDiff,
  isDiffError,
  type ImageDiffResult,
  type RgbaImage,
} from "../image-diff.js";

/** A flat mid-grey frame, fully opaque, so alpha is never an accidental diff. */
const grey = (width: number, height: number, value = 128): RgbaImage => {
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    data[i * 4] = value;
    data[i * 4 + 1] = value;
    data[i * 4 + 2] = value;
    data[i * 4 + 3] = 255;
  }
  return { width, height, data };
};

/** Copy a frame and paint a rectangle into it. */
const withRect = (base: RgbaImage, x0: number, y0: number, w: number, h: number, value: number): RgbaImage => {
  const data = new Uint8Array(base.data);
  for (let y = y0; y < y0 + h; y += 1) {
    for (let x = x0; x < x0 + w; x += 1) {
      const at = (y * base.width + x) * 4;
      data[at] = value;
      data[at + 1] = value;
      data[at + 2] = value;
      data[at + 3] = 255;
    }
  }
  return { width: base.width, height: base.height, data };
};

const ok = (result: ImageDiffResult | ReturnType<typeof diffRgba>): ImageDiffResult => {
  if (isDiffError(result)) throw new Error(`expected a diff result, got ${result.reason}`);
  return result;
};

describe("diffRgba — IDENTICAL images", () => {
  it("reports zero change and a ratio of exactly 0", () => {
    const a = grey(64, 64);
    const result = ok(diffRgba(a, grey(64, 64)));
    expect(result.identical).toBe(true);
    expect(result.changedPixels).toBe(0);
    expect(result.ratio).toBe(0);
    expect(result.maxChannelDelta).toBe(0);
    expect(result.meanChannelDelta).toBe(0);
    expect(result.totalPixels).toBe(64 * 64);
  });

  it("reports zero change for the SAME buffer object", () => {
    const a = grey(32, 32, 200);
    expect(ok(diffRgba(a, a)).ratio).toBe(0);
  });

  it("is symmetric", () => {
    const a = grey(40, 40, 10);
    const b = withRect(a, 5, 5, 10, 10, 200);
    expect(ok(diffRgba(a, b)).ratio).toBe(ok(diffRgba(b, a)).ratio);
  });
});

describe("diffRgba — DIFFERENT images", () => {
  it("counts every changed pixel and reports the ratio", () => {
    const a = grey(100, 100);
    const b = withRect(a, 0, 0, 50, 100, 255); // exactly half the frame
    const result = ok(diffRgba(a, b));
    expect(result.changedPixels).toBe(5000);
    expect(result.totalPixels).toBe(10_000);
    expect(result.ratio).toBeCloseTo(0.5, 10);
    expect(result.identical).toBe(false);
    expect(result.maxChannelDelta).toBe(127);
  });

  it("grows monotonically with the size of the change", () => {
    const a = grey(100, 100);
    const small = ok(diffRgba(a, withRect(a, 0, 0, 10, 10, 255)));
    const large = ok(diffRgba(a, withRect(a, 0, 0, 50, 50, 255)));
    expect(small.ratio).toBeLessThan(large.ratio);
    expect(small.ratio).toBeCloseTo(0.01, 6);
    expect(large.ratio).toBeCloseTo(0.25, 6);
  });

  it("honours a channel tolerance so last-bit rounding is not a regression", () => {
    const a = grey(16, 16, 100);
    const b = withRect(a, 0, 0, 16, 16, 102);
    expect(ok(diffRgba(a, b)).ratio).toBe(1);
    expect(ok(diffRgba(a, b, { channelTolerance: 2 })).ratio).toBe(0);
    expect(ok(diffRgba(a, b, { channelTolerance: 1 })).ratio).toBe(1);
  });

  it("scales to a realistic capture size without drift", () => {
    const a = grey(1600, 900);
    const b = withRect(a, 0, 0, 1600, 1, 0);
    const result = ok(diffRgba(a, b));
    expect(result.totalPixels).toBe(1_440_000);
    expect(result.changedPixels).toBe(1600);
    expect(result.ratio).toBeCloseTo(1600 / 1_440_000, 12);
  });
});

describe("diffRgba — bad input is data, not a crash", () => {
  it("rejects a dimension mismatch without throwing", () => {
    const result = diffRgba(grey(8, 8), grey(8, 9));
    expect(isDiffError(result)).toBe(true);
    if (isDiffError(result)) expect(result.reason).toBe("dimension-mismatch");
  });

  it("rejects a buffer whose length does not match its dimensions", () => {
    const short: RgbaImage = { width: 4, height: 4, data: new Uint8Array(10) };
    const result = diffRgba(short, grey(4, 4));
    expect(isDiffError(result)).toBe(true);
    if (isDiffError(result) && result.reason === "length-mismatch") {
      expect(result.expected).toBe(64);
      expect(result.actual).toBe(10);
    }
  });

  it("rejects a zero-sized frame rather than dividing by zero", () => {
    const result = diffRgba(grey(0, 0), grey(0, 0));
    expect(isDiffError(result)).toBe(true);
    if (isDiffError(result)) expect(result.reason).toBe("empty");
  });
});

describe("gradeDiff — what a ratio is allowed to mean", () => {
  it("grades 0 as identical", () => {
    expect(gradeDiff(0)).toBe("identical");
    expect(gradeDiff(DEFAULT_GRADE_THRESHOLDS.noise)).toBe("identical");
  });

  it("grades a small change as noise and a large one as a regression", () => {
    // The bands are cumulative: a constant names the worst grade its ratio still
    // earns. 0.001 sits at or below the 0.002 noise bound, so it is `identical`
    // — sub-noise movement is not worth a human's attention.
    expect(gradeDiff(0)).toBe("identical");
    expect(gradeDiff(0.001)).toBe("identical");
    expect(gradeDiff(0.005)).toBe("noise");
    expect(gradeDiff(0.01)).toBe("noise");
    expect(gradeDiff(0.02)).toBe("noise");
    expect(gradeDiff(0.021)).toBe("review");
    expect(gradeDiff(0.05)).toBe("review");
    expect(gradeDiff(0.12)).toBe("review");
    expect(gradeDiff(0.121)).toBe("regression");
    expect(gradeDiff(0.5)).toBe("regression");
  });

  it("puts each boundary value in the band it is the upper bound of", () => {
    // `<=` not `<`, so a ratio exactly at a bound earns that bound's grade.
    expect(gradeDiff(DEFAULT_GRADE_THRESHOLDS.noise)).toBe("identical");
    expect(gradeDiff(DEFAULT_GRADE_THRESHOLDS.review)).toBe("noise");
    expect(gradeDiff(DEFAULT_GRADE_THRESHOLDS.regression)).toBe("review");
  });

  it("has strictly increasing thresholds", () => {
    const { noise, review, regression } = DEFAULT_GRADE_THRESHOLDS;
    expect(noise).toBeGreaterThan(0);
    expect(noise).toBeLessThan(review);
    expect(review).toBeLessThan(regression);
  });

  it("gives an action for every grade, so no grade is a dead end", () => {
    for (const grade of ["identical", "noise", "review", "regression"] as const) {
      expect(GRADE_ACTION[grade].length).toBeGreaterThan(20);
    }
  });
});

describe("WEBGL_DIFF_GUIDANCE — the honesty contract", () => {
  it("says what the thresholds are and are not calibrated for", () => {
    expect(WEBGL_DIFF_GUIDANCE.calibratedFor).toMatch(/same machine/);
    expect(WEBGL_DIFF_GUIDANCE.notCalibratedFor).toMatch(/different GPU|different driver/);
  });

  it("states plainly why a pixel-exact gate is wrong for WebGL", () => {
    expect(WEBGL_DIFF_GUIDANCE.whyPixelExactIsWrong.length).toBeGreaterThan(60);
  });

  it("records that the captures are software-rendered and are not a perf claim", () => {
    expect(WEBGL_DIFF_GUIDANCE.capturesUnderSwiftShader).toMatch(/swiftshader/i);
    expect(WEBGL_DIFF_GUIDANCE.capturesUnderSwiftShader).toMatch(/say nothing about performance/);
  });
});
