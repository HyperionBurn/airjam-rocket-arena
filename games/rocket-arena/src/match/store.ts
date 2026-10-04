/**
 * The Air Jam store for the match layer.
 *
 * A thin wrapper: every action is a call into `createMatchCore`, and the state
 * is the core's immutable `MatchState` plus the flat pieces the agent snapshot
 * and the overlay read. Nothing here decides anything.
 *
 * Mirrors `games/air-capture/src/game/stores/match/match-store.ts`: the store
 * shape is `{ ...snapshot, actions }`, `createAirJamStore` owns the sync, and
 * every action takes `(ctx, payload)`.
 *
 * ---------------------------------------------------------------------------
 * WHY THE ACTIONS ARE INLINED
 * ---------------------------------------------------------------------------
 * `createAirJamStore` constrains `actions` to `Record<string, handler>`, so a
 * separately-declared `interface` fails the constraint (no index signature) and
 * the hook's return type degrades to `unknown` everywhere downstream. air-capture
 * hits the same constraint and declares the actions inline. So do we.
 *
 * ---------------------------------------------------------------------------
 * WHY THERE IS ONE CORE PER PAGE
 * ---------------------------------------------------------------------------
 * The core is a module-level singleton. Air Jam actions arrive as RPC from a
 * controller and are replayed on the host, so there must be exactly one match
 * per page; two would each tick their own clock.
 */

import {
  acceptAirJamAction,
  createAirJamStore,
  type AirJamActionContext,
} from "@air-jam/sdk";
import { createMatchCore, type MatchCore } from "./core.js";
import { createInitialMatchState, IDLE_TICK } from "./machine.js";
import { resolveSimConfig } from "./sim-config.js";
import type { MatchStoreState } from "./store-types.js";
import { NEUTRAL_CONTROLS, type CarControls } from "../airjam/seam.js";
import type { PlayerEntry, TickInput } from "./types.js";

/** The single match core this page drives. */
const core: MatchCore = createMatchCore();

/**
 * The state an action publishes: the machine's own state plus the two things a
 * caller cannot derive from it — the latched controls and the config in force.
 */
const snapshot = (): Omit<MatchStoreState, "actions"> => {
  const state = core.getState();
  const controls: Record<string, CarControls> = {};
  for (const player of state.players) {
    controls[player.playerId] = core.readControls(player.playerId);
  }
  return {
    ...state,
    controls,
    mutatorLabel: core.getConfig().label,
  };
};

/**
 * The zustand `set` is captured once from the initializer and kept here, because
 * `AirJamSyncedStoreHook` exposes `getState()` and `subscribe()` but NO
 * `setState()`. The host needs to publish after a donor tick that arrived
 * outside a store action, and the only sanctioned way to do that is the
 * initializer's own setter.
 */
let publish: ((partial: Partial<MatchStoreState>) => void) | null = null;

/** Run one core mutation and publish the result. */
const run = (body: () => void): void => {
  body();
  publish?.(snapshot());
};

export const useMatchStore = createAirJamStore<MatchStoreState>((set) => {
  publish = (partial) => set(partial);
  return {
    ...createInitialMatchState(),
    controls: {},
    mutatorLabel: resolveSimConfig("NORMAL").label,

    actions: {
      joinPlayer: (_ctx, payload) => {
        run(() => core.joinPlayer(payload as PlayerEntry));
        return Promise.resolve(acceptAirJamAction({ ok: true as const }));
      },

      readyPlayer: (_ctx, payload) => {
        run(() => core.readyPlayer(payload.playerId, payload.ready));
        return Promise.resolve(acceptAirJamAction({ ok: true as const }));
      },

      setTeam: (_ctx, payload) => {
        run(() => core.setTeam(payload.playerId, payload.team));
        return Promise.resolve(acceptAirJamAction({ ok: true as const }));
      },

      startMatch: () => {
        run(() => core.startMatch());
        return Promise.resolve(acceptAirJamAction({ ok: true as const }));
      },

      restartMatch: () => {
        run(() => core.rematch());
        return Promise.resolve(acceptAirJamAction({ ok: true as const }));
      },

      swapTeams: () => {
        run(() => core.swapTeams());
        return Promise.resolve(acceptAirJamAction({ ok: true as const }));
      },

      leaveMatch: () => {
        run(() => core.leaveMatch());
        return Promise.resolve(acceptAirJamAction({ ok: true as const }));
      },

      setBallCam: (_ctx, payload) => {
        run(() => core.setBallCam(payload.playerId, payload.ballCam));
        return Promise.resolve(acceptAirJamAction({ ok: true as const }));
      },

      setControls: (_ctx, payload) => {
        run(() => core.setControls(payload.playerId, payload.controls));
        return Promise.resolve(acceptAirJamAction({ ok: true as const }));
      },

      setMutator: (_ctx, payload) => {
        run(() => core.setMutator(payload.mutator));
        return Promise.resolve(acceptAirJamAction({ ok: true as const }));
      },

      advance: (_ctx, payload) => {
        let ticksRun = 0;
        run(() => {
          ticksRun = core.advance(payload.ticks, IDLE_TICK).ticksRun;
        });
        return Promise.resolve(acceptAirJamAction({ ticksRun }));
      },

      scoreGoal: (_ctx, payload) => {
        run(() => core.scoreGoal(payload.team));
        return Promise.resolve(acceptAirJamAction({ ok: true as const }));
      },

      resetKickoff: () => {
        run(() => core.resetKickoff());
        return Promise.resolve(acceptAirJamAction({ ok: true as const }));
      },

      endMatch: (_ctx, payload) => {
        run(() => core.endMatch(payload.winner));
        return Promise.resolve(acceptAirJamAction({ ok: true as const }));
      },
    },
  };
});

/** The core, for the orchestrator's host wiring. Not a React hook. */
export const matchCore: MatchCore = core;

/** Feed one real donor tick into the store. Called by the host's frame loop. */
export const pushDonorTick = (input: Partial<TickInput> = {}): void => {
  run(() => core.tick({ ...IDLE_TICK, ...input }));
};

/** Re-publish after the host applied the sim changes the core asked for. */
export const syncMatchStore = (): void => {
  publish?.(snapshot());
};

/** Neutral controls, re-exported so a UI needs one import. */
export { NEUTRAL_CONTROLS };

/** Re-exported for the agent contract, which must not reach into three modules. */
export type { MatchStoreState } from "./store-types.js";
export type { PlayerEntry, TickInput };
export type { CarControls, AirJamActionContext };
