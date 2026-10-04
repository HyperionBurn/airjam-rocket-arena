/**
 * Test-only Vitest config for the Phase 2 input layer.
 *
 * WHY THIS FILE EXISTS. The package's shared Vitest `include` comes from
 * `createAirJamViteConfig({ profile: "three" })` in `vite.config.ts` and is
 * pinned to a `tests` top-level directory — outside this worker's ownership.
 * My tests live under `src/airjam/input/__tests__/`, which that pattern does
 * not match, and Vitest has no `--include` CLI flag. So the run command is:
 *
 *   npx --yes pnpm@9.9.0 --filter rocket-arena exec vitest run --config src/airjam/input/__tests__/vitest.config.ts
 *
 * This config deliberately declares NOTHING but the root and the include
 * pattern. It does not re-declare plugins or aliases: the input layer imports
 * nothing from the donor, React or the SDK, so it needs no transform pipeline
 * at all. That isolation is the point — if this layer ever grows a dependency
 * that needs Vite config, that is a design regression worth noticing.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/** `__tests__` -> `input` -> `airjam` -> `src` -> package root. */
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

export default defineConfig({
  test: {
    root: packageRoot,
    include: ["src/airjam/input/**/*.test.ts"],
    environment: "node",
  },
});
