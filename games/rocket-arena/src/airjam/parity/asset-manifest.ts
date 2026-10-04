/**
 * Phase 9 — THE ASSET PARITY MANIFEST (pure).
 *
 * OWNER: the Phase 9 parity worker (`src/airjam/parity/**`).
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS CATCHES
 * ---------------------------------------------------------------------------
 * An asset regression is the quietest kind of port defect. A missing model
 * loads as `null`, the scene carries on without it, and the frame is subtly
 * emptier. A changed `.webp` is a different frame. A substituted
 * `rocketsim-core.wasm` is not a port at all. None of these raise an
 * exception, and none of them are visible to a physics test.
 *
 * So the manifest is a set comparison in BOTH directions plus a hash
 * comparison, and the two directions are not symmetric in severity:
 *
 *   missing   in the donor, absent in the port  -> a defect. The game needs it.
 *   extra     in the port, absent in the donor  -> also a defect, reported
 *              separately, because an unrequested extra is either a stale
 *              leftover or an asset the port invented. It is legal in exactly
 *              one case (see `allowExtra`).
 *   size/hash differ                          -> a defect.
 *
 * ---------------------------------------------------------------------------
 * HASHING IS OPTIONAL PER ENTRY, AND THE DEFAULT IS THE HONEST ONE
 * ---------------------------------------------------------------------------
 * `sha256` may be null, and `compareAssetInventories` then reports `hashed: 0`
 * rather than quietly reporting "identical". The inventory builder in
 * `_scratch/parity/inventory.mjs` hashes everything by default; a caller that
 * only lists paths and sizes gets a size comparison, and the report says so.
 * A size match on a 36 MB art tree is necessary but not sufficient, and this
 * module never claims otherwise.
 *
 * ---------------------------------------------------------------------------
 * THE PHYSICS SET IS SPECIAL: IT IS NOT OPTIONAL
 * ---------------------------------------------------------------------------
 * `assets/arena/collision/mesh_0..15.cmf` plus `manifest.json` are what the
 * WASM loads to build the arena. The sim cannot initialise without all 17, and
 * `physics/rocketsim-core.wasm` is hash-checked by the donor itself, which
 * throws on mismatch. Those are called out by `checkRequiredPhysicsAssets` so a
 * failure is reported as "the physics cannot start", which is a categorically
 * different failure from "a texture differs".
 */

import { PHYSICS_CORE_SHA256 } from "./baseline.js";

/* -------------------------------------------------------------------------- */
/* Inventory shape                                                             */
/* -------------------------------------------------------------------------- */

/** Paths are POSIX-style and relative to the inventory's root, e.g. `assets/menu/online.webp`. */
export interface AssetEntry {
  readonly path: string;
  readonly bytes: number;
  /** null when the inventory was built without hashing. Never a fake value. */
  readonly sha256: string | null;
}

export type AssetInventory = readonly AssetEntry[];

/** Normalise a path so `a\b`, `./a/b` and `a/b` are one key. Pure. */
export function normalizeAssetPath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\/+/, "");
}

const index = (inventory: AssetInventory): Map<string, AssetEntry> => {
  const map = new Map<string, AssetEntry>();
  for (const entry of inventory) {
    const key = normalizeAssetPath(entry.path);
    map.set(key, { ...entry, path: key });
  }
  return map;
};

/* -------------------------------------------------------------------------- */
/* The comparison                                                              */
/* -------------------------------------------------------------------------- */

export interface SizeMismatch {
  readonly path: string;
  readonly donorBytes: number;
  readonly portBytes: number;
  readonly deltaBytes: number;
}

export interface HashMismatch {
  readonly path: string;
  readonly donorSha256: string;
  readonly portSha256: string;
}

export interface AssetDiff {
  readonly donorCount: number;
  readonly portCount: number;
  /** Paths present in both. */
  readonly shared: number;
  /** Compared with a real hash, as opposed to a size comparison only. */
  readonly hashed: number;
  readonly missing: readonly string[];
  readonly extra: readonly string[];
  readonly sizeMismatch: readonly SizeMismatch[];
  readonly hashMismatch: readonly HashMismatch[];
  /** True only when nothing at all differs. A size-only comparison cannot set it... *unless* every shared path was hashed. */
  readonly identical: boolean;
  /**
   * True when the only differences are `extra` paths the caller allowed. Used
   * so a legitimately additive port is not reported as a failure while still
   * being visible in the output.
   */
  readonly identicalExceptAllowedExtras: boolean;
  readonly notes: readonly string[];
}

export interface CompareOptions {
  /**
   * Extra paths that are legitimately present only in the port. Named
   * explicitly — never a glob, never a prefix — so "we allowed extras" is a
   * reviewable list rather than a pattern that quietly swallows drift.
   */
  readonly allowExtra?: readonly string[];
  /**
   * Skip the size comparison and require a hash for every shared path. Use this
   * when the manifest is the gate rather than a first pass.
   */
  readonly requireHash?: boolean;
}

/**
 * Compare a donor inventory against a port inventory. Pure: no `fs`, no paths,
 * no ordering assumptions beyond what the two lists say.
 */
export function compareAssetInventories(
  donor: AssetInventory,
  port: AssetInventory,
  options: CompareOptions = {},
): AssetDiff {
  const donorIndex = index(donor);
  const portIndex = index(port);
  const allowed = new Set((options.allowExtra ?? []).map(normalizeAssetPath));

  const missing: string[] = [];
  const extra: string[] = [];
  const sizeMismatch: SizeMismatch[] = [];
  const hashMismatch: HashMismatch[] = [];
  const notes: string[] = [];
  let shared = 0;
  let hashed = 0;

  for (const [path, expected] of donorIndex) {
    const actual = portIndex.get(path);
    if (!actual) {
      missing.push(path);
      continue;
    }
    shared += 1;
    if (expected.bytes !== actual.bytes) {
      sizeMismatch.push(
        Object.freeze({
          path,
          donorBytes: expected.bytes,
          portBytes: actual.bytes,
          deltaBytes: actual.bytes - expected.bytes,
        }),
      );
    }
    if (expected.sha256 && actual.sha256) {
      hashed += 1;
      if (expected.sha256 !== actual.sha256) {
        hashMismatch.push(
          Object.freeze({ path, donorSha256: expected.sha256, portSha256: actual.sha256 }),
        );
      }
    }
  }

  for (const path of portIndex.keys()) {
    if (!donorIndex.has(path) && !allowed.has(path)) extra.push(path);
  }

  if (hashed === 0 && shared > 0) {
    notes.push(
      "No entry was hashed on both sides, so this was a SIZE comparison only. Equal sizes are not proof of equal bytes; re-run the inventory with hashing enabled before trusting `identical`.",
    );
  }
  if (options.requireHash && hashed < shared) {
    notes.push(
      `requireHash was set but only ${hashed} of ${shared} shared paths were hashed on both sides.`,
    );
  }
  if (allowed.size > 0 && extra.length === 0) {
    notes.push(`${allowed.size} extra path(s) were allowed and none were present.`);
  }

  const clean =
    missing.length === 0 &&
    extra.length === 0 &&
    sizeMismatch.length === 0 &&
    hashMismatch.length === 0;

  return Object.freeze({
    donorCount: donorIndex.size,
    portCount: portIndex.size,
    shared,
    hashed,
    missing: Object.freeze(missing.sort()),
    extra: Object.freeze(extra.sort()),
    sizeMismatch: Object.freeze(sizeMismatch.sort((a, b) => a.path.localeCompare(b.path))),
    hashMismatch: Object.freeze(hashMismatch.sort((a, b) => a.path.localeCompare(b.path))),
    identical: clean && hashed === shared && shared > 0,
    identicalExceptAllowedExtras: clean,
    notes: Object.freeze(notes),
  });
}

/* -------------------------------------------------------------------------- */
/* The set the physics cannot start without                                    */
/* -------------------------------------------------------------------------- */

/** 16 collision meshes, `mesh_0.cmf` through `mesh_15.cmf`, plus the manifest. */
export const COLLISION_MESH_COUNT = 16;

export const COLLISION_MANIFEST_PATHS: readonly string[] = Object.freeze([
  ...Array.from({ length: COLLISION_MESH_COUNT }, (_, i) => `assets/arena/collision/mesh_${i}.cmf`),
  "assets/arena/collision/manifest.json",
]);

/** The WASM files the donor loads by absolute URL at runtime. */
export const PHYSICS_RUNTIME_PATHS: readonly string[] = Object.freeze([
  "physics/rocketsim-core.js",
  "physics/rocketsim-core.wasm",
  "physics/rocketsim-network.js",
  "physics/rocketsim-network.wasm",
]);

export interface RequiredAsset {
  readonly path: string;
  readonly requiredFor: string;
  /** Set only where the exact bytes are authoritative. */
  readonly sha256?: string;
  readonly blocking: boolean;
}

const required = (
  path: string,
  requiredFor: string,
  sha256: string | undefined,
  blocking: boolean,
): RequiredAsset => Object.freeze({ path, requiredFor, sha256, blocking });

/** The four hard requirements, in the order a boot failure would hit them. */
export const REQUIRED_PHYSICS_ASSETS: readonly RequiredAsset[] = Object.freeze([
  required("physics/rocketsim-core.wasm", "RocketSim core; hash-verified by the donor, which throws on mismatch", PHYSICS_CORE_SHA256, true),
  ...PHYSICS_RUNTIME_PATHS.filter((p) => p !== "physics/rocketsim-core.wasm").map((p) =>
    required(p, "Emscripten glue / network build loaded by the donor at runtime", undefined, true),
  ),
  ...COLLISION_MANIFEST_PATHS.map((p) =>
    required(p, "arena collision geometry; the WASM cannot build the arena without all 17 files", undefined, true),
  ),
]);

export interface MissingRequiredAsset {
  readonly path: string;
  readonly requiredFor: string;
  readonly blocking: boolean;
  readonly detail: string;
}

export interface RequiredAssetsReport {
  readonly checked: number;
  readonly present: number;
  readonly missing: readonly MissingRequiredAsset[];
  /** Present, hash-bearing, and the hash disagrees with the recorded one. */
  readonly hashMismatch: readonly HashMismatch[];
  readonly canPhysicsInitialise: boolean;
  readonly coreSha256: string | null;
  readonly detail: string;
}

/**
 * Check one inventory against the set the physics cannot start without.
 *
 * Separate from `compareAssetInventories` on purpose. "The port has a different
 * menu illustration" and "the arena has no collision meshes" are not the same
 * event, and a single boolean that merged them would hide which one happened.
 */
export function checkRequiredPhysicsAssets(inventory: AssetInventory): RequiredAssetsReport {
  const index_ = index(inventory);
  const missing: MissingRequiredAsset[] = [];
  const hashMismatch: HashMismatch[] = [];
  let present = 0;
  let coreSha256: string | null = null;

  for (const asset of REQUIRED_PHYSICS_ASSETS) {
    const found = index_.get(normalizeAssetPath(asset.path));
    if (!found) {
      missing.push(
        Object.freeze({
          path: asset.path,
          requiredFor: asset.requiredFor,
          blocking: asset.blocking,
          detail: `absent from the inventory; ${asset.requiredFor}`,
        }),
      );
      continue;
    }
    present += 1;
    if (asset.path === "physics/rocketsim-core.wasm") coreSha256 = found.sha256;
    if (asset.sha256 && found.sha256 && found.sha256 !== asset.sha256) {
      hashMismatch.push(
        Object.freeze({ path: asset.path, donorSha256: asset.sha256, portSha256: found.sha256 }),
      );
    }
  }

  const collisionMissing = missing.filter((m) => m.path.startsWith("assets/arena/collision/")).length;
  const canInitialise = missing.length === 0 && hashMismatch.length === 0;
  const detail = canInitialise
    ? `All ${REQUIRED_PHYSICS_ASSETS.length} required physics assets are present, and rocketsim-core.wasm matches the recorded SHA-256.`
    : `Physics CANNOT initialise: ${missing.length} required asset(s) missing (${collisionMissing} of them collision geometry)${
        hashMismatch.length ? `, ${hashMismatch.length} hash mismatch(es)` : ""
      }.`;

  return Object.freeze({
    checked: REQUIRED_PHYSICS_ASSETS.length,
    present,
    missing: Object.freeze(missing),
    hashMismatch: Object.freeze(hashMismatch),
    canPhysicsInitialise: canInitialise,
    coreSha256,
    detail,
  });
}
