import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  resolve: {
    // Mirrors the `@` alias in `vite.config.ts` so unit tests under `src/`
    // resolve the same specifiers the product build does. Deliberately does NOT
    // alias `@donor`: `src/airjam/seam.ts` imports the donor simulation lazily
    // (inside `installSimSeam`) precisely so pure unit tests never pull in the
    // browser-only WASM glue.
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    // The port's tests live next to the code they cover under `src/**` as well as
    // in `tests/**`. A positional arg to `vitest run` only FILTERS files that
    // `include` already matched, so an `include` that omits `src/**` makes
    // `vitest run src/airjam/...` silently find nothing.
    include: [
      "tests/**/*.test.ts",
      "tests/**/*.test.tsx",
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
    ],
  },
});
