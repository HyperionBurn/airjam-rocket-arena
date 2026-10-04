// Late join takes a bot's car; leaving hands it back. Usage: node join-leave-test.mjs <outDir>
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const outDir = process.argv[2] ?? "joinleave";
mkdirSync(outDir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ args: ["--ignore-gpu-blocklist", "--enable-webgl", "--use-angle=d3d11"] });
const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
const host = await context.newPage();
host.on("pageerror", (e) => console.log("[host pageerror]", e.message));
host.on("console", (m) => { const t = m.text(); if (!/X4008|X4000|vite\]|GL_INVALID|CORS|browser-logs|SOCKET|DevTools/.test(t) && /error|warn/i.test(m.type())) console.log(`[host ${m.type()}]`, t.slice(0, 300)); });
await host.goto("http://localhost:5173/?debug=1");
let room = null;
for (let i = 0; i < 90 && !room; i++) { room = await host.evaluate(() => document.body.innerText.match(/ROOM CODE\s+([A-Z0-9]{4})/)?.[1] ?? null).catch(() => null); if (!room) await sleep(1000); }
const phones = {};
const join = async (n, q = "") => { const p = await context.newPage(); await p.addInitScript(() => { window.__vib = []; navigator.vibrate = (x) => { window.__vib.push(x); return true; }; }); await p.goto(`http://localhost:5173/controller?room=${room}&controllerId=pad-${n}&drive=fwd${q}`); phones[n] = p; return p; };
await join(1); await join(2);
await host.bringToFront();
for (let i = 0; i < 60; i++) { const t = await host.evaluate(() => document.body.innerText).catch(() => ""); if (/2 of 2 ready/i.test(t)) break; await sleep(1000); }
await host.evaluate(() => { __ra.store.dispatch({ type: "settings/patch", patch: { botFill: "fill", teamSize: 2, playerSlots: 4 } }); __ra.store.dispatch({ type: "match/start" }); });
const snap = () => host.evaluate(() => { const h = __ra.controller().hud(); return { phase: h.phase, cars: h.cars.map((c) => `${c.car}:${c.team}${c.human ? "H" : "B"}`).join(" "), views: h.views.map((v) => v.car).join(",") }; });
for (let i = 0; i < 90; i++) { const h = await host.evaluate(() => __ra.controller()?.hud()).catch(() => null); if (h?.active && h.phase === "playing") break; await sleep(500); }
console.log("launched:", JSON.stringify(await snap()));
await sleep(2000);

console.log("-- phone 3 joins mid-match");
await join(3);
await host.bringToFront();
let after = null;
for (let i = 0; i < 40; i++) { after = await snap(); if (after.views.split(",").length >= 3) break; await sleep(500); }
console.log("after join:", JSON.stringify(after));
const p3 = await phones[3].evaluate(() => ({ text: document.body.innerText.slice(0, 120), vib: window.__vib.length }));
console.log("phone 3 sees:", JSON.stringify(p3.text.replace(/\n/g, " | ")));
await sleep(2500);
await host.screenshot({ path: `${outDir}/joined.png` });

console.log("-- phone 3 leaves");
await phones[3].close();
let left = null;
for (let i = 0; i < 80; i++) { left = await snap(); if (left.views.split(",").length <= 2) break; await sleep(500); }
console.log("after leave:", JSON.stringify(left));
await sleep(3000);
const speeds = await host.evaluate(() => __ra.controller().hud().cars.map((c) => `${c.car}:${c.human ? "H" : "B"}@${Math.round(c.speed)}`).join(" "));
console.log("speeds after leave:", speeds);

console.log("-- phone 3 comes back (same id)");
await join(3);
await host.bringToFront();
let back = null;
for (let i = 0; i < 40; i++) { back = await snap(); if (back.views.split(",").length >= 3) break; await sleep(500); }
console.log("after rejoin:", JSON.stringify(back));
await browser.close();
