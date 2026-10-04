const smooth = value => value * value * (3 - 2 * value);

function localBounds(root, yOffset = 0) {
  const bounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, minZ: Infinity, maxZ: -Infinity };
  for (const mesh of root.children) {
    const position = mesh.geometry?.attributes.position;
    if (!position) continue;
    for (let i = 0; i < position.count; i++) {
      bounds.minX = Math.min(bounds.minX, position.getX(i));
      bounds.maxX = Math.max(bounds.maxX, position.getX(i));
      bounds.minY = Math.min(bounds.minY, position.getY(i) + yOffset);
      bounds.maxY = Math.max(bounds.maxY, position.getY(i) + yOffset);
      bounds.minZ = Math.min(bounds.minZ, position.getZ(i));
      bounds.maxZ = Math.max(bounds.maxZ, position.getZ(i));
    }
  }
  const length = bounds.maxX - bounds.minX;
  const sections = {
    rear: { minY: Infinity, maxY: -Infinity, minZ: Infinity, maxZ: -Infinity },
    front: { minY: Infinity, maxY: -Infinity, minZ: Infinity, maxZ: -Infinity },
  };
  for (const mesh of root.children) {
    const position = mesh.geometry?.attributes.position;
    if (!position) continue;
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i), t = (x - bounds.minX) / length;
      const section = t <= .2 ? sections.rear : t >= .8 ? sections.front : null;
      if (!section) continue;
      const y = position.getY(i) + yOffset, z = position.getZ(i);
      section.minY = Math.min(section.minY, y); section.maxY = Math.max(section.maxY, y);
      section.minZ = Math.min(section.minZ, z); section.maxZ = Math.max(section.maxZ, z);
    }
  }
  return { ...bounds, length, ...sections };
}

const endTransform = (source, target) => {
  const scaleY = (target.maxY - target.minY) / (source.maxY - source.minY);
  const scaleZ = (target.maxZ - target.minZ) / (source.maxZ - source.minZ);
  return {
    scaleY, scaleZ,
    offsetY: target.minY - source.minY * scaleY,
    offsetZ: target.minZ - source.minZ * scaleZ,
  };
};

export function measureEndProportions(body, yOffset = 0) {
  const { front, rear } = localBounds(body, yOffset);
  const size = section => ({ height: section.maxY - section.minY, width: section.maxZ - section.minZ });
  return { front: size(front), rear: size(rear) };
}

export function matchFennecEndProportions(body, fennecBody) {
  const source = localBounds(body);
  // Loaded Fennec body geometry has already received the standard -17 ride offset.
  const target = localBounds(fennecBody, 17);
  const rear = endTransform(source.rear, target.rear);
  const front = endTransform(source.front, target.front);
  for (const mesh of body.children) {
    const position = mesh.geometry?.attributes.position;
    if (!position) continue;
    const normal = mesh.geometry.attributes.normal;
    if (mesh.material?.uniforms?.uSpectreBody?.value === 1) {
      const surface = position.clone();
      for (let i = 0; i < surface.count; i++) surface.setY(i, surface.getY(i) - 17);
      mesh.geometry.setAttribute('_surface_position', surface);
      mesh.material.uniforms.uHasSurfacePosition.value = 1;
    }
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i), t = (x - source.minX) / source.length;
      const blend = smooth(Math.max(0, Math.min(1, (t - .2) / .6)));
      const scaleY = rear.scaleY + (front.scaleY - rear.scaleY) * blend;
      const scaleZ = rear.scaleZ + (front.scaleZ - rear.scaleZ) * blend;
      const offsetY = rear.offsetY + (front.offsetY - rear.offsetY) * blend;
      const offsetZ = rear.offsetZ + (front.offsetZ - rear.offsetZ) * blend;
      const y = Math.max(target.minY, Math.min(target.maxY, position.getY(i) * scaleY + offsetY));
      const z = Math.max(target.minZ, Math.min(target.maxZ, position.getZ(i) * scaleZ + offsetZ));
      position.setXYZ(i, x, y, z);
      if (normal) {
        const nx = normal.getX(i), ny = normal.getY(i) / scaleY, nz = normal.getZ(i) / scaleZ;
        const magnitude = Math.hypot(nx, ny, nz) || 1;
        normal.setXYZ(i, nx / magnitude, ny / magnitude, nz / magnitude);
      }
    }
    position.needsUpdate = true;
    if (normal) normal.needsUpdate = true;
    mesh.geometry.computeBoundingBox();
    mesh.geometry.computeBoundingSphere();
  }
}

export function matchFennecWheels(wheels, fennec, { Box3, Vector3 }) {
  wheels.forEach((wheel, index) => {
    const bounds = new Box3().setFromObject(wheel, true);
    const center = bounds.getCenter(new Vector3());
    const targetSize = new Box3().setFromObject(fennec.wheels[index], true).getSize(new Vector3());
    const scale = targetSize.divide(bounds.getSize(new Vector3()));
    const [x, z] = fennec.wheelSpecs[index];
    const y = [12.5, 12.5, 15, 15][index] + fennec.wheelOffsets[index];
    for (const mesh of wheel.children) {
      mesh.geometry.translate(-center.x, -center.y, -center.z);
      mesh.geometry.scale(scale.x, scale.y, scale.z);
      mesh.geometry.translate(x, y, z);
    }
  });
}
