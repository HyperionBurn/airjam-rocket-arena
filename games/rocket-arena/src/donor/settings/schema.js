import { createSettingsStore, readBoolean, readChoice, readNumber } from "../core/settings-store.js";
import { Ps } from "../rendering/camera.js";

const _g = [
    {
      key: "frame",
      label: "Frame Time",
      note: "Average with p50, p95, p99 and the worst frame.",
    },
    {
      key: "chart",
      label: "History Plot",
      note: "Recent frame times against the display's budget.",
    },
    {
      key: "phases",
      label: "Time Breakdown",
      note: "CPU cost of sim, scene, camera, prep and the render passes.",
    },
    {
      key: "sim",
      label: "Simulation",
      note: "Tick rate, and ticks dropped when the loop falls behind.",
    },
    {
      key: "renderer",
      label: "Renderer",
      note: "Draw calls, triangles, and resident geometry and textures.",
    },
  ];

const Yh = createSettingsStore(
    "rocket-arena.status-settings.v1",
    () => ({
      enabled: !0,
      frame: !0,
      chart: !0,
      phases: !0,
      sim: !0,
      renderer: !1,
      phasesCollapsed: !1,
      details: !1,
    }),
    (i, e) => {
      ((i.enabled = readBoolean(e.enabled, i.enabled)),
        (i.phasesCollapsed = readBoolean(e.phasesCollapsed, i.phasesCollapsed)),
        (i.details = readBoolean(e.details, i.details)));
      for (const t of _g) i[t.key] = readBoolean(e[t.key], i[t.key]);
    },
  );

const localQualityPresetIds = ["potato", "balanced", "high"];

const localQualityProfiles = {
    potato: {
      label: "Potato",
      pixelRatio: 0.6,
      antialias: !1,
      shadows: !1,
      effects: !1,
      detailedBall: !0,
      environment: !1,
      showStadium: !1,
      maxFps: 120,
      exposure: 1.15,
      colorFilter: "none",
    },
    balanced: {
      label: "Balanced",
      pixelRatio: 0.7,
      antialias: !1,
      shadows: !1,
      effects: !1,
      detailedBall: !0,
      environment: !1,
      showStadium: !1,
      maxFps: 120,
      exposure: 1.15,
      colorFilter: "none",
    },
    high: {
      label: "High",
      pixelRatio: 2,
      antialias: !0,
      shadows: !0,
      effects: !0,
      detailedBall: !0,
      environment: !0,
      showStadium: !1,
      maxFps: 120,
      exposure: 1.15,
      colorFilter: "none",
    },
  };

const localQualityProfile = (i) =>
    localQualityProfiles[i] ?? localQualityProfiles.balanced;

const Ma = 30;

const SA = 120;

const graphicsSettings = createSettingsStore(
    "rocket-arena.local-graphics-presets.v1",
    () => ({
      qualityPreset: "balanced",
      renderScale: 0.85,
      showStadium: !1,
      limitFps: !0,
      maxFps: 60,
    }),
    (i, e) => {
      ((i.qualityPreset = readChoice(
        e.qualityPreset,
        localQualityPresetIds,
        i.qualityPreset,
      )),
        (i.renderScale = readNumber(e.renderScale, Math.min(1, localQualityProfile(i.qualityPreset).pixelRatio), { min: 0.1, max: 1 })),
        (i.showStadium = readBoolean(e.showStadium, i.showStadium)),
        (i.limitFps = readBoolean(e.limitFps, i.limitFps)),
        (i.maxFps = readNumber(e.maxFps, i.maxFps, { min: Ma, max: SA, integer: !0 })));
    },
  );

const EM = "rocket-arena.camera-settings.v1";

const yM = "rocket-arena.training-settings.v1";

const xM = ["unlimited", "standard"];

const trainingDefaults = { disableGoalReset: !1, boostOption: "unlimited", showCarHitbox: !1 };

const CM = ["camera", "controls", "graphics", "audio", "training", "diagnostics"];

const bM = [
    {
      key: "fov",
      label: "Field of View",
      min: 60,
      max: 110,
      step: 1,
      decimals: 0,
      suffix: "°",
    },
    {
      key: "distance",
      label: "Distance",
      min: 100,
      max: 400,
      step: 10,
      decimals: 2,
    },
    {
      key: "height",
      label: "Height",
      min: 40,
      max: 200,
      step: 10,
      decimals: 2,
    },
    {
      key: "angleDeg",
      label: "Angle",
      min: -15,
      max: 0,
      step: 1,
      decimals: 2,
      suffix: "°",
    },
    {
      key: "stiffness",
      label: "Stiffness",
      min: 0,
      max: 1,
      step: 0.05,
      decimals: 2,
    },
    {
      key: "swivelSpeed",
      label: "Swivel Speed",
      min: 1,
      max: 10,
      step: 0.1,
      decimals: 2,
    },
    {
      key: "transitionSpeed",
      label: "Transition Speed",
      min: 1,
      max: 2,
      step: 0.1,
      decimals: 2,
    },
  ];

const Zh = new Map(bM.map((i) => [i.key, i]));

const SM = [
    {
      letter: "A",
      label: "Framing",
      note: "Adjust your view. Preview changes in the arena.",
      ranges: ["fov", "distance", "height", "angleDeg"],
      checks: [],
    },
    {
      letter: "B",
      label: "Response",
      note: "How the camera follows your car.",
      ranges: ["stiffness", "swivelSpeed", "transitionSpeed"],
      checks: [
        {
          key: "cameraShake",
          label: "Camera Shake",
          note: "Feel the impact of hits and landings.",
        },
        {
          key: "invertSwivel",
          label: "Invert Swivel",
          note: "Reverses vertical camera look in ball cam and car cam.",
        },
      ],
    },
  ];

const wM = [0, 1, 2, 3];

const cameraSettings = createSettingsStore(
    EM,
    () => ({ ...Ps }),
    (i, e) => {
      for (const t of Object.keys(Ps)) {
        const n = Ps[t];
        if (typeof n == "boolean") i[t] = readBoolean(e[t], n);
        else if (typeof n == "number") {
          const r = Zh.get(t);
          i[t] = readNumber(e[t], n, r ? { min: r.min, max: r.max } : {});
        }
      }
    },
  );

const trainingSettings = createSettingsStore(
    yM,
    () => ({ ...trainingDefaults }),
    (i, e) => {
      ((i.disableGoalReset = readBoolean(e.disableGoalReset, i.disableGoalReset)),
        (i.boostOption = readChoice(e.boostOption, xM, i.boostOption)),
        (i.showCarHitbox = readBoolean(e.showCarHitbox, i.showCarHitbox)));
    },
  );

export { CM, Ma, SA, SM, Yh, Zh, _g, cameraSettings, graphicsSettings, localQualityPresetIds, localQualityProfile, localQualityProfiles, trainingDefaults, trainingSettings, wM };
