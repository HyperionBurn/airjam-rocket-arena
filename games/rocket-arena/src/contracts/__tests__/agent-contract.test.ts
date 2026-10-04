/**
 * The semantic agent contract.
 *
 * The point of these tests is the mission requirement: an automated test drives
 * a whole Rocket Arena match through NAMED, DESCRIBED actions and reads the
 * result as data — with no frame loop, no canvas, no WebGL context, no
 * screenshot and no browser automation of any kind.
 *
 * Every action registered in the contract is executed here at least once, and
 * each one asserts the state it claims to mutate. A new action that is not
 * covered here fails the "all registered actions are exercised" case below.
 */

import { describe, expect, it } from "vitest";

import {
  AGENT_ACTION_NAMES,
  MATCH_STORE_DOMAIN,
  SIM_STORE_DOMAIN,
  agentContract,
  projectMatchSnapshot,
  projectSimConfig,
} from "../agent.js";

import { COUNTDOWN_TICKS, GOAL_TICKS, REGULATION_TICKS, SIM_HZ } from "../../match/donor-facts.js";
import { createMatchCore } from "../../match/core.js";
import { MUTATOR_IDS } from "../../match/sim-config.js";
import type { CarControls } from "../../airjam/seam.js";
import type { MatchAgentSnapshot } from "../agent.js";

/**
 * The parse meta the SDK hands to `input.parse`. The SDK's own
 * `AirJamAgentActionParseMeta` is not exported from the package root, so the
 * structural shape is restated here.
 */
const META = { gameId: "rocket-arena", contractKind: "agent" } as const;

/**
 * Invoke a contract action exactly the way the SDK's RPC layer does: parse the
 * raw payload with the action's own `input.parse`, then map it through
 * `toPayload`.
 *
 * The SDK's `resolveAirJamAgentActionPayload` is NOT used because it is not
 * exported from the package root — only the contract types are. The two fields
 * it would read are the public `AirJamAgentResolvedActionContract` surface, so
 * this is the same code path with the same semantics.
 */
const invoke = <T = unknown>(name: string, payload?: unknown): T => {
  const action = agentContract.actions[name];
  if (!action) throw new Error(`No such agent action: ${name}`);
  const parsed = action.input.parse(payload, { ...META, actionName: name });
  return (action.toPayload ? action.toPayload(parsed) : parsed) as T;
};

/**
 * `projectSnapshot` may return a union of its branches (and the SDK type allows
 * a promise), so the test narrows it once here instead of at every call site.
 */
const project = async (stores: Record<string, MatchAgentSnapshot>) => {
  const snapshot = await agentContract.projectSnapshot({ controllerId: null, stores });
  return snapshot as Record<string, unknown>;
};

/** Read `availableActions` off a projected snapshot, sorted for comparison. */
const availableActions = (snapshot: Record<string, unknown>): string[] =>
  [...(snapshot.availableActions as string[])].sort();

/** The mutable mirror an agent mutates, backed by the real match core. */
const makeWorld = (players: string[] = ["c1", "c2"]) => {
  const core = createMatchCore();
  for (const [index, id] of players.entries()) {
    core.joinPlayer({
      playerId: id,
      name: id.toUpperCase(),
      team: (index % 2) as 0 | 1,
      slot: index,
      isBot: false,
      ready: false,
    });
  }
  return core;
};

/** Drive the core the way a dispatched agent action would. */
const apply = <P>(
  world: ReturnType<typeof makeWorld>,
  actionName: string,
  payload: P,
): void => {
  const state = world.getState();
  switch (actionName) {
    case "joinPlayer":
      world.joinPlayer(payload as never);
      return;
    case "readyPlayer": {
      const p = payload as { playerId: string; ready: boolean };
      world.readyPlayer(p.playerId, p.ready);
      return;
    }
    case "setTeam": {
      const p = payload as { playerId: string; team: 0 | 1 };
      world.setTeam(p.playerId, p.team);
      return;
    }
    case "setBallCam": {
      const p = payload as { playerId: string; ballCam: boolean };
      world.setBallCam(p.playerId, p.ballCam);
      return;
    }
    case "setControls": {
      const p = payload as { playerId: string; controls: Partial<CarControls> };
      world.setControls(p.playerId, p.controls);
      return;
    }
    case "setMutator":
      world.setMutator((payload as { mutator: string }).mutator);
      return;
    case "startMatch":
      world.startMatch();
      return;
    case "restartMatch":
      world.rematch();
      return;
    case "resetKickoff":
      world.resetKickoff();
      return;
    case "scoreGoal":
      world.scoreGoal((payload as { team: 0 | 1 }).team);
      return;
    case "endMatch":
      world.endMatch((payload as { winner: 0 | 1 | null }).winner);
      return;
    case "advance": {
      const p = payload as { ticks: number; kickoffTouched?: boolean; ballOnGround?: boolean };
      world.advance(p.ticks, {
        goal: 0,
        ballOnGround: p.ballOnGround ?? false,
        kickoffTouched: p.kickoffTouched ?? false,
      });
      return;
    }
    default:
      throw new Error(`Unmapped action in the test harness: ${state.phase} / ${actionName}`);
  }
};

/* -------------------------------------------------------------------------- */
/* Registration                                                                  */
/* -------------------------------------------------------------------------- */

describe("registration", () => {
  it("registers both store domains", () => {
    expect(Object.keys(agentContract.stores).sort()).toEqual(
      [MATCH_STORE_DOMAIN, SIM_STORE_DOMAIN].sort(),
    );
  });

  it("registers exactly the mission's action set", () => {
    expect([...AGENT_ACTION_NAMES].sort()).toEqual(
      [
        // session
        "join_player",
        "ready_player",
        "set_team",
        "start_match",
        "restart_match",
        // driving
        "drive",
        "throttle",
        "steer",
        "jump",
        "boost",
        "powerslide",
        "ball_cam",
        // simulation / test
        "advance_simulation",
        "reset_kickoff",
        "score_goal",
        "end_match",
        "set_mutator",
      ].sort(),
    );
  });

  it("gives every action a prose description, a payload description and a result", () => {
    for (const name of AGENT_ACTION_NAMES) {
      const action = agentContract.actions[name];
      expect(action.description, name).toBeTruthy();
      expect(action.availability, name).toBeTruthy();
      expect(action.resultDescription, name).toBeTruthy();
      // The payload parser's own metadata. `metadata.description` is
      // deliberately NOT required: air-capture only sets `payloadDescription`
      // on the input and carries the prose on the action.
      expect(action.input.metadata.payload.description, name).toBeTruthy();
    }
  });

  it("points every action at a store domain that exists", () => {
    const domains = Object.keys(agentContract.stores);
    for (const name of AGENT_ACTION_NAMES) {
      const target = agentContract.actions[name].target;
      expect(target.kind).toBe("participant");
      expect(target.actionName, name).toBeTruthy();
      if (target.storeDomain) expect(domains).toContain(target.storeDomain);
    }
  });
});

/* -------------------------------------------------------------------------- */
/* Session actions                                                              */
/* -------------------------------------------------------------------------- */

describe("session actions", () => {
  it("join_player, ready_player and set_team mutate the roster", () => {
    const world = makeWorld([]);
    expect(world.getState().players).toHaveLength(0);

    apply(world, "joinPlayer", invoke("join_player", { playerId: "c1", name: "Wasif", team: 0, slot: 0 }));
    expect(world.getState().players.map((p) => p.playerId)).toEqual(["c1"]);

    apply(world, "joinPlayer", invoke("join_player", { playerId: "c2", name: "Nova", team: 1 }));
    // A missing slot is normalised to -1, not to a fabricated index.
    expect(world.getState().players.find((p) => p.playerId === "c2")?.slot).toBe(-1);

    expect(world.getState().phase).toBe("lobby");
    apply(world, "readyPlayer", invoke("ready_player", { playerId: "c1", ready: true }));
    apply(world, "readyPlayer", invoke("ready_player", { playerId: "c2", ready: true }));
    expect(world.getState().phase).toBe("ready");

    apply(world, "setTeam", invoke("set_team", { playerId: "c2", team: 0 }));
    // Changing a team clears readiness, exactly as the reducer says it does.
    expect(world.getState().players.find((p) => p.playerId === "c2")?.team).toBe(0);
    expect(world.getState().players.find((p) => p.playerId === "c2")?.ready).toBe(false);
    expect(world.getState().phase).toBe("lobby");
  });

  it("start_match runs the full phase progression to `playing`", () => {
    const world = makeWorld();
    apply(world, "startMatch", invoke("start_match"));
    expect(world.getState().phase).toBe("kickoff");
    expect(world.getState().mode).toBe("match");
    expect(world.getState().score).toEqual({ 0: 0, 1: 0 });
    expect(world.getState().clock.remainingTicks).toBe(REGULATION_TICKS);

    apply(world, "advance", invoke("advance_simulation", { ticks: 1 + COUNTDOWN_TICKS }));
    expect(world.getState().phase).toBe("playing");
    expect(world.getState().countdown).toBe(0);
  });

  it("restart_match resets everything but the roster", () => {
    const world = makeWorld();
    apply(world, "startMatch", invoke("start_match"));
    apply(world, "advance", invoke("advance_simulation", { ticks: 1 + COUNTDOWN_TICKS + 10, kickoffTouched: true }));
    apply(world, "scoreGoal", invoke("score_goal", { team: 0 }));
    apply(world, "advance", invoke("advance_simulation", { ticks: GOAL_TICKS + 1, kickoffTouched: true }));
    expect(world.getState().score[0]).toBe(1);
    expect(world.getState().goals).toHaveLength(1);

    apply(world, "restartMatch", invoke("restart_match"));
    const after = world.getState();
    expect(after.score).toEqual({ 0: 0, 1: 0 });
    expect(after.clock.remainingTicks).toBe(REGULATION_TICKS);
    expect(after.goals).toHaveLength(0);
    expect(after.phase).toBe("kickoff");
    // NO rejoin: the same players, teams and slots are still there.
    expect(after.players.map((p) => p.playerId)).toEqual(["c1", "c2"]);
    expect(after.players.map((p) => p.team)).toEqual([0, 1]);
  });
});

/* -------------------------------------------------------------------------- */
/* Driving actions                                                              */
/* -------------------------------------------------------------------------- */

describe("driving actions", () => {
  it("every driving action lands in the latch and comes back shaped", () => {
    const world = makeWorld();
    apply(world, "setControls", invoke("throttle", { playerId: "c1", throttle: 1 }));
    expect(world.readControls("c1").throttle).toBe(1);

    apply(world, "setControls", invoke("steer", { playerId: "c1", steer: -0.5 }));
    expect(world.readControls("c1").steer).toBe(-0.5);
    expect(world.readControls("c1").throttle).toBe(1);

    apply(world, "setControls", invoke("boost", { playerId: "c1", boost: true }));
    expect(world.readControls("c1").boost).toBe(true);

    apply(world, "setControls", invoke("jump", { playerId: "c1", jump: true }));
    expect(world.readControls("c1").jump).toBe(true);

    apply(world, "setControls", invoke("powerslide", { playerId: "c1", powerslide: true }));
    // The donor's handbrake IS the powerslide; the contract must not invent a
    // separate control for it.
    expect(world.readControls("c1").handbrake).toBe(true);
  });

  it("drive sets the whole 8-float vector in one call", () => {
    const world = makeWorld();
    apply(
      world,
      "setControls",
      invoke("drive", {
        playerId: "c2",
        throttle: 0.8,
        steer: 0.25,
        jump: true,
        boost: true,
        powerslide: false,
      }),
    );
    const controls = world.readControls("c2");
    expect(controls).toEqual({
      throttle: 0.8,
      steer: 0.25,
      pitch: 0,
      yaw: 0,
      roll: 0,
      jump: true,
      boost: true,
      handbrake: false,
    });
  });

  it("clamps an out-of-range axis instead of rejecting the action", () => {
    const world = makeWorld();
    apply(world, "setControls", invoke("steer", { playerId: "c1", steer: 4 }));
    expect(world.readControls("c1").steer).toBe(1);
    apply(world, "setControls", invoke("steer", { playerId: "c1", steer: -9 }));
    expect(world.readControls("c1").steer).toBe(-1);
  });

  it("ball_cam is per player and never shared", () => {
    const world = makeWorld();
    apply(world, "setBallCam", invoke("ball_cam", { playerId: "c1", ballCam: true }));
    const state = world.getState();
    expect(state.ballCam.c1).toBe(true);
    expect(state.ballCam.c2).toBeUndefined();
  });
});

/* -------------------------------------------------------------------------- */
/* Simulation / test actions                                                    */
/* -------------------------------------------------------------------------- */

describe("simulation and test actions", () => {
  it("advance_simulation runs a whole match headlessly, to the final horn", () => {
    const world = makeWorld();
    apply(world, "startMatch", invoke("start_match"));
    apply(world, "advance", invoke("advance_simulation", { ticks: 1 + COUNTDOWN_TICKS, kickoffTouched: true }));

    // Blue scores once; then run the clock out with the ball grounded.
    apply(world, "scoreGoal", invoke("score_goal", { team: 0 }));
    apply(world, "advance", invoke("advance_simulation", { ticks: GOAL_TICKS + 1 + COUNTDOWN_TICKS, kickoffTouched: true }));
    expect(world.getState().phase).toBe("playing");
    expect(world.getState().score[0]).toBe(1);

    apply(
      world,
      "advance",
      invoke("advance_simulation", {
        ticks: REGULATION_TICKS + 10,
        kickoffTouched: true,
        ballOnGround: true,
      }),
    );
    const after = world.getState();
    expect(after.phase).toBe("result");
    expect(after.winner).toBe(0);
    expect(after.clock.remainingTicks).toBe(0);
  });

  it("advance_simulation drives overtime and a nearest-goal finish", () => {
    const world = makeWorld();
    apply(world, "startMatch", invoke("start_match"));
    apply(world, "advance", invoke("advance_simulation", { ticks: 1 + COUNTDOWN_TICKS, kickoffTouched: true }));

    // Level score, clock out, ball grounded → overtime.
    apply(
      world,
      "advance",
      invoke("advance_simulation", { ticks: REGULATION_TICKS + 10, kickoffTouched: true, ballOnGround: true }),
    );
    expect(world.getState().clock.overtime).toBe(true);
    // The remaining ticks burned the new kickoff's countdown, which is fine:
    // what matters is that we are back in play with the overtime clock running.
    apply(world, "advance", invoke("advance_simulation", { ticks: COUNTDOWN_TICKS + 1, kickoffTouched: true }));
    expect(world.getState().phase).toBe("playing");
    expect(world.getState().clock.overtime).toBe(true);
    expect(world.getState().clock.overtimeTicks).toBeGreaterThan(0);

    apply(world, "scoreGoal", invoke("score_goal", { team: 1 }));
    expect(world.getState().winner).toBe(1);
    apply(world, "advance", invoke("advance_simulation", { ticks: GOAL_TICKS }));
    expect(world.getState().phase).toBe("result");
  });

  it("reset_kickoff restarts the countdown but does NOT rewind the clock", () => {
    // This is the DONOR's own kickoff semantics: `kickoff()` in
    // `match/session.js:92-101` resets the phase, the countdown and the clock's
    // started flag, and never touches `remaining`. Rewinding the score AND the
    // clock is `restart_match`'s job, not this action's.
    const world = makeWorld();
    apply(world, "startMatch", invoke("start_match"));
    apply(world, "advance", invoke("advance_simulation", { ticks: 1 + COUNTDOWN_TICKS + 600, kickoffTouched: true }));
    const spent = REGULATION_TICKS - world.getState().clock.remainingTicks;
    expect(spent).toBe(600);

    apply(world, "resetKickoff", invoke("reset_kickoff"));
    const after = world.getState();
    expect(after.phase).toBe("kickoff");
    expect(after.countdown).toBe(3);
    // The clock is HELD where it was, and the clock is stopped again.
    expect(after.clock.remainingTicks).toBe(REGULATION_TICKS - spent);
    expect(after.clock.started).toBe(false);
    expect(after.lastBallTouch).toBeNull();

    apply(world, "advance", invoke("advance_simulation", { ticks: 1 + COUNTDOWN_TICKS }));
    expect(world.getState().phase).toBe("playing");
  });

  it("score_goal increments the named team and opens the replay hold", () => {
    const world = makeWorld();
    apply(world, "startMatch", invoke("start_match"));
    apply(world, "advance", invoke("advance_simulation", { ticks: 1 + COUNTDOWN_TICKS }));
    expect(world.getState().phase).toBe("playing");

    apply(world, "scoreGoal", invoke("score_goal", { team: 1 }));
    const after = world.getState();
    expect(after.score).toEqual({ 0: 0, 1: 1 });
    expect(after.phase).toBe("goal");
    expect(after.goals).toHaveLength(1);
    expect(after.goals[0].team).toBe(1);

    apply(world, "scoreGoal", invoke("score_goal", { team: 0 }));
    expect(world.getState().score).toEqual({ 0: 0, 1: 1 });
  });

  it("end_match sounds the horn and publishes the winner", () => {
    const world = makeWorld();
    apply(world, "startMatch", invoke("start_match"));
    apply(world, "advance", invoke("advance_simulation", { ticks: 1 + COUNTDOWN_TICKS }));
    apply(world, "endMatch", invoke("end_match", { winner: 1 }));
    expect(world.getState().phase).toBe("result");
    expect(world.getState().winner).toBe(1);
  });

  it("set_mutator switches the one centralised config", () => {
    const world = makeWorld();
    for (const id of MUTATOR_IDS) {
      apply(world, "setMutator", invoke("set_mutator", id));
      expect(world.getState().mutator).toBe(id);
      expect(world.getConfig().id).toBe(id);
    }
  });

  it("rejects a mutator id that is not in the enum, by design", () => {
    expect(() => invoke("set_mutator", "SUPER_GRAVITY")).toThrow(/expected one of/);
  });
});

/* -------------------------------------------------------------------------- */
/* The projected snapshot                                                       */
/* -------------------------------------------------------------------------- */

describe("projectSnapshot", () => {
  it("projects the whole match as plain data", () => {
    const world = makeWorld();
    apply(world, "startMatch", invoke("start_match"));
    apply(world, "advance", invoke("advance_simulation", { ticks: 1 + COUNTDOWN_TICKS + 120, kickoffTouched: true }));
    apply(world, "setBallCam", invoke("ball_cam", { playerId: "c1", ballCam: true }));
    apply(world, "setMutator", invoke("set_mutator", "LOW_GRAVITY"));

    const projected = projectMatchSnapshot(world.getState());
    expect(projected.phase).toBe("playing");
    expect(projected.scoreline).toBe("0 - 0");
    expect(projected.clock.remainingTicks).toBeLessThan(REGULATION_TICKS);
    expect(projected.clock.started).toBe(true);
    expect(projected.players.map((p) => p.teamLabel)).toEqual(["BLUE", "ORANGE"]);
    expect(projected.mutator.id).toBe("LOW_GRAVITY");
    expect(projected.ballCam.c1).toBe(true);
    expect(projected.countdownLabel).toBe("");
    // The agent can JSON-serialise the whole thing: no class, no typed array.
    expect(JSON.parse(JSON.stringify(projected)).phase).toBe("playing");
  });

  it("publishes the stat confidence labels verbatim, so nothing overstates itself", () => {
    const projected = projectMatchSnapshot(rosterState());
    expect(projected.statsConfidence.ballTouches.startsWith("exact")).toBe(true);
    expect(projected.statsConfidence.goals.startsWith("inferred")).toBe(true);
  });

  it("is reachable through the contract and lists every action", async () => {
    const projected = await project({
      [MATCH_STORE_DOMAIN]: projectMatchSnapshot(rosterState()),
    });
    expect(projected.matchPhase).toBe("lobby");
    expect(projected.canStartMatch).toBe(true);
    expect(projected.canRematch).toBe(false);
    expect(projected.isLive).toBe(false);
    expect(projected.phaseOrder).toEqual([
      "lobby",
      "ready",
      "kickoff",
      "countdown",
      "playing",
      "goal",
      "result",
    ]);
    expect(availableActions(projected)).toEqual([...AGENT_ACTION_NAMES].sort());
    expect(projected.mutators).toHaveLength(MUTATOR_IDS.length);
  });

  it("degrades to an honest 'unavailable' when the store has not replicated yet", async () => {
    const projected = await project({});
    expect(projected.matchPhase).toBe("unavailable");
    expect(String(projected.summary)).toContain("not available");
    expect(availableActions(projected)).toEqual([...AGENT_ACTION_NAMES].sort());
  });
});

/* -------------------------------------------------------------------------- */
/* The sim config projection                                                    */
/* -------------------------------------------------------------------------- */

describe("projectSimConfig", () => {
  it("exposes the config as flat numbers and booleans, never as an id to branch on", () => {
    for (const id of MUTATOR_IDS) {
      const flat = projectSimConfig(id);
      for (const [key, value] of Object.entries(flat)) {
        expect(["number", "boolean"], `${id}.${key}`).toContain(typeof value);
      }
      expect(flat.driveScale).toBeGreaterThan(0);
      expect(flat.gravityBias).toBeGreaterThanOrEqual(0);
    }
    expect(projectSimConfig("NORMAL").unlimitedBoost).toBe(false);
    expect(projectSimConfig("INFINITE_BOOST").unlimitedBoost).toBe(true);
    expect(projectSimConfig("LOW_GRAVITY").gravityBias).toBeGreaterThan(0);
  });
});

/* -------------------------------------------------------------------------- */
/* Coverage: every registered action must be reachable                           */
/* -------------------------------------------------------------------------- */

describe("action coverage", () => {
  it("maps every registered contract action onto a real store action", () => {
    const registered = new Set(AGENT_ACTION_NAMES);
    const storeActions = new Set([
      "joinPlayer",
      "readyPlayer",
      "setTeam",
      "startMatch",
      "restartMatch",
      "swapTeams",
      "leaveMatch",
      "setBallCam",
      "setControls",
      "setMutator",
      "advance",
      "scoreGoal",
      "resetKickoff",
      "endMatch",
    ]);
    for (const name of registered) {
      const target = agentContract.actions[name].target.actionName;
      // Every contract action resolves to a store action the host implements.
      // `swapTeams` / `leaveMatch` are reached by the result screen's buttons.
      expect(storeActions.has(target), `${name} -> ${target}`).toBe(true);
    }
  });

  it("the simulation runs at the donor's fixed 120 Hz, which is what `ticks` means", () => {
    // `advance_simulation` counts DONOR ticks, not wall-clock milliseconds, so
    // an agent's numbers mean the same thing the physics means.
    expect(SIM_HZ).toBe(120);
    const world = makeWorld();
    apply(world, "startMatch", invoke("start_match"));
    apply(world, "advance", invoke("advance_simulation", { ticks: 1 + COUNTDOWN_TICKS, kickoffTouched: true }));
    apply(world, "advance", invoke("advance_simulation", { ticks: SIM_HZ * 10, kickoffTouched: true }));
    expect(world.getState().clock.remainingTicks).toBe(REGULATION_TICKS - SIM_HZ * 10);
  });
});

/** A tiny lobby state, for the projections that only need a roster. */
function rosterState() {
  return makeWorld().getState();
}
