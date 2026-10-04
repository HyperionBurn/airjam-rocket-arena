/**
 * Thin React binding over the framework-agnostic lobby store.
 *
 * OWNER: the lobby worker (`src/lobby/**`).
 *
 * The store stays the source of truth; this file only adapts it to
 * `useSyncExternalStore`. That split is what lets the orchestrator drive the
 * same state from a non-React session, a test, or a future worker.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createLobbyStore, type LobbyStore } from "./lobby-store";
import type { LobbyAction, LobbyState } from "./types";

const LobbyStoreContext = createContext<LobbyStore | null>(null);

export interface LobbyStoreProviderProps {
  /**
   * The store to read and write. Pass one you created — that is how the
   * orchestrator injects a store it also drives from a real SDK session. Omit
   * it and the provider creates a private one, which is what you want for a
   * preview or a storybook-style mount.
   */
  store?: LobbyStore;
  children: ReactNode;
}

export const LobbyStoreProvider = ({ store, children }: LobbyStoreProviderProps) => {
  const value = useMemo(() => store ?? createLobbyStore(), [store]);
  return <LobbyStoreContext value={value}>{children}</LobbyStoreContext>;
};

export const useLobbyStore = (): LobbyStore => {
  const store = useContext(LobbyStoreContext);
  if (!store) {
    throw new Error(
      "[rocket-arena/lobby] useLobbyStore must be called inside <LobbyStoreProvider>",
    );
  }
  return store;
};

/** The whole state object. Re-renders on every real change. */
export const useLobbyState = (): LobbyState => {
  const store = useLobbyStore();
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
};

/**
 * A single slice of lobby state.
 *
 * The snapshot is memoised against the state object so a selector that builds
 * a new array or object on every call still satisfies
 * `useSyncExternalStore`'s "referentially stable snapshot" requirement and
 * cannot spin the render loop. Prefer this over `useLobbyState` in a component
 * that only needs one field.
 */
export const useLobbySelector = <T,>(selector: (state: LobbyState) => T): T => {
  const store = useLobbyStore();
  const cache = useRef<{ state: LobbyState; value: T } | null>(null);

  const getSnapshot = useCallback(() => {
    const state = store.getState();
    const cached = cache.current;
    if (cached && cached.state === state) {
      return cached.value;
    }
    const value = selector(state);
    cache.current = { state, value };
    return value;
  }, [selector, store]);

  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
};

/** Dispatch bound to the ambient store. */
export const useLobbyDispatch = (): ((action: LobbyAction) => void) => {
  const store = useLobbyStore();
  return useCallback(
    (action: LobbyAction) => {
      store.dispatch(action);
    },
    [store],
  );
};
