import { _ } from "../core/class-fields.js";
import { F } from "../vendor/three.js";
import { getAudioContext, getAudioInput } from "./settings.js";
import { SpatialAudioBus } from "./spatial.js";

const Fw =
    "data:text/javascript;base64,Ly8gQWxsIHNlbGVjdGVkIHJlY29yZGluZ3Mgc2hhcmUgb25lIGVuZ2luZS1jeWNsZSBjbG9jay4gQ2hhbmdpbmcgYSBncmFpbgovLyBjaGFuZ2VzIGl0cyB0aW1icmUgd2l0aG91dCBsZXR0aW5nIG5laWdoYm9yaW5nIHJlY29yZGluZ3MgYmVhdCBhdCBkaWZmZXJlbnQKLy8gZnVuZGFtZW50YWwgZnJlcXVlbmNpZXMuIFNvdXJjZS1jeWNsZSBmcmVxdWVuY3kgaXMgaW5kZXBlbmRlbnQgb2Ygcm9hZCBzcGVlZC4KY29uc3QgY2xhbXAgPSAodmFsdWUsIG1pbiwgbWF4KSA9PiBNYXRoLm1heChtaW4sIE1hdGgubWluKG1heCwgdmFsdWUpKTsKY29uc3Qgc21vb3Roc3RlcCA9IChhLCBiLCB4KSA9PiB7CiAgY29uc3QgdCA9IGNsYW1wKCh4IC0gYSkgLyAoYiAtIGEpLCAwLCAxKTsKICByZXR1cm4gdCAqIHQgKiAoMyAtIDIgKiB0KTsKfTsKCmZ1bmN0aW9uIHJlYWRQZXJpb2RpYyhkYXRhLCBwb3NpdGlvbikgewogIGNvbnN0IG4gPSBkYXRhLmxlbmd0aDsKICBjb25zdCBpbmRleCA9IE1hdGguZmxvb3IocG9zaXRpb24pOwogIGNvbnN0IGZyYWN0aW9uID0gcG9zaXRpb24gLSBpbmRleDsKICBjb25zdCBhID0gZGF0YVsoaW5kZXggKyBuIC0gMSkgJSBuXTsKICBjb25zdCBiID0gZGF0YVtpbmRleCAlIG5dOwogIGNvbnN0IGMgPSBkYXRhWyhpbmRleCArIDEpICUgbl07CiAgY29uc3QgZCA9IGRhdGFbKGluZGV4ICsgMikgJSBuXTsKICAvLyBDdWJpYyBpbnRlcnBvbGF0aW9uIHJldGFpbnMgdGhlIHVwcGVyIGhhcm1vbmljcyBkdXJpbmcgcGl0Y2ggY2hhbmdlcy4KICByZXR1cm4gYiArIC41ICogZnJhY3Rpb24gKiAoYyAtIGEgKyBmcmFjdGlvbiAqICgKICAgIDIgKiBhIC0gNSAqIGIgKyA0ICogYyAtIGQgKyBmcmFjdGlvbiAqICgzICogKGIgLSBjKSArIGQgLSBhKQogICkpOwp9CgpmdW5jdGlvbiBncmFpblNhbXBsZShncmFpbiwgY3ljbGVzKSB7CiAgY29uc3QgY3ljbGUgPSAoKGN5Y2xlcyArIChncmFpbi5waGFzZU9mZnNldEN5Y2xlcyA/PyAwKSkgJSBncmFpbi5jeWNsZXMgKyBncmFpbi5jeWNsZXMpICUgZ3JhaW4uY3ljbGVzOwogIHJldHVybiByZWFkUGVyaW9kaWMoZ3JhaW4uc2FtcGxlcywgY3ljbGUgLyBncmFpbi5jeWNsZXMgKiBncmFpbi5zYW1wbGVzLmxlbmd0aCk7Cn0KCmZ1bmN0aW9uIHNhbXBsZUJhbmsoYmFuaywgZnJlcXVlbmN5LCBjeWNsZXMpIHsKICBsZXQgdXBwZXIgPSAwOwogIHdoaWxlICh1cHBlciA8IGJhbmsubGVuZ3RoIC0gMSAmJiBiYW5rW3VwcGVyXS5mcmVxdWVuY3lIeiA8IGZyZXF1ZW5jeSkgdXBwZXIrKzsKICBjb25zdCBsb3dlciA9IE1hdGgubWF4KDAsIHVwcGVyIC0gMSk7CiAgaWYgKGxvd2VyID09PSB1cHBlcikgcmV0dXJuIGdyYWluU2FtcGxlKGJhbmtbbG93ZXJdLCBjeWNsZXMpOwogIGNvbnN0IHdlaWdodCA9IGNsYW1wKChmcmVxdWVuY3kgLSBiYW5rW2xvd2VyXS5mcmVxdWVuY3lIeikKICAgIC8gKGJhbmtbdXBwZXJdLmZyZXF1ZW5jeUh6IC0gYmFua1tsb3dlcl0uZnJlcXVlbmN5SHopLCAwLCAxKTsKICAvLyBDb3JyZWxhdGVkLCBwaGFzZS1hbGlnbmVkIHJlY29yZGluZ3MgdXNlIGEgdW5pdHktc3VtIGNyb3NzZmFkZS4gQW4KICAvLyBlcXVhbC1wb3dlciBmYWRlIHdvdWxkIGFkZCBhIGxldmVsIGJ1bXAgaGFsZndheSBiZXR3ZWVuIHNpbWlsYXIgZ3JhaW5zLgogIHJldHVybiBncmFpblNhbXBsZShiYW5rW2xvd2VyXSwgY3ljbGVzKSAqICgxIC0gd2VpZ2h0KQogICAgKyBncmFpblNhbXBsZShiYW5rW3VwcGVyXSwgY3ljbGVzKSAqIHdlaWdodDsKfQoKY2xhc3MgQ2FyRW5naW5lUHJvY2Vzc29yIGV4dGVuZHMgQXVkaW9Xb3JrbGV0UHJvY2Vzc29yIHsKICBjb25zdHJ1Y3RvcigpIHsKICAgIHN1cGVyKCk7CiAgICB0aGlzLmxvYWRlZCA9IFtdOwogICAgdGhpcy5jb2FzdCA9IFtdOwogICAgdGhpcy5pZGxlID0gbnVsbDsKICAgIHRoaXMuY3ljbGVzID0gMDsKICAgIHRoaXMuaWRsZVBvc2l0aW9uID0gMDsKICAgIHRoaXMucnBtID0gMDsKICAgIHRoaXMubG9hZCA9IDA7CiAgICB0aGlzLnRhcmdldFJwbSA9IDA7CiAgICB0aGlzLnRhcmdldExvYWQgPSAwOwogICAgdGhpcy5lbmFibGVkID0gZmFsc2U7CiAgICB0aGlzLmRpc3Bvc2VkID0gZmFsc2U7CiAgICB0aGlzLnNtb290aGluZyA9IDEgLSBNYXRoLmV4cCgtMSAvICguMDE1ICogc2FtcGxlUmF0ZSkpOwogICAgdGhpcy5wb3J0Lm9ubWVzc2FnZSA9ICh7IGRhdGEgfSkgPT4gewogICAgICBpZiAoZGF0YS50eXBlID09PSAiYmFuayIpIHsKICAgICAgICB0aGlzLmxvYWRlZCA9IGRhdGEubG9hZGVkOwogICAgICAgIHRoaXMuY29hc3QgPSBkYXRhLmNvYXN0OwogICAgICAgIHRoaXMuaWRsZSA9IGRhdGEuaWRsZTsKICAgICAgICB0aGlzLm5hdGl2ZVJhdGUgPSBkYXRhLnNhbXBsZVJhdGU7CiAgICAgICAgdGhpcy5taW5pbXVtSHogPSB0aGlzLmNvYXN0WzBdLmZyZXF1ZW5jeUh6OwogICAgICAgIHRoaXMubWF4aW11bUh6ID0gdGhpcy5sb2FkZWRbdGhpcy5sb2FkZWQubGVuZ3RoIC0gMV0uZnJlcXVlbmN5SHo7CiAgICAgIH0gZWxzZSBpZiAoZGF0YS50eXBlID09PSAic3RhdGUiKSB7CiAgICAgICAgdGhpcy50YXJnZXRScG0gPSBOdW1iZXIuaXNGaW5pdGUoZGF0YS5ycG0pID8gY2xhbXAoZGF0YS5ycG0sIDAsIDEpIDogMDsKICAgICAgICB0aGlzLnRhcmdldExvYWQgPSBOdW1iZXIuaXNGaW5pdGUoZGF0YS5sb2FkKSA/IGNsYW1wKGRhdGEubG9hZCwgMCwgMSkgOiAwOwogICAgICAgIHRoaXMuZW5hYmxlZCA9IGRhdGEuZW5hYmxlZCA9PT0gdHJ1ZTsKICAgICAgfSBlbHNlIGlmIChkYXRhLnR5cGUgPT09ICJyZXNldCIpIHsKICAgICAgICB0aGlzLmN5Y2xlcyA9IHRoaXMuaWRsZVBvc2l0aW9uID0gdGhpcy5ycG0gPSB0aGlzLmxvYWQgPSAwOwogICAgICAgIHRoaXMudGFyZ2V0UnBtID0gdGhpcy50YXJnZXRMb2FkID0gMDsKICAgICAgICB0aGlzLmVuYWJsZWQgPSBmYWxzZTsKICAgICAgfSBlbHNlIGlmIChkYXRhLnR5cGUgPT09ICJkaXNwb3NlIikgewogICAgICAgIHRoaXMuZGlzcG9zZWQgPSB0cnVlOwogICAgICB9CiAgICB9OwogIH0KCiAgcHJvY2VzcyhfaW5wdXRzLCBvdXRwdXRzKSB7CiAgICBjb25zdCBvdXRwdXQgPSBvdXRwdXRzWzBdPy5bMF07CiAgICBpZiAodGhpcy5kaXNwb3NlZCkgcmV0dXJuIGZhbHNlOwogICAgaWYgKCFvdXRwdXQpIHJldHVybiB0cnVlOwogICAgaWYgKCF0aGlzLmVuYWJsZWQgfHwgIXRoaXMuaWRsZSkgewogICAgICBvdXRwdXQuZmlsbCgwKTsKICAgICAgcmV0dXJuIHRydWU7CiAgICB9CiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG91dHB1dC5sZW5ndGg7IGkrKykgewogICAgICB0aGlzLnJwbSArPSAodGhpcy50YXJnZXRScG0gLSB0aGlzLnJwbSkgKiB0aGlzLnNtb290aGluZzsKICAgICAgdGhpcy5sb2FkICs9ICh0aGlzLnRhcmdldExvYWQgLSB0aGlzLmxvYWQpICogdGhpcy5zbW9vdGhpbmc7CiAgICAgIC8vIFRoZSByZWZlcmVuY2UgZXhwb3NlcyBub3JtYWxpemVkIFJQTSwgYnV0IGl0cyBzeW50aGVzaXMgbWFwcGluZyBpcwogICAgICAvLyBwcml2YXRlLiBJbnRlcnBvbGF0aW9uIGFjcm9zcyB0aGUgbWVhc3VyZWQgY3ljbGUgcmFuZ2UgaXMgb3VyIG1vZGVsLgogICAgICBjb25zdCBmcmVxdWVuY3kgPSB0aGlzLm1pbmltdW1IeiArIHRoaXMucnBtICogKHRoaXMubWF4aW11bUh6IC0gdGhpcy5taW5pbXVtSHopOwogICAgICBjb25zdCBtb3ZpbmcgPSBzbW9vdGhzdGVwKC4wMjUsIC4xNSwgdGhpcy5ycG0pOwogICAgICBjb25zdCBlbmdpbmUgPSBzYW1wbGVCYW5rKHRoaXMubG9hZGVkLCBmcmVxdWVuY3ksIHRoaXMuY3ljbGVzKSAqIHRoaXMubG9hZAogICAgICAgICsgc2FtcGxlQmFuayh0aGlzLmNvYXN0LCBmcmVxdWVuY3ksIHRoaXMuY3ljbGVzKSAqICgxIC0gdGhpcy5sb2FkKTsKICAgICAgY29uc3QgaWRsZSA9IHJlYWRQZXJpb2RpYyh0aGlzLmlkbGUsIHRoaXMuaWRsZVBvc2l0aW9uKTsKICAgICAgb3V0cHV0W2ldID0gaWRsZSAqICgxIC0gbW92aW5nKSArIGVuZ2luZSAqIG1vdmluZzsKICAgICAgdGhpcy5jeWNsZXMgKz0gZnJlcXVlbmN5IC8gc2FtcGxlUmF0ZTsKICAgICAgdGhpcy5pZGxlUG9zaXRpb24gPSAodGhpcy5pZGxlUG9zaXRpb24gKyB0aGlzLm5hdGl2ZVJhdGUgLyBzYW1wbGVSYXRlKSAlIHRoaXMuaWRsZS5sZW5ndGg7CiAgICB9CiAgICByZXR1cm4gdHJ1ZTsKICB9Cn0KCnJlZ2lzdGVyUHJvY2Vzc29yKCJjYXItZW5naW5lIiwgQ2FyRW5naW5lUHJvY2Vzc29yKTsK";

const Da = [3.5, 2, 1.4, 1, 0.7];

const Yp = 0.97;

const Dw = 0.94;

const Nw = 0.5;

const Jh = 0.005;

const Gw = 5;

const Ow = 0.05;

const Hw = 0.1;

const Uw = 0.3;

const qw = 0.02;

const Kh = 2300;

const $w = Kh * Jh;

const zw = Da[Da.length - 1];

const Vw = 0.1;

const Zp = 0.25;

const hA = 25;

const dA = 0.001;

const Ww = 1 / 240;

function Ci(i, e, t) {
  return Math.max(e, Math.min(t, i));
}

function Ic(i) {
  return Number.isFinite(i) ? i : 0;
}

function Lc(i, e, t, n) {
  return i + (e - i) * -Math.expm1(-t * n);
}

class EngineDynamics {
  constructor() {
    _(this, "rpm", 0);
    _(this, "load", 0);
    _(this, "gearIndex", 0);
    _(this, "reversing", !1);
    _(this, "initialized", !1);
    _(this, "wheelSpeed", 0);
    _(this, "shiftLeft", 0);
    _(this, "gearHoldLeft", 0);
    _(this, "downshiftTime", 0);
  }
  reset() {
    ((this.rpm = 0),
      (this.load = 0),
      (this.gearIndex = 0),
      (this.reversing = !1),
      (this.initialized = !1),
      (this.wheelSpeed = 0),
      (this.shiftLeft = 0),
      (this.gearHoldLeft = 0),
      (this.downshiftTime = 0));
  }
  update(e, t) {
    let n = Ci(Ic(t), 0, 0.1);
    if (n === 0) return this.state();
    const r = Ci(Ic(e.forwardSpeed), -Kh, Kh),
      s = e.boosting ? 1 : Ci(Ic(e.throttle), -1, 1),
      a = e.onGround,
      o = Math.abs(r);
    if (
      !this.initialized &&
      ((this.initialized = !0),
      (this.wheelSpeed = a ? o * Jh : 0),
      (this.reversing = a && (r < -hA || (o <= hA && s < -dA))),
      !this.reversing && a)
    )
      for (
        ;
        this.gearIndex < Da.length - 1 && this.roadRpm(this.gearIndex) > Yp;

      )
        this.gearIndex++;
    for (; n > 1e-9; ) {
      const A = Math.min(n, Ww);
      (this.step(r, s, a, e.handbrake, A), (n -= A));
    }
    return this.state();
  }
  roadRpm(e) {
    return ((this.wheelSpeed / $w) * Da[e]) / zw;
  }
  step(e, t, n, r, s) {
    const a = Math.abs(e);
    if (
      ((this.gearHoldLeft = Math.max(0, this.gearHoldLeft - s)),
      (this.shiftLeft = Math.max(0, this.shiftLeft - s)),
      n)
    ) {
      const d = a > hA ? e < 0 : Math.abs(t) > dA ? t < 0 : this.reversing;
      (d !== this.reversing &&
        ((this.reversing = d),
        (this.gearIndex = 0),
        (this.shiftLeft = 0),
        (this.gearHoldLeft = Zp),
        (this.downshiftTime = 0)),
        (this.wheelSpeed = Lc(this.wheelSpeed, a * Jh, Gw, s)));
    }
    const A =
      (n &&
        !r &&
        a > hA &&
        Math.abs(t) > dA &&
        Math.sign(t) !== Math.sign(e)) ||
      Math.abs(t) < dA
        ? 0
        : Math.abs(t);
    n && !this.reversing && this.gearHoldLeft === 0 && this.shiftLeft === 0
      ? this.gearIndex < Da.length - 1 && this.roadRpm(this.gearIndex) >= Yp
        ? this.shiftTo(this.gearIndex + 1)
        : this.gearIndex > 0 && this.roadRpm(this.gearIndex - 1) < Dw
          ? ((this.downshiftTime += s),
            this.downshiftTime >= qw && this.shiftTo(this.gearIndex - 1))
          : (this.downshiftTime = 0)
      : (this.downshiftTime = 0);
    const l = this.shiftLeft > 0;
    this.load = Lc(this.load, A * (l ? 0.3 : 1), 1 / Ow, s);
    let c;
    if (!n) c = A;
    else {
      const d = this.reversing
          ? this.roadRpm(0) * Nw
          : this.roadRpm(this.gearIndex),
        u = 0.12 * A * (1 - Ci(a / 250, 0, 1));
      c = Math.max(d, u);
    }
    const h = n ? Hw : Uw;
    this.rpm = Lc(this.rpm, Ci(c, 0, 1), 1 / h, s);
  }
  shiftTo(e) {
    ((this.gearIndex = e),
      (this.shiftLeft = Vw),
      (this.gearHoldLeft = Zp),
      (this.downshiftTime = 0));
  }
  state() {
    return {
      rpm: Ci(this.rpm, 0, 1),
      load: Ci(this.load, 0, 1),
      gear: this.reversing ? -1 : this.gearIndex + 1,
      reversing: this.reversing,
    };
  }
}

const Qp = "/assets/audio/engine";

const Jw = 0.16 * 10 ** (4 / 20);

const em = new WeakMap();

function Kw(i) {
  let e = em.get(i);
  return (
    e ||
    ((e = (async () => {
      var l, c;
      const t = await fetch(`${Qp}/manifest.json`);
      if (!t.ok) throw new Error(`Engine manifest: ${t.status}`);
      const n = await t.json();
      if (
        !((l = n.loaded) != null && l.length) ||
        !((c = n.coast) != null && c.length) ||
        !n.sampleRate
      )
        throw new Error("Invalid engine bank");
      const r = async (h) => {
          const d = await fetch(`${Qp}/${h}`);
          if (!d.ok) throw new Error(`Engine audio: ${d.status} ${h}`);
          const u = await i.decodeAudioData(await d.arrayBuffer());
          if (u.numberOfChannels !== 1)
            throw new Error(`Engine recording must be mono: ${h}`);
          return u.getChannelData(0).slice();
        },
        s = async (h) =>
          Promise.all(h.map(async (d) => ({ ...d, samples: await r(d.file) }))),
        [a, o, A] = await Promise.all([
          s(n.loaded),
          s(n.coast),
          r(n.idle.file),
          i.audioWorklet.addModule(Fw),
        ]);
      return { loaded: a, coast: o, idle: A, sampleRate: i.sampleRate };
    })()),
    em.set(i, e),
    e)
  );
}

class EngineAudio {
  constructor(e = !1) {
    _(this, "drive", new EngineDynamics());
    _(this, "spatial");
    _(this, "context", null);
    _(this, "node", null);
    _(this, "output", null);
    _(this, "filters", []);
    _(this, "spatialBus", null);
    _(this, "loading", null);
    _(this, "resumePending", !1);
    _(this, "unlocked", !1);
    _(this, "disposed", !1);
    _(this, "unavailable", !1);
    _(this, "loadError", null);
    _(this, "wanted", !1);
    _(this, "alive", !1);
    _(this, "active", !1);
    _(this, "sendAt", 0);
    _(this, "position", new F());
    _(this, "state", { rpm: 0, load: 0 });
    _(this, "unlock", () => {
      this.disposed || ((this.unlocked = !0), this.wanted && this.prepare());
    });
    _(this, "visibilityChanged", () => {
      document.hidden && this.silence();
    });
    _(this, "silence", () => {
      var t, n;
      const e = this.active;
      ((this.wanted = !1),
        (this.active = !1),
        (this.sendAt = 0),
        e &&
          (this.output &&
            this.context &&
            (this.output.gain.cancelScheduledValues(this.context.currentTime),
            this.output.gain.setValueAtTime(0, this.context.currentTime),
            (t = this.node) == null ||
              t.port.postMessage({
                type: "state",
                rpm: this.state.rpm,
                load: this.state.load,
                enabled: !1,
              })),
          (n = this.spatialBus) == null || n.setEnabled(!1)));
    });
    ((this.spatial = e),
      window.addEventListener("pointerdown", this.unlock, { passive: !0 }),
      window.addEventListener("keydown", this.unlock),
      window.addEventListener("blur", this.silence),
      window.addEventListener("pagehide", this.silence),
      document.addEventListener("visibilitychange", this.visibilityChanged));
  }
  preload() {
    if (this.unavailable) return Promise.reject(this.loadError);
    if (this.disposed || this.node) return Promise.resolve();
    if (this.loading) return this.loading;
    const e = this.context ?? (this.context = getAudioContext());
    return (
      (this.loading = Kw(e)
        .then((t) => {
          var a;
          if (this.disposed) return;
          ((this.node = new AudioWorkletNode(e, "car-engine", {
            numberOfInputs: 0,
            numberOfOutputs: 1,
            outputChannelCount: [1],
          })),
            this.node.port.postMessage({ type: "bank", ...t }));
          const n = e.createBiquadFilter();
          ((n.type = "highpass"), (n.frequency.value = 150), (n.Q.value = 1));
          const r = e.createBiquadFilter();
          ((r.type = "peaking"),
            (r.frequency.value = 250),
            (r.Q.value = 1),
            (r.gain.value = -4));
          const s = e.createBiquadFilter();
          ((s.type = "highshelf"),
            (s.frequency.value = 5e3),
            (s.gain.value = 2),
            (this.filters = [n, r, s]),
            (this.output = e.createGain()),
            (this.output.gain.value = 0),
            this.node.connect(n).connect(r).connect(s).connect(this.output),
            this.spatial &&
              ((this.spatialBus = new SpatialAudioBus(e, getAudioInput())),
              this.spatialBus.setPosition(this.position),
              this.spatialBus.setEnabled(!1)),
            this.output.connect(
              ((a = this.spatialBus) == null ? void 0 : a.input) ?? getAudioInput(),
            ));
        })
        .catch((t) => {
          throw (
            (this.unavailable = !0),
            (this.loadError = t),
            console.warn("Engine audio could not be loaded", t),
            t
          );
        })
        .finally(() => {
          this.loading = null;
        })),
      this.loading
    );
  }
  update(e, t) {
    var n;
    if (!this.disposed) {
      if (
        (e.alive !== this.alive && (this.reset(), (this.alive = e.alive)),
        e.position &&
          (this.position.copy(e.position),
          (n = this.spatialBus) == null || n.setPosition(this.position)),
        (this.wanted =
          e.alive && e.audible && !document.hidden && document.hasFocus()),
        !this.wanted)
      ) {
        this.silence();
        return;
      }
      ((this.state = this.drive.update(e, t)),
        e.controllerActive && (this.unlocked = !0),
        this.unlocked && this.prepare(),
        this.apply());
    }
  }
  reset() {
    var e;
    this.disposed ||
      (this.drive.reset(),
      (this.state = { rpm: 0, load: 0 }),
      this.silence(),
      (e = this.node) == null || e.port.postMessage({ type: "reset" }));
  }
  dispose() {
    var e, t, n, r, s;
    if (!this.disposed) {
      (this.reset(),
        (this.disposed = !0),
        window.removeEventListener("pointerdown", this.unlock),
        window.removeEventListener("keydown", this.unlock),
        window.removeEventListener("blur", this.silence),
        window.removeEventListener("pagehide", this.silence),
        document.removeEventListener(
          "visibilitychange",
          this.visibilityChanged,
        ),
        (e = this.node) == null || e.port.postMessage({ type: "dispose" }),
        (t = this.node) == null || t.disconnect(),
        (n = this.node) == null || n.port.close());
      for (const a of this.filters) a.disconnect();
      ((r = this.output) == null || r.disconnect(),
        (s = this.spatialBus) == null || s.dispose());
    }
  }
  prepare() {
    if (this.unavailable || this.disposed) return;
    const e = this.context ?? (this.context = getAudioContext());
    (e.state === "suspended" &&
      !this.resumePending &&
      ((this.resumePending = !0),
      e
        .resume()
        .catch(() => {})
        .finally(() => {
          this.resumePending = !1;
        })),
      !(this.node || this.loading) &&
        this.preload()
          .then(() => this.apply())
          .catch(() => {}));
  }
  apply() {
    var t;
    if (
      !this.node ||
      !this.output ||
      !this.context ||
      !this.unlocked ||
      !this.wanted ||
      this.disposed ||
      document.hidden ||
      !document.hasFocus() ||
      this.context.state !== "running"
    )
      return;
    const e = this.context.currentTime;
    (this.active ||
      ((this.active = !0),
      this.output.gain.cancelScheduledValues(e),
      this.output.gain.setValueAtTime(0, e),
      this.output.gain.linearRampToValueAtTime(Jw, e + 0.1),
      (t = this.spatialBus) == null || t.setEnabled(!0),
      (this.sendAt = 0)),
      e >= this.sendAt &&
        (this.node.port.postMessage({
          type: "state",
          rpm: this.state.rpm,
          load: this.state.load,
          enabled: !0,
        }),
        (this.sendAt = e + 1 / 60)));
  }
}

export { EngineAudio };
