import { describe, expect, it, vi } from "vitest";

import { NEUTRAL_CONTROLS } from "../../seam.js";
import { createBotSeatManager } from "../bot-seats.js";
import type { BotInferenceFactory } from "../bot-inference.js";
import { chaserPolicy, createScriptedInference } from "../scripted-bot.js";
import { NO_PADS, makeClock, makeFakeBrain, makeFakeRegistry, makeFakeSim, makeState } from "./fakes.js";

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

const donorFactory = (): BotInferenceFactory => () => makeFakeBrain();

describe("startMatch â€” reserves exactly the planned bot seats", () => {
  it("fills the 1-human 1v1 with one bot seat on the empty team", async () => {
    const registry = makeFakeRegistry();
    const manager = createBotSeatManager({ registry, createInference: donorFactory(), teamSize: 1 });

    const report = await manager.startMatch(1);

    expect(report.blocked).toBe(false);
    expect(report.plan.bots).toEqual([0, 1]);
    expect(registry.botSeats()).toEqual([{ slot: 0, team: 1 }]);
    expect(report.seats).toHaveLength(1);
    expect(report.seats[0]).toMatchObject({ slot: 0, team: 1 });
  });

  it("plans zero bot seats when the roster is already even", async () => {
    const registry = makeFakeRegistry();
    const manager = createBotSeatManager({ registry, createInference: donorFactory(), teamSize: 2 });
    const report = await manager.startMatch(4);
    expect(report.plan.totalBots).toBe(0);
    expect(registry.botSeats()).toHaveLength(0);
    expect(report.mode).toBe("seat-only");
  });

  it("plans zero bot seats when the policy is off, even for one human", async () => {
    const registry = makeFakeRegistry();
    const manager = createBotSeatManager({
      registry,
      createInference: donorFactory(),
      teamSize: 1,
      policy: "off",
    });
    const report = await manager.startMatch(1);
    expect(report.plan.totalBots).toBe(0);
    expect(registry.botSeats()).toHaveLength(0);
    // One human with bots off is genuinely not a match. The host is told so
    // rather than being handed a 1-car "match" it would have to detect itself.
    expect(report.blocked).toBe(true);
    expect(report.plan.refusal).toBe("bots-disabled");
  });

  it("reports a refused seat instead of throwing when the arena is full", async () => {
    const registry = makeFakeRegistry(true);
    const manager = createBotSeatManager({ registry, createInference: donorFactory(), teamSize: 1 });
    const report = await manager.startMatch(1);
    expect(report.blocked).toBe(false);
    expect(report.refusedSeats).toBe(1);
    expect(report.seats).toHaveLength(0);
    expect(report.notices.some((n) => n.code === "seat-refused")).toBe(true);
  });

  it("is idempotent â€” a restart does not leak the previous match's seats", async () => {
    const registry = makeFakeRegistry();
    const manager = createBotSeatManager({ registry, createInference: donorFactory(), teamSize: 1 });
    await manager.startMatch(1);
    await manager.startMatch(1);
    expect(manager.seats()).toHaveLength(1);
  });
});

describe("startMatch â€” refuses to load a 1v1 model into a bigger arena", () => {
  it("uses a scripted bot for a 2v2, because the models throw on 4 cars", async () => {
    const registry = makeFakeRegistry();
    const createInference = vi.fn(() => makeFakeBrain());
    const manager = createBotSeatManager({ registry, createInference, teamSize: 2 });

    // 3 humans in a 2v2 -> 1 bot, 4 cars total. No neural policy can run.
    const report = await manager.startMatch(3);

    expect(report.plan.totalCars).toBe(4);
    expect(report.mode).toBe("scripted");
    expect(createInference).not.toHaveBeenCalled();
    expect(report.notices.some((n) => n.code === "oversized-arena")).toBe(true);
    expect(report.blocked).toBe(false);
    expect(manager.seats()).toHaveLength(1);
  });

  it("uses a 3v3 with no model at all", async () => {
    const registry = makeFakeRegistry();
    const createInference = vi.fn(() => makeFakeBrain());
    const manager = createBotSeatManager({ registry, createInference, teamSize: 3 });
    const report = await manager.startMatch(5);
    expect(report.mode).toBe("scripted");
    expect(createInference).not.toHaveBeenCalled();
  });

  it("loads the neural policy when the arena really is 1v1", async () => {
    const registry = makeFakeRegistry();
    const createInference = vi.fn(() => makeFakeBrain());
    const manager = createBotSeatManager({ registry, createInference, teamSize: 1 });
    const report = await manager.startMatch(1);
    expect(report.mode).toBe("neural");
    expect(createInference).toHaveBeenCalledWith("seer");
  });

  it("blocks the match when the operator chose `oversized: refuse`", async () => {
    const registry = makeFakeRegistry();
    const manager = createBotSeatManager({
      registry,
      createInference: donorFactory(),
      teamSize: 2,
      oversizedArena: "refuse",
    });
    const report = await manager.startMatch(3);
    expect(report.blocked).toBe(true);
    expect(report.seats).toHaveLength(0);
    expect(report.notices.some((n) => n.code === "match-refused")).toBe(true);
  });

  it("degrades a failed model load to a notice, never a rejection", async () => {
    const registry = makeFakeRegistry();
    const manager = createBotSeatManager({
      registry,
      createInference: () => makeFakeBrain({ loadFails: true }),
      teamSize: 1,
    });
    const report = await manager.startMatch(1);
    expect(report.degradedSeats).toBe(1);
    expect(report.blocked).toBe(false);
    expect(report.notices.some((n) => n.code === "model-load-failed")).toBe(true);
    // The seat still exists and still writes to the sim â€” neutral, not absent.
    const sim = makeFakeSim();
    manager.tick({ state: makeState(), pads: NO_PADS, sim });
    expect(sim.writes).toHaveLength(1);
    expect(sim.lastFor(0)).toEqual(NEUTRAL_CONTROLS);
  });

  it("turns bots off wholesale with the disabled difficulty", async () => {
    const registry = makeFakeRegistry();
    const createInference = vi.fn(() => makeFakeBrain());
    const manager = createBotSeatManager({ registry, createInference, difficulty: "disabled", teamSize: 1 });
    const report = await manager.startMatch(1);
    expect(report.mode).toBe("disabled");
    expect(createInference).not.toHaveBeenCalled();
    expect(report.notices.some((n) => n.code === "bots-disabled")).toBe(true);
    // The seat is still reserved, so the 1v1 stays legal.
    expect(manager.seats()).toHaveLength(1);
  });
});

describe("tick â€” drives every bot seat without ever blocking", () => {
  it("writes each seat's controls to the sim", async () => {
    const registry = makeFakeRegistry();
    const manager = createBotSeatManager({ registry, createInference: donorFactory(), teamSize: 2 });
    await manager.startMatch(3);
    const sim = makeFakeSim();
    const state = makeState();

    manager.tick({ state, pads: NO_PADS, sim });
    await flush();
    manager.tick({ state, pads: NO_PADS, sim });
    await flush();

    const slots = new Set(sim.writes.map((w) => w.slot));
    expect(slots.has(manager.seats()[0]!.slot)).toBe(true);
    expect(sim.lastFor(manager.seats()[0]!.slot)).not.toEqual(NEUTRAL_CONTROLS);
  });

  it("survives a sim that throws, and keeps ticking the seats", async () => {
    const registry = makeFakeRegistry();
    const manager = createBotSeatManager({ registry, createInference: donorFactory(), teamSize: 1 });
    await manager.startMatch(1);
    const broken = {
      setControls: () => {
        throw new Error("WASM is gone");
      },
      step: () => {},
      state: makeState(),
    };
    const report = manager.tick({ state: makeState(), pads: NO_PADS, sim: broken });
    expect(report.ticked).toBe(1);
    expect(report.written).toBe(0);
  });

  it("a wedged brain degrades the seat to neutral and the sim keeps stepping", async () => {
    const clock = makeClock();
    const registry = makeFakeRegistry();
    const brain = makeFakeBrain({ behaviour: "hang" });
    const onStall = vi.fn();
    const manager = createBotSeatManager({
      registry,
      createInference: () => brain,
      teamSize: 1,
      clock: clock.now,
      decisionBudgetMs: 1_000,
      onStall,
    });
    await manager.startMatch(1);
    const sim = makeFakeSim();

    // 100 frames with a brain that never answers. Every one must complete, and
    // the sim must have been stepped on every one of them.
    for (let frame = 0; frame < 100; frame += 1) {
      clock.advance(1_000);
      const report = manager.tick({ state: makeState(), pads: NO_PADS, sim });
      expect(report.ticked).toBe(1);
      sim.step(1);
    }

    expect(sim.steps).toBe(100);
    expect(sim.lastFor(manager.seats()[0]!.slot)).toEqual(NEUTRAL_CONTROLS);
    expect(onStall).toHaveBeenCalled();
    expect(manager.hasStalledSeat()).toBe(true);
  });

  it("tick is synchronous â€” it returns a report, never a promise", async () => {
    const registry = makeFakeRegistry();
    const manager = createBotSeatManager({ registry, createInference: donorFactory(), teamSize: 1 });
    await manager.startMatch(1);
    const report = manager.tick({ state: makeState(), pads: NO_PADS, sim: makeFakeSim() });
    expect(report).not.toBeInstanceOf(Promise);
    expect(report).toMatchObject({ ticked: 1, written: 1, stalled: false });
  });
});

describe("lifecycle â€” start, stop and seat release", () => {
  it("stopMatch neutralizes the seat and releases the brain", async () => {
    const registry = makeFakeRegistry();
    const brain = makeFakeBrain();
    const manager = createBotSeatManager({ registry, createInference: () => brain, teamSize: 1 });
    await manager.startMatch(1);
    const slot = manager.seats()[0]!.slot;

    manager.stopMatch("released");

    expect(manager.seats()).toHaveLength(0);
    expect(manager.sourceOf(slot)).toBeNull();
    expect(manager.mode()).toBe("seat-only");
    expect(brain.disposed).toBe(true);

    const sim = makeFakeSim();
    manager.tick({ state: makeState(), pads: NO_PADS, sim });
    expect(sim.writes).toHaveLength(0);
  });

  it("stopMatch is idempotent", async () => {
    const registry = makeFakeRegistry();
    const manager = createBotSeatManager({ registry, createInference: donorFactory(), teamSize: 1 });
    await manager.startMatch(1);
    manager.stopMatch("released");
    expect(() => manager.stopMatch("released")).not.toThrow();
  });

  it("releaseSlot drops exactly one seat", async () => {
    const registry = makeFakeRegistry();
    const manager = createBotSeatManager({ registry, createInference: donorFactory(), teamSize: 2 });
    // 2 humans in a 2v2 -> one bot per team.
    await manager.startMatch(2);
    expect(manager.seats()).toHaveLength(2);
    const first = manager.seats()[0]!.slot;
    manager.releaseSlot(first, "replaced");
    expect(manager.seats()).toHaveLength(1);
    expect(manager.sourceOf(first)).toBeNull();
  });

  it("resets the brain on every match start so recurrent state does not leak", async () => {
    const registry = makeFakeRegistry();
    const brain = makeFakeBrain();
    const manager = createBotSeatManager({ registry, createInference: () => brain, teamSize: 1 });
    await manager.startMatch(1);
    await manager.startMatch(1);
    expect(brain.resets).toBe(2);
    expect(brain.loads).toBe(2);
  });
});

/**
 * The headless contract: a full match progression with no ONNXRuntime, no WASM,
 * no Worker and no model download. `src/airjam/match` is another worker's
 * module and is deliberately not imported here â€” the phases are modelled locally
 * so this suite stays a unit test of the bots layer alone.
 */
describe("headless â€” a scripted bot carries a whole match through its phases", () => {
  it("drives every phase and never blocks the loop", async () => {
    const registry = makeFakeRegistry();
    const manager = createBotSeatManager({
      registry,
      // The scripted brain needs no model, so 4 cars are fine here.
      createInference: donorFactory(),
      createScripted: () => createScriptedInference({ policy: chaserPolicy }),
      teamSize: 2,
    });
    const report = await manager.startMatch(3);
    expect(report.mode).toBe("scripted");

    const sim = makeFakeSim();
    const state = makeState({ numCars: 4 });
    const slot = manager.seats()[0]!.slot;
    const phases = ["countdown", "kickoff", "playing", "goal", "ended"] as const;
    const drivenPerPhase: Record<string, number> = {};

    for (const phase of phases) {
      const frames = phase === "countdown" ? 240 : 120;
      let driven = 0;
      for (let frame = 0; frame < frames; frame += 1) {
        manager.tick({ state, pads: NO_PADS, sim, kickoffTick: phase === "kickoff" ? frame : -1 });
        sim.step(1);
        // A real frame yields to the microtask queue before the next one, which
        // is when an async decision actually lands. The bots layer relies on
        // that and never awaits inside `tick`.
        await flush();
        const written = sim.lastFor(slot);
        if (written && written !== NEUTRAL_CONTROLS) driven += 1;
      }
      drivenPerPhase[phase] = driven;
    }

    // Every phase ran, the sim advanced for every frame, and the bot was
    // actually driving in each one â€” including `playing`, which is the phase the
    // donor would have frozen.
    expect(Object.keys(drivenPerPhase)).toEqual([...phases]);
    for (const phase of phases) {
      expect(drivenPerPhase[phase], phase).toBeGreaterThan(0);
    }
    expect(manager.hasStalledSeat()).toBe(false);
    expect(manager.seats()[0]!.status).toBe("driving");

    // Determinism: the same tick yields the same action, every run.
    const again = chaserPolicy({
      state,
      pads: NO_PADS,
      slot,
      team: manager.seats()[0]!.team,
      current: NEUTRAL_CONTROLS,
      kickoffTick: -1,
    });
    const first = chaserPolicy({
      state,
      pads: NO_PADS,
      slot,
      team: manager.seats()[0]!.team,
      current: NEUTRAL_CONTROLS,
      kickoffTick: -1,
    });
    expect(again).toEqual(first);
  });

  it("neutralizes the bot seat on teardown", async () => {
    const registry = makeFakeRegistry();
    const manager = createBotSeatManager({
      registry,
      createInference: donorFactory(),
      createScripted: () => createScriptedInference(),
      teamSize: 1,
    });
    await manager.startMatch(1);
    const slot = manager.seats()[0]!.slot;
    manager.stopMatch("released");
    const source = manager.sourceOf(slot);
    expect(source).toBeNull();
  });
});
