# HANDOFF — Rocket Arena → Air Jam port

**Written:** 2026-10-04
**Author:** Mavis (orchestrator), working from the original mission brief
**Status (updated 2026-10-04, session 2):** **A real shared-screen match now runs end to
end** - 1 to 6 players, one split-screen viewport each, phones as controllers, bots,
goals/replays, final whistle, rematch, car picker, event tuning, late joins. Typecheck clean, 877 tests green, production
build OK, verified headlessly on a real GPU. Session 1's two blockers (no car bodies
past 2, split screen not wired) are **fixed**; see [§13](#13-session-2-what-changed) and
[§10](#10-open-items) for what is still open. Not yet tried on a real phone.

---

## 1. The mission, in one paragraph

Port the open-source **Rocket Arena** game (a 3D rocket-car football game with real
Bullet/RocketSim physics) into the **Air Jam** platform so that a projector machine
hosts it and *players' phones become the controllers* over a LAN — with up to 4
players in split screen, controlled by touch. Graphics, physics, materials, shaders,
lighting, audio and feel must be **preserved** — this is a port, not a rewrite.

## 2. The two repos

| | Path | What it is |
|---|---|---|
| Donor | `C:\Users\Wasif\Documents\airjam-RL\rocket-arena-web\` | `MalikAhed/rocket-arena-web`, **MIT** © Malik Abuallatta. Plain ESM JS, vendored Three.js **r185**, RocketSim/Bullet compiled to WASM, ~40 MB art. Built with esbuild, served by `tools/serve.mjs` on `:4173`. |
| Target | `C:\Users\Wasif\Documents\airjam-RL\air-jam\` | pnpm + TypeScript + Vite 6 monorepo. Games live in `games/<name>/` as Vite/React 19 apps. SDK at `packages/sdk`. |
| **The port** | `air-jam\games\rocket-arena\` | The deliverable. Donor copied in byte-identically at `src/donor/**`; everything else is new. |

**The old golden rule ("never edit the donor") was RETIRED on 2026-10-04** by the
product owner (shared screen, donor edits allowed). Split screen, extra car bodies
and match start cannot be built from outside `startup.js`. Every donor edit is now
small, marked `AIR JAM PATCH`, and listed in
`air-jam/games/rocket-arena/DONOR-PATCHES.md`. The 183/183 byte-identical audit
describes the *starting point*, not the current tree.

## 3. Architecture — the one idea everything rests on

The donor exposes **no handle to its own simulation**:
- `src/donor/app/startup.js` exports only `boot()`,
- creates the `PhysicsSimulation` internally,
- caches DOM at module scope, has no teardown,
- and its input arbitration (`gamepad > touch > keyboard`, `:700-723`) is unreachable.

So the seam is **`src/airjam/seam.ts`**: it patches
`PhysicsSimulation.prototype.setControls` **before** `bootDonor()`. Vite guarantees
one module instance, so the patch is observed by the instance the donor creates
internally. (Session 1 edited no donor files; session 2 does - see DONOR-PATCHES.md. The seam is still how phone input reaches the sim.)

Because four parallel agents would otherwise collide on the core, I authored
`seam.ts` *first* and partitioned file ownership so no two agents could write the
same file. Agents depended on each other only through interfaces declared there.

## 4. Phase-by-phase: what was asked, what was delivered

| Phase | Asked | Delivered | Tests |
|---|---|---|---|
| **0** | Forensics before building | 4 parallel explorers: Air Jam contract, physics/arena, rendering/camera, match/input/HUD/audio/bots | — |
| **1** | Transplant, 1 local player | `games/rocket-arena` builds, renders pixel-faithfully, full match runs. Seam installed pre-boot. | — |
| **2** | Air Jam input replaces keyboard/gamepad | Pulse→level adapter. `jump` stays `pulse` (a press can never be lost); `boost`/`handbrake`/analogs forced to `latest`. Deadzone+expo in JS. | 30 |
| **3** | Multi-car (2, then 4) | `CarSlotRegistry`, player→slot stability across reconnect, team auto-balance, symmetric kickoff. Native cap 8, product target 6. | 55 |
| **4** | Split screen 1/2/3/4 viewports, one sim | Pure tiling geometry, per-player camera pool, renderer + post-target viewport/scissor, `setSize` re-apply guards, HUD geometry, quality map. | 102 |
| **5** | Lobby / QR join | Projector surface (QR, room code, roster, teams, ready, settings, EVENT MODE badge) + phone join flow. Real SDK `RoomQrCode`; no new dependency. | 36 |
| **6** | Phone polish | Thumb-first touch layout, per-`pointerId` multitouch, haptics, portrait **and** landscape, 4-layer stuck-input defence. | 32 |
| **7** | Match flow + **semantic agent actions** | Phase machine adapted from the donor's, stats tracker, centralised mutator config, and **17 agent actions** wired into `createAirJamApp({ agent })`. | 81 |
| **8** | Bots | Fill plan for 1–6 humans, difficulty registry, stall-proof seat source, deterministic scripted policy. | 64 |
| **9** | Parity verification | 53 typed dimensions (44 blocking), capture harness, physics comparator vs the frozen baseline, asset manifest. | 121 |
| **10** | Performance | Quality ladder, hysteretic preset governor, frame sampler, per-viewport budget model, `PROFILING.md`. | 70 |
| **11** | Harden | 7 stability invariants, failure-mode triage, agent-driven E2E match harness, two checklists. | 81 |
| **12** | Event mode | Declarative spec → plan → guard → runner → dry run, with a cycle-time model. | 53 |

**Total: 777 tests across 41 files. `tsc --noEmit` exits 0.**

## 5. Verified numbers (all measured, not asserted)

**Physics baseline** — from the real RocketSim WASM headlessly, **bitwise
deterministic** across runs (`baseline.json`):

| Metric | Value |
|---|---|
| Gravity | **650.0001 UU/s²** |
| Top speed / boosted | **1410.064** / **2300 UU/s** |
| Boost drain | **33.3334 units/s** (empty in 2.99 s) |
| Jump peak / double-jump gain | **89.102833** / **+121.934028 UU** |
| Peak braking decel | **3499.903 UU/s²** |
| Steady yaw rate | **2.3429 rad/s** (radius 372 UU) |
| Car→ball at 1053 UU/s | ball → **1663.63 UU/s** |

**Mutators, proven against the real WASM** (ball launched at 600 uu/s, sampled
after 120 ticks = 1.00 s of real physics):

| Mutator | ball X after 1 s |
|---|---|
| NORMAL | 485.43 uu |
| BOOMER (×1.75) | **920.49 uu** (1.90×) |
| HEAVY (×0.72) | **337.09 uu** (0.69×) |

Unlimited boost stays pinned at **100** for 400 held ticks where stock hits 0.

**Event mode cycle:** worst case **6:01**, typical **3:45** → ~16 matches/hour.
Countdown/celebration are exact fractions of the donor's own `COUNTDOWN_TICKS` /
`GOAL_TICKS`, not retyped numbers.

**Parity:** assets **403 files each side, 403 hashed, 0 missing / 0 extra / 0 diff**.
Checklist status: **5 pass / 0 fail / 2 blocked-upstream / 46 unverified**.

**Donor integrity: 183/183 files, 0 SHA-256 mismatches.**

## 6. The bugs I introduced, and how they were caught

The single most valuable thing in this project. Every one of these was silent.

1. **The seam passed an 8-float array to `setControls`, which reads named
   properties.** Every control became `undefined` → `NaN` → the C++ NaN guard
   (`axis(j){... :0.f}`) clamped it to **0**. **No car could ever drive.** It looked
   like a physics or match-flow bug for hours. Fix: pass the object.
2. **A `useEffect` depended on `readRaw`**, whose identity changes every render —
   so boot re-ran continuously, disposing the runtime under the live match.
3. **The lobby was hardcoded `hidden={false}`**, so an opaque panel sat over the
   running match and swallowed the donor's clicks. Found by the parity worker's
   100 % frame diff.
4. **`createSourceFor` re-entered `inputs.register` from inside `registry.claim` →
   `RangeError: Maximum call stack size exceeded`.** *Every player join crashed.*
   Found only by the multi-car worker's tests, after I had typechecked that file
   repeatedly.
5. **`teamOrder` read slot 0 instead of the first new slot** — would have put a
   phone's car on the wrong team.
6. **NaN poisoned `pendingTarget`.**
7. **Stale `arena cars` readout** — sampled before the sim handle existed.

**Process lesson:** agents repeatedly *disproved my hypotheses with evidence*
(both my bug theories, and my own measurements). That is the only reason this
converged. Do not let a future orchestrator treat an agent's disagreement as
defection.

## 7. Claims I made that turned out to be wrong

Corrected in `IMPLEMENTATION-MAP.md` §9:

1. **The donor has 3 quality tiers, not 4** (`high`/`balanced`/`potato`). `ULTRA`
   and `HIGH` both map to `high`.
2. **`adaptive-resolution.js` is dead code** — imported nowhere. The donor does *not*
   adapt resolution at runtime. I had told the user it had an adaptive controller.
3. **No shadow-map-size or particle-density knobs exist** — hard-coded 2048,
   `detailedBall` always true.
4. **Only 3 of 4 expensive post chains can ever run** (`aoSteps` needs `makeup`,
   `wideBloom` needs `original`; default is `makeup`).
5. **`engine: "experimental"` is reported by the donor too** — and *neither* build
   ever loads `constructor-config-v1.wasm`. My lead was wrong.
6. **My "TICK 0 / stuck at kickoff" evidence came from a stale `dist`** that
   predated my own lobby mount.

## 8. Licensing — read this before any commercial or event use

| Component | Licence | Note |
|---|---|---|
| Donor code | **MIT** | ✅ clean |
| Scenery | CC-BY-4.0 / **CC-BY-SA-4.0** | `painted-bush.glb` is share-alike; attribution required |
| Fonts | Archivo (OFL), Lilita One, MakeUp (LGPL) | `public/licenses/` also ships a `GPL-3.0.txt` |
| **Seer v0 bot** | **MIT** | ✅ this is the default install |
| **Necto / Nexto bots** | **CC BY-NC-SA 4.0 — NON-COMMERCIAL** | permission or do not ship |
| onnxruntime-web, meshoptimizer, webgpu-water | MIT | |

`commercialUse` is a field on every bot-difficulty entry so a build can filter.
**The default bot is MIT-licensed, so a default event build breaches nothing.**

## 9. How to build, run and verify

```powershell
# --- donor (working reference) -> http://127.0.0.1:4173/
cd C:\Users\Wasif\Documents\airjam-RL\rocket-arena-web
node tools\serve.mjs

# --- air-jam install (pnpm is NOT on PATH; always prefix with npx) ---
cd C:\Users\Wasif\Documents\airjam-RL\air-jam
npx --yes pnpm@9.9.0 install
npx --yes pnpm@9.9.0 --filter sdk build

# --- the port ---
npx --yes pnpm@9.9.0 --filter rocket-arena exec tsc --noEmit      # must be 0 errors
npx --yes pnpm@9.9.0 --filter rocket-arena exec vite build        # NOT `pnpm build`
npx --yes pnpm@9.9.0 --filter rocket-arena exec vitest run        # 777 tests

# serve the built game:
node C:\Users\Wasif\Documents\airjam-RL\_scratch\serve-dist.mjs `
     C:\Users\Wasif\Documents\airjam-RL\air-jam\games\rocket-arena\dist 5299
# then open http://127.0.0.1:5299/ and click PLAY -> BOTS -> START
```

**Gotchas that will bite you:**
- `pnpm` is not installed globally and `corepack enable` fails (`EPERM` on
  `C:\Program Files`). Use `npx --yes pnpm@9.9.0`.
- **Never** run bare `vite` on a game — the SDK reads env and throws
  `process is not defined`. Use `airjam dev` (or the static server above).
- Games must NOT be run with `pnpm build` while agents are working — it races on
  `dist/`. Use `exec vite build`.
- Playwright + Chromium works only with
  `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`.
- **Every FPS figure in this project is SwiftShader software rendering and is not
  a performance measurement.** There are no real GPU numbers.
- **`serve-dist.mjs` will "fail" after ~1 hour and that is normal.** The harness
  kills background commands at `maxRunMs` (3600000 ms). Its last line is
  `Background bash timed out after 3600000ms (exceeded maxRunMs)` — a static
  server is *supposed* to outlive foreground calls. Do not read this as a port
  bug; just re-run the command. (Same for the donor's `tools/serve.mjs`.)
- `vitest.config.mjs` includes `src/**/*.test.ts` (wided deliberately; a positional
  arg only *filters* files `include` already matched, so a narrow `include` silently
  finds nothing).

## 10. Open items

### Fixed in session 2 (kept here so nobody re-investigates them)
* ~~Grown cars get physics but no mesh~~ - cars are now built with the donor's own
  `prepareOnlineRoster` + `configureOnline`; every car has a body.
* ~~Kickoff mirror axis error~~ - `yaw180Pose` now negates X and Y (native Z is up);
  fixtures and tests were corrected together.
* ~~In-match overlay and START unmounted~~ - START launches the match through the
  `MatchDirector`; the HUD is mounted.

### Fixed in session 2b (car picker, tuning, fidelity)
* Phone **car picker** wired end to end (phone -> lobby -> roster -> donor bodies).
* **Event-mode tuning** wired: fast kickoff, short celebration, short post-match, plus
  real Unlimited boost and Heavy ball (with lobby buttons).
* **Host -> phone downlink** (boost, air/ground, "no car" spectator state) and **haptics**.
* **Mid-match joins/leaves** (bot takeover and hand-back, reconnect gets the same car).
* **Fidelity:** each car has its own paint (same-model/different-team cars were the same
  colour), contact shadows for all 6 cars, per-car jets/flames, per-viewport ball locator
  arrow, per-viewport re-orientation of trails/embers, FOV compensation for narrow tiles.
* **The phone's driving stick never worked**: `onPointerDown` never registered the finger
  (`stick-down`), so every `stick-move` was dropped. Found only by real multitouch.
* **Scripted bots** now play (set up behind the ball toward the opponent's goal, get
  goal-side, boost only when lined up) with three skill levels tied to the lobby setting.

### Not done / not verified
1. **No real phone, real Wi-Fi or real projector yet.** Touch was verified with
   emulated multitouch (CDP): stick + boost together, jump, release-to-neutral, portrait
   rotation. Haptics were verified as calls to `navigator.vibrate`, not felt. Latency on a
   crowded network and palm rejection are unverified.
2. **Sun shadows only for cars 0-1 and the ball** (donor design; see DONOR-PATCHES.md).
3. **Neural bots are 1v1 only** (a model limit); bigger matches use the scripted policy.
   Necto/Nexto are NON-COMMERCIAL (see section 8 and `BOT_FOR_DIFFICULTY`).
4. **0 of 11 baseline physics metrics verified in-browser** (unchanged from session 1).
5. **The `.wasm` has never been loaded through the real Air Jam platform asset route**
   (unchanged; `airjam dev` serves it with the right MIME type).
6. Performance was measured on one laptop GPU only (6 views at 60 fps).
7. Deployed to Render (free plan, Singapore): static site `airjam-rocket-arena` + Docker server `airjam-rocket-server`, from https://github.com/HyperionBurn/airjam-rocket-arena (orphan copy of this monorepo, unrelated media stripped, root `Dockerfile` = copy of `packages/server/Dockerfile`). See the Deploy section of the game README. Free instances sleep when idle; the first load after sleep takes about a minute.

## 11. Where things live

```
air-jam/games/rocket-arena/
  src/donor/**            183 files, byte-identical donor — NEVER EDIT
  public/**               403 files, 38.5 MB (assets 36 MB, physics 2.4 MB)
  src/airjam/seam.ts      ← THE contract. Read this first.
  src/airjam/input/       Phase 2 — pulse→level input adapter
  src/airjam/slots/       Phase 3 — CarSlotRegistry, kickoff
  src/airjam/viewports/   Phase 4 — split-screen geometry, camera pool
  src/airjam/bots/        Phase 8 — bot seats, fill plan, difficulty
  src/airjam/perf/        Phase 10 — quality ladder, frame sampler
  src/airjam/harden/      Phase 11 — invariants, triage, E2E harness
  src/airjam/parity/      Phase 9 — checklist, comparators, capture
  src/airjam/event/       Phase 12 — EVENT MODE pipeline
  src/host/               Orchestrator: runtime, seam install, lobby mount
  src/match/, src/contracts/, src/lobby/, src/controller/
  src/airjam.config.ts    createAirJamApp: metadata, controllerPath, agent, input

C:\Users\Wasif\Documents\airjam-RL\
  HANDOFF.md              this file
  IMPLEMENTATION-MAP.md   code-cited architecture + corrections (§9)
  _scratch\physics-baseline\baseline.json   frozen physics baseline
  _scratch\capture.mjs    screenshot + console harness
  _scratch\serve-dist.mjs static server
  _scratch\poll-clock.mjs clock/car-count poller
  _scratch\parity\        Phase 9's runner + capture driver
```

**Known stray:** `airjam-RL\stats.test.ts` is a **0-byte orphan** left by a Phase 9
worker that wrote to the workspace root by mistake. It is referenced by nothing
(grep: 0 matches) and sits outside `air-jam/`, so it is inert. Safe to delete;
harmless if left.

## 12. Recommended next steps, in order (session 2 view)

1. **Test on real phones** (2 then 4, iOS Safari + Chrome Android) with
   `src/airjam/harden/REAL-DEVICE-CHECKLIST.md`. This is the biggest unknown.
2. Wire the phone's car choice into the roster (`visual` per car).
3. Wire event-mode tuning (unlimited boost is one call: `sim.setUnlimitedBoost`).
4. Add a host -> phone state downlink (boost, airborne) if the phone readout matters.
5. Profile on the real projector hardware at 4 and 6 players (the numbers here are
   from one laptop GPU).
6. Decide the bot licensing story before any commercial event.

(The session 1 list below is kept for history.)

## 12b. Session 1 recommended next steps (history)

1. **Decide on the car-mesh limit** (§10.1) — it gates the whole 4-player product.
2. Fix the kickoff mirror axis, and fix the test that encodes the wrong behaviour.
3. Run a **real-GPU profiling pass** using `src/airjam/perf/PROFILING.md` (5 cells,
   ≥30 s each, discard the first 3 s, drive ≥2 goals).
4. On real hardware: test the `.wasm` through the actual Air Jam asset route; confirm
   Emscripten's ArrayBuffer fallback engages. If not, add a `.wasm` entry to the
   platform MIME map.
5. Script the 11 baseline physics scenarios so the comparator can verify them, then
   re-run the parity pass.
6. Only then mount the in-match overlay and wire `START MATCH` through a real donor
   match-start bridge.
7. Test on real phones: orientation change is flagged a **BLOCKER** by Phase 11,
   because a sticky `neutralize()` is only cleared by `rearm()`.

## 13. Session 2: what changed

**Architecture of the live match** (`air-jam/games/rocket-arena/`):

```
lobby store, phase "playing" --> MatchDirector (src/host/match-director.tsx)
                                   - reseat humans densely (seat i = slot i = car i)
                                   - plan bot cars from the REAL team split
                                   v
                       launchLocalMatch (src/host/local-match.ts)
                                   v
     donor: src/donor/app/local-multiplayer.js  (hooked into startup.js's frame fn)
       roster -> world.prepareOnlineRoster + sim.configureOnline
       per frame: 120 Hz PhysicsClock; setControls for EVERY car;
                  the Air Jam seam answers for each phone-owned car,
                  the bot driver for bot cars
       one donor ChaseCamera per car, each with its OWN camera-solver WASM instance
       one viewport per human car (own post chain sized to the rectangle)
       goal -> donor GoalPresentation / replay (full screen, scorer's camera)
```

**Real bugs found and fixed while bringing it up** (all were silent):
1. The dev server could not start: the Vite dependency scan choked on the donor's
   esbuild-only `__vite-browser-external` import.
2. **Every phone was inert:** the shell's `#root { pointer-events: none }` is inherited
   by the controller, so touches fell through to `<body>`.
3. The phone page showed the donor's static "LOADING GAME CODE" block forever.
4. **Any projector-window blur permanently killed every car:** the stuck-input guard's
   blur neutralize is sticky and nothing re-arms it. Phones are remote; host focus is
   irrelevant. Host blur/visibility no longer touch phone input.
5. **A phone unread for >1 s went stale and could never recover** (the check ran
   before the clock refresh), so the 3 s kickoff countdown would have frozen every car.
   Presence is now the "phone is gone" signal, with auto re-arm on reconnect.
6. **Only the first car asked got a jump press**: every `setControls` call re-read all
   sources and a read consumes the press. Inputs are now computed once per physics tick.
7. The room started in runtime state "playing", so phones never showed their lobby UI.
8. No transport existed for phone ready/team/name; they now ride the input payload
   (`lobby`), plus a monotonic `ballCamPresses` counter.
9. The donor's audio muted whenever the projector window lost focus.
10. The kickoff mirror used the wrong axes (see section 10).

**Verified (headless, real GPU):** 2/3/4/6-player matches, 2v2 and 3v3 teams, goal ->
celebration -> ~7 s replay -> 3-2-1 -> play, regulation end -> "BLUE WINS" -> post-match
screen -> REMATCH, overtime on a tie, 2v2 scripted bots, 1v1 neural bot, ball cam toggle
per player via a real click, phones return to their lobby UI after the match, cars reach
the donor's exact top speed (1410 uu/s), 6 views at 60 fps.

**Test tooling** (`_scratch/*.mjs`; the game README explains `harness.html`): the
built-in browser pane in this environment is hidden, so rAF never fires; use headless
Playwright (`node _scratch/end-test.mjs <outDir> 4 20`). Launch args that use the real
GPU: `--ignore-gpu-blocklist --enable-webgl --use-angle=d3d11`.

**Dev-only hooks** (stripped from production builds / gated behind `?debug`):
`harness.html`, `?drive=`, `?matchSeconds=`, `window.__ra`, `controller.debugPlaceBall`.
