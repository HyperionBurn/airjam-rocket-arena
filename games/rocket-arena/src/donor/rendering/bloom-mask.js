// Opaque cars write half alpha to the HDR target. Mask every tap before blur.
export function maskCarBloom(fragmentShader) {
  return fragmentShader
    .replace('void main(){', 'vec3 bloomSource(vec2 uv){vec4 sampleColor=texture(uSource,uv);return sampleColor.rgb*step(.75,sampleColor.a);}\nvoid main(){')
    .replaceAll(/texture\(uSource,([^;]*?)\)\.rgb/g, 'bloomSource($1)');
}
