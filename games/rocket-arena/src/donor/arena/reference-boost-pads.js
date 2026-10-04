import { Group, Mesh, Matrix4, BufferGeometry, Float32BufferAttribute, ShaderMaterial, AdditiveBlending, DoubleSide, Lm as InstancedMesh, nl as DataTexture, qt as LinearFilter } from '../vendor/three.js';
import { createGeometry, VERTEX, METAL, ENERGY, ORB, GLOW_VERTEX, GLOW } from './reference-boost-source.js';

let noiseTexture;
function getNoiseTexture() {
  if (noiseTexture) return noiseTexture;
  const data = new Uint8Array(32 * 32 * 32 * 4);
  let seed = 8391023;
  for (let i = 0; i < data.length; i += 4) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    data[i] = data[i + 1] = data[i + 2] = seed >>> 24; data[i + 3] = 255;
  }
  noiseTexture = new DataTexture(data, 32, 1024);
  noiseTexture.minFilter = noiseTexture.magFilter = LinearFilter;
  // A tiled noise atlas replaces the standalone viewer's sampler3D.
  noiseTexture.wrapS = noiseTexture.wrapT = 1000;
  noiseTexture.needsUpdate = true;
  return noiseTexture;
}

function adaptShader(source, vertex, billboard = false) {
  let result = source.replace('#version 300 es', '')
    .replace(/layout\(location=\d\) in /g, 'attribute ')
    .replace(/flat (?:in|out) int vKind;/g, 'varying float vKind;')
    .replace(/\b(?:in|out) (vec[234]) /g, 'varying $1 ')
    .replace(/varying vec4 fragColor;/g, '')
    .replace(/\bfragColor\b/g, 'gl_FragColor')
    .replace(/int\(aKind\+\.5\)/g, 'aKind')
    .replace(/vKind==(\d)/g, 'vKind==$1.')
    .replace(/uniform mat4 uModel,uVP;/g, '')
    .replace(/uniform mat4 uModel;/g, '')
    .replace(/uniform vec3 uCamera;/g, '')
    .replace(/\buCamera\b/g, 'cameraPosition')
    .replace(/\buModel\b/g, 'modelMatrix')
    .replace(/\buVP\b/g, '(projectionMatrix*viewMatrix)')
    .replace(/\baPosition\b/g, 'position').replace(/\baNormal\b/g, 'normal').replace(/\baUv\b/g, 'uv')
    .replace(/attribute vec[23] (position|normal|uv);/g, '')
    .replace('return pow(max(c,vec3(0.)),vec3(.454545));', 'return max(c,vec3(0.));')
    .replace('precision highp sampler3D;', '')
    .replace('uniform sampler3D uNoise;', 'uniform sampler2D uNoise;')
    .replace('float noise3(vec3 p){return texture(uNoise,(p+.5)/32.).r;}', `float noise3(vec3 p){
      p=mod(p,32.); float z=floor(p.z);
      vec2 a=vec2((p.x+.5)/32.,(p.y+.5+z*32.)/1024.);
      vec2 b=vec2(a.x,(p.y+.5+mod(z+1.,32.)*32.)/1024.);
      return mix(texture2D(uNoise,a).r,texture2D(uNoise,b).r,fract(p.z));
    }`)
    .replace('transpose(mat3(modelMatrix))*v', 'v');
  if (vertex) result = result.replace(/modelMatrix/g, 'padModel').replace('void main(){', `void main(){
    mat4 padModel=modelMatrix;
    #ifdef USE_INSTANCING
    padModel=modelMatrix*instanceMatrix;
    #endif
  `);
  if (billboard) result = result.replace('uniform vec3 uRight,uUp;', '')
    .replace('uRight*position.x+uUp*position.y', 'vec3(viewMatrix[0][0],viewMatrix[1][0],viewMatrix[2][0])*position.x+vec3(viewMatrix[0][1],viewMatrix[1][1],viewMatrix[2][1])*position.y');
  if (!vertex) result = result.replace(/\n  }\s*$/, '\n#include <colorspace_fragment>\n  }');
  return result;
}

function bufferGeometry(data) {
  const geometry = new BufferGeometry();
  // Share only bit-identical complete vertices. Keep triangle order, UV seams,
  // normals, colors and kind boundaries, including transparent overlap, intact.
  const packed = new Float32Array(data), bits = new Uint32Array(packed.buffer);
  const unique = [], indices = [], vertices = new Map();
  for (let offset = 0; offset < packed.length; offset += 12) {
    const key = bits.subarray(offset, offset + 12).join(',');
    let index = vertices.get(key);
    if (index === undefined) {
      index = unique.length / 12;
      vertices.set(key, index);
      for (let component = 0; component < 12; component++) unique.push(packed[offset + component]);
    }
    indices.push(index);
  }
  for (const [name, offset, size] of [['position', 0, 3], ['normal', 3, 3], ['uv', 6, 2], ['aColor', 8, 3], ['aKind', 11, 1]]) {
    const values = [];
    for (let i = 0; i < unique.length; i += 12) values.push(...unique.slice(i + offset, i + offset + size));
    geometry.setAttribute(name, new Float32BufferAttribute(values, size));
  }
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

export function createReferenceBoostPad(big, active) {
  const group = new Group();
  group.name = `Reference boost / ${big ? '100' : '12'} / ${active ? 'ready' : 'empty'}`;
  const scale = (big ? 82.5 : 45) / (1.80 * 1.012);
  group.scale.setScalar(scale);
  group.userData.pickupSizeUnchanged = true;
  group.userData.referenceBoost = true;
  const geometry = createGeometry({ full: big });
  for (const [name, shader] of [['body', METAL], ['orb', ORB], ['energy', ENERGY], ['glow', GLOW]]) {
    if (!geometry[name].data.length || (!active && name !== 'body')) continue;
    const transparent = name === 'energy' || name === 'glow';
    const material = new ShaderMaterial({
      name: `Reference boost / ${name}`,
      uniforms: { uTime: { value: 0 }, uGlow: { value: active ? 1 : 0 }, uFull: { value: Number(big) }, uWarm: { value: big ? .8 : 0 }, uStudio: { value: 0 }, uWire: { value: 0 }, uNoise: { value: getNoiseTexture() } },
      vertexShader: adaptShader(name === 'glow' ? GLOW_VERTEX : VERTEX, true, name === 'glow'),
      fragmentShader: adaptShader(shader, false),
      transparent, blending: transparent ? AdditiveBlending : 1, depthWrite: !transparent,
      side: DoubleSide, toneMapped: false, precision: 'highp',
    });
    const mesh = new Mesh(bufferGeometry(geometry[name].data), material);
    mesh.name = `Reference boost / ${name}`;
    mesh.renderOrder = transparent ? 2 : 0;
    group.add(mesh);
  }
  return group;
}

// The supplied reference keeps both metal pickup and orb fixed in place.
export function updateReferenceBoostPad(pad, time) {
  if (pad.userData.referenceBatch) {
    pad.userData.referenceBatch.update(pad.userData.referenceIndex, pad.visible, time);
    return;
  }
  if (!pad.visible) return;
  for (const mesh of pad.children) if (mesh.material?.uniforms?.uTime) mesh.material.uniforms.uTime.value = time;
}

// Seven shared draws for the complete field, irrespective of pickup count.
// Only changing pickup visibility uploads instance transforms; positions and
// RocketSim activation/cooldown data remain owned by GameWorld/physics.
export function createReferenceBoostPadBatch(layout) {
  const root = new Group(); root.name = 'Reference boost pickups / instanced';
  const pads = new Array(layout.length), matrix = new Matrix4();
  for (const big of [false, true]) {
    const entries = layout.map((pad, index) => ({ ...pad, index })).filter(pad => pad.isBig === big);
    if (!entries.length) continue;
    const template = createReferenceBoostPad(big, true), scale = template.scale.x;
    const meshes = template.children.map(source => {
      const mesh = new InstancedMesh(source.geometry, source.material, entries.length);
      mesh.name = source.name; mesh.renderOrder = source.renderOrder;
      mesh.frustumCulled = false;
      entries.forEach((pad, i) => mesh.setMatrixAt(i, matrix.makeScale(scale, scale, scale).setPosition(pad.pos[0], 0, pad.pos[1])));
      mesh.instanceMatrix.needsUpdate = true;
      root.add(mesh); return mesh;
    });
    const active = entries.map(() => true);
    const batch = { update(index, visible, time) {
      for (const mesh of meshes) {
        mesh.material.uniforms.uTime.value = time;
        if (active[index] === visible || mesh.name.endsWith('/ body')) continue;
        const size = visible ? scale : 0.000001;
        mesh.setMatrixAt(index, matrix.makeScale(size, size, size).setPosition(entries[index].pos[0], 0, entries[index].pos[1]));
        mesh.instanceMatrix.needsUpdate = true;
      }
      active[index] = visible;
    } };
    entries.forEach((entry, i) => {
      const full = new Group(), base = new Group(); base.visible = false;
      full.userData.referenceBatch = batch; full.userData.referenceIndex = i;
      pads[entry.index] = { full, base };
    });
  }
  return { root, pads };
}
