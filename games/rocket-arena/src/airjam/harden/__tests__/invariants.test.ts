/**
 * Phase 11 — the stability invariant layer.
 *
 * THE POINT OF THIS FILE. An invariant that cannot fail is worse than no
 * invariant at all: it costs a look at the code, buys no confidence, and — worst
 * of all — reads in a review as though the guarantee is covered. So every case
 * here comes in PAIRS:
 *
 *   "a healthy observation violates nothing"   — the guard is not noise
 *   "breaking X fires exactly Y"                — the guard BITES
 *
 * The healthy half is not filler. A guard that fires on everything is also
 * worthless, and in a kiosk a monitor that always reports a violation gets
 * ignored within one match.
 */

import { describe, expect, it } from "vitest";

import { MAX_CARS, NEUTRAL_CONTROLS, type CarControls } from "../../seam.js";
import {
  activeControlFields,
  checkArenaCap,
  checkNeutralAfterDisruption,
  checkNoDoubleBinding,
  checkNoDoubleSlotAssign,
  checkNoIndefiniteHold,
  checkOneSourcePerSlot,
  checkStability,
  checkVanishedControllerNeutral,
  createStabilityMonitor,
  DEFAULT_MAX_STALE_HOLD_TICKS,
  INVARIANTS,
  invariantMeta,
  isNeutralControls,
  summarizeViolations,
  type NeutralizeEvent,
  type ObservedCar,
  type TickObservation,
} from "../invariants.js";

/* -------------------------------------------------------------------------- */
/* Fakes                                                                        */
/* -------------------------------------------------------------------------- */

const controls = (over: Partial<CarControls> = {}): CarControls => ({
  ...NEUTRAL_CONTROLS,
  ...over,
});

const car = (over: Partial<ObservedCar> = {}): ObservedCar => ({
  slot: 0,
  playerId: "c1",
  sourceKey: "src:c1",
  controls: controls(),
  controllerPresent: true,
  freshInput: true,
  ...over,
});

const observation = (over: Partial<TickObservation> = {}): TickObservation => ({
  tick: 0,
  event: null,
  cars: [car()],
  simCarCount: 1,
  ...over,
});

const ids = (found: readonly { invariant: string }[]): string[] =>
  found.map((violation) => violation.invariant);

/* -------------------------------------------------------------------------- */
/* The neutral check itself                                                     */
/* -------------------------------------------------------------------------- */

describe("isNeutralControls", () => {
  it("accepts the exact NEUTRAL_CONTROLS object", () => {
    expect(isNeutralControls(NEUTRAL_CONTROLS)).toBe(true);
  });

  it("rejects every individual field, including a NaN axis", () => {
    expect(isNeutralControls(controls({ throttle: 0.0001 }))).toBe(false);
    expect(isNeutralControls(controls({ boost: true }))).toBe(false);
    expect(isNeutralControls(controls({ handbrake: true }))).toBe(false);
    expect(isNeutralControls(controls({ jump: true }))).toBe(false);
    // NaN !== 0 on purpose: the bridge would silently turn a NaN into 0, so a
    // tolerant check would never see a NaN that reached the heap.
    expect(isNeutralControls({ ...NEUTRAL_CONTROLS, steer: Number.NaN })).toBe(false);
  });

  it("names the engaged fields", () => {
    expect(activeControlFields(controls({ throttle: 1, boost: true }))).toEqual(["throttle", "boost"]);
  });
});

/* -------------------------------------------------------------------------- */
/* 1 — neutral-after-disruption                                                 */
/* -------------------------------------------------------------------------- */

describe("invariant: neutral-after-disruption", () => {
  const blurAll: NeutralizeEvent = { reason: "blurred", scope: "all", playerId: null };
  const oneGone: NeutralizeEvent = { reason: "disconnected", scope: "one", playerId: "c2" };

  it("is quiet on a normal tick — a non-neutral car is legal mid-match", () => {
    const healthy = observation({
      cars: [car({ controls: controls({ throttle: 1, boost: true }) })],
    });
    expect(checkNeutralAfterDisruption(healthy)).toEqual([]);
  });

  it("is quiet when every car is already neutral during a global blur", () => {
    const healthy = observation({ event: blurAll, cars: [car(), car({ slot: 1, playerId: "c2" })] });
    expect(checkNeutralAfterDisruption(healthy)).toEqual([]);
  });

  it("BITES: fires when a car keeps its throttle through a global blur", () => {
    const broken = observation({
      event: blurAll,
      cars: [car(), car({ slot: 1, playerId: "c2", controls: controls({ throttle: 1 }) })],
    });
    const found = checkNeutralAfterDisruption(broken);
    expect(ids(found)).toEqual(["neutral-after-disruption"]);
    expect(found[0].slot).toBe(1);
    expect(found[0].severity).toBe("critical");
    expect(found[0].remedy).toContain("neutralizeAll");
  });

  it("BITES: a per-player disconnect only condemns that player", () => {
    const broken = observation({
      event: oneGone,
      cars: [
        // c1 is mid-corner with the throttle down. This is legal: c1 is fine.
        car({ controls: controls({ throttle: 1, steer: 0.4 }) }),
        car({ slot: 1, playerId: "c2", controls: controls({ boost: true }) }),
      ],
    });
    const found = checkNeutralAfterDisruption(broken);
    expect(ids(found)).toEqual(["neutral-after-disruption"]);
    expect(found[0].playerId).toBe("c2");
  });

  it("covers tab-hide and teardown, which the guard routes to the same reason", () => {
    for (const reason of ["blurred", "released", "replaced", "never-claimed"] as const) {
      const broken = observation({
        event: { reason, scope: "all", playerId: null },
        cars: [car({ controls: controls({ jump: true }) })],
      });
      expect(checkNeutralAfterDisruption(broken)).toHaveLength(1);
    }
  });
});

/* -------------------------------------------------------------------------- */
/* 2 — vanished-controller-neutral                                              */
/* -------------------------------------------------------------------------- */

describe("invariant: vanished-controller-neutral", () => {
  it("is quiet while the controller is present, however hard it is driving", () => {
    const healthy = observation({ cars: [car({ controls: controls({ throttle: 1, boost: true }) })] });
    expect(checkVanishedControllerNeutral(healthy)).toEqual([]);
  });

  it("is quiet when a vanished controller's car is already neutral", () => {
    const healthy = observation({ cars: [car({ controllerPresent: false })] });
    expect(checkVanishedControllerNeutral(healthy)).toEqual([]);
  });

  it("BITES: fires with NO event at all — this is the silent-dropout case", () => {
    const broken = observation({
      event: null,
      cars: [car({ controllerPresent: false, controls: controls({ throttle: 1, boost: true }) })],
    });
    const found = checkVanishedControllerNeutral(broken);
    expect(ids(found)).toEqual(["vanished-controller-neutral"]);
    expect(found[0].detail).toContain("vanished controller");
    expect(found[0].remedy).toContain("NEUTRAL_CONTROLS");
  });
});

/* -------------------------------------------------------------------------- */
/* 3 — one-source-per-slot                                                      */
/* -------------------------------------------------------------------------- */

describe("invariant: one-source-per-slot", () => {
  it("is quiet with one live source per slot", () => {
    const healthy = observation({
      cars: [
        car({ slot: 0, playerId: "c1", sourceKey: "src:c1" }),
        car({ slot: 1, playerId: "c2", sourceKey: "src:c2" }),
      ],
    });
    expect(checkOneSourcePerSlot(healthy)).toEqual([]);
  });

  it("is quiet for a bot seat, which legitimately has no source", () => {
    const healthy = observation({
      cars: [car({ slot: 3, playerId: null, sourceKey: null })],
    });
    expect(checkOneSourcePerSlot(healthy)).toEqual([]);
  });

  it("BITES: a bound slot with no source — a car nobody can drive", () => {
    const broken = observation({ cars: [car({ sourceKey: null })] });
    const found = checkOneSourcePerSlot(broken);
    expect(ids(found)).toEqual(["one-source-per-slot"]);
    expect(found[0].detail).toContain("no input source");
  });

  it("BITES: two sources writing one slot — two phones on one car", () => {
    const broken = observation({
      cars: [
        car({ slot: 0, playerId: "c1", sourceKey: "src:c1" }),
        car({ slot: 0, playerId: "c1", sourceKey: "src:c1-again" }),
      ],
    });
    const found = checkOneSourcePerSlot(broken);
    expect(ids(found)).toEqual(["one-source-per-slot"]);
    expect(found[0].detail).toContain("2 input sources");
  });
});

/* -------------------------------------------------------------------------- */
/* 4 — no-double-binding                                                        */
/* -------------------------------------------------------------------------- */

describe("invariant: no-double-binding", () => {
  it("is quiet when every source and every player appears once", () => {
    const healthy = observation({
      cars: [
        car({ slot: 0, playerId: "c1", sourceKey: "src:c1" }),
        car({ slot: 1, playerId: "c2", sourceKey: "src:c2" }),
      ],
    });
    expect(checkNoDoubleBinding(healthy)).toEqual([]);
  });

  it("BITES: one source object bound to two slots", () => {
    const broken = observation({
      cars: [
        car({ slot: 0, playerId: "c1", sourceKey: "src:shared" }),
        car({ slot: 4, playerId: "c2", sourceKey: "src:shared" }),
      ],
    });
    const found = checkNoDoubleBinding(broken);
    expect(ids(found)).toEqual(["no-double-binding"]);
    expect(found[0].detail).toContain("src:shared");
    expect(found[0].detail).toContain("0, 4");
  });

  it("BITES: one player bound to two slots — the reconnect-without-release path", () => {
    const broken = observation({
      cars: [
        car({ slot: 0, playerId: "c1", sourceKey: "src:old" }),
        car({ slot: 5, playerId: "c1", sourceKey: "src:new" }),
      ],
    });
    const found = checkNoDoubleBinding(broken);
    expect(ids(found)).toEqual(["no-double-binding"]);
    expect(found[0].detail).toContain('player "c1"');
  });
});

/* -------------------------------------------------------------------------- */
/* 5 — no-indefinite-hold                                                       */
/* -------------------------------------------------------------------------- */

describe("invariant: no-indefinite-hold", () => {
  const held = car({ controls: controls({ boost: true, throttle: 1 }), freshInput: false });

  it("is quiet inside the window", () => {
    expect(checkNoIndefiniteHold(held, 5, 30)).toEqual([]);
  });

  it("is quiet when the car is neutral however long the level is stale", () => {
    const neutral = car({ controls: controls(), freshInput: false });
    expect(checkNoIndefiniteHold(neutral, 9999, 30)).toEqual([]);
  });

  it("is quiet when the controller is gone — the other invariant owns that case", () => {
    const gone = car({ controllerPresent: false, freshInput: false });
    expect(checkNoIndefiniteHold(gone, 9999, 30)).toEqual([]);
  });

  it("BITES: fires the moment the hold outruns the window", () => {
    const found = checkNoIndefiniteHold(held, 31, 30);
    expect(ids(found)).toEqual(["no-indefinite-hold"]);
    expect(found[0].detail).toContain("31 ticks");
    expect(found[0].detail).toContain("boost");
  });

  it("BITES through the monitor: a level held with no fresh input, tick by tick", () => {
    const monitor = createStabilityMonitor({ maxStaleHoldTicks: 5 });

    // Six quiet ticks of a held boost with nothing new arriving. The window is
    // "5 ticks is fine, 6 is not", so the sixth observation (tick 5) is the last
    // one that passes and the seventh (tick 6) is the first that may be reported.
    for (let t = 0; t < 6; t += 1) {
      expect(monitor.observe(observation({ tick: t, cars: [held] }))).toEqual([]);
    }
    const found = monitor.observe(observation({ tick: 6, cars: [held] }));
    expect(ids(found)).toEqual(["no-indefinite-hold"]);
    expect(found[0].detail).toContain("6 ticks");

    // And it keeps firing while the level is still stale, so a long outage is
    // not silently dropped after the first report.
    expect(monitor.observe(observation({ tick: 7, cars: [held] }))).toHaveLength(1);
    expect(monitor.violationsFor("no-indefinite-hold")).toHaveLength(2);
  });

  it("resets the hold window the moment fresh input arrives", () => {
    const monitor = createStabilityMonitor({ maxStaleHoldTicks: 5 });
    for (let t = 0; t < 6; t += 1) {
      monitor.observe(observation({ tick: t, cars: [held] }));
    }
    // One fresh tick: the level is still held, but it is now TRUSTED again.
    expect(monitor.observe(observation({ tick: 6, cars: [held] }))).toHaveLength(1);
    const fresh = { ...held, freshInput: true };
    expect(monitor.observe(observation({ tick: 7, cars: [fresh] }))).toEqual([]);
    // …and the window restarts from that fresh tick (t=7), so ticks 8..13 are
    // the six survivable ones and t=14 is over the limit again.
    for (let t = 8; t < 14; t += 1) {
      expect(monitor.observe(observation({ tick: t, cars: [held] }))).toEqual([]);
    }
    expect(monitor.observe(observation({ tick: 14, cars: [held] }))).toHaveLength(1);
  });

  it("catches each of throttle, steer and air-roll, not just boost", () => {
    for (const over of [{ throttle: 0.8 }, { steer: -0.6 }, { roll: 1 }, { handbrake: true }]) {
      const found = checkNoIndefiniteHold({ ...held, controls: controls(over) }, 31, 30);
      expect(found).toHaveLength(1);
      expect(ids(found)).toEqual(["no-indefinite-hold"]);
    }
  });

  it("uses a default window short enough to be visible to a player", () => {
    // 30 ticks at SIM_HZ 120 is 250 ms. Asserted as arithmetic, not as a comment.
    expect(DEFAULT_MAX_STALE_HOLD_TICKS).toBe(30);
    expect(DEFAULT_MAX_STALE_HOLD_TICKS / 120).toBeLessThan(1);
  });
});

/* -------------------------------------------------------------------------- */
/* 6 — arena-cap                                                                */
/* -------------------------------------------------------------------------- */

describe("invariant: arena-cap", () => {
  it("is quiet at exactly the cap", () => {
    const cars = Array.from({ length: MAX_CARS }, (_, i) =>
      car({ slot: i, playerId: `c${i}`, sourceKey: `src:c${i}` }),
    );
    expect(checkArenaCap(observation({ cars, simCarCount: MAX_CARS }))).toEqual([]);
    expect(MAX_CARS).toBe(8);
  });

  it("BITES twice: a ninth car is both too many AND unaddressable", () => {
    const cars = Array.from({ length: MAX_CARS + 1 }, (_, i) =>
      car({ slot: i, playerId: `c${i}`, sourceKey: `src:c${i}` }),
    );
    const found = checkArenaCap(observation({ cars, simCarCount: MAX_CARS }));
    // Two findings, not one: the list is over the cap AND slot 8 is a slot the
    // bridge cannot address. Reporting only the first would leave the second to
    // be discovered after the "fix".
    expect(ids(found)).toEqual(["arena-cap", "arena-cap"]);
    expect(found[0].detail).toContain("9 cars");
    expect(found[1].detail).toContain("outside the addressable range");
  });

  it("BITES: the sim grew past the cap even though the host does not know", () => {
    const found = checkArenaCap(observation({ cars: [car()], simCarCount: 12 }));
    expect(ids(found)).toEqual(["arena-cap"]);
    expect(found[0].detail).toContain("simulation reports 12");
  });

  it("BITES: a slot the bridge cannot address", () => {
    for (const slot of [MAX_CARS, -1, 1.5]) {
      const found = checkArenaCap(observation({ cars: [car({ slot })] }));
      expect(ids(found)).toEqual(["arena-cap"]);
      expect(found[0].detail).toContain("outside the addressable range");
    }
  });
});

/* -------------------------------------------------------------------------- */
/* 7 — no-double-slot-assign                                                    */
/* -------------------------------------------------------------------------- */

describe("invariant: no-double-slot-assign", () => {
  it("is quiet when every slot has one owner", () => {
    const healthy = observation({
      cars: [
        car({ slot: 0, playerId: "c1" }),
        car({ slot: 1, playerId: "c2" }),
        car({ slot: 2, playerId: null, sourceKey: null }),
      ],
    });
    expect(checkNoDoubleSlotAssign(healthy)).toEqual([]);
  });

  it("BITES: two players holding slot 2", () => {
    const broken = observation({
      cars: [
        car({ slot: 2, playerId: "c1", sourceKey: "src:c1" }),
        car({ slot: 2, playerId: "c2", sourceKey: "src:c2" }),
      ],
    });
    const found = checkNoDoubleSlotAssign(broken);
    expect(ids(found)).toEqual(["no-double-slot-assign"]);
    expect(found[0].detail).toContain("c1, c2");
  });

  it("does NOT fire when one player appears twice on the SAME slot", () => {
    // That is a source-binding fault, not a roster fault. The two guards must
    // stay separable or a single bug produces a misleading diagnosis.
    const samePlayer = observation({
      cars: [
        car({ slot: 2, playerId: "c1", sourceKey: "src:a" }),
        car({ slot: 2, playerId: "c1", sourceKey: "src:b" }),
      ],
    });
    expect(checkNoDoubleSlotAssign(samePlayer)).toEqual([]);
    expect(ids(checkOneSourcePerSlot(samePlayer))).toEqual(["one-source-per-slot"]);
  });
});

/* -------------------------------------------------------------------------- */
/* The aggregate entry point and the monitor                                    */
/* -------------------------------------------------------------------------- */

describe("checkStability", () => {
  it("is silent on a healthy two-player tick", () => {
    const healthy = observation({
      tick: 42,
      cars: [
        car({ slot: 0, playerId: "c1", sourceKey: "src:c1", controls: controls({ throttle: 1 }) }),
        car({ slot: 1, playerId: "c2", sourceKey: "src:c2", controls: controls({ steer: -0.5 }) }),
      ],
      simCarCount: 2,
    });
    expect(checkStability(healthy)).toEqual([]);
  });

  it("reports EVERY independent fault in one call, not just the first", () => {
    const broken = observation({
      event: { reason: "blurred", scope: "all", playerId: null },
      cars: [
        // Two DIFFERENT sources on slot 0: one-source-per-slot.
        car({ slot: 0, playerId: "c1", sourceKey: "src:a", controls: controls({ throttle: 1 }) }),
        car({ slot: 0, playerId: "c2", sourceKey: "src:b", controls: controls({ boost: true }) }),
        // src:a also on slot 3: no-double-binding.
        car({ slot: 3, playerId: "c3", sourceKey: "src:a", controls: controls() }),
      ],
      simCarCount: 20,
    });
    const found = ids(checkStability(broken));
    // Slots 0 and 0 also give no-double-slot-assign; simCarCount gives arena-cap;
    // the two held controls give neutral-after-disruption. One pass tells the
    // operator everything, so a fix does not reveal the next fault.
    expect(new Set(found)).toEqual(
      new Set([
        "neutral-after-disruption",
        "one-source-per-slot",
        "no-double-binding",
        "no-double-slot-assign",
        "arena-cap",
      ]),
    );
  });
});

describe("the monitor", () => {
  it("starts healthy and stays healthy through repeated clean ticks", () => {
    const monitor = createStabilityMonitor();
    for (let t = 0; t < 100; t += 1) {
      expect(monitor.observe(observation({ tick: t }))).toEqual([]);
    }
    expect(monitor.isHealthy()).toBe(true);
    expect(summarizeViolations(monitor.violations())).toBe("stable: no invariant violated");
  });

  it("keeps two monitors completely independent", () => {
    const clean = createStabilityMonitor();
    // A zero-tick window reports the second consecutive quiet tick, so the
    // broken monitor needs two observations to have anything to say.
    const broken = createStabilityMonitor({ maxStaleHoldTicks: 0 });
    const held = car({ controls: controls({ boost: true }), freshInput: false });
    expect(broken.observe(observation({ tick: 0, cars: [held] }))).toEqual([]);
    expect(broken.observe(observation({ tick: 1, cars: [held] }))).toHaveLength(1);
    expect(clean.isHealthy()).toBe(true);
    expect(broken.isHealthy()).toBe(false);
  });

  it("reset() forgets the history", () => {
    const monitor = createStabilityMonitor();
    monitor.observe(observation({ cars: [car({ controllerPresent: false, controls: controls({ throttle: 1 }) })] }));
    expect(monitor.isHealthy()).toBe(false);
    monitor.reset();
    expect(monitor.isHealthy()).toBe(true);
  });
});

describe("the catalogue and reporting", () => {
  it("documents every invariant the guards can report, and none that cannot", () => {
    // Collect the ids the guards ACTUALLY emit, from a deliberately broken
    // observation per guard. If a catalogue entry has no matching guard, or a
    // guard reports an id with no catalogue entry, this fails.
    const held = car({ controls: controls({ boost: true }), freshInput: false });
    const emitted = new Set<string>();
    const collect = (found: readonly { invariant: string }[]): void => {
      for (const violation of found) emitted.add(violation.invariant);
    };

    collect(
      checkNeutralAfterDisruption(
        observation({ event: { reason: "blurred", scope: "all", playerId: null }, cars: [car({ controls: controls({ throttle: 1 }) })] }),
      ),
    );
    collect(
      checkVanishedControllerNeutral(
        observation({ cars: [car({ controllerPresent: false, controls: controls({ throttle: 1 }) })] }),
      ),
    );
    collect(checkOneSourcePerSlot(observation({ cars: [car({ sourceKey: null })] })));
    collect(
      checkNoDoubleBinding(
        observation({ cars: [car({ slot: 0 }), car({ slot: 1, sourceKey: "src:c1" })] }),
      ),
    );
    collect(checkNoIndefiniteHold(held, 31, 30));
    collect(checkArenaCap(observation({ cars: [car({ slot: 99 })], simCarCount: 20 })));
    collect(
      checkNoDoubleSlotAssign(
        observation({
          cars: [car({ slot: 2, playerId: "c1" }), car({ slot: 2, playerId: "c2" })],
        }),
      ),
    );

    expect(emitted.size).toBe(INVARIANTS.length);
    for (const meta of INVARIANTS) {
      expect(meta.title.length).toBeGreaterThan(10);
      expect(meta.why.length).toBeGreaterThan(40);
      expect(meta.response.length).toBeGreaterThan(10);
      expect(emitted.has(meta.id)).toBe(true);
      expect(invariantMeta(meta.id)).toBe(meta);
    }
  });

  it("summarises a violation list by invariant, most frequent first", () => {
    const monitor = createStabilityMonitor();
    monitor.observe(observation({ cars: [car({ slot: 99 })] }));
    const summary = summarizeViolations(monitor.violations());
    expect(summary).toContain("arena-cap");
  });
});
