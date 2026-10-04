/**
 * The projector roster: who is here, which team, and are they ready.
 *
 * OWNER: the lobby worker (`src/lobby/**`).
 *
 * Deliberately does NOT show car customisation. The brief is explicit that the
 * phone owns that; on a projector seen from 10 metres, a wall of paint swatches
 * is noise. The car's name is not even shown here — a host only needs to know
 * it was set, which the phone confirms privately.
 */

import type { LobbyRosterRow } from "./lobby-selectors";

export interface LobbyRosterProps {
  rows: LobbyRosterRow[];
  /** `"BLUE 2 — ORANGE 2"`. */
  tallyLabel: string;
  /** Non-empty when humans alone exceed the team size. */
  warning: string;
  /** Mirrored into the `aria-live` region. */
  announcement: string;
  onChangeTeams: () => void;
  onClearReady: () => void;
  /** Add a computer-controlled seat to a team. Omit to hide the CPU controls. */
  onAddCpu?: (team: 0 | 1) => void;
  onRemoveCpu?: (id: string) => void;
  /** Move a CPU to the other team. */
  onSwitchCpu?: (id: string, team: 0 | 1) => void;
  /** False when there is no free seat (the add buttons are disabled). */
  canAddCpu?: boolean;
}

const isEmptyRow = (row: LobbyRosterRow) => row.teamLabel === "—";

export const LobbyRoster = ({
  rows,
  tallyLabel,
  warning,
  announcement,
  onChangeTeams,
  onClearReady,
  onAddCpu,
  onRemoveCpu,
  onSwitchCpu,
  canAddCpu = true,
}: LobbyRosterProps) => (
  <div className="lobby-panel lobby-panel--grow">
    <p className="lobby-panel__label">Roster</p>

    <ul className="lobby-roster">
      {rows.map((row) => (
        <li
          key={row.id}
          className={[
            "lobby-roster__row",
            `lobby-roster__row--${row.team === 1 ? "orange" : "blue"}`,
            isEmptyRow(row) ? "lobby-roster__row--empty" : "",
            row.cpu ? "lobby-roster__row--cpu" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <span className="lobby-roster__seat" aria-hidden="true">
            {row.seat}
          </span>
          <span className="lobby-roster__name">
            {row.name}
            {row.cpu ? <em className="lobby-roster__cpu-tag">AI</em> : null}
          </span>
          {isEmptyRow(row) ? (
            <span className="lobby-roster__team" style={{ background: "transparent", color: "#64748b" }}>
              —
            </span>
          ) : (
            <span className={`lobby-roster__team lobby-roster__team--${row.team === 1 ? "orange" : "blue"}`}>
              {row.teamLabel}
            </span>
          )}
          {row.cpu ? null : (
            <span
              className={`lobby-roster__ready lobby-roster__ready--${row.ready ? "yes" : "no"}`}
            >
              {isEmptyRow(row) ? "" : row.ready ? "READY" : "WAITING"}
            </span>
          )}
          {row.cpu ? (
            <span className="lobby-roster__cpu-actions">
              <button
                type="button"
                className="lobby-roster__icon-btn"
                aria-label={`Move ${row.name} to ${row.team === 0 ? "orange" : "blue"}`}
                title="Switch team"
                onClick={() => onSwitchCpu?.(row.id, row.team === 0 ? 1 : 0)}
              >
                ⇄
              </button>
              <button
                type="button"
                className="lobby-roster__icon-btn"
                aria-label={`Remove ${row.name}`}
                title="Remove"
                onClick={() => onRemoveCpu?.(row.id)}
              >
                ✕
              </button>
            </span>
          ) : null}
        </li>
      ))}
    </ul>

    <p className="lobby-roster__tally">{tallyLabel}</p>
    {warning.length > 0 ? <p className="lobby-roster__warning">{warning}</p> : null}

    {onAddCpu ? (
      <div className="lobby-btnrow lobby-btnrow--cpu">
        <button
          type="button"
          className="lobby-btn lobby-btn--cpu-blue"
          disabled={!canAddCpu}
          onClick={() => onAddCpu(0)}
        >
          + CPU Blue
        </button>
        <button
          type="button"
          className="lobby-btn lobby-btn--cpu-orange"
          disabled={!canAddCpu}
          onClick={() => onAddCpu(1)}
        >
          + CPU Orange
        </button>
      </div>
    ) : null}

    <div className="lobby-btnrow">
      <button type="button" className="lobby-btn" onClick={onChangeTeams}>
        Change teams
      </button>
      <button type="button" className="lobby-btn" onClick={onClearReady}>
        Clear ready
      </button>
    </div>

    {/*
      One polite live region for the whole roster. Announcing the joined count
      on every row change is what a person standing at the back of the room
      actually needs; re-announcing each name would be unusable in a loud venue.
    */}
    <p className="lobby-live" role="status" aria-live="polite" aria-atomic="true">
      {announcement}
    </p>
  </div>
);
