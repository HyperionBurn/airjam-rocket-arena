// Scores a goal with a placed ball, then watches celebration -> replay -> kickoff -> end.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const outDir = process.argv[2]; const players = Number(process.argv[3] ?? 2); const matchSeconds = Number(process.argv[4] ?? 25);
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ["--ignore-gpu-blocklist", "--enable-webgl", "--use-angle=d3d11"] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.on("pageerror", (e) => console.log("[pageerror]", e.message, e.stack?.split("\n").slice(0,4).join(" | ")));
page.on("console", (m) => { const t = m.text(); if (!/X4008|X4000|vite\]|GL_INVALID|CORS|browser-logs|SOCKET_DISCONN/.test(t) && /error|warn/i.test(m.type())) console.log(`[${m.type()}]`, t.slice(0,300)); });
await page.goto(`http://localhost:5173/harness.html?players=${players}&drive=fwd&matchSeconds=${matchSeconds}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const f = () => page.frames().find((fr) => /\/\?debug/.test(fr.url()));
for (let i = 0; i < 90; i++) { const t = await f()?.evaluate(() => document.body.innerText).catch(()=>""); if (new RegExp(`${players} of ${players} ready`,"i").test(t||"")) break; await sleep(1000); }
await f().evaluate(() => document.querySelector("[data-lobby-root] .lobby-btn--primary").click());
const snap = () => f().evaluate(() => { const c = __ra.controller(); const h = c?.hud(); return h && { active: h.active, phase: h.phase, cd: h.countdown, score: `${h.blueScore}-${h.orangeScore}`, left: Math.round(h.remainingSeconds), ot: h.overtime, winner: h.winner, lobby: __ra.store.getState().phase, replay: !!document.querySelector("#app.goal-presentation-active"), replaying: !!document.querySelector("#app.goal-presentation-replaying") }; }).catch(()=>null);
// wait for kickoff countdown to finish
for (let i = 0; i < 40; i++) { const s = await snap(); if (s?.active && s?.phase === "playing") break; await sleep(500); }
console.log("playing:", JSON.stringify(await snap()));
await sleep(8000);
console.log("placed:", await f().evaluate(() => __ra.controller().debugPlaceBall([0, 4600, 120], [0, 2600, 0])));
let n = 0;
for (let t = 0; t < 16; t++) {
  await sleep(1000);
  const s = await snap();
  console.log(String(t + 1).padStart(2), JSON.stringify(s));
  if ([1, 3, 5, 8, 11, 14].includes(t + 1) || s?.lobby === "post-match") await page.screenshot({ path: `${outDir}/g${String(++n).padStart(2, "0")}-t${t + 1}.png` });
  if (s?.lobby === "post-match") break;
}
await browser.close();
