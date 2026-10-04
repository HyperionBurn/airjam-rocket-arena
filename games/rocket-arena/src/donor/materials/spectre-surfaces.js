// Measured against the supplied mesh's recesses, in source-model units.
// Shared by live GLSL and offline review; these are materials, not a bitmap skin.
export const SPECTRE_WINDOWS = Object.freeze({
  side: [[-.342,.108],[-.313,.166],[-.054,.166],[.066,.080],[-.205,.093],[-.256,.105]],
  front: [[-.193,.086],[.193,.086],[.165,.170],[-.165,.170]],
  rear: [[-.182,.068],[.182,.068],[.156,.163],[-.156,.163]],
  grille: [[-.226,-.047],[.226,-.047],[.203,.032],[-.203,.032]],
  led: [[-.195,-.030],[.195,-.030],[.173,.012],[-.173,.012]],
});
export const SPECTRE_FINISHES = Object.freeze({
  paint: { color:[0,.48235,1], roughness:.23, metalness:.22, coat:1, reflection:1 },
  glass: { color:[.009,.011,.015], roughness:.11, metalness:0, coat:0, reflection:.18 },
  seal: { color:[.022,.024,.028], roughness:.54, metalness:0, coat:0, reflection:.48 },
  pillar: { color:[.035,.037,.042], roughness:.36, metalness:.06, coat:0, reflection:.6 },
  bumper: { color:[.061,.065,.074], roughness:.43, metalness:.03, coat:0, reflection:.68 },
  arch: { color:[.043,.046,.052], roughness:.48, metalness:0, coat:0, reflection:.52 },
  grille: { color:[.018,.014,.017], roughness:.55, metalness:.04, coat:0, reflection:.35 },
});
// A dark reflected direction must not erase the blue pigment at grazing views.
// Keep the clearcoat highlights, but limit its view-dependent base attenuation.
export const SPECTRE_MAX_COAT_ATTENUATION = .12;
// The two existing rear lamp recesses: red inset perimeter, opaque black lens.
export const SPECTRE_REAR_LAMP = Object.freeze({
  backX: -.449, centerZ: .17, centerY: 0,
  halfWidth: .055, halfHeight: .023, cornerRadius: .006,
  inset: .004, lineHalfWidth: .0023,
});
export function spectreRearLampDistance(y,z) {
  const l=SPECTRE_REAR_LAMP;
  const qx=Math.abs(Math.abs(z)-l.centerZ)-l.halfWidth+l.cornerRadius;
  const qy=Math.abs(y-l.centerY)-l.halfHeight+l.cornerRadius;
  return Math.hypot(Math.max(qx,0),Math.max(qy,0))+Math.min(Math.max(qx,qy),0)-l.cornerRadius;
}
export function polygonDistance(p, polygon) {
  let distance=Infinity, inside=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const a=polygon[i],b=polygon[j],dx=b[0]-a[0],dy=b[1]-a[1];
    const t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)));
    distance=Math.min(distance,Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy));
    if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }
  return inside?-distance:distance;
}
export function spectreSurfaceAt(x,y,z) {
  const az=Math.abs(z),radius=Math.hypot(x-(x>0?.285:-.325),y+.095);
  let surface='paint';
  if((az>.202&&radius<.132&&y>-.14)||(az>.14&&radius<.104)||y<-.168)surface='arch';
  if((x>.391&&y<-.065)||(x<-.437&&y<-.066))surface='bumper';
  let windowDistance=1;
  if(az>.155&&x<.076)windowDistance=polygonDistance([x,y],SPECTRE_WINDOWS.side);
  if(x>-.032&&x<.16)windowDistance=Math.min(windowDistance,polygonDistance([z,y],SPECTRE_WINDOWS.front));
  if(x<-.382)windowDistance=Math.min(windowDistance,polygonDistance([z,y],SPECTRE_WINDOWS.rear));
  if(windowDistance<.0055)surface=windowDistance<-.003?'glass':'seal';
  const pillar=x-.40*(y-.105);
  if(az>.16&&x<-.20&&windowDistance<-.001&&pillar>-.271&&pillar<-.235)surface='pillar';
  if(x>.413&&polygonDistance([z,y],SPECTRE_WINDOWS.grille)<.003){
    surface=Math.abs(polygonDistance([z,y],SPECTRE_WINDOWS.led)-.006)<.0023?'led':'grille';
  }
  if(x<SPECTRE_REAR_LAMP.backX){
    const d=spectreRearLampDistance(y,z);
    if(d<.003)surface=Math.abs(d+SPECTRE_REAR_LAMP.inset)<SPECTRE_REAR_LAMP.lineHalfWidth?'led':'grille';
  }
  return surface;
}
// The generated mesh has rippled window normals. Flat glass should reflect
// as a pane, not like the rounded bodywork around it; no vertices are moved.
export function spectreGlassNormal(x,y,z) {
  const sideDistance=Math.abs(z)>.155&&x<.076?polygonDistance([x,y],SPECTRE_WINDOWS.side):1;
  const frontDistance=x>-.032&&x<.16?polygonDistance([z,y],SPECTRE_WINDOWS.front):1;
  return x<-.382?[-.89,.46,0]:sideDistance<frontDistance?[0,.36,Math.sign(z)]:[.61,.79,0];
}
const number=n=>Number.isInteger(n)?`${n}.`:String(n);
const polygonGLSL=(name,points)=>`
float spectre${name}Window(vec2 p){
  vec2 points[${points.length}]=vec2[${points.length}](${points.map(p=>`vec2(${p.map(number).join(',')})`).join(',')});
  float d=1.;bool inside=false;
  for(int i=0,j=${points.length-1};i<${points.length};j=i++){
    vec2 a=points[i],b=points[j],e=b-a;
    d=min(d,length(p-a-e*clamp(dot(p-a,e)/dot(e,e),0.,1.)));
    if((a.y>p.y)!=(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
  }
  return inside?-d:d;
}`;
export const SPECTRE_SURFACE_HELPERS=Object.entries(SPECTRE_WINDOWS).map(([name,p])=>polygonGLSL(name,p)).join('\n')+`
float spectreRearLampDistance(vec2 p){
  vec2 q=abs(vec2(abs(p.x)-${number(SPECTRE_REAR_LAMP.centerZ)},p.y-${number(SPECTRE_REAR_LAMP.centerY)}))
    -vec2(${number(SPECTRE_REAR_LAMP.halfWidth-SPECTRE_REAR_LAMP.cornerRadius)},${number(SPECTRE_REAR_LAMP.halfHeight-SPECTRE_REAR_LAMP.cornerRadius)});
  return length(max(q,0.))+min(max(q.x,q.y),0.)-${number(SPECTRE_REAR_LAMP.cornerRadius)};
}`;
const finish=name=>{const f=SPECTRE_FINISHES[name];return `spectrePaint=${name==='paint'?'true':'false'};base=srgbToLinear(vec3(${f.color.map(number).join(',')}));rough=${number(f.roughness)};metal=${number(f.metalness)};coat=${number(f.coat)};reflectScale=${number(f.reflection)};`;};
export const SPECTRE_SURFACES = `
  if(uSpectreBody==1){
    vec3 fittedPosition=vSurfacePosition+vec3(0.,17.,0.);
    vec3 p=((fittedPosition-uSurfaceFitOffset)/uSurfaceFitScale)/145.;
    p.y-=.1962890625;
    float az=abs(p.z);
    ${finish('paint')}
    float axle=p.x>0.?.285:-.325;
    float radius=length(vec2(p.x-axle,p.y+.095));
    bool arch=(az>.202&&radius<.132&&p.y>-.14)||(az>.14&&radius<.104);
    bool bumper=(p.x>.391&&p.y<-.065)||(p.x<-.437&&p.y<-.066);
    if(arch||p.y<-.168){${finish('arch')}}
    if(bumper){
      ${finish('bumper')}
      // Remove generated triangulation ripples on the broad plastic face,
      // retaining the authored top/bottom edge normals and rounded corners.
      float corner=smoothstep(.17,.26,az);
      vec3 bumperNormal=normalize(vec3(sign(p.x)*(1.-corner),0.,sign(p.z)*corner));
      float broadFace=1.-smoothstep(.35,.70,abs(vNormal.y));
      N=normalize(mix(N,normalize(mat3(modelMatrix)*bumperNormal),broadFace*.9));
    }
    float windowDistance=1.;
    float sideDistance=az>.155&&p.x<.076?spectresideWindow(p.xy):1.;
    float frontDistance=p.x>-.032&&p.x<.16?spectrefrontWindow(p.zy):1.;
    windowDistance=min(sideDistance,frontDistance);
    if(p.x<-.382)windowDistance=min(windowDistance,spectrerearWindow(p.zy));
    if(windowDistance<.0055){${finish('seal')}}
    if(windowDistance<-.003){
      ${finish('glass')}
      vec3 glassNormal=p.x<-.382?vec3(-.89,.46,0.):sideDistance<frontDistance?vec3(0.,.36,sign(p.z)):vec3(.61,.79,0.);
      N=normalize(mat3(modelMatrix)*glassNormal);
    }
    float pillar=p.x-.40*(p.y-.105);
    if(az>.16&&p.x<-.20&&windowDistance<-.001&&pillar>-.271&&pillar<-.235){${finish('pillar')}}
    emission=vec3(0.);
    if(p.x<${number(SPECTRE_REAR_LAMP.backX)}){
      float rearDistance=spectreRearLampDistance(p.zy);
      if(rearDistance<.003){
        ${finish('grille')}
        float d=rearDistance+${number(SPECTRE_REAR_LAMP.inset)};
        float aa=max(fwidth(d),.0005);
        float rim=1.-smoothstep(${number(SPECTRE_REAR_LAMP.lineHalfWidth)},${number(SPECTRE_REAR_LAMP.lineHalfWidth)}+aa,abs(d));
        emission=vec3(6.,.015,.025)*rim;
      }
    }
    if(p.x>.413&&spectregrilleWindow(p.zy)<.003){
      ${finish('grille')}
      float d=spectreledWindow(p.zy)-.006;
      float aa=max(fwidth(d),.0005);
      float rim=1.-smoothstep(.0023,.0023+aa,abs(d));
      emission=vec3(6.,.015,.025)*rim;
    }
  }
`;
