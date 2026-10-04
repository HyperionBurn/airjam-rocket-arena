import { BALL_ACTIONS } from "../physics/state-layout.js";
import { createSettingsStore, isRecord, readBoolean, readList, readNumber } from "../core/settings-store.js";

const BC = "rocket-arena.input-bindings.v1";

const Rf = ["cameraLeft", "cameraRight", "cameraUp", "cameraDown"];

const io = [
    {
      id: "throttleForward",
      label: "Throttle",
      group: "Driving",
      analog: !0,
      note: "Drives forward. On keyboard, also noses down in the air.",
    },
    {
      id: "throttleReverse",
      label: "Reverse",
      group: "Driving",
      analog: !0,
      note: "Drives backward. On keyboard, also noses up in the air.",
    },
    {
      id: "steerLeft",
      label: "Steer Left",
      group: "Driving",
      analog: !1,
      note: "Adds to the steering axis. Yaws in the air unless a roll is held.",
    },
    {
      id: "steerRight",
      label: "Steer Right",
      group: "Driving",
      analog: !1,
      note: "Adds to the steering axis. Yaws in the air unless a roll is held.",
    },
    {
      id: "boost",
      label: "Boost",
      group: "Driving",
      analog: !1,
      note: "Burns boost for thrust.",
    },
    {
      id: "jump",
      label: "Jump",
      group: "Driving",
      analog: !1,
      note: "Jumps, flips, and dodges.",
    },
    {
      id: "powerslide",
      label: "Powerslide",
      group: "Driving",
      analog: !0,
      note: "Slides on the ground. Bind Free Air Roll separately to roll in the air.",
    },
    {
      id: "airRoll",
      label: "Free Air Roll",
      group: "Aerial",
      analog: !0,
      note: "Hold to roll with the steering inputs in the air, without powersliding.",
    },
    {
      id: "airRollLeft",
      label: "Air Roll Left",
      group: "Aerial",
      analog: !1,
      note: "Rolls left at a fixed rate while held.",
    },
    {
      id: "airRollRight",
      label: "Air Roll Right",
      group: "Aerial",
      analog: !1,
      note: "Rolls right at a fixed rate while held.",
    },
    {
      id: "ballCam",
      label: "Ball Cam",
      group: "Camera",
      analog: !1,
      note: "Toggles between ball cam and car cam.",
    },
    {
      id: "cameraLeft",
      label: "Look Left",
      group: "Camera",
      analog: !0,
      note: "Looks left while held. Release to return to the follow camera.",
    },
    {
      id: "cameraRight",
      label: "Look Right",
      group: "Camera",
      analog: !0,
      note: "Looks right while held. Release to return to the follow camera.",
    },
    {
      id: "cameraUp",
      label: "Look Up",
      group: "Camera",
      analog: !0,
      note: "Looks upward while held. Release to return to the follow camera.",
    },
    {
      id: "cameraDown",
      label: "Look Down",
      group: "Camera",
      analog: !0,
      note: "Looks downward while held. Release to return to the follow camera.",
    },
    {
      id: "resetShot",
      label: "Reset Shot",
      group: "Session",
      analog: !1,
      note: "Returns car and ball to kickoff.",
    },
    {
      id: "takePossession",
      label: "Take Possession",
      group: "Ball Control",
      analog: !1,
      note: "Places the ball just ahead of your car, matching your velocity.",
    },
    {
      id: "startDribble",
      label: "Start Dribble",
      group: "Ball Control",
      analog: !1,
      note: "Places the ball on your hood, matching your velocity.",
    },
    {
      id: "passBall",
      label: "Pass Ball",
      group: "Ball Control",
      analog: !1,
      note: "Sends the ball toward your car from its current position.",
    },
    {
      id: "launchBall",
      label: "Launch Ball",
      group: "Ball Control",
      analog: !1,
      note: "Pops the ball upward from its current position, preserving horizontal motion.",
    },
    {
      id: "toggleSettings",
      label: "Menu / Cursor",
      group: "Session",
      analog: !1,
      note: "Browser keys/mouse: show the cursor or return to play. Controller: open settings.",
    },
  ];

const kC = ["Driving", "Aerial", "Camera", "Ball Control", "Session"];

function f0() {
  return {
    throttleForward: [{ kind: "key", code: "KeyW" }],
    throttleReverse: [{ kind: "key", code: "KeyS" }],
    steerLeft: [{ kind: "key", code: "KeyA" }],
    steerRight: [{ kind: "key", code: "KeyD" }],
    boost: [{ kind: "mouse", button: 0 }],
    jump: [{ kind: "mouse", button: 2 }],
    powerslide: [
      { kind: "key", code: "ShiftLeft" },
      { kind: "key", code: "ShiftRight" },
    ],
    airRoll: [
      { kind: "key", code: "ShiftLeft" },
      { kind: "key", code: "ShiftRight" },
    ],
    airRollLeft: [{ kind: "key", code: "KeyQ" }],
    airRollRight: [{ kind: "key", code: "KeyE" }],
    ballCam: [{ kind: "key", code: "Space" }],
    cameraLeft: [],
    cameraRight: [],
    cameraUp: [],
    cameraDown: [],
    takePossession: [{ kind: "key", code: "Digit1" }],
    startDribble: [{ kind: "key", code: "Digit2" }],
    passBall: [{ kind: "key", code: "Digit3" }],
    launchBall: [{ kind: "key", code: "Digit4" }],
    resetShot: [{ kind: "key", code: "Backspace" }],
    toggleSettings: [{ kind: "key", code: "Escape" }],
  };
}

function p0() {
  return {
    throttleForward: [{ kind: "padButton", index: 7 }],
    throttleReverse: [{ kind: "padAxis", axis: 1, dir: 1 }],
    steerLeft: [],
    steerRight: [],
    boost: [{ kind: "padButton", index: 5 }],
    jump: [{ kind: "padButton", index: 2 }],
    powerslide: [{ kind: "padButton", index: 6 }],
    airRoll: [{ kind: "padButton", index: 6 }],
    airRollLeft: [{ kind: "padButton", index: 0 }],
    airRollRight: [],
    ballCam: [{ kind: "padButton", index: 3 }],
    cameraLeft: [{ kind: "padAxis", axis: 2, dir: -1 }],
    cameraRight: [{ kind: "padAxis", axis: 2, dir: 1 }],
    cameraUp: [{ kind: "padAxis", axis: 3, dir: -1 }],
    cameraDown: [{ kind: "padAxis", axis: 3, dir: 1 }],
    takePossession: [{ kind: "padButton", index: 13 }],
    startDribble: [{ kind: "padButton", index: 12 }],
    passBall: [{ kind: "padButton", index: 14 }],
    launchBall: [{ kind: "padButton", index: 15 }],
    resetShot: [
      { kind: "padButton", index: 11 },
      { kind: "padButton", index: 8 },
    ],
    toggleSettings: [{ kind: "padButton", index: 9 }],
  };
}

function m0() {
  return {
    keyboard: f0(),
    pad: p0(),
    axes: {
      steer: { axis: 0, invert: !1 },
      pitch: { axis: 1, invert: !1 },
      deadzone: 0.12,
      triggerThreshold: 0.15,
    },
  };
}

function g0(i, e) {
  return i.kind !== e.kind
    ? !1
    : i.kind === "key" && e.kind === "key"
      ? i.code === e.code
      : i.kind === "mouse" && e.kind === "mouse"
        ? i.button === e.button
        : i.kind === "padButton" && e.kind === "padButton"
          ? i.index === e.index
          : i.kind === "padAxis" && e.kind === "padAxis"
            ? i.axis === e.axis && i.dir === e.dir
            : !1;
}

function v0(i) {
  return i.kind === "key" || i.kind === "mouse" ? "keyboard" : "pad";
}

function TC(i, e, t, n, r) {
  const s = i[e][t];
  return v0(r) !== e || !Number.isInteger(n) || n < 0 || n > s.length || n >= 2
    ? { changed: !1 }
    : s.some((a) => g0(a, r))
      ? { changed: !1 }
      : (n < s.length ? (s[n] = r) : s.push(r), { changed: !0 });
}

function RC(i, e, t, n) {
  const r = i[e][t];
  n >= 0 && n < r.length && r.splice(n, 1);
}

function Pf(i, e) {
  const t = e === "keyboard" ? f0() : p0();
  i[e] = t;
}

function PC(i) {
  i.axes = m0().axes;
}

const IC = {
  Space: "Space",
  Escape: "Esc",
  Backspace: "Backspace",
  Enter: "Enter",
  Tab: "Tab",
  ShiftLeft: "L Shift",
  ShiftRight: "R Shift",
  ControlLeft: "L Ctrl",
  ControlRight: "R Ctrl",
  AltLeft: "L Alt",
  AltRight: "R Alt",
  ArrowUp: "Up",
  ArrowDown: "Down",
  ArrowLeft: "Left",
  ArrowRight: "Right",
  CapsLock: "Caps",
  Backquote: "`",
  Minus: "-",
  Equal: "=",
  BracketLeft: "[",
  BracketRight: "]",
  Backslash: "\\",
  Semicolon: ";",
  Quote: "'",
  Comma: ",",
  Period: ".",
  Slash: "/",
};

function LC(i) {
  const e = IC[i];
  return (
    e ||
    (i.startsWith("Key")
      ? i.slice(3)
      : i.startsWith("Digit")
        ? i.slice(5)
        : i.startsWith("Numpad")
          ? `Num ${i.slice(6)}`
          : i)
  );
}

const FC = {
    0: "L Mouse",
    1: "M Mouse",
    2: "R Mouse",
    3: "Mouse 4",
    4: "Mouse 5",
  };

const DC = [
    "A",
    "B",
    "X",
    "Y",
    "LB",
    "RB",
    "LT",
    "RT",
    "View",
    "Menu",
    "L Stick",
    "R Stick",
    "D-Up",
    "D-Down",
    "D-Left",
    "D-Right",
    "Guide",
  ];

const NC = [
    "Cross",
    "Circle",
    "Square",
    "Triangle",
    "L1",
    "R1",
    "L2",
    "R2",
    "Share",
    "Options",
    "L3",
    "R3",
    "D-Up",
    "D-Down",
    "D-Left",
    "D-Right",
    "PS",
  ];

function Rh(i) {
  return i && /playstation|dualshock|dualsense|sony|054c/i.test(i)
    ? "playstation"
    : "xbox";
}

const GC = ["L Stick X", "L Stick Y", "R Stick X", "R Stick Y"];

function Yo(i) {
  return GC[i] ?? `Axis ${i}`;
}

function OC(i, e) {
  const t = i < 2 ? "L Stick" : "R Stick";
  return i % 2 === 0
    ? `${t} ${e > 0 ? "Right" : "Left"}`
    : `${t} ${e > 0 ? "Down" : "Up"}`;
}

function getBindingLabel(i, e = "xbox") {
  switch (i.kind) {
    case "key":
      return LC(i.code);
    case "mouse":
      return FC[i.button] ?? `Mouse ${i.button + 1}`;
    case "padButton":
      return (e === "playstation" ? NC : DC)[i.index] ?? `Button ${i.index}`;
    case "padAxis":
      return OC(i.axis, i.dir);
  }
}

function HC(i) {
  if (!isRecord(i)) return !1;
  switch (i.kind) {
    case "key":
      return typeof i.code == "string" && i.code.length > 0;
    case "mouse":
      return Number.isInteger(i.button) && i.button >= 0;
    case "padButton":
      return Number.isInteger(i.index) && i.index >= 0;
    case "padAxis":
      return (
        Number.isInteger(i.axis) && i.axis >= 0 && (i.dir === 1 || i.dir === -1)
      );
    default:
      return !1;
  }
}

function If(i, e) {
  isRecord(e) &&
    ((i.axis = readNumber(e.axis, i.axis, { min: 0, max: 15, integer: !0 })),
    (i.invert = readBoolean(e.invert, i.invert)));
}

const j0 = createSettingsStore(BC, m0, (i, e) => {
  const t = e.axes;
  isRecord(t) &&
    (If(i.axes.steer, t.steer),
    If(i.axes.pitch, t.pitch),
    (i.axes.deadzone = readNumber(t.deadzone, i.axes.deadzone, { min: 0, max: 0.5 })),
    (i.axes.triggerThreshold = readNumber(t.triggerThreshold, i.axes.triggerThreshold, {
      min: 0.02,
      max: 0.9,
    })));
  for (const n of ["keyboard", "pad"]) {
    const r = e[n],
      s = isRecord(r) ? r : {};
    for (const a of io) {
      const o = readList(s[a.id], HC, 2);
      o && (i[n][a.id] = o.filter((A) => v0(A) === n));
    }
    Object.hasOwn(s, "airRoll") ||
      (i[n].airRoll = i[n].powerslide.map((a) => ({ ...a })));
    for (const a of [...BALL_ACTIONS, ...Rf])
      Array.isArray(s[a]) ||
        (i[n][a] = i[n][a].filter(
          (o) =>
            !(
              o.kind === "padAxis" &&
              Rf.some((A) => A === a) &&
              (o.axis === i.axes.steer.axis || o.axis === i.axes.pitch.axis)
            ) &&
            !io.some(
              (A) =>
                A.id !== a &&
                Array.isArray(s[A.id]) &&
                i[n][A.id].some((l) => g0(o, l)),
            ),
        ));
  }
});

function loadBindings() {
  return j0.load();
}

function saveBindings(i) {
  j0.save(i);
}

function getActionLabel(i) {
  var e;
  return ((e = io.find((t) => t.id === i)) == null ? void 0 : e.label) ?? i;
}

export { PC, Pf, RC, Rh, TC, Yo, getActionLabel, getBindingLabel, io, kC, loadBindings, saveBindings };
