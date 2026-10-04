import { shapeTripo } from './tripo-shape.js';
import { fitSharedWheels } from './shared-wheels.js';
import { matchFennecEndProportions, matchFennecWheels } from './fennec-end-fit.js';
import { addRoosterBody } from './rooster-car.js';
import { buildChickyBody } from './chicky-car.js';
import { shapeVanguard } from './vanguard-shape.js';
// Jako's CC BY models. Geometry/textures are processed once offline, shared at runtime.
export function createSketchfabModels({ Group, Mesh, Vector3, Box3, makeMaterial, makeCarMaterial, makeBallMaterial, load }) {
  const cars = new Map(), originalCars = new Map();
  let ball;
  function normalizeChallenger(scene) {
    // Source: centimetres, forward +Z, up +Y. Gameplay: forward +X, up +Y,
    // lateral +Z. Preserve the authored proportions with one uniform scale.
    scene.rotation.y = Math.PI / 2;
    // The exporter wraps centimetre-valued bones in a 0.01 scene transform.
    scene.scale.setScalar(34);
    scene.position.x = 7.5;
    const unsupportedGlows = [];
    scene.traverse(node => {
      if (!node.isMesh || !node.material || Array.isArray(node.material)) return;
      const name = `${node.name} ${node.material.name}`.toLowerCase();
      // This source mesh is a long transparent billboard. The game's opaque
      // car shader turns it into a solid ray projecting from the headlights.
      if (/lights_position_front_and_back.*glows/.test(name)) {
        unsupportedGlows.push(node);
        return;
      }
      const kind = /carpaint/.test(name) ? 4
        : /glass|window/.test(name) ? 5
        : /tyre|tire/.test(name) ? 1
        : /rim|caliper|chrome|shiny/.test(name) ? 0
        : 6;
      node.material = node.material.clone();
      node.material.userData = { ...node.material.userData, fennecV2Material: kind, challengerMaterial: true };
    });
    unsupportedGlows.forEach(node => node.removeFromParent());
  }
  function prepare(scene, makeSubjectMaterial) {
    const materials = new Map();
    scene.updateMatrixWorld(true);
    const meshes = [];
    scene.traverse(node => {
      if (!node.isMesh) return;
      const geometry = node.geometry.clone().applyMatrix4(node.matrixWorld);
      // Baking a mirrored wheel removes the negative object scale that Three
      // normally uses to flip face culling. Preserve its visible winding here.
      if (node.matrixWorld.determinant() < 0 && geometry.index) {
        const indices = geometry.index.array;
        for (let i = 0; i < indices.length; i += 3) [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
      }
      const source = node.material;
      let material = materials.get(source);
      if (!material) {
        material = makeSubjectMaterial ? makeSubjectMaterial(source) : makeMaterial({ name:source.name, color:source.color,
          map:source.map, emissive:source.emissive, emissiveMap:source.emissiveMap,
          emissiveIntensity:Math.min(source.emissiveIntensity ?? 1,0.5),
          side:source.side, opacity:source.opacity,
          transparent:source.transparent, alphaTest:source.alphaTest });
        for (const texture of [material.map, material.emissiveMap])
          if (texture) texture.anisotropy = 1;
        materials.set(source, material);
      }
      const mesh = new Mesh(geometry,material);
      mesh.name = node.name;
      mesh.castShadow = true; mesh.receiveShadow = true;
      meshes.push(mesh);
    });
    return meshes;
  }
  async function loadOriginalCar(id) {
    const sourceId = id === 'vanguard-original' ? 'vanguard' : id === 'chicky' ? 'takumi' : id === 'octane' ? 'vesper' : id;
    if (!originalCars.has(id)) originalCars.set(id, load(`/assets/sketchfab/${sourceId}/model.glb`).then(async ({scene}) => {
      if (id === 'challenger') normalizeChallenger(scene);
      if (id === 'specter-2') {
        // The supplied model already uses the game's +X-forward/Y-up axes.
        // A uniform scale is the only fit applied, preserving all proportions.
        const sourceSize = new Box3().setFromObject(scene, true).getSize(new Vector3());
        scene.scale.multiplyScalar(145 / sourceSize.x);
        scene.updateMatrixWorld(true);
      }
      if (id === 'vanguard-original') scene.traverse(node => {
        if (!node.isMesh) return;
        node.material = node.material.clone();
        node.material.userData.vanguardOriginal = true;
      });
      let visualBounds = new Box3().setFromObject(scene, true);
      let fit;
      let fennec;
      if (id === 'challenger') {
        fennec = await loadOriginalCar('fennec');
        const currentSize = visualBounds.getSize(new Vector3());
        const currentCenter = visualBounds.getCenter(new Vector3());
        const targetLength = fennec.visualBounds.getSize(new Vector3()).x;
        const lengthScale = targetLength / currentSize.x;
        fit = {
          scale: new Vector3(lengthScale, 1, 1),
          offset: new Vector3(currentCenter.x * (1 - lengthScale), 0, 0),
        };
        visualBounds.min.x = currentCenter.x - targetLength / 2;
        visualBounds.max.x = currentCenter.x + targetLength / 2;
      } else if (id === 'tripo') {
        fennec = await loadOriginalCar('octane-original');
        const target = fennec.visualBounds;
        const scale = target.getSize(new Vector3()).divide(visualBounds.getSize(new Vector3()));
        const offset = target.getCenter(new Vector3()).sub(visualBounds.getCenter(new Vector3()).multiply(scale));
        fit = { scale, offset };
        visualBounds = target.clone();
      } else if (id === 'vanguard' || ['amethyst', 'volt', 'crimson', 'spectre', 'specter-2'].includes(id)) {
        fennec = await loadOriginalCar('fennec');
        const target = fennec.visualBounds;
        const scale = target.getSize(new Vector3()).divide(visualBounds.getSize(new Vector3()));
        const offset = target.getCenter(new Vector3()).sub(visualBounds.getCenter(new Vector3()).multiply(scale));
        fit = { scale, offset };
        visualBounds = target.clone();
      }
      const body = new Group(), wheelGroups = Array.from({length:4},()=>new Group());
      // Specter 2 keeps its authored PBR materials; every other imported body,
      // including Octane, uses the shared configurable car finish.
      const materialFactory = id === 'specter-2' ? source => {
        const material = source.clone();
        return material;
      } : makeCarMaterial;
      for (const mesh of prepare(scene, materialFactory)) {
        const match = mesh.name.match(/(?:_|\s|-)\s*(FR|FL|BR|BL|RR|RL)(?:_|\s|\()/i);
        if (fit && mesh.material.uniforms?.uSurfaceFitScale) {
          mesh.material.uniforms.uSurfaceFitScale.value.copy(fit.scale);
          mesh.material.uniforms.uSurfaceFitOffset.value.copy(fit.offset);
        }
        // Keep paint/window masks in authored coordinates while fitting the shell.
        if (id === 'tripo' && mesh.material.uniforms?.uTripoBody.value) {
          const surface = mesh.geometry.attributes.position.clone();
          for (let i = 0; i < surface.count; i++) surface.setY(i, surface.getY(i) - 17);
          mesh.geometry.setAttribute('_surface_position', surface);
          mesh.material.uniforms.uHasSurfacePosition.value = 1;
        }
        // Apply the body fit directly. Challenger wheels only move along X below.
        if (fit && (id !== 'challenger' || !match)) {
          mesh.geometry.scale(fit.scale.x, fit.scale.y, fit.scale.z);
          mesh.geometry.translate(fit.offset.x, fit.offset.y, fit.offset.z);
        }
        const wheelName = match?.[1].toUpperCase().replace('RR', 'BR').replace('RL', 'BL');
        (match ? wheelGroups[['FR','FL','BR','BL'].indexOf(wheelName)] : body).add(mesh);
      }
      if (wheelGroups.some(w=>!w.children.length)) throw new Error(`${id}: missing wheel meshes`);
      if (id === 'challenger') for (const wheel of wheelGroups) {
        // Move the axle with the shortened body while keeping the tire circular.
        const center = new Box3().setFromObject(wheel, true).getCenter(new Vector3());
        const targetX = center.x * fit.scale.x + fit.offset.x;
        for (const mesh of wheel.children) mesh.geometry.translate(targetX - center.x, 0, 0);
      }
      if (id === 'chicky') for (const wheel of wheelGroups) {
        const center=new Box3().setFromObject(wheel).getCenter(new Vector3());
        for(const mesh of wheel.children) {
          mesh.geometry.translate(-center.x,-center.y,-center.z);
          mesh.geometry.scale(1.2,1.2,1.15);
          mesh.geometry.translate(center.x,center.y,Math.sign(center.z)*36);
        }
      }
      // Export names use different left/right conventions; physics expects +Z first.
      const centerOf = wheel => new Box3().setFromObject(wheel).getCenter(new Vector3());
      wheelGroups.sort((a,b)=>centerOf(b).x-centerOf(a).x);
      const front=wheelGroups.slice(0,2).sort((a,b)=>centerOf(b).z-centerOf(a).z);
      const rear=wheelGroups.slice(2).sort((a,b)=>centerOf(b).z-centerOf(a).z);
      wheelGroups.splice(0,4,...front,...rear);
      if (id === 'tripo') shapeTripo(body, wheelGroups, { Box3, Vector3 });
      if (id === 'vanguard') shapeVanguard(body, wheelGroups, fennec, { Box3, Vector3 });
      if (id === 'spectre' || id === 'specter-2') matchFennecEndProportions(body, fennec.body);
      if (id === 'spectre') {
        const donor = await loadOriginalCar('fennec');
        wheelGroups.forEach((wheel, i) => {
          const bounds = new Box3().setFromObject(wheel, true);
          const center = bounds.getCenter(new Vector3());
          const size = bounds.getSize(new Vector3());
          const donorSize = new Box3().setFromObject(donor.wheels[i], true).getSize(new Vector3());
          // Keep Spectre's axle centers and circular tires, with independent tread width.
          const diameter = fit ? size.y : Math.max(size.x, size.y);
          wheel.clear();
          for (const source of donor.wheels[i].children) {
            const mesh = source.clone();
            mesh.geometry = source.geometry.clone();
            mesh.geometry.scale(diameter / donorSize.y, diameter / donorSize.y, size.z / donorSize.z);
            mesh.geometry.translate(center.x, center.y, center.z);
            mesh.name = `Spectre_${source.name}`;
            wheel.add(mesh);
          }
        });
      }
      if (id === 'spectre' || id === 'specter-2') matchFennecWheels(wheelGroups, fennec, { Box3, Vector3 });
      const wheelSpecs = [], wheelOffsets = [];
      const physicalRadii = [12.5,12.5,15,15];
      wheelGroups.forEach((wheel,i)=>{
        const box = new Box3().setFromObject(wheel), center = box.getCenter(new Vector3());
        const radius = (box.max.y-box.min.y)/2;
        wheelSpecs.push([center.x,center.z,radius]);
        wheelOffsets.push(center.y-physicalRadii[i]);
        wheel.children.forEach(mesh=>mesh.geometry.translate(-center.x,-center.y,-center.z));
      });
      body.children.forEach(mesh=>mesh.geometry.translate(0,-17,0));
      const box = new Box3().setFromObject(body);
      const outlets = id === 'tripo'
        ? [new Vector3(box.min.x + 3, 0, 0)]
        : [new Vector3(box.min.x+3, 10, 12),new Vector3(box.min.x+3, 10,-12)];
      if (id === 'octane') addRoosterBody(body);
      if (id === 'chicky') buildChickyBody(body);
      return {body,wheels:wheelGroups,wheelSpecs,wheelOffsets,outlets,visualBounds};
    }).catch(error=>{originalCars.delete(id);throw error;}));
    return originalCars.get(id);
  }
  async function loadCar(id) {
    if (!cars.has(id)) cars.set(id, Promise.all([
      loadOriginalCar(id), loadOriginalCar('spectre'),
    ]).then(([original, spectre]) => {
      if (id === 'spectre' || id === 'octane-original') return original;
      // Keep authored assets untouched: Vanguard and Spectre also use them as
      // fitting references. Only the final garage/gameplay instances get a swap.
      const wheels = original.wheels.map(wheel => wheel.clone(true));
      fitSharedWheels(wheels, spectre.wheels, { Box3, Vector3 });
      return { ...original, wheels };
    }).catch(error => { cars.delete(id); throw error; }));
    return cars.get(id);
  }
  async function loadBall(radius = 92.75) {
    ball ??= load('/assets/sketchfab/ball/model.glb').then(({scene})=>{
      const root = new Group(); root.name = 'Rocket League ball';
      prepare(scene, makeBallMaterial).forEach(mesh=>root.add(mesh));
      // The source sphere's origin is its physical center; use vertex radius,
      // not its asymmetrical panel bounds, to keep collision and spin aligned.
      let radius = 0;
      root.children.forEach(mesh=>{
        const positions=mesh.geometry.attributes.position;
        for(let i=0;i<positions.count;i++) radius=Math.max(radius,Math.hypot(positions.getX(i),positions.getY(i),positions.getZ(i)));
      });
      root.scale.setScalar(92.75/radius);
      return root;
    });
    const instance = (await ball).clone(true);
    instance.scale.multiplyScalar(radius / 92.75);
    return instance;
  }
  async function preview(id) {
    const asset=await loadCar(id),root=new Group();root.add(asset.body.clone(true));
    asset.wheels.forEach((wheel,i)=>{
      const copy=wheel.clone(true),[x,z,radius]=asset.wheelSpecs[i];
      copy.position.set(x,[12.5,12.5,15,15][i]-17+asset.wheelOffsets[i],z);root.add(copy);
    });
    return root;
  }
  return {loadCar,loadBall,preview};
}
