/**
 * Lobby domain types for the Rocket Arena Air Jam port.
 *
 * OWNER: the lobby worker (`src/lobby/**`). This module is pure TypeScript —
 * no React, no SDK runtime, no DOM — so the reducer that consumes it is
 * unit-testable in a plain node environment and injectable by the orchestrator.
 *
 * The only coupling to the rest of the port is TYPE-ONLY against the shared
 * seam contract (`../airjam/seam`). A type-only import is erased at compile
 * time, so nothing here drags the donor (and its `@donor/physics/simulation.js`
 * runtime import) into the reducer's test graph.
 *
 * ---------------------------------------------------------------------------
 * WHY THE LOBBY OWNS TEAM / READY / CAR STATE
 * ---------------------------------------------------------------------------
 * The SDK's `PlayerProfile` is `{ id, label, color?, avatarId? }` and nothing
 * more — there is no team, no ready flag and no car field anywhere in the SDK.
 * (See `packages/sdk/src/protocol/controller.ts:112-118`.) Those three facts are
 * therefore GAME state, owned here, and the orchestrator is responsible for
 * feeding real SDK join/leave events into it and reading it back out.
 */

import type { CarControls } from "../airjam/seam";

/**
 * 0 = BLUE, 1 = ORANGE. Deliberately the same union the seam's
 * `CarSlotRegistry.claim(playerId, team?)` and `CarInputSource.team` use, so a
 * lobby team can be handed to the slot registry with no translation.
 */
export type LobbyTeam = 0 | 1;

/** What a phone picked. `"auto"` means "put me wherever balances the room". */
export type TeamChoice = "blue" | "orange" | "auto";

/** Match clock length in minutes. `0` is UNLIMITED. */
export type MatchLengthMinutes = 0 | 3 | 5 | 7;

/** Whether bots top the teams up to `teamSize`. */
export type BotFill = "off" | "fill";

export type BotDifficulty = "rookie" | "pro" | "ace";

/**
 * Knobs the lobby publishes for the donor's match feel.
 *
 * GAP (documented, not faked): the Air Jam SDK exposes NO match-tuning API —
 * `AirJamHostApi` is join/leave/input/signal/pause only. These are therefore
 * lobby-owned VALUES with no SDK backend; the orchestrator is the only party
 * that can map them onto the simulation, and nothing in this module pretends
 * otherwise.
 */
export interface EventTuning {
  boost: "normal" | "turbo";
  ball: "normal" | "heavy";
  kickoffReset: "fast" | "normal";
  goalCelebration: "short" | "full";
  postMatchScreen: "short" | "full";
}

export interface LobbySettings {
  /** Human seats offered in the room. Capped by the seam's `MAX_CARS = 8`. */
  playerSlots: number;
  /** Humans allowed per team. `teamSize: 2` is the 2v2 event default. */
  teamSize: number;
  matchLength: MatchLengthMinutes;
  botFill: BotFill;
  botDifficulty: BotDifficulty;
  /**
   * True while the EVENT MODE preset is in force. It is a ONE-CLICK preset, not
   * a pile of independent toggles: turning it on overwrites every field below
   * from `EVENT_MODE_PRESET`, and turning it off restores `DEFAULT_SETTINGS`.
   */
  eventMode: boolean;
  /** The event's headline throughput behaviour: rematch in a single dispatch. */
  instantRematch: boolean;
  tuning: EventTuning;
}

export type LobbyPhase = "lobby" | "playing" | "post-match";

export interface LobbyPlayer {
  /** Air Jam controller/player id. The identity key for reconnects. */
  id: string;
  name: string;
  team: LobbyTeam;
  /** What the phone asked for. Only `"auto"` players ever get moved around. */
  teamPreference: TeamChoice;
  ready: boolean;
  carId: string | null;
  /** Monotonic join order — keeps the roster stable and tie-breaks AUTO. */
  seat: number;
}

/** Score + clock. `clockMs: null` is the UNLIMITED match length. */
export interface MatchRuntime {
  blue: number;
  orange: number;
  clockMs: number | null;
  /** 1 for the first match; incremented by every rematch. */
  number: number;
}

/** Everything the host screen and the orchestrator read. */
export interface LobbyState {
  /** e.g. `"A8K2Q"`. Empty until the real session resolves it. */
  roomCode: string;
  /** The real `useAirJamHost().joinUrl`, or `""` while it is still resolving. */
  joinUrl: string;
  phase: LobbyPhase;
  players: LobbyPlayer[];
  /**
   * Players who left, retained so a phone that reloads or drops off Wi-Fi for a
   * moment comes back with the SAME name, team and car. Keyed by player id.
   * Leaving still frees the seat immediately — this is a memory, not a hold.
   */
  departed: Readonly<Record<string, LobbyPlayer>>;
  settings: LobbySettings;
  match: MatchRuntime;
  /**
   * One short line describing the most recent roster/match change. The host
   * screen mirrors this into an `aria-live="polite"` region.
   */
  announcement: string;
  /** Bumped on every state change so subscribers can cheaply detect churn. */
  revision: number;
}

/**
 * The per-player row the orchestrator needs to bind a lobby seat to a car.
 * Typed against the seam's team union and its `CarControls` shape; it is an
 * INTENT, not a binding — the slots worker owns `CarSlotRegistry`.
 */
export interface CarBindingIntent {
  playerId: string;
  name: string;
  team: LobbyTeam;
  ready: boolean;
  carId: string | null;
  /** The controls the seam will be asked to drive this car with. */
  controls: CarControls;
}

/** Seed shape for `players/sync`, so a session can be reconciled in one action. */
export interface LobbyPlayerSeed {
  id: string;
  name: string;
  team?: TeamChoice;
  ready?: boolean;
  carId?: string | null;
}

export type LobbyAction =
  | { type: "room/set"; roomCode: string; joinUrl: string }
  | { type: "players/sync"; players: readonly LobbyPlayerSeed[] }
  | { type: "player/join"; id: string; name: string; team?: TeamChoice }
  | { type: "player/leave"; id: string }
  | { type: "player/rename"; id: string; name: string }
  | { type: "player/team"; id: string; choice: TeamChoice }
  | { type: "player/car"; id: string; carId: string | null }
  | { type: "player/ready"; id: string; ready: boolean }
  | { type: "roster/clearReady" }
  | { type: "settings/patch"; patch: Partial<Omit<LobbySettings, "tuning">> }
  | { type: "settings/eventMode"; enabled: boolean }
  | { type: "settings/tuning"; patch: Partial<EventTuning> }
  | { type: "match/start" }
  | { type: "match/goal"; team: LobbyTeam }
  | { type: "match/tick"; deltaMs: number }
  | { type: "match/end" }
  | { type: "match/rematch" }
  | { type: "lobby/reshuffleTeams" }
  | { type: "lobby/return" }
  | { type: "lobby/resetAll" };
