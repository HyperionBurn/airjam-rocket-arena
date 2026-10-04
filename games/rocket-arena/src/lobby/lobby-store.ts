/**
 * The lobby store: a ~40-line framework-agnostic container around the reducer.
 *
 * OWNER: the lobby worker (`src/lobby/**`).
 *
 * Deliberately hand-rolled rather than zustand/react context: the brief asks
 * for a pure, injectable store the orchestrator can drive from a real SDK
 * session, and this package does not depend on zustand (only `@air-jam/sdk`
 * does). Keeping it dependency-free means the same object works from a React
 * component, from a plain test, and from a future non-React session bridge.
 *
 * Usage from a real session:
 *
 *   const store = createLobbyStore();
 *   store.subscribe(() => render(store.getState()));
 *   store.dispatch({ type: "room/set", roomCode: host.roomId, joinUrl: host.joinUrl });
 *   // on every host player change:
 *   store.dispatch({
 *     type: "players/sync",
 *     players: host.players.map((p) => ({ id: p.id, name: p.label })),
 *   });
 *   // from a phone, via a controller store / signal:
 *   store.dispatch({ type: "player/ready", id, ready: true });
 */

import { createInitialLobbyState, lobbyReducer } from "./lobby-reducer";
import type { LobbyAction, LobbyState } from "./types";

export type LobbyListener = (state: LobbyState) => void;

export interface LobbyStore {
  getState(): LobbyState;
  /** Applies the action and returns the resulting state. */
  dispatch(action: LobbyAction): LobbyState;
  subscribe(listener: LobbyListener): () => void;
  /**
   * Test/teardown helper. Clears the initial-state cache so a React tree that
   * remounts under the same store re-reads through `useSyncExternalStore`.
   */
  reset(state?: LobbyState): void;
}

export const createLobbyStore = (initial?: Partial<LobbyState> | LobbyState): LobbyStore => {
  let state: LobbyState = isFullState(initial) ? initial : createInitialLobbyState(initial);
  const listeners = new Set<LobbyListener>();

  return {
    getState: () => state,

    dispatch: (action) => {
      const next = lobbyReducer(state, action);
      if (next === state) {
        // A no-op action must not wake the UI. This is the single most
        // important invariant for a container: a re-render that produces an
        // equal snapshot is an infinite loop, not an optimisation miss.
        return state;
      }
      state = next;
      for (const listener of [...listeners]) {
        listener(state);
      }
      return state;
    },

    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    reset: (next) => {
      state = next ?? createInitialLobbyState();
      for (const listener of [...listeners]) {
        listener(state);
      }
    },
  };
};

const isFullState = (value: Partial<LobbyState> | LobbyState | undefined): value is LobbyState =>
  value !== undefined && "revision" in value && "settings" in value && "phase" in value;
