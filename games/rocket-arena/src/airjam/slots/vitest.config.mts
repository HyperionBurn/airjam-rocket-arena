/**
 * Scoped vitest config for the slots worker's own unit tests.
 *
 * WHY THIS FILE EXISTS: the package-level `vitest.config.mjs` restricts
 * `test.include` to `tests/**`, so it can never collect the slots tests that
 * live under `src/airjam/slots/__tests__/`. That config is a SHARED file owned
 * by another worker, so this worker must not edit it — hence a local config
 * instead, run with `--config`.
 *
 * Run only these tests with:
 *   pnpm --filter rocket-arena exec vitest run --config src/airjam/slots/vitest.config.mts
 *
 * `environment: "node"` is deliberate: the slots core is DOM-free, Three-free
 * and WASM-free, so if a test needs a `document` or `window` that is a bug in
 * the module under test, not a missing browser environment.
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/airjam/slots/__tests__/**/*.test.ts"],
  },
});
