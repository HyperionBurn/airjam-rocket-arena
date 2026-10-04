// Bot fill: N humans + bots. Usage: node bot-test.mjs <outDir> <players> <teamSize> [difficulty]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const [outDir, playersArg = "1", teamSizeArg = "1", difficulty = "rookie"] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const players = Number(playersArg);
const browser = await chromium.launch({ args: ["--ignore-gpu-blocklist", "--enable-webgl", "--use-angle=d3d11"] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.on("pageerror", (e) => console.log("[pageerror]", e.message, e.stack?.split("\n").slice(0,4).join(" | ")));
page.on("console", (m) => { const t = m.text(); if (!/X4008|X4000|vite\]|GL_INVALID|CORS|browser-logs|SOCKET_DISCONN/.test(t) && /error|warn|bots/i.test(m.type()+t)) console.log(`[${m.type()}]`, t.slice(0,300)); });
await page.goto(`http://localhost:5173/harness.html?players=${players}&drive=fwd`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const f = () => page.frames().find((fr) => /\/\?debug/.test(fr.url()));
for (let i = 0; i < 90; i++) { const t = await f()?.evaluate(() => document.body.innerText).catch(()=>""); if (new RegExp(`${players} of ${players} ready`,"i").test(t||"")) break; await sleep(1000); }
await f().evaluate(([ts, d]) => __ra.store.dispatch({ type: "settings/patch", patch: { botFill: "fill", teamSize: ts, botDifficulty: d } }), [Number(teamSizeArg), difficulty]);
await f().evaluate(() => document.querySelector("[data-lobby-root] .lobby-btn--primary").click());
const snap = () => f().evaluate(() => { const h = __ra.controller()?.hud(); return h && { active: h.active, phase: h.phase, score: `${h.blueScore}-${h.orangeScore}`, cars: h.cars.map((c) => `${c.car}:${c.team}${c.human ? "H" : "B"}@${Math.round(c.speed)}`).join(" ") }; }).catch(() => null);
for (let t = 0; t < Number(process.env.BOT_SECONDS ?? 22); t++) { await sleep(1000); const s = await snap(); if (t % 5 === 0) console.log(String(t).padStart(2), JSON.stringify(s)); if (t === 12) await page.screenshot({ path: `${outDir}/bots.png` }); }
await browser.close();
