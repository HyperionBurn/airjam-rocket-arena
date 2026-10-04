import { TRIPO_SURFACES, TRIPO_SURFACE_HELPERS } from './tripo-surfaces.js';
import { REFERENCE_CAR_FRAGMENT } from './reference-car-fragment.js';
import { SPECTRE_SURFACES, SPECTRE_SURFACE_HELPERS, SPECTRE_MAX_COAT_ATTENUATION } from './spectre-surfaces.js';
import { TRIO_SURFACES, TRIO_SURFACE_HELPERS } from './trio-surfaces.js';

// Preserve the imported shader and authored mesh; the checkbox changes uniforms.
export const REFERENCE_MATCH_CAR_FRAGMENT = REFERENCE_CAR_FRAGMENT
  .replace('void main(){', `${SPECTRE_SURFACE_HELPERS}\n${TRIO_SURFACE_HELPERS}\n${TRIPO_SURFACE_HELPERS}\nvoid main(){\n bool spectrePaint=false;bool trioPaintSurface=false;bool tripoPaint=false;`)
  .replace('uniform float uClearcoat;', `uniform float uClearcoat,uReferenceLook;
uniform vec3 uSourceColor,uSpectreEmission,uSurfaceFitScale,uSurfaceFitOffset;
uniform int uHasColorMap,uVanguardOriginal,uSpectreFront,uSpectreBody,uSolidFinish,uTrioBody,uGaragePaint;
uniform float uTripoBody;
uniform float uHasSurfacePosition;
varying vec3 vSurfacePosition;
uniform float uSourceRoughness,uSourceMetalness,uSourceClearcoat;`)
  .replace('return textureLod(uEnvironment,R,rough*(uEnvironmentFiltered==1?8.:7.)).rgb;', `
   vec3 radiance=textureLod(uEnvironment,R,rough*7.).rgb;
   if(uSpectreBody==1||uSolidFinish==1){
     // Broad neutral stadium reflections, without the park's colored tree
     // detail making this solid paint look like a patterned skin.
     float sky=max(R.y,0.);
     float ceiling=pow(max(0.,dot(R,normalize(vec3(-.22,.95,.24)))),mix(75.,6.,rough));
     float strip=pow(max(0.,dot(R,normalize(vec3(.1,.35,-.93)))),mix(110.,8.,rough));
     radiance=vec3(.07,.08,.10)+vec3(.21,.25,.32)*sky+vec3(5.5)*ceiling+vec3(1.7)*strip;
   }
   if(uReferenceLook>.5&&uMaterial==4&&uSpectreBody==0&&uTrioBody==0){
     float sky=smoothstep(-.08,.65,R.y);
     vec3 daylight=mix(vec3(.36,.30,.22),vec3(.70,.82,.98),sky);
     float horizon=1.-smoothstep(.045,.25,abs(R.y-.28));
     float lacquer=1.-smoothstep(.12,.19,rough);
     float sidePanel=1.-smoothstep(.65,.95,normalize(vNormal).y);
     daylight+=vec3(.12,.14,.16)*horizon;
     radiance=mix(radiance,daylight,.90);
   }
   return radiance;`)
  .replace('float weight=max(top,edge*.70);', 'float weight=uReferencePanels==2?clamp(top*.44+edge*.33,0.,.75):max(top,edge*mix(.70,.22,uReferenceLook));')
  .replace('base=mix(uFace,uPearl,weight);rough=uRoughness;metal=uMetalness;coat=1.;', `
   base=uSourceColor;
   if(uHasColorMap==1)base*=srgbToLinear(texture(uColorMap,vUV).rgb);
   rough=uSourceRoughness;metal=uSourceMetalness;coat=uSourceClearcoat;
   if(uReferencePanels==2)rough+=.010*(noise2(vUV*700.)-.5)/(1.+length(fwidth(vUV*700.)));
   if(uReferenceLook>.5){
     float warm=smoothstep(.1,.6,uSourceColor.r-uSourceColor.b);
     base*=mix(vec3(1.),vec3(1.,.59,.88),warm*(1.-top));
     rough=max(rough,.62);
   }`)
  .replace('rough=.16;reflectScale=.10;', 'rough=.16;reflectScale=mix(.10,.025,uReferenceLook);')
  .replace('rough=.72;N=perturbNormal', 'rough=.72;base*=mix(1.,.58,uReferenceLook);N=perturbNormal')
  .replace('rough=.33;metal=.05;reflectScale=.46;', 'rough=.33;metal=.05;reflectScale=mix(.46,.17,uReferenceLook);')
  .replace('rough=.42;metal=.58;reflectScale=.32;', 'rough=.42;metal=.58;reflectScale=mix(.32,.16,uReferenceLook);')
  .replace(' // Normal-variance specular antialiasing protects thin highlights when orbiting.', `
  // Vanguard's authored material groups. These IDs come directly from the
  // supplied reference and leave the existing Fennec/Octane paths unchanged.
  if(uReferencePanels==2){
    if(uMaterial==7){base=srgbToLinear(vec3(.17,.185,.21));rough=.22;metal=.92;reflectScale=.80;}
    if(uMaterial==8){base=vec3(.25,.4,.7);rough=.15;metal=.2;emission=vec3(1.6,2.6,3.8);}
    if(uMaterial==9){base=srgbToLinear(vec3(.32,.012,.006));rough=.16;coat=.7;emission=vec3(3.0,.026,.006);}
    if(uMaterial==11){base=srgbToLinear(vec3(.021,.028,.04));rough=.60;metal=.08;reflectScale=.12;specScale=.4;}
    if(uMaterial==12){base=srgbToLinear(vec3(.07,.033,.02));rough=.52;metal=.65;emission=vec3(.16,.025,.003);}
    if(uMaterial==13){base=srgbToLinear(vec3(.059,.063,.070));rough=.78;metal=.01;reflectScale=.21;specScale=.72;}
    if(uMaterial==14){base=srgbToLinear(vec3(.052,.062,.078));rough=.235;metal=.78;reflectScale=.69;coat=.32;}
    if(uMaterial==15){base=srgbToLinear(vec3(.54,.018,.011));rough=.28;metal=.42;reflectScale=.70;}
    if(uMaterial==16){base=srgbToLinear(vec3(.09,.20,.30));rough=.09;metal=.48;reflectScale=.85;coat=1.;}
    if(uMaterial==17){base=srgbToLinear(vec3(.18,.21,.25));rough=.25;metal=.9;reflectScale=.65;}
    if(uMaterial==18){base=srgbToLinear(vec3(.091,.095,.10));rough=.42;metal=.67;reflectScale=.25;}
  }
  // Shared reference finish: solid electric blue lacquer, black glass and hardware.
  // Override atlas, decal and normal-map results without changing surface geometry.
  N=Ng;
  base=srgbToLinear(vec3(.045,.05,.06));rough=.42;metal=.12;coat=0.;reflectScale=.6;
  if(uMaterial==4){base=srgbToLinear(vec3(0.,.48235,1.));rough=.22;metal=.35;coat=1.;reflectScale=1.;}
  if(uMaterial==5||uMaterial==16){base=srgbToLinear(vec3(.009,.012,.018));rough=.12;metal=.05;coat=.65;reflectScale=.65;}
  if(uMaterial==1){base=srgbToLinear(vec3(.025,.029,.035));rough=.78;metal=0.;reflectScale=.25;}
  // Keep the Vanguard rear oval LED self-lit through the satin finish pass.
  if(!(uReferencePanels==2&&uMaterial==9&&uVanguardOriginal==0))emission=vec3(0.);
  emission+=uSpectreEmission;
  // Repaired scan bodies have separate, untextured surface groups. Preserve
  // their individual colors under the same lighting as the Spectre wheels.
  if(uSolidFinish==1){
    base=uSourceColor;rough=uSourceRoughness;metal=uSourceMetalness;coat=uSourceClearcoat;
    reflectScale=uMaterial==5?.28:uMaterial==4?.8:.5;
  }
  ${SPECTRE_SURFACES}
  ${TRIO_SURFACES}
  ${TRIPO_SURFACES}
  // Garage paint is the final paint-layer authority. Model-specific masks still
  // decide which pixels are bodywork, while glass, lamps, tires and trim keep
  // their authored surfaces.
  bool garagePaintSurface=uTripoBody>.5?tripoPaint:uTrioBody>0?trioPaintSurface:uSpectreBody==1?spectrePaint:uMaterial==4;
  if(uGaragePaint==1&&garagePaintSurface){
    float garageTop=smoothstep(.60,.98,panelUp);
    float garageEdge=smoothstep(.26,.86,1.-max(dot(N,V),0.)+uPearlShift);
    base=mix(uFace,uPearl,max(garageTop,garageEdge*.70));
    rough=uRoughness;metal=uMetalness;coat=uClearcoat;reflectScale=1.;
  }
 // Normal-variance specular antialiasing protects thin highlights when orbiting.`)
  .replace('vec3(.28,.36,.48),specScale);', 'mix(vec3(.28,.36,.48),vec3(.72,.58,.40),uReferenceLook),specScale);')
  .replace('vec3 specular=env(R,rough)*envWeight*uReflection*reflectScale*specAO;', `
 vec3 specular=env(R,rough)*envWeight*uReflection*reflectScale*specAO;
 if(uSpectreBody==0&&uMaterial==4)specular*=mix(1.,.85,uReferenceLook);`)
  // Material response follows the corrected surface mask, not the original
  // coarse triangle groups, which otherwise reappear as patches while orbiting.
  .replace('if(uMaterial==4)envWeight=mix(base,envWeight,.20);', `
   if(uTripoBody>.5){if(tripoPaint)envWeight=mix(base,envWeight,.90);}
   else if(uTrioBody>0){if(trioPaintSurface)envWeight=mix(base,envWeight,.90);}
   else if(uSpectreBody==1?spectrePaint:uMaterial==4)envWeight=mix(base,envWeight,.90);`)
  .replace('float cr=max(.095,sqrt(.009+variance*2.));', 'float cr=max(mix(.095,.10,uReferenceLook),sqrt(.009+variance*2.));')
  .replace('if(uMaterial==4)color+=base*(.055+.12*nl*sh)*ao;',
    'if(uTripoBody>.5?tripoPaint:uTrioBody>0?trioPaintSurface:uSpectreBody==1?spectrePaint:uMaterial==4)color+=base*.035*ao;')
  .replace('color=color*(1.-fc*coat)+coat*(coatReflection+cs*nl*sun*sh);',
    `float baseAttenuation=spectrePaint?min(fc,${SPECTRE_MAX_COAT_ATTENUATION}):fc;
   if((uTripoBody>.5&&tripoPaint)||(uTrioBody>0&&trioPaintSurface))baseAttenuation=min(fc,${SPECTRE_MAX_COAT_ATTENUATION});
   color=color*(1.-baseAttenuation*coat)+coat*(coatReflection+cs*nl*sun*sh);`)
  // Let the rear LED glow bloom; half alpha excludes the remaining car surfaces.
  .replace('gl_FragColor=vec4(color,1.);', 'gl_FragColor=vec4(color,((uReferencePanels==2&&uMaterial==9&&uVanguardOriginal==0)||length(emission)>.05)?1.:.5);');
