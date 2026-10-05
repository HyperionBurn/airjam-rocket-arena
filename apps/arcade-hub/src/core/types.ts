/**
 * Domain types for the arcade hub.
 *
 * The hub owns identity (profiles), the party flow (sessions, voting, rounds),
 * and scoring. The games stay independent apps: they only ever see a round's
 * player list and report a finishing order back.
 */

/** How a game talks to the hub. */
export type Integration =
  /** The game embeds the arcade client: reports ready + results itself. */
  | "arcade"
  /** No adapter yet: the host opens the game and enters the finishing order by hand. */
  | "manual";

export interface GameDef {
  id: string;
  name: string;
  tagline: string;
  /** CSS colour used for the game's card, ticker and podium. */
  accent: string;
  /** A short emoji/glyph for the card. */
  icon: string;
  minPlayers: number;
  maxPlayers: number;
  /** Typical round length, for the card and for planning a night. */
  minutes: number;
  integration: Integration;
  /** Where the game's big-screen page lives. */
  hostUrl: string;
  /**
   * Manual games only: where phones go to join (shown as a link/QR). Arcade games
   * report a per-player controller URL themselves when the round is ready.
   */
  joinUrl?: string;
  /**
   * Host-led games only: a private moderator page that runs alongside the big-screen
   * page (hostUrl). The hub opens it in its own window so it never shows on the projector.
   */
  consoleUrl?: string;
}

/** A persistent identity, remembered on the phone. Public part only. */
export interface Profile {
  id: string;
  name: string;
  color: string;
  avatar: string;
  createdAt: number;
}

export interface SessionPlayer {
  /** Same as the profile id: one identity everywhere. */
  id: string;
  name: string;
  color: string;
  avatar: string;
  joinedAt: number;
  connected: boolean;
}

export type Phase =
  | "lobby"
  | "voting"
  | "playing"
  | "results"
  | "finished";

export type RoundStatus = "launching" | "live" | "finished" | "cancelled";

export interface Placement {
  playerId: string;
  /** 1 = first. Equal ranks are a tie. `null` = did not finish. */
  rank: number | null;
  /** Game-native score, shown on the results screen; never used for points. */
  score?: number;
  /** A few labelled numbers (goals, KOs, laps...) for the recap. */
  stats?: Record<string, number>;
  /** Team games: the side this player was on. Players sharing rank 1 and one group are a team win, not a tie. */
  group?: string;
}

export interface Ruleset {
  /** Points by finishing position, first to last. */
  table: number[];
  /** Added for every finisher on top of the table. */
  participation: number;
  /** Multiplier for the final round, so the night can swing at the end. */
  finaleMultiplier: number;
}

export interface RoundResult {
  placements: Placement[];
  /** Points awarded this round, by player id (after ties and the multiplier). */
  points: Record<string, number>;
  multiplier: number;
  finishedAt: number;
  /** `manual` when the host typed it in. */
  source: "game" | "manual";
}

export interface Round {
  id: string;
  number: number;
  gameId: string;
  status: RoundStatus;
  startedAt: number;
  /** Everyone who was in the session when the round launched. */
  playerIds: string[];
  /** Secret the game uses to report back. Host-only. */
  token: string;
  /** `{playerId}` / `{name}` / `{color}` are substituted per phone. */
  controllerUrlTemplate: string | null;
  /** Live scores while playing, by player id. */
  progress: Record<string, number>;
  result: RoundResult | null;
}

export interface Session {
  code: string;
  createdAt: number;
  phase: Phase;
  players: SessionPlayer[];
  totalRounds: number;
  ruleset: Ruleset;
  /** Vote per player id. Cleared when voting opens. */
  votes: Record<string, string>;
  votingEndsAt: number | null;
  /** When the results screen hands over to the next vote / champion. */
  nextAt: number | null;
  rounds: Round[];
  /** Secret for the big screen. */
  hostToken: string;
  /** Champion ids once finished (several on an exact tie). */
  champions: string[];
}

export interface Standing {
  playerId: string;
  rank: number;
  points: number;
  wins: number;
  rounds: number;
  bestRank: number | null;
  /** Points gained in the latest finished round, for the "climb" arrows. */
  lastGain: number;
  /** Rank change since the previous round (positive = climbed). */
  climb: number;
}

/** One finished round, kept forever for the all-time board. */
export interface RoundRecord {
  sessionCode: string;
  roundId: string;
  gameId: string;
  finishedAt: number;
  entries: Array<{ profileId: string; rank: number | null; points: number }>;
}

export interface AllTimeRow {
  profileId: string;
  name: string;
  avatar: string;
  color: string;
  points: number;
  rounds: number;
  wins: number;
  podiums: number;
  winRate: number;
  favouriteGameId: string | null;
  perGame: Record<string, { rounds: number; wins: number; points: number }>;
}
