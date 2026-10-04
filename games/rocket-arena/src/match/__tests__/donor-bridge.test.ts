/**
 * The real `MatchSimBridge` against an INJECTED fake module.
 *
 * Nothing here imports WASM, `src/donor/**` or `public/physics/**`: the bridge
 * is handed a plain object shaped like an Emscripten module, so the whole file
 * runs in milliseconds under `environment: "node"`. The genuine WASM round trip
 * is in `./wasm-roundtrip.test.ts`, which loads the shipped core.
 *
 * What is being pinned here is the HONESTY contract, not the physics:
 *  - a mutator that reaches the module produces the expected native call, with
 *    the expected bytes on the heap;
 *  - a missing entry point, and a module that REFUSES a write, are both
 *    reported as "not applied" with a reason — never as a silent success;
 *  - the fields the donor cannot honour (radius, mass, jump scale) are reported
 *    as such whatever the module does.
 */

import { describe, expect, it } from "vitest";
import { createWasmSimBridge, type EmscriptenPhysicsModule } from "../donor-bridge.js";
import { BALL_FIELD, CAR_FIELD, STATE_HEADER, carBase } from "../donor-facts.js";
import { MUTATOR_REGISTRY, type MutatorId } from "../sim-config.js";
import { applySimConfigToDonor } from "../sim-bridge.js";

/* -------------------------------------------------------------------------- */
/* A fake Emscripten module                                                    */
/* -------------------------------------------------------------------------- */

interface NativeCall {
  readonly name: string;
  readonly args: readonly number[];
}

interface FakeModule {
  readonly module: EmscriptenPhysicsModule;
  readonly calls: NativeCall[];
  /** The 18 floats the module last accepted for the ball. */
  ball: number[] | null;
  /** The 24 floats the module last accepted for a car. */
  car: number[] | null;
}

const HEAP_FLOATS = 1 << 14;

/**
 * A module with the same shape and the same RETURN-VALUE DISCIPLINE as the real
 * one: both state setters return 1 for an accepted block and 0 for a refused
 * one, which is what makes "the write was refused" a reachable outcome.
 */
const createFakeModule = (
  options: { readonly omit?: readonly string[]; readonly refuse?: readonly string[] } = {},
): FakeModule => {
  const heap = new Float32Array(HEAP_FLOATS);
  const calls: NativeCall[] = [];
  const omitted = new Set(options.omit ?? []);
  const refused = new Set(options.refuse ?? []);
  let next = 4096;

  const record = (name: string, ...args: number[]): void => {
    calls.push({ name, args });
  };
  const attach = <K extends keyof EmscriptenPhysicsModule>(key: K, value: unknown): void => {
    if (omitted.has(key)) return;
    (module as unknown as Record<string, unknown>)[key] = value;
  };

  const fake: FakeModule = {
    calls,
    ball: null,
    car: null,
    module: { HEAPF32: heap } as EmscriptenPhysicsModule,
  };
  const module = fake.module;

  attach("_malloc", (bytes: number) => {
    record("_malloc", bytes);
    const pointer = next;
    next += bytes + 16;
    return pointer;
  });
  attach("_free", (pointer: number) => record("_free", pointer));
  attach("_physics_setUnlimitedBoost", (on: number) => record("_physics_setUnlimitedBoost", on));
  attach("_physics_resetKickoff", (car: number) => record("_physics_resetKickoff", car));
  attach("_physics_clearGoalFlag", () => record("_physics_clearGoalFlag"));
  attach("_physics_step", (ticks: number) => record("_physics_step", ticks));
  attach("_physics_goalExplosion", () => {
    record("_physics_goalExplosion");
    return 2;
  });

  attach("_physics_setBallState", (pointer: number) => {
    record("_physics_setBallState", pointer);
    if (refused.has("_physics_setBallState")) return 0;
    const base = pointer >> 2;
    fake.ball = Array.from(heap.subarray(base, base + 18));
    return 1;
  });

  attach("_physics_setCarState", (slot: number, pointer: number) => {
    record("_physics_setCarState", slot, pointer);
    if (refused.has("_physics_setCarState")) return 0;
    const base = pointer >> 2;
    fake.car = Array.from(heap.subarray(base, base + 24));
    return 1;
  });

  return fake;
};

/** A state block with a moving ball and one car on the ground. */
const stateWithBall = (velocityX: number): Float32Array => {
  const state = new Float32Array(64);
  state[STATE_HEADER.NUM_CARS] = 1;
  state[STATE_HEADER.BALL + BALL_FIELD.POS + 1] = 92;
  state[STATE_HEADER.BALL + BALL_FIELD.VEL] = velocityX;
  state[STATE_HEADER.BALL + BALL_FIELD.VEL + 2] = -25;
  state[carBase(0) + CAR_FIELD.ON_GROUND] = 1;
  return state;
};

const bridgeOver = (fake: FakeModule, state: Float32Array) =>
  createWasmSimBridge({ module: fake.module, state });

/* -------------------------------------------------------------------------- */
/* A mutator that reaches the module                                           */
/* -------------------------------------------------------------------------- */

describe("a mutator reaching the module makes the expected native call", () => {
  it("writes _physics_setUnlimitedBoost(1) and reports it applied", () => {
    const fake = createFakeModule();
    const result = applySimConfigToDonor(MUTATOR_REGISTRY.INFINITE_BOOST, bridgeOver(fake, stateWithBall(0)));

    expect(result.unlimitedBoostApplied).toBe(true);
    expect(fake.calls).toEqual([{ name: "_physics_setUnlimitedBoost", args: [1] }]);
    expect(result.notApplied.map((entry) => entry.field)).not.toContain("unlimitedBoost");
  });

  it("passes the donor's own off, 0, when the config does not ask for it", () => {
    const fake = createFakeModule();
    const bridge = bridgeOver(fake, stateWithBall(0));
    bridge.setUnlimitedBoost(false);
    expect(fake.calls).toEqual([{ name: "_physics_setUnlimitedBoost", args: [0] }]);
  });

  it("scales the ball's own velocity into the scratch block the module reads", () => {
    const fake = createFakeModule();
    const state = stateWithBall(100);
    const result = applySimConfigToDonor(MUTATOR_REGISTRY.BOOMER_BALL, bridgeOver(fake, state));

    expect(result.ballVelocityApplied).toBe(true);
    expect(fake.calls.map((call) => call.name)).toEqual(["_malloc", "_physics_setBallState"]);

    // The bytes the module actually received: BOOMER_BALL scales by 1.75, and
    // the untouched Z component proves only VEL was multiplied.
    expect(fake.ball).not.toBeNull();
    const block = fake.ball as number[];
    expect(block[BALL_FIELD.VEL]).toBeCloseTo(175, 5);
    expect(block[BALL_FIELD.VEL + 1]).toBe(0);
    expect(block[BALL_FIELD.VEL + 2]).toBeCloseTo(-43.75, 5);
    expect(block[BALL_FIELD.POS + 1]).toBe(92);
    expect(block.length).toBe(18);
  });

  it("keeps each ball mutator on its own config field", () => {
    for (const id of ["HEAVY_BALL", "LIGHT_BALL", "BOOMER_BALL"] as const) {
      const fake = createFakeModule();
      const config = MUTATOR_REGISTRY[id];
      applySimConfigToDonor(config, bridgeOver(fake, stateWithBall(200)));
      const written = (fake.ball as number[])[BALL_FIELD.VEL];
      expect(written).toBeCloseTo(200 * config.ballVelocityScale, 5);
    }
  });

  it("writes exactly 24 floats of car pose, into a fresh scratch block", () => {
    const fake = createFakeModule();
    const bridge = bridgeOver(fake, stateWithBall(0));
    const pose = new Float64Array(24);
    pose[0] = 10;
    pose[1] = 20;
    pose[2] = 30;

    expect(bridge.writeCarState(2, pose)).toBe(true);
    // One 51-float scratch, allocated once, then the setter call itself.
    expect(fake.calls).toEqual([
      { name: "_malloc", args: [204] },
      { name: "_physics_setCarState", args: [2, 4096] },
    ]);
    expect(fake.car).toHaveLength(24);
    expect((fake.car as number[]).slice(0, 3)).toEqual([10, 20, 30]);
  });

  it("reuses ONE scratch block across calls instead of leaking a malloc per write", () => {
    const fake = createFakeModule();
    const bridge = bridgeOver(fake, stateWithBall(0));
    bridge.writeBallState(new Float64Array(18));
    bridge.writeBallState(new Float64Array(18));
    bridge.writeCarState(0, new Float64Array(24));

    expect(fake.calls.filter((call) => call.name === "_malloc")).toHaveLength(1);
    const ballPointer = fake.calls.find((call) => call.name === "_physics_setBallState")?.args[0];
    const carPointer = fake.calls.find((call) => call.name === "_physics_setCarState")?.args[1];
    expect(ballPointer).toBe(carPointer);
  });

  it("routes resetKickoff, clearGoalFlag, goalExplosion and step to their exports", () => {
    const fake = createFakeModule();
    const bridge = bridgeOver(fake, stateWithBall(0));

    bridge.resetKickoff();
    expect(bridge.goalExplosion()).toBe(2);
    bridge.clearGoalFlag();
    bridge.step(3);

    expect(fake.calls.map((call) => call.name)).toEqual([
      "_physics_resetKickoff",
      "_physics_goalExplosion",
      "_physics_clearGoalFlag",
      "_physics_step",
    ]);
    expect(fake.calls[0].args).toEqual([-1]);
    expect(fake.calls[3].args).toEqual([3]);
  });

  it("prefers the donor's own methods when the sim has them", () => {
    const fake = createFakeModule();
    const seen: string[] = [];
    const bridge = createWasmSimBridge({
      module: fake.module,
      state: stateWithBall(0),
      setUnlimitedBoost: (enabled) => seen.push(`sim.setUnlimitedBoost:${enabled}`),
      resetKickoff: (car) => seen.push(`sim.resetKickoff:${car}`),
      applyGoalExplosion: () => 7,
      step: (ticks) => seen.push(`sim.step:${ticks ?? 1}`),
    });

    bridge.setUnlimitedBoost(true);
    bridge.resetKickoff();
    expect(bridge.goalExplosion()).toBe(7);
    bridge.step();

    expect(seen).toEqual([
      "sim.setUnlimitedBoost:true",
      "sim.resetKickoff:-1",
      "sim.step:1",
    ]);
    // The donor's methods are preferred, so the raw exports are not also called.
    expect(fake.calls).toEqual([]);
  });

  it("reads the state block from the module when the sim exposes no state", () => {
    const fake = createFakeModule();
    const heap = fake.module.HEAPF32;
    heap[0] = 7;
    (fake.module as { _physics_getStatePtr?: () => number })._physics_getStatePtr = () => 0;
    (fake.module as { _physics_getStateSize?: () => number })._physics_getStateSize = () => 16;

    const bridge = createWasmSimBridge({ module: fake.module });
    expect(bridge.state).toHaveLength(16);
    expect(bridge.state[0]).toBe(7);
  });
});

/* -------------------------------------------------------------------------- */
/* Not applied — with a reason                                                 */
/* -------------------------------------------------------------------------- */

describe("an unavailable or refused setter is reported, never assumed", () => {
  it("reports a missing entry point with the export name in the reason", () => {
    const fake = createFakeModule({ omit: ["_physics_setUnlimitedBoost"] });
    const bridge = bridgeOver(fake, stateWithBall(0));

    const result = applySimConfigToDonor(MUTATOR_REGISTRY.INFINITE_BOOST, bridge);

    expect(result.unlimitedBoostApplied).toBe(false);
    const entry = result.notApplied.find((item) => item.field === "unlimitedBoost");
    expect(entry).toBeDefined();
    expect(entry?.reason).toContain("_physics_setUnlimitedBoost");
    expect(entry?.reason).toContain("not exported");
    expect(entry?.reason.length ?? 0).toBeGreaterThan(10);
  });

  it("reports a module that REFUSED the ball block, and keeps the return value visible", () => {
    const fake = createFakeModule({ refuse: ["_physics_setBallState"] });
    const bridge = bridgeOver(fake, stateWithBall(100));

    const result = applySimConfigToDonor(MUTATOR_REGISTRY.BOOMER_BALL, bridge);

    expect(result.ballVelocityApplied).toBe(false);
    const entry = result.notApplied.find((item) => item.field === "ballVelocityScale");
    expect(entry?.reason).toContain("_physics_setBallState");
    expect(entry?.reason).toContain("returned 0");
    expect(fake.ball).toBeNull();
  });

  it("reports a module that refused a car pose, through reason()", () => {
    const fake = createFakeModule({ refuse: ["_physics_setCarState"] });
    const bridge = bridgeOver(fake, stateWithBall(0));

    expect(() => bridge.writeCarState(0, new Float64Array(24))).toThrow(/returned 0/);
    expect(bridge.reason("writeCarState")).toContain("_physics_setCarState");
  });

  it("reports a sim that has no module at all rather than pretending", () => {
    const bridge = createWasmSimBridge({ module: null, state: stateWithBall(0) });
    const result = applySimConfigToDonor(MUTATOR_REGISTRY.INFINITE_BOOST, bridge);

    expect(result.unlimitedBoostApplied).toBe(false);
    expect(result.notApplied.find((item) => item.field === "unlimitedBoost")?.reason).toContain(
      "no WASM module",
    );
    expect(bridge.available).toEqual([]);
  });

  it("clears a stale reason once the call succeeds", () => {
    const fake = createFakeModule();
    const bridge = bridgeOver(fake, stateWithBall(0));
    expect(bridge.reason("setUnlimitedBoost")).toBeNull();
    bridge.setUnlimitedBoost(true);
    expect(bridge.reason("setUnlimitedBoost")).toBeNull();
  });

  it("lists the entry points the module really exposes", () => {
    const full = createFakeModule();
    const partial = createFakeModule({ omit: ["_physics_setBallState", "_physics_setCarState"] });
    expect(bridgeOver(full, stateWithBall(0)).available).toContain("writeBallState");
    expect(bridgeOver(partial, stateWithBall(0)).available).toEqual(
      expect.arrayContaining(["setUnlimitedBoost", "step"]),
    );
    expect(bridgeOver(partial, stateWithBall(0)).available).not.toContain("writeBallState");
  });

  it("re-allocates after the donor swaps its module, and never frees a dead pointer", () => {
    const first = createFakeModule();
    const second = createFakeModule();
    let live: EmscriptenPhysicsModule = first.module;
    const bridge = createWasmSimBridge({ get module() { return live; }, state: stateWithBall(0) });

    bridge.writeBallState(new Float64Array(18));
    expect(first.calls.map((call) => call.name)).toEqual(["_malloc", "_physics_setBallState"]);

    // This is what `prepareOnline` / `switchPhysics` do: copy a candidate's own
    // properties onto the live sim, so `module` becomes a different object. Its
    // heap is a different heap, so the pointer has to be re-acquired there.
    live = second.module;
    bridge.writeBallState(new Float64Array(18));
    expect(second.calls.map((call) => call.name)).toEqual(["_malloc", "_physics_setBallState"]);

    // The old module's heap is gone. Freeing the old pointer would be a double
    // free, so the bridge must have dropped it silently.
    expect(first.calls.filter((call) => call.name === "_free")).toHaveLength(0);
    expect(second.calls.filter((call) => call.name === "_free")).toHaveLength(0);
  });

  it("frees the scratch exactly once on dispose, and tolerates a second call", () => {
    const fake = createFakeModule();
    const bridge = bridgeOver(fake, stateWithBall(0));
    bridge.writeBallState(new Float64Array(18));
    bridge.dispose();
    bridge.dispose();
    expect(fake.calls.filter((call) => call.name === "_free")).toHaveLength(1);
  });

  it("survives a sim that throws from its own method", () => {
    const bridge = createWasmSimBridge({
      module: createFakeModule().module,
      state: stateWithBall(0),
      setUnlimitedBoost: () => {
        throw new Error("donor refused");
      },
    });
    const result = applySimConfigToDonor(MUTATOR_REGISTRY.INFINITE_BOOST, bridge);
    expect(result.unlimitedBoostApplied).toBe(false);
    expect(result.notApplied.find((item) => item.field === "unlimitedBoost")?.reason).toContain(
      "donor refused",
    );
  });
});

/* -------------------------------------------------------------------------- */
/* The fields the donor cannot honour, for every mutator                       */
/* -------------------------------------------------------------------------- */

describe("the honest floor, independent of the module", () => {
  it("a stock config reports nothing failed and calls nothing", () => {
    const fake = createFakeModule();
    const result = applySimConfigToDonor(MUTATOR_REGISTRY.NORMAL, bridgeOver(fake, stateWithBall(0)));

    expect(result.noop).toBe(true);
    expect(result.notApplied).toEqual([]);
    expect(fake.calls).toEqual([]);
  });

  it("every radius mutator still reports radiusApplied: false AND a reason", () => {
    for (const id of ["HEAVY_BALL", "LIGHT_BALL", "GIANT_BALL"] as const) {
      const fake = createFakeModule();
      const result = applySimConfigToDonor(MUTATOR_REGISTRY[id], bridgeOver(fake, stateWithBall(100)));

      expect(result.radiusApplied).toBe(false);
      const entry = result.notApplied.find((item) => item.field === "ballRadiusScale");
      expect(entry?.requested).toContain(String(MUTATOR_REGISTRY[id].ballRadiusScale));
      expect(entry?.reason).toContain("collision mesh");
      expect(entry?.reason).toContain("no radius setter");
    }
  });

  it("jumpScale is reported honestly: a press cannot be scaled", () => {
    const fake = createFakeModule();
    const result = applySimConfigToDonor(MUTATOR_REGISTRY.LOW_GRAVITY, bridgeOver(fake, stateWithBall(0)));

    const entry = result.notApplied.find((item) => item.field === "jumpScale");
    expect(entry).toBeDefined();
    expect(entry?.reason).toContain("press");
    // The field it DOES apply is named in the same reason, so the UI can point
    // players at the mutator that does work.
    expect(entry?.reason).toContain("gravityBias");
    // gravityBias itself is not a failure: it is delivered by the control reader.
    expect(result.notApplied.map((item) => item.field)).not.toContain("gravityBias");
  });

  it("reports mass too, because nothing in the port consumes ballMassScale", () => {
    const fake = createFakeModule();
    const result = applySimConfigToDonor(MUTATOR_REGISTRY.GIANT_BALL, bridgeOver(fake, stateWithBall(0)));
    const entry = result.notApplied.find((item) => item.field === "ballMassScale");
    expect(entry?.reason).toContain("no mass setter");
  });

  it("every mutator's report is self-consistent", () => {
    for (const id of Object.keys(MUTATOR_REGISTRY) as MutatorId[]) {
      const config = MUTATOR_REGISTRY[id];
      const fake = createFakeModule();
      const result = applySimConfigToDonor(config, bridgeOver(fake, stateWithBall(100)));

      expect(result.config).toBe(config);
      expect(result.radiusApplied).toBe(false);
      for (const entry of result.notApplied) {
        expect(entry.reason.length).toBeGreaterThan(0);
        expect(entry.requested.length).toBeGreaterThan(0);
      }
      // A requested-but-undelivered effect is always named. An effect that was
      // never requested is NOT a failure and must not be reported as one.
      if (config.unlimitedBoost && !result.unlimitedBoostApplied) {
        expect(result.notApplied.map((item) => item.field)).toContain("unlimitedBoost");
      }
      if (config.ballVelocityScale !== 1 && !result.ballVelocityApplied) {
        expect(result.notApplied.map((item) => item.field)).toContain("ballVelocityScale");
      }
      if (config.unlimitedBoost && result.unlimitedBoostApplied) {
        expect(result.notApplied.map((item) => item.field)).not.toContain("unlimitedBoost");
      }
    }
  });
});
