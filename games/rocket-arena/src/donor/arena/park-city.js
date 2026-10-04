import { CITY_MODELS } from './park-city-models.js';
// Selected meshes from the supplied city, normalized OFFLINE, not a runtime USD
// scene. Textured facades and a broad sky tint share one opaque draw.
export const CITY_FRAGMENT = `
uniform sampler2D cityEnvironment;
varying vec3 cityWorld,cityNormal;
vec3 shadeCity(vec3 pigment,vec3 eye) {
  vec3 N=normalize(cityNormal),V=normalize(eye-cityWorld),R=reflect(-V,N);
  float fresnel=pow(1.-clamp(abs(dot(N,V)),0.,1.),4.);
  vec3 env=mix(vec3(.20,.29,.32),vec3(.18,.49,.83),smoothstep(-.25,.94,R.y));
  float sun=max(0.,dot(N,normalize(vec3(-.38,.48,.79))));
  vec3 result=pigment*vec3(.44,.65,.88)*(.68+sun*.48)+env*(.07+.20*fresnel);
  // Bright silver edges, blue reflected sky, never grey/brown cinematic grading.
  result+=vec3(.085,.145,.20)*fresnel;
  float haze=smoothstep(12500.,37000.,length(eye-cityWorld))*.19;
  return mix(result,vec3(.36,.62,.81),haze);
}`;

export function createParkCity(T,reflection,atlas=reflection) {
  const positions=[],normals=[],colors=[],uv=[];
  const slots=4,padU=8/2048,padV=8/2048;
  function building(modelId,x,z,height,rotation=0,widthScale=1) {
    const model=CITY_MODELS[modelId%CITY_MODELS.length],c=Math.cos(rotation),s=Math.sin(rotation);
    const tint=new T.Color().setRGB(.90+(modelId%3)*.025,.96,1.);
    const slot=model.material,u0=(slot%slots)/4+padU,v0=1-(Math.floor(slot/slots)+1)/2+padV;
    for(const index of model.indices){
      const k=index*3,a=model.positions[k]*height*widthScale,b=model.positions[k+2]*height*widthScale;
      positions.push(x+c*a+s*b,model.positions[k+1]*height,z-s*a+c*b);
      let nx=model.normals[k]/widthScale,ny=model.normals[k+1],nz=model.normals[k+2]/widthScale;
      const l=Math.hypot(nx,ny,nz)||1;nx/=l;ny/=l;nz/=l;
      normals.push(c*nx+s*nz,ny,-s*nx+c*nz);colors.push(tint.r,tint.g,tint.b);
      const tu=Math.max(0,Math.min(1,model.uv[index*2])),tv=Math.max(0,Math.min(1,model.uv[index*2+1]));
      uv.push(u0+tu*(.25-2*padU),v0+tv*(.5-2*padV));
    }
  }
  // Irregular waterfront blocks: actual roof silhouettes, no sliced skyline
  // wallpaper. Lower front rows keep the lake visible from raised views.
  const layout=[
    [0,1800,-19000,3400,.17,1.05],[3,3550,-18200,2950,-.15,.92],
    [1,4650,-21200,6400,.20,1.12],[2,6200,-18600,5300,.05,1.],
    [6,7900,-22100,8200,.17,.82],[4,9300,-19700,5500,-.10,.87],
    [7,10800,-21900,7100,.13,1.12],[5,12400,-18600,5800,.35,1.],
    [1,14300,-22200,8700,-.2,1.],[4,15900,-19200,5900,.15,.8],
    [0,17900,-22100,6700,.33,1.],[2,19800,-18700,4300,-.1,.85],
    [3,4000,-24400,3900,.08,.88],[0,6300,-26000,6800,.15,1.02],
    [2,10600,-25100,8300,.25,1.],[5,15900,-26500,9200,-.08,1.12],
    [4,18200,-24800,7400,.17,.77],[7,21300,-24200,7000,-.2,1.05],
    [2,2500,-15700,2000,.15,.90],[3,5200,-15900,2100,.13,.95],
    [4,9900,-16400,2850,.05,.98],[7,14500,-16000,2750,-.13,1.],
  ];
  for(const row of layout)building(...row);
  // A smaller, differently spaced opposite-end district; not a mirrored copy.
  for(let i=0;i<18;i++){
    const row=layout[(i*7)%layout.length];
    building((row[0]+2)%8,row[1]*.91+1900,-row[2]*1.04,row[3]*(.64+.055*(i%4)),-row[4]+.3,row[5]);
  }
  // Low waterfront blocks visually anchor the tall silhouettes to the city.
  for(let i=0;i<68;i+=2){
    const side=i<40?1:-1,j=i%40;
    const x=(2400+(j%10)*1760+Math.sin(j*4.1)*260);
    const z=-side*(15800+Math.floor(j/10)*2650+Math.cos(j*2.7)*300);
    building(j%2?3:7,x,z,620+(j*113%710),.15+(j%3)*.25,2.3);
  }
  const g=new T.BufferGeometry();
  for(const [name,a,width] of [['position',positions,3],['normal',normals,3],['color',colors,3],['uv',uv,2]])g.setAttribute(name,new T.Float32BufferAttribute(a,width));
  g.computeBoundingSphere();atlas.colorSpace=T.SRGBColorSpace;
  atlas.wrapS=T.ClampToEdgeWrapping;atlas.wrapT=T.ClampToEdgeWrapping;atlas.anisotropy=1;
  const m=new T.MeshBasicMaterial({map:atlas,vertexColors:true,toneMapped:false,precision:'highp',side:T.DoubleSide,forceSinglePass:true});
  m.name='Park / blue-glass city, optimized supplied facades';
  m.onBeforeCompile=shader=>{
    shader.uniforms.cityEnvironment={value:reflection};
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 cityWorld,cityNormal;');
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ncityWorld=(modelMatrix*vec4(position,1.)).xyz;cityNormal=mat3(modelMatrix)*normal;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\n'+CITY_FRAGMENT);
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb=shadeCity(diffuseColor.rgb,cameraPosition);');
  };
  m.customProgramCacheKey=()=> 'park-supplied-glass-city-v3-low-detail';
  const mesh=new T.Mesh(g,m);mesh.name='Park / dimensional glass skyline';mesh.matrixAutoUpdate=false;
  mesh.userData.triangles=positions.length/9;mesh.userData.buildings=74;mesh.userData.visualOnly=true;return mesh;
}
