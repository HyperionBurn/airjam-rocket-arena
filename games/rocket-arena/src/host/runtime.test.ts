/**
 * Host runtime wiring: the join → arena-growth path, and the snapshot's growth
 * readout, with no donor and no WASM.
 *
 * `createHostRuntime` is testable up to the point where the donor's sim is
 * needed: `install()` imports the donor lazily and is deliberately NOT called
 * here, so `sim` stays null. That is exactly the state the page is in between
 * mount and the donor's first `setControls`, which is where a growth request
 * has to be remembered rather than dropped.
 */

import { describe, expect, it } from "vitest";

import { createHostRuntime } from "@/host/runtime";
import type { GuardTarget } from "@/airjam/input";

const guardTarget: GuardTarget = {
  window: { addEventListener: () => {}, removeEventListener: () => {} },
  document: { addEventListener: () => {}, removeEventListener: () => {} },
  isHidden: () => false,
};

describe("host runtime — a claimed seat becomes a real car", () => {
  it("hands out a slot and remembers the growth request for when the sim lands", () => {
    const runtime = createHostRuntime({ readRaw: () => null, guardTarget });

    expect(runtime.join("p1")).toBe(0);
    expect(runtime.join("p2")).toBe(1);
    expect(runtime.join("p3")).toBe(2);

    const snapshot = runtime.snapshot();
    // No donor sim yet, so the arena cannot have grown — but the request is
    // queued rather than lost, which is the whole point of the pending flag.
    expect(snapshot.carCount).toBe(0);
    expect(snapshot.growth.pending).toBe(true);
    expect(snapshot.growth.available).toBe(false);
    expect(snapshot.growth.refusal).toBeNull();
    expect(snapshot.growth.added).toBe(0);
    expect(snapshot.players.map((player) => player.slot)).toEqual([0, 1, 2]);

    runtime.dispose();
  });

  it("never throws while there is no simulation to grow into", () => {
    const runtime = createHostRuntime({ readRaw: () => null, guardTarget });
    expect(() => runtime.join("p1")).not.toThrow();
    expect(() => runtime.ensureCapacity(6)).not.toThrow();
    expect(() => runtime.ensureCapacity(0)).not.toThrow();
    expect(() => runtime.ensureCapacity(Number.NaN)).not.toThrow();
    // A negative or NaN target is a caller mistake, not a match-ending event.
    expect(runtime.snapshot().growth.pending).toBe(true);
    runtime.dispose();
  });

  it("reports a full arena instead of throwing when the registry is full", () => {
    const runtime = createHostRuntime({ readRaw: () => null, guardTarget });
    for (let i = 0; i < 8; i += 1) expect(runtime.join(`p${i}`)).toBe(i);
    // MAX_CARS is the bridge's cap: a ninth player has no seat.
    expect(runtime.join("p8")).toBeNull();
    expect(runtime.snapshot().players).toHaveLength(8);
    runtime.dispose();
  });

  it("clears the growth request on dispose", () => {
    const runtime = createHostRuntime({ readRaw: () => null, guardTarget });
    runtime.join("p1");
    expect(runtime.snapshot().growth.pending).toBe(true);
    runtime.dispose();
    expect(runtime.snapshot().growth.pending).toBe(false);
    expect(runtime.snapshot().growth.added).toBe(0);
  });
});

describe("host runtime — re-seating for a match launch", () => {
  const seats = (...entries: Array<[string, 0 | 1]>) => entries.map(([playerId, team]) => ({ playerId, team }));

  it("seats the lobby roster densely, in order, on the chosen teams", () => {
    const runtime = createHostRuntime({ readRaw: () => null, guardTarget, growOnJoin: false });
    // Auto-seating at join time (what the roster effect does) ...
    runtime.join("c");
    runtime.join("a");
    runtime.join("b");
    // ... is replaced by the lobby's order and team choices.
    const slots = runtime.reseat(seats(["a", 1], ["b", 1], ["c", 0]));
    expect(slots).toEqual([0, 1, 2]);
    const players = runtime.snapshot().players;
    expect(players.map((p) => [p.playerId, p.slot, p.team])).toEqual([
      ["a", 0, 1],
      ["b", 1, 1],
      ["c", 2, 0],
    ]);
    runtime.dispose();
  });

  it("stays dense even for players who previously held higher slots", () => {
    const runtime = createHostRuntime({ readRaw: () => null, guardTarget, growOnJoin: false });
    for (const id of ["p0", "p1", "p2", "p3"]) runtime.join(id);
    runtime.leave("p0");
    runtime.leave("p1");
    // p3 used to hold slot 3; after a re-seat it must be slot 0, not 3.
    expect(runtime.reseat(seats(["p3", 0], ["p2", 1]))).toEqual([0, 1]);
    runtime.dispose();
  });

  it("does not grow the arena on join when growth is switched off", () => {
    const runtime = createHostRuntime({ readRaw: () => null, guardTarget, growOnJoin: false });
    runtime.join("p1");
    expect(runtime.snapshot().growth.pending).toBe(false);
    runtime.dispose();
  });

  it("reports a phone's lobby choices without driving anything", () => {
    const runtime = createHostRuntime({
      readRaw: () => ({ stick: { x: 0, y: 0 }, lobby: { ready: true, team: "orange", name: "Kay" } }),
      guardTarget,
      growOnJoin: false,
    });
    runtime.join("p1");
    expect(runtime.peekLobby("p1")).toEqual({ ready: true, team: "orange", name: "Kay", carId: null });
    expect(runtime.peekLobby("nobody")).toBeNull();
    expect(runtime.diagnose("p1")?.live).toBe(true);
    runtime.dispose();
  });
});

describe("host runtime — taking a specific car (late joiners, reconnects)", () => {
  it("puts a late joiner on exactly the car asked for, on that car's team", () => {
    const runtime = createHostRuntime({ readRaw: () => null, guardTarget, growOnJoin: false });
    runtime.reseat([
      { playerId: "a", team: 0 },
      { playerId: "b", team: 1 },
    ]);
    // Cars 2 and 3 are bots; a new phone takes car 3 (orange).
    runtime.join("late"); // the roster effect auto-seats everyone first
    expect(runtime.takeSeat("late", 3, 1)).toBe(3);
    const late = runtime.snapshot().players.find((p) => p.playerId === "late");
    expect([late?.slot, late?.team]).toEqual([3, 1]);
    // Their old auto-assigned slot is free again.
    expect(runtime.join("another")).toBe(2);
    runtime.dispose();
  });

  it("refuses a car somebody else is driving", () => {
    const runtime = createHostRuntime({ readRaw: () => null, guardTarget, growOnJoin: false });
    runtime.reseat([
      { playerId: "a", team: 0 },
      { playerId: "b", team: 1 },
    ]);
    runtime.join("late");
    expect(runtime.takeSeat("late", 1, 1)).toBeNull();
    expect(runtime.takeSeat("late", 99, 1)).toBeNull();
    runtime.dispose();
  });
});

