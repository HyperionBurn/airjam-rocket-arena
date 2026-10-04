// Preserved bundled dependency. See SOURCE.md and public/licenses/.
import { Ai, Ct, Ee, F, Gi, Ht, Ke, Ne, Pd, Qt, Rj, Wa, Xi, dt, ws } from "./three.js";

const sb = /^[og]\s*(.+)?/;

const ab = /^mtllib /;

const ob = /^usemtl /;

const Ab = /^usemap /;

const $f = /\s+/;

const zf = new F();

const cc = new F();

const Vf = new F();

const Wf = new F();

const Fn = new F();

const nA = new Ne();

function lb() {
  const i = {
    objects: [],
    object: {},
    vertices: [],
    normals: [],
    colors: [],
    uvs: [],
    materials: {},
    materialLibraries: [],
    startObject: function (e, t) {
      if (this.object && this.object.fromDeclaration === !1) {
        ((this.object.name = e), (this.object.fromDeclaration = t !== !1));
        return;
      }
      const n =
        this.object && typeof this.object.currentMaterial == "function"
          ? this.object.currentMaterial()
          : void 0;
      if (
        (this.object &&
          typeof this.object._finalize == "function" &&
          this.object._finalize(!0),
        (this.object = {
          name: e || "",
          fromDeclaration: t !== !1,
          geometry: {
            vertices: [],
            normals: [],
            colors: [],
            uvs: [],
            hasUVIndices: !1,
          },
          materials: [],
          smooth: !0,
          startMaterial: function (r, s) {
            const a = this._finalize(!1);
            a &&
              (a.inherited || a.groupCount <= 0) &&
              this.materials.splice(a.index, 1);
            const o = {
              index: this.materials.length,
              name: r || "",
              mtllib: Array.isArray(s) && s.length > 0 ? s[s.length - 1] : "",
              smooth: a !== void 0 ? a.smooth : this.smooth,
              groupStart: a !== void 0 ? a.groupEnd : 0,
              groupEnd: -1,
              groupCount: -1,
              inherited: !1,
              clone: function (A) {
                const l = {
                  index: typeof A == "number" ? A : this.index,
                  name: this.name,
                  mtllib: this.mtllib,
                  smooth: this.smooth,
                  groupStart: 0,
                  groupEnd: -1,
                  groupCount: -1,
                  inherited: !1,
                };
                return ((l.clone = this.clone.bind(l)), l);
              },
            };
            return (this.materials.push(o), o);
          },
          currentMaterial: function () {
            if (this.materials.length > 0)
              return this.materials[this.materials.length - 1];
          },
          _finalize: function (r) {
            const s = this.currentMaterial();
            if (
              (s &&
                s.groupEnd === -1 &&
                ((s.groupEnd = this.geometry.vertices.length / 3),
                (s.groupCount = s.groupEnd - s.groupStart),
                (s.inherited = !1)),
              r && this.materials.length > 1)
            )
              for (let a = this.materials.length - 1; a >= 0; a--)
                this.materials[a].groupCount <= 0 &&
                  this.materials.splice(a, 1);
            return (
              r &&
                this.materials.length === 0 &&
                this.materials.push({ name: "", smooth: this.smooth }),
              s
            );
          },
        }),
        n && n.name && typeof n.clone == "function")
      ) {
        const r = n.clone(0);
        ((r.inherited = !0), this.object.materials.push(r));
      }
      this.objects.push(this.object);
    },
    finalize: function () {
      this.object &&
        typeof this.object._finalize == "function" &&
        this.object._finalize(!0);
    },
    parseVertexIndex: function (e, t) {
      const n = parseInt(e, 10);
      return (n >= 0 ? n - 1 : n + t / 3) * 3;
    },
    parseNormalIndex: function (e, t) {
      const n = parseInt(e, 10);
      return (n >= 0 ? n - 1 : n + t / 3) * 3;
    },
    parseUVIndex: function (e, t) {
      const n = parseInt(e, 10);
      return (n >= 0 ? n - 1 : n + t / 2) * 2;
    },
    addVertex: function (e, t, n) {
      const r = this.vertices,
        s = this.object.geometry.vertices;
      (s.push(r[e + 0], r[e + 1], r[e + 2]),
        s.push(r[t + 0], r[t + 1], r[t + 2]),
        s.push(r[n + 0], r[n + 1], r[n + 2]));
    },
    addVertexPoint: function (e) {
      const t = this.vertices;
      this.object.geometry.vertices.push(t[e + 0], t[e + 1], t[e + 2]);
    },
    addVertexLine: function (e) {
      const t = this.vertices;
      this.object.geometry.vertices.push(t[e + 0], t[e + 1], t[e + 2]);
    },
    addNormal: function (e, t, n) {
      const r = this.normals,
        s = this.object.geometry.normals;
      (s.push(r[e + 0], r[e + 1], r[e + 2]),
        s.push(r[t + 0], r[t + 1], r[t + 2]),
        s.push(r[n + 0], r[n + 1], r[n + 2]));
    },
    addFaceNormal: function (e, t, n) {
      const r = this.vertices,
        s = this.object.geometry.normals;
      (zf.fromArray(r, e),
        cc.fromArray(r, t),
        Vf.fromArray(r, n),
        Fn.subVectors(Vf, cc),
        Wf.subVectors(zf, cc),
        Fn.cross(Wf),
        Fn.normalize(),
        s.push(Fn.x, Fn.y, Fn.z),
        s.push(Fn.x, Fn.y, Fn.z),
        s.push(Fn.x, Fn.y, Fn.z));
    },
    addColor: function (e, t, n) {
      const r = this.colors,
        s = this.object.geometry.colors;
      (r[e] !== void 0 && s.push(r[e + 0], r[e + 1], r[e + 2]),
        r[t] !== void 0 && s.push(r[t + 0], r[t + 1], r[t + 2]),
        r[n] !== void 0 && s.push(r[n + 0], r[n + 1], r[n + 2]));
    },
    addUV: function (e, t, n) {
      const r = this.uvs,
        s = this.object.geometry.uvs;
      (s.push(r[e + 0], r[e + 1]),
        s.push(r[t + 0], r[t + 1]),
        s.push(r[n + 0], r[n + 1]));
    },
    addDefaultUV: function () {
      const e = this.object.geometry.uvs;
      (e.push(0, 0), e.push(0, 0), e.push(0, 0));
    },
    addUVLine: function (e) {
      const t = this.uvs;
      this.object.geometry.uvs.push(t[e + 0], t[e + 1]);
    },
    addFace: function (e, t, n, r, s, a, o, A, l) {
      const c = this.vertices.length;
      let h = this.parseVertexIndex(e, c),
        d = this.parseVertexIndex(t, c),
        u = this.parseVertexIndex(n, c);
      if (
        (this.addVertex(h, d, u),
        this.addColor(h, d, u),
        o !== void 0 && o !== "")
      ) {
        const p = this.normals.length;
        ((h = this.parseNormalIndex(o, p)),
          (d = this.parseNormalIndex(A, p)),
          (u = this.parseNormalIndex(l, p)),
          this.addNormal(h, d, u));
      } else this.addFaceNormal(h, d, u);
      if (r !== void 0 && r !== "") {
        const p = this.uvs.length;
        ((h = this.parseUVIndex(r, p)),
          (d = this.parseUVIndex(s, p)),
          (u = this.parseUVIndex(a, p)),
          this.addUV(h, d, u),
          (this.object.geometry.hasUVIndices = !0));
      } else this.addDefaultUV();
    },
    addPointGeometry: function (e) {
      this.object.geometry.type = "Points";
      const t = this.vertices.length;
      for (let n = 0, r = e.length; n < r; n++) {
        const s = this.parseVertexIndex(e[n], t);
        (this.addVertexPoint(s), this.addColor(s));
      }
    },
    addLineGeometry: function (e, t) {
      this.object.geometry.type = "Line";
      const n = this.vertices.length,
        r = this.uvs.length;
      for (let s = 0, a = e.length; s < a; s++)
        this.addVertexLine(this.parseVertexIndex(e[s], n));
      for (let s = 0, a = t.length; s < a; s++)
        this.addUVLine(this.parseUVIndex(t[s], r));
    },
  };
  return (i.startObject("", !1), i);
}

class cb extends Xi {
  constructor(e) {
    (super(e), (this.materials = null));
  }
  load(e, t, n, r) {
    const s = this,
      a = new Pd(this.manager);
    (a.setPath(this.path),
      a.setRequestHeader(this.requestHeader),
      a.setWithCredentials(this.withCredentials),
      a.load(
        e,
        function (o) {
          try {
            t(s.parse(o));
          } catch (A) {
            (r ? r(A) : console.error(A), s.manager.itemError(e));
          }
        },
        n,
        r,
      ));
  }
  setMaterials(e) {
    return ((this.materials = e), this);
  }
  parse(e) {
    const t = new lb();
    (e.indexOf(`\r
`) !== -1 &&
      (e = e.replace(
        /\r\n/g,
        `
`,
      )),
      e.indexOf(`\\
`) !== -1 && (e = e.replace(/\\\n/g, "")));
    const n = e.split(`
`);
    let r = [];
    for (let o = 0, A = n.length; o < A; o++) {
      const l = n[o].trimStart();
      if (l.length === 0) continue;
      const c = l.charAt(0);
      if (c !== "#")
        if (c === "v") {
          const h = l.split($f);
          switch (h[0]) {
            case "v":
              (t.vertices.push(
                parseFloat(h[1]),
                parseFloat(h[2]),
                parseFloat(h[3]),
              ),
                h.length >= 7
                  ? (nA.setRGB(
                      parseFloat(h[4]),
                      parseFloat(h[5]),
                      parseFloat(h[6]),
                      Ht,
                    ),
                    t.colors.push(nA.r, nA.g, nA.b))
                  : t.colors.push(void 0, void 0, void 0));
              break;
            case "vn":
              t.normals.push(
                parseFloat(h[1]),
                parseFloat(h[2]),
                parseFloat(h[3]),
              );
              break;
            case "vt":
              t.uvs.push(parseFloat(h[1]), parseFloat(h[2]));
              break;
          }
        } else if (c === "f") {
          const d = l.slice(1).trim().split($f),
            u = [];
          for (let v = 0, g = d.length; v < g; v++) {
            const m = d[v];
            if (m.length > 0) {
              const y = m.split("/");
              u.push(y);
            }
          }
          const p = u[0];
          for (let v = 1, g = u.length - 1; v < g; v++) {
            const m = u[v],
              y = u[v + 1];
            t.addFace(p[0], m[0], y[0], p[1], m[1], y[1], p[2], m[2], y[2]);
          }
        } else if (c === "l") {
          const h = l.substring(1).trim().split(" ");
          let d = [];
          const u = [];
          if (l.indexOf("/") === -1) d = h;
          else
            for (let p = 0, v = h.length; p < v; p++) {
              const g = h[p].split("/");
              (g[0] !== "" && d.push(g[0]), g[1] !== "" && u.push(g[1]));
            }
          t.addLineGeometry(d, u);
        } else if (c === "p") {
          const d = l.slice(1).trim().split(" ");
          t.addPointGeometry(d);
        } else if ((r = sb.exec(l)) !== null) {
          const h = (" " + r[0].slice(1).trim()).slice(1);
          t.startObject(h);
        } else if (ob.test(l))
          t.object.startMaterial(l.substring(7).trim(), t.materialLibraries);
        else if (ab.test(l)) t.materialLibraries.push(l.substring(7).trim());
        else if (Ab.test(l))
          console.warn(
            'THREE.OBJLoader: Rendering identifier "usemap" not supported. Textures must be defined in MTL files.',
          );
        else if (c === "s") {
          if (((r = l.split(" ")), r.length > 1)) {
            const d = r[1].trim().toLowerCase();
            t.object.smooth = d !== "0" && d !== "off";
          } else t.object.smooth = !0;
          const h = t.object.currentMaterial();
          h && (h.smooth = t.object.smooth);
        } else {
          if (l === "\0") continue;
          console.warn('THREE.OBJLoader: Unexpected line: "' + l + '"');
        }
    }
    t.finalize();
    const s = new dt();
    if (
      ((s.materialLibraries = [].concat(t.materialLibraries)),
      !(
        t.objects.length === 1 && t.objects[0].geometry.vertices.length === 0
      ) === !0)
    )
      for (let o = 0, A = t.objects.length; o < A; o++) {
        const l = t.objects[o],
          c = l.geometry,
          h = l.materials,
          d = c.type === "Line",
          u = c.type === "Points";
        let p = !1;
        if (c.vertices.length === 0) continue;
        const v = new Ct();
        (v.setAttribute("position", new Ke(c.vertices, 3)),
          c.normals.length > 0 &&
            v.setAttribute("normal", new Ke(c.normals, 3)),
          c.colors.length > 0 &&
            ((p = !0), v.setAttribute("color", new Ke(c.colors, 3))),
          c.hasUVIndices === !0 && v.setAttribute("uv", new Ke(c.uvs, 2)));
        const g = [];
        for (let y = 0, C = h.length; y < C; y++) {
          const E = h[y],
            w = E.name + "_" + E.smooth + "_" + p;
          let S = t.materials[w];
          if (this.materials !== null) {
            if (
              ((S = this.materials.create(E.name)),
              d && S && !(S instanceof Gi))
            ) {
              const k = new Gi();
              (Qt.prototype.copy.call(k, S), k.color.copy(S.color), (S = k));
            } else if (u && S && !(S instanceof ws)) {
              const k = new ws({ size: 10, sizeAttenuation: !1 });
              (Qt.prototype.copy.call(k, S),
                k.color.copy(S.color),
                (k.map = S.map),
                (S = k));
            }
          }
          (S === void 0 &&
            (d
              ? (S = new Gi())
              : u
                ? (S = new ws({ size: 1, sizeAttenuation: !1 }))
                : (S = new Rj()),
            (S.name = E.name),
            (S.flatShading = !E.smooth),
            (S.vertexColors = p),
            (t.materials[w] = S)),
            g.push(S));
        }
        let m;
        if (g.length > 1) {
          for (let y = 0, C = h.length; y < C; y++) {
            const E = h[y];
            v.addGroup(E.groupStart, E.groupCount, y);
          }
          d ? (m = new Wa(v, g)) : u ? (m = new Ai(v, g)) : (m = new Ee(v, g));
        } else
          d
            ? (m = new Wa(v, g[0]))
            : u
              ? (m = new Ai(v, g[0]))
              : (m = new Ee(v, g[0]));
        ((m.name = l.name), s.add(m));
      }
    else if (t.vertices.length > 0) {
      const o = new ws({ size: 1, sizeAttenuation: !1 }),
        A = new Ct();
      (A.setAttribute("position", new Ke(t.vertices, 3)),
        t.colors.length > 0 &&
          t.colors[0] !== void 0 &&
          (A.setAttribute("color", new Ke(t.colors, 3)),
          (o.vertexColors = !0)));
      const l = new Ai(A, o);
      s.add(l);
    }
    return s;
  }
}
