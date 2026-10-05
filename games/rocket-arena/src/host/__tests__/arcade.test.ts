import { describe, expect, it } from "vitest";

import { controllerTemplate, decodePlayers, placementsFor, progressFor, readArcadeLaunch, shouldStart, teamSizeFor } from "@/host/arcade";

const encode = (value: unknown): string =>
  Buffer.from(JSON.stringify(value), "utf8").toString("base64").replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");

describe("arcade launch", () => {
  const players = [
    { id: "abc123", name: "Ana", color: "#fff", avatar: "" },
    { id: "def456", name: "Zoë ✓", color: "#000", avatar: "" },
  ];
  const search = `?arcade=https%3A%2F%2Fhub.example%2F&session=ABCD&round=r1&token=t0k&players=${encode(players)}&seconds=300`;

  it("reads the hub's launch parameters", () => {
    const launch = readArcadeLaunch(search)!;
    expect(launch.origin).toBe("https://hub.example");
    expect(launch.round).toBe("r1");
    expect(launch.token).toBe("t0k");
    expect(launch.seconds).toBe(300);
    expect(launch.players.map((p) => p.name)).toEqual(["Ana", "Zoë ✓"]);
  });

  it("is null when the game is opened on its own, or the origin is not http(s)", () => {
    expect(readArcadeLaunch("")).toBeNull();
    expect(readArcadeLaunch("?session=ABCD")).toBeNull();
    expect(readArcadeLaunch("?arcade=javascript%3Aalert(1)&session=A&round=r&token=t")).toBeNull();
  });

  it("survives malformed player lists", () => {
    expect(decodePlayers("not-base64!!")).toEqual([]);
    expect(decodePlayers(encode({ nope: true }))).toEqual([]);
    expect(decodePlayers(encode([{ name: "no id" }, { id: "xyz", name: "  " }]))).toEqual([{ id: "xyz", name: "Player", color: undefined }]);
  });
});

describe("phone url template", () => {
  it("keeps the hub's placeholders literal and joins the query correctly", () => {
    expect(controllerTemplate("https://g.example/controller?room=ABCD")).toBe("https://g.example/controller?room=ABCD&controllerId={playerId}&nickname={name}&arcade=1");
    expect(controllerTemplate("https://g.example/controller")).toBe("https://g.example/controller?controllerId={playerId}&nickname={name}&arcade=1");
  });
});

describe("start decision", () => {
  const base = { expected: ["a", "b"], elapsedMs: 0, settledMs: 0 };
  it("waits for everyone, then a moment to pick a car", () => {
    expect(shouldStart({ ...base, present: [], elapsedMs: 99_999 })).toBe(false);
    expect(shouldStart({ ...base, present: ["a", "b"], settledMs: 1000 })).toBe(false);
    expect(shouldStart({ ...base, present: ["a", "b"], settledMs: 4000 })).toBe(true);
  });
  it("goes without the stragglers once patience runs out", () => {
    expect(shouldStart({ ...base, present: ["a"], elapsedMs: 10_000 })).toBe(false);
    expect(shouldStart({ ...base, present: ["a"], elapsedMs: 46_000 })).toBe(true);
  });
  it("sizes teams from the roster", () => {
    expect([1, 2, 3, 4, 5, 6, 8].map(teamSizeFor)).toEqual([1, 1, 2, 2, 3, 3, 3]);
  });
});

describe("placements", () => {
  const expected = [{ id: "a", name: "A" }, { id: "b", name: "B" }, { id: "c", name: "C" }, { id: "ghost", name: "G" }];
  const teamOf = new Map<string, 0 | 1>([["a", 0], ["b", 0], ["c", 1]]);

  it("gives the winning team first place, the other second, and absentees nothing", () => {
    const result = placementsFor(expected, { teamOf, blue: 3, orange: 1 });
    expect(result.map((p) => [p.playerId, p.rank])).toEqual([["a", 1], ["b", 1], ["c", 2], ["ghost", null]]);
    expect(result[2]!.score).toBe(1);
    expect(result[0]!.stats).toEqual({ goals: 3, against: 1 });
  });

  it("shares first place in a draw", () => {
    const result = placementsFor(expected, { teamOf, blue: 2, orange: 2 });
    expect(result.filter((p) => p.rank === 1).map((p) => p.playerId)).toEqual(["a", "b", "c"]);
  });

  it("reports each present player's team score as progress", () => {
    expect(progressFor(expected, { teamOf, blue: 3, orange: 1 })).toEqual({ a: 3, b: 3, c: 1 });
  });
});
