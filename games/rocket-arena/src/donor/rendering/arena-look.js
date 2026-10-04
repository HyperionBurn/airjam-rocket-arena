// AIR JAM PATCH (new file, not upstream): the arena's atmosphere.
//
// The donor ships one bright daytime park. A match under floodlights reads far
// better on a projector and gives bloom something to work with, so this module
// turns the same scene into a dusk arena without touching its geometry:
//
//   * a procedural sky (warm horizon, magenta band, indigo zenith, stars)
//   * dusk light colours (warm low sun, cool violet fill) and matching fog
//   * the unlit scenery (mountains, skyline, trees) tinted into the evening
//   * slow sweeping floodlight beams around the stadium
//
// Everything here is original and procedural; nothing is loaded. It is idempotent
// and reversible only by reloading, which is fine for a boot-once page.
import {
  Group, Mesh, CylinderGeometry, ShaderMaterial, AdditiveBlending, DoubleSide, Color,
} from "../vendor/three.js";

/** The palette. sRGB-authored; converted to linear where it reaches a shader. */
export const DUSK = Object.freeze({
  horizon: [0.95, 0.5, 0.36],
  band: [0.4, 0.2, 0.55],
  zenith: [0.03, 0.04, 0.18],
  fog: 0x4a3566,
  background: 0x1a1747,
  hemiSky: 0x7f74d6,
  hemiGround: 0x241a3a,
  hemiIntensity: 1.0,
  sun: 0xffb585,
  sunIntensity: 0.95,
  fill: 0x7d8cff,
  fillIntensity: 0.5,
});

const lin = (c) => c.map((v) => Math.pow(v, 2.2));

function styleSky(sky) {
  sky.traverse((object) => {
    if (!object.isMesh || object.name !== "Park / painted alpine panorama") return;
    const material = object.material;
    material.onBeforeCompile = (shader) => {
      shader.uniforms.duskHorizon = { value: new Color().setRGB(...lin(DUSK.horizon)) };
      shader.uniforms.duskBand = { value: new Color().setRGB(...lin(DUSK.band)) };
      shader.uniforms.duskZenith = { value: new Color().setRGB(...lin(DUSK.zenith)) };
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", `#include <common>
uniform vec3 duskHorizon, duskBand, duskZenith;
float duskHash(vec2 p){ return fract(sin(dot(p, vec2(41.7, 289.3))) * 43758.5453); }`)
        .replace("#include <map_fragment>", `
  float h = clamp(vMapUv.y, 0., 1.);
  vec3 skyCol = mix(duskHorizon, duskBand, smoothstep(.0, .3, h));
  skyCol = mix(skyCol, duskZenith, smoothstep(.2, .78, h));
  // A low sun glow on one side, and the painted clouds picked out as soft highlights.
  float glow = exp(-pow((fract(vMapUv.x + .15) - .5) * 5., 2.)) * (1. - smoothstep(0., .35, h));
  skyCol += vec3(1., .55, .25) * glow * .4;
  float cloud = smoothstep(.62, .98, dot(texture2D(map, vMapUv).rgb, vec3(.333)));
  skyCol += mix(vec3(.55, .2, .35), vec3(.35, .22, .55), h) * cloud * .5 * (1. - smoothstep(.5, .9, h));
  // Stars, only high up.
  vec2 cell = floor(vMapUv * vec2(2400., 800.));
  float star = step(.9985, duskHash(cell)) * smoothstep(.42, .75, h);
  skyCol += vec3(.9, .95, 1.) * star * (.35 + .35 * duskHash(cell + 7.));
  vec4 sampledDiffuseColor = vec4(skyCol, 1.);
  diffuseColor *= sampledDiffuseColor;`);
    };
    material.customProgramCacheKey = () => "arena-dusk-sky-v1";
    material.needsUpdate = true;
  });
}

/** Evening tints for the unlit backdrop, keyed on the donor's mesh names. */
const TINTS = [
  [/alpine mountains/i, [0.34, 0.24, 0.48]],
  [/glass skyline/i, [0.62, 0.66, 1.0]],
  [/poplar/i, [0.3, 0.3, 0.46]],
  [/bush/i, [0.3, 0.3, 0.44]],
  [/rolling land/i, [0.26, 0.26, 0.4]],
  [/flags/i, [0.95, 0.9, 1.0]],
];

function tintScenery(sky) {
  sky.traverse((object) => {
    if (!object.isMesh || !object.material?.color) return;
    for (const [pattern, rgb] of TINTS) {
      if (pattern.test(object.name)) {
        object.material.color.setRGB(...rgb);
        break;
      }
    }
  });
}

function relight(scene) {
  scene.traverse((light) => {
    if (light.isHemisphereLight) {
      light.color.set(DUSK.hemiSky);
      light.groundColor.set(DUSK.hemiGround);
      light.intensity = DUSK.hemiIntensity;
    } else if (light.isDirectionalLight) {
      const fill = light.intensity < 0.6;
      light.color.set(fill ? DUSK.fill : DUSK.sun);
      light.intensity = fill ? DUSK.fillIntensity : DUSK.sunIntensity;
    }
  });
}

const BEAM_VERTEX = `
varying vec2 vUv; varying vec3 vNormalV; varying vec3 vViewDir;
void main(){
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.);
  vNormalV = normalize(normalMatrix * normal);
  vViewDir = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

const BEAM_FRAGMENT = `
varying vec2 vUv; varying vec3 vNormalV; varying vec3 vViewDir;
uniform vec3 uColor; uniform float uAlpha;
void main(){
  // Brightest at the lamp (uv.y = 0), fading to nothing; edges soften by view angle.
  float along = pow(1. - vUv.y, 1.6);
  float soft = pow(abs(dot(normalize(vNormalV), normalize(vViewDir))), 1.4);
  gl_FragColor = vec4(uColor, along * soft * uAlpha);
}`;

function floodlightBeams(scene) {
  const group = new Group();
  group.name = "Arena / floodlight beams";
  // Lamps stand outside the walls (field is 8192 x 10240) and fire up and inward.
  const lamps = [
    [-5600, -7000], [5600, -7000], [-5600, 7000], [5600, 7000],
    [-5900, -2400], [5900, -2400], [-5900, 2400], [5900, 2400],
    [-2800, -7600], [2800, -7600], [-2800, 7600], [2800, 7600],
  ];
  lamps.forEach(([x, z], index) => {
    const warm = index % 3 === 0;
    const material = new ShaderMaterial({
      vertexShader: BEAM_VERTEX,
      fragmentShader: BEAM_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
      fog: false,
      uniforms: {
        uColor: { value: new Color().setRGB(...(warm ? lin([1, 0.62, 0.34]) : lin([0.55, 0.7, 1]))) },
        uAlpha: { value: warm ? 0.2 : 0.17 },
      },
    });
    // Cone opens upward: narrow at the lamp, wide at the sky.
    const length = 15000;
    const beam = new Mesh(new CylinderGeometry(1400, 90, length, 20, 1, true), material);
    beam.frustumCulled = false;
    beam.renderOrder = -500;
    const pivot = new Group();
    pivot.position.set(x, 0, z);
    beam.position.y = length / 2;
    pivot.add(beam);
    // Aim each beam toward the arena centre and sweep it slowly.
    const toCentre = Math.atan2(-x, -z);
    const base = 0.32 + 0.1 * Math.sin(index * 1.7);
    pivot.onBeforeRender = undefined;
    beam.onBeforeRender = () => {
      const t = performance.now() / 1000;
      pivot.rotation.set(
        Math.cos(toCentre) * (base + 0.12 * Math.sin(t * 0.35 + index)) * -1,
        0,
        Math.sin(toCentre) * (base + 0.12 * Math.sin(t * 0.35 + index)) * 1,
      );
      pivot.updateMatrixWorld(true);
    };
    group.add(pivot);
  });
  scene.add(group);
  return group;
}

/** Apply the dusk look once. Safe to call again. */
export function applyDuskLook(world) {
  if (world.userData?.duskLook || !world?.scene) return;
  world.userData ??= {};
  world.userData.duskLook = true;
  const { scene } = world;
  scene.background = new Color(DUSK.background);
  if (scene.fog) {
    scene.fog.color.set(DUSK.fog);
    scene.fog.near = 30000;
    scene.fog.far = 90000;
  }
  relight(scene);
  if (world.sky) {
    styleSky(world.sky);
    tintScenery(world.sky);
  }
  world.userData.beams = floodlightBeams(scene);
  world.markRenderTreeChanged?.();
}
