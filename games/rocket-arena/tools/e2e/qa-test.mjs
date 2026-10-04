// Full-size visual QA. Host page (1920x1080) + one real page per phone.
// Usage: node qa-test.mjs <outDir> <players> [cars=a,b,c] [tuning=json] [shots=4,8,14] [drive=circle]
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const [outDir, playersArg = "4", carsArg = "", tuningArg = "{}", shotsArg = "5,9,14", drive = "circle"] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const players = Number(playersArg);
const cars = carsArg.split(",").filter(Boolean);
const tuning = JSON.parse(tuningArg);
const shots = shotsArg.split(",").map(Number);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({ args: ["--ignore-gpu-blocklist", "--enable-webgl", "--use-angle=d3d11"] });
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const logs = [];
const note = (page, label) => {
  page.on("pageerror", (e) => logs.push(`[${label} pageerror] ${e.message}`));
  page.on("console", (m) => {
    const t = m.text();
    if (/X4008|X4000|vite\]|GL_INVALID|CORS|browser-logs|SOCKET_DISCONN/.test(t)) return;
    if (/error|warn/i.test(m.type())) logs.push(`[${label} ${m.type()}] ${t.slice(0, 300)}`);
  });
};

const host = await context.newPage();
note(host, "host");
await host.goto("http://localhost:5173/?debug=1");
let room = null;
for (let i = 0; i < 90 && !room; i++) {
  room = await host.evaluate(() => document.body.innerText.match(/ROOM CODE\s+([A-Z0-9]{4})/)?.[1] ?? null).catch(() => null);
  if (!room) await sleep(1000);
}
console.log("room:", room);

const phones = [];
for (let i = 1; i <= players; i++) {
  const page = await context.newPage();
  await page.setViewportSize({ width: 844, height: 390 });
  await page.addInitScript(() => {
    window.__vib = [];
    navigator.vibrate = (p) => { window.__vib.push(p); return true; };
  });
  note(page, `phone${i}`);
  const q = new URLSearchParams({ room, controllerId: `pad-${i}`, drive });
  if (cars[i - 1]) q.set("car", cars[i - 1]);
  await page.goto(`http://localhost:5173/controller?${q}`);
  phones.push(page);
}
await host.bringToFront();

for (let i = 0; i < 240; i++) {
  const t = await host.evaluate(() => document.body.innerText).catch(() => "");
  if (new RegExp(`${players} of ${players} ready`, "i").test(t)) { console.log(`all ${players} ready after ${i}s`); break; }
  await sleep(1000);
}
await sleep(3000); // let every phone's car choice reach the lobby
await host.evaluate(
  ([n, tn]) => {
    __ra.store.dispatch({ type: "settings/patch", patch: { playerSlots: Math.max(2, n) } });
    __ra.store.dispatch({ type: "settings/tuning", patch: tn });
  },
  [players, tuning],
);
await host.screenshot({ path: `${outDir}/0-lobby.png` });
console.log("lobby roster:", JSON.stringify(await host.evaluate(() => __ra.store.getState().players.map((p) => [p.id, p.carId, p.team]))));
await host.evaluate(() => __ra.store.dispatch({ type: "match/start" }));
for (let i = 0; i < 90; i++) {
  const h = await host.evaluate(() => __ra.controller()?.hud()).catch(() => null);
  if (h?.active && h.phase === "playing") break;
  await sleep(500);
}
if (process.env.QA_BALLCAM_OFF) await host.evaluate((n) => { for (let i = 0; i < n; i++) __ra.controller().setBallCam(i, false); }, players);
const t0 = Date.now();
const snapshot = async (label) => {
  const secs = ((Date.now() - t0) / 1000).toFixed(0);
  await host.screenshot({ path: `${outDir}/${label}-t${secs}.png` });
};
for (const at of shots) {
  while ((Date.now() - t0) / 1000 < at) await sleep(250);
  await snapshot("play");
}
const hud = await host.evaluate(() => __ra.controller().hud());
console.log("tuning in hud:", JSON.stringify(hud.tuning));
console.log("cars:", hud.cars.map((c) => `${c.car}:${c.team}${c.human ? "H" : "B"}@${Math.round(c.speed)}/b${Math.round(c.boost)}`).join(" "));
for (let i = 0; i < phones.length; i++) {
  const info = await phones[i].evaluate(() => ({
    vib: (window.__vib ?? []).length,
    boostText: document.querySelector(".ra-tc-boost__value")?.textContent ?? null,
    air: document.querySelector(".ra-tc-airchip")?.textContent ?? null,
  }));
  console.log(`phone ${i + 1}:`, JSON.stringify(info));
}
writeFileSync(`${outDir}/console.txt`, logs.join("\n"));
console.log(logs.length ? `logs:\n${logs.slice(0, 15).join("\n")}` : "no warnings/errors");
await browser.close();
