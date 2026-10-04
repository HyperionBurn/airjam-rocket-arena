import { F, mt } from "../vendor/three.js";

function Rs(i, e, t, n) {
  return i.set(e, n, t);
}

const sp = new F();

const ap = new F();

const op = new F();

const Ap = new mt();

function lp(i, e, t) {
  return (
    Rs(sp, e[t], e[t + 1], e[t + 2]),
    Rs(ap, e[t + 3], e[t + 4], e[t + 5]),
    Rs(op, e[t + 6], e[t + 7], e[t + 8]),
    Ap.makeBasis(sp, op, ap),
    i.setFromRotationMatrix(Ap)
  );
}

export { Rs, lp };
