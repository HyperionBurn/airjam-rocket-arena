import { _ } from "../core/class-fields.js";
import { F, Gt, jn } from "../vendor/three.js";

const fp = 250;

const g1 = 4500;

const v1 = 0.4;

function j1(i) {
  if (!Number.isFinite(i)) return 0;
  const e = Gt.clamp((i - fp) / (g1 - fp), 0, 1);
  return v1 * (1 - e * e * (3 - 2 * e));
}

const ii = new F();

const wi = new F(0, 0, -1);

const Mi = new F(0, 1, 0);

const gc = new jn();

const qh = new Set();

let $h = !1;

function _1(i) {
  (i.updateWorldMatrix(!0, !1),
    i.getWorldPosition(ii),
    i.getWorldQuaternion(gc),
    wi.set(0, 0, -1).applyQuaternion(gc),
    Mi.set(0, 1, 0).applyQuaternion(gc),
    ($h = !0));
  for (const e of qh) e.updateListener();
}

class SpatialAudioBus {
  constructor(e, t) {
    _(this, "input");
    _(this, "context");
    _(this, "panner");
    _(this, "output");
    _(this, "position", new F());
    _(this, "enabled", !0);
    _(this, "targetGain", -1);
    ((this.context = e),
      (this.input = e.createGain()),
      (this.input.channelCount = 1),
      (this.input.channelCountMode = "explicit"),
      (this.input.channelInterpretation = "speakers"),
      (this.panner = e.createPanner()),
      (this.panner.panningModel = "HRTF"),
      (this.panner.channelCount = 1),
      (this.panner.channelCountMode = "explicit"),
      (this.panner.rolloffFactor = 0),
      (this.output = e.createGain()),
      (this.output.gain.value = 0),
      this.input.connect(this.panner).connect(this.output).connect(t),
      qh.add(this),
      this.updateListener());
  }
  setPosition(e) {
    this.position.copy(e);
    const t = this.context.currentTime;
    (this.panner.positionX.setValueAtTime(e.x, t),
      this.panner.positionY.setValueAtTime(e.y, t),
      this.panner.positionZ.setValueAtTime(e.z, t),
      this.applyGain());
  }
  setEnabled(e) {
    ((this.enabled = e), this.applyGain());
  }
  updateListener() {
    if ($h) {
      const e = this.context.listener,
        t = this.context.currentTime;
      e.positionX
        ? (e.positionX.setValueAtTime(ii.x, t),
          e.positionY.setValueAtTime(ii.y, t),
          e.positionZ.setValueAtTime(ii.z, t),
          e.forwardX.setValueAtTime(wi.x, t),
          e.forwardY.setValueAtTime(wi.y, t),
          e.forwardZ.setValueAtTime(wi.z, t),
          e.upX.setValueAtTime(Mi.x, t),
          e.upY.setValueAtTime(Mi.y, t),
          e.upZ.setValueAtTime(Mi.z, t))
        : (e.setPosition(ii.x, ii.y, ii.z),
          e.setOrientation(wi.x, wi.y, wi.z, Mi.x, Mi.y, Mi.z));
    }
    this.applyGain();
  }
  dispose() {
    (this.setEnabled(!1),
      qh.delete(this),
      this.input.disconnect(),
      this.panner.disconnect(),
      this.output.disconnect());
  }
  applyGain() {
    const e = this.enabled && $h ? j1(this.position.distanceTo(ii)) : 0;
    if (e === this.targetGain) return;
    this.targetGain = e;
    const t = this.context.currentTime,
      n = this.output.gain.value;
    (this.output.gain.cancelScheduledValues(t),
      e === 0 || this.context.state !== "running"
        ? this.output.gain.setValueAtTime(e, t)
        : (this.output.gain.setValueAtTime(n, t),
          this.output.gain.linearRampToValueAtTime(e, t + 0.025)));
  }
}

export { SpatialAudioBus, _1 };
