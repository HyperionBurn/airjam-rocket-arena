// Drives the dev harness headlessly: N scripted phones join, ready up, START is
// pressed on the projector, and we capture what the projector shows.
// Usage: node match-test.mjs <outDir> [players=2] [drive=circle] [seconds=12] [gpu=0|1]
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const [outDir, playersArg = "2", drive = "circle", secondsArg = "12", gpu = "0"] = process.argv.slice(2);
if (!outDir) {
  console.error("usage: node match-test.mjs <outDir> [players] [drive] [seconds] [gpu]");
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });
const players = Number(playersArg);
const seconds = Number(secondsArg);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const args =
  gpu === "1"
    ? ["--ignore-gpu-blocklist", "--enable-webgl", "--use-angle=d3d11"]
    : ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"];
const browser = await chromium.launch({ args });
const page = await browser.newPage({ viewport: { width: 1920, height: 1400 } });

const logs = [];
page.on("console", (m) => {
  const text = m.text();
  if (/GL_INVALID_FRAMEBUFFER|browser-logs|CORS/.test(text)) return;
  logs.push(`[${m.type()}] ${text}`);
});
page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}\n${e.stack ?? ""}`));

await page.goto(`http://localhost:5173/harness.html?players=${players}&drive=${drive}${process.env.CARS ? "&cars=" + process.env.CARS : ""}`, { waitUntil: "domcontentloaded" });

const hostFrame = () => page.frames().find((f) => /localhost:5173\/\?debug/.test(f.url()));
const hostText = async () => (await hostFrame()?.evaluate(() => document.body.innerText).catch(() => "")) ?? "";

// 1. Wait for the donor to boot and every phone to be ready.
let lobbyReady = false;
for (let i = 0; i < 120; i++) {
  const text = await hostText();
  if (new RegExp(`${players} of ${players} ready`, "i").test(text) && /ROCKET ARENA \/ READY/.test(text)) {
    lobbyReady = true;
    break;
  }
  await sleep(1000);
}
logs.push(`[harness] lobbyReady=${lobbyReady}`);
await page.screenshot({ path: `${outDir}/1-lobby.png` });
writeFileSync(`${outDir}/lobby-text.txt`, await hostText());

await sleep(3000);
await hostFrame().evaluate((n) => __ra.store.dispatch({ type: "settings/patch", patch: { playerSlots: Math.max(2, n) } }), players);
// 2. START.
const started = await hostFrame().evaluate(() => {
  const button = document.querySelector("[data-lobby-root] .lobby-btn--primary");
  if (!button) return "no button";
  button.click();
  return "clicked";
});
logs.push(`[harness] start=${started}`);

// 3. Capture over time.
for (let t = 1; t <= seconds; t += 2) {
  await sleep(2000);
  await page.screenshot({ path: `${outDir}/2-t${String(t).padStart(2, "0")}.png` });
}
const finalText = await hostText();
writeFileSync(`${outDir}/final-text.txt`, finalText);
const hud = await hostFrame().evaluate(() => {
  const root = document.querySelector(".ra-hud");
  return root ? root.innerText : "(no HUD)";
});
logs.push(`[harness] hud:\n${hud}`);
writeFileSync(`${outDir}/console.txt`, logs.join("\n"));
console.log(logs.join("\n"));
await browser.close();
