// Fennec preview's lacquer model, adapted to the game's shared park reflection.
export const PEARL_FINISH = Object.freeze({
  roughness: .38, metalness: .73, shift: .015, reflection: 2.50,
  lightPower: 3.5, exposure: 1.07,
});
export const PEARL_COLORS = Object.freeze({
  blue: Object.freeze({ primary: 0x00bacb, pearl: 0x0039f7 }),
  orange: Object.freeze({ primary: 0xff9910, pearl: 0xff05b9 }),
});

export const PEARL_FRAGMENT = `
uniform sampler2D carPearlLighting;
vec3 pearlEnvironmentLevel(vec3 R,float level){
  vec2 uv=vec2(atan(R.z,R.x)*.159154943+.5,asin(clamp(R.y,-1.,1.))*.318309886+.5);
  vec2 size=vec2(256.,128.)*exp2(-level);
  vec2 pixel=clamp(uv*size,vec2(.5),size-.5)+vec2(0.,256.-256.*exp2(-level));
  vec4 encoded=texture2D(carPearlLighting,pixel/256.);
  return encoded.rgb*encoded.a*16.;
}
vec3 pearlEnvironment(vec3 R,float rough){
  float level=clamp(rough*8.-1.,0.,7.);
  return mix(pearlEnvironmentLevel(R,floor(level)),pearlEnvironmentLevel(R,min(7.,floor(level)+1.)),fract(level));
}
vec3 pearlFresnel(vec3 f0,float v){return f0+(1.-f0)*pow(1.-v,5.);}
float pearlDistribution(float nh,float r){
  float a=r*r,a2=a*a,d=nh*nh*(a2-1.)+1.;
  return a2/max(3.14159265359*d*d,.0000001);
}
float pearlVisibility(float nv,float nl,float r){
  float a=r*r,a2=a*a;
  float gv=nl*sqrt(nv*nv*(1.-a2)+a2),gl=nv*sqrt(nl*nl*(1.-a2)+a2);
  return .5/max(gv+gl,.0001);
}
vec2 pearlEnvironmentBRDF(float r,float nv){
  vec4 q=r*vec4(-1.,-.0275,-.572,.022)+vec4(1.,.0425,1.04,-.04);
  float a=min(q.x*q.x,exp2(-9.28*nv))*q.x+q.y;
  return vec2(-1.04,1.04)*a+q.zw;
}
vec3 shadePearlAccessory(vec3 base,vec3 N,vec3 V,float rough,float metal,float reflection){
  vec3 dx=dFdx(N),dy=dFdy(N);
  rough=max(.085,sqrt(rough*rough+min(.02,.045*(dot(dx,dx)+dot(dy,dy)))));
  float nv=max(dot(N,V),.001);
  vec3 f0=mix(vec3(.04),base,metal);
  vec3 L=normalize(vec3(-.45,.88,-.65)),H=normalize(L+V);
  float nl=max(dot(N,L),0.);
  vec3 F=pearlFresnel(f0,max(dot(V,H),0.));
  vec3 direct=((1.-F)*(1.-metal)*base/3.14159265359+pearlDistribution(max(dot(N,H),0.),rough)*pearlVisibility(nv,nl,rough)*F)*nl*vec3(1.,.95,.86)*3.5;
  L=normalize(vec3(.55,.34,-.9));H=normalize(L+V);nl=max(dot(N,L),0.);
  F=pearlFresnel(f0,max(dot(V,H),0.));
  vec3 fill=((1.-F)*(1.-metal)*base/3.14159265359+pearlDistribution(max(dot(N,H),0.),max(.28,rough))*pearlVisibility(nv,nl,max(.28,rough))*F)*nl*vec3(.28,.36,.48);
  vec3 irradiance=mix(vec3(.33,.24,.16),vec3(.55,.69,.95),clamp(N.y*.5+.5,0.,1.));
  vec2 ab=pearlEnvironmentBRDF(rough,nv);
  return direct+fill+base*(1.-metal)*irradiance+pearlEnvironment(reflect(-V,N),rough)*(f0*ab.x+ab.y)*2.5*reflection;
}
vec3 shadePearlPaint(vec3 face,vec3 pearl,vec3 N,vec3 V,vec3 environment){
  vec3 L=normalize(vec3(-.45,.88,-.65)),H=normalize(L+V);
  float nv=max(dot(N,V),.001),nl=max(dot(N,L),0.);
  float nh=max(dot(N,H),0.),vh=max(dot(V,H),0.);
  float weight=max(smoothstep(.60,.98,N.y),smoothstep(.26,.86,1.-max(dot(N,V),0.)+${PEARL_FINISH.shift})*.70);
  vec3 base=mix(face,pearl,weight);
  vec3 dx=dFdx(N),dy=dFdy(N);
  float variance=min(.02,.045*(dot(dx,dx)+dot(dy,dy)));
  float rough=sqrt(${PEARL_FINISH.roughness}*${PEARL_FINISH.roughness}+variance),metal=${PEARL_FINISH.metalness};
  vec3 f0=mix(vec3(.04),base,metal),F=pearlFresnel(f0,vh);
  vec3 spec=pearlDistribution(nh,rough)*pearlVisibility(nv,nl,rough)*F;
  vec3 diffuse=(1.-F)*(1.-metal)*base/3.14159265359;
  vec3 sunColor=vec3(1.,.95,.86)*${PEARL_FINISH.lightPower.toFixed(1)};
  vec3 direct=(diffuse+spec)*nl*sunColor;
  vec2 ab=pearlEnvironmentBRDF(rough,nv);
  vec3 R=reflect(-V,N);
  vec3 indirectSpec=pearlEnvironment(R,rough)*mix(base,f0*ab.x+ab.y,.20)*${PEARL_FINISH.reflection};
  float sky=clamp(N.y*.5+.5,0.,1.);
  vec3 irradiance=mix(vec3(.33,.24,.16),vec3(.55,.69,.95),sky);
  vec3 fillL=normalize(vec3(.55,.34,-.9)),fillH=normalize(fillL+V);
  float fillNL=max(dot(N,fillL),0.);
  vec3 fillF=pearlFresnel(f0,max(dot(V,fillH),0.));
  vec3 fill=((1.-fillF)*(1.-metal)*base/3.14159265359+pearlDistribution(max(dot(N,fillH),0.),rough)*pearlVisibility(nv,fillNL,rough)*fillF)*fillNL*vec3(.28,.36,.48);
  vec3 color=direct+fill+base*(1.-metal)*irradiance+indirectSpec;
  float fc=.04+.96*pow(1.-nv,5.),cr=max(.095,sqrt(.009+variance*2.));
  vec3 coatEnv=pearlEnvironment(R,cr);
  coatEnv=max(coatEnv-vec3(.70),vec3(0.))+min(coatEnv,vec3(.70))*.075;
  vec3 coatReflection=coatEnv*fc*${PEARL_FINISH.reflection}*.68;
  float cs=pearlDistribution(nh,cr)*pearlVisibility(nv,nl,cr)*(.04+.96*pow(1.-vh,5.));
  color=color*(1.-fc)+coatReflection+cs*nl*sunColor;
  color+=base*(.055+.12*nl);
  return color;
}
// The viewer's neutral highlight compression, applied locally before Three's
// existing linear-to-sRGB output conversion (no second fullscreen compositor).
vec3 pearlToneMap(vec3 color){
  color*=${PEARL_FINISH.exposure};
  float x=min(color.r,min(color.g,color.b));
  color-=x<.08?x-6.25*x*x:.04;
  float peak=max(color.r,max(color.g,color.b));
  if(peak<.76)return color;
  float newPeak=1.-.24*.24/(peak+.24-.76);
  color*=newPeak/peak;
  return mix(color,vec3(newPeak),1.-1./(.15*(peak-newPeak)+1.));
}
`;
