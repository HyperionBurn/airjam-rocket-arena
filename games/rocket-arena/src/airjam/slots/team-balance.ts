/**
 * Team assignment and roster planning — pure, no sim, no DOM.
 *
 * ---------------------------------------------------------------------------
 * DONOR CONVENTION (do not assume 0 = blue by accident)
 * ---------------------------------------------------------------------------
 * `physics/state-layout.js:8-10`:
 *   getTeamAssignment(i) → i ? {playerTeam: 0, botTeam: 1} : {playerTeam: 1, botTeam: 0}
 * `match/session.js:82` scores `winner = blueScore > orangeScore ? 0 : 1`, and
 * `match/session.js:77-79` maps `GOAL === 1` to blue and `GOAL === 2` to
 * orange. So team 0 IS blue and team 1 IS orange — but the donor's own offline
 * match puts the HUMAN on team 1 and the BOT on team 0, which is the opposite
 * of the intuitive "player is blue". This module therefore treats 0/1 as an
 * opaque pair and never derives meaning from the ORDER beyond "team 0 is the
 * tie-break side", which is what `match/session.js` scoring implies.
 *
 * `bridge.cpp addCar` rejects any team that is not 0 or 1, so `0 | 1` is not
 * a choice here — it is the ABI.
 *
 * ---------------------------------------------------------------------------
 * WHY THE ROSTER IS ALWAYS EQUAL-SIZED
 * ---------------------------------------------------------------------------
 * Kickoff fairness is only guaranteed if the two spawn sets are mirror images
 * of each other (see `kickoff.ts`), and a mirror pair needs a counterpart on
 * every slot. An odd number of humans (the product's 3-player case) would
 * otherwise leave one team a car short at kickoff, so `planRoster` fills the
 * smaller team with BOT slots until the teams match. A human is never given a
 * team to make the numbers work: the bots absorb the imbalance.
 */

import { NATIVE_MAX_CARS } from "./donor-facts.js";

/** The only two teams `bridge.cpp` accepts. */
export type Team = 0 | 1;

export const otherTeam = (team: Team): Team => (team === 0 ? 1 : 0);

/** Human/bot split for one planned car. */
export type RosterRole = "human" | "bot";

export interface RosterSeat {
  /** Stable seat index — the order the cars are created in the arena. */
  readonly seat: number;
  readonly role: RosterRole;
  /** Air Jam player id; `null` for a bot seat. */
  readonly playerId: string | null;
  readonly team: Team;
}

export interface RosterPlan {
  readonly seats: ReadonlyArray<RosterSeat>;
  /** Cars per team, index 0 → team 0. Always equal for a balanced plan. */
  readonly teamSizes: readonly [number, number];
  /** Seats the arena could not hold, because `capacity` was reached. */
  readonly dropped: ReadonlyArray<RosterSeat>;
}

export interface RosterPlanOptions {
  /** Air Jam players in join order. Their ids are preserved verbatim. */
  readonly playerIds: readonly string[];
  /**
   * Explicit team requests by player id. A player listed here is placed on that
   * team even when it unbalances the roster; `fillBots` then adds the bots.
   */
  readonly requestedTeams?: Readonly<Record<string, Team>>;
  /** Bot cars to add so both teams end up the same size. Default `true`. */
  readonly fillBots?: boolean;
  /** Hard ceiling from the sim, normally `MAX_CARS` (8). */
  readonly capacity?: number;
}

const clampCapacity = (capacity: number | undefined): number => {
  const requested = Math.floor(capacity ?? NATIVE_MAX_CARS);
  if (!Number.isFinite(requested) || requested < 0) return 0;
  return Math.min(requested, NATIVE_MAX_CARS);
};

/**
 * Team for a JOINING player: the strictly smaller team wins, and an exact tie
 * goes to `preferred`. Alternating the tie is what makes 2/2, 3/3 and 4/4 come
 * out even with no explicit request: 0, 1, 0, 1, …
 */
export const balanceTeamFor = (
  sizes: readonly [number, number],
  preferred: Team = 0,
): Team => {
  if (sizes[0] < sizes[1]) return 0;
  if (sizes[1] < sizes[0]) return 1;
  return preferred;
};

/**
 * Build the car roster for a match.
 *
 * Humans keep their join order and are placed on the smaller team unless they
 * asked for a specific one. Bot seats then pad the smaller team until the two
 * sides are equal, and anything past `capacity` lands in `dropped` instead of
 * throwing — a full arena is a product state, not an error.
 */
export const planRoster = (options: RosterPlanOptions): RosterPlan => {
  const capacity = clampCapacity(options.capacity);
  const requested = options.requestedTeams ?? {};
  const sizes: [number, number] = [0, 0];
  const accepted: RosterSeat[] = [];
  const dropped: RosterSeat[] = [];
  const seen = new Set<string>();

  for (const playerId of options.playerIds) {
    if (seen.has(playerId)) continue; // a reconnect must not consume two cars
    seen.add(playerId);
    const explicit = requested[playerId];
    const team: Team = explicit === 0 || explicit === 1 ? explicit : balanceTeamFor(sizes);
    const seat: RosterSeat = { seat: accepted.length, role: "human", playerId, team };
    if (accepted.length >= capacity) {
      dropped.push(seat);
      continue;
    }
    sizes[team] += 1;
    accepted.push(seat);
  }

  if (options.fillBots !== false) {
    let botSeat = accepted.length;
    // Only pad while there is room AND the teams differ. Bots go on the SMALLER
    // team, which is the whole point: the human count stays odd and the match
    // stays even.
    while (Math.abs(sizes[0] - sizes[1]) > 0 && accepted.length < capacity) {
      const team: Team = sizes[0] <= sizes[1] ? 0 : 1;
      accepted.push({ seat: botSeat, role: "bot", playerId: null, team });
      sizes[team] += 1;
      botSeat += 1;
    }
  }

  return { seats: accepted, teamSizes: sizes, dropped };
};

/**
 * Team sizes implied by an arbitrary slot→team map — used by the registry to
 * re-balance as players come and go without re-planning the whole roster.
 */
export const teamSizesOf = (teams: Iterable<Team>): readonly [number, number] => {
  const sizes: [number, number] = [0, 0];
  for (const team of teams) sizes[team === 1 ? 1 : 0] += 1;
  return sizes;
};
