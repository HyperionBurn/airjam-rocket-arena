/**
 * The two small pure pieces that talk to phones: the live-readout codec and the
 * "which phone buzzes for what" planner.
 */
import { describe, expect, it } from "vitest";

import { decodeDownlink, encodeDownlink } from "@/host/downlink";
import { HIT_HAPTIC_INTERVAL_MS, createHapticPlanner, type SeatMap } from "@/host/haptics";

describe("downlink codec", () => {
  it("carries the player's team when the host sends it (old payloads stay valid)", () => {
    const decoded = decodeDownlink(encodeDownlink({ a: { boost: 10, airborne: false, demolished: false, team: 1 } }));
    expect(decoded?.seats.a?.team).toBe(1);
    expect(decodeDownlink('{"v":1,"s":{"b":[5,0,0]}}')?.seats.b?.team).toBeUndefined();
  });

  it("round-trips a readout per phone", () => {
    const raw = encodeDownlink({
      "pad-1": { boost: 84, airborne: false, demolished: false },
      "pad-2": { boost: 12.4, airborne: true, demolished: true },
    });
    expect(decodeDownlink(raw)).toEqual({
      seats: {
        "pad-1": { boost: 84, airborne: false, demolished: false },
        "pad-2": { boost: 12, airborne: true, demolished: true },
      },
    });
  });

  it("is compact enough to broadcast several times a second to six phones", () => {
    const seats = Object.fromEntries(
      Array.from({ length: 6 }, (_, i) => [`controller-${i}`, { boost: 100, airborne: true, demolished: false }]),
    );
    expect(encodeDownlink(seats).length).toBeLessThan(260);
  });

  it("clamps nonsense boost values instead of passing them on", () => {
    const decoded = decodeDownlink(
      encodeDownlink({ a: { boost: Number.NaN, airborne: false, demolished: false }, b: { boost: 900, airborne: false, demolished: false } }),
    );
    expect(decoded?.seats.a?.boost).toBe(0);
    expect(decoded?.seats.b?.boost).toBe(100);
  });

  it("never throws on a garbled, foreign or empty message", () => {
    for (const raw of [undefined, null, "", "not json", "[]", "null", '{"v":2,"s":{}}', '{"v":1}', '{"v":1,"s":5}']) {
      expect(decodeDownlink(raw as string | undefined)).toBeNull();
    }
    // A bad entry is skipped, the good one survives.
    expect(decodeDownlink('{"v":1,"s":{"x":"bad","y":[50,1,0]}}')?.seats).toEqual({
      y: { boost: 50, airborne: true, demolished: false },
    });
  });

  it("an absent key means 'no car' (a spectator)", () => {
    const decoded = decodeDownlink(encodeDownlink({ "pad-1": { boost: 50, airborne: false, demolished: false } }));
    expect(decoded?.seats["pad-9"]).toBeUndefined();
  });
});

const seats: SeatMap = {
  players: ["a", "b", null, "d"],
  teams: [0, 1, 0, 1],
};

describe("haptics planner", () => {
  it("buzzes only the player who touched the ball, harder for a hard hit", () => {
    const planner = createHapticPlanner(() => seats);
    expect(planner.plan({ type: "hit", car: 0, speed: 600 }, 0)).toEqual([{ playerId: "a", pattern: "light" }]);
    expect(planner.plan({ type: "hit", car: 1, speed: 2400 }, 0)).toEqual([{ playerId: "b", pattern: "medium" }]);
    // A bot's touch is nobody's buzz.
    expect(planner.plan({ type: "hit", car: 2, speed: 2400 }, 0)).toEqual([]);
  });

  it("rate-limits ball touches per phone, not across phones", () => {
    const planner = createHapticPlanner(() => seats);
    expect(planner.plan({ type: "hit", car: 0, speed: 100 }, 1000)).toHaveLength(1);
    expect(planner.plan({ type: "hit", car: 0, speed: 100 }, 1000 + HIT_HAPTIC_INTERVAL_MS - 1)).toEqual([]);
    expect(planner.plan({ type: "hit", car: 1, speed: 100 }, 1000 + 5)).toHaveLength(1);
    expect(planner.plan({ type: "hit", car: 0, speed: 100 }, 1000 + HIT_HAPTIC_INTERVAL_MS)).toHaveLength(1);
  });

  it("a goal: heavy for the scorer, success for their team, failure for the other", () => {
    const planner = createHapticPlanner(() => seats);
    const commands = planner.plan({ type: "goal", team: 0, scorer: 0 }, 0);
    expect(commands).toEqual([
      { playerId: "a", pattern: "heavy" },
      { playerId: "b", pattern: "failure" },
      { playerId: "d", pattern: "failure" },
    ]);
    const conceded = planner.plan({ type: "goal", team: 1, scorer: 1 }, 0);
    expect(conceded.find((c) => c.playerId === "a")?.pattern).toBe("failure");
    expect(conceded.find((c) => c.playerId === "d")?.pattern).toBe("success");
  });

  it("demolitions hit the demolished player only; the final whistle splits winners and losers", () => {
    const planner = createHapticPlanner(() => seats);
    expect(planner.plan({ type: "demolished", car: 3 }, 0)).toEqual([{ playerId: "d", pattern: "failure" }]);
    expect(planner.plan({ type: "demolished", car: 2 }, 0)).toEqual([]);
    const ended = planner.plan({ type: "phase", phase: "ended", countdown: 0, winner: 1 }, 0);
    expect(ended.find((c) => c.playerId === "b")?.pattern).toBe("success");
    expect(ended.find((c) => c.playerId === "a")?.pattern).toBe("light");
    // No other phase buzzes by itself.
    expect(planner.plan({ type: "phase", phase: "kickoff", countdown: 3, winner: null }, 0)).toEqual([]);
  });

  it("'go' reaches every seated human and no bot", () => {
    const planner = createHapticPlanner(() => seats);
    expect(planner.go().map((c) => c.playerId)).toEqual(["a", "b", "d"]);
  });

  it("reads the seating live, so a late joiner is buzzed from the moment they sit", () => {
    const live: { players: (string | null)[]; teams: (0 | 1)[] } = { players: ["a", null], teams: [0, 1] };
    const planner = createHapticPlanner(() => live);
    expect(planner.plan({ type: "hit", car: 1, speed: 100 }, 0)).toEqual([]);
    live.players[1] = "late";
    expect(planner.plan({ type: "hit", car: 1, speed: 100 }, 0)).toEqual([{ playerId: "late", pattern: "light" }]);
  });
});
