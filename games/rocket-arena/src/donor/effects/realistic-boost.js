import { createRocketPlume } from './rocket-plume.js';
import { _ } from "../core/class-fields.js";
import { Ai, Ao, Ct, Ee, F, Gr, Gt, Ht, Ke, Lt, Ne, Ut, al, ci, dt, li, qa, un } from "../vendor/three.js";

const Jd = "/assets/golden-boost";

const E1 = `${Jd}/plume.webp`;

const y1 = `${Jd}/turbulence.webp`;

const x1 = `${Jd}/sparks.webp`;

const Ei = 160;

const ei = 32;

const C1 = 1;

const b1 = 0.5;

const S1 = 32;

const w1 = 10;

const pp = 24;

const M1 = new Float32Array([
    0.047923, 0.4878, 0.696485, 0.776236, 0.823334, 0.865453, 0.901153,
    0.930914, 0.955217, 0.974545, 0.989377, 1.000196, 1.007483, 1.011718,
    1.013383, 1.012959, 1.010928, 1.00777, 1.003967, 1, 1,
  ]);

const B1 = new Float32Array([
    0, 0.052264, 0.18705, 0.371348, 0.572152, 0.75645, 0.891236, 0.9435,
    0.933541, 0.905905, 0.863957, 0.811057, 0.75057, 0.685858, 0.620283,
    0.55721, 0.5, 0.391974, 0.223421, 0.068158, 0,
  ]);

const k1 = new Float32Array([
    0.989099, 0.963349, 0.89434, 0.794431, 0.675982, 0.551353, 0.432905,
    0.332996, 0.263987, 0.238237,
  ]);

const T1 = new Float32Array([
    1, 1.02175, 1.084, 1.18225, 1.312, 1.46875, 1.648, 1.84525, 2.056, 2.27575,
    2.5, 2.72425, 2.944, 3.15475, 3.352, 3.53125, 3.688, 3.81775, 3.916,
    3.97825, 4,
  ]);

const R1 = new Float32Array([
    2, 1.9855, 1.944, 1.8785, 1.792, 1.6875, 1.568, 1.4365, 1.296, 1.1495, 1,
    0.8505, 0.704, 0.5635, 0.432, 0.3125, 0.208, 0.1215, 0.056, 0.0145, 0,
  ]);

const P1 = new Float32Array([
    0.25, 0.2481875, 0.243, 0.2348125, 0.224, 0.2109375, 0.196, 0.1795625,
    0.162, 0.1436875, 0.125, 0.1063125, 0.088, 0.0704375, 0.054, 0.0390625,
    0.026, 0.0151875, 0.007, 0.0018125, 0,
  ]);

const mp = new Float32Array([
    0, 0.147955, 0.548288, 1.135698, 1.844884, 2.610548, 3.367389, 4.050106,
    4.593399, 4.931969, 5.000516, 4.788702, 4.367, 3.7901, 3.112689, 2.389455,
    1.675084, 1.024267, 0.491688, 0.132037, 0,
  ]);

const gp = new Float32Array([
    0, 0.104, 0.352, 0.648, 0.896, 1, 0.99363, 0.975704, 0.948, 0.912296,
    0.87037, 0.824, 0.774963, 0.725037, 0.676, 0.62963, 0.587704, 0.552,
    0.524296, 0.50637, 0.5,
  ]);

const I1 = new Float32Array([
    1, 0.9748, 0.9064, 0.8056, 0.6832, 0.55, 0.4168, 0.2944, 0.1936, 0.1252,
    0.1,
  ]);

const L1 = new Float32Array([
    0.25, 0.271, 0.328, 0.412, 0.514, 0.625, 0.736, 0.838, 0.922, 0.979, 1,
  ]);

const ga = 1;

const vc = new Ne().setRGB(2.5, 1, 0.125);

const jc = new F();

const vp = new F();

const _c = new F();

const aA = new F();

const oA = ["aOffset", "aSize", "aOpacity", "aColorScale", "aDynamic", "aRotation"];

function Dn(i, e) {
  const t = Gt.clamp(e, 0, 1) * (i.length - 1),
    n = Math.min(i.length - 2, Math.floor(t));
  return Gt.lerp(i[n], i[n + 1], t - n);
}

let jp = class {
  constructor(e, t, n) {
    _(this, "mesh");
    _(this, "offsets");
    _(this, "sizes");
    _(this, "opacity");
    _(this, "colorScale");
    _(this, "dynamic");
    _(this, "rotations");
    ((this.offsets = new Float32Array(e * 3)),
      (this.sizes = new Float32Array(e * 2)),
      (this.opacity = new Float32Array(e)),
      (this.colorScale = new Float32Array(e).fill(1)),
      (this.dynamic = new Float32Array(e * 4)),
      (this.rotations = new Float32Array(e)));
    const r = new al();
    (r.setAttribute(
      "position",
      new Ke([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3),
    ),
      r.setAttribute("uv", new Ke([0, 0, 1, 0, 1, 1, 0, 1], 2)),
      r.setIndex([0, 1, 2, 0, 2, 3]),
      r.setAttribute("aOffset", new un(this.offsets, 3)),
      r.setAttribute("aSize", new un(this.sizes, 2)),
      r.setAttribute("aOpacity", new un(this.opacity, 1)),
      r.setAttribute("aColorScale", new un(this.colorScale, 1)),
      r.setAttribute("aDynamic", new un(this.dynamic, 4)),
      r.setAttribute("aRotation", new un(this.rotations, 1)));
    for (let a = 0; a < oA.length; a += 1) r.attributes[oA[a]].setUsage(qa);
    r.instanceCount = e;
    const s = new Lt({
      uniforms: {
        cloudMap: { value: t.cloud },
        dustMap: { value: t.dust },
        grainMap: { value: t.grain },
        smokeMap: { value: t.smoke },
        time: { value: 0 },
      },
      vertexShader: `
        attribute vec3 aOffset;
        attribute vec2 aSize;
        attribute float aOpacity;
        attribute float aColorScale;
        attribute vec4 aDynamic;
        attribute float aRotation;
        varying vec2 vUv;
        varying vec4 vParticleColor;
        varying vec4 vDynamic;
        void main() {
          vec4 viewPosition = modelViewMatrix * vec4(aOffset, 1.0);
          float rotationSin = sin(aRotation);
          float rotationCos = cos(aRotation);
          vec2 corner = position.xy * aSize;
          viewPosition.xy += vec2(
            rotationCos * corner.x - rotationSin * corner.y,
            rotationSin * corner.x + rotationCos * corner.y
          );
          gl_Position = projectionMatrix * viewPosition;
          vUv = uv;
          vParticleColor = vec4(
            vec3(${vc.r}, ${vc.g}, ${vc.b}) * aColorScale,
            aOpacity
          );
          vDynamic = aDynamic;
        }
      `,
      fragmentShader: `
        uniform sampler2D cloudMap;
        uniform sampler2D dustMap;
        uniform sampler2D grainMap;
        uniform sampler2D smokeMap;
        uniform float time;
        varying vec2 vUv;
        varying vec4 vParticleColor;
        // Cascade order: DistortionAmount, Brightness, SoftAmount, NoiseAmount.
        // The particle shader consumes the brightness and noise channels.
        varying vec4 vDynamic;
        void main() {
          // Literal translation of the installed build's
          // Golden Boost particle fragment mix.
          float angle = -0.125 * time;
          float cs = cos(angle);
          float sn = sin(angle);
          vec2 centered = vUv * 0.5 - 0.5;
          vec2 smokeUv = vec2(
            dot(vec2(cs, -sn), centered),
            dot(vec2(sn,  cs), centered)
          ) + 0.5;

          vec2 smoke = texture2D(smokeMap, smokeUv).rg;
          vec2 distortedUv = vUv + smoke * 0.08;

          vec3 grain = max(abs(texture2D(grainMap, distortedUv).rgb), vec3(0.000001));
          vec3 grain2 = grain * grain;
          grain *= grain2;
          grain2 *= grain2;
          grain *= grain2;
          grain2 *= grain2;
          grain *= grain2 * 50.0;

          float cloud = texture2D(cloudMap, distortedUv).r;
          vec2 dustPan = fract(time * vec2(0.1, 0.5));
          vec3 dust = texture2D(dustMap, distortedUv + dustPan).rgb;
          float dustOffset = dust.r - 0.2;
          vec3 shaped = (dust + vec3(0.5 * dustOffset)) * dust + vec3(vDynamic.w);
          shaped = clamp(shaped * cloud, 0.0, 1.0) * 3.0;

          vec3 signal = cloud * grain + shaped;
          float alpha = clamp(2.0 * (vParticleColor.a * shaped.r - 0.01), 0.0, 1.0);
          vec3 color = vDynamic.y * signal * vParticleColor.rgb;
          gl_FragColor = vec4(color, alpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      transparent: !0,
      blending: Gr,
      depthWrite: !1,
      toneMapped: !0,
    });
    ((s.name = "Realistic / textured exhaust particles"),
      (this.mesh = new Ee(r, s)),
      (this.mesh.frustumCulled = !1),
      (this.mesh.renderOrder = n));
  }
  setTime(e) {
    this.mesh.material.uniforms.time.value = e;
  }
  markDirty() {
    for (let e = 0; e < oA.length; e += 1) {
      const t = oA[e];
      this.mesh.geometry.attributes[t].needsUpdate = !0;
    }
  }
};

function F1(i, e) {
  return (
    (i.colorSpace = Ht),
    (i.anisotropy = 4),
    e && (i.wrapS = i.wrapT = ci),
    i
  );
}

let AA = null;

function _p() {
  if (AA) return AA;
  const i = new Ao(),
    e = [],
    t = (o, A) => {
      let l;
      return (
        e.push(
          new Promise((c, h) => {
            l = F1(
              i.load(o, () => c(), void 0, h),
              A,
            );
          }),
        ),
        l
      );
    },
    n = t(E1, !1),
    r = t(y1, !0),
    s = t(x1, !0),
    a = Promise.all(e).then(() => {});
  return (
    a.catch(() => {}),
    (AA = {
      textures: { cloud: n, dust: r, grain: r, smoke: r },
      water: r,
      particleSheet: s,
      ready: a,
    }),
    AA
  );
}

function G1(i) {
  const e = new Ct();
  e.setAttribute("position", new Ke(i.toArray(), 3));
  const t = new Lt({
      uniforms: { intensity: { value: 0 } },
      vertexShader: `
      uniform float intensity;
      varying float vIntensity;
      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * viewPosition;
        gl_PointSize = 45.0 * (500.0 / max(1.0, -viewPosition.z));
        vIntensity = intensity;
      }
    `,
      fragmentShader: `
      varying float vIntensity;
      void main() {
        vec2 p = gl_PointCoord - 0.5;
        float r = length(p) * 2.0;
        float core = exp(-r * r * 18.0);
        float halo = exp(-r * r * 4.2) * 0.32;
        float alpha = (core + halo) * vIntensity;
        if (alpha < 0.003) discard;
        // BoostFlare_LF / LensFlareComponent_0.SourceColor.
        gl_FragColor = vec4(vec3(4.5, 0.9375, 0.15) * (core + halo), alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
      transparent: !0,
      blending: li,
      depthWrite: !1,
      toneMapped: !0,
    }),
    n = new Ai(e, t);
  return ((n.frustumCulled = !1), (n.renderOrder = 7), n);
}

class O1 {
  constructor(e, t, n, r) {
    _(this, "car");
    _(this, "nozzleLocal");
    _(this, "cone", new dt());
    _(this, "coneMaterials", []);
    _(this, "drive");
    _(this, "trail");
    _(this, "lensFlare");
    _(this, "light");
    _(this, "driveAge", new Float32Array(ei).fill(1 / 0));
    _(this, "driveBaseSize", new Float32Array(ei * 2));
    _(this, "driveVelocity", new Float32Array(ei * 3));
    _(this, "driveHead", 0);
    _(this, "driveSpawnAccumulator", 0);
    _(this, "driveParticlesActive", !1);
    _(this, "trailAge", new Float32Array(Ei).fill(1 / 0));
    _(this, "trailBaseSize", new Float32Array(Ei * 2));
    _(this, "trailAcceleration", new Float32Array(Ei));
    _(this, "trailVelocity", new Float32Array(Ei * 3));
    _(this, "trailHead", 0);
    _(this, "trailParticlesActive", !1);
    _(this, "previousNozzle", new F());
    _(this, "hasPreviousNozzle", !1);
    _(this, "spawnRemainder", 0);
    _(this, "elapsed", 0);
    _(this, "coneOpacity", 0);
    ((this.car = t), (this.nozzleLocal = n.clone()), (this.light = r));
    const { textures: s } = _p();
    ((this.drive = new jp(ei, s, 5)),
      this.drive.mesh.layers.enable(ga),
      (this.drive.mesh.visible = !1),
      t.add(this.drive.mesh),
      (this.trail = new jp(Ei, s, 4)),
      this.trail.mesh.layers.enable(ga),
      (this.trail.mesh.visible = !1),
      e.add(this.trail.mesh),
      (this.cone.name = "realistic-boost-flame"),
      (this.drive.mesh.name = "realistic-drive-puffs"),
      (this.trail.mesh.name = "realistic-boost-trail"),
      this.cone.position.copy(this.nozzleLocal),
      this.cone.layers.enable(ga),
      (this.cone.visible = !1),
      t.add(this.cone));
    for(const mesh of createRocketPlume()){
      mesh.layers.enable(ga);this.coneMaterials.push(mesh.material);this.cone.add(mesh);
    }
    ((this.lensFlare = G1(this.nozzleLocal.clone().add(new F(-2, 0, 0)))),
      this.lensFlare.layers.enable(ga),
      (this.lensFlare.visible = !1),
      t.add(this.lensFlare));
  }
  get bloomActive() {
    return (
      this.coneOpacity > 0.002 ||
      this.driveParticlesActive ||
      this.trailParticlesActive
    );
  }
  async preload() {
    await _p().ready;
  }
  update(e, t, n, r) {
    const s = e && n,
      a = t && !e && n;
    this.elapsed += r;
    const o = s ? 28 : 16;
    ((this.coneOpacity = Gt.damp(this.coneOpacity, s ? 1 : 0, o, r)),
      (this.cone.visible = this.coneOpacity > 0.002));
    for (const A of this.coneMaterials)
      ((A.uniforms.time.value = this.elapsed),
        (A.uniforms.opacity.value = this.coneOpacity));
    ((this.lensFlare.visible = this.cone.visible),
      (this.lensFlare.material.uniforms.intensity.value = this.coneOpacity),
      this.light.color.setRGB(1, 0.6689812541, 0.08848005533),
      (this.light.intensity =
        this.coneOpacity * (1200 + 110 * Math.sin(this.elapsed * 23))),
      a ? this.spawnDrive(r) : (this.driveSpawnAccumulator = 0),
      s
        ? (this.car.updateMatrixWorld(),
          jc.copy(this.nozzleLocal),
          this.car.localToWorld(jc),
          this.spawnTrailByDistance(jc))
        : ((this.hasPreviousNozzle = !1), (this.spawnRemainder = 0)),
      this.driveParticlesActive &&
        ((this.driveParticlesActive = this.updateDrive(r)),
        (this.drive.mesh.visible = this.driveParticlesActive),
        this.drive.setTime(this.elapsed),
        this.drive.markDirty()),
      this.trailParticlesActive &&
        ((this.trailParticlesActive = this.updateTrail(r)),
        (this.trail.mesh.visible = this.trailParticlesActive),
        this.trail.setTime(this.elapsed),
        this.trail.markDirty()));
  }
  reset() {
    (this.driveAge.fill(1 / 0),
      this.trailAge.fill(1 / 0),
      this.drive.opacity.fill(0),
      this.trail.opacity.fill(0),
      this.drive.markDirty(),
      this.trail.markDirty(),
      (this.coneOpacity = 0),
      (this.cone.visible = this.lensFlare.visible = !1),
      (this.drive.mesh.visible = this.trail.mesh.visible = !1),
      (this.driveParticlesActive = this.trailParticlesActive = !1),
      (this.hasPreviousNozzle = !1),
      (this.spawnRemainder = this.driveSpawnAccumulator = 0));
  }
  spawnDrive(e) {
    ((this.driveSpawnAccumulator += e * w1),
      Number.isFinite(this.driveAge[(this.driveHead + ei - 1) % ei]) ||
        (this.driveSpawnAccumulator = Math.max(this.driveSpawnAccumulator, 1)));
    let t = 0;
    for (; this.driveSpawnAccumulator >= 1 && t < pp; ) {
      this.driveSpawnAccumulator -= 1;
      const n = this.driveHead;
      this.driveHead = (n + 1) % ei;
      const r = n * 3,
        s = n * 2;
      ((this.drive.offsets[r] = this.nozzleLocal.x),
        (this.drive.offsets[r + 1] = this.nozzleLocal.y),
        (this.drive.offsets[r + 2] = this.nozzleLocal.z),
        (this.driveVelocity[r] = -(50 + Math.random() * 50)),
        (this.driveVelocity[r + 1] = -5 + Math.random() * 10),
        (this.driveVelocity[r + 2] = -5 + Math.random() * 10),
        (this.driveBaseSize[s] = 6.5 + Math.random() * 6),
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
    (_c.copy(this.previousNozzle), aA.subVectors(e, _c));
    const t = aA.length();
    if (t < 1e-4) return;
    if ((aA.divideScalar(t), t > 600)) {
      (this.previousNozzle.copy(e), (this.spawnRemainder = 0));
      return;
    }
    const n = this.spawnRemainder,
      s = (Math.random() * 4) / S1,
      a = n + t * s,
      o = Math.floor(a),
      A = Math.min(o, pp);
    if (((this.spawnRemainder = a - o), s > 0))
      for (let l = 0; l < A; l++) {
        const c = (l + 1 - n) / s;
        (vp.copy(_c).addScaledVector(aA, Gt.clamp(c, 0, t)),
          this.spawnTrailParticle(vp));
      }
    this.previousNozzle.copy(e);
  }
  spawnTrailParticle(e) {
    const t = this.trailHead;
    this.trailHead = (t + 1) % Ei;
    const n = t * 3,
      r = t * 2;
    ((this.trail.offsets[n] = e.x),
      (this.trail.offsets[n + 1] = e.y),
      (this.trail.offsets[n + 2] = e.z),
      (this.trailVelocity[n] = 0),
      (this.trailVelocity[n + 1] = 0),
      (this.trailVelocity[n + 2] = 0),
      (this.trailAcceleration[t] = 15 + Math.random() * 15),
      (this.trailBaseSize[r] = 35 + Math.random() * 15),
      (this.trailBaseSize[r + 1] = this.trailBaseSize[r]),
      (this.trail.rotations[t] = Math.random() * Math.PI * 2),
      (this.trailAge[t] = 0),
      (this.trailParticlesActive = !0));
  }
  updateDrive(e) {
    let t = !1;
    for (let n = 0; n < ei; n++) {
      this.driveAge[n] += e;
      const r = this.driveAge[n] / b1,
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
      const o = Dn(T1, r);
      ((this.drive.sizes[a] = this.driveBaseSize[a] * o),
        (this.drive.sizes[a + 1] = this.driveBaseSize[a + 1] * o),
        (this.drive.opacity[n] = Dn(P1, r)),
        (this.drive.colorScale[n] = Dn(R1, r)));
      const A = n * 4;
      ((this.drive.dynamic[A] = Dn(mp, r)),
        (this.drive.dynamic[A + 1] = Dn(gp, r)),
        (this.drive.dynamic[A + 2] = 1),
        (this.drive.dynamic[A + 3] = Dn(L1, r)));
    }
    return t;
  }
  updateTrail(e) {
    let t = !1;
    for (let n = 0; n < Ei; n++) {
      this.trailAge[n] += e;
      const r = this.trailAge[n] / C1,
        s = n * 3,
        a = n * 2;
      if (r >= 1) {
        ((this.trail.opacity[n] = 0),
          (this.trail.sizes[a] = this.trail.sizes[a + 1] = 0));
        continue;
      }
      t = !0;
      const o = Dn(k1, r);
      ((this.trailVelocity[s + 2] += this.trailAcceleration[n] * e),
        (this.trail.offsets[s] += this.trailVelocity[s] * o * e),
        (this.trail.offsets[s + 1] += this.trailVelocity[s + 1] * o * e),
        (this.trail.offsets[s + 2] += this.trailVelocity[s + 2] * o * e),
        (this.trail.sizes[a] = this.trailBaseSize[a] * Dn(M1, r)),
        (this.trail.sizes[a + 1] = this.trailBaseSize[a + 1]),
        (this.trail.opacity[n] = Dn(B1, r)),
        (this.trail.colorScale[n] = 1));
      const A = n * 4;
      ((this.trail.dynamic[A] = Dn(mp, r)),
        (this.trail.dynamic[A + 1] = Dn(gp, r)),
        (this.trail.dynamic[A + 2] = 1),
        (this.trail.dynamic[A + 3] = Dn(I1, r)));
    }
    return t;
  }
}

export { O1 };
