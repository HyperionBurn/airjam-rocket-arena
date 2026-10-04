import { Ee, dt } from "../vendor/three.js";
import { Ji } from "../rendering/theme-materials.js";
import { G0, H0, Ir, O0, U0 } from "./rocket-hatch.js";
import { ul } from "./paint.js";

function ip(i, e) {
  switch (i.name) {
    case "wheel-metal":
      return e.wheelMetal;
    case "tire":
      return e.tire;
    case "lower-detail":
      return e.lowerDetail;
    case "lamps":
      return e.lamps;
    case "tail-lamps":
      return e.tailLamps;
    case "body-shell":
      return e.shell;
    case "body-fill":
      return e.body;
    case "paint":
      return e.body;
    case "glass":
      return e.glass;
    default:
      return e.lowerDetail;
  }
}

function fl(i, e) {
  (i.traverse((t) => {
    t instanceof Ee &&
      ((t.material = Array.isArray(t.material)
        ? t.material.map((n) => ip(n, e))
        : ip(t.material, e)),
      (t.castShadow = !0),
      (t.receiveShadow = !0));
  }),
    Ji(i));
}

function $0(i, e, t) {
  const n = i.clone(!0);
  return (fl(n, ul(e, t)), n);
}

function z0(i, e, t) {
  const n = new dt();
  ((n.name = "game-car"), n.scale.setScalar(Ir));
  const r = new dt();
  ((r.name = "game-car-shell"),
    (r.scale.x = G0),
    r.position.set(O0 / Ir, H0 / Ir, 0));
  const s = i.body.clone(!0),
    a = ul(e, t);
  return (fl(s, a), r.add(s), n.add(r), n);
}

function V0(i, e, t) {
  const n = new dt();
  ((n.name = U0[e]), n.scale.setScalar(Ir));
  const r = i.wheels[e].clone(!0);
  return (r.position.set(0, 0, 0), fl(r, ul()), n.add(r), n);
}

function W0(i, e, t) {
  const n = i.wheelHardware[e].clone(!0);
  return (fl(n, ul()), n);
}

export { $0, V0, W0, z0 };
