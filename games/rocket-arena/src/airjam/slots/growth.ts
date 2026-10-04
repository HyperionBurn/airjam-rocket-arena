/**
 * Growing a live arena from the donor's default two cars up to the roster.
 *
 * ---------------------------------------------------------------------------
 * THE EXACT CALL PATH
 * ---------------------------------------------------------------------------
 *   growArena()
 *     → capability.addCar(team)                    (this module)
 *       → sim.addCar(team)                         (the host's own hook)
 *         → PhysicsSimulation.addCar(team)        (`physics/simulation.js:68-74`)
 *           → module._physics_addCar(team, preset) (the WASM export)
 *             → bridge.cpp addCar                 (`constexpr int MAX_CARS = 8`)
 *
 * `seam.ts:280-285` states the rule this module implements: the WASM export is
 * the ONLY supported way to grow the arena, it returns the new slot index, and
 * it returns a NEGATIVE value to refuse. `bridge.cpp` refuses in exactly two
 * cases: past `MAX_CARS = 8`, and a team that is not 0 or 1.
 *
 * ---------------------------------------------------------------------------
 * WHY REFUSAL IS A NORMAL OUTCOME
 * ---------------------------------------------------------------------------
 * A refusal means the arena is FULL or the team was invalid — both are ordinary
 * product states (six phones joined, someone asked for a seventh), not faults.
 * Throwing here would take down the match that is currently running fine. So
 * this module NEVER throws: it logs, stops growing, and reports the capacity it
 * actually reached. The host can then drop the extra players to the lobby.
 * A thrown error from inside the capability is caught the same way, because a
 * WASM trap must not kill the frame loop either.
 */

import { MAX_CARS } from "../seam.js";
import type { SimSeamHooks } from "../seam.js";
import { NATIVE_MAX_CARS, readCarCount } from "./donor-facts.js";
import { isMirroredPair, planKickoffPlacement } from "./kickoff.js";
import type { SlotTeams } from "./kickoff.js";
import type { Team } from "./team-balance.js";

/**
 * The narrow slice of the sim this module needs. Satisfied by `SimSeamHooks`
 * (`seam.ts:269-286`), which the host installs onto
 * `PhysicsSimulation.prototype` before `bootDonor()`.
 *
 * `addCar` is REQUIRED here (unlike on `SimSeamHooks`, where it is optional)
 * because growth is the whole point of this module: a sim that cannot add cars
 * is reported as a zero-capacity arena, not crashed on.
 */
export interface ArenaGrowthCapability {
  /** Total cars currently in the arena. */
  carCount?(): number;
  /** MUST delegate to `_physics_addCar`. Negative return = refusal. */
  addCar(team: Team): number;
  /** `_physics_resetKickoff(-1)`: the native all-cars kickoff reset. */
  resetKickoff?(): void;
  /** `_physics_setCarState(slot, pose24)` for a single car. */
  setCarState?(slot: number, pose: readonly number[]): boolean;
  /** The state buffer, used to read the donor's own spawn placements. */
  readonly state?: Float32Array;
}

/** One car added to the arena, and the team it was created on. */
export interface GrownCar {
  readonly slot: number;
  readonly team: Team;
  /** True when the native reset placed this car; false when we wrote a pose. */
  readonly placedBy: "native-reset" | "mirrored-pose" | "engine-default";
}

export interface GrowArenaResult {
  /** Cars the host asked for. */
  readonly requested: number;
  /** Cars the arena actually has now. The authoritative capacity reached. */
  readonly capacity: number;
  /** Cars added by this call. */
  readonly added: readonly GrownCar[];
  /** The native ceiling this process was allowed to reach. */
  readonly ceiling: number;
  /** Why growth stopped early, when it did. */
  readonly refusal: ArenaRefusal | null;
  /** Every car now in the arena, mapped to its team. */
  readonly teams: SlotTeams;
  /** True when kickoff spawns came out exactly mirrored. */
  readonly symmetricKickoff: boolean;
}

export type ArenaRefusal =
  | { readonly kind: "addCar-refused"; readonly detail: string }
  | { readonly kind: "addCar-threw"; readonly detail: string }
  | { readonly kind: "no-addCar"; readonly detail: string }
  | { readonly kind: "ceiling"; readonly detail: string };

/** Narrow an arbitrary result from a capability into a slot index, or null. */
const asSlot = (value: unknown): number | null =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null;

/**
 * Add cars until the arena holds `target`, or until the native bridge refuses.
 *
 * `teamOrder` is consumed round-robin so a batch of additions alternates sides
 * and cannot stack every new car on one team. When it runs dry the last team
 * is reused, which is what the registry's balancing has already made even.
 */
export const growArena = (
  capability: ArenaGrowthCapability,
  target: number,
  options: {
    /** Teams to hand to successive `addCar` calls. */
    readonly teamOrder?: readonly Team[];
    /** Ceiling to respect. Defaults to the donor's `MAX_CARS` (8). */
    readonly ceiling?: number;
    /**
     * Cars the arena already had, slot → team — normally
     * `registry.teamsBySlot()`. The kickoff plan is computed over the WHOLE
     * roster so a newly added car can be mirrored off a spawn the engine
     * actually placed, but only the newly added cars are ever written.
     */
    readonly existingTeams?: SlotTeams;
    /** Log sink; defaults to `console.warn`. Pass a no-op to silence. */
    readonly onRefusal?: (refusal: ArenaRefusal) => void;
  } = {},
): GrowArenaResult => {
  const ceiling = Math.min(options.ceiling ?? MAX_CARS, NATIVE_MAX_CARS);
  const wanted = Math.max(0, Math.floor(target));
  const teamOrder = options.teamOrder?.length ? options.teamOrder : ([0, 1] as const);
  const report = options.onRefusal ?? ((refusal: ArenaRefusal) => {
    console.warn(`[rocket-arena/slots] arena growth stopped — ${refusal.kind}: ${refusal.detail}`);
  });

  const currentCount = (): number => {
    if (typeof capability.carCount === "function") {
      const reported = capability.carCount();
      if (Number.isFinite(reported) && reported > 0) return Math.floor(reported);
    }
    if (capability.state) return readCarCount(capability.state);
    return 0;
  };

  const emptyResult = (refusal: ArenaRefusal | null): GrowArenaResult => ({
    requested: wanted,
    capacity: currentCount(),
    added: [],
    ceiling,
    refusal,
    teams: {},
    symmetricKickoff: true,
  });

  if (typeof capability.addCar !== "function") {
    const refusal: ArenaRefusal = {
      kind: "no-addCar",
      detail: "the sim exposes no addCar capability, so the arena cannot be grown",
    };
    report(refusal);
    return emptyResult(refusal);
  }

  const added: GrownCar[] = [];
  const teams: Record<number, Team> = {};
  let current = currentCount();
  let refusal: ArenaRefusal | null = null;
  let expected = current;

  for (let pass = 0; current < wanted; pass += 1) {
    if (expected >= ceiling) {
      refusal = {
        kind: "ceiling",
        detail: `reached the configured ceiling of ${ceiling} cars (requested ${wanted})`,
      };
      break;
    }
    const team: Team = teamOrder[pass % teamOrder.length];
    let raw: unknown;
    try {
      raw = capability.addCar(team);
    } catch (error) {
      // A WASM trap lands here. Same contract as a refusal: report, never throw.
      refusal = {
        kind: "addCar-threw",
        detail: error instanceof Error ? error.message : String(error),
      };
      break;
    }

    const slot = asSlot(raw);
    if (slot === null) {
      refusal = {
        kind: "addCar-refused",
        detail: `the native bridge refused team ${team} (returned ${String(raw)}); arena is at capacity`,
      };
      break;
    }
    if (slot !== expected) {
      // Not fatal — the bridge owns slot numbering — but the host's slot→team
      // map must not silently disagree, so it is reported.
      console.warn(
        `[rocket-arena/slots] addCar returned slot ${slot}, expected ${expected}; using the native index`,
      );
    }
    expected = slot + 1;
    current += 1;
    teams[slot] = team;
    added.push({ slot, team, placedBy: "engine-default" });
  }

  if (refusal) report(refusal);

  // --- Kickoff placement -------------------------------------------------
  // Preferred: the donor's own reset, which places every car natively.
  let placedBy: GrownCar["placedBy"] = "engine-default";
  let symmetric = added.length === 0;
  // Plan over the WHOLE roster, but only ever move the cars just added.
  const roster: Record<number, Team> = { ...(options.existingTeams ?? {}), ...teams };
  const addedSet = new Set(added.map((car) => car.slot));
  if (capability.state && (added.length > 0 || capability.resetKickoff)) {
    const view = { state: capability.state };
    symmetric = true;
    if (typeof capability.resetKickoff === "function") {
      try {
        capability.resetKickoff();
        placedBy = "native-reset";
        // Verify rather than assume: mirror the roster about the arena end and
        // confirm the donor agrees. A non-symmetric reset is reported, not hidden.
        const plan = planKickoffPlacement(roster, view);
        symmetric = plan.symmetric;
      } catch (error) {
        console.warn(
          `[rocket-arena/slots] resetKickoff failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    if (placedBy !== "native-reset" && typeof capability.setCarState === "function") {
      // Fallback: move each NEW car to the exact mirror of a spawn the engine
      // placed. Pre-existing cars are left exactly where the engine put them.
      const plan = planKickoffPlacement(roster, view);
      symmetric = plan.symmetric;
      placedBy = "mirrored-pose";
      for (const placement of plan.placements) {
        if (!placement.pose || !addedSet.has(placement.slot)) continue;
        try {
          if (capability.setCarState(placement.slot, placement.pose)) continue;
        } catch (error) {
          console.warn(
            `[rocket-arena/slots] setCarState(${placement.slot}) failed: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    }
  }

  const placed: GrownCar[] = added.map((car) => ({ ...car, placedBy }));
  return {
    requested: wanted,
    capacity: current,
    added: placed,
    ceiling,
    refusal,
    teams,
    symmetricKickoff: symmetric,
  };
};

/**
 * Re-check a placed roster for exact end-symmetry: every team-1 spawn must be
 * the arena-end image of the team-0 spawn at the same order-on-team. A car with
 * no counterpart, or a non-mirrored pair, makes this false.
 */
export const verifyKickoffSymmetry = (
  teams: SlotTeams,
  state: Float32Array,
): boolean => {
  const plan = planKickoffPlacement(teams, { state });
  if (!plan.symmetric) return false;
  const byTeam: [Map<number, number[]>, Map<number, number[]>] = [new Map(), new Map()];
  for (const placement of plan.placements) {
    if (!placement.pose) return false;
    byTeam[placement.team].set(placement.orderOnTeam, placement.pose);
  }
  for (const [order, pose] of byTeam[0]) {
    const counterpart = byTeam[1].get(order);
    if (!counterpart || !isMirroredPair(pose, counterpart)) return false;
  }
  return byTeam[0].size === byTeam[1].size;
};
