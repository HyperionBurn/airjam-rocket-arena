// Real-GPU performance capture for a six-player Rocket Arena match.
// Drives the harness page (N synthetic phones driving circles) in Chromium on a real GPU via
// ANGLE/Direct3D, then samples frame times inside the host frame and (optionally) a CPU profile.
//
//   npx --yes pnpm@9.9.0 exec airjam dev                         # in another terminal
//   node tools/e2e/perf-gpu.mjs --gpu igpu --players 6 --seconds 20 [--profile] [--uncapped]
//   node tools/e2e/perf-gpu.mjs --gpu dgpu ...                    # force the NVIDIA/AMD GPU
import { chromium } from "playwright";

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const has = (k) => args.includes(`--${k}`);
const GPU = opt("gpu", "igpu");
const PLAYERS = Number(opt("players", "6"));
const SECONDS = Number(opt("seconds", "20"));
const W = Number(opt("width", "1920")), H = Number(opt("height", "1080"));
const HOST = opt("host", "http://localhost:5173");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chromeArgs = ["--ignore-gpu-blocklist", "--enable-webgl", "--use-angle=d3d11", "--autoplay-policy=no-user-gesture-required"];
if (GPU === "dgpu") chromeArgs.push("--force_high_performance_gpu");
if (has("uncapped")) chromeArgs.push("--disable-gpu-vsync", "--disable-frame-rate-limit");

const browser = await chromium.launch({ channel: "chromium", args: chromeArgs });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(`${HOST}/harness.html?players=${PLAYERS}&drive=circle`);
const hostFrame = () => page.frames().find((fr) => /\/\?debug/.test(fr.url()));
for (let i = 0; i < 180; i++) {
  const t = await hostFrame()?.evaluate(() => document.body.innerText).catch(() => "");
  if (new RegExp(`${PLAYERS} of ${PLAYERS} ready`, "i").test(t || "")) break;
  await sleep(1000);
}
const f = hostFrame();
const gpuName = await f.evaluate(() => {
  const gl = document.createElement("canvas").getContext("webgl2", { powerPreference: "high-performance" });
  const e = gl && gl.getExtension("WEBGL_debug_renderer_info");
  return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : "unknown";
});
await f.evaluate((n) => __ra.store.dispatch({ type: "settings/patch", patch: { playerSlots: Math.max(2, n) } }), PLAYERS);
await f.evaluate(() => document.querySelector("[data-lobby-root] .lobby-btn--primary").click());
for (let i = 0; i < 120; i++) {
  const h = await f.evaluate(() => __ra.controller()?.hud()).catch(() => null);
  if (h?.active && h.phase === "playing") break;
  await sleep(500);
}
await sleep(3000); // warm-up: shader compiles

let cdp = null;
if (has("profile")) {
  cdp = await page.context().newCDPSession(page);
  await cdp.send("Profiler.enable");
  await cdp.send("Profiler.setSamplingInterval", { interval: 200 });
  await cdp.send("Profiler.start");
}
const frames = await f.evaluate((secs) => new Promise((res) => {
  const out = []; let last = performance.now(); const t0 = last;
  const tick = (now) => { out.push(now - last); last = now; if (now - t0 < secs * 1000) requestAnimationFrame(tick); else res(out); };
  requestAnimationFrame(tick);
}), SECONDS);
let hot = null;
if (cdp) {
  const { profile } = await cdp.send("Profiler.stop");
  const dt = new Map();
  profile.samples.forEach((id, i) => dt.set(id, (dt.get(id) || 0) + (profile.timeDeltas[i] || 0) / 1000));
  const self = new Map(); let total = 0;
  for (const n of profile.nodes) {
    const ms = dt.get(n.id) || 0; total += ms;
    const c = n.callFrame;
    const key = `${c.functionName || "(anonymous)"}  ${(c.url || "").replace(/^.*\/(node_modules\/|src\/|assets\/)/, "$1").slice(0, 70)}:${c.lineNumber + 1}`;
    self.set(key, (self.get(key) || 0) + ms);
  }
  hot = [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([k, ms]) => `${(100 * ms / total).toFixed(1).padStart(5)}%  ${k}`);
}
const s = frames.slice().sort((a, b) => a - b);
const pct = (p) => +s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))].toFixed(1);
const views = await f.evaluate(() => __ra.controller().hud().views.length);
const report = {
  gpu: gpuName, players: PLAYERS, views, viewport: `${W}x${H}`, uncapped: has("uncapped"), seconds: SECONDS,
  frames: frames.length, fps: +(1000 / pct(50)).toFixed(1),
  frameMs: { p50: pct(50), p95: pct(95), p99: pct(99), max: +s[s.length - 1].toFixed(1) },
  slowFramesOver25ms: frames.filter((x) => x > 25).length,
  errors: errors.slice(0, 5),
};
console.log(JSON.stringify(report, null, 1));
if (hot) console.log("\nCPU self time (main thread, sampled):\n" + hot.join("\n"));
await browser.close();
