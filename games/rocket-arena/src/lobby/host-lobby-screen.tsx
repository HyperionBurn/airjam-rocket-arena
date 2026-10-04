/**
 * The host / projector lobby surface for Rocket Arena.
 *
 * OWNER: the lobby worker (`src/lobby/**`).
 *
 * This is the primary event screen. It owns the room around the 3D game and
 * nothing about the game itself: it never boots the donor, never touches the
 * simulation, and never starts a match on its own. It dispatches intents into
 * the lobby store and the orchestrator decides what those mean for the sim.
 *
 * ---------------------------------------------------------------------------
 * THE ONE-LINE INTEGRATION THE ORCHESTRATOR NEEDS
 * ---------------------------------------------------------------------------
 *   const store = createLobbyStore();
 *   <LobbyStoreProvider store={store}>
 *     <HostLobbyScreen />
 *   </LobbyStoreProvider>
 *
 * and then, from the real session:
 *   store.dispatch({ type: "room/set", roomCode: host.roomId, joinUrl: host.joinUrl });
 *   store.dispatch({ type: "players/sync", players: host.players.map(toSeed) });
 *
 * Every host control is also available as an `onX` prop so the orchestrator can
 * intercept a press and do its own thing (start the donor, resize viewports)
 * before or instead of the default dispatch.
 */

import { useMemo, type ReactNode } from "react";
import "./lobby.css";
import { ControllerJoinFlow } from "./controller-join-flow";
import { LobbyQrPanel } from "./lobby-qr-panel";
import { LobbyRoster } from "./lobby-roster";
import { LobbySettingsPanel } from "./lobby-settings-panel";
import {
  selectClockLabel,
  selectJoinCountLabel,
  selectRoster,
  selectScoreLabel,
  selectTeamCounts,
  selectTeamOverflow,
  selectTeamScoreLabel,
} from "./lobby-selectors";
import { useLobbyDispatch, useLobbyState } from "./lobby-store-context";
import type { LobbySettings } from "./types";

const GAME_TITLE = "Rocket Arena";

export interface HostLobbyScreenProps {
  /** Overrides the default title. */
  title?: string;
  /** Shown instead of the built-in START when provided. */
  startControl?: ReactNode;
  /**
   * Called after the reducer accepts `match/start`. This is the orchestrator's
   * hook for actually launching the match — the lobby only flips its own phase.
   */
  onStartMatch?: () => void;
  /** Called after the reducer accepts `match/rematch`. */
  onRematch?: () => void;
  /** Called after the reducer accepts `lobby/reshuffleTeams`. */
  onChangeTeams?: () => void;
  /** Called after the reducer accepts `lobby/return`. */
  onExit?: () => void;
}

export const HostLobbyScreen = ({
  title = GAME_TITLE,
  startControl,
  onStartMatch,
  onRematch,
  onChangeTeams,
  onExit,
}: HostLobbyScreenProps) => {
  const state = useLobbyState();
  const dispatch = useLobbyDispatch();

  // Derived reads are memoised on the state object, which the reducer only
  // replaces when something actually changed.
  const roster = useMemo(() => selectRoster(state), [state]);
  const joinCountLabel = useMemo(() => selectJoinCountLabel(state), [state]);
  const tallyLabel = useMemo(() => selectTeamScoreLabel(state), [state]);
  const clockLabel = useMemo(() => selectClockLabel(state), [state]);
  const scoreLabel = useMemo(() => selectScoreLabel(state), [state]);
  const overflow = useMemo(() => selectTeamOverflow(state), [state]);
  const counts = useMemo(() => selectTeamCounts(state), [state]);

  if (state.phase === "playing") {
    return (
      <div className="lobby-root">
        <div className="lobby-screen lobby-screen--playing" data-testid="lobby-playing">
          <div className="lobby-scoreboard">
            <p className="lobby-scoreboard__clock">{clockLabel}</p>
            <p className="lobby-scoreboard__score">
              <span>{state.match.blue}</span>
              <span>:</span>
              <span>{state.match.orange}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (state.phase === "post-match") {
    const leader =
      state.match.blue === state.match.orange ? null : state.match.blue > state.match.orange ? 0 : 1;
    return (
      <div className="lobby-root">
        <div className="lobby-screen" data-testid="lobby-post-match">
          <div className="lobby-postmatch">
            <h2
              className={`lobby-postmatch__title lobby-postmatch__title--${
                leader === null ? "draw" : leader === 0 ? "blue" : "orange"
              }`}
            >
              {leader === null ? "Draw" : `${leader === 0 ? "Blue" : "Orange"} wins`}
            </h2>
            <p className="lobby-postmatch__score">{scoreLabel}</p>

            <div className="lobby-postmatch__actions">
              {/*
                INSTANT REMATCH. One tap, one dispatch, no rejoin and no reload:
                the same players stay on the same teams with the same cars.
              */}
              <button
                type="button"
                className="lobby-btn lobby-btn--primary"
                onClick={() => {
                  dispatch({ type: "match/rematch" });
                  onRematch?.();
                }}
              >
                Rematch
              </button>
              <button
                type="button"
                className="lobby-btn"
                onClick={() => {
                  dispatch({ type: "lobby/reshuffleTeams" });
                  onChangeTeams?.();
                }}
              >
                Change teams
              </button>
              <button
                type="button"
                className="lobby-btn lobby-btn--ghost"
                onClick={() => {
                  dispatch({ type: "lobby/return" });
                  onExit?.();
                }}
              >
                Exit to lobby
              </button>
            </div>

            <p className="lobby-postmatch__hint">
              {state.settings.instantRematch
                ? "Instant rematch is on — everyone stays in their car."
                : "Rematch keeps the same teams and cars."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lobby-root">
      <div className="lobby-screen" data-testid="lobby-host-screen">
        <header className="lobby-topbar">
          <h1 className="lobby-title">
            {title} <em>· Air Jam</em>
          </h1>
          <div className="lobby-topbar__meta">
            <p className="lobby-roomcode">
              <span>Room</span>
              {state.roomCode.length > 0 ? state.roomCode : "·····"}
            </p>
            <p
              className={`lobby-eventmode ${
                state.settings.eventMode ? "lobby-eventmode--on" : "lobby-eventmode--off"
              }`}
            >
              {state.settings.eventMode ? "Event mode" : "Standard"}
            </p>
          </div>
        </header>

        <div className="lobby-body">
          <div className="lobby-column">
            <LobbyQrPanel
              joinUrl={state.joinUrl}
              roomCode={state.roomCode}
              joinCountLabel={joinCountLabel}
            />
          </div>

          <div className="lobby-column">
            <LobbyRoster
              rows={roster}
              tallyLabel={tallyLabel}
              warning={overflow ? "More players than seats — raise seats or use bots" : ""}
              announcement={state.announcement}
              onChangeTeams={() => dispatch({ type: "lobby/reshuffleTeams" })}
              onClearReady={() => dispatch({ type: "roster/clearReady" })}
              onAddCpu={(team) => dispatch({ type: "cpu/add", team })}
              onRemoveCpu={(id) => dispatch({ type: "cpu/remove", id })}
              onSwitchCpu={(id, team) => dispatch({ type: "cpu/team", id, team })}
              canAddCpu={state.players.length + state.cpus.length < state.settings.playerSlots}
            />
          </div>

          <div className="lobby-column">
            <LobbySettingsPanel
              settings={state.settings}
              onPatch={(patch: Partial<Omit<LobbySettings, "tuning">>) =>
                dispatch({ type: "settings/patch", patch })
              }
              onEventMode={(enabled) => dispatch({ type: "settings/eventMode", enabled })}
              onTuning={(patch) => dispatch({ type: "settings/tuning", patch })}
            >
              <div className="lobby-start">
                {startControl ?? (
                  <button
                    type="button"
                    className="lobby-btn lobby-btn--primary"
                    onClick={() => {
                      dispatch({ type: "match/start" });
                      onStartMatch?.();
                    }}
                  >
                    Start match
                  </button>
                )}
                <p className="lobby-start__reason" role="status">
                  {startReason(state.phase, counts.blue + counts.orange, state.players, state.cpus.length)}
                </p>
              </div>
            </LobbySettingsPanel>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Why START is or is not available, in words big enough to read from the back
 * of a room. The reducer owns the RULE (`selectReadiness`); this only words it
 * for the screen, so the two can never disagree.
 */
const startReason = (
  phase: string,
  seated: number,
  players: { ready: boolean }[],
  cpus: number,
): string => {
  if (phase !== "lobby") {
    return "";
  }
  if (seated === 0) {
    return cpus > 0 ? "Scan to join - CPUs need a player" : "Scan to join";
  }
  const ready = players.filter((player) => player.ready).length;
  return ready === players.length ? "" : `${ready} of ${players.length} ready`;
};

export { ControllerJoinFlow };
