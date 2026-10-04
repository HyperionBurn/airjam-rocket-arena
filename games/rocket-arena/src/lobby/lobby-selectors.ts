/**
 * Derived reads over `LobbyState`. Pure, memoisation-free, unit-testable.
 *
 * OWNER: the lobby worker (`src/lobby/**`).
 *
 * Everything the host screen and the orchestrator need to render or to decide
 * whether to touch the simulation lives here, so a component never re-derives
 * a rule and the rules can be tested without mounting anything.
 */

import { selectReadiness, type LobbyReadiness } from "./lobby-reducer";
import { formatClock, GARAGE_CARS, TEAM_COLORS, TEAM_LABELS } from "./settings";
import { botCountFor, countTeams, hasTeamOverflow } from "./teams";
import type { CarBindingIntent, LobbyPlayer, LobbyState, LobbyTeam } from "./types";

/** One projector roster line. */
export interface LobbyRosterRow {
  id: string;
  name: string;
  team: LobbyTeam;
  teamLabel: string;
  teamColor: string;
  ready: boolean;
  carLabel: string;
  /** 1-based position in join order; also the tie-break for AUTO. */
  seat: number;
  /** A computer-controlled seat the host added (always ready, can be removed). */
  cpu?: boolean;
}

const carLabelFor = (carId: string | null): string => {
  if (carId === null) {
    return "DEFAULT CAR";
  }
  return GARAGE_CARS.find((car) => car.id === carId)?.label ?? carId.toUpperCase();
};

/** Roster rows in stable join order, plus empty seat placeholders. */
export const selectRoster = (state: LobbyState): LobbyRosterRow[] => {
  const rows = state.players.map((player) => toRosterRow(player));
  for (const cpu of state.cpus) {
    rows.push({
      id: cpu.id,
      name: cpu.name,
      team: cpu.team,
      teamLabel: TEAM_LABELS[cpu.team],
      teamColor: TEAM_COLORS[cpu.team],
      ready: true,
      carLabel: "CPU",
      seat: rows.length + 1,
      cpu: true,
    });
  }
  const empty = Math.max(0, state.settings.playerSlots - rows.length);
  for (let index = 0; index < empty; index += 1) {
    rows.push({
      id: `empty-${index}`,
      name: "OPEN SEAT",
      team: 0,
      teamLabel: "—",
      teamColor: "#64748b",
      ready: false,
      carLabel: "",
      seat: rows.length + 1,
    });
  }
  return rows;
};

const toRosterRow = (player: LobbyPlayer): LobbyRosterRow => ({
  id: player.id,
  name: player.name,
  team: player.team,
  teamLabel: TEAM_LABELS[player.team],
  teamColor: TEAM_COLORS[player.team],
  ready: player.ready,
  carLabel: carLabelFor(player.carId),
  seat: player.seat + 1,
});

export const selectTeamCounts = (state: LobbyState): { blue: number; orange: number } =>
  countTeams(state.players);

export const selectJoinedCount = (state: LobbyState): number => state.players.length;

export const selectCapacity = (state: LobbyState): number => state.settings.playerSlots;

/** The headline: `"2 / 4 PLAYERS JOINED"`. */
export const selectJoinCountLabel = (state: LobbyState): string =>
  `${selectJoinedCount(state)} / ${selectCapacity(state)} PLAYERS JOINED${
    state.cpus.length > 0 ? ` + ${state.cpus.length} CPU` : ""
  }`;

/** Humans plus CPUs, per team: what the match will actually field before bot fill. */
export const selectTeamScoreLabel = (state: LobbyState): string => {
  const counts = selectTeamCounts(state);
  const blue = counts.blue + state.cpus.filter((cpu) => cpu.team === 0).length;
  const orange = counts.orange + state.cpus.filter((cpu) => cpu.team === 1).length;
  return `BLUE ${blue} — ORANGE ${orange}`;
};

/** Teams of the host's CPU seats, in roster order. */
export const selectCpuTeams = (state: LobbyState): LobbyTeam[] => state.cpus.map((cpu) => cpu.team);

export const selectReadinessState = (state: LobbyState): LobbyReadiness => selectReadiness(state);

export const selectClockLabel = (state: LobbyState): string => formatClock(state.match.clockMs);

export const selectScoreLabel = (state: LobbyState): string =>
  `${state.match.blue} : ${state.match.orange}`;

export const selectBotGap = (state: LobbyState) =>
  botCountFor(state.players, state.settings.teamSize);

export const selectTeamOverflow = (state: LobbyState): boolean =>
  hasTeamOverflow(state.players, state.settings.teamSize);

export const selectIsFull = (state: LobbyState): boolean =>
  state.players.length >= state.settings.playerSlots;

/** True when the START affordance should be the loud thing on screen. */
export const selectIsEventMode = (state: LobbyState): boolean => state.settings.eventMode;

export const selectFindPlayer = (state: LobbyState, id: string): LobbyPlayer | null =>
  state.players.find((player) => player.id === id) ?? null;

/**
 * The hand-off to the rest of the port: one intent per seated player, carrying
 * the seam's team union. The orchestrator feeds this to the slots worker (which
 * owns `CarSlotRegistry`) and to the input worker (which owns the
 * `pulse` → level conversion for `CarControls`).
 */
export const selectCarBindingIntents = (state: LobbyState): CarBindingIntent[] =>
  state.players.map((player) => ({
    playerId: player.id,
    name: player.name,
    team: player.team,
    ready: player.ready,
    carId: player.carId,
    controls: NEUTRAL,
  }));

/**
 * Re-exported from the seam's contract shape via `types.ts`. Held as a frozen
 * literal here so this module stays import-free at runtime; the orchestrator
 * should prefer `NEUTRAL_CONTROLS` from the seam when it actually writes to the
 * sim, and treat this as the identical default.
 */
const NEUTRAL = Object.freeze({
  throttle: 0,
  steer: 0,
  pitch: 0,
  yaw: 0,
  roll: 0,
  jump: false,
  boost: false,
  handbrake: false,
});
