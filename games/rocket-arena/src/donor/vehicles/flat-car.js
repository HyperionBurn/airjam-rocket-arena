import { PEARL_COLORS } from "../materials/pearl.js";
import { F, dt } from "../vendor/three.js";
import { ho } from "../vendor/gltf-loader.js";
import { $0 } from "./mesh-utils.js";

const $d = PEARL_COLORS.blue;

const Qb = { length: 130.427, width: 85.7799, height: 33.8, forward: 9, up: 15.75 };

const e1 = 15.75;

const X0 = [
    [50.3, 31.1, 12],
    [50.3, -31.1, 12],
    [-34.75, 33, 13.5],
    [-34.75, -33, 13.5],
  ];

const J0 = [-6.2, -6.2, -6.1, -6.1];

const t1 = [
    new F(-57.16878128051758, 9.5, 5.489756107330322),
    new F(-57.16878128051758, 9.5, -5.489756107330322),
  ];

const K0 = [
    "wheel-front-right",
    "wheel-front-left",
    "wheel-rear-right",
    "wheel-rear-left",
  ];

let pa = null;

function Y0() {
  return (
    pa ||
    ((pa = new ho()
      .loadAsync("/assets/flat-car/model.glb")
      .then(({ scene: i }) => {
        const e = (t) => {
          const n = i.getObjectByName(t);
          if (!n) throw new Error(`Flat Car asset is missing ${t}`);
          return n;
        };
        return { body: e("flat-car-body"), wheels: K0.map(e) };
      })
      .catch((i) => {
        throw ((pa = null), i);
      })),
    pa)
  );
}

function Z0(i, e) {
  const t = new dt();
  return (
    (t.name = "flat-car"),
    t.scale.setScalar(100),
    t.add($0(i.body, e, $d)),
    t
  );
}

function Q0(i, e, t) {
  const n = new dt();
  ((n.name = K0[e]), n.scale.setScalar(100));
  const r = $0(i.wheels[e], t, $d);
  return (r.position.set(0, 0, 0), n.add(r), n);
}

export { $d, J0, Q0, Qb, X0, Y0, Z0, e1, t1 };
