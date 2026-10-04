/**
 * Reference-daylight goal. Two static draws per end: the complete opaque goal
 * (including its single inset light), then a narrow camera-facing glow ribbon.
 * No framebuffer, fullscreen pass, point light, shadow map or live cube capture.
 * Decoration only: the shipped collision meshes and goal dimensions are untouched.
 */
export const GOAL_STYLE = Object.freeze({
  version: 'daylight-portal-v1',
  plane: 5120,
  blue: 0x0078ff,
  orange: 0xff851a,
  glowRadius: 47,
});

export const GOAL_FRAME_FRAGMENT = `
uniform sampler2D goalEnvironment;
uniform vec3 goalTeam;
varying vec3 goalWorldPosition;
varying vec3 goalWorldNormal;
varying vec2 goalSurface;
varying float goalPart;
vec3 shadeGoal(vec3 eye) {
  vec3 N=normalize(goalWorldNormal);
#ifdef DOUBLE_SIDED
  N*=gl_FrontFacing?1.:-1.;
#endif
  vec3 V=normalize(eye-goalWorldPosition),R=reflect(-V,N);
  float facing=clamp(dot(N,V),0.,1.);
  float f=pow(1.-facing,5.);
  float sun=max(0.,dot(R,normalize(vec3(-.38,.48,.79))));
  float diffuse=max(0.,dot(N,normalize(vec3(-.38,.48,.79))));
  float sky=clamp(N.y*.5+.5,0.,1.);
  float u=1.-abs(fract(atan(R.x,R.z)*.15915494)*2.-1.);
  vec3 env=texture2D(goalEnvironment,vec2(u,clamp((asin(clamp(R.y,-1.,1.))+.16)/.88,0.,1.))).rgb;
  env=mix(env,vec3(.18,.48,.78),smoothstep(.58,.96,R.y));
  env=mix(vec3(.055,.095,.047),env,smoothstep(-.22,.05,R.y));
  float band=exp(-pow((R.y-.22)*4.8,2.));
  vec3 illumination=mix(vec3(.19,.28,.36),vec3(.64,.83,1.),sky);
  illumination+=vec3(1.,.96,.86)*diffuse*.43;
  vec3 steel=vec3(.085,.14,.20)*illumination+env*(.42+.58*f);
  steel+=vec3(.50,.79,1.)*band*(.13+.22*f);
  steel+=vec3(1.,.96,.88)*(pow(sun,95.)*1.9+pow(sun,15.)*.14);
  float part=floor(goalPart+.5);
  vec3 result;
  if(part<.5){
    // Cross-section coordinates follow the metal continuously around corners.
    float b=goalSurface.x,d=goalSurface.y;
    float bevel=smoothstep(24.,40.,abs(b));
    vec3 pigment=mix(vec3(.007,.018,.034),goalTeam*.08,.50);
    result=pigment*illumination+steel*mix(.20,.83,bevel);
    // One recessed channel; the bright center is not a second strip/mesh.
    float front=1.-smoothstep(-33.,-19.,d);
    float aa=max(fwidth(b)*.8,.35);
    float channel=1.-smoothstep(7.5-aa,9.+aa,abs(b));
    result=mix(result,vec3(.003,.010,.022),channel*front*.83);
    float shoulder=1.-smoothstep(2.5,7.5+aa,abs(b));
    float core=1.-smoothstep(1.3-aa*.3,2.6+aa,abs(b));
    result+=front*(goalTeam*shoulder*1.38+mix(goalTeam,vec3(.54,.90,1.),.75)*core*1.20);
    // Spill stays local, leaving the outer shell dark and the silver bevel crisp.
    result+=goalTeam*exp(-abs(b)*.087)*front*.16;
  }else if(part<1.5){
    // Recessed aluminium throat: broad silver-blue light, fine panel joins.
    float d=goalSurface.y;
    result=vec3(.31,.43,.52)*illumination+steel*.85;
    float line=abs(mod(goalSurface.x+94.,188.)-94.);
    float seam=1.-smoothstep(.7,2.1+fwidth(goalSurface.x),line);
    result*=1.-seam*.20;
    result+=goalTeam*(.035+.06*exp(-max(d,0.)/180.));
  }else if(part<2.5){
    // Swept shoulders and lamp housings have a dark polished exterior.
    result=vec3(.008,.018,.028)*illumination+steel*.46;
  }else if(part<3.5){
    // The goal floor is team-painted turf, with soft baked recess occlusion.
    float x=abs(goalWorldPosition.x),z=abs(goalWorldPosition.z)-5120.;
    float ao=smoothstep(540.,805.,x)*.30+smoothstep(670.,850.,z)*.24;
    result=goalTeam*vec3(.56,.64,.76)*(1.-ao);
    result+=vec3(.012,.025,.035)*(1.-ao);
    float stripe=1.-smoothstep(3.,7.,abs(z-62.));
    result=mix(result,vec3(.50,.68,.75),stripe*.65);
  }else if(part<4.5){
    // Frosted top beacons, white core with a saturated team-colored shoulder.
    vec3 frost=goalTeam.b>goalTeam.r?vec3(.72,1.,1.25):vec3(1.25,.97,.68);
    result=mix(goalTeam*1.4,frost,pow(facing,.75)*.87);
  }else{
    result=vec3(.012,.022,.031)*illumination+env*.06;
  }
  return result/(vec3(1.)+max(result-vec3(.88),vec3(0.))*.42);
}
`;

export function createGoalFrameMaterial(T, reflection, side) {
  const material=new T.MeshBasicMaterial({name:'Goal / reflected metal, inset light and silver throat',
    toneMapped:false,precision:'highp'});
  material.userData.referenceGoal=true;
  material.onBeforeCompile=shader=>{
    shader.uniforms.goalEnvironment={value:reflection};
    shader.uniforms.goalTeam={value:new T.Color(side<0?GOAL_STYLE.blue:GOAL_STYLE.orange)};
    shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>
      attribute float goalMaterial; varying float goalPart;
      varying vec2 goalSurface; varying vec3 goalWorldPosition; varying vec3 goalWorldNormal;`);
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      goalPart=goalMaterial;goalSurface=uv;
      goalWorldPosition=(modelMatrix*vec4(position,1.)).xyz;
      goalWorldNormal=mat3(modelMatrix)*normal;`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\n'+GOAL_FRAME_FRAGMENT);
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',
      '#include <color_fragment>\ndiffuseColor.rgb=shadeGoal(cameraPosition);');
  };
  material.customProgramCacheKey=()=>GOAL_STYLE.version;
  return material;
}

export const GOAL_GLOW_VERTEX=`
attribute vec3 goalTangent;
attribute vec2 glowCoord;
attribute float glowKind;
varying vec2 glowUV;
varying float glowType;
void main(){
  glowUV=glowCoord;glowType=glowKind;
  vec4 p=modelViewMatrix*vec4(position,1.);
  if(glowKind<.5){
    vec2 tangent=(modelViewMatrix*vec4(goalTangent,0.)).xy;
    vec2 perpendicular=vec2(-tangent.y,tangent.x)/max(length(tangent),.001);
    p.xy+=perpendicular*glowCoord.x*${GOAL_STYLE.glowRadius.toFixed(1)};
  }else p.xy+=glowCoord*91.;
  gl_Position=projectionMatrix*p;
}`;
export const GOAL_GLOW_FRAGMENT=`
uniform vec3 glowColor;
varying vec2 glowUV;
varying float glowType;
void main(){
  float d=glowType<.5?abs(glowUV.x):length(glowUV);
  if(d>1.)discard;
  float falloff=exp(-d*d*6.8)*(1.-smoothstep(.72,1.,d));
  float alpha=falloff*(glowType<.5?.42:.34);
  gl_FragColor=vec4(glowColor,alpha);
  #include <colorspace_fragment>
}`;

function createGlowMaterial(T,side){
  return new T.ShaderMaterial({name:'Goal / depth-tested local bloom ribbon',
    uniforms:{glowColor:{value:new T.Color(side<0?GOAL_STYLE.blue:GOAL_STYLE.orange)}},
    vertexShader:GOAL_GLOW_VERTEX,fragmentShader:GOAL_GLOW_FRAGMENT,
    transparent:true,blending:T.AdditiveBlending,depthTest:true,depthWrite:false,
    side:T.DoubleSide,forceSinglePass:true,toneMapped:false,precision:'highp'});
}

// Continuous open arch, including subtly flared feet; all decoration remains
// outside the mouth rather than narrowing the native scoring opening.
export function goalArchPoints(){
  const p=[[-992,5],[-970,24],[-953,58],[-947,105],[-947,310],[-947,543]];
  for(let j=1;j<=16;j++){const a=Math.PI-j*Math.PI/32;p.push([-803+144*Math.cos(a),543+144*Math.sin(a)]);}
  for(let j=1;j<=16;j++)p.push([-803+j*1606/16,687]);
  for(let j=1;j<=16;j++){const a=Math.PI/2-j*Math.PI/32;p.push([803+144*Math.cos(a),543+144*Math.sin(a)]);}
  p.push([947,310],[947,105],[953,58],[970,24],[992,5]);
  return p;
}

function meshBatch(T){
  const positions=[],normals=[],uv=[],parts=[],indices=[];
  function add(g,part=0,uvOverride=null){
    const p=g.getAttribute('position'),n=g.getAttribute('normal'),t=g.getAttribute('uv'),offset=positions.length/3;
    for(let k=0;k<p.count;k++){
      positions.push(p.getX(k),p.getY(k),p.getZ(k));normals.push(n.getX(k),n.getY(k),n.getZ(k));
      uv.push(...(uvOverride??[t?.getX(k)??0,t?.getY(k)??0]));parts.push(part);
    }
    if(g.index)for(const j of g.index.array)indices.push(j+offset);else for(let j=0;j<p.count;j++)indices.push(offset+j);
    g.dispose();
  }
  function sweep(path,profile,side,part=0,plane=GOAL_STYLE.plane){
    const base=positions.length/3,m=profile.length;
    let length=0;
    for(let j=0;j<path.length;j++){
      const prev=path[Math.max(0,j-1)],next=path[Math.min(path.length-1,j+1)];
      const tx=next[0]-prev[0],ty=next[1]-prev[1],len=Math.hypot(tx,ty)||1;
      const nx=-ty/len,ny=tx/len;
      if(j)length+=Math.hypot(path[j][0]-path[j-1][0],path[j][1]-path[j-1][1]);
      for(let k=0;k<m;k++){
        const [b,d]=profile[k],a=profile[(k+m-1)%m],c=profile[(k+1)%m];
        // Surface normal from the cross section, smoothed through rounded bevels.
        const db=c[0]-a[0],dd=c[1]-a[1],nl=Math.hypot(db,dd)||1;
        positions.push(path[j][0]+nx*b,Math.max(.6,path[j][1]+ny*b),side*(plane+d));
        normals.push(nx*dd/nl,ny*dd/nl,-side*db/nl);
        uv.push(part===1?length:b,d);parts.push(part);
      }
      if(j)for(let k=0;k<m;k++){
        const a0=base+(j-1)*m+k,b0=base+j*m+k,c0=base+j*m+(k+1)%m,d0=base+(j-1)*m+(k+1)%m;
        if(side<0)indices.push(a0,b0,c0,a0,c0,d0);else indices.push(a0,c0,b0,a0,d0,c0);
      }
    }
  }
  function box(x,y,z,w,h,d,part){const g=new T.BoxGeometry(w,h,d);g.translate(x,y,z);add(g,part);}
  function finish(){
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
    g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
    g.setAttribute('goalMaterial',new T.Float32BufferAttribute(parts,1));g.setIndex(indices);g.computeBoundingSphere();
    return g;
  }
  return {add,sweep,box,finish};
}

function glowGeometry(T,path,side){
  const positions=[],tangents=[],coords=[],kinds=[],indices=[];
  for(let j=0;j<path.length;j++){
    const prev=path[Math.max(0,j-1)],next=path[Math.min(path.length-1,j+1)];
    for(const sign of [-1,1]){
      positions.push(path[j][0],path[j][1],side*(GOAL_STYLE.plane-54));
      tangents.push(next[0]-prev[0],next[1]-prev[1],0);coords.push(sign,0);kinds.push(0);
    }
    if(j){const k=j*2;indices.push(k-2,k,k-1,k,k+1,k-1);}
  }
  for(const x of [-738,738]){
    const first=positions.length/3;
    for(const [u,v] of [[-1,-1],[1,-1],[1,1],[-1,1]]){
      positions.push(x,792,side*(GOAL_STYLE.plane-47));tangents.push(0,1,0);coords.push(u,v);kinds.push(1);
    }
    indices.push(first,first+1,first+2,first,first+2,first+3);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  g.setAttribute('goalTangent',new T.Float32BufferAttribute(tangents,3));
  g.setAttribute('glowCoord',new T.Float32BufferAttribute(coords,2));g.setAttribute('glowKind',new T.Float32BufferAttribute(kinds,1));
  g.setIndex(indices);g.computeBoundingSphere();g.boundingSphere.radius+=130;return g;
}

export function createReferenceGoal(T,reflection,side){
  if(side!==-1&&side!==1)throw new RangeError('Goal side must be -1 (blue) or 1 (orange)');
  const group=new T.Group();group.name=side<0?'Blue goal · reference portal':'Orange goal · reference portal';
  const path=goalArchPoints(),b=meshBatch(T);
  // Negative profile displacement faces the aperture, positive faces the wall.
  const profile=[[-41,160],[-41,12],[-38,-18],[-29,-37],[-16,-48],[0,-51],
    [17,-47],[32,-35],[43,-15],[47,12],[47,85],[39,174]];
  b.sweep(path,profile,side,0);
  b.sweep(path.slice(3,-3),[[-41,40],[-41,250],[-33,268],[-16,268],[-14,247],[-20,40]],side,1);
  for(const s of [-1,1]){
    const shoulder=[];
    for(let j=0;j<=18;j++){
      const t=j/18,u=1-t;
      shoulder.push([s*(u*u*u*900+3*u*u*t*1100+3*u*t*t*1130+t*t*t*1420),
        u*u*u*691+3*u*u*t*691+3*u*t*t*343+t*t*t*343]);
    }
    shoulder.push([s*2530,343]);
    const ellipse=Array.from({length:8},(_,j)=>[Math.cos(j*Math.PI/4)*15,Math.sin(j*Math.PI/4)*22+65]);
    // Mirrored shoulders need reversed path orientation for the same normals.
    b.sweep(s<0?shoulder.reverse():shoulder,ellipse,side,2);
    b.box(s*2040,242,side*5205,980,175,48,5);
    b.box(s*2040,332,side*5192,1004,12,66,2);
    b.box(s*2040,155,side*5190,980,8,66,1);
  }
  for(const x of [-738,738]){
    const base=new T.CylinderGeometry(44,49,19,12,1);base.translate(x,739,side*5140);b.add(base,2);
    const lamp=new T.CylinderGeometry(30,34,64,12,1);lamp.translate(x,780,side*5140);b.add(lamp,4);
    const top=new T.SphereGeometry(30,12,6,0,Math.PI*2,0,Math.PI/2);top.translate(x,812,side*5140);b.add(top,4);
    const rim=new T.CylinderGeometry(35,34,7,12,1);rim.translate(x,813,side*5140);b.add(rim,2);
  }
  // Reuse a zero-thickness painted surface rather than extra layered decals.
  const floor=new T.BufferGeometry();
  floor.setAttribute('position',new T.Float32BufferAttribute([-796,.65,side*5120,796,.65,side*5120,796,.65,side*5970,-796,.65,side*5970],3));
  floor.setAttribute('normal',new T.Float32BufferAttribute([0,1,0,0,1,0,0,1,0,0,1,0],3));
  floor.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));
  floor.setIndex(side<0?[0,1,2,0,2,3]:[0,2,1,0,3,2]);b.add(floor,3);
  const solid=new T.Mesh(b.finish(),createGoalFrameMaterial(T,reflection,side));
  solid.name='Goal / continuous metal housing, liner, shoulders and beacons';
  solid.updateMatrix();solid.matrixAutoUpdate=false;
  const glow=new T.Mesh(glowGeometry(T,path,side),createGlowMaterial(T,side));
  glow.name='Goal / single-strip local bloom and beacon halos';glow.userData.bloomOccluder=false;
  glow.updateMatrix();glow.matrixAutoUpdate=false;
  group.add(solid,glow);group.updateMatrix();group.matrixAutoUpdate=false;
  group.userData.referenceGoal=GOAL_STYLE.version;
  group.userData.triangles=(solid.geometry.index.count+glow.geometry.index.count)/3;
  group.userData.drawCalls=2;
  return group;
}
