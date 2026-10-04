import { _ } from "../core/class-fields.js";
import { getAudioContext, getAudioInput } from "./settings.js";

const Tw = 5802 / 24e3;

const Rw = 106283 / 24e3;

const Kp = Math.pow(10, 6 / 20) * 0.045;

const Pw = Math.pow(10, -15 / 20);

const Iw = ["supersonic-enter-a", "supersonic-enter-b", "supersonic-enter-c"];

class BallAudio {
  constructor() {
    _(this, "context", null);
    _(this, "buffer", null);
    _(this, "entries", []);
    _(this, "loading", null);
    _(this, "unavailable", !1);
    _(this, "loadError", null);
    _(this, "source", null);
    _(this, "gain", null);
    _(this, "entrySource", null);
    _(this, "entryGain", null);
    _(this, "lastEntry", -1);
    _(this, "previousSupersonic", !1);
    _(this, "entryDeadline", 0);
    _(this, "wanted", !1);
    _(this, "applied", !1);
    _(this, "unlocked", !1);
    _(this, "resumePending", !1);
    _(this, "stopAt", 0);
    const e = () => {
      var t;
      ((this.unlocked = !0),
        ((t = this.context) == null ? void 0 : t.state) === "suspended" &&
          this.context.resume().catch(() => {}),
        this.prepare());
    };
    (window.addEventListener("pointerdown", e, { passive: !0 }),
      window.addEventListener("keydown", e),
      document.addEventListener("visibilitychange", () => {
        document.hidden && this.silence();
      }),
      window.addEventListener("blur", () => this.silence()));
  }
  preload() {
    if (this.unavailable) return Promise.reject(this.loadError);
    if (this.buffer) return Promise.resolve();
    if (this.loading) return this.loading;
    const e = this.context ?? (this.context = getAudioContext()),
      t = async (n) => {
        const r = await fetch(`/assets/audio/vehicle/${n}.mp3`);
        if (!r.ok) throw new Error(`Audio request failed: ${r.status} ${n}`);
        return e.decodeAudioData(await r.arrayBuffer());
      };
    return (
      (this.loading = Promise.all(["supersonic-loop", ...Iw].map(t))
        .then(([n, ...r]) => {
          ((this.buffer = n), (this.entries = r));
        })
        .catch((n) => {
          throw (
            (this.unavailable = !0),
            (this.loadError = n),
            console.warn("Supersonic audio could not be loaded", n),
            n
          );
        })
        .finally(() => {
          this.loading = null;
        })),
      this.loading
    );
  }
  update(e, t, n = !0) {
    t && (this.unlocked = !0);
    const r = n && !document.hidden && document.hasFocus();
    ((this.wanted = e && r),
      e &&
        !this.previousSupersonic &&
        r &&
        (this.entryDeadline = performance.now() + 500),
      (this.previousSupersonic = e),
      (!r || !e) && (this.entryDeadline = 0),
      r || this.stopEntry(),
      this.unlocked &&
        (!this.buffer || (this.wanted && !this.source)) &&
        this.prepare(),
      this.playPendingEntry());
    const s = this.context;
    if (!(!s || !this.gain)) {
      if (this.wanted !== this.applied) {
        const a = s.currentTime,
          o = this.gain.gain,
          A = o.value;
        (o.cancelScheduledValues(a),
          o.setValueAtTime(A, a),
          o.linearRampToValueAtTime(this.wanted ? Kp : 0, a + 0.2),
          (this.applied = this.wanted),
          (this.stopAt = this.wanted ? 0 : a + 0.21));
      }
      this.stopAt && s.currentTime >= this.stopAt && this.stopLoop();
    }
  }
  async prepare() {
    if (this.unavailable) return;
    const e = this.context ?? (this.context = getAudioContext());
    e.state === "suspended" &&
      !this.resumePending &&
      ((this.resumePending = !0),
      e
        .resume()
        .catch(() => {})
        .finally(() => {
          this.resumePending = !1;
        }));
    try {
      await this.preload();
    } catch {
      return;
    }
    if (!this.unlocked || !this.wanted || this.source || e.state !== "running")
      return;
    const t = e.createBufferSource(),
      n = e.createGain();
    ((t.buffer = this.buffer),
      (t.loop = !0),
      (t.loopStart = Tw),
      (t.loopEnd = Rw),
      (n.gain.value = 0),
      n.gain.linearRampToValueAtTime(Kp, e.currentTime + 0.2),
      t.connect(n).connect(getAudioInput()),
      t.start(),
      (this.source = t),
      (this.gain = n),
      (this.applied = !0),
      (this.stopAt = 0),
      this.playPendingEntry());
  }
  playPendingEntry() {
    const e = this.context;
    if (
      !this.unlocked ||
      !this.entryDeadline ||
      !e ||
      e.state !== "running" ||
      this.entries.length === 0
    )
      return;
    const t = performance.now() <= this.entryDeadline;
    if (((this.entryDeadline = 0), !t || !this.wanted)) return;
    this.stopEntry();
    const n =
      this.lastEntry < 0
        ? Math.floor(Math.random() * this.entries.length)
        : (this.lastEntry +
            1 +
            Math.floor(Math.random() * (this.entries.length - 1))) %
          this.entries.length;
    this.lastEntry = n;
    const r = e.createBufferSource(),
      s = e.createGain();
    ((r.buffer = this.entries[n]),
      (s.gain.value = Pw),
      r.connect(s).connect(getAudioInput()),
      (r.onended = () => {
        (r.disconnect(),
          s.disconnect(),
          this.entrySource === r &&
            ((this.entrySource = null), (this.entryGain = null)));
      }),
      r.start(),
      (this.entrySource = r),
      (this.entryGain = s));
  }
  stopLoop() {
    var e, t, n;
    ((e = this.source) == null || e.stop(),
      (t = this.source) == null || t.disconnect(),
      (n = this.gain) == null || n.disconnect(),
      (this.source = null),
      (this.gain = null),
      (this.applied = !1),
      (this.stopAt = 0));
  }
  stopEntry() {
    var e, t, n;
    ((e = this.entrySource) == null || e.stop(),
      (t = this.entrySource) == null || t.disconnect(),
      (n = this.entryGain) == null || n.disconnect(),
      (this.entrySource = null),
      (this.entryGain = null));
  }
  silence() {
    ((this.wanted = !1),
      (this.entryDeadline = 0),
      this.stopLoop(),
      this.stopEntry());
  }
}

export { BallAudio };
