/**
 * Bot difficulty registry.
 *
 * ---------------------------------------------------------------------------
 * READ THIS BEFORE PICKING A DEFAULT
 * ---------------------------------------------------------------------------
 * The three donors are NOT under one licence. Verified from the shipped assets
 * and the donor's own attribution in `src/donor/bots/catalog.js:2-39`:
 *
 *   | id     | licence         | commercial use | model            |
 *   |--------|-----------------|----------------|------------------|
 *   | seer   | MIT             | PERMITTED      | 7.4 MB (sized)   |
 *   | necto  | CC BY-NC-SA 4.0 | FORBIDDEN      | 0.7 MB           |
 *   | nexto  | CC BY-NC-SA 4.0 | FORBIDDEN      | 1.8 MB           |
 *
 * Evidence in-tree: `public/assets/bot/seer/LICENSE.txt` is the MIT text
 * (Copyright (c) 2019 RLBot), `public/assets/bot/seer/NOTICE.txt` pins the
 * RLBotPack revision, and `public/assets/bot/{LICENSE,NOTICE}.txt` plus
 * `public/assets/bot/necto/*` carry "Creative Commons
 * Attribution-NonCommercial-ShareAlike 4.0" and state outright: "This license
 * does not grant unrestricted commercial use."
 *
 * So a non-commercial-free bot DOES exist (Seer v0, MIT) and it is the default
 * here. There is no commercial-use path for Nexto or Necto and none is invented
 * — the only honest options are to obtain separate permission from the rights
 * holders, or to not ship them. `commercialUse` is a first-class field on every
 * entry so a build can filter on it without reading this comment.
 *
 * ---------------------------------------------------------------------------
 * ARENA SUPPORT IS A HARD CONSTRAINT, NOT A QUALITY CLAIM
 * ---------------------------------------------------------------------------
 * All three observation builders open with the same guard:
 *   `if (state[NUM_CARS] !== 2 || pads.length !== 34 || (team !== 0 && team !== 1)) throw`
 * — `bots/observations.js:5-8` (Nexto), `bots/necto.js:28-29`,
 * `bots/seer.js:82-83`. The models are 1v1-only, full stop. In a 2v2 or 3v3 a
 * `decide()` call THROWS, and the donor's own answer to that throw is to freeze
 * the whole match (`app/startup.js:734-744`).
 *
 * `arenaSupport: "1v1"` therefore records a hard capability, and the seat
 * manager refuses to load a neural model into a larger arena rather than
 * discovering it mid-match. That is why the scripted policy is a product
 * feature and not just a test affordance.
 */

import type { BotTeam } from "./bot-fill-plan.js";

export type BotDifficultyId = "seer" | "necto" | "nexto" | "disabled";

/** The switch that turns every bot off without touching any other module. */
export const BOTS_DISABLED_ID = "disabled" as const;

export const BOT_DIFFICULTY_IDS = ["seer", "necto", "nexto", BOTS_DISABLED_ID] as const;

export type BotLicenseId = "MIT" | "CC-BY-NC-SA-4.0" | "none";

/**
 * The only arena shape a neural model can be driven in. `"none"` means the entry
 * runs no model at all.
 */
export type BotArenaSupport = "1v1" | "none";

export interface BotDifficulty {
  readonly id: BotDifficultyId;
  readonly label: string;
  /** The donor's own in-game label. Approximate for a port, not a certified rank. */
  readonly rank: string | null;
  readonly license: BotLicenseId;
  /** The only field a commercial build needs to filter on. */
  readonly commercialUse: "permitted" | "forbidden" | "not-applicable";
  /** Verbatim attribution the donor requires. */
  readonly credit: string;
  readonly noticeUrl: string | null;
  readonly modelUrl: string | null;
  /** Shipped model size in bytes, so a budget screen needs no filesystem read. */
  readonly modelBytes: number;
  /** Donor's decision cadence: one decide every N sim ticks (`catalog.js`). */
  readonly tickSkip: number;
  readonly arenaSupport: BotArenaSupport;
  /** False only for the `disabled` entry. */
  readonly enabled: boolean;
  /** True when the entry needs onnxruntime-web and its WASM. */
  readonly requiresNeuralRuntime: boolean;
  /** The donor gives Nexto a scripted kickoff routine (`catalog.js:37`). */
  readonly scriptedKickoff: boolean;
}

/**
 * Frozen, with every field verified against the shipped assets rather than
 * copied from memory. Sizes come from `public/assets/bot/**`; credits and tick
 * rates come from the donor's own `catalog.js`.
 */
export const BOT_DIFFICULTIES: Readonly<Record<BotDifficultyId, BotDifficulty>> = Object.freeze({
  seer: Object.freeze({
    id: "seer",
    label: "Seer v0",
    rank: "Platinum",
    license: "MIT",
    commercialUse: "permitted",
    credit: "Seer v0 by Neville Walo · MIT",
    noticeUrl: "/assets/bot/seer/NOTICE.txt",
    modelUrl: "/assets/bot/seer/policy.onnx",
    modelBytes: 7_413_893,
    tickSkip: 8,
    arenaSupport: "1v1",
    enabled: true,
    requiresNeuralRuntime: true,
    scriptedKickoff: false,
  }),
  necto: Object.freeze({
    id: "necto",
    label: "Necto",
    rank: "Diamond",
    license: "CC-BY-NC-SA-4.0",
    commercialUse: "forbidden",
    credit: "Necto by the Necto team · CC BY-NC-SA 4.0",
    noticeUrl: "/assets/bot/necto/NOTICE.txt",
    modelUrl: "/assets/bot/necto/policy.onnx",
    modelBytes: 707_364,
    tickSkip: 8,
    arenaSupport: "1v1",
    enabled: true,
    requiresNeuralRuntime: true,
    scriptedKickoff: false,
  }),
  nexto: Object.freeze({
    id: "nexto",
    label: "Nexto",
    rank: "GC",
    license: "CC-BY-NC-SA-4.0",
    commercialUse: "forbidden",
    credit: "Nexto by the Necto team · CC BY-NC-SA 4.0",
    noticeUrl: "/assets/bot/NOTICE.txt",
    modelUrl: "/assets/bot/policy.onnx",
    modelBytes: 1_802_204,
    tickSkip: 8,
    arenaSupport: "1v1",
    enabled: true,
    requiresNeuralRuntime: true,
    scriptedKickoff: true,
  }),
  disabled: Object.freeze({
    id: BOTS_DISABLED_ID,
    label: "Bots off",
    rank: null,
    license: "none",
    commercialUse: "not-applicable",
    credit: "No bot model is loaded.",
    noticeUrl: null,
    modelUrl: null,
    modelBytes: 0,
    tickSkip: 8,
    arenaSupport: "none",
    enabled: false,
    requiresNeuralRuntime: false,
    scriptedKickoff: false,
  }),
});

/**
 * MIT is the default on purpose: it is the only choice that cannot put the
 * product in breach of the models' licence, so a fresh install is safe without
 * an operator having to know the difference.
 */
export const DEFAULT_BOT_DIFFICULTY_ID: BotDifficultyId = "seer";

/**
 * One line to show wherever a bot is on screen. The donor requires both the
 * attribution and the licence, so neither is optional and neither is buried in
 * a source comment.
 */
export const BOT_LICENSING_NOTICE =
  "Bot models: Seer v0 by Neville Walo (MIT). " +
  "Nexto & Necto by the Necto team (CC BY-NC-SA 4.0) — non-commercial only, " +
  "and used here only when selected.";

export const botDifficultyIds = (): readonly BotDifficultyId[] => BOT_DIFFICULTY_IDS;

/** Never throws: an unknown id degrades to the off switch, not to a crash. */
export const getBotDifficulty = (id: BotDifficultyId | string | null | undefined): BotDifficulty => {
  if (typeof id !== "string") return BOT_DIFFICULTIES[BOTS_DISABLED_ID];
  const found = BOT_DIFFICULTIES[id as BotDifficultyId];
  return found ?? BOT_DIFFICULTIES[BOTS_DISABLED_ID];
};

/** The menu the host renders: every entry, in increasing difficulty. */
export const listBotDifficulties = (): readonly BotDifficulty[] =>
  BOT_DIFFICULTY_IDS.map((id) => BOT_DIFFICULTIES[id]);

/** Ids a commercial build may ship. Seer v0 is the whole list. */
export const COMMERCIAL_SAFE_BOT_IDS: readonly BotDifficultyId[] = Object.freeze(
  BOT_DIFFICULTY_IDS.filter((id) => BOT_DIFFICULTIES[id].commercialUse === "permitted"),
);

/** Ids that require permission from the rights holders before any commercial use. */
export const NON_COMMERCIAL_BOT_IDS: readonly BotDifficultyId[] = Object.freeze(
  BOT_DIFFICULTY_IDS.filter((id) => BOT_DIFFICULTIES[id].commercialUse === "forbidden"),
);

/** Bytes of non-commercial model weight, for a budget readout. */
export const nonCommercialModelBytes = (): number =>
  NON_COMMERCIAL_BOT_IDS.reduce((sum, id) => sum + BOT_DIFFICULTIES[id].modelBytes, 0);

export const isCommercialSafe = (id: BotDifficultyId | string | null | undefined): boolean =>
  getBotDifficulty(id).commercialUse === "permitted";

/**
 * Can this entry be driven at all in an arena of `totalCars` cars?
 *
 * The `1v1` check is the load-bearing one: it mirrors the models' own
 * `NUM_CARS !== 2` guard, so a caller can never start inference that is
 * guaranteed to throw and hand a mid-match freeze to the donor.
 */
export const canDriveArena = (id: BotDifficultyId | string | null | undefined, totalCars: number): boolean => {
  const entry = getBotDifficulty(id);
  if (!entry.enabled) return false;
  if (entry.arenaSupport === "none") return false;
  return entry.arenaSupport === "1v1" ? totalCars === 2 : true;
};

/** Human-readable reason `canDriveArena` said no, for a producer-facing notice. */
export const describeArenaRefusal = (
  id: BotDifficultyId | string | null | undefined,
  totalCars: number,
): string | null => {
  const entry = getBotDifficulty(id);
  if (!entry.enabled) return "Bots are turned off.";
  if (entry.arenaSupport === "none") return "This entry runs no model.";
  if (totalCars !== 2) {
    return (
      `${entry.label} is a 1v1 policy and this match has ${totalCars} cars. ` +
      `Its observation builder rejects anything but two cars.`
    );
  }
  return null;
};

/**
 * The one slot the models reason about, derived from the bot's own seat.
 *
 * Every builder indexes the world as `[slot, 1 - slot]` (`necto.js:36`,
 * `observations.js:10`), so the bot's slot must be 0 or 1. A bot parked in slot
 * 4 of a 3v3 is outside what the models can even name — another reason the
 * neural path is 1v1-only.
 */
export const botModelSlot = (team: BotTeam): BotTeam => team === 0 ? 0 : 1;
