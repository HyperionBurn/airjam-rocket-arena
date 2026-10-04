import { createRocketPlume } from './rocket-plume.js';
import { _ } from "../core/class-fields.js";
import { Ai, Ct, Ee, F, Fd, Gt, Ke, Lt, Ut, dt } from "../vendor/three.js";
import { getTheme } from "../rendering/theme.js";
import { O1 } from "./realistic-boost.js";
import { $1, BoostAudio, Ep, H1, Ti, U1, _s, lA, q1, ti, xp, yc, yi, yp } from "../audio/boost.js";
import { ExhaustParticles } from "./exhaust-particles.js";
import { ORIGINAL_BOOST_COLOR, setBoostMaterialColor } from './boost-color.js';

function J1(i) {
  const e = new Ct();
  e.setAttribute("position", new Ke(i.toArray(), 3));
  const t = new Lt({
      name: "Arcade / nozzle glint",
      uniforms: { intensity: { value: 0 } },
      vertexShader: `
      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * viewPosition;
        gl_PointSize = 15.0 * (500.0 / max(1.0, -viewPosition.z));
      }
    `,
      fragmentShader: `
      uniform float intensity;
      void main() {
        vec2 p = abs(gl_PointCoord * 2.0 - 1.0);
        float shape = sqrt(p.x) + sqrt(p.y);
        float aa = max(fwidth(shape), 0.015);
        float alpha = (1.0 - smoothstep(1.0 - aa, 1.0 + aa, shape)) * intensity;
        if (alpha < 0.003) discard;
        gl_FragColor = vec4(vec3(1.9, 1.48, 0.82), alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
      transparent: !0,
      depthWrite: !1,
      toneMapped: !0,
    }),
    n = new Ai(e, t);
  return ((n.frustumCulled = !1), (n.renderOrder = 7), n);
}

class BoostEffect {
  constructor(e, t, n, r = !0, s = !1) {
    _(this, "car");
    _(this, "nozzleLocal");
    _(this, "cone", new dt());
    _(this, "coneMaterials", []);
    _(this, "drive");
    _(this, "trail");
    _(this, "nozzleFlash");
    _(this, "light");
    _(this, "audio");
    _(this, "realistic");
    _(this, "theme", getTheme());
    _(this, "driveAge", new Float32Array(ti).fill(1 / 0));
    _(this, "driveBaseSize", new Float32Array(ti * 2));
    _(this, "driveVelocity", new Float32Array(ti * 3));
    _(this, "driveHead", 0);
    _(this, "driveSpawnAccumulator", 0);
    _(this, "driveParticlesActive", !1);
    _(this, "trailAge", new Float32Array(yi).fill(1 / 0));
    _(this, "trailBaseSize", new Float32Array(yi * 2));
    _(this, "trailAcceleration", new Float32Array(yi));
    _(this, "trailVelocity", new Float32Array(yi * 3));
    _(this, "trailHead", 0);
    _(this, "trailParticlesActive", !1);
    _(this, "previousNozzle", new F());
    _(this, "hasPreviousNozzle", !1);
    _(this, "spawnRemainder", 0);
    _(this, "elapsed", 0);
    _(this, "coneOpacity", 0);
    ((this.car = t),
      (this.nozzleLocal = n.clone()),
      (this.audio = r ? new BoostAudio(s) : null),
      (this.drive = new ExhaustParticles(ti, !0, 5)),
      this.drive.mesh.layers.enable(Ti),
      (this.drive.mesh.visible = !1),
      t.add(this.drive.mesh),
      (this.trail = new ExhaustParticles(yi, !1, 4)),
      this.trail.mesh.layers.enable(Ti),
      (this.trail.mesh.visible = !1),
      e.add(this.trail.mesh),
      this.cone.position.copy(this.nozzleLocal),
      this.cone.layers.enable(Ti),
      (this.cone.visible = !1),
      t.add(this.cone),
      (this.cone.name = "boost-flame"));
    for(const mesh of createRocketPlume()){
      mesh.layers.enable(Ti);this.coneMaterials.push(mesh.material);this.cone.add(mesh);
    }
    ((this.nozzleFlash = J1(this.nozzleLocal.clone().add(new F(-2, 0, 0)))),
      this.nozzleFlash.layers.enable(Ti),
      (this.nozzleFlash.visible = !1),
      t.add(this.nozzleFlash),
      (this.light = new Fd(yp, 0, 300, 2)),
      this.light.position.copy(this.nozzleLocal).add(new F(-10, 0, 0)),
      t.add(this.light),
      (this.realistic = new O1(e, t, this.nozzleLocal, this.light)));
  }
  get bloomActive() {
    return this.theme === "realistic"
      ? this.realistic.bloomActive
      : this.coneOpacity > 0.002 ||
          this.driveParticlesActive ||
          this.trailParticlesActive;
  }
  setColor(color = ORIGINAL_BOOST_COLOR) {
    this.boostColor = color;
    const materials = [
      ...this.coneMaterials, this.drive.mesh.material, this.trail.mesh.material, this.nozzleFlash.material,
      ...this.realistic.coneMaterials, this.realistic.drive.mesh.material, this.realistic.trail.mesh.material, this.realistic.lensFlare.material,
    ];
    for (const material of materials) setBoostMaterialColor(material, color);
    this.customLightColor = color === ORIGINAL_BOOST_COLOR ? null : this.light.color.clone().set(color);
  }
  async preload() {
    var e;
    await Promise.all([
      (e = this.audio) == null ? void 0 : e.preload(),
      this.realistic.preload(),
    ]);
  }
  disposeAudio() {
    var e;
    (e = this.audio) == null || e.dispose();
  }
  update(e, t, n, r, s = !0, h = !0) {
    const a = e && n,
      o = t && !e && n;
    ((this.elapsed += r),
      this.audio &&
        (this.car.updateWorldMatrix(!0, !1),
        _s.copy(this.nozzleLocal),
        this.car.localToWorld(_s),
        this.audio.updateSpatial(_s, n && s),
        this.audio.setBoosting(a && s)));
    if (!h) return;
    const A = getTheme();
    if (
      (this.theme !== A &&
        (this.resetVisual(), this.realistic.reset(), (this.theme = A)),
      A === "realistic")
    ) {
      this.realistic.update(e, t, n, r);
      if (this.customLightColor) this.light.color.copy(this.customLightColor);
      return;
    }
    this.light.color.copy(this.customLightColor ?? yp);
    const l = a ? 28 : 16;
    ((this.coneOpacity = Gt.damp(this.coneOpacity, a ? 1 : 0, l, r)),
      (this.cone.visible = this.coneOpacity > 0.002));
    for (const c of this.coneMaterials)
      ((c.uniforms.time.value = this.elapsed),
        (c.uniforms.opacity.value = this.coneOpacity));
    ((this.nozzleFlash.visible = this.cone.visible),
      (this.nozzleFlash.material.uniforms.intensity.value = this.coneOpacity),
      (this.light.intensity =
        this.coneOpacity * (380 + 25 * Math.sin(this.elapsed * 24))),
      o ? this.spawnDrive(r) : (this.driveSpawnAccumulator = 0),
      a
        ? (this.car.updateMatrixWorld(),
          _s.copy(this.nozzleLocal),
          this.car.localToWorld(_s),
          this.spawnTrailByDistance(_s))
        : ((this.hasPreviousNozzle = !1), (this.spawnRemainder = 0)),
      this.driveParticlesActive &&
        ((this.driveParticlesActive = this.updateDrive(r)),
        (this.drive.mesh.visible = this.driveParticlesActive),
        this.drive.markDirty()),
      this.trailParticlesActive &&
        ((this.trailParticlesActive = this.updateTrail(r)),
        (this.trail.mesh.visible = this.trailParticlesActive),
        this.trail.markDirty()));
  }
  resetVisual() {
    (this.driveAge.fill(1 / 0),
      this.trailAge.fill(1 / 0),
      this.drive.opacity.fill(0),
      this.trail.opacity.fill(0),
      this.drive.markDirty(),
      this.trail.markDirty(),
      (this.coneOpacity = 0),
      (this.cone.visible = this.nozzleFlash.visible = !1),
      (this.drive.mesh.visible = this.trail.mesh.visible = !1),
      (this.driveParticlesActive = this.trailParticlesActive = !1),
      (this.hasPreviousNozzle = !1),
      (this.spawnRemainder = this.driveSpawnAccumulator = 0));
  }
  spawnDrive(e) {
    ((this.driveSpawnAccumulator += e * $1),
      Number.isFinite(this.driveAge[(this.driveHead + ti - 1) % ti]) ||
        (this.driveSpawnAccumulator = Math.max(this.driveSpawnAccumulator, 1)));
    let t = 0;
    for (; this.driveSpawnAccumulator >= 1 && t < Ep; ) {
      this.driveSpawnAccumulator -= 1;
      const n = this.driveHead;
      this.driveHead = (n + 1) % ti;
      const r = n * 3,
        s = n * 2;
      ((this.drive.offsets[r] = this.nozzleLocal.x),
        (this.drive.offsets[r + 1] = this.nozzleLocal.y),
        (this.drive.offsets[r + 2] = this.nozzleLocal.z),
        (this.driveVelocity[r] = -(50 + Math.random() * 50)),
        (this.driveVelocity[r + 1] = -5 + Math.random() * 10),
        (this.driveVelocity[r + 2] = -5 + Math.random() * 10),
        (this.driveBaseSize[s] = 6 + Math.random() * 3),
        (this.driveBaseSize[s + 1] = this.driveBaseSize[s]),
        (this.drive.rotations[n] = Math.random() * Math.PI * 2),
        (this.driveAge[n] = 0),
        (this.driveParticlesActive = !0),
        t++);
    }
  }
  spawnTrailByDistance(e) {
    if (!this.hasPreviousNozzle) {
      (this.previousNozzle.copy(e), (this.hasPreviousNozzle = !0));
      return;
    }
    (yc.copy(this.previousNozzle), lA.subVectors(e, yc));
    const t = lA.length();
    if (t < 1e-4) return;
    if ((lA.divideScalar(t), t > 600)) {
      (this.previousNozzle.copy(e), (this.spawnRemainder = 0));
      return;
    }
    const n = this.spawnRemainder,
      r = 1 / q1,
      s = n + t * r,
      a = Math.floor(s),
      o = Math.min(a, Ep);
    this.spawnRemainder = s - a;
    for (let A = 0; A < o; A++) {
      const l = (A + 1 - n) / r;
      (xp.copy(yc).addScaledVector(lA, Gt.clamp(l, 0, t)),
        this.spawnTrailParticle(xp));
    }
    this.previousNozzle.copy(e);
  }
  spawnTrailParticle(e) {
    const t = this.trailHead;
    this.trailHead = (t + 1) % yi;
    const n = t * 3,
      r = t * 2;
    ((this.trail.offsets[n] = e.x),
      (this.trail.offsets[n + 1] = e.y),
      (this.trail.offsets[n + 2] = e.z),
      (this.trailVelocity[n] = 0),
      (this.trailVelocity[n + 1] = 0),
      (this.trailVelocity[n + 2] = 0),
      (this.trailAcceleration[t] = 15 + Math.random() * 15),
      (this.trailBaseSize[r] = 16 + Math.random() * 6),
      (this.trailBaseSize[r + 1] = this.trailBaseSize[r]),
      (this.trail.rotations[t] = Math.random() * Math.PI * 2),
      (this.trailAge[t] = 0),
      (this.trailParticlesActive = !0));
  }
  updateDrive(e) {
    let t = !1;
    for (let n = 0; n < ti; n++) {
      this.driveAge[n] += e;
      const r = this.driveAge[n] / U1,
        s = n * 3,
        a = n * 2;
      if (r >= 1) {
        ((this.drive.opacity[n] = 0),
          (this.drive.sizes[a] = this.drive.sizes[a + 1] = 0));
        continue;
      }
      ((t = !0),
        (this.drive.offsets[s] += this.driveVelocity[s] * e),
        (this.drive.offsets[s + 1] += this.driveVelocity[s + 1] * e),
        (this.drive.offsets[s + 2] += this.driveVelocity[s + 2] * e));
      const o = (1 + r * 1.5) * (1 - r * r);
      ((this.drive.sizes[a] = this.driveBaseSize[a] * o),
        (this.drive.sizes[a + 1] = this.driveBaseSize[a + 1] * o),
        (this.drive.opacity[n] = 0.5 * (1 - r)),
        (this.drive.life[n] = r));
    }
    return t;
  }
  updateTrail(e) {
    let t = !1;
    for (let n = 0; n < yi; n++) {
      this.trailAge[n] += e;
      const r = this.trailAge[n] / H1,
        s = n * 3,
        a = n * 2;
      if (r >= 1) {
        ((this.trail.opacity[n] = 0),
          (this.trail.sizes[a] = this.trail.sizes[a + 1] = 0));
        continue;
      }
      ((t = !0),
        (this.trailVelocity[s + 1] += this.trailAcceleration[n] * e),
        (this.trail.offsets[s + 1] += this.trailVelocity[s + 1] * e));
      const o = (0.65 + 0.6 * Math.sin(r * Math.PI)) * (1 - r * r);
      ((this.trail.sizes[a] = this.trailBaseSize[a] * o),
        (this.trail.sizes[a + 1] = this.trailBaseSize[a + 1] * o),
        (this.trail.opacity[n] = 0.9 * (1 - Gt.smoothstep(r, 0.65, 1))),
        (this.trail.life[n] = r));
    }
    return t;
  }
}

export { BoostEffect };
