/**
 * Scoped vitest config for the agent-contract worker's own unit tests.
 *
 * Same reasoning as the sibling `src/match/vitest.config.mts`: the shared
 * package-level config pins `test.include` to `tests/**` and Vitest has no
 * `--include` flag, so this subtree needs its own config rather than an edit to
 * a file another worker owns.
 *
 * Run only these tests with:
 *   pnpm --filter rocket-arena exec vitest run --config src/contracts/vitest.config.mts
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/contracts/__tests__/**/*.test.ts"],
  },
});
