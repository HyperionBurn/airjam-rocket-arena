import { _ } from "../core/class-fields.js";
import { F, fn } from "../vendor/three.js";

const Ps = {
    cameraShake: !1,
    fov: 110,
    distance: 270,
    height: 100,
    angleDeg: -3,
    stiffness: 0.35,
    swivelSpeed: 4,
    transitionSpeed: 1,
    invertSwivel: !0,
  };

const Aw = 32;

const Sc = 32;

const wc = 35;

const Mc = 38;

const lw = 41;

class ChaseCamera {
  constructor(e, t) {
    _(this, "camera");
    _(this, "settings", { ...Ps });
    _(this, "_ballCam", !0);
    _(this, "input", new Float64Array(Aw));
    _(this, "direction", new F());
    _(this, "target", new F());
    _(this, "kernel");
    ((this.kernel = t),
      (this.camera = new fn(Ps.fov, e, 4, 4e4)),
      this.kernel.resetView());
  }
  get ballCam() {
    return this._ballCam;
  }
  set ballCam(e) {
    this._ballCam = e;
  }
  update(e, t, n, r) {
    var l, c, h, d, u, p;
    const s = this.input;
    ((s[0] = n),
      (s[1] = this._ballCam ? 1 : 0),
      (s[2] = e.position.x),
      (s[3] = e.position.y),
      (s[4] = e.position.z),
      (s[5] = e.quaternion.x),
      (s[6] = e.quaternion.y),
      (s[7] = e.quaternion.z),
      (s[8] = e.quaternion.w),
      (s[9] = t.position.x),
      (s[10] = t.position.y),
      (s[11] = t.position.z));
    let a = 0;
    ((r == null ? void 0 : r.onGround) !== void 0 && (a |= 1),
      r != null && r.groundNormal && (a |= 2),
      r != null && r.velocity && (a |= 4),
      (r == null ? void 0 : r.supersonic) !== void 0 && (a |= 8),
      (s[12] = a),
      (s[13] = r != null && r.onGround ? 1 : 0),
      (s[14] =
        ((l = r == null ? void 0 : r.groundNormal) == null ? void 0 : l.x) ??
        0),
      (s[15] =
        ((c = r == null ? void 0 : r.groundNormal) == null ? void 0 : c.y) ??
        0),
      (s[16] =
        ((h = r == null ? void 0 : r.groundNormal) == null ? void 0 : h.z) ??
        0),
      (s[17] =
        ((d = r == null ? void 0 : r.velocity) == null ? void 0 : d.x) ?? 0),
      (s[18] =
        ((u = r == null ? void 0 : r.velocity) == null ? void 0 : u.y) ?? 0),
      (s[19] =
        ((p = r == null ? void 0 : r.velocity) == null ? void 0 : p.z) ?? 0),
      (s[20] = r != null && r.supersonic ? 1 : 0),
      (s[21] = this.settings.fov),
      (s[22] = this.settings.distance),
      (s[23] = this.settings.height),
      (s[24] = this.settings.angleDeg),
      (s[25] = this.settings.stiffness),
      (s[26] = this.settings.transitionSpeed),
      (s[27] = this.camera.aspect),
      (s[28] = (r == null ? void 0 : r.lookX) ?? 0),
      (s[29] = (r == null ? void 0 : r.lookY) ?? 0),
      (s[30] = this.settings.swivelSpeed),
      (s[31] = this.settings.invertSwivel ? 1 : 0));
    const o = this.kernel.stepView(s);
    (this.camera.position.set(o[Sc], o[Sc + 1], o[Sc + 2]),
      this.direction.set(o[wc], o[wc + 1], o[wc + 2]),
      this.camera.up.set(o[Mc], o[Mc + 1], o[Mc + 2]),
      this.target.copy(this.camera.position).add(this.direction),
      this.camera.lookAt(this.target));
    const A = o[lw];
    Math.abs(this.camera.fov - A) > 0.001 &&
      ((this.camera.fov = A), this.camera.updateProjectionMatrix());
  }
}

export { ChaseCamera, Ps };
