/**
 * Public surface of the match layer (Phase 7) and the agent contract.
 *
 * ---------------------------------------------------------------------------
 * DEPENDENCY DIRECTION
 * ---------------------------------------------------------------------------
 * This module depends on `src/airjam/seam.ts` for `CarControls` and
 * `NEUTRAL_CONTROLS` only, and on `@air-jam/sdk` for the store. It does NOT
 * import:
 *  - `src/airjam/input/**`, `src/airjam/slots/**`, `src/airjam/viewports/**`
 *    or `src/controller/**` — those belong to other workers. Player → car
 *    mapping arrives as a plain `PlayerEntry` and the host calls `tick()`.
 *  - `src/donor/**` — not even a value import, so nothing here can pull WASM,
 *    Three.js or the arena meshes into a unit test.
 *
 * The result is that every non-React export runs under `environment: "node"`.
 */

export {
  BALL_FIELD,
  BALL_STATE_FLOATS,
  CAR_FIELD,
  CAR_POSE_FLOATS,
  CAR_STATE_STRIDE,
  COUNTDOWN_TICKS,
  GOAL_TICKS,
  REGULATION_TICKS,
  SIM_HZ,
  STATE_HEADER,
  TEAM_LABEL,
  TICKS_PER_SECOND,
  attackSignFor,
  carBase,
  halfOfBallX,
  otherTeam,
  readBallHitSerial,
  readBallHitSpeed,
  readBallPosition,
  readBallVelocity,
  readBoost,
  readCarCount,
  readCarPosition,
  readDemoed,
  readGoalFlag,
  readOnGround,
} from "./donor-facts.js";

export {
  MUTATOR_DESCRIPTION,
  MUTATOR_IDS,
  MUTATOR_LABEL,
  MUTATOR_REGISTRY,
  DEFAULT_MUTATOR,
  STAT_TUNING,
  resolveSimConfig,
  simConfigFor,
} from "./sim-config.js";
export type { MutatorId, SimConfig, StatTuning } from "./sim-config.js";

export { NEUTRAL_CONTROL_CONTEXT, shapeControls } from "./controls.js";
export type { ControlContext } from "./controls.js";

export {
  applySimConfigToDonor,
  createNullSimBridge,
  readBallPose,
  rescaleBallVelocity,
} from "./sim-bridge.js";
export type {
  BallPose,
  MatchSimBridge,
  RecordingSimBridge,
  SimConfigApplication,
} from "./sim-bridge.js";

export {
  EMPTY_STATS,
  STAT_CONFIDENCE,
  createTrackerState,
  readLastTouch,
  resetTrackerStats,
  syncRoster,
  trackTick,
} from "./stats.js";
export type { OpenShot, TrackerResult, TrackerState } from "./stats.js";

export {
  IDLE_TICK,
  advanceTicks,
  createInitialMatchState,
  createTickRuntime,
  formatClock,
  reduceEndMatch,
  reduceGoal,
  reduceJoinPlayer,
  reduceKickoff,
  reduceLeaveMatch,
  reduceLeavePlayer,
  reduceReadyPlayer,
  reduceRefreshReadiness,
  reduceRematch,
  reduceSetBallCam,
  reduceSetMutator,
  reduceSetTeam,
  reduceStartMatch,
  reduceSwapTeams,
  reduceTick,
} from "./machine.js";
export type {
  AdvanceResult,
  GoalOutcome,
  TickResult,
  TickRuntime,
} from "./machine.js";

export {
  countdownLabel,
  createMatchCore,
  findMvp,
  formatScoreline,
  winnerLabel,
} from "./core.js";
export type {
  CarTrackingView,
  MatchCore,
  MatchCoreOptions,
  PendingWork,
} from "./core.js";

export { matchCore, pushDonorTick, syncMatchStore, useMatchStore } from "./store.js";
export type { MatchStoreState } from "./store.js";

export { MATCH_PHASES } from "./types.js";
export type {
  GoalEvent,
  MatchClock,
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
