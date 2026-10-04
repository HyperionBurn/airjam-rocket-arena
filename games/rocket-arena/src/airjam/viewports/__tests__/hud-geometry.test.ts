/**
 * HUD geometry: match info stays global, player info stays in its own rect.
 *
 * The property under test is not "the boxes look right", it is "the giant
 * central scoreboard is not instantiated once per player" — which is
 * observable as object identity, so it is asserted as such.
 */
import { describe, expect, it } from "vitest";
import { computeViewportRects } from "../layouts.js";
import {
  computeHudGeometry,
  hudGeometryIsContained,
  hudScopeOf,
  placeHudInfo,
  type HudBox,
} from "../hud-geometry.js";

const inside = (outer: { x: number; y: number; width: number; height: number }, inner: HudBox) =>
  inner.x >= outer.x &&
  inner.y >= outer.y &&
  inner.x + inner.width <= outer.x + outer.width &&
  inner.y + inner.height <= outer.y + outer.height;

describe("hud scope", () => {
  it("classifies match info as global and player info as per-player", () => {
    expect(hudScopeOf("score")).toBe("global");
    expect(hudScopeOf("clock")).toBe("global");
    expect(hudScopeOf("boost")).toBe("per-player");
    expect(hudScopeOf("ballCam")).toBe("per-player");
  });
});

describe("computeHudGeometry", () => {
  it("builds exactly one global band spanning the canvas", () => {
    const rects = computeViewportRects(4, 1920, 1080);
    const geometry = computeHudGeometry(rects, 1920, 1080);

    expect(geometry.global.width).toBe(1920);
    expect(geometry.global.y).toBe(0);
    expect(geometry.players).toHaveLength(4);
  });

  it("returns the SAME object for global info regardless of player index", () => {
    // This is the anti-duplication guarantee. A 4-way split must draw the
    // scoreboard once, not four times overlapping.
    const rects = computeViewportRects(4, 1920, 1080);
    const geometry = computeHudGeometry(rects, 1920, 1080);

    const first = placeHudInfo(geometry, "clock", 0);
    const third = placeHudInfo(geometry, "clock", 3);
    expect(first).toBe(third);
    expect(placeHudInfo(geometry, "score", 0)).toBe(placeHudInfo(geometry, "score", 2));
  });

  it("returns a DIFFERENT box per player for per-player info", () => {
    const rects = computeViewportRects(4, 1920, 1080);
    const geometry = computeHudGeometry(rects, 1920, 1080);

    const boosts = rects.map((_, i) => placeHudInfo(geometry, "boost", i));
    expect(new Set(boosts).size).toBe(4);
    const chips = rects.map((_, i) => placeHudInfo(geometry, "ballCam", i));
    expect(new Set(chips).size).toBe(4);
  });

  it("keeps every per-player box inside its own rect", () => {
    for (const count of [1, 2, 3, 4, 6]) {
      const rects = computeViewportRects(count, 1920, 1080);
      const geometry = computeHudGeometry(rects, 1920, 1080);
      expect(hudGeometryIsContained(geometry), `${count}p`).toBe(true);
      geometry.players.forEach((slot) => {
        expect(inside(slot.rect, slot.boost)).toBe(true);
        expect(inside(slot.rect, slot.ballCam)).toBe(true);
      });
    }
  });

  it("pushes the top row's ball-cam chip clear of the global band", () => {
    const rects = computeViewportRects(4, 1920, 1080);
    const geometry = computeHudGeometry(rects, 1920, 1080, { inset: 12, bandHeight: 28 });

    // Top-row players (indices 0 and 1) share their first bandHeight pixels
    // with the score/clock, so their chip sits below the band.
    expect(geometry.players[0].ballCam.y).toBe(28 + 12);
    expect(geometry.players[1].ballCam.y).toBe(28 + 12);
    expect(geometry.players[0].ballCam.y).toBeGreaterThanOrEqual(geometry.global.height);

    // The bottom row is already clear of the band, so it gets no extra push:
    // its chip is a plain inset from its own rect's top.
    expect(geometry.players[2].ballCam.y).toBe(rects[2].y + 12);
    expect(geometry.players[3].ballCam.y).toBe(rects[3].y + 12);
  });

  it("puts the boost meter at the bottom-left of each rect", () => {
    const rects = computeViewportRects(4, 1920, 1080);
    const geometry = computeHudGeometry(rects, 1920, 1080);
    geometry.players.forEach((slot, i) => {
      expect(slot.boost.x).toBeGreaterThanOrEqual(slot.rect.x);
      expect(slot.boost.x).toBeLessThan(slot.rect.x + slot.rect.width / 2);
      const bottom = slot.boost.y + slot.boost.height;
      expect(bottom).toBeLessThanOrEqual(slot.rect.y + slot.rect.height);
      expect(rects[i].index).toBe(slot.index);
    });
  });

  it("shrinks rather than spills when the rect is too small for the box", () => {
    // A 6-way grid on a tiny canvas gives small rects; a HUD element that
    // spills into a neighbour is worse than a small one.
    const rects = computeViewportRects(6, 320, 180);
    const geometry = computeHudGeometry(rects, 320, 180);
    expect(hudGeometryIsContained(geometry)).toBe(true);
  });

  it("returns null for a player index with no viewport", () => {
    const rects = computeViewportRects(2, 1920, 1080);
    const geometry = computeHudGeometry(rects, 1920, 1080);
    expect(placeHudInfo(geometry, "boost", 5)).toBeNull();
  });

  it("divides the global band into score / clock / opponent thirds", () => {
    const rects = computeViewportRects(2, 1920, 1080);
    const geometry = computeHudGeometry(rects, 1920, 1080);
    expect(geometry.global.score.width).toBeCloseTo(640, 6);
    expect(geometry.global.clock.x).toBeCloseTo(640, 6);
    expect(geometry.global.clock.width).toBeCloseTo(640, 6);
    expect(geometry.global.opponentScore.x).toBeCloseTo(1280, 6);
  });
});
