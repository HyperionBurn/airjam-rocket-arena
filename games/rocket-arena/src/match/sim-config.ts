/**
 * THE simulation config. One object, one registry, one reader.
 *
 * ---------------------------------------------------------------------------
 * THE RULE
 * ---------------------------------------------------------------------------
 * Every mutator is a frozen `SimConfig` value in `MUTATOR_REGISTRY` below.
 * There is exactly ONE reader of that config in the whole port:
 * `./controls.ts` (`shapeControls`) and `./sim-bridge.ts`
 * (`applySimConfigToDonor`). Every other module — the machine, the store, the
 * overlay, the agent contract — passes the config around or names an id; none of
 * them ever asks "which mutator is this?" and none of them branch on the id.
 *
 * Concretely: `grep -n "=== \"LOW_GRAVITY\"\|case \"LOW_GRAVITY\""` finds
 * nothing outside this file, and `machine.test.ts` asserts the config is read
 * by field, not by id.
 *
 * ---------------------------------------------------------------------------
 * HOW A MUTATOR REACHES THE DONOR
 * ---------------------------------------------------------------------------
 * The WASM export table is small. Reading `physics/simulation.js:172-208` and
 * `vendor/legacy-physics.js:5179-5188`, the mutable native surface is:
 *
 *  - `_physics_setUnlimitedBoost(on)`   → `unlimitedBoost`
 *  - `_physics_setBallState(ptr)`       → `ballState` (18 floats, the whole ball)
 *  - `_physics_setCarState(slot, ptr)` → `carState` (24 floats, one pose)
 *  - `_physics_goalExplosion()`         → one-shot, not a setting
 *
 * Everything else that makes a mutator FEEL different (gravity, top speed,
 * boost burn, jump height, bounciness) has NO native setter. Those are applied
 * the only honest way available without editing the donor: by shaping the
 * 8-float control vector the seam already writes. `shapeControls` does that,
 * again driven only by config fields.
 */

import type { Team } from "./types.js";

/** Every mutator this port ships. */
export const MUTATOR_IDS = [
  "NORMAL",
  "INFINITE_BOOST",
  "LOW_GRAVITY",
  "HEAVY_BALL",
  "LIGHT_BALL",
  "GIANT_BALL",
  "SUPER_SPEED",
  "BOOMER_BALL",
  "DEMOLITION_MADNESS",
] as const;

export type MutatorId = (typeof MUTATOR_IDS)[number];

/** Human label for a mutator, for the lobby picker and the agent snapshot. */
export const MUTATOR_LABEL: Readonly<Record<MutatorId, string>> = Object.freeze({
  NORMAL: "Normal",
  INFINITE_BOOST: "Infinite Boost",
  LOW_GRAVITY: "Low Gravity",
  HEAVY_BALL: "Heavy Ball",
  LIGHT_BALL: "Light Ball",
  GIANT_BALL: "Giant Ball",
  SUPER_SPEED: "Super Speed",
  BOOMER_BALL: "Boomer Ball",
  DEMOLITION_MADNESS: "Demolition Madness",
});

/** One-line description per mutator, used verbatim in the agent snapshot. */
export const MUTATOR_DESCRIPTION: Readonly<Record<MutatorId, string>> = Object.freeze({
  NORMAL: "Stock Rocket Arena physics with no changes.",
  INFINITE_BOOST: "Boost never runs out (native _physics_setUnlimitedBoost).",
  LOW_GRAVITY: "Cars hold altitude far longer and fall more slowly.",
  HEAVY_BALL: "The ball is bigger in play and much harder to push.",
  LIGHT_BALL: "The ball is smaller and skids further per touch.",
  GIANT_BALL: "The ball's collision radius is multiplied; shots need real aim.",
  SUPER_SPEED: "Cars accelerate and top out far faster than stock.",
  BOOMER_BALL: "The ball rebounds off cars and walls at a much higher restitution.",
  DEMOLITION_MADNESS: "Cars are fragile: contact at speed can send them flying.",
});

/**
 * The one configuration object the simulation reads.
 *
 * Every field is a NUMBER or a BOOLEAN, never an id. That is deliberate: it
 * makes it impossible for a reader to special-case a mutator, because there is
 * nothing to compare against. Adding a mutator means adding a row below, never
 * adding a branch somewhere else.
 */
export interface SimConfig {
  readonly id: MutatorId;
  readonly label: string;
  readonly description: string;

  /* ---- native setters ---------------------------------------------------- */
  /** `_physics_setUnlimitedBoost(1)`. */
  readonly unlimitedBoost: boolean;
  /**
   * Multiplier on the ball's collision radius, applied by rewriting the ball's
   * own 18-float block through `_physics_setBallState`. 1 = stock.
   */
  readonly ballRadiusScale: number;
  /**
   * Multiplier on the ball's linear velocity, written straight into the ball
   * block. 1 = stock. `BOOMER_BALL` uses this; it is the only way to change
   * restitution from outside the donor.
   */
  readonly ballVelocityScale: number;
  /** Extra ball mass, expressed as a control-shaping bias. 1 = stock. */
  readonly ballMassScale: number;

  /* ---- control-shaping fields (no native setter exists) ------------------ */
  /**
   * How strongly the machine over-drives `throttle` to reach top speed.
   * 1 = stock, >1 = faster, <1 = slower. Clamped to 1 on the way out because
   * the bridge itself only accepts [-1, 1] (`seam.ts:136-143`).
   */
  readonly driveScale: number;
  /**
   * Steering gain. >1 makes the car rotate faster; it never changes the sign,
   * so a mutator can never invert a player's steering.
   */
  readonly steerScale: number;
  /**
   * Vertical control bias, applied as a pitch nudge while airborne. Negative
   * values fight gravity. This is what `LOW_GRAVITY` reads.
   */
  readonly gravityBias: number;
  /** Boost drain multiplier. 0 means boost is free; 1 = stock burn. */
  readonly boostDrainScale: number;
  /** Jump/air-flip impulse multiplier. 1 = stock. */
  readonly jumpScale: number;
  /**
   * How far a car is shoved by a rival at speed. 0 = stock. Only
   * `DEMOLITION_MADNESS` uses it, and it is applied as a kick to the pitch axis.
   */
  readonly contactImpulse: number;
}

/** Frozen so a caller cannot mutate a live match's physics by accident. */
const config = (value: SimConfig): SimConfig => Object.freeze(value);

const base: SimConfig = config({
  id: "NORMAL",
  label: MUTATOR_LABEL.NORMAL,
  description: MUTATOR_DESCRIPTION.NORMAL,
  unlimitedBoost: false,
  ballRadiusScale: 1,
  ballVelocityScale: 1,
  ballMassScale: 1,
  driveScale: 1,
  steerScale: 1,
  gravityBias: 0,
  boostDrainScale: 1,
  jumpScale: 1,
  contactImpulse: 0,
});

/**
 * THE registry. One row per mutator, every field explicit, no inheritance and
 * no merging — a reader never has to reason about which layers applied.
 */
export const MUTATOR_REGISTRY: Readonly<Record<MutatorId, SimConfig>> = Object.freeze({
  NORMAL: base,

  INFINITE_BOOST: config({
    ...base,
    id: "INFINITE_BOOST",
    label: MUTATOR_LABEL.INFINITE_BOOST,
    description: MUTATOR_DESCRIPTION.INFINITE_BOOST,
    unlimitedBoost: true,
  }),

  LOW_GRAVITY: config({
    ...base,
    id: "LOW_GRAVITY",
    label: MUTATOR_LABEL.LOW_GRAVITY,
    description: MUTATOR_DESCRIPTION.LOW_GRAVITY,
    // Cars hold a nose-up bias while airborne, which reads as weak gravity and
    // also makes a car able to reach the ball high in the air.
    gravityBias: 0.55,
    jumpScale: 1.35,
  }),

  HEAVY_BALL: config({
    ...base,
    id: "HEAVY_BALL",
    label: MUTATOR_LABEL.HEAVY_BALL,
    description: MUTATOR_DESCRIPTION.HEAVY_BALL,
    ballRadiusScale: 1.15,
    ballMassScale: 2.4,
    ballVelocityScale: 0.72,
  }),

  LIGHT_BALL: config({
    ...base,
    id: "LIGHT_BALL",
    label: MUTATOR_LABEL.LIGHT_BALL,
    description: MUTATOR_DESCRIPTION.LIGHT_BALL,
    ballRadiusScale: 0.72,
    ballMassScale: 0.45,
    ballVelocityScale: 1.3,
  }),

  GIANT_BALL: config({
    ...base,
    id: "GIANT_BALL",
    label: MUTATOR_LABEL.GIANT_BALL,
    description: MUTATOR_DESCRIPTION.GIANT_BALL,
    ballRadiusScale: 2.1,
    ballMassScale: 3.2,
    ballVelocityScale: 0.85,
  }),

  SUPER_SPEED: config({
    ...base,
    id: "SUPER_SPEED",
    label: MUTATOR_LABEL.SUPER_SPEED,
    description: MUTATOR_DESCRIPTION.SUPER_SPEED,
    driveScale: 1.35,
    steerScale: 1.15,
    jumpScale: 1.2,
  }),

  BOOMER_BALL: config({
    ...base,
    id: "BOOMER_BALL",
    label: MUTATOR_LABEL.BOOMER_BALL,
    description: MUTATOR_DESCRIPTION.BOOMER_BALL,
    // There is no restitution setter in the WASM table, so the bounce is faked
    // by handing the ball back more of its own speed after every car contact.
    ballVelocityScale: 1.75,
    ballMassScale: 0.8,
  }),

  DEMOLITION_MADNESS: config({
    ...base,
    id: "DEMOLITION_MADNESS",
    label: MUTATOR_LABEL.DEMOLITION_MADNESS,
    description: MUTATOR_DESCRIPTION.DEMOLITION_MADNESS,
    contactImpulse: 0.7,
    // Fragile cars: less grip, more chaos, still no native demo override.
    steerScale: 1.25,
    driveScale: 0.92,
  }),
});

/** The mutator a match starts on. */
export const DEFAULT_MUTATOR: MutatorId = "NORMAL";

/**
 * Resolve an id to its config, falling back to `NORMAL` for anything unknown.
 * Never throws: an agent sending a bad id must not be able to crash the match.
 */
export const resolveSimConfig = (id: string | null | undefined): SimConfig =>
  MUTATOR_REGISTRY[(id ?? "") as MutatorId] ?? MUTATOR_REGISTRY[DEFAULT_MUTATOR];

/** The config a given match state is running. */
export const simConfigFor = (state: { readonly mutator: string }): SimConfig =>
  resolveSimConfig(state.mutator);

/* -------------------------------------------------------------------------- */
/* Stat-tracking tuning.                                                        */
/*                                                                              */
/* This lives on the config too, for the same reason: there is exactly one      */
/* place to look for "what numbers does this port assume". The donor exposes NO */
/* goal-plane constant and no shot/save concept, so these are the honest        */
/* proxies, and they are all defined in TICKS / relative units.                  */
/* -------------------------------------------------------------------------- */

export interface StatTuning {
  /** Ticks a touch stays "the last touch" (≈0.5 s). */
  readonly touchMemoryTicks: number;
  /** Ticks a teammate's touch still counts as an assist (≈3 s). */
  readonly assistWindowTicks: number;
  /** Ticks a shot stays open, i.e. how long a save can be credited (≈2 s). */
  readonly shotWindowTicks: number;
  /** |ball velocity| along the attack axis that makes a touch a shot. uu/s. */
  readonly shotSpeed: number;
  /** Car-to-car distance (uu) within which a demo is attributed to a killer. */
  readonly demoAttributionRadius: number;
}

const defaultTuning: StatTuning = Object.freeze({
  touchMemoryTicks: 60,
  assistWindowTicks: 360,
  shotWindowTicks: 240,
  shotSpeed: 900,
  demoAttributionRadius: 400,
});

/** The one stat-tuning block. Frozen; not per-mutator. */
export const STAT_TUNING: StatTuning = defaultTuning;

/** Which team attacks which end, re-exported so callers need one import. */
export type { Team };
