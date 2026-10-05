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
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
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

  const fitRef = useRef<HTMLDivElement>(null);
  useFitToWindow(fitRef, hidden);

  if (hidden) return null;

  return (
    <div data-lobby-root style={{ position: "fixed", inset: 0, zIndex: 9_000, overflow: "hidden" }}>
      <div ref={fitRef} data-lobby-fit style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%" }}>
        <LobbyStoreProvider store={store}>
          <HostLobbyScreen title="Rocket Arena" />
        </LobbyStoreProvider>
      </div>
    </div>
  );
};

/**
 * Scale the lobby down until everything fits the window. It was laid out for a 16:9
 * projector; in a normal laptop window (e.g. 1440x680 at 200% Windows scaling) the room
 * code, the settings column and START MATCH ran off the bottom of the screen. The wrapper
 * is laid out at (window / scale) and drawn scaled, so nothing is clipped and clicks still
 * land (transforms are hit-tested). At 16:9 full screen the scale stays 1.
 */
const useFitToWindow = (ref: { current: HTMLDivElement | null }, hidden: boolean): void => {
  useLayoutEffect(() => {
    const el = ref.current;
    if (hidden || !el) return;
    const apply = (scale: number): void => {
      const s = el.style;
      if (scale >= 0.999) {
        s.transform = ""; s.width = "100%"; s.height = "100%";
      } else {
        s.transformOrigin = "0 0";
        s.transform = `scale(${scale})`;
        s.width = `${100 / scale}%`;
        s.height = `${100 / scale}%`;
      }
    };
    const extent = (): { bottom: number; right: number } => {
      let bottom = 0, right = 0;
      el.querySelectorAll("*").forEach((node) => {
        const r = node.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) return;
        if (r.bottom > bottom) bottom = r.bottom;
        if (r.right > right) right = r.right;
      });
      return { bottom, right };
    };
    const fit = (): void => {
      let scale = 1;
      apply(scale);
      for (let i = 0; i < 5; i += 1) {
        const { bottom, right } = extent();
        const over = Math.max(bottom / window.innerHeight, right / window.innerWidth);
        if (over <= 1.002) break;
        scale = Math.max(0.4, (scale / over) * 0.995);
        apply(scale);
      }
    };
    let frame = 0;
    const schedule = (): void => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => { frame = 0; fit(); });
    };
    fit();
    window.addEventListener("resize", schedule);
    // roster rows, announcements and settings change the content height
    const watch = new MutationObserver(schedule);
    watch.observe(el, { childList: true, subtree: true, characterData: true });
    return () => {
      window.removeEventListener("resize", schedule);
      watch.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
      apply(1);
    };
  }, [ref, hidden]);
};

export { EVENT_MODE_SETTINGS };
