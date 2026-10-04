/**
 * Air Jam player → car slot registry. Implements `CarSlotRegistry` from
 * `seam.ts:177-190`.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS EXISTS
 * ---------------------------------------------------------------------------
 * `seam.ts:36-37`: Air Jam players are strings with their own lifecycle
 * (join/leave/reconnect), while the sim knows only integer car slots. This
 * module owns that mapping, and it is the ONLY owner — the input worker
 * implements `CarInputSource` and hands it over, it does not allocate slots.
 *
 * The donor needs no change for this: `physics/simulation.js:138-152` writes
 * `setControls(e, t)` at `e * CONTROL_KEYS` (8 floats per slot, `kf = 8`), so
 * four players are four calls with four different control objects. Fan-out is
 * already per-slot; the donor only ever drives slot 0 itself
 * (`app/startup.js` feeds the donor's own keyboard/gamepad into one car).
 *
 * ---------------------------------------------------------------------------
 * SLOT PERSISTENCE IS A PRODUCT REQUIREMENT, NOT AN OPTIMISATION
 * ---------------------------------------------------------------------------
 * A phone that drops its connection and comes back must land in the car it
 * had, because the player has muscle memory for it and because re-assigning
 * would swap which goal they are attacking mid-match. Two mechanisms:
 *  1. Re-claiming a slot you still hold is a no-op that returns the same slot.
 *  2. A released slot is RETAINED for its previous owner, and re-claim prefers
 *     it. Retention is best-effort: if another player has already taken the
 *     slot, the returning player gets a fresh one. Retention is bounded so a
 *     long match cannot leak it.
 *
 * ---------------------------------------------------------------------------
 * NEUTRALIZATION REACHES BOTH SIDES
 * ---------------------------------------------------------------------------
 * `seam.ts:151-174` gives every source a `neutralize(reason)`, and
 * `seam.ts:107-116` gives one canonical all-zero control object. Dropping only
 * the source is not enough: the sim's control buffer for that slot still holds
 * the last level until something writes to it again. So every neutralization
 * here also pushes `NEUTRAL_CONTROLS` to the sim for that slot, which is what
 * guarantees no car is left boosting after a blur.
 */

import { MAX_CARS, NEUTRAL_CONTROLS, sanitizeControls } from "../seam.js";
import type {
  CarControls,
  CarInputSource,
  CarSlotRegistry,
  NeutralizeReason,
  PortedSim,
} from "../seam.js";
import { NATIVE_MAX_CARS } from "./donor-facts.js";
import { balanceTeamFor, otherTeam, planRoster, teamSizesOf } from "./team-balance.js";
import type { Team } from "./team-balance.js";

/** One live binding: who drives what. */
export interface SlotEntry {
  readonly playerId: string;
  readonly slot: number;
  readonly team: Team;
  readonly source: CarInputSource;
}

export interface LiveSlot {
  readonly slot: number;
  readonly team: Team;
  /** False for a bot seat — nobody on a phone is driving it. */
  readonly controlled: boolean;
  readonly source: CarInputSource | null;
}

export interface CarSlotRegistryOptions {
  /**
   * Ceiling on cars. Defaults to the donor's `MAX_CARS` (8). Clamped to it.
   */
  readonly maxCars?: number;
  /**
   * Builds the input source for a claimed slot. Supplied by the host, which
   * owns the input worker — this module never imports an input implementation,
   * so the dependency stays one-directional (slots → seam ← input).
   */
  readonly createSource: (playerId: string, slot: number, team: Team) => CarInputSource;
  /**
   * The sim, so neutralization can reach the control buffer. Optional so the
   * registry is testable with a fake; when absent, only the sources are
   * neutralized.
   */
  readonly sim?: PortedSim;
  /** Team used to break an exact size tie. Defaults to 0. */
  readonly preferredTeam?: Team;
  /** How many released slots stay reserved for their old owner. Default 4. */
  readonly retainSlots?: number;
}

/**
 * A registry that also lets the host reserve a seat for a bot and inspect the
 * free pool. These are additions to the seam interface, not changes to it.
 */
export interface ManagedCarSlotRegistry extends CarSlotRegistry {
  /** Reserve a seat on `team` for a bot. Returns the slot, or null when full. */
  addBotSeat(team: Team): number | null;
  /** Slot → team for every car the host drives, humans and bots alike. */
  teamsBySlot(): Readonly<Record<number, Team>>;
  /** Slots that are free, lowest first. */
  freeSlots(): readonly number[];
  /** Neutralize and drop every binding, human and bot. Full teardown. */
  clear(reason: NeutralizeReason): void;
  /** Slot `playerId` last held, even after release. -1 when never held. */
  lastSlotOf(playerId: string): number;
  /**
   * Forget every remembered slot. Retention is what lets a reconnecting player
   * get their old car back, but it also makes `claim` skip free low slots; a
   * host that re-seats everyone in a chosen order calls this first so the new
   * seating comes out dense (slot i === the i-th seat).
   */
  forgetRetained(): void;
}

const clampMax = (maxCars: number | undefined): number => {
  const requested = Math.floor(maxCars ?? MAX_CARS);
  if (!Number.isFinite(requested) || requested < 0) return 0;
  return Math.min(requested, NATIVE_MAX_CARS);
};

/**
 * Build the registry. Closure state, no class, so a test can build as many
 * independent registries as it likes with no shared module-level state.
 */
export const createCarSlotRegistry = (
  options: CarSlotRegistryOptions,
): ManagedCarSlotRegistry => {
  const maxCars = clampMax(options.maxCars);
  const preferred = options.preferredTeam === 1 ? 1 : 0;
  const retainLimit = Math.max(0, Math.floor(options.retainSlots ?? 4));
  const sim = options.sim;

  /** playerId → live binding. */
  const bindings = new Map<string, SlotEntry>();
  /** slot → live binding. Inverse of `bindings`; kept in sync explicitly. */
  const bySlot = new Map<number, SlotEntry>();
  /** slot → team for bot seats and reserved slots. */
  const seatTeams = new Map<number, Team>();
  /** playerId → last slot held, kept across release for reconnect. */
  const retained = new Map<string, number>();

  const takenSlots = (): ReadonlySet<number> => new Set([...bySlot.keys(), ...seatTeams.keys()]);

  const freeSlot = (): number | null => {
    const taken = takenSlots();
    for (let slot = 0; slot < maxCars; slot += 1) {
      if (!taken.has(slot)) return slot;
    }
    return null;
  };

  const sizes = (): readonly [number, number] =>
    teamSizesOf([...bySlot.values()].map((entry) => entry.team));

  /**
   * Drop a car's controls to zero in BOTH places: the source stops producing
   * them, and the sim's control buffer for that slot is overwritten so a
   * swallowed event can never leave a car stuck on the throttle.
   */
  const neutralizeSlot = (slot: number, source: CarInputSource | null, reason: NeutralizeReason) => {
    if (source) source.neutralize(reason);
    if (sim) {
      try {
        sim.setControls(slot, NEUTRAL_CONTROLS);
      } catch (error) {
        console.warn(
          `[rocket-arena/slots] could not neutralize slot ${slot}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  };

  const remember = (playerId: string, slot: number) => {
    retained.delete(playerId);
    retained.set(playerId, slot);
    while (retained.size > retainLimit) {
      const oldest = retained.keys().next();
      if (oldest.done) break;
      retained.delete(oldest.value);
    }
  };

  return {
    /**
     * Assign a player to a car. Returns null when the arena is full, which is a
     * normal state (the host sends the player back to the lobby) and not an
     * error.
     */
    claim(playerId: string, team?: 0 | 1, wantedSlot?: number): number | null {
      // (1) Already holding a slot: a reconnect must never move a car. The
      // source is deliberately left alone — re-arming it after a disconnect is
      // the input worker's call, and neutralizing here would strand the car.
      const held = bindings.get(playerId);
      if (held) return held.slot;

      // (2) A specific slot was asked for (a late joiner taking over a bot's
      // car): it is that slot or nothing.
      // (3) Otherwise prefer the slot this player last held, if it is still free.
      const previous = retained.get(playerId);
      const previousFree = previous !== undefined && !takenSlots().has(previous);
      let slot: number | null;
      if (wantedSlot !== undefined) {
        const valid = Number.isInteger(wantedSlot) && wantedSlot >= 0 && wantedSlot < maxCars;
        slot = valid && !takenSlots().has(wantedSlot) ? wantedSlot : null;
      } else {
        slot = previousFree ? (previous as number) : freeSlot();
      }
      if (slot === null) return null;

      const requested = team === 0 || team === 1 ? team : undefined;
      const assigned: Team = requested ?? balanceTeamFor(sizes(), preferred);
      const source = options.createSource(playerId, slot, assigned);

      const entry: SlotEntry = { playerId, slot, team: assigned, source };
      bindings.set(playerId, entry);
      bySlot.set(slot, entry);
      seatTeams.delete(slot);
      remember(playerId, slot);
      return slot;
    },

    /** Neutralize first, THEN free — the car must never keep its last input. */
    release(playerId: string): void {
      const entry = bindings.get(playerId);
      if (!entry) return;
      bindings.delete(playerId);
      bySlot.delete(entry.slot);
      seatTeams.delete(entry.slot);
      remember(playerId, entry.slot);
      neutralizeSlot(entry.slot, entry.source, "released");
    },

    slotOf(playerId: string): number | null {
      return bindings.get(playerId)?.slot ?? null;
    },

    entries(): ReadonlyArray<SlotEntry> {
      return [...bindings.values()].sort((a, b) => a.slot - b.slot);
    },

    liveSlots(): ReadonlyArray<LiveSlot> {
      const live: LiveSlot[] = [];
      for (const [slot, team] of seatTeams) live.push({ slot, team, controlled: false, source: null });
      for (const entry of this.entries()) {
        live.push({ slot: entry.slot, team: entry.team, controlled: true, source: entry.source });
      }
      return live.sort((a, b) => a.slot - b.slot);
    },

    /**
     * Neutralize EVERY car. Called on blur, on disconnect and on teardown.
     * Idempotent, and it reaches bot seats too — a bot seat has no source, but
     * its control buffer still has to be zeroed.
     */
    neutralizeAll(reason: NeutralizeReason): void {
      for (const entry of this.entries()) {
        neutralizeSlot(entry.slot, entry.source, reason);
      }
      for (const slot of seatTeams.keys()) {
        if (sim) neutralizeSlot(slot, null, reason);
      }
    },

    addBotSeat(team: Team): number | null {
      const slot = freeSlot();
      if (slot === null) return null;
      seatTeams.set(slot, team);
      return slot;
    },

    teamsBySlot(): Readonly<Record<number, Team>> {
      const map: Record<number, Team> = {};
      for (const [slot, team] of seatTeams) map[slot] = team;
      for (const entry of this.entries()) map[entry.slot] = entry.team;
      return map;
    },

    freeSlots(): readonly number[] {
      const taken = takenSlots();
      const free: number[] = [];
      for (let slot = 0; slot < maxCars; slot += 1) {
        if (!taken.has(slot)) free.push(slot);
      }
      return free;
    },

    clear(reason: NeutralizeReason): void {
      for (const entry of bindings.values()) remember(entry.playerId, entry.slot);
      this.neutralizeAll(reason);
      bindings.clear();
      bySlot.clear();
      seatTeams.clear();
    },

    lastSlotOf(playerId: string): number {
      return retained.get(playerId) ?? -1;
    },

    forgetRetained(): void {
      retained.clear();
    },
  };
};

/**
 * Drive every controlled slot into the sim for one tick. This is the whole of
 * the four-player fan-out: one call per slot, each with its OWN control object,
 * which is all `sim.setControls` ever needed.
 */
export const pushControls = (
  registry: CarSlotRegistry,
  sim: PortedSim,
): ReadonlyArray<{ slot: number; controls: CarControls }> => {
  const pushed: { slot: number; controls: CarControls }[] = [];
  for (const live of registry.liveSlots()) {
    if (!live.source) continue;
    const controls = live.source.isLive() ? sanitizeControls(live.source.read()) : NEUTRAL_CONTROLS;
    sim.setControls(live.slot, controls);
    pushed.push({ slot: live.slot, controls });
  }
  return pushed;
};

/**
 * Re-exported so the host can plan a whole match's roster in one call instead
 * of claiming players one at a time and hoping the teams come out even.
 */
export const planMatchRoster = planRoster;
export { otherTeam };
