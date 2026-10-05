/**
 * Leaderboards. Pure functions over finished rounds.
 *
 * Session standings are computed from the session's own rounds; the all-time
 * board is computed from the permanent `RoundRecord`s, keyed by profile, so a
 * regular's stats follow them from night to night.
 */
import type { AllTimeRow, Profile, Round, RoundRecord, Session, Standing } from "./types";

interface Tally {
  points: number;
  wins: number;
  rounds: number;
  bestRank: number | null;
  lastGain: number;
}

const finishedRounds = (rounds: ReadonlyArray<Round>): Round[] =>
  rounds.filter((round) => round.status === "finished" && round.result !== null);

const accumulate = (session: Pick<Session, "players">, rounds: ReadonlyArray<Round>): Map<string, Tally> => {
  const tallies = new Map<string, Tally>();
  for (const player of session.players) tallies.set(player.id, { points: 0, wins: 0, rounds: 0, bestRank: null, lastGain: 0 });
  for (const round of rounds) {
    const result = round.result!;
    for (const placement of result.placements) {
      const tally = tallies.get(placement.playerId);
      if (!tally) continue; // someone who left: their points stay out of the board
      const gained = result.points[placement.playerId] ?? 0;
      tally.points = Math.round((tally.points + gained) * 10) / 10;
      tally.lastGain = gained;
      if (placement.rank !== null) {
        tally.rounds += 1;
        if (placement.rank === 1) tally.wins += 1;
        tally.bestRank = tally.bestRank === null ? placement.rank : Math.min(tally.bestRank, placement.rank);
      }
    }
  }
  return tallies;
};

const compare = (a: Tally & { name: string }, b: Tally & { name: string }): number =>
  b.points - a.points ||
  b.wins - a.wins ||
  (a.bestRank ?? 99) - (b.bestRank ?? 99) ||
  a.name.localeCompare(b.name);

const rankRows = (tallies: Map<string, Tally>, names: Map<string, string>) => {
  const rows = [...tallies.entries()]
    .map(([playerId, tally]) => ({ playerId, name: names.get(playerId) ?? "", ...tally }))
    .sort(compare);
  const ranked: Array<(typeof rows)[number] & { rank: number }> = [];
  rows.forEach((row, index) => {
    const previous = ranked[index - 1];
    // Ties share a rank only when points, wins AND best finish all match.
    const tied =
      previous !== undefined &&
      previous.points === row.points &&
      previous.wins === row.wins &&
      previous.bestRank === row.bestRank;
    ranked.push({ ...row, rank: tied ? previous.rank : index + 1 });
  });
  return ranked;
};

/** The night so far, best first, with how each player moved in the latest round. */
export const sessionStandings = (session: Pick<Session, "players" | "rounds">): Standing[] => {
  const names = new Map(session.players.map((player) => [player.id, player.name]));
  const finished = finishedRounds(session.rounds);
  const now = rankRows(accumulate(session, finished), names);
  const before = new Map(rankRows(accumulate(session, finished.slice(0, -1)), names).map((row) => [row.playerId, row.rank]));
  return now.map((row) => ({
    playerId: row.playerId,
    rank: row.rank,
    points: row.points,
    wins: row.wins,
    rounds: row.rounds,
    bestRank: row.bestRank,
    lastGain: finished.length > 0 ? row.lastGain : 0,
    climb: finished.length > 1 ? (before.get(row.playerId) ?? row.rank) - row.rank : 0,
  }));
};

/** Everyone sharing first place once the night is over. */
export const championsOf = (standings: ReadonlyArray<Standing>): string[] =>
  standings.length === 0 || standings[0]!.rounds === 0 ? [] : standings.filter((row) => row.rank === 1).map((row) => row.playerId);

/** Lifetime board over every finished round, best first. */
export const allTimeBoard = (
  records: ReadonlyArray<RoundRecord>,
  profiles: ReadonlyArray<Profile>,
  options: { gameId?: string; minRounds?: number } = {},
): AllTimeRow[] => {
  const byProfile = new Map<string, AllTimeRow>();
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  for (const record of records) {
    if (options.gameId && record.gameId !== options.gameId) continue;
    for (const entry of record.entries) {
      const profile = profileById.get(entry.profileId);
      if (!profile) continue;
      let row = byProfile.get(entry.profileId);
      if (!row) {
        row = {
          profileId: profile.id, name: profile.name, avatar: profile.avatar, color: profile.color,
          points: 0, rounds: 0, wins: 0, podiums: 0, winRate: 0, favouriteGameId: null, perGame: {},
        };
        byProfile.set(entry.profileId, row);
      }
      if (entry.rank === null) continue;
      row.points = Math.round((row.points + entry.points) * 10) / 10;
      row.rounds += 1;
      if (entry.rank === 1) row.wins += 1;
      if (entry.rank <= 3) row.podiums += 1;
      const game = (row.perGame[record.gameId] ??= { rounds: 0, wins: 0, points: 0 });
      game.rounds += 1;
      game.points = Math.round((game.points + entry.points) * 10) / 10;
      if (entry.rank === 1) game.wins += 1;
    }
  }
  const rows = [...byProfile.values()].filter((row) => row.rounds >= (options.minRounds ?? 1));
  for (const row of rows) {
    row.winRate = row.rounds === 0 ? 0 : Math.round((row.wins / row.rounds) * 100) / 100;
    row.favouriteGameId =
      Object.entries(row.perGame).sort((a, b) => b[1].rounds - a[1].rounds || b[1].wins - a[1].wins)[0]?.[0] ?? null;
  }
  return rows.sort((a, b) => b.points - a.points || b.wins - a.wins || b.rounds - a.rounds || a.name.localeCompare(b.name));
};
