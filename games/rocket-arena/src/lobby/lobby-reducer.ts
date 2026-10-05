/**
 * The lobby reducer. Pure TypeScript: no React, no SDK, no DOM, no timers.
 *
 * OWNER: the lobby worker (`src/lobby/**`).
 *
 * CONTRACT
 *  - `lobbyReducer(state, action)` is a pure function of its two arguments.
 *  - An action that changes nothing returns the EXACT SAME state object. That
 *    is what lets `useSyncExternalStore` (and any future session bridge) skip a
 *    re-render instead of looping on referential inequality.
 *  - Every real change bumps `revision`, so a subscriber can detect churn with
 *    a single integer compare.
 *  - Defensive by design: an illegal transition (starting a match nobody is
 *    ready for, rematching from the lobby) is a NO-OP, not a throw. The
 *    orchestrator drives a real simulation from the same state and must never
 *    be taken down by a stale phone tap.
 */

import {
  DEFAULT_SETTINGS,
  EVENT_MODE_SETTINGS,
  isBotDifficulty,
  isBotFill,
  isMatchLength,
  isPlayerSlotCount,
  isTeamChoice,
  isTeamSize,
  matchDurationMs,
  MAX_PLAYER_SLOTS,
} from "./settings";
import { balanceAutoTeams, countTeams, pickAutoTeam, teamForChoice } from "./teams";
import type {
  EventTuning,
  LobbyAction,
  LobbyCpu,
  LobbyPlayer,
  LobbyPlayerSeed,
  LobbySettings,
  LobbyState,
  LobbyTeam,
  MatchRuntime,
} from "./types";

const MAX_NAME_LENGTH = 24;
const NO_JOIN_URL = "";

/** Trim, collapse whitespace, cap length. Empty becomes the given fallback. */
export const normalizePlayerName = (raw: string, fallback: string): string => {
  const collapsed = raw.replace(/\s+/g, " ").trim();
  const capped = collapsed.slice(0, MAX_NAME_LENGTH);
  return capped.length > 0 ? capped : fallback;
};

export const createInitialLobbyState = (
  overrides: Partial<LobbyState> = {},
): LobbyState => ({
  roomCode: "",
  joinUrl: NO_JOIN_URL,
  phase: "lobby",
  players: [],
  cpus: [],
  departed: {},
  settings: DEFAULT_SETTINGS,
  match: { blue: 0, orange: 0, clockMs: matchDurationMs(DEFAULT_SETTINGS.matchLength), number: 0 },
  announcement: "Scan to join",
  revision: 0,
  ...overrides,
});

/** Wrap an existing state, filling in anything a partial override omits. */
const withState = (base: LobbyState, patch: Partial<LobbyState>): LobbyState => ({
  ...base,
  ...patch,
  revision: base.revision + 1,
});

/* -------------------------------------------------------------------------- */
/* Announcements — the one line mirrored into the projector's aria-live region. */
/* -------------------------------------------------------------------------- */

const joinCountLine = (players: readonly LobbyPlayer[], capacity: number): string => {
  const joined = players.length;
  return `${joined} / ${capacity} PLAYERS JOINED`;
};

const teamScoreLine = (players: readonly LobbyPlayer[]): string => {
  const counts = countTeams(players);
  return `BLUE ${counts.blue} — ORANGE ${counts.orange}`;
};

const announceJoin = (name: string, players: readonly LobbyPlayer[], capacity: number): string =>
  `${name} joined. ${joinCountLine(players, capacity)}. ${teamScoreLine(players)}`;

const announceLeave = (name: string, players: readonly LobbyPlayer[], capacity: number): string =>
  `${name} left. ${joinCountLine(players, capacity)}. ${teamScoreLine(players)}`;

/* -------------------------------------------------------------------------- */
/* Readiness — the single rule the START affordance reads.                    */
/* -------------------------------------------------------------------------- */

export interface LobbyReadiness {
  ok: boolean;
  /** Big, projector-legible reason. Empty string when `ok`. */
  reason: string;
  readyCount: number;
}

export const selectReadiness = (state: LobbyState): LobbyReadiness => {
  const { players, settings } = state;
  const readyCount = players.filter((player) => player.ready).length;

  if (players.length === 0) {
    return { ok: false, reason: "WAITING FOR PLAYERS", readyCount };
  }
  if (players.length > settings.playerSlots) {
    return { ok: false, reason: "ROOM FULL — RAISE A SEAT", readyCount };
  }
  if (settings.botFill === "fill") {
    // Bots cover the empty seats, so one ready player is enough to keep the
    // event moving. This is the EVENT MODE path.
    if (readyCount < 1) {
      return { ok: false, reason: "WAITING FOR A READY PLAYER", readyCount };
    }
    return { ok: true, reason: "", readyCount };
  }
  if (readyCount < players.length) {
    return { ok: false, reason: `WAITING FOR ${players.length - readyCount} MORE READY`, readyCount };
  }
  return { ok: true, reason: "", readyCount };
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const nextSeat = (players: readonly LobbyPlayer[]): number =>
  players.reduce((max, player) => Math.max(max, player.seat), -1) + 1;

const indexOfPlayer = (players: readonly LobbyPlayer[], id: string): number =>
  players.findIndex((player) => player.id === id);

/**
 * Element-wise roster equality on every field a render actually reads.
 *
 * This is how the reducer decides an action is a genuine no-op. Comparing
 * object identity is not enough — rebalancing rebuilds arrays and objects even
 * when nothing moved — and comparing a JSON blob would be both slower and
 * easier to get wrong the moment a field is added.
 */
const sameRoster = (a: readonly LobbyPlayer[], b: readonly LobbyPlayer[]): boolean => {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let index = 0; index < a.length; index += 1) {
    const left = a[index];
    const right = b[index];
    if (
      left.id !== right.id ||
      left.name !== right.name ||
      left.team !== right.team ||
      left.teamPreference !== right.teamPreference ||
      left.ready !== right.ready ||
      left.carId !== right.carId ||
      left.seat !== right.seat
    ) {
      return false;
    }
  }
  return true;
};

const replacePlayer = (
  players: readonly LobbyPlayer[],
  id: string,
  update: (player: LobbyPlayer) => LobbyPlayer,
): LobbyPlayer[] => {
  const index = indexOfPlayer(players, id);
  if (index < 0) {
    return players as LobbyPlayer[];
  }
  const next = players.slice();
  next[index] = update(players[index]);
  return next;
};

/** The subset of a state patch that a settings change produces. */
interface SettingsApplication {
  players: LobbyPlayer[];
  settings: LobbySettings;
  match: MatchRuntime;
}

/** Apply a settings change and re-run AUTO so seat changes land immediately. */
const applySettings = (
  state: LobbyState,
  nextSettings: LobbySettings,
  players: readonly LobbyPlayer[],
): SettingsApplication => {
  const rebalanced = balanceAutoTeams(players, nextSettings.teamSize);
  const clockMs =
    state.phase === "lobby"
      ? matchDurationMs(nextSettings.matchLength)
      : state.match.clockMs;
  return { players: rebalanced, settings: nextSettings, match: { ...state.match, clockMs } };
};

/** Build a fresh player record, restoring a departed one where possible. */
const materializePlayer = (
  seed: LobbyPlayerSeed,
  departed: Readonly<Record<string, LobbyPlayer>>,
  players: readonly LobbyPlayer[],
  settings: LobbySettings,
): LobbyPlayer => {
  const remembered = departed[seed.id];
  const preference = seed.team && isTeamChoice(seed.team) ? seed.team : "auto";
  const explicit = teamForChoice(preference);
  const team =
    explicit ??
    (remembered ? remembered.team : pickAutoTeam(countTeams(players), settings.teamSize));

  return {
    id: seed.id,
    name: normalizePlayerName(seed.name, remembered?.name ?? "PLAYER"),
    team,
    // A reconnecting phone returns on the team it had, still marked as a
    // deliberate-or-automatic choice, so AUTO rebalancing does not shuffle it.
    teamPreference: preference === "auto" ? (remembered?.teamPreference ?? "auto") : preference,
    // Ready survives a reconnect on purpose: at an event a phone that reloaded
    // mid-lobby should not stall the room. The host can always CLEAR READY.
    ready: seed.ready ?? remembered?.ready ?? false,
    carId: seed.carId ?? remembered?.carId ?? null,
    seat: remembered?.seat ?? nextSeat(players),
  };
};

/* -------------------------------------------------------------------------- */
/* The reducer                                                                 */
/* -------------------------------------------------------------------------- */

/** A team never holds more than half the arena (`MAX_PLAYER_SLOTS` is the whole arena). */
export const MAX_TEAM_CARS = MAX_PLAYER_SLOTS / 2;

/**
 * Keep humans + CPUs inside the seats on offer. Humans always win a seat: when
 * someone joins a full room, or the host lowers the seat count, the NEWEST CPUs
 * are the ones dropped. Returns the same state when nothing has to go.
 */
const fitCpusToSeats = (state: LobbyState): LobbyState => {
  const room = Math.max(0, state.settings.playerSlots - state.players.length);
  if (state.cpus.length <= room) return state;
  const cpus = state.cpus.slice(0, room);
  return {
    ...state,
    cpus,
    revision: state.revision + 1,
    announcement: `${state.cpus.length - cpus.length} CPU removed to make room for players`,
  };
};

const reduceCpus = (state: LobbyState, action: LobbyAction): LobbyState | null => {
  switch (action.type) {
    case "cpu/add": {
      // Seats are only edited between matches: a CPU is a roster fact, and the
      // match director reads it once, at launch.
      if (state.phase !== "lobby") return state;
      const team: LobbyTeam = action.team === 1 ? 1 : 0;
      if (state.players.length + state.cpus.length >= state.settings.playerSlots) return state;
      const onTeam =
        state.players.filter((player) => player.team === team).length +
        state.cpus.filter((cpu) => cpu.team === team).length;
      if (onTeam >= MAX_TEAM_CARS) return state;
      const number = state.cpus.reduce((max, cpu) => Math.max(max, Number(cpu.id.slice(4)) || 0), 0) + 1;
      const cpu: LobbyCpu = { id: `cpu-${number}`, name: `CPU ${number}`, team };
      return withState(state, {
        cpus: [...state.cpus, cpu],
        announcement: `${cpu.name} added to ${team === 0 ? "BLUE" : "ORANGE"}`,
      });
    }
    case "cpu/remove": {
      if (state.phase !== "lobby") return state;
      const cpu = state.cpus.find((entry) => entry.id === action.id);
      if (!cpu) return state;
      return withState(state, {
        cpus: state.cpus.filter((entry) => entry.id !== action.id),
        announcement: `${cpu.name} removed`,
      });
    }
    case "cpu/team": {
      if (state.phase !== "lobby") return state;
      const team: LobbyTeam = action.team === 1 ? 1 : 0;
      const cpu = state.cpus.find((entry) => entry.id === action.id);
      if (!cpu || cpu.team === team) return state;
      const onTeam =
        state.players.filter((player) => player.team === team).length +
        state.cpus.filter((entry) => entry.team === team).length;
      if (onTeam >= MAX_TEAM_CARS) return state;
      return withState(state, {
        cpus: state.cpus.map((entry) => (entry.id === action.id ? { ...entry, team } : entry)),
        announcement: `${cpu.name} moved to ${team === 0 ? "BLUE" : "ORANGE"}`,
      });
    }
    case "cpu/clear": {
      if (state.phase !== "lobby" || state.cpus.length === 0) return state;
      return withState(state, { cpus: [], announcement: "CPUs cleared" });
    }
    default:
      return null;
  }
};

export const lobbyReducer = (state: LobbyState, action: LobbyAction): LobbyState => {
  const cpuResult = reduceCpus(state, action);
  if (cpuResult) return cpuResult;
  // Everything else may change who is seated or how many seats there are.
  return fitCpusToSeats(reduceLobby(state, action));
};

const reduceLobby = (state: LobbyState, action: LobbyAction): LobbyState => {
  switch (action.type) {
    case "room/set": {
      const roomCode = action.roomCode.trim().toUpperCase();
      const joinUrl = action.joinUrl.trim();
      if (roomCode === state.roomCode && joinUrl === state.joinUrl) {
        return state;
      }
      return withState(state, { roomCode, joinUrl });
    }

    /**
     * Reconcile the whole room in one action. The orchestrator's recommended
     * path once a real session exists: map `useAirJamHost().players` to seeds
     * and dispatch this, instead of diffing joins and leaves itself.
     */
    case "players/sync": {
      // `seated` grows as we go, so each seed is assigned AUTO against the
      // players BEFORE it — the same order the incremental join path uses.
      const seated: LobbyPlayer[] = [];
      // A player already in the room keeps their record (name typed on the phone, READY,
      // team choice, car). Rebuilding everyone from the SDK seed reset all of that to
      // "Player N / waiting" every time ANYONE joined or left, and the host only re-sends
      // a phone's name/ready when the phone changes it, so it never came back.
      const current = new Map(state.players.map((player) => [player.id, player]));
      const next = action.players.slice(0, MAX_PLAYER_SLOTS).map((seed) => {
        const player = current.get(seed.id) ?? materializePlayer(seed, state.departed, seated, state.settings);
        seated.push(player);
        return player;
      });
      const rebalanced = balanceAutoTeams(next, state.settings.teamSize);
      if (sameRoster(rebalanced, state.players)) {
        return state;
      }
      return withState(state, {
        players: rebalanced,
        announcement:
          rebalanced.length === 0
            ? "Room is empty"
            : `${joinCountLine(rebalanced, state.settings.playerSlots)}. ${teamScoreLine(rebalanced)}`,
      });
    }

    case "player/join": {
      const existing = indexOfPlayer(state.players, action.id);
      if (existing >= 0) {
        // Already seated: a re-join from a phone that simply reconnected.
        return state;
      }
      const seed: LobbyPlayerSeed = { id: action.id, name: action.name };
      if (action.team) {
        seed.team = action.team;
      }
      // HARD cap at the seam's `MAX_CARS`. `playerSlots` is what the host
      // OFFERS and can be raised; it is not a licence to exceed what the
      // bridge will accept, so a full arena refuses the join outright.
      if (state.players.length >= MAX_PLAYER_SLOTS) {
        return state;
      }
      const player = materializePlayer(seed, state.departed, state.players, state.settings);
      const players = balanceAutoTeams([...state.players, player], state.settings.teamSize);
      const departed = { ...state.departed };
      delete departed[action.id];
      return withState(state, {
        players,
        departed,
        announcement: announceJoin(player.name, players, state.settings.playerSlots),
      });
    }

    case "player/leave": {
      const index = indexOfPlayer(state.players, action.id);
      if (index < 0) {
        return state;
      }
      const leaving = state.players[index];
      const players = state.players.filter((player) => player.id !== action.id);
      // The SEAT is released here and now: the player is gone from the roster
      // and the count drops in the same dispatch. What survives in `departed`
      // is identity, not occupancy — a reconnect is a join, not a reservation.
      return withState(state, {
        players,
        departed: { ...state.departed, [leaving.id]: leaving },
        announcement: announceLeave(leaving.name, players, state.settings.playerSlots),
      });
    }

    case "player/rename": {
      const name = normalizePlayerName(action.name, "");
      if (name.length === 0) {
        return state;
      }
      const players = replacePlayer(state.players, action.id, (player) =>
        player.name === name ? player : { ...player, name },
      );
      if (players === (state.players as LobbyPlayer[])) {
        return state;
      }
      return withState(state, { players });
    }

    case "player/team": {
      if (!isTeamChoice(action.choice)) {
        return state;
      }
      const index = indexOfPlayer(state.players, action.id);
      if (index < 0) {
        return state;
      }
      const patched = playersWithTeamChoice(state.players, index, action.choice);
      // Always re-run AUTO, for an explicit pick as well as for "auto": a
      // deliberate ORANGE must not leave the rest of the room lopsided. Pinned
      // players are never moved by `balanceAutoTeams`, so this cannot undo the
      // choice that was just made.
      const players = balanceAutoTeams(patched, state.settings.teamSize);
      if (sameRoster(players, state.players)) {
        return state;
      }
      const updated = players.find((player) => player.id === action.id);
      return withState(state, {
        players,
        announcement: `${updated?.name ?? state.players[index].name} chose ${action.choice.toUpperCase()}. ${teamScoreLine(players)}`,
      });
    }

    case "player/car": {
      const index = indexOfPlayer(state.players, action.id);
      if (index < 0) {
        return state;
      }
      const current = state.players[index];
      const carId = action.carId;
      if (current.carId === carId) {
        return state;
      }
      return withState(state, {
        players: replacePlayer(state.players, action.id, (player) => ({ ...player, carId })),
      });
    }

    case "player/ready": {
      const index = indexOfPlayer(state.players, action.id);
      if (index < 0) {
        return state;
      }
      if (state.players[index].ready === action.ready) {
        return state;
      }
      const players = replacePlayer(state.players, action.id, (player) => ({
        ...player,
        ready: action.ready,
      }));
      const readyCount = players.filter((player) => player.ready).length;
      return withState(state, {
        players,
        announcement: `${state.players[index].name} is ${action.ready ? "ready" : "not ready"}. ${readyCount} of ${players.length} ready.`,
      });
    }

    case "roster/clearReady": {
      if (state.players.every((player) => !player.ready)) {
        return state;
      }
      return withState(state, {
        players: state.players.map((player) => (player.ready ? { ...player, ready: false } : player)),
        announcement: "Ready flags cleared",
      });
    }

    case "settings/patch": {
      const patch = action.patch;
      let nextSettings: LobbySettings = state.settings;
      let dirty = false;

      if (patch.playerSlots !== undefined && isPlayerSlotCount(patch.playerSlots)) {
        nextSettings = { ...nextSettings, playerSlots: patch.playerSlots };
        dirty = true;
      }
      if (patch.teamSize !== undefined && isTeamSize(patch.teamSize)) {
        nextSettings = { ...nextSettings, teamSize: patch.teamSize };
        dirty = true;
      }
      if (patch.matchLength !== undefined && isMatchLength(patch.matchLength)) {
        nextSettings = { ...nextSettings, matchLength: patch.matchLength };
        dirty = true;
      }
      if (patch.botFill !== undefined && isBotFill(patch.botFill)) {
        nextSettings = { ...nextSettings, botFill: patch.botFill };
        dirty = true;
      }
      if (patch.botDifficulty !== undefined && isBotDifficulty(patch.botDifficulty)) {
        nextSettings = { ...nextSettings, botDifficulty: patch.botDifficulty };
        dirty = true;
      }
      if (patch.instantRematch !== undefined) {
        nextSettings = { ...nextSettings, instantRematch: patch.instantRematch };
        dirty = true;
      }
      if (!dirty) {
        return state;
      }
      const applied = applySettings(state, nextSettings, state.players);
      return withState(state, applied);
    }

    case "settings/tuning": {
      const patch = action.patch;
      const current = state.settings.tuning;
      const next: EventTuning = {
        boost: patch.boost === "turbo" || patch.boost === "normal" ? patch.boost : current.boost,
        ball: patch.ball === "heavy" || patch.ball === "normal" ? patch.ball : current.ball,
        kickoffReset:
          patch.kickoffReset === "fast" || patch.kickoffReset === "normal"
            ? patch.kickoffReset
            : current.kickoffReset,
        goalCelebration:
          patch.goalCelebration === "short" || patch.goalCelebration === "full"
            ? patch.goalCelebration
            : current.goalCelebration,
        postMatchScreen:
          patch.postMatchScreen === "short" || patch.postMatchScreen === "full"
            ? patch.postMatchScreen
            : current.postMatchScreen,
      };
      if (JSON.stringify(next) === JSON.stringify(current)) {
        return state;
      }
      return withState(state, { settings: { ...state.settings, tuning: next } });
    }

    case "settings/eventMode": {
      const nextSettings: LobbySettings = action.enabled
        ? { ...EVENT_MODE_SETTINGS, eventMode: true }
        : { ...DEFAULT_SETTINGS, eventMode: false };
      const applied = applySettings(state, nextSettings, state.players);
      return withState(state, {
        ...applied,
        announcement: action.enabled
          ? `EVENT MODE on — 4 players, 2v2, 3 minute games, instant rematch.`
          : "Event mode off — standard settings restored",
      });
    }

    case "match/start": {
      if (state.phase !== "lobby") {
        return state;
      }
      if (!selectReadiness(state).ok) {
        return state;
      }
      return withState(state, {
        phase: "playing",
        match: {
          blue: 0,
          orange: 0,
          clockMs: matchDurationMs(state.settings.matchLength),
          number: state.match.number + 1,
        },
        announcement: `Match ${state.match.number + 1} is live`,
      });
    }

    case "match/goal": {
      if (state.phase !== "playing") {
        return state;
      }
      const team: LobbyTeam = action.team === 0 ? 0 : 1;
      return withState(state, {
        match: { ...state.match, [team === 0 ? "blue" : "orange"]: state.match[team === 0 ? "blue" : "orange"] + 1 },
        announcement: `GOAL — ${team === 0 ? "BLUE" : "ORANGE"}`,
      });
    }

    case "match/tick": {
      if (state.phase !== "playing" || state.match.clockMs === null) {
        return state;
      }
      const delta = Number.isFinite(action.deltaMs) ? Math.max(0, action.deltaMs) : 0;
      if (delta === 0) {
        return state;
      }
      const clockMs = state.match.clockMs - delta;
      if (clockMs <= 0) {
        return withState(state, {
          phase: "post-match",
          match: { ...state.match, clockMs: 0 },
          announcement: "Time up — match over",
        });
      }
      return withState(state, { match: { ...state.match, clockMs } });
    }

    case "match/end": {
      if (state.phase !== "playing") {
        return state;
      }
      const leader = state.match.blue === state.match.orange ? null : state.match.blue > state.match.orange ? 0 : 1;
      return withState(state, {
        phase: "post-match",
        announcement: leader === null ? "Match over — draw" : `Match over — ${leader === 0 ? "BLUE" : "ORANGE"} wins`,
      });
    }

    /**
     * INSTANT REMATCH. One dispatch, no rejoin, no reload, no re-scan.
     *
     * Players, teams, ready flags and cars are all carried over untouched —
     * only the score, the clock and the match number move. This is the single
     * most important action at a live event, so it works from either the
     * post-match screen or a match that is still running (a host abort).
     */
    case "match/rematch": {
      if (state.phase === "lobby") {
        return state;
      }
      return withState(state, {
        phase: "playing",
        players: state.players,
        settings: state.settings,
        match: {
          blue: 0,
          orange: 0,
          clockMs: matchDurationMs(state.settings.matchLength),
          number: state.match.number + 1,
        },
        announcement: `Rematch ${state.match.number + 1} — go!`,
      });
    }

    /** CHANGE TEAMS: forget every explicit pick, re-split, and un-ready the room. */
    case "lobby/reshuffleTeams": {
      const rebalanced = balanceAutoTeams(
        state.players.map((player) => ({ ...player, teamPreference: "auto" as const, ready: false })),
        state.settings.teamSize,
      );
      return withState(state, {
        phase: "lobby",
        players: rebalanced,
        match: { ...state.match, blue: 0, orange: 0, clockMs: matchDurationMs(state.settings.matchLength) },
        announcement: `Teams reshuffled. ${teamScoreLine(rebalanced)}. Everyone pick READY again.`,
      });
    }

    /** EXIT: back to a joinable lobby with the room and its players intact. */
    case "lobby/return": {
      if (state.phase === "lobby") {
        return state;
      }
      return withState(state, {
        phase: "lobby",
        match: {
          blue: 0,
          orange: 0,
          clockMs: matchDurationMs(state.settings.matchLength),
          number: state.match.number,
        },
        announcement: `Back in the lobby. ${joinCountLine(state.players, state.settings.playerSlots)}.`,
      });
    }

    /** Wipe the room. Host escape hatch; keeps the code and the join URL. */
    case "lobby/resetAll": {
      return withState(state, {
        ...createInitialLobbyState({
          roomCode: state.roomCode,
          joinUrl: state.joinUrl,
          settings: state.settings,
        }),
        revision: state.revision,
      });
    }

    default: {
      // CPU actions are handled before this switch (`reduceCpus`).
      return state;
    }
  }
};

/** Shared by `player/team`; kept next to the reducer so the two stay in step. */
const playersWithTeamChoice = (
  players: readonly LobbyPlayer[],
  index: number,
  choice: LobbyPlayer["teamPreference"],
): LobbyPlayer[] => {
  const current = players[index];
  const explicit = teamForChoice(choice);
  const next = players.slice();
  next[index] = { ...current, teamPreference: choice, team: explicit ?? current.team };
  return next;
};
