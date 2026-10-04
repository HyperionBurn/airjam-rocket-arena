import { describe, expect, it, vi } from "vitest";

import { MAX_CARS } from "../../seam.js";
import { NATIVE_MAX_CARS } from "../donor-facts.js";
import { growArena, verifyKickoffSymmetry } from "../growth.js";
import type { ArenaGrowthCapability, ArenaRefusal } from "../growth.js";
import { isMirroredPair } from "../kickoff.js";
import { putCarPose } from "./fakes.js";

/**
 * A stand-in for the donor's arena that mirrors the real `bridge.cpp`
 * contract: `addCar` returns the new slot index, and REFUSES with a negative
 * value once `MAX_CARS` is reached. `addRefusals` lets a test make it refuse
 * early, which is how a bad team or a half-initialised WASM heap behaves.
 *
 * `state` is non-optional here (the interface has it optional) so a test can
 * write kickoff poses into it without a non-null assertion at every call.
 */
interface TestArena extends ArenaGrowthCapability {
  readonly state: Float32Array;
  readonly calls: number[];
}

const makeArena = (initial = 2, addRefusals = 0): TestArena => {
  const state = new Float32Array(510);
  state[2] = initial;
  const calls: number[] = [];
  let count = initial;
  let refusals = addRefusals;
  return {
    calls,
    state,
    carCount: () => count,
    addCar(team) {
      calls.push(team);
      if (refusals > 0) {
        refusals -= 1;
        return -1; // bridge.cpp refusal
      }
      if (count >= NATIVE_MAX_CARS) return -1; // MAX_CARS ceiling
      const slot = count;
      count += 1;
      return slot;
    },
  };
};

const quiet = (): ((refusal: ArenaRefusal) => void) => vi.fn();

/** A `setCarState` spy typed to the capability's real signature. */
const setCarStateSpy = () =>
  vi.fn((_slot: number, _pose: readonly number[]): boolean => true);

describe("growArena — the happy path", () => {
  it("adds cars up to the roster and reports the capacity reached", () => {
    const arena = makeArena(2);
    const result = growArena(arena, 4, { onRefusal: quiet() });

    expect(result.added.map((car) => car.slot)).toEqual([2, 3]);
    expect(result.added.map((car) => car.team)).toEqual([0, 1]); // round-robin
    expect(result.capacity).toBe(4);
    expect(result.requested).toBe(4);
    expect(result.ceiling).toBe(MAX_CARS);
    expect(result.refusal).toBeNull();
    expect(arena.calls).toEqual([0, 1]);
  });

  it("grows 2 → 6 cars, the product's four-player-plus target", () => {
    const result = growArena(makeArena(2), 6, { onRefusal: quiet() });
    expect(result.added).toHaveLength(4);
    expect(result.capacity).toBe(6);
  });

  it("does nothing when the arena is already big enough", () => {
    const arena = makeArena(4);
    const result = growArena(arena, 4, { onRefusal: quiet() });
    expect(result.added).toHaveLength(0);
    expect(result.capacity).toBe(4);
    expect(arena.calls).toEqual([]);
  });
});

describe("growArena — refusal is an expected outcome, never a throw", () => {
  it("survives a negative return and reports the capacity it actually reached", () => {
    const arena = makeArena(2, 1); // first addCar refuses
    const onRefusal = quiet();

    let result!: ReturnType<typeof growArena>;
    expect(() => {
      result = growArena(arena, 4, { onRefusal });
    }).not.toThrow();

    expect(result.added).toHaveLength(0);
    expect(result.capacity).toBe(2); // the real capacity, not the wish
    expect(result.requested).toBe(4);
    expect(result.refusal?.kind).toBe("addCar-refused");
    expect(onRefusal).toHaveBeenCalledOnce();
  });

  it("keeps the cars it did add when a later call refuses", () => {
    // Refuse the SECOND attempt: one car lands, then the arena says no.
    const arena = makeArena(2, 0);
    let attempts = 0;
    const original = arena.addCar.bind(arena);
    arena.addCar = (team) => {
      attempts += 1;
      return attempts === 2 ? -1 : original(team);
    };

    const result = growArena(arena, 4, { onRefusal: quiet() });
    expect(result.added.map((car) => car.slot)).toEqual([2]);
    expect(result.capacity).toBe(3);
    expect(result.refusal?.kind).toBe("addCar-refused");
  });

  it("catches a WASM trap thrown out of addCar instead of killing the frame", () => {
    const arena = makeArena(2);
    arena.addCar = () => {
      throw new Error("RuntimeError: unreachable executed");
    };
    const onRefusal = quiet();

    let result!: ReturnType<typeof growArena>;
    expect(() => {
      result = growArena(arena, 4, { onRefusal });
    }).not.toThrow();

    expect(result.capacity).toBe(2);
    expect(result.refusal?.kind).toBe("addCar-threw");
    expect(result.refusal?.detail).toContain("unreachable");
  });

  it("stops at the donor's MAX_CARS of 8 and says why", () => {
    const arena = makeArena(8);
    const result = growArena(arena, 12, { onRefusal: quiet() });

    expect(result.added).toHaveLength(0);
    expect(result.capacity).toBe(8);
    expect(result.refusal?.kind).toBe("ceiling");
    expect(result.ceiling).toBe(NATIVE_MAX_CARS);
  });

  it("stops early when the host caps growth below the native ceiling", () => {
    const arena = makeArena(2);
    const result = growArena(arena, 6, { ceiling: 4, onRefusal: quiet() });
    expect(result.added.map((car) => car.slot)).toEqual([2, 3]);
    expect(result.refusal?.kind).toBe("ceiling");
    expect(result.ceiling).toBe(4);
  });

  it("treats a missing addCar as zero capacity rather than crashing", () => {
    const onRefusal = quiet();
    const result = growArena({ carCount: () => 2 } as ArenaGrowthCapability, 4, {
      onRefusal,
    });
    expect(result.added).toHaveLength(0);
    expect(result.refusal?.kind).toBe("no-addCar");
  });
});

describe("growArena — kickoff placement", () => {
  it("prefers the donor's own native reset when the sim exposes one", () => {
    const arena = makeArena(2);
    const resetKickoff = vi.fn();
    const setCarState = vi.fn(() => true);

    const result = growArena(
      { ...arena, resetKickoff, setCarState },
      4,
      { onRefusal: quiet() },
    );

    expect(resetKickoff).toHaveBeenCalledOnce();
    // The native reset is authoritative; we must not also write poses over it.
    expect(setCarState).not.toHaveBeenCalled();
    expect(result.added.every((car) => car.placedBy === "native-reset")).toBe(true);
  });

  it("falls back to writing mirrored poses when no native reset exists", () => {
    const arena = makeArena(2);
    // The two pre-existing cars are standing on real kickoff spawns (a
    // mirrored pair); the two new ones have not been placed yet.
    putCarPose(arena.state, 0, -2500, 300, 1);
    putCarPose(arena.state, 1, 2500, -300, -1);
    putCarPose(arena.state, 2, -2500, -300, 1);
    putCarPose(arena.state, 3, 2500, 300, -1);

    const setCarState = setCarStateSpy();
    const result = growArena(
      { ...arena, setCarState },
      4,
      { onRefusal: quiet(), existingTeams: { 0: 0, 1: 1 } },
    );

    // Only the two NEW cars were moved; the engine's own cars were left alone.
    expect(setCarState).toHaveBeenCalledTimes(2);
    const written = new Map(
      setCarState.mock.calls.map(([slot, pose]) => [slot, pose] as const),
    );
    // Each new car lands on the arena-end image of the other's spawn, which for
    // this already-correct pair means its own kickoff spot is preserved.
    expect(written.get(2)![0]).toBe(-2500);
    expect(written.get(2)![1]).toBe(-300);
    expect(written.get(3)![0]).toBe(2500);
    expect(written.get(3)![1]).toBe(300);
    expect(isMirroredPair(written.get(2)!, written.get(3)!)).toBe(true);
    expect(result.added.every((car) => car.placedBy === "mirrored-pose")).toBe(true);
    expect(result.symmetricKickoff).toBe(true);
  });

  it("keeps growing when the native reset throws", () => {
    const arena = makeArena(2);
    const result = growArena(
      {
        ...arena,
        resetKickoff: () => {
          throw new Error("abort() called");
        },
      },
      4,
      { onRefusal: quiet() },
    );
    expect(result.added.map((car) => car.slot)).toEqual([2, 3]);
    expect(result.capacity).toBe(4);
  });
});

describe("verifyKickoffSymmetry", () => {
  it("accepts a perfectly mirrored roster", () => {
    const state = new Float32Array(510);
    putCarPose(state, 0, -2500, 300, 1);
    putCarPose(state, 1, 2500, -300, -1);
    putCarPose(state, 2, -2500, -300, 1);
    putCarPose(state, 3, 2500, 300, -1);
    expect(verifyKickoffSymmetry({ 0: 0, 1: 1, 2: 0, 3: 1 }, state)).toBe(true);
  });

  it("rejects a roster where one team has a car to itself", () => {
    const state = new Float32Array(510);
    putCarPose(state, 0, -2500, 300, 1);
    putCarPose(state, 1, 2500, -300, -1);
    // Three cars, 2v1: the extra car has no mirror partner.
    expect(verifyKickoffSymmetry({ 0: 0, 1: 1, 2: 0 }, state)).toBe(false);
  });

  it("rejects a roster whose pairs are not actually mirrored", () => {
    const state = new Float32Array(510);
    putCarPose(state, 0, -2500, 300, 1);
    putCarPose(state, 1, 2500, 300, -1); // same Z, not mirrored
    expect(verifyKickoffSymmetry({ 0: 0, 1: 1 }, state)).toBe(false);
  });
});
