/**
 * Writes data/games.local.json: the hub's catalogue with the games that run on this laptop
 * pointed at localhost, so the big screen reaches them without the internet.
 *
 * localhost, not the LAN address, on purpose: the Rocket Arena engine needs a secure context
 * (crypto.subtle) and a plain-http LAN address is not one. Phones never use these URLs; the hub
 * hands them each game's controller address and swaps localhost for the laptop's LAN address
 * (see `reachable` in src/web/api.ts).
 *
 *   pnpm --filter arcade-hub run games:local
 *   pnpm --filter arcade-hub run games:local -- --host my-laptop.local    # only if the big screen is another machine
 *   flags: --rocket-port 5173  --feud-port 4100  --no-rocket  --no-feud
 *
 * Start the hub with ARCADE_GAMES_FILE=data/games.local.json (see apps/arcade-hub/LOCAL-EVENT.md).
 * Games not marked local keep their hosted URLs.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { networkInterfaces } from "node:os";
import { dirname, resolve } from "node:path";

import { DEFAULT_GAMES } from "../src/core/games";

const args = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const at = args.indexOf(`--${name}`);
  return at >= 0 ? args[at + 1] : undefined;
};
const has = (name: string): boolean => args.includes(`--${name}`);

/** Private IPv4 addresses first (phones on the same Wi-Fi can reach those), anything else last. */
const lanAddresses = (): string[] => {
  const all = Object.values(networkInterfaces())
    .flat()
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry) && entry!.family === "IPv4" && !entry!.internal)
    .map((entry) => entry.address);
  const isPrivate = (ip: string): boolean => /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip);
  return [...all.filter(isPrivate), ...all.filter((ip) => !isPrivate(ip))];
};

const host = flag("host") ?? "localhost";
const lan = lanAddresses();
const rocketPort = Number(flag("rocket-port") ?? 5173);
const feudPort = Number(flag("feud-port") ?? 4100);

const games = DEFAULT_GAMES.map((game) => {
  if (game.id === "rocket-arena" && !has("no-rocket")) return { ...game, hostUrl: `http://${host}:${rocketPort}/` };
  if (game.id === "family-feud" && !has("no-feud")) {
    return { ...game, hostUrl: `http://${host}:${feudPort}/screen/local`, consoleUrl: `http://${host}:${feudPort}/host` };
  }
  return game;
});

const out = resolve("data/games.local.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${JSON.stringify(games, null, 2)}\n`);

console.log(`Phones will reach this laptop at: ${lan.length ? lan.map((ip) => `http://${ip}:8787`).join("  or  ") : "(no LAN address found: join the Wi-Fi or router first)"}`);
console.log(`Catalogue:    ${out}`);
for (const game of games) console.log(`  ${game.id.padEnd(13)} ${game.hostUrl}`);
