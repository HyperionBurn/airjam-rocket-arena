/**
 * Client plumbing: REST helpers, the per-device identity, and `useRoom`, the
 * hook every screen uses to stay in sync with a room.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { AllTimeRow, GameDef } from "../core/types";
import type { PublicState } from "../core/view";
import type { ClientAction } from "../server/app";

export type { PublicState, ClientAction, GameDef, AllTimeRow };

export class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

const request = async <T,>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(path, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
  const body = (await response.json().catch(() => ({}))) as { message?: string } & T;
  if (!response.ok) throw new ApiError(response.status, body.message ?? `Request failed (${response.status})`);
  return body;
};

export const api = {
  createRoom: (totalRounds?: number) =>
    request<{ code: string; hostToken: string }>("/api/sessions", { method: "POST", body: JSON.stringify({ totalRounds }) }),
  roomInfo: (code: string) => request<{ code: string; phase: string; players: number }>(`/api/sessions/${code}`),
  join: (code: string, body: { name: string; color?: string; avatar?: string; profileToken?: string }) =>
    request<{ playerId: string; profileToken: string }>(`/api/sessions/${code}/join`, { method: "POST", body: JSON.stringify(body) }),
  leaderboard: (game?: string) =>
    request<{ rows: AllTimeRow[]; games: GameDef[] }>(`/api/leaderboard${game ? `?game=${encodeURIComponent(game)}` : ""}`),
  info: () => request<{ publicUrl: string | null; ips: string[] }>("/api/info"),
};

/* ------------------------------------------------- identity on this device */

export interface StoredProfile {
  token: string;
  name: string;
  color: string;
  avatar: string;
}

const safe = {
  get(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* private mode: the app still works, it just forgets */
    }
  },
  remove(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

export const loadProfile = (): StoredProfile | null => {
  const raw = safe.get("arcade.profile");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredProfile;
    return parsed.token && parsed.name ? parsed : null;
  } catch {
    return null;
  }
};
export const saveProfile = (profile: StoredProfile): void => safe.set("arcade.profile", JSON.stringify(profile));
export const forgetProfile = (): void => safe.remove("arcade.profile");

export const hostTokenFor = (code: string): string | null => safe.get(`arcade.host.${code}`);
export const saveHostToken = (code: string, token: string): void => safe.set(`arcade.host.${code}`, token);

/* ----------------------------------------------------------- live room hook */

export interface Room {
  state: PublicState | null;
  /** The socket is open right now. */
  online: boolean;
  /** Closed for good (bad token / no such room / room closed). */
  closedReason: string | null;
  send: (action: ClientAction) => void;
  /** Last error the server reported for an action. */
  error: string | null;
  /** Server time minus client time, for countdowns that survive clock skew. */
  clockOffset: number;
}

export const useRoom = (code: string, role: "host" | "player" | "public", token: string): Room => {
  const [state, setState] = useState<PublicState | null>(null);
  const [online, setOnline] = useState(false);
  const [closedReason, setClosedReason] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clockOffset, setClockOffset] = useState(0);
  const socket = useRef<WebSocket | null>(null);

  useEffect(() => {
    let closed = false;
    let attempt = 0;
    let retry: number | undefined;

    const open = (): void => {
      const scheme = window.location.protocol === "https:" ? "wss" : "ws";
      const ws = new WebSocket(`${scheme}://${window.location.host}/ws?code=${code}&role=${role}&token=${encodeURIComponent(token)}`);
      socket.current = ws;
      ws.onopen = () => {
        attempt = 0;
        setOnline(true);
      };
      ws.onmessage = (event) => {
        const message = JSON.parse(String(event.data)) as { type: string; state?: PublicState; message?: string };
        if (message.type === "state" && message.state) {
          setState(message.state);
          setClockOffset(message.state.serverTime - Date.now());
          setError(null);
        } else if (message.type === "error") setError(message.message ?? "Something went wrong");
      };
      ws.onclose = (event) => {
        setOnline(false);
        if (closed) return;
        if (event.code >= 4000) {
          setClosedReason(event.reason || "Disconnected");
          return;
        }
        // Wi-Fi blips are normal: back off briefly and reconnect.
        attempt += 1;
        retry = window.setTimeout(open, Math.min(4000, 400 * attempt));
      };
    };
    open();
    return () => {
      closed = true;
      window.clearTimeout(retry);
      socket.current?.close();
    };
  }, [code, role, token]);

  const send = useCallback((action: ClientAction) => {
    const ws = socket.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "action", action }));
  }, []);

  return useMemo(() => ({ state, online, closedReason, send, error, clockOffset }), [state, online, closedReason, send, error, clockOffset]);
};

/** Seconds left until a server timestamp, ticking every 250 ms. */
export const useCountdown = (endsAt: number | null | undefined, clockOffset: number): number => {
  const [, tick] = useState(0);
  useEffect(() => {
    if (!endsAt) return;
    const id = window.setInterval(() => tick((n) => n + 1), 250);
    return () => window.clearInterval(id);
  }, [endsAt]);
  return endsAt ? Math.max(0, (endsAt - (Date.now() + clockOffset)) / 1000) : 0;
};

/** Where phones should go to join, honouring a LAN address when the host is on localhost. */
export const useJoinUrl = (code: string): string => {
  const [base, setBase] = useState(window.location.origin);
  useEffect(() => {
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
    void api.info().then((info) => {
      if (info.publicUrl) setBase(info.publicUrl.replace(/\/$/, ""));
      else if (local && info.ips[0]) setBase(`${window.location.protocol}//${info.ips[0]}${window.location.port ? `:${window.location.port}` : ""}`);
    }).catch(() => undefined);
  }, []);
  return `${base}/play/${code}`;
};
