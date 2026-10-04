/**
 * Bot seat planner — how many bots, on which team.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS IS ITS OWN PURE MODULE
 * ---------------------------------------------------------------------------
 * The product is a live event: people join by QR on their phones, and a match
 * has to START even when only 2 of 4 seats are filled. Deciding who fills the
 * gap is a roster question, not a rendering one, so it is answered here with no
 * sim, no DOM, no WASM, no donor import and no neural runtime. It is therefore
 * testable in `environment: "node"` and safe to call from a lobby, a config
 * screen or a test.
 *
 * ---------------------------------------------------------------------------
 * THE TWO RULES THAT ARE NOT NEGOTIABLE
 * ---------------------------------------------------------------------------
 * 1. EQUAL TEAMS. `slots/team-balance.ts:20-28` is explicit: kickoff fairness
 *    only holds if the two spawn sets are mirror images, and a mirror pair
 *    needs a counterpart on every slot. So the bots absorb the imbalance and a
 *    HUMAN is never given a team to make the numbers work. Odd human counts are
 *    the whole reason this module exists.
 * 2. LEGAL SIZES. The arena is `MAX_CARS` wide (`bridge.cpp`: `MAX_CARS = 8`)
 *    and split across exactly two teams, so a team can never exceed
 *    `floor(MAX_CARS / 2)` = 4. `teamSize` is clamped to that, which means
 *    1v1 / 2v2 / 3v3 are all reachable and 5v5 is not.
 *
 * ---------------------------------------------------------------------------
 * `off` IS A REAL ANSWER, NOT A FALLBACK
 * ---------------------------------------------------------------------------
 * `policy: "off"` yields EXACTLY zero bots for every input, including the
 * 1-human case that would otherwise become 1v1. The plan then reports
 * `playable: false` with a `refusal` reason rather than quietly inventing a
 * bot, because "turn bots off" and "fill the empty seats" are different product
 * decisions and only the host knows which one the operator made.
 */

import { MAX_CARS } from "../seam.js";

/** Which team a car plays for. `0 | 1` is the ABI, not a preference. */
export type BotTeam = 0 | 1;

/** `off` = never add a bot. `fill-teams` = pad both teams to `teamSize`. */
export type BotFillPolicy = "off" | "fill-teams";

export const BOT_FILL_POLICIES = ["off", "fill-teams"] as const;

/** Filling is the product default: an event must always be able to start. */
export const DEFAULT_BOT_FILL_POLICY: BotFillPolicy = "fill-teams";

/** Largest legal team: two of them must fit inside `MAX_CARS`. */
export const MAX_BOT_TEAM_SIZE = Math.max(1, Math.floor(MAX_CARS / 2));

/** Why a plan cannot become a match. `null` when it can. */
export type BotFillRefusal =
  /** The operator turned bots off and there are too few humans to fill both teams. */
  | "bots-disabled"
  /** Nobody is in the arena, so there is no match to fill. */
  | "too-few-cars"
  /** The configured capacity cannot hold two cars, so no team size is legal. */
  | "arena-too-small";

export interface BotFillRequest {
  /** How many Air Jam players are present right now. */
  readonly humanCount: number;
  /** Cars per team, so the match is 1v1 / 2v2 / 3v3. Default 1. */
  readonly teamSize?: number;
  /** Default `"fill-teams"`. */
  readonly policy?: BotFillPolicy;
  /** Which team takes the extra seat when the human count is odd. Default 0. */
  readonly preferredTeam?: BotTeam;
  /** Hard car ceiling. Default `MAX_CARS` (8); clamped to it. */
  readonly capacity?: number;
}

export interface BotFillPlan {
  readonly policy: BotFillPolicy;
  /** Cars per team after clamping. */
  readonly teamSize: number;
  /** Humans per team, index 0 → team 0. */
  readonly humans: readonly [number, number];
  /** Bots per team, index 0 → team 0. */
  readonly bots: readonly [number, number];
  /** Cars per team INCLUDING bots. Equal on both sides for a filled plan. */
  readonly teamSizes: readonly [number, number];
  readonly totalBots: number;
  readonly totalCars: number;
  /** Humans who did not fit in the arena. Reported, never silently dropped. */
  readonly overflow: number;
  /** Bot counts differ by at most one, which is the best an odd roster allows. */
  readonly balanced: boolean;
  /** False when the roster cannot be a match. The host must not start one. */
  readonly playable: boolean;
  readonly refusal: BotFillRefusal | null;
  /** One line for a HUD or a producer screen. */
  readonly summary: string;
}

const clampCount = (value: number | undefined, fallback: number): number => {
  const requested = Math.floor(value ?? fallback);
  if (!Number.isFinite(requested)) return fallback;
  return Math.max(0, requested);
};

const emptyPlan = (
  request: BotFillRequest,
  policy: BotFillPolicy,
  teamSize: number,
  refusal: BotFillRefusal,
): BotFillPlan => ({
  policy,
  teamSize,
  humans: [0, 0],
  bots: [0, 0],
  teamSizes: [0, 0],
  totalBots: 0,
  totalCars: 0,
  overflow: clampCount(request.humanCount, 0),
  balanced: true,
  playable: false,
  refusal,
  summary: `No match: ${refusal}.`,
});

/**
 * Decide the bot roster. Pure: same request, same plan, no clocks, no globals.
 *
 * Humans are spread as evenly as the two teams allow, so an odd count puts the
 * extra human on `preferredTeam` and the bot lands on the other side. Filling
 * then pads each team up to `teamSize`, which is what makes every filled plan
 * end up with two equal teams regardless of parity.
 */
export const planBotFill = (request: BotFillRequest): BotFillPlan => {
  const capacity = Math.min(MAX_CARS, clampCount(request.capacity, MAX_CARS));
  const policy: BotFillPolicy = request.policy === "off" ? "off" : DEFAULT_BOT_FILL_POLICY;
  const preferred: BotTeam = request.preferredTeam === 1 ? 1 : 0;

  // Two teams must both fit, so the team size is capped by half the arena.
  const maxTeam = Math.max(1, Math.floor(capacity / 2));
  const requestedTeam = clampCount(request.teamSize, 1);
  const teamSize = Math.max(1, Math.min(requestedTeam, maxTeam, MAX_BOT_TEAM_SIZE));

  if (capacity < 2) return emptyPlan(request, policy, teamSize, "arena-too-small");

  const humanCount = clampCount(request.humanCount, 0);
  const seats = 2 * teamSize;
  const seated = Math.min(humanCount, seats);
  const overflow = humanCount - seated;

  // `Math.ceil` gives the first team the extra seat on an odd count; flipping it
  // for `preferredTeam: 1` keeps the split deterministic instead of arbitrary.
  const first = Math.ceil(seated / 2);
  const humans: readonly [number, number] =
    preferred === 0 ? [first, seated - first] : [seated - first, first];

  if (policy === "off") {
    // The contract: `off` NEVER produces a bot, not even for one human.
    const totalCars = humans[0] + humans[1];
    const playable = totalCars >= 2;
    const refusal: BotFillRefusal | null = playable ? null : humanCount >= 1 ? "bots-disabled" : "too-few-cars";
    return {
      policy,
      teamSize,
      humans,
      bots: [0, 0],
      teamSizes: [humans[0], humans[1]],
      totalBots: 0,
      totalCars,
      overflow,
      // Balanced because there are no bots to balance; the teams are as even as
      // an unfilled roster can be.
      balanced: true,
      playable,
      refusal,
      summary: playable
        ? `${totalCars} human car${totalCars === 1 ? "" : "s"}, bots off.`
        : `Bots are off and ${humanCount} human${humanCount === 1 ? " is" : "s are"} in the arena — a match needs 2 cars.`,
    };
  }

  const bots: readonly [number, number] = [
    Math.max(0, teamSize - humans[0]),
    Math.max(0, teamSize - humans[1]),
  ];
  const teamSizes: readonly [number, number] = [humans[0] + bots[0], humans[1] + bots[1]];
  const totalBots = bots[0] + bots[1];
  const totalCars = teamSizes[0] + teamSizes[1];
  const playable = totalCars >= 2;

  return {
    policy,
    teamSize,
    humans,
    bots,
    teamSizes,
    totalBots,
    totalCars,
    overflow,
    balanced: Math.abs(bots[0] - bots[1]) <= 1,
    playable,
    refusal: playable ? null : "too-few-cars",
    summary:
      `${teamSize}v${teamSize}: ${humans[0] + humans[1]} human${humans[0] + humans[1] === 1 ? "" : "s"}` +
      ` + ${totalBots} bot${totalBots === 1 ? "" : "s"}` +
      (overflow > 0 ? ` (${overflow} waiting for a car)` : ""),
  };
};

/** Total cars a `teamSize` implies. Handy for a settings screen. */
export const botSeatsForTeamSize = (teamSize: number): number =>
  2 * Math.max(1, Math.min(clampCount(teamSize, 1), MAX_BOT_TEAM_SIZE));

/**
 * Every `(teamSize, humanCount)` the product actually reaches, as one table.
 * The host's lobby can render this instead of re-deriving the rule, and it makes
 * the parity cases impossible to get subtly wrong in a UI.
 */
export const BOT_FILL_MATRIX: ReadonlyArray<{
  readonly teamSize: number;
  readonly humanCount: number;
  readonly bots: readonly [number, number];
}> = (() => {
  const rows: { teamSize: number; humanCount: number; bots: readonly [number, number] }[] = [];
  for (const teamSize of [1, 2, 3]) {
    for (let humanCount = 1; humanCount <= 2 * teamSize; humanCount += 1) {
      rows.push({ teamSize, humanCount, bots: planBotFill({ humanCount, teamSize }).bots });
    }
  }
  return rows;
})();
