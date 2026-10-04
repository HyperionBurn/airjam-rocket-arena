/**
 * Gamepad support: the pure mapping and the hub (connect, lobby buttons, edges,
 * ball cam, drop-out, rumble). The browser's Gamepad API is replaced by a fake.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  BUTTON,
  createGamepadHub,
  isPadId,
  mapPadToControls,
  padFamily,
  shapePadStick,
  type GamepadHub,
  type PadSnapshot,
} from "../gamepads";

const BUTTON_COUNT = 17;

const makePad = (
  index: number,
  overrides: { id?: string; axes?: number[]; down?: number[]; analog?: Record<number, number>; connected?: boolean } = {},
): PadSnapshot & { vibrationActuator: { playEffect: ReturnType<typeof vi.fn> } } => ({
  index,
  id: overrides.id ?? "Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)",
  connected: overrides.connected ?? true,
  mapping: "standard",
  axes: overrides.axes ?? [0, 0, 0, 0],
  buttons: Array.from({ length: BUTTON_COUNT }, (_, button) => {
    const value = overrides.analog?.[button] ?? (overrides.down?.includes(button) ? 1 : 0);
    return { pressed: value > 0.5 || Boolean(overrides.down?.includes(button)), value };
  }),
  vibrationActuator: { playEffect: vi.fn().mockResolvedValue("complete") },
});

/** A hub over a mutable list of fake pads, plus a way to "press" and re-read. */
const rig = (phase = "lobby") => {
  let pads: Array<ReturnType<typeof makePad> | null> = [];
  let clock = 0;
  const hub: GamepadHub = createGamepadHub({
    getPads: () => pads,
    getPhase: () => phase,
    now: () => (clock += 10),
    intervalMs: 1e9,
  });
  return {
    hub,
    set: (next: Array<ReturnType<typeof makePad> | null>) => {
      pads = next;
      // `read` re-polls on demand once the clock has moved on.
    },
    setPhase: (next: string) => {
      phase = next;
      hub.setPhaseSource(() => next);
    },
  };
};

let current: GamepadHub | null = null;
afterEach(() => {
  current?.dispose();
  current = null;
});

describe("stick shaping", () => {
  it("rejects drift inside the radial deadzone", () => {
    expect(shapePadStick(0.08, -0.05)).toEqual({ x: 0, y: 0 });
  });

  it("rescales the live band so full push is exactly 1, on the diagonal too", () => {
    const full = shapePadStick(1, 0);
    expect(full.x).toBeCloseTo(1, 5);
    const diagonal = shapePadStick(Math.SQRT1_2, Math.SQRT1_2);
    expect(Math.hypot(diagonal.x, diagonal.y)).toBeCloseTo(1, 5);
  });

  it("is linear: half a push is a bit under half", () => {
    const half = shapePadStick(0.5, 0);
    expect(half.x).toBeGreaterThan(0.4);
    expect(half.x).toBeLessThan(0.5);
  });

  it("never returns NaN", () => {
    expect(shapePadStick(Number.NaN, Number.POSITIVE_INFINITY)).toEqual({ x: 0, y: 0 });
  });
});

describe("button and axis mapping", () => {
  it("steers with the left stick and flips Y so up is forward", () => {
    const controls = mapPadToControls(makePad(0, { axes: [0.9, -0.9] }));
    expect(controls.stick.x).toBeGreaterThan(0.7);
    expect(controls.stick.y).toBeGreaterThan(0.7);
  });

  it("throttle is RT minus LT, analog", () => {
    expect(mapPadToControls(makePad(0, { analog: { [BUTTON.RT]: 1 } })).throttle).toBe(1);
    expect(mapPadToControls(makePad(0, { analog: { [BUTTON.LT]: 1 } })).throttle).toBe(-1);
    expect(mapPadToControls(makePad(0, { analog: { [BUTTON.RT]: 0.6, [BUTTON.LT]: 0.6 } })).throttle).toBeCloseTo(0, 5);
    expect(mapPadToControls(makePad(0, { analog: { [BUTTON.RT]: 0.5 } })).throttle).toBeGreaterThan(0.4);
  });

  it("ignores resting triggers", () => {
    expect(mapPadToControls(makePad(0, { analog: { [BUTTON.RT]: 0.03, [BUTTON.LT]: 0.04 } })).throttle).toBe(0);
  });

  it("A jumps, B or RB boosts, X or LB powerslides", () => {
    expect(mapPadToControls(makePad(0, { down: [BUTTON.A] })).jump).toBe(true);
    expect(mapPadToControls(makePad(0, { down: [BUTTON.B] })).boost).toBe(true);
    expect(mapPadToControls(makePad(0, { down: [BUTTON.RB] })).boost).toBe(true);
    expect(mapPadToControls(makePad(0, { down: [BUTTON.X] })).handbrake).toBe(true);
    expect(mapPadToControls(makePad(0, { down: [BUTTON.LB] })).handbrake).toBe(true);
    const idle = mapPadToControls(makePad(0));
    expect([idle.jump, idle.boost, idle.handbrake]).toEqual([false, false, false]);
  });

  it("a pad with fewer buttons than the standard layout does not throw", () => {
    const pad = { ...makePad(0), buttons: [{ pressed: true, value: 1 }] };
    expect(() => mapPadToControls(pad)).not.toThrow();
  });
});

describe("naming", () => {
  it("recognises Xbox and PlayStation families", () => {
    expect(padFamily("Xbox 360 Controller (XInput STANDARD GAMEPAD)")).toBe("Xbox");
    expect(padFamily("Xbox Wireless Controller")).toBe("Xbox");
    expect(padFamily("DualSense Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)")).toBe("PS");
    expect(padFamily("Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 09cc)")).toBe("PS");
    expect(padFamily("Generic USB Joystick")).toBe("Pad");
  });

  it("pad ids are recognisable and stable per slot", () => {
    expect(isPadId("gp-0")).toBe(true);
    expect(isPadId("abc123")).toBe(false);
  });
});

describe("hub: joining and leaving", () => {
  it("a connected pad appears as a player; a disconnected one goes", () => {
    const r = rig();
    current = r.hub;
    expect(r.hub.players()).toEqual([]);
    r.set([makePad(0)]);
    expect(r.hub.read("gp-0")).not.toBeNull();
    expect(r.hub.players()).toEqual([{ id: "gp-0", label: "Xbox 1" }]);
    r.set([null]);
    r.hub.read("gp-0");
    expect(r.hub.players()).toEqual([]);
  });

  it("two pads of one family are numbered", () => {
    const r = rig();
    current = r.hub;
    r.set([makePad(0), makePad(1), makePad(2, { id: "DualSense Wireless Controller" })]);
    r.hub.read("gp-0");
    expect(r.hub.players().map((p) => p.label)).toEqual(["Xbox 1", "Xbox 2", "PS 1"]);
  });

  it("notifies subscribers on connect and disconnect, not on every poll", () => {
    const r = rig();
    current = r.hub;
    const listener = vi.fn();
    r.hub.subscribe(listener);
    r.set([makePad(0)]);
    r.hub.read("gp-0");
    r.hub.read("gp-0");
    r.hub.read("gp-0");
    expect(listener).toHaveBeenCalledTimes(1);
    r.set([null]);
    r.hub.read("gp-0");
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("a dropped pad reads as released, never held", () => {
    const r = rig();
    current = r.hub;
    r.set([makePad(0, { axes: [1, 0], down: [BUTTON.A, BUTTON.B], analog: { [BUTTON.RT]: 1 } })]);
    expect(r.hub.read("gp-0")).toMatchObject({ jump: true, boost: true, throttle: 1 });
    r.set([null]);
    expect(r.hub.read("gp-0")).toMatchObject({ jump: false, boost: false, throttle: 0, stick: { x: 0, y: 0 } });
  });

  it("an unknown id is null", () => {
    const r = rig();
    current = r.hub;
    expect(r.hub.read("gp-9")).toBeNull();
    expect(r.hub.read("phone-1")).toBeNull();
  });
});

describe("hub: lobby buttons", () => {
  it("A toggles ready on the press edge, not while held", () => {
    const r = rig();
    current = r.hub;
    r.set([makePad(0)]);
    expect(r.hub.read("gp-0")!.lobby.ready).toBe(false);
    r.set([makePad(0, { down: [BUTTON.A] })]);
    expect(r.hub.read("gp-0")!.lobby.ready).toBe(true);
    r.hub.read("gp-0");
    r.hub.read("gp-0"); // still held: no toggle back
    expect(r.hub.read("gp-0")!.lobby.ready).toBe(true);
    r.set([makePad(0)]);
    r.hub.read("gp-0");
    r.set([makePad(0, { down: [BUTTON.A] })]);
    expect(r.hub.read("gp-0")!.lobby.ready).toBe(false);
  });

  it("Start also readies and B un-readies", () => {
    const r = rig();
    current = r.hub;
    r.set([makePad(0)]);
    r.hub.read("gp-0");
    r.set([makePad(0, { down: [BUTTON.START] })]);
    expect(r.hub.read("gp-0")!.lobby.ready).toBe(true);
    r.set([makePad(0)]);
    r.hub.read("gp-0");
    r.set([makePad(0, { down: [BUTTON.B] })]);
    expect(r.hub.read("gp-0")!.lobby.ready).toBe(false);
  });

  it("LB/RB cycle the team, D-pad left/right cycle the car", () => {
    const r = rig();
    current = r.hub;
    r.set([makePad(0)]);
    r.hub.read("gp-0");
    r.set([makePad(0, { down: [BUTTON.RB] })]);
    expect(r.hub.read("gp-0")!.lobby.team).toBe("blue");
    r.set([makePad(0)]);
    r.hub.read("gp-0");
    r.set([makePad(0, { down: [BUTTON.RB] })]);
    expect(r.hub.read("gp-0")!.lobby.team).toBe("orange");
    r.set([makePad(0)]);
    r.hub.read("gp-0");
    r.set([makePad(0, { down: [BUTTON.LB] })]);
    expect(r.hub.read("gp-0")!.lobby.team).toBe("blue");

    const first = r.hub.read("gp-0")!.lobby.carId;
    r.set([makePad(0)]);
    r.hub.read("gp-0");
    r.set([makePad(0, { down: [BUTTON.RIGHT] })]);
    const second = r.hub.read("gp-0")!.lobby.carId;
    expect(second).not.toBe(first);
    r.set([makePad(0)]);
    r.hub.read("gp-0");
    r.set([makePad(0, { down: [BUTTON.LEFT] })]);
    expect(r.hub.read("gp-0")!.lobby.carId).toBe(first);
  });

  it("lobby buttons do nothing during a match: they are game controls there", () => {
    const r = rig("playing");
    current = r.hub;
    r.set([makePad(0)]);
    r.hub.read("gp-0");
    r.set([makePad(0, { down: [BUTTON.A, BUTTON.RB] })]);
    const payload = r.hub.read("gp-0")!;
    expect(payload.lobby.ready).toBe(false);
    expect(payload.lobby.team).toBe("auto");
    expect(payload.jump).toBe(true);
    expect(payload.boost).toBe(true);
  });

  it("a reconnecting pad keeps its team and car", () => {
    const r = rig();
    current = r.hub;
    r.set([makePad(0)]);
    r.hub.read("gp-0");
    r.set([makePad(0, { down: [BUTTON.RB] })]);
    r.hub.read("gp-0");
    r.set([null]);
    r.hub.read("gp-0");
    r.set([makePad(0)]);
    expect(r.hub.read("gp-0")!.lobby.team).toBe("blue");
  });
});

describe("hub: in-match", () => {
  it("Y and R3 toggle ball cam by counting presses", () => {
    const r = rig("playing");
    current = r.hub;
    r.set([makePad(0)]);
    r.hub.read("gp-0");
    r.set([makePad(0, { down: [BUTTON.Y] })]);
    expect(r.hub.read("gp-0")!.ballCamPresses).toBe(1);
    r.hub.read("gp-0"); // held
    expect(r.hub.read("gp-0")!.ballCamPresses).toBe(1);
    r.set([makePad(0)]);
    r.hub.read("gp-0");
    r.set([makePad(0, { down: [BUTTON.R3] })]);
    expect(r.hub.read("gp-0")!.ballCamPresses).toBe(2);
  });

  it("publishes the phone-shaped payload plus the trigger throttle", () => {
    const r = rig("playing");
    current = r.hub;
    r.set([makePad(0, { axes: [0.5, 0], analog: { [BUTTON.RT]: 0.8 } })]);
    const payload = r.hub.read("gp-0")!;
    expect(Object.keys(payload).sort()).toEqual(["airRoll", "ballCamPresses", "boost", "handbrake", "jump", "lobby", "stick", "throttle"]);
    expect(payload.throttle).toBeGreaterThan(0.7);
    expect(payload.airRoll).toBe(payload.handbrake);
  });
});

describe("hub: rumble", () => {
  it("plays a dual-rumble effect on the matching pad", () => {
    const r = rig();
    current = r.hub;
    const pad = makePad(0);
    r.set([pad]);
    r.hub.read("gp-0");
    r.hub.rumble("gp-0", "heavy");
    expect(pad.vibrationActuator.playEffect).toHaveBeenCalledWith("dual-rumble", expect.objectContaining({ strongMagnitude: 1 }));
  });

  it("is a silent no-op for an unknown pad or one without an actuator", () => {
    const r = rig();
    current = r.hub;
    const pad = { ...makePad(0), vibrationActuator: undefined };
    r.set([pad as never]);
    r.hub.read("gp-0");
    expect(() => r.hub.rumble("gp-0", "light")).not.toThrow();
    expect(() => r.hub.rumble("gp-7", "light")).not.toThrow();
  });
});
