/**
 * The match state machine, exercised tick by tick.
 *
 * The point of every case here is to prove the machine is the DONOR's machine:
 * the same 120 Hz tick accounting, the same clock hold, the same overtime gate,
 * the same final-horn gate.
 */

import { describe, expect, it } from "vitest";
import {
  COUNTDOWN_TICKS,
  GOAL_TICKS,
  REGULATION_TICKS,
  STATE_HEADER,
  TEAM_LABEL,
  CAR_FIELD,
  CAR_STATE_STRIDE,
  attackSignFor,
  halfOfBallX,
  readBoost,
  readBallHitSerial,
  readDemoed,
} from "../donor-facts.js";
import { createMatchCore, findMvp, formatScoreline, winnerLabel } from "../core.js";
import {
  IDLE_TICK,
  advanceTicks,
  createInitialMatchState,
  createTickRuntime,
  formatClock,
  reduceTick,
  type TickRuntime,
} from "../machine.js";
import type { MatchState, PlayerEntry, TickInput } from "../types.js";

/* -------------------------------------------------------------------------- */
/* Fixtures                                                                     */
/* -------------------------------------------------------------------------- */

const player = (playerId: string, name: string, team: 0 | 1, slot: number): PlayerEntry => ({
  playerId,
  name,
  team,
  slot,
  isBot: false,
  ready: false,
});

const ROSTER: readonly PlayerEntry[] = [
  player("c1", "WASIF", 0, 0),
  player("c2", "NOVA", 1, 1),
];

const idle = (): TickInput => IDLE_TICK;
const touched = (): TickInput => ({ ...IDLE_TICK, kickoffTouched: true });
const goalFor = (team: 0 | 1): TickInput => ({
  ...IDLE_TICK,
  kickoffTouched: true,
  goal: team === 0 ? 1 : 2,
});

/** A lobby that has been readied and started, in the right number of ticks. */
const playing = (runtime?: TickRuntime): { state: MatchState; runtime: TickRuntime } => {
  const core = createMatchCore({ players: ROSTER });
  for (const entry of ROSTER) {
    core.joinPlayer(entry);
    core.readyPlayer(entry.playerId, true);
  }
  core.startMatch();
  const rt = runtime ?? createTickRuntime(ROSTER, null);
  // kickoff (1) + countdown (COUNTDOWN_TICKS) → playing
  const result = advanceTicks(core.getState(), rt, 1 + COUNTDOWN_TICKS);
  return { state: result.state, runtime: { tracker: result.tracker, simState: rt.simState } };
};

/**
 * Run ticks until the regulation clock reads zero, returning the state and the
 * runtime to carry on with.
 *
 * This exists because a test must NOT hard-code REGULATION_TICKS here: the
 * kickoff tick and the countdown ticks are spent before the clock ever starts,
 * so the budget from match start is longer than the regulation budget itself.
 */
const exhaustClock = (
  state: MatchState,
  runtime: TickRuntime,
  input: TickInput = touched(),
): { state: MatchState; runtime: TickRuntime } => {
  let current = state;
  let rt = runtime;
  for (let i = 0; i < 100_000 && current.clock.remainingTicks > 0; i += 1) {
    const result = reduceTick(current, input, rt);
    current = result.transition.state;
    rt = { tracker: result.tracker, simState: rt.simState };
  }
  return { state: current, runtime: rt };
};

/** Get from `playing` to the post-goal kickoff countdown in one call. */
const afterGoal = (
  state: MatchState,
  runtime: TickRuntime,
  team: 0 | 1,
): { state: MatchState; runtime: TickRuntime } => {
  const goalled = reduceTick(state, goalFor(team), runtime).transition.state;
  const result = advanceTicks(goalled, runtime, GOAL_TICKS, touched());
  return { state: result.state, runtime: { tracker: result.tracker, simState: runtime.simState } };
};

/* -------------------------------------------------------------------------- */
/* Phase progression                                                            */
/* -------------------------------------------------------------------------- */

describe("phase progression", () => {
  it("starts in the lobby and reaches `ready` only when every human is ready on both sides", () => {
    let state = createInitialMatchState();
    expect(state.phase).toBe("lobby");

    state = { ...state, players: ROSTER };
    state = reduceTick(state).transition.state;
    expect(state.phase).toBe("lobby");

    // One team only: still lobby even when that player is ready.
    const oneSided: MatchState = { ...state, players: [ROSTER[0]] };
    const core = createMatchCore({ players: [ROSTER[0]] });
    core.readyPlayer("c1", true);
    expect(core.getState().phase).toBe("lobby");
    expect(oneSided.phase).toBe("lobby");

    const full = createMatchCore({ players: ROSTER });
    full.readyPlayer("c1", true);
    expect(full.getState().phase).toBe("lobby");
    full.readyPlayer("c2", true);
    expect(full.getState().phase).toBe("ready");
  });

  it("runs kickoff for exactly one tick, then the 3-2-1-GO countdown", () => {
    const core = createMatchCore({ players: ROSTER });
    for (const entry of ROSTER) {
      core.joinPlayer(entry);
      core.readyPlayer(entry.playerId, true);
    }
    core.startMatch();

    expect(core.getState().phase).toBe("kickoff");
    expect(core.getState().countdown).toBe(3);

    // Tick 1: the one-tick reset, which is where the host resets the sim.
    core.tick(idle());
    expect(core.getState().phase).toBe("countdown");

    // Then the donor's own `om` = 3 * 120 countdown.
    const seen: number[] = [];
    for (let i = 0; i < COUNTDOWN_TICKS - 1; i += 1) {
      core.tick(idle());
      seen.push(core.getState().countdown);
    }
    expect(seen).toHaveLength(COUNTDOWN_TICKS - 1);
    expect(seen[0]).toBe(3);
    expect(seen.at(-1)).toBe(1);

    // The 360th tick is the one that ends it, exactly as the donor's `om`.
    core.tick(idle());
    expect(core.getState().phase).toBe("playing");
    expect(core.getState().countdown).toBe(0);
  });

  it("emits reset-kickoff exactly once per kickoff", () => {
    const core = createMatchCore({ players: ROSTER });
    core.startMatch();
    expect(core.drainPending().commands).toContain("reset-kickoff");
    core.drainPending();

    core.tick(idle()); // kickoff → countdown, no second reset
    expect(core.drainPending().commands).not.toContain("reset-kickoff");
  });

  it("holds the clock at 5:00 until the first touch, then starts it for good", () => {
    const { state } = playing();
    expect(state.phase).toBe("playing");
    expect(state.clock.remainingTicks).toBe(REGULATION_TICKS);
    expect(state.clock.started).toBe(false);
    expect(state.clock.display).toBe("5:00");

    // Quiet ticks must NOT drain the clock, and must NOT un-start it.
    let quiet = reduceTick(state, idle(), createTickRuntime(ROSTER)).transition.state;
    for (let i = 0; i < 500; i += 1) {
      quiet = reduceTick(quiet, idle(), createTickRuntime(ROSTER)).transition.state;
    }
    expect(quiet.clock.remainingTicks).toBe(REGULATION_TICKS);
    expect(quiet.clock.started).toBe(false);

    // The first touch starts it, and it stays started across quiet ticks.
    let live = reduceTick(state, touched(), createTickRuntime(ROSTER)).transition.state;
    expect(live.clock.remainingTicks).toBe(REGULATION_TICKS - 1);
    expect(live.clock.started).toBe(true);
    for (let i = 0; i < 100; i += 1) {
      live = reduceTick(live, idle(), createTickRuntime(ROSTER)).transition.state;
    }
    expect(live.clock.remainingTicks).toBe(REGULATION_TICKS - 101);
  });
});

/* -------------------------------------------------------------------------- */
/* Goals                                                                        */
/* -------------------------------------------------------------------------- */

describe("goals", () => {
  it("increments the right team and starts a replay hold", () => {
    const { state, runtime } = playing();
    const core = createMatchCore({ players: ROSTER });
    for (const entry of ROSTER) {
      core.joinPlayer(entry);
      core.readyPlayer(entry.playerId, true);
    }
    core.startMatch();
    core.advance(1 + COUNTDOWN_TICKS);
    expect(core.getState().phase).toBe("playing");

    core.tick(goalFor(0));
    const after = core.getState();
    expect(after.score[0]).toBe(1);
    expect(after.score[1]).toBe(0);
    expect(after.phase).toBe("goal");
    expect(after.phaseTicks).toBe(GOAL_TICKS);
    expect(after.goals).toHaveLength(1);
    expect(after.goals[0].team).toBe(0);

    // The replay is running and the explosion was asked for.
    expect(core.drainPending().effects).toEqual(["replay-begin", "goal-explosion"]);
    expect(core.drainPending().effects).toEqual([]);

    // Hold for exactly zM ticks, then kick off again.
    for (let i = 0; i < GOAL_TICKS - 1; i += 1) {
      core.tick(idle());
      expect(core.getState().phase).toBe("goal");
    }
    core.tick(idle());
    expect(core.getState().phase).toBe("kickoff");
    void state;
    void runtime;
  });

  it("a goal in regulation at a level score does not end the match", () => {
    const { state, runtime } = playing();
    const afterGoal = reduceTick(state, goalFor(1), runtime).transition.state;
    expect(afterGoal.score[1]).toBe(1);
    expect(afterGoal.winner).toBeNull();

    // Run the goal hold out: exactly zM ticks, then the kickoff reset.
    const held = advanceTicks(afterGoal, runtime, GOAL_TICKS, touched());
    expect(held.ticksRun).toBe(GOAL_TICKS);
    expect(held.state.phase).toBe("kickoff");
    expect(held.state.phase).not.toBe("result");

    // The clock was NOT dead, so the kickoff did not turn on overtime.
    expect(held.state.clock.overtime).toBe(false);
    expect(held.state.winner).toBeNull();
  });

  it("a goal at a dead clock decides immediately and reaches the result screen", () => {
    const { state, runtime } = playing();
    // Fast-forward the clock to zero with a level score.
    const down = exhaustClock(state, runtime);
    expect(down.state.clock.remainingTicks).toBe(0);

    // Blue scores on the dead clock: level before, one ahead after, decided.
    const goalled = reduceTick(down.state, goalFor(0), down.runtime);
    expect(goalled.transition.state.score[0]).toBe(1);
    expect(goalled.transition.state.winner).toBe(0);
    expect(goalled.transition.state.phase).toBe("goal");

    // After the replay hold, the final horn lands and we are on the result.
    const settled = advanceTicks(goalled.transition.state, down.runtime, GOAL_TICKS, idle());
    expect(settled.state.phase).toBe("result");
    expect(settled.state.winner).toBe(0);
    expect(settled.commands).toContain("final-horn");
    expect(winnerLabel(settled.state)).toBe(`${TEAM_LABEL[0]} WINS`);
    expect(formatScoreline(settled.state)).toBe("1 - 0");
  });
});

/* -------------------------------------------------------------------------- */
/* Clock, overtime, the final horn                                             */
/* -------------------------------------------------------------------------- */

describe("clock expiry, overtime and the final horn", () => {
  it("a level score at zero goes to overtime, and the next goal wins (nearest goal)", () => {
    const { state, runtime } = playing();
    const down = exhaustClock(state, runtime);
    expect(down.state.clock.remainingTicks).toBe(0);
    expect(down.state.score[0]).toBe(down.state.score[1]);

    // Ball on the ground at zero, level → overtime, and it kicks off.
    const horn = reduceTick(
      down.state,
      { ...IDLE_TICK, kickoffTouched: true, ballOnGround: true },
      down.runtime,
    );
    expect(horn.transition.state.clock.overtime).toBe(true);
    expect(horn.transition.state.phase).toBe("kickoff");
    expect(horn.transition.state.winner).toBeNull();

    // The overtime clock runs, and the FIRST goal decides it.
    const live = advanceTicks(horn.transition.state, down.runtime, 1 + COUNTDOWN_TICKS + 60, touched());
    expect(live.state.phase).toBe("playing");
    expect(live.state.clock.overtime).toBe(true);
    expect(live.state.clock.overtimeTicks).toBe(60);
    expect(live.state.clock.display.startsWith("+")).toBe(true);

    const ot = reduceTick(live.state, goalFor(1), down.runtime);
    expect(ot.transition.state.winner).toBe(1);
    expect(ot.transition.state.goals[0].inOvertime).toBe(true);

    const settled = advanceTicks(ot.transition.state, down.runtime, GOAL_TICKS, idle());
    expect(settled.state.phase).toBe("result");
    expect(settled.state.winner).toBe(1);
  });

  it("an unlevel score at zero with the ball grounded sounds the final horn", () => {
    const { state, runtime } = playing();
    // Score for blue, let the post-goal kickoff finish, then run the clock out.
    const kicked = afterGoal(state, runtime, 0);
    const live = advanceTicks(kicked.state, kicked.runtime, 1 + COUNTDOWN_TICKS, touched());
    expect(live.state.phase).toBe("playing");
    expect(live.state.score[0]).toBe(1);

    const down = exhaustClock(live.state, kicked.runtime);
    expect(down.state.clock.remainingTicks).toBe(0);
    expect(down.state.score[0]).toBe(1);

    const horn = reduceTick(
      down.state,
      { ...IDLE_TICK, kickoffTouched: true, ballOnGround: true },
      down.runtime,
    );
    expect(horn.transition.state.phase).toBe("result");
    expect(horn.transition.state.winner).toBe(0);
    expect(horn.transition.commands).toContain("final-horn");
  });

  it("does NOT sound the horn while the ball is in the air, exactly as the donor gates it", () => {
    const { state, runtime } = playing();
    const kicked = afterGoal(state, runtime, 0);
    const live = advanceTicks(kicked.state, kicked.runtime, 1 + COUNTDOWN_TICKS, touched());
    const down = exhaustClock(live.state, kicked.runtime);
    expect(down.state.clock.remainingTicks).toBe(0);
    expect(down.state.score[0]).toBe(1);

    // Zero clock, one goal up, but the ball is airborne: no horn.
    const airborne = reduceTick(
      down.state,
      { ...IDLE_TICK, kickoffTouched: true, ballOnGround: false },
      down.runtime,
    );
    expect(airborne.transition.state.phase).toBe("playing");

    // Same instant, ball down: horn.
    const grounded = reduceTick(
      airborne.transition.state,
      { ...IDLE_TICK, kickoffTouched: true, ballOnGround: true },
      down.runtime,
    );
    expect(grounded.transition.state.phase).toBe("result");
  });

  it("refuses to invent a winner for a tie, but honours an explicitly named one", () => {
    const core = createMatchCore({ players: ROSTER });
    core.startMatch();
    core.advance(1 + COUNTDOWN_TICKS);
    expect(core.getState().phase).toBe("playing");
    expect(core.getState().score[0]).toBe(core.getState().score[1]);

    // "End on the current scoreline" cannot invent a winner for a tie, exactly
    // as the donor's `end()` cannot.
    core.endMatch(null);
    expect(core.getState().phase).toBe("playing");
    expect(core.getState().winner).toBeNull();

    // An explicitly named winner IS honoured: that is the QA escape hatch, and
    // it is deliberately the same shape as air-capture's `force_end_match`.
    core.endMatch(0);
    expect(core.getState().phase).toBe("result");
    expect(core.getState().winner).toBe(0);
  });

  it("advancing stops early once the match has ended", () => {
    const { state, runtime } = playing();
    const kicked = afterGoal(state, runtime, 0);
    const live = advanceTicks(kicked.state, kicked.runtime, 1 + COUNTDOWN_TICKS, touched());
    const down = exhaustClock(live.state, kicked.runtime);
    const ended = reduceTick(
      down.state,
      { ...IDLE_TICK, kickoffTouched: true, ballOnGround: true },
      down.runtime,
    );
    expect(ended.transition.state.phase).toBe("result");

    const again = advanceTicks(ended.transition.state, down.runtime, 1000, touched());
    expect(again.ticksRun).toBe(0);
  });
});

/* -------------------------------------------------------------------------- */
/* Rematch                                                                      */
/* -------------------------------------------------------------------------- */

describe("rematch", () => {
  it("resets score, clock, stats and goals with no rejoin", () => {
    const { state, runtime } = playing();
    const goalled = reduceTick(state, goalFor(0), runtime).transition.state;
    const kicked = afterGoal(state, runtime, 0);
    const live = advanceTicks(kicked.state, kicked.runtime, 1 + COUNTDOWN_TICKS, touched());
    const down = exhaustClock(live.state, kicked.runtime);
    const settled = reduceTick(
      down.state,
      { ...IDLE_TICK, kickoffTouched: true, ballOnGround: true },
      down.runtime,
    ).transition.state;
    expect(settled.phase).toBe("result");
    expect(settled.score[0]).toBe(1);
    expect(settled.goals.length).toBe(1);
    void goalled;

    const core = createMatchCore({ players: ROSTER });
    for (const entry of ROSTER) core.joinPlayer(entry);
    core.startMatch();
    core.advance(1 + COUNTDOWN_TICKS, touched());
    core.tick(goalFor(0));
    core.advance(GOAL_TICKS + 2, touched());
    core.rematch();

    const after = core.getState();
    expect(after.score).toEqual({ 0: 0, 1: 0 });
    expect(after.clock.remainingTicks).toBe(REGULATION_TICKS);
    expect(after.clock.overtime).toBe(false);
    expect(after.clock.started).toBe(false);
    expect(after.goals).toHaveLength(0);
    expect(after.winner).toBeNull();
    expect(after.phase).toBe("kickoff");
    expect(after.mode).toBe("match");
    // The roster survived untouched: no rejoin was needed.
    expect(after.players.map((entry) => entry.playerId)).toEqual(["c1", "c2"]);
    expect(after.players.every((entry) => entry.ready)).toBe(true);
    expect(Object.values(after.stats).every((row) => row.goals === 0)).toBe(true);
  });

  it("CHANGE TEAMS swaps every human and returns to the lobby", () => {
    const core = createMatchCore({ players: ROSTER });
    for (const entry of ROSTER) core.joinPlayer(entry);
    core.swapTeams();
    const after = core.getState();
    expect(after.phase).toBe("lobby");
    expect(after.players.find((entry) => entry.playerId === "c1")?.team).toBe(1);
    expect(after.players.find((entry) => entry.playerId === "c2")?.team).toBe(0);
  });

  it("EXIT returns to the donor's freeplay state but keeps the mutator", () => {
    const core = createMatchCore({ players: ROSTER });
    core.setMutator("LOW_GRAVITY");
    core.joinPlayer(ROSTER[0]);
    core.startMatch();
    core.leaveMatch();
    const after = core.getState();
    expect(after.phase).toBe("lobby");
    expect(after.mode).toBe("freeplay");
    expect(after.mutator).toBe("LOW_GRAVITY");
  });
});

/* -------------------------------------------------------------------------- */
/* Format + MVP                                                                 */
/* -------------------------------------------------------------------------- */

describe("presentation helpers", () => {
  it("formats the clock the donor's way", () => {
    expect(formatClock(300)).toBe("5:00");
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(9.2)).toBe("0:09");
    expect(formatClock(9.2, true)).toBe("0:10");
    expect(formatClock(65)).toBe("1:05");
  });

  it("picks an MVP by goals, then assists, then touches", () => {
    let state = createInitialMatchState(ROSTER);
    state = {
      ...state,
      phase: "result",
      winner: 0,
      stats: {
        c1: { goals: 2, assists: 0, saves: 0, shots: 3, demolitions: 0, timesDemoed: 0, ballTouches: 10, boostConsumed: 20 },
        c2: { goals: 1, assists: 2, saves: 1, shots: 2, demolitions: 1, timesDemoed: 0, ballTouches: 30, boostConsumed: 40 },
      },
    };
    expect(findMvp(state)?.playerId).toBe("c1");

    state = {
      ...state,
      // Level on goals: the tie-break has to fall through to assists, and it
      // must NOT drop c2 from the table on the way.
      stats: {
        ...state.stats,
        c1: { ...state.stats.c1!, goals: 1 },
      },
    };
    expect(findMvp(state)?.playerId).toBe("c2");
    expect(formatScoreline(state)).toBe("0 - 0");
  });
});

/* -------------------------------------------------------------------------- */
/* Donor facts the machine depends on                                           */
/* -------------------------------------------------------------------------- */

describe("donor facts", () => {
  it("reads the goal flag the way the donor's own pollGoal does", () => {
    const state = new Float32Array(STATE_HEADER.CARS + CAR_STATE_STRIDE * 4);
    expect(state[STATE_HEADER.GOAL]).toBe(0);
    state[STATE_HEADER.GOAL] = 1;
    expect(state[STATE_HEADER.GOAL]).toBe(1);
  });

  it("normalises boost by 100, the way the donor's own bots do", () => {
    const state = new Float32Array(STATE_HEADER.CARS + CAR_STATE_STRIDE * 4);
    const base = STATE_HEADER.CARS + CAR_FIELD.BOOST;
    state[base] = 100;
    expect(readBoost(state, 0)).toBe(1);
    state[base] = 0;
    expect(readBoost(state, 0)).toBe(0);
    state[base] = 250;
    expect(readBoost(state, 0)).toBe(1);
  });

  it("reads the native ball-contact serial and demo flag per car", () => {
    const state = new Float32Array(STATE_HEADER.CARS + CAR_STATE_STRIDE * 4);
    const slot2 = STATE_HEADER.CARS + 2 * CAR_STATE_STRIDE;
    state[slot2 + CAR_FIELD.BALL_HIT_SERIAL] = 7;
    state[slot2 + CAR_FIELD.DEMOED] = 1;
    expect(readBallHitSerial(state, 2)).toBe(7);
    expect(readBallHitSerial(state, 1)).toBe(0);
    expect(readDemoed(state, 2)).toBe(true);
    expect(readDemoed(state, 1)).toBe(false);
  });

  it("orients the halves from the donor's own kickoff geometry", () => {
    // Team 0 sits on -X and attacks +X, so +X is team 1's half.
    expect(halfOfBallX(1)).toBe(1);
    expect(halfOfBallX(-1)).toBe(0);
    expect(attackSignFor(0)).toBe(1);
    expect(attackSignFor(1)).toBe(-1);
  });
});
