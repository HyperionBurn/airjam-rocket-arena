import { _ } from "../core/class-fields.js";
import { Ne, Pt } from "../vendor/three.js";
import { getAudioContext, getAudioInput } from "./settings.js";

const zp = "/assets/audio/events/reset.mp3";

const pw = 100;

const mw = -12;

const Vp = 0.24;

const gw = 0.05;

const Wp = 0.18;

const ys = 8;

const vw = new Ne(16773836);

const Xp = new Pt();

class ResetAudio {
  constructor() {
    _(this, "context", null);
    _(this, "buffer", null);
    _(this, "loading", null);
    _(this, "playSerial", 0);
    this.load();
  }
  async preload() {
    if (!(await this.load()))
      throw new Error("Flip reset audio is unavailable");
  }
  play() {
    this.playAsync();
  }
  async playAsync() {
    const e = ++this.playSerial,
      t = performance.now(),
      n = this.getContext();
    if (!this.buffer || n.state !== "running") {
      try {
        await Promise.all([
          this.load(),
          n.state === "suspended" ? n.resume() : void 0,
        ]);
      } catch {
        return;
      }
      if (e !== this.playSerial || performance.now() - t > pw) return;
    }
    const r = this.buffer;
    if (!r || n.state !== "running") return;
    const s = n.createBufferSource(),
      a = n.createGain();
    ((s.buffer = r),
      (a.gain.value = 0.78),
      s.connect(a).connect(getAudioInput()),
      s.addEventListener(
        "ended",
        () => {
          (s.disconnect(), a.disconnect());
        },
        { once: !0 },
      ),
      s.start());
  }
  getContext() {
    return (this.context || (this.context = getAudioContext()), this.context);
  }
  load() {
    if (this.buffer) return Promise.resolve(this.buffer);
    if (this.loading) return this.loading;
    const e = this.getContext();
    return (
      (this.loading = fetch(zp)
        .then((t) => {
          if (!t.ok) throw new Error(`${t.status} ${t.statusText}: ${zp}`);
          return t.arrayBuffer();
        })
        .then((t) => e.decodeAudioData(t))
        .then((t) => ((this.buffer = t), t))
        .catch(
          (t) => (
            console.warn(
              "Flip reset audio could not be loaded from the local asset directory",
              t,
            ),
            null
          ),
        )),
      this.loading
    );
  }
}

export { ResetAudio, Vp, Wp, Xp, gw, mw, vw, ys };
