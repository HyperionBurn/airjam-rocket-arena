/**
 * The phone-as-remote-input behaviours added for the local match: lobby intents
 * riding the input payload, the ball-cam press COUNT, and the liveness rules.
 *
 * Each of these guards a failure that was real while the match was being
 * brought up: a source that went stale in the countdown and never recovered, a
 * sticky disconnect that nothing re-armed, and a shared per-tick snapshot that
 * ate jump presses.
 */
import { beforeEach, describe, expect, it } from "vitest";

import { createAirJamInputSource } from "../airjam-input-source";
import { parseRocketArenaInput } from "../input-contract";
import { installStuckInputGuard, uninstallStuckInputGuard, type GuardTarget } from "../stuck-input-guard";
import { createTickGate } from "@/host/runtime";

const quietTarget: GuardTarget = {
  window: { addEventListener: () => {}, removeEventListener: () => {} },
  document: { addEventListener: () => {}, removeEventListener: () => {} },
  isHidden: () => false,
};

const make = (options: { staleAfterMs?: number } = {}) => {
  let payload: unknown = { stick: { x: 0, y: 1 }, lobby: { ready: true, team: "blue", name: "Ada" }, ballCamPresses: 0 };
  let clock = 0;
  const source = createAirJamInputSource("p1", {
    readRaw: () => payload,
    now: () => clock,
    guard: installStuckInputGuard({ target: quietTarget }),
    ...options,
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

beforeEach(() => uninstallStuckInputGuard());

describe("lobby intents on the input payload", () => {
  it("parses ready / team / name and defaults a missing or odd field safely", () => {
    expect(parseRocketArenaInput({ lobby: { ready: true, team: "orange", name: "Zed", carId: "fennec" } }).lobby).toEqual({
      ready: true,
      team: "orange",
      name: "Zed",
      carId: "fennec",
    });
    expect(parseRocketArenaInput({ lobby: { ready: "yes", team: "purple", name: 7, carId: 3 } }).lobby).toEqual({
      ready: false,
      team: "auto",
      name: "",
      carId: null,
    });
    // An empty car id is "no preference", not a car called "".
    expect(parseRocketArenaInput({ lobby: { carId: "" } }).lobby?.carId).toBeNull();
    expect(parseRocketArenaInput({}).lobby).toBeNull();
    expect(parseRocketArenaInput({ lobby: 3 }).lobby).toBeNull();
    expect(parseRocketArenaInput({ lobby: { name: "x".repeat(99) } }).lobby?.name).toHaveLength(24);
  });

  it("lets the host peek the lobby without a car being driven", () => {
    const { source } = make();
    expect(source.peekLobby()).toEqual({ ready: true, team: "blue", name: "Ada", carId: null });
  });
});

describe("ball cam press count", () => {
  it("toggles once per increment and never replays history on first sight", () => {
    const { source, publish } = make();
    // A phone that reconnects with an old count of 7 must not toggle 7 times.
    publish({ stick: { x: 0, y: 0 }, ballCamPresses: 7 });
    source.read();
    expect(source.takeBallCamToggles()).toBe(0);

    publish({ stick: { x: 0, y: 0 }, ballCamPresses: 8 });
    source.read();
    expect(source.takeBallCamToggles()).toBe(1);
    expect(source.takeBallCamToggles()).toBe(0); // consumed

    // Two taps between two reads are both counted (and cancel out in the host).
    publish({ stick: { x: 0, y: 0 }, ballCamPresses: 10 });
    source.read();
    expect(source.takeBallCamToggles()).toBe(2);
  });

  it("ignores a controller that does not send the field", () => {
    const { source, publish } = make();
    publish({ stick: { x: 0, y: 0 } });
    source.read();
    expect(source.takeBallCamToggles()).toBe(0);
  });
});

describe("liveness", () => {
  it("a source nobody reads for a while is stale and cannot recover on its own (the old default)", () => {
    const { source, advance } = make();
    expect(source.isLive()).toBe(true);
    advance(3000); // a 3 s kickoff countdown with no reads
    expect(source.isLive()).toBe(false);
    expect(source.read().throttle).toBe(0);
    // Stale is judged BEFORE the clock refresh, so reading does not heal it.
    expect(source.isLive()).toBe(false);
  });

  it("with idle-staleness off, presence is the only 'gone' signal and a long pause is harmless", () => {
    const { source, advance } = make({ staleAfterMs: Number.POSITIVE_INFINITY });
    advance(10 * 60 * 1000);
    expect(source.isLive()).toBe(true);
    expect(source.read().throttle).toBeGreaterThan(0);
  });

  it("neutralises on disconnect and re-arms by itself on reconnect", () => {
    const { source } = make({ staleAfterMs: Number.POSITIVE_INFINITY });
    source.setPresence(false);
    expect(source.isLive()).toBe(false);
    expect(source.read().throttle).toBe(0);

    source.setPresence(true);
    expect(source.isLive()).toBe(true);
    expect(source.read().throttle).toBeGreaterThan(0);
  });

  it("does NOT clear a blur/hidden latch just because presence says 'connected'", () => {
    const { source } = make({ staleAfterMs: Number.POSITIVE_INFINITY });
    source.neutralize("blurred");
    source.setPresence(true);
    expect(source.describe().stickyReason).toBe("blurred");
    expect(source.isLive()).toBe(false);
  });

  it("explains itself", () => {
    const { source } = make();
    expect(source.describe()).toMatchObject({ live: true, slot: 0, stickyReason: null, present: true, stale: false });
  });
});

describe("per-tick input snapshot gate", () => {
  it("computes once for all the calls of one tick", () => {
    let now = 0;
    const gate = createTickGate(4, () => now);
    expect(gate.shouldCompute(100)).toBe(true); // first car asked
    now += 0.01;
    expect(gate.shouldCompute(100)).toBe(false); // second car, same tick
    now += 0.01;
    expect(gate.shouldCompute(100)).toBe(false); // third car, same tick
    expect(gate.shouldCompute(101)).toBe(true); // next tick
  });

  it("recomputes while the tick number is frozen (countdown, pause, replay)", () => {
    let now = 0;
    const gate = createTickGate(4, () => now);
    expect(gate.shouldCompute(100)).toBe(true);
    now += 16; // one display frame later, the sim has not stepped
    expect(gate.shouldCompute(100)).toBe(true);
  });

  it("always recomputes when the tick cannot be read, and on invalidate", () => {
    let now = 0;
    const gate = createTickGate(4, () => now);
    expect(gate.shouldCompute(Number.NaN)).toBe(true);
    expect(gate.shouldCompute(Number.NaN)).toBe(true);
    expect(gate.shouldCompute(5)).toBe(true);
    expect(gate.shouldCompute(5)).toBe(false);
    gate.invalidate();
    expect(gate.shouldCompute(5)).toBe(true);
  });
});
