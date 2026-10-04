/**
 * Stuck-input protection.
 *
 * THE PROBLEM THIS SOLVES. `boost` and `handbrake` are `latest` (held) in this
 * game, which is correct for the donor's level-triggered ABI but means the host
 * keeps sending `boost: true` for as long as the phone reports it held. If the
 * phone's `pointerup` is swallowed — a phone call, a browser gesture, a
 * notification shade, a dropped `pointercancel` — the Air Jam `InputManager`
 * keeps re-serving the last buffered payload (it only clears on
 * `clearInput`, i.e. on player leave), and the car accelerates, boosts and
 * air-rolls forever with no way for the player to stop it.
 *
 * `useControllerTick` DOES NOT HELP. It is a plain `setInterval`
 * (`packages/sdk/src/hooks/use-controller-tick.ts:47-59`): no
 * `document.visibilityState` check, no pause on blur, no teardown on unmount
 * beyond `clearInterval`. Pong works around this the same way
 * (`games/pong/src/controller/hooks/use-pong-controller-input-runtime.ts:52-60`
 * re-adds its own `blur` / `visibilitychange` listeners); this is the host-side
 * equivalent, and it is why the SDK's silence is a gap we must fill here.
 *
 * WHY THE EVENTS SPLIT INTO STICKY AND IMMEDIATE.
 * `neutralize()` in `seam.ts` is a LATCH — "stop trusting input", idempotent,
 * terminal until something re-arms it. That is right for the session-level
 * events (`blur`, `visibilitychange`, presence `connected: false`, teardown):
 * the player is no longer demonstrably in front of the game, so a car that
 * keeps its last level is strictly worse than a car that stops.
 *
 * For the pointer-release events the situation is different, and the honest
 * reading of the requirement is "drop to NEUTRAL_CONTROLS on this tick", not
 * "brick the player's controls for the rest of the match". A latched
 * neutralize() on every `pointerup` would mean one click on the host's own pause
 * button permanently disconnects a player's car. So:
 *
 *   - pointer release / cancel / touchcancel → IMMEDIATE neutral for one read
 *   - blur / hidden / presence loss / teardown → STICKY neutralize()
 *
 * Immediate neutral still satisfies the requirement literally: `read()` returns
 * the exact `NEUTRAL_CONTROLS` object on that tick, and the next read resumes.
 *
 * POINTER POLICY. Under the default `"engaged"` policy a release only counts if
 * this window saw the matching `pointerdown`. That catches the actual hazard
 * (a drag that ended outside the button and never delivered a usable release)
 * without reacting to unrelated host-window UI clicks. `"any"` is available for
 * callers that want the blunt instrument.
 */

import type { NeutralizeReason } from "../seam";

/**
 * Minimal structural slice of `window`/`document` we need. Real ones satisfy it:
 * they expose the `addEventListener(type: string, listener: EventListener, ...)`
 * overload, and `EventListener` is `(evt: Event) => void`.
 */
export interface GuardEventTarget {
  addEventListener(type: string, listener: (event: Event) => void): void;
  removeEventListener(type: string, listener: (event: Event) => void): void;
}

export interface GuardTarget {
  window: GuardEventTarget;
  document: GuardEventTarget;
  /** True when the host page is hidden. */
  isHidden(): boolean;
}

/** A source that the guard is allowed to neutralize. */
export interface GuardedSource {
  neutralize(reason: NeutralizeReason): void;
  /**
   * Return exact `NEUTRAL_CONTROLS` for the duration of one release/cancel
   * event, then resume. Called for pointer and touch release events.
   */
  neutralizeImmediately(reason: NeutralizeReason): void;
}

export type PointerPolicy = "engaged" | "any";

export interface StuckInputGuardOptions {
  /** Override for tests / non-DOM hosts. Defaults to the ambient window+document. */
  target?: GuardTarget;
  /** See module header. Defaults to `"engaged"`. */
  pointerPolicy?: PointerPolicy;
}

export interface StuckInputGuard {
  /** Start neutralizing `source` on guard events. Returns an unregister fn. */
  register(source: GuardedSource): () => void;
  /** React to the presence feed: `false` means the controller is gone. */
  setPresence(source: GuardedSource, connected: boolean): void;
  /** True while the DOM listeners are attached. */
  isInstalled(): boolean;
  /** Detach every listener and drop every registration. */
  dispose(): void;
}

const defaultTarget = (): GuardTarget | null => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }
  return {
    window,
    document,
    isHidden: () => document.visibilityState === "hidden",
  };
};

/**
 * One guard per page. Sources register with it rather than each installing
 * their own listeners — at `MAX_CARS = 8` that is 8x fewer `pointerup` and
 * `blur` handlers on the host window, and one place to reason about.
 */
let active: StuckInputGuard | null = null;

const create = (options: StuckInputGuardOptions): StuckInputGuard => {
  const target = options.target ?? defaultTarget();
  const pointerPolicy = options.pointerPolicy ?? "engaged";
  const sources = new Set<GuardedSource>();
  /** Pointer ids we saw pressed in this window, so releases can be attributed. */
  const engagedPointers = new Set<number>();

  const broadcastSticky = (reason: NeutralizeReason) => {
    for (const source of [...sources]) {
      source.neutralize(reason);
    }
  };
  const broadcastImmediate = (reason: NeutralizeReason) => {
    for (const source of [...sources]) {
      source.neutralizeImmediately(reason);
    }
  };

  const pointerIdOf = (event: Event): number | null => {
    if (typeof event !== "object" || event === null) {
      return null;
    }
    const id = (event as { pointerId?: unknown }).pointerId;
    return typeof id === "number" ? id : null;
  };

  const onPointerDown = (event: Event) => {
    const id = pointerIdOf(event);
    if (id !== null) {
      engagedPointers.add(id);
    }
  };

  /**
   * A release we should believe: either the policy is `"any"`, or we saw this
   * exact pointer id pressed. `Set.delete` returns true only when the id was
   * present, which is exactly the "did we see this one pressed" test — and it
   * un-engages the pointer as a side effect, so a second release for the same
   * id does not re-fire.
   */
  const shouldReactToRelease = (event: Event): boolean => {
    if (pointerPolicy === "any") {
      return true;
    }
    const id = pointerIdOf(event);
    if (id === null) {
      return false;
    }
    return engagedPointers.delete(id);
  };

  const onPointerRelease = (event: Event) => {
    if (shouldReactToRelease(event)) {
      broadcastImmediate("released");
    }
  };

  const onTouchCancel = () => {
    engagedPointers.clear();
    broadcastImmediate("released");
  };

  const onBlur = () => {
    engagedPointers.clear();
    broadcastSticky("blurred");
  };

  const onVisibilityChange = () => {
    if (target?.isHidden()) {
      engagedPointers.clear();
      broadcastSticky("blurred");
    }
  };

  if (target) {
    target.window.addEventListener("pointerdown", onPointerDown);
    target.window.addEventListener("pointerup", onPointerRelease);
    target.window.addEventListener("pointercancel", onPointerRelease);
    target.window.addEventListener("lostpointercapture", onPointerRelease);
    target.window.addEventListener("touchcancel", onTouchCancel);
    target.window.addEventListener("blur", onBlur);
    target.document.addEventListener("visibilitychange", onVisibilityChange);
  }

  return {
    register(source: GuardedSource) {
      sources.add(source);
      return () => {
        sources.delete(source);
      };
    },
    setPresence(source, connected) {
      if (!connected) {
        engagedPointers.clear();
        source.neutralize("disconnected");
      }
    },
    isInstalled() {
      return target !== null;
    },
    dispose() {
      if (target) {
        target.window.removeEventListener("pointerdown", onPointerDown);
        target.window.removeEventListener("pointerup", onPointerRelease);
        target.window.removeEventListener("pointercancel", onPointerRelease);
        target.window.removeEventListener("lostpointercapture", onPointerRelease);
        target.window.removeEventListener("touchcancel", onTouchCancel);
        target.window.removeEventListener("blur", onBlur);
        target.document.removeEventListener("visibilitychange", onVisibilityChange);
      }
      sources.clear();
      engagedPointers.clear();
    },
  };
};

/**
 * Install (or return the already-installed) stuck-input guard. Idempotent.
 *
 * Returns a guard even when there is no DOM: its `register` still works (so
 * unit tests and server rendering are not special-cased) and `isInstalled()`
 * reports `false` to say no listeners were attached.
 */
export const installStuckInputGuard = (
  options: StuckInputGuardOptions = {},
): StuckInputGuard => {
  if (active) {
    return active;
  }
  active = create(options);
  return active;
};

/** Test-only. Drops the singleton so the next install builds a fresh guard. */
export const uninstallStuckInputGuard = (): void => {
  active?.dispose();
  active = null;
};
