/**
 * The typed face of the donor's local-match controller
 * (`src/donor/app/local-multiplayer.js`) and the launch step that feeds it.
 *
 * The donor module is the part that knows about Three.js, the WASM sim and the
 * frame loop. This file is the part that knows about Air Jam players: it turns
 * the lobby's roster into a dense car list, seats it in the host runtime, and
 * hands the list to the donor. Nothing here touches rendering.
 */

import type { HostRuntime } from "@/host/runtime";
import type { BotDifficultyId } from "@/airjam/bots/bot-difficulty";
import { createBotDriver, type BotDriver } from "@/host/bot-driver";

export type MatchTeam = 0 | 1;

export interface LocalMatchRosterEntry {
  team: MatchTeam;
  /**
   * Garage car id (fennec, octane-original, challenger, spectre, vesper,
   * amethyst). Optional: the donor picks a default body.
   */
  visual?: string;
  /** Human cars get their own viewport; bot cars are world-only. Default true. */
  human?: boolean;
}

export interface ViewRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LocalMatchHudView {
  index: number;
  /** Physics car index == seat index == Air Jam slot. */
  car: number;
  team: MatchTeam;
  /** CSS pixels, origin top-left. Null until the first frame has laid views out. */
  rect: ViewRect | null;
  ballCam: boolean;
  boost: number;
  boosting: boolean;
  /** Not touching the ground (the phone's air/ground chip). */
  airborne: boolean;
  /** Currently demolished, waiting to respawn. */
  demolished: boolean;
  /** Unreal units per second. */
  speed: number;
  /** The other cars on this view's screen, for floating nameplates (page px). */
  marks: LocalMatchHudMark[];
}

export interface LocalMatchHudMark {
  car: number;
  team: MatchTeam;
  x: number;
  y: number;
  /** World distance from this view's camera, in uu. */
  distance: number;
}

export type MatchPhase = "kickoff" | "playing" | "goal" | "ended";

export interface LocalMatchHud {
  active: boolean;
  phase: MatchPhase;
  countdown: number;
  blueScore: number;
  orangeScore: number;
  remainingSeconds: number;
  overtime: boolean;
  overtimeSeconds: number;
  /** 0 = blue, 1 = orange, null while undecided. */
  winner: MatchTeam | null;
  paused: boolean;
  /** The event tuning this match runs with. */
  tuning: MatchTuning;
  /** Every car in the match, bots included. */
  cars: LocalMatchHudCar[];
  views: LocalMatchHudView[];
}

export interface LocalMatchHudCar {
  car: number;
  team: MatchTeam;
  human: boolean;
  speed: number;
  boost: number;
}

/** Event-mode tuning, the donor-side half of the lobby's `EventTuning`. */
export interface MatchTuning {
  /** `turbo` = unlimited boost. */
  boost: "normal" | "turbo";
  /** `heavy` = the ball gives back only part of its speed after each car touch. */
  ball: "normal" | "heavy";
  /** `fast` = a 1 s kickoff countdown after goals (the first kickoff is always full length). */
  kickoffReset: "fast" | "normal";
  /** `short` = skip the replay after the celebration. */
  goalCelebration: "short" | "full";
}

export type MatchEvent =
  | { type: "hit"; car: number; speed: number }
  | { type: "goal"; team: MatchTeam; scorer: number }
  | { type: "demolished"; car: number }
  | { type: "phase"; phase: MatchPhase; countdown: number; winner: MatchTeam | null };

export interface LocalMatchController {
  readonly active: boolean;
  paused: boolean;
  readonly maxCars: number;
  start(
    roster: ReadonlyArray<LocalMatchRosterEntry>,
    options?: { matchSeconds?: number; tuning?: Partial<MatchTuning> },
  ): Promise<{ cars: number; views: number }>;
  stop(): Promise<void>;
  hud(): LocalMatchHud;
  setBallCam(car: number, enabled: boolean): void;
  toggleBallCam(car: number): boolean | null;
  resetKickoff(): void;
  /** Subscribe to match events. Returns the unsubscribe function. */
  onEvent(listener: (event: MatchEvent) => void): () => void;
  /** Give a car its own viewport (a late joiner taking a bot's car). */
  addHumanView(car: number): boolean;
  /** Take a car's viewport away (its player left). The last view is never removed. */
  removeHumanView(car: number): boolean;
  /** Attach (or clear with null) the driver for the match's bot cars. The caller owns it. */
  setBotDriver(driver: Pick<BotDriver, "tick" | "controls"> | null): void;
  /** Display names per car index, used by the goal banner. Optional for test doubles. */
  setCarNames?(names: ReadonlyArray<string>): void;
  /** DEV ONLY: put the ball somewhere, native units (Z up). No-op in production builds. */
  debugPlaceBall(pos: [number, number, number], vel?: [number, number, number]): boolean;
}

export interface LobbySeat {
  playerId: string;
  team: MatchTeam;
  /** The player's garage choice, or null/undefined for the default. */
  carId?: string | null;
}

export interface LaunchResult {
  cars: number;
  views: number;
  /** playerId per car index, in car order (humans first; bots are not listed). */
  seats: string[];
  /** The bot driver, if the match has bot cars. Stop it when the match ends. */
  bots: BotDriver | null;
  /** Bot cars in the match (their teams, in car order). */
  botTeams: MatchTeam[];
  /** Team of EVERY car, in car order (humans first, then bots). */
  teams: MatchTeam[];
}

export interface LaunchOptions {
  matchSeconds?: number;
  tuning?: Partial<MatchTuning>;
  /** Teams of the bot cars to add after the humans. */
  botTeams?: ReadonlyArray<MatchTeam>;
  botDifficulty?: BotDifficultyId;
  /** Garage car for the bot cars. */
  botVisual?: string;
  /** How well scripted bots play. */
  botSkill?: "rookie" | "pro" | "ace";
}

/**
 * Seat the lobby roster densely (seat i → slot i → car i) and start the match.
 *
 * The seam asks the host runtime about a car by its slot number, and the donor
 * numbers cars by roster position, so the two only line up if slots are dense.
 * `reseat` guarantees that; a seat the registry refuses (more than the arena
 * holds) is dropped rather than leaving a hole.
 */
export const launchLocalMatch = async (
  runtime: Pick<HostRuntime, "reseat">,
  controller: LocalMatchController,
  seats: ReadonlyArray<LobbySeat>,
  options: LaunchOptions = {},
): Promise<LaunchResult> => {
  const wanted = seats.slice(0, controller.maxCars);
  const slots = runtime.reseat(wanted);
  const seated = wanted.filter((_, index) => slots[index] !== null);
  if (seated.length === 0) throw new Error("No player could be seated in the arena");

  // Bots sit after the humans, so car index == slot holds for both.
  const botTeams = (options.botTeams ?? []).slice(0, Math.max(0, controller.maxCars - seated.length));
  const totalCars = seated.length + botTeams.length;
  const botCars = botTeams.map((team, index) => ({ slot: seated.length + index, team }));

  const driver =
    botCars.length > 0
      ? await createBotDriver({
          bots: botCars,
          totalCars,
          difficulty: options.botDifficulty ?? "seer",
          skill: options.botSkill,
        })
      : null;

  try {
    const result = await controller.start(
      [
        ...seated.map((seat) => ({ team: seat.team, ...(seat.carId ? { visual: seat.carId } : {}) })),
        ...botTeams.map((team) => ({
          team,
          human: false,
          ...(options.botVisual ? { visual: options.botVisual } : {}),
        })),
      ],
      { matchSeconds: options.matchSeconds, tuning: options.tuning },
    );
    controller.setBotDriver(driver);
    return {
      ...result,
      seats: seated.map((seat) => seat.playerId),
      bots: driver,
      botTeams: [...botTeams],
      teams: [...seated.map((seat) => seat.team), ...botTeams],
    };
  } catch (error) {
    driver?.stop();
    throw error;
  }
};
