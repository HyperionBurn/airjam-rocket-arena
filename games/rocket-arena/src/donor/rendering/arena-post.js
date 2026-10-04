// AIR JAM PATCH (new file, not upstream): the match's own post-processing chain.
//
// The donor's chains only add a light bloom; nothing here is the "cinematic" look
// a football-with-cars game gets from its grade. This pass renders the scene into
// an HDR target and composites, per view:
//
//   * three-scale bloom (half / quarter / eighth resolution) from a soft threshold
//   * filmic tone mapping with split-toned grading (cool shadows, warm highlights)
//   * saturation + contrast, vignette, a touch of dither against banding
//   * speed feel: a radial blur toward the screen centre and chromatic aberration
//     at the edges that both grow with the car's speed and while boosting
//   * a transient colour flash (goals, demolitions)
//
// Same contract as the donor's chains (`render(scene, camera, sizePx)` plus an
// optional `fx`), so a split-screen tile can own one each.
import { Ae, Lt, qn, er, qt, ll, nl, F } from "../vendor/three.js";

const vertexShader =
  "varying vec2 vUV; void main(){vUV=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}";

const EXTRACT = `
precision highp float;
varying vec2 vUV; uniform sampler2D uSource; uniform vec2 uTexel; uniform float uThreshold;
void main(){
  vec3 c = texture(uSource, vUV).rgb * .4;
  c += texture(uSource, vUV + uTexel * vec2(-1.5,-1.5)).rgb * .15;
  c += texture(uSource, vUV + uTexel * vec2( 1.5,-1.5)).rgb * .15;
  c += texture(uSource, vUV + uTexel * vec2(-1.5, 1.5)).rgb * .15;
  c += texture(uSource, vUV + uTexel * vec2( 1.5, 1.5)).rgb * .15;
  float br = max(c.r, max(c.g, c.b));
  float knee = .5;
  float soft = clamp(br - uThreshold + knee, 0., 2. * knee);
  soft = soft * soft / (4. * knee + 1e-5);
  float k = max(br - uThreshold, soft) / max(br, 1e-4);
  gl_FragColor = vec4(min(c * k, vec3(24.)), 1.);
}`;

const DOWNSAMPLE = `
precision highp float;
varying vec2 vUV; uniform sampler2D uSource; uniform vec2 uTexel;
void main(){
  vec3 c = texture(uSource, vUV + uTexel * vec2(-.5,-.5)).rgb + texture(uSource, vUV + uTexel * vec2(.5,-.5)).rgb
         + texture(uSource, vUV + uTexel * vec2(-.5, .5)).rgb + texture(uSource, vUV + uTexel * vec2(.5, .5)).rgb;
  gl_FragColor = vec4(c * .25, 1.);
}`;

const BLUR = `
precision highp float;
varying vec2 vUV; uniform sampler2D uSource; uniform vec2 uDirection;
void main(){
  vec3 c = texture(uSource, vUV).rgb * .2270270270;
  c += (texture(uSource, vUV + uDirection * 1.3846153846).rgb + texture(uSource, vUV - uDirection * 1.3846153846).rgb) * .3162162162;
  c += (texture(uSource, vUV + uDirection * 3.2307692308).rgb + texture(uSource, vUV - uDirection * 3.2307692308).rgb) * .0702702703;
  gl_FragColor = vec4(c, 1.);
}`;

const COMPOSITE = `
precision highp float;
varying vec2 vUV;
uniform sampler2D uSource, uBloom, uBloomWide, uBloomHalo;
uniform vec2 uTexel;
uniform float uExposure, uBloomStrength, uSpeed, uAberration, uVignette, uSat, uContrast;
uniform vec3 uShadowTint, uHighlightTint, uFlash;

vec3 filmic(vec3 x){ x = max(x, vec3(0.)); return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0., 1.); }
vec3 toSrgb(vec3 c){ c = max(c, vec3(0.)); return mix(c * 12.92, 1.055 * pow(c, vec3(1. / 2.4)) - .055, step(vec3(.0031308), c)); }
float luma(vec3 c){ return dot(c, vec3(.2126, .7152, .0722)); }
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main(){
  vec2 d = vUV - .5;
  float r = length(d);
  float edge = smoothstep(.12, .85, r * 1.5);
  // Speed feel: sample along the line to the centre; aberration splits R and B.
  float blurAmt = uSpeed * .022 * edge;
  vec2 off = d * (uAberration * (.4 + r * 1.6));
  vec3 col = vec3(0.);
  for (int i = 0; i < 6; i++) {
    float t = float(i) / 5.;
    vec2 q = vUV - d * blurAmt * t;
    col += vec3(texture(uSource, q + off).r, texture(uSource, q).g, texture(uSource, q - off).b);
  }
  col /= 6.;
  // Edge-aware smoothing in place of MSAA (the scene target is resolved, not multisampled).
  vec3 n1 = texture(uSource, vUV + uTexel * vec2(-1., 1.)).rgb, n2 = texture(uSource, vUV + uTexel).rgb;
  vec3 n3 = texture(uSource, vUV - uTexel).rgb,                 n4 = texture(uSource, vUV + uTexel * vec2(1., -1.)).rgb;
  float l0 = luma(col), l1 = luma(n1), l2 = luma(n2), l3 = luma(n3), l4 = luma(n4);
  float contrast = max(max(l0, l1), max(max(l2, l3), l4)) - min(min(l0, l1), min(min(l2, l3), l4));
  col = mix(col, (n1 + n2 + n3 + n4 + col * 2.) / 6., smoothstep(.04, .22, contrast) * .7);

  vec3 glow = texture(uBloom, vUV).rgb * .5 + texture(uBloomWide, vUV).rgb * .38 + texture(uBloomHalo, vUV).rgb * .3;
  col += glow * uBloomStrength;
  col *= uExposure;
  col = filmic(col);

  float l = luma(col);
  col *= mix(vec3(1.), uShadowTint, (1. - smoothstep(0., .55, l)) * .85);
  col *= mix(vec3(1.), uHighlightTint, smoothstep(.45, 1., l));
  col = mix(vec3(l), col, uSat);
  col = toSrgb(col);
  col = (col - .5) * uContrast + .5;
  col *= 1. - uVignette * smoothstep(.32, .98, r * 1.4);
  col += uFlash;
  col += (hash(gl_FragCoord.xy) - .5) / 255.;
  gl_FragColor = vec4(clamp(col, 0., 1.), 1.);
}`;

/** The dusk grade. Everything a scene designer would tweak lives here. */
export const DUSK_LOOK = Object.freeze({
  exposure: 1.02,
  bloom: 0.48,
  threshold: 1.0,
  saturation: 1.1,
  contrast: 1.1,
  vignette: 0.4,
  shadowTint: [0.8, 0.84, 1.18],
  highlightTint: [1.08, 1.0, 0.9],
});

const NO_FX = Object.freeze({ speed: 0, boost: 0, flash: null });

export class ArenaPost {
  constructor(renderer, look = DUSK_LOOK) {
    this.renderer = renderer;
    this.look = look;
    this.size = new Ae();
    this.hdr = renderer.extensions.has("EXT_color_buffer_float");
    this.targets = [];
    for (let i = 0; i < 7; i++) {
      this.targets.push(
        new qn(1, 1, { ...(this.hdr ? { type: er } : {}), minFilter: qt, magFilter: qt, depthBuffer: i === 0, stencilBuffer: false }),
      );
    }
    this.black = new nl(new Uint8Array([0, 0, 0, 255]), 1, 1);
    this.black.needsUpdate = true;
    const make = (fragmentShader, uniforms) =>
      new Lt({ precision: "highp", vertexShader, fragmentShader, depthTest: false, depthWrite: false, toneMapped: false, uniforms });
    const common = () => ({ uSource: { value: null }, uTexel: { value: new Ae() } });
    this.materials = {
      extract: make(EXTRACT, { ...common(), uThreshold: { value: look.threshold } }),
      downsample: make(DOWNSAMPLE, common()),
      blur: make(BLUR, { uSource: { value: null }, uDirection: { value: new Ae() } }),
      composite: make(COMPOSITE, {
        ...common(),
        uBloom: { value: null }, uBloomWide: { value: null }, uBloomHalo: { value: null },
        uExposure: { value: look.exposure }, uBloomStrength: { value: look.bloom },
        uSpeed: { value: 0 }, uAberration: { value: 0 }, uVignette: { value: look.vignette },
        uSat: { value: look.saturation }, uContrast: { value: look.contrast },
        uShadowTint: { value: new F(...look.shadowTint) }, uHighlightTint: { value: new F(...look.highlightTint) },
        uFlash: { value: new F(0, 0, 0) },
      }),
    };
    this.quad = new ll(this.materials.composite);
    this.speed = 0;
    this.boost = 0;
    this.sizeOverride = null;
  }

  pass(name, input, target) {
    const material = this.materials[name];
    material.uniforms.uSource.value = input.texture;
    if (material.uniforms.uTexel) material.uniforms.uTexel.value.set(1 / input.width, 1 / input.height);
    this.quad.material = material;
    this.renderer.setRenderTarget(target);
    this.quad.render(this.renderer);
  }

  blur(input, temp, radius) {
    const u = this.materials.blur.uniforms;
    u.uDirection.value.set(radius / input.width, 0);
    this.pass("blur", input, temp);
    u.uDirection.value.set(0, radius / input.height);
    this.pass("blur", temp, input);
  }

  render(scene, camera, sizePx, fx = NO_FX) {
    const r = this.renderer;
    const [main, a, b, c, d, e, f] = this.targets;
    if (this.sizeOverride || sizePx) {
      const s = sizePx ?? this.sizeOverride;
      this.size.set(s.x, s.y);
    } else r.getDrawingBufferSize(this.size);
    const w = this.size.x;
    const h = this.size.y;
    if (main.width !== w || main.height !== h) main.setSize(w, h);
    for (const [level, pair] of [[1, [a, b]], [2, [c, d]], [3, [e, f]]]) {
      for (const target of pair) target.setSize(Math.max(1, w >> level), Math.max(1, h >> level));
    }

    // Ease the speed/boost feel so it builds and fades instead of popping.
    this.speed += (Math.min(1, Math.max(0, fx.speed ?? 0)) - this.speed) * 0.12;
    this.boost += (Math.min(1, Math.max(0, fx.boost ?? 0)) - this.boost) * 0.2;
    const u = this.materials.composite.uniforms;
    u.uSpeed.value = this.speed * 0.8 + this.boost * 0.35;
    u.uAberration.value = 0.0006 + this.speed * 0.0022 + this.boost * 0.0018;
    u.uFlash.value.set(fx.flash?.[0] ?? 0, fx.flash?.[1] ?? 0, fx.flash?.[2] ?? 0);

    const previous = r.getRenderTarget();
    const autoClear = r.autoClear;
    try {
      r.setRenderTarget(main);
      r.render(scene, camera);
      r.autoClear = false;
      this.pass("extract", main, a);
      this.blur(a, b, 1);
      this.pass("downsample", a, c);
      this.blur(c, d, 1.5);
      this.pass("downsample", c, e);
      this.blur(e, f, 1.8);
      u.uBloom.value = a.texture;
      u.uBloomWide.value = c.texture;
      u.uBloomHalo.value = e.texture;
      this.pass("composite", main, previous);
    } finally {
      r.autoClear = autoClear;
      r.setRenderTarget(previous);
    }
  }

  dispose() {
    this.targets.forEach((target) => target.dispose());
    Object.values(this.materials).forEach((material) => material.dispose());
    this.black.dispose();
    this.quad.dispose();
  }
}
