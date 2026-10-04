/**
 * The match store's state shape.
 *
 * Split out of `store.ts` purely so the `actions` map can be declared INLINE.
 * `createAirJamStore` constrains `actions` to `Record<string, handler>`; a
 * separately-declared `interface` has no index signature, fails that constraint
 * and degrades the hook's return type to `unknown` for every consumer.
 * `air-capture` hits the identical constraint and solves it the same way.
 */

import type { AirJamActionAcceptance, AirJamActionContext } from "@air-jam/sdk";
import type { CarControls } from "../airjam/seam.js";
import type { MatchState, Team } from "./types.js";

export interface MatchStoreState extends MatchState {
  /** `playerId` → config-shaped controls, never partial. */
  readonly controls: Readonly<Record<string, CarControls>>;
  readonly mutatorLabel: string;

  actions: {
    joinPlayer: (
      ctx: AirJamActionContext,
      payload: { playerId: string; name: string; team: Team; slot: number; isBot: boolean },
    ) => Promise<AirJamActionAcceptance<{ ok: true }>>;
    readyPlayer: (
      ctx: AirJamActionContext,
      payload: { playerId: string; ready: boolean },
    ) => Promise<AirJamActionAcceptance<{ ok: true }>>;
    setTeam: (ctx: AirJamActionContext, payload: { playerId: string; team: Team }) => Promise<AirJamActionAcceptance<{ ok: true }>>;
    startMatch: (_ctx: AirJamActionContext, _payload: undefined) => Promise<AirJamActionAcceptance<{ ok: true }>>;
    restartMatch: (_ctx: AirJamActionContext, _payload: undefined) => Promise<AirJamActionAcceptance<{ ok: true }>>;
    swapTeams: (_ctx: AirJamActionContext, _payload: undefined) => Promise<AirJamActionAcceptance<{ ok: true }>>;
    leaveMatch: (_ctx: AirJamActionContext, _payload: undefined) => Promise<AirJamActionAcceptance<{ ok: true }>>;
    setBallCam: (
      ctx: AirJamActionContext,
      payload: { playerId: string; ballCam: boolean },
    ) => Promise<AirJamActionAcceptance<{ ok: true }>>;
    setControls: (
      ctx: AirJamActionContext,
      payload: { playerId: string; controls: Partial<CarControls> },
    ) => Promise<AirJamActionAcceptance<{ ok: true }>>;
    setMutator: (ctx: AirJamActionContext, payload: { mutator: string }) => Promise<AirJamActionAcceptance<{ ok: true }>>;
    advance: (ctx: AirJamActionContext, payload: { ticks: number }) => Promise<AirJamActionAcceptance<{ ticksRun: number }>>;
    scoreGoal: (ctx: AirJamActionContext, payload: { team: Team }) => Promise<AirJamActionAcceptance<{ ok: true }>>;
    resetKickoff: (_ctx: AirJamActionContext, _payload: undefined) => Promise<AirJamActionAcceptance<{ ok: true }>>;
    endMatch: (ctx: AirJamActionContext, payload: { winner: Team | null }) => Promise<AirJamActionAcceptance<{ ok: true }>>;
  };
}
