/* WebGL lake adaptation of jeantimex/webgpu-water, based on Evan Wallace.
 * MIT (c) 2026 Su; license: licenses/webgpu-water-MIT.txt.
 * The source's IOR, above-water tint, cubic Fresnel and warm sun highlight are
 * retained. Pool/sphere ray intersections are replaced by an analytic lake bed
 * and the park's static reflection panorama. Height normals and caustics are
 * precomputed: NO simulation, animation clock, or per-frame water render target.
 */
export const FROZEN_WATER_FRAGMENT = `
uniform sampler2D lakeEnvironment,frozenSurface;
varying vec3 lakeWorld;
const float IOR=1.333;
const vec3 ABOVE_WATER_COLOR=vec3(.25,1.,1.25);
vec2 shoreline(float a){return vec2(1.30+.075*sin(a*3.+.5)+.06*sin(a*7.),1.94+.14*sin(a+.5)+.10*sin(a*4.-.6));}
void main(){
 vec2 p=lakeWorld.xz;
 vec4 info=texture2D(frozenSurface,p/1150.);
 vec2 ba=info.rg*2.-1.;
 vec3 normal=vec3(ba.x,sqrt(max(.001,1.-dot(ba,ba))),ba.y);
 normal=normalize(normal);
 vec3 incoming=normalize(lakeWorld-cameraPosition);
 vec3 reflectedRay=reflect(incoming,normal);
 vec3 refractedRay=refract(incoming,normal,1./IOR);
 float fresnel=mix(.25,1.,pow(1.-clamp(dot(normal,-incoming),0.,1.),3.));
 float radius=length(p/vec2(5900.,6950.));
 float angle=atan(p.x/5900.,p.y/6950.);vec2 shore=shoreline(angle);
 float depth=70.+min(330.,max(0.,min(radius-shore.x,shore.y-radius))*2200.);
 vec2 bed=p+refractedRay.xz*(depth/max(.1,-refractedRay.y));
 vec4 floorInfo=texture2D(frozenSurface,bed/1150.);
 vec3 floorColor=mix(vec3(.24,.31,.28),vec3(.42,.45,.35),floorInfo.a);
 float focus=floorInfo.b*3.;
 vec3 transmitted=floorColor*(.72+focus*.53)*ABOVE_WATER_COLOR;
 transmitted*=exp(-vec3(.0013,.00070,.00038)*depth);
 transmitted+=vec3(.015,.065,.092)*(1.-exp(-depth*.002));
 float u=1.-abs(fract(atan(reflectedRay.x,reflectedRay.z)*.15915494)*2.-1.);
 float v=clamp((asin(clamp(reflectedRay.y,-1.,1.))+.16)/.88,0.,1.);
 vec3 reflected=texture2D(lakeEnvironment,vec2(u,v)).rgb;
 reflected=mix(reflected,vec3(.16,.43,.72),smoothstep(.58,.92,reflectedRay.y));
 // Normal-variance broadening prevents isolated subpixel sun flashes.
 float variance=dot(dFdx(normal),dFdx(normal))+dot(dFdy(normal),dFdy(normal));
 float exponent=min(5000.,1./max(.0002,variance*5.));
 float spec=pow(max(0.,dot(normalize(vec3(-.45,.88,-.65)),reflectedRay)),exponent);
 reflected+=vec3(10.,8.,6.)*spec*min(1.,exponent/5000.);
 vec3 result=mix(transmitted,reflected,fresnel);
 float haze=smoothstep(15000.,43000.,distance(cameraPosition,lakeWorld))*.25;
 result=mix(result,vec3(.35,.59,.73),haze);
 gl_FragColor=vec4(result,1.);
 #include <colorspace_fragment>
}`;
