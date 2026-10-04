// Shared verbatim by the game material and the native, browser-free shader review.
// One prefiltered reflection lookup, no scene capture, lights, or fullscreen passes.
export const PARK_BANK_FRAGMENT = `
uniform sampler2D parkBankEnvironment;
varying vec3 parkBankWorldPosition;
varying vec3 parkBankWorldNormal;
vec3 shadeParkBank(vec3 albedo, vec2 panelUV, vec3 eye) {
  vec3 N = normalize(parkBankWorldNormal);
  vec3 V = normalize(eye - parkBankWorldPosition);
  float luminance = dot(albedo, vec3(.2126,.7152,.0722));
  float metal = 1.0 - smoothstep(.695,.721,panelUV.y);
  metal = max(metal, smoothstep(.957,.973,panelUV.y));
  float cavity = smoothstep(.025,.19,luminance);
  // Authored dirt remains matte; polished areas catch broader daylight reflections.
  float polish = smoothstep(.21,.56,luminance);
#ifdef PARK_BANK_DETAIL
  // Subpixel scratches fade with distance to avoid sparkling on the thin bank.
  float closeDetail = 1.0-smoothstep(350.0,1600.0,length(eye-parkBankWorldPosition));
  vec3 tangent = normalize(vec3(N.y,-N.x,0.0001));
  N = normalize(N + tangent * sin(panelUV.y*1800.0) * .008 * closeDetail * polish);
#endif
  vec3 R = reflect(-V,N);
  // Repeat the brighter orange-facing environment at the blue end as well.
  // Mirroring the longitudinal reflection keeps curved steel equally glossy
  // through a change of ends, without doubling or flattening its highlights.
  vec3 balancedR = vec3(R.x,R.y,abs(R.z));
  float horizonU = 1.0-abs(fract(atan(balancedR.x,balancedR.z)*.15915494)*2.0-1.0);
  vec2 envUV = vec2(horizonU,
    clamp((asin(clamp(R.y,-1.0,1.0))+.16)/.88,0.0,1.0));
  vec3 environment = texture2D(parkBankEnvironment,envUV).rgb;
  float envLuma = dot(environment,vec3(.2126,.7152,.0722));
  environment = mix(vec3(envLuma),environment,.32);
  environment = mix(environment,vec3(.32,.45,.64),smoothstep(.55,.98,R.y));
  environment = mix(vec3(.11,.14,.095),environment,smoothstep(-.2,.08,R.y));
  float fresnel = pow(1.0-clamp(dot(N,V),0.0,1.0),5.0);
  float sun = max(0.0,dot(balancedR,normalize(vec3(-.38,.48,.79))));
  float specular = pow(sun,64.0)*(1.6+1.1*polish) + pow(sun,12.0)*.22;
  // Mostly the original darker steel, with a little soft silver daylight.
  float sky = clamp(N.y*.5+.5,0.,1.);
  vec3 softEnvironment = mix(environment,vec3(.24,.34,.44),.55);
  vec3 illumination = mix(vec3(.48,.57,.64),vec3(.76,.85,.92),sky);
  vec3 darkSilver = albedo*.18 + environment*(.30+.62*fresnel);
  vec3 lightSilver = albedo*illumination*.52 + softEnvironment*(.28+.20*fresnel);
  vec3 silver = mix(darkSilver,lightSilver,.35);
  silver += vec3(.025,.035,.045) + vec3(.04,.045,.05)*pow(sun,4.0);
  silver += vec3(1.,.89,.69)*pow(sun,24.)*.12*(.35+.65*polish);
  float coolBand = pow(max(0.0,1.0-abs(R.y-.22)*1.5),3.0);
  silver *= mix(vec3(1.0),vec3(.72,.84,1.0),coolBand*.55);
  float lowerTrim = smoothstep(.165,.172,panelUV.y)*(1.0-smoothstep(.185,.192,panelUV.y));
  float upperTrim = smoothstep(.661,.668,panelUV.y)*(1.0-smoothstep(.698,.704,panelUV.y));
  float capTrim = smoothstep(.971,.978,panelUV.y);
  float trim = max(max(lowerTrim,upperTrim),capTrim);
  // Edging gets the same broad light; grille holes retain their cavity mask.
  float grate = smoothstep(.053,.062,panelUV.y)*(1.0-smoothstep(.155,.163,panelUV.y));
  grate = max(grate,smoothstep(.608,.617,panelUV.y)*(1.0-smoothstep(.653,.661,panelUV.y)));
  vec3 edgeSheen = mix(environment*.32,softEnvironment*.18,.35);
  edgeSheen += vec3(.07,.10,.13)*(.65+.35*fresnel);
  silver += max(trim,grate*.85)*edgeSheen;
  silver *= mix(.17,1.0,cavity);
  float foot = 1.0-smoothstep(0.0,20.0,parkBankWorldPosition.y);
  silver *= 1.0-foot*.22;
  float darkFrame = 1.0-smoothstep(.08,.22,luminance);
  vec3 painted = albedo*.82 + environment*(.035+.16*darkFrame)*fresnel;
  painted += vec3(.70,.82,1.0)*pow(sun,100.0)*.14*darkFrame;
  vec3 result = mix(painted,silver,metal);
  // Soft, localized amber spill around existing separator lamps, all presets.
  float seam = min(fract(panelUV.x*2.0),1.0-fract(panelUV.x*2.0))*.5;
  float lampHeight = smoothstep(.729,.752,panelUV.y)*(1.0-smoothstep(.918,.947,panelUV.y));
  float halo = exp(-seam*155.0)*lampHeight;
  float core = (1.0-smoothstep(.003,.009,seam))*lampHeight;
  result += vec3(1.0,.34,.055)*halo*.16 + vec3(1.0,.66,.27)*core*.65;
  float nearGoal=(1.-smoothstep(1220.,2500.,abs(parkBankWorldPosition.x)))
    *smoothstep(4470.,5090.,abs(parkBankWorldPosition.z));
  vec3 teamSpill=parkBankWorldPosition.z<0.?vec3(.008,.16,.62):vec3(.68,.22,.018);
  result+=teamSpill*nearGoal*metal*(.025+.07*trim);
  // The recessed goal has silver panelling, never perimeter adverts inside it.
  // This branch changes only pixels beyond the native goal line, not the bank UVs.
  float recess=smoothstep(5126.,5180.,abs(parkBankWorldPosition.z))
    *(1.-smoothstep(980.,1060.,abs(parkBankWorldPosition.x)));
  vec3 lining=vec3(.10,.20,.28)+environment*(.37+.30*fresnel);
  lining+=vec3(.16,.19,.21)*max(0.,N.y);
  lining+=vec3(.80,.93,1.)*(specular*.35+trim*.10);
  float panelDistance=abs(mod(parkBankWorldPosition.x+90.,180.)-90.);
  float joint=1.-smoothstep(.8,2.+fwidth(panelDistance),panelDistance);
  lining*=1.-joint*.15;
  lining*=1.-foot*.18;
  lining+=teamSpill*.10;
  result=mix(result,lining,recess);
  // Preserve highlight rolloff instead of clipping metal into flat white patches.
  return result / (vec3(1.0) + max(result-vec3(.72),vec3(0.0))*.42);
}
`;
