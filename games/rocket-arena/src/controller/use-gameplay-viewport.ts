/**
 * Viewport meta hardening for gameplay.
 *
 * `index.html` is owned by another worker and its viewport tag cannot be edited
 * from here, so the `user-scalable=no` half of gesture suppression is applied
 * at runtime instead, and only while the gameplay controls are mounted.
 *
 * Why it matters even though `touch-action: none` is already set on the
 * control surface: iOS Safari ignores `touch-action` for its own
 * double-tap-to-zoom and pull-to-refresh, and a zoomed viewport shifts every
 * element under the player's thumbs — a control surface that moves while it is
 * being used is a stuck-input generator. `maximum-scale=1` plus
 * `overscroll-behavior: none` (in the co-located CSS) is the supported way to
 * suppress both.
 *
 * The ORIGINAL attribute value is captured and restored verbatim on
 * deactivate/unmount, so the host page's own viewport is left exactly as found.
 */

import { useEffect } from "react";

const ZOOM_LOCKED =
  "width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1, user-scalable=no";

const findViewportMeta = (): HTMLMetaElement | null => {
  if (typeof document === "undefined") return null;
  return document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
};

/**
 * @param active true while the gameplay control surface is mounted.
 */
export const useGameplayViewportLock = (active: boolean): void => {
  useEffect(() => {
    if (!active) return;

    const meta = findViewportMeta();
    if (!meta) return;

    const original = meta.getAttribute("content");
    if (original === ZOOM_LOCKED) return;

    meta.setAttribute("content", ZOOM_LOCKED);
    return () => {
      if (original === null) {
        meta.removeAttribute("content");
        return;
      }
      meta.setAttribute("content", original);
    };
  }, [active]);
};
