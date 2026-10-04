/**
 * Phase 2 — Air Jam phone input → the donor's level-triggered car controls.
 *
 * Read `airjam-input-source.ts` first: it carries the pulse→level rule and the
 * ground/air mapping rationale. `seam.ts` (owned by the orchestrator) defines
 * the types this layer implements.
 *
 * HOST LOOP CALL ORDER, every tick:
 *
 *   1. `feedCarStates(onGroundBySlot)`   — RocketSim's ON_GROUND, by slot
 *   2. `readAll()`                       — one stable level view per player
 *   3. `sim.setControls(slot, controls)` — for each live source
 *
 * Around it, from the SDK's React side:
 *
 *   - `installInputSources({ registry, readRaw: (id) => getInput(id), attach })`
 *   - on join:     `register(playerId, team)`
 *   - on presence: `syncPresence(host.controllers)`
 *   - on leave:    `unregister(playerId)`
 *   - on blur / teardown: `neutralizeAll("blurred")`, then `dispose()`
 *
 * This layer is plain TypeScript: no React, no SDK import, no donor import.
 */

export {
  createAirJamInputSource,
  type AirJamInputSourceOptions,
  type CarStateContext,
  type ManagedCarInputSource,
} from "./airjam-input-source";

export {
  installInputSources,
  type AttachInputSource,
  type InputSourceSnapshot,
  type InputSourcesController,
  type InstallInputSourcesOptions,
  type PresenceNotice,
} from "./install-input-sources";

export {
  EMPTY_ROCKET_ARENA_INPUT,
  parseRocketArenaInput,
  ROCKET_ARENA_INPUT_BEHAVIOR,
  ROCKET_ARENA_INPUT_FIELDS,
  type LobbyIntent,
  type LobbyTeamPreference,
  type RocketArenaInput,
  type RocketArenaInputBehavior,
  type RocketArenaInputField,
} from "./input-contract";

export {
  installStuckInputGuard,
  uninstallStuckInputGuard,
  type GuardedSource,
  type GuardEventTarget,
  type GuardTarget,
  type PointerPolicy,
  type StuckInputGuard,
  type StuckInputGuardOptions,
} from "./stuck-input-guard";

export {
  clampUnit,
  DEFAULT_STICK_SHAPING,
  resolveStickShaping,
  shapeAxis,
  shapeStick,
  type StickShaping,
  type StickVector,
} from "./stick";
