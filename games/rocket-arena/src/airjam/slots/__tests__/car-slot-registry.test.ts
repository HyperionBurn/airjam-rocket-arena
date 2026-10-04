import { describe, expect, it } from "vitest";

import { NEUTRAL_CONTROLS } from "../../seam.js";
import { createCarSlotRegistry, pushControls } from "../car-slot-registry.js";
import type { ManagedCarSlotRegistry } from "../car-slot-registry.js";
import type { Team } from "../team-balance.js";
import { makeFakeSim, makeFakeSource } from "./fakes.js";
import type { FakeSource } from "./fakes.js";

/**
 * Builds a registry whose sources the test keeps a handle on, keyed by player
 * id, so input isolation can be asserted on the exact objects the host would
 * be reading.
 */
const harness = (
  options: { maxCars?: number; withSim?: boolean } = {},
): {
  registry: ManagedCarSlotRegistry;
  sources: Map<string, FakeSource>;
  sim: ReturnType<typeof makeFakeSim>;
} => {
  const sources = new Map<string, FakeSource>();
  const sim = makeFakeSim();
  const registry = createCarSlotRegistry({
    maxCars: options.maxCars ?? 8,
    createSource: (playerId, slot, team) => {
      const source = makeFakeSource(playerId, slot, team);
      sources.set(playerId, source);
      return source;
    },
    ...(options.withSim === false ? {} : { sim }),
  });
  return { registry, sources, sim };
};

const teamsOf = (registry: ManagedCarSlotRegistry): Team[] =>
  registry.entries().map((entry) => entry.team);

describe("createCarSlotRegistry — distinct cars and distinct control objects", () => {
  it("gives two players two different cars with two different sources", () => {
    const { registry, sources } = harness();

    const a = registry.claim("phone-a");
    const b = registry.claim("phone-b");

    expect(a).toBe(0);
    expect(b).toBe(1);
    expect(a).not.toBe(b);
    expect(registry.slotOf("phone-a")).toBe(0);
    expect(registry.slotOf("phone-b")).toBe(1);
    expect(sources.get("phone-a")).not.toBe(sources.get("phone-b"));
    expect(sources.get("phone-a")!.slot).toBe(0);
    expect(sources.get("phone-b")!.slot).toBe(1);
  });

  it("gives four players four cars", () => {
    const { registry } = harness();
    const slots = ["a", "b", "c", "d"].map((id) => registry.claim(id));

    expect(slots).toEqual([0, 1, 2, 3]);
    expect(new Set(slots).size).toBe(4);
    expect(registry.entries()).toHaveLength(4);
    expect(registry.liveSlots().map((live) => live.slot)).toEqual([0, 1, 2, 3]);
    expect(registry.freeSlots()).toEqual([4, 5, 6, 7]);
  });

  it("honours an explicit team and auto-balances the rest", () => {
    const { registry } = harness();

    expect(registry.claim("a", 1)).toBe(0);
    expect(registry.claim("b", 1)).toBe(1);
    expect(teamsOf(registry)).toEqual([1, 1]);
  });
});

describe("createCarSlotRegistry — input isolation", () => {
  it("never lets one player's input reach another player's car", () => {
    const { registry, sources, sim } = harness();
    registry.claim("a");
    registry.claim("b");

    const a = sources.get("a")!;
    const b = sources.get("b")!;

    // Player A floors it; player B does nothing at all.
    a.controls = { ...a.controls, throttle: 1, boost: true, steer: -0.5 };
    b.controls = { ...b.controls, throttle: 0 };

    // B's source still reads B's own values — not A's.
    expect(b.read().throttle).toBe(0);
    expect(b.read().boost).toBe(false);
    expect(b.controls).not.toBe(a.controls);
    expect(a.read().throttle).toBe(1);

    // And the sim received one independent object per slot.
    const pushed = pushControls(registry, sim);
    expect(pushed.map((entry) => entry.slot)).toEqual([0, 1]);
    expect(sim.lastFor(0)!.throttle).toBe(1);
    expect(sim.lastFor(0)!.boost).toBe(true);
    expect(sim.lastFor(1)!.throttle).toBe(0);
    expect(sim.lastFor(1)!.boost).toBe(false);
  });

  it("substitutes neutral controls for a source that is not live", () => {
    const { registry, sources, sim } = harness();
    registry.claim("a");
    const a = sources.get("a")!;
    a.controls = { ...a.controls, throttle: 1 };
    a.live = false;

    pushControls(registry, sim);

    expect(sim.lastFor(0)).toEqual(NEUTRAL_CONTROLS);
  });
});

describe("createCarSlotRegistry — team auto-balance", () => {
  it("splits two players 1/1, four 2/2 and six 3/3", () => {
    for (const [count, expected] of [
      [2, [0, 1]],
      [4, [0, 1, 0, 1]],
      [6, [0, 1, 0, 1, 0, 1]],
    ] as const) {
      const { registry } = harness();
      for (let i = 0; i < count; i += 1) registry.claim(`p${i}`);
      const teams = teamsOf(registry);
      expect(teams).toEqual(expected);
      const perTeam = teams.filter((team) => team === 0).length;
      expect(perTeam).toBe(count - perTeam); // never lopsided
    }
  });
});

describe("createCarSlotRegistry — release and neutralize", () => {
  it("neutralizes the source AND the sim slot before freeing it", () => {
    const { registry, sources, sim } = harness();
    registry.claim("a");
    const source = sources.get("a")!;
    source.controls = { ...source.controls, throttle: 1, boost: true };

    registry.release("a");

    // Neutralized on the source...
    expect(source.neutralized).toEqual(["released"]);
    expect(source.read()).toEqual(NEUTRAL_CONTROLS);
    // ...and the sim's control buffer for that slot was zeroed too, so the car
    // cannot coast on with a stuck throttle.
    expect(sim.lastFor(0)).toEqual(NEUTRAL_CONTROLS);
    // Only then freed.
    expect(registry.slotOf("a")).toBeNull();
    expect(registry.freeSlots()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it("neutralizeAll reaches every source and every bot seat", () => {
    const { registry, sources, sim } = harness();
    for (const id of ["a", "b", "c", "d"]) registry.claim(id);
    registry.addBotSeat(0);

    registry.neutralizeAll("blurred");

    for (const id of ["a", "b", "c", "d"]) {
      expect(sources.get(id)!.neutralized).toContain("blurred");
      expect(sim.lastFor(registry.slotOf(id)!)).toEqual(NEUTRAL_CONTROLS);
    }
    // The bot seat has no source but its control buffer is still zeroed.
    const botSlot = registry.liveSlots().find((live) => !live.controlled)!.slot;
    expect(sim.lastFor(botSlot)).toEqual(NEUTRAL_CONTROLS);
    // Bindings survive a blur — only release frees a slot.
    expect(registry.entries()).toHaveLength(4);
  });

  it("is safe to call neutralizeAll repeatedly", () => {
    // `seam.ts:171` makes `neutralize` itself idempotent, but the registry must
    // still REACH every source on each call — that is the point of the method.
    // So the guarantee under test is safety and a neutral end state, not a
    // de-duplicated call count.
    const { registry, sources, sim } = harness();
    registry.claim("a");
    registry.claim("b");
    sources.get("a")!.controls = { ...NEUTRAL_CONTROLS, throttle: 1, boost: true };

    expect(() => {
      registry.neutralizeAll("blurred");
      registry.neutralizeAll("disconnected");
    }).not.toThrow();

    expect(sources.get("a")!.read()).toEqual(NEUTRAL_CONTROLS);
    expect(sources.get("b")!.read()).toEqual(NEUTRAL_CONTROLS);
    expect(sim.lastFor(0)).toEqual(NEUTRAL_CONTROLS);
    expect(sim.lastFor(1)).toEqual(NEUTRAL_CONTROLS);
    // Blur does not unbind: the players keep their cars.
    expect(registry.entries()).toHaveLength(2);
  });
});

describe("createCarSlotRegistry — slot persistence across a reconnect", () => {
  it("returns the SAME slot when a player re-claims while still holding it", () => {
    const { registry } = harness();
    const first = registry.claim("phone-a");
    const again = registry.claim("phone-a");
    const third = registry.claim("phone-a");

    expect(again).toBe(first);
    expect(third).toBe(first);
    expect(registry.entries()).toHaveLength(1);
  });

  it("returns the SAME slot after a release + reconnect", () => {
    const { registry } = harness();
    const first = registry.claim("phone-a")!;
    registry.claim("phone-b");
    registry.release("phone-a");

    expect(registry.slotOf("phone-a")).toBeNull();
    const reconnected = registry.claim("phone-a");

    expect(reconnected).toBe(first);
    expect(registry.slotOf("phone-b")).toBe(1); // nobody else was moved
  });

  it("hands the retained slot to whoever claimed it first when it is taken", () => {
    const { registry } = harness();
    const first = registry.claim("phone-a")!;
    registry.release("phone-a");
    const takenByB = registry.claim("phone-b")!;

    expect(takenByB).toBe(first);
    // "Where possible": the slot is gone, so A gets a fresh car rather than
    // stealing B's.
    const reconnected = registry.claim("phone-a");
    expect(reconnected).not.toBe(first);
    expect(reconnected).toBe(1);
  });

  it("keeps retention bounded so a long match cannot leak slots", () => {
    const { registry } = harness({ maxCars: 8 });
    for (let i = 0; i < 8; i += 1) registry.claim(`p${i}`);
    for (let i = 0; i < 8; i += 1) registry.release(`p${i}`);
    // The most recent owners are still remembered; the oldest ones are not.
    expect(registry.lastSlotOf("p7")).toBe(7);
    expect(registry.lastSlotOf("p0")).toBe(-1);
  });
});

describe("createCarSlotRegistry — capacity", () => {
  it("returns null instead of throwing when the arena is full", () => {
    const { registry } = harness({ maxCars: 2 });
    expect(registry.claim("a")).toBe(0);
    expect(registry.claim("b")).toBe(1);
    expect(registry.claim("c")).toBeNull();
    expect(registry.slotOf("c")).toBeNull();
  });

  it("never allocates past the donor's MAX_CARS of 8", () => {
    const { registry } = harness({ maxCars: 99 });
    const slots: (number | null)[] = [];
    for (let i = 0; i < 10; i += 1) slots.push(registry.claim(`p${i}`));
    expect(slots).toEqual([0, 1, 2, 3, 4, 5, 6, 7, null, null]);
  });
});
