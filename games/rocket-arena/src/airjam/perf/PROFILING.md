# Phase 10 — Profiling procedure (Rocket Arena)

**Owner:** the Phase 10 worker (`src/airjam/perf/**`).
**Status:** this procedure has NOT been run. There is no GPU in the build
environment. Every number below is either a policy target chosen for the event or
a value read from donor source with a `file:line`. No measured GPU number exists
anywhere in this directory, and none is invented.

---

## 0. Read this first: three donor facts that change the plan

1. **The donor's `AdaptiveResolution` is dead code.**
   `rendering/adaptive-resolution.js` is the only definition of the class and a
   repo-wide search for `AdaptiveResolution` / `adaptive-resolution` returns
   nothing else — it is imported nowhere and instantiated nowhere. The donor
   therefore does *not* already adapt resolution at runtime. This matters
   because it means there is no per-frame resolution churn to preserve:
   `renderer.setPixelRatio` is called at `app/startup.js:601` (init) and `:626`
   (preset change) only, and `setSize` at `:600` and `:677` only.

2. **The donor's `FrameProfiler` cannot be read from outside.**
   It is a module-local `const He` at `app/startup.js:561` with a public
   `snapshot()` (`diagnostics/frame-profiler.js:120-206`) that already reports
   p50/p95/p99/fps/droppedTicks — but it is never exported or published. The
   only consumer is the on-screen overlay (`ui/hud.js:101,318`). A repo-wide
   search for a `window.*` assignment returns one hit,
   `window.__THREE__` in `vendor/three.js`, which is a Three.js version banner.
   So the port samples `requestAnimationFrame` itself
   (`frame-sampler.ts`, `createRafFrameSource`). The donor's overlay is still
   the best qualitative cross-check and should be read during every run.

3. **The donor has three quality tiers, not four, and two of them are nearly
   identical.** `potato` and `balanced` (`settings/schema.js:55-80`) differ
   *only* in `pixelRatio` (0.6 vs 0.7) — same `shadows: false`, `effects: false`,
   `antialias: false`, `environment: false`. The seam's four presets
   (`seam.ts:240`) therefore map onto the donor with `ULTRA` and `HIGH` both
   landing on the donor's `high`. Do not go looking for a fourth donor tier.

---

## 1. Why the model says resolution is the wrong lever

`viewport-budget.ts` derives this from geometry, and the derivation is worth
repeating because it decides the whole procedure.

At 4-way on 1080p the quad layout is 2x2 (`viewports/layouts.ts:80`), so each
viewport framebuffer is **960x540**. Each viewport renders the *whole* arena
through its own camera, so N viewports shade N x (canvasPixels / N) =
canvasPixels. **Splitting the canvas is fill-rate neutral.** Verified by test:
`fillRatio === 1` for 1, 2, 3, 4 and 6 viewports.

What *does* grow with N is the post chain and the draw-call count: the donor
renders via `renderGame(scene, camera)` (`app/startup.js:583-599`), so the whole
chain runs once per camera. At `ULTRA` with the shipped `makeup` renderer that is
a 7-tap SSAO at half resolution plus two blurs **per viewport**.

**Therefore: when a match is late, spend `aoSteps` first, not `renderScale`.**
Dropping render scale shrinks an already-small 960x540 buffer and buys almost
nothing while making the image visibly soft on a 3-5 m screen. This is the
concrete meaning of the brief's "keep effects rich and do not globally downgrade
quality".

---

## 2. What to measure

Use the harness. From a browser console or a debug panel:

```ts
import { createRafPump, runMeasurement, PROVENANCE_GPU }
  from "@/airjam/perf/index.js";

const report = await runMeasurement(
  createRafPump(window),
  {
    preset: "ULTRA",          // the preset actually under test
    viewportCount: 4,         // the real split in use
    targetFps: 60,            // the PROJECTOR's rate, not the laptop's
    durationMs: 60_000,
    scenario: "4-way, full arena, both teams boosting",
  },
  PROVENANCE_GPU,
);
console.table(report.stats, report.verdict);
```

`report.stats` gives p50/p95/p99/worst/fps plus `inferredDroppedFrames`.
`report.verdict` is the pass/fail result.

**Simultaneously read the donor's own overlay** ("8 fps 121.5 ms frame"). If our
p95 and the donor's differ by more than ~2x, our rAF sampler is being
interleaved with the donor's `FrameScheduler` differently than expected and the
sample is not trustworthy. Investigate before recording any number.

### The matrix — measure all of these

| Viewports | Preset | Grid | Why this row exists |
|---|---|---|---|
| 1 | ULTRA | 1x1 | Solo ceiling. The richest thing the game can do. |
| 2 | HIGH | 1x2 | Two vertical halves. |
| 4 | HIGH | 2x2 | The likely event default. The interesting one. |
| 4 | BALANCED | 2x2 | The seam's 4-way starting preset. |
| 6 | PERFORMANCE | 2x3 | The 6-player ceiling. |

Run every row. Do not extrapolate 4-way to 6-way: the grid changes shape (2x2 to
2x3) so per-viewport pixels change as well as the count.

---

## 3. How long, and what to do during the run

- **Minimum 30 s per cell, 60 s preferred.** Long enough that the donor's own
  1.5 s adaptive-resolution window (`rendering/adaptive-resolution.js:22`)
  completes many times over.
- **Discard the first 3 s.** Shader compilation, the PMREM environment probe
  (`app/startup.js:607-611`) and the stadium asset load all land there.
- **Drive the scene.** A static arena is not the load case. The bar is about
  goals, so the run must include: a kickoff, at least 2 goals, sustained boosting
  on both teams, and at least one aerial scramble. Note in `scenario` which of
  these occurred; a run without a goal is not a valid cell.
- **No window focus changes, no alt-tab, no lid state change** during a run. The
  governor ignores deltas over 150 ms (`preset-resolver.ts`,
  `maxDeltaMs`) so a pause will not corrupt the preset, but it *will* leave a gap
  in the percentiles and make the p95 optimistic.

---

## 4. The pass/fail bar

`PROJECTOR_CRITERIA` in `harness.ts` — **these are policy targets, not
measurements.** They are set high because a projector is watched by a crowd:

| Criterion | Limit | Why |
|---|---|---|
| p95 frame time | <= 1.00 x budget (16.67 ms at 60 Hz) | A p95 over budget means regularly missing vsync. |
| Worst single frame | <= 2 x budget (33.3 ms) | Above this it is a *visible* hitch. |
| Frames over budget | <= 0.5% | Any sustained slip reads as judder. |

p95 rather than mean is deliberate. A run can average 16.7 ms while still
hitching; there is a test that demonstrates exactly this (599 good frames plus
one 90 ms frame passes a mean check and fails this one).

**Two unknowns must be recorded, not assumed:**

1. **The projector's actual refresh rate.** The donor sniffs it from the p10
   display interval and snaps to a known list
   (`frame-profiler.js:11-14,149-154`). Read it off the donor overlay and pass
   it as `targetFps`. A 120 Hz laptop and a 60 Hz projector differ by 2x in
   budget and guessing wrong either halves or doubles the bar.
2. **Whether the projector is fed by HDMI from a mirrored display.** Mirroring
   can add a compositor copy that is not attributable to the game.

---

## 5. What the procedure decides

- If 4-way ULTRA passes, the event can ship ULTRA at 4-way. Do not pre-emptively
  downgrade; the seam's instruction is explicit.
- If 4-way ULTRA fails but 4-way BALANCED passes, that confirms the diagnosis in
  §1: it is post-chain fragment cost, not fill. Ship BALANCED, and consider
  keeping ULTRA for 1-2 way where there is only one chain.
- If 4-way fails at BALANCED, the problem is not quality. Look at
  `drawCalls` in the donor overlay's phase breakdown
  (`frame-profiler.js:7` — the phases are `sim, scene, camera, prep, bloom,
  final`). A large `scene` phase with a healthy `bloom` means geometry/culling
  cost, which no preset in the ladder addresses.
- Only if 4-way fails at PERFORMANCE should `renderScale` be considered, and
  then only as a measured last resort with the softness stated as a known cost.

---

## 6. What CANNOT be measured in this environment

Stated plainly, because these are the limits of the deliverable:

- **Any GPU frame time, FPS, or fill cost.** No GPU, no driver, no display.
- **Whether the projector path (HDMI, resolution, refresh) holds 60 Hz.**
- **Shader compilation time on real drivers.** Universal `high` compiles a
  `PARK_BANK_DETAIL` variant (`arena/park.js:37-40`, `material.needsUpdate`),
  which is a real stall on some drivers and invisible here.
- **The cost of an SSAO tap on real hardware.** `fullResEquivalentDraws` in
  `viewport-budget.ts` is a *relative* proxy built from tap and divisor counts
  read from `reference-post.js:102-142`. It is explicitly not a measured cost.
- **Mobile/phone thermal behaviour.** The players' phones are the inputs, and
  the event laptop is the renderer; the two are not the same device.
- **The calibration figures quoted in the brief** (donor dropping 164 of 1127
  frames; a React+SDK-augmented build dropping 473 of 781) are **headless
  SwiftShader software-rendering** numbers. They are useful as a *ratio* of
  relative software cost and must never be presented as GPU performance or as a
  projector frame-rate forecast. `harness.ts` ships
  `PROVENANCE_SOFTWARE` so a software run is labelled on every report.
