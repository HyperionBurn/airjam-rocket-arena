import { _ } from "../core/class-fields.js";
import { F, Ne } from "../vendor/three.js";
import { getAudioContext, getAudioInput } from "./settings.js";
import { SpatialAudioBus } from "./spatial.js";

const Ec = "/assets/audio/boost";

const yi = 72;

const ti = 16;

const H1 = 0.36;

const U1 = 0.3;

const q1 = 28;

const $1 = 8;

const Ep = 24;

const yp = new Ne(16750126);

const Ti = 1;

const z1 = 0.5;

const _s = new F();

const xp = new F();

const yc = new F();

const lA = new F();

const Cp = ["aOffset", "aSize", "aOpacity", "aLife", "aRotation"];

function xc(i) {
  return Math.pow(10, i / 20);
}

const bp = new WeakMap();

class BoostAudio {
  constructor(e = !1) {
    _(this, "context", null);
    _(this, "buffers", null);
    _(this, "loading", null);
    _(this, "generation", 0);
    _(this, "boosting", !1);
    _(this, "startSource", null);
    _(this, "loopSource", null);
    _(this, "spatial");
    _(this, "spatialBus", null);
    _(this, "position", new F());
    _(this, "enabled", !0);
    _(this, "voices", new Set());
    this.spatial = e;
  }
  async preload() {
    if ((await this.load()).length !== 3)
      throw new Error("Golden Boost audio is unavailable");
  }
  updateSpatial(e, t) {
    var n, r;
    this.spatial &&
      (this.position.copy(e),
      (this.enabled = t),
      (n = this.spatialBus) == null || n.setPosition(e),
      (r = this.spatialBus) == null || r.setEnabled(t));
  }
  dispose() {
    var e;
    ((this.boosting = !1), (this.enabled = !1), this.generation++);
    for (const t of this.voices) {
      try {
        t.source.stop();
      } catch {}
      (t.source.disconnect(), t.gain.disconnect());
    }
    (this.voices.clear(),
      (this.startSource = this.loopSource = null),
      (e = this.spatialBus) == null || e.dispose(),
      (this.spatialBus = null));
  }
  setBoosting(e) {
    if (e === this.boosting) return;
    this.boosting = e;
    const t = ++this.generation;
    e ? this.start(t) : this.stop(t);
  }
  getContext() {
    return (
      this.context ||
        ((this.context = getAudioContext()),
        this.spatial &&
          ((this.spatialBus = new SpatialAudioBus(this.context, getAudioInput())),
          this.spatialBus.setPosition(this.position),
          this.spatialBus.setEnabled(this.enabled))),
      this.context
    );
  }
  load() {
    if (this.buffers) return Promise.resolve(this.buffers);
    if (this.loading) return this.loading;
    const e = this.getContext(),
      t = [`${Ec}/start.wav`, `${Ec}/loop.wav`, `${Ec}/release.wav`];
    let n = bp.get(e);
    return (
      n ||
        ((n = Promise.all(
          t.map(async (r) => {
            const s = await fetch(r);
            if (!s.ok) throw new Error(`${s.status} ${s.statusText}: ${r}`);
            return e.decodeAudioData(await s.arrayBuffer());
          }),
        )),
        bp.set(e, n)),
      (this.loading = n
        .then((r) => ((this.buffers = r), r))
        .catch(
          (r) => (
            console.warn("Golden Boost audio could not be loaded", r),
            []
          ),
        )),
      this.loading
    );
  }
  play(e, t, n, r = !1) {
    var l;
    const s = this.getContext(),
      a = s.createBufferSource(),
      o = s.createGain();
    ((a.buffer = e),
      (a.loop = r),
      o.gain.setValueAtTime(t * z1, n),
      a
        .connect(o)
        .connect(((l = this.spatialBus) == null ? void 0 : l.input) ?? getAudioInput()));
    const A = { source: a, gain: o };
    return (
      this.voices.add(A),
      a.addEventListener(
        "ended",
        () => {
          (a.disconnect(), o.disconnect(), this.voices.delete(A));
        },
        { once: !0 },
      ),
      a.start(n),
      A
    );
  }
  async start(e) {
    const t = this.getContext();
    await t.resume();
    const n = await this.load();
    if (
      !this.boosting ||
      !this.enabled ||
      e !== this.generation ||
      n.length !== 3
    )
      return;
    const r = t.currentTime;
    (this.stopCurrentVoices(r),
      (this.startSource = this.play(n[0], xc(-3), r)),
      (this.loopSource = this.play(n[1], xc(-2), r + 0.3, !0)));
  }
  async stop(e) {
    const t = this.context;
    if (!t) return;
    const n = t.currentTime;
    this.stopCurrentVoices(n);
    const r = await this.load();
    this.boosting ||
      !this.enabled ||
      e !== this.generation ||
      r.length !== 3 ||
      (await t.resume(),
      !(this.boosting || !this.enabled || e !== this.generation) &&
        this.play(r[2], xc(-8), t.currentTime));
  }
  stopCurrentVoices(e) {
    (this.fadeAndStop(this.loopSource, e, 0.1),
      this.fadeAndStop(this.startSource, e, 0.3),
      (this.loopSource = null),
      (this.startSource = null));
  }
  fadeAndStop(e, t, n) {
    if (e) {
      (e.gain.gain.cancelScheduledValues(t),
        e.gain.gain.setValueAtTime(e.gain.gain.value, t),
        e.gain.gain.linearRampToValueAtTime(0, t + n));
      try {
        e.source.stop(t + n);
      } catch {}
    }
  }
}

export { $1, BoostAudio, Cp, Ep, H1, Ti, U1, _s, lA, q1, ti, xp, yc, yi, yp };
