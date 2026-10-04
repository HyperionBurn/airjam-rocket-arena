// Daylight features that do not need a compositor, shadow map, cube capture,
// screen-sized texture, or another ground draw. Units are the game's native UU.
// AIR JAM PATCH: 7 slots (ball + up to 6 cars) instead of 3 (ball + 2 cars), so
// every car in a local match grounds itself with a contact/cast shadow.
export const CONTACT_SHADOW_SLOTS = 7;
export const PARK_CONTACT_FRAGMENT = `
uniform vec4 parkContact[${CONTACT_SHADOW_SLOTS}];
uniform float parkBallRadius;
uniform sampler2D parkGrassDetail;
uniform sampler2D parkV2GroundAO;
uniform float parkV2Contact;
uniform float parkContactAO;
uniform vec3 parkLightDirection;
uniform float parkReferenceLook;
varying vec3 parkGroundPosition;
float contactShade(vec2 point, vec4 subject, bool ball) {
  float altitude = max(0., subject.z - (ball ? parkBallRadius : 17.));
  float visibility = (1. - smoothstep(120., 1800., altitude));
  vec2 center = subject.xy - parkLightDirection.xz/max(parkLightDirection.y,.1) * altitude;
  vec2 offset = point - center;
  float c = cos(subject.w), s = sin(subject.w);
  offset = mat2(c,-s,s,c) * offset;
  if (!ball && parkV2Contact > .5) {
    vec2 uv=(offset-vec2(4.305076,-.05224148))/(vec2(6.,4.)*30.526412568)+.5;
    float baked=0.;
    if(all(greaterThanEqual(uv,vec2(0.)))&&all(lessThanEqual(uv,vec2(1.))))
      baked=(1.-texture2D(parkV2GroundAO,uv).r)*.82*parkContactAO*visibility;
    if(parkReferenceLook<.5)return baked;
    vec2 castOffset=point-subject.xy+parkLightDirection.xz/max(parkLightDirection.y,.1)*(altitude+38.);
    castOffset=mat2(c,-s,s,c)*castOffset;
    vec2 body=abs(castOffset)/vec2(67.,39.);
    float castShadow=(1.-smoothstep(.78,1.20,max(body.x,body.y)))*.82*visibility;
    vec2 tireOffset=vec2(abs(offset.x+4.)-45.,abs(offset.y)-34.)/vec2(11.,7.);
    float tireContact=(1.-smoothstep(.35,1.5,dot(tireOffset,tireOffset)))*.98*(1.-smoothstep(3.,38.,altitude));
    return max(max(baked*1.35,castShadow),tireContact);
  }
  vec2 radius = ball ? vec2(parkBallRadius * 1.12) : vec2(92., 55.);
  radius += altitude * .19;
  float d = length(offset / radius);
  return (1. - smoothstep(.12, 1.55, d)) * visibility * (ball ? .53 : .58);
}
vec3 shadeParkGround(vec3 pigment) {
  // Lift green grass only; neutral markings and blue/orange field paint retain
  // their original colors. Apply before detail and contact shading.
  float greenMask=smoothstep(.01,.055,pigment.g-max(pigment.r,pigment.b));
  float saturation=(pigment.g-min(pigment.r,pigment.b))/max(pigment.g,.001);
  greenMask*=smoothstep(.22,.4,saturation);
  float luminance=dot(pigment,vec3(.2126,.7152,.0722));
  vec3 vividGrass=max(vec3(0.),mix(vec3(luminance),pigment,1.32))*1.22;
  pigment=mix(pigment,vividGrass,greenMask*(1.-parkReferenceLook));
  // One 256px mipmapped tile adds close grass blades; no geometry or normal map.
  float grass=texture2D(parkGrassDetail,parkGroundPosition.xz/512.).r;
  pigment *= 1. + (grass - .214) * .68;
  float shadow = 0.;
  shadow = max(shadow, contactShade(parkGroundPosition.xz, parkContact[0], true));
  for (int i = 1; i < ${CONTACT_SHADOW_SLOTS}; i++) shadow = max(shadow, contactShade(parkGroundPosition.xz, parkContact[i], false));
  // Gentle, static recess occlusion and narrow team-light spill at the posts.
  // Evaluated in the turf pass, so Potato still needs no shadow map or compositor.
  vec2 goalPoint=vec2(abs(parkGroundPosition.x),abs(parkGroundPosition.z));
  vec2 postOffset=(goalPoint-vec2(947.,5080.))/vec2(150.,110.);
  float footAO=exp(-dot(postOffset,postOffset))* .30;
  shadow=max(shadow,footAO);
  vec2 spillOffset=(goalPoint-vec2(947.,5080.))/vec2(108.,105.);
  float spill=exp(-dot(spillOffset,spillOffset)*1.5);
  vec3 teamLight=parkGroundPosition.z<0.?vec3(.005,.12,.80):vec3(.80,.19,.018);
  pigment+=teamLight*spill*.045;
  // Sky blue remains in the shadow instead of simply multiplying to black.
  vec3 shadowTint=mix(vec3(.39,.49,.57),vec3(.16,.23,.28),parkReferenceLook);
  return pigment * mix(vec3(1.), shadowTint, shadow);
}
`;

export function createParkTurfMaterial(T, texture, detail = texture) {
  const contacts = new Float32Array(CONTACT_SHADOW_SLOTS * 4);
  for (let i = 0; i < CONTACT_SHADOW_SLOTS; i++) contacts[i * 4 + 2] = 1e7;
  const state = { contacts, ballRadius: { value: 92.75 }, detail: { value: detail }, v2GroundAO:{value:null},v2Contact:{value:0},contactAO:{value:.53},lightDirection:{value:new T.Vector3(-.48,.83,.29).normalize()} };
  state.referenceLook = { value: 0 };
  const material = new T.MeshBasicMaterial({
    name: 'Park / reference daylight turf with contact shadows',
    map: texture, toneMapped: false, precision: 'highp',
  });
  material.userData.parkGround = state;
  material.addEventListener('dispose', () => {
    state.referenceFieldBake?.restore();
    state.referenceFieldBake = null;
  });
  material.onBeforeCompile = shader => {
    shader.uniforms.parkContact = { value: contacts };
    shader.uniforms.parkBallRadius = state.ballRadius;
    shader.uniforms.parkGrassDetail = state.detail;
    shader.uniforms.parkV2GroundAO = state.v2GroundAO;
    shader.uniforms.parkV2Contact = state.v2Contact;
    shader.uniforms.parkContactAO = state.contactAO;
    shader.uniforms.parkLightDirection = state.lightDirection;
    shader.uniforms.parkReferenceLook = state.referenceLook;
    shader.vertexShader = shader.vertexShader.replace('#include <common>',
      '#include <common>\nvarying vec3 parkGroundPosition;');
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nparkGroundPosition=(modelMatrix*vec4(position,1.)).xyz;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>',
      '#include <common>\n'+PARK_CONTACT_FRAGMENT);
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>',
      '#include <color_fragment>\ndiffuseColor.rgb=shadeParkGround(diffuseColor.rgb);');
  };
  material.customProgramCacheKey = () => 'park-reference-contact-v5-seven-slots';
  return material;
}

export function bindParkContactShadows(turf, subjects) {
  const surface = turf.getObjectByName('Park / painted playing surface');
  const state = surface?.material?.userData?.parkGround;
  if (!state) return;
  surface.onBeforeRender = () => {
    const { ball, cars, ballRadius: radius } = subjects;
    state.ballRadius.value = radius;
    state.v2Contact.value = ['fennec', 'vanguard', 'vanguard-original', 'vesper', 'chicky'].includes(subjects.carVisual) ? 1 : 0;
    for (let i = 0; i < CONTACT_SHADOW_SLOTS; i++) {
      const object = i === 0 ? ball : cars[i - 1], offset = i * 4;
      if (!object || !object.visible) { state.contacts[offset + 2] = 1e7; continue; }
      const p = object.position, q = object.quaternion;
      state.contacts[offset] = p.x;
      state.contacts[offset + 1] = p.z;
      state.contacts[offset + 2] = p.y;
      state.contacts[offset + 3] = Math.atan2(2*(q.w*q.y + q.x*q.z), 1 - 2*(q.y*q.y + q.z*q.z));
    }
  };
}
