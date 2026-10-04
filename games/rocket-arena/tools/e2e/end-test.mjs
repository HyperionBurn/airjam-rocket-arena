import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const outDir = process.argv[2]; const players = Number(process.argv[3] ?? 2); const matchSeconds = Number(process.argv[4] ?? 20);
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ["--ignore-gpu-blocklist", "--enable-webgl", "--use-angle=d3d11"] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.on("pageerror", (e) => console.log("[pageerror]", e.message, e.stack?.split("\n").slice(0,4).join(" | ")));
page.on("console", (m) => { const t = m.text(); if (!/X4008|X4000|vite\]|GL_INVALID|CORS|browser-logs|SOCKET_DISCONN/.test(t) && /error|warn/i.test(m.type())) console.log(`[${m.type()}]`, t.slice(0,300)); });
await page.goto(`http://localhost:5173/harness.html?players=${players}&drive=fwd&matchSeconds=${matchSeconds}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const f = () => page.frames().find((fr) => /\/\?debug/.test(fr.url()));
const waitReady = async () => { for (let i = 0; i < 90; i++) { const t = await f()?.evaluate(() => document.body.innerText).catch(()=>""); if (new RegExp(`${players} of ${players} ready`,"i").test(t||"")) return true; await sleep(1000); } return false; };
await waitReady();
const snap = () => f().evaluate(() => { const c = __ra.controller(); const h = c?.hud(); const st = __ra.store.getState(); return h && { active: h.active, phase: h.phase, score: `${h.blueScore}-${h.orangeScore}`, left: Math.round(h.remainingSeconds), ot: h.overtime, winner: h.winner, lobby: st.phase, match: st.match.number, lscore: `${st.match.blue}-${st.match.orange}`, rt: document.body.innerText.match(/runtime: \w+/)?.[0] }; }).catch(()=>null);
const click = (sel) => f().evaluate((s) => { const b = document.querySelector(s); if (!b) return "none"; b.click(); return "ok"; }, sel);
const startMatch = async () => { console.log("start:", await click("[data-lobby-root] .lobby-btn--primary")); for (let i = 0; i < 60; i++) { const s = await snap(); if (s?.active && s.phase === "playing") return; await sleep(500); } };
await startMatch();
await sleep(3000);
console.log("goal:", await f().evaluate(() => __ra.controller().debugPlaceBall([0, 4600, 120], [0, 2600, 0])));
let last = "";
for (let t = 0; t < 60; t++) {
  await sleep(1000);
  const s = await snap();
  if (s?.phase === "playing" && s.left === matchSeconds && !s.ot && s.lscore !== "0-0" && !globalThis.nudged) { globalThis.nudged = 1; await f().evaluate(() => __ra.controller().debugPlaceBall([0, 0, 100], [300, 0, 0])); }
  const line = JSON.stringify(s);
  if (line !== last && (t % 4 === 0 || s?.lobby !== "playing" || s?.phase === "ended")) console.log(String(t + 1).padStart(2), line);
  last = line;
  if (s?.phase === "ended" && !globalThis.shotEnded) { globalThis.shotEnded = 1; await page.screenshot({ path: `${outDir}/ended.png` }); }
  if (s?.lobby === "post-match") { await sleep(1500); await page.screenshot({ path: `${outDir}/post.png` }); break; }
}
console.log("host text:", (await f().evaluate(() => document.body.innerText.slice(0, 500))).replace(/\n/g, " | "));
// rematch
const buttons = await f().evaluate(() => [...document.querySelectorAll("[data-lobby-root] button")].map((b) => b.innerText.trim()));
console.log("buttons:", JSON.stringify(buttons));
console.log("rematch:", await f().evaluate(() => { const b = [...document.querySelectorAll("[data-lobby-root] button")].find((x) => /rematch/i.test(x.innerText)); if (!b) return "none"; b.click(); return "ok"; }));
for (let i = 0; i < 40; i++) { const s = await snap(); if (s?.active && s.phase !== "ended" && s.match === 2) { console.log("rematch live:", JSON.stringify(s)); break; } await sleep(500); }
await sleep(2500);
await page.screenshot({ path: `${outDir}/rematch.png` });
await browser.close();
