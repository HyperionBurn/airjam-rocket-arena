/**
 * ROUND TRIP AGAINST THE REAL WASM.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS PROVES
 * ---------------------------------------------------------------------------
 * `./donor-bridge.test.ts` proves the bridge makes the right calls against an
 * injected fake. This file proves those calls are the ones the SHIPPED CORE
 * actually exports, and — the part that matters — that a mutator measurably
 * CHANGES THE SIMULATION rather than merely reaching a function.
 *
 * The core is loaded exactly the way the donor's own headless harness loads it
 * (reference `server/native.mjs`): the `.wasm` binary is read from disk and
 * handed to the factory, then the 16 arena collision meshes go through
 * `_physics_init` / `_physics_createArena`. No donor source is imported and
 * nothing under `src/donor/**` is executed.
 *
 * Two measurables, both taken from the running core:
 *
 *  1. `_physics_setUnlimitedBoost` — 400 ticks of held boost. The car drives
 *     over boost pads, so the FINAL tank value is not stable; the durable
 *     claim is the range:
 *       stock     → the tank reaches 0 and spends most of the run under 50
 *       unlimited → the tank is pinned at 100 for all 400 ticks
 *  2. The ball-velocity mutators — ball launched at 600 uu/s, measured after
 *     120 ticks (1.00 s) of real physics:
 *       NORMAL     → X = 485.43 uu
 *       BOOMER 1.75 → X = 920.49 uu   (1.90x further)
 *       HEAVY 0.72  → X = 337.09 uu   (0.69x)
 *
 * The arena is deterministic (fixed 120 Hz step, no RNG in the fixture), so
 * the ball numbers are exact, not tolerances.
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createWasmSimBridge, type EmscriptenPhysicsModule } from "../donor-bridge.js";
import { BALL_FIELD, CAR_FIELD, STATE_HEADER, carBase } from "../donor-facts.js";
import { MUTATOR_REGISTRY, type SimConfig } from "../sim-config.js";
import { applySimConfigToDonor } from "../sim-bridge.js";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const PHYSICS_DIR = join(ROOT, "public", "physics");
const COLLISION_DIR = join(ROOT, "public", "assets", "arena", "collision");

/** 8 floats per car, in the ABI order `network-state.cpp:15` defines. */
const NEUTRAL = [0, 0, 0, 0, 0, 0, 0, 0];
const CARS = 2;
/** Ticks of held boost that fully drain the tank on stock physics. */
const BOOST_BURN_TICKS = 400;
/** Ticks the ball is measured over: 120 Hz, so exactly 1.00 s. */
const BALL_MEASURE_TICKS = 120;
/** The fixture's launch speed, uu/s. */
const LAUNCH_SPEED = 600;

/**
 * The real module. `EmscriptenPhysicsModule` is the narrow surface the bridge
 * is allowed to see; this is the module plus the exports the FIXTURE needs to
 * build an arena and to write a control vector (`_physics_init`,
 * `_physics_addCar`, `_physics_sourceVersion`, `_physics_getBallRadius`,
 * `_physics_getControlsPtr`). The bridge itself never touches controls: the
 * seam owns those in production.
 */
type RealModule = EmscriptenPhysicsModule & {
  readonly HEAPU8: Uint8Array;
  readonly HEAP32: Int32Array;
  _physics_init(data: number, lengths: number, count: number): number;
  _physics_createArena(): number;
  _physics_addCar(team: number, preset: number): number;
  _physics_sourceVersion(): number;
  _physics_getBallRadius(): number;
  _physics_getControlsPtr(): number;
};

interface CoreFactory {
  (options: { wasmBinary: Uint8Array; print(): void; printErr(): void }): Promise<RealModule>;
}

let module: RealModule;
let statePtr = 0;
let stateSize = 0;
let controlsPtr = 0;
let bridge: ReturnType<typeof createWasmSimBridge>;

/** A fresh view. The heap can grow, so never cache this across a step. */
const live = (): Float32Array => new Float32Array(module.HEAPF32.buffer, statePtr, stateSize);

/** Test fixture only: the seam owns control writes in production. */
const holdBoostOnCar0 = (): void => {
  module.HEAPF32.set([0, 0, 0, 0, 0, 0, 1, 0], controlsPtr / 4);
};

const neutralise = (): void => {
  for (let slot = 0; slot < CARS; slot += 1) {
    module.HEAPF32.set(NEUTRAL, controlsPtr / 4 + slot * NEUTRAL.length);
  }
};

/** Back to a known kickoff, with unlimited boost off, exactly like `NativeArena`. */
const toKickoff = (): void => {
  bridge.resetKickoff();
  bridge.setUnlimitedBoost(false);
  neutralise();
};

const ballBlock = (): number[] => Array.from(live().subarray(STATE_HEADER.BALL, STATE_HEADER.BALL + 18));

/**
 * Test fixture only: hand the ball a launch speed, copying the LIVE orientation
 * basis out of the state block. This is the same fixture the donor's own harness
 * builds (`server/native.mjs` `setBall`), and it deliberately goes through the
 * raw export so the measurement below is attributable to the MUTATOR's write and
 * to nothing else.
 */
const launchBall = (speed: number): number => {
  const block = ballBlock();
  block[BALL_FIELD.VEL] = speed;
  block[BALL_FIELD.VEL + 1] = 0;
  block[BALL_FIELD.VEL + 2] = 0;
  const pointer = module._malloc!(51 * 4);
  const at = pointer >> 2;
  module.HEAPF32.fill(0, at, at + 51);
  module.HEAPF32.set(block, at);
  const accepted = module._physics_setBallState!(pointer);
  module._free!(pointer);
  return accepted;
};

beforeAll(async () => {
  // The Emscripten glue is an ESM module with top-level await and a Node code
  // path, so it is imported natively rather than bundled.
  const factory = (await import(
    /* @vite-ignore */ pathToFileURL(join(PHYSICS_DIR, "rocketsim-core.js")).href
  )) as { default: CoreFactory };
  const wasmBinary = new Uint8Array(await readFile(join(PHYSICS_DIR, "rocketsim-core.wasm")));
  module = await factory.default({ wasmBinary, print: () => {}, printErr: () => {} });

  const manifest: unknown = JSON.parse(await readFile(join(COLLISION_DIR, "manifest.json"), "utf8"));
  const names = manifest as string[];
  const meshes = await Promise.all(names.map((name) => readFile(join(COLLISION_DIR, name))));

  const data = module._malloc!(meshes.reduce((sum, mesh) => sum + mesh.length, 0));
  const lengths = module._malloc!(meshes.length * 4);
  let offset = data;
  meshes.forEach((mesh, index) => {
    module.HEAPU8.set(mesh, offset);
    module.HEAP32[lengths / 4 + index] = mesh.length;
    offset += mesh.length;
  });
  const initialised = module._physics_init!(data, lengths, meshes.length);
  module._free!(data);
  module._free!(lengths);
  expect(initialised, "_physics_init must accept the arena meshes").toBe(1);
  expect(module._physics_createArena!(), "_physics_createArena must succeed").toBe(1);
  expect(module._physics_sourceVersion!(), "unexpected native ABI").toBe(1);

  expect(module._physics_addCar!(0, 0)).toBe(0);
  expect(module._physics_addCar!(1, 0)).toBe(1);

  statePtr = module._physics_getStatePtr!();
  stateSize = module._physics_getStateSize!();
  controlsPtr = module._physics_getControlsPtr!();
  expect(stateSize, "state block size must match the 510-float layout").toBe(510);

  // The handle the production host uses: the donor's own sim instance, whose
  // `module` field is the Emscripten module (`simulation.js:33`). No
  // `src/donor/**` import is involved — the object is built right here.
  bridge = createWasmSimBridge({
    module,
    get state() {
      return live();
    },
  });
}, 120_000);

afterAll(() => {
  bridge?.dispose();
});

/* -------------------------------------------------------------------------- */

describe("the shipped core really exports what the bridge calls", () => {
  it("exposes every entry point the mutator layer depends on", () => {
    // This is the assertion that pins the export names verified in
    // `public/physics/rocketsim-core.js:7` against the running module.
    expect(bridge.available).toEqual([
      "setUnlimitedBoost",
      "writeBallState",
      "writeCarState",
      "goalExplosion",
      "resetKickoff",
      "clearGoalFlag",
      "step",
    ]);
  });

  it("resolves the live state block and its car layout", () => {
    const state = bridge.state;
    expect(state).toHaveLength(510);
    expect(state[STATE_HEADER.NUM_CARS]).toBe(2);
    expect(live()[carBase(0) + CAR_FIELD.BOOST]).toBeGreaterThanOrEqual(0);
  });

  it("accepts a ball block copied from the live state, and refuses a degenerate one", () => {
    toKickoff();
    bridge.step(30);

    // Copied from the live block: the orientation basis is real, so the module
    // accepts it. This is the path `applySimConfigToDonor` uses.
    const result = applySimConfigToDonor(MUTATOR_REGISTRY.BOOMER_BALL, bridge);
    expect(result.ballVelocityApplied).toBe(true);

    // A hand-built block with a ZERO forward vector is a genuinely different
    // case: the module returns 0 and changes nothing. The bridge must surface
    // that as a failure rather than assume the write landed.
    const degenerate = new Float64Array(18);
    const pointer = module._malloc!(18 * 4);
    module.HEAPF32.fill(0, pointer >> 2, (pointer >> 2) + 18);
    const raw = module._physics_setBallState!(pointer);
    module._free!(pointer);

    expect(raw, "a degenerate pose basis must be refused by the real core").toBe(0);
    expect(() => bridge.writeBallState(degenerate)).toThrow(/returned 0/);
    expect(bridge.reason("writeBallState")).toContain("_physics_setBallState");
  });
});

describe("MEASUREMENT 1: INFINITE_BOOST changes the simulation", () => {
  /** Hold boost on car 0 and record its BOOST field every tick. */
  const traceHoldingBoost = (unlimited: boolean): number[] => {
    toKickoff();
    if (unlimited) {
      const applied = applySimConfigToDonor(MUTATOR_REGISTRY.INFINITE_BOOST, bridge);
      expect(applied.unlimitedBoostApplied).toBe(true);
      expect(applied.notApplied.map((entry) => entry.field)).not.toContain("unlimitedBoost");
    }
    const trace: number[] = [];
    for (let tick = 0; tick < BOOST_BURN_TICKS; tick += 1) {
      holdBoostOnCar0();
      bridge.step(1);
      trace.push(live()[carBase(0) + CAR_FIELD.BOOST]);
    }
    return trace;
  };

  it("drains the tank to empty on stock and never drops below full on unlimited", () => {
    const stock = traceHoldingBoost(false);
    const unlimited = traceHoldingBoost(true);

    // Stock really runs out: the tank reaches 0 at some point in the run.
    expect(Math.min(...stock), `stock boost must hit 0 within ${BOOST_BURN_TICKS} ticks`).toBe(0);
    // Unlimited boost is pinned at 100 for the entire run.
    expect(Math.min(...unlimited), "unlimited boost must never dip below a full tank").toBe(100);

    // The car also drives over boost pads, so the FINAL value is not stable
    // (measured: stock ends anywhere in 0..20, refilled by pads). The durable
    // claim is how much of the run the tank is spent.
    const spent = (trace: number[]): number => trace.filter((value) => value < 50).length;
    expect(spent(stock)).toBeGreaterThan(BOOST_BURN_TICKS * 0.5);
    expect(spent(unlimited), "an unlimited tank is never spent").toBe(0);
  });
});

describe("MEASUREMENT 2: the ball-velocity mutators change the trajectory", () => {
  /** Launch at 600 uu/s, apply `config` through the real bridge, run 1 s. */
  const measure = (config: SimConfig | null): { velocityX: number; x: number } => {
    toKickoff();
    for (let tick = 0; tick < 30; tick += 1) bridge.step(1);
    expect(launchBall(LAUNCH_SPEED), "the launch fixture must be accepted").toBe(1);

    if (config) {
      const result = applySimConfigToDonor(config, bridge);
      expect(result.ballVelocityApplied, `${config.id} must reach the ball block`).toBe(true);
    }

    const velocityX = live()[STATE_HEADER.BALL + BALL_FIELD.VEL];
    for (let tick = 0; tick < BALL_MEASURE_TICKS; tick += 1) bridge.step(1);
    return { velocityX, x: live()[STATE_HEADER.BALL + BALL_FIELD.POS] };
  };

  it("stock leaves the ball at 600 uu/s and it travels 485.43 uu in one second", () => {
    const stock = measure(null);
    expect(stock.velocityX).toBeCloseTo(LAUNCH_SPEED, 1);
    expect(stock.x).toBeCloseTo(485.43, 1);
  });

  it("BOOMER_BALL hands the ball back more speed, and it travels measurably further", () => {
    const stock = measure(null);
    const boomer = measure(MUTATOR_REGISTRY.BOOMER_BALL);

    // The write reached the heap: 600 * 1.75 = 1050.
    expect(boomer.velocityX).toBeCloseTo(LAUNCH_SPEED * MUTATOR_REGISTRY.BOOMER_BALL.ballVelocityScale, 1);
    // And the simulation carried it: 920.49 uu vs 485.43 uu, a 1.90x difference.
    expect(boomer.x).toBeCloseTo(920.49, 1);
    expect(boomer.x).toBeGreaterThan(stock.x * 1.5);
  });

  it("HEAVY_BALL takes speed away, and the ball travels measurably less far", () => {
    const stock = measure(null);
    const heavy = measure(MUTATOR_REGISTRY.HEAVY_BALL);

    expect(heavy.velocityX).toBeCloseTo(LAUNCH_SPEED * MUTATOR_REGISTRY.HEAVY_BALL.ballVelocityScale, 1);
    expect(heavy.x).toBeCloseTo(337.09, 1);
    expect(heavy.x).toBeLessThan(stock.x * 0.8);
  });

  it("re-scaling the same live velocity twice is the boomer effect compounding, not a re-send", () => {
    toKickoff();
    for (let tick = 0; tick < 30; tick += 1) bridge.step(1);
    expect(launchBall(LAUNCH_SPEED)).toBe(1);

    applySimConfigToDonor(MUTATOR_REGISTRY.BOOMER_BALL, bridge);
    const once = live()[STATE_HEADER.BALL + BALL_FIELD.VEL];
    // `rescaleBallVelocity` is what the stat tracker calls after a car contact,
    // so the second write must read the ALREADY-SCALED velocity back out.
    applySimConfigToDonor(MUTATOR_REGISTRY.BOOMER_BALL, bridge);
    const twice = live()[STATE_HEADER.BALL + BALL_FIELD.VEL];

    expect(once).toBeCloseTo(1050, 0);
    expect(twice).toBeCloseTo(1050 * 1.75, 0);
  });
});

describe("the honest limits hold against the REAL core, not just a fake", () => {
  it("a radius mutator still reports radiusApplied: false, because there is no setter", () => {
    toKickoff();
    bridge.step(10);
    const before = live()[STATE_HEADER.BALL + BALL_FIELD.POS];

    const result = applySimConfigToDonor(MUTATOR_REGISTRY.GIANT_BALL, bridge);
    expect(result.ballVelocityApplied).toBe(true);
    expect(result.radiusApplied).toBe(false);
    expect(result.notApplied.find((entry) => entry.field === "ballRadiusScale")?.reason).toContain(
      "no radius setter",
    );

    // Proof the radius really is unchanged: `_physics_getBallRadius()` is the
    // only radius accessor and it is read-only, so the mutator cannot move it.
    const radius = module._physics_getBallRadius();
    expect(radius).toBeCloseTo(91.25, 2);
    expect(live()[STATE_HEADER.BALL + BALL_FIELD.POS]).toBeCloseTo(before, 5);
  });

  it("jumpScale is still reported as undelivered even with the real core loaded", () => {
    const result = applySimConfigToDonor(MUTATOR_REGISTRY.LOW_GRAVITY, bridge);
    const entry = result.notApplied.find((item) => item.field === "jumpScale");
    expect(entry).toBeDefined();
    expect(entry?.reason).toContain("press");
  });
});
