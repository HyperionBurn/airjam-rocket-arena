/**
 * The inference seam this layer programs against.
 *
 * ---------------------------------------------------------------------------
 * THE AI IS THE DONOR'S; THIS FILE IS THE HOLE IT FITS THROUGH
 * ---------------------------------------------------------------------------
 * The port does not reimplement inference. `src/donor/bots/**` already contains
 * the observation builders, the action table, the kickoff routine and the
 * ONNXRuntime worker plumbing, and `bots/actions.js:26-37` (`ed`) emits exactly
 * the donor's canonical 8-field control object — the same shape as `CarControls`
 * in `seam.ts:87-100`. Rewriting any of that would be strictly worse.
 *
 * So this file declares only the narrow contract the donor's `BotController`
 * already satisfies, and `donor-inference.ts` adapts that class to it. Nothing
 * here imports the donor, so nothing here can pull a Worker, WASM or a 9.9 MB
 * model into a unit test: the decision logic stays pure and Three/WASM/DOM-free,
 * exactly as the other layers are.
 *
 * The interface mirrors the donor's own vocabulary, deliberately:
 * `decide(state, pads, playerSlot, botTeam)` and the optional
 * `getKickoffControls(state, kickoffTick)` are the two calls
 * `app/startup.js:730` and `:749` make, so the adapter is a rename rather than a
 * translation.
 */

import type { CarControls } from "../seam.js";
import type { BotDifficultyId } from "./bot-difficulty.js";
import type { BotTeam } from "./bot-fill-plan.js";

/**
 * One boost pad, in the donor's `simulation.getPads()` shape. The observation
 * builders read `.pos` and `.isBig` and nothing else (`observations.js:32-37`).
 */
export interface BoostPadView {
  readonly pos: readonly [number, number, number];
  readonly isBig: boolean;
}

/**
 * Everything a policy is allowed to look at for one decision.
 *
 * `state` is the donor's 510-float block, read through `readCar`/`carOffset` in
 * `seam.ts` rather than re-parsed, so the observation agrees with the physics
 * byte for byte.
 */
export interface BotObservation {
  /** The sim's live state block. Never copied — read it synchronously. */
  readonly state: Float32Array;
  /** The arena's boost pads. The models require exactly 34. */
  readonly pads: readonly BoostPadView[];
  /** The bot's own car slot. Must be 0 or 1 for any neural policy. */
  readonly slot: number;
  /** The bot's team. Doubles as the donor's mirror flag. */
  readonly team: BotTeam;
  /** The action currently being held — the last term of an RL observation. */
  readonly current: CarControls;
  /** Ticks since kickoff, or -1 outside a kickoff. */
  readonly kickoffTick: number;
}

/**
 * One bot's brain. One instance per bot seat, never shared — the donor's
 * controller holds a single `action` field (`bots/controller.js:21`) and feeds
 * it into every observation, so two seats sharing one instance would interleave
 * their worlds.
 */
export interface BotInference {
  readonly id: BotDifficultyId;
  /** False until the model is loaded and the first tensor is available. */
  readonly isReady: boolean;
  /** True when this needs onnxruntime-web and its WASM. */
  readonly requiresNeuralRuntime: boolean;
  /** Load weights. Called on match start; awaited by the manager, never by a tick. */
  load(): Promise<void>;
  /**
   * One decision. MAY BE SLOW OR REJECT — the caller must treat a rejection as
   * recoverable and never as a reason to stop the match.
   */
  decide(observation: BotObservation): Promise<CarControls>;
  /**
   * A deterministic opening routine, or null when the policy has none. The
   * donor only gives Nexto one (`catalog.js:37`).
   */
  getKickoffControls?(observation: BotObservation): CarControls | null;
  /** Drop recurrent state. Called on match start and on seat release. */
  reset(): void;
  /** Release workers, sessions and buffers. Must be idempotent. */
  dispose(): void;
}

/** Built by the host, or by the tests. This layer never constructs a brain. */
export type BotInferenceFactory = (id: BotDifficultyId) => BotInference;

/**
 * How long a single decision may take before the seat is treated as STALLED.
 *
 * The donor gives up after 15 s and pauses the entire match
 * (`bots/controller.js:124`), which is unacceptable at an event. A decision is
 * due every `tickSkip` = 8 sim ticks = 66 ms at 120 Hz, so anything past a
 * couple of seconds is not a slow frame — it is a wedged worker. Degrading that
 * seat to `NEUTRAL_CONTROLS` for a few frames is invisible; freezing the match
 * is not.
 */
export const DEFAULT_DECISION_BUDGET_MS = 2_000;

/** Floor for an injected budget, so a misconfigured `0` cannot mean "instant". */
export const MIN_DECISION_BUDGET_MS = 50;

/**
 * Normalise a host-supplied budget. A non-finite or non-positive value falls
 * back to the default rather than disabling the watchdog entirely.
 */
export const resolveDecisionBudgetMs = (requested: number | undefined): number => {
  if (typeof requested !== "number" || !Number.isFinite(requested)) return DEFAULT_DECISION_BUDGET_MS;
  return Math.max(MIN_DECISION_BUDGET_MS, Math.floor(requested));
};

/** Why a seat stopped behaving. All of them are recoverable. */
export type BotStallReason = "budget-exceeded" | "inference-error" | "never-loaded";

export interface BotStallInfo {
  readonly slot: number;
  readonly team: BotTeam;
  readonly botId: BotDifficultyId;
  readonly reason: BotStallReason;
  /** Wall time the abandoned decision had been in flight, when known. */
  readonly waitedMs: number;
  /** Decisions served before this one. */
  readonly decisions: number;
}
