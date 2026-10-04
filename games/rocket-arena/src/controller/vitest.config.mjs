/**
 * Test-only Vitest config for the phone controller.
 *
 * WHY THIS FILE EXISTS. The package's shared Vitest `include` (in
 * `vitest.config.mjs`, owned by the orchestrator) is pinned to `tests/**`, and
 * Vitest has no `--include` CLI flag — a positional argument only FILTERS the
 * files that `include` already matched. This worker's tests live under
 * `src/controller/`, which that pattern cannot reach, and `vitest.config.mjs`
 * is outside this worker's ownership. So the run command is:
 *
 *   npx --yes pnpm@9.9.0 --filter rocket-arena exec vitest run --config src/controller/vitest.config.mjs
 *
 * `.mjs` rather than `.ts` on purpose: the package `tsconfig.json` includes all
 * of `src`, so a `.ts` config would become part of the project typecheck with
 * no benefit. This is a harness file, not product code.
 *
 * `environment: "node"` is inherited from the shared config and is DELIBERATE,
 * not a shortcut. Every test here runs against the pure state machine in
 * `raw-intents.ts` and `stick.ts`, which contain no DOM access at all — that is
 * what makes the anti-stuck-input guarantee testable in plain Node. If a future
 * change adds DOM access to those modules, the test failing here is the signal
 * that the guarantee lost its cheap verification.
 *
 * The `@` alias is repeated from `vite.config.ts` because this config REPLACES
 * that file rather than extending it (Vitest reads one config, and the
 * orchestrator-owned `vitest.config.mjs` cannot reach these paths).
 *
 * `@donor/physics/simulation.js` is aliased to a local stub. `seam.ts` imports
 * that class as a VALUE to patch its prototype, and the real donor module pulls
 * in browser/WASM-only glue that cannot initialise in Node. None of the tests
 * here call `installSimSeam`, so the stub is never exercised beyond module
 * load — see `__fixtures__/donor-simulation.stub.ts`.
 */
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const packageRoot = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": `${packageRoot}src`,
      "@donor/physics/simulation.js": fileURLToPath(
        new URL("./__fixtures__/donor-simulation.stub.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    include: ["src/controller/**/*.test.ts"],
  },
});
