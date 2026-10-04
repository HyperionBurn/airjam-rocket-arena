/**
 * Which phone should buzz, and how, for each thing that happens on the pitch.
 *
 * Pure planning: it maps a match event to `{ playerId, pattern }` pairs and the
 * director sends them as Air Jam HAPTIC signals. The patterns are the SDK's own
 * (`light | medium | heavy | success | failure`), which the controller turns into
 * `navigator.vibrate` sequences.
 *
 * Restraint matters more than coverage: a phone that buzzes on every touch of
 * the ball is noise, so ball touches are rate-limited per player and only the
 * player who touched the ball feels it.
 */
import type { MatchEvent } from "@/host/local-match";

export type HapticPattern = "light" | "medium" | "heavy" | "success" | "failure";

export interface HapticCommand {
  playerId: string;
  pattern: HapticPattern;
}

export interface SeatMap {
  /** playerId by car index; null for a bot car. */
  players: ReadonlyArray<string | null>;
  /** Team by car index. */
  teams: ReadonlyArray<0 | 1>;
}

/** A touch harder than this is a "medium" thump instead of a "light" tap (uu/s). */
const HARD_HIT_SPEED = 1800;
/** Minimum gap between ball-touch buzzes for one phone. */
export const HIT_HAPTIC_INTERVAL_MS = 220;

export interface HapticPlanner {
  plan(event: MatchEvent, now: number): HapticCommand[];
  /** The kickoff countdown just ended and the ball is live. */
  go(): HapticCommand[];
}

export const createHapticPlanner = (seats: () => SeatMap): HapticPlanner => {
  const lastHit = new Map<string, number>();

  const everyone = (pattern: HapticPattern, only?: (car: number) => boolean): HapticCommand[] => {
    const { players } = seats();
    const commands: HapticCommand[] = [];
    players.forEach((playerId, car) => {
      if (playerId && (!only || only(car))) commands.push({ playerId, pattern });
    });
    return commands;
  };

  return {
    plan(event, now) {
      const { players, teams } = seats();
      switch (event.type) {
        case "hit": {
          const playerId = players[event.car];
          if (!playerId) return [];
          const last = lastHit.get(playerId) ?? Number.NEGATIVE_INFINITY;
          if (now - last < HIT_HAPTIC_INTERVAL_MS) return [];
          lastHit.set(playerId, now);
          return [{ playerId, pattern: event.speed >= HARD_HIT_SPEED ? "medium" : "light" }];
        }
        case "goal": {
          const commands: HapticCommand[] = [];
          players.forEach((playerId, car) => {
            if (!playerId) return;
            if (car === event.scorer) commands.push({ playerId, pattern: "heavy" });
            else commands.push({ playerId, pattern: teams[car] === event.team ? "success" : "failure" });
          });
          return commands;
        }
        case "demolished": {
          const playerId = players[event.car];
          return playerId ? [{ playerId, pattern: "failure" }] : [];
        }
        case "phase": {
          if (event.phase === "ended") {
            return everyone("success", (car) => event.winner !== null && teams[car] === event.winner).concat(
              everyone("light", (car) => event.winner === null || teams[car] !== event.winner),
            );
          }
          return [];
        }
      }
    },
    go: () => everyone("medium"),
  };
};
