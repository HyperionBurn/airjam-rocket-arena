import { polygonDistance } from './spectre-surfaces.js';

// Measured on the unmodified source mesh. Fit coordinates are kept separately
// so these boundaries stay on its recessed glass and sculpted lamp surrounds.
export const TRIPO_FLOOR_Y = -.10;
export const TRIPO_REGIONS = {
  side: [[-.116,.125],[-.052,.181],[.051,.176],[.109,.156],[.197,.096],[.181,.088],[-.100,.118]],
  front: [[-.094,.163],[.094,.163],[.111,.102],[.100,.089],[-.100,.089],[-.111,.102]],
  rear: [[-.070,.184],[.070,.184],[.089,.131],[-.089,.131]],
  frontRim: [[-.120,-.084],[-.104,-.044],[.104,-.044],[.120,-.084],[.112,-.092],[-.112,-.092]],
  rearRim: [[-.097,.043],[-.097,.095],[.097,.095],[.097,.043]],
};
export function tripoSurfaceAt(x,y,z){
  const az=Math.abs(z);
  if(x<-.285&&y>.126&&y<.19&&az>.075&&az<.13)return 'fin-support';
  const distances=[az>.095?polygonDistance([x,y],TRIPO_REGIONS.side):1,
    x>.12&&x<.28?polygonDistance([z,y],TRIPO_REGIONS.front):1,
    x<-.13&&x>-.25?polygonDistance([z,y],TRIPO_REGIONS.rear):1];
  const d=Math.min(...distances);
  if(d<0)return 'glass';
  if(d<.003)return 'seal';
  for(const [active,region] of [[x>.455,'frontRim'],[x<-.395,'rearRim']]){
    if(!active)continue;
    const rim=polygonDistance([z,y],TRIPO_REGIONS[region]);
    if(Math.abs(rim)<.004)return 'led';
    if(rim<0)return 'grille';
  }
  if(y<-.085)return 'underbody';
  if(y<-.15||(x<-.40&&y<.018)||(x>.445&&y<-.107))return 'trim';
  return 'paint';
}
const num=n=>Number.isInteger(n)?`${n}.`:String(n);
export const TRIPO_SURFACE_HELPERS=Object.entries(TRIPO_REGIONS).map(([name,points])=>`
float tripo${name}(vec2 p){
  vec2 points[${points.length}]=vec2[${points.length}](${points.map(p=>`vec2(${p.map(num).join(',')})`).join(',')});
  float d=1.;bool inside=false;
  for(int i=0,j=${points.length-1};i<${points.length};j=i++){
    vec2 a=points[i],b=points[j],e=b-a;
    d=min(d,length(p-a-e*clamp(dot(p-a,e)/dot(e,e),0.,1.)));
    if((a.y>p.y)!=(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
  }
  return inside?-d:d;
}`).join('\n');
export const TRIPO_SURFACES=`
  if(uTripoBody>.5){
    vec3 p=(vSurfacePosition+vec3(0.,17.,0.))/145.-vec3(0.,.2275390625,0.);
    float sideD=abs(p.z)>.095?triposide(p.xy):1.;
    float frontD=p.x>.12&&p.x<.28?tripofront(p.zy):1.;
    float rearD=p.x<-.13&&p.x>-.25?triporear(p.zy):1.;
    float glassD=min(sideD,min(frontD,rearD));
    tripoPaint=true;
    base=srgbToLinear(vec3(0.,.48235,1.));rough=.23;metal=.28;coat=1.;reflectScale=.8;
    if(glassD<.003){
      tripoPaint=false;base=srgbToLinear(vec3(.015,.019,.027));rough=.42;metal=0.;coat=0.;reflectScale=.35;
      if(glassD<0.){
        base=srgbToLinear(vec3(.009,.014,.022));rough=.13;reflectScale=.22;
        // A flat pane, not the scan's rippled normals, drives glass reflections.
        vec3 pane=sideD<min(frontD,rearD)?vec3(.08,.22,sign(p.z)):frontD<rearD?vec3(.54,.84,0.):vec3(-.64,.77,0.);
        N=normalize(mat3(modelMatrix)*pane);
      }
    }else if(p.y<-.15||(p.x<-.40&&p.y<.018)||(p.x>.445&&p.y<-.107)){
      tripoPaint=false;base=srgbToLinear(vec3(.035,.04,.05));rough=.55;metal=.1;coat=0.;reflectScale=.3;
    }
    if(p.y<-.085||(vNormal.y<-.4&&p.y<.04)){
      tripoPaint=false;base=srgbToLinear(vec3(.009,.011,.014));rough=.78;metal=0.;coat=0.;reflectScale=.16;
    }
    if(p.x<-.285&&p.y>.126&&p.y<.19&&abs(p.z)>.075&&abs(p.z)<.13){
      tripoPaint=false;base=srgbToLinear(vec3(.095,.105,.12));rough=.62;metal=.08;coat=0.;reflectScale=.3;
    }
    float rim=p.x>.455?tripofrontRim(p.zy):p.x<-.395?triporearRim(p.zy):1.;
    if(rim<.004){
      tripoPaint=false;base=srgbToLinear(vec3(.014,.009,.011));rough=.5;metal=.05;coat=0.;reflectScale=.2;
      float edge=1.-smoothstep(.003,.004,abs(rim));
      emission=vec3(5.,.012,.02)*edge;
    }
  }
`;
