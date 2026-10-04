import { Ee } from "../vendor/three.js";
import { ho } from "../vendor/gltf-loader.js";

const ag = [
  "frame-details",
  "fixed-details",
  "roll-details",
  "cradle-details",
  "seat-details",
];

let ma = null;

function og() {
  return (
    ma ||
    ((ma = new ho()
      .loadAsync("/assets/realistic-car/details.glb")
      .then(({ scene: i }) => {
        const e = {};
        for (const t of ag) {
          const n = i.getObjectByName(t);
          if (!n) throw new Error(`Realistic car asset is missing ${t}`);
          e[t] = n;
        }
        return e;
      })
      .catch((i) => {
        throw ((ma = null), i);
      })),
    ma)
  );
}

function Ag(i, e, t, n) {
  const r = {
      "frame-details": e.group,
      "fixed-details": t.visual,
      "roll-details": t.rollRing,
      "cradle-details": t.cradle,
      "seat-details": t.seat,
    },
    s = new Map(),
    a = (o) => {
      if (o.name !== "realistic-team") return o;
      let A = s.get(o);
      return (A || ((A = o.clone()), A.color.setHex(n), s.set(o, A)), A);
    };
  for (const o of ag) {
    const A = i[o].clone(!0);
    (o === "frame-details" && A.position.copy(e.powertrainMount),
      (o === "roll-details" ||
        o === "cradle-details" ||
        o === "seat-details") &&
        A.position.set(0, 0, 0),
      A.traverse((l) => {
        l instanceof Ee &&
          ((l.castShadow = !0),
          (l.receiveShadow = !0),
          (l.material = Array.isArray(l.material)
            ? l.material.map(a)
            : a(l.material)));
      }),
      r[o].add(A));
  }
}

export { Ag, og };
