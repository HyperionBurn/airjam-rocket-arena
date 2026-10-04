/**
 * `TouchController` — the phone-side control surface.
 *
 * ===========================================================================
 * THE LAYOUT, AND WHY IT IS A THUMB LAYOUT AND NOT A CONTROLLER CLONE
 * ===========================================================================
 *  LEFT THUMB — one analog stick, bottom-left.
 *      up / down      throttle forward / reverse-and-brake (signed, so a
 *                     partial pull back is fine-grained reverse)
 *      left / right   steering
 *      in the air     the SAME stick becomes pitch (up/down) and yaw (left/right)
 *      + DRIFT held   the air mapping swaps yaw for ROLL — the donor's own rule
 *
 *  RIGHT THUMB — a four-button cluster, bottom-right.
 *      BOOST    largest, top-right of the cluster
 *      JUMP     largest, under BOOST. Tapping it again is the double jump.
 *      DRIFT    powerslide on the ground, air-roll modifier in the air
 *      BALL CAM a toggle, top row
 *      REVERSE  a HOLD that forces full reverse for getting unstuck, top row
 *
 *  Every required simultaneous combination works, and not by accident: the
 *  stick and the cluster are separate elements and every finger is tracked by
 *  its own `pointerId` (see `use-touch-input.ts`), so steer+boost,
 *  steer+jump, steer+drift, jump+boost, aerial-stick+boost and
 *  aerial-stick+air-roll are all just two fingers down at once.
 *
 *  WHY THERE IS NO FLIP BUTTON. `seam.ts` is explicit: the ABI has 8 fields
 *  and no dodge/flip input. RocketSim derives the flip from `jump` plus the
 *  analog direction held AT THAT INSTANT, and derives the double jump
 *  internally. So the stick vector reaching the sim at the press moment is
 *  exactly the vector the player was holding — this component never rewrites,
 *  zeroes or latches the stick on jump. `jumpPressCount` is emitted as a
 *  monotonic counter precisely so the input layer can see discrete presses and
 *  let RocketSim derive the double jump, rather than inferring repeats from a
 *  smeared level.
 *
 * ===========================================================================
 * THE BOUNDARY WITH THE INPUT LAYER
 * ===========================================================================
 * This component emits RAW intents and nothing else. It does NOT:
 *   - import anything from `src/airjam/input/` (the edge stays one-directional:
 *     the input layer may depend on this module, never the reverse),
 *   - call `useInputWriter` / `useControllerTick` — publishing input on a tick
 *     and turning pulses into levels is the input worker's job, and doing it
 *     here would create two writers racing on one socket,
 *   - know whether the car is airborne. It only FORWARDS the host's
 *     `airborne` flag inside the intents bundle and uses it for the pad labels
 *     and the DRIFT caption. Guessing grounded-ness from touch would be a lie
 *     with physics consequences.
 *
 * The only SDK surface this component needs is the pair the host page already
 * owns: an intent sink and a host-fed `boostPercent`. See `index.ts` for the
 * pairing recipe.
 */

import type { JSX, Ref, RefObject } from "react";
import { useCallback, useImperativeHandle, useRef, useState } from "react";
import type { CarControls } from "@/airjam/seam";
import {
  deriveCarControls,
  readRawIntents,
  type RawTouchIntents,
  type TouchButtonId,
} from "./raw-intents";
import { useGameplayViewportLock } from "./use-gameplay-viewport";
import { useTouchInput } from "./use-touch-input";
import "./touch-controller.css";

/* -------------------------------------------------------------------------- */
/* Public props                                                                */
/* -------------------------------------------------------------------------- */

export type TouchControllerPhase = "lobby" | "playing" | "ended";

export type TouchTeamPreference = "auto" | "blue" | "orange";

export interface TouchCarOption {
  readonly id: string;
  readonly label: string;
}

/** Imperative handle for a host that prefers a ref over a callback. */
export interface TouchControllerHandle {
  /** Current raw intents. Never throws; never returns a partial object. */
  read: () => RawTouchIntents;
  /**
   * Drop every held control. Idempotent. Call on match end, disconnect and any
   * state where the car should stop responding to this phone.
   */
  release: () => void;
  /**
   * Push air context without a re-render round trip from the host. Pass `null`
   * to go back to following the `airborne` prop.
   */
  setAirborne: (airborne: boolean | null) => void;
}

export interface TouchControllerProps {
  /** Which surface to show. Gameplay controls are only live in `"playing"`. */
  readonly phase?: TouchControllerPhase;
  /** Extra gate (disconnected, paused). Any false drops held controls. */
  readonly controlsDisabled?: boolean;

  /**
   * RAW intent sink. Fires on every state change — including each discrete
   * jump / ball-cam press — not on a timer. The input layer decides the cadence.
   */
  readonly onIntents?: (intents: RawTouchIntents) => void;
  /**
   * Convenience for hosts that do not want to map the 8 ABI fields themselves.
   * Same values `deriveCarControls` produces; both can be subscribed at once.
   */
  readonly onControls?: (controls: CarControls) => void;
  readonly controllerRef?: Ref<TouchControllerHandle>;

  /** Host-owned air context. `null`/omitted = unknown, treated as grounded. */
  readonly airborne?: boolean | null;
  /** Host-owned boost meter, 0..100. Clamped and rounded for display. */
  readonly boostPercent?: number;
  readonly hapticsEnabled?: boolean;

  /* Lobby (phone-private) -------------------------------------------------- */

  readonly nickname?: string;
  readonly onNicknameChange?: (value: string) => void;
  readonly teamPreference?: TouchTeamPreference;
  readonly onTeamChange?: (team: TouchTeamPreference) => void;
  /** Host-supplied list; see `DEFAULT_TOUCH_CARS` for the default. */
  readonly cars?: readonly TouchCarOption[];
  readonly selectedCarId?: string;
  readonly onCarChange?: (carId: string) => void;
  readonly ready?: boolean;
  readonly onReadyChange?: (ready: boolean) => void;
}

/**
 * Car ids transcribed from the donor's `VISUAL_HITBOX_FAMILIES`
 * (`src/donor/physics/presets.js`) rather than imported: `src/donor/**` is
 * value-import-banned for this worker, and a car list the host does not
 * control would be a lie. Pass `cars` to use the live list instead.
 */
const DEFAULT_TOUCH_CARS: readonly TouchCarOption[] = Object.freeze([
  "octane",
  "fennec",
  "challenger",
  "vanguard",
  "merc",
  "plank",
  "breakout",
  "vesper",
  "volt",
  "amethyst",
  "crimson",
  "spectre",
  "specter-2",
  "tripo",
  "chicky",
  "flat-car",
].map((id) => Object.freeze({ id, label: id })));

const clampPercent = (value: number | undefined): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
};

/* -------------------------------------------------------------------------- */
/* Lobby                                                                       */
/* -------------------------------------------------------------------------- */

const TeamChip = ({
  team,
  label,
  selected,
  disabled,
  onSelect,
}: {
  readonly team: TouchTeamPreference;
  readonly label: string;
  readonly selected: boolean;
  readonly disabled: boolean;
  readonly onSelect: (team: TouchTeamPreference) => void;
}) => (
  <button
    type="button"
    className={`ra-tc-chip${team === "blue" ? " ra-tc-chip--blue" : team === "orange" ? " ra-tc-chip--orange" : ""}`}
    data-selected={selected ? "true" : "false"}
    disabled={disabled}
    onClick={() => onSelect(team)}
  >
    {label}
  </button>
);

const TouchLobby = ({
  nickname,
  onNicknameChange,
  teamPreference,
  onTeamChange,
  cars,
  selectedCarId,
  onCarChange,
  ready,
  onReadyChange,
  controlsDisabled,
}: {
  readonly nickname: string;
  readonly onNicknameChange?: (value: string) => void;
  readonly teamPreference: TouchTeamPreference;
  readonly onTeamChange?: (team: TouchTeamPreference) => void;
  readonly cars: readonly TouchCarOption[];
  readonly selectedCarId: string;
  readonly onCarChange?: (carId: string) => void;
  readonly ready: boolean;
  readonly onReadyChange?: (ready: boolean) => void;
  readonly controlsDisabled: boolean;
}) => (
  <div className="ra-tc-lobby" data-testid="ra-touch-lobby">
    <div className="ra-tc-lobby__group">
      <label className="ra-tc-lobby__label" htmlFor="ra-tc-nickname">
        Name
      </label>
      <input
        id="ra-tc-nickname"
        className="ra-tc-input"
        type="text"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        maxLength={24}
        placeholder="Driver"
        value={nickname}
        onChange={(event) => onNicknameChange?.(event.currentTarget.value)}
      />
    </div>

    <div className="ra-tc-lobby__group">
      <span className="ra-tc-lobby__label">Team</span>
      <div className="ra-tc-row" role="group" aria-label="Team">
        <TeamChip
          team="auto"
          label="Auto"
          selected={teamPreference === "auto"}
          disabled={controlsDisabled}
          onSelect={(team) => onTeamChange?.(team)}
        />
        <TeamChip
          team="blue"
          label="Blue"
          selected={teamPreference === "blue"}
          disabled={controlsDisabled}
          onSelect={(team) => onTeamChange?.(team)}
        />
        <TeamChip
          team="orange"
          label="Orange"
          selected={teamPreference === "orange"}
          disabled={controlsDisabled}
          onSelect={(team) => onTeamChange?.(team)}
        />
      </div>
    </div>

    <div className="ra-tc-lobby__group">
      <span className="ra-tc-lobby__label">Car</span>
      {cars.length === 0 ? (
        <p className="ra-tc-hint">No cars published by the host yet.</p>
      ) : (
        <div className="ra-tc-row" role="group" aria-label="Car">
          {cars.map((car) => (
            <button
              key={car.id}
              type="button"
              className="ra-tc-chip"
              data-selected={car.id === selectedCarId ? "true" : "false"}
              disabled={controlsDisabled}
              onClick={() => onCarChange?.(car.id)}
            >
              {car.label}
            </button>
          ))}
        </div>
      )}
    </div>

    <p className="ra-tc-hint">
      Everything on this screen is private to your phone. Paint, decals and
      performance tuning stay on the projector.
    </p>

    <button
      type="button"
      className="ra-tc-ready"
      data-ready={ready ? "true" : "false"}
      data-testid="ra-touch-ready"
      disabled={controlsDisabled}
      onClick={() => onReadyChange?.(!ready)}
    >
      {ready ? "Ready — wait for host" : "Ready"}
    </button>
  </div>
);

/* -------------------------------------------------------------------------- */
/* Gameplay                                                                    */
/* -------------------------------------------------------------------------- */

const BUTTONS = [
  { id: "handbrake", glyph: "⌁", ground: "Drift", air: "Air Roll", className: "ra-tc-btn--handbrake" },
  { id: "boost", glyph: "↗", ground: "Boost", air: "Boost", className: "ra-tc-btn--boost" },
  { id: "jump", glyph: "↑", ground: "Jump", air: "Jump", className: "ra-tc-btn--jump" },
  { id: "ballCam", glyph: "◉", ground: "Cam", air: "Cam", className: "ra-tc-btn--minor ra-tc-btn--ballcam" },
  { id: "reverse", glyph: "⇩", ground: "Rev", air: "Rev", className: "ra-tc-btn--minor ra-tc-btn--reverse" },
] as const;

const TouchGameplay = ({
  disabled,
  held,
  airborne,
  boostPercent,
  boostActive,
  knobRef,
  stickHandlers,
  buttonHandlers,
  onActivate,
}: {
  readonly disabled: boolean;
  readonly held: Readonly<Record<string, boolean>>;
  readonly airborne: boolean;
  readonly boostPercent: number;
  readonly boostActive: boolean;
  readonly knobRef: RefObject<HTMLDivElement | null>;
  readonly stickHandlers: ReturnType<typeof useTouchInput>["stickHandlers"];
  readonly buttonHandlers: ReturnType<typeof useTouchInput>["buttonHandlers"];
  /** Fires a press with no pointer involved (keyboard / assistive tech). */
  readonly onActivate: (button: TouchButtonId) => void;
}) => {
  const airLabel = airborne ? "Air: stick pitches & yaws" : "Ground: stick steers";
  const driftLabel = airborne ? "Air Roll" : "Drift";

  return (
    <div
      className="ra-tc-gameplay"
      data-testid="ra-touch-gameplay"
      data-airborne={airborne ? "true" : "false"}
    >
      {/* LEFT THUMB ------------------------------------------------------ */}
      <div className="ra-tc-half ra-tc-half--left">
        <div
          className="ra-tc-stick"
          role="group"
          aria-label="Driving stick: throttle and steering, pitch and yaw in the air"
          data-testid="ra-touch-stick"
          {...stickHandlers}
        >
          <span className="ra-tc-stick__label ra-tc-stick__label--top">
            {airborne ? "Pitch" : "Drive"}
          </span>
          <span className="ra-tc-stick__label ra-tc-stick__label--bottom">
            {airborne ? "Throttle" : "Reverse"}
          </span>
          <div className="ra-tc-stick__knob" ref={knobRef} aria-hidden="true" />
        </div>
      </div>

      {/* RIGHT THUMB ----------------------------------------------------- */}
      <div className="ra-tc-half ra-tc-half--right">
        <div className="ra-tc-cluster" role="group" aria-label="Actions">
          {BUTTONS.map((button) => {
            const isHeld = held[button.id] === true;
            const label = button.id === "handbrake" ? driftLabel : button.ground;
            return (
              <button
                key={button.id}
                type="button"
                className={`ra-tc-btn ${button.className}`}
                data-held={isHeld ? "true" : "false"}
                data-control={button.id}
                data-testid={`ra-touch-btn-${button.id}`}
                aria-pressed={button.id === "ballCam" ? undefined : isHeld}
                aria-label={label}
                disabled={disabled}
                {...buttonHandlers[button.id]}
                onClick={(event) => {
                  // `detail === 0` means the click was synthesised (Enter/Space
                  // on a focused button, or assistive tech) — no pointer event
                  // ever fired, so the press would otherwise be invisible.
                  // A real tap already counted; replaying it would double-fire.
                  if (event.detail === 0) onActivate(button.id);
                }}
              >
                <span className="ra-tc-btn__glyph" aria-hidden="true">
                  {button.glyph}
                </span>
                <span className="ra-tc-btn__label">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Readouts -------------------------------------------------------- */}
      <div
        className="ra-tc-boost"
        data-active={boostActive ? "true" : "false"}
        data-empty={boostPercent <= 0 ? "true" : "false"}
        role="status"
        aria-live="off"
        aria-label={`Boost ${boostPercent} percent`}
      >
        <span className="ra-tc-boost__label">Boost</span>
        <span className="ra-tc-boost__value">{boostPercent}</span>
        <span className="ra-tc-boost__track">
          <span className="ra-tc-boost__fill" style={{ width: `${boostPercent}%` }} />
        </span>
      </div>

      <div className="ra-tc-airchip" data-airborne={airborne ? "true" : "false"}>
        {airLabel}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* The component                                                               */
/* -------------------------------------------------------------------------- */

export const TouchController = ({
  phase = "playing",
  controlsDisabled = false,
  onIntents,
  onControls,
  controllerRef,
  airborne = null,
  boostPercent,
  hapticsEnabled = true,
  nickname = "",
  onNicknameChange,
  teamPreference = "auto",
  onTeamChange,
  cars = DEFAULT_TOUCH_CARS,
  selectedCarId = "",
  onCarChange,
  ready = false,
  onReadyChange,
}: TouchControllerProps): JSX.Element => {
  const gameplayActive = phase === "playing" && !controlsDisabled;
  const surfaceRef = useRef<HTMLDivElement | null>(null);

  /**
   * Air context is host-owned. The override exists so a host reading physics
   * state at 120 Hz can push it without a React round trip; a bump counter is
   * enough to land it in the ref the input hook reads.
   */
  const airborneOverrideRef = useRef<boolean | null>(null);
  const [, forceAirborneSync] = useState(0);
  const effectiveAirborne = airborneOverrideRef.current ?? airborne;

  const handleIntents = useCallback(
    (intents: RawTouchIntents) => {
      onIntents?.(intents);
      onControls?.(deriveCarControls(intents));
    },
    [onIntents, onControls],
  );

  const { stickHandlers, buttonHandlers, held, knobRef, getState, releaseAll, pressButton } =
    useTouchInput({
      // Held controls are always dropped when the surface is not live, which is
      // what keeps a phone that backgrounds mid-boost from returning with the
      // throttle open.
      enabled: gameplayActive,
      airborne: effectiveAirborne,
      onIntents: handleIntents,
      hapticsEnabled,
      surfaceRef,
    });

  useGameplayViewportLock(gameplayActive);

  useImperativeHandle(
    controllerRef,
    (): TouchControllerHandle => ({
      read: () => readRawIntents(getState(), effectiveAirborne),
      release: releaseAll,
      setAirborne: (next) => {
        airborneOverrideRef.current = next;
        forceAirborneSync((n) => n + 1);
      },
    }),
    [getState, releaseAll, effectiveAirborne],
  );

  const resolvedCarId = selectedCarId || cars[0]?.id || "";

  return (
    <div className="ra-tc" ref={surfaceRef} data-phase={phase}>
      {gameplayActive ? (
        <TouchGameplay
          disabled={controlsDisabled}
          held={held}
          airborne={effectiveAirborne === true}
          boostPercent={clampPercent(boostPercent)}
          boostActive={held.boost === true}
          knobRef={knobRef}
          stickHandlers={stickHandlers}
          buttonHandlers={buttonHandlers}
          onActivate={pressButton}
        />
      ) : (
        <TouchLobby
          nickname={nickname}
          onNicknameChange={onNicknameChange}
          teamPreference={teamPreference}
          onTeamChange={onTeamChange}
          cars={cars}
          selectedCarId={resolvedCarId}
          onCarChange={onCarChange}
          ready={ready}
          onReadyChange={onReadyChange}
          controlsDisabled={controlsDisabled}
        />
      )}
    </div>
  );
};
