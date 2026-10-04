/**
 * ============================================================================
 * PHASE 8 — BOTS. READ THE LICENCE BEFORE ANYTHING ELSE.
 * ============================================================================
 *
 * The bot models are NOT all under one licence, and the port as a whole is MIT.
 * Verified from the shipped assets and the donor's own attribution in
 * `src/donor/bots/catalog.js:2-39`:
 *
 *   Seer v0  — MIT (RLBot). `public/assets/bot/seer/LICENSE.txt` is the MIT
 *              text, Copyright (c) 2019 RLBot. COMMERCIAL USE PERMITTED.
 *   Necto    — CC BY-NC-SA 4.0. NON-COMMERCIAL ONLY.
 *   Nexto    — CC BY-NC-SA 4.0. NON-COMMERCIAL ONLY.
 *
 * `public/assets/bot/NOTICE.txt` says it in as many words: "This license does
 * not grant unrestricted commercial use. Obtain separate permission from the
 * rights holders before using these materials commercially." That file is the
 * donor's, shipped unmodified, and nothing here overrides it.
 *
 * A non-commercial-free bot therefore DOES exist — Seer v0, MIT — and it is
 * `DEFAULT_BOT_DIFFICULTY_ID`, so a default install cannot breach anything.
 * There is NO commercial-use path for Necto or Nexto and none is invented here.
 * The only two honest options for those two are: obtain separate permission
 * from the rights holders (Rolv-Arild / the Necto team), or do not ship them.
 * `commercialUse` is a field on every registry entry so a build or a settings
 * screen can filter on it without a human reading this comment.
 *
 * Turning bots off is a supported, complete operation: the `disabled` entry
 * builds no brain, downloads no weights and spawns no worker, and the fill
 * policy `off` plans zero bots. Neither touches a file outside this directory.
 *
 * ============================================================================
 *
 * Bots fill the empty seats so an event always has a playable match. This
 * module is the whole public surface: a PURE seat planner, a licence-aware
 * difficulty registry, a thin adapter over the donor's own inference, and a
 * seat manager that owns lifecycle and contains every bot failure.
 *
 * ---------------------------------------------------------------------------
 * CALL ORDER THE HOST SHOULD USE
 * ---------------------------------------------------------------------------
 * Once, before the match:
 *
 *   1. `createBotSeatManager({ registry, createInference, difficulty, teamSize })`
 *      — `createInference` is `createDonorBotInferenceFactory()` in a browser,
 *        or any fake in a test.
 *   2. `const report = await manager.startMatch(humanCount)`
 *      — reserves the bot seats, builds a brain per seat, loads the weights.
 *        Resolves with a report; it does not reject. If `report.blocked` is
 *        true, do not start: either fix the roster or change the setting.
 *
 * Every frame, alongside `pushControls(registry, sim)` for the humans:
 *
 *   3. `manager.tick({ state: sim.state, pads, sim })`
 *      — pumps every bot seat and writes its controls. Synchronous, total,
 *        never throws, and never able to pause the match.
 *
 * On match end, seat release and teardown:
 *
 *   4. `manager.stopMatch("released")`   // neutralizes bot seats, frees brains
 *   5. `registry.neutralizeAll("released")`  // the registry's job, not ours
 *
 * `pushControls` alone is NOT enough: `addBotSeat` deliberately leaves a bot
 * seat's `source` null, so the slots layer skips it. Step 3 is what drives it.
 *
 * ---------------------------------------------------------------------------
 * THE SAFETY PROPERTY, IN ONE PARAGRAPH
 * ---------------------------------------------------------------------------
 * The donor pauses the entire match when bot inference stalls
 * (`app/startup.js:734-744` sets `state.paused = true` on one rejected
 * `decide()`). This layer makes that impossible by construction: `read()` and
 * `tick()` are synchronous and total, a decision that overruns its budget
 * degrades that seat to exactly `NEUTRAL_CONTROLS` while the sim keeps
 * stepping, and the only callbacks are observability hooks that cannot request
 * a pause because there is no pause in this layer to request.
 */

export {
  BOT_FILL_MATRIX,
  BOT_FILL_POLICIES,
  DEFAULT_BOT_FILL_POLICY,
  MAX_BOT_TEAM_SIZE,
  botSeatsForTeamSize,
  planBotFill,
} from "./bot-fill-plan.js";
export type {
  BotFillPlan,
  BotFillPolicy,
  BotFillRefusal,
  BotFillRequest,
  BotTeam,
} from "./bot-fill-plan.js";

export {
  BOTS_DISABLED_ID,
  BOT_DIFFICULTIES,
  BOT_DIFFICULTY_IDS,
  BOT_LICENSING_NOTICE,
  COMMERCIAL_SAFE_BOT_IDS,
  DEFAULT_BOT_DIFFICULTY_ID,
  NON_COMMERCIAL_BOT_IDS,
  botDifficultyIds,
  botModelSlot,
  canDriveArena,
  describeArenaRefusal,
  getBotDifficulty,
  isCommercialSafe,
  listBotDifficulties,
  nonCommercialModelBytes,
} from "./bot-difficulty.js";
export type {
  BotArenaSupport,
  BotDifficulty,
  BotDifficultyId,
  BotLicenseId,
} from "./bot-difficulty.js";

export {
  DEFAULT_DECISION_BUDGET_MS,
  MIN_DECISION_BUDGET_MS,
  resolveDecisionBudgetMs,
} from "./bot-inference.js";
export type {
  BotInference,
  BotInferenceFactory,
  BotObservation,
  BotStallInfo,
  BotStallReason,
  BoostPadView,
} from "./bot-inference.js";

export { createBotInputSource } from "./bot-source.js";
export type { BotSeatStats, BotSeatStatus, BotSourceOptions, ManagedBotInputSource } from "./bot-source.js";

export {
  DEFAULT_SCRIPTED_POLICY,
  SCRIPTED_STEER_SIGN,
  chaserPolicy,
  createNeutralInference,
  createScriptedInference,
  driveStraightPolicy,
} from "./scripted-bot.js";
export type { ScriptedInferenceOptions, ScriptedPolicy, ScriptedSkill } from "./scripted-bot.js";
export { SCRIPTED_POLICIES, createScriptedPolicy, FIELD_HALF_LENGTH } from "./scripted-bot.js";

export { createBotSeatManager, pushBotControls } from "./bot-seats.js";
export type {
  BotNotice,
  BotNoticeCode,
  BotSeatManager,
  BotSeatManagerOptions,
  BotSeatView,
  BotStartReport,
  BotTickObservation,
  BotTickReport,
  BotInferenceMode,
  OversizedArenaPolicy,
} from "./bot-seats.js";

/**
 * The donor-backed inference factory. Exported from here but importing it pulls
 * in a DYNAMIC `@donor/bots/controller.js` import, so it is safe to reference
 * in a module graph that a Node test also loads — the donor is only fetched
 * when a real match calls `load()`.
 */
export { createDonorBotInferenceFactory } from "./donor-inference.js";
