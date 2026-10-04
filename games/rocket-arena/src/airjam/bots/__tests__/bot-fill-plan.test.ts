import { describe, expect, it } from "vitest";

import {
  BOT_FILL_MATRIX,
  DEFAULT_BOT_FILL_POLICY,
  MAX_BOT_TEAM_SIZE,
  botSeatsForTeamSize,
  planBotFill,
} from "../bot-fill-plan.js";

/**
 * The product targets, straight from the brief:
 *   1 human  -> 1v1 with 1 bot
 *   2 humans -> 1v1 or 2v2 per settings
 *   3 humans -> 2v2 with 1 bot
 *   5 humans in a 3v3 -> 1 bot
 *   6 humans -> 0 bots
 */
describe("planBotFill — the product fill table", () => {
  it("puts one bot opposite a single human in a 1v1", () => {
    const plan = planBotFill({ humanCount: 1, teamSize: 1 });
    expect(plan.humans).toEqual([1, 0]);
    expect(plan.bots).toEqual([0, 1]);
    expect(plan.teamSizes).toEqual([1, 1]);
    expect(plan.totalBots).toBe(1);
    expect(plan.playable).toBe(true);
    expect(plan.balanced).toBe(true);
  });

  it("gives two humans a botless 1v1 or a bot-filled 2v2, per teamSize", () => {
    const onePerTeam = planBotFill({ humanCount: 2, teamSize: 1 });
    expect(onePerTeam.bots).toEqual([0, 0]);
    expect(onePerTeam.teamSizes).toEqual([1, 1]);
    expect(onePerTeam.totalBots).toBe(0);

    const twoPerTeam = planBotFill({ humanCount: 2, teamSize: 2 });
    expect(twoPerTeam.humans).toEqual([1, 1]);
    expect(twoPerTeam.bots).toEqual([1, 1]);
    expect(twoPerTeam.teamSizes).toEqual([2, 2]);
    expect(twoPerTeam.totalBots).toBe(2);
  });

  it("fills a 3-human 2v2 with exactly one bot on the short side", () => {
    const plan = planBotFill({ humanCount: 3, teamSize: 2 });
    expect(plan.humans).toEqual([2, 1]);
    expect(plan.bots).toEqual([0, 1]);
    expect(plan.teamSizes).toEqual([2, 2]);
    expect(plan.totalBots).toBe(1);
    // The bot is never given a human's team to balance the numbers.
    expect(plan.humans[0] + plan.bots[0]).toBe(2);
  });

  it("fills a 5-human 3v3 with one bot and leaves 6 humans botless", () => {
    const five = planBotFill({ humanCount: 5, teamSize: 3 });
    expect(five.humans).toEqual([3, 2]);
    expect(five.bots).toEqual([0, 1]);
    expect(five.teamSizes).toEqual([3, 3]);
    expect(five.totalBots).toBe(1);

    const six = planBotFill({ humanCount: 6, teamSize: 3 });
    expect(six.bots).toEqual([0, 0]);
    expect(six.totalBots).toBe(0);
    expect(six.teamSizes).toEqual([3, 3]);
  });
});

describe("planBotFill — every legal combination, 1..6 humans", () => {
  it("always yields two equal, legal teams with balanced bots", () => {
    for (const teamSize of [1, 2, 3]) {
      for (let humanCount = 1; humanCount <= 6; humanCount += 1) {
        const plan = planBotFill({ humanCount, teamSize });
        const where = `teamSize=${teamSize} humans=${humanCount}`;

        // Equal team sizes whenever the arena was filled.
        expect(plan.teamSizes[0], where).toBe(plan.teamSizes[1]);
        expect(plan.teamSizes[0], where).toBeLessThanOrEqual(teamSize);
        expect(plan.teamSize, where).toBeLessThanOrEqual(MAX_BOT_TEAM_SIZE);

        // Bots only ever make up a shortfall — never displace a human.
        for (const team of [0, 1] as const) {
          expect(plan.bots[team], where).toBeGreaterThanOrEqual(0);
          expect(plan.humans[team] + plan.bots[team], where).toBe(plan.teamSize);
        }
        expect(plan.totalBots + plan.humans[0] + plan.humans[1], where).toBe(plan.totalCars);
        // An odd roster is the best case a balance rule can do.
        expect(plan.balanced, where).toBe(true);
        expect(plan.playable, where).toBe(true);
      }
    }
  });

  it("matches the published BOT_FILL_MATRIX the lobby can render", () => {
    for (const row of BOT_FILL_MATRIX) {
      const plan = planBotFill({ humanCount: row.humanCount, teamSize: row.teamSize });
      expect(plan.bots, `${row.teamSize}v${row.teamSize} / ${row.humanCount}h`).toEqual(row.bots);
    }
    // 2 + 4 + 6 rows: every (teamSize, humanCount) the product can produce.
    expect(BOT_FILL_MATRIX.length).toBe(12);
  });
});

describe("planBotFill — `off` is a real answer, not a fallback", () => {
  it("yields zero bots for every input, including the 1-human case", () => {
    for (const teamSize of [1, 2, 3]) {
      for (let humanCount = 0; humanCount <= 6; humanCount += 1) {
        const plan = planBotFill({ humanCount, teamSize, policy: "off" });
        expect(plan.totalBots, `teamSize=${teamSize} humans=${humanCount}`).toBe(0);
        expect(plan.bots).toEqual([0, 0]);
      }
    }
  });

  it("reports why a botless roster is unplayable instead of inventing a bot", () => {
    const oneHuman = planBotFill({ humanCount: 1, teamSize: 1, policy: "off" });
    expect(oneHuman.playable).toBe(false);
    expect(oneHuman.refusal).toBe("bots-disabled");
    expect(oneHuman.totalCars).toBe(1);

    const empty = planBotFill({ humanCount: 0, policy: "off" });
    expect(empty.refusal).toBe("too-few-cars");

    // Two humans with bots off is a real 1v1 and stays playable.
    expect(planBotFill({ humanCount: 2, teamSize: 1, policy: "off" }).playable).toBe(true);
  });
});

describe("planBotFill — bounds", () => {
  it("clamps the team size so two of them always fit in the arena", () => {
    // MAX_CARS is 8, so a team can never exceed 4.
    expect(planBotFill({ humanCount: 2, teamSize: 99 }).teamSize).toBe(MAX_BOT_TEAM_SIZE);
    expect(planBotFill({ humanCount: 2, teamSize: 99 }).totalCars).toBe(2 * MAX_BOT_TEAM_SIZE);
    expect(botSeatsForTeamSize(0)).toBe(2);
    expect(botSeatsForTeamSize(3)).toBe(6);
  });

  it("reports overflow rather than dropping a human silently", () => {
    const plan = planBotFill({ humanCount: 7, teamSize: 2 });
    expect(plan.humans[0] + plan.humans[1]).toBe(4);
    expect(plan.overflow).toBe(3);
    expect(plan.summary).toContain("3 waiting for a car");
  });

  it("refuses a capacity that cannot hold two cars", () => {
    const plan = planBotFill({ humanCount: 4, teamSize: 1, capacity: 1 });
    expect(plan.playable).toBe(false);
    expect(plan.refusal).toBe("arena-too-small");
  });

  it("puts the odd human on the preferred team", () => {
    expect(planBotFill({ humanCount: 3, teamSize: 2, preferredTeam: 1 }).humans).toEqual([1, 2]);
    expect(planBotFill({ humanCount: 3, teamSize: 2, preferredTeam: 0 }).humans).toEqual([2, 1]);
  });

  it("is pure — no shared state between calls", () => {
    const first = planBotFill({ humanCount: 1, teamSize: 1 });
    planBotFill({ humanCount: 6, teamSize: 3 });
    const again = planBotFill({ humanCount: 1, teamSize: 1 });
    expect(again).toEqual(first);
    expect(DEFAULT_BOT_FILL_POLICY).toBe("fill-teams");
  });

  it("tolerates junk input without throwing", () => {
    const plan = planBotFill({ humanCount: Number.NaN, teamSize: Number.NaN });
    expect(plan.totalBots).toBe(2);
    expect(plan.totalCars).toBe(2);
  });
});
