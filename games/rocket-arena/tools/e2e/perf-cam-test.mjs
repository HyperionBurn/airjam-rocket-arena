import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const [outDir, playersArg = "6"] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const players = Number(playersArg);
const browser = await chromium.launch({ args: ["--ignore-gpu-blocklist", "--enable-webgl", "--use-angle=d3d11"] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1200 } });
page.on("pageerror", (e) => console.log("[pageerror]", e.message));
await page.goto(`http://localhost:5173/harness.html?players=${players}&drive=circle`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const f = () => page.frames().find((fr) => /\/\?debug/.test(fr.url()));
for (let i = 0; i < 120; i++) { const t = await f()?.evaluate(() => document.body.innerText).catch(()=>""); if (new RegExp(`${players} of ${players} ready`,"i").test(t||"")) break; await sleep(1000); }
await f().evaluate((n) => __ra.store.dispatch({ type: "settings/patch", patch: { playerSlots: Math.max(2, n) } }), players);
await f().evaluate(() => document.querySelector("[data-lobby-root] .lobby-btn--primary").click());
for (let i = 0; i < 60; i++) { const h = await f().evaluate(() => __ra.controller()?.hud()).catch(()=>null); if (h?.active && h.phase === "playing") break; await sleep(500); }
await sleep(3000);
// frames per second inside the host frame, measured with rAF
const fps = await f().evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const tick = () => { n++; if (performance.now() - t0 >= 8000) res(Math.round((n * 1000) / (performance.now() - t0))); else requestAnimationFrame(tick); }; requestAnimationFrame(tick); }));
console.log(`players=${players} views=${(await f().evaluate(() => __ra.controller().hud().views.length))} host-fps(rAF)=${fps}`);
// ball cam via a REAL click on phone 1's CAM button
const before = await f().evaluate(() => __ra.controller().hud().views.map((v) => v.ballCam));
const phone = page.frames().find((fr) => /controller\?.*pad-1/.test(fr.url()));
console.log("phone buttons:", JSON.stringify(await phone.evaluate(() => [...document.querySelectorAll("button")].map((b) => b.getAttribute("aria-label") + "|" + b.innerText.trim().slice(0, 12)))));
const btn = phone.locator('button[aria-label="Cam"]').first();
console.log("cam button box:", JSON.stringify(await btn.boundingBox().catch(() => null)));
const box = await btn.boundingBox();
console.log("phone frame url:", phone.url(), "inner:", JSON.stringify(await phone.evaluate(() => { const b = document.querySelector('button[aria-label="Cam"]'); const r = b.getBoundingClientRect(); const top = document.elementFromPoint(r.x + r.width/2, r.y + r.height/2); return { rect: [r.x, r.y, r.width, r.height], win: [innerWidth, innerHeight], top: top?.tagName + "." + top?.className }; })));
console.log("disabled?", await btn.isDisabled(), "visible?", await btn.isVisible());
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.mouse.down(); await sleep(120); await page.mouse.up();
await page.screenshot({ path: `${outDir}/after-click.png` });
await sleep(600);
console.log("raw ballCamPresses:", await f().evaluate(() => __ra.raw("pad-1")?.ballCamPresses), "phone count (dom):", await phone.evaluate(() => document.body.innerText.slice(0,0)));
const after = await f().evaluate(() => __ra.controller().hud().views.map((v) => v.ballCam));
console.log("ballCam before:", JSON.stringify(before), "after one tap on phone 1:", JSON.stringify(after));
await page.screenshot({ path: `${outDir}/p${players}.png` });
await browser.close();
