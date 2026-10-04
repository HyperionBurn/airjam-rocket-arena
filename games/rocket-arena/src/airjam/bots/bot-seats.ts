/**
 * Bot seat manager — seat bookkeeping, difficulty selection and lifecycle.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS OWNS, AND WHAT IT DELIBERATELY DOES NOT
 * ---------------------------------------------------------------------------
 * It owns: how many bot seats exist, which team each is on, which brain drives
 * it, when a brain is loaded and released, and what the seat writes to the sim
 * every frame. It does NOT own: the roster policy (pure, in `bot-fill-plan.ts`),
 * the licence facts (in `bot-difficulty.ts`), the AI (the donor's), the input
 * pipeline (`src/airjam/input`), or the registry. The registry keeps sole
 * authority over which slot a car gets — this module asks for one per planned
 * bot seat via `addBotSeat` and never invents a slot index.
 *
 * ---------------------------------------------------------------------------
 * THE TWO MODES THIS EXISTS TO CHOOSE BETWEEN
 * ---------------------------------------------------------------------------
 * A neural model can only be driven in a two-car arena (see the guard in
 * `bot-difficulty.ts`). So for every match the manager resolves one of:
 *
 *   "neural"    — the donor's ONNX policy is live. Only reachable at 1v1.
 *   "scripted"  — a deterministic local policy drives the seat. This is the
 *                 2v2 / 3v3 path, and it is a real bot car, not a parked one.
 *   "disabled"  — the operator turned bots off. Seats may still be reserved so
 *                 the team sizes stay legal, and they write NEUTRAL.
 *   "seat-only" — no bot seats exist at all (`policy: "off"`).
 *
 * The default for an oversized arena is `"scripted"`, because the product
 * requirement is that a match always starts.
 *
 * ---------------------------------------------------------------------------
 * NOTHING HERE CAN PAUSE THE MATCH
 * ---------------------------------------------------------------------------
 * Every failure path — model load, a rejected decision, a wedged worker, a
 * throwing brain, a throwing sim — is contained and reported through `notices`,
 * `onStall` or `onError`. `startMatch` resolves with a report instead of
 * rejecting, and `tick` is synchronous and total. There is deliberately no
 * "onFatal" hook, because the host wiring one is exactly how the donor's
 * "The opponent stopped responding." freeze gets re-introduced.
 */

import type { NeutralizeReason, PortedSim } from "../seam.js";
import type { ManagedCarSlotRegistry } from "../slots/car-slot-registry.js";
import {
  canDriveArena,
  describeArenaRefusal,
  DEFAULT_BOT_DIFFICULTY_ID,
  getBotDifficulty,
} from "./bot-difficulty.js";
import type { BotDifficulty, BotDifficultyId } from "./bot-difficulty.js";
import {
  DEFAULT_BOT_FILL_POLICY,
  planBotFill,
} from "./bot-fill-plan.js";
import type { BotFillPlan, BotFillPolicy, BotTeam } from "./bot-fill-plan.js";
import { createBotInputSource } from "./bot-source.js";
import type { BotSeatStatus, ManagedBotInputSource } from "./bot-source.js";
import { DEFAULT_DECISION_BUDGET_MS, resolveDecisionBudgetMs } from "./bot-inference.js";
import type { BotInference, BotInferenceFactory, BotObservation, BotStallInfo, BoostPadView } from "./bot-inference.js";
import { createNeutralInference, createScriptedInference } from "./scripted-bot.js";

export type BotInferenceMode = "neural" | "scripted" | "disabled" | "seat-only";

/** What to do when a neural policy is asked to drive a bigger arena than 1v1. */
export type OversizedArenaPolicy = "scripted" | "seat-only" | "refuse";

export type BotNoticeCode =
  | "bots-disabled"
  | "difficulty-unknown"
  | "oversized-arena"
  | "inference-mode"
  | "model-load-failed"
  | "seat-refused"
  | "match-refused";

export interface BotNotice {
  readonly code: BotNoticeCode;
  /** Producer-facing text. Safe to show on a HUD. */
  readonly message: string;
  readonly seat?: number;
}

export interface BotSeatView {
  readonly slot: number;
  readonly team: BotTeam;
  readonly botId: BotDifficultyId;
  readonly status: BotSeatStatus;
  readonly mode: BotInferenceMode;
}

export interface BotStartReport {
  readonly plan: BotFillPlan;
  readonly mode: BotInferenceMode;
  readonly difficulty: BotDifficulty;
  readonly seats: readonly BotSeatView[];
  /** Bot seats the arena refused because `addBotSeat` returned null. */
  readonly refusedSeats: number;
  /** Seats whose brain failed to load and fell back to neutral. */
  readonly degradedSeats: number;
  readonly notices: readonly BotNotice[];
  /** True when the host must NOT start a match. The bot layer will not throw. */
  readonly blocked: boolean;
}

export interface BotTickObservation {
  /** The donor's live state block. Read synchronously. */
  readonly state: Float32Array;
  readonly pads?: readonly BoostPadView[];
  /** When given, each seat's controls are written to it. */
  readonly sim?: PortedSim;
  /** Ticks since kickoff, or -1. */
  readonly kickoffTick?: number;
}

export interface BotTickReport {
  /** Seats pumped this frame. */
  readonly ticked: number;
  /** Seats whose controls were written to the sim. */
  readonly written: number;
  /** Seats currently stalled or errored. Diagnostics only — nothing is blocked. */
  readonly degraded: number;
  /** True while any seat is over its decision budget. */
  readonly stalled: boolean;
}

export interface BotSeatManagerOptions {
  readonly registry: ManagedCarSlotRegistry;
  /** Built by the host. `donor-inference.ts` supplies the donor-backed one. */
  readonly createInference: BotInferenceFactory;
  /** Defaults to the MIT model (`seer`). */
  readonly difficulty?: BotDifficultyId;
  readonly policy?: BotFillPolicy;
  readonly teamSize?: number;
  readonly preferredTeam?: BotTeam;
  /** Injectable clock so the watchdog needs no real time. */
  readonly clock?: () => number;
  /** Per-decision budget. Default 2 s. */
  readonly decisionBudgetMs?: number;
  /** Default `"scripted"` — a bot that plays beats a bot that freezes. */
  readonly oversizedArena?: OversizedArenaPolicy;
  /** Overrides the scripted brain, e.g. a stronger or themed policy. */
  readonly createScripted?: (difficulty: BotDifficultyId) => BotInference;
  /** Observability ONLY. Nothing here pauses a match. */
  readonly onNotice?: (notice: BotNotice) => void;
  readonly onStall?: (info: BotStallInfo) => void;
}

export interface BotSeatManager {
  /** Pure. Computes the roster without touching the registry. */
  plan(humanCount: number, overrides?: { teamSize?: number; policy?: BotFillPolicy }): BotFillPlan;
  /** Reserve seats, build sources, load weights. Resolves with a report. */
  startMatch(humanCount?: number, overrides?: { teamSize?: number; policy?: BotFillPolicy }): Promise<BotStartReport>;
  /** Per frame. Synchronous, total, never throws. */
  tick(observation: BotTickObservation): BotTickReport;
  /** Neutralize every bot seat and release every brain. Idempotent. */
  stopMatch(reason?: NeutralizeReason): void;
  /** Neutralize and drop one seat, e.g. a human claimed its car. */
  releaseSlot(slot: number, reason?: NeutralizeReason): void;
  /** Every live bot seat, in slot order. */
  seats(): readonly BotSeatView[];
  /** The source for one slot, for a host that drives the sim itself. */
  sourceOf(slot: number): ManagedBotInputSource | null;
  /** The mode the last `startMatch` resolved to. */
  mode(): BotInferenceMode;
  /** True while any seat is stalled. Diagnostics only. */
  hasStalledSeat(): boolean;
}

const describeError = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/**
 * `CarInputSource.team` is nullable only because a human can be bound before a
 * team is chosen. A bot seat is ALWAYS created with a team, so this narrows the
 * seam's type to the bot layer's without an assertion at each use site.
 */
const seatTeam = (source: ManagedBotInputSource): BotTeam => (source.team === 1 ? 1 : 0);

/** Reporting must never become a failure path of its own. */
const notify = (run: (() => void) | undefined): void => {
  if (!run) return;
  try {
    run();
  } catch (error) {
    console.warn(
      `[rocket-arena/bots] a bot notice callback threw: ${describeError(error)}`,
    );
  }
};

export const createBotSeatManager = (options: BotSeatManagerOptions): BotSeatManager => {
  const { registry } = options;
  // A MISSING option means "use the default" (the MIT model), whereas an
  // UNRECOGNISED id means "turn bots off" — `getBotDifficulty` resolves the
  // latter, so the default is applied here rather than being conflated with it.
  const difficulty = getBotDifficulty(options.difficulty ?? DEFAULT_BOT_DIFFICULTY_ID);
  const notices: BotNotice[] = [];
  const seats = new Map<number, ManagedBotInputSource>();
  const brains = new Map<number, BotInference>();
  const budgetMs = resolveDecisionBudgetMs(options.decisionBudgetMs ?? DEFAULT_DECISION_BUDGET_MS);
  const oversized = options.oversizedArena ?? "scripted";
  let activeMode: BotInferenceMode = "seat-only";
  let activePlan: BotFillPlan | null = null;

  const notice = (code: BotNoticeCode, message: string, seat?: number): void => {
    const entry: BotNotice = seat === undefined ? { code, message } : { code, message, seat };
    notices.push(entry);
    notify(() => options.onNotice?.(entry));
  };

  const plan = (
    humanCount: number,
    overrides?: { teamSize?: number; policy?: BotFillPolicy },
  ): BotFillPlan =>
    planBotFill({
      humanCount,
      teamSize: overrides?.teamSize ?? options.teamSize,
      policy: overrides?.policy ?? options.policy ?? DEFAULT_BOT_FILL_POLICY,
      preferredTeam: options.preferredTeam,
    });

  /**
   * Which brain a match may use. Decided ONCE, before any weights are
   * requested, because discovering a 1v1-only model in a 3v3 mid-match is
   * precisely the failure this layer is meant to make impossible.
   *
   * `blocked` is returned rather than inferred later, because the two ways to
   * refuse a match (an unplayable roster, and an operator who chose
   * `oversized: "refuse"`) need different messages.
   */
  const resolveMode = (botFill: BotFillPlan): { mode: BotInferenceMode; blocked: boolean } => {
    if (botFill.policy === "off" || botFill.totalBots === 0) return { mode: "seat-only", blocked: false };
    if (!difficulty.enabled) {
      notice("bots-disabled", "Bots are turned off for this match.");
      return { mode: "disabled", blocked: false };
    }
    if (canDriveArena(difficulty.id, botFill.totalCars)) return { mode: "neural", blocked: false };

    const refusal = describeArenaRefusal(difficulty.id, botFill.totalCars) ?? "unknown reason.";
    if (oversized === "refuse") {
      notice("match-refused", refusal);
      return { mode: "seat-only", blocked: true };
    }
    if (oversized === "seat-only") {
      notice("oversized-arena", `${refusal} Bot seats will sit neutral this match.`);
      return { mode: "seat-only", blocked: false };
    }
    notice(
      "oversized-arena",
      `${refusal} A deterministic scripted bot will drive the bot seats instead.`,
    );
    return { mode: "scripted", blocked: false };
  };

  const buildBrain = (mode: BotInferenceMode, seat: number): BotInference => {
    if (mode === "neural") {
      try {
        return options.createInference(difficulty.id);
      } catch (error) {
        notice("model-load-failed", `Could not build ${difficulty.label}: ${describeError(error)}`, seat);
        return createNeutralInference(difficulty.id);
      }
    }
    if (mode === "scripted") {
      return options.createScripted
        ? options.createScripted(difficulty.id)
        : createScriptedInference({ id: difficulty.id });
    }
    return createNeutralInference(difficulty.id);
  };

  const views = (): readonly BotSeatView[] =>
    [...seats.entries()]
      .map(([slot, source]) => ({
        slot,
        team: seatTeam(source),
        botId: source.botId,
        status: source.status,
        mode: activeMode,
      }))
      .sort((a, b) => a.slot - b.slot);

  const dropSeat = (slot: number, reason: NeutralizeReason): void => {
    const source = seats.get(slot);
    if (source) {
      source.stop(reason);
      seats.delete(slot);
    }
    const brain = brains.get(slot);
    if (brain) {
      try {
        brain.dispose();
      } catch (error) {
        console.warn(`[rocket-arena/bots] disposing slot ${slot} failed: ${describeError(error)}`);
      }
      brains.delete(slot);
    }
  };

  const manager: BotSeatManager = {
    plan,

    async startMatch(humanCount = 0, overrides) {
      // Idempotent: a restart must not leak the previous match's seats.
      manager.stopMatch("replaced");
      notices.length = 0;

      const botFill = plan(humanCount, overrides);
      activePlan = botFill;
      const resolved = resolveMode(botFill);
      const mode = resolved.mode;
      activeMode = mode;

      if (botFill.overflow > 0) {
        notice(
          "seat-refused",
          `${botFill.overflow} player${botFill.overflow === 1 ? " is" : "s are"} waiting for a car.`,
        );
      }

      // An unplayable roster, or an explicit `oversized: "refuse"`, means the
      // host must not start. Reported, never thrown.
      const blocked = !botFill.playable || resolved.blocked;
      if (blocked) {
        if (botFill.refusal) notice("match-refused", botFill.refusal);
      }

      let refusedSeats = 0;
      let degradedSeats = 0;
      if (blocked) {
        return { plan: botFill, mode, difficulty, seats: [], refusedSeats, degradedSeats, notices: [...notices], blocked };
      }

      // Reserve one seat per planned bot, on the team the planner chose.
      for (const team of [0, 1] as const) {
        for (let i = 0; i < botFill.bots[team]; i += 1) {
          const slot = registry.addBotSeat(team);
          if (slot === null) {
            refusedSeats += 1;
            notice("seat-refused", `The arena is full; a team ${team} bot seat was dropped.`);
            continue;
          }
          // One brain per seat: the donor's controller carries a single `action`
          // field (`bots/controller.js:21`) and feeds it into every observation,
          // so sharing one across two cars would interleave their worlds.
          const brain = buildBrain(mode, slot);
          brains.set(slot, brain);
          const source = createBotInputSource({
            playerId: `bot:${difficulty.id}:${slot}`,
            slot,
            team,
            inference: brain,
            clock: options.clock,
            decisionBudgetMs: budgetMs,
            onStall: options.onStall,
          });
          source.start();
          seats.set(slot, source);
        }
      }

      // Weights load AFTER the seats exist, so a slow download shows a neutral
      // bot car rather than a match that cannot start. A failure here is a
      // notice, never a rejection.
      await Promise.all(
        [...brains.entries()].map(async ([slot, brain]) => {
          try {
            await brain.load();
            if (mode === "neural" && !brain.isReady) {
              degradedSeats += 1;
              notice("model-load-failed", `${difficulty.label} did not report ready; this bot will sit neutral.`, slot);
            }
          } catch (error) {
            degradedSeats += 1;
            notice("model-load-failed", `${difficulty.label} failed to load: ${describeError(error)}`, slot);
          }
        }),
      );

      if (mode === "neural") {
        notice("inference-mode", `Driving ${seats.size} bot seat${seats.size === 1 ? "" : "s"} with ${difficulty.label}.`);
      }

      return { plan: botFill, mode, difficulty, seats: views(), refusedSeats, degradedSeats, notices: [...notices], blocked: false };
    },

    /**
     * Pump every seat and write its level controls to the sim.
     *
     * Synchronous and total by construction: no await, and every call into a
     * brain or the sim is contained. A broken seat costs that seat its frame.
     */
    tick(observation: BotTickObservation): BotTickReport {
      let ticked = 0;
      let written = 0;
      let degraded = 0;
      let stalled = false;
      const { sim, state, pads = [], kickoffTick = -1 } = observation;

      for (const [slot, source] of seats) {
        if (!source.isLive()) continue;
        const botObservation: BotObservation = {
          state,
          pads,
          // The models index the world as `[slot, 1 - slot]`, so a seat in a
          // larger arena must not reach a neural brain. `resolveMode` already
          // guarantees that: "neural" is only chosen when `totalCars === 2`.
          slot,
          team: seatTeam(source),
          current: source.read(),
          kickoffTick,
        };
        try {
          source.pump(botObservation);
          ticked += 1;
        } catch (error) {
          // `pump` is written not to throw; this is the belt to its braces, and
          // the cost of it firing is one skipped seat, not a stopped match.
          console.warn(`[rocket-arena/bots] slot ${slot} pump failed: ${describeError(error)}`);
        }
        if (source.status === "stalled" || source.status === "errored") {
          degraded += 1;
          stalled = stalled || source.status === "stalled";
        }
        if (!sim) continue;
        try {
          sim.setControls(slot, source.read());
          written += 1;
        } catch (error) {
          console.warn(`[rocket-arena/bots] writing slot ${slot} failed: ${describeError(error)}`);
        }
      }

      return { ticked, written, degraded, stalled };
    },

    stopMatch(reason: NeutralizeReason = "released") {
      for (const slot of [...seats.keys()]) dropSeat(slot, reason);
      seats.clear();
      brains.clear();
      activeMode = "seat-only";
    },

    releaseSlot(slot: number, reason: NeutralizeReason = "replaced") {
      dropSeat(slot, reason);
    },

    seats: () => views(),

    sourceOf: (slot: number) => seats.get(slot) ?? null,

    mode: () => activeMode,

    hasStalledSeat() {
      for (const source of seats.values()) if (source.status === "stalled") return true;
      return false;
    },
  };

  return manager;
};

/**
 * The whole host-side tick, in one call. Humans come from the input layer's
 * `pushControls`; this adds the bot seats the registry reports with a null
 * source. Both are needed: `slots/pushControls` skips a bot seat because
 * `addBotSeat` deliberately leaves `source: null`, and the bot seats must still
 * be driven.
 */
export const pushBotControls = (
  manager: BotSeatManager,
  observation: BotTickObservation,
): BotTickReport => manager.tick(observation);
