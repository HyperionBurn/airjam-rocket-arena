// Full, editable gameplay engine. Legacy WASM is used only for the existing camera.
export const SOURCE_CORE_SHA256 = "4d3b9c9f2c2227bc72d292fb5f294ab1f435e34b8ac8300527ee9d833a829405";
export const SOURCE_CORE_REVISION = "c2baacb8f4b441dd8505e63c2aeb5a1679b60b02";
export const ORIGINAL_GAMEPLAY_CORE_SHA256 = "b66ba712456de771c38b587d21e31ac20cc11d94cb3876adbf81e1362ff66426";
export async function initializeOriginalPhysics(factory, {
  fetchOriginalBytes = async () => {
    const response = await fetch("/physics/original-launch.wasm", { cache: "no-cache" });
    if (!response.ok) throw Error(`Original physics unavailable (HTTP ${response.status})`);
    return new Uint8Array(await response.arrayBuffer());
  },
} = {}) {
  const bytes = await fetchOriginalBytes();
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), v => v.toString(16).padStart(2, "0")).join("");
  if (hash !== ORIGINAL_GAMEPLAY_CORE_SHA256) throw Error("Original physics integrity check failed");
  // This copied loader ignores wasmBinary; use its supported instantiation hook.
  const compiled = await WebAssembly.compile(bytes);
  let used = false;
  const core = await factory({ instantiateWasm(imports, receive) {
    const instance = new WebAssembly.Instance(compiled, imports);
    used = true;
    receive(instance);
    return instance.exports;
  } });
  if (!used) throw Error("Original loader did not install the corrected gameplay core");
  return core;
}
export async function initializeGameplayPhysics(factory, selection, dependencies) {
  if(selection.engine === "original") return initializeOriginalPhysics(factory, dependencies);
  if(selection.engine !== "experimental") throw Error("Unsupported physics mode");
  return initializeSourcePhysics(factory, dependencies);
}
export async function initializeSourcePhysics(cameraFactory, {
  fetchBytes = async () => {
    const response = await fetch("/physics/rocketsim-core.wasm", { cache: "no-cache" });
    if (!response.ok) throw Error(`RocketSim physics unavailable (HTTP ${response.status})`);
    return new Uint8Array(await response.arrayBuffer());
  },
  loadFactory = async () => (await import("/physics/rocketsim-core.js")).default,
  expectedHash = SOURCE_CORE_SHA256,
  digest = async bytes => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes)),v=>v.toString(16).padStart(2,"0")).join(""),
} = {}) {
  const bytes = await fetchBytes();
  if(await digest(bytes)!==expectedHash) throw Error("RocketSim physics integrity check failed; Original is still available.");
  const factory = await loadFactory();
  const core = await factory({ wasmBinary: bytes });
  if(core._physics_sourceVersion?.()!==1) throw Error("Unsupported RocketSim application ABI");
  core._experimentalAddConfiguredCar = core._physics_addConfiguredCar;
  const camera = await cameraFactory();
  const viewPtr = core._malloc(42*8);
  if(!viewPtr) throw Error("Could not allocate camera bridge");
  core._v0 = () => viewPtr;
  core._v1 = () => {
    const input = new Float64Array(core.HEAPF64.buffer,viewPtr,42);
    new Float64Array(camera.HEAPF64.buffer,camera._v0(),42).set(input);
    camera._v1();
    input.set(new Float64Array(camera.HEAPF64.buffer,camera._v0(),42));
  };
  core._v2 = () => camera._v2();
  return core;
}
