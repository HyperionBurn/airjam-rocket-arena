import { parkLandHeight, parkShore } from './park-landscape.js';
import { PARK_BANK_FRAGMENT } from '../materials/park-bank.js';
// Beckwith-inspired park art. All construction happens once, outside the frame loop.
// Vertex-lit opaque batches replace the old stadium; none of these meshes collide.
export const PARK_ART = Object.freeze({
  panorama: '/assets/arena/park/park-panorama.webp',
  pitch: '/assets/arena/park/park-pitch-clean.webp',
  detail: '/assets/arena/park/park-grass-detail.webp',
  bank: '/assets/arena/stadium/bank-metal.webp',
  trees: '/assets/arena/park/park-poplars.webp',
  horizon: '/assets/arena/park/park-horizon.webp',
  flags: '/assets/arena/park/park-team-flags.webp',
  city: '/assets/arena/park/park-city-atlas.webp',
  landShade: '/assets/arena/park/park-land-shade.webp',
  landscapeDetail: '/assets/arena/park/park-land-detail.webp',
  landscapeReflection: '/assets/arena/park/park-land-reflection.webp',
  frozenWater: '/assets/park-props/frozen-water.webp',
  sky: 0x2b8eee,
  horizonColor: 0xb7dce9,
});

// Boundary UVs are arc lengths in UU, not normalized 0..1 coordinates.
// At this scale a panel is about 240 UU across, rather than sub-pixel noise.
export const PARK_BANK_TILE_UU = 480;
export function mapParkBankUVs(geometry) {
  const positions = geometry.getAttribute('position');
  const uv = geometry.getAttribute('uv');
  // Keep perimeter distances; align both vent strips on field and goal curves.
  for (let i = 0; i < uv.count; i++) {
    const height = Math.max(0, Math.min(280, positions.getY(i)));
    uv.setY(i, Math.acos(1 - height / 280) / (Math.PI / 2));
  }
  uv.needsUpdate = true;
}
export function setParkBankQuality(material, preset) {
  if (!material?.userData?.parkBank) return;
  const detail = preset === 'high';
  if (!!material.defines?.PARK_BANK_DETAIL === detail) return;
  material.defines = detail ? { PARK_BANK_DETAIL: 1 } : {};
  material.needsUpdate = true;
}

export function createParkBankMaterial(T, texture, reflection = texture) {
  texture.wrapS = T.RepeatWrapping;
  texture.wrapT = T.ClampToEdgeWrapping;
  texture.repeat.set(1 / PARK_BANK_TILE_UU, 1);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 4;
  reflection.wrapS = T.MirroredRepeatWrapping;
  // Reflect the same mirrored park horizon as the visible backdrop.
  if (reflection !== texture) {
    reflection.wrapT = T.ClampToEdgeWrapping;
    reflection.colorSpace = T.SRGBColorSpace;
  } else texture.wrapS = T.RepeatWrapping;
  const material = new T.MeshBasicMaterial({ map: texture, toneMapped: false, precision: 'highp' });
  material.name = 'Park / satin silver, reflected daylight and soft amber lamps';
  material.userData.parkBank = true;
  material.onBeforeCompile = shader => {
    shader.uniforms.parkBankEnvironment = { value: reflection };
    shader.vertexShader = shader.vertexShader.replace('#include <common>',
      '#include <common>\nvarying vec3 parkBankWorldPosition;\nvarying vec3 parkBankWorldNormal;');
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
      #include <begin_vertex>
      parkBankWorldPosition = (modelMatrix * vec4(position,1.0)).xyz;
      parkBankWorldNormal = mat3(modelMatrix) * normal;
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>',
      '#include <common>\n' + PARK_BANK_FRAGMENT);
    // Repeat the unbranded right-hand panel, including its matching metal trim.
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
      #ifdef USE_MAP
        vec2 blankPanelUV=vec2(fract(vMapUv.x*2.)*.5+.5,vMapUv.y);
        diffuseColor*=texture2D(map,blankPanelUV);
      #endif
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>',
      '#include <color_fragment>\ndiffuseColor.rgb = shadeParkBank(diffuseColor.rgb, vMapUv, cameraPosition);');
  };
  material.customProgramCacheKey = () => 'park-bank-unbranded-silver-v4-' + !!material.defines?.PARK_BANK_DETAIL;
  return material;
}

function batch(T, name) {
  const positions = [], colors = [];
  const sun = new T.Vector3(-0.4, 0.85, 0.3).normalize();
  function add(geometry, color) {
    const raw = geometry.index ? geometry.toNonIndexed() : geometry;
    const p = raw.getAttribute('position'), n = raw.getAttribute('normal'), c = raw.getAttribute('color');
    const tint = new T.Color(color), normal = new T.Vector3();
    for (let i = 0; i < p.count; i++) {
      const light = 0.72 + 0.28 * Math.max(0, normal.fromBufferAttribute(n, i).dot(sun));
      positions.push(p.getX(i), p.getY(i), p.getZ(i));
      colors.push(tint.r * light * (c?.getX(i) ?? 1), tint.g * light * (c?.getY(i) ?? 1), tint.b * light * (c?.getZ(i) ?? 1));
    }
    if (raw !== geometry) raw.dispose();
    geometry.dispose();
  }
  function box(x, y, z, w, h, d, color, rotation = 0) {
    const geometry = new T.BoxGeometry(w, h, d);
    geometry.rotateY(rotation); geometry.translate(x, y, z); add(geometry, color);
  }
  function beam(a, b, radius, color) {
    const start = new T.Vector3(...a), end = new T.Vector3(...b);
    const direction = end.clone().sub(start);
    const geometry = new T.CylinderGeometry(radius, radius, direction.length(), 5, 1, true);
    geometry.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), direction.normalize()));
    geometry.translate(...start.add(end).multiplyScalar(0.5).toArray()); add(geometry, color);
  }
  function finish() {
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    geometry.computeBoundingSphere();
    const material = new T.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
    const mesh = new T.Mesh(geometry, material);
    mesh.name = name; mesh.matrixAutoUpdate = false;
    mesh.userData.parkStatic = true;
    mesh.userData.triangles = positions.length / 9;
    return mesh;
  }
  return { add, box, beam, finish };
}

function createBoostGlow(T, radius, billboard) {
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute([
    -radius,-radius,0,radius,-radius,0,-radius,radius,0,
    radius,-radius,0,radius,radius,0,-radius,radius,0,
  ],3));
  geometry.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,0,1,1,0,1,1,0,1],2));
  const material=new T.ShaderMaterial({
    uniforms:{time:{value:0},orb:{value:billboard?1:0}},
    vertexShader:`uniform float orb; varying vec2 vUv;
      void main(){vUv=uv;vec4 p;
        if(orb>.5){p=modelViewMatrix*vec4(0.,0.,0.,1.);p.xy+=position.xy;}
        else p=modelViewMatrix*vec4(position.x,0.,position.y,1.);
        gl_Position=projectionMatrix*p;
      }`,
    fragmentShader:`uniform float time,orb;varying vec2 vUv;
      void main(){float d=length(vUv*2.-1.);if(d>1.)discard;
        float halo=pow(1.-d,2.3);
        float ring=exp(-pow((d-.48)*28.,2.))*(1.-orb);
        float pulse=.92+.08*sin(time*2.4);
        vec3 color=mix(vec3(1.,.38,.025),vec3(1.,.87,.28),pow(1.-d,3.));
        gl_FragColor=vec4(color,(halo*.85+ring*.65)*pulse);
      }`,
    transparent:true,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,toneMapped:false,
  });
  const mesh=new T.Mesh(geometry,material);
  mesh.name=billboard?'Boost / orb halo':'Boost / pad glow';
  mesh.frustumCulled=false;
  return mesh;
}

// Children are cloned with the ready template; the empty template has no glow/orb.
export function updateParkBoostPad(pad,time,phase=0) {
  if(!pad.visible)return;
  for(const child of pad.children){
    if(child.name==='Boost / floating orb'){
      child.position.y=110+Math.sin(time*2+phase)*11;
      child.rotation.y=time*.65;
      for(const halo of child.children)halo.material.uniforms.time.value=time;
    }else if(child.name==='Boost / pad glow')child.material.uniforms.time.value=time;
  }
}

export function createParkBoostPad(T, big, active) {
  const b = batch(T, `Park boost / ${big ? '100' : '12'} / ${active ? 'ready' : 'empty'}`);
  const radius = big ? 82.5 : 45;
  let orbMesh=null;
  const layer = (top,bottom,h,y,color,segments=big?12:8) => {
    const g=new T.CylinderGeometry(top,bottom,h,segments,1);g.translate(0,y,0);b.add(g,color);
  };
  layer(radius*.88,radius,6,3,0x26333c,12);
  layer(radius*.85,radius*.91,3,7.5,0xe1e9ec,12);
  layer(radius*.66,radius*.72,3,10.5,0x415063);
  layer(radius*.58,radius*.60,4,14,0xdce8ef);
  layer(radius*.48,radius*.53,5,18,0x2b3542);
  layer(radius*.40,radius*.43,2,21,active?0xffb52a:0x5d5040);
  layer(radius*.25,radius*.32,1,22.5,active?0xffec7c:0x756047);
  // Three broad white wings and amber rectangular inserts match the pad photo.
  for(let k=0;k<3;k++) {
    const a=k*Math.PI*2/3, distance=radius*.70;
    const x=Math.sin(a)*distance,z=Math.cos(a)*distance;
    b.box(x,9,z,radius*.53,4,radius*.38,0xe6ebed,a);
    b.box(x,12,z,radius*.43,3,radius*.28,0x25333f,a);
    b.box(x,14,z,radius*.37,2,radius*.19,active?0xffc147:0x74654f,a);
  }
  if(big && active) {
    const orb=new T.SphereGeometry(34,12,8), p=orb.getAttribute('position'), colors=[];
    const gold = new T.Color(0xffd04a), dark = new T.Color(0xffaa23), white = new T.Color(0xfff1b6);
    for(let i=0;i<p.count;i++) {
      const y=p.getY(i)/34, x=p.getX(i)/34,z=p.getZ(i)/34;
      const c=gold.clone().lerp(dark,Math.max(0,y)*.66);
      const highlight=Math.pow(Math.max(0,-.55*x+.65*y+.5*z),18);
      c.lerp(white,highlight*.9); colors.push(c.r,c.g,c.b);
    }
    orb.setAttribute('color',new T.Float32BufferAttribute(colors,3));
    orbMesh=new T.Mesh(orb,new T.MeshBasicMaterial({vertexColors:true,toneMapped:false}));
    orbMesh.name='Boost / floating orb';orbMesh.position.y=110;
    orbMesh.add(createBoostGlow(T,80,true));
  }
  const mesh=b.finish(); mesh.matrixAutoUpdate=true;
  mesh.userData.pickupSizeUnchanged=true;
  if(active){const glow=createBoostGlow(T,radius*1.65,false);glow.position.y=25;mesh.add(glow);}
  if(orbMesh)mesh.add(orbMesh);
  return mesh;
}

export function createParkTrees(T, texture) {
  const positions=[],uv=[],colors=[],anchors=[],offsets=[],types=[];
  const tree=(x,z,height,seed,broad=false) => {
    const base=Math.max(-40,parkLandHeight(x,z));
    const slot=(seed%4)+(broad?4:0);
    const width=height*(broad?1.12:.24),u0=slot/8+.002,u1=(slot+1)/8-.002;
    for(const a of [0]) {
      const dx=Math.cos(a)*width/2,dz=Math.sin(a)*width/2;
      const points=[[x-dx,base,z-dz],[x+dx,base,z+dz],[x+dx,base+height,z+dz],[x-dx,base+height,z-dz]];
      const tex=[[u0,0],[u1,0],[u1,1],[u0,1]],offset=[[-width/2,0],[width/2,0],[width/2,height],[-width/2,height]];
      for(const k of [0,1,2,0,2,3]) {positions.push(...points[k]);uv.push(...tex[k]);anchors.push(x,base,z);offsets.push(...offset[k]);types.push(broad?1:0);const haze=Math.max(0,Math.min(.34,(Math.hypot(x,z)-8500)/70000));colors.push(1-haze*.40,1-haze*.10,1+haze*.16);}
    }
  };
  // Both quality levels keep a COMPLETE inner ring, not sixteen trees on one
  // side. Both rows and the sparse outer forest share one alpha-tested draw.
  const ring = (halfX,halfZ,radius,count,height,seed) => {
    const straightX=2*(halfX-radius), straightZ=2*(halfZ-radius);
    const quarter=Math.PI*radius/2;
    const lengths=[straightX,quarter,straightZ,quarter,straightX,quarter,straightZ,quarter];
    const perimeter=lengths.reduce((a,b)=>a+b,0);
    for(let i=0;i<count;i++) {
      let distance=(i+.25)*perimeter/count,part=0;
      while(distance>lengths[part]){distance-=lengths[part++];}
      let x,z,t=distance/lengths[part];
      if(part===0){x=-halfX+radius+t*straightX;z=-halfZ;}
      if(part===1){const a=-Math.PI/2+t*Math.PI/2;x=halfX-radius+radius*Math.cos(a);z=-halfZ+radius+radius*Math.sin(a);}
      if(part===2){x=halfX;z=-halfZ+radius+t*straightZ;}
      if(part===3){const a=t*Math.PI/2;x=halfX-radius+radius*Math.cos(a);z=halfZ-radius+radius*Math.sin(a);}
      if(part===4){x=halfX-radius-t*straightX;z=halfZ;}
      if(part===5){const a=Math.PI/2+t*Math.PI/2;x=-halfX+radius+radius*Math.cos(a);z=halfZ-radius+radius*Math.sin(a);}
      if(part===6){x=-halfX;z=halfZ-radius-t*straightZ;}
      if(part===7){const a=Math.PI+t*Math.PI/2;x=-halfX+radius+radius*Math.cos(a);z=-halfZ+radius+radius*Math.sin(a);}
      const jitter=Math.sin((i+seed)*12.9898)*63;
      tree(x+jitter,z+Math.cos(i*7.31)*58,height+(i*137%340),i+seed);
    }
  };
  ring(5100,6200,1450,96,1080,0);
  ring(6000,7180,1820,72,860,3);
  // A sparse forest carpet fills the empty apron, in this same static batch.
  // Inner rings are emitted first; all trees retain opaque depth writes.
  let seed=5,randomState=728193;
  const random=()=>{randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;return randomState/4294967296;};
  // Independent random angle/radius (not correlated golden-ratio coordinates).
  // Dense near-canopies, smaller distant forest patches and an empty water band.
  let potatoVertexCount = 0;
  for(let i=0;i<1200;i++) {
    if (i === 400) potatoVertexCount = positions.length / 3;
    const a=random()*Math.PI*2;
    const [inner,outer]=parkShore(a);
    const near=i<400;
    const r=near?1.07+random()*Math.max(.02,inner-1.12):outer+.11+random()*2.20;
    const x=Math.sin(a)*5900*r,z=Math.cos(a)*6950*r;
    // Leave bridge landings and the front of the glass waterfront district open.
    if((Math.abs(a-2.10)<.04||Math.abs(a-(Math.PI*2-.85))<.04)&&r<2.5)continue;
    if(x>1500&&x<22000&&z<-15400&&z>-26900&&random()<.62)continue;
    const height=near?480+random()*340:470+random()*510;
    tree(x,z,height,seed++,true);
  }
  const closeVertexCount=positions.length/3;
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  geometry.setAttribute('treeAnchor',new T.Float32BufferAttribute(anchors,3));
  geometry.setAttribute('treeOffset',new T.Float32BufferAttribute(offsets,2));
  geometry.setAttribute('treeType',new T.Float32BufferAttribute(types,1));
  geometry.computeBoundingSphere();
  texture.colorSpace=T.SRGBColorSpace;
  const material=new T.MeshBasicMaterial({map:texture,alphaTest:.45,side:T.DoubleSide,
    depthWrite:true,transparent:false,toneMapped:false,vertexColors:true,forceSinglePass:true,precision:'highp'});
  // Spectator/replay clearance only. Ground-level gameplay always sees the
  // complete forest; raised cameras do not shoot through nearby tree cards.
  material.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <common>',
      '#include <common>\nattribute vec3 treeAnchor;attribute vec2 treeOffset;attribute float treeType;\nvarying float parkTreeVisibility;');
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
      `#include <begin_vertex>
      vec3 toEye=normalize(cameraPosition-treeAnchor);
      vec3 treeRight=normalize(vec3(toEye.z,0.,-toEye.x)+vec3(.00001,0.,0.));
      vec3 faceUp=normalize(cross(toEye,treeRight));
      vec3 treeUp=normalize(mix(vec3(0.,1.,0.),faceUp,treeType*.56));
      transformed=treeAnchor+treeRight*treeOffset.x+treeUp*treeOffset.y;
      vec3 treeWorld=(modelMatrix*vec4(transformed,1.)).xyz;
      parkTreeVisibility=1.-smoothstep(2100.,3000.,cameraPosition.y)*(1.-smoothstep(4300.,5000.,distance(cameraPosition.xz,treeAnchor.xz)));`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>',
      '#include <common>\nvarying float parkTreeVisibility;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>',
      'diffuseColor.a*=parkTreeVisibility;\n#include <alphatest_fragment>');
  };
  material.customProgramCacheKey=()=> 'park-leaf-impostors-v2';
  const mesh=new T.Mesh(geometry,material);mesh.name='Park / painted poplar belt';
  mesh.matrixAutoUpdate=false;mesh.userData.closeVertexCount=closeVertexCount;mesh.userData.potatoVertexCount=potatoVertexCount;
  mesh.userData.texture='public/assets/arena/park/park-poplars.webp';
  return mesh;
}

export function createParkFence(T) {
  const b = batch(T, 'Park / curved steel posts and low perimeter boards');
  // A flat park apron closes the gap below the scenery when looking over a wall.
  // Its top is below the playable pitch, so it never covers the ball/pad shadows.
  // A continuous lawn graded toward the forest, using vertex colors in the
  // existing batch instead of overlapping giant rectangular slabs.
  const rings = [[4180,5300,0x6a914c],[5100,6250,0x658a47]];
  for (let ring = 0; ring < rings.length - 1; ring++) {
    const [x,z,color] = rings[ring], [nx,nz,nextColor] = rings[ring+1];
    const inner = [[-x,-z],[x,-z],[x,z],[-x,z]], outer = [[-nx,-nz],[nx,-nz],[nx,nz],[-nx,nz]];
    for (let side = 0; side < 4; side++) {
      const j=(side+1)%4, positions=[inner[side],inner[j],outer[j],inner[side],outer[j],outer[side]];
      const geometry = new T.BufferGeometry();
      geometry.setAttribute('position', new T.Float32BufferAttribute(positions.flatMap(([px,pz])=>[px,-22,pz]),3));
      const innerColor=new T.Color(color),outerColor=new T.Color(nextColor);
      geometry.setAttribute('color',new T.Float32BufferAttribute([innerColor,innerColor,outerColor,innerColor,outerColor,outerColor].flatMap(c=>[c.r,c.g,c.b]),3));
      geometry.computeVertexNormals(); b.add(geometry,0xffffff);
    }
  }
  b.box(0,-35,0,8360,20,10600,0x80975a);
  // The tree side has a narrow walkway; the opposite side opens onto seating.
  b.box(-4430,-12,0,230,6,10800,0xb7bca4);
  b.box(5750,-12,0,380,6,12700,0xb7bca4);
  for (const end of [-1,1]) b.box(650,-12,end*6320,10300,6,300,0xb7bca4);
  // Outside the existing 4096 x 5120 UU collision bounds. The original curved
  // bank and continuous enclosure remain the authoritative visible play surface.
  for (const side of [-1, 1]) {
    for (let z = -3900; z <= 3900; z += 1300) {
      b.beam([side * 4240, 210, z], [side * 4240, 1750, z], 15, 0x657d80);
      let previous = [side * 4240, 1750, z];
      for (let k = 1; k <= 6; k++) {
        const a = k / 6 * Math.PI / 2;
        const next = [side * (3840 + 400 * Math.cos(a)), 1750 + 400 * Math.sin(a), z];
        b.beam(previous, next, 12, 0x849999); previous = next;
      }
    }
    // Low, broad sponsor boards rather than a tall opaque stadium wall.
    for (let z = -3900; z < 3900; z += 650) {
      b.box(side * 4245, 295, z + 325, 40, 125, 625, 0x324f61);
      b.box(side * 4218, 335, z + 325, 12, 14, 590, z < 0 ? 0x56a8d7 : 0xe5a25b);
    }
    for (let x = -2600; x <= 2600; x += 1300) {
      if (x === 0) continue; // Keep the goal aperture free of a background mast.
      b.beam([x, 280, side * 5320], [x, 2040, side * 5320], 14, 0x738a8b);
    }
  }
  const mesh=b.finish();
  // Above-field cameras should not look through tall foreground support posts.
  // The low boards/apron and all normal driving views remain unchanged.
  mesh.material.precision='highp';
  mesh.material.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <common>',
      '#include <common>\nvarying vec3 parkFenceWorld;');
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nparkFenceWorld=(modelMatrix*vec4(position,1.)).xyz;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>',
      '#include <common>\nvarying vec3 parkFenceWorld;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>',
      '#include <clipping_planes_fragment>\nif(cameraPosition.y>2500. && parkFenceWorld.y>360. && distance(cameraPosition.xz,parkFenceWorld.xz)<5000.) discard;');
  };
  mesh.material.customProgramCacheKey=()=> 'park-fence-clearance-v1';
  return mesh;
}

export function createParkScenery(T) {
  const group = new T.Group(); group.name = 'Park / open-air bleachers and poplars';
  const b = batch(T, 'Park / baked daylight scenery');
  // Four modest terraced stands, leaving the skyline completely open.
  for (const side of [-1, 1]) {
    for (const end of (side > 0 ? [-1, 1] : [])) {
      for (let row = 0; row < 4; row++) {
        const x = side * (4660 + row * 180), y = 90 + row * 110, z = end * 2400;
        b.box(x, y, z, 180, 100, 2300, row % 2 ? 0x8c9d9c : 0x657c83);
        b.box(x, y + 60, z, 100, 18, 2270, 0xbac7c0);
        // Small rounded spectators; static vertex color, no alpha or animation.
        for (let seat = 0; seat < 13; seat++) {
          const spectator = new T.SphereGeometry(24, 5, 3);
          spectator.scale(1, 1.25, 1);
          spectator.translate(x, y + 100, z - 1050 + seat * 172);
          b.add(spectator, [0xc2d7ba, 0x719da4, 0xd9b761, 0x8caa68][(seat + row) % 4]);
        }
      }
    }
    // Sparse daylight floodlights. Painted white lamps add zero lights/passes.
    for (const end of [-1, 1]) {
      const x = side * 5100, z = end * 4600;
      b.beam([x, 0, z], [x, 3000, z], 28, 0x708687);
      b.box(x, 2950, z, 410, 260, 80, 0x5d7377);
      for (let k = 0; k < 4; k++) b.box(x - 145 + k * 96, 2960, z - end * 45, 66, 170, 12, 0xe7e8ca);
    }
  }
  group.add(b.finish());
  return group;
}

export function createParkBackdrop(T, texture) {
  // A camera-centered hemisphere: 384 triangles and one opaque texture sample.
  // Mirrored U makes both panorama joins continuous, even with nonmatching edges.
  texture.wrapS = T.MirroredRepeatWrapping; texture.repeat.x = 2;
  texture.colorSpace = T.SRGBColorSpace;
  const positions = [], uv = [], indices = [];
  const rings = [-0.16, 0, 0.2, 0.45, 0.75, 1.1, Math.PI / 2];
  const segments = 32, radius = 28000;
  for (let y = 0; y < rings.length; y++) {
    const elevation = rings[y];
    for (let x = 0; x <= segments; x++) {
      const angle = x / segments * Math.PI * 2;
      positions.push(Math.sin(angle) * Math.cos(elevation) * radius,
        Math.sin(elevation) * radius, Math.cos(angle) * Math.cos(elevation) * radius);
      uv.push(x / segments, Math.min(1, Math.max(0,(elevation + 0.03) / 0.82)));
      if (y < rings.length - 1 && x < segments) {
        const a = y * (segments + 1) + x, b = a + segments + 1;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geometry.setIndex(indices);
  const material = new T.MeshBasicMaterial({ map: texture, side: T.DoubleSide,
    depthWrite: false, fog: false, toneMapped: false });
  // Fade the panorama's upper edge into open sky, preventing stretched edge
  // clouds at the zenith. One texture sample and a vertex-computed blend only.
  material.onBeforeCompile = shader => {
    shader.uniforms.parkSkyColor = { value: new T.Color(PARK_ART.sky) };
    shader.vertexShader = shader.vertexShader.replace('#include <common>',
      '#include <common>\nvarying float parkSkyFade;');
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nparkSkyFade = smoothstep(.5, .9, position.y / 28000.0);');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>',
      '#include <common>\nvarying float parkSkyFade;\nuniform vec3 parkSkyColor;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>',
      '#include <map_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, parkSkyColor, parkSkyFade);');
  };
  material.customProgramCacheKey = () => 'park-painted-sky-v4-blue-daylight';
  const sky = new T.Mesh(geometry, material); sky.name = 'Park / painted alpine panorama';
  sky.frustumCulled = false; sky.renderOrder = -1000;
  sky.userData.bloomOccluder = false;
  sky.userData.texture = 'public'+PARK_ART.panorama;
  sky.onBeforeRender = (renderer, scene, camera) => {
    sky.position.setFromMatrixPosition(camera.matrixWorld); sky.updateMatrixWorld(true);
  };
  return sky;
}

export function createParkHorizon(T, texture) {
  const positions=[],uv=[],indices=[],segments=64,radius=27000;
  for(let i=0;i<=segments;i++) {
    const angle=i/segments*Math.PI*2;
    for(const y of [-1800,9600]) {
      const ridge=y>0?y*(.78+.22*Math.sin(angle+1.2)):y;
      positions.push(Math.sin(angle)*radius,ridge,Math.cos(angle)*radius);
      uv.push(i/segments,y<0?0:1);
    }
    if(i<segments){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  geometry.setIndex(indices);geometry.computeBoundingSphere();
  texture.wrapS=T.MirroredRepeatWrapping;texture.repeat.x=2;
  texture.colorSpace=T.SRGBColorSpace;
  const material=new T.MeshBasicMaterial({map:texture,alphaTest:.42,side:T.DoubleSide,
    transparent:false,depthWrite:true,fog:false,toneMapped:false});
  const mesh=new T.Mesh(geometry,material);
  mesh.name='Park / distant alpine mountains and lakeshore';mesh.rotation.y=-Math.PI*.70;mesh.updateMatrix();mesh.matrixAutoUpdate=false;
  mesh.userData.texture='public'+PARK_ART.horizon;
  mesh.userData.repeat=[2,1];mesh.userData.wrap='mirrored';
  return mesh;
}

export function paintParkPitch(canvas, context, artwork) {
  const width=canvas.width,height=canvas.height;
  if(artwork)context.drawImage(artwork,0,0,width,height);
  else {context.fillStyle='#426532';context.fillRect(0,0,width,height);}
  context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';
  context.save();context.scale(width/8192,height/10240);context.translate(4096,5120);
  context.strokeStyle='rgba(231,238,216,.83)';context.lineWidth=20;
  context.lineJoin='round';context.lineCap='round';
  // The overhead references have a clean painted goal area, not nested soccer
  // penalty boxes. Team paint and mowing continue beneath the single outline.
  for(const side of [-1,1]) {
    context.beginPath();context.moveTo(-2520,side*4800);
    context.lineTo(-2520,side*3100);context.lineTo(2520,side*3100);
    context.lineTo(2520,side*4800);context.stroke();
    context.beginPath();context.moveTo(-3720,0);context.lineTo(-3720,side*3500);
    context.quadraticCurveTo(-3720,side*4770,-2450,side*4770);
    context.lineTo(-1040,side*4770);context.moveTo(1040,side*4770);
    context.lineTo(2450,side*4770);
    context.quadraticCurveTo(3720,side*4770,3720,side*3500);
    context.lineTo(3720,0);context.stroke();
  }
  context.strokeStyle='rgba(238,244,218,.86)';context.lineWidth=18;
  context.beginPath();context.moveTo(-3720,0);context.lineTo(3720,0);context.stroke();
  for(const radius of [915,540]){context.beginPath();context.arc(0,0,radius,0,Math.PI*2);context.stroke();}
  context.fillStyle='rgba(242,247,228,.9)';context.beginPath();context.arc(0,0,19,0,Math.PI*2);context.fill();
  context.restore();
}

export function paintParkPadMarks(canvas, context, pads) {
  context.save();context.scale(canvas.width/8192,canvas.height/10240);context.translate(4096,5120);
  context.lineCap='round';
  for(const pad of pads) {
    context.strokeStyle='rgba(234,240,212,.70)';context.lineWidth=pad.isBig?16:12;
    context.beginPath();context.arc(pad.pos[0],pad.pos[1],pad.isBig?107:60,0,Math.PI*2);context.stroke();
  }
  context.restore();
}

// Every graphics preset and visual theme shares the same outer scenery budget.
export function updateParkSceneryDetail(trees, props, position) {
  props?.updateDetail(position, 'potato');
  if (trees && trees.geometry.drawRange.count !== trees.userData.potatoVertexCount) {
    trees.geometry.setDrawRange(0, trees.userData.potatoVertexCount);
  }
}
