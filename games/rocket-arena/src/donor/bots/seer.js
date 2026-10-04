import { _ } from "../core/class-fields.js";
import { CAR_STATE, CAR_STATE_STRIDE, STATE_LAYOUT, ro } from "../physics/state-layout.js";

const yg = [3, 5, 5, 3, 2, 2, 2];

const Gn = Math.fround;

function Cs(i, e, t, n) {
  const r = Gn(i[e] - t[n]),
    s = Gn(i[e + 1] - t[n + 1]),
    a = Gn(i[e + 2] - t[n + 2]);
  return [r, s, a, MA(r, s, a)];
}

function MA(i, e, t) {
  return Gn(Math.sqrt(Gn(Gn(Gn(i * i) + Gn(e * e)) + Gn(t * t))));
}

function YM(i) {
  const e = [
    Math.round(i.throttle + 1),
    Math.round((i.steer + 1) * 2),
    Math.round((i.pitch + 1) * 2),
    Math.round(i.roll + 1),
    +i.jump,
    +i.boost,
    +i.handbrake,
  ];
  return yg.flatMap((t, n) =>
    t === 2 ? [e[n]] : Array.from({ length: t }, (r, s) => +(e[n] === s)),
  );
}

function hm(i, e, t, n) {
  const r = STATE_LAYOUT.CARS + e * CAR_STATE_STRIDE,
    s = Gn(
      Math.atan2(
        i[r + CAR_STATE.FWD + 2],
        Math.hypot(i[r + CAR_STATE.FWD], i[r + CAR_STATE.FWD + 1]),
      ),
    );
  let a = Gn(Math.atan2(i[r + CAR_STATE.FWD + 1], i[r + CAR_STATE.FWD]));
  const o = Gn(Math.atan2(-i[r + CAR_STATE.RIGHT + 2], i[r + CAR_STATE.UP + 2]));
  n && ((a += Math.PI), a > Math.PI && (a -= 2 * Math.PI));
  const A = n ? -1 : 1;
  return new Float32Array([
    A * i[r + CAR_STATE.POS],
    A * i[r + CAR_STATE.POS + 1],
    i[r + CAR_STATE.POS + 2],
    s,
    a,
    o,
    A * i[r + CAR_STATE.VEL],
    A * i[r + CAR_STATE.VEL + 1],
    i[r + CAR_STATE.VEL + 2],
    A * i[r + CAR_STATE.ANG_VEL],
    A * i[r + CAR_STATE.ANG_VEL + 1],
    i[r + CAR_STATE.ANG_VEL + 2],
    t,
    i[r + CAR_STATE.BOOST],
    i[r + CAR_STATE.ON_GROUND],
    i[r + CAR_STATE.HAS_FLIP_OR_JUMP],
  ]);
}

class SeerAgent {
  constructor() {
    _(this, "outputNames", ["logits", "hidden_out", "cell_out"]);
    _(this, "hidden", new Float32Array(512));
    _(this, "cell", new Float32Array(512));
    _(this, "demoTimers", [0, 0]);
    _(this, "lastTick", null);
  }
  initialInputs() {
    return {
      observation: { data: new Float32Array(159), dims: [1, 159] },
      hidden: { data: new Float32Array(512), dims: [1, 1, 512] },
      cell: { data: new Float32Array(512), dims: [1, 1, 512] },
    };
  }
  build(e, t, n, r, s) {
    if (e[STATE_LAYOUT.NUM_CARS] !== 2 || t.length !== 34 || (r !== 0 && r !== 1))
      throw new Error("Seer requires two cars and the standard 34-pad arena.");
    const a = e[STATE_LAYOUT.TICK],
      o = this.lastTick === null ? 0 : Math.max(0, a - this.lastTick) / 120;
    this.lastTick = a;
    for (let m = 0; m < 2; m++)
      this.demoTimers[m] =
        e[STATE_LAYOUT.CARS + m * CAR_STATE_STRIDE + CAR_STATE.DEMOED] > 0 ? this.demoTimers[m] + o : 0;
    const A = s === 1,
      l = A ? -1 : 1,
      c = hm(e, r, this.demoTimers[r], A),
      h = hm(e, 1 - r, this.demoTimers[1 - r], A),
      d = new Float32Array([
        l * e[STATE_LAYOUT.BALL],
        l * e[STATE_LAYOUT.BALL + 1],
        e[STATE_LAYOUT.BALL + 2],
        l * e[STATE_LAYOUT.BALL + 12],
        l * e[STATE_LAYOUT.BALL + 13],
        e[STATE_LAYOUT.BALL + 14],
        l * e[STATE_LAYOUT.BALL + 15],
        l * e[STATE_LAYOUT.BALL + 16],
        e[STATE_LAYOUT.BALL + 17],
      ]),
      u = new Float32Array(34);
    t.forEach((m, y) => {
      u[A ? 33 - y : y] =
        e[ro + y * 2] > 0
          ? 0
          : Math.max(0, (m.isBig ? 10 : 4) - e[ro + y * 2 + 1]);
    });
    const p = MA(c[6], c[7], c[8]),
      v = MA(h[6], h[7], h[8]);
    return {
      observation: {
        data: new Float32Array([
          ...c,
          ...h,
          ...u,
          ...d,
          ...Cs(c, 0, h, 0),
          ...Cs(c, 6, h, 6),
          ...Cs(c, 0, d, 0),
          ...Cs(c, 6, d, 3),
          ...Cs(h, 0, d, 0),
          ...Cs(h, 6, d, 3),
          ...Array.from(u, (m) => +(m === 0)),
          +(c[12] === 0),
          +(h[12] === 0),
          p,
          +(p >= 2200),
          v,
          +(v >= 2200),
          MA(d[3], d[4], d[5]),
          ...YM(n),
        ]),
        dims: [1, 159],
      },
      hidden: { data: this.hidden.slice(), dims: [1, 1, 512] },
      cell: { data: this.cell.slice(), dims: [1, 1, 512] },
    };
  }
  decode(e) {
    const { logits: t, hidden_out: n, cell_out: r } = e;
    if (
      (t == null ? void 0 : t.length) !== 22 ||
      (n == null ? void 0 : n.length) !== 512 ||
      (r == null ? void 0 : r.length) !== 512 ||
      ![t, n, r].every((o) => o.every(Number.isFinite))
    )
      throw new Error("Seer returned invalid policy outputs.");
    let s = 0;
    const a = yg.map((o) => {
      let A = 0;
      for (let l = 1; l < o; l++) t[s + l] > t[s + A] && (A = l);
      return ((s += o), A);
    });
    return (
      (this.hidden = new Float32Array(n)),
      (this.cell = new Float32Array(r)),
      {
        throttle: a[0] - 1,
        steer: a[1] * 0.5 - 1,
        pitch: a[2] * 0.5 - 1,
        yaw: a[1] * 0.5 - 1,
        roll: a[3] - 1,
        jump: a[4] > 0,
        boost: a[5] > 0,
        handbrake: a[6] > 0,
      }
    );
  }
  reset() {
    (this.hidden.fill(0),
      this.cell.fill(0),
      (this.demoTimers = [0, 0]),
      (this.lastTick = null));
  }
}

export { SeerAgent };
