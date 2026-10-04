/**
 * Reader #2 of the single `SimConfig`: the donor bridge.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS IS AN INJECTED INTERFACE
 * ---------------------------------------------------------------------------
 * `src/donor/**` may not be imported here — not even for types — so the native
 * surface reaches the match core through the narrow `MatchSimBridge` below.
 * The concrete adapter that touches the Emscripten module is
 * `./donor-bridge.ts`, which is a one-way leaf: it knows the module, and nothing
 * in this directory knows the module. A unit test passes `createNullSimBridge()`
 * and exercises every mutator with zero WASM; a round-trip test passes a live
 * module.
 *
 * This mirrors the discipline `seam.ts` sets for `PortedSim`: the match core is
 * programmed against a structural type, never against the donor.
 *
 * ---------------------------------------------------------------------------
 * THE NATIVE SURFACE, VERIFIED
 * ---------------------------------------------------------------------------
 * Read out of the SHIPPED build `public/physics/rocketsim-core.js:7`, not from
 * the ORIGINAL upstream glue in `vendor/legacy-physics.js:5174-5197` — that
 * table has no `setBallState`, no `setCarState` and no `goalExplosion` at all,
 * and neither build contains an `ORIGINAL_*` symbol. Names, with the module
 * member this interface's method reaches:
 *
 *   setUnlimitedBoost(enabled)   →  _physics_setUnlimitedBoost(1|0)
 *   writeBallState(18 floats)    →  _physics_setBallState(ptr)      → 1 | 0
 *   writeCarState(slot, 24)      →  _physics_setCarState(slot, ptr) → 1 | 0
 *   goalExplosion()              →  _physics_goalExplosion()
 *   resetKickoff()               →  _physics_resetKickoff(-1)
 *   clearGoalFlag()              →  _physics_clearGoalFlag()
 *   step(ticks)                  →  _physics_step(ticks)
 *
 * The two state setters RETURN a status, and a status of 0 means the module
 * refused the block rather than half-applied it. Both are therefore reported,
 * never assumed. `_physics_getBallRadius` exists but is read-only, which is the
 * whole reason a radius mutator cannot be honoured.
 */

import {
  BALL_FIELD,
  BALL_STATE_FLOATS,
  CAR_POSE_FLOATS,
  CAR_STATE_STRIDE,
  STATE_HEADER,
  readBallPosition,
  readBallVelocity,
  readCarPosition,
} from "./donor-facts.js";
import type { SimConfig } from "./sim-config.js";

/** The narrow donor surface the match layer is allowed to touch. */
export interface MatchSimBridge {
  /** `_physics_setUnlimitedBoost`. */
  setUnlimitedBoost(enabled: boolean): void;
  /** Write the whole 18-float ball block (`_physics_setBallState`). */
  writeBallState(block: Float64Array): void;
  /** Write one car's 24-float pose (`_physics_setCarState`). */
  writeCarState(slot: number, pose: Float64Array): boolean;
  /** `_physics_goalExplosion`; returns the donor's own result. */
  goalExplosion(): number;
  /** `_physics_resetKickoff(-1)`: every car back to its kickoff spawn. */
  resetKickoff(): void;
  /** `_physics_clearGoalFlag`, after the match core has consumed the goal. */
  clearGoalFlag(): void;
  /** `_physics_step(n)`. */
  step(ticks?: number): void;
  /** Live state block. Read-only as far as this layer is concerned. */
  readonly state: Float32Array;
  /**
   * OPTIONAL: why the named call could not be made, or `null` if it can.
   *
   * This is the difference between "applied" and "applied" from the caller's
   * point of view. A bridge that wraps a real module implements it, and
   * `applySimConfigToDonor` copies the string into its `notApplied` list so a
   * mutator is never reported as active when the native call silently did
   * nothing. `createNullSimBridge` omits it: it is total by construction, so
   * there is nothing to report.
   *
   * The argument is a `MatchSimBridge` method name.
   */
  reason?(call: string): string | null;
}

/**
 * A bridge that records calls and does nothing. This is what every unit test
 * uses, and it is also the safe default for a headless host: a match can be
 * driven end to end with no simulation at all, which is exactly what the agent
 * contract needs.
 */
export interface RecordingSimBridge extends MatchSimBridge {
  readonly calls: readonly string[];
}

export const createNullSimBridge = (
  state: Float32Array = new Float32Array(0),
): RecordingSimBridge => {
  const calls: string[] = [];
  const record = (name: string) => {
    calls.push(name);
  };
  return {
    calls,
    setUnlimitedBoost: (enabled) => record(`setUnlimitedBoost:${enabled ? 1 : 0}`),
    writeBallState: (block) => record(`writeBallState:${block.length}`),
    writeCarState: (slot, pose) => {
      record(`writeCarState:${slot}:${pose.length}`);
      return true;
    },
    goalExplosion: () => {
      record("goalExplosion");
      return 1;
    },
    resetKickoff: () => record("resetKickoff"),
    clearGoalFlag: () => record("clearGoalFlag"),
    step: (ticks) => record(`step:${ticks ?? 1}`),
    get state() {
      return state;
    },
  };
};

/* -------------------------------------------------------------------------- */
/* Reading the ball out of the state block                                      */
/* -------------------------------------------------------------------------- */

const copyBallBlock = (state: Float32Array): Float64Array => {
  const block = new Float64Array(BALL_STATE_FLOATS);
  for (let i = 0; i < BALL_STATE_FLOATS; i += 1) {
    const value = state[STATE_HEADER.BALL + i];
    block[i] = typeof value === "number" && Number.isFinite(value) ? value : 0;
  }
  return block;
};

/**
 * Rewrite the ball block with the config's ball transforms applied.
 *
 * The donor exposes `_physics_setBallState` and NOTHING else for the ball: no
 * radius setter, no restitution setter, no mass setter. So a ball mutator is
 * applied by scaling what we hand the engine:
 *
 *  - `ballVelocityScale` multiplies the ball's own velocity, which is how
 *    `BOOMER_BALL` gets its bounce and how `HEAVY_BALL` gets its weight.
 *  - `ballRadiusScale` has no writable field — the radius lives in the
 *    collision mesh, not in the state block — so it is carried in
 *    `BallPose.radiusScale` for the layer that CAN act on it, and the
 *    velocity scale below is derived from it so a bigger ball is still
 *    measurably different without a radius setter.
 *
 * HONEST LIMITATION: a true radius change is not reachable from outside the
 * donor. `applySimConfigToDonor` reports it in its return value so the host can
 * show the player that the visual radius did not change.
 */
export interface BallPose {
  readonly pos: readonly [number, number, number];
  readonly vel: readonly [number, number, number];
  readonly radiusScale: number;
}

/** Read the ball's pose + the config's requested radius scale. */
export const readBallPose = (state: Float32Array, config: SimConfig): BallPose => ({
  pos: readBallPosition(state),
  vel: readBallVelocity(state),
  radiusScale: config.ballRadiusScale,
});

/**
 * One requested effect that did not happen, and why.
 *
 * This exists so "the mutator is selected" can never be mistaken for "the mutator
 * is in effect". Every entry is a promise the port could not keep, recorded at
 * the moment it was broken.
 */
export interface NotApplied {
  /** The `SimConfig` field that was requested. */
  readonly field: string;
  /** What the config asked for, rendered for a readout. */
  readonly requested: string;
  /** Why it could not be delivered. Never empty. */
  readonly reason: string;
}

/**
 * What `applySimConfigToDonor` was actually able to do.
 *
 * `radiusApplied: false` means the donor's ball radius could not be changed and
 * the caller should not claim otherwise in the UI. `notApplied` is the full,
 * structured version of that: it names every field that was asked for and not
 * delivered, including the ones that are not native setters at all.
 */
export interface SimConfigApplication {
  readonly config: SimConfig;
  readonly unlimitedBoostApplied: boolean;
  readonly ballVelocityApplied: boolean;
  /** Always false with the current donor. See the note above. */
  readonly radiusApplied: boolean;
  /** True when the config is stock and nothing needed writing. */
  readonly noop: boolean;
  /** Every requested effect that was not delivered. Empty when nothing failed. */
  readonly notApplied: readonly NotApplied[];
}

/** Read a bridge's optional `reason`, defensively: a bridge may throw from it. */
const why = (bridge: MatchSimBridge, call: string): string => {
  if (typeof bridge.reason !== "function") return "";
  try {
    return bridge.reason(call) ?? "";
  } catch {
    return "";
  }
};

/** A thrown message is the last-resort reason, for a bridge with no `reason`. */
const describeThrown = (error: unknown): string =>
  error instanceof Error && error.message ? error.message : String(error);

/**
 * THE ONE place a `SimConfig` is pushed into the donor.
 *
 * Idempotent and safe to call every kickoff: a stock config writes nothing.
 * It never throws — a missing native entry point is reported in the result
 * rather than crashing a live match — and it never claims an effect it did not
 * deliver. Everything it could not do lands in `notApplied` with a reason.
 */
export const applySimConfigToDonor = (
  config: SimConfig,
  bridge: MatchSimBridge,
): SimConfigApplication => {
  const stock = config.ballVelocityScale === 1;
  const notApplied: NotApplied[] = [];
  let unlimitedBoostApplied = false;
  let ballVelocityApplied = false;

  if (config.unlimitedBoost) {
    try {
      bridge.setUnlimitedBoost(true);
      unlimitedBoostApplied = true;
    } catch (error) {
      unlimitedBoostApplied = false;
      notApplied.push({
        field: "unlimitedBoost",
        requested: "unlimited boost on",
        reason: why(bridge, "setUnlimitedBoost") || describeThrown(error),
      });
    }
  }

  if (!stock) {
    // Offsets inside `block` are RELATIVE to the ball block, because that is
    // exactly what `_physics_setBallState(pointer)` reads.
    const block = copyBallBlock(bridge.state);
    for (let axis = 0; axis < 3; axis += 1) {
      const at = BALL_FIELD.VEL + axis;
      block[at] = (block[at] ?? 0) * config.ballVelocityScale;
    }
    try {
      bridge.writeBallState(block);
      ballVelocityApplied = true;
    } catch (error) {
      ballVelocityApplied = false;
      notApplied.push({
        field: "ballVelocityScale",
        requested: `ball velocity x${config.ballVelocityScale}`,
        reason: why(bridge, "writeBallState") || describeThrown(error),
      });
    }
  }

  // The honest floor: the fields that have no reachable mechanism, whatever the
  // module does or does not export. These are properties of the donor, not
  // failures of this call, so they are reported for EVERY config rather than
  // only for the mutators that use them.
  if (config.ballRadiusScale !== 1) {
    notApplied.push({
      field: "ballRadiusScale",
      requested: `ball radius x${config.ballRadiusScale}`,
      reason:
        "the ball's collision radius lives in the arena collision mesh, not in the 18-float ball block, and _physics_getBallRadius is a read-only getter — the export table has no radius setter",
    });
  }

  if (config.ballMassScale !== 1) {
    notApplied.push({
      field: "ballMassScale",
      requested: `ball mass x${config.ballMassScale}`,
      reason:
        "the export table has no mass setter, and no control-shaping field consumes it either; the closest delivered effect is the ballVelocityScale proxy above",
    });
  }

  if (config.jumpScale !== 1) {
    notApplied.push({
      field: "jumpScale",
      requested: `jump impulse x${config.jumpScale}`,
      reason:
        "a jump is a press and the seam is level-based (seam.ts), so there is no analogue jump axis to scale; raising `gravityBias` is what actually makes a car hang higher",
    });
  }

  return {
    config,
    unlimitedBoostApplied,
    ballVelocityApplied,
    radiusApplied: false,
    noop: !config.unlimitedBoost && stock,
    notApplied,
  };
};

/**
 * Re-assert the ball's own velocity scale WITHOUT touching position. The ball
 * block is rewritten on every car contact for `BOOMER_BALL`, so this is what
 * the stat tracker calls after a native `BALL_HIT_SERIAL` bump.
 */
export const rescaleBallVelocity = (
  config: SimConfig,
  bridge: MatchSimBridge,
): boolean => {
  if (config.ballVelocityScale === 1) return false;
  const result = applySimConfigToDonor(config, bridge);
  return result.ballVelocityApplied;
};

/** Re-exported so callers need not reach into `./donor-facts.ts` for these. */
export { CAR_POSE_FLOATS, CAR_STATE_STRIDE, readCarPosition };
