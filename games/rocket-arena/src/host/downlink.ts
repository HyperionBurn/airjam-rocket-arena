/**
 * Host -> phone live readout.
 *
 * Air Jam's only broadcast channel to controllers that carries free-form data is
 * the `message` string of a state update (everything else on the wire is a
 * fixed schema). So the host publishes ONE compact JSON string a few times a
 * second and every phone reads just its own entry. The payload is keyed by
 * controller id, so a phone never needs to know which car is which.
 *
 *   {"v":1,"s":{"pad-1":[84,0,0],"pad-2":[12,1,0]}}
 *                          boost ^  ^ airborne  ^ demolished
 *
 * An absent key means "you have no car in this match" (a spectator).
 */

export interface PhoneReadout {
  /** 0-100. */
  boost: number;
  airborne: boolean;
  demolished: boolean;
}

export interface Downlink {
  seats: Readonly<Record<string, PhoneReadout>>;
}

const clampBoost = (value: number): number =>
  Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 0;

export const encodeDownlink = (seats: Readonly<Record<string, PhoneReadout>>): string => {
  const compact: Record<string, [number, 0 | 1, 0 | 1]> = {};
  for (const [playerId, readout] of Object.entries(seats)) {
    compact[playerId] = [clampBoost(readout.boost), readout.airborne ? 1 : 0, readout.demolished ? 1 : 0];
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
    seats[playerId] = {
      boost: clampBoost(Number(entry[0])),
      airborne: entry[1] === 1,
      demolished: entry[2] === 1,
    };
  }
  return { seats };
};
