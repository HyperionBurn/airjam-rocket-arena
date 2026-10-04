/**
 * Phase 11 — the stability invariant layer.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS IS
 *
 * Small, pure guards that assert the things which must ALWAYS hold in a running
 * kiosk, each returning a STRUCTURED VIOLATION rather than throwing. A thrown
 * error inside the host frame loop is exactly the failure mode this port cannot
 * afford: it turns "one car is stuck" into "the arena stopped", in front of a
 * crowd, with nobody technical present to read a stack trace.
 *
 * So nothing here throws, nothing here imports the DOM, Three, WASM or the
 * donor, and nothing here reaches into another worker's directory except the
 * read-only types in `../seam.js`. Every guard takes a plain observation object
 * and returns `readonly StabilityViolation[]` — empty meaning "still healthy".
 *
 * ---------------------------------------------------------------------------
 * WHY AN OBSERVATION AND NOT THE REAL THINGS
 *
 * The real things are a WASM heap, a registry closure, a set of input sources
 * and a browser. None of them can be constructed in Node. So the host builds a
 * `TickObservation` — a plain, JSON-shaped picture of one tick — and these
 * guards judge that. The trade is explicit and stated: a guard can only report
 * what the host actually observed, so a field the host forgets to fill in is a
 * field no guard can see. Each observation field below says who fills it.
 *
 * ---------------------------------------------------------------------------
 * THE FIVE FAILURE MODES THIS EXISTS FOR
 *
 * The product runs unattended. The three that kill a session are a stuck input,
 * a disconnect that leaves a car driving, and a frozen-looking arena. Each maps
 * to at least one invariant here:
 *
 *   stuck input            → `no-indefinite-hold`
 *   disconnect             → `neutral-after-disruption`, `vanished-controller-neutral`
 *   frozen-looking arena   → `arena-cap`, `no-double-slot-assign` (a car that
 *                            cannot be addressed cannot be drawn either)
 *   one phone in a match   → `one-source-per-slot`, `no-double-binding`
 */

import { CONTROL_KEYS, MAX_CARS, type CarControls, type NeutralizeReason } from "../seam.js";

/* -------------------------------------------------------------------------- */
/* The observation                                                              */
/* -------------------------------------------------------------------------- */

/**
 * One car, as the host sees it at one instant.
 *
 * The host fills every field. Nothing here is optional except `sourceKey`, and
 * that is optional on purpose: a bot seat genuinely has no input source, which
 * is a legitimate state, not a gap in the observation.
 */
export interface ObservedCar {
  /** The simulation car index. Must be an integer in `[0, MAX_CARS)`. */
  readonly slot: number;
  /** Air Jam controller bound to this slot. Null for a bot seat or an empty one. */
  readonly playerId: string | null;
  /**
   * Identity of the `CarInputSource` OBJECT serving this slot — a stable string
   * the host chooses (a registry key, an object id). Two slots carrying the same
   * `sourceKey` means one source is bound twice. Null when no source is bound.
   */
  readonly sourceKey: string | null;
  /** The LEVEL controls being written to the sim for this slot on this tick. */
  readonly controls: CarControls;
  /**
   * False once the controller is demonstrably gone: left, disconnected, tab
   * hidden, or never published. The source's own `isLive()`
   * (`airjam-input-source.ts:298-309`) is the intended source of this.
   */
  readonly controllerPresent: boolean;
  /**
   * True when a FRESH payload reached this car on this tick — i.e. the level
   * changed, or the controller republished. A held button produces the same
   * level every tick, so a host that only looks at the values cannot tell a
   * deliberate hold from a swallowed `pointerup`. This flag is the host saying
   * "input actually arrived", and it is what makes the stuck-input guard bite.
   */
  readonly freshInput: boolean;
}

/**
 * The disruption the host is neutralising on this tick, or null for a normal one.
 *
 * `scope` is explicit rather than inferred from `reason`, because the SAME
 * reason legitimately arrives at two different scopes: `neutralizeAll("blurred")`
 * is every car in the arena, `guard.setPresence(source, false)` is exactly one
 * (`stuck-input-guard.ts:207-209`). Inferring scope from the reason would make
 * the all-scope case unprovable.
 */
export interface NeutralizeEvent {
  /** The seam's own vocabulary (`seam.ts:152`). Nothing new is invented here. */
  readonly reason: NeutralizeReason;
  /** `"all"` = `CarSlotRegistry.neutralizeAll`; `"one"` = a single source. */
  readonly scope: "all" | "one";
  /** Required when `scope` is `"one"`; ignored otherwise. */
  readonly playerId: string | null;
}

/** One tick, as data. */
export interface TickObservation {
  /** Monotonic tick index. Drives the stale-hold window; not wall-clock time. */
  readonly tick: number;
  /** The disruption being served this tick, or null for a normal tick. */
  readonly event: NeutralizeEvent | null;
  /** Every car the host currently drives, bots and seats included. */
  readonly cars: readonly ObservedCar[];
  /**
   * Car count the SIM itself reports (`readCarCount(state)`), when the host can
   * read it. Checked against `MAX_CARS` independently of `cars.length`, because
   * a sim that grew past the cap is a bridge bug the host's own array cannot see.
   */
  readonly simCarCount?: number;
}

/* -------------------------------------------------------------------------- */
/* The violation                                                                */
/* -------------------------------------------------------------------------- */

export type InvariantId =
  /** No car is left with non-neutral controls after blur / tab-hide / disconnect / teardown. */
  | "neutral-after-disruption"
  /** A car whose controller has vanished is neutral on the very tick it is seen gone. */
  | "vanished-controller-neutral"
  /** Every bound slot maps to exactly one live source. */
  | "one-source-per-slot"
  /** No source is bound twice, and no player drives two slots. */
  | "no-double-binding"
  /** Boost / steer / throttle / air-roll cannot persist without a fresh input. */
  | "no-indefinite-hold"
  /** The arena never exceeds the native cap and no slot is out of range. */
  | "arena-cap"
  /** Two players are never assigned the same car slot. */
  | "no-double-slot-assign";

/**
 * One thing that is wrong, described well enough to act on without a debugger.
 *
 * `remedy` is the whole point. A guard that says "invariant violated" costs the
 * operator a debugging session; a guard that says "call
 * `registry.neutralizeAll('blurred')`" costs them a glance at the console.
 */
export interface StabilityViolation {
  readonly invariant: InvariantId;
  /** `"critical"` = people are affected now. `"warning"` = degradation, not yet fatal. */
  readonly severity: "critical" | "warning";
  readonly slot: number;
  readonly playerId: string | null;
  /** What was wrong, in one sentence. Names the offending field values. */
  readonly detail: string;
  /** The single next action that should clear it. */
  readonly remedy: string;
}

/* -------------------------------------------------------------------------- */
/* Invariant catalogue — shared by the guards, the monitor and the checklists  */
/* -------------------------------------------------------------------------- */

export interface InvariantMeta {
  readonly id: InvariantId;
  readonly title: string;
  /** Why this must always hold at an unattended kiosk. */
  readonly why: string;
  /** Human-readable form of the `remedy` field, for the printed report. */
  readonly response: string;
}

export const INVARIANTS: readonly InvariantMeta[] = Object.freeze([
  Object.freeze({
    id: "neutral-after-disruption",
    title: "Nothing drives after blur / hide / disconnect / teardown",
    why:
      "The donor pauses the whole match when the host window loses focus " +
      "(`donor/app/startup.js:836-838`), so a car left on the throttle after a " +
      "blur is a car that resumes accelerating in front of the crowd with nobody " +
      "touching it. `neutralizeAll` exists precisely to make this unreachable; " +
      "this guard is how we know it is actually unreachable.",
    response: "registry.neutralizeAll(reason), then re-assert on the next tick",
  }),
  Object.freeze({
    id: "vanished-controller-neutral",
    title: "A vanished controller's car is neutral immediately",
    why:
      "The requirement is 'within one tick'; this guard checks the same tick, " +
      "which is strictly stronger. A source that reports `isLive() === false` " +
      "while still contributing throttle is the single most expensive bug in this " +
      "product: it is invisible, it is permanent, and the player has no way to " +
      "stop it.",
    response: "push NEUTRAL_CONTROLS for that slot this tick (slots/index.ts:293-305)",
  }),
  Object.freeze({
    id: "one-source-per-slot",
    title: "Every bound slot is served by exactly one source",
    why:
      "The donor's fan-out is already per-slot (`physics/simulation.js` writes " +
      "8 floats at `slot * CONTROL_KEYS`), so two sources writing one slot is " +
      "purely our bug — and it produces a car that steers between two phones. A " +
      "bound slot with NO source is the mirror failure: the car sits in the " +
      "arena and can never be driven.",
    response: "re-register the source for that slot, or release the binding",
  }),
  Object.freeze({
    id: "no-double-binding",
    title: "No source is bound twice and no player drives two cars",
    why:
      "A reconnect path that claims a new slot without releasing the old one is " +
      "the normal way to get here. The symptom is two phones apparently sharing " +
      "one car, with the other player's car abandoned mid-match.",
    response: "registry.release(playerId) before re-claiming on reconnect",
  }),
  Object.freeze({
    id: "no-indefinite-hold",
    title: "Boost / steer / throttle / air-roll cannot persist unattended",
    why:
      "`boost` and `handbrake` are held, not pulsed, and the donor's ABI is " +
      "level-triggered (`seam.ts:32-34`). A swallowed `pointerup` — a phone " +
      "call, a notification shade, a dropped `pointercancel` — leaves the SDK " +
      "re-serving the last buffered payload indefinitely, because it only clears " +
      "on player leave. The car then boosts forever with nobody touching it.",
    response: "write NEUTRAL_CONTROLS when the guard sees a release with no press",
  }),
  Object.freeze({
    id: "arena-cap",
    title: "The arena never exceeds MAX_CARS and no slot is out of range",
    why:
      "`MAX_CARS = 8` is the bridge's own `constexpr` (`seam.ts:46`) and " +
      "`addCar` refuses past it. A ninth car is not a slow car, it is a car that " +
      "does not exist, which at a kiosk reads as 'the game is broken'.",
    response: "refuse the join and send the player back to the lobby",
  }),
  Object.freeze({
    id: "no-double-slot-assign",
    title: "Two players never hold the same car slot",
    why:
      "The roster in the match state and the bindings in the registry are two " +
      "separate maps. When they disagree, one of the two cars is undrivable and " +
      "the other is driven by both players at once. This is the mismatch that " +
      "makes 'one car drives alone' happen with no error anywhere.",
    response: "re-derive the slot from the registry, not from the roster entry",
  }),
]);

/* -------------------------------------------------------------------------- */
/* Small shared helpers                                                         */
/* -------------------------------------------------------------------------- */

/**
 * True when `controls` is EXACTLY `NEUTRAL_CONTROLS`.
 *
 * `=== 0` is deliberate and not `Math.abs(v) < epsilon`: a `NaN` reaching the
 * sim is a real bug, and the bridge would silently turn it into 0
 * (`seam.ts:124-139`) so a tolerant check would never see it.
 */
export const isNeutralControls = (controls: CarControls): boolean =>
  CONTROL_KEYS.every((key) => {
    const value = controls[key];
    return typeof value === "boolean" ? value === false : value === 0;
  });

/** The names of every non-neutral field, for a detail string. */
export const activeControlFields = (controls: CarControls): readonly ControlKeyName[] => {
  const active: ControlKeyName[] = [];
  for (const key of CONTROL_KEYS) {
    const value = controls[key];
    const engaged = typeof value === "boolean" ? value === true : value !== 0;
    if (engaged) active.push(key);
  }
  return active;
};

type ControlKeyName = (typeof CONTROL_KEYS)[number];

const quote = (value: string | null): string => (value === null ? "(unbound)" : value);

/** Format a value for a detail string, so `NaN` and `0` are distinguishable. */
const show = (value: number | boolean): string => (typeof value === "boolean" ? String(value) : String(value));

/* -------------------------------------------------------------------------- */
/* The stateless guards                                                         */
/* -------------------------------------------------------------------------- */

/**
 * INVARIANT 1 — `neutral-after-disruption`.
 *
 * Applies only while an event is being served. The target set is the event's
 * scope: `"all"` means every car in the arena, `"one"` means the named player.
 */
export const checkNeutralAfterDisruption = (
  observation: TickObservation,
): readonly StabilityViolation[] => {
  const event = observation.event;
  if (!event) return [];

  const affected = observation.cars.filter((car) =>
    event.scope === "all" ? true : car.playerId === event.playerId,
  );

  const violations: StabilityViolation[] = [];
  for (const car of affected) {
    if (isNeutralControls(car.controls)) continue;
    violations.push({
      invariant: "neutral-after-disruption",
      severity: "critical",
      slot: car.slot,
      playerId: car.playerId,
      detail:
        `slot ${car.slot} (${quote(car.playerId)}) still holds ` +
        `[${activeControlFields(car.controls).join(", ")}] after ` +
        `neutralize(${event.reason}) with scope="${event.scope}"`,
      remedy: `registry.neutralizeAll("${event.reason}") — it reaches the sim buffer, source.neutralize() alone does not`,
    });
  }
  return violations;
};

/**
 * INVARIANT 2 — `vanished-controller-neutral`.
 *
 * Checked on EVERY tick, not only during an event, because a controller can
 * vanish without any event at all: it simply stops publishing and the source's
 * `isStale()` starts returning true (`airjam-input-source.ts:293-296`). A guard
 * that only listened for events would miss exactly the case that matters most.
 */
export const checkVanishedControllerNeutral = (
  observation: TickObservation,
): readonly StabilityViolation[] => {
  const violations: StabilityViolation[] = [];
  for (const car of observation.cars) {
    if (car.controllerPresent) continue;
    if (isNeutralControls(car.controls)) continue;
    violations.push({
      invariant: "vanished-controller-neutral",
      severity: "critical",
      slot: car.slot,
      playerId: car.playerId,
      detail:
        `slot ${car.slot} (${quote(car.playerId)}) has a vanished controller but is ` +
        `still writing [${activeControlFields(car.controls).map((key) => `${key}=${show(car.controls[key])}`).join(", ")}]`,
      remedy:
        "push NEUTRAL_CONTROLS for a non-live source — see the `isLive() ? read() : NEUTRAL_CONTROLS` fork in slots/index.ts:293-305",
    });
  }
  return violations;
};

/** Group cars by a key, dropping null keys and empty groups. */
const groupBy = <K extends string | number>(
  cars: readonly ObservedCar[],
  key: (car: ObservedCar) => K | null,
): Map<K, ObservedCar[]> => {
  const groups = new Map<K, ObservedCar[]>();
  for (const car of cars) {
    const k = key(car);
    if (k === null) continue;
    const bucket = groups.get(k);
    if (bucket) bucket.push(car);
    else groups.set(k, [car]);
  }
  return groups;
};

/**
 * INVARIANT 3 — `one-source-per-slot`.
 *
 * Two distinct failures, deliberately kept apart:
 *   (a) a bound slot with NO source — a car nobody can drive;
 *   (b) a slot served by MORE THAN ONE distinct source — two phones on one car.
 */
export const checkOneSourcePerSlot = (
  observation: TickObservation,
): readonly StabilityViolation[] => {
  const violations: StabilityViolation[] = [];

  for (const [slot, cars] of groupBy(observation.cars, (car) => car.slot)) {
    const bound = cars.filter((car) => car.playerId !== null);
    if (bound.length > 0 && cars.every((car) => car.sourceKey === null)) {
      violations.push({
        invariant: "one-source-per-slot",
        severity: "critical",
        slot,
        playerId: bound[0].playerId,
        detail: `slot ${slot} is bound to ${quote(bound[0].playerId)} but has no input source`,
        remedy: "registry.claim() must be given a createSource that returns a live source",
      });
    }

    const sources = new Set(cars.map((car) => car.sourceKey).filter((key): key is string => key !== null));
    if (sources.size > 1) {
      violations.push({
        invariant: "one-source-per-slot",
        severity: "critical",
        slot,
        playerId: cars[0].playerId,
        detail: `slot ${slot} is served by ${sources.size} input sources: ${[...sources].sort().join(", ")}`,
        remedy: "one source per slot — release the loser of a double bind before the tick",
      });
    }
  }

  return violations;
};

/**
 * INVARIANT 4 — `no-double-binding`.
 *
 * `sourceKey` seen on two slots is one source bound twice; `playerId` seen on
 * two slots is one player driving two cars. The reconnect path is the usual
 * culprit for both.
 */
export const checkNoDoubleBinding = (
  observation: TickObservation,
): readonly StabilityViolation[] => {
  const violations: StabilityViolation[] = [];

  for (const [key, cars] of groupBy(observation.cars, (car) => car.sourceKey)) {
    const slots = new Set(cars.map((car) => car.slot));
    if (slots.size < 2) continue;
    violations.push({
      invariant: "no-double-binding",
      severity: "critical",
      slot: cars[0].slot,
      playerId: cars[0].playerId,
      detail: `input source "${key}" is bound to ${slots.size} slots: ${[...slots].sort((a, b) => a - b).join(", ")}`,
      remedy: "release the previous binding before re-claiming (registry.release() neutralizes first)",
    });
  }

  for (const [playerId, cars] of groupBy(observation.cars, (car) => car.playerId)) {
    const slots = new Set(cars.map((car) => car.slot));
    if (slots.size < 2) continue;
    violations.push({
      invariant: "no-double-binding",
      severity: "critical",
      slot: cars[0].slot,
      playerId,
      detail: `player "${playerId}" is bound to ${slots.size} slots: ${[...slots].sort((a, b) => a - b).join(", ")}`,
      remedy: "a reconnect must re-claim the RETAINED slot, not a fresh one",
    });
  }

  return violations;
};

/**
 * INVARIANT 5 — `no-indefinite-hold`, as a pure predicate over one observation.
 *
 * Given how long a non-neutral level has already been running with no fresh
 * input, is it too old? The duration bookkeeping lives in the monitor; this is
 * the decision, kept separate so it can be tested with a hand-built observation
 * and no monitor at all.
 */
export const checkNoIndefiniteHold = (
  car: ObservedCar,
  heldForTicks: number,
  maxHoldTicks: number,
): readonly StabilityViolation[] => {
  if (!car.controllerPresent) return [];
  if (isNeutralControls(car.controls)) return [];
  if (heldForTicks <= maxHoldTicks) return [];

  return [
    {
      invariant: "no-indefinite-hold",
      severity: "critical",
      slot: car.slot,
      playerId: car.playerId,
      detail:
        `slot ${car.slot} (${quote(car.playerId)}) has held ` +
        `[${activeControlFields(car.controls).join(", ")}] for ${heldForTicks} ticks ` +
        `with no fresh input (limit ${maxHoldTicks})`,
      remedy:
        "a held level with no new payload is a swallowed pointerup — " +
        "neutralize and let the next real read re-arm it",
    },
  ];
};

/**
 * INVARIANTS 6 and 7 — `arena-cap` and `no-double-slot-assign`.
 *
 * The cap is checked against BOTH the host's own car list and the count the sim
 * reports, because a bridge that grew the arena without the host knowing is
 * invisible to `cars.length`.
 */
export const checkArenaCap = (observation: TickObservation): readonly StabilityViolation[] => {
  const violations: StabilityViolation[] = [];

  if (observation.cars.length > MAX_CARS) {
    violations.push({
      invariant: "arena-cap",
      severity: "critical",
      slot: -1,
      playerId: null,
      detail: `the host is driving ${observation.cars.length} cars, the native cap is ${MAX_CARS}`,
      remedy: `refuse the join past ${MAX_CARS} and send the player back to the lobby`,
    });
  }

  const simCount = observation.simCarCount;
  if (typeof simCount === "number" && simCount > MAX_CARS) {
    violations.push({
      invariant: "arena-cap",
      severity: "critical",
      slot: -1,
      playerId: null,
      detail: `the simulation reports ${simCount} cars, the native cap is ${MAX_CARS}`,
      remedy: "addCar() must delegate to _physics_addCar and must not be called past MAX_CARS",
    });
  }

  for (const car of observation.cars) {
    const inRange = Number.isInteger(car.slot) && car.slot >= 0 && car.slot < MAX_CARS;
    if (inRange) continue;
    violations.push({
      invariant: "arena-cap",
      severity: "critical",
      slot: car.slot,
      playerId: car.playerId,
      detail: `slot ${car.slot} (${quote(car.playerId)}) is outside the addressable range [0, ${MAX_CARS})`,
      remedy: "a live car must have a slot the bridge can address; release the binding",
    });
  }

  return violations;
};

/** INVARIANT 7 — two players must never hold the same slot. */
export const checkNoDoubleSlotAssign = (
  observation: TickObservation,
): readonly StabilityViolation[] => {
  const violations: StabilityViolation[] = [];

  for (const [slot, cars] of groupBy(observation.cars, (car) => car.slot)) {
    const players = new Set(
      cars.map((car) => car.playerId).filter((id): id is string => id !== null),
    );
    if (players.size < 2) continue;
    violations.push({
      invariant: "no-double-slot-assign",
      severity: "critical",
      slot,
      playerId: [...players].sort()[0],
      detail: `slot ${slot} is assigned to ${players.size} players: ${[...players].sort().join(", ")}`,
      remedy: "the registry is the single owner of slot assignment; the roster must read from it",
    });
  }

  return violations;
};

/**
 * Every STATELESS guard, in one call. This is what a caller runs on an ordinary
 * tick; the monitor runs these plus the held-duration bookkeeping.
 */
export const checkStability = (observation: TickObservation): readonly StabilityViolation[] => [
  ...checkNeutralAfterDisruption(observation),
  ...checkVanishedControllerNeutral(observation),
  ...checkOneSourcePerSlot(observation),
  ...checkNoDoubleBinding(observation),
  ...checkArenaCap(observation),
  ...checkNoDoubleSlotAssign(observation),
];

/* -------------------------------------------------------------------------- */
/* The monitor — the only stateful piece, and it is still pure from outside      */
/* -------------------------------------------------------------------------- */

/**
 * Default window for a non-neutral level with no fresh input: 30 ticks.
 *
 * 30 ticks is 250 ms at `SIM_HZ = 120`. It is long enough that a single dropped
 * Air Jam payload (the SDK tick is 16 ms, so several reads can legitimately see
 * the same buffered level) does not trip it, and short enough that a car
 * boosting unattended is visibly wrong well before a player notices and blames
 * the game.
 */
export const DEFAULT_MAX_STALE_HOLD_TICKS = 30;

export interface StabilityMonitorOptions {
  /** See {@link DEFAULT_MAX_STALE_HOLD_TICKS}. */
  readonly maxStaleHoldTicks?: number;
}

export interface StabilityMonitor {
  /** Run every guard for one tick. Returns whatever is newly wrong. */
  observe(observation: TickObservation): readonly StabilityViolation[];
  /** Everything seen so far, in tick order, deduplicated per tick. */
  violations(): readonly StabilityViolation[];
  /** Just one invariant's history. */
  violationsFor(id: InvariantId): readonly StabilityViolation[];
  /** True when nothing has ever been reported. */
  isHealthy(): boolean;
  /** Forget the history AND the hold bookkeeping. */
  reset(): void;
}

/**
 * Create a monitor.
 *
 * Closure state, no class, no module-level singleton — so a test can build as
 * many independent monitors as it needs and they cannot contaminate each other.
 * This mirrors `createCarSlotRegistry` (`slots/car-slot-registry.ts:120-126`).
 */
export const createStabilityMonitor = (
  options: StabilityMonitorOptions = {},
): StabilityMonitor => {
  const maxHoldTicks = Math.max(
    0,
    Math.floor(options.maxStaleHoldTicks ?? DEFAULT_MAX_STALE_HOLD_TICKS),
  );

  /** slot → the tick at which its current non-neutral hold began. */
  const holdSince = new Map<number, number>();
  /** Every violation ever reported, tagged with the tick it was found on. */
  const history: { tick: number; violation: StabilityViolation }[] = [];
  /** Dedupe so a per-tick guard cannot flood the log with the same finding. */
  const seen = new Set<string>();

  return {
    observe(observation) {
      const found: StabilityViolation[] = [...checkStability(observation)];

      // The held-duration guard is the one that needs memory, so it lives here
      // rather than in `checkStability`: given only a single observation there
      // is no way to know how long the hold has already been running.
      for (const car of observation.cars) {
        const quiet = isNeutralControls(car.controls) || !car.controllerPresent || car.freshInput;
        if (quiet) {
          holdSince.delete(car.slot);
          continue;
        }
        const since = holdSince.get(car.slot) ?? observation.tick;
        holdSince.set(car.slot, since);
        found.push(...checkNoIndefiniteHold(car, observation.tick - since, maxHoldTicks));
      }

      for (const violation of found) {
        const key = `${observation.tick}:${violation.invariant}:${violation.slot}:${violation.playerId ?? ""}`;
        if (seen.has(key)) continue;
        seen.add(key);
        history.push({ tick: observation.tick, violation });
      }

      return found;
    },

    violations() {
      return history.map((entry) => entry.violation);
    },

    violationsFor(id) {
      return history.filter((entry) => entry.violation.invariant === id).map((e) => e.violation);
    },

    isHealthy() {
      return history.length === 0;
    },

    reset() {
      holdSince.clear();
      history.length = 0;
      seen.clear();
    },
  };
};

/* -------------------------------------------------------------------------- */
/* Reporting                                                                    */
/* -------------------------------------------------------------------------- */

/** One line per violation, prefixed with its tick. For a console at the venue. */
export const formatViolations = (
  violations: readonly StabilityViolation[],
  tick?: number,
): readonly string[] =>
  violations.map(
    (violation) =>
      `[${tick === undefined ? "" : `tick ${tick} `}]${violation.severity.toUpperCase()} ` +
      `${violation.invariant} — ${violation.detail} → ${violation.remedy}`,
  );

/**
 * A one-line health summary. Cheap enough to call every tick and to leave on
 * screen, which is the point: the failure this port fears is a silent one.
 */
export const summarizeViolations = (violations: readonly StabilityViolation[]): string => {
  if (violations.length === 0) return "stable: no invariant violated";
  const byId = new Map<InvariantId, number>();
  for (const violation of violations) {
    byId.set(violation.invariant, (byId.get(violation.invariant) ?? 0) + 1);
  }
  return [...byId.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id, count]) => `${id}×${count}`)
    .join(", ");
};

/** The catalogue entry for an id. Throws only on a programming error, never on bad data. */
export const invariantMeta = (id: InvariantId): InvariantMeta => {
  const found = INVARIANTS.find((entry) => entry.id === id);
  if (!found) throw new Error(`Unknown invariant id: ${id}`);
  return found;
};
