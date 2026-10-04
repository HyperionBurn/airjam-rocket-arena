/**
 * Haptics — restrained, guarded, and honest about what the SDK can do.
 *
 * SDK FACT (verified against `packages/sdk/src`):
 *  - Haptics in Air Jam are HOST → CONTROLLER only. `useSendSignal("HAPTIC", …)`
 *    is a host hook, and the controller runtime already translates a received
 *    `server:signal` into `navigator.vibrate`
 *    (`hooks/internal/use-controller-runtime-api.ts:348-387`).
 *  - There is NO controller → host "please vibrate me" RPC. So anything the
 *    phone must feel as a consequence of a WORLD event (ball hit, goal) has to
 *    be a host signal; the controller cannot request it.
 *
 * That is why the split below exists:
 *  - LOCAL events (the player pressed jump) happen on the phone, so the phone
 *    buzzes itself. `playHaptic` is the only path for those.
 *  - WORLD events (ball hit, goal) belong to the host, which already has the
 *    signal API. The controller only has to leave the channel open, which
 *    `playHaptic` does not interfere with.
 *
 * Every call is guarded on `navigator.vibrate` existing, because iOS Safari has
 * never shipped it. Patterns are deliberately short — a controller held in two
 * hands buzzes against the player's palm, so restraint reads as quality.
 */

export type HapticKind = "tap" | "hit" | "goal";

const PATTERNS: Readonly<Record<HapticKind, number | readonly number[]>> = {
  /** Jump / any button press. Barely perceptible. */
  tap: 8,
  /** Ball struck by this player. */
  hit: 22,
  /** Goal scored. The one moment worth a two-pulse pattern. */
  goal: [18, 40, 18],
};

/** Whether this browser can vibrate at all. False on desktop and iOS Safari. */
export const canVibrate = (): boolean =>
  typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

/**
 * Fire one restrained pattern. Returns whether anything actually buzzed, so a
 * caller can log the gap instead of assuming feedback was delivered.
 */
export const playHaptic = (
  kind: HapticKind,
  enabled = true,
): boolean => {
  if (!enabled || !canVibrate()) return false;
  try {
    // The SDK's own `navigator.vibrate` call sites pass a plain number or a
    // plain number[]; `readonly` is a compile-time-only concern, so copy.
    const pattern = PATTERNS[kind];
    navigator.vibrate(Array.isArray(pattern) ? [...pattern] : (pattern as number));
    return true;
  } catch {
    // Vibration is a nicety. Never let it break an input handler.
    return false;
  }
};
