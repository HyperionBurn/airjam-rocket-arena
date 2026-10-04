/**
 * The event's front door: the projector lobby.
 *
 * Mounted by `HostSurface` and deliberately SEPARATE from the donor's own menus
 * (which are hidden in embedded mode). The lobby owns everything that happens
 * BEFORE a match — room code, QR, roster, teams, ready state, match settings,
 * EVENT MODE — and the `MatchDirector` turns its "playing" phase into a real
 * donor match. Pressing START here only changes lobby state; it never reaches
 * into the donor itself.
 */
import { useEffect, useMemo } from "react";
import { useAirJamHost } from "@air-jam/sdk";
import { useRoomPlayers } from "@/host/use-players";

import {
  HostLobbyScreen,
  LobbyStoreProvider,
  createLobbyStore,
  EVENT_MODE_SETTINGS,
} from "@/lobby";
import type { LobbyStore } from "@/lobby";

/** One lobby store for the life of the page. The donor is boot-once; so is this. */
let storeSingleton: LobbyStore | null = null;
export const getLobbyStore = (): LobbyStore => {
  storeSingleton ??= createLobbyStore();
  return storeSingleton;
};

export interface LobbyLayerProps {
  /** Hide the lobby while a match is on screen. */
  hidden: boolean;
}

export const LobbyLayer = ({ hidden }: LobbyLayerProps) => {
  const host = useAirJamHost();
  const players = useRoomPlayers();
  const store = useMemo(getLobbyStore, []);

  // Room identity: what the QR code encodes and what a player types.
  useEffect(() => {
    store.dispatch({ type: "room/set", roomCode: host.roomId ?? null, joinUrl: host.joinUrl ?? null });
  }, [store, host.roomId, host.joinUrl]);

  // Roster: Air Jam owns join/leave identity; the lobby owns team/ready/car,
  // because the SDK's `PlayerProfile` carries only `{ id, label, color?, avatarId? }`.
  // Syncing by id (rather than replacing the array) is what lets the lobby's
  // reducer preserve a player's team and seat across a re-render, and across a
  // reconnect that keeps the same id.
  useEffect(() => {
    store.dispatch({
      type: "players/sync",
      players: players.map((player) => ({ id: player.id, name: player.label })),
    });
  }, [store, players]);

  if (hidden) return null;

  return (
    <div data-lobby-root style={{ position: "fixed", inset: 0, zIndex: 9_000 }}>
      <LobbyStoreProvider store={store}>
        <HostLobbyScreen title="Rocket Arena" />
      </LobbyStoreProvider>
    </div>
  );
};

export { EVENT_MODE_SETTINGS };
