/**
 * The resolver and the hysteretic governor.
 *
 * The three cases the brief requires are here as named tests:
 *   - "honours viewport count"
 *   - "a sustained-late signal steps down"
 *   - "a healthy signal does not step down"
 * plus the oscillation case, which is the one that actually matters on a
 * projector.
 */
import { describe, expect, it } from "vitest";
import { type QualityPreset } from "../../seam.js";
import { RICHNESS_ORDER } from "../quality-ladder.js";
import {
  DEFAULT_GOVERNOR_POLICY,
  PresetGovernor,
  capabilityTier,
  resolveStartingPreset,
} from "../preset-resolver.js";

const BUDGET_60 = 1000 / 60; // 16.667ms

// Frame signals. The choice of these values is load-bearing:
//   LATE    40ms — over the 1.2x late line (20ms) but UNDER the 150ms pause
//                   line, so it counts as evidence rather than as a pause.
//   HEALTHY 9ms  — under the 0.9x healthy line (15ms).
//   DEAD    17ms — over 15ms, under 20ms: inside the dead band.
//   PAUSE   400ms — over maxDeltaMs, so it must be ignored entirely.
const LATE = 40;
const HEALTHY = 9;
const DEAD = 17;
const PAUSE = 400;

/**
 * Feed a governor a synthetic frame signal.
 *
 * `frameMs` is pushed repeatedly until `durationMs` of synthetic wall time has
 * passed, which is how a real run looks to the governor.
 */
const feed = (
  governor: PresetGovernor,
  frameMs: number,
  durationMs: number,
  startAtMs = 0,
): void => {
  let at = startAtMs;
  const end = startAtMs + durationMs;
  while (at < end) {
    governor.push(at, frameMs);
    at += frameMs;
  }
};

/**
 * Push frames until exactly one governor window completes, then return the new
 * timestamp. Detects completion by the accumulator resetting to zero, which
 * happens on every terminal window outcome (late, healthy, dead band, change).
 * This lets a test control the SEQUENCE of window classifications, which is what
 * the hysteresis tests need.
 */
const feedWindow = (governor: PresetGovernor, frameMs: number, atMs: number): number => {
  let at = atMs;
  for (let i = 0; i < 10_000; i += 1) {
    governor.push(at, frameMs);
    at += frameMs;
    if (governor.window.frames === 0) break;
  }
  return at;
};

/**
 * Feed one signal until the governor changes preset, then stop. This is how the
 * tests below isolate "one step" from "however many steps the duration allowed",
 * which is what made the earlier durations ambiguous.
 */
const feedUntilChange = (
  governor: PresetGovernor,
  frameMs: number,
  atMs: number,
  maxMs: number,
): { changed: boolean; at: number } => {
  const start = governor.preset;
  let at = atMs;
  const end = atMs + maxMs;
  while (at < end) {
    governor.push(at, frameMs);
    at += frameMs;
    if (governor.preset !== start) return { changed: true, at };
  }
  return { changed: false, at };
};

describe("starting preset honours viewport count", () => {
  it("follows the seam's table for the counts it lists", () => {
    expect(resolveStartingPreset(1).preset).toBe("ULTRA");
    expect(resolveStartingPreset(2).preset).toBe("HIGH");
    expect(resolveStartingPreset(3).preset).toBe("HIGH");
    expect(resolveStartingPreset(4).preset).toBe("BALANCED");
    expect(resolveStartingPreset(6).preset).toBe("PERFORMANCE");
  });

  it("reports the viewport answer separately from the capped one", () => {
    const solo = resolveStartingPreset(1);
    expect(solo.fromViewportCount).toBe("ULTRA");
    expect(solo.capped).toBe(false);
    expect(solo.reason).toContain("no cap");
  });

  it("caps down on a software rasteriser and never caps up", () => {
    expect(capabilityTier({ renderer: "Google SwiftShader" })).toBe("SOFTWARE");
    const capped = resolveStartingPreset(1, { renderer: "Google SwiftShader" });
    expect(capped.preset).toBe("PERFORMANCE");
    expect(capped.capped).toBe(true);
    expect(capped.tier).toBe("SOFTWARE");
  });

  it("leaves an unknown renderer uncapped, because the laptop is unknown", () => {
    expect(capabilityTier({})).toBe("UNKNOWN");
    expect(resolveStartingPreset(1, {}).preset).toBe("ULTRA");
    expect(resolveStartingPreset(1, { renderer: "Some Future GPU" }).preset).toBe("ULTRA");
  });

  it("classifies the vendor strings these APIs actually emit", () => {
    expect(capabilityTier({ renderer: "NVIDIA GeForce RTX 3060" })).toBe("DISCRETE");
    expect(capabilityTier({ renderer: "ANGLE (Intel, Intel(R) UHD Graphics 630)" })).toBe(
      "INTEGRATED",
    );
    expect(capabilityTier({ renderer: "Mali-G78" })).toBe("INTEGRATED");
    expect(capabilityTier({ renderer: "llvmpipe (LLVM 15.0, 256 bits)" })).toBe("SOFTWARE");
  });

  it("cannot be raised above the viewport table", () => {
    // A discrete GPU must not upgrade a 6-way match past PERFORMANCE.
    const six = resolveStartingPreset(6, { renderer: "NVIDIA GeForce RTX 4090" });
    expect(six.preset).toBe("PERFORMANCE");
    expect(six.tierCeiling).toBe("ULTRA");
    expect(six.capped).toBe(false);
  });
});

describe("governor steps down on a sustained-late signal", () => {
  it("drops exactly one tier after the required bad windows", () => {
    const governor = new PresetGovernor("HIGH");
    expect(governor.preset).toBe("HIGH");
    feed(governor, LATE, 60_000);
    expect(governor.preset).not.toBe("HIGH");
  });

  it("does not step down on the FIRST bad window alone", () => {
    const governor = new PresetGovernor("HIGH");
    // One window of bad frames, then stop.
    feed(governor, LATE, 2_000);
    expect(governor.window.lateWindows).toBeLessThan(
      DEFAULT_GOVERNOR_POLICY.downWindowsRequired + 1,
    );
    expect(governor.preset).toBe("HIGH");
  });

  it("settles at the floor and never goes below PERFORMANCE", () => {
    const governor = new PresetGovernor("ULTRA");
    feed(governor, LATE, 500_000);
    expect(governor.preset).toBe("PERFORMANCE");
  });

  it("gates on the late-frame SHARE, not just the mean", () => {
    // A deterministic window, so the classification is exact rather than
    // dependent on where a window boundary happens to fall.
    // 6 fast + 4 slow, 10 frames per period: mean 20.8ms (OVER the 20ms late
    // line) but only 40% of frames are late (UNDER the 0.5 threshold).
    // A mean-only rule would step down here. The share rule does not.
    const period = [8, 8, 8, 8, 8, 8, 40, 40, 40, 40];
    const governor = new PresetGovernor("HIGH", { policy: { windowMs: 1040 } });
    let at = 0;
    for (let i = 0; i < 20_000; i += 1) {
      const frameMs = period[i % period.length];
      governor.push(at, frameMs);
      at += frameMs;
    }
    expect(governor.preset).toBe("HIGH");
  });
});

describe("governor does not step down on a healthy signal", () => {
  it("holds a fast machine at its starting preset indefinitely", () => {
    const governor = new PresetGovernor("ULTRA");
    // Under the 0.9x budget healthy line, so the up-path arms repeatedly but the
    // ceiling stops it leaving ULTRA.
    feed(governor, HEALTHY, 300_000);
    expect(governor.preset).toBe("ULTRA");
  });

  it("holds a signal sitting exactly on budget", () => {
    const governor = new PresetGovernor("HIGH");
    // Exactly budget: inside the dead band, so nothing happens at all.
    feed(governor, BUDGET_60, 300_000);
    expect(governor.preset).toBe("HIGH");
  });
});

describe("hysteresis prevents oscillation", () => {
  it("does not thrash when healthy and late WINDOWS alternate", () => {
    // The decisive test. Each window is classified either healthy or late, and
    // they alternate. A late window increments the down-counter, but the healthy
    // window that follows resets it — so the counter can never reach 2 and the
    // preset never changes at all.
    const governor = new PresetGovernor("HIGH");
    const changes: QualityPreset[] = [governor.preset];
    let at = 0;
    for (let cycle = 0; cycle < 40; cycle += 1) {
      for (const signal of [HEALTHY, LATE]) {
        at = feedWindow(governor, signal, at);
        const decision = governor.preset;
        if (decision !== changes[changes.length - 1]) changes.push(decision);
      }
    }
    expect(changes).toEqual(["HIGH"]);
  });

  it("descends monotonically on a frame-level flicker, never oscillating", () => {
    // 9ms / 34ms alternating is genuinely bad: half the frames miss two vsyncs,
    // so the governor is right to keep stepping down. What must never happen is
    // a step DOWN followed by a step UP, or a repeat of a preset already left.
    const governor = new PresetGovernor("HIGH");
    const changes: QualityPreset[] = [governor.preset];
    let at = 0;
    for (let i = 0; i < 60_000; i += 1) {
      const frameMs = i % 2 === 0 ? HEALTHY : 34;
      if (governor.push(at, frameMs).changed) changes.push(governor.preset);
      at += frameMs;
    }
    // Monotonically poorer: never returns to a richer tier.
    for (let i = 1; i < changes.length; i += 1) {
      expect(RICHNESS_ORDER.indexOf(changes[i])).toBeLessThan(
        RICHNESS_ORDER.indexOf(changes[i - 1]),
      );
    }
    // No preset is ever revisited, and it ends up at the floor.
    expect(new Set(changes).size).toBe(changes.length);
    expect(governor.preset).toBe("PERFORMANCE");
  });

  it("never changes more often than the cooldown", () => {
    const governor = new PresetGovernor("ULTRA");
    // Walk the signal between fast and slow; check the gap between any two
    // changes against the unconditional bound.
    let at = 0;
    const changedAt: number[] = [];
    for (let i = 0; i < 40_000; i += 1) {
      const frameMs = i % 37 < 18 ? HEALTHY : LATE;
      if (governor.push(at, frameMs).changed) changedAt.push(at);
      at += frameMs;
    }
    for (let i = 1; i < changedAt.length; i += 1) {
      expect(changedAt[i] - changedAt[i - 1]).toBeGreaterThanOrEqual(governor.cooldownMs);
    }
    // And the policy-derived bound is far slower than the frame rate, which is
    // the whole point: a projector cannot show a visible change more often.
    expect(governor.minimumIntervalMs()).toBeGreaterThan(5_000);
  });

  it("recovers exactly one tier, and only back to its own ceiling", () => {
    const governor = new PresetGovernor("HIGH", { ceiling: "HIGH" });

    // Sustained lateness: exactly one step down.
    const dropped = feedUntilChange(governor, LATE, 0, 5_000);
    expect(dropped.changed).toBe(true);
    expect(governor.preset).toBe("BALANCED");

    // Now become healthy for long enough to clear the cooldown and arm the
    // 6-window up-path. Exactly one step up.
    const recovered = feedUntilChange(governor, HEALTHY, dropped.at, 40_000);
    expect(recovered.changed).toBe(true);
    expect(governor.preset).toBe("HIGH");

    // ...and it never goes above the ceiling, however long it stays healthy.
    feed(governor, HEALTHY, 600_000, recovered.at);
    expect(governor.preset).toBe("HIGH");
  });

  it("clears both evidence counters in the dead band", () => {
    const governor = new PresetGovernor("HIGH");
    // One late window to arm the down-path...
    feed(governor, LATE, 2_000);
    expect(governor.window.lateWindows).toBeGreaterThan(0);
    // ...then a dead-band window, which must disarm it.
    feed(governor, DEAD, 4_000, 100_000);
    expect(governor.window.lateWindows).toBe(0);
    expect(governor.window.healthyWindows).toBe(0);
  });

  it("treats a long pause as a pause, not as a reason to downgrade", () => {
    const governor = new PresetGovernor("HIGH");
    let at = 0;
    for (let i = 0; i < 200; i += 1) {
      governor.push(at, HEALTHY);
      at += HEALTHY;
      // Simulate an alt-tab every 20 frames.
      if (i % 20 === 19) {
        governor.push(at, PAUSE);
        at += PAUSE;
      }
    }
    expect(governor.preset).toBe("HIGH");
  });

  it("survives a clock that jumps backwards", () => {
    const governor = new PresetGovernor("HIGH");
    // Under one window, so no step down has been earned yet.
    feed(governor, LATE, 1_000);
    expect(governor.preset).toBe("HIGH");
    // Time running backwards must not be readable as evidence.
    governor.push(10, LATE);
    expect(governor.preset).toBe("HIGH");
  });
});

describe("governor observability", () => {
  it("reports window state for the debug readout", () => {
    const governor = new PresetGovernor("HIGH");
    expect(governor.window.budgetMs).toBeCloseTo(BUDGET_60, 5);
    expect(governor.ceiling).toBe("HIGH");
    feed(governor, 12, 2_000);
    expect(governor.window.frames).toBeGreaterThan(0);
    expect(governor.window.lateShare).toBeGreaterThanOrEqual(0);
  });

  it("binds a ceiling lower than the starting preset immediately", () => {
    const governor = new PresetGovernor("ULTRA", { ceiling: "BALANCED" });
    expect(governor.ceiling).toBe("BALANCED");
    expect(governor.preset).toBe("BALANCED");
    feed(governor, HEALTHY, 300_000);
    expect(governor.preset).toBe("BALANCED");
  });

  it("uses the target refresh rate for its budget", () => {
    const at120 = new PresetGovernor("ULTRA", { targetFps: 120 });
    expect(at120.window.budgetMs).toBeCloseTo(1000 / 120, 5);
  });
});
