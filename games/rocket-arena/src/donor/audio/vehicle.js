import { _ } from "../core/class-fields.js";
import { getAudioContext, getAudioInput } from "./settings.js";

const Cw = "/assets/audio/vehicle";

const kc = {
    jump: ["jump-01", "jump-02", "jump-03", "jump-04"],
    dodge: ["dodge-01", "dodge-02", "dodge-03", "dodge-04"],
    doubleJump: [
      "double-jump-01",
      "double-jump-02",
      "double-jump-03",
      "double-jump-04",
    ],
    wheelImpact: [
      "wheel-impact-01",
      "wheel-impact-02",
      "wheel-impact-03",
      "wheel-impact-04",
    ],
  };

const Tc = { jump: 0.3, dodge: 0.3, doubleJump: 0.3 };

function bw(i) {
  return Math.pow(10, i / 20);
}

class VehicleAudio {
  constructor() {
    _(this, "context", null);
    _(this, "buffers", new Map());
    _(this, "loading", new Map());
    _(this, "lastIndex", new Map());
    _(this, "previous", null);
  }
  async preload() {
    await Promise.all(
      Object.keys(kc).map(async (e) => {
        if ((await this.load(e)).length !== kc[e].length)
          throw new Error(`Car ${e} audio is unavailable`);
      }),
    );
  }
  update(e) {
    const t = {
      jumpSerial: e.jumpSerial,
      dodgeSerial: e.dodgeSerial,
      doubleJumpSerial: e.doubleJumpSerial,
      wheelImpactSerial: e.wheelImpactSerial,
    };
    if (!this.previous) {
      this.previous = t;
      return;
    }
    if (
      e.audible &&
      (t.jumpSerial !== this.previous.jumpSerial && this.play("jump", Tc.jump),
      t.dodgeSerial !== this.previous.dodgeSerial &&
        this.play("dodge", Tc.dodge),
      t.doubleJumpSerial !== this.previous.doubleJumpSerial &&
        this.play("doubleJump", Tc.doubleJump),
      t.wheelImpactSerial !== this.previous.wheelImpactSerial &&
        e.wheelImpactSpeed >= 50)
    ) {
      const n = Math.min(1, Math.max(0, e.wheelImpactSpeed / 2e3)),
        r = bw(-4.582 * (1 - n));
      this.play("wheelImpact", 0.15 * r);
    }
    this.previous = t;
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
        kc[e].map(async (a) => {
          const o = `${Cw}/${a}.mp3`,
            A = await fetch(o);
          if (!A.ok) throw new Error(`${A.status} ${A.statusText}: ${o}`);
          return r.decodeAudioData(await A.arrayBuffer());
        }),
      )
        .then((a) => (this.buffers.set(e, a), a))
        .catch((a) => {
          console.warn(`Car ${e} audio could not be loaded`, a);
          const o = [];
          return (this.buffers.set(e, o), o);
        })
        .finally(() => {
          this.loading.delete(e);
        });
    return (this.loading.set(e, s), s);
  }
  async play(e, t) {
    const n = this.getContext();
    await n.resume();
    const r = await this.load(e);
    if (r.length === 0 || n.state !== "running") return;
    const s = this.lastIndex.get(e) ?? -1;
    let a = Math.floor(Math.random() * r.length);
    (r.length > 1 &&
      a === s &&
      (a = (a + 1 + Math.floor(Math.random() * (r.length - 1))) % r.length),
      this.lastIndex.set(e, a));
    const o = n.createBufferSource(),
      A = n.createGain();
    ((o.buffer = r[a]),
      (A.gain.value = t),
      o.connect(A).connect(getAudioInput()),
      o.addEventListener(
        "ended",
        () => {
          (o.disconnect(), A.disconnect());
        },
        { once: !0 },
      ),
      o.start());
  }
}

export { VehicleAudio };
