import { createSketchfabModels } from "./sketchfab-models.js";
import {loadFennecV2Lighting,createReferenceImportedCarMaterial,resolveFennecV2Asset} from '../materials/fennec-v2.js';
import { createImportedBallMaterial } from "../materials/ball.js";
import { CAR_ENVIRONMENT_URL, PEARL_LIGHTING_URL } from "../materials/car.js";
import { Ao, BA, Ee, F, Gt, Ht, Lt, Ne, Ut, cn, dt, fr, li, xr } from "../vendor/three.js";
import { ho } from "../vendor/gltf-loader.js";
import { Nr } from "../rendering/theme-materials.js";
import { Vb, Yb, np } from "./rocket-hatch.js";

let rA = null;
let fennecV2Lighting;

// One reflection texture is shared by the bank and every car, including Potato.
// Do not use the old toon material as an adapter for these production shaders.
const daylightMaterialTypes = {
  MeshBasicMaterial: cn, ShaderMaterial: Lt, Color: Ne, Vector3: F,
  SRGBColorSpace: Ht, MirroredRepeatWrapping: BA, ClampToEdgeWrapping: fr,
  AdditiveBlending: li, DoubleSide: Ut,
};

let daylightReflectionTexture;

let daylightReflectionReady;

function getDaylightReflection() {
  if (!daylightReflectionTexture) {
    let loaded, failed;
    daylightReflectionReady = new Promise((resolve, reject) => { loaded = resolve; failed = reject; });
    daylightReflectionTexture = new Ao().load(CAR_ENVIRONMENT_URL, loaded, undefined, failed);
    daylightReflectionTexture.colorSpace = Ht;
    daylightReflectionTexture.wrapS = BA;
    daylightReflectionTexture.wrapT = fr;
    daylightReflectionTexture.anisotropy = 1;
    const pearlReady = new Promise((resolve, reject) => {
      const texture = new Ao().load(PEARL_LIGHTING_URL, resolve, undefined, reject);
      texture.colorSpace = '';
      texture.flipY = false;
      texture.generateMipmaps = false;
      texture.minFilter = texture.magFilter;
      daylightReflectionTexture.userData.pearlLighting = texture;
    });
    daylightReflectionReady = Promise.all([daylightReflectionReady, pearlReady]);
    // Startup's arena loader also awaits this promise and reports load errors.
    daylightReflectionReady.catch(() => {});
  }
  return daylightReflectionTexture;
}

const sketchfabModels = createSketchfabModels({
  Group: dt, Mesh: Ee, Vector3: F, Box3: xr, makeMaterial: Nr,
  makeCarMaterial: source => createReferenceImportedCarMaterial(source, fennecV2Lighting),
  makeBallMaterial: source => createImportedBallMaterial(daylightMaterialTypes, source),
  load: async url => {
    url=resolveFennecV2Asset(url);
    if (url.includes('/tripo/') || url.includes('/spectre/') || url.includes('/fennec-v2/') || url.includes('/challenger/') || url.includes('/octane/') || url.includes('/vanguard/') || url.includes('/vesper/') || url.includes('/takumi/')) fennecV2Lighting = await loadFennecV2Lighting();
    return new ho().loadAsync(url);
  },
});

const isSketchfabCar = id => ['fennec', 'octane-original', 'challenger', 'spectre', 'vesper', 'amethyst'].includes(id);

function Uh() {
  return (
    rA ||
    ((rA = new ho().loadAsync("/assets/game-car/model.gltf").then((i) => {
      i.scene.updateMatrixWorld(!0);
      const e = np(i.scene, "game-car-body"),
        t = Vb.map((r) => np(i.scene, r)),
        n = Yb(e, t);
      refineRocketHatch(e);
      return { body: e, wheels: t, wheelHardware: n };
    })),
    rA)
  );
}

// One-time art pass on the original mesh. Same triangles, wheels and physics.
function refineRocketHatch(body) {
  body.traverse((mesh) => {
    if (!(mesh instanceof Ee)) return;
    const material = mesh.material;
    if (Array.isArray(material) || !["body-shell", "glass"].includes(material.name)) return;
    const geometry = mesh.geometry = mesh.geometry.clone();
    const position = geometry.getAttribute("position");
    for (let index = 0; index < position.count; index++) {
      const x = position.getX(index), y = position.getY(index), z = position.getZ(index);
      const cabin = Gt.smoothstep(z, 0.0015, 0.0029);
      // Fuller rear cabin, broad shoulders, a slightly taller hatchback roof.
      position.setXYZ(index,
        x - cabin * Gt.smoothstep(-x, 0.001, 0.0055) * 0.00028,
        y * (1 + cabin * 0.07), z + cabin * 0.00018);
    }
    position.needsUpdate = !0;
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
  });
}

export { Uh, daylightMaterialTypes, daylightReflectionReady, getDaylightReflection, isSketchfabCar, sketchfabModels };
