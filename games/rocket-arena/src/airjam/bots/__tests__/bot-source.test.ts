import { describe, expect, it, vi } from "vitest";

import { NEUTRAL_CONTROLS } from "../../seam.js";
import type { CarControls } from "../../seam.js";
import { createBotInputSource } from "../bot-source.js";
import type { BotObservation } from "../bot-inference.js";
import { CONTROLS_GO, NO_PADS, makeClock, makeFakeBrain, makeState } from "./fakes.js";

const observation = (): BotObservation => ({
  state: makeState(),
  pads: NO_PADS,
  slot: 1,
  team: 1,
  current: NEUTRAL_CONTROLS,
  kickoffTick: -1,
});

/** Let a settled promise run its continuation. */
const flush = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

describe("a bot seat defaults to exactly NEUTRAL_CONTROLS", () => {
  it("reads neutral before it has ever been started", () => {
    const brain = makeFakeBrain({ behaviour: "hang" });
    const source = createBotInputSource({ playerId: "bot:seer:1", slot: 1, team: 1, inference: brain });
    // Identity, not just structural equality: the seam writes this object
    // straight into the WASM heap, so it must be the canonical frozen one.
    expect(source.read()).toBe(NEUTRAL_CONTROLS);
    expect(source.isLive()).toBe(false);
    expect(source.status).toBe("idle");
  });

  it("reads neutral while the first decision is still in flight", async () => {
    const clock = makeClock();
    const brain = makeFakeBrain({ behaviour: "hang" });
    const source = createBotInputSource({
      playerId: "bot:seer:1",
      slot: 1,
      team: 1,
      inference: brain,
      clock: clock.now,
    });
    source.start();
    source.pump(observation());
    expect(brain.calls).toBe(1);
    // A pending decision must not be a blank: neutral is the safe answer.
    expect(source.read()).toBe(NEUTRAL_CONTROLS);
  });

  it("holds a landed action, then neutral again once neutralized", async () => {
    const brain = makeFakeBrain();
    const source = createBotInputSource({ playerId: "bot:seer:1", slot: 1, team: 1, inference: brain });
    source.start();
    source.pump(observation());
    await flush();
    expect(source.read()).toMatchObject({ throttle: 1, steer: 0.5, jump: true, boost: true });
    expect(source.status).toBe("driving");

    source.neutralize("released");
    expect(source.read()).toBe(NEUTRAL_CONTROLS);
    expect(source.isLive()).toBe(false);
    expect(source.status).toBe("neutralized");
  });

  it("neutralize is idempotent", () => {
    const brain = makeFakeBrain();
    const source = createBotInputSource({ playerId: "bot:seer:1", slot: 1, team: 1, inference: brain });
    source.start();
    source.neutralize("released");
    source.neutralize("blurred");
    source.stop("replaced");
    expect(source.read()).toBe(NEUTRAL_CONTROLS);
  });
});

describe("a stalled inference degrades to NEUTRAL and never blocks", () => {
  it("returns NEUTRAL_CONTROLS once the decision budget is exceeded", async () => {
    const clock = makeClock();
    const brain = makeFakeBrain({ behaviour: "hang" });
    const onStall = vi.fn();
    const source = createBotInputSource({
      playerId: "bot:seer:1",
      slot: 1,
      team: 1,
      inference: brain,
      clock: clock.now,
      decisionBudgetMs: 2_000,
      onStall,
    });
    source.start();
    source.pump(observation());
    expect(brain.calls).toBe(1);

    // Still inside the budget: the held answer is still NEUTRAL (nothing landed).
    clock.advance(1_999);
    source.pump(observation());
    expect(source.read()).toBe(NEUTRAL_CONTROLS);
    expect(source.status).not.toBe("stalled");

    // Over the budget: the seat is declared stalled and drops to NEUTRAL.
    clock.advance(2);
    source.pump(observation());
    expect(source.status).toBe("stalled");
    expect(source.read()).toBe(NEUTRAL_CONTROLS);
    expect(source.stats.stalls).toBe(1);
    expect(onStall).toHaveBeenCalledTimes(1);
    expect(onStall.mock.calls[0]?.[0]).toMatchObject({ slot: 1, reason: "budget-exceeded" });
  });

  it("does NOT propagate the stall anywhere — no throw, no rejection, no callback that pauses", () => {
    const clock = makeClock();
    const brain = makeFakeBrain({ behaviour: "hang" });
    const source = createBotInputSource({
      playerId: "bot:seer:1",
      slot: 1,
      team: 1,
      inference: brain,
      clock: clock.now,
    });
    source.start();
    // Every one of these is a frame. None may throw, and none may return a
    // promise: a stalled bot must be unable to hold up the sim.
    for (let frame = 0; frame < 50; frame += 1) {
      clock.advance(100);
      const pumped = source.pump(observation());
      const read = source.read();
      expect(pumped).toBeUndefined();
      expect(read).not.toBeInstanceOf(Promise);
      expect(read).toEqual(NEUTRAL_CONTROLS);
    }
    expect(source.stats.stalls).toBeGreaterThan(0);
    // The seat kept asking, so a transient wedge recovers on its own.
    expect(brain.calls).toBeGreaterThan(1);
  });

  it("recovers by itself once a fresh decision lands", async () => {
    const clock = makeClock();
    const brain = makeFakeBrain({ behaviour: "hang" });
    const source = createBotInputSource({
      playerId: "bot:seer:1",
      slot: 1,
      team: 1,
      inference: brain,
      clock: clock.now,
      decisionBudgetMs: 1_000,
    });
    source.start();
    source.pump(observation());
    clock.advance(1_001);
    source.pump(observation());
    expect(source.status).toBe("stalled");

    // The abandoned request is gone for good, so recovery means a NEW request
    // going out on the normal cadence and landing.
    for (let tick = 0; tick < 8; tick += 1) source.pump(observation());
    expect(brain.calls).toBe(2);
    brain.resolveAll();
    await flush();
    expect(source.read()).toMatchObject({ throttle: 1 });
    expect(source.status).toBe("driving");
  });

  it("discards a stalled request's late answer instead of resurrecting it", async () => {
    const clock = makeClock();
    const brain = makeFakeBrain({ behaviour: "hang" });
    const source = createBotInputSource({
      playerId: "bot:seer:1",
      slot: 1,
      team: 1,
      inference: brain,
      clock: clock.now,
      decisionBudgetMs: 1_000,
    });
    source.start();
    source.pump(observation());
    const staleCall = brain.seen.length;
    expect(staleCall).toBe(1);

    clock.advance(1_001);
    source.pump(observation());
    expect(source.status).toBe("stalled");

    // The abandoned promise finally lands. It must be ignored: the generation
    // was bumped, so it can no longer match.
    brain.resolveAll();
    await flush();
    expect(source.stats.decisions).toBe(0);
    expect(source.read()).toBe(NEUTRAL_CONTROLS);
  });

  it("a rejecting brain is contained too, and keeps its last good action", async () => {
    const brain = makeFakeBrain({ behaviour: "ok" });
    const onError = vi.fn();
    const source = createBotInputSource({
      playerId: "bot:seer:1",
      slot: 1,
      team: 1,
      inference: brain,
      onError,
    });
    source.start();
    source.pump(observation());
    await flush();
    expect(source.read()).toMatchObject({ throttle: 1 });

    // A rejection is not fatal and is not propagated: the donor would freeze
    // the match here (startup.js:734-744).
    brain.behaviour = "reject";
    for (let tick = 0; tick < 8; tick += 1) source.pump(observation());
    await flush();
    expect(source.read()).toMatchObject({ throttle: 1 });
    expect(source.status).toBe("errored");
    expect(source.isLive()).toBe(true);
    expect(onError).toHaveBeenCalled();
  });

  it("survives a brain that throws synchronously out of decide()", async () => {
    const brain = makeFakeBrain({ behaviour: "throw" });
    const source = createBotInputSource({ playerId: "bot:seer:1", slot: 1, team: 1, inference: brain });
    source.start();
    expect(() => source.pump(observation())).not.toThrow();
    await flush();
    expect(source.read()).toBe(NEUTRAL_CONTROLS);
    expect(source.stats.errors).toBe(1);
  });

  it("survives a throwing kickoff hook and a throwing observability callback", () => {
    const brain = makeFakeBrain();
    const source = createBotInputSource({
      playerId: "bot:seer:1",
      slot: 1,
      team: 1,
      inference: {
        ...brain,
        getKickoffControls: () => {
          throw new Error("kickoff exploded");
        },
      },
      onStall: () => {
        throw new Error("telemetry exploded");
      },
    });
    source.start();
    expect(() => source.pump(observation())).not.toThrow();
  });
});

describe("a bot seat is driven at the donor's cadence", () => {
  it("asks for a decision once per tickSkip (8 ticks = 15 Hz at 120 Hz)", async () => {
    const brain = makeFakeBrain();
    const source = createBotInputSource({ playerId: "bot:seer:1", slot: 1, team: 1, inference: brain });
    source.start();
    // The first pump is due immediately.
    source.pump(observation());
    expect(brain.calls).toBe(1);
    await flush();
    // The next 7 frames are the cadence gap, and an in-flight request is never
    // doubled up on.
    for (let tick = 0; tick < 7; tick += 1) {
      source.pump(observation());
      await flush();
      expect(brain.calls).toBe(1);
    }
    source.pump(observation());
    expect(brain.calls).toBe(2);
  });

  it("prefers a deterministic kickoff over asking the model", async () => {
    const kickoff: CarControls = { ...NEUTRAL_CONTROLS, throttle: 1, boost: true };
    const brain = makeFakeBrain({ kickoff });
    const source = createBotInputSource({ playerId: "bot:nexto:1", slot: 1, team: 1, inference: brain });
    source.start();
    source.pump(observation());
    await flush();
    expect(brain.calls).toBe(0);
    expect(source.read()).toMatchObject({ throttle: 1, boost: true });
  });

  it("waits for weights without treating it as a stall — the event case", () => {
    const brain = makeFakeBrain({ ready: false });
    const clock = makeClock();
    const source = createBotInputSource({
      playerId: "bot:seer:1",
      slot: 1,
      team: 1,
      inference: brain,
      clock: clock.now,
      decisionBudgetMs: 100,
    });
    source.start();
    // A 9.9 MB model can easily outlast the countdown. The match runs anyway.
    for (let frame = 0; frame < 100; frame += 1) {
      clock.advance(1_000);
      source.pump(observation());
    }
    expect(brain.calls).toBe(0);
    expect(source.status).toBe("waiting");
    expect(source.stats.stalls).toBe(0);
    expect(source.read()).toBe(NEUTRAL_CONTROLS);
  });

  it("sanitizes whatever the brain returns before the sim sees it", async () => {
    const brain = makeFakeBrain({
      controls: { throttle: 5, steer: -9, jump: "yes" } as unknown as CarControls,
    });
    const source = createBotInputSource({ playerId: "bot:seer:1", slot: 1, team: 1, inference: brain });
    source.start();
    source.pump(observation());
    await flush();
    const read = source.read();
    expect(read.throttle).toBe(1);
    expect(read.steer).toBe(-1);
    expect(read.jump).toBe(false);
  });

  it("gives every bot seat a namespaced id that cannot collide with a player", () => {
    const brain = makeFakeBrain();
    const source = createBotInputSource({ playerId: "bot:seer:3", slot: 3, team: 1, inference: brain });
    expect(source.playerId).toBe("bot:seer:3");
    expect(source.slot).toBe(3);
  });
});
