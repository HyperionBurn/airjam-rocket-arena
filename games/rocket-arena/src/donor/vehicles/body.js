import { Bd, Ct, Ee, F, Gi, Hs, Ke, Nm, Tn, Ur, Ut, Wa, Xt, dt, lt, zi } from "../vendor/three.js";

const eg = 120.507;

const tg = 86.6994;

const ng = 38.6591;

const zd = 13.8757;

const Vd = 20.755;

const fc = 22;

const i1 = 20;

const xA = zd - 5;

const CA = Vd - 5;

const s1 = 100;

const a1 = 5.5;

function o1(i, e, t, n) {
  const r = new Ee(new Tn(i, e, t), n);
  return ((r.castShadow = !0), r);
}

function rg() {
  const i = new dt(),
    e = new dt();
  ((e.name = "gimbal-cockpit"), i.add(e));
  const t = new lt({ color: 6055024, roughness: 0.24, metalness: 0.95 }),
    n = new lt({ color: 14870252, roughness: 0.12, metalness: 1 }),
    r = new lt({ color: 987670, roughness: 0.6, metalness: 0.15 }),
    s = new lt({ color: 2501428, roughness: 0.8 }),
    a = new Wa(
      new Nm(new Tn(eg, ng, tg)),
      new Gi({
        color: 16777215,
        transparent: !0,
        opacity: 0.9,
        depthTest: !0,
        depthWrite: !1,
      }),
    );
  (a.position.set(zd, Vd, 0),
    (a.renderOrder = 100),
    (a.visible = !1),
    i.add(a));
  const o = new Ee(new zi(fc, 1.15, 12, 72), t);
  ((o.castShadow = !0), o.position.set(xA, CA, 0), e.add(o));
  for (const R of [-1, 1]) {
    const D = new Ee(new Xt(1.4, 1.4, 3, 12), t);
    ((D.rotation.z = Math.PI / 2),
      D.position.set(xA + R * fc, CA, 0),
      e.add(D));
  }
  const A = new dt();
  A.position.set(xA, CA, 0);
  const l = new Ee(new zi(i1, 0.95, 12, 64), t);
  ((l.rotation.x = Math.PI / 2), (l.castShadow = !0), A.add(l));
  for (const R of [-1, 1]) {
    const D = new Ee(new Xt(0.85, 0.85, 6, 12), n);
    ((D.rotation.z = Math.PI / 2),
      D.position.set(R * (fc - 3), 0, 0),
      A.add(D));
  }
  e.add(A);
  const c = new dt();
  c.name = "gimbal-pitch-cradle";
  const h = (R, D, N) => new F(R, D, N),
    d = (R, D, N, X, Y, H = !1) => {
      const V = new Bd(R, H, "centripetal"),
        J = new Ee(new Hs(V, R.length * 7, D, 8, H), N);
      return (
        (J.name = X),
        (J.castShadow = !0),
        Y.add(J),
        (J.userData.path = R.map((ne) => ne.toArray())),
        J
      );
    };
  for (const R of [-1, 1]) {
    const D = new Ee(new Xt(0.85, 0.85, 5.5, 16), n);
    ((D.rotation.x = Math.PI / 2),
      D.position.set(0, 0, R * 17.75),
      (D.name = "pitch-bearing-axle"),
      c.add(D));
    for (const N of [-1, 1])
      d(
        [
          h(0, 0, R * 15.75),
          h(N * 2.1, -3.5, R * 14.1),
          h(N * 3.2, -10.1, R * 12.5),
          h(N * 3.2, -13.8, R * 11.8),
          h(N * 3.2, -14.2, R * 11.4),
          h(N * 3.8, -15.7, R * 7),
        ],
        0.42,
        t,
        "continuous-cradle-fork",
        c,
      );
  }
  for (const R of [-1, 1])
    (d(
      [h(R * 3.8, -15.7, -7), h(R * 3.8, -15.7, 0), h(R * 3.8, -15.7, 7)],
      0.45,
      t,
      "cradle-lower-crossmember",
      c,
    ),
      d([h(R * 3.8, -15.7, 0), h(0, -15.7, 0)], 0.52, t, "swivel-support", c));
  const u = new Ee(new Xt(1.1, 1.25, 5.7, 20), n);
  (u.position.set(0, -11.65, 0),
    (u.name = "seat-swivel-spindle"),
    (u.castShadow = !0),
    c.add(u),
    A.add(c));
  const p = new dt();
  p.name = "gimbal-seat-swivel";
  const v = [
      [3.8, -8.5, 5.1],
      [0, -9, 5.55],
      [-4.8, -8.95, 5.7],
      [-6.6, -6.4, 5.35],
      [-7, -0.5, 5],
      [-7.3, 4.2, 4.25],
      [-7.4, 7, 3],
    ],
    g = [-1, -0.8, 0, 0.8, 1],
    m = [],
    y = [];
  for (let R = 0; R < 2; R++)
    v.forEach(([D, N, X], Y) => {
      g.forEach((H) => {
        const V = Math.pow(Math.abs(H), 4);
        m.push(
          D + (Y > 2 ? V * 1.1 : 0) - R * 0.22,
          N + (Y <= 2 ? V * 0.85 : 0) - R * 0.16,
          H * X,
        );
      });
    });
  const C = v.length * g.length;
  for (let R = 0; R < 2; R++)
    for (let D = 0; D < v.length - 1; D++)
      for (let N = 0; N < g.length - 1; N++) {
        const X = R * C + D * g.length + N,
          Y = X + 1,
          H = Y + g.length,
          V = X + g.length;
        y.push(...(R ? [X, H, Y, X, V, H] : [X, Y, H, X, H, V]));
      }
  const E = [
    0, 1, 2, 3, 4, 9, 14, 19, 24, 29, 34, 33, 32, 31, 30, 25, 20, 15, 10, 5,
  ];
  for (let R = 0; R < E.length; R++) {
    const D = E[R],
      N = E[(R + 1) % E.length];
    y.push(D, N, N + C, D, N + C, D + C);
  }
  const w = new Ct();
  (w.setAttribute("position", new Ke(m, 3)),
    w.setIndex(y),
    w.computeVertexNormals());
  const S = new lt({
      color: 1318180,
      roughness: 0.36,
      metalness: 0.32,
      side: Ut,
    }),
    k = new Ee(w, S);
  ((k.name = "thin-racing-bucket-shell"), (k.castShadow = !0), p.add(k));
  for (const R of [-1, 1])
    d(
      v.map(([D, N, X], Y) =>
        h(D + (Y > 2 ? 1.1 : 0), N + (Y <= 2 ? 0.85 : 0), R * X),
      ),
      0.19,
      r,
      "bucket-edge-bead",
      p,
    );
  const x = (R, D, N, X, Y, H) => {
    const V = new Ee(new Ur(1, 20, 12), s);
    (V.position.set(D, N, 0),
      V.scale.set(X, Y, H),
      (V.name = R),
      (V.castShadow = !0),
      p.add(V));
  };
  (x("seat-pan-padding", -1.2, -8.62, 4.8, 0.42, 4.5),
    x("seat-back-padding", -6.55, -1.8, 0.4, 5.8, 3.75),
    x("seat-head-padding", -6.98, 5.3, 0.34, 1.5, 2.55),
    d(
      [h(0, -8.75, 0), h(0.75, -6.3, 0), h(1.5, -4, 0)],
      0.35,
      t,
      "control-column",
      p,
    ),
    d(
      [
        h(1.5, -4.95, -3.65),
        h(1.5, -4.5, -4.1),
        h(1.5, -2.95, -3.5),
        h(1.5, -2.75, 0),
        h(1.5, -2.95, 3.5),
        h(1.5, -4.5, 4.1),
        h(1.5, -4.95, 3.65),
        h(1.5, -5.1, 0),
      ],
      0.31,
      r,
      "race-control-yoke",
      p,
      !0,
    ));
  const T = o1(0.7, 1.3, 2.4, r);
  return (
    T.position.set(1.5, -4, 0),
    (T.name = "yoke-hub"),
    p.add(T),
    c.add(p),
    {
      root: i,
      visual: e,
      hitbox: a,
      rollRing: A,
      cradle: c,
      seat: p,
      rollAngle: 0,
      cradleAngle: 0,
      seatHeading: NaN,
    }
  );
}

function ig(i) {
  return (
    (i = i % (2 * Math.PI)),
    i > Math.PI ? (i -= 2 * Math.PI) : i < -Math.PI && (i += 2 * Math.PI),
    i
  );
}

function A1(i, e, t) {
  let n = ig(e - i);
  return (n > t ? (n = t) : n < -t && (n = -t), i + n);
}

export { A1, CA, Vd, a1, eg, ig, ng, rg, s1, tg, xA, zd };
