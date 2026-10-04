// AIR JAM PATCH (new file, not in the upstream donor).
//
// Field-of-view compensation for split-screen tiles. Pure math, no Three.js.
//
// The donor's chase camera is tuned for a full 16:9 screen. Three.js's `fov` is
// VERTICAL, so the same vertical FOV in a tile that is narrower than 16:9 gives
// a much narrower horizontal view (a side-by-side 2-player split is about 1.1:1)
// and the player loses sight of the sides of the pitch. Rocket League compensates
// by keeping the horizontal FOV roughly constant; doing it fully would turn a
// 1.1:1 tile into a fisheye, so this applies a fraction of the compensation and
// caps the result. Tiles at or wider than 16:9 are left exactly as the donor draws.

const REFERENCE_ASPECT = 16 / 9;
/** Share of the full compensation applied (0 = none, 1 = constant horizontal FOV). */
const COMPENSATION = 0.4;
/** Never exceed this vertical FOV, whatever the tile. */
const MAX_VERTICAL_FOV = 112;

/** @param {number} fovDeg the donor's vertical FOV  @param {number} aspect tile width / height */
export function widenFov(fovDeg, aspect) {
  if (!Number.isFinite(fovDeg) || !Number.isFinite(aspect) || aspect <= 0) return fovDeg;
  if (aspect >= REFERENCE_ASPECT) return fovDeg;
  const ratio = 1 + (REFERENCE_ASPECT / aspect - 1) * COMPENSATION;
  const widened = (2 * Math.atan(Math.tan((fovDeg * Math.PI) / 360) * ratio) * 180) / Math.PI;
  // Never narrower than what the donor asked for, never past the cap (unless the
  // donor's own value already is).
  return Math.max(fovDeg, Math.min(widened, MAX_VERTICAL_FOV));
}
