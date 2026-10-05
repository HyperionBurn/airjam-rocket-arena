// UI review screenshots: the real big-screen page at a laptop size + named phones.
//   node tools/e2e/ui-shots.mjs <outDir> [width] [height]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const [out = "ui-shots", wArg = "1440", hArg = "680"] = process.argv.slice(2);
const W = Number(wArg), H = Number(hArg);
mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ channel: "chromium", args: ["--ignore-gpu-blocklist", "--use-angle=d3d11", "--autoplay-policy=no-user-gesture-required"] });
const host = await b.newPage({ viewport: { width: W, height: H } });
host.on("pageerror", (e) => console.log("[host error]", e.message));
await host.goto("http://localhost:5173/");
let code = null;
for (let i = 0; i < 90 && !code; i++) {
  const t = await host.evaluate(() => document.body.innerText).catch(() => "");
  const m = /ROOM CODE\s+([A-Z0-9]{4})/i.exec(t) || /Room\s+([A-Z0-9]{4})/.exec(t);
  if (m) code = m[1]; else await sleep(1000);
}
console.log("room", code);
await sleep(1500);
await host.screenshot({ path: `${out}/${W}x${H}-1-lobby-empty.png` });
const names = ["ROCKET RAYAN", "TURBO TOADS", "BALL HOGS", "SKY KINGS"];
const phones = [];
for (let i = 0; i < 4; i++) {
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => console.log(`[phone${i} error]`, e.message));
  await p.goto(`http://localhost:5173/controller?room=${code}`);
  await p.waitForSelector("#ra-tc-nickname", { timeout: 30000 }).catch(() => null);
  if (i === 0) await p.screenshot({ path: `${out}/phone-1-lobby.png` });
  // headless background pages are throttled; a real phone is always the foreground page
  await p.bringToFront();
  await sleep(2000); // let the controller session come up before typing
  const nick = p.locator("#ra-tc-nickname");
  if (await nick.count()) await nick.pressSequentially(names[i], { delay: 20 });
  await sleep(800);
  await p.locator('[data-testid="ra-touch-ready"]').click().catch(() => {});
  await sleep(2000);
  phones.push(p);
}
await host.bringToFront();
await sleep(2500);
await host.screenshot({ path: `${out}/${W}x${H}-2-lobby-four.png` });
await phones[0].screenshot({ path: `${out}/phone-2-ready.png` });
await host.locator("[data-lobby-root] .lobby-btn--primary").click({ force: true }).catch((e) => console.log("start click", e.message));
await sleep(9000);
await host.screenshot({ path: `${out}/${W}x${H}-3-match.png` });
await phones[0].screenshot({ path: `${out}/phone-3-pad.png` });
await phones[0].setViewportSize({ width: 390, height: 844 }); await sleep(800);
await phones[0].screenshot({ path: `${out}/phone-4-pad-portrait.png` });
console.log("host text:", (await host.evaluate(() => document.body.innerText)).replace(/\s+/g, " ").slice(0, 400));
await b.close();
