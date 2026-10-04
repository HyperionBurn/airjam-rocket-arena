// Generated from references/boost-pads/boost-pads.html by tools/import-reference-boost-pads.mjs.
// Original authored profiles, energy, orb and alloy shaders; no additional engine.
  const TAU = Math.PI * 2;
  const vec = {
    sub:(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],
    cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],
    dot:(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],
    norm:a=>{const l=Math.hypot(...a)||1;return a.map(x=>x/l);}
  };

  class Geometry {
    constructor(){this.data=[];}
    vertex(p,n=[0,1,0],uv=[0,0],c=[1,1,1],kind=0){this.data.push(...p,...n,...uv,...c,kind);}
    tri(a,b,c,normal,color=[1,1,1],kind=0,uvs=[[0,0],[1,0],[1,1]]){
      const n=normal||vec.norm(vec.cross(vec.sub(b,a),vec.sub(c,a)));
      this.vertex(a,n,uvs[0],color,kind);this.vertex(b,n,uvs[1],color,kind);this.vertex(c,n,uvs[2],color,kind);
    }
    quad(a,b,c,d,n,color=[1,1,1],kind=0,uvs=[[0,0],[1,0],[1,1],[0,1]]){
      this.tri(a,b,c,n,color,kind,[uvs[0],uvs[1],uvs[2]]);this.tri(a,c,d,n,color,kind,[uvs[0],uvs[2],uvs[3]]);
    }
    /** Lathed profile, [radius,height]. Smooth along the circumference, hard profile edges. */
    lathe(profile,color,kind=0,segments=72,start=0,span=TAU,smooth=false){
      for(let j=0;j<profile.length-1;j++){
        const [r0,y0]=profile[j],[r1,y1]=profile[j+1];
        const dr=r1-r0,dy=y1-y0,len=Math.hypot(dr,dy)||1;
        for(let i=0;i<segments;i++){
          const a=start+i/segments*span,b=start+(i+1)/segments*span;
          const p0=[r0*Math.cos(a),y0,r0*Math.sin(a)], p1=[r0*Math.cos(b),y0,r0*Math.sin(b)];
          const p2=[r1*Math.cos(b),y1,r1*Math.sin(b)], p3=[r1*Math.cos(a),y1,r1*Math.sin(a)];
          const n0=[dy/len*Math.cos(a),-dr/len,dy/len*Math.sin(a)],n1=[dy/len*Math.cos(b),-dr/len,dy/len*Math.sin(b)];
          let na=n0,nb=n1,nc=n1,nd=n0;
          if(smooth){
            const pn=(j,angle)=>{const prev=profile[Math.max(0,j-1)],next=profile[Math.min(profile.length-1,j+1)],dy=next[1]-prev[1],dr=next[0]-prev[0],l=Math.hypot(dr,dy)||1;return [dy/l*Math.cos(angle),-dr/l,dy/l*Math.sin(angle)];};
            na=pn(j,a);nb=pn(j,b);nc=pn(j+1,b);nd=pn(j+1,a);
          }
          for(const [p,n,u,v] of [[p0,na,i/segments,0],[p1,nb,(i+1)/segments,0],[p2,nc,(i+1)/segments,1],[p0,na,i/segments,0],[p2,nc,(i+1)/segments,1],[p3,nd,i/segments,1]])this.vertex(p,n,[u,v],color,kind);
        }
      }
      return this;
    }
    ring(r0,r1,y,color,kind=0,segments=72,start=0,span=TAU){
      for(let i=0;i<segments;i++){
        const a=start+i/segments*span,b=start+(i+1)/segments*span;
        this.quad([r0*Math.cos(a),y,r0*Math.sin(a)],[r0*Math.cos(b),y,r0*Math.sin(b)],[r1*Math.cos(b),y,r1*Math.sin(b)],[r1*Math.cos(a),y,r1*Math.sin(a)],[0,1,0],color,kind,[[i/segments,0],[(i+1)/segments,0],[(i+1)/segments,1],[i/segments,1]]);
      } return this;
    }
    sphere(radius,cy,color=[1,1,1],kind=0,w=56,h=32){
      const point=(u,v)=>{const phi=u*TAU,t=v*Math.PI;const n=[Math.sin(t)*Math.cos(phi),Math.cos(t),Math.sin(t)*Math.sin(phi)];return {p:[n[0]*radius,cy+n[1]*radius,n[2]*radius],n,uv:[u,v]};};
      for(let j=0;j<h;j++)for(let i=0;i<w;i++){
        const a=point(i/w,j/h),b=point((i+1)/w,j/h),c=point((i+1)/w,(j+1)/h),d=point(i/w,(j+1)/h);
        for(const q of [a,b,c,a,c,d])this.vertex(q.p,q.n,q.uv,color,kind);
      }return this;
    }
    sheet(radius,y,height,start,span,segments=24,kind=0,seed=0){
      for(let i=0;i<segments;i++){
        const a=start+i/segments*span,b=start+(i+1)/segments*span;
        this.quad([radius*Math.cos(a),y,radius*Math.sin(a)],[radius*Math.cos(b),y,radius*Math.sin(b)],[(radius+.018)*Math.cos(b),y+height,(radius+.018)*Math.sin(b)],[(radius+.018)*Math.cos(a),y+height,(radius+.018)*Math.sin(a)],null,[seed,0,0],kind,[[i/segments,0],[(i+1)/segments,0],[(i+1)/segments,1],[i/segments,1]]);
      }return this;
    }
  }

  const VERTEX=`#version 300 es
  precision highp float;
  layout(location=0) in vec3 aPosition;
  layout(location=1) in vec3 aNormal;
  layout(location=2) in vec2 aUv;
  layout(location=3) in vec3 aColor;
  layout(location=4) in float aKind;
  uniform mat4 uModel,uVP;
  out vec3 vWorld,vNormal,vLocal,vColor;
  out vec2 vUv;
  flat out int vKind;
  void main(){
    vec4 world=uModel*vec4(aPosition,1.);
    vWorld=world.xyz;vLocal=aPosition;vNormal=normalize(mat3(uModel)*aNormal);
    vUv=aUv;vColor=aColor;vKind=int(aKind+.5);
    gl_Position=uVP*world;
  }`;
  const COMMON=`
  precision highp float;
  precision highp sampler3D;
  in vec3 vWorld,vNormal,vLocal,vColor;
  in vec2 vUv;
  flat in int vKind;
  uniform vec3 uCamera;
  uniform mat4 uModel;
  uniform float uTime,uGlow,uWarm,uStudio;
  uniform sampler3D uNoise;
  out vec4 fragColor;
  float noise3(vec3 p){return texture(uNoise,(p+.5)/32.).r;}
  float fbm(vec3 p){return noise3(p)*.57+noise3(p*2.04+7.3)*.28+noise3(p*4.1+15.9)*.15;}
  vec3 displayColor(vec3 c){return pow(max(c,vec3(0.)),vec3(.454545));}
  vec3 environment(vec3 r){
    vec3 horizon=mix(vec3(.037,.045,.065),vec3(.13,.085,.032),uWarm*.4);
    vec3 sky=mix(vec3(.56,.65,.85),vec3(.73,.68,.59),uWarm*.55);
    vec3 env=mix(horizon,sky,smoothstep(-.03,.7,r.y));
    env=mix(vec3(.014,.023,.028),env,smoothstep(-.8,.12,r.y));
    float broad=pow(max(dot(r,normalize(vec3(-.35,.8,.48))),0.),14.);
    float strip=exp(-pow((r.y-.70)*15.,2.))*.35;
    return env+vec3(.86,.92,1.)*(broad*.72+strip);
  }
  `;
  const METAL=`#version 300 es
  ${COMMON}
  uniform float uWire;
  void main(){
    if(uWire>.5){fragColor=vec4(.65,.72,.80,1.);return;}
    vec3 n=normalize(vNormal),v=normalize(uCamera-vWorld);
    vec3 l=normalize(vec3(-.45,.86,.40)),h=normalize(v+l);
    float ndl=max(dot(n,l),0.),ndv=max(dot(n,v),0.);
    float fres=pow(1.-ndv,5.);
    float metal=vKind==2?.18:(vKind==1?.55:.73);
    vec3 base=vColor;
    vec3 hemi=mix(vec3(.095,.10,.13),vec3(.72,.79,1.),n.y*.5+.5);
    vec3 diffuse=base*(hemi*.50+vec3(.84,.88,.99)*ndl*.52);
    vec3 refl=environment(reflect(-v,n));
    vec3 f0=mix(vec3(.045),base,metal);
    vec3 col=diffuse*(1.-metal*.42)+refl*(f0+(1.-f0)*fres)*.69;
    float shininess=vKind==2?22.:(vKind==1?48.:85.);
    col+=pow(max(dot(n,h),0.),shininess)*mix(vec3(.22),vec3(.72,.79,.92),metal)*.55;
    // Analytic warm bounce at the center and underneath the three emitters.
    float bounce=exp(-dot(vLocal.xz,vLocal.xz)*1.9)*max(n.y,0.);
    col+=vec3(.08,.029,.001)*bounce*uGlow;
    if(vKind==1)col*=.65;
    if(vKind==2)col=base*(.55+ndl*.70)+vec3(.004)*pow(max(dot(n,h),0.),28.);
    if(vKind==4){col=vColor*(.72+ndl*.65);col.b*=mix(1.35,1.,smoothstep(-2.,3.,vWorld.x));col*=mix(.50,1.,vUv.y);}
    fragColor=vec4(displayColor(col),1.);
  }`;
  const ENERGY=`#version 300 es
  ${COMMON}
  uniform float uFull;
  void main(){
    vec3 color;float alpha;
    if(vKind==1){
      float r=length(vLocal.xz),radius=mix(.385,.82,uFull);
      float edge=exp(-abs(r-radius)*105.);
      float hot=exp(-pow(r/radius,2.)*1.8);
      float body=(1.-smoothstep(radius-.035,radius+.018,r))*.55;
      float haze=exp(-r*r*3.5)*.14;
      float cloud=fbm(vec3(vLocal.xz*13.,uTime*.34));
      alpha=(hot*.70+body+edge*.94+haze)*uGlow;
      color=mix(vec3(1.,.34,.001),vec3(1.,.77,.028),hot*.6+edge*.33);
      color*=.82+cloud*.21;
    }else if(vKind==2){
      float edge=exp(-abs(vUv.y-.65)*6.);
      color=mix(vec3(.95,.25,.001),vec3(1.,.62,.008),edge);
      alpha=(.68+edge*.34)*smoothstep(0.,.055,vUv.x)*smoothstep(0.,.055,1.-vUv.x)*uGlow;
    }else{
      float seed=vColor.r,y=vUv.y;
      vec3 p=vec3(vUv.x*7.5+seed,y*6.5-uTime*.53,seed+uTime*.085);
      float n=fbm(p),fine=noise3(p*2.5+vec3(n));
      float cloud=smoothstep(.25,.78,n*.78+fine*.22);
      float base=exp(-y*12.0);
      float veil=pow(1.-y,1.05)*(.11+cloud*.29);
      float plume=smoothstep(.35,.73,n)*pow(1.-y,.82)*.22;
      alpha=(veil+plume+base*.32)*smoothstep(0.,.025,vUv.x)*smoothstep(0.,.025,1.-vUv.x)*(1.-smoothstep(.84,1.,y))*uGlow;
      if(vKind==3)alpha*=.80;
      color=mix(vec3(1.,.36,.002),vec3(1.,.70,.010),clamp(base+cloud*.25,0.,1.));
    }
    fragColor=vec4(color,clamp(alpha,0.,1.));
  }`;
  const ORB=`#version 300 es
  ${COMMON}
  uniform float uWire;
  void main(){
    if(uWire>.5){fragColor=vec4(.98,.65,.11,1.);return;}
    vec3 n=normalize(vNormal),v=normalize(uCamera-vWorld);
    vec3 p=(vLocal-vec3(0.,2.34,0.))/.575;
    float t=uTime*.14;
    vec3 r=reflect(-v,n);
    vec3 refl=environment(r);
    float f=pow(1.-max(dot(n,v),0.),3.);
    float crown=smoothstep(.48,.97,p.y);
    vec3 shell=vec3(.011,.006,.002);
    shell+=refl*mix(vec3(.14,.085,.018),vec3(.64,.61,.54),crown)*(.32+f*.35);
    float cap=pow(max(dot(r,normalize(vec3(-.24,.96,.19))),0.),8.);
    shell+=vec3(.88,.84,.73)*cap*.75;
    // Three fixed interior samples, not a full-screen volumetric pass.
    // Looking through different chords of the sphere reveals different inner flame.
    vec3 ray=-normalize(transpose(mat3(uModel))*v);
    float chord=max(.0,-2.*dot(p,ray));
    float fire=0.;
    for(int i=0;i<3;i++){
      vec3 q=p+ray*chord*(float(i)+.65)/3.6;
      float broad=noise3(q*8.2+vec3(0.,-t,0.));
      float detail=noise3(q*24.+vec3(broad*2.,-t*3.,1.));
      float wisps=smoothstep(.34,.69,broad*.74+detail*.26);
      float rise=1.-smoothstep(-.55,.65,q.y+(broad-.48)*1.15);
      float interior=1.-smoothstep(.52,1.,length(q));
      fire+=wisps*rise*interior*.80;
    }
    float hot=1.-smoothstep(-.94,-.10,p.y);
    float edge=pow(1.-max(dot(n,v),0.),2.8)*(1.-smoothstep(-.55,.35,p.y));
    vec3 lava=vec3(1.,.30,.002)*fire*1.7+vec3(1.,.83,.017)*hot*1.25+vec3(.80,.40,.003)*edge*.22;
    vec3 col=shell+lava*uGlow;
    // A restrained white reflection at the crown; the lower half stays yellow.
    col=col/(1.+col*.22);
    fragColor=vec4(displayColor(col),1.);
  }`;
  const GLOW_VERTEX=`#version 300 es
  precision highp float;
  layout(location=0) in vec3 aPosition;
  layout(location=1) in vec3 aNormal;
  layout(location=2) in vec2 aUv;
  layout(location=3) in vec3 aColor;
  layout(location=4) in float aKind;
  uniform mat4 uModel,uVP;
  uniform vec3 uRight,uUp;
  out vec2 vUv;out vec3 vColor;
  flat out int vKind;
  void main(){
    float s=length(uModel[0].xyz);
    vec3 world=(uModel*vec4(aNormal,1.)).xyz+(uRight*aPosition.x+uUp*aPosition.y)*s;
    vUv=aUv;vColor=aColor;vKind=int(aKind+.5);gl_Position=uVP*vec4(world,1.);
  }`;
  const GLOW=`#version 300 es
  precision highp float;
  in vec2 vUv;in vec3 vColor;flat in int vKind;
  uniform float uGlow;
  out vec4 fragColor;
  void main(){
    vec2 q=vUv*2.-1.;float r=dot(q,q);
    float a=exp(-r*5.2)*(1.-smoothstep(.6,1.,r));
    if(vKind==1)a=exp(-r*3.8)*smoothstep(.49,.59,sqrt(r))*(1.-smoothstep(.7,1.,r))*2.1;
    if(vKind==2)a=exp(-r*4.7)*(1.-smoothstep(.6,1.,r))*.85;
    fragColor=vec4(vColor,a*uGlow*.72);
  }`;

  const SILVER=[.53,.61,.79],DARK=[.047,.055,.105],RUBBER=[.007,.010,.018];
  function outline(){
    const points=[];
    const degrees=[-60,-43,-28,-21,0,21,28,43],radii=[1.26,1.32,1.67,1.78,1.80,1.78,1.67,1.32];
    for(let k=0;k<3;k++)for(let j=0;j<degrees.length;j++){
      const a=-Math.PI/2+k*TAU/3+degrees[j]*Math.PI/180;points.push([radii[j]*Math.cos(a),radii[j]*Math.sin(a)]);
    }return points;
  }
  function plate(geo,points){
    for(let i=0;i<points.length;i++){
      const p=points[i],q=points[(i+1)%points.length];
      geo.tri([0,.112,0],[q[0],.112,q[1]],[p[0],.112,p[1]],[0,1,0],SILVER,0);
      geo.quad([p[0],.112,p[1]],[q[0],.112,q[1]],[q[0]*1.005,.094,q[1]*1.005],[p[0]*1.005,.094,p[1]*1.005],null,[.31,.37,.54],0);
      geo.quad([p[0]*1.005,.094,p[1]*1.005],[q[0]*1.005,.094,q[1]*1.005],[q[0]*1.012,.036,q[1]*1.012],[p[0]*1.012,.036,p[1]*1.012],null,RUBBER,2);
      geo.tri([0,.035,0],[p[0]*1.012,.035,p[1]*1.012],[q[0]*1.012,.035,q[1]*1.012],[0,-1,0],RUBBER,2);
    }
  }
  function sprite(geo,center,rx,ry,color,kind=0){
    const corners=[[-rx,-ry,0],[rx,-ry,0],[rx,ry,0],[-rx,ry,0]],uv=[[0,0],[1,0],[1,1],[0,1]];
    for(const i of [0,1,2,0,2,3])geo.vertex(corners[i],center,uv[i],color,kind);
  }
  function createGeometry({full=false}={}){
    const body=new Geometry(),energy=new Geometry(),orb=new Geometry(),glow=new Geometry();
    plate(body,outline());
    // Continuous white alloy collar, a dark rubber gasket and a low domed hub.
    body.ring(0,1.078,.126,DARK,1);
    body.ring(1.025,1.146,.129,[.72,.81,1.0],0);
    body.lathe([[.955,.126],[.956,.159],[.936,.184],[.907,.205]],RUBBER,2,80);
    body.lathe([[.907,.205],[.895,.233],[.86,.253],[.68,.266],[.38,.268],[0,.268]],DARK,1,72,0,TAU,true);
    if(full)body.ring(.837,.863,.256,[.25,.21,.12],0);
    for(let k=0;k<3;k++){
      const a=-Math.PI/2+k*TAU/3;
      // Inlaid dark trapezoidal wings surrounded by uninterrupted silver metal.
      body.ring(1.155,1.685,.116,DARK,1,20,a-.42,.84);
      body.lathe([[1.365,.122],[1.365,.176],[1.42,.198],[1.714,.198],[1.76,.159],[1.76,.12]],RUBBER,2,20,a-.365,.73);
      body.ring(1.414,1.703,.201,[.068,.072,.094],1,20,a-.34,.68);
      energy.ring(1.50,1.708,.204,[1,0,0],2,20,a-.31,.62);
      energy.sheet(1.706,.207,full?.44:.53,a-.345,.69,20,0,k*12.7+1.);
      sprite(glow,[Math.cos(a)*1.61,.23,Math.sin(a)*1.61],.40,.25,[1.,.34,.006]);
    }
    energy.sheet(.855,.266,full?.61:1.12,0,TAU,80,3,11.3);
    energy.ring(0,.894,.272,[0,0,0],1,80);
    sprite(glow,[0,.34,0],1.05,.43,[1.,.35,.004]);
    if(full){
      orb.sphere(.575,2.34,[1,1,1],0,56,32);
      sprite(glow,[0,2.34,0],1.04,1.04,[1.,.36,.007],1);
      sprite(glow,[0,1.91,0],.85,.45,[1.,.54,.012],2);
      sprite(glow,[0,2.83,0],.62,.25,[.58,.54,.40],0);
    }
    return {body,energy,orb,glow};
  }


export { createGeometry, VERTEX, METAL, ENERGY, ORB, GLOW_VERTEX, GLOW };
