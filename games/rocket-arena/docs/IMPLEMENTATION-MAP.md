# Rocket Arena → Air Jam: Implementation Map

**Status:** Phase 0 (forensic) complete. Phase 1 (transplant) in progress.
**Rule:** donor is MIT-licensed; port, don't rewrite. All facts below are code-verified
with `file:line` citations from the analysis passes.

---

## 1. Verified ground truth

| Fact | Value | Source |
|---|---|---|
| Donor stack | plain ESM JS, esbuild, vendored Three.js **r185** | `src/vendor/three.js:10` (`const id="185"`) |
| Donor size | 183 src files, 3.2 MB, + ~40 MB art | — |
| Physics | **RocketSim/Bullet compiled to WASM** | `public/physics/rocketsim-core.wasm` (632 KB) |
| Native source | `native/bridge.cpp.gz` + `network-state.cpp`, Emscripten 4.0.10 | `native/README.md` |
| Cars per world | **MAX_CARS = 8** | `bridge.cpp` `constexpr int MAX_CARS = 8` |
| Protocol ceiling | 6 | `src/online/protocol.js:11` |
| Sim rate | **120 Hz**, input 60 Hz (2 ticks/command) | `src/online/protocol.js:6,8` |
| State block | 510 f32; car stride 51; pads @430 (40×2) | `src/physics/state-layout.js` |
| Air Jam games | Vite 6 + React 19 + TS + Tailwind 4 | `games/minimal/package.json` |
| Air Jam transport | Socket.IO via Air Jam server | `packages/sdk/src/.../input-manager.ts` |
| Air Jam input tick | 16 ms default (~60 Hz), `setInterval`, **no blur auto-pause** | `use-controller-tick.ts:16` |
| Air Jam host tick | `useHostTick({mode:"fixed"})` accumulator+alpha | `use-host-tick.ts:29-54` |

**Mission targets vs capacity:** 2 players ✅, 4 players ✅, 6 players ✅ — all within
the native 8-car limit. No physics work required to hit the mission's player counts.

---

## 2. THE integration seam: input

This is the single highest-risk mismatch, and it is resolvable.

### Donor side — level-triggered, 8 raw float32 per car
There is **no** `setControls` export. Inputs are written *directly into the WASM heap*
at `controlsPtr + slot*32`. Authority, `native/network-state.cpp:15`:

```cpp
void writeControls(float* p,const CarControls& c){
  p[0]=c.throttle;p[1]=c.steer;p[2]=c.pitch;p[3]=c.yaw;p[4]=c.roll;
  p[5]=c.jump;p[6]=c.boost;p[7]=c.handbrake;}
```

| idx | field | kind | range |
|---|---|---|---|
| 0 | `throttle` | analog | `[-1,1]`, −1 = reverse |
| 1 | `steer` | analog | `[-1,1]` |
| 2 | `pitch` | analog | `[-1,1]` |
| 3 | `yaw` | analog | `[-1,1]` |
| 4 | `roll` | analog | `[-1,1]` |
| 5 | `jump` | bool | threshold `> 0.5` |
| 6 | `boost` | bool | threshold `> 0.5` |
| 7 | `handbrake` | bool | threshold `> 0.5` |

Consequences that shape the phone controller:
- **No dodge/flip button exists.** Flips are *derived* by RocketSim from `jump` +
  analog direction. So the phone must give a direction at the moment of jump.
  → joystick-at-jump-time gives free front/side/back flips.
- **Double jump is not an input** — internal state machine, `jump` pressed again.
- **Air control = pitch/yaw/roll analog axes.** One joystick, three meanings by
  ground/air context. This is exactly the mission's requested mapping.
- **The ABI is purely level-triggered.** Holding `jump` does not repeat-jump.
  Buttons are thresholded at `>0.5`; `NaN/Inf` → `false`. Analogs are clamped, and
  `NaN/Inf` → `0`. The bridge is defensive, so a malformed phone packet degrades safely.
- No deadzone/expo in the bridge — **all stick shaping must happen in JS before the write.**
- `NEUTRAL = [0,0,0,0,0,0,0,0]` — the exact value to write on disconnect.

### Air Jam side — pulse vs latest
`packages/sdk/src/.../input-manager.ts:234-249`:
- **boolean → `pulse` (default, no config needed)**: a `true` press *latches* and survives
  a `false` release in the buffer; it is delivered **exactly once**, then consumed
  (`:263-291`, `:309-314`). → **a jump press can never be lost between frames.**
- **vector `{x,y}` → `latest`** (stateless). Scalars are *not* vectors.
- `behavior: { pulse[], hold[], latest[] }`; declaring a field twice **throws** (`:218-222`).
- `hold` on a vector **never returns to zero once activated** → wrong for a
  self-centring joystick. Use `latest` and send the current value every frame, zeros included.
- There is **no `released` edge** — a pulse boolean gives press only.

### The adapter (the actual design)
| Control | Air Jam declaration | Host treatment | Why |
|---|---|---|---|
| `jump` | default `pulse` | one-shot → write `1` for one sim tick, then `0` | matches level ABI; RocketSim derives the edge itself; each tap = one jump, so double-jump is free |
| `boost` | `latest` | held level | must persist; a pulse would flicker the boost |
| `handbrake` | `latest` | held level | powerslide is a hold |
| `throttle`/`steer` | `latest` scalar or vector | held level | joystick must self-centre |
| `pitch`/`yaw`/`roll` | `latest` | held level | air control axes |

So: **one level-latch in the host converts Air Jam's edge/pulse semantics into the
donor's level-triggered ABI.** No donor change required.

### Stuck-input protection (mission requirement)
`useControllerTick` does **not** auto-pause on tab blur, and the input buffer is
last-value-wins. So the host must, on `visibilitychange`/`blur`/presence-`connected:false`,
write `NEUTRAL` for that car and stop trusting it. `games/pong` already establishes this
pattern (`use-pong-controller-input-runtime.ts:52-60`).

---

## 3. Split screen — feasible, contained

- **No `EffectComposer`.** Post is a *custom* chain on a `WebGLRenderTarget` named `main`
  plus mip targets (`src/rendering/reference-post.js:76-78`).
- The vendored Three r185 render-target path **carries its own viewport/scissor**
  (`src/vendor/three.js:14239-14268`, `:28935`, `:29034-29052`).
  → `main.setViewport(x,y,w,h); main.setScissor(...); main.setScissorTest(true)` confines
  **the scene render and the entire post chain to one rectangle with zero shader edits.**
  This is the lowest-risk route. Rendering the scene N× full-canvas and scissoring only the
  composite is *not* viable (N× fragment cost).
- The renderer supports `setViewport`/`setScissor`/`setScissorTest` and the GL state is only
  pushed on change — cheap. **The game uses none of them today**, so this is additive.
- **Trap:** `setSize` resets the viewport to full-canvas. Viewport rects must be re-applied
  after every `setSize`. Single hook point: `src/app/startup.js:673-678` (resize handler).
- `setPixelRatio` (init + preset change, `:601`/`:626`) and `setSize` (init + resize,
  `:600`/`:677`) are **never per-frame** — no per-frame resolution churn today.
- **Per-camera (must instantiate per player):** chase/ball camera; speed-lines overlay
  (has its own `Scene`+`Camera`, rendered with `autoClear=false`, `startup.js:974`);
  camera shake.
- **World-global (share across viewports):** geometry, materials, textures, lighting rig,
  environment/probes, goal explosion, demolition, boost trails, crowd audio.
- Viewport framebuffers are naturally ~960×540 at 4-way 1080p — keep effects rich, do not
  downscale quality globally.

---

## 3b. The single-player assumptions (exact sites to replace)

The canonical control object is produced **byte-identically by four independent files** —
`src/input/keyboard.js:22-31`, `src/input/gamepad.js:33-42`, `src/input/touch.js:51-60`,
`src/bots/actions.js:2-11` — so there is exactly one shape to satisfy:

```js
{ throttle: 0, steer: 0, pitch: 0, yaw: 0, roll: 0, jump: false, boost: false, handbrake: false }
```

`handbrake` is powerslide on the ground and the air-roll modifier in the air — so the
mission's "powerslide becomes air roll" idea is already the donor's own semantics.
Ranges are **not** clamped by the contract (each producer clamps individually), so the
phone controller must clamp.

**Good news:** the sim API is `sim.setControls(carIndex, controls)` — already the exact
N-player shape. It is called once for the human (`startup.js:721-723`) and once for the
bot (`startup.js:753`). Supporting 4 players is calling it N times with N objects.

Single-player assumptions to replace:
| Site | Assumption | Fix |
|---|---|---|
| `startup.js:700-723` | one device wins by priority `gamepad > touch > keyboard` (`:712`) | per-car input router: one slot per Air Jam controller |
| `startup.js:700-723` | `read()` has side effects (fires `onBallCamToggle` / `onReset` / `onBallControl`) | do **not** read all devices and pick later; route per car instead |
| `src/input/gamepad.js` | single local gamepad only | superseded by Air Jam input; keep as a dev fallback |
| `src/audio/engine.js` | engine voices hardcoded to exactly 2 | per-car voice count driven by roster size |
| `ui/match-menu.js:120-139` | match HUD is DOM, `position: fixed` to the viewport | must become viewport-relative for split screen |
| `ui/hud.js` | is **not** the match HUD (it is the settings/garage shell) | match HUD is in `match-menu.js` |

Match lifecycle already exists and is reusable: `src/match/session.js` (timing constants
`:3-9`, state object `:13-29`, `start()` `:31-49`, `tick()` `:55-91` — the whole state
machine), plus `defaults.js` (21 lines) for team sizes/score limits/overtime.
Existing touch input is **ADAPT, not replace and not reuse as-is**.

## 4. KEEP / ADAPT / DELETE

**KEEP verbatim** — `src/physics/*`, `src/arena/*`, `src/vehicles/*`, `src/materials/*`,
`src/rendering/*`, `src/effects/*`, `src/audio/*`, `src/bots/*`, `src/match/*`,
`src/vendor/*`, `public/assets/**`, `public/physics/rocketsim-core.{js,wasm}`,
`public/assets/arena/collision/**` (16 `mesh_N.cmf` — physics cannot init without them).

**ADAPT** — render loop (add viewport/scissor + N cameras), `startup.js` (mount into React
canvas, strip online boot), input ownership (keyboard/gamepad → Air Jam), HUD (per-viewport),
audio (single shared world mix).

**DELETE** — `src/online/*` (Supabase, prediction/reconciliation, snapshot buffer, protocol
netcode), `server/*` (rooms, pg, ranked, auth), `tools/online-*`, `public/assets/online/`,
`public/physics/rocketsim-network.*` and `constructor-config-v1.wasm` (dead).
The WAN reconciliation model is **unnecessary**: all humans feed one local simulation.

**Already-donor features the mission asked for (do not rebuild):**
- **Goal replay already exists** — rolling buffer, "REPLAY MATCH RECORDING 10.0s", `ESC` skips.
  Observed live. A goal scored during the drive test (0→1).
- Boost pads incl. respawn boost (0→60 observed), clock/overtime, match flow, bot AI
  (ONNX: necto/nexto/seer), goal celebration, split-safe procedural boost pads.

---

## 5. Blocking risks (verified, with fixes)

1. **🔴 WASM MIME.** The platform's local-build asset route
   (`apps/platform/src/app/airjam-local-builds/[gameId]/[[...assetPath]]/route.ts:15-38`)
   has **no `.wasm` entry** → serves `application/octet-stream`; with `nosniff`,
   `WebAssembly.instantiateStreaming` **rejects**.
   **Fix:** Emscripten's generated glue already falls back to `fetch().arrayBuffer()` +
   `WebAssembly.instantiate(bytes)` on MIME failure. Verify empirically; if it fails,
   force the ArrayBuffer path in the shim (not by editing the WASM). Alternative is a
   platform-side MIME map change (outside a game's control).
2. **Iframe sandbox.** Host runs in an iframe, `allow-same-origin allow-scripts`
   (effectively no isolation). `allow="autoplay gamepad fullscreen gyroscope"` is granted.
   **No orientation lock** — the phone controller must support portrait *and* landscape
   (matching `code-review`/`pong`).
3. **Audio autoplay.** Autoplay permitted but the AudioContext still needs a gesture.
   Engine audio will sit `blocked` until someone touches the projector. Ship a
   "tap to enable sound" affordance; do not assume `ready`.
4. **rAF unconstrained** — no throttling found. Good.
5. `useControllerTick` is `setInterval` and does not auto-pause on blur → covered by the
   neutral-input rule in §2.

## 6. Licensing (verified, matters for an event product)
- Donor code: **MIT** (Malik Abuallatta) ✅
- Scenery: CC-BY-4.0 / **CC-BY-SA-4.0** (`painted-bush.glb` is share-alike) — attribution required
- Fonts: Archivo (OFL), Lilita One, MakeUp; `public/licenses/` ships GPL-3.0.txt + MakeUp-LGPL-3.0.txt
- **Bot models (necto/nexto): CC BY-NC-SA 4.0 — NON-COMMERCIAL** (per in-game attribution).
  This is the one genuine licensing constraint on commercial/event use of bots.

## 7. Exact commands
```bash
# donor (reference build) — http://127.0.0.1:4173/
cd rocket-arena-web && npm install && node tools/serve.mjs
# air-jam install (pnpm is not global here)
cd air-jam && npx --yes pnpm@9.9.0 install
npx --yes pnpm@9.9.0 --filter sdk build
# run a game
cd air-jam/games/<game> && npx --yes pnpm@9.9.0 exec airjam dev   # server :4000, game :5173
```
Note: games must NOT be run with bare `vite` — the SDK reads env and throws
`process is not defined`. `games/*` is already a workspace glob, so a new game dir is
auto-registered.

## 8. Performance honesty
All donor FPS figures captured so far (6–10 fps) are **SwiftShader software rendering** in
headless Chromium and are **not** performance measurements. No GPU-backed numbers have been
measured yet. Real 1/2/4-player FPS is unmeasured and must not be claimed until profiled
on a real GPU.

---

## 9. CORRECTIONS (Phase 10 verified these; sections 1-3 were wrong on these points)

Phase 10's worker read the donor's graphics code instead of trusting my Phase 0 notes.
Four earlier claims were wrong:

1. **The donor has THREE quality tiers, not four** — `settings/schema.js:55-93` defines
   `high` / `balanced` / `potato`. `ULTRA` and `HIGH` BOTH map to `high`; nothing sits
   between them. `balanced` and `potato` differ only in `pixelRatio` (0.7 / 0.6). The
   4-value `QualityPreset` in `seam.ts` is a product-level abstraction with no 1:1 donor
   equivalent - it must not be read as 4 donor settings.
2. **`src/rendering/adaptive-resolution.js` is DEAD CODE.** `AdaptiveResolution` is
   referenced only by its own definition and imported nowhere. The donor does **NOT** adapt
   resolution at runtime. (This does confirm there is no per-frame resolution churn:
   `setPixelRatio` / `setSize` are init-and-resize only, `startup.js:601,626,600,677`.)
3. **No shadow-map-size and no particle-density knobs exist.** Shadow size is hard-coded to
   2048 (`vehicles/diagnostics.js:10` -> `world.js:588`) for every tier; `detailedBall` is
   `true` in all three tiers. A quality ladder must record these as `fixed` rather than
   pretend to control them. The environment/probe is a one-shot PMREM (`startup.js:609`,
   cached `:616`) and is never refreshed.
4. **Only 3 of the 4 expensive post chains can ever run.** `aoSteps` requires the `makeup`
   renderer and `wideBloom` requires `original` (`reference-graphics.js:71`), but the
   shipped default is `renderer: 'makeup'` (`:7`). FXAA is not a separate pass - it rides
   the always-run `postFragment` (`reference-post.js:140`).

Also: the donor's `FrameProfiler` (which does expose `snapshot()` with p50/p95/fps/
droppedTicks) is **unreachable from outside** - a module-local `const` at `startup.js:561`,
never exported. A port-side frame sampler must use `requestAnimationFrame` itself.

**Load-bearing positive finding:** 4-way split screen is **fill-rate neutral** - each
viewport is 960x540, so `fillRatio == 1` against 1080p. When a match runs late, spend the
expensive post chain (`aoSteps`), NOT `renderScale`. (3-way does not tile the canvas, so its
fill ratio is honestly 0.75.)
