// Build-specific config ABI, checked against the preserved native constructor.
export function encodeCarConfig(config) {
  const bytes = new Uint8Array(104);
  const data = new DataView(bytes.buffer);
  const put = (offset, value) => {
    if (!Number.isFinite(value)) throw new TypeError("Nonfinite config field");
    data.setFloat32(offset, value, true);
  };
  const vec = (offset, values) => {
    if (!Array.isArray(values) || values.length !== 3) throw new TypeError("Expected XYZ vector");
    values.forEach((value, index) => put(offset + index * 4, value));
  };
  if (!config.fullSize.every((x) => x > 0)) throw new RangeError("Hitbox dimensions must be positive");
  vec(0, config.fullSize);
  vec(16, config.offset);
  for (const [offset, wheel] of [[32, config.frontWheel], [64, config.rearWheel]]) {
    if (!(wheel.radius > 0 && wheel.suspensionRestLength > 0)) throw new RangeError("Invalid wheel dimensions");
    put(offset, wheel.radius);
    put(offset + 4, wheel.suspensionRestLength);
    vec(offset + 16, wheel.connectionXYZ);
  }
  // Four-wheel regular families only. This is not Psyclops support.
  bytes[96] = 0;
  put(100, 0.5);
  return bytes;
}

// Use ONLY with buildConfigPatch output; old engines interpret negatives as Octane.
export function addConfiguredCar(core, team, config) {
  if (typeof core._experimentalAddConfiguredCar !== "function") throw new Error("Constructor extension unavailable");
  if (team !== 0 && team !== 1) throw new RangeError("Expected team 0 or 1");
  const bytes = encodeCarConfig(config);
  const ptr = core._malloc(bytes.length);
  if (!ptr || ptr > 0x7fffffff) throw new Error("Invalid configuration allocation");
  try {
    core.HEAPU8.set(bytes, ptr);
    const index = core._experimentalAddConfiguredCar(team, -ptr);
    if (index < 0) throw new Error("Native car creation failed");
    return index;
  } finally {
    core._free(ptr); // Native constructor copied the config before returning.
  }
}

export function readNativeCarConfig(core, index) {
  const ptr = core._physics_getCarConfig(index);
  if (!ptr) throw new Error(`Missing native car configuration: ${index}`);
  const data = Array.from(new Float32Array(core.HEAPF32.buffer, ptr, 26));
  if (!data.every(Number.isFinite)) throw new Error("Invalid native configuration values");
  return { fullSize: data.slice(0, 3), offset: data.slice(3, 6),
    wheels: Array.from({ length: 4 }, (_, wheel) => {
      const start = 6 + wheel * 5;
      return { connectionXYZ: data.slice(start, start + 3), radius: data[start + 3], suspensionRestLength: data[start + 4] };
    }) };
}
