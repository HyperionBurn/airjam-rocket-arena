/**
 * The projector surface: boots the donor game with the Air Jam sim seam already
 * installed, and keeps every joined phone bound to its own car.
 *
 * ORDER IS LOAD-BEARING. `installSimSeam()` must complete BEFORE `bootDonor()`.
 * The donor creates its `PhysicsSimulation` internally during boot, and the seam
 * works by patching that class's prototype. Patching afterwards would leave the
 * donor's first frames — and every control write — un-intercepted, so phones
 * would appear to connect but not drive.
 *
 * There is deliberately NO host step loop here. The donor already runs its own
 * `FrameScheduler` at a fixed 120 Hz and calls `sim.setControls` per car per
 * frame; the seam intercepts those calls. Adding a second loop would double-step
 * the simulation and break determinism (and the physics baseline).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAirJamHost, useGetInput } from "@air-jam/sdk";

import { arenaBridge } from "@donor/app/arena-bridge.js";

import { bootDonor, type BootStatus } from "@/shell/donor-bridge";
import { createHostRuntime, type HostSnapshot } from "@/host/runtime";
import { LobbyLayer, getLobbyStore } from "@/host/lobby-layer";
import { MatchDirector } from "@/host/match-director";
import { SoundGate } from "@/host/sound-gate";
import { ArcadeBridge } from "@/host/arcade-bridge";
import { readArcadeLaunch } from "@/host/arcade";
import type { LocalMatchController } from "@/host/local-match";
import type { gameInputSchema } from "@/host/input-schema";

// Embedded mode must be set BEFORE the donor boots: it makes the donor skip its
// own home screen and online restore, because in Air Jam the lobby is ours.
arenaBridge.embedded = true;

/**
 * Phones are REMOTE inputs: the projector window losing focus or being clicked
 * away from says nothing about them, and the stuck-input guard's blur/visibility
 * neutralize is STICKY (nothing re-arms it), so wiring it to this window would
 * kill every car for the rest of the session the first time anyone clicks
 * elsewhere. The guard still protects against a hidden tab (reads go neutral
 * while it is hidden, and recover when it is visible again), and the donor
 * pauses the match itself when its tab is hidden.
 */
const REMOTE_INPUT_GUARD_TARGET = {
  window: { addEventListener: () => {}, removeEventListener: () => {} },
  document: { addEventListener: () => {}, removeEventListener: () => {} },
  isHidden: () => typeof document !== "undefined" && document.visibilityState === "hidden",
};

/** `?debug=1` shows the developer readout; the projector stays clean otherwise. */
const SHOW_DEBUG =
  typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug");

type Phase = "booting" | "ready" | "failed";

const SEAM_FAILURE =
  "Could not install the Air Jam input seam. The donor's simulation class was " +
  "not reachable, so phone controllers cannot drive. The game is unplayable in " +
  "Air Jam until this is fixed.";

import { getGamepadHub } from "@/host/gamepads";
import { useRoomPlayers } from "@/host/use-players";

export const HostSurface = () => {
  const [status, setStatus] = useState<BootStatus | null>(null);
  const [phase, setPhase] = useState<Phase>("booting");
  const [snapshot, setSnapshot] = useState<HostSnapshot | null>(null);
  const [seamError, setSeamError] = useState<string | null>(null);
  const [controller, setController] = useState<LocalMatchController | null>(null);
  const [matchActive, setMatchActive] = useState(false);
  // Launched by the arcade hub? Then the hub owns the roster and the lobby is skipped.
  const arcade = useMemo(() => readArcadeLaunch(window.location.search), []);

  const getInput = useGetInput<typeof gameInputSchema>();
  // Phones and gamepads, as one roster.
  const players = useRoomPlayers();
  const gamepads = useMemo(getGamepadHub, []);
  const runtimeState = useAirJamHost((state) => state.runtimeState);
  const controllers = useAirJamHost((state) => state.controllers);

  const runtimeRef = useRef<ReturnType<typeof createHostRuntime> | null>(null);
  // The donor controller only exists after boot; the runtime is built before it.
  const controllerRef = useRef<LocalMatchController | null>(null);
  controllerRef.current = controller;

  const readRaw = useCallback(
    (playerId: string) => (gamepads.isPad(playerId) ? gamepads.read(playerId) : (getInput(playerId) ?? null)),
    [getInput, gamepads],
  );

  /**
   * The boot effect must run EXACTLY ONCE per page load.
   *
   * `getInput` is a new reference on every render, so a `[readRaw]` dependency
   * re-runs this effect continuously. Each re-run would call `bootDonor()` again
   * (a no-op, the donor guards against a second boot) AND `runtime.dispose()`,
   * which neutralizes and clears the registry underneath the live match — the
   * donor's own fixed-step update then sees a dead session and the simulation
   * never leaves its opening phase, while rendering carries on. That failure
   * looks like "the arena is frozen", not "an effect re-ran", which is why the
   * ref indirection below matters.
   */
  const readRawRef = useRef(readRaw);
  readRawRef.current = readRaw;

  useEffect(() => {
    let cancelled = false;
    // The arena is built at START from the lobby roster, so joins must not grow it.
    const runtime = createHostRuntime({ readRaw: (id) => readRawRef.current(id), growOnJoin: false,
      guardTarget: REMOTE_INPUT_GUARD_TARGET,
      // Presence (below) is the "this phone is gone" signal; idle time is not.
      staleAfterMs: Number.POSITIVE_INFINITY,
      // A phone's ball-cam button: seat index == car index == slot.
      onBallCamToggle: (slot) => controllerRef.current?.toggleBallCam(slot),
    });
    runtimeRef.current = runtime;
    // Lobby buttons on a pad only act between matches.
    gamepads.setPhaseSource(() => getLobbyStore().getState().phase);
    if (SHOW_DEBUG) {
      // Dev aid for automated checks (`?debug`): never present on a clean projector URL.
      Object.assign(window, {
        __ra: { runtime, store: getLobbyStore(), raw: (id: string) => readRawRef.current(id), controller: () => controllerRef.current },
      });
    }

    void (async () => {
      // 1. Seam FIRST. Awaited, and a failure is fatal by design.
      const installed = await runtime.install();
      if (cancelled) return;
      if (!installed) {
        setSeamError(SEAM_FAILURE);
        setPhase("failed");
        return;
      }
      // 2. Only then the donor. The donor swallows its own startup failure and
      // reports through `#loading[data-state="error"]`, so the BootStatus stream
      // (not this promise) is the authoritative success signal.
      await bootDonor((next) => {
        if (!cancelled) setStatus(next);
      });
      if (cancelled) return;
      setController((await arenaBridge.whenReady()) as LocalMatchController);
      if (cancelled) return;
      setPhase("ready");
    })();

    return () => {
      cancelled = true;
      runtime.dispose();
      runtimeRef.current = null;
    };
  }, []);

  // Roster: claim a car for every player as soon as they appear, release it when
  // they go. Slot identity is retained by the registry, so a reconnecting
  // player gets their original car back.
  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const live = new Set<string>();
    for (const player of players) {
      live.add(player.id);
      if (runtime.snapshot().players.some((p) => p.playerId === player.id)) continue;
      runtime.join(player.id);
    }
    for (const playerId of runtime.snapshot().players.map((p) => p.playerId)) {
      if (!live.has(playerId)) runtime.leave(playerId);
    }
    setSnapshot(runtime.snapshot());
  }, [players]);

  // Presence: a phone that drops out is neutral at once, and takes the wheel
  // back by itself when it reconnects (see `setPresence`).
  useEffect(() => {
    // A connected gamepad is present by definition; the SDK only knows phones.
    const pads = players.filter((player) => gamepads.isPad(player.id)).map((player) => ({ controllerId: player.id, connected: true }));
    runtimeRef.current?.syncPresence([...controllers, ...pads]);
  }, [controllers, players, gamepads]);

  // The runtime snapshot is LIVE data (car count, boost, on-ground), but the
  // sim handle is only captured once the donor first calls `setControls` — which
  // happens some frames AFTER mount. So sampling it only in the effect above
  // would pin the readout at its mount-time value ("0 cars") forever. Poll it
  // instead, cheaply, and only while a match is live.
  useEffect(() => {
    if (phase !== "ready") return;
    const id = window.setInterval(() => {
      const runtime = runtimeRef.current;
      if (runtime) setSnapshot(runtime.snapshot());
    }, 500);
    return () => window.clearInterval(id);
  }, [phase]);

  const joined = useMemo(() => snapshot?.players.length ?? 0, [snapshot]);

  if (phase === "failed") {
    return (
      <div
        role="alert"
        style={{
          position: "fixed",
          inset: 0,
          display: "grid",
          placeItems: "center",
          background: "#061a37",
          color: "#fff",
          font: "600 18px/1.5 system-ui, sans-serif",
          padding: "4vmin",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "60ch" }}>
          <h1 style={{ fontSize: "28px", margin: "0 0 12px" }}>ROCKET ARENA</h1>
          <p style={{ opacity: 0.9 }}>{seamError ?? status?.error?.message ?? status?.detail ?? "The game failed to start."}</p>
        </div>
      </div>
    );
  }

  // The donor owns the canvas: it looks `#app` up at module scope and drives its
  // own frame loop. This component adds the lobby, the match director + HUD, and
  // (behind `?debug`) a small readout.
  const runtime = runtimeRef.current;
  return (
    <>
      <LobbyLayer hidden={matchActive || arcade !== null} />
      {arcade ? <ArcadeBridge launch={arcade} store={getLobbyStore()} matchActive={matchActive} /> : null}
      <SoundGate />
      {controller && runtime ? (
        <MatchDirector
          runtime={runtime}
          controller={controller}
          store={getLobbyStore()}
          onActiveChange={setMatchActive}
        />
      ) : null}
      {SHOW_DEBUG ? (
        <div
          style={{
            position: "fixed",
            top: 12,
            left: 12,
            zIndex: 10_000,
            padding: "8px 12px",
            borderRadius: 8,
            background: "rgba(6, 26, 55, 0.72)",
            color: "#cfe6ff",
            font: "12px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace",
            pointerEvents: "none",
            maxWidth: "46ch",
          }}
        >
          <div style={{ color: "#7dffa9", fontWeight: 700 }}>ROCKET ARENA / {phase.toUpperCase()}</div>
          {status?.detail ? <div style={{ opacity: 0.85 }}>{status.detail}</div> : null}
          <div style={{ opacity: 0.8 }}>
            players: {joined}/6 · arena cars: {snapshot?.carCount ?? 0}/{snapshot?.capacity ?? 8} ·
            runtime: {runtimeState}
          </div>
        </div>
      ) : null}
    </>
  );
};
