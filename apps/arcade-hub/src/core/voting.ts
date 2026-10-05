/**
 * Picking the next game. Pure functions with an injectable random source.
 *
 * Votes decide, but a night should not become the same game five times, so each
 * candidate's votes are weighted by how recently it was played: a game that just
 * ran is dampened, one that has not run in a while (or ever) gets a lift. With no
 * votes at all the weights alone decide, so a silent room still gets variety.
 */
import type { GameDef } from "./types";

export interface VoteRow {
  gameId: string;
  votes: number;
  weight: number;
  score: number;
}

export interface VoteOutcome {
  winnerId: string;
  rows: VoteRow[];
}

/** Rounds since the game last ran -> weight. `null` = never played this night. */
export const recencyWeight = (roundsSince: number | null): number => {
  if (roundsSince === null) return 1.3;
  if (roundsSince <= 0) return 0.5;
  if (roundsSince === 1) return 0.8;
  if (roundsSince === 2) return 1;
  return 1.15;
};

/** Games a room of this size can actually play. Falls back to all rather than none. */
export const eligibleGames = (games: ReadonlyArray<GameDef>, playerCount: number): GameDef[] => {
  const fits = games.filter((game) => playerCount >= game.minPlayers && playerCount <= game.maxPlayers);
  return fits.length > 0 ? fits : [...games];
};

/**
 * @param history game ids in the order they were played, oldest first
 * @param votes   vote per player id
 */
export const tally = (
  candidates: ReadonlyArray<GameDef>,
  votes: Readonly<Record<string, string>>,
  history: ReadonlyArray<string>,
  random: () => number = Math.random,
): VoteOutcome => {
  const counts = new Map<string, number>();
  for (const gameId of Object.values(votes)) counts.set(gameId, (counts.get(gameId) ?? 0) + 1);

  const rows: VoteRow[] = candidates.map((game) => {
    const last = history.lastIndexOf(game.id);
    const roundsSince = last < 0 ? null : history.length - 1 - last;
    const weight = recencyWeight(roundsSince);
    const count = counts.get(game.id) ?? 0;
    // A tiny base keeps zero-vote games ordered by weight instead of all tying at 0.
    return { gameId: game.id, votes: count, weight, score: (count + 0.05) * weight };
  });

  const best = Math.max(...rows.map((row) => row.score));
  const top = rows.filter((row) => best - row.score < 1e-9);
  const winner = top[Math.min(top.length - 1, Math.floor(random() * top.length))]!;
  return { winnerId: winner.gameId, rows };
};
