/**
 * Stat attribution, and an honest check of what it cannot know.
 *
 * The three EXACT counters come from the donor's own state fields, so those are
 * asserted against a hand-built `Float32Array` laid out exactly as
 * `physics/state-layout.js` describes. The inferred ones are asserted to be
 * attributed SOMETHING plausible, never asserted to be correct — because they
 * are not, and a test that pretended otherwise would be the actual bug.
 */

import { describe, expect, it } from "vitest";
import {
  CAR_FIELD,
  CAR_STATE_STRIDE,
  STATE_HEADER,
  readBallHitSerial,
  readBallHitSpeed,
  readBoost,
} from "../donor-facts.js";
import { EMPTY_STATS, STAT_CONFIDENCE, createTrackerState, trackTick } from "../stats.js";
import { STAT_TUNING } from "../sim-config.js";
import { COUNTDOWN_TICKS, REGULATION_TICKS } from "../donor-facts.js";
import { createMatchCore } from "../core.js";
import type { PlayerEntry } from "../types.js";

const ROSTER: readonly PlayerEntry[] = [
  { playerId: "c1", name: "A", team: 0, slot: 0, isBot: false, ready: true },
  { playerId: "c2", name: "B", team: 1, slot: 1, isBot: false, ready: true },
  { playerId: "c3", name: "C", team: 0, slot: 2, isBot: false, ready: true },
];

const CAR_FLOATS = CAR_STATE_STRIDE * 4;

/** A state block with the right header and three live cars. */
const makeState = (cars = 3): Float32Array => {
  const state = new Float32Array(STATE_HEADER.CARS + CAR_STATE_STRIDE * 4);
  state[STATE_HEADER.NUM_CARS] = cars;
  for (let slot = 0; slot < cars; slot += 1) {
    const base = STATE_HEADER.CARS + slot * CAR_STATE_STRIDE;
    state[base + CAR_FIELD.POS] = 100 * (slot + 1);
    state[base + CAR_FIELD.BOOST] = 100;
  }
  return state;
};

const carIndex = (slot: number, field: number): number =>
  STATE_HEADER.CARS + slot * CAR_STATE_STRIDE + field;

const carAt = (state: Float32Array, slot: number, field: number): number => state[carIndex(slot, field)];

/** Write one field inside a car's block, the way the donor writes it. */
const setCar = (state: Float32Array, slot: number, field: number, value: number): void => {
  state[carIndex(slot, field)] = value;
};

/* -------------------------------------------------------------------------- */
/* Exact counters                                                               */
/* -------------------------------------------------------------------------- */

describe("exact counters", () => {
  it("counts ball touches from the native serial, per car", () => {
    const state = makeState();
    let tracker = createTrackerState(ROSTER);

    setCar(state, 0, CAR_FIELD.BALL_HIT_SERIAL, 1);
    tracker = trackTick(tracker, state, 10, null).state;
    expect(tracker.stats.c1?.ballTouches).toBe(1);

    // The serial jumps: that is TWO more touches, not one.
    setCar(state, 0, CAR_FIELD.BALL_HIT_SERIAL, 3);
    setCar(state, 1, CAR_FIELD.BALL_HIT_SERIAL, 1);
    const result = trackTick(tracker, state, 20, null);
    expect(result.state.stats.c1?.ballTouches).toBe(3);
    expect(result.state.stats.c2?.ballTouches).toBe(1);
  });

  it("sums boost consumed from the BOOST delta, normalised by 100", () => {
    const state = makeState();
    let tracker = createTrackerState(ROSTER);
    // Start at a full tank, which the tracker seeds as 1.
    setCar(state, 0, CAR_FIELD.BOOST, 100);
    trackTick(tracker, state, 1, null);
    tracker = createTrackerState(ROSTER);
    tracker = trackTick(tracker, state, 1, null).state;
    expect(tracker.stats.c1).toBeUndefined();

    setCar(state, 0, CAR_FIELD.BOOST, 70);
    tracker = trackTick(tracker, state, 2, null).state;
    expect(tracker.stats.c1?.boostConsumed).toBeCloseTo(0.3, 5);

    setCar(state, 0, CAR_FIELD.BOOST, 40);
    tracker = trackTick(tracker, state, 3, null).state;
    expect(tracker.stats.c1?.boostConsumed).toBeCloseTo(0.6, 5);
  });

  it("counts times demolished from the DEMOED transition, and the victim is certain", () => {
    const state = makeState();
    let tracker = createTrackerState(ROSTER);
    setCar(state, 1, CAR_FIELD.DEMOED, 1);
    tracker = trackTick(tracker, state, 5, null).state;
    expect(tracker.stats.c2?.timesDemoed).toBe(1);

    // Staying demolished is not a second demolition.
    tracker = trackTick(tracker, state, 6, null).state;
    expect(tracker.stats.c2?.timesDemoed).toBe(1);

    // Respawning then being demolished again IS.
    setCar(state, 1, CAR_FIELD.DEMOED, 0);
    tracker = trackTick(tracker, state, 7, null).state;
    setCar(state, 1, CAR_FIELD.DEMOED, 1);
    tracker = trackTick(tracker, state, 8, null).state;
    expect(tracker.stats.c2?.timesDemoed).toBe(2);
  });

  it("attributes a demolition to the nearest car, and to nobody when nobody is close", () => {
    const near = makeState();
    // Slot 0 at x=100, slot 1 at x=200: 100 uu apart, inside the radius.
    setCar(near, 1, CAR_FIELD.DEMOED, 1);
    const withKiller = trackTick(createTrackerState(ROSTER), near, 1, null).state;
    expect(withKiller.stats.c1?.demolitions).toBe(1);

    // Push them 10 000 uu apart, well outside the attribution radius.
    const far = makeState();
    setCar(far, 0, CAR_FIELD.POS, -5000);
    setCar(far, 1, CAR_FIELD.POS, 5000);
    setCar(far, 2, CAR_FIELD.POS, 9000);
    setCar(far, 1, CAR_FIELD.DEMOED, 1);
    const withoutKiller = trackTick(createTrackerState(ROSTER), far, 1, null).state;
    expect(withoutKiller.stats.c1?.demolitions).toBeUndefined();
    expect(withoutKiller.stats.c2?.timesDemoed).toBe(1);
  });
});

/* -------------------------------------------------------------------------- */
/* Inferred counters                                                            */
/* -------------------------------------------------------------------------- */

describe("inferred counters", () => {
  it("attributes a goal to the last native ball contact on the scoring team", () => {
    const state = makeState();
    setCar(state, 0, CAR_FIELD.BALL_HIT_SERIAL, 1); // c1 (team 0) touched it
    const first = trackTick(createTrackerState(ROSTER), state, 100, null);

    // The very next tick team 0 is awarded the goal.
    const goal = trackTick(first.state, state, 101, 0);
    expect(goal.team).toBe(0);
    expect(goal.scorerId).toBe("c1");
    expect(goal.state.stats.c1?.goals).toBe(1);
  });

  it("credits an assist to the most recent teammate touch inside the window", () => {
    const state = makeState();
    setCar(state, 2, CAR_FIELD.BALL_HIT_SERIAL, 1); // c3 (slot 2, team 0) sets it up
    let tracker = trackTick(createTrackerState(ROSTER), state, 100, null).state;

    // c1 (slot 0, team 0) then finishes it. The serial has to MOVE, because the
    // tracker only records a touch when the native serial increases.
    setCar(state, 0, CAR_FIELD.BALL_HIT_SERIAL, 1);
    tracker = trackTick(tracker, state, 110, null).state;

    const goal = trackTick(tracker, state, 111, 0);
    expect(goal.scorerId).toBe("c1");
    expect(goal.assistId).toBe("c3");
    expect(goal.state.stats.c1?.goals).toBe(1);
    expect(goal.state.stats.c3?.assists).toBe(1);
  });

  it("gives NO assist when the teammate's touch is outside the window", () => {
    const state = makeState();
    setCar(state, 2, CAR_FIELD.BALL_HIT_SERIAL, 1);
    let tracker = trackTick(createTrackerState(ROSTER), state, 100, null).state;

    setCar(state, 0, CAR_FIELD.BALL_HIT_SERIAL, 1);
    const late = 100 + STAT_TUNING.assistWindowTicks + 10;
    tracker = trackTick(tracker, state, late, null).state;
    // c2 (team 1) also touched, but on the other team.
    setCar(state, 1, CAR_FIELD.BALL_HIT_SERIAL, 1);
    tracker = trackTick(tracker, state, late + 1, null).state;

    const goal = trackTick(tracker, state, late + 2, 0);
    expect(goal.scorerId).toBe("c1");
    expect(goal.assistId).toBeNull();
  });

  it("counts a shot only when the donor's own BALL_HIT_SPEED clears the threshold", () => {
    const state = makeState();
    setCar(state, 0, CAR_FIELD.BALL_HIT_SERIAL, 1);
    setCar(state, 0, CAR_FIELD.BALL_HIT_SPEED, STAT_TUNING.shotSpeed - 1);
    const soft = trackTick(createTrackerState(ROSTER), state, 1, null).state;
    // The touch is still counted exactly; only the SHOT is withheld.
    expect(soft.stats.c1?.ballTouches).toBe(1);
    expect(soft.stats.c1?.shots).toBe(0);

    setCar(state, 0, CAR_FIELD.BALL_HIT_SERIAL, 2);
    setCar(state, 0, CAR_FIELD.BALL_HIT_SPEED, STAT_TUNING.shotSpeed + 100);
    const hard = trackTick(soft, state, 2, null).state;
    expect(hard.stats.c1?.shots).toBe(1);
  });

  it("is silent about every counter when there is no sim attached at all", () => {
    // The headless path an agent uses: no Float32Array, so no attribution, but
    // the clock, the phases and the score must all still work.
    const core = createMatchCore({ players: ROSTER });
    core.startMatch();
    // kickoff (1) + countdown (COUNTDOWN_TICKS) + 10 ticks of actual play.
    core.advance(1 + COUNTDOWN_TICKS + 10, { goal: 0, ballOnGround: false, kickoffTouched: true });

    expect(core.getState().phase).toBe("playing");
    expect(core.getState().clock.remainingTicks).toBeLessThan(REGULATION_TICKS);
    expect(core.getState().clock.started).toBe(true);
    expect(core.getState().stats).toEqual({});
    expect(core.getState().lastBallTouch).toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/* Honesty                                                                      */
/* -------------------------------------------------------------------------- */

describe("confidence labelling", () => {
  it("labels every counter, and says exact only where the donor is exact", () => {
    const keys = Object.keys(EMPTY_STATS) as Array<keyof typeof EMPTY_STATS>;
    for (const key of keys) {
      expect(STAT_CONFIDENCE[key]).toBeTruthy();
    }
    expect(STAT_CONFIDENCE.ballTouches.startsWith("exact")).toBe(true);
    expect(STAT_CONFIDENCE.boostConsumed.startsWith("exact")).toBe(true);
    expect(STAT_CONFIDENCE.timesDemoed.startsWith("exact")).toBe(true);
    expect(STAT_CONFIDENCE.goals.startsWith("inferred")).toBe(true);
    expect(STAT_CONFIDENCE.saves.startsWith("inferred")).toBe(true);
    expect(STAT_CONFIDENCE.shots.startsWith("inferred")).toBe(true);
    expect(STAT_CONFIDENCE.demolitions.startsWith("inferred")).toBe(true);
    expect(STAT_CONFIDENCE.assists.startsWith("inferred")).toBe(true);
  });

  it("the layout it reads matches the donor's own offsets", () => {
    const state = makeState();
    state[STATE_HEADER.CARS + 2 * CAR_STATE_STRIDE + CAR_FIELD.BALL_HIT_SERIAL] = 12;
    expect(readBallHitSerial(state, 2)).toBe(12);
    state[STATE_HEADER.CARS + 2 * CAR_STATE_STRIDE + CAR_FIELD.BALL_HIT_SPEED] = 1234;
    expect(readBallHitSpeed(state, 2)).toBe(1234);
    state[STATE_HEADER.CARS + 2 * CAR_STATE_STRIDE + CAR_FIELD.BOOST] = 55;
    expect(readBoost(state, 2)).toBeCloseTo(0.55, 5);
  });
});
