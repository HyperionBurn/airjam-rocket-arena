import { _ } from "../core/class-fields.js";
import { Ee, Ke, Lt, al, qa, un } from "../vendor/three.js";
import { Cp } from "../audio/boost.js";

class ExhaustParticles {
  constructor(e, t, n) {
    _(this, "mesh");
    _(this, "offsets");
    _(this, "sizes");
    _(this, "opacity");
    _(this, "life");
    _(this, "rotations");
    ((this.offsets = new Float32Array(e * 3)),
      (this.sizes = new Float32Array(e * 2)),
      (this.opacity = new Float32Array(e)),
      (this.life = new Float32Array(e)),
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
      r.setAttribute("aLife", new un(this.life, 1)),
      r.setAttribute("aRotation", new un(this.rotations, 1)));
    for (const a of Cp) r.attributes[a].setUsage(qa);
    r.instanceCount = e;
    const s = new Lt({
      uniforms: { driving: { value: t ? 1 : 0 } },
      vertexShader: `
        attribute vec3 aOffset;
        attribute vec2 aSize;
        attribute float aOpacity;
        attribute float aLife;
        attribute float aRotation;
        varying vec2 vUv;
        varying float vOpacity;
        varying float vLife;
        varying float vSpark;
        void main() {
          vec4 viewPosition = modelViewMatrix * vec4(aOffset, 1.0);
          float s = sin(aRotation), c = cos(aRotation);
          vSpark = step(0.55, fract(aRotation * 2.7));
          vec2 corner = position.xy * aSize * mix(1.0, 0.55, vSpark);
          viewPosition.xy += vec2(c * corner.x - s * corner.y, s * corner.x + c * corner.y);
          gl_Position = projectionMatrix * viewPosition;
          vUv = uv;
          vOpacity = aOpacity;
          vLife = aLife;
        }
      `,
      fragmentShader: `
        uniform float driving;
        varying vec2 vUv;
        varying float vOpacity;
        varying float vLife;
        varying float vSpark;
        float cloud(vec2 p) {
          float d = length(p) - 0.61;
          d = min(d, length(p - vec2(-0.36, 0.08)) - 0.42);
          d = min(d, length(p - vec2(0.30, 0.27)) - 0.43);
          d = min(d, length(p - vec2(0.18, -0.33)) - 0.39);
          return d;
        }
        void main() {
          vec2 p = vUv * 2.0 - 1.0;
          float d = mix(cloud(p), abs(p.x) + abs(p.y) - 0.72, vSpark);
          float aa = max(fwidth(d), 0.008);
          float alpha = (1.0 - smoothstep(-aa, aa, d)) * vOpacity;
          if (alpha < 0.003) discard;
          // Broad painted regions keep their shape instead of dissolving into noise.
          float inset = 1.0 - smoothstep(-0.12 - aa, -0.12 + aa, d);
          float highlight = 1.0 - smoothstep(-aa, aa, cloud(p * 1.65 + vec2(0.10, -0.24)));
          vec3 edge = mix(vec3(0.88, 0.18, 0.015), vec3(0.25, 0.33, 0.41), driving);
          vec3 fill = mix(vec3(1.0, 0.46, 0.065), vec3(0.53, 0.63, 0.71), driving);
          vec3 cream = mix(vec3(1.25, 0.72, 0.23), vec3(0.76, 0.83, 0.86), driving);
          vec3 color = mix(edge, fill, inset);
          color = mix(color, cream, highlight * inset * (1.0 - smoothstep(0.2, 0.85, vLife)));
          gl_FragColor = vec4(color, alpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      transparent: !0,
      depthWrite: !1,
      toneMapped: !0,
    });
    ((s.name = t ? "Arcade / exhaust puffs" : "Arcade / boost puffs"),
      (this.mesh = new Ee(r, s)),
      (this.mesh.name = t ? "drive-puffs" : "boost-trail"),
      (this.mesh.frustumCulled = !1),
      (this.mesh.renderOrder = n));
  }
  markDirty() {
    for (const e of Cp) this.mesh.geometry.attributes[e].needsUpdate = !0;
  }
}

export { ExhaustParticles };
