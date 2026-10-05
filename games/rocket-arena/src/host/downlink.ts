/**
 * Host -> phone live readout.
 *
 * Air Jam's only broadcast channel to controllers that carries free-form data is
 * the `message` string of a state update (everything else on the wire is a
 * fixed schema). So the host publishes ONE compact JSON string a few times a
 * second and every phone reads just its own entry. The payload is keyed by
 * controller id, so a phone never needs to know which car is which.
 *
 *   {"v":1,"s":{"pad-1":[84,0,0,1],"pad-2":[12,1,0,0]}}
 *                          boost ^  ^ airborne  ^ demolished  ^ team (0 blue, 1 orange; optional)
 *
 * An absent key means "you have no car in this match" (a spectator).
 */

export interface PhoneReadout {
  /** 0-100. */
  boost: number;
  airborne: boolean;
  demolished: boolean;
  /** The car's team (0 blue, 1 orange), so the phone can badge you in your colour. */
  team?: 0 | 1 | null;
}

export interface Downlink {
  seats: Readonly<Record<string, PhoneReadout>>;
}

const clampBoost = (value: number): number =>
  Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 0;

export const encodeDownlink = (seats: Readonly<Record<string, PhoneReadout>>): string => {
  const compact: Record<string, (number)[]> = {};
  for (const [playerId, readout] of Object.entries(seats)) {
    const entry = [clampBoost(readout.boost), readout.airborne ? 1 : 0, readout.demolished ? 1 : 0];
    if (readout.team === 0 || readout.team === 1) entry.push(readout.team);
    compact[playerId] = entry;
  }
  return JSON.stringify({ v: 1, s: compact });
};

/** Never throws: a garbled or foreign message just means "no readout". */
export const decodeDownlink = (raw: string | null | undefined): Downlink | null => {
  if (typeof raw !== "string" || raw.length === 0) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const message = parsed as { v?: unknown; s?: unknown };
  if (message.v !== 1 || typeof message.s !== "object" || message.s === null) return null;
  const seats: Record<string, PhoneReadout> = {};
  for (const [playerId, entry] of Object.entries(message.s as Record<string, unknown>)) {
    if (!Array.isArray(entry)) continue;
    const readout: PhoneReadout = {
      boost: clampBoost(Number(entry[0])),
      airborne: entry[1] === 1,
      demolished: entry[2] === 1,
    };
    if (entry[3] === 0 || entry[3] === 1) readout.team = entry[3];
    seats[playerId] = readout;
  }
  return { seats };
};
