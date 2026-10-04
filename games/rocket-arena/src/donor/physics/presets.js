// RocketSim constructor dimensions, NOT the differently reported measurement extents.
// Pinned source: c2baacb8f4b441dd8505e63c2aeb5a1679b60b02, CarConfig.cpp.
export const PHYSICS_REFERENCE_COMMIT = "c2baacb8f4b441dd8505e63c2aeb5a1679b60b02";
const rows = {
  octane: [[120.507,86.6994,38.6591],[13.8757,0,20.755],[51.25,25.9,20.755],[-33.75,29.5,20.755],12.5,15,38.755,37.055],
  dominus: [[130.427,85.7799,33.8],[9,0,15.75],[50.3,31.1,15.75],[-34.75,33,15.75],12,13.5,33.95,33.85],
  plank: [[131.32,87.1704,31.8944],[9.00857,0,12.0942],[49.97,27.8,12.0942],[-35.43,20.28,12.0942],12.5,17,31.9242,27.9242],
  breakout: [[133.992,83.021,32.8],[12.5,0,11.75],[51.5,26.67,11.75],[-35.75,35,11.75],13.5,15,29.7,29.666],
  hybrid: [[129.519,84.6879,36.6591],[13.8757,0,20.755],[51.25,25.9,20.755],[-34,29.5,20.755],12.5,15,38.755,37.055],
  merc: [[123.22,79.2103,44.1591],[11.3757,0,21.505],[51.25,25.9,21.505],[-33.75,29.5,21.505],15,15,39.505,39.105],
};
export const PHYSICS_PRESETS = Object.freeze(Object.fromEntries(Object.entries(rows).map(([name, row]) => {
  const [size, offset, front, rear, fr, rr, fs, rs] = row;
  return [name, Object.freeze({ fullSize: Object.freeze(size), offset: Object.freeze(offset),
    frontWheel: Object.freeze({ connectionXYZ: Object.freeze(front), radius: fr, suspensionRestLength: fs }),
    rearWheel: Object.freeze({ connectionXYZ: Object.freeze(rear), radius: rr, suspensionRestLength: rs }), mirrorWheelY: true })];
})));

// Visual bodies do not define collision geometry. Vanguard intentionally uses
// the exact same native Octane-family configuration as Fennec.
export const VISUAL_HITBOX_FAMILIES = Object.freeze({
  fennec: "octane",
  challenger: "dominus",
  amethyst: "octane",
  volt: "octane",
  crimson: "octane",
  "specter-2": "octane",
  spectre: "octane",
  tripo: "octane",
  "octane-original": "octane",
  vanguard: "octane",
  "vanguard-original": "octane",
  vesper: "octane",
  chicky: "octane",
  octane: "octane",
  "flat-car": "dominus",
});

export const resolveVisualHitboxFamily = visual => VISUAL_HITBOX_FAMILIES[visual] ?? "octane";

export function resolvePhysicsSelection(search, visual = "game-car") {
  const params = new URLSearchParams(search);
  const engine = params.get("physics") ?? "experimental";
  if (!["original", "experimental"].includes(engine)) throw new Error("Unknown physics mode; choose original or experimental");
  const requestedFamily = engine === "experimental" ? (params.get("hitbox") ?? "auto") : "auto";
  if (requestedFamily !== "auto" && !Object.hasOwn(PHYSICS_PRESETS, requestedFamily)) throw new Error("Unknown experimental hitbox family");
  const visualFamily = resolveVisualHitboxFamily(visual);
  return Object.freeze({ engine, requestedFamily, family: requestedFamily === "auto" ? visualFamily : requestedFamily, visualFamily });
}

export function physicsModeURL(href, engine, family = "auto") {
  const url = new URL(href);
  if (engine === "original") {
    url.searchParams.set("physics", "original"); url.searchParams.delete("hitbox");
  } else {
    resolvePhysicsSelection(`physics=${encodeURIComponent(engine)}&hitbox=${encodeURIComponent(family)}`);
    url.searchParams.set("physics", engine); url.searchParams.set("hitbox", family);
  }
  return url.href;
}
