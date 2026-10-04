import { F } from '../vendor/three.js';
import { applyReferenceCarSettings } from '../materials/fennec-v2.js';
import { bindReferenceScenery } from '../materials/reference-scenery.js';
import { createReferenceFieldTexture } from '../materials/reference-field-texture.js';
import { createReferenceSkyController } from '../materials/reference-sky.js';
import { referenceGraphicsSettings, referencePaletteColors, referenceSunDirection, REFERENCE_GRAPHICS_DEFAULTS, resolveLightweightLook } from '../settings/reference-graphics.js';

export class ReferenceLighting {
  constructor(settings = referenceGraphicsSettings.load()) {
    this.savedSettings = settings; this.settings = resolveLightweightLook(settings); this.dirty = true;
    this.uniforms = {
      referenceMakeup: { value: 1 }, referenceTint: { value: new F(1, 1, 1) },
      referenceHaze: { value: 0 }, referenceHorizon: { value: new F(.47, .75, .92) },
      referenceLook: { value: 0 },
    };
  }
  setSettings(settings) { this.savedSettings = settings; this.settings = resolveLightweightLook(settings); this.dirty = true; }
  update(world, theme) {
    if (!this.dirty && this.version === world.renderTreeVersion && this.theme === theme) return;
    this.version = world.renderTreeVersion; this.theme = theme; this.dirty = false;
    const settings = this.settings = resolveLightweightLook(this.savedSettings, theme), colors = referencePaletteColors(settings);
    const makeup = theme === 'realistic' && settings.renderer === 'makeup';
    this.uniforms.referenceMakeup.value = Number(makeup);
    this.uniforms.referenceLook.value = Number(makeup && settings.lightweightLook);
    const pending = [];
    const skyMaterial = world.sky?.getObjectByName('Park / painted alpine panorama')?.material ?? world.sky?.material;
    if (skyMaterial?.map) {
      if (!skyMaterial.userData.referenceSkyController) {
        const controller = createReferenceSkyController(skyMaterial.map);
        skyMaterial.userData.referenceSkyController = controller;
        skyMaterial.addEventListener('dispose', () => controller.restore());
      }
      pending.push(skyMaterial.userData.referenceSkyController.setEnabled(Boolean(this.uniforms.referenceLook.value)));
    }
    const base = referencePaletteColors(REFERENCE_GRAPHICS_DEFAULTS);
    this.uniforms.referenceTint.value.fromArray(colors.sun.map((value, index) =>
      (1 + (value / base.sun[index] - 1) * .25) * (.76 + .24 * settings.lightPower / 3.5)));
    this.uniforms.referenceHorizon.value.fromArray(colors.horizon);
    // Existing map already has its authored haze. The editor adjusts from that.
    this.uniforms.referenceHaze.value = settings.fog - REFERENCE_GRAPHICS_DEFAULTS.fog;
    world.referenceSunOffset ??= new F();
    world.referenceSunOffset.fromArray(referenceSunDirection(settings)).multiplyScalar(4950);
    for (const sun of [world.carSun, world.ballSun, world.opponentSun]) if (sun) {
      sun.color.setRGB(...(makeup ? colors.sun : [1, .95, .86]));
      sun.intensity = settings.lightPower / 3.5;
      sun.shadow.radius = settings.shadowBlur;
      sun.position.copy(sun.target.position).add(world.referenceSunOffset);
    }
    for (const root of [world.turf, world.sky, world.stadium]) root?.traverse(object => {
      for (const material of Array.isArray(object.material) ? object.material : [object.material])
        bindReferenceScenery(material, this.uniforms);
    });
    world.scene.traverse(object => {
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        applyReferenceCarSettings(material, settings, theme);
        if (material?.userData?.parkGround) {
          const ground = material.userData.parkGround, direction = referenceSunDirection(settings);
          ground.contactAO.value = settings.ao;
          ground.lightDirection.value.fromArray(direction);
          ground.referenceLook.value = this.uniforms.referenceLook.value;
          if (ground.referenceLook.value) {
            const key = direction.join(',');
            if (!ground.referenceFieldBake) {
              ground.referenceFieldBake = createReferenceFieldTexture(material.map, direction);
            } else if (ground.referenceSunKey !== key) {
              ground.referenceFieldBake.update(direction);
            }
            pending.push(ground.referenceFieldBake.ready);
            ground.referenceSunKey = key;
          } else if (ground.referenceFieldBake) {
            ground.referenceFieldBake.restore();
            ground.referenceFieldBake = null;
          }
        }
      }
    });
    this.pendingAssets = Promise.all(pending);
    this.pendingAssets.catch(() => {}); // Failed optional artwork retains the original texture.
  }
}
