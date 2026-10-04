import { _ } from "../core/class-fields.js";
import { Ee, Gt, Ke, Lt, al, dt, qa, ui, un } from "../vendor/three.js";
import { getTheme } from "../rendering/theme.js";

const ni = 12;

const Y1 = 1.05;

const Z1 = 0.18;

const Q1 = 1.2;

const eS = ["aOffset", "aSize", "aOpacity", "aWarmth", "aRotation"];

function tS() {
  const i = new al();
  return (
    i.setAttribute(
      "position",
      new Ke([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3),
    ),
    i.setAttribute("uv", new Ke([0, 0, 1, 0, 1, 1, 0, 1], 2)),
    i.setIndex([0, 1, 2, 0, 2, 3]),
    i
  );
}

class DemolitionEffect {
  constructor() {
    _(this, "object", new dt());
    _(this, "smoke");
    _(this, "flash");
    _(this, "offsets", new Float32Array(ni * 3));
    _(this, "sizes", new Float32Array(ni));
    _(this, "opacity", new Float32Array(ni));
    _(this, "warmth", new Float32Array(ni));
    _(this, "rotations", new Float32Array(ni));
    _(this, "wasDemolished", null);
    _(this, "elapsed", 1 / 0);
    ((this.object.name = "demolition-effect"), (this.object.visible = !1));
    const e = tS();
    for (const [n, r, s] of [
      ["aOffset", this.offsets, 3],
      ["aSize", this.sizes, 1],
      ["aOpacity", this.opacity, 1],
      ["aWarmth", this.warmth, 1],
      ["aRotation", this.rotations, 1],
    ])
      e.setAttribute(n, new un(r, s).setUsage(qa));
    e.instanceCount = ni;
    const t = new Lt({
      name: "Demolition / smoke",
      uniforms: { realistic: { value: 0 }, time: { value: 0 } },
      vertexShader: `
        attribute vec3 aOffset;
        attribute float aSize;
        attribute float aOpacity;
        attribute float aWarmth;
        attribute float aRotation;
        varying vec2 vUv;
        varying float vOpacity;
        varying float vWarmth;
        void main() {
          vec4 viewPosition = modelViewMatrix * vec4(aOffset, 1.0);
          float s = sin(aRotation), c = cos(aRotation);
          vec2 corner = position.xy * aSize;
          viewPosition.xy += vec2(c * corner.x - s * corner.y, s * corner.x + c * corner.y);
          gl_Position = projectionMatrix * viewPosition;
          vUv = uv;
          vOpacity = aOpacity;
          vWarmth = aWarmth;
        }
      `,
      fragmentShader: `
        uniform float realistic;
        uniform float time;
        varying vec2 vUv;
        varying float vOpacity;
        varying float vWarmth;
        float cloud(vec2 p) {
          float d = length(p) - 0.60;
          d = min(d, length(p - vec2(-0.34, 0.10)) - 0.43);
          d = min(d, length(p - vec2(0.28, 0.30)) - 0.45);
          d = min(d, length(p - vec2(0.22, -0.30)) - 0.42);
          return d;
        }
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float noise(vec2 p) {
          vec2 i = floor(p), f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
        }
        float turbulence(vec2 p) {
          float result = 0.0, weight = 0.5;
          for (int i = 0; i < 4; i++) {
            result += weight * noise(p);
            p = p * 2.03 + vec2(5.2, 1.3);
            weight *= 0.5;
          }
          return result;
        }
        void main() {
          vec2 p = vUv * 2.0 - 1.0;
          float d = cloud(p);
          float aa = max(fwidth(d), 0.012);
          float alpha = (1.0 - smoothstep(-aa, aa, d)) * vOpacity;
          float inset = 1.0 - smoothstep(-0.08 - aa, -0.08 + aa, d);
          float highlight = 1.0 - smoothstep(-aa, aa, cloud(p * 1.42 + vec2(0.12, -0.23)));
          vec3 color = mix(vec3(0.036, 0.047, 0.065), vec3(0.13, 0.16, 0.185), inset);
          color = mix(color, vec3(0.31, 0.345, 0.36), highlight * inset);
          color = mix(color, vec3(1.1, 0.38, 0.05), vWarmth * inset * 0.65);
          if (realistic > 0.5) {
            float billow = turbulence(p * 3.0 + vec2(0.0, -time * 0.65));
            float detail = turbulence(p * 7.0 + billow + time * 0.12);
            float density = 1.0 - smoothstep(-0.20, 0.30, d + (billow - 0.46) * 0.45);
            float lighting = clamp(0.32 + billow * 0.75 - p.y * 0.12, 0.0, 1.0);
            color = mix(vec3(0.024, 0.028, 0.034), vec3(0.27, 0.28, 0.29), lighting);
            color = mix(color, vec3(1.0, 0.27, 0.025), vWarmth * detail * 0.7);
            alpha = density * (0.5 + 0.5 * detail) * vOpacity;
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
    ((this.smoke = new Ee(e, t)),
      (this.smoke.name = "demolition-plume"),
      (this.smoke.frustumCulled = !1),
      (this.smoke.renderOrder = 5),
      this.object.add(this.smoke),
      (this.flash = new Ee(
        new ui(1, 1),
        new Lt({
          name: "Demolition / impact",
          uniforms: {
            size: { value: 0 },
            opacity: { value: 0 },
            realistic: { value: 0 },
          },
          vertexShader: `
        uniform float size;
        varying vec2 vUv;
        void main() {
          vec4 viewPosition = modelViewMatrix * vec4(0.0, size * 0.45, 0.0, 1.0);
          viewPosition.xy += position.xy * size;
          gl_Position = projectionMatrix * viewPosition;
          vUv = uv;
        }
      `,
          fragmentShader: `
        uniform float opacity;
        uniform float realistic;
        varying vec2 vUv;
        void main() {
          vec2 p = vUv * 2.0 - 1.0;
          float angle = atan(p.y, p.x);
          float radius = length(p) / (0.72 + 0.18 * cos(angle * 7.0));
          float aa = max(fwidth(radius), 0.015);
          float alpha = (1.0 - smoothstep(1.0 - aa, 1.0 + aa, radius)) * opacity;
          float inner = 1.0 - smoothstep(0.72 - aa, 0.72 + aa, radius);
          float core = 1.0 - smoothstep(0.4 - aa, 0.4 + aa, radius);
          vec3 color = mix(vec3(1.0, 0.21, 0.015), vec3(1.3, 0.62, 0.09), inner);
          color = mix(color, vec3(1.7, 1.3, 0.65), core);
          if (realistic > 0.5) {
            float r2 = dot(p, p);
            float glow = exp(-r2 * 4.5);
            float hot = exp(-r2 * 18.0);
            alpha = glow * (1.0 - smoothstep(0.65, 1.0, length(p))) * opacity;
            color = mix(vec3(2.2, 0.38, 0.018), vec3(4.0, 2.2, 0.8), hot);
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
        }),
      )),
      (this.flash.name = "demolition-flash"),
      (this.flash.frustumCulled = !1),
      (this.flash.renderOrder = 6),
      this.object.add(this.flash));
  }
  update(e, t, n, r = !0) {
    if (!r) {
      ((this.wasDemolished = null), this.stop());
      return;
    }
    const s = this.wasDemolished === !1 && t;
    if (((this.wasDemolished = t), !t)) {
      this.stop();
      return;
    }
    if (s) {
      (this.object.position.copy(n),
        (this.elapsed = 0),
        (this.object.visible = !0));
      for (let a = 0; a < ni; a++)
        this.rotations[a] = Math.random() * Math.PI * 2;
      this.updateVisual();
      return;
    }
    this.object.visible &&
      ((this.elapsed += e),
      this.elapsed >= Q1 ? this.stop() : this.updateVisual());
  }
  updateVisual() {
    const e = getTheme() === "realistic" ? 1 : 0;
    ((this.smoke.material.uniforms.realistic.value = e),
      (this.smoke.material.uniforms.time.value = this.elapsed),
      (this.flash.material.uniforms.realistic.value = e));
    const t = Gt.clamp(this.elapsed / Z1, 0, 1);
    ((this.flash.visible = t < 1),
      (this.flash.material.uniforms.size.value =
        110 + 90 * (1 - Math.pow(1 - t, 3))),
      (this.flash.material.uniforms.opacity.value = 0.95 * (1 - t * t)));
    for (let n = 0; n < ni; n++) {
      const r = n >= 6,
        s = r ? 0.05 + (n - 6) * 0.018 : 0,
        a = this.elapsed - s,
        o = Gt.clamp(a / Y1, 0, 1),
        A = 1 - Math.pow(1 - o, 3),
        l = n * 2.39996,
        c = (r ? 8 : 16) + A * (r ? 34 : 62);
      ((this.offsets[n * 3] = Math.cos(l) * c),
        (this.offsets[n * 3 + 1] =
          8 + (r ? 24 : 0) + Math.max(0, a) * (r ? 130 : 62)),
        (this.offsets[n * 3 + 2] = Math.sin(l) * c),
        (this.sizes[n] = (r ? 80 : 92) * (0.45 + 0.85 * A) * (1 - 0.25 * o)),
        (this.opacity[n] = a < 0 ? 0 : 0.88 * (1 - Gt.smoothstep(o, 0.32, 1))),
        (this.warmth[n] = 1 - Gt.smoothstep(a, 0.02, 0.24)));
    }
    for (const n of eS) this.smoke.geometry.attributes[n].needsUpdate = !0;
  }
  stop() {
    ((this.elapsed = 1 / 0),
      (this.object.visible = !1),
      (this.flash.visible = !1));
  }
}

export { DemolitionEffect };
