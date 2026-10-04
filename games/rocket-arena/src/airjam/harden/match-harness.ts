/**
 * Phase 11 — the agent-driven end-to-end match harness.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS IS
 *
 * A whole match, driven through the AGENT CONTRACT's own action names, from
 * lobby to rematch, with no browser, no frame loop, no canvas, no WebGL and no
 * visual automation of any kind. It exists because the mission requirement is
 * that a full match can be driven and asserted as data, and because a 3D game
 * at an unattended event is exactly the thing you cannot regression-test by
 * clicking around it.
 *
 * The harness is the HOST LOOP, headless. It does the three things the real
 * host does every frame, in the donor's own order:
 *
 *   1. push one level control object per controlled slot   (`startup.js:723`)
 *   2. step the simulation, then poll and CLEAR the goal flag
 *                                                    (`startup.js:753-756, :844`)
 *   3. feed the donor's own `{goal, ballOnGround, kickoffTouched}` into the
 *      match machine                                     (`startup.js:758-764`)
 *
 * ...and it drains the machine's pending COMMANDS and actually runs them against
 * the fake sim, so a command the machine emits that the host cannot execute is
 * a failure here rather than a surprise at the venue.
 *
 * ---------------------------------------------------------------------------
 * WHY IT IS DEPENDENCY-INJECTED
 *
 * This module imports NOTHING from `@air-jam/sdk`. The contract is injected as
 * a plain function, `AgentActionInvoker`, so:
 *   - the harness is testable in Node with no SDK runtime, and
 *   - a test can prove the REAL contract drives it by passing an invoker built
 *     from `agentContract.actions[...]` exactly the way the SDK's RPC layer
 *     does (`input.parse` then `toPayload`).
 *
 * The `actionName`s this harness routes are the contract's own action names,
 * which are also the keys of `useMatchStore.actions` (`match/store.ts:82-155`).
 * The dispatch table below mirrors that store action-for-action; the mirror is
 * cited in comments on each case so the two can be diffed.
 */

import { MAX_CARS, NEUTRAL_CONTROLS, sanitizeControls, type CarControls } from "../seam.js";
import { createMatchCore, type MatchCore } from "../../match/core.js";
import {
  CAR_FIELD,
  STATE_HEADER,
  carBase,
  readGoalFlag,
  type Team,
} from "../../match/donor-facts.js";
import type { MatchSimBridge } from "../../match/sim-bridge.js";
import type { MatchState, PlayerEntry } from "../../match/types.js";
import {
  createStabilityMonitor,
  INVARIANTS,
  summarizeViolations,
  type InvariantId,
  type NeutralizeEvent,
  type ObservedCar,
  type StabilityMonitor,
  type StabilityViolation,
  type TickObservation,
} from "./invariants.js";

/* -------------------------------------------------------------------------- */
/* The injection point                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Turn a raw agent payload into the core's own payload, the way the SDK's RPC
 * layer does. Injected so this file never imports the SDK.
 *
 * A test wires the real contract:
 *
 * ```ts
 * const invoker: AgentActionInvoker = (actionName, rawPayload) => {
 *   const action = agentContract.actions[actionName];
 *   const parsed = action.input.parse(rawPayload, { gameId: "rocket-arena", contractKind: "agent", actionName });
 *   return { actionName, payload: action.toPayload ? action.toPayload(parsed) : parsed };
 * };
 * ```
 */
export type AgentActionInvoker = (
  actionName: string,
  rawPayload?: unknown,
) => { actionName: string; payload: unknown };

/* -------------------------------------------------------------------------- */
/* The fake simulation                                                           */
/* -------------------------------------------------------------------------- */

/** Floats in the donor's state block. `STATE.CARS(22) + 8 * CAR_STRIDE(51)`. */
const STATE_FLOATS = STATE_HEADER.CARS + MAX_CARS * 51;

/** Units a car covers per tick at full throttle. Arbitrary but fixed. */
const DRIVE_UNITS_PER_TICK = 0.5;
/** Extra units per tick while boosting. */
const BOOST_UNITS_PER_TICK = 1.5;
/** Boost gauge units spent per tick while the button is held. 100 = full. */
const BOOST_DRAIN_PER_TICK = 3;
/** How far the ball drifts per tick while any car is moving. */
const BALL_DRIFT_PER_TICK = 0.5;
/** Ball velocity while any car is moving. Above 1, so the donor's test passes. */
const BALL_VELOCITY = 2;
/** Impact speed recorded with a ball contact. Above the tracker's shot threshold. */
const TOUCH_IMPACT_SPEED = 900;

export interface HarnessSimControlWrite {
  readonly slot: number;
  readonly controls: CarControls;
}

/**
 * A deterministic stand-in for the donor's `PhysicsSimulation`.
 *
 * It satisfies BOTH injected surfaces at once — `PortedSim` from `seam.ts` and
 * `MatchSimBridge` from `match/sim-bridge.ts` — so the match core can be given a
 * real (fake) state block and its stat tracker runs for real. Attribution of a
 * goal to a scorer and an assist is therefore genuinely exercised, not stubbed.
 *
 * Everything is arithmetic on a `Float32Array`; nothing here is random, and the
 * same call sequence always produces the same bytes.
 */
export interface HarnessSim extends MatchSimBridge {
  /* --- PortedSim / MatchSimBridge --- */
  setControls(slot: number, controls: CarControls | number[]): void;
  step(ticks?: number): void;
  readonly state: Float32Array;

  /* --- growth --- */
  /** Grow the arena by one car. Returns its slot, or -1 past `MAX_CARS`. */
  addCar(team: Team): number;
  /** The car count the sim currently holds. */
  carCount(): number;

  /* --- reads the host performs each tick --- */
  pollGoal(): 0 | 1 | 2;
  clearGoalFlag(): void;
  ballOnGround(): boolean;
  /**
   * The donor's own kickoff-touched test: the ball has left the centre, or it
   * has velocity (`startup.js:761-763`).
   */
  kickoffTouched(): boolean;

  /* --- the harness's levers --- */
  /** Raise the donor's goal flag on a future tick. Deterministic. */
  scheduleGoal(team: Team, atTick: number): void;
  /** Last controls written for a slot, or null. */
  lastControlsFor(slot: number): CarControls | null;
  /** Every `setControls` call, in order. */
  readonly controlWrites: readonly HarnessSimControlWrite[];
  /** Every donor-side command the harness actually executed, in order. */
  readonly commandsExecuted: readonly string[];
  /** Ticks stepped so far. */
  readonly tick: number;
  /** True once `setUnlimitedBoost(true)` has been called and not undone. */
  unlimitedBoost(): boolean;
}

const placeCar = (state: Float32Array, slot: number, x: number): void => {
  const base = carBase(slot);
  state[base + CAR_FIELD.POS] = x;
  state[base + CAR_FIELD.POS + 1] = 0;
  state[base + CAR_FIELD.POS + 2] = 0;
  // FWD. The engine writes a unit vector; the harness needs only X.
  state[base + 3] = 1;
  state[base + CAR_FIELD.BOOST] = 100;
  state[base + CAR_FIELD.ON_GROUND] = 1;
  state[base + CAR_FIELD.DEMOED] = 0;
  state[base + CAR_FIELD.IS_BOOSTING] = 0;
};

export const createHarnessSim = (): HarnessSim => {
  const state = new Float32Array(STATE_FLOATS);
  const controls = new Map<number, CarControls>();
  const controlWrites: HarnessSimControlWrite[] = [];
  const commandsExecuted: string[] = [];

  let carCount = 0;
  let unlimited = false;
  let tick = 0;
  let pendingGoal: { team: Team; at: number } | null = null;
  let goalRaised = false;

  /** The car that most recently drove hardest, so a touch is attributable. */
  let lastDriverSlot = 0;

  const write = (slot: number, controlsIn: CarControls | number[]): void => {
    const next = sanitizeControls(
      Array.isArray(controlsIn)
        ? {
            throttle: controlsIn[0],
            steer: controlsIn[1],
            pitch: controlsIn[2],
            yaw: controlsIn[3],
            roll: controlsIn[4],
            jump: controlsIn[5] > 0.5,
            boost: controlsIn[6] > 0.5,
            handbrake: controlsIn[7] > 0.5,
          }
        : (controlsIn as CarControls),
    );
    controls.set(slot, next);
    controlWrites.push({ slot, controls: next });
  };

  const raiseGoal = (team: Team): void => {
    // The donor's flag numbering: 1 = team 0, 2 = team 1 (`donor-facts.ts:170`).
    state[STATE_HEADER.GOAL] = team === 0 ? 1 : 2;
    // A car→ball contact at a real impact speed, so `trackTick` attributes the
    // goal to a scorer rather than leaving it unattributed.
    const base = carBase(lastDriverSlot);
    state[base + CAR_FIELD.BALL_HIT_SERIAL] += 1;
    state[base + CAR_FIELD.BALL_HIT_SPEED] = TOUCH_IMPACT_SPEED;
    goalRaised = true;
  };

  const integrate = (): void => {
    // The ball is pushed off the centre by whatever the cars are doing, so the
    // donor's own kickoff-touched test (`startup.js:761-763`) becomes true the
    // moment anybody drives — which is what starts the clock.
    let motion = 0;
    for (let slot = 0; slot < carCount; slot += 1) {
      const c = controls.get(slot);
      if (!c) continue;
      const base = carBase(slot);
      if (Math.abs(c.throttle) > Math.abs(controls.get(lastDriverSlot)?.throttle ?? 0)) {
        lastDriverSlot = slot;
      }
      const speed =
        c.throttle * DRIVE_UNITS_PER_TICK + (c.boost ? BOOST_UNITS_PER_TICK * Math.max(0, c.throttle) : 0);
      state[base + CAR_FIELD.POS] += speed;
      state[base + CAR_FIELD.VEL] = speed;
      motion += Math.abs(speed);
      if (c.boost) {
        state[base + CAR_FIELD.IS_BOOSTING] = 1;
        if (!unlimited) {
          state[base + CAR_FIELD.BOOST] = Math.max(0, state[base + CAR_FIELD.BOOST] - BOOST_DRAIN_PER_TICK);
        }
      } else {
        state[base + CAR_FIELD.IS_BOOSTING] = 0;
      }
    }
    if (motion > 0) {
      state[STATE_HEADER.BALL] += BALL_DRIFT_PER_TICK;
      state[STATE_HEADER.BALL + CAR_FIELD.VEL] = BALL_VELOCITY;
    }
  };

  return {
    state,

    get tick() {
      return tick;
    },
    get controlWrites() {
      return controlWrites;
    },
    get commandsExecuted() {
      return commandsExecuted;
    },

    setControls: (slot, controlsIn) => write(slot, controlsIn),

    step(ticks = 1) {
      const count = Math.max(1, Math.floor(ticks));
      for (let i = 0; i < count; i += 1) {
        tick += 1;
        integrate();
        if (pendingGoal && tick >= pendingGoal.at && !goalRaised) {
          raiseGoal(pendingGoal.team);
        }
      }
    },

    addCar(team) {
      if (carCount >= MAX_CARS) return -1;
      const slot = carCount;
      carCount += 1;
      state[STATE_HEADER.NUM_CARS] = carCount;
      placeCar(state, slot, team === 0 ? -1000 : 1000);
      return slot;
    },

    carCount: () => carCount,

    pollGoal: () => readGoalFlag(state),

    clearGoalFlag() {
      commandsExecuted.push("clearGoalFlag");
      state[STATE_HEADER.GOAL] = 0;
      goalRaised = false;
      pendingGoal = null;
    },

    ballOnGround: () => true,

    kickoffTouched: () =>
      Math.abs(state[STATE_HEADER.BALL]) + Math.abs(state[STATE_HEADER.BALL + 1]) > 1 ||
      Math.hypot(
        state[STATE_HEADER.BALL + CAR_FIELD.VEL],
        state[STATE_HEADER.BALL + CAR_FIELD.VEL + 1],
      ) > 1,

    scheduleGoal(team, atTick) {
      pendingGoal = { team, at: atTick };
      goalRaised = false;
    },

    lastControlsFor(slot) {
      const found = controls.get(slot);
      return found ? { ...found } : null;
    },

    setUnlimitedBoost(enabled) {
      commandsExecuted.push(`setUnlimitedBoost:${enabled ? 1 : 0}`);
      unlimited = enabled;
    },

    unlimitedBoost: () => unlimited,

    writeBallState(block) {
      commandsExecuted.push(`writeBallState:${block.length}`);
      for (let i = 0; i < block.length; i += 1) state[STATE_HEADER.BALL + i] = block[i];
    },

    writeCarState(slot, pose) {
      commandsExecuted.push(`writeCarState:${slot}:${pose.length}`);
      if (slot < 0 || slot >= carCount) return false;
      const base = carBase(slot);
      for (let i = 0; i < pose.length && i < 51; i += 1) state[base + i] = pose[i];
      return true;
    },

    goalExplosion() {
      commandsExecuted.push("goalExplosion");
      return 1;
    },

    resetKickoff() {
      commandsExecuted.push("resetKickoff");
      goalRaised = false;
      pendingGoal = null;
      state[STATE_HEADER.GOAL] = 0;
      state[STATE_HEADER.BALL] = 0;
      state[STATE_HEADER.BALL + CAR_FIELD.VEL] = 0;
      for (let slot = 0; slot < carCount; slot += 1) placeCar(state, slot, slot * 2 - 1000);
    },
  };
};

/* -------------------------------------------------------------------------- */
/* Dispatching — a mirror of match/store.ts:82-155, on the action names         */
/* -------------------------------------------------------------------------- */

interface AdvancePayload {
  ticks: number;
  kickoffTouched?: boolean;
  ballOnGround?: boolean;
  goal?: 0 | 1 | 2;
}

export class UnsupportedAgentAction extends Error {
  constructor(actionName: string) {
    super(`No match action named "${actionName}" in the hardening harness`);
    this.name = "UnsupportedAgentAction";
  }
}

/**
 * Route one dispatched action into the match core.
 *
 * Every case below is one line of `match/store.ts`'s action table, with the
 * store's `run(() => core.x())` unwrapped because the harness publishes its own
 * trace instead. Return the tick input the host will feed for `advance`.
 */
const dispatchToCore = (
  core: MatchCore,
  actionName: string,
  payload: unknown,
  onAdvance: (ticks: number) => void,
): void => {
  switch (actionName) {
    case "joinPlayer":
      core.joinPlayer(payload as PlayerEntry);
      return;
    case "readyPlayer": {
      const p = payload as { playerId: string; ready: boolean };
      core.readyPlayer(p.playerId, p.ready);
      return;
    }
    case "setTeam": {
      const p = payload as { playerId: string; team: Team };
      core.setTeam(p.playerId, p.team);
      return;
    }
    case "setBallCam": {
      const p = payload as { playerId: string; ballCam: boolean };
      core.setBallCam(p.playerId, p.ballCam);
      return;
    }
    case "setControls": {
      const p = payload as { playerId: string; controls: Partial<CarControls> };
      core.setControls(p.playerId, p.controls);
      return;
    }
    case "setMutator":
      core.setMutator((payload as { mutator: string }).mutator);
      return;
    case "startMatch":
      core.startMatch();
      return;
    case "restartMatch":
      core.rematch();
      return;
    case "resetKickoff":
      core.resetKickoff();
      return;
    case "scoreGoal":
      core.scoreGoal((payload as { team: Team }).team);
      return;
    case "endMatch":
      core.endMatch((payload as { winner: Team | null }).winner);
      return;
    case "advance": {
      const p = payload as AdvancePayload;
      onAdvance(Math.max(0, Math.floor(p.ticks ?? 0)));
      return;
    }
    default:
      throw new UnsupportedAgentAction(actionName);
  }
};

/* -------------------------------------------------------------------------- */
/* The harness                                                                  */
/* -------------------------------------------------------------------------- */

export interface HarnessPlayer {
  readonly playerId: string;
  readonly name: string;
  readonly team: Team;
  readonly isBot?: boolean;
}

export interface MatchHarnessOptions {
  /** Turns a raw agent payload into the core's payload. See `AgentActionInvoker`. */
  readonly invoke: AgentActionInvoker;
  /** The roster to seat. Alternating teams is the caller's choice. */
  readonly players: readonly HarnessPlayer[];
  /** Reuse a sim, or let the harness build one. */
  readonly sim?: HarnessSim;
  /** Passed to the stability monitor. */
  readonly maxStaleHoldTicks?: number;
}

/** One row of the harness's own audit trail. */
export interface HarnessTraceEntry {
  readonly tick: number;
  readonly kind: "action" | "host-command" | "goal" | "violation";
  readonly label: string;
  readonly phase: MatchState["phase"];
}

export interface MatchHarness {
  readonly core: MatchCore;
  readonly sim: HarnessSim;
  readonly monitor: StabilityMonitor;
  /** Dispatch one agent action and run the host's duties for it. */
  act(actionName: string, rawPayload?: unknown): void;
  /** Run the host's per-tick duties once: push controls, step, feed the machine, check. */
  hostTick(options?: { neutralize?: NeutralizeEvent | null }): readonly StabilityViolation[];
  /** Mark a controller gone / back, the way the presence feed does. */
  setPresence(playerId: string, present: boolean): void;
  /**
   * Mark a controller as publishing / silent, WITHOUT removing it.
   *
   * This is the stuck-input lever: set it false to reproduce a phone that
   * swallowed its `pointerup` and is still re-serving the last buffered payload.
   * A player holding a button with `true` keeps refreshing the input layer's
   * staleness clock and is never a violation, however long they hold it.
   */
  setPublishing(playerId: string, publishingNow: boolean): void;
  /** Schedule a goal on a future sim tick, as the physics would. */
  scheduleGoal(team: Team, atTick: number): void;
  /** Everything the harness has done, in order. */
  readonly trace: readonly HarnessTraceEntry[];
  /**
   * Every donor-facing command the machine emitted AND the host actually ran.
   *
   * This is the "the machine asked for something nobody could do" check: a
   * command the host cannot execute is a defect, so it is counted here rather
   * than silently dropped. `final-horn` is in this list even though it reaches
   * no sim call at all — it is a match-layer event, not a physics one.
   */
  hostCommands(): readonly string[];
  /** Every violation ever found. Must be empty for a healthy run. */
  violations(): readonly StabilityViolation[];
  /** Violations for one invariant. */
  violationsFor(id: InvariantId): readonly StabilityViolation[];
  /** The current machine state. */
  snapshot(): MatchState;
  /** A printable report: roster, phase walk, commands run, invariant verdict. */
  report(): readonly string[];
}

export const createMatchHarness = (options: MatchHarnessOptions): MatchHarness => {
  const sim = options.sim ?? createHarnessSim();
  const core = createMatchCore({ bridge: sim });
  const monitor = createStabilityMonitor(
    options.maxStaleHoldTicks === undefined
      ? {}
      : { maxStaleHoldTicks: options.maxStaleHoldTicks },
  );

  const trace: HarnessTraceEntry[] = [];
  /** playerId → false once the presence feed says the controller is gone. */
  const presence = new Map<string, boolean>();
  /**
   * playerId → false once the controller STOPS PUBLISHING, with the controller
   * still nominally present. Defaults to true, which is the normal case.
   *
   * This is the distinction the stuck-input guard turns on, and it is easy to
   * get wrong. A player holding the throttle down sends a FRESH payload every
   * 16 ms even though the level never changes — the input layer refreshes its
   * staleness clock on every read that gets one
   * (`airjam-input-source.ts:335`). So "the level has not changed" does NOT mean
   * "no fresh input", and treating it that way would condemn every player who
   * drives in a straight line. The fault is a controller that has stopped
   * publishing entirely: a swallowed `pointerup`, a dropped `pointercancel`, a
   * phone that locked.
   */
  const publishing = new Map<string, boolean>();
  /** slot → the `sourceKey` the harness assigns. One per player, forever. */
  const sourceKeyOf = new Map<string, string>();
  let tick = 0;

  const record = (kind: HarnessTraceEntry["kind"], label: string): void => {
    trace.push({ tick, kind, label, phase: core.getState().phase });
  };

  /** The observation the invariants judge, built from what the host just wrote. */
  const observe = (event: NeutralizeEvent | null): readonly StabilityViolation[] => {
    const state = core.getState();
    const cars: ObservedCar[] = [];

    for (const player of state.players) {
      if (player.slot < 0) continue;
      const present = presence.get(player.playerId) !== false;
      const written = sim.lastControlsFor(player.slot) ?? { ...NEUTRAL_CONTROLS };
      // "Fresh input" means THE CONTROLLER PUBLISHED, which is exactly what the
      // input layer records when it refreshes `lastPayloadAt`. A held level from
      // a still-publishing controller is fresh; the same level from a silent one
      // is the stuck-input fault.
      const freshInput = present && publishing.get(player.playerId) !== false;
      cars.push({
        slot: player.slot,
        playerId: player.playerId,
        sourceKey: sourceKeyOf.get(player.playerId) ?? `src:${player.playerId}`,
        controls: written,
        controllerPresent: present,
        freshInput,
      });
      sourceKeyOf.set(player.playerId, `src:${player.playerId}`);
    }

    const observation: TickObservation = {
      tick,
      event,
      cars,
      simCarCount: sim.carCount(),
    };

    const found = monitor.observe(observation);
    for (const violation of found) record("violation", violation.invariant);
    return found;
  };

  /**
   * Grow the arena so every roster entry has a car.
   *
   * The real host calls `_physics_addCar` when a player joins; here it happens
   * whenever the roster reaches past the sim's car count, so a match driven
   * entirely through `join_player` still has a car per player. `addCar` refuses
   * past `MAX_CARS`, which terminates the loop and leaves the overflow for the
   * `arena-cap` invariant to catch.
   */
  const syncArena = (): void => {
    for (const player of core.getState().players) {
      if (player.slot < 0) continue;
      while (sim.carCount() <= player.slot && sim.addCar(player.team) >= 0) {
        // Grow until this player's slot exists, or until the cap refuses.
      }
    }
  };

  /**
   * Run the machine's pending donor-facing commands. A command the host cannot
   * execute is a real defect, so each one is recorded and counted.
   */
  const drainCommands = (): void => {
    const { effects, commands } = core.drainPending();
    for (const effect of effects) {
      if (effect === "goal-explosion") {
        sim.goalExplosion();
        record("host-command", "effect: goal-explosion");
      } else if (effect === "reset-kickoff") {
        record("host-command", "effect: reset-kickoff");
      }
    }
    for (const command of commands) {
      if (command === "reset-kickoff") {
        sim.resetKickoff();
        record("host-command", "command: reset-kickoff");
      } else if (command === "goal-explosion") {
        sim.goalExplosion();
        record("host-command", "command: goal-explosion");
      } else if (command === "final-horn") {
        sim.clearGoalFlag();
        record("host-command", "command: final-horn");
      } else if (command === "start-match") {
        record("host-command", "command: start-match");
      }
    }
  };

  /**
   * Write one level control object per controlled slot — step 1 of the donor's
   * own frame (`startup.js:723`), and the whole of the fan-out.
   *
   * A source the presence feed has marked gone is written `NEUTRAL_CONTROLS`,
   * mirroring the `isLive() ? read() : NEUTRAL_CONTROLS` fork in the slots layer
   * (`airjam/slots/index.ts:293-305`).
   *
   * NOTE it deliberately does not track freshness: that is the controller's
   * business, modelled by `setPublishing`.
   */
  const pushControls = (): void => {
    for (const player of core.getState().players) {
      if (player.slot < 0) continue;
      const present = presence.get(player.playerId) !== false;
      const controls = present ? core.readControls(player.playerId) : { ...NEUTRAL_CONTROLS };
      sim.setControls(player.slot, controls);
    }
  };

  /**
   * One host frame, in the donor's own order: push controls, check the
   * invariants, step the sim, poll the donor's goal flag, feed the machine,
   * clear the flag.
   *
   * The `force*` fields are how the agent's `advance_simulation` payload is
   * honoured, and they are ONE-DIRECTIONAL: they may force a value on, never
   * suppress one. The donor reads all three inputs from the sim every frame
   * (`startup.js:758-764`), so the sim is the authority; a test shortcut must
   * not be able to hide what the physics reported.
   */
  const hostTick = (
    tickOptions: {
      neutralize?: NeutralizeEvent | null;
      goal?: 0 | 1 | 2;
      ballOnGround?: boolean;
      kickoffTouched?: boolean;
    } = {},
  ): readonly StabilityViolation[] => {
    const event = tickOptions.neutralize ?? null;

    // 1. push one level per controlled slot.
    pushControls();

    // 2. the invariant gate, BEFORE the step: this is the guarantee that no
    //    non-neutral control is ever written while a disruption is being served.
    const found = observe(event);

    // 3. step the sim and poll the donor's own goal flag.
    sim.step(1);
    tick += 1;
    // The SIM is the authority for all three of these, exactly as in the donor
    // (`startup.js:756-764`). The `force*` overrides are one-directional on
    // purpose — an agent may FORCE a goal or a touch to shortcut a test, but may
    // never suppress what the physics reported. A plain `??` would be wrong
    // here: the contract's payload parser always fills these fields in
    // (`contracts/agent.ts:452-466`), defaulting to 0/false, so `??` would never
    // fall through and the sim's own goal flag would be discarded on every tick.
    const goal =
      tickOptions.goal === 1 || tickOptions.goal === 2 ? tickOptions.goal : sim.pollGoal();

    // 4. feed the machine exactly what the donor feeds it.
    core.tick({
      goal,
      ballOnGround: tickOptions.ballOnGround === true ? true : sim.ballOnGround(),
      kickoffTouched: tickOptions.kickoffTouched === true ? true : sim.kickoffTouched(),
    });
    if (goal !== 0) {
      record("goal", `goal flag ${goal} (team ${goal === 1 ? 0 : 1})`);
      sim.clearGoalFlag();
    }

    drainCommands();
    return found;
  };

  const harness: MatchHarness = {
    core,
    sim,
    monitor,

    act(actionName, rawPayload) {
      const { actionName: resolved, payload } = options.invoke(actionName, rawPayload);
      record("action", `dispatch ${resolved}`);

      dispatchToCore(core, resolved, payload, (ticks) => {
        const forced = (payload ?? {}) as Partial<AdvancePayload>;
        for (let i = 0; i < ticks; i += 1) {
          const before = core.getState();
          // `advanceTicks` in the machine stops on these three phases; so do we,
          // so a harness tick count and a real batch tick count agree.
          if (before.phase === "result" || before.phase === "lobby" || before.phase === "ready") {
            break;
          }
          hostTick({
            goal: forced.goal,
            ballOnGround: forced.ballOnGround,
            kickoffTouched: forced.kickoffTouched,
          });
        }
      });

      // Push before observing, so the gate judges the CURRENT latch rather than
      // the sim's previous buffer. A roster or binding fault — two players on
      // one slot, a ninth car — is reachable through `join_player` alone, with
      // no tick involved, and would otherwise never be reported.
      pushControls();
      drainCommands();
      syncArena();
      observe(null);
    },

    hostTick,

    setPresence(playerId, present) {
      presence.set(playerId, present);
      record("action", `presence ${playerId} = ${present ? "present" : "gone"}`);
    },

    setPublishing(playerId, publishingNow) {
      publishing.set(playerId, publishingNow);
      record("action", `publishing ${playerId} = ${publishingNow ? "live" : "silent"}`);
    },

    scheduleGoal(team, atTick) {
      sim.scheduleGoal(team, atTick);
      record("action", `schedule goal for team ${team} at sim tick ${atTick}`);
    },

    get trace() {
      return trace;
    },

    hostCommands() {
      return trace.filter((entry) => entry.kind === "host-command").map((entry) => entry.label);
    },

    violations: () => monitor.violations(),

    violationsFor: (id) => monitor.violationsFor(id),

    snapshot: () => core.getState(),

    report() {
      const state = core.getState();
      const lines: string[] = [];

      lines.push(`roster: ${state.players.length} players`);
      for (const player of state.players) {
        lines.push(
          `  slot ${player.slot}  team ${player.team}  ${player.playerId}  ready=${player.ready}`,
        );
      }

      const dispatched = trace.filter(
        (entry) => entry.kind === "action" && entry.label.startsWith("dispatch "),
      ).length;
      const goals = trace.filter((entry) => entry.kind === "goal").length;
      // The consecutive phase walk, repeats included: a match that goes
      // kickoff → playing → goal → kickoff → playing is the real story, and
      // collapsing it to a set would hide the fact that it resumed at all.
      // SAMPLED at action boundaries, so a phase an `advance` passed through
      // without stopping (kickoff → countdown → playing in one call) is not
      // listed separately. The exhaustive per-phase assertions live in the
      // test, not here.
      const phaseWalk = trace
        .map((entry) => entry.phase)
        .filter((phase, index, all) => phase !== all[index - 1]);
      const commands = harness.hostCommands();

      lines.push("");
      lines.push(`agent actions dispatched: ${dispatched}`);
      lines.push(`phase walk: ${phaseWalk.join(" -> ")}`);
      lines.push(`sim ticks stepped: ${sim.tick}`);
      lines.push(`cars in the arena: ${sim.carCount()} (native cap ${MAX_CARS})`);
      lines.push(`control writes: ${sim.controlWrites.length}`);
      lines.push(
        `host commands executed: ${commands.length} [${[...new Set(commands)].join(", ")}]`,
      );
      lines.push(`sim calls made: ${sim.commandsExecuted.length} [${[...new Set(sim.commandsExecuted)].join(", ")}]`);
      lines.push(`goals observed from the sim: ${goals}`);
      lines.push(`goals in the feed: ${state.goals.length}`);
      // Stated explicitly because the run ends on a REMATCH, which rewinds it.
      lines.push(`scoreline (post-rematch, so 0-0 is expected): ${state.score[0]} - ${state.score[1]}`);

      const counts = new Map<InvariantId, number>();
      for (const violation of monitor.violations()) {
        counts.set(violation.invariant, (counts.get(violation.invariant) ?? 0) + 1);
      }

      lines.push("");
      lines.push("invariant verdicts:");
      for (const meta of INVARIANTS) {
        const count = counts.get(meta.id) ?? 0;
        lines.push(`  ${count === 0 ? "PASS" : "FAIL"}  ${meta.id} (${count} violation(s))`);
      }
      lines.push(`  overall: ${summarizeViolations(monitor.violations())}`);

      return lines;
    },
  };

  /**
   * Seat the roster and grow the arena to match, BEFORE any action is dispatched.
   *
   * `addCar` is called per player and is allowed to refuse: a roster of nine
   * players gets nine roster entries and eight cars, and the `arena-cap`
   * invariant fires on both the ninth slot and the nine-car list. That is the
   * intended demonstration, not an error to be thrown over.
   */
  for (const [index, player] of options.players.entries()) {
    sim.addCar(player.team);
    core.joinPlayer({
      playerId: player.playerId,
      name: player.name,
      team: player.team,
      slot: index,
      isBot: player.isBot ?? false,
      ready: false,
    });
  }

  // Observe once at tick 0. A roster that is already wrong on the very first
  // tick — nine players, eight cars — is a fault from the moment the page
  // loads, and a gate that only started reporting on the first frame would let
  // it through.
  syncArena();
  observe(null);

  return harness;
};
