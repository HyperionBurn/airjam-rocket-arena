// Measured in the aligned GLB's game-unit coordinates (before the body -17 Y).
// Shared surface masks give the imported scan clean boundaries at pixel scale.
import { polygonDistance } from "./spectre-surfaces.js";
export const TRIO_PROFILES = [
  {
    id: "amethyst",
    color: [0.56, 0.055, 0.84],
    frontX: 0,
    sideZ: 18,
    rearX: -30,
    side: [
      [-32, 41.5],
      [-26, 38.2],
      [-12, 35.5],
      [11.5, 35.2],
      [2, 41.7],
      [-6, 45.2],
      [-20, 44.7],
    ],
    front: [
      [-25, 35],
      [-14, 33.8],
      [0, 33.4],
      [14, 33.8],
      [24.4, 35],
      [19, 45.4],
      [7, 46.5],
      [-7, 46.5],
      [-19, 45.4],
    ],
    rear: [
      [-17.5, 43.8],
      [17.5, 43.8],
      [15.5, 47.4],
      [-15.5, 47.4],
    ],
    lamp: [
      [17.5, 22.3],
      [20.5, 21.3],
      [29.8, 23.2],
      [29.6, 28],
      [24, 26.9],
    ],
    grille: [
      [-20, 9],
      [20, 9],
      [17, 22],
      [-17, 22],
    ],
    intake: [
      [-40, 22],
      [-35, 20],
      [-29, 33],
      [-35, 32],
    ],
    hood: [
      [25, 16],
      [40, 18],
      [41, 19.3],
      [25, 17.8],
    ],
    axles: [
      [43.555, 14.413, 17],
      [-44.83, 17.813, 17.7],
    ],
    rocker: [10.8, -0.035],
  },
  {
    id: "volt",
    color: [0.56, 0.86, 0.008],
    frontX: 10,
    sideZ: 14,
    rearX: -22,
    side: [
      [-19, 44.2],
      [-14, 41.8],
      [-5, 40.3],
      [15, 39],
      [18.5, 40],
      [10.5, 47.1],
      [6, 48.5],
      [-4, 48.5],
      [-15, 45.6],
    ],
    front: [
      [-22, 40],
      [-12, 39.3],
      [0, 39.1],
      [17.5, 40],
      [13.5, 48.8],
      [0, 49.5],
      [-13.5, 48.8],
    ],
    rear: [
      [-15, 41],
      [15, 41],
      [12, 48],
      [-12, 48],
    ],
    lamp: [
      [19, 31],
      [28, 29.7],
      [35.2, 33],
      [30.5, 35.3],
      [22, 34.4],
    ],
    grille: [
      [-22, 9],
      [22, 9],
      [15, 28],
      [-15, 28],
    ],
    intake: [
      [-33, 22],
      [-23, 20],
      [-22, 35],
      [-29, 37],
    ],
    hood: [
      [29, 12],
      [45, 14],
      [45, 16],
      [29, 14],
    ],
    axles: [
      [43.404, 17.879, 19.8],
      [-46.11, 17.879, 19.8],
    ],
    rocker: [10.6, 0],
  },
  {
    id: "crimson",
    color: [0.78, 0.016, 0.031],
    frontX: 1,
    sideZ: 21,
    rearX: -27,
    side: [
      [-34, 44.5],
      [-20, 41.7],
      [9, 42.7],
      [-3, 53.5],
      [-14, 54.2],
      [-24, 52.5],
      [-32, 49],
    ],
    front: [
      [-29, 42.5],
      [29, 42.5],
      [22.5, 54.4],
      [9, 55.5],
      [-9, 55.5],
      [-22.5, 54.4],
    ],
    rear: [
      [-21, 47],
      [21, 47],
      [20, 52.5],
      [12, 54.2],
      [-12, 54.2],
      [-20, 52.5],
    ],
    lamp: [
      [19, 25.3],
      [37, 25.3],
      [37.5, 33.8],
      [21, 34],
    ],
    grille: [
      [-37.5, 25],
      [37.5, 25],
      [37.5, 34.5],
      [-37.5, 34.5],
    ],
    intake: [],
    hood: [],
    axles: [
      [43.123, 17.075, 19.8],
      [-42.796, 16.782, 19.8],
    ],
    rocker: [10.2, 0],
  },
];
const poly = (p, vs) => (vs.length ? polygonDistance(p, vs) : 1e6);
export function trioSurfaceAt(index, x, y, z) {
  const c = TRIO_PROFILES[index - 1],
    az = Math.abs(z);
  let surface = "paint";
  if (y < c.rocker[0] + c.rocker[1] * x) surface = "trim";
  if (az > 24 && poly([x, y], c.intake) < 0) surface = "trim";
  if (y > 30 && poly([x, az], c.hood) < 0) surface = "trim";
  if (
    index === 2 &&
    az > 30 &&
    c.axles.some(([wx, wy, r]) => Math.hypot(x - wx, y - wy) < r + 1.5)
  )
    surface = "trim";
  let wd = az > c.sideZ ? poly([x, y], c.side) : 1e6;
  if (x > c.frontX && x < 32) wd = Math.min(wd, poly([z, y], c.front));
  if (x < c.rearX && x > c.rearX - 23) wd = Math.min(wd, poly([z, y], c.rear));
  if (wd < 0.5) surface = wd < -0.12 ? "glass" : "seal";
  if (index === 3 && az > 22 && Math.abs(x + 17) < 0.5 && wd < 0)
    surface = "seal";
  if (index === 3 && x > 24 && x < 65 && y > 34 && az > 8 && az < 16)
    surface = "trim";
  if (x > (index === 3 ? 63 : 56) && poly([z, y], c.grille) < 0)
    surface = "grille";
  if (x > (index === 3 ? 61 : 51) && poly([az, y], c.lamp) < 0)
    surface = "lens";
  if (index === 3 && x > 65 && y > 21.5 && y < 25.3 && az < 39)
    surface = "metal";
  if (x < -63 && y > 23 && y < 32 && az < 29)
    surface = az > 19 ? "taillight" : "grille";
  return surface;
}
const num = (x) => (Number.isInteger(x) ? `${x}.` : String(x));
function polygonGLSL(name, points) {
  if (!points.length) return `float ${name}(vec2 p){return 10000.;}`;
  return `float ${name}(vec2 p){vec2 v[${points.length}]=vec2[${points.length}](${points.map((p) => `vec2(${p.map(num)})`).join(",")});
  float d=10000.;bool inside=false;for(int i=0,j=${points.length - 1};i<${points.length};j=i++){
  vec2 a=v[i],b=v[j],e=b-a;d=min(d,length(p-a-e*clamp(dot(p-a,e)/dot(e,e),0.,1.)));
  if((a.y>p.y)!=(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;}
  return inside?-d:d;}`;
}
export const TRIO_SURFACE_HELPERS =
  TRIO_PROFILES.map((c, i) =>
    ["side", "front", "rear", "lamp", "grille", "intake", "hood"]
      .map((k) => polygonGLSL(`trio${i + 1}${k}`, c[k]))
      .join("\n"),
  ).join("\n") +
  `
float trioBand(float v,float lo,float hi,float edge){return smoothstep(lo,lo+edge,v)*(1.-smoothstep(hi-edge,hi,v));}
`;
const finish = {
  paint: "base=trioPaint;rough=.25;metal=.19;coat=.68;reflectScale=.85;",
  trim: "base=srgbToLinear(vec3(.035,.043,.054));rough=.48;metal=.02;coat=0.;reflectScale=.4;",
  glass:
    "base=srgbToLinear(vec3(.025,.045,.071));rough=.115;metal=.07;coat=.4;reflectScale=.7;",
  seal: "base=srgbToLinear(vec3(.018,.023,.03));rough=.55;metal=0.;coat=0.;reflectScale=.28;",
  lens: "base=srgbToLinear(vec3(.012,.034,.062));rough=.13;metal=.15;coat=.75;reflectScale=.6;",
  grille:
    "base=srgbToLinear(vec3(.016,.021,.028));rough=.55;metal=.1;coat=0.;reflectScale=.32;",
  metal:
    "base=srgbToLinear(vec3(.4,.46,.53));rough=.22;metal=.85;coat=0.;reflectScale=.9;",
};
export const TRIO_SURFACES = `
if(uTrioBody>0){
  vec3 p=(vSurfacePosition+vec3(0.,17.,0.)-uSurfaceFitOffset)/uSurfaceFitScale;float az=abs(p.z);emission=vec3(0.);
  vec3 trioPaint=vec3(0.);float wd=10000.;float sd=10000.;float fd=10000.;float rd=10000.;float lamp=10000.;float grille=10000.;
  bool trim=false;bool chrome=false;bool rearLamp=false;
  ${TRIO_PROFILES.map(
    (c, i) => `if(uTrioBody==${i + 1}){
    trioPaint=srgbToLinear(vec3(${c.color.map(num)}));
    trim=p.y<${num(c.rocker[0])}+${num(c.rocker[1])}*p.x;
    if(az>24.&&trio${i + 1}intake(p.xy)<0.)trim=true;
    if(p.y>30.&&trio${i + 1}hood(vec2(p.x,az))<0.)trim=true;
    if(az>${num(c.sideZ)})sd=trio${i + 1}side(p.xy);
    if(p.x>${num(c.frontX)}&&p.x<32.)fd=trio${i + 1}front(p.zy);
    if(p.x<${num(c.rearX)}&&p.x>${num(c.rearX - 23)})rd=trio${i + 1}rear(p.zy);
    if(p.x>${i === 2 ? "61." : "51."})lamp=trio${i + 1}lamp(vec2(az,p.y));
    if(p.x>${i === 2 ? "63." : "56."})grille=trio${i + 1}grille(p.zy);
    ${i === 1 ? `if(az>30.&&(length(p.xy-vec2(${c.axles[0].slice(0, 2).map(num)}))<21.3||length(p.xy-vec2(${c.axles[1].slice(0, 2).map(num)}))<21.3))trim=true;` : ""}
    ${i === 2 ? "if(p.x>24.&&p.x<65.&&p.y>34.&&az>8.&&az<16.)trim=true;chrome=p.x>65.&&p.y>21.5&&p.y<25.3&&az<39.;" : ""}
  }`,
  ).join("\n")}
  ${finish.paint}
  if(trim){${finish.trim}}
  wd=min(sd,min(fd,rd));
  trioPaintSurface=!trim&&wd>=.5&&grille>=0.&&lamp>=0.&&!chrome;
  if(wd<.5){${finish.seal}}
  if(wd<-.12){
    ${finish.glass}
    vec3 pane=sd<min(fd,rd)?vec3(0.,.29,sign(p.z)*.957):fd<rd?vec3(.53,.848,0.):vec3(-.52,.854,0.);
    N=normalize(mat3(modelMatrix)*pane);
    if(uTrioBody==3&&sd<0.&&abs(p.x+17.)<.5){${finish.seal}}
  }
  if(grille<0.){
    ${finish.grille}
    vec2 cell=abs(fract(p.zy/vec2(1.15,.9))-.5);
    float meshLine=smoothstep(.32,.43,max(cell.x,cell.y));base*=1.+meshLine*1.9;
  }
  if(lamp<0.){
    ${finish.lens}

  }
  if(uTrioBody==2&&p.x>61.&&length(vec2(az,p.y)-vec2(18.8,17.8))<3.){
    trioPaintSurface=false;${finish.lens}
  }
  if(chrome){${finish.metal}}
  if(uTrioBody==1&&p.y>49.&&p.x> -28.&&p.x< -3.&&az<14.){trioPaintSurface=false;${finish.glass}N=normalize(mat3(modelMatrix)*vec3(0.,1.,0.));}
  if(p.x< -56.&&p.y<23.){trioPaintSurface=false;${finish.trim}}
  if(p.x>60.&&p.y<17.){trioPaintSurface=false;${finish.trim}}
  if(p.x< -63.&&p.y>23.&&p.y<32.&&az<29.){
    trioPaintSurface=false;${finish.grille}
    if(az>19.){base=srgbToLinear(vec3(.22,.008,.012));rough=.19;emission=vec3(1.4,.005,.008)*step(abs(p.y-28.),.8);}
  }
  if(trioPaintSurface){
    float door=trioBand(p.x,-28.,25.,6.)*trioBand(p.y,13.,uTrioBody==3?39.:35.,5.)*smoothstep(25.,30.,az)*smoothstep(.68,.94,abs(vNormal.z));
    vec3 panel=normalize(mat3(modelMatrix)*vec3(p.x*.0015,.08+(p.y-24.)*.006,sign(p.z)));
    N=normalize(mix(N,panel,door*.80));
    float hood=trioBand(p.x,27.,57.,7.)*(1.-smoothstep(15.,23.,az))*smoothstep(.75,.97,vNormal.y);
    vec3 bonnet=normalize(mat3(modelMatrix)*vec3((p.x-37.)*.005,1.,p.z*.012));
    N=normalize(mix(N,bonnet,hood*.7));
  }
  Ng=N;

}
`;
