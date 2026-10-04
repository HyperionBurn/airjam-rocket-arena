/**
 * The PHONE-side join flow: name → team → car → ready.
 *
 * OWNER: the lobby worker (`src/lobby/**`).
 *
 * This is everything the projector deliberately does NOT show. Car choice in
 * particular stays on the phone: at a live event the projector is read from
 * across a room, and a grid of car swatches there would be pure noise. The
 * phone is held 30cm from the face, so it can afford a real choice.
 *
 * The component is controlled and dumb: it renders the current step, calls
 * `onTeam`, `onCar`, `onNameChange` and `onReady`, and knows nothing about the
 * store. The controller surface that owns `src/controller/**` decides how
 * those intents reach the host (Air Jam input, a synced store, or a signal).
 *
 * AUTO is a first-class team option, not an afterthought: it produces a
 * balanced room (2/2 at four players, 3/3 at six) and is what most people will
 * pick because it is the fastest path to playing.
 */

import { useId, useState, type FormEvent } from "react";
import { CAR_SELECTION_SUPPORTED, GARAGE_CARS, TEAM_CHOICE_LABELS } from "./settings";
import type { TeamChoice } from "./types";

export type JoinStep = "name" | "team" | "car" | "ready";

export interface ControllerJoinFlowProps {
  /** Stable id of THIS phone's Air Jam controller. */
  playerId: string;
  /** Mirrored from the store, or held locally until the first sync. */
  name: string;
  teamPreference: TeamChoice;
  carId: string | null;
  ready: boolean;
  /** The host's live phase, so the phone can say "match started". */
  phase: "lobby" | "playing" | "post-match";
  onNameChange: (name: string) => void;
  onTeam: (choice: TeamChoice) => void;
  onCar: (carId: string) => void;
  onReady: (ready: boolean) => void;
  /** Host-side join, once the name is good enough. */
  onJoin: () => void;
}

const NEXT_LABEL: Record<JoinStep, string> = {
  name: "Continue",
  team: "Continue",
  car: "Continue",
  ready: "I'm ready",
};

export const ControllerJoinFlow = ({
  playerId,
  name,
  teamPreference,
  carId,
  ready,
  phase,
  onNameChange,
  onTeam,
  onCar,
  onReady,
  onJoin,
}: ControllerJoinFlowProps) => {
  const nameId = useId();
  const [step, setStep] = useState<JoinStep>("name");
  const [draftName, setDraftName] = useState(name);
  const [joined, setJoined] = useState(false);

  const trimmedName = draftName.trim();
  const canContinue = step === "name" ? trimmedName.length > 0 : true;

  const advance = (event: FormEvent) => {
    event.preventDefault();
    if (!canContinue) {
      return;
    }
    if (step === "name") {
      onNameChange(trimmedName);
      onJoin();
      setJoined(true);
      setStep("team");
      return;
    }
    if (step === "team") {
      setStep(CAR_SELECTION_SUPPORTED ? "car" : "ready");
      return;
    }
    if (step === "car") {
      setStep("ready");
      return;
    }
    onReady(!ready);
  };

  const status =
    phase === "playing"
      ? "Match in progress — have fun"
      : phase === "post-match"
        ? "Match over — ready up for the rematch"
        : joined && ready
          ? "Waiting for the host to start"
          : joined
            ? "Finish setting up"
            : "";

  return (
    <form className="lobby-phone" onSubmit={advance}>
      <input type="hidden" name="playerId" value={playerId} readOnly />

      {step === "name" ? (
        <div className="lobby-phone__step">
          <h1 className="lobby-phone__title">Rocket Arena</h1>
          <p className="lobby-phone__sub">
            You are the controller. The big screen is the game — you only need this
            phone.
          </p>
          <label className="lobby-phone__label" htmlFor={nameId}>
            Your name
          </label>
          <input
            id={nameId}
            className="lobby-phone__input"
            name="nickname"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            placeholder="Type a name"
            autoComplete="nickname"
            autoCapitalize="words"
            autoFocus
            maxLength={24}
            enterKeyHint="next"
          />
        </div>
      ) : null}

      {step === "team" ? (
        <div className="lobby-phone__step">
          <h1 className="lobby-phone__title">Pick a team</h1>
          <p className="lobby-phone__sub">
            AUTO puts you on the smaller team so the match stays even.
          </p>
          <div className="lobby-phone__choices lobby-phone__choices--team">
            {(["blue", "orange", "auto"] as const).map((choice) => (
              <button
                key={choice}
                type="button"
                className={`lobby-phone__choice lobby-phone__choice--${choice}`}
                aria-pressed={teamPreference === choice}
                onClick={() => onTeam(choice)}
              >
                {TEAM_CHOICE_LABELS[choice]}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === "car" ? (
        <div className="lobby-phone__step">
          <h1 className="lobby-phone__title">Pick a car</h1>
          <p className="lobby-phone__sub">Only you can see this. The screen stays clean.</p>
          <div className="lobby-phone__choices lobby-phone__choices--car">
            {GARAGE_CARS.map((car) => (
              <button
                key={car.id}
                type="button"
                className="lobby-phone__choice"
                aria-pressed={carId === car.id}
                onClick={() => onCar(car.id)}
              >
                {car.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === "ready" ? (
        <div className="lobby-phone__step">
          <h1 className="lobby-phone__title">{ready ? "You're ready" : "Ready?"}</h1>
          <p className="lobby-phone__sub">
            Team: {TEAM_CHOICE_LABELS[teamPreference]}
            {carId ? ` · ${carId.toUpperCase()}` : ""}
          </p>
          <p
            className={`lobby-phone__status lobby-phone__status--${
              phase === "lobby" ? (ready ? "ready" : "waiting") : "ready"
            }`}
          >
            {status}
          </p>
        </div>
      ) : null}

      <div className="lobby-phone__footer">
        <p className="lobby-phone__status" role="status" aria-live="polite">
          {step === "ready" ? "" : status}
        </p>
        <button
          type="submit"
          className="lobby-phone__primary"
          disabled={!canContinue}
          aria-label={step === "ready" && ready ? "Cancel ready" : NEXT_LABEL[step]}
        >
          {step === "ready" ? (ready ? "Not ready" : NEXT_LABEL.ready) : NEXT_LABEL[step]}
        </button>
        {step === "car" ? (
          <button type="button" className="lobby-phone__secondary" onClick={() => setStep("ready")}>
            Skip — use the default car
          </button>
        ) : null}
        {step === "team" || step === "car" ? (
          <button type="button" className="lobby-phone__secondary" onClick={() => setStep("name")}>
            Change my name
          </button>
        ) : null}
      </div>
    </form>
  );
};
