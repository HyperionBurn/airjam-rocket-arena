/**
 * Process entry: `node dist/server/main.js` in production, `tsx src/server/main.ts`
 * in development.
 *
 *   PORT          listen port (default 8787)
 *   DATA_DIR      where hub.json is kept (default ./data)
 *   STATIC_DIR    built web app (default ./dist/web when it exists)
 *   ARCADE_GAMES_JSON  override the game catalogue (inline JSON)
 *   ARCADE_GAMES_FILE  ...or a path to a JSON file (see `pnpm run games:local`)
 *   ARCADE_ROUNDS      rounds per night (default 5)
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { loadGames } from "../core/games";
import type { GameDef } from "../core/types";
import { Hub } from "../core/hub";
import { fileStore } from "../core/store";
import { createApp } from "./app";

const here = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT ?? 8787);
const dataDir = resolve(process.env.DATA_DIR ?? "data");
const candidates = [process.env.STATIC_DIR, join(here, "..", "web"), resolve("dist/web")].filter((p): p is string => Boolean(p));
const staticDir = candidates.find((dir) => existsSync(join(dir, "index.html")));

/** A catalogue file written by `games:local`. A bad file stops the hub at start-up, loudly, rather than serving the wrong games. */
function readGamesFile(path: string): GameDef[] {
  const parsed: unknown = JSON.parse(readFileSync(resolve(path), "utf8"));
  if (!Array.isArray(parsed) || parsed.length === 0 || !parsed.every((g) => g && typeof g.id === "string" && typeof g.hostUrl === "string")) {
    throw new Error(`ARCADE_GAMES_FILE ${path} must be a non-empty JSON array of games with id and hostUrl`);
  }
  return parsed as GameDef[];
}

const store = fileStore(join(dataDir, "hub.json"));
const hub = new Hub({
  store,
  games: process.env.ARCADE_GAMES_FILE ? readGamesFile(process.env.ARCADE_GAMES_FILE) : loadGames(),
  defaultRounds: Number(process.env.ARCADE_ROUNDS ?? 5),
});
const app = createApp({ hub, staticDir });

app.server.listen(port, "0.0.0.0", () => {
  console.log(`[arcade-hub] listening on :${port}${staticDir ? ` (serving ${staticDir})` : " (API only)"}`);
});

// Forget rooms nobody has touched for half a day.
setInterval(() => hub.sweep(), 30 * 60 * 1000).unref();

const shutdown = (): void => {
  store.flush();
  void app.close().then(() => process.exit(0));
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
