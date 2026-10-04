/**
 * DOM adapter: pointer events → the pure state machine in `raw-intents.ts`.
 *
 * This is the only file in the controller that touches a `PointerEvent`. It
 * owns two hard problems that have nothing to do with layout.
 *
 * ---------------------------------------------------------------------------
 * STUCK INPUT — the requirement, and exactly how it is met
 * ---------------------------------------------------------------------------
 * A car must never be left boosting, turning, accelerating or air-rolling
 * because a browser ate an event. Four independent mechanisms, in order of how
 * early they catch the problem:
 *
 *  1. ONE BINDING PER FINGER. `setPointerCapture` on `pointerdown` keeps every
 *     subsequent event for that finger on our element, so a thumb that slides
 *     off a button does not silently orphan the press.
 *  2. RELEASE BY POINTER ID ONLY. `button-up` carries no button name; the
 *     reducer looks up what that finger owned and deletes exactly that entry.
 *     A release can never clear the wrong control, and an unknown pointer is a
 *     no-op — so it is always safe to call from anywhere, including a handler
 *     that has no idea which control was pressed.
 *  3. A WINDOW-LEVEL SAFETY NET. `pointerup`, `pointercancel` and `touchcancel`
 *     are also listened for on `window` / `document`. This is the net under the
 *     pointer-capture net: if the browser retargets or drops the element-level
 *     event, the finger is still released. The reducer no-op makes this free.
 *  4. TOTAL DROP. `blur`, `pagehide`, and `visibilitychange`-to-hidden reset
 *     EVERYTHING. Coming back to a backgrounded tab mid-boost must not resume
 *     the boost, and the jump/ball-cam counters deliberately survive so a press
 *     already reported is not un-reported.
 *
 * Events listened to, in full: `pointerdown`, `pointermove`, `pointerup`,
 * `pointercancel`, `lostpointercapture` (element); `pointerup`,
 * `pointercancel` (window); `touchcancel` (document); `blur`, `pagehide`
 * (window); `visibilitychange` (document); `resize` + `orientationchange`
 * (window, orientation flip only); `gesturestart` / `gesturechange` /
 * `gestureend`, `dblclick`, `contextmenu` (Safari pinch-zoom, double-tap-zoom,
 * long-press callout).
 *
 * ---------------------------------------------------------------------------
 * WHY NO RE-RENDER ON STICK MOVES
 * ---------------------------------------------------------------------------
 * A thumb produces pointermove at display rate. Re-rendering the control tree
 * at 60-120 Hz on a phone is how a touch UI earns its reputation. So the knob
 * transform is written straight to the DOM node, and React state is bumped only
 * when a held-button SET changes — a handful of times per second at most.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { playHaptic } from "./haptics";
import {
  createTouchControlState,
  readRawIntents,
  TOUCH_BUTTON_IDS,
  touchControlReducer,
  type RawTouchIntents,
  type TouchButtonId,
  type TouchControlState,
} from "./raw-intents";
import { offsetFromOrigin, shapeStick } from "./stick";

/**
 * Fraction of the stick pad's width the knob is allowed to travel. The pad is
 * deliberately larger than the travel so a thumb never feels like it hit a wall.
 */
const STICK_TRAVEL_FRACTION = 0.36;

/** Knob diameter as a fraction of the pad, for the visual. */
const STICK_KNOB_FRACTION = 0.46;

export interface TouchStickHandlers {
  readonly onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  readonly onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  readonly onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
  readonly onPointerCancel: (event: React.PointerEvent<HTMLDivElement>) => void;
  readonly onLostPointerCapture: (event: React.PointerEvent<HTMLDivElement>) => void;
}

export interface TouchButtonHandlers {
  readonly onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
  readonly onPointerUp: (event: React.PointerEvent<HTMLElement>) => void;
  readonly onPointerCancel: (event: React.PointerEvent<HTMLElement>) => void;
  readonly onLostPointerCapture: (event: React.PointerEvent<HTMLElement>) => void;
}

export interface UseTouchInputOptions {
  /** False drops every held control immediately. Used for lobby / ended. */
  readonly enabled: boolean;
  /** Host-provided air context, forwarded verbatim in the intents bundle. */
  readonly airborne: boolean | null;
  /** Called on every state change, including every discrete press. */
  readonly onIntents: ((intents: RawTouchIntents) => void) | undefined;
  readonly hapticsEnabled: boolean;
  /**
   * The gameplay surface that should swallow browser gestures. Attaching the
   * ref is what enables the non-passive pinch/double-tap/callout blockers.
   */
  readonly surfaceRef: React.RefObject<HTMLElement | null>;
}

export interface UseTouchInputResult {
  readonly stickHandlers: TouchStickHandlers;
  readonly buttonHandlers: Readonly<Record<TouchButtonId, TouchButtonHandlers>>;
  /** Held state, for button visuals. Re-renders only on set changes. */
  readonly held: Readonly<Record<TouchButtonId, boolean>>;
  /** Attach to the knob; its transform is written imperatively. */
  readonly knobRef: React.RefObject<HTMLDivElement | null>;
  /** Current raw state, for assertions and the imperative host handle. */
  readonly getState: () => TouchControlState;
  /** Force a total drop. Exposed on the imperative host handle. */
  readonly releaseAll: () => void;
  /**
   * Fire one press of a button with no pointer involved, using a synthetic id.
   * This is the ONLY route for keyboard and assistive-tech activation, where
   * `pointerdown` never fires and a plain `click` would otherwise be invisible
   * to the intents bundle. The donor uses the same `detail === 0` signal
   * (`input/touch.js:336`).
   */
  readonly pressButton: (button: TouchButtonId) => void;
}

const ALL_RELEASED: Readonly<Record<TouchButtonId, boolean>> = Object.freeze(
  Object.fromEntries(TOUCH_BUTTON_IDS.map((id) => [id, false])) as Record<
    TouchButtonId,
    boolean
  >,
);

/** The Safari/desktop pinch-zoom gesture family. Not cancelable by default. */
const GESTURE_EVENTS = ["gesturestart", "gesturechange", "gestureend"] as const;

/** Sorted list of buttons currently under a finger. Change = a re-render. */
const heldSignatureOf = (state: TouchControlState): string => {
  const parts: string[] = [];
  for (const binding of state.pointers.values()) {
    if (binding.kind === "button") parts.push(binding.button);
  }
  return parts.sort().join(",");
};

export const useTouchInput = ({
  enabled,
  airborne,
  onIntents,
  hapticsEnabled,
  surfaceRef,
}: UseTouchInputOptions): UseTouchInputResult => {
  const stateRef = useRef<TouchControlState>(createTouchControlState());
  const knobRef = useRef<HTMLDivElement | null>(null);

  // Consumer values are read through refs so an inline arrow prop never
  // re-subscribes the safety listeners on a host-page re-render.
  const onIntentsRef = useRef(onIntents);
  onIntentsRef.current = onIntents;
  const airborneRef = useRef(airborne);
  airborneRef.current = airborne;
  const hapticsRef = useRef(hapticsEnabled);
  hapticsRef.current = hapticsEnabled;

  const [held, setHeld] = useState<Readonly<Record<TouchButtonId, boolean>>>(
    ALL_RELEASED,
  );
  const heldSignatureRef = useRef<string>("");

  const dispatch = useCallback(
    (action: Parameters<typeof touchControlReducer>[1]) => {
      const previous = stateRef.current;
      const next = touchControlReducer(previous, action);
      if (next === previous) return;

      stateRef.current = next;
      onIntentsRef.current?.(readRawIntents(next, airborneRef.current));

      const signature = heldSignatureOf(next);
      if (signature !== heldSignatureRef.current) {
        heldSignatureRef.current = signature;
        const nextHeld: Record<TouchButtonId, boolean> = { ...ALL_RELEASED };
        for (const binding of next.pointers.values()) {
          if (binding.kind === "button") nextHeld[binding.button] = true;
        }
        setHeld(nextHeld);
      }
    },
    [],
  );

  const releaseAll = useCallback(() => {
    const previous = stateRef.current;
    const next = touchControlReducer(previous, { type: "reset" });
    stateRef.current = next;
    heldSignatureRef.current = "";
    setHeld(ALL_RELEASED);
    const knob = knobRef.current;
    if (knob) knob.style.transform = "translate(-50%, -50%)";
    // Always publish, even when already neutral: the input layer may be
    // re-subscribing and needs one level read of the current truth.
    onIntentsRef.current?.(readRawIntents(next, airborneRef.current));
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Stick                                                                   */
  /* ---------------------------------------------------------------------- */

  /** Origin of the stick, measured at press time so a rotation is handled. */
  const originRef = useRef<{ x: number; y: number; radius: number } | null>(null);
  const stickPointerRef = useRef<number | null>(null);

  const resetKnob = useCallback(() => {
    const knob = knobRef.current;
    if (knob) knob.style.transform = "translate(-50%, -50%)";
  }, []);

  /**
   * Release the stick for a pointer id. Safe to call for ANY id: an id this
   * controller does not own is a no-op inside the reducer. That property is
   * what lets the window-level safety net call it unconditionally.
   */
  const releaseStickPointer = useCallback(
    (pointerId: number) => {
      if (stickPointerRef.current === pointerId) {
        stickPointerRef.current = null;
        originRef.current = null;
        resetKnob();
      }
      dispatch({ type: "stick-up", pointerId });
    },
    [dispatch, resetKnob],
  );

  /**
   * Feed a finger position to the stick. `first` is the finger-down sample: it
   * must REGISTER the pointer as the stick's owner (`stick-down`), because the
   * reducer drops a `stick-move` from any pointer it has not seen go down. (This
   * used to dispatch `stick-move` even for the first sample, so no stick input
   * ever got through; the reducer tests missed it because they send
   * `stick-down` themselves.)
   */
  const moveStick = useCallback(
    (pointerId: number, clientX: number, clientY: number, first = false) => {
      const origin = originRef.current;
      if (!origin) return;
      const offset = offsetFromOrigin(
        clientX,
        clientY,
        origin.x,
        origin.y,
        origin.radius,
      );
      const shaped = shapeStick(offset.x, offset.y);
      dispatch({ type: first ? "stick-down" : "stick-move", pointerId, x: shaped.x, y: shaped.y });

      const knob = knobRef.current;
      if (knob) {
        const dx = shaped.x * origin.radius;
        const dy = -shaped.y * origin.radius;
        knob.style.transform = `translate(-50%, -50%) translate(${dx}px, ${dy}px)`;
      }
    },
    [dispatch],
  );

  const stickHandlers = useMemo<TouchStickHandlers>(
    () => ({
      onPointerDown: (event) => {
        if (!enabled) return;
        // First finger on the pad wins. A second is ignored rather than
        // fighting over the stick — the other thumb is for buttons.
        if (stickPointerRef.current !== null) return;
        event.preventDefault();

        const pad = event.currentTarget;
        const rect = pad.getBoundingClientRect();
        if (rect.width <= 0) return;

        originRef.current = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          radius: (rect.width * STICK_TRAVEL_FRACTION) / 2,
        };
        stickPointerRef.current = event.pointerId;
        pad.setPointerCapture(event.pointerId);

        const knob = knobRef.current;
        if (knob) {
          const size = `${rect.width * STICK_KNOB_FRACTION}px`;
          knob.style.width = size;
          knob.style.height = size;
        }
        moveStick(event.pointerId, event.clientX, event.clientY, true);
      },
      onPointerMove: (event) => {
        if (stickPointerRef.current !== event.pointerId) return;
        event.preventDefault();
        moveStick(event.pointerId, event.clientX, event.clientY);
      },
      onPointerUp: (event) => {
        if (stickPointerRef.current !== event.pointerId) return;
        event.preventDefault();
        releaseStickPointer(event.pointerId);
      },
      onPointerCancel: (event) => {
        releaseStickPointer(event.pointerId);
      },
      onLostPointerCapture: (event) => {
        releaseStickPointer(event.pointerId);
      },
    }),
    [enabled, moveStick, releaseStickPointer],
  );

  /* ---------------------------------------------------------------------- */
  /* Buttons                                                                 */
  /* ---------------------------------------------------------------------- */

  const buttonHandlers = useMemo(() => {
    const build = (button: TouchButtonId): TouchButtonHandlers => ({
      onPointerDown: (event) => {
        if (!enabled) return;
        event.preventDefault();
        // Capture on the button so a thumb sliding off does not orphan the press.
        event.currentTarget.setPointerCapture(event.pointerId);
        dispatch({ type: "button-down", pointerId: event.pointerId, button });
        if (button === "jump") playHaptic("tap", hapticsRef.current);
      },
      onPointerUp: (event) => {
        event.preventDefault();
        dispatch({ type: "button-up", pointerId: event.pointerId });
      },
      onPointerCancel: (event) => {
        dispatch({ type: "button-up", pointerId: event.pointerId });
      },
      onLostPointerCapture: (event) => {
        dispatch({ type: "button-up", pointerId: event.pointerId });
      },
    });

    const table = {} as Record<TouchButtonId, TouchButtonHandlers>;
    for (const id of TOUCH_BUTTON_IDS) table[id] = build(id);
    return table as Readonly<Record<TouchButtonId, TouchButtonHandlers>>;
  }, [dispatch, enabled]);

  /* ---------------------------------------------------------------------- */
  /* Global safety net                                                       */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    // Safety net #3. Releases by id, so an event we did not cause costs nothing.
    const onWindowPointerEnd = (event: PointerEvent) => {
      dispatch({ type: "button-up", pointerId: event.pointerId });
      releaseStickPointer(event.pointerId);
    };

    const onTouchCancel = (event: TouchEvent) => {
      for (const touch of event.changedTouches) {
        dispatch({ type: "button-up", pointerId: touch.identifier });
        releaseStickPointer(touch.identifier);
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) releaseAll();
    };

    window.addEventListener("pointerup", onWindowPointerEnd);
    window.addEventListener("pointercancel", onWindowPointerEnd);
    document.addEventListener("touchcancel", onTouchCancel);
    window.addEventListener("blur", releaseAll);
    window.addEventListener("pagehide", releaseAll);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("pointerup", onWindowPointerEnd);
      window.removeEventListener("pointercancel", onWindowPointerEnd);
      document.removeEventListener("touchcancel", onTouchCancel);
      window.removeEventListener("blur", releaseAll);
      window.removeEventListener("pagehide", releaseAll);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [dispatch, releaseAll, releaseStickPointer]);

  /**
   * Disabling the controls MUST drop what is held, or a player who returns to
   * the lobby mid-boost arrives with the throttle open.
   */
  useEffect(() => {
    if (!enabled) releaseAll();
  }, [enabled, releaseAll]);

  /**
   * Rotation. A bare `resize` is NOT enough and must not be treated as one:
   * mobile browsers fire `resize` when the URL bar collapses, and dropping the
   * controls then would kill a boost in a corner. Only a real orientation flip
   * moves the pad out from under a captured finger, so only a flip resets.
   * Geometry is re-measured on the next `pointerdown` regardless.
   */
  useEffect(() => {
    const isPortrait = () => window.innerHeight >= window.innerWidth;
    let wasPortrait = isPortrait();

    const onMaybeRotate = () => {
      const nowPortrait = isPortrait();
      if (nowPortrait === wasPortrait) return;
      wasPortrait = nowPortrait;
      releaseAll();
    };

    window.addEventListener("resize", onMaybeRotate);
    window.addEventListener("orientationchange", onMaybeRotate);
    return () => {
      window.removeEventListener("resize", onMaybeRotate);
      window.removeEventListener("orientationchange", onMaybeRotate);
    };
  }, [releaseAll]);

  /**
   * Browser gesture suppression. `touch-action: none` in CSS covers scroll,
   * pinch and double-tap-zoom inside the surface, but Safari's proprietary
   * `gesture*` events and the long-press callout are separate code paths.
   * Listeners are NON-passive because `preventDefault` is the whole point.
   */
  useEffect(() => {
    const node = surfaceRef.current;
    if (!node) return;

    const block = (event: Event) => event.preventDefault();
    for (const name of GESTURE_EVENTS) {
      node.addEventListener(name, block, { passive: false });
    }
    node.addEventListener("dblclick", block, { passive: false });
    node.addEventListener("contextmenu", block, { passive: false });
    return () => {
      for (const name of GESTURE_EVENTS) node.removeEventListener(name, block);
      node.removeEventListener("dblclick", block);
      node.removeEventListener("contextmenu", block);
    };
  }, [surfaceRef]);

  const getState = useCallback(() => stateRef.current, []);

  /**
   * Ids for keyboard/AT presses live outside the pointer-id space so they can
   * never collide with a real finger, and are always released immediately —
   * there is no "lift the key" event worth modelling for an impulse button, and
   * a stuck keydown would be a stuck control.
   */
  const keyboardPressRef = useRef(0);

  const pressButton = useCallback(
    (button: TouchButtonId) => {
      const pointerId = -(++keyboardPressRef.current);
      dispatch({ type: "button-down", pointerId, button });
      dispatch({ type: "button-up", pointerId });
    },
    [dispatch],
  );

  return {
    stickHandlers,
    buttonHandlers,
    held,
    knobRef,
    getState,
    releaseAll,
    pressButton,
  };
};
