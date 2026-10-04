import { describe, expect, it } from "vitest";

import { MAX_CARS, NEUTRAL_CONTROLS, sanitizeControls, toControlArray } from "../../seam.js";
import { NATIVE_MAX_CARS, readCarCount, readCarPose } from "../donor-facts.js";

/**
 * The slots modules import VALUES from `seam.js` (the shared contract), not
 * only types. `seam.ts` re-exports a donor type-only import and declares
 * `computeViewportRects` without an implementation, so this suite pins the
 * fact that importing the module at RUNTIME is still safe: the value imports
 * resolve and no unpatched-donor reference is evaluated at module scope.
 */
describe("seam.ts runtime import surface (slots contract)", () => {
  it("exposes the same car ceiling the donor bridge enforces", () => {
    expect(MAX_CARS).toBe(8);
    expect(NATIVE_MAX_CARS).toBe(MAX_CARS);
  });

  it("reaches the neutral controls and the control-array shaper", () => {
    expect(NEUTRAL_CONTROLS.throttle).toBe(0);
    expect(NEUTRAL_CONTROLS.boost).toBe(false);
    expect(sanitizeControls({ throttle: 9 } as never).throttle).toBe(1);
    expect(toControlArray(NEUTRAL_CONTROLS)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
  });
});

describe("donor-facts.ts state readers", () => {
  it("reads the car count and one 24-float pose out of a 510-float state", () => {
    const state = new Float32Array(510);
    state[2] = 3; // NUM_CARS
    state[22] = -2500; // car 0 POS.x
    state[22 + 51 * 2] = 1234; // car 2 POS.x

    expect(readCarCount(state)).toBe(3);
    expect(readCarPose(state, 0)[0]).toBe(-2500);
    expect(readCarPose(state, 2)[0]).toBe(1234);
    expect(readCarPose(state, 0)).toHaveLength(24);
  });
});
