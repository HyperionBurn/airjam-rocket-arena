export const REFERENCE_FIELD_SIZE = 512;
const FIELD_WIDTH = 8192, FIELD_LENGTH = 10240;
const smooth = (low, high, value) => {
  const t = Math.max(0, Math.min(1, (value - low) / (high - low)));
  return t * t * (3 - 2 * t);
};

// Cache the small noise lattices, rather than evaluating sin twelve times for
// every field texel. Red is stable wear; only green changes with the sun.
function noiseLattice(width, height) {
  const values = new Float32Array((width + 1) * (height + 1));
  for (let i = 0; i < values.length; i++) {
    let hash = Math.imul(i ^ 728193, 0x45d9f3b);
    hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
    values[i] = ((hash ^ (hash >>> 16)) >>> 0) / 4294967296;
  }
  return (u, v) => {
    const x = u * width, y = v * height, ix = Math.floor(x), iy = Math.floor(y);
    const fx = smooth(0, 1, x - ix), fy = smooth(0, 1, y - iy), i = iy * (width + 1) + ix;
    return (values[i] * (1 - fx) + values[i + 1] * fx) * (1 - fy)
      + (values[i + width + 1] * (1 - fx) + values[i + width + 2] * fx) * fy;
  };
}
let wear;
function fieldWear() {
  if (wear) return wear;
  const broad = noiseLattice(28, 35), medium = noiseLattice(83, 104), fine = noiseLattice(260, 325);
  wear = new Uint8Array(REFERENCE_FIELD_SIZE ** 2);
  for (let y = 0; y < REFERENCE_FIELD_SIZE; y++) {
    const v = (y + .5) / REFERENCE_FIELD_SIZE;
    const endWear = .45 + .55 * smooth(.12, .43, Math.abs(v - .5));
    for (let x = 0; x < REFERENCE_FIELD_SIZE; x++) {
      const u = (x + .5) / REFERENCE_FIELD_SIZE;
      const patches = broad(u, v) * .52 + medium(u, v) * .30 + fine(u, v) * .18;
      wear[y * REFERENCE_FIELD_SIZE + x] = Math.round(smooth(.49, .65, patches) * endWear * 255);
    }
  }
  return wear;
}

// Rasterize only the narrow band swept by a projected structure. The previous
// implementation measured every texel against every structure (46M distances).
function rasterShadow(bytes, start, end, width, opacity = 1) {
  const size = REFERENCE_FIELD_SIZE;
  const ax = (start[0] / FIELD_WIDTH + .5) * size, ay = (start[1] / FIELD_LENGTH + .5) * size;
  const bx = (end[0] / FIELD_WIDTH + .5) * size, by = (end[1] / FIELD_LENGTH + .5) * size;
  const vx = bx - ax, vy = by - ay, lengthSquared = vx * vx + vy * vy;
  const radius = width / FIELD_WIDTH * size, feather = 1.25, reach = radius + feather;
  const firstY = Math.max(0, Math.floor(Math.min(ay, by) - reach));
  const lastY = Math.min(size - 1, Math.ceil(Math.max(ay, by) + reach));
  for (let y = firstY; y <= lastY; y++) {
    const middle = Math.abs(vy) > .001 ? Math.max(0, Math.min(1, (y + .5 - ay) / vy)) : .5;
    const halfSpan = Math.abs(vy) > .001 ? reach * (1 + Math.abs(vx / vy)) : Math.abs(vx) * .5 + reach;
    const centerX = ax + vx * middle;
    const firstX = Math.max(0, Math.floor(centerX - halfSpan));
    const lastX = Math.min(size - 1, Math.ceil(centerX + halfSpan));
    for (let x = firstX; x <= lastX; x++) {
      const t = lengthSquared ? Math.max(0, Math.min(1, ((x + .5 - ax) * vx + (y + .5 - ay) * vy) / lengthSquared)) : 0;
      const dx = x + .5 - ax - vx * t, dy = y + .5 - ay - vy * t;
      const distanceSquared = dx * dx + dy * dy;
      if (distanceSquared >= reach * reach) continue;
      const strength = Math.round((1 - smooth(radius, reach, Math.sqrt(distanceSquared))) * opacity * 255);
      const index = (y * size + x) * 4 + 1;
      bytes[index] = Math.max(bytes[index], strength);
    }
  }
}

export function createReferenceFieldLight(direction) {
  const bytes = new Uint8Array(REFERENCE_FIELD_SIZE ** 2 * 4), markings = fieldWear();
  for (let i = 0; i < markings.length; i++) {
    bytes[i * 4] = markings[i]; bytes[i * 4 + 3] = 255;
  }
  const update = sunDirection => {
    const [lx, ly, lz] = sunDirection, dx = -lx / Math.max(.1, ly), dz = -lz / Math.max(.1, ly);
    for (let i = 1; i < bytes.length; i += 4) bytes[i] = 0;
    const project = (x, y, z) => [x + dx * y, z + dz * y];
    // Match the existing visual enclosure: seven curved posts per side.
    for (const side of [-1, 1]) {
      for (let z = -3900; z <= 3900; z += 1300) {
        let previous = project(side * 4240, 210, z);
        let next = project(side * 4240, 1750, z);
        rasterShadow(bytes, previous, next, 15); previous = next;
        for (let step = 1; step <= 6; step++) {
          const angle = step / 6 * Math.PI / 2;
          next = project(side * (3840 + 400 * Math.cos(angle)), 1750 + 400 * Math.sin(angle), z);
          rasterShadow(bytes, previous, next, 12); previous = next;
        }
      }
      for (let x = -2600; x <= 2600; x += 1300) if (x !== 0)
        rasterShadow(bytes, project(x, 280, side * 5320), project(x, 2040, side * 5320), 14);
      // Broad, soft shade from the existing perimeter boards.
      rasterShadow(bytes, project(side * 4245, 310, -4300), project(side * 4245, 310, 4300), 55, .68);
    }
  };
  update(direction);
  return { data: bytes, size: REFERENCE_FIELD_SIZE, update };
}
