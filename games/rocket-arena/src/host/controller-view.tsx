/**
 * The phone-side surface (a controller, not the host).
 *
 * Deliberately thin: this component publishes raw intents and displays the host's
 * broadcast state. It does NOT implement the pulse→level timing — that is the
 * input layer's job on the host — because a second writer on the same socket
 * would race it and drop presses.
 *
 * `jump` is published as a HELD boolean on purpose. The host's input layer counts
 * rising edges (see `ROCKET_ARENA_INPUT_BEHAVIOR` in `@/airjam/input`), so a held
 * `true` yields exactly one press; publishing the monotonic `jumpPressCount` as a
 * boolean here would collapse several taps inside one 16 ms tick into a single
 * press and eat the double jump.
 *
 * The phone's lobby choices (ready, team, name, car) travel on the SAME input
 * payload as a `lobby` object. Air Jam's input channel is the only
 * controller→host path the SDK guarantees, and a "latest" object costs nothing
 * once a match starts because the host stops reading it.
 *
 * The host talks back through the state `message` (see `downlink.ts`): this
 * phone's boost meter and air/ground chip, and whether it has a car at all.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAirJamController, useControllerTick, useInputWriter } from "@air-jam/sdk";

import {
  TouchController,
  useGameplayViewportLock,
  type TouchCarOption,
  type TouchControllerHandle,
  type TouchTeamPreference,
} from "@/controller";
import { decodeDownlink } from "@/host/downlink";
import { GARAGE_CARS } from "@/lobby/settings";

/**
 * DEV ONLY (`vite dev`, never in a production build): `?drive=fwd|circle|boost`
 * replaces the touch stick with a scripted one, so automated checks can drive a
 * car without synthesising pointer events into an iframe.
 */
const DEBUG_DRIVE: string | null = import.meta.env.DEV
  ? new URLSearchParams(window.location.search).get("drive")
  : null;

/** DEV ONLY: `?car=spectre` preselects a garage car on a scripted phone. */
const DEBUG_CAR: string | null = import.meta.env.DEV
  ? new URLSearchParams(window.location.search).get("car")
  : null;

const scriptedStick = (mode: string, seconds: number): { x: number; y: number } => {
  if (mode === "circle") return { x: 0.6 * Math.sin(seconds * 0.9), y: 1 };
  return { x: 0, y: 1 }; // fwd, boost
};

/** The donor can only draw these bodies; the phone must not offer any other. */
const PHONE_CARS: readonly TouchCarOption[] = GARAGE_CARS.map((car) => ({ id: car.id, label: car.label }));

export const ControllerSurface = () => {
  const writeInput = useInputWriter();
  const runtimeState = useAirJamController((state) => state.runtimeState);
  const connectionStatus = useAirJamController((state) => state.connectionStatus);
  const controllerId = useAirJamController((state) => state.controllerId);
  const stateMessage = useAirJamController((state) => state.stateMessage);

  const handleRef = useRef<TouchControllerHandle | null>(null);
  const isPlaying = runtimeState === "playing";
  // Only lock zoom for the gameplay surface; the lobby still needs to scroll.
  useGameplayViewportLock(isPlaying);

  const runtimeStateRef = useRef(runtimeState);
  runtimeStateRef.current = runtimeState;

  const [nickname, setNickname] = useState("");
  const [team, setTeam] = useState<TouchTeamPreference>("auto");
  const [carId, setCarId] = useState<string>(DEBUG_CAR ?? PHONE_CARS[0]?.id ?? "");
  const [ready, setReady] = useState(false);
  // Scripted phones ready themselves so a harness run needs no taps.
  useEffect(() => {
    if (DEBUG_DRIVE !== null && !isPlaying) setReady(true);
  }, [isPlaying]);

  // Latest lobby choices for the 60 Hz publisher, without re-creating it.
  const lobbyRef = useRef({ ready, team, name: nickname, carId });
  lobbyRef.current = { ready, team, name: nickname, carId };

  // When the match ends the host resets everyone's ready flag, so the phone
  // must not keep claiming "ready" for a lobby that has moved on.
  const wasPlaying = useRef(false);
  useEffect(() => {
    // (Scripted dev phones stay ready: they have no thumb to tap READY again.)
    if (wasPlaying.current && !isPlaying && DEBUG_DRIVE === null) setReady(false);
    wasPlaying.current = isPlaying;
  }, [isPlaying]);

  // The host's live readout for THIS phone.
  const downlink = useMemo(() => decodeDownlink(stateMessage), [stateMessage]);
  const mine = controllerId && downlink ? (downlink.seats[controllerId] ?? null) : null;
  const spectating = isPlaying && downlink !== null && mine === null;

  /**
   * Publish at the Air Jam input cadence (~60 Hz), not on every pointer event.
   * The physics is 120 Hz and the host reads once per donor frame, so 60 Hz is
   * ample while keeping socket traffic sane on a crowded event network.
   */
  const lastSentAt = useRef(0);
  const publish = useCallback(() => {
      lastSentAt.current = performance.now();
      const handle = handleRef.current;
      if (!handle) return;
      const intents = handle.read();
      const drive = DEBUG_DRIVE !== null && runtimeStateRef.current === "playing";
      writeInput({
        stick: drive ? scriptedStick(DEBUG_DRIVE!, performance.now() / 1000) : { x: intents.stickX, y: intents.stickY },
        jump: intents.jump,
        boost: drive ? DEBUG_DRIVE === "boost" : intents.boost,
        // The donor's single `handbrake` field is powerslide on the ground and
        // the air-roll modifier in the air, so one field carries both.
        handbrake: intents.handbrake,
        airRoll: intents.handbrake,
        ballCamPresses: intents.ballCamPressCount,
        lobby: lobbyRef.current,
      });
    }, [writeInput]);
  useControllerTick(publish, { intervalMs: 16 });

  /**
   * A touch change goes out NOW instead of waiting for the next 16 ms timer tick
   * (up to a frame of latency on every steer, boost or jump). Capped so a thumb
   * dragging at display rate cannot flood the socket: at most one extra send per
   * 6 ms, on top of the steady tick.
   */
  const publishOnTouch = useCallback(() => {
    if (performance.now() - lastSentAt.current >= 6) publish();
  }, [publish]);

  return (
    <>
      <TouchController
        controllerRef={handleRef}
        phase={isPlaying ? "playing" : "lobby"}
        controlsDisabled={connectionStatus !== "connected"}
        onIntents={publishOnTouch}
        // Unknown until the host's first readout; the touch layer treats null as grounded.
        airborne={mine ? mine.airborne : null}
        boostPercent={mine?.boost ?? 0}
        hapticsEnabled
        nickname={nickname}
        onNicknameChange={setNickname}
        teamPreference={team}
        onTeamChange={setTeam}
        cars={PHONE_CARS}
        selectedCarId={carId}
        onCarChange={setCarId}
        ready={ready}
        onReadyChange={setReady}
      />
      {spectating ? (
        <div
          role="status"
          style={{
            position: "fixed",
            left: "50%",
            top: 12,
            transform: "translateX(-50%)",
            zIndex: 50,
            padding: "8px 16px",
            borderRadius: 999,
            background: "rgba(2, 16, 31, 0.9)",
            border: "1px solid #ffd23f88",
            color: "#ffe9a3",
            font: "700 13px/1.2 system-ui, sans-serif",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            pointerEvents: "none",
          }}
        >
          Match in progress — you&apos;re spectating
        </div>
      ) : null}
    </>
  );
};
