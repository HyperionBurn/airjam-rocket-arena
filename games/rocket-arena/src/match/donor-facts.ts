/**
 * Donor facts the match layer needs, restated as data.
 *
 * Every number here was read out of the READ-ONLY donor tree
 * (`src/donor/**`, byte-identical, never edited) and MUST NOT be "corrected"
 * without re-reading the cited line. The donor files are minified and untyped,
 * and they are NOT imported — not even as types — so the match core stays
 * DOM-free, Three-free, WASM-free and unit-testable.
 *
 * Sources cited in this file:
 *  - `physics/state-layout.js:12`     — `STATE_LAYOUT` header field indices.
 *  - `physics/state-layout.js:14`     — `CAR_STATE_STRIDE`.
 *  - `physics/state-layout.js:22-50`  — `CAR_STATE` field offsets inside a block.
 *  - `online/prediction.js:78`        — `_physics_setBallState` consumes 18 floats.
 *  - `physics/simulation.js:196-203`  — the `BALL_HIT_SERIAL`-backed goal poll.
 *  - `bots/observations.js:20`        — `CAR_STATE.BOOST / 100` ⇒ boost is 0..100.
 *  - `match/session.js:3-9`           — the donor's own match timing, in ticks.
 */

/* -------------------------------------------------------------------------- */
/* Fixed step                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * `src/online/protocol.js:6` — the sim is fixed-step and MUST stay this rate.
 * The donor's whole match machine is denominated in these ticks, not seconds
 * (`match/session.js:3` names it `Is`), so the port keeps tick as the unit and
 * never converts to wall-clock time anywhere in the reducer.
 */
export const SIM_HZ = 120;

/* -------------------------------------------------------------------------- */
/* Donor match timing, verbatim (match/session.js:3-9)                          */
/* -------------------------------------------------------------------------- */

/** `Is`. Ticks per second. */
export const TICKS_PER_SECOND = SIM_HZ;

/** `am` — a full regulation match, in ticks (5 * 60 * 120 = 36 000). */
export const REGULATION_TICKS = 5 * 60 * TICKS_PER_SECOND;

/** `om` — the kickoff countdown, in ticks (3 * 120 = 360). */
export const COUNTDOWN_TICKS = 3 * TICKS_PER_SECOND;

/** `zM` — the goal / replay hold, in ticks (3 * 120 = 360). */
export const GOAL_TICKS = 3 * TICKS_PER_SECOND;

/* -------------------------------------------------------------------------- */
/* State layout (physics/state-layout.js)                                       */
/* -------------------------------------------------------------------------- */

/** Header field indices inside `sim.state`. */
export const STATE_HEADER = Object.freeze({
  TICK: 0,
  GOAL: 1,
  NUM_CARS: 2,
  NUM_PADS: 3,
  BALL: 4,
  CARS: 22,
} as const);

/** Floats per car block. */
export const CAR_STATE_STRIDE = 51;

/**
 * Field offsets WITHIN one car block. Only the fields this port actually reads
 * are restated; the rest of the donor's `CAR_STATE` is deliberately not copied
 * so a rename in the donor cannot silently half-apply here.
 */
export const CAR_FIELD = Object.freeze({
  POS: 0,
  VEL: 12,
  BOOST: 18,
  ON_GROUND: 19,
  DEMOED: 21,
  IS_BOOSTING: 23,
  /** Native per-car ball-contact serial. Increments on every car→ball touch. */
  BALL_HIT_SERIAL: 46,
  /** Impact speed recorded with the contact that bumped `BALL_HIT_SERIAL`. */
  BALL_HIT_SPEED: 47,
} as const);

/**
 * The ball block uses the SAME field layout as a car block, which is why
 * `online/prediction.js:78` can restore `state.subarray(BALL, BALL + 18)`
 * straight into `_physics_setBallState`.
 */
export const BALL_FIELD = Object.freeze({
  POS: 0,
  VEL: 12,
} as const);

/** `_physics_setBallState` reads exactly 18 floats (`prediction.js:78`). */
export const BALL_STATE_FLOATS = 18;

/** `_physics_setCarState` consumes 24 floats (`prediction.js:82-88`). */
export const CAR_POSE_FLOATS = 24;

/* -------------------------------------------------------------------------- */
/* Field readers                                                                 */
/* -------------------------------------------------------------------------- */

/** First float index of a car's block: `CARS + slot * STRIDE`. */
export const carBase = (slot: number): number =>
  STATE_HEADER.CARS + slot * CAR_STATE_STRIDE;

const readAt = (state: Float32Array, at: number): number => {
  const value = state[at];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
};

/** World position of a car as `[x, y, z]`; `[0,0,0]` for a slot that has none. */
export const readCarPosition = (state: Float32Array, slot: number): [number, number, number] => {
  const base = carBase(slot);
  return [readAt(state, base + CAR_FIELD.POS), readAt(state, base + CAR_FIELD.POS + 1), readAt(state, base + CAR_FIELD.POS + 2)];
};

/** World position of the ball. */
export const readBallPosition = (state: Float32Array): [number, number, number] => {
  const base = STATE_HEADER.BALL;
  return [readAt(state, base + BALL_FIELD.POS), readAt(state, base + BALL_FIELD.POS + 1), readAt(state, base + BALL_FIELD.POS + 2)];
};

/** Ball velocity as `[x, y, z]`. */
export const readBallVelocity = (state: Float32Array): [number, number, number] => {
  const base = STATE_HEADER.BALL;
  return [readAt(state, base + BALL_FIELD.VEL), readAt(state, base + BALL_FIELD.VEL + 1), readAt(state, base + BALL_FIELD.VEL + 2)];
};

/** Remaining boost, normalised to 0..1. The donor's own bots divide by 100. */
export const readBoost = (state: Float32Array, slot: number): number =>
  Math.max(0, Math.min(1, readAt(state, carBase(slot) + CAR_FIELD.BOOST) / 100));

export const readOnGround = (state: Float32Array, slot: number): boolean =>
  readAt(state, carBase(slot) + CAR_FIELD.ON_GROUND) === 1;

export const readDemoed = (state: Float32Array, slot: number): boolean =>
  readAt(state, carBase(slot) + CAR_FIELD.DEMOED) === 1;

/** The native ball-contact serial for one car. See `CAR_FIELD.BALL_HIT_SERIAL`. */
export const readBallHitSerial = (state: Float32Array, slot: number): number =>
  readAt(state, carBase(slot) + CAR_FIELD.BALL_HIT_SERIAL);

/**
 * The impact speed the donor recorded WITH that contact. The donor's own
 * prediction layer writes the pair together, so the two fields are always
 * consistent and this is the shot detector's only ground truth.
 */
export const readBallHitSpeed = (state: Float32Array, slot: number): number =>
  readAt(state, carBase(slot) + CAR_FIELD.BALL_HIT_SPEED);

/** The native goal flag. `0` = none, `1` = team 0, `2` = team 1. */
export const readGoalFlag = (state: Float32Array): 0 | 1 | 2 => {
  const value = readAt(state, STATE_HEADER.GOAL);
  return value === 1 || value === 2 ? value : 0;
};

/** The donor's own car counter. `physics/simulation.js:19` uses this bound. */
export const readCarCount = (state: Float32Array, limit = 8): number => {
  const declared = Math.floor(readAt(state, STATE_HEADER.NUM_CARS));
  return declared > 0 && declared <= limit ? declared : 0;
};

/* -------------------------------------------------------------------------- */
/* Arena orientation                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Team ids, matching the donor's own numbering: `match/session.js:77` reads the
 * goal flag `1` as team 0 and `2` as team 1, and `startup.js:757` maps
 * `scoredGoal === 1` to team 0.
 */
export type Team = 0 | 1;

/** Display names. The donor HUD calls these BLUE / ORANGE. */
export const TEAM_LABEL: Readonly<Record<Team, string>> = Object.freeze({
  0: "BLUE",
  1: "ORANGE",
});

/** The other team. */
export const otherTeam = (team: Team): Team => (team === 0 ? 1 : 0);

/**
 * Which half of the arena the ball is in, as a team id: the half team 0 ATTACKS
 * is team 1's half and vice-versa.
 *
 * The sign is taken from the donor itself, not guessed: `src/airjam/slots/
 * kickoff.ts:207-209` records that team 0's cars sit on the negative-X half
 * facing +X, and `startup.js:757` maps a goal flag of `1` (team 0) to the
 * positive-X end. So team 0 attacks +X.
 *
 * NOTE the donor exposes NO goal-plane constant — there is no
 * `_physics_getGoalX` and no arena half-length in the WASM export table. That
 * is why the stat tracker reasons about HALVES and never about a goal line;
 * see `stats.ts`.
 */
export const halfOfBallX = (ballX: number): Team => (ballX > 0 ? 1 : 0);

/** +1 when `team` attacks the +X end, -1 when it attacks the -X end. */
export const attackSignFor = (team: Team): 1 | -1 => (team === 0 ? 1 : -1);
