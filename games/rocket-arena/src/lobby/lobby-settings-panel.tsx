/**
 * Host match settings, including the one-click EVENT MODE preset.
 *
 * OWNER: the lobby worker (`src/lobby/**`).
 *
 * EVENT MODE IS A PRESET, NOT A PILE OF TOGGLES. There is exactly one control
 * for it, and it writes every field at once (see `EVENT_MODE_SETTINGS`).
 * Individual settings stay editable afterwards for a host who knows what they
 * are doing, but the common case at an event is a single tap.
 */

import type { ReactNode } from "react";
import {
  BOT_DIFFICULTY_LABELS,
  BOT_DIFFICULTY_OPTIONS,
  BOT_FILL_LABELS,
  BOT_FILL_OPTIONS,
  MATCH_LENGTH_LABELS,
  MATCH_LENGTH_OPTIONS,
  PLAYER_SLOT_OPTIONS,
  TEAM_SIZE_OPTIONS,
} from "./settings";
import type { BotDifficulty, BotFill, EventTuning, LobbySettings, MatchLengthMinutes } from "./types";

export interface LobbySettingsPanelProps {
  settings: LobbySettings;
  onPatch: (patch: Partial<Omit<LobbySettings, "tuning">>) => void;
  onEventMode: (enabled: boolean) => void;
  /** Optional: when omitted the boost / ball rows are not shown. */
  onTuning?: (patch: Partial<EventTuning>) => void;
  /** Rendered as a sibling of the settings column — the START affordance. */
  children?: ReactNode;
}

/** One labelled group of mutually-exclusive options. */
const OptionGroup = ({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) => (
  <div className="lobby-setting" role="group" aria-labelledby={`${id}-label`}>
    <span className="lobby-setting__label" id={`${id}-label`}>
      {label}
    </span>
    <div className="lobby-btnrow">{children}</div>
  </div>
);

export const LobbySettingsPanel = ({
  settings,
  onPatch,
  onEventMode,
  onTuning,
  children,
}: LobbySettingsPanelProps) => (
  <div className="lobby-panel lobby-panel--grow">
    <p className="lobby-panel__label">Match settings</p>

    <div className="lobby-setting">
      <span className="lobby-setting__label" id="lobby-eventmode-label">
        Event mode
      </span>
      <button
        type="button"
        className={`lobby-btn ${settings.eventMode ? "lobby-btn--selected" : ""}`}
        role="switch"
        aria-checked={settings.eventMode}
        aria-labelledby="lobby-eventmode-label"
        onClick={() => onEventMode(!settings.eventMode)}
      >
        {settings.eventMode ? "On — 4p · 2v2 · 3 min" : "Off"}
      </button>
    </div>

    <OptionGroup id="lobby-length" label="Match length">
      {MATCH_LENGTH_OPTIONS.map((value: MatchLengthMinutes) => (
        <button
          key={value}
          type="button"
          className={`lobby-btn ${settings.matchLength === value ? "lobby-btn--selected" : ""}`}
          aria-pressed={settings.matchLength === value}
          onClick={() => onPatch({ matchLength: value })}
        >
          {MATCH_LENGTH_LABELS[value]}
        </button>
      ))}
    </OptionGroup>

    <OptionGroup id="lobby-seats" label="Seats">
      {PLAYER_SLOT_OPTIONS.map((value) => (
        <button
          key={value}
          type="button"
          className={`lobby-btn ${settings.playerSlots === value ? "lobby-btn--selected" : ""}`}
          aria-pressed={settings.playerSlots === value}
          onClick={() => onPatch({ playerSlots: value })}
        >
          {value}
        </button>
      ))}
    </OptionGroup>

    <OptionGroup id="lobby-teamsize" label="Team size">
      {TEAM_SIZE_OPTIONS.map((value) => (
        <button
          key={value}
          type="button"
          className={`lobby-btn ${settings.teamSize === value ? "lobby-btn--selected" : ""}`}
          aria-pressed={settings.teamSize === value}
          onClick={() => onPatch({ teamSize: value })}
        >
          {value}v{value}
        </button>
      ))}
    </OptionGroup>

    <OptionGroup id="lobby-bots" label="Bot fill">
      {BOT_FILL_OPTIONS.map((value: BotFill) => (
        <button
          key={value}
          type="button"
          className={`lobby-btn ${settings.botFill === value ? "lobby-btn--selected" : ""}`}
          aria-pressed={settings.botFill === value}
          onClick={() => onPatch({ botFill: value })}
        >
          {BOT_FILL_LABELS[value]}
        </button>
      ))}
    </OptionGroup>

    <OptionGroup id="lobby-botdiff" label="Bot difficulty">
      {BOT_DIFFICULTY_OPTIONS.map((value: BotDifficulty) => (
        <button
          key={value}
          type="button"
          className={`lobby-btn ${settings.botDifficulty === value ? "lobby-btn--selected" : ""}`}
          aria-pressed={settings.botDifficulty === value}
          onClick={() => onPatch({ botDifficulty: value })}
        >
          {BOT_DIFFICULTY_LABELS[value]}
        </button>
      ))}
    </OptionGroup>

    {onTuning ? (
      <>
        <OptionGroup id="lobby-boost" label="Boost">
          {(["normal", "turbo"] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={`lobby-btn ${settings.tuning.boost === value ? "lobby-btn--selected" : ""}`}
              aria-pressed={settings.tuning.boost === value}
              onClick={() => onTuning({ boost: value })}
            >
              {value === "turbo" ? "Unlimited" : "Normal"}
            </button>
          ))}
        </OptionGroup>

        <OptionGroup id="lobby-ball" label="Ball">
          {(["normal", "heavy"] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={`lobby-btn ${settings.tuning.ball === value ? "lobby-btn--selected" : ""}`}
              aria-pressed={settings.tuning.ball === value}
              onClick={() => onTuning({ ball: value })}
            >
              {value === "heavy" ? "Heavy" : "Normal"}
            </button>
          ))}
        </OptionGroup>
      </>
    ) : null}

    {children}
  </div>
);
