/**
 * Arena growth, end to end, with a fake sim.
 *
 * The fake is a plain object literal standing in for the donor's
 * `PhysicsSimulation` and its Emscripten module — no WASM, no DOM, no donor
 * import — because `arena-growth.ts` reaches the sim through an injected getter
 * precisely so this file can exist. The fake copies the donor's real
 * constraints, so a test failure here means the HOST is wrong, not that the
 * fake is lenient:
 *
 *  - `bridge.cpp` refuses past `MAX_CARS = 8`, and on a team that is not 0/1.
 *  - `_physics_addCar` returns the new slot index, negative on refusal.
 *  - `_physics_setCarState` consumes 24 floats and only `1` means success
 *    (`online/prediction.js:82-89`).
 *  - the controls block is 8 floats per car for 8 cars
 *    (`physics/state-layout.js:16-18`).
 *
 * The seeded kickoff spawns are written out by hand rather than produced by
 * `yaw180Pose`, so the mirror assertions cannot pass by comparing the module
 * under indirect test against itself.
 */

import { describe, expect, it, vi } from "vitest";

import { STATE, type CarControls, type PortedSim } from "@/airjam/seam";
import {
  CAR_POSE_FLOATS,
  NATIVE_MAX_CARS,
  carBase,
  isMirroredPair,
  verifyKickoffSymmetry,
  type SlotTeams,
  type Team,
} from "@/airjam/slots";
import {
  createArenaGrowthHost,
  ensureArenaCapacity,
  isStillAtKickoff,
  type GrowthSim,
  type PhysicsGrowthExports,
} from "@/host/arena-growth";

const STATE_FLOATS = 510;
const STATE_AT = 1024;
const CONTROLS_AT = 16384;

/**
 * A mirrored kickoff pair, written out longhand, in NATIVE axes (X/Y horizontal,
 * Z up).
 *
 * The slots layer's arena-end mirror is a half turn about UP: it negates X and Y
 * of every vector and keeps Z (`kickoff.ts`). TEAM1 is therefore EXACTLY the
 * image of TEAM0: `pos.x` and `pos.y` flipped, `fwd.x` flipped, `right.y`
 * flipped, and the height and `up.z` unchanged (the car stays on its wheels).
 * Writing the pair by hand, rather than with `yaw180Pose`, keeps this test from
 * comparing the module under indirect test with itself.
 */
const TEAM0_SPAWN = {
  pos: [-2500, -300, 17],
  fwd: [1, 0, 0],
  right: [0, 1, 0],
  up: [0, 0, 1],
} as const;
const TEAM1_SPAWN = {
  pos: [2500, 300, 17],
  fwd: [-1, 0, 0],
  right: [0, -1, 0],
  up: [0, 0, 1],
} as const;

const spawnPose = (spawn: {
  pos: readonly number[];
  fwd: readonly number[];
  right: readonly number[];
  up: readonly number[];
}): number[] => {
  const pose = new Array<number>(CAR_POSE_FLOATS).fill(0);
  pose[0] = spawn.pos[0];
  pose[1] = spawn.pos[1];
  pose[2] = spawn.pos[2];
  pose[3] = spawn.fwd[0];
  pose[4] = spawn.fwd[1];
  pose[5] = spawn.fwd[2];
  pose[6] = spawn.right[0];
  pose[7] = spawn.right[1];
  pose[8] = spawn.right[2];
  pose[9] = spawn.up[0];
  pose[10] = spawn.up[1];
  pose[11] = spawn.up[2];
  pose[18] = 33; // BOOST — untouched by the mirror
  pose[19] = 1; // ON_GROUND
  return pose;
};

interface FakeSim {
  sim: GrowthSim;
  module: Required<
    Pick<
      PhysicsGrowthExports,
      "_physics_addCar" | "_physics_setCarState" | "_physics_resetKickoff" | "_physics_getControlsPtr"
    >
  > &
    Pick<PhysicsGrowthExports, "_malloc" | "_free" | "HEAPF32">;
  /** Cars the fake's `_physics_addCar` was asked to create, in order. */
  addCalls: Array<{ team: number; preset: number }>;
  /** Every pose the host wrote, in order. */
  writes: Array<{ slot: number; pose: number[] }>;
  /** How many times the host ran the all-cars kickoff reset. */
  resets: number;
  /** Slots the host freed, to prove the 96-byte pose scratch is released. */
  freed: number[];
  /** team for each slot the fake knows about. */
  teams: Team[];
  /** The sim's own 8-float control record for a slot. */
  controlsAt(slot: number): number[];
}

interface FakeSimOptions {
  /** Cars the "donor" made for itself at boot. Defaults to 2. */
  seeded?: number;
  /** NUM_CARS at which `_physics_addCar` starts refusing. Defaults to 8. */
  refuseAt?: number;
  /** Make `_physics_addCar` throw, as a WASM trap would. */
  throwOnAdd?: boolean;
  /** Give the seeded cars a mirrored kickoff pair. Defaults to true. */
  seededSpawns?: boolean;
}

const makeFakeSim = (options: FakeSimOptions = {}): FakeSim => {
  const seeded = options.seeded ?? 2;
  const refuseAt = options.refuseAt ?? NATIVE_MAX_CARS;
  const seededSpawns = options.seededSpawns ?? true;

  // The real sim's `state` is a Float32Array VIEW over the WASM heap
  // (`simulation.js:24-31`), so the fake does the same: one heap, two views.
  const heap = new Float32Array(1 << 16);
  const state = heap.subarray(STATE_AT, STATE_AT + STATE_FLOATS);
  const controls = heap.subarray(CONTROLS_AT, CONTROLS_AT + NATIVE_MAX_CARS * 8);

  const teams: Team[] = [];
  const addCalls: Array<{ team: number; preset: number }> = [];
  const writes: Array<{ slot: number; pose: number[] }> = [];
  const freed: number[] = [];
  let resets = 0;
  let nextPtr = 2048;

  const putCar = (slot: number, pose: readonly number[]): void => {
    const at = carBase(slot);
    for (let i = 0; i < CAR_POSE_FLOATS; i += 1) state[at + i] = pose[i] ?? 0;
  };

  for (let slot = 0; slot < seeded; slot += 1) {
    teams[slot] = (slot % 2) as Team;
    if (seededSpawns) putCar(slot, spawnPose(teams[slot] === 0 ? TEAM0_SPAWN : TEAM1_SPAWN));
  }
  state[STATE.NUM_CARS] = seeded;

  const module: FakeSim["module"] = {
    HEAPF32: heap,
    _malloc: (bytes: number) => {
      const ptr = nextPtr;
      nextPtr += bytes + 8;
      return ptr;
    },
    _free: (ptr: number) => {
      freed.push(ptr);
    },
    _physics_getControlsPtr: () => CONTROLS_AT * 4,
    _physics_addCar: (team: number, preset: number) => {
      addCalls.push({ team, preset });
      if (options.throwOnAdd) throw new Error("wasm trap: out of memory");
      if (team !== 0 && team !== 1) return -1;
      if ((state[STATE.NUM_CARS] | 0) >= refuseAt) return -1;
      const count = (state[STATE.NUM_CARS] | 0) + 1;
      const slot = count - 1;
      teams[slot] = team as Team;
      state[STATE.NUM_CARS] = count;
      // The adversarial case on purpose: a fresh car is NOT standing anywhere
      // useful, so a test can only pass if the host actually writes a mirrored
      // kickoff pose for it.
      putCar(slot, new Array<number>(CAR_POSE_FLOATS).fill(0));
      return slot;
    },
    _physics_setCarState: (slot: number, ptr: number) => {
      if (slot < 0 || slot >= (state[STATE.NUM_CARS] | 0)) return 0;
      const start = ptr >> 2;
      const pose = Array.from({ length: CAR_POSE_FLOATS }, (_, i) => heap[start + i]);
      writes.push({ slot, pose });
      putCar(slot, pose);
      return 1;
    },
    _physics_resetKickoff: () => {
      resets += 1;
      // What the engine does: place every car, per team, on its own kickoff
      // spot, in mirror-image pairs. Order k on team 0 sits at lateral -300+200k
      // and its mirror on team 1 at +300-200k.
      const count = state[STATE.NUM_CARS] | 0;
      const order: [number[], number[]] = [[], []];
      for (let slot = 0; slot < count; slot += 1) order[teams[slot] ?? 0].push(slot);
      for (const team of [0, 1] as const) {
        order[team].forEach((slot, k) => {
          const pose = spawnPose(team === 0 ? TEAM0_SPAWN : TEAM1_SPAWN);
          const lateral = -300 + 200 * k;
          pose[1] = team === 0 ? lateral : -lateral;
          putCar(slot, pose);
        });
      }
      return 1;
    },
  };

  const sim: GrowthSim = {
    state,
    step: () => {},
    setControls: (slot: number, controlsArg: CarControls | number[]) => {
      const at = slot * 8;
      const values = Array.isArray(controlsArg)
        ? controlsArg
        : [
            controlsArg.throttle,
            controlsArg.steer,
            controlsArg.pitch,
            controlsArg.yaw,
            controlsArg.roll,
            controlsArg.jump ? 1 : 0,
            controlsArg.boost ? 1 : 0,
            controlsArg.handbrake ? 1 : 0,
          ];
      controls.set(values, at);
    },
    module,
    // The donor's own wrapper, which keeps `carConfigs` in step
    // (`physics/simulation.js:68-74`).
    addCar: (team: 0 | 1, style = "default") => module._physics_addCar(team, style === "flat" ? 1 : 0),
    resetKickoff: () => {
      module._physics_resetKickoff(-1);
    },
  } satisfies GrowthSim & PortedSim;

  return {
    sim,
    module,
    addCalls,
    writes,
    freed,
    teams,
    get resets() {
      return resets;
    },
    controlsAt: (slot: number) => Array.from(controls.subarray(slot * 8, slot * 8 + 8)),
  };
};

/** slot → team for `count` cars, alternating, the way the registry balances. */
const alternatingTeams = (count: number): SlotTeams => {
  const teams: Record<number, Team> = {};
  for (let slot = 0; slot < count; slot += 1) teams[slot] = (slot % 2) as Team;
  return teams;
};

const quiet = () => undefined;

describe("arena growth — the arena actually gets cars", () => {
  for (const target of [2, 4, 6]) {
    it(`grows a 2-car arena to ${target}`, () => {
      const fake = makeFakeSim();
      const host = createArenaGrowthHost(() => fake.sim, { report: quiet });
      expect(host.carCount()).toBe(2);

      const result = ensureArenaCapacity(host, target, {
        teams: alternatingTeams(target),
        allowNativeReset: false,
      });

      expect(result.refusal).toBeNull();
      expect(result.added).toHaveLength(target - 2);
      // The state header itself moved — this is the real car count.
      expect(fake.sim.state[STATE.NUM_CARS]).toBe(target);
      expect(host.carCount()).toBe(target);
      expect(result.capacity).toBe(target);
      // Every new car got the team the registry already assigned that slot.
      const addedSlots = result.added.map((car) => car.slot);
      expect(addedSlots).toEqual(Array.from({ length: target - 2 }, (_, i) => i + 2));
      for (const car of result.added) {
        expect(car.team).toBe((car.slot % 2) as Team);
        expect(result.teams[car.slot]).toBe(car.team);
      }
      // Octane, the donor's default preset: `preset === 1` would be Dominus.
      expect(fake.addCalls.every((call) => call.preset === 0)).toBe(true);
    });
  }

  it("grows past the cap by reporting, never by throwing", () => {
    // The bridge refuses at 5 even though the ceiling is 8.
    const fake = makeFakeSim({ refuseAt: 5 });
    const host = createArenaGrowthHost(() => fake.sim, { report: quiet });

    const result = ensureArenaCapacity(host, 6, {
      teams: alternatingTeams(6),
      allowNativeReset: false,
    });

    expect(result.refusal?.kind).toBe("addCar-refused");
    expect(result.capacity).toBe(5);
    expect(result.ceiling).toBe(NATIVE_MAX_CARS);
    expect(fake.sim.state[STATE.NUM_CARS]).toBe(5);
    expect(host.carCount()).toBe(5);
  });

  it("stops at the configured ceiling and says so", () => {
    const fake = makeFakeSim();
    const host = createArenaGrowthHost(() => fake.sim, { report: quiet });

    const result = ensureArenaCapacity(host, 8, {
      teams: alternatingTeams(8),
      ceiling: 6,
      allowNativeReset: false,
    });

    expect(result.refusal?.kind).toBe("ceiling");
    expect(result.capacity).toBe(6);
    // Six cars is the product's ceiling; the bridge was never asked for more.
    expect(fake.addCalls).toHaveLength(4);
  });

  it("refuses at the native MAX_CARS of 8 and still reports the real count", () => {
    const fake = makeFakeSim();
    const host = createArenaGrowthHost(() => fake.sim, { report: quiet });

    const result = ensureArenaCapacity(host, 8, {
      teams: alternatingTeams(8),
      allowNativeReset: false,
    });
    expect(result.refusal).toBeNull();
    expect(host.carCount()).toBe(NATIVE_MAX_CARS);

    // A ninth car is refused without being asked for: the ceiling is the
    // bridge's own MAX_CARS, so growth stops before the call that would fail.
    const overflow = ensureArenaCapacity(host, 9, {
      teams: alternatingTeams(9),
      allowNativeReset: false,
    });
    expect(overflow.refusal?.kind).toBe("ceiling");
    expect(overflow.ceiling).toBe(NATIVE_MAX_CARS);
    expect(overflow.capacity).toBe(NATIVE_MAX_CARS);
    expect(host.carCount()).toBe(NATIVE_MAX_CARS);

    // And the bridge itself says no when it is asked directly past the cap.
    expect(host.addCar(0)).toBe(-1);
    expect(host.carCount()).toBe(NATIVE_MAX_CARS);
  });
});

describe("arena growth — a refusal cannot crash a live match", () => {
  it("survives a WASM trap from _physics_addCar", () => {
    const fake = makeFakeSim({ throwOnAdd: true });
    const report = vi.fn();
    const host = createArenaGrowthHost(() => fake.sim, { report });

    expect(() =>
      ensureArenaCapacity(host, 4, { teams: alternatingTeams(4), allowNativeReset: false }),
    ).not.toThrow();

    const result = ensureArenaCapacity(host, 4, {
      teams: alternatingTeams(4),
      allowNativeReset: false,
    });
    expect(result.refusal?.kind).toBe("addCar-refused");
    expect(result.added).toHaveLength(0);
    // The arena is untouched and the failure is visible, not swallowed.
    expect(host.carCount()).toBe(2);
    expect(report).toHaveBeenCalled();
    expect(host.lastFailure).toContain("addCar threw");
  });

  it("refuses an out-of-contract team before it reaches the bridge", () => {
    const fake = makeFakeSim();
    const host = createArenaGrowthHost(() => fake.sim, { report: quiet });

    // The bridge's own rule is team ∈ {0,1}; the host refuses it a step early.
    expect(host.addCar(2 as Team)).toBe(-1);
    expect(fake.addCalls).toHaveLength(0);
    expect(host.lastFailure).toContain("neither 0 nor 1");
  });

  it("reports no addCar at all instead of growing to nothing", () => {
    // The audit's F2 shape, reproduced: a sim with no growth capability.
    const sim = { state: new Float32Array(STATE_FLOATS), step: () => {} } as GrowthSim;
    const report = vi.fn();
    const host = createArenaGrowthHost(() => sim, { report });

    expect(host.available).toBe(false);
    expect(host.addCar(0)).toBe(-1);
    const result = ensureArenaCapacity(host, 4, {
      teams: alternatingTeams(4),
      allowNativeReset: false,
    });
    expect(result.refusal?.kind).toBe("no-addCar");
    expect(result.added).toHaveLength(0);
    expect(report).toHaveBeenCalled();
  });

  it("survives a sim whose state header cannot be read", () => {
    const broken = {
      get state(): Float32Array {
        throw new Error("detached wasm heap");
      },
      step: () => {},
    } as unknown as GrowthSim;
    const host = createArenaGrowthHost(() => broken, { report: quiet });

    expect(host.carCount()).toBe(0);
    expect(() => host.resetKickoff()).not.toThrow();
    expect(() =>
      ensureArenaCapacity(host, 4, { teams: alternatingTeams(4), allowNativeReset: false }),
    ).not.toThrow();
  });

  it("does not throw when there is no sim at all", () => {
    const host = createArenaGrowthHost(() => null, { report: quiet });
    expect(host.available).toBe(false);
    expect(host.carCount()).toBe(0);
    expect(host.addCar(0)).toBe(-1);
    expect(host.setCarState(0, new Array<number>(CAR_POSE_FLOATS).fill(1))).toBe(false);
    expect(host.writeSlotControls(0, {
      throttle: 1,
      steer: 0,
      pitch: 0,
      yaw: 0,
      roll: 0,
      jump: false,
      boost: false,
      handbrake: false,
    })).toBe(false);
  });
});

describe("arena growth — kickoff placement", () => {
  it("prefers the donor's own kickoff reset while the match has not started", () => {
    const fake = makeFakeSim();
    const host = createArenaGrowthHost(() => fake.sim, { report: quiet });

    const result = ensureArenaCapacity(host, 6, {
      teams: alternatingTeams(6),
      allowNativeReset: true,
    });

    expect(fake.resets).toBe(1);
    // The engine placed every car itself, so no host pose write was needed.
    expect(fake.writes).toHaveLength(0);
    expect(result.added.every((car) => car.placedBy === "native-reset")).toBe(true);
    expect(verifyKickoffSymmetry(alternatingTeams(6), fake.sim.state)).toBe(true);
  });

  it("mirrors the new cars off the donor's own spawns when no reset is allowed", () => {
    const fake = makeFakeSim();
    const host = createArenaGrowthHost(() => fake.sim, { report: quiet });

    const result = ensureArenaCapacity(host, 6, {
      teams: alternatingTeams(6),
      allowNativeReset: false,
    });

    expect(fake.resets).toBe(0);
    expect(result.symmetricKickoff).toBe(true);
    expect(verifyKickoffSymmetry(alternatingTeams(6), fake.sim.state)).toBe(true);

    // Each new car is the exact arena-end image of the spawn the engine placed.
    const written = new Map(fake.writes.map((write) => [write.slot, write.pose]));
    expect([...written.keys()].sort((a, b) => a - b)).toEqual([2, 3, 4, 5]);
    for (const [slot, pose] of written) {
      const partner = (slot % 2 === 0 ? slot + 1 : slot - 1) as number;
      expect(isMirroredPair(pose, written.get(partner) ?? [])).toBe(true);
    }
    // The cars the donor placed itself were never moved.
    const seeded = host.state;
    expect(seeded).toBeDefined();
    expect(fake.writes.some((write) => write.slot < 2)).toBe(false);
    // The 96-byte pose scratch is released, not leaked.
    expect(fake.freed.length).toBe(fake.writes.length);
  });

  it("leaves an unpaired car to the engine and reports the asymmetry", () => {
    // The donor creates ONE car (`startup.js:247`), so the first growth has no
    // counterpart to mirror. Without a native reset there is nothing to place
    // it from, and Phase 3 reports that instead of parking it on another car.
    const fake = makeFakeSim({ seeded: 1 });
    const host = createArenaGrowthHost(() => fake.sim, { report: quiet });

    const result = ensureArenaCapacity(host, 3, {
      teams: { 0: 0, 1: 1, 2: 0 },
      allowNativeReset: false,
    });

    expect(host.carCount()).toBe(3);
    expect(result.refusal).toBeNull();
    expect(result.symmetricKickoff).toBe(false);
    // Only the paired car was placed. Slot 2 has no counterpart, so nothing was
    // fabricated for it: it keeps the engine's own placement and the imbalance
    // is reported.
    expect(fake.writes.map((write) => write.slot)).toEqual([1]);
  });

  it("only allows the native reset while every car is still on its spawn", () => {
    const fake = makeFakeSim();
    const host = createArenaGrowthHost(() => fake.sim, { report: quiet });
    const opening = fake.sim.state.slice();

    expect(isStillAtKickoff(opening, fake.sim.state)).toBe(true);

    // One centimetre of drift is still "at kickoff"; a driven car is not.
    const nudged = fake.sim.state.slice();
    nudged[carBase(0)] += 0.5;
    expect(isStillAtKickoff(opening, nudged)).toBe(true);
    const driven = fake.sim.state.slice();
    driven[carBase(0)] += 50;
    expect(isStillAtKickoff(opening, driven)).toBe(false);

    // No snapshot, no native reset: be conservative, never rewind a live match.
    expect(isStillAtKickoff(null, fake.sim.state)).toBe(false);
    expect(isStillAtKickoff(opening, new Float32Array(STATE_FLOATS))).toBe(false);
  });
});

describe("arena growth — the capacity readout", () => {
  it("reports the sim state header's NUM_CARS, not a seat count", () => {
    const fake = makeFakeSim();
    const host = createArenaGrowthHost(() => fake.sim, { report: quiet });

    // This is exactly what `runtime.snapshot().carCount` reads.
    fake.sim.state[STATE.NUM_CARS] = 5;
    expect(host.carCount()).toBe(5);

    fake.sim.state[STATE.NUM_CARS] = 1;
    expect(host.carCount()).toBe(1);

    // A header of zero with cars still carrying poses is the header's story to
    // tell, and the readout must not invent a different number.
    fake.sim.state[STATE.NUM_CARS] = 0;
    expect(host.carCount()).toBe(0);
  });

  it("keeps the count in step with the cars the host actually added", () => {
    const fake = makeFakeSim();
    const host = createArenaGrowthHost(() => fake.sim, { report: quiet });

    ensureArenaCapacity(host, 4, { teams: alternatingTeams(4), allowNativeReset: true });

    expect(host.carCount()).toBe(4);
    expect(host.carCount()).toBe(fake.sim.state[STATE.NUM_CARS]);
    expect(verifyKickoffSymmetry(alternatingTeams(4), fake.sim.state)).toBe(true);
  });
});

describe("arena growth — driving the cars the donor never asks about", () => {
  it("writes a claimed slot's controls into the WASM controls block", () => {
    const fake = makeFakeSim();
    const host = createArenaGrowthHost(() => fake.sim, { report: quiet });
    ensureArenaCapacity(host, 4, { teams: alternatingTeams(4), allowNativeReset: true });

    // The donor only calls setControls for the two cars it made for itself
    // (startup.js:723, :753). Slot 3 is only drivable through the block.
    expect(
      host.writeSlotControls(3, {
        throttle: 0.5,
        steer: -1,
        pitch: 0,
        yaw: 0,
        roll: 0,
        jump: true,
        boost: true,
        handbrake: false,
      }),
    ).toBe(true);
    // ABI order (`native/network-state.cpp:15`): throttle steer pitch yaw roll
    // jump boost handbrake.
    expect(fake.controlsAt(3)).toEqual([0.5, -1, 0, 0, 0, 1, 1, 0]);
    // Slot 0 is untouched by a slot-3 write.
    expect(fake.controlsAt(0)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it("refuses a slot outside the bridge's range without writing", () => {
    const fake = makeFakeSim();
    const host = createArenaGrowthHost(() => fake.sim, { report: quiet });
    const neutral: CarControls = {
      throttle: 1,
      steer: 1,
      pitch: 1,
      yaw: 1,
      roll: 1,
      jump: true,
      boost: true,
      handbrake: true,
    };
    expect(host.writeSlotControls(NATIVE_MAX_CARS, neutral)).toBe(false);
    expect(host.writeSlotControls(-1, neutral)).toBe(false);
    expect(fake.controlsAt(0)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
  });
});
