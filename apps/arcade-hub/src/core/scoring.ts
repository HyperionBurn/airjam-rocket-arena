/**
 * Turning a finishing order into points. Pure functions.
 *
 * The hub never trusts a game's raw score for points: a game reports who came
 * where, and the SAME table scores every game, so a 3-0 football win and a
 * 40-lap race are worth the same. Raw scores are for the recap only.
 */
import type { Placement, Ruleset } from "./types";

export const DEFAULT_RULESET: Ruleset = Object.freeze({
  table: [10, 8, 6, 5, 4, 3, 2, 1],
  participation: 1,
  finaleMultiplier: 2,
}) as Ruleset;

const round1 = (value: number): number => Math.round(value * 10) / 10;

export class PlacementError extends Error {}

/**
 * Validate and normalise a reported finishing order against the players who were
 * actually in the round. Missing players become "did not finish"; strangers and
 * duplicates are rejected so a buggy adapter cannot award points to nobody.
 */
export const normalizePlacements = (
  placements: ReadonlyArray<Placement>,
  playerIds: ReadonlyArray<string>,
): Placement[] => {
  const allowed = new Set(playerIds);
  const seen = new Set<string>();
  const clean: Placement[] = [];
  for (const placement of placements) {
    if (!allowed.has(placement.playerId)) throw new PlacementError(`Unknown player ${placement.playerId}`);
    if (seen.has(placement.playerId)) throw new PlacementError(`Duplicate player ${placement.playerId}`);
    seen.add(placement.playerId);
    const rank = placement.rank;
    if (rank !== null && (!Number.isInteger(rank) || rank < 1)) {
      throw new PlacementError(`Bad rank ${String(rank)} for ${placement.playerId}`);
    }
    clean.push({ ...placement, rank });
  }
  for (const id of playerIds) if (!seen.has(id)) clean.push({ playerId: id, rank: null });
  return clean;
};

/**
 * Points per player. Players tied on a rank split the positions they occupy:
 * two players tied for first share positions 1 and 2, so each gets the average
 * of those two table values. Finishers also get the participation point; a
 * player who did not finish gets nothing.
 */
export const awardPoints = (
  placements: ReadonlyArray<Placement>,
  ruleset: Ruleset,
  multiplier = 1,
): Record<string, number> => {
  const points: Record<string, number> = {};
  const finishers = placements
    .filter((placement): placement is Placement & { rank: number } => placement.rank !== null)
    .sort((a, b) => a.rank - b.rank);

  let position = 0;
  let index = 0;
  while (index < finishers.length) {
    let end = index;
    while (end + 1 < finishers.length && finishers[end + 1]!.rank === finishers[index]!.rank) end += 1;
    const size = end - index + 1;
    let total = 0;
    for (let offset = 0; offset < size; offset += 1) total += ruleset.table[position + offset] ?? 0;
    const share = total / size + ruleset.participation;
    for (let k = index; k <= end; k += 1) points[finishers[k]!.playerId] = round1(share * multiplier);
    position += size;
    index = end + 1;
  }
  for (const placement of placements) if (placement.rank === null) points[placement.playerId] = 0;
  return points;
};

/** The multiplier a round gets: the last round of the night is worth more. */
export const multiplierFor = (roundNumber: number, totalRounds: number, ruleset: Ruleset): number =>
  totalRounds > 1 && roundNumber >= totalRounds ? ruleset.finaleMultiplier : 1;

/** A starting finishing order from a plain list of ids, best first (manual entry). */
export const placementsFromOrder = (order: ReadonlyArray<string | string[]>): Placement[] => {
  const placements: Placement[] = [];
  order.forEach((entry, index) => {
    const ids = Array.isArray(entry) ? entry : [entry];
    for (const playerId of ids) placements.push({ playerId, rank: index + 1 });
  });
  return placements;
};
