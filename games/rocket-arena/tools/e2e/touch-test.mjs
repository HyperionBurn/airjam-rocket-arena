// Real multitouch on an emulated phone (CDP touch events). Usage: node touch-test.mjs <outDir>
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const outDir = process.argv[2] ?? "touch";
mkdirSync(outDir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ args: ["--ignore-gpu-blocklist", "--enable-webgl", "--use-angle=d3d11"] });
const hostCtx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const host = await hostCtx.newPage();
host.on("pageerror", (e) => console.log("[host pageerror]", e.message));
await host.goto("http://localhost:5173/?debug=1");
let room = null;
for (let i = 0; i < 90 && !room; i++) { room = await host.evaluate(() => document.body.innerText.match(/ROOM CODE\s+([A-Z0-9]{4})/)?.[1] ?? null).catch(() => null); if (!room) await sleep(1000); }

// A phone with REAL touch input (no scripted drive).
const phoneCtx = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const phone = await phoneCtx.newPage();
phone.on("pageerror", (e) => console.log("[phone pageerror]", e.message));
await phone.goto(`http://localhost:5173/controller?room=${room}&controllerId=pad-touch`);
// A second scripted phone so the match has two cars.
const bot = await (await browser.newContext({ viewport: { width: 400, height: 300 } })).newPage();
await bot.goto(`http://localhost:5173/controller?room=${room}&controllerId=pad-b&drive=fwd`);
await host.bringToFront();
await sleep(4000);

const tap = async (selector) => { const box = await phone.locator(selector).first().boundingBox(); await phone.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2); };
await tap('[data-testid="ra-touch-ready"]');
for (let i = 0; i < 40; i++) { const t = await host.evaluate(() => document.body.innerText).catch(() => ""); if (/2 of 2 ready/i.test(t)) break; await sleep(500); }
await host.evaluate(() => __ra.store.dispatch({ type: "match/start" }));
for (let i = 0; i < 90; i++) { const h = await host.evaluate(() => __ra.controller()?.hud()).catch(() => null); if (h?.active && h.phase === "playing") break; await sleep(500); }
await sleep(1000);

const cdp = await phoneCtx.newCDPSession(phone);
const touch = (type, points) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: points });
const center = async (sel) => { const b = await phone.locator(sel).first().boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2, box: b }; };
const raw = () => host.evaluate(() => { const r = __ra.raw("pad-touch"); return r && { stick: [Math.round(r.stick.x * 100) / 100, Math.round(r.stick.y * 100) / 100], boost: r.boost, jump: r.jump, handbrake: r.handbrake }; });
const hud = () => host.evaluate(() => { const h = __ra.controller().hud(); const i = h.views.find((v) => v.boosting !== undefined); return h.cars.map((c) => `${c.car}:${Math.round(c.speed)}/b${Math.round(c.boost)}`).join(" "); });

const stick = await center('[data-testid="ra-touch-stick"], .ra-tc-stick');
const boost = await center('[data-testid="ra-touch-btn-boost"]');
const jump = await center('[data-testid="ra-touch-btn-jump"]');
console.log("stick@", JSON.stringify([stick.x | 0, stick.y | 0]), "boost@", JSON.stringify([boost.x | 0, boost.y | 0]), "jump@", JSON.stringify([jump.x | 0, jump.y | 0]));
console.log("idle:", JSON.stringify(await raw()));

await phone.evaluate(() => { window.__ptr = []; for (const t of ["pointerdown","pointermove","pointerup","pointercancel","touchstart","touchmove"]) document.addEventListener(t, (e) => window.__ptr.push(`${t}:${e.target?.className?.toString().slice(0,24)}:${Math.round(e.clientX ?? e.touches?.[0]?.clientX ?? -1)},${Math.round(e.clientY ?? e.touches?.[0]?.clientY ?? -1)}`), true); });
await touch("touchStart", [{ id: 1, x: stick.x, y: stick.y }]);
for (let k = 1; k <= 6; k++) { await touch("touchMove", [{ id: 1, x: stick.x, y: stick.y - k * 12 }]); await sleep(30); }
await sleep(300);
console.log("stick forward:", JSON.stringify(await raw()));
console.log("events:", JSON.stringify(await phone.evaluate(() => window.__ptr.slice(0, 8))));
console.log("stick rect:", JSON.stringify(stick.box));
// 2. right thumb presses boost WHILE the stick stays held
await touch("touchMove", [{ id: 1, x: stick.x, y: stick.y - 72 }, { id: 2, x: boost.x, y: boost.y }]).catch(() => {});
await touch("touchStart", [{ id: 1, x: stick.x, y: stick.y - 72 }, { id: 2, x: boost.x, y: boost.y }]);
await sleep(400);
console.log("stick + boost:", JSON.stringify(await raw()), "|", await hud());
await phone.screenshot({ path: `${outDir}/touch-both.png` });
// 3. lift the boost finger only
await touch("touchEnd", [{ id: 1, x: stick.x, y: stick.y - 72 }]);
await sleep(300);
console.log("boost released, stick held:", JSON.stringify(await raw()));
// 4. tap jump twice (double jump) with the stick still held
for (let n = 0; n < 2; n++) { await touch("touchStart", [{ id: 1, x: stick.x, y: stick.y - 72 }, { id: 3, x: jump.x, y: jump.y }]); await sleep(60); await touch("touchEnd", [{ id: 1, x: stick.x, y: stick.y - 72 }]); await sleep(120); }
console.log("after jump taps:", JSON.stringify(await raw()), "|", await hud());
// 5. lift everything: must return to neutral
await touch("touchEnd", []);
await sleep(400);
console.log("all fingers up:", JSON.stringify(await raw()));
// 6. orientation change mid-match, then drive again
await touch("touchStart", [{ id: 1, x: stick.x, y: stick.y }]);
await touch("touchMove", [{ id: 1, x: stick.x, y: stick.y - 60 }]);
await phone.setViewportSize({ width: 390, height: 844 });
await sleep(800);
await touch("touchEnd", []);
await sleep(300);
const stick2 = await center('[data-testid="ra-touch-stick"], .ra-tc-stick');
await touch("touchStart", [{ id: 1, x: stick2.x, y: stick2.y }]);
for (let k = 1; k <= 6; k++) { await touch("touchMove", [{ id: 1, x: stick2.x, y: stick2.y - k * 12 }]); await sleep(30); }
await sleep(400);
console.log("portrait, stick forward:", JSON.stringify(await raw()));
await phone.screenshot({ path: `${outDir}/touch-portrait.png` });
await touch("touchEnd", []);
await browser.close();
