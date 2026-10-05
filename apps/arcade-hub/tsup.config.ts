import { defineConfig } from "tsup";

export default defineConfig({
  entry: { "server/main": "src/server/main.ts" },
  outDir: "dist",
  format: ["esm"],
  target: "node22",
  platform: "node",
  clean: false,
  sourcemap: false,
  // The runtime dependencies stay external; they are installed in the image.
  external: ["ws", "zod"],
});
