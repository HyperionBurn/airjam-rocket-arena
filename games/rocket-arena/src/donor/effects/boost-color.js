import { Color } from '../vendor/three.js';

export const ORIGINAL_BOOST_COLOR = '#ffac25';
export function setBoostMaterialColor(material, color) {
  if (!material?.isShaderMaterial) return;
  const enabled = color.toLowerCase() !== ORIGINAL_BOOST_COLOR;
  if (!material.uniforms.garageBoostTint) {
    material.uniforms.garageBoostTint = { value: new Color(color) };
    material.uniforms.garageBoostTintEnabled = { value: Number(enabled) };
    material.fragmentShader = `uniform vec3 garageBoostTint;\nuniform float garageBoostTintEnabled;\n${material.fragmentShader}`
      .replace('#include <tonemapping_fragment>', `
        float garageBoostPeak = max(gl_FragColor.r, max(gl_FragColor.g, gl_FragColor.b));
        vec3 garageBoostColor = garageBoostTint * garageBoostPeak;
        garageBoostColor = mix(garageBoostColor, vec3(garageBoostPeak), smoothstep(2.0, 8.0, garageBoostPeak) * .55);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, garageBoostColor, garageBoostTintEnabled);
        #include <tonemapping_fragment>
      `);
    material.needsUpdate = true;
  }
  material.uniforms.garageBoostTint.value.set(color);
  material.uniforms.garageBoostTintEnabled.value = Number(enabled);
}
