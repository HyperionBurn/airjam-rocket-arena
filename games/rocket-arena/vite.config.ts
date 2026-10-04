import { createAirJamViteConfig } from "@air-jam/cli/vite-config";
import react from "@vitejs/plugin-react";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname } from "node:path";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin, PreviewServer, UserConfig, ViteDevServer } from "vite";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "public");

// `three` profile: keeps the SDK/app runtime chunking that embedded builds need
// and raises the chunk-size warning limit for the donor's ~1.7 MB of JS.
const airJamVite = createAirJamViteConfig({ profile: "three" });

/* -------------------------------------------------------------------------- */
/* Donor shim A: absolute-URL asset specifiers.                               */
/* -------------------------------------------------------------------------- */

/**
 * The donor was built by esbuild with its assets served from disk, so it loads
 * them by absolute URL instead of importing them. `tools/build.mjs` in the donor
 * handles this with `external: ['/physics/*', '/assets/online/auth-sdk.js']` plus
 * a resolver that remaps esbuild's browser-external shim. The affected sites:
 *
 *   src/donor/physics/source-runtime.js  import("/physics/rocketsim-core.js")
 *   src/donor/physics/simulation.js      import("/physics/rocketsim-network.js")
 *   src/donor/online/account.js          import("/assets/online/auth-sdk.js")
 *   src/donor/bots/controller.js         new URL("/assets/worker-*.js", import.meta.url)
 *   src/donor/vendor/legacy-physics.js   import("./__vite-browser-external-*.js")
 *
 * Vite/rollup try to resolve those as project modules and fail the build. Build
 * marks them external so the specifier is emitted verbatim and hits the served
 * `public/` copy at runtime — exactly what the donor's own build did.
 *
 * Two scoping rules, both load-bearing:
 *
 *  - Only specifiers whose FIRST path segment is a real top-level directory in
 *    `public/` (`assets`, `physics`) are claimed. Matching on "starts with /"
 *    alone also swallows Vite's own dev-internal URLs (`/@vite/client`,
 *    `/@react-refresh`, `/@fs/...`, `/node_modules/.vite/...`), and 404ing the
 *    HMR client in dev breaks the entire module graph.
 *
 *  - In dev, `vite:import-analysis` rejects `import()` of a JS file that lives in
 *    `public/` ("Cannot import non-asset file ... which is inside /public"), and
 *    it tests the RAW specifier before any plugin's `resolveId` runs, so no
 *    plugin can intercept it. The two Emscripten glue files are therefore served
 *    through a virtual module id, which is outside `publicDir`. They are already
 *    self-contained ESM (zero static imports), and the donor supplies `wasmBinary`
 *    so their own `import.meta.url`-relative `.wasm` fallback is never reached.
 */
const VITE_BROWSER_EXTERNAL = "__vite-browser-external-BIHI7g3E.js";
const DONOR_GLUE_PREFIX = "\0donor-wasm-glue:";

/**
 * `src/donor/bots/controller.js:82` builds the bot worker URL by hand:
 *
 *   new Worker(new URL("/assets/worker-iFqqV1m9.js", import.meta.url), { type: "module" })
 *
 * `resolveId` above cannot help here, and returning it as external is not enough.
 * `vite:asset-import-meta-url` does not ask `resolveId` for its result: it reads the
 * `new URL(<string>, import.meta.url)` pattern out of the module, resolves the target
 * to a FILE, and re-emits that file as its own hashed build entry. The donor's
 * specifier is therefore silently rewritten to
 *
 *   new URL("/assets/worker-iFqqV1m9-Cw8G0KXk.js", import.meta.url)
 *
 * and the browser then loads Vite's re-bundled copy instead of the `public/` one the
 * donor ships. That copy is a RE-BUNDLE, not a copy: rollup re-minifies it (69592 vs
 * 69606 bytes) and the bot worker stops answering. The worker serialises every request
 * onto one promise chain —
 *
 *   let yn = Promise.resolve();
 *   self.onmessage = (e) => { yn = yn.then(() => handle(e.data)); };
 *
 * — so a single unanswered `decide` leaves `h` (the donor's `botPending`) true forever:
 * the bot never issues a control, no car ever reaches the ball, `kickoffTouched` stays
 * false, and the match clock sits at 5:00 for the whole session. No error surfaces,
 * because nothing rejects — the request simply never comes back.
 *
 * `self.location.href` resolves a root-absolute specifier against the origin, exactly
 * as `import.meta.url` did in the donor's own esbuild output, so the worker is loaded
 * verbatim from `public/` — which is what the donor's build and its `tools/serve.mjs`
 * both do.
 */
const DONOR_WORKER_URL = /new URL\((["'])\/assets\/(worker-[^"']+\.js)\1,\s*import\.meta\.url\)/g;

/**
 * The only two `public/` JS files that must be served as ES *modules* in dev.
 * Everything else under `public/` keeps its verbatim URL, because it is loaded
 * by URL rather than by `import()` — notably `/assets/worker-iFqqV1m9.js`, which
 * `bots/controller.js` hands to `new Worker(new URL(...))` with no
 * `{ type: "module" }` and which therefore has to stay a classic script.
 */
const DONOR_ESM_GLUE = new Set([
  "/physics/rocketsim-core.js",
  "/physics/rocketsim-network.js",
]);

/** Top-level directories inside `public/` that the donor addresses by URL. */
const donorPublicRoots = new Set(
  readdirSync(publicDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name),
);

const isDonorPublicUrl = (pathname: string) => {
  const [root] = pathname.replace(/^\/+/, "").split("/");
  return Boolean(root) && donorPublicRoots.has(root);
};

const donorAssetUrlPlugin = (command: "build" | "serve"): Plugin => ({
  name: "donor-public-absolute-urls",
  enforce: "pre",
  resolveId(source, importer) {
    // esbuild's Node-only browser shim: the donor remaps it to the public copy.
    if (
      source.endsWith(VITE_BROWSER_EXTERNAL) &&
      !existsSync(path.resolve(path.dirname(importer ?? __dirname), source))
    ) {
      return { id: `/assets/${VITE_BROWSER_EXTERNAL}`, external: true };
    }
    if (!source.startsWith("/")) return null;
    const [pathname] = source.split("?");
    if (!isDonorPublicUrl(pathname)) return null;

    if (command === "build") {
      return { id: source, external: true };
    }

    if (DONOR_ESM_GLUE.has(pathname)) {
      return DONOR_GLUE_PREFIX + pathname;
    }

    // Same as build: keep the specifier verbatim and let it fail at runtime.
    // Reached by `/assets/online/auth-sdk.js`, which the donor's esbuild config
    // synthesises from `@supabase/supabase-js` (online subsystem, being removed)
    // and which is not in `public/` at all. `online/account.js` already throws
    // "Accounts are not configured" before reaching it.
    return { id: source, external: true };
  },
  load(id) {
    if (!id.startsWith(DONOR_GLUE_PREFIX)) return null;
    return readFileSync(
      path.join(publicDir, id.slice(DONOR_GLUE_PREFIX.length)),
      "utf8",
    );
  },
  transform(code, id) {
    // Only the donor's own bot-controller module builds a worker URL by hand.
    if (!id.includes("donor") || !DONOR_WORKER_URL.test(code)) return null;
    DONOR_WORKER_URL.lastIndex = 0;
    return { code: code.replace(DONOR_WORKER_URL, (_m, q, file) => `new URL(${q}/assets/${file}${q}, self.location.href)`), map: null };
  },
});

/* -------------------------------------------------------------------------- */
/* Donor shim B: the reference field-light worker.                             */
/* -------------------------------------------------------------------------- */

/**
 * `src/donor/materials/reference-field-texture.js` hard-codes
 * `new Worker('/src/materials/reference-field-worker.js', { type: 'module' })`.
 * That URL is a plain runtime string, so Vite never rewrites it, and the donor
 * tree now lives under `src/donor/`. The worker source itself is unchanged; we
 * only make it reachable at the URL the donor asks for:
 *   - dev / preview: rewrite the request onto the real donor module so Vite
 *     transforms it like any other ESM source.
 *   - build: emit it as a second rollup entry at that exact path (the donor's own
 *     esbuild config does exactly this, with the same entry name).
 */
const DONOR_FIELD_WORKER_URL = "/src/materials/reference-field-worker.js";
const DONOR_FIELD_WORKER_ENTRY = "src/materials/reference-field-worker";
const DONOR_FIELD_WORKER_FILE = path.resolve(
  __dirname,
  "src/donor/materials/reference-field-worker.js",
);

/* -------------------------------------------------------------------------- */
/* Donor shim C: serve public/ in dev, and the field-worker URL rewrite.        */
/* -------------------------------------------------------------------------- */

/**
 * Dev-only. Vite's publicDir is disabled in `serve` (see the exported config)
 * and `public/` is served here instead, which removes `publicDir` from the
 * resolved config entirely. That is what lets the donor's
 * `import("/physics/rocketsim-core.js")` get past `vite:import-analysis`, whose
 * "inside /public" guard keys off `checkPublicFile()`.
 *
 * MIME types matter here: `.wasm` must not be served as `application/octet-stream`
 * or the browser refuses `WebAssembly` streaming instantiation.
 */
const DEV_PUBLIC_MIME: Record<string, string> = {
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".wasm": "application/wasm",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
  ".cmf": "application/octet-stream",
  ".bin": "application/octet-stream",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

const donorDevServerShim = (): Plugin => {
  // Accepts both so the same handler can serve `configureServer` (dev) and
  // `configurePreviewServer`; only `.middlewares.use` is needed.
  const install = (server: ViteDevServer | PreviewServer) => {
    server.middlewares.use((req, res, next) => {
      const raw = req.url?.split("?")[0];
      if (!raw || !raw.startsWith("/")) return next();

      // (1) the donor's hard-coded field-worker URL
      if (raw === DONOR_FIELD_WORKER_URL) {
        req.url = "/src/donor/materials/reference-field-worker.js";
        return next();
      }

      // (2) verbatim public/ assets, the way the donor's own static server did.
      //     With publicDir disabled, Vite's asset plugin addresses public files
      //     as `/@fs/<public-relative-path>?worker_file&type=module`, so strip
      //     the `/@fs` prefix (and always the query) before looking on disk.
      const cleaned = raw.replace(/^\/@fs(?=\/)/, "");
      const file = path.join(publicDir, decodeURIComponent(cleaned));
      if (!file.startsWith(publicDir + path.sep)) return next();
      if (!existsSync(file) || !statSync(file).isFile()) return next();
      res.setHeader(
        "Content-Type",
        DEV_PUBLIC_MIME[extname(file).toLowerCase()] ?? "application/octet-stream",
      );
      res.setHeader("Cache-Control", "no-cache");
      res.end(readFileSync(file));
    });
  };

  return {
    name: "donor-dev-public-and-worker",
    configureServer: install,
    configurePreviewServer: install,
  };
};

/* -------------------------------------------------------------------------- */

const airJamRollup = airJamVite.build?.rollupOptions;

const build: UserConfig["build"] = {
  ...airJamVite.build,
  rollupOptions: {
    ...airJamRollup,
    input: {
      main: path.resolve(__dirname, "index.html"),
      [DONOR_FIELD_WORKER_ENTRY]: DONOR_FIELD_WORKER_FILE,
    },
    output: {
      ...airJamRollup?.output,
      entryFileNames: (chunk) =>
        chunk.name === DONOR_FIELD_WORKER_ENTRY
          ? `${DONOR_FIELD_WORKER_ENTRY}.js`
          : "assets/[name]-[hash].js",
    },
  },
};

/**
 * Dev-server dependency scan.
 *
 * Vite's esbuild scanner follows every static and dynamic import from
 * `index.html`, including the donor's `import("./__vite-browser-external-*.js")`
 * (an esbuild-only shim the donor's own build remaps; see donorAssetUrlPlugin).
 * The scanner does not run our `resolveId` for it, tries to read the file from
 * disk, and the whole dev server refuses to start. It is a runtime-only,
 * never-prebundled specifier, so the scanner is told to leave it alone.
 */
const scanIgnoresDonorShim = {
  name: "scan-ignores-donor-browser-external",
  setup(build: { onResolve: (opts: { filter: RegExp }, cb: (args: { path: string }) => { path: string; external: boolean }) => void }) {
    build.onResolve({ filter: /__vite-browser-external-/ }, (args) => ({ path: args.path, external: true }));
  },
};

export default defineConfig(({ command }) => ({
  ...airJamVite,
  optimizeDeps: {
    esbuildOptions: { plugins: [scanIgnoresDonorShim] },
  },
  // Dev serves public/ from the shim middleware instead; build copies it verbatim.
  publicDir: command === "build" ? publicDir : false,
  build,
  plugins: [
    donorAssetUrlPlugin(command),
    react(),
    donorDevServerShim(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@donor": path.resolve(__dirname, "./src/donor"),
    },
  },
}));
