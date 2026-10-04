/**
 * ============================================================================
 * PHASE 12 — EVENT MODE. THE PLAN. `applyEventMode()`.
 * ============================================================================
 *
 * OWNER: the Event Mode worker (`src/airjam/event/**`).
 *
 * ---------------------------------------------------------------------------
 * WHAT `applyEventMode()` IS FOR
 * ---------------------------------------------------------------------------
 * It answers exactly one question: "if the host taps EVENT MODE right now, what
 * does the room become?" It does NOT start a match, touch the registry, claim a
 * slot or load a model. That separation is deliberate — configuring a room and
 * launching a match are two different moments, and a host screen wants to show
 * the configured room BEFORE anyone commits to it.
 *
 * The output is a PLAIN, TYPED, SERIALISABLE object. No class instances, no
 * functions, no `Float32Array`, no `Map`/`Set`, no class instances from Phase 7's
 * frozen `SimConfig` — the config is flattened to its own fields so the plan
 * survives `JSON.stringify`, a postMessage, or a log line. `eventPlanSignature`
 * is that proof, and `runEventMatch` reuses it to make idempotency testable
 * rather than asserted.
 *
 * ---------------------------------------------------------------------------
 * WHY `planBotFill` AND NOT `planRoster` FOR THE COUNTS
 * ---------------------------------------------------------------------------
 * Phase 3's `planRoster` pads bots only until the two teams are EQUAL. Phase 8's
 * `planBotFill` pads them until both teams reach `teamSize`. EVENT MODE needs
 * the second: a 2v2 EVENT MODE match with one player present must be TWO cars
 * per side, not one. So the counts — which is the policy question — come from
 * Phase 8, and Phase 3 is used in `run.ts` for the thing only it can do, which
 * is assign stable seat indices while preserving player identity and explicit
 * team requests across a rematch.
 */

import { planBotFill } from "@/airjam/bots/bot-fill-plan";
import type { BotFillPlan } from "@/airjam/bots/bot-fill-plan";
import { resolveStartingPreset } from "@/airjam/perf/preset-resolver";
import type { DeviceCapability } from "@/airjam/perf/preset-resolver";
import { poorestOf } from "@/airjam/perf/quality-ladder";
import { presetForViewportCount } from "@/airjam/viewports/quality";
import type { QualityPreset } from "@/airjam/seam";
import { matchDurationMs } from "@/lobby/settings";
import type { LobbyAction, LobbySettings, MatchLengthMinutes } from "@/lobby/types";
import { MUTATOR_REGISTRY } from "@/match/sim-config";
import type { MutatorId, SimConfig } from "@/match/sim-config";
import { deriveEventCycle, pacingForTuning, type EventCycle, type EventPacing } from "./pacing.js";
import {
  EVENT_MODE_SPEC,
  eventMutatorConfig,
  lobbySettingsForEventMode,
  resolveEventBotMode,
  resolveEventTeamSize,
  type EventBotResolution,
  type EventModeSpec,
} from "./spec.js";

/* -------------------------------------------------------------------------- */
/* The serialisable sim config                                                  */
/* -------------------------------------------------------------------------- */

/**
 * `SimConfig` flattened.
 *
 * Phase 7 deliberately froze `SimConfig` and made every field a number or a
 * boolean precisely so no reader could branch on the mutator id. Splitting the
 * id out here is not a contradiction: `id` and `label` are IDENTITY, the
 * remaining thirteen fields are the CONFIG, and the split lets a plan carry the
 * behaviour without the branding. What is NOT carried is any function — Phase 7
 * put none there.
 */
export interface EventSimConfig {
  readonly id: MutatorId;
  readonly label: string;
  readonly unlimitedBoost: boolean;
  readonly ballRadiusScale: number;
  readonly ballVelocityScale: number;
  readonly ballMassScale: number;
  readonly driveScale: number;
  readonly steerScale: number;
  readonly gravityBias: number;
  readonly boostDrainScale: number;
  readonly jumpScale: number;
  readonly contactImpulse: number;
}

/** Flatten a frozen `SimConfig` into the plan-safe shape. Order is fixed. */
export function flattenSimConfig(config: SimConfig): EventSimConfig {
  return {
    id: config.id,
    label: config.label,
    unlimitedBoost: config.unlimitedBoost,
    ballRadiusScale: config.ballRadiusScale,
    ballVelocityScale: config.ballVelocityScale,
    ballMassScale: config.ballMassScale,
    driveScale: config.driveScale,
    steerScale: config.steerScale,
    gravityBias: config.gravityBias,
    boostDrainScale: config.boostDrainScale,
    jumpScale: config.jumpScale,
    contactImpulse: config.contactImpulse,
  };
}

/* -------------------------------------------------------------------------- */
/* Quality                                                                      */
/* -------------------------------------------------------------------------- */

export interface EventQualityResolution {
  /** Humans, i.e. viewports. Bots get no viewport. */
  readonly viewportCount: number;
  /** What the seam's viewport table asked for, before any cap. */
  readonly fromViewportCount: QualityPreset;
  /** What the device's renderer class allows. */
  readonly tierCeiling: QualityPreset;
  /** EVENT MODE's own ceiling. */
  readonly eventCeiling: QualityPreset;
  /** The preset the match starts on. */
  readonly preset: QualityPreset;
  /** True when a cap actually lowered the viewport-count answer. */
  readonly capped: boolean;
  /** True when EVENT MODE's ceiling is what bound the result. */
  readonly eventCeilingBound: boolean;
  /** Logged, never silently applied. */
  readonly reason: string;
}

/**
 * The starting quality preset.
 *
 * Composed from three independent ceilings, strongest-last, each of which can
 * only ever pull the preset DOWN:
 *
 *   1. `presetForViewportCount` — the seam's table, which is the "do not
 *      downgrade before profiling" starting point.
 *   2. `resolveStartingPreset`'s capability tier — measured hardware.
 *   3. EVENT MODE's own `HIGH` ceiling — this file's declared event policy.
 *
 * `poorestOf` is used for step 3 rather than a comparison so the rule "a cap
 * can only lower" is Phase 10's code, not a re-implementation of its ordering.
 */
export function resolveEventQuality(
  humanPlayers: number,
  spec: EventModeSpec = EVENT_MODE_SPEC,
  capability: DeviceCapability = {},
): EventQualityResolution {
  const viewportCount = Math.max(1, Math.floor(Number.isFinite(humanPlayers) ? humanPlayers : 1));
  const fromViewportCount = presetForViewportCount(viewportCount);
  const resolved = resolveStartingPreset(viewportCount, capability);
  const withCapability = resolved.preset;
  const preset = poorestOf(withCapability, spec.quality.ceiling);
  const eventCeilingBound = preset === spec.quality.ceiling && withCapability !== spec.quality.ceiling;
  return {
    viewportCount,
    fromViewportCount,
    tierCeiling: resolved.tierCeiling,
    eventCeiling: spec.quality.ceiling,
    preset,
    capped: resolved.capped || eventCeilingBound,
    eventCeilingBound,
    reason: [
      `${viewportCount} viewport(s) -> ${fromViewportCount}`,
      resolved.reason,
      eventCeilingBound ? `EVENT MODE caps at ${spec.quality.ceiling}` : `event ceiling ${spec.quality.ceiling} not binding`,
    ].join("; "),
  };
}

/* -------------------------------------------------------------------------- */
/* The plan                                                                     */
/* -------------------------------------------------------------------------- */

export interface EventBotPlan {
  /** Lobby skill level, from the spec. */
  readonly skill: string;
  /** Phase 8's roster policy answer. */
  readonly fillPolicy: BotFillPlan["policy"];
  /** Cars per team after scaling to the players present. */
  readonly teamSize: number;
  /** Humans per team. */
  readonly humans: readonly [number, number];
  /** Bots per team. */
  readonly bots: readonly [number, number];
  readonly totalBots: number;
  readonly totalCars: number;
  /** Humans who did not fit; they wait for the next match. */
  readonly overflow: number;
  /** Which brain drives the bot seats, and why it is that one. */
  readonly resolution: EventBotResolution;
  /** Phase 8's own one-liner, verbatim. */
  readonly summary: string;
}

/**
 * The fully-resolved EVENT MODE configuration for one room at one moment.
 *
 * Every field is JSON-safe. There is no `Map`, no `Set`, no function and no
 * class instance anywhere in this shape, which is what makes `eventPlanSignature`
 * meaningful.
 */
export interface EventModePlan {
  readonly specId: EventModeSpec["id"];
  readonly specTitle: string;
  readonly summary: string;

  /** The lobby settings, including `eventMode: true`. */
  readonly lobbySettings: LobbySettings;
  /**
   * The single dispatch that puts the room into this state.
   *
   * ONE action, because EVENT MODE is a one-click preset and not a pile of
   * toggles. It is `settings/eventMode`, the lobby reducer's own action — this
   * module does not re-implement the preset, it names the action that applies
   * it. Note what is NOT here: no `match/start`. Starting is `runEventMatch`'s
   * job, and conflating the two is how a host ends up with a match that launches
   * before the room is configured.
   */
  readonly lobbyActions: readonly LobbyAction[];

  /** Match length, both as the lobby's minutes and as resolved milliseconds. */
  readonly matchLength: MatchLengthMinutes;
  readonly matchLengthMs: number | null;

  /** The mutator id and its resolved, flattened config. */
  readonly mutator: MutatorId;
  readonly simConfig: EventSimConfig;
  /** The tuning union EVENT MODE installed, verbatim. */
  readonly tuning: LobbySettings["tuning"];

  readonly bots: EventBotPlan;
  readonly quality: EventQualityResolution;
  readonly pacing: EventPacing;
  readonly cycle: EventCycle;
}

export interface ApplyEventModeInput {
  /**
   * Humans in the room. Drives BOTH the team size and the viewport count, which
   * is why it is the one number the caller must supply. Defaults to 4 — the
   * documented EVENT MODE plan — so `applyEventMode()` with no arguments is
   * literally the brief.
   */
  readonly players?: number;
  /** Renderer capability, for the quality tier ceiling. */
  readonly capability?: DeviceCapability;
  /** Override the spec. Present for tests and for a future venue preset. */
  readonly spec?: EventModeSpec;
}

/** The documented event: four people walk up. */
export const EVENT_MODE_DOCUMENTED_PLAYERS = 4;

const normalisePlayers = (players: number | undefined): number => {
  if (players === undefined) return EVENT_MODE_DOCUMENTED_PLAYERS;
  if (!Number.isFinite(players)) return 0;
  return Math.max(0, Math.floor(players));
};

/**
 * Apply EVENT MODE to a room and return the fully-resolved configuration.
 *
 * PURE and IDEMPOTENT: same input → byte-identical plan. No clock, no randomness,
 * no registry, no donor. `eventPlanSignature` is the way to check that.
 */
export function applyEventMode(input: ApplyEventModeInput = {}): EventModePlan {
  const spec = input.spec ?? EVENT_MODE_SPEC;
  const players = normalisePlayers(input.players);
  const capability = input.capability ?? {};

  const lobbySettings = lobbySettingsForEventMode(spec);

  // The pacing comes from the lobby's own tuning union rather than from
  // `spec.pacing` directly, so the plan cannot disagree with the settings the
  // reducer is about to write. `spec.pacing` and `pacingForTuning(tuning)` are
  // the same object for the shipped spec, and a test asserts it.
  const pacing = pacingForTuning(lobbySettings.tuning, lobbySettings.instantRematch);

  const teamSize = resolveEventTeamSize(players, spec);
  const fill = planBotFill({
    humanCount: players,
    teamSize,
    policy: lobbySettings.botFill === "fill" ? "fill-teams" : "off",
  });

  const cycle = deriveEventCycle(pacing, lobbySettings.matchLength, spec.pacingAssumptions);

  return Object.freeze({
    specId: spec.id,
    specTitle: spec.title,
    summary: spec.summary,
    lobbySettings,
    lobbyActions: Object.freeze([{ type: "settings/eventMode", enabled: true }] as LobbyAction[]),
    matchLength: lobbySettings.matchLength,
    matchLengthMs: matchDurationMs(lobbySettings.matchLength),
    mutator: spec.mutator,
    simConfig: flattenSimConfig(eventMutatorConfig(spec)),
    tuning: lobbySettings.tuning,
    bots: Object.freeze({
      skill: spec.bots.skill,
      fillPolicy: fill.policy,
      teamSize: fill.teamSize,
      humans: Object.freeze([...fill.humans] as [number, number]),
      bots: Object.freeze([...fill.bots] as [number, number]),
      totalBots: fill.totalBots,
      totalCars: fill.totalCars,
      overflow: fill.overflow,
      resolution: resolveEventBotMode(fill.totalCars, spec),
      summary: fill.summary,
    }),
    quality: resolveEventQuality(players, spec, capability),
    pacing,
    cycle,
  });
}

/* -------------------------------------------------------------------------- */
/* The signature                                                                */
/* -------------------------------------------------------------------------- */

/**
 * A stable JSON fingerprint of a plan.
 *
 * `JSON.stringify` is the right tool here BECAUSE the plan is plain: its key
 * order is fixed by the object literals above, so the same input always
 * produces the same string. That string is what the idempotency test compares,
 * which is a stronger check than `toEqual` (it also catches a key inserted in a
 * different position) and stronger than nothing, which is what most "this should
 * be deterministic" claims actually amount to.
 */
export function eventPlanSignature(plan: unknown): string {
  return JSON.stringify(plan);
}

/** True when `id` is a mutator this port actually ships. Never throws. */
export const isKnownMutator = (id: unknown): id is MutatorId =>
  typeof id === "string" && Object.prototype.hasOwnProperty.call(MUTATOR_REGISTRY, id);
