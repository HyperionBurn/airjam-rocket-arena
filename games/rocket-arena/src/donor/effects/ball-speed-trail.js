import { _ } from "../core/class-fields.js";
import { Ct, Ee, F, Gr, Gt, Ht, Lt, Ne, Pm, Ut, bd, dt, li, qa, yd, zt } from "../vendor/three.js";

const Mp = 2e3;

const oS = 3;

const AS = 4;

const lS = 15;

const Bp = 1;

const cS = 64;

const hS = 0.2;

const zh = 60;

const Es = zh + 1;

const dS = 1024;

const Cc = 0.25;

const uS = 256;

function fS() {
  const i = document.createElement("canvas");
  i.width = i.height = 64;
  const e = i.getContext("2d"),
    t = e.createRadialGradient(32, 32, 0, 32, 32, 32);
  (t.addColorStop(0, "rgba(255,255,255,1)"),
    t.addColorStop(0.28, "rgba(220,239,255,0.82)"),
    t.addColorStop(0.7, "rgba(139,190,255,0.18)"),
    t.addColorStop(1, "rgba(100,160,255,0)"),
    (e.fillStyle = t),
    e.fillRect(0, 0, 64, 64));
  const n = new bd(i);
  return ((n.colorSpace = Ht), n);
}

class BallSpeedTrail {
  constructor() {
    _(this, "object", new dt());
    _(this, "geometry", new Ct());
    _(this, "material");
    _(this, "ribbon");
    _(this, "activationGlow");
    _(this, "points", []);
    _(
      this,
      "pointPool",
      Array.from({ length: zh }, () => ({ position: new F(), age: 0 })),
    );
    _(this, "positions", new Float32Array(Es * 2 * 3));
    _(this, "across", new Float32Array(Es * 2));
    _(this, "lifeAlpha", new Float32Array(Es * 2));
    _(this, "indices", new Uint16Array((Es - 1) * 6));
    _(this, "positionAttribute", new zt(this.positions, 3));
    _(this, "lifeAlphaAttribute", new zt(this.lifeAlpha, 1));
    _(this, "sourcePosition", new F());
    _(this, "previousSourcePosition", new F());
    _(this, "cameraPosition", new F());
    _(this, "tangent", new F());
    _(this, "viewDirection", new F());
    _(this, "side", new F());
    _(this, "fallbackAxis", new F(0, 1, 0));
    _(this, "hasSourcePosition", !1);
    _(this, "emissionClock", 0);
    _(this, "opacity", 0);
    _(this, "hasSpawnedStartupGlow", !1);
    _(this, "activationGlowAge", Cc);
    _(this, "timeDilation", 1);
    _(this, "geometryDirty", !0);
    ((this.object.name = "ball-speed-trail"),
      (this.material = new Lt({
        transparent: !0,
        depthWrite: !1,
        side: Ut,
        blending: Gr,
        uniforms: {
          uOpacity: { value: 0 },
          uColor: { value: new Ne(15398399) },
        },
        vertexShader: `
        attribute float aAcross;
        attribute float aLifeAlpha;
        varying float vAcross;
        varying float vLifeAlpha;
        void main() {
          vAcross = aAcross;
          vLifeAlpha = aLifeAlpha;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
        fragmentShader: `
        uniform float uOpacity;
        uniform vec3 uColor;
        varying float vAcross;
        varying float vLifeAlpha;
        void main() {
          // The recovered 64uu Size.X is the ribbon envelope, not a 64uu
          // opaque band. Preserve that geometry while matching the material's
          // much narrower cross-ribbon luminous profile.
          float crossSection = 1.0 - smoothstep(0.0, 0.32, abs(vAcross));
          float alpha = uOpacity * vLifeAlpha * crossSection;
          if (alpha < 0.003) discard;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      })),
      (this.material.toneMapped = !0));
    for (let t = 0; t < Es; t += 1)
      ((this.across[t * 2] = -1), (this.across[t * 2 + 1] = 1));
    for (let t = 0; t < Es - 1; t += 1) {
      const n = t * 6,
        r = t * 2;
      ((this.indices[n] = r),
        (this.indices[n + 1] = r + 2),
        (this.indices[n + 2] = r + 1),
        (this.indices[n + 3] = r + 1),
        (this.indices[n + 4] = r + 2),
        (this.indices[n + 5] = r + 3));
    }
    (this.positionAttribute.setUsage(qa),
      this.lifeAlphaAttribute.setUsage(qa),
      this.geometry.setAttribute("position", this.positionAttribute),
      this.geometry.setAttribute("aAcross", new zt(this.across, 1)),
      this.geometry.setAttribute("aLifeAlpha", this.lifeAlphaAttribute),
      this.geometry.setIndex(new zt(this.indices, 1)),
      this.geometry.setDrawRange(0, 0),
      (this.ribbon = new Ee(this.geometry, this.material)),
      (this.ribbon.name = "SpeedTrail_PS-ribbon"),
      (this.ribbon.frustumCulled = !1),
      (this.ribbon.renderOrder = 1));
    const e = new yd({
      map: fS(),
      color: 15332863,
      transparent: !0,
      opacity: 0,
      blending: li,
      depthWrite: !1,
      toneMapped: !0,
    });
    ((this.activationGlow = new Pm(e)),
      (this.activationGlow.name = "SpeedTrail_PS-activation-glow"),
      this.activationGlow.scale.setScalar(uS),
      (this.activationGlow.visible = !1),
      (this.activationGlow.renderOrder = 2),
      this.object.add(this.ribbon, this.activationGlow));
  }
  reset() {
    for (; this.points.length; ) this.pointPool.push(this.points.pop());
    ((this.emissionClock = 0),
      (this.hasSourcePosition = !1),
      (this.opacity = 0),
      this.geometry.setDrawRange(0, 0),
      (this.geometryDirty = !0));
  }
  update(e, t, n) {
    const r = Math.max(0, Math.min(n, 0.1)),
      s = t.length(),
      a = s >= Mp;
    this.timeDilation = Gt.clamp(s / Mp, 1, AS);
    const o = a ? 1 : 0;
    if (
      ((this.opacity += (o - this.opacity) * Math.min(1, r * oS)),
      Math.abs(this.opacity - o) < 5e-4 && (this.opacity = o),
      (this.material.uniforms.uOpacity.value = this.opacity * hS),
      this.hasSourcePosition ||
        (this.sourcePosition.copy(e),
        this.previousSourcePosition.copy(e),
        (this.hasSourcePosition = !0)),
      e.distanceTo(this.previousSourcePosition) > dS)
    ) {
      for (; this.points.length > 0; ) this.pointPool.push(this.points.pop());
      ((this.emissionClock = 0), this.previousSourcePosition.copy(e));
    }
    const l = r * this.timeDilation;
    for (let c = 0; c < this.points.length; c += 1) this.points[c].age += l;
    for (
      ;
      this.points.length && this.points[this.points.length - 1].age >= Bp;

    )
      this.pointPool.push(this.points.pop());
    if (a) {
      this.emissionClock += l;
      const c = 1 / lS;
      for (; this.emissionClock >= c; ) {
        this.emissionClock -= c;
        const h = this.emissionClock / this.timeDilation,
          d = r > 0 ? Gt.clamp(1 - h / r, 0, 1) : 1,
          u =
            this.points.length >= zh ? this.points.pop() : this.pointPool.pop();
        (u.position.lerpVectors(this.previousSourcePosition, e, d),
          (u.age = this.emissionClock),
          this.points.unshift(u));
      }
    }
    if (
      (this.sourcePosition.copy(e),
      this.previousSourcePosition.copy(e),
      this.hasSpawnedStartupGlow ||
        ((this.hasSpawnedStartupGlow = !0),
        (this.activationGlowAge = 0),
        this.activationGlow.position.copy(e),
        (this.activationGlow.visible = !0)),
      this.activationGlowAge < Cc)
    ) {
      this.activationGlowAge += l;
      const c = Gt.clamp(this.activationGlowAge / Cc, 0, 1);
      ((this.activationGlow.material.opacity = (1 - c) * (1 - c)),
        (this.activationGlow.visible = c < 1));
    } else this.activationGlow.visible = !1;
    ((this.ribbon.visible = this.opacity > 0.002 && this.points.length > 0),
      (this.geometryDirty = !0));
  }
  prepare(e) {
    this.rebuildGeometry(e);
  }
  rebuildGeometry(e) {
    if (!this.geometryDirty || !this.ribbon.visible) return;
    this.geometryDirty = !1;
    const t = this.points.length + 1;
    if (t < 2) {
      this.geometry.setDrawRange(0, 0);
      return;
    }
    e.getWorldPosition(this.cameraPosition);
    const n = cS * 0.5;
    for (let r = 0; r < t; r += 1) {
      const s = r === 0 ? null : this.points[r - 1],
        a = (s == null ? void 0 : s.position) ?? this.sourcePosition,
        o = Math.max(0, r - 1),
        A = Math.min(t - 1, r + 1),
        l = o === 0 ? this.sourcePosition : this.points[o - 1].position,
        c = A === 0 ? this.sourcePosition : this.points[A - 1].position;
      (this.tangent.subVectors(c, l).normalize(),
        this.viewDirection.subVectors(this.cameraPosition, a).normalize(),
        this.side.crossVectors(this.tangent, this.viewDirection),
        this.side.lengthSq() < 1e-6 &&
          (this.side.crossVectors(this.tangent, this.fallbackAxis),
          this.side.lengthSq() < 1e-6 && this.side.set(1, 0, 0)),
        this.side.normalize().multiplyScalar(n));
      const h = Math.pow(
        1 - Gt.clamp(((s == null ? void 0 : s.age) ?? 0) / Bp, 0, 1),
        1.35,
      );
      for (let d = 0; d < 2; d += 1) {
        const u = r * 2 + d,
          p = d === 0 ? -1 : 1;
        ((this.positions[u * 3] = a.x + this.side.x * p),
          (this.positions[u * 3 + 1] = a.y + this.side.y * p),
          (this.positions[u * 3 + 2] = a.z + this.side.z * p),
          (this.lifeAlpha[u] = h));
      }
    }
    ((this.positionAttribute.needsUpdate = !0),
      (this.lifeAlphaAttribute.needsUpdate = !0),
      this.geometry.setDrawRange(0, (t - 1) * 6));
  }
}

export { BallSpeedTrail };
