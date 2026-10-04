// Stable key for offline index-only LODs. Original vertex attributes stay shared.
export function propGeometryKey(positions) {
  const packed = new Float32Array(positions);
  const bits = new Uint32Array(packed.buffer);
  let hash = 2166136261;
  for (const value of bits) hash = Math.imul(hash ^ value, 16777619) >>> 0;
  return `${packed.length}:${hash}`;
}

// Two instanced draws per material/sector at most, rather than one draw per bush.
// The hysteresis band avoids switching repeatedly at the distance boundary.
export function createDistantPropBatch(T, geometry, distantGeometry, material, matrices, { potatoDensity = 1 } = {}) {
  const near = new T.InstancedMesh(geometry, material, matrices.length);
  const far = new T.InstancedMesh(distantGeometry, material, matrices.length);
  for (const mesh of [near, far]) {
    matrices.forEach((matrix, i) => mesh.setMatrixAt(i, matrix));
    mesh.computeBoundingSphere(); mesh.computeBoundingBox();
    mesh.matrixAutoUpdate = false; mesh.castShadow = mesh.receiveShadow = false;
    mesh.userData.visualOnly = true;
  }
  far.count = 0; far.visible = false;
  const levels = new Uint8Array(matrices.length);
  let previousPreset = 'high';
  const update = (position, preset = 'high') => {
    // Boolean callers retain the previous reduced-scenery behavior.
    preset = preset === true ? 'balanced' : preset === false ? 'high' : preset;
    const reduced = preset !== 'high';
    const density = preset === 'potato' && potatoDensity < 1 ? .5 : potatoDensity;
    // Reduced geometry is camera-independent; do no per-instance frame work.
    if (reduced && previousPreset === preset) return;
    let changed = preset !== previousPreset;
    previousPreset = preset;
    for (let i = 0; i < matrices.length; i++) {
      const matrix = matrices[i].elements;
      const distanceSquared = (matrix[12] - position.x) ** 2 + (matrix[13] - position.y) ** 2 + (matrix[14] - position.z) ** 2;
      const threshold = levels[i] === 1 ? 4500 : 5000;
      // Distribute omissions across each sector, retaining its first silhouette.
      const keep = Math.ceil((i + 1) * density) > Math.ceil(i * density);
      const level = reduced ? (keep ? 1 : 2) : distanceSquared > threshold * threshold ? 1 : 0;
      if (level !== levels[i]) { levels[i] = level; changed = true; }
    }
    if (!changed) return;
    near.count = far.count = 0;
    matrices.forEach((matrix, i) => {
      if (levels[i] === 2) return;
      const mesh = levels[i] ? far : near;
      mesh.setMatrixAt(mesh.count++, matrix);
    });
    near.visible = near.count > 0; far.visible = far.count > 0;
    near.instanceMatrix.needsUpdate = far.instanceMatrix.needsUpdate = true;
    // Bounds already enclose every possible instance; no per-frame bounds work.
  };
  return { near, far, update };
}
