import {Lt, Ne, F, Zt, nl, er, pr, qt, fr, Ut} from '../vendor/three.js';
import {REFERENCE_MATCH_CAR_FRAGMENT} from './reference-match-car.js';
import { REFERENCE_GRAPHICS_DEFAULTS, referencePaletteColors, referenceSunDirection } from '../settings/reference-graphics.js';
import { classifyCarSurface } from './car.js';
let lightingPromise;
export const resolveFennecV2Asset = url => url === '/assets/sketchfab/fennec/model.glb' ? '/assets/sketchfab/fennec-v2/model.glb' : url;
export function loadFennecV2Lighting() {
  return lightingPromise ??= fetch('/assets/lighting/open-me-park.bin').then(async response => {
    if (!response.ok) throw new Error('Fennec v2 HDR lighting failed to load');
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength !== 1048560) throw new Error('Invalid compact HDR lighting size');
    let offset = 0;
    const levels = [];
    for (let size = 128; size >= 1; size /= 2) {
      const images = [];
      for (let face = 0; face < 6; face++) {
        images.push(new nl(new Uint16Array(buffer, offset, size * size * 4), size, size));
        offset += size * size * 8;
      }
      levels.push({image: images});
    }
    // The pinned engine accepts data-backed cube textures through this standard
    // Texture interface; no renderer internals or additional engine are loaded.
    const cube = new Zt(levels[0].image);
    cube.isCubeTexture = true; cube.flipY = false; cube.type = er;
    cube.minFilter = pr; cube.magFilter = qt; cube.wrapS = cube.wrapT = fr;
    cube.generateMipmaps = false; cube.mipmaps = levels.slice(1);
    cube.colorSpace = ''; cube.needsUpdate = true;
    return cube;
  });
}
const vertex = `
#include <common>
#include <shadowmap_pars_vertex>
attribute float _pearl_ao;
attribute vec3 _surface_position;
uniform float uHasSurfacePosition;
varying vec3 vWorld,vNormal,vLocalPosition,vSurfacePosition;
varying vec2 vUV;
varying vec4 vShadow;
varying float vOcclusion;
void main(){
  vWorld=(modelMatrix*vec4(position,1.)).xyz;
  vNormal=normal;
  vSurfacePosition=mix(position,_surface_position,uHasSurfacePosition);
  // Wheels use their own centered coordinates; only body/lamp shading needs q.
  vLocalPosition=(position-vec3(4.305076,-18.460744,-.05224148))/30.526412568;
  vUV=uv;vOcclusion=_pearl_ao;vShadow=vec4(0.);
  vec3 transformedNormal=normalMatrix*normal;
  vec4 worldPosition=modelMatrix*vec4(position,1.);
  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
  #include <shadowmap_vertex>
}`;
const rawMap = map => {
  if (!map) return null;
  const copy=map.clone(); copy.colorSpace=''; copy.needsUpdate=true; return copy;
};
const neutralNormal = new nl(new Uint8Array([128,128,255,255]),1,1);
neutralNormal.needsUpdate = true;
const neutralColor = new nl(new Uint8Array([128,128,128,255]),1,1);
neutralColor.needsUpdate = true;
export function createFennecV2Material(source, environment) {
  const uniforms={};
  for (const name of ['ambientLightColor','lightProbe','directionalLights','directionalLightShadows','directionalShadowMatrix','spotLights','spotLightShadows','spotLightMatrix','spotLightMap','pointLights','pointLightShadows','pointShadowMatrix','hemisphereLights','rectAreaLights','ltc_1','ltc_2']) uniforms[name]={value:[]};
  const sourceColor=source.color?.clone?.()??new Ne(0xffffff);
  Object.assign(uniforms,{
    uLightDir:{value:new F(...referenceSunDirection(REFERENCE_GRAPHICS_DEFAULTS))},
    uFace:{value:sourceColor.clone()},uPearl:{value:sourceColor.clone()},
    uOffset:{value:new F()},uRoughness:{value:.38},uMetalness:{value:.73},
    uPearlShift:{value:.015},uReflection:{value:2.5},uLightPower:{value:3.5},uAO:{value:.53},
    uMaterial:{value:source.userData.fennecV2Material},uEnvironmentFiltered:{value:1},uReferencePanels:{value:source.userData.vanguardMaterial?2:source.userData.referenceGenericCar?0:1},uClearcoat:{value:1},
    uSourceColor:{value:sourceColor},uHasColorMap:{value:Number(Boolean(source.map))},
    uHasSurfacePosition:{value:0},
    uSurfaceFitScale:{value:new F(1,1,1)},uSurfaceFitOffset:{value:new F()},
    uGaragePaint:{value:0},
    uSourceRoughness:{value:source.roughness??.5},uSourceMetalness:{value:source.metalness??0},uSourceClearcoat:{value:source.userData.trioClearcoat??source.clearcoat??0},
    uMakeup:{value:1},uSunColor:{value:new F(.96,.965,.88)},uZenith:{value:new F(.18,.36,.60)},uHorizon:{value:new F(.47,.75,.92)},uOmniTint:{value:.2},uFog:{value:.65},uShadowBlur:{value:1.7},
    uColorMap:{value:rawMap(source.map)??neutralColor},uNormalMap:{value:rawMap(source.normalMap)??neutralNormal},
    uEnvironment:{value:environment},
  });
  uniforms.uReferenceLook = { value: 0 };
  uniforms.uVanguardOriginal = { value: Number(Boolean(source.userData.vanguardOriginal)) };
  uniforms.uSpectreEmission = { value: new F(...(source.userData.spectreEmission ?? [0,0,0])) };
  uniforms.uSpectreFront = { value: Number(source.name === 'spectre-headlight') };
  uniforms.uSpectreBody = { value: Number(/^spectre-(paint|glass|trim|headlight|taillight)$/.test(source.name)) };
  uniforms.uSolidFinish = { value: Number(Boolean(source.userData.trioFinish)) };
  uniforms.uTripoBody = { value: Number(Boolean(source.userData.tripoBody)) };
  uniforms.uTrioBody = { value: source.userData.trioBody ?? 0 };
  // Both stages must use the same varying/uniform precision. The main renderer
  // defaults to mediump; the supplied fragment explicitly requires highp.
  const material=new Lt({name:source.name,precision:'highp',uniforms,vertexShader:vertex,fragmentShader:REFERENCE_MATCH_CAR_FRAGMENT,lights:true,side:Ut,toneMapped:false});
  material.userData.fennecV2=true;
  material.defaultAttributeValues._pearl_ao = [1];
  material.defaultAttributeValues._surface_position = [0,0,0];
  material.map=source.map; // Preserve atlas metadata for the existing inspector.
  return material;
}

export function applyReferenceCarSettings(material, settings, theme = 'realistic') {
  if (!material?.userData?.fennecV2) return;
  const uniforms = material.uniforms, colors = referencePaletteColors(settings);
  uniforms.uMakeup.value = Number(theme === 'realistic' && settings.renderer === 'makeup');
  uniforms.uReferenceLook.value = Number(uniforms.uMakeup.value && settings.lightweightLook);
  uniforms.uLightDir.value.fromArray(referenceSunDirection(settings));
  uniforms.uSunColor.value.fromArray(colors.sun);
  uniforms.uZenith.value.fromArray(colors.zenith);
  uniforms.uHorizon.value.fromArray(colors.horizon);
  uniforms.uOmniTint.value = colors.omni;
  for (const [key, name] of Object.entries({ roughness: 'uRoughness', metalness: 'uMetalness', pearlShift: 'uPearlShift', reflection: 'uReflection', lightPower: 'uLightPower', ao: 'uAO', fog: 'uFog', shadowBlur: 'uShadowBlur' }))
    uniforms[name].value = settings[key];
  uniforms.uClearcoat.value = 1;
  const paint = material.userData.garagePaint;
  if (paint) {
    uniforms.uGaragePaint.value = 1;
    uniforms.uFace.value.set(paint.primary);
    uniforms.uPearl.value.set(paint.pearl);
    uniforms.uRoughness.value = paint.roughness;
    uniforms.uMetalness.value = paint.metalness;
    uniforms.uClearcoat.value = paint.clearcoat;
  }
}

export function createReferenceImportedCarMaterial(source, environment) {
  if (source.userData?.fennecV2Material !== undefined) return createFennecV2Material(source, environment);
  const surface = classifyCarSurface(source);
  const kind = {paint:4,glass:5,rubber:1,metal:0,atlas:2,trim:6}[surface];
  return createFennecV2Material({
    name:source.name,color:source.color,map:source.map,normalMap:source.normalMap,
    roughness:source.roughness,metalness:source.metalness,clearcoat:source.clearcoat,
    userData:{fennecV2Material:kind,referenceGenericCar:true},
  },environment);
}
