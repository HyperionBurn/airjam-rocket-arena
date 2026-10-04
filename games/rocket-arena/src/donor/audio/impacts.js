import { _ } from "../core/class-fields.js";
import { getAudioContext, getAudioInput } from "./settings.js";

const ww = "/assets/audio/impacts";

const Rc = {
    carCore: [
      "vehicle-body-01",
      "vehicle-body-02",
      "vehicle-body-03",
      "vehicle-body-04",
      "vehicle-body-05",
      "vehicle-body-06",
    ],
    carDetail: [
      "vehicle-detail-01",
      "vehicle-detail-02",
      "vehicle-detail-03",
      "vehicle-detail-04",
      "vehicle-detail-05",
      "vehicle-detail-06",
    ],
    carHard: [
      "vehicle-hard-01",
      "vehicle-hard-02",
      "vehicle-hard-03",
      "vehicle-hard-04",
      "vehicle-hard-05",
      "vehicle-hard-06",
    ],
    carSweetener: ["vehicle-accent-01"],
    surfaceDetail: [
      "surface-detail-01",
      "surface-detail-02",
      "surface-detail-03",
      "surface-detail-04",
      "surface-detail-05",
      "surface-detail-06",
    ],
    surfaceBody: [
      "surface-body-01",
      "surface-body-02",
      "surface-body-03",
      "surface-body-04",
      "surface-body-05",
      "surface-body-06",
    ],
    grass: ["grass-01", "grass-02", "grass-03", "grass-04", "grass-05"],
    arena: [
      "arena-01",
      "arena-02",
      "arena-03",
      "arena-04",
      "arena-05",
      "arena-06",
    ],
  };

const Mw = 0.3;

const Bw = 0.2;

function xi(i) {
  return Math.pow(10, i / 20);
}

function Pc(i) {
  return Math.min(1, Math.max(0, i));
}

class ImpactAudio {
  constructor() {
    _(this, "context", null);
    _(this, "buffers", new Map());
    _(this, "loading", new Map());
    _(this, "lastIndex", new Map());
    _(this, "previousCarSerial", null);
    _(this, "previousWorldSerial", null);
  }
  async preload() {
    await Promise.all(
      Object.keys(Rc).map(async (e) => {
        if ((await this.load(e)).length !== Rc[e].length)
          throw new Error(`Ball-hit ${e} audio is unavailable`);
      }),
    );
  }
  update(e) {
    if (this.previousCarSerial === null || this.previousWorldSerial === null) {
      ((this.previousCarSerial = e.carSerial),
        (this.previousWorldSerial = e.worldSerial));
      return;
    }
    (e.audible &&
      (e.carSerial !== this.previousCarSerial &&
        this.playCar(e.carSpeed, e.carPan ?? 0),
      e.worldSerial !== this.previousWorldSerial &&
        this.playWorld(e.worldSpeed, e.worldSurface, e.worldPan)),
      (this.previousCarSerial = e.carSerial),
      (this.previousWorldSerial = e.worldSerial));
  }
  getContext() {
    return (this.context || (this.context = getAudioContext()), this.context);
  }
  load(e) {
    const t = this.buffers.get(e);
    if (t) return Promise.resolve(t);
    const n = this.loading.get(e);
    if (n) return n;
    const r = this.getContext(),
      s = Promise.all(
        Rc[e].map(async (a) => {
          const o = `${ww}/${a}.mp3`,
            A = await fetch(o);
          if (!A.ok) throw new Error(`${A.status} ${A.statusText}: ${o}`);
          return r.decodeAudioData(await A.arrayBuffer());
        }),
      )
        .then((a) => (this.buffers.set(e, a), a))
        .catch((a) => {
          console.warn(`Ball-hit ${e} audio could not be loaded`, a);
          const o = [];
          return (this.buffers.set(e, o), o);
        })
        .finally(() => {
          this.loading.delete(e);
        });
    return (this.loading.set(e, s), s);
  }
  async playCar(e, t = 0) {
    const n = this.getContext();
    if ((await n.resume(), n.state !== "running")) return;
    const r = Pc(e / 2e3),
      s = Mw * xi(-8 * (1 - r)),
      a = -96.3 + 95.3 * r,
      o = -96.3 + 96.3 * r;
    await Promise.all([
      this.playLayer("carCore", s * xi(-6), t),
      this.playLayer("carDetail", s * xi(-1 + a), t),
      this.playLayer("carHard", s * xi(o), t),
      this.playLayer("carSweetener", s * xi(-2), t),
    ]);
  }
  async playWorld(e, t, n) {
    const r = this.getContext();
    if ((await r.resume(), r.state !== "running")) return;
    const s = Pc(e / 2e3),
      a = Pc((e - 35) / 965),
      o = Bw * (0.18 + 0.82 * Math.sqrt(a)),
      A = -1 + 1.182 * s,
      l = t === 0 ? "grass" : "arena",
      c = t === 0 ? -18.1 : -17;
    await Promise.all([
      this.playLayer(l, o * xi(c + A), n),
      this.playLayer("surfaceDetail", o * xi(-9), n),
      this.playLayer("surfaceBody", o, n),
    ]);
  }
  async playLayer(e, t, n = 0) {
    if (t < 1e-4) return;
    const r = this.getContext(),
      s = await this.load(e);
    if (s.length === 0 || r.state !== "running") return;
    const a = this.lastIndex.get(e) ?? -1;
    let o = Math.floor(Math.random() * s.length);
    (s.length > 1 &&
      o === a &&
      (o = (o + 1 + Math.floor(Math.random() * (s.length - 1))) % s.length),
      this.lastIndex.set(e, o));
    const A = r.createBufferSource(),
      l = r.createGain(),
      c = r.createStereoPanner();
    ((A.buffer = s[o]),
      (l.gain.value = t),
      (c.pan.value = Math.min(1, Math.max(-1, n))),
      A.connect(l).connect(c).connect(getAudioInput()),
      A.addEventListener(
        "ended",
        () => {
          (A.disconnect(), l.disconnect(), c.disconnect());
        },
        { once: !0 },
      ),
      A.start());
  }
}

export { ImpactAudio };
