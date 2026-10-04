// Preserved bundled dependency. See SOURCE.md and public/licenses/.
/**
 * @license Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */

/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */
const id = "185";

const bg = 0;

const nu = 1;

const Sg = 2;

const ka = 1;

const wg = 2;

const Ca = 3;

const $n = 0;

const pn = 1;

const Ut = 2;

const gr = 0;

const Gr = 1;

const li = 2;

const ru = 3;

const iu = 4;

const Mg = 5;

const Bi = 100;

const Bg = 101;

const kg = 102;

const Tg = 103;

const Rg = 104;

const Pg = 200;

const Ig = 201;

const Lg = 202;

const Fg = 203;

const Oc = 204;

const Hc = 205;

const Dg = 206;

const Ng = 207;

const Gg = 208;

const Og = 209;

const Hg = 210;

const Ug = 211;

const qg = 212;

const $g = 213;

const zg = 214;

const Uc = 0;

const qc = 1;

const $c = 2;

const Ls = 3;

const zc = 4;

const Vc = 5;

const Wc = 6;

const Xc = 7;

const YA = 0;

const Vg = 1;

const Wg = 2;

const vr = 0;

const sd = 1;

const ad = 2;

const od = 3;

const oo = 4;

const Ad = 5;

const ld = 6;

const cd = 7;

const su = "attached";

const Xg = "detached";

const mm = 300;

const Ui = 301;

const Fs = 302;

const _l = 303;

const El = 304;

const ZA = 306;

const ci = 1e3;

const fr = 1001;

const BA = 1002;

const Yt = 1003;

const gm = 1004;

const ba = 1005;

const qt = 1006;

const fA = 1007;

const pr = 1008;

const Mn = 1009;

const vm = 1010;

const jm = 1011;

const Ga = 1012;

const hd = 1013;

const Er = 1014;

const On = 1015;

const er = 1016;

const dd = 1017;

const ud = 1018;

const Oa = 1020;

const _m = 35902;

const Em = 35899;

const ym = 1021;

const xm = 1022;

const Hn = 1023;

const Hr = 1026;

const Ii = 1027;

const QA = 1028;

const fd = 1029;

const qi = 1030;

const pd = 1031;

const md = 1033;

const pA = 33776;

const mA = 33777;

const gA = 33778;

const vA = 33779;

const Jc = 35840;

const Kc = 35841;

const Yc = 35842;

const Zc = 35843;

const Qc = 36196;

const eh = 37492;

const th = 37496;

const nh = 37488;

const rh = 37489;

const kA = 37490;

const ih = 37491;

const sh = 37808;

const ah = 37809;

const oh = 37810;

const Ah = 37811;

const lh = 37812;

const ch = 37813;

const hh = 37814;

const dh = 37815;

const uh = 37816;

const fh = 37817;

const ph = 37818;

const mh = 37819;

const gh = 37820;

const vh = 37821;

const jh = 36492;

const _h = 36494;

const Eh = 36495;

const yh = 36283;

const xh = 36284;

const TA = 36285;

const Ch = 36286;

const Ha = 2300;

const Ua = 2301;

const yl = 2302;

const au = 2303;

const ou = 2400;

const Au = 2401;

const lu = 2402;

const Jg = 2500;

const Kg = 0;

const Cm = 1;

const bh = 2;

const Yg = 3200;

const Ds = 0;

const Zg = 1;

const si = "";

const Ht = "srgb";

const kn = "srgb-linear";

const RA = "linear";

const kt = "srgb";

const Yi = 7680;

const cu = 519;

const Qg = 512;

const ev = 513;

const tv = 514;

const gd = 515;

const nv = 516;

const rv = 517;

const vd = 518;

const iv = 519;

const Sh = 35044;

const qa = 35048;

const hu = "300 es";

const mr = 2e3;

const $a = 2001;

function sv(i) {
  for (let e = i.length - 1; e >= 0; --e) if (i[e] >= 65535) return !0;
  return !1;
}

function av(i) {
  return ArrayBuffer.isView(i) && !(i instanceof DataView);
}

function za(i) {
  return document.createElementNS("http://www.w3.org/1999/xhtml", i);
}

function ov() {
  const i = za("canvas");
  return ((i.style.display = "block"), i);
}

const du = {};

function PA(...i) {
  const e = "THREE." + i.shift();
  console.log(e, ...i);
}

function bm(i) {
  const e = i[0];
  if (typeof e == "string" && e.startsWith("TSL:")) {
    const t = i[1];
    t && t.isStackTrace
      ? (i[0] += " " + t.getLocation())
      : (i[1] =
          'Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.');
  }
  return i;
}

function it(...i) {
  i = bm(i);
  const e = "THREE." + i.shift();
  {
    const t = i[0];
    t && t.isStackTrace ? console.warn(t.getError(e)) : console.warn(e, ...i);
  }
}

function ut(...i) {
  i = bm(i);
  const e = "THREE." + i.shift();
  {
    const t = i[0];
    t && t.isStackTrace ? console.error(t.getError(e)) : console.error(e, ...i);
  }
}

function Ms(...i) {
  const e = i.join(" ");
  e in du || ((du[e] = !0), it(...i));
}

function Av(i, e, t) {
  return new Promise(function (n, r) {
    function s() {
      switch (i.clientWaitSync(e, i.SYNC_FLUSH_COMMANDS_BIT, 0)) {
        case i.WAIT_FAILED:
          r();
          break;
        case i.TIMEOUT_EXPIRED:
          setTimeout(s, t);
          break;
        default:
          n();
      }
    }
    setTimeout(s, t);
  });
}

const lv = {
  [Uc]: qc,
  [$c]: Wc,
  [zc]: Xc,
  [Ls]: Vc,
  [qc]: Uc,
  [Wc]: $c,
  [Xc]: zc,
  [Vc]: Ls,
};

class Wi {
  addEventListener(e, t) {
    this._listeners === void 0 && (this._listeners = {});
    const n = this._listeners;
    (n[e] === void 0 && (n[e] = []), n[e].indexOf(t) === -1 && n[e].push(t));
  }
  hasEventListener(e, t) {
    const n = this._listeners;
    return n === void 0 ? !1 : n[e] !== void 0 && n[e].indexOf(t) !== -1;
  }
  removeEventListener(e, t) {
    const n = this._listeners;
    if (n === void 0) return;
    const r = n[e];
    if (r !== void 0) {
      const s = r.indexOf(t);
      s !== -1 && r.splice(s, 1);
    }
  }
  dispatchEvent(e) {
    const t = this._listeners;
    if (t === void 0) return;
    const n = t[e.type];
    if (n !== void 0) {
      e.target = this;
      const r = n.slice(0);
      for (let s = 0, a = r.length; s < a; s++) r[s].call(this, e);
      e.target = null;
    }
  }
}

const hn = [
  "00",
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "0a",
  "0b",
  "0c",
  "0d",
  "0e",
  "0f",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "1a",
  "1b",
  "1c",
  "1d",
  "1e",
  "1f",
  "20",
  "21",
  "22",
  "23",
  "24",
  "25",
  "26",
  "27",
  "28",
  "29",
  "2a",
  "2b",
  "2c",
  "2d",
  "2e",
  "2f",
  "30",
  "31",
  "32",
  "33",
  "34",
  "35",
  "36",
  "37",
  "38",
  "39",
  "3a",
  "3b",
  "3c",
  "3d",
  "3e",
  "3f",
  "40",
  "41",
  "42",
  "43",
  "44",
  "45",
  "46",
  "47",
  "48",
  "49",
  "4a",
  "4b",
  "4c",
  "4d",
  "4e",
  "4f",
  "50",
  "51",
  "52",
  "53",
  "54",
  "55",
  "56",
  "57",
  "58",
  "59",
  "5a",
  "5b",
  "5c",
  "5d",
  "5e",
  "5f",
  "60",
  "61",
  "62",
  "63",
  "64",
  "65",
  "66",
  "67",
  "68",
  "69",
  "6a",
  "6b",
  "6c",
  "6d",
  "6e",
  "6f",
  "70",
  "71",
  "72",
  "73",
  "74",
  "75",
  "76",
  "77",
  "78",
  "79",
  "7a",
  "7b",
  "7c",
  "7d",
  "7e",
  "7f",
  "80",
  "81",
  "82",
  "83",
  "84",
  "85",
  "86",
  "87",
  "88",
  "89",
  "8a",
  "8b",
  "8c",
  "8d",
  "8e",
  "8f",
  "90",
  "91",
  "92",
  "93",
  "94",
  "95",
  "96",
  "97",
  "98",
  "99",
  "9a",
  "9b",
  "9c",
  "9d",
  "9e",
  "9f",
  "a0",
  "a1",
  "a2",
  "a3",
  "a4",
  "a5",
  "a6",
  "a7",
  "a8",
  "a9",
  "aa",
  "ab",
  "ac",
  "ad",
  "ae",
  "af",
  "b0",
  "b1",
  "b2",
  "b3",
  "b4",
  "b5",
  "b6",
  "b7",
  "b8",
  "b9",
  "ba",
  "bb",
  "bc",
  "bd",
  "be",
  "bf",
  "c0",
  "c1",
  "c2",
  "c3",
  "c4",
  "c5",
  "c6",
  "c7",
  "c8",
  "c9",
  "ca",
  "cb",
  "cc",
  "cd",
  "ce",
  "cf",
  "d0",
  "d1",
  "d2",
  "d3",
  "d4",
  "d5",
  "d6",
  "d7",
  "d8",
  "d9",
  "da",
  "db",
  "dc",
  "dd",
  "de",
  "df",
  "e0",
  "e1",
  "e2",
  "e3",
  "e4",
  "e5",
  "e6",
  "e7",
  "e8",
  "e9",
  "ea",
  "eb",
  "ec",
  "ed",
  "ee",
  "ef",
  "f0",
  "f1",
  "f2",
  "f3",
  "f4",
  "f5",
  "f6",
  "f7",
  "f8",
  "f9",
  "fa",
  "fb",
  "fc",
  "fd",
  "fe",
  "ff",
];

let uu = 1234567;

const Bs = Math.PI / 180;

const Ns = 180 / Math.PI;

function Un() {
  const i = (Math.random() * 4294967295) | 0,
    e = (Math.random() * 4294967295) | 0,
    t = (Math.random() * 4294967295) | 0,
    n = (Math.random() * 4294967295) | 0;
  return (
    hn[i & 255] +
    hn[(i >> 8) & 255] +
    hn[(i >> 16) & 255] +
    hn[(i >> 24) & 255] +
    "-" +
    hn[e & 255] +
    hn[(e >> 8) & 255] +
    "-" +
    hn[((e >> 16) & 15) | 64] +
    hn[(e >> 24) & 255] +
    "-" +
    hn[(t & 63) | 128] +
    hn[(t >> 8) & 255] +
    "-" +
    hn[(t >> 16) & 255] +
    hn[(t >> 24) & 255] +
    hn[n & 255] +
    hn[(n >> 8) & 255] +
    hn[(n >> 16) & 255] +
    hn[(n >> 24) & 255]
  ).toLowerCase();
}

function xt(i, e, t) {
  return Math.max(e, Math.min(t, i));
}

function jd(i, e) {
  return ((i % e) + e) % e;
}

function cv(i, e, t, n, r) {
  return n + ((i - e) * (r - n)) / (t - e);
}

function hv(i, e, t) {
  return i !== e ? (t - i) / (e - i) : 0;
}

function Ta(i, e, t) {
  return (1 - t) * i + t * e;
}

function dv(i, e, t, n) {
  return Ta(i, e, 1 - Math.exp(-t * n));
}

function uv(i, e = 1) {
  return e - Math.abs(jd(i, e * 2) - e);
}

function fv(i, e, t) {
  return i <= e
    ? 0
    : i >= t
      ? 1
      : ((i = (i - e) / (t - e)), i * i * (3 - 2 * i));
}

function pv(i, e, t) {
  return i <= e
    ? 0
    : i >= t
      ? 1
      : ((i = (i - e) / (t - e)), i * i * i * (i * (i * 6 - 15) + 10));
}

function mv(i, e) {
  return i + Math.floor(Math.random() * (e - i + 1));
}

function gv(i, e) {
  return i + Math.random() * (e - i);
}

function vv(i) {
  return i * (0.5 - Math.random());
}

function jv(i) {
  i !== void 0 && (uu = i);
  let e = (uu += 1831565813);
  return (
    (e = Math.imul(e ^ (e >>> 15), e | 1)),
    (e ^= e + Math.imul(e ^ (e >>> 7), e | 61)),
    ((e ^ (e >>> 14)) >>> 0) / 4294967296
  );
}

function _v(i) {
  return i * Bs;
}

function Ev(i) {
  return i * Ns;
}

function yv(i) {
  return (i & (i - 1)) === 0 && i !== 0;
}

function xv(i) {
  return Math.pow(2, Math.ceil(Math.log(i) / Math.LN2));
}

function Cv(i) {
  return Math.pow(2, Math.floor(Math.log(i) / Math.LN2));
}

function bv(i, e, t, n, r) {
  const s = Math.cos,
    a = Math.sin,
    o = s(t / 2),
    A = a(t / 2),
    l = s((e + n) / 2),
    c = a((e + n) / 2),
    h = s((e - n) / 2),
    d = a((e - n) / 2),
    u = s((n - e) / 2),
    p = a((n - e) / 2);
  switch (r) {
    case "XYX":
      i.set(o * c, A * h, A * d, o * l);
      break;
    case "YZY":
      i.set(A * d, o * c, A * h, o * l);
      break;
    case "ZXZ":
      i.set(A * h, A * d, o * c, o * l);
      break;
    case "XZX":
      i.set(o * c, A * p, A * u, o * l);
      break;
    case "YXY":
      i.set(A * u, o * c, A * p, o * l);
      break;
    case "ZYZ":
      i.set(A * p, A * u, o * c, o * l);
      break;
    default:
      it(
        "MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: " +
          r,
      );
  }
}

function Qn(i, e) {
  switch (e.constructor) {
    case Float32Array:
      return i;
    case Uint32Array:
      return i / 4294967295;
    case Uint16Array:
      return i / 65535;
    case Uint8Array:
      return i / 255;
    case Int32Array:
      return Math.max(i / 2147483647, -1);
    case Int16Array:
      return Math.max(i / 32767, -1);
    case Int8Array:
      return Math.max(i / 127, -1);
    default:
      throw new Error("THREE.MathUtils: Invalid component type.");
  }
}

function Tt(i, e) {
  switch (e.constructor) {
    case Float32Array:
      return i;
    case Uint32Array:
      return Math.round(i * 4294967295);
    case Uint16Array:
      return Math.round(i * 65535);
    case Uint8Array:
      return Math.round(i * 255);
    case Int32Array:
      return Math.round(i * 2147483647);
    case Int16Array:
      return Math.round(i * 32767);
    case Int8Array:
      return Math.round(i * 127);
    default:
      throw new Error("THREE.MathUtils: Invalid component type.");
  }
}

const Gt = {
    DEG2RAD: Bs,
    RAD2DEG: Ns,
    generateUUID: Un,
    clamp: xt,
    euclideanModulo: jd,
    mapLinear: cv,
    inverseLerp: hv,
    lerp: Ta,
    damp: dv,
    pingpong: uv,
    smoothstep: fv,
    smootherstep: pv,
    randInt: mv,
    randFloat: gv,
    randFloatSpread: vv,
    seededRandom: jv,
    degToRad: _v,
    radToDeg: Ev,
    isPowerOfTwo: yv,
    ceilPowerOfTwo: xv,
    floorPowerOfTwo: Cv,
    setQuaternionFromProperEuler: bv,
    normalize: Tt,
    denormalize: Qn,
  };

const Yd = class Yd {
    constructor(e = 0, t = 0) {
      ((this.x = e), (this.y = t));
    }
    get width() {
      return this.x;
    }
    set width(e) {
      this.x = e;
    }
    get height() {
      return this.y;
    }
    set height(e) {
      this.y = e;
    }
    set(e, t) {
      return ((this.x = e), (this.y = t), this);
    }
    setScalar(e) {
      return ((this.x = e), (this.y = e), this);
    }
    setX(e) {
      return ((this.x = e), this);
    }
    setY(e) {
      return ((this.y = e), this);
    }
    setComponent(e, t) {
      switch (e) {
        case 0:
          this.x = t;
          break;
        case 1:
          this.y = t;
          break;
        default:
          throw new Error("THREE.Vector2: index is out of range: " + e);
      }
      return this;
    }
    getComponent(e) {
      switch (e) {
        case 0:
          return this.x;
        case 1:
          return this.y;
        default:
          throw new Error("THREE.Vector2: index is out of range: " + e);
      }
    }
    clone() {
      return new this.constructor(this.x, this.y);
    }
    copy(e) {
      return ((this.x = e.x), (this.y = e.y), this);
    }
    add(e) {
      return ((this.x += e.x), (this.y += e.y), this);
    }
    addScalar(e) {
      return ((this.x += e), (this.y += e), this);
    }
    addVectors(e, t) {
      return ((this.x = e.x + t.x), (this.y = e.y + t.y), this);
    }
    addScaledVector(e, t) {
      return ((this.x += e.x * t), (this.y += e.y * t), this);
    }
    sub(e) {
      return ((this.x -= e.x), (this.y -= e.y), this);
    }
    subScalar(e) {
      return ((this.x -= e), (this.y -= e), this);
    }
    subVectors(e, t) {
      return ((this.x = e.x - t.x), (this.y = e.y - t.y), this);
    }
    multiply(e) {
      return ((this.x *= e.x), (this.y *= e.y), this);
    }
    multiplyScalar(e) {
      return ((this.x *= e), (this.y *= e), this);
    }
    divide(e) {
      return ((this.x /= e.x), (this.y /= e.y), this);
    }
    divideScalar(e) {
      return this.multiplyScalar(1 / e);
    }
    applyMatrix3(e) {
      const t = this.x,
        n = this.y,
        r = e.elements;
      return (
        (this.x = r[0] * t + r[3] * n + r[6]),
        (this.y = r[1] * t + r[4] * n + r[7]),
        this
      );
    }
    min(e) {
      return (
        (this.x = Math.min(this.x, e.x)),
        (this.y = Math.min(this.y, e.y)),
        this
      );
    }
    max(e) {
      return (
        (this.x = Math.max(this.x, e.x)),
        (this.y = Math.max(this.y, e.y)),
        this
      );
    }
    clamp(e, t) {
      return (
        (this.x = xt(this.x, e.x, t.x)),
        (this.y = xt(this.y, e.y, t.y)),
        this
      );
    }
    clampScalar(e, t) {
      return ((this.x = xt(this.x, e, t)), (this.y = xt(this.y, e, t)), this);
    }
    clampLength(e, t) {
      const n = this.length();
      return this.divideScalar(n || 1).multiplyScalar(xt(n, e, t));
    }
    floor() {
      return (
        (this.x = Math.floor(this.x)),
        (this.y = Math.floor(this.y)),
        this
      );
    }
    ceil() {
      return ((this.x = Math.ceil(this.x)), (this.y = Math.ceil(this.y)), this);
    }
    round() {
      return (
        (this.x = Math.round(this.x)),
        (this.y = Math.round(this.y)),
        this
      );
    }
    roundToZero() {
      return (
        (this.x = Math.trunc(this.x)),
        (this.y = Math.trunc(this.y)),
        this
      );
    }
    negate() {
      return ((this.x = -this.x), (this.y = -this.y), this);
    }
    dot(e) {
      return this.x * e.x + this.y * e.y;
    }
    cross(e) {
      return this.x * e.y - this.y * e.x;
    }
    lengthSq() {
      return this.x * this.x + this.y * this.y;
    }
    length() {
      return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    manhattanLength() {
      return Math.abs(this.x) + Math.abs(this.y);
    }
    normalize() {
      return this.divideScalar(this.length() || 1);
    }
    angle() {
      return Math.atan2(-this.y, -this.x) + Math.PI;
    }
    angleTo(e) {
      const t = Math.sqrt(this.lengthSq() * e.lengthSq());
      if (t === 0) return Math.PI / 2;
      const n = this.dot(e) / t;
      return Math.acos(xt(n, -1, 1));
    }
    distanceTo(e) {
      return Math.sqrt(this.distanceToSquared(e));
    }
    distanceToSquared(e) {
      const t = this.x - e.x,
        n = this.y - e.y;
      return t * t + n * n;
    }
    manhattanDistanceTo(e) {
      return Math.abs(this.x - e.x) + Math.abs(this.y - e.y);
    }
    setLength(e) {
      return this.normalize().multiplyScalar(e);
    }
    lerp(e, t) {
      return (
        (this.x += (e.x - this.x) * t),
        (this.y += (e.y - this.y) * t),
        this
      );
    }
    lerpVectors(e, t, n) {
      return (
        (this.x = e.x + (t.x - e.x) * n),
        (this.y = e.y + (t.y - e.y) * n),
        this
      );
    }
    equals(e) {
      return e.x === this.x && e.y === this.y;
    }
    fromArray(e, t = 0) {
      return ((this.x = e[t]), (this.y = e[t + 1]), this);
    }
    toArray(e = [], t = 0) {
      return ((e[t] = this.x), (e[t + 1] = this.y), e);
    }
    fromBufferAttribute(e, t) {
      return ((this.x = e.getX(t)), (this.y = e.getY(t)), this);
    }
    rotateAround(e, t) {
      const n = Math.cos(t),
        r = Math.sin(t),
        s = this.x - e.x,
        a = this.y - e.y;
      return (
        (this.x = s * n - a * r + e.x),
        (this.y = s * r + a * n + e.y),
        this
      );
    }
    random() {
      return ((this.x = Math.random()), (this.y = Math.random()), this);
    }
    *[Symbol.iterator]() {
      (yield this.x, yield this.y);
    }
  };

Yd.prototype.isVector2 = !0;

let Ae = Yd;

class jn {
  constructor(e = 0, t = 0, n = 0, r = 1) {
    ((this.isQuaternion = !0),
      (this._x = e),
      (this._y = t),
      (this._z = n),
      (this._w = r));
  }
  static slerpFlat(e, t, n, r, s, a, o) {
    let A = n[r + 0],
      l = n[r + 1],
      c = n[r + 2],
      h = n[r + 3],
      d = s[a + 0],
      u = s[a + 1],
      p = s[a + 2],
      v = s[a + 3];
    if (h !== v || A !== d || l !== u || c !== p) {
      let g = A * d + l * u + c * p + h * v;
      g < 0 && ((d = -d), (u = -u), (p = -p), (v = -v), (g = -g));
      let m = 1 - o;
      if (g < 0.9995) {
        const y = Math.acos(g),
          C = Math.sin(y);
        ((m = Math.sin(m * y) / C),
          (o = Math.sin(o * y) / C),
          (A = A * m + d * o),
          (l = l * m + u * o),
          (c = c * m + p * o),
          (h = h * m + v * o));
      } else {
        ((A = A * m + d * o),
          (l = l * m + u * o),
          (c = c * m + p * o),
          (h = h * m + v * o));
        const y = 1 / Math.sqrt(A * A + l * l + c * c + h * h);
        ((A *= y), (l *= y), (c *= y), (h *= y));
      }
    }
    ((e[t] = A), (e[t + 1] = l), (e[t + 2] = c), (e[t + 3] = h));
  }
  static multiplyQuaternionsFlat(e, t, n, r, s, a) {
    const o = n[r],
      A = n[r + 1],
      l = n[r + 2],
      c = n[r + 3],
      h = s[a],
      d = s[a + 1],
      u = s[a + 2],
      p = s[a + 3];
    return (
      (e[t] = o * p + c * h + A * u - l * d),
      (e[t + 1] = A * p + c * d + l * h - o * u),
      (e[t + 2] = l * p + c * u + o * d - A * h),
      (e[t + 3] = c * p - o * h - A * d - l * u),
      e
    );
  }
  get x() {
    return this._x;
  }
  set x(e) {
    ((this._x = e), this._onChangeCallback());
  }
  get y() {
    return this._y;
  }
  set y(e) {
    ((this._y = e), this._onChangeCallback());
  }
  get z() {
    return this._z;
  }
  set z(e) {
    ((this._z = e), this._onChangeCallback());
  }
  get w() {
    return this._w;
  }
  set w(e) {
    ((this._w = e), this._onChangeCallback());
  }
  set(e, t, n, r) {
    return (
      (this._x = e),
      (this._y = t),
      (this._z = n),
      (this._w = r),
      this._onChangeCallback(),
      this
    );
  }
  clone() {
    return new this.constructor(this._x, this._y, this._z, this._w);
  }
  copy(e) {
    return (
      (this._x = e.x),
      (this._y = e.y),
      (this._z = e.z),
      (this._w = e.w),
      this._onChangeCallback(),
      this
    );
  }
  setFromEuler(e, t = !0) {
    const n = e._x,
      r = e._y,
      s = e._z,
      a = e._order,
      o = Math.cos,
      A = Math.sin,
      l = o(n / 2),
      c = o(r / 2),
      h = o(s / 2),
      d = A(n / 2),
      u = A(r / 2),
      p = A(s / 2);
    switch (a) {
      case "XYZ":
        ((this._x = d * c * h + l * u * p),
          (this._y = l * u * h - d * c * p),
          (this._z = l * c * p + d * u * h),
          (this._w = l * c * h - d * u * p));
        break;
      case "YXZ":
        ((this._x = d * c * h + l * u * p),
          (this._y = l * u * h - d * c * p),
          (this._z = l * c * p - d * u * h),
          (this._w = l * c * h + d * u * p));
        break;
      case "ZXY":
        ((this._x = d * c * h - l * u * p),
          (this._y = l * u * h + d * c * p),
          (this._z = l * c * p + d * u * h),
          (this._w = l * c * h - d * u * p));
        break;
      case "ZYX":
        ((this._x = d * c * h - l * u * p),
          (this._y = l * u * h + d * c * p),
          (this._z = l * c * p - d * u * h),
          (this._w = l * c * h + d * u * p));
        break;
      case "YZX":
        ((this._x = d * c * h + l * u * p),
          (this._y = l * u * h + d * c * p),
          (this._z = l * c * p - d * u * h),
          (this._w = l * c * h - d * u * p));
        break;
      case "XZY":
        ((this._x = d * c * h - l * u * p),
          (this._y = l * u * h - d * c * p),
          (this._z = l * c * p + d * u * h),
          (this._w = l * c * h + d * u * p));
        break;
      default:
        it("Quaternion: .setFromEuler() encountered an unknown order: " + a);
    }
    return (t === !0 && this._onChangeCallback(), this);
  }
  setFromAxisAngle(e, t) {
    const n = t / 2,
      r = Math.sin(n);
    return (
      (this._x = e.x * r),
      (this._y = e.y * r),
      (this._z = e.z * r),
      (this._w = Math.cos(n)),
      this._onChangeCallback(),
      this
    );
  }
  setFromRotationMatrix(e) {
    const t = e.elements,
      n = t[0],
      r = t[4],
      s = t[8],
      a = t[1],
      o = t[5],
      A = t[9],
      l = t[2],
      c = t[6],
      h = t[10],
      d = n + o + h;
    if (d > 0) {
      const u = 0.5 / Math.sqrt(d + 1);
      ((this._w = 0.25 / u),
        (this._x = (c - A) * u),
        (this._y = (s - l) * u),
        (this._z = (a - r) * u));
    } else if (n > o && n > h) {
      const u = 2 * Math.sqrt(1 + n - o - h);
      ((this._w = (c - A) / u),
        (this._x = 0.25 * u),
        (this._y = (r + a) / u),
        (this._z = (s + l) / u));
    } else if (o > h) {
      const u = 2 * Math.sqrt(1 + o - n - h);
      ((this._w = (s - l) / u),
        (this._x = (r + a) / u),
        (this._y = 0.25 * u),
        (this._z = (A + c) / u));
    } else {
      const u = 2 * Math.sqrt(1 + h - n - o);
      ((this._w = (a - r) / u),
        (this._x = (s + l) / u),
        (this._y = (A + c) / u),
        (this._z = 0.25 * u));
    }
    return (this._onChangeCallback(), this);
  }
  setFromUnitVectors(e, t) {
    let n = e.dot(t) + 1;
    return (
      n < 1e-8
        ? ((n = 0),
          Math.abs(e.x) > Math.abs(e.z)
            ? ((this._x = -e.y), (this._y = e.x), (this._z = 0), (this._w = n))
            : ((this._x = 0), (this._y = -e.z), (this._z = e.y), (this._w = n)))
        : ((this._x = e.y * t.z - e.z * t.y),
          (this._y = e.z * t.x - e.x * t.z),
          (this._z = e.x * t.y - e.y * t.x),
          (this._w = n)),
      this.normalize()
    );
  }
  angleTo(e) {
    return 2 * Math.acos(Math.abs(xt(this.dot(e), -1, 1)));
  }
  rotateTowards(e, t) {
    const n = this.angleTo(e);
    if (n === 0) return this;
    const r = Math.min(1, t / n);
    return (this.slerp(e, r), this);
  }
  identity() {
    return this.set(0, 0, 0, 1);
  }
  invert() {
    return this.conjugate();
  }
  conjugate() {
    return (
      (this._x *= -1),
      (this._y *= -1),
      (this._z *= -1),
      this._onChangeCallback(),
      this
    );
  }
  dot(e) {
    return this._x * e._x + this._y * e._y + this._z * e._z + this._w * e._w;
  }
  lengthSq() {
    return (
      this._x * this._x +
      this._y * this._y +
      this._z * this._z +
      this._w * this._w
    );
  }
  length() {
    return Math.sqrt(
      this._x * this._x +
        this._y * this._y +
        this._z * this._z +
        this._w * this._w,
    );
  }
  normalize() {
    let e = this.length();
    return (
      e === 0
        ? ((this._x = 0), (this._y = 0), (this._z = 0), (this._w = 1))
        : ((e = 1 / e),
          (this._x = this._x * e),
          (this._y = this._y * e),
          (this._z = this._z * e),
          (this._w = this._w * e)),
      this._onChangeCallback(),
      this
    );
  }
  multiply(e) {
    return this.multiplyQuaternions(this, e);
  }
  premultiply(e) {
    return this.multiplyQuaternions(e, this);
  }
  multiplyQuaternions(e, t) {
    const n = e._x,
      r = e._y,
      s = e._z,
      a = e._w,
      o = t._x,
      A = t._y,
      l = t._z,
      c = t._w;
    return (
      (this._x = n * c + a * o + r * l - s * A),
      (this._y = r * c + a * A + s * o - n * l),
      (this._z = s * c + a * l + n * A - r * o),
      (this._w = a * c - n * o - r * A - s * l),
      this._onChangeCallback(),
      this
    );
  }
  slerp(e, t) {
    let n = e._x,
      r = e._y,
      s = e._z,
      a = e._w,
      o = this.dot(e);
    o < 0 && ((n = -n), (r = -r), (s = -s), (a = -a), (o = -o));
    let A = 1 - t;
    if (o < 0.9995) {
      const l = Math.acos(o),
        c = Math.sin(l);
      ((A = Math.sin(A * l) / c),
        (t = Math.sin(t * l) / c),
        (this._x = this._x * A + n * t),
        (this._y = this._y * A + r * t),
        (this._z = this._z * A + s * t),
        (this._w = this._w * A + a * t),
        this._onChangeCallback());
    } else
      ((this._x = this._x * A + n * t),
        (this._y = this._y * A + r * t),
        (this._z = this._z * A + s * t),
        (this._w = this._w * A + a * t),
        this.normalize());
    return this;
  }
  slerpQuaternions(e, t, n) {
    return this.copy(e).slerp(t, n);
  }
  random() {
    const e = 2 * Math.PI * Math.random(),
      t = 2 * Math.PI * Math.random(),
      n = Math.random(),
      r = Math.sqrt(1 - n),
      s = Math.sqrt(n);
    return this.set(
      r * Math.sin(e),
      r * Math.cos(e),
      s * Math.sin(t),
      s * Math.cos(t),
    );
  }
  equals(e) {
    return (
      e._x === this._x &&
      e._y === this._y &&
      e._z === this._z &&
      e._w === this._w
    );
  }
  fromArray(e, t = 0) {
    return (
      (this._x = e[t]),
      (this._y = e[t + 1]),
      (this._z = e[t + 2]),
      (this._w = e[t + 3]),
      this._onChangeCallback(),
      this
    );
  }
  toArray(e = [], t = 0) {
    return (
      (e[t] = this._x),
      (e[t + 1] = this._y),
      (e[t + 2] = this._z),
      (e[t + 3] = this._w),
      e
    );
  }
  fromBufferAttribute(e, t) {
    return (
      (this._x = e.getX(t)),
      (this._y = e.getY(t)),
      (this._z = e.getZ(t)),
      (this._w = e.getW(t)),
      this._onChangeCallback(),
      this
    );
  }
  toJSON() {
    return this.toArray();
  }
  _onChange(e) {
    return ((this._onChangeCallback = e), this);
  }
  _onChangeCallback() {}
  *[Symbol.iterator]() {
    (yield this._x, yield this._y, yield this._z, yield this._w);
  }
}

const Zd = class Zd {
  constructor(e = 0, t = 0, n = 0) {
    ((this.x = e), (this.y = t), (this.z = n));
  }
  set(e, t, n) {
    return (
      n === void 0 && (n = this.z),
      (this.x = e),
      (this.y = t),
      (this.z = n),
      this
    );
  }
  setScalar(e) {
    return ((this.x = e), (this.y = e), (this.z = e), this);
  }
  setX(e) {
    return ((this.x = e), this);
  }
  setY(e) {
    return ((this.y = e), this);
  }
  setZ(e) {
    return ((this.z = e), this);
  }
  setComponent(e, t) {
    switch (e) {
      case 0:
        this.x = t;
        break;
      case 1:
        this.y = t;
        break;
      case 2:
        this.z = t;
        break;
      default:
        throw new Error("THREE.Vector3: index is out of range: " + e);
    }
    return this;
  }
  getComponent(e) {
    switch (e) {
      case 0:
        return this.x;
      case 1:
        return this.y;
      case 2:
        return this.z;
      default:
        throw new Error("THREE.Vector3: index is out of range: " + e);
    }
  }
  clone() {
    return new this.constructor(this.x, this.y, this.z);
  }
  copy(e) {
    return ((this.x = e.x), (this.y = e.y), (this.z = e.z), this);
  }
  add(e) {
    return ((this.x += e.x), (this.y += e.y), (this.z += e.z), this);
  }
  addScalar(e) {
    return ((this.x += e), (this.y += e), (this.z += e), this);
  }
  addVectors(e, t) {
    return (
      (this.x = e.x + t.x),
      (this.y = e.y + t.y),
      (this.z = e.z + t.z),
      this
    );
  }
  addScaledVector(e, t) {
    return (
      (this.x += e.x * t),
      (this.y += e.y * t),
      (this.z += e.z * t),
      this
    );
  }
  sub(e) {
    return ((this.x -= e.x), (this.y -= e.y), (this.z -= e.z), this);
  }
  subScalar(e) {
    return ((this.x -= e), (this.y -= e), (this.z -= e), this);
  }
  subVectors(e, t) {
    return (
      (this.x = e.x - t.x),
      (this.y = e.y - t.y),
      (this.z = e.z - t.z),
      this
    );
  }
  multiply(e) {
    return ((this.x *= e.x), (this.y *= e.y), (this.z *= e.z), this);
  }
  multiplyScalar(e) {
    return ((this.x *= e), (this.y *= e), (this.z *= e), this);
  }
  multiplyVectors(e, t) {
    return (
      (this.x = e.x * t.x),
      (this.y = e.y * t.y),
      (this.z = e.z * t.z),
      this
    );
  }
  applyEuler(e) {
    return this.applyQuaternion(fu.setFromEuler(e));
  }
  applyAxisAngle(e, t) {
    return this.applyQuaternion(fu.setFromAxisAngle(e, t));
  }
  applyMatrix3(e) {
    const t = this.x,
      n = this.y,
      r = this.z,
      s = e.elements;
    return (
      (this.x = s[0] * t + s[3] * n + s[6] * r),
      (this.y = s[1] * t + s[4] * n + s[7] * r),
      (this.z = s[2] * t + s[5] * n + s[8] * r),
      this
    );
  }
  applyNormalMatrix(e) {
    return this.applyMatrix3(e).normalize();
  }
  applyMatrix4(e) {
    const t = this.x,
      n = this.y,
      r = this.z,
      s = e.elements,
      a = 1 / (s[3] * t + s[7] * n + s[11] * r + s[15]);
    return (
      (this.x = (s[0] * t + s[4] * n + s[8] * r + s[12]) * a),
      (this.y = (s[1] * t + s[5] * n + s[9] * r + s[13]) * a),
      (this.z = (s[2] * t + s[6] * n + s[10] * r + s[14]) * a),
      this
    );
  }
  applyQuaternion(e) {
    const t = this.x,
      n = this.y,
      r = this.z,
      s = e.x,
      a = e.y,
      o = e.z,
      A = e.w,
      l = 2 * (a * r - o * n),
      c = 2 * (o * t - s * r),
      h = 2 * (s * n - a * t);
    return (
      (this.x = t + A * l + a * h - o * c),
      (this.y = n + A * c + o * l - s * h),
      (this.z = r + A * h + s * c - a * l),
      this
    );
  }
  project(e) {
    return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(
      e.projectionMatrix,
    );
  }
  unproject(e) {
    return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(
      e.matrixWorld,
    );
  }
  transformDirection(e) {
    const t = this.x,
      n = this.y,
      r = this.z,
      s = e.elements;
    return (
      (this.x = s[0] * t + s[4] * n + s[8] * r),
      (this.y = s[1] * t + s[5] * n + s[9] * r),
      (this.z = s[2] * t + s[6] * n + s[10] * r),
      this.normalize()
    );
  }
  divide(e) {
    return ((this.x /= e.x), (this.y /= e.y), (this.z /= e.z), this);
  }
  divideScalar(e) {
    return this.multiplyScalar(1 / e);
  }
  min(e) {
    return (
      (this.x = Math.min(this.x, e.x)),
      (this.y = Math.min(this.y, e.y)),
      (this.z = Math.min(this.z, e.z)),
      this
    );
  }
  max(e) {
    return (
      (this.x = Math.max(this.x, e.x)),
      (this.y = Math.max(this.y, e.y)),
      (this.z = Math.max(this.z, e.z)),
      this
    );
  }
  clamp(e, t) {
    return (
      (this.x = xt(this.x, e.x, t.x)),
      (this.y = xt(this.y, e.y, t.y)),
      (this.z = xt(this.z, e.z, t.z)),
      this
    );
  }
  clampScalar(e, t) {
    return (
      (this.x = xt(this.x, e, t)),
      (this.y = xt(this.y, e, t)),
      (this.z = xt(this.z, e, t)),
      this
    );
  }
  clampLength(e, t) {
    const n = this.length();
    return this.divideScalar(n || 1).multiplyScalar(xt(n, e, t));
  }
  floor() {
    return (
      (this.x = Math.floor(this.x)),
      (this.y = Math.floor(this.y)),
      (this.z = Math.floor(this.z)),
      this
    );
  }
  ceil() {
    return (
      (this.x = Math.ceil(this.x)),
      (this.y = Math.ceil(this.y)),
      (this.z = Math.ceil(this.z)),
      this
    );
  }
  round() {
    return (
      (this.x = Math.round(this.x)),
      (this.y = Math.round(this.y)),
      (this.z = Math.round(this.z)),
      this
    );
  }
  roundToZero() {
    return (
      (this.x = Math.trunc(this.x)),
      (this.y = Math.trunc(this.y)),
      (this.z = Math.trunc(this.z)),
      this
    );
  }
  negate() {
    return ((this.x = -this.x), (this.y = -this.y), (this.z = -this.z), this);
  }
  dot(e) {
    return this.x * e.x + this.y * e.y + this.z * e.z;
  }
  lengthSq() {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }
  manhattanLength() {
    return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z);
  }
  normalize() {
    return this.divideScalar(this.length() || 1);
  }
  setLength(e) {
    return this.normalize().multiplyScalar(e);
  }
  lerp(e, t) {
    return (
      (this.x += (e.x - this.x) * t),
      (this.y += (e.y - this.y) * t),
      (this.z += (e.z - this.z) * t),
      this
    );
  }
  lerpVectors(e, t, n) {
    return (
      (this.x = e.x + (t.x - e.x) * n),
      (this.y = e.y + (t.y - e.y) * n),
      (this.z = e.z + (t.z - e.z) * n),
      this
    );
  }
  cross(e) {
    return this.crossVectors(this, e);
  }
  crossVectors(e, t) {
    const n = e.x,
      r = e.y,
      s = e.z,
      a = t.x,
      o = t.y,
      A = t.z;
    return (
      (this.x = r * A - s * o),
      (this.y = s * a - n * A),
      (this.z = n * o - r * a),
      this
    );
  }
  projectOnVector(e) {
    const t = e.lengthSq();
    if (t === 0) return this.set(0, 0, 0);
    const n = e.dot(this) / t;
    return this.copy(e).multiplyScalar(n);
  }
  projectOnPlane(e) {
    return (xl.copy(this).projectOnVector(e), this.sub(xl));
  }
  reflect(e) {
    return this.sub(xl.copy(e).multiplyScalar(2 * this.dot(e)));
  }
  angleTo(e) {
    const t = Math.sqrt(this.lengthSq() * e.lengthSq());
    if (t === 0) return Math.PI / 2;
    const n = this.dot(e) / t;
    return Math.acos(xt(n, -1, 1));
  }
  distanceTo(e) {
    return Math.sqrt(this.distanceToSquared(e));
  }
  distanceToSquared(e) {
    const t = this.x - e.x,
      n = this.y - e.y,
      r = this.z - e.z;
    return t * t + n * n + r * r;
  }
  manhattanDistanceTo(e) {
    return (
      Math.abs(this.x - e.x) + Math.abs(this.y - e.y) + Math.abs(this.z - e.z)
    );
  }
  setFromSpherical(e) {
    return this.setFromSphericalCoords(e.radius, e.phi, e.theta);
  }
  setFromSphericalCoords(e, t, n) {
    const r = Math.sin(t) * e;
    return (
      (this.x = r * Math.sin(n)),
      (this.y = Math.cos(t) * e),
      (this.z = r * Math.cos(n)),
      this
    );
  }
  setFromCylindrical(e) {
    return this.setFromCylindricalCoords(e.radius, e.theta, e.y);
  }
  setFromCylindricalCoords(e, t, n) {
    return (
      (this.x = e * Math.sin(t)),
      (this.y = n),
      (this.z = e * Math.cos(t)),
      this
    );
  }
  setFromMatrixPosition(e) {
    const t = e.elements;
    return ((this.x = t[12]), (this.y = t[13]), (this.z = t[14]), this);
  }
  setFromMatrixScale(e) {
    const t = this.setFromMatrixColumn(e, 0).length(),
      n = this.setFromMatrixColumn(e, 1).length(),
      r = this.setFromMatrixColumn(e, 2).length();
    return ((this.x = t), (this.y = n), (this.z = r), this);
  }
  setFromMatrixColumn(e, t) {
    return this.fromArray(e.elements, t * 4);
  }
  setFromMatrix3Column(e, t) {
    return this.fromArray(e.elements, t * 3);
  }
  setFromEuler(e) {
    return ((this.x = e._x), (this.y = e._y), (this.z = e._z), this);
  }
  setFromColor(e) {
    return ((this.x = e.r), (this.y = e.g), (this.z = e.b), this);
  }
  equals(e) {
    return e.x === this.x && e.y === this.y && e.z === this.z;
  }
  fromArray(e, t = 0) {
    return ((this.x = e[t]), (this.y = e[t + 1]), (this.z = e[t + 2]), this);
  }
  toArray(e = [], t = 0) {
    return ((e[t] = this.x), (e[t + 1] = this.y), (e[t + 2] = this.z), e);
  }
  fromBufferAttribute(e, t) {
    return (
      (this.x = e.getX(t)),
      (this.y = e.getY(t)),
      (this.z = e.getZ(t)),
      this
    );
  }
  random() {
    return (
      (this.x = Math.random()),
      (this.y = Math.random()),
      (this.z = Math.random()),
      this
    );
  }
  randomDirection() {
    const e = Math.random() * Math.PI * 2,
      t = Math.random() * 2 - 1,
      n = Math.sqrt(1 - t * t);
    return (
      (this.x = n * Math.cos(e)),
      (this.y = t),
      (this.z = n * Math.sin(e)),
      this
    );
  }
  *[Symbol.iterator]() {
    (yield this.x, yield this.y, yield this.z);
  }
};

Zd.prototype.isVector3 = !0;

let F = Zd;

const xl = new F();

const fu = new jn();

const Qd = class Qd {
    constructor(e, t, n, r, s, a, o, A, l) {
      ((this.elements = [1, 0, 0, 0, 1, 0, 0, 0, 1]),
        e !== void 0 && this.set(e, t, n, r, s, a, o, A, l));
    }
    set(e, t, n, r, s, a, o, A, l) {
      const c = this.elements;
      return (
        (c[0] = e),
        (c[1] = r),
        (c[2] = o),
        (c[3] = t),
        (c[4] = s),
        (c[5] = A),
        (c[6] = n),
        (c[7] = a),
        (c[8] = l),
        this
      );
    }
    identity() {
      return (this.set(1, 0, 0, 0, 1, 0, 0, 0, 1), this);
    }
    copy(e) {
      const t = this.elements,
        n = e.elements;
      return (
        (t[0] = n[0]),
        (t[1] = n[1]),
        (t[2] = n[2]),
        (t[3] = n[3]),
        (t[4] = n[4]),
        (t[5] = n[5]),
        (t[6] = n[6]),
        (t[7] = n[7]),
        (t[8] = n[8]),
        this
      );
    }
    extractBasis(e, t, n) {
      return (
        e.setFromMatrix3Column(this, 0),
        t.setFromMatrix3Column(this, 1),
        n.setFromMatrix3Column(this, 2),
        this
      );
    }
    setFromMatrix4(e) {
      const t = e.elements;
      return (
        this.set(t[0], t[4], t[8], t[1], t[5], t[9], t[2], t[6], t[10]),
        this
      );
    }
    multiply(e) {
      return this.multiplyMatrices(this, e);
    }
    premultiply(e) {
      return this.multiplyMatrices(e, this);
    }
    multiplyMatrices(e, t) {
      const n = e.elements,
        r = t.elements,
        s = this.elements,
        a = n[0],
        o = n[3],
        A = n[6],
        l = n[1],
        c = n[4],
        h = n[7],
        d = n[2],
        u = n[5],
        p = n[8],
        v = r[0],
        g = r[3],
        m = r[6],
        y = r[1],
        C = r[4],
        E = r[7],
        w = r[2],
        S = r[5],
        k = r[8];
      return (
        (s[0] = a * v + o * y + A * w),
        (s[3] = a * g + o * C + A * S),
        (s[6] = a * m + o * E + A * k),
        (s[1] = l * v + c * y + h * w),
        (s[4] = l * g + c * C + h * S),
        (s[7] = l * m + c * E + h * k),
        (s[2] = d * v + u * y + p * w),
        (s[5] = d * g + u * C + p * S),
        (s[8] = d * m + u * E + p * k),
        this
      );
    }
    multiplyScalar(e) {
      const t = this.elements;
      return (
        (t[0] *= e),
        (t[3] *= e),
        (t[6] *= e),
        (t[1] *= e),
        (t[4] *= e),
        (t[7] *= e),
        (t[2] *= e),
        (t[5] *= e),
        (t[8] *= e),
        this
      );
    }
    determinant() {
      const e = this.elements,
        t = e[0],
        n = e[1],
        r = e[2],
        s = e[3],
        a = e[4],
        o = e[5],
        A = e[6],
        l = e[7],
        c = e[8];
      return (
        t * a * c - t * o * l - n * s * c + n * o * A + r * s * l - r * a * A
      );
    }
    invert() {
      const e = this.elements,
        t = e[0],
        n = e[1],
        r = e[2],
        s = e[3],
        a = e[4],
        o = e[5],
        A = e[6],
        l = e[7],
        c = e[8],
        h = c * a - o * l,
        d = o * A - c * s,
        u = l * s - a * A,
        p = t * h + n * d + r * u;
      if (p === 0) return this.set(0, 0, 0, 0, 0, 0, 0, 0, 0);
      const v = 1 / p;
      return (
        (e[0] = h * v),
        (e[1] = (r * l - c * n) * v),
        (e[2] = (o * n - r * a) * v),
        (e[3] = d * v),
        (e[4] = (c * t - r * A) * v),
        (e[5] = (r * s - o * t) * v),
        (e[6] = u * v),
        (e[7] = (n * A - l * t) * v),
        (e[8] = (a * t - n * s) * v),
        this
      );
    }
    transpose() {
      let e;
      const t = this.elements;
      return (
        (e = t[1]),
        (t[1] = t[3]),
        (t[3] = e),
        (e = t[2]),
        (t[2] = t[6]),
        (t[6] = e),
        (e = t[5]),
        (t[5] = t[7]),
        (t[7] = e),
        this
      );
    }
    getNormalMatrix(e) {
      return this.setFromMatrix4(e).invert().transpose();
    }
    transposeIntoArray(e) {
      const t = this.elements;
      return (
        (e[0] = t[0]),
        (e[1] = t[3]),
        (e[2] = t[6]),
        (e[3] = t[1]),
        (e[4] = t[4]),
        (e[5] = t[7]),
        (e[6] = t[2]),
        (e[7] = t[5]),
        (e[8] = t[8]),
        this
      );
    }
    setUvTransform(e, t, n, r, s, a, o) {
      const A = Math.cos(s),
        l = Math.sin(s);
      return (
        this.set(
          n * A,
          n * l,
          -n * (A * a + l * o) + a + e,
          -r * l,
          r * A,
          -r * (-l * a + A * o) + o + t,
          0,
          0,
          1,
        ),
        this
      );
    }
    scale(e, t) {
      return (
        Ms("Matrix3: .scale() is deprecated. Use .makeScale() instead."),
        this.premultiply(Cl.makeScale(e, t)),
        this
      );
    }
    rotate(e) {
      return (
        Ms("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),
        this.premultiply(Cl.makeRotation(-e)),
        this
      );
    }
    translate(e, t) {
      return (
        Ms(
          "Matrix3: .translate() is deprecated. Use .makeTranslation() instead.",
        ),
        this.premultiply(Cl.makeTranslation(e, t)),
        this
      );
    }
    makeTranslation(e, t) {
      return (
        e.isVector2
          ? this.set(1, 0, e.x, 0, 1, e.y, 0, 0, 1)
          : this.set(1, 0, e, 0, 1, t, 0, 0, 1),
        this
      );
    }
    makeRotation(e) {
      const t = Math.cos(e),
        n = Math.sin(e);
      return (this.set(t, -n, 0, n, t, 0, 0, 0, 1), this);
    }
    makeScale(e, t) {
      return (this.set(e, 0, 0, 0, t, 0, 0, 0, 1), this);
    }
    equals(e) {
      const t = this.elements,
        n = e.elements;
      for (let r = 0; r < 9; r++) if (t[r] !== n[r]) return !1;
      return !0;
    }
    fromArray(e, t = 0) {
      for (let n = 0; n < 9; n++) this.elements[n] = e[n + t];
      return this;
    }
    toArray(e = [], t = 0) {
      const n = this.elements;
      return (
        (e[t] = n[0]),
        (e[t + 1] = n[1]),
        (e[t + 2] = n[2]),
        (e[t + 3] = n[3]),
        (e[t + 4] = n[4]),
        (e[t + 5] = n[5]),
        (e[t + 6] = n[6]),
        (e[t + 7] = n[7]),
        (e[t + 8] = n[8]),
        e
      );
    }
    clone() {
      return new this.constructor().fromArray(this.elements);
    }
  };

Qd.prototype.isMatrix3 = !0;

let jt = Qd;

const Cl = new jt();

const pu = new jt().set(
    0.4123908,
    0.3575843,
    0.1804808,
    0.212639,
    0.7151687,
    0.0721923,
    0.0193308,
    0.1191948,
    0.9505322,
  );

const mu = new jt().set(
    3.2409699,
    -1.5373832,
    -0.4986108,
    -0.9692436,
    1.8759675,
    0.0415551,
    0.0556301,
    -0.203977,
    1.0569715,
  );

function Sv() {
  const i = {
      enabled: !0,
      workingColorSpace: kn,
      spaces: {},
      convert: function (r, s, a) {
        return (
          this.enabled === !1 ||
            s === a ||
            !s ||
            !a ||
            (this.spaces[s].transfer === kt &&
              ((r.r = Or(r.r)), (r.g = Or(r.g)), (r.b = Or(r.b))),
            this.spaces[s].primaries !== this.spaces[a].primaries &&
              (r.applyMatrix3(this.spaces[s].toXYZ),
              r.applyMatrix3(this.spaces[a].fromXYZ)),
            this.spaces[a].transfer === kt &&
              ((r.r = ks(r.r)), (r.g = ks(r.g)), (r.b = ks(r.b)))),
          r
        );
      },
      workingToColorSpace: function (r, s) {
        return this.convert(r, this.workingColorSpace, s);
      },
      colorSpaceToWorking: function (r, s) {
        return this.convert(r, s, this.workingColorSpace);
      },
      getPrimaries: function (r) {
        return this.spaces[r].primaries;
      },
      getTransfer: function (r) {
        return r === si ? RA : this.spaces[r].transfer;
      },
      getToneMappingMode: function (r) {
        return (
          this.spaces[r].outputColorSpaceConfig.toneMappingMode || "standard"
        );
      },
      getLuminanceCoefficients: function (r, s = this.workingColorSpace) {
        return r.fromArray(this.spaces[s].luminanceCoefficients);
      },
      define: function (r) {
        Object.assign(this.spaces, r);
      },
      _getMatrix: function (r, s, a) {
        return r.copy(this.spaces[s].toXYZ).multiply(this.spaces[a].fromXYZ);
      },
      _getDrawingBufferColorSpace: function (r) {
        return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace;
      },
      _getUnpackColorSpace: function (r = this.workingColorSpace) {
        return this.spaces[r].workingColorSpaceConfig.unpackColorSpace;
      },
      fromWorkingColorSpace: function (r, s) {
        return (
          Ms(
            "ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace().",
          ),
          i.workingToColorSpace(r, s)
        );
      },
      toWorkingColorSpace: function (r, s) {
        return (
          Ms(
            "ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking().",
          ),
          i.colorSpaceToWorking(r, s)
        );
      },
    },
    e = [0.64, 0.33, 0.3, 0.6, 0.15, 0.06],
    t = [0.2126, 0.7152, 0.0722],
    n = [0.3127, 0.329];
  return (
    i.define({
      [kn]: {
        primaries: e,
        whitePoint: n,
        transfer: RA,
        toXYZ: pu,
        fromXYZ: mu,
        luminanceCoefficients: t,
        workingColorSpaceConfig: { unpackColorSpace: Ht },
        outputColorSpaceConfig: { drawingBufferColorSpace: Ht },
      },
      [Ht]: {
        primaries: e,
        whitePoint: n,
        transfer: kt,
        toXYZ: pu,
        fromXYZ: mu,
        luminanceCoefficients: t,
        outputColorSpaceConfig: { drawingBufferColorSpace: Ht },
      },
    }),
    i
  );
}

const bt = Sv();

function Or(i) {
  return i < 0.04045
    ? i * 0.0773993808
    : Math.pow(i * 0.9478672986 + 0.0521327014, 2.4);
}

function ks(i) {
  return i < 0.0031308 ? i * 12.92 : 1.055 * Math.pow(i, 0.41666) - 0.055;
}

let Zi;

class wv {
  static getDataURL(e, t = "image/png") {
    if (/^data:/i.test(e.src) || typeof HTMLCanvasElement > "u") return e.src;
    let n;
    if (e instanceof HTMLCanvasElement) n = e;
    else {
      (Zi === void 0 && (Zi = za("canvas")),
        (Zi.width = e.width),
        (Zi.height = e.height));
      const r = Zi.getContext("2d");
      (e instanceof ImageData
        ? r.putImageData(e, 0, 0)
        : r.drawImage(e, 0, 0, e.width, e.height),
        (n = Zi));
    }
    return n.toDataURL(t);
  }
  static sRGBToLinear(e) {
    if (
      (typeof HTMLImageElement < "u" && e instanceof HTMLImageElement) ||
      (typeof HTMLCanvasElement < "u" && e instanceof HTMLCanvasElement) ||
      (typeof ImageBitmap < "u" && e instanceof ImageBitmap)
    ) {
      const t = za("canvas");
      ((t.width = e.width), (t.height = e.height));
      const n = t.getContext("2d");
      n.drawImage(e, 0, 0, e.width, e.height);
      const r = n.getImageData(0, 0, e.width, e.height),
        s = r.data;
      for (let a = 0; a < s.length; a++) s[a] = Or(s[a] / 255) * 255;
      return (n.putImageData(r, 0, 0), t);
    } else if (e.data) {
      const t = e.data.slice(0);
      for (let n = 0; n < t.length; n++)
        t instanceof Uint8Array || t instanceof Uint8ClampedArray
          ? (t[n] = Math.floor(Or(t[n] / 255) * 255))
          : (t[n] = Or(t[n]));
      return { data: t, width: e.width, height: e.height };
    } else
      return (
        it(
          "ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied.",
        ),
        e
      );
  }
}

let Mv = 0;

class _d {
  constructor(e = null) {
    ((this.isSource = !0),
      Object.defineProperty(this, "id", { value: Mv++ }),
      (this.uuid = Un()),
      (this.data = e),
      (this.dataReady = !0),
      (this.version = 0));
  }
  getSize(e) {
    const t = this.data;
    return (
      typeof HTMLVideoElement < "u" && t instanceof HTMLVideoElement
        ? e.set(t.videoWidth, t.videoHeight, 0)
        : typeof VideoFrame < "u" && t instanceof VideoFrame
          ? e.set(t.displayWidth, t.displayHeight, 0)
          : t !== null
            ? e.set(t.width, t.height, t.depth || 0)
            : e.set(0, 0, 0),
      e
    );
  }
  set needsUpdate(e) {
    e === !0 && this.version++;
  }
  toJSON(e) {
    const t = e === void 0 || typeof e == "string";
    if (!t && e.images[this.uuid] !== void 0) return e.images[this.uuid];
    const n = { uuid: this.uuid, url: "" },
      r = this.data;
    if (r !== null) {
      let s;
      if (Array.isArray(r)) {
        s = [];
        for (let a = 0, o = r.length; a < o; a++)
          r[a].isDataTexture ? s.push(bl(r[a].image)) : s.push(bl(r[a]));
      } else s = bl(r);
      n.url = s;
    }
    return (t || (e.images[this.uuid] = n), n);
  }
}

function bl(i) {
  return (typeof HTMLImageElement < "u" && i instanceof HTMLImageElement) ||
    (typeof HTMLCanvasElement < "u" && i instanceof HTMLCanvasElement) ||
    (typeof ImageBitmap < "u" && i instanceof ImageBitmap)
    ? wv.getDataURL(i)
    : i.data
      ? {
          data: Array.from(i.data),
          width: i.width,
          height: i.height,
          type: i.data.constructor.name,
        }
      : (it("Texture: Unable to serialize Texture."), {});
}

let Bv = 0;

const Sl = new F();

class Zt extends Wi {
  constructor(
    e = Zt.DEFAULT_IMAGE,
    t = Zt.DEFAULT_MAPPING,
    n = fr,
    r = fr,
    s = qt,
    a = pr,
    o = Hn,
    A = Mn,
    l = Zt.DEFAULT_ANISOTROPY,
    c = si,
  ) {
    (super(),
      (this.isTexture = !0),
      Object.defineProperty(this, "id", { value: Bv++ }),
      (this.uuid = Un()),
      (this.name = ""),
      (this.source = new _d(e)),
      (this.mipmaps = []),
      (this.mapping = t),
      (this.channel = 0),
      (this.wrapS = n),
      (this.wrapT = r),
      (this.magFilter = s),
      (this.minFilter = a),
      (this.anisotropy = l),
      (this.format = o),
      (this.internalFormat = null),
      (this.type = A),
      (this.offset = new Ae(0, 0)),
      (this.repeat = new Ae(1, 1)),
      (this.center = new Ae(0, 0)),
      (this.rotation = 0),
      (this.matrixAutoUpdate = !0),
      (this.matrix = new jt()),
      (this.generateMipmaps = !0),
      (this.premultiplyAlpha = !1),
      (this.flipY = !0),
      (this.unpackAlignment = 4),
      (this.colorSpace = c),
      (this.userData = {}),
      (this.updateRanges = []),
      (this.version = 0),
      (this.onUpdate = null),
      (this.renderTarget = null),
      (this.isRenderTargetTexture = !1),
      (this.isArrayTexture = !!(e && e.depth && e.depth > 1)),
      (this.pmremVersion = 0),
      (this.normalized = !1));
  }
  get width() {
    return this.source.getSize(Sl).x;
  }
  get height() {
    return this.source.getSize(Sl).y;
  }
  get depth() {
    return this.source.getSize(Sl).z;
  }
  get image() {
    return this.source.data;
  }
  set image(e) {
    this.source.data = e;
  }
  updateMatrix() {
    this.matrix.setUvTransform(
      this.offset.x,
      this.offset.y,
      this.repeat.x,
      this.repeat.y,
      this.rotation,
      this.center.x,
      this.center.y,
    );
  }
  addUpdateRange(e, t) {
    this.updateRanges.push({ start: e, count: t });
  }
  clearUpdateRanges() {
    this.updateRanges.length = 0;
  }
  clone() {
    return new this.constructor().copy(this);
  }
  copy(e) {
    return (
      (this.name = e.name),
      (this.source = e.source),
      (this.mipmaps = e.mipmaps.slice(0)),
      (this.mapping = e.mapping),
      (this.channel = e.channel),
      (this.wrapS = e.wrapS),
      (this.wrapT = e.wrapT),
      (this.magFilter = e.magFilter),
      (this.minFilter = e.minFilter),
      (this.anisotropy = e.anisotropy),
      (this.format = e.format),
      (this.internalFormat = e.internalFormat),
      (this.type = e.type),
      (this.normalized = e.normalized),
      this.offset.copy(e.offset),
      this.repeat.copy(e.repeat),
      this.center.copy(e.center),
      (this.rotation = e.rotation),
      (this.matrixAutoUpdate = e.matrixAutoUpdate),
      this.matrix.copy(e.matrix),
      (this.generateMipmaps = e.generateMipmaps),
      (this.premultiplyAlpha = e.premultiplyAlpha),
      (this.flipY = e.flipY),
      (this.unpackAlignment = e.unpackAlignment),
      (this.colorSpace = e.colorSpace),
      (this.renderTarget = e.renderTarget),
      (this.isRenderTargetTexture = e.isRenderTargetTexture),
      (this.isArrayTexture = e.isArrayTexture),
      (this.userData = JSON.parse(JSON.stringify(e.userData))),
      (this.needsUpdate = !0),
      this
    );
  }
  setValues(e) {
    for (const t in e) {
      const n = e[t];
      if (n === void 0) {
        it(`Texture.setValues(): parameter '${t}' has value of undefined.`);
        continue;
      }
      const r = this[t];
      if (r === void 0) {
        it(`Texture.setValues(): property '${t}' does not exist.`);
        continue;
      }
      (r && n && r.isVector2 && n.isVector2) ||
      (r && n && r.isVector3 && n.isVector3) ||
      (r && n && r.isMatrix3 && n.isMatrix3)
        ? r.copy(n)
        : (this[t] = n);
    }
  }
  toJSON(e) {
    const t = e === void 0 || typeof e == "string";
    if (!t && e.textures[this.uuid] !== void 0) return e.textures[this.uuid];
    const n = {
      metadata: { version: 4.7, type: "Texture", generator: "Texture.toJSON" },
      uuid: this.uuid,
      name: this.name,
      image: this.source.toJSON(e).uuid,
      mapping: this.mapping,
      channel: this.channel,
      repeat: [this.repeat.x, this.repeat.y],
      offset: [this.offset.x, this.offset.y],
      center: [this.center.x, this.center.y],
      rotation: this.rotation,
      wrap: [this.wrapS, this.wrapT],
      format: this.format,
      internalFormat: this.internalFormat,
      type: this.type,
      normalized: this.normalized,
      colorSpace: this.colorSpace,
      minFilter: this.minFilter,
      magFilter: this.magFilter,
      anisotropy: this.anisotropy,
      flipY: this.flipY,
      generateMipmaps: this.generateMipmaps,
      premultiplyAlpha: this.premultiplyAlpha,
      unpackAlignment: this.unpackAlignment,
    };
    return (
      Object.keys(this.userData).length > 0 && (n.userData = this.userData),
      t || (e.textures[this.uuid] = n),
      n
    );
  }
  dispose() {
    this.dispatchEvent({ type: "dispose" });
  }
  transformUv(e) {
    if (this.mapping !== mm) return e;
    if ((e.applyMatrix3(this.matrix), e.x < 0 || e.x > 1))
      switch (this.wrapS) {
        case ci:
          e.x = e.x - Math.floor(e.x);
          break;
        case fr:
          e.x = e.x < 0 ? 0 : 1;
          break;
        case BA:
          Math.abs(Math.floor(e.x) % 2) === 1
            ? (e.x = Math.ceil(e.x) - e.x)
            : (e.x = e.x - Math.floor(e.x));
          break;
      }
    if (e.y < 0 || e.y > 1)
      switch (this.wrapT) {
        case ci:
          e.y = e.y - Math.floor(e.y);
          break;
        case fr:
          e.y = e.y < 0 ? 0 : 1;
          break;
        case BA:
          Math.abs(Math.floor(e.y) % 2) === 1
            ? (e.y = Math.ceil(e.y) - e.y)
            : (e.y = e.y - Math.floor(e.y));
          break;
      }
    return (this.flipY && (e.y = 1 - e.y), e);
  }
  set needsUpdate(e) {
    e === !0 && (this.version++, (this.source.needsUpdate = !0));
  }
  set needsPMREMUpdate(e) {
    e === !0 && this.pmremVersion++;
  }
}

Zt.DEFAULT_IMAGE = null;

Zt.DEFAULT_MAPPING = mm;

Zt.DEFAULT_ANISOTROPY = 1;

const eu = class eu {
  constructor(e = 0, t = 0, n = 0, r = 1) {
    ((this.x = e), (this.y = t), (this.z = n), (this.w = r));
  }
  get width() {
    return this.z;
  }
  set width(e) {
    this.z = e;
  }
  get height() {
    return this.w;
  }
  set height(e) {
    this.w = e;
  }
  set(e, t, n, r) {
    return ((this.x = e), (this.y = t), (this.z = n), (this.w = r), this);
  }
  setScalar(e) {
    return ((this.x = e), (this.y = e), (this.z = e), (this.w = e), this);
  }
  setX(e) {
    return ((this.x = e), this);
  }
  setY(e) {
    return ((this.y = e), this);
  }
  setZ(e) {
    return ((this.z = e), this);
  }
  setW(e) {
    return ((this.w = e), this);
  }
  setComponent(e, t) {
    switch (e) {
      case 0:
        this.x = t;
        break;
      case 1:
        this.y = t;
        break;
      case 2:
        this.z = t;
        break;
      case 3:
        this.w = t;
        break;
      default:
        throw new Error("THREE.Vector4: index is out of range: " + e);
    }
    return this;
  }
  getComponent(e) {
    switch (e) {
      case 0:
        return this.x;
      case 1:
        return this.y;
      case 2:
        return this.z;
      case 3:
        return this.w;
      default:
        throw new Error("THREE.Vector4: index is out of range: " + e);
    }
  }
  clone() {
    return new this.constructor(this.x, this.y, this.z, this.w);
  }
  copy(e) {
    return (
      (this.x = e.x),
      (this.y = e.y),
      (this.z = e.z),
      (this.w = e.w !== void 0 ? e.w : 1),
      this
    );
  }
  add(e) {
    return (
      (this.x += e.x),
      (this.y += e.y),
      (this.z += e.z),
      (this.w += e.w),
      this
    );
  }
  addScalar(e) {
    return ((this.x += e), (this.y += e), (this.z += e), (this.w += e), this);
  }
  addVectors(e, t) {
    return (
      (this.x = e.x + t.x),
      (this.y = e.y + t.y),
      (this.z = e.z + t.z),
      (this.w = e.w + t.w),
      this
    );
  }
  addScaledVector(e, t) {
    return (
      (this.x += e.x * t),
      (this.y += e.y * t),
      (this.z += e.z * t),
      (this.w += e.w * t),
      this
    );
  }
  sub(e) {
    return (
      (this.x -= e.x),
      (this.y -= e.y),
      (this.z -= e.z),
      (this.w -= e.w),
      this
    );
  }
  subScalar(e) {
    return ((this.x -= e), (this.y -= e), (this.z -= e), (this.w -= e), this);
  }
  subVectors(e, t) {
    return (
      (this.x = e.x - t.x),
      (this.y = e.y - t.y),
      (this.z = e.z - t.z),
      (this.w = e.w - t.w),
      this
    );
  }
  multiply(e) {
    return (
      (this.x *= e.x),
      (this.y *= e.y),
      (this.z *= e.z),
      (this.w *= e.w),
      this
    );
  }
  multiplyScalar(e) {
    return ((this.x *= e), (this.y *= e), (this.z *= e), (this.w *= e), this);
  }
  applyMatrix4(e) {
    const t = this.x,
      n = this.y,
      r = this.z,
      s = this.w,
      a = e.elements;
    return (
      (this.x = a[0] * t + a[4] * n + a[8] * r + a[12] * s),
      (this.y = a[1] * t + a[5] * n + a[9] * r + a[13] * s),
      (this.z = a[2] * t + a[6] * n + a[10] * r + a[14] * s),
      (this.w = a[3] * t + a[7] * n + a[11] * r + a[15] * s),
      this
    );
  }
  divide(e) {
    return (
      (this.x /= e.x),
      (this.y /= e.y),
      (this.z /= e.z),
      (this.w /= e.w),
      this
    );
  }
  divideScalar(e) {
    return this.multiplyScalar(1 / e);
  }
  setAxisAngleFromQuaternion(e) {
    this.w = 2 * Math.acos(e.w);
    const t = Math.sqrt(1 - e.w * e.w);
    return (
      t < 1e-4
        ? ((this.x = 1), (this.y = 0), (this.z = 0))
        : ((this.x = e.x / t), (this.y = e.y / t), (this.z = e.z / t)),
      this
    );
  }
  setAxisAngleFromRotationMatrix(e) {
    let t, n, r, s;
    const A = e.elements,
      l = A[0],
      c = A[4],
      h = A[8],
      d = A[1],
      u = A[5],
      p = A[9],
      v = A[2],
      g = A[6],
      m = A[10];
    if (
      Math.abs(c - d) < 0.01 &&
      Math.abs(h - v) < 0.01 &&
      Math.abs(p - g) < 0.01
    ) {
      if (
        Math.abs(c + d) < 0.1 &&
        Math.abs(h + v) < 0.1 &&
        Math.abs(p + g) < 0.1 &&
        Math.abs(l + u + m - 3) < 0.1
      )
        return (this.set(1, 0, 0, 0), this);
      t = Math.PI;
      const C = (l + 1) / 2,
        E = (u + 1) / 2,
        w = (m + 1) / 2,
        S = (c + d) / 4,
        k = (h + v) / 4,
        x = (p + g) / 4;
      return (
        C > E && C > w
          ? C < 0.01
            ? ((n = 0), (r = 0.707106781), (s = 0.707106781))
            : ((n = Math.sqrt(C)), (r = S / n), (s = k / n))
          : E > w
            ? E < 0.01
              ? ((n = 0.707106781), (r = 0), (s = 0.707106781))
              : ((r = Math.sqrt(E)), (n = S / r), (s = x / r))
            : w < 0.01
              ? ((n = 0.707106781), (r = 0.707106781), (s = 0))
              : ((s = Math.sqrt(w)), (n = k / s), (r = x / s)),
        this.set(n, r, s, t),
        this
      );
    }
    let y = Math.sqrt(
      (g - p) * (g - p) + (h - v) * (h - v) + (d - c) * (d - c),
    );
    return (
      Math.abs(y) < 0.001 && (y = 1),
      (this.x = (g - p) / y),
      (this.y = (h - v) / y),
      (this.z = (d - c) / y),
      (this.w = Math.acos((l + u + m - 1) / 2)),
      this
    );
  }
  setFromMatrixPosition(e) {
    const t = e.elements;
    return (
      (this.x = t[12]),
      (this.y = t[13]),
      (this.z = t[14]),
      (this.w = t[15]),
      this
    );
  }
  min(e) {
    return (
      (this.x = Math.min(this.x, e.x)),
      (this.y = Math.min(this.y, e.y)),
      (this.z = Math.min(this.z, e.z)),
      (this.w = Math.min(this.w, e.w)),
      this
    );
  }
  max(e) {
    return (
      (this.x = Math.max(this.x, e.x)),
      (this.y = Math.max(this.y, e.y)),
      (this.z = Math.max(this.z, e.z)),
      (this.w = Math.max(this.w, e.w)),
      this
    );
  }
  clamp(e, t) {
    return (
      (this.x = xt(this.x, e.x, t.x)),
      (this.y = xt(this.y, e.y, t.y)),
      (this.z = xt(this.z, e.z, t.z)),
      (this.w = xt(this.w, e.w, t.w)),
      this
    );
  }
  clampScalar(e, t) {
    return (
      (this.x = xt(this.x, e, t)),
      (this.y = xt(this.y, e, t)),
      (this.z = xt(this.z, e, t)),
      (this.w = xt(this.w, e, t)),
      this
    );
  }
  clampLength(e, t) {
    const n = this.length();
    return this.divideScalar(n || 1).multiplyScalar(xt(n, e, t));
  }
  floor() {
    return (
      (this.x = Math.floor(this.x)),
      (this.y = Math.floor(this.y)),
      (this.z = Math.floor(this.z)),
      (this.w = Math.floor(this.w)),
      this
    );
  }
  ceil() {
    return (
      (this.x = Math.ceil(this.x)),
      (this.y = Math.ceil(this.y)),
      (this.z = Math.ceil(this.z)),
      (this.w = Math.ceil(this.w)),
      this
    );
  }
  round() {
    return (
      (this.x = Math.round(this.x)),
      (this.y = Math.round(this.y)),
      (this.z = Math.round(this.z)),
      (this.w = Math.round(this.w)),
      this
    );
  }
  roundToZero() {
    return (
      (this.x = Math.trunc(this.x)),
      (this.y = Math.trunc(this.y)),
      (this.z = Math.trunc(this.z)),
      (this.w = Math.trunc(this.w)),
      this
    );
  }
  negate() {
    return (
      (this.x = -this.x),
      (this.y = -this.y),
      (this.z = -this.z),
      (this.w = -this.w),
      this
    );
  }
  dot(e) {
    return this.x * e.x + this.y * e.y + this.z * e.z + this.w * e.w;
  }
  lengthSq() {
    return (
      this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w
    );
  }
  length() {
    return Math.sqrt(
      this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w,
    );
  }
  manhattanLength() {
    return (
      Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z) + Math.abs(this.w)
    );
  }
  normalize() {
    return this.divideScalar(this.length() || 1);
  }
  setLength(e) {
    return this.normalize().multiplyScalar(e);
  }
  lerp(e, t) {
    return (
      (this.x += (e.x - this.x) * t),
      (this.y += (e.y - this.y) * t),
      (this.z += (e.z - this.z) * t),
      (this.w += (e.w - this.w) * t),
      this
    );
  }
  lerpVectors(e, t, n) {
    return (
      (this.x = e.x + (t.x - e.x) * n),
      (this.y = e.y + (t.y - e.y) * n),
      (this.z = e.z + (t.z - e.z) * n),
      (this.w = e.w + (t.w - e.w) * n),
      this
    );
  }
  equals(e) {
    return e.x === this.x && e.y === this.y && e.z === this.z && e.w === this.w;
  }
  fromArray(e, t = 0) {
    return (
      (this.x = e[t]),
      (this.y = e[t + 1]),
      (this.z = e[t + 2]),
      (this.w = e[t + 3]),
      this
    );
  }
  toArray(e = [], t = 0) {
    return (
      (e[t] = this.x),
      (e[t + 1] = this.y),
      (e[t + 2] = this.z),
      (e[t + 3] = this.w),
      e
    );
  }
  fromBufferAttribute(e, t) {
    return (
      (this.x = e.getX(t)),
      (this.y = e.getY(t)),
      (this.z = e.getZ(t)),
      (this.w = e.getW(t)),
      this
    );
  }
  random() {
    return (
      (this.x = Math.random()),
      (this.y = Math.random()),
      (this.z = Math.random()),
      (this.w = Math.random()),
      this
    );
  }
  *[Symbol.iterator]() {
    (yield this.x, yield this.y, yield this.z, yield this.w);
  }
};

eu.prototype.isVector4 = !0;

let Pt = eu;

class kv extends Wi {
  constructor(e = 1, t = 1, n = {}) {
    (super(),
      (n = Object.assign(
        {
          generateMipmaps: !1,
          internalFormat: null,
          minFilter: qt,
          depthBuffer: !0,
          stencilBuffer: !1,
          resolveDepthBuffer: !0,
          resolveStencilBuffer: !0,
          depthTexture: null,
          samples: 0,
          count: 1,
          depth: 1,
          multiview: !1,
          useArrayDepthTexture: !1,
        },
        n,
      )),
      (this.isRenderTarget = !0),
      (this.width = e),
      (this.height = t),
      (this.depth = n.depth),
      (this.scissor = new Pt(0, 0, e, t)),
      (this.scissorTest = !1),
      (this.viewport = new Pt(0, 0, e, t)),
      (this.textures = []));
    const r = { width: e, height: t, depth: n.depth },
      s = new Zt(r),
      a = n.count;
    for (let o = 0; o < a; o++)
      ((this.textures[o] = s.clone()),
        (this.textures[o].isRenderTargetTexture = !0),
        (this.textures[o].renderTarget = this));
    (this._setTextureOptions(n),
      (this.depthBuffer = n.depthBuffer),
      (this.stencilBuffer = n.stencilBuffer),
      (this.resolveDepthBuffer = n.resolveDepthBuffer),
      (this.resolveStencilBuffer = n.resolveStencilBuffer),
      (this._depthTexture = null),
      (this.depthTexture = n.depthTexture),
      (this.samples = n.samples),
      (this.multiview = n.multiview),
      (this.useArrayDepthTexture = n.useArrayDepthTexture));
  }
  _setTextureOptions(e = {}) {
    const t = {
      minFilter: qt,
      generateMipmaps: !1,
      flipY: !1,
      internalFormat: null,
    };
    (e.mapping !== void 0 && (t.mapping = e.mapping),
      e.wrapS !== void 0 && (t.wrapS = e.wrapS),
      e.wrapT !== void 0 && (t.wrapT = e.wrapT),
      e.wrapR !== void 0 && (t.wrapR = e.wrapR),
      e.magFilter !== void 0 && (t.magFilter = e.magFilter),
      e.minFilter !== void 0 && (t.minFilter = e.minFilter),
      e.format !== void 0 && (t.format = e.format),
      e.type !== void 0 && (t.type = e.type),
      e.anisotropy !== void 0 && (t.anisotropy = e.anisotropy),
      e.colorSpace !== void 0 && (t.colorSpace = e.colorSpace),
      e.flipY !== void 0 && (t.flipY = e.flipY),
      e.generateMipmaps !== void 0 && (t.generateMipmaps = e.generateMipmaps),
      e.internalFormat !== void 0 && (t.internalFormat = e.internalFormat));
    for (let n = 0; n < this.textures.length; n++)
      this.textures[n].setValues(t);
  }
  get texture() {
    return this.textures[0];
  }
  set texture(e) {
    this.textures[0] = e;
  }
  set depthTexture(e) {
    (this._depthTexture !== null && (this._depthTexture.renderTarget = null),
      e !== null && (e.renderTarget = this),
      (this._depthTexture = e));
  }
  get depthTexture() {
    return this._depthTexture;
  }
  setSize(e, t, n = 1) {
    if (this.width !== e || this.height !== t || this.depth !== n) {
      ((this.width = e), (this.height = t), (this.depth = n));
      for (let r = 0, s = this.textures.length; r < s; r++)
        ((this.textures[r].image.width = e),
          (this.textures[r].image.height = t),
          (this.textures[r].image.depth = n),
          this.textures[r].isData3DTexture !== !0 &&
            (this.textures[r].isArrayTexture =
              this.textures[r].image.depth > 1));
      this.dispose();
    }
    (this.viewport.set(0, 0, e, t), this.scissor.set(0, 0, e, t));
  }
  clone() {
    return new this.constructor().copy(this);
  }
  copy(e) {
    ((this.width = e.width),
      (this.height = e.height),
      (this.depth = e.depth),
      this.scissor.copy(e.scissor),
      (this.scissorTest = e.scissorTest),
      this.viewport.copy(e.viewport),
      (this.textures.length = 0));
    for (let t = 0, n = e.textures.length; t < n; t++) {
      ((this.textures[t] = e.textures[t].clone()),
        (this.textures[t].isRenderTargetTexture = !0),
        (this.textures[t].renderTarget = this));
      const r = Object.assign({}, e.textures[t].image);
      this.textures[t].source = new _d(r);
    }
    return (
      (this.depthBuffer = e.depthBuffer),
      (this.stencilBuffer = e.stencilBuffer),
      (this.resolveDepthBuffer = e.resolveDepthBuffer),
      (this.resolveStencilBuffer = e.resolveStencilBuffer),
      e.depthTexture !== null && (this.depthTexture = e.depthTexture.clone()),
      (this.samples = e.samples),
      (this.multiview = e.multiview),
      (this.useArrayDepthTexture = e.useArrayDepthTexture),
      this
    );
  }
  dispose() {
    this.dispatchEvent({ type: "dispose" });
  }
}

class qn extends kv {
  constructor(e = 1, t = 1, n = {}) {
    (super(e, t, n), (this.isWebGLRenderTarget = !0));
  }
}

class Sm extends Zt {
  constructor(e = null, t = 1, n = 1, r = 1) {
    (super(null),
      (this.isDataArrayTexture = !0),
      (this.image = { data: e, width: t, height: n, depth: r }),
      (this.magFilter = Yt),
      (this.minFilter = Yt),
      (this.wrapR = fr),
      (this.generateMipmaps = !1),
      (this.flipY = !1),
      (this.unpackAlignment = 1),
      (this.layerUpdates = new Set()));
  }
  addLayerUpdate(e) {
    this.layerUpdates.add(e);
  }
  clearLayerUpdates() {
    this.layerUpdates.clear();
  }
}

class Tv extends Zt {
  constructor(e = null, t = 1, n = 1, r = 1) {
    (super(null),
      (this.isData3DTexture = !0),
      (this.image = { data: e, width: t, height: n, depth: r }),
      (this.magFilter = Yt),
      (this.minFilter = Yt),
      (this.wrapR = fr),
      (this.generateMipmaps = !1),
      (this.flipY = !1),
      (this.unpackAlignment = 1));
  }
}

const KA = class KA {
  constructor(e, t, n, r, s, a, o, A, l, c, h, d, u, p, v, g) {
    ((this.elements = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
      e !== void 0 && this.set(e, t, n, r, s, a, o, A, l, c, h, d, u, p, v, g));
  }
  set(e, t, n, r, s, a, o, A, l, c, h, d, u, p, v, g) {
    const m = this.elements;
    return (
      (m[0] = e),
      (m[4] = t),
      (m[8] = n),
      (m[12] = r),
      (m[1] = s),
      (m[5] = a),
      (m[9] = o),
      (m[13] = A),
      (m[2] = l),
      (m[6] = c),
      (m[10] = h),
      (m[14] = d),
      (m[3] = u),
      (m[7] = p),
      (m[11] = v),
      (m[15] = g),
      this
    );
  }
  identity() {
    return (this.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1), this);
  }
  clone() {
    return new KA().fromArray(this.elements);
  }
  copy(e) {
    const t = this.elements,
      n = e.elements;
    return (
      (t[0] = n[0]),
      (t[1] = n[1]),
      (t[2] = n[2]),
      (t[3] = n[3]),
      (t[4] = n[4]),
      (t[5] = n[5]),
      (t[6] = n[6]),
      (t[7] = n[7]),
      (t[8] = n[8]),
      (t[9] = n[9]),
      (t[10] = n[10]),
      (t[11] = n[11]),
      (t[12] = n[12]),
      (t[13] = n[13]),
      (t[14] = n[14]),
      (t[15] = n[15]),
      this
    );
  }
  copyPosition(e) {
    const t = this.elements,
      n = e.elements;
    return ((t[12] = n[12]), (t[13] = n[13]), (t[14] = n[14]), this);
  }
  setFromMatrix3(e) {
    const t = e.elements;
    return (
      this.set(
        t[0],
        t[3],
        t[6],
        0,
        t[1],
        t[4],
        t[7],
        0,
        t[2],
        t[5],
        t[8],
        0,
        0,
        0,
        0,
        1,
      ),
      this
    );
  }
  extractBasis(e, t, n) {
    return this.determinantAffine() === 0
      ? (e.set(1, 0, 0), t.set(0, 1, 0), n.set(0, 0, 1), this)
      : (e.setFromMatrixColumn(this, 0),
        t.setFromMatrixColumn(this, 1),
        n.setFromMatrixColumn(this, 2),
        this);
  }
  makeBasis(e, t, n) {
    return (
      this.set(
        e.x,
        t.x,
        n.x,
        0,
        e.y,
        t.y,
        n.y,
        0,
        e.z,
        t.z,
        n.z,
        0,
        0,
        0,
        0,
        1,
      ),
      this
    );
  }
  extractRotation(e) {
    if (e.determinantAffine() === 0) return this.identity();
    const t = this.elements,
      n = e.elements,
      r = 1 / Qi.setFromMatrixColumn(e, 0).length(),
      s = 1 / Qi.setFromMatrixColumn(e, 1).length(),
      a = 1 / Qi.setFromMatrixColumn(e, 2).length();
    return (
      (t[0] = n[0] * r),
      (t[1] = n[1] * r),
      (t[2] = n[2] * r),
      (t[3] = 0),
      (t[4] = n[4] * s),
      (t[5] = n[5] * s),
      (t[6] = n[6] * s),
      (t[7] = 0),
      (t[8] = n[8] * a),
      (t[9] = n[9] * a),
      (t[10] = n[10] * a),
      (t[11] = 0),
      (t[12] = 0),
      (t[13] = 0),
      (t[14] = 0),
      (t[15] = 1),
      this
    );
  }
  makeRotationFromEuler(e) {
    const t = this.elements,
      n = e.x,
      r = e.y,
      s = e.z,
      a = Math.cos(n),
      o = Math.sin(n),
      A = Math.cos(r),
      l = Math.sin(r),
      c = Math.cos(s),
      h = Math.sin(s);
    if (e.order === "XYZ") {
      const d = a * c,
        u = a * h,
        p = o * c,
        v = o * h;
      ((t[0] = A * c),
        (t[4] = -A * h),
        (t[8] = l),
        (t[1] = u + p * l),
        (t[5] = d - v * l),
        (t[9] = -o * A),
        (t[2] = v - d * l),
        (t[6] = p + u * l),
        (t[10] = a * A));
    } else if (e.order === "YXZ") {
      const d = A * c,
        u = A * h,
        p = l * c,
        v = l * h;
      ((t[0] = d + v * o),
        (t[4] = p * o - u),
        (t[8] = a * l),
        (t[1] = a * h),
        (t[5] = a * c),
        (t[9] = -o),
        (t[2] = u * o - p),
        (t[6] = v + d * o),
        (t[10] = a * A));
    } else if (e.order === "ZXY") {
      const d = A * c,
        u = A * h,
        p = l * c,
        v = l * h;
      ((t[0] = d - v * o),
        (t[4] = -a * h),
        (t[8] = p + u * o),
        (t[1] = u + p * o),
        (t[5] = a * c),
        (t[9] = v - d * o),
        (t[2] = -a * l),
        (t[6] = o),
        (t[10] = a * A));
    } else if (e.order === "ZYX") {
      const d = a * c,
        u = a * h,
        p = o * c,
        v = o * h;
      ((t[0] = A * c),
        (t[4] = p * l - u),
        (t[8] = d * l + v),
        (t[1] = A * h),
        (t[5] = v * l + d),
        (t[9] = u * l - p),
        (t[2] = -l),
        (t[6] = o * A),
        (t[10] = a * A));
    } else if (e.order === "YZX") {
      const d = a * A,
        u = a * l,
        p = o * A,
        v = o * l;
      ((t[0] = A * c),
        (t[4] = v - d * h),
        (t[8] = p * h + u),
        (t[1] = h),
        (t[5] = a * c),
        (t[9] = -o * c),
        (t[2] = -l * c),
        (t[6] = u * h + p),
        (t[10] = d - v * h));
    } else if (e.order === "XZY") {
      const d = a * A,
        u = a * l,
        p = o * A,
        v = o * l;
      ((t[0] = A * c),
        (t[4] = -h),
        (t[8] = l * c),
        (t[1] = d * h + v),
        (t[5] = a * c),
        (t[9] = u * h - p),
        (t[2] = p * h - u),
        (t[6] = o * c),
        (t[10] = v * h + d));
    }
    return (
      (t[3] = 0),
      (t[7] = 0),
      (t[11] = 0),
      (t[12] = 0),
      (t[13] = 0),
      (t[14] = 0),
      (t[15] = 1),
      this
    );
  }
  makeRotationFromQuaternion(e) {
    return this.compose(Rv, e, Pv);
  }
  lookAt(e, t, n) {
    const r = this.elements;
    return (
      Sn.subVectors(e, t),
      Sn.lengthSq() === 0 && (Sn.z = 1),
      Sn.normalize(),
      zr.crossVectors(n, Sn),
      zr.lengthSq() === 0 &&
        (Math.abs(n.z) === 1 ? (Sn.x += 1e-4) : (Sn.z += 1e-4),
        Sn.normalize(),
        zr.crossVectors(n, Sn)),
      zr.normalize(),
      fo.crossVectors(Sn, zr),
      (r[0] = zr.x),
      (r[4] = fo.x),
      (r[8] = Sn.x),
      (r[1] = zr.y),
      (r[5] = fo.y),
      (r[9] = Sn.y),
      (r[2] = zr.z),
      (r[6] = fo.z),
      (r[10] = Sn.z),
      this
    );
  }
  multiply(e) {
    return this.multiplyMatrices(this, e);
  }
  premultiply(e) {
    return this.multiplyMatrices(e, this);
  }
  multiplyMatrices(e, t) {
    const n = e.elements,
      r = t.elements,
      s = this.elements,
      a = n[0],
      o = n[4],
      A = n[8],
      l = n[12],
      c = n[1],
      h = n[5],
      d = n[9],
      u = n[13],
      p = n[2],
      v = n[6],
      g = n[10],
      m = n[14],
      y = n[3],
      C = n[7],
      E = n[11],
      w = n[15],
      S = r[0],
      k = r[4],
      x = r[8],
      T = r[12],
      R = r[1],
      D = r[5],
      N = r[9],
      X = r[13],
      Y = r[2],
      H = r[6],
      V = r[10],
      J = r[14],
      ne = r[3],
      le = r[7],
      je = r[11],
      de = r[15];
    return (
      (s[0] = a * S + o * R + A * Y + l * ne),
      (s[4] = a * k + o * D + A * H + l * le),
      (s[8] = a * x + o * N + A * V + l * je),
      (s[12] = a * T + o * X + A * J + l * de),
      (s[1] = c * S + h * R + d * Y + u * ne),
      (s[5] = c * k + h * D + d * H + u * le),
      (s[9] = c * x + h * N + d * V + u * je),
      (s[13] = c * T + h * X + d * J + u * de),
      (s[2] = p * S + v * R + g * Y + m * ne),
      (s[6] = p * k + v * D + g * H + m * le),
      (s[10] = p * x + v * N + g * V + m * je),
      (s[14] = p * T + v * X + g * J + m * de),
      (s[3] = y * S + C * R + E * Y + w * ne),
      (s[7] = y * k + C * D + E * H + w * le),
      (s[11] = y * x + C * N + E * V + w * je),
      (s[15] = y * T + C * X + E * J + w * de),
      this
    );
  }
  multiplyScalar(e) {
    const t = this.elements;
    return (
      (t[0] *= e),
      (t[4] *= e),
      (t[8] *= e),
      (t[12] *= e),
      (t[1] *= e),
      (t[5] *= e),
      (t[9] *= e),
      (t[13] *= e),
      (t[2] *= e),
      (t[6] *= e),
      (t[10] *= e),
      (t[14] *= e),
      (t[3] *= e),
      (t[7] *= e),
      (t[11] *= e),
      (t[15] *= e),
      this
    );
  }
  determinant() {
    const e = this.elements,
      t = e[0],
      n = e[4],
      r = e[8],
      s = e[12],
      a = e[1],
      o = e[5],
      A = e[9],
      l = e[13],
      c = e[2],
      h = e[6],
      d = e[10],
      u = e[14],
      p = e[3],
      v = e[7],
      g = e[11],
      m = e[15],
      y = A * u - l * d,
      C = o * u - l * h,
      E = o * d - A * h,
      w = a * u - l * c,
      S = a * d - A * c,
      k = a * h - o * c;
    return (
      t * (v * y - g * C + m * E) -
      n * (p * y - g * w + m * S) +
      r * (p * C - v * w + m * k) -
      s * (p * E - v * S + g * k)
    );
  }
  determinantAffine() {
    const e = this.elements,
      t = e[0],
      n = e[4],
      r = e[8],
      s = e[1],
      a = e[5],
      o = e[9],
      A = e[2],
      l = e[6],
      c = e[10];
    return t * (a * c - o * l) - n * (s * c - o * A) + r * (s * l - a * A);
  }
  transpose() {
    const e = this.elements;
    let t;
    return (
      (t = e[1]),
      (e[1] = e[4]),
      (e[4] = t),
      (t = e[2]),
      (e[2] = e[8]),
      (e[8] = t),
      (t = e[6]),
      (e[6] = e[9]),
      (e[9] = t),
      (t = e[3]),
      (e[3] = e[12]),
      (e[12] = t),
      (t = e[7]),
      (e[7] = e[13]),
      (e[13] = t),
      (t = e[11]),
      (e[11] = e[14]),
      (e[14] = t),
      this
    );
  }
  setPosition(e, t, n) {
    const r = this.elements;
    return (
      e.isVector3
        ? ((r[12] = e.x), (r[13] = e.y), (r[14] = e.z))
        : ((r[12] = e), (r[13] = t), (r[14] = n)),
      this
    );
  }
  invert() {
    const e = this.elements,
      t = e[0],
      n = e[1],
      r = e[2],
      s = e[3],
      a = e[4],
      o = e[5],
      A = e[6],
      l = e[7],
      c = e[8],
      h = e[9],
      d = e[10],
      u = e[11],
      p = e[12],
      v = e[13],
      g = e[14],
      m = e[15],
      y = t * o - n * a,
      C = t * A - r * a,
      E = t * l - s * a,
      w = n * A - r * o,
      S = n * l - s * o,
      k = r * l - s * A,
      x = c * v - h * p,
      T = c * g - d * p,
      R = c * m - u * p,
      D = h * g - d * v,
      N = h * m - u * v,
      X = d * m - u * g,
      Y = y * X - C * N + E * D + w * R - S * T + k * x;
    if (Y === 0)
      return this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    const H = 1 / Y;
    return (
      (e[0] = (o * X - A * N + l * D) * H),
      (e[1] = (r * N - n * X - s * D) * H),
      (e[2] = (v * k - g * S + m * w) * H),
      (e[3] = (d * S - h * k - u * w) * H),
      (e[4] = (A * R - a * X - l * T) * H),
      (e[5] = (t * X - r * R + s * T) * H),
      (e[6] = (g * E - p * k - m * C) * H),
      (e[7] = (c * k - d * E + u * C) * H),
      (e[8] = (a * N - o * R + l * x) * H),
      (e[9] = (n * R - t * N - s * x) * H),
      (e[10] = (p * S - v * E + m * y) * H),
      (e[11] = (h * E - c * S - u * y) * H),
      (e[12] = (o * T - a * D - A * x) * H),
      (e[13] = (t * D - n * T + r * x) * H),
      (e[14] = (v * C - p * w - g * y) * H),
      (e[15] = (c * w - h * C + d * y) * H),
      this
    );
  }
  scale(e) {
    const t = this.elements,
      n = e.x,
      r = e.y,
      s = e.z;
    return (
      (t[0] *= n),
      (t[4] *= r),
      (t[8] *= s),
      (t[1] *= n),
      (t[5] *= r),
      (t[9] *= s),
      (t[2] *= n),
      (t[6] *= r),
      (t[10] *= s),
      (t[3] *= n),
      (t[7] *= r),
      (t[11] *= s),
      this
    );
  }
  getMaxScaleOnAxis() {
    const e = this.elements,
      t = e[0] * e[0] + e[1] * e[1] + e[2] * e[2],
      n = e[4] * e[4] + e[5] * e[5] + e[6] * e[6],
      r = e[8] * e[8] + e[9] * e[9] + e[10] * e[10];
    return Math.sqrt(Math.max(t, n, r));
  }
  makeTranslation(e, t, n) {
    return (
      e.isVector3
        ? this.set(1, 0, 0, e.x, 0, 1, 0, e.y, 0, 0, 1, e.z, 0, 0, 0, 1)
        : this.set(1, 0, 0, e, 0, 1, 0, t, 0, 0, 1, n, 0, 0, 0, 1),
      this
    );
  }
  makeRotationX(e) {
    const t = Math.cos(e),
      n = Math.sin(e);
    return (this.set(1, 0, 0, 0, 0, t, -n, 0, 0, n, t, 0, 0, 0, 0, 1), this);
  }
  makeRotationY(e) {
    const t = Math.cos(e),
      n = Math.sin(e);
    return (this.set(t, 0, n, 0, 0, 1, 0, 0, -n, 0, t, 0, 0, 0, 0, 1), this);
  }
  makeRotationZ(e) {
    const t = Math.cos(e),
      n = Math.sin(e);
    return (this.set(t, -n, 0, 0, n, t, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1), this);
  }
  makeRotationAxis(e, t) {
    const n = Math.cos(t),
      r = Math.sin(t),
      s = 1 - n,
      a = e.x,
      o = e.y,
      A = e.z,
      l = s * a,
      c = s * o;
    return (
      this.set(
        l * a + n,
        l * o - r * A,
        l * A + r * o,
        0,
        l * o + r * A,
        c * o + n,
        c * A - r * a,
        0,
        l * A - r * o,
        c * A + r * a,
        s * A * A + n,
        0,
        0,
        0,
        0,
        1,
      ),
      this
    );
  }
  makeScale(e, t, n) {
    return (this.set(e, 0, 0, 0, 0, t, 0, 0, 0, 0, n, 0, 0, 0, 0, 1), this);
  }
  makeShear(e, t, n, r, s, a) {
    return (this.set(1, n, s, 0, e, 1, a, 0, t, r, 1, 0, 0, 0, 0, 1), this);
  }
  compose(e, t, n) {
    const r = this.elements,
      s = t._x,
      a = t._y,
      o = t._z,
      A = t._w,
      l = s + s,
      c = a + a,
      h = o + o,
      d = s * l,
      u = s * c,
      p = s * h,
      v = a * c,
      g = a * h,
      m = o * h,
      y = A * l,
      C = A * c,
      E = A * h,
      w = n.x,
      S = n.y,
      k = n.z;
    return (
      (r[0] = (1 - (v + m)) * w),
      (r[1] = (u + E) * w),
      (r[2] = (p - C) * w),
      (r[3] = 0),
      (r[4] = (u - E) * S),
      (r[5] = (1 - (d + m)) * S),
      (r[6] = (g + y) * S),
      (r[7] = 0),
      (r[8] = (p + C) * k),
      (r[9] = (g - y) * k),
      (r[10] = (1 - (d + v)) * k),
      (r[11] = 0),
      (r[12] = e.x),
      (r[13] = e.y),
      (r[14] = e.z),
      (r[15] = 1),
      this
    );
  }
  decompose(e, t, n) {
    const r = this.elements;
    ((e.x = r[12]), (e.y = r[13]), (e.z = r[14]));
    const s = this.determinantAffine();
    if (s === 0) return (n.set(1, 1, 1), t.identity(), this);
    let a = Qi.set(r[0], r[1], r[2]).length();
    const o = Qi.set(r[4], r[5], r[6]).length(),
      A = Qi.set(r[8], r[9], r[10]).length();
    (s < 0 && (a = -a), Vn.copy(this));
    const l = 1 / a,
      c = 1 / o,
      h = 1 / A;
    return (
      (Vn.elements[0] *= l),
      (Vn.elements[1] *= l),
      (Vn.elements[2] *= l),
      (Vn.elements[4] *= c),
      (Vn.elements[5] *= c),
      (Vn.elements[6] *= c),
      (Vn.elements[8] *= h),
      (Vn.elements[9] *= h),
      (Vn.elements[10] *= h),
      t.setFromRotationMatrix(Vn),
      (n.x = a),
      (n.y = o),
      (n.z = A),
      this
    );
  }
  makePerspective(e, t, n, r, s, a, o = mr, A = !1) {
    const l = this.elements,
      c = (2 * s) / (t - e),
      h = (2 * s) / (n - r),
      d = (t + e) / (t - e),
      u = (n + r) / (n - r);
    let p, v;
    if (A) ((p = s / (a - s)), (v = (a * s) / (a - s)));
    else if (o === mr) ((p = -(a + s) / (a - s)), (v = (-2 * a * s) / (a - s)));
    else if (o === $a) ((p = -a / (a - s)), (v = (-a * s) / (a - s)));
    else
      throw new Error(
        "THREE.Matrix4.makePerspective(): Invalid coordinate system: " + o,
      );
    return (
      (l[0] = c),
      (l[4] = 0),
      (l[8] = d),
      (l[12] = 0),
      (l[1] = 0),
      (l[5] = h),
      (l[9] = u),
      (l[13] = 0),
      (l[2] = 0),
      (l[6] = 0),
      (l[10] = p),
      (l[14] = v),
      (l[3] = 0),
      (l[7] = 0),
      (l[11] = -1),
      (l[15] = 0),
      this
    );
  }
  makeOrthographic(e, t, n, r, s, a, o = mr, A = !1) {
    const l = this.elements,
      c = 2 / (t - e),
      h = 2 / (n - r),
      d = -(t + e) / (t - e),
      u = -(n + r) / (n - r);
    let p, v;
    if (A) ((p = 1 / (a - s)), (v = a / (a - s)));
    else if (o === mr) ((p = -2 / (a - s)), (v = -(a + s) / (a - s)));
    else if (o === $a) ((p = -1 / (a - s)), (v = -s / (a - s)));
    else
      throw new Error(
        "THREE.Matrix4.makeOrthographic(): Invalid coordinate system: " + o,
      );
    return (
      (l[0] = c),
      (l[4] = 0),
      (l[8] = 0),
      (l[12] = d),
      (l[1] = 0),
      (l[5] = h),
      (l[9] = 0),
      (l[13] = u),
      (l[2] = 0),
      (l[6] = 0),
      (l[10] = p),
      (l[14] = v),
      (l[3] = 0),
      (l[7] = 0),
      (l[11] = 0),
      (l[15] = 1),
      this
    );
  }
  equals(e) {
    const t = this.elements,
      n = e.elements;
    for (let r = 0; r < 16; r++) if (t[r] !== n[r]) return !1;
    return !0;
  }
  fromArray(e, t = 0) {
    for (let n = 0; n < 16; n++) this.elements[n] = e[n + t];
    return this;
  }
  toArray(e = [], t = 0) {
    const n = this.elements;
    return (
      (e[t] = n[0]),
      (e[t + 1] = n[1]),
      (e[t + 2] = n[2]),
      (e[t + 3] = n[3]),
      (e[t + 4] = n[4]),
      (e[t + 5] = n[5]),
      (e[t + 6] = n[6]),
      (e[t + 7] = n[7]),
      (e[t + 8] = n[8]),
      (e[t + 9] = n[9]),
      (e[t + 10] = n[10]),
      (e[t + 11] = n[11]),
      (e[t + 12] = n[12]),
      (e[t + 13] = n[13]),
      (e[t + 14] = n[14]),
      (e[t + 15] = n[15]),
      e
    );
  }
};

KA.prototype.isMatrix4 = !0;

let mt = KA;

const Qi = new F();

const Vn = new mt();

const Rv = new F(0, 0, 0);

const Pv = new F(1, 1, 1);

const zr = new F();

const fo = new F();

const Sn = new F();

const gu = new mt();

const vu = new jn();

class yr {
  constructor(e = 0, t = 0, n = 0, r = yr.DEFAULT_ORDER) {
    ((this.isEuler = !0),
      (this._x = e),
      (this._y = t),
      (this._z = n),
      (this._order = r));
  }
  get x() {
    return this._x;
  }
  set x(e) {
    ((this._x = e), this._onChangeCallback());
  }
  get y() {
    return this._y;
  }
  set y(e) {
    ((this._y = e), this._onChangeCallback());
  }
  get z() {
    return this._z;
  }
  set z(e) {
    ((this._z = e), this._onChangeCallback());
  }
  get order() {
    return this._order;
  }
  set order(e) {
    ((this._order = e), this._onChangeCallback());
  }
  set(e, t, n, r = this._order) {
    return (
      (this._x = e),
      (this._y = t),
      (this._z = n),
      (this._order = r),
      this._onChangeCallback(),
      this
    );
  }
  clone() {
    return new this.constructor(this._x, this._y, this._z, this._order);
  }
  copy(e) {
    return (
      (this._x = e._x),
      (this._y = e._y),
      (this._z = e._z),
      (this._order = e._order),
      this._onChangeCallback(),
      this
    );
  }
  setFromRotationMatrix(e, t = this._order, n = !0) {
    const r = e.elements,
      s = r[0],
      a = r[4],
      o = r[8],
      A = r[1],
      l = r[5],
      c = r[9],
      h = r[2],
      d = r[6],
      u = r[10];
    switch (t) {
      case "XYZ":
        ((this._y = Math.asin(xt(o, -1, 1))),
          Math.abs(o) < 0.9999999
            ? ((this._x = Math.atan2(-c, u)), (this._z = Math.atan2(-a, s)))
            : ((this._x = Math.atan2(d, l)), (this._z = 0)));
        break;
      case "YXZ":
        ((this._x = Math.asin(-xt(c, -1, 1))),
          Math.abs(c) < 0.9999999
            ? ((this._y = Math.atan2(o, u)), (this._z = Math.atan2(A, l)))
            : ((this._y = Math.atan2(-h, s)), (this._z = 0)));
        break;
      case "ZXY":
        ((this._x = Math.asin(xt(d, -1, 1))),
          Math.abs(d) < 0.9999999
            ? ((this._y = Math.atan2(-h, u)), (this._z = Math.atan2(-a, l)))
            : ((this._y = 0), (this._z = Math.atan2(A, s))));
        break;
      case "ZYX":
        ((this._y = Math.asin(-xt(h, -1, 1))),
          Math.abs(h) < 0.9999999
            ? ((this._x = Math.atan2(d, u)), (this._z = Math.atan2(A, s)))
            : ((this._x = 0), (this._z = Math.atan2(-a, l))));
        break;
      case "YZX":
        ((this._z = Math.asin(xt(A, -1, 1))),
          Math.abs(A) < 0.9999999
            ? ((this._x = Math.atan2(-c, l)), (this._y = Math.atan2(-h, s)))
            : ((this._x = 0), (this._y = Math.atan2(o, u))));
        break;
      case "XZY":
        ((this._z = Math.asin(-xt(a, -1, 1))),
          Math.abs(a) < 0.9999999
            ? ((this._x = Math.atan2(d, l)), (this._y = Math.atan2(o, s)))
            : ((this._x = Math.atan2(-c, u)), (this._y = 0)));
        break;
      default:
        it(
          "Euler: .setFromRotationMatrix() encountered an unknown order: " + t,
        );
    }
    return ((this._order = t), n === !0 && this._onChangeCallback(), this);
  }
  setFromQuaternion(e, t, n) {
    return (
      gu.makeRotationFromQuaternion(e),
      this.setFromRotationMatrix(gu, t, n)
    );
  }
  setFromVector3(e, t = this._order) {
    return this.set(e.x, e.y, e.z, t);
  }
  reorder(e) {
    return (vu.setFromEuler(this), this.setFromQuaternion(vu, e));
  }
  equals(e) {
    return (
      e._x === this._x &&
      e._y === this._y &&
      e._z === this._z &&
      e._order === this._order
    );
  }
  fromArray(e) {
    return (
      (this._x = e[0]),
      (this._y = e[1]),
      (this._z = e[2]),
      e[3] !== void 0 && (this._order = e[3]),
      this._onChangeCallback(),
      this
    );
  }
  toArray(e = [], t = 0) {
    return (
      (e[t] = this._x),
      (e[t + 1] = this._y),
      (e[t + 2] = this._z),
      (e[t + 3] = this._order),
      e
    );
  }
  _onChange(e) {
    return ((this._onChangeCallback = e), this);
  }
  _onChangeCallback() {}
  *[Symbol.iterator]() {
    (yield this._x, yield this._y, yield this._z, yield this._order);
  }
}

yr.DEFAULT_ORDER = "XYZ";

class wm {
  constructor() {
    this.mask = 1;
  }
  set(e) {
    this.mask = ((1 << e) | 0) >>> 0;
  }
  enable(e) {
    this.mask |= (1 << e) | 0;
  }
  enableAll() {
    this.mask = -1;
  }
  toggle(e) {
    this.mask ^= (1 << e) | 0;
  }
  disable(e) {
    this.mask &= ~((1 << e) | 0);
  }
  disableAll() {
    this.mask = 0;
  }
  test(e) {
    return (this.mask & e.mask) !== 0;
  }
  isEnabled(e) {
    return (this.mask & ((1 << e) | 0)) !== 0;
  }
}

let Iv = 0;

const ju = new F();

const es = new jn();

const wr = new mt();

const po = new F();

const Qs = new F();

const Lv = new F();

const Fv = new jn();

const _u = new F(1, 0, 0);

const Eu = new F(0, 1, 0);

const yu = new F(0, 0, 1);

const xu = { type: "added" };

const Dv = { type: "removed" };

const ts = { type: "childadded", child: null };

const wl = { type: "childremoved", child: null };

class It extends Wi {
  constructor() {
    (super(),
      (this.isObject3D = !0),
      Object.defineProperty(this, "id", { value: Iv++ }),
      (this.uuid = Un()),
      (this.name = ""),
      (this.type = "Object3D"),
      (this.parent = null),
      (this.children = []),
      (this.up = It.DEFAULT_UP.clone()));
    const e = new F(),
      t = new yr(),
      n = new jn(),
      r = new F(1, 1, 1);
    function s() {
      n.setFromEuler(t, !1);
    }
    function a() {
      t.setFromQuaternion(n, void 0, !1);
    }
    (t._onChange(s),
      n._onChange(a),
      Object.defineProperties(this, {
        position: { configurable: !0, enumerable: !0, value: e },
        rotation: { configurable: !0, enumerable: !0, value: t },
        quaternion: { configurable: !0, enumerable: !0, value: n },
        scale: { configurable: !0, enumerable: !0, value: r },
        modelViewMatrix: { value: new mt() },
        normalMatrix: { value: new jt() },
      }),
      (this.matrix = new mt()),
      (this.matrixWorld = new mt()),
      (this.matrixAutoUpdate = It.DEFAULT_MATRIX_AUTO_UPDATE),
      (this.matrixWorldAutoUpdate = It.DEFAULT_MATRIX_WORLD_AUTO_UPDATE),
      (this.matrixWorldNeedsUpdate = !1),
      (this.layers = new wm()),
      (this.visible = !0),
      (this.castShadow = !1),
      (this.receiveShadow = !1),
      (this.frustumCulled = !0),
      (this.renderOrder = 0),
      (this.animations = []),
      (this.customDepthMaterial = void 0),
      (this.customDistanceMaterial = void 0),
      (this.static = !1),
      (this.userData = {}),
      (this.pivot = null));
  }
  onBeforeShadow() {}
  onAfterShadow() {}
  onBeforeRender() {}
  onAfterRender() {}
  applyMatrix4(e) {
    (this.matrixAutoUpdate && this.updateMatrix(),
      this.matrix.premultiply(e),
      this.matrix.decompose(this.position, this.quaternion, this.scale));
  }
  applyQuaternion(e) {
    return (this.quaternion.premultiply(e), this);
  }
  setRotationFromAxisAngle(e, t) {
    this.quaternion.setFromAxisAngle(e, t);
  }
  setRotationFromEuler(e) {
    this.quaternion.setFromEuler(e, !0);
  }
  setRotationFromMatrix(e) {
    this.quaternion.setFromRotationMatrix(e);
  }
  setRotationFromQuaternion(e) {
    this.quaternion.copy(e);
  }
  rotateOnAxis(e, t) {
    return (es.setFromAxisAngle(e, t), this.quaternion.multiply(es), this);
  }
  rotateOnWorldAxis(e, t) {
    return (es.setFromAxisAngle(e, t), this.quaternion.premultiply(es), this);
  }
  rotateX(e) {
    return this.rotateOnAxis(_u, e);
  }
  rotateY(e) {
    return this.rotateOnAxis(Eu, e);
  }
  rotateZ(e) {
    return this.rotateOnAxis(yu, e);
  }
  translateOnAxis(e, t) {
    return (
      ju.copy(e).applyQuaternion(this.quaternion),
      this.position.add(ju.multiplyScalar(t)),
      this
    );
  }
  translateX(e) {
    return this.translateOnAxis(_u, e);
  }
  translateY(e) {
    return this.translateOnAxis(Eu, e);
  }
  translateZ(e) {
    return this.translateOnAxis(yu, e);
  }
  localToWorld(e) {
    return (this.updateWorldMatrix(!0, !1), e.applyMatrix4(this.matrixWorld));
  }
  worldToLocal(e) {
    return (
      this.updateWorldMatrix(!0, !1),
      e.applyMatrix4(wr.copy(this.matrixWorld).invert())
    );
  }
  lookAt(e, t, n) {
    e.isVector3 ? po.copy(e) : po.set(e, t, n);
    const r = this.parent;
    (this.updateWorldMatrix(!0, !1),
      Qs.setFromMatrixPosition(this.matrixWorld),
      this.isCamera || this.isLight
        ? wr.lookAt(Qs, po, this.up)
        : wr.lookAt(po, Qs, this.up),
      this.quaternion.setFromRotationMatrix(wr),
      r &&
        (wr.extractRotation(r.matrixWorld),
        es.setFromRotationMatrix(wr),
        this.quaternion.premultiply(es.invert())));
  }
  add(e) {
    if (arguments.length > 1) {
      for (let t = 0; t < arguments.length; t++) this.add(arguments[t]);
      return this;
    }
    return e === this
      ? (ut("Object3D.add: object can't be added as a child of itself.", e),
        this)
      : (e && e.isObject3D
          ? (e.removeFromParent(),
            (e.parent = this),
            this.children.push(e),
            e.dispatchEvent(xu),
            (ts.child = e),
            this.dispatchEvent(ts),
            (ts.child = null))
          : ut("Object3D.add: object not an instance of THREE.Object3D.", e),
        this);
  }
  remove(e) {
    if (arguments.length > 1) {
      for (let n = 0; n < arguments.length; n++) this.remove(arguments[n]);
      return this;
    }
    const t = this.children.indexOf(e);
    return (
      t !== -1 &&
        ((e.parent = null),
        this.children.splice(t, 1),
        e.dispatchEvent(Dv),
        (wl.child = e),
        this.dispatchEvent(wl),
        (wl.child = null)),
      this
    );
  }
  removeFromParent() {
    const e = this.parent;
    return (e !== null && e.remove(this), this);
  }
  clear() {
    return this.remove(...this.children);
  }
  attach(e) {
    return (
      this.updateWorldMatrix(!0, !1),
      wr.copy(this.matrixWorld).invert(),
      e.parent !== null &&
        (e.parent.updateWorldMatrix(!0, !1), wr.multiply(e.parent.matrixWorld)),
      e.applyMatrix4(wr),
      e.removeFromParent(),
      (e.parent = this),
      this.children.push(e),
      e.updateWorldMatrix(!1, !0),
      e.dispatchEvent(xu),
      (ts.child = e),
      this.dispatchEvent(ts),
      (ts.child = null),
      this
    );
  }
  getObjectById(e) {
    return this.getObjectByProperty("id", e);
  }
  getObjectByName(e) {
    return this.getObjectByProperty("name", e);
  }
  getObjectByProperty(e, t) {
    if (this[e] === t) return this;
    for (let n = 0, r = this.children.length; n < r; n++) {
      const a = this.children[n].getObjectByProperty(e, t);
      if (a !== void 0) return a;
    }
  }
  getObjectsByProperty(e, t, n = []) {
    this[e] === t && n.push(this);
    const r = this.children;
    for (let s = 0, a = r.length; s < a; s++)
      r[s].getObjectsByProperty(e, t, n);
    return n;
  }
  getWorldPosition(e) {
    return (
      this.updateWorldMatrix(!0, !1),
      e.setFromMatrixPosition(this.matrixWorld)
    );
  }
  getWorldQuaternion(e) {
    return (
      this.updateWorldMatrix(!0, !1),
      this.matrixWorld.decompose(Qs, e, Lv),
      e
    );
  }
  getWorldScale(e) {
    return (
      this.updateWorldMatrix(!0, !1),
      this.matrixWorld.decompose(Qs, Fv, e),
      e
    );
  }
  getWorldDirection(e) {
    this.updateWorldMatrix(!0, !1);
    const t = this.matrixWorld.elements;
    return e.set(t[8], t[9], t[10]).normalize();
  }
  raycast() {}
  traverse(e) {
    e(this);
    const t = this.children;
    for (let n = 0, r = t.length; n < r; n++) t[n].traverse(e);
  }
  traverseVisible(e) {
    if (this.visible === !1) return;
    e(this);
    const t = this.children;
    for (let n = 0, r = t.length; n < r; n++) t[n].traverseVisible(e);
  }
  traverseAncestors(e) {
    const t = this.parent;
    t !== null && (e(t), t.traverseAncestors(e));
  }
  updateMatrix() {
    this.matrix.compose(this.position, this.quaternion, this.scale);
    const e = this.pivot;
    if (e !== null) {
      const t = e.x,
        n = e.y,
        r = e.z,
        s = this.matrix.elements;
      ((s[12] += t - s[0] * t - s[4] * n - s[8] * r),
        (s[13] += n - s[1] * t - s[5] * n - s[9] * r),
        (s[14] += r - s[2] * t - s[6] * n - s[10] * r));
    }
    this.matrixWorldNeedsUpdate = !0;
  }
  updateMatrixWorld(e) {
    (this.matrixAutoUpdate && this.updateMatrix(),
      (this.matrixWorldNeedsUpdate || e) &&
        (this.matrixWorldAutoUpdate === !0 &&
          (this.parent === null
            ? this.matrixWorld.copy(this.matrix)
            : this.matrixWorld.multiplyMatrices(
                this.parent.matrixWorld,
                this.matrix,
              )),
        (this.matrixWorldNeedsUpdate = !1),
        (e = !0)));
    const t = this.children;
    for (let n = 0, r = t.length; n < r; n++) t[n].updateMatrixWorld(e);
  }
  updateWorldMatrix(e, t, n = !1) {
    const r = this.parent;
    if (
      (e === !0 && r !== null && r.updateWorldMatrix(!0, !1),
      this.matrixAutoUpdate && this.updateMatrix(),
      (this.matrixWorldNeedsUpdate || n) &&
        (this.matrixWorldAutoUpdate === !0 &&
          (this.parent === null
            ? this.matrixWorld.copy(this.matrix)
            : this.matrixWorld.multiplyMatrices(
                this.parent.matrixWorld,
                this.matrix,
              )),
        (this.matrixWorldNeedsUpdate = !1),
        (n = !0)),
      t === !0)
    ) {
      const s = this.children;
      for (let a = 0, o = s.length; a < o; a++)
        s[a].updateWorldMatrix(!1, !0, n);
    }
  }
  toJSON(e) {
    const t = e === void 0 || typeof e == "string",
      n = {};
    t &&
      ((e = {
        geometries: {},
        materials: {},
        textures: {},
        images: {},
        shapes: {},
        skeletons: {},
        animations: {},
        nodes: {},
      }),
      (n.metadata = {
        version: 4.7,
        type: "Object",
        generator: "Object3D.toJSON",
      }));
    const r = {};
    ((r.uuid = this.uuid),
      (r.type = this.type),
      this.name !== "" && (r.name = this.name),
      this.castShadow === !0 && (r.castShadow = !0),
      this.receiveShadow === !0 && (r.receiveShadow = !0),
      this.visible === !1 && (r.visible = !1),
      this.frustumCulled === !1 && (r.frustumCulled = !1),
      this.renderOrder !== 0 && (r.renderOrder = this.renderOrder),
      this.static !== !1 && (r.static = this.static),
      Object.keys(this.userData).length > 0 && (r.userData = this.userData),
      (r.layers = this.layers.mask),
      (r.matrix = this.matrix.toArray()),
      (r.up = this.up.toArray()),
      this.pivot !== null && (r.pivot = this.pivot.toArray()),
      this.matrixAutoUpdate === !1 && (r.matrixAutoUpdate = !1),
      this.morphTargetDictionary !== void 0 &&
        (r.morphTargetDictionary = Object.assign(
          {},
          this.morphTargetDictionary,
        )),
      this.morphTargetInfluences !== void 0 &&
        (r.morphTargetInfluences = this.morphTargetInfluences.slice()),
      this.isInstancedMesh &&
        ((r.type = "InstancedMesh"),
        (r.count = this.count),
        (r.instanceMatrix = this.instanceMatrix.toJSON()),
        this.instanceColor !== null &&
          (r.instanceColor = this.instanceColor.toJSON())),
      this.isBatchedMesh &&
        ((r.type = "BatchedMesh"),
        (r.perObjectFrustumCulled = this.perObjectFrustumCulled),
        (r.sortObjects = this.sortObjects),
        (r.drawRanges = this._drawRanges),
        (r.reservedRanges = this._reservedRanges),
        (r.geometryInfo = this._geometryInfo.map((o) => ({
          ...o,
          boundingBox: o.boundingBox ? o.boundingBox.toJSON() : void 0,
          boundingSphere: o.boundingSphere ? o.boundingSphere.toJSON() : void 0,
        }))),
        (r.instanceInfo = this._instanceInfo.map((o) => ({ ...o }))),
        (r.availableInstanceIds = this._availableInstanceIds.slice()),
        (r.availableGeometryIds = this._availableGeometryIds.slice()),
        (r.nextIndexStart = this._nextIndexStart),
        (r.nextVertexStart = this._nextVertexStart),
        (r.geometryCount = this._geometryCount),
        (r.maxInstanceCount = this._maxInstanceCount),
        (r.maxVertexCount = this._maxVertexCount),
        (r.maxIndexCount = this._maxIndexCount),
        (r.geometryInitialized = this._geometryInitialized),
        (r.matricesTexture = this._matricesTexture.toJSON(e)),
        (r.indirectTexture = this._indirectTexture.toJSON(e)),
        this._colorsTexture !== null &&
          (r.colorsTexture = this._colorsTexture.toJSON(e)),
        this.boundingSphere !== null &&
          (r.boundingSphere = this.boundingSphere.toJSON()),
        this.boundingBox !== null &&
          (r.boundingBox = this.boundingBox.toJSON())));
    function s(o, A) {
      return (o[A.uuid] === void 0 && (o[A.uuid] = A.toJSON(e)), A.uuid);
    }
    if (this.isScene)
      (this.background &&
        (this.background.isColor
          ? (r.background = this.background.toJSON())
          : this.background.isTexture &&
            (r.background = this.background.toJSON(e).uuid)),
        this.environment &&
          this.environment.isTexture &&
          this.environment.isRenderTargetTexture !== !0 &&
          (r.environment = this.environment.toJSON(e).uuid));
    else if (this.isMesh || this.isLine || this.isPoints) {
      r.geometry = s(e.geometries, this.geometry);
      const o = this.geometry.parameters;
      if (o !== void 0 && o.shapes !== void 0) {
        const A = o.shapes;
        if (Array.isArray(A))
          for (let l = 0, c = A.length; l < c; l++) {
            const h = A[l];
            s(e.shapes, h);
          }
        else s(e.shapes, A);
      }
    }
    if (
      (this.isSkinnedMesh &&
        ((r.bindMode = this.bindMode),
        (r.bindMatrix = this.bindMatrix.toArray()),
        this.skeleton !== void 0 &&
          (s(e.skeletons, this.skeleton), (r.skeleton = this.skeleton.uuid))),
      this.material !== void 0)
    )
      if (Array.isArray(this.material)) {
        const o = [];
        for (let A = 0, l = this.material.length; A < l; A++)
          o.push(s(e.materials, this.material[A]));
        r.material = o;
      } else r.material = s(e.materials, this.material);
    if (this.children.length > 0) {
      r.children = [];
      for (let o = 0; o < this.children.length; o++)
        r.children.push(this.children[o].toJSON(e).object);
    }
    if (this.animations.length > 0) {
      r.animations = [];
      for (let o = 0; o < this.animations.length; o++) {
        const A = this.animations[o];
        r.animations.push(s(e.animations, A));
      }
    }
    if (t) {
      const o = a(e.geometries),
        A = a(e.materials),
        l = a(e.textures),
        c = a(e.images),
        h = a(e.shapes),
        d = a(e.skeletons),
        u = a(e.animations),
        p = a(e.nodes);
      (o.length > 0 && (n.geometries = o),
        A.length > 0 && (n.materials = A),
        l.length > 0 && (n.textures = l),
        c.length > 0 && (n.images = c),
        h.length > 0 && (n.shapes = h),
        d.length > 0 && (n.skeletons = d),
        u.length > 0 && (n.animations = u),
        p.length > 0 && (n.nodes = p));
    }
    return ((n.object = r), n);
    function a(o) {
      const A = [];
      for (const l in o) {
        const c = o[l];
        (delete c.metadata, A.push(c));
      }
      return A;
    }
  }
  clone(e) {
    return new this.constructor().copy(this, e);
  }
  copy(e, t = !0) {
    if (
      ((this.name = e.name),
      this.up.copy(e.up),
      this.position.copy(e.position),
      (this.rotation.order = e.rotation.order),
      this.quaternion.copy(e.quaternion),
      this.scale.copy(e.scale),
      (this.pivot = e.pivot !== null ? e.pivot.clone() : null),
      this.matrix.copy(e.matrix),
      this.matrixWorld.copy(e.matrixWorld),
      (this.matrixAutoUpdate = e.matrixAutoUpdate),
      (this.matrixWorldAutoUpdate = e.matrixWorldAutoUpdate),
      (this.matrixWorldNeedsUpdate = e.matrixWorldNeedsUpdate),
      (this.layers.mask = e.layers.mask),
      (this.visible = e.visible),
      (this.castShadow = e.castShadow),
      (this.receiveShadow = e.receiveShadow),
      (this.frustumCulled = e.frustumCulled),
      (this.renderOrder = e.renderOrder),
      (this.static = e.static),
      (this.animations = e.animations.slice()),
      (this.userData = JSON.parse(JSON.stringify(e.userData))),
      t === !0)
    )
      for (let n = 0; n < e.children.length; n++) {
        const r = e.children[n];
        this.add(r.clone());
      }
    return this;
  }
}

It.DEFAULT_UP = new F(0, 1, 0);

It.DEFAULT_MATRIX_AUTO_UPDATE = !0;

It.DEFAULT_MATRIX_WORLD_AUTO_UPDATE = !0;

class dt extends It {
  constructor() {
    (super(), (this.isGroup = !0), (this.type = "Group"));
  }
}

const Nv = { type: "move" };

class Ml {
  constructor() {
    ((this._targetRay = null), (this._grip = null), (this._hand = null));
  }
  getHandSpace() {
    return (
      this._hand === null &&
        ((this._hand = new dt()),
        (this._hand.matrixAutoUpdate = !1),
        (this._hand.visible = !1),
        (this._hand.joints = {}),
        (this._hand.inputState = { pinching: !1 })),
      this._hand
    );
  }
  getTargetRaySpace() {
    return (
      this._targetRay === null &&
        ((this._targetRay = new dt()),
        (this._targetRay.matrixAutoUpdate = !1),
        (this._targetRay.visible = !1),
        (this._targetRay.hasLinearVelocity = !1),
        (this._targetRay.linearVelocity = new F()),
        (this._targetRay.hasAngularVelocity = !1),
        (this._targetRay.angularVelocity = new F())),
      this._targetRay
    );
  }
  getGripSpace() {
    return (
      this._grip === null &&
        ((this._grip = new dt()),
        (this._grip.matrixAutoUpdate = !1),
        (this._grip.visible = !1),
        (this._grip.hasLinearVelocity = !1),
        (this._grip.linearVelocity = new F()),
        (this._grip.hasAngularVelocity = !1),
        (this._grip.angularVelocity = new F()),
        (this._grip.eventsEnabled = !1)),
      this._grip
    );
  }
  dispatchEvent(e) {
    return (
      this._targetRay !== null && this._targetRay.dispatchEvent(e),
      this._grip !== null && this._grip.dispatchEvent(e),
      this._hand !== null && this._hand.dispatchEvent(e),
      this
    );
  }
  connect(e) {
    if (e && e.hand) {
      const t = this._hand;
      if (t) for (const n of e.hand.values()) this._getHandJoint(t, n);
    }
    return (this.dispatchEvent({ type: "connected", data: e }), this);
  }
  disconnect(e) {
    return (
      this.dispatchEvent({ type: "disconnected", data: e }),
      this._targetRay !== null && (this._targetRay.visible = !1),
      this._grip !== null && (this._grip.visible = !1),
      this._hand !== null && (this._hand.visible = !1),
      this
    );
  }
  update(e, t, n) {
    let r = null,
      s = null,
      a = null;
    const o = this._targetRay,
      A = this._grip,
      l = this._hand;
    if (e && t.session.visibilityState !== "visible-blurred") {
      if (l && e.hand) {
        a = !0;
        for (const v of e.hand.values()) {
          const g = t.getJointPose(v, n),
            m = this._getHandJoint(l, v);
          (g !== null &&
            (m.matrix.fromArray(g.transform.matrix),
            m.matrix.decompose(m.position, m.rotation, m.scale),
            (m.matrixWorldNeedsUpdate = !0),
            (m.jointRadius = g.radius)),
            (m.visible = g !== null));
        }
        const c = l.joints["index-finger-tip"],
          h = l.joints["thumb-tip"],
          d = c.position.distanceTo(h.position),
          u = 0.02,
          p = 0.005;
        l.inputState.pinching && d > u + p
          ? ((l.inputState.pinching = !1),
            this.dispatchEvent({
              type: "pinchend",
              handedness: e.handedness,
              target: this,
            }))
          : !l.inputState.pinching &&
            d <= u - p &&
            ((l.inputState.pinching = !0),
            this.dispatchEvent({
              type: "pinchstart",
              handedness: e.handedness,
              target: this,
            }));
      } else
        A !== null &&
          e.gripSpace &&
          ((s = t.getPose(e.gripSpace, n)),
          s !== null &&
            (A.matrix.fromArray(s.transform.matrix),
            A.matrix.decompose(A.position, A.rotation, A.scale),
            (A.matrixWorldNeedsUpdate = !0),
            s.linearVelocity
              ? ((A.hasLinearVelocity = !0),
                A.linearVelocity.copy(s.linearVelocity))
              : (A.hasLinearVelocity = !1),
            s.angularVelocity
              ? ((A.hasAngularVelocity = !0),
                A.angularVelocity.copy(s.angularVelocity))
              : (A.hasAngularVelocity = !1),
            A.eventsEnabled &&
              A.dispatchEvent({ type: "gripUpdated", data: e, target: this })));
      o !== null &&
        ((r = t.getPose(e.targetRaySpace, n)),
        r === null && s !== null && (r = s),
        r !== null &&
          (o.matrix.fromArray(r.transform.matrix),
          o.matrix.decompose(o.position, o.rotation, o.scale),
          (o.matrixWorldNeedsUpdate = !0),
          r.linearVelocity
            ? ((o.hasLinearVelocity = !0),
              o.linearVelocity.copy(r.linearVelocity))
            : (o.hasLinearVelocity = !1),
          r.angularVelocity
            ? ((o.hasAngularVelocity = !0),
              o.angularVelocity.copy(r.angularVelocity))
            : (o.hasAngularVelocity = !1),
          this.dispatchEvent(Nv)));
    }
    return (
      o !== null && (o.visible = r !== null),
      A !== null && (A.visible = s !== null),
      l !== null && (l.visible = a !== null),
      this
    );
  }
  _getHandJoint(e, t) {
    if (e.joints[t.jointName] === void 0) {
      const n = new dt();
      ((n.matrixAutoUpdate = !1),
        (n.visible = !1),
        (e.joints[t.jointName] = n),
        e.add(n));
    }
    return e.joints[t.jointName];
  }
}

const Mm = {
    aliceblue: 15792383,
    antiquewhite: 16444375,
    aqua: 65535,
    aquamarine: 8388564,
    azure: 15794175,
    beige: 16119260,
    bisque: 16770244,
    black: 0,
    blanchedalmond: 16772045,
    blue: 255,
    blueviolet: 9055202,
    brown: 10824234,
    burlywood: 14596231,
    cadetblue: 6266528,
    chartreuse: 8388352,
    chocolate: 13789470,
    coral: 16744272,
    cornflowerblue: 6591981,
    cornsilk: 16775388,
    crimson: 14423100,
    cyan: 65535,
    darkblue: 139,
    darkcyan: 35723,
    darkgoldenrod: 12092939,
    darkgray: 11119017,
    darkgreen: 25600,
    darkgrey: 11119017,
    darkkhaki: 12433259,
    darkmagenta: 9109643,
    darkolivegreen: 5597999,
    darkorange: 16747520,
    darkorchid: 10040012,
    darkred: 9109504,
    darksalmon: 15308410,
    darkseagreen: 9419919,
    darkslateblue: 4734347,
    darkslategray: 3100495,
    darkslategrey: 3100495,
    darkturquoise: 52945,
    darkviolet: 9699539,
    deeppink: 16716947,
    deepskyblue: 49151,
    dimgray: 6908265,
    dimgrey: 6908265,
    dodgerblue: 2003199,
    firebrick: 11674146,
    floralwhite: 16775920,
    forestgreen: 2263842,
    fuchsia: 16711935,
    gainsboro: 14474460,
    ghostwhite: 16316671,
    gold: 16766720,
    goldenrod: 14329120,
    gray: 8421504,
    green: 32768,
    greenyellow: 11403055,
    grey: 8421504,
    honeydew: 15794160,
    hotpink: 16738740,
    indianred: 13458524,
    indigo: 4915330,
    ivory: 16777200,
    khaki: 15787660,
    lavender: 15132410,
    lavenderblush: 16773365,
    lawngreen: 8190976,
    lemonchiffon: 16775885,
    lightblue: 11393254,
    lightcoral: 15761536,
    lightcyan: 14745599,
    lightgoldenrodyellow: 16448210,
    lightgray: 13882323,
    lightgreen: 9498256,
    lightgrey: 13882323,
    lightpink: 16758465,
    lightsalmon: 16752762,
    lightseagreen: 2142890,
    lightskyblue: 8900346,
    lightslategray: 7833753,
    lightslategrey: 7833753,
    lightsteelblue: 11584734,
    lightyellow: 16777184,
    lime: 65280,
    limegreen: 3329330,
    linen: 16445670,
    magenta: 16711935,
    maroon: 8388608,
    mediumaquamarine: 6737322,
    mediumblue: 205,
    mediumorchid: 12211667,
    mediumpurple: 9662683,
    mediumseagreen: 3978097,
    mediumslateblue: 8087790,
    mediumspringgreen: 64154,
    mediumturquoise: 4772300,
    mediumvioletred: 13047173,
    midnightblue: 1644912,
    mintcream: 16121850,
    mistyrose: 16770273,
    moccasin: 16770229,
    navajowhite: 16768685,
    navy: 128,
    oldlace: 16643558,
    olive: 8421376,
    olivedrab: 7048739,
    orange: 16753920,
    orangered: 16729344,
    orchid: 14315734,
    palegoldenrod: 15657130,
    palegreen: 10025880,
    paleturquoise: 11529966,
    palevioletred: 14381203,
    papayawhip: 16773077,
    peachpuff: 16767673,
    peru: 13468991,
    pink: 16761035,
    plum: 14524637,
    powderblue: 11591910,
    purple: 8388736,
    rebeccapurple: 6697881,
    red: 16711680,
    rosybrown: 12357519,
    royalblue: 4286945,
    saddlebrown: 9127187,
    salmon: 16416882,
    sandybrown: 16032864,
    seagreen: 3050327,
    seashell: 16774638,
    sienna: 10506797,
    silver: 12632256,
    skyblue: 8900331,
    slateblue: 6970061,
    slategray: 7372944,
    slategrey: 7372944,
    snow: 16775930,
    springgreen: 65407,
    steelblue: 4620980,
    tan: 13808780,
    teal: 32896,
    thistle: 14204888,
    tomato: 16737095,
    turquoise: 4251856,
    violet: 15631086,
    wheat: 16113331,
    white: 16777215,
    whitesmoke: 16119285,
    yellow: 16776960,
    yellowgreen: 10145074,
  };

const Vr = { h: 0, s: 0, l: 0 };

const mo = { h: 0, s: 0, l: 0 };

function Bl(i, e, t) {
  return (
    t < 0 && (t += 1),
    t > 1 && (t -= 1),
    t < 1 / 6
      ? i + (e - i) * 6 * t
      : t < 1 / 2
        ? e
        : t < 2 / 3
          ? i + (e - i) * 6 * (2 / 3 - t)
          : i
  );
}

class Ne {
  constructor(e, t, n) {
    return (
      (this.isColor = !0),
      (this.r = 1),
      (this.g = 1),
      (this.b = 1),
      this.set(e, t, n)
    );
  }
  set(e, t, n) {
    if (t === void 0 && n === void 0) {
      const r = e;
      r && r.isColor
        ? this.copy(r)
        : typeof r == "number"
          ? this.setHex(r)
          : typeof r == "string" && this.setStyle(r);
    } else this.setRGB(e, t, n);
    return this;
  }
  setScalar(e) {
    return ((this.r = e), (this.g = e), (this.b = e), this);
  }
  setHex(e, t = Ht) {
    return (
      (e = Math.floor(e)),
      (this.r = ((e >> 16) & 255) / 255),
      (this.g = ((e >> 8) & 255) / 255),
      (this.b = (e & 255) / 255),
      bt.colorSpaceToWorking(this, t),
      this
    );
  }
  setRGB(e, t, n, r = bt.workingColorSpace) {
    return (
      (this.r = e),
      (this.g = t),
      (this.b = n),
      bt.colorSpaceToWorking(this, r),
      this
    );
  }
  setHSL(e, t, n, r = bt.workingColorSpace) {
    if (((e = jd(e, 1)), (t = xt(t, 0, 1)), (n = xt(n, 0, 1)), t === 0))
      this.r = this.g = this.b = n;
    else {
      const s = n <= 0.5 ? n * (1 + t) : n + t - n * t,
        a = 2 * n - s;
      ((this.r = Bl(a, s, e + 1 / 3)),
        (this.g = Bl(a, s, e)),
        (this.b = Bl(a, s, e - 1 / 3)));
    }
    return (bt.colorSpaceToWorking(this, r), this);
  }
  setStyle(e, t = Ht) {
    function n(s) {
      s !== void 0 &&
        parseFloat(s) < 1 &&
        it("Color: Alpha component of " + e + " will be ignored.");
    }
    let r;
    if ((r = /^(\w+)\(([^\)]*)\)/.exec(e))) {
      let s;
      const a = r[1],
        o = r[2];
      switch (a) {
        case "rgb":
        case "rgba":
          if (
            (s =
              /^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(
                o,
              ))
          )
            return (
              n(s[4]),
              this.setRGB(
                Math.min(255, parseInt(s[1], 10)) / 255,
                Math.min(255, parseInt(s[2], 10)) / 255,
                Math.min(255, parseInt(s[3], 10)) / 255,
                t,
              )
            );
          if (
            (s =
              /^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(
                o,
              ))
          )
            return (
              n(s[4]),
              this.setRGB(
                Math.min(100, parseInt(s[1], 10)) / 100,
                Math.min(100, parseInt(s[2], 10)) / 100,
                Math.min(100, parseInt(s[3], 10)) / 100,
                t,
              )
            );
          break;
        case "hsl":
        case "hsla":
          if (
            (s =
              /^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(
                o,
              ))
          )
            return (
              n(s[4]),
              this.setHSL(
                parseFloat(s[1]) / 360,
                parseFloat(s[2]) / 100,
                parseFloat(s[3]) / 100,
                t,
              )
            );
          break;
        default:
          it("Color: Unknown color model " + e);
      }
    } else if ((r = /^\#([A-Fa-f\d]+)$/.exec(e))) {
      const s = r[1],
        a = s.length;
      if (a === 3)
        return this.setRGB(
          parseInt(s.charAt(0), 16) / 15,
          parseInt(s.charAt(1), 16) / 15,
          parseInt(s.charAt(2), 16) / 15,
          t,
        );
      if (a === 6) return this.setHex(parseInt(s, 16), t);
      it("Color: Invalid hex color " + e);
    } else if (e && e.length > 0) return this.setColorName(e, t);
    return this;
  }
  setColorName(e, t = Ht) {
    const n = Mm[e.toLowerCase()];
    return (
      n !== void 0 ? this.setHex(n, t) : it("Color: Unknown color " + e),
      this
    );
  }
  clone() {
    return new this.constructor(this.r, this.g, this.b);
  }
  copy(e) {
    return ((this.r = e.r), (this.g = e.g), (this.b = e.b), this);
  }
  copySRGBToLinear(e) {
    return ((this.r = Or(e.r)), (this.g = Or(e.g)), (this.b = Or(e.b)), this);
  }
  copyLinearToSRGB(e) {
    return ((this.r = ks(e.r)), (this.g = ks(e.g)), (this.b = ks(e.b)), this);
  }
  convertSRGBToLinear() {
    return (this.copySRGBToLinear(this), this);
  }
  convertLinearToSRGB() {
    return (this.copyLinearToSRGB(this), this);
  }
  getHex(e = Ht) {
    return (
      bt.workingToColorSpace(dn.copy(this), e),
      Math.round(xt(dn.r * 255, 0, 255)) * 65536 +
        Math.round(xt(dn.g * 255, 0, 255)) * 256 +
        Math.round(xt(dn.b * 255, 0, 255))
    );
  }
  getHexString(e = Ht) {
    return ("000000" + this.getHex(e).toString(16)).slice(-6);
  }
  getHSL(e, t = bt.workingColorSpace) {
    bt.workingToColorSpace(dn.copy(this), t);
    const n = dn.r,
      r = dn.g,
      s = dn.b,
      a = Math.max(n, r, s),
      o = Math.min(n, r, s);
    let A, l;
    const c = (o + a) / 2;
    if (o === a) ((A = 0), (l = 0));
    else {
      const h = a - o;
      switch (((l = c <= 0.5 ? h / (a + o) : h / (2 - a - o)), a)) {
        case n:
          A = (r - s) / h + (r < s ? 6 : 0);
          break;
        case r:
          A = (s - n) / h + 2;
          break;
        case s:
          A = (n - r) / h + 4;
          break;
      }
      A /= 6;
    }
    return ((e.h = A), (e.s = l), (e.l = c), e);
  }
  getRGB(e, t = bt.workingColorSpace) {
    return (
      bt.workingToColorSpace(dn.copy(this), t),
      (e.r = dn.r),
      (e.g = dn.g),
      (e.b = dn.b),
      e
    );
  }
  getStyle(e = Ht) {
    bt.workingToColorSpace(dn.copy(this), e);
    const t = dn.r,
      n = dn.g,
      r = dn.b;
    return e !== Ht
      ? `color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`
      : `rgb(${Math.round(t * 255)},${Math.round(n * 255)},${Math.round(r * 255)})`;
  }
  offsetHSL(e, t, n) {
    return (this.getHSL(Vr), this.setHSL(Vr.h + e, Vr.s + t, Vr.l + n));
  }
  add(e) {
    return ((this.r += e.r), (this.g += e.g), (this.b += e.b), this);
  }
  addColors(e, t) {
    return (
      (this.r = e.r + t.r),
      (this.g = e.g + t.g),
      (this.b = e.b + t.b),
      this
    );
  }
  addScalar(e) {
    return ((this.r += e), (this.g += e), (this.b += e), this);
  }
  sub(e) {
    return (
      (this.r = Math.max(0, this.r - e.r)),
      (this.g = Math.max(0, this.g - e.g)),
      (this.b = Math.max(0, this.b - e.b)),
      this
    );
  }
  multiply(e) {
    return ((this.r *= e.r), (this.g *= e.g), (this.b *= e.b), this);
  }
  multiplyScalar(e) {
    return ((this.r *= e), (this.g *= e), (this.b *= e), this);
  }
  lerp(e, t) {
    return (
      (this.r += (e.r - this.r) * t),
      (this.g += (e.g - this.g) * t),
      (this.b += (e.b - this.b) * t),
      this
    );
  }
  lerpColors(e, t, n) {
    return (
      (this.r = e.r + (t.r - e.r) * n),
      (this.g = e.g + (t.g - e.g) * n),
      (this.b = e.b + (t.b - e.b) * n),
      this
    );
  }
  lerpHSL(e, t) {
    (this.getHSL(Vr), e.getHSL(mo));
    const n = Ta(Vr.h, mo.h, t),
      r = Ta(Vr.s, mo.s, t),
      s = Ta(Vr.l, mo.l, t);
    return (this.setHSL(n, r, s), this);
  }
  setFromVector3(e) {
    return ((this.r = e.x), (this.g = e.y), (this.b = e.z), this);
  }
  applyMatrix3(e) {
    const t = this.r,
      n = this.g,
      r = this.b,
      s = e.elements;
    return (
      (this.r = s[0] * t + s[3] * n + s[6] * r),
      (this.g = s[1] * t + s[4] * n + s[7] * r),
      (this.b = s[2] * t + s[5] * n + s[8] * r),
      this
    );
  }
  equals(e) {
    return e.r === this.r && e.g === this.g && e.b === this.b;
  }
  fromArray(e, t = 0) {
    return ((this.r = e[t]), (this.g = e[t + 1]), (this.b = e[t + 2]), this);
  }
  toArray(e = [], t = 0) {
    return ((e[t] = this.r), (e[t + 1] = this.g), (e[t + 2] = this.b), e);
  }
  fromBufferAttribute(e, t) {
    return (
      (this.r = e.getX(t)),
      (this.g = e.getY(t)),
      (this.b = e.getZ(t)),
      this
    );
  }
  toJSON() {
    return this.getHex();
  }
  *[Symbol.iterator]() {
    (yield this.r, yield this.g, yield this.b);
  }
}

const dn = new Ne();

Ne.NAMES = Mm;

class Ed {
  constructor(e, t = 1, n = 1e3) {
    ((this.isFog = !0),
      (this.name = ""),
      (this.color = new Ne(e)),
      (this.near = t),
      (this.far = n));
  }
  clone() {
    return new Ed(this.color, this.near, this.far);
  }
  toJSON() {
    return {
      type: "Fog",
      name: this.name,
      color: this.color.getHex(),
      near: this.near,
      far: this.far,
    };
  }
}

class el extends It {
  constructor() {
    (super(),
      (this.isScene = !0),
      (this.type = "Scene"),
      (this.background = null),
      (this.environment = null),
      (this.fog = null),
      (this.backgroundBlurriness = 0),
      (this.backgroundIntensity = 1),
      (this.backgroundRotation = new yr()),
      (this.environmentIntensity = 1),
      (this.environmentRotation = new yr()),
      (this.overrideMaterial = null),
      typeof __THREE_DEVTOOLS__ < "u" &&
        __THREE_DEVTOOLS__.dispatchEvent(
          new CustomEvent("observe", { detail: this }),
        ));
  }
  copy(e, t) {
    return (
      super.copy(e, t),
      e.background !== null && (this.background = e.background.clone()),
      e.environment !== null && (this.environment = e.environment.clone()),
      e.fog !== null && (this.fog = e.fog.clone()),
      (this.backgroundBlurriness = e.backgroundBlurriness),
      (this.backgroundIntensity = e.backgroundIntensity),
      this.backgroundRotation.copy(e.backgroundRotation),
      (this.environmentIntensity = e.environmentIntensity),
      this.environmentRotation.copy(e.environmentRotation),
      e.overrideMaterial !== null &&
        (this.overrideMaterial = e.overrideMaterial.clone()),
      (this.matrixAutoUpdate = e.matrixAutoUpdate),
      this
    );
  }
  toJSON(e) {
    const t = super.toJSON(e);
    return (
      this.fog !== null && (t.object.fog = this.fog.toJSON()),
      this.backgroundBlurriness > 0 &&
        (t.object.backgroundBlurriness = this.backgroundBlurriness),
      this.backgroundIntensity !== 1 &&
        (t.object.backgroundIntensity = this.backgroundIntensity),
      (t.object.backgroundRotation = this.backgroundRotation.toArray()),
      this.environmentIntensity !== 1 &&
        (t.object.environmentIntensity = this.environmentIntensity),
      (t.object.environmentRotation = this.environmentRotation.toArray()),
      t
    );
  }
}

const Wn = new F();

const Mr = new F();

const kl = new F();

const Br = new F();

const ns = new F();

const rs = new F();

const Cu = new F();

const Tl = new F();

const Rl = new F();

const Pl = new F();

const Il = new Pt();

const Ll = new Pt();

const Fl = new Pt();

class Bn {
  constructor(e = new F(), t = new F(), n = new F()) {
    ((this.a = e), (this.b = t), (this.c = n));
  }
  static getNormal(e, t, n, r) {
    (r.subVectors(n, t), Wn.subVectors(e, t), r.cross(Wn));
    const s = r.lengthSq();
    return s > 0 ? r.multiplyScalar(1 / Math.sqrt(s)) : r.set(0, 0, 0);
  }
  static getBarycoord(e, t, n, r, s) {
    (Wn.subVectors(r, t), Mr.subVectors(n, t), kl.subVectors(e, t));
    const a = Wn.dot(Wn),
      o = Wn.dot(Mr),
      A = Wn.dot(kl),
      l = Mr.dot(Mr),
      c = Mr.dot(kl),
      h = a * l - o * o;
    if (h === 0) return (s.set(0, 0, 0), null);
    const d = 1 / h,
      u = (l * A - o * c) * d,
      p = (a * c - o * A) * d;
    return s.set(1 - u - p, p, u);
  }
  static containsPoint(e, t, n, r) {
    return this.getBarycoord(e, t, n, r, Br) === null
      ? !1
      : Br.x >= 0 && Br.y >= 0 && Br.x + Br.y <= 1;
  }
  static getInterpolation(e, t, n, r, s, a, o, A) {
    return this.getBarycoord(e, t, n, r, Br) === null
      ? ((A.x = 0),
        (A.y = 0),
        "z" in A && (A.z = 0),
        "w" in A && (A.w = 0),
        null)
      : (A.setScalar(0),
        A.addScaledVector(s, Br.x),
        A.addScaledVector(a, Br.y),
        A.addScaledVector(o, Br.z),
        A);
  }
  static getInterpolatedAttribute(e, t, n, r, s, a) {
    return (
      Il.setScalar(0),
      Ll.setScalar(0),
      Fl.setScalar(0),
      Il.fromBufferAttribute(e, t),
      Ll.fromBufferAttribute(e, n),
      Fl.fromBufferAttribute(e, r),
      a.setScalar(0),
      a.addScaledVector(Il, s.x),
      a.addScaledVector(Ll, s.y),
      a.addScaledVector(Fl, s.z),
      a
    );
  }
  static isFrontFacing(e, t, n, r) {
    return (Wn.subVectors(n, t), Mr.subVectors(e, t), Wn.cross(Mr).dot(r) < 0);
  }
  set(e, t, n) {
    return (this.a.copy(e), this.b.copy(t), this.c.copy(n), this);
  }
  setFromPointsAndIndices(e, t, n, r) {
    return (this.a.copy(e[t]), this.b.copy(e[n]), this.c.copy(e[r]), this);
  }
  setFromAttributeAndIndices(e, t, n, r) {
    return (
      this.a.fromBufferAttribute(e, t),
      this.b.fromBufferAttribute(e, n),
      this.c.fromBufferAttribute(e, r),
      this
    );
  }
  clone() {
    return new this.constructor().copy(this);
  }
  copy(e) {
    return (this.a.copy(e.a), this.b.copy(e.b), this.c.copy(e.c), this);
  }
  getArea() {
    return (
      Wn.subVectors(this.c, this.b),
      Mr.subVectors(this.a, this.b),
      Wn.cross(Mr).length() * 0.5
    );
  }
  getMidpoint(e) {
    return e
      .addVectors(this.a, this.b)
      .add(this.c)
      .multiplyScalar(1 / 3);
  }
  getNormal(e) {
    return Bn.getNormal(this.a, this.b, this.c, e);
  }
  getPlane(e) {
    return e.setFromCoplanarPoints(this.a, this.b, this.c);
  }
  getBarycoord(e, t) {
    return Bn.getBarycoord(e, this.a, this.b, this.c, t);
  }
  getInterpolation(e, t, n, r, s) {
    return Bn.getInterpolation(e, this.a, this.b, this.c, t, n, r, s);
  }
  containsPoint(e) {
    return Bn.containsPoint(e, this.a, this.b, this.c);
  }
  isFrontFacing(e) {
    return Bn.isFrontFacing(this.a, this.b, this.c, e);
  }
  intersectsBox(e) {
    return e.intersectsTriangle(this);
  }
  closestPointToPoint(e, t) {
    const n = this.a,
      r = this.b,
      s = this.c;
    let a, o;
    (ns.subVectors(r, n), rs.subVectors(s, n), Tl.subVectors(e, n));
    const A = ns.dot(Tl),
      l = rs.dot(Tl);
    if (A <= 0 && l <= 0) return t.copy(n);
    Rl.subVectors(e, r);
    const c = ns.dot(Rl),
      h = rs.dot(Rl);
    if (c >= 0 && h <= c) return t.copy(r);
    const d = A * h - c * l;
    if (d <= 0 && A >= 0 && c <= 0)
      return ((a = A / (A - c)), t.copy(n).addScaledVector(ns, a));
    Pl.subVectors(e, s);
    const u = ns.dot(Pl),
      p = rs.dot(Pl);
    if (p >= 0 && u <= p) return t.copy(s);
    const v = u * l - A * p;
    if (v <= 0 && l >= 0 && p <= 0)
      return ((o = l / (l - p)), t.copy(n).addScaledVector(rs, o));
    const g = c * p - u * h;
    if (g <= 0 && h - c >= 0 && u - p >= 0)
      return (
        Cu.subVectors(s, r),
        (o = (h - c) / (h - c + (u - p))),
        t.copy(r).addScaledVector(Cu, o)
      );
    const m = 1 / (g + v + d);
    return (
      (a = v * m),
      (o = d * m),
      t.copy(n).addScaledVector(ns, a).addScaledVector(rs, o)
    );
  }
  equals(e) {
    return e.a.equals(this.a) && e.b.equals(this.b) && e.c.equals(this.c);
  }
}

class xr {
  constructor(
    e = new F(1 / 0, 1 / 0, 1 / 0),
    t = new F(-1 / 0, -1 / 0, -1 / 0),
  ) {
    ((this.isBox3 = !0), (this.min = e), (this.max = t));
  }
  set(e, t) {
    return (this.min.copy(e), this.max.copy(t), this);
  }
  setFromArray(e) {
    this.makeEmpty();
    for (let t = 0, n = e.length; t < n; t += 3)
      this.expandByPoint(Xn.fromArray(e, t));
    return this;
  }
  setFromBufferAttribute(e) {
    this.makeEmpty();
    for (let t = 0, n = e.count; t < n; t++)
      this.expandByPoint(Xn.fromBufferAttribute(e, t));
    return this;
  }
  setFromPoints(e) {
    this.makeEmpty();
    for (let t = 0, n = e.length; t < n; t++) this.expandByPoint(e[t]);
    return this;
  }
  setFromCenterAndSize(e, t) {
    const n = Xn.copy(t).multiplyScalar(0.5);
    return (this.min.copy(e).sub(n), this.max.copy(e).add(n), this);
  }
  setFromObject(e, t = !1) {
    return (this.makeEmpty(), this.expandByObject(e, t));
  }
  clone() {
    return new this.constructor().copy(this);
  }
  copy(e) {
    return (this.min.copy(e.min), this.max.copy(e.max), this);
  }
  makeEmpty() {
    return (
      (this.min.x = this.min.y = this.min.z = 1 / 0),
      (this.max.x = this.max.y = this.max.z = -1 / 0),
      this
    );
  }
  isEmpty() {
    return (
      this.max.x < this.min.x ||
      this.max.y < this.min.y ||
      this.max.z < this.min.z
    );
  }
  getCenter(e) {
    return this.isEmpty()
      ? e.set(0, 0, 0)
      : e.addVectors(this.min, this.max).multiplyScalar(0.5);
  }
  getSize(e) {
    return this.isEmpty() ? e.set(0, 0, 0) : e.subVectors(this.max, this.min);
  }
  expandByPoint(e) {
    return (this.min.min(e), this.max.max(e), this);
  }
  expandByVector(e) {
    return (this.min.sub(e), this.max.add(e), this);
  }
  expandByScalar(e) {
    return (this.min.addScalar(-e), this.max.addScalar(e), this);
  }
  expandByObject(e, t = !1) {
    e.updateWorldMatrix(!1, !1);
    const n = e.geometry;
    if (n !== void 0) {
      const s = n.getAttribute("position");
      if (t === !0 && s !== void 0 && e.isInstancedMesh !== !0)
        for (let a = 0, o = s.count; a < o; a++)
          (e.isMesh === !0
            ? e.getVertexPosition(a, Xn)
            : Xn.fromBufferAttribute(s, a),
            Xn.applyMatrix4(e.matrixWorld),
            this.expandByPoint(Xn));
      else
        (e.boundingBox !== void 0
          ? (e.boundingBox === null && e.computeBoundingBox(),
            go.copy(e.boundingBox))
          : (n.boundingBox === null && n.computeBoundingBox(),
            go.copy(n.boundingBox)),
          go.applyMatrix4(e.matrixWorld),
          this.union(go));
    }
    const r = e.children;
    for (let s = 0, a = r.length; s < a; s++) this.expandByObject(r[s], t);
    return this;
  }
  containsPoint(e) {
    return (
      e.x >= this.min.x &&
      e.x <= this.max.x &&
      e.y >= this.min.y &&
      e.y <= this.max.y &&
      e.z >= this.min.z &&
      e.z <= this.max.z
    );
  }
  containsBox(e) {
    return (
      this.min.x <= e.min.x &&
      e.max.x <= this.max.x &&
      this.min.y <= e.min.y &&
      e.max.y <= this.max.y &&
      this.min.z <= e.min.z &&
      e.max.z <= this.max.z
    );
  }
  getParameter(e, t) {
    return t.set(
      (e.x - this.min.x) / (this.max.x - this.min.x),
      (e.y - this.min.y) / (this.max.y - this.min.y),
      (e.z - this.min.z) / (this.max.z - this.min.z),
    );
  }
  intersectsBox(e) {
    return (
      e.max.x >= this.min.x &&
      e.min.x <= this.max.x &&
      e.max.y >= this.min.y &&
      e.min.y <= this.max.y &&
      e.max.z >= this.min.z &&
      e.min.z <= this.max.z
    );
  }
  intersectsSphere(e) {
    return (
      this.clampPoint(e.center, Xn),
      Xn.distanceToSquared(e.center) <= e.radius * e.radius
    );
  }
  intersectsPlane(e) {
    let t, n;
    return (
      e.normal.x > 0
        ? ((t = e.normal.x * this.min.x), (n = e.normal.x * this.max.x))
        : ((t = e.normal.x * this.max.x), (n = e.normal.x * this.min.x)),
      e.normal.y > 0
        ? ((t += e.normal.y * this.min.y), (n += e.normal.y * this.max.y))
        : ((t += e.normal.y * this.max.y), (n += e.normal.y * this.min.y)),
      e.normal.z > 0
        ? ((t += e.normal.z * this.min.z), (n += e.normal.z * this.max.z))
        : ((t += e.normal.z * this.max.z), (n += e.normal.z * this.min.z)),
      t <= -e.constant && n >= -e.constant
    );
  }
  intersectsTriangle(e) {
    if (this.isEmpty()) return !1;
    (this.getCenter(ea),
      vo.subVectors(this.max, ea),
      is.subVectors(e.a, ea),
      ss.subVectors(e.b, ea),
      as.subVectors(e.c, ea),
      Wr.subVectors(ss, is),
      Xr.subVectors(as, ss),
      mi.subVectors(is, as));
    let t = [
      0,
      -Wr.z,
      Wr.y,
      0,
      -Xr.z,
      Xr.y,
      0,
      -mi.z,
      mi.y,
      Wr.z,
      0,
      -Wr.x,
      Xr.z,
      0,
      -Xr.x,
      mi.z,
      0,
      -mi.x,
      -Wr.y,
      Wr.x,
      0,
      -Xr.y,
      Xr.x,
      0,
      -mi.y,
      mi.x,
      0,
    ];
    return !Dl(t, is, ss, as, vo) ||
      ((t = [1, 0, 0, 0, 1, 0, 0, 0, 1]), !Dl(t, is, ss, as, vo))
      ? !1
      : (jo.crossVectors(Wr, Xr),
        (t = [jo.x, jo.y, jo.z]),
        Dl(t, is, ss, as, vo));
  }
  clampPoint(e, t) {
    return t.copy(e).clamp(this.min, this.max);
  }
  distanceToPoint(e) {
    return this.clampPoint(e, Xn).distanceTo(e);
  }
  getBoundingSphere(e) {
    return (
      this.isEmpty()
        ? e.makeEmpty()
        : (this.getCenter(e.center),
          (e.radius = this.getSize(Xn).length() * 0.5)),
      e
    );
  }
  intersect(e) {
    return (
      this.min.max(e.min),
      this.max.min(e.max),
      this.isEmpty() && this.makeEmpty(),
      this
    );
  }
  union(e) {
    return (this.min.min(e.min), this.max.max(e.max), this);
  }
  applyMatrix4(e) {
    return this.isEmpty()
      ? this
      : (kr[0].set(this.min.x, this.min.y, this.min.z).applyMatrix4(e),
        kr[1].set(this.min.x, this.min.y, this.max.z).applyMatrix4(e),
        kr[2].set(this.min.x, this.max.y, this.min.z).applyMatrix4(e),
        kr[3].set(this.min.x, this.max.y, this.max.z).applyMatrix4(e),
        kr[4].set(this.max.x, this.min.y, this.min.z).applyMatrix4(e),
        kr[5].set(this.max.x, this.min.y, this.max.z).applyMatrix4(e),
        kr[6].set(this.max.x, this.max.y, this.min.z).applyMatrix4(e),
        kr[7].set(this.max.x, this.max.y, this.max.z).applyMatrix4(e),
        this.setFromPoints(kr),
        this);
  }
  translate(e) {
    return (this.min.add(e), this.max.add(e), this);
  }
  equals(e) {
    return e.min.equals(this.min) && e.max.equals(this.max);
  }
  toJSON() {
    return { min: this.min.toArray(), max: this.max.toArray() };
  }
  fromJSON(e) {
    return (this.min.fromArray(e.min), this.max.fromArray(e.max), this);
  }
}

const kr = [
    new F(),
    new F(),
    new F(),
    new F(),
    new F(),
    new F(),
    new F(),
    new F(),
  ];

const Xn = new F();

const go = new xr();

const is = new F();

const ss = new F();

const as = new F();

const Wr = new F();

const Xr = new F();

const mi = new F();

const ea = new F();

const vo = new F();

const jo = new F();

const gi = new F();

function Dl(i, e, t, n, r) {
  for (let s = 0, a = i.length - 3; s <= a; s += 3) {
    gi.fromArray(i, s);
    const o =
        r.x * Math.abs(gi.x) + r.y * Math.abs(gi.y) + r.z * Math.abs(gi.z),
      A = e.dot(gi),
      l = t.dot(gi),
      c = n.dot(gi);
    if (Math.max(-Math.max(A, l, c), Math.min(A, l, c)) > o) return !1;
  }
  return !0;
}

const Kt = new F();

const _o = new Ae();

let Gv = 0;

class zt extends Wi {
  constructor(e, t, n = !1) {
    if ((super(), Array.isArray(e)))
      throw new TypeError(
        "THREE.BufferAttribute: array should be a Typed Array.",
      );
    ((this.isBufferAttribute = !0),
      Object.defineProperty(this, "id", { value: Gv++ }),
      (this.name = ""),
      (this.array = e),
      (this.itemSize = t),
      (this.count = e !== void 0 ? e.length / t : 0),
      (this.normalized = n),
      (this.usage = Sh),
      (this.updateRanges = []),
      (this.gpuType = On),
      (this.version = 0));
  }
  onUploadCallback() {}
  set needsUpdate(e) {
    e === !0 && this.version++;
  }
  setUsage(e) {
    return ((this.usage = e), this);
  }
  addUpdateRange(e, t) {
    this.updateRanges.push({ start: e, count: t });
  }
  clearUpdateRanges() {
    this.updateRanges.length = 0;
  }
  copy(e) {
    return (
      (this.name = e.name),
      (this.array = new e.array.constructor(e.array)),
      (this.itemSize = e.itemSize),
      (this.count = e.count),
      (this.normalized = e.normalized),
      (this.usage = e.usage),
      (this.gpuType = e.gpuType),
      this
    );
  }
  copyAt(e, t, n) {
    ((e *= this.itemSize), (n *= t.itemSize));
    for (let r = 0, s = this.itemSize; r < s; r++)
      this.array[e + r] = t.array[n + r];
    return this;
  }
  copyArray(e) {
    return (this.array.set(e), this);
  }
  applyMatrix3(e) {
    if (this.itemSize === 2)
      for (let t = 0, n = this.count; t < n; t++)
        (_o.fromBufferAttribute(this, t),
          _o.applyMatrix3(e),
          this.setXY(t, _o.x, _o.y));
    else if (this.itemSize === 3)
      for (let t = 0, n = this.count; t < n; t++)
        (Kt.fromBufferAttribute(this, t),
          Kt.applyMatrix3(e),
          this.setXYZ(t, Kt.x, Kt.y, Kt.z));
    return this;
  }
  applyMatrix4(e) {
    for (let t = 0, n = this.count; t < n; t++)
      (Kt.fromBufferAttribute(this, t),
        Kt.applyMatrix4(e),
        this.setXYZ(t, Kt.x, Kt.y, Kt.z));
    return this;
  }
  applyNormalMatrix(e) {
    for (let t = 0, n = this.count; t < n; t++)
      (Kt.fromBufferAttribute(this, t),
        Kt.applyNormalMatrix(e),
        this.setXYZ(t, Kt.x, Kt.y, Kt.z));
    return this;
  }
  transformDirection(e) {
    for (let t = 0, n = this.count; t < n; t++)
      (Kt.fromBufferAttribute(this, t),
        Kt.transformDirection(e),
        this.setXYZ(t, Kt.x, Kt.y, Kt.z));
    return this;
  }
  set(e, t = 0) {
    return (this.array.set(e, t), this);
  }
  getComponent(e, t) {
    let n = this.array[e * this.itemSize + t];
    return (this.normalized && (n = Qn(n, this.array)), n);
  }
  setComponent(e, t, n) {
    return (
      this.normalized && (n = Tt(n, this.array)),
      (this.array[e * this.itemSize + t] = n),
      this
    );
  }
  getX(e) {
    let t = this.array[e * this.itemSize];
    return (this.normalized && (t = Qn(t, this.array)), t);
  }
  setX(e, t) {
    return (
      this.normalized && (t = Tt(t, this.array)),
      (this.array[e * this.itemSize] = t),
      this
    );
  }
  getY(e) {
    let t = this.array[e * this.itemSize + 1];
    return (this.normalized && (t = Qn(t, this.array)), t);
  }
  setY(e, t) {
    return (
      this.normalized && (t = Tt(t, this.array)),
      (this.array[e * this.itemSize + 1] = t),
      this
    );
  }
  getZ(e) {
    let t = this.array[e * this.itemSize + 2];
    return (this.normalized && (t = Qn(t, this.array)), t);
  }
  setZ(e, t) {
    return (
      this.normalized && (t = Tt(t, this.array)),
      (this.array[e * this.itemSize + 2] = t),
      this
    );
  }
  getW(e) {
    let t = this.array[e * this.itemSize + 3];
    return (this.normalized && (t = Qn(t, this.array)), t);
  }
  setW(e, t) {
    return (
      this.normalized && (t = Tt(t, this.array)),
      (this.array[e * this.itemSize + 3] = t),
      this
    );
  }
  setXY(e, t, n) {
    return (
      (e *= this.itemSize),
      this.normalized && ((t = Tt(t, this.array)), (n = Tt(n, this.array))),
      (this.array[e + 0] = t),
      (this.array[e + 1] = n),
      this
    );
  }
  setXYZ(e, t, n, r) {
    return (
      (e *= this.itemSize),
      this.normalized &&
        ((t = Tt(t, this.array)),
        (n = Tt(n, this.array)),
        (r = Tt(r, this.array))),
      (this.array[e + 0] = t),
      (this.array[e + 1] = n),
      (this.array[e + 2] = r),
      this
    );
  }
  setXYZW(e, t, n, r, s) {
    return (
      (e *= this.itemSize),
      this.normalized &&
        ((t = Tt(t, this.array)),
        (n = Tt(n, this.array)),
        (r = Tt(r, this.array)),
        (s = Tt(s, this.array))),
      (this.array[e + 0] = t),
      (this.array[e + 1] = n),
      (this.array[e + 2] = r),
      (this.array[e + 3] = s),
      this
    );
  }
  onUpload(e) {
    return ((this.onUploadCallback = e), this);
  }
  clone() {
    return new this.constructor(this.array, this.itemSize).copy(this);
  }
  toJSON() {
    const e = {
      itemSize: this.itemSize,
      type: this.array.constructor.name,
      array: Array.from(this.array),
      normalized: this.normalized,
    };
    return (
      this.name !== "" && (e.name = this.name),
      this.usage !== Sh && (e.usage = this.usage),
      e
    );
  }
  dispose() {
    this.dispatchEvent({ type: "dispose" });
  }
}

class Bm extends zt {
  constructor(e, t, n) {
    super(new Uint16Array(e), t, n);
  }
}

class km extends zt {
  constructor(e, t, n) {
    super(new Uint32Array(e), t, n);
  }
}

class Ke extends zt {
  constructor(e, t, n) {
    super(new Float32Array(e), t, n);
  }
}

const Ov = new xr();

const ta = new F();

const Nl = new F();

class Cr {
  constructor(e = new F(), t = -1) {
    ((this.isSphere = !0), (this.center = e), (this.radius = t));
  }
  set(e, t) {
    return (this.center.copy(e), (this.radius = t), this);
  }
  setFromPoints(e, t) {
    const n = this.center;
    t !== void 0 ? n.copy(t) : Ov.setFromPoints(e).getCenter(n);
    let r = 0;
    for (let s = 0, a = e.length; s < a; s++)
      r = Math.max(r, n.distanceToSquared(e[s]));
    return ((this.radius = Math.sqrt(r)), this);
  }
  copy(e) {
    return (this.center.copy(e.center), (this.radius = e.radius), this);
  }
  isEmpty() {
    return this.radius < 0;
  }
  makeEmpty() {
    return (this.center.set(0, 0, 0), (this.radius = -1), this);
  }
  containsPoint(e) {
    return e.distanceToSquared(this.center) <= this.radius * this.radius;
  }
  distanceToPoint(e) {
    return e.distanceTo(this.center) - this.radius;
  }
  intersectsSphere(e) {
    const t = this.radius + e.radius;
    return e.center.distanceToSquared(this.center) <= t * t;
  }
  intersectsBox(e) {
    return e.intersectsSphere(this);
  }
  intersectsPlane(e) {
    return Math.abs(e.distanceToPoint(this.center)) <= this.radius;
  }
  clampPoint(e, t) {
    const n = this.center.distanceToSquared(e);
    return (
      t.copy(e),
      n > this.radius * this.radius &&
        (t.sub(this.center).normalize(),
        t.multiplyScalar(this.radius).add(this.center)),
      t
    );
  }
  getBoundingBox(e) {
    return this.isEmpty()
      ? (e.makeEmpty(), e)
      : (e.set(this.center, this.center), e.expandByScalar(this.radius), e);
  }
  applyMatrix4(e) {
    return (
      this.center.applyMatrix4(e),
      (this.radius = this.radius * e.getMaxScaleOnAxis()),
      this
    );
  }
  translate(e) {
    return (this.center.add(e), this);
  }
  expandByPoint(e) {
    if (this.isEmpty()) return (this.center.copy(e), (this.radius = 0), this);
    ta.subVectors(e, this.center);
    const t = ta.lengthSq();
    if (t > this.radius * this.radius) {
      const n = Math.sqrt(t),
        r = (n - this.radius) * 0.5;
      (this.center.addScaledVector(ta, r / n), (this.radius += r));
    }
    return this;
  }
  union(e) {
    return e.isEmpty()
      ? this
      : this.isEmpty()
        ? (this.copy(e), this)
        : (this.center.equals(e.center) === !0
            ? (this.radius = Math.max(this.radius, e.radius))
            : (Nl.subVectors(e.center, this.center).setLength(e.radius),
              this.expandByPoint(ta.copy(e.center).add(Nl)),
              this.expandByPoint(ta.copy(e.center).sub(Nl))),
          this);
  }
  equals(e) {
    return e.center.equals(this.center) && e.radius === this.radius;
  }
  clone() {
    return new this.constructor().copy(this);
  }
  toJSON() {
    return { radius: this.radius, center: this.center.toArray() };
  }
  fromJSON(e) {
    return ((this.radius = e.radius), this.center.fromArray(e.center), this);
  }
}

let Hv = 0;

const Ln = new mt();

const Gl = new It();

const os = new F();

const wn = new xr();

const na = new xr();

const sn = new F();

class Ct extends Wi {
  constructor() {
    (super(),
      (this.isBufferGeometry = !0),
      Object.defineProperty(this, "id", { value: Hv++ }),
      (this.uuid = Un()),
      (this.name = ""),
      (this.type = "BufferGeometry"),
      (this.index = null),
      (this.indirect = null),
      (this.indirectOffset = 0),
      (this.attributes = {}),
      (this.morphAttributes = {}),
      (this.morphTargetsRelative = !1),
      (this.groups = []),
      (this.boundingBox = null),
      (this.boundingSphere = null),
      (this.drawRange = { start: 0, count: 1 / 0 }),
      (this.userData = {}),
      (this._transformed = !1));
  }
  getIndex() {
    return this.index;
  }
  setIndex(e) {
    return (
      Array.isArray(e)
        ? (this.index = new (sv(e) ? km : Bm)(e, 1))
        : (this.index = e),
      this
    );
  }
  setIndirect(e, t = 0) {
    return ((this.indirect = e), (this.indirectOffset = t), this);
  }
  getIndirect() {
    return this.indirect;
  }
  getAttribute(e) {
    return this.attributes[e];
  }
  setAttribute(e, t) {
    return ((this.attributes[e] = t), this);
  }
  deleteAttribute(e) {
    return (delete this.attributes[e], this);
  }
  hasAttribute(e) {
    return this.attributes[e] !== void 0;
  }
  addGroup(e, t, n = 0) {
    this.groups.push({ start: e, count: t, materialIndex: n });
  }
  clearGroups() {
    this.groups = [];
  }
  setDrawRange(e, t) {
    ((this.drawRange.start = e), (this.drawRange.count = t));
  }
  applyMatrix4(e) {
    const t = this.attributes.position;
    t !== void 0 && (t.applyMatrix4(e), (t.needsUpdate = !0));
    const n = this.attributes.normal;
    if (n !== void 0) {
      const s = new jt().getNormalMatrix(e);
      (n.applyNormalMatrix(s), (n.needsUpdate = !0));
    }
    const r = this.attributes.tangent;
    return (
      r !== void 0 && (r.transformDirection(e), (r.needsUpdate = !0)),
      this.boundingBox !== null && this.computeBoundingBox(),
      this.boundingSphere !== null && this.computeBoundingSphere(),
      (this._transformed = !0),
      this
    );
  }
  applyQuaternion(e) {
    return (Ln.makeRotationFromQuaternion(e), this.applyMatrix4(Ln), this);
  }
  rotateX(e) {
    return (Ln.makeRotationX(e), this.applyMatrix4(Ln), this);
  }
  rotateY(e) {
    return (Ln.makeRotationY(e), this.applyMatrix4(Ln), this);
  }
  rotateZ(e) {
    return (Ln.makeRotationZ(e), this.applyMatrix4(Ln), this);
  }
  translate(e, t, n) {
    return (Ln.makeTranslation(e, t, n), this.applyMatrix4(Ln), this);
  }
  scale(e, t, n) {
    return (Ln.makeScale(e, t, n), this.applyMatrix4(Ln), this);
  }
  lookAt(e) {
    return (
      Gl.lookAt(e),
      Gl.updateMatrix(),
      this.applyMatrix4(Gl.matrix),
      this
    );
  }
  center() {
    return (
      this.computeBoundingBox(),
      this.boundingBox.getCenter(os).negate(),
      this.translate(os.x, os.y, os.z),
      this
    );
  }
  setFromPoints(e) {
    const t = this.getAttribute("position");
    if (t === void 0) {
      const n = [];
      for (let r = 0, s = e.length; r < s; r++) {
        const a = e[r];
        n.push(a.x, a.y, a.z || 0);
      }
      this.setAttribute("position", new Ke(n, 3));
    } else {
      const n = Math.min(e.length, t.count);
      for (let r = 0; r < n; r++) {
        const s = e[r];
        t.setXYZ(r, s.x, s.y, s.z || 0);
      }
      (e.length > t.count &&
        it(
          "BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry.",
        ),
        (t.needsUpdate = !0));
    }
    return this;
  }
  computeBoundingBox() {
    this.boundingBox === null && (this.boundingBox = new xr());
    const e = this.attributes.position,
      t = this.morphAttributes.position;
    if (e && e.isGLBufferAttribute) {
      (ut(
        "BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",
        this,
      ),
        this.boundingBox.set(
          new F(-1 / 0, -1 / 0, -1 / 0),
          new F(1 / 0, 1 / 0, 1 / 0),
        ));
      return;
    }
    if (e !== void 0) {
      if ((this.boundingBox.setFromBufferAttribute(e), t))
        for (let n = 0, r = t.length; n < r; n++) {
          const s = t[n];
          (wn.setFromBufferAttribute(s),
            this.morphTargetsRelative
              ? (sn.addVectors(this.boundingBox.min, wn.min),
                this.boundingBox.expandByPoint(sn),
                sn.addVectors(this.boundingBox.max, wn.max),
                this.boundingBox.expandByPoint(sn))
              : (this.boundingBox.expandByPoint(wn.min),
                this.boundingBox.expandByPoint(wn.max)));
        }
    } else this.boundingBox.makeEmpty();
    (isNaN(this.boundingBox.min.x) ||
      isNaN(this.boundingBox.min.y) ||
      isNaN(this.boundingBox.min.z)) &&
      ut(
        'BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',
        this,
      );
  }
  computeBoundingSphere() {
    this.boundingSphere === null && (this.boundingSphere = new Cr());
    const e = this.attributes.position,
      t = this.morphAttributes.position;
    if (e && e.isGLBufferAttribute) {
      (ut(
        "BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",
        this,
      ),
        this.boundingSphere.set(new F(), 1 / 0));
      return;
    }
    if (e) {
      const n = this.boundingSphere.center;
      if ((wn.setFromBufferAttribute(e), t))
        for (let s = 0, a = t.length; s < a; s++) {
          const o = t[s];
          (na.setFromBufferAttribute(o),
            this.morphTargetsRelative
              ? (sn.addVectors(wn.min, na.min),
                wn.expandByPoint(sn),
                sn.addVectors(wn.max, na.max),
                wn.expandByPoint(sn))
              : (wn.expandByPoint(na.min), wn.expandByPoint(na.max)));
        }
      wn.getCenter(n);
      let r = 0;
      for (let s = 0, a = e.count; s < a; s++)
        (sn.fromBufferAttribute(e, s),
          (r = Math.max(r, n.distanceToSquared(sn))));
      if (t)
        for (let s = 0, a = t.length; s < a; s++) {
          const o = t[s],
            A = this.morphTargetsRelative;
          for (let l = 0, c = o.count; l < c; l++)
            (sn.fromBufferAttribute(o, l),
              A && (os.fromBufferAttribute(e, l), sn.add(os)),
              (r = Math.max(r, n.distanceToSquared(sn))));
        }
      ((this.boundingSphere.radius = Math.sqrt(r)),
        isNaN(this.boundingSphere.radius) &&
          ut(
            'BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',
            this,
          ));
    }
  }
  computeTangents() {
    const e = this.index,
      t = this.attributes;
    if (
      e === null ||
      t.position === void 0 ||
      t.normal === void 0 ||
      t.uv === void 0
    ) {
      ut(
        "BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)",
      );
      return;
    }
    const n = t.position,
      r = t.normal,
      s = t.uv;
    let a = this.getAttribute("tangent");
    (a === void 0 || a.count !== n.count) &&
      ((a = new zt(new Float32Array(4 * n.count), 4)),
      this.setAttribute("tangent", a));
    const o = [],
      A = [];
    for (let x = 0; x < n.count; x++) ((o[x] = new F()), (A[x] = new F()));
    const l = new F(),
      c = new F(),
      h = new F(),
      d = new Ae(),
      u = new Ae(),
      p = new Ae(),
      v = new F(),
      g = new F();
    function m(x, T, R) {
      (l.fromBufferAttribute(n, x),
        c.fromBufferAttribute(n, T),
        h.fromBufferAttribute(n, R),
        d.fromBufferAttribute(s, x),
        u.fromBufferAttribute(s, T),
        p.fromBufferAttribute(s, R),
        c.sub(l),
        h.sub(l),
        u.sub(d),
        p.sub(d));
      const D = 1 / (u.x * p.y - p.x * u.y);
      isFinite(D) &&
        (v
          .copy(c)
          .multiplyScalar(p.y)
          .addScaledVector(h, -u.y)
          .multiplyScalar(D),
        g
          .copy(h)
          .multiplyScalar(u.x)
          .addScaledVector(c, -p.x)
          .multiplyScalar(D),
        o[x].add(v),
        o[T].add(v),
        o[R].add(v),
        A[x].add(g),
        A[T].add(g),
        A[R].add(g));
    }
    let y = this.groups;
    y.length === 0 && (y = [{ start: 0, count: e.count }]);
    for (let x = 0, T = y.length; x < T; ++x) {
      const R = y[x],
        D = R.start,
        N = R.count;
      for (let X = D, Y = D + N; X < Y; X += 3)
        m(e.getX(X + 0), e.getX(X + 1), e.getX(X + 2));
    }
    const C = new F(),
      E = new F(),
      w = new F(),
      S = new F();
    function k(x) {
      (w.fromBufferAttribute(r, x), S.copy(w));
      const T = o[x];
      (C.copy(T),
        C.sub(w.multiplyScalar(w.dot(T))).normalize(),
        E.crossVectors(S, T));
      const D = E.dot(A[x]) < 0 ? -1 : 1;
      a.setXYZW(x, C.x, C.y, C.z, D);
    }
    for (let x = 0, T = y.length; x < T; ++x) {
      const R = y[x],
        D = R.start,
        N = R.count;
      for (let X = D, Y = D + N; X < Y; X += 3)
        (k(e.getX(X + 0)), k(e.getX(X + 1)), k(e.getX(X + 2)));
    }
    this._transformed = !0;
  }
  computeVertexNormals() {
    const e = this.index,
      t = this.getAttribute("position");
    if (t !== void 0) {
      let n = this.getAttribute("normal");
      if (n === void 0 || n.count !== t.count)
        ((n = new zt(new Float32Array(t.count * 3), 3)),
          this.setAttribute("normal", n));
      else for (let d = 0, u = n.count; d < u; d++) n.setXYZ(d, 0, 0, 0);
      const r = new F(),
        s = new F(),
        a = new F(),
        o = new F(),
        A = new F(),
        l = new F(),
        c = new F(),
        h = new F();
      if (e)
        for (let d = 0, u = e.count; d < u; d += 3) {
          const p = e.getX(d + 0),
            v = e.getX(d + 1),
            g = e.getX(d + 2);
          (r.fromBufferAttribute(t, p),
            s.fromBufferAttribute(t, v),
            a.fromBufferAttribute(t, g),
            c.subVectors(a, s),
            h.subVectors(r, s),
            c.cross(h),
            o.fromBufferAttribute(n, p),
            A.fromBufferAttribute(n, v),
            l.fromBufferAttribute(n, g),
            o.add(c),
            A.add(c),
            l.add(c),
            n.setXYZ(p, o.x, o.y, o.z),
            n.setXYZ(v, A.x, A.y, A.z),
            n.setXYZ(g, l.x, l.y, l.z));
        }
      else
        for (let d = 0, u = t.count; d < u; d += 3)
          (r.fromBufferAttribute(t, d + 0),
            s.fromBufferAttribute(t, d + 1),
            a.fromBufferAttribute(t, d + 2),
            c.subVectors(a, s),
            h.subVectors(r, s),
            c.cross(h),
            n.setXYZ(d + 0, c.x, c.y, c.z),
            n.setXYZ(d + 1, c.x, c.y, c.z),
            n.setXYZ(d + 2, c.x, c.y, c.z));
      (this.normalizeNormals(), (n.needsUpdate = !0));
    }
  }
  normalizeNormals() {
    const e = this.attributes.normal;
    for (let t = 0, n = e.count; t < n; t++)
      (sn.fromBufferAttribute(e, t),
        sn.normalize(),
        e.setXYZ(t, sn.x, sn.y, sn.z));
  }
  toNonIndexed() {
    function e(o, A) {
      const l = o.array,
        c = o.itemSize,
        h = o.normalized,
        d = new l.constructor(A.length * c);
      let u = 0,
        p = 0;
      for (let v = 0, g = A.length; v < g; v++) {
        o.isInterleavedBufferAttribute
          ? (u = A[v] * o.data.stride + o.offset)
          : (u = A[v] * c);
        for (let m = 0; m < c; m++) d[p++] = l[u++];
      }
      return new zt(d, c, h);
    }
    if (this.index === null)
      return (
        it(
          "BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed.",
        ),
        this
      );
    const t = new Ct(),
      n = this.index.array,
      r = this.attributes;
    for (const o in r) {
      const A = r[o],
        l = e(A, n);
      t.setAttribute(o, l);
    }
    const s = this.morphAttributes;
    for (const o in s) {
      const A = [],
        l = s[o];
      for (let c = 0, h = l.length; c < h; c++) {
        const d = l[c],
          u = e(d, n);
        A.push(u);
      }
      t.morphAttributes[o] = A;
    }
    t.morphTargetsRelative = this.morphTargetsRelative;
    const a = this.groups;
    for (let o = 0, A = a.length; o < A; o++) {
      const l = a[o];
      t.addGroup(l.start, l.count, l.materialIndex);
    }
    return t;
  }
  toJSON() {
    const e = {
      metadata: {
        version: 4.7,
        type: "BufferGeometry",
        generator: "BufferGeometry.toJSON",
      },
    };
    if (
      ((e.uuid = this.uuid),
      (e.type =
        this.parameters !== void 0 && this._transformed === !0
          ? "BufferGeometry"
          : this.type),
      this.name !== "" && (e.name = this.name),
      Object.keys(this.userData).length > 0 && (e.userData = this.userData),
      this.parameters !== void 0 && this._transformed !== !0)
    ) {
      const A = this.parameters;
      for (const l in A) A[l] !== void 0 && (e[l] = A[l]);
      return e;
    }
    e.data = { attributes: {} };
    const t = this.index;
    t !== null &&
      (e.data.index = {
        type: t.array.constructor.name,
        array: Array.prototype.slice.call(t.array),
      });
    const n = this.attributes;
    for (const A in n) {
      const l = n[A];
      e.data.attributes[A] = l.toJSON(e.data);
    }
    const r = {};
    let s = !1;
    for (const A in this.morphAttributes) {
      const l = this.morphAttributes[A],
        c = [];
      for (let h = 0, d = l.length; h < d; h++) {
        const u = l[h];
        c.push(u.toJSON(e.data));
      }
      c.length > 0 && ((r[A] = c), (s = !0));
    }
    s &&
      ((e.data.morphAttributes = r),
      (e.data.morphTargetsRelative = this.morphTargetsRelative));
    const a = this.groups;
    a.length > 0 && (e.data.groups = JSON.parse(JSON.stringify(a)));
    const o = this.boundingSphere;
    return (o !== null && (e.data.boundingSphere = o.toJSON()), e);
  }
  clone() {
    return new this.constructor().copy(this);
  }
  copy(e) {
    ((this.index = null),
      (this.attributes = {}),
      (this.morphAttributes = {}),
      (this.groups = []),
      (this.boundingBox = null),
      (this.boundingSphere = null));
    const t = {};
    this.name = e.name;
    const n = e.index;
    n !== null && this.setIndex(n.clone());
    const r = e.attributes;
    for (const l in r) {
      const c = r[l];
      this.setAttribute(l, c.clone(t));
    }
    const s = e.morphAttributes;
    for (const l in s) {
      const c = [],
        h = s[l];
      for (let d = 0, u = h.length; d < u; d++) c.push(h[d].clone(t));
      this.morphAttributes[l] = c;
    }
    this.morphTargetsRelative = e.morphTargetsRelative;
    const a = e.groups;
    for (let l = 0, c = a.length; l < c; l++) {
      const h = a[l];
      this.addGroup(h.start, h.count, h.materialIndex);
    }
    const o = e.boundingBox;
    o !== null && (this.boundingBox = o.clone());
    const A = e.boundingSphere;
    return (
      A !== null && (this.boundingSphere = A.clone()),
      (this.drawRange.start = e.drawRange.start),
      (this.drawRange.count = e.drawRange.count),
      (this.userData = e.userData),
      (this._transformed = e._transformed),
      this
    );
  }
  dispose() {
    this.dispatchEvent({ type: "dispose" });
  }
}

class Tm {
  constructor(e, t) {
    ((this.isInterleavedBuffer = !0),
      (this.array = e),
      (this.stride = t),
      (this.count = e !== void 0 ? e.length / t : 0),
      (this.usage = Sh),
      (this.updateRanges = []),
      (this.version = 0),
      (this.uuid = Un()));
  }
  onUploadCallback() {}
  set needsUpdate(e) {
    e === !0 && this.version++;
  }
  setUsage(e) {
    return ((this.usage = e), this);
  }
  addUpdateRange(e, t) {
    this.updateRanges.push({ start: e, count: t });
  }
  clearUpdateRanges() {
    this.updateRanges.length = 0;
  }
  copy(e) {
    return (
      (this.array = new e.array.constructor(e.array)),
      (this.count = e.count),
      (this.stride = e.stride),
      (this.usage = e.usage),
      this
    );
  }
  copyAt(e, t, n) {
    ((e *= this.stride), (n *= t.stride));
    for (let r = 0, s = this.stride; r < s; r++)
      this.array[e + r] = t.array[n + r];
    return this;
  }
  set(e, t = 0) {
    return (this.array.set(e, t), this);
  }
  clone(e) {
    (e.arrayBuffers === void 0 && (e.arrayBuffers = {}),
      this.array.buffer._uuid === void 0 && (this.array.buffer._uuid = Un()),
      e.arrayBuffers[this.array.buffer._uuid] === void 0 &&
        (e.arrayBuffers[this.array.buffer._uuid] = this.array.slice(0).buffer));
    const t = new this.array.constructor(
        e.arrayBuffers[this.array.buffer._uuid],
      ),
      n = new this.constructor(t, this.stride);
    return (n.setUsage(this.usage), n);
  }
  onUpload(e) {
    return ((this.onUploadCallback = e), this);
  }
  toJSON(e) {
    return (
      e.arrayBuffers === void 0 && (e.arrayBuffers = {}),
      this.array.buffer._uuid === void 0 && (this.array.buffer._uuid = Un()),
      e.arrayBuffers[this.array.buffer._uuid] === void 0 &&
        (e.arrayBuffers[this.array.buffer._uuid] = Array.from(
          new Uint32Array(this.array.buffer),
        )),
      {
        uuid: this.uuid,
        buffer: this.array.buffer._uuid,
        type: this.array.constructor.name,
        stride: this.stride,
      }
    );
  }
}

const mn = new F();

class Va {
  constructor(e, t, n, r = !1) {
    ((this.isInterleavedBufferAttribute = !0),
      (this.name = ""),
      (this.data = e),
      (this.itemSize = t),
      (this.offset = n),
      (this.normalized = r));
  }
  get count() {
    return this.data.count;
  }
  get array() {
    return this.data.array;
  }
  set needsUpdate(e) {
    this.data.needsUpdate = e;
  }
  applyMatrix4(e) {
    for (let t = 0, n = this.data.count; t < n; t++)
      (mn.fromBufferAttribute(this, t),
        mn.applyMatrix4(e),
        this.setXYZ(t, mn.x, mn.y, mn.z));
    return this;
  }
  applyNormalMatrix(e) {
    for (let t = 0, n = this.count; t < n; t++)
      (mn.fromBufferAttribute(this, t),
        mn.applyNormalMatrix(e),
        this.setXYZ(t, mn.x, mn.y, mn.z));
    return this;
  }
  transformDirection(e) {
    for (let t = 0, n = this.count; t < n; t++)
      (mn.fromBufferAttribute(this, t),
        mn.transformDirection(e),
        this.setXYZ(t, mn.x, mn.y, mn.z));
    return this;
  }
  getComponent(e, t) {
    let n = this.array[e * this.data.stride + this.offset + t];
    return (this.normalized && (n = Qn(n, this.array)), n);
  }
  setComponent(e, t, n) {
    return (
      this.normalized && (n = Tt(n, this.array)),
      (this.data.array[e * this.data.stride + this.offset + t] = n),
      this
    );
  }
  setX(e, t) {
    return (
      this.normalized && (t = Tt(t, this.array)),
      (this.data.array[e * this.data.stride + this.offset] = t),
      this
    );
  }
  setY(e, t) {
    return (
      this.normalized && (t = Tt(t, this.array)),
      (this.data.array[e * this.data.stride + this.offset + 1] = t),
      this
    );
  }
  setZ(e, t) {
    return (
      this.normalized && (t = Tt(t, this.array)),
      (this.data.array[e * this.data.stride + this.offset + 2] = t),
      this
    );
  }
  setW(e, t) {
    return (
      this.normalized && (t = Tt(t, this.array)),
      (this.data.array[e * this.data.stride + this.offset + 3] = t),
      this
    );
  }
  getX(e) {
    let t = this.data.array[e * this.data.stride + this.offset];
    return (this.normalized && (t = Qn(t, this.array)), t);
  }
  getY(e) {
    let t = this.data.array[e * this.data.stride + this.offset + 1];
    return (this.normalized && (t = Qn(t, this.array)), t);
  }
  getZ(e) {
    let t = this.data.array[e * this.data.stride + this.offset + 2];
    return (this.normalized && (t = Qn(t, this.array)), t);
  }
  getW(e) {
    let t = this.data.array[e * this.data.stride + this.offset + 3];
    return (this.normalized && (t = Qn(t, this.array)), t);
  }
  setXY(e, t, n) {
    return (
      (e = e * this.data.stride + this.offset),
      this.normalized && ((t = Tt(t, this.array)), (n = Tt(n, this.array))),
      (this.data.array[e + 0] = t),
      (this.data.array[e + 1] = n),
      this
    );
  }
  setXYZ(e, t, n, r) {
    return (
      (e = e * this.data.stride + this.offset),
      this.normalized &&
        ((t = Tt(t, this.array)),
        (n = Tt(n, this.array)),
        (r = Tt(r, this.array))),
      (this.data.array[e + 0] = t),
      (this.data.array[e + 1] = n),
      (this.data.array[e + 2] = r),
      this
    );
  }
  setXYZW(e, t, n, r, s) {
    return (
      (e = e * this.data.stride + this.offset),
      this.normalized &&
        ((t = Tt(t, this.array)),
        (n = Tt(n, this.array)),
        (r = Tt(r, this.array)),
        (s = Tt(s, this.array))),
      (this.data.array[e + 0] = t),
      (this.data.array[e + 1] = n),
      (this.data.array[e + 2] = r),
      (this.data.array[e + 3] = s),
      this
    );
  }
  clone(e) {
    if (e === void 0) {
      PA(
        "InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.",
      );
      const t = [];
      for (let n = 0; n < this.count; n++) {
        const r = n * this.data.stride + this.offset;
        for (let s = 0; s < this.itemSize; s++) t.push(this.data.array[r + s]);
      }
      return new zt(
        new this.array.constructor(t),
        this.itemSize,
        this.normalized,
      );
    } else
      return (
        e.interleavedBuffers === void 0 && (e.interleavedBuffers = {}),
        e.interleavedBuffers[this.data.uuid] === void 0 &&
          (e.interleavedBuffers[this.data.uuid] = this.data.clone(e)),
        new Va(
          e.interleavedBuffers[this.data.uuid],
          this.itemSize,
          this.offset,
          this.normalized,
        )
      );
  }
  toJSON(e) {
    if (e === void 0) {
      PA(
        "InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.",
      );
      const t = [];
      for (let n = 0; n < this.count; n++) {
        const r = n * this.data.stride + this.offset;
        for (let s = 0; s < this.itemSize; s++) t.push(this.data.array[r + s]);
      }
      return {
        itemSize: this.itemSize,
        type: this.array.constructor.name,
        array: t,
        normalized: this.normalized,
      };
    } else
      return (
        e.interleavedBuffers === void 0 && (e.interleavedBuffers = {}),
        e.interleavedBuffers[this.data.uuid] === void 0 &&
          (e.interleavedBuffers[this.data.uuid] = this.data.toJSON(e)),
        {
          isInterleavedBufferAttribute: !0,
          itemSize: this.itemSize,
          data: this.data.uuid,
          offset: this.offset,
          normalized: this.normalized,
        }
      );
  }
}

let Uv = 0;

class Qt extends Wi {
  constructor() {
    (super(),
      (this.isMaterial = !0),
      Object.defineProperty(this, "id", { value: Uv++ }),
      (this.uuid = Un()),
      (this.name = ""),
      (this.type = "Material"),
      (this.blending = Gr),
      (this.side = $n),
      (this.vertexColors = !1),
      (this.opacity = 1),
      (this.transparent = !1),
      (this.alphaHash = !1),
      (this.blendSrc = Oc),
      (this.blendDst = Hc),
      (this.blendEquation = Bi),
      (this.blendSrcAlpha = null),
      (this.blendDstAlpha = null),
      (this.blendEquationAlpha = null),
      (this.blendColor = new Ne(0, 0, 0)),
      (this.blendAlpha = 0),
      (this.depthFunc = Ls),
      (this.depthTest = !0),
      (this.depthWrite = !0),
      (this.stencilWriteMask = 255),
      (this.stencilFunc = cu),
      (this.stencilRef = 0),
      (this.stencilFuncMask = 255),
      (this.stencilFail = Yi),
      (this.stencilZFail = Yi),
      (this.stencilZPass = Yi),
      (this.stencilWrite = !1),
      (this.clippingPlanes = null),
      (this.clipIntersection = !1),
      (this.clipShadows = !1),
      (this.shadowSide = null),
      (this.colorWrite = !0),
      (this.precision = null),
      (this.polygonOffset = !1),
      (this.polygonOffsetFactor = 0),
      (this.polygonOffsetUnits = 0),
      (this.dithering = !1),
      (this.alphaToCoverage = !1),
      (this.premultipliedAlpha = !1),
      (this.forceSinglePass = !1),
      (this.allowOverride = !0),
      (this.visible = !0),
      (this.toneMapped = !0),
      (this.userData = {}),
      (this.version = 0),
      (this._alphaTest = 0));
  }
  get alphaTest() {
    return this._alphaTest;
  }
  set alphaTest(e) {
    (this._alphaTest > 0 != e > 0 && this.version++, (this._alphaTest = e));
  }
  onBeforeRender() {}
  onBeforeCompile() {}
  customProgramCacheKey() {
    return this.onBeforeCompile.toString();
  }
  setValues(e) {
    if (e !== void 0)
      for (const t in e) {
        const n = e[t];
        if (n === void 0) {
          it(`Material: parameter '${t}' has value of undefined.`);
          continue;
        }
        const r = this[t];
        if (r === void 0) {
          it(`Material: '${t}' is not a property of THREE.${this.type}.`);
          continue;
        }
        r && r.isColor
          ? r.set(n)
          : (r && r.isVector2 && n && n.isVector2) ||
              (r && r.isEuler && n && n.isEuler) ||
              (r && r.isVector3 && n && n.isVector3)
            ? r.copy(n)
            : (this[t] = n);
      }
  }
  toJSON(e) {
    const t = e === void 0 || typeof e == "string";
    t && (e = { textures: {}, images: {} });
    const n = {
      metadata: {
        version: 4.7,
        type: "Material",
        generator: "Material.toJSON",
      },
    };
    ((n.uuid = this.uuid),
      (n.type = this.type),
      this.name !== "" && (n.name = this.name),
      this.color && this.color.isColor && (n.color = this.color.getHex()),
      this.roughness !== void 0 && (n.roughness = this.roughness),
      this.metalness !== void 0 && (n.metalness = this.metalness),
      this.sheen !== void 0 && (n.sheen = this.sheen),
      this.sheenColor &&
        this.sheenColor.isColor &&
        (n.sheenColor = this.sheenColor.getHex()),
      this.sheenRoughness !== void 0 &&
        (n.sheenRoughness = this.sheenRoughness),
      this.emissive &&
        this.emissive.isColor &&
        (n.emissive = this.emissive.getHex()),
      this.emissiveIntensity !== void 0 &&
        this.emissiveIntensity !== 1 &&
        (n.emissiveIntensity = this.emissiveIntensity),
      this.specular &&
        this.specular.isColor &&
        (n.specular = this.specular.getHex()),
      this.specularIntensity !== void 0 &&
        (n.specularIntensity = this.specularIntensity),
      this.specularColor &&
        this.specularColor.isColor &&
        (n.specularColor = this.specularColor.getHex()),
      this.shininess !== void 0 && (n.shininess = this.shininess),
      this.clearcoat !== void 0 && (n.clearcoat = this.clearcoat),
      this.clearcoatRoughness !== void 0 &&
        (n.clearcoatRoughness = this.clearcoatRoughness),
      this.clearcoatMap &&
        this.clearcoatMap.isTexture &&
        (n.clearcoatMap = this.clearcoatMap.toJSON(e).uuid),
      this.clearcoatRoughnessMap &&
        this.clearcoatRoughnessMap.isTexture &&
        (n.clearcoatRoughnessMap = this.clearcoatRoughnessMap.toJSON(e).uuid),
      this.clearcoatNormalMap &&
        this.clearcoatNormalMap.isTexture &&
        ((n.clearcoatNormalMap = this.clearcoatNormalMap.toJSON(e).uuid),
        (n.clearcoatNormalScale = this.clearcoatNormalScale.toArray())),
      this.sheenColorMap &&
        this.sheenColorMap.isTexture &&
        (n.sheenColorMap = this.sheenColorMap.toJSON(e).uuid),
      this.sheenRoughnessMap &&
        this.sheenRoughnessMap.isTexture &&
        (n.sheenRoughnessMap = this.sheenRoughnessMap.toJSON(e).uuid),
      this.dispersion !== void 0 && (n.dispersion = this.dispersion),
      this.iridescence !== void 0 && (n.iridescence = this.iridescence),
      this.iridescenceIOR !== void 0 &&
        (n.iridescenceIOR = this.iridescenceIOR),
      this.iridescenceThicknessRange !== void 0 &&
        (n.iridescenceThicknessRange = this.iridescenceThicknessRange),
      this.iridescenceMap &&
        this.iridescenceMap.isTexture &&
        (n.iridescenceMap = this.iridescenceMap.toJSON(e).uuid),
      this.iridescenceThicknessMap &&
        this.iridescenceThicknessMap.isTexture &&
        (n.iridescenceThicknessMap =
          this.iridescenceThicknessMap.toJSON(e).uuid),
      this.anisotropy !== void 0 && (n.anisotropy = this.anisotropy),
      this.anisotropyRotation !== void 0 &&
        (n.anisotropyRotation = this.anisotropyRotation),
      this.anisotropyMap &&
        this.anisotropyMap.isTexture &&
        (n.anisotropyMap = this.anisotropyMap.toJSON(e).uuid),
      this.map && this.map.isTexture && (n.map = this.map.toJSON(e).uuid),
      this.matcap &&
        this.matcap.isTexture &&
        (n.matcap = this.matcap.toJSON(e).uuid),
      this.alphaMap &&
        this.alphaMap.isTexture &&
        (n.alphaMap = this.alphaMap.toJSON(e).uuid),
      this.lightMap &&
        this.lightMap.isTexture &&
        ((n.lightMap = this.lightMap.toJSON(e).uuid),
        (n.lightMapIntensity = this.lightMapIntensity)),
      this.aoMap &&
        this.aoMap.isTexture &&
        ((n.aoMap = this.aoMap.toJSON(e).uuid),
        (n.aoMapIntensity = this.aoMapIntensity)),
      this.bumpMap &&
        this.bumpMap.isTexture &&
        ((n.bumpMap = this.bumpMap.toJSON(e).uuid),
        (n.bumpScale = this.bumpScale)),
      this.normalMap &&
        this.normalMap.isTexture &&
        ((n.normalMap = this.normalMap.toJSON(e).uuid),
        (n.normalMapType = this.normalMapType),
        (n.normalScale = this.normalScale.toArray())),
      this.displacementMap &&
        this.displacementMap.isTexture &&
        ((n.displacementMap = this.displacementMap.toJSON(e).uuid),
        (n.displacementScale = this.displacementScale),
        (n.displacementBias = this.displacementBias)),
      this.roughnessMap &&
        this.roughnessMap.isTexture &&
        (n.roughnessMap = this.roughnessMap.toJSON(e).uuid),
      this.metalnessMap &&
        this.metalnessMap.isTexture &&
        (n.metalnessMap = this.metalnessMap.toJSON(e).uuid),
      this.emissiveMap &&
        this.emissiveMap.isTexture &&
        (n.emissiveMap = this.emissiveMap.toJSON(e).uuid),
      this.specularMap &&
        this.specularMap.isTexture &&
        (n.specularMap = this.specularMap.toJSON(e).uuid),
      this.specularIntensityMap &&
        this.specularIntensityMap.isTexture &&
        (n.specularIntensityMap = this.specularIntensityMap.toJSON(e).uuid),
      this.specularColorMap &&
        this.specularColorMap.isTexture &&
        (n.specularColorMap = this.specularColorMap.toJSON(e).uuid),
      this.envMap &&
        this.envMap.isTexture &&
        ((n.envMap = this.envMap.toJSON(e).uuid),
        this.combine !== void 0 && (n.combine = this.combine)),
      this.envMapRotation !== void 0 &&
        (n.envMapRotation = this.envMapRotation.toArray()),
      this.envMapIntensity !== void 0 &&
        (n.envMapIntensity = this.envMapIntensity),
      this.reflectivity !== void 0 && (n.reflectivity = this.reflectivity),
      this.refractionRatio !== void 0 &&
        (n.refractionRatio = this.refractionRatio),
      this.gradientMap &&
        this.gradientMap.isTexture &&
        (n.gradientMap = this.gradientMap.toJSON(e).uuid),
      this.transmission !== void 0 && (n.transmission = this.transmission),
      this.transmissionMap &&
        this.transmissionMap.isTexture &&
        (n.transmissionMap = this.transmissionMap.toJSON(e).uuid),
      this.thickness !== void 0 && (n.thickness = this.thickness),
      this.thicknessMap &&
        this.thicknessMap.isTexture &&
        (n.thicknessMap = this.thicknessMap.toJSON(e).uuid),
      this.attenuationDistance !== void 0 &&
        this.attenuationDistance !== 1 / 0 &&
        (n.attenuationDistance = this.attenuationDistance),
      this.attenuationColor !== void 0 &&
        (n.attenuationColor = this.attenuationColor.getHex()),
      this.size !== void 0 && (n.size = this.size),
      this.shadowSide !== null && (n.shadowSide = this.shadowSide),
      this.sizeAttenuation !== void 0 &&
        (n.sizeAttenuation = this.sizeAttenuation),
      this.blending !== Gr && (n.blending = this.blending),
      this.side !== $n && (n.side = this.side),
      this.vertexColors === !0 && (n.vertexColors = !0),
      this.opacity < 1 && (n.opacity = this.opacity),
      this.transparent === !0 && (n.transparent = !0),
      this.blendSrc !== Oc && (n.blendSrc = this.blendSrc),
      this.blendDst !== Hc && (n.blendDst = this.blendDst),
      this.blendEquation !== Bi && (n.blendEquation = this.blendEquation),
      this.blendSrcAlpha !== null && (n.blendSrcAlpha = this.blendSrcAlpha),
      this.blendDstAlpha !== null && (n.blendDstAlpha = this.blendDstAlpha),
      this.blendEquationAlpha !== null &&
        (n.blendEquationAlpha = this.blendEquationAlpha),
      this.blendColor &&
        this.blendColor.isColor &&
        (n.blendColor = this.blendColor.getHex()),
      this.blendAlpha !== 0 && (n.blendAlpha = this.blendAlpha),
      this.depthFunc !== Ls && (n.depthFunc = this.depthFunc),
      this.depthTest === !1 && (n.depthTest = this.depthTest),
      this.depthWrite === !1 && (n.depthWrite = this.depthWrite),
      this.colorWrite === !1 && (n.colorWrite = this.colorWrite),
      this.stencilWriteMask !== 255 &&
        (n.stencilWriteMask = this.stencilWriteMask),
      this.stencilFunc !== cu && (n.stencilFunc = this.stencilFunc),
      this.stencilRef !== 0 && (n.stencilRef = this.stencilRef),
      this.stencilFuncMask !== 255 &&
        (n.stencilFuncMask = this.stencilFuncMask),
      this.stencilFail !== Yi && (n.stencilFail = this.stencilFail),
      this.stencilZFail !== Yi && (n.stencilZFail = this.stencilZFail),
      this.stencilZPass !== Yi && (n.stencilZPass = this.stencilZPass),
      this.stencilWrite === !0 && (n.stencilWrite = this.stencilWrite),
      this.rotation !== void 0 &&
        this.rotation !== 0 &&
        (n.rotation = this.rotation),
      this.polygonOffset === !0 && (n.polygonOffset = !0),
      this.polygonOffsetFactor !== 0 &&
        (n.polygonOffsetFactor = this.polygonOffsetFactor),
      this.polygonOffsetUnits !== 0 &&
        (n.polygonOffsetUnits = this.polygonOffsetUnits),
      this.linewidth !== void 0 &&
        this.linewidth !== 1 &&
        (n.linewidth = this.linewidth),
      this.dashSize !== void 0 && (n.dashSize = this.dashSize),
      this.gapSize !== void 0 && (n.gapSize = this.gapSize),
      this.scale !== void 0 && (n.scale = this.scale),
      this.dithering === !0 && (n.dithering = !0),
      this.alphaTest > 0 && (n.alphaTest = this.alphaTest),
      this.alphaHash === !0 && (n.alphaHash = !0),
      this.alphaToCoverage === !0 && (n.alphaToCoverage = !0),
      this.premultipliedAlpha === !0 && (n.premultipliedAlpha = !0),
      this.forceSinglePass === !0 && (n.forceSinglePass = !0),
      this.allowOverride === !1 && (n.allowOverride = !1),
      this.wireframe === !0 && (n.wireframe = !0),
      this.wireframeLinewidth > 1 &&
        (n.wireframeLinewidth = this.wireframeLinewidth),
      this.wireframeLinecap !== "round" &&
        (n.wireframeLinecap = this.wireframeLinecap),
      this.wireframeLinejoin !== "round" &&
        (n.wireframeLinejoin = this.wireframeLinejoin),
      this.flatShading === !0 && (n.flatShading = !0),
      this.visible === !1 && (n.visible = !1),
      this.toneMapped === !1 && (n.toneMapped = !1),
      this.fog === !1 && (n.fog = !1),
      Object.keys(this.userData).length > 0 && (n.userData = this.userData));
    function r(s) {
      const a = [];
      for (const o in s) {
        const A = s[o];
        (delete A.metadata, a.push(A));
      }
      return a;
    }
    if (t) {
      const s = r(e.textures),
        a = r(e.images);
      (s.length > 0 && (n.textures = s), a.length > 0 && (n.images = a));
    }
    return n;
  }
  fromJSON(e, t) {
    if (
      (e.uuid !== void 0 && (this.uuid = e.uuid),
      e.name !== void 0 && (this.name = e.name),
      e.color !== void 0 && this.color !== void 0 && this.color.setHex(e.color),
      e.roughness !== void 0 && (this.roughness = e.roughness),
      e.metalness !== void 0 && (this.metalness = e.metalness),
      e.sheen !== void 0 && (this.sheen = e.sheen),
      e.sheenColor !== void 0 &&
        (this.sheenColor = new Ne().setHex(e.sheenColor)),
      e.sheenRoughness !== void 0 && (this.sheenRoughness = e.sheenRoughness),
      e.emissive !== void 0 &&
        this.emissive !== void 0 &&
        this.emissive.setHex(e.emissive),
      e.specular !== void 0 &&
        this.specular !== void 0 &&
        this.specular.setHex(e.specular),
      e.specularIntensity !== void 0 &&
        (this.specularIntensity = e.specularIntensity),
      e.specularColor !== void 0 &&
        this.specularColor !== void 0 &&
        this.specularColor.setHex(e.specularColor),
      e.shininess !== void 0 && (this.shininess = e.shininess),
      e.clearcoat !== void 0 && (this.clearcoat = e.clearcoat),
      e.clearcoatRoughness !== void 0 &&
        (this.clearcoatRoughness = e.clearcoatRoughness),
      e.dispersion !== void 0 && (this.dispersion = e.dispersion),
      e.iridescence !== void 0 && (this.iridescence = e.iridescence),
      e.iridescenceIOR !== void 0 && (this.iridescenceIOR = e.iridescenceIOR),
      e.iridescenceThicknessRange !== void 0 &&
        (this.iridescenceThicknessRange = e.iridescenceThicknessRange),
      e.transmission !== void 0 && (this.transmission = e.transmission),
      e.thickness !== void 0 && (this.thickness = e.thickness),
      e.attenuationDistance !== void 0 &&
        (this.attenuationDistance = e.attenuationDistance),
      e.attenuationColor !== void 0 &&
        this.attenuationColor !== void 0 &&
        this.attenuationColor.setHex(e.attenuationColor),
      e.anisotropy !== void 0 && (this.anisotropy = e.anisotropy),
      e.anisotropyRotation !== void 0 &&
        (this.anisotropyRotation = e.anisotropyRotation),
      e.fog !== void 0 && (this.fog = e.fog),
      e.flatShading !== void 0 && (this.flatShading = e.flatShading),
      e.blending !== void 0 && (this.blending = e.blending),
      e.combine !== void 0 && (this.combine = e.combine),
      e.side !== void 0 && (this.side = e.side),
      e.shadowSide !== void 0 && (this.shadowSide = e.shadowSide),
      e.opacity !== void 0 && (this.opacity = e.opacity),
      e.transparent !== void 0 && (this.transparent = e.transparent),
      e.alphaTest !== void 0 && (this.alphaTest = e.alphaTest),
      e.alphaHash !== void 0 && (this.alphaHash = e.alphaHash),
      e.depthFunc !== void 0 && (this.depthFunc = e.depthFunc),
      e.depthTest !== void 0 && (this.depthTest = e.depthTest),
      e.depthWrite !== void 0 && (this.depthWrite = e.depthWrite),
      e.colorWrite !== void 0 && (this.colorWrite = e.colorWrite),
      e.blendSrc !== void 0 && (this.blendSrc = e.blendSrc),
      e.blendDst !== void 0 && (this.blendDst = e.blendDst),
      e.blendEquation !== void 0 && (this.blendEquation = e.blendEquation),
      e.blendSrcAlpha !== void 0 && (this.blendSrcAlpha = e.blendSrcAlpha),
      e.blendDstAlpha !== void 0 && (this.blendDstAlpha = e.blendDstAlpha),
      e.blendEquationAlpha !== void 0 &&
        (this.blendEquationAlpha = e.blendEquationAlpha),
      e.blendColor !== void 0 &&
        this.blendColor !== void 0 &&
        this.blendColor.setHex(e.blendColor),
      e.blendAlpha !== void 0 && (this.blendAlpha = e.blendAlpha),
      e.stencilWriteMask !== void 0 &&
        (this.stencilWriteMask = e.stencilWriteMask),
      e.stencilFunc !== void 0 && (this.stencilFunc = e.stencilFunc),
      e.stencilRef !== void 0 && (this.stencilRef = e.stencilRef),
      e.stencilFuncMask !== void 0 &&
        (this.stencilFuncMask = e.stencilFuncMask),
      e.stencilFail !== void 0 && (this.stencilFail = e.stencilFail),
      e.stencilZFail !== void 0 && (this.stencilZFail = e.stencilZFail),
      e.stencilZPass !== void 0 && (this.stencilZPass = e.stencilZPass),
      e.stencilWrite !== void 0 && (this.stencilWrite = e.stencilWrite),
      e.wireframe !== void 0 && (this.wireframe = e.wireframe),
      e.wireframeLinewidth !== void 0 &&
        (this.wireframeLinewidth = e.wireframeLinewidth),
      e.wireframeLinecap !== void 0 &&
        (this.wireframeLinecap = e.wireframeLinecap),
      e.wireframeLinejoin !== void 0 &&
        (this.wireframeLinejoin = e.wireframeLinejoin),
      e.rotation !== void 0 && (this.rotation = e.rotation),
      e.linewidth !== void 0 && (this.linewidth = e.linewidth),
      e.dashSize !== void 0 && (this.dashSize = e.dashSize),
      e.gapSize !== void 0 && (this.gapSize = e.gapSize),
      e.scale !== void 0 && (this.scale = e.scale),
      e.polygonOffset !== void 0 && (this.polygonOffset = e.polygonOffset),
      e.polygonOffsetFactor !== void 0 &&
        (this.polygonOffsetFactor = e.polygonOffsetFactor),
      e.polygonOffsetUnits !== void 0 &&
        (this.polygonOffsetUnits = e.polygonOffsetUnits),
      e.dithering !== void 0 && (this.dithering = e.dithering),
      e.alphaToCoverage !== void 0 &&
        (this.alphaToCoverage = e.alphaToCoverage),
      e.premultipliedAlpha !== void 0 &&
        (this.premultipliedAlpha = e.premultipliedAlpha),
      e.forceSinglePass !== void 0 &&
        (this.forceSinglePass = e.forceSinglePass),
      e.allowOverride !== void 0 && (this.allowOverride = e.allowOverride),
      e.visible !== void 0 && (this.visible = e.visible),
      e.toneMapped !== void 0 && (this.toneMapped = e.toneMapped),
      e.userData !== void 0 && (this.userData = e.userData),
      e.vertexColors !== void 0 &&
        (typeof e.vertexColors == "number"
          ? (this.vertexColors = e.vertexColors > 0)
          : (this.vertexColors = e.vertexColors)),
      e.size !== void 0 && (this.size = e.size),
      e.sizeAttenuation !== void 0 &&
        (this.sizeAttenuation = e.sizeAttenuation),
      e.map !== void 0 && (this.map = t[e.map] || null),
      e.matcap !== void 0 && (this.matcap = t[e.matcap] || null),
      e.alphaMap !== void 0 && (this.alphaMap = t[e.alphaMap] || null),
      e.bumpMap !== void 0 && (this.bumpMap = t[e.bumpMap] || null),
      e.bumpScale !== void 0 && (this.bumpScale = e.bumpScale),
      e.normalMap !== void 0 && (this.normalMap = t[e.normalMap] || null),
      e.normalMapType !== void 0 && (this.normalMapType = e.normalMapType),
      e.normalScale !== void 0)
    ) {
      let n = e.normalScale;
      (Array.isArray(n) === !1 && (n = [n, n]),
        (this.normalScale = new Ae().fromArray(n)));
    }
    return (
      e.displacementMap !== void 0 &&
        (this.displacementMap = t[e.displacementMap] || null),
      e.displacementScale !== void 0 &&
        (this.displacementScale = e.displacementScale),
      e.displacementBias !== void 0 &&
        (this.displacementBias = e.displacementBias),
      e.roughnessMap !== void 0 &&
        (this.roughnessMap = t[e.roughnessMap] || null),
      e.metalnessMap !== void 0 &&
        (this.metalnessMap = t[e.metalnessMap] || null),
      e.emissiveMap !== void 0 && (this.emissiveMap = t[e.emissiveMap] || null),
      e.emissiveIntensity !== void 0 &&
        (this.emissiveIntensity = e.emissiveIntensity),
      e.specularMap !== void 0 && (this.specularMap = t[e.specularMap] || null),
      e.specularIntensityMap !== void 0 &&
        (this.specularIntensityMap = t[e.specularIntensityMap] || null),
      e.specularColorMap !== void 0 &&
        (this.specularColorMap = t[e.specularColorMap] || null),
      e.envMap !== void 0 && (this.envMap = t[e.envMap] || null),
      e.envMapRotation !== void 0 &&
        this.envMapRotation.fromArray(e.envMapRotation),
      e.envMapIntensity !== void 0 &&
        (this.envMapIntensity = e.envMapIntensity),
      e.reflectivity !== void 0 && (this.reflectivity = e.reflectivity),
      e.refractionRatio !== void 0 &&
        (this.refractionRatio = e.refractionRatio),
      e.lightMap !== void 0 && (this.lightMap = t[e.lightMap] || null),
      e.lightMapIntensity !== void 0 &&
        (this.lightMapIntensity = e.lightMapIntensity),
      e.aoMap !== void 0 && (this.aoMap = t[e.aoMap] || null),
      e.aoMapIntensity !== void 0 && (this.aoMapIntensity = e.aoMapIntensity),
      e.gradientMap !== void 0 && (this.gradientMap = t[e.gradientMap] || null),
      e.clearcoatMap !== void 0 &&
        (this.clearcoatMap = t[e.clearcoatMap] || null),
      e.clearcoatRoughnessMap !== void 0 &&
        (this.clearcoatRoughnessMap = t[e.clearcoatRoughnessMap] || null),
      e.clearcoatNormalMap !== void 0 &&
        (this.clearcoatNormalMap = t[e.clearcoatNormalMap] || null),
      e.clearcoatNormalScale !== void 0 &&
        (this.clearcoatNormalScale = new Ae().fromArray(
          e.clearcoatNormalScale,
        )),
      e.iridescenceMap !== void 0 &&
        (this.iridescenceMap = t[e.iridescenceMap] || null),
      e.iridescenceThicknessMap !== void 0 &&
        (this.iridescenceThicknessMap = t[e.iridescenceThicknessMap] || null),
      e.transmissionMap !== void 0 &&
        (this.transmissionMap = t[e.transmissionMap] || null),
      e.thicknessMap !== void 0 &&
        (this.thicknessMap = t[e.thicknessMap] || null),
      e.anisotropyMap !== void 0 &&
        (this.anisotropyMap = t[e.anisotropyMap] || null),
      e.sheenColorMap !== void 0 &&
        (this.sheenColorMap = t[e.sheenColorMap] || null),
      e.sheenRoughnessMap !== void 0 &&
        (this.sheenRoughnessMap = t[e.sheenRoughnessMap] || null),
      this
    );
  }
  clone() {
    return new this.constructor().copy(this);
  }
  copy(e) {
    ((this.name = e.name),
      (this.blending = e.blending),
      (this.side = e.side),
      (this.vertexColors = e.vertexColors),
      (this.opacity = e.opacity),
      (this.transparent = e.transparent),
      (this.blendSrc = e.blendSrc),
      (this.blendDst = e.blendDst),
      (this.blendEquation = e.blendEquation),
      (this.blendSrcAlpha = e.blendSrcAlpha),
      (this.blendDstAlpha = e.blendDstAlpha),
      (this.blendEquationAlpha = e.blendEquationAlpha),
      this.blendColor.copy(e.blendColor),
      (this.blendAlpha = e.blendAlpha),
      (this.depthFunc = e.depthFunc),
      (this.depthTest = e.depthTest),
      (this.depthWrite = e.depthWrite),
      (this.stencilWriteMask = e.stencilWriteMask),
      (this.stencilFunc = e.stencilFunc),
      (this.stencilRef = e.stencilRef),
      (this.stencilFuncMask = e.stencilFuncMask),
      (this.stencilFail = e.stencilFail),
      (this.stencilZFail = e.stencilZFail),
      (this.stencilZPass = e.stencilZPass),
      (this.stencilWrite = e.stencilWrite));
    const t = e.clippingPlanes;
    let n = null;
    if (t !== null) {
      const r = t.length;
      n = new Array(r);
      for (let s = 0; s !== r; ++s) n[s] = t[s].clone();
    }
    return (
      (this.clippingPlanes = n),
      (this.clipIntersection = e.clipIntersection),
      (this.clipShadows = e.clipShadows),
      (this.shadowSide = e.shadowSide),
      (this.colorWrite = e.colorWrite),
      (this.precision = e.precision),
      (this.polygonOffset = e.polygonOffset),
      (this.polygonOffsetFactor = e.polygonOffsetFactor),
      (this.polygonOffsetUnits = e.polygonOffsetUnits),
      (this.dithering = e.dithering),
      (this.alphaTest = e.alphaTest),
      (this.alphaHash = e.alphaHash),
      (this.alphaToCoverage = e.alphaToCoverage),
      (this.premultipliedAlpha = e.premultipliedAlpha),
      (this.forceSinglePass = e.forceSinglePass),
      (this.allowOverride = e.allowOverride),
      (this.visible = e.visible),
      (this.toneMapped = e.toneMapped),
      (this.userData = JSON.parse(JSON.stringify(e.userData))),
      this
    );
  }
  dispose() {
    this.dispatchEvent({ type: "dispose" });
  }
  set needsUpdate(e) {
    e === !0 && this.version++;
  }
}

class yd extends Qt {
  constructor(e) {
    (super(),
      (this.isSpriteMaterial = !0),
      (this.type = "SpriteMaterial"),
      (this.color = new Ne(16777215)),
      (this.map = null),
      (this.alphaMap = null),
      (this.rotation = 0),
      (this.sizeAttenuation = !0),
      (this.transparent = !0),
      (this.fog = !0),
      this.setValues(e));
  }
  copy(e) {
    return (
      super.copy(e),
      this.color.copy(e.color),
      (this.map = e.map),
      (this.alphaMap = e.alphaMap),
      (this.rotation = e.rotation),
      (this.sizeAttenuation = e.sizeAttenuation),
      (this.fog = e.fog),
      this
    );
  }
}

let As;

const ra = new F();

const ls = new F();

const cs = new F();

const hs = new Ae();

const ia = new Ae();

const Rm = new mt();

const Eo = new F();

const sa = new F();

const yo = new F();

const bu = new Ae();

const Ol = new Ae();

const Su = new Ae();

class Pm extends It {
  constructor(e = new yd()) {
    if (
      (super(), (this.isSprite = !0), (this.type = "Sprite"), As === void 0)
    ) {
      As = new Ct();
      const t = new Float32Array([
          -0.5, -0.5, 0, 0, 0, 0.5, -0.5, 0, 1, 0, 0.5, 0.5, 0, 1, 1, -0.5, 0.5,
          0, 0, 1,
        ]),
        n = new Tm(t, 5);
      (As.setIndex([0, 1, 2, 0, 2, 3]),
        As.setAttribute("position", new Va(n, 3, 0, !1)),
        As.setAttribute("uv", new Va(n, 2, 3, !1)));
    }
    ((this.geometry = As),
      (this.material = e),
      (this.center = new Ae(0.5, 0.5)),
      (this.count = 1));
  }
  raycast(e, t) {
    (e.camera === null &&
      ut(
        'Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.',
      ),
      ls.setFromMatrixScale(this.matrixWorld),
      Rm.copy(e.camera.matrixWorld),
      this.modelViewMatrix.multiplyMatrices(
        e.camera.matrixWorldInverse,
        this.matrixWorld,
      ),
      cs.setFromMatrixPosition(this.modelViewMatrix),
      e.camera.isPerspectiveCamera &&
        this.material.sizeAttenuation === !1 &&
        ls.multiplyScalar(-cs.z));
    const n = this.material.rotation;
    let r, s;
    n !== 0 && ((s = Math.cos(n)), (r = Math.sin(n)));
    const a = this.center;
    (xo(Eo.set(-0.5, -0.5, 0), cs, a, ls, r, s),
      xo(sa.set(0.5, -0.5, 0), cs, a, ls, r, s),
      xo(yo.set(0.5, 0.5, 0), cs, a, ls, r, s),
      bu.set(0, 0),
      Ol.set(1, 0),
      Su.set(1, 1));
    let o = e.ray.intersectTriangle(Eo, sa, yo, !1, ra);
    if (
      o === null &&
      (xo(sa.set(-0.5, 0.5, 0), cs, a, ls, r, s),
      Ol.set(0, 1),
      (o = e.ray.intersectTriangle(Eo, yo, sa, !1, ra)),
      o === null)
    )
      return;
    const A = e.ray.origin.distanceTo(ra);
    A < e.near ||
      A > e.far ||
      t.push({
        distance: A,
        point: ra.clone(),
        uv: Bn.getInterpolation(ra, Eo, sa, yo, bu, Ol, Su, new Ae()),
        face: null,
        object: this,
      });
  }
  copy(e, t) {
    return (
      super.copy(e, t),
      e.center !== void 0 && this.center.copy(e.center),
      (this.material = e.material),
      this
    );
  }
}

function xo(i, e, t, n, r, s) {
  (hs.subVectors(i, t).addScalar(0.5).multiply(n),
    r !== void 0
      ? ((ia.x = s * hs.x - r * hs.y), (ia.y = r * hs.x + s * hs.y))
      : ia.copy(hs),
    i.copy(e),
    (i.x += ia.x),
    (i.y += ia.y),
    i.applyMatrix4(Rm));
}

const Tr = new F();

const Hl = new F();

const Co = new F();

const Jr = new F();

const Ul = new F();

const bo = new F();

const ql = new F();

class tl {
  constructor(e = new F(), t = new F(0, 0, -1)) {
    ((this.origin = e), (this.direction = t));
  }
  set(e, t) {
    return (this.origin.copy(e), this.direction.copy(t), this);
  }
  copy(e) {
    return (this.origin.copy(e.origin), this.direction.copy(e.direction), this);
  }
  at(e, t) {
    return t.copy(this.origin).addScaledVector(this.direction, e);
  }
  lookAt(e) {
    return (this.direction.copy(e).sub(this.origin).normalize(), this);
  }
  recast(e) {
    return (this.origin.copy(this.at(e, Tr)), this);
  }
  closestPointToPoint(e, t) {
    t.subVectors(e, this.origin);
    const n = t.dot(this.direction);
    return n < 0
      ? t.copy(this.origin)
      : t.copy(this.origin).addScaledVector(this.direction, n);
  }
  distanceToPoint(e) {
    return Math.sqrt(this.distanceSqToPoint(e));
  }
  distanceSqToPoint(e) {
    const t = Tr.subVectors(e, this.origin).dot(this.direction);
    return t < 0
      ? this.origin.distanceToSquared(e)
      : (Tr.copy(this.origin).addScaledVector(this.direction, t),
        Tr.distanceToSquared(e));
  }
  distanceSqToSegment(e, t, n, r) {
    (Hl.copy(e).add(t).multiplyScalar(0.5),
      Co.copy(t).sub(e).normalize(),
      Jr.copy(this.origin).sub(Hl));
    const s = e.distanceTo(t) * 0.5,
      a = -this.direction.dot(Co),
      o = Jr.dot(this.direction),
      A = -Jr.dot(Co),
      l = Jr.lengthSq(),
      c = Math.abs(1 - a * a);
    let h, d, u, p;
    if (c > 0)
      if (((h = a * A - o), (d = a * o - A), (p = s * c), h >= 0))
        if (d >= -p)
          if (d <= p) {
            const v = 1 / c;
            ((h *= v),
              (d *= v),
              (u = h * (h + a * d + 2 * o) + d * (a * h + d + 2 * A) + l));
          } else
            ((d = s),
              (h = Math.max(0, -(a * d + o))),
              (u = -h * h + d * (d + 2 * A) + l));
        else
          ((d = -s),
            (h = Math.max(0, -(a * d + o))),
            (u = -h * h + d * (d + 2 * A) + l));
      else
        d <= -p
          ? ((h = Math.max(0, -(-a * s + o))),
            (d = h > 0 ? -s : Math.min(Math.max(-s, -A), s)),
            (u = -h * h + d * (d + 2 * A) + l))
          : d <= p
            ? ((h = 0),
              (d = Math.min(Math.max(-s, -A), s)),
              (u = d * (d + 2 * A) + l))
            : ((h = Math.max(0, -(a * s + o))),
              (d = h > 0 ? s : Math.min(Math.max(-s, -A), s)),
              (u = -h * h + d * (d + 2 * A) + l));
    else
      ((d = a > 0 ? -s : s),
        (h = Math.max(0, -(a * d + o))),
        (u = -h * h + d * (d + 2 * A) + l));
    return (
      n && n.copy(this.origin).addScaledVector(this.direction, h),
      r && r.copy(Hl).addScaledVector(Co, d),
      u
    );
  }
  intersectSphere(e, t) {
    Tr.subVectors(e.center, this.origin);
    const n = Tr.dot(this.direction),
      r = Tr.dot(Tr) - n * n,
      s = e.radius * e.radius;
    if (r > s) return null;
    const a = Math.sqrt(s - r),
      o = n - a,
      A = n + a;
    return A < 0 ? null : o < 0 ? this.at(A, t) : this.at(o, t);
  }
  intersectsSphere(e) {
    return e.radius < 0
      ? !1
      : this.distanceSqToPoint(e.center) <= e.radius * e.radius;
  }
  distanceToPlane(e) {
    const t = e.normal.dot(this.direction);
    if (t === 0) return e.distanceToPoint(this.origin) === 0 ? 0 : null;
    const n = -(this.origin.dot(e.normal) + e.constant) / t;
    return n >= 0 ? n : null;
  }
  intersectPlane(e, t) {
    const n = this.distanceToPlane(e);
    return n === null ? null : this.at(n, t);
  }
  intersectsPlane(e) {
    const t = e.distanceToPoint(this.origin);
    return t === 0 || e.normal.dot(this.direction) * t < 0;
  }
  intersectBox(e, t) {
    let n, r, s, a, o, A;
    const l = 1 / this.direction.x,
      c = 1 / this.direction.y,
      h = 1 / this.direction.z,
      d = this.origin;
    return (
      l >= 0
        ? ((n = (e.min.x - d.x) * l), (r = (e.max.x - d.x) * l))
        : ((n = (e.max.x - d.x) * l), (r = (e.min.x - d.x) * l)),
      c >= 0
        ? ((s = (e.min.y - d.y) * c), (a = (e.max.y - d.y) * c))
        : ((s = (e.max.y - d.y) * c), (a = (e.min.y - d.y) * c)),
      n > a ||
      s > r ||
      ((s > n || isNaN(n)) && (n = s),
      (a < r || isNaN(r)) && (r = a),
      h >= 0
        ? ((o = (e.min.z - d.z) * h), (A = (e.max.z - d.z) * h))
        : ((o = (e.max.z - d.z) * h), (A = (e.min.z - d.z) * h)),
      n > A || o > r) ||
      ((o > n || n !== n) && (n = o), (A < r || r !== r) && (r = A), r < 0)
        ? null
        : this.at(n >= 0 ? n : r, t)
    );
  }
  intersectsBox(e) {
    return this.intersectBox(e, Tr) !== null;
  }
  intersectTriangle(e, t, n, r, s) {
    (Ul.subVectors(t, e), bo.subVectors(n, e), ql.crossVectors(Ul, bo));
    let a = this.direction.dot(ql),
      o;
    if (a > 0) {
      if (r) return null;
      o = 1;
    } else if (a < 0) ((o = -1), (a = -a));
    else return null;
    Jr.subVectors(this.origin, e);
    const A = o * this.direction.dot(bo.crossVectors(Jr, bo));
    if (A < 0) return null;
    const l = o * this.direction.dot(Ul.cross(Jr));
    if (l < 0 || A + l > a) return null;
    const c = -o * Jr.dot(ql);
    return c < 0 ? null : this.at(c / a, s);
  }
  applyMatrix4(e) {
    return (
      this.origin.applyMatrix4(e),
      this.direction.transformDirection(e),
      this
    );
  }
  equals(e) {
    return e.origin.equals(this.origin) && e.direction.equals(this.direction);
  }
  clone() {
    return new this.constructor().copy(this);
  }
}

class cn extends Qt {
  constructor(e) {
    (super(),
      (this.isMeshBasicMaterial = !0),
      (this.type = "MeshBasicMaterial"),
      (this.color = new Ne(16777215)),
      (this.map = null),
      (this.lightMap = null),
      (this.lightMapIntensity = 1),
      (this.aoMap = null),
      (this.aoMapIntensity = 1),
      (this.specularMap = null),
      (this.alphaMap = null),
      (this.envMap = null),
      (this.envMapRotation = new yr()),
      (this.combine = YA),
      (this.reflectivity = 1),
      (this.refractionRatio = 0.98),
      (this.wireframe = !1),
      (this.wireframeLinewidth = 1),
      (this.wireframeLinecap = "round"),
      (this.wireframeLinejoin = "round"),
      (this.fog = !0),
      this.setValues(e));
  }
  copy(e) {
    return (
      super.copy(e),
      this.color.copy(e.color),
      (this.map = e.map),
      (this.lightMap = e.lightMap),
      (this.lightMapIntensity = e.lightMapIntensity),
      (this.aoMap = e.aoMap),
      (this.aoMapIntensity = e.aoMapIntensity),
      (this.specularMap = e.specularMap),
      (this.alphaMap = e.alphaMap),
      (this.envMap = e.envMap),
      this.envMapRotation.copy(e.envMapRotation),
      (this.combine = e.combine),
      (this.reflectivity = e.reflectivity),
      (this.refractionRatio = e.refractionRatio),
      (this.wireframe = e.wireframe),
      (this.wireframeLinewidth = e.wireframeLinewidth),
      (this.wireframeLinecap = e.wireframeLinecap),
      (this.wireframeLinejoin = e.wireframeLinejoin),
      (this.fog = e.fog),
      this
    );
  }
}

const wu = new mt();

const vi = new tl();

const So = new Cr();

const Mu = new F();

const wo = new F();

const Mo = new F();

const Bo = new F();

const $l = new F();

const ko = new F();

const Bu = new F();

const To = new F();

class Ee extends It {
  constructor(e = new Ct(), t = new cn()) {
    (super(),
      (this.isMesh = !0),
      (this.type = "Mesh"),
      (this.geometry = e),
      (this.material = t),
      (this.morphTargetDictionary = void 0),
      (this.morphTargetInfluences = void 0),
      (this.count = 1),
      this.updateMorphTargets());
  }
  copy(e, t) {
    return (
      super.copy(e, t),
      e.morphTargetInfluences !== void 0 &&
        (this.morphTargetInfluences = e.morphTargetInfluences.slice()),
      e.morphTargetDictionary !== void 0 &&
        (this.morphTargetDictionary = Object.assign(
          {},
          e.morphTargetDictionary,
        )),
      (this.material = Array.isArray(e.material)
        ? e.material.slice()
        : e.material),
      (this.geometry = e.geometry),
      this
    );
  }
  updateMorphTargets() {
    const t = this.geometry.morphAttributes,
      n = Object.keys(t);
    if (n.length > 0) {
      const r = t[n[0]];
      if (r !== void 0) {
        ((this.morphTargetInfluences = []), (this.morphTargetDictionary = {}));
        for (let s = 0, a = r.length; s < a; s++) {
          const o = r[s].name || String(s);
          (this.morphTargetInfluences.push(0),
            (this.morphTargetDictionary[o] = s));
        }
      }
    }
  }
  getVertexPosition(e, t) {
    const n = this.geometry,
      r = n.attributes.position,
      s = n.morphAttributes.position,
      a = n.morphTargetsRelative;
    t.fromBufferAttribute(r, e);
    const o = this.morphTargetInfluences;
    if (s && o) {
      ko.set(0, 0, 0);
      for (let A = 0, l = s.length; A < l; A++) {
        const c = o[A],
          h = s[A];
        c !== 0 &&
          ($l.fromBufferAttribute(h, e),
          a ? ko.addScaledVector($l, c) : ko.addScaledVector($l.sub(t), c));
      }
      t.add(ko);
    }
    return t;
  }
  raycast(e, t) {
    const n = this.geometry,
      r = this.material,
      s = this.matrixWorld;
    r !== void 0 &&
      (n.boundingSphere === null && n.computeBoundingSphere(),
      So.copy(n.boundingSphere),
      So.applyMatrix4(s),
      vi.copy(e.ray).recast(e.near),
      !(
        So.containsPoint(vi.origin) === !1 &&
        (vi.intersectSphere(So, Mu) === null ||
          vi.origin.distanceToSquared(Mu) > (e.far - e.near) ** 2)
      ) &&
        (wu.copy(s).invert(),
        vi.copy(e.ray).applyMatrix4(wu),
        !(n.boundingBox !== null && vi.intersectsBox(n.boundingBox) === !1) &&
          this._computeIntersections(e, t, vi)));
  }
  _computeIntersections(e, t, n) {
    let r;
    const s = this.geometry,
      a = this.material,
      o = s.index,
      A = s.attributes.position,
      l = s.attributes.uv,
      c = s.attributes.uv1,
      h = s.attributes.normal,
      d = s.groups,
      u = s.drawRange;
    if (o !== null)
      if (Array.isArray(a))
        for (let p = 0, v = d.length; p < v; p++) {
          const g = d[p],
            m = a[g.materialIndex],
            y = Math.max(g.start, u.start),
            C = Math.min(
              o.count,
              Math.min(g.start + g.count, u.start + u.count),
            );
          for (let E = y, w = C; E < w; E += 3) {
            const S = o.getX(E),
              k = o.getX(E + 1),
              x = o.getX(E + 2);
            ((r = Ro(this, m, e, n, l, c, h, S, k, x)),
              r &&
                ((r.faceIndex = Math.floor(E / 3)),
                (r.face.materialIndex = g.materialIndex),
                t.push(r)));
          }
        }
      else {
        const p = Math.max(0, u.start),
          v = Math.min(o.count, u.start + u.count);
        for (let g = p, m = v; g < m; g += 3) {
          const y = o.getX(g),
            C = o.getX(g + 1),
            E = o.getX(g + 2);
          ((r = Ro(this, a, e, n, l, c, h, y, C, E)),
            r && ((r.faceIndex = Math.floor(g / 3)), t.push(r)));
        }
      }
    else if (A !== void 0)
      if (Array.isArray(a))
        for (let p = 0, v = d.length; p < v; p++) {
          const g = d[p],
            m = a[g.materialIndex],
            y = Math.max(g.start, u.start),
            C = Math.min(
              A.count,
              Math.min(g.start + g.count, u.start + u.count),
            );
          for (let E = y, w = C; E < w; E += 3) {
            const S = E,
              k = E + 1,
              x = E + 2;
            ((r = Ro(this, m, e, n, l, c, h, S, k, x)),
              r &&
                ((r.faceIndex = Math.floor(E / 3)),
                (r.face.materialIndex = g.materialIndex),
                t.push(r)));
          }
        }
      else {
        const p = Math.max(0, u.start),
          v = Math.min(A.count, u.start + u.count);
        for (let g = p, m = v; g < m; g += 3) {
          const y = g,
            C = g + 1,
            E = g + 2;
          ((r = Ro(this, a, e, n, l, c, h, y, C, E)),
            r && ((r.faceIndex = Math.floor(g / 3)), t.push(r)));
        }
      }
  }
}

function qv(i, e, t, n, r, s, a, o) {
  let A;
  if (
    (e.side === pn
      ? (A = n.intersectTriangle(a, s, r, !0, o))
      : (A = n.intersectTriangle(r, s, a, e.side === $n, o)),
    A === null)
  )
    return null;
  (To.copy(o), To.applyMatrix4(i.matrixWorld));
  const l = t.ray.origin.distanceTo(To);
  return l < t.near || l > t.far
    ? null
    : { distance: l, point: To.clone(), object: i };
}

function Ro(i, e, t, n, r, s, a, o, A, l) {
  (i.getVertexPosition(o, wo),
    i.getVertexPosition(A, Mo),
    i.getVertexPosition(l, Bo));
  const c = qv(i, e, t, n, wo, Mo, Bo, Bu);
  if (c) {
    const h = new F();
    (Bn.getBarycoord(Bu, wo, Mo, Bo, h),
      r && (c.uv = Bn.getInterpolatedAttribute(r, o, A, l, h, new Ae())),
      s && (c.uv1 = Bn.getInterpolatedAttribute(s, o, A, l, h, new Ae())),
      a &&
        ((c.normal = Bn.getInterpolatedAttribute(a, o, A, l, h, new F())),
        c.normal.dot(n.direction) > 0 && c.normal.multiplyScalar(-1)));
    const d = { a: o, b: A, c: l, normal: new F(), materialIndex: 0 };
    (Bn.getNormal(wo, Mo, Bo, d.normal), (c.face = d), (c.barycoord = h));
  }
  return c;
}

const aa = new Pt();

const ku = new Pt();

const Tu = new Pt();

const $v = new Pt();

const Ru = new mt();

const Po = new F();

const zl = new Cr();

const Pu = new mt();

const Vl = new tl();

class zv extends Ee {
  constructor(e, t) {
    (super(e, t),
      (this.isSkinnedMesh = !0),
      (this.type = "SkinnedMesh"),
      (this.bindMode = su),
      (this.bindMatrix = new mt()),
      (this.bindMatrixInverse = new mt()),
      (this.boundingBox = null),
      (this.boundingSphere = null));
  }
  computeBoundingBox() {
    const e = this.geometry;
    (this.boundingBox === null && (this.boundingBox = new xr()),
      this.boundingBox.makeEmpty());
    const t = e.getAttribute("position");
    for (let n = 0; n < t.count; n++)
      (this.getVertexPosition(n, Po), this.boundingBox.expandByPoint(Po));
  }
  computeBoundingSphere() {
    const e = this.geometry;
    (this.boundingSphere === null && (this.boundingSphere = new Cr()),
      this.boundingSphere.makeEmpty());
    const t = e.getAttribute("position");
    for (let n = 0; n < t.count; n++)
      (this.getVertexPosition(n, Po), this.boundingSphere.expandByPoint(Po));
  }
  copy(e, t) {
    return (
      super.copy(e, t),
      (this.bindMode = e.bindMode),
      this.bindMatrix.copy(e.bindMatrix),
      this.bindMatrixInverse.copy(e.bindMatrixInverse),
      (this.skeleton = e.skeleton),
      e.boundingBox !== null && (this.boundingBox = e.boundingBox.clone()),
      e.boundingSphere !== null &&
        (this.boundingSphere = e.boundingSphere.clone()),
      this
    );
  }
  raycast(e, t) {
    const n = this.material,
      r = this.matrixWorld;
    n !== void 0 &&
      (this.boundingSphere === null && this.computeBoundingSphere(),
      zl.copy(this.boundingSphere),
      zl.applyMatrix4(r),
      e.ray.intersectsSphere(zl) !== !1 &&
        (Pu.copy(r).invert(),
        Vl.copy(e.ray).applyMatrix4(Pu),
        !(
          this.boundingBox !== null && Vl.intersectsBox(this.boundingBox) === !1
        ) && this._computeIntersections(e, t, Vl)));
  }
  getVertexPosition(e, t) {
    return (super.getVertexPosition(e, t), this.applyBoneTransform(e, t), t);
  }
  bind(e, t) {
    ((this.skeleton = e),
      t === void 0 &&
        (this.updateMatrixWorld(!0),
        this.skeleton.calculateInverses(),
        (t = this.matrixWorld)),
      this.bindMatrix.copy(t),
      this.bindMatrixInverse.copy(t).invert());
  }
  pose() {
    this.skeleton.pose();
  }
  normalizeSkinWeights() {
    const e = new Pt(),
      t = this.geometry.attributes.skinWeight;
    for (let n = 0, r = t.count; n < r; n++) {
      e.fromBufferAttribute(t, n);
      const s = 1 / e.manhattanLength();
      (s !== 1 / 0 ? e.multiplyScalar(s) : e.set(1, 0, 0, 0),
        t.setXYZW(n, e.x, e.y, e.z, e.w));
    }
  }
  updateMatrixWorld(e) {
    (super.updateMatrixWorld(e),
      this.bindMode === su
        ? this.bindMatrixInverse.copy(this.matrixWorld).invert()
        : this.bindMode === Xg
          ? this.bindMatrixInverse.copy(this.bindMatrix).invert()
          : it("SkinnedMesh: Unrecognized bindMode: " + this.bindMode));
  }
  applyBoneTransform(e, t) {
    const n = this.skeleton,
      r = this.geometry;
    (ku.fromBufferAttribute(r.attributes.skinIndex, e),
      Tu.fromBufferAttribute(r.attributes.skinWeight, e),
      t.isVector4
        ? (aa.copy(t), t.set(0, 0, 0, 0))
        : (aa.set(...t, 1), t.set(0, 0, 0)),
      aa.applyMatrix4(this.bindMatrix));
    for (let s = 0; s < 4; s++) {
      const a = Tu.getComponent(s);
      if (a !== 0) {
        const o = ku.getComponent(s);
        (Ru.multiplyMatrices(n.bones[o].matrixWorld, n.boneInverses[o]),
          t.addScaledVector($v.copy(aa).applyMatrix4(Ru), a));
      }
    }
    return (
      t.isVector4 && (t.w = aa.w),
      t.applyMatrix4(this.bindMatrixInverse)
    );
  }
}

class Im extends It {
  constructor() {
    (super(), (this.isBone = !0), (this.type = "Bone"));
  }
}

class nl extends Zt {
  constructor(e = null, t = 1, n = 1, r, s, a, o, A, l = Yt, c = Yt, h, d) {
    (super(null, a, o, A, l, c, r, s, h, d),
      (this.isDataTexture = !0),
      (this.image = { data: e, width: t, height: n }),
      (this.generateMipmaps = !1),
      (this.flipY = !1),
      (this.unpackAlignment = 1));
  }
}

const Iu = new mt();

const Vv = new mt();

class xd {
  constructor(e = [], t = []) {
    ((this.uuid = Un()),
      (this.bones = e.slice(0)),
      (this.boneInverses = t),
      (this.boneMatrices = null),
      (this.boneTexture = null),
      this.init());
  }
  init() {
    const e = this.bones,
      t = this.boneInverses;
    if (((this.boneMatrices = new Float32Array(e.length * 16)), t.length === 0))
      this.calculateInverses();
    else if (e.length !== t.length) {
      (it(
        "Skeleton: Number of inverse bone matrices does not match amount of bones.",
      ),
        (this.boneInverses = []));
      for (let n = 0, r = this.bones.length; n < r; n++)
        this.boneInverses.push(new mt());
    }
  }
  calculateInverses() {
    this.boneInverses.length = 0;
    for (let e = 0, t = this.bones.length; e < t; e++) {
      const n = new mt();
      (this.bones[e] && n.copy(this.bones[e].matrixWorld).invert(),
        this.boneInverses.push(n));
    }
  }
  pose() {
    for (let e = 0, t = this.bones.length; e < t; e++) {
      const n = this.bones[e];
      n && n.matrixWorld.copy(this.boneInverses[e]).invert();
    }
    for (let e = 0, t = this.bones.length; e < t; e++) {
      const n = this.bones[e];
      n &&
        (n.parent && n.parent.isBone
          ? (n.matrix.copy(n.parent.matrixWorld).invert(),
            n.matrix.multiply(n.matrixWorld))
          : n.matrix.copy(n.matrixWorld),
        n.matrix.decompose(n.position, n.quaternion, n.scale));
    }
  }
  update() {
    const e = this.bones,
      t = this.boneInverses,
      n = this.boneMatrices,
      r = this.boneTexture;
    for (let s = 0, a = e.length; s < a; s++) {
      const o = e[s] ? e[s].matrixWorld : Vv;
      (Iu.multiplyMatrices(o, t[s]), Iu.toArray(n, s * 16));
    }
    r !== null && (r.needsUpdate = !0);
  }
  clone() {
    return new xd(this.bones, this.boneInverses);
  }
  computeBoneTexture() {
    let e = Math.sqrt(this.bones.length * 4);
    ((e = Math.ceil(e / 4) * 4), (e = Math.max(e, 4)));
    const t = new Float32Array(e * e * 4);
    t.set(this.boneMatrices);
    const n = new nl(t, e, e, Hn, On);
    return (
      (n.needsUpdate = !0),
      (this.boneMatrices = t),
      (this.boneTexture = n),
      this
    );
  }
  getBoneByName(e) {
    for (let t = 0, n = this.bones.length; t < n; t++) {
      const r = this.bones[t];
      if (r.name === e) return r;
    }
  }
  dispose() {
    this.boneTexture !== null &&
      (this.boneTexture.dispose(), (this.boneTexture = null));
  }
  fromJSON(e, t) {
    this.uuid = e.uuid;
    for (let n = 0, r = e.bones.length; n < r; n++) {
      const s = e.bones[n];
      let a = t[s];
      (a === void 0 &&
        (it("Skeleton: No bone found with UUID:", s), (a = new Im())),
        this.bones.push(a),
        this.boneInverses.push(new mt().fromArray(e.boneInverses[n])));
    }
    return (this.init(), this);
  }
  toJSON() {
    const e = {
      metadata: {
        version: 4.7,
        type: "Skeleton",
        generator: "Skeleton.toJSON",
      },
      bones: [],
      boneInverses: [],
    };
    e.uuid = this.uuid;
    const t = this.bones,
      n = this.boneInverses;
    for (let r = 0, s = t.length; r < s; r++) {
      const a = t[r];
      e.bones.push(a.uuid);
      const o = n[r];
      e.boneInverses.push(o.toArray());
    }
    return e;
  }
}

class un extends zt {
  constructor(e, t, n, r = 1) {
    (super(e, t, n),
      (this.isInstancedBufferAttribute = !0),
      (this.meshPerAttribute = r));
  }
  copy(e) {
    return (super.copy(e), (this.meshPerAttribute = e.meshPerAttribute), this);
  }
  toJSON() {
    const e = super.toJSON();
    return (
      (e.meshPerAttribute = this.meshPerAttribute),
      (e.isInstancedBufferAttribute = !0),
      e
    );
  }
}

const ds = new mt();

const Lu = new mt();

const Io = [];

const Fu = new xr();

const Wv = new mt();

const oa = new Ee();

const Aa = new Cr();

class Lm extends Ee {
  constructor(e, t, n) {
    (super(e, t),
      (this.isInstancedMesh = !0),
      (this.instanceMatrix = new un(new Float32Array(n * 16), 16)),
      (this.instanceColor = null),
      (this.morphTexture = null),
      (this.count = n),
      (this.boundingBox = null),
      (this.boundingSphere = null));
    for (let r = 0; r < n; r++) this.setMatrixAt(r, Wv);
  }
  computeBoundingBox() {
    const e = this.geometry,
      t = this.count;
    (this.boundingBox === null && (this.boundingBox = new xr()),
      e.boundingBox === null && e.computeBoundingBox(),
      this.boundingBox.makeEmpty());
    for (let n = 0; n < t; n++)
      (this.getMatrixAt(n, ds),
        Fu.copy(e.boundingBox).applyMatrix4(ds),
        this.boundingBox.union(Fu));
  }
  computeBoundingSphere() {
    const e = this.geometry,
      t = this.count;
    (this.boundingSphere === null && (this.boundingSphere = new Cr()),
      e.boundingSphere === null && e.computeBoundingSphere(),
      this.boundingSphere.makeEmpty());
    for (let n = 0; n < t; n++)
      (this.getMatrixAt(n, ds),
        Aa.copy(e.boundingSphere).applyMatrix4(ds),
        this.boundingSphere.union(Aa));
  }
  copy(e, t) {
    return (
      super.copy(e, t),
      this.instanceMatrix.copy(e.instanceMatrix),
      e.morphTexture !== null && (this.morphTexture = e.morphTexture.clone()),
      e.instanceColor !== null &&
        (this.instanceColor = e.instanceColor.clone()),
      (this.count = e.count),
      e.boundingBox !== null && (this.boundingBox = e.boundingBox.clone()),
      e.boundingSphere !== null &&
        (this.boundingSphere = e.boundingSphere.clone()),
      this
    );
  }
  getColorAt(e, t) {
    return this.instanceColor === null
      ? t.setRGB(1, 1, 1)
      : t.fromArray(this.instanceColor.array, e * 3);
  }
  getMatrixAt(e, t) {
    return t.fromArray(this.instanceMatrix.array, e * 16);
  }
  getMorphAt(e, t) {
    const n = t.morphTargetInfluences,
      r = this.morphTexture.source.data.data,
      s = n.length + 1,
      a = e * s + 1;
    for (let o = 0; o < n.length; o++) n[o] = r[a + o];
  }
  raycast(e, t) {
    const n = this.matrixWorld,
      r = this.count;
    if (
      ((oa.geometry = this.geometry),
      (oa.material = this.material),
      oa.material !== void 0 &&
        (this.boundingSphere === null && this.computeBoundingSphere(),
        Aa.copy(this.boundingSphere),
        Aa.applyMatrix4(n),
        e.ray.intersectsSphere(Aa) !== !1))
    )
      for (let s = 0; s < r; s++) {
        (this.getMatrixAt(s, ds),
          Lu.multiplyMatrices(n, ds),
          (oa.matrixWorld = Lu),
          oa.raycast(e, Io));
        for (let a = 0, o = Io.length; a < o; a++) {
          const A = Io[a];
          ((A.instanceId = s), (A.object = this), t.push(A));
        }
        Io.length = 0;
      }
  }
  setColorAt(e, t) {
    return (
      this.instanceColor === null &&
        (this.instanceColor = new un(
          new Float32Array(this.instanceMatrix.count * 3).fill(1),
          3,
        )),
      t.toArray(this.instanceColor.array, e * 3),
      this
    );
  }
  setMatrixAt(e, t) {
    return (t.toArray(this.instanceMatrix.array, e * 16), this);
  }
  setMorphAt(e, t) {
    const n = t.morphTargetInfluences,
      r = n.length + 1;
    this.morphTexture === null &&
      (this.morphTexture = new nl(
        new Float32Array(r * this.count),
        r,
        this.count,
        QA,
        On,
      ));
    const s = this.morphTexture.source.data.data;
    let a = 0;
    for (let l = 0; l < n.length; l++) a += n[l];
    const o = this.geometry.morphTargetsRelative ? 1 : 1 - a,
      A = r * e;
    return ((s[A] = o), s.set(n, A + 1), this);
  }
  updateMorphTargets() {}
  dispose() {
    (this.dispatchEvent({ type: "dispose" }),
      this.morphTexture !== null &&
        (this.morphTexture.dispose(), (this.morphTexture = null)));
  }
}

const Wl = new F();

const Xv = new F();

const Jv = new jt();

class Si {
  constructor(e = new F(1, 0, 0), t = 0) {
    ((this.isPlane = !0), (this.normal = e), (this.constant = t));
  }
  set(e, t) {
    return (this.normal.copy(e), (this.constant = t), this);
  }
  setComponents(e, t, n, r) {
    return (this.normal.set(e, t, n), (this.constant = r), this);
  }
  setFromNormalAndCoplanarPoint(e, t) {
    return (this.normal.copy(e), (this.constant = -t.dot(this.normal)), this);
  }
  setFromCoplanarPoints(e, t, n) {
    const r = Wl.subVectors(n, t).cross(Xv.subVectors(e, t)).normalize();
    return (this.setFromNormalAndCoplanarPoint(r, e), this);
  }
  copy(e) {
    return (this.normal.copy(e.normal), (this.constant = e.constant), this);
  }
  normalize() {
    const e = 1 / this.normal.length();
    return (this.normal.multiplyScalar(e), (this.constant *= e), this);
  }
  negate() {
    return ((this.constant *= -1), this.normal.negate(), this);
  }
  distanceToPoint(e) {
    return this.normal.dot(e) + this.constant;
  }
  distanceToSphere(e) {
    return this.distanceToPoint(e.center) - e.radius;
  }
  projectPoint(e, t) {
    return t.copy(e).addScaledVector(this.normal, -this.distanceToPoint(e));
  }
  intersectLine(e, t, n = !0) {
    const r = e.delta(Wl),
      s = this.normal.dot(r);
    if (s === 0)
      return this.distanceToPoint(e.start) === 0 ? t.copy(e.start) : null;
    const a = -(e.start.dot(this.normal) + this.constant) / s;
    return n === !0 && (a < 0 || a > 1)
      ? null
      : t.copy(e.start).addScaledVector(r, a);
  }
  intersectsLine(e) {
    const t = this.distanceToPoint(e.start),
      n = this.distanceToPoint(e.end);
    return (t < 0 && n > 0) || (n < 0 && t > 0);
  }
  intersectsBox(e) {
    return e.intersectsPlane(this);
  }
  intersectsSphere(e) {
    return e.intersectsPlane(this);
  }
  coplanarPoint(e) {
    return e.copy(this.normal).multiplyScalar(-this.constant);
  }
  applyMatrix4(e, t) {
    const n = t || Jv.getNormalMatrix(e),
      r = this.coplanarPoint(Wl).applyMatrix4(e),
      s = this.normal.applyMatrix3(n).normalize();
    return ((this.constant = -r.dot(s)), this);
  }
  translate(e) {
    return ((this.constant -= e.dot(this.normal)), this);
  }
  equals(e) {
    return e.normal.equals(this.normal) && e.constant === this.constant;
  }
  clone() {
    return new this.constructor().copy(this);
  }
}

const ji = new Cr();

const Kv = new Ae(0.5, 0.5);

const Lo = new F();

class Cd {
  constructor(
    e = new Si(),
    t = new Si(),
    n = new Si(),
    r = new Si(),
    s = new Si(),
    a = new Si(),
  ) {
    this.planes = [e, t, n, r, s, a];
  }
  set(e, t, n, r, s, a) {
    const o = this.planes;
    return (
      o[0].copy(e),
      o[1].copy(t),
      o[2].copy(n),
      o[3].copy(r),
      o[4].copy(s),
      o[5].copy(a),
      this
    );
  }
  copy(e) {
    const t = this.planes;
    for (let n = 0; n < 6; n++) t[n].copy(e.planes[n]);
    return this;
  }
  setFromProjectionMatrix(e, t = mr, n = !1) {
    const r = this.planes,
      s = e.elements,
      a = s[0],
      o = s[1],
      A = s[2],
      l = s[3],
      c = s[4],
      h = s[5],
      d = s[6],
      u = s[7],
      p = s[8],
      v = s[9],
      g = s[10],
      m = s[11],
      y = s[12],
      C = s[13],
      E = s[14],
      w = s[15];
    if (
      (r[0].setComponents(l - a, u - c, m - p, w - y).normalize(),
      r[1].setComponents(l + a, u + c, m + p, w + y).normalize(),
      r[2].setComponents(l + o, u + h, m + v, w + C).normalize(),
      r[3].setComponents(l - o, u - h, m - v, w - C).normalize(),
      n)
    )
      (r[4].setComponents(A, d, g, E).normalize(),
        r[5].setComponents(l - A, u - d, m - g, w - E).normalize());
    else if (
      (r[4].setComponents(l - A, u - d, m - g, w - E).normalize(), t === mr)
    )
      r[5].setComponents(l + A, u + d, m + g, w + E).normalize();
    else if (t === $a) r[5].setComponents(A, d, g, E).normalize();
    else
      throw new Error(
        "THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: " +
          t,
      );
    return this;
  }
  intersectsObject(e) {
    if (e.boundingSphere !== void 0)
      (e.boundingSphere === null && e.computeBoundingSphere(),
        ji.copy(e.boundingSphere).applyMatrix4(e.matrixWorld));
    else {
      const t = e.geometry;
      (t.boundingSphere === null && t.computeBoundingSphere(),
        ji.copy(t.boundingSphere).applyMatrix4(e.matrixWorld));
    }
    return this.intersectsSphere(ji);
  }
  intersectsSprite(e) {
    ji.center.set(0, 0, 0);
    const t = Kv.distanceTo(e.center);
    return (
      (ji.radius = 0.7071067811865476 + t),
      ji.applyMatrix4(e.matrixWorld),
      this.intersectsSphere(ji)
    );
  }
  intersectsSphere(e) {
    const t = this.planes,
      n = e.center,
      r = -e.radius;
    for (let s = 0; s < 6; s++) if (t[s].distanceToPoint(n) < r) return !1;
    return !0;
  }
  intersectsBox(e) {
    const t = this.planes;
    for (let n = 0; n < 6; n++) {
      const r = t[n];
      if (
        ((Lo.x = r.normal.x > 0 ? e.max.x : e.min.x),
        (Lo.y = r.normal.y > 0 ? e.max.y : e.min.y),
        (Lo.z = r.normal.z > 0 ? e.max.z : e.min.z),
        r.distanceToPoint(Lo) < 0)
      )
        return !1;
    }
    return !0;
  }
  containsPoint(e) {
    const t = this.planes;
    for (let n = 0; n < 6; n++) if (t[n].distanceToPoint(e) < 0) return !1;
    return !0;
  }
  clone() {
    return new this.constructor().copy(this);
  }
}

class Gi extends Qt {
  constructor(e) {
    (super(),
      (this.isLineBasicMaterial = !0),
      (this.type = "LineBasicMaterial"),
      (this.color = new Ne(16777215)),
      (this.map = null),
      (this.linewidth = 1),
      (this.linecap = "round"),
      (this.linejoin = "round"),
      (this.fog = !0),
      this.setValues(e));
  }
  copy(e) {
    return (
      super.copy(e),
      this.color.copy(e.color),
      (this.map = e.map),
      (this.linewidth = e.linewidth),
      (this.linecap = e.linecap),
      (this.linejoin = e.linejoin),
      (this.fog = e.fog),
      this
    );
  }
}

const IA = new F();

const LA = new F();

const Du = new mt();

const la = new tl();

const Fo = new Cr();

const Xl = new F();

const Nu = new F();

class rl extends It {
  constructor(e = new Ct(), t = new Gi()) {
    (super(),
      (this.isLine = !0),
      (this.type = "Line"),
      (this.geometry = e),
      (this.material = t),
      (this.morphTargetDictionary = void 0),
      (this.morphTargetInfluences = void 0),
      this.updateMorphTargets());
  }
  copy(e, t) {
    return (
      super.copy(e, t),
      (this.material = Array.isArray(e.material)
        ? e.material.slice()
        : e.material),
      (this.geometry = e.geometry),
      this
    );
  }
  computeLineDistances() {
    const e = this.geometry;
    if (e.index === null) {
      const t = e.attributes.position,
        n = [0];
      for (let r = 1, s = t.count; r < s; r++)
        (IA.fromBufferAttribute(t, r - 1),
          LA.fromBufferAttribute(t, r),
          (n[r] = n[r - 1]),
          (n[r] += IA.distanceTo(LA)));
      e.setAttribute("lineDistance", new Ke(n, 1));
    } else
      it(
        "Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.",
      );
    return this;
  }
  raycast(e, t) {
    const n = this.geometry,
      r = this.matrixWorld,
      s = e.params.Line.threshold,
      a = n.drawRange;
    if (
      (n.boundingSphere === null && n.computeBoundingSphere(),
      Fo.copy(n.boundingSphere),
      Fo.applyMatrix4(r),
      (Fo.radius += s),
      e.ray.intersectsSphere(Fo) === !1)
    )
      return;
    (Du.copy(r).invert(), la.copy(e.ray).applyMatrix4(Du));
    const o = s / ((this.scale.x + this.scale.y + this.scale.z) / 3),
      A = o * o,
      l = this.isLineSegments ? 2 : 1,
      c = n.index,
      d = n.attributes.position;
    if (c !== null) {
      const u = Math.max(0, a.start),
        p = Math.min(c.count, a.start + a.count);
      for (let v = u, g = p - 1; v < g; v += l) {
        const m = c.getX(v),
          y = c.getX(v + 1),
          C = Do(this, e, la, A, m, y, v);
        C && t.push(C);
      }
      if (this.isLineLoop) {
        const v = c.getX(p - 1),
          g = c.getX(u),
          m = Do(this, e, la, A, v, g, p - 1);
        m && t.push(m);
      }
    } else {
      const u = Math.max(0, a.start),
        p = Math.min(d.count, a.start + a.count);
      for (let v = u, g = p - 1; v < g; v += l) {
        const m = Do(this, e, la, A, v, v + 1, v);
        m && t.push(m);
      }
      if (this.isLineLoop) {
        const v = Do(this, e, la, A, p - 1, u, p - 1);
        v && t.push(v);
      }
    }
  }
  updateMorphTargets() {
    const t = this.geometry.morphAttributes,
      n = Object.keys(t);
    if (n.length > 0) {
      const r = t[n[0]];
      if (r !== void 0) {
        ((this.morphTargetInfluences = []), (this.morphTargetDictionary = {}));
        for (let s = 0, a = r.length; s < a; s++) {
          const o = r[s].name || String(s);
          (this.morphTargetInfluences.push(0),
            (this.morphTargetDictionary[o] = s));
        }
      }
    }
  }
}

function Do(i, e, t, n, r, s, a) {
  const o = i.geometry.attributes.position;
  if (
    (IA.fromBufferAttribute(o, r),
    LA.fromBufferAttribute(o, s),
    t.distanceSqToSegment(IA, LA, Xl, Nu) > n)
  )
    return;
  Xl.applyMatrix4(i.matrixWorld);
  const l = e.ray.origin.distanceTo(Xl);
  if (!(l < e.near || l > e.far))
    return {
      distance: l,
      point: Nu.clone().applyMatrix4(i.matrixWorld),
      index: a,
      face: null,
      faceIndex: null,
      barycoord: null,
      object: i,
    };
}

const Gu = new F();

const Ou = new F();

class Wa extends rl {
  constructor(e, t) {
    (super(e, t), (this.isLineSegments = !0), (this.type = "LineSegments"));
  }
  computeLineDistances() {
    const e = this.geometry;
    if (e.index === null) {
      const t = e.attributes.position,
        n = [];
      for (let r = 0, s = t.count; r < s; r += 2)
        (Gu.fromBufferAttribute(t, r),
          Ou.fromBufferAttribute(t, r + 1),
          (n[r] = r === 0 ? 0 : n[r - 1]),
          (n[r + 1] = n[r] + Gu.distanceTo(Ou)));
      e.setAttribute("lineDistance", new Ke(n, 1));
    } else
      it(
        "LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.",
      );
    return this;
  }
}

class Yv extends rl {
  constructor(e, t) {
    (super(e, t), (this.isLineLoop = !0), (this.type = "LineLoop"));
  }
}

class ws extends Qt {
  constructor(e) {
    (super(),
      (this.isPointsMaterial = !0),
      (this.type = "PointsMaterial"),
      (this.color = new Ne(16777215)),
      (this.map = null),
      (this.alphaMap = null),
      (this.size = 1),
      (this.sizeAttenuation = !0),
      (this.fog = !0),
      this.setValues(e));
  }
  copy(e) {
    return (
      super.copy(e),
      this.color.copy(e.color),
      (this.map = e.map),
      (this.alphaMap = e.alphaMap),
      (this.size = e.size),
      (this.sizeAttenuation = e.sizeAttenuation),
      (this.fog = e.fog),
      this
    );
  }
}

const Hu = new mt();

const wh = new tl();

const No = new Cr();

const Go = new F();

class Ai extends It {
  constructor(e = new Ct(), t = new ws()) {
    (super(),
      (this.isPoints = !0),
      (this.type = "Points"),
      (this.geometry = e),
      (this.material = t),
      (this.morphTargetDictionary = void 0),
      (this.morphTargetInfluences = void 0),
      this.updateMorphTargets());
  }
  copy(e, t) {
    return (
      super.copy(e, t),
      (this.material = Array.isArray(e.material)
        ? e.material.slice()
        : e.material),
      (this.geometry = e.geometry),
      this
    );
  }
  raycast(e, t) {
    const n = this.geometry,
      r = this.matrixWorld,
      s = e.params.Points.threshold,
      a = n.drawRange;
    if (
      (n.boundingSphere === null && n.computeBoundingSphere(),
      No.copy(n.boundingSphere),
      No.applyMatrix4(r),
      (No.radius += s),
      e.ray.intersectsSphere(No) === !1)
    )
      return;
    (Hu.copy(r).invert(), wh.copy(e.ray).applyMatrix4(Hu));
    const o = s / ((this.scale.x + this.scale.y + this.scale.z) / 3),
      A = o * o,
      l = n.index,
      h = n.attributes.position;
    if (l !== null) {
      const d = Math.max(0, a.start),
        u = Math.min(l.count, a.start + a.count);
      for (let p = d, v = u; p < v; p++) {
        const g = l.getX(p);
        (Go.fromBufferAttribute(h, g), Uu(Go, g, A, r, e, t, this));
      }
    } else {
      const d = Math.max(0, a.start),
        u = Math.min(h.count, a.start + a.count);
      for (let p = d, v = u; p < v; p++)
        (Go.fromBufferAttribute(h, p), Uu(Go, p, A, r, e, t, this));
    }
  }
  updateMorphTargets() {
    const t = this.geometry.morphAttributes,
      n = Object.keys(t);
    if (n.length > 0) {
      const r = t[n[0]];
      if (r !== void 0) {
        ((this.morphTargetInfluences = []), (this.morphTargetDictionary = {}));
        for (let s = 0, a = r.length; s < a; s++) {
          const o = r[s].name || String(s);
          (this.morphTargetInfluences.push(0),
            (this.morphTargetDictionary[o] = s));
        }
      }
    }
  }
}

function Uu(i, e, t, n, r, s, a) {
  const o = wh.distanceSqToPoint(i);
  if (o < t) {
    const A = new F();
    (wh.closestPointToPoint(i, A), A.applyMatrix4(n));
    const l = r.ray.origin.distanceTo(A);
    if (l < r.near || l > r.far) return;
    s.push({
      distance: l,
      distanceToRay: Math.sqrt(o),
      point: A,
      index: e,
      face: null,
      faceIndex: null,
      barycoord: null,
      object: a,
    });
  }
}

class Fm extends Zt {
  constructor(e = [], t = Ui, n, r, s, a, o, A, l, c) {
    (super(e, t, n, r, s, a, o, A, l, c),
      (this.isCubeTexture = !0),
      (this.flipY = !1));
  }
  get images() {
    return this.image;
  }
  set images(e) {
    this.image = e;
  }
}

class bd extends Zt {
  constructor(e, t, n, r, s, a, o, A, l) {
    (super(e, t, n, r, s, a, o, A, l),
      (this.isCanvasTexture = !0),
      (this.needsUpdate = !0));
  }
}

class Gs extends Zt {
  constructor(e, t, n = Er, r, s, a, o = Yt, A = Yt, l, c = Hr, h = 1) {
    if (c !== Hr && c !== Ii)
      throw new Error(
        "THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat",
      );
    const d = { width: e, height: t, depth: h };
    (super(d, r, s, a, o, A, c, n, l),
      (this.isDepthTexture = !0),
      (this.flipY = !1),
      (this.generateMipmaps = !1),
      (this.compareFunction = null));
  }
  copy(e) {
    return (
      super.copy(e),
      (this.source = new _d(Object.assign({}, e.image))),
      (this.compareFunction = e.compareFunction),
      this
    );
  }
  toJSON(e) {
    const t = super.toJSON(e);
    return (
      this.compareFunction !== null &&
        (t.compareFunction = this.compareFunction),
      t
    );
  }
}

class Zv extends Gs {
  constructor(e, t = Er, n = Ui, r, s, a = Yt, o = Yt, A, l = Hr) {
    const c = { width: e, height: e, depth: 1 },
      h = [c, c, c, c, c, c];
    (super(e, e, t, n, r, s, a, o, A, l),
      (this.image = h),
      (this.isCubeDepthTexture = !0),
      (this.isCubeTexture = !0));
  }
  get images() {
    return this.image;
  }
  set images(e) {
    this.image = e;
  }
}

class Dm extends Zt {
  constructor(e = null) {
    (super(), (this.sourceTexture = e), (this.isExternalTexture = !0));
  }
  copy(e) {
    return (super.copy(e), (this.sourceTexture = e.sourceTexture), this);
  }
}

class Tn extends Ct {
  constructor(e = 1, t = 1, n = 1, r = 1, s = 1, a = 1) {
    (super(),
      (this.type = "BoxGeometry"),
      (this.parameters = {
        width: e,
        height: t,
        depth: n,
        widthSegments: r,
        heightSegments: s,
        depthSegments: a,
      }));
    const o = this;
    ((r = Math.floor(r)), (s = Math.floor(s)), (a = Math.floor(a)));
    const A = [],
      l = [],
      c = [],
      h = [];
    let d = 0,
      u = 0;
    (p("z", "y", "x", -1, -1, n, t, e, a, s, 0),
      p("z", "y", "x", 1, -1, n, t, -e, a, s, 1),
      p("x", "z", "y", 1, 1, e, n, t, r, a, 2),
      p("x", "z", "y", 1, -1, e, n, -t, r, a, 3),
      p("x", "y", "z", 1, -1, e, t, n, r, s, 4),
      p("x", "y", "z", -1, -1, e, t, -n, r, s, 5),
      this.setIndex(A),
      this.setAttribute("position", new Ke(l, 3)),
      this.setAttribute("normal", new Ke(c, 3)),
      this.setAttribute("uv", new Ke(h, 2)));
    function p(v, g, m, y, C, E, w, S, k, x, T) {
      const R = E / k,
        D = w / x,
        N = E / 2,
        X = w / 2,
        Y = S / 2,
        H = k + 1,
        V = x + 1;
      let J = 0,
        ne = 0;
      const le = new F();
      for (let je = 0; je < V; je++) {
        const de = je * D - X;
        for (let pe = 0; pe < H; pe++) {
          const Se = pe * R - N;
          ((le[v] = Se * y),
            (le[g] = de * C),
            (le[m] = Y),
            l.push(le.x, le.y, le.z),
            (le[v] = 0),
            (le[g] = 0),
            (le[m] = S > 0 ? 1 : -1),
            c.push(le.x, le.y, le.z),
            h.push(pe / k),
            h.push(1 - je / x),
            (J += 1));
        }
      }
      for (let je = 0; je < x; je++)
        for (let de = 0; de < k; de++) {
          const pe = d + de + H * je,
            Se = d + de + H * (je + 1),
            gt = d + (de + 1) + H * (je + 1),
            ct = d + (de + 1) + H * je;
          (A.push(pe, Se, ct), A.push(Se, gt, ct), (ne += 6));
        }
      (o.addGroup(u, ne, T), (u += ne), (d += J));
    }
  }
  copy(e) {
    return (
      super.copy(e),
      (this.parameters = Object.assign({}, e.parameters)),
      this
    );
  }
  static fromJSON(e) {
    return new Tn(
      e.width,
      e.height,
      e.depth,
      e.widthSegments,
      e.heightSegments,
      e.depthSegments,
    );
  }
}

class Xt extends Ct {
  constructor(
    e = 1,
    t = 1,
    n = 1,
    r = 32,
    s = 1,
    a = !1,
    o = 0,
    A = Math.PI * 2,
  ) {
    (super(),
      (this.type = "CylinderGeometry"),
      (this.parameters = {
        radiusTop: e,
        radiusBottom: t,
        height: n,
        radialSegments: r,
        heightSegments: s,
        openEnded: a,
        thetaStart: o,
        thetaLength: A,
      }));
    const l = this;
    ((r = Math.floor(r)), (s = Math.floor(s)));
    const c = [],
      h = [],
      d = [],
      u = [];
    let p = 0;
    const v = [],
      g = n / 2;
    let m = 0;
    (y(),
      a === !1 && (e > 0 && C(!0), t > 0 && C(!1)),
      this.setIndex(c),
      this.setAttribute("position", new Ke(h, 3)),
      this.setAttribute("normal", new Ke(d, 3)),
      this.setAttribute("uv", new Ke(u, 2)));
    function y() {
      const E = new F(),
        w = new F();
      let S = 0;
      const k = (t - e) / n;
      for (let x = 0; x <= s; x++) {
        const T = [],
          R = x / s,
          D = R * (t - e) + e;
        for (let N = 0; N <= r; N++) {
          const X = N / r,
            Y = X * A + o,
            H = Math.sin(Y),
            V = Math.cos(Y);
          ((w.x = D * H),
            (w.y = -R * n + g),
            (w.z = D * V),
            h.push(w.x, w.y, w.z),
            E.set(H, k, V).normalize(),
            d.push(E.x, E.y, E.z),
            u.push(X, 1 - R),
            T.push(p++));
        }
        v.push(T);
      }
      for (let x = 0; x < r; x++)
        for (let T = 0; T < s; T++) {
          const R = v[T][x],
            D = v[T + 1][x],
            N = v[T + 1][x + 1],
            X = v[T][x + 1];
          ((e > 0 || T !== 0) && (c.push(R, D, X), (S += 3)),
            (t > 0 || T !== s - 1) && (c.push(D, N, X), (S += 3)));
        }
      (l.addGroup(m, S, 0), (m += S));
    }
    function C(E) {
      const w = p,
        S = new Ae(),
        k = new F();
      let x = 0;
      const T = E === !0 ? e : t,
        R = E === !0 ? 1 : -1;
      for (let N = 1; N <= r; N++)
        (h.push(0, g * R, 0), d.push(0, R, 0), u.push(0.5, 0.5), p++);
      const D = p;
      for (let N = 0; N <= r; N++) {
        const Y = (N / r) * A + o,
          H = Math.cos(Y),
          V = Math.sin(Y);
        ((k.x = T * V),
          (k.y = g * R),
          (k.z = T * H),
          h.push(k.x, k.y, k.z),
          d.push(0, R, 0),
          (S.x = H * 0.5 + 0.5),
          (S.y = V * 0.5 * R + 0.5),
          u.push(S.x, S.y),
          p++);
      }
      for (let N = 0; N < r; N++) {
        const X = w + N,
          Y = D + N;
        (E === !0 ? c.push(Y, Y + 1, X) : c.push(Y + 1, Y, X), (x += 3));
      }
      (l.addGroup(m, x, E === !0 ? 1 : 2), (m += x));
    }
  }
  copy(e) {
    return (
      super.copy(e),
      (this.parameters = Object.assign({}, e.parameters)),
      this
    );
  }
  static fromJSON(e) {
    return new Xt(
      e.radiusTop,
      e.radiusBottom,
      e.height,
      e.radialSegments,
      e.heightSegments,
      e.openEnded,
      e.thetaStart,
      e.thetaLength,
    );
  }
}

class Sd extends Ct {
  constructor(e = [], t = [], n = 1, r = 0) {
    (super(),
      (this.type = "PolyhedronGeometry"),
      (this.parameters = { vertices: e, indices: t, radius: n, detail: r }));
    const s = [],
      a = [];
    (o(r),
      l(n),
      c(),
      this.setAttribute("position", new Ke(s, 3)),
      this.setAttribute("normal", new Ke(s.slice(), 3)),
      this.setAttribute("uv", new Ke(a, 2)),
      r === 0 ? this.computeVertexNormals() : this.normalizeNormals());
    function o(y) {
      const C = new F(),
        E = new F(),
        w = new F();
      for (let S = 0; S < t.length; S += 3)
        (u(t[S + 0], C), u(t[S + 1], E), u(t[S + 2], w), A(C, E, w, y));
    }
    function A(y, C, E, w) {
      const S = w + 1,
        k = [];
      for (let x = 0; x <= S; x++) {
        k[x] = [];
        const T = y.clone().lerp(E, x / S),
          R = C.clone().lerp(E, x / S),
          D = S - x;
        for (let N = 0; N <= D; N++)
          N === 0 && x === S
            ? (k[x][N] = T)
            : (k[x][N] = T.clone().lerp(R, N / D));
      }
      for (let x = 0; x < S; x++)
        for (let T = 0; T < 2 * (S - x) - 1; T++) {
          const R = Math.floor(T / 2);
          T % 2 === 0
            ? (d(k[x][R + 1]), d(k[x + 1][R]), d(k[x][R]))
            : (d(k[x][R + 1]), d(k[x + 1][R + 1]), d(k[x + 1][R]));
        }
    }
    function l(y) {
      const C = new F();
      for (let E = 0; E < s.length; E += 3)
        ((C.x = s[E + 0]),
          (C.y = s[E + 1]),
          (C.z = s[E + 2]),
          C.normalize().multiplyScalar(y),
          (s[E + 0] = C.x),
          (s[E + 1] = C.y),
          (s[E + 2] = C.z));
    }
    function c() {
      const y = new F();
      for (let C = 0; C < s.length; C += 3) {
        ((y.x = s[C + 0]), (y.y = s[C + 1]), (y.z = s[C + 2]));
        const E = g(y) / 2 / Math.PI + 0.5,
          w = m(y) / Math.PI + 0.5;
        a.push(E, 1 - w);
      }
      (p(), h());
    }
    function h() {
      for (let y = 0; y < a.length; y += 6) {
        const C = a[y + 0],
          E = a[y + 2],
          w = a[y + 4],
          S = Math.max(C, E, w),
          k = Math.min(C, E, w);
        S > 0.9 &&
          k < 0.1 &&
          (C < 0.2 && (a[y + 0] += 1),
          E < 0.2 && (a[y + 2] += 1),
          w < 0.2 && (a[y + 4] += 1));
      }
    }
    function d(y) {
      s.push(y.x, y.y, y.z);
    }
    function u(y, C) {
      const E = y * 3;
      ((C.x = e[E + 0]), (C.y = e[E + 1]), (C.z = e[E + 2]));
    }
    function p() {
      const y = new F(),
        C = new F(),
        E = new F(),
        w = new F(),
        S = new Ae(),
        k = new Ae(),
        x = new Ae();
      for (let T = 0, R = 0; T < s.length; T += 9, R += 6) {
        (y.set(s[T + 0], s[T + 1], s[T + 2]),
          C.set(s[T + 3], s[T + 4], s[T + 5]),
          E.set(s[T + 6], s[T + 7], s[T + 8]),
          S.set(a[R + 0], a[R + 1]),
          k.set(a[R + 2], a[R + 3]),
          x.set(a[R + 4], a[R + 5]),
          w.copy(y).add(C).add(E).divideScalar(3));
        const D = g(w);
        (v(S, R + 0, y, D), v(k, R + 2, C, D), v(x, R + 4, E, D));
      }
    }
    function v(y, C, E, w) {
      (w < 0 && y.x === 1 && (a[C] = y.x - 1),
        E.x === 0 && E.z === 0 && (a[C] = w / 2 / Math.PI + 0.5));
    }
    function g(y) {
      return Math.atan2(y.z, -y.x);
    }
    function m(y) {
      return Math.atan2(-y.y, Math.sqrt(y.x * y.x + y.z * y.z));
    }
  }
  copy(e) {
    return (
      super.copy(e),
      (this.parameters = Object.assign({}, e.parameters)),
      this
    );
  }
  static fromJSON(e) {
    return new Sd(e.vertices, e.indices, e.radius, e.detail);
  }
}

const Oo = new F();

const Ho = new F();

const Jl = new F();

const Uo = new Bn();

class Nm extends Ct {
  constructor(e = null, t = 1) {
    if (
      (super(),
      (this.type = "EdgesGeometry"),
      (this.parameters = { geometry: e, thresholdAngle: t }),
      e !== null)
    ) {
      const r = Math.pow(10, 4),
        s = Math.cos(Bs * t),
        a = e.getIndex(),
        o = e.getAttribute("position"),
        A = a ? a.count : o.count,
        l = [0, 0, 0],
        c = ["a", "b", "c"],
        h = new Array(3),
        d = {},
        u = [];
      for (let p = 0; p < A; p += 3) {
        a
          ? ((l[0] = a.getX(p)), (l[1] = a.getX(p + 1)), (l[2] = a.getX(p + 2)))
          : ((l[0] = p), (l[1] = p + 1), (l[2] = p + 2));
        const { a: v, b: g, c: m } = Uo;
        if (
          (v.fromBufferAttribute(o, l[0]),
          g.fromBufferAttribute(o, l[1]),
          m.fromBufferAttribute(o, l[2]),
          Uo.getNormal(Jl),
          (h[0] = `${Math.round(v.x * r)},${Math.round(v.y * r)},${Math.round(v.z * r)}`),
          (h[1] = `${Math.round(g.x * r)},${Math.round(g.y * r)},${Math.round(g.z * r)}`),
          (h[2] = `${Math.round(m.x * r)},${Math.round(m.y * r)},${Math.round(m.z * r)}`),
          !(h[0] === h[1] || h[1] === h[2] || h[2] === h[0]))
        )
          for (let y = 0; y < 3; y++) {
            const C = (y + 1) % 3,
              E = h[y],
              w = h[C],
              S = Uo[c[y]],
              k = Uo[c[C]],
              x = `${E}_${w}`,
              T = `${w}_${E}`;
            T in d && d[T]
              ? (Jl.dot(d[T].normal) <= s &&
                  (u.push(S.x, S.y, S.z), u.push(k.x, k.y, k.z)),
                (d[T] = null))
              : x in d ||
                (d[x] = { index0: l[y], index1: l[C], normal: Jl.clone() });
          }
      }
      for (const p in d)
        if (d[p]) {
          const { index0: v, index1: g } = d[p];
          (Oo.fromBufferAttribute(o, v),
            Ho.fromBufferAttribute(o, g),
            u.push(Oo.x, Oo.y, Oo.z),
            u.push(Ho.x, Ho.y, Ho.z));
        }
      this.setAttribute("position", new Ke(u, 3));
    }
  }
  copy(e) {
    return (
      super.copy(e),
      (this.parameters = Object.assign({}, e.parameters)),
      this
    );
  }
}

class br {
  constructor() {
    ((this.type = "Curve"),
      (this.arcLengthDivisions = 200),
      (this.needsUpdate = !1),
      (this.cacheArcLengths = null));
  }
  getPoint() {
    it("Curve: .getPoint() not implemented.");
  }
  getPointAt(e, t) {
    const n = this.getUtoTmapping(e);
    return this.getPoint(n, t);
  }
  getPoints(e = 5) {
    const t = [];
    for (let n = 0; n <= e; n++) t.push(this.getPoint(n / e));
    return t;
  }
  getSpacedPoints(e = 5) {
    const t = [];
    for (let n = 0; n <= e; n++) t.push(this.getPointAt(n / e));
    return t;
  }
  getLength() {
    const e = this.getLengths();
    return e[e.length - 1];
  }
  getLengths(e = this.arcLengthDivisions) {
    if (
      this.cacheArcLengths &&
      this.cacheArcLengths.length === e + 1 &&
      !this.needsUpdate
    )
      return this.cacheArcLengths;
    this.needsUpdate = !1;
    const t = [];
    let n,
      r = this.getPoint(0),
      s = 0;
    t.push(0);
    for (let a = 1; a <= e; a++)
      ((n = this.getPoint(a / e)), (s += n.distanceTo(r)), t.push(s), (r = n));
    return ((this.cacheArcLengths = t), t);
  }
  updateArcLengths() {
    ((this.needsUpdate = !0), this.getLengths());
  }
  getUtoTmapping(e, t = null) {
    const n = this.getLengths();
    let r = 0;
    const s = n.length;
    let a;
    t ? (a = t) : (a = e * n[s - 1]);
    let o = 0,
      A = s - 1,
      l;
    for (; o <= A; )
      if (((r = Math.floor(o + (A - o) / 2)), (l = n[r] - a), l < 0)) o = r + 1;
      else if (l > 0) A = r - 1;
      else {
        A = r;
        break;
      }
    if (((r = A), n[r] === a)) return r / (s - 1);
    const c = n[r],
      d = n[r + 1] - c,
      u = (a - c) / d;
    return (r + u) / (s - 1);
  }
  getTangent(e, t) {
    let r = e - 1e-4,
      s = e + 1e-4;
    (r < 0 && (r = 0), s > 1 && (s = 1));
    const a = this.getPoint(r),
      o = this.getPoint(s),
      A = t || (a.isVector2 ? new Ae() : new F());
    return (A.copy(o).sub(a).normalize(), A);
  }
  getTangentAt(e, t) {
    const n = this.getUtoTmapping(e);
    return this.getTangent(n, t);
  }
  computeFrenetFrames(e, t = !1) {
    const n = new F(),
      r = [],
      s = [],
      a = [],
      o = new F(),
      A = new mt();
    for (let u = 0; u <= e; u++) {
      const p = u / e;
      r[u] = this.getTangentAt(p, new F());
    }
    ((s[0] = new F()), (a[0] = new F()));
    let l = Number.MAX_VALUE;
    const c = Math.abs(r[0].x),
      h = Math.abs(r[0].y),
      d = Math.abs(r[0].z);
    (c <= l && ((l = c), n.set(1, 0, 0)),
      h <= l && ((l = h), n.set(0, 1, 0)),
      d <= l && n.set(0, 0, 1),
      o.crossVectors(r[0], n).normalize(),
      s[0].crossVectors(r[0], o),
      a[0].crossVectors(r[0], s[0]));
    for (let u = 1; u <= e; u++) {
      if (
        ((s[u] = s[u - 1].clone()),
        (a[u] = a[u - 1].clone()),
        o.crossVectors(r[u - 1], r[u]),
        o.length() > Number.EPSILON)
      ) {
        o.normalize();
        const p = Math.acos(xt(r[u - 1].dot(r[u]), -1, 1));
        s[u].applyMatrix4(A.makeRotationAxis(o, p));
      }
      a[u].crossVectors(r[u], s[u]);
    }
    if (t === !0) {
      let u = Math.acos(xt(s[0].dot(s[e]), -1, 1));
      ((u /= e), r[0].dot(o.crossVectors(s[0], s[e])) > 0 && (u = -u));
      for (let p = 1; p <= e; p++)
        (s[p].applyMatrix4(A.makeRotationAxis(r[p], u * p)),
          a[p].crossVectors(r[p], s[p]));
    }
    return { tangents: r, normals: s, binormals: a };
  }
  clone() {
    return new this.constructor().copy(this);
  }
  copy(e) {
    return ((this.arcLengthDivisions = e.arcLengthDivisions), this);
  }
  toJSON() {
    const e = {
      metadata: { version: 4.7, type: "Curve", generator: "Curve.toJSON" },
    };
    return (
      (e.arcLengthDivisions = this.arcLengthDivisions),
      (e.type = this.type),
      e
    );
  }
  fromJSON(e) {
    return ((this.arcLengthDivisions = e.arcLengthDivisions), this);
  }
}

class wd extends br {
  constructor(
    e = 0,
    t = 0,
    n = 1,
    r = 1,
    s = 0,
    a = Math.PI * 2,
    o = !1,
    A = 0,
  ) {
    (super(),
      (this.isEllipseCurve = !0),
      (this.type = "EllipseCurve"),
      (this.aX = e),
      (this.aY = t),
      (this.xRadius = n),
      (this.yRadius = r),
      (this.aStartAngle = s),
      (this.aEndAngle = a),
      (this.aClockwise = o),
      (this.aRotation = A));
  }
  getPoint(e, t = new Ae()) {
    const n = t,
      r = Math.PI * 2;
    let s = this.aEndAngle - this.aStartAngle;
    const a = Math.abs(s) < Number.EPSILON;
    for (; s < 0; ) s += r;
    for (; s > r; ) s -= r;
    (s < Number.EPSILON && (a ? (s = 0) : (s = r)),
      this.aClockwise === !0 && !a && (s === r ? (s = -r) : (s = s - r)));
    const o = this.aStartAngle + e * s;
    let A = this.aX + this.xRadius * Math.cos(o),
      l = this.aY + this.yRadius * Math.sin(o);
    if (this.aRotation !== 0) {
      const c = Math.cos(this.aRotation),
        h = Math.sin(this.aRotation),
        d = A - this.aX,
        u = l - this.aY;
      ((A = d * c - u * h + this.aX), (l = d * h + u * c + this.aY));
    }
    return n.set(A, l);
  }
  copy(e) {
    return (
      super.copy(e),
      (this.aX = e.aX),
      (this.aY = e.aY),
      (this.xRadius = e.xRadius),
      (this.yRadius = e.yRadius),
      (this.aStartAngle = e.aStartAngle),
      (this.aEndAngle = e.aEndAngle),
      (this.aClockwise = e.aClockwise),
      (this.aRotation = e.aRotation),
      this
    );
  }
  toJSON() {
    const e = super.toJSON();
    return (
      (e.aX = this.aX),
      (e.aY = this.aY),
      (e.xRadius = this.xRadius),
      (e.yRadius = this.yRadius),
      (e.aStartAngle = this.aStartAngle),
      (e.aEndAngle = this.aEndAngle),
      (e.aClockwise = this.aClockwise),
      (e.aRotation = this.aRotation),
      e
    );
  }
  fromJSON(e) {
    return (
      super.fromJSON(e),
      (this.aX = e.aX),
      (this.aY = e.aY),
      (this.xRadius = e.xRadius),
      (this.yRadius = e.yRadius),
      (this.aStartAngle = e.aStartAngle),
      (this.aEndAngle = e.aEndAngle),
      (this.aClockwise = e.aClockwise),
      (this.aRotation = e.aRotation),
      this
    );
  }
}

class Qv extends wd {
  constructor(e, t, n, r, s, a) {
    (super(e, t, n, n, r, s, a),
      (this.isArcCurve = !0),
      (this.type = "ArcCurve"));
  }
}

function Md() {
  let i = 0,
    e = 0,
    t = 0,
    n = 0;
  function r(s, a, o, A) {
    ((i = s),
      (e = o),
      (t = -3 * s + 3 * a - 2 * o - A),
      (n = 2 * s - 2 * a + o + A));
  }
  return {
    initCatmullRom: function (s, a, o, A, l) {
      r(a, o, l * (o - s), l * (A - a));
    },
    initNonuniformCatmullRom: function (s, a, o, A, l, c, h) {
      let d = (a - s) / l - (o - s) / (l + c) + (o - a) / c,
        u = (o - a) / c - (A - a) / (c + h) + (A - o) / h;
      ((d *= c), (u *= c), r(a, o, d, u));
    },
    calc: function (s) {
      const a = s * s,
        o = a * s;
      return i + e * s + t * a + n * o;
    },
  };
}

const qu = new F();

const $u = new F();

const Kl = new Md();

const Yl = new Md();

const Zl = new Md();

class Bd extends br {
  constructor(e = [], t = !1, n = "centripetal", r = 0.5) {
    (super(),
      (this.isCatmullRomCurve3 = !0),
      (this.type = "CatmullRomCurve3"),
      (this.points = e),
      (this.closed = t),
      (this.curveType = n),
      (this.tension = r));
  }
  getPoint(e, t = new F()) {
    const n = t,
      r = this.points,
      s = r.length,
      a = (s - (this.closed ? 0 : 1)) * e;
    let o = Math.floor(a),
      A = a - o;
    this.closed
      ? (o += o > 0 ? 0 : (Math.floor(Math.abs(o) / s) + 1) * s)
      : A === 0 && o === s - 1 && ((o = s - 2), (A = 1));
    let l, c;
    this.closed || o > 0
      ? (l = r[(o - 1) % s])
      : ($u.subVectors(r[0], r[1]).add(r[0]), (l = $u));
    const h = r[o % s],
      d = r[(o + 1) % s];
    if (
      (this.closed || o + 2 < s
        ? (c = r[(o + 2) % s])
        : (qu.subVectors(r[s - 1], r[s - 2]).add(r[s - 1]), (c = qu)),
      this.curveType === "centripetal" || this.curveType === "chordal")
    ) {
      const u = this.curveType === "chordal" ? 0.5 : 0.25;
      let p = Math.pow(l.distanceToSquared(h), u),
        v = Math.pow(h.distanceToSquared(d), u),
        g = Math.pow(d.distanceToSquared(c), u);
      (v < 1e-4 && (v = 1),
        p < 1e-4 && (p = v),
        g < 1e-4 && (g = v),
        Kl.initNonuniformCatmullRom(l.x, h.x, d.x, c.x, p, v, g),
        Yl.initNonuniformCatmullRom(l.y, h.y, d.y, c.y, p, v, g),
        Zl.initNonuniformCatmullRom(l.z, h.z, d.z, c.z, p, v, g));
    } else
      this.curveType === "catmullrom" &&
        (Kl.initCatmullRom(l.x, h.x, d.x, c.x, this.tension),
        Yl.initCatmullRom(l.y, h.y, d.y, c.y, this.tension),
        Zl.initCatmullRom(l.z, h.z, d.z, c.z, this.tension));
    return (n.set(Kl.calc(A), Yl.calc(A), Zl.calc(A)), n);
  }
  copy(e) {
    (super.copy(e), (this.points = []));
    for (let t = 0, n = e.points.length; t < n; t++) {
      const r = e.points[t];
      this.points.push(r.clone());
    }
    return (
      (this.closed = e.closed),
      (this.curveType = e.curveType),
      (this.tension = e.tension),
      this
    );
  }
  toJSON() {
    const e = super.toJSON();
    e.points = [];
    for (let t = 0, n = this.points.length; t < n; t++) {
      const r = this.points[t];
      e.points.push(r.toArray());
    }
    return (
      (e.closed = this.closed),
      (e.curveType = this.curveType),
      (e.tension = this.tension),
      e
    );
  }
  fromJSON(e) {
    (super.fromJSON(e), (this.points = []));
    for (let t = 0, n = e.points.length; t < n; t++) {
      const r = e.points[t];
      this.points.push(new F().fromArray(r));
    }
    return (
      (this.closed = e.closed),
      (this.curveType = e.curveType),
      (this.tension = e.tension),
      this
    );
  }
}

function zu(i, e, t, n, r) {
  const s = (n - e) * 0.5,
    a = (r - t) * 0.5,
    o = i * i,
    A = i * o;
  return (
    (2 * t - 2 * n + s + a) * A + (-3 * t + 3 * n - 2 * s - a) * o + s * i + t
  );
}

function ej(i, e) {
  const t = 1 - i;
  return t * t * e;
}

function tj(i, e) {
  return 2 * (1 - i) * i * e;
}

function nj(i, e) {
  return i * i * e;
}

function Ra(i, e, t, n) {
  return ej(i, e) + tj(i, t) + nj(i, n);
}

function rj(i, e) {
  const t = 1 - i;
  return t * t * t * e;
}

function ij(i, e) {
  const t = 1 - i;
  return 3 * t * t * i * e;
}

function sj(i, e) {
  return 3 * (1 - i) * i * i * e;
}

function aj(i, e) {
  return i * i * i * e;
}

function Pa(i, e, t, n, r) {
  return rj(i, e) + ij(i, t) + sj(i, n) + aj(i, r);
}

class Gm extends br {
  constructor(e = new Ae(), t = new Ae(), n = new Ae(), r = new Ae()) {
    (super(),
      (this.isCubicBezierCurve = !0),
      (this.type = "CubicBezierCurve"),
      (this.v0 = e),
      (this.v1 = t),
      (this.v2 = n),
      (this.v3 = r));
  }
  getPoint(e, t = new Ae()) {
    const n = t,
      r = this.v0,
      s = this.v1,
      a = this.v2,
      o = this.v3;
    return (n.set(Pa(e, r.x, s.x, a.x, o.x), Pa(e, r.y, s.y, a.y, o.y)), n);
  }
  copy(e) {
    return (
      super.copy(e),
      this.v0.copy(e.v0),
      this.v1.copy(e.v1),
      this.v2.copy(e.v2),
      this.v3.copy(e.v3),
      this
    );
  }
  toJSON() {
    const e = super.toJSON();
    return (
      (e.v0 = this.v0.toArray()),
      (e.v1 = this.v1.toArray()),
      (e.v2 = this.v2.toArray()),
      (e.v3 = this.v3.toArray()),
      e
    );
  }
  fromJSON(e) {
    return (
      super.fromJSON(e),
      this.v0.fromArray(e.v0),
      this.v1.fromArray(e.v1),
      this.v2.fromArray(e.v2),
      this.v3.fromArray(e.v3),
      this
    );
  }
}

class oj extends br {
  constructor(e = new F(), t = new F(), n = new F(), r = new F()) {
    (super(),
      (this.isCubicBezierCurve3 = !0),
      (this.type = "CubicBezierCurve3"),
      (this.v0 = e),
      (this.v1 = t),
      (this.v2 = n),
      (this.v3 = r));
  }
  getPoint(e, t = new F()) {
    const n = t,
      r = this.v0,
      s = this.v1,
      a = this.v2,
      o = this.v3;
    return (
      n.set(
        Pa(e, r.x, s.x, a.x, o.x),
        Pa(e, r.y, s.y, a.y, o.y),
        Pa(e, r.z, s.z, a.z, o.z),
      ),
      n
    );
  }
  copy(e) {
    return (
      super.copy(e),
      this.v0.copy(e.v0),
      this.v1.copy(e.v1),
      this.v2.copy(e.v2),
      this.v3.copy(e.v3),
      this
    );
  }
  toJSON() {
    const e = super.toJSON();
    return (
      (e.v0 = this.v0.toArray()),
      (e.v1 = this.v1.toArray()),
      (e.v2 = this.v2.toArray()),
      (e.v3 = this.v3.toArray()),
      e
    );
  }
  fromJSON(e) {
    return (
      super.fromJSON(e),
      this.v0.fromArray(e.v0),
      this.v1.fromArray(e.v1),
      this.v2.fromArray(e.v2),
      this.v3.fromArray(e.v3),
      this
    );
  }
}

class Om extends br {
  constructor(e = new Ae(), t = new Ae()) {
    (super(),
      (this.isLineCurve = !0),
      (this.type = "LineCurve"),
      (this.v1 = e),
      (this.v2 = t));
  }
  getPoint(e, t = new Ae()) {
    const n = t;
    return (
      e === 1
        ? n.copy(this.v2)
        : (n.copy(this.v2).sub(this.v1), n.multiplyScalar(e).add(this.v1)),
      n
    );
  }
  getPointAt(e, t) {
    return this.getPoint(e, t);
  }
  getTangent(e, t = new Ae()) {
    return t.subVectors(this.v2, this.v1).normalize();
  }
  getTangentAt(e, t) {
    return this.getTangent(e, t);
  }
  copy(e) {
    return (super.copy(e), this.v1.copy(e.v1), this.v2.copy(e.v2), this);
  }
  toJSON() {
    const e = super.toJSON();
    return ((e.v1 = this.v1.toArray()), (e.v2 = this.v2.toArray()), e);
  }
  fromJSON(e) {
    return (
      super.fromJSON(e),
      this.v1.fromArray(e.v1),
      this.v2.fromArray(e.v2),
      this
    );
  }
}

class Hm extends br {
  constructor(e = new F(), t = new F()) {
    (super(),
      (this.isLineCurve3 = !0),
      (this.type = "LineCurve3"),
      (this.v1 = e),
      (this.v2 = t));
  }
  getPoint(e, t = new F()) {
    const n = t;
    return (
      e === 1
        ? n.copy(this.v2)
        : (n.copy(this.v2).sub(this.v1), n.multiplyScalar(e).add(this.v1)),
      n
    );
  }
  getPointAt(e, t) {
    return this.getPoint(e, t);
  }
  getTangent(e, t = new F()) {
    return t.subVectors(this.v2, this.v1).normalize();
  }
  getTangentAt(e, t) {
    return this.getTangent(e, t);
  }
  copy(e) {
    return (super.copy(e), this.v1.copy(e.v1), this.v2.copy(e.v2), this);
  }
  toJSON() {
    const e = super.toJSON();
    return ((e.v1 = this.v1.toArray()), (e.v2 = this.v2.toArray()), e);
  }
  fromJSON(e) {
    return (
      super.fromJSON(e),
      this.v1.fromArray(e.v1),
      this.v2.fromArray(e.v2),
      this
    );
  }
}

class Um extends br {
  constructor(e = new Ae(), t = new Ae(), n = new Ae()) {
    (super(),
      (this.isQuadraticBezierCurve = !0),
      (this.type = "QuadraticBezierCurve"),
      (this.v0 = e),
      (this.v1 = t),
      (this.v2 = n));
  }
  getPoint(e, t = new Ae()) {
    const n = t,
      r = this.v0,
      s = this.v1,
      a = this.v2;
    return (n.set(Ra(e, r.x, s.x, a.x), Ra(e, r.y, s.y, a.y)), n);
  }
  copy(e) {
    return (
      super.copy(e),
      this.v0.copy(e.v0),
      this.v1.copy(e.v1),
      this.v2.copy(e.v2),
      this
    );
  }
  toJSON() {
    const e = super.toJSON();
    return (
      (e.v0 = this.v0.toArray()),
      (e.v1 = this.v1.toArray()),
      (e.v2 = this.v2.toArray()),
      e
    );
  }
  fromJSON(e) {
    return (
      super.fromJSON(e),
      this.v0.fromArray(e.v0),
      this.v1.fromArray(e.v1),
      this.v2.fromArray(e.v2),
      this
    );
  }
}

class qm extends br {
  constructor(e = new F(), t = new F(), n = new F()) {
    (super(),
      (this.isQuadraticBezierCurve3 = !0),
      (this.type = "QuadraticBezierCurve3"),
      (this.v0 = e),
      (this.v1 = t),
      (this.v2 = n));
  }
  getPoint(e, t = new F()) {
    const n = t,
      r = this.v0,
      s = this.v1,
      a = this.v2;
    return (
      n.set(Ra(e, r.x, s.x, a.x), Ra(e, r.y, s.y, a.y), Ra(e, r.z, s.z, a.z)),
      n
    );
  }
  copy(e) {
    return (
      super.copy(e),
      this.v0.copy(e.v0),
      this.v1.copy(e.v1),
      this.v2.copy(e.v2),
      this
    );
  }
  toJSON() {
    const e = super.toJSON();
    return (
      (e.v0 = this.v0.toArray()),
      (e.v1 = this.v1.toArray()),
      (e.v2 = this.v2.toArray()),
      e
    );
  }
  fromJSON(e) {
    return (
      super.fromJSON(e),
      this.v0.fromArray(e.v0),
      this.v1.fromArray(e.v1),
      this.v2.fromArray(e.v2),
      this
    );
  }
}

class $m extends br {
  constructor(e = []) {
    (super(),
      (this.isSplineCurve = !0),
      (this.type = "SplineCurve"),
      (this.points = e));
  }
  getPoint(e, t = new Ae()) {
    const n = t,
      r = this.points,
      s = (r.length - 1) * e,
      a = Math.floor(s),
      o = s - a,
      A = r[a === 0 ? a : a - 1],
      l = r[a],
      c = r[a > r.length - 2 ? r.length - 1 : a + 1],
      h = r[a > r.length - 3 ? r.length - 1 : a + 2];
    return (n.set(zu(o, A.x, l.x, c.x, h.x), zu(o, A.y, l.y, c.y, h.y)), n);
  }
  copy(e) {
    (super.copy(e), (this.points = []));
    for (let t = 0, n = e.points.length; t < n; t++) {
      const r = e.points[t];
      this.points.push(r.clone());
    }
    return this;
  }
  toJSON() {
    const e = super.toJSON();
    e.points = [];
    for (let t = 0, n = this.points.length; t < n; t++) {
      const r = this.points[t];
      e.points.push(r.toArray());
    }
    return e;
  }
  fromJSON(e) {
    (super.fromJSON(e), (this.points = []));
    for (let t = 0, n = e.points.length; t < n; t++) {
      const r = e.points[t];
      this.points.push(new Ae().fromArray(r));
    }
    return this;
  }
}

var FA = Object.freeze({
  __proto__: null,
  ArcCurve: Qv,
  CatmullRomCurve3: Bd,
  CubicBezierCurve: Gm,
  CubicBezierCurve3: oj,
  EllipseCurve: wd,
  LineCurve: Om,
  LineCurve3: Hm,
  QuadraticBezierCurve: Um,
  QuadraticBezierCurve3: qm,
  SplineCurve: $m,
});

class zm extends br {
  constructor() {
    (super(),
      (this.type = "CurvePath"),
      (this.curves = []),
      (this.autoClose = !1));
  }
  add(e) {
    this.curves.push(e);
  }
  closePath() {
    const e = this.curves[0].getPoint(0),
      t = this.curves[this.curves.length - 1].getPoint(1);
    if (!e.equals(t)) {
      const n = e.isVector2 === !0 ? "LineCurve" : "LineCurve3";
      this.curves.push(new FA[n](t, e));
    }
    return this;
  }
  getPoint(e, t) {
    const n = e * this.getLength(),
      r = this.getCurveLengths();
    let s = 0;
    for (; s < r.length; ) {
      if (r[s] >= n) {
        const a = r[s] - n,
          o = this.curves[s],
          A = o.getLength(),
          l = A === 0 ? 0 : 1 - a / A;
        return o.getPointAt(l, t);
      }
      s++;
    }
    return null;
  }
  getLength() {
    const e = this.getCurveLengths();
    return e[e.length - 1];
  }
  updateArcLengths() {
    ((this.needsUpdate = !0),
      (this.cacheLengths = null),
      this.getCurveLengths());
  }
  getCurveLengths() {
    if (this.cacheLengths && this.cacheLengths.length === this.curves.length)
      return this.cacheLengths;
    const e = [];
    let t = 0;
    for (let n = 0, r = this.curves.length; n < r; n++)
      ((t += this.curves[n].getLength()), e.push(t));
    return ((this.cacheLengths = e), e);
  }
  getSpacedPoints(e = 40) {
    const t = [];
    for (let n = 0; n <= e; n++) t.push(this.getPoint(n / e));
    return (this.autoClose && t.push(t[0]), t);
  }
  getPoints(e = 12) {
    const t = [];
    let n;
    for (let r = 0, s = this.curves; r < s.length; r++) {
      const a = s[r],
        o = a.isEllipseCurve
          ? e * 2
          : a.isLineCurve || a.isLineCurve3
            ? 1
            : a.isSplineCurve
              ? e * a.points.length
              : e,
        A = a.getPoints(o);
      for (let l = 0; l < A.length; l++) {
        const c = A[l];
        (n && n.equals(c)) || (t.push(c), (n = c));
      }
    }
    return (
      this.autoClose &&
        t.length > 1 &&
        !t[t.length - 1].equals(t[0]) &&
        t.push(t[0]),
      t
    );
  }
  copy(e) {
    (super.copy(e), (this.curves = []));
    for (let t = 0, n = e.curves.length; t < n; t++) {
      const r = e.curves[t];
      this.curves.push(r.clone());
    }
    return ((this.autoClose = e.autoClose), this);
  }
  toJSON() {
    const e = super.toJSON();
    ((e.autoClose = this.autoClose), (e.curves = []));
    for (let t = 0, n = this.curves.length; t < n; t++) {
      const r = this.curves[t];
      e.curves.push(r.toJSON());
    }
    return e;
  }
  fromJSON(e) {
    (super.fromJSON(e), (this.autoClose = e.autoClose), (this.curves = []));
    for (let t = 0, n = e.curves.length; t < n; t++) {
      const r = e.curves[t];
      this.curves.push(new FA[r.type]().fromJSON(r));
    }
    return this;
  }
}

class Vu extends zm {
  constructor(e) {
    (super(),
      (this.type = "Path"),
      (this.currentPoint = new Ae()),
      e && this.setFromPoints(e));
  }
  setFromPoints(e) {
    this.moveTo(e[0].x, e[0].y);
    for (let t = 1, n = e.length; t < n; t++) this.lineTo(e[t].x, e[t].y);
    return this;
  }
  moveTo(e, t) {
    return (this.currentPoint.set(e, t), this);
  }
  lineTo(e, t) {
    const n = new Om(this.currentPoint.clone(), new Ae(e, t));
    return (this.curves.push(n), this.currentPoint.set(e, t), this);
  }
  quadraticCurveTo(e, t, n, r) {
    const s = new Um(this.currentPoint.clone(), new Ae(e, t), new Ae(n, r));
    return (this.curves.push(s), this.currentPoint.set(n, r), this);
  }
  bezierCurveTo(e, t, n, r, s, a) {
    const o = new Gm(
      this.currentPoint.clone(),
      new Ae(e, t),
      new Ae(n, r),
      new Ae(s, a),
    );
    return (this.curves.push(o), this.currentPoint.set(s, a), this);
  }
  splineThru(e) {
    const t = [this.currentPoint.clone()].concat(e),
      n = new $m(t);
    return (this.curves.push(n), this.currentPoint.copy(e[e.length - 1]), this);
  }
  arc(e, t, n, r, s, a) {
    const o = this.currentPoint.x,
      A = this.currentPoint.y;
    return (this.absarc(e + o, t + A, n, r, s, a), this);
  }
  absarc(e, t, n, r, s, a) {
    return (this.absellipse(e, t, n, n, r, s, a), this);
  }
  ellipse(e, t, n, r, s, a, o, A) {
    const l = this.currentPoint.x,
      c = this.currentPoint.y;
    return (this.absellipse(e + l, t + c, n, r, s, a, o, A), this);
  }
  absellipse(e, t, n, r, s, a, o, A) {
    const l = new wd(e, t, n, r, s, a, o, A);
    if (this.curves.length > 0) {
      const h = l.getPoint(0);
      h.equals(this.currentPoint) || this.lineTo(h.x, h.y);
    }
    this.curves.push(l);
    const c = l.getPoint(1);
    return (this.currentPoint.copy(c), this);
  }
  copy(e) {
    return (super.copy(e), this.currentPoint.copy(e.currentPoint), this);
  }
  toJSON() {
    const e = super.toJSON();
    return ((e.currentPoint = this.currentPoint.toArray()), e);
  }
  fromJSON(e) {
    return (
      super.fromJSON(e),
      this.currentPoint.fromArray(e.currentPoint),
      this
    );
  }
}

class il extends Vu {
  constructor(e) {
    (super(e), (this.uuid = Un()), (this.type = "Shape"), (this.holes = []));
  }
  getPointsHoles(e) {
    const t = [];
    for (let n = 0, r = this.holes.length; n < r; n++)
      t[n] = this.holes[n].getPoints(e);
    return t;
  }
  extractPoints(e) {
    return { shape: this.getPoints(e), holes: this.getPointsHoles(e) };
  }
  copy(e) {
    (super.copy(e), (this.holes = []));
    for (let t = 0, n = e.holes.length; t < n; t++) {
      const r = e.holes[t];
      this.holes.push(r.clone());
    }
    return this;
  }
  toJSON() {
    const e = super.toJSON();
    ((e.uuid = this.uuid), (e.holes = []));
    for (let t = 0, n = this.holes.length; t < n; t++) {
      const r = this.holes[t];
      e.holes.push(r.toJSON());
    }
    return e;
  }
  fromJSON(e) {
    (super.fromJSON(e), (this.uuid = e.uuid), (this.holes = []));
    for (let t = 0, n = e.holes.length; t < n; t++) {
      const r = e.holes[t];
      this.holes.push(new Vu().fromJSON(r));
    }
    return this;
  }
}

function Aj(i, e, t = 2) {
  const n = e && e.length,
    r = n ? e[0] * t : i.length;
  let s = Vm(i, 0, r, t, !0);
  const a = [];
  if (!s || s.next === s.prev) return a;
  let o, A, l;
  if ((n && (s = uj(i, e, s, t)), i.length > 80 * t)) {
    ((o = i[0]), (A = i[1]));
    let c = o,
      h = A;
    for (let d = t; d < r; d += t) {
      const u = i[d],
        p = i[d + 1];
      (u < o && (o = u), p < A && (A = p), u > c && (c = u), p > h && (h = p));
    }
    ((l = Math.max(c - o, h - A)), (l = l !== 0 ? 32767 / l : 0));
  }
  return (Xa(s, a, t, o, A, l, 0), a);
}

function Vm(i, e, t, n, r) {
  let s;
  if (r === Cj(i, e, t, n) > 0)
    for (let a = e; a < t; a += n) s = Wu((a / n) | 0, i[a], i[a + 1], s);
  else
    for (let a = t - n; a >= e; a -= n) s = Wu((a / n) | 0, i[a], i[a + 1], s);
  return (s && Os(s, s.next) && (Ka(s), (s = s.next)), s);
}

function $i(i, e) {
  if (!i) return i;
  e || (e = i);
  let t = i,
    n;
  do
    if (
      ((n = !1), !t.steiner && (Os(t, t.next) || $t(t.prev, t, t.next) === 0))
    ) {
      if ((Ka(t), (t = e = t.prev), t === t.next)) break;
      n = !0;
    } else t = t.next;
  while (n || t !== e);
  return e;
}

function Xa(i, e, t, n, r, s, a) {
  if (!i) return;
  !a && s && vj(i, n, r, s);
  let o = i;
  for (; i.prev !== i.next; ) {
    const A = i.prev,
      l = i.next;
    if (s ? cj(i, n, r, s) : lj(i)) {
      (e.push(A.i, i.i, l.i), Ka(i), (i = l.next), (o = l.next));
      continue;
    }
    if (((i = l), i === o)) {
      a
        ? a === 1
          ? ((i = hj($i(i), e)), Xa(i, e, t, n, r, s, 2))
          : a === 2 && dj(i, e, t, n, r, s)
        : Xa($i(i), e, t, n, r, s, 1);
      break;
    }
  }
}

function lj(i) {
  const e = i.prev,
    t = i,
    n = i.next;
  if ($t(e, t, n) >= 0) return !1;
  const r = e.x,
    s = t.x,
    a = n.x,
    o = e.y,
    A = t.y,
    l = n.y,
    c = Math.min(r, s, a),
    h = Math.min(o, A, l),
    d = Math.max(r, s, a),
    u = Math.max(o, A, l);
  let p = n.next;
  for (; p !== e; ) {
    if (
      p.x >= c &&
      p.x <= d &&
      p.y >= h &&
      p.y <= u &&
      Sa(r, o, s, A, a, l, p.x, p.y) &&
      $t(p.prev, p, p.next) >= 0
    )
      return !1;
    p = p.next;
  }
  return !0;
}

function cj(i, e, t, n) {
  const r = i.prev,
    s = i,
    a = i.next;
  if ($t(r, s, a) >= 0) return !1;
  const o = r.x,
    A = s.x,
    l = a.x,
    c = r.y,
    h = s.y,
    d = a.y,
    u = Math.min(o, A, l),
    p = Math.min(c, h, d),
    v = Math.max(o, A, l),
    g = Math.max(c, h, d),
    m = Mh(u, p, e, t, n),
    y = Mh(v, g, e, t, n);
  let C = i.prevZ,
    E = i.nextZ;
  for (; C && C.z >= m && E && E.z <= y; ) {
    if (
      (C.x >= u &&
        C.x <= v &&
        C.y >= p &&
        C.y <= g &&
        C !== r &&
        C !== a &&
        Sa(o, c, A, h, l, d, C.x, C.y) &&
        $t(C.prev, C, C.next) >= 0) ||
      ((C = C.prevZ),
      E.x >= u &&
        E.x <= v &&
        E.y >= p &&
        E.y <= g &&
        E !== r &&
        E !== a &&
        Sa(o, c, A, h, l, d, E.x, E.y) &&
        $t(E.prev, E, E.next) >= 0)
    )
      return !1;
    E = E.nextZ;
  }
  for (; C && C.z >= m; ) {
    if (
      C.x >= u &&
      C.x <= v &&
      C.y >= p &&
      C.y <= g &&
      C !== r &&
      C !== a &&
      Sa(o, c, A, h, l, d, C.x, C.y) &&
      $t(C.prev, C, C.next) >= 0
    )
      return !1;
    C = C.prevZ;
  }
  for (; E && E.z <= y; ) {
    if (
      E.x >= u &&
      E.x <= v &&
      E.y >= p &&
      E.y <= g &&
      E !== r &&
      E !== a &&
      Sa(o, c, A, h, l, d, E.x, E.y) &&
      $t(E.prev, E, E.next) >= 0
    )
      return !1;
    E = E.nextZ;
  }
  return !0;
}

function hj(i, e) {
  let t = i;
  do {
    const n = t.prev,
      r = t.next.next;
    (!Os(n, r) &&
      Xm(n, t, t.next, r) &&
      Ja(n, r) &&
      Ja(r, n) &&
      (e.push(n.i, t.i, r.i), Ka(t), Ka(t.next), (t = i = r)),
      (t = t.next));
  } while (t !== i);
  return $i(t);
}

function dj(i, e, t, n, r, s) {
  let a = i;
  do {
    let o = a.next.next;
    for (; o !== a.prev; ) {
      if (a.i !== o.i && Ej(a, o)) {
        let A = Jm(a, o);
        ((a = $i(a, a.next)),
          (A = $i(A, A.next)),
          Xa(a, e, t, n, r, s, 0),
          Xa(A, e, t, n, r, s, 0));
        return;
      }
      o = o.next;
    }
    a = a.next;
  } while (a !== i);
}

function uj(i, e, t, n) {
  const r = [];
  for (let s = 0, a = e.length; s < a; s++) {
    const o = e[s] * n,
      A = s < a - 1 ? e[s + 1] * n : i.length,
      l = Vm(i, o, A, n, !1);
    (l === l.next && (l.steiner = !0), r.push(_j(l)));
  }
  r.sort(fj);
  for (let s = 0; s < r.length; s++) t = pj(r[s], t);
  return t;
}

function fj(i, e) {
  let t = i.x - e.x;
  if (t === 0 && ((t = i.y - e.y), t === 0)) {
    const n = (i.next.y - i.y) / (i.next.x - i.x),
      r = (e.next.y - e.y) / (e.next.x - e.x);
    t = n - r;
  }
  return t;
}

function pj(i, e) {
  const t = mj(i, e);
  if (!t) return e;
  const n = Jm(t, i);
  return ($i(n, n.next), $i(t, t.next));
}

function mj(i, e) {
  let t = e;
  const n = i.x,
    r = i.y;
  let s = -1 / 0,
    a;
  if (Os(i, t)) return t;
  do {
    if (Os(i, t.next)) return t.next;
    if (r <= t.y && r >= t.next.y && t.next.y !== t.y) {
      const h = t.x + ((r - t.y) * (t.next.x - t.x)) / (t.next.y - t.y);
      if (
        h <= n &&
        h > s &&
        ((s = h), (a = t.x < t.next.x ? t : t.next), h === n)
      )
        return a;
    }
    t = t.next;
  } while (t !== e);
  if (!a) return null;
  const o = a,
    A = a.x,
    l = a.y;
  let c = 1 / 0;
  t = a;
  do {
    if (
      n >= t.x &&
      t.x >= A &&
      n !== t.x &&
      Wm(r < l ? n : s, r, A, l, r < l ? s : n, r, t.x, t.y)
    ) {
      const h = Math.abs(r - t.y) / (n - t.x);
      Ja(t, i) &&
        (h < c || (h === c && (t.x > a.x || (t.x === a.x && gj(a, t))))) &&
        ((a = t), (c = h));
    }
    t = t.next;
  } while (t !== o);
  return a;
}

function gj(i, e) {
  return $t(i.prev, i, e.prev) < 0 && $t(e.next, i, i.next) < 0;
}

function vj(i, e, t, n) {
  let r = i;
  do
    (r.z === 0 && (r.z = Mh(r.x, r.y, e, t, n)),
      (r.prevZ = r.prev),
      (r.nextZ = r.next),
      (r = r.next));
  while (r !== i);
  ((r.prevZ.nextZ = null), (r.prevZ = null), jj(r));
}

function jj(i) {
  let e,
    t = 1;
  do {
    let n = i,
      r;
    i = null;
    let s = null;
    for (e = 0; n; ) {
      e++;
      let a = n,
        o = 0;
      for (let l = 0; l < t && (o++, (a = a.nextZ), !!a); l++);
      let A = t;
      for (; o > 0 || (A > 0 && a); )
        (o !== 0 && (A === 0 || !a || n.z <= a.z)
          ? ((r = n), (n = n.nextZ), o--)
          : ((r = a), (a = a.nextZ), A--),
          s ? (s.nextZ = r) : (i = r),
          (r.prevZ = s),
          (s = r));
      n = a;
    }
    ((s.nextZ = null), (t *= 2));
  } while (e > 1);
  return i;
}

function Mh(i, e, t, n, r) {
  return (
    (i = ((i - t) * r) | 0),
    (e = ((e - n) * r) | 0),
    (i = (i | (i << 8)) & 16711935),
    (i = (i | (i << 4)) & 252645135),
    (i = (i | (i << 2)) & 858993459),
    (i = (i | (i << 1)) & 1431655765),
    (e = (e | (e << 8)) & 16711935),
    (e = (e | (e << 4)) & 252645135),
    (e = (e | (e << 2)) & 858993459),
    (e = (e | (e << 1)) & 1431655765),
    i | (e << 1)
  );
}

function _j(i) {
  let e = i,
    t = i;
  do ((e.x < t.x || (e.x === t.x && e.y < t.y)) && (t = e), (e = e.next));
  while (e !== i);
  return t;
}

function Wm(i, e, t, n, r, s, a, o) {
  return (
    (r - a) * (e - o) >= (i - a) * (s - o) &&
    (i - a) * (n - o) >= (t - a) * (e - o) &&
    (t - a) * (s - o) >= (r - a) * (n - o)
  );
}

function Sa(i, e, t, n, r, s, a, o) {
  return !(i === a && e === o) && Wm(i, e, t, n, r, s, a, o);
}

function Ej(i, e) {
  return (
    i.next.i !== e.i &&
    i.prev.i !== e.i &&
    !yj(i, e) &&
    ((Ja(i, e) &&
      Ja(e, i) &&
      xj(i, e) &&
      ($t(i.prev, i, e.prev) || $t(i, e.prev, e))) ||
      (Os(i, e) && $t(i.prev, i, i.next) > 0 && $t(e.prev, e, e.next) > 0))
  );
}

function $t(i, e, t) {
  return (e.y - i.y) * (t.x - e.x) - (e.x - i.x) * (t.y - e.y);
}

function Os(i, e) {
  return i.x === e.x && i.y === e.y;
}

function Xm(i, e, t, n) {
  const r = $o($t(i, e, t)),
    s = $o($t(i, e, n)),
    a = $o($t(t, n, i)),
    o = $o($t(t, n, e));
  return !!(
    (r !== s && a !== o) ||
    (r === 0 && qo(i, t, e)) ||
    (s === 0 && qo(i, n, e)) ||
    (a === 0 && qo(t, i, n)) ||
    (o === 0 && qo(t, e, n))
  );
}

function qo(i, e, t) {
  return (
    e.x <= Math.max(i.x, t.x) &&
    e.x >= Math.min(i.x, t.x) &&
    e.y <= Math.max(i.y, t.y) &&
    e.y >= Math.min(i.y, t.y)
  );
}

function $o(i) {
  return i > 0 ? 1 : i < 0 ? -1 : 0;
}

function yj(i, e) {
  let t = i;
  do {
    if (
      t.i !== i.i &&
      t.next.i !== i.i &&
      t.i !== e.i &&
      t.next.i !== e.i &&
      Xm(t, t.next, i, e)
    )
      return !0;
    t = t.next;
  } while (t !== i);
  return !1;
}

function Ja(i, e) {
  return $t(i.prev, i, i.next) < 0
    ? $t(i, e, i.next) >= 0 && $t(i, i.prev, e) >= 0
    : $t(i, e, i.prev) < 0 || $t(i, i.next, e) < 0;
}

function xj(i, e) {
  let t = i,
    n = !1;
  const r = (i.x + e.x) / 2,
    s = (i.y + e.y) / 2;
  do
    (t.y > s != t.next.y > s &&
      t.next.y !== t.y &&
      r < ((t.next.x - t.x) * (s - t.y)) / (t.next.y - t.y) + t.x &&
      (n = !n),
      (t = t.next));
  while (t !== i);
  return n;
}

function Jm(i, e) {
  const t = Bh(i.i, i.x, i.y),
    n = Bh(e.i, e.x, e.y),
    r = i.next,
    s = e.prev;
  return (
    (i.next = e),
    (e.prev = i),
    (t.next = r),
    (r.prev = t),
    (n.next = t),
    (t.prev = n),
    (s.next = n),
    (n.prev = s),
    n
  );
}

function Wu(i, e, t, n) {
  const r = Bh(i, e, t);
  return (
    n
      ? ((r.next = n.next), (r.prev = n), (n.next.prev = r), (n.next = r))
      : ((r.prev = r), (r.next = r)),
    r
  );
}

function Ka(i) {
  ((i.next.prev = i.prev),
    (i.prev.next = i.next),
    i.prevZ && (i.prevZ.nextZ = i.nextZ),
    i.nextZ && (i.nextZ.prevZ = i.prevZ));
}

function Bh(i, e, t) {
  return {
    i,
    x: e,
    y: t,
    prev: null,
    next: null,
    z: 0,
    prevZ: null,
    nextZ: null,
    steiner: !1,
  };
}

function Cj(i, e, t, n) {
  let r = 0;
  for (let s = e, a = t - n; s < t; s += n)
    ((r += (i[a] - i[s]) * (i[s + 1] + i[a + 1])), (a = s));
  return r;
}

class bj {
  static triangulate(e, t, n = 2) {
    return Aj(e, t, n);
  }
}

class Lr {
  static area(e) {
    const t = e.length;
    let n = 0;
    for (let r = t - 1, s = 0; s < t; r = s++)
      n += e[r].x * e[s].y - e[s].x * e[r].y;
    return n * 0.5;
  }
  static isClockWise(e) {
    return Lr.area(e) < 0;
  }
  static triangulateShape(e, t) {
    const n = [],
      r = [],
      s = [];
    (Xu(e), Ju(n, e));
    let a = e.length;
    t.forEach(Xu);
    for (let A = 0; A < t.length; A++)
      (r.push(a), (a += t[A].length), Ju(n, t[A]));
    const o = bj.triangulate(n, r);
    for (let A = 0; A < o.length; A += 3) s.push(o.slice(A, A + 3));
    return s;
  }
}

function Xu(i) {
  const e = i.length;
  e > 2 && i[e - 1].equals(i[0]) && i.pop();
}

function Ju(i, e) {
  for (let t = 0; t < e.length; t++) (i.push(e[t].x), i.push(e[t].y));
}

class kd extends Ct {
  constructor(
    e = new il([
      new Ae(0.5, 0.5),
      new Ae(-0.5, 0.5),
      new Ae(-0.5, -0.5),
      new Ae(0.5, -0.5),
    ]),
    t = {},
  ) {
    (super(),
      (this.type = "ExtrudeGeometry"),
      (this.parameters = { shapes: e, options: t }),
      (e = Array.isArray(e) ? e : [e]));
    const n = this,
      r = [],
      s = [];
    for (let o = 0, A = e.length; o < A; o++) {
      const l = e[o];
      a(l);
    }
    (this.setAttribute("position", new Ke(r, 3)),
      this.setAttribute("uv", new Ke(s, 2)),
      this.computeVertexNormals());
    function a(o) {
      const A = [],
        l = t.curveSegments !== void 0 ? t.curveSegments : 12,
        c = t.steps !== void 0 ? t.steps : 1,
        h = t.depth !== void 0 ? t.depth : 1;
      let d = t.bevelEnabled !== void 0 ? t.bevelEnabled : !0,
        u = t.bevelThickness !== void 0 ? t.bevelThickness : 0.2,
        p = t.bevelSize !== void 0 ? t.bevelSize : u - 0.1,
        v = t.bevelOffset !== void 0 ? t.bevelOffset : 0,
        g = t.bevelSegments !== void 0 ? t.bevelSegments : 3;
      const m = t.extrudePath,
        y = t.UVGenerator !== void 0 ? t.UVGenerator : Sj;
      let C,
        E = !1,
        w,
        S,
        k,
        x;
      if (m) {
        ((C = m.getSpacedPoints(c)), (E = !0), (d = !1));
        const ue = m.isCatmullRomCurve3 ? m.closed : !1;
        ((w = m.computeFrenetFrames(c, ue)),
          (S = new F()),
          (k = new F()),
          (x = new F()));
      }
      d || ((g = 0), (u = 0), (p = 0), (v = 0));
      const T = o.extractPoints(l);
      let R = T.shape;
      const D = T.holes;
      if (!Lr.isClockWise(R)) {
        R = R.reverse();
        for (let ue = 0, _e = D.length; ue < _e; ue++) {
          const ve = D[ue];
          Lr.isClockWise(ve) && (D[ue] = ve.reverse());
        }
      }
      function X(ue) {
        const ve = 10000000000000001e-36;
        let Me = ue[0];
        for (let Be = 1; Be <= ue.length; Be++) {
          const Ze = Be % ue.length,
            He = ue[Ze],
            At = He.x - Me.x,
            te = He.y - Me.y,
            G = At * At + te * te,
            Ge = Math.max(
              Math.abs(He.x),
              Math.abs(He.y),
              Math.abs(Me.x),
              Math.abs(Me.y),
            ),
            $e = ve * Ge * Ge;
          if (G <= $e) {
            (ue.splice(Ze, 1), Be--);
            continue;
          }
          Me = He;
        }
      }
      (X(R), D.forEach(X));
      const Y = D.length,
        H = R;
      for (let ue = 0; ue < Y; ue++) {
        const _e = D[ue];
        R = R.concat(_e);
      }
      function V(ue, _e, ve) {
        return (
          _e || ut("ExtrudeGeometry: vec does not exist"),
          ue.clone().addScaledVector(_e, ve)
        );
      }
      const J = R.length;
      function ne(ue, _e, ve) {
        let Me, Be, Ze;
        const He = ue.x - _e.x,
          At = ue.y - _e.y,
          te = ve.x - ue.x,
          G = ve.y - ue.y,
          Ge = He * He + At * At,
          $e = He * G - At * te;
        if (Math.abs($e) > Number.EPSILON) {
          const I = Math.sqrt(Ge),
            b = Math.sqrt(te * te + G * G),
            q = _e.x - At / I,
            K = _e.y + He / I,
            ie = ve.x - G / b,
            Ce = ve.y + te / b,
            we = ((ie - q) * G - (Ce - K) * te) / (He * G - At * te);
          ((Me = q + He * we - ue.x), (Be = K + At * we - ue.y));
          const ae = Me * Me + Be * Be;
          if (ae <= 2) return new Ae(Me, Be);
          Ze = Math.sqrt(ae / 2);
        } else {
          let I = !1;
          (He > Number.EPSILON
            ? te > Number.EPSILON && (I = !0)
            : He < -Number.EPSILON
              ? te < -Number.EPSILON && (I = !0)
              : Math.sign(At) === Math.sign(G) && (I = !0),
            I
              ? ((Me = -At), (Be = He), (Ze = Math.sqrt(Ge)))
              : ((Me = He), (Be = At), (Ze = Math.sqrt(Ge / 2))));
        }
        return new Ae(Me / Ze, Be / Ze);
      }
      const le = [];
      for (
        let ue = 0, _e = H.length, ve = _e - 1, Me = ue + 1;
        ue < _e;
        ue++, ve++, Me++
      )
        (ve === _e && (ve = 0),
          Me === _e && (Me = 0),
          (le[ue] = ne(H[ue], H[ve], H[Me])));
      const je = [];
      let de,
        pe = le.concat();
      for (let ue = 0, _e = Y; ue < _e; ue++) {
        const ve = D[ue];
        de = [];
        for (
          let Me = 0, Be = ve.length, Ze = Be - 1, He = Me + 1;
          Me < Be;
          Me++, Ze++, He++
        )
          (Ze === Be && (Ze = 0),
            He === Be && (He = 0),
            (de[Me] = ne(ve[Me], ve[Ze], ve[He])));
        (je.push(de), (pe = pe.concat(de)));
      }
      let Se;
      if (g === 0) Se = Lr.triangulateShape(H, D);
      else {
        const ue = [],
          _e = [];
        for (let ve = 0; ve < g; ve++) {
          const Me = ve / g,
            Be = u * Math.cos((Me * Math.PI) / 2),
            Ze = p * Math.sin((Me * Math.PI) / 2) + v;
          for (let He = 0, At = H.length; He < At; He++) {
            const te = V(H[He], le[He], Ze);
            (qe(te.x, te.y, -Be), Me === 0 && ue.push(te));
          }
          for (let He = 0, At = Y; He < At; He++) {
            const te = D[He];
            de = je[He];
            const G = [];
            for (let Ge = 0, $e = te.length; Ge < $e; Ge++) {
              const I = V(te[Ge], de[Ge], Ze);
              (qe(I.x, I.y, -Be), Me === 0 && G.push(I));
            }
            Me === 0 && _e.push(G);
          }
        }
        Se = Lr.triangulateShape(ue, _e);
      }
      const gt = Se.length,
        ct = p + v;
      for (let ue = 0; ue < J; ue++) {
        const _e = d ? V(R[ue], pe[ue], ct) : R[ue];
        E
          ? (k.copy(w.normals[0]).multiplyScalar(_e.x),
            S.copy(w.binormals[0]).multiplyScalar(_e.y),
            x.copy(C[0]).add(k).add(S),
            qe(x.x, x.y, x.z))
          : qe(_e.x, _e.y, 0);
      }
      for (let ue = 1; ue <= c; ue++)
        for (let _e = 0; _e < J; _e++) {
          const ve = d ? V(R[_e], pe[_e], ct) : R[_e];
          E
            ? (k.copy(w.normals[ue]).multiplyScalar(ve.x),
              S.copy(w.binormals[ue]).multiplyScalar(ve.y),
              x.copy(C[ue]).add(k).add(S),
              qe(x.x, x.y, x.z))
            : qe(ve.x, ve.y, (h / c) * ue);
        }
      for (let ue = g - 1; ue >= 0; ue--) {
        const _e = ue / g,
          ve = u * Math.cos((_e * Math.PI) / 2),
          Me = p * Math.sin((_e * Math.PI) / 2) + v;
        for (let Be = 0, Ze = H.length; Be < Ze; Be++) {
          const He = V(H[Be], le[Be], Me);
          qe(He.x, He.y, h + ve);
        }
        for (let Be = 0, Ze = D.length; Be < Ze; Be++) {
          const He = D[Be];
          de = je[Be];
          for (let At = 0, te = He.length; At < te; At++) {
            const G = V(He[At], de[At], Me);
            E
              ? qe(G.x, G.y + C[c - 1].y, C[c - 1].x + ve)
              : qe(G.x, G.y, h + ve);
          }
        }
      }
      (oe(), xe());
      function oe() {
        const ue = r.length / 3;
        if (d) {
          let _e = 0,
            ve = J * _e;
          for (let Me = 0; Me < gt; Me++) {
            const Be = Se[Me];
            Xe(Be[2] + ve, Be[1] + ve, Be[0] + ve);
          }
          ((_e = c + g * 2), (ve = J * _e));
          for (let Me = 0; Me < gt; Me++) {
            const Be = Se[Me];
            Xe(Be[0] + ve, Be[1] + ve, Be[2] + ve);
          }
        } else {
          for (let _e = 0; _e < gt; _e++) {
            const ve = Se[_e];
            Xe(ve[2], ve[1], ve[0]);
          }
          for (let _e = 0; _e < gt; _e++) {
            const ve = Se[_e];
            Xe(ve[0] + J * c, ve[1] + J * c, ve[2] + J * c);
          }
        }
        n.addGroup(ue, r.length / 3 - ue, 0);
      }
      function xe() {
        const ue = r.length / 3;
        let _e = 0;
        (ge(H, _e), (_e += H.length));
        for (let ve = 0, Me = D.length; ve < Me; ve++) {
          const Be = D[ve];
          (ge(Be, _e), (_e += Be.length));
        }
        n.addGroup(ue, r.length / 3 - ue, 1);
      }
      function ge(ue, _e) {
        let ve = ue.length;
        for (; --ve >= 0; ) {
          const Me = ve;
          let Be = ve - 1;
          Be < 0 && (Be = ue.length - 1);
          for (let Ze = 0, He = c + g * 2; Ze < He; Ze++) {
            const At = J * Ze,
              te = J * (Ze + 1),
              G = _e + Me + At,
              Ge = _e + Be + At,
              $e = _e + Be + te,
              I = _e + Me + te;
            We(G, Ge, $e, I);
          }
        }
      }
      function qe(ue, _e, ve) {
        (A.push(ue), A.push(_e), A.push(ve));
      }
      function Xe(ue, _e, ve) {
        (ft(ue), ft(_e), ft(ve));
        const Me = r.length / 3,
          Be = y.generateTopUV(n, r, Me - 3, Me - 2, Me - 1);
        (st(Be[0]), st(Be[1]), st(Be[2]));
      }
      function We(ue, _e, ve, Me) {
        (ft(ue), ft(_e), ft(Me), ft(_e), ft(ve), ft(Me));
        const Be = r.length / 3,
          Ze = y.generateSideWallUV(n, r, Be - 6, Be - 3, Be - 2, Be - 1);
        (st(Ze[0]), st(Ze[1]), st(Ze[3]), st(Ze[1]), st(Ze[2]), st(Ze[3]));
      }
      function ft(ue) {
        (r.push(A[ue * 3 + 0]), r.push(A[ue * 3 + 1]), r.push(A[ue * 3 + 2]));
      }
      function st(ue) {
        (s.push(ue.x), s.push(ue.y));
      }
    }
  }
  copy(e) {
    return (
      super.copy(e),
      (this.parameters = Object.assign({}, e.parameters)),
      this
    );
  }
  toJSON() {
    const e = super.toJSON(),
      t = this.parameters.shapes,
      n = this.parameters.options;
    return wj(t, n, e);
  }
  static fromJSON(e, t) {
    const n = [];
    for (let s = 0, a = e.shapes.length; s < a; s++) {
      const o = t[e.shapes[s]];
      n.push(o);
    }
    const r = e.options.extrudePath;
    return (
      r !== void 0 && (e.options.extrudePath = new FA[r.type]().fromJSON(r)),
      new kd(n, e.options)
    );
  }
}

const Sj = {
  generateTopUV: function (i, e, t, n, r) {
    const s = e[t * 3],
      a = e[t * 3 + 1],
      o = e[n * 3],
      A = e[n * 3 + 1],
      l = e[r * 3],
      c = e[r * 3 + 1];
    return [new Ae(s, a), new Ae(o, A), new Ae(l, c)];
  },
  generateSideWallUV: function (i, e, t, n, r, s) {
    const a = e[t * 3],
      o = e[t * 3 + 1],
      A = e[t * 3 + 2],
      l = e[n * 3],
      c = e[n * 3 + 1],
      h = e[n * 3 + 2],
      d = e[r * 3],
      u = e[r * 3 + 1],
      p = e[r * 3 + 2],
      v = e[s * 3],
      g = e[s * 3 + 1],
      m = e[s * 3 + 2];
    return Math.abs(o - c) < Math.abs(a - l)
      ? [new Ae(a, 1 - A), new Ae(l, 1 - h), new Ae(d, 1 - p), new Ae(v, 1 - m)]
      : [
          new Ae(o, 1 - A),
          new Ae(c, 1 - h),
          new Ae(u, 1 - p),
          new Ae(g, 1 - m),
        ];
  },
};

function wj(i, e, t) {
  if (((t.shapes = []), Array.isArray(i)))
    for (let n = 0, r = i.length; n < r; n++) {
      const s = i[n];
      t.shapes.push(s.uuid);
    }
  else t.shapes.push(i.uuid);
  return (
    (t.options = Object.assign({}, e)),
    e.extrudePath !== void 0 &&
      (t.options.extrudePath = e.extrudePath.toJSON()),
    t
  );
}

class Td extends Sd {
  constructor(e = 1, t = 0) {
    const n = (1 + Math.sqrt(5)) / 2,
      r = [
        -1,
        n,
        0,
        1,
        n,
        0,
        -1,
        -n,
        0,
        1,
        -n,
        0,
        0,
        -1,
        n,
        0,
        1,
        n,
        0,
        -1,
        -n,
        0,
        1,
        -n,
        n,
        0,
        -1,
        n,
        0,
        1,
        -n,
        0,
        -1,
        -n,
        0,
        1,
      ],
      s = [
        0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11, 1, 5, 9, 5, 11, 4, 11,
        10, 2, 10, 7, 6, 7, 1, 8, 3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9,
        4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1,
      ];
    (super(r, s, e, t),
      (this.type = "IcosahedronGeometry"),
      (this.parameters = { radius: e, detail: t }));
  }
  static fromJSON(e) {
    return new Td(e.radius, e.detail);
  }
}

class Oi extends Ct {
  constructor(
    e = [new Ae(0, -0.5), new Ae(0.5, 0), new Ae(0, 0.5)],
    t = 12,
    n = 0,
    r = Math.PI * 2,
  ) {
    (super(),
      (this.type = "LatheGeometry"),
      (this.parameters = { points: e, segments: t, phiStart: n, phiLength: r }),
      (t = Math.floor(t)),
      (r = xt(r, 0, Math.PI * 2)));
    const s = [],
      a = [],
      o = [],
      A = [],
      l = [],
      c = 1 / t,
      h = new F(),
      d = new Ae(),
      u = new F(),
      p = new F(),
      v = new F();
    let g = 0,
      m = 0;
    for (let y = 0; y <= e.length - 1; y++)
      switch (y) {
        case 0:
          ((g = e[y + 1].x - e[y].x),
            (m = e[y + 1].y - e[y].y),
            (u.x = m * 1),
            (u.y = -g),
            (u.z = m * 0),
            v.copy(u),
            u.normalize(),
            A.push(u.x, u.y, u.z));
          break;
        case e.length - 1:
          A.push(v.x, v.y, v.z);
          break;
        default:
          ((g = e[y + 1].x - e[y].x),
            (m = e[y + 1].y - e[y].y),
            (u.x = m * 1),
            (u.y = -g),
            (u.z = m * 0),
            p.copy(u),
            (u.x += v.x),
            (u.y += v.y),
            (u.z += v.z),
            u.normalize(),
            A.push(u.x, u.y, u.z),
            v.copy(p));
      }
    for (let y = 0; y <= t; y++) {
      const C = n + y * c * r,
        E = Math.sin(C),
        w = Math.cos(C);
      for (let S = 0; S <= e.length - 1; S++) {
        ((h.x = e[S].x * E),
          (h.y = e[S].y),
          (h.z = e[S].x * w),
          a.push(h.x, h.y, h.z),
          (d.x = y / t),
          (d.y = S / (e.length - 1)),
          o.push(d.x, d.y));
        const k = A[3 * S + 0] * E,
          x = A[3 * S + 1],
          T = A[3 * S + 0] * w;
        l.push(k, x, T);
      }
    }
    for (let y = 0; y < t; y++)
      for (let C = 0; C < e.length - 1; C++) {
        const E = C + y * e.length,
          w = E,
          S = E + e.length,
          k = E + e.length + 1,
          x = E + 1;
        (s.push(w, S, x), s.push(k, x, S));
      }
    (this.setIndex(s),
      this.setAttribute("position", new Ke(a, 3)),
      this.setAttribute("uv", new Ke(o, 2)),
      this.setAttribute("normal", new Ke(l, 3)));
  }
  copy(e) {
    return (
      super.copy(e),
      (this.parameters = Object.assign({}, e.parameters)),
      this
    );
  }
  static fromJSON(e) {
    return new Oi(e.points, e.segments, e.phiStart, e.phiLength);
  }
}

class ui extends Ct {
  constructor(e = 1, t = 1, n = 1, r = 1) {
    (super(),
      (this.type = "PlaneGeometry"),
      (this.parameters = {
        width: e,
        height: t,
        widthSegments: n,
        heightSegments: r,
      }));
    const s = e / 2,
      a = t / 2,
      o = Math.floor(n),
      A = Math.floor(r),
      l = o + 1,
      c = A + 1,
      h = e / o,
      d = t / A,
      u = [],
      p = [],
      v = [],
      g = [];
    for (let m = 0; m < c; m++) {
      const y = m * d - a;
      for (let C = 0; C < l; C++) {
        const E = C * h - s;
        (p.push(E, -y, 0), v.push(0, 0, 1), g.push(C / o), g.push(1 - m / A));
      }
    }
    for (let m = 0; m < A; m++)
      for (let y = 0; y < o; y++) {
        const C = y + l * m,
          E = y + l * (m + 1),
          w = y + 1 + l * (m + 1),
          S = y + 1 + l * m;
        (u.push(C, E, S), u.push(E, w, S));
      }
    (this.setIndex(u),
      this.setAttribute("position", new Ke(p, 3)),
      this.setAttribute("normal", new Ke(v, 3)),
      this.setAttribute("uv", new Ke(g, 2)));
  }
  copy(e) {
    return (
      super.copy(e),
      (this.parameters = Object.assign({}, e.parameters)),
      this
    );
  }
  static fromJSON(e) {
    return new ui(e.width, e.height, e.widthSegments, e.heightSegments);
  }
}

class Ya extends Ct {
  constructor(e = 0.5, t = 1, n = 32, r = 1, s = 0, a = Math.PI * 2) {
    (super(),
      (this.type = "RingGeometry"),
      (this.parameters = {
        innerRadius: e,
        outerRadius: t,
        thetaSegments: n,
        phiSegments: r,
        thetaStart: s,
        thetaLength: a,
      }),
      (n = Math.max(3, n)),
      (r = Math.max(1, r)));
    const o = [],
      A = [],
      l = [],
      c = [];
    let h = e;
    const d = (t - e) / r,
      u = new F(),
      p = new Ae();
    for (let v = 0; v <= r; v++) {
      for (let g = 0; g <= n; g++) {
        const m = s + (g / n) * a;
        ((u.x = h * Math.cos(m)),
          (u.y = h * Math.sin(m)),
          A.push(u.x, u.y, u.z),
          l.push(0, 0, 1),
          (p.x = (u.x / t + 1) / 2),
          (p.y = (u.y / t + 1) / 2),
          c.push(p.x, p.y));
      }
      h += d;
    }
    for (let v = 0; v < r; v++) {
      const g = v * (n + 1);
      for (let m = 0; m < n; m++) {
        const y = m + g,
          C = y,
          E = y + n + 1,
          w = y + n + 2,
          S = y + 1;
        (o.push(C, E, S), o.push(E, w, S));
      }
    }
    (this.setIndex(o),
      this.setAttribute("position", new Ke(A, 3)),
      this.setAttribute("normal", new Ke(l, 3)),
      this.setAttribute("uv", new Ke(c, 2)));
  }
  copy(e) {
    return (
      super.copy(e),
      (this.parameters = Object.assign({}, e.parameters)),
      this
    );
  }
  static fromJSON(e) {
    return new Ya(
      e.innerRadius,
      e.outerRadius,
      e.thetaSegments,
      e.phiSegments,
      e.thetaStart,
      e.thetaLength,
    );
  }
}

class Rd extends Ct {
  constructor(
    e = new il([new Ae(0, 0.5), new Ae(-0.5, -0.5), new Ae(0.5, -0.5)]),
    t = 12,
  ) {
    (super(),
      (this.type = "ShapeGeometry"),
      (this.parameters = { shapes: e, curveSegments: t }));
    const n = [],
      r = [],
      s = [],
      a = [];
    let o = 0,
      A = 0;
    if (Array.isArray(e) === !1) l(e);
    else
      for (let c = 0; c < e.length; c++)
        (l(e[c]), this.addGroup(o, A, c), (o += A), (A = 0));
    (this.setIndex(n),
      this.setAttribute("position", new Ke(r, 3)),
      this.setAttribute("normal", new Ke(s, 3)),
      this.setAttribute("uv", new Ke(a, 2)));
    function l(c) {
      const h = r.length / 3,
        d = c.extractPoints(t);
      let u = d.shape;
      const p = d.holes;
      Lr.isClockWise(u) === !1 && (u = u.reverse());
      for (let g = 0, m = p.length; g < m; g++) {
        const y = p[g];
        Lr.isClockWise(y) === !0 && (p[g] = y.reverse());
      }
      const v = Lr.triangulateShape(u, p);
      for (let g = 0, m = p.length; g < m; g++) {
        const y = p[g];
        u = u.concat(y);
      }
      for (let g = 0, m = u.length; g < m; g++) {
        const y = u[g];
        (r.push(y.x, y.y, 0), s.push(0, 0, 1), a.push(y.x, y.y));
      }
      for (let g = 0, m = v.length; g < m; g++) {
        const y = v[g],
          C = y[0] + h,
          E = y[1] + h,
          w = y[2] + h;
        (n.push(C, E, w), (A += 3));
      }
    }
  }
  copy(e) {
    return (
      super.copy(e),
      (this.parameters = Object.assign({}, e.parameters)),
      this
    );
  }
  toJSON() {
    const e = super.toJSON(),
      t = this.parameters.shapes;
    return Mj(t, e);
  }
  static fromJSON(e, t) {
    const n = [];
    for (let r = 0, s = e.shapes.length; r < s; r++) {
      const a = t[e.shapes[r]];
      n.push(a);
    }
    return new Rd(n, e.curveSegments);
  }
}

function Mj(i, e) {
  if (((e.shapes = []), Array.isArray(i)))
    for (let t = 0, n = i.length; t < n; t++) {
      const r = i[t];
      e.shapes.push(r.uuid);
    }
  else e.shapes.push(i.uuid);
  return e;
}

class Ur extends Ct {
  constructor(
    e = 1,
    t = 32,
    n = 16,
    r = 0,
    s = Math.PI * 2,
    a = 0,
    o = Math.PI,
  ) {
    (super(),
      (this.type = "SphereGeometry"),
      (this.parameters = {
        radius: e,
        widthSegments: t,
        heightSegments: n,
        phiStart: r,
        phiLength: s,
        thetaStart: a,
        thetaLength: o,
      }),
      (t = Math.max(3, Math.floor(t))),
      (n = Math.max(2, Math.floor(n))));
    const A = Math.min(a + o, Math.PI);
    let l = 0;
    const c = [],
      h = new F(),
      d = new F(),
      u = [],
      p = [],
      v = [],
      g = [];
    for (let m = 0; m <= n; m++) {
      const y = [],
        C = m / n,
        E = a + C * o,
        w = e * Math.cos(E),
        S = Math.sqrt(e * e - w * w);
      let k = 0;
      m === 0 && a === 0
        ? (k = 0.5 / t)
        : m === n && A === Math.PI && (k = -0.5 / t);
      for (let x = 0; x <= t; x++) {
        const T = x / t,
          R = r + T * s;
        ((h.x = -S * Math.cos(R)),
          (h.y = w),
          (h.z = S * Math.sin(R)),
          p.push(h.x, h.y, h.z),
          d.copy(h).normalize(),
          v.push(d.x, d.y, d.z),
          g.push(T + k, 1 - C),
          y.push(l++));
      }
      c.push(y);
    }
    for (let m = 0; m < n; m++)
      for (let y = 0; y < t; y++) {
        const C = c[m][y + 1],
          E = c[m][y],
          w = c[m + 1][y],
          S = c[m + 1][y + 1];
        ((m !== 0 || a > 0) && u.push(C, E, S),
          (m !== n - 1 || A < Math.PI) && u.push(E, w, S));
      }
    (this.setIndex(u),
      this.setAttribute("position", new Ke(p, 3)),
      this.setAttribute("normal", new Ke(v, 3)),
      this.setAttribute("uv", new Ke(g, 2)));
  }
  copy(e) {
    return (
      super.copy(e),
      (this.parameters = Object.assign({}, e.parameters)),
      this
    );
  }
  static fromJSON(e) {
    return new Ur(
      e.radius,
      e.widthSegments,
      e.heightSegments,
      e.phiStart,
      e.phiLength,
      e.thetaStart,
      e.thetaLength,
    );
  }
}

class zi extends Ct {
  constructor(
    e = 1,
    t = 0.4,
    n = 12,
    r = 48,
    s = Math.PI * 2,
    a = 0,
    o = Math.PI * 2,
  ) {
    (super(),
      (this.type = "TorusGeometry"),
      (this.parameters = {
        radius: e,
        tube: t,
        radialSegments: n,
        tubularSegments: r,
        arc: s,
        thetaStart: a,
        thetaLength: o,
      }),
      (n = Math.floor(n)),
      (r = Math.floor(r)));
    const A = [],
      l = [],
      c = [],
      h = [],
      d = new F(),
      u = new F(),
      p = new F();
    for (let v = 0; v <= n; v++) {
      const g = a + (v / n) * o;
      for (let m = 0; m <= r; m++) {
        const y = (m / r) * s;
        ((u.x = (e + t * Math.cos(g)) * Math.cos(y)),
          (u.y = (e + t * Math.cos(g)) * Math.sin(y)),
          (u.z = t * Math.sin(g)),
          l.push(u.x, u.y, u.z),
          (d.x = e * Math.cos(y)),
          (d.y = e * Math.sin(y)),
          p.subVectors(u, d).normalize(),
          c.push(p.x, p.y, p.z),
          h.push(m / r),
          h.push(v / n));
      }
    }
    for (let v = 1; v <= n; v++)
      for (let g = 1; g <= r; g++) {
        const m = (r + 1) * v + g - 1,
          y = (r + 1) * (v - 1) + g - 1,
          C = (r + 1) * (v - 1) + g,
          E = (r + 1) * v + g;
        (A.push(m, y, E), A.push(y, C, E));
      }
    (this.setIndex(A),
      this.setAttribute("position", new Ke(l, 3)),
      this.setAttribute("normal", new Ke(c, 3)),
      this.setAttribute("uv", new Ke(h, 2)));
  }
  copy(e) {
    return (
      super.copy(e),
      (this.parameters = Object.assign({}, e.parameters)),
      this
    );
  }
  static fromJSON(e) {
    return new zi(e.radius, e.tube, e.radialSegments, e.tubularSegments, e.arc);
  }
}

class Hs extends Ct {
  constructor(
    e = new qm(new F(-1, -1, 0), new F(-1, 1, 0), new F(1, 1, 0)),
    t = 64,
    n = 1,
    r = 8,
    s = !1,
  ) {
    (super(),
      (this.type = "TubeGeometry"),
      (this.parameters = {
        path: e,
        tubularSegments: t,
        radius: n,
        radialSegments: r,
        closed: s,
      }));
    const a = e.computeFrenetFrames(t, s);
    ((this.tangents = a.tangents),
      (this.normals = a.normals),
      (this.binormals = a.binormals));
    const o = new F(),
      A = new F(),
      l = new Ae();
    let c = new F();
    const h = [],
      d = [],
      u = [],
      p = [];
    (v(),
      this.setIndex(p),
      this.setAttribute("position", new Ke(h, 3)),
      this.setAttribute("normal", new Ke(d, 3)),
      this.setAttribute("uv", new Ke(u, 2)));
    function v() {
      for (let C = 0; C < t; C++) g(C);
      (g(s === !1 ? t : 0), y(), m());
    }
    function g(C) {
      c = e.getPointAt(C / t, c);
      const E = a.normals[C],
        w = a.binormals[C];
      for (let S = 0; S <= r; S++) {
        const k = (S / r) * Math.PI * 2,
          x = Math.sin(k),
          T = -Math.cos(k);
        ((A.x = T * E.x + x * w.x),
          (A.y = T * E.y + x * w.y),
          (A.z = T * E.z + x * w.z),
          A.normalize(),
          d.push(A.x, A.y, A.z),
          (o.x = c.x + n * A.x),
          (o.y = c.y + n * A.y),
          (o.z = c.z + n * A.z),
          h.push(o.x, o.y, o.z));
      }
    }
    function m() {
      for (let C = 1; C <= t; C++)
        for (let E = 1; E <= r; E++) {
          const w = (r + 1) * (C - 1) + (E - 1),
            S = (r + 1) * C + (E - 1),
            k = (r + 1) * C + E,
            x = (r + 1) * (C - 1) + E;
          (p.push(w, S, x), p.push(S, k, x));
        }
    }
    function y() {
      for (let C = 0; C <= t; C++)
        for (let E = 0; E <= r; E++)
          ((l.x = C / t), (l.y = E / r), u.push(l.x, l.y));
    }
  }
  copy(e) {
    return (
      super.copy(e),
      (this.parameters = Object.assign({}, e.parameters)),
      this
    );
  }
  toJSON() {
    const e = super.toJSON();
    return ((e.path = this.parameters.path.toJSON()), e);
  }
  static fromJSON(e) {
    return new Hs(
      new FA[e.path.type]().fromJSON(e.path),
      e.tubularSegments,
      e.radius,
      e.radialSegments,
      e.closed,
    );
  }
}

function Us(i) {
  const e = {};
  for (const t in i) {
    e[t] = {};
    for (const n in i[t]) {
      const r = i[t][n];
      if (Ku(r))
        r.isRenderTargetTexture
          ? (it(
              "UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms().",
            ),
            (e[t][n] = null))
          : (e[t][n] = r.clone());
      else if (Array.isArray(r))
        if (Ku(r[0])) {
          const s = [];
          for (let a = 0, o = r.length; a < o; a++) s[a] = r[a].clone();
          e[t][n] = s;
        } else e[t][n] = r.slice();
      else e[t][n] = r;
    }
  }
  return e;
}

function gn(i) {
  const e = {};
  for (let t = 0; t < i.length; t++) {
    const n = Us(i[t]);
    for (const r in n) e[r] = n[r];
  }
  return e;
}

function Ku(i) {
  return (
    i &&
    (i.isColor ||
      i.isMatrix3 ||
      i.isMatrix4 ||
      i.isVector2 ||
      i.isVector3 ||
      i.isVector4 ||
      i.isTexture ||
      i.isQuaternion)
  );
}

function Bj(i) {
  const e = [];
  for (let t = 0; t < i.length; t++) e.push(i[t].clone());
  return e;
}

function Km(i) {
  const e = i.getRenderTarget();
  return e === null
    ? i.outputColorSpace
    : e.isXRRenderTarget === !0
      ? e.texture.colorSpace
      : bt.workingColorSpace;
}

const sl = { clone: Us, merge: gn };

var kj = `void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`;

var Tj = `void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;

class Lt extends Qt {
  constructor(e) {
    (super(),
      (this.isShaderMaterial = !0),
      (this.type = "ShaderMaterial"),
      (this.defines = {}),
      (this.uniforms = {}),
      (this.uniformsGroups = []),
      (this.vertexShader = kj),
      (this.fragmentShader = Tj),
      (this.linewidth = 1),
      (this.wireframe = !1),
      (this.wireframeLinewidth = 1),
      (this.fog = !1),
      (this.lights = !1),
      (this.clipping = !1),
      (this.forceSinglePass = !0),
      (this.extensions = { clipCullDistance: !1, multiDraw: !1 }),
      (this.defaultAttributeValues = {
        color: [1, 1, 1],
        uv: [0, 0],
        uv1: [0, 0],
      }),
      (this.index0AttributeName = void 0),
      (this.uniformsNeedUpdate = !1),
      (this.glslVersion = null),
      e !== void 0 && this.setValues(e));
  }
  copy(e) {
    return (
      super.copy(e),
      (this.fragmentShader = e.fragmentShader),
      (this.vertexShader = e.vertexShader),
      (this.uniforms = Us(e.uniforms)),
      (this.uniformsGroups = Bj(e.uniformsGroups)),
      (this.defines = Object.assign({}, e.defines)),
      (this.wireframe = e.wireframe),
      (this.wireframeLinewidth = e.wireframeLinewidth),
      (this.fog = e.fog),
      (this.lights = e.lights),
      (this.clipping = e.clipping),
      (this.extensions = Object.assign({}, e.extensions)),
      (this.glslVersion = e.glslVersion),
      (this.defaultAttributeValues = Object.assign(
        {},
        e.defaultAttributeValues,
      )),
      (this.index0AttributeName = e.index0AttributeName),
      (this.uniformsNeedUpdate = e.uniformsNeedUpdate),
      this
    );
  }
  toJSON(e) {
    const t = super.toJSON(e);
    ((t.glslVersion = this.glslVersion), (t.uniforms = {}));
    for (const r in this.uniforms) {
      const a = this.uniforms[r].value;
      a && a.isTexture
        ? (t.uniforms[r] = { type: "t", value: a.toJSON(e).uuid })
        : a && a.isColor
          ? (t.uniforms[r] = { type: "c", value: a.getHex() })
          : a && a.isVector2
            ? (t.uniforms[r] = { type: "v2", value: a.toArray() })
            : a && a.isVector3
              ? (t.uniforms[r] = { type: "v3", value: a.toArray() })
              : a && a.isVector4
                ? (t.uniforms[r] = { type: "v4", value: a.toArray() })
                : a && a.isMatrix3
                  ? (t.uniforms[r] = { type: "m3", value: a.toArray() })
                  : a && a.isMatrix4
                    ? (t.uniforms[r] = { type: "m4", value: a.toArray() })
                    : (t.uniforms[r] = { value: a });
    }
    (Object.keys(this.defines).length > 0 && (t.defines = this.defines),
      (t.vertexShader = this.vertexShader),
      (t.fragmentShader = this.fragmentShader),
      (t.lights = this.lights),
      (t.clipping = this.clipping));
    const n = {};
    for (const r in this.extensions) this.extensions[r] === !0 && (n[r] = !0);
    return (Object.keys(n).length > 0 && (t.extensions = n), t);
  }
  fromJSON(e, t) {
    if ((super.fromJSON(e, t), e.uniforms !== void 0))
      for (const n in e.uniforms) {
        const r = e.uniforms[n];
        switch (((this.uniforms[n] = {}), r.type)) {
          case "t":
            this.uniforms[n].value = t[r.value] || null;
            break;
          case "c":
            this.uniforms[n].value = new Ne().setHex(r.value);
            break;
          case "v2":
            this.uniforms[n].value = new Ae().fromArray(r.value);
            break;
          case "v3":
            this.uniforms[n].value = new F().fromArray(r.value);
            break;
          case "v4":
            this.uniforms[n].value = new Pt().fromArray(r.value);
            break;
          case "m3":
            this.uniforms[n].value = new jt().fromArray(r.value);
            break;
          case "m4":
            this.uniforms[n].value = new mt().fromArray(r.value);
            break;
          default:
            this.uniforms[n].value = r.value;
        }
      }
    if (
      (e.defines !== void 0 && (this.defines = e.defines),
      e.vertexShader !== void 0 && (this.vertexShader = e.vertexShader),
      e.fragmentShader !== void 0 && (this.fragmentShader = e.fragmentShader),
      e.glslVersion !== void 0 && (this.glslVersion = e.glslVersion),
      e.extensions !== void 0)
    )
      for (const n in e.extensions) this.extensions[n] = e.extensions[n];
    return (
      e.lights !== void 0 && (this.lights = e.lights),
      e.clipping !== void 0 && (this.clipping = e.clipping),
      this
    );
  }
}

class Ym extends Lt {
  constructor(e) {
    (super(e),
      (this.isRawShaderMaterial = !0),
      (this.type = "RawShaderMaterial"));
  }
}

class lt extends Qt {
  constructor(e) {
    (super(),
      (this.isMeshStandardMaterial = !0),
      (this.type = "MeshStandardMaterial"),
      (this.defines = { STANDARD: "" }),
      (this.color = new Ne(16777215)),
      (this.roughness = 1),
      (this.metalness = 0),
      (this.map = null),
      (this.lightMap = null),
      (this.lightMapIntensity = 1),
      (this.aoMap = null),
      (this.aoMapIntensity = 1),
      (this.emissive = new Ne(0)),
      (this.emissiveIntensity = 1),
      (this.emissiveMap = null),
      (this.bumpMap = null),
      (this.bumpScale = 1),
      (this.normalMap = null),
      (this.normalMapType = Ds),
      (this.normalScale = new Ae(1, 1)),
      (this.displacementMap = null),
      (this.displacementScale = 1),
      (this.displacementBias = 0),
      (this.roughnessMap = null),
      (this.metalnessMap = null),
      (this.alphaMap = null),
      (this.envMap = null),
      (this.envMapRotation = new yr()),
      (this.envMapIntensity = 1),
      (this.wireframe = !1),
      (this.wireframeLinewidth = 1),
      (this.wireframeLinecap = "round"),
      (this.wireframeLinejoin = "round"),
      (this.flatShading = !1),
      (this.fog = !0),
      this.setValues(e));
  }
  copy(e) {
    return (
      super.copy(e),
      (this.defines = { STANDARD: "" }),
      this.color.copy(e.color),
      (this.roughness = e.roughness),
      (this.metalness = e.metalness),
      (this.map = e.map),
      (this.lightMap = e.lightMap),
      (this.lightMapIntensity = e.lightMapIntensity),
      (this.aoMap = e.aoMap),
      (this.aoMapIntensity = e.aoMapIntensity),
      this.emissive.copy(e.emissive),
      (this.emissiveMap = e.emissiveMap),
      (this.emissiveIntensity = e.emissiveIntensity),
      (this.bumpMap = e.bumpMap),
      (this.bumpScale = e.bumpScale),
      (this.normalMap = e.normalMap),
      (this.normalMapType = e.normalMapType),
      this.normalScale.copy(e.normalScale),
      (this.displacementMap = e.displacementMap),
      (this.displacementScale = e.displacementScale),
      (this.displacementBias = e.displacementBias),
      (this.roughnessMap = e.roughnessMap),
      (this.metalnessMap = e.metalnessMap),
      (this.alphaMap = e.alphaMap),
      (this.envMap = e.envMap),
      this.envMapRotation.copy(e.envMapRotation),
      (this.envMapIntensity = e.envMapIntensity),
      (this.wireframe = e.wireframe),
      (this.wireframeLinewidth = e.wireframeLinewidth),
      (this.wireframeLinecap = e.wireframeLinecap),
      (this.wireframeLinejoin = e.wireframeLinejoin),
      (this.flatShading = e.flatShading),
      (this.fog = e.fog),
      this
    );
  }
}

class Cn extends lt {
  constructor(e) {
    (super(),
      (this.isMeshPhysicalMaterial = !0),
      (this.defines = { STANDARD: "", PHYSICAL: "" }),
      (this.type = "MeshPhysicalMaterial"),
      (this.anisotropyRotation = 0),
      (this.anisotropyMap = null),
      (this.clearcoatMap = null),
      (this.clearcoatRoughness = 0),
      (this.clearcoatRoughnessMap = null),
      (this.clearcoatNormalScale = new Ae(1, 1)),
      (this.clearcoatNormalMap = null),
      (this.ior = 1.5),
      Object.defineProperty(this, "reflectivity", {
        get: function () {
          return xt((2.5 * (this.ior - 1)) / (this.ior + 1), 0, 1);
        },
        set: function (t) {
          this.ior = (1 + 0.4 * t) / (1 - 0.4 * t);
        },
      }),
      (this.iridescenceMap = null),
      (this.iridescenceIOR = 1.3),
      (this.iridescenceThicknessRange = [100, 400]),
      (this.iridescenceThicknessMap = null),
      (this.sheenColor = new Ne(0)),
      (this.sheenColorMap = null),
      (this.sheenRoughness = 1),
      (this.sheenRoughnessMap = null),
      (this.transmissionMap = null),
      (this.thickness = 0),
      (this.thicknessMap = null),
      (this.attenuationDistance = 1 / 0),
      (this.attenuationColor = new Ne(1, 1, 1)),
      (this.specularIntensity = 1),
      (this.specularIntensityMap = null),
      (this.specularColor = new Ne(1, 1, 1)),
      (this.specularColorMap = null),
      (this._anisotropy = 0),
      (this._clearcoat = 0),
      (this._dispersion = 0),
      (this._iridescence = 0),
      (this._sheen = 0),
      (this._transmission = 0),
      this.setValues(e));
  }
  get anisotropy() {
    return this._anisotropy;
  }
  set anisotropy(e) {
    (this._anisotropy > 0 != e > 0 && this.version++, (this._anisotropy = e));
  }
  get clearcoat() {
    return this._clearcoat;
  }
  set clearcoat(e) {
    (this._clearcoat > 0 != e > 0 && this.version++, (this._clearcoat = e));
  }
  get iridescence() {
    return this._iridescence;
  }
  set iridescence(e) {
    (this._iridescence > 0 != e > 0 && this.version++, (this._iridescence = e));
  }
  get dispersion() {
    return this._dispersion;
  }
  set dispersion(e) {
    (this._dispersion > 0 != e > 0 && this.version++, (this._dispersion = e));
  }
  get sheen() {
    return this._sheen;
  }
  set sheen(e) {
    (this._sheen > 0 != e > 0 && this.version++, (this._sheen = e));
  }
  get transmission() {
    return this._transmission;
  }
  set transmission(e) {
    (this._transmission > 0 != e > 0 && this.version++,
      (this._transmission = e));
  }
  copy(e) {
    return (
      super.copy(e),
      (this.defines = { STANDARD: "", PHYSICAL: "" }),
      (this.anisotropy = e.anisotropy),
      (this.anisotropyRotation = e.anisotropyRotation),
      (this.anisotropyMap = e.anisotropyMap),
      (this.clearcoat = e.clearcoat),
      (this.clearcoatMap = e.clearcoatMap),
      (this.clearcoatRoughness = e.clearcoatRoughness),
      (this.clearcoatRoughnessMap = e.clearcoatRoughnessMap),
      (this.clearcoatNormalMap = e.clearcoatNormalMap),
      this.clearcoatNormalScale.copy(e.clearcoatNormalScale),
      (this.dispersion = e.dispersion),
      (this.ior = e.ior),
      (this.iridescence = e.iridescence),
      (this.iridescenceMap = e.iridescenceMap),
      (this.iridescenceIOR = e.iridescenceIOR),
      (this.iridescenceThicknessRange = [...e.iridescenceThicknessRange]),
      (this.iridescenceThicknessMap = e.iridescenceThicknessMap),
      (this.sheen = e.sheen),
      this.sheenColor.copy(e.sheenColor),
      (this.sheenColorMap = e.sheenColorMap),
      (this.sheenRoughness = e.sheenRoughness),
      (this.sheenRoughnessMap = e.sheenRoughnessMap),
      (this.transmission = e.transmission),
      (this.transmissionMap = e.transmissionMap),
      (this.thickness = e.thickness),
      (this.thicknessMap = e.thicknessMap),
      (this.attenuationDistance = e.attenuationDistance),
      this.attenuationColor.copy(e.attenuationColor),
      (this.specularIntensity = e.specularIntensity),
      (this.specularIntensityMap = e.specularIntensityMap),
      this.specularColor.copy(e.specularColor),
      (this.specularColorMap = e.specularColorMap),
      this
    );
  }
}

class Rj extends Qt {
  constructor(e) {
    (super(),
      (this.isMeshPhongMaterial = !0),
      (this.type = "MeshPhongMaterial"),
      (this.color = new Ne(16777215)),
      (this.specular = new Ne(1118481)),
      (this.shininess = 30),
      (this.map = null),
      (this.lightMap = null),
      (this.lightMapIntensity = 1),
      (this.aoMap = null),
      (this.aoMapIntensity = 1),
      (this.emissive = new Ne(0)),
      (this.emissiveIntensity = 1),
      (this.emissiveMap = null),
      (this.bumpMap = null),
      (this.bumpScale = 1),
      (this.normalMap = null),
      (this.normalMapType = Ds),
      (this.normalScale = new Ae(1, 1)),
      (this.displacementMap = null),
      (this.displacementScale = 1),
      (this.displacementBias = 0),
      (this.specularMap = null),
      (this.alphaMap = null),
      (this.envMap = null),
      (this.envMapRotation = new yr()),
      (this.combine = YA),
      (this.reflectivity = 1),
      (this.envMapIntensity = 1),
      (this.refractionRatio = 0.98),
      (this.wireframe = !1),
      (this.wireframeLinewidth = 1),
      (this.wireframeLinecap = "round"),
      (this.wireframeLinejoin = "round"),
      (this.flatShading = !1),
      (this.fog = !0),
      this.setValues(e));
  }
  copy(e) {
    return (
      super.copy(e),
      this.color.copy(e.color),
      this.specular.copy(e.specular),
      (this.shininess = e.shininess),
      (this.map = e.map),
      (this.lightMap = e.lightMap),
      (this.lightMapIntensity = e.lightMapIntensity),
      (this.aoMap = e.aoMap),
      (this.aoMapIntensity = e.aoMapIntensity),
      this.emissive.copy(e.emissive),
      (this.emissiveMap = e.emissiveMap),
      (this.emissiveIntensity = e.emissiveIntensity),
      (this.bumpMap = e.bumpMap),
      (this.bumpScale = e.bumpScale),
      (this.normalMap = e.normalMap),
      (this.normalMapType = e.normalMapType),
      this.normalScale.copy(e.normalScale),
      (this.displacementMap = e.displacementMap),
      (this.displacementScale = e.displacementScale),
      (this.displacementBias = e.displacementBias),
      (this.specularMap = e.specularMap),
      (this.alphaMap = e.alphaMap),
      (this.envMap = e.envMap),
      this.envMapRotation.copy(e.envMapRotation),
      (this.combine = e.combine),
      (this.reflectivity = e.reflectivity),
      (this.envMapIntensity = e.envMapIntensity),
      (this.refractionRatio = e.refractionRatio),
      (this.wireframe = e.wireframe),
      (this.wireframeLinewidth = e.wireframeLinewidth),
      (this.wireframeLinecap = e.wireframeLinecap),
      (this.wireframeLinejoin = e.wireframeLinejoin),
      (this.flatShading = e.flatShading),
      (this.fog = e.fog),
      this
    );
  }
}

class Pj extends Qt {
  constructor(e) {
    (super(),
      (this.isMeshToonMaterial = !0),
      (this.defines = { TOON: "" }),
      (this.type = "MeshToonMaterial"),
      (this.color = new Ne(16777215)),
      (this.map = null),
      (this.gradientMap = null),
      (this.lightMap = null),
      (this.lightMapIntensity = 1),
      (this.aoMap = null),
      (this.aoMapIntensity = 1),
      (this.emissive = new Ne(0)),
      (this.emissiveIntensity = 1),
      (this.emissiveMap = null),
      (this.bumpMap = null),
      (this.bumpScale = 1),
      (this.normalMap = null),
      (this.normalMapType = Ds),
      (this.normalScale = new Ae(1, 1)),
      (this.displacementMap = null),
      (this.displacementScale = 1),
      (this.displacementBias = 0),
      (this.alphaMap = null),
      (this.wireframe = !1),
      (this.wireframeLinewidth = 1),
      (this.wireframeLinecap = "round"),
      (this.wireframeLinejoin = "round"),
      (this.fog = !0),
      this.setValues(e));
  }
  copy(e) {
    return (
      super.copy(e),
      this.color.copy(e.color),
      (this.map = e.map),
      (this.gradientMap = e.gradientMap),
      (this.lightMap = e.lightMap),
      (this.lightMapIntensity = e.lightMapIntensity),
      (this.aoMap = e.aoMap),
      (this.aoMapIntensity = e.aoMapIntensity),
      this.emissive.copy(e.emissive),
      (this.emissiveMap = e.emissiveMap),
      (this.emissiveIntensity = e.emissiveIntensity),
      (this.bumpMap = e.bumpMap),
      (this.bumpScale = e.bumpScale),
      (this.normalMap = e.normalMap),
      (this.normalMapType = e.normalMapType),
      this.normalScale.copy(e.normalScale),
      (this.displacementMap = e.displacementMap),
      (this.displacementScale = e.displacementScale),
      (this.displacementBias = e.displacementBias),
      (this.alphaMap = e.alphaMap),
      (this.wireframe = e.wireframe),
      (this.wireframeLinewidth = e.wireframeLinewidth),
      (this.wireframeLinecap = e.wireframeLinecap),
      (this.wireframeLinejoin = e.wireframeLinejoin),
      (this.fog = e.fog),
      this
    );
  }
}

class Zm extends Qt {
  constructor(e) {
    (super(),
      (this.isMeshLambertMaterial = !0),
      (this.type = "MeshLambertMaterial"),
      (this.color = new Ne(16777215)),
      (this.map = null),
      (this.lightMap = null),
      (this.lightMapIntensity = 1),
      (this.aoMap = null),
      (this.aoMapIntensity = 1),
      (this.emissive = new Ne(0)),
      (this.emissiveIntensity = 1),
      (this.emissiveMap = null),
      (this.bumpMap = null),
      (this.bumpScale = 1),
      (this.normalMap = null),
      (this.normalMapType = Ds),
      (this.normalScale = new Ae(1, 1)),
      (this.displacementMap = null),
      (this.displacementScale = 1),
      (this.displacementBias = 0),
      (this.specularMap = null),
      (this.alphaMap = null),
      (this.envMap = null),
      (this.envMapRotation = new yr()),
      (this.combine = YA),
      (this.reflectivity = 1),
      (this.envMapIntensity = 1),
      (this.refractionRatio = 0.98),
      (this.wireframe = !1),
      (this.wireframeLinewidth = 1),
      (this.wireframeLinecap = "round"),
      (this.wireframeLinejoin = "round"),
      (this.flatShading = !1),
      (this.fog = !0),
      this.setValues(e));
  }
  copy(e) {
    return (
      super.copy(e),
      this.color.copy(e.color),
      (this.map = e.map),
      (this.lightMap = e.lightMap),
      (this.lightMapIntensity = e.lightMapIntensity),
      (this.aoMap = e.aoMap),
      (this.aoMapIntensity = e.aoMapIntensity),
      this.emissive.copy(e.emissive),
      (this.emissiveMap = e.emissiveMap),
      (this.emissiveIntensity = e.emissiveIntensity),
      (this.bumpMap = e.bumpMap),
      (this.bumpScale = e.bumpScale),
      (this.normalMap = e.normalMap),
      (this.normalMapType = e.normalMapType),
      this.normalScale.copy(e.normalScale),
      (this.displacementMap = e.displacementMap),
      (this.displacementScale = e.displacementScale),
      (this.displacementBias = e.displacementBias),
      (this.specularMap = e.specularMap),
      (this.alphaMap = e.alphaMap),
      (this.envMap = e.envMap),
      this.envMapRotation.copy(e.envMapRotation),
      (this.combine = e.combine),
      (this.reflectivity = e.reflectivity),
      (this.envMapIntensity = e.envMapIntensity),
      (this.refractionRatio = e.refractionRatio),
      (this.wireframe = e.wireframe),
      (this.wireframeLinewidth = e.wireframeLinewidth),
      (this.wireframeLinecap = e.wireframeLinecap),
      (this.wireframeLinejoin = e.wireframeLinejoin),
      (this.flatShading = e.flatShading),
      (this.fog = e.fog),
      this
    );
  }
}

class Ij extends Qt {
  constructor(e) {
    (super(),
      (this.isMeshDepthMaterial = !0),
      (this.type = "MeshDepthMaterial"),
      (this.depthPacking = Yg),
      (this.map = null),
      (this.alphaMap = null),
      (this.displacementMap = null),
      (this.displacementScale = 1),
      (this.displacementBias = 0),
      (this.wireframe = !1),
      (this.wireframeLinewidth = 1),
      this.setValues(e));
  }
  copy(e) {
    return (
      super.copy(e),
      (this.depthPacking = e.depthPacking),
      (this.map = e.map),
      (this.alphaMap = e.alphaMap),
      (this.displacementMap = e.displacementMap),
      (this.displacementScale = e.displacementScale),
      (this.displacementBias = e.displacementBias),
      (this.wireframe = e.wireframe),
      (this.wireframeLinewidth = e.wireframeLinewidth),
      this
    );
  }
}

class Lj extends Qt {
  constructor(e) {
    (super(),
      (this.isMeshDistanceMaterial = !0),
      (this.type = "MeshDistanceMaterial"),
      (this.map = null),
      (this.alphaMap = null),
      (this.displacementMap = null),
      (this.displacementScale = 1),
      (this.displacementBias = 0),
      this.setValues(e));
  }
  copy(e) {
    return (
      super.copy(e),
      (this.map = e.map),
      (this.alphaMap = e.alphaMap),
      (this.displacementMap = e.displacementMap),
      (this.displacementScale = e.displacementScale),
      (this.displacementBias = e.displacementBias),
      this
    );
  }
}

function zo(i, e) {
  return !i || i.constructor === e
    ? i
    : typeof e.BYTES_PER_ELEMENT == "number"
      ? new e(i)
      : Array.prototype.slice.call(i);
}

function Fj(i) {
  function e(r, s) {
    return i[r] - i[s];
  }
  const t = i.length,
    n = new Array(t);
  for (let r = 0; r !== t; ++r) n[r] = r;
  return (n.sort(e), n);
}

function Yu(i, e, t) {
  const n = i.length,
    r = new i.constructor(n);
  for (let s = 0, a = 0; a !== n; ++s) {
    const o = t[s] * e;
    for (let A = 0; A !== e; ++A) r[a++] = i[o + A];
  }
  return r;
}

function Dj(i, e, t, n) {
  let r = 1,
    s = i[0];
  for (; s !== void 0 && s[n] === void 0; ) s = i[r++];
  if (s === void 0) return;
  let a = s[n];
  if (a !== void 0)
    if (Array.isArray(a))
      do
        ((a = s[n]),
          a !== void 0 && (e.push(s.time), t.push(...a)),
          (s = i[r++]));
      while (s !== void 0);
    else if (a.toArray !== void 0)
      do
        ((a = s[n]),
          a !== void 0 && (e.push(s.time), a.toArray(t, t.length)),
          (s = i[r++]));
      while (s !== void 0);
    else
      do
        ((a = s[n]), a !== void 0 && (e.push(s.time), t.push(a)), (s = i[r++]));
      while (s !== void 0);
}

class zs {
  constructor(e, t, n, r) {
    ((this.parameterPositions = e),
      (this._cachedIndex = 0),
      (this.resultBuffer = r !== void 0 ? r : new t.constructor(n)),
      (this.sampleValues = t),
      (this.valueSize = n),
      (this.settings = null),
      (this.DefaultSettings_ = {}));
  }
  evaluate(e) {
    const t = this.parameterPositions;
    let n = this._cachedIndex,
      r = t[n],
      s = t[n - 1];
    e: {
      t: {
        let a;
        n: {
          r: if (!(e < r)) {
            for (let o = n + 2; ; ) {
              if (r === void 0) {
                if (e < s) break r;
                return (
                  (n = t.length),
                  (this._cachedIndex = n),
                  this.copySampleValue_(n - 1)
                );
              }
              if (n === o) break;
              if (((s = r), (r = t[++n]), e < r)) break t;
            }
            a = t.length;
            break n;
          }
          if (!(e >= s)) {
            const o = t[1];
            e < o && ((n = 2), (s = o));
            for (let A = n - 2; ; ) {
              if (s === void 0)
                return ((this._cachedIndex = 0), this.copySampleValue_(0));
              if (n === A) break;
              if (((r = s), (s = t[--n - 1]), e >= s)) break t;
            }
            ((a = n), (n = 0));
            break n;
          }
          break e;
        }
        for (; n < a; ) {
          const o = (n + a) >>> 1;
          e < t[o] ? (a = o) : (n = o + 1);
        }
        if (((r = t[n]), (s = t[n - 1]), s === void 0))
          return ((this._cachedIndex = 0), this.copySampleValue_(0));
        if (r === void 0)
          return (
            (n = t.length),
            (this._cachedIndex = n),
            this.copySampleValue_(n - 1)
          );
      }
      ((this._cachedIndex = n), this.intervalChanged_(n, s, r));
    }
    return this.interpolate_(n, s, e, r);
  }
  getSettings_() {
    return this.settings || this.DefaultSettings_;
  }
  copySampleValue_(e) {
    const t = this.resultBuffer,
      n = this.sampleValues,
      r = this.valueSize,
      s = e * r;
    for (let a = 0; a !== r; ++a) t[a] = n[s + a];
    return t;
  }
  interpolate_() {
    throw new Error("THREE.Interpolant: Call to abstract method.");
  }
  intervalChanged_() {}
}

class Nj extends zs {
  constructor(e, t, n, r) {
    (super(e, t, n, r),
      (this._weightPrev = -0),
      (this._offsetPrev = -0),
      (this._weightNext = -0),
      (this._offsetNext = -0),
      (this.DefaultSettings_ = { endingStart: ou, endingEnd: ou }));
  }
  intervalChanged_(e, t, n) {
    const r = this.parameterPositions;
    let s = e - 2,
      a = e + 1,
      o = r[s],
      A = r[a];
    if (o === void 0)
      switch (this.getSettings_().endingStart) {
        case Au:
          ((s = e), (o = 2 * t - n));
          break;
        case lu:
          ((s = r.length - 2), (o = t + r[s] - r[s + 1]));
          break;
        default:
          ((s = e), (o = n));
      }
    if (A === void 0)
      switch (this.getSettings_().endingEnd) {
        case Au:
          ((a = e), (A = 2 * n - t));
          break;
        case lu:
          ((a = 1), (A = n + r[1] - r[0]));
          break;
        default:
          ((a = e - 1), (A = t));
      }
    const l = (n - t) * 0.5,
      c = this.valueSize;
    ((this._weightPrev = l / (t - o)),
      (this._weightNext = l / (A - n)),
      (this._offsetPrev = s * c),
      (this._offsetNext = a * c));
  }
  interpolate_(e, t, n, r) {
    const s = this.resultBuffer,
      a = this.sampleValues,
      o = this.valueSize,
      A = e * o,
      l = A - o,
      c = this._offsetPrev,
      h = this._offsetNext,
      d = this._weightPrev,
      u = this._weightNext,
      p = (n - t) / (r - t),
      v = p * p,
      g = v * p,
      m = -d * g + 2 * d * v - d * p,
      y = (1 + d) * g + (-1.5 - 2 * d) * v + (-0.5 + d) * p + 1,
      C = (-1 - u) * g + (1.5 + u) * v + 0.5 * p,
      E = u * g - u * v;
    for (let w = 0; w !== o; ++w)
      s[w] = m * a[c + w] + y * a[l + w] + C * a[A + w] + E * a[h + w];
    return s;
  }
}

class Gj extends zs {
  constructor(e, t, n, r) {
    super(e, t, n, r);
  }
  interpolate_(e, t, n, r) {
    const s = this.resultBuffer,
      a = this.sampleValues,
      o = this.valueSize,
      A = e * o,
      l = A - o,
      c = (n - t) / (r - t),
      h = 1 - c;
    for (let d = 0; d !== o; ++d) s[d] = a[l + d] * h + a[A + d] * c;
    return s;
  }
}

class Oj extends zs {
  constructor(e, t, n, r) {
    super(e, t, n, r);
  }
  interpolate_(e) {
    return this.copySampleValue_(e - 1);
  }
}

class Hj extends zs {
  interpolate_(e, t, n, r) {
    const s = this.resultBuffer,
      a = this.sampleValues,
      o = this.valueSize,
      A = e * o,
      l = A - o,
      c = this.inTangents,
      h = this.outTangents;
    if (!c || !h) {
      const p = (n - t) / (r - t),
        v = 1 - p;
      for (let g = 0; g !== o; ++g) s[g] = a[l + g] * v + a[A + g] * p;
      return s;
    }
    const d = o * 2,
      u = e - 1;
    for (let p = 0; p !== o; ++p) {
      const v = a[l + p],
        g = a[A + p],
        m = u * d + p * 2,
        y = h[m],
        C = h[m + 1],
        E = e * d + p * 2,
        w = c[E],
        S = c[E + 1];
      let k = (n - t) / (r - t),
        x,
        T,
        R,
        D,
        N;
      for (let X = 0; X < 8; X++) {
        ((x = k * k), (T = x * k), (R = 1 - k), (D = R * R), (N = D * R));
        const H = N * t + 3 * D * k * y + 3 * R * x * w + T * r - n;
        if (Math.abs(H) < 1e-10) break;
        const V = 3 * D * (y - t) + 6 * R * k * (w - y) + 3 * x * (r - w);
        if (Math.abs(V) < 1e-10) break;
        ((k = k - H / V), (k = Math.max(0, Math.min(1, k))));
      }
      s[p] = N * v + 3 * D * k * C + 3 * R * x * S + T * g;
    }
    return s;
  }
}

class nr {
  constructor(e, t, n, r) {
    if (e === void 0)
      throw new Error("THREE.KeyframeTrack: track name is undefined");
    if (t === void 0 || t.length === 0)
      throw new Error("THREE.KeyframeTrack: no keyframes in track named " + e);
    ((this.name = e),
      (this.times = zo(t, this.TimeBufferType)),
      (this.values = zo(n, this.ValueBufferType)),
      this.setInterpolation(r || this.DefaultInterpolation));
  }
  static toJSON(e) {
    const t = e.constructor;
    let n;
    if (t.toJSON !== this.toJSON) n = t.toJSON(e);
    else {
      n = {
        name: e.name,
        times: zo(e.times, Array),
        values: zo(e.values, Array),
      };
      const r = e.getInterpolation();
      r !== e.DefaultInterpolation && (n.interpolation = r);
    }
    return ((n.type = e.ValueTypeName), n);
  }
  InterpolantFactoryMethodDiscrete(e) {
    return new Oj(this.times, this.values, this.getValueSize(), e);
  }
  InterpolantFactoryMethodLinear(e) {
    return new Gj(this.times, this.values, this.getValueSize(), e);
  }
  InterpolantFactoryMethodSmooth(e) {
    return new Nj(this.times, this.values, this.getValueSize(), e);
  }
  InterpolantFactoryMethodBezier(e) {
    const t = new Hj(this.times, this.values, this.getValueSize(), e);
    return (
      this.settings &&
        ((t.inTangents = this.settings.inTangents),
        (t.outTangents = this.settings.outTangents)),
      t
    );
  }
  setInterpolation(e) {
    let t;
    switch (e) {
      case Ha:
        t = this.InterpolantFactoryMethodDiscrete;
        break;
      case Ua:
        t = this.InterpolantFactoryMethodLinear;
        break;
      case yl:
        t = this.InterpolantFactoryMethodSmooth;
        break;
      case au:
        t = this.InterpolantFactoryMethodBezier;
        break;
    }
    if (t === void 0) {
      const n =
        "unsupported interpolation for " +
        this.ValueTypeName +
        " keyframe track named " +
        this.name;
      if (this.createInterpolant === void 0)
        if (e !== this.DefaultInterpolation)
          this.setInterpolation(this.DefaultInterpolation);
        else throw new Error(n);
      return (it("KeyframeTrack:", n), this);
    }
    return ((this.createInterpolant = t), this);
  }
  getInterpolation() {
    switch (this.createInterpolant) {
      case this.InterpolantFactoryMethodDiscrete:
        return Ha;
      case this.InterpolantFactoryMethodLinear:
        return Ua;
      case this.InterpolantFactoryMethodSmooth:
        return yl;
      case this.InterpolantFactoryMethodBezier:
        return au;
    }
  }
  getValueSize() {
    return this.values.length / this.times.length;
  }
  shift(e) {
    if (e !== 0) {
      const t = this.times;
      for (let n = 0, r = t.length; n !== r; ++n) t[n] += e;
    }
    return this;
  }
  scale(e) {
    if (e !== 1) {
      const t = this.times;
      for (let n = 0, r = t.length; n !== r; ++n) t[n] *= e;
    }
    return this;
  }
  trim(e, t) {
    const n = this.times,
      r = n.length;
    let s = 0,
      a = r - 1;
    for (; s !== r && n[s] < e; ) ++s;
    for (; a !== -1 && n[a] > t; ) --a;
    if ((++a, s !== 0 || a !== r)) {
      s >= a && ((a = Math.max(a, 1)), (s = a - 1));
      const o = this.getValueSize();
      ((this.times = n.slice(s, a)),
        (this.values = this.values.slice(s * o, a * o)));
    }
    return this;
  }
  validate() {
    let e = !0;
    const t = this.getValueSize();
    t - Math.floor(t) !== 0 &&
      (ut("KeyframeTrack: Invalid value size in track.", this), (e = !1));
    const n = this.times,
      r = this.values,
      s = n.length;
    s === 0 && (ut("KeyframeTrack: Track is empty.", this), (e = !1));
    let a = null;
    for (let o = 0; o !== s; o++) {
      const A = n[o];
      if (typeof A == "number" && isNaN(A)) {
        (ut("KeyframeTrack: Time is not a valid number.", this, o, A),
          (e = !1));
        break;
      }
      if (a !== null && a > A) {
        (ut("KeyframeTrack: Out of order keys.", this, o, A, a), (e = !1));
        break;
      }
      a = A;
    }
    if (r !== void 0 && av(r))
      for (let o = 0, A = r.length; o !== A; ++o) {
        const l = r[o];
        if (isNaN(l)) {
          (ut("KeyframeTrack: Value is not a valid number.", this, o, l),
            (e = !1));
          break;
        }
      }
    return e;
  }
  optimize() {
    const e = this.times.slice(),
      t = this.values.slice(),
      n = this.getValueSize(),
      r = this.getInterpolation() === yl,
      s = e.length - 1;
    let a = 1;
    for (let o = 1; o < s; ++o) {
      let A = !1;
      const l = e[o],
        c = e[o + 1];
      if (l !== c && (o !== 1 || l !== e[0]))
        if (r) A = !0;
        else {
          const h = o * n,
            d = h - n,
            u = h + n;
          for (let p = 0; p !== n; ++p) {
            const v = t[h + p];
            if (v !== t[d + p] || v !== t[u + p]) {
              A = !0;
              break;
            }
          }
        }
      if (A) {
        if (o !== a) {
          e[a] = e[o];
          const h = o * n,
            d = a * n;
          for (let u = 0; u !== n; ++u) t[d + u] = t[h + u];
        }
        ++a;
      }
    }
    if (s > 0) {
      e[a] = e[s];
      for (let o = s * n, A = a * n, l = 0; l !== n; ++l) t[A + l] = t[o + l];
      ++a;
    }
    return (
      a !== e.length
        ? ((this.times = e.slice(0, a)), (this.values = t.slice(0, a * n)))
        : ((this.times = e), (this.values = t)),
      this
    );
  }
  clone() {
    const e = this.times.slice(),
      t = this.values.slice(),
      n = this.constructor,
      r = new n(this.name, e, t);
    return ((r.createInterpolant = this.createInterpolant), r);
  }
}

nr.prototype.ValueTypeName = "";

nr.prototype.TimeBufferType = Float32Array;

nr.prototype.ValueBufferType = Float32Array;

nr.prototype.DefaultInterpolation = Ua;

class Vs extends nr {
  constructor(e, t, n) {
    super(e, t, n);
  }
}

Vs.prototype.ValueTypeName = "bool";

Vs.prototype.ValueBufferType = Array;

Vs.prototype.DefaultInterpolation = Ha;

Vs.prototype.InterpolantFactoryMethodLinear = void 0;

Vs.prototype.InterpolantFactoryMethodSmooth = void 0;

class Qm extends nr {
  constructor(e, t, n, r) {
    super(e, t, n, r);
  }
}

Qm.prototype.ValueTypeName = "color";

class Za extends nr {
  constructor(e, t, n, r) {
    super(e, t, n, r);
  }
}

Za.prototype.ValueTypeName = "number";

class Uj extends zs {
  constructor(e, t, n, r) {
    super(e, t, n, r);
  }
  interpolate_(e, t, n, r) {
    const s = this.resultBuffer,
      a = this.sampleValues,
      o = this.valueSize,
      A = (n - t) / (r - t);
    let l = e * o;
    for (let c = l + o; l !== c; l += 4) jn.slerpFlat(s, 0, a, l - o, a, l, A);
    return s;
  }
}

class Qa extends nr {
  constructor(e, t, n, r) {
    super(e, t, n, r);
  }
  InterpolantFactoryMethodLinear(e) {
    return new Uj(this.times, this.values, this.getValueSize(), e);
  }
}

Qa.prototype.ValueTypeName = "quaternion";

Qa.prototype.InterpolantFactoryMethodSmooth = void 0;

class Ws extends nr {
  constructor(e, t, n) {
    super(e, t, n);
  }
}

Ws.prototype.ValueTypeName = "string";

Ws.prototype.ValueBufferType = Array;

Ws.prototype.DefaultInterpolation = Ha;

Ws.prototype.InterpolantFactoryMethodLinear = void 0;

Ws.prototype.InterpolantFactoryMethodSmooth = void 0;

class DA extends nr {
  constructor(e, t, n, r) {
    super(e, t, n, r);
  }
}

DA.prototype.ValueTypeName = "vector";

class qj {
  constructor(e = "", t = -1, n = [], r = Jg) {
    ((this.name = e),
      (this.tracks = n),
      (this.duration = t),
      (this.blendMode = r),
      (this.uuid = Un()),
      (this.userData = {}),
      this.duration < 0 && this.resetDuration());
  }
  static parse(e) {
    const t = [],
      n = e.tracks,
      r = 1 / (e.fps || 1);
    for (let a = 0, o = n.length; a !== o; ++a) t.push(zj(n[a]).scale(r));
    const s = new this(e.name, e.duration, t, e.blendMode);
    return (
      (s.uuid = e.uuid),
      (s.userData = JSON.parse(e.userData || "{}")),
      s
    );
  }
  static toJSON(e) {
    const t = [],
      n = e.tracks,
      r = {
        name: e.name,
        duration: e.duration,
        tracks: t,
        uuid: e.uuid,
        blendMode: e.blendMode,
        userData: JSON.stringify(e.userData),
      };
    for (let s = 0, a = n.length; s !== a; ++s) t.push(nr.toJSON(n[s]));
    return r;
  }
  static CreateFromMorphTargetSequence(e, t, n, r) {
    const s = t.length,
      a = [];
    for (let o = 0; o < s; o++) {
      let A = [],
        l = [];
      (A.push((o + s - 1) % s, o, (o + 1) % s), l.push(0, 1, 0));
      const c = Fj(A);
      ((A = Yu(A, 1, c)),
        (l = Yu(l, 1, c)),
        !r && A[0] === 0 && (A.push(s), l.push(l[0])),
        a.push(
          new Za(".morphTargetInfluences[" + t[o].name + "]", A, l).scale(
            1 / n,
          ),
        ));
    }
    return new this(e, -1, a);
  }
  static findByName(e, t) {
    let n = e;
    if (!Array.isArray(e)) {
      const r = e;
      n = (r.geometry && r.geometry.animations) || r.animations;
    }
    for (let r = 0; r < n.length; r++) if (n[r].name === t) return n[r];
    return null;
  }
  static CreateClipsFromMorphTargetSequences(e, t, n) {
    const r = {},
      s = /^([\w-]*?)([\d]+)$/;
    for (let o = 0, A = e.length; o < A; o++) {
      const l = e[o],
        c = l.name.match(s);
      if (c && c.length > 1) {
        const h = c[1];
        let d = r[h];
        (d || (r[h] = d = []), d.push(l));
      }
    }
    const a = [];
    for (const o in r)
      a.push(this.CreateFromMorphTargetSequence(o, r[o], t, n));
    return a;
  }
  resetDuration() {
    const e = this.tracks;
    let t = 0;
    for (let n = 0, r = e.length; n !== r; ++n) {
      const s = this.tracks[n];
      t = Math.max(t, s.times[s.times.length - 1]);
    }
    return ((this.duration = t), this);
  }
  trim() {
    for (let e = 0; e < this.tracks.length; e++)
      this.tracks[e].trim(0, this.duration);
    return this;
  }
  validate() {
    let e = !0;
    for (let t = 0; t < this.tracks.length; t++)
      e = e && this.tracks[t].validate();
    return e;
  }
  optimize() {
    for (let e = 0; e < this.tracks.length; e++) this.tracks[e].optimize();
    return this;
  }
  clone() {
    const e = [];
    for (let n = 0; n < this.tracks.length; n++) e.push(this.tracks[n].clone());
    const t = new this.constructor(this.name, this.duration, e, this.blendMode);
    return ((t.userData = JSON.parse(JSON.stringify(this.userData))), t);
  }
  toJSON() {
    return this.constructor.toJSON(this);
  }
}

function $j(i) {
  switch (i.toLowerCase()) {
    case "scalar":
    case "double":
    case "float":
    case "number":
    case "integer":
      return Za;
    case "vector":
    case "vector2":
    case "vector3":
    case "vector4":
      return DA;
    case "color":
      return Qm;
    case "quaternion":
      return Qa;
    case "bool":
    case "boolean":
      return Vs;
    case "string":
      return Ws;
  }
  throw new Error("THREE.KeyframeTrack: Unsupported typeName: " + i);
}

function zj(i) {
  if (i.type === void 0)
    throw new Error("THREE.KeyframeTrack: track type undefined, can not parse");
  const e = $j(i.type);
  if (i.times === void 0) {
    const t = [],
      n = [];
    (Dj(i.keys, t, n, "value"), (i.times = t), (i.values = n));
  }
  return e.parse !== void 0
    ? e.parse(i)
    : new e(i.name, i.times, i.values, i.interpolation);
}

const Fr = {
  enabled: !1,
  files: {},
  add: function (i, e) {
    this.enabled !== !1 && (Zu(i) || (this.files[i] = e));
  },
  get: function (i) {
    if (this.enabled !== !1 && !Zu(i)) return this.files[i];
  },
  remove: function (i) {
    delete this.files[i];
  },
  clear: function () {
    this.files = {};
  },
};

function Zu(i) {
  try {
    const e = i.slice(i.indexOf(":") + 1);
    return new URL(e).protocol === "blob:";
  } catch {
    return !1;
  }
}

class Vj {
  constructor(e, t, n) {
    const r = this;
    let s = !1,
      a = 0,
      o = 0,
      A;
    const l = [];
    ((this.onStart = void 0),
      (this.onLoad = e),
      (this.onProgress = t),
      (this.onError = n),
      (this._abortController = null),
      (this.itemStart = function (c) {
        (o++, s === !1 && r.onStart !== void 0 && r.onStart(c, a, o), (s = !0));
      }),
      (this.itemEnd = function (c) {
        (a++,
          r.onProgress !== void 0 && r.onProgress(c, a, o),
          a === o && ((s = !1), r.onLoad !== void 0 && r.onLoad()));
      }),
      (this.itemError = function (c) {
        r.onError !== void 0 && r.onError(c);
      }),
      (this.resolveURL = function (c) {
        return ((c = c.normalize("NFC")), A ? A(c) : c);
      }),
      (this.setURLModifier = function (c) {
        return ((A = c), this);
      }),
      (this.addHandler = function (c, h) {
        return (l.push(c, h), this);
      }),
      (this.removeHandler = function (c) {
        const h = l.indexOf(c);
        return (h !== -1 && l.splice(h, 2), this);
      }),
      (this.getHandler = function (c) {
        for (let h = 0, d = l.length; h < d; h += 2) {
          const u = l[h],
            p = l[h + 1];
          if ((u.global && (u.lastIndex = 0), u.test(c))) return p;
        }
        return null;
      }),
      (this.abort = function () {
        return (
          this.abortController.abort(),
          (this._abortController = null),
          this
        );
      }));
  }
  get abortController() {
    return (
      this._abortController || (this._abortController = new AbortController()),
      this._abortController
    );
  }
}

const Wj = new Vj();

class Xi {
  constructor(e) {
    ((this.manager = e !== void 0 ? e : Wj),
      (this.crossOrigin = "anonymous"),
      (this.withCredentials = !1),
      (this.path = ""),
      (this.resourcePath = ""),
      (this.requestHeader = {}),
      typeof __THREE_DEVTOOLS__ < "u" &&
        __THREE_DEVTOOLS__.dispatchEvent(
          new CustomEvent("observe", { detail: this }),
        ));
  }
  load() {}
  loadAsync(e, t) {
    const n = this;
    return new Promise(function (r, s) {
      n.load(e, r, t, s);
    });
  }
  parse() {}
  setCrossOrigin(e) {
    return ((this.crossOrigin = e), this);
  }
  setWithCredentials(e) {
    return ((this.withCredentials = e), this);
  }
  setPath(e) {
    return ((this.path = e), this);
  }
  setResourcePath(e) {
    return ((this.resourcePath = e), this);
  }
  setRequestHeader(e) {
    return ((this.requestHeader = e), this);
  }
  abort() {
    return this;
  }
}

Xi.DEFAULT_MATERIAL_NAME = "__DEFAULT";

const Rr = {};

class Xj extends Error {
  constructor(e, t) {
    (super(e), (this.response = t));
  }
}

class Pd extends Xi {
  constructor(e) {
    (super(e),
      (this.mimeType = ""),
      (this.responseType = ""),
      (this._abortController = new AbortController()));
  }
  load(e, t, n, r) {
    (e === void 0 && (e = ""),
      this.path !== void 0 && (e = this.path + e),
      (e = this.manager.resolveURL(e)));
    const s = Fr.get(`file:${e}`);
    if (s !== void 0) {
      (this.manager.itemStart(e),
        setTimeout(() => {
          (t && t(s), this.manager.itemEnd(e));
        }, 0));
      return;
    }
    if (Rr[e] !== void 0) {
      Rr[e].push({ onLoad: t, onProgress: n, onError: r });
      return;
    }
    ((Rr[e] = []), Rr[e].push({ onLoad: t, onProgress: n, onError: r }));
    const a = new Request(e, {
        headers: new Headers(this.requestHeader),
        credentials: this.withCredentials ? "include" : "same-origin",
        signal:
          typeof AbortSignal.any == "function"
            ? AbortSignal.any([
                this._abortController.signal,
                this.manager.abortController.signal,
              ])
            : this._abortController.signal,
      }),
      o = this.mimeType,
      A = this.responseType;
    (fetch(a)
      .then((l) => {
        if (l.status === 200 || l.status === 0) {
          if (
            (l.status === 0 && it("FileLoader: HTTP Status 0 received."),
            typeof ReadableStream > "u" ||
              l.body === void 0 ||
              l.body.getReader === void 0)
          )
            return l;
          const c = Rr[e],
            h = l.body.getReader(),
            d = l.headers.get("X-File-Size") || l.headers.get("Content-Length"),
            u = d ? parseInt(d) : 0,
            p = u !== 0;
          let v = 0;
          const g = new ReadableStream({
            start(m) {
              y();
              function y() {
                h.read().then(
                  ({ done: C, value: E }) => {
                    if (C) m.close();
                    else {
                      v += E.byteLength;
                      const w = new ProgressEvent("progress", {
                        lengthComputable: p,
                        loaded: v,
                        total: u,
                      });
                      for (let S = 0, k = c.length; S < k; S++) {
                        const x = c[S];
                        x.onProgress && x.onProgress(w);
                      }
                      (m.enqueue(E), y());
                    }
                  },
                  (C) => {
                    m.error(C);
                  },
                );
              }
            },
          });
          return new Response(g);
        } else
          throw new Xj(
            `fetch for "${l.url}" responded with ${l.status}: ${l.statusText}`,
            l,
          );
      })
      .then((l) => {
        switch (A) {
          case "arraybuffer":
            return l.arrayBuffer();
          case "blob":
            return l.blob();
          case "document":
            return l.text().then((c) => new DOMParser().parseFromString(c, o));
          case "json":
            return l.json();
          default:
            if (o === "") return l.text();
            {
              const h = /charset="?([^;"\s]*)"?/i.exec(o),
                d = h && h[1] ? h[1].toLowerCase() : void 0,
                u = new TextDecoder(d);
              return l.arrayBuffer().then((p) => u.decode(p));
            }
        }
      })
      .then((l) => {
        Fr.add(`file:${e}`, l);
        const c = Rr[e];
        delete Rr[e];
        for (let h = 0, d = c.length; h < d; h++) {
          const u = c[h];
          u.onLoad && u.onLoad(l);
        }
      })
      .catch((l) => {
        const c = Rr[e];
        if (c === void 0) throw (this.manager.itemError(e), l);
        delete Rr[e];
        for (let h = 0, d = c.length; h < d; h++) {
          const u = c[h];
          u.onError && u.onError(l);
        }
        this.manager.itemError(e);
      })
      .finally(() => {
        this.manager.itemEnd(e);
      }),
      this.manager.itemStart(e));
  }
  setResponseType(e) {
    return ((this.responseType = e), this);
  }
  setMimeType(e) {
    return ((this.mimeType = e), this);
  }
  abort() {
    return (
      this._abortController.abort(),
      (this._abortController = new AbortController()),
      this
    );
  }
}

const us = new WeakMap();

class Jj extends Xi {
  constructor(e) {
    super(e);
  }
  load(e, t, n, r) {
    (this.path !== void 0 && (e = this.path + e),
      (e = this.manager.resolveURL(e)));
    const s = this,
      a = Fr.get(`image:${e}`);
    if (a !== void 0) {
      if (a.complete === !0)
        (s.manager.itemStart(e),
          setTimeout(function () {
            (t && t(a), s.manager.itemEnd(e));
          }, 0));
      else {
        let h = us.get(a);
        (h === void 0 && ((h = []), us.set(a, h)),
          h.push({ onLoad: t, onError: r }));
      }
      return a;
    }
    const o = za("img");
    function A() {
      (c(), t && t(this));
      const h = us.get(this) || [];
      for (let d = 0; d < h.length; d++) {
        const u = h[d];
        u.onLoad && u.onLoad(this);
      }
      (us.delete(this), s.manager.itemEnd(e));
    }
    function l(h) {
      (c(), r && r(h), Fr.remove(`image:${e}`));
      const d = us.get(this) || [];
      for (let u = 0; u < d.length; u++) {
        const p = d[u];
        p.onError && p.onError(h);
      }
      (us.delete(this), s.manager.itemError(e), s.manager.itemEnd(e));
    }
    function c() {
      (o.removeEventListener("load", A, !1),
        o.removeEventListener("error", l, !1));
    }
    return (
      o.addEventListener("load", A, !1),
      o.addEventListener("error", l, !1),
      e.slice(0, 5) !== "data:" &&
        this.crossOrigin !== void 0 &&
        (o.crossOrigin = this.crossOrigin),
      Fr.add(`image:${e}`, o),
      s.manager.itemStart(e),
      (o.src = e),
      o
    );
  }
}

class Ao extends Xi {
  constructor(e) {
    super(e);
  }
  load(e, t, n, r) {
    const s = new Zt(),
      a = new Jj(this.manager);
    return (
      a.setCrossOrigin(this.crossOrigin),
      a.setPath(this.path),
      a.load(
        e,
        function (o) {
          ((s.image = o), (s.needsUpdate = !0), t !== void 0 && t(s));
        },
        n,
        r,
      ),
      s
    );
  }
}

class ai extends It {
  constructor(e, t = 1) {
    (super(),
      (this.isLight = !0),
      (this.type = "Light"),
      (this.color = new Ne(e)),
      (this.intensity = t));
  }
  dispose() {
    this.dispatchEvent({ type: "dispose" });
  }
  copy(e, t) {
    return (
      super.copy(e, t),
      this.color.copy(e.color),
      (this.intensity = e.intensity),
      this
    );
  }
  toJSON(e) {
    const t = super.toJSON(e);
    return (
      (t.object.color = this.color.getHex()),
      (t.object.intensity = this.intensity),
      t
    );
  }
}

class e0 extends ai {
  constructor(e, t, n) {
    (super(e, n),
      (this.isHemisphereLight = !0),
      (this.type = "HemisphereLight"),
      this.position.copy(It.DEFAULT_UP),
      this.updateMatrix(),
      (this.groundColor = new Ne(t)));
  }
  copy(e, t) {
    return (super.copy(e, t), this.groundColor.copy(e.groundColor), this);
  }
  toJSON(e) {
    const t = super.toJSON(e);
    return ((t.object.groundColor = this.groundColor.getHex()), t);
  }
}

const Ql = new mt();

const Qu = new F();

const ef = new F();

class Id {
  constructor(e) {
    ((this.camera = e),
      (this.intensity = 1),
      (this.bias = 0),
      (this.biasNode = null),
      (this.normalBias = 0),
      (this.radius = 1),
      (this.blurSamples = 8),
      (this.mapSize = new Ae(512, 512)),
      (this.mapType = Mn),
      (this.map = null),
      (this.mapPass = null),
      (this.matrix = new mt()),
      (this.autoUpdate = !0),
      (this.needsUpdate = !1),
      (this._frustum = new Cd()),
      (this._frameExtents = new Ae(1, 1)),
      (this._viewportCount = 1),
      (this._viewports = [new Pt(0, 0, 1, 1)]));
  }
  getViewportCount() {
    return this._viewportCount;
  }
  getFrustum() {
    return this._frustum;
  }
  updateMatrices(e) {
    const t = this.camera,
      n = this.matrix;
    (Qu.setFromMatrixPosition(e.matrixWorld),
      t.position.copy(Qu),
      ef.setFromMatrixPosition(e.target.matrixWorld),
      t.lookAt(ef),
      t.updateMatrixWorld(),
      Ql.multiplyMatrices(t.projectionMatrix, t.matrixWorldInverse),
      this._frustum.setFromProjectionMatrix(
        Ql,
        t.coordinateSystem,
        t.reversedDepth,
      ),
      t.coordinateSystem === $a || t.reversedDepth
        ? n.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 1, 0, 0, 0, 0, 1)
        : n.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1),
      n.multiply(Ql));
  }
  getViewport(e) {
    return this._viewports[e];
  }
  getFrameExtents() {
    return this._frameExtents;
  }
  dispose() {
    (this.map && this.map.dispose(), this.mapPass && this.mapPass.dispose());
  }
  copy(e) {
    return (
      (this.camera = e.camera.clone()),
      (this.intensity = e.intensity),
      (this.bias = e.bias),
      (this.radius = e.radius),
      (this.autoUpdate = e.autoUpdate),
      (this.needsUpdate = e.needsUpdate),
      (this.normalBias = e.normalBias),
      (this.blurSamples = e.blurSamples),
      this.mapSize.copy(e.mapSize),
      (this.biasNode = e.biasNode),
      this
    );
  }
  clone() {
    return new this.constructor().copy(this);
  }
  toJSON() {
    const e = {};
    return (
      this.intensity !== 1 && (e.intensity = this.intensity),
      this.bias !== 0 && (e.bias = this.bias),
      this.normalBias !== 0 && (e.normalBias = this.normalBias),
      this.radius !== 1 && (e.radius = this.radius),
      (this.mapSize.x !== 512 || this.mapSize.y !== 512) &&
        (e.mapSize = this.mapSize.toArray()),
      (e.camera = this.camera.toJSON(!1).object),
      delete e.camera.matrix,
      e
    );
  }
}

const Vo = new F();

const Wo = new jn();

const Ar = new F();

class Ld extends It {
  constructor() {
    (super(),
      (this.isCamera = !0),
      (this.type = "Camera"),
      (this.matrixWorldInverse = new mt()),
      (this.projectionMatrix = new mt()),
      (this.projectionMatrixInverse = new mt()),
      (this.coordinateSystem = mr),
      (this._reversedDepth = !1));
  }
  get reversedDepth() {
    return this._reversedDepth;
  }
  copy(e, t) {
    return (
      super.copy(e, t),
      this.matrixWorldInverse.copy(e.matrixWorldInverse),
      this.projectionMatrix.copy(e.projectionMatrix),
      this.projectionMatrixInverse.copy(e.projectionMatrixInverse),
      (this.coordinateSystem = e.coordinateSystem),
      this
    );
  }
  getWorldDirection(e) {
    return super.getWorldDirection(e).negate();
  }
  updateMatrixWorld(e) {
    (super.updateMatrixWorld(e),
      this.matrixWorld.decompose(Vo, Wo, Ar),
      Ar.x === 1 && Ar.y === 1 && Ar.z === 1
        ? this.matrixWorldInverse.copy(this.matrixWorld).invert()
        : this.matrixWorldInverse.compose(Vo, Wo, Ar.set(1, 1, 1)).invert());
  }
  updateWorldMatrix(e, t, n = !1) {
    (super.updateWorldMatrix(e, t, n),
      this.matrixWorld.decompose(Vo, Wo, Ar),
      Ar.x === 1 && Ar.y === 1 && Ar.z === 1
        ? this.matrixWorldInverse.copy(this.matrixWorld).invert()
        : this.matrixWorldInverse.compose(Vo, Wo, Ar.set(1, 1, 1)).invert());
  }
  clone() {
    return new this.constructor().copy(this);
  }
}

const Kr = new F();

const tf = new Ae();

const nf = new Ae();

class fn extends Ld {
  constructor(e = 50, t = 1, n = 0.1, r = 2e3) {
    (super(),
      (this.isPerspectiveCamera = !0),
      (this.type = "PerspectiveCamera"),
      (this.fov = e),
      (this.zoom = 1),
      (this.near = n),
      (this.far = r),
      (this.focus = 10),
      (this.aspect = t),
      (this.view = null),
      (this.filmGauge = 35),
      (this.filmOffset = 0),
      this.updateProjectionMatrix());
  }
  copy(e, t) {
    return (
      super.copy(e, t),
      (this.fov = e.fov),
      (this.zoom = e.zoom),
      (this.near = e.near),
      (this.far = e.far),
      (this.focus = e.focus),
      (this.aspect = e.aspect),
      (this.view = e.view === null ? null : Object.assign({}, e.view)),
      (this.filmGauge = e.filmGauge),
      (this.filmOffset = e.filmOffset),
      this
    );
  }
  setFocalLength(e) {
    const t = (0.5 * this.getFilmHeight()) / e;
    ((this.fov = Ns * 2 * Math.atan(t)), this.updateProjectionMatrix());
  }
  getFocalLength() {
    const e = Math.tan(Bs * 0.5 * this.fov);
    return (0.5 * this.getFilmHeight()) / e;
  }
  getEffectiveFOV() {
    return Ns * 2 * Math.atan(Math.tan(Bs * 0.5 * this.fov) / this.zoom);
  }
  getFilmWidth() {
    return this.filmGauge * Math.min(this.aspect, 1);
  }
  getFilmHeight() {
    return this.filmGauge / Math.max(this.aspect, 1);
  }
  getViewBounds(e, t, n) {
    (Kr.set(-1, -1, 0.5).applyMatrix4(this.projectionMatrixInverse),
      t.set(Kr.x, Kr.y).multiplyScalar(-e / Kr.z),
      Kr.set(1, 1, 0.5).applyMatrix4(this.projectionMatrixInverse),
      n.set(Kr.x, Kr.y).multiplyScalar(-e / Kr.z));
  }
  getViewSize(e, t) {
    return (this.getViewBounds(e, tf, nf), t.subVectors(nf, tf));
  }
  setViewOffset(e, t, n, r, s, a) {
    ((this.aspect = e / t),
      this.view === null &&
        (this.view = {
          enabled: !0,
          fullWidth: 1,
          fullHeight: 1,
          offsetX: 0,
          offsetY: 0,
          width: 1,
          height: 1,
        }),
      (this.view.enabled = !0),
      (this.view.fullWidth = e),
      (this.view.fullHeight = t),
      (this.view.offsetX = n),
      (this.view.offsetY = r),
      (this.view.width = s),
      (this.view.height = a),
      this.updateProjectionMatrix());
  }
  clearViewOffset() {
    (this.view !== null && (this.view.enabled = !1),
      this.updateProjectionMatrix());
  }
  updateProjectionMatrix() {
    const e = this.near;
    let t = (e * Math.tan(Bs * 0.5 * this.fov)) / this.zoom,
      n = 2 * t,
      r = this.aspect * n,
      s = -0.5 * r;
    const a = this.view;
    if (this.view !== null && this.view.enabled) {
      const A = a.fullWidth,
        l = a.fullHeight;
      ((s += (a.offsetX * r) / A),
        (t -= (a.offsetY * n) / l),
        (r *= a.width / A),
        (n *= a.height / l));
    }
    const o = this.filmOffset;
    (o !== 0 && (s += (e * o) / this.getFilmWidth()),
      this.projectionMatrix.makePerspective(
        s,
        s + r,
        t,
        t - n,
        e,
        this.far,
        this.coordinateSystem,
        this.reversedDepth,
      ),
      this.projectionMatrixInverse.copy(this.projectionMatrix).invert());
  }
  toJSON(e) {
    const t = super.toJSON(e);
    return (
      (t.object.fov = this.fov),
      (t.object.zoom = this.zoom),
      (t.object.near = this.near),
      (t.object.far = this.far),
      (t.object.focus = this.focus),
      (t.object.aspect = this.aspect),
      this.view !== null && (t.object.view = Object.assign({}, this.view)),
      (t.object.filmGauge = this.filmGauge),
      (t.object.filmOffset = this.filmOffset),
      t
    );
  }
}

class Kj extends Id {
  constructor() {
    (super(new fn(50, 1, 0.5, 500)),
      (this.isSpotLightShadow = !0),
      (this.focus = 1),
      (this.aspect = 1));
  }
  updateMatrices(e) {
    const t = this.camera,
      n = Ns * 2 * e.angle * this.focus,
      r = (this.mapSize.width / this.mapSize.height) * this.aspect,
      s = e.distance || t.far;
    ((n !== t.fov || r !== t.aspect || s !== t.far) &&
      ((t.fov = n), (t.aspect = r), (t.far = s), t.updateProjectionMatrix()),
      super.updateMatrices(e));
  }
  copy(e) {
    return (super.copy(e), (this.focus = e.focus), this);
  }
}

class Yj extends ai {
  constructor(e, t, n = 0, r = Math.PI / 3, s = 0, a = 2) {
    (super(e, t),
      (this.isSpotLight = !0),
      (this.type = "SpotLight"),
      this.position.copy(It.DEFAULT_UP),
      this.updateMatrix(),
      (this.target = new It()),
      (this.distance = n),
      (this.angle = r),
      (this.penumbra = s),
      (this.decay = a),
      (this.map = null),
      (this.shadow = new Kj()));
  }
  get power() {
    return this.intensity * Math.PI;
  }
  set power(e) {
    this.intensity = e / Math.PI;
  }
  dispose() {
    (super.dispose(), this.shadow.dispose());
  }
  copy(e, t) {
    return (
      super.copy(e, t),
      (this.distance = e.distance),
      (this.angle = e.angle),
      (this.penumbra = e.penumbra),
      (this.decay = e.decay),
      (this.target = e.target.clone()),
      (this.map = e.map),
      (this.shadow = e.shadow.clone()),
      this
    );
  }
  toJSON(e) {
    const t = super.toJSON(e);
    return (
      (t.object.distance = this.distance),
      (t.object.angle = this.angle),
      (t.object.decay = this.decay),
      (t.object.penumbra = this.penumbra),
      (t.object.target = this.target.uuid),
      this.map &&
        this.map.isTexture &&
        (t.object.map = this.map.toJSON(e).uuid),
      (t.object.shadow = this.shadow.toJSON()),
      t
    );
  }
}

class Zj extends Id {
  constructor() {
    (super(new fn(90, 1, 0.5, 500)), (this.isPointLightShadow = !0));
  }
}

class Fd extends ai {
  constructor(e, t, n = 0, r = 2) {
    (super(e, t),
      (this.isPointLight = !0),
      (this.type = "PointLight"),
      (this.distance = n),
      (this.decay = r),
      (this.shadow = new Zj()));
  }
  get power() {
    return this.intensity * 4 * Math.PI;
  }
  set power(e) {
    this.intensity = e / (4 * Math.PI);
  }
  dispose() {
    (super.dispose(), this.shadow.dispose());
  }
  copy(e, t) {
    return (
      super.copy(e, t),
      (this.distance = e.distance),
      (this.decay = e.decay),
      (this.shadow = e.shadow.clone()),
      this
    );
  }
  toJSON(e) {
    const t = super.toJSON(e);
    return (
      (t.object.distance = this.distance),
      (t.object.decay = this.decay),
      (t.object.shadow = this.shadow.toJSON()),
      t
    );
  }
}

class lo extends Ld {
  constructor(e = -1, t = 1, n = 1, r = -1, s = 0.1, a = 2e3) {
    (super(),
      (this.isOrthographicCamera = !0),
      (this.type = "OrthographicCamera"),
      (this.zoom = 1),
      (this.view = null),
      (this.left = e),
      (this.right = t),
      (this.top = n),
      (this.bottom = r),
      (this.near = s),
      (this.far = a),
      this.updateProjectionMatrix());
  }
  copy(e, t) {
    return (
      super.copy(e, t),
      (this.left = e.left),
      (this.right = e.right),
      (this.top = e.top),
      (this.bottom = e.bottom),
      (this.near = e.near),
      (this.far = e.far),
      (this.zoom = e.zoom),
      (this.view = e.view === null ? null : Object.assign({}, e.view)),
      this
    );
  }
  setViewOffset(e, t, n, r, s, a) {
    (this.view === null &&
      (this.view = {
        enabled: !0,
        fullWidth: 1,
        fullHeight: 1,
        offsetX: 0,
        offsetY: 0,
        width: 1,
        height: 1,
      }),
      (this.view.enabled = !0),
      (this.view.fullWidth = e),
      (this.view.fullHeight = t),
      (this.view.offsetX = n),
      (this.view.offsetY = r),
      (this.view.width = s),
      (this.view.height = a),
      this.updateProjectionMatrix());
  }
  clearViewOffset() {
    (this.view !== null && (this.view.enabled = !1),
      this.updateProjectionMatrix());
  }
  updateProjectionMatrix() {
    const e = (this.right - this.left) / (2 * this.zoom),
      t = (this.top - this.bottom) / (2 * this.zoom),
      n = (this.right + this.left) / 2,
      r = (this.top + this.bottom) / 2;
    let s = n - e,
      a = n + e,
      o = r + t,
      A = r - t;
    if (this.view !== null && this.view.enabled) {
      const l = (this.right - this.left) / this.view.fullWidth / this.zoom,
        c = (this.top - this.bottom) / this.view.fullHeight / this.zoom;
      ((s += l * this.view.offsetX),
        (a = s + l * this.view.width),
        (o -= c * this.view.offsetY),
        (A = o - c * this.view.height));
    }
    (this.projectionMatrix.makeOrthographic(
      s,
      a,
      o,
      A,
      this.near,
      this.far,
      this.coordinateSystem,
      this.reversedDepth,
    ),
      this.projectionMatrixInverse.copy(this.projectionMatrix).invert());
  }
  toJSON(e) {
    const t = super.toJSON(e);
    return (
      (t.object.zoom = this.zoom),
      (t.object.left = this.left),
      (t.object.right = this.right),
      (t.object.top = this.top),
      (t.object.bottom = this.bottom),
      (t.object.near = this.near),
      (t.object.far = this.far),
      this.view !== null && (t.object.view = Object.assign({}, this.view)),
      t
    );
  }
}

class Qj extends Id {
  constructor() {
    (super(new lo(-5, 5, 5, -5, 0.5, 500)),
      (this.isDirectionalLightShadow = !0));
  }
}

class eo extends ai {
  constructor(e, t) {
    (super(e, t),
      (this.isDirectionalLight = !0),
      (this.type = "DirectionalLight"),
      this.position.copy(It.DEFAULT_UP),
      this.updateMatrix(),
      (this.target = new It()),
      (this.shadow = new Qj()));
  }
  dispose() {
    (super.dispose(), this.shadow.dispose());
  }
  copy(e) {
    return (
      super.copy(e),
      (this.target = e.target.clone()),
      (this.shadow = e.shadow.clone()),
      this
    );
  }
  toJSON(e) {
    const t = super.toJSON(e);
    return (
      (t.object.shadow = this.shadow.toJSON()),
      (t.object.target = this.target.uuid),
      t
    );
  }
}

class Ia {
  static extractUrlBase(e) {
    const t = e.lastIndexOf("/");
    return t === -1 ? "./" : e.slice(0, t + 1);
  }
  static resolveURL(e, t) {
    return typeof e != "string" || e === ""
      ? ""
      : (/^https?:\/\//i.test(t) &&
          /^\//.test(e) &&
          (t = t.replace(/(^https?:\/\/[^\/]+).*/i, "$1")),
        /^(https?:)?\/\//i.test(e) ||
        /^data:.*,.*$/i.test(e) ||
        /^blob:.*$/i.test(e)
          ? e
          : t + e);
  }
}

class al extends Ct {
  constructor() {
    (super(),
      (this.isInstancedBufferGeometry = !0),
      (this.type = "InstancedBufferGeometry"),
      (this.instanceCount = 1 / 0));
  }
  copy(e) {
    return (super.copy(e), (this.instanceCount = e.instanceCount), this);
  }
  toJSON() {
    const e = super.toJSON();
    return (
      (e.instanceCount = this.instanceCount),
      (e.isInstancedBufferGeometry = !0),
      e
    );
  }
}

const ec = new WeakMap();

class e6 extends Xi {
  constructor(e) {
    (super(e),
      (this.isImageBitmapLoader = !0),
      typeof createImageBitmap > "u" &&
        it("ImageBitmapLoader: createImageBitmap() not supported."),
      typeof fetch > "u" && it("ImageBitmapLoader: fetch() not supported."),
      (this.options = { premultiplyAlpha: "none" }),
      (this._abortController = new AbortController()));
  }
  setOptions(e) {
    return ((this.options = e), this);
  }
  load(e, t, n, r) {
    (e === void 0 && (e = ""),
      this.path !== void 0 && (e = this.path + e),
      (e = this.manager.resolveURL(e)));
    const s = this,
      a = Fr.get(`image-bitmap:${e}`);
    if (a !== void 0) {
      if ((s.manager.itemStart(e), a.then)) {
        a.then((l) => {
          ec.has(a) === !0
            ? (r && r(ec.get(a)), s.manager.itemError(e), s.manager.itemEnd(e))
            : (t && t(l), s.manager.itemEnd(e));
        });
        return;
      }
      setTimeout(function () {
        (t && t(a), s.manager.itemEnd(e));
      }, 0);
      return;
    }
    const o = {};
    ((o.credentials =
      this.crossOrigin === "anonymous" ? "same-origin" : "include"),
      (o.headers = this.requestHeader),
      (o.signal =
        typeof AbortSignal.any == "function"
          ? AbortSignal.any([
              this._abortController.signal,
              this.manager.abortController.signal,
            ])
          : this._abortController.signal));
    const A = fetch(e, o)
      .then(function (l) {
        return l.blob();
      })
      .then(function (l) {
        return createImageBitmap(
          l,
          Object.assign(s.options, { colorSpaceConversion: "none" }),
        );
      })
      .then(function (l) {
        (Fr.add(`image-bitmap:${e}`, l), t && t(l), s.manager.itemEnd(e));
      })
      .catch(function (l) {
        (r && r(l),
          ec.set(A, l),
          Fr.remove(`image-bitmap:${e}`),
          s.manager.itemError(e),
          s.manager.itemEnd(e));
      });
    (Fr.add(`image-bitmap:${e}`, A), s.manager.itemStart(e));
  }
  abort() {
    return (
      this._abortController.abort(),
      (this._abortController = new AbortController()),
      this
    );
  }
}

const fs = -90;

const ps = 1;

class t6 extends It {
  constructor(e, t, n) {
    (super(),
      (this.type = "CubeCamera"),
      (this.renderTarget = n),
      (this.coordinateSystem = null),
      (this.activeMipmapLevel = 0));
    const r = new fn(fs, ps, e, t);
    ((r.layers = this.layers), this.add(r));
    const s = new fn(fs, ps, e, t);
    ((s.layers = this.layers), this.add(s));
    const a = new fn(fs, ps, e, t);
    ((a.layers = this.layers), this.add(a));
    const o = new fn(fs, ps, e, t);
    ((o.layers = this.layers), this.add(o));
    const A = new fn(fs, ps, e, t);
    ((A.layers = this.layers), this.add(A));
    const l = new fn(fs, ps, e, t);
    ((l.layers = this.layers), this.add(l));
  }
  updateCoordinateSystem() {
    const e = this.coordinateSystem,
      t = this.children.concat(),
      [n, r, s, a, o, A] = t;
    for (const l of t) this.remove(l);
    if (e === mr)
      (n.up.set(0, 1, 0),
        n.lookAt(1, 0, 0),
        r.up.set(0, 1, 0),
        r.lookAt(-1, 0, 0),
        s.up.set(0, 0, -1),
        s.lookAt(0, 1, 0),
        a.up.set(0, 0, 1),
        a.lookAt(0, -1, 0),
        o.up.set(0, 1, 0),
        o.lookAt(0, 0, 1),
        A.up.set(0, 1, 0),
        A.lookAt(0, 0, -1));
    else if (e === $a)
      (n.up.set(0, -1, 0),
        n.lookAt(-1, 0, 0),
        r.up.set(0, -1, 0),
        r.lookAt(1, 0, 0),
        s.up.set(0, 0, 1),
        s.lookAt(0, 1, 0),
        a.up.set(0, 0, -1),
        a.lookAt(0, -1, 0),
        o.up.set(0, -1, 0),
        o.lookAt(0, 0, 1),
        A.up.set(0, -1, 0),
        A.lookAt(0, 0, -1));
    else
      throw new Error(
        "THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: " +
          e,
      );
    for (const l of t) (this.add(l), l.updateMatrixWorld());
  }
  update(e, t) {
    this.parent === null && this.updateMatrixWorld();
    const { renderTarget: n, activeMipmapLevel: r } = this;
    this.coordinateSystem !== e.coordinateSystem &&
      ((this.coordinateSystem = e.coordinateSystem),
      this.updateCoordinateSystem());
    const [s, a, o, A, l, c] = this.children,
      h = e.getRenderTarget(),
      d = e.getActiveCubeFace(),
      u = e.getActiveMipmapLevel(),
      p = e.xr.enabled;
    e.xr.enabled = !1;
    const v = n.texture.generateMipmaps;
    n.texture.generateMipmaps = !1;
    let g = !1;
    (e.isWebGLRenderer === !0
      ? (g = e.state.buffers.depth.getReversed())
      : (g = e.reversedDepthBuffer),
      e.setRenderTarget(n, 0, r),
      g && e.autoClear === !1 && e.clearDepth(),
      e.render(t, s),
      e.setRenderTarget(n, 1, r),
      g && e.autoClear === !1 && e.clearDepth(),
      e.render(t, a),
      e.setRenderTarget(n, 2, r),
      g && e.autoClear === !1 && e.clearDepth(),
      e.render(t, o),
      e.setRenderTarget(n, 3, r),
      g && e.autoClear === !1 && e.clearDepth(),
      e.render(t, A),
      e.setRenderTarget(n, 4, r),
      g && e.autoClear === !1 && e.clearDepth(),
      e.render(t, l),
      (n.texture.generateMipmaps = v),
      e.setRenderTarget(n, 5, r),
      g && e.autoClear === !1 && e.clearDepth(),
      e.render(t, c),
      e.setRenderTarget(h, d, u),
      (e.xr.enabled = p),
      (n.texture.needsPMREMUpdate = !0));
  }
}

class n6 extends fn {
  constructor(e = []) {
    (super(),
      (this.isArrayCamera = !0),
      (this.isMultiViewCamera = !1),
      (this.cameras = e));
  }
}

class r6 {
  constructor() {
    ((this._previousTime = 0),
      (this._currentTime = 0),
      (this._startTime = performance.now()),
      (this._delta = 0),
      (this._elapsed = 0),
      (this._timescale = 1),
      (this._document = null),
      (this._pageVisibilityHandler = null));
  }
  connect(e) {
    ((this._document = e),
      e.hidden !== void 0 &&
        ((this._pageVisibilityHandler = i6.bind(this)),
        e.addEventListener(
          "visibilitychange",
          this._pageVisibilityHandler,
          !1,
        )));
  }
  disconnect() {
    (this._pageVisibilityHandler !== null &&
      (this._document.removeEventListener(
        "visibilitychange",
        this._pageVisibilityHandler,
      ),
      (this._pageVisibilityHandler = null)),
      (this._document = null));
  }
  getDelta() {
    return this._delta / 1e3;
  }
  getElapsed() {
    return this._elapsed / 1e3;
  }
  getTimescale() {
    return this._timescale;
  }
  setTimescale(e) {
    return ((this._timescale = e), this);
  }
  reset() {
    return ((this._currentTime = performance.now() - this._startTime), this);
  }
  dispose() {
    this.disconnect();
  }
  update(e) {
    return (
      this._pageVisibilityHandler !== null && this._document.hidden === !0
        ? (this._delta = 0)
        : ((this._previousTime = this._currentTime),
          (this._currentTime =
            (e !== void 0 ? e : performance.now()) - this._startTime),
          (this._delta =
            (this._currentTime - this._previousTime) * this._timescale),
          (this._elapsed += this._delta)),
      this
    );
  }
}

function i6() {
  this._document.hidden === !1 && this.reset();
}

const Dd = "\\[\\]\\.:\\/";

const s6 = new RegExp("[" + Dd + "]", "g");

const Nd = "[^" + Dd + "]";

const a6 = "[^" + Dd.replace("\\.", "") + "]";

const o6 = /((?:WC+[\/:])*)/.source.replace("WC", Nd);

const A6 = /(WCOD+)?/.source.replace("WCOD", a6);

const l6 = /(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC", Nd);

const c6 = /\.(WC+)(?:\[(.+)\])?/.source.replace("WC", Nd);

const h6 = new RegExp("^" + o6 + A6 + l6 + c6 + "$");

const d6 = ["material", "materials", "bones", "map"];

class u6 {
  constructor(e, t, n) {
    const r = n || Rt.parseTrackName(t);
    ((this._targetGroup = e), (this._bindings = e.subscribe_(t, r)));
  }
  getValue(e, t) {
    this.bind();
    const n = this._targetGroup.nCachedObjects_,
      r = this._bindings[n];
    r !== void 0 && r.getValue(e, t);
  }
  setValue(e, t) {
    const n = this._bindings;
    for (let r = this._targetGroup.nCachedObjects_, s = n.length; r !== s; ++r)
      n[r].setValue(e, t);
  }
  bind() {
    const e = this._bindings;
    for (let t = this._targetGroup.nCachedObjects_, n = e.length; t !== n; ++t)
      e[t].bind();
  }
  unbind() {
    const e = this._bindings;
    for (let t = this._targetGroup.nCachedObjects_, n = e.length; t !== n; ++t)
      e[t].unbind();
  }
}

class Rt {
  constructor(e, t, n) {
    ((this.path = t),
      (this.parsedPath = n || Rt.parseTrackName(t)),
      (this.node = Rt.findNode(e, this.parsedPath.nodeName)),
      (this.rootNode = e),
      (this.getValue = this._getValue_unbound),
      (this.setValue = this._setValue_unbound));
  }
  static create(e, t, n) {
    return e && e.isAnimationObjectGroup
      ? new Rt.Composite(e, t, n)
      : new Rt(e, t, n);
  }
  static sanitizeNodeName(e) {
    return e.replace(/\s/g, "_").replace(s6, "");
  }
  static parseTrackName(e) {
    const t = h6.exec(e);
    if (t === null)
      throw new Error("THREE.PropertyBinding: Cannot parse trackName: " + e);
    const n = {
        nodeName: t[2],
        objectName: t[3],
        objectIndex: t[4],
        propertyName: t[5],
        propertyIndex: t[6],
      },
      r = n.nodeName && n.nodeName.lastIndexOf(".");
    if (r !== void 0 && r !== -1) {
      const s = n.nodeName.substring(r + 1);
      d6.indexOf(s) !== -1 &&
        ((n.nodeName = n.nodeName.substring(0, r)), (n.objectName = s));
    }
    if (n.propertyName === null || n.propertyName.length === 0)
      throw new Error(
        "THREE.PropertyBinding: can not parse propertyName from trackName: " +
          e,
      );
    return n;
  }
  static findNode(e, t) {
    if (
      t === void 0 ||
      t === "" ||
      t === "." ||
      t === -1 ||
      t === e.name ||
      t === e.uuid
    )
      return e;
    if (e.skeleton) {
      const n = e.skeleton.getBoneByName(t);
      if (n !== void 0) return n;
    }
    if (e.children) {
      const n = function (s) {
          for (let a = 0; a < s.length; a++) {
            const o = s[a];
            if (o.name === t || o.uuid === t) return o;
            const A = n(o.children);
            if (A) return A;
          }
          return null;
        },
        r = n(e.children);
      if (r) return r;
    }
    return null;
  }
  _getValue_unavailable() {}
  _setValue_unavailable() {}
  _getValue_direct(e, t) {
    e[t] = this.targetObject[this.propertyName];
  }
  _getValue_array(e, t) {
    const n = this.resolvedProperty;
    for (let r = 0, s = n.length; r !== s; ++r) e[t++] = n[r];
  }
  _getValue_arrayElement(e, t) {
    e[t] = this.resolvedProperty[this.propertyIndex];
  }
  _getValue_toArray(e, t) {
    this.resolvedProperty.toArray(e, t);
  }
  _setValue_direct(e, t) {
    this.targetObject[this.propertyName] = e[t];
  }
  _setValue_direct_setNeedsUpdate(e, t) {
    ((this.targetObject[this.propertyName] = e[t]),
      (this.targetObject.needsUpdate = !0));
  }
  _setValue_direct_setMatrixWorldNeedsUpdate(e, t) {
    ((this.targetObject[this.propertyName] = e[t]),
      (this.targetObject.matrixWorldNeedsUpdate = !0));
  }
  _setValue_array(e, t) {
    const n = this.resolvedProperty;
    for (let r = 0, s = n.length; r !== s; ++r) n[r] = e[t++];
  }
  _setValue_array_setNeedsUpdate(e, t) {
    const n = this.resolvedProperty;
    for (let r = 0, s = n.length; r !== s; ++r) n[r] = e[t++];
    this.targetObject.needsUpdate = !0;
  }
  _setValue_array_setMatrixWorldNeedsUpdate(e, t) {
    const n = this.resolvedProperty;
    for (let r = 0, s = n.length; r !== s; ++r) n[r] = e[t++];
    this.targetObject.matrixWorldNeedsUpdate = !0;
  }
  _setValue_arrayElement(e, t) {
    this.resolvedProperty[this.propertyIndex] = e[t];
  }
  _setValue_arrayElement_setNeedsUpdate(e, t) {
    ((this.resolvedProperty[this.propertyIndex] = e[t]),
      (this.targetObject.needsUpdate = !0));
  }
  _setValue_arrayElement_setMatrixWorldNeedsUpdate(e, t) {
    ((this.resolvedProperty[this.propertyIndex] = e[t]),
      (this.targetObject.matrixWorldNeedsUpdate = !0));
  }
  _setValue_fromArray(e, t) {
    this.resolvedProperty.fromArray(e, t);
  }
  _setValue_fromArray_setNeedsUpdate(e, t) {
    (this.resolvedProperty.fromArray(e, t),
      (this.targetObject.needsUpdate = !0));
  }
  _setValue_fromArray_setMatrixWorldNeedsUpdate(e, t) {
    (this.resolvedProperty.fromArray(e, t),
      (this.targetObject.matrixWorldNeedsUpdate = !0));
  }
  _getValue_unbound(e, t) {
    (this.bind(), this.getValue(e, t));
  }
  _setValue_unbound(e, t) {
    (this.bind(), this.setValue(e, t));
  }
  bind() {
    let e = this.node;
    const t = this.parsedPath,
      n = t.objectName,
      r = t.propertyName;
    let s = t.propertyIndex;
    if (
      (e || ((e = Rt.findNode(this.rootNode, t.nodeName)), (this.node = e)),
      (this.getValue = this._getValue_unavailable),
      (this.setValue = this._setValue_unavailable),
      !e)
    ) {
      it("PropertyBinding: No target node found for track: " + this.path + ".");
      return;
    }
    if (n) {
      let l = t.objectIndex;
      switch (n) {
        case "materials":
          if (!e.material) {
            ut(
              "PropertyBinding: Can not bind to material as node does not have a material.",
              this,
            );
            return;
          }
          if (!e.material.materials) {
            ut(
              "PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",
              this,
            );
            return;
          }
          e = e.material.materials;
          break;
        case "bones":
          if (!e.skeleton) {
            ut(
              "PropertyBinding: Can not bind to bones as node does not have a skeleton.",
              this,
            );
            return;
          }
          e = e.skeleton.bones;
          for (let c = 0; c < e.length; c++)
            if (e[c].name === l) {
              l = c;
              break;
            }
          break;
        case "map":
          if ("map" in e) {
            e = e.map;
            break;
          }
          if (!e.material) {
            ut(
              "PropertyBinding: Can not bind to material as node does not have a material.",
              this,
            );
            return;
          }
          if (!e.material.map) {
            ut(
              "PropertyBinding: Can not bind to material.map as node.material does not have a map.",
              this,
            );
            return;
          }
          e = e.material.map;
          break;
        default:
          if (e[n] === void 0) {
            ut(
              "PropertyBinding: Can not bind to objectName of node undefined.",
              this,
            );
            return;
          }
          e = e[n];
      }
      if (l !== void 0) {
        if (e[l] === void 0) {
          ut(
            "PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",
            this,
            e,
          );
          return;
        }
        e = e[l];
      }
    }
    const a = e[r];
    if (a === void 0) {
      const l = t.nodeName;
      ut(
        "PropertyBinding: Trying to update property for track: " +
          l +
          "." +
          r +
          " but it wasn't found.",
        e,
      );
      return;
    }
    let o = this.Versioning.None;
    ((this.targetObject = e),
      e.isMaterial === !0
        ? (o = this.Versioning.NeedsUpdate)
        : e.isObject3D === !0 && (o = this.Versioning.MatrixWorldNeedsUpdate));
    let A = this.BindingType.Direct;
    if (s !== void 0) {
      if (r === "morphTargetInfluences") {
        if (!e.geometry) {
          ut(
            "PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",
            this,
          );
          return;
        }
        if (!e.geometry.morphAttributes) {
          ut(
            "PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",
            this,
          );
          return;
        }
        e.morphTargetDictionary[s] !== void 0 &&
          (s = e.morphTargetDictionary[s]);
      }
      ((A = this.BindingType.ArrayElement),
        (this.resolvedProperty = a),
        (this.propertyIndex = s));
    } else
      a.fromArray !== void 0 && a.toArray !== void 0
        ? ((A = this.BindingType.HasFromToArray), (this.resolvedProperty = a))
        : Array.isArray(a)
          ? ((A = this.BindingType.EntireArray), (this.resolvedProperty = a))
          : (this.propertyName = r);
    ((this.getValue = this.GetterByBindingType[A]),
      (this.setValue = this.SetterByBindingTypeAndVersioning[A][o]));
  }
  unbind() {
    ((this.node = null),
      (this.getValue = this._getValue_unbound),
      (this.setValue = this._setValue_unbound));
  }
}

Rt.Composite = u6;

Rt.prototype.BindingType = {
  Direct: 0,
  EntireArray: 1,
  ArrayElement: 2,
  HasFromToArray: 3,
};

Rt.prototype.Versioning = {
  None: 0,
  NeedsUpdate: 1,
  MatrixWorldNeedsUpdate: 2,
};

Rt.prototype.GetterByBindingType = [
  Rt.prototype._getValue_direct,
  Rt.prototype._getValue_array,
  Rt.prototype._getValue_arrayElement,
  Rt.prototype._getValue_toArray,
];

Rt.prototype.SetterByBindingTypeAndVersioning = [
  [
    Rt.prototype._setValue_direct,
    Rt.prototype._setValue_direct_setNeedsUpdate,
    Rt.prototype._setValue_direct_setMatrixWorldNeedsUpdate,
  ],
  [
    Rt.prototype._setValue_array,
    Rt.prototype._setValue_array_setNeedsUpdate,
    Rt.prototype._setValue_array_setMatrixWorldNeedsUpdate,
  ],
  [
    Rt.prototype._setValue_arrayElement,
    Rt.prototype._setValue_arrayElement_setNeedsUpdate,
    Rt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate,
  ],
  [
    Rt.prototype._setValue_fromArray,
    Rt.prototype._setValue_fromArray_setNeedsUpdate,
    Rt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate,
  ],
];

const tu = class tu {
  constructor(e, t, n, r) {
    ((this.elements = [1, 0, 0, 1]), e !== void 0 && this.set(e, t, n, r));
  }
  identity() {
    return (this.set(1, 0, 0, 1), this);
  }
  fromArray(e, t = 0) {
    for (let n = 0; n < 4; n++) this.elements[n] = e[n + t];
    return this;
  }
  set(e, t, n, r) {
    const s = this.elements;
    return ((s[0] = e), (s[2] = t), (s[1] = n), (s[3] = r), this);
  }
};

tu.prototype.isMatrix2 = !0;

let rf = tu;

function sf(i, e, t, n) {
  const r = f6(n);
  switch (t) {
    case ym:
      return i * e;
    case QA:
      return ((i * e) / r.components) * r.byteLength;
    case fd:
      return ((i * e) / r.components) * r.byteLength;
    case qi:
      return ((i * e * 2) / r.components) * r.byteLength;
    case pd:
      return ((i * e * 2) / r.components) * r.byteLength;
    case xm:
      return ((i * e * 3) / r.components) * r.byteLength;
    case Hn:
      return ((i * e * 4) / r.components) * r.byteLength;
    case md:
      return ((i * e * 4) / r.components) * r.byteLength;
    case pA:
    case mA:
      return Math.floor((i + 3) / 4) * Math.floor((e + 3) / 4) * 8;
    case gA:
    case vA:
      return Math.floor((i + 3) / 4) * Math.floor((e + 3) / 4) * 16;
    case Kc:
    case Zc:
      return (Math.max(i, 16) * Math.max(e, 8)) / 4;
    case Jc:
    case Yc:
      return (Math.max(i, 8) * Math.max(e, 8)) / 2;
    case Qc:
    case eh:
    case nh:
    case rh:
      return Math.floor((i + 3) / 4) * Math.floor((e + 3) / 4) * 8;
    case th:
    case kA:
    case ih:
      return Math.floor((i + 3) / 4) * Math.floor((e + 3) / 4) * 16;
    case sh:
      return Math.floor((i + 3) / 4) * Math.floor((e + 3) / 4) * 16;
    case ah:
      return Math.floor((i + 4) / 5) * Math.floor((e + 3) / 4) * 16;
    case oh:
      return Math.floor((i + 4) / 5) * Math.floor((e + 4) / 5) * 16;
    case Ah:
      return Math.floor((i + 5) / 6) * Math.floor((e + 4) / 5) * 16;
    case lh:
      return Math.floor((i + 5) / 6) * Math.floor((e + 5) / 6) * 16;
    case ch:
      return Math.floor((i + 7) / 8) * Math.floor((e + 4) / 5) * 16;
    case hh:
      return Math.floor((i + 7) / 8) * Math.floor((e + 5) / 6) * 16;
    case dh:
      return Math.floor((i + 7) / 8) * Math.floor((e + 7) / 8) * 16;
    case uh:
      return Math.floor((i + 9) / 10) * Math.floor((e + 4) / 5) * 16;
    case fh:
      return Math.floor((i + 9) / 10) * Math.floor((e + 5) / 6) * 16;
    case ph:
      return Math.floor((i + 9) / 10) * Math.floor((e + 7) / 8) * 16;
    case mh:
      return Math.floor((i + 9) / 10) * Math.floor((e + 9) / 10) * 16;
    case gh:
      return Math.floor((i + 11) / 12) * Math.floor((e + 9) / 10) * 16;
    case vh:
      return Math.floor((i + 11) / 12) * Math.floor((e + 11) / 12) * 16;
    case jh:
    case _h:
    case Eh:
      return Math.ceil(i / 4) * Math.ceil(e / 4) * 16;
    case yh:
    case xh:
      return Math.ceil(i / 4) * Math.ceil(e / 4) * 8;
    case TA:
    case Ch:
      return Math.ceil(i / 4) * Math.ceil(e / 4) * 16;
  }
  throw new Error(`Unable to determine texture byte length for ${t} format.`);
}

function f6(i) {
  switch (i) {
    case Mn:
    case vm:
      return { byteLength: 1, components: 1 };
    case Ga:
    case jm:
    case er:
      return { byteLength: 2, components: 1 };
    case dd:
    case ud:
      return { byteLength: 2, components: 4 };
    case Er:
    case hd:
    case On:
      return { byteLength: 4, components: 1 };
    case _m:
    case Em:
      return { byteLength: 4, components: 3 };
  }
  throw new Error(`THREE.TextureUtils: Unknown texture type ${i}.`);
}

typeof __THREE_DEVTOOLS__ < "u" &&
  __THREE_DEVTOOLS__.dispatchEvent(
    new CustomEvent("register", { detail: { revision: id } }),
  );

typeof window < "u" &&
  (window.__THREE__
    ? it("WARNING: Multiple instances of Three.js being imported.")
    : (window.__THREE__ = id));

/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */
function t0() {
  let i = null,
    e = !1,
    t = null,
    n = null;
  function r(s, a) {
    (t(s, a), (n = i.requestAnimationFrame(r)));
  }
  return {
    start: function () {
      e !== !0 &&
        t !== null &&
        i !== null &&
        ((n = i.requestAnimationFrame(r)), (e = !0));
    },
    stop: function () {
      (i !== null && i.cancelAnimationFrame(n), (e = !1));
    },
    setAnimationLoop: function (s) {
      t = s;
    },
    setContext: function (s) {
      i = s;
    },
  };
}

function p6(i) {
  const e = new WeakMap();
  function t(o, A) {
    const l = o.array,
      c = o.usage,
      h = l.byteLength,
      d = i.createBuffer();
    (i.bindBuffer(A, d), i.bufferData(A, l, c), o.onUploadCallback());
    let u;
    if (l instanceof Float32Array) u = i.FLOAT;
    else if (typeof Float16Array < "u" && l instanceof Float16Array)
      u = i.HALF_FLOAT;
    else if (l instanceof Uint16Array)
      o.isFloat16BufferAttribute ? (u = i.HALF_FLOAT) : (u = i.UNSIGNED_SHORT);
    else if (l instanceof Int16Array) u = i.SHORT;
    else if (l instanceof Uint32Array) u = i.UNSIGNED_INT;
    else if (l instanceof Int32Array) u = i.INT;
    else if (l instanceof Int8Array) u = i.BYTE;
    else if (l instanceof Uint8Array) u = i.UNSIGNED_BYTE;
    else if (l instanceof Uint8ClampedArray) u = i.UNSIGNED_BYTE;
    else
      throw new Error(
        "THREE.WebGLAttributes: Unsupported buffer data format: " + l,
      );
    return {
      buffer: d,
      type: u,
      bytesPerElement: l.BYTES_PER_ELEMENT,
      version: o.version,
      size: h,
    };
  }
  function n(o, A, l) {
    const c = A.array,
      h = A.updateRanges;
    if ((i.bindBuffer(l, o), h.length === 0)) i.bufferSubData(l, 0, c);
    else {
      h.sort((u, p) => u.start - p.start);
      let d = 0;
      for (let u = 1; u < h.length; u++) {
        const p = h[d],
          v = h[u];
        v.start <= p.start + p.count + 1
          ? (p.count = Math.max(p.count, v.start + v.count - p.start))
          : (++d, (h[d] = v));
      }
      h.length = d + 1;
      for (let u = 0, p = h.length; u < p; u++) {
        const v = h[u];
        i.bufferSubData(l, v.start * c.BYTES_PER_ELEMENT, c, v.start, v.count);
      }
      A.clearUpdateRanges();
    }
    A.onUploadCallback();
  }
  function r(o) {
    return (o.isInterleavedBufferAttribute && (o = o.data), e.get(o));
  }
  function s(o) {
    o.isInterleavedBufferAttribute && (o = o.data);
    const A = e.get(o);
    A && (i.deleteBuffer(A.buffer), e.delete(o));
  }
  function a(o, A) {
    if (
      (o.isInterleavedBufferAttribute && (o = o.data), o.isGLBufferAttribute)
    ) {
      const c = e.get(o);
      (!c || c.version < o.version) &&
        e.set(o, {
          buffer: o.buffer,
          type: o.type,
          bytesPerElement: o.elementSize,
          version: o.version,
        });
      return;
    }
    const l = e.get(o);
    if (l === void 0) e.set(o, t(o, A));
    else if (l.version < o.version) {
      if (l.size !== o.array.byteLength)
        throw new Error(
          "THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.",
        );
      (n(l.buffer, o, A), (l.version = o.version));
    }
  }
  return { get: r, remove: s, update: a };
}

var m6 = `#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`;

var g6 = `#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`;

var v6 = `#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`;

var j6 = `#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`;

var _6 = `#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`;

var E6 = `#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`;

var y6 = `#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`;

var x6 = `#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`;

var C6 = `#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`;

var b6 = `#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`;

var S6 = `vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`;

var w6 = `vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`;

var M6 = `float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`;

var B6 = `#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`;

var k6 = `#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`;

var T6 = `#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`;

var R6 = `#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`;

var P6 = `#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`;

var I6 = `#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`;

var L6 = `#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`;

var F6 = `#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`;

var D6 = `#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`;

var N6 = `#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`;

var G6 = `#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`;

var O6 = `#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`;

var H6 = `vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`;

var U6 = `#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`;

var q6 = `#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`;

var $6 = `#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`;

var z6 = `#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`;

var V6 = "gl_FragColor = linearToOutputTexel( gl_FragColor );";

var W6 = `vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`;

var X6 = `#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`;

var J6 = `#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`;

var K6 = `#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`;

var Y6 = `#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`;

var Z6 = `#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`;

var Q6 = `#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`;

var e_ = `#ifdef USE_FOG
	varying float vFogDepth;
#endif`;

var t_ = `#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`;

var n_ = `#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`;

var r_ = `#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`;

var i_ = `#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`;

var s_ = `LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`;

var a_ = `varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`;

var o_ = `uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`;

var A_ = `#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`;

var l_ = `ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`;

var c_ = `varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`;

var h_ = `BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`;

var d_ = `varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`;

var u_ = `PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`;

var f_ = `uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
		vec3 iridescenceFresnelDielectric;
		vec3 iridescenceFresnelMetallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
vec3 BRDF_GGX_Multiscatter( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 singleScatter = BRDF_GGX( lightDir, viewDir, normal, material );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 dfgV = texture2D( dfgLUT, vec2( material.roughness, dotNV ) ).rg;
	vec2 dfgL = texture2D( dfgLUT, vec2( material.roughness, dotNL ) ).rg;
	vec3 FssEss_V = material.specularColorBlended * dfgV.x + material.specularF90 * dfgV.y;
	vec3 FssEss_L = material.specularColorBlended * dfgL.x + material.specularF90 * dfgL.y;
	float Ess_V = dfgV.x + dfgV.y;
	float Ess_L = dfgL.x + dfgL.y;
	float Ems_V = 1.0 - Ess_V;
	float Ems_L = 1.0 - Ess_L;
	vec3 Favg = material.specularColorBlended + ( 1.0 - material.specularColorBlended ) * 0.047619;
	vec3 Fms = FssEss_V * FssEss_L * Favg / ( 1.0 - Ems_V * Ems_L * Favg + EPSILON );
	float compensationFactor = Ems_V * Ems_L;
	vec3 multiScatter = Fms * compensationFactor;
	return singleScatter + multiScatter;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX_Multiscatter( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnelDielectric, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceFresnelMetallic, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`;

var p_ = `
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( material.iridescenceFresnelDielectric, material.iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`;

var m_ = `#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`;

var g_ = `#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`;

var v_ = `#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`;

var j_ = `#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`;

var __ = `#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`;

var E_ = `#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`;

var y_ = `#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`;

var x_ = `#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`;

var C_ = `#ifdef USE_MAP
	uniform sampler2D map;
#endif`;

var b_ = `#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`;

var S_ = `#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`;

var w_ = `float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`;

var M_ = `#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`;

var B_ = `#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`;

var k_ = `#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`;

var T_ = `#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`;

var R_ = `#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`;

var P_ = `#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`;

var I_ = `float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`;

var L_ = `#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`;

var F_ = `#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`;

var D_ = `#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`;

var N_ = `#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`;

var G_ = `#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`;

var O_ = `#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`;

var H_ = `#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`;

var U_ = `#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`;

var q_ = `#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`;

var $_ = `#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`;

var z_ = `vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`;

var V_ = `#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`;

var W_ = `vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`;

var X_ = `#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`;

var J_ = `#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`;

var K_ = `float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`;

var Y_ = `#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`;

var Z_ = `#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`;

var Q_ = `#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`;

var eE = `#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`;

var tE = `float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`;

var nE = `#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`;

var rE = `#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`;

var iE = `#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`;

var sE = `#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`;

var aE = `float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`;

var oE = `#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`;

var AE = `#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`;

var lE = `#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`;

var cE = `#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`;

var hE = `#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`;

var dE = `#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`;

var uE = `#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`;

var fE = `#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`;

var pE = `#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;

const mE = `varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`;

const gE = `uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`;

const vE = `varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`;

const jE = `#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`;

const _E = `varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`;

const EE = `uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`;

const yE = `#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`;

const xE = `#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`;

const CE = `#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`;

const bE = `#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`;

const SE = `varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`;

const wE = `uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`;

const ME = `uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`;

const BE = `uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`;

const kE = `#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`;

const TE = `uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`;

const RE = `#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`;

const PE = `#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`;

const IE = `#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`;

const LE = `#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`;

const FE = `#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`;

const DE = `#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`;

const NE = `#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`;

const GE = `#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`;

const OE = `#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`;

const HE = `#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`;

const UE = `#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`;

const qE = `#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`;

const $E = `uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`;

const zE = `uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`;

const VE = `#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`;

const WE = `uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`;

const XE = `uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`;

const JE = `uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`;

const yt = {
    alphahash_fragment: m6,
    alphahash_pars_fragment: g6,
    alphamap_fragment: v6,
    alphamap_pars_fragment: j6,
    alphatest_fragment: _6,
    alphatest_pars_fragment: E6,
    aomap_fragment: y6,
    aomap_pars_fragment: x6,
    batching_pars_vertex: C6,
    batching_vertex: b6,
    begin_vertex: S6,
    beginnormal_vertex: w6,
    bsdfs: M6,
    iridescence_fragment: B6,
    bumpmap_pars_fragment: k6,
    clipping_planes_fragment: T6,
    clipping_planes_pars_fragment: R6,
    clipping_planes_pars_vertex: P6,
    clipping_planes_vertex: I6,
    color_fragment: L6,
    color_pars_fragment: F6,
    color_pars_vertex: D6,
    color_vertex: N6,
    common: G6,
    cube_uv_reflection_fragment: O6,
    defaultnormal_vertex: H6,
    displacementmap_pars_vertex: U6,
    displacementmap_vertex: q6,
    emissivemap_fragment: $6,
    emissivemap_pars_fragment: z6,
    colorspace_fragment: V6,
    colorspace_pars_fragment: W6,
    envmap_fragment: X6,
    envmap_common_pars_fragment: J6,
    envmap_pars_fragment: K6,
    envmap_pars_vertex: Y6,
    envmap_physical_pars_fragment: A_,
    envmap_vertex: Z6,
    fog_vertex: Q6,
    fog_pars_vertex: e_,
    fog_fragment: t_,
    fog_pars_fragment: n_,
    gradientmap_pars_fragment: r_,
    lightmap_pars_fragment: i_,
    lights_lambert_fragment: s_,
    lights_lambert_pars_fragment: a_,
    lights_pars_begin: o_,
    lights_toon_fragment: l_,
    lights_toon_pars_fragment: c_,
    lights_phong_fragment: h_,
    lights_phong_pars_fragment: d_,
    lights_physical_fragment: u_,
    lights_physical_pars_fragment: f_,
    lights_fragment_begin: p_,
    lights_fragment_maps: m_,
    lights_fragment_end: g_,
    lightprobes_pars_fragment: v_,
    logdepthbuf_fragment: j_,
    logdepthbuf_pars_fragment: __,
    logdepthbuf_pars_vertex: E_,
    logdepthbuf_vertex: y_,
    map_fragment: x_,
    map_pars_fragment: C_,
    map_particle_fragment: b_,
    map_particle_pars_fragment: S_,
    metalnessmap_fragment: w_,
    metalnessmap_pars_fragment: M_,
    morphinstance_vertex: B_,
    morphcolor_vertex: k_,
    morphnormal_vertex: T_,
    morphtarget_pars_vertex: R_,
    morphtarget_vertex: P_,
    normal_fragment_begin: I_,
    normal_fragment_maps: L_,
    normal_pars_fragment: F_,
    normal_pars_vertex: D_,
    normal_vertex: N_,
    normalmap_pars_fragment: G_,
    clearcoat_normal_fragment_begin: O_,
    clearcoat_normal_fragment_maps: H_,
    clearcoat_pars_fragment: U_,
    iridescence_pars_fragment: q_,
    opaque_fragment: $_,
    packing: z_,
    premultiplied_alpha_fragment: V_,
    project_vertex: W_,
    dithering_fragment: X_,
    dithering_pars_fragment: J_,
    roughnessmap_fragment: K_,
    roughnessmap_pars_fragment: Y_,
    shadowmap_pars_fragment: Z_,
    shadowmap_pars_vertex: Q_,
    shadowmap_vertex: eE,
    shadowmask_pars_fragment: tE,
    skinbase_vertex: nE,
    skinning_pars_vertex: rE,
    skinning_vertex: iE,
    skinnormal_vertex: sE,
    specularmap_fragment: aE,
    specularmap_pars_fragment: oE,
    tonemapping_fragment: AE,
    tonemapping_pars_fragment: lE,
    transmission_fragment: cE,
    transmission_pars_fragment: hE,
    uv_pars_fragment: dE,
    uv_pars_vertex: uE,
    uv_vertex: fE,
    worldpos_vertex: pE,
    background_vert: mE,
    background_frag: gE,
    backgroundCube_vert: vE,
    backgroundCube_frag: jE,
    cube_vert: _E,
    cube_frag: EE,
    depth_vert: yE,
    depth_frag: xE,
    distance_vert: CE,
    distance_frag: bE,
    equirect_vert: SE,
    equirect_frag: wE,
    linedashed_vert: ME,
    linedashed_frag: BE,
    meshbasic_vert: kE,
    meshbasic_frag: TE,
    meshlambert_vert: RE,
    meshlambert_frag: PE,
    meshmatcap_vert: IE,
    meshmatcap_frag: LE,
    meshnormal_vert: FE,
    meshnormal_frag: DE,
    meshphong_vert: NE,
    meshphong_frag: GE,
    meshphysical_vert: OE,
    meshphysical_frag: HE,
    meshtoon_vert: UE,
    meshtoon_frag: qE,
    points_vert: $E,
    points_frag: zE,
    shadow_vert: VE,
    shadow_frag: WE,
    sprite_vert: XE,
    sprite_frag: JE,
  };

const Ue = {
    common: {
      diffuse: { value: new Ne(16777215) },
      opacity: { value: 1 },
      map: { value: null },
      mapTransform: { value: new jt() },
      alphaMap: { value: null },
      alphaMapTransform: { value: new jt() },
      alphaTest: { value: 0 },
    },
    specularmap: {
      specularMap: { value: null },
      specularMapTransform: { value: new jt() },
    },
    envmap: {
      envMap: { value: null },
      envMapRotation: { value: new jt() },
      reflectivity: { value: 1 },
      ior: { value: 1.5 },
      refractionRatio: { value: 0.98 },
      dfgLUT: { value: null },
    },
    aomap: {
      aoMap: { value: null },
      aoMapIntensity: { value: 1 },
      aoMapTransform: { value: new jt() },
    },
    lightmap: {
      lightMap: { value: null },
      lightMapIntensity: { value: 1 },
      lightMapTransform: { value: new jt() },
    },
    bumpmap: {
      bumpMap: { value: null },
      bumpMapTransform: { value: new jt() },
      bumpScale: { value: 1 },
    },
    normalmap: {
      normalMap: { value: null },
      normalMapTransform: { value: new jt() },
      normalScale: { value: new Ae(1, 1) },
    },
    displacementmap: {
      displacementMap: { value: null },
      displacementMapTransform: { value: new jt() },
      displacementScale: { value: 1 },
      displacementBias: { value: 0 },
    },
    emissivemap: {
      emissiveMap: { value: null },
      emissiveMapTransform: { value: new jt() },
    },
    metalnessmap: {
      metalnessMap: { value: null },
      metalnessMapTransform: { value: new jt() },
    },
    roughnessmap: {
      roughnessMap: { value: null },
      roughnessMapTransform: { value: new jt() },
    },
    gradientmap: { gradientMap: { value: null } },
    fog: {
      fogDensity: { value: 25e-5 },
      fogNear: { value: 1 },
      fogFar: { value: 2e3 },
      fogColor: { value: new Ne(16777215) },
    },
    lights: {
      ambientLightColor: { value: [] },
      lightProbe: { value: [] },
      directionalLights: {
        value: [],
        properties: { direction: {}, color: {} },
      },
      directionalLightShadows: {
        value: [],
        properties: {
          shadowIntensity: 1,
          shadowBias: {},
          shadowNormalBias: {},
          shadowRadius: {},
          shadowMapSize: {},
        },
      },
      directionalShadowMatrix: { value: [] },
      spotLights: {
        value: [],
        properties: {
          color: {},
          position: {},
          direction: {},
          distance: {},
          coneCos: {},
          penumbraCos: {},
          decay: {},
        },
      },
      spotLightShadows: {
        value: [],
        properties: {
          shadowIntensity: 1,
          shadowBias: {},
          shadowNormalBias: {},
          shadowRadius: {},
          shadowMapSize: {},
        },
      },
      spotLightMap: { value: [] },
      spotLightMatrix: { value: [] },
      pointLights: {
        value: [],
        properties: { color: {}, position: {}, decay: {}, distance: {} },
      },
      pointLightShadows: {
        value: [],
        properties: {
          shadowIntensity: 1,
          shadowBias: {},
          shadowNormalBias: {},
          shadowRadius: {},
          shadowMapSize: {},
          shadowCameraNear: {},
          shadowCameraFar: {},
        },
      },
      pointShadowMatrix: { value: [] },
      hemisphereLights: {
        value: [],
        properties: { direction: {}, skyColor: {}, groundColor: {} },
      },
      rectAreaLights: {
        value: [],
        properties: { color: {}, position: {}, width: {}, height: {} },
      },
      ltc_1: { value: null },
      ltc_2: { value: null },
      probesSH: { value: null },
      probesMin: { value: new F() },
      probesMax: { value: new F() },
      probesResolution: { value: new F() },
    },
    points: {
      diffuse: { value: new Ne(16777215) },
      opacity: { value: 1 },
      size: { value: 1 },
      scale: { value: 1 },
      map: { value: null },
      alphaMap: { value: null },
      alphaMapTransform: { value: new jt() },
      alphaTest: { value: 0 },
      uvTransform: { value: new jt() },
    },
    sprite: {
      diffuse: { value: new Ne(16777215) },
      opacity: { value: 1 },
      center: { value: new Ae(0.5, 0.5) },
      rotation: { value: 0 },
      map: { value: null },
      mapTransform: { value: new jt() },
      alphaMap: { value: null },
      alphaMapTransform: { value: new jt() },
      alphaTest: { value: 0 },
    },
  };

const ur = {
    basic: {
      uniforms: gn([
        Ue.common,
        Ue.specularmap,
        Ue.envmap,
        Ue.aomap,
        Ue.lightmap,
        Ue.fog,
      ]),
      vertexShader: yt.meshbasic_vert,
      fragmentShader: yt.meshbasic_frag,
    },
    lambert: {
      uniforms: gn([
        Ue.common,
        Ue.specularmap,
        Ue.envmap,
        Ue.aomap,
        Ue.lightmap,
        Ue.emissivemap,
        Ue.bumpmap,
        Ue.normalmap,
        Ue.displacementmap,
        Ue.fog,
        Ue.lights,
        { emissive: { value: new Ne(0) }, envMapIntensity: { value: 1 } },
      ]),
      vertexShader: yt.meshlambert_vert,
      fragmentShader: yt.meshlambert_frag,
    },
    phong: {
      uniforms: gn([
        Ue.common,
        Ue.specularmap,
        Ue.envmap,
        Ue.aomap,
        Ue.lightmap,
        Ue.emissivemap,
        Ue.bumpmap,
        Ue.normalmap,
        Ue.displacementmap,
        Ue.fog,
        Ue.lights,
        {
          emissive: { value: new Ne(0) },
          specular: { value: new Ne(1118481) },
          shininess: { value: 30 },
          envMapIntensity: { value: 1 },
        },
      ]),
      vertexShader: yt.meshphong_vert,
      fragmentShader: yt.meshphong_frag,
    },
    standard: {
      uniforms: gn([
        Ue.common,
        Ue.envmap,
        Ue.aomap,
        Ue.lightmap,
        Ue.emissivemap,
        Ue.bumpmap,
        Ue.normalmap,
        Ue.displacementmap,
        Ue.roughnessmap,
        Ue.metalnessmap,
        Ue.fog,
        Ue.lights,
        {
          emissive: { value: new Ne(0) },
          roughness: { value: 1 },
          metalness: { value: 0 },
          envMapIntensity: { value: 1 },
        },
      ]),
      vertexShader: yt.meshphysical_vert,
      fragmentShader: yt.meshphysical_frag,
    },
    toon: {
      uniforms: gn([
        Ue.common,
        Ue.aomap,
        Ue.lightmap,
        Ue.emissivemap,
        Ue.bumpmap,
        Ue.normalmap,
        Ue.displacementmap,
        Ue.gradientmap,
        Ue.fog,
        Ue.lights,
        { emissive: { value: new Ne(0) } },
      ]),
      vertexShader: yt.meshtoon_vert,
      fragmentShader: yt.meshtoon_frag,
    },
    matcap: {
      uniforms: gn([
        Ue.common,
        Ue.bumpmap,
        Ue.normalmap,
        Ue.displacementmap,
        Ue.fog,
        { matcap: { value: null } },
      ]),
      vertexShader: yt.meshmatcap_vert,
      fragmentShader: yt.meshmatcap_frag,
    },
    points: {
      uniforms: gn([Ue.points, Ue.fog]),
      vertexShader: yt.points_vert,
      fragmentShader: yt.points_frag,
    },
    dashed: {
      uniforms: gn([
        Ue.common,
        Ue.fog,
        {
          scale: { value: 1 },
          dashSize: { value: 1 },
          totalSize: { value: 2 },
        },
      ]),
      vertexShader: yt.linedashed_vert,
      fragmentShader: yt.linedashed_frag,
    },
    depth: {
      uniforms: gn([Ue.common, Ue.displacementmap]),
      vertexShader: yt.depth_vert,
      fragmentShader: yt.depth_frag,
    },
    normal: {
      uniforms: gn([
        Ue.common,
        Ue.bumpmap,
        Ue.normalmap,
        Ue.displacementmap,
        { opacity: { value: 1 } },
      ]),
      vertexShader: yt.meshnormal_vert,
      fragmentShader: yt.meshnormal_frag,
    },
    sprite: {
      uniforms: gn([Ue.sprite, Ue.fog]),
      vertexShader: yt.sprite_vert,
      fragmentShader: yt.sprite_frag,
    },
    background: {
      uniforms: {
        uvTransform: { value: new jt() },
        t2D: { value: null },
        backgroundIntensity: { value: 1 },
      },
      vertexShader: yt.background_vert,
      fragmentShader: yt.background_frag,
    },
    backgroundCube: {
      uniforms: {
        envMap: { value: null },
        backgroundBlurriness: { value: 0 },
        backgroundIntensity: { value: 1 },
        backgroundRotation: { value: new jt() },
      },
      vertexShader: yt.backgroundCube_vert,
      fragmentShader: yt.backgroundCube_frag,
    },
    cube: {
      uniforms: {
        tCube: { value: null },
        tFlip: { value: -1 },
        opacity: { value: 1 },
      },
      vertexShader: yt.cube_vert,
      fragmentShader: yt.cube_frag,
    },
    equirect: {
      uniforms: { tEquirect: { value: null } },
      vertexShader: yt.equirect_vert,
      fragmentShader: yt.equirect_frag,
    },
    distance: {
      uniforms: gn([
        Ue.common,
        Ue.displacementmap,
        {
          referencePosition: { value: new F() },
          nearDistance: { value: 1 },
          farDistance: { value: 1e3 },
        },
      ]),
      vertexShader: yt.distance_vert,
      fragmentShader: yt.distance_frag,
    },
    shadow: {
      uniforms: gn([
        Ue.lights,
        Ue.fog,
        { color: { value: new Ne(0) }, opacity: { value: 1 } },
      ]),
      vertexShader: yt.shadow_vert,
      fragmentShader: yt.shadow_frag,
    },
  };

ur.physical = {
  uniforms: gn([
    ur.standard.uniforms,
    {
      clearcoat: { value: 0 },
      clearcoatMap: { value: null },
      clearcoatMapTransform: { value: new jt() },
      clearcoatNormalMap: { value: null },
      clearcoatNormalMapTransform: { value: new jt() },
      clearcoatNormalScale: { value: new Ae(1, 1) },
      clearcoatRoughness: { value: 0 },
      clearcoatRoughnessMap: { value: null },
      clearcoatRoughnessMapTransform: { value: new jt() },
      dispersion: { value: 0 },
      iridescence: { value: 0 },
      iridescenceMap: { value: null },
      iridescenceMapTransform: { value: new jt() },
      iridescenceIOR: { value: 1.3 },
      iridescenceThicknessMinimum: { value: 100 },
      iridescenceThicknessMaximum: { value: 400 },
      iridescenceThicknessMap: { value: null },
      iridescenceThicknessMapTransform: { value: new jt() },
      sheen: { value: 0 },
      sheenColor: { value: new Ne(0) },
      sheenColorMap: { value: null },
      sheenColorMapTransform: { value: new jt() },
      sheenRoughness: { value: 1 },
      sheenRoughnessMap: { value: null },
      sheenRoughnessMapTransform: { value: new jt() },
      transmission: { value: 0 },
      transmissionMap: { value: null },
      transmissionMapTransform: { value: new jt() },
      transmissionSamplerSize: { value: new Ae() },
      transmissionSamplerMap: { value: null },
      thickness: { value: 0 },
      thicknessMap: { value: null },
      thicknessMapTransform: { value: new jt() },
      attenuationDistance: { value: 0 },
      attenuationColor: { value: new Ne(0) },
      specularColor: { value: new Ne(1, 1, 1) },
      specularColorMap: { value: null },
      specularColorMapTransform: { value: new jt() },
      specularIntensity: { value: 1 },
      specularIntensityMap: { value: null },
      specularIntensityMapTransform: { value: new jt() },
      anisotropyVector: { value: new Ae() },
      anisotropyMap: { value: null },
      anisotropyMapTransform: { value: new jt() },
    },
  ]),
  vertexShader: yt.meshphysical_vert,
  fragmentShader: yt.meshphysical_frag,
};

const Xo = { r: 0, b: 0, g: 0 };

const KE = new mt();

const n0 = new jt();

n0.set(-1, 0, 0, 0, 1, 0, 0, 0, 1);

function YE(i, e, t, n, r, s) {
  const a = new Ne(0);
  let o = r === !0 ? 0 : 1,
    A,
    l,
    c = null,
    h = 0,
    d = null;
  function u(y) {
    let C = y.isScene === !0 ? y.background : null;
    if (C && C.isTexture) {
      const E = y.backgroundBlurriness > 0;
      C = e.get(C, E);
    }
    return C;
  }
  function p(y) {
    let C = !1;
    const E = u(y);
    E === null ? g(a, o) : E && E.isColor && (g(E, 1), (C = !0));
    const w = i.xr.getEnvironmentBlendMode();
    (w === "additive"
      ? t.buffers.color.setClear(0, 0, 0, 1, s)
      : w === "alpha-blend" && t.buffers.color.setClear(0, 0, 0, 0, s),
      (i.autoClear || C) &&
        (t.buffers.depth.setTest(!0),
        t.buffers.depth.setMask(!0),
        t.buffers.color.setMask(!0),
        i.clear(i.autoClearColor, i.autoClearDepth, i.autoClearStencil)));
  }
  function v(y, C) {
    const E = u(C);
    E && (E.isCubeTexture || E.mapping === ZA)
      ? (l === void 0 &&
          ((l = new Ee(
            new Tn(1, 1, 1),
            new Lt({
              name: "BackgroundCubeMaterial",
              uniforms: Us(ur.backgroundCube.uniforms),
              vertexShader: ur.backgroundCube.vertexShader,
              fragmentShader: ur.backgroundCube.fragmentShader,
              side: pn,
              depthTest: !1,
              depthWrite: !1,
              fog: !1,
              allowOverride: !1,
            }),
          )),
          l.geometry.deleteAttribute("normal"),
          l.geometry.deleteAttribute("uv"),
          (l.onBeforeRender = function (w, S, k) {
            this.matrixWorld.copyPosition(k.matrixWorld);
          }),
          Object.defineProperty(l.material, "envMap", {
            get: function () {
              return this.uniforms.envMap.value;
            },
          }),
          n.update(l)),
        (l.material.uniforms.envMap.value = E),
        (l.material.uniforms.backgroundBlurriness.value =
          C.backgroundBlurriness),
        (l.material.uniforms.backgroundIntensity.value = C.backgroundIntensity),
        l.material.uniforms.backgroundRotation.value
          .setFromMatrix4(KE.makeRotationFromEuler(C.backgroundRotation))
          .transpose(),
        E.isCubeTexture &&
          E.isRenderTargetTexture === !1 &&
          l.material.uniforms.backgroundRotation.value.premultiply(n0),
        (l.material.toneMapped = bt.getTransfer(E.colorSpace) !== kt),
        (c !== E || h !== E.version || d !== i.toneMapping) &&
          ((l.material.needsUpdate = !0),
          (c = E),
          (h = E.version),
          (d = i.toneMapping)),
        l.layers.enableAll(),
        y.unshift(l, l.geometry, l.material, 0, 0, null))
      : E &&
        E.isTexture &&
        (A === void 0 &&
          ((A = new Ee(
            new ui(2, 2),
            new Lt({
              name: "BackgroundMaterial",
              uniforms: Us(ur.background.uniforms),
              vertexShader: ur.background.vertexShader,
              fragmentShader: ur.background.fragmentShader,
              side: $n,
              depthTest: !1,
              depthWrite: !1,
              fog: !1,
              allowOverride: !1,
            }),
          )),
          A.geometry.deleteAttribute("normal"),
          Object.defineProperty(A.material, "map", {
            get: function () {
              return this.uniforms.t2D.value;
            },
          }),
          n.update(A)),
        (A.material.uniforms.t2D.value = E),
        (A.material.uniforms.backgroundIntensity.value = C.backgroundIntensity),
        (A.material.toneMapped = bt.getTransfer(E.colorSpace) !== kt),
        E.matrixAutoUpdate === !0 && E.updateMatrix(),
        A.material.uniforms.uvTransform.value.copy(E.matrix),
        (c !== E || h !== E.version || d !== i.toneMapping) &&
          ((A.material.needsUpdate = !0),
          (c = E),
          (h = E.version),
          (d = i.toneMapping)),
        A.layers.enableAll(),
        y.unshift(A, A.geometry, A.material, 0, 0, null));
  }
  function g(y, C) {
    (y.getRGB(Xo, Km(i)), t.buffers.color.setClear(Xo.r, Xo.g, Xo.b, C, s));
  }
  function m() {
    (l !== void 0 && (l.geometry.dispose(), l.material.dispose(), (l = void 0)),
      A !== void 0 &&
        (A.geometry.dispose(), A.material.dispose(), (A = void 0)));
  }
  return {
    getClearColor: function () {
      return a;
    },
    setClearColor: function (y, C = 1) {
      (a.set(y), (o = C), g(a, o));
    },
    getClearAlpha: function () {
      return o;
    },
    setClearAlpha: function (y) {
      ((o = y), g(a, o));
    },
    render: p,
    addToRenderList: v,
    dispose: m,
  };
}

function ZE(i, e) {
  const t = i.getParameter(i.MAX_VERTEX_ATTRIBS),
    n = {},
    r = d(null);
  let s = r,
    a = !1;
  function o(D, N, X, Y, H) {
    let V = !1;
    const J = h(D, Y, X, N);
    (s !== J && ((s = J), l(s.object)),
      (V = u(D, Y, X, H)),
      V && p(D, Y, X, H),
      H !== null && e.update(H, i.ELEMENT_ARRAY_BUFFER),
      (V || a) &&
        ((a = !1),
        E(D, N, X, Y),
        H !== null && i.bindBuffer(i.ELEMENT_ARRAY_BUFFER, e.get(H).buffer)));
  }
  function A() {
    return i.createVertexArray();
  }
  function l(D) {
    return i.bindVertexArray(D);
  }
  function c(D) {
    return i.deleteVertexArray(D);
  }
  function h(D, N, X, Y) {
    const H = Y.wireframe === !0;
    let V = n[N.id];
    V === void 0 && ((V = {}), (n[N.id] = V));
    const J = D.isInstancedMesh === !0 ? D.id : 0;
    let ne = V[J];
    ne === void 0 && ((ne = {}), (V[J] = ne));
    let le = ne[X.id];
    le === void 0 && ((le = {}), (ne[X.id] = le));
    let je = le[H];
    return (je === void 0 && ((je = d(A())), (le[H] = je)), je);
  }
  function d(D) {
    const N = [],
      X = [],
      Y = [];
    for (let H = 0; H < t; H++) ((N[H] = 0), (X[H] = 0), (Y[H] = 0));
    return {
      geometry: null,
      program: null,
      wireframe: !1,
      newAttributes: N,
      enabledAttributes: X,
      attributeDivisors: Y,
      object: D,
      attributes: {},
      index: null,
    };
  }
  function u(D, N, X, Y) {
    const H = s.attributes,
      V = N.attributes;
    let J = 0;
    const ne = X.getAttributes();
    for (const le in ne)
      if (ne[le].location >= 0) {
        const de = H[le];
        let pe = V[le];
        if (
          (pe === void 0 &&
            (le === "instanceMatrix" &&
              D.instanceMatrix &&
              (pe = D.instanceMatrix),
            le === "instanceColor" &&
              D.instanceColor &&
              (pe = D.instanceColor)),
          de === void 0 || de.attribute !== pe || (pe && de.data !== pe.data))
        )
          return !0;
        J++;
      }
    return s.attributesNum !== J || s.index !== Y;
  }
  function p(D, N, X, Y) {
    const H = {},
      V = N.attributes;
    let J = 0;
    const ne = X.getAttributes();
    for (const le in ne)
      if (ne[le].location >= 0) {
        let de = V[le];
        de === void 0 &&
          (le === "instanceMatrix" &&
            D.instanceMatrix &&
            (de = D.instanceMatrix),
          le === "instanceColor" && D.instanceColor && (de = D.instanceColor));
        const pe = {};
        ((pe.attribute = de),
          de && de.data && (pe.data = de.data),
          (H[le] = pe),
          J++);
      }
    ((s.attributes = H), (s.attributesNum = J), (s.index = Y));
  }
  function v() {
    const D = s.newAttributes;
    for (let N = 0, X = D.length; N < X; N++) D[N] = 0;
  }
  function g(D) {
    m(D, 0);
  }
  function m(D, N) {
    const X = s.newAttributes,
      Y = s.enabledAttributes,
      H = s.attributeDivisors;
    ((X[D] = 1),
      Y[D] === 0 && (i.enableVertexAttribArray(D), (Y[D] = 1)),
      H[D] !== N && (i.vertexAttribDivisor(D, N), (H[D] = N)));
  }
  function y() {
    const D = s.newAttributes,
      N = s.enabledAttributes;
    for (let X = 0, Y = N.length; X < Y; X++)
      N[X] !== D[X] && (i.disableVertexAttribArray(X), (N[X] = 0));
  }
  function C(D, N, X, Y, H, V, J) {
    J === !0
      ? i.vertexAttribIPointer(D, N, X, H, V)
      : i.vertexAttribPointer(D, N, X, Y, H, V);
  }
  function E(D, N, X, Y) {
    v();
    const H = Y.attributes,
      V = X.getAttributes(),
      J = N.defaultAttributeValues;
    for (const ne in V) {
      const le = V[ne];
      if (le.location >= 0) {
        let je = H[ne];
        if (
          (je === void 0 &&
            (ne === "instanceMatrix" &&
              D.instanceMatrix &&
              (je = D.instanceMatrix),
            ne === "instanceColor" &&
              D.instanceColor &&
              (je = D.instanceColor)),
          je !== void 0)
        ) {
          const de = je.normalized,
            pe = je.itemSize,
            Se = e.get(je);
          if (Se === void 0) continue;
          const gt = Se.buffer,
            ct = Se.type,
            oe = Se.bytesPerElement,
            xe = ct === i.INT || ct === i.UNSIGNED_INT || je.gpuType === hd;
          if (je.isInterleavedBufferAttribute) {
            const ge = je.data,
              qe = ge.stride,
              Xe = je.offset;
            if (ge.isInstancedInterleavedBuffer) {
              for (let We = 0; We < le.locationSize; We++)
                m(le.location + We, ge.meshPerAttribute);
              D.isInstancedMesh !== !0 &&
                Y._maxInstanceCount === void 0 &&
                (Y._maxInstanceCount = ge.meshPerAttribute * ge.count);
            } else
              for (let We = 0; We < le.locationSize; We++) g(le.location + We);
            i.bindBuffer(i.ARRAY_BUFFER, gt);
            for (let We = 0; We < le.locationSize; We++)
              C(
                le.location + We,
                pe / le.locationSize,
                ct,
                de,
                qe * oe,
                (Xe + (pe / le.locationSize) * We) * oe,
                xe,
              );
          } else {
            if (je.isInstancedBufferAttribute) {
              for (let ge = 0; ge < le.locationSize; ge++)
                m(le.location + ge, je.meshPerAttribute);
              D.isInstancedMesh !== !0 &&
                Y._maxInstanceCount === void 0 &&
                (Y._maxInstanceCount = je.meshPerAttribute * je.count);
            } else
              for (let ge = 0; ge < le.locationSize; ge++) g(le.location + ge);
            i.bindBuffer(i.ARRAY_BUFFER, gt);
            for (let ge = 0; ge < le.locationSize; ge++)
              C(
                le.location + ge,
                pe / le.locationSize,
                ct,
                de,
                pe * oe,
                (pe / le.locationSize) * ge * oe,
                xe,
              );
          }
        } else if (J !== void 0) {
          const de = J[ne];
          if (de !== void 0)
            switch (de.length) {
              case 2:
                i.vertexAttrib2fv(le.location, de);
                break;
              case 3:
                i.vertexAttrib3fv(le.location, de);
                break;
              case 4:
                i.vertexAttrib4fv(le.location, de);
                break;
              default:
                i.vertexAttrib1fv(le.location, de);
            }
        }
      }
    }
    y();
  }
  function w() {
    T();
    for (const D in n) {
      const N = n[D];
      for (const X in N) {
        const Y = N[X];
        for (const H in Y) {
          const V = Y[H];
          for (const J in V) (c(V[J].object), delete V[J]);
          delete Y[H];
        }
      }
      delete n[D];
    }
  }
  function S(D) {
    if (n[D.id] === void 0) return;
    const N = n[D.id];
    for (const X in N) {
      const Y = N[X];
      for (const H in Y) {
        const V = Y[H];
        for (const J in V) (c(V[J].object), delete V[J]);
        delete Y[H];
      }
    }
    delete n[D.id];
  }
  function k(D) {
    for (const N in n) {
      const X = n[N];
      for (const Y in X) {
        const H = X[Y];
        if (H[D.id] === void 0) continue;
        const V = H[D.id];
        for (const J in V) (c(V[J].object), delete V[J]);
        delete H[D.id];
      }
    }
  }
  function x(D) {
    for (const N in n) {
      const X = n[N],
        Y = D.isInstancedMesh === !0 ? D.id : 0,
        H = X[Y];
      if (H !== void 0) {
        for (const V in H) {
          const J = H[V];
          for (const ne in J) (c(J[ne].object), delete J[ne]);
          delete H[V];
        }
        (delete X[Y], Object.keys(X).length === 0 && delete n[N]);
      }
    }
  }
  function T() {
    (R(), (a = !0), s !== r && ((s = r), l(s.object)));
  }
  function R() {
    ((r.geometry = null), (r.program = null), (r.wireframe = !1));
  }
  return {
    setup: o,
    reset: T,
    resetDefaultState: R,
    dispose: w,
    releaseStatesOfGeometry: S,
    releaseStatesOfObject: x,
    releaseStatesOfProgram: k,
    initAttributes: v,
    enableAttribute: g,
    disableUnusedAttributes: y,
  };
}

function QE(i, e, t) {
  let n;
  function r(A) {
    n = A;
  }
  function s(A, l) {
    (i.drawArrays(n, A, l), t.update(l, n, 1));
  }
  function a(A, l, c) {
    c !== 0 && (i.drawArraysInstanced(n, A, l, c), t.update(l, n, c));
  }
  function o(A, l, c) {
    if (c === 0) return;
    e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n, A, 0, l, 0, c);
    let d = 0;
    for (let u = 0; u < c; u++) d += l[u];
    t.update(d, n, 1);
  }
  ((this.setMode = r),
    (this.render = s),
    (this.renderInstances = a),
    (this.renderMultiDraw = o));
}

function ey(i, e, t, n) {
  let r;
  function s() {
    if (r !== void 0) return r;
    if (e.has("EXT_texture_filter_anisotropic") === !0) {
      const k = e.get("EXT_texture_filter_anisotropic");
      r = i.getParameter(k.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
    } else r = 0;
    return r;
  }
  function a(k) {
    return !(
      k !== Hn &&
      n.convert(k) !== i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT)
    );
  }
  function o(k) {
    const x =
      k === er &&
      (e.has("EXT_color_buffer_half_float") || e.has("EXT_color_buffer_float"));
    return !(
      k !== Mn &&
      n.convert(k) !== i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE) &&
      k !== On &&
      !x
    );
  }
  function A(k) {
    if (k === "highp") {
      if (
        i.getShaderPrecisionFormat(i.VERTEX_SHADER, i.HIGH_FLOAT).precision >
          0 &&
        i.getShaderPrecisionFormat(i.FRAGMENT_SHADER, i.HIGH_FLOAT).precision >
          0
      )
        return "highp";
      k = "mediump";
    }
    return k === "mediump" &&
      i.getShaderPrecisionFormat(i.VERTEX_SHADER, i.MEDIUM_FLOAT).precision >
        0 &&
      i.getShaderPrecisionFormat(i.FRAGMENT_SHADER, i.MEDIUM_FLOAT).precision >
        0
      ? "mediump"
      : "lowp";
  }
  let l = t.precision !== void 0 ? t.precision : "highp";
  const c = A(l);
  c !== l &&
    (it("WebGLRenderer:", l, "not supported, using", c, "instead."), (l = c));
  const h = t.logarithmicDepthBuffer === !0,
    d = t.reversedDepthBuffer === !0 && e.has("EXT_clip_control");
  t.reversedDepthBuffer === !0 &&
    d === !1 &&
    it(
      "WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.",
    );
  const u = i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),
    p = i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
    v = i.getParameter(i.MAX_TEXTURE_SIZE),
    g = i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),
    m = i.getParameter(i.MAX_VERTEX_ATTRIBS),
    y = i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),
    C = i.getParameter(i.MAX_VARYING_VECTORS),
    E = i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),
    w = i.getParameter(i.MAX_SAMPLES),
    S = i.getParameter(i.SAMPLES);
  return {
    isWebGL2: !0,
    getMaxAnisotropy: s,
    getMaxPrecision: A,
    textureFormatReadable: a,
    textureTypeReadable: o,
    precision: l,
    logarithmicDepthBuffer: h,
    reversedDepthBuffer: d,
    maxTextures: u,
    maxVertexTextures: p,
    maxTextureSize: v,
    maxCubemapSize: g,
    maxAttributes: m,
    maxVertexUniforms: y,
    maxVaryings: C,
    maxFragmentUniforms: E,
    maxSamples: w,
    samples: S,
  };
}

function ty(i) {
  const e = this;
  let t = null,
    n = 0,
    r = !1,
    s = !1;
  const a = new Si(),
    o = new jt(),
    A = { value: null, needsUpdate: !1 };
  ((this.uniform = A),
    (this.numPlanes = 0),
    (this.numIntersection = 0),
    (this.init = function (h, d) {
      const u = h.length !== 0 || d || n !== 0 || r;
      return ((r = d), (n = h.length), u);
    }),
    (this.beginShadows = function () {
      ((s = !0), c(null));
    }),
    (this.endShadows = function () {
      s = !1;
    }),
    (this.setGlobalState = function (h, d) {
      t = c(h, d, 0);
    }),
    (this.setState = function (h, d, u) {
      const p = h.clippingPlanes,
        v = h.clipIntersection,
        g = h.clipShadows,
        m = i.get(h);
      if (!r || p === null || p.length === 0 || (s && !g)) s ? c(null) : l();
      else {
        const y = s ? 0 : n,
          C = y * 4;
        let E = m.clippingState || null;
        ((A.value = E), (E = c(p, d, C, u)));
        for (let w = 0; w !== C; ++w) E[w] = t[w];
        ((m.clippingState = E),
          (this.numIntersection = v ? this.numPlanes : 0),
          (this.numPlanes += y));
      }
    }));
  function l() {
    (A.value !== t && ((A.value = t), (A.needsUpdate = n > 0)),
      (e.numPlanes = n),
      (e.numIntersection = 0));
  }
  function c(h, d, u, p) {
    const v = h !== null ? h.length : 0;
    let g = null;
    if (v !== 0) {
      if (((g = A.value), p !== !0 || g === null)) {
        const m = u + v * 4,
          y = d.matrixWorldInverse;
        (o.getNormalMatrix(y),
          (g === null || g.length < m) && (g = new Float32Array(m)));
        for (let C = 0, E = u; C !== v; ++C, E += 4)
          (a.copy(h[C]).applyMatrix4(y, o),
            a.normal.toArray(g, E),
            (g[E + 3] = a.constant));
      }
      ((A.value = g), (A.needsUpdate = !0));
    }
    return ((e.numPlanes = v), (e.numIntersection = 0), g);
  }
}

const oi = 4;

const af = [0.125, 0.215, 0.35, 0.446, 0.526, 0.582];

const ki = 20;

const ny = 256;

const ca = new lo();

const of = new Ne();

let tc = null;

let nc = 0;

let rc = 0;

let ic = !1;

const ry = new F();

class NA {
  constructor(e) {
    ((this._renderer = e),
      (this._pingPongRenderTarget = null),
      (this._lodMax = 0),
      (this._cubeSize = 0),
      (this._sizeLods = []),
      (this._sigmas = []),
      (this._lodMeshes = []),
      (this._backgroundBox = null),
      (this._cubemapMaterial = null),
      (this._equirectMaterial = null),
      (this._blurMaterial = null),
      (this._ggxMaterial = null));
  }
  fromScene(e, t = 0, n = 0.1, r = 100, s = {}) {
    const { size: a = 256, position: o = ry } = s;
    ((tc = this._renderer.getRenderTarget()),
      (nc = this._renderer.getActiveCubeFace()),
      (rc = this._renderer.getActiveMipmapLevel()),
      (ic = this._renderer.xr.enabled),
      (this._renderer.xr.enabled = !1),
      this._setSize(a));
    const A = this._allocateTargets();
    return (
      (A.depthBuffer = !0),
      this._sceneToCubeUV(e, n, r, A, o),
      t > 0 && this._blur(A, 0, 0, t),
      this._applyPMREM(A),
      this._cleanup(A),
      A
    );
  }
  fromEquirectangular(e, t = null) {
    return this._fromTexture(e, t);
  }
  fromCubemap(e, t = null) {
    return this._fromTexture(e, t);
  }
  compileCubemapShader() {
    this._cubemapMaterial === null &&
      ((this._cubemapMaterial = cf()),
      this._compileMaterial(this._cubemapMaterial));
  }
  compileEquirectangularShader() {
    this._equirectMaterial === null &&
      ((this._equirectMaterial = lf()),
      this._compileMaterial(this._equirectMaterial));
  }
  dispose() {
    (this._dispose(),
      this._cubemapMaterial !== null && this._cubemapMaterial.dispose(),
      this._equirectMaterial !== null && this._equirectMaterial.dispose(),
      this._backgroundBox !== null &&
        (this._backgroundBox.geometry.dispose(),
        this._backgroundBox.material.dispose()));
  }
  _setSize(e) {
    ((this._lodMax = Math.floor(Math.log2(e))),
      (this._cubeSize = Math.pow(2, this._lodMax)));
  }
  _dispose() {
    (this._blurMaterial !== null && this._blurMaterial.dispose(),
      this._ggxMaterial !== null && this._ggxMaterial.dispose(),
      this._pingPongRenderTarget !== null &&
        this._pingPongRenderTarget.dispose());
    for (let e = 0; e < this._lodMeshes.length; e++)
      this._lodMeshes[e].geometry.dispose();
  }
  _cleanup(e) {
    (this._renderer.setRenderTarget(tc, nc, rc),
      (this._renderer.xr.enabled = ic),
      (e.scissorTest = !1),
      ms(e, 0, 0, e.width, e.height));
  }
  _fromTexture(e, t) {
    (e.mapping === Ui || e.mapping === Fs
      ? this._setSize(
          e.image.length === 0
            ? 16
            : e.image[0].width || e.image[0].image.width,
        )
      : this._setSize(e.image.width / 4),
      (tc = this._renderer.getRenderTarget()),
      (nc = this._renderer.getActiveCubeFace()),
      (rc = this._renderer.getActiveMipmapLevel()),
      (ic = this._renderer.xr.enabled),
      (this._renderer.xr.enabled = !1));
    const n = t || this._allocateTargets();
    return (
      this._textureToCubeUV(e, n),
      this._applyPMREM(n),
      this._cleanup(n),
      n
    );
  }
  _allocateTargets() {
    const e = 3 * Math.max(this._cubeSize, 112),
      t = 4 * this._cubeSize,
      n = {
        magFilter: qt,
        minFilter: qt,
        generateMipmaps: !1,
        type: er,
        format: Hn,
        colorSpace: kn,
        depthBuffer: !1,
      },
      r = Af(e, t, n);
    if (
      this._pingPongRenderTarget === null ||
      this._pingPongRenderTarget.width !== e ||
      this._pingPongRenderTarget.height !== t
    ) {
      (this._pingPongRenderTarget !== null && this._dispose(),
        (this._pingPongRenderTarget = Af(e, t, n)));
      const { _lodMax: s } = this;
      (({
        lodMeshes: this._lodMeshes,
        sizeLods: this._sizeLods,
        sigmas: this._sigmas,
      } = iy(s)),
        (this._blurMaterial = ay(s, e, t)),
        (this._ggxMaterial = sy(s, e, t)));
    }
    return r;
  }
  _compileMaterial(e) {
    const t = new Ee(new Ct(), e);
    this._renderer.compile(t, ca);
  }
  _sceneToCubeUV(e, t, n, r, s) {
    const A = new fn(90, 1, t, n),
      l = [1, -1, 1, 1, 1, 1],
      c = [1, 1, 1, -1, -1, -1],
      h = this._renderer,
      d = h.autoClear,
      u = h.toneMapping;
    (h.getClearColor(of),
      (h.toneMapping = vr),
      (h.autoClear = !1),
      h.state.buffers.depth.getReversed() &&
        (h.setRenderTarget(r), h.clearDepth(), h.setRenderTarget(null)),
      this._backgroundBox === null &&
        (this._backgroundBox = new Ee(
          new Tn(),
          new cn({
            name: "PMREM.Background",
            side: pn,
            depthWrite: !1,
            depthTest: !1,
          }),
        )));
    const v = this._backgroundBox,
      g = v.material;
    let m = !1;
    const y = e.background;
    y
      ? y.isColor && (g.color.copy(y), (e.background = null), (m = !0))
      : (g.color.copy(of), (m = !0));
    for (let C = 0; C < 6; C++) {
      const E = C % 3;
      E === 0
        ? (A.up.set(0, l[C], 0),
          A.position.set(s.x, s.y, s.z),
          A.lookAt(s.x + c[C], s.y, s.z))
        : E === 1
          ? (A.up.set(0, 0, l[C]),
            A.position.set(s.x, s.y, s.z),
            A.lookAt(s.x, s.y + c[C], s.z))
          : (A.up.set(0, l[C], 0),
            A.position.set(s.x, s.y, s.z),
            A.lookAt(s.x, s.y, s.z + c[C]));
      const w = this._cubeSize;
      (ms(r, E * w, C > 2 ? w : 0, w, w),
        h.setRenderTarget(r),
        m && h.render(v, A),
        h.render(e, A));
    }
    ((h.toneMapping = u), (h.autoClear = d), (e.background = y));
  }
  _textureToCubeUV(e, t) {
    const n = this._renderer,
      r = e.mapping === Ui || e.mapping === Fs;
    r
      ? (this._cubemapMaterial === null && (this._cubemapMaterial = cf()),
        (this._cubemapMaterial.uniforms.flipEnvMap.value =
          e.isRenderTargetTexture === !1 ? -1 : 1))
      : this._equirectMaterial === null && (this._equirectMaterial = lf());
    const s = r ? this._cubemapMaterial : this._equirectMaterial,
      a = this._lodMeshes[0];
    a.material = s;
    const o = s.uniforms;
    o.envMap.value = e;
    const A = this._cubeSize;
    (ms(t, 0, 0, 3 * A, 2 * A), n.setRenderTarget(t), n.render(a, ca));
  }
  _applyPMREM(e) {
    const t = this._renderer,
      n = t.autoClear;
    t.autoClear = !1;
    const r = this._lodMeshes.length;
    for (let s = 1; s < r; s++) this._applyGGXFilter(e, s - 1, s);
    t.autoClear = n;
  }
  _applyGGXFilter(e, t, n) {
    const r = this._renderer,
      s = this._pingPongRenderTarget,
      a = this._ggxMaterial,
      o = this._lodMeshes[n];
    o.material = a;
    const A = a.uniforms,
      l = n / (this._lodMeshes.length - 1),
      c = t / (this._lodMeshes.length - 1),
      h = Math.sqrt(l * l - c * c),
      d = 0 + l * 1.25,
      u = h * d,
      { _lodMax: p } = this,
      v = this._sizeLods[n],
      g = 3 * v * (n > p - oi ? n - p + oi : 0),
      m = 4 * (this._cubeSize - v);
    ((A.envMap.value = e.texture),
      (A.roughness.value = u),
      (A.mipInt.value = p - t),
      ms(s, g, m, 3 * v, 2 * v),
      r.setRenderTarget(s),
      r.render(o, ca),
      (A.envMap.value = s.texture),
      (A.roughness.value = 0),
      (A.mipInt.value = p - n),
      ms(e, g, m, 3 * v, 2 * v),
      r.setRenderTarget(e),
      r.render(o, ca));
  }
  _blur(e, t, n, r, s) {
    const a = this._pingPongRenderTarget;
    (this._halfBlur(e, a, t, n, r, "latitudinal", s),
      this._halfBlur(a, e, n, n, r, "longitudinal", s));
  }
  _halfBlur(e, t, n, r, s, a, o) {
    const A = this._renderer,
      l = this._blurMaterial;
    a !== "latitudinal" &&
      a !== "longitudinal" &&
      ut("blur direction must be either latitudinal or longitudinal!");
    const c = 3,
      h = this._lodMeshes[r];
    h.material = l;
    const d = l.uniforms,
      u = this._sizeLods[n] - 1,
      p = isFinite(s) ? Math.PI / (2 * u) : (2 * Math.PI) / (2 * ki - 1),
      v = s / p,
      g = isFinite(s) ? 1 + Math.floor(c * v) : ki;
    g > ki &&
      it(
        `sigmaRadians, ${s}, is too large and will clip, as it requested ${g} samples when the maximum is set to ${ki}`,
      );
    const m = [];
    let y = 0;
    for (let k = 0; k < ki; ++k) {
      const x = k / v,
        T = Math.exp((-x * x) / 2);
      (m.push(T), k === 0 ? (y += T) : k < g && (y += 2 * T));
    }
    for (let k = 0; k < m.length; k++) m[k] = m[k] / y;
    ((d.envMap.value = e.texture),
      (d.samples.value = g),
      (d.weights.value = m),
      (d.latitudinal.value = a === "latitudinal"),
      o && (d.poleAxis.value = o));
    const { _lodMax: C } = this;
    ((d.dTheta.value = p), (d.mipInt.value = C - n));
    const E = this._sizeLods[r],
      w = 3 * E * (r > C - oi ? r - C + oi : 0),
      S = 4 * (this._cubeSize - E);
    (ms(t, w, S, 3 * E, 2 * E), A.setRenderTarget(t), A.render(h, ca));
  }
}

function iy(i) {
  const e = [],
    t = [],
    n = [];
  let r = i;
  const s = i - oi + 1 + af.length;
  for (let a = 0; a < s; a++) {
    const o = Math.pow(2, r);
    e.push(o);
    let A = 1 / o;
    (a > i - oi ? (A = af[a - i + oi - 1]) : a === 0 && (A = 0), t.push(A));
    const l = 1 / (o - 2),
      c = -l,
      h = 1 + l,
      d = [c, c, h, c, h, h, c, c, h, h, c, h],
      u = 6,
      p = 6,
      v = 3,
      g = 2,
      m = 1,
      y = new Float32Array(v * p * u),
      C = new Float32Array(g * p * u),
      E = new Float32Array(m * p * u);
    for (let S = 0; S < u; S++) {
      const k = ((S % 3) * 2) / 3 - 1,
        x = S > 2 ? 0 : -1,
        T = [
          k,
          x,
          0,
          k + 2 / 3,
          x,
          0,
          k + 2 / 3,
          x + 1,
          0,
          k,
          x,
          0,
          k + 2 / 3,
          x + 1,
          0,
          k,
          x + 1,
          0,
        ];
      (y.set(T, v * p * S), C.set(d, g * p * S));
      const R = [S, S, S, S, S, S];
      E.set(R, m * p * S);
    }
    const w = new Ct();
    (w.setAttribute("position", new zt(y, v)),
      w.setAttribute("uv", new zt(C, g)),
      w.setAttribute("faceIndex", new zt(E, m)),
      n.push(new Ee(w, null)),
      r > oi && r--);
  }
  return { lodMeshes: n, sizeLods: e, sigmas: t };
}

function Af(i, e, t) {
  const n = new qn(i, e, t);
  return (
    (n.texture.mapping = ZA),
    (n.texture.name = "PMREM.cubeUv"),
    (n.scissorTest = !0),
    n
  );
}

function ms(i, e, t, n, r) {
  (i.viewport.set(e, t, n, r), i.scissor.set(e, t, n, r));
}

function sy(i, e, t) {
  return new Lt({
    name: "PMREMGGXConvolution",
    defines: {
      GGX_SAMPLES: ny,
      CUBEUV_TEXEL_WIDTH: 1 / e,
      CUBEUV_TEXEL_HEIGHT: 1 / t,
      CUBEUV_MAX_MIP: `${i}.0`,
    },
    uniforms: {
      envMap: { value: null },
      roughness: { value: 0 },
      mipInt: { value: 0 },
    },
    vertexShader: ol(),
    fragmentShader: `

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,
    blending: gr,
    depthTest: !1,
    depthWrite: !1,
  });
}

function ay(i, e, t) {
  const n = new Float32Array(ki),
    r = new F(0, 1, 0);
  return new Lt({
    name: "SphericalGaussianBlur",
    defines: {
      n: ki,
      CUBEUV_TEXEL_WIDTH: 1 / e,
      CUBEUV_TEXEL_HEIGHT: 1 / t,
      CUBEUV_MAX_MIP: `${i}.0`,
    },
    uniforms: {
      envMap: { value: null },
      samples: { value: 1 },
      weights: { value: n },
      latitudinal: { value: !1 },
      dTheta: { value: 0 },
      mipInt: { value: 0 },
      poleAxis: { value: r },
    },
    vertexShader: ol(),
    fragmentShader: `

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,
    blending: gr,
    depthTest: !1,
    depthWrite: !1,
  });
}

function lf() {
  return new Lt({
    name: "EquirectangularToCubeUV",
    uniforms: { envMap: { value: null } },
    vertexShader: ol(),
    fragmentShader: `

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,
    blending: gr,
    depthTest: !1,
    depthWrite: !1,
  });
}

function cf() {
  return new Lt({
    name: "CubemapToCubeUV",
    uniforms: { envMap: { value: null }, flipEnvMap: { value: -1 } },
    vertexShader: ol(),
    fragmentShader: `

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,
    blending: gr,
    depthTest: !1,
    depthWrite: !1,
  });
}

function ol() {
  return `

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`;
}

class r0 extends qn {
  constructor(e = 1, t = {}) {
    (super(e, e, t), (this.isWebGLCubeRenderTarget = !0));
    const n = { width: e, height: e, depth: 1 },
      r = [n, n, n, n, n, n];
    ((this.texture = new Fm(r)),
      this._setTextureOptions(t),
      (this.texture.isRenderTargetTexture = !0));
  }
  fromEquirectangularTexture(e, t) {
    ((this.texture.type = t.type),
      (this.texture.colorSpace = t.colorSpace),
      (this.texture.generateMipmaps = t.generateMipmaps),
      (this.texture.minFilter = t.minFilter),
      (this.texture.magFilter = t.magFilter));
    const n = {
        uniforms: { tEquirect: { value: null } },
        vertexShader: `

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,
        fragmentShader: `

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`,
      },
      r = new Tn(5, 5, 5),
      s = new Lt({
        name: "CubemapFromEquirect",
        uniforms: Us(n.uniforms),
        vertexShader: n.vertexShader,
        fragmentShader: n.fragmentShader,
        side: pn,
        blending: gr,
      });
    s.uniforms.tEquirect.value = t;
    const a = new Ee(r, s),
      o = t.minFilter;
    return (
      t.minFilter === pr && (t.minFilter = qt),
      new t6(1, 10, this).update(e, a),
      (t.minFilter = o),
      a.geometry.dispose(),
      a.material.dispose(),
      this
    );
  }
  clear(e, t = !0, n = !0, r = !0) {
    const s = e.getRenderTarget();
    for (let a = 0; a < 6; a++) (e.setRenderTarget(this, a), e.clear(t, n, r));
    e.setRenderTarget(s);
  }
}

function oy(i) {
  let e = new WeakMap(),
    t = new WeakMap(),
    n = null;
  function r(d, u = !1) {
    return d == null ? null : u ? a(d) : s(d);
  }
  function s(d) {
    if (d && d.isTexture) {
      const u = d.mapping;
      if (u === _l || u === El)
        if (e.has(d)) {
          const p = e.get(d).texture;
          return o(p, d.mapping);
        } else {
          const p = d.image;
          if (p && p.height > 0) {
            const v = new r0(p.height);
            return (
              v.fromEquirectangularTexture(i, d),
              e.set(d, v),
              d.addEventListener("dispose", l),
              o(v.texture, d.mapping)
            );
          } else return null;
        }
    }
    return d;
  }
  function a(d) {
    if (d && d.isTexture) {
      const u = d.mapping,
        p = u === _l || u === El,
        v = u === Ui || u === Fs;
      if (p || v) {
        let g = t.get(d);
        const m = g !== void 0 ? g.texture.pmremVersion : 0;
        if (d.isRenderTargetTexture && d.pmremVersion !== m)
          return (
            n === null && (n = new NA(i)),
            (g = p ? n.fromEquirectangular(d, g) : n.fromCubemap(d, g)),
            (g.texture.pmremVersion = d.pmremVersion),
            t.set(d, g),
            g.texture
          );
        if (g !== void 0) return g.texture;
        {
          const y = d.image;
          return (p && y && y.height > 0) || (v && y && A(y))
            ? (n === null && (n = new NA(i)),
              (g = p ? n.fromEquirectangular(d) : n.fromCubemap(d)),
              (g.texture.pmremVersion = d.pmremVersion),
              t.set(d, g),
              d.addEventListener("dispose", c),
              g.texture)
            : null;
        }
      }
    }
    return d;
  }
  function o(d, u) {
    return (u === _l ? (d.mapping = Ui) : u === El && (d.mapping = Fs), d);
  }
  function A(d) {
    let u = 0;
    const p = 6;
    for (let v = 0; v < p; v++) d[v] !== void 0 && u++;
    return u === p;
  }
  function l(d) {
    const u = d.target;
    u.removeEventListener("dispose", l);
    const p = e.get(u);
    p !== void 0 && (e.delete(u), p.dispose());
  }
  function c(d) {
    const u = d.target;
    u.removeEventListener("dispose", c);
    const p = t.get(u);
    p !== void 0 && (t.delete(u), p.dispose());
  }
  function h() {
    ((e = new WeakMap()),
      (t = new WeakMap()),
      n !== null && (n.dispose(), (n = null)));
  }
  return { get: r, dispose: h };
}

function Ay(i) {
  const e = {};
  function t(n) {
    if (e[n] !== void 0) return e[n];
    const r = i.getExtension(n);
    return ((e[n] = r), r);
  }
  return {
    has: function (n) {
      return t(n) !== null;
    },
    init: function () {
      (t("EXT_color_buffer_float"),
        t("WEBGL_clip_cull_distance"),
        t("OES_texture_float_linear"),
        t("EXT_color_buffer_half_float"),
        t("WEBGL_multisampled_render_to_texture"),
        t("WEBGL_render_shared_exponent"));
    },
    get: function (n) {
      const r = t(n);
      return (
        r === null && Ms("WebGLRenderer: " + n + " extension not supported."),
        r
      );
    },
  };
}

function ly(i, e, t, n) {
  const r = {},
    s = new WeakMap();
  function a(h) {
    const d = h.target;
    d.index !== null && e.remove(d.index);
    for (const p in d.attributes) e.remove(d.attributes[p]);
    (d.removeEventListener("dispose", a), delete r[d.id]);
    const u = s.get(d);
    (u && (e.remove(u), s.delete(d)),
      n.releaseStatesOfGeometry(d),
      d.isInstancedBufferGeometry === !0 && delete d._maxInstanceCount,
      t.memory.geometries--);
  }
  function o(h, d) {
    return (
      r[d.id] === !0 ||
        (d.addEventListener("dispose", a),
        (r[d.id] = !0),
        t.memory.geometries++),
      d
    );
  }
  function A(h) {
    const d = h.attributes;
    for (const u in d) e.update(d[u], i.ARRAY_BUFFER);
  }
  function l(h) {
    const d = [],
      u = h.index,
      p = h.attributes.position;
    let v = 0;
    if (p === void 0) return;
    if (u !== null) {
      const y = u.array;
      v = u.version;
      for (let C = 0, E = y.length; C < E; C += 3) {
        const w = y[C + 0],
          S = y[C + 1],
          k = y[C + 2];
        d.push(w, S, S, k, k, w);
      }
    } else {
      const y = p.array;
      v = p.version;
      for (let C = 0, E = y.length / 3 - 1; C < E; C += 3) {
        const w = C + 0,
          S = C + 1,
          k = C + 2;
        d.push(w, S, S, k, k, w);
      }
    }
    const g = new (p.count >= 65535 ? km : Bm)(d, 1);
    g.version = v;
    const m = s.get(h);
    (m && e.remove(m), s.set(h, g));
  }
  function c(h) {
    const d = s.get(h);
    if (d) {
      const u = h.index;
      u !== null && d.version < u.version && l(h);
    } else l(h);
    return s.get(h);
  }
  return { get: o, update: A, getWireframeAttribute: c };
}

function cy(i, e, t) {
  let n;
  function r(h) {
    n = h;
  }
  let s, a;
  function o(h) {
    ((s = h.type), (a = h.bytesPerElement));
  }
  function A(h, d) {
    (i.drawElements(n, d, s, h * a), t.update(d, n, 1));
  }
  function l(h, d, u) {
    u !== 0 && (i.drawElementsInstanced(n, d, s, h * a, u), t.update(d, n, u));
  }
  function c(h, d, u) {
    if (u === 0) return;
    e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n, d, 0, s, h, 0, u);
    let v = 0;
    for (let g = 0; g < u; g++) v += d[g];
    t.update(v, n, 1);
  }
  ((this.setMode = r),
    (this.setIndex = o),
    (this.render = A),
    (this.renderInstances = l),
    (this.renderMultiDraw = c));
}

function hy(i) {
  const e = { geometries: 0, textures: 0 },
    t = { frame: 0, calls: 0, triangles: 0, points: 0, lines: 0 };
  function n(s, a, o) {
    switch ((t.calls++, a)) {
      case i.TRIANGLES:
        t.triangles += o * (s / 3);
        break;
      case i.LINES:
        t.lines += o * (s / 2);
        break;
      case i.LINE_STRIP:
        t.lines += o * (s - 1);
        break;
      case i.LINE_LOOP:
        t.lines += o * s;
        break;
      case i.POINTS:
        t.points += o * s;
        break;
      default:
        ut("WebGLInfo: Unknown draw mode:", a);
        break;
    }
  }
  function r() {
    ((t.calls = 0), (t.triangles = 0), (t.points = 0), (t.lines = 0));
  }
  return {
    memory: e,
    render: t,
    programs: null,
    autoReset: !0,
    reset: r,
    update: n,
  };
}

function dy(i, e, t) {
  const n = new WeakMap(),
    r = new Pt();
  function s(a, o, A) {
    const l = a.morphTargetInfluences,
      c =
        o.morphAttributes.position ||
        o.morphAttributes.normal ||
        o.morphAttributes.color,
      h = c !== void 0 ? c.length : 0;
    let d = n.get(o);
    if (d === void 0 || d.count !== h) {
      let T = function () {
        (k.dispose(), n.delete(o), o.removeEventListener("dispose", T));
      };
      d !== void 0 && d.texture.dispose();
      const u = o.morphAttributes.position !== void 0,
        p = o.morphAttributes.normal !== void 0,
        v = o.morphAttributes.color !== void 0,
        g = o.morphAttributes.position || [],
        m = o.morphAttributes.normal || [],
        y = o.morphAttributes.color || [];
      let C = 0;
      (u === !0 && (C = 1), p === !0 && (C = 2), v === !0 && (C = 3));
      let E = o.attributes.position.count * C,
        w = 1;
      E > e.maxTextureSize &&
        ((w = Math.ceil(E / e.maxTextureSize)), (E = e.maxTextureSize));
      const S = new Float32Array(E * w * 4 * h),
        k = new Sm(S, E, w, h);
      ((k.type = On), (k.needsUpdate = !0));
      const x = C * 4;
      for (let R = 0; R < h; R++) {
        const D = g[R],
          N = m[R],
          X = y[R],
          Y = E * w * 4 * R;
        for (let H = 0; H < D.count; H++) {
          const V = H * x;
          (u === !0 &&
            (r.fromBufferAttribute(D, H),
            (S[Y + V + 0] = r.x),
            (S[Y + V + 1] = r.y),
            (S[Y + V + 2] = r.z),
            (S[Y + V + 3] = 0)),
            p === !0 &&
              (r.fromBufferAttribute(N, H),
              (S[Y + V + 4] = r.x),
              (S[Y + V + 5] = r.y),
              (S[Y + V + 6] = r.z),
              (S[Y + V + 7] = 0)),
            v === !0 &&
              (r.fromBufferAttribute(X, H),
              (S[Y + V + 8] = r.x),
              (S[Y + V + 9] = r.y),
              (S[Y + V + 10] = r.z),
              (S[Y + V + 11] = X.itemSize === 4 ? r.w : 1)));
        }
      }
      ((d = { count: h, texture: k, size: new Ae(E, w) }),
        n.set(o, d),
        o.addEventListener("dispose", T));
    }
    if (a.isInstancedMesh === !0 && a.morphTexture !== null)
      A.getUniforms().setValue(i, "morphTexture", a.morphTexture, t);
    else {
      let u = 0;
      for (let v = 0; v < l.length; v++) u += l[v];
      const p = o.morphTargetsRelative ? 1 : 1 - u;
      (A.getUniforms().setValue(i, "morphTargetBaseInfluence", p),
        A.getUniforms().setValue(i, "morphTargetInfluences", l));
    }
    (A.getUniforms().setValue(i, "morphTargetsTexture", d.texture, t),
      A.getUniforms().setValue(i, "morphTargetsTextureSize", d.size));
  }
  return { update: s };
}

function uy(i, e, t, n, r) {
  let s = new WeakMap();
  function a(l) {
    const c = r.render.frame,
      h = l.geometry,
      d = e.get(l, h);
    if (
      (s.get(d) !== c && (e.update(d), s.set(d, c)),
      l.isInstancedMesh &&
        (l.hasEventListener("dispose", A) === !1 &&
          l.addEventListener("dispose", A),
        s.get(l) !== c &&
          (t.update(l.instanceMatrix, i.ARRAY_BUFFER),
          l.instanceColor !== null && t.update(l.instanceColor, i.ARRAY_BUFFER),
          s.set(l, c))),
      l.isSkinnedMesh)
    ) {
      const u = l.skeleton;
      s.get(u) !== c && (u.update(), s.set(u, c));
    }
    return d;
  }
  function o() {
    s = new WeakMap();
  }
  function A(l) {
    const c = l.target;
    (c.removeEventListener("dispose", A),
      n.releaseStatesOfObject(c),
      t.remove(c.instanceMatrix),
      c.instanceColor !== null && t.remove(c.instanceColor));
  }
  return { update: a, dispose: o };
}

const fy = {
  [sd]: "LINEAR_TONE_MAPPING",
  [ad]: "REINHARD_TONE_MAPPING",
  [od]: "CINEON_TONE_MAPPING",
  [oo]: "ACES_FILMIC_TONE_MAPPING",
  [ld]: "AGX_TONE_MAPPING",
  [cd]: "NEUTRAL_TONE_MAPPING",
  [Ad]: "CUSTOM_TONE_MAPPING",
};

function py(i, e, t, n, r, s) {
  const a = new qn(e, t, {
      type: i,
      depthBuffer: r,
      stencilBuffer: s,
      samples: n ? 4 : 0,
      depthTexture: r ? new Gs(e, t) : void 0,
    }),
    o = new qn(e, t, { type: er, depthBuffer: !1, stencilBuffer: !1 }),
    A = new Ct();
  (A.setAttribute("position", new Ke([-1, 3, 0, -1, -1, 0, 3, -1, 0], 3)),
    A.setAttribute("uv", new Ke([0, 2, 0, 0, 2, 0], 2)));
  const l = new Ym({
      uniforms: { tDiffuse: { value: null } },
      vertexShader: `
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,
      fragmentShader: `
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,
      depthTest: !1,
      depthWrite: !1,
    }),
    c = new Ee(A, l),
    h = new lo(-1, 1, 1, -1, 0, 1);
  let d = null,
    u = null,
    p = !1,
    v,
    g = null,
    m = [],
    y = !1;
  ((this.setSize = function (C, E) {
    (a.setSize(C, E), o.setSize(C, E));
    for (let w = 0; w < m.length; w++) {
      const S = m[w];
      S.setSize && S.setSize(C, E);
    }
  }),
    (this.setEffects = function (C) {
      ((m = C), (y = m.length > 0 && m[0].isRenderPass === !0));
      const E = a.width,
        w = a.height;
      for (let S = 0; S < m.length; S++) {
        const k = m[S];
        k.setSize && k.setSize(E, w);
      }
    }),
    (this.begin = function (C, E) {
      if (p || (C.toneMapping === vr && m.length === 0)) return !1;
      if (((g = E), E !== null)) {
        const w = E.width,
          S = E.height;
        (a.width !== w || a.height !== S) && this.setSize(w, S);
      }
      return (
        y === !1 && C.setRenderTarget(a),
        (v = C.toneMapping),
        (C.toneMapping = vr),
        !0
      );
    }),
    (this.hasRenderPass = function () {
      return y;
    }),
    (this.end = function (C, E) {
      ((C.toneMapping = v), (p = !0));
      let w = a,
        S = o;
      for (let k = 0; k < m.length; k++) {
        const x = m[k];
        if (x.enabled !== !1 && (x.render(C, S, w, E), x.needsSwap !== !1)) {
          const T = w;
          ((w = S), (S = T));
        }
      }
      if (d !== C.outputColorSpace || u !== C.toneMapping) {
        ((d = C.outputColorSpace),
          (u = C.toneMapping),
          (l.defines = {}),
          bt.getTransfer(d) === kt && (l.defines.SRGB_TRANSFER = ""));
        const k = fy[u];
        (k && (l.defines[k] = ""), (l.needsUpdate = !0));
      }
      ((l.uniforms.tDiffuse.value = w.texture),
        C.setRenderTarget(g),
        C.render(c, h),
        (g = null),
        (p = !1));
    }),
    (this.isCompositing = function () {
      return p;
    }),
    (this.dispose = function () {
      (a.depthTexture && a.depthTexture.dispose(),
        a.dispose(),
        o.dispose(),
        A.dispose(),
        l.dispose());
    }));
}

const i0 = new Zt();

const kh = new Gs(1, 1);

const s0 = new Sm();

const a0 = new Tv();

const o0 = new Fm();

const hf = [];

const df = [];

const uf = new Float32Array(16);

const ff = new Float32Array(9);

const pf = new Float32Array(4);

function Xs(i, e, t) {
  const n = i[0];
  if (n <= 0 || n > 0) return i;
  const r = e * t;
  let s = hf[r];
  if ((s === void 0 && ((s = new Float32Array(r)), (hf[r] = s)), e !== 0)) {
    n.toArray(s, 0);
    for (let a = 1, o = 0; a !== e; ++a) ((o += t), i[a].toArray(s, o));
  }
  return s;
}

function en(i, e) {
  if (i.length !== e.length) return !1;
  for (let t = 0, n = i.length; t < n; t++) if (i[t] !== e[t]) return !1;
  return !0;
}

function tn(i, e) {
  for (let t = 0, n = e.length; t < n; t++) i[t] = e[t];
}

function Al(i, e) {
  let t = df[e];
  t === void 0 && ((t = new Int32Array(e)), (df[e] = t));
  for (let n = 0; n !== e; ++n) t[n] = i.allocateTextureUnit();
  return t;
}

function my(i, e) {
  const t = this.cache;
  t[0] !== e && (i.uniform1f(this.addr, e), (t[0] = e));
}

function gy(i, e) {
  const t = this.cache;
  if (e.x !== void 0)
    (t[0] !== e.x || t[1] !== e.y) &&
      (i.uniform2f(this.addr, e.x, e.y), (t[0] = e.x), (t[1] = e.y));
  else {
    if (en(t, e)) return;
    (i.uniform2fv(this.addr, e), tn(t, e));
  }
}

function vy(i, e) {
  const t = this.cache;
  if (e.x !== void 0)
    (t[0] !== e.x || t[1] !== e.y || t[2] !== e.z) &&
      (i.uniform3f(this.addr, e.x, e.y, e.z),
      (t[0] = e.x),
      (t[1] = e.y),
      (t[2] = e.z));
  else if (e.r !== void 0)
    (t[0] !== e.r || t[1] !== e.g || t[2] !== e.b) &&
      (i.uniform3f(this.addr, e.r, e.g, e.b),
      (t[0] = e.r),
      (t[1] = e.g),
      (t[2] = e.b));
  else {
    if (en(t, e)) return;
    (i.uniform3fv(this.addr, e), tn(t, e));
  }
}

function jy(i, e) {
  const t = this.cache;
  if (e.x !== void 0)
    (t[0] !== e.x || t[1] !== e.y || t[2] !== e.z || t[3] !== e.w) &&
      (i.uniform4f(this.addr, e.x, e.y, e.z, e.w),
      (t[0] = e.x),
      (t[1] = e.y),
      (t[2] = e.z),
      (t[3] = e.w));
  else {
    if (en(t, e)) return;
    (i.uniform4fv(this.addr, e), tn(t, e));
  }
}

function _y(i, e) {
  const t = this.cache,
    n = e.elements;
  if (n === void 0) {
    if (en(t, e)) return;
    (i.uniformMatrix2fv(this.addr, !1, e), tn(t, e));
  } else {
    if (en(t, n)) return;
    (pf.set(n), i.uniformMatrix2fv(this.addr, !1, pf), tn(t, n));
  }
}

function Ey(i, e) {
  const t = this.cache,
    n = e.elements;
  if (n === void 0) {
    if (en(t, e)) return;
    (i.uniformMatrix3fv(this.addr, !1, e), tn(t, e));
  } else {
    if (en(t, n)) return;
    (ff.set(n), i.uniformMatrix3fv(this.addr, !1, ff), tn(t, n));
  }
}

function yy(i, e) {
  const t = this.cache,
    n = e.elements;
  if (n === void 0) {
    if (en(t, e)) return;
    (i.uniformMatrix4fv(this.addr, !1, e), tn(t, e));
  } else {
    if (en(t, n)) return;
    (uf.set(n), i.uniformMatrix4fv(this.addr, !1, uf), tn(t, n));
  }
}

function xy(i, e) {
  const t = this.cache;
  t[0] !== e && (i.uniform1i(this.addr, e), (t[0] = e));
}

function Cy(i, e) {
  const t = this.cache;
  if (e.x !== void 0)
    (t[0] !== e.x || t[1] !== e.y) &&
      (i.uniform2i(this.addr, e.x, e.y), (t[0] = e.x), (t[1] = e.y));
  else {
    if (en(t, e)) return;
    (i.uniform2iv(this.addr, e), tn(t, e));
  }
}

function by(i, e) {
  const t = this.cache;
  if (e.x !== void 0)
    (t[0] !== e.x || t[1] !== e.y || t[2] !== e.z) &&
      (i.uniform3i(this.addr, e.x, e.y, e.z),
      (t[0] = e.x),
      (t[1] = e.y),
      (t[2] = e.z));
  else {
    if (en(t, e)) return;
    (i.uniform3iv(this.addr, e), tn(t, e));
  }
}

function Sy(i, e) {
  const t = this.cache;
  if (e.x !== void 0)
    (t[0] !== e.x || t[1] !== e.y || t[2] !== e.z || t[3] !== e.w) &&
      (i.uniform4i(this.addr, e.x, e.y, e.z, e.w),
      (t[0] = e.x),
      (t[1] = e.y),
      (t[2] = e.z),
      (t[3] = e.w));
  else {
    if (en(t, e)) return;
    (i.uniform4iv(this.addr, e), tn(t, e));
  }
}

function wy(i, e) {
  const t = this.cache;
  t[0] !== e && (i.uniform1ui(this.addr, e), (t[0] = e));
}

function My(i, e) {
  const t = this.cache;
  if (e.x !== void 0)
    (t[0] !== e.x || t[1] !== e.y) &&
      (i.uniform2ui(this.addr, e.x, e.y), (t[0] = e.x), (t[1] = e.y));
  else {
    if (en(t, e)) return;
    (i.uniform2uiv(this.addr, e), tn(t, e));
  }
}

function By(i, e) {
  const t = this.cache;
  if (e.x !== void 0)
    (t[0] !== e.x || t[1] !== e.y || t[2] !== e.z) &&
      (i.uniform3ui(this.addr, e.x, e.y, e.z),
      (t[0] = e.x),
      (t[1] = e.y),
      (t[2] = e.z));
  else {
    if (en(t, e)) return;
    (i.uniform3uiv(this.addr, e), tn(t, e));
  }
}

function ky(i, e) {
  const t = this.cache;
  if (e.x !== void 0)
    (t[0] !== e.x || t[1] !== e.y || t[2] !== e.z || t[3] !== e.w) &&
      (i.uniform4ui(this.addr, e.x, e.y, e.z, e.w),
      (t[0] = e.x),
      (t[1] = e.y),
      (t[2] = e.z),
      (t[3] = e.w));
  else {
    if (en(t, e)) return;
    (i.uniform4uiv(this.addr, e), tn(t, e));
  }
}

function Ty(i, e, t) {
  const n = this.cache,
    r = t.allocateTextureUnit();
  n[0] !== r && (i.uniform1i(this.addr, r), (n[0] = r));
  let s;
  (this.type === i.SAMPLER_2D_SHADOW
    ? ((kh.compareFunction = t.isReversedDepthBuffer() ? vd : gd), (s = kh))
    : (s = i0),
    t.setTexture2D(e || s, r));
}

function Ry(i, e, t) {
  const n = this.cache,
    r = t.allocateTextureUnit();
  (n[0] !== r && (i.uniform1i(this.addr, r), (n[0] = r)),
    t.setTexture3D(e || a0, r));
}

function Py(i, e, t) {
  const n = this.cache,
    r = t.allocateTextureUnit();
  (n[0] !== r && (i.uniform1i(this.addr, r), (n[0] = r)),
    t.setTextureCube(e || o0, r));
}

function Iy(i, e, t) {
  const n = this.cache,
    r = t.allocateTextureUnit();
  (n[0] !== r && (i.uniform1i(this.addr, r), (n[0] = r)),
    t.setTexture2DArray(e || s0, r));
}

function Ly(i) {
  switch (i) {
    case 5126:
      return my;
    case 35664:
      return gy;
    case 35665:
      return vy;
    case 35666:
      return jy;
    case 35674:
      return _y;
    case 35675:
      return Ey;
    case 35676:
      return yy;
    case 5124:
    case 35670:
      return xy;
    case 35667:
    case 35671:
      return Cy;
    case 35668:
    case 35672:
      return by;
    case 35669:
    case 35673:
      return Sy;
    case 5125:
      return wy;
    case 36294:
      return My;
    case 36295:
      return By;
    case 36296:
      return ky;
    case 35678:
    case 36198:
    case 36298:
    case 36306:
    case 35682:
      return Ty;
    case 35679:
    case 36299:
    case 36307:
      return Ry;
    case 35680:
    case 36300:
    case 36308:
    case 36293:
      return Py;
    case 36289:
    case 36303:
    case 36311:
    case 36292:
      return Iy;
  }
}

function Fy(i, e) {
  i.uniform1fv(this.addr, e);
}

function Dy(i, e) {
  const t = Xs(e, this.size, 2);
  i.uniform2fv(this.addr, t);
}

function Ny(i, e) {
  const t = Xs(e, this.size, 3);
  i.uniform3fv(this.addr, t);
}

function Gy(i, e) {
  const t = Xs(e, this.size, 4);
  i.uniform4fv(this.addr, t);
}

function Oy(i, e) {
  const t = Xs(e, this.size, 4);
  i.uniformMatrix2fv(this.addr, !1, t);
}

function Hy(i, e) {
  const t = Xs(e, this.size, 9);
  i.uniformMatrix3fv(this.addr, !1, t);
}

function Uy(i, e) {
  const t = Xs(e, this.size, 16);
  i.uniformMatrix4fv(this.addr, !1, t);
}

function qy(i, e) {
  i.uniform1iv(this.addr, e);
}

function $y(i, e) {
  i.uniform2iv(this.addr, e);
}

function zy(i, e) {
  i.uniform3iv(this.addr, e);
}

function Vy(i, e) {
  i.uniform4iv(this.addr, e);
}

function Wy(i, e) {
  i.uniform1uiv(this.addr, e);
}

function Xy(i, e) {
  i.uniform2uiv(this.addr, e);
}

function Jy(i, e) {
  i.uniform3uiv(this.addr, e);
}

function Ky(i, e) {
  i.uniform4uiv(this.addr, e);
}

function Yy(i, e, t) {
  const n = this.cache,
    r = e.length,
    s = Al(t, r);
  en(n, s) || (i.uniform1iv(this.addr, s), tn(n, s));
  let a;
  this.type === i.SAMPLER_2D_SHADOW ? (a = kh) : (a = i0);
  for (let o = 0; o !== r; ++o) t.setTexture2D(e[o] || a, s[o]);
}

function Zy(i, e, t) {
  const n = this.cache,
    r = e.length,
    s = Al(t, r);
  en(n, s) || (i.uniform1iv(this.addr, s), tn(n, s));
  for (let a = 0; a !== r; ++a) t.setTexture3D(e[a] || a0, s[a]);
}

function Qy(i, e, t) {
  const n = this.cache,
    r = e.length,
    s = Al(t, r);
  en(n, s) || (i.uniform1iv(this.addr, s), tn(n, s));
  for (let a = 0; a !== r; ++a) t.setTextureCube(e[a] || o0, s[a]);
}

function ex(i, e, t) {
  const n = this.cache,
    r = e.length,
    s = Al(t, r);
  en(n, s) || (i.uniform1iv(this.addr, s), tn(n, s));
  for (let a = 0; a !== r; ++a) t.setTexture2DArray(e[a] || s0, s[a]);
}

function tx(i) {
  switch (i) {
    case 5126:
      return Fy;
    case 35664:
      return Dy;
    case 35665:
      return Ny;
    case 35666:
      return Gy;
    case 35674:
      return Oy;
    case 35675:
      return Hy;
    case 35676:
      return Uy;
    case 5124:
    case 35670:
      return qy;
    case 35667:
    case 35671:
      return $y;
    case 35668:
    case 35672:
      return zy;
    case 35669:
    case 35673:
      return Vy;
    case 5125:
      return Wy;
    case 36294:
      return Xy;
    case 36295:
      return Jy;
    case 36296:
      return Ky;
    case 35678:
    case 36198:
    case 36298:
    case 36306:
    case 35682:
      return Yy;
    case 35679:
    case 36299:
    case 36307:
      return Zy;
    case 35680:
    case 36300:
    case 36308:
    case 36293:
      return Qy;
    case 36289:
    case 36303:
    case 36311:
    case 36292:
      return ex;
  }
}

class nx {
  constructor(e, t, n) {
    ((this.id = e),
      (this.addr = n),
      (this.cache = []),
      (this.type = t.type),
      (this.setValue = Ly(t.type)));
  }
}

class rx {
  constructor(e, t, n) {
    ((this.id = e),
      (this.addr = n),
      (this.cache = []),
      (this.type = t.type),
      (this.size = t.size),
      (this.setValue = tx(t.type)));
  }
}

class ix {
  constructor(e) {
    ((this.id = e), (this.seq = []), (this.map = {}));
  }
  setValue(e, t, n) {
    const r = this.seq;
    for (let s = 0, a = r.length; s !== a; ++s) {
      const o = r[s];
      o.setValue(e, t[o.id], n);
    }
  }
}

const sc = /(\w+)(\])?(\[|\.)?/g;

function mf(i, e) {
  (i.seq.push(e), (i.map[e.id] = e));
}

function sx(i, e, t) {
  const n = i.name,
    r = n.length;
  for (sc.lastIndex = 0; ; ) {
    const s = sc.exec(n),
      a = sc.lastIndex;
    let o = s[1];
    const A = s[2] === "]",
      l = s[3];
    if ((A && (o = o | 0), l === void 0 || (l === "[" && a + 2 === r))) {
      mf(t, l === void 0 ? new nx(o, i, e) : new rx(o, i, e));
      break;
    } else {
      let h = t.map[o];
      (h === void 0 && ((h = new ix(o)), mf(t, h)), (t = h));
    }
  }
}

class jA {
  constructor(e, t) {
    ((this.seq = []), (this.map = {}));
    const n = e.getProgramParameter(t, e.ACTIVE_UNIFORMS);
    for (let a = 0; a < n; ++a) {
      const o = e.getActiveUniform(t, a),
        A = e.getUniformLocation(t, o.name);
      sx(o, A, this);
    }
    const r = [],
      s = [];
    for (const a of this.seq)
      a.type === e.SAMPLER_2D_SHADOW ||
      a.type === e.SAMPLER_CUBE_SHADOW ||
      a.type === e.SAMPLER_2D_ARRAY_SHADOW
        ? r.push(a)
        : s.push(a);
    r.length > 0 && (this.seq = r.concat(s));
  }
  setValue(e, t, n, r) {
    const s = this.map[t];
    s !== void 0 && s.setValue(e, n, r);
  }
  setOptional(e, t, n) {
    const r = t[n];
    r !== void 0 && this.setValue(e, n, r);
  }
  static upload(e, t, n, r) {
    for (let s = 0, a = t.length; s !== a; ++s) {
      const o = t[s],
        A = n[o.id];
      A.needsUpdate !== !1 && o.setValue(e, A.value, r);
    }
  }
  static seqWithValue(e, t) {
    const n = [];
    for (let r = 0, s = e.length; r !== s; ++r) {
      const a = e[r];
      a.id in t && n.push(a);
    }
    return n;
  }
}

function gf(i, e, t) {
  const n = i.createShader(e);
  return (i.shaderSource(n, t), i.compileShader(n), n);
}

const ax = 37297;

let ox = 0;

function Ax(i, e) {
  const t = i.split(`
`),
    n = [],
    r = Math.max(e - 6, 0),
    s = Math.min(e + 6, t.length);
  for (let a = r; a < s; a++) {
    const o = a + 1;
    n.push(`${o === e ? ">" : " "} ${o}: ${t[a]}`);
  }
  return n.join(`
`);
}

const vf = new jt();

function lx(i) {
  bt._getMatrix(vf, bt.workingColorSpace, i);
  const e = `mat3( ${vf.elements.map((t) => t.toFixed(4))} )`;
  switch (bt.getTransfer(i)) {
    case RA:
      return [e, "LinearTransferOETF"];
    case kt:
      return [e, "sRGBTransferOETF"];
    default:
      return (
        it("WebGLProgram: Unsupported color space: ", i),
        [e, "LinearTransferOETF"]
      );
  }
}

function jf(i, e, t) {
  const n = i.getShaderParameter(e, i.COMPILE_STATUS),
    s = (i.getShaderInfoLog(e) || "").trim();
  if (n && s === "") return "";
  const a = /ERROR: 0:(\d+)/.exec(s);
  if (a) {
    const o = parseInt(a[1]);
    return (
      t.toUpperCase() +
      `

` +
      s +
      `

` +
      Ax(i.getShaderSource(e), o)
    );
  } else return s;
}

function cx(i, e) {
  const t = lx(e);
  return [
    `vec4 ${i}( vec4 value ) {`,
    `	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,
    "}",
  ].join(`
`);
}

const hx = {
  [sd]: "Linear",
  [ad]: "Reinhard",
  [od]: "Cineon",
  [oo]: "ACESFilmic",
  [ld]: "AgX",
  [cd]: "Neutral",
  [Ad]: "Custom",
};

function dx(i, e) {
  const t = hx[e];
  return t === void 0
    ? (it("WebGLProgram: Unsupported toneMapping:", e),
      "vec3 " + i + "( vec3 color ) { return LinearToneMapping( color ); }")
    : "vec3 " + i + "( vec3 color ) { return " + t + "ToneMapping( color ); }";
}

const Jo = new F();

function ux() {
  bt.getLuminanceCoefficients(Jo);
  const i = Jo.x.toFixed(4),
    e = Jo.y.toFixed(4),
    t = Jo.z.toFixed(4);
  return [
    "float luminance( const in vec3 rgb ) {",
    `	const vec3 weights = vec3( ${i}, ${e}, ${t} );`,
    "	return dot( weights, rgb );",
    "}",
  ].join(`
`);
}

function fx(i) {
  return [
    i.extensionClipCullDistance
      ? "#extension GL_ANGLE_clip_cull_distance : require"
      : "",
    i.extensionMultiDraw ? "#extension GL_ANGLE_multi_draw : require" : "",
  ].filter(wa).join(`
`);
}

function px(i) {
  const e = [];
  for (const t in i) {
    const n = i[t];
    n !== !1 && e.push("#define " + t + " " + n);
  }
  return e.join(`
`);
}

function mx(i, e) {
  const t = {},
    n = i.getProgramParameter(e, i.ACTIVE_ATTRIBUTES);
  for (let r = 0; r < n; r++) {
    const s = i.getActiveAttrib(e, r),
      a = s.name;
    let o = 1;
    (s.type === i.FLOAT_MAT2 && (o = 2),
      s.type === i.FLOAT_MAT3 && (o = 3),
      s.type === i.FLOAT_MAT4 && (o = 4),
      (t[a] = {
        type: s.type,
        location: i.getAttribLocation(e, a),
        locationSize: o,
      }));
  }
  return t;
}

function wa(i) {
  return i !== "";
}

function _f(i, e) {
  const t =
    e.numSpotLightShadows + e.numSpotLightMaps - e.numSpotLightShadowsWithMaps;
  return i
    .replace(/NUM_DIR_LIGHTS/g, e.numDirLights)
    .replace(/NUM_SPOT_LIGHTS/g, e.numSpotLights)
    .replace(/NUM_SPOT_LIGHT_MAPS/g, e.numSpotLightMaps)
    .replace(/NUM_SPOT_LIGHT_COORDS/g, t)
    .replace(/NUM_RECT_AREA_LIGHTS/g, e.numRectAreaLights)
    .replace(/NUM_POINT_LIGHTS/g, e.numPointLights)
    .replace(/NUM_HEMI_LIGHTS/g, e.numHemiLights)
    .replace(/NUM_DIR_LIGHT_SHADOWS/g, e.numDirLightShadows)
    .replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g, e.numSpotLightShadowsWithMaps)
    .replace(/NUM_SPOT_LIGHT_SHADOWS/g, e.numSpotLightShadows)
    .replace(/NUM_POINT_LIGHT_SHADOWS/g, e.numPointLightShadows);
}

function Ef(i, e) {
  return i
    .replace(/NUM_CLIPPING_PLANES/g, e.numClippingPlanes)
    .replace(
      /UNION_CLIPPING_PLANES/g,
      e.numClippingPlanes - e.numClipIntersection,
    );
}

const gx = /^[ \t]*#include +<([\w\d./]+)>/gm;

function Th(i) {
  return i.replace(gx, jx);
}

const vx = new Map();

function jx(i, e) {
  let t = yt[e];
  if (t === void 0) {
    const n = vx.get(e);
    if (n !== void 0)
      ((t = yt[n]),
        it(
          'WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',
          e,
          n,
        ));
    else
      throw new Error(
        "THREE.WebGLProgram: Can not resolve #include <" + e + ">",
      );
  }
  return Th(t);
}

const _x =
  /#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;

function yf(i) {
  return i.replace(_x, Ex);
}

function Ex(i, e, t, n) {
  let r = "";
  for (let s = parseInt(e); s < parseInt(t); s++)
    r += n
      .replace(/\[\s*i\s*\]/g, "[ " + s + " ]")
      .replace(/UNROLLED_LOOP_INDEX/g, s);
  return r;
}

function xf(i) {
  let e = `precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;
  return (
    i.precision === "highp"
      ? (e += `
#define HIGH_PRECISION`)
      : i.precision === "mediump"
        ? (e += `
#define MEDIUM_PRECISION`)
        : i.precision === "lowp" &&
          (e += `
#define LOW_PRECISION`),
    e
  );
}

const yx = { [ka]: "SHADOWMAP_TYPE_PCF", [Ca]: "SHADOWMAP_TYPE_VSM" };

function xx(i) {
  return yx[i.shadowMapType] || "SHADOWMAP_TYPE_BASIC";
}

const Cx = {
  [Ui]: "ENVMAP_TYPE_CUBE",
  [Fs]: "ENVMAP_TYPE_CUBE",
  [ZA]: "ENVMAP_TYPE_CUBE_UV",
};

function bx(i) {
  return i.envMap === !1
    ? "ENVMAP_TYPE_CUBE"
    : Cx[i.envMapMode] || "ENVMAP_TYPE_CUBE";
}

const Sx = { [Fs]: "ENVMAP_MODE_REFRACTION" };

function wx(i) {
  return i.envMap === !1
    ? "ENVMAP_MODE_REFLECTION"
    : Sx[i.envMapMode] || "ENVMAP_MODE_REFLECTION";
}

const Mx = {
  [YA]: "ENVMAP_BLENDING_MULTIPLY",
  [Vg]: "ENVMAP_BLENDING_MIX",
  [Wg]: "ENVMAP_BLENDING_ADD",
};

function Bx(i) {
  return i.envMap === !1
    ? "ENVMAP_BLENDING_NONE"
    : Mx[i.combine] || "ENVMAP_BLENDING_NONE";
}

function kx(i) {
  const e = i.envMapCubeUVHeight;
  if (e === null) return null;
  const t = Math.log2(e) - 2,
    n = 1 / e;
  return {
    texelWidth: 1 / (3 * Math.max(Math.pow(2, t), 7 * 16)),
    texelHeight: n,
    maxMip: t,
  };
}

function Tx(i, e, t, n) {
  const r = i.getContext(),
    s = t.defines;
  let a = t.vertexShader,
    o = t.fragmentShader;
  const A = xx(t),
    l = bx(t),
    c = wx(t),
    h = Bx(t),
    d = kx(t),
    u = fx(t),
    p = px(s),
    v = r.createProgram();
  let g,
    m,
    y = t.glslVersion
      ? "#version " +
        t.glslVersion +
        `
`
      : "";
  (t.isRawShaderMaterial
    ? ((g = [
        "#define SHADER_TYPE " + t.shaderType,
        "#define SHADER_NAME " + t.shaderName,
        p,
      ].filter(wa).join(`
`)),
      g.length > 0 &&
        (g += `
`),
      (m = [
        "#define SHADER_TYPE " + t.shaderType,
        "#define SHADER_NAME " + t.shaderName,
        p,
      ].filter(wa).join(`
`)),
      m.length > 0 &&
        (m += `
`))
    : ((g = [
        xf(t),
        "#define SHADER_TYPE " + t.shaderType,
        "#define SHADER_NAME " + t.shaderName,
        p,
        t.extensionClipCullDistance ? "#define USE_CLIP_DISTANCE" : "",
        t.batching ? "#define USE_BATCHING" : "",
        t.batchingColor ? "#define USE_BATCHING_COLOR" : "",
        t.instancing ? "#define USE_INSTANCING" : "",
        t.instancingColor ? "#define USE_INSTANCING_COLOR" : "",
        t.instancingMorph ? "#define USE_INSTANCING_MORPH" : "",
        t.useFog && t.fog ? "#define USE_FOG" : "",
        t.useFog && t.fogExp2 ? "#define FOG_EXP2" : "",
        t.map ? "#define USE_MAP" : "",
        t.envMap ? "#define USE_ENVMAP" : "",
        t.envMap ? "#define " + c : "",
        t.lightMap ? "#define USE_LIGHTMAP" : "",
        t.aoMap ? "#define USE_AOMAP" : "",
        t.bumpMap ? "#define USE_BUMPMAP" : "",
        t.normalMap ? "#define USE_NORMALMAP" : "",
        t.normalMapObjectSpace ? "#define USE_NORMALMAP_OBJECTSPACE" : "",
        t.normalMapTangentSpace ? "#define USE_NORMALMAP_TANGENTSPACE" : "",
        t.displacementMap ? "#define USE_DISPLACEMENTMAP" : "",
        t.emissiveMap ? "#define USE_EMISSIVEMAP" : "",
        t.anisotropy ? "#define USE_ANISOTROPY" : "",
        t.anisotropyMap ? "#define USE_ANISOTROPYMAP" : "",
        t.clearcoatMap ? "#define USE_CLEARCOATMAP" : "",
        t.clearcoatRoughnessMap ? "#define USE_CLEARCOAT_ROUGHNESSMAP" : "",
        t.clearcoatNormalMap ? "#define USE_CLEARCOAT_NORMALMAP" : "",
        t.iridescenceMap ? "#define USE_IRIDESCENCEMAP" : "",
        t.iridescenceThicknessMap ? "#define USE_IRIDESCENCE_THICKNESSMAP" : "",
        t.specularMap ? "#define USE_SPECULARMAP" : "",
        t.specularColorMap ? "#define USE_SPECULAR_COLORMAP" : "",
        t.specularIntensityMap ? "#define USE_SPECULAR_INTENSITYMAP" : "",
        t.roughnessMap ? "#define USE_ROUGHNESSMAP" : "",
        t.metalnessMap ? "#define USE_METALNESSMAP" : "",
        t.alphaMap ? "#define USE_ALPHAMAP" : "",
        t.alphaHash ? "#define USE_ALPHAHASH" : "",
        t.transmission ? "#define USE_TRANSMISSION" : "",
        t.transmissionMap ? "#define USE_TRANSMISSIONMAP" : "",
        t.thicknessMap ? "#define USE_THICKNESSMAP" : "",
        t.sheenColorMap ? "#define USE_SHEEN_COLORMAP" : "",
        t.sheenRoughnessMap ? "#define USE_SHEEN_ROUGHNESSMAP" : "",
        t.mapUv ? "#define MAP_UV " + t.mapUv : "",
        t.alphaMapUv ? "#define ALPHAMAP_UV " + t.alphaMapUv : "",
        t.lightMapUv ? "#define LIGHTMAP_UV " + t.lightMapUv : "",
        t.aoMapUv ? "#define AOMAP_UV " + t.aoMapUv : "",
        t.emissiveMapUv ? "#define EMISSIVEMAP_UV " + t.emissiveMapUv : "",
        t.bumpMapUv ? "#define BUMPMAP_UV " + t.bumpMapUv : "",
        t.normalMapUv ? "#define NORMALMAP_UV " + t.normalMapUv : "",
        t.displacementMapUv
          ? "#define DISPLACEMENTMAP_UV " + t.displacementMapUv
          : "",
        t.metalnessMapUv ? "#define METALNESSMAP_UV " + t.metalnessMapUv : "",
        t.roughnessMapUv ? "#define ROUGHNESSMAP_UV " + t.roughnessMapUv : "",
        t.anisotropyMapUv
          ? "#define ANISOTROPYMAP_UV " + t.anisotropyMapUv
          : "",
        t.clearcoatMapUv ? "#define CLEARCOATMAP_UV " + t.clearcoatMapUv : "",
        t.clearcoatNormalMapUv
          ? "#define CLEARCOAT_NORMALMAP_UV " + t.clearcoatNormalMapUv
          : "",
        t.clearcoatRoughnessMapUv
          ? "#define CLEARCOAT_ROUGHNESSMAP_UV " + t.clearcoatRoughnessMapUv
          : "",
        t.iridescenceMapUv
          ? "#define IRIDESCENCEMAP_UV " + t.iridescenceMapUv
          : "",
        t.iridescenceThicknessMapUv
          ? "#define IRIDESCENCE_THICKNESSMAP_UV " + t.iridescenceThicknessMapUv
          : "",
        t.sheenColorMapUv
          ? "#define SHEEN_COLORMAP_UV " + t.sheenColorMapUv
          : "",
        t.sheenRoughnessMapUv
          ? "#define SHEEN_ROUGHNESSMAP_UV " + t.sheenRoughnessMapUv
          : "",
        t.specularMapUv ? "#define SPECULARMAP_UV " + t.specularMapUv : "",
        t.specularColorMapUv
          ? "#define SPECULAR_COLORMAP_UV " + t.specularColorMapUv
          : "",
        t.specularIntensityMapUv
          ? "#define SPECULAR_INTENSITYMAP_UV " + t.specularIntensityMapUv
          : "",
        t.transmissionMapUv
          ? "#define TRANSMISSIONMAP_UV " + t.transmissionMapUv
          : "",
        t.thicknessMapUv ? "#define THICKNESSMAP_UV " + t.thicknessMapUv : "",
        t.vertexTangents && t.flatShading === !1 ? "#define USE_TANGENT" : "",
        t.vertexNormals ? "#define HAS_NORMAL" : "",
        t.vertexColors ? "#define USE_COLOR" : "",
        t.vertexAlphas ? "#define USE_COLOR_ALPHA" : "",
        t.vertexUv1s ? "#define USE_UV1" : "",
        t.vertexUv2s ? "#define USE_UV2" : "",
        t.vertexUv3s ? "#define USE_UV3" : "",
        t.pointsUvs ? "#define USE_POINTS_UV" : "",
        t.flatShading ? "#define FLAT_SHADED" : "",
        t.skinning ? "#define USE_SKINNING" : "",
        t.morphTargets ? "#define USE_MORPHTARGETS" : "",
        t.morphNormals && t.flatShading === !1
          ? "#define USE_MORPHNORMALS"
          : "",
        t.morphColors ? "#define USE_MORPHCOLORS" : "",
        t.morphTargetsCount > 0
          ? "#define MORPHTARGETS_TEXTURE_STRIDE " + t.morphTextureStride
          : "",
        t.morphTargetsCount > 0
          ? "#define MORPHTARGETS_COUNT " + t.morphTargetsCount
          : "",
        t.doubleSided ? "#define DOUBLE_SIDED" : "",
        t.flipSided ? "#define FLIP_SIDED" : "",
        t.shadowMapEnabled ? "#define USE_SHADOWMAP" : "",
        t.shadowMapEnabled ? "#define " + A : "",
        t.sizeAttenuation ? "#define USE_SIZEATTENUATION" : "",
        t.numLightProbes > 0 ? "#define USE_LIGHT_PROBES" : "",
        t.logarithmicDepthBuffer ? "#define USE_LOGARITHMIC_DEPTH_BUFFER" : "",
        t.reversedDepthBuffer ? "#define USE_REVERSED_DEPTH_BUFFER" : "",
        "uniform mat4 modelMatrix;",
        "uniform mat4 modelViewMatrix;",
        "uniform mat4 projectionMatrix;",
        "uniform mat4 viewMatrix;",
        "uniform mat3 normalMatrix;",
        "uniform vec3 cameraPosition;",
        "uniform bool isOrthographic;",
        "#ifdef USE_INSTANCING",
        "	attribute mat4 instanceMatrix;",
        "#endif",
        "#ifdef USE_INSTANCING_COLOR",
        "	attribute vec3 instanceColor;",
        "#endif",
        "#ifdef USE_INSTANCING_MORPH",
        "	uniform sampler2D morphTexture;",
        "#endif",
        "attribute vec3 position;",
        "attribute vec3 normal;",
        "attribute vec2 uv;",
        "#ifdef USE_UV1",
        "	attribute vec2 uv1;",
        "#endif",
        "#ifdef USE_UV2",
        "	attribute vec2 uv2;",
        "#endif",
        "#ifdef USE_UV3",
        "	attribute vec2 uv3;",
        "#endif",
        "#ifdef USE_TANGENT",
        "	attribute vec4 tangent;",
        "#endif",
        "#if defined( USE_COLOR_ALPHA )",
        "	attribute vec4 color;",
        "#elif defined( USE_COLOR )",
        "	attribute vec3 color;",
        "#endif",
        "#ifdef USE_SKINNING",
        "	attribute vec4 skinIndex;",
        "	attribute vec4 skinWeight;",
        "#endif",
        `
`,
      ].filter(wa).join(`
`)),
      (m = [
        xf(t),
        "#define SHADER_TYPE " + t.shaderType,
        "#define SHADER_NAME " + t.shaderName,
        p,
        t.useFog && t.fog ? "#define USE_FOG" : "",
        t.useFog && t.fogExp2 ? "#define FOG_EXP2" : "",
        t.alphaToCoverage ? "#define ALPHA_TO_COVERAGE" : "",
        t.map ? "#define USE_MAP" : "",
        t.matcap ? "#define USE_MATCAP" : "",
        t.envMap ? "#define USE_ENVMAP" : "",
        t.envMap ? "#define " + l : "",
        t.envMap ? "#define " + c : "",
        t.envMap ? "#define " + h : "",
        d ? "#define CUBEUV_TEXEL_WIDTH " + d.texelWidth : "",
        d ? "#define CUBEUV_TEXEL_HEIGHT " + d.texelHeight : "",
        d ? "#define CUBEUV_MAX_MIP " + d.maxMip + ".0" : "",
        t.lightMap ? "#define USE_LIGHTMAP" : "",
        t.aoMap ? "#define USE_AOMAP" : "",
        t.bumpMap ? "#define USE_BUMPMAP" : "",
        t.normalMap ? "#define USE_NORMALMAP" : "",
        t.normalMapObjectSpace ? "#define USE_NORMALMAP_OBJECTSPACE" : "",
        t.normalMapTangentSpace ? "#define USE_NORMALMAP_TANGENTSPACE" : "",
        t.packedNormalMap ? "#define USE_PACKED_NORMALMAP" : "",
        t.emissiveMap ? "#define USE_EMISSIVEMAP" : "",
        t.anisotropy ? "#define USE_ANISOTROPY" : "",
        t.anisotropyMap ? "#define USE_ANISOTROPYMAP" : "",
        t.clearcoat ? "#define USE_CLEARCOAT" : "",
        t.clearcoatMap ? "#define USE_CLEARCOATMAP" : "",
        t.clearcoatRoughnessMap ? "#define USE_CLEARCOAT_ROUGHNESSMAP" : "",
        t.clearcoatNormalMap ? "#define USE_CLEARCOAT_NORMALMAP" : "",
        t.dispersion ? "#define USE_DISPERSION" : "",
        t.iridescence ? "#define USE_IRIDESCENCE" : "",
        t.iridescenceMap ? "#define USE_IRIDESCENCEMAP" : "",
        t.iridescenceThicknessMap ? "#define USE_IRIDESCENCE_THICKNESSMAP" : "",
        t.specularMap ? "#define USE_SPECULARMAP" : "",
        t.specularColorMap ? "#define USE_SPECULAR_COLORMAP" : "",
        t.specularIntensityMap ? "#define USE_SPECULAR_INTENSITYMAP" : "",
        t.roughnessMap ? "#define USE_ROUGHNESSMAP" : "",
        t.metalnessMap ? "#define USE_METALNESSMAP" : "",
        t.alphaMap ? "#define USE_ALPHAMAP" : "",
        t.alphaTest ? "#define USE_ALPHATEST" : "",
        t.alphaHash ? "#define USE_ALPHAHASH" : "",
        t.sheen ? "#define USE_SHEEN" : "",
        t.sheenColorMap ? "#define USE_SHEEN_COLORMAP" : "",
        t.sheenRoughnessMap ? "#define USE_SHEEN_ROUGHNESSMAP" : "",
        t.transmission ? "#define USE_TRANSMISSION" : "",
        t.transmissionMap ? "#define USE_TRANSMISSIONMAP" : "",
        t.thicknessMap ? "#define USE_THICKNESSMAP" : "",
        t.vertexTangents && t.flatShading === !1 ? "#define USE_TANGENT" : "",
        t.vertexColors || t.instancingColor ? "#define USE_COLOR" : "",
        t.vertexAlphas || t.batchingColor ? "#define USE_COLOR_ALPHA" : "",
        t.vertexUv1s ? "#define USE_UV1" : "",
        t.vertexUv2s ? "#define USE_UV2" : "",
        t.vertexUv3s ? "#define USE_UV3" : "",
        t.pointsUvs ? "#define USE_POINTS_UV" : "",
        t.gradientMap ? "#define USE_GRADIENTMAP" : "",
        t.flatShading ? "#define FLAT_SHADED" : "",
        t.doubleSided ? "#define DOUBLE_SIDED" : "",
        t.flipSided ? "#define FLIP_SIDED" : "",
        t.shadowMapEnabled ? "#define USE_SHADOWMAP" : "",
        t.shadowMapEnabled ? "#define " + A : "",
        t.premultipliedAlpha ? "#define PREMULTIPLIED_ALPHA" : "",
        t.numLightProbes > 0 ? "#define USE_LIGHT_PROBES" : "",
        t.numLightProbeGrids > 0 ? "#define USE_LIGHT_PROBES_GRID" : "",
        t.decodeVideoTexture ? "#define DECODE_VIDEO_TEXTURE" : "",
        t.decodeVideoTextureEmissive
          ? "#define DECODE_VIDEO_TEXTURE_EMISSIVE"
          : "",
        t.logarithmicDepthBuffer ? "#define USE_LOGARITHMIC_DEPTH_BUFFER" : "",
        t.reversedDepthBuffer ? "#define USE_REVERSED_DEPTH_BUFFER" : "",
        "uniform mat4 viewMatrix;",
        "uniform vec3 cameraPosition;",
        "uniform bool isOrthographic;",
        t.toneMapping !== vr ? "#define TONE_MAPPING" : "",
        t.toneMapping !== vr ? yt.tonemapping_pars_fragment : "",
        t.toneMapping !== vr ? dx("toneMapping", t.toneMapping) : "",
        t.dithering ? "#define DITHERING" : "",
        t.opaque ? "#define OPAQUE" : "",
        yt.colorspace_pars_fragment,
        cx("linearToOutputTexel", t.outputColorSpace),
        ux(),
        t.useDepthPacking ? "#define DEPTH_PACKING " + t.depthPacking : "",
        `
`,
      ].filter(wa).join(`
`))),
    (a = Th(a)),
    (a = _f(a, t)),
    (a = Ef(a, t)),
    (o = Th(o)),
    (o = _f(o, t)),
    (o = Ef(o, t)),
    (a = yf(a)),
    (o = yf(o)),
    t.isRawShaderMaterial !== !0 &&
      ((y = `#version 300 es
`),
      (g =
        [
          u,
          "#define attribute in",
          "#define varying out",
          "#define texture2D texture",
        ].join(`
`) +
        `
` +
        g),
      (m =
        [
          "#define varying in",
          t.glslVersion === hu
            ? ""
            : "layout(location = 0) out highp vec4 pc_fragColor;",
          t.glslVersion === hu ? "" : "#define gl_FragColor pc_fragColor",
          "#define gl_FragDepthEXT gl_FragDepth",
          "#define texture2D texture",
          "#define textureCube texture",
          "#define texture2DProj textureProj",
          "#define texture2DLodEXT textureLod",
          "#define texture2DProjLodEXT textureProjLod",
          "#define textureCubeLodEXT textureLod",
          "#define texture2DGradEXT textureGrad",
          "#define texture2DProjGradEXT textureProjGrad",
          "#define textureCubeGradEXT textureGrad",
        ].join(`
`) +
        `
` +
        m)));
  const C = y + g + a,
    E = y + m + o,
    w = gf(r, r.VERTEX_SHADER, C),
    S = gf(r, r.FRAGMENT_SHADER, E);
  (r.attachShader(v, w),
    r.attachShader(v, S),
    t.index0AttributeName !== void 0
      ? r.bindAttribLocation(v, 0, t.index0AttributeName)
      : t.hasPositionAttribute === !0 && r.bindAttribLocation(v, 0, "position"),
    r.linkProgram(v));
  function k(D) {
    if (i.debug.checkShaderErrors) {
      const N = r.getProgramInfoLog(v) || "",
        X = r.getShaderInfoLog(w) || "",
        Y = r.getShaderInfoLog(S) || "",
        H = N.trim(),
        V = X.trim(),
        J = Y.trim();
      let ne = !0,
        le = !0;
      if (r.getProgramParameter(v, r.LINK_STATUS) === !1)
        if (((ne = !1), typeof i.debug.onShaderError == "function"))
          i.debug.onShaderError(r, v, w, S);
        else {
          const je = jf(r, w, "vertex"),
            de = jf(r, S, "fragment");
          ut(
            "WebGLProgram: Shader Error " +
              r.getError() +
              " - VALIDATE_STATUS " +
              r.getProgramParameter(v, r.VALIDATE_STATUS) +
              `

Material Name: ` +
              D.name +
              `
Material Type: ` +
              D.type +
              `

Program Info Log: ` +
              H +
              `
` +
              je +
              `
` +
              de,
          );
        }
      else
        H !== ""
          ? it("WebGLProgram: Program Info Log:", H)
          : (V === "" || J === "") && (le = !1);
      le &&
        (D.diagnostics = {
          runnable: ne,
          programLog: H,
          vertexShader: { log: V, prefix: g },
          fragmentShader: { log: J, prefix: m },
        });
    }
    (r.deleteShader(w), r.deleteShader(S), (x = new jA(r, v)), (T = mx(r, v)));
  }
  let x;
  this.getUniforms = function () {
    return (x === void 0 && k(this), x);
  };
  let T;
  this.getAttributes = function () {
    return (T === void 0 && k(this), T);
  };
  let R = t.rendererExtensionParallelShaderCompile === !1;
  return (
    (this.isReady = function () {
      return (R === !1 && (R = r.getProgramParameter(v, ax)), R);
    }),
    (this.destroy = function () {
      (n.releaseStatesOfProgram(this),
        r.deleteProgram(v),
        (this.program = void 0));
    }),
    (this.type = t.shaderType),
    (this.name = t.shaderName),
    (this.id = ox++),
    (this.cacheKey = e),
    (this.usedTimes = 1),
    (this.program = v),
    (this.vertexShader = w),
    (this.fragmentShader = S),
    this
  );
}

let Rx = 0;

class Px {
  constructor() {
    ((this.shaderCache = new Map()), (this.materialCache = new Map()));
  }
  update(e, t, n) {
    const r = this._getShaderCacheForMaterial(e);
    return (
      r.has(t) === !1 && (r.add(t), t.usedTimes++),
      r.has(n) === !1 && (r.add(n), n.usedTimes++),
      this
    );
  }
  remove(e) {
    const t = this.materialCache.get(e);
    for (const n of t)
      (n.usedTimes--, n.usedTimes === 0 && this.shaderCache.delete(n.code));
    return (this.materialCache.delete(e), this);
  }
  getVertexShaderStage(e) {
    return this._getShaderStage(e.vertexShader);
  }
  getFragmentShaderStage(e) {
    return this._getShaderStage(e.fragmentShader);
  }
  dispose() {
    (this.shaderCache.clear(), this.materialCache.clear());
  }
  _getShaderCacheForMaterial(e) {
    const t = this.materialCache;
    let n = t.get(e);
    return (n === void 0 && ((n = new Set()), t.set(e, n)), n);
  }
  _getShaderStage(e) {
    const t = this.shaderCache;
    let n = t.get(e);
    return (n === void 0 && ((n = new Ix(e)), t.set(e, n)), n);
  }
}

class Ix {
  constructor(e) {
    ((this.id = Rx++), (this.code = e), (this.usedTimes = 0));
  }
}

function Lx(i) {
  return i === qi || i === kA || i === TA;
}

function Fx(i, e, t, n, r, s) {
  const a = new wm(),
    o = new Px(),
    A = new Set(),
    l = [],
    c = new Map(),
    h = n.logarithmicDepthBuffer;
  let d = n.precision;
  const u = {
    MeshDepthMaterial: "depth",
    MeshDistanceMaterial: "distance",
    MeshNormalMaterial: "normal",
    MeshBasicMaterial: "basic",
    MeshLambertMaterial: "lambert",
    MeshPhongMaterial: "phong",
    MeshToonMaterial: "toon",
    MeshStandardMaterial: "physical",
    MeshPhysicalMaterial: "physical",
    MeshMatcapMaterial: "matcap",
    LineBasicMaterial: "basic",
    LineDashedMaterial: "dashed",
    PointsMaterial: "points",
    ShadowMaterial: "shadow",
    SpriteMaterial: "sprite",
  };
  function p(x) {
    return (A.add(x), x === 0 ? "uv" : `uv${x}`);
  }
  function v(x, T, R, D, N, X) {
    const Y = D.fog,
      H = N.geometry,
      V =
        x.isMeshStandardMaterial ||
        x.isMeshLambertMaterial ||
        x.isMeshPhongMaterial
          ? D.environment
          : null,
      J =
        x.isMeshStandardMaterial ||
        (x.isMeshLambertMaterial && !x.envMap) ||
        (x.isMeshPhongMaterial && !x.envMap),
      ne = e.get(x.envMap || V, J),
      le = ne && ne.mapping === ZA ? ne.image.height : null,
      je = u[x.type];
    x.precision !== null &&
      ((d = n.getMaxPrecision(x.precision)),
      d !== x.precision &&
        it(
          "WebGLProgram.getParameters:",
          x.precision,
          "not supported, using",
          d,
          "instead.",
        ));
    const de =
        H.morphAttributes.position ||
        H.morphAttributes.normal ||
        H.morphAttributes.color,
      pe = de !== void 0 ? de.length : 0;
    let Se = 0;
    (H.morphAttributes.position !== void 0 && (Se = 1),
      H.morphAttributes.normal !== void 0 && (Se = 2),
      H.morphAttributes.color !== void 0 && (Se = 3));
    let gt, ct, oe, xe;
    if (je) {
      const Je = ur[je];
      ((gt = Je.vertexShader), (ct = Je.fragmentShader));
    } else {
      ((gt = x.vertexShader), (ct = x.fragmentShader));
      const Je = o.getVertexShaderStage(x),
        wt = o.getFragmentShaderStage(x);
      (o.update(x, Je, wt), (oe = Je.id), (xe = wt.id));
    }
    const ge = i.getRenderTarget(),
      qe = i.state.buffers.depth.getReversed(),
      Xe = N.isInstancedMesh === !0,
      We = N.isBatchedMesh === !0,
      ft = !!x.map,
      st = !!x.matcap,
      ue = !!ne,
      _e = !!x.aoMap,
      ve = !!x.lightMap,
      Me = !!x.bumpMap && x.wireframe === !1,
      Be = !!x.normalMap,
      Ze = !!x.displacementMap,
      He = !!x.emissiveMap,
      At = !!x.metalnessMap,
      te = !!x.roughnessMap,
      G = x.anisotropy > 0,
      Ge = x.clearcoat > 0,
      $e = x.dispersion > 0,
      I = x.iridescence > 0,
      b = x.sheen > 0,
      q = x.transmission > 0,
      K = G && !!x.anisotropyMap,
      ie = Ge && !!x.clearcoatMap,
      Ce = Ge && !!x.clearcoatNormalMap,
      we = Ge && !!x.clearcoatRoughnessMap,
      ae = I && !!x.iridescenceMap,
      ce = I && !!x.iridescenceThicknessMap,
      Pe = b && !!x.sheenColorMap,
      ze = b && !!x.sheenRoughnessMap,
      Fe = !!x.specularMap,
      ke = !!x.specularColorMap,
      nt = !!x.specularIntensityMap,
      Te = q && !!x.transmissionMap,
      pt = q && !!x.thicknessMap,
      $ = !!x.gradientMap,
      be = !!x.alphaMap,
      he = x.alphaTest > 0,
      Le = !!x.alphaHash,
      Ie = !!x.extensions;
    let me = vr;
    x.toneMapped &&
      (ge === null || ge.isXRRenderTarget === !0) &&
      (me = i.toneMapping);
    const Ye = {
      shaderID: je,
      shaderType: x.type,
      shaderName: x.name,
      vertexShader: gt,
      fragmentShader: ct,
      defines: x.defines,
      customVertexShaderID: oe,
      customFragmentShaderID: xe,
      isRawShaderMaterial: x.isRawShaderMaterial === !0,
      glslVersion: x.glslVersion,
      precision: d,
      batching: We,
      batchingColor: We && N._colorsTexture !== null,
      instancing: Xe,
      instancingColor: Xe && N.instanceColor !== null,
      instancingMorph: Xe && N.morphTexture !== null,
      outputColorSpace:
        ge === null
          ? i.outputColorSpace
          : ge.isXRRenderTarget === !0
            ? ge.texture.colorSpace
            : bt.workingColorSpace,
      alphaToCoverage: !!x.alphaToCoverage,
      map: ft,
      matcap: st,
      envMap: ue,
      envMapMode: ue && ne.mapping,
      envMapCubeUVHeight: le,
      aoMap: _e,
      lightMap: ve,
      bumpMap: Me,
      normalMap: Be,
      displacementMap: Ze,
      emissiveMap: He,
      normalMapObjectSpace: Be && x.normalMapType === Zg,
      normalMapTangentSpace: Be && x.normalMapType === Ds,
      packedNormalMap: Be && x.normalMapType === Ds && Lx(x.normalMap.format),
      metalnessMap: At,
      roughnessMap: te,
      anisotropy: G,
      anisotropyMap: K,
      clearcoat: Ge,
      clearcoatMap: ie,
      clearcoatNormalMap: Ce,
      clearcoatRoughnessMap: we,
      dispersion: $e,
      iridescence: I,
      iridescenceMap: ae,
      iridescenceThicknessMap: ce,
      sheen: b,
      sheenColorMap: Pe,
      sheenRoughnessMap: ze,
      specularMap: Fe,
      specularColorMap: ke,
      specularIntensityMap: nt,
      transmission: q,
      transmissionMap: Te,
      thicknessMap: pt,
      gradientMap: $,
      opaque:
        x.transparent === !1 && x.blending === Gr && x.alphaToCoverage === !1,
      alphaMap: be,
      alphaTest: he,
      alphaHash: Le,
      combine: x.combine,
      mapUv: ft && p(x.map.channel),
      aoMapUv: _e && p(x.aoMap.channel),
      lightMapUv: ve && p(x.lightMap.channel),
      bumpMapUv: Me && p(x.bumpMap.channel),
      normalMapUv: Be && p(x.normalMap.channel),
      displacementMapUv: Ze && p(x.displacementMap.channel),
      emissiveMapUv: He && p(x.emissiveMap.channel),
      metalnessMapUv: At && p(x.metalnessMap.channel),
      roughnessMapUv: te && p(x.roughnessMap.channel),
      anisotropyMapUv: K && p(x.anisotropyMap.channel),
      clearcoatMapUv: ie && p(x.clearcoatMap.channel),
      clearcoatNormalMapUv: Ce && p(x.clearcoatNormalMap.channel),
      clearcoatRoughnessMapUv: we && p(x.clearcoatRoughnessMap.channel),
      iridescenceMapUv: ae && p(x.iridescenceMap.channel),
      iridescenceThicknessMapUv: ce && p(x.iridescenceThicknessMap.channel),
      sheenColorMapUv: Pe && p(x.sheenColorMap.channel),
      sheenRoughnessMapUv: ze && p(x.sheenRoughnessMap.channel),
      specularMapUv: Fe && p(x.specularMap.channel),
      specularColorMapUv: ke && p(x.specularColorMap.channel),
      specularIntensityMapUv: nt && p(x.specularIntensityMap.channel),
      transmissionMapUv: Te && p(x.transmissionMap.channel),
      thicknessMapUv: pt && p(x.thicknessMap.channel),
      alphaMapUv: be && p(x.alphaMap.channel),
      vertexTangents: !!H.attributes.tangent && (Be || G),
      vertexNormals: !!H.attributes.normal,
      vertexColors: x.vertexColors,
      vertexAlphas:
        x.vertexColors === !0 &&
        !!H.attributes.color &&
        H.attributes.color.itemSize === 4,
      pointsUvs: N.isPoints === !0 && !!H.attributes.uv && (ft || be),
      fog: !!Y,
      useFog: x.fog === !0,
      fogExp2: !!Y && Y.isFogExp2,
      flatShading:
        x.wireframe === !1 &&
        (x.flatShading === !0 ||
          (H.attributes.normal === void 0 &&
            Be === !1 &&
            (x.isMeshLambertMaterial ||
              x.isMeshPhongMaterial ||
              x.isMeshStandardMaterial ||
              x.isMeshPhysicalMaterial))),
      sizeAttenuation: x.sizeAttenuation === !0,
      logarithmicDepthBuffer: h,
      reversedDepthBuffer: qe,
      skinning: N.isSkinnedMesh === !0,
      hasPositionAttribute: H.attributes.position !== void 0,
      morphTargets: H.morphAttributes.position !== void 0,
      morphNormals: H.morphAttributes.normal !== void 0,
      morphColors: H.morphAttributes.color !== void 0,
      morphTargetsCount: pe,
      morphTextureStride: Se,
      numDirLights: T.directional.length,
      numPointLights: T.point.length,
      numSpotLights: T.spot.length,
      numSpotLightMaps: T.spotLightMap.length,
      numRectAreaLights: T.rectArea.length,
      numHemiLights: T.hemi.length,
      numDirLightShadows: T.directionalShadowMap.length,
      numPointLightShadows: T.pointShadowMap.length,
      numSpotLightShadows: T.spotShadowMap.length,
      numSpotLightShadowsWithMaps: T.numSpotLightShadowsWithMaps,
      numLightProbes: T.numLightProbes,
      numLightProbeGrids: X.length,
      numClippingPlanes: s.numPlanes,
      numClipIntersection: s.numIntersection,
      dithering: x.dithering,
      shadowMapEnabled: i.shadowMap.enabled && R.length > 0,
      shadowMapType: i.shadowMap.type,
      toneMapping: me,
      decodeVideoTexture:
        ft &&
        x.map.isVideoTexture === !0 &&
        bt.getTransfer(x.map.colorSpace) === kt,
      decodeVideoTextureEmissive:
        He &&
        x.emissiveMap.isVideoTexture === !0 &&
        bt.getTransfer(x.emissiveMap.colorSpace) === kt,
      premultipliedAlpha: x.premultipliedAlpha,
      doubleSided: x.side === Ut,
      flipSided: x.side === pn,
      useDepthPacking: x.depthPacking >= 0,
      depthPacking: x.depthPacking || 0,
      index0AttributeName: x.index0AttributeName,
      extensionClipCullDistance:
        Ie &&
        x.extensions.clipCullDistance === !0 &&
        t.has("WEBGL_clip_cull_distance"),
      extensionMultiDraw:
        ((Ie && x.extensions.multiDraw === !0) || We) &&
        t.has("WEBGL_multi_draw"),
      rendererExtensionParallelShaderCompile: t.has(
        "KHR_parallel_shader_compile",
      ),
      customProgramCacheKey: x.customProgramCacheKey(),
    };
    return (
      (Ye.vertexUv1s = A.has(1)),
      (Ye.vertexUv2s = A.has(2)),
      (Ye.vertexUv3s = A.has(3)),
      A.clear(),
      Ye
    );
  }
  function g(x) {
    const T = [];
    if (
      (x.shaderID
        ? T.push(x.shaderID)
        : (T.push(x.customVertexShaderID), T.push(x.customFragmentShaderID)),
      x.defines !== void 0)
    )
      for (const R in x.defines) (T.push(R), T.push(x.defines[R]));
    return (
      x.isRawShaderMaterial === !1 &&
        (m(T, x), y(T, x), T.push(i.outputColorSpace)),
      T.push(x.customProgramCacheKey),
      T.join()
    );
  }
  function m(x, T) {
    (x.push(T.precision),
      x.push(T.outputColorSpace),
      x.push(T.envMapMode),
      x.push(T.envMapCubeUVHeight),
      x.push(T.mapUv),
      x.push(T.alphaMapUv),
      x.push(T.lightMapUv),
      x.push(T.aoMapUv),
      x.push(T.bumpMapUv),
      x.push(T.normalMapUv),
      x.push(T.displacementMapUv),
      x.push(T.emissiveMapUv),
      x.push(T.metalnessMapUv),
      x.push(T.roughnessMapUv),
      x.push(T.anisotropyMapUv),
      x.push(T.clearcoatMapUv),
      x.push(T.clearcoatNormalMapUv),
      x.push(T.clearcoatRoughnessMapUv),
      x.push(T.iridescenceMapUv),
      x.push(T.iridescenceThicknessMapUv),
      x.push(T.sheenColorMapUv),
      x.push(T.sheenRoughnessMapUv),
      x.push(T.specularMapUv),
      x.push(T.specularColorMapUv),
      x.push(T.specularIntensityMapUv),
      x.push(T.transmissionMapUv),
      x.push(T.thicknessMapUv),
      x.push(T.combine),
      x.push(T.fogExp2),
      x.push(T.sizeAttenuation),
      x.push(T.morphTargetsCount),
      x.push(T.morphAttributeCount),
      x.push(T.numDirLights),
      x.push(T.numPointLights),
      x.push(T.numSpotLights),
      x.push(T.numSpotLightMaps),
      x.push(T.numHemiLights),
      x.push(T.numRectAreaLights),
      x.push(T.numDirLightShadows),
      x.push(T.numPointLightShadows),
      x.push(T.numSpotLightShadows),
      x.push(T.numSpotLightShadowsWithMaps),
      x.push(T.numLightProbes),
      x.push(T.shadowMapType),
      x.push(T.toneMapping),
      x.push(T.numClippingPlanes),
      x.push(T.numClipIntersection),
      x.push(T.depthPacking));
  }
  function y(x, T) {
    (a.disableAll(),
      T.instancing && a.enable(0),
      T.instancingColor && a.enable(1),
      T.instancingMorph && a.enable(2),
      T.matcap && a.enable(3),
      T.envMap && a.enable(4),
      T.normalMapObjectSpace && a.enable(5),
      T.normalMapTangentSpace && a.enable(6),
      T.clearcoat && a.enable(7),
      T.iridescence && a.enable(8),
      T.alphaTest && a.enable(9),
      T.vertexColors && a.enable(10),
      T.vertexAlphas && a.enable(11),
      T.vertexUv1s && a.enable(12),
      T.vertexUv2s && a.enable(13),
      T.vertexUv3s && a.enable(14),
      T.vertexTangents && a.enable(15),
      T.anisotropy && a.enable(16),
      T.alphaHash && a.enable(17),
      T.batching && a.enable(18),
      T.dispersion && a.enable(19),
      T.batchingColor && a.enable(20),
      T.gradientMap && a.enable(21),
      T.packedNormalMap && a.enable(22),
      T.vertexNormals && a.enable(23),
      x.push(a.mask),
      a.disableAll(),
      T.fog && a.enable(0),
      T.useFog && a.enable(1),
      T.flatShading && a.enable(2),
      T.logarithmicDepthBuffer && a.enable(3),
      T.reversedDepthBuffer && a.enable(4),
      T.skinning && a.enable(5),
      T.morphTargets && a.enable(6),
      T.morphNormals && a.enable(7),
      T.morphColors && a.enable(8),
      T.premultipliedAlpha && a.enable(9),
      T.shadowMapEnabled && a.enable(10),
      T.doubleSided && a.enable(11),
      T.flipSided && a.enable(12),
      T.useDepthPacking && a.enable(13),
      T.dithering && a.enable(14),
      T.transmission && a.enable(15),
      T.sheen && a.enable(16),
      T.opaque && a.enable(17),
      T.pointsUvs && a.enable(18),
      T.decodeVideoTexture && a.enable(19),
      T.decodeVideoTextureEmissive && a.enable(20),
      T.alphaToCoverage && a.enable(21),
      T.numLightProbeGrids > 0 && a.enable(22),
      T.hasPositionAttribute && a.enable(23),
      x.push(a.mask));
  }
  function C(x) {
    const T = u[x.type];
    let R;
    if (T) {
      const D = ur[T];
      R = sl.clone(D.uniforms);
    } else R = x.uniforms;
    return R;
  }
  function E(x, T) {
    let R = c.get(T);
    return (
      R !== void 0
        ? ++R.usedTimes
        : ((R = new Tx(i, T, x, r)), l.push(R), c.set(T, R)),
      R
    );
  }
  function w(x) {
    if (--x.usedTimes === 0) {
      const T = l.indexOf(x);
      ((l[T] = l[l.length - 1]), l.pop(), c.delete(x.cacheKey), x.destroy());
    }
  }
  function S(x) {
    o.remove(x);
  }
  function k() {
    o.dispose();
  }
  return {
    getParameters: v,
    getProgramCacheKey: g,
    getUniforms: C,
    acquireProgram: E,
    releaseProgram: w,
    releaseShaderCache: S,
    programs: l,
    dispose: k,
  };
}

function Dx() {
  let i = new WeakMap();
  function e(a) {
    return i.has(a);
  }
  function t(a) {
    let o = i.get(a);
    return (o === void 0 && ((o = {}), i.set(a, o)), o);
  }
  function n(a) {
    i.delete(a);
  }
  function r(a, o, A) {
    i.get(a)[o] = A;
  }
  function s() {
    i = new WeakMap();
  }
  return { has: e, get: t, remove: n, update: r, dispose: s };
}

function Nx(i, e) {
  return i.groupOrder !== e.groupOrder
    ? i.groupOrder - e.groupOrder
    : i.renderOrder !== e.renderOrder
      ? i.renderOrder - e.renderOrder
      : i.material.id !== e.material.id
        ? i.material.id - e.material.id
        : i.materialVariant !== e.materialVariant
          ? i.materialVariant - e.materialVariant
          : i.z !== e.z
            ? i.z - e.z
            : i.id - e.id;
}

function Cf(i, e) {
  return i.groupOrder !== e.groupOrder
    ? i.groupOrder - e.groupOrder
    : i.renderOrder !== e.renderOrder
      ? i.renderOrder - e.renderOrder
      : i.z !== e.z
        ? e.z - i.z
        : i.id - e.id;
}

function bf() {
  const i = [];
  let e = 0;
  const t = [],
    n = [],
    r = [];
  function s() {
    ((e = 0), (t.length = 0), (n.length = 0), (r.length = 0));
  }
  function a(d) {
    let u = 0;
    return (d.isInstancedMesh && (u += 2), d.isSkinnedMesh && (u += 1), u);
  }
  function o(d, u, p, v, g, m) {
    let y = i[e];
    return (
      y === void 0
        ? ((y = {
            id: d.id,
            object: d,
            geometry: u,
            material: p,
            materialVariant: a(d),
            groupOrder: v,
            renderOrder: d.renderOrder,
            z: g,
            group: m,
          }),
          (i[e] = y))
        : ((y.id = d.id),
          (y.object = d),
          (y.geometry = u),
          (y.material = p),
          (y.materialVariant = a(d)),
          (y.groupOrder = v),
          (y.renderOrder = d.renderOrder),
          (y.z = g),
          (y.group = m)),
      e++,
      y
    );
  }
  function A(d, u, p, v, g, m) {
    const y = o(d, u, p, v, g, m);
    p.transmission > 0
      ? n.push(y)
      : p.transparent === !0
        ? r.push(y)
        : t.push(y);
  }
  function l(d, u, p, v, g, m) {
    const y = o(d, u, p, v, g, m);
    p.transmission > 0
      ? n.unshift(y)
      : p.transparent === !0
        ? r.unshift(y)
        : t.unshift(y);
  }
  function c(d, u, p) {
    (t.length > 1 && t.sort(d || Nx),
      n.length > 1 && n.sort(u || Cf),
      r.length > 1 && r.sort(u || Cf),
      p && (t.reverse(), n.reverse(), r.reverse()));
  }
  function h() {
    for (let d = e, u = i.length; d < u; d++) {
      const p = i[d];
      if (p.id === null) break;
      ((p.id = null),
        (p.object = null),
        (p.geometry = null),
        (p.material = null),
        (p.group = null));
    }
  }
  return {
    opaque: t,
    transmissive: n,
    transparent: r,
    init: s,
    push: A,
    unshift: l,
    finish: h,
    sort: c,
  };
}

function Gx() {
  let i = new WeakMap();
  function e(n, r) {
    const s = i.get(n);
    let a;
    return (
      s === void 0
        ? ((a = new bf()), i.set(n, [a]))
        : r >= s.length
          ? ((a = new bf()), s.push(a))
          : (a = s[r]),
      a
    );
  }
  function t() {
    i = new WeakMap();
  }
  return { get: e, dispose: t };
}

function Ox() {
  const i = {};
  return {
    get: function (e) {
      if (i[e.id] !== void 0) return i[e.id];
      let t;
      switch (e.type) {
        case "DirectionalLight":
          t = { direction: new F(), color: new Ne() };
          break;
        case "SpotLight":
          t = {
            position: new F(),
            direction: new F(),
            color: new Ne(),
            distance: 0,
            coneCos: 0,
            penumbraCos: 0,
            decay: 0,
          };
          break;
        case "PointLight":
          t = { position: new F(), color: new Ne(), distance: 0, decay: 0 };
          break;
        case "HemisphereLight":
          t = { direction: new F(), skyColor: new Ne(), groundColor: new Ne() };
          break;
        case "RectAreaLight":
          t = {
            color: new Ne(),
            position: new F(),
            halfWidth: new F(),
            halfHeight: new F(),
          };
          break;
      }
      return ((i[e.id] = t), t);
    },
  };
}

function Hx() {
  const i = {};
  return {
    get: function (e) {
      if (i[e.id] !== void 0) return i[e.id];
      let t;
      switch (e.type) {
        case "DirectionalLight":
          t = {
            shadowIntensity: 1,
            shadowBias: 0,
            shadowNormalBias: 0,
            shadowRadius: 1,
            shadowMapSize: new Ae(),
          };
          break;
        case "SpotLight":
          t = {
            shadowIntensity: 1,
            shadowBias: 0,
            shadowNormalBias: 0,
            shadowRadius: 1,
            shadowMapSize: new Ae(),
          };
          break;
        case "PointLight":
          t = {
            shadowIntensity: 1,
            shadowBias: 0,
            shadowNormalBias: 0,
            shadowRadius: 1,
            shadowMapSize: new Ae(),
            shadowCameraNear: 1,
            shadowCameraFar: 1e3,
          };
          break;
      }
      return ((i[e.id] = t), t);
    },
  };
}

let Ux = 0;

function qx(i, e) {
  return (
    (e.castShadow ? 2 : 0) -
    (i.castShadow ? 2 : 0) +
    (e.map ? 1 : 0) -
    (i.map ? 1 : 0)
  );
}

function $x(i) {
  const e = new Ox(),
    t = Hx(),
    n = {
      version: 0,
      hash: {
        directionalLength: -1,
        pointLength: -1,
        spotLength: -1,
        rectAreaLength: -1,
        hemiLength: -1,
        numDirectionalShadows: -1,
        numPointShadows: -1,
        numSpotShadows: -1,
        numSpotMaps: -1,
        numLightProbes: -1,
      },
      ambient: [0, 0, 0],
      probe: [],
      directional: [],
      directionalShadow: [],
      directionalShadowMap: [],
      directionalShadowMatrix: [],
      spot: [],
      spotLightMap: [],
      spotShadow: [],
      spotShadowMap: [],
      spotLightMatrix: [],
      rectArea: [],
      rectAreaLTC1: null,
      rectAreaLTC2: null,
      point: [],
      pointShadow: [],
      pointShadowMap: [],
      pointShadowMatrix: [],
      hemi: [],
      numSpotLightShadowsWithMaps: 0,
      numLightProbes: 0,
    };
  for (let l = 0; l < 9; l++) n.probe.push(new F());
  const r = new F(),
    s = new mt(),
    a = new mt();
  function o(l) {
    let c = 0,
      h = 0,
      d = 0;
    for (let T = 0; T < 9; T++) n.probe[T].set(0, 0, 0);
    let u = 0,
      p = 0,
      v = 0,
      g = 0,
      m = 0,
      y = 0,
      C = 0,
      E = 0,
      w = 0,
      S = 0,
      k = 0;
    l.sort(qx);
    for (let T = 0, R = l.length; T < R; T++) {
      const D = l[T],
        N = D.color,
        X = D.intensity,
        Y = D.distance;
      let H = null;
      if (
        (D.shadow &&
          D.shadow.map &&
          (D.shadow.map.texture.format === qi
            ? (H = D.shadow.map.texture)
            : (H = D.shadow.map.depthTexture || D.shadow.map.texture)),
        D.isAmbientLight)
      )
        ((c += N.r * X), (h += N.g * X), (d += N.b * X));
      else if (D.isLightProbe) {
        for (let V = 0; V < 9; V++)
          n.probe[V].addScaledVector(D.sh.coefficients[V], X);
        k++;
      } else if (D.isDirectionalLight) {
        const V = e.get(D);
        if ((V.color.copy(D.color).multiplyScalar(D.intensity), D.castShadow)) {
          const J = D.shadow,
            ne = t.get(D);
          ((ne.shadowIntensity = J.intensity),
            (ne.shadowBias = J.bias),
            (ne.shadowNormalBias = J.normalBias),
            (ne.shadowRadius = J.radius),
            (ne.shadowMapSize = J.mapSize),
            (n.directionalShadow[u] = ne),
            (n.directionalShadowMap[u] = H),
            (n.directionalShadowMatrix[u] = D.shadow.matrix),
            y++);
        }
        ((n.directional[u] = V), u++);
      } else if (D.isSpotLight) {
        const V = e.get(D);
        (V.position.setFromMatrixPosition(D.matrixWorld),
          V.color.copy(N).multiplyScalar(X),
          (V.distance = Y),
          (V.coneCos = Math.cos(D.angle)),
          (V.penumbraCos = Math.cos(D.angle * (1 - D.penumbra))),
          (V.decay = D.decay),
          (n.spot[v] = V));
        const J = D.shadow;
        if (
          (D.map &&
            ((n.spotLightMap[w] = D.map),
            w++,
            J.updateMatrices(D),
            D.castShadow && S++),
          (n.spotLightMatrix[v] = J.matrix),
          D.castShadow)
        ) {
          const ne = t.get(D);
          ((ne.shadowIntensity = J.intensity),
            (ne.shadowBias = J.bias),
            (ne.shadowNormalBias = J.normalBias),
            (ne.shadowRadius = J.radius),
            (ne.shadowMapSize = J.mapSize),
            (n.spotShadow[v] = ne),
            (n.spotShadowMap[v] = H),
            E++);
        }
        v++;
      } else if (D.isRectAreaLight) {
        const V = e.get(D);
        (V.color.copy(N).multiplyScalar(X),
          V.halfWidth.set(D.width * 0.5, 0, 0),
          V.halfHeight.set(0, D.height * 0.5, 0),
          (n.rectArea[g] = V),
          g++);
      } else if (D.isPointLight) {
        const V = e.get(D);
        if (
          (V.color.copy(D.color).multiplyScalar(D.intensity),
          (V.distance = D.distance),
          (V.decay = D.decay),
          D.castShadow)
        ) {
          const J = D.shadow,
            ne = t.get(D);
          ((ne.shadowIntensity = J.intensity),
            (ne.shadowBias = J.bias),
            (ne.shadowNormalBias = J.normalBias),
            (ne.shadowRadius = J.radius),
            (ne.shadowMapSize = J.mapSize),
            (ne.shadowCameraNear = J.camera.near),
            (ne.shadowCameraFar = J.camera.far),
            (n.pointShadow[p] = ne),
            (n.pointShadowMap[p] = H),
            (n.pointShadowMatrix[p] = D.shadow.matrix),
            C++);
        }
        ((n.point[p] = V), p++);
      } else if (D.isHemisphereLight) {
        const V = e.get(D);
        (V.skyColor.copy(D.color).multiplyScalar(X),
          V.groundColor.copy(D.groundColor).multiplyScalar(X),
          (n.hemi[m] = V),
          m++);
      }
    }
    (g > 0 &&
      (i.has("OES_texture_float_linear") === !0
        ? ((n.rectAreaLTC1 = Ue.LTC_FLOAT_1), (n.rectAreaLTC2 = Ue.LTC_FLOAT_2))
        : ((n.rectAreaLTC1 = Ue.LTC_HALF_1), (n.rectAreaLTC2 = Ue.LTC_HALF_2))),
      (n.ambient[0] = c),
      (n.ambient[1] = h),
      (n.ambient[2] = d));
    const x = n.hash;
    (x.directionalLength !== u ||
      x.pointLength !== p ||
      x.spotLength !== v ||
      x.rectAreaLength !== g ||
      x.hemiLength !== m ||
      x.numDirectionalShadows !== y ||
      x.numPointShadows !== C ||
      x.numSpotShadows !== E ||
      x.numSpotMaps !== w ||
      x.numLightProbes !== k) &&
      ((n.directional.length = u),
      (n.spot.length = v),
      (n.rectArea.length = g),
      (n.point.length = p),
      (n.hemi.length = m),
      (n.directionalShadow.length = y),
      (n.directionalShadowMap.length = y),
      (n.pointShadow.length = C),
      (n.pointShadowMap.length = C),
      (n.spotShadow.length = E),
      (n.spotShadowMap.length = E),
      (n.directionalShadowMatrix.length = y),
      (n.pointShadowMatrix.length = C),
      (n.spotLightMatrix.length = E + w - S),
      (n.spotLightMap.length = w),
      (n.numSpotLightShadowsWithMaps = S),
      (n.numLightProbes = k),
      (x.directionalLength = u),
      (x.pointLength = p),
      (x.spotLength = v),
      (x.rectAreaLength = g),
      (x.hemiLength = m),
      (x.numDirectionalShadows = y),
      (x.numPointShadows = C),
      (x.numSpotShadows = E),
      (x.numSpotMaps = w),
      (x.numLightProbes = k),
      (n.version = Ux++));
  }
  function A(l, c) {
    let h = 0,
      d = 0,
      u = 0,
      p = 0,
      v = 0;
    const g = c.matrixWorldInverse;
    for (let m = 0, y = l.length; m < y; m++) {
      const C = l[m];
      if (C.isDirectionalLight) {
        const E = n.directional[h];
        (E.direction.setFromMatrixPosition(C.matrixWorld),
          r.setFromMatrixPosition(C.target.matrixWorld),
          E.direction.sub(r),
          E.direction.transformDirection(g),
          h++);
      } else if (C.isSpotLight) {
        const E = n.spot[u];
        (E.position.setFromMatrixPosition(C.matrixWorld),
          E.position.applyMatrix4(g),
          E.direction.setFromMatrixPosition(C.matrixWorld),
          r.setFromMatrixPosition(C.target.matrixWorld),
          E.direction.sub(r),
          E.direction.transformDirection(g),
          u++);
      } else if (C.isRectAreaLight) {
        const E = n.rectArea[p];
        (E.position.setFromMatrixPosition(C.matrixWorld),
          E.position.applyMatrix4(g),
          a.identity(),
          s.copy(C.matrixWorld),
          s.premultiply(g),
          a.extractRotation(s),
          E.halfWidth.set(C.width * 0.5, 0, 0),
          E.halfHeight.set(0, C.height * 0.5, 0),
          E.halfWidth.applyMatrix4(a),
          E.halfHeight.applyMatrix4(a),
          p++);
      } else if (C.isPointLight) {
        const E = n.point[d];
        (E.position.setFromMatrixPosition(C.matrixWorld),
          E.position.applyMatrix4(g),
          d++);
      } else if (C.isHemisphereLight) {
        const E = n.hemi[v];
        (E.direction.setFromMatrixPosition(C.matrixWorld),
          E.direction.transformDirection(g),
          v++);
      }
    }
  }
  return { setup: o, setupView: A, state: n };
}

function Sf(i) {
  const e = new $x(i),
    t = [],
    n = [],
    r = [];
  function s(d) {
    ((h.camera = d), (t.length = 0), (n.length = 0), (r.length = 0));
  }
  function a(d) {
    t.push(d);
  }
  function o(d) {
    n.push(d);
  }
  function A(d) {
    r.push(d);
  }
  function l() {
    e.setup(t);
  }
  function c(d) {
    e.setupView(t, d);
  }
  const h = {
    lightsArray: t,
    shadowsArray: n,
    lightProbeGridArray: r,
    camera: null,
    lights: e,
    transmissionRenderTarget: {},
    textureUnits: 0,
  };
  return {
    init: s,
    state: h,
    setupLights: l,
    setupLightsView: c,
    pushLight: a,
    pushShadow: o,
    pushLightProbeGrid: A,
  };
}

function zx(i) {
  let e = new WeakMap();
  function t(r, s = 0) {
    const a = e.get(r);
    let o;
    return (
      a === void 0
        ? ((o = new Sf(i)), e.set(r, [o]))
        : s >= a.length
          ? ((o = new Sf(i)), a.push(o))
          : (o = a[s]),
      o
    );
  }
  function n() {
    e = new WeakMap();
  }
  return { get: t, dispose: n };
}

const Vx = `void main() {
	gl_Position = vec4( position, 1.0 );
}`;

const Wx = `uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`;

const Xx = [
    new F(1, 0, 0),
    new F(-1, 0, 0),
    new F(0, 1, 0),
    new F(0, -1, 0),
    new F(0, 0, 1),
    new F(0, 0, -1),
  ];

const Jx = [
    new F(0, -1, 0),
    new F(0, -1, 0),
    new F(0, 0, 1),
    new F(0, 0, -1),
    new F(0, -1, 0),
    new F(0, -1, 0),
  ];

const wf = new mt();

const ha = new F();

const ac = new F();

function Kx(i, e, t) {
  let n = new Cd();
  const r = new Ae(),
    s = new Ae(),
    a = new Pt(),
    o = new Ij(),
    A = new Lj(),
    l = {},
    c = t.maxTextureSize,
    h = { [$n]: pn, [pn]: $n, [Ut]: Ut },
    d = new Lt({
      defines: { VSM_SAMPLES: 8 },
      uniforms: {
        shadow_pass: { value: null },
        resolution: { value: new Ae() },
        radius: { value: 4 },
      },
      vertexShader: Vx,
      fragmentShader: Wx,
    }),
    u = d.clone();
  u.defines.HORIZONTAL_PASS = 1;
  const p = new Ct();
  p.setAttribute(
    "position",
    new zt(new Float32Array([-1, -1, 0.5, 3, -1, 0.5, -1, 3, 0.5]), 3),
  );
  const v = new Ee(p, d),
    g = this;
  ((this.enabled = !1),
    (this.autoUpdate = !0),
    (this.needsUpdate = !1),
    (this.type = ka));
  let m = this.type;
  this.render = function (S, k, x) {
    if (
      g.enabled === !1 ||
      (g.autoUpdate === !1 && g.needsUpdate === !1) ||
      S.length === 0
    )
      return;
    this.type === wg &&
      (it(
        "WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead.",
      ),
      (this.type = ka));
    const T = i.getRenderTarget(),
      R = i.getActiveCubeFace(),
      D = i.getActiveMipmapLevel(),
      N = i.state;
    (N.setBlending(gr),
      N.buffers.depth.getReversed() === !0
        ? N.buffers.color.setClear(0, 0, 0, 0)
        : N.buffers.color.setClear(1, 1, 1, 1),
      N.buffers.depth.setTest(!0),
      N.setScissorTest(!1));
    const X = m !== this.type;
    X &&
      k.traverse(function (Y) {
        Y.material &&
          (Array.isArray(Y.material)
            ? Y.material.forEach((H) => (H.needsUpdate = !0))
            : (Y.material.needsUpdate = !0));
      });
    for (let Y = 0, H = S.length; Y < H; Y++) {
      const V = S[Y],
        J = V.shadow;
      if (J === void 0) {
        it("WebGLShadowMap:", V, "has no shadow.");
        continue;
      }
      if (J.autoUpdate === !1 && J.needsUpdate === !1) continue;
      r.copy(J.mapSize);
      const ne = J.getFrameExtents();
      (r.multiply(ne),
        s.copy(J.mapSize),
        (r.x > c || r.y > c) &&
          (r.x > c &&
            ((s.x = Math.floor(c / ne.x)),
            (r.x = s.x * ne.x),
            (J.mapSize.x = s.x)),
          r.y > c &&
            ((s.y = Math.floor(c / ne.y)),
            (r.y = s.y * ne.y),
            (J.mapSize.y = s.y))));
      const le = i.state.buffers.depth.getReversed();
      if (((J.camera._reversedDepth = le), J.map === null || X === !0)) {
        if (
          (J.map !== null &&
            (J.map.depthTexture !== null &&
              (J.map.depthTexture.dispose(), (J.map.depthTexture = null)),
            J.map.dispose()),
          this.type === Ca)
        ) {
          if (V.isPointLight) {
            it(
              "WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.",
            );
            continue;
          }
          ((J.map = new qn(r.x, r.y, {
            format: qi,
            type: er,
            minFilter: qt,
            magFilter: qt,
            generateMipmaps: !1,
          })),
            (J.map.texture.name = V.name + ".shadowMap"),
            (J.map.depthTexture = new Gs(r.x, r.y, On)),
            (J.map.depthTexture.name = V.name + ".shadowMapDepth"),
            (J.map.depthTexture.format = Hr),
            (J.map.depthTexture.compareFunction = null),
            (J.map.depthTexture.minFilter = Yt),
            (J.map.depthTexture.magFilter = Yt));
        } else
          (V.isPointLight
            ? ((J.map = new r0(r.x)), (J.map.depthTexture = new Zv(r.x, Er)))
            : ((J.map = new qn(r.x, r.y)),
              (J.map.depthTexture = new Gs(r.x, r.y, Er))),
            (J.map.depthTexture.name = V.name + ".shadowMap"),
            (J.map.depthTexture.format = Hr),
            this.type === ka
              ? ((J.map.depthTexture.compareFunction = le ? vd : gd),
                (J.map.depthTexture.minFilter = qt),
                (J.map.depthTexture.magFilter = qt))
              : ((J.map.depthTexture.compareFunction = null),
                (J.map.depthTexture.minFilter = Yt),
                (J.map.depthTexture.magFilter = Yt)));
        J.camera.updateProjectionMatrix();
      }
      const je = J.map.isWebGLCubeRenderTarget ? 6 : 1;
      for (let de = 0; de < je; de++) {
        if (J.map.isWebGLCubeRenderTarget)
          (i.setRenderTarget(J.map, de), i.clear());
        else {
          de === 0 && (i.setRenderTarget(J.map), i.clear());
          const pe = J.getViewport(de);
          (a.set(s.x * pe.x, s.y * pe.y, s.x * pe.z, s.y * pe.w),
            N.viewport(a));
        }
        if (V.isPointLight) {
          const pe = J.camera,
            Se = J.matrix,
            gt = V.distance || pe.far;
          (gt !== pe.far && ((pe.far = gt), pe.updateProjectionMatrix()),
            ha.setFromMatrixPosition(V.matrixWorld),
            pe.position.copy(ha),
            ac.copy(pe.position),
            ac.add(Xx[de]),
            pe.up.copy(Jx[de]),
            pe.lookAt(ac),
            pe.updateMatrixWorld(),
            Se.makeTranslation(-ha.x, -ha.y, -ha.z),
            wf.multiplyMatrices(pe.projectionMatrix, pe.matrixWorldInverse),
            J._frustum.setFromProjectionMatrix(
              wf,
              pe.coordinateSystem,
              pe.reversedDepth,
            ));
        } else J.updateMatrices(V);
        ((n = J.getFrustum()), E(k, x, J.camera, V, this.type));
      }
      (J.isPointLightShadow !== !0 && this.type === Ca && y(J, x),
        (J.needsUpdate = !1));
    }
    ((m = this.type), (g.needsUpdate = !1), i.setRenderTarget(T, R, D));
  };
  function y(S, k) {
    const x = e.update(v);
    (d.defines.VSM_SAMPLES !== S.blurSamples &&
      ((d.defines.VSM_SAMPLES = S.blurSamples),
      (u.defines.VSM_SAMPLES = S.blurSamples),
      (d.needsUpdate = !0),
      (u.needsUpdate = !0)),
      S.mapPass === null &&
        (S.mapPass = new qn(r.x, r.y, { format: qi, type: er })),
      (d.uniforms.shadow_pass.value = S.map.depthTexture),
      (d.uniforms.resolution.value = S.mapSize),
      (d.uniforms.radius.value = S.radius),
      i.setRenderTarget(S.mapPass),
      i.clear(),
      i.renderBufferDirect(k, null, x, d, v, null),
      (u.uniforms.shadow_pass.value = S.mapPass.texture),
      (u.uniforms.resolution.value = S.mapSize),
      (u.uniforms.radius.value = S.radius),
      i.setRenderTarget(S.map),
      i.clear(),
      i.renderBufferDirect(k, null, x, u, v, null));
  }
  function C(S, k, x, T) {
    let R = null;
    const D =
      x.isPointLight === !0 ? S.customDistanceMaterial : S.customDepthMaterial;
    if (D !== void 0) R = D;
    else if (
      ((R = x.isPointLight === !0 ? A : o),
      (i.localClippingEnabled &&
        k.clipShadows === !0 &&
        Array.isArray(k.clippingPlanes) &&
        k.clippingPlanes.length !== 0) ||
        (k.displacementMap && k.displacementScale !== 0) ||
        (k.alphaMap && k.alphaTest > 0) ||
        (k.map && k.alphaTest > 0) ||
        k.alphaToCoverage === !0)
    ) {
      const N = R.uuid,
        X = k.uuid;
      let Y = l[N];
      Y === void 0 && ((Y = {}), (l[N] = Y));
      let H = Y[X];
      (H === void 0 &&
        ((H = R.clone()), (Y[X] = H), k.addEventListener("dispose", w)),
        (R = H));
    }
    if (
      ((R.visible = k.visible),
      (R.wireframe = k.wireframe),
      T === Ca
        ? (R.side = k.shadowSide !== null ? k.shadowSide : k.side)
        : (R.side = k.shadowSide !== null ? k.shadowSide : h[k.side]),
      (R.alphaMap = k.alphaMap),
      (R.alphaTest = k.alphaToCoverage === !0 ? 0.5 : k.alphaTest),
      (R.map = k.map),
      (R.clipShadows = k.clipShadows),
      (R.clippingPlanes = k.clippingPlanes),
      (R.clipIntersection = k.clipIntersection),
      (R.displacementMap = k.displacementMap),
      (R.displacementScale = k.displacementScale),
      (R.displacementBias = k.displacementBias),
      (R.wireframeLinewidth = k.wireframeLinewidth),
      (R.linewidth = k.linewidth),
      x.isPointLight === !0 && R.isMeshDistanceMaterial === !0)
    ) {
      const N = i.properties.get(R);
      N.light = x;
    }
    return R;
  }
  function E(S, k, x, T, R) {
    if (S.visible === !1) return;
    if (
      S.layers.test(k.layers) &&
      (S.isMesh || S.isLine || S.isPoints) &&
      (S.castShadow || (S.receiveShadow && R === Ca)) &&
      (!S.frustumCulled || n.intersectsObject(S))
    ) {
      S.modelViewMatrix.multiplyMatrices(x.matrixWorldInverse, S.matrixWorld);
      const X = e.update(S),
        Y = S.material;
      if (Array.isArray(Y)) {
        const H = X.groups;
        for (let V = 0, J = H.length; V < J; V++) {
          const ne = H[V],
            le = Y[ne.materialIndex];
          if (le && le.visible) {
            const je = C(S, le, T, R);
            (S.onBeforeShadow(i, S, k, x, X, je, ne),
              i.renderBufferDirect(x, null, X, je, S, ne),
              S.onAfterShadow(i, S, k, x, X, je, ne));
          }
        }
      } else if (Y.visible) {
        const H = C(S, Y, T, R);
        (S.onBeforeShadow(i, S, k, x, X, H, null),
          i.renderBufferDirect(x, null, X, H, S, null),
          S.onAfterShadow(i, S, k, x, X, H, null));
      }
    }
    const N = S.children;
    for (let X = 0, Y = N.length; X < Y; X++) E(N[X], k, x, T, R);
  }
  function w(S) {
    S.target.removeEventListener("dispose", w);
    for (const x in l) {
      const T = l[x],
        R = S.target.uuid;
      R in T && (T[R].dispose(), delete T[R]);
    }
  }
}

function Yx(i, e) {
  function t() {
    let $ = !1;
    const be = new Pt();
    let he = null;
    const Le = new Pt(0, 0, 0, 0);
    return {
      setMask: function (Ie) {
        he !== Ie && !$ && (i.colorMask(Ie, Ie, Ie, Ie), (he = Ie));
      },
      setLocked: function (Ie) {
        $ = Ie;
      },
      setClear: function (Ie, me, Ye, Je, wt) {
        (wt === !0 && ((Ie *= Je), (me *= Je), (Ye *= Je)),
          be.set(Ie, me, Ye, Je),
          Le.equals(be) === !1 && (i.clearColor(Ie, me, Ye, Je), Le.copy(be)));
      },
      reset: function () {
        (($ = !1), (he = null), Le.set(-1, 0, 0, 0));
      },
    };
  }
  function n() {
    let $ = !1,
      be = !1,
      he = null,
      Le = null,
      Ie = null;
    return {
      setReversed: function (me) {
        if (be !== me) {
          const Ye = e.get("EXT_clip_control");
          (me
            ? Ye.clipControlEXT(Ye.LOWER_LEFT_EXT, Ye.ZERO_TO_ONE_EXT)
            : Ye.clipControlEXT(Ye.LOWER_LEFT_EXT, Ye.NEGATIVE_ONE_TO_ONE_EXT),
            (be = me));
          const Je = Ie;
          ((Ie = null), this.setClear(Je));
        }
      },
      getReversed: function () {
        return be;
      },
      setTest: function (me) {
        me ? ge(i.DEPTH_TEST) : qe(i.DEPTH_TEST);
      },
      setMask: function (me) {
        he !== me && !$ && (i.depthMask(me), (he = me));
      },
      setFunc: function (me) {
        if ((be && (me = lv[me]), Le !== me)) {
          switch (me) {
            case Uc:
              i.depthFunc(i.NEVER);
              break;
            case qc:
              i.depthFunc(i.ALWAYS);
              break;
            case $c:
              i.depthFunc(i.LESS);
              break;
            case Ls:
              i.depthFunc(i.LEQUAL);
              break;
            case zc:
              i.depthFunc(i.EQUAL);
              break;
            case Vc:
              i.depthFunc(i.GEQUAL);
              break;
            case Wc:
              i.depthFunc(i.GREATER);
              break;
            case Xc:
              i.depthFunc(i.NOTEQUAL);
              break;
            default:
              i.depthFunc(i.LEQUAL);
          }
          Le = me;
        }
      },
      setLocked: function (me) {
        $ = me;
      },
      setClear: function (me) {
        Ie !== me && ((Ie = me), be && (me = 1 - me), i.clearDepth(me));
      },
      reset: function () {
        (($ = !1), (he = null), (Le = null), (Ie = null), (be = !1));
      },
    };
  }
  function r() {
    let $ = !1,
      be = null,
      he = null,
      Le = null,
      Ie = null,
      me = null,
      Ye = null,
      Je = null,
      wt = null;
    return {
      setTest: function (W) {
        $ || (W ? ge(i.STENCIL_TEST) : qe(i.STENCIL_TEST));
      },
      setMask: function (W) {
        be !== W && !$ && (i.stencilMask(W), (be = W));
      },
      setFunc: function (W, fe, Ft) {
        (he !== W || Le !== fe || Ie !== Ft) &&
          (i.stencilFunc(W, fe, Ft), (he = W), (Le = fe), (Ie = Ft));
      },
      setOp: function (W, fe, Ft) {
        (me !== W || Ye !== fe || Je !== Ft) &&
          (i.stencilOp(W, fe, Ft), (me = W), (Ye = fe), (Je = Ft));
      },
      setLocked: function (W) {
        $ = W;
      },
      setClear: function (W) {
        wt !== W && (i.clearStencil(W), (wt = W));
      },
      reset: function () {
        (($ = !1),
          (be = null),
          (he = null),
          (Le = null),
          (Ie = null),
          (me = null),
          (Ye = null),
          (Je = null),
          (wt = null));
      },
    };
  }
  const s = new t(),
    a = new n(),
    o = new r(),
    A = new WeakMap(),
    l = new WeakMap();
  let c = {},
    h = {},
    d = {},
    u = new WeakMap(),
    p = [],
    v = null,
    g = !1,
    m = null,
    y = null,
    C = null,
    E = null,
    w = null,
    S = null,
    k = null,
    x = new Ne(0, 0, 0),
    T = 0,
    R = !1,
    D = null,
    N = null,
    X = null,
    Y = null,
    H = null;
  const V = i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
  let J = !1,
    ne = 0;
  const le = i.getParameter(i.VERSION);
  le.indexOf("WebGL") !== -1
    ? ((ne = parseFloat(/^WebGL (\d)/.exec(le)[1])), (J = ne >= 1))
    : le.indexOf("OpenGL ES") !== -1 &&
      ((ne = parseFloat(/^OpenGL ES (\d)/.exec(le)[1])), (J = ne >= 2));
  let je = null,
    de = {};
  const pe = i.getParameter(i.SCISSOR_BOX),
    Se = i.getParameter(i.VIEWPORT),
    gt = new Pt().fromArray(pe),
    ct = new Pt().fromArray(Se);
  function oe($, be, he, Le) {
    const Ie = new Uint8Array(4),
      me = i.createTexture();
    (i.bindTexture($, me),
      i.texParameteri($, i.TEXTURE_MIN_FILTER, i.NEAREST),
      i.texParameteri($, i.TEXTURE_MAG_FILTER, i.NEAREST));
    for (let Ye = 0; Ye < he; Ye++)
      $ === i.TEXTURE_3D || $ === i.TEXTURE_2D_ARRAY
        ? i.texImage3D(be, 0, i.RGBA, 1, 1, Le, 0, i.RGBA, i.UNSIGNED_BYTE, Ie)
        : i.texImage2D(
            be + Ye,
            0,
            i.RGBA,
            1,
            1,
            0,
            i.RGBA,
            i.UNSIGNED_BYTE,
            Ie,
          );
    return me;
  }
  const xe = {};
  ((xe[i.TEXTURE_2D] = oe(i.TEXTURE_2D, i.TEXTURE_2D, 1)),
    (xe[i.TEXTURE_CUBE_MAP] = oe(
      i.TEXTURE_CUBE_MAP,
      i.TEXTURE_CUBE_MAP_POSITIVE_X,
      6,
    )),
    (xe[i.TEXTURE_2D_ARRAY] = oe(i.TEXTURE_2D_ARRAY, i.TEXTURE_2D_ARRAY, 1, 1)),
    (xe[i.TEXTURE_3D] = oe(i.TEXTURE_3D, i.TEXTURE_3D, 1, 1)),
    s.setClear(0, 0, 0, 1),
    a.setClear(1),
    o.setClear(0),
    ge(i.DEPTH_TEST),
    a.setFunc(Ls),
    Me(!1),
    Be(nu),
    ge(i.CULL_FACE),
    _e(gr));
  function ge($) {
    c[$] !== !0 && (i.enable($), (c[$] = !0));
  }
  function qe($) {
    c[$] !== !1 && (i.disable($), (c[$] = !1));
  }
  function Xe($, be) {
    return d[$] !== be
      ? (i.bindFramebuffer($, be),
        (d[$] = be),
        $ === i.DRAW_FRAMEBUFFER && (d[i.FRAMEBUFFER] = be),
        $ === i.FRAMEBUFFER && (d[i.DRAW_FRAMEBUFFER] = be),
        !0)
      : !1;
  }
  function We($, be) {
    let he = p,
      Le = !1;
    if ($) {
      ((he = u.get(be)), he === void 0 && ((he = []), u.set(be, he)));
      const Ie = $.textures;
      if (he.length !== Ie.length || he[0] !== i.COLOR_ATTACHMENT0) {
        for (let me = 0, Ye = Ie.length; me < Ye; me++)
          he[me] = i.COLOR_ATTACHMENT0 + me;
        ((he.length = Ie.length), (Le = !0));
      }
    } else he[0] !== i.BACK && ((he[0] = i.BACK), (Le = !0));
    Le && i.drawBuffers(he);
  }
  function ft($) {
    return v !== $ ? (i.useProgram($), (v = $), !0) : !1;
  }
  const st = {
    [Bi]: i.FUNC_ADD,
    [Bg]: i.FUNC_SUBTRACT,
    [kg]: i.FUNC_REVERSE_SUBTRACT,
  };
  ((st[Tg] = i.MIN), (st[Rg] = i.MAX));
  const ue = {
    [Pg]: i.ZERO,
    [Ig]: i.ONE,
    [Lg]: i.SRC_COLOR,
    [Oc]: i.SRC_ALPHA,
    [Hg]: i.SRC_ALPHA_SATURATE,
    [Gg]: i.DST_COLOR,
    [Dg]: i.DST_ALPHA,
    [Fg]: i.ONE_MINUS_SRC_COLOR,
    [Hc]: i.ONE_MINUS_SRC_ALPHA,
    [Og]: i.ONE_MINUS_DST_COLOR,
    [Ng]: i.ONE_MINUS_DST_ALPHA,
    [Ug]: i.CONSTANT_COLOR,
    [qg]: i.ONE_MINUS_CONSTANT_COLOR,
    [$g]: i.CONSTANT_ALPHA,
    [zg]: i.ONE_MINUS_CONSTANT_ALPHA,
  };
  function _e($, be, he, Le, Ie, me, Ye, Je, wt, W) {
    if ($ === gr) {
      g === !0 && (qe(i.BLEND), (g = !1));
      return;
    }
    if ((g === !1 && (ge(i.BLEND), (g = !0)), $ !== Mg)) {
      if ($ !== m || W !== R) {
        if (
          ((y !== Bi || w !== Bi) &&
            (i.blendEquation(i.FUNC_ADD), (y = Bi), (w = Bi)),
          W)
        )
          switch ($) {
            case Gr:
              i.blendFuncSeparate(
                i.ONE,
                i.ONE_MINUS_SRC_ALPHA,
                i.ONE,
                i.ONE_MINUS_SRC_ALPHA,
              );
              break;
            case li:
              i.blendFunc(i.ONE, i.ONE);
              break;
            case ru:
              i.blendFuncSeparate(i.ZERO, i.ONE_MINUS_SRC_COLOR, i.ZERO, i.ONE);
              break;
            case iu:
              i.blendFuncSeparate(
                i.DST_COLOR,
                i.ONE_MINUS_SRC_ALPHA,
                i.ZERO,
                i.ONE,
              );
              break;
            default:
              ut("WebGLState: Invalid blending: ", $);
              break;
          }
        else
          switch ($) {
            case Gr:
              i.blendFuncSeparate(
                i.SRC_ALPHA,
                i.ONE_MINUS_SRC_ALPHA,
                i.ONE,
                i.ONE_MINUS_SRC_ALPHA,
              );
              break;
            case li:
              i.blendFuncSeparate(i.SRC_ALPHA, i.ONE, i.ONE, i.ONE);
              break;
            case ru:
              ut(
                "WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true",
              );
              break;
            case iu:
              ut(
                "WebGLState: MultiplyBlending requires material.premultipliedAlpha = true",
              );
              break;
            default:
              ut("WebGLState: Invalid blending: ", $);
              break;
          }
        ((C = null),
          (E = null),
          (S = null),
          (k = null),
          x.set(0, 0, 0),
          (T = 0),
          (m = $),
          (R = W));
      }
      return;
    }
    ((Ie = Ie || be),
      (me = me || he),
      (Ye = Ye || Le),
      (be !== y || Ie !== w) &&
        (i.blendEquationSeparate(st[be], st[Ie]), (y = be), (w = Ie)),
      (he !== C || Le !== E || me !== S || Ye !== k) &&
        (i.blendFuncSeparate(ue[he], ue[Le], ue[me], ue[Ye]),
        (C = he),
        (E = Le),
        (S = me),
        (k = Ye)),
      (Je.equals(x) === !1 || wt !== T) &&
        (i.blendColor(Je.r, Je.g, Je.b, wt), x.copy(Je), (T = wt)),
      (m = $),
      (R = !1));
  }
  function ve($, be) {
    $.side === Ut ? qe(i.CULL_FACE) : ge(i.CULL_FACE);
    let he = $.side === pn;
    (be && (he = !he),
      Me(he),
      $.blending === Gr && $.transparent === !1
        ? _e(gr)
        : _e(
            $.blending,
            $.blendEquation,
            $.blendSrc,
            $.blendDst,
            $.blendEquationAlpha,
            $.blendSrcAlpha,
            $.blendDstAlpha,
            $.blendColor,
            $.blendAlpha,
            $.premultipliedAlpha,
          ),
      a.setFunc($.depthFunc),
      a.setTest($.depthTest),
      a.setMask($.depthWrite),
      s.setMask($.colorWrite));
    const Le = $.stencilWrite;
    (o.setTest(Le),
      Le &&
        (o.setMask($.stencilWriteMask),
        o.setFunc($.stencilFunc, $.stencilRef, $.stencilFuncMask),
        o.setOp($.stencilFail, $.stencilZFail, $.stencilZPass)),
      He($.polygonOffset, $.polygonOffsetFactor, $.polygonOffsetUnits),
      $.alphaToCoverage === !0
        ? ge(i.SAMPLE_ALPHA_TO_COVERAGE)
        : qe(i.SAMPLE_ALPHA_TO_COVERAGE));
  }
  function Me($) {
    D !== $ && ($ ? i.frontFace(i.CW) : i.frontFace(i.CCW), (D = $));
  }
  function Be($) {
    ($ !== bg
      ? (ge(i.CULL_FACE),
        $ !== N &&
          ($ === nu
            ? i.cullFace(i.BACK)
            : $ === Sg
              ? i.cullFace(i.FRONT)
              : i.cullFace(i.FRONT_AND_BACK)))
      : qe(i.CULL_FACE),
      (N = $));
  }
  function Ze($) {
    $ !== X && (J && i.lineWidth($), (X = $));
  }
  function He($, be, he) {
    $
      ? (ge(i.POLYGON_OFFSET_FILL),
        (Y !== be || H !== he) &&
          ((Y = be),
          (H = he),
          a.getReversed() && (be = -be),
          i.polygonOffset(be, he)))
      : qe(i.POLYGON_OFFSET_FILL);
  }
  function At($) {
    $ ? ge(i.SCISSOR_TEST) : qe(i.SCISSOR_TEST);
  }
  function te($) {
    ($ === void 0 && ($ = i.TEXTURE0 + V - 1),
      je !== $ && (i.activeTexture($), (je = $)));
  }
  function G($, be, he) {
    he === void 0 && (je === null ? (he = i.TEXTURE0 + V - 1) : (he = je));
    let Le = de[he];
    (Le === void 0 && ((Le = { type: void 0, texture: void 0 }), (de[he] = Le)),
      (Le.type !== $ || Le.texture !== be) &&
        (je !== he && (i.activeTexture(he), (je = he)),
        i.bindTexture($, be || xe[$]),
        (Le.type = $),
        (Le.texture = be)));
  }
  function Ge() {
    const $ = de[je];
    $ !== void 0 &&
      $.type !== void 0 &&
      (i.bindTexture($.type, null), ($.type = void 0), ($.texture = void 0));
  }
  function $e() {
    try {
      i.compressedTexImage2D(...arguments);
    } catch ($) {
      ut("WebGLState:", $);
    }
  }
  function I() {
    try {
      i.compressedTexImage3D(...arguments);
    } catch ($) {
      ut("WebGLState:", $);
    }
  }
  function b() {
    try {
      i.texSubImage2D(...arguments);
    } catch ($) {
      ut("WebGLState:", $);
    }
  }
  function q() {
    try {
      i.texSubImage3D(...arguments);
    } catch ($) {
      ut("WebGLState:", $);
    }
  }
  function K() {
    try {
      i.compressedTexSubImage2D(...arguments);
    } catch ($) {
      ut("WebGLState:", $);
    }
  }
  function ie() {
    try {
      i.compressedTexSubImage3D(...arguments);
    } catch ($) {
      ut("WebGLState:", $);
    }
  }
  function Ce() {
    try {
      i.texStorage2D(...arguments);
    } catch ($) {
      ut("WebGLState:", $);
    }
  }
  function we() {
    try {
      i.texStorage3D(...arguments);
    } catch ($) {
      ut("WebGLState:", $);
    }
  }
  function ae() {
    try {
      i.texImage2D(...arguments);
    } catch ($) {
      ut("WebGLState:", $);
    }
  }
  function ce() {
    try {
      i.texImage3D(...arguments);
    } catch ($) {
      ut("WebGLState:", $);
    }
  }
  function Pe($) {
    return h[$] !== void 0 ? h[$] : i.getParameter($);
  }
  function ze($, be) {
    h[$] !== be && (i.pixelStorei($, be), (h[$] = be));
  }
  function Fe($) {
    gt.equals($) === !1 && (i.scissor($.x, $.y, $.z, $.w), gt.copy($));
  }
  function ke($) {
    ct.equals($) === !1 && (i.viewport($.x, $.y, $.z, $.w), ct.copy($));
  }
  function nt($, be) {
    let he = l.get(be);
    he === void 0 && ((he = new WeakMap()), l.set(be, he));
    let Le = he.get($);
    Le === void 0 && ((Le = i.getUniformBlockIndex(be, $.name)), he.set($, Le));
  }
  function Te($, be) {
    const Le = l.get(be).get($);
    A.get(be) !== Le &&
      (i.uniformBlockBinding(be, Le, $.__bindingPointIndex), A.set(be, Le));
  }
  function pt() {
    (i.disable(i.BLEND),
      i.disable(i.CULL_FACE),
      i.disable(i.DEPTH_TEST),
      i.disable(i.POLYGON_OFFSET_FILL),
      i.disable(i.SCISSOR_TEST),
      i.disable(i.STENCIL_TEST),
      i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),
      i.blendEquation(i.FUNC_ADD),
      i.blendFunc(i.ONE, i.ZERO),
      i.blendFuncSeparate(i.ONE, i.ZERO, i.ONE, i.ZERO),
      i.blendColor(0, 0, 0, 0),
      i.colorMask(!0, !0, !0, !0),
      i.clearColor(0, 0, 0, 0),
      i.depthMask(!0),
      i.depthFunc(i.LESS),
      a.setReversed(!1),
      i.clearDepth(1),
      i.stencilMask(4294967295),
      i.stencilFunc(i.ALWAYS, 0, 4294967295),
      i.stencilOp(i.KEEP, i.KEEP, i.KEEP),
      i.clearStencil(0),
      i.cullFace(i.BACK),
      i.frontFace(i.CCW),
      i.polygonOffset(0, 0),
      i.activeTexture(i.TEXTURE0),
      i.bindFramebuffer(i.FRAMEBUFFER, null),
      i.bindFramebuffer(i.DRAW_FRAMEBUFFER, null),
      i.bindFramebuffer(i.READ_FRAMEBUFFER, null),
      i.useProgram(null),
      i.lineWidth(1),
      i.scissor(0, 0, i.canvas.width, i.canvas.height),
      i.viewport(0, 0, i.canvas.width, i.canvas.height),
      i.pixelStorei(i.PACK_ALIGNMENT, 4),
      i.pixelStorei(i.UNPACK_ALIGNMENT, 4),
      i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL, !1),
      i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL, !1),
      i.pixelStorei(
        i.UNPACK_COLORSPACE_CONVERSION_WEBGL,
        i.BROWSER_DEFAULT_WEBGL,
      ),
      i.pixelStorei(i.PACK_ROW_LENGTH, 0),
      i.pixelStorei(i.PACK_SKIP_PIXELS, 0),
      i.pixelStorei(i.PACK_SKIP_ROWS, 0),
      i.pixelStorei(i.UNPACK_ROW_LENGTH, 0),
      i.pixelStorei(i.UNPACK_IMAGE_HEIGHT, 0),
      i.pixelStorei(i.UNPACK_SKIP_PIXELS, 0),
      i.pixelStorei(i.UNPACK_SKIP_ROWS, 0),
      i.pixelStorei(i.UNPACK_SKIP_IMAGES, 0),
      (c = {}),
      (h = {}),
      (je = null),
      (de = {}),
      (d = {}),
      (u = new WeakMap()),
      (p = []),
      (v = null),
      (g = !1),
      (m = null),
      (y = null),
      (C = null),
      (E = null),
      (w = null),
      (S = null),
      (k = null),
      (x = new Ne(0, 0, 0)),
      (T = 0),
      (R = !1),
      (D = null),
      (N = null),
      (X = null),
      (Y = null),
      (H = null),
      gt.set(0, 0, i.canvas.width, i.canvas.height),
      ct.set(0, 0, i.canvas.width, i.canvas.height),
      s.reset(),
      a.reset(),
      o.reset());
  }
  return {
    buffers: { color: s, depth: a, stencil: o },
    enable: ge,
    disable: qe,
    bindFramebuffer: Xe,
    drawBuffers: We,
    useProgram: ft,
    setBlending: _e,
    setMaterial: ve,
    setFlipSided: Me,
    setCullFace: Be,
    setLineWidth: Ze,
    setPolygonOffset: He,
    setScissorTest: At,
    activeTexture: te,
    bindTexture: G,
    unbindTexture: Ge,
    compressedTexImage2D: $e,
    compressedTexImage3D: I,
    texImage2D: ae,
    texImage3D: ce,
    pixelStorei: ze,
    getParameter: Pe,
    updateUBOMapping: nt,
    uniformBlockBinding: Te,
    texStorage2D: Ce,
    texStorage3D: we,
    texSubImage2D: b,
    texSubImage3D: q,
    compressedTexSubImage2D: K,
    compressedTexSubImage3D: ie,
    scissor: Fe,
    viewport: ke,
    reset: pt,
  };
}

function Zx(i, e, t, n, r, s, a) {
  const o = e.has("WEBGL_multisampled_render_to_texture")
      ? e.get("WEBGL_multisampled_render_to_texture")
      : null,
    A =
      typeof navigator > "u" ? !1 : /OculusBrowser/g.test(navigator.userAgent),
    l = new Ae(),
    c = new WeakMap(),
    h = new Set();
  let d;
  const u = new WeakMap();
  let p = !1;
  try {
    p =
      typeof OffscreenCanvas < "u" &&
      new OffscreenCanvas(1, 1).getContext("2d") !== null;
  } catch {}
  function v(I, b) {
    return p ? new OffscreenCanvas(I, b) : za("canvas");
  }
  function g(I, b, q) {
    let K = 1;
    const ie = $e(I);
    if (
      ((ie.width > q || ie.height > q) &&
        (K = q / Math.max(ie.width, ie.height)),
      K < 1)
    )
      if (
        (typeof HTMLImageElement < "u" && I instanceof HTMLImageElement) ||
        (typeof HTMLCanvasElement < "u" && I instanceof HTMLCanvasElement) ||
        (typeof ImageBitmap < "u" && I instanceof ImageBitmap) ||
        (typeof VideoFrame < "u" && I instanceof VideoFrame)
      ) {
        const Ce = Math.floor(K * ie.width),
          we = Math.floor(K * ie.height);
        d === void 0 && (d = v(Ce, we));
        const ae = b ? v(Ce, we) : d;
        return (
          (ae.width = Ce),
          (ae.height = we),
          ae.getContext("2d").drawImage(I, 0, 0, Ce, we),
          it(
            "WebGLRenderer: Texture has been resized from (" +
              ie.width +
              "x" +
              ie.height +
              ") to (" +
              Ce +
              "x" +
              we +
              ").",
          ),
          ae
        );
      } else
        return (
          "data" in I &&
            it(
              "WebGLRenderer: Image in DataTexture is too big (" +
                ie.width +
                "x" +
                ie.height +
                ").",
            ),
          I
        );
    return I;
  }
  function m(I) {
    return I.generateMipmaps;
  }
  function y(I) {
    i.generateMipmap(I);
  }
  function C(I) {
    return I.isWebGLCubeRenderTarget
      ? i.TEXTURE_CUBE_MAP
      : I.isWebGL3DRenderTarget
        ? i.TEXTURE_3D
        : I.isWebGLArrayRenderTarget || I.isCompressedArrayTexture
          ? i.TEXTURE_2D_ARRAY
          : i.TEXTURE_2D;
  }
  function E(I, b, q, K, ie, Ce = !1) {
    if (I !== null) {
      if (i[I] !== void 0) return i[I];
      it(
        "WebGLRenderer: Attempt to use non-existing WebGL internal format '" +
          I +
          "'",
      );
    }
    let we;
    K &&
      ((we = e.get("EXT_texture_norm16")),
      we ||
        it(
          "WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension",
        ));
    let ae = b;
    if (
      (b === i.RED &&
        (q === i.FLOAT && (ae = i.R32F),
        q === i.HALF_FLOAT && (ae = i.R16F),
        q === i.UNSIGNED_BYTE && (ae = i.R8),
        q === i.UNSIGNED_SHORT && we && (ae = we.R16_EXT),
        q === i.SHORT && we && (ae = we.R16_SNORM_EXT)),
      b === i.RED_INTEGER &&
        (q === i.UNSIGNED_BYTE && (ae = i.R8UI),
        q === i.UNSIGNED_SHORT && (ae = i.R16UI),
        q === i.UNSIGNED_INT && (ae = i.R32UI),
        q === i.BYTE && (ae = i.R8I),
        q === i.SHORT && (ae = i.R16I),
        q === i.INT && (ae = i.R32I)),
      b === i.RG &&
        (q === i.FLOAT && (ae = i.RG32F),
        q === i.HALF_FLOAT && (ae = i.RG16F),
        q === i.UNSIGNED_BYTE && (ae = i.RG8),
        q === i.UNSIGNED_SHORT && we && (ae = we.RG16_EXT),
        q === i.SHORT && we && (ae = we.RG16_SNORM_EXT)),
      b === i.RG_INTEGER &&
        (q === i.UNSIGNED_BYTE && (ae = i.RG8UI),
        q === i.UNSIGNED_SHORT && (ae = i.RG16UI),
        q === i.UNSIGNED_INT && (ae = i.RG32UI),
        q === i.BYTE && (ae = i.RG8I),
        q === i.SHORT && (ae = i.RG16I),
        q === i.INT && (ae = i.RG32I)),
      b === i.RGB_INTEGER &&
        (q === i.UNSIGNED_BYTE && (ae = i.RGB8UI),
        q === i.UNSIGNED_SHORT && (ae = i.RGB16UI),
        q === i.UNSIGNED_INT && (ae = i.RGB32UI),
        q === i.BYTE && (ae = i.RGB8I),
        q === i.SHORT && (ae = i.RGB16I),
        q === i.INT && (ae = i.RGB32I)),
      b === i.RGBA_INTEGER &&
        (q === i.UNSIGNED_BYTE && (ae = i.RGBA8UI),
        q === i.UNSIGNED_SHORT && (ae = i.RGBA16UI),
        q === i.UNSIGNED_INT && (ae = i.RGBA32UI),
        q === i.BYTE && (ae = i.RGBA8I),
        q === i.SHORT && (ae = i.RGBA16I),
        q === i.INT && (ae = i.RGBA32I)),
      b === i.RGB &&
        (q === i.UNSIGNED_SHORT && we && (ae = we.RGB16_EXT),
        q === i.SHORT && we && (ae = we.RGB16_SNORM_EXT),
        q === i.UNSIGNED_INT_5_9_9_9_REV && (ae = i.RGB9_E5),
        q === i.UNSIGNED_INT_10F_11F_11F_REV && (ae = i.R11F_G11F_B10F)),
      b === i.RGBA)
    ) {
      const ce = Ce ? RA : bt.getTransfer(ie);
      (q === i.FLOAT && (ae = i.RGBA32F),
        q === i.HALF_FLOAT && (ae = i.RGBA16F),
        q === i.UNSIGNED_BYTE && (ae = ce === kt ? i.SRGB8_ALPHA8 : i.RGBA8),
        q === i.UNSIGNED_SHORT && we && (ae = we.RGBA16_EXT),
        q === i.SHORT && we && (ae = we.RGBA16_SNORM_EXT),
        q === i.UNSIGNED_SHORT_4_4_4_4 && (ae = i.RGBA4),
        q === i.UNSIGNED_SHORT_5_5_5_1 && (ae = i.RGB5_A1));
    }
    return (
      (ae === i.R16F ||
        ae === i.R32F ||
        ae === i.RG16F ||
        ae === i.RG32F ||
        ae === i.RGBA16F ||
        ae === i.RGBA32F) &&
        e.get("EXT_color_buffer_float"),
      ae
    );
  }
  function w(I, b) {
    let q;
    return (
      I
        ? b === null || b === Er || b === Oa
          ? (q = i.DEPTH24_STENCIL8)
          : b === On
            ? (q = i.DEPTH32F_STENCIL8)
            : b === Ga &&
              ((q = i.DEPTH24_STENCIL8),
              it(
                "DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.",
              ))
        : b === null || b === Er || b === Oa
          ? (q = i.DEPTH_COMPONENT24)
          : b === On
            ? (q = i.DEPTH_COMPONENT32F)
            : b === Ga && (q = i.DEPTH_COMPONENT16),
      q
    );
  }
  function S(I, b) {
    return m(I) === !0 ||
      (I.isFramebufferTexture && I.minFilter !== Yt && I.minFilter !== qt)
      ? Math.log2(Math.max(b.width, b.height)) + 1
      : I.mipmaps !== void 0 && I.mipmaps.length > 0
        ? I.mipmaps.length
        : I.isCompressedTexture && Array.isArray(I.image)
          ? b.mipmaps.length
          : 1;
  }
  function k(I) {
    const b = I.target;
    (b.removeEventListener("dispose", k),
      T(b),
      b.isVideoTexture && c.delete(b),
      b.isHTMLTexture && h.delete(b));
  }
  function x(I) {
    const b = I.target;
    (b.removeEventListener("dispose", x), D(b));
  }
  function T(I) {
    const b = n.get(I);
    if (b.__webglInit === void 0) return;
    const q = I.source,
      K = u.get(q);
    if (K) {
      const ie = K[b.__cacheKey];
      (ie.usedTimes--,
        ie.usedTimes === 0 && R(I),
        Object.keys(K).length === 0 && u.delete(q));
    }
    n.remove(I);
  }
  function R(I) {
    const b = n.get(I);
    i.deleteTexture(b.__webglTexture);
    const q = I.source,
      K = u.get(q);
    (delete K[b.__cacheKey], a.memory.textures--);
  }
  function D(I) {
    const b = n.get(I);
    if (
      (I.depthTexture && (I.depthTexture.dispose(), n.remove(I.depthTexture)),
      I.isWebGLCubeRenderTarget)
    )
      for (let K = 0; K < 6; K++) {
        if (Array.isArray(b.__webglFramebuffer[K]))
          for (let ie = 0; ie < b.__webglFramebuffer[K].length; ie++)
            i.deleteFramebuffer(b.__webglFramebuffer[K][ie]);
        else i.deleteFramebuffer(b.__webglFramebuffer[K]);
        b.__webglDepthbuffer && i.deleteRenderbuffer(b.__webglDepthbuffer[K]);
      }
    else {
      if (Array.isArray(b.__webglFramebuffer))
        for (let K = 0; K < b.__webglFramebuffer.length; K++)
          i.deleteFramebuffer(b.__webglFramebuffer[K]);
      else i.deleteFramebuffer(b.__webglFramebuffer);
      if (
        (b.__webglDepthbuffer && i.deleteRenderbuffer(b.__webglDepthbuffer),
        b.__webglMultisampledFramebuffer &&
          i.deleteFramebuffer(b.__webglMultisampledFramebuffer),
        b.__webglColorRenderbuffer)
      )
        for (let K = 0; K < b.__webglColorRenderbuffer.length; K++)
          b.__webglColorRenderbuffer[K] &&
            i.deleteRenderbuffer(b.__webglColorRenderbuffer[K]);
      b.__webglDepthRenderbuffer &&
        i.deleteRenderbuffer(b.__webglDepthRenderbuffer);
    }
    const q = I.textures;
    for (let K = 0, ie = q.length; K < ie; K++) {
      const Ce = n.get(q[K]);
      (Ce.__webglTexture &&
        (i.deleteTexture(Ce.__webglTexture), a.memory.textures--),
        n.remove(q[K]));
    }
    n.remove(I);
  }
  let N = 0;
  function X() {
    N = 0;
  }
  function Y() {
    return N;
  }
  function H(I) {
    N = I;
  }
  function V() {
    const I = N;
    return (
      I >= r.maxTextures &&
        it(
          "WebGLTextures: Trying to use " +
            I +
            " texture units while this GPU supports only " +
            r.maxTextures,
        ),
      (N += 1),
      I
    );
  }
  function J(I) {
    const b = [];
    return (
      b.push(I.wrapS),
      b.push(I.wrapT),
      b.push(I.wrapR || 0),
      b.push(I.magFilter),
      b.push(I.minFilter),
      b.push(I.anisotropy),
      b.push(I.internalFormat),
      b.push(I.format),
      b.push(I.type),
      b.push(I.generateMipmaps),
      b.push(I.premultiplyAlpha),
      b.push(I.flipY),
      b.push(I.unpackAlignment),
      b.push(I.colorSpace),
      b.join()
    );
  }
  function ne(I, b) {
    const q = n.get(I);
    if (
      (I.isVideoTexture && G(I),
      I.isRenderTargetTexture === !1 &&
        I.isExternalTexture !== !0 &&
        I.version > 0 &&
        q.__version !== I.version)
    ) {
      const K = I.image;
      if (K === null)
        it("WebGLRenderer: Texture marked for update but no image data found.");
      else if (K.complete === !1)
        it("WebGLRenderer: Texture marked for update but image is incomplete");
      else {
        qe(q, I, b);
        return;
      }
    } else
      I.isExternalTexture &&
        (q.__webglTexture = I.sourceTexture ? I.sourceTexture : null);
    t.bindTexture(i.TEXTURE_2D, q.__webglTexture, i.TEXTURE0 + b);
  }
  function le(I, b) {
    const q = n.get(I);
    if (
      I.isRenderTargetTexture === !1 &&
      I.version > 0 &&
      q.__version !== I.version
    ) {
      qe(q, I, b);
      return;
    } else
      I.isExternalTexture &&
        (q.__webglTexture = I.sourceTexture ? I.sourceTexture : null);
    t.bindTexture(i.TEXTURE_2D_ARRAY, q.__webglTexture, i.TEXTURE0 + b);
  }
  function je(I, b) {
    const q = n.get(I);
    if (
      I.isRenderTargetTexture === !1 &&
      I.version > 0 &&
      q.__version !== I.version
    ) {
      qe(q, I, b);
      return;
    }
    t.bindTexture(i.TEXTURE_3D, q.__webglTexture, i.TEXTURE0 + b);
  }
  function de(I, b) {
    const q = n.get(I);
    if (
      I.isCubeDepthTexture !== !0 &&
      I.version > 0 &&
      q.__version !== I.version
    ) {
      Xe(q, I, b);
      return;
    }
    t.bindTexture(i.TEXTURE_CUBE_MAP, q.__webglTexture, i.TEXTURE0 + b);
  }
  const pe = { [ci]: i.REPEAT, [fr]: i.CLAMP_TO_EDGE, [BA]: i.MIRRORED_REPEAT },
    Se = {
      [Yt]: i.NEAREST,
      [gm]: i.NEAREST_MIPMAP_NEAREST,
      [ba]: i.NEAREST_MIPMAP_LINEAR,
      [qt]: i.LINEAR,
      [fA]: i.LINEAR_MIPMAP_NEAREST,
      [pr]: i.LINEAR_MIPMAP_LINEAR,
    },
    gt = {
      [Qg]: i.NEVER,
      [iv]: i.ALWAYS,
      [ev]: i.LESS,
      [gd]: i.LEQUAL,
      [tv]: i.EQUAL,
      [vd]: i.GEQUAL,
      [nv]: i.GREATER,
      [rv]: i.NOTEQUAL,
    };
  function ct(I, b) {
    if (
      (b.type === On &&
        e.has("OES_texture_float_linear") === !1 &&
        (b.magFilter === qt ||
          b.magFilter === fA ||
          b.magFilter === ba ||
          b.magFilter === pr ||
          b.minFilter === qt ||
          b.minFilter === fA ||
          b.minFilter === ba ||
          b.minFilter === pr) &&
        it(
          "WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device.",
        ),
      i.texParameteri(I, i.TEXTURE_WRAP_S, pe[b.wrapS]),
      i.texParameteri(I, i.TEXTURE_WRAP_T, pe[b.wrapT]),
      (I === i.TEXTURE_3D || I === i.TEXTURE_2D_ARRAY) &&
        i.texParameteri(I, i.TEXTURE_WRAP_R, pe[b.wrapR]),
      i.texParameteri(I, i.TEXTURE_MAG_FILTER, Se[b.magFilter]),
      i.texParameteri(I, i.TEXTURE_MIN_FILTER, Se[b.minFilter]),
      b.compareFunction &&
        (i.texParameteri(I, i.TEXTURE_COMPARE_MODE, i.COMPARE_REF_TO_TEXTURE),
        i.texParameteri(I, i.TEXTURE_COMPARE_FUNC, gt[b.compareFunction])),
      e.has("EXT_texture_filter_anisotropic") === !0)
    ) {
      if (
        b.magFilter === Yt ||
        (b.minFilter !== ba && b.minFilter !== pr) ||
        (b.type === On && e.has("OES_texture_float_linear") === !1)
      )
        return;
      if (b.anisotropy > 1 || n.get(b).__currentAnisotropy) {
        const q = e.get("EXT_texture_filter_anisotropic");
        (i.texParameterf(
          I,
          q.TEXTURE_MAX_ANISOTROPY_EXT,
          Math.min(b.anisotropy, r.getMaxAnisotropy()),
        ),
          (n.get(b).__currentAnisotropy = b.anisotropy));
      }
    }
  }
  function oe(I, b) {
    let q = !1;
    I.__webglInit === void 0 &&
      ((I.__webglInit = !0), b.addEventListener("dispose", k));
    const K = b.source;
    let ie = u.get(K);
    ie === void 0 && ((ie = {}), u.set(K, ie));
    const Ce = J(b);
    if (Ce !== I.__cacheKey) {
      (ie[Ce] === void 0 &&
        ((ie[Ce] = { texture: i.createTexture(), usedTimes: 0 }),
        a.memory.textures++,
        (q = !0)),
        ie[Ce].usedTimes++);
      const we = ie[I.__cacheKey];
      (we !== void 0 &&
        (ie[I.__cacheKey].usedTimes--, we.usedTimes === 0 && R(b)),
        (I.__cacheKey = Ce),
        (I.__webglTexture = ie[Ce].texture));
    }
    return q;
  }
  function xe(I, b, q) {
    return Math.floor(Math.floor(I / q) / b);
  }
  function ge(I, b, q, K) {
    const Ce = I.updateRanges;
    if (Ce.length === 0)
      t.texSubImage2D(i.TEXTURE_2D, 0, 0, 0, b.width, b.height, q, K, b.data);
    else {
      Ce.sort((ze, Fe) => ze.start - Fe.start);
      let we = 0;
      for (let ze = 1; ze < Ce.length; ze++) {
        const Fe = Ce[we],
          ke = Ce[ze],
          nt = Fe.start + Fe.count,
          Te = xe(ke.start, b.width, 4),
          pt = xe(Fe.start, b.width, 4);
        ke.start <= nt + 1 &&
        Te === pt &&
        xe(ke.start + ke.count - 1, b.width, 4) === Te
          ? (Fe.count = Math.max(Fe.count, ke.start + ke.count - Fe.start))
          : (++we, (Ce[we] = ke));
      }
      Ce.length = we + 1;
      const ae = t.getParameter(i.UNPACK_ROW_LENGTH),
        ce = t.getParameter(i.UNPACK_SKIP_PIXELS),
        Pe = t.getParameter(i.UNPACK_SKIP_ROWS);
      t.pixelStorei(i.UNPACK_ROW_LENGTH, b.width);
      for (let ze = 0, Fe = Ce.length; ze < Fe; ze++) {
        const ke = Ce[ze],
          nt = Math.floor(ke.start / 4),
          Te = Math.ceil(ke.count / 4),
          pt = nt % b.width,
          $ = Math.floor(nt / b.width),
          be = Te,
          he = 1;
        (t.pixelStorei(i.UNPACK_SKIP_PIXELS, pt),
          t.pixelStorei(i.UNPACK_SKIP_ROWS, $),
          t.texSubImage2D(i.TEXTURE_2D, 0, pt, $, be, he, q, K, b.data));
      }
      (I.clearUpdateRanges(),
        t.pixelStorei(i.UNPACK_ROW_LENGTH, ae),
        t.pixelStorei(i.UNPACK_SKIP_PIXELS, ce),
        t.pixelStorei(i.UNPACK_SKIP_ROWS, Pe));
    }
  }
  function qe(I, b, q) {
    let K = i.TEXTURE_2D;
    ((b.isDataArrayTexture || b.isCompressedArrayTexture) &&
      (K = i.TEXTURE_2D_ARRAY),
      b.isData3DTexture && (K = i.TEXTURE_3D));
    const ie = oe(I, b),
      Ce = b.source;
    t.bindTexture(K, I.__webglTexture, i.TEXTURE0 + q);
    const we = n.get(Ce);
    if (Ce.version !== we.__version || ie === !0) {
      if (
        (t.activeTexture(i.TEXTURE0 + q),
        (typeof ImageBitmap < "u" && b.image instanceof ImageBitmap) === !1)
      ) {
        const he = bt.getPrimaries(bt.workingColorSpace),
          Le = b.colorSpace === si ? null : bt.getPrimaries(b.colorSpace),
          Ie =
            b.colorSpace === si || he === Le ? i.NONE : i.BROWSER_DEFAULT_WEBGL;
        (t.pixelStorei(i.UNPACK_FLIP_Y_WEBGL, b.flipY),
          t.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL, b.premultiplyAlpha),
          t.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL, Ie));
      }
      t.pixelStorei(i.UNPACK_ALIGNMENT, b.unpackAlignment);
      let ce = g(b.image, !1, r.maxTextureSize);
      ce = Ge(b, ce);
      const Pe = s.convert(b.format, b.colorSpace),
        ze = s.convert(b.type);
      let Fe = E(
        b.internalFormat,
        Pe,
        ze,
        b.normalized,
        b.colorSpace,
        b.isVideoTexture,
      );
      ct(K, b);
      let ke;
      const nt = b.mipmaps,
        Te = b.isVideoTexture !== !0,
        pt = we.__version === void 0 || ie === !0,
        $ = Ce.dataReady,
        be = S(b, ce);
      if (b.isDepthTexture)
        ((Fe = w(b.format === Ii, b.type)),
          pt &&
            (Te
              ? t.texStorage2D(i.TEXTURE_2D, 1, Fe, ce.width, ce.height)
              : t.texImage2D(
                  i.TEXTURE_2D,
                  0,
                  Fe,
                  ce.width,
                  ce.height,
                  0,
                  Pe,
                  ze,
                  null,
                )));
      else if (b.isDataTexture)
        if (nt.length > 0) {
          Te &&
            pt &&
            t.texStorage2D(i.TEXTURE_2D, be, Fe, nt[0].width, nt[0].height);
          for (let he = 0, Le = nt.length; he < Le; he++)
            ((ke = nt[he]),
              Te
                ? $ &&
                  t.texSubImage2D(
                    i.TEXTURE_2D,
                    he,
                    0,
                    0,
                    ke.width,
                    ke.height,
                    Pe,
                    ze,
                    ke.data,
                  )
                : t.texImage2D(
                    i.TEXTURE_2D,
                    he,
                    Fe,
                    ke.width,
                    ke.height,
                    0,
                    Pe,
                    ze,
                    ke.data,
                  ));
          b.generateMipmaps = !1;
        } else
          Te
            ? (pt && t.texStorage2D(i.TEXTURE_2D, be, Fe, ce.width, ce.height),
              $ && ge(b, ce, Pe, ze))
            : t.texImage2D(
                i.TEXTURE_2D,
                0,
                Fe,
                ce.width,
                ce.height,
                0,
                Pe,
                ze,
                ce.data,
              );
      else if (b.isCompressedTexture)
        if (b.isCompressedArrayTexture) {
          Te &&
            pt &&
            t.texStorage3D(
              i.TEXTURE_2D_ARRAY,
              be,
              Fe,
              nt[0].width,
              nt[0].height,
              ce.depth,
            );
          for (let he = 0, Le = nt.length; he < Le; he++)
            if (((ke = nt[he]), b.format !== Hn))
              if (Pe !== null)
                if (Te) {
                  if ($)
                    if (b.layerUpdates.size > 0) {
                      const Ie = sf(ke.width, ke.height, b.format, b.type);
                      for (const me of b.layerUpdates) {
                        const Ye = ke.data.subarray(
                          (me * Ie) / ke.data.BYTES_PER_ELEMENT,
                          ((me + 1) * Ie) / ke.data.BYTES_PER_ELEMENT,
                        );
                        t.compressedTexSubImage3D(
                          i.TEXTURE_2D_ARRAY,
                          he,
                          0,
                          0,
                          me,
                          ke.width,
                          ke.height,
                          1,
                          Pe,
                          Ye,
                        );
                      }
                      b.clearLayerUpdates();
                    } else
                      t.compressedTexSubImage3D(
                        i.TEXTURE_2D_ARRAY,
                        he,
                        0,
                        0,
                        0,
                        ke.width,
                        ke.height,
                        ce.depth,
                        Pe,
                        ke.data,
                      );
                } else
                  t.compressedTexImage3D(
                    i.TEXTURE_2D_ARRAY,
                    he,
                    Fe,
                    ke.width,
                    ke.height,
                    ce.depth,
                    0,
                    ke.data,
                    0,
                    0,
                  );
              else
                it(
                  "WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()",
                );
            else
              Te
                ? $ &&
                  t.texSubImage3D(
                    i.TEXTURE_2D_ARRAY,
                    he,
                    0,
                    0,
                    0,
                    ke.width,
                    ke.height,
                    ce.depth,
                    Pe,
                    ze,
                    ke.data,
                  )
                : t.texImage3D(
                    i.TEXTURE_2D_ARRAY,
                    he,
                    Fe,
                    ke.width,
                    ke.height,
                    ce.depth,
                    0,
                    Pe,
                    ze,
                    ke.data,
                  );
        } else {
          Te &&
            pt &&
            t.texStorage2D(i.TEXTURE_2D, be, Fe, nt[0].width, nt[0].height);
          for (let he = 0, Le = nt.length; he < Le; he++)
            ((ke = nt[he]),
              b.format !== Hn
                ? Pe !== null
                  ? Te
                    ? $ &&
                      t.compressedTexSubImage2D(
                        i.TEXTURE_2D,
                        he,
                        0,
                        0,
                        ke.width,
                        ke.height,
                        Pe,
                        ke.data,
                      )
                    : t.compressedTexImage2D(
                        i.TEXTURE_2D,
                        he,
                        Fe,
                        ke.width,
                        ke.height,
                        0,
                        ke.data,
                      )
                  : it(
                      "WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()",
                    )
                : Te
                  ? $ &&
                    t.texSubImage2D(
                      i.TEXTURE_2D,
                      he,
                      0,
                      0,
                      ke.width,
                      ke.height,
                      Pe,
                      ze,
                      ke.data,
                    )
                  : t.texImage2D(
                      i.TEXTURE_2D,
                      he,
                      Fe,
                      ke.width,
                      ke.height,
                      0,
                      Pe,
                      ze,
                      ke.data,
                    ));
        }
      else if (b.isDataArrayTexture)
        if (Te) {
          if (
            (pt &&
              t.texStorage3D(
                i.TEXTURE_2D_ARRAY,
                be,
                Fe,
                ce.width,
                ce.height,
                ce.depth,
              ),
            $)
          )
            if (b.layerUpdates.size > 0) {
              const he = sf(ce.width, ce.height, b.format, b.type);
              for (const Le of b.layerUpdates) {
                const Ie = ce.data.subarray(
                  (Le * he) / ce.data.BYTES_PER_ELEMENT,
                  ((Le + 1) * he) / ce.data.BYTES_PER_ELEMENT,
                );
                t.texSubImage3D(
                  i.TEXTURE_2D_ARRAY,
                  0,
                  0,
                  0,
                  Le,
                  ce.width,
                  ce.height,
                  1,
                  Pe,
                  ze,
                  Ie,
                );
              }
              b.clearLayerUpdates();
            } else
              t.texSubImage3D(
                i.TEXTURE_2D_ARRAY,
                0,
                0,
                0,
                0,
                ce.width,
                ce.height,
                ce.depth,
                Pe,
                ze,
                ce.data,
              );
        } else
          t.texImage3D(
            i.TEXTURE_2D_ARRAY,
            0,
            Fe,
            ce.width,
            ce.height,
            ce.depth,
            0,
            Pe,
            ze,
            ce.data,
          );
      else if (b.isData3DTexture)
        Te
          ? (pt &&
              t.texStorage3D(
                i.TEXTURE_3D,
                be,
                Fe,
                ce.width,
                ce.height,
                ce.depth,
              ),
            $ &&
              t.texSubImage3D(
                i.TEXTURE_3D,
                0,
                0,
                0,
                0,
                ce.width,
                ce.height,
                ce.depth,
                Pe,
                ze,
                ce.data,
              ))
          : t.texImage3D(
              i.TEXTURE_3D,
              0,
              Fe,
              ce.width,
              ce.height,
              ce.depth,
              0,
              Pe,
              ze,
              ce.data,
            );
      else if (b.isFramebufferTexture) {
        if (pt)
          if (Te) t.texStorage2D(i.TEXTURE_2D, be, Fe, ce.width, ce.height);
          else {
            let he = ce.width,
              Le = ce.height;
            for (let Ie = 0; Ie < be; Ie++)
              (t.texImage2D(i.TEXTURE_2D, Ie, Fe, he, Le, 0, Pe, ze, null),
                (he >>= 1),
                (Le >>= 1));
          }
      } else if (b.isHTMLTexture) {
        if ("texElementImage2D" in i) {
          const he = i.canvas;
          if (
            (he.hasAttribute("layoutsubtree") ||
              he.setAttribute("layoutsubtree", "true"),
            ce.parentNode !== he)
          ) {
            (he.appendChild(ce),
              h.add(b),
              (he.onpaint = (Le) => {
                const Ie = Le.changedElements;
                for (const me of h)
                  Ie.includes(me.image) && (me.needsUpdate = !0);
              }),
              he.requestPaint());
            return;
          }
          if (i.texElementImage2D.length === 3)
            i.texElementImage2D(i.TEXTURE_2D, i.RGBA8, ce);
          else {
            const Ie = i.RGBA,
              me = i.RGBA,
              Ye = i.UNSIGNED_BYTE;
            i.texElementImage2D(i.TEXTURE_2D, 0, Ie, me, Ye, ce);
          }
          (i.texParameteri(i.TEXTURE_2D, i.TEXTURE_MIN_FILTER, i.LINEAR),
            i.texParameteri(i.TEXTURE_2D, i.TEXTURE_WRAP_S, i.CLAMP_TO_EDGE),
            i.texParameteri(i.TEXTURE_2D, i.TEXTURE_WRAP_T, i.CLAMP_TO_EDGE));
        }
      } else if (nt.length > 0) {
        if (Te && pt) {
          const he = $e(nt[0]);
          t.texStorage2D(i.TEXTURE_2D, be, Fe, he.width, he.height);
        }
        for (let he = 0, Le = nt.length; he < Le; he++)
          ((ke = nt[he]),
            Te
              ? $ && t.texSubImage2D(i.TEXTURE_2D, he, 0, 0, Pe, ze, ke)
              : t.texImage2D(i.TEXTURE_2D, he, Fe, Pe, ze, ke));
        b.generateMipmaps = !1;
      } else if (Te) {
        if (pt) {
          const he = $e(ce);
          t.texStorage2D(i.TEXTURE_2D, be, Fe, he.width, he.height);
        }
        $ && t.texSubImage2D(i.TEXTURE_2D, 0, 0, 0, Pe, ze, ce);
      } else t.texImage2D(i.TEXTURE_2D, 0, Fe, Pe, ze, ce);
      (m(b) && y(K), (we.__version = Ce.version), b.onUpdate && b.onUpdate(b));
    }
    I.__version = b.version;
  }
  function Xe(I, b, q) {
    if (b.image.length !== 6) return;
    const K = oe(I, b),
      ie = b.source;
    t.bindTexture(i.TEXTURE_CUBE_MAP, I.__webglTexture, i.TEXTURE0 + q);
    const Ce = n.get(ie);
    if (ie.version !== Ce.__version || K === !0) {
      t.activeTexture(i.TEXTURE0 + q);
      const we = bt.getPrimaries(bt.workingColorSpace),
        ae = b.colorSpace === si ? null : bt.getPrimaries(b.colorSpace),
        ce =
          b.colorSpace === si || we === ae ? i.NONE : i.BROWSER_DEFAULT_WEBGL;
      (t.pixelStorei(i.UNPACK_FLIP_Y_WEBGL, b.flipY),
        t.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL, b.premultiplyAlpha),
        t.pixelStorei(i.UNPACK_ALIGNMENT, b.unpackAlignment),
        t.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL, ce));
      const Pe = b.isCompressedTexture || b.image[0].isCompressedTexture,
        ze = b.image[0] && b.image[0].isDataTexture,
        Fe = [];
      for (let me = 0; me < 6; me++)
        (!Pe && !ze
          ? (Fe[me] = g(b.image[me], !0, r.maxCubemapSize))
          : (Fe[me] = ze ? b.image[me].image : b.image[me]),
          (Fe[me] = Ge(b, Fe[me])));
      const ke = Fe[0],
        nt = s.convert(b.format, b.colorSpace),
        Te = s.convert(b.type),
        pt = E(b.internalFormat, nt, Te, b.normalized, b.colorSpace),
        $ = b.isVideoTexture !== !0,
        be = Ce.__version === void 0 || K === !0,
        he = ie.dataReady;
      let Le = S(b, ke);
      ct(i.TEXTURE_CUBE_MAP, b);
      let Ie;
      if (Pe) {
        $ &&
          be &&
          t.texStorage2D(i.TEXTURE_CUBE_MAP, Le, pt, ke.width, ke.height);
        for (let me = 0; me < 6; me++) {
          Ie = Fe[me].mipmaps;
          for (let Ye = 0; Ye < Ie.length; Ye++) {
            const Je = Ie[Ye];
            b.format !== Hn
              ? nt !== null
                ? $
                  ? he &&
                    t.compressedTexSubImage2D(
                      i.TEXTURE_CUBE_MAP_POSITIVE_X + me,
                      Ye,
                      0,
                      0,
                      Je.width,
                      Je.height,
                      nt,
                      Je.data,
                    )
                  : t.compressedTexImage2D(
                      i.TEXTURE_CUBE_MAP_POSITIVE_X + me,
                      Ye,
                      pt,
                      Je.width,
                      Je.height,
                      0,
                      Je.data,
                    )
                : it(
                    "WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()",
                  )
              : $
                ? he &&
                  t.texSubImage2D(
                    i.TEXTURE_CUBE_MAP_POSITIVE_X + me,
                    Ye,
                    0,
                    0,
                    Je.width,
                    Je.height,
                    nt,
                    Te,
                    Je.data,
                  )
                : t.texImage2D(
                    i.TEXTURE_CUBE_MAP_POSITIVE_X + me,
                    Ye,
                    pt,
                    Je.width,
                    Je.height,
                    0,
                    nt,
                    Te,
                    Je.data,
                  );
          }
        }
      } else {
        if (((Ie = b.mipmaps), $ && be)) {
          Ie.length > 0 && Le++;
          const me = $e(Fe[0]);
          t.texStorage2D(i.TEXTURE_CUBE_MAP, Le, pt, me.width, me.height);
        }
        for (let me = 0; me < 6; me++)
          if (ze) {
            $
              ? he &&
                t.texSubImage2D(
                  i.TEXTURE_CUBE_MAP_POSITIVE_X + me,
                  0,
                  0,
                  0,
                  Fe[me].width,
                  Fe[me].height,
                  nt,
                  Te,
                  Fe[me].data,
                )
              : t.texImage2D(
                  i.TEXTURE_CUBE_MAP_POSITIVE_X + me,
                  0,
                  pt,
                  Fe[me].width,
                  Fe[me].height,
                  0,
                  nt,
                  Te,
                  Fe[me].data,
                );
            for (let Ye = 0; Ye < Ie.length; Ye++) {
              const wt = Ie[Ye].image[me].image;
              $
                ? he &&
                  t.texSubImage2D(
                    i.TEXTURE_CUBE_MAP_POSITIVE_X + me,
                    Ye + 1,
                    0,
                    0,
                    wt.width,
                    wt.height,
                    nt,
                    Te,
                    wt.data,
                  )
                : t.texImage2D(
                    i.TEXTURE_CUBE_MAP_POSITIVE_X + me,
                    Ye + 1,
                    pt,
                    wt.width,
                    wt.height,
                    0,
                    nt,
                    Te,
                    wt.data,
                  );
            }
          } else {
            $
              ? he &&
                t.texSubImage2D(
                  i.TEXTURE_CUBE_MAP_POSITIVE_X + me,
                  0,
                  0,
                  0,
                  nt,
                  Te,
                  Fe[me],
                )
              : t.texImage2D(
                  i.TEXTURE_CUBE_MAP_POSITIVE_X + me,
                  0,
                  pt,
                  nt,
                  Te,
                  Fe[me],
                );
            for (let Ye = 0; Ye < Ie.length; Ye++) {
              const Je = Ie[Ye];
              $
                ? he &&
                  t.texSubImage2D(
                    i.TEXTURE_CUBE_MAP_POSITIVE_X + me,
                    Ye + 1,
                    0,
                    0,
                    nt,
                    Te,
                    Je.image[me],
                  )
                : t.texImage2D(
                    i.TEXTURE_CUBE_MAP_POSITIVE_X + me,
                    Ye + 1,
                    pt,
                    nt,
                    Te,
                    Je.image[me],
                  );
            }
          }
      }
      (m(b) && y(i.TEXTURE_CUBE_MAP),
        (Ce.__version = ie.version),
        b.onUpdate && b.onUpdate(b));
    }
    I.__version = b.version;
  }
  function We(I, b, q, K, ie, Ce) {
    const we = s.convert(q.format, q.colorSpace),
      ae = s.convert(q.type),
      ce = E(q.internalFormat, we, ae, q.normalized, q.colorSpace),
      Pe = n.get(b),
      ze = n.get(q);
    if (((ze.__renderTarget = b), !Pe.__hasExternalTextures)) {
      const Fe = Math.max(1, b.width >> Ce),
        ke = Math.max(1, b.height >> Ce);
      ie === i.TEXTURE_3D || ie === i.TEXTURE_2D_ARRAY
        ? t.texImage3D(ie, Ce, ce, Fe, ke, b.depth, 0, we, ae, null)
        : t.texImage2D(ie, Ce, ce, Fe, ke, 0, we, ae, null);
    }
    (t.bindFramebuffer(i.FRAMEBUFFER, I),
      te(b)
        ? o.framebufferTexture2DMultisampleEXT(
            i.FRAMEBUFFER,
            K,
            ie,
            ze.__webglTexture,
            0,
            At(b),
          )
        : (ie === i.TEXTURE_2D ||
            (ie >= i.TEXTURE_CUBE_MAP_POSITIVE_X &&
              ie <= i.TEXTURE_CUBE_MAP_NEGATIVE_Z)) &&
          i.framebufferTexture2D(i.FRAMEBUFFER, K, ie, ze.__webglTexture, Ce),
      t.bindFramebuffer(i.FRAMEBUFFER, null));
  }
  function ft(I, b, q) {
    if ((i.bindRenderbuffer(i.RENDERBUFFER, I), b.depthBuffer)) {
      const K = b.depthTexture,
        ie = K && K.isDepthTexture ? K.type : null,
        Ce = w(b.stencilBuffer, ie),
        we = b.stencilBuffer ? i.DEPTH_STENCIL_ATTACHMENT : i.DEPTH_ATTACHMENT;
      (te(b)
        ? o.renderbufferStorageMultisampleEXT(
            i.RENDERBUFFER,
            At(b),
            Ce,
            b.width,
            b.height,
          )
        : q
          ? i.renderbufferStorageMultisample(
              i.RENDERBUFFER,
              At(b),
              Ce,
              b.width,
              b.height,
            )
          : i.renderbufferStorage(i.RENDERBUFFER, Ce, b.width, b.height),
        i.framebufferRenderbuffer(i.FRAMEBUFFER, we, i.RENDERBUFFER, I));
    } else {
      const K = b.textures;
      for (let ie = 0; ie < K.length; ie++) {
        const Ce = K[ie],
          we = s.convert(Ce.format, Ce.colorSpace),
          ae = s.convert(Ce.type),
          ce = E(Ce.internalFormat, we, ae, Ce.normalized, Ce.colorSpace);
        te(b)
          ? o.renderbufferStorageMultisampleEXT(
              i.RENDERBUFFER,
              At(b),
              ce,
              b.width,
              b.height,
            )
          : q
            ? i.renderbufferStorageMultisample(
                i.RENDERBUFFER,
                At(b),
                ce,
                b.width,
                b.height,
              )
            : i.renderbufferStorage(i.RENDERBUFFER, ce, b.width, b.height);
      }
    }
    i.bindRenderbuffer(i.RENDERBUFFER, null);
  }
  function st(I, b, q) {
    const K = b.isWebGLCubeRenderTarget === !0;
    if (
      (t.bindFramebuffer(i.FRAMEBUFFER, I),
      !(b.depthTexture && b.depthTexture.isDepthTexture))
    )
      throw new Error(
        "THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.",
      );
    const ie = n.get(b.depthTexture);
    if (
      ((ie.__renderTarget = b),
      (!ie.__webglTexture ||
        b.depthTexture.image.width !== b.width ||
        b.depthTexture.image.height !== b.height) &&
        ((b.depthTexture.image.width = b.width),
        (b.depthTexture.image.height = b.height),
        (b.depthTexture.needsUpdate = !0)),
      K)
    ) {
      if (
        (ie.__webglInit === void 0 &&
          ((ie.__webglInit = !0),
          b.depthTexture.addEventListener("dispose", k)),
        ie.__webglTexture === void 0)
      ) {
        ((ie.__webglTexture = i.createTexture()),
          t.bindTexture(i.TEXTURE_CUBE_MAP, ie.__webglTexture),
          ct(i.TEXTURE_CUBE_MAP, b.depthTexture));
        const Pe = s.convert(b.depthTexture.format),
          ze = s.convert(b.depthTexture.type);
        let Fe;
        b.depthTexture.format === Hr
          ? (Fe = i.DEPTH_COMPONENT24)
          : b.depthTexture.format === Ii && (Fe = i.DEPTH24_STENCIL8);
        for (let ke = 0; ke < 6; ke++)
          i.texImage2D(
            i.TEXTURE_CUBE_MAP_POSITIVE_X + ke,
            0,
            Fe,
            b.width,
            b.height,
            0,
            Pe,
            ze,
            null,
          );
      }
    } else ne(b.depthTexture, 0);
    const Ce = ie.__webglTexture,
      we = At(b),
      ae = K ? i.TEXTURE_CUBE_MAP_POSITIVE_X + q : i.TEXTURE_2D,
      ce =
        b.depthTexture.format === Ii
          ? i.DEPTH_STENCIL_ATTACHMENT
          : i.DEPTH_ATTACHMENT;
    if (b.depthTexture.format === Hr)
      te(b)
        ? o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER, ce, ae, Ce, 0, we)
        : i.framebufferTexture2D(i.FRAMEBUFFER, ce, ae, Ce, 0);
    else if (b.depthTexture.format === Ii)
      te(b)
        ? o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER, ce, ae, Ce, 0, we)
        : i.framebufferTexture2D(i.FRAMEBUFFER, ce, ae, Ce, 0);
    else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.");
  }
  function ue(I) {
    const b = n.get(I),
      q = I.isWebGLCubeRenderTarget === !0;
    if (b.__boundDepthTexture !== I.depthTexture) {
      const K = I.depthTexture;
      if ((b.__depthDisposeCallback && b.__depthDisposeCallback(), K)) {
        const ie = () => {
          (delete b.__boundDepthTexture,
            delete b.__depthDisposeCallback,
            K.removeEventListener("dispose", ie));
        };
        (K.addEventListener("dispose", ie), (b.__depthDisposeCallback = ie));
      }
      b.__boundDepthTexture = K;
    }
    if (I.depthTexture && !b.__autoAllocateDepthBuffer)
      if (q) for (let K = 0; K < 6; K++) st(b.__webglFramebuffer[K], I, K);
      else {
        const K = I.texture.mipmaps;
        K && K.length > 0
          ? st(b.__webglFramebuffer[0], I, 0)
          : st(b.__webglFramebuffer, I, 0);
      }
    else if (q) {
      b.__webglDepthbuffer = [];
      for (let K = 0; K < 6; K++)
        if (
          (t.bindFramebuffer(i.FRAMEBUFFER, b.__webglFramebuffer[K]),
          b.__webglDepthbuffer[K] === void 0)
        )
          ((b.__webglDepthbuffer[K] = i.createRenderbuffer()),
            ft(b.__webglDepthbuffer[K], I, !1));
        else {
          const ie = I.stencilBuffer
              ? i.DEPTH_STENCIL_ATTACHMENT
              : i.DEPTH_ATTACHMENT,
            Ce = b.__webglDepthbuffer[K];
          (i.bindRenderbuffer(i.RENDERBUFFER, Ce),
            i.framebufferRenderbuffer(i.FRAMEBUFFER, ie, i.RENDERBUFFER, Ce));
        }
    } else {
      const K = I.texture.mipmaps;
      if (
        (K && K.length > 0
          ? t.bindFramebuffer(i.FRAMEBUFFER, b.__webglFramebuffer[0])
          : t.bindFramebuffer(i.FRAMEBUFFER, b.__webglFramebuffer),
        b.__webglDepthbuffer === void 0)
      )
        ((b.__webglDepthbuffer = i.createRenderbuffer()),
          ft(b.__webglDepthbuffer, I, !1));
      else {
        const ie = I.stencilBuffer
            ? i.DEPTH_STENCIL_ATTACHMENT
            : i.DEPTH_ATTACHMENT,
          Ce = b.__webglDepthbuffer;
        (i.bindRenderbuffer(i.RENDERBUFFER, Ce),
          i.framebufferRenderbuffer(i.FRAMEBUFFER, ie, i.RENDERBUFFER, Ce));
      }
    }
    t.bindFramebuffer(i.FRAMEBUFFER, null);
  }
  function _e(I, b, q) {
    const K = n.get(I);
    (b !== void 0 &&
      We(
        K.__webglFramebuffer,
        I,
        I.texture,
        i.COLOR_ATTACHMENT0,
        i.TEXTURE_2D,
        0,
      ),
      q !== void 0 && ue(I));
  }
  function ve(I) {
    const b = I.texture,
      q = n.get(I),
      K = n.get(b);
    I.addEventListener("dispose", x);
    const ie = I.textures,
      Ce = I.isWebGLCubeRenderTarget === !0,
      we = ie.length > 1;
    if (
      (we ||
        (K.__webglTexture === void 0 && (K.__webglTexture = i.createTexture()),
        (K.__version = b.version),
        a.memory.textures++),
      Ce)
    ) {
      q.__webglFramebuffer = [];
      for (let ae = 0; ae < 6; ae++)
        if (b.mipmaps && b.mipmaps.length > 0) {
          q.__webglFramebuffer[ae] = [];
          for (let ce = 0; ce < b.mipmaps.length; ce++)
            q.__webglFramebuffer[ae][ce] = i.createFramebuffer();
        } else q.__webglFramebuffer[ae] = i.createFramebuffer();
    } else {
      if (b.mipmaps && b.mipmaps.length > 0) {
        q.__webglFramebuffer = [];
        for (let ae = 0; ae < b.mipmaps.length; ae++)
          q.__webglFramebuffer[ae] = i.createFramebuffer();
      } else q.__webglFramebuffer = i.createFramebuffer();
      if (we)
        for (let ae = 0, ce = ie.length; ae < ce; ae++) {
          const Pe = n.get(ie[ae]);
          Pe.__webglTexture === void 0 &&
            ((Pe.__webglTexture = i.createTexture()), a.memory.textures++);
        }
      if (I.samples > 0 && te(I) === !1) {
        ((q.__webglMultisampledFramebuffer = i.createFramebuffer()),
          (q.__webglColorRenderbuffer = []),
          t.bindFramebuffer(i.FRAMEBUFFER, q.__webglMultisampledFramebuffer));
        for (let ae = 0; ae < ie.length; ae++) {
          const ce = ie[ae];
          ((q.__webglColorRenderbuffer[ae] = i.createRenderbuffer()),
            i.bindRenderbuffer(i.RENDERBUFFER, q.__webglColorRenderbuffer[ae]));
          const Pe = s.convert(ce.format, ce.colorSpace),
            ze = s.convert(ce.type),
            Fe = E(
              ce.internalFormat,
              Pe,
              ze,
              ce.normalized,
              ce.colorSpace,
              I.isXRRenderTarget === !0,
            ),
            ke = At(I);
          (i.renderbufferStorageMultisample(
            i.RENDERBUFFER,
            ke,
            Fe,
            I.width,
            I.height,
          ),
            i.framebufferRenderbuffer(
              i.FRAMEBUFFER,
              i.COLOR_ATTACHMENT0 + ae,
              i.RENDERBUFFER,
              q.__webglColorRenderbuffer[ae],
            ));
        }
        (i.bindRenderbuffer(i.RENDERBUFFER, null),
          I.depthBuffer &&
            ((q.__webglDepthRenderbuffer = i.createRenderbuffer()),
            ft(q.__webglDepthRenderbuffer, I, !0)),
          t.bindFramebuffer(i.FRAMEBUFFER, null));
      }
    }
    if (Ce) {
      (t.bindTexture(i.TEXTURE_CUBE_MAP, K.__webglTexture),
        ct(i.TEXTURE_CUBE_MAP, b));
      for (let ae = 0; ae < 6; ae++)
        if (b.mipmaps && b.mipmaps.length > 0)
          for (let ce = 0; ce < b.mipmaps.length; ce++)
            We(
              q.__webglFramebuffer[ae][ce],
              I,
              b,
              i.COLOR_ATTACHMENT0,
              i.TEXTURE_CUBE_MAP_POSITIVE_X + ae,
              ce,
            );
        else
          We(
            q.__webglFramebuffer[ae],
            I,
            b,
            i.COLOR_ATTACHMENT0,
            i.TEXTURE_CUBE_MAP_POSITIVE_X + ae,
            0,
          );
      (m(b) && y(i.TEXTURE_CUBE_MAP), t.unbindTexture());
    } else if (we) {
      for (let ae = 0, ce = ie.length; ae < ce; ae++) {
        const Pe = ie[ae],
          ze = n.get(Pe);
        let Fe = i.TEXTURE_2D;
        ((I.isWebGL3DRenderTarget || I.isWebGLArrayRenderTarget) &&
          (Fe = I.isWebGL3DRenderTarget ? i.TEXTURE_3D : i.TEXTURE_2D_ARRAY),
          t.bindTexture(Fe, ze.__webglTexture),
          ct(Fe, Pe),
          We(q.__webglFramebuffer, I, Pe, i.COLOR_ATTACHMENT0 + ae, Fe, 0),
          m(Pe) && y(Fe));
      }
      t.unbindTexture();
    } else {
      let ae = i.TEXTURE_2D;
      if (
        ((I.isWebGL3DRenderTarget || I.isWebGLArrayRenderTarget) &&
          (ae = I.isWebGL3DRenderTarget ? i.TEXTURE_3D : i.TEXTURE_2D_ARRAY),
        t.bindTexture(ae, K.__webglTexture),
        ct(ae, b),
        b.mipmaps && b.mipmaps.length > 0)
      )
        for (let ce = 0; ce < b.mipmaps.length; ce++)
          We(q.__webglFramebuffer[ce], I, b, i.COLOR_ATTACHMENT0, ae, ce);
      else We(q.__webglFramebuffer, I, b, i.COLOR_ATTACHMENT0, ae, 0);
      (m(b) && y(ae), t.unbindTexture());
    }
    I.depthBuffer && ue(I);
  }
  function Me(I) {
    const b = I.textures;
    for (let q = 0, K = b.length; q < K; q++) {
      const ie = b[q];
      if (m(ie)) {
        const Ce = C(I),
          we = n.get(ie).__webglTexture;
        (t.bindTexture(Ce, we), y(Ce), t.unbindTexture());
      }
    }
  }
  const Be = [],
    Ze = [];
  function He(I) {
    if (I.samples > 0) {
      if (te(I) === !1) {
        const b = I.textures,
          q = I.width,
          K = I.height;
        let ie = i.COLOR_BUFFER_BIT;
        const Ce = I.stencilBuffer
            ? i.DEPTH_STENCIL_ATTACHMENT
            : i.DEPTH_ATTACHMENT,
          we = n.get(I),
          ae = b.length > 1;
        if (ae)
          for (let Pe = 0; Pe < b.length; Pe++)
            (t.bindFramebuffer(
              i.FRAMEBUFFER,
              we.__webglMultisampledFramebuffer,
            ),
              i.framebufferRenderbuffer(
                i.FRAMEBUFFER,
                i.COLOR_ATTACHMENT0 + Pe,
                i.RENDERBUFFER,
                null,
              ),
              t.bindFramebuffer(i.FRAMEBUFFER, we.__webglFramebuffer),
              i.framebufferTexture2D(
                i.DRAW_FRAMEBUFFER,
                i.COLOR_ATTACHMENT0 + Pe,
                i.TEXTURE_2D,
                null,
                0,
              ));
        t.bindFramebuffer(
          i.READ_FRAMEBUFFER,
          we.__webglMultisampledFramebuffer,
        );
        const ce = I.texture.mipmaps;
        ce && ce.length > 0
          ? t.bindFramebuffer(i.DRAW_FRAMEBUFFER, we.__webglFramebuffer[0])
          : t.bindFramebuffer(i.DRAW_FRAMEBUFFER, we.__webglFramebuffer);
        for (let Pe = 0; Pe < b.length; Pe++) {
          if (
            (I.resolveDepthBuffer &&
              (I.depthBuffer && (ie |= i.DEPTH_BUFFER_BIT),
              I.stencilBuffer &&
                I.resolveStencilBuffer &&
                (ie |= i.STENCIL_BUFFER_BIT)),
            ae)
          ) {
            i.framebufferRenderbuffer(
              i.READ_FRAMEBUFFER,
              i.COLOR_ATTACHMENT0,
              i.RENDERBUFFER,
              we.__webglColorRenderbuffer[Pe],
            );
            const ze = n.get(b[Pe]).__webglTexture;
            i.framebufferTexture2D(
              i.DRAW_FRAMEBUFFER,
              i.COLOR_ATTACHMENT0,
              i.TEXTURE_2D,
              ze,
              0,
            );
          }
          (i.blitFramebuffer(0, 0, q, K, 0, 0, q, K, ie, i.NEAREST),
            A === !0 &&
              ((Be.length = 0),
              (Ze.length = 0),
              Be.push(i.COLOR_ATTACHMENT0 + Pe),
              I.depthBuffer &&
                I.resolveDepthBuffer === !1 &&
                (Be.push(Ce),
                Ze.push(Ce),
                i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER, Ze)),
              i.invalidateFramebuffer(i.READ_FRAMEBUFFER, Be)));
        }
        if (
          (t.bindFramebuffer(i.READ_FRAMEBUFFER, null),
          t.bindFramebuffer(i.DRAW_FRAMEBUFFER, null),
          ae)
        )
          for (let Pe = 0; Pe < b.length; Pe++) {
            (t.bindFramebuffer(
              i.FRAMEBUFFER,
              we.__webglMultisampledFramebuffer,
            ),
              i.framebufferRenderbuffer(
                i.FRAMEBUFFER,
                i.COLOR_ATTACHMENT0 + Pe,
                i.RENDERBUFFER,
                we.__webglColorRenderbuffer[Pe],
              ));
            const ze = n.get(b[Pe]).__webglTexture;
            (t.bindFramebuffer(i.FRAMEBUFFER, we.__webglFramebuffer),
              i.framebufferTexture2D(
                i.DRAW_FRAMEBUFFER,
                i.COLOR_ATTACHMENT0 + Pe,
                i.TEXTURE_2D,
                ze,
                0,
              ));
          }
        t.bindFramebuffer(
          i.DRAW_FRAMEBUFFER,
          we.__webglMultisampledFramebuffer,
        );
      } else if (I.depthBuffer && I.resolveDepthBuffer === !1 && A) {
        const b = I.stencilBuffer
          ? i.DEPTH_STENCIL_ATTACHMENT
          : i.DEPTH_ATTACHMENT;
        i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER, [b]);
      }
    }
  }
  function At(I) {
    return Math.min(r.maxSamples, I.samples);
  }
  function te(I) {
    const b = n.get(I);
    return (
      I.samples > 0 &&
      e.has("WEBGL_multisampled_render_to_texture") === !0 &&
      b.__useRenderToTexture !== !1
    );
  }
  function G(I) {
    const b = a.render.frame;
    c.get(I) !== b && (c.set(I, b), I.update());
  }
  function Ge(I, b) {
    const q = I.colorSpace,
      K = I.format,
      ie = I.type;
    return (
      I.isCompressedTexture === !0 ||
        I.isVideoTexture === !0 ||
        (q !== kn &&
          q !== si &&
          (bt.getTransfer(q) === kt
            ? (K !== Hn || ie !== Mn) &&
              it(
                "WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType.",
              )
            : ut("WebGLTextures: Unsupported texture color space:", q))),
      b
    );
  }
  function $e(I) {
    return (
      typeof HTMLImageElement < "u" && I instanceof HTMLImageElement
        ? ((l.width = I.naturalWidth || I.width),
          (l.height = I.naturalHeight || I.height))
        : typeof VideoFrame < "u" && I instanceof VideoFrame
          ? ((l.width = I.displayWidth), (l.height = I.displayHeight))
          : ((l.width = I.width), (l.height = I.height)),
      l
    );
  }
  ((this.allocateTextureUnit = V),
    (this.resetTextureUnits = X),
    (this.getTextureUnits = Y),
    (this.setTextureUnits = H),
    (this.setTexture2D = ne),
    (this.setTexture2DArray = le),
    (this.setTexture3D = je),
    (this.setTextureCube = de),
    (this.rebindTextures = _e),
    (this.setupRenderTarget = ve),
    (this.updateRenderTargetMipmap = Me),
    (this.updateMultisampleRenderTarget = He),
    (this.setupDepthRenderbuffer = ue),
    (this.setupFrameBufferTexture = We),
    (this.useMultisampledRTT = te),
    (this.isReversedDepthBuffer = function () {
      return t.buffers.depth.getReversed();
    }));
}

function Qx(i, e) {
  function t(n, r = si) {
    let s;
    const a = bt.getTransfer(r);
    if (n === Mn) return i.UNSIGNED_BYTE;
    if (n === dd) return i.UNSIGNED_SHORT_4_4_4_4;
    if (n === ud) return i.UNSIGNED_SHORT_5_5_5_1;
    if (n === _m) return i.UNSIGNED_INT_5_9_9_9_REV;
    if (n === Em) return i.UNSIGNED_INT_10F_11F_11F_REV;
    if (n === vm) return i.BYTE;
    if (n === jm) return i.SHORT;
    if (n === Ga) return i.UNSIGNED_SHORT;
    if (n === hd) return i.INT;
    if (n === Er) return i.UNSIGNED_INT;
    if (n === On) return i.FLOAT;
    if (n === er) return i.HALF_FLOAT;
    if (n === ym) return i.ALPHA;
    if (n === xm) return i.RGB;
    if (n === Hn) return i.RGBA;
    if (n === Hr) return i.DEPTH_COMPONENT;
    if (n === Ii) return i.DEPTH_STENCIL;
    if (n === QA) return i.RED;
    if (n === fd) return i.RED_INTEGER;
    if (n === qi) return i.RG;
    if (n === pd) return i.RG_INTEGER;
    if (n === md) return i.RGBA_INTEGER;
    if (n === pA || n === mA || n === gA || n === vA)
      if (a === kt)
        if (((s = e.get("WEBGL_compressed_texture_s3tc_srgb")), s !== null)) {
          if (n === pA) return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;
          if (n === mA) return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;
          if (n === gA) return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;
          if (n === vA) return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT;
        } else return null;
      else if (((s = e.get("WEBGL_compressed_texture_s3tc")), s !== null)) {
        if (n === pA) return s.COMPRESSED_RGB_S3TC_DXT1_EXT;
        if (n === mA) return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;
        if (n === gA) return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;
        if (n === vA) return s.COMPRESSED_RGBA_S3TC_DXT5_EXT;
      } else return null;
    if (n === Jc || n === Kc || n === Yc || n === Zc)
      if (((s = e.get("WEBGL_compressed_texture_pvrtc")), s !== null)) {
        if (n === Jc) return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;
        if (n === Kc) return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;
        if (n === Yc) return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;
        if (n === Zc) return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG;
      } else return null;
    if (
      n === Qc ||
      n === eh ||
      n === th ||
      n === nh ||
      n === rh ||
      n === kA ||
      n === ih
    )
      if (((s = e.get("WEBGL_compressed_texture_etc")), s !== null)) {
        if (n === Qc || n === eh)
          return a === kt ? s.COMPRESSED_SRGB8_ETC2 : s.COMPRESSED_RGB8_ETC2;
        if (n === th)
          return a === kt
            ? s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC
            : s.COMPRESSED_RGBA8_ETC2_EAC;
        if (n === nh) return s.COMPRESSED_R11_EAC;
        if (n === rh) return s.COMPRESSED_SIGNED_R11_EAC;
        if (n === kA) return s.COMPRESSED_RG11_EAC;
        if (n === ih) return s.COMPRESSED_SIGNED_RG11_EAC;
      } else return null;
    if (
      n === sh ||
      n === ah ||
      n === oh ||
      n === Ah ||
      n === lh ||
      n === ch ||
      n === hh ||
      n === dh ||
      n === uh ||
      n === fh ||
      n === ph ||
      n === mh ||
      n === gh ||
      n === vh
    )
      if (((s = e.get("WEBGL_compressed_texture_astc")), s !== null)) {
        if (n === sh)
          return a === kt
            ? s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR
            : s.COMPRESSED_RGBA_ASTC_4x4_KHR;
        if (n === ah)
          return a === kt
            ? s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR
            : s.COMPRESSED_RGBA_ASTC_5x4_KHR;
        if (n === oh)
          return a === kt
            ? s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR
            : s.COMPRESSED_RGBA_ASTC_5x5_KHR;
        if (n === Ah)
          return a === kt
            ? s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR
            : s.COMPRESSED_RGBA_ASTC_6x5_KHR;
        if (n === lh)
          return a === kt
            ? s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR
            : s.COMPRESSED_RGBA_ASTC_6x6_KHR;
        if (n === ch)
          return a === kt
            ? s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR
            : s.COMPRESSED_RGBA_ASTC_8x5_KHR;
        if (n === hh)
          return a === kt
            ? s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR
            : s.COMPRESSED_RGBA_ASTC_8x6_KHR;
        if (n === dh)
          return a === kt
            ? s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR
            : s.COMPRESSED_RGBA_ASTC_8x8_KHR;
        if (n === uh)
          return a === kt
            ? s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR
            : s.COMPRESSED_RGBA_ASTC_10x5_KHR;
        if (n === fh)
          return a === kt
            ? s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR
            : s.COMPRESSED_RGBA_ASTC_10x6_KHR;
        if (n === ph)
          return a === kt
            ? s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR
            : s.COMPRESSED_RGBA_ASTC_10x8_KHR;
        if (n === mh)
          return a === kt
            ? s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR
            : s.COMPRESSED_RGBA_ASTC_10x10_KHR;
        if (n === gh)
          return a === kt
            ? s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR
            : s.COMPRESSED_RGBA_ASTC_12x10_KHR;
        if (n === vh)
          return a === kt
            ? s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR
            : s.COMPRESSED_RGBA_ASTC_12x12_KHR;
      } else return null;
    if (n === jh || n === _h || n === Eh)
      if (((s = e.get("EXT_texture_compression_bptc")), s !== null)) {
        if (n === jh)
          return a === kt
            ? s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT
            : s.COMPRESSED_RGBA_BPTC_UNORM_EXT;
        if (n === _h) return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;
        if (n === Eh) return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT;
      } else return null;
    if (n === yh || n === xh || n === TA || n === Ch)
      if (((s = e.get("EXT_texture_compression_rgtc")), s !== null)) {
        if (n === yh) return s.COMPRESSED_RED_RGTC1_EXT;
        if (n === xh) return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;
        if (n === TA) return s.COMPRESSED_RED_GREEN_RGTC2_EXT;
        if (n === Ch) return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT;
      } else return null;
    return n === Oa ? i.UNSIGNED_INT_24_8 : i[n] !== void 0 ? i[n] : null;
  }
  return { convert: t };
}

const eC = `
void main() {

	gl_Position = vec4( position, 1.0 );

}`;

const tC = `
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;

class nC {
  constructor() {
    ((this.texture = null),
      (this.mesh = null),
      (this.depthNear = 0),
      (this.depthFar = 0));
  }
  init(e, t) {
    if (this.texture === null) {
      const n = new Dm(e.texture);
      ((e.depthNear !== t.depthNear || e.depthFar !== t.depthFar) &&
        ((this.depthNear = e.depthNear), (this.depthFar = e.depthFar)),
        (this.texture = n));
    }
  }
  getMesh(e) {
    if (this.texture !== null && this.mesh === null) {
      const t = e.cameras[0].viewport,
        n = new Lt({
          vertexShader: eC,
          fragmentShader: tC,
          uniforms: {
            depthColor: { value: this.texture },
            depthWidth: { value: t.z },
            depthHeight: { value: t.w },
          },
        });
      this.mesh = new Ee(new ui(20, 20), n);
    }
    return this.mesh;
  }
  reset() {
    ((this.texture = null), (this.mesh = null));
  }
  getDepthTexture() {
    return this.texture;
  }
}

class rC extends Wi {
  constructor(e, t) {
    super();
    const n = this;
    let r = null,
      s = 1,
      a = null,
      o = "local-floor",
      A = 1,
      l = null,
      c = null,
      h = null,
      d = null,
      u = null,
      p = null;
    const v = typeof XRWebGLBinding < "u",
      g = new nC(),
      m = {},
      y = t.getContextAttributes();
    let C = null,
      E = null;
    const w = [],
      S = [],
      k = new Ae();
    let x = null;
    const T = new fn();
    T.viewport = new Pt();
    const R = new fn();
    R.viewport = new Pt();
    const D = [T, R],
      N = new n6();
    let X = null,
      Y = null;
    ((this.cameraAutoUpdate = !0),
      (this.enabled = !1),
      (this.isPresenting = !1),
      (this.getController = function (oe) {
        let xe = w[oe];
        return (
          xe === void 0 && ((xe = new Ml()), (w[oe] = xe)),
          xe.getTargetRaySpace()
        );
      }),
      (this.getControllerGrip = function (oe) {
        let xe = w[oe];
        return (
          xe === void 0 && ((xe = new Ml()), (w[oe] = xe)),
          xe.getGripSpace()
        );
      }),
      (this.getHand = function (oe) {
        let xe = w[oe];
        return (
          xe === void 0 && ((xe = new Ml()), (w[oe] = xe)),
          xe.getHandSpace()
        );
      }));
    function H(oe) {
      const xe = S.indexOf(oe.inputSource);
      if (xe === -1) return;
      const ge = w[xe];
      ge !== void 0 &&
        (ge.update(oe.inputSource, oe.frame, l || a),
        ge.dispatchEvent({ type: oe.type, data: oe.inputSource }));
    }
    function V() {
      (r.removeEventListener("select", H),
        r.removeEventListener("selectstart", H),
        r.removeEventListener("selectend", H),
        r.removeEventListener("squeeze", H),
        r.removeEventListener("squeezestart", H),
        r.removeEventListener("squeezeend", H),
        r.removeEventListener("end", V),
        r.removeEventListener("inputsourceschange", J));
      for (let oe = 0; oe < w.length; oe++) {
        const xe = S[oe];
        xe !== null && ((S[oe] = null), w[oe].disconnect(xe));
      }
      ((X = null), (Y = null), g.reset());
      for (const oe in m) delete m[oe];
      (e.setRenderTarget(C),
        (u = null),
        (d = null),
        (h = null),
        (r = null),
        (E = null),
        ct.stop(),
        (n.isPresenting = !1),
        e.setPixelRatio(x),
        e.setSize(k.width, k.height, !1),
        n.dispatchEvent({ type: "sessionend" }));
    }
    ((this.setFramebufferScaleFactor = function (oe) {
      ((s = oe),
        n.isPresenting === !0 &&
          it(
            "WebXRManager: Cannot change framebuffer scale while presenting.",
          ));
    }),
      (this.setReferenceSpaceType = function (oe) {
        ((o = oe),
          n.isPresenting === !0 &&
            it(
              "WebXRManager: Cannot change reference space type while presenting.",
            ));
      }),
      (this.getReferenceSpace = function () {
        return l || a;
      }),
      (this.setReferenceSpace = function (oe) {
        l = oe;
      }),
      (this.getBaseLayer = function () {
        return d !== null ? d : u;
      }),
      (this.getBinding = function () {
        return (h === null && v && (h = new XRWebGLBinding(r, t)), h);
      }),
      (this.getFrame = function () {
        return p;
      }),
      (this.getSession = function () {
        return r;
      }),
      (this.setSession = async function (oe) {
        if (((r = oe), r !== null)) {
          if (
            ((C = e.getRenderTarget()),
            r.addEventListener("select", H),
            r.addEventListener("selectstart", H),
            r.addEventListener("selectend", H),
            r.addEventListener("squeeze", H),
            r.addEventListener("squeezestart", H),
            r.addEventListener("squeezeend", H),
            r.addEventListener("end", V),
            r.addEventListener("inputsourceschange", J),
            y.xrCompatible !== !0 && (await t.makeXRCompatible()),
            (x = e.getPixelRatio()),
            e.getSize(k),
            v && "createProjectionLayer" in XRWebGLBinding.prototype)
          ) {
            let ge = null,
              qe = null,
              Xe = null;
            y.depth &&
              ((Xe = y.stencil ? t.DEPTH24_STENCIL8 : t.DEPTH_COMPONENT24),
              (ge = y.stencil ? Ii : Hr),
              (qe = y.stencil ? Oa : Er));
            const We = {
              colorFormat: t.RGBA8,
              depthFormat: Xe,
              scaleFactor: s,
            };
            ((h = this.getBinding()),
              (d = h.createProjectionLayer(We)),
              r.updateRenderState({ layers: [d] }),
              e.setPixelRatio(1),
              e.setSize(d.textureWidth, d.textureHeight, !1),
              (E = new qn(d.textureWidth, d.textureHeight, {
                format: Hn,
                type: Mn,
                depthTexture: new Gs(
                  d.textureWidth,
                  d.textureHeight,
                  qe,
                  void 0,
                  void 0,
                  void 0,
                  void 0,
                  void 0,
                  void 0,
                  ge,
                ),
                stencilBuffer: y.stencil,
                colorSpace: e.outputColorSpace,
                samples: y.antialias ? 4 : 0,
                resolveDepthBuffer: d.ignoreDepthValues === !1,
                resolveStencilBuffer: d.ignoreDepthValues === !1,
              })));
          } else {
            const ge = {
              antialias: y.antialias,
              alpha: !0,
              depth: y.depth,
              stencil: y.stencil,
              framebufferScaleFactor: s,
            };
            ((u = new XRWebGLLayer(r, t, ge)),
              r.updateRenderState({ baseLayer: u }),
              e.setPixelRatio(1),
              e.setSize(u.framebufferWidth, u.framebufferHeight, !1),
              (E = new qn(u.framebufferWidth, u.framebufferHeight, {
                format: Hn,
                type: Mn,
                colorSpace: e.outputColorSpace,
                stencilBuffer: y.stencil,
                resolveDepthBuffer: u.ignoreDepthValues === !1,
                resolveStencilBuffer: u.ignoreDepthValues === !1,
              })));
          }
          ((E.isXRRenderTarget = !0),
            this.setFoveation(A),
            (l = null),
            (a = await r.requestReferenceSpace(o)),
            ct.setContext(r),
            ct.start(),
            (n.isPresenting = !0),
            n.dispatchEvent({ type: "sessionstart" }));
        }
      }),
      (this.getEnvironmentBlendMode = function () {
        if (r !== null) return r.environmentBlendMode;
      }),
      (this.getDepthTexture = function () {
        return g.getDepthTexture();
      }));
    function J(oe) {
      for (let xe = 0; xe < oe.removed.length; xe++) {
        const ge = oe.removed[xe],
          qe = S.indexOf(ge);
        qe >= 0 && ((S[qe] = null), w[qe].disconnect(ge));
      }
      for (let xe = 0; xe < oe.added.length; xe++) {
        const ge = oe.added[xe];
        let qe = S.indexOf(ge);
        if (qe === -1) {
          for (let We = 0; We < w.length; We++)
            if (We >= S.length) {
              (S.push(ge), (qe = We));
              break;
            } else if (S[We] === null) {
              ((S[We] = ge), (qe = We));
              break;
            }
          if (qe === -1) break;
        }
        const Xe = w[qe];
        Xe && Xe.connect(ge);
      }
    }
    const ne = new F(),
      le = new F();
    function je(oe, xe, ge) {
      (ne.setFromMatrixPosition(xe.matrixWorld),
        le.setFromMatrixPosition(ge.matrixWorld));
      const qe = ne.distanceTo(le),
        Xe = xe.projectionMatrix.elements,
        We = ge.projectionMatrix.elements,
        ft = Xe[14] / (Xe[10] - 1),
        st = Xe[14] / (Xe[10] + 1),
        ue = (Xe[9] + 1) / Xe[5],
        _e = (Xe[9] - 1) / Xe[5],
        ve = (Xe[8] - 1) / Xe[0],
        Me = (We[8] + 1) / We[0],
        Be = ft * ve,
        Ze = ft * Me,
        He = qe / (-ve + Me),
        At = He * -ve;
      if (
        (xe.matrixWorld.decompose(oe.position, oe.quaternion, oe.scale),
        oe.translateX(At),
        oe.translateZ(He),
        oe.matrixWorld.compose(oe.position, oe.quaternion, oe.scale),
        oe.matrixWorldInverse.copy(oe.matrixWorld).invert(),
        Xe[10] === -1)
      )
        (oe.projectionMatrix.copy(xe.projectionMatrix),
          oe.projectionMatrixInverse.copy(xe.projectionMatrixInverse));
      else {
        const te = ft + He,
          G = st + He,
          Ge = Be - At,
          $e = Ze + (qe - At),
          I = ((ue * st) / G) * te,
          b = ((_e * st) / G) * te;
        (oe.projectionMatrix.makePerspective(Ge, $e, I, b, te, G),
          oe.projectionMatrixInverse.copy(oe.projectionMatrix).invert());
      }
    }
    function de(oe, xe) {
      (xe === null
        ? oe.matrixWorld.copy(oe.matrix)
        : oe.matrixWorld.multiplyMatrices(xe.matrixWorld, oe.matrix),
        oe.matrixWorldInverse.copy(oe.matrixWorld).invert());
    }
    this.updateCamera = function (oe) {
      if (r === null) return;
      let xe = oe.near,
        ge = oe.far;
      (g.texture !== null &&
        (g.depthNear > 0 && (xe = g.depthNear),
        g.depthFar > 0 && (ge = g.depthFar)),
        (N.near = R.near = T.near = xe),
        (N.far = R.far = T.far = ge),
        (X !== N.near || Y !== N.far) &&
          (r.updateRenderState({ depthNear: N.near, depthFar: N.far }),
          (X = N.near),
          (Y = N.far)),
        (N.layers.mask = oe.layers.mask | 6),
        (T.layers.mask = N.layers.mask & -5),
        (R.layers.mask = N.layers.mask & -3));
      const qe = oe.parent,
        Xe = N.cameras;
      de(N, qe);
      for (let We = 0; We < Xe.length; We++) de(Xe[We], qe);
      (Xe.length === 2
        ? je(N, T, R)
        : N.projectionMatrix.copy(T.projectionMatrix),
        pe(oe, N, qe));
    };
    function pe(oe, xe, ge) {
      (ge === null
        ? oe.matrix.copy(xe.matrixWorld)
        : (oe.matrix.copy(ge.matrixWorld),
          oe.matrix.invert(),
          oe.matrix.multiply(xe.matrixWorld)),
        oe.matrix.decompose(oe.position, oe.quaternion, oe.scale),
        oe.updateMatrixWorld(!0),
        oe.projectionMatrix.copy(xe.projectionMatrix),
        oe.projectionMatrixInverse.copy(xe.projectionMatrixInverse),
        oe.isPerspectiveCamera &&
          ((oe.fov = Ns * 2 * Math.atan(1 / oe.projectionMatrix.elements[5])),
          (oe.zoom = 1)));
    }
    ((this.getCamera = function () {
      return N;
    }),
      (this.getFoveation = function () {
        if (!(d === null && u === null)) return A;
      }),
      (this.setFoveation = function (oe) {
        ((A = oe),
          d !== null && (d.fixedFoveation = oe),
          u !== null && u.fixedFoveation !== void 0 && (u.fixedFoveation = oe));
      }),
      (this.hasDepthSensing = function () {
        return g.texture !== null;
      }),
      (this.getDepthSensingMesh = function () {
        return g.getMesh(N);
      }),
      (this.getCameraTexture = function (oe) {
        return m[oe];
      }));
    let Se = null;
    function gt(oe, xe) {
      if (((c = xe.getViewerPose(l || a)), (p = xe), c !== null)) {
        const ge = c.views;
        u !== null &&
          (e.setRenderTargetFramebuffer(E, u.framebuffer),
          e.setRenderTarget(E));
        let qe = !1;
        ge.length !== N.cameras.length && ((N.cameras.length = 0), (qe = !0));
        for (let st = 0; st < ge.length; st++) {
          const ue = ge[st];
          let _e = null;
          if (u !== null) _e = u.getViewport(ue);
          else {
            const Me = h.getViewSubImage(d, ue);
            ((_e = Me.viewport),
              st === 0 &&
                (e.setRenderTargetTextures(
                  E,
                  Me.colorTexture,
                  Me.depthStencilTexture,
                ),
                e.setRenderTarget(E)));
          }
          let ve = D[st];
          (ve === void 0 &&
            ((ve = new fn()),
            ve.layers.enable(st),
            (ve.viewport = new Pt()),
            (D[st] = ve)),
            ve.matrix.fromArray(ue.transform.matrix),
            ve.matrix.decompose(ve.position, ve.quaternion, ve.scale),
            ve.projectionMatrix.fromArray(ue.projectionMatrix),
            ve.projectionMatrixInverse.copy(ve.projectionMatrix).invert(),
            ve.viewport.set(_e.x, _e.y, _e.width, _e.height),
            st === 0 &&
              (N.matrix.copy(ve.matrix),
              N.matrix.decompose(N.position, N.quaternion, N.scale)),
            qe === !0 && N.cameras.push(ve));
        }
        const Xe = r.enabledFeatures;
        if (
          Xe &&
          Xe.includes("depth-sensing") &&
          r.depthUsage == "gpu-optimized" &&
          v
        ) {
          h = n.getBinding();
          const st = h.getDepthInformation(ge[0]);
          st && st.isValid && st.texture && g.init(st, r.renderState);
        }
        if (Xe && Xe.includes("camera-access") && v) {
          (e.state.unbindTexture(), (h = n.getBinding()));
          for (let st = 0; st < ge.length; st++) {
            const ue = ge[st].camera;
            if (ue) {
              let _e = m[ue];
              _e || ((_e = new Dm()), (m[ue] = _e));
              const ve = h.getCameraImage(ue);
              _e.sourceTexture = ve;
            }
          }
        }
      }
      for (let ge = 0; ge < w.length; ge++) {
        const qe = S[ge],
          Xe = w[ge];
        qe !== null && Xe !== void 0 && Xe.update(qe, xe, l || a);
      }
      (Se && Se(oe, xe),
        xe.detectedPlanes &&
          n.dispatchEvent({ type: "planesdetected", data: xe }),
        (p = null));
    }
    const ct = new t0();
    (ct.setAnimationLoop(gt),
      (this.setAnimationLoop = function (oe) {
        Se = oe;
      }),
      (this.dispose = function () {}));
  }
}

const iC = new mt();

const A0 = new jt();

A0.set(-1, 0, 0, 0, 1, 0, 0, 0, 1);

function sC(i, e) {
  function t(g, m) {
    (g.matrixAutoUpdate === !0 && g.updateMatrix(), m.value.copy(g.matrix));
  }
  function n(g, m) {
    (m.color.getRGB(g.fogColor.value, Km(i)),
      m.isFog
        ? ((g.fogNear.value = m.near), (g.fogFar.value = m.far))
        : m.isFogExp2 && (g.fogDensity.value = m.density));
  }
  function r(g, m, y, C, E) {
    m.isNodeMaterial
      ? (m.uniformsNeedUpdate = !1)
      : m.isMeshBasicMaterial
        ? s(g, m)
        : m.isMeshLambertMaterial
          ? (s(g, m), m.envMap && (g.envMapIntensity.value = m.envMapIntensity))
          : m.isMeshToonMaterial
            ? (s(g, m), h(g, m))
            : m.isMeshPhongMaterial
              ? (s(g, m),
                c(g, m),
                m.envMap && (g.envMapIntensity.value = m.envMapIntensity))
              : m.isMeshStandardMaterial
                ? (s(g, m), d(g, m), m.isMeshPhysicalMaterial && u(g, m, E))
                : m.isMeshMatcapMaterial
                  ? (s(g, m), p(g, m))
                  : m.isMeshDepthMaterial
                    ? s(g, m)
                    : m.isMeshDistanceMaterial
                      ? (s(g, m), v(g, m))
                      : m.isMeshNormalMaterial
                        ? s(g, m)
                        : m.isLineBasicMaterial
                          ? (a(g, m), m.isLineDashedMaterial && o(g, m))
                          : m.isPointsMaterial
                            ? A(g, m, y, C)
                            : m.isSpriteMaterial
                              ? l(g, m)
                              : m.isShadowMaterial
                                ? (g.color.value.copy(m.color),
                                  (g.opacity.value = m.opacity))
                                : m.isShaderMaterial &&
                                  (m.uniformsNeedUpdate = !1);
  }
  function s(g, m) {
    ((g.opacity.value = m.opacity),
      m.color && g.diffuse.value.copy(m.color),
      m.emissive &&
        g.emissive.value.copy(m.emissive).multiplyScalar(m.emissiveIntensity),
      m.map && ((g.map.value = m.map), t(m.map, g.mapTransform)),
      m.alphaMap &&
        ((g.alphaMap.value = m.alphaMap), t(m.alphaMap, g.alphaMapTransform)),
      m.bumpMap &&
        ((g.bumpMap.value = m.bumpMap),
        t(m.bumpMap, g.bumpMapTransform),
        (g.bumpScale.value = m.bumpScale),
        m.side === pn && (g.bumpScale.value *= -1)),
      m.normalMap &&
        ((g.normalMap.value = m.normalMap),
        t(m.normalMap, g.normalMapTransform),
        g.normalScale.value.copy(m.normalScale),
        m.side === pn && g.normalScale.value.negate()),
      m.displacementMap &&
        ((g.displacementMap.value = m.displacementMap),
        t(m.displacementMap, g.displacementMapTransform),
        (g.displacementScale.value = m.displacementScale),
        (g.displacementBias.value = m.displacementBias)),
      m.emissiveMap &&
        ((g.emissiveMap.value = m.emissiveMap),
        t(m.emissiveMap, g.emissiveMapTransform)),
      m.specularMap &&
        ((g.specularMap.value = m.specularMap),
        t(m.specularMap, g.specularMapTransform)),
      m.alphaTest > 0 && (g.alphaTest.value = m.alphaTest));
    const y = e.get(m),
      C = y.envMap,
      E = y.envMapRotation;
    (C &&
      ((g.envMap.value = C),
      g.envMapRotation.value
        .setFromMatrix4(iC.makeRotationFromEuler(E))
        .transpose(),
      C.isCubeTexture &&
        C.isRenderTargetTexture === !1 &&
        g.envMapRotation.value.premultiply(A0),
      (g.reflectivity.value = m.reflectivity),
      (g.ior.value = m.ior),
      (g.refractionRatio.value = m.refractionRatio)),
      m.lightMap &&
        ((g.lightMap.value = m.lightMap),
        (g.lightMapIntensity.value = m.lightMapIntensity),
        t(m.lightMap, g.lightMapTransform)),
      m.aoMap &&
        ((g.aoMap.value = m.aoMap),
        (g.aoMapIntensity.value = m.aoMapIntensity),
        t(m.aoMap, g.aoMapTransform)));
  }
  function a(g, m) {
    (g.diffuse.value.copy(m.color),
      (g.opacity.value = m.opacity),
      m.map && ((g.map.value = m.map), t(m.map, g.mapTransform)));
  }
  function o(g, m) {
    ((g.dashSize.value = m.dashSize),
      (g.totalSize.value = m.dashSize + m.gapSize),
      (g.scale.value = m.scale));
  }
  function A(g, m, y, C) {
    (g.diffuse.value.copy(m.color),
      (g.opacity.value = m.opacity),
      (g.size.value = m.size * y),
      (g.scale.value = C * 0.5),
      m.map && ((g.map.value = m.map), t(m.map, g.uvTransform)),
      m.alphaMap &&
        ((g.alphaMap.value = m.alphaMap), t(m.alphaMap, g.alphaMapTransform)),
      m.alphaTest > 0 && (g.alphaTest.value = m.alphaTest));
  }
  function l(g, m) {
    (g.diffuse.value.copy(m.color),
      (g.opacity.value = m.opacity),
      (g.rotation.value = m.rotation),
      m.map && ((g.map.value = m.map), t(m.map, g.mapTransform)),
      m.alphaMap &&
        ((g.alphaMap.value = m.alphaMap), t(m.alphaMap, g.alphaMapTransform)),
      m.alphaTest > 0 && (g.alphaTest.value = m.alphaTest));
  }
  function c(g, m) {
    (g.specular.value.copy(m.specular),
      (g.shininess.value = Math.max(m.shininess, 1e-4)));
  }
  function h(g, m) {
    m.gradientMap && (g.gradientMap.value = m.gradientMap);
  }
  function d(g, m) {
    ((g.metalness.value = m.metalness),
      m.metalnessMap &&
        ((g.metalnessMap.value = m.metalnessMap),
        t(m.metalnessMap, g.metalnessMapTransform)),
      (g.roughness.value = m.roughness),
      m.roughnessMap &&
        ((g.roughnessMap.value = m.roughnessMap),
        t(m.roughnessMap, g.roughnessMapTransform)),
      m.envMap && (g.envMapIntensity.value = m.envMapIntensity));
  }
  function u(g, m, y) {
    ((g.ior.value = m.ior),
      m.sheen > 0 &&
        (g.sheenColor.value.copy(m.sheenColor).multiplyScalar(m.sheen),
        (g.sheenRoughness.value = m.sheenRoughness),
        m.sheenColorMap &&
          ((g.sheenColorMap.value = m.sheenColorMap),
          t(m.sheenColorMap, g.sheenColorMapTransform)),
        m.sheenRoughnessMap &&
          ((g.sheenRoughnessMap.value = m.sheenRoughnessMap),
          t(m.sheenRoughnessMap, g.sheenRoughnessMapTransform))),
      m.clearcoat > 0 &&
        ((g.clearcoat.value = m.clearcoat),
        (g.clearcoatRoughness.value = m.clearcoatRoughness),
        m.clearcoatMap &&
          ((g.clearcoatMap.value = m.clearcoatMap),
          t(m.clearcoatMap, g.clearcoatMapTransform)),
        m.clearcoatRoughnessMap &&
          ((g.clearcoatRoughnessMap.value = m.clearcoatRoughnessMap),
          t(m.clearcoatRoughnessMap, g.clearcoatRoughnessMapTransform)),
        m.clearcoatNormalMap &&
          ((g.clearcoatNormalMap.value = m.clearcoatNormalMap),
          t(m.clearcoatNormalMap, g.clearcoatNormalMapTransform),
          g.clearcoatNormalScale.value.copy(m.clearcoatNormalScale),
          m.side === pn && g.clearcoatNormalScale.value.negate())),
      m.dispersion > 0 && (g.dispersion.value = m.dispersion),
      m.iridescence > 0 &&
        ((g.iridescence.value = m.iridescence),
        (g.iridescenceIOR.value = m.iridescenceIOR),
        (g.iridescenceThicknessMinimum.value = m.iridescenceThicknessRange[0]),
        (g.iridescenceThicknessMaximum.value = m.iridescenceThicknessRange[1]),
        m.iridescenceMap &&
          ((g.iridescenceMap.value = m.iridescenceMap),
          t(m.iridescenceMap, g.iridescenceMapTransform)),
        m.iridescenceThicknessMap &&
          ((g.iridescenceThicknessMap.value = m.iridescenceThicknessMap),
          t(m.iridescenceThicknessMap, g.iridescenceThicknessMapTransform))),
      m.transmission > 0 &&
        ((g.transmission.value = m.transmission),
        (g.transmissionSamplerMap.value = y.texture),
        g.transmissionSamplerSize.value.set(y.width, y.height),
        m.transmissionMap &&
          ((g.transmissionMap.value = m.transmissionMap),
          t(m.transmissionMap, g.transmissionMapTransform)),
        (g.thickness.value = m.thickness),
        m.thicknessMap &&
          ((g.thicknessMap.value = m.thicknessMap),
          t(m.thicknessMap, g.thicknessMapTransform)),
        (g.attenuationDistance.value = m.attenuationDistance),
        g.attenuationColor.value.copy(m.attenuationColor)),
      m.anisotropy > 0 &&
        (g.anisotropyVector.value.set(
          m.anisotropy * Math.cos(m.anisotropyRotation),
          m.anisotropy * Math.sin(m.anisotropyRotation),
        ),
        m.anisotropyMap &&
          ((g.anisotropyMap.value = m.anisotropyMap),
          t(m.anisotropyMap, g.anisotropyMapTransform))),
      (g.specularIntensity.value = m.specularIntensity),
      g.specularColor.value.copy(m.specularColor),
      m.specularColorMap &&
        ((g.specularColorMap.value = m.specularColorMap),
        t(m.specularColorMap, g.specularColorMapTransform)),
      m.specularIntensityMap &&
        ((g.specularIntensityMap.value = m.specularIntensityMap),
        t(m.specularIntensityMap, g.specularIntensityMapTransform)));
  }
  function p(g, m) {
    m.matcap && (g.matcap.value = m.matcap);
  }
  function v(g, m) {
    const y = e.get(m).light;
    (g.referencePosition.value.setFromMatrixPosition(y.matrixWorld),
      (g.nearDistance.value = y.shadow.camera.near),
      (g.farDistance.value = y.shadow.camera.far));
  }
  return { refreshFogUniforms: n, refreshMaterialUniforms: r };
}

function aC(i, e, t, n) {
  let r = {},
    s = {},
    a = [];
  const o = i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);
  function A(E, w) {
    const S = w.program;
    n.uniformBlockBinding(E, S);
  }
  function l(E, w) {
    let S = r[E.id];
    S === void 0 &&
      (g(E), (S = c(E)), (r[E.id] = S), E.addEventListener("dispose", y));
    const k = w.program;
    n.updateUBOMapping(E, k);
    const x = e.render.frame;
    s[E.id] !== x && (d(E), (s[E.id] = x));
  }
  function c(E) {
    const w = h();
    E.__bindingPointIndex = w;
    const S = i.createBuffer(),
      k = E.__size,
      x = E.usage;
    return (
      i.bindBuffer(i.UNIFORM_BUFFER, S),
      i.bufferData(i.UNIFORM_BUFFER, k, x),
      i.bindBuffer(i.UNIFORM_BUFFER, null),
      i.bindBufferBase(i.UNIFORM_BUFFER, w, S),
      S
    );
  }
  function h() {
    for (let E = 0; E < o; E++) if (a.indexOf(E) === -1) return (a.push(E), E);
    return (
      ut(
        "WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached.",
      ),
      0
    );
  }
  function d(E) {
    const w = r[E.id],
      S = E.uniforms,
      k = E.__cache;
    i.bindBuffer(i.UNIFORM_BUFFER, w);
    for (let x = 0, T = S.length; x < T; x++) {
      const R = S[x];
      if (Array.isArray(R))
        for (let D = 0, N = R.length; D < N; D++) u(R[D], x, D, k);
      else u(R, x, 0, k);
    }
    i.bindBuffer(i.UNIFORM_BUFFER, null);
  }
  function u(E, w, S, k) {
    if (v(E, w, S, k) === !0) {
      const x = E.__offset,
        T = E.value;
      if (Array.isArray(T)) {
        let R = 0;
        for (let D = 0; D < T.length; D++) {
          const N = T[D],
            X = m(N);
          (p(N, E.__data, R),
            typeof N != "number" &&
              typeof N != "boolean" &&
              !N.isMatrix3 &&
              !ArrayBuffer.isView(N) &&
              (R += X.storage / Float32Array.BYTES_PER_ELEMENT));
        }
      } else p(T, E.__data, 0);
      i.bufferSubData(i.UNIFORM_BUFFER, x, E.__data);
    }
  }
  function p(E, w, S) {
    typeof E == "number" || typeof E == "boolean"
      ? (w[0] = E)
      : E.isMatrix3
        ? ((w[0] = E.elements[0]),
          (w[1] = E.elements[1]),
          (w[2] = E.elements[2]),
          (w[3] = 0),
          (w[4] = E.elements[3]),
          (w[5] = E.elements[4]),
          (w[6] = E.elements[5]),
          (w[7] = 0),
          (w[8] = E.elements[6]),
          (w[9] = E.elements[7]),
          (w[10] = E.elements[8]),
          (w[11] = 0))
        : ArrayBuffer.isView(E)
          ? w.set(new E.constructor(E.buffer, E.byteOffset, w.length))
          : E.toArray(w, S);
  }
  function v(E, w, S, k) {
    const x = E.value,
      T = w + "_" + S;
    if (k[T] === void 0)
      return (
        typeof x == "number" || typeof x == "boolean"
          ? (k[T] = x)
          : ArrayBuffer.isView(x)
            ? (k[T] = x.slice())
            : (k[T] = x.clone()),
        !0
      );
    {
      const R = k[T];
      if (typeof x == "number" || typeof x == "boolean") {
        if (R !== x) return ((k[T] = x), !0);
      } else {
        if (ArrayBuffer.isView(x)) return !0;
        if (R.equals(x) === !1) return (R.copy(x), !0);
      }
    }
    return !1;
  }
  function g(E) {
    const w = E.uniforms;
    let S = 0;
    const k = 16;
    for (let T = 0, R = w.length; T < R; T++) {
      const D = Array.isArray(w[T]) ? w[T] : [w[T]];
      for (let N = 0, X = D.length; N < X; N++) {
        const Y = D[N],
          H = Array.isArray(Y.value) ? Y.value : [Y.value];
        for (let V = 0, J = H.length; V < J; V++) {
          const ne = H[V],
            le = m(ne),
            je = S % k,
            de = je % le.boundary,
            pe = je + de;
          ((S += de),
            pe !== 0 && k - pe < le.storage && (S += k - pe),
            (Y.__data = new Float32Array(
              le.storage / Float32Array.BYTES_PER_ELEMENT,
            )),
            (Y.__offset = S),
            (S += le.storage));
        }
      }
    }
    const x = S % k;
    return (x > 0 && (S += k - x), (E.__size = S), (E.__cache = {}), this);
  }
  function m(E) {
    const w = { boundary: 0, storage: 0 };
    return (
      typeof E == "number" || typeof E == "boolean"
        ? ((w.boundary = 4), (w.storage = 4))
        : E.isVector2
          ? ((w.boundary = 8), (w.storage = 8))
          : E.isVector3 || E.isColor
            ? ((w.boundary = 16), (w.storage = 12))
            : E.isVector4
              ? ((w.boundary = 16), (w.storage = 16))
              : E.isMatrix3
                ? ((w.boundary = 48), (w.storage = 48))
                : E.isMatrix4
                  ? ((w.boundary = 64), (w.storage = 64))
                  : E.isTexture
                    ? it(
                        "WebGLRenderer: Texture samplers can not be part of an uniforms group.",
                      )
                    : ArrayBuffer.isView(E)
                      ? ((w.boundary = 16), (w.storage = E.byteLength))
                      : it("WebGLRenderer: Unsupported uniform value type.", E),
      w
    );
  }
  function y(E) {
    const w = E.target;
    w.removeEventListener("dispose", y);
    const S = a.indexOf(w.__bindingPointIndex);
    (a.splice(S, 1), i.deleteBuffer(r[w.id]), delete r[w.id], delete s[w.id]);
  }
  function C() {
    for (const E in r) i.deleteBuffer(r[E]);
    ((a = []), (r = {}), (s = {}));
  }
  return { bind: A, update: l, dispose: C };
}

const oC = new Uint16Array([
  12469, 15057, 12620, 14925, 13266, 14620, 13807, 14376, 14323, 13990, 14545,
  13625, 14713, 13328, 14840, 12882, 14931, 12528, 14996, 12233, 15039, 11829,
  15066, 11525, 15080, 11295, 15085, 10976, 15082, 10705, 15073, 10495, 13880,
  14564, 13898, 14542, 13977, 14430, 14158, 14124, 14393, 13732, 14556, 13410,
  14702, 12996, 14814, 12596, 14891, 12291, 14937, 11834, 14957, 11489, 14958,
  11194, 14943, 10803, 14921, 10506, 14893, 10278, 14858, 9960, 14484, 14039,
  14487, 14025, 14499, 13941, 14524, 13740, 14574, 13468, 14654, 13106, 14743,
  12678, 14818, 12344, 14867, 11893, 14889, 11509, 14893, 11180, 14881, 10751,
  14852, 10428, 14812, 10128, 14765, 9754, 14712, 9466, 14764, 13480, 14764,
  13475, 14766, 13440, 14766, 13347, 14769, 13070, 14786, 12713, 14816, 12387,
  14844, 11957, 14860, 11549, 14868, 11215, 14855, 10751, 14825, 10403, 14782,
  10044, 14729, 9651, 14666, 9352, 14599, 9029, 14967, 12835, 14966, 12831,
  14963, 12804, 14954, 12723, 14936, 12564, 14917, 12347, 14900, 11958, 14886,
  11569, 14878, 11247, 14859, 10765, 14828, 10401, 14784, 10011, 14727, 9600,
  14660, 9289, 14586, 8893, 14508, 8533, 15111, 12234, 15110, 12234, 15104,
  12216, 15092, 12156, 15067, 12010, 15028, 11776, 14981, 11500, 14942, 11205,
  14902, 10752, 14861, 10393, 14812, 9991, 14752, 9570, 14682, 9252, 14603,
  8808, 14519, 8445, 14431, 8145, 15209, 11449, 15208, 11451, 15202, 11451,
  15190, 11438, 15163, 11384, 15117, 11274, 15055, 10979, 14994, 10648, 14932,
  10343, 14871, 9936, 14803, 9532, 14729, 9218, 14645, 8742, 14556, 8381, 14461,
  8020, 14365, 7603, 15273, 10603, 15272, 10607, 15267, 10619, 15256, 10631,
  15231, 10614, 15182, 10535, 15118, 10389, 15042, 10167, 14963, 9787, 14883,
  9447, 14800, 9115, 14710, 8665, 14615, 8318, 14514, 7911, 14411, 7507, 14279,
  7198, 15314, 9675, 15313, 9683, 15309, 9712, 15298, 9759, 15277, 9797, 15229,
  9773, 15166, 9668, 15084, 9487, 14995, 9274, 14898, 8910, 14800, 8539, 14697,
  8234, 14590, 7790, 14479, 7409, 14367, 7067, 14178, 6621, 15337, 8619, 15337,
  8631, 15333, 8677, 15325, 8769, 15305, 8871, 15264, 8940, 15202, 8909, 15119,
  8775, 15022, 8565, 14916, 8328, 14804, 8009, 14688, 7614, 14569, 7287, 14448,
  6888, 14321, 6483, 14088, 6171, 15350, 7402, 15350, 7419, 15347, 7480, 15340,
  7613, 15322, 7804, 15287, 7973, 15229, 8057, 15148, 8012, 15046, 7846, 14933,
  7611, 14810, 7357, 14682, 7069, 14552, 6656, 14421, 6316, 14251, 5948, 14007,
  5528, 15356, 5942, 15356, 5977, 15353, 6119, 15348, 6294, 15332, 6551, 15302,
  6824, 15249, 7044, 15171, 7122, 15070, 7050, 14949, 6861, 14818, 6611, 14679,
  6349, 14538, 6067, 14398, 5651, 14189, 5311, 13935, 4958, 15359, 4123, 15359,
  4153, 15356, 4296, 15353, 4646, 15338, 5160, 15311, 5508, 15263, 5829, 15188,
  6042, 15088, 6094, 14966, 6001, 14826, 5796, 14678, 5543, 14527, 5287, 14377,
  4985, 14133, 4586, 13869, 4257, 15360, 1563, 15360, 1642, 15358, 2076, 15354,
  2636, 15341, 3350, 15317, 4019, 15273, 4429, 15203, 4732, 15105, 4911, 14981,
  4932, 14836, 4818, 14679, 4621, 14517, 4386, 14359, 4156, 14083, 3795, 13808,
  3437, 15360, 122, 15360, 137, 15358, 285, 15355, 636, 15344, 1274, 15322,
  2177, 15281, 2765, 15215, 3223, 15120, 3451, 14995, 3569, 14846, 3567, 14681,
  3466, 14511, 3305, 14344, 3121, 14037, 2800, 13753, 2467, 15360, 0, 15360, 1,
  15359, 21, 15355, 89, 15346, 253, 15325, 479, 15287, 796, 15225, 1148, 15133,
  1492, 15008, 1749, 14856, 1882, 14685, 1886, 14506, 1783, 14324, 1608, 13996,
  1398, 13702, 1183,
]);

let lr = null;

function AC() {
  return (
    lr === null &&
      ((lr = new nl(oC, 16, 16, qi, er)),
      (lr.name = "DFG_LUT"),
      (lr.minFilter = qt),
      (lr.magFilter = qt),
      (lr.wrapS = fr),
      (lr.wrapT = fr),
      (lr.generateMipmaps = !1),
      (lr.needsUpdate = !0)),
    lr
  );
}

class l0 {
  constructor(e = {}) {
    const {
      canvas: t = ov(),
      context: n = null,
      depth: r = !0,
      stencil: s = !1,
      alpha: a = !1,
      antialias: o = !1,
      premultipliedAlpha: A = !0,
      preserveDrawingBuffer: l = !1,
      powerPreference: c = "default",
      failIfMajorPerformanceCaveat: h = !1,
      reversedDepthBuffer: d = !1,
      outputBufferType: u = Mn,
    } = e;
    this.isWebGLRenderer = !0;
    let p;
    if (n !== null) {
      if (
        typeof WebGLRenderingContext < "u" &&
        n instanceof WebGLRenderingContext
      )
        throw new Error(
          "THREE.WebGLRenderer: WebGL 1 is not supported since r163.",
        );
      p = n.getContextAttributes().alpha;
    } else p = a;
    const v = u,
      g = new Set([md, pd, fd]),
      m = new Set([Mn, Er, Ga, Oa, dd, ud]),
      y = new Uint32Array(4),
      C = new Int32Array(4),
      E = new F();
    let w = null,
      S = null;
    const k = [],
      x = [];
    let T = null;
    ((this.domElement = t),
      (this.debug = { checkShaderErrors: !0, onShaderError: null }),
      (this.autoClear = !0),
      (this.autoClearColor = !0),
      (this.autoClearDepth = !0),
      (this.autoClearStencil = !0),
      (this.sortObjects = !0),
      (this.clippingPlanes = []),
      (this.localClippingEnabled = !1),
      (this.toneMapping = vr),
      (this.toneMappingExposure = 1),
      (this.transmissionResolutionScale = 1));
    const R = this;
    let D = !1,
      N = null,
      X = null,
      Y = null,
      H = null;
    this._outputColorSpace = Ht;
    let V = 0,
      J = 0,
      ne = null,
      le = -1,
      je = null;
    const de = new Pt(),
      pe = new Pt();
    let Se = null;
    const gt = new Ne(0);
    let ct = 0,
      oe = t.width,
      xe = t.height,
      ge = 1,
      qe = null,
      Xe = null;
    const We = new Pt(0, 0, oe, xe),
      ft = new Pt(0, 0, oe, xe);
    let st = !1;
    const ue = new Cd();
    let _e = !1,
      ve = !1;
    const Me = new mt(),
      Be = new F(),
      Ze = new Pt(),
      He = {
        background: null,
        fog: null,
        environment: null,
        overrideMaterial: null,
        isScene: !0,
      };
    let At = !1;
    function te() {
      return ne === null ? ge : 1;
    }
    let G = n;
    function Ge(P, z) {
      return t.getContext(P, z);
    }
    try {
      const P = {
        alpha: !0,
        depth: r,
        stencil: s,
        antialias: o,
        premultipliedAlpha: A,
        preserveDrawingBuffer: l,
        powerPreference: c,
        failIfMajorPerformanceCaveat: h,
      };
      if (
        ("setAttribute" in t &&
          t.setAttribute("data-engine", `three.js r${id}`),
        t.addEventListener("webglcontextlost", wt, !1),
        t.addEventListener("webglcontextrestored", W, !1),
        t.addEventListener("webglcontextcreationerror", fe, !1),
        G === null)
      ) {
        const z = "webgl2";
        if (((G = Ge(z, P)), G === null))
          throw Ge(z)
            ? new Error(
                "THREE.WebGLRenderer: Error creating WebGL context with your selected attributes.",
              )
            : new Error("THREE.WebGLRenderer: Error creating WebGL context.");
      }
    } catch (P) {
      throw (ut("WebGLRenderer: " + P.message), P);
    }
    let $e,
      I,
      b,
      q,
      K,
      ie,
      Ce,
      we,
      ae,
      ce,
      Pe,
      ze,
      Fe,
      ke,
      nt,
      Te,
      pt,
      $,
      be,
      he,
      Le,
      Ie,
      me;
    function Ye() {
      (($e = new Ay(G)),
        $e.init(),
        (Le = new Qx(G, $e)),
        (I = new ey(G, $e, e, Le)),
        (b = new Yx(G, $e)),
        I.reversedDepthBuffer && d && b.buffers.depth.setReversed(!0),
        (X = G.createFramebuffer()),
        (Y = G.createFramebuffer()),
        (H = G.createFramebuffer()),
        (q = new hy(G)),
        (K = new Dx()),
        (ie = new Zx(G, $e, b, K, I, Le, q)),
        (Ce = new oy(R)),
        (we = new p6(G)),
        (Ie = new ZE(G, we)),
        (ae = new ly(G, we, q, Ie)),
        (ce = new uy(G, ae, we, Ie, q)),
        ($ = new dy(G, I, ie)),
        (nt = new ty(K)),
        (Pe = new Fx(R, Ce, $e, I, Ie, nt)),
        (ze = new sC(R, K)),
        (Fe = new Gx()),
        (ke = new zx($e)),
        (pt = new YE(R, Ce, b, ce, p, A)),
        (Te = new Kx(R, ce, I)),
        (me = new aC(G, q, I, b)),
        (be = new QE(G, $e, q)),
        (he = new cy(G, $e, q)),
        (q.programs = Pe.programs),
        (R.capabilities = I),
        (R.extensions = $e),
        (R.properties = K),
        (R.renderLists = Fe),
        (R.shadowMap = Te),
        (R.state = b),
        (R.info = q));
    }
    (Ye(), v !== Mn && (T = new py(v, t.width, t.height, o, r, s)));
    const Je = new rC(R, G);
    ((this.xr = Je),
      (this.getContext = function () {
        return G;
      }),
      (this.getContextAttributes = function () {
        return G.getContextAttributes();
      }),
      (this.forceContextLoss = function () {
        const P = $e.get("WEBGL_lose_context");
        P && P.loseContext();
      }),
      (this.forceContextRestore = function () {
        const P = $e.get("WEBGL_lose_context");
        P && P.restoreContext();
      }),
      (this.getPixelRatio = function () {
        return ge;
      }),
      (this.setPixelRatio = function (P) {
        P !== void 0 && ((ge = P), this.setSize(oe, xe, !1));
      }),
      (this.getSize = function (P) {
        return P.set(oe, xe);
      }),
      (this.setSize = function (P, z, ee = !0) {
        if (Je.isPresenting) {
          it("WebGLRenderer: Can't change size while VR device is presenting.");
          return;
        }
        ((oe = P),
          (xe = z),
          (t.width = Math.floor(P * ge)),
          (t.height = Math.floor(z * ge)),
          ee === !0 &&
            ((t.style.width = P + "px"), (t.style.height = z + "px")),
          T !== null && T.setSize(t.width, t.height),
          this.setViewport(0, 0, P, z));
      }),
      (this.getDrawingBufferSize = function (P) {
        return P.set(oe * ge, xe * ge).floor();
      }),
      (this.setDrawingBufferSize = function (P, z, ee) {
        ((oe = P),
          (xe = z),
          (ge = ee),
          (t.width = Math.floor(P * ee)),
          (t.height = Math.floor(z * ee)),
          this.setViewport(0, 0, P, z));
      }),
      (this.setEffects = function (P) {
        if (v === Mn) {
          ut(
            "WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.",
          );
          return;
        }
        if (P) {
          for (let z = 0; z < P.length; z++)
            if (P[z].isOutputPass === !0) {
              it(
                "WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.",
              );
              break;
            }
        }
        T.setEffects(P || []);
      }),
      (this.getCurrentViewport = function (P) {
        return P.copy(de);
      }),
      (this.getViewport = function (P) {
        return P.copy(We);
      }),
      (this.setViewport = function (P, z, ee, Z) {
        (P.isVector4 ? We.set(P.x, P.y, P.z, P.w) : We.set(P, z, ee, Z),
          b.viewport(de.copy(We).multiplyScalar(ge).round()));
      }),
      (this.getScissor = function (P) {
        return P.copy(ft);
      }),
      (this.setScissor = function (P, z, ee, Z) {
        (P.isVector4 ? ft.set(P.x, P.y, P.z, P.w) : ft.set(P, z, ee, Z),
          b.scissor(pe.copy(ft).multiplyScalar(ge).round()));
      }),
      (this.getScissorTest = function () {
        return st;
      }),
      (this.setScissorTest = function (P) {
        b.setScissorTest((st = P));
      }),
      (this.setOpaqueSort = function (P) {
        qe = P;
      }),
      (this.setTransparentSort = function (P) {
        Xe = P;
      }),
      (this.getClearColor = function (P) {
        return P.copy(pt.getClearColor());
      }),
      (this.setClearColor = function () {
        pt.setClearColor(...arguments);
      }),
      (this.getClearAlpha = function () {
        return pt.getClearAlpha();
      }),
      (this.setClearAlpha = function () {
        pt.setClearAlpha(...arguments);
      }),
      (this.clear = function (P = !0, z = !0, ee = !0) {
        let Z = 0;
        if (P) {
          let Q = !1;
          if (ne !== null) {
            const De = ne.texture.format;
            Q = g.has(De);
          }
          if (Q) {
            const De = ne.texture.type,
              Ve = m.has(De),
              Oe = pt.getClearColor(),
              et = pt.getClearAlpha(),
              Qe = Oe.r,
              vt = Oe.g,
              _t = Oe.b;
            Ve
              ? ((y[0] = Qe),
                (y[1] = vt),
                (y[2] = _t),
                (y[3] = et),
                G.clearBufferuiv(G.COLOR, 0, y))
              : ((C[0] = Qe),
                (C[1] = vt),
                (C[2] = _t),
                (C[3] = et),
                G.clearBufferiv(G.COLOR, 0, C));
          } else Z |= G.COLOR_BUFFER_BIT;
        }
        (z && ((Z |= G.DEPTH_BUFFER_BIT), this.state.buffers.depth.setMask(!0)),
          ee &&
            ((Z |= G.STENCIL_BUFFER_BIT),
            this.state.buffers.stencil.setMask(4294967295)),
          Z !== 0 && G.clear(Z));
      }),
      (this.clearColor = function () {
        this.clear(!0, !1, !1);
      }),
      (this.clearDepth = function () {
        this.clear(!1, !0, !1);
      }),
      (this.clearStencil = function () {
        this.clear(!1, !1, !0);
      }),
      (this.setNodesHandler = function (P) {
        (P.setRenderer(this), (N = P));
      }),
      (this.dispose = function () {
        (t.removeEventListener("webglcontextlost", wt, !1),
          t.removeEventListener("webglcontextrestored", W, !1),
          t.removeEventListener("webglcontextcreationerror", fe, !1),
          pt.dispose(),
          Fe.dispose(),
          ke.dispose(),
          K.dispose(),
          Ce.dispose(),
          ce.dispose(),
          Ie.dispose(),
          me.dispose(),
          Pe.dispose(),
          Je.dispose(),
          Je.removeEventListener("sessionstart", on),
          Je.removeEventListener("sessionend", Mt),
          nn.stop());
      }));
    function wt(P) {
      (P.preventDefault(), PA("WebGLRenderer: Context Lost."), (D = !0));
    }
    function W() {
      (PA("WebGLRenderer: Context Restored."), (D = !1));
      const P = q.autoReset,
        z = Te.enabled,
        ee = Te.autoUpdate,
        Z = Te.needsUpdate,
        Q = Te.type;
      (Ye(),
        (q.autoReset = P),
        (Te.enabled = z),
        (Te.autoUpdate = ee),
        (Te.needsUpdate = Z),
        (Te.type = Q));
    }
    function fe(P) {
      ut(
        "WebGLRenderer: A WebGL context could not be created. Reason: ",
        P.statusMessage,
      );
    }
    function Ft(P) {
      const z = P.target;
      (z.removeEventListener("dispose", Ft), Nt(z));
    }
    function Nt(P) {
      (Rn(P), K.remove(P));
    }
    function Rn(P) {
      const z = K.get(P).programs;
      z !== void 0 &&
        (z.forEach(function (ee) {
          Pe.releaseProgram(ee);
        }),
        P.isShaderMaterial && Pe.releaseShaderCache(P));
    }
    this.renderBufferDirect = function (P, z, ee, Z, Q, De) {
      z === null && (z = He);
      const Ve = Q.isMesh && Q.matrixWorld.determinantAffine() < 0,
        Oe = gl(P, z, ee, Z, Q);
      b.setMaterial(Z, Ve);
      let et = ee.index,
        Qe = 1;
      if (Z.wireframe === !0) {
        if (((et = ae.getWireframeAttribute(ee)), et === void 0)) return;
        Qe = 2;
      }
      const vt = ee.drawRange,
        _t = ee.attributes.position;
      let rt = vt.start * Qe,
        f = (vt.start + vt.count) * Qe;
      (De !== null &&
        ((rt = Math.max(rt, De.start * Qe)),
        (f = Math.min(f, (De.start + De.count) * Qe))),
        et !== null
          ? ((rt = Math.max(rt, 0)), (f = Math.min(f, et.count)))
          : _t != null &&
            ((rt = Math.max(rt, 0)), (f = Math.min(f, _t.count))));
      const j = f - rt;
      if (j < 0 || j === 1 / 0) return;
      Ie.setup(Q, Z, Oe, ee, et);
      let M,
        L = be;
      if (
        (et !== null && ((M = we.get(et)), (L = he), L.setIndex(M)), Q.isMesh)
      )
        Z.wireframe === !0
          ? (b.setLineWidth(Z.wireframeLinewidth * te()), L.setMode(G.LINES))
          : L.setMode(G.TRIANGLES);
      else if (Q.isLine) {
        let O = Z.linewidth;
        (O === void 0 && (O = 1),
          b.setLineWidth(O * te()),
          Q.isLineSegments
            ? L.setMode(G.LINES)
            : Q.isLineLoop
              ? L.setMode(G.LINE_LOOP)
              : L.setMode(G.LINE_STRIP));
      } else
        Q.isPoints ? L.setMode(G.POINTS) : Q.isSprite && L.setMode(G.TRIANGLES);
      if (Q.isBatchedMesh)
        if ($e.get("WEBGL_multi_draw"))
          L.renderMultiDraw(
            Q._multiDrawStarts,
            Q._multiDrawCounts,
            Q._multiDrawCount,
          );
        else {
          const O = Q._multiDrawStarts,
            U = Q._multiDrawCounts,
            re = Q._multiDrawCount,
            se = et ? we.get(et).bytesPerElement : 1,
            Re = K.get(Z).currentProgram.getUniforms();
          for (let ot = 0; ot < re; ot++)
            (Re.setValue(G, "_gl_DrawID", ot), L.render(O[ot] / se, U[ot]));
        }
      else if (Q.isInstancedMesh) L.renderInstances(rt, j, Q.count);
      else if (ee.isInstancedBufferGeometry) {
        const O =
            ee._maxInstanceCount !== void 0 ? ee._maxInstanceCount : 1 / 0,
          U = Math.min(ee.instanceCount, O);
        L.renderInstances(rt, j, U);
      } else L.render(rt, j);
    };
    function zn(P, z, ee) {
      P.transparent === !0 && P.side === Ut && P.forceSinglePass === !1
        ? ((P.side = pn),
          (P.needsUpdate = !0),
          B(P, z, ee),
          (P.side = $n),
          (P.needsUpdate = !0),
          B(P, z, ee),
          (P.side = Ut))
        : B(P, z, ee);
    }
    ((this.compile = function (P, z, ee = null) {
      (ee === null && (ee = P),
        (S = ke.get(ee)),
        S.init(z),
        x.push(S),
        ee.traverseVisible(function (Q) {
          Q.isLight &&
            Q.layers.test(z.layers) &&
            (S.pushLight(Q), Q.castShadow && S.pushShadow(Q));
        }),
        P !== ee &&
          P.traverseVisible(function (Q) {
            Q.isLight &&
              Q.layers.test(z.layers) &&
              (S.pushLight(Q), Q.castShadow && S.pushShadow(Q));
          }),
        S.setupLights());
      const Z = new Set();
      return (
        P.traverse(function (Q) {
          if (!(Q.isMesh || Q.isPoints || Q.isLine || Q.isSprite)) return;
          const De = Q.material;
          if (De)
            if (Array.isArray(De))
              for (let Ve = 0; Ve < De.length; Ve++) {
                const Oe = De[Ve];
                (zn(Oe, ee, Q), Z.add(Oe));
              }
            else (zn(De, ee, Q), Z.add(De));
        }),
        (S = x.pop()),
        Z
      );
    }),
      (this.compileAsync = function (P, z, ee = null) {
        const Z = this.compile(P, z, ee);
        return new Promise((Q) => {
          function De() {
            if (
              (Z.forEach(function (Ve) {
                K.get(Ve).currentProgram.isReady() && Z.delete(Ve);
              }),
              Z.size === 0)
            ) {
              Q(P);
              return;
            }
            setTimeout(De, 10);
          }
          $e.get("KHR_parallel_shader_compile") !== null
            ? De()
            : setTimeout(De, 10);
        });
      }));
    let Sr = null;
    function Pn(P) {
      Sr && Sr(P);
    }
    function on() {
      nn.stop();
    }
    function Mt() {
      nn.start();
    }
    const nn = new t0();
    (nn.setAnimationLoop(Pn),
      typeof self < "u" && nn.setContext(self),
      (this.setAnimationLoop = function (P) {
        ((Sr = P), Je.setAnimationLoop(P), P === null ? nn.stop() : nn.start());
      }),
      Je.addEventListener("sessionstart", on),
      Je.addEventListener("sessionend", Mt),
      (this.render = function (P, z) {
        if (z !== void 0 && z.isCamera !== !0) {
          ut(
            "WebGLRenderer.render: camera is not an instance of THREE.Camera.",
          );
          return;
        }
        if (D === !0) return;
        N !== null && N.renderStart(P, z);
        const ee = Je.enabled === !0 && Je.isPresenting === !0,
          Z = T !== null && (ne === null || ee) && T.begin(R, ne);
        if (
          (P.matrixWorldAutoUpdate === !0 && P.updateMatrixWorld(),
          z.parent === null &&
            z.matrixWorldAutoUpdate === !0 &&
            z.updateMatrixWorld(),
          Je.enabled === !0 &&
            Je.isPresenting === !0 &&
            (T === null || T.isCompositing() === !1) &&
            (Je.cameraAutoUpdate === !0 && Je.updateCamera(z),
            (z = Je.getCamera())),
          P.isScene === !0 && P.onBeforeRender(R, P, z, ne),
          (S = ke.get(P, x.length)),
          S.init(z),
          (S.state.textureUnits = ie.getTextureUnits()),
          x.push(S),
          Me.multiplyMatrices(z.projectionMatrix, z.matrixWorldInverse),
          ue.setFromProjectionMatrix(Me, mr, z.reversedDepth),
          (ve = this.localClippingEnabled),
          (_e = nt.init(this.clippingPlanes, ve)),
          (w = Fe.get(P, k.length)),
          w.init(),
          k.push(w),
          Je.enabled === !0 && Je.isPresenting === !0)
        ) {
          const Ve = R.xr.getDepthSensingMesh();
          Ve !== null && ir(Ve, z, -1 / 0, R.sortObjects);
        }
        (ir(P, z, 0, R.sortObjects),
          w.finish(),
          R.sortObjects === !0 && w.sort(qe, Xe, z.reversedDepth),
          (At =
            Je.enabled === !1 ||
            Je.isPresenting === !1 ||
            Je.hasDepthSensing() === !1),
          At && pt.addToRenderList(w, P),
          this.info.render.frame++,
          this.info.autoReset === !0 && this.info.reset(),
          _e === !0 && nt.beginShadows());
        const Q = S.state.shadowsArray;
        if (
          (Te.render(Q, P, z),
          _e === !0 && nt.endShadows(),
          (Z && T.hasRenderPass()) === !1)
        ) {
          const Ve = w.opaque,
            Oe = w.transmissive;
          if ((S.setupLights(), z.isArrayCamera)) {
            const et = z.cameras;
            if (Oe.length > 0)
              for (let Qe = 0, vt = et.length; Qe < vt; Qe++) {
                const _t = et[Qe];
                fi(Ve, Oe, P, _t);
              }
            At && pt.render(P);
            for (let Qe = 0, vt = et.length; Qe < vt; Qe++) {
              const _t = et[Qe];
              sr(w, P, _t, _t.viewport);
            }
          } else
            (Oe.length > 0 && fi(Ve, Oe, P, z),
              At && pt.render(P),
              sr(w, P, z));
        }
        (ne !== null &&
          J === 0 &&
          (ie.updateMultisampleRenderTarget(ne),
          ie.updateRenderTargetMipmap(ne)),
          Z && T.end(R),
          P.isScene === !0 && P.onAfterRender(R, P, z),
          Ie.resetDefaultState(),
          (le = -1),
          (je = null),
          x.pop(),
          x.length > 0
            ? ((S = x[x.length - 1]),
              ie.setTextureUnits(S.state.textureUnits),
              _e === !0 && nt.setGlobalState(R.clippingPlanes, S.state.camera))
            : (S = null),
          k.pop(),
          k.length > 0 ? (w = k[k.length - 1]) : (w = null),
          N !== null && N.renderEnd());
      }));
    function ir(P, z, ee, Z) {
      if (P.visible === !1) return;
      if (P.layers.test(z.layers)) {
        if (P.isGroup) ee = P.renderOrder;
        else if (P.isLOD) P.autoUpdate === !0 && P.update(z);
        else if (P.isLightProbeGrid) S.pushLightProbeGrid(P);
        else if (P.isLight) (S.pushLight(P), P.castShadow && S.pushShadow(P));
        else if (P.isSprite) {
          if (!P.frustumCulled || ue.intersectsSprite(P)) {
            Z && Ze.setFromMatrixPosition(P.matrixWorld).applyMatrix4(Me);
            const Ve = ce.update(P),
              Oe = P.material;
            Oe.visible && w.push(P, Ve, Oe, ee, Ze.z, null);
          }
        } else if (
          (P.isMesh || P.isLine || P.isPoints) &&
          (!P.frustumCulled || ue.intersectsObject(P))
        ) {
          const Ve = ce.update(P),
            Oe = P.material;
          if (
            (Z &&
              (P.boundingSphere !== void 0
                ? (P.boundingSphere === null && P.computeBoundingSphere(),
                  Ze.copy(P.boundingSphere.center))
                : (Ve.boundingSphere === null && Ve.computeBoundingSphere(),
                  Ze.copy(Ve.boundingSphere.center)),
              Ze.applyMatrix4(P.matrixWorld).applyMatrix4(Me)),
            Array.isArray(Oe))
          ) {
            const et = Ve.groups;
            for (let Qe = 0, vt = et.length; Qe < vt; Qe++) {
              const _t = et[Qe],
                rt = Oe[_t.materialIndex];
              rt && rt.visible && w.push(P, Ve, rt, ee, Ze.z, _t);
            }
          } else Oe.visible && w.push(P, Ve, Oe, ee, Ze.z, null);
        }
      }
      const De = P.children;
      for (let Ve = 0, Oe = De.length; Ve < Oe; Ve++) ir(De[Ve], z, ee, Z);
    }
    function sr(P, z, ee, Z) {
      const { opaque: Q, transmissive: De, transparent: Ve } = P;
      (S.setupLightsView(ee),
        _e === !0 && nt.setGlobalState(R.clippingPlanes, ee),
        Z && b.viewport(de.copy(Z)),
        Q.length > 0 && ar(Q, z, ee),
        De.length > 0 && ar(De, z, ee),
        Ve.length > 0 && ar(Ve, z, ee),
        b.buffers.depth.setTest(!0),
        b.buffers.depth.setMask(!0),
        b.buffers.color.setMask(!0),
        b.setPolygonOffset(!1));
    }
    function fi(P, z, ee, Z) {
      if ((ee.isScene === !0 ? ee.overrideMaterial : null) !== null) return;
      if (S.state.transmissionRenderTarget[Z.id] === void 0) {
        const rt =
          $e.has("EXT_color_buffer_half_float") ||
          $e.has("EXT_color_buffer_float");
        S.state.transmissionRenderTarget[Z.id] = new qn(1, 1, {
          generateMipmaps: !0,
          type: rt ? er : Mn,
          minFilter: pr,
          samples: Math.max(4, I.samples),
          stencilBuffer: s,
          resolveDepthBuffer: !1,
          resolveStencilBuffer: !1,
          colorSpace: bt.workingColorSpace,
        });
      }
      const De = S.state.transmissionRenderTarget[Z.id],
        Ve = Z.viewport || de;
      De.setSize(
        Ve.z * R.transmissionResolutionScale,
        Ve.w * R.transmissionResolutionScale,
      );
      const Oe = R.getRenderTarget(),
        et = R.getActiveCubeFace(),
        Qe = R.getActiveMipmapLevel();
      (R.setRenderTarget(De),
        R.getClearColor(gt),
        (ct = R.getClearAlpha()),
        ct < 1 && R.setClearColor(16777215, 0.5),
        R.clear(),
        At && pt.render(ee));
      const vt = R.toneMapping;
      R.toneMapping = vr;
      const _t = Z.viewport;
      if (
        (Z.viewport !== void 0 && (Z.viewport = void 0),
        S.setupLightsView(Z),
        _e === !0 && nt.setGlobalState(R.clippingPlanes, Z),
        ar(P, ee, Z),
        ie.updateMultisampleRenderTarget(De),
        ie.updateRenderTargetMipmap(De),
        $e.has("WEBGL_multisampled_render_to_texture") === !1)
      ) {
        let rt = !1;
        for (let f = 0, j = z.length; f < j; f++) {
          const M = z[f],
            { object: L, geometry: O, material: U, group: re } = M;
          if (U.side === Ut && L.layers.test(Z.layers)) {
            const se = U.side;
            ((U.side = pn),
              (U.needsUpdate = !0),
              bn(L, ee, Z, O, U, re),
              (U.side = se),
              (U.needsUpdate = !0),
              (rt = !0));
          }
        }
        rt === !0 &&
          (ie.updateMultisampleRenderTarget(De),
          ie.updateRenderTargetMipmap(De));
      }
      (R.setRenderTarget(Oe, et, Qe),
        R.setClearColor(gt, ct),
        _t !== void 0 && (Z.viewport = _t),
        (R.toneMapping = vt));
    }
    function ar(P, z, ee) {
      const Z = z.isScene === !0 ? z.overrideMaterial : null;
      for (let Q = 0, De = P.length; Q < De; Q++) {
        const Ve = P[Q],
          { object: Oe, geometry: et, group: Qe } = Ve;
        let vt = Ve.material;
        (vt.allowOverride === !0 && Z !== null && (vt = Z),
          Oe.layers.test(ee.layers) && bn(Oe, z, ee, et, vt, Qe));
      }
    }
    function bn(P, z, ee, Z, Q, De) {
      (P.onBeforeRender(R, z, ee, Z, Q, De),
        P.modelViewMatrix.multiplyMatrices(
          ee.matrixWorldInverse,
          P.matrixWorld,
        ),
        P.normalMatrix.getNormalMatrix(P.modelViewMatrix),
        Q.onBeforeRender(R, z, ee, Z, P, De),
        Q.transparent === !0 && Q.side === Ut && Q.forceSinglePass === !1
          ? ((Q.side = pn),
            (Q.needsUpdate = !0),
            R.renderBufferDirect(ee, z, Z, Q, P, De),
            (Q.side = $n),
            (Q.needsUpdate = !0),
            R.renderBufferDirect(ee, z, Z, Q, P, De),
            (Q.side = Ut))
          : R.renderBufferDirect(ee, z, Z, Q, P, De),
        P.onAfterRender(R, z, ee, Z, Q, De));
    }
    function B(P, z, ee) {
      z.isScene !== !0 && (z = He);
      const Z = K.get(P),
        Q = S.state.lights,
        De = S.state.shadowsArray,
        Ve = Q.state.version,
        Oe = Pe.getParameters(
          P,
          Q.state,
          De,
          z,
          ee,
          S.state.lightProbeGridArray,
        ),
        et = Pe.getProgramCacheKey(Oe);
      let Qe = Z.programs;
      ((Z.environment =
        P.isMeshStandardMaterial ||
        P.isMeshLambertMaterial ||
        P.isMeshPhongMaterial
          ? z.environment
          : null),
        (Z.fog = z.fog));
      const vt =
        P.isMeshStandardMaterial ||
        (P.isMeshLambertMaterial && !P.envMap) ||
        (P.isMeshPhongMaterial && !P.envMap);
      ((Z.envMap = Ce.get(P.envMap || Z.environment, vt)),
        (Z.envMapRotation =
          Z.environment !== null && P.envMap === null
            ? z.environmentRotation
            : P.envMapRotation),
        Qe === void 0 &&
          (P.addEventListener("dispose", Ft),
          (Qe = new Map()),
          (Z.programs = Qe)));
      let _t = Qe.get(et);
      if (_t !== void 0) {
        if (Z.currentProgram === _t && Z.lightsStateVersion === Ve)
          return (In(P, Oe), _t);
      } else
        ((Oe.uniforms = Pe.getUniforms(P)),
          N !== null && P.isNodeMaterial && N.build(P, ee, Oe),
          P.onBeforeCompile(Oe, R),
          (_t = Pe.acquireProgram(Oe, et)),
          Qe.set(et, _t),
          (Z.uniforms = Oe.uniforms));
      const rt = Z.uniforms;
      return (
        ((!P.isShaderMaterial && !P.isRawShaderMaterial) ||
          P.clipping === !0) &&
          (rt.clippingPlanes = nt.uniform),
        In(P, Oe),
        (Z.needsLights = jl(P)),
        (Z.lightsStateVersion = Ve),
        Z.needsLights &&
          ((rt.ambientLightColor.value = Q.state.ambient),
          (rt.lightProbe.value = Q.state.probe),
          (rt.directionalLights.value = Q.state.directional),
          (rt.directionalLightShadows.value = Q.state.directionalShadow),
          (rt.spotLights.value = Q.state.spot),
          (rt.spotLightShadows.value = Q.state.spotShadow),
          (rt.rectAreaLights.value = Q.state.rectArea),
          (rt.ltc_1.value = Q.state.rectAreaLTC1),
          (rt.ltc_2.value = Q.state.rectAreaLTC2),
          (rt.pointLights.value = Q.state.point),
          (rt.pointLightShadows.value = Q.state.pointShadow),
          (rt.hemisphereLights.value = Q.state.hemi),
          (rt.directionalShadowMatrix.value = Q.state.directionalShadowMatrix),
          (rt.spotLightMatrix.value = Q.state.spotLightMatrix),
          (rt.spotLightMap.value = Q.state.spotLightMap),
          (rt.pointShadowMatrix.value = Q.state.pointShadowMatrix)),
        (Z.lightProbeGrid = S.state.lightProbeGridArray.length > 0),
        (Z.currentProgram = _t),
        (Z.uniformsList = null),
        _t
      );
    }
    function pi(P) {
      if (P.uniformsList === null) {
        const z = P.currentProgram.getUniforms();
        P.uniformsList = jA.seqWithValue(z.seq, P.uniforms);
      }
      return P.uniformsList;
    }
    function In(P, z) {
      const ee = K.get(P);
      ((ee.outputColorSpace = z.outputColorSpace),
        (ee.batching = z.batching),
        (ee.batchingColor = z.batchingColor),
        (ee.instancing = z.instancing),
        (ee.instancingColor = z.instancingColor),
        (ee.instancingMorph = z.instancingMorph),
        (ee.skinning = z.skinning),
        (ee.morphTargets = z.morphTargets),
        (ee.morphNormals = z.morphNormals),
        (ee.morphColors = z.morphColors),
        (ee.morphTargetsCount = z.morphTargetsCount),
        (ee.numClippingPlanes = z.numClippingPlanes),
        (ee.numIntersection = z.numClipIntersection),
        (ee.vertexAlphas = z.vertexAlphas),
        (ee.vertexTangents = z.vertexTangents),
        (ee.toneMapping = z.toneMapping));
    }
    function Ys(P, z) {
      if (P.length === 0) return null;
      if (P.length === 1) return P[0].texture !== null ? P[0] : null;
      E.setFromMatrixPosition(z.matrixWorld);
      for (let ee = 0, Z = P.length; ee < Z; ee++) {
        const Q = P[ee];
        if (Q.texture !== null && Q.boundingBox.containsPoint(E)) return Q;
      }
      return null;
    }
    function gl(P, z, ee, Z, Q) {
      (z.isScene !== !0 && (z = He), ie.resetTextureUnits());
      const De = z.fog,
        Ve =
          Z.isMeshStandardMaterial ||
          Z.isMeshLambertMaterial ||
          Z.isMeshPhongMaterial
            ? z.environment
            : null,
        Oe =
          ne === null
            ? R.outputColorSpace
            : ne.isXRRenderTarget === !0
              ? ne.texture.colorSpace
              : bt.workingColorSpace,
        et =
          Z.isMeshStandardMaterial ||
          (Z.isMeshLambertMaterial && !Z.envMap) ||
          (Z.isMeshPhongMaterial && !Z.envMap),
        Qe = Ce.get(Z.envMap || Ve, et),
        vt =
          Z.vertexColors === !0 &&
          !!ee.attributes.color &&
          ee.attributes.color.itemSize === 4,
        _t = !!ee.attributes.tangent && (!!Z.normalMap || Z.anisotropy > 0),
        rt = !!ee.morphAttributes.position,
        f = !!ee.morphAttributes.normal,
        j = !!ee.morphAttributes.color;
      let M = vr;
      Z.toneMapped &&
        (ne === null || ne.isXRRenderTarget === !0) &&
        (M = R.toneMapping);
      const L =
          ee.morphAttributes.position ||
          ee.morphAttributes.normal ||
          ee.morphAttributes.color,
        O = L !== void 0 ? L.length : 0,
        U = K.get(Z),
        re = S.state.lights;
      if (_e === !0 && (ve === !0 || P !== je)) {
        const Et = P === je && Z.id === le;
        nt.setState(Z, P, Et);
      }
      let se = !1;
      Z.version === U.__version
        ? ((U.needsLights && U.lightsStateVersion !== re.state.version) ||
            U.outputColorSpace !== Oe ||
            (Q.isBatchedMesh && U.batching === !1) ||
            (!Q.isBatchedMesh && U.batching === !0) ||
            (Q.isBatchedMesh &&
              U.batchingColor === !0 &&
              Q.colorTexture === null) ||
            (Q.isBatchedMesh &&
              U.batchingColor === !1 &&
              Q.colorTexture !== null) ||
            (Q.isInstancedMesh && U.instancing === !1) ||
            (!Q.isInstancedMesh && U.instancing === !0) ||
            (Q.isSkinnedMesh && U.skinning === !1) ||
            (!Q.isSkinnedMesh && U.skinning === !0) ||
            (Q.isInstancedMesh &&
              U.instancingColor === !0 &&
              Q.instanceColor === null) ||
            (Q.isInstancedMesh &&
              U.instancingColor === !1 &&
              Q.instanceColor !== null) ||
            (Q.isInstancedMesh &&
              U.instancingMorph === !0 &&
              Q.morphTexture === null) ||
            (Q.isInstancedMesh &&
              U.instancingMorph === !1 &&
              Q.morphTexture !== null) ||
            U.envMap !== Qe ||
            (Z.fog === !0 && U.fog !== De) ||
            (U.numClippingPlanes !== void 0 &&
              (U.numClippingPlanes !== nt.numPlanes ||
                U.numIntersection !== nt.numIntersection)) ||
            U.vertexAlphas !== vt ||
            U.vertexTangents !== _t ||
            U.morphTargets !== rt ||
            U.morphNormals !== f ||
            U.morphColors !== j ||
            U.toneMapping !== M ||
            U.morphTargetsCount !== O ||
            !!U.lightProbeGrid != S.state.lightProbeGridArray.length > 0) &&
          (se = !0)
        : ((se = !0), (U.__version = Z.version));
      let Re = U.currentProgram;
      se === !0 &&
        ((Re = B(Z, z, Q)),
        N && Z.isNodeMaterial && N.onUpdateProgram(Z, Re, U));
      let ot = !1,
        Ot = !1,
        Bt = !1;
      const at = Re.getUniforms(),
        tt = U.uniforms;
      if (
        (b.useProgram(Re.program) && ((ot = !0), (Ot = !0), (Bt = !0)),
        Z.id !== le && ((le = Z.id), (Ot = !0)),
        U.needsLights)
      ) {
        const Et = Ys(S.state.lightProbeGridArray, Q);
        U.lightProbeGrid !== Et && ((U.lightProbeGrid = Et), (Ot = !0));
      }
      if (ot || je !== P) {
        (b.buffers.depth.getReversed() &&
          P.reversedDepth !== !0 &&
          ((P._reversedDepth = !0), P.updateProjectionMatrix()),
          at.setValue(G, "projectionMatrix", P.projectionMatrix),
          at.setValue(G, "viewMatrix", P.matrixWorldInverse));
        const Wt = at.map.cameraPosition;
        (Wt !== void 0 &&
          Wt.setValue(G, Be.setFromMatrixPosition(P.matrixWorld)),
          I.logarithmicDepthBuffer &&
            at.setValue(
              G,
              "logDepthBufFC",
              2 / (Math.log(P.far + 1) / Math.LN2),
            ),
          (Z.isMeshPhongMaterial ||
            Z.isMeshToonMaterial ||
            Z.isMeshLambertMaterial ||
            Z.isMeshBasicMaterial ||
            Z.isMeshStandardMaterial ||
            Z.isShaderMaterial) &&
            at.setValue(G, "isOrthographic", P.isOrthographicCamera === !0),
          je !== P && ((je = P), (Ot = !0), (Bt = !0)));
      }
      if (
        (U.needsLights &&
          (re.state.directionalShadowMap.length > 0 &&
            at.setValue(
              G,
              "directionalShadowMap",
              re.state.directionalShadowMap,
              ie,
            ),
          re.state.spotShadowMap.length > 0 &&
            at.setValue(G, "spotShadowMap", re.state.spotShadowMap, ie),
          re.state.pointShadowMap.length > 0 &&
            at.setValue(G, "pointShadowMap", re.state.pointShadowMap, ie)),
        Q.isSkinnedMesh)
      ) {
        (at.setOptional(G, Q, "bindMatrix"),
          at.setOptional(G, Q, "bindMatrixInverse"));
        const Et = Q.skeleton;
        Et &&
          (Et.boneTexture === null && Et.computeBoneTexture(),
          at.setValue(G, "boneTexture", Et.boneTexture, ie));
      }
      Q.isBatchedMesh &&
        (at.setOptional(G, Q, "batchingTexture"),
        at.setValue(G, "batchingTexture", Q._matricesTexture, ie),
        at.setOptional(G, Q, "batchingIdTexture"),
        at.setValue(G, "batchingIdTexture", Q._indirectTexture, ie),
        at.setOptional(G, Q, "batchingColorTexture"),
        Q._colorsTexture !== null &&
          at.setValue(G, "batchingColorTexture", Q._colorsTexture, ie));
      const Dt = ee.morphAttributes;
      if (
        ((Dt.position !== void 0 ||
          Dt.normal !== void 0 ||
          Dt.color !== void 0) &&
          $.update(Q, ee, Re),
        (Ot || U.receiveShadow !== Q.receiveShadow) &&
          ((U.receiveShadow = Q.receiveShadow),
          at.setValue(G, "receiveShadow", Q.receiveShadow)),
        (Z.isMeshStandardMaterial ||
          Z.isMeshLambertMaterial ||
          Z.isMeshPhongMaterial) &&
          Z.envMap === null &&
          z.environment !== null &&
          (tt.envMapIntensity.value = z.environmentIntensity),
        tt.dfgLUT !== void 0 && (tt.dfgLUT.value = AC()),
        Ot)
      ) {
        if (
          (at.setValue(G, "toneMappingExposure", R.toneMappingExposure),
          U.needsLights && vl(tt, Bt),
          De && Z.fog === !0 && ze.refreshFogUniforms(tt, De),
          ze.refreshMaterialUniforms(
            tt,
            Z,
            ge,
            xe,
            S.state.transmissionRenderTarget[P.id],
          ),
          U.needsLights && U.lightProbeGrid)
        ) {
          const Et = U.lightProbeGrid;
          ((tt.probesSH.value = Et.texture),
            tt.probesMin.value.copy(Et.boundingBox.min),
            tt.probesMax.value.copy(Et.boundingBox.max),
            tt.probesResolution.value.copy(Et.resolution));
        }
        jA.upload(G, pi(U), tt, ie);
      }
      if (
        (Z.isShaderMaterial &&
          Z.uniformsNeedUpdate === !0 &&
          (jA.upload(G, pi(U), tt, ie), (Z.uniformsNeedUpdate = !1)),
        Z.isSpriteMaterial && at.setValue(G, "center", Q.center),
        at.setValue(G, "modelViewMatrix", Q.modelViewMatrix),
        at.setValue(G, "normalMatrix", Q.normalMatrix),
        at.setValue(G, "modelMatrix", Q.matrixWorld),
        Z.uniformsGroups !== void 0)
      ) {
        const Et = Z.uniformsGroups;
        for (let Wt = 0, rn = Et.length; Wt < rn; Wt++) {
          const _n = Et[Wt];
          (me.update(_n, Re), me.bind(_n, Re));
        }
      }
      return Re;
    }
    function vl(P, z) {
      ((P.ambientLightColor.needsUpdate = z),
        (P.lightProbe.needsUpdate = z),
        (P.directionalLights.needsUpdate = z),
        (P.directionalLightShadows.needsUpdate = z),
        (P.pointLights.needsUpdate = z),
        (P.pointLightShadows.needsUpdate = z),
        (P.spotLights.needsUpdate = z),
        (P.spotLightShadows.needsUpdate = z),
        (P.rectAreaLights.needsUpdate = z),
        (P.hemisphereLights.needsUpdate = z));
    }
    function jl(P) {
      return (
        P.isMeshLambertMaterial ||
        P.isMeshToonMaterial ||
        P.isMeshPhongMaterial ||
        P.isMeshStandardMaterial ||
        P.isShadowMaterial ||
        (P.isShaderMaterial && P.lights === !0)
      );
    }
    ((this.getActiveCubeFace = function () {
      return V;
    }),
      (this.getActiveMipmapLevel = function () {
        return J;
      }),
      (this.getRenderTarget = function () {
        return ne;
      }),
      (this.setRenderTargetTextures = function (P, z, ee) {
        const Z = K.get(P);
        ((Z.__autoAllocateDepthBuffer = P.resolveDepthBuffer === !1),
          Z.__autoAllocateDepthBuffer === !1 && (Z.__useRenderToTexture = !1),
          (K.get(P.texture).__webglTexture = z),
          (K.get(P.depthTexture).__webglTexture = Z.__autoAllocateDepthBuffer
            ? void 0
            : ee),
          (Z.__hasExternalTextures = !0));
      }),
      (this.setRenderTargetFramebuffer = function (P, z) {
        const ee = K.get(P);
        ((ee.__webglFramebuffer = z),
          (ee.__useDefaultFramebuffer = z === void 0));
      }),
      (this.setRenderTarget = function (P, z = 0, ee = 0) {
        ((ne = P), (V = z), (J = ee));
        let Z = null,
          Q = !1,
          De = !1;
        if (P) {
          const Oe = K.get(P);
          if (Oe.__useDefaultFramebuffer !== void 0) {
            (b.bindFramebuffer(G.FRAMEBUFFER, Oe.__webglFramebuffer),
              de.copy(P.viewport),
              pe.copy(P.scissor),
              (Se = P.scissorTest),
              b.viewport(de),
              b.scissor(pe),
              b.setScissorTest(Se),
              (le = -1));
            return;
          } else if (Oe.__webglFramebuffer === void 0) ie.setupRenderTarget(P);
          else if (Oe.__hasExternalTextures)
            ie.rebindTextures(
              P,
              K.get(P.texture).__webglTexture,
              K.get(P.depthTexture).__webglTexture,
            );
          else if (P.depthBuffer) {
            const vt = P.depthTexture;
            if (Oe.__boundDepthTexture !== vt) {
              if (
                vt !== null &&
                K.has(vt) &&
                (P.width !== vt.image.width || P.height !== vt.image.height)
              )
                throw new Error(
                  "THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.",
                );
              ie.setupDepthRenderbuffer(P);
            }
          }
          const et = P.texture;
          (et.isData3DTexture ||
            et.isDataArrayTexture ||
            et.isCompressedArrayTexture) &&
            (De = !0);
          const Qe = K.get(P).__webglFramebuffer;
          (P.isWebGLCubeRenderTarget
            ? (Array.isArray(Qe[z]) ? (Z = Qe[z][ee]) : (Z = Qe[z]), (Q = !0))
            : P.samples > 0 && ie.useMultisampledRTT(P) === !1
              ? (Z = K.get(P).__webglMultisampledFramebuffer)
              : Array.isArray(Qe)
                ? (Z = Qe[ee])
                : (Z = Qe),
            de.copy(P.viewport),
            pe.copy(P.scissor),
            (Se = P.scissorTest));
        } else
          (de.copy(We).multiplyScalar(ge).floor(),
            pe.copy(ft).multiplyScalar(ge).floor(),
            (Se = st));
        if (
          (ee !== 0 && (Z = X),
          b.bindFramebuffer(G.FRAMEBUFFER, Z) && b.drawBuffers(P, Z),
          b.viewport(de),
          b.scissor(pe),
          b.setScissorTest(Se),
          Q)
        ) {
          const Oe = K.get(P.texture);
          G.framebufferTexture2D(
            G.FRAMEBUFFER,
            G.COLOR_ATTACHMENT0,
            G.TEXTURE_CUBE_MAP_POSITIVE_X + z,
            Oe.__webglTexture,
            ee,
          );
        } else if (De) {
          const Oe = z;
          for (let et = 0; et < P.textures.length; et++) {
            const Qe = K.get(P.textures[et]);
            G.framebufferTextureLayer(
              G.FRAMEBUFFER,
              G.COLOR_ATTACHMENT0 + et,
              Qe.__webglTexture,
              ee,
              Oe,
            );
          }
        } else if (P !== null && ee !== 0) {
          const Oe = K.get(P.texture);
          G.framebufferTexture2D(
            G.FRAMEBUFFER,
            G.COLOR_ATTACHMENT0,
            G.TEXTURE_2D,
            Oe.__webglTexture,
            ee,
          );
        }
        le = -1;
      }),
      (this.readRenderTargetPixels = function (P, z, ee, Z, Q, De, Ve, Oe = 0) {
        if (!(P && P.isWebGLRenderTarget)) {
          ut(
            "WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.",
          );
          return;
        }
        let et = K.get(P).__webglFramebuffer;
        if ((P.isWebGLCubeRenderTarget && Ve !== void 0 && (et = et[Ve]), et)) {
          b.bindFramebuffer(G.FRAMEBUFFER, et);
          try {
            const Qe = P.textures[Oe],
              vt = Qe.format,
              _t = Qe.type;
            if (
              (P.textures.length > 1 && G.readBuffer(G.COLOR_ATTACHMENT0 + Oe),
              !I.textureFormatReadable(vt))
            ) {
              ut(
                "WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.",
              );
              return;
            }
            if (!I.textureTypeReadable(_t)) {
              ut(
                "WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.",
              );
              return;
            }
            z >= 0 &&
              z <= P.width - Z &&
              ee >= 0 &&
              ee <= P.height - Q &&
              G.readPixels(z, ee, Z, Q, Le.convert(vt), Le.convert(_t), De);
          } finally {
            const Qe = ne !== null ? K.get(ne).__webglFramebuffer : null;
            b.bindFramebuffer(G.FRAMEBUFFER, Qe);
          }
        }
      }),
      (this.readRenderTargetPixelsAsync = async function (
        P,
        z,
        ee,
        Z,
        Q,
        De,
        Ve,
        Oe = 0,
      ) {
        if (!(P && P.isWebGLRenderTarget))
          throw new Error(
            "THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.",
          );
        let et = K.get(P).__webglFramebuffer;
        if ((P.isWebGLCubeRenderTarget && Ve !== void 0 && (et = et[Ve]), et))
          if (z >= 0 && z <= P.width - Z && ee >= 0 && ee <= P.height - Q) {
            b.bindFramebuffer(G.FRAMEBUFFER, et);
            const Qe = P.textures[Oe],
              vt = Qe.format,
              _t = Qe.type;
            if (
              (P.textures.length > 1 && G.readBuffer(G.COLOR_ATTACHMENT0 + Oe),
              !I.textureFormatReadable(vt))
            )
              throw new Error(
                "THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.",
              );
            if (!I.textureTypeReadable(_t))
              throw new Error(
                "THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.",
              );
            const rt = G.createBuffer();
            (G.bindBuffer(G.PIXEL_PACK_BUFFER, rt),
              G.bufferData(G.PIXEL_PACK_BUFFER, De.byteLength, G.STREAM_READ),
              G.readPixels(z, ee, Z, Q, Le.convert(vt), Le.convert(_t), 0));
            const f = ne !== null ? K.get(ne).__webglFramebuffer : null;
            b.bindFramebuffer(G.FRAMEBUFFER, f);
            const j = G.fenceSync(G.SYNC_GPU_COMMANDS_COMPLETE, 0);
            return (
              G.flush(),
              await Av(G, j, 4),
              G.bindBuffer(G.PIXEL_PACK_BUFFER, rt),
              G.getBufferSubData(G.PIXEL_PACK_BUFFER, 0, De),
              G.deleteBuffer(rt),
              G.deleteSync(j),
              De
            );
          } else
            throw new Error(
              "THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.",
            );
      }),
      (this.copyFramebufferToTexture = function (P, z = null, ee = 0) {
        const Z = Math.pow(2, -ee),
          Q = Math.floor(P.image.width * Z),
          De = Math.floor(P.image.height * Z),
          Ve = z !== null ? z.x : 0,
          Oe = z !== null ? z.y : 0;
        (ie.setTexture2D(P, 0),
          G.copyTexSubImage2D(G.TEXTURE_2D, ee, 0, 0, Ve, Oe, Q, De),
          b.unbindTexture());
      }),
      (this.copyTextureToTexture = function (
        P,
        z,
        ee = null,
        Z = null,
        Q = 0,
        De = 0,
      ) {
        let Ve, Oe, et, Qe, vt, _t, rt, f, j;
        const M = P.isCompressedTexture ? P.mipmaps[De] : P.image;
        if (ee !== null)
          ((Ve = ee.max.x - ee.min.x),
            (Oe = ee.max.y - ee.min.y),
            (et = ee.isBox3 ? ee.max.z - ee.min.z : 1),
            (Qe = ee.min.x),
            (vt = ee.min.y),
            (_t = ee.isBox3 ? ee.min.z : 0));
        else {
          const tt = Math.pow(2, -Q);
          ((Ve = Math.floor(M.width * tt)),
            (Oe = Math.floor(M.height * tt)),
            P.isDataArrayTexture
              ? (et = M.depth)
              : P.isData3DTexture
                ? (et = Math.floor(M.depth * tt))
                : (et = 1),
            (Qe = 0),
            (vt = 0),
            (_t = 0));
        }
        Z !== null
          ? ((rt = Z.x), (f = Z.y), (j = Z.z))
          : ((rt = 0), (f = 0), (j = 0));
        const L = Le.convert(z.format),
          O = Le.convert(z.type);
        let U;
        (z.isData3DTexture
          ? (ie.setTexture3D(z, 0), (U = G.TEXTURE_3D))
          : z.isDataArrayTexture || z.isCompressedArrayTexture
            ? (ie.setTexture2DArray(z, 0), (U = G.TEXTURE_2D_ARRAY))
            : (ie.setTexture2D(z, 0), (U = G.TEXTURE_2D)),
          b.activeTexture(G.TEXTURE0),
          b.pixelStorei(G.UNPACK_FLIP_Y_WEBGL, z.flipY),
          b.pixelStorei(G.UNPACK_PREMULTIPLY_ALPHA_WEBGL, z.premultiplyAlpha),
          b.pixelStorei(G.UNPACK_ALIGNMENT, z.unpackAlignment));
        const re = b.getParameter(G.UNPACK_ROW_LENGTH),
          se = b.getParameter(G.UNPACK_IMAGE_HEIGHT),
          Re = b.getParameter(G.UNPACK_SKIP_PIXELS),
          ot = b.getParameter(G.UNPACK_SKIP_ROWS),
          Ot = b.getParameter(G.UNPACK_SKIP_IMAGES);
        (b.pixelStorei(G.UNPACK_ROW_LENGTH, M.width),
          b.pixelStorei(G.UNPACK_IMAGE_HEIGHT, M.height),
          b.pixelStorei(G.UNPACK_SKIP_PIXELS, Qe),
          b.pixelStorei(G.UNPACK_SKIP_ROWS, vt),
          b.pixelStorei(G.UNPACK_SKIP_IMAGES, _t));
        const Bt = P.isDataArrayTexture || P.isData3DTexture,
          at = z.isDataArrayTexture || z.isData3DTexture;
        if (P.isDepthTexture) {
          const tt = K.get(P),
            Dt = K.get(z),
            Et = K.get(tt.__renderTarget),
            Wt = K.get(Dt.__renderTarget);
          (b.bindFramebuffer(G.READ_FRAMEBUFFER, Et.__webglFramebuffer),
            b.bindFramebuffer(G.DRAW_FRAMEBUFFER, Wt.__webglFramebuffer));
          for (let rn = 0; rn < et; rn++)
            (Bt &&
              (G.framebufferTextureLayer(
                G.READ_FRAMEBUFFER,
                G.COLOR_ATTACHMENT0,
                K.get(P).__webglTexture,
                Q,
                _t + rn,
              ),
              G.framebufferTextureLayer(
                G.DRAW_FRAMEBUFFER,
                G.COLOR_ATTACHMENT0,
                K.get(z).__webglTexture,
                De,
                j + rn,
              )),
              G.blitFramebuffer(
                Qe,
                vt,
                Ve,
                Oe,
                rt,
                f,
                Ve,
                Oe,
                G.DEPTH_BUFFER_BIT,
                G.NEAREST,
              ));
          (b.bindFramebuffer(G.READ_FRAMEBUFFER, null),
            b.bindFramebuffer(G.DRAW_FRAMEBUFFER, null));
        } else if (Q !== 0 || P.isRenderTargetTexture || K.has(P)) {
          const tt = K.get(P),
            Dt = K.get(z);
          (b.bindFramebuffer(G.READ_FRAMEBUFFER, Y),
            b.bindFramebuffer(G.DRAW_FRAMEBUFFER, H));
          for (let Et = 0; Et < et; Et++)
            (Bt
              ? G.framebufferTextureLayer(
                  G.READ_FRAMEBUFFER,
                  G.COLOR_ATTACHMENT0,
                  tt.__webglTexture,
                  Q,
                  _t + Et,
                )
              : G.framebufferTexture2D(
                  G.READ_FRAMEBUFFER,
                  G.COLOR_ATTACHMENT0,
                  G.TEXTURE_2D,
                  tt.__webglTexture,
                  Q,
                ),
              at
                ? G.framebufferTextureLayer(
                    G.DRAW_FRAMEBUFFER,
                    G.COLOR_ATTACHMENT0,
                    Dt.__webglTexture,
                    De,
                    j + Et,
                  )
                : G.framebufferTexture2D(
                    G.DRAW_FRAMEBUFFER,
                    G.COLOR_ATTACHMENT0,
                    G.TEXTURE_2D,
                    Dt.__webglTexture,
                    De,
                  ),
              Q !== 0
                ? G.blitFramebuffer(
                    Qe,
                    vt,
                    Ve,
                    Oe,
                    rt,
                    f,
                    Ve,
                    Oe,
                    G.COLOR_BUFFER_BIT,
                    G.NEAREST,
                  )
                : at
                  ? G.copyTexSubImage3D(U, De, rt, f, j + Et, Qe, vt, Ve, Oe)
                  : G.copyTexSubImage2D(U, De, rt, f, Qe, vt, Ve, Oe));
          (b.bindFramebuffer(G.READ_FRAMEBUFFER, null),
            b.bindFramebuffer(G.DRAW_FRAMEBUFFER, null));
        } else
          at
            ? P.isDataTexture || P.isData3DTexture
              ? G.texSubImage3D(U, De, rt, f, j, Ve, Oe, et, L, O, M.data)
              : z.isCompressedArrayTexture
                ? G.compressedTexSubImage3D(
                    U,
                    De,
                    rt,
                    f,
                    j,
                    Ve,
                    Oe,
                    et,
                    L,
                    M.data,
                  )
                : G.texSubImage3D(U, De, rt, f, j, Ve, Oe, et, L, O, M)
            : P.isDataTexture
              ? G.texSubImage2D(G.TEXTURE_2D, De, rt, f, Ve, Oe, L, O, M.data)
              : P.isCompressedTexture
                ? G.compressedTexSubImage2D(
                    G.TEXTURE_2D,
                    De,
                    rt,
                    f,
                    M.width,
                    M.height,
                    L,
                    M.data,
                  )
                : G.texSubImage2D(G.TEXTURE_2D, De, rt, f, Ve, Oe, L, O, M);
        (b.pixelStorei(G.UNPACK_ROW_LENGTH, re),
          b.pixelStorei(G.UNPACK_IMAGE_HEIGHT, se),
          b.pixelStorei(G.UNPACK_SKIP_PIXELS, Re),
          b.pixelStorei(G.UNPACK_SKIP_ROWS, ot),
          b.pixelStorei(G.UNPACK_SKIP_IMAGES, Ot),
          De === 0 && z.generateMipmaps && G.generateMipmap(U),
          b.unbindTexture());
      }),
      (this.initRenderTarget = function (P) {
        K.get(P).__webglFramebuffer === void 0 && ie.setupRenderTarget(P);
      }),
      (this.initTexture = function (P) {
        (P.isCubeTexture
          ? ie.setTextureCube(P, 0)
          : P.isData3DTexture
            ? ie.setTexture3D(P, 0)
            : P.isDataArrayTexture || P.isCompressedArrayTexture
              ? ie.setTexture2DArray(P, 0)
              : ie.setTexture2D(P, 0),
          b.unbindTexture());
      }),
      (this.resetState = function () {
        ((V = 0), (J = 0), (ne = null), b.reset(), Ie.reset());
      }),
      typeof __THREE_DEVTOOLS__ < "u" &&
        __THREE_DEVTOOLS__.dispatchEvent(
          new CustomEvent("observe", { detail: this }),
        ));
  }
  get coordinateSystem() {
    return mr;
  }
  get outputColorSpace() {
    return this._outputColorSpace;
  }
  set outputColorSpace(e) {
    this._outputColorSpace = e;
    const t = this.getContext();
    ((t.drawingBufferColorSpace = bt._getDrawingBufferColorSpace(e)),
      (t.unpackColorSpace = bt._getUnpackColorSpace()));
  }
}

class c0 extends el {
  constructor() {
    (super(), (this.name = "RoomEnvironment"), (this.position.y = -3.5));
    const e = new Tn();
    e.deleteAttribute("uv");
    const t = new lt({ side: pn }),
      n = new lt(),
      r = new Fd(16777215, 900, 28, 2);
    (r.position.set(0.418, 16.199, 0.3), this.add(r));
    const s = new Ee(e, t);
    (s.position.set(-0.757, 13.219, 0.717),
      s.scale.set(31.713, 28.305, 28.591),
      this.add(s));
    const a = new Lm(e, n, 6),
      o = new It();
    (o.position.set(-10.906, 2.009, 1.846),
      o.rotation.set(0, -0.195, 0),
      o.scale.set(2.328, 7.905, 4.651),
      o.updateMatrix(),
      a.setMatrixAt(0, o.matrix),
      o.position.set(-5.607, -0.754, -0.758),
      o.rotation.set(0, 0.994, 0),
      o.scale.set(1.97, 1.534, 3.955),
      o.updateMatrix(),
      a.setMatrixAt(1, o.matrix),
      o.position.set(6.167, 0.857, 7.803),
      o.rotation.set(0, 0.561, 0),
      o.scale.set(3.927, 6.285, 3.687),
      o.updateMatrix(),
      a.setMatrixAt(2, o.matrix),
      o.position.set(-2.017, 0.018, 6.124),
      o.rotation.set(0, 0.333, 0),
      o.scale.set(2.002, 4.566, 2.064),
      o.updateMatrix(),
      a.setMatrixAt(3, o.matrix),
      o.position.set(2.291, -0.756, -2.621),
      o.rotation.set(0, -0.286, 0),
      o.scale.set(1.546, 1.552, 1.496),
      o.updateMatrix(),
      a.setMatrixAt(4, o.matrix),
      o.position.set(-2.193, -0.369, -5.547),
      o.rotation.set(0, 0.516, 0),
      o.scale.set(3.875, 3.487, 2.986),
      o.updateMatrix(),
      a.setMatrixAt(5, o.matrix),
      this.add(a));
    const A = new Ee(e, gs(50));
    (A.position.set(-16.116, 14.37, 8.208),
      A.scale.set(0.1, 2.428, 2.739),
      this.add(A));
    const l = new Ee(e, gs(50));
    (l.position.set(-16.109, 18.021, -8.207),
      l.scale.set(0.1, 2.425, 2.751),
      this.add(l));
    const c = new Ee(e, gs(17));
    (c.position.set(14.904, 12.198, -1.832),
      c.scale.set(0.15, 4.265, 6.331),
      this.add(c));
    const h = new Ee(e, gs(43));
    (h.position.set(-0.462, 8.89, 14.52),
      h.scale.set(4.38, 5.441, 0.088),
      this.add(h));
    const d = new Ee(e, gs(20));
    (d.position.set(3.235, 11.486, -12.541),
      d.scale.set(2.5, 2, 0.1),
      this.add(d));
    const u = new Ee(e, gs(100));
    (u.position.set(0, 20, 0), u.scale.set(1, 0.1, 1), this.add(u));
  }
  dispose() {
    const e = new Set();
    this.traverse((t) => {
      t.isMesh && (e.add(t.geometry), e.add(t.material));
    });
    for (const t of e) t.dispose();
  }
}

function gs(i) {
  return new Zm({ color: 0, emissive: 16777215, emissiveIntensity: i });
}

const _A = {
  name: "CopyShader",
  uniforms: { tDiffuse: { value: null }, opacity: { value: 1 } },
  vertexShader: `

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,
  fragmentShader: `

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`,
};

class Js {
  constructor() {
    ((this.isPass = !0),
      (this.enabled = !0),
      (this.needsSwap = !0),
      (this.clear = !1),
      (this.renderToScreen = !1));
  }
  setSize() {}
  render() {
    console.error("THREE.Pass: .render() must be implemented in derived pass.");
  }
  dispose() {}
}

const lC = new lo(-1, 1, 1, -1, 0, 1);

class cC extends Ct {
  constructor() {
    (super(),
      this.setAttribute("position", new Ke([-1, 3, 0, -1, -1, 0, 3, -1, 0], 3)),
      this.setAttribute("uv", new Ke([0, 2, 0, 0, 2, 0], 2)));
  }
}

const hC = new cC();

class ll {
  constructor(e) {
    this._mesh = new Ee(hC, e);
  }
  dispose() {
    this._mesh.geometry.dispose();
  }
  render(e) {
    e.render(this._mesh, lC);
  }
  get material() {
    return this._mesh.material;
  }
  set material(e) {
    this._mesh.material = e;
  }
}

class h0 extends Js {
  constructor(e, t = "tDiffuse") {
    (super(),
      (this.textureID = t),
      (this.uniforms = null),
      (this.material = null),
      e instanceof Lt
        ? ((this.uniforms = e.uniforms), (this.material = e))
        : e &&
          ((this.uniforms = sl.clone(e.uniforms)),
          (this.material = new Lt({
            name: e.name !== void 0 ? e.name : "unspecified",
            defines: Object.assign({}, e.defines),
            uniforms: this.uniforms,
            vertexShader: e.vertexShader,
            fragmentShader: e.fragmentShader,
          }))),
      (this._fsQuad = new ll(this.material)));
  }
  render(e, t, n) {
    (this.uniforms[this.textureID] &&
      (this.uniforms[this.textureID].value = n.texture),
      (this._fsQuad.material = this.material),
      this.renderToScreen
        ? (e.setRenderTarget(null), this._fsQuad.render(e))
        : (e.setRenderTarget(t),
          this.clear &&
            e.clear(e.autoClearColor, e.autoClearDepth, e.autoClearStencil),
          this._fsQuad.render(e)));
  }
  dispose() {
    (this.material.dispose(), this._fsQuad.dispose());
  }
}

class Mf extends Js {
  constructor(e, t) {
    (super(),
      (this.scene = e),
      (this.camera = t),
      (this.clear = !0),
      (this.needsSwap = !1),
      (this.inverse = !1));
  }
  render(e, t, n) {
    const r = e.getContext(),
      s = e.state;
    (s.buffers.color.setMask(!1),
      s.buffers.depth.setMask(!1),
      s.buffers.color.setLocked(!0),
      s.buffers.depth.setLocked(!0));
    let a, o;
    (this.inverse ? ((a = 0), (o = 1)) : ((a = 1), (o = 0)),
      s.buffers.stencil.setTest(!0),
      s.buffers.stencil.setOp(r.REPLACE, r.REPLACE, r.REPLACE),
      s.buffers.stencil.setFunc(r.ALWAYS, a, 4294967295),
      s.buffers.stencil.setClear(o),
      s.buffers.stencil.setLocked(!0),
      e.setRenderTarget(n),
      this.clear && e.clear(),
      e.render(this.scene, this.camera),
      e.setRenderTarget(t),
      this.clear && e.clear(),
      e.render(this.scene, this.camera),
      s.buffers.color.setLocked(!1),
      s.buffers.depth.setLocked(!1),
      s.buffers.color.setMask(!0),
      s.buffers.depth.setMask(!0),
      s.buffers.stencil.setLocked(!1),
      s.buffers.stencil.setFunc(r.EQUAL, 1, 4294967295),
      s.buffers.stencil.setOp(r.KEEP, r.KEEP, r.KEEP),
      s.buffers.stencil.setLocked(!0));
  }
}

class dC extends Js {
  constructor() {
    (super(), (this.needsSwap = !1));
  }
  render(e) {
    (e.state.buffers.stencil.setLocked(!1),
      e.state.buffers.stencil.setTest(!1));
  }
}

class uC {
  constructor(e, t) {
    if (
      ((this.renderer = e),
      (this._pixelRatio = e.getPixelRatio()),
      t === void 0)
    ) {
      const n = e.getSize(new Ae());
      ((this._width = n.width),
        (this._height = n.height),
        (t = new qn(
          this._width * this._pixelRatio,
          this._height * this._pixelRatio,
          { type: er },
        )),
        (t.texture.name = "EffectComposer.rt1"));
    } else ((this._width = t.width), (this._height = t.height));
    ((this.renderTarget1 = t),
      (this.renderTarget2 = t.clone()),
      (this.renderTarget2.texture.name = "EffectComposer.rt2"),
      (this.writeBuffer = this.renderTarget1),
      (this.readBuffer = this.renderTarget2),
      (this.renderToScreen = !0),
      (this.passes = []),
      (this.copyPass = new h0(_A)),
      (this.copyPass.material.blending = gr),
      (this.timer = new r6()));
  }
  swapBuffers() {
    const e = this.readBuffer;
    ((this.readBuffer = this.writeBuffer), (this.writeBuffer = e));
  }
  addPass(e) {
    (this.passes.push(e),
      e.setSize(
        this._width * this._pixelRatio,
        this._height * this._pixelRatio,
      ));
  }
  insertPass(e, t) {
    (this.passes.splice(t, 0, e),
      e.setSize(
        this._width * this._pixelRatio,
        this._height * this._pixelRatio,
      ));
  }
  removePass(e) {
    const t = this.passes.indexOf(e);
    t !== -1 && this.passes.splice(t, 1);
  }
  isLastEnabledPass(e) {
    for (let t = e + 1; t < this.passes.length; t++)
      if (this.passes[t].enabled) return !1;
    return !0;
  }
  render(e) {
    (this.timer.update(), e === void 0 && (e = this.timer.getDelta()));
    const t = this.renderer.getRenderTarget();
    let n = !1;
    for (let r = 0, s = this.passes.length; r < s; r++) {
      const a = this.passes[r];
      if (a.enabled !== !1) {
        if (
          ((a.renderToScreen =
            this.renderToScreen && this.isLastEnabledPass(r)),
          a.render(this.renderer, this.writeBuffer, this.readBuffer, e, n),
          a.needsSwap)
        ) {
          if (n) {
            const o = this.renderer.getContext(),
              A = this.renderer.state.buffers.stencil;
            (A.setFunc(o.NOTEQUAL, 1, 4294967295),
              this.copyPass.render(
                this.renderer,
                this.writeBuffer,
                this.readBuffer,
                e,
              ),
              A.setFunc(o.EQUAL, 1, 4294967295));
          }
          this.swapBuffers();
        }
        Mf !== void 0 &&
          (a instanceof Mf ? (n = !0) : a instanceof dC && (n = !1));
      }
    }
    this.renderer.setRenderTarget(t);
  }
  reset(e) {
    if (e === void 0) {
      const t = this.renderer.getSize(new Ae());
      ((this._pixelRatio = this.renderer.getPixelRatio()),
        (this._width = t.width),
        (this._height = t.height),
        (e = this.renderTarget1.clone()),
        e.setSize(
          this._width * this._pixelRatio,
          this._height * this._pixelRatio,
        ));
    }
    (this.renderTarget1.dispose(),
      this.renderTarget2.dispose(),
      (this.renderTarget1 = e),
      (this.renderTarget2 = e.clone()),
      (this.writeBuffer = this.renderTarget1),
      (this.readBuffer = this.renderTarget2));
  }
  setSize(e, t) {
    ((this._width = e), (this._height = t));
    const n = this._width * this._pixelRatio,
      r = this._height * this._pixelRatio;
    (this.renderTarget1.setSize(n, r), this.renderTarget2.setSize(n, r));
    for (let s = 0; s < this.passes.length; s++) this.passes[s].setSize(n, r);
  }
  setPixelRatio(e) {
    ((this._pixelRatio = e), this.setSize(this._width, this._height));
  }
  dispose() {
    (this.renderTarget1.dispose(),
      this.renderTarget2.dispose(),
      this.copyPass.dispose());
  }
}

const Ko = {
  name: "OutputShader",
  uniforms: { tDiffuse: { value: null }, toneMappingExposure: { value: 1 } },
  vertexShader: `
		precision highp float;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		attribute vec3 position;
		attribute vec2 uv;

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,
  fragmentShader: `

		precision highp float;

		uniform sampler2D tDiffuse;

		#include <tonemapping_pars_fragment>
		#include <colorspace_pars_fragment>

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// tone mapping

			#ifdef LINEAR_TONE_MAPPING

				gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );

			#elif defined( REINHARD_TONE_MAPPING )

				gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );

			#elif defined( CINEON_TONE_MAPPING )

				gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );

			#elif defined( ACES_FILMIC_TONE_MAPPING )

				gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

			#elif defined( AGX_TONE_MAPPING )

				gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );

			#elif defined( NEUTRAL_TONE_MAPPING )

				gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );

			#elif defined( CUSTOM_TONE_MAPPING )

				gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );

			#endif

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}`,
};

class fC extends Js {
  constructor() {
    (super(),
      (this.isOutputPass = !0),
      (this.uniforms = sl.clone(Ko.uniforms)),
      (this.material = new Ym({
        name: Ko.name,
        uniforms: this.uniforms,
        vertexShader: Ko.vertexShader,
        fragmentShader: Ko.fragmentShader,
      })),
      (this._fsQuad = new ll(this.material)),
      (this._outputColorSpace = null),
      (this._toneMapping = null));
  }
  render(e, t, n) {
    ((this.uniforms.tDiffuse.value = n.texture),
      (this.uniforms.toneMappingExposure.value = e.toneMappingExposure),
      (this._outputColorSpace !== e.outputColorSpace ||
        this._toneMapping !== e.toneMapping) &&
        ((this._outputColorSpace = e.outputColorSpace),
        (this._toneMapping = e.toneMapping),
        (this.material.defines = {}),
        bt.getTransfer(this._outputColorSpace) === kt &&
          (this.material.defines.SRGB_TRANSFER = ""),
        this._toneMapping === sd
          ? (this.material.defines.LINEAR_TONE_MAPPING = "")
          : this._toneMapping === ad
            ? (this.material.defines.REINHARD_TONE_MAPPING = "")
            : this._toneMapping === od
              ? (this.material.defines.CINEON_TONE_MAPPING = "")
              : this._toneMapping === oo
                ? (this.material.defines.ACES_FILMIC_TONE_MAPPING = "")
                : this._toneMapping === ld
                  ? (this.material.defines.AGX_TONE_MAPPING = "")
                  : this._toneMapping === cd
                    ? (this.material.defines.NEUTRAL_TONE_MAPPING = "")
                    : this._toneMapping === Ad &&
                      (this.material.defines.CUSTOM_TONE_MAPPING = ""),
        (this.material.needsUpdate = !0)),
      this.renderToScreen === !0
        ? (e.setRenderTarget(null), this._fsQuad.render(e))
        : (e.setRenderTarget(t),
          this.clear &&
            e.clear(e.autoClearColor, e.autoClearDepth, e.autoClearStencil),
          this._fsQuad.render(e)));
  }
  dispose() {
    (this.material.dispose(), this._fsQuad.dispose());
  }
}

class pC extends Js {
  constructor(e, t, n = null, r = null, s = null) {
    (super(),
      (this.scene = e),
      (this.camera = t),
      (this.overrideMaterial = n),
      (this.clearColor = r),
      (this.clearAlpha = s),
      (this.clear = !0),
      (this.clearDepth = !1),
      (this.needsSwap = !1),
      (this.isRenderPass = !0),
      (this._oldClearColor = new Ne()));
  }
  render(e, t, n) {
    const r = e.autoClear;
    e.autoClear = !1;
    let s, a;
    (this.overrideMaterial !== null &&
      ((a = this.scene.overrideMaterial),
      (this.scene.overrideMaterial = this.overrideMaterial)),
      this.clearColor !== null &&
        (e.getClearColor(this._oldClearColor),
        e.setClearColor(this.clearColor, e.getClearAlpha())),
      this.clearAlpha !== null &&
        ((s = e.getClearAlpha()), e.setClearAlpha(this.clearAlpha)),
      this.clearDepth == !0 && e.clearDepth(),
      e.setRenderTarget(this.renderToScreen ? null : n),
      this.clear === !0 &&
        e.clear(e.autoClearColor, e.autoClearDepth, e.autoClearStencil),
      e.render(this.scene, this.camera),
      this.clearColor !== null && e.setClearColor(this._oldClearColor),
      this.clearAlpha !== null && e.setClearAlpha(s),
      this.overrideMaterial !== null && (this.scene.overrideMaterial = a),
      (e.autoClear = r));
  }
}

export { $n, Ae, Ai, Ao, BA, Bd, Cm, Cn, Cr, Ct, DA, Ed, Ee, F, Fd, Gi, Gr, Gt, Ha, Hm, Hs, Ht, Ia, Im, It, Js, Ke, Kg, Ld, Lm, Lt, NA, Ne, Nm, Oi, Pd, Pj, Pm, Pt, QA, Qa, Qt, Rd, Rj, Rt, Tm, Tn, Ua, Ur, Ut, Va, Wa, Xi, Xt, Ya, Yj, Yt, Yv, Za, Zm, Zt, _A, ai, al, ba, bd, bh, bt, c0, ci, cn, dt, e0, e6, el, eo, er, fA, fn, fr, gm, il, jn, jt, ka, kd, kn, l0, li, ll, lo, lt, mt, nl, oo, pr, qa, qj, qn, qt, rl, sl, ui, un, ws, xd, xr, yd, zi, zm, zs, zt, zv };
export { dt as Group, Ee as Mesh, Ct as BufferGeometry, Ke as Float32BufferAttribute, cn as MeshBasicMaterial, Lt as ShaderMaterial, li as AdditiveBlending, Tn as BoxGeometry, Xt as CylinderGeometry, Ur as SphereGeometry, F as Vector3, jn as Quaternion, Ne as Color, Ut as DoubleSide, Ht as SRGBColorSpace, BA as MirroredRepeatWrapping, ui as PlaneGeometry, mt as Matrix4, Ae as Vector2, xr as Box3, el as Scene, Ao as TextureLoader, lo as OrthographicCamera, fn as PerspectiveCamera, l0 as WebGLRenderer };
