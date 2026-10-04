import { F, jn } from "../vendor/three.js";
import { A1, a1, ig, s1 } from "./body.js";

const cp = new jn();

const sA = new F();

const pc = new F();

const hp = 0.01;

const l1 = 0.4;

const c1 = 8;

function resolveWheelVisualHeight(onGround, wheelContact, suspensionLength, connectionHeight, restHeight) {
  return onGround && wheelContact && Number.isFinite(suspensionLength)
    ? connectionHeight - suspensionLength
    : restHeight;
}

function h1(i, e, t, n, r) {
  (cp.copy(i).invert(), sA.set(0, 1, 0).applyQuaternion(cp));
  const s = sA.x,
    a = sA.y,
    o = sA.z;
  let A = r.rollAngle,
    l = r.cradleAngle;
  for (let m = 0; m < 4; m++) {
    const y = Math.cos(A),
      C = Math.sin(A),
      E = Math.cos(l),
      S = -Math.sin(l),
      k = E * y,
      x = E * C,
      T = s - S,
      R = a - k,
      D = o - x,
      N = -x,
      X = k,
      Y = -C * x - y * k,
      H = y * S,
      V = C * S,
      J = N * N + X * X,
      ne = J + hp + l1 * (1 - J),
      le = Y * Y + H * H + V * V + hp,
      je = N * H + X * V,
      de = N * R + X * D,
      pe = Y * T + H * R + V * D,
      Se = ne * le - je * je || 1e-9;
    ((A += (le * de - je * pe) / Se), (l += (ne * pe - je * de) / Se));
  }
  const c = c1 * n,
    h = Math.max(-c, Math.min(c, A - r.rollAngle));
  ((r.rollAngle += h),
    (r.cradleAngle = l),
    (r.rollRing.rotation.x = r.rollAngle),
    (r.cradle.rotation.z = l));
  const d = Math.cos(r.cradleAngle),
    u = Math.sin(r.cradleAngle);
  pc.set(
    d,
    Math.cos(r.rollAngle) * u,
    Math.sin(r.rollAngle) * u,
  ).applyQuaternion(i);
  const p = Math.atan2(pc.z, pc.x);
  Number.isNaN(r.seatHeading) && (r.seatHeading = p);
  const g = Math.hypot(e, t) > s1 ? Math.atan2(t, e) : r.seatHeading;
  ((r.seatHeading = A1(r.seatHeading, g, a1 * n)),
    (r.seat.rotation.y = ig(p - r.seatHeading)));
}

export { h1, resolveWheelVisualHeight };
