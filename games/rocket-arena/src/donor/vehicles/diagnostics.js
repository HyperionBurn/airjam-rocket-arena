import { Ae, Bd, Ee, F, Hs, Oi, Tn, Ur, Ut, Xt, cn, dt, li, lt, zi } from "../vendor/three.js";
import { hl } from "../vendor/buffer-geometry-utils.js";

const YS = 20.755;

const xn = [3111891, 13857839];

const Wh = new F(-.45, .88, -.65).normalize().multiplyScalar(4950);

const bc = 2048;

const cA = 260;

const Lp = 190;

const XA = Wh.clone().normalize();

const Xh = new F(0, 1, 0).cross(XA).normalize();

const Fp = new F().crossVectors(XA, Xh).normalize();

const pg = new F(0, 1, 0);

const ZS = new F(0, -1, 0);

function Dp(i, e) {
  i.traverse((t) => {
    if (!(t instanceof Ee)) return;
    const n = t.onBeforeShadow.bind(t),
      r = t.onAfterShadow.bind(t);
    let s = !0;
    ((t.onBeforeShadow = (a, o, A, l, c, h, d) => {
      (n(a, o, A, l, c, h, d),
        (s = h.depthWrite),
        l !== e && (h.depthWrite = !1));
    }),
      (t.onAfterShadow = (a, o, A, l, c, h, d) => {
        ((h.depthWrite = s), r(a, o, A, l, c, h, d));
      }));
  });
}

function QS(i, e, t, n, r) {
  const s = Math.ceil(t * 14),
    a = [];
  for (let l = 0; l <= s; l += 1) {
    const c = l / s,
      h = c * t * Math.PI * 2;
    a.push(new F(Math.cos(h) * i, -c * n, Math.sin(h) * i));
  }
  const o = new Hs(new Bd(a), s, e, 6, !1),
    A = new Ee(o, r);
  return ((A.castShadow = !0), A);
}

function mg(i, e, t, n) {
  const r = new dt(),
    s = QS(2.5, 0.45, 8, i, e),
    a = new Ee(new Xt(0.8, 0.8, 1, 10), t),
    o = i * 0.5,
    A = new Ee(new Xt(1.7, 1.7, o, 14), n);
  ((a.castShadow = !0), (A.castShadow = !0));
  const l = new Ee(new Ur(2.1, 12, 8), t),
    c = new Ee(new Ur(2, 12, 8), t);
  return (
    (l.castShadow = !0),
    (c.castShadow = !0),
    (c.position.y = -o / 2),
    A.add(c),
    r.add(s, a, A, l),
    { group: r, spring: s, shaft: a, body: A, built: i, bodyLen: o }
  );
}

function gg(i, e, t) {
  const n = new dt(),
    r = e / 2,
    s = i * 0.58,
    a = [
      new Ae(s, -r),
      new Ae(i * 0.94, -r),
      new Ae(i, -r * 0.55),
      new Ae(i, r * 0.55),
      new Ae(i * 0.94, r),
      new Ae(s, r),
    ],
    o = new Ee(new Oi(a, 36), t.tire),
    A = new Ee(new Xt(s * 0.92, s * 0.92, e * 0.48, 32), t.rim),
    l = new Ee(new Xt(i * 0.2, i * 0.2, e * 0.98, 12), t.accent);
  ((o.castShadow = !0), (A.castShadow = !0), n.add(o, A, l));
  for (const u of [-1, 1]) {
    const p = new Ee(new zi(s + 0.2, 0.65, 8, 32), t.accent);
    ((p.rotation.x = Math.PI / 2), (p.position.y = u * r * 0.94), n.add(p));
    for (let v = 0; v < 8; v++) {
      const g = (v / 8) * Math.PI * 2,
        m = new Ee(new Tn(s * 0.68, 1, i * 0.105), t.rim);
      (m.position.set(
        Math.cos(g) * s * 0.58,
        u * r * 0.86,
        Math.sin(g) * s * 0.58,
      ),
        (m.rotation.y = -g),
        n.add(m));
      const y = new Ee(new Xt(0.36, 0.36, 0.4, 6), t.rim);
      (y.position.set(
        Math.cos(g) * (s + 0.18),
        u * r * 0.99,
        Math.sin(g) * (s + 0.18),
      ),
        n.add(y));
    }
  }
  const c = new Tn(1.4, e * 0.27, i * 0.18);
  for (let u = 0; u < 3; u++)
    for (let p = 0; p < 28; p++) {
      const v = ((p + (u === 1 ? 0.5 : 0)) / 28) * Math.PI * 2,
        g = new Ee(c, t.lug);
      (g.position.set(
        Math.cos(v) * (i - 0.2),
        (u - 1) * e * 0.32,
        Math.sin(v) * (i - 0.2),
      ),
        (g.rotation.y = -v),
        g.rotateX(u === 0 ? -0.24 : 0.24),
        n.add(g));
    }
  const h = new dt();
  h.name = "offroad-wheel";
  const d = new Set();
  for (const u of new Set(Object.values(t))) {
    const p = [];
    for (const m of n.children) {
      const y = m;
      y.material === u &&
        (y.updateMatrix(),
        d.add(y.geometry),
        p.push(y.geometry.clone().applyMatrix4(y.matrix)));
    }
    if (!p.length) continue;
    const v = hl(p);
    if (!v) throw new Error("Could not combine offroad wheel surfaces");
    const g = new Ee(v, u);
    ((g.castShadow = !0), h.add(g));
    for (const m of p) m.dispose();
  }
  for (const u of d) u.dispose();
  return h;
}

function Np(i, e, t) {
  i.position.copy(e).add(t).multiplyScalar(0.5);
  const n = t.clone().sub(e),
    r = n.length();
  (n.divideScalar(r || 1),
    i.quaternion.setFromUnitVectors(pg, n),
    i.scale.set(1, r, 1));
}

function ew(i, e) {
  const t = new F(e.x - i.top.x, e.y - i.top.y, e.z - i.top.z),
    n = t.length();
  (t.divideScalar(n || 1),
    i.group.quaternion.setFromUnitVectors(ZS, t),
    (i.spring.scale.y = n / i.built));
  const r = Math.max(1, n - i.bodyLen * 0.5);
  ((i.shaft.scale.y = r),
    (i.shaft.position.y = -r / 2),
    (i.body.position.y = -(n - i.bodyLen / 2)));
}

function vg(i) {
  const e = new dt();
  e.name = "suspension-knuckle";
  const t = new lt({ color: 10267059, metalness: 0.88, roughness: 0.29 }),
    n = new Ee(new Xt(1.3, 1.3, Math.abs(i), 12), t);
  ((n.rotation.x = Math.PI / 2), (n.position.z = i / 2));
  const r = new Ee(new Ur(1.8, 12, 8), t);
  return (
    (r.position.z = i),
    (n.castShadow = !0),
    (r.castShadow = !0),
    e.add(n, r),
    e
  );
}

const Gp = new F();

const tw = new F(0, 1, 0);

const nw = new cn({
    color: 12575999,
    transparent: !0,
    opacity: 0.8,
    blending: li,
    depthWrite: !1,
  });

const rw = new lt({ color: 2567220, roughness: 0.3, metalness: 0.95, side: Ut });

const iw = new cn({
    color: 16777215,
    transparent: !0,
    opacity: 0.95,
    blending: li,
    depthWrite: !1,
  });

const sw = [
    new Ae(0.9, 0),
    new Ae(1.35, 0.35),
    new Ae(1.05, 0.8),
    new Ae(0.72, 1.4),
    new Ae(0.95, 2.2),
    new Ae(1.5, 3),
    new Ae(1.7, 3.3),
  ];

const Op = [
    new Ae(0.3, 0),
    new Ae(0.42, 0.25),
    new Ae(0.66, 0.5),
    new Ae(1.02, 0.75),
    new Ae(1.55, 1),
  ];

const Hp = 0.22;

function aw(i, e, t, n) {
  const r = new dt();
  (r.position.copy(i),
    Gp.set(e, t, n).normalize(),
    r.quaternion.setFromUnitVectors(tw, Gp));
  const s = new Ee(new Oi(sw, 14), rw);
  s.castShadow = !0;
  const a = new dt();
  a.position.y = 3.3;
  const o = new Ee(new Oi(Op, 12), nw),
    A = new Ee(new Oi(Op, 10), iw);
  return (
    A.scale.set(0.45, 0.85, 0.45),
    a.add(o, A),
    a.scale.set(0, 0, 0),
    r.add(s, a),
    { group: r, flame: a }
  );
}

function jg(i) {
  const e = (n, r, s, a) => {
      const o = aw(n, r, s, a);
      return (
        (o.group.name = "frame-reaction-jet"),
        i.group.add(o.group),
        o.flame
      );
    },
    t = (n) => ({
      fP: e(n.fP, 0, 0, 1),
      fN: e(n.fN, 0, 0, -1),
      bP: e(n.bP, 0, 0, 1),
      bN: e(n.bN, 0, 0, -1),
    });
  return {
    roll: t(i.jets.roll),
    yaw: t(i.jets.yaw),
    pitchFront: i.jets.pitchFront.map((n) => e(n, 0, 1, 0)),
    pitchBack: i.jets.pitchBack.map((n) => e(n, 0, 1, 0)),
    jump: e(i.jets.jump, 0, -1, 0),
  };
}

export { Dp, Fp, Hp, Lp, Np, Wh, XA, Xh, YS, bc, cA, ew, gg, jg, mg, pg, vg, xn };
