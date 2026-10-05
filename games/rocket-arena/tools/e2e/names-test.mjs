// Two phones: the first phone's name and READY must survive the second phone joining.
//   node tools/e2e/names-test.mjs   (dev server running)
import { chromium } from "playwright";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ channel: "chromium", args: ["--use-angle=d3d11"] });
const host = await b.newPage({ viewport: { width: 1440, height: 680 } });
await host.goto("http://localhost:5173/?debug=1");
let code = null;
for (let i = 0; i < 60 && !code; i++) { const m = /ROOM CODE\s+([A-Z0-9]{4})/i.exec(await host.evaluate(() => document.body.innerText).catch(() => "")); if (m) code = m[1]; else await sleep(1000); }
const roster = async (tag) => console.log(tag, JSON.stringify(await host.evaluate(() => window.__ra.store.getState().players.map((p) => [p.name, p.ready]))));
const phone = async (name) => {
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  p.on("console", (m) => { if (/visib|hidden|disconnect/i.test(m.text())) console.log("[phone]", m.text().slice(0, 140)); });
  await p.goto(`http://localhost:5173/controller?room=${code}`);
  await p.waitForSelector("#ra-tc-nickname", { timeout: 30000 });
  await sleep(2000);
  await p.locator("#ra-tc-nickname").pressSequentially(name, { delay: 20 });
  await sleep(800);
  await p.locator('[data-testid="ra-touch-ready"]').click();
  await sleep(1500);
  return p;
};
const p1 = await phone("ALPHA");
await roster("after phone1:");
console.log("phone1 visibility:", await p1.evaluate(() => document.visibilityState));
const p2 = await phone("BRAVO");
await roster("after phone2:");
console.log("phone1 visibility now:", await p1.evaluate(() => document.visibilityState), "| phone1 ready button:", await p1.locator('[data-testid="ra-touch-ready"]').innerText());
await sleep(4000);
await roster("4 s later:");
await p1.bringToFront(); await sleep(2000);
await roster("phone1 back in front:");
// pass/fail: a second phone joining must not reset the first phone's name or READY
const final = await host.evaluate(() => window.__ra.store.getState().players.map((p) => [p.name, p.ready]));
const ok = final.some(([n, r]) => n === "ALPHA" && r) && final.some(([n, r]) => n === "BRAVO" && r);
console.log(ok ? "PASS names and READY survive a join" : "FAIL names/READY were reset by a join");
await b.close();
process.exit(ok ? 0 : 1);
