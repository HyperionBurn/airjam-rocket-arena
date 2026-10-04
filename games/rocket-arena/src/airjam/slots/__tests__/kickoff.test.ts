import { describe, expect, it } from "vitest";

import { CAR_POSE_FLOATS, isUsablePose } from "../donor-facts.js";
import {
  isMirroredPair,
  planKickoffPlacement,
  readKickoffFacing,
  yaw180Pose,
} from "../kickoff.js";
import { distinctPose, putCarPose } from "./fakes.js";

/**
 * The fairness invariant: a team-1 kickoff spawn is the EXACT arena-end image
 * of its team-0 counterpart. `yaw180Pose` is a 180° rotation about world UP.
 * The native state is X/Y horizontal and Z up, so it negates X and Y on every
 * vector and keeps Z (height) — a proper rotation, which preserves the car's
 * handedness (a plain X reflection would not).
 */
describe("yaw180Pose — the arena-end mirror", () => {
  it("negates X and Y and keeps height (native Z)", () => {
    const pose = new Array<number>(CAR_POSE_FLOATS).fill(0);
    pose[0] = 2500; // POS.x
    pose[1] = -300; // POS.y
    pose[2] = 17; // POS.z — height, must not flip
    pose[3] = -1; // FWD.x
    pose[4] = 0.5; // FWD.y
    pose[5] = 0.25; // FWD.z (nose pitched up) must keep its sign

    const mirrored = yaw180Pose(pose);
    expect(mirrored[0]).toBe(-2500);
    expect(mirrored[1]).toBe(300);
    expect(mirrored[2]).toBe(17);
    expect(mirrored[3]).toBe(1);
    expect(mirrored[4]).toBe(-0.5);
    expect(mirrored[5]).toBe(0.25);
  });

  it("does not turn a car upside down (the old X/Z mirror did)", () => {
    const pose = new Array<number>(CAR_POSE_FLOATS).fill(0);
    pose[11] = 1; // UP.z — a car sitting upright
    expect(yaw180Pose(pose)[11]).toBe(1);
  });

  it("leaves the scalar fields alone", () => {
    const pose = distinctPose(1);
    const mirrored = yaw180Pose(pose);
    expect(mirrored[18]).toBe(pose[18]); // BOOST
    expect(mirrored[19]).toBe(pose[19]); // ON_GROUND
    expect(mirrored[20]).toBe(pose[20]); // SUPERSONIC
    expect(mirrored[21]).toBe(pose[21]); // DEMOED
  });

  it("is an involution, so mirroring can never drift", () => {
    const pose = distinctPose(7);
    expect(yaw180Pose(yaw180Pose(pose))).toEqual(pose);
  });

  it("always produces a length-24 pose", () => {
    expect(yaw180Pose([])).toHaveLength(CAR_POSE_FLOATS);
    expect(yaw180Pose(distinctPose(3))).toHaveLength(CAR_POSE_FLOATS);
  });

  it("turns a car into its mirror partner both ways", () => {
    const a = distinctPose(1);
    const b = distinctPose(2);
    expect(isMirroredPair(a, yaw180Pose(a))).toBe(true);
    expect(isMirroredPair(yaw180Pose(a), a)).toBe(true);
    expect(isMirroredPair(a, b)).toBe(false);
  });
});

describe("planKickoffPlacement — mirrored roster", () => {
  it("mirrors every team-1 spawn off its team-0 counterpart", () => {
    const state = new Float32Array(510);
    putCarPose(state, 0, -2500, 300, 1);
    putCarPose(state, 1, 2500, -300, -1);
    putCarPose(state, 2, -2500, -300, 1);
    putCarPose(state, 3, 2500, 300, -1);

    const plan = planKickoffPlacement(
      { 0: 0, 1: 1, 2: 0, 3: 1 },
      { state },
      [0, 1, 2, 3],
    );

    expect(plan.symmetric).toBe(true);
    expect(plan.carCounts).toEqual([2, 2]);

    const bySlot = new Map(plan.placements.map((p) => [p.slot, p]));
    // Order on team 0 maps to the same order on team 1.
    expect(isMirroredPair(bySlot.get(0)!.pose!, bySlot.get(1)!.pose!)).toBe(true);
    expect(isMirroredPair(bySlot.get(2)!.pose!, bySlot.get(3)!.pose!)).toBe(true);
    expect(bySlot.get(1)!.pose![0]).toBe(2500);
    expect(bySlot.get(1)!.pose![1]).toBe(-300);
    expect(bySlot.get(1)!.orderOnTeam).toBe(0);
    expect(bySlot.get(3)!.orderOnTeam).toBe(1);
  });

  it("keeps a 3-human 2v2 roster mirrored, bot seat included", () => {
    const state = new Float32Array(510);
    putCarPose(state, 0, -2500, 300, 1);
    putCarPose(state, 1, 2500, -300, -1);
    putCarPose(state, 2, -2500, -300, 1);
    putCarPose(state, 3, 2500, 300, -1);

    const plan = planKickoffPlacement({ 0: 0, 1: 1, 2: 0, 3: 1 }, { state });
    expect(plan.carCounts).toEqual([2, 2]);
    expect(plan.symmetric).toBe(true);
    expect(plan.placements.every((placement) => placement.pose !== null)).toBe(true);
  });

  it("flags an unpaired car instead of quietly letting one side win kickoff", () => {
    const state = new Float32Array(510);
    putCarPose(state, 0, -2500, 300, 1);
    putCarPose(state, 1, 2500, -300, -1);
    putCarPose(state, 2, -2500, -300, 1); // team 0's extra car

    const plan = planKickoffPlacement({ 0: 0, 1: 1, 2: 0 }, { state });

    expect(plan.symmetric).toBe(false);
    const unpaired = plan.placements.find((p) => p.slot === 2)!;
    expect(unpaired.pose).toBeNull();
    expect(unpaired.reason).toBe("no-counterpart");
  });

  it("reports a counterpart whose pose is unusable rather than mirroring zeros", () => {
    const state = new Float32Array(510);
    putCarPose(state, 0, -2500, 300, 1);
    // Slot 1 is in the roster but the engine never placed it, so there is no
    // kickoff spawn to mirror and the planner must say so instead of emitting
    // a pose of zeros.
    const plan = planKickoffPlacement({ 0: 0, 1: 1 }, { state });

    const unplaceable = plan.placements.find((p) => p.slot === 0)!;
    expect(unplaceable.pose).toBeNull();
    expect(unplaceable.reason).toBe("unusable-counterpart-pose");
    // The roster is still structurally even — that is what `symmetric` reports —
    // but this car could not be placed, which is the `reason`.
    expect(plan.symmetric).toBe(true);
    // The other car could be placed, off the one spawn the engine did set.
    const placeable = plan.placements.find((p) => p.slot === 1)!;
    expect(placeable.pose).not.toBeNull();
    expect(placeable.pose![0]).toBe(2500);
    expect(isUsablePose(new Array<number>(24).fill(0))).toBe(false);
  });

  it("ignores slots outside the donor's 8-car arena", () => {
    const state = new Float32Array(510);
    putCarPose(state, 0, -2500, 300, 1);
    putCarPose(state, 1, 2500, -300, -1);
    const plan = planKickoffPlacement({ 0: 0, 1: 1, 99: 0 }, { state });
    expect(plan.placements.map((p) => p.slot).sort((a, b) => a - b)).toEqual([0, 1]);
  });

  it("does not mutate the state buffer it reads", () => {
    const state = new Float32Array(510);
    putCarPose(state, 0, -2500, 300, 1);
    putCarPose(state, 1, 2500, -300, -1);
    const before = state.slice();

    planKickoffPlacement({ 0: 0, 1: 1 }, { state });

    expect(state).toEqual(before);
  });
});

describe("readKickoffFacing", () => {
  it("reads the donor's own forward vector for a placed car", () => {
    const state = new Float32Array(510);
    putCarPose(state, 0, -2500, 300, 1);
    expect(readKickoffFacing({ state }, 0)).toEqual([1, 0, 0]);
  });

  it("returns null for a car the engine has not placed", () => {
    expect(readKickoffFacing({ state: new Float32Array(510) }, 0)).toBeNull();
  });
});
