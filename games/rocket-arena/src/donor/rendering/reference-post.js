import { Ae, Lt, qn, er, qt, pr, Yt, ll, nl, Zt } from '../vendor/three.js';
import { REFERENCE_POST_SHADERS } from './reference-post-shaders.js';
import { referenceRenderPlan } from '../settings/reference-graphics.js';
import { maskCarBloom } from './bloom-mask.js';

const vertexShader = 'varying vec2 vUV; void main(){vUV=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';

// DepthTexture's public texture contract, using the pinned engine's Texture.
// Its depth constructor is private in this engine export; no vendor patch needed.
export function createReferenceDepthTexture(width, height) {
  const texture = new Zt({ width, height, depth: 1 });
  texture.isDepthTexture = true;
  texture.format = 1026; // DepthFormat
  texture.type = 1014; // UnsignedIntType
  texture.minFilter = texture.magFilter = Yt;
  texture.flipY = false; texture.generateMipmaps = false; texture.compareFunction = null;
  return texture;
}

// OPEN_ME's color transform and bloom, with optional High-only depth shading.
// No scene rerender, temporal history, CPU pixel readback, or resolution uplift.
export class ReferencePost {
  constructor(renderer) {
    this.renderer = renderer; this.size = new Ae(); this.materials = {}; this.extras = {};
    this.hdr = renderer.extensions.has('EXT_color_buffer_float');
    this.black = new nl(new Uint8Array([0, 0, 0, 255]), 1, 1); this.black.needsUpdate = true;
    this.fixedExposure = new nl(new Uint16Array([0x3400, 0, 0, 0x3c00]), 1, 1);
    this.fixedExposure.type = er; this.fixedExposure.needsUpdate = true;
    this.targets = [this.createTarget(true), this.createTarget(), this.createTarget()];
    for (const [name, fragmentShader] of Object.entries(REFERENCE_POST_SHADERS)) {
      this.materials[name] = new Lt({
        name: `OPEN_ME / ${name}`, precision: 'highp', vertexShader,
        fragmentShader: name === 'extractFragment' ? maskCarBloom(fragmentShader) : fragmentShader,
        depthTest: false, depthWrite: false, toneMapped: false,
        uniforms: {
          uSource: { value: null }, uTexel: { value: new Ae() }, uDirection: { value: new Ae() },
          uThreshold: { value: .6 }, uExposure: { value: 1 }, uBloomStrength: { value: .19 },
          uBloom: { value: this.black }, uBloomWide: { value: this.black }, uBloomHalo: { value: this.black },
          uMakeup: { value: 0 }, uSSAO: { value: 0 }, uMakeupBloom: { value: .27 },
          uExposureTex: { value: this.fixedExposure }, uAOTexture: { value: this.black }, uDepth: { value: null },
          uAspectInverse: { value: 1 }, uSoftLod: { value: 0 }, uAutoExposure: { value: 0 },
          uSteps: { value: 7 }, uStrength: { value: .36 }, uFXAA: { value: 1 },
          uNear: { value: 4 }, uFar: { value: 40000 }, uWorldScale: { value: 100 }, uFocalScale: { value: 1 },
        },
      });
    }
    this.quad = new ll(this.materials.postFragment);
  }
  createTarget(depth = false, mipmaps = false) {
    const target = new qn(1, 1, { ...(this.hdr ? { type: er } : {}), minFilter: mipmaps ? pr : qt, magFilter: qt, depthBuffer: depth, stencilBuffer: false });
    target.texture.generateMipmaps = mipmaps;
    return target;
  }
  extra(name, mipmaps = false) { return this.extras[name] ??= this.createTarget(false, mipmaps); }
  pass(name, input, target) {
    const material = this.materials[name];
    material.uniforms.uSource.value = input.texture;
    material.uniforms.uTexel.value.set(1 / input.width, 1 / input.height);
    this.quad.material = material; this.renderer.setRenderTarget(target); this.quad.render(this.renderer);
  }
  blur(input, temporary, radius, name = 'blurFragment') {
    this.materials[name].uniforms.uDirection.value.set(radius / input.width, 0); this.pass(name, input, temporary);
    this.materials[name].uniforms.uDirection.value.set(0, radius / input.height); this.pass(name, temporary, input);
  }
  render(scene, camera, settings, preset, theme = 'realistic') {
    const plan = referenceRenderPlan(preset, settings, theme);
    const retained = new Set([
      ...(plan.aoSteps ? ['ao','aoTemp'] : []),
      ...(plan.wideBloom ? ['wide','wideTemp','halo','haloTemp'] : []),
      ...(plan.autoExposure ? ['meter','exposure'] : []),
    ]);
    for (const [name, target] of Object.entries(this.extras)) if (!retained.has(name)) {
      target.dispose(); delete this.extras[name];
    }
    const renderer = this.renderer, [main, a, b] = this.targets;
    // AIR JAM PATCH: a split-screen view renders at its own rectangle size.
    if (this.sizeOverride) this.size.set(this.sizeOverride.x, this.sizeOverride.y); else renderer.getDrawingBufferSize(this.size);
    const width = this.size.x, height = this.size.y;
    if (main.width !== width || main.height !== height) main.setSize(width, height);
    const resize = (target, divisor) => {
      const w = Math.max(1, Math.floor(width / divisor)), h = Math.max(1, Math.floor(height / divisor));
      if (target.width !== w || target.height !== h) target.setSize(w, h);
      return target;
    };
    resize(a, plan.bloomDivisor); resize(b, plan.bloomDivisor);
    a.texture.generateMipmaps = plan.makeup; a.texture.minFilter = plan.makeup ? pr : qt;
    if (plan.aoSteps && !main.depthTexture) {
      main.dispose(); main.depthTexture = createReferenceDepthTexture(width, height);
    } else if (!plan.aoSteps && main.depthTexture) {
      main.dispose(); main.depthTexture = null;
    }
    for (const material of Object.values(this.materials)) {
      const uniforms = material.uniforms;
      uniforms.uMakeup.value = Number(plan.makeup); uniforms.uExposure.value = settings.exposure;
      uniforms.uExposureTex.value = this.fixedExposure;
      uniforms.uNear.value = camera.near; uniforms.uFar.value = camera.far;
      uniforms.uFocalScale.value = camera.projectionMatrix.elements[5];
      uniforms.uAspectInverse.value = height / width; uniforms.uDepth.value = main.depthTexture;
    }
    const previous = renderer.getRenderTarget();
    try {
      // Single sampled: heat refraction copies this during transparency.
      renderer.setRenderTarget(main); renderer.render(scene, camera);
      if (plan.autoExposure) {
        const meter = this.extra('meter', true), exposure = this.extra('exposure');
        if (meter.width !== 64) meter.setSize(64, 64);
        this.pass('exposureDownFragment', main, meter);
        this.materials.exposureFragment.uniforms.uAutoExposure.value = 1;
        this.pass('exposureFragment', meter, exposure);
        for (const material of Object.values(this.materials)) material.uniforms.uExposureTex.value = exposure.texture;
      }
      const output = this.materials.postFragment.uniforms;
      output.uSSAO.value = Number(plan.aoSteps > 0);
      if (plan.aoSteps) {
        const ao = resize(this.extra('ao'), 2), temporary = resize(this.extra('aoTemp'), 2);
        const uniforms = this.materials.makeupAOFragment.uniforms;
        uniforms.uSteps.value = plan.aoSteps; uniforms.uStrength.value = settings.makeupAO;
        this.pass('makeupAOFragment', main, ao); this.blur(ao, temporary, 1, 'aoBlurFragment');
        output.uAOTexture.value = ao.texture;
      }
      output.uBloom.value = output.uBloomWide.value = output.uBloomHalo.value = this.black;
      if (plan.bloom) {
        this.materials.extractFragment.uniforms.uThreshold.value = plan.makeup ? .85 : this.hdr ? settings.bloomThreshold : .7;
        this.pass('extractFragment', main, a);
        if (plan.makeup) {
          this.materials.makeupBloomFragment.uniforms.uSoftLod.value = Math.max(0, Math.log2(a.height / 128));
          this.pass('makeupBloomFragment', a, b);
          if (plan.denoiseBloom) this.blur(b, a, 1.35);
          output.uBloom.value = b.texture;
        } else {
          this.blur(a, b, 1); output.uBloom.value = a.texture;
          if (plan.wideBloom) {
            const c = resize(this.extra('wide'), 8), d = resize(this.extra('wideTemp'), 8);
            const e = resize(this.extra('halo'), 16), f = resize(this.extra('haloTemp'), 16);
            this.pass('downsampleFragment', a, c); this.blur(c, d, 1.5);
            this.pass('downsampleFragment', c, e); this.blur(e, f, 1.7);
            output.uBloomWide.value = c.texture; output.uBloomHalo.value = e.texture;
          }
        }
      }
      output.uFXAA.value = Number(plan.fxaa); output.uBloomStrength.value = settings.bloom * (preset === 'potato' ? .45 : 1);
      output.uMakeupBloom.value = settings.makeupBloom * (preset === 'potato' ? .45 : 1);
      this.pass('postFragment', main, previous); this.lastPlan = plan;
    } finally { renderer.setRenderTarget(previous); }
  }
  dispose() {
    [...this.targets, ...Object.values(this.extras)].forEach(target => target.dispose());
    Object.values(this.materials).forEach(material => material.dispose());
    this.black.dispose(); this.fixedExposure.dispose(); this.quad.dispose();
  }
}
