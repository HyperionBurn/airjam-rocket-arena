/**
 * Match settings, the EVENT MODE preset, and the real donor car list.
 *
 * OWNER: the lobby worker (`src/lobby/**`). Pure data + pure functions.
 */

import type {
  BotDifficulty,
  BotFill,
  EventTuning,
  LobbySettings,
  LobbyTeam,
  MatchLengthMinutes,
  TeamChoice,
} from "./types";

/**
 * The seam caps the arena at `MAX_CARS = 8` (`bridge.cpp`), so the lobby can
 * never offer more seats than the sim can hold. Mirrored as a literal because
 * importing the seam's VALUE would pull the donor into this module's runtime
 * graph (and therefore into the reducer's tests).
 */
export const MAX_PLAYER_SLOTS = 8;

/** Seats a host can choose from. Kept even so teams split cleanly. */
export const PLAYER_SLOT_OPTIONS = [2, 4, 6] as const;
export const TEAM_SIZE_OPTIONS = [1, 2, 3] as const;
export const MATCH_LENGTH_OPTIONS: readonly MatchLengthMinutes[] = [3, 5, 7, 0];
export const BOT_FILL_OPTIONS: readonly BotFill[] = ["off", "fill"];
export const BOT_DIFFICULTY_OPTIONS: readonly BotDifficulty[] = ["rookie", "pro", "ace"];

export const TEAM_LABELS: Readonly<Record<LobbyTeam, string>> = Object.freeze({
  0: "BLUE",
  1: "ORANGE",
});

export const TEAM_CHOICE_LABELS: Readonly<Record<TeamChoice, string>> = Object.freeze({
  blue: "BLUE",
  orange: "ORANGE",
  auto: "AUTO",
});

/** Projector-legible team colours. Both clear 4.5:1 on the dark lobby backdrop. */
export const TEAM_COLORS: Readonly<Record<LobbyTeam, string>> = Object.freeze({
  0: "#38bdf8",
  1: "#fb923c",
});

export const MATCH_LENGTH_LABELS: Readonly<Record<MatchLengthMinutes, string>> = Object.freeze({
  0: "UNLIMITED",
  3: "3 MIN",
  5: "5 MIN",
  7: "7 MIN",
});

export const BOT_FILL_LABELS: Readonly<Record<BotFill, string>> = Object.freeze({
  off: "OFF",
  fill: "FILL TEAMS",
});

export const BOT_DIFFICULTY_LABELS: Readonly<Record<BotDifficulty, string>> = Object.freeze({
  rookie: "ROOKIE",
  pro: "PRO",
  ace: "ACE",
});

/**
 * The donor's real garage list, copied verbatim from
 * `src/donor/settings/car-customization.js:3-10` (`GARAGE_CARS`).
 *
 * The ids are the donor's own strings. This is a COPY, not an import: the donor
 * is byte-identical and read-only, and importing it for a list of six strings
 * would drag the whole donor module into the lobby bundle. If the donor's
 * garage ever changes, this list is the one place to notice.
 */
export const GARAGE_CARS: readonly { id: string; label: string }[] = Object.freeze([
  { id: "fennec", label: "FENNEC" },
  { id: "octane-original", label: "OCTANE" },
  { id: "challenger", label: "CHALLENGER" },
  { id: "spectre", label: "SPECTRE" },
  { id: "vesper", label: "VESPER" },
  { id: "amethyst", label: "AMETHYST" },
]);

/** Does the donor expose a car choice a phone can actually make? Yes — see above. */
export const CAR_SELECTION_SUPPORTED = GARAGE_CARS.length > 0;

export const DEFAULT_TUNING: Readonly<EventTuning> = Object.freeze({
  boost: "normal",
  ball: "normal",
  kickoffReset: "normal",
  goalCelebration: "full",
  postMatchScreen: "full",
});

export const DEFAULT_SETTINGS: Readonly<LobbySettings> = Object.freeze({
  playerSlots: 4,
  teamSize: 2,
  matchLength: 5,
  botFill: "off",
  botDifficulty: "pro",
  eventMode: false,
  instantRematch: false,
  tuning: DEFAULT_TUNING,
});

/**
 * EVENT MODE — one click, whole room reconfigured, nothing to remember.
 *
 * The brief's documented values, one per line:
 *   4 players · 2v2 · 3-minute game · normal boost/ball · fast kickoff reset ·
 *   short goal celebration · short post-match screen · instant rematch.
 *
 * Bot fill is ON at PRO so a room of 1 or 2 still produces a playable 2v2 the
 * instant the host hits start — at an event, an empty seat is dead air.
 * `EVENT_MODE_SETTINGS` is the exact object `settings/eventMode` writes, so a
 * test can assert against the same source of truth the reducer uses.
 */
export const EVENT_MODE_SETTINGS: Readonly<Omit<LobbySettings, "eventMode">> = Object.freeze({
  playerSlots: 4,
  teamSize: 2,
  matchLength: 3,
  botFill: "fill",
  botDifficulty: "pro",
  instantRematch: true,
  tuning: Object.freeze({
    boost: "normal",
    ball: "normal",
    kickoffReset: "fast",
    goalCelebration: "short",
    postMatchScreen: "short",
  }) as EventTuning,
});

export const isPlayerSlotCount = (value: number): boolean =>
  (PLAYER_SLOT_OPTIONS as readonly number[]).includes(value);

export const isTeamSize = (value: number): boolean =>
  (TEAM_SIZE_OPTIONS as readonly number[]).includes(value);

export const isMatchLength = (value: number): boolean =>
  (MATCH_LENGTH_OPTIONS as readonly number[]).includes(value);

export const isBotFill = (value: string): value is BotFill =>
  (BOT_FILL_OPTIONS as readonly string[]).includes(value);

export const isBotDifficulty = (value: string): value is BotDifficulty =>
  (BOT_DIFFICULTY_OPTIONS as readonly string[]).includes(value);

export const isTeamChoice = (value: string): value is TeamChoice =>
  value === "blue" || value === "orange" || value === "auto";

/** Milliseconds for a match length. `0` (UNLIMITED) maps to `null`. */
export const matchDurationMs = (minutes: MatchLengthMinutes): number | null =>
  minutes === 0 ? null : minutes * 60_000;

/** `mm:ss`, or `UNLIMITED`. */
export const formatClock = (clockMs: number | null): string => {
  if (clockMs === null) {
    return "UNLIMITED";
  }
  const totalSeconds = Math.max(0, Math.ceil(clockMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};
