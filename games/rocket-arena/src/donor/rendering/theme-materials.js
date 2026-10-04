import { Cn, Ee, Pj, QA, Qt, Yt, lt, nl } from "../vendor/three.js";
import { getTheme, subscribeTheme } from "./theme.js";

const $A = new WeakMap();

const Hh = new Set();

const tp = new WeakSet();

function vn(i, e) {
  const t = { arcade: i, realistic: e };
  return ($A.set(i, t), $A.set(e, t), t[getTheme()]);
}

function Vi(i, e) {
  var t;
  return ((t = $A.get(i)) == null ? void 0 : t[e]) ?? i;
}

function F0(i) {
  return $A.has(i);
}

function D0(i, e) {
  if (!Array.isArray(i)) return Vi(i, e);
  for (let t = 0; t < i.length; t++) i[t] = Vi(i[t], e);
  return i;
}

function Ji(i) {
  i.traverse((e) => {
    !(e instanceof Ee) ||
      tp.has(e) ||
      !(Array.isArray(e.material) ? e.material : [e.material]).some(F0) ||
      (tp.add(e), Hh.add(new WeakRef(e)), (e.material = D0(e.material, getTheme())));
  });
}

subscribeTheme((i) => {
  for (const e of Hh) {
    const t = e.deref();
    t ? (t.material = D0(t.material, i)) : Hh.delete(e);
  }
});

const $s = new nl(new Uint8Array([28, 90, 170, 255]), 4, 1, QA);

$s.name = "Arcade / painted light ramp";

$s.minFilter = $s.magFilter = Yt;

$s.generateMipmaps = !1;

$s.needsUpdate = !0;

function Nr(i) {
  return new Pj({ ...i, gradientMap: $s });
}

function N0(i) {
  const e = (t) => {
    if (t.userData?.preserveAuthoredMaterial) return t;
    if (F0(t)) return Vi(t, getTheme());
    if (
      !(t instanceof lt) ||
      t.transparent ||
      (t instanceof Cn && t.transmission > 0) ||
      t.onBeforeCompile !== Qt.prototype.onBeforeCompile
    )
      return t;
    const n = Nr({});
    return (
      Qt.prototype.copy.call(n, t),
      n.color.copy(t.color),
      n.emissive.copy(t.emissive),
      (n.emissiveIntensity = t.emissiveIntensity),
      (n.map = t.map),
      (n.alphaMap = t.alphaMap),
      (n.aoMap = t.aoMap),
      (n.aoMapIntensity = t.aoMapIntensity),
      (n.lightMap = t.lightMap),
      (n.lightMapIntensity = t.lightMapIntensity),
      (n.emissiveMap = t.emissiveMap),
      (n.normalMap = t.normalMap),
      (n.normalMapType = t.normalMapType),
      n.normalScale.copy(t.normalScale).multiplyScalar(0.2),
      Object.assign(n, { flatShading: t.flatShading }),
      (n.fog = t.fog),
      (n.wireframe = t.wireframe),
      (n.wireframeLinewidth = t.wireframeLinewidth),
      vn(n, t)
    );
  };
  (i.traverse((t) => {
    t instanceof Ee &&
      (t.material = Array.isArray(t.material)
        ? t.material.map(e)
        : e(t.material));
  }),
    Ji(i));
}

export { Ji, N0, Nr, Vi, vn };
