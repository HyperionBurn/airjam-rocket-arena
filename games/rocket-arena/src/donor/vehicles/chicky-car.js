import { BufferGeometry, Float32BufferAttribute, Mesh, ShaderMaterial, Color, Vector3 } from '../vendor/three.js';
import { hl as mergeGeometries } from '../vendor/buffer-geometry-utils.js';

// Rebuilt body topology follows the six-view Chicky sheet. The donor supplies
// only the running gear: there is no stock car or separate head under this shell.
export function buildChickyBody(body) {
  for(const child of [...body.children]) {body.remove(child);child.geometry?.dispose();}
  const parts=[];
  const gold=0xf3bb32,lightGold=0xffd554,darkGold=0xcb8b1a,glass=0x162a3a,trim=0x25313a;
  // x, half-width, top height. +X points forward, all dimensions are game units.
  const stations=[[-72,0,12],[-66,27,24],[-53,35,29],[-35,36,34],[-20,32,44],[-4,30,48],[13,30,43],[29,33,32],[45,36,30],[61,34,29],[73,25,23],[82,13,15],[88,0,5]];
  function profile(x,column) {
    let i=0;while(i<stations.length-2&&x>stations[i+1][0])i++;
    const a=stations[i],b=stations[i+1],t=Math.max(0,Math.min(1,(x-a[0])/(b[0]-a[0])));
    const prev=stations[Math.max(0,i-1)],next=stations[Math.min(stations.length-1,i+2)];
    const m0=(b[column]-prev[column])/(b[0]-prev[0])*(b[0]-a[0]);
    const m1=(next[column]-a[column])/(next[0]-a[0])*(b[0]-a[0]);
    return (2*t**3-3*t*t+1)*a[column]+(t**3-2*t*t+t)*m0+(-2*t**3+3*t*t)*b[column]+(t**3-t*t)*m1;
  }
  function surface(x,angle,offset=0) {
    const c=Math.cos(angle),s=Math.sin(angle),width=Math.max(0,profile(x,1));
    return [x,7+(c>=0?profile(x,2)-7:15)*c+offset*c,width*s+offset*s];
  }
  function geometry(positions,indices,colors) {
    const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(positions,3));
    g.setAttribute('color',new Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();parts.push(g);return g;
  }
  const rgb=hex=>new Color(hex).toArray();
  const positions=[],indices=[],colors=[],nx=112,nt=72;
  for(let i=0;i<=nx;i++)for(let j=0;j<=nt;j++) {
    const x=-72+160*i/nx,a=-Math.PI+2*Math.PI*j/nt,p=surface(x,a);
    positions.push(...p);
    const beak=x>75&&Math.abs(p[2])<12;
    colors.push(...rgb(beak?darkGold:p[1]<-5?trim:gold));
    if(i===nx||j===nt)continue;
    const k=i*(nt+1)+j;
    for(const tri of [[k,k+nt+1,k+1],[k+1,k+nt+1,k+nt+2]]) {
      // Wheel openings are cut out of the body rather than hidden by overlays.
      const xx=-72+160*(i+.5)/nx,aa=-Math.PI+2*Math.PI*(j+.5)/nt,pp=surface(xx,aa);
      const wheelHole=Math.abs(pp[2])>22&&[42,-36].some(wx=>(xx-wx)**2+(pp[1]+5)**2<20.5**2);
      if(!wheelHole)indices.push(...tri.reverse());
    }
  }
  geometry(positions,indices,colors);
  function windowPanel(x0,x1,a0,a1) {
    const p=[],ix=[],c=[],rows=20,cols=18;
    for(let i=0;i<=rows;i++)for(let j=0;j<=cols;j++) {
      const u=i/rows,v=j/cols,x=x0+(x1-x0)*u,a=a0+(a1-a0)*v;
      p.push(...surface(x,a,.28));c.push(...rgb(i===0||j===0||i===rows||j===cols?trim:glass));
      if(i<rows&&j<cols){const k=i*(cols+1)+j;ix.push(k,k+1,k+cols+1,k+1,k+cols+2,k+cols+1);}
    }
    geometry(p,ix,c);
  }
  windowPanel(13,29,-.66,.66);
  windowPanel(-35,-23,-.62,.62);
  windowPanel(-23,12,.65,1.14);windowPanel(-23,12,-1.14,-.65);
  function patch(cx,ca,rx,ra,color,offset) {
    const p=[],ix=[],c=[],rings=6,segments=48;
    for(let i=0;i<=rings;i++)for(let j=0;j<=segments;j++) {
      const a=j/segments*Math.PI*2,r=i/rings;
      p.push(...surface(cx+Math.cos(a)*rx*r,ca+Math.sin(a)*ra*r,offset));c.push(...rgb(color));
      if(i<rings&&j<segments){const k=i*(segments+1)+j;ix.push(k,k+1,k+segments+1,k+1,k+segments+2,k+segments+1);}
    }
    geometry(p,ix,c);
  }
  // Eyes are curved inlays in the front quarter panels, below a molded brow.
  for(const side of [-1,1]) {
    patch(68,side*.87,11,.49,trim,.18);
    patch(68,side*.87,9.8,.44,0x41bdff,.35);
    patch(68.5,side*.87,8,.36,0x086cbe,.49);
    patch(69,side*.87,6.2,.30,0x071824,.63);
    patch(66.5,side*.72,2.3,.10,0xf7fcff,.78);
    patch(71,side*.98,1,.045,0xbcefff,.80);
    patch(80,side*.38,1.4,.09,0x71521b,.2);
    patch(-65,side*.8,3,.22,trim,.2);
    patch(-65,side*.8,2.3,.16,0xc53929,.4);
    for(const wheelX of [42,-36]) {
      const p=[],ix=[],c=[],segments=56;
      for(let i=0;i<=segments;i++)for(let j=0;j<=4;j++) {
        const a=.05*Math.PI+.9*Math.PI*i/segments,r=20.4+j*1.5;
        p.push(wheelX+Math.cos(a)*r,-5+Math.sin(a)*r,side*(36.5+Math.sin(j/4*Math.PI)*3.5));
        c.push(...rgb(j===0?darkGold:gold));
        if(i<segments&&j<4){const k=i*5+j,tri=[k,k+1,k+5,k+1,k+6,k+5];ix.push(...(side<0?tri.reverse():tri));}
      }
      geometry(p,ix,c);
    }
  }
  // Lens-shaped solid feather panels with a central raised rib.
  function feather(start,end,width,thickness,color,normal) {
    const a=new Vector3(...start),b=new Vector3(...end),axis=b.clone().sub(a).normalize();
    const n=new Vector3(...normal).normalize(),across=new Vector3().crossVectors(axis,n).normalize();
    const p=[],ix=[],c=[],lengths=18,crosses=12;
    for(let side=0;side<2;side++)for(let i=0;i<=lengths;i++)for(let j=0;j<=crosses;j++) {
      const t=i/lengths,u=j/crosses*2-1;
      const envelope=Math.sin(Math.PI*t)**.8*(1-.35*t);
      const center=a.clone().lerp(b,t);
      center.addScaledVector(across,u*width*envelope);
      center.addScaledVector(n,(side===0?1:-.4)*thickness*envelope*(1-u*u));
      p.push(...center.toArray());c.push(...rgb(color));
      if(i<lengths&&j<crosses){const k=side*(lengths+1)*(crosses+1)+i*(crosses+1)+j;const tri=[k,k+1,k+crosses+1,k+1,k+crosses+2,k+crosses+1];ix.push(...(side===0?tri:tri.reverse()));}
    }
    geometry(p,ix,c);
  }
  for(const side of [-1,1]) {
    // Swept wing panel layers replace the donor door and rear shoulder design.
    for(let i=0;i<3;i++)feather([20-i*6,8+i*5,side*(31+i)],[-29-i*9,16+i*6,side*(35+i)],7,2.2,i===1?lightGold:gold,[0,.2,side]);
    feather([82,0,side*9],[65,4,side*28],4,1.5,lightGold,[1,.2,side]);
    feather([57,28,side*14],[74,24,side*20],3,1.7,lightGold,[.1,1,side*.3]);
    feather([-54,24,side*5],[-69,43,side*20],7,2.5,gold,[-1,.2,side*.3]);
    feather([-48,27,side*16],[-68,36,side*29],6,2,gold,[-.5,.7,side]);
  }
  // Crest grows out of the roof seam; its base is buried in the shell.
  feather([16,42,0],[-10,64,0],8,3,lightGold,[0,0,1]);
  feather([7,46,0],[-18,70,0],6,2.7,0xf29d25,[0,0,1]);
  for(const side of [-1,1])feather([15,41,side*3],[-8,56,side*9],5,2,lightGold,[0,.4,side]);
  // Rear spoiler and its struts are integrated with the feather silhouette.
  for(const side of [-1,1]) {
    feather([-49,25,side*23],[-55,48,side*23],2.3,2.3,trim,[0,0,side]);
    feather([-55,46,side*30],[-65,59,side*35],4,1.8,lightGold,[0,0,side]);
  }
  feather([-55,47,-36],[-55,47,36],6,2,gold,[0,1,0]);
  for(let i=-2;i<=2;i++)feather([-69,11,i*2],[-69,35-Math.abs(i)*4,i*9],6,2,Math.abs(i)%2?lightGold:gold,[-1,0,0]);
  for(const side of [-1,1]) {
    const p=[],ix=[],c=[],segments=24;
    for(let ring=0;ring<4;ring++)for(let i=0;i<=segments;i++) {
      const a=i/segments*Math.PI*2,r=ring<2?4:2.9,x=ring===0||ring===3?-68:-74;
      p.push(x,Math.cos(a)*r,side*17+Math.sin(a)*r);c.push(...rgb(ring<2?trim:0x080d12));
      if(ring<3&&i<segments){const k=ring*(segments+1)+i;ix.push(k,k+1,k+segments+1,k+1,k+segments+2,k+segments+1);}
    }
    geometry(p,ix,c);
  }
  const g=mergeGeometries(parts);parts.forEach(p=>p.dispose());g.computeBoundingBox();g.computeBoundingSphere();
  const material=new ShaderMaterial({name:'Chicky / sculpted body',vertexColors:true,toneMapped:false,
    vertexShader:`#include <common>
      varying vec3 nWorld,pigment;
      void main(){nWorld=inverseTransformDirection(normalMatrix*normal,viewMatrix);pigment=color;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec3 nWorld,pigment;
      void main(){vec3 n=normalize(nWorld);float sun=max(0.,dot(n,normalize(vec3(-.45,.88,-.65))));vec3 light=mix(vec3(.36,.42,.49),vec3(.72,.78,.83),n.y*.5+.5)+sun*.38;gl_FragColor=vec4(pigment*light,.5);
      #include <colorspace_fragment>
      }`});
  const mesh=new Mesh(g,material);mesh.name='Chicky / rebuilt body';mesh.castShadow=mesh.receiveShadow=true;mesh.userData.chickyBody=true;body.add(mesh);
  return mesh;
}
