import { _ } from "../core/class-fields.js";
import { Ae, Lt, Ne, er, ll, qn, qt } from "../vendor/three.js";

const Jn = 4;

const Up = 0.5;

const hw = 1.2;

const dw = 0.01;

const uw = 0.275 * 3;

const qp = [0.76, 0.68, 0.6, 0.52 + 0.44];

const $p = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

function Bc(i, e) {
  const t = new qn(1, 1, {
    type: er,
    minFilter: qt,
    magFilter: qt,
    depthBuffer: e,
    stencilBuffer: !1,
  });
  return ((t.texture.name = i), (t.texture.generateMipmaps = !1), t);
}

class RenderPipeline {
  constructor(e, t, n, r) {
    _(this, "texture");
    _(this, "renderSubmissions", 1 + Jn + (Jn - 1));
    _(this, "renderer");
    _(this, "sourceTarget", Bc("BoostBloom.source", !0));
    _(this, "downTargets", []);
    _(this, "upTargets", []);
    _(this, "downsampleMaterial");
    _(this, "upsampleMaterial");
    _(this, "quad");
    _(this, "oldClearColor", new Ne());
    this.renderer = e;
    for (let s = 0; s < Jn; s += 1)
      (this.downTargets.push(Bc(`BoostBloom.down${s}`, !1)),
        s < Jn - 1 && this.upTargets.push(Bc(`BoostBloom.up${s}`, !1)));
    ((this.texture = this.upTargets[0].texture),
      (this.downsampleMaterial = new Lt({
        uniforms: {
          inputTexture: { value: null },
          texelSize: { value: new Ae() },
          applyThreshold: { value: 0 },
          threshold: { value: hw },
          smoothWidth: { value: dw },
        },
        vertexShader: $p,
        fragmentShader: `
        uniform sampler2D inputTexture;
        uniform vec2 texelSize;
        uniform float applyThreshold;
        uniform float threshold;
        uniform float smoothWidth;
        varying vec2 vUv;

        void main() {
          // Four bilinear taps are enough for a stable, low-frequency boost
          // halo and suppress the stair-stepping of a single scaled lookup.
          vec3 color = (
            texture2D(inputTexture, vUv + texelSize * vec2(-0.5, -0.5)).rgb +
            texture2D(inputTexture, vUv + texelSize * vec2( 0.5, -0.5)).rgb +
            texture2D(inputTexture, vUv + texelSize * vec2(-0.5,  0.5)).rgb +
            texture2D(inputTexture, vUv + texelSize * vec2( 0.5,  0.5)).rgb
          ) * 0.25;

          if (applyThreshold > 0.5) {
            float brightness = dot(color, vec3(0.2126, 0.7152, 0.0722));
            color *= smoothstep(threshold, threshold + smoothWidth, brightness);
          }
          gl_FragColor = vec4(color, 1.0);
        }
      `,
        depthTest: !1,
        depthWrite: !1,
        toneMapped: !1,
      })),
      (this.upsampleMaterial = new Lt({
        uniforms: {
          lowTexture: { value: null },
          highTexture: { value: null },
          lowTexelSize: { value: new Ae() },
          highWeight: { value: 1 },
          lowWeight: { value: 1 },
          outputStrength: { value: 1 },
        },
        vertexShader: $p,
        fragmentShader: `
        uniform sampler2D lowTexture;
        uniform sampler2D highTexture;
        uniform vec2 lowTexelSize;
        uniform float highWeight;
        uniform float lowWeight;
        uniform float outputStrength;
        varying vec2 vUv;

        void main() {
          vec2 d = lowTexelSize;
          // Tent-filter the coarser level while scaling it up. The diagonal
          // taps carry twice the weight of the axial taps, matching the smooth
          // rounded falloff expected from the old Gaussian chain.
          vec3 low = (
            texture2D(lowTexture, vUv + vec2(-d.x, -d.y)).rgb * 2.0 +
            texture2D(lowTexture, vUv + vec2( d.x, -d.y)).rgb * 2.0 +
            texture2D(lowTexture, vUv + vec2(-d.x,  d.y)).rgb * 2.0 +
            texture2D(lowTexture, vUv + vec2( d.x,  d.y)).rgb * 2.0 +
            texture2D(lowTexture, vUv + vec2(-2.0 * d.x, 0.0)).rgb +
            texture2D(lowTexture, vUv + vec2( 2.0 * d.x, 0.0)).rgb +
            texture2D(lowTexture, vUv + vec2(0.0, -2.0 * d.y)).rgb +
            texture2D(lowTexture, vUv + vec2(0.0,  2.0 * d.y)).rgb
          ) / 12.0;
          vec3 high = texture2D(highTexture, vUv).rgb;
          gl_FragColor = vec4(
            (high * highWeight + low * lowWeight) * outputStrength,
            1.0
          );
        }
      `,
        depthTest: !1,
        depthWrite: !1,
        toneMapped: !1,
      })),
      (this.quad = new ll(this.downsampleMaterial)),
      this.setSize(t, n, r));
  }
  setSize(e, t, n = this.renderer.getPixelRatio()) {
    let r = Math.max(1, Math.round(e * n * Up)),
      s = Math.max(1, Math.round(t * n * Up));
    this.sourceTarget.setSize(r, s);
    for (let a = 0; a < Jn; a += 1)
      ((r = Math.max(1, Math.round(r / 2))),
        (s = Math.max(1, Math.round(s / 2))),
        this.downTargets[a].setSize(r, s),
        a < Jn - 1 && this.upTargets[a].setSize(r, s));
  }
  clear() {
    const e = this.renderer,
      t = e.getRenderTarget(),
      n = e.getClearAlpha();
    (e.getClearColor(this.oldClearColor),
      e.setRenderTarget(this.upTargets[0]),
      e.setClearColor(0, 0),
      e.clear(!0, !1, !1),
      e.setRenderTarget(t),
      e.setClearColor(this.oldClearColor, n));
  }
  render(e, t) {
    const n = this.renderer,
      r = n.getRenderTarget(),
      s = n.autoClear,
      a = n.getClearAlpha();
    (n.getClearColor(this.oldClearColor),
      (n.autoClear = !1),
      n.setRenderTarget(this.sourceTarget),
      n.setClearColor(0, 0),
      n.clear(!0, !0, !0),
      n.render(e, t),
      (this.quad.material = this.downsampleMaterial));
    let o = this.sourceTarget;
    for (let l = 0; l < Jn; l += 1)
      ((this.downsampleMaterial.uniforms.inputTexture.value = o.texture),
        this.downsampleMaterial.uniforms.texelSize.value.set(
          1 / o.width,
          1 / o.height,
        ),
        (this.downsampleMaterial.uniforms.applyThreshold.value =
          l === 0 ? 1 : 0),
        n.setRenderTarget(this.downTargets[l]),
        this.quad.render(n),
        (o = this.downTargets[l]));
    this.quad.material = this.upsampleMaterial;
    let A = this.downTargets[Jn - 1];
    for (let l = Jn - 2; l >= 0; l -= 1)
      ((this.upsampleMaterial.uniforms.lowTexture.value = A.texture),
        (this.upsampleMaterial.uniforms.highTexture.value =
          this.downTargets[l].texture),
        this.upsampleMaterial.uniforms.lowTexelSize.value.set(
          1 / A.width,
          1 / A.height,
        ),
        (this.upsampleMaterial.uniforms.highWeight.value = qp[l]),
        (this.upsampleMaterial.uniforms.lowWeight.value =
          l === Jn - 2 ? qp[Jn - 1] : 1),
        (this.upsampleMaterial.uniforms.outputStrength.value =
          l === 0 ? uw : 1),
        n.setRenderTarget(this.upTargets[l]),
        this.quad.render(n),
        (A = this.upTargets[l]));
    (n.setRenderTarget(r),
      n.setClearColor(this.oldClearColor, a),
      (n.autoClear = s));
  }
  dispose() {
    this.sourceTarget.dispose();
    for (const e of this.downTargets) e.dispose();
    for (const e of this.upTargets) e.dispose();
    (this.downsampleMaterial.dispose(),
      this.upsampleMaterial.dispose(),
      this.quad.dispose());
  }
}
