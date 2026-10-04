/**
 * The host-side match controller.
 *
 * `machine.ts` decides; this decides nothing. It owns the mutable glue a
 * reducer must not: the live tracker, the sim bridge, the latched controls, and
 * the queue of commands the machine has emitted but the host has not run yet.
 *
 * It is DOM-free, donor-free and WASM-free, which is what lets the agent
 * contract drive a whole match headlessly and what makes the unit tests real
 * tests rather than mock theatre.
 *
 * ---------------------------------------------------------------------------
 * THE LATCH IS THE POINT
 * ---------------------------------------------------------------------------
 * `seam.ts:312-328` replaces the donor's per-slot controls on every tick, so
 * the host must be able to say "this player is currently holding throttle 0.6
 * and boost" without going anywhere near a controller. `setControls` writes that
 * latch and `readControls` hands back the CONFIG-SHAPED result. The input layer
 * (which this layer must not import) is free to overwrite the same latch from a
 * real Air Jam stick; whoever writes last wins, which is exactly the
 * level-state arbitration the seam already expects.
 */

import { NEUTRAL_CONTROLS, sanitizeControls, type CarControls } from "../airjam/seam.js";
import { readGoalFlag } from "./donor-facts.js";
import { shapeControls } from "./controls.js";
import {
  advanceTicks,
  createInitialMatchState,
  createTickRuntime,
  reduceEndMatch,
  reduceGoal,
  reduceJoinPlayer,
  reduceKickoff,
  reduceLeaveMatch,
  reduceLeavePlayer,
  reduceReadyPlayer,
  reduceRefreshReadiness,
  reduceRematch,
  reduceSetBallCam,
  reduceSetMutator,
  reduceSetTeam,
  reduceStartMatch,
  reduceSwapTeams,
  reduceTick,
  type AdvanceResult,
  type TickRuntime,
} from "./machine.js";
import { applySimConfigToDonor, type MatchSimBridge } from "./sim-bridge.js";
import { resolveSimConfig, type SimConfig } from "./sim-config.js";
import { syncRoster, type TrackerState } from "./stats.js";
import type {
  GoalEvent,
  MatchCommand,
  MatchEffect,
  MatchState,
  PlayerEntry,
  PlayerStats,
  Team,
  TickInput,
} from "./types.js";

/** A command plus everything the host needs to know about when it runs. */
export interface PendingWork {
  readonly effects: readonly MatchEffect[];
  readonly commands: readonly MatchCommand[];
}

/** The public shape of one player's latch, for the input layer and the snapshot. */
export interface CarTrackingView {
  readonly playerId: string;
  readonly team: Team | null;
  readonly slot: number;
  /** Already shaped by the active `SimConfig`. Never partial. */
  readonly controls: CarControls;
}

export interface MatchCoreOptions {
  readonly players?: readonly PlayerEntry[];
  /** Omit for a headless match: every sim call becomes a no-op. */
  readonly bridge?: MatchSimBridge;
}

export interface MatchCore {
  getState(): MatchState;
  getConfig(): SimConfig;
  readControls(playerId: string): CarControls;
  /** The tracker, so a store can publish the counters the machine just wrote. */
  getTracker(): TrackerState;
  /** Everything the machine has asked for and the host has not run yet. */
  drainPending(): PendingWork;

  /* roster */
  joinPlayer(player: PlayerEntry): void;
  leavePlayer(playerId: string): void;
  readyPlayer(playerId: string, ready?: boolean): void;
  setTeam(playerId: string, team: Team): void;
  swapTeams(): void;
  refreshReadiness(): void;

  /* driving */
  setControls(playerId: string, controls: Partial<CarControls>): void;

  /* match flow */
  startMatch(): void;
  tick(input?: TickInput): void;
  advance(ticks: number, input?: TickInput): AdvanceResult;
  scoreGoal(team: Team, attribution?: { scorerId: string | null; assistId: string | null }): GoalEvent;
  resetKickoff(): void;
  endMatch(winner?: Team | null): void;
  rematch(): void;
  leaveMatch(): void;

  /* presentation + mutators */
  setBallCam(playerId: string, ballCam: boolean): void;
  setMutator(mutator: string): void;
}

interface LatchedCar {
  controls: CarControls;
  onGround: boolean;
  boostHeldTicks: number;
}

/**
 * Create a match core.
 *
 * Every method is synchronous and total. A caller that wants the donor touched
 * drains `drainPending()` and acts on it; the core never calls the donor's
 * mutators itself, because only the host knows when it is safe to write to the
 * WASM heap. The ONE exception is `applySimConfigToDonor`, which is idempotent
 * and re-applied at every kickoff, the donor's own reset point.
 */
export const createMatchCore = (options: MatchCoreOptions = {}): MatchCore => {
  const bridge = options.bridge ?? null;
  let state = createInitialMatchState(options.players ?? []);
  let runtime: TickRuntime = createTickRuntime(state.players, bridge?.state ?? null);
  let pendingEffects: MatchEffect[] = [];
  let pendingCommands: MatchCommand[] = [];
  const latched = new Map<string, LatchedCar>();

  const queue = (effects: readonly MatchEffect[], commands: readonly MatchCommand[]): void => {
    if (effects.length > 0) pendingEffects = [...pendingEffects, ...effects];
    if (commands.length > 0) pendingCommands = [...pendingCommands, ...commands];
  };

  /**
   * Re-assert the donor-side config. `_physics_setUnlimitedBoost` and the
   * ball's velocity scale are SIMULATION state, not match state, so they are
   * re-applied whenever the match resets the sim.
   */
  const applyConfig = (): void => {
    if (bridge) applySimConfigToDonor(resolveSimConfig(state.mutator), bridge);
  };

  const requeueTracker = (): void => {
    runtime = { ...runtime, tracker: syncRoster(runtime.tracker, state.players) };
  };

  /** Take a transition and adopt both its state and its side effects. */
  const adopt = (transition: {
    state: MatchState;
    effects: readonly MatchEffect[];
    commands: readonly MatchCommand[];
  }): void => {
    queue(transition.effects, transition.commands);
    state = transition.state;
  };

  const core: MatchCore = {
    getState: () => state,
    getConfig: () => resolveSimConfig(state.mutator),

    getTracker: () => runtime.tracker,

    readControls: (playerId) => {
      const player = state.players.find((entry) => entry.playerId === playerId);
      const cell = latched.get(playerId);
      return shapeControls(
        resolveSimConfig(state.mutator),
        cell?.controls ?? NEUTRAL_CONTROLS,
        {
          onGround: cell?.onGround ?? true,
          team: player?.team ?? 0,
          boostHeldTicks: cell?.boostHeldTicks ?? 0,
        },
      );
    },

    drainPending: () => {
      const work: PendingWork = { effects: pendingEffects, commands: pendingCommands };
      pendingEffects = [];
      pendingCommands = [];
      return work;
    },

    joinPlayer: (player) => {
      adopt({ state: reduceJoinPlayer(state, player), effects: [], commands: [] });
      requeueTracker();
    },

    leavePlayer: (playerId) => {
      adopt({ state: reduceLeavePlayer(state, playerId), effects: [], commands: [] });
      requeueTracker();
      latched.delete(playerId);
    },

    readyPlayer: (playerId, ready = true) => {
      adopt({
        state: reduceRefreshReadiness(reduceReadyPlayer(state, playerId, ready)),
        effects: [],
        commands: [],
      });
    },

    setTeam: (playerId, team) => {
      adopt({
        state: reduceRefreshReadiness(reduceSetTeam(state, playerId, team)),
        effects: [],
        commands: [],
      });
      requeueTracker();
    },

    swapTeams: () => {
      adopt({ state: reduceSwapTeams(state), effects: [], commands: [] });
      requeueTracker();
    },

    refreshReadiness: () => {
      adopt({ state: reduceRefreshReadiness(state), effects: [], commands: [] });
    },

    setControls: (playerId, controls) => {
      const cell = latched.get(playerId) ?? {
        controls: NEUTRAL_CONTROLS,
        onGround: true,
        boostHeldTicks: 0,
      };
      const next = sanitizeControls({ ...cell.controls, ...controls });
      latched.set(playerId, {
        controls: next,
        onGround: cell.onGround,
        boostHeldTicks: next.boost ? cell.boostHeldTicks + 1 : 0,
      });
    },

    startMatch: () => {
      adopt(reduceStartMatch(state));
      runtime = { ...runtime, tracker: createTickRuntime(state.players, bridge?.state ?? null).tracker };
      applyConfig();
    },

    tick: (input) => {
      const result = reduceTick(state, input, runtime);
      runtime = { ...runtime, tracker: result.tracker };
      const wasReset = result.transition.commands.includes("reset-kickoff");
      adopt(result.transition);
      if (wasReset) applyConfig();
    },

    advance: (ticks, input) => {
      const result = advanceTicks(state, runtime, ticks, input);
      runtime = { ...runtime, tracker: result.tracker };
      const wasReset = result.commands.includes("reset-kickoff");
      adopt(result);
      if (wasReset) applyConfig();
      return result;
    },

    scoreGoal: (team, attribution) => {
      const outcome = reduceGoal(state, team, attribution);
      adopt(outcome.transition);
      applyConfig();
      return outcome.event;
    },

    resetKickoff: () => {
      adopt(reduceKickoff(state));
      applyConfig();
    },

    endMatch: (winner) => {
      adopt(reduceEndMatch(state, winner));
    },

    rematch: () => {
      adopt(reduceRematch(state));
      runtime = { ...runtime, tracker: createTickRuntime(state.players, bridge?.state ?? null).tracker };
      applyConfig();
    },

    leaveMatch: () => {
      adopt({ state: reduceLeaveMatch(state), effects: [], commands: [] });
      latched.clear();
    },

    setBallCam: (playerId, ballCam) => {
      adopt({ state: reduceSetBallCam(state, playerId, ballCam), effects: [], commands: [] });
    },

    setMutator: (mutator) => {
      adopt({
        state: reduceSetMutator(state, resolveSimConfig(mutator).id),
        effects: [],
        commands: [],
      });
      applyConfig();
    },
  };

  return core;
};

/* -------------------------------------------------------------------------- */
/* Derived views the overlay and the agent snapshot both want                   */
/* -------------------------------------------------------------------------- */

/** The scoreline as the result screen renders it. */
export const formatScoreline = (state: MatchState): string =>
  `${state.score[0]} - ${state.score[1]}`;

/** "BLUE WINS" / "ORANGE WINS", or null while the match is live. */
export const winnerLabel = (state: MatchState): string | null =>
  state.winner === null ? null : state.winner === 0 ? "BLUE WINS" : "ORANGE WINS";

/**
 * MVP: most goals, then most assists, then most ball touches.
 *
 * The tie-breaks are stated rather than hidden, because with the donor's
 * inferred attribution two players really can finish a match level on goals.
 */
export const findMvp = (state: MatchState): PlayerEntry | null => {
  let best: { player: PlayerEntry; stats: PlayerStats } | null = null;
  for (const player of state.players) {
    const stats = state.stats[player.playerId];
    if (!stats) continue;
    if (!best || compareMvp(stats, best.stats) > 0) best = { player, stats };
  }
  return best?.player ?? null;
};

const compareMvp = (a: PlayerStats, b: PlayerStats): number =>
  a.goals - b.goals || a.assists - b.assists || a.ballTouches - b.ballTouches;

/** The countdown label for the HUD: GET READY, then 3, 2, 1, then GO / GOAL. */
export const countdownLabel = (state: MatchState): string => {
  if (state.phase === "kickoff") return "GET READY";
  if (state.phase === "countdown") return state.countdown > 0 ? String(state.countdown) : "GO";
  if (state.phase === "goal") return "GOAL";
  return "";
};

/** Re-exported so a store needs one import for the whole host-side surface. */
export { createInitialMatchState, createTickRuntime, readGoalFlag };
export type { MatchSimBridge, SimConfig, TickRuntime, TrackerState };
