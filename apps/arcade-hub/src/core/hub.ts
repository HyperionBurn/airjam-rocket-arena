/**
 * The hub: sessions, players, voting, rounds and scoring in one state machine.
 *
 *   lobby --startVoting--> voting --close--> playing --result--> results
 *                            ^                                     |
 *                            +------------- next round -----------+
 *                                              |  last round
 *                                              v
 *                                           finished (champion)
 *
 * Everything is synchronous and in-memory; persistence goes through a `Store`.
 * Time, randomness, ids and timers are injected so the whole flow is testable
 * without waiting. Errors are `HubError`s with a stable `code` the HTTP layer
 * turns into a status.
 */
import { EventEmitter } from "node:events";
import { randomBytes } from "node:crypto";

import { loadGames } from "./games";
import { allTimeBoard, championsOf, sessionStandings } from "./leaderboard";
import { awardPoints, DEFAULT_RULESET, multiplierFor, normalizePlacements, PlacementError, placementsFromOrder } from "./scoring";
import { eligibleGames, tally } from "./voting";
import type {
  AllTimeRow, GameDef, Placement, Profile, Round, RoundRecord, Ruleset, Session, SessionPlayer,
} from "./types";

export type HubErrorCode =
  | "not_found" | "forbidden" | "bad_request" | "conflict" | "full";

export class HubError extends Error {
  constructor(readonly code: HubErrorCode, message: string) {
    super(message);
  }
}

export interface HubData {
  sessions: Record<string, Session>;
  profiles: Record<string, Profile>;
  /** Profile secret -> profile id. The secret lives only on the player's phone. */
  tokens: Record<string, string>;
  records: RoundRecord[];
}

export const emptyData = (): HubData => ({ sessions: {}, profiles: {}, tokens: {}, records: [] });

export interface Store {
  load(): HubData;
  save(data: HubData): void;
}

export interface HubOptions {
  store: Store;
  games?: GameDef[];
  now?: () => number;
  random?: () => number;
  /** Schedule a callback; returns a cancel function. */
  schedule?: (fn: () => void, ms: number) => () => void;
  voteSeconds?: number;
  /** How long the results screen holds before the next vote / champion. */
  resultsSeconds?: number;
  /** Pause between everyone voting and the game launching. */
  voteGraceMs?: number;
  maxPlayers?: number;
  defaultRounds?: number;
}

export interface JoinInput {
  name: string;
  color?: string;
  avatar?: string;
  profileToken?: string;
}

export interface Credentials {
  hostToken?: string;
  playerToken?: string;
}

const PALETTE = ["#38bdf8", "#fb923c", "#a3e635", "#f472b6", "#facc15", "#c084fc", "#34d399", "#f87171"];
const AVATARS = ["🦊", "🐙", "🦖", "🐼", "🦄", "🐸", "🐯", "🦉", "🐳", "🦁", "🐧", "🐲"];
const CODE_LETTERS = "ABCDEFGHJKMNPQRSTUVWXYZ";

const token = (bytes = 16): string => randomBytes(bytes).toString("hex");

export const cleanName = (raw: string): string => raw.replace(/\s+/g, " ").trim().slice(0, 16);

export class Hub extends EventEmitter {
  readonly games: GameDef[];
  private data: HubData;
  private readonly store: Store;
  private readonly now: () => number;
  private readonly random: () => number;
  private readonly schedule: (fn: () => void, ms: number) => () => void;
  private readonly timers = new Map<string, () => void>();
  readonly voteSeconds: number;
  readonly resultsSeconds: number;
  private readonly voteGraceMs: number;
  private readonly maxPlayers: number;
  private readonly defaultRounds: number;

  constructor(options: HubOptions) {
    super();
    this.store = options.store;
    this.games = options.games ?? loadGames();
    this.now = options.now ?? (() => Date.now());
    this.random = options.random ?? Math.random;
    this.schedule =
      options.schedule ??
      ((fn, ms) => {
        const handle = setTimeout(fn, ms);
        handle.unref?.();
        return () => clearTimeout(handle);
      });
    this.voteSeconds = options.voteSeconds ?? 25;
    this.resultsSeconds = options.resultsSeconds ?? 18;
    this.voteGraceMs = options.voteGraceMs ?? 1400;
    this.maxPlayers = options.maxPlayers ?? 8;
    this.defaultRounds = options.defaultRounds ?? 5;
    this.data = this.store.load();
    this.restoreTimers();
  }

  /* ------------------------------------------------------------- helpers */

  private game(id: string): GameDef {
    const game = this.games.find((candidate) => candidate.id === id);
    if (!game) throw new HubError("not_found", `Unknown game ${id}`);
    return game;
  }

  session(code: string): Session {
    const session = this.data.sessions[code.toUpperCase()];
    if (!session) throw new HubError("not_found", "No such room");
    return session;
  }

  hasSession(code: string): boolean {
    return Boolean(this.data.sessions[code.toUpperCase()]);
  }

  private persist(code?: string): void {
    this.store.save(this.data);
    if (code) this.emit("change", code);
  }

  private connected(session: Session): SessionPlayer[] {
    return session.players.filter((player) => player.connected);
  }

  private clearTimer(code: string, kind: string): void {
    const key = `${code}:${kind}`;
    this.timers.get(key)?.();
    this.timers.delete(key);
  }

  private setTimer(code: string, kind: string, ms: number, fn: () => void): void {
    this.clearTimer(code, kind);
    this.timers.set(`${code}:${kind}`, this.schedule(() => {
      this.timers.delete(`${code}:${kind}`);
      fn();
    }, Math.max(0, ms)));
  }

  private restoreTimers(): void {
    const at = this.now();
    for (const session of Object.values(this.data.sessions)) {
      if (session.phase === "voting" && session.votingEndsAt !== null) {
        this.setTimer(session.code, "vote", session.votingEndsAt - at, () => this.closeVoting(session.code));
      }
      if (session.phase === "results" && session.nextAt !== null) {
        this.setTimer(session.code, "next", session.nextAt - at, () => this.advance(session.code));
      }
    }
  }

  /** Auth: the big screen's host token, or the room leader's phone. */
  private assertHost(session: Session, credentials: Credentials): void {
    if (credentials.hostToken && credentials.hostToken === session.hostToken) return;
    if (credentials.playerToken) {
      const playerId = this.data.tokens[credentials.playerToken];
      if (playerId && playerId === this.leaderId(session)) return;
    }
    throw new HubError("forbidden", "Only the host can do that");
  }

  /** The room leader: the longest-standing connected player. */
  leaderId(session: Session): string | null {
    const pool = this.connected(session);
    const list = pool.length > 0 ? pool : session.players;
    return [...list].sort((a, b) => a.joinedAt - b.joinedAt)[0]?.id ?? null;
  }

  /* ------------------------------------------------------------ sessions */

  createSession(options: { totalRounds?: number; ruleset?: Partial<Ruleset> } = {}): { session: Session; hostToken: string } {
    // The attempt number is mixed into every letter, so a stuck or constant random
    // source still walks through distinct codes instead of colliding forever.
    let code = "";
    for (let attempt = 0; attempt < 5000; attempt += 1) {
      code = Array.from({ length: 4 }, (_, i) =>
        CODE_LETTERS[(Math.floor(this.random() * CODE_LETTERS.length) + attempt * (i === 3 ? 1 : i === 2 ? 23 : i === 1 ? 529 : 12167)) % CODE_LETTERS.length],
      ).join("");
      if (!this.data.sessions[code]) break;
    }
    if (this.data.sessions[code]) throw new HubError("full", "Too many rooms");
    const totalRounds = Math.max(1, Math.min(12, Math.floor(options.totalRounds ?? this.defaultRounds)));
    const session: Session = {
      code,
      createdAt: this.now(),
      phase: "lobby",
      players: [],
      totalRounds,
      ruleset: { ...DEFAULT_RULESET, ...(options.ruleset ?? {}) },
      votes: {},
      votingEndsAt: null,
      nextAt: null,
      rounds: [],
      hostToken: token(),
      champions: [],
    };
    this.data.sessions[code] = session;
    this.persist(code);
    return { session, hostToken: session.hostToken };
  }

  /** Throw away a room (the host closed the night). */
  closeSession(code: string, credentials: Credentials): void {
    const session = this.session(code);
    this.assertHost(session, credentials);
    for (const kind of ["vote", "next"]) this.clearTimer(session.code, kind);
    delete this.data.sessions[session.code];
    this.persist();
    this.emit("closed", session.code);
  }

  /* ------------------------------------------------------------- players */

  join(code: string, input: JoinInput): { playerId: string; profileToken: string } {
    const session = this.session(code);
    const profileId = input.profileToken ? this.data.tokens[input.profileToken] : undefined;
    let profile = profileId ? this.data.profiles[profileId] : undefined;
    const existing = profile ? session.players.find((player) => player.id === profile!.id) : undefined;

    const requested = cleanName(input.name);
    if (!existing && session.players.length >= this.maxPlayers) throw new HubError("full", "This room is full");
    if (!existing && session.phase === "finished") throw new HubError("conflict", "This night has finished");

    const taken = new Set(session.players.filter((player) => player.id !== profile?.id).map((player) => player.name.toLowerCase()));
    const base = requested || existing?.name || profile?.name || "Player";
    let name = base;
    for (let n = 2; taken.has(name.toLowerCase()); n += 1) name = `${base.slice(0, 13)} ${n}`;

    const color = /^#[0-9a-f]{6}$/i.test(input.color ?? "")
      ? input.color!.toLowerCase()
      : (profile?.color ?? PALETTE[session.players.length % PALETTE.length]!);
    const avatar = input.avatar && input.avatar.length <= 8 ? input.avatar : (profile?.avatar ?? AVATARS[session.players.length % AVATARS.length]!);

    let secret = input.profileToken && profile ? input.profileToken : "";
    if (!profile) {
      profile = { id: token(6), name, color, avatar, createdAt: this.now() };
      secret = token();
      this.data.profiles[profile.id] = profile;
      this.data.tokens[secret] = profile.id;
    } else {
      profile.name = name;
      profile.color = color;
      profile.avatar = avatar;
    }

    if (existing) {
      existing.name = name;
      existing.color = color;
      existing.avatar = avatar;
      existing.connected = true;
    } else {
      session.players.push({ id: profile.id, name, color, avatar, joinedAt: this.now(), connected: true });
    }
    this.persist(session.code);
    return { playerId: profile.id, profileToken: secret };
  }

  authPlayer(code: string, profileToken: string): string | null {
    const playerId = this.data.tokens[profileToken];
    if (!playerId) return null;
    return this.data.sessions[code.toUpperCase()]?.players.some((player) => player.id === playerId) ? playerId : null;
  }

  setConnected(code: string, playerId: string, connected: boolean): void {
    const session = this.data.sessions[code.toUpperCase()];
    const player = session?.players.find((candidate) => candidate.id === playerId);
    if (!session || !player || player.connected === connected) return;
    player.connected = connected;
    this.persist(session.code);
    // The last holdout leaving can complete a vote.
    if (session.phase === "voting") this.maybeCloseEarly(session);
  }

  /** The player leaves the night for good. */
  leave(code: string, playerId: string): void {
    const session = this.session(code);
    session.players = session.players.filter((player) => player.id !== playerId);
    delete session.votes[playerId];
    this.persist(session.code);
    if (session.phase === "voting") this.maybeCloseEarly(session);
  }

  /* -------------------------------------------------------------- voting */

  startVoting(code: string, credentials: Credentials): void {
    const session = this.session(code);
    this.assertHost(session, credentials);
    this.openVoting(session);
  }

  private openVoting(session: Session): void {
    if (session.phase !== "lobby" && session.phase !== "results") {
      throw new HubError("conflict", `Cannot start voting during ${session.phase}`);
    }
    if (this.connected(session).length === 0) throw new HubError("conflict", "Nobody is connected");
    this.clearTimer(session.code, "next");
    session.phase = "voting";
    session.votes = {};
    session.nextAt = null;
    session.votingEndsAt = this.now() + this.voteSeconds * 1000;
    this.setTimer(session.code, "vote", this.voteSeconds * 1000, () => this.closeVoting(session.code));
    this.persist(session.code);
  }

  /** The games on the ballot for the people here right now. */
  candidates(session: Session): GameDef[] {
    return eligibleGames(this.games, this.connected(session).length);
  }

  vote(code: string, playerId: string, gameId: string): void {
    const session = this.session(code);
    if (session.phase !== "voting") throw new HubError("conflict", "Voting is not open");
    if (!session.players.some((player) => player.id === playerId)) throw new HubError("forbidden", "You are not in this room");
    if (!this.candidates(session).some((game) => game.id === gameId)) throw new HubError("bad_request", "That game is not on the ballot");
    session.votes[playerId] = gameId;
    this.persist(session.code);
    this.maybeCloseEarly(session);
  }

  private maybeCloseEarly(session: Session): void {
    const here = this.connected(session);
    if (session.phase !== "voting" || here.length === 0) return;
    if (here.every((player) => session.votes[player.id] !== undefined)) {
      this.setTimer(session.code, "vote", this.voteGraceMs, () => this.closeVoting(session.code));
    }
  }

  /** Pick the winner and launch the round. Timer, "everyone voted" or host. */
  closeVoting(code: string, credentials?: Credentials): Round | null {
    const session = this.session(code);
    if (credentials) this.assertHost(session, credentials);
    if (session.phase !== "voting") return null;
    this.clearTimer(session.code, "vote");
    const here = this.connected(session);
    if (here.length === 0) {
      session.phase = "lobby";
      session.votingEndsAt = null;
      this.persist(session.code);
      return null;
    }
    const candidates = this.candidates(session);
    const played = session.rounds.filter((round) => round.status !== "cancelled").map((round) => round.gameId);
    const valid = Object.fromEntries(Object.entries(session.votes).filter(([, gameId]) => candidates.some((game) => game.id === gameId)));
    const outcome = tally(candidates, valid, played, this.random);
    const game = this.game(outcome.winnerId);

    const round: Round = {
      id: token(6),
      number: session.rounds.filter((candidate) => candidate.status !== "cancelled").length + 1,
      gameId: game.id,
      status: game.integration === "arcade" ? "launching" : "live",
      startedAt: this.now(),
      playerIds: here.map((player) => player.id),
      token: token(),
      controllerUrlTemplate: game.integration === "manual" ? (game.joinUrl ?? null) : null,
      progress: {},
      result: null,
    };
    session.rounds.push(round);
    session.phase = "playing";
    session.votingEndsAt = null;
    this.persist(session.code);
    return round;
  }

  /* -------------------------------------------------------------- rounds */

  private roundById(roundId: string): { session: Session; round: Round } {
    for (const session of Object.values(this.data.sessions)) {
      const round = session.rounds.find((candidate) => candidate.id === roundId);
      if (round) return { session, round };
    }
    throw new HubError("not_found", "No such round");
  }

  private authRound(roundId: string, roundToken: string): { session: Session; round: Round } {
    const found = this.roundById(roundId);
    if (found.round.token !== roundToken) throw new HubError("forbidden", "Bad round token");
    return found;
  }

  /** A game says it is up and tells the hub where phones should go. */
  reportReady(roundId: string, roundToken: string, controllerUrlTemplate: string | null): void {
    const { session, round } = this.authRound(roundId, roundToken);
    if (round.status === "finished" || round.status === "cancelled") throw new HubError("conflict", "Round is over");
    if (controllerUrlTemplate !== null) {
      round.controllerUrlTemplate = controllerUrlTemplate;
    }
    round.status = "live";
    this.persist(session.code);
  }

  reportProgress(roundId: string, roundToken: string, scores: Record<string, number>): void {
    const { session, round } = this.authRound(roundId, roundToken);
    if (round.status === "finished" || round.status === "cancelled") return;
    for (const [playerId, score] of Object.entries(scores)) {
      if (round.playerIds.includes(playerId) && Number.isFinite(score)) round.progress[playerId] = score;
    }
    this.persist(session.code);
  }

  /** The game reports the finishing order. */
  submitResult(roundId: string, roundToken: string, placements: Placement[]): Round {
    const { session, round } = this.authRound(roundId, roundToken);
    return this.finishRound(session, round, placements, "game");
  }

  /** The host types the order in by hand (games without an adapter). */
  submitManualResult(code: string, credentials: Credentials, order: Array<string | string[]>): Round {
    const session = this.session(code);
    this.assertHost(session, credentials);
    const round = [...session.rounds].reverse().find((candidate) => candidate.status === "launching" || candidate.status === "live");
    if (!round) throw new HubError("conflict", "No round is in progress");
    return this.finishRound(session, round, placementsFromOrder(order), "manual");
  }

  private finishRound(session: Session, round: Round, reported: Placement[], source: "game" | "manual"): Round {
    if (round.status === "finished") throw new HubError("conflict", "Round already has a result");
    if (round.status === "cancelled") throw new HubError("conflict", "Round was cancelled");
    let placements: Placement[];
    try {
      placements = normalizePlacements(reported, round.playerIds);
    } catch (error) {
      if (error instanceof PlacementError) throw new HubError("bad_request", error.message);
      throw error;
    }
    const multiplier = multiplierFor(round.number, session.totalRounds, session.ruleset);
    const points = awardPoints(placements, session.ruleset, multiplier);
    round.status = "finished";
    round.result = { placements, points, multiplier, finishedAt: this.now(), source };
    this.data.records.push({
      sessionCode: session.code,
      roundId: round.id,
      gameId: round.gameId,
      finishedAt: round.result.finishedAt,
      entries: placements.map((placement) => ({ profileId: placement.playerId, rank: placement.rank, points: points[placement.playerId] ?? 0 })),
    });
    session.phase = "results";
    session.nextAt = this.now() + this.resultsSeconds * 1000;
    this.setTimer(session.code, "next", this.resultsSeconds * 1000, () => this.advance(session.code));
    this.persist(session.code);
    return round;
  }

  /** Abandon the current round without points (a crashed game, a wrong pick). */
  cancelRound(code: string, credentials: Credentials): void {
    const session = this.session(code);
    this.assertHost(session, credentials);
    const round = [...session.rounds].reverse().find((candidate) => candidate.status === "launching" || candidate.status === "live");
    if (!round) throw new HubError("conflict", "No round is in progress");
    round.status = "cancelled";
    session.phase = "results";
    session.nextAt = null;
    this.persist(session.code);
    this.openVoting(session);
  }

  /** Results -> next vote, or the champion after the last round. Timer or host. */
  advance(code: string, credentials?: Credentials): void {
    const session = this.session(code);
    if (credentials) this.assertHost(session, credentials);
    if (session.phase !== "results") return;
    this.clearTimer(session.code, "next");
    const done = session.rounds.filter((round) => round.status === "finished").length;
    if (done >= session.totalRounds) {
      this.finishNight(session);
      return;
    }
    if (this.connected(session).length === 0) {
      session.phase = "lobby";
      session.nextAt = null;
      this.persist(session.code);
      return;
    }
    this.openVoting(session);
  }

  /** End the night now and crown whoever leads. */
  finish(code: string, credentials: Credentials): void {
    const session = this.session(code);
    this.assertHost(session, credentials);
    if (session.phase === "playing") throw new HubError("conflict", "Finish or cancel the current round first");
    this.clearTimer(session.code, "vote");
    this.clearTimer(session.code, "next");
    this.finishNight(session);
  }

  private finishNight(session: Session): void {
    session.phase = "finished";
    session.votingEndsAt = null;
    session.nextAt = null;
    session.champions = championsOf(sessionStandings(session));
    this.persist(session.code);
  }

  /** Play again with the same people: scores reset, back to the lobby. */
  restart(code: string, credentials: Credentials): void {
    const session = this.session(code);
    this.assertHost(session, credentials);
    for (const kind of ["vote", "next"]) this.clearTimer(session.code, kind);
    session.phase = "lobby";
    session.rounds = [];
    session.votes = {};
    session.votingEndsAt = null;
    session.nextAt = null;
    session.champions = [];
    this.persist(session.code);
  }

  /* --------------------------------------------------------------- reads */

  profiles(): Profile[] {
    return Object.values(this.data.profiles);
  }

  leaderboard(options: { gameId?: string } = {}): AllTimeRow[] {
    return allTimeBoard(this.data.records, this.profiles(), options);
  }

  standings(code: string) {
    return sessionStandings(this.session(code));
  }

  /** Remove sessions untouched for a long time (a forgotten laptop). */
  sweep(maxAgeMs = 12 * 60 * 60 * 1000): number {
    const cutoff = this.now() - maxAgeMs;
    let removed = 0;
    for (const session of Object.values(this.data.sessions)) {
      const lastRound = session.rounds.at(-1);
      const last = Math.max(session.createdAt, lastRound?.result?.finishedAt ?? lastRound?.startedAt ?? 0);
      if (last < cutoff && !this.connected(session).length) {
        delete this.data.sessions[session.code];
        removed += 1;
      }
    }
    if (removed > 0) this.persist();
    return removed;
  }
}
