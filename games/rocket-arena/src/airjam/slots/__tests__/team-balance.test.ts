import { describe, expect, it } from "vitest";

import { NATIVE_MAX_CARS } from "../donor-facts.js";
import { balanceTeamFor, otherTeam, planRoster, teamSizesOf } from "../team-balance.js";

/**
 * The product targets are 2, then 4, then 6 humans. Even counts must land as
 * N/2 vs N/2 with no bots; the odd 3-human case must become 2v2 with the
 * imbalance absorbed by a BOT, never by stranding a human.
 */
describe("planRoster — even rosters need no bots", () => {
  it("splits 2 / 4 / 6 humans evenly with zero bot seats", () => {
    for (const [humans, perTeam] of [
      [2, 1],
      [4, 2],
      [6, 3],
    ] as const) {
      const plan = planRoster({ playerIds: Array.from({ length: humans }, (_, i) => `p${i}`) });
      expect(plan.teamSizes).toEqual([perTeam, perTeam]);
      expect(plan.seats.every((seat) => seat.role === "human")).toBe(true);
      expect(plan.seats).toHaveLength(humans);
      expect(plan.dropped).toHaveLength(0);
    }
  });

  it("keeps every human and no duplicates when an id repeats", () => {
    // A reconnect re-sends the join; it must not consume a second car.
    const plan = planRoster({ playerIds: ["a", "b", "a", "c"] });
    const humans = plan.seats.filter((seat) => seat.role === "human");
    expect(humans.map((seat) => seat.playerId)).toEqual(["a", "b", "c"]);
    expect(plan.teamSizes).toEqual([2, 2]); // the odd side is padded by a bot
  });
});

describe("planRoster — the 3-human case becomes 2v2 with a bot", () => {
  it("fills the smaller team with a bot seat rather than unbalancing humans", () => {
    const plan = planRoster({ playerIds: ["a", "b", "c"] });

    expect(plan.seats).toHaveLength(4); // 3 humans + 1 bot
    expect(plan.teamSizes).toEqual([2, 2]);
    const bots = plan.seats.filter((seat) => seat.role === "bot");
    expect(bots).toHaveLength(1);
    expect(bots[0]!.playerId).toBeNull();
    // The bot takes the side that was short a car, so kickoff stays mirrored.
    const humanTeams = plan.seats.filter((s) => s.role === "human").map((s) => s.team);
    expect(humanTeams.filter((team) => team === 0)).toHaveLength(2);
    expect(bots[0]!.team).toBe(1);
    expect(plan.seats.every((seat) => seat.team === 0 || seat.team === 1)).toBe(true);
  });

  it("honours fillBots: false for a free-for-all roster", () => {
    const plan = planRoster({ playerIds: ["a", "b", "c"], fillBots: false });
    expect(plan.seats).toHaveLength(3);
    expect(plan.teamSizes).toEqual([2, 1]);
  });
});

describe("planRoster — explicit requests and capacity", () => {
  it("places a requested player on the team they asked for", () => {
    const plan = planRoster({
      playerIds: ["a", "b", "c"],
      requestedTeams: { a: 1, b: 1 },
    });
    const byId = new Map(plan.seats.map((seat) => [seat.playerId, seat]));
    expect(byId.get("a")!.team).toBe(1);
    expect(byId.get("b")!.team).toBe(1);
    // The imbalance is absorbed by bots so the arena still starts mirrored.
    expect(plan.teamSizes).toEqual([2, 2]);
  });

  it("drops seats past the sim's capacity instead of throwing", () => {
    const plan = planRoster({ playerIds: Array.from({ length: 10 }, (_, i) => `p${i}`) });
    expect(plan.seats).toHaveLength(NATIVE_MAX_CARS);
    expect(plan.dropped).toHaveLength(2);
    expect(plan.teamSizes).toEqual([4, 4]);
  });

  it("clamps a nonsense capacity to zero rather than going negative", () => {
    expect(planRoster({ playerIds: ["a"], capacity: -5 }).seats).toHaveLength(0);
    expect(planRoster({ playerIds: ["a"], capacity: Number.NaN }).seats).toHaveLength(0);
  });
});

describe("balanceTeamFor", () => {
  it("gives the joiner the strictly smaller team and breaks ties with preferred", () => {
    expect(balanceTeamFor([0, 0])).toBe(0);
    expect(balanceTeamFor([0, 0], 1)).toBe(1);
    expect(balanceTeamFor([0, 3])).toBe(0);
    expect(balanceTeamFor([3, 0])).toBe(1);
  });
});

describe("team helpers", () => {
  it("flips teams and counts them", () => {
    expect(otherTeam(0)).toBe(1);
    expect(otherTeam(1)).toBe(0);
    expect(teamSizesOf([0, 1, 0, 1, 1])).toEqual([2, 3]);
  });
});
