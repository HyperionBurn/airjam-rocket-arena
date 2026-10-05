/**
 * Is the local event stack up? Checks the running hub, every game it will open, the Air Jam relay,
 * and prints the address phones should use. Exit code 1 if anything on this laptop is not ready.
 *
 *   pnpm --filter arcade-hub run doctor
 *   pnpm --filter arcade-hub run doctor -- --hub http://localhost:8787 --relay http://localhost:4000
 *
 * Games hosted on the internet are only warnings: they are the fallback, and the laptop may be offline.
 */
const args = process.argv.slice(2);
const flag = (name: string, fallback: string): string => {
  const at = args.indexOf(`--${name}`);
  return at >= 0 && args[at + 1] ? args[at + 1]! : fallback;
};
const hub = flag("hub", `http://localhost:${process.env.PORT ?? 8787}`).replace(/\/$/, "");
const relay = flag("relay", "http://localhost:4000").replace(/\/$/, "");

interface Game {
  id: string;
  name: string;
  hostUrl: string;
  consoleUrl?: string;
  integration: string;
}

let failed = 0;
const line = (level: "ok" | "FAIL" | "warn", text: string): void => {
  if (level === "FAIL") failed += 1;
  console.log(`[${level.padEnd(4)}] ${text}`);
};

const get = async (url: string): Promise<{ status: number; body: string } | null> => {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    return { status: response.status, body: await response.text() };
  } catch {
    return null;
  }
};

const isLocal = (url: string): boolean => /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(url);

const main = async (): Promise<void> => {
  const games = await get(`${hub}/api/games`);
  if (!games || games.status !== 200) {
    line("FAIL", `hub not answering at ${hub}. Start it: see apps/arcade-hub/LOCAL-EVENT.md step 5.`);
    return;
  }
  const catalogue = (JSON.parse(games.body) as { games: Game[] }).games;
  line("ok", `hub up at ${hub} with ${catalogue.length} games: ${catalogue.map((game) => game.id).join(", ")}`);

  const info = await get(`${hub}/api/info`);
  const ips = info ? ((JSON.parse(info.body) as { ips?: string[] }).ips ?? []) : [];
  if (ips.length) line("ok", `phones join at http://${ips[0]}:${new URL(hub).port || 80}${ips.length > 1 ? `   (other addresses: ${ips.slice(1).join(", ")})` : ""}`);
  else line("FAIL", "no LAN address: this laptop is not on a Wi-Fi/Ethernet network, so phones cannot join. Connect to the router first.");

  for (const game of catalogue) {
    const local = isLocal(game.hostUrl);
    const level = local ? "FAIL" : "warn";
    const page = await get(game.hostUrl);
    if (page && page.status < 400) line("ok", `${game.id}: big screen ${game.hostUrl} (${local ? "this laptop" : "hosted"})`);
    else line(level, `${game.id}: big screen ${game.hostUrl} is not answering${local ? ". Start it: apps/arcade-hub/LOCAL-EVENT.md steps 3-4." : " (hosted; fine if you are offline and not playing it)"}`);
    if (game.consoleUrl) {
      const consolePage = await get(game.consoleUrl);
      if (consolePage && consolePage.status < 400) line("ok", `${game.id}: moderator console ${game.consoleUrl}`);
      else line(level, `${game.id}: moderator console ${game.consoleUrl} is not answering`);
    }
  }

  if (catalogue.some((game) => game.id === "rocket-arena" && isLocal(game.hostUrl))) {
    const health = await get(`${relay}/health`);
    if (health && health.status === 200) line("ok", `Air Jam relay up at ${relay} (Rocket Arena's phones need it)`);
    else line("FAIL", `Air Jam relay not answering at ${relay}. It starts with Rocket Arena: apps/arcade-hub/LOCAL-EVENT.md step 3.`);
  }
};

await main();
console.log(failed === 0 ? "\nAll local services are ready." : `\n${failed} problem(s) above.`);
process.exit(failed === 0 ? 0 : 1);
