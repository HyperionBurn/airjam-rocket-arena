/**
 * Scoped vitest config for the match worker's own unit tests.
 *
 * WHY THIS FILE EXISTS: the package-level `vitest.config.mjs` restricts
 * `test.include` to `tests/**`, so it can never collect the match tests that
 * live under `src/match/__tests__/`. That config is a SHARED file owned by
 * another worker, so this worker must not edit it — hence a local config,
 * run with `--config`.
 *
 * Run only these tests with:
 *   pnpm --filter rocket-arena exec vitest run --config src/match/vitest.config.mts
 *
 * `environment: "node"` is deliberate: the match core is DOM-free, Three-free
 * and WASM-free, so if a test needs a `document` or a `window` that is a bug in
 * the module under test, not a missing browser environment.
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/match/__tests__/**/*.test.ts"],
  },
});
