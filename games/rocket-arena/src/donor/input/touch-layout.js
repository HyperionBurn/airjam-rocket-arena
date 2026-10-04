import { createSettingsStore, isRecord, readBoolean, readNumber } from "../core/settings-store.js";

const M0 = "touchsettingschanged";

const Ud = ["airRollLeft", "airRollRight", "airRoll"];

const qd = [
    "drive",
    "ballCam",
    "reset",
    "handbrake",
    "boost",
    "jump",
    ...Ud,
    "training",
  ];

const La = createSettingsStore(
    "rocket-arena.touch-settings.v1",
    () => ({
      extras: { airRollLeft: !1, airRollRight: !1, airRoll: !1 },
      layouts: { portrait: {}, landscape: {} },
    }),
    (i, e) => {
      if (isRecord(e.extras))
        for (const t of Ud) i.extras[t] = readBoolean(e.extras[t], i.extras[t]);
      if (isRecord(e.layouts))
        for (const t of ["portrait", "landscape"]) {
          const n = e.layouts[t];
          if (isRecord(n))
            for (const r of qd) {
              const s = n[r];
              isRecord(s) &&
                (typeof s.x != "number" ||
                  !Number.isFinite(s.x) ||
                  typeof s.y != "number" ||
                  !Number.isFinite(s.y) ||
                  (i.layouts[t][r] = {
                    x: readNumber(s.x, 0, { min: 0, max: 1 }),
                    y: readNumber(s.y, 0, { min: 0, max: 1 }),
                    size: readNumber(s.size, 1, { min: 0.75, max: 1.4 }),
                  }));
            }
        }
    },
  );

const Ss = (i, e) => (i > e ? "landscape" : "portrait");

const Of = {
    drive: "Drive stick",
    ballCam: "Ball camera",
    reset: "Reset shot",
    handbrake: "Powerslide",
    boost: "Boost",
    jump: "Jump",
    airRollLeft: "Air roll left",
    airRollRight: "Air roll right",
    airRoll: "Free air roll",
    training: "Training commands",
  };

const rb = [
    ["ballCam", "cam", "View", "Toggle ball camera", !1, "◉"],
    ["reset", "reset", "Reset", "Reset shot", !1, "↺"],
    ["handbrake", "handbrake", "Drift", "Hold powerslide and air roll", !0, "⌁"],
    ["boost", "boost", "Thrust", "Hold boost", !0, "↗"],
    ["jump", "jump", "Lift", "Hold jump", !0, "↑"],
    ["airRollLeft", "roll", "Roll left", "Hold air roll left", !0, "↶"],
    ["airRollRight", "roll", "Roll right", "Hold air roll right", !0, "↷"],
    ["airRoll", "roll", "Roll", "Hold free air roll", !0, "⟳"],
  ];

function B0() {
  return `<div class="touch-ball-actions" data-touch-control="training" role="group" aria-label="Training controls">
    ${[
      ["takePossession", "Claim", "Take possession"],
      ["startDribble", "Carry", "Start dribble"],
      ["passBall", "Pass", "Pass ball"],
      ["launchBall", "Kick", "Launch ball"],
    ]
      .map(
        ([i, e, t]) =>
          `<button class="touch-button" type="button" data-touch-tap="${i}" aria-label="${t}">${e}</button>`,
      )
      .join("")}
  </div>
  <div class="touch-stick-zone" data-touch-stick data-touch-control="drive" role="group" aria-label="Steering and throttle stick">
    <span class="touch-stick-zone__label" aria-hidden="true">Drive</span>
  </div>
  ${rb
    .map(
      ([
        i,
        e,
        t,
        n,
        r,
        s,
      ]) => `<button class="touch-button touch-button--${e}" type="button"
    data-touch-control="${i}" data-touch-${r ? "hold" : "tap"}="${i}" aria-label="${n}" ${r ? 'aria-pressed="false"' : ""}><span class="touch-button__glyph" aria-hidden="true">${s}</span><span class="touch-button__label">${t}</span></button>`,
    )
    .join("")}`;
}

const Fa = (i, e, t) => Math.max(e, Math.min(t, i));

function Lh(i) {
  const e = getComputedStyle(i),
    t = (n) => Math.max(10, parseFloat(e.getPropertyValue(`--safe-${n}`)) || 0);
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    left: t("left"),
    right: t("right"),
    top: t("top"),
    bottom: t("bottom"),
  };
}

function Fh(i, e) {
  const { width: t, height: n, left: r, right: s, top: a, bottom: o } = e,
    A = Fa(Math.min(t, n) * 0.29, 124, 158),
    l = t - r - s,
    c = Math.min(232, l),
    h = {
      drive: { left: r + 8, top: n - o - A - 8, width: A, height: A },
      jump: { left: t - s - 76, top: n - o - 76, width: 76, height: 76 },
      boost: { left: t - s - 146, top: n - o - 72, width: 64, height: 64 },
      handbrake: { left: t - s - 70, top: n - o - 140, width: 58, height: 54 },
      ballCam: { left: r + 10, top: n - o - A - 58, width: 54, height: 46 },
      reset: { left: t - s - 134, top: n - o - 134, width: 50, height: 46 },
      airRollLeft: { left: r + 8, top: n - o - A - 114, width: 50, height: 50 },
      airRollRight: {
        left: r + 66,
        top: n - o - A - 114,
        width: 50,
        height: 50,
      },
      airRoll: { left: r + 124, top: n - o - A - 114, width: 50, height: 50 },
      training: {
        left: r + (l - c) / 2,
        top: a + (t > 640 ? 0 : 116),
        width: c,
        height: 44,
      },
    },
    d = i.layouts[Ss(t, n)];
  for (const u of qd) {
    const p = h[u],
      v = d[u];
    ((p.width = Math.min(
      l,
      Math.max(
        u === "training" ? 212 : 44,
        p.width * ((v == null ? void 0 : v.size) ?? 1),
      ),
    )),
      (p.height = Math.min(
        n - a - o,
        Math.max(44, p.height * ((v == null ? void 0 : v.size) ?? 1)),
      )));
    const g = Math.max(r, t - s - p.width),
      m = Math.max(a, n - o - p.height - 4);
    ((p.left = v ? r + v.x * (g - r) : Fa(p.left, r, g)),
      (p.top = v ? a + v.y * (m - a) : Fa(p.top, a, m)));
  }
  return h;
}

function Hf(i, e, t = 1) {
  return {
    x: Fa(
      (i.left - e.left) / Math.max(1, e.width - e.right - i.width - e.left),
      0,
      1,
    ),
    y: Fa(
      (i.top - e.top) / Math.max(1, e.height - e.bottom - i.height - 4 - e.top),
      0,
      1,
    ),
    size: t,
  };
}

function k0(i, e) {
  return !(i in e.extras) || e.extras[i];
}

function yA(i, e, t = !1) {
  const n = Fh(e, Lh(i));
  for (const r of i.querySelectorAll("[data-touch-control]")) {
    const s = r.dataset.touchControl,
      a = n[s];
    (Object.assign(r.style, {
      left: `${a.left}px`,
      top: `${a.top}px`,
      width: `${a.width}px`,
      height: `${a.height}px`,
      right: "auto",
      bottom: "auto",
      transform: "none",
    }),
      (r.hidden = !k0(s, e) || (t && (s === "training" || s === "reset"))));
  }
}

export { B0, Fh, Hf, La, Lh, M0, Of, Ss, Ud, k0, qd, yA };
