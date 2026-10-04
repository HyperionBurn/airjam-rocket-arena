/**
 * The local-match launch path, with no donor, no WASM and no browser.
 *
 * What is pinned here is the contract between the lobby's roster and the donor's
 * car list: seat i is car i is slot i, humans come first, bots after, and the
 * arena cap is respected by trimming bots before humans.
 */
// @ts-ignore -- untyped donor module (pure geometry, no imports)
import { tileViewports } from "../../donor/app/tile-viewports.js";
import { describe, expect, it, vi } from "vitest";

import { planBotCars } from "@/host/bot-driver";
import { launchLocalMatch, type LocalMatchController } from "@/host/local-match";

type Rect = { x: number; y: number; width: number; height: number };

describe("tileViewports", () => {
  const area = (rects: Rect[]) => rects.reduce((sum, r) => sum + r.width * r.height, 0);
  const overlaps = (a: Rect, b: Rect) =>
    a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

  it.each([1, 2, 3, 4, 5, 6])("tiles %i views with no gap and no overlap", (count) => {
    for (const [w, h] of [
      [1920, 1080],
      [1280, 720],
      [1366, 768],
      [1001, 733],
    ] as const) {
      const rects = tileViewports(count, w, h) as Rect[];
      expect(rects).toHaveLength(count);
      expect(area(rects)).toBe(w * h);
      for (let i = 0; i < rects.length; i += 1) {
        for (let j = i + 1; j < rects.length; j += 1) expect(overlaps(rects[i]!, rects[j]!)).toBe(false);
        expect(rects[i]!.x).toBeGreaterThanOrEqual(0);
        expect(rects[i]!.y).toBeGreaterThanOrEqual(0);
        expect(rects[i]!.x + rects[i]!.width).toBeLessThanOrEqual(w);
        expect(rects[i]!.y + rects[i]!.height).toBeLessThanOrEqual(h);
      }
    }
  });

  it("uses the classic layouts", () => {
    const two = tileViewports(2, 1600, 900) as Rect[];
    expect(two.map((r) => [r.x, r.y, r.width, r.height])).toEqual([
      [0, 0, 800, 900],
      [800, 0, 800, 900],
    ]);
    // Three: two on top, one full-width underneath.
    const three = tileViewports(3, 1600, 900) as Rect[];
    expect(three[2]).toEqual({ x: 0, y: 450, width: 1600, height: 450 });
    // Four: a 2x2 grid.
    expect((tileViewports(4, 1600, 900) as Rect[]).map((r) => [r.x, r.y])).toEqual([
      [0, 0],
      [800, 0],
      [0, 450],
      [800, 450],
    ]);
  });

  it("stacks two views on a portrait screen and returns nothing for no views", () => {
    const rects = tileViewports(2, 900, 1600) as Rect[];
    expect(rects.map((r) => [r.x, r.y, r.width, r.height])).toEqual([
      [0, 0, 900, 800],
      [0, 800, 900, 800],
    ]);
    expect(tileViewports(0, 1600, 900)).toEqual([]);
  });
});

describe("planBotCars", () => {
  it("fills each team up to the team size using the humans actually on it", () => {
    // Two friends both picked blue: orange gets the bots, blue gets none.
    expect(planBotCars([0, 0], 2, 6)).toEqual([1, 1]);
    expect(planBotCars([0, 1], 2, 6)).toEqual([0, 1]);
    expect(planBotCars([0], 3, 6)).toEqual([0, 0, 1, 1, 1]);
  });

  it("gives a lone human an opponent even when the teams are already 'full'", () => {
    expect(planBotCars([0], 1, 6)).toEqual([1]);
    expect(planBotCars([1], 1, 6)).toEqual([0]);
  });

  it("never drops a human to make room: bots are trimmed first", () => {
    expect(planBotCars([0, 0, 0, 1], 3, 6)).toEqual([1, 1]);
    // ...and when only one bot fits, the extra one is the one dropped.
    expect(planBotCars([0, 0, 0, 1], 3, 5)).toEqual([1]);
    expect(planBotCars([0, 0, 0, 1, 1, 1], 3, 6)).toEqual([]);
    expect(planBotCars([0], 3, 4)).toEqual([0, 0, 1]);
  });

  it("adds no bots for an empty roster", () => {
    expect(planBotCars([], 2, 6)).toEqual([0, 0, 1, 1].slice(0, 4));
  });
});

const fakeController = (maxCars = 6) => {
  const start = vi.fn(async (roster: ReadonlyArray<unknown>, _options?: unknown) => ({
    cars: roster.length,
    views: roster.length,
  }));
  const setBotDriver = vi.fn();
  const controller = { maxCars, start, setBotDriver } as unknown as LocalMatchController;
  return { controller, start, setBotDriver };
};

const fakeRuntime = (refuse: ReadonlySet<number> = new Set()) => ({
  reseat: (seats: ReadonlyArray<{ playerId: string; team: 0 | 1 }>) =>
    seats.map((_, index) => (refuse.has(index) ? null : index)),
});

describe("launchLocalMatch", () => {
  it("seats humans first, then bots, as one dense car list", async () => {
    const { controller, start, setBotDriver } = fakeController();
    const result = await launchLocalMatch(
      fakeRuntime(),
      controller,
      [
        { playerId: "a", team: 0 },
        { playerId: "b", team: 1 },
      ],
      { botTeams: [0, 1], botDifficulty: "seer", matchSeconds: 180 },
    );

    expect(start).toHaveBeenCalledTimes(1);
    expect(start.mock.calls[0]![0]).toEqual([
      { team: 0 },
      { team: 1 },
      { team: 0, human: false },
      { team: 1, human: false },
    ]);
    expect(start.mock.calls[0]![1]).toEqual({ matchSeconds: 180 });
    expect(result.seats).toEqual(["a", "b"]);
    expect(result.botTeams).toEqual([0, 1]);
    // 4 cars: the neural policies are 1v1 only, so these bots are scripted.
    expect(result.bots?.mode).toBe("scripted");
    expect(result.bots?.bots.map((b) => b.slot)).toEqual([2, 3]);
    expect(setBotDriver).toHaveBeenCalledWith(result.bots);
    result.bots?.stop();
  });

  it("starts a bot-free match without a driver", async () => {
    const { controller, setBotDriver } = fakeController();
    const result = await launchLocalMatch(fakeRuntime(), controller, [
      { playerId: "a", team: 0 },
      { playerId: "b", team: 1 },
    ]);
    expect(result.bots).toBeNull();
    expect(setBotDriver).toHaveBeenCalledWith(null);
  });

  it("drops a seat the registry refused instead of leaving a hole", async () => {
    const { controller, start } = fakeController();
    const result = await launchLocalMatch(fakeRuntime(new Set([1])), controller, [
      { playerId: "a", team: 0 },
      { playerId: "b", team: 1 },
      { playerId: "c", team: 1 },
    ]);
    expect(result.seats).toEqual(["a", "c"]);
    expect(start.mock.calls[0]![0]).toHaveLength(2);
  });

  it("trims bots, never humans, to the arena size", async () => {
    const { controller, start } = fakeController(4);
    const result = await launchLocalMatch(
      fakeRuntime(),
      controller,
      [
        { playerId: "a", team: 0 },
        { playerId: "b", team: 0 },
        { playerId: "c", team: 1 },
      ],
      { botTeams: [1, 1, 1] },
    );
    expect(start.mock.calls[0]![0]).toHaveLength(4);
    expect(result.seats).toHaveLength(3);
    expect(result.botTeams).toEqual([1]);
    result.bots?.stop();
  });

  it("refuses an empty roster", async () => {
    const { controller } = fakeController();
    await expect(launchLocalMatch(fakeRuntime(new Set([0])), controller, [{ playerId: "a", team: 0 }])).rejects.toThrow(
      /No player could be seated/,
    );
  });

  it("stops the bot driver when the donor refuses to start", async () => {
    const { controller, start } = fakeController();
    start.mockRejectedValueOnce(new Error("no arena"));
    await expect(
      launchLocalMatch(fakeRuntime(), controller, [{ playerId: "a", team: 0 }, { playerId: "b", team: 1 }], {
        botTeams: [0, 1],
      }),
    ).rejects.toThrow("no arena");
  });
});

describe("launchLocalMatch - car choices and tuning", () => {
  it("passes each player's garage car through, and the bots' car to the bots", async () => {
    const { controller, start } = fakeController();
    const result = await launchLocalMatch(
      fakeRuntime(),
      controller,
      [
        { playerId: "a", team: 0, carId: "spectre" },
        { playerId: "b", team: 1, carId: null },
      ],
      { botTeams: [0, 1], botVisual: "challenger" },
    );
    expect(start.mock.calls[0]![0]).toEqual([
      { team: 0, visual: "spectre" },
      { team: 1 }, // no preference: the donor picks the body
      { team: 0, human: false, visual: "challenger" },
      { team: 1, human: false, visual: "challenger" },
    ]);
    expect(result.teams).toEqual([0, 1, 0, 1]);
    result.bots?.stop();
  });

  it("hands the event tuning to the donor untouched", async () => {
    const { controller, start } = fakeController();
    const tuning = { boost: "turbo", ball: "heavy", kickoffReset: "fast", goalCelebration: "short" } as const;
    await launchLocalMatch(fakeRuntime(), controller, [{ playerId: "a", team: 0 }], { matchSeconds: 90, tuning });
    expect(start.mock.calls[0]![1]).toEqual({ matchSeconds: 90, tuning });
  });
});

describe("bot driver - handing a car to a human and back", () => {
  it("release() stops driving a car; adopt() starts driving one again", async () => {
    const { controller } = fakeController();
    const result = await launchLocalMatch(
      fakeRuntime(),
      controller,
      [{ playerId: "a", team: 0 }, { playerId: "b", team: 1 }],
      { botTeams: [0, 1] },
    );
    const driver = result.bots!;
    expect(driver.bots.map((b) => b.slot)).toEqual([2, 3]);
    expect(driver.controls(3)).not.toBeNull();

    // A late joiner takes car 3.
    driver.release(3);
    expect(driver.bots.map((b) => b.slot)).toEqual([2]);
    expect(driver.controls(3)).toBeNull();

    // They leave: a scripted bot picks the car up again.
    driver.adopt({ slot: 3, team: 1 });
    expect(driver.bots.map((b) => b.slot)).toEqual([2, 3]);
    expect(driver.controls(3)).not.toBeNull();

    // Adopting a car that already has a bot is a no-op, not a second driver.
    driver.adopt({ slot: 3, team: 1 });
    expect(driver.bots).toHaveLength(2);
    driver.release(99); // unknown car: harmless
    driver.stop();
    expect(driver.bots).toHaveLength(0);
  });
});

