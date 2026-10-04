/**
 * ============================================================================
 * PHASE 12 — EVENT MODE. THE SPEC. One object, the source of truth.
 * ============================================================================
 *
 * OWNER: the Event Mode worker (`src/airjam/event/**`).
 *
 * ---------------------------------------------------------------------------
 * THE RULE
 * ---------------------------------------------------------------------------
 * Every knob EVENT MODE turns is written down exactly once, here, and is reached
 * through `applyEventMode()` / `runEventMatch()`. Nothing else in this directory
 * hard-codes a duration, a team size, a preset or a mutator. If a value needs
 * changing at an event, it is one edit to `EVENT_MODE_SPEC` and every consumer —
 * the plan, the guard, the dry run, the operator screen — moves together.
 *
 * ---------------------------------------------------------------------------
 * WHAT THE SPEC DOES *NOT* OWN, AND WHY IT MUST NOT
 * ---------------------------------------------------------------------------
 * The lobby settings are NOT restated here. `EVENT_MODE_SETTINGS` already
 * exists in `src/lobby/settings.ts` and is the exact object the lobby reducer
 * writes for `settings/eventMode`; duplicating it would create two sources that
 * could disagree, and the reducer is the thing that actually runs. So the spec
 * REFERENCES it, and `EVENT_MODE_SPEC_LOBBY_CONFORMANCE` re-asserts the
 * documented values as a test-time invariant. The same applies to the mutator
 * (Phase 7 owns `MUTATOR_REGISTRY`; this file names an id and lets
 * `resolveSimConfig` do the lookup) and to the quality ladder (Phase 10 owns the
 * preset table; this file names a ceiling and lets `resolveStartingPreset` and
 * `poorestOf` do the work).
 *
 * ---------------------------------------------------------------------------
 * THE TWO HARD CONSTRAINTS FROM PHASE 8, AND WHAT THEY FORCE
 * ---------------------------------------------------------------------------
 * 1. THE DONOR'S ONNX BOTS ARE 1v1-ONLY. All three observation builders open
 *    with `if (state[NUM_CARS] !== 2) throw` (`bots/observations.js:5-8`,
 *    `bots/necto.js:28-29`, `bots/seer.js:82-83`), and the donor's own answer to
 *    that throw is to freeze the whole match (`app/startup.js:734-744`).
 *    EVENT MODE IS 2v2. THEREFORE EVENT MODE CANNOT USE DONOR AI. It resolves
 *    to Phase 8's `scripted` path — a real bot car driven by a deterministic
 *    local policy — via `oversizedArena: "scripted"`. This is not a workaround;
 *    it is the only correct answer, and `resolveEventBotMode()` reaches it
 *    through `canDriveArena` rather than by hard-coding "scripted".
 *
 * 2. LICENCE. Seer v0 is MIT; Necto and Nexto are CC BY-NC-SA 4.0 and therefore
 *    non-commercial. A live event is a commercial deployment, so EVENT MODE
 *    names only the MIT model. `EVENT_BOT_SKILL_TO_MODEL` maps all three lobby
 *    skill levels onto it rather than offering a choice that cannot be taken,
 *    and `commercialUseOnly: true` makes the constraint machine-checkable
 *    instead of a comment nobody reads.
 */

import {
  BOTS_DISABLED_ID,
  canDriveArena,
  DEFAULT_BOT_DIFFICULTY_ID,
  getBotDifficulty,
} from "@/airjam/bots/bot-difficulty";
import { MAX_BOT_TEAM_SIZE } from "@/airjam/bots/bot-fill-plan";
import type { BotDifficultyId, BotLicenseId, OversizedArenaPolicy } from "@/airjam/bots";
import { resolveSimConfig } from "@/match/sim-config";
import type { MutatorId, SimConfig } from "@/match/sim-config";
import { EVENT_MODE_SETTINGS, MAX_PLAYER_SLOTS } from "@/lobby/settings";
import type { BotDifficulty, LobbySettings, LobbyTeam } from "@/lobby/types";
import type { QualityPreset } from "@/airjam/seam";
import {
  DEFAULT_PACING,
  EVENT_PACING,
  EVENT_PACING_ASSUMPTIONS,
  type EventPacing,
  type PacingAssumptions,
} from "./pacing.js";

/* -------------------------------------------------------------------------- */
/* Spec shape                                                                   */
/* -------------------------------------------------------------------------- */

/** How EVENT MODE picks the bot brain for a given arena size. */
export type EventBotMode = "neural" | "scripted" | "disabled" | "seat-only";

export interface EventBotSpec {
  /** The lobby's SKILL level (rookie/pro/ace). Not a model id. */
  readonly skill: BotDifficulty;
  /** The Phase 8 model that skill resolves to. MIT only — see the header. */
  readonly model: BotDifficultyId;
  /** What to do when the model cannot drive this arena. Phase 8's default. */
  readonly oversizedArena: OversizedArenaPolicy;
  /**
   * Only a model with `commercialUse: "permitted"` may be named. Enforced by
   * `resolveEventBotMode`, which downgrades to the off switch rather than
   * shipping a non-commercial model at a commercial event.
   */
  readonly commercialUseOnly: boolean;
  /** Verbatim, for the plan: which licence the chosen model is under. */
  readonly license: BotLicenseId;
}

export interface EventQualitySpec {
  /** Presets are chosen by HUMAN viewport count — bots do not get a viewport. */
  readonly viewportSource: "human-players";
  /**
   * EVENT MODE'S OWN CEILING, one tier below the richest preset.
   *
   * This is a deliberate event-specific choice, not a phase-10 default, so it
   * is declared here. The reasoning: nobody technical is present to notice a
   * dropped preset, and Phase 10's governor can only ever walk DOWN from the
   * starting preset (its ceiling is that preset). Starting one tier below the
   * richest therefore spends the ladder's headroom as a safety margin instead
   * of as a prize. It can only pull the preset down, never up — `poorestOf`.
   */
  readonly ceiling: QualityPreset;
}

/** How the effective team size is chosen from the number of players present. */
export type EventTeamSizePolicy = "spec-floor-scaled-to-players";

export interface EventModeSpec {
  readonly id: "event-mode";
  readonly title: string;
  readonly summary: string;
  /**
   * The lobby's own EVENT MODE preset, by REFERENCE. `eventMode: true` is added
   * by `lobbySettingsForEventMode()` because `EVENT_MODE_SETTINGS` is typed as
   * `Omit<LobbySettings, "eventMode">` — the flag is the reducer's business.
   */
  readonly lobby: Readonly<Omit<LobbySettings, "eventMode">>;
  /** Stock physics. "normal boost/ball" means the NORMAL config, exactly. */
  readonly mutator: MutatorId;
  readonly bots: EventBotSpec;
  readonly quality: EventQualitySpec;
  readonly pacing: EventPacing;
  readonly pacingAssumptions: PacingAssumptions;
  /**
   * Hard ceiling on one team. Phase 8 owns it (`MAX_BOT_TEAM_SIZE` =
   * `floor(MAX_CARS / 2)`); referenced, never recomputed, so the cap and the
   * native arena width can never drift apart in this file.
   */
  readonly maxTeamSize: number;
  readonly teamSizePolicy: EventTeamSizePolicy;
}

/* -------------------------------------------------------------------------- */
/* THE SPEC                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Lobby skill level → the ONLY model a commercial event may load.
 *
 * All three skills collapse onto Seer v0, and that is the honest answer rather
 * than a placeholder: Necto and Nexto are CC BY-NC-SA 4.0, so there is no
 * commercial-use path to a "better" bot at an event at all. Mapping them here
 * means the non-commercial ids are unreachable from EVENT MODE by construction
 * instead of by a filter somebody has to remember to apply.
 */
export const EVENT_BOT_SKILL_TO_MODEL: Readonly<Record<BotDifficulty, BotDifficultyId>> = Object.freeze({
  rookie: DEFAULT_BOT_DIFFICULTY_ID,
  pro: DEFAULT_BOT_DIFFICULTY_ID,
  ace: DEFAULT_BOT_DIFFICULTY_ID,
});

export const EVENT_MODE_SPEC: EventModeSpec = Object.freeze({
  id: "event-mode",
  title: "EVENT MODE",
  summary:
    "4 players, 2v2, 3-minute games, normal boost and ball, fast kickoff reset, " +
    "short goal celebration, short post-match screen, instant rematch.",
  lobby: EVENT_MODE_SETTINGS,
  mutator: "NORMAL",
  bots: Object.freeze({
    skill: EVENT_MODE_SETTINGS.botDifficulty,
    model: EVENT_BOT_SKILL_TO_MODEL[EVENT_MODE_SETTINGS.botDifficulty],
    oversizedArena: "scripted",
    commercialUseOnly: true,
    license: getBotDifficulty(EVENT_BOT_SKILL_TO_MODEL[EVENT_MODE_SETTINGS.botDifficulty]).license,
  }),
  quality: Object.freeze({
    viewportSource: "human-players",
    ceiling: "HIGH",
  }),
  pacing: EVENT_PACING,
  pacingAssumptions: EVENT_PACING_ASSUMPTIONS,
  maxTeamSize: MAX_BOT_TEAM_SIZE,
  teamSizePolicy: "spec-floor-scaled-to-players",
});

/**
 * The stock profile EVENT MODE replaces. Exposed so a host screen can show the
 * actual before/after diff rather than asserting that event mode is "faster"
 * without saying by how much.
 */
export const EVENT_MODE_REPLACES_PACING: EventPacing = DEFAULT_PACING;

/* -------------------------------------------------------------------------- */
/* Lobby settings                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The full `LobbySettings` for EVENT MODE: the lobby's own preset plus the
 * `eventMode: true` flag. This is the object a plan carries, and it is exactly
 * what `settings/eventMode` writes.
 */
export function lobbySettingsForEventMode(spec: EventModeSpec = EVENT_MODE_SPEC): LobbySettings {
  return Object.freeze({ ...spec.lobby, eventMode: true });
}

/**
 * The re-assertion of the brief's documented values.
 *
 * `EVENT_MODE_SETTINGS` is owned by the lobby worker and this module must not
 * edit it, but a drift between that constant and the documented EVENT MODE
 * contract would be invisible to every other test in the package. So the
 * expectations are restated here as DATA and compared in the test suite. This
 * is a conformance check, not a second source of truth: if the lobby's constant
 * ever changes on purpose, this list is the one place to notice.
 */
export const EVENT_MODE_DOCUMENTED_VALUES = Object.freeze({
  playerSlots: 4,
  teamSize: 2,
  matchLength: 3,
  botFill: "fill",
  botDifficulty: "pro",
  instantRematch: true,
  boost: "normal",
  ball: "normal",
  kickoffReset: "fast",
  goalCelebration: "short",
  postMatchScreen: "short",
});

/* -------------------------------------------------------------------------- */
/* Mutator                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The `SimConfig` EVENT MODE runs on, resolved through Phase 7's own
 * `resolveSimConfig` — which never throws, so a bad id degrades to NORMAL
 * instead of taking down a match in front of a crowd.
 */
export function eventMutatorConfig(spec: EventModeSpec = EVENT_MODE_SPEC): SimConfig {
  return resolveSimConfig(spec.mutator);
}

/* -------------------------------------------------------------------------- */
/* Team size                                                                    */
/* -------------------------------------------------------------------------- */

const clampInt = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.floor(value)));
};

/**
 * The EFFECTIVE team size for `players` people present.
 *
 * The spec's documented 2v2 is the FLOOR, not a fixed value. Four players get
 * exactly 2v2 — the documented plan, unchanged. But at a live event people walk
 * up continuously, and a fixed 2v2 would leave a fifth and sixth phone holding
 * a QR code for the length of a whole match with nothing to do, which is the
 * single worst outcome this mode exists to prevent. So the team size grows to
 * seat whoever is there:
 *
 *     teamSize = clamp( max(specFloor, ceil(players / 2)), 1, MAX_TEAM_SIZE )
 *
 *   1 player → 2v2, 3 bots   (the floor: a 1v1 is a worse event than a 2v2)
 *   2 players → 2v2, 2 bots
 *   3 players → 2v2, 1 bot
 *   4 players → 2v2, 0 bots  ← THE DOCUMENTED EVENT MODE PLAN
 *   5 players → 3v3, 1 bot
 *   6 players → 3v3, 0 bots
 *   7 players → 4v4, 1 bot
 *   8 players → 4v4, 0 bots  ← the native cap, `MAX_CARS`
 *   9+        → 4v4, overflow waits for the next match
 *
 * It is clamped to Phase 8's `MAX_BOT_TEAM_SIZE` (= `floor(MAX_CARS / 2)` = 4)
 * because two teams of five do not fit in an eight-car arena.
 */
export function resolveEventTeamSize(players: number, spec: EventModeSpec = EVENT_MODE_SPEC): number {
  const floorSize = clampInt(spec.lobby.teamSize, 1, spec.maxTeamSize);
  const wanted = Math.ceil(Math.max(0, players) / 2);
  return clampInt(Math.max(floorSize, wanted), 1, spec.maxTeamSize);
}

/** How many human seats EVENT MODE can seat at once. Never above the arena. */
export function eventSeatCeiling(spec: EventModeSpec = EVENT_MODE_SPEC): number {
  return Math.min(MAX_PLAYER_SLOTS, 2 * spec.maxTeamSize);
}

/* -------------------------------------------------------------------------- */
/* Bots                                                                         */
/* -------------------------------------------------------------------------- */

export interface EventBotResolution {
  /** The model that was asked for. */
  readonly requested: BotDifficultyId;
  /** The model that will actually be loaded. */
  readonly model: BotDifficultyId;
  readonly label: string;
  readonly license: BotLicenseId;
  readonly commercialUse: "permitted" | "forbidden" | "not-applicable";
  readonly mode: EventBotMode;
  /** True when the model had to be stood down because of the arena size. */
  readonly downgraded: boolean;
  /** Phase 8's sentence explaining the downgrade, or null when there was none. */
  readonly downgradeReason: string | null;
  readonly tickSkip: number;
  readonly oversizedArena: OversizedArenaPolicy;
}

/**
 * Resolve the bot brain for an arena of `totalCars` cars.
 *
 * THE CHAIN, in order, and every step is Phase 8's own code:
 *
 *   1. Lobby skill → model id, via `EVENT_BOT_SKILL_TO_MODEL`. All three
 *      skills land on the MIT model, so Necto/Nexto are unreachable at an event.
 *   2. If the spec demands commercial use and the model is not permitted, the
 *      bots are turned OFF (`BOTS_DISABLED_ID`) rather than shipped. This is a
 *      hard stop, not a warning.
 *   3. `canDriveArena(model, totalCars)` — the donor models' own
 *      `NUM_CARS === 2` guard. At 2v2 (4 cars) this is false.
 *   4. False → fall back to `oversizedArena` (`"scripted"`), the scripted local
 *      policy. NOT seat-only: a bot car that chases the ball is a far better
 *      event than a parked car, and Phase 8's `scripted` path is a real
 *      inference, not a stub.
 *   5. `totalCars === 2` (1v1) → `neural`, the donor's ONNX policy, which is the
 *      only shape all three models can name.
 *
 * NEVER THROWS. Every unknown input degrades to `"disabled"`/`"seat-only"`.
 */
export function resolveEventBotMode(
  totalCars: number,
  spec: EventModeSpec = EVENT_MODE_SPEC,
): EventBotResolution {
  const requested: BotDifficultyId = spec.bots.model;
  const cars = Number.isFinite(totalCars) ? Math.max(0, Math.floor(totalCars)) : 0;

  const denied = (reason: string): EventBotResolution => {
    const off = getBotDifficulty(BOTS_DISABLED_ID);
    return {
      requested,
      model: BOTS_DISABLED_ID,
      label: off.label,
      license: off.license,
      commercialUse: off.commercialUse,
      mode: spec.bots.oversizedArena === "seat-only" ? "seat-only" : "disabled",
      downgraded: true,
      downgradeReason: reason,
      tickSkip: off.tickSkip,
      oversizedArena: spec.bots.oversizedArena,
    };
  };

  const model = getBotDifficulty(requested);
  if (spec.bots.commercialUseOnly && model.commercialUse !== "permitted") {
    return denied(
      `${model.label} is ${model.license}, which does not permit commercial use. ` +
        `A live event may only load a commercially-permitted model.`,
    );
  }
  if (!model.enabled) {
    return denied("The selected bot entry runs no model.");
  }

  if (canDriveArena(model.id, cars)) {
    return {
      requested,
      model: model.id,
      label: model.label,
      license: model.license,
      commercialUse: model.commercialUse,
      mode: "neural",
      downgraded: false,
      downgradeReason: null,
      tickSkip: model.tickSkip,
      oversizedArena: spec.bots.oversizedArena,
    };
  }

  // The 1v1-only case, and the only case EVENT MODE can actually reach above 1v1.
  if (spec.bots.oversizedArena === "refuse") {
    return denied(
      `${model.label} is a 1v1 policy and this match has ${cars} cars, and the ` +
        `event policy is set to refuse rather than fall back.`,
    );
  }
  if (spec.bots.oversizedArena === "seat-only") {
    return denied(
      `${model.label} is a 1v1 policy and this match has ${cars} cars; the event ` +
        `policy reserves the seats but loads no brain.`,
    );
  }

  return {
    requested,
    model: model.id,
    label: model.label,
    license: model.license,
    commercialUse: model.commercialUse,
    mode: "scripted",
    downgraded: true,
    downgradeReason:
      `${model.label} is a 1v1 policy and this match has ${cars} cars ` +
      `(its observation builder rejects anything but NUM_CARS === 2), so EVENT ` +
      `MODE drives the bot seats with the scripted local policy instead.`,
    tickSkip: model.tickSkip,
    oversizedArena: spec.bots.oversizedArena,
  };
}

/** The team a human is placed on when they express no preference. */
export const EVENT_DEFAULT_TEAM: LobbyTeam = 0;
