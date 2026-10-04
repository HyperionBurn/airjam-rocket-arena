/**
 * Bot driver: drives the non-human cars of a local match.
 *
 * Built from pieces the port already had — the stall-proof bot seat source, the
 * scripted chaser policy and the donor's neural inference wrapper — but wired
 * to the lobby's REAL roster. `planBotFill` assumes an even human split, which
 * is not what happens when two friends both pick BLUE, so the fill here counts
 * the humans actually on each team.
 *
 * Neural vs scripted
 * ------------------
 * The donor's ONNX policies are 1v1: their observation builders reject anything
 * but two cars (`canDriveArena`). So a lone human against one bot gets the real
 * neural opponent, and every larger match is driven by the deterministic
 * scripted chaser. That is a limit of the models, not a choice made here.
 *
 * Failure isolation
 * -----------------
 * Every call into the bot seat is synchronous and total (see `bot-source.ts`):
 * a wedged model neutralises its own car instead of freezing the match, which is
 * what the donor's own bot handler does.
 */

import {
  canDriveArena,
  getBotDifficulty,
  type BotDifficultyId,
} from "@/airjam/bots/bot-difficulty";
import { createBotInputSource, type ManagedBotInputSource } from "@/airjam/bots/bot-source";
import type { BoostPadView, BotInference } from "@/airjam/bots/bot-inference";
import { createDonorBotInferenceFactory } from "@/airjam/bots/donor-inference";
import { SCRIPTED_POLICIES, createScriptedInference, type ScriptedSkill } from "@/airjam/bots/scripted-bot";
import type { CarControls } from "@/airjam/seam";
import type { LobbyTeam } from "@/lobby";

export type BotMode = "neural" | "scripted";

export interface BotCarSpec {
  /** Car index in the match (== slot). */
  slot: number;
  team: LobbyTeam;
}

/** What the donor's frame loop needs from a bot driver. */
export interface BotDriver {
  readonly mode: BotMode;
  /** The cars this driver currently drives (changes as players take cars over / leave). */
  readonly bots: ReadonlyArray<BotCarSpec>;
  /** Issue/refresh decisions. Called once per physics tick while the ball is live. */
  tick(state: Float32Array, pads: ReadonlyArray<BoostPadView>, kickoffTick: number): void;
  /** The controls to apply to `slot` this tick, or null if `slot` is not a bot. */
  controls(slot: number): CarControls | null;
  /** Stop driving `slot` (a player took the car over). */
  release(slot: number): void;
  /** Start driving `spec.slot` (a player left). Always a scripted bot: it joins mid-match. */
  adopt(spec: BotCarSpec): void;
  stop(): void;
}

export interface BotDriverOptions {
  bots: ReadonlyArray<BotCarSpec>;
  /** Every car in the match, bots included. */
  totalCars: number;
  difficulty: BotDifficultyId;
  /** How well the SCRIPTED bots play (neural bots play as their model plays). Default "pro". */
  skill?: ScriptedSkill;
  /** Called when the neural model could not load and scripted bots took over. */
  onFallback?: (reason: string) => void;
}

const describe = (error: unknown): string => (error instanceof Error ? error.message : String(error));

const buildSources = (
  bots: ReadonlyArray<BotCarSpec>,
  difficulty: BotDifficultyId,
  mode: BotMode,
  skill: ScriptedSkill,
): { sources: ManagedBotInputSource[]; inferences: BotInference[] } => {
  const makeNeural = createDonorBotInferenceFactory();
  const inferences = bots.map(() =>
    mode === "neural"
      ? makeNeural(difficulty)
      : createScriptedInference({ id: difficulty, policy: SCRIPTED_POLICIES[skill] }),
  );
  const sources = bots.map((bot, index) =>
    createBotInputSource({
      playerId: `bot:${difficulty}:${bot.slot}`,
      slot: bot.slot,
      team: bot.team,
      inference: inferences[index]!,
    }),
  );
  return { sources, inferences };
};

export const createBotDriver = async (options: BotDriverOptions): Promise<BotDriver> => {
  const { bots, totalCars, difficulty } = options;
  const skill: ScriptedSkill = options.skill ?? "pro";
  const entry = getBotDifficulty(difficulty);

  let mode: BotMode = entry.enabled && canDriveArena(difficulty, totalCars) ? "neural" : "scripted";
  let { sources, inferences } = buildSources(bots, difficulty, mode, skill);

  if (mode === "neural") {
    try {
      await Promise.all(inferences.map((inference) => inference.load()));
      if (!inferences.every((inference) => inference.isReady)) throw new Error("model did not report ready");
    } catch (error) {
      // The neural bot is a nicety; a match with a chasing bot beats no match.
      const reason = describe(error);
      console.warn(`[rocket-arena/bots] ${entry.label} failed to load (${reason}); using scripted bots.`);
      options.onFallback?.(reason);
      for (const inference of inferences) {
        try {
          inference.dispose();
        } catch {
          /* already broken; nothing to release */
        }
      }
      mode = "scripted";
      ({ sources, inferences } = buildSources(bots, difficulty, mode, skill));
    }
  }

  for (const source of sources) source.start();
  const bySlot = new Map(sources.map((source) => [source.slot, source]));
  const brains = new Map(sources.map((source, index) => [source.slot, inferences[index]!]));
  const specs = new Map(bots.map((bot) => [bot.slot, bot]));

  const dispose = (inference: BotInference | undefined): void => {
    if (!inference) return;
    try {
      inference.dispose();
    } catch (error) {
      console.warn(`[rocket-arena/bots] dispose failed: ${describe(error)}`);
    }
  };

  return {
    mode,
    get bots() {
      return [...specs.values()].sort((a, b) => a.slot - b.slot);
    },
    release(slot) {
      const source = bySlot.get(slot);
      if (!source) return;
      source.stop("released");
      dispose(brains.get(slot));
      bySlot.delete(slot);
      brains.delete(slot);
      specs.delete(slot);
    },
    adopt(spec) {
      if (bySlot.has(spec.slot)) return;
      const inference = createScriptedInference({ id: difficulty, policy: SCRIPTED_POLICIES[skill] });
      const source = createBotInputSource({
        playerId: `bot:${difficulty}:${spec.slot}`,
        slot: spec.slot,
        team: spec.team,
        inference,
      });
      source.start();
      bySlot.set(spec.slot, source);
      brains.set(spec.slot, inference);
      specs.set(spec.slot, spec);
    },
    tick(state, pads, kickoffTick) {
      for (const source of bySlot.values()) {
        if (!source.isLive()) continue;
        try {
          source.pump({
            state,
            pads,
            slot: source.slot,
            team: source.team === 1 ? 1 : 0,
            current: source.read(),
            kickoffTick,
          });
        } catch (error) {
          console.warn(`[rocket-arena/bots] slot ${source.slot} pump failed: ${describe(error)}`);
        }
      }
    },
    controls(slot) {
      return bySlot.get(slot)?.read() ?? null;
    },
    stop() {
      for (const source of bySlot.values()) source.stop("released");
      for (const inference of brains.values()) dispose(inference);
      bySlot.clear();
      brains.clear();
      specs.clear();
    },
  };
};

/**
 * Fill each team up to `teamSize` with bots, counting the humans actually on it.
 * Humans are never dropped; bots are trimmed first if the arena is too small.
 */
export const planBotCars = (
  humanTeams: ReadonlyArray<LobbyTeam>,
  teamSize: number,
  maxCars: number,
): LobbyTeam[] => {
  const onTeam: [number, number] = [0, 0];
  for (const team of humanTeams) onTeam[team] += 1;
  const bots: LobbyTeam[] = [];
  for (const team of [0, 1] as const) {
    for (let i = onTeam[team]; i < teamSize; i += 1) bots.push(team);
  }
  // A lone human still needs an opponent for the match to mean anything.
  if (humanTeams.length > 0 && bots.length === 0 && onTeam[0] === 0) bots.push(0);
  if (humanTeams.length > 0 && bots.length === 0 && onTeam[1] === 0) bots.push(1);
  const room = Math.max(0, maxCars - humanTeams.length);
  return bots.slice(0, room);
};
