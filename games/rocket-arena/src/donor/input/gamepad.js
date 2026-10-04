import { _ } from "../core/class-fields.js";
import { BALL_ACTIONS } from "../physics/state-layout.js";
import { io } from "./bindings.js";
import { Ks } from "./controller-selection.js";

const zC = 0.5;

const VC = 0.05;

const Zo = 0.3;

const WC = io.filter((i) => i.group === "Driving" || i.group === "Aerial");

class GamepadInput {
  constructor(e) {
    _(this, "onBallCamToggle", null);
    _(this, "onReset", null);
    _(this, "onBallControl", null);
    _(this, "onSettingsToggle", null);
    _(this, "onActivity", null);
    _(this, "enabled", !0);
    _(this, "look", { x: 0, y: 0 });
    _(this, "cameraLook", this.look);
    _(this, "prevBallCam", !1);
    _(this, "prevReset", !1);
    _(this, "prevSettings", !1);
    _(this, "previousBallActions", new Set());
    _(this, "lastActive", !1);
    _(this, "activityValues", []);
    _(this, "captureActive", !1);
    _(this, "deviceIdentity");
    _(this, "bindings");
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
    this.bindings = e;
  }
  active() {
    return this.lastActive;
  }
  set capturing(e) {
    this.captureActive = e;
  }
  setBindings(e) {
    this.bindings = e;
  }
  dz(e, t = this.bindings.axes.deadzone) {
    return Math.abs(e) < t ? 0 : (Math.sign(e) * (Math.abs(e) - t)) / (1 - t);
  }
  axisRole(e, t) {
    const n = this.bindings.axes[e],
      r = this.dz(t.axes[n.axis] ?? 0);
    return n.invert ? -r : r;
  }
  analogValue(e, t, n = this.bindings.axes.deadzone) {
    let r = 0;
    for (const s of this.bindings.pad[e])
      r = Math.max(r, this.sourceTravel(s, t, n));
    return r;
  }
  sourceTravel(e, t, n = this.bindings.axes.deadzone) {
    if (e.kind === "padButton") {
      const r = t.buttons[e.index];
      return r ? (r.value > 0 ? r.value : r.pressed ? 1 : 0) : 0;
    }
    return e.kind === "padAxis"
      ? Math.max(0, this.dz(t.axes[e.axis] ?? 0, n) * e.dir)
      : 0;
  }
  pressed(e, t) {
    var n;
    for (const r of this.bindings.pad[e])
      if (
        (r.kind === "padButton" &&
          (n = t.buttons[r.index]) != null &&
          n.pressed) ||
        (r.kind === "padAxis" && this.sourceTravel(r, t) > zC)
      )
        return !0;
    return !1;
  }
  read() {
    var m, y, C, E;
    const e = Ks(),
      t = e ? `${e.id}\0${e.index}` : null;
    if (t !== this.deviceIdentity) {
      const w = this.deviceIdentity !== void 0;
      if (
        ((this.deviceIdentity = t),
        (this.activityValues.length = 0),
        this.previousBallActions.clear(),
        (this.prevBallCam = !1),
        (this.prevReset = !1),
        (this.prevSettings = !1),
        e && w)
      ) {
        ((this.prevBallCam = this.pressed("ballCam", e)),
          (this.prevReset = this.pressed("resetShot", e)),
          (this.prevSettings = this.pressed("toggleSettings", e)));
        for (const S of BALL_ACTIONS)
          this.pressed(S, e) && this.previousBallActions.add(S);
        this.trackActivity(e, !1);
      }
    }
    if (!e)
      return (
        (this.activityValues.length = 0),
        this.previousBallActions.clear(),
        (this.lastActive = !1),
        this.resetControls(),
        this.controls
      );
    this.trackActivity(e);
    const n = this.bindings.axes.steer,
      r = this.bindings.axes.pitch;
    this.lastActive =
      this.enabled &&
      (Math.abs(e.axes[n.axis] ?? 0) > this.bindings.axes.deadzone ||
        Math.abs(e.axes[r.axis] ?? 0) > this.bindings.axes.deadzone ||
        this.hasActiveVehicleBinding(e));
    const s = this.pressed("toggleSettings", e);
    (!this.captureActive &&
      s &&
      !this.prevSettings &&
      ((m = this.onSettingsToggle) == null || m.call(this)),
      (this.prevSettings = s));
    const a = this.pressed("ballCam", e);
    (this.enabled &&
      !this.captureActive &&
      a &&
      !this.prevBallCam &&
      ((y = this.onBallCamToggle) == null || y.call(this)),
      (this.prevBallCam = a));
    const o = this.pressed("resetShot", e);
    (this.enabled &&
      !this.captureActive &&
      o &&
      !this.prevReset &&
      ((C = this.onReset) == null || C.call(this)),
      (this.prevReset = o));
    for (const w of BALL_ACTIONS) {
      const S = this.pressed(w, e);
      (S &&
        !this.previousBallActions.has(w) &&
        this.enabled &&
        !this.captureActive &&
        ((E = this.onBallControl) == null || E.call(this, w)),
        S
          ? this.previousBallActions.add(w)
          : this.previousBallActions.delete(w));
    }
    if (!this.enabled || this.captureActive)
      return ((this.lastActive = !1), this.resetControls(), this.controls);
    const A = this.axisRole("steer", e),
      l =
        (this.pressed("steerRight", e) ? 1 : 0) -
        (this.pressed("steerLeft", e) ? 1 : 0),
      c = Math.max(-1, Math.min(1, A + l)),
      h =
        this.analogValue("powerslide", e) > this.bindings.axes.triggerThreshold,
      d = this.analogValue("airRoll", e) > this.bindings.axes.triggerThreshold,
      u = this.pressed("airRollLeft", e),
      p = this.pressed("airRollRight", e);
    let v = c,
      g = 0;
    return (
      u || p ? (g = Number(p) - Number(u)) : d && ((g = c), (v = 0)),
      (this.controls.throttle =
        this.analogValue("throttleForward", e) -
        this.analogValue("throttleReverse", e)),
      (this.controls.steer = c),
      (this.controls.pitch = this.axisRole("pitch", e)),
      (this.controls.yaw = v),
      (this.controls.roll = g),
      (this.controls.jump = this.pressed("jump", e)),
      (this.controls.boost = this.pressed("boost", e)),
      (this.controls.handbrake = h),
      (this.look.x =
        this.analogValue("cameraRight", e, Zo) -
        this.analogValue("cameraLeft", e, Zo)),
      (this.look.y =
        this.analogValue("cameraDown", e, Zo) -
        this.analogValue("cameraUp", e, Zo)),
      this.controls
    );
  }
  resetControls() {
    ((this.look.x = 0),
      (this.look.y = 0),
      (this.controls.throttle = 0),
      (this.controls.steer = 0),
      (this.controls.pitch = 0),
      (this.controls.yaw = 0),
      (this.controls.roll = 0),
      (this.controls.jump = !1),
      (this.controls.boost = !1),
      (this.controls.handbrake = !1));
  }
  trackActivity(e, t = !0) {
    var r;
    let n = !1;
    for (let s = 0; s < e.axes.length + e.buttons.length; s += 1) {
      let a = 0;
      if (s < e.axes.length) {
        const l = e.axes[s];
        Math.abs(l) > this.bindings.axes.deadzone && (a = l);
      } else {
        const l = e.buttons[s - e.axes.length];
        (l.pressed || l.value > this.bindings.axes.triggerThreshold) &&
          (a = l.value || 1);
      }
      const o = this.activityValues[s] ?? 0,
        A =
          a !== 0 &&
          (o === 0 || Math.sign(a) !== Math.sign(o) || Math.abs(a - o) >= VC);
      ((a === 0 || A) && (this.activityValues[s] = a), n || (n = A));
    }
    n && t && ((r = this.onActivity) == null || r.call(this));
  }
  hasActiveVehicleBinding(e) {
    for (const t of WC)
      if (t.analog) {
        const n =
          t.id === "powerslide" || t.id === "airRoll"
            ? this.bindings.axes.triggerThreshold
            : 0;
        if (this.analogValue(t.id, e) > n) return !0;
      } else if (this.pressed(t.id, e)) return !0;
    return !1;
  }
}

export { GamepadInput };
