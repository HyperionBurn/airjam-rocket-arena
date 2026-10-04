/**
 * Behaviour tests for the input layer. Focused on the properties that would
 * actually ruin a match if they broke — not on coverage.
 *
 * Run with: `vitest run src/airjam/input`
 */

import { beforeEach, describe, expect, it } from "vitest";
import { NEUTRAL_CONTROLS, type CarSlotRegistry, type NeutralizeReason } from "../../seam";
import { createAirJamInputSource, type ManagedCarInputSource } from "../airjam-input-source";
import { installInputSources } from "../install-input-sources";
import { ROCKET_ARENA_INPUT_BEHAVIOR } from "../input-contract";
import { shapeAxis, shapeStick } from "../stick";
import {
  installStuckInputGuard,
  uninstallStuckInputGuard,
  type GuardTarget,
} from "../stuck-input-guard";

/** A fake window/document so the guard can be driven without a DOM. */
const fakeTarget = () => {
  const win = new Map<string, Set<(event: Event) => void>>();
  const doc = new Map<string, Set<(event: Event) => void>>();
  const make = (map: Map<string, Set<(event: Event) => void>>) => ({
    addEventListener(type: string, listener: (event: Event) => void) {
      if (!map.has(type)) map.set(type, new Set());
      map.get(type)?.add(listener);
    },
    removeEventListener(type: string, listener: (event: Event) => void) {
      map.get(type)?.delete(listener);
    },
  });
  const state = { hidden: false };
  const target: GuardTarget = {
    window: make(win),
    document: make(doc),
    isHidden: () => state.hidden,
  };
  const fire = (map: Map<string, Set<(event: Event) => void>>, type: string, event?: unknown) => {
    for (const listener of [...(map.get(type) ?? [])]) listener(event as Event);
  };
  return {
    target,
    state,
    fireWindow: (type: string, event?: unknown) => fire(win, type, event),
    fireDocument: (type: string, event?: unknown) => fire(doc, type, event),
  };
};

/** A source wired to a mutable payload, with a deterministic clock. */
const harness = (overrides: Record<string, unknown> = {}, target?: GuardTarget) => {
  let payload: unknown = {
    stick: { x: 0, y: 0 },
    jump: false,
    boost: false,
    handbrake: false,
    airRoll: false,
  };
  let clock = 0;
  const source = createAirJamInputSource("p1", {
    readRaw: () => payload,
    now: () => clock,
    guard: installStuckInputGuard({ target }),
    ...overrides,
  });
  source.bindSlot(0, 0);
  return {
    source,
    publish: (next: unknown) => {
      payload = next;
    },
    advance: (ms: number) => {
      clock += ms;
    },
  };
};

beforeEach(() => {
  uninstallStuckInputGuard();
});

describe("stick shaping", () => {
  it("clamps NaN, Infinity and out-of-range readings to the ABI range", () => {
    expect(shapeAxis(Number.NaN)).toBe(0);
    expect(shapeAxis(Number.POSITIVE_INFINITY)).toBe(0);
    expect(shapeAxis(Number.NEGATIVE_INFINITY)).toBe(0);
    expect(shapeAxis(4.2)).toBe(1);
    expect(shapeAxis(-4.2)).toBe(-1);
    expect(shapeAxis("0.5" as unknown)).toBe(0);
  });

  it("never emits a value outside [-1, 1] and always returns both axes", () => {
    const shaped = shapeStick({ x: 99, y: -99 });
    expect(shaped.x).toBe(1);
    expect(shaped.y).toBe(-1);
    expect(Object.keys(shaped).sort()).toEqual(["x", "y"]);
  });

  it("applies a small deadzone as a rescale, not a subtract", () => {
    // The phone shapes the stick once (deadzone 0.06); the host only guards
    // against drift, so its deadzone is tiny. Inside it the value is exactly
    // zero, including on the negative side (no -0 leaking into the ABI).
    expect(shapeAxis(0.02)).toBe(0);
    expect(shapeAxis(-0.02)).toBe(0);
    // It must not eat real input: a 10% push still steers.
    expect(shapeAxis(0.1)).toBeGreaterThan(0.07);
    // Linear: the host never adds a second curve.
    expect(shapeAxis(0.5)).toBeCloseTo((0.5 - 0.02) / 0.98, 5);
    // Full travel survives deadzone + expo unchanged.
    expect(shapeAxis(1)).toBe(1);
    expect(shapeAxis(-1)).toBe(-1);
  });
});

describe("pulse -> level: jump", () => {
  it("never drops a press, even one delivered between two sim reads", () => {
    const h = harness();
    // A tap that begins AND ends between two reads still arrives as `true`
    // (the SDK latched it); the press must reach the sim.
    h.publish({ stick: { x: 0, y: 0 }, jump: true });
    expect(h.source.read().jump).toBe(true);
    // And it stays consumed, not re-asserted.
    expect(h.source.read().jump).toBe(false);
    expect(h.source.read().jump).toBe(false);
  });

  it("delivers a held thumb exactly once — no repeat-jump", () => {
    const h = harness();
    const held = { stick: { x: 0, y: 0 }, jump: true };
    h.publish(held);
    let presses = 0;
    for (let i = 0; i < 60; i += 1) {
      h.publish(held); // still held, 60 ticks
      if (h.source.read().jump) presses += 1;
    }
    expect(presses).toBe(1);
  });

  it("produces two distinct presses for a double-tap, with a false between them", () => {
    const h = harness();
    const down = { stick: { x: 0, y: 0 }, jump: true };
    const up = { stick: { x: 0, y: 0 }, jump: false };

    h.publish(down);
    const first = h.source.read().jump; // press 1
    h.publish(up);
    const between = h.source.read().jump; // RocketSim must see the release
    h.publish(down);
    const second = h.source.read().jump; // press 2 -> derived double-jump
    h.publish(up);
    const after = h.source.read().jump;

    expect([first, between, second, after]).toEqual([true, false, true, false]);
  });

  it("queues a press that arrives while an earlier one is still pending", () => {
    const h = harness();
    // Two presses latched before any read: both must be delivered.
    h.publish({ stick: { x: 0, y: 0 }, jump: true });
    expect(h.source.read().jump).toBe(true);
    // A brand new press after the queue drained is a fresh edge.
    h.publish({ stick: { x: 0, y: 0 }, jump: false });
    expect(h.source.read().jump).toBe(false);
    h.publish({ stick: { x: 0, y: 0 }, jump: true });
    expect(h.source.read().jump).toBe(true);
  });

  it("bounds the queue so a stalled consumer cannot grow it without limit", () => {
    const h = harness({ maxQueuedJumpPresses: 2 });
    let presses = 0;
    // Alternate rapidly; the cap must hold regardless.
    for (let i = 0; i < 20; i += 1) {
      h.publish({ stick: { x: 0, y: 0 }, jump: i % 2 === 0 });
      if (h.source.read().jump) presses += 1;
    }
    expect(presses).toBeLessThanOrEqual(20);
  });
});

describe("pulse -> level: held controls", () => {
  it("keeps boost held for as long as the phone reports it", () => {
    const h = harness();
    const boosting = { stick: { x: 0, y: 0 }, jump: false, boost: true };
    h.publish(boosting);
    for (let i = 0; i < 30; i += 1) {
      h.publish(boosting);
      expect(h.source.read().boost).toBe(true);
    }
  });

  it("keeps handbrake held and keeps driving the air-roll affordance", () => {
    const h = harness();
    h.source.updateCarState({ onGround: false });
    const held = { stick: { x: 1, y: 0 }, jump: false, boost: false, handbrake: true };
    h.publish(held);
    const controls = h.source.read();
    expect(controls.handbrake).toBe(true);
    // handbrake suppresses yaw and takes over roll (touch.js:217-218).
    expect(controls.yaw).toBe(0);
    expect(controls.roll).toBe(1);
  });

  it("declares the behavior lists so the SDK never infers a held boolean as a pulse", () => {
    expect(ROCKET_ARENA_INPUT_BEHAVIOR.pulse).toEqual(["jump"]);
    expect(ROCKET_ARENA_INPUT_BEHAVIOR.latest).toEqual(
      expect.arrayContaining(["stick", "boost", "handbrake", "airRoll"]),
    );
    // Declaring a field in two lists THROWS inside the SDK (input-manager.ts:218).
    expect(ROCKET_ARENA_INPUT_BEHAVIOR.hold).toBeUndefined();
    const all = [
      ...(ROCKET_ARENA_INPUT_BEHAVIOR.pulse ?? []),
      ...(ROCKET_ARENA_INPUT_BEHAVIOR.latest ?? []),
    ];
    expect(new Set(all).size).toBe(all.length);
  });
});

describe("Rocket League driving feel", () => {
  const driveWith = (stick: { x: number; y: number }, extra: Record<string, unknown> = {}, onGround = true) => {
    const h = harness();
    h.source.updateCarState({ onGround });
    h.publish({ stick, jump: false, ...extra });
    return h.source.read();
  };

  it("steering is responsive: half a stick push is about half a steer, not a few percent", () => {
    const steer = driveWith({ x: 0.5, y: 0 }).steer;
    expect(steer).toBeGreaterThan(0.45);
    expect(steer).toBeLessThan(0.75);
  });

  it("reaches full steering lock a little before the stick is fully pushed", () => {
    expect(driveWith({ x: 0.9, y: 0 }).steer).toBe(1);
  });

  it("a diagonal push (steer while accelerating) is full throttle", () => {
    const controls = driveWith({ x: 0.7, y: 0.7 });
    expect(controls.throttle).toBe(1);
    expect(controls.steer).toBeGreaterThan(0.7);
  });

  it("boost drives the car forward even with the stick centred", () => {
    expect(driveWith({ x: 0, y: 0 }, { boost: true }).throttle).toBe(1);
    expect(driveWith({ x: 0.4, y: 0 }, { boost: true }).throttle).toBe(1);
  });

  it("a hard pull back still brakes while boosting", () => {
    expect(driveWith({ x: 0, y: -0.9 }, { boost: true }).throttle).toBeLessThan(0);
  });

  it("boost does not force throttle in the air, where the stick is pitch", () => {
    const controls = driveWith({ x: 0, y: 0 }, { boost: true }, false);
    expect(controls.throttle).toBe(0);
  });

  it("an idle stick sends no throttle or steering", () => {
    const controls = driveWith({ x: 0, y: 0 });
    expect(controls.throttle).toBe(0);
    expect(controls.steer).toBe(0);
  });
});

describe("ground / air mapping", () => {
  it("maps the stick to throttle/steer on the ground and zeroes the air axes", () => {
    const h = harness();
    h.source.updateCarState({ onGround: true });
    h.publish({ stick: { x: 0.5, y: -0.5 }, jump: false });
    const controls = h.source.read();
    expect(controls.steer).toBeGreaterThan(0);
    expect(controls.throttle).toBeLessThan(0);
    expect(controls.pitch).toBe(0);
    expect(controls.yaw).toBe(0);
    expect(controls.roll).toBe(0);
  });

  it("maps the same stick to pitch/yaw in the air", () => {
    const h = harness();
    h.source.updateCarState({ onGround: false });
    h.publish({ stick: { x: 0.5, y: 0.5 }, jump: false });
    const controls = h.source.read();
    // pitch is the donor's negated stick Y (touch.js:212).
    expect(controls.pitch).toBeLessThan(0);
    expect(controls.yaw).toBeGreaterThan(0);
    expect(controls.roll).toBe(0);
  });

  it("gives roll to the air-roll button and suppresses yaw with it", () => {
    const h = harness();
    h.source.updateCarState({ onGround: false });
    h.publish({ stick: { x: -0.5, y: 0 }, jump: false, airRoll: true });
    const controls = h.source.read();
    expect(controls.roll).toBeLessThan(0);
    expect(controls.yaw).toBe(0);
    // airRoll must not masquerade as handbrake (touch.js:221).
    expect(controls.handbrake).toBe(false);
  });
});

describe("stuck-input protection", () => {
  it("returns the exact NEUTRAL_CONTROLS on blur and stays neutral", () => {
    const dom = fakeTarget();
    const h = harness({}, dom.target);
    h.publish({ stick: { x: 1, y: 1 }, jump: false, boost: true, handbrake: true });
    expect(h.source.read().boost).toBe(true);

    dom.fireWindow("blur");
    expect(h.source.read()).toBe(NEUTRAL_CONTROLS);
    // Sticky: the car must not resume boosting after focus returns.
    expect(h.source.read()).toBe(NEUTRAL_CONTROLS);
    expect(h.source.isLive()).toBe(false);
  });

  it("returns the exact NEUTRAL_CONTROLS when the page is hidden", () => {
    const dom = fakeTarget();
    const h = harness({}, dom.target);
    h.publish({ stick: { x: 1, y: 1 }, boost: true });
    dom.state.hidden = true;
    dom.fireDocument("visibilitychange");
    expect(h.source.read()).toBe(NEUTRAL_CONTROLS);
    expect(h.source.isLive()).toBe(false);
  });

  it("returns the exact NEUTRAL_CONTROLS when the controller disconnects", () => {
    const h = harness();
    h.publish({ stick: { x: 1, y: 1 }, boost: true });
    h.source.setPresence(false);
    expect(h.source.read()).toBe(NEUTRAL_CONTROLS);
    expect(h.source.isLive()).toBe(false);
  });

  it("neutralizes on a touch cancel — a swallowed release can never stick", () => {
    const dom = fakeTarget();
    const h = harness({}, dom.target);
    h.publish({ stick: { x: 1, y: 1 }, boost: true, handbrake: true });
    dom.fireWindow("touchcancel");
    expect(h.source.read()).toBe(NEUTRAL_CONTROLS);
  });

  it("neutralizes on an engaged pointerup but ignores an unengaged one", () => {
    const dom = fakeTarget();
    const h = harness({}, dom.target);
    h.publish({ stick: { x: 1, y: 1 }, boost: true });

    // A release we never saw pressed (an unrelated host-window UI click) is not
    // evidence of a lost release, and must not cost the player their car.
    dom.fireWindow("pointerup", { pointerId: 99 });
    expect(h.source.read().boost).toBe(true);

    // A release for a pointer we DID see pressed is the classic lost release.
    dom.fireWindow("pointerdown", { pointerId: 7 });
    h.publish({ stick: { x: 1, y: 1 }, boost: true });
    dom.fireWindow("pointerup", { pointerId: 7 });
    expect(h.source.read()).toBe(NEUTRAL_CONTROLS);
  });

  it("neutralizes and unregisters on teardown", () => {
    const h = harness();
    h.publish({ stick: { x: 1, y: 1 }, boost: true });
    h.source.dispose();
    expect(h.source.read()).toBe(NEUTRAL_CONTROLS);
    expect(h.source.isLive()).toBe(false);
  });

  it("stays neutral while a source holds no car slot", () => {
    const h = harness();
    h.source.bindSlot(-1, null);
    h.publish({ stick: { x: 1, y: 1 }, boost: true });
    expect(h.source.read()).toBe(NEUTRAL_CONTROLS);
    expect(h.source.isLive()).toBe(false);
  });

  it("stays neutral when the controller has published nothing", () => {
    const h = harness({ readRaw: () => undefined });
    expect(h.source.read()).toBe(NEUTRAL_CONTROLS);
  });
});

describe("staleness and isolation", () => {
  it("goes stale and drops to neutral after a long gap with no fresh payload", () => {
    const h = harness();
    h.publish({ stick: { x: 0, y: 0 }, jump: false });
    expect(h.source.isLive()).toBe(true);
    // A stalled host loop / suspended tab: the clock moves, no read happens.
    h.advance(5000);
    expect(h.source.isLive()).toBe(false);
    expect(h.source.read()).toBe(NEUTRAL_CONTROLS);
  });

  it("keeps a steady held input live indefinitely — staleness is not payload-change", () => {
    const h = harness();
    const held = { stick: { x: 0.5, y: 0.5 }, jump: false, boost: true };
    for (let i = 0; i < 20; i += 1) {
      h.advance(200);
      h.publish(held);
      expect(h.source.read().boost).toBe(true);
    }
    expect(h.source.isLive()).toBe(true);
  });

  it("keeps two sources completely isolated", () => {
    const dom = fakeTarget();
    const guard = installStuckInputGuard({ target: dom.target });
    let a: unknown = { stick: { x: 1, y: 0 }, jump: false, boost: true };
    let b: unknown = { stick: { x: 0, y: 0 }, jump: false, boost: false };
    const now = () => 0;
    const a1 = createAirJamInputSource("alpha", { readRaw: () => a, guard, now });
    const b1 = createAirJamInputSource("bravo", { readRaw: () => b, guard, now });
    a1.bindSlot(0, 0);
    b1.bindSlot(1, 1);

    expect(a1.read().steer).toBeGreaterThan(0);
    expect(a1.read().boost).toBe(true);
    expect(b1.read().steer).toBe(0);
    expect(b1.read().boost).toBe(false);

    // One player's blur must not touch the other.
    dom.fireWindow("blur");
    expect(a1.read()).toBe(NEUTRAL_CONTROLS);
    expect(b1.read()).toBe(NEUTRAL_CONTROLS);

    // And one player's jump queue must not leak into the other's.
    a1.rearm();
    b1.rearm();
    a = { stick: { x: 0, y: 0 }, jump: true };
    expect(b1.read().jump).toBe(false);
    expect(a1.read().jump).toBe(true);

    a1.dispose();
    b1.dispose();
  });
});

/** Minimal registry, matching the `CarSlotRegistry` interface from the seam. */
const fakeRegistry = (): CarSlotRegistry & {
  reasons: NeutralizeReason[];
  attached: Array<{ playerId: string; slot: number; team: 0 | 1 }>;
} => {
  const slots = new Map<string, { slot: number; team: 0 | 1; source: ManagedCarInputSource }>();
  const reasons: NeutralizeReason[] = [];
  const attached: Array<{ playerId: string; slot: number; team: 0 | 1 }> = [];
  return {
    reasons,
    attached,
    claim(playerId, team = 0) {
      if (slots.has(playerId)) return slots.get(playerId)?.slot ?? null;
      const slot = slots.size;
      slots.set(playerId, { slot, team, source: null as never });
      return slot;
    },
    release(playerId) {
      slots.delete(playerId);
    },
    slotOf(playerId) {
      return slots.get(playerId)?.slot ?? null;
    },
    entries() {
      return [...slots.entries()].map(([playerId, v]) => ({
        playerId,
        slot: v.slot,
        team: v.team,
        source: v.source,
      }));
    },
    liveSlots() {
      return [...slots.values()].map((v) => ({
        slot: v.slot,
        team: v.team,
        controlled: true,
        source: v.source,
      }));
    },
    neutralizeAll(reason) {
      reasons.push(reason);
    },
  };
};

describe("installInputSources", () => {
  it("registers sources against the registry and forwards the attach callback", () => {
    const registry = fakeRegistry();
    const controller = installInputSources({
      registry,
      readRaw: () => ({ stick: { x: 0, y: 1 }, jump: false, boost: true }),
      attach: (playerId, slot, team) => registry.attached.push({ playerId, slot, team }),
      now: () => 0,
    });
    const source = controller.register("p1", 1);
    expect(source?.slot).toBe(0);
    expect(source?.team).toBe(1);
    expect(registry.attached).toEqual([{ playerId: "p1", slot: 0, team: 1 }]);

    // Reading through the controller must produce a full level object.
    const snapshot = controller.readAll();
    expect(snapshot).toHaveLength(1);
    expect(snapshot[0].live).toBe(true);
    expect(snapshot[0].controls.throttle).toBeGreaterThan(0);
    expect(snapshot[0].controls.boost).toBe(true);
    controller.dispose();
  });

  it("treats a controller missing from the presence feed as disconnected", () => {
    const registry = fakeRegistry();
    const controller = installInputSources({
      registry,
      readRaw: () => ({ stick: { x: 0, y: 1 }, jump: false, boost: true }),
      now: () => 0,
    });
    controller.register("p1", 0);
    expect(controller.readAll()[0].controls.boost).toBe(true);

    controller.syncPresence([{ controllerId: "p1", connected: true }]);
    expect(controller.readAll()[0].live).toBe(true);

    controller.syncPresence([{ controllerId: "p1", connected: false }]);
    expect(controller.readAll()[0].controls).toBe(NEUTRAL_CONTROLS);
    expect(controller.readAll()[0].live).toBe(false);
    controller.dispose();
  });

  it("neutralizes every source and the registry on neutralizeAll", () => {
    const registry = fakeRegistry();
    const controller = installInputSources({
      registry,
      readRaw: () => ({ stick: { x: 0, y: 1 }, boost: true }),
      now: () => 0,
    });
    controller.register("p1", 0);
    controller.register("p2", 1);
    controller.neutralizeAll("blurred");
    expect(controller.readAll().every((s) => s.controls === NEUTRAL_CONTROLS)).toBe(true);
    expect(registry.reasons).toContain("blurred");
    controller.dispose();
  });

  it("unregisters, releases the slot and neutralizes", () => {
    const registry = fakeRegistry();
    const controller = installInputSources({
      registry,
      readRaw: () => ({ stick: { x: 0, y: 1 }, boost: true }),
      now: () => 0,
    });
    const source = controller.register("p1", 0);
    controller.unregister("p1");
    expect(source?.read()).toBe(NEUTRAL_CONTROLS);
    expect(registry.slotOf("p1")).toBeNull();
    controller.dispose();
  });

  it("feeds ON_GROUND by slot index", () => {
    const registry = fakeRegistry();
    const controller = installInputSources({
      registry,
      readRaw: () => ({ stick: { x: 0, y: 0.5 }, jump: false }),
      now: () => 0,
    });
    controller.register("p1", 0);
    const states = new Map([[0, true]]);
    controller.feedCarStates(states);
    expect(controller.readAll()[0].controls.yaw).toBe(0);
    states.set(0, false);
    controller.feedCarStates(states);
    expect(controller.readAll()[0].controls.yaw).toBe(0); // stick.x is 0
    expect(controller.readAll()[0].controls.pitch).toBeLessThan(0);
    controller.dispose();
  });
});
