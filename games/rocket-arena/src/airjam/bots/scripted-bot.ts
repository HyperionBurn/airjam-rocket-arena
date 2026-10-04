/**
 * Scripted bot policies — deterministic, headless-safe, no neural runtime.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS IS A PRODUCT FEATURE AND NOT A TEST STUB
 * ---------------------------------------------------------------------------
 * All three donor models refuse to observe anything but two cars
 * (`observations.js:5-8`, `necto.js:28-29`, `seer.js:82-83`). A 2v2 or 3v3 is
 * therefore not a case where a bot is "a bit worse" — it is a case where
 * `decide()` throws, and the donor's answer to a throw is to pause the match
 * (`app/startup.js:734-744`). Since the product must run 2v2 and 3v3, the only
 * way to have a bot in those arenas is a policy that is not one of the three
 * 1v1 models. That is this file.
 *
 * It also serves the headless contract: an automated test or the agent harness
 * can exercise a whole match with no ONNXRuntime, no WASM, no Worker and no
 * 9.9 MB download.
 *
 * ---------------------------------------------------------------------------
 * DETERMINISM IS THE POINT
 * ---------------------------------------------------------------------------
 * No `Math.random`, no `Date.now`, no module-level mutable state. Every control
 * is a pure function of the observation, so the same tick always yields the same
 * action and a test can assert on exact values. The one genuine unknown — which
 * way `steer` turns relative to the state's axes — is a named, documented
 * constant rather than a guess buried in an expression, because it cannot be
 * settled without running the donor's physics and the host may need to flip it.
 */

import { CAR_STATE, STATE, carOffset, readCar } from "../seam.js";
import type { CarControls } from "../seam.js";
import type { BotDifficultyId } from "./bot-difficulty.js";
import type { BotObservation } from "./bot-inference.js";
import type { BotInference } from "./bot-inference.js";

/**
 * Sign applied to the ball-bearing correction. `seam.ts:93` defines
 * `steer: -1 left .. +1 right`; the mapping from the donor's axis handedness to
 * that convention is the sim's business, and the mirroring in
 * `observations.js:41` flips X but never steer, so steer is a rotation
 * direction rather than a handedness. Flip this one constant if a real match
 * shows the bots steering away from the ball.
 */
export const SCRIPTED_STEER_SIGN = 1 as const;

const clamp = (value: number, low: number, high: number): number =>
  value < low ? low : value > high ? high : value;

export type ScriptedPolicy = (observation: BotObservation) => CarControls;

/**
 * A deterministic ball chaser: drive at the ball, boost when lined up, jump when
 * close. Reads only the state block, so it works in a unit test with a
 * hand-built `Float32Array`.
 */
export const chaserPolicy: ScriptedPolicy = (observation) => {
  const { state, slot } = observation;
  if (!state || state.length < STATE.PADS) return { throttle: 0, steer: 0, pitch: 0, yaw: 0, roll: 0, jump: false, boost: false, handbrake: false };

  const car = readCar(state, slot);
  if (!car) return { throttle: 0, steer: 0, pitch: 0, yaw: 0, roll: 0, jump: false, boost: false, handbrake: false };

  const at = carOffset(slot);
  const fx = state[at + CAR_STATE.FWD] ?? 0;
  const fy = state[at + CAR_STATE.FWD + 1] ?? 0;
  const bx = (state[STATE.BALL] ?? 0) - car.pos[0];
  const by = (state[STATE.BALL + 1] ?? 0) - car.pos[1];

  const distance = Math.hypot(bx, by);
  if (distance < 1e-3) return { throttle: 0, steer: 0, pitch: 0, yaw: 0, roll: 0, jump: false, boost: false, handbrake: false };

  // Cross product of forward × to-ball gives which way to turn; normalising by
  // the distance keeps the command inside [-1, 1] at every range.
  const cross = (fx * by - fy * bx) / distance;
  const steer = clamp(SCRIPTED_STEER_SIGN * cross, -1, 1);
  const linedUp = Math.abs(cross) < 0.25;

  return {
    throttle: 1,
    steer,
    pitch: 0,
    yaw: 0,
    roll: 0,
    jump: car.onGround && distance < 250,
    boost: linedUp && car.onGround && car.boost > 0 && distance > 400,
    handbrake: false,
  };
};


/* -------------------------------------------------------------------------- */
/* Skill-based, goal-aware policy                                              */
/* -------------------------------------------------------------------------- */

/**
 * Half the pitch length in native units (the goal line, `reference-post` / arena
 * collision). Team 0 (blue) attacks +Y and defends -Y; team 1 is the mirror.
 * Measured in a real match: a ball driven to +Y scores for team 0.
 */
export const FIELD_HALF_LENGTH = 5120;
/** Keep aim points inside the playable field so a bot never tries to drive into a wall. */
const FIELD_HALF_WIDTH_SAFE = 3600;
const FIELD_HALF_LENGTH_SAFE = 4600;

export type ScriptedSkill = "rookie" | "pro" | "ace";

interface SkillProfile {
  /** Cap on throttle (a rookie never floors it). */
  readonly throttleCap: number;
  readonly boost: boolean;
  readonly jump: boolean;
  /** Deterministic steering wobble, as a fraction of full lock. */
  readonly wobble: number;
  /** Goes back goal-side when the ball is deep in its own half. */
  readonly defends: boolean;
  /** How far behind the ball (toward its own goal) it lines up before striking. */
  readonly setupDistance: number;
}

const SKILL_PROFILES: Readonly<Record<ScriptedSkill, SkillProfile>> = Object.freeze({
  rookie: { throttleCap: 0.78, boost: false, jump: false, wobble: 0.3, defends: false, setupDistance: 120 },
  pro: { throttleCap: 1, boost: true, jump: true, wobble: 0.08, defends: true, setupDistance: 260 },
  ace: { throttleCap: 1, boost: true, jump: true, wobble: 0, defends: true, setupDistance: 340 },
});

const NEUTRAL: CarControls = Object.freeze({
  throttle: 0,
  steer: 0,
  pitch: 0,
  yaw: 0,
  roll: 0,
  jump: false,
  boost: false,
  handbrake: false,
});

/**
 * A bot that plays the game rather than chasing the ball.
 *
 *  - It lines up BEHIND the ball (on the side away from the goal it attacks) and
 *    then drives through it, so a touch sends the ball toward the opponent's net.
 *  - If it is ahead of the ball it first goes round, wide, to get back behind it,
 *    instead of pushing the ball toward its own goal.
 *  - When the ball is deep in its own half and it is out of position, it returns
 *    goal-side first.
 *  - It boosts only when pointing at its target on the ground, and never with an
 *    empty tank; a rookie never boosts or jumps and steers with a visible wobble.
 *
 * Pure function of the observation (no randomness, no state): the "wobble" is a
 * sine of the kickoff tick, so a given tick always gives the same controls.
 */
export const createScriptedPolicy =
  (skill: ScriptedSkill): ScriptedPolicy =>
  (observation) => {
    const profile = SKILL_PROFILES[skill];
    const { state, slot, team, kickoffTick } = observation;
    if (!state || state.length < STATE.PADS) return NEUTRAL;
    const car = readCar(state, slot);
    if (!car) return NEUTRAL;

    const at = carOffset(slot);
    const fx = state[at + CAR_STATE.FWD] ?? 0;
    const fy = state[at + CAR_STATE.FWD + 1] ?? 0;
    const carX = car.pos[0];
    const carY = car.pos[1];
    const ballX = state[STATE.BALL] ?? 0;
    const ballY = state[STATE.BALL + 1] ?? 0;
    const ballZ = state[STATE.BALL + 2] ?? 0;

    const attackDir = team === 0 ? 1 : -1;
    const attackY = attackDir * FIELD_HALF_LENGTH;
    const ownY = -attackY;

    const ballDistance = Math.hypot(ballX - carX, ballY - carY);
    if (ballDistance < 1e-3) return NEUTRAL;

    // Is the ball further toward the opponent's goal than the car? Then the car
    // is on the right side of it to hit it that way.
    const behindBall = (ballY - carY) * attackDir > 0;
    const carToOwnGoal = Math.hypot(carX, carY - ownY);
    const ballToOwnGoal = Math.hypot(ballX, ballY - ownY);

    let targetX: number;
    let targetY: number;
    if (profile.defends && !behindBall && ballToOwnGoal < 3200 && carToOwnGoal > ballToOwnGoal) {
      // Out of position with danger near our goal: get goal-side of the ball.
      targetX = ballX * 0.4;
      targetY = ownY + attackDir * 900;
    } else if (behindBall) {
      // Line up on the ball-to-goal line, behind the ball, then strike through it.
      const toGoalX = -ballX;
      const toGoalY = attackY - ballY;
      const toGoalLength = Math.hypot(toGoalX, toGoalY) || 1;
      const setup = ballDistance < 380 ? 0 : Math.min(ballDistance * 0.45, profile.setupDistance);
      targetX = ballX - (toGoalX / toGoalLength) * setup;
      targetY = ballY - (toGoalY / toGoalLength) * setup;
    } else {
      // Ahead of the ball: swing wide and get back behind it.
      const side = carX >= ballX ? 1 : -1;
      targetX = ballX + side * 700;
      targetY = ballY - attackDir * 1100;
    }
    targetX = clamp(targetX, -FIELD_HALF_WIDTH_SAFE, FIELD_HALF_WIDTH_SAFE);
    targetY = clamp(targetY, -FIELD_HALF_LENGTH_SAFE, FIELD_HALF_LENGTH_SAFE);

    const dx = targetX - carX;
    const dy = targetY - carY;
    const distance = Math.hypot(dx, dy) || 1;
    // cross > 0 turns one way, < 0 the other; dot says how well we are pointed.
    const cross = (fx * dy - fy * dx) / distance;
    const dot = (fx * dx + fy * dy) / distance;

    const wobble = Math.sin(((kickoffTick < 0 ? 0 : kickoffTick) + slot * 37) / 41) * profile.wobble;
    const steer = clamp(SCRIPTED_STEER_SIGN * cross * 2.2 + wobble, -1, 1);
    const pointedAtTarget = dot > 0.85 && Math.abs(cross) < 0.2;
    const turningHard = dot < 0.3;

    return {
      throttle: turningHard ? profile.throttleCap * 0.6 : profile.throttleCap,
      steer: dot < -0.2 ? (cross >= 0 ? 1 : -1) * SCRIPTED_STEER_SIGN : steer,
      pitch: 0,
      yaw: 0,
      roll: 0,
      jump: profile.jump && car.onGround && ballDistance < 330 && ballZ > 150 && dot > 0.6,
      boost: profile.boost && pointedAtTarget && car.onGround && car.boost > 8 && distance > 600,
      handbrake: turningHard && car.onGround && distance > 500,
    };
  };

/** The default for a given skill; `chaserPolicy` stays as the simple baseline. */
export const SCRIPTED_POLICIES: Readonly<Record<ScriptedSkill, ScriptedPolicy>> = Object.freeze({
  rookie: createScriptedPolicy("rookie"),
  pro: createScriptedPolicy("pro"),
  ace: createScriptedPolicy("ace"),
});

/** Drives straight forward forever. The simplest possible smoke-test policy. */
export const driveStraightPolicy: ScriptedPolicy = () => ({
  throttle: 1,
  steer: 0,
  pitch: 0,
  yaw: 0,
  roll: 0,
  jump: false,
  boost: false,
  handbrake: false,
});

export interface ScriptedInferenceOptions {
  /** Reported id, so a status readout can tell a scripted seat from a neural one. */
  readonly id?: BotDifficultyId;
  readonly policy?: ScriptedPolicy;
  /** Donor's decision cadence, 8 sim ticks = 15 Hz at 120 Hz. */
  readonly tickSkip?: number;
}

export const DEFAULT_SCRIPTED_POLICY: ScriptedPolicy = chaserPolicy;

/**
 * Wrap a pure policy as a `BotInference`. `decide` resolves on a microtask,
 * which keeps the async contract the rest of the layer is written against while
 * doing no work and touching no clock.
 */
export const createScriptedInference = (options: ScriptedInferenceOptions = {}): BotInference => {
  const policy = options.policy ?? DEFAULT_SCRIPTED_POLICY;
  let disposed = false;

  return {
    id: options.id ?? "disabled",
    isReady: true,
    requiresNeuralRuntime: false,
    load: () => Promise.resolve(),
    decide: (observation) => {
      if (disposed) {
        // Still resolves: a torn-down seat must never reject into the frame.
        return Promise.resolve(chaserPolicy(observation));
      }
      return Promise.resolve(policy(observation));
    },
    reset: () => {
      /* Stateless by construction. */
    },
    dispose: () => {
      disposed = true;
    },
  };
};

/**
 * A brain that is ready and always says "go straight". This is what the
 * `disabled` difficulty entry binds to: the seat still exists (so the team
 * sizes stay legal and the match is fair) and it still writes to the sim, it
 * simply never asks for input. Zero bytes are downloaded.
 */
export const createNeutralInference = (id: BotDifficultyId = "disabled"): BotInference => ({
  id,
  isReady: true,
  requiresNeuralRuntime: false,
  load: () => Promise.resolve(),
  decide: () =>
    Promise.resolve({
      throttle: 0,
      steer: 0,
      pitch: 0,
      yaw: 0,
      roll: 0,
      jump: false,
      boost: false,
      handbrake: false,
    }),
  reset: () => {
    /* nothing to reset */
  },
  dispose: () => {
    /* nothing to release */
  },
});
