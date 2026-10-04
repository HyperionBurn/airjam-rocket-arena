// Reference ball: pale satin panels, dark woven insets and small cyan lenses.
// The existing atlas supplies all panel detail. One opaque pass and one atlas
// lookup work unchanged on Potato; highlights do not depend on post processing.
export const BALL_MATERIAL_VERSION = 'daylight-satin-v3-integrated';

export const BALL_MATERIAL_FRAGMENT = `
varying vec3 ballWorldPosition;
varying vec3 ballWorldNormal;

vec3 shadeBallSurface(vec3 albedo, vec3 eye) {
  vec3 N = normalize(ballWorldNormal);
#ifdef DOUBLE_SIDED
  N *= gl_FrontFacing ? 1.0 : -1.0;
#endif
  vec3 V = normalize(eye-ballWorldPosition);
#ifdef BALL_LENS
  // Lens edges stay cyan, while their face is almost white like the reference.
  float facing = max(dot(N,V),0.0);
  return mix(vec3(.025,.61,1.12),vec3(.57,1.52,1.72),pow(facing,2.0));
#else
  float luma = dot(albedo,vec3(.2126,.7152,.0722));
  // Recover shallow panel relief from the authored atlas without another map.
  // Derivatives naturally diminish with the texture mip at gameplay distance.
  vec3 dx = dFdx(ballWorldPosition), dy = dFdy(ballWorldPosition);
  vec3 tx = cross(dy,N), ty = cross(N,dx);
  float determinant = dot(dx,tx);
  vec3 gradient = (tx*dFdx(luma)+ty*dFdy(luma))
    *sign(determinant)/max(abs(determinant),.00001);
  N = normalize(N-gradient*1.6);
  vec3 L = normalize(vec3(-.10,.97,.06));
  vec3 R = reflect(-V,N);
  float sky = clamp(N.y*.5+.5,0.0,1.0);
  float daylight = max(dot(N,L),0.0);
  float fresnel = pow(1.0-max(dot(N,V),0.0),4.0);
  float panel = smoothstep(.12,.29,luma);
  float recess = smoothstep(.008,.085,luma);
  vec3 light = mix(vec3(.025,.065,.025),vec3(.40,.50,.57),sky);
  light += vec3(1.0,.95,.80)*daylight*1.24;
  // Cool open-sky fill keeps the pale side panels readable in the shaded half.
  light += vec3(.18,.28,.49)*max(dot(N,normalize(vec3(.88,.25,.40))),0.0)*.35;
  // The atlas was authored under flat light. Contrast recovery separates the
  // graphite frame from woven insets while lifting the pale satin panels.
  vec3 pigment = pow(max(albedo,vec3(0.0)),vec3(1.20))*2.5;
  pigment = mix(vec3(dot(pigment,vec3(.2126,.7152,.0722)))*vec3(.96,1.0,1.01),pigment,panel);
  vec3 result = pigment*light;
  // Pale alloy reflects a restrained olive field tint below the horizon.
  float groundReflection = 1.0-smoothstep(-.30,.12,R.y);
  result *= mix(vec3(1.0),vec3(.72,.83,.48),groundReflection*panel*.67);
  float reflection = max(dot(R,L),0.0);
  // Broad satin reflection on the pale panels; graphite retains a tighter edge.
  float highlight = mix(pow(reflection,42.0)*.10,pow(reflection,23.0)*.55,panel);
  result += vec3(1.0,.92,.75)*highlight*recess;
  result += mix(vec3(.045,.085,.03),vec3(.16,.21,.24),sky)*fresnel*recess;
  result += vec3(.12,.21,.38)*pow(max(dot(R,normalize(vec3(.88,.25,.40))),0.0),12.0)*panel;
  // A broad sky reflection traces the rounded pale panel shoulders. The
  // graphite receives only a faint version, preserving its woven recesses.
  float skyRibbon = smoothstep(-.18,.12,R.y)*(1.0-smoothstep(.42,.78,R.y));
  result += vec3(.22,.32,.52)*skyRibbon*mix(.08,.42,panel)*recess;
#ifdef USE_MAP
  // Compact blue spill around the two authored lens islands. The halo stays on
  // the ball surface: no sprite, extra texture sample or full-screen bloom.
  vec2 atlasUV = fract(vMapUv);
  vec2 hubA = atlasUV-vec2(.2095,.4845);
  vec2 hubB = atlasUV-vec2(.1348,.1310);
  float halo = max(exp(-dot(hubA,hubA)/.00170),exp(-dot(hubB,hubB)/.00125));
  result += vec3(.012,.28,1.02)*halo;
#endif
  // The greenish markers are already localized in the original atlas.
  float marker = smoothstep(.022,.075,albedo.g-albedo.r)
    *smoothstep(.01,.045,albedo.b-albedo.r);
  float core = 0.0;
#ifdef USE_MAP
  float lensRadius = min(length(hubA)/.023,length(hubB)/.020);
  core = 1.0-smoothstep(.10,1.40,lensRadius);
#endif
  // A white-hot center and cyan edge survive reduced internal resolution.
  // The small surrounding status markers keep the edge color.
  result = mix(result,mix(vec3(.035,.79,1.25),vec3(.74,1.65,1.92),core),marker);
  return result/(vec3(1.0)+max(result-vec3(.65),vec3(0.0))*.70);
#endif
}
`;

export function createImportedBallMaterial(T, source) {
  const lens = !source.map && (source.emissive?.b ?? 0) > .5;
  const material = new T.MeshBasicMaterial({
    name: `${source.name || 'Ball'} / daylight ${lens ? 'cyan lens' : 'satin panels'}`,
    color: source.color, map: source.map, side: source.side,
    opacity: source.opacity, transparent: source.transparent,
    alphaTest: source.alphaTest, depthWrite: source.depthWrite,
    vertexColors: source.vertexColors, fog: source.fog, toneMapped: false, precision: 'highp',
  });
  material.userData.ballMaterial = true;
  material.userData.ballSurface = lens ? 'lens' : 'panels';
  if (lens) material.defines = { BALL_LENS: 1 };
  material.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>',
      '#include <common>\nvarying vec3 ballWorldPosition;\nvarying vec3 ballWorldNormal;');
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
      #include <begin_vertex>
      ballWorldPosition = (modelMatrix*vec4(position,1.0)).xyz;
      ballWorldNormal = inverseTransformDirection(normalMatrix*normal,viewMatrix);
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <uv_pars_fragment>',
      '#include <uv_pars_fragment>\n'+BALL_MATERIAL_FRAGMENT);
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>',
      '#include <color_fragment>\ndiffuseColor.rgb = shadeBallSurface(diffuseColor.rgb,cameraPosition);');
  };
  material.customProgramCacheKey = () => `${BALL_MATERIAL_VERSION}/${lens ? 'lens' : 'panels'}`;
  return material;
}
