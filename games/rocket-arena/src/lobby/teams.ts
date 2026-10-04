/**
 * Team assignment. Pure functions, no state, no React.
 *
 * OWNER: the lobby worker (`src/lobby/**`).
 *
 * The rule the room cares about: an explicit pick is PINEd, and only `"auto"`
 * players move. That is what makes AUTO predictable at an event — a player who
 * deliberately took ORANGE is never silently moved to BLUE because someone
 * else walked up and picked AUTO.
 */

import type { LobbyPlayer, LobbyTeam, TeamChoice } from "./types";

export const teamForChoice = (choice: TeamChoice): LobbyTeam | null =>
  choice === "blue" ? 0 : choice === "orange" ? 1 : null;

export const choiceForTeam = (team: LobbyTeam): TeamChoice => (team === 0 ? "blue" : "orange");

export const countTeams = (players: readonly LobbyPlayer[]): { blue: number; orange: number } => {
  let blue = 0;
  let orange = 0;
  for (const player of players) {
    if (player.team === 0) {
      blue += 1;
    } else {
      orange += 1;
    }
  }
  return { blue, orange };
};

/** How many humans a team may hold before AUTO starts avoiding it. */
export const teamCapacity = (teamSize: number): number => Math.max(0, teamSize);

/**
 * Which team should the next AUTO player take?
 *
 * Least-populated first; ties go to BLUE so the assignment is deterministic.
 * A team that is already at `teamSize` is skipped, but ONLY while the other
 * team still has room — if both are full the player still gets a seat and
 * `selectTeamOverflow` reports it, because at a live event showing an
 * over-capacity player is far better than showing a phantom.
 */
export const pickAutoTeam = (
  counts: { blue: number; orange: number },
  teamSize: number,
): LobbyTeam => {
  const capacity = teamCapacity(teamSize);
  const blueFull = counts.blue >= capacity;
  const orangeFull = counts.orange >= capacity;

  if (blueFull && !orangeFull) {
    return 1;
  }
  if (orangeFull && !blueFull) {
    return 0;
  }
  return counts.blue <= counts.orange ? 0 : 1;
};

/**
 * Re-run the AUTO assignment across the whole room.
 *
 * Explicit choices are returned untouched (same object reference), so a caller
 * can cheaply detect "nothing moved". AUTO players are then filled in roster
 * order, which makes the result stable for a given input array.
 */
export const balanceAutoTeams = (
  players: readonly LobbyPlayer[],
  teamSize: number,
): LobbyPlayer[] => {
  const counts: { blue: number; orange: number } = { blue: 0, orange: 0 };
  for (const player of players) {
    if (player.teamPreference !== "auto") {
      if (player.team === 0) {
        counts.blue += 1;
      } else {
        counts.orange += 1;
      }
    }
  }

  let changed = false;
  const next: LobbyPlayer[] = [];

  for (const player of players) {
    if (player.teamPreference !== "auto") {
      next.push(player);
      continue;
    }
    const team = pickAutoTeam(counts, teamSize);
    if (team === 0) {
      counts.blue += 1;
    } else {
      counts.orange += 1;
    }
    if (player.team === team) {
      next.push(player);
    } else {
      changed = true;
      next.push({ ...player, team });
    }
  }

  return changed ? next : (players as LobbyPlayer[]);
};

/**
 * Are the teams bigger than the host asked for? True only when humans alone
 * exceed `teamSize`, i.e. bots are NOT filling the gap.
 */
export const hasTeamOverflow = (
  players: readonly LobbyPlayer[],
  teamSize: number,
): boolean => {
  const counts = countTeams(players);
  return counts.blue > teamSize || counts.orange > teamSize;
};

/** Bots needed per team to reach `teamSize`, for the host's own reading. */
export const botCountFor = (players: readonly LobbyPlayer[], teamSize: number) => {
  const counts = countTeams(players);
  return {
    blue: Math.max(0, teamSize - counts.blue),
    orange: Math.max(0, teamSize - counts.orange),
  };
};
