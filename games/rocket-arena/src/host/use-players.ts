/**
 * The room's players as the host sees them: Air Jam phones plus physical
 * gamepads. Everything that used to read the SDK's player list reads this, so a
 * controller is a player everywhere a phone is (lobby, seating, mid-match
 * join/leave, haptics).
 */
import { useEffect, useMemo, useState } from "react";
import { useAirJamHost } from "@air-jam/sdk";

import { getGamepadHub, type PadPlayer } from "@/host/gamepads";

export interface RoomPlayer {
  id: string;
  label: string;
}

/** Connected gamepads, re-rendering on connect/disconnect only. */
export const useGamepadPlayers = (): PadPlayer[] => {
  const hub = getGamepadHub();
  const [pads, setPads] = useState<PadPlayer[]>(() => hub.players());
  useEffect(() => {
    const sync = (): void =>
      setPads((previous) => {
        const next = hub.players();
        const same = next.length === previous.length && next.every((pad, index) => pad.id === previous[index]!.id && pad.label === previous[index]!.label);
        return same ? previous : next;
      });
    sync();
    return hub.subscribe(sync);
  }, [hub]);
  return pads;
};

/** Phones first, then gamepads, as one list. Referentially stable between changes. */
export const useRoomPlayers = (): RoomPlayer[] => {
  const phones = useAirJamHost((state) => state.players);
  const pads = useGamepadPlayers();
  return useMemo(
    () => [...phones.map((player) => ({ id: player.id, label: player.label })), ...pads],
    [phones, pads],
  );
};
