import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const api = process.env.ARCADE_API ?? "http://127.0.0.1:8787";

export default defineConfig({
  plugins: [react()],
  build: { outDir: "dist/web", emptyOutDir: true, sourcemap: false },
  server: {
    host: true,
    port: 5180,
    proxy: {
      "/api": api,
      "/ws": { target: api.replace(/^http/, "ws"), ws: true },
    },
  },
});
