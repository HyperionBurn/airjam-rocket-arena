/**
 * Raw touch intents — pure state machine, no DOM, no React, no SDK.
 *
 * OWNERSHIP. This file produces RAW intents. It deliberately does NOT decide
 * how a press becomes a level over time: `pulse → level` timing belongs to the
 * input layer under `src/airjam/input/`. What this file guarantees is the
 * opposite property, and it is the important one on a phone:
 *
 *   a control is held if and only if a live pointer is bound to it.
 *
 * Every finger is tracked by `pointerId` in ONE map. A button is not a flag
 * that someone sets and forgets to clear; it is the set of pointers currently
 * pointing at it. So the only way to release a control is to delete the
 * pointer, and a delete driven by `pointerup` / `pointercancel` /
 * `lostpointercapture` / `touchcancel` / blur cannot miss. There is no code
 * path where a finger leaves the glass and the car keeps boosting.
 *
 * The control count is small (two thumbs), so deriving held-ness by scanning
 * the binding map on read is cheaper than keeping parallel per-button sets
 * that could drift out of sync with the pointer map.
 *
 * The only import is `seam.ts` (for `CarControls` / `sanitizeControls`), so the
 * dependency edge stays one-directional: this layer never sees the input layer.
 */

import {
  sanitizeControls,
  type CarControls,
  type ControlKey,
} from "@/airjam/seam";

/** Every button on the right thumb cluster. */
export const TOUCH_BUTTON_IDS = [
  "boost",
  "jump",
  "handbrake",
  "ballCam",
  "reverse",
] as const;

export type TouchButtonId = (typeof TOUCH_BUTTON_IDS)[number];

/**
 * Held while a finger is down. `boost` and `handbrake` are genuinely levels
 * (a boost is a hold, a powerslide is a hold). `jump` is emitted as a level
 * AND as a monotonic press counter, because a flip is decided by the stick
 * position at the instant of the press, so the input layer needs a discrete
 * edge, not a smeared level.
 */
export const HELD_BUTTON_IDS = ["boost", "jump", "handbrake", "reverse"] as const;

/** Fires once per press. Consumed by diffing the counter. */
export const IMPULSE_BUTTON_IDS = ["ballCam"] as const;

/** What a given `pointerId` currently owns. One binding per live finger. */
export type TouchPointerBinding =
  | { readonly kind: "stick" }
  | { readonly kind: "button"; readonly button: TouchButtonId };

export interface TouchControlState {
  /** Live finger → what it owns. Deleting an entry is the ONLY release. */
  readonly pointers: ReadonlyMap<number, TouchPointerBinding>;
  /** Shaped, +right, already deadzoned/expo'd and clamped to the unit circle. */
  readonly stickX: number;
  /** Shaped, +up. */
  readonly stickY: number;
  /** Monotonic. One increment per discrete jump press. Never reset. */
  readonly jumpPressCount: number;
  /** Monotonic. One increment per ball-cam press. Never reset. */
  readonly ballCamPressCount: number;
}

export type TouchControlAction =
  /** A finger landed on the stick pad. `x`/`y` are already shaped. */
  | { readonly type: "stick-down"; readonly pointerId: number; readonly x: number; readonly y: number }
  /** The stick finger moved. Ignored unless that pointer owns the stick. */
  | { readonly type: "stick-move"; readonly pointerId: number; readonly x: number; readonly y: number }
  /** Stick finger lifted or was cancelled. */
  | { readonly type: "stick-up"; readonly pointerId: number }
  /** A finger landed on a button. Re-pressing an already-held button adds a second pointer. */
  | { readonly type: "button-down"; readonly pointerId: number; readonly button: TouchButtonId }
  /**
   * A finger left. ONLY takes a pointerId — the binding decides what to clear,
   * so a release can never clear the wrong control and an unknown pointer is a
   * harmless no-op. This is the single hook used for `pointerup`,
   * `pointercancel`, `lostpointercapture` and `touchcancel`.
   */
  | { readonly type: "button-up"; readonly pointerId: number }
  /**
   * Total drop: blur, tab hidden, controls disabled, match end, unmount.
   * Counters survive so a press already reported to the input layer is not
   * silently un-reported by a later reset.
   */
  | { readonly type: "reset" };

export const createTouchControlState = (): TouchControlState => ({
  pointers: new Map(),
  stickX: 0,
  stickY: 0,
  jumpPressCount: 0,
  ballCamPressCount: 0,
});

const dropPointer = (
  state: TouchControlState,
  pointerId: number,
): TouchControlState => {
  const binding = state.pointers.get(pointerId);
  if (!binding) return state;

  const pointers = new Map(state.pointers);
  pointers.delete(pointerId);

  if (binding.kind === "stick") {
    return { ...state, pointers, stickX: 0, stickY: 0 };
  }
  return { ...state, pointers };
};

export const touchControlReducer = (
  state: TouchControlState,
  action: TouchControlAction,
): TouchControlState => {
  switch (action.type) {
    case "stick-down": {
      const pointers = new Map(state.pointers);
      pointers.set(action.pointerId, { kind: "stick" });
      return {
        ...state,
        pointers,
        stickX: action.x,
        stickY: action.y,
      };
    }
    case "stick-move": {
      // A move from a finger that no longer owns the stick is stale input from
      // a pointer the browser already cancelled. Drop it.
      if (state.pointers.get(action.pointerId)?.kind !== "stick") return state;
      return { ...state, stickX: action.x, stickY: action.y };
    }
    case "stick-up":
      return dropPointer(state, action.pointerId);
    case "button-down": {
      const pointers = new Map(state.pointers);
      pointers.set(action.pointerId, {
        kind: "button",
        button: action.button,
      });
      return {
        ...state,
        pointers,
        // A second finger landing on jump is the double-jump input. Counting
        // presses (not just holding) is what makes double jump reachable.
        jumpPressCount:
          action.button === "jump" ? state.jumpPressCount + 1 : state.jumpPressCount,
        ballCamPressCount:
          action.button === "ballCam"
            ? state.ballCamPressCount + 1
            : state.ballCamPressCount,
      };
    }
    case "button-up":
      return dropPointer(state, action.pointerId);
    case "reset":
      return {
        ...state,
        pointers: new Map(),
        stickX: 0,
        stickY: 0,
      };
  }
};

/**
 * The raw intent bundle handed to the input layer. Nothing here is a level
 * decision except the button holds, which ARE the honest raw state: a finger
 * is on boost, so boost is requested.
 */
export interface RawTouchIntents {
  /** -1 left .. +1 right. Shaped, deadzoned, clamped. */
  readonly stickX: number;
  /** -1 nose-down/reverse .. +1 nose-up/throttle. Shaped, deadzoned, clamped. */
  readonly stickY: number;
  /** 0..1 shaped magnitude, for the on-screen stick readout. */
  readonly stickMagnitude: number;
  readonly boost: boolean;
  readonly jump: boolean;
  /** Monotonic. Diff to detect one discrete press (= one jump / double jump). */
  readonly jumpPressCount: number;
  readonly handbrake: boolean;
  /** Held → forced full reverse. The stick is still the fine throttle. */
  readonly reverse: boolean;
  /** Monotonic. Diff to detect a ball-cam toggle. */
  readonly ballCamPressCount: number;
  /**
   * Air context from the HOST, never guessed from touch. `null` = the host has
   * not said yet, which the mapper treats as grounded (the safe default: a
   * wrong "airborne" silently removes steering authority).
   */
  readonly airborne: boolean | null;
  /** Live fingers on this controller. Diagnostics / stuck-input assertions. */
  readonly activePointers: number;
}

const isHeld = (
  state: TouchControlState,
  button: TouchButtonId,
): boolean => {
  for (const binding of state.pointers.values()) {
    if (binding.kind === "button" && binding.button === button) return true;
  }
  return false;
};

export const readRawIntents = (
  state: TouchControlState,
  airborne: boolean | null = null,
): RawTouchIntents => ({
  stickX: state.stickX,
  stickY: state.stickY,
  stickMagnitude: Math.hypot(state.stickX, state.stickY),
  boost: isHeld(state, "boost"),
  jump: isHeld(state, "jump"),
  jumpPressCount: state.jumpPressCount,
  handbrake: isHeld(state, "handbrake"),
  reverse: isHeld(state, "reverse"),
  ballCamPressCount: state.ballCamPressCount,
  airborne,
  activePointers: state.pointers.size,
});

/**
 * Map raw intents onto the 8-field simulation ABI in `seam.ts`.
 *
 * Ground mapping: stickY is throttle (up = drive, down = reverse/brake),
 * stickX is steer.
 *
 * Air mapping: the SAME stick becomes pitch (stickY) and yaw (stickX). Holding
 * DRIFT in the air swaps yaw for roll, which is the donor's own rule
 * (`input/touch.js:213-218`): air-roll modifier + stick left/right = roll,
 * and yaw is suppressed so the two do not fight.
 *
 * Note what is NOT here: no flip modifier, no dodge button. RocketSim derives
 * the flip from `jump` plus the analog direction held at that instant, and
 * derives the double jump internally. `jump` is therefore never rewritten or
 * latched here — the stick vector reaching the sim at the press instant is
 * exactly the one the player was holding, which is the whole flip contract.
 *
 * Both ground axes are always emitted (the donor does the same, and the sim
 * ignores ground axes while airborne), so the sim never sees a field go
 * missing mid-flip.
 */
export const deriveCarControls = (
  intents: RawTouchIntents,
): CarControls => {
  const airborne = intents.airborne === true;
  const airRolling = airborne && intents.handbrake;

  return sanitizeControls({
    throttle: intents.reverse ? -1 : intents.stickY,
    steer: intents.stickX,
    pitch: intents.stickY,
    yaw: airborne ? (airRolling ? 0 : intents.stickX) : 0,
    roll: airRolling ? intents.stickX : 0,
    jump: intents.jump,
    boost: intents.boost,
    handbrake: intents.handbrake,
  });
};

/** True when every field is neutral. Used by stuck-input assertions. */
export const isNeutralControls = (controls: CarControls): boolean =>
  (Object.keys(controls) as ControlKey[]).every((key) => {
    const value = controls[key];
    return typeof value === "number" ? value === 0 : value === false;
  });
