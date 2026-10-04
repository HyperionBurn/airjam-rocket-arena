/**
 * The match state machine. Pure, DOM-free, donor-free, unit-testable.
 *
 * ---------------------------------------------------------------------------
 * ADAPTED FROM THE DONOR, NOT REPLACED
 * ---------------------------------------------------------------------------
 * `rocket-arena-web/src/match/session.js` is 107 lines and works. Its whole
 * machine is `start()`, `tick()`, `kickoff()` and `end()` over a state object
 * of ten fields, timed in TICKS. Every one of those decisions is kept:
 *
 *   donor `Is` (120)            → TICKS_PER_SECOND      (donor-facts.ts)
 *   donor `am` (5 * 60 * 120)   → REGULATION_TICKS
 *   donor `om` (3 * 120)        → COUNTDOWN_TICKS
 *   donor `zM` (3 * 120)        → GOAL_TICKS
 *   donor `remaining`           → clock.remainingTicks
 *   donor `overtimeTicks`       → clock.overtimeTicks
 *   donor `phaseTicks`          → state.phaseTicks
 *   donor `clockStarted`        → clock.started
 *   donor `overtime`            → clock.overtime
 *   donor `kickoffTouched`      → TickInput.kickoffTouched
 *   donor `end()`               → reduceEndMatch
 *   donor `sm()` in defaults.js → formatClock
 *
 * FOUR THINGS WERE ADDED, each for a reason the donor had no answer for:
 *
 *  1. `lobby` and `ready` phases. The donor is a local hotseat game that starts
 *     a match the instant you press start. An Air Jam match has remote
 *     controllers that must join and ready up first, and the donor has no
 *     concept of that at all.
 *
 *  2. `kickoff` is split out of the donor's `kickoff` phase. The donor does the
 *     physics reset in the SAME frame it changes phase, from its own frame
 *     callback (`startup.js:764`: `a.tick({...}) === "kickoff" && _e()`). That
 *     works there because the donor owns the frame loop. Here the host owns it,
 *     so the reset gets a tick of its own and becomes a deterministic,
 *     observable transition instead of a side effect hiding inside a reducer.
 *
 *  3. Goals, assists, shots, saves, demolitions, touches and boost are tracked.
 *     The donor's `scorer` field is a team index and nothing more.
 *
 *  4. `commands` alongside `effects`. The donor's `tick()` returns one string
 *     code the caller acts on; returning a list lets the host and the agent
 *     contract consume the same decision.
 *
 * NOTHING the donor decides was changed. The clock still waits for the first
 * touch, overtime still needs the ball on the ground, a goal in overtime still
 * ends the match immediately, and a goal in regulation with the clock already
 * dead still ends it once the replay finishes.
 */

import {
  COUNTDOWN_TICKS,
  GOAL_TICKS,
  REGULATION_TICKS,
  TICKS_PER_SECOND,
} from "./donor-facts.js";
import { DEFAULT_MUTATOR } from "./sim-config.js";
import {
  EMPTY_STATS,
  createTrackerState,
  readLastTouch,
  resetTrackerStats,
  syncRoster,
  trackTick,
  type TrackerState,
} from "./stats.js";
import type {
  GoalEvent,
  MatchCommand,
  MatchEffect,
  MatchPhase,
  MatchState,
  PlayerEntry,
  PlayerStats,
  Team,
  TickInput,
  Transition,
} from "./types.js";

/* -------------------------------------------------------------------------- */
/* Donor's own clock formatting, `match/defaults.js:17-18`                      */
/* -------------------------------------------------------------------------- */

/** `sm()` — the donor's `m:ss` formatter, with its `ceil` for a countdown. */
export const formatClock = (seconds: number, roundUp = false): string => {
  const t = Math.max(0, roundUp ? Math.ceil(seconds) : Math.floor(seconds));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};

/* -------------------------------------------------------------------------- */
/* Small helpers                                                                */
/* -------------------------------------------------------------------------- */

const clockFor = (
  remainingTicks: number,
  overtimeTicks: number,
  overtime: boolean,
  started: boolean,
): MatchState["clock"] => ({
  remainingTicks,
  overtimeTicks,
  display: overtime
    ? `+${formatClock(overtimeTicks / TICKS_PER_SECOND)}`
    : formatClock(remainingTicks / TICKS_PER_SECOND),
  overtime,
  started,
});

const otherTeam = (team: Team): Team => (team === 0 ? 1 : 0);

/**
 * The donor's own win condition, lifted from `session.js:81-83` and `:86-88`.
 * There is no points-to-win in Rocket Arena: the match is 5 minutes and the
 * higher score at the horn wins. A goal only decides it early when the clock is
 * already dead, or when we are in overtime.
 */
const leaderOf = (blue: number, orange: number): Team | null =>
  blue === orange ? null : blue > orange ? 0 : 1;

const inert = (state: MatchState, tracker: TrackerState): TickResult => ({
  transition: { state, effects: [], commands: [] },
  tracker,
});

/* -------------------------------------------------------------------------- */
/* Tick runtime                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * What one tick needs from the outside world.
 *
 * `simState` is OPTIONAL on purpose: with no sim attached the machine still
 * advances the clock, the countdown, the goal hold and the horn perfectly, it
 * just cannot attribute stats. That is what lets the agent contract drive a
 * whole match headlessly.
 */
export interface TickRuntime {
  readonly tracker: TrackerState;
  readonly simState: Float32Array | null;
}

export const createTickRuntime = (
  players: readonly PlayerEntry[] = [],
  simState: Float32Array | null = null,
): TickRuntime => ({ tracker: createTrackerState(players), simState });

export interface TickResult {
  readonly transition: Transition;
  readonly tracker: TrackerState;
}

/* -------------------------------------------------------------------------- */
/* Initial state                                                                */
/* -------------------------------------------------------------------------- */

/**
 * The initial state. Mirrors the donor's `qM` default (`match/defaults.js:2-14`)
 * field for field, plus the Air Jam roster and stats.
 */
export const createInitialMatchState = (
  players: readonly PlayerEntry[] = [],
): MatchState => {
  const tracker = createTrackerState(players);
  return {
    phase: "lobby",
    mode: "freeplay",
    score: { 0: 0, 1: 0 },
    clock: clockFor(REGULATION_TICKS, 0, false, false),
    phaseTicks: 0,
    countdown: 0,
    winner: null,
    paused: false,
    players,
    stats: tracker.stats,
    goals: [],
    mutator: DEFAULT_MUTATOR,
    ballCam: {},
    lastBallTouch: null,
  };
};

/** Keep a tracker in step with a roster without losing its counters. */
export const retargetTracker = (
  tracker: TrackerState,
  players: readonly PlayerEntry[],
): TrackerState => syncRoster(tracker, players);

/* -------------------------------------------------------------------------- */
/* Roster reducers                                                              */
/* -------------------------------------------------------------------------- */

/** Phases in which the roster is frozen because the slots are already wired. */
const ROSTER_LOCKED: readonly MatchPhase[] = Object.freeze([
  "kickoff",
  "countdown",
  "playing",
  "goal",
]);

const rosterLocked = (phase: MatchPhase): boolean => ROSTER_LOCKED.includes(phase);

/**
 * Join / update a player. `lobby`, `ready` and `result` only — a live match
 * never re-assigns a roster.
 */
export const reduceJoinPlayer = (state: MatchState, player: PlayerEntry): MatchState => {
  if (rosterLocked(state.phase)) return state;
  const others = state.players.filter((entry) => entry.playerId !== player.playerId);
  const players = [...others, player].sort((a, b) => a.slot - b.slot);
  return { ...state, players };
};

/** Drop a player. Their stats stay, because the result screen must not lie. */
export const reduceLeavePlayer = (state: MatchState, playerId: string): MatchState => {
  if (!state.players.some((entry) => entry.playerId === playerId)) return state;
  return { ...state, players: state.players.filter((entry) => entry.playerId !== playerId) };
};

/** Toggle one player's ready flag. */
export const reduceReadyPlayer = (
  state: MatchState,
  playerId: string,
  ready: boolean,
): MatchState => {
  if (rosterLocked(state.phase)) return state;
  if (!state.players.some((entry) => entry.playerId === playerId)) return state;
  return {
    ...state,
    players: state.players.map((entry) =>
      entry.playerId === playerId ? { ...entry, ready } : entry,
    ),
  };
};

/**
 * Move a player to a team. The slot moves with them, because the slot is what
 * the simulation addresses and a player cannot drive a car on the other side.
 */
export const reduceSetTeam = (state: MatchState, playerId: string, team: Team): MatchState => {
  if (rosterLocked(state.phase)) return state;
  if (!state.players.some((entry) => entry.playerId === playerId)) return state;
  const onTeam = state.players.filter((entry) => entry.team === team && entry.playerId !== playerId);
  const nextSlot = onTeam.reduce((lowest, entry) => Math.max(lowest, entry.slot), -1) + 1;
  return {
    ...state,
    players: state.players.map((entry) =>
      entry.playerId === playerId ? { ...entry, team, slot: nextSlot, ready: false } : entry,
    ),
  };
};

/** Recompute `ready` from the roster. The donor has no equivalent. */
export const reduceRefreshReadiness = (state: MatchState): MatchState => {
  if (state.phase !== "lobby" && state.phase !== "ready") return state;
  const humans = state.players.filter((entry) => !entry.isBot);
  if (humans.length === 0) return state;
  const bothSides =
    state.players.some((entry) => entry.team === 0) && state.players.some((entry) => entry.team === 1);
  const next: MatchPhase = bothSides && humans.every((entry) => entry.ready) ? "ready" : "lobby";
  if (next === state.phase) return state;
  return { ...state, phase: next };
};

/** CHANGE TEAMS from the result screen: swap every human, drop back to lobby. */
export const reduceSwapTeams = (state: MatchState): MatchState => ({
  ...state,
  phase: "lobby",
  players: state.players.map((entry) =>
    entry.isBot ? entry : { ...entry, team: otherTeam(entry.team), ready: false },
  ),
});

/* -------------------------------------------------------------------------- */
/* Presentation / mutator reducers                                              */
/* -------------------------------------------------------------------------- */

/** Select the mutator. Any phase: a host may switch mid-match on purpose. */
export const reduceSetMutator = (state: MatchState, mutator: string): MatchState =>
  state.mutator === mutator ? state : { ...state, mutator };

/** Per-player ball-cam preference. Never shared between players. */
export const reduceSetBallCam = (
  state: MatchState,
  playerId: string,
  ballCam: boolean,
): MatchState =>
  state.ballCam[playerId] === ballCam
    ? state
    : { ...state, ballCam: { ...state.ballCam, [playerId]: ballCam } };

/** EXIT from the result screen: back to the donor's idle `freeplay` state. */
export const reduceLeaveMatch = (state: MatchState): MatchState => {
  const fresh = createInitialMatchState(state.players);
  return {
    ...fresh,
    // The mutator, the ball-cam preferences and the career totals are the
    // player's, not the match's, so they survive leaving.
    mutator: state.mutator,
    ballCam: state.ballCam,
    stats: state.stats,
  };
};

/* -------------------------------------------------------------------------- */
/* The four donors transitions                                                  */
/* -------------------------------------------------------------------------- */

/**
 * `start()` — the donor's `session.js:31-49`, field for field, plus the
 * one-tick `kickoff` phase the donor does in the same frame as the countdown.
 */
export const reduceStartMatch = (state: MatchState): Transition => {
  const tracker = resetTrackerStats(createTrackerState(state.players));
  return {
    state: {
      ...state,
      phase: "kickoff",
      mode: "match",
      score: { 0: 0, 1: 0 },
      clock: clockFor(REGULATION_TICKS, 0, false, false),
      phaseTicks: COUNTDOWN_TICKS,
      countdown: Math.ceil(COUNTDOWN_TICKS / TICKS_PER_SECOND),
      winner: null,
      paused: false,
      players: state.players.map((entry) => ({ ...entry, ready: true })),
      stats: tracker.stats,
      goals: [],
      lastBallTouch: null,
    },
    effects: [],
    commands: ["reset-kickoff", "start-match"],
  };
};

/**
 * The donor's `kickoff()` — `session.js:92-101`. The physics reset is an
 * EFFECT here, not a side effect inside the reducer.
 *
 * Note what the donor does and does NOT touch: it resets the phase, the phase
 * tick, the countdown, the scorer and `clockStarted`, and it leaves `remaining`
 * alone. So a kickoff mid-match holds the clock where it was and stops it again
 * until the next touch. Rewinding the score AND the clock together is
 * `reduceRematch`'s job, not this one's.
 */
export const reduceKickoff = (state: MatchState): Transition => ({
  state: {
    ...state,
    phase: "kickoff",
    mode: "match",
    phaseTicks: COUNTDOWN_TICKS,
    countdown: Math.ceil(COUNTDOWN_TICKS / TICKS_PER_SECOND),
    lastBallTouch: null,
    clock: { ...state.clock, started: false },
  },
  effects: ["reset-kickoff"],
  commands: ["reset-kickoff"],
});

/** The donor's `end()` — `session.js:102-104`, plus the final-horn command. */
export const reduceEndMatch = (state: MatchState, winner?: Team | null): Transition => {
  const decided = winner ?? state.winner ?? leaderOf(state.score[0], state.score[1]);
  if (decided === null) {
    // The donor can only ever end on a decided score. Refuse rather than invent
    // a winner for a tie.
    return { state, effects: [], commands: [] };
  }
  return {
    state: { ...state, phase: "result", winner: decided, paused: false },
    effects: ["replay-end"],
    commands: ["final-horn"],
  };
};

/**
 * REMATCH. Score, clock, stats, goal feed and last touch all reset; the ROSTER
 * does not, so nobody has to rejoin — the explicit requirement.
 */
export const reduceRematch = (state: MatchState): Transition => {
  const tracker = resetTrackerStats(createTrackerState(state.players));
  return {
    state: {
      ...state,
      phase: "kickoff",
      mode: "match",
      score: { 0: 0, 1: 0 },
      clock: clockFor(REGULATION_TICKS, 0, false, false),
      phaseTicks: COUNTDOWN_TICKS,
      countdown: Math.ceil(COUNTDOWN_TICKS / TICKS_PER_SECOND),
      winner: null,
      paused: false,
      stats: tracker.stats,
      goals: [],
      lastBallTouch: null,
    },
    effects: [],
    commands: ["reset-kickoff", "start-match"],
  };
};

/* -------------------------------------------------------------------------- */
/* Goal                                                                         */
/* -------------------------------------------------------------------------- */

export interface GoalOutcome {
  readonly transition: Transition;
  readonly event: GoalEvent;
}

/**
 * Score a goal for `team`. Adapted from `session.js:76-84`:
 *  - increment the scoring side;
 *  - hold `goal` for `zM` ticks;
 *  - if overtime, OR the clock is already dead and the score is no longer level,
 *    the match is decided NOW and the result screen follows the replay.
 *
 * A goal outside `playing` is recorded in the feed but changes nothing else, so
 * the agent contract can poke a goal at any time without corrupting the machine.
 */
export const reduceGoal = (
  state: MatchState,
  team: Team,
  attribution: { scorerId: string | null; assistId: string | null } = {
    scorerId: null,
    assistId: null,
  },
  goalId = state.goals.length + 1,
): GoalOutcome => {
  const score =
    state.phase === "playing"
      ? { 0: state.score[0] + (team === 0 ? 1 : 0), 1: state.score[1] + (team === 1 ? 1 : 0) }
      : { ...state.score };

  const decided =
    state.phase === "playing" &&
    (state.clock.overtime ||
      (state.clock.remainingTicks === 0 && leaderOf(score[0], score[1]) !== null))
      ? leaderOf(score[0], score[1])
      : null;

  const event: GoalEvent = {
    id: goalId,
    team,
    scorerPlayerId: attribution.scorerId,
    assistPlayerId: attribution.assistId,
    inOvertime: state.clock.overtime,
    score,
  };

  if (state.phase !== "playing") {
    return {
      transition: {
        state: { ...state, goals: [...state.goals, event] },
        effects: [],
        commands: [],
      },
      event,
    };
  }

  const stats: Record<string, PlayerStats> = { ...state.stats };
  if (attribution.scorerId) {
    const row = stats[attribution.scorerId] ?? EMPTY_STATS;
    stats[attribution.scorerId] = { ...row, goals: row.goals + 1 };
  }
  if (attribution.assistId) {
    const row = stats[attribution.assistId] ?? EMPTY_STATS;
    stats[attribution.assistId] = { ...row, assists: row.assists + 1 };
  }

  return {
    transition: {
      state: {
        ...state,
        phase: "goal",
        phaseTicks: GOAL_TICKS,
        score,
        stats,
        winner: decided,
        goals: [...state.goals, event],
        lastBallTouch: attribution.scorerId
          ? { playerId: attribution.scorerId, team, tick: 0 }
          : state.lastBallTouch,
      },
      effects: ["replay-begin", "goal-explosion"],
      commands: ["goal-explosion"],
    },
    event,
  };
};

/* -------------------------------------------------------------------------- */
/* The clock                                                                    */
/* -------------------------------------------------------------------------- */

/** One tick of the clock, donor `session.js:72-75`. */
const advanceClock = (state: MatchState): MatchState => {
  if (state.clock.overtime) {
    const overtimeTicks = state.clock.overtimeTicks + 1;
    return { ...state, clock: clockFor(state.clock.remainingTicks, overtimeTicks, true, true) };
  }
  const remainingTicks = Math.max(0, state.clock.remainingTicks - 1);
  return { ...state, clock: clockFor(remainingTicks, 0, false, true) };
};

/* -------------------------------------------------------------------------- */
/* tick() — the donor's whole machine, `session.js:55-91`                       */
/* -------------------------------------------------------------------------- */

/** The donor's "nothing happened" input, `session.js:55`. */
export const IDLE_TICK: TickInput = Object.freeze({
  goal: 0,
  ballOnGround: false,
  kickoffTouched: false,
});

/**
 * One fixed 120 Hz tick of the match.
 *
 * The donor's guard at `session.js:57` is kept exactly: outside a match, while
 * paused, or once ended, a tick does nothing at all.
 */
export const reduceTick = (
  state: MatchState,
  input: TickInput = IDLE_TICK,
  runtime: TickRuntime = createTickRuntime(state.players),
): TickResult => {
  if (state.mode !== "match" || state.paused) return inert(state, runtime.tracker);
  if (state.phase === "result" || state.phase === "lobby" || state.phase === "ready") {
    return inert(state, runtime.tracker);
  }

  // ── the one-tick kickoff reset ───────────────────────────────────────────
  if (state.phase === "kickoff") {
    return {
      transition: {
        state: { ...state, phase: "countdown", phaseTicks: COUNTDOWN_TICKS, countdown: 3 },
        effects: [],
        commands: [],
      },
      tracker: runtime.tracker,
    };
  }

  // ── countdown: 3 · 2 · 1 · GO ────────────────────────────────────────────
  // Donor `session.js:59-63`.
  if (state.phase === "countdown") {
    const phaseTicks = state.phaseTicks - 1;
    const finished = phaseTicks <= 0;
    return {
      transition: {
        state: {
          ...state,
          phase: finished ? "playing" : "countdown",
          phaseTicks,
          countdown: finished ? 0 : Math.ceil(phaseTicks / TICKS_PER_SECOND),
        },
        effects: [],
        commands: [],
      },
      tracker: runtime.tracker,
    };
  }

  // ── goal: hold for zM ticks, then kickoff or end ─────────────────────────
  // Donor `session.js:64-69`.
  if (state.phase === "goal") {
    const phaseTicks = state.phaseTicks - 1;
    if (phaseTicks > 0) {
      return {
        transition: { state: { ...state, phaseTicks }, effects: [], commands: [] },
        tracker: runtime.tracker,
      };
    }
    if (state.winner !== null) {
      return { transition: reduceEndMatch(state, state.winner), tracker: runtime.tracker };
    }
    // Donor's `:69` — a dead clock here flips the match into overtime.
    const wentOvertime = state.clock.remainingTicks === 0;
    return {
      transition: reduceKickoff({
        ...state,
        phaseTicks,
        clock: { ...state.clock, overtime: wentOvertime },
      }),
      tracker: runtime.tracker,
    };
  }

  // ── playing ──────────────────────────────────────────────────────────────
  // Donor `session.js:70-90`: clock first, then the goal test, then the horn.
  //
  // `clockStarted` is STICKY in the donor (`this.clockStarted || (this.clockStarted = n)`)
  // and so it is here: the first touch after kickoff starts the clock for good,
  // and a ball that goes quiet afterwards must not pause it.
  const clocked: MatchState =
    state.clock.started || input.kickoffTouched ? advanceClock(state) : state;

  // The goal test, with the stat tracker in the loop. The tracker only consumes
  // the TEAM, which is the one thing the donor is certain about.
  const goalTeam: Team | null = input.goal === 1 ? 0 : input.goal === 2 ? 1 : null;
  const tracked = runtime.simState
    ? trackTick(runtime.tracker, runtime.simState, clocked.clock.remainingTicks, goalTeam)
    : { state: runtime.tracker, scorerId: null, assistId: null, team: null };

  const withStats: MatchState = { ...clocked, stats: tracked.state.stats };

  if (goalTeam !== null) {
    const goal = reduceGoal(
      { ...withStats, lastBallTouch: readLastTouch(tracked.state) },
      goalTeam,
      { scorerId: tracked.scorerId, assistId: tracked.assistId },
      withStats.goals.length + 1,
    );
    return { transition: goal.transition, tracker: tracked.state };
  }

  // The final horn, exactly as the donor gates it (`:85-89`): the clock is at
  // zero, we are NOT in overtime, the ball is ON THE GROUND, and the score is
  // no longer level. A level score at zero goes to overtime instead.
  if (!clocked.clock.overtime && clocked.clock.remainingTicks === 0 && input.ballOnGround) {
    const leader = leaderOf(clocked.score[0], clocked.score[1]);
    if (leader === null) {
      return {
        transition: reduceKickoff({
          ...withStats,
          clock: { ...clocked.clock, overtime: true },
        }),
        tracker: tracked.state,
      };
    }
    return { transition: reduceEndMatch(withStats, leader), tracker: tracked.state };
  }

  return inert(withStats, tracked.state);
};

/* -------------------------------------------------------------------------- */
/* Headless advance — the agent contract's "run N ticks" primitive            */
/* -------------------------------------------------------------------------- */

/** The result of running a batch of ticks. */
export interface AdvanceResult {
  readonly state: MatchState;
  readonly tracker: TrackerState;
  /** Union of every transition's effects and commands, in tick order. */
  readonly effects: readonly MatchEffect[];
  readonly commands: readonly MatchCommand[];
  /** Ticks actually run. A finished match stops the batch early. */
  readonly ticksRun: number;
}

/**
 * Run up to `ticks` fixed ticks against the machine.
 *
 * This is what "advance simulation" means for an agent: no frame loop, no
 * `requestAnimationFrame`, no browser. It is the single most important reason
 * the machine is a pure reducer.
 */
export const advanceTicks = (
  state: MatchState,
  runtime: TickRuntime,
  ticks: number,
  input: TickInput = IDLE_TICK,
): AdvanceResult => {
  const total = Math.max(0, Math.floor(ticks));
  const effects: MatchEffect[] = [];
  const commands: MatchCommand[] = [];
  let current = state;
  let tracker = runtime.tracker;
  let ticksRun = 0;

  for (let i = 0; i < total; i += 1) {
    if (current.phase === "result" || current.phase === "lobby" || current.phase === "ready") break;
    const result = reduceTick(current, input, { tracker, simState: runtime.simState });
    current = result.transition.state;
    tracker = result.tracker;
    effects.push(...result.transition.effects);
    commands.push(...result.transition.commands);
    ticksRun += 1;
  }

  return { state: current, tracker, effects, commands, ticksRun };
};
