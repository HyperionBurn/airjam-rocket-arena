import { FROZEN_WATER_FRAGMENT } from "../materials/frozen-water.js";
// A complete, low-cost environment beyond the gameplay walls. Static land and
// bridges are baked into one mesh; the lake uses a fixed normal/caustic snapshot.
// No live simulation, raymarching, water render targets, or scene captures.
export function parkShore(angle) {
  return [1.30+.075*Math.sin(angle*3+.5)+.06*Math.sin(angle*7),
    1.94+.14*Math.sin(angle+.5)+.10*Math.sin(angle*4-.6)];
}
export function parkLandHeight(x,z) {
  const r=Math.hypot(x/5900,z/6950),a=Math.atan2(x/5900,z/6950),[inner,outer]=parkShore(a);
  if(r<1.10)return -28;
  const dist=r<inner?inner-r:r>outer?r-outer:-Math.min(r-inner,outer-r);
  if(dist<0)return -210-Math.min(330,-dist*2200);
  const shore=-165+Math.min(1,dist/.10)*165;
  const hill=Math.max(0,Math.min(1,(dist-.06)/.5));
  const ripple=110+110*Math.sin(x*.00032+.5)*Math.cos(z*.00027)+70*Math.sin(x*.00063-z*.00031);
  return shore+hill*(Math.max(8,ripple)+Math.max(0,r-2.5)*48);
}
export { FROZEN_WATER_FRAGMENT as LAKE_FRAGMENT } from "../materials/frozen-water.js";

export function createParkLandscape(T,reflection,detail,shade=detail,frozenSurface=detail) {
  const root=new T.Group();root.name='Park / lakeside landscape';root.userData.visualOnly=true;
  const positions=[],normals=[],colors=[],uv=[];
  const color=new T.Color(),sun=new T.Vector3(-.45,.88,-.65).normalize();
  const emit=(p,n,c)=>{positions.push(...p);normals.push(...n);colors.push(...c);uv.push(p[0]/512,p[2]/512);};
  function surfacePoint(a,r){const x=Math.sin(a)*5900*r,z=Math.cos(a)*6950*r;return [x,parkLandHeight(x,z),z];}
  function vertex(p){
    const [x,y,z]=p;
    const nx=parkLandHeight(x-35,z)-parkLandHeight(x+35,z),nz=parkLandHeight(x,z-35)-parkLandHeight(x,z+35);
    const normal=new T.Vector3(nx,70,nz).normalize();
    const r=Math.hypot(x/5900,z/6950),a=Math.atan2(x/5900,z/6950),[inner,outer]=parkShore(a);
    const beach=Math.max(0,1-Math.min(Math.abs(r-inner),Math.abs(r-outer))/.05);
    const patch=(Math.sin(x*.0011+Math.cos(z*.0006)*2)*Math.sin(z*.0009-x*.0001))*.5+.5;
    color.set(0x527d3d).lerp(new T.Color(0x7e9b45),patch*.54).lerp(new T.Color(0xa6b4a0),beach*.75);
    const l=.77+.27*Math.max(0,normal.dot(sun));color.multiplyScalar(l);
    emit(p,normal.toArray(),color.toArray());
  }
  // Shore-following strips give a smooth coastline without a giant dense grid.
  const segments=72;
  const rings=a=>{const [i,o]=parkShore(a);return [.70,1.10,i-.075,i-.012,i+.035,(i+o)/2,o-.035,o+.012,o+.09,o+.30,2.65,3.2,4.0,5.8];};
  for(let i=0;i<segments;i++){
    const a=i/segments*Math.PI*2,b=(i+1)/segments*Math.PI*2,ra=rings(a),rb=rings(b);
    for(let j=0;j<ra.length-1;j++){
      const p0=surfacePoint(a,ra[j]),p1=surfacePoint(b,rb[j]),p2=surfacePoint(b,rb[j+1]),p3=surfacePoint(a,ra[j+1]);
      for(const p of [p0,p2,p1,p0,p3,p2])vertex(p);
    }
  }
  function addGeometry(g,tint){
    const raw=g.index?g.toNonIndexed():g,p=raw.attributes.position,n=raw.attributes.normal,c=new T.Color(tint);
    for(let i=0;i<p.count;i++){
      const norm=new T.Vector3(n.getX(i),n.getY(i),n.getZ(i));
      const k=.72+.28*Math.max(0,norm.dot(sun));
      emit([p.getX(i),p.getY(i),p.getZ(i)],norm.toArray(),[c.r*k,c.g*k,c.b*k]);
    }
    if(raw!==g)raw.dispose();g.dispose();
  }
  function beam(a,b,width,color){
    const start=new T.Vector3(...a),end=new T.Vector3(...b),d=end.clone().sub(start);
    const g=new T.CylinderGeometry(width,width,d.length(),5,1,true);
    g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.normalize()));g.translate(...start.add(end).multiplyScalar(.5).toArray());addGeometry(g,color);
  }
  // Two narrow, complete bridge spans connect the park to the opposite shore.
  for(const angle of [-.85,2.10]){
    const [inner,outer]=parkShore(angle),a=surfacePoint(angle,inner-.14),b=surfacePoint(angle,outer+.14);
    a[1]=45;b[1]=45;const dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz),rot=Math.atan2(dx,dz);
    const g=new T.BoxGeometry(200,50,length);g.rotateY(rot);g.translate((a[0]+b[0])/2,45,(a[2]+b[2])/2);addGeometry(g,0xbfc7bd);
    const nx=Math.cos(rot)*97,nz=-Math.sin(rot)*97;
    for(const sign of [-1,1]){
      beam([a[0]+sign*nx,125,a[2]+sign*nz],[b[0]+sign*nx,125,b[2]+sign*nz],7,0xa6bdc4);
      for(let k=0;k<=5;k++){const t=k/5,x=a[0]+t*dx+sign*nx,z=a[2]+t*dz+sign*nz;beam([x,65,z],[x,125,z],6,0x7798a4);}
    }
    for(const t of [.22,.50,.78])beam([a[0]+dx*t,-420,a[2]+dz*t],[a[0]+dx*t,22,a[2]+dz*t],49,0x859b9c);
  }
  const g=new T.BufferGeometry();for(const [name,data,size]of[['position',positions,3],['normal',normals,3],['color',colors,3],['uv',uv,2]])g.setAttribute(name,new T.Float32BufferAttribute(data,size));g.computeBoundingSphere();
  const m=new T.MeshBasicMaterial({vertexColors:true,toneMapped:false,precision:'highp'});
  m.name='Park / rolling land, shoreline and bridge batch';
  m.onBeforeCompile=s=>{
    s.uniforms.landDetail={value:detail};s.uniforms.landShade={value:shade};
    s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 landWorld;');
    s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nlandWorld=(modelMatrix*vec4(position,1.)).xyz;');
    s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 landWorld;uniform sampler2D landDetail,landShade;');
    s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float landGrain=texture2D(landDetail,landWorld.xz/640.).r;
      diffuseColor.rgb*=1.+(landGrain-.214)*.38;
      float canopy=texture2D(landShade,landWorld.xz/64000.+.5).r;
      diffuseColor.rgb*=mix(vec3(.58,.67,.70),vec3(1.),canopy);
      float air=smoothstep(11000.,43000.,distance(cameraPosition,landWorld))*.40;
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.29,.51,.63),air);`);
  };m.customProgramCacheKey=()=> 'park-lakeside-land-v1';
  const land=new T.Mesh(g,m);land.name=m.name;land.matrixAutoUpdate=false;land.userData.triangles=positions.length/9;land.userData.visualOnly=true;root.add(land);
  const wp=[],wi=[];
  for(let i=0;i<=segments;i++){
    const a=i/segments*Math.PI*2,[inner,outer]=parkShore(a);
    for(const r of [inner-.08,outer+.09])wp.push(Math.sin(a)*5900*r,-140,Math.cos(a)*6950*r);
    if(i<segments){const n=i*2;wi.push(n,n+2,n+1,n+1,n+2,n+3);}
  }
  const wg=new T.BufferGeometry();wg.setAttribute('position',new T.Float32BufferAttribute(wp,3));wg.setIndex(wi);wg.computeBoundingSphere();
  const wm=new T.ShaderMaterial({uniforms:{lakeEnvironment:{value:reflection},frozenSurface:{value:frozenSurface}},
    vertexShader:'varying vec3 lakeWorld;void main(){lakeWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:FROZEN_WATER_FRAGMENT,
    side:T.DoubleSide,depthWrite:true,transparent:false,toneMapped:false,precision:'highp',forceSinglePass:true});
  const water=new T.Mesh(wg,wm);water.name='Park / frozen turquoise refractive lake';water.matrixAutoUpdate=false;water.userData.triangles=wi.length/3;water.userData.visualOnly=true;
  water.userData.staticWater=true; water.userData.simulationPasses=0; root.add(water);
  return root;
}
