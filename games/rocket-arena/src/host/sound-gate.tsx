/**
 * "Click once to enable sound".
 *
 * Browsers keep audio locked until the page has had a user gesture, and a
 * projector page may never be clicked if the whole event is run from phones.
 * The lobby's START button is itself a gesture, so the common path unlocks on
 * its own; this chip is for the case where it did not, and says why the arena
 * is silent instead of leaving the operator to guess.
 *
 * (A kiosk can skip this entirely by launching Chrome with
 * `--autoplay-policy=no-user-gesture-required`; see the game README.)
 */
import { useEffect, useState } from "react";

const hasUserActivation = (): boolean => {
  if (typeof navigator === "undefined") return true;
  const activation = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
  // No API (older browsers): assume allowed rather than nag forever.
  return activation ? activation.hasBeenActive : true;
};

export const SoundGate = () => {
  const [locked, setLocked] = useState(() => !hasUserActivation());

  useEffect(() => {
    if (!locked) return;
    const unlock = () => setLocked(false);
    window.addEventListener("pointerdown", unlock, { once: true, capture: true });
    window.addEventListener("keydown", unlock, { once: true, capture: true });
    return () => {
      window.removeEventListener("pointerdown", unlock, { capture: true });
      window.removeEventListener("keydown", unlock, { capture: true });
    };
  }, [locked]);

  if (!locked) return null;
  return (
    <div
      role="status"
      style={{
        position: "fixed",
        // Bottom centre: at the top it covered the lobby's ROSTER heading. It only
        // shows until the first click (START MATCH counts), so it never sits on play.
        left: "50%",
        bottom: 14,
        transform: "translateX(-50%)",
        zIndex: 9_500,
        padding: "8px 14px",
        borderRadius: 999,
        background: "rgba(2, 16, 31, 0.85)",
        border: "1px solid #ffd23f88",
        color: "#ffe9a3",
        font: "700 13px/1.2 system-ui, sans-serif",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        pointerEvents: "none",
      }}
    >
      Click anywhere once to enable sound
    </div>
  );
};
