// Shape the existing Vanguard parts together so glass, trim and lamps stay joined.
// Coordinates are gameplay units, before the loader's -17 body-height offset.
const smooth = (a, b, value) => {
  const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function shapeVanguard(body, wheels, fennec, { Box3, Vector3 }) {
  const wheelCenters = wheels.map(wheel => new Box3().setFromObject(wheel, true).getCenter(new Vector3()));
  const reshape = (x, y, z) => {
    const cabin = smooth(30, 46, y);
    const cabinShift = -3 - 8 * smooth(-45, 12, x);
    const hood = smooth(5, 35, x) * smooth(23, 34, y);
    const belt = smooth(28, 36, y) * (1 - smooth(39, 49, y));
    return [x + cabin * cabinShift, y - 3 * hood - 2 * belt,
      z * (1 - .23 * smooth(29, 43, y))];
  };
  const dx = new Vector3(), dy = new Vector3(), dz = new Vector3();
  const normal = new Vector3(), term = new Vector3(), minus = new Vector3();
  for (const mesh of body.children) {
    const positions = mesh.geometry.attributes.position;
    const normals = mesh.geometry.attributes.normal;
    const ao = mesh.geometry.attributes._pearl_ao;
    const glass = /Glass/i.test(mesh.name);
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
      // Transform the authored shading normals with the same deformation.
      // Recalculating them across split UV vertices creates false hard seams.
      const h = .01;
      dx.fromArray(reshape(x + h, y, z)).sub(minus.fromArray(reshape(x - h, y, z)));
      dy.fromArray(reshape(x, y + h, z)).sub(minus.fromArray(reshape(x, y - h, z)));
      dz.fromArray(reshape(x, y, z + h)).sub(minus.fromArray(reshape(x, y, z - h)));
      normal.crossVectors(dy, dz).multiplyScalar(normals.getX(i));
      normal.add(term.crossVectors(dz, dx).multiplyScalar(normals.getY(i)));
      normal.add(term.crossVectors(dx, dy).multiplyScalar(normals.getZ(i))).normalize();
      normals.setXYZ(i, normal.x, normal.y, normal.z);
      if (ao) {
        // Baked shadows belong to the original tire sizes. Fade their imprint
        // around the new wheels; glass should not carry painted-on occlusion.
        const distance = Math.min(...wheelCenters.map(c => Math.hypot(x - c.x, y - c.y, z - c.z)));
        const fade = glass ? 1 : .8 * (1 - smooth(22, 34, distance));
        ao.setX(i, ao.getX(i) + (1 - ao.getX(i)) * fade);
      }
      positions.setXYZ(i, ...reshape(x, y, z));
    }
    positions.needsUpdate = true;
    normals.needsUpdate = true;
    if (ao) ao.needsUpdate = true;
    mesh.geometry.computeBoundingBox();
    mesh.geometry.computeBoundingSphere();
  }

  // Keep the agreed overall dimensions while matching the Fennec body envelope.
  const source = new Box3().setFromObject(body, true);
  const target = new Box3().setFromObject(fennec.body, true);
  target.translate(new Vector3(0, 17, 0));
  const scale = target.getSize(new Vector3()).divide(source.getSize(new Vector3()));
  const offset = target.getCenter(new Vector3()).sub(source.getCenter(new Vector3()).multiply(scale));
  for (const mesh of body.children) {
    mesh.geometry.scale(scale.x, scale.y, scale.z);
    mesh.geometry.translate(offset.x, offset.y, offset.z);
  }

  wheels.forEach((wheel, i) => {
    const bounds = new Box3().setFromObject(wheel, true);
    const center = bounds.getCenter(new Vector3());
    const targetSize = new Box3().setFromObject(fennec.wheels[i], true).getSize(new Vector3());
    const scale = targetSize.divide(bounds.getSize(new Vector3()));
    const [x, z] = fennec.wheelSpecs[i];
    const y = [12.5, 12.5, 15, 15][i] + fennec.wheelOffsets[i];
    for (const mesh of wheel.children) {
      mesh.geometry.translate(-center.x, -center.y, -center.z);
      mesh.geometry.scale(scale.x, scale.y, scale.z);
      mesh.geometry.translate(x, y, z);
    }
  });
}
