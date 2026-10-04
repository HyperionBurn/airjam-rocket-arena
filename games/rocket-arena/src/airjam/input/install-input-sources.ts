/**
 * Wiring: registers Air Jam input sources into the slots worker's registry.
 *
 * ONE-DIRECTIONAL DEPENDENCY. This file imports ONLY the `CarSlotRegistry`
 * *interface* from `seam.ts` — never the concrete class, which the slots worker
 * owns and which does not exist yet. Nothing here reaches into
 * `src/airjam/slots/**`.
 *
 * ONE GAP IN THE SEAM INTERFACE, HANDLED EXPLICITLY. `CarSlotRegistry`
 * (`seam.ts:176-190`) can `claim` a slot, `release` it, and report `entries()`
 * and `liveSlots()` — but it has no way to be TOLD which source now drives the
 * slot it just handed out, and `seam.ts` is not editable. Rather than guess a
 * method name on a class that does not exist and would silently no-op, the
 * caller supplies {@link AttachInputSource}. The host passes the registry's own
 * attach method. If it is omitted, sources still work and are still fully
 * safe — they simply will not appear in `registry.entries()`.
 */

import type { CarControls, CarInputSource, CarSlotRegistry, NeutralizeReason } from "../seam";
import {
  createAirJamInputSource,
  type AirJamInputSourceOptions,
  type CarStateContext,
  type ManagedCarInputSource,
} from "./airjam-input-source";
import { installStuckInputGuard, type GuardTarget, type PointerPolicy } from "./stuck-input-guard";
import type { StickShaping } from "./stick";

/**
 * Structural subset of the SDK's `ControllerPresenceNotice`
 * (`packages/sdk/src/protocol/notices.ts:4-12`) that this layer needs.
 *
 * `host.controllers` is assignable to `ReadonlyArray<PresenceNotice>` as-is, so
 * the host can pass the SDK's own array with no mapping step and no SDK import.
 */
export interface PresenceNotice {
  controllerId: string;
  connected: boolean;
}

/** How a source is handed to the registry so it can appear in `entries()`. */
export type AttachInputSource = (
  playerId: string,
  slot: number,
  team: 0 | 1,
  source: CarInputSource,
) => void;

export interface InstallInputSourcesOptions
  extends Omit<AirJamInputSourceOptions, "readRaw" | "guard" | "guardTarget"> {
  /** The slots worker's registry. */
  registry: CarSlotRegistry;
  /** `() => host.getInput(playerId)`. Returns `undefined` when nothing is published. */
  readRaw: (playerId: string) => unknown;
  /** See {@link AttachInputSource}. Optional; omit if the registry has no attach. */
  attach?: AttachInputSource;
  /** Reuse an existing guard instead of installing one. */
  guard?: ReturnType<typeof installStuckInputGuard>;
  /** DOM target for the stuck-input guard and `isLive()`. */
  guardTarget?: GuardTarget;
  pointerPolicy?: PointerPolicy;
  shaping?: Partial<StickShaping>;
  now?: () => number;
  maxQueuedJumpPresses?: number;
  staleAfterMs?: number;
}

export interface InputSourceSnapshot {
  playerId: string;
  slot: number;
  team: 0 | 1 | null;
  live: boolean;
  controls: CarControls;
}

export interface InputSourcesController {
  /**
   * Claim a slot and create the player's source. `null` when the arena is full,
   * or when a requested `slot` is not available.
   */
  register(playerId: string, team?: 0 | 1, slot?: number): ManagedCarInputSource | null;
  /** Dispose the source and release the slot. */
  unregister(playerId: string): void;
  /** The source for `playerId`, if registered. */
  get(playerId: string): ManagedCarInputSource | undefined;
  /** All registered sources, in registration order. */
  sources(): ReadonlyArray<ManagedCarInputSource>;
  /**
   * Drive the presence feed. A source whose controller is missing from
   * `notices` is treated as gone, not as merely unmentioned — an absent
   * controller is the strongest disconnect signal there is.
   */
  syncPresence(notices: ReadonlyArray<PresenceNotice>): void;
  /**
   * Feed RocketSim's `ON_GROUND` for each slot, keyed by slot index. The host
   * loop calls this every tick from the sim state.
   */
  feedCarStates(onGroundBySlot: ReadonlyMap<number, boolean>): void;
  /** One read per live source, for the host loop. */
  readAll(): InputSourceSnapshot[];
  /** Neutralize everything, ours and any bots the registry knows about. */
  neutralizeAll(reason: NeutralizeReason): void;
  /** Dispose every source and uninstall the guard. */
  dispose(): void;
}

export const installInputSources = (
  options: InstallInputSourcesOptions,
): InputSourcesController => {
  const { registry, readRaw, attach, ...sourceOptions } = options;
  const guard =
    options.guard ??
    installStuckInputGuard({
      target: options.guardTarget,
      pointerPolicy: options.pointerPolicy,
    });

  const byPlayer = new Map<string, ManagedCarInputSource>();

  /**
   * The team the REGISTRY assigned, never one we guess from the slot index. The
   * donor's slot→team convention is not documented in the seam, and the registry
   * already knows the answer.
   */
  const teamForSlot = (slot: number): 0 | 1 | null =>
    registry.liveSlots().find((entry) => entry.slot === slot)?.team ?? null;

  const controller: InputSourcesController = {
    register(playerId, team, wantedSlot) {
      const existing = byPlayer.get(playerId);
      if (existing) {
        return existing;
      }
      const slot = registry.claim(playerId, team, wantedSlot);
      if (slot === null) {
        return null;
      }
      const resolvedTeam = teamForSlot(slot) ?? team ?? 0;
      const source = createAirJamInputSource(playerId, {
        ...sourceOptions,
        guard,
        readRaw: () => readRaw(playerId),
      });
      source.bindSlot(slot, resolvedTeam);
      byPlayer.set(playerId, source);
      attach?.(playerId, slot, resolvedTeam, source);
      return source;
    },

    unregister(playerId) {
      const source = byPlayer.get(playerId);
      if (!source) {
        return;
      }
      byPlayer.delete(playerId);
      source.dispose();
      registry.release(playerId);
    },

    get(playerId) {
      return byPlayer.get(playerId);
    },

    sources() {
      return [...byPlayer.values()];
    },

    syncPresence(notices) {
      const connected = new Set(
        notices.filter((notice) => notice.connected).map((notice) => notice.controllerId),
      );
      for (const [playerId, source] of byPlayer) {
        source.setPresence(connected.has(playerId));
      }
    },

    feedCarStates(onGroundBySlot) {
      for (const source of byPlayer.values()) {
        const onGround = onGroundBySlot.get(source.slot);
        if (onGround === undefined) {
          continue;
        }
        const state: CarStateContext = { onGround };
        source.updateCarState(state);
      }
    },

    readAll() {
      return [...byPlayer.values()].map((source) => ({
        playerId: source.playerId,
        slot: source.slot,
        team: source.team,
        live: source.isLive(),
        controls: source.read(),
      }));
    },

    neutralizeAll(reason) {
      for (const source of byPlayer.values()) {
        source.neutralize(reason);
      }
      registry.neutralizeAll(reason);
    },

    dispose() {
      for (const source of [...byPlayer.values()]) {
        source.dispose();
      }
      byPlayer.clear();
      guard.dispose();
    },
  };

  return controller;
};
