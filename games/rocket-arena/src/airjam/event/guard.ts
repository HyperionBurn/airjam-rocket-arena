/**
 * ============================================================================
 * PHASE 12 — EVENT MODE. THE GUARD. The one place that decides "safe to launch".
 * ============================================================================
 *
 * OWNER: the Event Mode worker (`src/airjam/event/**`).
 *
 * ---------------------------------------------------------------------------
 * WHY THIS EXISTS AND WHY IT RETURNS INSTEAD OF THROWING
 * ---------------------------------------------------------------------------
 * At a live event the projector is the only screen in the room and there is no
 * technician. A thrown exception here would propagate out of a start button and
 * take the page down mid-event, with a crowd watching. So this module treats
 * "cannot launch" as a NORMAL, EXPECTED product state with a producer-readable
 * reason attached — not as an exceptional one.
 *
 * The no-throw promise is made STRUCTURALLY, not by discipline: the entire body
 * of `guardEventMatch` runs inside one try/catch whose catch arm itself returns
 * an `internal-error` refusal. There is no code path out of this function that
 * can throw, including a path reached with a garbage input, because a garbage
 * input is exactly the case most likely to throw.
 *
 * ---------------------------------------------------------------------------
 * WHAT IS ACTUALLY CHECKED
 * ---------------------------------------------------------------------------
 * Four things, and the ordering is the product's priority order — the first
 * refusal reported is the one an operator most needs to hear:
 *
 *   1. VALIDITY      — is this request even shaped like a request?
 *   2. ROSTER        — enough players or bots to fill both teams?
 *   3. BALANCE       — are the two teams the same size? Kickoff fairness
 *                      (`slots/team-balance.ts`) requires a mirror pair, so an
 *                      unbalanced roster is a refusal, not a warning.
 *   4. CAPACITY      — is any seat over the native `MAX_CARS = 8`? Exceeding it
 *                      is not a performance problem, it is a hard refusal from
 *                      `bridge.cpp`.
 *
 * Two further checks are refusals because a wrong value there is unrunnable
 * rather than merely undesirable: a team size that cannot fit twice in the arena,
 * and an UNLIMITED match length (which has no cycle time and therefore no end
 * to a live event).
 *
 * What is NOT a refusal, deliberately: the 1v1-only bot constraint. That is
 * already resolved into a `scripted` brain by `resolveEventBotMode`, and a
 * notice is the right output for a downgrade the system handled on its own.
 * Refusing a 2v2 EVENT MODE match because the donor's ONNX cannot drive four
 * cars would be refusing to run the event at all.
 */

import { MAX_CARS } from "@/airjam/seam";
import { MAX_BOT_TEAM_SIZE } from "@/airjam/bots/bot-fill-plan";
import type { BotFillPlan } from "@/airjam/bots/bot-fill-plan";
import { matchDurationMs } from "@/lobby/settings";
import type { MatchLengthMinutes } from "@/lobby/types";
import { isPacingCoherent, pacingOrderingViolations, type EventPacing } from "./pacing.js";

/* -------------------------------------------------------------------------- */
/* Refusals                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Every way EVENT MODE can decline to launch. Each is a distinct PRODUCT state
 * with a distinct operator remedy, which is why this is a union of codes and
 * not a list of strings.
 */
export type EventRefusalCode =
  /** The request was not shaped like a request at all. */
  | "invalid-input"
  /** Nobody is in the room, so there is no match to fill. */
  | "no-players"
  /** The operator turned bots off and the humans cannot fill both teams. */
  | "bots-disabled"
  /** Fewer than two cars, so there is no match. */
  | "too-few-cars"
  /** The configured capacity cannot hold two cars, so no team size is legal. */
  | "arena-too-small"
  /** The two teams are not the same size, so kickoff would be unfair. */
  | "teams-unbalanced"
  /** More cars than `bridge.cpp` will hold. A hard native refusal. */
  | "over-native-cap"
  /** One team cannot fit twice in the arena. */
  | "team-size-illegal"
  /** UNLIMITED matches have no end, and an event needs one. */
  | "match-length-unlimited"
  /** A timing is negative, non-finite, or ordered impossibly. */
  | "pacing-incoherent"
  /** A defect in this module. Still a refusal, never a throw. */
  | "internal-error";

/**
 * A refusal. `message` is safe to put on the projector; `remedy` tells a
 * producer what to do about it in one short sentence.
 */
export interface EventRefusal {
  readonly code: EventRefusalCode;
  readonly message: string;
  readonly remedy?: string;
  /** Numbers behind the decision, so a log is actionable without a repro. */
  readonly detail?: string;
}

/** Something worth showing that is not a reason to stop. */
export interface EventNotice {
  readonly code: string;
  readonly message: string;
}

export interface EventGuardResult {
  /** True only when `refusals` is empty. */
  readonly ok: boolean;
  /** Empty when `ok`. Otherwise the reasons, in product-priority order. */
  readonly refusals: readonly EventRefusal[];
  /** Handled conditions. Never blocks. */
  readonly notices: readonly EventNotice[];
  /** One line, projector-safe. */
  readonly summary: string;
}

/* -------------------------------------------------------------------------- */
/* Input                                                                        */
/* -------------------------------------------------------------------------- */

export interface EventGuardInput {
  /** Humans in the room. Used for the "is anybody here" check. */
  readonly players: number;
  /** Phase 8's roster plan. The authority on counts. */
  readonly botFill: BotFillPlan;
  /** The EFFECTIVE team size, after `resolveEventTeamSize`. */
  readonly teamSize: number;
  /** Cars per team INCLUDING bots, from the bot fill plan. */
  readonly teamSizes: readonly [number, number];
  /** The match length EVENT MODE resolved to. */
  readonly matchLength: MatchLengthMinutes;
  /** The pacing profile in force. */
  readonly pacing: EventPacing;
  /** Non-fatal notes collected by the caller (e.g. a bot downgrade). */
  readonly notices?: readonly EventNotice[];
}

/* -------------------------------------------------------------------------- */
/* The guard                                                                    */
/* -------------------------------------------------------------------------- */

const describeError = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const isWholeNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && Number.isInteger(value);

/**
 * The single place that decides whether an EVENT MODE match may launch.
 *
 * TOTAL: it returns for every input and throws for none. See the module header
 * for why that is a structural promise and not a coding convention.
 */
export function guardEventMatch(input: EventGuardInput): EventGuardResult {
  const refusals: EventRefusal[] = [];
  const notices: EventNotice[] = [];

  try {
    // -- 1. VALIDITY ---------------------------------------------------------
    // Checked first and checked defensively: every later check indexes into
    // these, so a malformed request has to be rejected before it is read.
    if (input === null || typeof input !== "object") {
      refusals.push({
        code: "invalid-input",
        message: "Event Mode was given no request to check.",
        remedy: "This is a defect. The event cannot start.",
      });
      return finish(refusals, notices);
    }

    const { players, botFill, teamSize, teamSizes, matchLength, pacing } = input;

    if (!isWholeNumber(players) || players < 0) {
      refusals.push({
        code: "invalid-input",
        message: "Event Mode could not count the players in the room.",
        remedy: "This is a defect. The event cannot start.",
        detail: `players=${String(players)}`,
      });
    }
    if (!isWholeNumber(teamSize) || teamSize < 1) {
      refusals.push({
        code: "invalid-input",
        message: "Event Mode resolved a team size that is not a whole number of cars.",
        remedy: "This is a defect. The event cannot start.",
        detail: `teamSize=${String(teamSize)}`,
      });
    }
    if (botFill === null || typeof botFill !== "object") {
      refusals.push({
        code: "invalid-input",
        message: "Event Mode has no bot roster plan to check.",
        remedy: "This is a defect. The event cannot start.",
      });
    }
    if (refusals.length > 0) return finish(refusals, notices);

    // -- 2. ROSTER -----------------------------------------------------------
    if (players < 1) {
      refusals.push({
        code: "no-players",
        message: "Nobody has scanned the QR code yet.",
        remedy: "Wait for players to join — the lobby fills them in automatically.",
        detail: "players=0",
      });
    }

    // Phase 8 already produced the reason; reuse its code rather than
    // re-deciding "can this roster be a match" in a second place.
    if (botFill.playable !== true) {
      const code: EventRefusalCode =
        botFill.refusal === "bots-disabled"
          ? "bots-disabled"
          : botFill.refusal === "arena-too-small"
            ? "arena-too-small"
            : "too-few-cars";
      refusals.push({
        code,
        message:
          botFill.refusal === "bots-disabled"
            ? "Bots are off and there are not enough players for two teams."
            : botFill.refusal === "arena-too-small"
              ? "The arena is too small to hold two teams."
              : "There are not enough cars for a match.",
        remedy:
          botFill.refusal === "bots-disabled"
            ? "Turn bot fill on in EVENT MODE settings, or wait for a second player."
            : "Wait for more players, or check the arena capacity.",
        detail: botFill.summary,
      });
    }

    // -- 3. BALANCE ----------------------------------------------------------
    // Kickoff fairness is a mirror-image requirement (`slots/team-balance.ts`),
    // so an unequal roster is a refusal even when the sizes are "close enough".
    const difference = Math.abs((teamSizes[0] ?? 0) - (teamSizes[1] ?? 0));
    if (difference !== 0) {
      refusals.push({
        code: "teams-unbalanced",
        message: `The teams are not the same size (${teamSizes[0] ?? 0} vs ${teamSizes[1] ?? 0}).`,
        remedy: "Event Mode fills the smaller team with bots — this is a defect if it happens.",
        detail: `teamSizes=${JSON.stringify(teamSizes)}`,
      });
    }

    // -- 4. CAPACITY ---------------------------------------------------------
    // `bridge.cpp` refuses `addCar` past MAX_CARS, so this is the native limit,
    // not a policy one.
    const totalCars = (teamSizes[0] ?? 0) + (teamSizes[1] ?? 0);
    if (totalCars > MAX_CARS) {
      refusals.push({
        code: "over-native-cap",
        message: `This match needs ${totalCars} cars but the arena holds only ${MAX_CARS}.`,
        remedy: `Reduce the team size to ${Math.floor(MAX_CARS / 2)} or fewer per team.`,
        detail: `totalCars=${totalCars} MAX_CARS=${MAX_CARS}`,
      });
    }
    if (totalCars < 2) {
      refusals.push({
        code: "too-few-cars",
        message: `A match needs at least 2 cars; this one has ${totalCars}.`,
        remedy: "Wait for another player, or turn bot fill on.",
        detail: `totalCars=${totalCars}`,
      });
    }
    if (teamSize > MAX_BOT_TEAM_SIZE || 2 * teamSize > MAX_CARS) {
      refusals.push({
        code: "team-size-illegal",
        message: `A team of ${teamSize} does not fit twice in an ${MAX_CARS}-car arena.`,
        remedy: `Use ${MAX_BOT_TEAM_SIZE} players per team or fewer.`,
        detail: `teamSize=${teamSize} maxTeamSize=${MAX_BOT_TEAM_SIZE}`,
      });
    }

    // -- 5. THE MATCH ITSELF -------------------------------------------------
    if (matchDurationMs(matchLength) === null) {
      refusals.push({
        code: "match-length-unlimited",
        message: "An unlimited match has no end, and a live event needs one.",
        remedy: "Set a match length — EVENT MODE uses 3 minutes.",
        detail: `matchLength=${String(matchLength)}`,
      });
    }

    if (!isPacingCoherent(pacing)) {
      refusals.push({
        code: "pacing-incoherent",
        message: "An event timing is negative or not a number.",
        remedy: "This is a defect. The event cannot start.",
        detail: JSON.stringify(pacing ?? null),
      });
    } else {
      const ordering = pacingOrderingViolations(pacing);
      if (ordering.length > 0) {
        refusals.push({
          code: "pacing-incoherent",
          message: `The event timings are in an impossible order: ${ordering.join("; ")}.`,
          remedy: "This is a defect. The event cannot start.",
          detail: ordering.join("; "),
        });
      }
    }

    // -- notices -------------------------------------------------------------
    // Collected from the caller and always non-blocking.
    for (const notice of input.notices ?? []) {
      if (notice && typeof notice.message === "string") notices.push(notice);
    }
    if (botFill.overflow > 0) {
      notices.push({
        code: "players-waiting",
        message: `${botFill.overflow} player${botFill.overflow === 1 ? " is" : "s are"} waiting for a car in the next match.`,
      });
    }

    return finish(refusals, notices);
  } catch (error) {
    // Unreachable in practice. Present precisely so that a defect in THIS
    // module still cannot take the projector down at a live event.
    return finish(
      [
        ...refusals,
        {
          code: "internal-error" as const,
          message: "Event Mode could not check this match and stopped it from starting.",
          remedy: "The event can carry on — try starting again.",
          detail: describeError(error),
        },
      ],
      notices,
    );
  }
}

/** The one place a guard result is assembled, so the two paths cannot diverge. */
function finish(refusals: readonly EventRefusal[], notices: readonly EventNotice[]): EventGuardResult {
  const ok = refusals.length === 0;
  const summary = ok
    ? notices.length > 0
      ? `Ready to start. ${notices.map((notice) => notice.message).join(" ")}`
      : "Ready to start."
    : refusals.map((refusal) => refusal.message).join(" ");
  return { ok, refusals, notices, summary };
}

/** The refusal a host should act on first, or null when the match may launch. */
export const firstRefusal = (result: EventGuardResult): EventRefusal | null =>
  result.refusals[0] ?? null;
