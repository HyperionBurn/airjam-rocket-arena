/**
 * Arcade hub adapter: the pure half.
 *
 * When Rocket Arena is launched by the arcade hub it gets, on its URL:
 *
 *   ?arcade=<hub origin>&session=<room>&round=<id>&token=<round token>&players=<base64url JSON>
 *
 * and the hub's contract is: take the player list from the hub (skip our own
 * lobby), tell the hub where phones should go, report the finishing order, and
 * get out of the way. This file holds the parts of that which need no browser:
 * reading the launch, shaping the phone URL template, deciding when to start,
 * and turning a final score into hub placements.
 *
 * The hub's contract lives in apps/arcade-hub/src/core/types.ts (Placement) and
 * server/app.ts (/api/rounds/:id/ready|progress|result, bearer round token).
 */

export interface ArcadePlayer {
  id: string;
  name: string;
  color?: string;
}

export interface ArcadeLaunch {
  origin: string;
  session: string;
  round: string;
  token: string;
  players: ArcadePlayer[];
  /** Optional regulation length the hub asked for. */
  seconds: number | null;
}

export interface HubPlacement {
  playerId: string;
  rank: number | null;
  score?: number;
  stats?: Record<string, number>;
}

const fromBase64Url = (value: string): string => {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

/** Decodes the hub's `players` parameter; anything malformed yields an empty list. */
export const decodePlayers = (value: string | null): ArcadePlayer[] => {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(fromBase64Url(value));
    if (!Array.isArray(parsed)) return [];
    const players: ArcadePlayer[] = [];
    for (const entry of parsed) {
      if (!entry || typeof entry !== "object") continue;
      const { id, name, color } = entry as Record<string, unknown>;
      if (typeof id !== "string" || id.length === 0) continue;
      players.push({ id, name: typeof name === "string" && name.trim() ? name.trim() : "Player", color: typeof color === "string" ? color : undefined });
    }
    return players;
  } catch {
    return [];
  }
};

/** The launch the hub handed us, or null when the game was opened on its own. */
export const readArcadeLaunch = (search: string): ArcadeLaunch | null => {
  const params = new URLSearchParams(search);
  const origin = params.get("arcade");
  const session = params.get("session");
  const round = params.get("round");
  const token = params.get("token");
  if (!origin || !session || !round || !token) return null;
  try {
    const url = new URL(origin);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  } catch {
    return null;
  }
  const seconds = Number(params.get("seconds"));
  return {
    origin: origin.replace(/\/+$/, ""),
    session,
    round,
    token,
    players: decodePlayers(params.get("players")),
    seconds: Number.isFinite(seconds) && seconds > 0 ? seconds : null,
  };
};

/**
 * The URL template the hub fills per phone. `{playerId}` and `{name}` are the
 * hub's own placeholders (it URI-encodes them), so they must stay literal here.
 * `controllerId` makes the Air Jam player id the hub's player id: results map
 * back to hub players with no translation table.
 */
export const controllerTemplate = (joinUrl: string): string => {
  const separator = joinUrl.includes("?") ? "&" : "?";
  return `${joinUrl}${separator}controllerId={playerId}&nickname={name}&arcade=1`;
};

/** True on a phone that was opened by the hub (it hides its own lobby chores). */
export const isArcadeController = (search: string): boolean => new URLSearchParams(search).get("arcade") === "1";

/** Humans per team for the roster the hub gave us: 1v1 up to 3v3, bots fill the rest. */
export const teamSizeFor = (humans: number): number => Math.min(3, Math.max(1, Math.ceil(humans / 2)));

export interface StartInput {
  expected: readonly string[];
  present: readonly string[];
  /** ms since the arcade bridge mounted. */
  elapsedMs: number;
  /** ms since the last expected player appeared. */
  settledMs: number;
}

/** Everyone is here and had a moment to pick a car; or the wait ran out and we go with who came. */
export const shouldStart = ({ expected, present, elapsedMs, settledMs }: StartInput, graceMs = 3500, patienceMs = 45_000): boolean => {
  const here = expected.filter((id) => present.includes(id)).length;
  if (here === 0) return false;
  if (here === expected.length) return settledMs >= graceMs;
  return elapsedMs >= patienceMs;
};

export interface FinalScore {
  /** 0 = blue, 1 = orange. */
  teamOf: ReadonlyMap<string, 0 | 1>;
  blue: number;
  orange: number;
}

/**
 * Winners share first, the other team shares second, a draw shares first. Team
 * mates tie by design: Rocket Arena does not credit goals to a single driver in
 * the lobby layer. Anyone the hub expected who never showed up did not finish.
 */
export const placementsFor = (expected: readonly ArcadePlayer[], final: FinalScore): HubPlacement[] => {
  const draw = final.blue === final.orange;
  const winner: 0 | 1 = final.blue > final.orange ? 0 : 1;
  return expected.map((player) => {
    const team = final.teamOf.get(player.id);
    if (team === undefined) return { playerId: player.id, rank: null };
    const goals = team === 0 ? final.blue : final.orange;
    const against = team === 0 ? final.orange : final.blue;
    return { playerId: player.id, rank: draw || team === winner ? 1 : 2, score: goals, stats: { goals, against } };
  });
};

/** Live progress for the hub's HUD: each player's team score. */
export const progressFor = (expected: readonly ArcadePlayer[], final: FinalScore): Record<string, number> => {
  const scores: Record<string, number> = {};
  for (const player of expected) {
    const team = final.teamOf.get(player.id);
    if (team !== undefined) scores[player.id] = team === 0 ? final.blue : final.orange;
  }
  return scores;
};

/* --------------------------------------------------------------- hub client --- */

const post = async (launch: ArcadeLaunch, path: "ready" | "progress" | "result", body: unknown): Promise<boolean> => {
  try {
    const response = await fetch(`${launch.origin}/api/rounds/${launch.round}/${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${launch.token}` },
      body: JSON.stringify(body),
      keepalive: true,
    });
    return response.ok;
  } catch {
    return false;
  }
};

export const hubClient = (launch: ArcadeLaunch) => ({
  ready: (controllerUrl: string | null) => post(launch, "ready", { controllerUrl }),
  progress: (scores: Record<string, number>) => post(launch, "progress", { scores }),
  result: (placements: HubPlacement[]) => post(launch, "result", { placements }),
});
