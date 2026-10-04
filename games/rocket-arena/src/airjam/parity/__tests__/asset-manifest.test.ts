import { describe, expect, it } from "vitest";

import { PHYSICS_CORE_SHA256 } from "../baseline.js";
import {
  COLLISION_MANIFEST_PATHS,
  COLLISION_MESH_COUNT,
  REQUIRED_PHYSICS_ASSETS,
  checkRequiredPhysicsAssets,
  compareAssetInventories,
  normalizeAssetPath,
  type AssetInventory,
} from "../asset-manifest.js";

/**
 * A small stand-in for the real tree. It must be COMPLETE with respect to
 * `REQUIRED_PHYSICS_ASSETS`, otherwise the "all present" cases below would be
 * testing an empty basket rather than a working one.
 */
const donorTree: AssetInventory = Object.freeze([
  { path: "assets/menu/online.webp", bytes: 1024, sha256: "aaaa" },
  { path: "assets/menu/casual.webp", bytes: 2048, sha256: "bbbb" },
  { path: "assets/sketchfab/ball/model.glb", bytes: 4096, sha256: "cccc" },
  { path: "physics/rocketsim-core.js", bytes: 40_000, sha256: "glue1" },
  { path: "physics/rocketsim-core.wasm", bytes: 900_000, sha256: PHYSICS_CORE_SHA256 },
  { path: "physics/rocketsim-network.js", bytes: 20_000, sha256: "glue2" },
  { path: "physics/rocketsim-network.wasm", bytes: 300_000, sha256: "netwasm" },
  ...COLLISION_MANIFEST_PATHS.map((path, i) => ({
    path,
    bytes: 1000 + i,
    sha256: `mesh${i}`,
  })),
]);

const clone = (): AssetInventory =>
  donorTree.map((entry) => ({ ...entry }));

describe("compareAssetInventories — the identical case", () => {
  it("reports a byte-identical tree as identical", () => {
    const diff = compareAssetInventories(donorTree, clone());
    expect(diff.identical).toBe(true);
    expect(diff.missing).toEqual([]);
    expect(diff.extra).toEqual([]);
    expect(diff.sizeMismatch).toEqual([]);
    expect(diff.hashMismatch).toEqual([]);
    expect(diff.hashed).toBe(diff.shared);
  });

  it("normalises separators and leading ./ so one file is not two", () => {
    expect(normalizeAssetPath("assets\\menu\\online.webp")).toBe("assets/menu/online.webp");
    expect(normalizeAssetPath("./assets/menu/online.webp")).toBe("assets/menu/online.webp");
    const diff = compareAssetInventories(
      [{ path: "assets/menu/online.webp", bytes: 10, sha256: "x" }],
      [{ path: ".\\assets\\menu\\online.webp", bytes: 10, sha256: "x" }],
    );
    expect(diff.identical).toBe(true);
  });
});

describe("compareAssetInventories — a deliberately MISSING asset", () => {
  it("detects a file present in the donor and absent from the port", () => {
    const port = clone().filter((entry) => entry.path !== "assets/sketchfab/ball/model.glb");
    const diff = compareAssetInventories(donorTree, port);
    expect(diff.missing).toEqual(["assets/sketchfab/ball/model.glb"]);
    expect(diff.identical).toBe(false);
    expect(diff.portCount).toBe(donorTree.length - 1);
  });

  it("detects a missing collision mesh, which is a start-or-doom condition", () => {
    const port = clone().filter((entry) => entry.path !== "assets/arena/collision/mesh_7.cmf");
    const diff = compareAssetInventories(donorTree, port);
    expect(diff.missing).toContain("assets/arena/collision/mesh_7.cmf");
    expect(checkRequiredPhysicsAssets(port).canPhysicsInitialise).toBe(false);
  });

  it("detects a missing physics runtime file", () => {
    const port = clone().filter((entry) => entry.path !== "physics/rocketsim-core.wasm");
    const diff = compareAssetInventories(donorTree, port);
    expect(diff.missing).toEqual(["physics/rocketsim-core.wasm"]);
    const required = checkRequiredPhysicsAssets(port);
    expect(required.canPhysicsInitialise).toBe(false);
    expect(required.missing.some((m) => m.path === "physics/rocketsim-core.wasm")).toBe(true);
  });
});

describe("compareAssetInventories — a deliberately CORRUPTED asset", () => {
  it("detects a hash mismatch even when the byte count is unchanged", () => {
    // The dangerous case: a re-encode or a silent edit that keeps the size.
    const port = clone().map((entry) =>
      entry.path === "assets/menu/online.webp" ? { ...entry, sha256: "deadbeef" } : entry,
    );
    const diff = compareAssetInventories(donorTree, port);
    expect(diff.sizeMismatch).toEqual([]);
    expect(diff.hashMismatch).toHaveLength(1);
    expect(diff.hashMismatch[0]).toMatchObject({
      path: "assets/menu/online.webp",
      donorSha256: "aaaa",
      portSha256: "deadbeef",
    });
    expect(diff.identical).toBe(false);
  });

  it("detects a substituted core binary and says the physics cannot start", () => {
    const port = clone().map((entry) =>
      entry.path === "physics/rocketsim-core.wasm"
        ? { ...entry, sha256: "0".repeat(64) }
        : entry,
    );
    const diff = compareAssetInventories(donorTree, port);
    expect(diff.hashMismatch.map((h) => h.path)).toEqual(["physics/rocketsim-core.wasm"]);
    const required = checkRequiredPhysicsAssets(port);
    expect(required.canPhysicsInitialise).toBe(false);
    expect(required.coreSha256).toBe("0".repeat(64));
    expect(required.detail).toMatch(/Physics CANNOT initialise/);
  });

  it("detects a size difference on its own", () => {
    const port = clone().map((entry) =>
      entry.path === "assets/menu/casual.webp" ? { ...entry, bytes: 2047 } : entry,
    );
    const diff = compareAssetInventories(donorTree, port);
    expect(diff.sizeMismatch).toEqual([
      { path: "assets/menu/casual.webp", donorBytes: 2048, portBytes: 2047, deltaBytes: -1 },
    ]);
    expect(diff.hashMismatch).toEqual([]);
  });
});

describe("compareAssetInventories — extras, and honesty about what was compared", () => {
  it("flags a file the port has and the donor does not", () => {
    const port = [...clone(), { path: "assets/menu/port-only.webp", bytes: 10, sha256: "eeee" }];
    const diff = compareAssetInventories(donorTree, port);
    expect(diff.extra).toEqual(["assets/menu/port-only.webp"]);
    expect(diff.identical).toBe(false);
  });

  it("allows a NAMED extra without hiding it", () => {
    const port = [...clone(), { path: "assets/menu/port-only.webp", bytes: 10, sha256: "eeee" }];
    const diff = compareAssetInventories(donorTree, port, {
      allowExtra: ["assets/menu/port-only.webp"],
    });
    expect(diff.extra).toEqual([]);
    expect(diff.identicalExceptAllowedExtras).toBe(true);
    expect(diff.notes.join(" ")).toMatch(/allowed and none were present|1 extra path/);
  });

  it("refuses to claim `identical` from a size-only comparison", () => {
    // This is the honesty guard: equal sizes are not equal bytes, and a
    // manifest that cannot tell the difference must say so rather than pass.
    const unhashed: AssetInventory = donorTree.map((entry) => ({ path: entry.path, bytes: entry.bytes, sha256: null }));
    const diff = compareAssetInventories(unhashed, unhashed);
    expect(diff.sizeMismatch).toEqual([]);
    expect(diff.identical).toBe(false);
    expect(diff.hashed).toBe(0);
    expect(diff.notes.join(" ")).toMatch(/SIZE comparison only/);
  });

  it("warns when requireHash was asked for and could not be honoured", () => {
    const unhashed: AssetInventory = donorTree.map((entry) => ({ path: entry.path, bytes: entry.bytes, sha256: null }));
    const diff = compareAssetInventories(unhashed, unhashed, { requireHash: true });
    expect(diff.notes.join(" ")).toMatch(/requireHash was set/);
  });

  it("does not treat an empty comparison as identical", () => {
    expect(compareAssetInventories([], []).identical).toBe(false);
  });
});

describe("checkRequiredPhysicsAssets — the set the sim cannot start without", () => {
  it("expects all 16 collision meshes plus the manifest", () => {
    expect(COLLISION_MESH_COUNT).toBe(16);
    expect(COLLISION_MANIFEST_PATHS).toHaveLength(17);
    expect(COLLISION_MANIFEST_PATHS).toContain("assets/arena/collision/mesh_0.cmf");
    expect(COLLISION_MANIFEST_PATHS).toContain("assets/arena/collision/mesh_15.cmf");
    expect(COLLISION_MANIFEST_PATHS).toContain("assets/arena/collision/manifest.json");
  });

  it("passes a complete tree and reports the core hash it saw", () => {
    const report = checkRequiredPhysicsAssets(clone());
    expect(report.canPhysicsInitialise).toBe(true);
    expect(report.missing).toEqual([]);
    expect(report.coreSha256).toBe(PHYSICS_CORE_SHA256);
    expect(report.detail).toMatch(/All \d+ required physics assets are present/);
  });

  it("counts how many of the 17 collision files are absent, separately", () => {
    const port = clone().filter((entry) => !entry.path.startsWith("assets/arena/collision/mesh_"));
    const report = checkRequiredPhysicsAssets(port);
    expect(report.canPhysicsInitialise).toBe(false);
    expect(report.missing.filter((m) => m.path.includes("/mesh_"))).toHaveLength(16);
    expect(report.detail).toMatch(/16 of them collision geometry/);
  });

  it("lists every required asset as blocking", () => {
    for (const asset of REQUIRED_PHYSICS_ASSETS) {
      expect(asset.blocking, asset.path).toBe(true);
      expect(asset.requiredFor.length, asset.path).toBeGreaterThan(10);
    }
  });
});
