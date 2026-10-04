import { SphereGeometry, BufferGeometry, Mesh, ShaderMaterial, Color, Float32BufferAttribute } from '../vendor/three.js';
import { hl as mergeGeometries } from '../vendor/buffer-geometry-utils.js';

function refineNose(geometry) {
  // GLB attributes share interleaved buffers; read components, not the raw buffer.
  const attributes=Object.fromEntries(Object.entries(geometry.attributes).map(([name,a])=>{
    const data=[];
    for(let i=0;i<a.count;i++)for(let k=0;k<a.itemSize;k++)data.push(a.getComponent(i,k));
    return [name,{size:a.itemSize,data}];
  }));
  let indices=Array.from(geometry.index?.array ?? Array.from({length:geometry.attributes.position.count},(_,i)=>i));
  for(let pass=0;pass<2;pass++) {
    const next=[],edges=new Map(),p=attributes.position.data;
    const midpoint=(a,b)=>{
      const key=a<b?`${a}:${b}`:`${b}:${a}`;
      if(edges.has(key))return edges.get(key);
      const index=p.length/3;
      for(const {size,data} of Object.values(attributes))for(let k=0;k<size;k++)data.push((data[a*size+k]+data[b*size+k])*.5);
      edges.set(key,index);return index;
    };
    for(let i=0;i<indices.length;i+=3) {
      const [a,b,c]=indices.slice(i,i+3);
      const distance=(a,b)=>Math.hypot(p[a*3]-p[b*3],p[a*3+1]-p[b*3+1],p[a*3+2]-p[b*3+2]);
      if(Math.max(p[a*3],p[b*3],p[c*3])<45||Math.max(distance(a,b),distance(b,c),distance(c,a))<3){next.push(a,b,c);continue;}
      const ab=midpoint(a,b),bc=midpoint(b,c),ca=midpoint(c,a);
      next.push(a,ab,ca,ab,b,bc,ca,bc,c,ab,bc,ca);
    }
    indices=next;
  }
  for(const [name,{size,data}] of Object.entries(attributes))geometry.setAttribute(name,new Float32BufferAttribute(data,size));
  geometry.setIndex(indices);
}

// The normalized reference-car-v2 supplies the curved body, cabin and wheel rig.
export function addRoosterBody(body) {
  const parts = [];
  const colors = { ivory: 0xe6e4d8, feather: 0xb9c9cf, red: 0xbb2820, gold: 0xe6ac32, dark: 0x172126 };
  const painted = [];
  const noseSurface = (y,z) => 73 - 7*(z/39)**2 - 4*((y-5)/25)**2
    + 15*Math.exp(-((z/11)**2))*Math.exp(-(((y+1)/9)**2));
  // Deform the donor's actual panels and their trim together, preserving joins.
  for (const mesh of body.children) {
    if (!mesh.geometry) continue;
    const geometry = mesh.geometry;
    const isPaint = mesh.material?.uniforms?.uMaterial?.value === 4 || mesh.material?.name === 'paint';
    const isGlass = mesh.material?.uniforms?.uMaterial?.value === 5 || mesh.material?.name === 'glass';
    // Remove the donor's nose-mounted grille/lamp appliques before rebuilding it.
    if (!isPaint && !isGlass) {
      const p=geometry.attributes.position,source=geometry.index?.array ?? Array.from({length:p.count},(_,i)=>i),kept=[];
      for(let i=0;i<source.length;i+=3) {
        const ids=[source[i],source[i+1],source[i+2]];
        if(ids.reduce((sum,index)=>sum+p.getX(index),0)/3<55)kept.push(...ids);
      }
      geometry.setIndex(kept);
    }
    refineNose(geometry);
    const p = geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const front = Math.max(0, Math.min(1, (x - 20) / 48));
      const top = Math.max(0, Math.min(1, (y + 7) / 24));
      // Raise and broaden the hood into cheeks, then taper its middle to a beak.
      y += Math.sin(front * Math.PI * .82) * 8 * top;
      z *= 1 + front * .035;
      const beak = front ** 4 * Math.exp(-((z / 13) ** 2)) * Math.exp(-(((y - 3) / 15) ** 2));
      x += beak * 18;
      y -= beak * 3;
      if (p.getX(i) > 59) {
        const noseBlend=Math.min(1,(p.getX(i)-59)/8);
        x=x*(1-noseBlend)+(noseSurface(y,z)+(p.getX(i)-70)*.08)*noseBlend;
      }
      // The door skin itself swells into a swept wing with shallow feather ridges.
      const side = Math.max(0, Math.min(1, (Math.abs(z) - 23) / 12));
      const wing = Math.exp(-(((x + 7) / 29) ** 4)) * Math.exp(-(((y - 7) / 15) ** 4)) * side;
      z += Math.sign(z) * wing * (3.5 + 1.3 * Math.cos((y - x * .12) * .9));
      p.setXYZ(i, x, y, z);
    }
    p.needsUpdate = true; geometry.computeVertexNormals(); geometry.computeBoundingBox(); geometry.computeBoundingSphere();
    mesh.userData.roosterSculpted = true;
    if (isPaint) painted.push(mesh);
  }
  function finish(geometry, color) {
    geometry.computeVertexNormals();
    const c = new Color(color), values = new Float32Array(geometry.attributes.position.count * 3);
    for (let i = 0; i < values.length; i += 3) values.set([c.r, c.g, c.b], i);
    geometry.setAttribute('color', new Float32BufferAttribute(values, 3));
    geometry.deleteAttribute('uv');
    parts.push(geometry);
  }
  function oval(position, scale, color, angle = 0, pointed = false) {
    const geometry = new SphereGeometry(1, 24, 16);
    if (pointed) {
      const p = geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const taper = .25 + .75 * (1 - p.getX(i)) / 2;
        p.setXYZ(i, p.getX(i), p.getY(i) * taper, p.getZ(i) * taper);
      }
    }
    geometry.scale(...scale); geometry.rotateZ(angle); geometry.translate(...position);
    finish(geometry, color);
  }
  // The eyes and nose share a surface profile; the eyes have under 1 UU relief.
  function noseX(y, z) {
    return noseSurface(y,z);
  }
  function cheekPatch(side, cx, cy, rx, ry, color, lift, angle = 0) {
    const positions = [], indices = [], rings = 5, segments = 40;
    for (let r = 0; r <= rings; r++) for (let j = 0; j <= segments; j++) {
      const a = j / segments * Math.PI * 2, u = Math.cos(a) * rx * r / rings, v = Math.sin(a) * ry * r / rings;
      const z = side * (cx + u * Math.cos(angle) - v * Math.sin(angle)), y = cy + u * Math.sin(angle) + v * Math.cos(angle);
      positions.push(noseX(y,z)+lift, y, z);
      if (r < rings && j < segments) {
        const k = r * (segments + 1) + j, next = k + segments + 1;
        const triangles = [k, k + 1, next, k + 1, next + 1, next];
        indices.push(...(side > 0 ? triangles : triangles.reverse()));
      }
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3)); geometry.setIndex(indices);
    finish(geometry, color);
  }
  for (const side of [-1, 1]) {
    cheekPatch(side, 23, 7, 8.5, 7.5, colors.dark, .35, -.10);
    cheekPatch(side, 23, 7.2, 7.3, 6.4, 0xf5f1db, .50, -.10);
    cheekPatch(side, 21.5, 7, 5.5, 5.8, colors.gold, .65);
    cheekPatch(side, 21, 7.2, 3.8, 4.8, 0x080d10, .80);
    cheekPatch(side, 22.5, 10, 1.8, 2.1, 0xffffff, .95);
    cheekPatch(side, 19.5, 5, .7, .8, 0xffffff, .95);
    for (let i = 0; i < 3; i++) {
      oval([-57 - i * 3, 32 + i * 4, side * (8 + i * 6)],
        [23, 7, 3], i === 1 ? 0xb56645 : colors.ivory, Math.PI - .30 - i * .12, true);
    }
  }
  for (let i = 0; i < 4; i++) {
    oval([61 - i * 7, 25 + i * 1.3, 0], [5, 9 + i, 3], colors.red, -.4);
  }
  const geometry = mergeGeometries(parts);
  parts.forEach(part => part.dispose());
  geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  const material = new ShaderMaterial({
    name: 'Rooster X / satin feather armor', vertexColors: true, toneMapped: false,
    vertexShader: `
      #include <common>
      varying vec3 roosterNormal,roosterColor;
      void main(){
        roosterNormal=inverseTransformDirection(normalMatrix*normal,viewMatrix);
        roosterColor=color;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
      }`,
    fragmentShader: `
      varying vec3 roosterNormal,roosterColor;
      void main(){
        vec3 n=normalize(roosterNormal);
        float sun=max(dot(n,normalize(vec3(-.45,.88,-.65))),0.);
        vec3 light=mix(vec3(.36,.42,.49),vec3(.72,.78,.83),n.y*.5+.5)+sun*.38;
        gl_FragColor=vec4(roosterColor*light,.5);
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new Mesh(geometry, material);
  for (const panel of painted) {
    const p=panel.geometry.attributes.position, data=new Float32Array(p.count*3);
    for(let i=0;i<p.count;i++) {
      const x=p.getX(i),z=p.getZ(i);
      const c=new Color(x>77&&Math.abs(z)<14?colors.gold:x>25?colors.ivory:0x914336);
      data.set([c.r,c.g,c.b],i*3);
    }
    panel.geometry.setAttribute('color',new Float32BufferAttribute(data,3));
    panel.material=material;
  }
  mesh.name = 'Rooster X / beak, eyes, comb, wings and tail';
  mesh.castShadow = mesh.receiveShadow = true;
  body.add(mesh);
  return mesh;
}
