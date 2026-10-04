/**
 * Public surface of the car-slot layer (Phase 3).
 *
 * ---------------------------------------------------------------------------
 * DEPENDENCY DIRECTION
 * ---------------------------------------------------------------------------
 * This module depends on `seam.ts` (types AND the `NEUTRAL_CONTROLS` /
 * `sanitizeControls` / `MAX_CARS` values) and on nothing else. It does NOT
 * import:
 *  - the input worker's files — `CarInputSource` arrives as an interface,
 *    constructed by whoever calls `createCarSlotRegistry({ createSource })`;
 *  - `src/donor/**` — not even a value import, so nothing here can accidentally
 *    pull WASM, Three.js or the arena meshes into a unit test.
 *
 * The result is that every module here is pure and runs under `environment:
 * "node"`.
 */

export {
  CAR_FIELD,
  CAR_POSE_FLOATS,
  CAR_STATE_STRIDE,
  NATIVE_MAX_CARS,
  PROTOCOL_MAX_CARS,
  POSE_VECTORS,
  STATE_HEADER,
  carBase,
  isUsablePose,
  readCarCount,
  readCarPose,
  readDemoed,
  readOnGround,
} from "./donor-facts.js";

export {
  balanceTeamFor,
  otherTeam,
  planRoster,
  teamSizesOf,
} from "./team-balance.js";
export type {
  RosterPlan,
  RosterPlanOptions,
  RosterRole,
  RosterSeat,
  Team,
} from "./team-balance.js";

export {
  isMirroredPair,
  planKickoffPlacement,
  readKickoffFacing,
  yaw180Pose,
} from "./kickoff.js";
export type {
  KickoffPlacement,
  KickoffPlan,
  KickoffStateView,
  SlotTeams,
} from "./kickoff.js";

export { growArena, verifyKickoffSymmetry } from "./growth.js";
export type {
  ArenaGrowthCapability,
  ArenaRefusal,
  GrowArenaResult,
  GrownCar,
} from "./growth.js";

export { createCarSlotRegistry, planMatchRoster, pushControls } from "./car-slot-registry.js";
export type {
  CarSlotRegistryOptions,
  LiveSlot,
  ManagedCarSlotRegistry,
  SlotEntry,
} from "./car-slot-registry.js";
