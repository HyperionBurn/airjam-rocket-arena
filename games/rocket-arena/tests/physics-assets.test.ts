/**
 * Guards the physics-critical half of the transplant.
 *
 * The donor resolves its assets by ABSOLUTE URL (`/assets/...`, `/physics/...`),
 * so `public/` has to be a verbatim copy of the donor's. If any of this drifts
 * the simulation silently fails to initialise at runtime, which is exactly the
 * failure this port is meant to de-risk, so it is worth pinning here.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const gameRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(gameRoot, "public");

const read = (relative: string) => readFileSync(path.join(publicDir, relative));
const sha256 = (relative: string) =>
  createHash("sha256").update(read(relative)).digest("hex");

/** Mirrors `SOURCE_CORE_SHA256` in `src/donor/physics/source-runtime.js`. */
const SOURCE_CORE_SHA256 =
  "4d3b9c9f2c2227bc72d292fb5f294ab1f435e34b8ac8300527ee9d833a829405";

describe("physics-critical public assets", () => {
  it("ships the RocketSim core at the absolute URL the donor fetches", () => {
    expect(existsSync(path.join(publicDir, "physics/rocketsim-core.wasm"))).toBe(true);
    expect(existsSync(path.join(publicDir, "physics/rocketsim-core.js"))).toBe(true);
  });

  it("keeps the RocketSim core byte-identical to the pinned revision", () => {
    // The donor hashes this file at runtime and refuses to run on a mismatch,
    // so a truncated or re-encoded copy fails the whole boot.
    expect(sha256("physics/rocketsim-core.wasm")).toBe(SOURCE_CORE_SHA256);
  });

  it("ships every collision mesh named by the arena manifest", () => {
    const manifest = JSON.parse(
      read("assets/arena/collision/manifest.json").toString("utf8"),
    ) as string[];
    expect(manifest).toHaveLength(16);
    for (const mesh of manifest) {
      expect(existsSync(path.join(publicDir, "assets/arena/collision", mesh))).toBe(
        true,
      );
    }
  });

  it("ships the park pitch the arena loads by absolute URL", () => {
    expect(
      existsSync(path.join(publicDir, "assets/arena/park/park-pitch-clean.webp")),
    ).toBe(true);
  });
});
