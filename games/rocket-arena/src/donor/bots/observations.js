import { CAR_STATE, CAR_STATE_STRIDE, STATE_LAYOUT, ro } from "../physics/state-layout.js";
import { Eg, wA } from "./actions.js";

function WM(i, e, t, n, r) {
  if (i[STATE_LAYOUT.NUM_CARS] !== 2 || e.length !== 34 || (n !== 0 && n !== 1))
    throw new Error(
      "This policy requires two cars and the standard 34-pad arena.",
    );
  const s = new Float64Array(37 * 24);
  [n, 1 - n].forEach((u, p) => {
    const v = STATE_LAYOUT.CARS + u * CAR_STATE_STRIDE,
      g = p * 24;
    ((s[g] = +(p === 0)), (s[g + 1] = +(p === 0)), (s[g + 2] = +(p !== 0)));
    for (let m = 0; m < 3; m++)
      ((s[g + 5 + m] = i[v + CAR_STATE.POS + m]),
        (s[g + 8 + m] = i[v + CAR_STATE.VEL + m]),
        (s[g + 11 + m] = i[v + CAR_STATE.FWD + m]),
        (s[g + 14 + m] = i[v + CAR_STATE.UP + m]),
        (s[g + 17 + m] = i[v + CAR_STATE.ANG_VEL + m]));
    ((s[g + 20] = i[v + CAR_STATE.BOOST] / 100),
      (s[g + 21] = i[v + CAR_STATE.DEMOED]),
      (s[g + 22] = i[v + CAR_STATE.ON_GROUND]),
      (s[g + 23] = i[v + CAR_STATE.HAS_FLIP_OR_JUMP]));
  });
  const o = 2 * 24;
  s[o + 3] = 1;
  for (let u = 0; u < 3; u++)
    ((s[o + 5 + u] = i[STATE_LAYOUT.BALL + u]),
      (s[o + 8 + u] = i[STATE_LAYOUT.BALL + 12 + u]),
      (s[o + 17 + u] = i[STATE_LAYOUT.BALL + 15 + u]));
  e.forEach((u, p) => {
    const v = (p + 3) * 24;
    ((s[v + 4] = 1),
      s.set(u.pos, v + 5),
      (s[v + 20] = u.isBig ? 1 : 0.12),
      (s[v + 21] = i[ro + p * 2]));
  });
  for (let u = 0; u < 37; u++) {
    const p = u * 24;
    for (let v = 5; v < 20; v++)
      (r === 1 && (v - 5) % 3 !== 2 && (s[p + v] *= -1),
        v < 11 && (s[p + v] /= 2300),
        v >= 17 && (s[p + v] /= 5.5));
  }
  const A = new Float32Array(32);
  (A.set(s.subarray(0, 24)), A.set(Eg(t), 24));
  const l = Math.atan2(s[11], s[12]),
    c = Math.cos(l),
    h = Math.sin(l),
    d = s.slice(5, 8);
  for (let u = 0; u < 37; u++) {
    const p = u * 24;
    for (let v = 0; v < 3; v++) s[p + 5 + v] -= d[v];
    for (let v = 5; v < 20; v += 3) {
      const g = s[p + v],
        m = s[p + v + 1];
      ((s[p + v] = c * g - h * m), (s[p + v + 1] = h * g + c * m));
    }
  }
  return {
    query: A,
    entities: new Float32Array(s),
    mask: new Float32Array(37),
  };
}

function XM(i, e) {
  if (e < 0 || e >= 168 || i[STATE_LAYOUT.BALL + 1] !== 0) return null;
  const t = { ...wA, throttle: 1 };
  return (
    e < 44
      ? (t.boost = !0)
      : e < 60
        ? ((t.boost = !0), (t.steer = -1))
        : e < 68
          ? ((t.boost = !0), (t.jump = !0))
          : e < 72
            ? (t.boost = !0)
            : e < 76
              ? ((t.boost = !0), (t.jump = !0), (t.yaw = 0.8), (t.pitch = -0.7))
              : e < 128
                ? ((t.boost = !0), (t.pitch = 1))
                : ((t.roll = 1), (t.pitch = 0.5)),
    t
  );
}

function lm(i) {
  return {
    query: { data: i.query, dims: [1, 1, 32] },
    entities: { data: i.entities, dims: [1, 37, 24] },
    mask: { data: i.mask, dims: [1, 37] },
  };
}

export { WM, XM, lm };
