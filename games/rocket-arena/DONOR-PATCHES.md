# Donor patches

`src/donor/**` started as a byte-identical copy of the MIT-licensed
[rocket-arena-web](https://github.com/MalikAhed/rocket-arena-web) (183 files, 0
SHA-256 mismatches). That rule was dropped on 2026-10-04: split screen, extra
car bodies and a match-start entry point cannot be added from outside the donor
(its `startup.js` is one closure with no handles). Every edit is listed here and
marked in the source with `AIR JAM PATCH`, so `grep -rn "AIR JAM PATCH" src/donor`
finds all of them.

Rule going forward: **a donor edit must be small, marked, listed here, and must
leave the donor's own single-player behaviour unchanged when not embedded.**

## New files (not upstream)

| File | What it is |
|---|---|
| `src/donor/app/arena-bridge.js` | Tiny rendezvous between `startup.js` and the React shell. `embedded` (set by the shell **before** boot) and `controller` (published by `startup.js`). No DOM, no sim. |
| `src/donor/app/local-multiplayer.js` | The local N-car match controller: roster setup, the per-frame driver, per-player cameras, split-screen rendering, goal/replay bookkeeping, audio for N cars, HUD data. |
| `src/donor/app/tile-viewports.js` | Pure split-screen tiling (1-6 views, gap-free). Separate so it is unit-tested without Three.js. |
| `src/donor/audio/arena-sfx.js` | Match-event sounds the donor never had: kickoff tick and "go", goal blast + horn + crowd, demolition, boost pad pickup, full-time buzzer. Synthesised with Web Audio (no assets), through one limiter into the donor's own mixer. |
| `src/donor/app/fov.js` | Pure FOV compensation for narrow split-screen tiles (partial, capped at 112 degrees). |

## Edited files

| File | Edit | Why |
|---|---|---|
| `src/donor/app/startup.js` | Imports the two new modules. | — |
| | `let localMulti = null;` next to the other late-bound state. | The controller is built after the world/effects exist. |
| | `localMulti?.afterReset()` at the end of `_e` (the donor's kickoff reset). | `_e` is reached from several places (match start, kickoff after a goal, replay finish). The local match must reset its per-match state (camera solvers, replay clock, last toucher) however it was reached. |
| | `if (localMulti?.active) return localMulti.frame(W);` first line of `wt` (the frame function). | While a local match runs, the controller drives the frame; otherwise the donor runs exactly as before. |
| | Builds `makeViewPost` + `createLocalMultiplayer({...})` and `arenaBridge.attach(...)`. Passes the donor's own sim, world, session, clock, renderer, audio objects and `_e`. | The wiring. |
| `src/donor/app/local-multiplayer.js` | Calls `ArenaSfx` on goals, demolitions, countdown ticks, kickoff, full time and nearby pad pickups. | The sounds belong to the match events this controller already detects. |
| `src/donor/app/startup.js` (cont.) | `if (arenaBridge.embedded) { an.classList.add("airjam-embedded") } else { home.show(); online.restoreIntent(); }` | In Air Jam the lobby is the projector's, not the donor's home screen. Not embedded = the donor behaves as upstream. |
| `src/donor/rendering/fennec-v2-post.js` | `if (this.sizeOverride) this.size.set(...) else getDrawingBufferSize(...)` | Each split-screen view needs its own post chain sized to its rectangle. The class sized its targets from the whole drawing buffer. |
| `src/donor/rendering/reference-post.js` | Same `sizeOverride`. | Same. |
| `src/donor/rendering/world.js` | (1) `GameWorld.update` and `updateBoostVisuals` read an optional `controlsByCar` so every car's jets, flip flames and wheel spin follow its own input. (2) `cloneWithOwnPaint`: each car gets its own paint materials (textures shared, not cloned). | (1) The donor passed one control set for "car 0" and one for "everyone else". (2) Cars cloned from one model shared materials, and team paint is written into material uniforms, so two cars of the same model on different teams ended up the same colour. |
| `src/donor/effects/car-motion.js` | `updateRibbon` split into advance + `rebuildRibbon`; new `orient(cars, camera)`. | Ribbons, ember quads and the heat bubble bake the camera into shared geometry; a split-screen match re-orients them per viewport right before each draw. |
| `src/donor/materials/park-lighting.js` | `CONTACT_SHADOW_SLOTS` 3 -> 7 (shader loop instead of three hand-written lines). | Ground contact/cast shadows for all 6 cars, not ball + 2. |
| `src/donor/audio/settings.js` | Embedded: mute only when the document is hidden, not when the window loses focus. | The projector window is routinely unfocused during an event; the donor's focus rule silenced the arena. |

## What the controller reuses (unchanged)

* `GameWorld.prepareOnlineRoster(roster)` - builds the N car bodies. Upstream calls
  it only from the online flow; it needs no network.
* `PhysicsSimulation.configureOnline(roster)` - creates the N native cars. With no
  `nativeCheckpoint` it never touches the network core.
* `MatchSession`, `GoalPresentation`, `GoalReplayBuffer`, `GoalCelebrationPhysics`,
  `PhysicsClock`, `ChaseCamera`, `SpeedLines`, `EngineAudio`, `VehicleAudio`,
  `BotController`.

## Cameras

`ChaseCamera` steps a camera solver that lives in WASM global state: two cameras
sharing one solver overwrite each other. With the default (source) physics the
solver is a *separate* legacy module (`jC`, see `physics/source-runtime.js`), so
`createCameraKernel()` in `local-multiplayer.js` instantiates one per car. Every
player gets the donor's exact camera feel; nothing is approximated.

## Known limits (not hidden)

* **Sun shadows:** the donor draws dynamic sun shadows for car 0, car 1 and the
  ball only (`GameWorld.updateSubjectShadows`). Cars 2-5 get the ground
  contact/cast shadow (see park-lighting above) but no sun shadow on other
  geometry. More suns would not just cost GPU time: the suns share one total
  light intensity, so each additional sun makes every shadow fainter.
* **Audio listener** is one for the shared speakers: the first player's camera.
* **Neural bots** are 1v1 policies; any match with more than 2 cars uses the
  scripted chaser (`src/airjam/bots/scripted-bot.ts`).
