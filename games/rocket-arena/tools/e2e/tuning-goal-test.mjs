// Times goal -> kickoff -> play with and without event tuning. Usage: node tuning-goal-test.mjs <fast|normal>
import { chromium } from "playwright";
const mode = process.argv[2] ?? "normal";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ args: ["--ignore-gpu-blocklist", "--enable-webgl", "--use-angle=d3d11"] });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const host = await context.newPage();
await host.goto("http://localhost:5173/?debug=1");
let room = null;
for (let i = 0; i < 90 && !room; i++) { room = await host.evaluate(() => document.body.innerText.match(/ROOM CODE\s+([A-Z0-9]{4})/)?.[1] ?? null).catch(() => null); if (!room) await sleep(1000); }
for (let i = 1; i <= 2; i++) { const p = await context.newPage(); await p.goto(`http://localhost:5173/controller?room=${room}&controllerId=pad-${i}&drive=fwd`); }
await host.bringToFront();
for (let i = 0; i < 60; i++) { const t = await host.evaluate(() => document.body.innerText).catch(() => ""); if (/2 of 2 ready/i.test(t)) break; await sleep(1000); }
const tuning = mode === "fast" ? { kickoffReset: "fast", goalCelebration: "short" } : {};
await host.evaluate((tn) => { __ra.store.dispatch({ type: "settings/tuning", patch: tn }); __ra.store.dispatch({ type: "match/start" }); }, tuning);
for (let i = 0; i < 90; i++) { const h = await host.evaluate(() => __ra.controller()?.hud()).catch(() => null); if (h?.active && h.phase === "playing") break; await sleep(500); }
await sleep(7000); // build a replay-worthy run-up
await host.evaluate(() => __ra.controller().debugPlaceBall([0, 4600, 120], [0, 2600, 0]));
const t0 = Date.now();
const events = [];
let last = "";
while (Date.now() - t0 < 16000) {
  const s = await host.evaluate(() => { const h = __ra.controller().hud(); return `${h.phase}${h.phase === "kickoff" ? h.countdown : ""}${document.querySelector("#app.goal-presentation-replaying") ? "+replay" : ""}${document.querySelector("#app.goal-presentation-active") ? "+celebrate" : ""}`; });
  if (s !== last) { events.push(`${((Date.now() - t0) / 1000).toFixed(1)}s ${s}`); last = s; }
  await sleep(80);
}
console.log(`mode=${mode}`); console.log(events.join("\n"));
await browser.close();
