/**
 * Fakes for the bots unit tests.
 *
 * Everything the bots layer talks to is an injected interface — the registry,
 * the brain, the sim, the clock — precisely so these can be plain object
 * literals. No WASM, no ONNXRuntime, no Worker, no DOM, no donor import, and no
 * real time: a test advances a counter by hand.
 */

import { NEUTRAL_CONTROLS, sanitizeControls } from "../../seam.js";
import type { CarControls, CarInputSource, PortedSim } from "../../seam.js";
import { createCarSlotRegistry } from "../../slots/car-slot-registry.js";
import type { ManagedCarSlotRegistry } from "../../slots/car-slot-registry.js";
import type { BotDifficultyId } from "../bot-difficulty.js";
import type { BotTeam } from "../bot-fill-plan.js";
import type { BotInference, BotObservation, BoostPadView } from "../bot-inference.js";

/** A hand-driven clock. Nothing in this layer reads the real one. */
export interface FakeClock {
  now(): number;
  advance(ms: number): void;
}

export const makeClock = (start = 1_000): FakeClock => {
  let value = start;
  return {
    now: () => value,
    advance: (ms: number) => {
      value += ms;
    },
  };
};

export const CONTROLS_GO: CarControls = Object.freeze({
  throttle: 1,
  steer: 0.5,
  pitch: 0,
  yaw: 0,
  roll: 0,
  jump: true,
  boost: true,
  handbrake: false,
});

/** How a fake brain should misbehave. */
export type FakeBrainBehaviour =
  /** Resolves immediately with `controls`. */
  | "ok"
  /** Never settles. Models a wedged worker. */
  | "hang"
  /** Rejects. Models the donor's timeout / decode failure path. */
  | "reject"
  /** Throws synchronously out of `decide`. */
  | "throw";

export interface FakeBrain extends BotInference {
  /** How many times `decide` was called. */
  readonly calls: number;
  /** Every observation `decide` was given, in order. */
  readonly seen: readonly BotObservation[];
  /**
   * Mutable, so a test can let a decision succeed and then make the NEXT one
   * reject — the exact sequence a real worker produces when it goes bad
   * mid-match.
   */
  behaviour: FakeBrainBehaviour;
  /** Settle every outstanding call with `controls`. */
  resolveAll(controls?: CarControls): void;
  /** Fail every outstanding call. */
  rejectAll(message?: string): void;
  disposed: boolean;
  /** Times `load()` was called. */
  readonly loads: number;
  /** Times `reset()` was called. */
  readonly resets: number;
}

export interface FakeBrainOptions {
  readonly behaviour?: FakeBrainBehaviour;
  /** What a successful decision returns. Default `CONTROLS_GO`. */
  readonly controls?: CarControls;
  /** Reported readiness. Default true. */
  readonly ready?: boolean;
  /** Make `load()` reject, to test the model-load-failed path. */
  readonly loadFails?: boolean;
  /** Serve a deterministic kickoff routine instead of the brain. */
  readonly kickoff?: CarControls | null;
  readonly id?: BotDifficultyId;
}

/**
 * A brain whose every decision the test settles by hand. This is the only way to
 * test a stall without a real timer, and it makes "the promise is still in
 * flight" an explicit, observable state rather than a race.
 */
export const makeFakeBrain = (options: FakeBrainOptions = {}): FakeBrain => {
  let ready = options.ready ?? true;
  let calls = 0;
  const seen: BotObservation[] = [];
  const outstanding: { resolve: (value: CarControls) => void; reject: (error: Error) => void }[] = [];
  let loads = 0;
  let resets = 0;

  const controls = options.controls ?? CONTROLS_GO;
  const brain: FakeBrain = {
    id: options.id ?? "seer",
    behaviour: options.behaviour ?? "ok",
    get isReady() {
      return ready;
    },
    requiresNeuralRuntime: true,
    load: () => {
      loads += 1;
      return options.loadFails ? Promise.reject(new Error("model fetch failed")) : Promise.resolve();
    },
    decide: (observation) => {
      calls += 1;
      seen.push(observation);
      if (brain.behaviour === "throw") throw new Error("decide() exploded");
      return new Promise<CarControls>((resolve, reject) => {
        if (brain.behaviour === "reject") {
          reject(new Error("The bot took too long to respond."));
          return;
        }
        if (brain.behaviour === "ok") {
          resolve(sanitizeControls(controls));
          return;
        }
        outstanding.push({ resolve, reject });
      });
    },
    getKickoffControls: () => options.kickoff ?? null,
    reset: () => {
      resets += 1;
    },
    dispose: () => {
      brain.disposed = true;
      ready = false;
    },
    get calls() {
      return calls;
    },
    get seen() {
      return seen;
    },
    get loads() {
      return loads;
    },
    get resets() {
      return resets;
    },
    resolveAll: (next = controls) => {
      while (outstanding.length > 0) outstanding.shift()?.resolve(sanitizeControls(next));
    },
    rejectAll: (message = "The bot took too long to respond.") => {
      while (outstanding.length > 0) outstanding.shift()?.reject(new Error(message));
    },
    disposed: false,
  };
  return brain;
};

export interface RecordedControl {
  readonly slot: number;
  readonly controls: CarControls;
}

/** A `PortedSim` that only records what was written. */
export interface FakeSim extends PortedSim {
  readonly writes: readonly RecordedControl[];
  lastFor(slot: number): CarControls | null;
  readonly steps: number;
}

export const makeFakeSim = (): FakeSim => {
  const writes: RecordedControl[] = [];
  let steps = 0;
  return {
    writes,
    get steps() {
      return steps;
    },
    setControls(slot: number, controls: CarControls) {
      writes.push({ slot, controls });
    },
    step(ticks = 1) {
      steps += ticks;
    },
    get state() {
      return new Float32Array(0);
    },
    lastFor(slot: number) {
      for (let i = writes.length - 1; i >= 0; i -= 1) {
        if (writes[i].slot === slot) return writes[i].controls;
      }
      return null;
    },
  };
};

/**
 * The real `ManagedCarSlotRegistry` from the slots layer, wired to a no-op
 * source factory.
 *
 * Deliberately NOT a hand-rolled double: the manager's whole job is to ask this
 * interface for a seat and put a bot in it, so testing against a real registry
 * proves the integration instead of proving a mock agrees with itself. The
 * slots layer supplies its own tested behaviour; this only supplies the input
 * source the registry needs to build.
 */
export interface FakeRegistry extends ManagedCarSlotRegistry {
  /** Bot seats currently reserved, in slot order. */
  botSeats(): ReadonlyArray<{ slot: number; team: BotTeam }>;
}

/** A `CarInputSource` that is never driven: a human claims nothing in these tests. */
const makeNoopSource = (playerId: string, slot: number, team: 0 | 1): CarInputSource => ({
  playerId,
  slot,
  team,
  read: () => ({ ...NEUTRAL_CONTROLS }),
  neutralize: () => {
    /* nothing to drop */
  },
  isLive: () => false,
});

/** `full` models an arena with no room left: `maxCars: 0` refuses every seat. */
export const makeFakeRegistry = (full = false): FakeRegistry => {
  const inner = createCarSlotRegistry({ createSource: makeNoopSource, maxCars: full ? 0 : 8 });
  return {
    ...inner,
    botSeats: () =>
      inner
        .liveSlots()
        .filter((live) => !live.controlled)
        .map(({ slot, team }) => ({ slot, team: team === 1 ? 1 : 0 })),
  };
};

/** 34 zero-length pads, the count every donor policy demands. */
export const NO_PADS: readonly BoostPadView[] = Array.from({ length: 34 }, () => ({
  pos: [0, 0, 0] as const,
  isBig: false,
}));

/**
 * A minimal but VALID 510-float state block: the header the donor's
 * observation builders read, plus two cars. NUM_CARS is 2 because that is the
 * only value any real policy accepts, and the ball is placed 500 uu away so a
 * scripted policy has a direction to drive in.
 */
export const makeState = (overrides: Partial<Record<"numCars" | "ballX" | "ballY", number>> = {}): Float32Array => {
  const state = new Float32Array(510);
  state[2] = overrides.numCars ?? 2; // NUM_CARS
  state[3] = 34; // NUM_PADS
  state[4] = overrides.ballX ?? 500; // BALL.x
  state[5] = overrides.ballY ?? 0; // BALL.y
  const stride = 51;
  const base = 22;
  for (const slot of [0, 1]) {
    const at = base + slot * stride;
    state[at + 3] = slot === 0 ? 1 : -1; // FWD.x — point each car at the other
    state[at + 19] = 1; // ON_GROUND
  }
  return state;
};

/** The neutral object, re-exported so assertions read clearly. */
export const NEUTRAL = NEUTRAL_CONTROLS;
