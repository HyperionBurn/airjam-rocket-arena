/**
 * Entry point.
 *
 * The donor's stylesheets are imported last so donor CSS keeps the final say on
 * layout, matching the cascade order of the donor's own `index.html`
 * (`styles.css`, then the eight `<link>`ed sheets).
 *
 * The router basename comes from the Air Jam SDK because the game is served from
 * a sub-path inside the platform, not the site root. Hardcoding `/` here is what
 * makes the phone surface 404 when the projector is running.
 *
 * No `StrictMode`, by design: see `shell/rocket-arena-game.tsx` — the donor is
 * boot-once-per-page-load and has no teardown, so a double-invoked effect would
 * boot the game twice.
 */
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { resolveAirJamBrowserRouterBasename } from "@air-jam/sdk";

import "@air-jam/sdk/styles.css";
import { App } from "./app";
import "./index.css";
import "./donor-styles.css";

// The donor's static loading block lives in index.html so the PROJECTOR shows a
// real loading screen from first paint. A phone never boots the donor, so on the
// controller route that block would sit on top of the controls forever.
if (window.location.pathname.replace(/\/+$/, "").endsWith("/controller")) {
  document.getElementById("app")?.remove();
}

const mount = document.getElementById("root");
if (!mount) {
  throw new Error("Rocket Arena shell: #root mount node is missing from index.html");
}

createRoot(mount).render(
  <BrowserRouter basename={resolveAirJamBrowserRouterBasename()}>
    <App />
  </BrowserRouter>,
);
