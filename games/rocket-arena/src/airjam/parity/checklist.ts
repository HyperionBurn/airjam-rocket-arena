/**
 * Phase 9 — THE PARITY CHECKLIST, AS DATA.
 *
 * OWNER: the Phase 9 parity worker (`src/airjam/parity/**`).
 *
 * ---------------------------------------------------------------------------
 * WHY THIS IS A TABLE AND NOT A DOCUMENT
 * ---------------------------------------------------------------------------
 * The hard requirement of this port is parity, and parity is only credible if
 * somebody can ask "what is still unproven" and get a complete, checkable
 * answer. Prose cannot do that: it goes stale silently, and a paragraph that
 * says a thing is verified keeps saying it after the thing stops being true.
 *
 * So each dimension is a record with an id, an area, a concrete definition of
 * what "parity" MEANS for it, the named method that verifies it, and a
 * `blocking` flag. `summarizeParity` answers the question arithmetically.
 *
 * ---------------------------------------------------------------------------
 * THE ONE RULE THAT KEEPS THIS HONEST
 * ---------------------------------------------------------------------------
 * A `ParityDimension` carries NO status field, and that is deliberate.
 *
 * A dimension is `pass` only when a RESULT says it passed. There is no
 * "verified: true" to set by hand, so nothing in this file can quietly claim a
 * verification nobody performed. Seeding a dimension as `unverified` is the
 * default state of every dimension in this table, and stays that way until
 * evidence arrives. `BLOCKED_UPSTREAM` — an upstream defect stopped the
 * measurement — is a distinct, equally valid outcome, and is reported as such
 * rather than as either a pass or a plain failure.
 *
 * ---------------------------------------------------------------------------
 * WHERE THE DIMENSIONS COME FROM
 * ---------------------------------------------------------------------------
 * Seeded from the real surface, not from a template: the 183 files of
 * `src/donor/**`, the port's own `src/airjam/**` modules, the eleven frozen
 * metrics in `baseline.ts`, and the asset inventory. The donor's subsystem
 * directories (`audio`, `rendering`, `materials`, `effects`, `ui`, `input`,
 * `match`, `physics`, `vehicles`, `arena`, `bots`) each map to at least one
 * dimension, so a subsystem cannot be forgotten silently.
 */

import type { PhysicsMetricId } from "./baseline.js";
import type { CaptureScenario } from "./capture.js";
import type { ParityStatus } from "./physics-parity.js";

/* -------------------------------------------------------------------------- */
/* The vocabulary                                                              */
/* -------------------------------------------------------------------------- */

export type ParityArea =
  | "visual"
  | "physics"
  | "audio"
  | "ui"
  | "controls"
  | "match-flow"
  | "assets";

export const PARITY_AREAS: readonly ParityArea[] = Object.freeze([
  "visual",
  "physics",
  "audio",
  "ui",
  "controls",
  "match-flow",
  "assets",
]);

/**
 * How a dimension is verified. Every variant names a MACHINE-CHECKABLE
 * checker, except `manual`, which is admitted deliberately: some parity is
 * perceptual (does this menu feel like the donor's) and pretending otherwise
 * would be worse than saying so.
 */
export type ParityVerification =
  | {
      readonly kind: "physics-baseline";
      /** Which frozen metrics this dimension depends on. */
      readonly metrics: readonly PhysicsMetricId[];
    }
  | {
      readonly kind: "asset-inventory";
      /** Subset of the tree, e.g. `public/assets` or `public/physics`. */
      readonly tree: "public/assets" | "public/physics" | "assets/arena/collision" | "whole-port";
    }
  | {
      readonly kind: "asset-hash";
      /** A specific path whose exact bytes are authoritative. */
      readonly paths: readonly string[];
    }
  | {
      readonly kind: "capture-diff";
      readonly scenario: CaptureScenario;
      /** What the ratio means, in words, rather than a bare number. */
      readonly note: string;
    }
  | {
      readonly kind: "hud-text-diff";
      readonly scenario: CaptureScenario;
      /** Why a text comparison is or is not sufficient for this dimension. */
      readonly note?: string;
    }
  | {
      readonly kind: "sim-trace";
      /** The observable, from `?physicsDebug=1`, that settles it. */
      readonly observable: string;
    }
  | {
      readonly kind: "byte-identity";
      /** The tree that must be byte-for-byte unmodified. */
      readonly path: string;
    }
  | {
      /** Admitted honestly. Needs a human, and this harness will not fake it. */
      readonly kind: "manual";
      readonly what: string;
    };

export interface ParityDimension {
  readonly id: string;
  readonly area: ParityArea;
  readonly title: string;
  /**
   * Concretely what "parity" means for THIS dimension. Written so that
   * "verified" is decidable: a reader must be able to look at this sentence
   * and agree whether the evidence satisfies it.
   */
  readonly means: string;
  readonly verification: ParityVerification;
  /**
   * A defect here stops the release. Blocking means "the port is not the
   * donor's game" — a wrong core binary, a frozen sim, a phone that cannot
   * steer. Non-blocking means "the port is recognisably the same game with a
   * difference a human should see".
   */
  readonly blocking: boolean;
  /** Where the claim comes from. `file:line` or a module path. */
  readonly evidence?: string;
  /** Which side of the port owns the risk. */
  readonly owner: "donor" | "port" | "seam";
}

/* -------------------------------------------------------------------------- */
/* The table                                                                   */
/* -------------------------------------------------------------------------- */

const dim = (entry: ParityDimension): ParityDimension => Object.freeze(entry);

/**
 * Declared in the order a reader should work: can the thing start at all, is
 * the simulation real, is it the same simulation, then feel, then presentation,
 * then the Air Jam-specific surfaces that are new in the port.
 */
export const PARITY_CHECKLIST: readonly ParityDimension[] = Object.freeze([
  /* ---------------------------------------------------------------------- */
  /* PHYSICS — the core. Ordered: can it start, is it the same engine,       */
  /* then the individual game-feel numbers.                                  */
  /* ---------------------------------------------------------------------- */
  dim({
    id: "physics-core-binary",
    area: "physics",
    title: "The gameplay core is the donor's exact WASM binary",
    means:
      "public/physics/rocketsim-core.wasm is byte-for-byte the donor's, SHA-256 4d3b9c9f2c2227bc72d292fb5f294ab1f435e34b8ac8300527ee9d833a829405. A port with a different core is not a port; the donor itself hash-checks this and throws on mismatch.",
    verification: {
      kind: "asset-hash",
      paths: ["physics/rocketsim-core.wasm"],
    },
    blocking: true,
    evidence: "app/startup.js:781 (ORIGINAL_GAMEPLAY_CORE_SHA256), _scratch/physics-baseline/README.md",
    owner: "port",
  }),
  dim({
    id: "physics-arena-collision-meshes",
    area: "physics",
    title: "All 16 collision meshes and the manifest are present",
    means:
      "assets/arena/collision/mesh_0.cmf .. mesh_15.cmf plus manifest.json all exist. The WASM loads these to build the arena and cannot initialise without all 17, so this is a start-or-doom condition, not a fidelity concern.",
    verification: { kind: "asset-inventory", tree: "assets/arena/collision" },
    blocking: true,
    evidence: "public/assets/arena/collision/ (17 files in both repos)",
    owner: "port",
  }),
  dim({
    id: "physics-state-layout",
    area: "physics",
    title: "The 510-float state block and its offsets are the donor's",
    means:
      "state[0]=TICK, [2]=NUM_CARS, [4]=BALL, [22]=CARS with a 51-float car stride and pads at 430. Any offset drift silently reads the wrong field, so it makes every other physics measurement meaningless if it moves.",
    verification: {
      kind: "sim-trace",
      observable:
        "The snapshot's own metadata.stateLayout / metadata.carStride must equal the layout the port decodes with, and a known car slot must read a finite position with ON_GROUND consistent with the scenario.",
    },
    blocking: true,
    evidence: "physics/state-layout.js, src/airjam/seam.ts:382-412",
    owner: "seam",
  }),
  dim({
    id: "physics-sim-steps",
    area: "physics",
    title: "The simulation actually advances during a match",
    means:
      "state[0] strictly increases across the sample window once a match has started. A sim that does not step produces a still frame that looks fine in a screenshot, which is exactly why it needs a numeric gate rather than a picture.",
    verification: {
      kind: "sim-trace",
      observable:
        "nativeTickSpan = last sample state[0] - first sample state[0], from ?physicsDebug=1. Must be > 0. Corroborated by NUM_CARS >= 2 and by the match having left its opening phase.",
    },
    blocking: true,
    evidence: "diagnostics/physics-debug.js:6, src/airjam/parity/snapshot.ts assessSimProgress",
    owner: "port",
  }),
  dim({
    id: "physics-gravity",
    area: "physics",
    title: "Gravity is 650.0 UU/s²",
    means:
      "Downward acceleration is 650.0 UU/s², cross-checked two independent ways (parabola fit of the jump trajectory, and mean per-tick change in vertical velocity) which agree to 1.3e-3. This sets the whole feel of every jump and every ball arc.",
    verification: { kind: "physics-baseline", metrics: ["gravity"] },
    blocking: true,
    evidence: "_scratch/physics-baseline/baseline.json results['6-gravity']",
    owner: "donor",
  }),
  dim({
    id: "physics-top-speed",
    area: "physics",
    title: "Top speed without boost is 1410.06 UU/s",
    means:
      "Six seconds of full throttle on the pad-free lane plateaus at 1410.06 UU/s planar, reached 90 % of the way in 1.6333 s. A faster or slower car is the single most visible non-parity in a driving game.",
    verification: { kind: "physics-baseline", metrics: ["top-speed"] },
    blocking: true,
    evidence: "baseline results['1-acceleration-top-speed'].peakPlanarSpeedUUps",
    owner: "donor",
  }),
  dim({
    id: "physics-boosted-top-speed",
    area: "physics",
    title: "Boosted top speed is 2300 UU/s and supersonic arrives at 1.5917 s",
    means:
      "Boosting plateaus at 2300 UU/s, and the supersonic state begins at 1.5917 s into a boosted run. Supersonic is a visible, audible state change, so its timing is part of the presentation as well as the physics.",
    verification: { kind: "physics-baseline", metrics: ["boosted-top-speed"] },
    blocking: true,
    evidence: "baseline results['2-boosted-top-speed']",
    owner: "donor",
  }),
  dim({
    id: "physics-boost-drain",
    area: "physics",
    title: "Boost drains at 33.3334 units/s",
    means:
      "A full 100-unit gauge empties in 2.9917 s of continuous boost. This is the resource that decides how long a run can be committed, so a few percent of drift changes real strategy.",
    verification: { kind: "physics-baseline", metrics: ["boost-drain"] },
    blocking: true,
    evidence: "baseline results['2-boosted-top-speed'].boostDrainRate_unitsPerSec",
    owner: "donor",
  }),
  dim({
    id: "physics-peak-braking",
    area: "physics",
    title: "Peak braking deceleration is 3499.9 UU/s²",
    means:
      "Braking from top speed decelerates at 3499.903 UU/s² at its peak, and forward speed reaches zero 0.4167 s in. Braking is what makes a car feel planted; a softer or harder brake is immediately obvious.",
    verification: { kind: "physics-baseline", metrics: ["peak-braking"] },
    blocking: true,
    evidence: "baseline results['3a-braking'].peakBrakingDecelUUps2",
    owner: "donor",
  }),
  dim({
    id: "physics-jump-peak",
    area: "physics",
    title: "A standing jump peaks 89.10 UU above rest",
    means:
      "89.102833 UU above the settled rest height of the car body origin, in 0.975 s of airtime. Measured at the body origin, not wheel contact, so it is larger than a wheel-to-wheel apex — the comparison must use the same reference point or it is meaningless.",
    verification: { kind: "physics-baseline", metrics: ["jump-peak-above-rest", "rest-height"] },
    blocking: true,
    evidence: "baseline results['4-jump'].peakHeightAboveRestUU",
    owner: "donor",
  }),
  dim({
    id: "physics-double-jump-gain",
    area: "physics",
    title: "A double jump adds 121.93 UU over a single jump",
    means:
      "The second press lifts the peak from 89.10 UU to 211.04 UU above rest, a gain of 121.934028 UU, and fires on the release-then-press at tick 40 with no dodge serial. This is a derived jump, not an input: there is no dodge/flip control.",
    verification: { kind: "physics-baseline", metrics: ["double-jump-gain"] },
    blocking: true,
    evidence: "baseline results['5-double-jump'].gainOverSingleJumpUU",
    owner: "donor",
  }),
  dim({
    id: "physics-steady-yaw",
    area: "physics",
    title: "Steady yaw rate is 2.3429 rad/s",
    means:
      "With steer=+1 held at throttle=+1, the car settles at 2.3429 rad/s within 0.1917 s to 90 %, implying a 527.39 UU turn radius. This is the handling characteristic; a car that turns differently is a different car.",
    verification: { kind: "physics-baseline", metrics: ["steady-yaw"] },
    blocking: true,
    evidence: "baseline results['7-steering'].steadyStateYawRate_radPerSec",
    owner: "donor",
  }),
  dim({
    id: "physics-rest-height",
    area: "physics",
    title: "A settled car rests at 17.032 UU",
    means:
      "The car body origin settles at 17.031987 UU (the baseline reports 17.031986..17.031988 across scenarios) after 120 ticks of neutral input with planar speed under 0.05 UU/s. This is the zero point for every height measurement, so drift in it corrupts the jump and double-jump figures.",
    verification: { kind: "physics-baseline", metrics: ["rest-height"] },
    blocking: false,
    evidence: "baseline results['4-jump'].settle.restHeightUU",
    owner: "donor",
  }),
  dim({
    id: "physics-determinism",
    area: "physics",
    title: "Identical inputs produce bitwise identical runs",
    means:
      "The same scripted run in two independently created WASM arenas agrees with max absolute delta of exactly 0 across position, velocity, forward vector, angular velocity and boost gauge over 720 ticks. Any non-zero delta is a failure, with no tolerance. Scope limit the baseline itself states: the determinism scenario has no car-to-car or car-to-ball contact, so no RNG-driven demolition/respawn path is covered by this claim.",
    verification: { kind: "physics-baseline", metrics: ["determinism-max-delta"] },
    blocking: true,
    evidence: "baseline results['10-determinism'].bitwiseIdentical",
    owner: "donor",
  }),
  dim({
    id: "physics-pad-grid-and-yield",
    area: "physics",
    title: "34 boost pads, 6 of them big, granting 100 units",
    means:
      "The arena reports 34 pads of which 6 are big, and a big pad takes the gauge from 0 to 100 exactly. Pad layout drives route choice, so a moved or missing pad changes how the arena plays even when the car is identical.",
    verification: { kind: "physics-baseline", metrics: ["big-pad-boost"] },
    blocking: false,
    evidence: "baseline results['9-boost-pad'], SIM_ENGINE_FACTS.totalBoostPads",
    owner: "donor",
  }),
  dim({
    id: "physics-ball-interaction",
    area: "physics",
    title: "Car-to-ball contact behaves identically",
    means:
      "Driving a car into the ball increments BALL_HIT_SERIAL and launches the ball at the donor's numbers (1663.63 UU/s immediately after contact, on a 1053.30 UU/s approach at 1.425 s). The ball is the reason the game exists, so this is checked separately from car feel.",
    verification: {
      kind: "sim-trace",
      observable:
        "BALL_HIT_SERIAL (car offset + 46) must increment from 0 on contact, and the ball's planar+vertical speed after contact must be within tolerance of the baseline. Requires the ball deliberately placed in the lane; the baseline parks it at (-4600,-4600,93) for every other scenario to keep it off the racing line.",
    },
    blocking: true,
    evidence: "baseline results['8-ball-interaction']",
    owner: "donor",
  }),
  dim({
    id: "physics-slot-growth",
    area: "physics",
    title: "The arena grows through the supported entry point only",
    means:
      "Cars are added exclusively via the WASM export _physics_addCar(team, preset), up to MAX_CARS = 8, and the bridge refuses beyond that. A port that reaches into the heap or synthesises a car another way is not driving the donor's arena.",
    verification: {
      kind: "sim-trace",
      observable: "NUM_CARS (state[2]) rises to the expected roster size and never exceeds 8; every added car reports a valid carConfigurations entry.",
    },
    blocking: true,
    evidence: "src/airjam/seam.ts:46-47, :281-293; bridge.cpp MAX_CARS",
    owner: "seam",
  }),
  dim({
    id: "physics-control-order",
    area: "physics",
    title: "The 8 control floats reach the sim in the ABI's order",
    means:
      "throttle, steer, pitch, yaw, roll, jump, boost, handbrake, as written by native/network-state.cpp:15. The order is load-bearing: writing yaw into the jump slot produces a car that jumps when it turns, which is a plausible-looking bug rather than an obvious one.",
    verification: {
      kind: "sim-trace",
      observable:
        "A scripted control write of a single distinct axis must move only that axis's observable (e.g. steer=+1 with everything else 0 changes yaw rate and no other body state).",
    },
    blocking: true,
    evidence: "src/airjam/seam.ts:58-77, native/network-state.cpp:15",
    owner: "seam",
  }),
  dim({
    id: "physics-unboosted-pad-free-lane",
    area: "physics",
    title: "Top speed is measured on a pad-free lane",
    means:
      "The 1410.06 UU/s figure is only valid on a lane that crosses no boost pad, because small pads grant +11.722 units each and inflate the result. The lane x = 470 clears every pad column; a run on x = 0 measures the pad grid, not the car.",
    verification: {
      kind: "manual",
      what:
        "Confirm the comparison run uses a pad-free lane and reports padFreeRun, and that padGaugeGainsDuringRun is empty. The baseline documents two real contaminations of exactly this kind, so this must be re-checked rather than assumed.",
    },
    blocking: false,
    evidence: "_scratch/physics-baseline/README.md 'Contamination guards'",
    owner: "donor",
  }),

  /* ---------------------------------------------------------------------- */
  /* VISUAL                                                                */
  /* ---------------------------------------------------------------------- */
  dim({
    id: "visual-donor-bytes-unmodified",
    area: "visual",
    title: "The donor is byte-identical and unedited",
    means:
      "All 183 files under src/donor/** are byte-for-byte what the donor shipped. This is the load-bearing assumption of the entire port: every visual, physics, material, shader and audio claim below is a claim about code this port does not own, so one edited byte invalidates the basis of the comparison.",
    verification: { kind: "byte-identity", path: "src/donor" },
    blocking: true,
    evidence: "183 files confirmed by directory count",
    owner: "donor",
  }),
  dim({
    id: "visual-scene-and-lighting",
    area: "visual",
    title: "Arena, world and the reference lighting rig are the donor's",
    means:
      "The same scene graph and the same lighting rig: the arena, the daylight sky, and the baked field lighting, all from rendering/world.js and rendering/reference-lighting.js, unchanged. Lighting is the largest single contributor to whether a frame reads as 'the same game'.",
    verification: {
      kind: "capture-diff",
      scenario: "match-running",
      note:
        "A lighting or world change moves a large fraction of pixels at once. On a same-machine comparison this crosses the `review` band; on different hardware it is not comparable at all (see image-diff.ts WEBGL_DIFF_GUIDANCE).",
    },
    blocking: true,
    evidence: "src/donor/rendering/world.js, rendering/reference-lighting.js",
    owner: "donor",
  }),
  dim({
    id: "visual-post-chain",
    area: "visual",
    title: "The custom post chain is intact and unconverted",
    means:
      "The donor has NO EffectComposer. Post is a custom chain on a WebGLRenderTarget (rendering/reference-post.js:76-78) plus the Fennec V2 post shaders. Replacing it with Three's stock composer would change the frame while leaving every number identical, which is why this is checked by capture and not by code.",
    verification: {
      kind: "capture-diff",
      scenario: "match-running",
      note:
        "Bloom, vignette and tone mapping all land in this chain. Compare the pair side by side; a graded `review` or `regression` here is a post-chain question, not a lighting one.",
    },
    blocking: true,
    evidence: "src/donor/rendering/reference-post.js:76-78, rendering/fennec-v2-post.js",
    owner: "donor",
  }),
  dim({
    id: "visual-materials-and-theme",
    area: "visual",
    title: "Materials, theme and the car paint are the donor's",
    means:
      "rendering/theme-materials.js and rendering/theme.js drive the surface appearance, including the garage customisation path. Materials are where a port most plausibly degrades quietly: a default material where the donor had a themed one still renders, just wrong.",
    verification: {
      kind: "capture-diff",
      scenario: "home",
      note: "The home screen exercises the garage materials and the theme without needing a match to start, so it stays verifiable while the match-start defect is open.",
    },
    blocking: true,
    evidence: "src/donor/rendering/theme-materials.js, rendering/theme.js",
    owner: "donor",
  }),
  dim({
    id: "visual-car-models",
    area: "visual",
    title: "The car and ball models are the donor's",
    means:
      "The sketchfab-sourced car models (fennec-v2, octane, spectre, challenger, amethyst, takumi, vesper) and the ball load and display as the donor does, including their ground AO and material splits. A car that loads as null renders an empty arena, which is visible but only if someone looks.",
    verification: { kind: "asset-inventory", tree: "public/assets" },
    blocking: true,
    evidence: "public/assets/sketchfab/, public/assets/game-car/geometry.bin + model.gltf",
    owner: "donor",
  }),
  dim({
    id: "visual-fx-and-boost-plume",
    area: "visual",
    title: "Effects, including the boost plume, are the donor's",
    means:
      "The effects/ set and the golden-boost plume, sparks and turbulence textures render as the donor does. The turbulence is animated, so this dimension is graded rather than exact even on one machine — see the noise band in the diff grading.",
    verification: {
      kind: "capture-diff",
      scenario: "match-kickoff",
      note:
        "Animated effects guarantee a non-zero ratio between any two captures. Expect and tolerate the `noise` band; a `regression` is a change in the effect, not in the sampling.",
    },
    blocking: false,
    evidence: "src/donor/effects/ (12 files), public/assets/golden-boost/",
    owner: "donor",
  }),
  dim({
    id: "visual-field-texture-worker",
    area: "visual",
    title: "The field-light worker resolves at the URL the donor hard-codes",
    means:
      "materials/reference-field-texture.js builds `new Worker('/src/materials/reference-field-worker.js', {type:'module'})` as a plain runtime string, so no bundler rewrites it. It must be reachable at exactly that path, in both dev and build, or the field lighting silently never arrives.",
    verification: {
      kind: "sim-trace",
      observable:
        "A network trace of the capture must show a 200 for /src/materials/reference-field-worker.js and no failed request for it. Vite's own build emits it as a second rollup entry for exactly this reason.",
    },
    blocking: true,
    evidence: "src/donor/materials/reference-field-texture.js, vite.config.ts DONOR_FIELD_WORKER_ENTRY",
    owner: "port",
  }),
  dim({
    id: "visual-camera-and-viewports",
    area: "visual",
    title: "The chase camera behaves as the donor's, per viewport",
    means:
      "rendering/camera.js's chase behaviour, ball-cam and the per-player camera are preserved. The port adds N viewports where the donor had one, so parity means each viewport's camera is the DONOR's camera, not a shared one: a shared camera is explicitly forbidden (seam.ts:251).",
    verification: {
      kind: "capture-diff",
      scenario: "match-running",
      note: "One capture proves the single-viewport case. The N-viewport case needs one capture per layout (solo, split-v, split-h, duo-top, quad) and is a separate pass.",
    },
    blocking: true,
    evidence: "src/donor/rendering/camera.js, src/airjam/seam.ts:251-259, viewports/camera-pool.ts",
    owner: "seam",
  }),
  dim({
    id: "visual-fonts",
    area: "visual",
    title: "The interface fonts are the donor's",
    means:
      "Archivo 400/500/700 at 16 px and Lilita One 400 at 20 px, which the donor loads explicitly during boot. A fallback font changes every HUD measurement and every text advance while leaving the physics untouched.",
    verification: {
      kind: "hud-text-diff",
      scenario: "home",
      note:
        "Check the HUD text dump and the network trace for the font files. The text diff cannot see a font, so this is a capture/trace dimension with a text cross-check, not a text-only one.",
    },
    blocking: false,
    evidence: "app/startup.js:789-797",
    owner: "donor",
  }),

  /* ---------------------------------------------------------------------- */
  /* AUDIO                                                                 */
  /* ---------------------------------------------------------------------- */
  dim({
    id: "audio-graph-and-buses",
    area: "audio",
    title: "The audio graph and its buses are the donor's",
    means:
      "audio/context.js builds the same mixer topology — input gain, output gain, master volume, active/muted state — so the port's sound passes through the same buses. A port that opens its own AudioContext alongside the donor's would double every sound rather than replace one.",
    verification: {
      kind: "manual",
      what:
        "Count live AudioContexts in the page (exactly one must exist) and confirm the donor's mixer is the one carrying sound. A doubled sound is the characteristic symptom of a second context.",
    },
    blocking: true,
    evidence: "src/donor/audio/context.js",
    owner: "seam",
  }),
  dim({
    id: "audio-vehicle-engine",
    area: "audio",
    title: "Vehicle engine audio is driven by the same physics state",
    means:
      "audio/vehicle.js modulates from the sim's own speed, boost and surface state, so a car that reaches 1410.06 UU/s sounds the way the donor's does. Engine audio wired to a different speed source is the classic way an audio port detaches from a physics port.",
    verification: {
      kind: "manual",
      what:
        "At a known planar speed, confirm the engine pitch/load follows the SIM's reported speed rather than a synthetic curve. Cross-check against the physics trace from the same window.",
    },
    blocking: true,
    evidence: "src/donor/audio/vehicle.js, audio/engine.js",
    owner: "donor",
  }),
  dim({
    id: "audio-boost-and-impacts",
    area: "audio",
    title: "Boost, impacts and ball audio fire on the donor's events",
    means:
      "audio/boost.js, audio/impacts.js, audio/ball.js and audio/spatial.js trigger on the same state transitions the donor uses — boost start and empty, wheel impacts, ball contact — and pan from the same positions. Triggering on a timer or on the port's own events instead is a parity break that no screenshot shows.",
    verification: {
      kind: "manual",
      what:
        "Cross-check the audio trigger times against the physics trace: the boost-empty sound must coincide with the gauge reaching 0, and a ball-contact sound with the BALL_HIT_SERIAL increment.",
    },
    blocking: true,
    evidence: "src/donor/audio/boost.js, audio/impacts.js, audio/ball.js, audio/spatial.js",
    owner: "donor",
  }),
  dim({
    id: "audio-autoplay-and-settings",
    area: "audio",
    title: "AudioContext resume policy and audio settings are preserved",
    means:
      "The AudioContext is created suspended and resumed on the first user gesture, as browsers require, and audio/settings.js persists volume/mute through the same store. An AudioContext resumed eagerly is blocked by the browser and produces silence with no error.",
    verification: {
      kind: "manual",
      what:
        "Confirm the context is resumed only after a gesture, and that muting and volume survive a reload. Silence with no console error is the expected failure mode here.",
    },
    blocking: false,
    evidence: "src/donor/audio/context.js, audio/settings.js, audio/reset.js",
    owner: "donor",
  }),

  /* ---------------------------------------------------------------------- */
  /* UI                                                                    */
  /* ---------------------------------------------------------------------- */
  dim({
    id: "ui-home-and-menu",
    area: "ui",
    title: "The home screen and match menu are the donor's",
    means:
      "ui/home-screen.js and ui/match-menu.js present the same entries, in the same order, with the same labels, and the same menu art. This is the first thing a player sees and the easiest thing for a port to alter while adding its own lobby.",
    verification: {
      kind: "hud-text-diff",
      scenario: "home",
      note:
        "The HUD text diff compares normalised line SETS, so a reordered menu is not reported as a break but a missing or renamed entry is. Verified without needing the match to start.",
    },
    blocking: true,
    evidence: "src/donor/ui/home-screen.js, ui/match-menu.js, public/assets/menu/",
    owner: "donor",
  }),
  dim({
    id: "ui-hud-and-boost-gauge",
    area: "ui",
    title: "The in-match HUD and boost gauge are the donor's",
    means:
      "ui/hud.js, ui/arcade-hud.js and ui/boost-gauge.js draw the same elements from the same state, including ball-cam and the fuel readout. The HUD is the most-modified surface in any port, so it is checked per viewport rather than once.",
    verification: {
      kind: "capture-diff",
      scenario: "match-kickoff",
      note: "One capture per viewport layout; the HUD is drawn per rectangle, so a 4-way split is a different picture from a solo view even with identical physics.",
    },
    blocking: true,
    evidence: "src/donor/ui/hud.js, ui/arcade-hud.js, ui/boost-gauge.js, public/assets/ui/hud/",
    owner: "donor",
  }),
  dim({
    id: "ui-loading-surface",
    area: "ui",
    title: "The loading surface reports load success and failure correctly",
    means:
      "`#loading`'s data-state reaches a terminal success value, and on failure data-state=\"error\" with the message in .load__note. The donor swallows its own boot errors (startup.js:11-15), so this element is the ONLY authoritative success signal it exposes, and the port's boot readout depends on it.",
    verification: {
      kind: "hud-text-diff",
      scenario: "home",
      note: "Read data-state and the .load__note text directly, not just the rendered body text. A load that hangs part-way leaves the element populated but not terminal.",
    },
    blocking: true,
    evidence: "src/donor/app/startup.js:11-15, src/shell/donor-bridge.ts:79-111",
    owner: "seam",
  }),
  dim({
    id: "ui-pause-and-settings",
    area: "ui",
    title: "Pause, settings, graphics editor and touch editor are the donor's",
    means:
      "ui/pause-menu.js, ui/settings-panel.js, ui/settings-controls.js, ui/graphics-editor.js and ui/touch-editor.js all behave as the donor does. The touch editor is the one the port is most likely to have changed deliberately, and deliberate is not the same as parity: its default bindings must still match the donor's.",
    verification: {
      kind: "hud-text-diff",
      scenario: "home",
      note: "Entry labels and default values via the text dump. Visual styling of these panels is not covered by the text diff and needs a capture.",
    },
    blocking: false,
    evidence: "src/donor/ui/pause-menu.js, ui/settings-panel.js, ui/graphics-editor.js, ui/touch-editor.js",
    owner: "donor",
  }),
  dim({
    id: "ui-icons",
    area: "ui",
    title: "The icon set resolves",
    means:
      "ui/icons.js resolves every icon it references, from public/assets/ui/ and the inline ranks/illustrations SVGs. A missing icon is a silent gap, not an error, so it is caught by the asset inventory rather than by looking.",
    verification: { kind: "asset-inventory", tree: "public/assets" },
    blocking: false,
    evidence: "src/donor/ui/icons.js, public/assets/ui/, public/assets/online/ranks.svg",
    owner: "donor",
  }),

  /* ---------------------------------------------------------------------- */
  /* CONTROLS                                                              */
  /* ---------------------------------------------------------------------- */
  dim({
    id: "controls-device-arbitration",
    area: "controls",
    title: "Exactly one input device wins: gamepad > touch > keyboard",
    means:
      "The donor's own precedence, unchanged. Two devices driving one car produce a car that fights itself, and the symptom (a car that will not hold a line) looks like a physics problem rather than an input one.",
    verification: {
      kind: "sim-trace",
      observable:
        "With a keyboard held and a gamepad connected, the sim's per-tick control array must contain the gamepad's values and the keyboard's must not appear. The arbitration itself is unreachable from outside the donor, so this is verified by what reaches the sim, not by calling the arbiter.",
    },
    blocking: true,
    evidence: "src/donor/app/startup.js:700-723 (not reachable from outside; verified at the seam)",
    owner: "donor",
  }),
  dim({
    id: "controls-pulse-to-level",
    area: "controls",
    title: "Air Jam pulses are presented to the sim as stable levels",
    means:
      "Air Jam booleans default to `pulse`: a press latches, survives a release, and is delivered exactly once. The donor ABI is purely LEVEL-triggered. A pulse boost flickers and a `latest` jump is missed, so every source must expose a level view and the sim must only ever see levels.",
    verification: {
      kind: "sim-trace",
      observable:
        "One Air Jam press must produce a contiguous run of sim ticks with the corresponding control high, and zero ticks high after the release is consumed. A single-tick blip is the failure mode.",
    },
    blocking: true,
    evidence: "src/airjam/seam.ts:27-36, src/airjam/input/airjam-input-source.ts",
    owner: "seam",
  }),
  dim({
    id: "controls-control-shape",
    area: "controls",
    title: "Raw stick values are clamped and NaN-guarded before physics",
    means:
      "Axes are clamped to [-1, 1] and non-finite values become 0, and booleans are emitted as exactly 0 or 1 because the bridge thresholds at > 0.5. A phone's raw stick range reaching the WASM is a way to make one car behave differently from another.",
    verification: {
      kind: "sim-trace",
      observable:
        "Write a control with a value of 5 and one of NaN; the array the sim receives must be 1 and 0 respectively. Pure function, so this is also a unit test on sanitizeControls rather than a browser check.",
    },
    blocking: true,
    evidence: "src/airjam/seam.ts:124-145",
    owner: "seam",
  }),
  dim({
    id: "controls-neutral-on-blur",
    area: "controls",
    title: "Blur, disconnect and teardown neutralise every car",
    means:
      "Losing focus, a disconnect or a teardown writes neutral controls for EVERY car in the arena in one write, including cars the port has no binding for. A car left accelerating because the browser swallowed a blur is the worst failure mode at a live event.",
    verification: {
      kind: "sim-trace",
      observable:
        "After a blur, the full controls block for all 8 slots must be zero. One write to _physics_getControlsPtr covers cars with no Air Jam binding, which is the point of the blunt net.",
    },
    blocking: true,
    evidence: "src/airjam/seam.ts:452-471, src/airjam/input/stuck-input-guard.ts",
    owner: "seam",
  }),
  dim({
    id: "controls-player-to-slot-mapping",
    area: "controls",
    title: "Air Jam players map onto integer car slots, and free slots on release",
    means:
      "The registry is the single owner of the player-id to car-slot mapping, including team assignment, the kickoff placement, and releasing a slot back to the pool on leave or reconnect. Two players sharing a slot, or a slot never released, both break the roster.",
    verification: {
      kind: "sim-trace",
      observable:
        "NUM_CARS and the per-car garage team must track the live slot registry exactly: after a release, the car must be neutral before its slot is reused.",
    },
    blocking: true,
    evidence: "src/airjam/seam.ts:176-190, src/airjam/slots/car-slot-registry.ts, slots/growth.ts",
    owner: "seam",
  }),
  dim({
    id: "controls-phone-drives-car",
    area: "controls",
    title: "A phone controller demonstrably drives a car",
    means:
      "The end-to-end claim: an Air Jam controller's stick and buttons move a real car in a real match, at the donor's handling numbers. Every dimension above is a component; this is the one that says the product works.",
    verification: {
      kind: "sim-trace",
      observable:
        "With one Air Jam controller bound, the car's planar speed must reach the top-speed band and the yaw rate the steady-yaw band when driven, and must fall to neutral on blur.",
    },
    blocking: true,
    evidence: "src/airjam/input/install-input-sources.ts, src/airjam/slots/",
    owner: "seam",
  }),

  /* ---------------------------------------------------------------------- */
  /* MATCH FLOW                                                            */
  /* ---------------------------------------------------------------------- */
  dim({
    id: "match-leaves-opening-phase",
    area: "match-flow",
    title: "A match starts and leaves its opening phase",
    means:
      "After the start sequence the match progresses past kickoff into play, with the physics stepping and the ball touchable. This is the currently OPEN DEFECT: the port's match never leaves its opening phase, so the sim does not step and every measurement-dependent dimension is blocked behind it.",
    verification: {
      kind: "sim-trace",
      observable:
        "state[0] increases across the sample window and the sample phases include one beyond the opening set. Until this passes, no physics or match-flow dimension below it can be honestly claimed.",
    },
    blocking: true,
    evidence: "src/airjam/parity/physics-parity.ts MATCH_START_DEFECT; physics-clock.js clock.js:56-68",
    owner: "port",
  }),
  dim({
    id: "match-kickoff-placement",
    area: "match-flow",
    title: "Kickoff places cars and the ball as the donor does",
    means:
      "Cars spawn at the donor's kickoff poses and the ball starts at (0, 0, 93), with the right-handed car frame (fwd x right = up; for fwd=(0,1,0) that means right=(-1,0,0)). A mirrored frame is rejected by the native setter, so this either works or throws — there is no quiet version.",
    verification: {
      kind: "sim-trace",
      observable:
        "Car positions in the first sample after start must match the donor's kickoff poses to float32 precision, and the placement call must return success.",
    },
    blocking: true,
    evidence: "src/airjam/slots/kickoff.ts, _scratch/physics-baseline/README.md (frame convention)",
    owner: "seam",
  }),
  dim({
    id: "match-clock-hold-until-touch",
    area: "match-flow",
    title: "The clock holds at 5:00 until the ball has moved — and that is correct",
    means:
      "The clock only advances when `clockStarted || kickoffTouched`, and clockStarted is sticky once the first touch lands; it is cleared again on every kickoff, so the hold RESUMES after every goal. A clock sitting at 5:00 is the DONOR'S OWN DESIGN. Treating it as a fault is the single most common wrong diagnosis on this game, and it is listed here so that it is checked rather than assumed either way.",
    verification: {
      kind: "sim-trace",
      observable:
        "Before the first touch, clock.started must be false AND the native tick must still be advancing. Those two together distinguish the benign hold from the open defect: the clock is held, the simulation is not stopped.",
    },
    blocking: false,
    evidence: "src/donor/match/session.js:70-71, :98; src/airjam/harden/triage.ts 'clock-frozen-at-opening-value'",
    owner: "donor",
  }),
  dim({
    id: "match-goal-and-reset",
    area: "match-flow",
    title: "A goal scores, announces and resets to kickoff",
    means:
      "GOAL (state[1]) increments, the goal announcement plays, cars and the ball return to the kickoff poses, and the clock hold resumes. Goal explosion is disabled in the baseline's engine configuration, so the goal path must be verified without relying on it.",
    verification: {
      kind: "sim-trace",
      observable:
        "state[1] must increment exactly once per goal and the kickoff poses must be restored, with the clock hold resumed (clockStarted back to false).",
    },
    blocking: true,
    evidence: "src/donor/match/, src/airjam/harden/invariants.ts",
    owner: "donor",
  }),
  dim({
    id: "match-score-and-balance",
    area: "match-flow",
    title: "Score and team balance behave as the donor's",
    means:
      "Score tracks goals per team, and team assignment is balanced as the donor's, with the kickoff side alternating the way the donor does. A port that always puts a joining player on blue is a real asymmetry that no frame comparison shows.",
    verification: {
      kind: "sim-trace",
      observable:
        "Per-car garage team and the score state must match the donor's assignment for the same sequence of joins.",
    },
    blocking: true,
    evidence: "src/airjam/slots/team-balance.ts, src/donor/physics/state-layout.js getTeamAssignment",
    owner: "seam",
  }),
  dim({
    id: "match-player-lifecycle",
    area: "match-flow",
    title: "Join, leave and reconnect are handled without stranding a car",
    means:
      "An Air Jam player leaving mid-match releases their slot, neutralises their car and lets the roster refill (bots included) without breaking the match state. This is Air Jam-specific and has no donor counterpart, so 'parity' here means: it must not perturb anything the donor owns.",
    verification: {
      kind: "sim-trace",
      observable:
        "A leave mid-match must leave the remaining cars at their exact pre-leave state block apart from the released slot, and the ball, pads and score must be untouched.",
    },
    blocking: true,
    evidence: "src/airjam/slots/car-slot-registry.ts, src/airjam/bots/bot-seats.ts, src/airjam/bots/bot-fill-plan.ts",
    owner: "seam",
  }),

  /* ---------------------------------------------------------------------- */
  /* ASSETS                                                                */
  /* ---------------------------------------------------------------------- */
  dim({
    id: "assets-public-tree",
    area: "assets",
    title: "The port's public asset tree is the donor's, file for file",
    means:
      "All 211 files under public/assets (~36 MB) are present with identical bytes. Compared in BOTH directions: a missing file is a defect, and so is an extra one, because an unrequested extra is either a stale leftover or an asset the port invented.",
    verification: { kind: "asset-inventory", tree: "public/assets" },
    blocking: true,
    evidence: "211 files, 36.1 MB, in both repos",
    owner: "port",
  }),
  dim({
    id: "assets-physics-tree",
    area: "assets",
    title: "The port's public physics tree is the donor's, file for file",
    means:
      "All 9 files under public/physics (both Emscripten builds, their glue, the build manifests and the third-party notices) are present with identical bytes, including rocketsim-core.wasm at the recorded SHA-256.",
    verification: { kind: "asset-inventory", tree: "public/physics" },
    blocking: true,
    evidence: "9 files, 2.4 MB, in both repos",
    owner: "port",
  }),
  dim({
    id: "assets-bots-and-worker",
    area: "assets",
    title: "The bot ONNX models and the bot worker load",
    means:
      "policy.onnx for each bot (seer, necto) plus the worker script the donor builds a URL for by hand load from public/, verbatim. The donor's worker serialises requests onto a single promise chain, so one unanswered `decide` leaves botPending true forever: no car ever reaches the ball, kickoffTouched stays false, and the clock sits at 5:00 for the whole session with NO error. A re-bundled worker is therefore a silent total failure.",
    verification: {
      kind: "asset-inventory",
      tree: "public/assets",
    },
    blocking: true,
    evidence: "public/assets/bot/, public/assets/worker-*.js; vite.config.ts DONOR_WORKER_URL",
    owner: "port",
  }),
  dim({
    id: "assets-no-donor-edits",
    area: "assets",
    title: "No donor asset was edited, moved or re-encoded",
    means:
      "Every file under public/assets, public/physics and src/donor/** is byte-identical to the donor's. Distinct from the two tree dimensions above because a re-encode keeps the path and the size class while changing the bytes, which a size-only manifest would miss entirely.",
    verification: { kind: "asset-hash", paths: ["public/assets", "public/physics", "src/donor"] },
    blocking: true,
    evidence: "_scratch/parity/inventory.mjs (SHA-256 per file)",
    owner: "donor",
  }),
]);

/* -------------------------------------------------------------------------- */
/* Queries                                                                     */
/* -------------------------------------------------------------------------- */

const BY_ID: ReadonlyMap<string, ParityDimension> = new Map(PARITY_CHECKLIST.map((d) => [d.id, d]));

/** Look up one dimension. Returns undefined for an unknown id. */
export function parityDimension(id: string): ParityDimension | undefined {
  return BY_ID.get(id);
}

/** Every dimension in one area, in declaration order. */
export function dimensionsInArea(area: ParityArea): readonly ParityDimension[] {
  return PARITY_CHECKLIST.filter((d) => d.area === area);
}

/** Every dimension that, if wrong, stops the release. */
export function blockingDimensions(): readonly ParityDimension[] {
  return PARITY_CHECKLIST.filter((d) => d.blocking);
}

/**
 * Structural self-check, run by the test suite. A checklist with a duplicate id
 * or a dimension missing a verification method is a checklist that silently
 * under-reports, which is the one failure mode this file cannot detect itself.
 */
export function validateChecklist(
  dimensions: readonly ParityDimension[] = PARITY_CHECKLIST,
): readonly string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const dimension of dimensions) {
    if (!dimension.id) problems.push("a dimension has no id");
    if (seen.has(dimension.id)) problems.push(`duplicate id "${dimension.id}"`);
    seen.add(dimension.id);
    if (!dimension.area) problems.push(`"${dimension.id}" has no area`);
    if (!PARITY_AREAS.includes(dimension.area)) {
      problems.push(`"${dimension.id}" has unknown area "${dimension.area}"`);
    }
    if (!dimension.means || dimension.means.length < 20) {
      problems.push(`"${dimension.id}" does not say what parity means for it`);
    }
    if (!dimension.verification || !dimension.verification.kind) {
      problems.push(`"${dimension.id}" has no verification method`);
    }
    if (typeof dimension.blocking !== "boolean") {
      problems.push(`"${dimension.id}" has no blocking flag`);
    }
  }
  for (const area of PARITY_AREAS) {
    if (!dimensions.some((d) => d.area === area)) problems.push(`area "${area}" has no dimensions`);
  }
  return problems;
}

/* -------------------------------------------------------------------------- */
/* Results — the only place a status can come from                            */
/* -------------------------------------------------------------------------- */

export interface DimensionResult {
  readonly dimensionId: string;
  readonly status: ParityStatus;
  /** What was actually observed. Required unless the status is `unverified`. */
  readonly evidence?: string;
  /** Where the evidence lives — a scratch path, a trace, a command. */
  readonly source?: string;
}

export interface AreaSummary {
  readonly area: ParityArea;
  readonly total: number;
  readonly blocking: number;
  readonly pass: number;
  readonly fail: number;
  readonly unverified: number;
  readonly blocked: number;
}

export interface ParitySummary {
  readonly total: number;
  readonly blockingTotal: number;
  readonly byStatus: Readonly<Record<ParityStatus, number>>;
  readonly byArea: readonly AreaSummary[];
  /**
   * The gate. A release is blocked when any BLOCKING dimension failed. Blocked
   * and unverified dimensions are reported but do NOT fail the gate on their
   * own: a blocked dimension is a known upstream fault, and a run that cannot
   * reach it has not thereby proven the port broken.
   */
  readonly releaseBlocked: boolean;
  readonly blockingFailures: readonly string[];
  readonly blockingBlocked: readonly string[];
  readonly questions: readonly string[];
}

const STATUS_ORDER: readonly ParityStatus[] = Object.freeze([
  "pass",
  "fail",
  "blocked-upstream",
  "unverified",
]);

const EMPTY_STATUS_COUNTS: Readonly<Record<ParityStatus, number>> = Object.freeze({
  pass: 0,
  fail: 0,
  unverified: 0,
  "blocked-upstream": 0,
});

/**
 * Roll up dimensions and results. A dimension with no result is `unverified` —
 * never `pass`. This is the single function that answers "what is left to
 * prove", and it is the reason a result can contradict the checklist but the
 * checklist can never contradict a result.
 */
export function summarizeParity(
  results: readonly DimensionResult[],
  dimensions: readonly ParityDimension[] = PARITY_CHECKLIST,
): ParitySummary {
  const resultById = new Map(results.map((r) => [r.dimensionId, r]));
  const byStatus = { ...EMPTY_STATUS_COUNTS };
  const perArea = new Map<ParityArea, { total: number; blocking: number; statuses: Record<ParityStatus, number> }>();

  for (const dimension of dimensions) {
    const status = resultById.get(dimension.id)?.status ?? "unverified";
    byStatus[status] += 1;
    const entry = perArea.get(dimension.area) ?? {
      total: 0,
      blocking: 0,
      statuses: { ...EMPTY_STATUS_COUNTS },
    };
    entry.total += 1;
    if (dimension.blocking) entry.blocking += 1;
    entry.statuses[status] += 1;
    perArea.set(dimension.area, entry);
  }

  const byArea: readonly AreaSummary[] = PARITY_AREAS.map((area) => {
    const entry = perArea.get(area) ?? {
      total: 0,
      blocking: 0,
      statuses: { ...EMPTY_STATUS_COUNTS },
    };
    return Object.freeze({
      area,
      total: entry.total,
      blocking: entry.blocking,
      pass: entry.statuses.pass,
      fail: entry.statuses.fail,
      unverified: entry.statuses.unverified,
      blocked: entry.statuses["blocked-upstream"],
    });
  });

  const blockingFailures = dimensions
    .filter((d) => d.blocking && resultById.get(d.id)?.status === "fail")
    .map((d) => d.id);
  const blockingBlocked = dimensions
    .filter((d) => d.blocking && resultById.get(d.id)?.status === "blocked-upstream")
    .map((d) => d.id);
  const questions = dimensions
    .filter((d) => {
      const status = resultById.get(d.id)?.status ?? "unverified";
      return status === "unverified" || status === "blocked-upstream";
    })
    .map((d) => d.id);

  return Object.freeze({
    total: dimensions.length,
    blockingTotal: dimensions.filter((d) => d.blocking).length,
    byStatus: Object.freeze({ ...byStatus }),
    byArea: Object.freeze(byArea),
    releaseBlocked: blockingFailures.length > 0,
    blockingFailures: Object.freeze(blockingFailures),
    blockingBlocked: Object.freeze(blockingBlocked),
    questions: Object.freeze(questions),
  });
}

/** Status column order, so two reports read the same way. */
export const STATUS_ORDER_FOR_TABLES = STATUS_ORDER;
