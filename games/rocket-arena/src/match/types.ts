/**
 * The match layer's data model.
 *
 * Everything here is a plain, JSON-serialisable shape so the same object can be
 * (a) reduced by the pure machine in `./machine.ts`, (b) published through the
 * Air Jam store, and (c) projected verbatim into the agent snapshot. No class
 * instances, no `Float32Array`, no functions.
 */

import type { Team } from "./donor-facts.js";

/**
 * 0 = blue, 1 = orange. Matches the donor's own goal-flag numbering.
 *
 * Re-exported from `./donor-facts.js` rather than restated, so there is exactly
 * ONE definition of a team in this directory and a mismatch is impossible.
 */
export type { Team } from "./donor-facts.js";
export { TEAM_LABEL, otherTeam } from "./donor-facts.js";

/**
 * The match phases this port implements.
 *
 * MAPPED FROM THE DONOR, NOT INVENTED. `match/session.js` has five states; the
 * port keeps all five and adds the two the Air Jam multi-player shell needs in
 * front of them. See `machine.ts` for the full mapping table.
 *
 *  - `freeplay`  ← donor `mode: "freeplay"` — the donor's idle state, no match.
 *  - `lobby`     ← NEW. Air Jam pre-match: players join, pick a team, ready up.
 *  - `ready`     ← NEW. Both teams reported ready; waiting on the host to start.
 *  - `kickoff`   ← donor `phase: "kickoff"` (collapsed) — the ONE tick in which
 *                  the host applies the physics reset. The donor does this
 *                  reset in the same frame it changes phase, from its frame
 *                  callback (`startup.js:764`), so it has no phase of its own.
 *  - `countdown` ← donor `phase: "kickoff"` (the 3-second part) — 3 · 2 · 1 · GO.
 *  - `playing`   ← donor `phase: "playing"`.
 *  - `goal`      ← donor `phase: "goal"` — celebration + replay hold.
 *  - `result`    ← donor `phase: "ended"` — the final horn.
 */
export type MatchPhase =
  | "freeplay"
  | "lobby"
  | "ready"
  | "kickoff"
  | "countdown"
  | "playing"
  | "goal"
  | "result";

/** Every phase, in the order the machine can hold them. Used by tests + UI. */
export const MATCH_PHASES: readonly MatchPhase[] = Object.freeze([
  "freeplay",
  "lobby",
  "ready",
  "kickoff",
  "countdown",
  "playing",
  "goal",
  "result",
] as const);

/** One player's row in the lobby and on the result screen. */
export interface PlayerEntry {
  readonly playerId: string;
  readonly name: string;
  readonly team: Team;
  /** Car slot in the simulation, or -1 while unassigned. */
  readonly slot: number;
  /** Bots are driven by the donor, not by an Air Jam controller. */
  readonly isBot: boolean;
  readonly ready: boolean;
}

/**
 * Per-player match statistics.
 *
 * WHAT IS CERTAIN vs WHAT IS INFERRED is recorded per counter, because the
 * donor exposes different amounts of truth for each. See `stats.ts` for the
 * derivation of every one of these and `index.ts`'s `STAT_CONFIDENCE` map.
 */
export interface PlayerStats {
  /** Goals scored. INFERRED: the donor's goal flag carries a TEAM, never a car. */
  readonly goals: number;
  /** Goals set up by a teammate. INFERRED from the touch history. */
  readonly assists: number;
  /** Goals prevented. INFERRED; the donor has no shot/save concept at all. */
  readonly saves: number;
  /** Shots toward the opposing half. INFERRED from ball speed + half entry. */
  readonly shots: number;
  /** Cars demolished. VICTIM is CERTAIN; the demolished-by car is proximity. */
  readonly demolitions: number;
  /** Times this car was demolished. CERTAIN (`CAR_FIELD.DEMOED`). */
  readonly timesDemoed: number;
  /** Native ball-contact events by this car. CERTAIN (`BALL_HIT_SERIAL`). */
  readonly ballTouches: number;
  /** Boost spent, 0..1 units summed over the match. CERTAIN (`CAR_FIELD.BOOST`). */
  readonly boostConsumed: number;
}

/** A goal as the machine recorded it, for the goal feed and the agent snapshot. */
export interface GoalEvent {
  /** Monotonic id, so a consumer can dedupe a replayed goal. */
  readonly id: number;
  /** The team that scored. CERTAIN. */
  readonly team: Team;
  /** Who gets the goal in the scoreline. INFERRED (last ball contact). */
  readonly scorerPlayerId: string | null;
  /** Second-in-team toucher inside the assist window. INFERRED. */
  readonly assistPlayerId: string | null;
  /** True when the match had already gone to overtime. */
  readonly inOvertime: boolean;
  /** The scoreline at the moment of the goal. */
  readonly score: Readonly<Record<Team, number>>;
}

/** The match clock, in the donor's own units plus the derived display string. */
export interface MatchClock {
  /** Ticks of regulation left, exactly as `session.js` counts them. */
  readonly remainingTicks: number;
  /** Ticks of overtime elapsed (0 while not in overtime). */
  readonly overtimeTicks: number;
  /** `m:ss`, the donor's `sm()` in `match/defaults.js:17-18`. */
  readonly display: string;
  readonly overtime: boolean;
  /**
   * True once the ball has been touched since kickoff. The donor deliberately
   * holds the clock at 5:00 until the first touch (`session.js:70`), so this
   * is exposed rather than hidden.
   */
  readonly started: boolean;
}

/** The immutable, JSON-safe state the whole match layer reduces into. */
export interface MatchState {
  readonly phase: MatchPhase;
  /** Donor's `mode`. `"match"` from `startMatch` until the match is left. */
  readonly mode: "freeplay" | "match";
  readonly score: Readonly<Record<Team, number>>;
  readonly clock: MatchClock;
  /**
   * Ticks left in the CURRENT phase, i.e. the donor's private `phaseTicks`
   * (`match/session.js:28`) lifted into the state.
   *
   * It has to live here: a pure reducer cannot mutate a private field, and a
   * mutable counter is the only way the countdown and the goal hold can be
   * reproduced tick-for-tick. It is meaningless while `phase` is `kickoff`
   * (exactly one tick) or `playing`.
   */
  readonly phaseTicks: number;
  /** Donor's `countdown`: 3, 2, 1, then 0 while playing. */
  readonly countdown: number;
  readonly winner: Team | null;
  readonly paused: boolean;

  readonly players: readonly PlayerEntry[];
  readonly stats: Readonly<Record<string, PlayerStats>>;
  readonly goals: readonly GoalEvent[];

  /** Id of the active mutator. Always one of `MUTATOR_IDS`. */
  readonly mutator: string;
  /** Ball-cam preference per player, keyed by `playerId`. */
  readonly ballCam: Readonly<Record<string, boolean>>;
  /** Last car to touch the ball, kept for goal/assist attribution. */
  readonly lastBallTouch: { readonly playerId: string; readonly team: Team; readonly tick: number } | null;
}

/**
 * A side effect the machine wants the host to perform. The reducer NEVER
 * performs effects itself; it returns them. That is what keeps `machine.ts`
 * pure and the host free to do donor work on its own schedule.
 */
export type MatchEffect =
  /** Reset every car to kickoff. The donor's `_e()` / `sim.resetKickoff()`. */
  | "reset-kickoff"
  /** Fire the native goal explosion (`physics/simulation.js:175`). */
  | "goal-explosion"
  /** Start recording a replay clip. */
  | "replay-begin"
  /** Stop the replay and restore the live world. */
  | "replay-end";

/**
 * Everything the machine learns from the world in ONE tick.
 *
 * The donor's `tick()` takes `{ goal, ballOnGround, kickoffTouched }`
 * (`match/session.js:55`). Those three are here verbatim; `goalTeam` is the
 * donor's own `1 | 2` goal flag, mapped to a `Team` before it gets here.
 */
export interface TickInput {
  /** Donor's `1 | 2` goal flag, or 0 for none. */
  readonly goal: 0 | 1 | 2;
  /** `sim.ballOnGround` (`physics/simulation.js:207`). */
  readonly ballOnGround: boolean;
  /** Donor's "the ball has moved since kickoff" test (`startup.js:761-763`). */
  readonly kickoffTouched: boolean;
}

/** The result of one `reduce` call. */
export interface Transition {
  readonly state: MatchState;
  /** Empty when the tick changed nothing. Order is significant. */
  readonly effects: readonly MatchEffect[];
  /**
   * What the machine wants the host to do with the DONOR itself, rather than
   * with the DOM. Empty for a plain tick. Mirrors the string codes the donor's
   * `tick()` returns (`match/session.js:59-91`) plus two Air Jam additions.
   */
  readonly commands: readonly MatchCommand[];
}

/**
 * Donor-facing commands. `advance` is an addition: the donor only ever steps
 * inside its own frame loop, so the agent contract needs a way to ask for N
 * extra fixed steps.
 */
export type MatchCommand =
  | "reset-kickoff"
  | "goal-explosion"
  | "start-match"
  | "final-horn"
  | { readonly advance: number };
