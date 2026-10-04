export const ORIGINAL_CORE_SHA256 = "fbb58ef4f98227ed2e1ea15513eacc4d9dbe702748f429913a0f4fff43d7bcc8";
export const EXPERIMENTAL_CORE_SHA256 = "078235d312ab7e444936abaa701d7d2e7dd27752d0417713ea0936980b012f4e";
export const EXPERIMENTAL_CORE_URL = "/physics/constructor-config-v1.wasm";

export async function initializePhysics(factory, selection, {
  fetchBytes = async () => {
    const response = await fetch(EXPERIMENTAL_CORE_URL, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Experimental physics asset unavailable (HTTP ${response.status})`);
    return new Uint8Array(await response.arrayBuffer());
  },
  digest = async (bytes) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
    (value) => value.toString(16).padStart(2, "0")).join(""),
} = {}) {
  if (selection.engine === "original") return factory();
  if (selection.engine !== "experimental") throw new Error("Unsupported physics mode");
  const bytes = await fetchBytes();
  if (await digest(bytes) !== EXPERIMENTAL_CORE_SHA256) throw new Error("Experimental physics integrity check failed; return to Original mode");
  // Compile/verify before entering the loader callback, avoiding a pending startup promise.
  const compiled = await WebAssembly.compile(bytes);
  if (!WebAssembly.Module.exports(compiled).some((entry) => entry.name === "car_config_extension_v1" && entry.kind === "function")) {
    throw new Error("Experimental constructor extension is missing");
  }
  let constructor;
  const core = await factory({ instantiateWasm(imports, receive) {
    const instance = new WebAssembly.Instance(compiled, imports);
    constructor = instance.exports.car_config_extension_v1;
    receive(instance);
    return instance.exports;
  } });
  core._experimentalAddConfiguredCar = constructor;
  return core;
}
