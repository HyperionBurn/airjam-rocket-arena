// AIR JAM PATCH (new file, not in the upstream donor).
//
// Split-screen tiling, kept free of Three.js / DOM / WASM so it is unit-testable.

/** Gap-free tiling: rows of up to `cols` cells, each row split evenly. */
export function tileViewports(count, width, height) {
  if (count <= 0) return [];
  const W = Math.max(1, Math.floor(width));
  const H = Math.max(1, Math.floor(height));
  const landscape = W >= H;
  // 1 -> 1x1, 2 -> side by side (or stacked when portrait), 3-4 -> 2 per row, 5-6 -> 3 per row.
  const perLine = count <= 2 ? (landscape ? count : 1) : count <= 4 ? 2 : 3;
  const lines = Math.ceil(count / perLine);
  const rects = [];
  for (let line = 0; line < lines; line++) {
    const inLine = Math.min(perLine, count - line * perLine);
    const y0 = Math.round((H * line) / lines);
    const y1 = Math.round((H * (line + 1)) / lines);
    for (let cell = 0; cell < inLine; cell++) {
      const x0 = Math.round((W * cell) / inLine);
      const x1 = Math.round((W * (cell + 1)) / inLine);
      rects.push({ x: x0, y: y0, width: x1 - x0, height: y1 - y0 });
    }
  }
  return rects;
}
