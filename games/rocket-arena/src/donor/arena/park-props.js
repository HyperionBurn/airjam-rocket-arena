// MakeUp-derived daylight adaptation: LGPL-3.0; see docs/exterior-art.md.
import { createDistantPropBatch, propGeometryKey } from './distant-props.js';
import { parkLandHeight } from './park-landscape.js';

// Supplied assets, batched by geometry/material and by spatial sector. No
// per-frame object creation, wind deformation, or independent texture copies.
export async function loadParkProps(T, load, loadDistantIndices = async () => {
  const response = await fetch('/assets/park-props/distant-indices.json');
  if (!response.ok) throw new Error('Distant scenery geometry could not load');
  return (await response.json()).indices;
}) {
  const root = new T.Group(); root.name = 'Park / supplied 3D gardens and stone banks';
  root.userData.visualOnly = true;
  const recipes = [
    { file: 'green-bush', count: 44, height: 320, radius: 1.08 },
    { file: 'painted-bush', count: 4, height: 270, radius: 1.13 },
    { file: 'forsythia', count: 4, height: 310, radius: 1.11 },
    { file: 'dense-bush', count: 2, height: 410, radius: 1.13 },
    { file: 'stones', count: 9, height: 240, radius: 1.25 },
  ];
  let seed = 7219;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const distantIndices = await loadDistantIndices();
  const detailUpdates = [];
  root.updateDetail = (position, preset = 'high') => { for (const update of detailUpdates) update(position, preset); };
  const prototypes = await Promise.all(recipes.map(async recipe => {
    const { scene } = await load(`/assets/park-props/${recipe.file}.glb`);
    scene.updateMatrixWorld(true);
    const box = new T.Box3().setFromObject(scene), center = box.getCenter(new T.Vector3());
    const height = Math.max(1e-6, box.max.y - box.min.y), parts = new Map();
    scene.traverse(node => {
      if (!node.isMesh) return;
      const keyIndices = distantIndices[propGeometryKey(node.geometry.attributes.position.array)];
      if (!keyIndices) throw new Error(`Missing distant geometry: ${recipe.file}`);
      const geometry = node.geometry.clone().applyMatrix4(node.matrixWorld);
      geometry.userData.distantIndices = keyIndices;
      geometry.translate(-center.x, -box.min.y, -center.z); geometry.scale(1 / height, 1 / height, 1 / height);
      if (!geometry.attributes.normal) geometry.computeVertexNormals();
      const key = node.material.uuid;
      if (!parts.has(key)) parts.set(key, { material: node.material, geometries: [] });
      parts.get(key).geometries.push(geometry);
    });
    return [...parts.values()].map(({ material: source, geometries }) => {
      const lowIndices = []; let vertexOffset = 0;
      for (const geometry of geometries) {
        for (const index of geometry.userData.distantIndices) lowIndices.push(index + vertexOffset);
        vertexOffset += geometry.attributes.position.count;
      }
      const geometry = merge(T, geometries);
      const distantGeometry = new T.BufferGeometry();
      for (const [name, attribute] of Object.entries(geometry.attributes)) distantGeometry.setAttribute(name, attribute);
      distantGeometry.setIndex(lowIndices); distantGeometry.computeBoundingSphere();
      const material = new T.MeshBasicMaterial({
        name: `MakeUp foliage / ${recipe.file} / ${source.name}`,
        map: source.map, color: source.color, vertexColors: !!geometry.attributes.color,
        side: 2, alphaTest: source.alphaTest || (source.map ? .22 : 0),
        transparent: false, depthWrite: true, toneMapped: false,
      });
      if (material.map) { material.map.anisotropy = 1; material.map.generateMipmaps = true; }
      material.onBeforeCompile = shader => {
        shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 foliageLight;varying vec3 foliageWorld;');
        shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
          vec3 pn=normal;vec4 pw=vec4(position,1.);
          #ifdef USE_INSTANCING
            pn=mat3(instanceMatrix)*pn;pw=instanceMatrix*pw;
          #endif
          pn=normalize(mat3(modelMatrix)*pn);foliageWorld=(modelMatrix*pw).xyz;
          float ndl=max(dot(pn,normalize(vec3(-.45,.88,-.65))),0.);
          float sky=clamp(pn.y*.5+.5,0.,1.);
          foliageLight=mix(vec3(.30,.34,.25),vec3(.46,.60,.75),sky)*.85+vec3(.90,.84,.79)*ndl*.82;`);
        shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 foliageLight;varying vec3 foliageWorld;');
        shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
          diffuseColor.rgb*=foliageLight;
          float air=smoothstep(9000.,29000.,distance(cameraPosition,foliageWorld))*.45;
          diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.29,.51,.68),air);`);
      };
      material.customProgramCacheKey = () => 'makeup-instanced-foliage-v1';
      return { geometry, distantGeometry, material };
    });
  }));
  let triangles = 0, drawCalls = 0;
  recipes.forEach((recipe, index) => {
    const sectors = Array.from({ length: 4 }, () => []);
    for (let i = 0; i < recipe.count; i++) {
      const angle = (i + .31 + random() * .28) / recipe.count * Math.PI * 2 + index * .67;
      const radius = recipe.radius + (random() - .5) * .042;
      const x = Math.sin(angle) * 5900 * radius, z = Math.cos(angle) * 6950 * radius;
      const transform = new T.Object3D();
      transform.position.set(x, parkLandHeight(x, z) - 5, z);
      transform.rotation.y = random() * Math.PI * 2;
      transform.scale.setScalar(recipe.height * (.82 + random() * .36));
      transform.updateMatrix();
      sectors[Math.floor(((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / (Math.PI / 2))].push(transform.matrix.clone());
    }
    sectors.forEach((matrices, sector) => {
      if (!matrices.length) return;
      for (const { geometry, distantGeometry, material } of prototypes[index]) {
        const batch = createDistantPropBatch(T, geometry, distantGeometry, material, matrices, { potatoDensity: recipe.file === 'green-bush' ? .75 : 1 });
        batch.near.name = `Park / ${recipe.file} / sector ${sector}`;
        batch.far.name = `${batch.near.name} / distant`;
        root.add(batch.near, batch.far); detailUpdates.push(batch.update); drawCalls += 2;
        triangles += (geometry.index?.count ?? geometry.attributes.position.count) / 3 * matrices.length;
      }
    });
  });
  root.userData.budget = { instances: recipes.reduce((sum, r) => sum + r.count, 0), triangles, drawCalls };
  return root;
}
function merge(T, geometries) {
  const names = ['position', 'normal', 'uv', 'color'].filter(name => geometries.some(g => g.attributes[name]));
  const result = new T.BufferGeometry(), count = geometries.reduce((sum, g) => sum + g.attributes.position.count, 0);
  for (const name of names) {
    const itemSize = geometries.find(g => g.attributes[name]).attributes[name].itemSize;
    const values = new Float32Array(count * itemSize); let offset = 0;
    for (const geometry of geometries) {
      const attribute = geometry.attributes[name];
      for (let i = 0; i < geometry.attributes.position.count; i++) {
        for (let axis = 0; axis < itemSize; axis++) values[offset++] = attribute ? attribute.getComponent(i, axis) : name === 'color' ? 1 : 0;
      }
    }
    result.setAttribute(name, new T.Float32BufferAttribute(values, itemSize));
  }
  const index = []; let offset = 0;
  for (const geometry of geometries) {
    const indices = geometry.index?.array ?? Array.from({ length: geometry.attributes.position.count }, (_, i) => i);
    for (const i of indices) index.push(i + offset);
    offset += geometry.attributes.position.count; geometry.dispose();
  }
  result.setIndex(index); result.computeBoundingSphere(); return result;
}
