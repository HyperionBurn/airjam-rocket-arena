import { Group, Scene, Mesh, Vector3, Box3, CylinderGeometry, PlaneGeometry, MeshBasicMaterial, TextureLoader, DoubleSide, PerspectiveCamera, WebGLRenderer, SRGBColorSpace, e0 as HemisphereLight, eo as DirectionalLight } from '../vendor/three.js';
import { sketchfabModels } from '../vehicles/imported-models.js';
import { applyCarCustomization } from '../vehicles/customization.js';
import { applyReferenceCarSettings } from '../materials/fennec-v2.js';
import { referenceGraphicsSettings, resolveLightweightLook } from '../settings/reference-graphics.js';
import { graphicsSettings } from '../settings/schema.js';
import { getTheme } from '../rendering/theme.js';
import { ReferencePost } from '../rendering/reference-post.js';
import { FennecV2Post } from '../rendering/fennec-v2-post.js';

const GARAGE_RENDER_WIDTH = 854;
const GARAGE_RENDER_HEIGHT = 480;

export class GaragePreview {
  constructor() {
    this.models = new Map(); this.thumbnails = new Map();
    this.active = 'fennec'; this.team = 'blue'; this.frame = 0;
    this.orbitYaw = .73; this.orbitPitch = .34; this.orbitDistance = 365;
    this.drag = null; this.lastInteraction = 0;
    this.quality = graphicsSettings.load().qualityPreset;
    this.graphics = resolveLightweightLook(referenceGraphicsSettings.load(), getTheme());
  }
  init() {
    if (this.renderer) return;
    this.renderer = new WebGLRenderer({ antialias: false, alpha: true, premultipliedAlpha: false, powerPreference: 'low-power' });
    // Render the hero at 480p and thumbnails at their actual display size.
    this.renderer.setPixelRatio(1); this.renderer.setSize(GARAGE_RENDER_WIDTH, GARAGE_RENDER_HEIGHT, false);
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.setClearColor(0, 0);
    this.scene = new Scene();
    this.scene.add(new HemisphereLight(0xcfeaff, 0x182d26, .8));
    const sun = new DirectionalLight(0xffffff, 2); sun.position.set(-450, 830, 290); this.scene.add(sun);
    this.groundReady = new Promise(resolve => {
      const groundTexture = new TextureLoader().load('/assets/garage/showroom-ground-v1.webp', resolve, undefined, resolve);
      groundTexture.colorSpace = SRGBColorSpace;
      const floor = new Mesh(new PlaneGeometry(1400, 1400), new MeshBasicMaterial({ map:groundTexture, color:0xffffff, toneMapped:false }));
      floor.name = 'Garage / fixed textured showroom floor'; floor.rotation.x = -Math.PI / 2; floor.position.y = -.8; this.scene.add(floor);
    });
    this.panoramaReady = new Promise(resolve => {
      const texture = new TextureLoader().load('/assets/garage/cylindrical-panorama-v1.webp', () => resolve(), undefined, () => resolve());
      texture.colorSpace = SRGBColorSpace;
      const panorama = new Mesh(
        new CylinderGeometry(900, 900, Math.PI * 600, 96, 1, true),
        new MeshBasicMaterial({ map:texture, side:DoubleSide, toneMapped:false }),
      );
      panorama.name = 'Garage / fixed cylindrical panorama'; panorama.position.y = 80;
      this.scene.add(panorama); this.panorama = panorama;
    });
    this.camera = new PerspectiveCamera(28, 16 / 9, 1, 2500);
    this.updateCamera();
    this.post = new ReferencePost(this.renderer); this.arcadePost = new FennecV2Post(this.renderer);
    // Preserve the car silhouette over the live arena instead of drawing a
    // rectangular viewer backdrop. Both post passes read the original alpha.
    for (const post of [this.post, this.arcadePost]) {
      post.materials.postFragment.fragmentShader = post.materials.postFragment.fragmentShader.replaceAll(',1.);', ',step(.25,texture(uSource,vUV).a));');
    }
  }
  attach(carId) {
    this.init();
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 144;
    canvas.className = 'car-card__canvas'; canvas.setAttribute('aria-hidden', 'true');
    this.bindRotation(canvas, carId);
    this.thumbnails.set(carId, canvas.getContext('2d'));
    const ready = sketchfabModels.preview(carId).then(model => {
      const variants = new Map();
      model.traverse(mesh => {
        const source = mesh.material; if (!source) return;
        if (!variants.has(source)) {
          const material = source.clone();
          for (const [name, uniform] of Object.entries(source.uniforms || {})) if (uniform.value?.isTexture) material.uniforms[name].value = uniform.value;
          variants.set(source, material);
        }
        mesh.material = variants.get(source);
      });
      const turntable = new Group(), bounds = new Box3().setFromObject(model), center = bounds.getCenter(new Vector3());
      // Ground the lowest tire point at y=0 while centering only horizontally.
      model.position.set(-center.x, -bounds.min.y, -center.z); turntable.add(model); this.models.set(carId, turntable);
      this.customize(carId); this.draw(carId, true);
    });
    return { canvas, ready };
  }
  setHero(canvas) {
    this.heroCanvas = canvas; this.hero = canvas.getContext('2d'); this.bindRotation(canvas);
    canvas.addEventListener('wheel', event => {
      event.preventDefault();
      this.orbitDistance = Math.max(275, Math.min(475, this.orbitDistance + Math.sign(event.deltaY) * 24));
      this.updateCamera(); this.lastInteraction = performance.now(); this.draw();
    }, { passive: false });
  }
  bindRotation(canvas, carId = null) {
    let suppressClick = false;
    canvas.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      this.drag = { id:event.pointerId, x:event.clientX, y:event.clientY, yaw:this.orbitYaw, pitch:this.orbitPitch, moved:false, carId };
      canvas.setPointerCapture?.(event.pointerId); canvas.classList.add('is-dragging'); this.lastInteraction = performance.now();
    });
    canvas.addEventListener('pointermove', event => {
      if (!this.drag || this.drag.id !== event.pointerId) return;
      const dx = event.clientX - this.drag.x, dy = event.clientY - this.drag.y;
      if (Math.hypot(dx,dy) > 3) this.drag.moved = true;
      // Camera follows the drag direction; the car and garage never rotate.
      this.orbitYaw = this.drag.yaw + dx * .009;
      this.orbitPitch = Math.max(.14, Math.min(.58, this.drag.pitch + dy * .003));
      this.updateCamera();
      this.lastInteraction = performance.now();
      this.draw(carId ?? this.active, Boolean(carId));
      event.preventDefault();
    });
    const finish = event => {
      if (!this.drag || this.drag.id !== event.pointerId) return;
      suppressClick = this.drag.moved; this.drag = null; canvas.classList.remove('is-dragging'); this.lastInteraction = performance.now();
    };
    canvas.addEventListener('pointerup', finish);
    canvas.addEventListener('pointercancel', finish);
    canvas.addEventListener('lostpointercapture', finish);
    canvas.addEventListener('click', event => {
      if (!suppressClick) return;
      suppressClick = false; event.preventDefault(); event.stopPropagation();
    });
  }
  updateCamera() {
    if (!this.camera) return;
    const horizontal = Math.cos(this.orbitPitch) * this.orbitDistance;
    const targetY = 25;
    this.camera.position.set(
      Math.cos(this.orbitYaw) * horizontal,
      targetY + Math.sin(this.orbitPitch) * this.orbitDistance,
      Math.sin(this.orbitYaw) * horizontal,
    );
    this.camera.lookAt(0, targetY, 0);
  }
  customize(carId) {
    const root = this.models.get(carId); if (!root) return;
    applyCarCustomization(root, carId, this.team);
    root.traverse(mesh => { if (mesh.material) applyReferenceCarSettings(mesh.material, this.graphics, getTheme()); });
  }
  select(carId, team = this.team) {
    const teamChanged = team !== this.team;
    this.active = carId; this.team = team;
    this.quality = graphicsSettings.load().qualityPreset; this.graphics = resolveLightweightLook(referenceGraphicsSettings.load(), getTheme());
    this.renderer?.setSize(GARAGE_RENDER_WIDTH, GARAGE_RENDER_HEIGHT, false);
    if (teamChanged) for (const id of this.models.keys()) { this.customize(id); this.draw(id, true); }
    this.customize(carId); this.draw(carId);
  }
  async preload() {
    await Promise.all([this.panoramaReady, this.groundReady]);
    // attach() already rendered each thumbnail, compiling its materials once.
    this.draw();
  }
  draw(carId = this.active, refreshThumbnail = false) {
    const model = this.models.get(carId); if (!model) return;
    this.renderer.setSize(refreshThumbnail ? 256 : GARAGE_RENDER_WIDTH, refreshThumbnail ? 144 : GARAGE_RENDER_HEIGHT, false);
    model.rotation.set(0, 0, 0); this.updateCamera(); this.scene.add(model);
    if (getTheme() === 'realistic') this.post.render(this.scene, this.camera, this.graphics, 'high', 'realistic');
    else this.arcadePost.render(this.scene, this.camera, false);
    this.scene.remove(model);
    const thumbnail = refreshThumbnail ? this.thumbnails.get(carId) : null;
    thumbnail?.clearRect(0, 0, 256, 144); thumbnail?.drawImage(this.renderer.domElement, 0, 0, 256, 144);
    if (!refreshThumbnail && carId === this.active && this.hero) {
      this.hero.clearRect(0, 0, this.heroCanvas.width, this.heroCanvas.height);
      this.hero.drawImage(this.renderer.domElement, 0, 0, this.heroCanvas.width, this.heroCanvas.height);
    }
    if (refreshThumbnail && carId === this.active) this.draw(carId);
  }
  start() {
    this.draw();
  }
  stop() {}
}
