import { _ } from "../core/class-fields.js";
import { CAR_STATE, CAR_STATE_STRIDE, STATE_LAYOUT, ro } from "../physics/state-layout.js";
import { Eg, ed } from "./actions.js";

const cr = 37;

const Kn = 24;

const cm = 8;

class NectoAgent {
  constructor() {
    _(this, "outputNames", ["throttle", "steer", "jump", "boost", "handbrake"]);
    _(this, "demoTimers", new Float64Array(2));
    _(this, "boostTimers", new Float64Array(34));
  }
  initialInputs() {
    return {
      query: { data: new Float32Array(32), dims: [1, 1, 32] },
      entities: { data: new Float32Array(cr * Kn), dims: [1, cr, Kn] },
      mask: { data: new Float32Array(cr), dims: [1, cr] },
    };
  }
  reset() {
    (this.demoTimers.fill(0), this.boostTimers.fill(0));
  }
  build(e, t, n, r, s) {
    if (e[STATE_LAYOUT.NUM_CARS] !== 2 || t.length !== 34 || (r !== 0 && r !== 1))
      throw new Error("Necto requires two cars and the standard 34-pad arena.");
    const a = new Float64Array(cr * Kn);
    a[3] = 1;
    for (let l = 0; l < 3; l++)
      ((a[5 + l] = e[STATE_LAYOUT.BALL + l]),
        (a[8 + l] = e[STATE_LAYOUT.BALL + 12 + l]),
        (a[17 + l] = e[STATE_LAYOUT.BALL + 15 + l]));
    ([r, 1 - r].forEach((l, c) => {
      const h = STATE_LAYOUT.CARS + l * CAR_STATE_STRIDE,
        d = (c + 1) * Kn;
      ((a[d] = +(c === 0)), (a[d + 1] = +(c === 0)), (a[d + 2] = +(c !== 0)));
      for (let u = 0; u < 3; u++)
        ((a[d + 5 + u] = e[h + CAR_STATE.POS + u]),
          (a[d + 8 + u] = e[h + CAR_STATE.VEL + u]),
          (a[d + 11 + u] = e[h + CAR_STATE.FWD + u]),
          (a[d + 14 + u] = e[h + CAR_STATE.UP + u]),
          (a[d + 17 + u] = e[h + CAR_STATE.ANG_VEL + u]));
      ((a[d + 20] = e[h + CAR_STATE.BOOST] / 100),
        (this.demoTimers[l] =
          this.demoTimers[l] <= 0
            ? 3
            : Math.max(this.demoTimers[l] - cm / 120, 0)),
        (a[d + 21] = this.demoTimers[l] / 10),
        (a[d + 22] = e[h + CAR_STATE.ON_GROUND]),
        (a[d + 23] = e[h + CAR_STATE.HAS_FLIP_OR_JUMP]));
    }),
      t.forEach((l, c) => {
        const h = (c + 3) * Kn,
          d = e[ro + c * 2];
        ((a[h + 4] = 1),
          a.set(l.pos, h + 5),
          (a[h + 20] = 0.12 + 0.88 * +l.isBig),
          d === 1 &&
            this.boostTimers[c] === 0 &&
            (this.boostTimers[c] = 0.4 + 0.6 * +(l.pos[2] > 72)),
          (this.boostTimers[c] *= d),
          (a[h + 21] = this.boostTimers[c]),
          (this.boostTimers[c] = Math.max(this.boostTimers[c] - cm / 1200, 0)));
      }));
    for (let l = 0; l < cr; l++) {
      const c = l * Kn;
      for (let h = 5; h < 20; h++)
        (h < 11 && (a[c + h] /= 2300),
          h >= 17 && (a[c + h] /= 5.5),
          s === 1 && (h - 5) % 3 !== 2 && (a[c + h] *= -1));
    }
    const o = a.slice(Kn, 2 * Kn),
      A = new Float32Array(32);
    (A.set(o), A.set(Eg(n), Kn));
    for (let l = 0; l < cr; l++)
      for (let c = 5; c < 11; c++) a[l * Kn + c] -= o[c];
    return {
      query: { data: A, dims: [1, 1, 32] },
      entities: { data: new Float32Array(a), dims: [1, cr, Kn] },
      mask: { data: new Float32Array(cr), dims: [1, cr] },
    };
  }
  decode(e) {
    const t = this.outputNames.map((A, l) => {
        const c = e[A];
        if (!c || c.length !== (l < 2 ? 3 : 2) || !c.every(Number.isFinite))
          throw new Error(`Necto returned invalid ${A} logits.`);
        let h = 0;
        for (let d = 1; d < c.length; d++) c[d] > c[h] && (h = d);
        return h;
      }),
      [n, r, s, a, o] = t;
    return ed([
      n - 1,
      r - 1,
      n - 1,
      (r - 1) * (1 - o) || 0,
      (r - 1) * o || 0,
      s,
      a,
      o,
    ]);
  }
}

export { NectoAgent };
