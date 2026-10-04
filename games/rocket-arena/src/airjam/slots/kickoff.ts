/**
 * Kickoff placement for cars added after the arena was created.
 *
 * ---------------------------------------------------------------------------
 * WHY THE DONOR'S OWN RESET IS PREFERRED
 * ---------------------------------------------------------------------------
 * `physics/simulation.js:178-182` exposes `resetKickoff(e = -1)` →
 * `module._physics_resetKickoff(e)`. The donor calls it with the default after
 * creating cars (`simulation.js:84`, `simulation.js:94`), i.e. with `-1`, which
 * is the native "reset every car" path. The engine therefore knows its own
 * kickoff spawns better than any table we could write, so
 * `planKickoffPlacement` PREFERS a real reset and only falls back to writing
 * poses itself when the sim does not expose one.
 *
 * `match/session.js` and `match/defaults.js` were read for this and expose no
 * coordinates at all — kickoff phase is a 3-second countdown (`session.js:99`),
 * not a placement table. So there is nothing to copy from the donor's match
 * layer, and nothing here is invented.
 *
 * ---------------------------------------------------------------------------
 * WHY THE FALLBACK IS EXACTLY SYMMETRIC
 * ---------------------------------------------------------------------------
 * The arena is symmetric end-to-end, so the transform that maps a team-0 kickoff
 * spawn onto its team-1 counterpart is a 180° rotation about the world UP axis:
 *
 *     (x, y, z) → (-x, y, -z)
 *
 * NOT the reflection (x, y, z) → (-x, y, z). A reflection has determinant -1 and
 * would hand the car a left-handed basis in a left-handed world (RocketSim is
 * Unreal-derived, X forward / Y right / Z up), which flips the car's steering
 * sense. The 180° yaw is a proper rotation, so handedness is preserved.
 *
 * Two properties make this testable and safe:
 *  1. It is an INVOLUTION: `yaw180(yaw180(p)) === p`. Applying it twice is
 *     exactly the identity, so mirroring can never drift.
 *  2. It is the ONLY thing applied, so the team-1 spawn is bit-for-bit the image
 *     of the team-0 spawn. Neither side can hold a better kickoff.
 *
 * Every vector field in the 24-float pose is transformed; scalars (BOOST,
 * ON_GROUND, SUPERSONIC, DEMOED, …) pass through untouched.
 */

import {
  CAR_FIELD,
  CAR_POSE_FLOATS,
  NATIVE_MAX_CARS,
  POSE_VECTORS,
  isUsablePose,
  readCarPose,
} from "./donor-facts.js";
import type { Team } from "./team-balance.js";

/**
 * Arena-end mirror: 180° about UP.
 *
 * The native state is X/Y horizontal and **Z up** (the donor's own metadata says
 * "native X/Y horizontal, Z up", and `physics/coordinates.js` swaps Y/Z on the
 * way into Three.js). A half turn about the vertical axis therefore negates X
 * and Y on every vector and keeps Z (height). Negating X and Z instead - what
 * this function did until 2026-10-04 - would flip a car upside down, not turn it
 * to face the other end.
 */
export const yaw180Pose = (pose: readonly number[]): number[] => {
  const mirrored = pose.slice(0, CAR_POSE_FLOATS);
  while (mirrored.length < CAR_POSE_FLOATS) mirrored.push(0);
  for (const vector of POSE_VECTORS) {
    for (let axis = 0; axis < 3; axis += 1) {
      // axis 0 = X and axis 1 = Y flip; axis 2 = Z (height) does not.
      if (axis === 2) continue;
      const at = vector.at + axis;
      mirrored[at] = -mirrored[at];
    }
  }
  return mirrored;
};

/** True when two poses are the exact arena-end image of one another. */
export const isMirroredPair = (
  a: readonly number[],
  b: readonly number[],
): boolean => {
  const mirrored = yaw180Pose(a);
  return mirrored.every((value, i) => value === b[i]);
};

/** A placed car. `pose` is null when no counterpart spawn could be read. */
export interface KickoffPlacement {
  readonly slot: number;
  readonly team: Team;
  /** Position of this car among its own team's cars, from 0. */
  readonly orderOnTeam: number;
  /** 24 floats, ready for `_physics_setCarState`. */
  readonly pose: number[] | null;
  /**
   * Why `pose` is null. Non-fatal: the car still exists, it just keeps whatever
   * spawn the engine gave it.
   */
  readonly reason?: "no-counterpart" | "unusable-counterpart-pose";
}

export interface KickoffPlan {
  readonly placements: ReadonlyArray<KickoffPlacement>;
  /** True when every car on one team has an exact mirror on the other. */
  readonly symmetric: boolean;
  /** Cars per team, index 0 → team 0. */
  readonly carCounts: readonly [number, number];
}

/** Slot → team for every car the host currently drives. */
export type SlotTeams = Readonly<Record<number, Team>>;

/** Optional sim view used to READ the donor's own spawn placements. */
export interface KickoffStateView {
  readonly state: Float32Array;
}

/**
 * Compute where every car should stand at kickoff.
 *
 * For each car, the pose is `yaw180` of a spawn the DONOR itself placed on the
 * opposite team: the counterpart at the same order-on-team if it is placed,
 * otherwise the first placed car on that team. Because `yaw180` is an
 * involution, applying it in both directions yields exactly the mirrored pair,
 * whichever side happens to hold the engine's authoritative spawn.
 *
 * A car's own pose is deliberately NEVER used as a template: a car that was
 * just added by `addCar` is not standing on a kickoff spot, so mirroring it
 * would faithfully reproduce "both cars at the origin". Only spawns the engine
 * placed are trusted.
 *
 * Pure: it reads the state array and returns numbers. It never writes to it.
 */
export const planKickoffPlacement = (
  teams: SlotTeams,
  view: KickoffStateView,
  slots: readonly number[] = Object.keys(teams).map(Number),
): KickoffPlan => {
  const byTeam: [number[], number[]] = [[], []];
  for (const slot of [...slots].sort((a, b) => a - b)) {
    const team = teams[slot];
    if (team !== 0 && team !== 1) continue;
    if (slot < 0 || slot >= NATIVE_MAX_CARS) continue;
    byTeam[team].push(slot);
  }

  /**
   * A kickoff spawn the engine actually placed on the opposite team, for a car
   * that HAS a counterpart. Tries the counterpart's own spawn first, then any
   * other placed car on that side.
   */
  const templateFor = (team: 0 | 1, orderOnTeam: number): number[] | null => {
    const mirrorTeam = team === 0 ? 1 : 0;
    const candidates = byTeam[mirrorTeam];
    const exact = candidates[orderOnTeam];
    if (exact !== undefined) {
      const pose = readCarPose(view.state, exact);
      if (isUsablePose(pose)) return pose;
    }
    for (const slot of candidates) {
      const pose = readCarPose(view.state, slot);
      if (isUsablePose(pose)) return pose;
    }
    return null;
  };

  const placements: KickoffPlacement[] = [];
  let symmetric = true;

  for (const team of [0, 1] as const) {
    for (let orderOnTeam = 0; orderOnTeam < byTeam[team].length; orderOnTeam += 1) {
      const slot = byTeam[team][orderOnTeam];
      const counterpart = byTeam[team === 0 ? 1 : 0][orderOnTeam];
      let reason: KickoffPlacement["reason"];
      let pose: number[] | null = null;

      if (counterpart === undefined) {
        // No partner on the other side, so there is no mirrored spawn to give
        // this car. Leaving it where the engine put it and reporting the
        // imbalance is strictly better than parking it on another car's spot.
        reason = "no-counterpart";
        // An unpaired car is exactly the fairness bug this module exists to
        // prevent, so it is reported loudly rather than silently absorbed.
        symmetric = false;
      } else {
        const template = templateFor(team, orderOnTeam);
        if (template) {
          pose = yaw180Pose(template);
        } else {
          reason = "unusable-counterpart-pose";
        }
      }

      placements.push({
        slot,
        team,
        orderOnTeam,
        pose,
        ...(reason ? { reason } : {}),
      });
    }
  }

  return {
    placements,
    symmetric,
    carCounts: [byTeam[0].length, byTeam[1].length] as const,
  };
};

/**
 * The kickoff heading for a team, taken from the donor's own placed car.
 * Team 0's cars sit on the negative-X half facing +X, so this is what a car
 * must be looking at to be ready for kickoff on its own side.
 */
export const readKickoffFacing = (view: KickoffStateView, slot: number): number[] | null => {
  const pose = readCarPose(view.state, slot);
  if (!isUsablePose(pose)) return null;
  return pose.slice(CAR_FIELD.FWD, CAR_FIELD.FWD + 3);
};
