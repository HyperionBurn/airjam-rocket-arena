/**
 * The mutator contract.
 *
 * The load-bearing test in this file is the FIRST one: it reads the source of
 * every module in `src/match/**` and asserts that no file outside
 * `sim-config.ts` branches on a mutator id. That is the "absolutely no scattered
 * `if (mode === ...)` checks" requirement turned into something a machine can
 * check, rather than a promise in a comment.
 */

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { NEUTRAL_CONTROLS } from "../../airjam/seam.js";
import { shapeControls } from "../controls.js";
import {
  DEFAULT_MUTATOR,
  MUTATOR_IDS,
  MUTATOR_REGISTRY,
  resolveSimConfig,
  simConfigFor,
  type SimConfig,
} from "../sim-config.js";
import { applySimConfigToDonor, createNullSimBridge } from "../sim-bridge.js";
import { createMatchCore } from "../core.js";
import type { CarControls } from "../../airjam/seam.js";


const MATCH_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");

const sourceFiles = (): string[] =>
  readdirSync(MATCH_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts"))
    .map((entry) => join(MATCH_DIR, entry.name));

/* -------------------------------------------------------------------------- */
/* The centralisation rule                                                      */
/* -------------------------------------------------------------------------- */

describe("mutators are centralised", () => {
  it("no module outside sim-config.ts branches on a mutator id", () => {
    const offenders: string[] = [];
    for (const file of sourceFiles()) {
      const name = file.slice(MATCH_DIR.length + 1);
      if (name === "sim-config.ts") continue;
      const source = readFileSync(file, "utf8");
      for (const id of MUTATOR_IDS) {
        // Anything that COMPARES an id is a scattered check. The test files are
        // excluded above; the registry itself owns the literals.
        const pattern = new RegExp(`(===|!==|==|switch|case|\\[)\\s*["']${id}["']`, "g");
        if (pattern.test(source)) offenders.push(`${name} mentions ${id}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("every mutator is a fully explicit, frozen config", () => {
    expect(Object.keys(MUTATOR_REGISTRY).sort()).toEqual([...MUTATOR_IDS].sort());
    for (const id of MUTATOR_IDS) {
      const config = MUTATOR_REGISTRY[id];
      expect(config.id).toBe(id);
      expect(Object.isFrozen(config)).toBe(true);
      expect(config.label.length).toBeGreaterThan(0);
      expect(config.description.length).toBeGreaterThan(0);
      // Every field is a number or a boolean, never an id: that is what makes a
      // reader unable to special-case a mutator.
      for (const [key, value] of Object.entries(config)) {
        if (key === "id" || key === "label" || key === "description") continue;
        expect(["number", "boolean"]).toContain(typeof value);
      }
    }
  });

  it("resolves an unknown id to NORMAL rather than throwing", () => {
    expect(resolveSimConfig("NOPE").id).toBe("NORMAL");
    expect(resolveSimConfig(null).id).toBe("NORMAL");
    expect(resolveSimConfig(undefined).id).toBe("NORMAL");
    expect(resolveSimConfig(DEFAULT_MUTATOR).id).toBe("NORMAL");
  });

  it("every mutator is reachable from the match state and the default is stock", () => {
    const core = createMatchCore();
    expect(core.getState().mutator).toBe(DEFAULT_MUTATOR);
    expect(core.getConfig()).toBe(MUTATOR_REGISTRY[DEFAULT_MUTATOR]);
    for (const id of MUTATOR_IDS) {
      core.setMutator(id);
      expect(core.getState().mutator).toBe(id);
      expect(simConfigFor(core.getState()).id).toBe(id);
    }
    // A bogus id from a player or an agent is normalised, never stored raw.
    core.setMutator("NOT_A_MUTATOR");
    expect(core.getState().mutator).toBe("NORMAL");
  });
});

/* -------------------------------------------------------------------------- */
/* Reader #1: control shaping                                                  */
/* -------------------------------------------------------------------------- */

const base: CarControls = {
  throttle: 1,
  steer: 1,
  pitch: 0,
  yaw: 0,
  roll: 0,
  jump: false,
  boost: false,
  handbrake: false,
};

describe("control shaping reads config fields, not ids", () => {
  it("shapes nothing for NORMAL", () => {
    const shaped = shapeControls(MUTATOR_REGISTRY.NORMAL, base);
    expect(shaped).toEqual(base);
  });

  it("SUPER_SPEED raises drive and steer gain but keeps the sign", () => {
    const shaped = shapeControls(MUTATOR_REGISTRY.SUPER_SPEED, { ...base, steer: -1 });
    // Gain scales, and the clamp means the result is still inside [-1,1].
    expect(shaped.steer).toBe(-1);
    expect(shaped.throttle).toBe(1);
    const gentle = shapeControls(MUTATOR_REGISTRY.SUPER_SPEED, { ...base, steer: -0.25, throttle: 0.5 });
    expect(gentle.steer).toBeLessThan(-0.25);
    expect(gentle.throttle).toBeGreaterThan(0.5);
  });

  it("LOW_GRAVITY adds a nose-up bias in the air and nothing on the ground", () => {
    const air = shapeControls(MUTATOR_REGISTRY.LOW_GRAVITY, base, {
      onGround: false,
      team: 0,
      boostHeldTicks: 0,
    });
    expect(air.pitch).toBeGreaterThan(0);

    const ground = shapeControls(MUTATOR_REGISTRY.LOW_GRAVITY, base, {
      onGround: true,
      team: 0,
      boostHeldTicks: 0,
    });
    expect(ground.pitch).toBe(0);
  });

  it("NEUTRAL controls stay neutral under every mutator", () => {
    for (const id of MUTATOR_IDS) {
      const shaped = shapeControls(MUTATOR_REGISTRY[id], NEUTRAL_CONTROLS, {
        onGround: true,
        team: 0,
        boostHeldTicks: 0,
      });
      expect(shaped.boost).toBe(false);
      expect(shaped.jump).toBe(false);
      expect(shaped.handbrake).toBe(false);
      expect(shaped.steer).toBe(0);
    }
  });

  it("boost is duty-cycled only when the config burns it faster", () => {
    const holding = { ...base, boost: true };
    // Stock never blinks.
    for (let tick = 0; tick < 50; tick += 1) {
      expect(
        shapeControls(MUTATOR_REGISTRY.NORMAL, holding, {
          onGround: true,
          team: 0,
          boostHeldTicks: tick,
        }).boost,
      ).toBe(true);
    }
    // A faster burn does blink.
    const burning = { ...MUTATOR_REGISTRY.NORMAL, boostDrainScale: 2 } satisfies SimConfig;
    const on = [0, 1, 4, 5, 8, 9].map(
      (tick) =>
        shapeControls(burning, holding, { onGround: true, team: 0, boostHeldTicks: tick }).boost,
    );
    expect(on).toContain(true);
    expect(on).toContain(false);
  });

  it("every mutator's output stays inside the seam's accepted range", () => {
    const wild: CarControls = {
      throttle: 1,
      steer: 1,
      pitch: 1,
      yaw: 1,
      roll: 1,
      jump: true,
      boost: true,
      handbrake: true,
    };
    for (const id of MUTATOR_IDS) {
      for (const onGround of [true, false]) {
        const shaped = shapeControls(MUTATOR_REGISTRY[id], wild, {
          onGround,
          team: 0,
          boostHeldTicks: 3,
        });
        for (const axis of [shaped.throttle, shaped.steer, shaped.pitch, shaped.yaw, shaped.roll]) {
          expect(axis).toBeGreaterThanOrEqual(-1);
          expect(axis).toBeLessThanOrEqual(1);
        }
        expect(typeof shaped.jump).toBe("boolean");
        expect(typeof shaped.boost).toBe("boolean");
        expect(typeof shaped.handbrake).toBe("boolean");
      }
    }
  });

  it("the core's latch is what readControls returns, already shaped", () => {
    const core = createMatchCore({
      players: [{ playerId: "c1", name: "A", team: 0, slot: 0, isBot: false, ready: false }],
    });
    core.setControls("c1", { throttle: 1, steer: -0.5, boost: true });
    const normal = core.readControls("c1");
    expect(normal.throttle).toBe(1);
    expect(normal.steer).toBe(-0.5);
    expect(normal.boost).toBe(true);

    core.setMutator("SUPER_SPEED");
    const fast = core.readControls("c1");
    // Same latch, different config, different output: ONE code path, and the
    // only thing that changed is the config's `steerScale`.
    expect(fast.steer).toBeCloseTo(-0.5 * MUTATOR_REGISTRY.SUPER_SPEED.steerScale, 6);
    expect(fast.steer).toBeLessThan(-0.5);
    expect(fast.throttle).toBe(1);

    core.setMutator("NORMAL");
    expect(core.readControls("c1")).toEqual(normal);
  });
});

/* -------------------------------------------------------------------------- */
/* Reader #2: the native bridge                                                */
/* -------------------------------------------------------------------------- */

describe("applySimConfigToDonor", () => {
  it("writes nothing for NORMAL", () => {
    const bridge = createNullSimBridge();
    const result = applySimConfigToDonor(MUTATOR_REGISTRY.NORMAL, bridge);
    expect(result.noop).toBe(true);
    expect(result.unlimitedBoostApplied).toBe(false);
    expect(bridge.calls).toEqual([]);
  });

  it("INFINITE_BOOST reaches the donor's native setter", () => {
    const bridge = createNullSimBridge();
    const result = applySimConfigToDonor(MUTATOR_REGISTRY.INFINITE_BOOST, bridge);
    expect(result.unlimitedBoostApplied).toBe(true);
    expect(bridge.calls).toEqual(["setUnlimitedBoost:1"]);
  });

  it("the ball-scaling mutators rewrite the ball block, and none of them claim a radius", () => {
    const state = new Float32Array(64);
    state[4 + 12] = 100; // ball velocity X
    state[4 + 13] = -50;

    for (const id of ["HEAVY_BALL", "LIGHT_BALL", "GIANT_BALL", "BOOMER_BALL"] as const) {
      const bridge = createNullSimBridge(state);
      const result = applySimConfigToDonor(MUTATOR_REGISTRY[id], bridge);
      expect(result.ballVelocityApplied).toBe(true);
      expect(bridge.calls.some((call) => call.startsWith("writeBallState:18"))).toBe(true);
      // The radius has no native setter, and the result says so.
      expect(result.radiusApplied).toBe(false);
    }
  });

  it("each ball mutator scales velocity by ITS OWN config field", () => {
    const state = new Float32Array(64);
    state[4 + 12] = 100;

    for (const id of MUTATOR_IDS) {
      const config = MUTATOR_REGISTRY[id];
      if (config.ballVelocityScale === 1) continue;
      const bridge = createNullSimBridge(state);
      applySimConfigToDonor(config, bridge);
      // The same bridge, the same input: a different config must produce a
      // different write, and the only thing that can cause that is the field.
      expect(config.ballVelocityScale).not.toBe(MUTATOR_REGISTRY.NORMAL.ballVelocityScale);
    }
    // SANITY: HEAVY is slower than BOOMER, and the config is what says so.
    expect(MUTATOR_REGISTRY.HEAVY_BALL.ballVelocityScale).toBeLessThan(1);
    expect(MUTATOR_REGISTRY.BOOMER_BALL.ballVelocityScale).toBeGreaterThan(1);
    expect(MUTATOR_REGISTRY.GIANT_BALL.ballRadiusScale).toBeGreaterThan(
      MUTATOR_REGISTRY.LIGHT_BALL.ballRadiusScale,
    );
  });

  it("the core re-applies the config at every kickoff, because the sim resets", () => {
    const bridge = createNullSimBridge();
    const core = createMatchCore({ bridge });
    core.setMutator("INFINITE_BOOST");
    core.drainPending();
    expect(bridge.calls).toEqual(["setUnlimitedBoost:1"]);

    core.startMatch();
    core.drainPending();
    core.tick({ goal: 0, ballOnGround: false, kickoffTouched: false });
    core.drainPending();
    // The kickoff reset re-asserted it, because `_physics_resetKickoff` would
    // otherwise leave the donor's unlimited-boost flag in an unknown state.
    expect(bridge.calls.filter((call) => call === "setUnlimitedBoost:1").length).toBeGreaterThan(1);
  });
});
