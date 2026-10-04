// Preserved bundled dependency. See SOURCE.md and public/licenses/.
import { $n, Ae, Ai, Ao, BA, Cm, Cn, Cr, Ct, DA, Ee, F, Fd, Gi, Gt, Ha, Ht, Ia, Im, It, Lm, Ne, Pd, Qa, Qt, Rt, Tm, Ua, Ut, Va, Wa, Xi, Yj, Yt, Yv, Za, Zt, ba, bh, bt, ci, cn, dt, e6, eo, fA, fn, fr, gm, jn, kn, lo, lt, mt, pr, qj, qt, rl, un, ws, xd, xr, zs, zt, zv } from "./three.js";
import { Jf, db } from "./buffer-geometry-utils.js";
import { MeshoptDecoder } from './meshopt-decoder.js';

class ho extends Xi {
  constructor(e) {
    (super(e),
      (this.dracoLoader = null),
      (this.ktx2Loader = null),
      (this.meshoptDecoder = MeshoptDecoder),
      (this.pluginCallbacks = []),
      this.register(function (t) {
        return new gb(t);
      }),
      this.register(function (t) {
        return new vb(t);
      }),
      this.register(function (t) {
        return new wb(t);
      }),
      this.register(function (t) {
        return new Mb(t);
      }),
      this.register(function (t) {
        return new Bb(t);
      }),
      this.register(function (t) {
        return new _b(t);
      }),
      this.register(function (t) {
        return new Eb(t);
      }),
      this.register(function (t) {
        return new yb(t);
      }),
      this.register(function (t) {
        return new xb(t);
      }),
      this.register(function (t) {
        return new mb(t);
      }),
      this.register(function (t) {
        return new Cb(t);
      }),
      this.register(function (t) {
        return new jb(t);
      }),
      this.register(function (t) {
        return new Sb(t);
      }),
      this.register(function (t) {
        return new bb(t);
      }),
      this.register(function (t) {
        return new fb(t);
      }),
      this.register(function (t) {
        return new Kf(t, St.EXT_MESHOPT_COMPRESSION);
      }),
      this.register(function (t) {
        return new Kf(t, St.KHR_MESHOPT_COMPRESSION);
      }),
      this.register(function (t) {
        return new kb(t);
      }));
  }
  load(e, t, n, r) {
    const s = this;
    let a;
    if (this.resourcePath !== "") a = this.resourcePath;
    else if (this.path !== "") {
      const l = Ia.extractUrlBase(e);
      a = Ia.resolveURL(l, this.path);
    } else a = Ia.extractUrlBase(e);
    this.manager.itemStart(e);
    const o = function (l) {
        (r ? r(l) : console.error(l),
          s.manager.itemError(e),
          s.manager.itemEnd(e));
      },
      A = new Pd(this.manager);
    (A.setPath(this.path),
      A.setResponseType("arraybuffer"),
      A.setRequestHeader(this.requestHeader),
      A.setWithCredentials(this.withCredentials),
      A.load(
        e,
        function (l) {
          try {
            s.parse(
              l,
              a,
              function (c) {
                (t(c), s.manager.itemEnd(e));
              },
              o,
            );
          } catch (c) {
            o(c);
          }
        },
        n,
        o,
      ));
  }
  setDRACOLoader(e) {
    return ((this.dracoLoader = e), this);
  }
  setKTX2Loader(e) {
    return ((this.ktx2Loader = e), this);
  }
  setMeshoptDecoder(e) {
    return ((this.meshoptDecoder = e), this);
  }
  register(e) {
    return (
      this.pluginCallbacks.indexOf(e) === -1 && this.pluginCallbacks.push(e),
      this
    );
  }
  unregister(e) {
    return (
      this.pluginCallbacks.indexOf(e) !== -1 &&
        this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e), 1),
      this
    );
  }
  parse(e, t, n, r) {
    let s;
    const a = {},
      o = {},
      A = new TextDecoder();
    if (typeof e == "string") s = JSON.parse(e);
    else if (e instanceof ArrayBuffer)
      if (A.decode(new Uint8Array(e, 0, 4)) === R0) {
        try {
          a[St.KHR_BINARY_GLTF] = new Tb(e);
        } catch (h) {
          r && r(h);
          return;
        }
        s = JSON.parse(a[St.KHR_BINARY_GLTF].content);
      } else s = JSON.parse(A.decode(e));
    else s = e;
    if (s.asset === void 0 || s.asset.version[0] < 2) {
      r &&
        r(
          new Error(
            "THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported.",
          ),
        );
      return;
    }
    const l = new $b(s, {
      path: t || this.resourcePath || "",
      crossOrigin: this.crossOrigin,
      requestHeader: this.requestHeader,
      manager: this.manager,
      ktx2Loader: this.ktx2Loader,
      meshoptDecoder: this.meshoptDecoder,
    });
    l.fileLoader.setRequestHeader(this.requestHeader);
    for (let c = 0; c < this.pluginCallbacks.length; c++) {
      const h = this.pluginCallbacks[c](l);
      (h.name ||
        console.error("THREE.GLTFLoader: Invalid plugin found: missing name"),
        (o[h.name] = h),
        (a[h.name] = !0));
    }
    if (s.extensionsUsed)
      for (let c = 0; c < s.extensionsUsed.length; ++c) {
        const h = s.extensionsUsed[c],
          d = s.extensionsRequired || [];
        switch (h) {
          case St.KHR_MATERIALS_UNLIT:
            a[h] = new pb();
            break;
          case St.KHR_DRACO_MESH_COMPRESSION:
            a[h] = new Rb(s, this.dracoLoader);
            break;
          case St.KHR_TEXTURE_TRANSFORM:
            a[h] = new Pb();
            break;
          case St.KHR_MESH_QUANTIZATION:
            a[h] = new Ib();
            break;
          default:
            d.indexOf(h) >= 0 &&
              o[h] === void 0 &&
              console.warn('THREE.GLTFLoader: Unknown extension "' + h + '".');
        }
      }
    (l.setExtensions(a), l.setPlugins(o), l.parse(n, r));
  }
  parseAsync(e, t) {
    const n = this;
    return new Promise(function (r, s) {
      n.parse(e, t, r, s);
    });
  }
}

function ub() {
  let i = {};
  return {
    get: function (e) {
      return i[e];
    },
    add: function (e, t) {
      i[e] = t;
    },
    remove: function (e) {
      delete i[e];
    },
    removeAll: function () {
      i = {};
    },
  };
}

function Jt(i, e, t) {
  const n = i.json.materials[e];
  return n.extensions && n.extensions[t] ? n.extensions[t] : null;
}

const St = {
  KHR_BINARY_GLTF: "KHR_binary_glTF",
  KHR_DRACO_MESH_COMPRESSION: "KHR_draco_mesh_compression",
  KHR_LIGHTS_PUNCTUAL: "KHR_lights_punctual",
  KHR_MATERIALS_CLEARCOAT: "KHR_materials_clearcoat",
  KHR_MATERIALS_DISPERSION: "KHR_materials_dispersion",
  KHR_MATERIALS_IOR: "KHR_materials_ior",
  KHR_MATERIALS_SHEEN: "KHR_materials_sheen",
  KHR_MATERIALS_SPECULAR: "KHR_materials_specular",
  KHR_MATERIALS_TRANSMISSION: "KHR_materials_transmission",
  KHR_MATERIALS_IRIDESCENCE: "KHR_materials_iridescence",
  KHR_MATERIALS_ANISOTROPY: "KHR_materials_anisotropy",
  KHR_MATERIALS_UNLIT: "KHR_materials_unlit",
  KHR_MATERIALS_VOLUME: "KHR_materials_volume",
  KHR_TEXTURE_BASISU: "KHR_texture_basisu",
  KHR_TEXTURE_TRANSFORM: "KHR_texture_transform",
  KHR_MESH_QUANTIZATION: "KHR_mesh_quantization",
  KHR_MATERIALS_EMISSIVE_STRENGTH: "KHR_materials_emissive_strength",
  EXT_MATERIALS_BUMP: "EXT_materials_bump",
  EXT_TEXTURE_WEBP: "EXT_texture_webp",
  EXT_TEXTURE_AVIF: "EXT_texture_avif",
  EXT_MESHOPT_COMPRESSION: "EXT_meshopt_compression",
  KHR_MESHOPT_COMPRESSION: "KHR_meshopt_compression",
  EXT_MESH_GPU_INSTANCING: "EXT_mesh_gpu_instancing",
};

class fb {
  constructor(e) {
    ((this.parser = e),
      (this.name = St.KHR_LIGHTS_PUNCTUAL),
      (this.cache = { refs: {}, uses: {} }));
  }
  _markDefs() {
    const e = this.parser,
      t = this.parser.json.nodes || [];
    for (let n = 0, r = t.length; n < r; n++) {
      const s = t[n];
      s.extensions &&
        s.extensions[this.name] &&
        s.extensions[this.name].light !== void 0 &&
        e._addNodeRef(this.cache, s.extensions[this.name].light);
    }
  }
  _loadLight(e) {
    const t = this.parser,
      n = "light:" + e;
    let r = t.cache.get(n);
    if (r) return r;
    const s = t.json,
      A = (((s.extensions && s.extensions[this.name]) || {}).lights || [])[e];
    let l;
    const c = new Ne(16777215);
    A.color !== void 0 && c.setRGB(A.color[0], A.color[1], A.color[2], kn);
    const h = A.range !== void 0 ? A.range : 0;
    switch (A.type) {
      case "directional":
        ((l = new eo(c)), l.target.position.set(0, 0, -1), l.add(l.target));
        break;
      case "point":
        ((l = new Fd(c)), (l.distance = h));
        break;
      case "spot":
        ((l = new Yj(c)),
          (l.distance = h),
          (A.spot = A.spot || {}),
          (A.spot.innerConeAngle =
            A.spot.innerConeAngle !== void 0 ? A.spot.innerConeAngle : 0),
          (A.spot.outerConeAngle =
            A.spot.outerConeAngle !== void 0
              ? A.spot.outerConeAngle
              : Math.PI / 4),
          (l.angle = A.spot.outerConeAngle),
          (l.penumbra = 1 - A.spot.innerConeAngle / A.spot.outerConeAngle),
          l.target.position.set(0, 0, -1),
          l.add(l.target));
        break;
      default:
        throw new Error("THREE.GLTFLoader: Unexpected light type: " + A.type);
    }
    return (
      l.position.set(0, 0, 0),
      hr(l, A),
      A.intensity !== void 0 && (l.intensity = A.intensity),
      (l.name = t.createUniqueName(A.name || "light_" + e)),
      (r = Promise.resolve(l)),
      t.cache.add(n, r),
      r
    );
  }
  getDependency(e, t) {
    if (e === "light") return this._loadLight(t);
  }
  createNodeAttachment(e) {
    const t = this,
      n = this.parser,
      s = n.json.nodes[e],
      o = ((s.extensions && s.extensions[this.name]) || {}).light;
    return o === void 0
      ? null
      : this._loadLight(o).then(function (A) {
          return n._getNodeRef(t.cache, o, A);
        });
  }
}

class pb {
  constructor() {
    this.name = St.KHR_MATERIALS_UNLIT;
  }
  getMaterialType() {
    return cn;
  }
  extendParams(e, t, n) {
    const r = [];
    ((e.color = new Ne(1, 1, 1)), (e.opacity = 1));
    const s = t.pbrMetallicRoughness;
    if (s) {
      if (Array.isArray(s.baseColorFactor)) {
        const a = s.baseColorFactor;
        (e.color.setRGB(a[0], a[1], a[2], kn), (e.opacity = a[3]));
      }
      s.baseColorTexture !== void 0 &&
        r.push(n.assignTexture(e, "map", s.baseColorTexture, Ht));
    }
    return Promise.all(r);
  }
}

class mb {
  constructor(e) {
    ((this.parser = e), (this.name = St.KHR_MATERIALS_EMISSIVE_STRENGTH));
  }
  extendMaterialParams(e, t) {
    const n = Jt(this.parser, e, this.name);
    return (
      n === null ||
        (n.emissiveStrength !== void 0 &&
          (t.emissiveIntensity = n.emissiveStrength)),
      Promise.resolve()
    );
  }
}

class gb {
  constructor(e) {
    ((this.parser = e), (this.name = St.KHR_MATERIALS_CLEARCOAT));
  }
  getMaterialType(e) {
    return Jt(this.parser, e, this.name) !== null ? Cn : null;
  }
  extendMaterialParams(e, t) {
    const n = Jt(this.parser, e, this.name);
    if (n === null) return Promise.resolve();
    const r = [];
    if (
      (n.clearcoatFactor !== void 0 && (t.clearcoat = n.clearcoatFactor),
      n.clearcoatTexture !== void 0 &&
        r.push(
          this.parser.assignTexture(t, "clearcoatMap", n.clearcoatTexture),
        ),
      n.clearcoatRoughnessFactor !== void 0 &&
        (t.clearcoatRoughness = n.clearcoatRoughnessFactor),
      n.clearcoatRoughnessTexture !== void 0 &&
        r.push(
          this.parser.assignTexture(
            t,
            "clearcoatRoughnessMap",
            n.clearcoatRoughnessTexture,
          ),
        ),
      n.clearcoatNormalTexture !== void 0 &&
        (r.push(
          this.parser.assignTexture(
            t,
            "clearcoatNormalMap",
            n.clearcoatNormalTexture,
          ),
        ),
        n.clearcoatNormalTexture.scale !== void 0))
    ) {
      const s = n.clearcoatNormalTexture.scale;
      t.clearcoatNormalScale = new Ae(s, s);
    }
    return Promise.all(r);
  }
}

class vb {
  constructor(e) {
    ((this.parser = e), (this.name = St.KHR_MATERIALS_DISPERSION));
  }
  getMaterialType(e) {
    return Jt(this.parser, e, this.name) !== null ? Cn : null;
  }
  extendMaterialParams(e, t) {
    const n = Jt(this.parser, e, this.name);
    return (
      n === null || (t.dispersion = n.dispersion !== void 0 ? n.dispersion : 0),
      Promise.resolve()
    );
  }
}

class jb {
  constructor(e) {
    ((this.parser = e), (this.name = St.KHR_MATERIALS_IRIDESCENCE));
  }
  getMaterialType(e) {
    return Jt(this.parser, e, this.name) !== null ? Cn : null;
  }
  extendMaterialParams(e, t) {
    const n = Jt(this.parser, e, this.name);
    if (n === null) return Promise.resolve();
    const r = [];
    return (
      n.iridescenceFactor !== void 0 && (t.iridescence = n.iridescenceFactor),
      n.iridescenceTexture !== void 0 &&
        r.push(
          this.parser.assignTexture(t, "iridescenceMap", n.iridescenceTexture),
        ),
      n.iridescenceIor !== void 0 && (t.iridescenceIOR = n.iridescenceIor),
      t.iridescenceThicknessRange === void 0 &&
        (t.iridescenceThicknessRange = [100, 400]),
      n.iridescenceThicknessMinimum !== void 0 &&
        (t.iridescenceThicknessRange[0] = n.iridescenceThicknessMinimum),
      n.iridescenceThicknessMaximum !== void 0 &&
        (t.iridescenceThicknessRange[1] = n.iridescenceThicknessMaximum),
      n.iridescenceThicknessTexture !== void 0 &&
        r.push(
          this.parser.assignTexture(
            t,
            "iridescenceThicknessMap",
            n.iridescenceThicknessTexture,
          ),
        ),
      Promise.all(r)
    );
  }
}

class _b {
  constructor(e) {
    ((this.parser = e), (this.name = St.KHR_MATERIALS_SHEEN));
  }
  getMaterialType(e) {
    return Jt(this.parser, e, this.name) !== null ? Cn : null;
  }
  extendMaterialParams(e, t) {
    const n = Jt(this.parser, e, this.name);
    if (n === null) return Promise.resolve();
    const r = [];
    if (
      ((t.sheenColor = new Ne(0, 0, 0)),
      (t.sheenRoughness = 0),
      (t.sheen = 1),
      n.sheenColorFactor !== void 0)
    ) {
      const s = n.sheenColorFactor;
      t.sheenColor.setRGB(s[0], s[1], s[2], kn);
    }
    return (
      n.sheenRoughnessFactor !== void 0 &&
        (t.sheenRoughness = n.sheenRoughnessFactor),
      n.sheenColorTexture !== void 0 &&
        r.push(
          this.parser.assignTexture(
            t,
            "sheenColorMap",
            n.sheenColorTexture,
            Ht,
          ),
        ),
      n.sheenRoughnessTexture !== void 0 &&
        r.push(
          this.parser.assignTexture(
            t,
            "sheenRoughnessMap",
            n.sheenRoughnessTexture,
          ),
        ),
      Promise.all(r)
    );
  }
}

class Eb {
  constructor(e) {
    ((this.parser = e), (this.name = St.KHR_MATERIALS_TRANSMISSION));
  }
  getMaterialType(e) {
    return Jt(this.parser, e, this.name) !== null ? Cn : null;
  }
  extendMaterialParams(e, t) {
    const n = Jt(this.parser, e, this.name);
    if (n === null) return Promise.resolve();
    const r = [];
    return (
      n.transmissionFactor !== void 0 &&
        (t.transmission = n.transmissionFactor),
      n.transmissionTexture !== void 0 &&
        r.push(
          this.parser.assignTexture(
            t,
            "transmissionMap",
            n.transmissionTexture,
          ),
        ),
      Promise.all(r)
    );
  }
}

class yb {
  constructor(e) {
    ((this.parser = e), (this.name = St.KHR_MATERIALS_VOLUME));
  }
  getMaterialType(e) {
    return Jt(this.parser, e, this.name) !== null ? Cn : null;
  }
  extendMaterialParams(e, t) {
    const n = Jt(this.parser, e, this.name);
    if (n === null) return Promise.resolve();
    const r = [];
    ((t.thickness = n.thicknessFactor !== void 0 ? n.thicknessFactor : 0),
      n.thicknessTexture !== void 0 &&
        r.push(
          this.parser.assignTexture(t, "thicknessMap", n.thicknessTexture),
        ),
      (t.attenuationDistance = n.attenuationDistance || 1 / 0));
    const s = n.attenuationColor || [1, 1, 1];
    return (
      (t.attenuationColor = new Ne().setRGB(s[0], s[1], s[2], kn)),
      Promise.all(r)
    );
  }
}

class xb {
  constructor(e) {
    ((this.parser = e), (this.name = St.KHR_MATERIALS_IOR));
  }
  getMaterialType(e) {
    return Jt(this.parser, e, this.name) !== null ? Cn : null;
  }
  extendMaterialParams(e, t) {
    const n = Jt(this.parser, e, this.name);
    return (
      n === null ||
        ((t.ior = n.ior !== void 0 ? n.ior : 1.5),
        t.ior === 0 && (t.ior = 1e3)),
      Promise.resolve()
    );
  }
}

class Cb {
  constructor(e) {
    ((this.parser = e), (this.name = St.KHR_MATERIALS_SPECULAR));
  }
  getMaterialType(e) {
    return Jt(this.parser, e, this.name) !== null ? Cn : null;
  }
  extendMaterialParams(e, t) {
    const n = Jt(this.parser, e, this.name);
    if (n === null) return Promise.resolve();
    const r = [];
    ((t.specularIntensity = n.specularFactor !== void 0 ? n.specularFactor : 1),
      n.specularTexture !== void 0 &&
        r.push(
          this.parser.assignTexture(
            t,
            "specularIntensityMap",
            n.specularTexture,
          ),
        ));
    const s = n.specularColorFactor || [1, 1, 1];
    return (
      (t.specularColor = new Ne().setRGB(s[0], s[1], s[2], kn)),
      n.specularColorTexture !== void 0 &&
        r.push(
          this.parser.assignTexture(
            t,
            "specularColorMap",
            n.specularColorTexture,
            Ht,
          ),
        ),
      Promise.all(r)
    );
  }
}

class bb {
  constructor(e) {
    ((this.parser = e), (this.name = St.EXT_MATERIALS_BUMP));
  }
  getMaterialType(e) {
    return Jt(this.parser, e, this.name) !== null ? Cn : null;
  }
  extendMaterialParams(e, t) {
    const n = Jt(this.parser, e, this.name);
    if (n === null) return Promise.resolve();
    const r = [];
    return (
      (t.bumpScale = n.bumpFactor !== void 0 ? n.bumpFactor : 1),
      n.bumpTexture !== void 0 &&
        r.push(this.parser.assignTexture(t, "bumpMap", n.bumpTexture)),
      Promise.all(r)
    );
  }
}

class Sb {
  constructor(e) {
    ((this.parser = e), (this.name = St.KHR_MATERIALS_ANISOTROPY));
  }
  getMaterialType(e) {
    return Jt(this.parser, e, this.name) !== null ? Cn : null;
  }
  extendMaterialParams(e, t) {
    const n = Jt(this.parser, e, this.name);
    if (n === null) return Promise.resolve();
    const r = [];
    return (
      n.anisotropyStrength !== void 0 && (t.anisotropy = n.anisotropyStrength),
      n.anisotropyRotation !== void 0 &&
        (t.anisotropyRotation = n.anisotropyRotation),
      n.anisotropyTexture !== void 0 &&
        r.push(
          this.parser.assignTexture(t, "anisotropyMap", n.anisotropyTexture),
        ),
      Promise.all(r)
    );
  }
}

class wb {
  constructor(e) {
    ((this.parser = e), (this.name = St.KHR_TEXTURE_BASISU));
  }
  loadTexture(e) {
    const t = this.parser,
      n = t.json,
      r = n.textures[e];
    if (!r.extensions || !r.extensions[this.name]) return null;
    const s = r.extensions[this.name],
      a = t.options.ktx2Loader;
    if (!a) {
      if (n.extensionsRequired && n.extensionsRequired.indexOf(this.name) >= 0)
        throw new Error(
          "THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures",
        );
      return null;
    }
    return t.loadTextureImage(e, s.source, a);
  }
}

class Mb {
  constructor(e) {
    ((this.parser = e), (this.name = St.EXT_TEXTURE_WEBP));
  }
  loadTexture(e) {
    const t = this.name,
      n = this.parser,
      r = n.json,
      s = r.textures[e];
    if (!s.extensions || !s.extensions[t]) return null;
    const a = s.extensions[t],
      o = r.images[a.source];
    let A = n.textureLoader;
    if (o.uri) {
      const l = n.options.manager.getHandler(o.uri);
      l !== null && (A = l);
    }
    return n.loadTextureImage(e, a.source, A);
  }
}

class Bb {
  constructor(e) {
    ((this.parser = e), (this.name = St.EXT_TEXTURE_AVIF));
  }
  loadTexture(e) {
    const t = this.name,
      n = this.parser,
      r = n.json,
      s = r.textures[e];
    if (!s.extensions || !s.extensions[t]) return null;
    const a = s.extensions[t],
      o = r.images[a.source];
    let A = n.textureLoader;
    if (o.uri) {
      const l = n.options.manager.getHandler(o.uri);
      l !== null && (A = l);
    }
    return n.loadTextureImage(e, a.source, A);
  }
}

class Kf {
  constructor(e, t) {
    ((this.name = t), (this.parser = e));
  }
  loadBufferView(e) {
    const t = this.parser.json,
      n = t.bufferViews[e];
    if (n.extensions && n.extensions[this.name]) {
      const r = n.extensions[this.name],
        s = this.parser.getDependency("buffer", r.buffer),
        a = this.parser.options.meshoptDecoder;
      if (!a || !a.supported) {
        if (
          t.extensionsRequired &&
          t.extensionsRequired.indexOf(this.name) >= 0
        )
          throw new Error(
            "THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files",
          );
        return null;
      }
      return s.then(function (o) {
        const A = r.byteOffset || 0,
          l = r.byteLength || 0,
          c = r.count,
          h = r.byteStride,
          d = new Uint8Array(o, A, l);
        return a.decodeGltfBufferAsync
          ? a
              .decodeGltfBufferAsync(c, h, d, r.mode, r.filter)
              .then(function (u) {
                return u.buffer;
              })
          : a.ready.then(function () {
              const u = new ArrayBuffer(c * h);
              return (
                a.decodeGltfBuffer(
                  new Uint8Array(u),
                  c,
                  h,
                  d,
                  r.mode,
                  r.filter,
                ),
                u
              );
            });
      });
    } else return null;
  }
}

class kb {
  constructor(e) {
    ((this.name = St.EXT_MESH_GPU_INSTANCING), (this.parser = e));
  }
  createNodeMesh(e) {
    const t = this.parser.json,
      n = t.nodes[e];
    if (!n.extensions || !n.extensions[this.name] || n.mesh === void 0)
      return null;
    const r = t.meshes[n.mesh];
    for (const l of r.primitives)
      if (
        l.mode !== Nn.TRIANGLES &&
        l.mode !== Nn.TRIANGLE_STRIP &&
        l.mode !== Nn.TRIANGLE_FAN &&
        l.mode !== void 0
      )
        return null;
    const a = n.extensions[this.name].attributes,
      o = [],
      A = {};
    for (const l in a)
      o.push(
        this.parser
          .getDependency("accessor", a[l])
          .then((c) => ((A[l] = c), A[l])),
      );
    return o.length < 1
      ? null
      : (o.push(this.parser.createNodeMesh(e)),
        Promise.all(o).then((l) => {
          const c = l.pop(),
            h = c.isGroup ? c.children : [c],
            d = l[0].count,
            u = [];
          for (const p of h) {
            const v = new mt(),
              g = new F(),
              m = new jn(),
              y = new F(1, 1, 1),
              C = new Lm(p.geometry, p.material, d);
            for (let E = 0; E < d; E++)
              (A.TRANSLATION && g.fromBufferAttribute(A.TRANSLATION, E),
                A.ROTATION && m.fromBufferAttribute(A.ROTATION, E),
                A.SCALE && y.fromBufferAttribute(A.SCALE, E),
                C.setMatrixAt(E, v.compose(g, m, y)));
            for (const E in A)
              if (E === "_COLOR_0") {
                const w = A[E];
                C.instanceColor = new un(w.array, w.itemSize, w.normalized);
              } else
                E !== "TRANSLATION" &&
                  E !== "ROTATION" &&
                  E !== "SCALE" &&
                  p.geometry.setAttribute(E, A[E]);
            (It.prototype.copy.call(C, p),
              this.parser.assignFinalMaterial(C),
              u.push(C));
          }
          return c.isGroup ? (c.clear(), c.add(...u), c) : u[0];
        }));
  }
}

const R0 = "glTF";

const fa = 12;

const Yf = { JSON: 1313821514, BIN: 5130562 };

class Tb {
  constructor(e) {
    ((this.name = St.KHR_BINARY_GLTF),
      (this.content = null),
      (this.body = null));
    const t = new DataView(e, 0, fa),
      n = new TextDecoder();
    if (
      ((this.header = {
        magic: n.decode(new Uint8Array(e.slice(0, 4))),
        version: t.getUint32(4, !0),
        length: t.getUint32(8, !0),
      }),
      this.header.magic !== R0)
    )
      throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");
    if (this.header.version < 2)
      throw new Error("THREE.GLTFLoader: Legacy binary file detected.");
    const r = this.header.length - fa,
      s = new DataView(e, fa);
    let a = 0;
    for (; a < r; ) {
      const o = s.getUint32(a, !0);
      a += 4;
      const A = s.getUint32(a, !0);
      if (((a += 4), A === Yf.JSON)) {
        const l = new Uint8Array(e, fa + a, o);
        this.content = n.decode(l);
      } else if (A === Yf.BIN) {
        const l = fa + a;
        this.body = e.slice(l, l + o);
      }
      a += o;
    }
    if (this.content === null)
      throw new Error("THREE.GLTFLoader: JSON content not found.");
  }
}

class Rb {
  constructor(e, t) {
    if (!t)
      throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");
    ((this.name = St.KHR_DRACO_MESH_COMPRESSION),
      (this.json = e),
      (this.dracoLoader = t),
      this.dracoLoader.preload());
  }
  decodePrimitive(e, t) {
    const n = this.json,
      r = this.dracoLoader,
      s = e.extensions[this.name].bufferView,
      a = e.extensions[this.name].attributes,
      o = {},
      A = {},
      l = {};
    for (const c in a) {
      const h = Dh[c] || c.toLowerCase();
      o[h] = a[c];
    }
    for (const c in e.attributes) {
      const h = Dh[c] || c.toLowerCase();
      if (a[c] !== void 0) {
        const d = n.accessors[e.attributes[c]],
          u = Ts[d.componentType];
        ((l[h] = u.name), (A[h] = d.normalized === !0));
      }
    }
    return t.getDependency("bufferView", s).then(function (c) {
      return new Promise(function (h, d) {
        r.decodeDracoFile(
          c,
          function (u) {
            for (const p in u.attributes) {
              const v = u.attributes[p],
                g = A[p];
              g !== void 0 && (v.normalized = g);
            }
            h(u);
          },
          o,
          l,
          kn,
          d,
        );
      });
    });
  }
}

class Pb {
  constructor() {
    this.name = St.KHR_TEXTURE_TRANSFORM;
  }
  extendTexture(e, t) {
    return (
      ((t.texCoord === void 0 || t.texCoord === e.channel) &&
        t.offset === void 0 &&
        t.rotation === void 0 &&
        t.scale === void 0) ||
        ((e = e.clone()),
        t.texCoord !== void 0 && (e.channel = t.texCoord),
        t.offset !== void 0 && e.offset.fromArray(t.offset),
        t.rotation !== void 0 && (e.rotation = t.rotation),
        t.scale !== void 0 && e.repeat.fromArray(t.scale),
        (e.needsUpdate = !0)),
      e
    );
  }
}

class Ib {
  constructor() {
    this.name = St.KHR_MESH_QUANTIZATION;
  }
}

class P0 extends zs {
  constructor(e, t, n, r) {
    super(e, t, n, r);
  }
  copySampleValue_(e) {
    const t = this.resultBuffer,
      n = this.sampleValues,
      r = this.valueSize,
      s = e * r * 3 + r;
    for (let a = 0; a !== r; a++) t[a] = n[s + a];
    return t;
  }
  interpolate_(e, t, n, r) {
    const s = this.resultBuffer,
      a = this.sampleValues,
      o = this.valueSize,
      A = o * 2,
      l = o * 3,
      c = r - t,
      h = (n - t) / c,
      d = h * h,
      u = d * h,
      p = e * l,
      v = p - l,
      g = -2 * u + 3 * d,
      m = u - d,
      y = 1 - g,
      C = m - d + h;
    for (let E = 0; E !== o; E++) {
      const w = a[v + E + o],
        S = a[v + E + A] * c,
        k = a[p + E + o],
        x = a[p + E] * c;
      s[E] = y * w + C * S + g * k + m * x;
    }
    return s;
  }
}

const Lb = new jn();

class Fb extends P0 {
  interpolate_(e, t, n, r) {
    const s = super.interpolate_(e, t, n, r);
    return (Lb.fromArray(s).normalize().toArray(s), s);
  }
}

const Nn = {
    POINTS: 0,
    LINES: 1,
    LINE_LOOP: 2,
    LINE_STRIP: 3,
    TRIANGLES: 4,
    TRIANGLE_STRIP: 5,
    TRIANGLE_FAN: 6,
  };

const Ts = {
    5120: Int8Array,
    5121: Uint8Array,
    5122: Int16Array,
    5123: Uint16Array,
    5125: Uint32Array,
    5126: Float32Array,
  };

const Zf = { 9728: Yt, 9729: qt, 9984: gm, 9985: fA, 9986: ba, 9987: pr };

const Qf = { 33071: fr, 33648: BA, 10497: ci };

const hc = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };

const Dh = {
    POSITION: "position",
    NORMAL: "normal",
    TANGENT: "tangent",
    TEXCOORD_0: "uv",
    TEXCOORD_1: "uv1",
    TEXCOORD_2: "uv2",
    TEXCOORD_3: "uv3",
    COLOR_0: "color",
    WEIGHTS_0: "skinWeight",
    JOINTS_0: "skinIndex",
  };

const Qr = {
    scale: "scale",
    translation: "position",
    rotation: "quaternion",
    weights: "morphTargetInfluences",
  };

const Db = { CUBICSPLINE: void 0, LINEAR: Ua, STEP: Ha };

const dc = { OPAQUE: "OPAQUE", MASK: "MASK", BLEND: "BLEND" };

function Nb(i) {
  return (
    i.DefaultMaterial === void 0 &&
      (i.DefaultMaterial = new lt({
        color: 16777215,
        emissive: 0,
        metalness: 1,
        roughness: 1,
        transparent: !1,
        depthTest: !0,
        side: $n,
      })),
    i.DefaultMaterial
  );
}

function _i(i, e, t) {
  for (const n in t.extensions)
    i[n] === void 0 &&
      ((e.userData.gltfExtensions = e.userData.gltfExtensions || {}),
      (e.userData.gltfExtensions[n] = t.extensions[n]));
}

function hr(i, e) {
  e.extras !== void 0 &&
    (typeof e.extras == "object"
      ? Object.assign(i.userData, e.extras)
      : console.warn(
          "THREE.GLTFLoader: Ignoring primitive type .extras, " + e.extras,
        ));
}

function Gb(i, e, t) {
  let n = !1,
    r = !1,
    s = !1;
  for (let l = 0, c = e.length; l < c; l++) {
    const h = e[l];
    if (
      (h.POSITION !== void 0 && (n = !0),
      h.NORMAL !== void 0 && (r = !0),
      h.COLOR_0 !== void 0 && (s = !0),
      n && r && s)
    )
      break;
  }
  if (!n && !r && !s) return Promise.resolve(i);
  const a = [],
    o = [],
    A = [];
  for (let l = 0, c = e.length; l < c; l++) {
    const h = e[l];
    if (n) {
      const d =
        h.POSITION !== void 0
          ? t.getDependency("accessor", h.POSITION)
          : i.attributes.position;
      a.push(d);
    }
    if (r) {
      const d =
        h.NORMAL !== void 0
          ? t.getDependency("accessor", h.NORMAL)
          : i.attributes.normal;
      o.push(d);
    }
    if (s) {
      const d =
        h.COLOR_0 !== void 0
          ? t.getDependency("accessor", h.COLOR_0)
          : i.attributes.color;
      A.push(d);
    }
  }
  return Promise.all([Promise.all(a), Promise.all(o), Promise.all(A)]).then(
    function (l) {
      const c = l[0],
        h = l[1],
        d = l[2];
      return (
        n && (i.morphAttributes.position = c),
        r && (i.morphAttributes.normal = h),
        s && (i.morphAttributes.color = d),
        (i.morphTargetsRelative = !0),
        i
      );
    },
  );
}

function Ob(i, e) {
  if ((i.updateMorphTargets(), e.weights !== void 0))
    for (let t = 0, n = e.weights.length; t < n; t++)
      i.morphTargetInfluences[t] = e.weights[t];
  if (e.extras && Array.isArray(e.extras.targetNames)) {
    const t = e.extras.targetNames;
    if (i.morphTargetInfluences.length === t.length) {
      i.morphTargetDictionary = {};
      for (let n = 0, r = t.length; n < r; n++)
        i.morphTargetDictionary[t[n]] = n;
    } else
      console.warn(
        "THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.",
      );
  }
}

function Hb(i) {
  let e;
  const t = i.extensions && i.extensions[St.KHR_DRACO_MESH_COMPRESSION];
  if (
    (t
      ? (e = "draco:" + t.bufferView + ":" + t.indices + ":" + uc(t.attributes))
      : (e = i.indices + ":" + uc(i.attributes) + ":" + i.mode),
    i.targets !== void 0)
  )
    for (let n = 0, r = i.targets.length; n < r; n++)
      e += ":" + uc(i.targets[n]);
  return e;
}

function uc(i) {
  let e = "";
  const t = Object.keys(i).sort();
  for (let n = 0, r = t.length; n < r; n++) e += t[n] + ":" + i[t[n]] + ";";
  return e;
}

function Nh(i) {
  switch (i) {
    case Int8Array:
      return 1 / 127;
    case Uint8Array:
      return 1 / 255;
    case Int16Array:
      return 1 / 32767;
    case Uint16Array:
      return 1 / 65535;
    default:
      throw new Error(
        "THREE.GLTFLoader: Unsupported normalized accessor component type.",
      );
  }
}

function Ub(i) {
  return i.search(/\.jpe?g($|\?)/i) > 0 || i.search(/^data\:image\/jpeg/) === 0
    ? "image/jpeg"
    : i.search(/\.webp($|\?)/i) > 0 || i.search(/^data\:image\/webp/) === 0
      ? "image/webp"
      : i.search(/\.ktx2($|\?)/i) > 0 || i.search(/^data\:image\/ktx2/) === 0
        ? "image/ktx2"
        : "image/png";
}

const qb = new mt();

class $b {
  constructor(e = {}, t = {}) {
    ((this.json = e),
      (this.extensions = {}),
      (this.plugins = {}),
      (this.options = t),
      (this.cache = new ub()),
      (this.associations = new Map()),
      (this.primitiveCache = {}),
      (this.nodeCache = {}),
      (this.meshCache = { refs: {}, uses: {} }),
      (this.cameraCache = { refs: {}, uses: {} }),
      (this.lightCache = { refs: {}, uses: {} }),
      (this.sourceCache = {}),
      (this.textureCache = {}),
      (this.nodeNamesUsed = {}));
    let n = !1,
      r = -1,
      s = !1,
      a = -1;
    if (typeof navigator < "u" && typeof navigator.userAgent < "u") {
      const o = navigator.userAgent;
      n = /^((?!chrome|android).)*safari/i.test(o) === !0;
      const A = o.match(/Version\/(\d+)/);
      ((r = n && A ? parseInt(A[1], 10) : -1),
        (s = o.indexOf("Firefox") > -1),
        (a = s ? o.match(/Firefox\/([0-9]+)\./)[1] : -1));
    }
    (typeof createImageBitmap > "u" || (n && r < 17) || (s && a < 98)
      ? (this.textureLoader = new Ao(this.options.manager))
      : (this.textureLoader = new e6(this.options.manager)),
      this.textureLoader.setCrossOrigin(this.options.crossOrigin),
      this.textureLoader.setRequestHeader(this.options.requestHeader),
      (this.fileLoader = new Pd(this.options.manager)),
      this.fileLoader.setResponseType("arraybuffer"),
      this.options.crossOrigin === "use-credentials" &&
        this.fileLoader.setWithCredentials(!0));
  }
  setExtensions(e) {
    this.extensions = e;
  }
  setPlugins(e) {
    this.plugins = e;
  }
  parse(e, t) {
    const n = this,
      r = this.json,
      s = this.extensions;
    (this.cache.removeAll(),
      (this.nodeCache = {}),
      this._invokeAll(function (a) {
        return a._markDefs && a._markDefs();
      }),
      Promise.all(
        this._invokeAll(function (a) {
          return a.beforeRoot && a.beforeRoot();
        }),
      )
        .then(function () {
          return Promise.all([
            n.getDependencies("scene"),
            n.getDependencies("animation"),
            n.getDependencies("camera"),
          ]);
        })
        .then(function (a) {
          const o = {
            scene: a[0][r.scene || 0],
            scenes: a[0],
            animations: a[1],
            cameras: a[2],
            asset: r.asset,
            parser: n,
            userData: {},
          };
          return (
            _i(s, o, r),
            hr(o, r),
            Promise.all(
              n._invokeAll(function (A) {
                return A.afterRoot && A.afterRoot(o);
              }),
            ).then(function () {
              for (const A of o.scenes) A.updateMatrixWorld();
              e(o);
            })
          );
        })
        .catch(t));
  }
  _markDefs() {
    const e = this.json.nodes || [],
      t = this.json.skins || [],
      n = this.json.meshes || [];
    for (let r = 0, s = t.length; r < s; r++) {
      const a = t[r].joints;
      for (let o = 0, A = a.length; o < A; o++) e[a[o]].isBone = !0;
    }
    for (let r = 0, s = e.length; r < s; r++) {
      const a = e[r];
      (a.mesh !== void 0 &&
        (this._addNodeRef(this.meshCache, a.mesh),
        a.skin !== void 0 && (n[a.mesh].isSkinnedMesh = !0)),
        a.camera !== void 0 && this._addNodeRef(this.cameraCache, a.camera));
    }
  }
  _addNodeRef(e, t) {
    t !== void 0 &&
      (e.refs[t] === void 0 && (e.refs[t] = e.uses[t] = 0), e.refs[t]++);
  }
  _getNodeRef(e, t, n) {
    if (e.refs[t] <= 1) return n;
    const r = n.clone(),
      s = (a, o) => {
        const A = this.associations.get(a);
        A != null && this.associations.set(o, A);
        for (const [l, c] of a.children.entries()) s(c, o.children[l]);
      };
    return (s(n, r), (r.name += "_instance_" + e.uses[t]++), r);
  }
  _invokeOne(e) {
    const t = Object.values(this.plugins);
    t.push(this);
    for (let n = 0; n < t.length; n++) {
      const r = e(t[n]);
      if (r) return r;
    }
    return null;
  }
  _invokeAll(e) {
    const t = Object.values(this.plugins);
    t.unshift(this);
    const n = [];
    for (let r = 0; r < t.length; r++) {
      const s = e(t[r]);
      s && n.push(s);
    }
    return n;
  }
  getDependency(e, t) {
    const n = e + ":" + t;
    let r = this.cache.get(n);
    if (!r) {
      switch (e) {
        case "scene":
          r = this.loadScene(t);
          break;
        case "node":
          r = this._invokeOne(function (s) {
            return s.loadNode && s.loadNode(t);
          });
          break;
        case "mesh":
          r = this._invokeOne(function (s) {
            return s.loadMesh && s.loadMesh(t);
          });
          break;
        case "accessor":
          r = this.loadAccessor(t);
          break;
        case "bufferView":
          r = this._invokeOne(function (s) {
            return s.loadBufferView && s.loadBufferView(t);
          });
          break;
        case "buffer":
          r = this.loadBuffer(t);
          break;
        case "material":
          r = this._invokeOne(function (s) {
            return s.loadMaterial && s.loadMaterial(t);
          });
          break;
        case "texture":
          r = this._invokeOne(function (s) {
            return s.loadTexture && s.loadTexture(t);
          });
          break;
        case "skin":
          r = this.loadSkin(t);
          break;
        case "animation":
          r = this._invokeOne(function (s) {
            return s.loadAnimation && s.loadAnimation(t);
          });
          break;
        case "camera":
          r = this.loadCamera(t);
          break;
        default:
          if (
            ((r = this._invokeOne(function (s) {
              return s != this && s.getDependency && s.getDependency(e, t);
            })),
            !r)
          )
            throw new Error("Unknown type: " + e);
          break;
      }
      this.cache.add(n, r);
    }
    return r;
  }
  getDependencies(e) {
    let t = this.cache.get(e);
    if (!t) {
      const n = this,
        r = this.json[e + (e === "mesh" ? "es" : "s")] || [];
      ((t = Promise.all(
        r.map(function (s, a) {
          return n.getDependency(e, a);
        }),
      )),
        this.cache.add(e, t));
    }
    return t;
  }
  loadBuffer(e) {
    const t = this.json.buffers[e],
      n = this.fileLoader;
    if (t.type && t.type !== "arraybuffer")
      throw new Error(
        "THREE.GLTFLoader: " + t.type + " buffer type is not supported.",
      );
    if (t.uri === void 0 && e === 0)
      return Promise.resolve(this.extensions[St.KHR_BINARY_GLTF].body);
    const r = this.options;
    return new Promise(function (s, a) {
      n.load(Ia.resolveURL(t.uri, r.path), s, void 0, function () {
        a(
          new Error('THREE.GLTFLoader: Failed to load buffer "' + t.uri + '".'),
        );
      });
    });
  }
  loadBufferView(e) {
    const t = this.json.bufferViews[e];
    return this.getDependency("buffer", t.buffer).then(function (n) {
      const r = t.byteLength || 0,
        s = t.byteOffset || 0;
      return n.slice(s, s + r);
    });
  }
  loadAccessor(e) {
    const t = this,
      n = this.json,
      r = this.json.accessors[e];
    if (r.bufferView === void 0 && r.sparse === void 0) {
      const a = hc[r.type],
        o = Ts[r.componentType],
        A = r.normalized === !0,
        l = new o(r.count * a);
      return Promise.resolve(new zt(l, a, A));
    }
    const s = [];
    return (
      r.bufferView !== void 0
        ? s.push(this.getDependency("bufferView", r.bufferView))
        : s.push(null),
      r.sparse !== void 0 &&
        (s.push(this.getDependency("bufferView", r.sparse.indices.bufferView)),
        s.push(this.getDependency("bufferView", r.sparse.values.bufferView))),
      Promise.all(s).then(function (a) {
        const o = a[0],
          A = hc[r.type],
          l = Ts[r.componentType],
          c = l.BYTES_PER_ELEMENT,
          h = c * A,
          d = r.byteOffset || 0,
          u =
            r.bufferView !== void 0
              ? n.bufferViews[r.bufferView].byteStride
              : void 0,
          p = r.normalized === !0;
        let v, g;
        if (u && u !== h) {
          const m = Math.floor(d / u),
            y =
              "InterleavedBuffer:" +
              r.bufferView +
              ":" +
              r.componentType +
              ":" +
              m +
              ":" +
              r.count;
          let C = t.cache.get(y);
          (C ||
            ((v = new l(o, m * u, (r.count * u) / c)),
            (C = new Tm(v, u / c)),
            t.cache.add(y, C)),
            (g = new Va(C, A, (d % u) / c, p)));
        } else
          (o === null
            ? (v = new l(r.count * A))
            : (v = new l(o, d, r.count * A)),
            (g = new zt(v, A, p)));
        if (r.sparse !== void 0) {
          const m = hc.SCALAR,
            y = Ts[r.sparse.indices.componentType],
            C = r.sparse.indices.byteOffset || 0,
            E = r.sparse.values.byteOffset || 0,
            w = new y(a[1], C, r.sparse.count * m),
            S = new l(a[2], E, r.sparse.count * A);
          (o !== null &&
            (g = new zt(g.array.slice(), g.itemSize, g.normalized)),
            (g.normalized = !1));
          for (let k = 0, x = w.length; k < x; k++) {
            const T = w[k];
            if (
              (g.setX(T, S[k * A]),
              A >= 2 && g.setY(T, S[k * A + 1]),
              A >= 3 && g.setZ(T, S[k * A + 2]),
              A >= 4 && g.setW(T, S[k * A + 3]),
              A >= 5)
            )
              throw new Error(
                "THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.",
              );
          }
          g.normalized = p;
        }
        return g;
      })
    );
  }
  loadTexture(e) {
    const t = this.json,
      n = this.options,
      s = t.textures[e].source,
      a = t.images[s];
    let o = this.textureLoader;
    if (a.uri) {
      const A = n.manager.getHandler(a.uri);
      A !== null && (o = A);
    }
    return this.loadTextureImage(e, s, o);
  }
  loadTextureImage(e, t, n) {
    const r = this,
      s = this.json,
      a = s.textures[e],
      o = s.images[t],
      A = (o.uri || o.bufferView) + ":" + a.sampler;
    if (this.textureCache[A]) return this.textureCache[A];
    const l = this.loadImageSource(t, n)
      .then(function (c) {
        ((c.flipY = !1),
          (c.name = a.name || o.name || ""),
          c.name === "" &&
            typeof o.uri == "string" &&
            o.uri.startsWith("data:image/") === !1 &&
            (c.name = o.uri));
        const d = (s.samplers || {})[a.sampler] || {};
        return (
          (c.magFilter = Zf[d.magFilter] || qt),
          (c.minFilter = Zf[d.minFilter] || pr),
          (c.wrapS = Qf[d.wrapS] || ci),
          (c.wrapT = Qf[d.wrapT] || ci),
          (c.generateMipmaps =
            !c.isCompressedTexture && c.minFilter !== Yt && c.minFilter !== qt),
          r.associations.set(c, { textures: e }),
          c
        );
      })
      .catch(function () {
        return null;
      });
    return ((this.textureCache[A] = l), l);
  }
  loadImageSource(e, t) {
    const n = this,
      r = this.json,
      s = this.options;
    if (this.sourceCache[e] !== void 0)
      return this.sourceCache[e].then((h) => h.clone());
    const a = r.images[e],
      o = self.URL || self.webkitURL;
    let A = a.uri || "",
      l = !1;
    if (a.bufferView !== void 0)
      A = n.getDependency("bufferView", a.bufferView).then(function (h) {
        l = !0;
        const d = new Blob([h], { type: a.mimeType });
        return ((A = o.createObjectURL(d)), A);
      });
    else if (a.uri === void 0)
      throw new Error(
        "THREE.GLTFLoader: Image " + e + " is missing URI and bufferView",
      );
    const c = Promise.resolve(A)
      .then(function (h) {
        return new Promise(function (d, u) {
          let p = d;
          (t.isImageBitmapLoader === !0 &&
            (p = function (v) {
              const g = new Zt(v);
              ((g.needsUpdate = !0), d(g));
            }),
            t.load(Ia.resolveURL(h, s.path), p, void 0, u));
        });
      })
      .then(function (h) {
        return (
          l === !0 && o.revokeObjectURL(A),
          hr(h, a),
          (h.userData.mimeType = a.mimeType || Ub(a.uri)),
          h
        );
      })
      .catch(function (h) {
        throw (console.error("THREE.GLTFLoader: Couldn't load texture", A), h);
      });
    return ((this.sourceCache[e] = c), c);
  }
  assignTexture(e, t, n, r) {
    const s = this;
    return this.getDependency("texture", n.index).then(function (a) {
      if (!a) return null;
      if (
        (n.texCoord !== void 0 &&
          n.texCoord > 0 &&
          ((a = a.clone()), (a.channel = n.texCoord)),
        s.extensions[St.KHR_TEXTURE_TRANSFORM])
      ) {
        const o =
          n.extensions !== void 0
            ? n.extensions[St.KHR_TEXTURE_TRANSFORM]
            : void 0;
        if (o) {
          const A = s.associations.get(a);
          ((a = s.extensions[St.KHR_TEXTURE_TRANSFORM].extendTexture(a, o)),
            s.associations.set(a, A));
        }
      }
      return (r !== void 0 && (a.colorSpace = r), (e[t] = a), a);
    });
  }
  assignFinalMaterial(e) {
    const t = e.geometry;
    let n = e.material;
    const r = t.attributes.tangent === void 0,
      s = t.attributes.color !== void 0,
      a = t.attributes.normal === void 0;
    if (e.isPoints) {
      const o = "PointsMaterial:" + n.uuid;
      let A = this.cache.get(o);
      (A ||
        ((A = new ws()),
        Qt.prototype.copy.call(A, n),
        A.color.copy(n.color),
        (A.map = n.map),
        (A.sizeAttenuation = !1),
        this.cache.add(o, A)),
        (n = A));
    } else if (e.isLine) {
      const o = "LineBasicMaterial:" + n.uuid;
      let A = this.cache.get(o);
      (A ||
        ((A = new Gi()),
        Qt.prototype.copy.call(A, n),
        A.color.copy(n.color),
        (A.map = n.map),
        this.cache.add(o, A)),
        (n = A));
    }
    if (r || s || a) {
      let o = "ClonedMaterial:" + n.uuid + ":";
      (r && (o += "derivative-tangents:"),
        s && (o += "vertex-colors:"),
        a && (o += "flat-shading:"));
      let A = this.cache.get(o);
      (A ||
        ((A = n.clone()),
        s && (A.vertexColors = !0),
        a && (A.flatShading = !0),
        r &&
          (A.normalScale && (A.normalScale.y *= -1),
          A.clearcoatNormalScale && (A.clearcoatNormalScale.y *= -1)),
        this.cache.add(o, A),
        this.associations.set(A, this.associations.get(n))),
        (n = A));
    }
    e.material = n;
  }
  getMaterialType() {
    return lt;
  }
  loadMaterial(e) {
    const t = this,
      n = this.json,
      r = this.extensions,
      s = n.materials[e];
    let a;
    const o = {},
      A = s.extensions || {},
      l = [];
    if (A[St.KHR_MATERIALS_UNLIT]) {
      const h = r[St.KHR_MATERIALS_UNLIT];
      ((a = h.getMaterialType()), l.push(h.extendParams(o, s, t)));
    } else {
      const h = s.pbrMetallicRoughness || {};
      if (
        ((o.color = new Ne(1, 1, 1)),
        (o.opacity = 1),
        Array.isArray(h.baseColorFactor))
      ) {
        const d = h.baseColorFactor;
        (o.color.setRGB(d[0], d[1], d[2], kn), (o.opacity = d[3]));
      }
      (h.baseColorTexture !== void 0 &&
        l.push(t.assignTexture(o, "map", h.baseColorTexture, Ht)),
        (o.metalness = h.metallicFactor !== void 0 ? h.metallicFactor : 1),
        (o.roughness = h.roughnessFactor !== void 0 ? h.roughnessFactor : 1),
        h.metallicRoughnessTexture !== void 0 &&
          (l.push(
            t.assignTexture(o, "metalnessMap", h.metallicRoughnessTexture),
          ),
          l.push(
            t.assignTexture(o, "roughnessMap", h.metallicRoughnessTexture),
          )),
        (a = this._invokeOne(function (d) {
          return d.getMaterialType && d.getMaterialType(e);
        })),
        l.push(
          Promise.all(
            this._invokeAll(function (d) {
              return d.extendMaterialParams && d.extendMaterialParams(e, o);
            }),
          ),
        ));
    }
    s.doubleSided === !0 && (o.side = Ut);
    const c = s.alphaMode || dc.OPAQUE;
    if (
      (c === dc.BLEND
        ? ((o.transparent = !0), (o.depthWrite = !1))
        : ((o.transparent = !1),
          c === dc.MASK &&
            (o.alphaTest = s.alphaCutoff !== void 0 ? s.alphaCutoff : 0.5)),
      s.normalTexture !== void 0 &&
        a !== cn &&
        (l.push(t.assignTexture(o, "normalMap", s.normalTexture)),
        (o.normalScale = new Ae(1, 1)),
        s.normalTexture.scale !== void 0))
    ) {
      const h = s.normalTexture.scale;
      o.normalScale.set(h, h);
    }
    if (
      (s.occlusionTexture !== void 0 &&
        a !== cn &&
        (l.push(t.assignTexture(o, "aoMap", s.occlusionTexture)),
        s.occlusionTexture.strength !== void 0 &&
          (o.aoMapIntensity = s.occlusionTexture.strength)),
      s.emissiveFactor !== void 0 && a !== cn)
    ) {
      const h = s.emissiveFactor;
      o.emissive = new Ne().setRGB(h[0], h[1], h[2], kn);
    }
    return (
      s.emissiveTexture !== void 0 &&
        a !== cn &&
        l.push(t.assignTexture(o, "emissiveMap", s.emissiveTexture, Ht)),
      Promise.all(l).then(function () {
        const h = new a(o);
        return (
          s.name && (h.name = s.name),
          hr(h, s),
          t.associations.set(h, { materials: e }),
          s.extensions && _i(r, h, s),
          h
        );
      })
    );
  }
  createUniqueName(e) {
    const t = Rt.sanitizeNodeName(e || "");
    return t in this.nodeNamesUsed
      ? t + "_" + ++this.nodeNamesUsed[t]
      : ((this.nodeNamesUsed[t] = 0), t);
  }
  loadGeometries(e) {
    const t = this,
      n = this.extensions,
      r = this.primitiveCache;
    function s(o) {
      return n[St.KHR_DRACO_MESH_COMPRESSION]
        .decodePrimitive(o, t)
        .then(function (A) {
          return ep(A, o, t);
        });
    }
    const a = [];
    for (let o = 0, A = e.length; o < A; o++) {
      const l = e[o],
        c = Hb(l),
        h = r[c];
      if (h) a.push(h.promise);
      else {
        let d;
        (l.extensions && l.extensions[St.KHR_DRACO_MESH_COMPRESSION]
          ? (d = s(l))
          : (d = ep(new Ct(), l, t)),
          (r[c] = { primitive: l, promise: d }),
          a.push(d));
      }
    }
    return Promise.all(a);
  }
  loadMesh(e) {
    const t = this,
      n = this.json,
      r = this.extensions,
      s = n.meshes[e],
      a = s.primitives,
      o = [];
    for (let A = 0, l = a.length; A < l; A++) {
      const c =
        a[A].material === void 0
          ? Nb(this.cache)
          : this.getDependency("material", a[A].material);
      o.push(c);
    }
    return (
      o.push(t.loadGeometries(a)),
      Promise.all(o).then(function (A) {
        const l = A.slice(0, A.length - 1),
          c = A[A.length - 1],
          h = [];
        for (let u = 0, p = c.length; u < p; u++) {
          const v = c[u],
            g = a[u];
          let m;
          const y = l[u];
          if (
            g.mode === Nn.TRIANGLES ||
            g.mode === Nn.TRIANGLE_STRIP ||
            g.mode === Nn.TRIANGLE_FAN ||
            g.mode === void 0
          )
            ((m = s.isSkinnedMesh === !0 ? new zv(v, y) : new Ee(v, y)),
              m.isSkinnedMesh === !0 && m.normalizeSkinWeights(),
              g.mode === Nn.TRIANGLE_STRIP
                ? (m.geometry = Jf(m.geometry, Cm))
                : g.mode === Nn.TRIANGLE_FAN &&
                  (m.geometry = Jf(m.geometry, bh)));
          else if (g.mode === Nn.LINES) m = new Wa(v, y);
          else if (g.mode === Nn.LINE_STRIP) m = new rl(v, y);
          else if (g.mode === Nn.LINE_LOOP) m = new Yv(v, y);
          else if (g.mode === Nn.POINTS) m = new Ai(v, y);
          else
            throw new Error(
              "THREE.GLTFLoader: Primitive mode unsupported: " + g.mode,
            );
          (Object.keys(m.geometry.morphAttributes).length > 0 && Ob(m, s),
            (m.name = t.createUniqueName(s.name || "mesh_" + e)),
            hr(m, s),
            g.extensions && _i(r, m, g),
            t.assignFinalMaterial(m),
            h.push(m));
        }
        for (let u = 0, p = h.length; u < p; u++)
          t.associations.set(h[u], { meshes: e, primitives: u });
        if (h.length === 1) return (s.extensions && _i(r, h[0], s), h[0]);
        const d = new dt();
        (s.extensions && _i(r, d, s), t.associations.set(d, { meshes: e }));
        for (let u = 0, p = h.length; u < p; u++) d.add(h[u]);
        return d;
      })
    );
  }
  loadCamera(e) {
    let t;
    const n = this.json.cameras[e],
      r = n[n.type];
    if (!r) {
      console.warn("THREE.GLTFLoader: Missing camera parameters.");
      return;
    }
    return (
      n.type === "perspective"
        ? (t = new fn(
            Gt.radToDeg(r.yfov),
            r.aspectRatio || 1,
            r.znear || 1,
            r.zfar || 2e6,
          ))
        : n.type === "orthographic" &&
          (t = new lo(-r.xmag, r.xmag, r.ymag, -r.ymag, r.znear, r.zfar)),
      n.name && (t.name = this.createUniqueName(n.name)),
      hr(t, n),
      Promise.resolve(t)
    );
  }
  loadSkin(e) {
    const t = this.json.skins[e],
      n = [];
    for (let r = 0, s = t.joints.length; r < s; r++)
      n.push(this._loadNodeShallow(t.joints[r]));
    return (
      t.inverseBindMatrices !== void 0
        ? n.push(this.getDependency("accessor", t.inverseBindMatrices))
        : n.push(null),
      Promise.all(n).then(function (r) {
        const s = r.pop(),
          a = r,
          o = [],
          A = [];
        for (let l = 0, c = a.length; l < c; l++) {
          const h = a[l];
          if (h) {
            o.push(h);
            const d = new mt();
            (s !== null && d.fromArray(s.array, l * 16), A.push(d));
          } else
            console.warn(
              'THREE.GLTFLoader: Joint "%s" could not be found.',
              t.joints[l],
            );
        }
        return new xd(o, A);
      })
    );
  }
  loadAnimation(e) {
    const t = this.json,
      n = this,
      r = t.animations[e],
      s = r.name ? r.name : "animation_" + e,
      a = [],
      o = [],
      A = [],
      l = [],
      c = [];
    for (let h = 0, d = r.channels.length; h < d; h++) {
      const u = r.channels[h],
        p = r.samplers[u.sampler],
        v = u.target,
        g = v.node,
        m = r.parameters !== void 0 ? r.parameters[p.input] : p.input,
        y = r.parameters !== void 0 ? r.parameters[p.output] : p.output;
      v.node !== void 0 &&
        (a.push(this.getDependency("node", g)),
        o.push(this.getDependency("accessor", m)),
        A.push(this.getDependency("accessor", y)),
        l.push(p),
        c.push(v));
    }
    return Promise.all([
      Promise.all(a),
      Promise.all(o),
      Promise.all(A),
      Promise.all(l),
      Promise.all(c),
    ]).then(function (h) {
      const d = h[0],
        u = h[1],
        p = h[2],
        v = h[3],
        g = h[4],
        m = [];
      for (let C = 0, E = d.length; C < E; C++) {
        const w = d[C],
          S = u[C],
          k = p[C],
          x = v[C],
          T = g[C];
        if (w === void 0) continue;
        w.updateMatrix && w.updateMatrix();
        const R = n._createAnimationTracks(w, S, k, x, T);
        if (R) for (let D = 0; D < R.length; D++) m.push(R[D]);
      }
      const y = new qj(s, void 0, m);
      return (hr(y, r), y);
    });
  }
  createNodeMesh(e) {
    const t = this.json,
      n = this,
      r = t.nodes[e];
    return r.mesh === void 0
      ? null
      : n.getDependency("mesh", r.mesh).then(function (s) {
          const a = n._getNodeRef(n.meshCache, r.mesh, s);
          return (
            r.weights !== void 0 &&
              a.traverse(function (o) {
                if (o.isMesh)
                  for (let A = 0, l = r.weights.length; A < l; A++)
                    o.morphTargetInfluences[A] = r.weights[A];
              }),
            a
          );
        });
  }
  loadNode(e) {
    const t = this.json,
      n = this,
      r = t.nodes[e],
      s = n._loadNodeShallow(e),
      a = [],
      o = r.children || [];
    for (let l = 0, c = o.length; l < c; l++)
      a.push(n.getDependency("node", o[l]));
    const A =
      r.skin === void 0
        ? Promise.resolve(null)
        : n.getDependency("skin", r.skin);
    return Promise.all([s, Promise.all(a), A]).then(function (l) {
      const c = l[0],
        h = l[1],
        d = l[2];
      d !== null &&
        c.traverse(function (u) {
          u.isSkinnedMesh && u.bind(d, qb);
        });
      for (let u = 0, p = h.length; u < p; u++) c.add(h[u]);
      if (c.userData.pivot !== void 0 && h.length > 0) {
        const u = c.userData.pivot,
          p = h[0];
        ((c.pivot = new F().fromArray(u)),
          (c.position.x -= u[0]),
          (c.position.y -= u[1]),
          (c.position.z -= u[2]),
          p.position.set(0, 0, 0),
          delete c.userData.pivot);
      }
      return c;
    });
  }
  _loadNodeShallow(e) {
    const t = this.json,
      n = this.extensions,
      r = this;
    if (this.nodeCache[e] !== void 0) return this.nodeCache[e];
    const s = t.nodes[e],
      a = s.name ? r.createUniqueName(s.name) : "",
      o = [],
      A = r._invokeOne(function (l) {
        return l.createNodeMesh && l.createNodeMesh(e);
      });
    return (
      A && o.push(A),
      s.camera !== void 0 &&
        o.push(
          r.getDependency("camera", s.camera).then(function (l) {
            return r._getNodeRef(r.cameraCache, s.camera, l);
          }),
        ),
      r
        ._invokeAll(function (l) {
          return l.createNodeAttachment && l.createNodeAttachment(e);
        })
        .forEach(function (l) {
          o.push(l);
        }),
      (this.nodeCache[e] = Promise.all(o).then(function (l) {
        let c;
        if (
          (s.isBone === !0
            ? (c = new Im())
            : l.length > 1
              ? (c = new dt())
              : l.length === 1
                ? (c = l[0])
                : (c = new It()),
          c !== l[0])
        )
          for (let h = 0, d = l.length; h < d; h++) c.add(l[h]);
        if (
          (s.name && ((c.userData.name = s.name), (c.name = a)),
          hr(c, s),
          s.extensions && _i(n, c, s),
          s.matrix !== void 0)
        ) {
          const h = new mt();
          (h.fromArray(s.matrix), c.applyMatrix4(h));
        } else
          (s.translation !== void 0 && c.position.fromArray(s.translation),
            s.rotation !== void 0 && c.quaternion.fromArray(s.rotation),
            s.scale !== void 0 && c.scale.fromArray(s.scale));
        if (!r.associations.has(c)) r.associations.set(c, {});
        else if (s.mesh !== void 0 && r.meshCache.refs[s.mesh] > 1) {
          const h = r.associations.get(c);
          r.associations.set(c, { ...h });
        }
        return ((r.associations.get(c).nodes = e), c);
      })),
      this.nodeCache[e]
    );
  }
  loadScene(e) {
    const t = this.extensions,
      n = this.json.scenes[e],
      r = this,
      s = new dt();
    (n.name && (s.name = r.createUniqueName(n.name)),
      hr(s, n),
      n.extensions && _i(t, s, n));
    const a = n.nodes || [],
      o = [];
    for (let A = 0, l = a.length; A < l; A++)
      o.push(r.getDependency("node", a[A]));
    return Promise.all(o).then(function (A) {
      for (let c = 0, h = A.length; c < h; c++) {
        const d = A[c];
        d.parent !== null ? s.add(db(d)) : s.add(d);
      }
      const l = (c) => {
        const h = new Map();
        for (const [d, u] of r.associations)
          (d instanceof Qt || d instanceof Zt) && h.set(d, u);
        return (
          c.traverse((d) => {
            const u = r.associations.get(d);
            u != null && h.set(d, u);
          }),
          h
        );
      };
      return ((r.associations = l(s)), s);
    });
  }
  _createAnimationTracks(e, t, n, r, s) {
    const a = [],
      o = e.name ? e.name : e.uuid,
      A = [];
    function l(u) {
      u.morphTargetInfluences && A.push(u.name ? u.name : u.uuid);
    }
    Qr[s.path] === Qr.weights
      ? (l(e), e.isGroup && e.children.forEach(l))
      : A.push(o);
    let c;
    switch (Qr[s.path]) {
      case Qr.weights:
        c = Za;
        break;
      case Qr.rotation:
        c = Qa;
        break;
      case Qr.translation:
      case Qr.scale:
        c = DA;
        break;
      default:
        switch (n.itemSize) {
          case 1:
            c = Za;
            break;
          case 2:
          case 3:
          default:
            c = DA;
            break;
        }
        break;
    }
    const h = r.interpolation !== void 0 ? Db[r.interpolation] : Ua,
      d = this._getArrayFromAccessor(n);
    for (let u = 0, p = A.length; u < p; u++) {
      const v = new c(A[u] + "." + Qr[s.path], t.array, d, h);
      (r.interpolation === "CUBICSPLINE" &&
        this._createCubicSplineTrackInterpolant(v),
        a.push(v));
    }
    return a;
  }
  _getArrayFromAccessor(e) {
    let t = e.array;
    if (e.normalized) {
      const n = Nh(t.constructor),
        r = new Float32Array(t.length);
      for (let s = 0, a = t.length; s < a; s++) r[s] = t[s] * n;
      t = r;
    }
    return t;
  }
  _createCubicSplineTrackInterpolant(e) {
    ((e.createInterpolant = function (n) {
      const r = this instanceof Qa ? Fb : P0;
      return new r(this.times, this.values, this.getValueSize() / 3, n);
    }),
      (e.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline = !0));
  }
}

function zb(i, e, t) {
  const n = e.attributes,
    r = new xr();
  if (n.POSITION !== void 0) {
    const o = t.json.accessors[n.POSITION],
      A = o.min,
      l = o.max;
    if (A !== void 0 && l !== void 0) {
      if (
        (r.set(new F(A[0], A[1], A[2]), new F(l[0], l[1], l[2])), o.normalized)
      ) {
        const c = Nh(Ts[o.componentType]);
        (r.min.multiplyScalar(c), r.max.multiplyScalar(c));
      }
    } else {
      console.warn(
        "THREE.GLTFLoader: Missing min/max properties for accessor POSITION.",
      );
      return;
    }
  } else return;
  const s = e.targets;
  if (s !== void 0) {
    const o = new F(),
      A = new F();
    for (let l = 0, c = s.length; l < c; l++) {
      const h = s[l];
      if (h.POSITION !== void 0) {
        const d = t.json.accessors[h.POSITION],
          u = d.min,
          p = d.max;
        if (u !== void 0 && p !== void 0) {
          if (
            (A.setX(Math.max(Math.abs(u[0]), Math.abs(p[0]))),
            A.setY(Math.max(Math.abs(u[1]), Math.abs(p[1]))),
            A.setZ(Math.max(Math.abs(u[2]), Math.abs(p[2]))),
            d.normalized)
          ) {
            const v = Nh(Ts[d.componentType]);
            A.multiplyScalar(v);
          }
          o.max(A);
        } else
          console.warn(
            "THREE.GLTFLoader: Missing min/max properties for accessor POSITION.",
          );
      }
    }
    r.expandByVector(o);
  }
  i.boundingBox = r;
  const a = new Cr();
  (r.getCenter(a.center),
    (a.radius = r.min.distanceTo(r.max) / 2),
    (i.boundingSphere = a));
}

function ep(i, e, t) {
  const n = e.attributes,
    r = [];
  function s(a, o) {
    return t.getDependency("accessor", a).then(function (A) {
      i.setAttribute(o, A);
    });
  }
  for (const a in n) {
    const o = Dh[a] || a.toLowerCase();
    o in i.attributes || r.push(s(n[a], o));
  }
  if (e.indices !== void 0 && !i.index) {
    const a = t.getDependency("accessor", e.indices).then(function (o) {
      i.setIndex(o);
    });
    r.push(a);
  }
  return (
    bt.workingColorSpace !== kn &&
      "COLOR_0" in n &&
      console.warn(
        `THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${bt.workingColorSpace}" not supported.`,
      ),
    hr(i, e),
    zb(i, e, t),
    Promise.all(r).then(function () {
      return e.targets !== void 0 ? Gb(i, e.targets, t) : i;
    })
  );
}

export { ho };
