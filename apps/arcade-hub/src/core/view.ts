/**
 * What a client is allowed to see. The hub keeps secrets (host token, round
 * token) in the session; this builds the per-viewer snapshot that goes over the
 * wire, so a phone can never read the host's or a game's credentials.
 */
import type { Hub } from "./hub";
import { sessionStandings } from "./leaderboard";
import type { GameDef, Phase, Round, RoundResult, RoundStatus, SessionPlayer, Standing } from "./types";

export interface VoteView {
  endsAt: number;
  /** Games on the ballot, with live tallies. */
  candidates: Array<{ gameId: string; votes: number }>;
  /** Who has voted (not what): the room sees progress without seeing picks. */
  votedIds: string[];
}

export interface RoundView {
  id: string;
  number: number;
  gameId: string;
  status: RoundStatus;
  startedAt: number;
  playerIds: string[];
  progress: Record<string, number>;
  result: RoundResult | null;
  /** The phone's own controller link, once the game has reported it. Players only. */
  controllerUrl: string | null;
}

export interface HistoryEntry {
  roundId: string;
  number: number;
  gameId: string;
  status: RoundStatus;
  result: RoundResult | null;
}

export interface PublicState {
  code: string;
  phase: Phase;
  serverTime: number;
  totalRounds: number;
  /** Finished rounds so far. */
  roundsDone: number;
  players: SessionPlayer[];
  leaderId: string | null;
  games: GameDef[];
  vote: VoteView | null;
  round: RoundView | null;
  standings: Standing[];
  history: HistoryEntry[];
  champions: string[];
  nextAt: number | null;
  you: { playerId: string; vote: string | null; isLeader: boolean } | null;
  /** The big screen only. */
  host: { roundToken: string | null } | null;
}

export type Viewer = { kind: "host" } | { kind: "player"; playerId: string } | { kind: "public" };

const fill = (template: string, player: SessionPlayer): string =>
  template
    .replaceAll("{playerId}", encodeURIComponent(player.id))
    .replaceAll("{name}", encodeURIComponent(player.name))
    .replaceAll("{color}", encodeURIComponent(player.color));

export const publicState = (hub: Hub, code: string, viewer: Viewer): PublicState => {
  const session = hub.session(code);
  const leaderId = hub.leaderId(session);
  const current = [...session.rounds].reverse().find((round) => round.status !== "cancelled") ?? null;
  const showRound: Round | null =
    session.phase === "playing" || session.phase === "results" ? current : session.phase === "finished" ? current : null;
  const me = viewer.kind === "player" ? session.players.find((player) => player.id === viewer.playerId) : undefined;

  const vote: VoteView | null =
    session.phase === "voting" && session.votingEndsAt !== null
      ? {
          endsAt: session.votingEndsAt,
          candidates: hub.candidates(session).map((game) => ({
            gameId: game.id,
            votes: Object.values(session.votes).filter((gameId) => gameId === game.id).length,
          })),
          votedIds: Object.keys(session.votes),
        }
      : null;

  return {
    code: session.code,
    phase: session.phase,
    serverTime: Date.now(),
    totalRounds: session.totalRounds,
    roundsDone: session.rounds.filter((round) => round.status === "finished").length,
    players: session.players,
    leaderId,
    games: hub.games,
    vote,
    round: showRound
      ? {
          id: showRound.id,
          number: showRound.number,
          gameId: showRound.gameId,
          status: showRound.status,
          startedAt: showRound.startedAt,
          playerIds: showRound.playerIds,
          progress: showRound.progress,
          result: showRound.result,
          controllerUrl: me && showRound.controllerUrlTemplate ? fill(showRound.controllerUrlTemplate, me) : null,
        }
      : null,
    standings: sessionStandings(session),
    history: session.rounds
      .filter((round) => round.status === "finished")
      .map((round) => ({ roundId: round.id, number: round.number, gameId: round.gameId, status: round.status, result: round.result })),
    champions: session.champions,
    nextAt: session.nextAt,
    you: me ? { playerId: me.id, vote: session.votes[me.id] ?? null, isLeader: me.id === leaderId } : null,
    host: viewer.kind === "host" ? { roundToken: showRound?.status === "launching" || showRound?.status === "live" ? showRound.token : null } : null,
  };
};

/**
 * The URL the big screen loads for an arcade game. Everything the game needs is
 * in the query string so it works as a plain iframe, with no handshake to race.
 */
export const launchUrl = (
  game: GameDef,
  input: {
    hubOrigin: string;
    code: string;
    roundId: string;
    roundToken: string;
    players: ReadonlyArray<Pick<SessionPlayer, "id" | "name" | "color" | "avatar">>;
    totalSeconds?: number;
  },
  /** Which of the game's pages to open: the big screen (default) or its moderator console. */
  page: "host" | "console" = "host",
): string => {
  const url = new URL(page === "console" ? (game.consoleUrl ?? game.hostUrl) : game.hostUrl);
  url.searchParams.set("arcade", input.hubOrigin);
  url.searchParams.set("session", input.code);
  url.searchParams.set("round", input.roundId);
  url.searchParams.set("token", input.roundToken);
  url.searchParams.set("players", encodePlayers(input.players));
  if (input.totalSeconds) url.searchParams.set("seconds", String(input.totalSeconds));
  return url.toString();
};

export const encodePlayers = (players: ReadonlyArray<Pick<SessionPlayer, "id" | "name" | "color" | "avatar">>): string => {
  const json = JSON.stringify(players.map(({ id, name, color, avatar }) => ({ id, name, color, avatar })));
  const base64 = typeof Buffer !== "undefined" ? Buffer.from(json, "utf8").toString("base64") : btoa(unescape(encodeURIComponent(json)));
  return base64.replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
};
