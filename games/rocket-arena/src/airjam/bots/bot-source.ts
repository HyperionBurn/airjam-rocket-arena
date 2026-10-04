/**
 * A bot seat, shaped as a `CarInputSource`.
 *
 * ---------------------------------------------------------------------------
 * THE FAILURE MODE THIS FILE EXISTS TO PREVENT
 * ---------------------------------------------------------------------------
 * The donor's bot inference is asynchronous and it is allowed to be slow. When
 * `BotController.decide()` rejects — a wedged worker, a rejected WebAssembly
 * fetch, a decode error — the donor's own handler at
 * `src/donor/app/startup.js:734-744` sets `p = true` and
 * `a.state.paused = true`, shows "The opponent stopped responding." and its
 * frame loop returns early forever after (`startup.js:747`). ONE rejected
 * promise FREEZES THE WHOLE MATCH for every human on their phone.
 *
 * That is a real, observed donor behaviour, not a hypothesis. This module is
 * built so the same event cannot happen, by three separate guarantees:
 *
 *  1. `read()` and `pump()` are SYNCHRONOUS and total. Neither returns a
 *     promise, neither awaits, and neither can throw — every call into the
 *     injected brain is wrapped. There is no code path on which a bot can make
 *     the host's frame loop wait.
 *  2. A decision that has not landed within `budgetMs` is treated as STALLED.
 *     The seat drops to exactly `NEUTRAL_CONTROLS` (`seam.ts:107-116`, the
 *     canonical "this player is gone" answer) and keeps stepping. The sim does
 *     not pause, the match does not pause, the human players do not notice.
 *  3. A stall is OBSERVABILITY, NOT CONTROL. The only callbacks here are
 *     `onStall` / `onError`, and their contract is that they report; they
 *     cannot ask for a pause, because there is no pause in this file to ask
 *     for. Self-healing is internal: a generation counter orphans the late
 *     result and the next tick issues a fresh decision.
 *
 * The seat recovers on its own. `status` returns to `"driving"` the moment a
 * decision lands, and the arena is never held up waiting for it.
 *
 * ---------------------------------------------------------------------------
 * WHY A STALL NEUTRALISES INSTEAD OF HOLDING
 * ---------------------------------------------------------------------------
 * Holding the last action is the donor's choice for a healthy in-flight
 * request, and this module keeps it — there the action is still current. Once
 * the budget is blown the worker is not merely slow, it is wedged, and the last
 * action was computed from a world that has since moved on. Neutral is
 * reversible in one frame; a stale steering input is not. So: healthy in-flight
 * holds, stalled releases, and both keep the sim stepping.
 */

import { NEUTRAL_CONTROLS, sanitizeControls } from "../seam.js";
import type { CarControls, CarInputSource, NeutralizeReason } from "../seam.js";
import type { BotDifficultyId } from "./bot-difficulty.js";
import type { BotTeam } from "./bot-fill-plan.js";
import {
  DEFAULT_DECISION_BUDGET_MS,
  resolveDecisionBudgetMs,
} from "./bot-inference.js";
import type { BotInference, BotObservation, BotStallInfo } from "./bot-inference.js";

export type BotSeatStatus =
  /** Created, `start()` not called yet. */
  | "idle"
  /** Started, waiting for weights. Not an error — the match runs regardless. */
  | "waiting"
  /** Has a current action and is driving the car. */
  | "driving"
  /** A decision blew the budget; neutral until a fresh one lands. */
  | "stalled"
  /** A decision rejected; the seat keeps its last action and retries. */
  | "errored"
  /** Torn down. `read()` is `NEUTRAL_CONTROLS` and always will be. */
  | "neutralized";

export interface BotSeatStats {
  /** Decisions that landed and were accepted. */
  readonly decisions: number;
  /** Requests abandoned for exceeding the budget. */
  readonly stalls: number;
  /** Requests that rejected. */
  readonly errors: number;
  /** Decisions requested and abandoned before landing. */
  readonly abandoned: number;
  /** Wall time the last stalled request had been waiting. */
  readonly lastStallMs: number;
}

export interface BotSourceOptions {
  /** Air Jam-style id. Bots are namespaced so they can never collide with a player. */
  readonly playerId: string;
  readonly slot: number;
  readonly team: BotTeam;
  /** The brain. Never constructed here — injected. */
  readonly inference: BotInference;
  /** Injectable clock, so tests need no real time. Default `Date.now`. */
  readonly clock?: () => number;
  /** Per-decision budget in ms. Default 2 s. */
  readonly decisionBudgetMs?: number;
  /** Observability ONLY. Must not pause, block or throw. */
  readonly onStall?: (info: BotStallInfo) => void;
  /** Observability ONLY, for an error the seat recovered from. */
  readonly onError?: (info: BotStallInfo) => void;
}

export interface ManagedBotInputSource extends CarInputSource {
  readonly botId: BotDifficultyId;
  readonly status: BotSeatStatus;
  readonly stats: BotSeatStats;
  /** Begin driving. Idempotent. */
  start(): void;
  /**
   * Schedule a decision if one is due. Called once per frame by the seat
   * manager. Synchronous, total, and never throws.
   */
  pump(observation: BotObservation): void;
  /** Abandon any in-flight work and go neutral. Idempotent. */
  stop(reason: NeutralizeReason): void;
}

/**
 * Report without ever letting a report become a control-flow signal. The
 * callbacks are the host's telemetry; a throwing callback must not be able to
 * break the frame.
 */
const notify = (run: (() => void) | undefined): void => {
  if (!run) return;
  try {
    run();
  } catch (error) {
    console.warn(
      `[rocket-arena/bots] a bot observability callback threw: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
};

export const createBotInputSource = (options: BotSourceOptions): ManagedBotInputSource => {
  const { playerId, slot, team, inference } = options;
  const clock = options.clock ?? Date.now;
  const budgetMs = resolveDecisionBudgetMs(options.decisionBudgetMs ?? DEFAULT_DECISION_BUDGET_MS);

  let live = false;
  let status: BotSeatStatus = "idle";
  let lastGood: CarControls | null = null;
  let request: { generation: number; startedAt: number } | null = null;
  /** Bumped on every abandon/teardown so a late result is recognisably stale. */
  let generation = 0;
  let ticksUntilDecision = 0;
  let decisions = 0;
  let stalls = 0;
  let errors = 0;
  let abandoned = 0;
  let lastStallMs = 0;

  const tickSkip = 8;
  const now = (): number => {
    const value = clock();
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
  };

  const hasStalled = (at: number): boolean =>
    request !== null && at - request.startedAt > budgetMs;

  const stallInfo = (reason: BotStallInfo["reason"], waitedMs: number): BotStallInfo => ({
    slot,
    team,
    botId: inference.id,
    reason,
    waitedMs,
    decisions,
  });

  /**
   * Abandon whatever is in flight and drop the held action.
   *
   * The `generation` bump is the whole trick: the promise is still out there and
   * will still resolve, but its result can no longer match `generation` and is
   * discarded. Nothing waits on it, nothing cancels it, and the next `pump()`
   * immediately issues a fresh decision — so a wedged or slow brain costs this
   * seat a few neutral frames and nothing else.
   */
  const abandon = (reason: BotStallInfo["reason"], waitedMs: number, dropAction: boolean): void => {
    const hadRequest = request !== null;
    request = null;
    generation += 1;
    if (hadRequest) abandoned += 1;
    if (dropAction) lastGood = null;
    if (reason === "budget-exceeded") {
      stalls += 1;
      lastStallMs = waitedMs;
      status = "stalled";
      notify(() => options.onStall?.(stallInfo(reason, waitedMs)));
    } else {
      errors += 1;
      status = "errored";
      notify(() => options.onError?.(stallInfo(reason, waitedMs)));
    }
  };

  const dispatch = (observation: BotObservation): void => {
    const startedAt = now();
    const mine = ++generation;
    request = { generation: mine, startedAt };
    let settled: Promise<CarControls>;
    try {
      // `Promise.resolve` covers an injected brain that returns a bare value;
      // the try covers one that throws synchronously. Neither escapes `pump`.
      settled = Promise.resolve(inference.decide(observation));
    } catch (error) {
      abandon("inference-error", 0, false);
      console.warn(
        `[rocket-arena/bots] slot ${slot}: decide() threw synchronously: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return;
    }
    settled.then(
      (controls) => {
        // A stale or torn-down request is dropped silently: it is no longer
        // anyone's problem, which is the point.
        if (mine !== generation || !live) return;
        request = null;
        lastGood = sanitizeControls(controls ?? null);
        decisions += 1;
        status = "driving";
      },
      (error: unknown) => {
        if (mine !== generation || !live) return;
        // A rejection is NOT fatal and is NOT propagated. The last good action
        // stays in place and the next scheduled tick tries again.
        request = null;
        errors += 1;
        status = "errored";
        console.warn(
          `[rocket-arena/bots] slot ${slot}: decide() rejected: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        notify(() => options.onError?.(stallInfo("inference-error", 0)));
      },
    );
  };

  return {
    playerId,
    slot,
    team,
    botId: inference.id,

    get status(): BotSeatStatus {
      return status;
    },

    get stats(): BotSeatStats {
      return { decisions, stalls, errors, abandoned, lastStallMs };
    },

    start(): void {
      if (live) return;
      live = true;
      // A fresh match must not inherit the previous one's recurrent state.
      try {
        inference.reset();
      } catch (error) {
        console.warn(
          `[rocket-arena/bots] slot ${slot}: reset() threw: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
      ticksUntilDecision = 0;
      request = null;
      lastGood = null;
      generation += 1;
      status = inference.isReady ? "driving" : "waiting";
    },

    /**
     * Fire a decision when one is due. O(1), synchronous, total.
     *
     * A seat that is not ready, already has one in flight, or is not live simply
     * does nothing — and the frame continues.
     */
    pump(observation: BotObservation): void {
      if (!live) return;
      const at = now();

      // The kickoff routine is deterministic and needs no model, so it wins
      // before any readiness check. The donor applies it the same way
      // (`startup.js:749-750`).
      let kickoff: CarControls | null = null;
      try {
        kickoff = inference.getKickoffControls?.(observation) ?? null;
      } catch (error) {
        console.warn(
          `[rocket-arena/bots] slot ${slot}: getKickoffControls() threw: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
      if (kickoff) {
        lastGood = sanitizeControls(kickoff);
        ticksUntilDecision = tickSkip - 1;
        if (status !== "stalled") status = "driving";
        return;
      }

      // Budget check comes before the in-flight check, so a wedged request is
      // retired the first frame it is late rather than the next one.
      if (hasStalled(at)) {
        abandon("budget-exceeded", at - (request?.startedAt ?? at), true);
      }
      if (request !== null) return;
      // The donor's own cadence: it decrements its counter every tick and fires
      // when it reaches zero (`app/startup.js:732,754,766`). Charging
      // `tickSkip - 1` on dispatch is what makes the gap between two decisions
      // exactly `tickSkip` ticks — 8 ticks = 15 Hz at the 120 Hz sim rate.
      if (ticksUntilDecision > 0) {
        ticksUntilDecision -= 1;
        return;
      }
      if (!inference.isReady) {
        // Not an error and not a stall: weights are still loading and the match
        // is running anyway. This is the single most important branch for an
        // event, where the model download can outlast the countdown.
        if (status !== "stalled") status = "waiting";
        return;
      }
      ticksUntilDecision = tickSkip - 1;
      dispatch(observation);
    },

    /**
     * The stable LEVEL view the seam writes. Never a promise, never a partial,
     * and exactly `NEUTRAL_CONTROLS` — by identity — whenever there is nothing
     * safe to drive.
     */
    read(): CarControls {
      if (!live) return NEUTRAL_CONTROLS;
      // Recomputed here rather than only in `pump` so a caller that reads
      // without pumping still cannot get a stale action out of a stalled seat.
      if (hasStalled(now())) return NEUTRAL_CONTROLS;
      return lastGood ?? NEUTRAL_CONTROLS;
    },

    neutralize(reason: NeutralizeReason): void {
      this.stop(reason);
    },

    isLive(): boolean {
      return live;
    },

    stop(reason: NeutralizeReason): void {
      if (!live && status === "neutralized") return; // idempotent
      live = false;
      // Orphan the in-flight request so a late decision cannot resurrect a car.
      request = null;
      generation += 1;
      lastGood = null;
      ticksUntilDecision = 0;
      status = "neutralized";
      void reason; // the reason is the registry's concern; the seat just stops
    },
  };
};
