/**
 * ============================================================================
 * PHASE 12 — EVENT MODE. Public surface.
 * ============================================================================
 *
 * OWNER: the Event Mode worker (`src/airjam/event/**`).
 *
 * ---------------------------------------------------------------------------
 * THE PIPELINE, IN CALL ORDER
 * ---------------------------------------------------------------------------
 * A host wiring EVENT MODE uses this barrel in exactly this sequence:
 *
 *   1. `applyEventMode({ players })`
 *      → what the room becomes if EVENT MODE is turned on. Configure only.
 *
 *   2. `runEventMatch({ launch: "start", players })`
 *      → the complete, resolved match plan: seats, teams, bots, mutator,
 *        quality, timings. Read `plan.guard.ok` BEFORE dispatching
 *        `plan.lobbyActions`.
 *
 *   3. `runEventMatch({ launch: "rematch", players, matchNumber })`
 *      → the same plan with only the reset changed. No joins, no leaves.
 *
 *   4. `dryRunEventMatch(input)`
 *      → the whole thing against a null sim, with an ordered step list. Safe to
 *        call at boot; never throws.
 *
 *   `eventCycleHeadline(players)` is the one-liner for a producer screen.
 *
 * ---------------------------------------------------------------------------
 * DEPENDENCY DIRECTION
 * ---------------------------------------------------------------------------
 * This directory imports FROM the other phases and nothing imports INTO it
 * except the orchestrator. It depends on:
 *
 *   `@/lobby/settings`  — `EVENT_MODE_SETTINGS`, `matchDurationMs`, `formatClock`
 *   `@/lobby/types`     — the lobby's domain types
 *   `@/match/sim-config`   — `MUTATOR_REGISTRY`, `resolveSimConfig`, `SimConfig`
 *   `@/match/donor-facts`  — the donor's own tick constants
 *   `@/match/sim-bridge`   — `applySimConfigToDonor`, `createNullSimBridge`
 *   `@/airjam/bots`     — `planBotFill`, the difficulty/licence registry
 *   `@/airjam/slots`    — `planMatchRoster`
 *   `@/airjam/perf`     — `resolveStartingPreset`, `poorestOf`, the preset table
 *   `@/airjam/seam`     — `MAX_CARS`, `QualityPreset`
 *
 * It does NOT import `src/donor/**` at all — not even as types — and no WASM or
 * Three.js. Every export therefore runs under `environment: "node"`, which is
 * what makes the dry run and the whole guard layer testable without an arena.
 *
 * ---------------------------------------------------------------------------
 * THE TWO CONSTRAINTS FROM PHASE 8, RESTATED WHERE A READER WILL MEET THEM
 * ---------------------------------------------------------------------------
 *  1. The donor's ONNX bots are 1v1-only (all three models hard-require
 *     `NUM_CARS === 2`). EVENT MODE IS 2v2 OR 3v3, SO IT CANNOT USE DONOR AI.
 *     `resolveEventBotMode` therefore resolves to `"scripted"` for every
 *     arena larger than two cars, and the plan carries a `downgradeReason`
 *     saying so. That is Phase 8's scripted/seat-only path, not a stub.
 *  2. Seer v0 is MIT; Necto and Nexto are CC BY-NC-SA 4.0 (non-commercial).
 *     `EVENT_BOT_SKILL_TO_MODEL` maps all three lobby skill levels onto the MIT
 *     model, so a non-commercial model is unreachable from EVENT MODE by
 *     construction rather than by a filter someone has to remember.
 */

export {
  DEFAULT_PACING,
  DEFAULT_PACING_ASSUMPTIONS,
  EVENT_PACING,
  EVENT_PACING_ASSUMPTIONS,
  deriveEventCycle,
  isPacingCoherent,
  pacingForTuning,
  pacingOrderingViolations,
  ticksToMs,
} from "./pacing.js";
export type {
  EventCycle,
  EventPacing,
  PacingAssumptions,
  PacingBeat,
} from "./pacing.js";

export {
  EVENT_BOT_SKILL_TO_MODEL,
  EVENT_DEFAULT_TEAM,
  EVENT_MODE_DOCUMENTED_VALUES,
  EVENT_MODE_REPLACES_PACING,
  EVENT_MODE_SPEC,
  eventMutatorConfig,
  eventSeatCeiling,
  lobbySettingsForEventMode,
  resolveEventBotMode,
  resolveEventTeamSize,
} from "./spec.js";
export type {
  EventBotMode,
  EventBotResolution,
  EventBotSpec,
  EventModeSpec,
  EventQualitySpec,
  EventTeamSizePolicy,
} from "./spec.js";

export {
  applyEventMode,
  eventPlanSignature,
  flattenSimConfig,
  isKnownMutator,
  resolveEventQuality,
  EVENT_MODE_DOCUMENTED_PLAYERS,
} from "./plan.js";
export type {
  ApplyEventModeInput,
  EventBotPlan,
  EventModePlan,
  EventQualityResolution,
  EventSimConfig,
} from "./plan.js";

export { firstRefusal, guardEventMatch } from "./guard.js";
export type {
  EventGuardInput,
  EventGuardResult,
  EventNotice,
  EventRefusal,
  EventRefusalCode,
} from "./guard.js";

export {
  eventCycleHeadline,
  fourPlayers,
  planDocumentedEvent,
  runEventMatch,
} from "./run.js";
export type {
  EventLaunchKind,
  EventMatchInput,
  EventMatchPlan,
  EventMatchReset,
  EventPlayerInput,
  EventSeatPlan,
} from "./run.js";

export { dryRunEventMatch } from "./dry-run.js";
export type { EventDryRunReport, EventDryRunStep } from "./dry-run.js";
