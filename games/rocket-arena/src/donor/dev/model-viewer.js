import { Group, Mesh, Vector3, Box3, Scene, PerspectiveCamera, WebGLRenderer, SRGBColorSpace, Color, e0 as HemisphereLight, eo as DirectionalLight } from '../vendor/three.js';
import { ho as GLTFLoader } from '../vendor/gltf-loader.js';
import { createSketchfabModels } from '../vehicles/sketchfab-models.js';
import { loadFennecV2Lighting, createReferenceImportedCarMaterial, applyReferenceCarSettings } from '../materials/fennec-v2.js';
import { REFERENCE_GRAPHICS_DEFAULTS } from '../settings/reference-graphics.js';
import { ReferencePost } from '../rendering/reference-post.js';

const viewport = document.querySelector('#viewport'), status = document.querySelector('#status');
const renderer = new WebGLRenderer({ antialias: false, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.outputColorSpace = SRGBColorSpace;
viewport.append(renderer.domElement);
const scene = new Scene(); scene.background = new Color(0xd9e1e6);
scene.add(new HemisphereLight(0xcfeaff, 0x727b70, .8));
const sun = new DirectionalLight(0xffffff, 2); sun.position.set(-450, 830, 290); scene.add(sun);
const camera = new PerspectiveCamera(34, 1, 1, 3000), target = new Vector3();
const post = new ReferencePost(renderer);
const settings = { ...REFERENCE_GRAPHICS_DEFAULTS, fog: 0, bloom: 0, makeupBloom: 0 };
let yaw = .8, pitch = .34, radius = 350, model;
try {
  const saved = JSON.parse(sessionStorage.getItem('rooster-view') || 'null');
  if (saved && [saved.yaw, saved.pitch, saved.radius].every(Number.isFinite)) ({ yaw, pitch, radius } = saved);
} catch {}
function saveView() { sessionStorage.setItem('rooster-view', JSON.stringify({ yaw, pitch, radius })); }
function resize() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();
const pointers = new Map(); let pinch = 0;
renderer.domElement.addEventListener('pointerdown', event => {
  renderer.domElement.setPointerCapture(event.pointerId);
  pointers.set(event.pointerId, [event.clientX, event.clientY]);
});
renderer.domElement.addEventListener('pointermove', event => {
  const previous = pointers.get(event.pointerId); if (!previous) return;
  pointers.set(event.pointerId, [event.clientX, event.clientY]);
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()], distance = Math.hypot(a[0] - b[0], a[1] - b[1]);
    if (pinch && distance) radius = Math.max(180, Math.min(850, radius * pinch / distance));
    pinch = distance;
  } else {
    yaw -= (event.clientX - previous[0]) * .008;
    pitch = Math.max(-.35, Math.min(1.55, pitch + (event.clientY - previous[1]) * .006));
  }
  saveView();
});
for (const event of ['pointerup', 'pointercancel']) renderer.domElement.addEventListener(event, e => { pointers.delete(e.pointerId); pinch = 0; });
renderer.domElement.addEventListener('wheel', event => {
  event.preventDefault(); radius = Math.max(180, Math.min(850, radius * Math.exp(event.deltaY * .001))); saveView();
}, { passive: false });
document.querySelector('#view').addEventListener('change', event => {
  [yaw, pitch] = { perspective: [.8, .34], front: [0, .12], side: [Math.PI / 2, .12], rear: [Math.PI, .12], top: [0, 1.55] }[event.target.value];
  saveView();
});
document.querySelector('#wire').addEventListener('change', event => model?.traverse(mesh => { if (mesh.material) mesh.material.wireframe = event.target.checked; }));
document.querySelector('#bird').addEventListener('change', event => {
  if(model) model.traverse(mesh=>{if(mesh.userData.chickyBody)mesh.visible=event.target.checked;});
});
try {
  const environment = await loadFennecV2Lighting(), loader = new GLTFLoader();
  const assets = createSketchfabModels({ Group, Mesh, Vector3, Box3,
    makeCarMaterial: source => createReferenceImportedCarMaterial(source, environment),
    load: url => loader.loadAsync(url),
  });
  model = await assets.preview('chicky');
  model.traverse(mesh => { if (mesh.material) applyReferenceCarSettings(mesh.material, settings); });
  const box = new Box3().setFromObject(model); box.getCenter(target);
  scene.add(model);
  let triangles = 0;
  model.traverse(mesh => { if (mesh.geometry) triangles += (mesh.geometry.index?.count ?? mesh.geometry.attributes.position.count) / 3; });
  status.textContent = `${Math.round(triangles).toLocaleString()} triangles`;
} catch (error) { status.textContent = `Model failed to load: ${error.message}`; console.error(error); }
let previousTime = performance.now();
function frame(time) {
  const dt = Math.min((time - previousTime) / 1000, .1); previousTime = time;
  if (document.querySelector('#spin').checked && !pointers.size) yaw += dt * .3;
  const distance = radius * Math.max(1, .9 / camera.aspect);
  camera.position.set(target.x + Math.cos(yaw) * Math.cos(pitch) * distance,
    target.y + Math.sin(pitch) * distance, target.z + Math.sin(yaw) * Math.cos(pitch) * distance);
  camera.lookAt(target);
  post.render(scene, camera, settings, 'balanced', 'realistic');
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
