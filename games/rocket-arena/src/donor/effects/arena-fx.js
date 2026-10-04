// AIR JAM PATCH (new file, not upstream): two event effects the donor lacked.
//
//   GoalBurst  - the ball going in: a hot fireball, team-coloured smoke, a ring and
//                a spray of sparks. Pooled meshes, no lights, ~2.4 s, only on goals.
//   BoostGlow  - the pool of warm light a boosting car throws on the ground, one
//                additive disc per car, so a fast match is lit by its own cars.
//
// Both are original and procedural. They only add meshes to the donor scene and
// are driven from the match controller's frame loop.
import {
  Group, Mesh, SphereGeometry, BoxGeometry, PlaneGeometry, ShaderMaterial,
  AdditiveBlending, Color, DoubleSide,
} from "../vendor/three.js";

const lin = (c) => c.map((v) => Math.pow(v, 2.2));
const rand = (a, b) => a + Math.random() * (b - a);

const PUFF_VERTEX = `
varying vec3 vN; varying vec3 vV;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

// A soft, view-faded blob: bright in the middle of the disc, transparent at the rim.
const PUFF_FRAGMENT = `
varying vec3 vN; varying vec3 vV;
uniform vec3 uColor; uniform float uAlpha; uniform float uHot; uniform float uSeed;
float h3(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float vnoise(vec3 p){
  vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z);
}
void main(){
  vec3 n = normalize(vN);
  float f = pow(max(dot(n, normalize(vV)), 0.), 1.3);
  // Billowy, torn edges instead of a smooth ball.
  float cloud = vnoise(n * 2.6 + uSeed) * .62 + vnoise(n * 5.7 + uSeed * 1.7) * .38;
  float a = f * smoothstep(.12, .7, cloud + f * .35);
  vec3 col = mix(uColor, vec3(1., .88, .5), uHot * (.35 + .65 * f));
  gl_FragColor = vec4(col * (1. + uHot * 2.2) * (.7 + cloud * .6), a * uAlpha);
}`;

const makePuffMaterial = (additive) =>
  new ShaderMaterial({
    vertexShader: PUFF_VERTEX,
    fragmentShader: PUFF_FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: additive ? AdditiveBlending : undefined,
    fog: false,
    uniforms: { uColor: { value: new Color() }, uAlpha: { value: 0 }, uHot: { value: 0 }, uSeed: { value: Math.random() * 50 } },
  });

// Smoke carries the scoring team's colour, dimmed; the fireball is always hot orange.
const TEAM_SMOKE = [lin([0.08, 0.2, 0.62]), lin([0.62, 0.2, 0.06])];
const TEAM_FIRE = [lin([1, 0.55, 0.16]), lin([1, 0.5, 0.12])];
const TEAM_RING = [lin([0.4, 0.65, 1]), lin([1, 0.6, 0.2])];

export class GoalBurst {
  constructor(scene) {
    this.group = new Group();
    this.group.name = "Arena / goal burst";
    this.group.visible = false;
    this.age = Infinity;
    this.duration = 2.4;
    const puffGeometry = new SphereGeometry(1, 12, 9);
    this.fire = [];
    this.smoke = [];
    for (let i = 0; i < 22; i++) {
      const mesh = new Mesh(puffGeometry, makePuffMaterial(true));
      mesh.frustumCulled = false;
      this.fire.push({ mesh, v: [0, 0, 0], delay: 0, size: 1 });
      this.group.add(mesh);
    }
    for (let i = 0; i < 26; i++) {
      const mesh = new Mesh(puffGeometry, makePuffMaterial(false));
      mesh.frustumCulled = false;
      mesh.renderOrder = 3;
      this.smoke.push({ mesh, v: [0, 0, 0], delay: 0, size: 1 });
      this.group.add(mesh);
    }
    const ringGeometry = new PlaneGeometry(2, 2);
    this.ring = new Mesh(
      ringGeometry,
      new ShaderMaterial({
        vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }",
        fragmentShader: `varying vec2 vUv; uniform vec3 uColor; uniform float uAlpha;
          void main(){ float r = length(vUv - .5) * 2.; float ring = smoothstep(.72, .9, r) * (1. - smoothstep(.9, 1., r));
          gl_FragColor = vec4(uColor * 2., ring * uAlpha); }`,
        transparent: true, depthWrite: false, blending: AdditiveBlending, side: DoubleSide, fog: false,
        uniforms: { uColor: { value: new Color() }, uAlpha: { value: 0 } },
      }),
    );
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.frustumCulled = false;
    this.group.add(this.ring);
    const sparkGeometry = new BoxGeometry(3, 3, 46);
    this.sparks = [];
    for (let i = 0; i < 70; i++) {
      const mesh = new Mesh(sparkGeometry, new ShaderMaterial({
        vertexShader: "void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }",
        fragmentShader: "uniform vec3 uColor; uniform float uAlpha; void main(){ gl_FragColor = vec4(uColor * 3., uAlpha); }",
        transparent: true, depthWrite: false, blending: AdditiveBlending, fog: false,
        uniforms: { uColor: { value: new Color().setRGB(...lin([1, 0.72, 0.28])) }, uAlpha: { value: 0 } },
      }));
      mesh.frustumCulled = false;
      this.sparks.push({ mesh, v: [0, 0, 0], delay: 0 });
      this.group.add(mesh);
    }
    scene.add(this.group);
  }

  /** @param position the ball's world position; @param team scoring team (0 blue, 1 orange) */
  trigger(position, team) {
    this.age = 0;
    this.group.visible = true;
    // Burst back into the field, away from the net the ball just entered.
    const inward = position.z > 0 ? -1 : 1;
    const fire = TEAM_FIRE[team] ?? TEAM_FIRE[0];
    const smoke = TEAM_SMOKE[team] ?? TEAM_SMOKE[0];
    for (const p of this.fire) {
      p.mesh.position.set(position.x + rand(-90, 90), position.y + rand(-30, 120), position.z + rand(-90, 90));
      p.v = [rand(-420, 420), rand(60, 520), inward * rand(80, 900)];
      p.delay = rand(0, 0.18);
      p.size = rand(140, 340);
      p.mesh.material.uniforms.uColor.value.setRGB(...fire);
      p.mesh.visible = false;
    }
    for (const p of this.smoke) {
      p.mesh.position.set(position.x + rand(-150, 150), position.y + rand(-30, 160), position.z + rand(-120, 120));
      p.v = [rand(-520, 520), rand(120, 640), inward * rand(60, 1100)];
      p.delay = rand(0.05, 0.4);
      p.size = rand(150, 320);
      p.mesh.material.uniforms.uColor.value.setRGB(...smoke);
      p.mesh.visible = false;
    }
    for (const s of this.sparks) {
      s.mesh.position.set(position.x, position.y + 40, position.z);
      s.v = [rand(-1500, 1500), rand(200, 1700), inward * rand(100, 1900) + rand(-400, 400)];
      s.delay = rand(0, 0.12);
      s.mesh.material.uniforms.uAlpha.value = 0;
      s.mesh.visible = false;
    }
    this.ring.position.set(position.x, 14, position.z);
    this.ring.material.uniforms.uColor.value.setRGB(...(TEAM_RING[team] ?? TEAM_RING[0]));
    this.ring.scale.setScalar(1);
  }

  clear() {
    this.age = Infinity;
    this.group.visible = false;
  }

  update(dt) {
    if (this.age === Infinity) return;
    this.age += dt;
    const t = this.age;
    if (t > this.duration) {
      this.clear();
      return;
    }
    const swell = (p, life, grow, alpha, hot) => {
      const local = t - p.delay;
      if (local < 0) return;
      const k = Math.min(1, local / life);
      p.mesh.visible = k < 1;
      p.mesh.position.x += p.v[0] * dt * (1 - k * 0.7);
      p.mesh.position.y += p.v[1] * dt * (1 - k * 0.6);
      p.mesh.position.z += p.v[2] * dt * (1 - k * 0.7);
      p.mesh.scale.setScalar(p.size * (0.35 + grow * Math.sqrt(k)));
      const fade = (1 - k) * Math.min(1, local * 12);
      p.mesh.material.uniforms.uAlpha.value = fade * alpha;
      p.mesh.material.uniforms.uHot.value = hot * (1 - k);
    };
    for (const p of this.fire) swell(p, 0.9, 2.1, 1.25, 1);
    for (const p of this.smoke) swell(p, 2.2, 1.7, 0.5, 0);
    const ring = t / 0.8;
    this.ring.visible = ring < 1;
    this.ring.scale.setScalar(120 + ring * 2600);
    this.ring.material.uniforms.uAlpha.value = (1 - ring) * 0.9;
    for (const s of this.sparks) {
      const local = t - s.delay;
      if (local < 0) continue;
      s.v[1] -= 1400 * dt;
      s.mesh.position.x += s.v[0] * dt;
      s.mesh.position.y = Math.max(4, s.mesh.position.y + s.v[1] * dt);
      s.mesh.position.z += s.v[2] * dt;
      s.mesh.lookAt(s.mesh.position.x + s.v[0], s.mesh.position.y + s.v[1], s.mesh.position.z + s.v[2]);
      const k = Math.min(1, local / 1.5);
      s.mesh.visible = k < 1;
      s.mesh.material.uniforms.uAlpha.value = (1 - k) * 0.95;
    }
  }
}

const GLOW_VERTEX = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }";
const GLOW_FRAGMENT = `varying vec2 vUv; uniform vec3 uColor; uniform float uAlpha;
void main(){ float r = length(vUv - .5) * 2.; float g = pow(max(1. - r, 0.), 2.2);
  gl_FragColor = vec4(uColor * g * 1.8, g * uAlpha); }`;

/** A warm pool of light under each boosting car. */
export class BoostGlow {
  constructor(scene, count) {
    this.scene = scene;
    this.discs = [];
    this.levels = [];
    this.geometry = new PlaneGeometry(1, 1);
    this.ensure(count);
  }

  ensure(count) {
    while (this.discs.length < count) {
      const mesh = new Mesh(this.geometry, new ShaderMaterial({
        vertexShader: GLOW_VERTEX, fragmentShader: GLOW_FRAGMENT,
        transparent: true, depthWrite: false, blending: AdditiveBlending, fog: false,
        uniforms: { uColor: { value: new Color().setRGB(...lin([1, 0.52, 0.16])) }, uAlpha: { value: 0 } },
      }));
      mesh.rotation.x = -Math.PI / 2;
      mesh.frustumCulled = false;
      mesh.visible = false;
      mesh.renderOrder = 1;
      this.scene.add(mesh);
      this.discs.push(mesh);
      this.levels.push(0);
    }
  }

  /** @param cars world car groups; @param boosting boolean per car; @param demolished boolean per car */
  update(dt, cars, boosting, demolished) {
    this.ensure(cars.length);
    for (let i = 0; i < this.discs.length; i++) {
      const target = i < cars.length && boosting[i] && !demolished[i] ? 1 : 0;
      // Fast attack, slower release: the light lingers a beat after the flame stops.
      this.levels[i] += (target - this.levels[i]) * Math.min(1, dt * (target > this.levels[i] ? 14 : 5));
      const disc = this.discs[i];
      const level = this.levels[i];
      disc.visible = level > 0.02 && i < cars.length;
      if (!disc.visible) continue;
      const car = cars[i];
      disc.position.set(car.position.x, 5, car.position.z);
      const flicker = 0.9 + 0.1 * Math.sin(performance.now() / 38 + i * 2.1);
      disc.scale.setScalar(620 * (0.7 + level * 0.3));
      disc.material.uniforms.uAlpha.value = 0.5 * level * flicker;
    }
  }

  clear() {
    this.levels.fill(0);
    for (const disc of this.discs) disc.visible = false;
  }
}
