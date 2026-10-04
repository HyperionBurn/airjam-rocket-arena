// OPEN_ME compensates photographed / already-graded map colors before MakeUp's
// output curve. This preserves existing artwork without editing any asset.
export const REFERENCE_SCENERY_FRAGMENT = `
uniform float referenceMakeup,referenceHaze,referenceLook,referenceSky;
uniform vec3 referenceTint,referenceHorizon;
varying vec3 referenceWorldPosition;
vec3 referenceSignal(vec3 c){c=max(c,vec3(0.));return mix(c*12.92,1.055*pow(c,vec3(1./2.4))-.055,step(vec3(.0031308),c));}
vec3 referenceLinear(vec3 s){s=max(s,vec3(0.));return mix(s/12.92,pow((s+.055)/1.055,vec3(2.4)),step(vec3(.04045),s));}
vec3 referenceSceneryRadiance(vec3 linearColor){
 if(referenceMakeup<.5)return linearColor;
 vec3 display=referenceSignal(linearColor)*referenceTint;
 if(referenceLook>.5){
   if(referenceSky>.5){
     float blue=smoothstep(.025,.16,display.b-display.r);
     float bright=smoothstep(.60,.88,min(display.r,min(display.g,display.b)));
     vec3 sky=display*vec3(.65,.84,.77);
     display=mix(display,sky,blue*(1.-bright));
     display=mix(display, min(vec3(.96,.97,.94),display*1.04),bright);
     float horizon=1.-smoothstep(.025,.30,normalize(referenceWorldPosition-cameraPosition).y);
     display=mix(display,vec3(.60,.76,.76),horizon*blue*.48);
   }else{
     float luma=dot(display,vec3(.2126,.7152,.0722));
     display=mix(vec3(luma),display,1.06);
     display=mix(display*vec3(.80,.91,.95),display*vec3(1.12,1.10,1.01),smoothstep(.22,.78,luma));
     float foliage=smoothstep(.015,.10,display.g-max(display.r,display.b));
     display=mix(display,display*vec3(.90,.91,.97),foliage);
   }
 }
 float haze=clamp(pow(length(referenceWorldPosition-cameraPosition)/20000.,3.)*referenceHaze,0.,.6);
 display=mix(display,referenceHorizon,haze);
 vec3 c=pow(clamp(display,vec3(.000001),vec3(.985)),vec3(1./1.15));
 vec3 s=c/(1.4*pow(max(vec3(.001),1.-pow(c,vec3(2.5))),vec3(.4)));
 return referenceLinear(s);
}
`;

export function bindReferenceScenery(material, uniforms) {
  if (!material || material.userData.referenceScenery) return;
  const compile = material.onBeforeCompile, key = material.customProgramCacheKey();
  // World-space distance arithmetic exceeds half-float range on mobile GPUs.
  material.precision = 'highp';
  material.userData.referenceScenery = true;
  material.onBeforeCompile = function(shader, renderer) {
    compile.call(this, shader, renderer);
    if (shader.fragmentShader.includes('diffuseColor.a*=parkTreeVisibility;')) {
      shader.fragmentShader = shader.fragmentShader.replace('diffuseColor.a*=parkTreeVisibility;', `
        diffuseColor.a*=parkTreeVisibility;
        diffuseColor.rgb*=mix(vec3(1.),mix(vec3(.44,.57,.49),vec3(1.03,1.01,.91),smoothstep(.10,.85,vMapUv.y)),referenceLook);`);
    }
    Object.assign(shader.uniforms, uniforms);
    shader.uniforms.referenceSky = { value: Number(material.fog === false) };
    shader.vertexShader = 'varying vec3 referenceWorldPosition;\n' + shader.vertexShader;
    const end = shader.vertexShader.lastIndexOf('}');
    shader.vertexShader = shader.vertexShader.slice(0, end) + `
      vec4 referencePosition=vec4(position,1.);
      #ifdef USE_INSTANCING
      referencePosition=instanceMatrix*referencePosition;
      #endif
      referenceWorldPosition=(modelMatrix*referencePosition).xyz;
    ` + shader.vertexShader.slice(end);
    shader.fragmentShader = REFERENCE_SCENERY_FRAGMENT + shader.fragmentShader;
    const transfer = 'gl_FragColor.rgb=referenceSceneryRadiance(gl_FragColor.rgb);\n';
    if (shader.fragmentShader.includes('#include <colorspace_fragment>'))
      shader.fragmentShader = shader.fragmentShader.replace('#include <colorspace_fragment>', transfer + '#include <colorspace_fragment>');
    else {
      const end = shader.fragmentShader.lastIndexOf('}');
      shader.fragmentShader = shader.fragmentShader.slice(0, end) + transfer + shader.fragmentShader.slice(end);
    }
  };
  material.customProgramCacheKey = () => key + '/open-me-scenery-v1';
  material.needsUpdate = true;
}
