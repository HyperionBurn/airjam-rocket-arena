// Eight static flags, batched into one opaque draw. Cloth edges meet existing fence masts.
export function createParkFlags(T,texture) {
  // Four end flags, plus four sideline flags: fixed, lightly folded cloth, one draw.
  const positions=[],normals=[],uv=[],colors=[];
  for(const end of [-1,1])for(const [x,z,angle] of [[-1387,end*5320,0],[1387,end*5320,0],[-4218,end*3163,Math.PI/2],[4218,end*3163,Math.PI/2]]) {
    const clothColor=new T.Color(end<0?0x0868cb:0xe77608);
    const w=174,h=490,y=745,nx=16,ny=4;
    const point=(i,j)=>{
      const u=i/nx,v=j/ny,fold=Math.sin(u*Math.PI*3.0+.35)*11*Math.sin(u*Math.PI);
      const px=(u-.5)*w;return [x+px*Math.cos(angle)+fold*Math.sin(angle),y+(v-.5)*h-7*Math.sin(u*Math.PI),z-px*Math.sin(angle)+fold*Math.cos(angle)];
    };
    for(let j=0;j<ny;j++)for(let i=0;i<nx;i++)for(const [a,b] of [[i,j],[i+1,j],[i+1,j+1],[i,j],[i+1,j+1],[i,j+1]]){
      positions.push(...point(a,b));normals.push(Math.sin(angle),0,Math.cos(angle));
      const u=a/nx;uv.push((end<0?0:.5)+.008+u*.484,b/ny);
      const c=.90+.10*Math.cos(u*Math.PI*3+.35);colors.push(clothColor.r*c,clothColor.g*c,clothColor.b*c);
    }
  }
  const g=new T.BufferGeometry();
  for(const [key,data,size] of [['position',positions,3],['normal',normals,3],['uv',uv,2],['color',colors,3]])g.setAttribute(key,new T.Float32BufferAttribute(data,size));
  g.computeBoundingSphere();texture.colorSpace=T.SRGBColorSpace;
  const m=new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide,toneMapped:false});
  m.name='Park / plain team flags';
  const mesh=new T.Mesh(g,m);mesh.name='Park / eight plain folded flags';mesh.updateMatrix();mesh.matrixAutoUpdate=false;mesh.userData.visualOnly=true;return mesh;
}
