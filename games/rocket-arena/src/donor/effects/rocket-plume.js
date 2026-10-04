import { BufferGeometry, Float32BufferAttribute, Mesh, ShaderMaterial, AdditiveBlending, DoubleSide } from '../vendor/three.js';

export const ROCKET_PLUME_VERTEX = `
uniform float time;
uniform float opacity;
varying vec2 vUv;
varying vec3 vNormal,vView;
void main(){
  vUv=uv;
  float t=uv.y;
  vec3 p=position;
  float pulse=1.+.025*sin(time*21.)+.018*sin(time*37.);
  p.x*=mix(.38,1.,opacity)*pulse;
  p.y+=sin(t*14.-time*25.)*.65*t*t;
  p.z+=sin(t*11.-time*19.+1.7)*.45*t*t;
  vNormal=normalize(mat3(modelMatrix)*normal);
  vView=cameraPosition-(modelMatrix*vec4(p,1.)).xyz;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
}`;
export const ROCKET_PLUME_FRAGMENT = `
uniform float time,opacity,coreLayer;
varying vec2 vUv;
varying vec3 vNormal,vView;
void main(){
  float t=vUv.y;
  float angle=vUv.x*6.2831853;
  // Periodic angular flow has no visible UV seam around the nozzle.
  float flow=.5+.25*sin(angle*5.+t*31.-time*24.)+.16*sin(angle*9.-t*53.+time*35.);
  float face=dot(normalize(vNormal),normalize(vView));
  if(face<=0.)discard;
  float edge=smoothstep(.025,.60,face);
  float tail=1.-smoothstep(.55,.98,t+.055*(flow-.5));
  float start=smoothstep(0.,.025,t);
  float diamonds=pow(.5+.5*cos(t*31.-.2*sin(time*13.)),9.)*(1.-smoothstep(.2,.8,t));
  float core=mix(.06,.8,coreLayer)*(1.-smoothstep(.03,.5,t));
  vec3 color=mix(vec3(2.2,.08,.008),vec3(3.2,.6,.055),flow);
  color=mix(color,vec3(4.5,3.5,1.8),clamp(core+diamonds*.35*coreLayer,0.,1.));
  float alpha=opacity*start*tail*edge*mix(.48,.55,coreLayer)*(.65+.35*flow);
  if(alpha<.002)discard;
  gl_FragColor=vec4(color,alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

function plumeGeometry(radius,length){
  const positions=[],uv=[],indices=[],rings=32,sides=16;
  for(let i=0;i<=rings;i++){
    const t=i/rings;
    // A full nozzle throat contracts into a focused jet and wispy tip.
    const r=radius*(.68+.32*Math.sin(Math.PI*t)) * Math.pow(1-t, .65);
    for(let j=0;j<=sides;j++){
      const a=j/sides*Math.PI*2;
      positions.push(-length*t,r*Math.cos(a),r*Math.sin(a));uv.push(j/sides,t);
      if(i<rings&&j<sides){const k=i*(sides+1)+j,n=k+sides+1;indices.push(k,n,k+1,n,n+1,k+1);}
    }
  }
  const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(positions,3));g.setAttribute('uv',new Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();return g;
}
export function createRocketPlume(){
  return [[7.2,72,0],[3.6,48,1]].map(([radius,length,core])=>{
    const material=new ShaderMaterial({name:core?'Boost / hot core':'Boost / flowing jet',uniforms:{time:{value:0},opacity:{value:0},coreLayer:{value:core}},vertexShader:ROCKET_PLUME_VERTEX,fragmentShader:ROCKET_PLUME_FRAGMENT,transparent:true,blending:AdditiveBlending,depthWrite:false,side:DoubleSide,toneMapped:true,forceSinglePass:true});
    const mesh=new Mesh(plumeGeometry(radius,length),material);mesh.frustumCulled=false;return mesh;
  });
}
