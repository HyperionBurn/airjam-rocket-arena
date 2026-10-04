// Fit a donor's four centered wheel assemblies to another car's centered wheels.
// Axle positions, ride height and animation metadata stay owned by the recipient.
export function fitSharedWheels(wheels, donorWheels, { Box3, Vector3 }) {
  wheels.forEach((wheel, index) => {
    const target = new Box3().setFromObject(wheel, true);
    const center = target.getCenter(new Vector3());
    const size = target.getSize(new Vector3());
    const donor = donorWheels[index];
    const sourceBounds = new Box3().setFromObject(donor, true);
    const sourceCenter = sourceBounds.getCenter(new Vector3());
    const sourceSize = sourceBounds.getSize(new Vector3());
    // Scale the tire radially as one circle; width can vary with the wheel well.
    const radialScale = size.y / sourceSize.y;
    const widthScale = size.z / sourceSize.z;
    wheel.clear();
    for (const source of donor.children) {
      const mesh = source.clone();
      mesh.geometry = source.geometry.clone();
      mesh.geometry.translate(-sourceCenter.x, -sourceCenter.y, -sourceCenter.z);
      mesh.geometry.scale(radialScale, radialScale, widthScale);
      mesh.geometry.translate(center.x, center.y, center.z);
      wheel.add(mesh);
    }
  });
}
