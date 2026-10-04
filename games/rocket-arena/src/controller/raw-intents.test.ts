/**
 * Raw-intent tests: the reducer and the ABI mapping.
 *
 * The stuck-input cases are written here, at the reducer level, on purpose.
 * `use-touch-input.ts` is a thin adapter whose only job is to call these exact
 * actions from the right DOM events; testing the adapter instead of the
 * decision would test the plumbing and leave the guarantee unverified.
 */

import { describe, expect, it } from "vitest";
import { NEUTRAL_CONTROLS, type CarControls } from "@/airjam/seam";
import {
  createTouchControlState,
  deriveCarControls,
  isNeutralControls,
  readRawIntents,
  touchControlReducer,
  type TouchControlAction,
  type TouchControlState,
} from "./raw-intents";

/** Apply a sequence of actions the way the DOM adapter would. */
const run = (
  actions: TouchControlAction[],
  from: TouchControlState = createTouchControlState(),
): TouchControlState => actions.reduce(touchControlReducer, from);

const STICK_LEFT = { type: "stick-down", pointerId: 1, x: -0.8, y: 0.6 } as const;
const STICK_CANCEL = { type: "stick-up", pointerId: 1 } as const;

describe("simultaneous controls", () => {
  it("carries boost and steer together", () => {
    // Left thumb steering, right thumb boosting: the headline combination.
    const state = run([
      STICK_LEFT,
      { type: "button-down", pointerId: 2, button: "boost" },
    ]);
    const intents = readRawIntents(state);

    expect(intents.stickX).toBe(-0.8);
    expect(intents.stickY).toBe(0.6);
    expect(intents.boost).toBe(true);
    expect(intents.activePointers).toBe(2);

    const controls = deriveCarControls(intents);
    expect(controls.steer).toBe(-0.8);
    expect(controls.throttle).toBeCloseTo(0.6, 10);
    expect(controls.boost).toBe(true);
  });

  it("carries every named combination at once", () => {
    // steer + jump + drift + boost, all simultaneously, from four fingers.
    const state = run([
      STICK_LEFT,
      { type: "button-down", pointerId: 2, button: "boost" },
      { type: "button-down", pointerId: 3, button: "jump" },
      { type: "button-down", pointerId: 4, button: "handbrake" },
    ]);
    const controls = deriveCarControls(readRawIntents(state));

    expect(controls.steer).toBe(-0.8);
    expect(controls.boost).toBe(true);
    expect(controls.jump).toBe(true);
    expect(controls.handbrake).toBe(true);
  });

  it("supports the aerial combinations too", () => {
    // Stick + boost in the air, then add the air-roll modifier.
    const actions = [
      STICK_LEFT,
      { type: "button-down", pointerId: 2, button: "boost" },
    ] as TouchControlAction[];

    const airborne = deriveCarControls(readRawIntents(run(actions), true));
    expect(airborne.yaw).toBe(-0.8);
    expect(airborne.pitch).toBeCloseTo(0.6, 10);
    expect(airborne.roll).toBe(0);
    expect(airborne.boost).toBe(true);

    const airRolling = deriveCarControls(
      readRawIntents(run([...actions, { type: "button-down", pointerId: 4, button: "handbrake" }]), true),
    );
    // Air-roll modifier swaps yaw for roll so the two do not fight.
    expect(airRolling.roll).toBe(-0.8);
    expect(airRolling.yaw).toBe(0);
    expect(airRolling.boost).toBe(true);
  });
});

describe("cancelled pointers release their control", () => {
  it("clears a button when its pointer is cancelled", () => {
    const held = run([{ type: "button-down", pointerId: 7, button: "boost" }]);
    expect(readRawIntents(held).boost).toBe(true);

    // `button-up` carries no button name — the binding decides. This is the
    // same action pointerup / pointercancel / lostpointercapture all use.
    const cancelled = touchControlReducer(held, { type: "button-up", pointerId: 7 });

    expect(readRawIntents(cancelled).boost).toBe(false);
    expect(cancelled.pointers.size).toBe(0);
  });

  it("clears the stick when its pointer is cancelled", () => {
    const held = run([STICK_LEFT]);
    const cancelled = touchControlReducer(held, STICK_CANCEL);

    expect(cancelled.stickX).toBe(0);
    expect(cancelled.stickY).toBe(0);
    expect(cancelled.pointers.size).toBe(0);
  });

  it("only releases the control the cancelled pointer actually owned", () => {
    const state = run([
      { type: "button-down", pointerId: 7, button: "boost" },
      { type: "button-down", pointerId: 8, button: "handbrake" },
    ]);
    const after = touchControlReducer(state, { type: "button-up", pointerId: 7 });

    const intents = readRawIntents(after);
    expect(intents.boost).toBe(false);
    expect(intents.handbrake).toBe(true);
  });

  it("is a no-op for a pointer it never saw", () => {
    // This is what makes the window-level safety net free to call
    // unconditionally: a stray event cannot damage a live control.
    const state = run([{ type: "button-down", pointerId: 7, button: "boost" }]);
    const after = touchControlReducer(state, { type: "button-up", pointerId: 999 });

    expect(after).toBe(state);
    expect(readRawIntents(after).boost).toBe(true);
  });

  it("keeps a button held while a second finger is still down", () => {
    const state = run([
      { type: "button-down", pointerId: 7, button: "boost" },
      { type: "button-down", pointerId: 8, button: "boost" },
    ]);
    const after = touchControlReducer(state, { type: "button-up", pointerId: 7 });
    expect(readRawIntents(after).boost).toBe(true);
  });

  it("drops a cancelled pointer without disturbing the other thumb", () => {
    const state = run([
      STICK_LEFT,
      { type: "button-down", pointerId: 2, button: "boost" },
    ]);
    // The stick finger is cancelled while boost is still held.
    const after = touchControlReducer(state, STICK_CANCEL);
    const intents = readRawIntents(after);

    expect(intents.stickX).toBe(0);
    expect(intents.boost).toBe(true);
  });

  it("ignores a stale move from a pointer the browser already cancelled", () => {
    const state = run([STICK_LEFT]);
    const cancelled = touchControlReducer(state, STICK_CANCEL);
    const stale = touchControlReducer(cancelled, {
      type: "stick-move",
      pointerId: 1,
      x: 1,
      y: 1,
    });

    expect(stale.stickX).toBe(0);
    expect(stale.stickY).toBe(0);
  });
});

describe("reset (blur / hide / disable / unmount)", () => {
  it("returns the car to exactly NEUTRAL_CONTROLS", () => {
    // The hard requirement, stated as a test: after any total drop, no field
    // can be non-neutral in either air context.
    const busy = run([
      STICK_LEFT,
      { type: "button-down", pointerId: 2, button: "boost" },
      { type: "button-down", pointerId: 3, button: "jump" },
      { type: "button-down", pointerId: 4, button: "handbrake" },
      { type: "button-down", pointerId: 5, button: "reverse" },
    ]);

    for (const airborne of [null, false, true]) {
      const dropped = touchControlReducer(busy, { type: "reset" });
      const controls: CarControls = deriveCarControls(
        readRawIntents(dropped, airborne),
      );
      expect(controls).toEqual(NEUTRAL_CONTROLS);
      expect(isNeutralControls(controls)).toBe(true);
    }
  });

  it("preserves the press counters so a reported press is not un-reported", () => {
    const state = run([
      { type: "button-down", pointerId: 2, button: "jump" },
      { type: "button-up", pointerId: 2 },
      { type: "button-down", pointerId: 3, button: "jump" },
      { type: "button-up", pointerId: 3 },
    ]);
    expect(state.jumpPressCount).toBe(2);

    const dropped = touchControlReducer(state, { type: "reset" });
    expect(dropped.jumpPressCount).toBe(2);
    expect(dropped.ballCamPressCount).toBe(0);
    expect(dropped.pointers.size).toBe(0);
  });
});

describe("double jump reachability", () => {
  it("counts two discrete jump presses from one finger", () => {
    const first = run([{ type: "button-down", pointerId: 2, button: "jump" }]);
    expect(first.jumpPressCount).toBe(1);

    const lifted = touchControlReducer(first, { type: "button-up", pointerId: 2 });
    const second = touchControlReducer(lifted, {
      type: "button-down",
      pointerId: 2,
      button: "jump",
    });
    expect(second.jumpPressCount).toBe(2);
  });

  it("keeps the stick untouched at the moment of a jump", () => {
    // The flip contract: RocketSim reads the analog direction held AT the jump.
    // Nothing in this layer may rewrite or zero the stick on a press.
    const before = run([STICK_LEFT]);
    const after = touchControlReducer(before, {
      type: "button-down",
      pointerId: 2,
      button: "jump",
    });

    expect(after.stickX).toBe(before.stickX);
    expect(after.stickY).toBe(before.stickY);
    expect(after.jumpPressCount).toBe(1);
  });
});

describe("deriveCarControls", () => {
  it("treats unknown air context as grounded, keeping steering authority", () => {
    const controls = deriveCarControls(
      readRawIntents(run([STICK_LEFT]), null),
    );
    expect(controls.yaw).toBe(0);
    expect(controls.roll).toBe(0);
    expect(controls.steer).toBe(-0.8);
  });

  it("forces full reverse while REVERSE is held", () => {
    const controls = deriveCarControls(
      readRawIntents(
        run([STICK_LEFT, { type: "button-down", pointerId: 2, button: "reverse" }]),
      ),
    );
    expect(controls.throttle).toBe(-1);
    // Steering stays live: reversing while turning is the point of the button.
    expect(controls.steer).toBe(-0.8);
  });

  it("leaves roll at zero on the ground even with DRIFT held", () => {
    const controls = deriveCarControls(
      readRawIntents(
        run([STICK_LEFT, { type: "button-down", pointerId: 2, button: "handbrake" }]),
      ),
    );
    expect(controls.handbrake).toBe(true);
    expect(controls.roll).toBe(0);
    expect(controls.yaw).toBe(0);
  });

  it("only ever emits booleans for the three button fields", () => {
    const controls = deriveCarControls(readRawIntents(createTouchControlState()));
    for (const key of ["jump", "boost", "handbrake"] as const) {
      expect(typeof controls[key]).toBe("boolean");
    }
  });
});
