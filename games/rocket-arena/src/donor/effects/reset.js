import { _ } from "../core/class-fields.js";
import { Ai, Ct, Ee, Gt, Lt, Ne, Rd, Ur, Ut, Ya, cn, dt, il, li, ui, zt } from "../vendor/three.js";
import { getTheme } from "../rendering/theme.js";
import { Ti } from "../audio/boost.js";
import { ResetAudio, Vp, Wp, Xp, gw, mw, vw, ys } from "../audio/reset.js";

function _w() {
  const i = new il();
  for (let e = 0; e < 8; e++) {
    const t = Math.PI / 2 + (e * Math.PI) / 4,
      n = e % 2 === 0 ? 1 : 0.25,
      r = Math.cos(t) * n,
      s = Math.sin(t) * n;
    e === 0 ? i.moveTo(r, s) : i.lineTo(r, s);
  }
  return (i.closePath(), new Rd(i));
}

function Ew() {
  return new Lt({
    name: "Arcade / reset sparkles",
    uniforms: {
      opacity: { value: 0 },
      size: { value: 20 },
      viewportHeight: { value: 1 },
      realistic: { value: 0 },
    },
    vertexShader: `
      #include <common>
      uniform float size;
      uniform float viewportHeight;
      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * viewPosition;
        gl_PointSize = size * projectionMatrix[1][1] * viewportHeight * 0.5;
        if (isPerspectiveMatrix(projectionMatrix)) gl_PointSize /= max(1.0, -viewPosition.z);
      }
    `,
    fragmentShader: `
      uniform float opacity;
      uniform float realistic;
      void main() {
        vec2 p = abs(gl_PointCoord * 2.0 - 1.0);
        float d = sqrt(p.x) + sqrt(p.y);
        float aa = max(fwidth(d), 0.02);
        float alpha = (1.0 - smoothstep(1.0 - aa, 1.0 + aa, d)) * opacity;
        float inside = 1.0 - smoothstep(0.74 - aa, 0.74 + aa, d);
        vec3 color = mix(vec3(0.02, 0.15, 0.38), vec3(1.8, 1.6, 1.0), inside);
        if (realistic > 0.5) {
          float glow = exp(-dot(p, p) * 7.0);
          float streak = exp(-p.x * p.x * 170.0 - p.y * p.y * 5.0)
            + exp(-p.y * p.y * 170.0 - p.x * p.x * 5.0);
          alpha = (glow * 0.65 + streak * 0.35) * opacity;
          color = vec3(0.72, 1.0, 0.82);
        }
        if (alpha < 0.003) discard;
        gl_FragColor = vec4(color, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    transparent: !0,
    depthWrite: !1,
    toneMapped: !0,
  });
}

function yw(i) {
  i.traverse((e) => e.layers.enable(Ti));
}

function Jp(i) {
  return new Lt({
    name: "Realistic / reset glow",
    uniforms: { color: { value: i }, opacity: { value: 0 } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float opacity;
      varying vec2 vUv;
      void main() {
        float radius = length(vUv * 2.0 - 1.0);
        float glow = mix(1.0, 0.72, smoothstep(0.0, 0.46, radius));
        glow = mix(glow, 0.18, smoothstep(0.46, 0.72, radius));
        glow *= 1.0 - smoothstep(0.72, 1.0, radius);
        gl_FragColor = vec4(color, opacity * glow);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    transparent: !0,
    blending: li,
    depthWrite: !1,
    side: Ut,
    toneMapped: !0,
  });
}

class ResetEffect {
  constructor(e) {
    _(this, "root", new dt());
    _(this, "ring");
    _(this, "core");
    _(this, "outlineMaterial");
    _(this, "sparksGeometry", new Ct());
    _(this, "sparksMaterial");
    _(this, "sparks");
    _(this, "sparkPositions", new Float32Array(ys * 3));
    _(this, "sparkOrigins", new Float32Array(ys * 3));
    _(this, "sparkVelocities", new Float32Array(ys * 3));
    _(this, "audio", new ResetAudio());
    _(this, "realistic", new dt());
    _(this, "softRing");
    _(this, "softCore");
    _(this, "softDome");
    _(this, "previousResetSerial", null);
    _(this, "elapsed", 1 / 0);
    ((this.root.name = "flip-reset-indicator"),
      (this.root.position.y = mw),
      (this.root.visible = !1),
      e.add(this.root));
    const t = new cn({
      name: "Arcade / reset ring",
      color: vw,
      transparent: !0,
      opacity: 0,
      depthWrite: !1,
      side: Ut,
      toneMapped: !0,
    });
    ((this.ring = new Ee(new Ya(0.83, 1, 48), t)),
      (this.ring.rotation.x = -Math.PI / 2),
      (this.ring.renderOrder = 9),
      this.root.add(this.ring),
      (this.core = new Ee(_w(), t.clone())),
      this.core.material.color.setRGB(1.6, 1.4, 0.9),
      (this.core.rotation.x = -Math.PI / 2),
      (this.core.position.y = 0.5),
      (this.core.renderOrder = 10),
      this.root.add(this.core),
      (this.outlineMaterial = t.clone()),
      this.outlineMaterial.color.set(1460613));
    const n = new Ee(new Ya(0.78, 1.05, 48), this.outlineMaterial);
    ((n.renderOrder = 8),
      this.ring.add(n),
      this.sparksGeometry.setAttribute(
        "position",
        new zt(this.sparkPositions, 3),
      ),
      (this.sparksMaterial = Ew()),
      (this.sparks = new Ai(this.sparksGeometry, this.sparksMaterial)),
      (this.sparks.onBeforeRender = (a) => {
        (a.getCurrentViewport(Xp),
          (this.sparksMaterial.uniforms.viewportHeight.value = Xp.w));
      }),
      (this.sparks.frustumCulled = !1),
      (this.sparks.renderOrder = 10),
      this.root.add(this.sparks));
    const r = new Ne().setRGB(0.72, 1, 0.82),
      s = new ui(2, 2);
    ((this.softRing = new Ee(s, Jp(r))),
      (this.softRing.rotation.x = -Math.PI / 2),
      (this.softRing.renderOrder = 8),
      (this.softCore = new Ee(s, Jp(new Ne(16777215)))),
      (this.softCore.rotation.x = -Math.PI / 2),
      (this.softCore.position.y = 0.5),
      (this.softCore.renderOrder = 9),
      (this.softDome = new Ee(
        new Ur(1, 32, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
        new cn({
          name: "Realistic / reset dome",
          color: r,
          opacity: 0,
          transparent: !0,
          blending: li,
          depthWrite: !1,
          side: Ut,
        }),
      )),
      (this.softDome.renderOrder = 8),
      (this.realistic.name = "realistic-reset-pulse"),
      (this.realistic.visible = !1),
      this.realistic.add(this.softRing, this.softCore, this.softDome),
      this.root.add(this.realistic),
      yw(this.root));
  }
  preloadAudio() {
    return this.audio.preload();
  }
  get bloomActive() {
    return this.root.visible;
  }
  update(e, t, n) {
    const r =
      this.previousResetSerial !== null && t !== this.previousResetSerial && n;
    if (((this.previousResetSerial = t), r)) {
      this.play();
      return;
    }
    if (Number.isFinite(this.elapsed)) {
      if (((this.elapsed += e), this.elapsed >= Vp || !n)) {
        this.stopVisual();
        return;
      }
      this.updateVisual();
    }
  }
  play(e = !0) {
    ((this.elapsed = 0),
      (this.root.visible = !0),
      this.seedSparks(),
      e && this.audio.play(),
      this.updateVisual());
  }
  seedSparks() {
    for (let e = 0; e < ys; e += 1) {
      const t = e * 3,
        n = ((e + Math.random() * 0.25) / ys) * Math.PI * 2,
        r = 42 + Math.random() * 8,
        s = 100 + Math.random() * 60,
        a = -4 + Math.random() * 8;
      ((this.sparkOrigins[t] = Math.cos(n) * r),
        (this.sparkOrigins[t + 1] = a),
        (this.sparkOrigins[t + 2] = Math.sin(n) * r),
        (this.sparkVelocities[t] = Math.cos(n) * s),
        (this.sparkVelocities[t + 1] = 25 + Math.random() * 45),
        (this.sparkVelocities[t + 2] = Math.sin(n) * s),
        (this.sparkPositions[t] = this.sparkOrigins[t]),
        (this.sparkPositions[t + 1] = this.sparkOrigins[t + 1]),
        (this.sparkPositions[t + 2] = this.sparkOrigins[t + 2]));
    }
    this.sparksGeometry.attributes.position.needsUpdate = !0;
  }
  updateVisual() {
    const e = getTheme() === "realistic";
    ((this.ring.visible = this.core.visible = !e),
      (this.realistic.visible = e),
      (this.sparksMaterial.uniforms.realistic.value = e ? 1 : 0));
    const t = Gt.clamp(this.elapsed / Vp, 0, 1),
      n = Math.pow(1 - t, 1.65),
      r = 1 - Math.pow(1 - t, 3);
    (this.ring.scale.setScalar(48 + r * 58),
      (this.ring.material.opacity = 0.62 * n),
      (this.outlineMaterial.opacity = 0.8 * n),
      this.core.scale.setScalar(28 + r * 26),
      (this.core.rotation.z = r * 0.3),
      (this.core.material.opacity = 0.72 * Math.pow(1 - t, 2.5)),
      this.softRing.scale.setScalar(48 + r * 74),
      (this.softRing.material.uniforms.opacity.value = 0.62 * n),
      this.softCore.scale.setScalar(28 + r * 58),
      (this.softCore.material.uniforms.opacity.value =
        this.core.material.opacity),
      this.softDome.scale.setScalar(4.5 + r * 8.5),
      (this.softDome.material.opacity = 0.44 * n));
    const s = this.elapsed - gw,
      a = Gt.clamp(s / Wp, 0, 1);
    if (((this.sparks.visible = s >= 0 && s < Wp), this.sparks.visible)) {
      const o = -280 * s * s;
      for (let A = 0; A < ys; A += 1) {
        const l = A * 3;
        ((this.sparkPositions[l] =
          this.sparkOrigins[l] + this.sparkVelocities[l] * s),
          (this.sparkPositions[l + 1] =
            this.sparkOrigins[l + 1] + this.sparkVelocities[l + 1] * s + o),
          (this.sparkPositions[l + 2] =
            this.sparkOrigins[l + 2] + this.sparkVelocities[l + 2] * s));
      }
      ((this.sparksMaterial.uniforms.opacity.value = 1 - a * a),
        (this.sparksMaterial.uniforms.size.value = 20 * (1 - a * 0.65)),
        (this.sparksGeometry.attributes.position.needsUpdate = !0));
    }
  }
  stopVisual() {
    ((this.elapsed = 1 / 0),
      (this.root.visible = !1),
      (this.sparks.visible = !1),
      (this.ring.material.opacity = 0),
      (this.core.material.opacity = 0),
      (this.outlineMaterial.opacity = 0),
      (this.sparksMaterial.uniforms.opacity.value = 0),
      (this.softRing.material.uniforms.opacity.value = 0),
      (this.softCore.material.uniforms.opacity.value = 0),
      (this.softDome.material.opacity = 0));
  }
}

export { ResetEffect };
