import { getCarCustomization } from '../settings/car-customization.js';

export function applyCarCustomization(root, carId, team = 0) {
  const settings = getCarCustomization(carId, team);
  root.traverse(object => {
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!material?.userData?.fennecV2) continue;
      material.userData.garagePaint = { ...settings };
      const uniforms = material.uniforms;
      if (uniforms.uGaragePaint) uniforms.uGaragePaint.value = 1;
      uniforms.uFace?.value.set(settings.primary);
      uniforms.uPearl?.value.set(settings.pearl);
      if (uniforms.uRoughness) uniforms.uRoughness.value = settings.roughness;
      if (uniforms.uMetalness) uniforms.uMetalness.value = settings.metalness;
      if (uniforms.uClearcoat) uniforms.uClearcoat.value = settings.clearcoat;
    }
  });
  return settings;
}
