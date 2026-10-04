/**
 * Bridge between the React shell and the untouched Rocket Arena donor.
 *
 * Two donor constraints shape everything here:
 *
 * 1. `src/donor/app/startup.js` resolves `#app` and the loading block at MODULE
 *    scope, not inside `boot()`. The donor module therefore has to be imported
 *    only once `#app` is in the document, which is why the import is dynamic and
 *    driven from a mount effect.
 *
 * 2. `boot()` returns `startGame().catch(...)` and the donor's own catch handler
 *    swallows the error: it flips `#loading` to `data-state="error"`, writes the
 *    message into `.load__note`, and calls `console.error`. A resolved promise
 *    therefore does NOT mean the game started. `#loading`'s `data-state` is the
 *    only authoritative success/failure signal the donor exposes, so this bridge
 *    observes it and also traps window-level errors as a backstop.
 *
 * The donor exposes no teardown: `boot()` returns nothing disposable, installs
 * window/document listeners directly, and starts a `FrameScheduler` it never
 * stops. `disposeDonor()` is therefore best-effort (drop the DOM, release the
 * GL context) and `bootDonor()` is deliberately once-per-page-load, because a
 * second boot would render into a detached `#app`.
 */

export type BootPhase =
  | "idle"
  | "checking-webgl"
  | "importing-donor"
  | "booting-donor"
  | "running"
  | "failed";

export interface BootStatus {
  phase: BootPhase;
  detail: string;
  /** Populated only when `phase` is `"failed"`. */
  error: { message: string; stack?: string } | null;
}

const IDLE: BootStatus = { phase: "idle", detail: "Waiting for mount", error: null };

/** Set once the donor has been imported and booted; blocks a second boot. */
let donorStarted = false;

const describe = (error: unknown) => {
  if (error instanceof Error) {
    return {
      message: error.message || String(error),
      stack: error.stack,
    };
  }
  return { message: String(error) };
};

const webglSupport = () => {
  try {
    const probe = document.createElement("canvas");
    const gl = probe.getContext("webgl2") ?? probe.getContext("webgl");
    if (!gl) {
      return { ok: false as const, detail: "No WebGL context available in this browser" };
    }
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = info
      ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL))
      : String(gl.getParameter(gl.RENDERER));
    // Release the probe immediately; the donor creates its own renderer later.
    const lose = gl.getExtension("WEBGL_lose_context");
    lose?.loseContext();
    return { ok: true as const, detail: renderer };
  } catch (error) {
    return { ok: false as const, detail: describe(error).message };
  }
};

/**
 * Reads the donor's own failure surface: `#loading[data-state="error"]` plus the
 * message it writes into `.load__note`.
 */
const watchDonorLoadingSurface = (
  onError: (error: { message: string; stack?: string }) => void,
) => {
  const loading = document.querySelector("#loading");
  if (!(loading instanceof HTMLElement)) {
    console.warn("[rocket-arena] donor #loading element not found; error surface unavailable");
    return () => {};
  }

  const readFailure = () => {
    const note = loading.querySelector(".load__note");
    const label = loading.querySelector(".load__label");
    const parts = [
      loading.dataset.state === "error" ? "donor reported data-state=error" : null,
      label?.textContent?.trim() || null,
      note?.textContent?.trim() || null,
    ].filter((part): part is string => Boolean(part));
    return parts.join(" — ") || "donor entered the error state with no message";
  };

  const observer = new MutationObserver(() => {
    if (loading.dataset.state === "error") {
      onError({ message: readFailure() });
    }
  });
  observer.observe(loading, {
    attributes: true,
    attributeFilter: ["data-state"],
    childList: true,
    subtree: true,
  });
  return () => observer.disconnect();
};

export interface DisposeDonor {
  (): void;
}

/**
 * Best-effort teardown. The donor has no dispose API, so this removes the donor
 * DOM from `#app` and asks the browser to reclaim the WebGL contexts. Any
 * listeners the donor installed on `window`/`document` stay attached; a full
 * remount is not supported in a single page load.
 */
export const disposeDonor = (): DisposeDonor => {
  const app = document.querySelector("#app");
  const canvases = Array.from(app?.querySelectorAll("canvas") ?? []);
  for (const canvas of canvases) {
    for (const context of ["webgl2", "webgl"] as const) {
      const gl = canvas.getContext(context) as WebGLRenderingContext | null;
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    }
  }
  app?.replaceChildren();
  // The donor module cached `const an = document.querySelector("#app")` at module
  // scope, so it can never be pointed at a new stage element in this page load.
  donorStarted = false;
  return () => {};
};

export const bootDonor = async (
  onStatus: (status: BootStatus) => void,
): Promise<DisposeDonor> => {
  const publish = (status: BootStatus) => {
    onStatus(status);
  };

  const noop: DisposeDonor = () => {};

  if (donorStarted) {
    publish({
      phase: "failed",
      detail:
        "The donor is already running in this page. It has no teardown API, so reload to start it again.",
      error: { message: "donor already booted in this page load" },
    });
    return noop;
  }

  const gl = webglSupport();
  if (!gl.ok) {
    publish({ phase: "failed", detail: gl.detail, error: { message: gl.detail } });
    return noop;
  }

  const failures: { message: string; stack?: string }[] = [];
  const recordFailure = (error: { message: string; stack?: string }) => {
    failures.push(error);
    publish({ phase: "failed", detail: error.message, error });
  };

  // Backstop for failures the donor's own catch does not surface: WASM
  // instantiation traps, failed worker loads, unhandled rejections.
  const onWindowError = (event: ErrorEvent) => {
    recordFailure({
      message: event.message || "Uncaught window error",
      stack: event.error instanceof Error ? event.error.stack : undefined,
    });
  };
  const onRejection = (event: PromiseRejectionEvent) => {
    recordFailure(describe(event.reason));
  };
  const onConsoleError = (...args: unknown[]) => {
    // The donor's boot catch reports through console.error; keep it visible in
    // devtools but mirror it into the readout.
    if (failures.length === 0) {
      const first = args.find((arg): arg is Error => arg instanceof Error);
      recordFailure(describe(first ?? args.map(String).join(" ")));
    }
    originalConsoleError(...args);
  };
  const originalConsoleError = console.error.bind(console);

  window.addEventListener("error", onWindowError);
  window.addEventListener("unhandledrejection", onRejection);
  console.error = onConsoleError;

  const cleanupWatchers = () => {
    window.removeEventListener("error", onWindowError);
    window.removeEventListener("unhandledrejection", onRejection);
    console.error = originalConsoleError;
  };

  publish({ phase: "importing-donor", detail: `WebGL renderer: ${gl.detail}`, error: null });

  let stopWatchingLoading: () => void = () => {};
  try {
    // Must happen after `#app` exists and before `boot()`.
    const donor = await import("@donor/app/startup.js");
    stopWatchingLoading = watchDonorLoadingSurface(recordFailure);

    publish({
      phase: "booting-donor",
      detail: "donor imported; loading RocketSim WASM + arena collision meshes",
      error: null,
    });

    donorStarted = true;
    await donor.boot();

    if (failures.length > 0) {
      stopWatchingLoading();
      cleanupWatchers();
      return noop;
    }

    publish({
      phase: "running",
      detail: `donor frame scheduler started (renderer: ${gl.detail})`,
      error: null,
    });
  } catch (error) {
    stopWatchingLoading();
    cleanupWatchers();
    const detail = describe(error);
    publish({ phase: "failed", detail: detail.message, error: detail });
    return noop;
  }

  return () => {
    stopWatchingLoading();
    cleanupWatchers();
    disposeDonor();
  };
};
