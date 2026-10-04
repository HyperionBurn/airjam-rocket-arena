// Diagnostic geometry only: native X/Y/Z maps to render X/Z/Y without scaling.
export function applyNativeHitbox(T, outline, config) {
  const [length, width, height] = config.fullSize;
  const box = new T.BoxGeometry(length, height, width);
  const edges = new T.EdgesGeometry(box);
  box.dispose();
  outline.geometry.dispose();
  outline.geometry = edges;
  outline.position.set(config.offset[0], config.offset[2], config.offset[1]);
}

export function createNativeWheelDiagnostics(T, config) {
  const root = new T.Group();
  root.name = "native-pivot-and-wheels";
  const lines = new T.BufferGeometry();
  // Three pivot axes plus four wheel rays. Colors distinguish them from car visuals.
  const values = new Float32Array(7 * 6);
  values.set([0,0,0,25,0,0, 0,0,0,0,25,0, 0,0,0,0,0,25]);
  lines.setAttribute("position", new T.Float32BufferAttribute(values, 3));
  const material = new T.LineBasicMaterial({ color: 0xffbd65, depthTest: false, transparent: true, opacity: 0.85 });
  const rays = new T.LineSegments(lines, material);
  rays.frustumCulled = false; rays.renderOrder = 101; root.add(rays);
  const wheels = config.wheels.map((wheel) => {
    const sphere = new T.SphereGeometry(wheel.radius, 8, 6);
    const edges = new T.EdgesGeometry(sphere); sphere.dispose();
    const mesh = new T.LineSegments(edges, material);
    mesh.name = "native-wheel-radius-guide";
    mesh.renderOrder = 101; root.add(mesh); return mesh;
  });
  root.userData.nativeDiagnostics = { rays, wheels, config };
  return root;
}

export function updateNativeWheelDiagnostics(root, state, carOffset, wheelOffset, stride = 3) {
  if (!root.visible) return;
  const { rays, wheels, config } = root.userData.nativeDiagnostics;
  const points = rays.geometry.attributes.position;
  config.wheels.forEach((wheel, index) => {
    const [x, y, z] = wheel.connectionXYZ;
    const hubZ = z - state[carOffset + wheelOffset + index * stride];
    wheels[index].position.set(x, hubZ, y);
    points.setXYZ(6 + index * 2, x, z, y);
    points.setXYZ(7 + index * 2, x, hubZ - wheel.radius, y);
  });
  points.needsUpdate = true;
}

export function disposeNativeWheelDiagnostics(root) {
  if (!root) return;
  const materials = new Set();
  root.traverse((object) => { object.geometry?.dispose(); if (object.material) materials.add(object.material); });
  for (const material of materials) material.dispose();
  root.removeFromParent();
}
