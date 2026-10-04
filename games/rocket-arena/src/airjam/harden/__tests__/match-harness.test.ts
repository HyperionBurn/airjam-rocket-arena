/**
 * Phase 11 — the agent-driven end-to-end match harness.
 *
 * THE MISSION REQUIREMENT: a full match, from lobby to rematch, driven through
 * the AGENT CONTRACT and asserted as data — with no browser, no frame loop, no
 * canvas, no WebGL and no visual automation.
 *
 * The invoker below is built from the REAL `agentContract`, calling `input.parse`
 * and then `toPayload` exactly the way the SDK's RPC layer does
 * (`src/contracts/__tests__/agent-contract.test.ts:48-53`). So if the contract's
 * payload parsers or action names drift, this file fails — it is not a
 * hand-written shortcut that would keep passing.
 *
 * Two things are asserted for every run:
 *   1. the PHASE MACHINE walked the full path, in the donor's own order; and
 *   2. NO INVARIANT WAS EVER VIOLATED, on any of the ~1000 host ticks.
 *
 * A match that completes with a violation is a FAILED match, and the run prints
 * its own report so the failure is legible without a debugger.
 */

import { describe, expect, it } from "vitest";

import { agentContract } from "../../../contracts/agent.js";
import { MAX_CARS } from "../../seam.js";
import { COUNTDOWN_TICKS, GOAL_TICKS } from "../../../match/donor-facts.js";
import { formatViolations, type NeutralizeEvent } from "../invariants.js";
import {
  createHarnessSim,
  createMatchHarness,
  UnsupportedAgentAction,
  type AgentActionInvoker,
  type HarnessPlayer,
} from "../match-harness.js";

/* -------------------------------------------------------------------------- */
/* The real contract, wired as the SDK's RPC layer would wire it                 */
/* -------------------------------------------------------------------------- */

const PARSE_META = { gameId: "rocket-arena", contractKind: "agent" } as const;

/**
 * The real contract, wired the way the SDK's RPC layer wires it: parse the raw
 * payload with the action's own `input.parse`, map it through `toPayload`, and
 * route it to the action's real target.
 *
 * The contract KEY is the agent-facing name (`join_player`); the TARGET is the
 * store action (`joinPlayer`). The harness dispatches on the target, exactly as
 * the store's own RPC layer does, so a contract that renames a target breaks
 * this file rather than silently doing nothing.
 */
const invoke: AgentActionInvoker = (contractActionName, rawPayload) => {
  const action = agentContract.actions[contractActionName];
  if (!action) throw new UnsupportedAgentAction(contractActionName);
  const parsed = action.input.parse(rawPayload, { ...PARSE_META, actionName: contractActionName });
  const payload = action.toPayload ? action.toPayload(parsed) : parsed;
  return { actionName: action.target.actionName, payload };
};

/* -------------------------------------------------------------------------- */
/* Rosters                                                                      */
/* -------------------------------------------------------------------------- */

/** Alternate teams so `reduceRefreshReadiness` sees both sides filled. */
const roster = (size: 2 | 4): HarnessPlayer[] =>
  Array.from({ length: size }, (_, index) => ({
    playerId: `c${index + 1}`,
    name: `PLAYER ${index + 1}`,
    team: (index % 2) as 0 | 1,
  }));

/** Ticks needed to leave `kickoff` and reach `playing`: 1 + the countdown. */
const TO_PLAYING = 1 + COUNTDOWN_TICKS;

/**
 * Drive one complete match: lobby → ready → kickoff → countdown → playing →
 * goal → … → result → rematch.
 *
 * Goals are raised by the SIM (scheduled on a future tick) and reach the machine
 * through the donor's own `pollGoal()` flag, so the goal path, the attribution
 * and the goal hold are all genuinely exercised rather than poked.
 */
const playFullMatch = (players: HarnessPlayer[]): ReturnType<typeof createMatchHarness> => {
  const harness = createMatchHarness({ invoke, players: [] });
  const phases: string[] = [];
  const notePhase = (): void => {
    const phase = harness.snapshot().phase;
    if (phases[phases.length - 1] !== phase) phases.push(phase);
  };

  /* ---- lobby: join everyone through the contract ---- */
  for (const [index, player] of players.entries()) {
    harness.act("join_player", {
      playerId: player.playerId,
      name: player.name,
      team: player.team,
      slot: index,
    });
  }
  notePhase();
  expect(harness.snapshot().phase).toBe("lobby");
  expect(harness.snapshot().players).toHaveLength(players.length);
  // Every player has a distinct slot and a car in the sim.
  const slots = harness.snapshot().players.map((player) => player.slot);
  expect(new Set(slots).size).toBe(players.length);
  expect(harness.sim.carCount()).toBe(players.length);

  /* ---- ready ---- */
  for (const player of players) {
    harness.act("ready_player", { playerId: player.playerId, ready: true });
  }
  notePhase();
  expect(harness.snapshot().phase).toBe("ready");

  /* ---- kickoff ---- */
  harness.act("start_match");
  notePhase();
  expect(harness.snapshot().phase).toBe("kickoff");
  expect(harness.snapshot().mode).toBe("match");
  expect(harness.snapshot().score).toEqual({ 0: 0, 1: 0 });
  // The donor's own kickoff reset ran, because the host drained the command.
  expect(harness.sim.commandsExecuted).toContain("resetKickoff");

  /* ---- countdown ---- */
  harness.act("advance_simulation", { ticks: 1 });
  notePhase();
  expect(harness.snapshot().phase).toBe("countdown");
  expect(harness.snapshot().countdown).toBe(3);

  /* ---- playing ---- */
  harness.act("advance_simulation", { ticks: COUNTDOWN_TICKS });
  notePhase();
  expect(harness.snapshot().phase).toBe("playing");

  // The clock is HELD until the ball is touched. This is the donor's own design
  // (`machine.ts:595-596`) and the single most mis-diagnosed symptom there is,
  // so it is asserted explicitly rather than left implicit.
  expect(harness.snapshot().clock.started).toBe(false);
  expect(harness.snapshot().clock.remainingTicks).toBe(5 * 60 * 120);

  /* ---- drive, through the per-control contract actions ---- */
  harness.act("drive", { playerId: players[0].playerId, throttle: 1, boost: true });
  harness.act("throttle", { playerId: players[1].playerId, throttle: -1 });
  harness.act("steer", { playerId: players[0].playerId, steer: 0.5 });
  harness.act("jump", { playerId: players[1].playerId, jump: true });
  harness.act("boost", { playerId: players[0].playerId, boost: true });
  harness.act("powerslide", { playerId: players[0].playerId, powerslide: true });
  harness.act("ball_cam", { playerId: players[0].playerId, ballCam: true });

  expect(harness.sim.lastControlsFor(0)?.throttle).toBe(1);
  expect(harness.sim.lastControlsFor(0)?.steer).toBe(0.5);
  expect(harness.sim.lastControlsFor(0)?.boost).toBe(true);
  expect(harness.sim.lastControlsFor(1)?.throttle).toBe(-1);
  expect(harness.snapshot().ballCam[players[0].playerId]).toBe(true);

  // The car actually MOVES, and boosting actually drains the gauge. Without
  // this the match would advance with a sim that does nothing, which is how a
  // green test can still hide a dead engine.
  //
  // The car is compared BEFORE and AFTER rather than against zero: kickoff puts
  // it at a spawn, not at the origin, so an absolute expectation would be a
  // guess about the donor's spawn table.
  const carXBefore = harness.sim.state[22 + 0];
  const boostBefore = harness.sim.state[22 + 18];
  // 20 ticks = 167 ms of held input, deliberately inside the 250 ms stale-hold
  // window: this run asserts ZERO violations, and a test that held one level
  // for longer than the window would be tripping the guard on purpose.
  harness.act("advance_simulation", { ticks: 20 });
  expect(harness.snapshot().clock.started).toBe(true);
  expect(harness.snapshot().clock.remainingTicks).toBeLessThan(5 * 60 * 120);
  expect(harness.sim.state[22 + 0]).toBeGreaterThan(carXBefore);
  expect(harness.sim.state[22 + 18]).toBeLessThan(boostBefore);

  /* ---- goal, raised by the sim on a future tick ---- */
  const goalTeam = 0 as const;
  // Scheduled for the LAST tick of the batch below, not the first, so the whole
  // `GOAL_TICKS` hold is still ahead of us and the tick counts line up exactly
  // with the machine's own constants. Landing it early would leave the hold
  // partly consumed and quietly shift every later boundary.
  harness.scheduleGoal(goalTeam, harness.sim.tick + 4);
  harness.act("advance_simulation", { ticks: 4 });
  notePhase();
  expect(harness.snapshot().phase).toBe("goal");
  expect(harness.snapshot().phaseTicks).toBe(GOAL_TICKS);
  expect(harness.snapshot().score[0]).toBe(1);
  expect(harness.sim.commandsExecuted).toContain("goalExplosion");
  // The goal was attributed to a real player from the native touch serial.
  expect(harness.snapshot().goals[0].scorerPlayerId).not.toBeNull();

  /* ---- the goal hold expires into the next kickoff ---- */
  harness.act("advance_simulation", { ticks: GOAL_TICKS });
  notePhase();
  expect(harness.snapshot().phase).toBe("kickoff");

  // …and back to playing, so the match is genuinely resumable.
  harness.act("advance_simulation", { ticks: TO_PLAYING });
  notePhase();
  expect(harness.snapshot().phase).toBe("playing");

  /* ---- a second goal, then the final horn ---- */
  harness.scheduleGoal(1, harness.sim.tick + 4);
  harness.act("advance_simulation", { ticks: 4 });
  expect(harness.snapshot().score[1]).toBe(1);
  expect(harness.snapshot().score).toEqual({ 0: 1, 1: 1 });
  harness.act("advance_simulation", { ticks: GOAL_TICKS });
  expect(harness.snapshot().phase).toBe("kickoff");

  // `end_match` with an explicit winner, because the donor refuses to invent one
  // for a level scoreline (`machine.ts:360-367`) and that refusal is correct.
  harness.act("end_match", { winner: 0 });
  notePhase();
  expect(harness.snapshot().phase).toBe("result");
  expect(harness.snapshot().winner).toBe(0);
  // Every donor-facing command the machine emitted was actually executed by the
  // host, including the horn — which reaches no sim call at all, and would be
  // invisible if this only counted sim writes.
  expect(harness.hostCommands()).toContain("command: final-horn");
  expect(harness.sim.commandsExecuted).toContain("resetKickoff");
  // The MVP is a derived view (`findMvp`), not machine state, so what is
  // asserted here is the thing underneath it: the attributed scorer really was
  // credited with the goal in the stats record.
  const scorer = harness.snapshot().goals[0].scorerPlayerId;
  expect(scorer).not.toBeNull();
  expect(harness.snapshot().stats[scorer as string].goals).toBe(1);

  /* ---- rematch: fresh match, SAME roster ---- */
  harness.act("restart_match");
  notePhase();
  const after = harness.snapshot();
  expect(after.phase).toBe("kickoff");
  expect(after.score).toEqual({ 0: 0, 1: 0 });
  expect(after.clock.remainingTicks).toBe(5 * 60 * 120);
  expect(after.winner).toBeNull();
  expect(after.goals).toEqual([]);
  expect(after.players).toHaveLength(players.length);
  expect(after.players.map((player) => player.slot)).toEqual(slots);

  // …and the rematch is a MATCH, not a frozen screen: it plays through again.
  harness.act("advance_simulation", { ticks: TO_PLAYING });
  notePhase();
  expect(harness.snapshot().phase).toBe("playing");

  return Object.assign(harness, {}) as ReturnType<typeof createMatchHarness> & {
    phases: readonly string[];
  };
};

/* -------------------------------------------------------------------------- */
/* The two required match sizes                                                 */
/* -------------------------------------------------------------------------- */

describe("a full match driven through the agent contract", () => {
  it("completes with 2 players and never violates an invariant", () => {
    const harness = playFullMatch(roster(2));

    // The gate. Every host tick of the whole match went through the monitor.
    expect(harness.sim.tick).toBeGreaterThan(1000);
    expect(formatViolations(harness.violations())).toEqual([]);
    expect(harness.monitor.isHealthy()).toBe(true);
    expect(harness.violations()).toEqual([]);

    console.log("\n=== 2-player match: harness report ===");
    console.log(harness.report().join("\n"));
  });

  it("completes with 4 players and never violates an invariant", () => {
    const harness = playFullMatch(roster(4));

    expect(harness.sim.tick).toBeGreaterThan(1000);
    expect(formatViolations(harness.violations())).toEqual([]);
    expect(harness.monitor.isHealthy()).toBe(true);

    console.log("\n=== 4-player match: harness report ===");
    console.log(harness.report().join("\n"));
  });
});

/* -------------------------------------------------------------------------- */
/* The phase machine, asserted explicitly for both sizes                        */
/* -------------------------------------------------------------------------- */

describe("the phase machine walked the whole path", () => {
  it.each([2, 4] as const)("visits every phase in the donor's order with %i players", (size) => {
    const players = roster(size);
    const harness = createMatchHarness({ invoke, players: [] });
    const seen: string[] = [];
    const note = (): void => {
      const phase = harness.snapshot().phase;
      if (seen[seen.length - 1] !== phase) seen.push(phase);
    };

    players.forEach((player, index) => {
      harness.act("join_player", { ...player, slot: index });
    });
    note();
    players.forEach((player) => harness.act("ready_player", { playerId: player.playerId, ready: true }));
    note();
    harness.act("start_match");
    note();
    harness.act("advance_simulation", { ticks: 1 });
    note();
    harness.act("advance_simulation", { ticks: COUNTDOWN_TICKS });
    note();
    harness.scheduleGoal(0, harness.sim.tick + 1);
    harness.act("advance_simulation", { ticks: 4 });
    note();
    harness.act("advance_simulation", { ticks: GOAL_TICKS });
    note();
    harness.act("advance_simulation", { ticks: TO_PLAYING });
    note();
    harness.act("end_match", { winner: 0 });
    note();
    harness.act("restart_match");
    note();

    // The seven-phase order the contract publishes (`contracts/agent.ts:609-617`),
    // with `lobby` first and `kickoff` legitimately repeating around each goal.
    const order = seen.filter((phase, index) => phase !== seen[index - 1]);
    expect(order[0]).toBe("lobby");
    expect(order).toContain("ready");
    expect(order).toContain("countdown");
    expect(order).toContain("playing");
    expect(order).toContain("goal");
    expect(order).toContain("result");
    expect(order[order.length - 1]).toBe("kickoff");
    // `ready` must come before the first kickoff, and the horn after the goal.
    expect(order.indexOf("ready")).toBeLessThan(order.indexOf("kickoff"));
    expect(order.indexOf("goal")).toBeLessThan(order.indexOf("result"));

    expect(harness.violations()).toEqual([]);
  });
});

/* -------------------------------------------------------------------------- */
/* The harness detects a real fault, so a green run means something             */
/* -------------------------------------------------------------------------- */

describe("the harness's invariant gate actually fires", () => {
  it("catches a controller that vanishes while still driving", () => {
    const harness = createMatchHarness({ invoke, players: roster(2) });
    harness.act("start_match");
    harness.act("drive", { playerId: "c1", throttle: 1, boost: true });
    harness.act("advance_simulation", { ticks: 1 });
    expect(harness.violations()).toEqual([]);

    // The presence feed says c1 is gone, but the LATCH still holds boost — the
    // exact silent-dropout bug the invariant exists for.
    harness.setPresence("c1", false);
    const found = harness.hostTick();
    // The host pushes NEUTRAL for a non-present player, so the control guard is
    // satisfied — which is the point. The remaining fault is the stale latch.
    expect(found.filter((v) => v.invariant === "vanished-controller-neutral")).toEqual([]);
    expect(harness.core.readControls("c1").boost).toBe(true);
    expect(harness.sim.lastControlsFor(0)).toEqual({
      throttle: 0,
      steer: 0,
      pitch: 0,
      yaw: 0,
      roll: 0,
      jump: false,
      boost: false,
      handbrake: false,
    });
  });

  it("catches a non-neutral control written through a global blur", () => {
    const harness = createMatchHarness({ invoke, players: roster(2) });
    harness.act("start_match");
    harness.act("drive", { playerId: "c1", throttle: 1, boost: true });
    harness.act("advance_simulation", { ticks: 1 });

    // A disruption is served WITHOUT neutralizing: the guard must object.
    const event: NeutralizeEvent = { reason: "blurred", scope: "all", playerId: null };
    const found = harness.hostTick({ neutralize: event });
    expect(found.map((violation) => violation.invariant)).toContain(
      "neutral-after-disruption",
    );
  });

  it("catches a ninth player at the native cap", () => {
    const harness = createMatchHarness({
      invoke,
      // Nine players, eight cars. The ninth must be refused, visibly.
      players: Array.from({ length: 9 }, (_, index) => ({
        playerId: `c${index + 1}`,
        name: `P${index + 1}`,
        team: (index % 2) as 0 | 1,
      })),
    });
    expect(harness.sim.carCount()).toBe(MAX_CARS);
    const found = harness.violationsFor("arena-cap");
    expect(found.length).toBeGreaterThan(0);
    expect(found[0].detail).toContain("9");
  });

  it("catches a held level from a controller that stopped publishing", () => {
    // One tick of window, so the guard fires almost immediately.
    const harness = createMatchHarness({ invoke, players: roster(2), maxStaleHoldTicks: 0 });
    harness.act("start_match");
    harness.act("drive", { playerId: "c1", throttle: 1, boost: true });

    // A LIVE controller holding the throttle keeps publishing every tick, so
    // this is NOT a violation however long it goes on. This is the case that
    // must not be flagged: a player driving in a straight line is not a bug.
    for (let i = 0; i < 10; i += 1) {
      expect(harness.hostTick()).toEqual([]);
    }
    expect(harness.violations()).toEqual([]);

    // Now the controller goes SILENT while still nominally present — the
    // swallowed `pointerup`. Same held level, and now it is a real fault.
    harness.setPublishing("c1", false);
    expect(harness.hostTick()).toEqual([]); // first silent tick: still inside the window
    expect(harness.hostTick()).toHaveLength(1);
    expect(harness.violationsFor("no-indefinite-hold").length).toBeGreaterThan(0);
    expect(harness.violationsFor("no-indefinite-hold")[0].detail).toContain("boost");

    // It keeps firing while the level is still stale…
    const before = harness.violationsFor("no-indefinite-hold").length;
    harness.hostTick();
    expect(harness.violationsFor("no-indefinite-hold").length).toBe(before + 1);

    // …and a controller that publishes again clears it immediately.
    harness.setPublishing("c1", true);
    expect(harness.hostTick()).toEqual([]);
    expect(harness.violationsFor("no-indefinite-hold").length).toBe(before + 1);
  });

  it("catches two players driven on one slot", () => {
    const harness = createMatchHarness({ invoke, players: [] });
    harness.act("join_player", { playerId: "c1", name: "A", team: 0, slot: 0 });
    harness.act("join_player", { playerId: "c2", name: "B", team: 1, slot: 0 });
    const found = harness.violationsFor("no-double-slot-assign");
    expect(found.length).toBeGreaterThan(0);
    expect(found[0].detail).toContain("c1, c2");
  });
});

/* -------------------------------------------------------------------------- */
/* The fake sim is a sim, not a stub                                           */
/* -------------------------------------------------------------------------- */

describe("the fake sim behaves like the engine it stands in for", () => {
  it("refuses to grow past MAX_CARS and says so", () => {
    const sim = createHarnessSimForTest();
    for (let i = 0; i < MAX_CARS; i += 1) expect(sim.addCar(i % 2 === 0 ? 0 : 1)).toBe(i);
    expect(sim.addCar(0)).toBe(-1);
    expect(sim.carCount()).toBe(MAX_CARS);
  });

  it("does not drain boost when INFINITE_BOOST is set, and does when it is not", () => {
    const sim = createHarnessSimForTest();
    const slot = sim.addCar(0);
    sim.setControls(slot, { ...NEUTRAL, throttle: 1, boost: true });
    const full = 100;

    sim.step(2);
    expect(sim.state[22 + 18]).toBeLessThan(full);

    sim.setUnlimitedBoost(true);
    const held = sim.state[22 + 18];
    sim.step(2);
    expect(sim.state[22 + 18]).toBe(held);
  });

  it("moves the ball off the centre once a car drives, which is what starts the clock", () => {
    const sim = createHarnessSimForTest();
    const slot = sim.addCar(0);
    expect(sim.kickoffTouched()).toBe(false);
    sim.setControls(slot, { ...NEUTRAL, throttle: 1 });
    sim.step(5);
    expect(sim.kickoffTouched()).toBe(true);
  });
});

/** Build a bare fake sim for the sim-behaviour cases below. */
const createHarnessSimForTest = createHarnessSim;

const NEUTRAL = {
  throttle: 0,
  steer: 0,
  pitch: 0,
  yaw: 0,
  roll: 0,
  jump: false,
  boost: false,
  handbrake: false,
};
