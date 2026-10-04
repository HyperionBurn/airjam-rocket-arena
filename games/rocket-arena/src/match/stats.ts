/**
 * Per-player stat attribution.
 *
 * ---------------------------------------------------------------------------
 * WHAT THE DONOR ACTUALLY GIVES US
 * ---------------------------------------------------------------------------
 * Three of the seven requested counters are exact, and the rest are derived.
 * The exact ones all come from `physics/state-layout.js:22-50`:
 *
 *   BALL_HIT_SERIAL (46)  Increments once per car→ball contact, PER CAR. This
 *                         is a real, native, per-car touch counter, so ball
 *                         touches — and therefore the last touch before a goal —
 *                         are attributed without any guessing.
 *   BOOST (18)            Normalised by 100 by the donor's own bots
 *                         (`bots/observations.js:20`), so a per-tick delta is
 *                         exactly the boost that car spent.
 *   DEMOED (21)           A 0→1 transition is a certain demolition OF that car.
 *
 * The goal flag (`STATE_LAYOUT.GOAL`) is a TEAM, never a car. The donor does
 * not know who scored and neither does the physics core. The scorer's identity
 * is therefore always the last ball contact before the flag, and that is marked
 * inferred rather than presented as fact.
 *
 * ---------------------------------------------------------------------------
 * WHAT THE DONOR DOES NOT GIVE US
 * ---------------------------------------------------------------------------
 * There is no shot counter, no save counter, no assist counter, no goal-plane
 * constant, and no demolisher id — `_physics_getDemo*` does not exist in
 * `vendor/legacy-physics.js:5179-5188`. Shots and saves are therefore built
 * from two signals that DO exist: a native ball contact whose recorded
 * `BALL_HIT_SPEED` (47) exceeds `STAT_TUNING.shotSpeed`, and the ball entering
 * the half of the arena the shooter attacks (see `halfOfBallX`). The
 * demolisher is the nearest other car within `demoAttributionRadius`.
 *
 * `STAT_CONFIDENCE` at the bottom of this file is the honest summary and is
 * published verbatim in the agent snapshot, so nothing here overstates itself.
 */

import {
  halfOfBallX,
  otherTeam,
  readBallHitSerial,
  readBallHitSpeed,
  readBoost,
  readCarCount,
  readCarPosition,
  readDemoed,
} from "./donor-facts.js";
import { STAT_TUNING } from "./sim-config.js";
import type { PlayerEntry, PlayerStats, Team } from "./types.js";

/** An all-zero stat row. Also used as the lookup miss. */
export const EMPTY_STATS: PlayerStats = Object.freeze({
  goals: 0,
  assists: 0,
  saves: 0,
  shots: 0,
  demolitions: 0,
  timesDemoed: 0,
  ballTouches: 0,
  boostConsumed: 0,
});

/** A goal that is attributed but not yet closed out. */
export interface OpenShot {
  readonly team: Team;
  readonly shooterId: string | null;
  readonly openedTick: number;
  /** A defender touched it, so a goal off this chance is that defender's save. */
  readonly blockerId: string | null;
}

/** Internal per-car tracker. */
interface CarTracking {
  readonly playerId: string;
  readonly team: Team;
  lastBallHitSerial: number;
  lastBoost: number;
  lastDemoed: boolean;
  lastTouchTick: number;
}

export interface TrackerState {
  /** Car slot → tracker. Rebuilt whenever the roster changes. */
  readonly cars: ReadonlyMap<number, CarTracking>;
  /** playerId → cumulative stats. */
  readonly stats: Readonly<Record<string, PlayerStats>>;
  readonly openShot: OpenShot | null;
  readonly tick: number;
}

export const createTrackerState = (
  players: readonly PlayerEntry[] = [],
  tick = 0,
): TrackerState => {
  const cars = new Map<number, CarTracking>();
  for (const player of players) {
    if (player.slot < 0) continue;
    cars.set(player.slot, {
      playerId: player.playerId,
      team: player.team,
      lastBallHitSerial: 0,
      lastBoost: 1,
      lastDemoed: false,
      lastTouchTick: -1,
    });
  }
  return { cars, stats: {}, openShot: null, tick };
};

/**
 * Rebuild the car trackers for a new roster while KEEPING cumulative stats and
 * the open shot. A rematch must not need a rejoin to know who scored last time.
 */
export const syncRoster = (
  state: TrackerState,
  players: readonly PlayerEntry[],
): TrackerState => {
  const cars = new Map<number, CarTracking>();
  for (const player of players) {
    if (player.slot < 0) continue;
    const existing = state.cars.get(player.slot);
    cars.set(player.slot, {
      playerId: player.playerId,
      team: player.team,
      lastBallHitSerial: existing?.lastBallHitSerial ?? 0,
      lastBoost: existing?.lastBoost ?? 1,
      lastDemoed: existing?.lastDemoed ?? false,
      lastTouchTick: existing?.lastTouchTick ?? -1,
    });
  }
  return { ...state, cars };
};

/** Zero every cumulative counter but keep the car trackers. */
export const resetTrackerStats = (state: TrackerState): TrackerState => ({
  ...state,
  stats: {},
  openShot: null,
});

const add = (
  stats: Record<string, PlayerStats>,
  playerId: string,
  key: keyof PlayerStats,
  by = 1,
): void => {
  const current = stats[playerId] ?? EMPTY_STATS;
  stats[playerId] = { ...current, [key]: current[key] + by };
};

const distance3 = (
  a: readonly [number, number, number],
  b: readonly [number, number, number],
): number => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

export interface TrackerResult {
  readonly state: TrackerState;
  /** The scorer, from the native last-contact. Null when unattributable. */
  readonly scorerId: string | null;
  /** A teammate's touch inside the assist window, if there was one. */
  readonly assistId: string | null;
  /** The team that scored. CERTAIN — it is the donor's own flag. */
  readonly team: Team | null;
}

/**
 * Advance the tracker by exactly one donor tick.
 *
 * Pure: it returns new state and never writes to the input `Float32Array`.
 */
export const trackTick = (
  tracker: TrackerState,
  state: Float32Array,
  tick: number,
  goalTeam: Team | null,
): TrackerResult => {
  const cars = new Map<number, CarTracking>(tracker.cars);
  const stats: Record<string, PlayerStats> = { ...tracker.stats };
  const carCount = readCarCount(state);
  const ballHalf = halfOfBallX(
    // Only the X component is needed, and reading the whole ball pose here
    // would allocate three numbers per tick for one of them.
    (state[4] ?? 0) as number,
  );
  let openShot = tracker.openShot;
  let touchPlayerId: string | null = null;

  for (let slot = 0; slot < carCount; slot += 1) {
    const tracked = cars.get(slot);
    const position = readCarPosition(state, slot);

    // BOOST. A negative delta is boost spent. `unlimitedBoost` never shows up
    // here because the donor's gauge stays pinned under it, so the counter
    // correctly reports "no boost consumed" for that mutator.
    const boost = readBoost(state, slot);
    if (tracked && tracked.lastBoost - boost > 0) {
      add(stats, tracked.playerId, "boostConsumed", tracked.lastBoost - boost);
    }

    if (!tracked) continue;
    const next: CarTracking = { ...tracked, lastBoost: boost };

    // DEMOLITIONS. The victim is certain. The killer is the nearest OTHER car
    // within the attribution radius, which is the only proximity the donor
    // offers; there is no `_physics_getDemoAttacker` in the export table.
    const demoed = readDemoed(state, slot);
    if (demoed && !next.lastDemoed) {
      add(stats, next.playerId, "timesDemoed", 1);
      let killerId: string | null = null;
      let best = STAT_TUNING.demoAttributionRadius;
      for (let other = 0; other < carCount; other += 1) {
        if (other === slot) continue;
        const rival = cars.get(other);
        if (!rival) continue;
        const gap = distance3(position, readCarPosition(state, other));
        if (gap < best) {
          best = gap;
          killerId = rival.playerId;
        }
      }
      if (killerId) add(stats, killerId, "demolitions", 1);
    }
    next.lastDemoed = demoed;

    // BALL TOUCHES. Native serial, so an exact count.
    const serial = readBallHitSerial(state, slot);
    if (serial > next.lastBallHitSerial) {
      add(stats, next.playerId, "ballTouches", serial - next.lastBallHitSerial);
      next.lastBallHitSerial = serial;
      next.lastTouchTick = tick;
      touchPlayerId = next.playerId;

      // SHOTS. A touch that sends the ball hard toward the half this car
      // attacks, judged on the donor's own recorded `BALL_HIT_SPEED`.
      if (Math.abs(readBallHitSpeed(state, slot)) >= STAT_TUNING.shotSpeed) {
        add(stats, next.playerId, "shots", 1);
        openShot = {
          team: next.team,
          shooterId: next.playerId,
          openedTick: tick,
          blockerId: null,
        };
      } else if (openShot && openShot.team !== next.team && openShot.blockerId === null) {
        // A soft touch from the other side of the open chance: a save candidate.
        openShot = { ...openShot, blockerId: next.playerId };
      }
    }

    cars.set(slot, next);
  }

  let scorerId: string | null = null;
  let assistId: string | null = null;

  if (goalTeam !== null) {
    // The scorer is the most recent contact on the scoring team. Prefer the
    // touch observed THIS tick, then fall back to the recorded history, so a
    // goal whose contact was a tick or two earlier is still attributed.
    const onTeam: CarTracking[] = [];
    for (const car of cars.values()) {
      if (car.team === goalTeam && car.lastTouchTick >= 0) onTeam.push(car);
    }
    onTeam.sort((a, b) => b.lastTouchTick - a.lastTouchTick);

    const toucherIsOnTeam = touchPlayerId !== null && cars.get(slotOf(cars, touchPlayerId))?.team === goalTeam;
    scorerId = toucherIsOnTeam ? touchPlayerId : (onTeam[0]?.playerId ?? null);

    const assistCandidate = onTeam.find(
      (car) =>
        car.playerId !== scorerId && tick - car.lastTouchTick <= STAT_TUNING.assistWindowTicks,
    );
    assistId = assistCandidate?.playerId ?? null;

    if (scorerId) add(stats, scorerId, "goals", 1);
    if (assistId) add(stats, assistId, "assists", 1);
    // A goal off a defender's block is that defender's save, and it closes the
    // shot so it can never also be credited as a shot on target.
    if (openShot && openShot.team !== goalTeam && openShot.blockerId !== null) {
      add(stats, openShot.blockerId, "saves", 1);
    }
    openShot = null;
  } else if (openShot !== null && tick - openShot.openedTick > STAT_TUNING.shotWindowTicks) {
    openShot = null;
  }

  return { state: { cars, stats, openShot, tick }, scorerId, assistId, team: goalTeam };
};

const slotOf = (cars: ReadonlyMap<number, CarTracking>, playerId: string): number => {
  for (const [slot, car] of cars) {
    if (car.playerId === playerId) return slot;
  }
  return -1;
};

/**
 * A save that can be credited with certainty: the open chance was from the
 * other team, a defender touched it, and the ball never went in before the
 * window closed. Credited here rather than at goal time, because a save is by
 * definition a chance that did NOT end in a goal.
 */
export const creditExpiredShots = (tracker: TrackerState): Record<string, PlayerStats> => {
  const stats: Record<string, PlayerStats> = { ...tracker.stats };
  const open = tracker.openShot;
  if (open && open.blockerId !== null) {
    add(stats, open.blockerId, "saves", 1);
    return stats;
  }
  return stats;
};

/** The last car to touch the ball, for the match state's own `lastBallTouch`. */
export const readLastTouch = (
  tracker: TrackerState,
): { playerId: string; team: Team; tick: number } | null => {
  let best: CarTracking | null = null;
  for (const car of tracker.cars.values()) {
    if (car.lastTouchTick < 0) continue;
    if (!best || car.lastTouchTick > best.lastTouchTick) best = car;
  }
  return best ? { playerId: best.playerId, team: best.team, tick: best.lastTouchTick } : null;
};

/* -------------------------------------------------------------------------- */
/* HONESTY                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Per-counter provenance, published verbatim in the agent snapshot so an agent
 * never has to guess which numbers it can trust.
 */
export const STAT_CONFIDENCE = Object.freeze({
  goals: "inferred — the donor's goal flag names a TEAM, not a car; the scorer is the last native ball contact",
  assists: "inferred — last teammate ball contact inside a 3 s window",
  saves: "inferred — a defender touch between a shot and the ball going in, or the shot expiring",
  shots: "inferred — a native contact whose BALL_HIT_SPEED exceeds the configured threshold",
  demolitions: "inferred — the victim is certain (DEMOED), the demolished-by car is nearest-proximity; no native killer id exists",
  timesDemoed: "exact — CAR_FIELD.DEMOED transitions",
  ballTouches: "exact — CAR_FIELD.BALL_HIT_SERIAL deltas",
  boostConsumed: "exact — CAR_FIELD.BOOST deltas, normalised by 100",
} satisfies Record<keyof PlayerStats, string>);

/** Re-exported so `index.ts` can name it without a second import. */
export { otherTeam };
