// Bake static field wear/shading into the existing albedo texture. Gameplay
// still reads the same sampler at the same resolution, including on Potato.
const linear = Float32Array.from({ length: 256 }, (_, value) => {
  const signal = value / 255;
  return signal <= .04045 ? signal / 12.92 : ((signal + .055) / 1.055) ** 2.4;
});
const signal = Uint8Array.from({ length: 4097 }, (_, value) => {
  const light = value / 4096;
  return Math.round(255 * (light <= .0031308 ? light * 12.92 : 1.055 * light ** (1 / 2.4) - .055));
});
const smooth = (low, high, value) => {
  const t = Math.max(0, Math.min(1, (value - low) / (high - low)));
  return t * t * (3 - 2 * t);
};

export function bakeReferenceFieldPixels(pixels, width, height, field, fieldSize) {
  for (let y = 0; y < height; y++) {
    const fieldY = Math.max(0, (y + .5) / height * fieldSize - .5);
    const firstY = Math.floor(fieldY), nextY = Math.min(fieldSize - 1, firstY + 1), fy = fieldY - firstY;
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const fieldX = Math.max(0, (x + .5) / width * fieldSize - .5);
      const firstX = Math.floor(fieldX), nextX = Math.min(fieldSize - 1, firstX + 1), fx = fieldX - firstX;
      const a = (firstY * fieldSize + firstX) * 4, b = (firstY * fieldSize + nextX) * 4;
      const c = (nextY * fieldSize + firstX) * 4, d = (nextY * fieldSize + nextX) * 4;
      const worn = ((field[a] * (1 - fx) + field[b] * fx) * (1 - fy) + (field[c] * (1 - fx) + field[d] * fx) * fy) / 255;
      const shaded = ((field[a + 1] * (1 - fx) + field[b + 1] * fx) * (1 - fy) + (field[c + 1] * (1 - fx) + field[d + 1] * fx) * fy) / 255;
      let red = linear[pixels[index]], green = linear[pixels[index + 1]], blue = linear[pixels[index + 2]];
      const greenMask = smooth(.01, .055, green - Math.max(red, blue))
        * smooth(.22, .4, (green - Math.min(red, blue)) / Math.max(green, .001));
      red *= 1 - greenMask * .26; green *= 1 - greenMask * .16; blue *= 1 - greenMask * .06;
      const markings = smooth(.38, .7, Math.min(red, green, blue));
      const wear = worn * .90 * (1 - markings);
      red += (.29 - red) * wear; green += (.22 - green) * wear; blue += (.13 - blue) * wear;
      const shadow = shaded * .83;
      red *= 1.08 + (.30 - 1.08) * shadow;
      green *= 1.06 + (.43 - 1.06) * shadow;
      blue *= .98 + (.46 - .98) * shadow;
      pixels[index] = signal[Math.min(4096, Math.round(red * 4096))];
      pixels[index + 1] = signal[Math.min(4096, Math.round(green * 4096))];
      pixels[index + 2] = signal[Math.min(4096, Math.round(blue * 4096))];
    }
  }
  return pixels;
}

