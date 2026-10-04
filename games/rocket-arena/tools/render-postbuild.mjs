// Post-build step for static hosting (Render static site, no rewrite rules).
//
// The phone controller lives at /controller?room=XXXX. A static host only serves
// real files, so copy the single-page app shell to dist/controller/index.html and
// the same bundle answers that route (the app picks host vs controller from the
// path at runtime).
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dist = resolve(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const shell = join(dist, "index.html");
if (!existsSync(shell)) {
  console.error(`render-postbuild: ${shell} not found - run the vite build first`);
  process.exit(1);
}

for (const route of ["controller"]) {
  mkdirSync(join(dist, route), { recursive: true });
  copyFileSync(shell, join(dist, route, "index.html"));
  console.log(`render-postbuild: wrote dist/${route}/index.html`);
}
