import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import WebSocket from "ws";

import { DEFAULT_GAMES } from "../core/games";
import { Hub } from "../core/hub";
import { memoryStore } from "../core/store";
import type { PublicState } from "../core/view";
import { createApp, type App } from "./app";

let app: App;
let base = "";
let wsBase = "";

beforeEach(async () => {
  const hub = new Hub({ store: memoryStore(), games: DEFAULT_GAMES, voteGraceMs: 30, voteSeconds: 30, resultsSeconds: 30 });
  app = createApp({ hub, rateLimitPerMinute: 10_000 });
  await new Promise<void>((done) => app.server.listen(0, "127.0.0.1", done));
  const port = (app.server.address() as AddressInfo).port;
  base = `http://127.0.0.1:${port}`;
  wsBase = `ws://127.0.0.1:${port}`;
});

afterEach(async () => {
  await app.close();
});

const post = async (path: string, body: unknown, headers: Record<string, string> = {}) => {
  const response = await fetch(base + path, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
  return { status: response.status, body: (await response.json()) as Record<string, any> };
};

/** A WebSocket that records the latest state and lets a test wait for a condition. */
const connect = (query: string) =>
  new Promise<{ ws: WebSocket; latest: () => PublicState | null; until: (test: (s: PublicState) => boolean, ms?: number) => Promise<PublicState>; send: (action: object) => void; errors: string[] }>((resolve, reject) => {
    const ws = new WebSocket(`${wsBase}/ws?${query}`);
    let state: PublicState | null = null;
    const errors: string[] = [];
    const waiters: Array<() => void> = [];
    ws.on("message", (raw) => {
      const message = JSON.parse(raw.toString());
      if (message.type === "state") {
        state = message.state;
        waiters.splice(0).forEach((wake) => wake());
      } else if (message.type === "error") errors.push(message.message);
    });
    ws.on("error", reject);
    ws.on("open", () => {
      const until = async (test: (s: PublicState) => boolean, ms = 3000) => {
        const deadline = Date.now() + ms;
        while (Date.now() < deadline) {
          if (state && test(state)) return state;
          await new Promise<void>((wake) => {
            waiters.push(wake);
            setTimeout(wake, 50);
          });
        }
        throw new Error(`timed out; last phase=${state?.phase}`);
      };
      resolve({ ws, latest: () => state, until, send: (action) => ws.send(JSON.stringify({ type: "action", action })), errors });
    });
  });

describe("REST", () => {
  it("creates a room, lets people join, and reports basic room info", async () => {
    const created = await post("/api/sessions", {});
    expect(created.status).toBe(201);
    expect(created.body.code).toMatch(/^[A-Z]{4}$/);
    const joined = await post(`/api/sessions/${created.body.code}/join`, { name: "Ana" });
    expect(joined.status).toBe(200);
    expect(joined.body.profileToken).toBeTruthy();
    const info = await (await fetch(`${base}/api/sessions/${created.body.code}`)).json();
    expect(info).toMatchObject({ phase: "lobby", players: 1 });
    expect((await fetch(`${base}/api/sessions/ZZZZ`)).status).toBe(404);
  });

  it("validates input", async () => {
    const created = await post("/api/sessions", {});
    expect((await post(`/api/sessions/${created.body.code}/join`, { name: "" })).status).toBe(400);
    expect((await post("/api/sessions", { totalRounds: 99 })).status).toBe(400);
    const bad = await fetch(base + `/api/sessions/${created.body.code}/join`, { method: "POST", body: "{nope" });
    expect(bad.status).toBe(400);
  });

  it("serves the catalogue and an empty leaderboard", async () => {
    expect((await (await fetch(`${base}/api/games`)).json()).games).toHaveLength(DEFAULT_GAMES.length);
    expect((await (await fetch(`${base}/api/leaderboard`)).json()).rows).toEqual([]);
  });

  it("allows cross-origin calls (games run on their own origin)", async () => {
    const response = await fetch(`${base}/api/games`, { headers: { origin: "https://game.example" } });
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    const preflight = await fetch(`${base}/api/rounds/abc/result`, { method: "OPTIONS" });
    expect(preflight.status).toBe(204);
  });

  it("host-only actions need a credential", async () => {
    const created = await post("/api/sessions", {});
    await post(`/api/sessions/${created.body.code}/join`, { name: "Ana" });
    expect((await post(`/api/sessions/${created.body.code}/actions`, { type: "startVoting" })).status).toBe(403);
    const ok = await post(`/api/sessions/${created.body.code}/actions`, { type: "startVoting" }, { "x-host-token": created.body.hostToken });
    expect(ok.status).toBe(200);
  });
});

describe("a whole night over the wire", () => {
  it("host + phones: join, vote, game reports, standings, champion", async () => {
    const created = await post("/api/sessions", { totalRounds: 1 });
    const { code, hostToken } = created.body as { code: string; hostToken: string };

    const ana = (await post(`/api/sessions/${code}/join`, { name: "Ana" })).body as { playerId: string; profileToken: string };
    const bo = (await post(`/api/sessions/${code}/join`, { name: "Bo" })).body as { playerId: string; profileToken: string };

    const host = await connect(`code=${code}&role=host&token=${hostToken}`);
    const phoneA = await connect(`code=${code}&role=player&token=${ana.profileToken}`);
    const phoneB = await connect(`code=${code}&role=player&token=${bo.profileToken}`);
    await host.until((s) => s.players.length === 2 && s.players.every((p) => p.connected));

    // The leader's phone starts the vote; phones vote; the round launches.
    phoneA.send({ type: "startVoting" });
    await host.until((s) => s.phase === "voting");
    phoneA.send({ type: "vote", gameId: "rocket-arena" });
    phoneB.send({ type: "vote", gameId: "rocket-arena" });
    const playing = await host.until((s) => s.phase === "playing");
    expect(playing.round!.gameId).toBe("rocket-arena");
    expect(playing.host!.roundToken).toBeTruthy();

    // Only the host sees the round token.
    expect(JSON.stringify(phoneA.latest())).not.toContain(playing.host!.roundToken!);

    // The game reports ready, then the result, with the round token.
    const roundId = playing.round!.id;
    const auth = { authorization: `Bearer ${playing.host!.roundToken}` };
    expect((await post(`/api/rounds/${roundId}/ready`, { controllerUrl: "https://g.example/c?id={playerId}" }, auth)).status).toBe(200);
    const ready = await phoneA.until((s) => s.round?.controllerUrl !== null && s.round?.controllerUrl !== undefined);
    expect(ready.round!.controllerUrl).toBe(`https://g.example/c?id=${ana.playerId}`);

    expect((await post(`/api/rounds/${roundId}/result`, { placements: [] }, { authorization: "Bearer nope" })).status).toBe(403);
    const done = await post(`/api/rounds/${roundId}/result`, {
      placements: [{ playerId: bo.playerId, rank: 1, score: 3 }, { playerId: ana.playerId, rank: 2, score: 1 }],
    }, auth);
    expect(done.status).toBe(200);

    const results = await host.until((s) => s.phase === "results");
    expect(results.standings[0]!.playerId).toBe(bo.playerId);
    expect(results.round!.result!.points[bo.playerId]).toBe(11); // a one-round night has no finale multiplier
  });

  it("the host can finish a night and the champion is crowned", async () => {
    const created = await post("/api/sessions", { totalRounds: 3 });
    const { code, hostToken } = created.body as { code: string; hostToken: string };
    const ana = (await post(`/api/sessions/${code}/join`, { name: "Ana" })).body as { playerId: string; profileToken: string };
    const host = await connect(`code=${code}&role=host&token=${hostToken}`);
    await host.until((s) => s.players.length === 1);
    host.send({ type: "startVoting" });
    await host.until((s) => s.phase === "voting");
    host.send({ type: "closeVoting" });
    await host.until((s) => s.phase === "playing");
    host.send({ type: "manualResult", order: [ana.playerId] });
    await host.until((s) => s.phase === "results");
    host.send({ type: "finish" });
    const finished = await host.until((s) => s.phase === "finished");
    expect(finished.champions).toEqual([ana.playerId]);
  });

  it("rejects bad credentials on the socket and reports action errors", async () => {
    const created = await post("/api/sessions", {});
    const { code } = created.body as { code: string };
    const bad = new WebSocket(`${wsBase}/ws?code=${code}&role=host&token=wrong`);
    const closed = await new Promise<number>((resolve) => bad.on("close", (c) => resolve(c)));
    expect(closed).toBe(4003);
    const missing = new WebSocket(`${wsBase}/ws?code=ZZZZ&role=public`);
    expect(await new Promise<number>((resolve) => missing.on("close", (c) => resolve(c)))).toBe(4004);

    const pub = await connect(`code=${code}&role=public`);
    pub.send({ type: "startVoting" });
    await new Promise((r) => setTimeout(r, 100));
    expect(pub.errors.length).toBeGreaterThan(0);
  });

  it("marks a phone disconnected when its socket closes, and back when it returns", async () => {
    const created = await post("/api/sessions", {});
    const { code, hostToken } = created.body as { code: string; hostToken: string };
    const ana = (await post(`/api/sessions/${code}/join`, { name: "Ana" })).body as { profileToken: string };
    const host = await connect(`code=${code}&role=host&token=${hostToken}`);
    const phone = await connect(`code=${code}&role=player&token=${ana.profileToken}`);
    await host.until((s) => s.players[0]?.connected === true);
    phone.ws.close();
    await host.until((s) => s.players[0]?.connected === false);
    const again = await connect(`code=${code}&role=player&token=${ana.profileToken}`);
    await host.until((s) => s.players[0]?.connected === true);
    expect(again.latest()!.you!.isLeader).toBe(true);
  });
});
