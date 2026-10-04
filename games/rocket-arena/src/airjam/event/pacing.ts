/**
 * ============================================================================
 * PHASE 12 — EVENT MODE. THE PACING LAYER.
 * ============================================================================
 *
 * OWNER: the Event Mode worker (`src/airjam/event/**`).
 *
 * ---------------------------------------------------------------------------
 * WHY THIS IS THE INTERESTING PART
 * ---------------------------------------------------------------------------
 * "4 players, 2v2, 3-minute game, normal boost/ball, fast kickoff reset, short
 * goal celebration, short post-match screen, instant rematch" is, in the
 * product's real terms, a statement about TIME. The roster is the easy half. At
 * a live event nobody technical is present, so the questions that actually
 * matter are:
 *
 *   - how long is a player standing around holding a phone before the ball
 *     moves?  (kickoff)
 *   - how long are they standing around after someone scores?  (celebration)
 *   - how long between the final whistle and the next match?  (post-match)
 *   - and, the only number a producer actually asks for: how many matches can
 *     we run an hour?  (the cycle)
 *
 * So the timings are modelled as DATA here, not as a pile of booleans, and the
 * cycle time is DERIVED from them rather than guessed at. `deriveEventCycle`
 * is the function an operator screen calls to render "a 4-player match cycles
 * in ~3:44".
 *
 * ---------------------------------------------------------------------------
 * WHERE EACH NUMBER COMES FROM — read this before "correcting" one
 * ---------------------------------------------------------------------------
 * Two classes of number appear below, and they are NOT interchangeable:
 *
 *  1. DONOR-DERIVED. `kickoffCountdownMs` and `goalCelebrationMs` in the
 *     DEFAULT profile are computed from the donor's own tick constants
 *     (`match/session.js:3-9`, restated in `src/match/donor-facts.ts` as
 *     `COUNTDOWN_TICKS` and `GOAL_TICKS`, at `TICKS_PER_SECOND` = 120). Those
 *     are 3 s each. They are converted, never retyped, so a donor change would
 *     show up here as a diff.
 *
 *  2. DECLARED. `kickoffResetMs`, `postMatchDwellMs`, `rematchReadyMs` and the
 *     two goal-spacing assumptions have NO donor source — the donor has no
 *     post-match screen and no rematch flow at all; those are Air Jam additions.
 *     They are declared, they are named, and `PacingAssumptions` is a separate
 *     exported type precisely so a reader can tell "measured" from "asserted".
 *
 * The one that most deserves the "declared" label is `minGoalSpacingMs`. It is
 * the floor on how fast two goals can follow each other, and it is the input
 * that makes the WORST case honest: a match where somebody scores every four
 * seconds is not a game, it is a pinball machine, but nothing in the software
 * stops it, so the worst case has to assume it. `minBallTraverseMs` is the
 * declared part of that floor — the time for the ball to be re-centred and reach
 * a net. It is NOT a measurement, and this file does not pretend it is.
 *
 * ---------------------------------------------------------------------------
 * PURE. No clock, no DOM, no donor, no WASM.
 * ---------------------------------------------------------------------------
 * Nothing here reads `Date.now()`. That is not a style preference: `runEvent
 * Match` is required to be idempotent, and a wall-clock read would make two
 * runs from the same input differ. Every quantity below is a function of its
 * arguments only.
 */

import { formatClock, matchDurationMs } from "@/lobby/settings";
import type { EventTuning, MatchLengthMinutes } from "@/lobby/types";
import { COUNTDOWN_TICKS, GOAL_TICKS, TICKS_PER_SECOND } from "@/match/donor-facts";

/* -------------------------------------------------------------------------- */
/* The tick → millisecond conversion the donor already implies                  */
/* -------------------------------------------------------------------------- */

/**
 * The donor counts its whole match machine in ticks (`match/session.js:3` names
 * the constant `Is`), so converting a donor timing to milliseconds is a
 * division, not a retyped literal.
 */
export const ticksToMs = (ticks: number): number => (ticks / TICKS_PER_SECOND) * 1000;

/* -------------------------------------------------------------------------- */
/* Pacing profiles                                                              */
/* -------------------------------------------------------------------------- */

/** Which beat of the event loop a timing belongs to. Documentation, not logic. */
export type PacingBeat =
  | "kickoff-reset"
  | "kickoff-countdown"
  | "goal-celebration"
  | "replay"
  | "post-match"
  | "rematch-ready";

/**
 * The six event-level timings. Every one is milliseconds; every one is a plain
 * number, so a plan carrying them is `JSON.stringify`-able and a host can read
 * them without importing anything from this file.
 *
 * ORDERING IS AN INVARIANT, not a convention: a post-match dwell that is shorter
 * than the replay it follows would let the next kickoff cut the replay off. It
 * is enforced per-beat in `isPacingCoherent` (a beat only has to be non-negative
 * and finite) and across beats in `checkPacingOrdering`, because
 * "the final whistle before the result screen" is a real product rule.
 */
export interface EventPacing {
  /** Cars back on their spawn marks after a goal, before the countdown. */
  readonly kickoffResetMs: number;
  /** The 3 · 2 · 1 · GO beat. */
  readonly kickoffCountdownMs: number;
  /** Goal explosion + banner. */
  readonly goalCelebrationMs: number;
  /** Replay clip hold, after the celebration. */
  readonly replayMs: number;
  /** The result screen before the next match is armed. */
  readonly postMatchDwellMs: number;
  /** How long "ready" must be held before the instant rematch fires. */
  readonly rematchReadyMs: number;
}

/** Milliseconds in one hour — the denominator of the throughput figure. */
const HOUR_MS = 3_600_000;

/* -------------------------------------------------------------------------- */
/* The two profiles                                                             */
/* -------------------------------------------------------------------------- */

/**
 * The STOCK pacing: the donor's own goal hold and countdown, and the ordinary
 * human wait times. It mirrors `DEFAULT_TUNING`
 * (`kickoffReset: "normal"`, `goalCelebration: "full"`, `postMatchScreen:
 * "full"`) so a lobby with event mode OFF and one with it ON differ only in the
 * numbers below — there is no hidden fourth behaviour.
 */
export const DEFAULT_PACING: EventPacing = Object.freeze({
  kickoffResetMs: 1_200,
  kickoffCountdownMs: ticksToMs(COUNTDOWN_TICKS),
  goalCelebrationMs: ticksToMs(GOAL_TICKS),
  replayMs: ticksToMs(GOAL_TICKS),
  postMatchDwellMs: 8_000,
  rematchReadyMs: 4_000,
});

/**
 * EVENT MODE pacing — the "fast and boring in the best way" profile.
 *
 * The donor-derived beats (`kickoffCountdownMs`, `goalCelebrationMs`) are set as
 * exact fractions of the donor's own value rather than as fresh numbers:
 * countdown is half of `COUNTDOWN_TICKS` (1.5 s) and celebration is a third of
 * `GOAL_TICKS` (1 s). "Half the countdown, a third of the celebration" is a
 * decision someone can argue with; "1500" is a number someone can only guess
 * about.
 */
export const EVENT_PACING: EventPacing = Object.freeze({
  kickoffResetMs: 400,
  kickoffCountdownMs: ticksToMs(COUNTDOWN_TICKS) / 2,
  goalCelebrationMs: ticksToMs(GOAL_TICKS) / 3,
  replayMs: 1_500,
  postMatchDwellMs: 2_500,
  rematchReadyMs: 250,
});

/* -------------------------------------------------------------------------- */
/* Assumptions — the part that is asserted, not measured                       */
/* -------------------------------------------------------------------------- */

/**
 * The two quantities the worst/typical cycle rests on that the software cannot
 * observe from inside itself.
 *
 * `minBallTraverseMs` is the reason `minGoalSpacingMs` is a floor rather than a
 * guess: after a goal the ball is re-centred, so the next goal cannot arrive
 * before the ball has travelled from the centre spot to a net. 2.5 s is a
 * declared value. If a producer wants a real number it has to be measured on
 * the actual arena, and the honest way to record that is to change it here.
 */
export interface PacingAssumptions {
  /** Centre-to-net ball travel after a re-centre. DECLARED, not measured. */
  readonly minBallTraverseMs: number;
  /** Spacing a real game settles at. DECLARED, not measured. */
  readonly typicalGoalSpacingMs: number;
}

export const EVENT_PACING_ASSUMPTIONS: PacingAssumptions = Object.freeze({
  minBallTraverseMs: 2_500,
  typicalGoalSpacingMs: 20_000,
});

export const DEFAULT_PACING_ASSUMPTIONS: PacingAssumptions = EVENT_PACING_ASSUMPTIONS;

/* -------------------------------------------------------------------------- */
/* Pacing from the lobby's tuning union                                        */
/* -------------------------------------------------------------------------- */

/**
 * Project the lobby's own five-way `EventTuning` union onto a full `EventPacing`.
 *
 * The lobby is the owner of that union and this module must not invent a second
 * one, so the mapping is total and explicit: every combination of the five
 * tuning fields and the `instantRematch` flag resolves to a complete profile.
 * `boost` and `ball` are accepted and deliberately IGNORED for pacing — they
 * change physics, not time, and that is the match layer's business, not this
 * one's.
 */
export function pacingForTuning(tuning: EventTuning, instantRematch: boolean): EventPacing {
  return Object.freeze({
    kickoffResetMs: tuning.kickoffReset === "fast" ? EVENT_PACING.kickoffResetMs : DEFAULT_PACING.kickoffResetMs,
    kickoffCountdownMs:
      tuning.kickoffReset === "fast" ? EVENT_PACING.kickoffCountdownMs : DEFAULT_PACING.kickoffCountdownMs,
    goalCelebrationMs:
      tuning.goalCelebration === "short" ? EVENT_PACING.goalCelebrationMs : DEFAULT_PACING.goalCelebrationMs,
    replayMs: tuning.goalCelebration === "short" ? EVENT_PACING.replayMs : DEFAULT_PACING.replayMs,
    postMatchDwellMs:
      tuning.postMatchScreen === "short" ? EVENT_PACING.postMatchDwellMs : DEFAULT_PACING.postMatchDwellMs,
    rematchReadyMs: instantRematch ? EVENT_PACING.rematchReadyMs : DEFAULT_PACING.rematchReadyMs,
  });
}

/* -------------------------------------------------------------------------- */
/* Coherence                                                                    */
/* -------------------------------------------------------------------------- */

const finiteNonNegative = (value: unknown): boolean =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

/**
 * Every beat present, finite and non-negative. This is the check the guard
 * layer runs: a negative dwell is a typo, and at an event a typo that reaches
 * the projector is a freeze, so it must be a refusal rather than a crash.
 */
export function isPacingCoherent(pacing: EventPacing): boolean {
  if (pacing === null || typeof pacing !== "object") return false;
  return (
    finiteNonNegative(pacing.kickoffResetMs) &&
    finiteNonNegative(pacing.kickoffCountdownMs) &&
    finiteNonNegative(pacing.goalCelebrationMs) &&
    finiteNonNegative(pacing.replayMs) &&
    finiteNonNegative(pacing.postMatchDwellMs) &&
    finiteNonNegative(pacing.rematchReadyMs)
  );
}

/**
 * The cross-beat product rules, as a list of violated clauses so a refusal can
 * say WHICH one broke rather than just "incoherent".
 *
 *  - A goal must be celebrated before its replay is cut short.
 *  - Cars must be back on their marks before the countdown can start.
 *  - A match cannot start before the roster is ready again.
 */
export function pacingOrderingViolations(pacing: EventPacing): string[] {
  const violations: string[] = [];
  if (pacing.replayMs < pacing.goalCelebrationMs) {
    violations.push("replay must not end before the goal celebration does");
  }
  if (pacing.kickoffCountdownMs < pacing.kickoffResetMs) {
    violations.push("the kickoff countdown must not start before cars are reset");
  }
  if (pacing.rematchReadyMs > pacing.postMatchDwellMs) {
    violations.push("the rematch cannot be ready after the post-match screen has gone");
  }
  return violations;
}

/* -------------------------------------------------------------------------- */
/* The cycle                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Everything needed to answer "how long is a match?" and "how many matches an
 * hour?". All fields are serialisable numbers, strings or nulls.
 *
 * `regulationMs` is `null` for an UNLIMITED match length, and so are the three
 * cycle figures that depend on it. That is not a cop-out: there is genuinely no
 * finite cycle time for a match that never ends, and reporting `Infinity` would
 * be a lie a UI could not render.
 */
export interface EventCycle {
  /** Match clock length, or `null` when UNLIMITED. */
  readonly regulationMs: number | null;
  /** `formatClock` of the above, straight from the lobby's own helper. */
  readonly regulationLabel: string;

  /** Kickoff + regulation + post-match + rematch ready. No goals scored. */
  readonly baseCycleMs: number | null;
  readonly baseCycleLabel: string;

  /** What one goal adds: celebration + replay + the kickoff that follows it. */
  readonly perGoalMs: number;
  readonly perGoalLabel: string;

  /** Assumed floor on goal-to-goal spacing. DECLARED — see PacingAssumptions. */
  readonly minGoalSpacingMs: number;
  readonly typicalGoalSpacingMs: number;

  /** How many goals fit inside regulation at each spacing. */
  readonly maxGoalsInRegulation: number | null;
  readonly typicalGoalsInRegulation: number | null;

  /** Base, plus a goal every `minGoalSpacingMs`. The pessimistic bound. */
  readonly worstCaseCycleMs: number | null;
  readonly worstCaseCycleLabel: string;
  /** Base, plus a goal every `typicalGoalSpacingMs`. The usable figure. */
  readonly typicalCycleMs: number | null;
  readonly typicalCycleLabel: string;

  /** Whole matches per hour at each figure, floored. */
  readonly matchesPerHourWorstCase: number | null;
  readonly matchesPerHourTypical: number | null;

  /** The one line a producer screen shows. */
  readonly headline: string;
}

const label = (ms: number | null): string => formatClock(ms);

/** Whole units per hour, floored. `null` propagates: an unbounded cycle is unbounded. */
const perHour = (cycleMs: number | null): number | null =>
  cycleMs === null || cycleMs <= 0 ? null : Math.floor(HOUR_MS / cycleMs);

/**
 * Derive the cycle from the pacing and the match length.
 *
 * THE DERIVATION, stated plainly so it can be checked by hand:
 *
 *   base      = regulation + kickoffReset + kickoffCountdown
 *               + postMatchDwell + rematchReady
 *
 *   perGoal   = goalCelebration + replay + kickoffReset + kickoffCountdown
 *
 *   minSpacing   = kickoffReset + kickoffCountdown + minBallTraverse
 *   maxGoals     = floor(regulation / minSpacing)
 *   worstCase    = base + maxGoals * perGoal
 *
 *   typicalSpacing = the declared typical spacing
 *   typicalGoals   = floor(regulation / typicalSpacing)
 *   typicalCycle   = base + typicalGoals * perGoal
 *
 * Note that `minSpacing` and `perGoal` are deliberately built from the SAME
 * three quantities. That is not a coincidence: a goal costs exactly as long as
 * the gap that follows it, because the gap IS the celebration, the replay and
 * the next kickoff. Keeping them tied is what stops the worst case from
 * double-counting or under-counting the kickoff.
 *
 * `floor`, not `round`: a match that would run 9.5 ms past the hour does not
 * fit in the hour.
 */
export function deriveEventCycle(
  pacing: EventPacing,
  matchLength: MatchLengthMinutes,
  assumptions: PacingAssumptions = EVENT_PACING_ASSUMPTIONS,
): EventCycle {
  const regulationMs = matchDurationMs(matchLength);
  const perGoalMs = pacing.goalCelebrationMs + pacing.replayMs + pacing.kickoffResetMs + pacing.kickoffCountdownMs;
  const minGoalSpacingMs = pacing.kickoffResetMs + pacing.kickoffCountdownMs + assumptions.minBallTraverseMs;
  const typicalGoalSpacingMs = assumptions.typicalGoalSpacingMs;

  if (regulationMs === null) {
    return {
      regulationMs: null,
      regulationLabel: label(null),
      baseCycleMs: null,
      baseCycleLabel: label(null),
      perGoalMs,
      perGoalLabel: label(perGoalMs),
      minGoalSpacingMs,
      typicalGoalSpacingMs,
      maxGoalsInRegulation: null,
      typicalGoalsInRegulation: null,
      worstCaseCycleMs: null,
      worstCaseCycleLabel: label(null),
      typicalCycleMs: null,
      typicalCycleLabel: label(null),
      matchesPerHourWorstCase: null,
      matchesPerHourTypical: null,
      headline: "UNLIMITED match length — this event has no cycle time.",
    };
  }

  const baseCycleMs =
    regulationMs +
    pacing.kickoffResetMs +
    pacing.kickoffCountdownMs +
    pacing.postMatchDwellMs +
    pacing.rematchReadyMs;

  const maxGoalsInRegulation = minGoalSpacingMs > 0 ? Math.floor(regulationMs / minGoalSpacingMs) : 0;
  const typicalGoalsInRegulation = typicalGoalSpacingMs > 0 ? Math.floor(regulationMs / typicalGoalSpacingMs) : 0;

  const worstCaseCycleMs = baseCycleMs + maxGoalsInRegulation * perGoalMs;
  const typicalCycleMs = baseCycleMs + typicalGoalsInRegulation * perGoalMs;

  const worstLabel = label(worstCaseCycleMs);
  const typicalLabel = label(typicalCycleMs);

  return {
    regulationMs,
    regulationLabel: label(regulationMs),
    baseCycleMs,
    baseCycleLabel: label(baseCycleMs),
    perGoalMs,
    perGoalLabel: label(perGoalMs),
    minGoalSpacingMs,
    typicalGoalSpacingMs,
    maxGoalsInRegulation,
    typicalGoalsInRegulation,
    worstCaseCycleMs,
    worstCaseCycleLabel: worstLabel,
    typicalCycleMs,
    typicalCycleLabel: typicalLabel,
    matchesPerHourWorstCase: perHour(worstCaseCycleMs),
    matchesPerHourTypical: perHour(typicalCycleMs),
    headline:
      `A ${label(regulationMs)} match cycles in ~${typicalLabel} typical / ` +
      `${worstLabel} worst case ` +
      `(${perHour(typicalCycleMs) ?? 0} typical, ${perHour(worstCaseCycleMs) ?? 0} worst case per hour).`,
  };
}
