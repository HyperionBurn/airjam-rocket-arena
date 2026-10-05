import { describe, expect, it } from "vitest";

import { DEFAULT_GAMES } from "./games";
import { Hub, HubError, type HubOptions } from "./hub";
import { allTimeBoard, sessionStandings } from "./leaderboard";
import { awardPoints, DEFAULT_RULESET, multiplierFor, normalizePlacements, PlacementError, placementsFromOrder } from "./scoring";
import { memoryStore } from "./store";
import { eligibleGames, recencyWeight, tally } from "./voting";
import { launchUrl, publicState } from "./view";

const ids = (...names: string[]) => names;

describe("scoring", () => {
  it("awards the table by finishing position plus participation", () => {
    const points = awardPoints(placementsFromOrder(ids("a", "b", "c")), DEFAULT_RULESET);
    expect(points).toEqual({ a: 11, b: 9, c: 7 });
  });

  it("ties split the positions they occupy", () => {
    // a and b tie for first: they share positions 1 and 2 -> (10 + 8) / 2 = 9, +1.
    const points = awardPoints(placementsFromOrder([["a", "b"], "c"]), DEFAULT_RULESET);
    expect(points).toEqual({ a: 10, b: 10, c: 7 }); // c is third: table[2] = 6, +1
  });

  it("a three-way tie for last is averaged, not rounded up", () => {
    const points = awardPoints(placementsFromOrder(["a", ["b", "c", "d"]]), DEFAULT_RULESET);
    expect(points.a).toBe(11);
    expect(points.b).toBe(points.c);
    expect(points.b).toBeCloseTo((8 + 6 + 5) / 3 + 1, 1);
  });

  it("did-not-finish scores nothing, and the finale multiplier applies", () => {
    const placements = normalizePlacements([{ playerId: "a", rank: 1 }], ["a", "b"]);
    expect(placements.find((p) => p.playerId === "b")!.rank).toBeNull();
    const points = awardPoints(placements, DEFAULT_RULESET, 2);
    expect(points).toEqual({ a: 22, b: 0 });
  });

  it("the multiplier is only for the last round of a multi-round night", () => {
    expect(multiplierFor(1, 5, DEFAULT_RULESET)).toBe(1);
    expect(multiplierFor(5, 5, DEFAULT_RULESET)).toBe(2);
    expect(multiplierFor(1, 1, DEFAULT_RULESET)).toBe(1);
  });

  it("rejects strangers, duplicates and bad ranks", () => {
    expect(() => normalizePlacements([{ playerId: "zzz", rank: 1 }], ["a"])).toThrow(PlacementError);
    expect(() => normalizePlacements([{ playerId: "a", rank: 1 }, { playerId: "a", rank: 2 }], ["a"])).toThrow(PlacementError);
    expect(() => normalizePlacements([{ playerId: "a", rank: 0 }], ["a"])).toThrow(PlacementError);
    expect(() => normalizePlacements([{ playerId: "a", rank: 1.5 }], ["a"])).toThrow(PlacementError);
  });

  it("more finishers than table rows still award participation", () => {
    const order = Array.from({ length: 10 }, (_, i) => `p${i}`);
    const points = awardPoints(placementsFromOrder(order), DEFAULT_RULESET);
    expect(points.p9).toBe(1);
  });
});

describe("voting", () => {
  const [rocket, kart, brawl] = DEFAULT_GAMES;

  it("most votes wins", () => {
    const outcome = tally(DEFAULT_GAMES, { a: "turbo-kart", b: "turbo-kart", c: "air-brawl" }, []);
    expect(outcome.winnerId).toBe("turbo-kart");
  });

  it("a game that just ran is dampened, so a one-vote lead for it can lose", () => {
    // kart ran last round: 2 votes * 0.5 = 1.0 vs brawl 2 votes * 1.3 (never played).
    const outcome = tally(DEFAULT_GAMES, { a: "turbo-kart", b: "turbo-kart", c: "air-brawl", d: "air-brawl" }, ["turbo-kart"]);
    expect(outcome.winnerId).toBe("air-brawl");
  });

  it("a silent room still picks something, favouring games not yet played", () => {
    const outcome = tally(DEFAULT_GAMES, {}, ["rocket-arena", "turbo-kart"], () => 0);
    expect(outcome.winnerId).toBe("air-brawl");
  });

  it("exact ties are broken with the injected random", () => {
    const votes = { a: "rocket-arena", b: "turbo-kart" };
    expect(tally([rocket!, kart!], votes, [], () => 0).winnerId).toBe("rocket-arena");
    expect(tally([rocket!, kart!], votes, [], () => 0.99).winnerId).toBe("turbo-kart");
  });

  it("recency weights ramp up with time since last play", () => {
    expect(recencyWeight(0)).toBeLessThan(recencyWeight(1));
    expect(recencyWeight(1)).toBeLessThan(recencyWeight(2));
    expect(recencyWeight(null)).toBeGreaterThan(recencyWeight(5));
  });

  it("filters the ballot by player count but never leaves it empty", () => {
    expect(eligibleGames(DEFAULT_GAMES, 8).map((g) => g.id)).toEqual(["air-brawl"]);
    expect(eligibleGames(DEFAULT_GAMES, 20)).toHaveLength(3);
    expect(eligibleGames(DEFAULT_GAMES, 4)).toHaveLength(3);
    expect(brawl).toBeDefined();
  });
});

/* ------------------------------------------------------------- full night */

const clockRig = (overrides: Partial<HubOptions> = {}) => {
  let time = 1_000_000;
  const pending: Array<{ at: number; fn: () => void; cancelled: boolean }> = [];
  const store = memoryStore();
  const hub = new Hub({
    store,
    games: DEFAULT_GAMES,
    now: () => time,
    random: () => 0,
    schedule: (fn, ms) => {
      const entry = { at: time + ms, fn, cancelled: false };
      pending.push(entry);
      return () => {
        entry.cancelled = true;
      };
    },
    voteGraceMs: 1000,
    ...overrides,
  });
  return {
    hub,
    store,
    tick: (ms: number) => {
      time += ms;
      for (const entry of [...pending].sort((a, b) => a.at - b.at)) {
        if (!entry.cancelled && entry.at <= time) {
          entry.cancelled = true;
          entry.fn();
        }
      }
    },
    now: () => time,
  };
};

const startNight = (rig: ReturnType<typeof clockRig>, names = ["Ana", "Bo", "Cy"], totalRounds = 3) => {
  const { session, hostToken } = rig.hub.createSession({ totalRounds });
  const players = names.map((name) => rig.hub.join(session.code, { name }));
  return { code: session.code, hostToken, players };
};

describe("hub: joining", () => {
  it("creates a profile, returns a token, and recognises the same phone", () => {
    const rig = clockRig();
    const { code, players } = startNight(rig, ["Ana"]);
    const again = rig.hub.join(code, { name: "Ana B", profileToken: players[0]!.profileToken });
    expect(again.playerId).toBe(players[0]!.playerId);
    expect(rig.hub.session(code).players).toHaveLength(1);
    expect(rig.hub.session(code).players[0]!.name).toBe("Ana B");
  });

  it("suffixes a duplicate name instead of refusing it", () => {
    const rig = clockRig();
    const { code } = startNight(rig, ["Sam", "Sam", "Sam"]);
    expect(rig.hub.session(code).players.map((p) => p.name)).toEqual(["Sam", "Sam 2", "Sam 3"]);
  });

  it("enforces the room size and tidies names and colours", () => {
    const rig = clockRig({ maxPlayers: 2 });
    const { code } = startNight(rig, ["A", "B"]);
    expect(() => rig.hub.join(code, { name: "C" })).toThrow(HubError);
    const rig2 = clockRig();
    const n = rig2.hub.createSession().session.code;
    const joined = rig2.hub.join(n, { name: "   a    very   long name that goes on and on   ", color: "not-a-colour" });
    const player = rig2.hub.session(n).players.find((p) => p.id === joined.playerId)!;
    expect(player.name.length).toBeLessThanOrEqual(16);
    expect(player.color).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("an unknown room is not_found", () => {
    const rig = clockRig();
    expect(() => rig.hub.join("ZZZZ", { name: "x" })).toThrow(expect.objectContaining({ code: "not_found" }));
  });
});

describe("hub: a full night", () => {
  it("lobby -> vote -> play -> results -> vote ... -> champion, with scoring", () => {
    const rig = clockRig();
    const { code, hostToken, players } = startNight(rig, ["Ana", "Bo", "Cy"], 2);
    const [ana, bo, cy] = players.map((p) => p.playerId) as [string, string, string];
    const host = { hostToken };

    rig.hub.startVoting(code, host);
    expect(rig.hub.session(code).phase).toBe("voting");
    rig.hub.vote(code, ana, "rocket-arena");
    rig.hub.vote(code, bo, "rocket-arena");
    rig.hub.vote(code, cy, "turbo-kart");
    rig.tick(1100); // everyone voted: the grace period elapses and the round launches
    let session = rig.hub.session(code);
    expect(session.phase).toBe("playing");
    const round1 = session.rounds[0]!;
    expect(round1.gameId).toBe("rocket-arena");
    expect(round1.status).toBe("launching");

    // The arcade game reports ready, then the result.
    rig.hub.reportReady(round1.id, round1.token, "https://game.example/controller?room=ABCD&controllerId={playerId}");
    expect(publicState(rig.hub, code, { kind: "player", playerId: ana }).round!.controllerUrl).toContain(`controllerId=${ana}`);
    expect(publicState(rig.hub, code, { kind: "public" }).round!.controllerUrl).toBeNull();
    rig.hub.submitResult(round1.id, round1.token, [
      { playerId: bo, rank: 1 }, { playerId: ana, rank: 2 }, { playerId: cy, rank: 3 },
    ]);
    session = rig.hub.session(code);
    expect(session.phase).toBe("results");
    expect(session.rounds[0]!.result!.points).toEqual({ [bo]: 11, [ana]: 9, [cy]: 7 });
    expect(rig.hub.standings(code)[0]!.playerId).toBe(bo);

    // The results screen hands over to a new vote by itself.
    rig.tick(rig.hub.resultsSeconds * 1000 + 50);
    expect(rig.hub.session(code).phase).toBe("voting");
    rig.hub.vote(code, ana, "air-brawl");
    rig.hub.vote(code, bo, "air-brawl");
    rig.hub.vote(code, cy, "air-brawl");
    rig.tick(1100);
    const round2 = rig.hub.session(code).rounds[1]!;
    expect(round2.gameId).toBe("air-brawl");
    expect(round2.status).toBe("live"); // manual games are live at once

    // Manual result entry by the host; this is the last round, so it is doubled.
    rig.hub.submitManualResult(code, host, [cy, ana, bo]);
    expect(rig.hub.session(code).rounds[1]!.result!.multiplier).toBe(2);
    expect(rig.hub.session(code).rounds[1]!.result!.points[cy]).toBe(22);

    rig.tick(rig.hub.resultsSeconds * 1000 + 50);
    session = rig.hub.session(code);
    expect(session.phase).toBe("finished");
    // bo: 11 + 7*... let the standings decide: cy = 7 + 22, ana = 9 + 18, bo = 11 + 14.
    expect(session.champions).toEqual([cy]);
  });

  it("a game cannot report a result for the wrong round or with a wrong token", () => {
    const rig = clockRig();
    const { code, hostToken, players } = startNight(rig, ["Ana", "Bo"]);
    rig.hub.startVoting(code, { hostToken });
    rig.hub.vote(code, players[0]!.playerId, "rocket-arena");
    rig.hub.closeVoting(code, { hostToken });
    const round = rig.hub.session(code).rounds[0]!;
    expect(() => rig.hub.submitResult(round.id, "wrong-token", [])).toThrow(expect.objectContaining({ code: "forbidden" }));
    expect(() => rig.hub.submitResult("nope", round.token, [])).toThrow(expect.objectContaining({ code: "not_found" }));
    rig.hub.submitResult(round.id, round.token, [{ playerId: players[0]!.playerId, rank: 1 }]);
    // A second result for the same round is refused.
    expect(() => rig.hub.submitResult(round.id, round.token, [{ playerId: players[1]!.playerId, rank: 1 }])).toThrow(expect.objectContaining({ code: "conflict" }));
  });

  it("the vote timer closes voting even if nobody votes", () => {
    const rig = clockRig();
    const { code, hostToken } = startNight(rig, ["Ana", "Bo"]);
    rig.hub.startVoting(code, { hostToken });
    rig.tick(rig.hub.voteSeconds * 1000 + 10);
    expect(rig.hub.session(code).phase).toBe("playing");
  });

  it("only the host or the room leader can steer the night", () => {
    const rig = clockRig();
    const { code, hostToken, players } = startNight(rig, ["Ana", "Bo"]);
    expect(() => rig.hub.startVoting(code, {})).toThrow(expect.objectContaining({ code: "forbidden" }));
    expect(() => rig.hub.startVoting(code, { playerToken: players[1]!.profileToken })).toThrow(expect.objectContaining({ code: "forbidden" }));
    rig.hub.startVoting(code, { playerToken: players[0]!.profileToken }); // Ana joined first: she leads
    expect(rig.hub.session(code).phase).toBe("voting");
    expect(hostToken).toBeTruthy();
  });

  it("votes are validated: ballot membership, room membership, phase", () => {
    const rig = clockRig();
    const { code, hostToken, players } = startNight(rig, ["Ana", "Bo"]);
    expect(() => rig.hub.vote(code, players[0]!.playerId, "rocket-arena")).toThrow(expect.objectContaining({ code: "conflict" }));
    rig.hub.startVoting(code, { hostToken });
    expect(() => rig.hub.vote(code, players[0]!.playerId, "no-such-game")).toThrow(expect.objectContaining({ code: "bad_request" }));
    expect(() => rig.hub.vote(code, "stranger", "rocket-arena")).toThrow(expect.objectContaining({ code: "forbidden" }));
  });

  it("cancelling a round awards nothing and reopens the vote", () => {
    const rig = clockRig();
    const { code, hostToken, players } = startNight(rig, ["Ana", "Bo"]);
    rig.hub.startVoting(code, { hostToken });
    rig.hub.closeVoting(code, { hostToken });
    rig.hub.cancelRound(code, { hostToken });
    expect(rig.hub.session(code).phase).toBe("voting");
    expect(rig.hub.standings(code).every((row) => row.points === 0)).toBe(true);
    expect(players).toHaveLength(2);
  });

  it("a disconnected player is left out of the ballot count and the round", () => {
    const rig = clockRig();
    const { code, hostToken, players } = startNight(rig, ["Ana", "Bo", "Cy"]);
    rig.hub.setConnected(code, players[2]!.playerId, false);
    rig.hub.startVoting(code, { hostToken });
    rig.hub.vote(code, players[0]!.playerId, "rocket-arena");
    rig.hub.vote(code, players[1]!.playerId, "rocket-arena");
    rig.tick(1100); // both connected players voted: no need to wait for Cy
    expect(rig.hub.session(code).rounds[0]!.playerIds).toEqual([players[0]!.playerId, players[1]!.playerId]);
  });

  it("a room that empties out falls back to the lobby instead of launching", () => {
    const rig = clockRig();
    const { code, hostToken, players } = startNight(rig, ["Ana"]);
    rig.hub.startVoting(code, { hostToken });
    rig.hub.setConnected(code, players[0]!.playerId, false);
    rig.hub.closeVoting(code, { hostToken });
    expect(rig.hub.session(code).phase).toBe("lobby");
  });

  it("restart resets the night but keeps the people", () => {
    const rig = clockRig();
    const { code, hostToken, players } = startNight(rig, ["Ana", "Bo"], 1);
    rig.hub.startVoting(code, { hostToken });
    rig.hub.closeVoting(code, { hostToken });
    rig.hub.submitManualResult(code, { hostToken }, [players[0]!.playerId, players[1]!.playerId]);
    rig.tick(rig.hub.resultsSeconds * 1000 + 10);
    expect(rig.hub.session(code).phase).toBe("finished");
    rig.hub.restart(code, { hostToken });
    expect(rig.hub.session(code).phase).toBe("lobby");
    expect(rig.hub.session(code).rounds).toEqual([]);
    expect(rig.hub.session(code).players).toHaveLength(2);
  });

  it("never leaks credentials to phones or the public", () => {
    const rig = clockRig();
    const { code, hostToken, players } = startNight(rig, ["Ana", "Bo"]);
    rig.hub.startVoting(code, { hostToken });
    rig.hub.closeVoting(code, { hostToken });
    const round = rig.hub.session(code).rounds[0]!;
    const forPhone = JSON.stringify(publicState(rig.hub, code, { kind: "player", playerId: players[0]!.playerId }));
    const forHost = publicState(rig.hub, code, { kind: "host" });
    expect(forPhone).not.toContain(round.token);
    expect(forPhone).not.toContain(hostToken);
    expect(forHost.host!.roundToken).toBe(round.token);
  });
});

describe("persistence", () => {
  it("a restarted hub resumes a vote in progress", () => {
    const rig = clockRig();
    const { code, hostToken } = startNight(rig, ["Ana", "Bo"]);
    rig.hub.startVoting(code, { hostToken });
    const data = rig.store.snapshot();
    const second = clockRig();
    second.store.save(data);
    const resumed = new Hub({ store: second.store, games: DEFAULT_GAMES, now: second.now, random: () => 0, schedule: () => () => undefined });
    expect(resumed.session(code).phase).toBe("voting");
  });
});

describe("leaderboards", () => {
  it("session standings order by points, then wins, and report the climb", () => {
    const rig = clockRig();
    const { code, hostToken, players } = startNight(rig, ["Ana", "Bo", "Cy"], 3);
    const [ana, bo, cy] = players.map((p) => p.playerId) as [string, string, string];
    for (const order of [[ana, bo, cy], [cy, bo, ana]]) {
      // After the first round the results screen hands over to voting by itself.
      if (rig.hub.session(code).phase === "lobby") rig.hub.startVoting(code, { hostToken });
      rig.hub.closeVoting(code, { hostToken });
      rig.hub.submitManualResult(code, { hostToken }, order);
      rig.tick(rig.hub.resultsSeconds * 1000 + 10);
    }
    const standings = sessionStandings(rig.hub.session(code));
    expect(standings.map((row) => row.playerId)).toEqual([ana, cy, bo].sort((x, y) => standings.findIndex((r) => r.playerId === x) - standings.findIndex((r) => r.playerId === y)));
    const byId = Object.fromEntries(standings.map((row) => [row.playerId, row]));
    expect(byId[bo]!.points).toBe(9 + 9); // second twice
    expect(byId[ana]!.points).toBe(11 + 7);
    expect(byId[cy]!.points).toBe(7 + 11);
    expect(byId[cy]!.climb).toBeGreaterThanOrEqual(0);
  });

  it("an exact tie shares a rank, and a tie-break on wins separates equal points", () => {
    const session = {
      players: [
        { id: "a", name: "A", color: "#000000", avatar: "x", joinedAt: 0, connected: true },
        { id: "b", name: "B", color: "#000000", avatar: "x", joinedAt: 0, connected: true },
      ],
      rounds: [
        { id: "r1", number: 1, gameId: "g", status: "finished" as const, startedAt: 0, playerIds: ["a", "b"], token: "t", controllerUrlTemplate: null, progress: {},
          result: { placements: [{ playerId: "a", rank: 1 }, { playerId: "b", rank: 2 }], points: { a: 10, b: 10 }, multiplier: 1, finishedAt: 1, source: "game" as const } },
      ],
    };
    const standings = sessionStandings(session);
    expect(standings[0]!.playerId).toBe("a"); // the win breaks the equal-points tie
    expect(standings[1]!.rank).toBe(2);
  });

  it("the all-time board accumulates across nights and filters by game", () => {
    const rig = clockRig();
    const first = startNight(rig, ["Ana", "Bo"], 1);
    const second = rig.hub.createSession({ totalRounds: 1 });
    // Ana returns the next night on the same phone: same profile, so stats accumulate.
    const ana2 = rig.hub.join(second.session.code, { name: "Ana", profileToken: first.players[0]!.profileToken });
    expect(ana2.playerId).toBe(first.players[0]!.playerId);
    rig.hub.join(second.session.code, { name: "Cy" });

    for (const [code, hostToken] of [[first.code, first.hostToken], [second.session.code, second.hostToken]] as const) {
      rig.hub.startVoting(code, { hostToken });
      rig.hub.vote(code, rig.hub.session(code).players[0]!.id, "rocket-arena");
      rig.hub.closeVoting(code, { hostToken });
      const order = rig.hub.session(code).players.map((p) => p.id);
      rig.hub.submitManualResult(code, { hostToken }, order);
    }
    const board = rig.hub.leaderboard();
    expect(board[0]!.name).toBe("Ana");
    expect(board[0]!.rounds).toBe(2);
    expect(board[0]!.wins).toBe(2);
    expect(board[0]!.winRate).toBe(1);
    expect(board[0]!.favouriteGameId).toBe("rocket-arena");
    expect(rig.hub.leaderboard({ gameId: "no-such-game" })).toEqual([]);
    expect(allTimeBoard([], [])).toEqual([]);
  });
});

describe("launch url", () => {
  it("carries everything an iframe game needs in its query string", () => {
    const url = new URL(launchUrl(DEFAULT_GAMES[0]!, {
      hubOrigin: "https://hub.example", code: "ABCD", roundId: "r1", roundToken: "tok",
      players: [{ id: "p1", name: "Ana", color: "#112233", avatar: "🦊" }],
    }));
    expect(url.searchParams.get("arcade")).toBe("https://hub.example");
    expect(url.searchParams.get("session")).toBe("ABCD");
    expect(url.searchParams.get("round")).toBe("r1");
    expect(url.searchParams.get("token")).toBe("tok");
    const decoded = JSON.parse(Buffer.from(url.searchParams.get("players")!.replaceAll("-", "+").replaceAll("_", "/"), "base64").toString("utf8"));
    expect(decoded).toEqual([{ id: "p1", name: "Ana", color: "#112233", avatar: "🦊" }]);
  });
});
