/**
 * Public surface of the lobby module (`src/lobby/**`).
 *
 * OWNER: the lobby worker. The orchestrator imports from HERE and nowhere else
 * in this subtree, so internal file moves never ripple outward.
 *
 * The order below is the order the brief asks you to think in it: types first
 * (what the state IS), then the pure core (how it changes), then the container
 * (how it is held), then React (how it is drawn).
 */

/* ---------------------------------------------------------------- types --- */
export type {
  CarBindingIntent,
  EventTuning,
  LobbyAction,
  LobbyPhase,
  LobbyPlayer,
  LobbyPlayerSeed,
  LobbySettings,
  LobbyState,
  LobbyTeam,
  MatchLengthMinutes,
  MatchRuntime,
  TeamChoice,
  BotDifficulty,
  BotFill,
} from "./types";

/* ------------------------------------------------------------- settings --- */
export {
  BOT_DIFFICULTY_LABELS,
  BOT_DIFFICULTY_OPTIONS,
  BOT_FILL_LABELS,
  BOT_FILL_OPTIONS,
  CAR_SELECTION_SUPPORTED,
  DEFAULT_SETTINGS,
  DEFAULT_TUNING,
  EVENT_MODE_SETTINGS,
  formatClock,
  GARAGE_CARS,
  MATCH_LENGTH_LABELS,
  MATCH_LENGTH_OPTIONS,
  matchDurationMs,
  MAX_PLAYER_SLOTS,
  PLAYER_SLOT_OPTIONS,
  TEAM_CHOICE_LABELS,
  TEAM_COLORS,
  TEAM_LABELS,
  TEAM_SIZE_OPTIONS,
} from "./settings";

/* ---------------------------------------------------------------- teams --- */
export {
  balanceAutoTeams,
  botCountFor,
  choiceForTeam,
  countTeams,
  hasTeamOverflow,
  pickAutoTeam,
  teamForChoice,
} from "./teams";

/* -------------------------------------------------------------- reducer --- */
export {
  createInitialLobbyState,
  lobbyReducer,
  normalizePlayerName,
  selectReadiness,
  type LobbyReadiness,
} from "./lobby-reducer";

/* ------------------------------------------------------------ selectors --- */
export {
  selectBotGap,
  selectCapacity,
  selectCarBindingIntents,
  selectClockLabel,
  selectFindPlayer,
  selectIsEventMode,
  selectIsFull,
  selectJoinCountLabel,
  selectJoinedCount,
  selectReadinessState,
  selectRoster,
  selectScoreLabel,
  selectTeamCounts,
  selectTeamOverflow,
  selectTeamScoreLabel,
  type LobbyRosterRow,
} from "./lobby-selectors";

/* ---------------------------------------------------------------- store --- */
export { createLobbyStore, type LobbyListener, type LobbyStore } from "./lobby-store";
export {
  LobbyStoreProvider,
  useLobbyDispatch,
  useLobbySelector,
  useLobbyState,
  useLobbyStore,
  type LobbyStoreProviderProps,
} from "./lobby-store-context";

/* -------------------------------------------------------------- react ---- */
export { HostLobbyScreen, type HostLobbyScreenProps } from "./host-lobby-screen";
export { LobbyQrPanel, type LobbyQrPanelProps } from "./lobby-qr-panel";
export { LobbyRoster, type LobbyRosterProps } from "./lobby-roster";
export { LobbySettingsPanel, type LobbySettingsPanelProps } from "./lobby-settings-panel";
export {
  ControllerJoinFlow,
  type ControllerJoinFlowProps,
  type JoinStep,
} from "./controller-join-flow";
