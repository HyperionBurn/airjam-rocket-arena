import { mountOnline } from '../online/interface.js';
import { setCarMaterialQuality } from "../materials/car.js";
import {FennecV2Post} from '../rendering/fennec-v2-post.js';
import {ArenaPost} from '../rendering/arena-post.js';
const PLAIN_POST = new URLSearchParams(window.location.search).has('plainpost');
import { ReferencePost } from '../rendering/reference-post.js';
import { ReferenceLighting } from '../rendering/reference-lighting.js';
import { getTheme } from '../rendering/theme.js';
import { subscribeCarCustomization } from '../settings/car-customization.js';
import { bindParkContactShadows } from "../materials/park-lighting.js";
import { ArcadeBoostMeter } from "../ui/arcade-hud.js";
import { GoalReplayBuffer } from "../match/goal-replay.js";
import { GoalCelebrationPhysics } from "../match/goal-celebration.js";
import { GoalPresentation } from "../match/goal-presentation.js";
import { createCarMotionEffects } from "../effects/car-motion.js";
import { createArenaEffects } from "../effects/arena-effects.js";
import { setParkBankQuality } from "../arena/park.js";
import { mountPauseMenu } from "../ui/pause-menu.js";
import { mountHome } from "../ui/home-screen.js";
import { PhysicsClock } from "../physics/clock.js";
import { createPhysicsDebug } from "../diagnostics/physics-debug.js";
import { physicsModeURL, resolvePhysicsSelection } from "../physics/presets.js";
import { ORIGINAL_GAMEPLAY_CORE_SHA256, SOURCE_CORE_REVISION, SOURCE_CORE_SHA256 } from "../physics/source-runtime.js";

import { Ae, Ai, Ct, Ee, F, Gt, It, Ke, Lm, Lt, NA, Ne, Ur, Ut, Ya, Zt, ai, c0, cn, fn, ka, l0, li, mt, oo, qt, rl } from "../vendor/three.js";
import { CAR_STATE, CAR_STATE_STRIDE, EC, STATE_LAYOUT, getTeamAssignment, no, ro } from "../physics/state-layout.js";
import { PhysicsSimulation } from "../physics/simulation.js";
import { FrameScheduler } from "../rendering/frame-scheduler.js";
import { KeyboardInput } from "../input/keyboard.js";
import { getBindingLabel, loadBindings } from "../input/bindings.js";
import { Ks } from "../input/controller-selection.js";
import { GamepadInput } from "../input/gamepad.js";
import { TouchInput } from "../input/touch.js";
import { isSketchfabCar } from "../vehicles/imported-models.js";
import { e1 } from "../vehicles/flat-car.js";
import { getAudioContext, getAudioInput } from "../audio/settings.js";
import { _1 } from "../audio/spatial.js";
import { YS } from "../vehicles/diagnostics.js";
import { GameWorld } from "../rendering/world.js";
import { ChaseCamera } from "../rendering/camera.js";
import { ResetEffect } from "../effects/reset.js";
import { VehicleAudio } from "../audio/vehicle.js";
import { ImpactAudio } from "../audio/impacts.js";
import { BallAudio } from "../audio/ball.js";
import { EngineAudio } from "../audio/engine.js";
import { SpeedLines } from "../effects/speed-lines.js";
import { graphicsSettings, localQualityProfile, trainingDefaults } from "../settings/schema.js";
import { SettingsPanel } from "../ui/settings-panel.js";
import { Garage, Qh } from "../ui/garage.js";
import { JA } from "../bots/catalog.js";
import { MatchMenu } from "../ui/match-menu.js";
import { MatchSession } from "../match/session.js";
import { BotController } from "../bots/controller.js";
import { dm } from "../bots/settings.js";
import { GpuFrameTimer } from '../diagnostics/gpu-frame-timer.js';
import { FrameProfiler } from "../diagnostics/frame-profiler.js";
import { GameHud } from "../ui/hud.js";
// AIR JAM PATCH: local N-car match + split screen. See app/local-multiplayer.js.
import { arenaBridge } from "./arena-bridge.js";
import { createLocalMultiplayer } from "./local-multiplayer.js";

// Assets are served from disk. No telemetry, remote offline download gate,
// or service-worker cache is used by this editable local build.
async function cB(i) {
  return;
}

async function hB(i, e, t, n) {
  const r = new Set();
  e.traverseVisible((h) => {
    h instanceof ai && r.add(h);
  });
  const s = [],
    a = new Map(),
    o = (n.passes ?? []).map((h) => ({ pass: h, enabled: h.enabled })),
    A = (n.disappearingLightRoots ?? [])
      .map((h) => {
        const d = [];
        return (
          h.traverse((u) => {
            u instanceof ai && d.push(u);
          }),
          d
        );
      })
      .filter((h) => h.length > 0),
    l = i.getRenderTarget(),
    c = i.shadowMap.needsUpdate;
  e.traverse((h) => {
    var d, u;
    if (
      (s.push({
        object: h,
        visible: h.visible,
        frustumCulled: h.frustumCulled,
      }),
      (h.visible = !0),
      (h.frustumCulled = !1),
      h instanceof Ee || h instanceof Ai || h instanceof rl)
    ) {
      const p = h.geometry;
      p.drawRange.count === 0 &&
        !a.has(p) &&
        (a.set(p, { ...p.drawRange }),
        p.setDrawRange(
          0,
          ((d = p.index) == null ? void 0 : d.count) ??
            ((u = p.attributes.position) == null ? void 0 : u.count) ??
            0,
        ));
    }
  });
  for (const { pass: h } of o) h.enabled = !0;
  try {
    const h = new Set();
    for (const d of [!1, !0])
      for (let u = 0; u < 2 ** A.length; u++) {
        for (const { object: v } of s)
          v instanceof ai && (v.visible = d || r.has(v));
        for (let v = 0; v < A.length; v++)
          if (u & (1 << v)) for (const g of A[v]) g.visible = !1;
        const p = s
          .filter(({ object: v }) => v instanceof ai && v.visible)
          .map(({ object: v }) => v.id)
          .join(",");
        h.has(p) ||
          (h.add(p),
          await i.compileAsync(e, t),
          await n.renderBloom(),
          (i.shadowMap.needsUpdate = !0),
          n.renderFinal());
      }
  } finally {
    for (const { object: h, visible: d, frustumCulled: u } of s)
      ((h.visible = d), (h.frustumCulled = u));
    for (const [h, d] of a) h.setDrawRange(d.start, d.count);
    for (const { pass: h, enabled: d } of o) h.enabled = d;
    ((i.shadowMap.needsUpdate = c), i.setRenderTarget(l));
  }
}

const an = document.querySelector("#app");

const ml = (i) => {
    an.dataset.inputMethod !== i && (an.dataset.inputMethod = i);
  };

ml(
  navigator.maxTouchPoints > 0 ||
    window.matchMedia("(any-pointer: coarse)").matches
    ? "touch"
    : "mouse",
);

window.addEventListener(
  "keydown",
  (i) => {
    i.repeat || ml("keyboard");
  },
  !0,
);

window.addEventListener(
  "pointerdown",
  (i) => {
    ml(
      i.pointerType === "touch" || i.pointerType === "pen" ? "touch" : "mouse",
    );
  },
  { capture: !0, passive: !0 },
);

if (!an.querySelector("#loading")) {
  an.innerHTML = `
    <div id="loading" data-state="loading" style="--load-progress: 0%">
      <div class="load__panel">
        <img class="load__mark" src="/assets/ui/rocket-arena-mark.webp" width="1254" height="1254" alt="" />
        <h1 class="load__title">ROCKET <span>ARENA</span></h1>
        <p class="load__tagline">Drive hard. Fly high. Own the field.</p>
        <div class="load__progress-block">
          <div class="load__status-row"><p class="load__label" role="status" aria-live="polite">Loading game code</p></div>
          <div class="load__rule" role="progressbar" aria-label="Game loading progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span class="load__bar"></span><output class="load__percent">0%</output></div>
          <p class="load__note">Preparing the game modules.</p>
        </div>
      </div>
    </div>
  `;
}

const nd = document.querySelector("#loading");

const rd = document.querySelector("#loading .load__note");

const Gc = document.querySelector("#loading .load__label");

const loadingPercent = document.querySelector("#loading .load__percent");

const loadingRule = document.querySelector("#loading .load__rule");

function updateLoading(progress, label, note) {
  const boundedProgress = Math.max(0, Math.min(100, Math.round(progress)));
  nd.style.setProperty("--load-progress", `${boundedProgress}%`);
  loadingPercent.textContent = `${boundedProgress}%`;
  loadingRule.setAttribute("aria-valuenow", String(boundedProgress));
  if (label) Gc.textContent = label;
  if (note) rd.textContent = note;
}

const loadingTasks = new Map([
  ["code", 10],
  ["physics", 15],
  ["arena", 25],
  ["ball", 8],
  ["vehicles", 22],
  ["fonts", 5],
  ["renderer", 15],
]);
const completedLoadingTasks = new Set();

function completeLoadingTask(task, label, note) {
  completedLoadingTasks.add(task);
  const progress = [...completedLoadingTasks].reduce(
    (total, completedTask) => total + (loadingTasks.get(completedTask) ?? 0),
    0,
  );
  updateLoading(progress, label, note);
}

async function trackLoadingTask(task, promise, label, note) {
  const result = await promise;
  completeLoadingTask(task, label, note);
  return result;
}

function setLoadingStatus(label, note) {
  if (label) Gc.textContent = label;
  if (note) rd.textContent = note;
}

async function startGame() {
  completeLoadingTask("code", "Starting game systems", "Game code ready. Starting the physics engine.");
  await cB();
  const initialGraphics = graphicsSettings.load(),
    quality = { ...localQualityProfile(initialGraphics.qualityPreset) };
  let
    i = Qh.load().carVisual,
    e = i === "game-car" || isSketchfabCar(i) ? 1 : 0,
    t = getTeamAssignment(i === "flat-car"),
    n = new PhysicsSimulation(resolvePhysicsSelection(window.location.search, i));
  await n.init();
  completeLoadingTask("physics", "Physics ready", "Preparing the stadium and game assets.");
  const r = n.addCar(e, i === "flat-car" ? "flat" : "default");
  n.resetKickoff();
  let resetSession = () => {};
  const s = new PhysicsClock(n, { ballOffset: STATE_LAYOUT.BALL }),
    a = new MatchSession(),
    o = new BotController(dm.load().botId),
    A = {
      throttle: 0,
      steer: 0,
      pitch: 0,
      yaw: 0,
      roll: 0,
      jump: !1,
      boost: !1,
      handbrake: !1,
    };
  let l = { ...A },
    c = 0,
    h = !1,
    d = 0,
    u = 0,
    p = !1;
  const v = () => {
      (o.reset(), d++, (c = 0), (h = !1), (l = { ...A }), (u = 0));
    },
    g = new VehicleAudio(),
    m = new ImpactAudio(),
    y = [0, 0],
    C = new BallAudio(),
    E = [new EngineAudio(), new EngineAudio(!0)],
    w = () => {
      for (const W of E) W.reset();
    },
    k = loadBindings(),
    x = new KeyboardInput(k),
    T = () => resetSession();
  x.onReset = T;
  const R = new GamepadInput(k);
  R.onReset = T;
  const D = new TouchInput(an);
  D.onReset = T;
  const N = new GameWorld(n.ballRadius, i, quality, initialGraphics.showStadium);
  await Promise.all([
    trackLoadingTask("arena", N.loadArena(), "Arena ready", "Stadium geometry and lighting are ready."),
    trackLoadingTask("ball", N.loadBall(), "Ball ready", "The match ball is ready for kickoff."),
    trackLoadingTask("vehicles", N.loadCarAndPadAssets(), "Vehicles ready", "Cars and boost pads are ready."),
  ]);
  N.addCar(e);
  N.addPads(n.getPads());
  bindParkContactShadows(N.turf, N);
  const syncNativeGeometry = () => {
    for (let index = 0; index < n.carConfigs.length; index++) N.setNativeCarConfig(index, n.carConfigs[index]);
  };
  syncNativeGeometry();
  const X = (W) => {
    a.state.mode !== "match" &&
      n.controlBall(r, W) &&
      (s.syncBall(), N.resetBallTrail());
  };
  ((x.onBallControl = X), (R.onBallControl = X), (D.onBallControl = X));
  const Y = new ResetEffect(N.cars[r]),
    H = new ChaseCamera(window.innerWidth / window.innerHeight, n),
    V = { ...trainingDefaults },
    J = new Set();
  let motionEffects = null;
  const speedLines = new SpeedLines();
  let online = null, home = null, pauseMenu = null, goalPresentation = null, pendingGoal = null, replayBuffer = null, arenaEffects = null;
  let localMulti = null; // AIR JAM PATCH
  let replayClock = 0, lastReplayRecord = -1, previewDirty = true;
  let previewRestore = null, returnHomeAfter = null, returnPauseAfter = false, goalSkipDown = false;
  let ne = !1,
    le = !1,
    je = !1,
    de,
    pe,
    Se = null,
    gt;
  const ct = document.createElement("button");
  ((ct.type = "button"), (ct.className = "cursor-hint"));
  const oe = () => {
      const W = k.keyboard.toggleSettings,
        fe = W.find((Ft) => Ft.kind === "key") ?? W[0];
      if ((ct.replaceChildren(), ne)) ct.textContent = "Click field to play";
      else if (fe) {
        const Ft = document.createElement("kbd");
        ((Ft.textContent = getBindingLabel(fe)), ct.append(Ft, " to show cursor"));
      } else ct.textContent = "Show cursor";
      ct.setAttribute(
        "aria-label",
        ne
          ? "Return to play"
          : fe
            ? `Show mouse cursor (${getBindingLabel(fe)})`
            : "Show mouse cursor",
      );
    },
    xe = () => {
      const W = J.size === 0 && !document.hidden && document.hasFocus();
      (an.classList.toggle("game-playing", W && !ne),
        an.classList.toggle("cursor-browsing", W && ne),
        oe());
    },
    ge = () => {
      le = !1;
      const W = !ne && (J.size === 0 ||
        (J.size === 1 && J.has("goal") && goalPresentation?.active && !goalPresentation.replaying));
      ((a.state.paused = !online?.active && a.state.mode === "match" && (!W || p)),
        (x.enabled = W),
        (R.enabled = W),
        (D.enabled = W),
        xe(),
        s.sync());
    },
    qe = (W, fe) => {
      if (fe && returnHomeAfter && returnHomeAfter !== W) returnHomeAfter = null;
      if (fe && W !== "settings") returnPauseAfter = false;
      if (fe && W !== "home" && home?.visible) home.close();
      if (fe && W !== "pause" && pauseMenu?.isOpen) pauseMenu.hide();
      if (!fe && W === "settings" && returnPauseAfter) {
        returnPauseAfter = false;
        queueMicrotask(() => pauseMenu?.show());
      }
      if (!fe && returnHomeAfter === W) {
        returnHomeAfter = null;
        queueMicrotask(() => home?.show());
      }
      (fe
        ? (J.add(W),
          W !== "settings" && Xe.hide(),
          W !== "car" && (de == null || de.hide()),
          W !== "match" && (pe == null || pe.hide()),
          W !== "status" && (Se == null || Se.hideDetails(!1)))
        : (J.delete(W), (je = !0)),
        ge());
    },
    Xe = new SettingsPanel(
      an,
      H.settings,
      V,
      k,
      (W) => qe("settings", W),
      (W) => {
        (n.setUnlimitedBoost(
          a.state.mode === "freeplay" && W.boostOption === "unlimited",
        ),
          N.setCarHitboxesVisible(W.showCarHitbox));
      },
      (W) => {
        (x.setBindings(W), R.setBindings(W), oe());
      },
      (W) => {
        ((x.capturing = W), (R.capturing = W));
      },
    ),
    We = Xe.attachGraphics((W) => {
      (N.setStadiumVisible(W.showStadium).catch(error => Xe.setStatus(`Stadium could not load: ${error.message}`)),
        gt == null || gt.setFpsLimit(W.limitFps ? W.maxFps : null));
    }),
    ft = () => {
      if (online?.visible) { online.escape(); return; }
      if (home?.visible) return;
      if (pauseMenu?.isOpen) { pauseMenu.hide(); st(); return; }
      if (goalPresentation?.active) { goalPresentation.finish(); return; }
      if (Se != null && Se.isDetailsOpen) {
        Se.hideDetails();
        return;
      }
      if (pe != null && pe.isOpen) {
        pe.hide();
        return;
      }
      if (de != null && de.isOpen) {
        de.hide();
        return;
      }
      if (Xe.isOpen) Xe.hide();
      else pauseMenu?.show();
    };
  R.onSettingsToggle = ft;
  const st = () => {
      ((ne = !1),
        document.activeElement instanceof HTMLElement &&
          document.activeElement.blur(),
        ge());
    },
    ue = () => {
      if (home?.visible) return;
      ne = true;
      ft();
    };
  ((x.onSettingsToggle = ue),
    ct.addEventListener("click", ue),
    an.querySelector(".hud-tools").appendChild(ct),
    an.querySelector("#settings-button").setAttribute("title", "Settings"),
    an.addEventListener(
      "pointerdown",
      (W) => {
        W.pointerType !== "mouse" ||
          !(W.target instanceof Element) ||
          (W.target.closest("#settings-button, #car-button, #match-button") &&
            ((ne = !0), ge()));
      },
      !0,
    ),
    (R.onActivity = () => {
      (ml("gamepad"), D.hideForExternalInput(), ne && ((ne = !1), ge()));
    }),
    (de = new Garage(an, (W) => qe("car", W))));
  const _e = () => {
    replayBuffer?.clear(); replayClock = 0; lastReplayRecord = -1;
    pendingGoal = null; arenaEffects?.clear(); motionEffects?.clear();
    (n.resetKickoff(), w(), v());
    const W = n.state,
      fe = STATE_LAYOUT.CARS + r * CAR_STATE_STRIDE;
    (Y.update(0, W[fe + CAR_STATE.FLIP_RESET_SERIAL], !1),
      g.update({
        jumpSerial: W[fe + CAR_STATE.JUMP_SERIAL],
        dodgeSerial: W[fe + CAR_STATE.DODGE_SERIAL],
        doubleJumpSerial: W[fe + CAR_STATE.DOUBLE_JUMP_SERIAL],
        wheelImpactSerial: W[fe + CAR_STATE.WHEEL_IMPACT_SERIAL],
        wheelImpactSpeed: 0,
        audible: !1,
      }),
      m.update({
        carSerial:
          W[fe + CAR_STATE.BALL_HIT_SERIAL] +
          (W[STATE_LAYOUT.NUM_CARS] > 1 ? W[fe + CAR_STATE_STRIDE + CAR_STATE.BALL_HIT_SERIAL] : 0),
        carSpeed: 0,
        worldSerial: W[fe + CAR_STATE.BALL_WORLD_IMPACT_SERIAL],
        worldSpeed: 0,
        worldSurface: 0,
        worldPan: 0,
        audible: !1,
      }),
      (y[0] = W[fe + CAR_STATE.BALL_HIT_SERIAL]),
      (y[1] = W[STATE_LAYOUT.NUM_CARS] > 1 ? W[fe + CAR_STATE_STRIDE + CAR_STATE.BALL_HIT_SERIAL] : 0),
      N.resetBallTrail(),
      n.resetView(),
      s.sync());
    localMulti?.afterReset(); // AIR JAM PATCH
  };
  resetSession = () => { if (a.state.mode !== "match" && !goalPresentation?.active) _e(); };
  ((pe = new MatchMenu(an, {
    playerTeam: t.playerTeam,
    botId: o.id,
    onSelectBot: (W) => {
      a.state.mode !== "match" &&
        (v(),
        o.select(W),
        dm.save({ botId: W }),
        pe.update({ ...a.state, botId: W }));
    },
    onOpenChange: (W) => qe("match", W),
    onResume: () => {
      returnHomeAfter = null;
      ne = !1;
    },
    onStart: async (W) => {
      online?.leave();
      returnHomeAfter = null;
      goalPresentation?.finish({ cancel: true });
      (await Promise.all([o.load(), N.ensureOpponent(JA(o.id).carVisual)]),
        !W.aborted &&
          (n.configureCars(i === "flat-car" ? "flat" : "default", !0),
          syncNativeGeometry(),
          n.setUnlimitedBoost(!1),
          (p = !1),
          a.start(),
          _e(),
          pe.update(a.state)));
    },
    onLeave: () => {
      if (online?.active) { online.leave(); return; }
      returnHomeAfter = null;
      goalPresentation?.finish({ cancel: true });
      (v(),
        a.leave(),
        (p = !1),
        n.configureCars(i === "flat-car" ? "flat" : "default", !1, e),
        syncNativeGeometry(),
        n.setUnlimitedBoost(V.boostOption === "unlimited"),
        _e(),
        pe.update(a.state));
    },
  })),
    window.addEventListener(
      "keydown",
      (W) => {
        W.code !== "KeyM" ||
          J.has("physics-lab") ||
          home?.visible || online?.active || online?.visible || goalPresentation?.active ||
          W.repeat ||
          W.ctrlKey ||
          W.metaKey ||
          W.altKey ||
          Xe.isOpen ||
          (de != null && de.isOpen) ||
          (W.preventDefault(),
          W.stopImmediatePropagation(),
          (ne = !0),
          pe.isOpen ? pe.hide() : pe.show());
      },
      !0,
    ));
  let ve = !1,
    Me = null;
  for (const W of ["blur", "focus", "visibilitychange"])
    (W === "visibilitychange" ? document : window).addEventListener(W, () => {
      ((le = !1), xe(), s.sync());
    });
  const Be = new ArcadeBoostMeter(an),
    Ze = document.createElement("p");
  ((Ze.className = "ball-cam-indicator"),
    (Ze.textContent = "Ball cam"),
    (Ze.hidden = !H.ballCam),
    an.appendChild(Ze));
  const He = new FrameProfiler(),
    At = () => {
      H.ballCam = !H.ballCam;
    };
  ((R.onBallCamToggle = At),
    (x.onBallCamToggle = At),
    (D.onBallCamToggle = At));
  const te = new l0({
    antialias: quality.antialias,
    precision: "mediump",
    powerPreference: "high-performance",
  });
  const gpuFrameTimer = new GpuFrameTimer(te.getContext());
  let fennecV2Post;
  let referencePost;
  const referenceLighting = new ReferenceLighting();
  subscribeCarCustomization(({ carId }) => {
    N.applyGarageCustomization(carId);
    referenceLighting.dirty = true;
    previewDirty = true;
  });
  let referencePreset = initialGraphics.qualityPreset;
  const renderGame = (scene,camera) => {
    gpuFrameTimer.begin(Ge.enabled);
    try {
    const theme = getTheme();
    N.updateSceneryDetail(camera);
    referenceLighting.update(N, theme);
    if (theme === 'realistic') {
      if (fennecV2Post) { fennecV2Post.dispose(); fennecV2Post = null; }
      referencePost ??= new ReferencePost(te);
      referencePost.render(scene, camera, referenceLighting.settings, referencePreset, theme);
    } else if (isSketchfabCar(N.carVisual)) {
      if (referencePost) { referencePost.dispose(); referencePost = null; }
      fennecV2Post ??= new FennecV2Post(te);
      fennecV2Post.render(scene,camera,!quality.effects);
    } else te.render(scene,camera);
    } finally { gpuFrameTimer.end(); }
  };
  (te.setSize(window.innerWidth, window.innerHeight),
    te.setPixelRatio(initialGraphics.renderScale),
    (te.shadowMap.enabled = quality.shadows),
    (te.shadowMap.type = ka),
    (te.shadowMap.autoUpdate = !1),
    (te.toneMapping = oo),
    (te.toneMappingExposure = quality.exposure));
  if (quality.environment) {
    const W = new NA(te);
    ((N.scene.environment = W.fromScene(new c0(), 0.04).texture),
      (N.scene.environmentIntensity = 0.5),
      W.dispose());
  } else {
    ((N.scene.environment = null), (N.scene.environmentIntensity = 0));
  }
  N.scene.traverse(object => setParkBankQuality(object.material, initialGraphics.qualityPreset));
  let cachedEnvironment = N.scene.environment;
  Xe.onReferenceGraphicsChange = settings => {
    referenceLighting.setSettings(settings);
    te.shadowMap.needsUpdate = true;
    previewDirty = true;
  };
  Xe.onGraphicsChange = W => {
    referencePreset = W.qualityPreset;
    referenceLighting.dirty = true;
    Object.assign(quality, localQualityProfile(W.qualityPreset));
    te.setPixelRatio(W.renderScale);
    te.shadowMap.enabled = quality.shadows; te.shadowMap.needsUpdate = true;
    if (!quality.shadows) N.releaseShadowMaps();
    te.toneMappingExposure = quality.exposure;
    te.domElement.style.filter = quality.colorFilter;
    if (quality.environment && !cachedEnvironment) {
      const generator = new NA(te);
      cachedEnvironment = generator.fromScene(new c0(), 0.04).texture;
      generator.dispose();
    }
    N.scene.environment = quality.environment ? cachedEnvironment : null;
    N.scene.environmentIntensity = quality.environment ? 0.5 : 0;
    if (quality.effects) N.scene.add(N.ballSpeedTrail.object);
    else { N.resetBallTrail(); N.ballSpeedTrail.object.removeFromParent(); }
    N.scene.traverse(object => {
      for (const material of Array.isArray(object.material) ? object.material : [object.material])
        if (material) {
          setParkBankQuality(material, W.qualityPreset);
          setCarMaterialQuality(material, W.qualityPreset);
        }
    });
    N.markRenderTreeChanged(); previewDirty = true;
    N.setStadiumVisible(W.showStadium).then(() => { previewDirty = true; }).catch(error => Xe.setStatus(`Stadium could not load: ${error.message}`));
    gt?.setFpsLimit(W.limitFps ? W.maxFps : null);
  };
  ((te.domElement.style.filter = quality.colorFilter),
    an.appendChild(te.domElement),
    te.domElement.addEventListener("mousedown", (W) => {
      ((le = ne && J.size === 0 && W.button === 0),
        !(!ne || J.size > 0) &&
          (W.preventDefault(),
          W.stopPropagation(),
          k.keyboard.toggleSettings.some(
            (fe) => fe.kind === "mouse" && fe.button === W.button,
          ) && ue()));
    }),
    te.domElement.addEventListener("click", (W) => {
      const fe = le;
      ((le = !1),
        !(!fe || !ne || J.size > 0 || W.button !== 0) &&
          (W.preventDefault(), W.stopPropagation(), st()));
    }));
  const Ge = Xe.attachStatus(
    (W) => (Se == null ? void 0 : Se.apply(W)),
    () => (Se == null ? void 0 : Se.showDetails()),
  );
  Se = new GameHud(an, He, te, Ge, (W) => qe("status", W), () => gpuFrameTimer.snapshot());
  window.addEventListener("resize", () => {
    previewDirty = true;
    ((H.camera.aspect = window.innerWidth / window.innerHeight),
      H.camera.updateProjectionMatrix(),
      te.setSize(window.innerWidth, window.innerHeight));
  });
  let ze = performance.now(),
    Fe = 0,
    ke = x.read();
  const nt = new F(),
    Te = new F(),
    pt = new F(),
    $ = new F(),
    be = { onGround: !1, groundNormal: nt, velocity: Te, supersonic: !1 },
    he = () => {
      var nn;
      const W = Ks(),
        fe =
          ((nn = W == null ? void 0 : W.buttons[8]) == null
            ? void 0
            : nn.pressed) ?? !1,
        Ft = W ? JSON.stringify([W.id, W.index]) : null;
      (Ft !== Me && (ve = fe), (Me = Ft));
      const Nt = !online?.active && !online?.visible && fe && !ve && !Xe.isOpen && !(de != null && de.isOpen) && !J.has("physics-lab");
      (Nt && (pe.isOpen ? pe.hide() : pe.show()),
        (ve = fe),
        Nt && (R.capturing = !0));
      let Rn = R.read();
      (Nt && (R.capturing = !1),
        je &&
          ((je = [0, 1, 8, 9].some((ir) => {
            var sr;
            return (sr = W == null ? void 0 : W.buttons[ir]) == null
              ? void 0
              : sr.pressed;
          })),
          je && (Rn = A)));
      const zn = D.read(),
        Sr = x.read(),
        Pn = R.active() ? "gamepad" : D.active() ? "touch" : "keyboard",
        on = Pn === "gamepad" ? Rn : Pn === "touch" ? zn : Sr,
        Mt = !document.hidden && document.hasFocus();
      ((be.lookX = Mt
        ? Gt.clamp(x.cameraLook.x + (je ? 0 : R.cameraLook.x), -1, 1)
        : 0),
        (be.lookY = Mt
          ? Gt.clamp(x.cameraLook.y + (je ? 0 : R.cameraLook.y), -1, 1)
          : 0),
        (Fe = on.throttle),
        (ke = on),
        n.setControls(r, on));
    },
    Le = n.getPads(),
    Ie = () => {
      if (h) return;
      h = !0;
      const W = d;
      o.decide(n.state, Le, no, t.botTeam)
        .then((fe) => {
          W === d && ((l = fe), (c = o.option.tickSkip), (h = !1));
        })
        .catch((fe) => {
          W === d &&
            ((h = !1),
            (p = !0),
            (a.state.paused = !0),
            pe.showError(
              fe instanceof Error
                ? fe.message
                : "The opponent stopped responding.",
            ));
        });
    },
    me = () => {
      if (pendingGoal || goalPresentation?.active || a.state.paused || a.state.phase === "ended" || p) return !1;
      if (a.state.phase === "playing") {
        const W = o.getKickoffControls(n.state, u);
        if (W) ((l = W), o.overrideControls(W));
        // Keep real time moving while inference runs; hold the last bot action.
        else if (c === 0) Ie();
        (n.setControls(no, l), n.step(1), u++);
        if (!W && c > 0) c--;
        const fe = n.state;
        const scoredGoal = n.pollGoal();
        if (scoredGoal) pendingGoal = { team: scoredGoal === 1 ? 0 : 1, mode: "match" };
        (a.tick({
          goal: scoredGoal,
          ballOnGround: n.ballOnGround,
          kickoffTouched:
            Math.abs(fe[STATE_LAYOUT.BALL]) + Math.abs(fe[STATE_LAYOUT.BALL + 1]) > 1 ||
            Math.hypot(fe[STATE_LAYOUT.BALL + 12], fe[STATE_LAYOUT.BALL + 13]) > 1,
        }) === "kickoff" && _e(),
          a.state.phase === "playing" &&
            c === 0 &&
            !o.getKickoffControls(n.state, u) &&
            Ie());
      } else a.tick() === "kickoff" && _e();
      return !0;
    };
  if (new URLSearchParams(window.location.search).get("physicsDebug") === "1") {
    Object.defineProperty(window, "rocketArenaPhysics", {
      configurable: true,
      value: createPhysicsDebug(s, {
        metadata: () => ({ units: "uu (1 uu = 1 cm)", axes: "native X/Y horizontal, Z up",
          stateLayout: { ...STATE_LAYOUT }, carLayout: { ...CAR_STATE }, carStride: CAR_STATE_STRIDE,
          core: n.physicsSelection.engine, selection: n.physicsSelection,
          implementation: n.physicsSelection.engine === "experimental" ? "source-built RocketSim" : "original embedded core",
          sourceRevision: n.physicsSelection.engine === "experimental" ? SOURCE_CORE_REVISION : null,
          coreSha256: n.physicsSelection.engine === "experimental" ? SOURCE_CORE_SHA256 : ORIGINAL_GAMEPLAY_CORE_SHA256,
          parity: "No live Rocket League parity claim" }),
        context: () => ({ mode: a.state.mode, phase: a.state.phase,
          physicsSelection: n.physicsSelection, playerControls: { ...ke }, botControls: { ...l },
          botPending: h, botTicksRemaining: c, carConfigurations: n.carConfigs }),
      }),
    });
  }
  await Promise.all([
    ...[
      "400 16px Archivo",
      "500 16px Archivo",
      "700 16px Archivo",
      '400 20px "Lilita One"',
    ].map((W) => document.fonts.load(W)),
  ]);
  completeLoadingTask("fonts", "Interface ready", "Fonts and match controls are ready.");
  setLoadingStatus("Starting renderer", "Drawing the first playable frame.");
  N.update(s.prevState, s.currState, 0, 0, 0, A, A, !1);
  H.update(N.cars[r], N.ball, 0, be);
  renderGame(N.scene, H.camera);
  ze = performance.now();
  s.sync(ze);
  completeLoadingTask("renderer", "Ready", "Entering Rocket Arena.");
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  nd.remove();
  function wt(W) {
    if (localMulti?.active) return localMulti.frame(W); // AIR JAM PATCH
    if (home?.visible && !online?.active) {
      ze = W; s.sync(W);
      if (home.consumeDirty() || previewDirty) { renderHomePreview(); previewDirty = false; return; }
      return false;
    }
    if (pauseMenu?.isOpen && !online?.active) {
      ze = W; s.sync(W);
      if (previewDirty) { renderGame(N.scene,H.camera); previewDirty = false; return; }
      return false;
    }
    if (goalPresentation?.active) {
      const delta = Math.min(Math.max(0, (W - ze) / 1000), 0.1);
      ze = W; s.sync(W);
      if (document.hidden || !document.hasFocus() || [...J].some(key => key !== "goal")) return;
      He.frameStart();
      const skipPad = Ks(), skipPressed = !!(skipPad?.buttons[0]?.pressed || skipPad?.buttons[1]?.pressed || skipPad?.buttons[2]?.pressed);
      if (goalPresentation.replaying && skipPressed && !goalSkipDown) goalPresentation.finish();
      goalSkipDown = skipPressed;
      goalPresentation.update(delta); arenaEffects.update(delta);
      quality.shadows && (te.shadowMap.needsUpdate = true);
      renderGame(N.scene, H.camera); He.frameEnd(0, 0, false);
      return;
    }
    var ar;
    He.frameStart();
    const fe = Math.min((W - ze) / 1e3, 0.1);
    n.setGoalExplosionEnabled(!online?.active && (a.state.mode === "match" || !V.disableGoalReset));
    ((ze = W),
      (a.state.paused =
        !online?.active && a.state.mode === "match" &&
        (ne || J.size > 0 || document.hidden || !document.hasFocus() || p)),
      online?.active ? (he(), online.update(W, ke, s)) : a.state.paused || (a.state.mode === "match" && a.state.phase === "ended") || (a.state.mode === "freeplay" && J.size > 0)
        ? (he(), s.sync(W))
        : s.update(W, he, a.state.mode === "match" ? me : void 0),
      a.state.mode === "freeplay" &&
        (() => { const goal = n.pollGoal();
          if (goal && !V.disableGoalReset) pendingGoal = { team: goal === 1 ? 0 : 1, mode: "freeplay" };
        })(),
      pe.update(a.state),
      an.dataset.gameMode !== a.state.mode &&
        ((an.dataset.gameMode = a.state.mode),
        D.setMatchActive(a.state.mode === "match")),
      He.mark());
    const Ft =
      a.state.mode === "freeplay" ||
      (!a.state.paused && a.state.phase === "playing");
    N.update(s.prevState, s.currState, s.alpha, fe, Fe, ke, l, Ft);
    const Nt = STATE_LAYOUT.CARS + r * CAR_STATE_STRIDE;
    (Y.update(
      fe,
      s.currState[Nt + CAR_STATE.FLIP_RESET_SERIAL],
      s.currState[Nt + CAR_STATE.DEMOED] !== 1,
    ),
      g.update({
        jumpSerial: s.currState[Nt + CAR_STATE.JUMP_SERIAL],
        dodgeSerial: s.currState[Nt + CAR_STATE.DODGE_SERIAL],
        doubleJumpSerial: s.currState[Nt + CAR_STATE.DOUBLE_JUMP_SERIAL],
        wheelImpactSerial: s.currState[Nt + CAR_STATE.WHEEL_IMPACT_SERIAL],
        wheelImpactSpeed: s.currState[Nt + CAR_STATE.WHEEL_IMPACT_SPEED],
        audible: s.currState[Nt + CAR_STATE.DEMOED] !== 1,
      }),
      pt.subVectors(N.ball.position, H.camera.position).normalize(),
      $.setFromMatrixColumn(H.camera.matrixWorld, 0).normalize());
    const Rn = s.currState[Nt + CAR_STATE.BALL_HIT_SERIAL],
      zn =
        a.state.mode === "match"
          ? s.currState[Nt + CAR_STATE_STRIDE + CAR_STATE.BALL_HIT_SERIAL]
          : 0,
      Sr = Math.max(
        Rn !== y[0] ? s.currState[Nt + CAR_STATE.BALL_HIT_SPEED] : 0,
        zn !== y[1] ? s.currState[Nt + CAR_STATE_STRIDE + CAR_STATE.BALL_HIT_SPEED] : 0,
      ),
      Pn = Gt.clamp(pt.dot($), -1, 1);
    (m.update({
      carSerial: Rn + zn,
      carSpeed: Sr,
      carPan: zn !== y[1] ? Pn : 0,
      worldSerial: s.currState[Nt + CAR_STATE.BALL_WORLD_IMPACT_SERIAL],
      worldSpeed: s.currState[Nt + CAR_STATE.BALL_WORLD_IMPACT_SPEED],
      worldSurface: s.currState[Nt + CAR_STATE.BALL_WORLD_SURFACE] === 0 ? 0 : 1,
      worldPan: Pn,
      audible: !0,
    }),
      (y[0] = Rn),
      (y[1] = zn),
      He.mark());
    const on = STATE_LAYOUT.CARS + r * CAR_STATE_STRIDE,
      Mt = s.currState;
    ((be.onGround = Mt[on + CAR_STATE.ON_GROUND] === 1),
      (be.supersonic = Mt[on + CAR_STATE.SUPERSONIC] === 1),
      nt.set(
        Mt[on + CAR_STATE.GROUND_NORMAL],
        Mt[on + CAR_STATE.GROUND_NORMAL + 2],
        Mt[on + CAR_STATE.GROUND_NORMAL + 1],
      ),
      Te.set(Mt[on + CAR_STATE.VEL], Mt[on + CAR_STATE.VEL + 2], Mt[on + CAR_STATE.VEL + 1]),
      H.update(N.cars[r], N.ball, fe, be),
      He.mark(),
      N.updateBallLocatorArrow(H.ballCam, r),
      Ze.hidden === H.ballCam && (Ze.hidden = !H.ballCam),
      _1(H.camera));
    if (J.size === 0 && !ne && !document.hidden && document.hasFocus() &&
        (a.state.mode === "freeplay" || a.state.phase === "playing" || pendingGoal)) {
      replayClock += fe;
      if (replayClock - lastReplayRecord >= 1 / 120 || pendingGoal) {
        captureReplayFrame(); lastReplayRecord = replayClock;
      }
      detectBoostPickups();
    } else syncPadHistory();
    arenaEffects.update(fe);
    if (pendingGoal) {
      const goal = pendingGoal; pendingGoal = null; motionEffects.clear();
      const scorerIndex = goal.mode === "freeplay" || goal.team === t.playerTeam ? r : no;
      goalPresentation.begin({ time: replayClock, state: s.currState,
        scorerIndex, team: goal.team, mode: goal.mode,
        scorerName: scorerIndex === r ? "YOU" : JA(o.id).name });
      quality.shadows && (te.shadowMap.needsUpdate = true);
      renderGame(N.scene,H.camera); He.frameEnd(s.lastTicks,s.lastDropped,s.lastStalled);
      return;
    }
    for (let bn = 0; bn < E.length; bn++) {
      const B = STATE_LAYOUT.CARS + bn * CAR_STATE_STRIDE,
        pi = bn === r ? ke : l,
        In = bn < Mt[STATE_LAYOUT.NUM_CARS],
        Ys =
          Mt[B + CAR_STATE.VEL] * Mt[B + CAR_STATE.FWD] +
          Mt[B + CAR_STATE.VEL + 1] * Mt[B + CAR_STATE.FWD + 1] +
          Mt[B + CAR_STATE.VEL + 2] * Mt[B + CAR_STATE.FWD + 2];
      E[bn].update(
        {
          forwardSpeed: Ys,
          throttle: pi.throttle,
          handbrake: pi.handbrake,
          boosting: In && Mt[B + CAR_STATE.IS_BOOSTING] === 1,
          onGround: In && Mt[B + CAR_STATE.ON_GROUND] === 1,
          alive: In && Mt[B + CAR_STATE.DEMOED] !== 1,
          audible: x.enabled && Ft,
          controllerActive: R.active() || D.active(),
          position: (ar = N.cars[bn]) == null ? void 0 : ar.position,
        },
        fe,
      );
    }
    quality.effects && N.prepareBallSpeedTrail(H.camera);
    motionEffects.update(fe, N.cars, s.currState, STATE_LAYOUT, CAR_STATE_STRIDE, CAR_STATE, H.camera, { wheels: N.carWheels, specs: N.carWheelSpecs, stride: EC }, Ft);
    const nn = STATE_LAYOUT.CARS + r * CAR_STATE_STRIDE,
      ir =
        s.currState[nn + CAR_STATE.SUPERSONIC] === 1 &&
        s.currState[nn + CAR_STATE.DEMOED] !== 1;
    (Te.set(
      s.currState[nn + CAR_STATE.VEL],
      s.currState[nn + CAR_STATE.VEL + 2],
      s.currState[nn + CAR_STATE.VEL + 1],
    ),
      C.update(ir, R.active(), x.enabled && Ft));
    speedLines.update(fe, ir && Ft, Te, H.camera);
    const sr = STATE_LAYOUT.CARS + r * CAR_STATE_STRIDE;
    (Be.update(
      s.currState[sr + CAR_STATE.BOOST],
      s.currState[sr + CAR_STATE.IS_BOOSTING] === 1,
      a.state.mode === "freeplay" && V.boostOption === "unlimited",
    ),
      He.mark());
    (He.mark(),
      quality.shadows && (te.shadowMap.needsUpdate = !0),
      renderGame(N.scene, H.camera),
      (() => { if (speedLines.pass.enabled) { const auto = te.autoClear; te.autoClear = false; te.render(speedLines.pass.scene, speedLines.pass.camera); te.autoClear = auto; } })(),
      He.mark(),
      He.frameEnd(s.lastTicks, s.lastDropped, s.lastStalled));
  }
  replayBuffer = new GoalReplayBuffer({ seconds: 10, maxFps: 120, stateSize: s.currState.length });
  motionEffects = createCarMotionEffects({ Vector2:Ae,Vector3:F,Texture:Zt,LinearFilter:qt,
    ShaderMaterial:Lt,BufferGeometry:Ct,Float32BufferAttribute:Ke,Color:Ne,Mesh:Ee,
    SphereGeometry:Ur,DoubleSide:Ut,AdditiveBlending:li }, N.scene, te);
  arenaEffects = createArenaEffects({ BufferGeometry: Ct, Float32BufferAttribute: Ke,
    MeshBasicMaterial: cn, InstancedMesh: Lm, Object3D: It, Color: Ne,
    Mesh: Ee, RingGeometry: Ya, DoubleSide: Ut }, N.scene, {
    lightweight: initialGraphics.qualityPreset === "potato", audioContext: getAudioContext, audioOutput: getAudioInput,
  });
  const parkedState = s.currState.slice();
  const replayState = new Float32Array(s.currState.length);
  const replayBasis = new F(), replayMatrix = new mt();
  const replayCameras = [0, 1].map(() => ({ position: [0,0,0], quaternion: [0,0,0,1], fov: 110 }));
  const botReplayCamera = new fn(110, H.camera.aspect, 4, 40000);
  const botForward = new F(), botTarget = new F();
  const padHistory = new Uint8Array(Le.length);
  function syncPadHistory() { for (let index=0;index<Le.length;index++) padHistory[index] = s.currState[ro+index*2] === 1 ? 1 : 0; }
  syncPadHistory();
  function detectBoostPickups() {
    for (let index=0; index<Le.length; index++) {
      const active = s.currState[ro+index*2] === 1 ? 1 : 0;
      if (padHistory[index] && !active) {
        const pad = Le[index];
        const point = replayBasis.set(pad.pos[0], 25, pad.pos[1]);
        const nearby = N.cars[r].position.distanceToSquared(point) < 1200 * 1200;
        arenaEffects.pickup(point, pad.isBig, nearby);
      }
      padHistory[index] = active;
    }
  }
  function captureReplayFrame() {
    replayState.set(s.currState);
    const storePose = (object, offset) => {
      replayState[offset]=object.position.x; replayState[offset+1]=object.position.z; replayState[offset+2]=object.position.y;
      replayMatrix.makeRotationFromQuaternion(object.quaternion);
      for (const [column, relative] of [[0,3],[2,6],[1,9]]) {
        replayBasis.setFromMatrixColumn(replayMatrix,column);
        replayState[offset+relative]=replayBasis.x; replayState[offset+relative+1]=replayBasis.z; replayState[offset+relative+2]=replayBasis.y;
      }
    };
    storePose(N.ball,STATE_LAYOUT.BALL);
    for(let index=0;index<s.currState[STATE_LAYOUT.NUM_CARS];index++)storePose(N.cars[index],STATE_LAYOUT.CARS+index*CAR_STATE_STRIDE);
    H.camera.position.toArray(replayCameras[r].position);H.camera.quaternion.toArray(replayCameras[r].quaternion);replayCameras[r].fov=H.camera.fov;
    if(N.cars[no]?.visible){
      const bot=N.cars[no]; botForward.set(1,0,0).applyQuaternion(bot.quaternion);
      botReplayCamera.position.copy(bot.position).addScaledVector(botForward,-H.settings.distance);
      botReplayCamera.position.y+=H.settings.height;
      botTarget.copy(N.ball.position);botReplayCamera.lookAt(botTarget);
      botReplayCamera.position.toArray(replayCameras[no].position);botReplayCamera.quaternion.toArray(replayCameras[no].quaternion);replayCameras[no].fov=H.settings.fov;
    }
    replayBuffer.record(replayClock,replayState,replayCameras);
  }
  function renderHomePreview() {
    const orbit=home.orbit, car=N.cars[r];
    // Startup physics has not settled its suspension yet. Use the model's
    // resting hubs for display, recalculating for the currently selected car.
    const wheels=N.carWheels[r], specs=N.carWheelSpecs[r];
    for(let index=0;index<wheels.length;index++) {
      const offset=STATE_LAYOUT.CARS+r*CAR_STATE_STRIDE+CAR_STATE.WHEELS+index*EC;
      const connection=N.carPhysicsConfigs?.[r]?.wheels[index].connectionXYZ[2] ?? (N.carVisuals[r]==="flat-car"?e1:YS);
      parkedState[offset]=connection-wheels[index].restHeight;
      parkedState[offset+1]=0;
      parkedState[offset+2]=1;
    }
    N.update(parkedState,parkedState,0,0,0,A,A,false);
    const gimbal=N.carGimbals[r];
    if(gimbal){gimbal.rollRing.rotation.x=0;gimbal.cradle.rotation.z=0;gimbal.seat.rotation.y=0;}
    const rideHeight=Math.max(...wheels.map((wheel,index)=>specs[index][2]-wheel.restHeight-wheel.restOffset));
    car.visible=true;car.position.set(0,rideHeight,0);car.quaternion.set(0,0,0,1);
    for(let index=0;index<N.cars.length;index++)if(index!==r)N.cars[index].visible=false;
    N.ball.visible=false;N.indicatorRing.visible=false;N.indicatorHeightRing.visible=false;N.ballLocatorArrow.object.visible=false;
    N.scene.background=new Ne(0x547d99);
    const radius=260*orbit.distance, horizontal=Math.cos(orbit.pitch)*radius;
    H.camera.fov=38;
    H.camera.position.set(car.position.x+Math.sin(orbit.yaw)*horizontal,car.position.y+Math.sin(orbit.pitch)*radius+30,car.position.z+Math.cos(orbit.yaw)*horizontal);
    const side=window.innerWidth<700?25:55;
    const target=[car.position.x-Math.cos(orbit.yaw)*side,car.position.y+18,car.position.z+Math.sin(orbit.yaw)*side];
    H.camera.up.set(0,1,0);H.camera.lookAt(...target);
    H.camera.updateProjectionMatrix();
    quality.shadows && (N.updateSubjectShadows(),te.shadowMap.needsUpdate=true);
    renderGame(N.scene,H.camera);
  }
  const celebrationPhysics = new GoalCelebrationPhysics(n,{playerIndex:r,neutralControls:A,sampleControls:he});
  goalPresentation = new GoalPresentation({ world:N,camera:H.camera,buffer:replayBuffer,effects:arenaEffects,root:an,
    playerIndex:r,carStride:CAR_STATE_STRIDE,carOffset:STATE_LAYOUT.CARS,boostOffset:CAR_STATE.BOOST,neutralControls:A,
    celebration:{
      begin:()=>celebrationPhysics.begin(),
      update:(delta)=>{
        const clock=celebrationPhysics.update(delta), state=clock.currState, offset=STATE_LAYOUT.CARS+r*CAR_STATE_STRIDE;
        N.update(clock.prevState,state,clock.alpha,delta,Fe,ke,A,true);
        be.onGround=state[offset+CAR_STATE.ON_GROUND]===1;
        be.supersonic=state[offset+CAR_STATE.SUPERSONIC]===1;
        nt.set(state[offset+CAR_STATE.GROUND_NORMAL],state[offset+CAR_STATE.GROUND_NORMAL+2],state[offset+CAR_STATE.GROUND_NORMAL+1]);
        Te.set(state[offset+CAR_STATE.VEL],state[offset+CAR_STATE.VEL+2],state[offset+CAR_STATE.VEL+1]);
        H.update(N.cars[r],N.ball,delta,be);
        motionEffects.update(delta,N.cars,state,STATE_LAYOUT,CAR_STATE_STRIDE,CAR_STATE,H.camera,{wheels:N.carWheels,specs:N.carWheelSpecs,stride:EC},true);
        Be.update(state[offset+CAR_STATE.BOOST],state[offset+CAR_STATE.IS_BOOSTING]===1,a.state.mode==="freeplay"&&V.boostOption==="unlimited");
      },
    },
    onReplay:()=>{motionEffects.clear();ge();},
    onBoost:(boost)=>Be.update(boost,false,false),
    onStart:()=>{
      w();C.silence();const pad=Ks();goalSkipDown=!!(pad?.buttons[0]?.pressed||pad?.buttons[1]?.pressed);
      ne=false;qe("goal",true);
    },
    onFinish:({cancel})=>{
      motionEffects.clear();ne=false;qe("goal",false);
      document.activeElement instanceof HTMLElement && document.activeElement.blur();
      if(!cancel){
        if(a.state.mode==="match"){
          a.state.paused=false;a.phaseTicks=1;
          if(a.tick()==="kickoff")_e();
        }else _e();
      }
      n.resetView();s.sync();N.update(s.prevState,s.currState,0,0,0,A,A,false);
      H.update(N.cars[r],N.ball,0,be);syncPadHistory();pe.update(a.state);ge();
    },
  });
  de.onChoose = async visual => {
    if (a.state.mode === "match" || goalPresentation?.active) throw new Error("Leave the match or finish the replay before changing cars.");
    if (J.has("physics-loading")) throw new Error("Wait for the physics change to finish.");
    J.add("car-loading"); ge();
    const generation = d;
    try {
      const team = visual === "game-car" || isSketchfabCar(visual) ? 1 : 0;
      const draft = await N.prepareLiveCar(visual, team);
      await n.switchPhysics(resolvePhysicsSelection(window.location.search, visual), visual === "flat-car" ? "flat" : "default", false, team,
        V.boostOption === "unlimited", () => a.state.mode !== "match" && generation === d);
      N.commitLiveCar(draft); N.cars[r].add(Y.root);
      i = visual; e = team; t = getTeamAssignment(i === "flat-car"); pe.options.playerTeam = t.playerTeam;
      syncNativeGeometry(); _e(); previewDirty = true;
    } finally { J.delete("car-loading"); ge(); }
  };
  home = mountHome(an, {
    pause: (open) => {
      if (open) {
        w(); C.silence(); arenaEffects.clear(); motionEffects.clear(); N.resetBallTrail(); previewDirty = true;
        previewRestore = { background: N.scene.background, camera: H.camera.clone() };
      } else if (previewRestore) {
        N.scene.background = previewRestore.background;
        H.camera.copy(previewRestore.camera);
        H.camera.aspect=window.innerWidth/window.innerHeight;H.camera.updateProjectionMatrix();
        N.update(s.prevState, s.currState, s.alpha, 0, 0, A, A, false);
        N.ball.visible = true; N.indicatorRing.visible = true; N.indicatorHeightRing.visible = true;
        N.ballLocatorArrow.object.visible = true;
        previewRestore = null;
      }
      qe("home", open);
    },
    casual: () => { pe.options.onLeave(); void online.open("casual"); },
    ranked: () => { pe.options.onLeave(); void online.open("ranked"); },
    match: () => { returnHomeAfter = "match"; ne = true; pe.show(); },
    freeplay: () => { pe.options.onLeave(); st(); },
    garage: () => { returnHomeAfter = "car"; ne = true; de.show(); },
    settings: () => { returnHomeAfter = "settings"; ne = true; Xe.show(); },
  });
  pauseMenu = mountPauseMenu(an, {
    pause: open => { if (open) { w(); C.silence(); } qe("pause",open); },
    resume: () => st(),
    settings: () => { returnPauseAfter = true; Xe.show(); },
    home: () => { pe.options.onLeave(); home.show(); },
  });
  an.querySelector("#settings-button").addEventListener("click",event=>{
    event.preventDefault();event.stopImmediatePropagation();pauseMenu.show();
  },true);
  online = mountOnline(an, {
    sim: n, match: a, visual: () => i,
    modal: open => { ne = open; qe("online", open); },
    resume: () => st(), home: () => home.show(), closeHome: () => home.close(),
    bots: () => { ne = true; pe.show(); },
    prepare: async (roster, order, valid, descriptor) => {
      goalPresentation?.finish({ cancel: true }); v(); p = false;
      const ordered = order.map(index => roster[index]);
      await N.prepareOnlineRoster(ordered);
      if (!valid()) { while (N.cars.length > 1) N.removeOpponent(); return; }
      await n.prepareOnline(ordered, descriptor, valid); syncNativeGeometry(); a.start(); a.state.phase = "waiting";
      n.setGoalExplosionEnabled(false); s.sync(); n.resetView();
    },
    restore: () => {
      n.releaseOnline();
      while (N.cars.length > 1) N.removeOpponent();
      N.cars[0].userData.garageTeam = e; N.applyGarageCustomization(i);
      pe.options.onLeave();
    },
  });
  if (new URLSearchParams(location.search).get("physicsDebug") === "1") {
    Object.defineProperty(window, "rocketArenaOnline", { value: Object.freeze({ snapshot: () => online.diagnostics() }) });
  }
  // AIR JAM PATCH: local N-car match controller.
  // Each viewport gets its own post-processing chain sized to its rectangle
  // (`sizeOverride`), because both post classes size their targets from the
  // whole drawing buffer. The branches mirror `renderGame` above.
  const makeViewPost = () => {
    let reference = null, fennec = null, arena = null;
    return {
      render(scene, camera, sizePx, fx) {
        // The match's own grade (bloom, tone map, dusk look, speed feel). `?plainpost`
        // falls back to the donor chains for A/B comparison.
        if (!PLAIN_POST) {
          arena ??= new ArenaPost(te);
          arena.render(scene, camera, sizePx, fx);
          return;
        }
        const theme = getTheme();
        N.updateSceneryDetail(camera);
        if (theme === 'realistic') {
          referenceLighting.update(N, theme);
          reference ??= new ReferencePost(te);
          reference.sizeOverride = sizePx;
          reference.render(scene, camera, referenceLighting.settings, referencePreset, theme);
        } else if (isSketchfabCar(N.carVisual)) {
          fennec ??= new FennecV2Post(te);
          fennec.sizeOverride = sizePx;
          fennec.render(scene, camera, !quality.effects);
        } else te.render(scene, camera);
      },
      dispose() { reference?.dispose(); fennec?.dispose(); arena?.dispose(); },
    };
  };
  localMulti = createLocalMultiplayer({
    sim: n, world: N, session: a, clock: s, renderer: te, root: an,
    baseCamera: H, profiler: He, quality,
    get goalPresentation() { return goalPresentation; },
    get arenaEffects() { return arenaEffects; },
    get motionEffects() { return motionEffects; },
    get replayBuffer() { return replayBuffer; },
    engines: E, vehicleAudio: g, impactAudio: m, ballAudio: C, impactSerials: y,
    neutralControls: A, pads: Le, wheelStride: EC, setAudioListener: _1,
    makePost: makeViewPost,
    // Dev/debug only: lets a harness inspect the scene graph and tune the look live.
    exposeDebug: () => { window.__arena = { world: N, renderer: te }; },
    resetKickoff: _e,
    syncNativeGeometry,
    garageVisual: () => i,
    // Swap the donor's boot car body for the first player's chosen one. This is the
    // garage's own flow (`de.onChoose`) minus `switchPhysics`: a local match
    // rebuilds the physics roster itself (`configureOnline`), per-car hitboxes
    // included, so only the visual needs to change here.
    setPrimaryVisual: async (visual, team) => {
      const draft = await N.prepareLiveCar(visual, team);
      N.commitLiveCar(draft);
      N.cars[r].add(Y.root);
      i = visual; e = team;
      previewDirty = true;
    },
    // Same teardown the online flow uses to get back to the offline donor.
    leave: () => {
      while (N.cars.length > 1) N.removeOpponent();
      N.cars[0].userData.garageTeam = e; N.applyGarageCustomization(i);
      pe.options.onLeave();
    },
  });
  arenaBridge.attach(localMulti);
  if (arenaBridge.embedded) {
    // In Air Jam the lobby is the projector's job, not the donor's menus.
    an.classList.add("airjam-embedded");
  } else {
    home.show();
    void online.restoreIntent();
  }
  ((gt = new FrameScheduler(te.getContext(), wt, (W) => He.displayFrame(W), W => {
      if (online?.active) { he(); online.update(W, ke, s, false); }
    })),
    gt.setFpsLimit(We.limitFps ? We.maxFps : null),
    xe(),
    gt.start());
}

export function boot() {
return startGame().catch((i) => {
  nd.dataset.state = "error";
  const e = nd.querySelector(".load__label");
  (e && (e.textContent = "Failed to start"),
    (rd.textContent = i instanceof Error ? i.message : String(i)),
    console.error(i));
  if (new URLSearchParams(window.location.search).has("physics")) {
    const recovery = document.createElement("a");
    recovery.textContent = "Restart with original physics";
    recovery.href = physicsModeURL(window.location.href, "original");
    recovery.style.color = "#a6e7ff";
    nd.append(recovery);
  }
});

}
