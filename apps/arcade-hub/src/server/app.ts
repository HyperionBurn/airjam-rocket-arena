/**
 * HTTP + WebSocket front for the hub.
 *
 *   REST        join a room, create one, games report ready / progress / result,
 *               leaderboards
 *   WebSocket   /ws?code=ABCD&role=host|player|public&token=...
 *               server pushes `{type:"state", state}` (a per-viewer snapshot) on
 *               every change; clients send `{type:"action", action}`.
 *
 * Auth is token based and deliberately simple: the host token, a phone's profile
 * token and a round's token are the only secrets, and each endpoint says which
 * one it wants. Games on other origins call the round endpoints, so those allow
 * any origin: the token, not the origin, is the credential.
 */
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { networkInterfaces } from "node:os";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { WebSocketServer, type WebSocket } from "ws";
import { z } from "zod";

import { Hub, HubError, type Credentials } from "../core/hub";
import { publicState, type Viewer } from "../core/view";

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json",
};

const STATUS: Record<HubError["code"], number> = {
  not_found: 404, forbidden: 403, bad_request: 400, conflict: 409, full: 409,
};

/* ------------------------------------------------------------- validation */

const joinBody = z.object({
  name: z.string().min(1).max(40),
  color: z.string().max(9).optional(),
  avatar: z.string().max(8).optional(),
  profileToken: z.string().max(64).optional(),
});

const createBody = z.object({ totalRounds: z.number().int().min(1).max(12).optional() });

const placement = z.object({
  playerId: z.string().max(64),
  rank: z.number().int().min(1).nullable(),
  score: z.number().finite().optional(),
  stats: z.record(z.string().max(24), z.number().finite()).optional(),
});

const resultBody = z.object({ placements: z.array(placement).max(16) });
const readyBody = z.object({ controllerUrl: z.string().max(600).nullable().optional() });
const progressBody = z.object({ scores: z.record(z.string().max(64), z.number().finite()) });

const actionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("vote"), gameId: z.string().max(64) }),
  z.object({ type: z.literal("startVoting") }),
  z.object({ type: z.literal("closeVoting") }),
  z.object({ type: z.literal("advance") }),
  z.object({ type: z.literal("cancelRound") }),
  z.object({ type: z.literal("finish") }),
  z.object({ type: z.literal("restart") }),
  z.object({ type: z.literal("leave") }),
  z.object({ type: z.literal("manualResult"), order: z.array(z.union([z.string().max(64), z.array(z.string().max(64)).max(16)])).max(16) }),
]);
export type ClientAction = z.infer<typeof actionSchema>;

/* ------------------------------------------------------------------ app */

export interface AppOptions {
  hub: Hub;
  /** Directory of the built web app. Omit in tests / dev (Vite serves it). */
  staticDir?: string;
  /** Requests per minute per IP for the write endpoints. */
  rateLimitPerMinute?: number;
}

export interface App {
  server: Server;
  hub: Hub;
  close(): Promise<void>;
}

interface Client {
  ws: WebSocket;
  code: string;
  viewer: Viewer;
  credentials: Credentials;
}

const readBody = (request: IncomingMessage, limit = 32 * 1024): Promise<unknown> =>
  new Promise((resolveBody, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    request.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > limit) {
        reject(new HubError("bad_request", "Body too large"));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      if (chunks.length === 0) return resolveBody({});
      try {
        resolveBody(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new HubError("bad_request", "Body is not valid JSON"));
      }
    });
    request.on("error", reject);
  });

const bearer = (request: IncomingMessage): string => {
  const header = request.headers.authorization ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
};

export const createApp = (options: AppOptions): App => {
  const { hub } = options;
  const staticDir = options.staticDir ? resolve(options.staticDir) : null;
  const limit = options.rateLimitPerMinute ?? 120;
  const buckets = new Map<string, { count: number; reset: number }>();
  const clients = new Set<Client>();
  const dirty = new Set<string>();

  /* ---- broadcasting: coalesce bursts of changes into one send per room ---- */
  const flush = (): void => {
    const codes = [...dirty];
    dirty.clear();
    for (const code of codes) {
      if (!hub.hasSession(code)) continue;
      for (const client of clients) {
        if (client.code !== code || client.ws.readyState !== client.ws.OPEN) continue;
        try {
          client.ws.send(JSON.stringify({ type: "state", state: publicState(hub, code, client.viewer) }));
        } catch (error) {
          console.error("[arcade-hub] broadcast failed", error);
        }
      }
    }
  };
  hub.on("change", (code: string) => {
    if (dirty.size === 0) queueMicrotask(flush);
    dirty.add(code);
  });
  hub.on("closed", (code: string) => {
    for (const client of clients) {
      if (client.code === code) client.ws.close(4000, "room closed");
    }
  });

  const limited = (request: IncomingMessage): boolean => {
    const ip = String(request.headers["x-forwarded-for"] ?? request.socket.remoteAddress ?? "?").split(",")[0]!.trim();
    const at = Date.now();
    const bucket = buckets.get(ip);
    if (!bucket || bucket.reset < at) {
      buckets.set(ip, { count: 1, reset: at + 60_000 });
      return false;
    }
    bucket.count += 1;
    return bucket.count > limit;
  };

  /* --------------------------------------------------------------- actions */

  const runAction = (code: string, credentials: Credentials, playerId: string | null, action: ClientAction): void => {
    switch (action.type) {
      case "vote":
        if (!playerId) throw new HubError("forbidden", "Join the room to vote");
        hub.vote(code, playerId, action.gameId);
        return;
      case "startVoting": return hub.startVoting(code, credentials);
      case "closeVoting": hub.closeVoting(code, credentials); return;
      case "advance": return hub.advance(code, credentials);
      case "cancelRound": return hub.cancelRound(code, credentials);
      case "finish": return hub.finish(code, credentials);
      case "restart": return hub.restart(code, credentials);
      case "leave":
        if (!playerId) throw new HubError("forbidden", "Join the room first");
        return hub.leave(code, playerId);
      case "manualResult": hub.submitManualResult(code, credentials, action.order); return;
    }
  };

  /* ----------------------------------------------------------------- REST */

  const json = (response: ServerResponse, status: number, body: unknown): void => {
    response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify(body));
  };

  const route = async (request: IncomingMessage, response: ServerResponse, url: URL): Promise<boolean> => {
    const { pathname } = url;
    if (!pathname.startsWith("/api/")) return false;
    const method = request.method ?? "GET";
    const match = (pattern: RegExp): RegExpMatchArray | null => pathname.match(pattern);

    if (method === "GET" && pathname === "/api/health") {
      json(response, 200, { ok: true });
      return true;
    }
    if (method === "GET" && pathname === "/api/info") {
      // Phones cannot reach "localhost": give the big screen this machine's LAN
      // addresses (and an explicit public URL when the hub is hosted) for the QR.
      const ips = Object.values(networkInterfaces())
        .flat()
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry) && entry!.family === "IPv4" && !entry!.internal)
        .map((entry) => entry.address);
      json(response, 200, { publicUrl: process.env.ARCADE_PUBLIC_URL ?? null, ips });
      return true;
    }
    if (method === "GET" && pathname === "/api/games") {
      json(response, 200, { games: hub.games });
      return true;
    }
    if (method === "GET" && pathname === "/api/leaderboard") {
      const gameId = url.searchParams.get("game") ?? undefined;
      json(response, 200, { rows: hub.leaderboard(gameId ? { gameId } : {}).slice(0, 100), games: hub.games });
      return true;
    }
    if (method === "POST" && limited(request)) throw new HubError("forbidden", "Slow down");

    if (method === "POST" && pathname === "/api/sessions") {
      const body = createBody.parse(await readBody(request));
      const { session, hostToken } = hub.createSession(body);
      json(response, 201, { code: session.code, hostToken });
      return true;
    }

    let m = match(/^\/api\/sessions\/([A-Za-z]{4})$/);
    if (method === "GET" && m) {
      const code = m[1]!.toUpperCase();
      if (!hub.hasSession(code)) throw new HubError("not_found", "No such room");
      const session = hub.session(code);
      json(response, 200, { code, phase: session.phase, players: session.players.length });
      return true;
    }

    m = match(/^\/api\/sessions\/([A-Za-z]{4})\/join$/);
    if (method === "POST" && m) {
      const body = joinBody.parse(await readBody(request));
      json(response, 200, hub.join(m[1]!, body));
      return true;
    }

    m = match(/^\/api\/sessions\/([A-Za-z]{4})\/actions$/);
    if (method === "POST" && m) {
      const code = m[1]!.toUpperCase();
      const action = actionSchema.parse(await readBody(request));
      const credentials: Credentials = {
        hostToken: String(request.headers["x-host-token"] ?? ""),
        playerToken: String(request.headers["x-player-token"] ?? ""),
      };
      const playerId = credentials.playerToken ? hub.authPlayer(code, credentials.playerToken) : null;
      runAction(code, credentials, playerId, action);
      json(response, 200, { ok: true });
      return true;
    }

    m = match(/^\/api\/rounds\/([a-f0-9]+)\/(ready|progress|result)$/);
    if (method === "POST" && m) {
      const roundToken = bearer(request);
      const body = await readBody(request);
      const roundId = m[1]!;
      if (m[2] === "ready") {
        hub.reportReady(roundId, roundToken, readyBody.parse(body).controllerUrl ?? null);
      } else if (m[2] === "progress") {
        hub.reportProgress(roundId, roundToken, progressBody.parse(body).scores);
      } else {
        hub.submitResult(roundId, roundToken, resultBody.parse(body).placements);
      }
      json(response, 200, { ok: true });
      return true;
    }

    json(response, 404, { error: "not_found", message: "No such endpoint" });
    return true;
  };

  /* --------------------------------------------------------------- static */

  const serveStatic = (request: IncomingMessage, response: ServerResponse, url: URL): void => {
    if (!staticDir) {
      json(response, 404, { error: "not_found", message: "No web build is being served" });
      return;
    }
    const relative = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, "");
    let file = join(staticDir, relative);
    // Stay inside the build directory whatever the path says.
    if (!file.startsWith(staticDir)) file = join(staticDir, "index.html");
    const isFile = (path: string): boolean => existsSync(path) && statSync(path).isFile();
    let served = file;
    if (!isFile(served)) served = join(staticDir, "index.html"); // SPA fallback
    if (!isFile(served)) {
      json(response, 404, { error: "not_found", message: "Web build missing" });
      return;
    }
    const immutable = /\/assets\//.test(served.replaceAll("\\", "/"));
    response.writeHead(200, {
      "content-type": MIME[extname(served)] ?? "application/octet-stream",
      "cache-control": immutable ? "public, max-age=31536000, immutable" : "no-cache",
    });
    response.end(request.method === "HEAD" ? undefined : readFileSync(served));
  };

  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://localhost");
    // Games call the round endpoints from their own origin.
    response.setHeader("access-control-allow-origin", "*");
    response.setHeader("access-control-allow-headers", "authorization, content-type, x-host-token, x-player-token");
    response.setHeader("access-control-allow-methods", "GET, POST, OPTIONS");
    if (request.method === "OPTIONS") {
      response.writeHead(204);
      response.end();
      return;
    }
    void (async () => {
      try {
        if (await route(request, response, url)) return;
        serveStatic(request, response, url);
      } catch (error) {
        if (error instanceof HubError) json(response, STATUS[error.code], { error: error.code, message: error.message });
        else if (error instanceof z.ZodError) json(response, 400, { error: "bad_request", message: error.issues[0]?.message ?? "Invalid request" });
        else {
          console.error("[arcade-hub] unhandled", error);
          json(response, 500, { error: "internal", message: "Something went wrong" });
        }
      }
    })();
  });

  /* ------------------------------------------------------------ websocket */

  const wss = new WebSocketServer({ noServer: true });
  const sockets = new Map<string, number>(); // `${code}:${playerId}` -> open sockets

  server.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url ?? "/", "http://localhost");
    if (url.pathname !== "/ws") {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(request, socket, head, (ws) => wss.emit("connection", ws, request, url));
  });

  wss.on("connection", (ws: WebSocket, _request: IncomingMessage, url: URL) => {
    const code = (url.searchParams.get("code") ?? "").toUpperCase();
    const role = url.searchParams.get("role") ?? "public";
    const secret = url.searchParams.get("token") ?? "";
    if (!hub.hasSession(code)) {
      ws.close(4004, "no such room");
      return;
    }
    const session = hub.session(code);

    let viewer: Viewer = { kind: "public" };
    let credentials: Credentials = {};
    let presenceKey: string | null = null;
    if (role === "host" && secret === session.hostToken) {
      viewer = { kind: "host" };
      credentials = { hostToken: secret };
    } else if (role === "player") {
      const playerId = hub.authPlayer(code, secret);
      if (!playerId) {
        ws.close(4003, "not in this room");
        return;
      }
      viewer = { kind: "player", playerId };
      credentials = { playerToken: secret };
      presenceKey = `${code}:${playerId}`;
      sockets.set(presenceKey, (sockets.get(presenceKey) ?? 0) + 1);
      hub.setConnected(code, playerId, true);
    } else if (role === "host") {
      ws.close(4003, "bad host token");
      return;
    }

    const client: Client = { ws, code, viewer, credentials };
    clients.add(client);
    ws.send(JSON.stringify({ type: "state", state: publicState(hub, code, viewer) }));

    // Keep half-open phones from lingering as "connected".
    let alive = true;
    ws.on("pong", () => {
      alive = true;
    });
    const heartbeat = setInterval(() => {
      if (!alive) {
        ws.terminate();
        return;
      }
      alive = false;
      ws.ping();
    }, 20_000);
    heartbeat.unref?.();

    ws.on("message", (raw) => {
      try {
        const message = JSON.parse(raw.toString()) as { type?: string; action?: unknown };
        if (message.type !== "action") return;
        const action = actionSchema.parse(message.action);
        const playerId = viewer.kind === "player" ? viewer.playerId : null;
        runAction(code, credentials, playerId, action);
      } catch (error) {
        const text = error instanceof HubError ? error.message : error instanceof z.ZodError ? "Invalid action" : "Failed";
        ws.send(JSON.stringify({ type: "error", message: text }));
      }
    });

    ws.on("close", () => {
      clearInterval(heartbeat);
      clients.delete(client);
      if (presenceKey && viewer.kind === "player") {
        const remaining = (sockets.get(presenceKey) ?? 1) - 1;
        if (remaining <= 0) {
          sockets.delete(presenceKey);
          if (hub.hasSession(code)) hub.setConnected(code, viewer.playerId, false);
        } else sockets.set(presenceKey, remaining);
      }
    });
  });

  return {
    server,
    hub,
    close: () =>
      new Promise((done) => {
        for (const client of clients) client.ws.terminate();
        wss.close();
        server.close(() => done());
        server.closeAllConnections?.();
      }),
  };
};
