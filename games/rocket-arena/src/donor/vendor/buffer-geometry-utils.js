// Preserved bundled dependency. See SOURCE.md and public/licenses/.
import { Cm, Ct, Kg, bh, zt } from "./three.js";

function hl(i, e = !1) {
  const t = i[0].index !== null,
    n = new Set(Object.keys(i[0].attributes)),
    r = new Set(Object.keys(i[0].morphAttributes)),
    s = {},
    a = {},
    o = i[0].morphTargetsRelative,
    A = new Ct();
  let l = 0;
  for (let c = 0; c < i.length; ++c) {
    const h = i[c];
    let d = 0;
    if (t !== (h.index !== null))
      return (
        console.error(
          "THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " +
            c +
            ". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them.",
        ),
        null
      );
    for (const u in h.attributes) {
      if (!n.has(u))
        return (
          console.error(
            "THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " +
              c +
              '. All geometries must have compatible attributes; make sure "' +
              u +
              '" attribute exists among all geometries, or in none of them.',
          ),
          null
        );
      (s[u] === void 0 && (s[u] = []), s[u].push(h.attributes[u]), d++);
    }
    if (d !== n.size)
      return (
        console.error(
          "THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " +
            c +
            ". Make sure all geometries have the same number of attributes.",
        ),
        null
      );
    if (o !== h.morphTargetsRelative)
      return (
        console.error(
          "THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " +
            c +
            ". .morphTargetsRelative must be consistent throughout all geometries.",
        ),
        null
      );
    for (const u in h.morphAttributes) {
      if (!r.has(u))
        return (
          console.error(
            "THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " +
              c +
              ".  .morphAttributes must be consistent throughout all geometries.",
          ),
          null
        );
      (a[u] === void 0 && (a[u] = []), a[u].push(h.morphAttributes[u]));
    }
    if (e) {
      let u;
      if (t) u = h.index.count;
      else if (h.attributes.position !== void 0)
        u = h.attributes.position.count;
      else
        return (
          console.error(
            "THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " +
              c +
              ". The geometry must have either an index or a position attribute",
          ),
          null
        );
      (A.addGroup(l, u, c), (l += u));
    }
  }
  if (t) {
    let c = 0;
    const h = [];
    for (let d = 0; d < i.length; ++d) {
      const u = i[d].index;
      for (let p = 0; p < u.count; ++p) h.push(u.getX(p) + c);
      c += i[d].attributes.position.count;
    }
    A.setIndex(h);
  }
  for (const c in s) {
    const h = Xf(s[c]);
    if (!h)
      return (
        console.error(
          "THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the " +
            c +
            " attribute.",
        ),
        null
      );
    A.setAttribute(c, h);
  }
  for (const c in a) {
    const h = a[c][0].length;
    if (h !== 0) {
      ((A.morphAttributes = A.morphAttributes || {}),
        (A.morphAttributes[c] = []));
      for (let d = 0; d < h; ++d) {
        const u = [];
        for (let v = 0; v < a[c].length; ++v) u.push(a[c][v][d]);
        const p = Xf(u);
        if (!p)
          return (
            console.error(
              "THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the " +
                c +
                " morphAttribute.",
            ),
            null
          );
        A.morphAttributes[c].push(p);
      }
    }
  }
  return A;
}

function Xf(i) {
  let e,
    t,
    n,
    r = -1,
    s = 0;
  for (let l = 0; l < i.length; ++l) {
    const c = i[l];
    if ((e === void 0 && (e = c.array.constructor), e !== c.array.constructor))
      return (
        console.error(
          "THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes.",
        ),
        null
      );
    if ((t === void 0 && (t = c.itemSize), t !== c.itemSize))
      return (
        console.error(
          "THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes.",
        ),
        null
      );
    if ((n === void 0 && (n = c.normalized), n !== c.normalized))
      return (
        console.error(
          "THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes.",
        ),
        null
      );
    if ((r === -1 && (r = c.gpuType), r !== c.gpuType))
      return (
        console.error(
          "THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes.",
        ),
        null
      );
    s += c.count * t;
  }
  const a = new e(s),
    o = new zt(a, t, n);
  let A = 0;
  for (let l = 0; l < i.length; ++l) {
    const c = i[l];
    if (c.isInterleavedBufferAttribute) {
      const h = A / t;
      for (let d = 0, u = c.count; d < u; d++)
        for (let p = 0; p < t; p++) {
          const v = c.getComponent(d, p);
          o.setComponent(d + h, p, v);
        }
    } else a.set(c.array, A);
    A += c.count * t;
  }
  return (r !== void 0 && (o.gpuType = r), o);
}

function hb(i, e = 1e-4) {
  e = Math.max(e, Number.EPSILON);
  const t = {},
    n = i.getIndex(),
    r = i.getAttribute("position"),
    s = n ? n.count : r.count;
  let a = 0;
  const o = Object.keys(i.attributes),
    A = {},
    l = {},
    c = [],
    h = ["getX", "getY", "getZ", "getW"],
    d = ["setX", "setY", "setZ", "setW"];
  for (let y = 0, C = o.length; y < C; y++) {
    const E = o[y],
      w = i.attributes[E];
    A[E] = new w.constructor(
      new w.array.constructor(w.count * w.itemSize),
      w.itemSize,
      w.normalized,
    );
    const S = i.morphAttributes[E];
    S &&
      (l[E] || (l[E] = []),
      S.forEach((k, x) => {
        const T = new k.array.constructor(k.count * k.itemSize);
        l[E][x] = new k.constructor(T, k.itemSize, k.normalized);
      }));
  }
  const u = e * 0.5,
    p = Math.log10(1 / e),
    v = Math.pow(10, p),
    g = u * v;
  for (let y = 0; y < s; y++) {
    const C = n ? n.getX(y) : y;
    let E = "";
    for (let w = 0, S = o.length; w < S; w++) {
      const k = o[w],
        x = i.getAttribute(k),
        T = x.itemSize;
      for (let R = 0; R < T; R++) E += `${~~(x[h[R]](C) * v + g)},`;
    }
    if (E in t) c.push(t[E]);
    else {
      for (let w = 0, S = o.length; w < S; w++) {
        const k = o[w],
          x = i.getAttribute(k),
          T = i.morphAttributes[k],
          R = x.itemSize,
          D = A[k],
          N = l[k];
        for (let X = 0; X < R; X++) {
          const Y = h[X],
            H = d[X];
          if ((D[H](a, x[Y](C)), T))
            for (let V = 0, J = T.length; V < J; V++) N[V][H](a, T[V][Y](C));
        }
      }
      ((t[E] = a), c.push(a), a++);
    }
  }
  const m = i.clone();
  for (const y in i.attributes) {
    const C = A[y];
    if (
      (m.setAttribute(
        y,
        new C.constructor(
          C.array.slice(0, a * C.itemSize),
          C.itemSize,
          C.normalized,
        ),
      ),
      y in l)
    )
      for (let E = 0; E < l[y].length; E++) {
        const w = l[y][E];
        m.morphAttributes[y][E] = new w.constructor(
          w.array.slice(0, a * w.itemSize),
          w.itemSize,
          w.normalized,
        );
      }
  }
  return (m.setIndex(c), m);
}

function Jf(i, e) {
  if (e === Kg)
    return (
      console.warn(
        "THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles.",
      ),
      i
    );
  if (e === bh || e === Cm) {
    let t = i.getIndex();
    if (t === null) {
      const a = [],
        o = i.getAttribute("position");
      if (o !== void 0) {
        for (let A = 0; A < o.count; A++) a.push(A);
        (i.setIndex(a), (t = i.getIndex()));
      } else
        return (
          console.error(
            "THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible.",
          ),
          i
        );
    }
    const n = t.count - 2,
      r = [];
    if (e === bh)
      for (let a = 1; a <= n; a++)
        (r.push(t.getX(0)), r.push(t.getX(a)), r.push(t.getX(a + 1)));
    else
      for (let a = 0; a < n; a++)
        a % 2 === 0
          ? (r.push(t.getX(a)), r.push(t.getX(a + 1)), r.push(t.getX(a + 2)))
          : (r.push(t.getX(a + 2)), r.push(t.getX(a + 1)), r.push(t.getX(a)));
    r.length / 3 !== n &&
      console.error(
        "THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.",
      );
    const s = i.clone();
    return (s.setIndex(r), s.clearGroups(), s);
  } else
    return (
      console.error(
        "THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:",
        e,
      ),
      i
    );
}

function db(i) {
  const e = new Map(),
    t = new Map(),
    n = i.clone();
  return (
    T0(i, n, function (r, s) {
      (e.set(s, r), t.set(r, s));
    }),
    n.traverse(function (r) {
      if (!r.isSkinnedMesh) return;
      const s = r,
        a = e.get(r),
        o = a.skeleton.bones;
      ((s.skeleton = a.skeleton.clone()),
        s.bindMatrix.copy(a.bindMatrix),
        (s.skeleton.bones = o.map(function (A) {
          return t.get(A);
        })),
        s.bind(s.skeleton, s.bindMatrix));
    }),
    n
  );
}

function T0(i, e, t) {
  t(i, e);
  for (let n = 0; n < i.children.length; n++)
    T0(i.children[n], e.children[n], t);
}

export { Jf, db, hb, hl };
