// AIR JAM PATCH (new file, not in the upstream donor).
//
// Local N-car match on ONE shared screen, one viewport per player.
//
// The upstream donor can only run "1 human + 1 bot" offline. Its multi-car
// machinery (GameWorld.prepareOnlineRoster, PhysicsSimulation.configureOnline)
// exists but is wired to the online netcode. This module reuses exactly those
// two entry points for a LOCAL roster and replaces only the per-frame driver
// (`wt` in startup.js) while a local match is active:
//
//   * physics    PhysicsClock + sim.step(1) at 120 Hz, as in the donor, but
//                setControls() is issued for every car. Air Jam's seam
//                (src/airjam/seam.ts) answers each call with that phone's
//                controls, so nothing here knows about phones.
//   * cameras    one donor ChaseCamera per car. The camera solver is a separate
//                legacy WASM module (see source-runtime.js), so each camera gets
//                its OWN instance: exact donor feel for every player, no shared
//                smoothing state. The vertical FOV is widened for narrow tiles so
//                a split-screen view keeps most of the full-screen field of view.
//   * rendering  one viewport per human car. Post-processing is confined to the
//                viewport rectangle by giving each view its own post chain sized
//                to that rectangle (see `sizeOverride` in the two post classes).
//                Everything that bakes the camera into shared geometry (dodge
//                ribbons, wheel trails, embers, the ball speed trail, the ball
//                locator arrow) is re-oriented for EACH view right before it draws.
//   * effects    each car's jets / flip flames / wheel spin follow that car's own
//                controls (read back from the physics controls block).
//   * match      the donor's MatchSession, goal presentation and replay, with a
//                single full-screen replay camera; plus event-mode tuning
//                (fast kickoff, short celebration, turbo boost, heavy ball).
//   * events     hits, goals, demolitions and phase changes are published to the
//                host (haptics on the phones are driven from these).
//
// Everything that is not the frame driver is the donor's own code.

import { F, mt } from "../vendor/three.js";
import { jC } from "../vendor/legacy-physics.js";
import { ChaseCamera } from "../rendering/camera.js";
import { SpeedLines } from "../effects/speed-lines.js";
import { BallLocator } from "../effects/ball-locator.js";
import { EngineAudio } from "../audio/engine.js";
import { VehicleAudio } from "../audio/vehicle.js";
import { ArenaSfx } from "../audio/arena-sfx.js";
import { applyDuskLook } from "../rendering/arena-look.js";
import { GoalBurst, BoostGlow } from "../effects/arena-fx.js";
import { CAR_STATE, CAR_STATE_STRIDE, STATE_LAYOUT, ro } from "../physics/state-layout.js";
import { resolveVisualHitboxFamily } from "../physics/presets.js";
import { tileViewports } from "./tile-viewports.js";
import { widenFov } from "./fov.js";

const MAX_LOCAL_CARS = 6;
const DEFAULT_OPPONENT_VISUAL = "octane-original";
/** A "heavy" ball gives back this much of its speed after every car touch. */
const HEAVY_BALL_RETAIN = 0.78;
/** Fast kickoffs count down from 1 s instead of 3 s (the first one stays full length). */
const FAST_KICKOFF_TICKS = 120;
/** Short goal celebrations skip the replay once the 2 s celebration has played. */
const SHORT_CELEBRATION_SECONDS = 2.0;

export const DEFAULT_TUNING = Object.freeze({
  boost: "normal",
  ball: "normal",
  kickoffReset: "normal",
  goalCelebration: "full",
});

/** An independent copy of the donor's camera solver (`_v0/_v1/_v2`). */
async function createCameraKernel() {
  const core = await jC();
  const viewPtr = core._v0();
  let view = null;
  return {
    stepView(input) {
      const buffer = core.HEAPF64.buffer;
      if (!view || view.buffer !== buffer) view = new Float64Array(buffer, viewPtr, 42);
      view.set(input, 0);
      core._v1();
      return view;
    },
    resetView() {
      core._v2();
      view = null;
    },
  };
}

const neutralControlSet = () => ({
  throttle: 0,
  steer: 0,
  pitch: 0,
  yaw: 0,
  roll: 0,
  jump: false,
  boost: false,
  handbrake: false,
});

/** A URL flag, safe outside a browser (unit tests run in node). */
const urlFlag = (name) => typeof window !== "undefined" && Boolean(window.location) && new URLSearchParams(window.location.search).has(name);

export function createLocalMultiplayer(ctx) {
  const sfx = new ArenaSfx();
  const st = {
    active: false,
    starting: false,
    paused: false,
    count: 0,
    teams: [],
    cams: [],
    camFov: [],
    camState: [],
    views: [],
    posts: [],
    speedLines: [],
    locators: [],
    vehicleAudios: [],
    applied: [],
    neutralSet: [],
    jumpAcc: [],
    demoPrev: [],
    ballHit: [],
    lastTouch: -1,
    pendingGoal: null,
    lastTime: 0,
    replayClock: 0,
    lastReplayRecord: -1,
    padHistory: null,
    savedPlayerIndex: null,
    baseEngines: 0,
    botDriver: null,
    kickoffTicks: 0,
    kickoffCount: 0,
    prevCountdown: 0,
    flash: 0,
    flashColor: [0, 0, 0],
    tuning: { ...DEFAULT_TUNING },
    prevPhase: null,
    listeners: new Set(),
  };

  const replayState = new Float32Array(ctx.clock.currState.length);
  const replayBasis = new F();
  const replayMatrix = new mt();
  const padPoint = new F();
  const goalCameraRect = { x: 0, y: 0, width: 1, height: 1 };

  const emit = (event) => {
    for (const listener of st.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.warn("[rocket-arena/arena] an event listener threw", error);
      }
    }
  };

  /* ------------------------------------------------------------------ */
  /* Ball manipulation (heavy ball, dev helpers)                          */
  /* ------------------------------------------------------------------ */

  /** Rewrite the 18-float ball block through `_physics_setBallState`. */
  const editBall = (edit) => {
    const module = ctx.sim.module;
    const state = ctx.sim.state;
    const floats = 18;
    const ptr = module._malloc(floats * 4);
    const base = ptr >> 2;
    for (let i = 0; i < floats; i++) module.HEAPF32[base + i] = state[STATE_LAYOUT.BALL + i];
    edit(module.HEAPF32, base);
    const accepted = module._physics_setBallState(ptr) === 1;
    module._free(ptr);
    return accepted;
  };

  /* ------------------------------------------------------------------ */
  /* Physics driver                                                      */
  /* ------------------------------------------------------------------ */

  /** Called by the donor's own kickoff reset (`_e` in startup.js), however it was reached. */
  const afterReset = () => {
    if (!st.active) return;
    const { session } = ctx;
    st.pendingGoal = null;
    st.replayClock = 0;
    st.lastReplayRecord = -1;
    st.lastTouch = -1;
    st.kickoffTicks = 0;
    st.kickoffCount++;
    for (const cam of st.cams) cam.kernel.resetView();
    syncBallHit();
    syncPadHistory();
    // Event mode: "fast kickoff reset". The match's very first kickoff keeps its
    // full countdown so every phone has time to be ready.
    if (st.tuning.kickoffReset === "fast" && st.kickoffCount > 1 && session.state.phase === "kickoff") {
      session.phaseTicks = Math.min(session.phaseTicks, FAST_KICKOFF_TICKS);
      session.state.countdown = Math.max(1, Math.ceil(session.phaseTicks / 120));
    }
  };

  const resetLocalKickoff = () => ctx.resetKickoff();

  const syncBallHit = () => {
    const state = ctx.sim.state;
    for (let i = 0; i < st.count; i++) {
      st.ballHit[i] = state[STATE_LAYOUT.CARS + i * CAR_STATE_STRIDE + CAR_STATE.BALL_HIT_SERIAL];
    }
  };

  /** Copy what physics will actually use for each car out of the controls block. */
  const readAppliedControls = () => {
    const { sim } = ctx;
    const heap = sim.module.HEAPF32;
    const base = sim.controlsPtr >> 2;
    for (let i = 0; i < st.count; i++) {
      const p = base + i * 8;
      const c = st.applied[i];
      c.throttle = heap[p];
      c.steer = heap[p + 1];
      c.pitch = heap[p + 2];
      c.yaw = heap[p + 3];
      c.roll = heap[p + 4];
      // A jump is a one-tick pulse; the frame can run several ticks, so latch it.
      c.jump = st.jumpAcc[i] || heap[p + 5] > 0.5;
      c.boost = heap[p + 6] > 0.5;
      c.handbrake = heap[p + 7] > 0.5;
      st.jumpAcc[i] = false;
    }
  };

  /**
   * Ask every car for controls. Runs EVERY tick (kickoff countdown included),
   * the way the donor's `he` does for its one human: the Air Jam input layer
   * treats a controller nobody has read for a second as vanished, so a 3 s
   * countdown without reads would leave every car dead when play starts.
   */
  const sampleControls = () => {
    const { sim, session } = ctx;
    const driver = st.botDriver;
    // Bots decide only while the ball is live, like the donor's own bot.
    if (driver && session.state.phase === "playing" && !session.state.paused) {
      driver.tick(sim.state, ctx.pads, st.kickoffTicks);
    }
    const heap = sim.module.HEAPF32;
    const base = sim.controlsPtr >> 2;
    for (let i = 0; i < st.count; i++) {
      // A bot car gets its bot's controls; every other car is answered by the
      // Air Jam seam (a phone) or stays neutral.
      sim.setControls(i, driver?.controls(i) ?? ctx.neutralControls);
      if (heap[base + i * 8 + 5] > 0.5) st.jumpAcc[i] = true;
    }
  };

  /** One 120 Hz tick. Mirrors the donor's `me` for the match phase. */
  const step = () => {
    const { sim, session } = ctx;
    const gp = ctx.goalPresentation;
    if (st.pendingGoal || gp?.active || session.state.paused || session.state.phase === "ended") return false;
    if (session.state.phase === "playing") {
      sim.step(1);
      st.kickoffTicks++;
      const state = sim.state;
      let heavyHit = false;
      for (let i = 0; i < st.count; i++) {
        const base = STATE_LAYOUT.CARS + i * CAR_STATE_STRIDE;
        const serial = state[base + CAR_STATE.BALL_HIT_SERIAL];
        if (serial !== st.ballHit[i]) {
          st.ballHit[i] = serial;
          st.lastTouch = i;
          heavyHit = true;
          emit({ type: "hit", car: i, speed: state[base + CAR_STATE.BALL_HIT_SPEED] });
        }
      }
      if (heavyHit && st.tuning.ball === "heavy") {
        editBall((heap, at) => {
          for (let axis = 0; axis < 3; axis++) heap[at + 12 + axis] *= HEAVY_BALL_RETAIN;
        });
      }
      const scored = sim.pollGoal();
      if (scored) {
        const team = scored === 1 ? 0 : 1;
        st.pendingGoal = { team, mode: "match", scorerIndex: pickScorer(team) };
      }
      const outcome = session.tick({
        goal: scored,
        ballOnGround: sim.ballOnGround,
        kickoffTouched:
          Math.abs(state[STATE_LAYOUT.BALL]) + Math.abs(state[STATE_LAYOUT.BALL + 1]) > 1 ||
          Math.hypot(state[STATE_LAYOUT.BALL + 12], state[STATE_LAYOUT.BALL + 13]) > 1,
      });
      if (outcome === "kickoff") resetLocalKickoff();
    } else if (session.tick() === "kickoff") {
      resetLocalKickoff();
    }
    return true;
  };

  /** The car credited with a goal: the last toucher if on the scoring team, else the first car on it. */
  const pickScorer = (team) => {
    if (st.lastTouch >= 0 && st.teams[st.lastTouch] === team) return st.lastTouch;
    const first = st.teams.indexOf(team);
    return first >= 0 ? first : 0;
  };

  /* ------------------------------------------------------------------ */
  /* Replay + boost pad bookkeeping (adapted from startup.js)             */
  /* ------------------------------------------------------------------ */

  const syncPadHistory = () => {
    const pads = ctx.pads;
    if (!st.padHistory || st.padHistory.length !== pads.length) st.padHistory = new Uint8Array(pads.length);
    const state = ctx.clock.currState;
    for (let i = 0; i < pads.length; i++) st.padHistory[i] = state[ro + i * 2] === 1 ? 1 : 0;
  };

  const detectBoostPickups = () => {
    const pads = ctx.pads;
    const state = ctx.clock.currState;
    for (let i = 0; i < pads.length; i++) {
      const active = state[ro + i * 2] === 1 ? 1 : 0;
      if (st.padHistory[i] && !active) {
        const pad = pads[i];
        padPoint.set(pad.pos[0], 25, pad.pos[1]);
        let nearby = false;
        for (const view of st.views) {
          if (ctx.world.cars[view.car].position.distanceToSquared(padPoint) < 1200 * 1200) nearby = true;
        }
        ctx.arenaEffects.pickup(padPoint, pad.isBig, nearby);
        if (nearby) sfx.pickup(pad.isBig);
      }
      st.padHistory[i] = active;
    }
  };

  const storePose = (object, offset) => {
    replayState[offset] = object.position.x;
    replayState[offset + 1] = object.position.z;
    replayState[offset + 2] = object.position.y;
    replayMatrix.makeRotationFromQuaternion(object.quaternion);
    for (const [column, relative] of [[0, 3], [2, 6], [1, 9]]) {
      replayBasis.setFromMatrixColumn(replayMatrix, column);
      replayState[offset + relative] = replayBasis.x;
      replayState[offset + relative + 1] = replayBasis.z;
      replayState[offset + relative + 2] = replayBasis.y;
    }
  };

  const captureReplayFrame = () => {
    const { world, clock, replayBuffer } = ctx;
    replayState.set(clock.currState);
    storePose(world.ball, STATE_LAYOUT.BALL);
    for (let i = 0; i < clock.currState[STATE_LAYOUT.NUM_CARS]; i++) {
      storePose(world.cars[i], STATE_LAYOUT.CARS + i * CAR_STATE_STRIDE);
    }
    const cameras = st.cams.map((cam) => ({
      position: cam.camera.position.toArray(),
      quaternion: cam.camera.quaternion.toArray(),
      fov: cam.camera.fov,
    }));
    replayBuffer.record(st.replayClock, replayState, cameras);
  };

  /* ------------------------------------------------------------------ */
  /* Rendering                                                           */
  /* ------------------------------------------------------------------ */

  const layoutViews = (width, height) => {
    const rects = tileViewports(st.views.length, width, height);
    st.views.forEach((view, index) => {
      view.rect = rects[index];
    });
  };

  const ensurePosts = () => {
    while (st.posts.length < st.views.length) st.posts.push(ctx.makePost());
    while (st.posts.length > st.views.length) st.posts.pop().dispose();
  };

  /**
   * What the post chain needs to make a view feel fast: how close to supersonic
   * the car is, whether it is boosting, and a short colour flash (goals).
   */
  const viewFx = (car) => {
    const state = ctx.clock.currState;
    const base = STATE_LAYOUT.CARS + car * CAR_STATE_STRIDE;
    const vel = CAR_STATE.VEL;
    const speed = Math.hypot(state[base + vel], state[base + vel + 1], state[base + vel + 2]);
    return {
      // 0 until ~1000 uu/s (a brisk drive), 1 at the supersonic threshold.
      speed: Math.min(1, Math.max(0, (speed - 1000) / 1300)),
      boost: state[base + CAR_STATE.IS_BOOSTING] === 1 ? 1 : 0,
      flash: st.flash > 0 ? st.flashColor.map((channel) => channel * st.flash) : null,
    };
  };

  const drawView = (post, camera, rect, canvasHeight, pixelRatio, fx) => {
    const { renderer } = ctx;
    const aspect = rect.width / rect.height;
    if (camera.aspect !== aspect) camera.aspect = aspect;
    camera.updateProjectionMatrix();
    const glY = canvasHeight - rect.y - rect.height;
    renderer.setViewport(rect.x, glY, rect.width, rect.height);
    renderer.setScissor(rect.x, glY, rect.width, rect.height);
    renderer.setScissorTest(true);
    post.render(ctx.world.scene, camera, {
      x: Math.max(1, Math.round(rect.width * pixelRatio)),
      y: Math.max(1, Math.round(rect.height * pixelRatio)),
    }, fx);
  };

  const drawSpeedLines = (index) => {
    const lines = st.speedLines[index];
    if (!lines?.pass.enabled) return;
    const { renderer } = ctx;
    const auto = renderer.autoClear;
    renderer.autoClear = false;
    renderer.render(lines.pass.scene, lines.pass.camera);
    renderer.autoClear = auto;
  };

  const resetViewport = () => {
    const { renderer } = ctx;
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
  };

  /** Show only `car`'s ball-locator arrow (each view has its own, anchored to its own car). */
  const showLocatorFor = (car) => {
    st.locators.forEach((locator, index) => {
      if (!locator) return;
      locator.object.visible = index === car && locator.wanted;
    });
  };

  const renderViews = () => {
    const { renderer, quality, world } = ctx;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = renderer.getPixelRatio();
    layoutViews(width, height);
    ensurePosts();
    quality.shadows && (renderer.shadowMap.needsUpdate = true);
    for (const view of st.views) {
      const cam = st.cams[view.car].camera;
      const rect = view.rect;
      // Keep roughly the full-screen field of view in a narrow tile.
      cam.fov = widenFov(st.camFov[view.car], rect.width / rect.height);
      // Shared, camera-facing geometry is rebuilt for THIS view.
      quality.effects && world.prepareBallSpeedTrail(cam);
      ctx.motionEffects.orient(world.cars, cam);
      showLocatorFor(view.car);
      drawView(st.posts[view.index], cam, rect, height, pixelRatio, viewFx(view.car));
      drawSpeedLines(view.car);
    }
    showLocatorFor(-1);
    resetViewport();
  };

  /** The goal celebration/replay is one full-screen shot through the base camera. */
  const renderGoalShot = () => {
    const { renderer, baseCamera, world } = ctx;
    const width = window.innerWidth;
    const height = window.innerHeight;
    goalCameraRect.width = width;
    goalCameraRect.height = height;
    if (st.posts.length === 0) return;
    const camera = baseCamera.camera;
    ctx.quality.shadows && (renderer.shadowMap.needsUpdate = true);
    ctx.quality.effects && world.prepareBallSpeedTrail(camera);
    ctx.motionEffects.orient(world.cars, camera);
    showLocatorFor(-1);
    drawView(st.posts[0], camera, goalCameraRect, height, renderer.getPixelRatio());
    resetViewport();
  };

  /* ------------------------------------------------------------------ */
  /* Per-frame driver                                                    */
  /* ------------------------------------------------------------------ */

  const updateCameras = (dt) => {
    const { world, clock } = ctx;
    const state = clock.currState;
    for (let i = 0; i < st.count; i++) {
      const base = STATE_LAYOUT.CARS + i * CAR_STATE_STRIDE;
      const cs = st.camState[i];
      cs.onGround = state[base + CAR_STATE.ON_GROUND] === 1;
      cs.supersonic = state[base + CAR_STATE.SUPERSONIC] === 1;
      cs.groundNormal.set(state[base + CAR_STATE.GROUND_NORMAL], state[base + CAR_STATE.GROUND_NORMAL + 2], state[base + CAR_STATE.GROUND_NORMAL + 1]);
      cs.velocity.set(state[base + CAR_STATE.VEL], state[base + CAR_STATE.VEL + 2], state[base + CAR_STATE.VEL + 1]);
      st.cams[i].update(world.cars[i], world.ball, dt, cs);
      // The kernel's own FOV (it widens with speed); the per-tile widening is
      // applied on top of it at draw time.
      st.camFov[i] = st.cams[i].camera.fov;
    }
  };

  const updateLocators = () => {
    const { world } = ctx;
    st.views.forEach((view) => {
      let locator = st.locators[view.car];
      if (!locator) {
        locator = new BallLocator();
        locator.wanted = false;
        world.scene.add(locator.object);
        st.locators[view.car] = locator;
      }
      locator.update(world.cars[view.car], world.ball, st.cams[view.car].ballCam);
      locator.wanted = locator.object.visible;
    });
    showLocatorFor(-1);
  };

  const updateAudio = (dt, audible) => {
    const { clock, world, engines, impactAudio, ballAudio } = ctx;
    const state = clock.currState;
    const live = state[STATE_LAYOUT.NUM_CARS];
    let hitSerial = 0;
    let hitSpeed = 0;
    let anySupersonic = false;
    for (let i = 0; i < st.count; i++) {
      const base = STATE_LAYOUT.CARS + i * CAR_STATE_STRIDE;
      const present = i < live;
      const vel = CAR_STATE.VEL;
      const fwd = CAR_STATE.FWD;
      const forwardSpeed =
        state[base + vel] * state[base + fwd] + state[base + vel + 1] * state[base + fwd + 1] + state[base + vel + 2] * state[base + fwd + 2];
      st.vehicleAudios[i].update({
        jumpSerial: state[base + CAR_STATE.JUMP_SERIAL],
        dodgeSerial: state[base + CAR_STATE.DODGE_SERIAL],
        doubleJumpSerial: state[base + CAR_STATE.DOUBLE_JUMP_SERIAL],
        wheelImpactSerial: state[base + CAR_STATE.WHEEL_IMPACT_SERIAL],
        wheelImpactSpeed: state[base + CAR_STATE.WHEEL_IMPACT_SPEED],
        audible: audible && state[base + CAR_STATE.DEMOED] !== 1,
      });
      const serial = state[base + CAR_STATE.BALL_HIT_SERIAL];
      hitSerial += serial;
      if (serial !== ctx.impactSerials[i]) hitSpeed = Math.max(hitSpeed, state[base + CAR_STATE.BALL_HIT_SPEED]);
      ctx.impactSerials[i] = serial;
      anySupersonic ||= present && state[base + CAR_STATE.SUPERSONIC] === 1 && state[base + CAR_STATE.DEMOED] !== 1;
      engines[i].update(
        {
          forwardSpeed,
          throttle: st.applied[i].throttle,
          handbrake: st.applied[i].handbrake,
          boosting: present && state[base + CAR_STATE.IS_BOOSTING] === 1,
          onGround: present && state[base + CAR_STATE.ON_GROUND] === 1,
          alive: present && state[base + CAR_STATE.DEMOED] !== 1,
          audible,
          controllerActive: true,
          position: world.cars[i]?.position,
        },
        dt,
      );
    }
    const first = STATE_LAYOUT.CARS;
    impactAudio.update({
      carSerial: hitSerial,
      carSpeed: hitSpeed,
      carPan: 0,
      worldSerial: state[first + CAR_STATE.BALL_WORLD_IMPACT_SERIAL],
      worldSpeed: state[first + CAR_STATE.BALL_WORLD_IMPACT_SPEED],
      worldSurface: state[first + CAR_STATE.BALL_WORLD_SURFACE] === 0 ? 0 : 1,
      worldPan: 0,
      audible: true,
    });
    ballAudio.update(anySupersonic, false, audible);
  };

  /** Phase changes and demolitions, for the host (haptics, announcements). */
  const publishFrameEvents = () => {
    const { session, clock } = ctx;
    const phase = session.state.phase;
    if (phase !== st.prevPhase) {
      emit({ type: "phase", phase, countdown: session.state.countdown, winner: session.state.winner });
      // Match-event sounds: "go" as the ball drops, the buzzer at full time.
      if (st.prevPhase === "kickoff" && phase === "playing") sfx.go();
      if (phase === "ended") sfx.finalWhistle();
      if (phase !== "kickoff") st.prevCountdown = 0;
      st.prevPhase = phase;
    }
    if (phase === "kickoff" && session.state.countdown !== st.prevCountdown) {
      st.prevCountdown = session.state.countdown;
      if (session.state.countdown > 0) sfx.tick();
    }
    const state = clock.currState;
    for (let i = 0; i < st.count; i++) {
      const demolished = state[STATE_LAYOUT.CARS + i * CAR_STATE_STRIDE + CAR_STATE.DEMOED] === 1;
      if (demolished && !st.demoPrev[i]) {
        emit({ type: "demolished", car: i });
        sfx.demolish();
      }
      st.demoPrev[i] = demolished;
    }
  };

  /**
   * Where the OTHER cars appear on this view's screen (CSS px, page space), for
   * floating nameplates. Cars behind the camera or demolished get no mark.
   */
  const nameplateMarks = (view, point, state) => {
    const cam = st.cams[view.car]?.camera;
    const rect = view.rect;
    if (!cam || !rect || !ctx.world?.cars) return [];
    const marks = [];
    for (let i = 0; i < st.count; i++) {
      if (i === view.car) continue;
      const car = ctx.world.cars[i];
      if (!car || state[STATE_LAYOUT.CARS + i * CAR_STATE_STRIDE + CAR_STATE.DEMOED] === 1) continue;
      point.copy(car.position);
      point.y += 150;
      const distance = point.distanceTo(cam.position);
      point.project(cam);
      if (point.z > 1 || Math.abs(point.x) > 1.05 || Math.abs(point.y) > 1.05) continue;
      marks.push({
        car: i,
        team: st.teams[i],
        x: rect.x + (point.x * 0.5 + 0.5) * rect.width,
        y: rect.y + (1 - (point.y * 0.5 + 0.5)) * rect.height,
        distance,
      });
    }
    return marks;
  };

  /** Pooled event effects: the goal burst and the boost light pools. */
  const updateMatchFx = (dt) => {
    const fx = st.fx;
    if (!fx) return;
    const state = ctx.clock.currState;
    const boosting = [];
    const demolished = [];
    for (let i = 0; i < st.count; i++) {
      const base = STATE_LAYOUT.CARS + i * CAR_STATE_STRIDE;
      boosting.push(state[base + CAR_STATE.IS_BOOSTING] === 1);
      demolished.push(state[base + CAR_STATE.DEMOED] === 1);
    }
    fx.glow.update(dt, ctx.world.cars, boosting, demolished);
    fx.burst.update(dt);
  };

  const frame = (now) => {
    const { sim, world, session, clock, profiler, quality } = ctx;
    const gp = ctx.goalPresentation;
    const dt = Math.min(Math.max((now - st.lastTime) / 1000, 0), 0.1);
    st.lastTime = now;
    if (st.flash > 0) st.flash = Math.max(0, st.flash - dt * 1.6);

    if (gp?.active) {
      clock.sync(now);
      sampleControls();
      if (document.hidden) return;
      profiler.frameStart();
      world.controlsByCar = null;
      gp.update(dt);
      // Event mode: "short goal celebration" skips the replay.
      if (st.tuning.goalCelebration === "short" && gp.active && (gp.replaying || gp.elapsed >= SHORT_CELEBRATION_SECONDS)) {
        gp.finish();
        profiler.frameEnd(0, 0, false);
        return;
      }
      ctx.arenaEffects.update(dt);
      st.fx?.burst.update(dt);
      renderGoalShot();
      profiler.frameEnd(0, 0, false);
      return;
    }

    profiler.frameStart();
    session.state.paused = st.paused || document.hidden;
    sim.setGoalExplosionEnabled(true);
    if (session.state.paused || session.state.phase === "ended") {
      clock.sync(now);
      sampleControls(); // keep phones "alive" while nothing steps
    } else clock.update(now, sampleControls, step);
    profiler.mark();

    const playing = !session.state.paused && session.state.phase === "playing";
    readAppliedControls();
    // Each car's flames / wheel spin follow its own input (idle while not playing).
    world.controlsByCar = playing ? st.applied : st.neutralSet;
    world.update(clock.prevState, clock.currState, clock.alpha, dt, 0, ctx.neutralControls, ctx.neutralControls, playing);
    updateCameras(dt);
    updateLocators();
    publishFrameEvents();
    updateMatchFx(dt);
    profiler.mark();

    if (!document.hidden && (playing || st.pendingGoal)) {
      st.replayClock += dt;
      if (st.replayClock - st.lastReplayRecord >= 1 / 120 || st.pendingGoal) {
        captureReplayFrame();
        st.lastReplayRecord = st.replayClock;
      }
      detectBoostPickups();
    } else syncPadHistory();
    ctx.arenaEffects.update(dt);

    if (st.pendingGoal) {
      const goal = st.pendingGoal;
      st.pendingGoal = null;
      ctx.motionEffects.clear();
      world.controlsByCar = null;
      emit({ type: "goal", team: goal.team, scorer: goal.scorerIndex });
      sfx.goal();
      st.fx?.burst.trigger(world.ball.position, goal.team);
      // A white-hot flash tinted toward the scoring team's colour.
      st.flash = 1;
      st.flashColor = goal.team === 0 ? [0.04, 0.09, 0.2] : [0.2, 0.1, 0.03];
      ctx.goalPresentation.begin({
        time: st.replayClock,
        state: clock.currState,
        scorerIndex: goal.scorerIndex,
        team: goal.team,
        mode: goal.mode,
        scorerName: `PLAYER ${goal.scorerIndex + 1}`,
      });
      renderGoalShot();
      profiler.frameEnd(clock.lastTicks, clock.lastDropped, clock.lastStalled);
      return;
    }

    const lead = st.cams[st.views[0]?.car ?? 0].camera;
    // One listener for the shared speakers: the first player's camera.
    ctx.setAudioListener(lead);
    updateAudio(dt, playing);

    // Advances the effects' own time; the camera-facing geometry is rebuilt per
    // view in `renderViews`, so the camera passed here only seeds this update.
    quality.effects && world.prepareBallSpeedTrail(lead);
    ctx.motionEffects.update(
      dt,
      world.cars,
      clock.currState,
      STATE_LAYOUT,
      CAR_STATE_STRIDE,
      CAR_STATE,
      lead,
      { wheels: world.carWheels, specs: world.carWheelSpecs, stride: ctx.wheelStride },
      playing,
    );
    for (const view of st.views) {
      const base = STATE_LAYOUT.CARS + view.car * CAR_STATE_STRIDE;
      const supersonic = clock.currState[base + CAR_STATE.SUPERSONIC] === 1 && clock.currState[base + CAR_STATE.DEMOED] !== 1;
      st.camState[view.car].velocity.set(clock.currState[base + CAR_STATE.VEL], clock.currState[base + CAR_STATE.VEL + 2], clock.currState[base + CAR_STATE.VEL + 1]);
      st.speedLines[view.car].update(dt, supersonic && playing, st.camState[view.car].velocity, st.cams[view.car].camera);
    }
    world.ballLocatorArrow.object.visible = false;
    profiler.mark();
    renderViews();
    profiler.mark();
    profiler.frameEnd(clock.lastTicks, clock.lastDropped, clock.lastStalled);
  };

  /* ------------------------------------------------------------------ */
  /* Lifecycle                                                           */
  /* ------------------------------------------------------------------ */

  const disposeViews = () => {
    for (const post of st.posts) post.dispose();
    for (const locator of st.locators) locator?.object.removeFromParent();
    st.posts = [];
    st.speedLines = [];
    st.locators = [];
    st.cams = [];
    st.camFov = [];
    st.camState = [];
    st.views = [];
    st.vehicleAudios = [];
  };

  /**
   * Start a local match.
   *
   * @param roster  cars in slot order: `{ team: 0 | 1, visual?: string, human?: boolean }`.
   *                Index in this array IS the physics car index and the slot the
   *                Air Jam seam is asked about. `human` (default true) gives the car
   *                its own viewport; bot cars are rendered inside the world only.
   *                `visual` is a garage car id (fennec, octane-original, challenger,
   *                spectre, vesper, amethyst).
   * @param options.matchSeconds  regulation length. The donor's MatchSession is
   *                hard-coded to 5:00 (`am` in match/session.js); its clock is two
   *                public fields, so a different length is set after `start()`.
   * @param options.tuning  `{ boost: normal|turbo, ball: normal|heavy,
   *                kickoffReset: fast|normal, goalCelebration: short|full }`.
   */
  const start = async (roster, options = {}) => {
    if (st.starting) throw new Error("A local match is already starting");
    if (!Array.isArray(roster) || roster.length < 1 || roster.length > MAX_LOCAL_CARS) {
      throw new RangeError(`A local match needs 1-${MAX_LOCAL_CARS} cars`);
    }
    st.starting = true;
    try {
      const { sim, world, session } = ctx;
      ctx.goalPresentation?.finish({ cancel: true });
      if (st.active) await stop();

      const garage = ctx.garageVisual();
      const cars = roster.map((entry, index) => ({
        team: entry.team === 1 ? 1 : 0,
        visual: entry.visual ?? (index === 0 ? garage : DEFAULT_OPPONENT_VISUAL),
        human: entry.human !== false,
      }));

      // Car 0 is the donor's boot car; give it the first player's chosen body.
      if (cars[0].visual !== world.carVisual) await ctx.setPrimaryVisual(cars[0].visual, cars[0].team);
      await world.prepareOnlineRoster(cars);
      sim.configureOnline(cars);
      ctx.syncNativeGeometry();

      st.count = cars.length;
      st.teams = cars.map((c) => c.team);
      st.ballHit = new Array(st.count).fill(0);
      st.tuning = { ...DEFAULT_TUNING, ...(options.tuning ?? {}) };
      st.kickoffCount = 0;
      st.prevPhase = null;
      st.applied = cars.map(neutralControlSet);
      st.neutralSet = cars.map(neutralControlSet);
      st.jumpAcc = cars.map(() => false);
      st.demoPrev = cars.map(() => false);

      // One camera kernel + ChaseCamera per car (human or not: bots need a
      // replay camera too).
      disposeViews();
      for (let i = 0; i < st.count; i++) {
        const kernel = await createCameraKernel();
        const cam = new ChaseCamera(window.innerWidth / window.innerHeight, kernel);
        Object.assign(cam.settings, ctx.baseCamera.settings);
        st.cams.push(cam);
        st.camFov.push(cam.camera.fov);
        st.camState.push({ onGround: false, groundNormal: new F(), velocity: new F(), supersonic: false, lookX: 0, lookY: 0 });
        st.vehicleAudios.push(i === 0 ? ctx.vehicleAudio : new VehicleAudio());
        st.speedLines.push(new SpeedLines());
      }
      cars.forEach((car, index) => {
        if (car.human) st.views.push({ index: st.views.length, car: index, team: car.team, rect: null });
      });
      if (st.views.length === 0) st.views.push({ index: 0, car: 0, team: cars[0].team, rect: null });
      ensurePosts();

      while (ctx.engines.length < st.count) ctx.engines.push(new EngineAudio(true));
      ctx.impactSerials.length = 0;
      for (let i = 0; i < st.count; i++) ctx.impactSerials.push(0);

      st.savedPlayerIndex = ctx.goalPresentation?.playerIndex ?? null;
      // "You scored!" only makes sense with one player; everyone else gets the neutral graphic.
      if (ctx.goalPresentation) ctx.goalPresentation.playerIndex = -1;

      if (urlFlag("debug")) ctx.exposeDebug?.();
      // The arena's dusk atmosphere (sky, light colours, floodlight beams). `?daylight` keeps the donor's look.
      if (!urlFlag("daylight")) applyDuskLook(ctx.world);
      st.fx ??= { burst: new GoalBurst(ctx.world.scene), glow: new BoostGlow(ctx.world.scene, cars.length) };
      st.fx.burst.clear();
      st.fx.glow.clear();
      if (window.__arena) window.__arena.fx = st.fx;
      st.paused = false;
      // Event mode: turbo boost is unlimited boost. (configureOnline resets it.)
      sim.setUnlimitedBoost(st.tuning.boost === "turbo");
      session.start();
      if (Number.isFinite(options.matchSeconds) && options.matchSeconds > 0) {
        session.remaining = Math.round(options.matchSeconds * 120);
        session.state.remainingSeconds = options.matchSeconds;
      }
      st.active = true;
      st.lastTime = performance.now();
      resetLocalKickoff();
      ctx.clock.sync(st.lastTime);
      ctx.root.classList.add("local-match");
      return { cars: st.count, views: st.views.length };
    } finally {
      st.starting = false;
    }
  };

  /** Leave the local match and put the donor back into its normal offline state. */
  const stop = async () => {
    if (!st.active) return;
    st.active = false;
    ctx.goalPresentation?.finish({ cancel: true });
    if (ctx.goalPresentation && st.savedPlayerIndex !== null) ctx.goalPresentation.playerIndex = st.savedPlayerIndex;
    st.fx?.burst.clear();
    st.fx?.glow.clear();
    disposeViews();
    ctx.world.controlsByCar = null;
    ctx.engines.length = st.baseEngines || 2;
    st.botDriver = null;
    ctx.root.classList.remove("local-match");
    ctx.leave();
  };

  st.baseEngines = ctx.engines.length;

  return {
    get active() {
      return st.active;
    },
    get paused() {
      return st.paused;
    },
    set paused(value) {
      st.paused = Boolean(value);
    },
    /**
     * Attach the driver for the match's bot cars (see src/host/bot-driver.ts):
     * `{ tick(state, pads, kickoffTick), controls(slot) -> controls | null }`.
     * Cleared automatically when the match stops. The caller owns its lifetime.
     */
    setBotDriver(driver) {
      st.botDriver = driver ?? null;
    },
    /** Max cars in a local match. */
    maxCars: MAX_LOCAL_CARS,
    start,
    stop,
    frame,
    /** Hitbox family RocketSim will use for a visual (diagnostics). */
    hitboxFamily: resolveVisualHitboxFamily,
    /**
     * Subscribe to match events: `{type:"hit",car,speed}`, `{type:"goal",team,
     * scorer}`, `{type:"demolished",car}`, `{type:"phase",phase,countdown,winner}`.
     * Returns the unsubscribe function.
     */
    onEvent(listener) {
      st.listeners.add(listener);
      return () => st.listeners.delete(listener);
    },
    /**
     * Give a car its own viewport (a late joiner taking over a bot's car).
     * Returns false if there is no such car or it already has one.
     */
    addHumanView(car) {
      if (!st.active || !Number.isInteger(car) || car < 0 || car >= st.count) return false;
      if (st.views.some((view) => view.car === car)) return false;
      st.views.push({ index: st.views.length, car, team: st.teams[car], rect: null });
      ensurePosts();
      return true;
    },
    /** Take a car's viewport away (its player left). The last view is never removed. */
    removeHumanView(car) {
      if (!st.active || st.views.length <= 1) return false;
      const at = st.views.findIndex((view) => view.car === car);
      if (at < 0) return false;
      st.views.splice(at, 1);
      st.views.forEach((view, index) => {
        view.index = index;
      });
      ensurePosts();
      return true;
    },
    /** Live data for the host's HUD overlay and phone readouts. Cheap; call it a few times a second. */
    hud() {
      const markPoint = new F();
      const { session, clock } = ctx;
      const state = clock.currState;
      return {
        active: st.active,
        phase: session.state.phase,
        countdown: session.state.countdown,
        blueScore: session.state.blueScore,
        orangeScore: session.state.orangeScore,
        remainingSeconds: session.state.remainingSeconds,
        overtime: session.state.overtime,
        overtimeSeconds: session.state.overtimeSeconds,
        winner: session.state.winner,
        paused: st.paused,
        tuning: st.tuning,
        /** Every car in the match, bots included. */
        cars: st.teams.map((team, car) => {
          const base = STATE_LAYOUT.CARS + car * CAR_STATE_STRIDE;
          return {
            car,
            team,
            human: st.views.some((view) => view.car === car),
            speed: Math.hypot(state[base + CAR_STATE.VEL], state[base + CAR_STATE.VEL + 1], state[base + CAR_STATE.VEL + 2]),
            boost: state[base + CAR_STATE.BOOST],
          };
        }),
        views: st.views.map((view) => {
          const base = STATE_LAYOUT.CARS + view.car * CAR_STATE_STRIDE;
          const vx = state[base + CAR_STATE.VEL];
          const vy = state[base + CAR_STATE.VEL + 1];
          const vz = state[base + CAR_STATE.VEL + 2];
          return {
            index: view.index,
            car: view.car,
            team: view.team,
            rect: view.rect,
            ballCam: st.cams[view.car]?.ballCam ?? true,
            boost: state[base + CAR_STATE.BOOST],
            boosting: state[base + CAR_STATE.IS_BOOSTING] === 1,
            locatorArrow: Boolean(st.locators[view.car]?.wanted),
            airborne: state[base + CAR_STATE.ON_GROUND] !== 1,
            demolished: state[base + CAR_STATE.DEMOED] === 1,
            speed: Math.hypot(vx, vy, vz),
            marks: nameplateMarks(view, markPoint, state),
          };
        }),
      };
    },
    setBallCam(car, enabled) {
      const cam = st.cams[car];
      if (cam) cam.ballCam = Boolean(enabled);
    },
    toggleBallCam(car) {
      const cam = st.cams[car];
      if (!cam) return null;
      cam.ballCam = !cam.ballCam;
      return cam.ballCam;
    },
    /**
     * DEV ONLY (no-op in a production build): put the ball at `pos` moving at
     * `vel`, in native units (X/Y horizontal, Z up), so tests can score a goal
     * without hours of driving. Returns whether the engine accepted the state.
     */
    debugPlaceBall(pos, vel = [0, 0, 0]) {
      if (!import.meta.env?.DEV) return false;
      return editBall((heap, at) => {
        for (let i = 0; i < 3; i++) {
          heap[at + i] = pos[i];
          heap[at + 12 + i] = vel[i];
        }
      });
    },
    /** Test/diagnostic hook: force a goal-free reset to kickoff. */
    resetKickoff: resetLocalKickoff,
    afterReset,
  };
}
