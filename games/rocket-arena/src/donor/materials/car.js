import { PEARL_COLORS, PEARL_FRAGMENT } from "./pearl.js";
// Pearl lacquer, glass and rubber share one park reflection and surface pass.
// The lacquer evaluates metallic GGX and clearcoat without reflection captures.
export const CAR_ENVIRONMENT_URL = '/assets/arena/park/park-metal-reflection.webp';
export const PEARL_LIGHTING_URL = '/assets/arena/park/pearl-v2-lighting.png';
export const CAR_MATERIAL_VERSION = 'fennec-pearl-v2-prefiltered';

export const CAR_MATERIAL_FRAGMENT = `
uniform sampler2D carEnvironment;
uniform vec3 carPearl;
uniform vec3 carEmissive;
uniform float carEmissiveIntensity;
varying vec3 carWorldPosition;
varying vec3 carWorldNormal;
#ifdef CAR_NORMAL_MAP
uniform sampler2D carNormalMap;
uniform vec2 carNormalScale;
varying vec2 carNormalUV;
#endif
#ifdef CAR_SHELL_TRIM
varying vec3 carPanelPosition;
#endif
#ifdef CAR_EMISSIVE_MAP
uniform sampler2D carEmissionMap;
varying vec2 carEmissionUV;
#endif

${PEARL_FRAGMENT}
vec3 shadeCarSurface(vec3 albedo, vec3 eye) {
  vec3 N = normalize(carWorldNormal);
#ifdef DOUBLE_SIDED
  N *= gl_FrontFacing ? 1.0 : -1.0;
#endif
#ifdef CAR_NORMAL_MAP
  vec3 mapped = texture2D(carNormalMap,carNormalUV).xyz*2.-1.;
  mapped.xy *= carNormalScale;
  vec3 dp1=dFdx(carWorldPosition),dp2=dFdy(carWorldPosition);
  vec2 du1=dFdx(carNormalUV),du2=dFdy(carNormalUV);
  float determinant=du1.x*du2.y-du1.y*du2.x;
  if(abs(determinant)>1e-10){
    vec3 tangent=normalize((dp1*du2.y-dp2*du1.y)/determinant);
    tangent=normalize(tangent-N*dot(tangent,N));
    vec3 bitangent=normalize(cross(N,tangent))*sign(determinant);
    N=normalize(tangent*mapped.x+bitangent*mapped.y+N*mapped.z);
  }
#endif
  vec3 V = normalize(eye-carWorldPosition);
  vec3 R = reflect(-V,N);
  float facing = clamp(dot(N,V),0.0,1.0);
  float fresnel = pow(1.0-facing,5.0);
  float daylight = max(dot(N,normalize(vec3(-.45,.88,-.65))),0.0);
  float sky = clamp(N.y*.5+.5,0.0,1.0);
  float sun = max(dot(R,normalize(vec3(-.45,.88,-.65))),0.0);
  // Match the two mirrored park horizons; one prefiltered lookup per surface.
  float horizonU = 1.0-abs(fract(atan(R.x,R.z)*.15915494)*2.0-1.0);
  vec3 environment = texture2D(carEnvironment,vec2(horizonU,
    clamp((asin(clamp(R.y,-1.0,1.0))+.16)/.88,0.0,1.0))).rgb;
  environment = mix(environment,vec3(.36,.51,.72),smoothstep(.48,.98,R.y));
  environment = mix(vec3(.042,.065,.030),environment,smoothstep(-.25,.06,R.y));
  float environmentLuma = dot(environment,vec3(.2126,.7152,.0722));
  environment = mix(vec3(environmentLuma),environment,.45);
  vec3 lighting = mix(vec3(.07,.085,.11),vec3(.34,.40,.49),sky);
  lighting += vec3(1.0,.88,.74)*daylight*.82;
  // A pale band at the treeline gives the hood, fenders and window bevels a
  // readable reflected edge even when the car occupies only a few dozen pixels.
  float skyRibbon = smoothstep(.08,.20,R.y)*(1.0-smoothstep(.32,.58,R.y));
  float luminance = dot(albedo,vec3(.2126,.7152,.0722));
  vec3 result;

#if CAR_SURFACE == 0
  result = shadePearlPaint(albedo,carPearl,N,V,environment);
#elif CAR_SURFACE == 1
  result = shadePearlAccessory(albedo,N,V,.33,.05,.46);
#elif CAR_SURFACE == 2
  result = shadePearlAccessory(vec3(.0331,.0363,.0414),N,V,.72,0.,.35);
#elif CAR_SURFACE == 3
  result = shadePearlAccessory(vec3(.000619,.000929,.001703),N,V,.16,0.,.10);
#elif CAR_SURFACE == 4
  vec3 alloy = vec3(.0093,.0103,.0125)+vec3(luminance)*.095;
  result = shadePearlAccessory(alloy,N,V,.42,.58,.32);
#else
  result = shadePearlAccessory(mix(albedo,vec3(luminance),.90)*.65,N,V,.34,.23,1.);
#endif

#ifdef CAR_SHELL_TRIM
  float bumper = 1.0-step(-.00065,carPanelPosition.z);
  float grille = step(.00745,carPanelPosition.x)*(1.0-step(.001,carPanelPosition.z));
  vec3 trim = vec3(.012,.019,.027)*lighting + environment*(.015+.08*fresnel);
  result = mix(result,trim,max(bumper,grille));
#endif
  vec3 emission = carEmissive*carEmissiveIntensity;
#ifdef CAR_EMISSIVE_MAP
  emission *= texture2D(carEmissionMap,carEmissionUV).rgb;
#endif
  result += emission;
  return pearlToneMap(result);
}
`;

const SURFACES = { paint: 0, trim: 1, rubber: 2, glass: 3, metal: 4, atlas: 5 };

export function classifyCarSurface(source) {
  const name = (source.name || '').toLowerCase();
  if (/window|glass/.test(name)) return 'glass';
  if (/tread|tire|tyre|rubber/.test(name)) return 'rubber';
  if (/rim|wheel-metal/.test(name)) return 'metal';
  if (/chassis/.test(name) && source.map) return 'atlas';
  if (/body|shell|fill/.test(name)) return 'paint';
  if (/paint/.test(name)) {
    // Imported "Paint" is the black grille/frame material, not body enamel.
    const c = source.color;
    return c && Math.max(c.r,c.g,c.b) < .035 ? 'trim' : 'paint';
  }
  return 'trim';
}

export function createCarMaterial(T, options, environment, surface = 'paint', pearl = options.color, shell = false) {
  const { emissive, emissiveMap, emissiveIntensity, normalMap, normalScale, ...basicOptions } = options;
  const material = new T.MeshBasicMaterial({
    ...Object.fromEntries(Object.entries(basicOptions).filter(([,value]) => value !== undefined)),
    toneMapped: false, precision: 'highp',
  });
  material.name = options.name || `Car / daylight ${surface}`;
  material.userData.carMaterial = true;
  material.userData.carSurface = surface;
  material.userData.carSourceName = options.name || '';
  material.defines = { CAR_SURFACE: SURFACES[surface] ?? SURFACES.trim };
  const fennecPanels = options.name === 'Fennec_-_Body';
  if (normalMap) {
    material.defines.CAR_NORMAL_MAP = 1;
    if (normalMap.channel) material.defines['USE_UV'+normalMap.channel] = 1;
  }
  if (shell) material.defines.CAR_SHELL_TRIM = 1;
  if (emissiveMap) {
    material.defines.CAR_EMISSIVE_MAP = 1;
    if (emissiveMap.channel) material.defines['USE_UV'+emissiveMap.channel] = 1;
  }
  if (environment) {
    environment.wrapS = T.MirroredRepeatWrapping;
    environment.wrapT = T.ClampToEdgeWrapping;
    environment.colorSpace = T.SRGBColorSpace;
  }
  const emission = new T.Color(emissive ?? 0);
  const pearlColor = new T.Color(pearl ?? options.color ?? 0xffffff);
  material.onBeforeCompile = shader => {
    shader.uniforms.carEnvironment = { value: environment };
    shader.uniforms.carPearlLighting = { value: environment?.userData?.pearlLighting ?? environment };
    shader.uniforms.carPearl = { value: pearlColor };
    shader.uniforms.carEmissive = { value: emission };
    shader.uniforms.carEmissiveIntensity = { value: emissiveIntensity ?? 0 };
    let vertexDeclaration = '\nvarying vec3 carWorldPosition;\nvarying vec3 carWorldNormal;\n';
    if (normalMap) {
      normalMap.updateMatrix?.();
      shader.uniforms.carNormalMap = { value: normalMap };
      shader.uniforms.carNormalScale = { value: normalScale ?? {x:1,y:1} };
      shader.uniforms.carNormalTransform = { value: normalMap.matrix };
      vertexDeclaration += 'varying vec2 carNormalUV;\nuniform mat3 carNormalTransform;\n';
    }
    if (shell) vertexDeclaration += 'varying vec3 carPanelPosition;\n';
    if (emissiveMap) {
      emissiveMap.updateMatrix?.();
      shader.uniforms.carEmissionMap = { value: emissiveMap };
      shader.uniforms.carEmissionTransform = { value: emissiveMap.matrix };
      vertexDeclaration += 'varying vec2 carEmissionUV;\nuniform mat3 carEmissionTransform;\n';
    }
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>'+vertexDeclaration);
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
      #include <begin_vertex>
      carWorldPosition = (modelMatrix*vec4(position,1.0)).xyz;
      // normalMatrix handles the hatch's nonuniform scale; undo only the view.
      vec3 panelNormal = normal;
      ${fennecPanels ? `
      // Convert the imported game-unit body back to the grounded viewer frame.
      vec3 q=(position-vec3(4.305076,-18.460744,-.05224148))/30.526412568;
      q.y+=.556919;
      float hood=smoothstep(.35,.65,q.x)*(1.-smoothstep(1.30,1.48,q.y))*smoothstep(.80,.97,panelNormal.y);
      float door=smoothstep(.84,.98,abs(panelNormal.z))*smoothstep(.42,.58,q.y)*(1.-smoothstep(1.02,1.18,q.y));
      panelNormal=normalize(panelNormal+hood*vec3((q.x-1.20)*.075,0.,q.z*.095)+door*vec3(q.x*.035,(q.y-.78)*.12,0.));
      ` : ''}
      carWorldNormal = inverseTransformDirection(normalMatrix*panelNormal,viewMatrix);
      ${shell ? 'carPanelPosition = position;' : ''}
      ${normalMap ? `carNormalUV = (carNormalTransform*vec3(${normalMap.channel ? 'uv'+normalMap.channel : 'uv'},1.)).xy;` : ''}
      ${emissiveMap ? `carEmissionUV = (carEmissionTransform*vec3(${emissiveMap.channel ? 'uv'+emissiveMap.channel : 'uv'},1.0)).xy;` : ''}
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\n'+CAR_MATERIAL_FRAGMENT);
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>',
      '#include <color_fragment>\ndiffuseColor.rgb = shadeCarSurface(diffuseColor.rgb,cameraPosition);');
  };
  material.customProgramCacheKey = () => `${CAR_MATERIAL_VERSION}/${surface}/${shell}/${fennecPanels}/${emissiveMap?.channel ?? -1}/${normalMap?.channel ?? -1}`;
  return material;
}

// Both appearance modes use the same inexpensive shader. Only their existing
// palette differs; quality changes do not discard the coat, glass or tire cues.
export function createCarMaterialSet(T, palette, environment, register = (arcade) => arcade) {
  const pair = (surface, name, color, pearl, shell = false, realisticColor = color) => register(
    createCarMaterial(T,{name:`Arcade / ${name}`,color},environment,surface,pearl,shell),
    createCarMaterial(T,{name:`Realistic / ${name}`,color:realisticColor},environment,surface,pearl,shell),
  );
  const body = pair('paint','coated body',palette.primary,palette.pearl ?? palette.primary,false,palette.realisticPrimary ?? palette.primary);
  return {
    body,
    shell: pair('paint','coated hatch shell',palette.primary,palette.pearl ?? palette.primary,true,palette.realisticPrimary ?? palette.primary),
    wheelMetal: pair('metal','graphite wheel alloy',0x252b32),
    tire: pair('rubber','matte tire rubber',0x111419),
    lowerDetail: pair('trim','satin bumper trim',0x252b31),
    glass: pair('glass','smoked reflective glass',0x111921),
    lamps: new T.MeshBasicMaterial({name:'Car / white lamps',color:0xd8f6ff,toneMapped:false}),
    tailLamps: new T.MeshBasicMaterial({name:'Car / red tail lamps',color:0xd52b32,toneMapped:false}),
  };
}

export function createImportedCarMaterial(T, source, environment) {
  // Source colors, atlases, opacity and render side stay attached to each part.
  // Never substitute a single team-colored shader across an imported car.
  if (/headlight|tail.?light|lamps/i.test(source.name || '')) {
    return new T.MeshBasicMaterial({name:source.name,color:source.color,map:source.map,
      side:source.side,opacity:source.opacity,transparent:source.transparent,
      alphaTest:source.alphaTest,toneMapped:false});
  }
  const surface = classifyCarSurface(source);
  const baseColor = new T.Color(source.color ?? 0xffffff);
  const pearl = baseColor.clone();
  if (surface === 'paint') {
    const colors = source.color && source.color.b > source.color.r
      ? PEARL_COLORS.blue : PEARL_COLORS.orange;
    baseColor.set(colors.primary);
    pearl.set(colors.pearl);
  }
  const material = createCarMaterial(T,{
    name:source.name, color:baseColor, map:source.map,
    normalMap:source.normalMap, normalScale:source.normalMap ? {x:surface==='atlas'?.70:surface==='rubber'?.43:.32,y:surface==='atlas'?.70:surface==='rubber'?.43:.32} : source.normalScale,
    alphaMap:source.alphaMap, aoMap:source.aoMap, aoMapIntensity:source.aoMapIntensity,
    lightMap:source.lightMap, lightMapIntensity:source.lightMapIntensity,
    side:source.side, opacity:source.opacity, transparent:source.transparent,
    alphaTest:source.alphaTest, depthWrite:source.depthWrite,
    vertexColors:source.vertexColors, fog:source.fog,
    emissive:source.emissive, emissiveMap:source.emissiveMap,
    emissiveIntensity: Math.min(source.emissiveIntensity ?? 1,.16),
  },environment,surface,pearl);
  // Keep source metadata available for material inspectors and future atlases.
  material.userData.carSourceRoughness = source.roughness;
  material.userData.carSourceMetalness = source.metalness;
  return material;
}

export function setCarMaterialQuality(material, quality) {
  if (!material?.userData?.carMaterial) return;
  // Deliberately identical surface features: no shader recompile on preset swaps.
  material.userData.carQuality = quality;
}
