import { useEffect, useState } from "react";
import {
  bootDonor,
  disposeDonor,
  type BootStatus,
  type DisposeDonor,
} from "./donor-bridge";

const PHASE_LABEL: Record<BootStatus["phase"], string> = {
  idle: "idle",
  "checking-webgl": "probing webgl",
  "importing-donor": "importing donor",
  "booting-donor": "booting donor",
  running: "running",
  failed: "failed",
};

/**
 * The Air Jam game shell.
 *
 * Deliberately NOT wrapped in `StrictMode`: React's development double-invoke
 * would run the mount effect twice, and the donor can only be booted once per
 * page load (it binds `#app` at module scope and exposes no teardown). That
 * constraint lives in `donor-bridge.ts`.
 *
 * This component owns the status/error layer only. The donor stage (`#app`) and
 * the WebGL canvas inside it are the donor's to create: `app/startup.js` builds
 * its `WebGLRenderer` itself and appends `renderer.domElement` to `#app`.
 */
export const RocketArenaGame = () => {
  const [status, setStatus] = useState<BootStatus>({
    phase: "idle",
    detail: "Waiting for mount",
    error: null,
  });

  useEffect(() => {
    let dispose: DisposeDonor | null = null;
    let cancelled = false;

    void bootDonor((next) => {
      if (!cancelled) setStatus(next);
    }).then((teardown) => {
      // A failed boot returns a no-op; unmounting early must not leave the
      // donor running behind a torn-down stage.
      if (cancelled) teardown();
      else dispose = teardown;
    });

    return () => {
      cancelled = true;
      dispose?.();
      disposeDonor();
    };
  }, []);

  const fatal = status.phase === "failed" ? status.error : null;

  return (
    <>
      <div className="ra-status" role="status" aria-live="polite">
        <div className="ra-status__phase" data-phase={status.phase}>
          Rocket Arena / {PHASE_LABEL[status.phase]}
        </div>
        <div className="ra-status__detail">{status.detail}</div>
      </div>

      {fatal ? (
        <div className="ra-fatal" role="alert">
          <h1>ROCKET ARENA FAILED TO START</h1>
          <p>
            The donor game runtime did not reach a running frame scheduler. The
            detail below is the first error the shell observed.
          </p>
          <pre>{fatal.stack ? `${fatal.message}\n\n${fatal.stack}` : fatal.message}</pre>
        </div>
      ) : null}
    </>
  );
};
