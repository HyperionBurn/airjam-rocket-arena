/**
 * Phase 4 — PER-VIEWPORT HUD GEOMETRY (pure).
 *
 * OWNER: the Phase 4 worker (`src/airjam/viewports/**`).
 *
 * ---------------------------------------------------------------------------
 * SCOPE: GEOMETRY ONLY. This module builds NO DOM.
 * ---------------------------------------------------------------------------
 * The shell/UI layer owns the actual elements. What it needs from Phase 4 is
 * "where does this piece of information go", expressed in the same CSS-pixel
 * top-left space as `ViewportRect`, so the UI can position itself without
 * re-deriving the split geometry and without the two drifting apart.
 *
 * ---------------------------------------------------------------------------
 * THE RULE: GLOBAL STAYS GLOBAL
 * ---------------------------------------------------------------------------
 * Score and the match clock describe the MATCH, not a player, so there is
 * exactly one instance of them for the whole canvas, drawn once in a top band.
 * Boost and the ball-cam indicator describe a PLAYER, so they are laid out
 * inside that player's own rect — otherwise a 4-way split would either duplicate
 * a giant central scoreboard four times or overlap four of them.
 *
 * `placeHudInfo` encodes that decision as data so it is testable: for a
 * GLOBAL-scope kind it returns the SAME object for every player index, which is
 * what "do not duplicate N times" means in a way a test can assert.
 */

import type { ViewportRect } from "../seam.js";

/** An axis-aligned CSS-pixel box, top-left origin — the same space as a rect. */
export interface HudBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * What a piece of match information is about. GLOBAL kinds are drawn ONCE for
 * the whole canvas; PER_PLAYER kinds are drawn once per player, inside that
 * player's rect.
 */
export type HudInfoKind = "score" | "clock" | "boost" | "ballCam";

export type HudScope = "global" | "per-player";

const SCOPE: Readonly<Record<HudInfoKind, HudScope>> = Object.freeze({
  score: "global",
  clock: "global",
  boost: "per-player",
  ballCam: "per-player",
});

/** `true` when this kind is drawn once for the canvas rather than per player. */
export function hudScopeOf(kind: HudInfoKind): HudScope {
  return SCOPE[kind];
}

/** The single global strip. Height is reserved at the top of the canvas. */
export interface GlobalHudBand extends HudBox {
  /** Left third: team 0 score. */
  readonly score: HudBox;
  /** Centre third: the match clock. */
  readonly clock: HudBox;
  /** Right third: team 1 score. */
  readonly opponentScore: HudBox;
}

/** One player's in-rect furniture. */
export interface PlayerHudSlot {
  readonly index: number;
  readonly playerId: string | null;
  /** The rect this slot belongs to; every box below is inside it. */
  readonly rect: ViewportRect;
  /** Boost meter, bottom-left of the rect. */
  readonly boost: HudBox;
  /** Ball-cam indicator, top-right of the rect, clear of the global band. */
  readonly ballCam: HudBox;
}

export interface HudGeometry {
  /** Canvas size the geometry was computed for. */
  readonly canvasWidth: number;
  readonly canvasHeight: number;
  readonly global: GlobalHudBand;
  readonly players: readonly PlayerHudSlot[];
}

export interface HudGeometryOptions {
  /** Gap between a box and its rect's edge. Default 12. */
  readonly inset?: number;
  /** Height of the global top band. Default 28. */
  readonly bandHeight?: number;
  /** Boost meter size. Default 96x10. */
  readonly boostSize?: HudBox;
  /** Ball-cam chip size. Default 64x20. */
  readonly chipSize?: HudBox;
}

const DEFAULT_INSET = 12;
const DEFAULT_BAND_HEIGHT = 28;
const DEFAULT_BOOST: HudBox = { x: 0, y: 0, width: 96, height: 10 };
const DEFAULT_CHIP: HudBox = { x: 0, y: 0, width: 64, height: 20 };

const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);

/**
 * Keep a box wholly inside `rect`, shrinking it if the rect is too small for it
 * at all. A HUD element that spills into a neighbouring player's rect is worse
 * than a small one, so the invariant here is "inside or absent", enforced
 * rather than hoped for.
 */
function contain(box: HudBox, rect: ViewportRect): HudBox {
  const width = clamp(box.width, 0, Math.max(0, rect.width));
  const height = clamp(box.height, 0, Math.max(0, rect.height));
  return {
    x: clamp(box.x, rect.x, rect.x + rect.width - width),
    y: clamp(box.y, rect.y, rect.y + rect.height - height),
    width,
    height,
  };
}

function contains(outer: ViewportRect, inner: HudBox): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  );
}

/**
 * Compute HUD geometry from the viewport rects. Pure — same rects in, same
 * boxes out, no DOM and no measurement.
 */
export function computeHudGeometry(
  rects: readonly ViewportRect[],
  canvasWidth: number,
  canvasHeight: number,
  options: HudGeometryOptions = {},
): HudGeometry {
  const inset = options.inset ?? DEFAULT_INSET;
  const bandHeight = clamp(options.bandHeight ?? DEFAULT_BAND_HEIGHT, 0, canvasHeight);
  const boostSize = options.boostSize ?? DEFAULT_BOOST;
  const chipSize = options.chipSize ?? DEFAULT_CHIP;

  const globalBox: HudBox = { x: 0, y: 0, width: Math.max(0, canvasWidth), height: bandHeight };
  const third = Math.max(0, globalBox.width / 3);
  const global: GlobalHudBand = {
    ...globalBox,
    score: { x: 0, y: 0, width: third, height: bandHeight },
    clock: { x: third, y: 0, width: third, height: bandHeight },
    opponentScore: {
      x: third * 2,
      y: 0,
      width: canvasWidth - third * 2,
      height: bandHeight,
    },
  };

  const players = rects.map((rect) => {
    // A rect that touches the canvas top shares its first `bandHeight` pixels
    // with the global score/clock, so the chip is pushed below it. Without this
    // the top two players' ball-cam chips land under the score.
    const topInset = rect.y < bandHeight ? bandHeight : rect.y;
    const ballCam = contain(
      {
        x: rect.x + rect.width - inset - chipSize.width,
        y: topInset + inset,
        width: chipSize.width,
        height: chipSize.height,
      },
      rect,
    );
    const boost = contain(
      {
        x: rect.x + inset,
        y: rect.y + rect.height - inset - boostSize.height,
        width: boostSize.width,
        height: boostSize.height,
      },
      rect,
    );
    return { index: rect.index, playerId: rect.playerId, rect, boost, ballCam };
  });

  return { canvasWidth, canvasHeight, global, players };
}

/**
 * The box a given piece of information belongs in, for a given player index.
 *
 * For a GLOBAL kind every player index maps to the same object — the caller
 * draws it once. For a PER_PLAYER kind it maps into that player's rect.
 * Returns null when the player index has no viewport.
 */
export function placeHudInfo(
  geometry: HudGeometry,
  kind: HudInfoKind,
  playerIndex: number,
): HudBox | null {
  if (SCOPE[kind] === "global") {
    if (kind === "clock") return geometry.global.clock;
    if (kind === "score") return geometry.global.score;
    // "opponentScore" is the mirror of "score" and shares the global scope.
    return geometry.global.opponentScore;
  }
  const slot = geometry.players[playerIndex];
  if (!slot) return null;
  return kind === "boost" ? slot.boost : slot.ballCam;
}

/** `true` when every per-player box lies wholly inside its own rect. */
export function hudGeometryIsContained(geometry: HudGeometry): boolean {
  return geometry.players.every(
    (slot) => contains(slot.rect, slot.boost) && contains(slot.rect, slot.ballCam),
  );
}
