import { _ } from "../core/class-fields.js";
import { BALL_ACTIONS } from "../physics/state-layout.js";

function Tf(i) {
  return (
    i instanceof Element &&
    i.closest(
      ".hud-tools, .sheet-overlay, .car-tab, .car-overlay, .match-tab, .match-overlay, .match-hud, .match-result, .status, .touch-controls",
    ) !== null
  );
}

class KeyboardInput {
  constructor(e) {
    _(this, "keys", new Set());
    _(this, "mouse", new Set());
    _(this, "inputEnabled", !0);
    _(this, "captureActive", !1);
    _(this, "bindings");
    _(this, "look", { x: 0, y: 0 });
    _(this, "cameraLook", this.look);
    _(this, "controls", {
      throttle: 0,
      steer: 0,
      pitch: 0,
      yaw: 0,
      roll: 0,
      jump: !1,
      boost: !1,
      handbrake: !1,
    });
    _(this, "onReset", null);
    _(this, "onBallControl", null);
    _(this, "onBallCamToggle", null);
    _(this, "onSettingsToggle", null);
    ((this.bindings = e),
      window.addEventListener("keydown", (t) => {
        if (this.captureActive) return;
        const n = { kind: "key", code: t.code };
        if (t.repeat) {
          this.inputEnabled && this.suppressBrowserDefault(n, t);
          return;
        }
        this.fireToggles(n, t) ||
          (this.inputEnabled &&
            (this.keys.add(t.code), this.suppressBrowserDefault(n, t)));
      }),
      window.addEventListener("keyup", (t) => this.keys.delete(t.code)),
      window.addEventListener("mousedown", (t) => {
        if (this.captureActive || Tf(t.target)) return;
        const n = { kind: "mouse", button: t.button };
        this.fireToggles(n, t) ||
          (this.inputEnabled &&
            (this.mouse.add(t.button), this.suppressBrowserDefault(n, t)));
      }),
      window.addEventListener("mouseup", (t) => this.mouse.delete(t.button)),
      window.addEventListener("auxclick", (t) => {
        !this.inputEnabled ||
          this.captureActive ||
          Tf(t.target) ||
          this.suppressBrowserDefault({ kind: "mouse", button: t.button }, t);
      }),
      window.addEventListener("contextmenu", (t) => t.preventDefault()),
      window.addEventListener("blur", () => {
        (this.keys.clear(), this.mouse.clear());
      }));
  }
  get enabled() {
    return this.inputEnabled;
  }
  set enabled(e) {
    ((this.inputEnabled = e), e || (this.keys.clear(), this.mouse.clear()));
  }
  set capturing(e) {
    ((this.captureActive = e), e && (this.keys.clear(), this.mouse.clear()));
  }
  setBindings(e) {
    ((this.bindings = e), this.keys.clear(), this.mouse.clear());
  }
  boundSources(e) {
    return this.bindings.keyboard[e];
  }
  held(e) {
    for (const t of this.boundSources(e))
      if (
        (t.kind === "key" && this.keys.has(t.code)) ||
        (t.kind === "mouse" && this.mouse.has(t.button))
      )
        return !0;
    return !1;
  }
  matches(e, t) {
    for (const n of this.boundSources(e))
      if (
        n.kind === t.kind &&
        ((n.kind === "key" && t.kind === "key" && n.code === t.code) ||
          (n.kind === "mouse" && t.kind === "mouse" && n.button === t.button))
      )
        return !0;
    return !1;
  }
  fireToggles(e, t) {
    var n, r, s, a;
    if (this.captureActive) return !1;
    if (this.matches("toggleSettings", e))
      return (
        t.preventDefault(),
        (n = this.onSettingsToggle) == null || n.call(this),
        !0
      );
    if (!this.inputEnabled) return !1;
    for (const o of BALL_ACTIONS)
      this.matches(o, e) &&
        (t.preventDefault(),
        (r = this.onBallControl) == null || r.call(this, o));
    return (
      this.matches("ballCam", e) &&
        (t.preventDefault(),
        (s = this.onBallCamToggle) == null || s.call(this)),
      this.matches("resetShot", e) &&
        (t.preventDefault(), (a = this.onReset) == null || a.call(this)),
      !1
    );
  }
  suppressBrowserDefault(e, t) {
    (t.ctrlKey && !this.isModifierBound("Control")) ||
      (t.metaKey && !this.isModifierBound("Meta")) ||
      (t.altKey && !this.isModifierBound("Alt")) ||
      (this.isBound(e) && t.preventDefault());
  }
  isModifierBound(e) {
    return (
      this.isBound({ kind: "key", code: `${e}Left` }) ||
      this.isBound({ kind: "key", code: `${e}Right` })
    );
  }
  isBound(e) {
    for (const t of Object.keys(this.bindings.keyboard))
      if (this.matches(t, e)) return !0;
    return !1;
  }
  axis(e, t) {
    return (this.held(t) ? 1 : 0) - (this.held(e) ? 1 : 0);
  }
  read() {
    if (!this.inputEnabled || this.captureActive)
      return (
        (this.look.x = 0),
        (this.look.y = 0),
        (this.controls.throttle = 0),
        (this.controls.steer = 0),
        (this.controls.pitch = 0),
        (this.controls.yaw = 0),
        (this.controls.roll = 0),
        (this.controls.jump = !1),
        (this.controls.boost = !1),
        (this.controls.handbrake = !1),
        this.controls
      );
    const e = this.axis("steerLeft", "steerRight"),
      t = this.held("airRoll"),
      n = this.axis("airRollLeft", "airRollRight"),
      r = Math.max(-1, Math.min(1, n + (t ? e : 0))),
      s = this.axis("throttleReverse", "throttleForward");
    return (
      (this.controls.throttle = s),
      (this.controls.steer = e),
      (this.controls.pitch = -s),
      (this.controls.yaw = t ? 0 : e),
      (this.controls.roll = r),
      (this.controls.jump = this.held("jump")),
      (this.controls.boost = this.held("boost")),
      (this.controls.handbrake = this.held("powerslide")),
      (this.look.x = this.axis("cameraLeft", "cameraRight")),
      (this.look.y = this.axis("cameraUp", "cameraDown")),
      this.controls
    );
  }
}

export { KeyboardInput };
