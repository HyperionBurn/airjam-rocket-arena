import { _ } from "../core/class-fields.js";
import { Ee, F, Gt, Js, Ke, Ld, Lt, Ut, _A, al, el, jn, ll, mt, sl, un } from "../vendor/three.js";

class SpeedLinePass extends Js {
  constructor(t) {
    super();
    _(
      this,
      "copy",
      new ll(
        new Lt({
          uniforms: sl.clone(_A.uniforms),
          vertexShader: _A.vertexShader,
          fragmentShader: _A.fragmentShader,
          depthTest: !1,
          depthWrite: !1,
        }),
      ),
    );
    _(this, "scene", new el());
    _(this, "camera", new Ld());
    const n = new al();
    n.setAttribute(
      "position",
      new Ke([0, -1, 0, 1, -1, 0, 0, 1, 0, 0, 1, 0, 1, -1, 0, 1, 1, 0], 3),
    );
    const r = new Float32Array(80 * 4);
    for (let a = 0; a < r.length; a++) {
      const o = Math.sin((a + 1) * 127.1) * 43758.5453;
      r[a] = o - Math.floor(o);
    }
    (n.setAttribute("seed", new un(r, 4)), (n.instanceCount = 80));
    const s = new Ee(n, t);
    ((s.frustumCulled = !1), this.scene.add(s), (this.enabled = !1));
  }
  render(t, n, r) {
    ((this.copy.material.uniforms.tDiffuse.value = r.texture),
      t.setRenderTarget(this.renderToScreen ? null : n),
      this.copy.render(t));
    const s = t.autoClear;
    ((t.autoClear = !1), t.render(this.scene, this.camera), (t.autoClear = s));
  }
}

class SpeedLines {
  constructor() {
    _(this, "pass");
    _(this, "strength", 0);
    _(this, "time", 0);
    _(this, "viewVelocity", new F());
    _(this, "inverseCamera", new jn());
    _(
      this,
      "material",
      new Lt({
        uniforms: {
          time: { value: 0 },
          strength: { value: 0 },
          aspect: { value: 1 },
          travel: { value: new F(0, 0, -1) },
          cameraProjection: { value: new mt() },
        },
        vertexShader: `
      attribute vec4 seed;
      uniform float time, strength, aspect;
      uniform vec3 travel;
      uniform mat4 cameraProjection;
      varying vec2 vStroke;
      varying vec2 vScreen;
      varying float vOpacity;
      void main() {
        vec3 reference = abs(travel.y) > 0.95 ? vec3(1., 0., 0.) : vec3(0., 1., 0.);
        vec3 side = normalize(cross(travel, reference));
        vec3 up = cross(side, travel);
        float angle = seed.x * 6.2831853;
        float radius = mix(240., 1550., sqrt(seed.y));
        float phase = fract(seed.z + time * (0.58 + seed.w * 0.22));
        vec3 head = (side * cos(angle) + up * sin(angle)) * radius
          + travel * mix(2400., -2400., phase);
        vec3 tail = head + travel * mix(240., 440., seed.w);
        // Clip in camera space before division, including a camera looking backward.
        float visible = step(30., -min(head.z, tail.z));
        if (visible < 0.5) {
          gl_Position = vec4(2., 2., 2., 1.);
          vScreen = vec2(2.);
          vStroke = position.xy;
          vOpacity = 0.;
          return;
        }
        if (head.z > -30.) head = mix(head, tail, (-30. - head.z) / (tail.z - head.z));
        if (tail.z > -30.) tail = mix(tail, head, (-30. - tail.z) / (head.z - tail.z));
        vec4 a = cameraProjection * vec4(head, 1.);
        vec4 b = cameraProjection * vec4(tail, 1.);
        vec2 start = a.xy / max(a.w, 0.01);
        vec2 end = b.xy / max(b.w, 0.01);
        vec2 delta = (end - start) * vec2(aspect, 1.);
        vec2 normal = vec2(-delta.y, delta.x) / max(length(delta), 0.0001);
        float width = mix(0.0018, 0.0028, seed.w);
        vec2 point = mix(start, end, position.x)
          + normal / vec2(aspect, 1.) * position.y * width;
        gl_Position = vec4(point, 0., 1.);
        vScreen = point * 0.5 + 0.5;
        vStroke = position.xy;
        vOpacity = visible * strength * mix(0.30, 0.48, seed.w)
          * smoothstep(0., 0.08, phase) * (1. - smoothstep(0.88, 1., phase));
      }
    `,
        fragmentShader: `
      uniform float aspect;
      varying vec2 vStroke;
      varying vec2 vScreen;
      varying float vOpacity;
      void main() {
        float width = 1. - smoothstep(0.15, 1., abs(vStroke.y));
        float cap = smoothstep(0., 0.08, vStroke.x) * (1. - smoothstep(0.35, 1., vStroke.x));
        float centerClear = smoothstep(0.12, 0.34, length((vScreen - 0.5) * vec2(aspect, 1.)));
        gl_FragColor = vec4(vec3(0.88, 0.96, 1.), width * cap * centerClear * vOpacity);
      }
    `,
        transparent: !0,
        depthTest: !1,
        depthWrite: !1,
        toneMapped: !1,
        side: Ut,
      }),
    );
    this.pass = new SpeedLinePass(this.material);
  }
  update(e, t, n, r) {
    const s = Math.max(0, Math.min(e, 0.1));
    ((this.strength = Gt.damp(this.strength, t ? 1 : 0, t ? 12 : 18, s)),
      (this.time += s),
      (this.pass.enabled = this.strength > 0.002));
    const a = this.material.uniforms;
    ((a.time.value = this.time),
      (a.strength.value = this.strength),
      (a.aspect.value = r.aspect),
      a.cameraProjection.value.copy(r.projectionMatrix),
      this.inverseCamera.copy(r.quaternion).invert(),
      this.viewVelocity.copy(n).applyQuaternion(this.inverseCamera),
      this.viewVelocity.lengthSq() > 1 &&
        a.travel.value.copy(this.viewVelocity).normalize());
  }
}

export { SpeedLines };
