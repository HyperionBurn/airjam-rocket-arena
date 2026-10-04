import { Ae, Cn, Ct, Ee, F, Gt, Oi, Tn, Ur, Ut, Xt, dt, lt, zi } from "../vendor/three.js";
import { CA, Vd, eg, ng, tg, xA, zd } from "./body.js";

const zA = 17;

const VA = [
    [63.88, 34, 13],
    [63.88, -34, 13],
    [-36.12, 34, 16],
    [-36.12, -34, 16],
  ];

const Wd = 16;

function dp(i, e) {
  if (e <= i[0].x) return i[0].clone();
  for (let t = 1; t < i.length; t++)
    if (e <= i[t].x)
      return i[t - 1]
        .clone()
        .lerp(i[t], (e - i[t - 1].x) / (i[t].x - i[t - 1].x));
  return i[i.length - 1].clone();
}

function sg(i, e = {}) {
  const t = {
      length: eg,
      width: tg,
      height: ng,
      centerForward: zd,
      centerUp: Vd,
      gimbalCenter: new F(xA, CA, 0),
      wheels: VA,
      tireWidth: Wd,
      roofWidth: 0.82,
      roofLength: 0.43,
      ...e,
    },
    { length: n, width: r, height: s, centerForward: a, centerUp: o } = t,
    A = t.gimbalCenter.x,
    l = t.gimbalCenter.y,
    c = o - s / 2,
    h = o + s / 2,
    d = Math.min(r, s) * 0.029,
    u = new dt();
  u.name = "procedural-buggy-frame";
  const p = new lt({ color: 7634824, roughness: 0.36, metalness: 0.82 }),
    v = new Cn({ color: i, roughness: 0.31, metalness: 0.55, clearcoat: 0.7 }),
    g = new lt({ color: 1121060, roughness: 0.46, metalness: 0.5, side: Ut }),
    m = new lt({ color: 11648453, roughness: 0.28, metalness: 0.9 }),
    y = new lt({ color: 9789486, roughness: 0.4, metalness: 0.7 }),
    C = new lt({
      color: 13625075,
      emissive: 14282239,
      emissiveIntensity: 2.3,
      roughness: 0.22,
    }),
    E = new F(0, 1, 0),
    w = (te, G, Ge) => new F(te, G, Ge),
    S = (te, G, Ge = p, $e = d, I = "chassis-tube") => {
      const b = G.clone().sub(te),
        q = b.length();
      if (q < 1e-5) return;
      const K = new Ee(new Xt($e, $e, q, 12), Ge);
      ((K.name = I),
        K.position.copy(te).add(G).multiplyScalar(0.5),
        K.quaternion.setFromUnitVectors(E, b.normalize()),
        (K.castShadow = !0),
        u.add(K),
        (K.userData.endpoints = [te.toArray(), G.toArray()]));
    },
    k = (te, G, Ge) => {
      const $e = new Ct().setFromPoints(G),
        I = [];
      for (let q = 1; q < G.length - 1; q++) I.push(0, q, q + 1);
      ($e.setIndex(I), $e.computeVertexNormals());
      const b = new Ee($e, Ge);
      ((b.name = te), (b.castShadow = !0), (b.receiveShadow = !0), u.add(b));
    },
    x = (te, G) => {
      const Ge = new Ee(new Xt(d * 0.32, d * 0.32, d * 0.4, 6), m);
      ((Ge.name = "chassis-fastener"),
        Ge.position.copy(te),
        Ge.quaternion.setFromUnitVectors(E, G),
        u.add(Ge));
    },
    T = a + n * 0.5,
    R = a - n * 0.608,
    D = A + n * 0.27,
    N = A - n * 0.3,
    X = A - n * 0.27,
    Y = X + n * t.roofLength,
    H = Math.max(r * 0.274, 22 + d * 1.4),
    V = r * 0.5 * t.roofWidth,
    J = V * 0.94,
    ne = Math.max(...t.wheels.map((te) => te[0])),
    le = Math.min(...t.wheels.map((te) => te[0])),
    je = (te) =>
      Math.min(
        ...t.wheels
          .filter((G) => Math.abs(G[0] - te) < 0.001)
          .map((G) => Math.abs(G[1])),
      ) -
      t.tireWidth * 0.99,
    de = h - s * 0.025,
    pe = c + s * 0.5,
    Se = r * 0.16,
    gt = (te) => Gt.lerp(de, pe, (te - Y) / (T - Y)),
    ct = (te) => Gt.lerp(J, Se, (te - Y) / (T - Y)),
    oe = (te, G) =>
      w(R, c + s * 0.54, te * r * 0.29).lerp(
        w(X, h, te * V),
        (G - R) / (X - R),
      ),
    xe = new Map(),
    ge = (te, G, Ge = v, $e = d) => {
      for (let I = 1; I < te.length; I++) S(te[I - 1], te[I], Ge, $e, G);
      for (const I of te.slice(1, -1)) {
        const b = new Ee(new Ur($e, 12, 8), Ge);
        (b.position.copy(I),
          (b.name = G + "-bend"),
          (b.castShadow = !0),
          u.add(b));
      }
    };
  for (const te of [-1, 1]) {
    const G = [
        w(R, c + s * 0.06, te * r * 0.18),
        w(le, c, te * je(le)),
        w(N, c, te * H),
        w(D, c, te * H),
        w(ne, c, te * je(ne)),
        w(T, c + s * 0.12, te * Se),
      ],
      Ge = [
        oe(te, R),
        oe(te, le),
        w(X, h, te * V),
        w(Y, de, te * J),
        w(D, gt(D), te * ct(D)),
        w(ne, gt(ne), te * ct(ne)),
        w(T, pe, te * Se),
      ];
    (xe.set(te, { bottom: G, top: Ge }),
      ge(G, "lower-longeron"),
      ge(Ge, "swept-upper-longeron"));
    const $e = w(N, c + s * 0.7, te * H);
    (ge([G[2], $e, Ge[2]], "rear-cage-pillar", p, d * 0.92),
      S(G[3], Ge[4], p, d * 0.92, "front-cage-pillar"),
      S(G[0], Ge[0], p, d * 0.92, "tail-upright"),
      S(G[5], Ge[6], p, d * 0.92, "nose-upright"),
      S(G[2], Ge[4], p, d * 0.72, "door-diagonal"),
      S(G[0], $e, p, d * 0.75, "rear-bay-diagonal"),
      S(G[3], Ge[6], p, d * 0.75, "front-bay-diagonal"));
    const I = G.map((b) => b.clone().add(w(0, d * 1.5, -te * d * 0.65)));
    for (let b = 1; b < I.length; b++)
      S(I[b - 1], I[b], y, d * 0.19, "frame-pressure-line");
  }
  const qe = xe.get(-1),
    Xe = xe.get(1),
    We = (te, G) => dp(xe.get(Math.sign(te)).bottom, G),
    ft = (te, G) => dp(xe.get(Math.sign(te)).top, G);
  for (let te = 0; te < qe.bottom.length; te++) S(qe.bottom[te], Xe.bottom[te]);
  for (const te of [0, 1, 2, 3, 5, 6])
    S(
      qe.top[te],
      Xe.top[te],
      te === 2 || te === 3 ? v : p,
      d,
      te === 1 || te === 5 ? "shock-tower-crossmember" : "cage-crossmember",
    );
  const st = t.wheels.map(([te, G]) => {
      const Ge = Math.sign(G),
        $e = ft(Ge, te),
        I = w(te, $e.y, Ge * Math.min(je(te), Math.abs($e.z) - d * 1.2)),
        b = Math.min(n * 0.075, (ne - le) * 0.11),
        q = We(Ge, te + b),
        K = We(Ge, te - b);
      (S(q, I, p, d * 0.9, "shock-tower-forward-leg"),
        S(K, I, p, d * 0.9, "shock-tower-rear-leg"),
        k(
          "shock-tower-gusset",
          [
            I.clone().add(w(0, -d, 0)),
            I.clone().lerp(q, 0.2),
            I.clone().lerp(K, 0.2),
          ],
          g,
        ));
      const ie = new Ee(new zi(d * 1.2, d * 0.38, 8, 20), m);
      return (
        (ie.name = "shock-mount-eye"),
        ie.position.copy(I),
        u.add(ie),
        x(I, w(0, 0, Ge)),
        {
          top: I,
          foreRoot: q,
          aftRoot: K,
          innerZ: Ge * (Math.abs(G) - t.tireWidth * 0.8),
        }
      );
    }),
    ue = A + n * 0.21,
    _e = A - n * 0.21,
    ve = Math.min(Y, -X) - d * 1.6,
    Me = (te, G) => {
      const Ge = w(G, h, te * V);
      return (S(ft(te, G), Ge, p, d * 0.65, "upper-jet-standoff"), Ge);
    },
    Be = {
      roll: { fP: Me(1, ve), fN: Me(-1, ve), bP: Me(1, -ve), bN: Me(-1, -ve) },
      yaw: { fP: We(1, ue), fN: We(-1, ue), bP: We(1, _e), bN: We(-1, _e) },
      pitchFront: [qe.top[6].clone(), Xe.top[6].clone()],
      pitchBack: [qe.top[0].clone(), Xe.top[0].clone()],
      jump: w(A, l - 22, 0),
    };
  for (const te of [...Object.values(Be.roll), ...Object.values(Be.yaw)]) {
    const G = Math.sign(te.z);
    (S(te.clone().add(w(0, 0, -G * d)), te, g, d * 1.15, "rcs-mount-pad"),
      x(te.clone().add(w(0, 0, -G * d * 1.2)), w(0, 0, G)));
  }
  const Ze = (te) => {
    const G = te - A,
      Ge = c - l,
      $e = G * G + Ge * Ge,
      I = 22,
      b = (I * I) / $e,
      q = (I * Math.sqrt(Math.max(0, $e - I * I))) / $e,
      K = w(A + b * G - q * Ge, l + b * Ge + q * G, 0),
      ie = w(A + b * G + q * Ge, l + b * Ge - q * G, 0);
    return K.y < ie.y ? K : ie;
  };
  (S(w(D, c, 0), Ze(D)), S(w(N, c, 0), Ze(N)));
  for (const te of [-1, 1]) {
    const G = ft(te, T),
      Ge = new Ee(new Tn(n * 0.024, s * 0.12, r * 0.052), g);
    (Ge.position.copy(G).add(w(-d, -d, -te * d)),
      (Ge.name = "nose-light-pod"),
      u.add(Ge));
    for (const $e of [-0.9, 0.9])
      for (const I of [-1, 1]) {
        const b = new Ee(new Tn(0.7, 1.35, 1.4), C);
        (b.position.copy(Ge.position).add(w(n * 0.013, $e, I)), u.add(b));
      }
  }
  const He = w(R + n * 0.145, c + s * 0.35, 0),
    At = w(R - 11, He.y, 0);
  return (
    d1(u, R, i, He.y),
    {
      group: u,
      railBottom: We,
      railTop: ft,
      suspension: st,
      jets: Be,
      powertrainMount: He,
      boostOutlet: At,
      stations: { nose: T, front: D, rear: N, tail: R },
      bellyMount: Be.jump,
    }
  );
}

function d1(i, e, t, n) {
  const r = new lt({ color: 2567220, roughness: 0.28, metalness: 0.95 }),
    s = new lt({ color: 3159615, roughness: 0.22, metalness: 1, side: Ut }),
    a = new lt({ color: t, roughness: 0.3, metalness: 0.7 }),
    o = new Ee(new Xt(1, 1, 26.6, 12), r);
  (o.position.set(e, n - 0.3, 0), (o.castShadow = !0));
  const A = new Ee(new Xt(3.4, 3.9, 8, 18), r);
  ((A.rotation.z = Math.PI / 2),
    A.position.set(e - 2, n, 0),
    (A.castShadow = !0));
  const l = new Ee(new zi(3.7, 0.55, 10, 24), a);
  ((l.rotation.y = Math.PI / 2), l.position.set(e - 5.8, n, 0));
  const c = new Ee(
    new Oi(
      [
        new Ae(1.7, 0),
        new Ae(2, 0.9),
        new Ae(2.9, 2.7),
        new Ae(3.9, 4.5),
        new Ae(4.7, 5.6),
      ],
      22,
    ),
    s,
  );
  ((c.rotation.z = Math.PI / 2),
    c.position.set(e - 6, n, 0),
    (c.castShadow = !0),
    i.add(o, A, l, c));
}

export { VA, Wd, sg, zA };
