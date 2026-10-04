/**
 * ============================================================================
 * PHASE 12 — EVENT MODE. Tests.
 * ============================================================================
 *
 * OWNER: the Event Mode worker (`src/airjam/event/**`).
 *
 * These run under `environment: "node"`. Nothing here imports `src/donor/**`, a
 * WASM module, Three.js or a DOM, which is the point: the whole EVENT MODE
 * pipeline is provable with no arena.
 *
 * The KNOWN OPEN DEFECT in the port build — a match never leaves its opening
 * phase because the donor's sim does not step — is NOT tested here and cannot be
 * tested here. It is owned by another worker. What these tests establish is
 * everything upstream of the sim: the configuration, the roster, the guard, the
 * pacing arithmetic and the rematch contract.
 */

import { describe, expect, it } from "vitest";
import { EVENT_MODE_SETTINGS, matchDurationMs } from "@/lobby/settings";
import { MUTATOR_REGISTRY } from "@/match/sim-config";
import { canDriveArena, getBotDifficulty } from "@/airjam/bots/bot-difficulty";
import { planBotFill } from "@/airjam/bots/bot-fill-plan";
import { MAX_CARS } from "@/airjam/seam";
import {
  DEFAULT_PACING,
  EVENT_MODE_DOCUMENTED_VALUES,
  EVENT_MODE_SPEC,
  EVENT_PACING,
  applyEventMode,
  deriveEventCycle,
  dryRunEventMatch,
  eventCycleHeadline,
  eventPlanSignature,
  firstRefusal,
  fourPlayers,
  guardEventMatch,
  pacingForTuning,
  resolveEventBotMode,
  resolveEventTeamSize,
  runEventMatch,
  type EventMatchInput,
  type EventModeSpec,
} from "../index.js";

/* ========================================================================== */
describe("EVENT MODE spec — the declarative source of truth", () => {
  it("matches the brief's documented values, through the lobby's own constant", () => {
    // Re-asserting the documented contract as DATA. `EVENT_MODE_SETTINGS` is
    // owned by the lobby worker and must not be edited from here, so this is the
    // one place a drift between the two would be noticed.
    expect({
      playerSlots: EVENT_MODE_SETTINGS.playerSlots,
      teamSize: EVENT_MODE_SETTINGS.teamSize,
      matchLength: EVENT_MODE_SETTINGS.matchLength,
      botFill: EVENT_MODE_SETTINGS.botFill,
      botDifficulty: EVENT_MODE_SETTINGS.botDifficulty,
      instantRematch: EVENT_MODE_SETTINGS.instantRematch,
      ...EVENT_MODE_SETTINGS.tuning,
    }).toEqual(EVENT_MODE_DOCUMENTED_VALUES);
  });

  it("is 4 players, 2v2, 3 minutes, normal boost/ball, fast reset, short screens, instant rematch", () => {
    const plan = applyEventMode();
    expect(plan.lobbySettings.playerSlots).toBe(4);
    expect(plan.lobbySettings.matchLength).toBe(3);
    expect(plan.matchLengthMs).toBe(180_000);
    expect(plan.lobbySettings.botFill).toBe("fill");
    expect(plan.lobbySettings.botDifficulty).toBe("pro");
    expect(plan.lobbySettings.instantRematch).toBe(true);
    expect(plan.lobbySettings.eventMode).toBe(true);
    expect(plan.tuning).toEqual({
      boost: "normal",
      ball: "normal",
      kickoffReset: "fast",
      goalCelebration: "short",
      postMatchScreen: "short",
    });
    // 2v2, and the mutator is stock.
    expect(plan.bots.teamSize).toBe(2);
    expect(plan.mutator).toBe("NORMAL");
    expect(plan.simConfig).toEqual(expect.objectContaining({ id: "NORMAL", unlimitedBoost: false }));
  });

  it("resolves the mutator through Phase 7's registry, not by restating it", () => {
    const plan = applyEventMode();
    for (const key of [
      "unlimitedBoost",
      "ballRadiusScale",
      "ballVelocityScale",
      "ballMassScale",
      "driveScale",
      "steerScale",
      "gravityBias",
      "boostDrainScale",
      "jumpScale",
      "contactImpulse",
    ] as const) {
      expect(plan.simConfig[key]).toBe(MUTATOR_REGISTRY.NORMAL[key]);
    }
  });

  it("starts on a quality preset Phase 10 chose, bounded by the event ceiling", () => {
    const plan = applyEventMode({ players: 4 });
    expect(plan.quality.viewportCount).toBe(4);
    expect(plan.quality.fromViewportCount).toBe("BALANCED");
    // 4 viewports is BALANCED, which is poorer than the HIGH event ceiling, so
    // the ceiling does not bind here.
    expect(plan.quality.preset).toBe("BALANCED");
    expect(plan.quality.eventCeilingBound).toBe(false);

    // One player would be ULTRA from the viewport table; the event ceiling caps it.
    const solo = applyEventMode({ players: 1 });
    expect(solo.quality.fromViewportCount).toBe("ULTRA");
    expect(solo.quality.preset).toBe("HIGH");
    expect(solo.quality.eventCeilingBound).toBe(true);
  });

  it("produces a plan that is JSON-serialisable end to end", () => {
    const plan = applyEventMode();
    const round = JSON.parse(eventPlanSignature(plan)) as Record<string, unknown>;
    expect(round).toEqual(JSON.parse(JSON.stringify(plan)));
    // No Map/Set/class instance survives: a round trip through JSON is lossless.
    expect(Object.keys(round).sort()).toEqual(Object.keys(plan).sort());
  });

  it("derives its pacing from the lobby's tuning union, and they agree", () => {
    // The plan must not disagree with the settings the reducer is about to write.
    const plan = applyEventMode();
    expect(plan.pacing).toEqual(pacingForTuning(EVENT_MODE_SETTINGS.tuning, true));
    expect(plan.pacing).toEqual(EVENT_PACING);
  });
});

/* ========================================================================== */
describe("applyEventMode() — idempotence", () => {
  it("is a pure function: the same input yields a byte-identical plan", () => {
    const a = applyEventMode();
    const b = applyEventMode();
    expect(eventPlanSignature(a)).toBe(eventPlanSignature(b));
    expect(a).toEqual(b);
  });

  it("is idempotent across a spread of player counts", () => {
    for (const players of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 12]) {
      const first = eventPlanSignature(applyEventMode({ players }));
      const second = eventPlanSignature(applyEventMode({ players }));
      const third = eventPlanSignature(applyEventMode({ players }));
      expect(second).toBe(first);
      expect(third).toBe(first);
    }
  });

  it("carries no clock and no randomness — the same plan ten times running", () => {
    // A `Date.now()` anywhere in the derivation would break this immediately.
    const signatures = new Set<string>();
    for (let i = 0; i < 10; i += 1) signatures.add(eventPlanSignature(applyEventMode({ players: 4 })));
    expect(signatures.size).toBe(1);
  });

  it("emits exactly one lobby dispatch, and it is the preset itself", () => {
    const plan = applyEventMode();
    expect(plan.lobbyActions).toEqual([{ type: "settings/eventMode", enabled: true }]);
  });
});

/* ========================================================================== */
describe("the pacing layer — timings and the derived cycle", () => {
  it("expresses fast kickoff reset, short celebration, short post-match and instant rematch as data", () => {
    expect(EVENT_PACING.kickoffResetMs).toBeLessThan(DEFAULT_PACING.kickoffResetMs);
    expect(EVENT_PACING.kickoffCountdownMs).toBeLessThan(DEFAULT_PACING.kickoffCountdownMs);
    expect(EVENT_PACING.goalCelebrationMs).toBeLessThan(DEFAULT_PACING.goalCelebrationMs);
    expect(EVENT_PACING.replayMs).toBeLessThan(DEFAULT_PACING.replayMs);
    expect(EVENT_PACING.postMatchDwellMs).toBeLessThan(DEFAULT_PACING.postMatchDwellMs);
    expect(EVENT_PACING.rematchReadyMs).toBeLessThan(DEFAULT_PACING.rematchReadyMs);
    // The donor-derived beats are fractions of the donor's own constants, not
    // fresh numbers: half the countdown, a third of the goal hold.
    expect(EVENT_PACING.kickoffCountdownMs).toBe(DEFAULT_PACING.kickoffCountdownMs / 2);
    expect(EVENT_PACING.goalCelebrationMs).toBe(DEFAULT_PACING.goalCelebrationMs / 3);
    // The donor's own 3-second countdown and 3-second goal hold, at 120 Hz.
    expect(DEFAULT_PACING.kickoffCountdownMs).toBe(3_000);
    expect(DEFAULT_PACING.goalCelebrationMs).toBe(3_000);
  });

  it("derives the 4-player cycle by the documented formula", () => {
    const cycle = applyEventMode({ players: 4 }).cycle;
    const p = EVENT_PACING;
    const regulation = matchDurationMs(3) as number;

    // base = regulation + kickoffReset + kickoffCountdown + postMatchDwell + rematchReady
    const base = regulation + p.kickoffResetMs + p.kickoffCountdownMs + p.postMatchDwellMs + p.rematchReadyMs;
    // perGoal = celebration + replay + the kickoff that follows it
    const perGoal = p.goalCelebrationMs + p.replayMs + p.kickoffResetMs + p.kickoffCountdownMs;
    // minSpacing = kickoff + the declared ball traverse
    const minSpacing = p.kickoffResetMs + p.kickoffCountdownMs + EVENT_MODE_SPEC.pacingAssumptions.minBallTraverseMs;
    const maxGoals = Math.floor(regulation / minSpacing);

    expect(cycle.regulationMs).toBe(180_000);
    expect(cycle.baseCycleMs).toBe(base);
    expect(cycle.perGoalMs).toBe(perGoal);
    expect(cycle.minGoalSpacingMs).toBe(minSpacing);
    expect(cycle.maxGoalsInRegulation).toBe(maxGoals);
    expect(cycle.worstCaseCycleMs).toBe(base + maxGoals * perGoal);
    expect(cycle.typicalGoalsInRegulation).toBe(9);
    expect(cycle.typicalCycleMs).toBe(base + 9 * perGoal);
  });

  it("reports a full cycle time an operator can be told", () => {
    const cycle = applyEventMode({ players: 4 }).cycle;
    expect(cycle.worstCaseCycleMs).not.toBeNull();
    expect(cycle.typicalCycleMs).not.toBeNull();
    expect(cycle.worstCaseCycleLabel).toBe("6:01");
    expect(cycle.typicalCycleLabel).toBe("3:45");
    expect(cycle.matchesPerHourWorstCase).toBe(9);
    expect(cycle.matchesPerHourTypical).toBe(16);
    expect(cycle.headline).toContain("3:45");
    expect(cycle.headline).toContain("6:01");
    expect(eventCycleHeadline(4)).toBe(cycle.headline);
  });

  it("is faster than the stock profile at every beat, so throughput cannot regress", () => {
    const stock = deriveEventCycle(DEFAULT_PACING, 3);
    const event = deriveEventCycle(EVENT_PACING, 3);
    expect(event.typicalCycleMs as number).toBeLessThan(stock.typicalCycleMs as number);
    expect(event.worstCaseCycleMs as number).toBeLessThan(stock.worstCaseCycleMs as number);
    expect(event.matchesPerHourTypical as number).toBeGreaterThan(stock.matchesPerHourTypical as number);
  });

  it("has no finite cycle for an UNLIMITED match, and says so instead of lying", () => {
    const cycle = deriveEventCycle(EVENT_PACING, 0);
    expect(cycle.regulationMs).toBeNull();
    expect(cycle.worstCaseCycleMs).toBeNull();
    expect(cycle.typicalCycleMs).toBeNull();
    expect(cycle.matchesPerHourTypical).toBeNull();
    expect(cycle.headline).toContain("UNLIMITED");
  });
});

/* ========================================================================== */
describe("bots — Phase 8's two hard constraints, honoured", () => {
  it("cannot use donor AI at 2v2, because the models are 1v1-only", () => {
    // The donor's own guard, first: all three models hard-require 2 cars.
    for (const id of ["seer", "necto", "nexto"] as const) {
      expect(canDriveArena(id, 2)).toBe(true);
      expect(canDriveArena(id, 4)).toBe(false);
    }
    // So EVENT MODE at 4 cars resolves to the scripted path, with a reason.
    const resolution = resolveEventBotMode(4);
    expect(resolution.mode).toBe("scripted");
    expect(resolution.downgraded).toBe(true);
    expect(resolution.downgradeReason).toMatch(/1v1 policy/);
  });

  it("never loads a non-commercial model, at any arena size", () => {
    expect(getBotDifficulty("seer").commercialUse).toBe("permitted");
    expect(getBotDifficulty("necto").commercialUse).toBe("forbidden");
    expect(getBotDifficulty("nexto").commercialUse).toBe("forbidden");
    for (const cars of [2, 4, 6, 8]) {
      const resolution = resolveEventBotMode(cars);
      expect(resolution.commercialUse).toBe("permitted");
      expect(resolution.license).toBe("MIT");
    }
  });

  it("downgrades to the off switch when the spec demands commercial use of a non-commercial model", () => {
    const hostile: EventModeSpec = {
      ...EVENT_MODE_SPEC,
      bots: { ...EVENT_MODE_SPEC.bots, model: "nexto", license: "CC-BY-NC-SA-4.0" },
    };
    const resolution = resolveEventBotMode(4, hostile);
    expect(resolution.model).toBe("disabled");
    expect(resolution.commercialUse).toBe("not-applicable");
    expect(resolution.downgradeReason).toMatch(/commercial/i);
  });

  it("maps every lobby skill level onto the MIT model, so NC ids are unreachable", () => {
    for (const skill of ["rookie", "pro", "ace"] as const) {
      const spec: EventModeSpec = {
        ...EVENT_MODE_SPEC,
        bots: { ...EVENT_MODE_SPEC.bots, skill, model: "seer", license: "MIT" },
      };
      expect(resolveEventBotMode(2, spec).mode).toBe("neural");
      expect(resolveEventBotMode(4, spec).mode).toBe("scripted");
    }
  });

  it("reports the 1v1 downgrade as a notice, not a refusal", () => {
    const plan = runEventMatch({ launch: "start", players: fourPlayers() });
    expect(plan.guard.ok).toBe(true);
    expect(plan.guard.notices.map((n) => n.code)).toContain("bot-mode-downgraded");
  });
});

/* ========================================================================== */
describe("runEventMatch() — the documented 4-player event", () => {
  const plan = runEventMatch({ launch: "start", players: fourPlayers() });

  it("seats four humans in 2v2 with no bots", () => {
    expect(plan.guard.ok).toBe(true);
    expect(plan.seatedHumans).toBe(4);
    expect(plan.totalCars).toBe(4);
    expect(plan.botFill.totalBots).toBe(0);
    expect(plan.teamSizes).toEqual([2, 2]);
    expect(plan.seats.map((s) => s.playerId)).toEqual(["p1", "p2", "p3", "p4"]);
    expect(plan.seats.map((s) => s.team)).toEqual([0, 1, 0, 1]);
  });

  it("is idempotent: the same starting state resolves to the same plan", () => {
    const again = runEventMatch({ launch: "start", players: fourPlayers() });
    expect(again.signature).toBe(plan.signature);
    expect(again).toEqual(plan);
  });

  it("carries the whole resolved configuration", () => {
    expect(plan.eventMode.mutator).toBe("NORMAL");
    expect(plan.eventMode.quality.preset).toBe("BALANCED");
    expect(plan.pacing).toEqual(EVENT_PACING);
    expect(plan.cycle.regulationMs).toBe(180_000);
    expect(plan.eventMode.bots.resolution.mode).toBe("scripted");
  });

  it("never issues a join or a leave", () => {
    expect(plan.issuedJoins).toBe(0);
    expect(plan.issuedLeaves).toBe(0);
    for (const action of plan.lobbyActions) {
      expect(action.type).not.toBe("player/join");
      expect(action.type).not.toBe("player/leave");
    }
  });
});

/* ========================================================================== */
describe("rematch — the contract that makes throughput possible", () => {
  const start = runEventMatch({ launch: "start", players: fourPlayers(), matchNumber: 1 });
  const rematch = runEventMatch({ launch: "rematch", players: fourPlayers(), matchNumber: 2 });

  it("issues no join and no leave, and only one dispatch", () => {
    expect(rematch.issuedJoins).toBe(0);
    expect(rematch.issuedLeaves).toBe(0);
    expect(rematch.lobbyActions).toEqual([{ type: "match/rematch" }]);
    for (const action of rematch.lobbyActions) {
      expect(action.type).not.toBe("player/join");
      expect(action.type).not.toBe("player/leave");
    }
  });

  it("preserves player identity, team and seat index", () => {
    const before = start.seats.map((s) => [s.playerId, s.name, s.team, s.seat]);
    const after = rematch.seats.map((s) => [s.playerId, s.name, s.team, s.seat]);
    expect(after).toEqual(before);
  });

  it("resets only score, clock and positions", () => {
    expect(rematch.reset.score).toEqual({ 0: 0, 1: 0 });
    expect(rematch.reset.clockMs).toBe(180_000);
    expect(rematch.reset.positions).toBe("kickoff");
    expect(rematch.reset.stats).toBe("reset");
    expect(rematch.reset.goalFeed).toBe("reset");
    expect(rematch.reset.preserved).toEqual(["players", "teams", "seats", "settings", "botSeats"]);
  });

  it("carries the configuration forward untouched", () => {
    expect(eventPlanSignature(rematch.eventMode)).toBe(eventPlanSignature(start.eventMode));
    expect(rematch.pacing).toEqual(start.pacing);
    expect(rematch.eventMode.mutator).toBe(start.eventMode.mutator);
    expect(rematch.eventMode.quality.preset).toBe(start.eventMode.quality.preset);
    expect(rematch.teamSizes).toEqual(start.teamSizes);
  });

  it("is itself idempotent, and increments the match number only when told to", () => {
    const a = runEventMatch({ launch: "rematch", players: fourPlayers(), matchNumber: 2 });
    const b = runEventMatch({ launch: "rematch", players: fourPlayers(), matchNumber: 2 });
    expect(a.signature).toBe(b.signature);
    // The HOST owns the counter. This module keeps none of its own, which is
    // what makes the idempotence above possible at all.
    expect(a.matchNumber).toBe(2);
    expect(runEventMatch({ launch: "rematch", players: fourPlayers() }).matchNumber).toBe(1);
  });

  it("keeps a bot seat on the same side after a rematch", () => {
    // One player + 3 bots: the bots are the part most likely to drift.
    const soloStart = runEventMatch({ launch: "start", players: [{ playerId: "solo" }] });
    const soloRematch = runEventMatch({ launch: "rematch", players: [{ playerId: "solo" }] });
    const strip = (p: typeof soloStart) => p.seats.map((s) => [s.seat, s.role, s.team]);
    expect(strip(soloRematch)).toEqual(strip(soloStart));
    expect(soloRematch.totalCars).toBe(4);
    expect(soloRematch.teamSizes).toEqual([2, 2]);
  });
});

/* ========================================================================== */
describe("the guard — a single place that decides, and never throws", () => {
  const guardInput = (overrides: Record<string, unknown> = {}) => ({
    players: 4,
    botFill: planBotFill({ humanCount: 4, teamSize: 2 }),
    teamSize: 2,
    teamSizes: [2, 2] as [number, number],
    matchLength: 3 as const,
    pacing: EVENT_PACING,
    ...overrides,
  });

  it("passes a healthy 4-player 2v2", () => {
    const result = guardEventMatch(guardInput());
    expect(result.ok).toBe(true);
    expect(result.refusals).toEqual([]);
    expect(firstRefusal(result)).toBeNull();
  });

  it("refuses an un-fillable roster with a structured reason and does not throw", () => {
    // Bots off + one human: the classic "room of one" at an event.
    const result = guardEventMatch(
      guardInput({
        players: 1,
        botFill: planBotFill({ humanCount: 1, teamSize: 2, policy: "off" }),
        teamSizes: [1, 0],
      }),
    );
    expect(result.ok).toBe(false);
    const refusal = firstRefusal(result);
    expect(refusal?.code).toBe("bots-disabled");
    expect(refusal?.message).toMatch(/not enough players/i);
    expect(refusal?.remedy).toBeTruthy();
    // The summary carries EVERY reason, not just the first, so an operator sees
    // the whole problem in one line.
    expect(result.summary).toContain(refusal?.message ?? "");
    for (const each of result.refusals) expect(result.summary).toContain(each.message);
  });

  it("refuses an empty room", () => {
    const result = guardEventMatch(
      guardInput({ players: 0, botFill: planBotFill({ humanCount: 0, teamSize: 2 }), teamSizes: [2, 2] }),
    );
    expect(result.ok).toBe(false);
    expect(result.refusals.map((r) => r.code)).toContain("no-players");
  });

  it("refuses unbalanced teams, because kickoff fairness needs a mirror pair", () => {
    const result = guardEventMatch(guardInput({ teamSizes: [3, 1] }));
    expect(result.ok).toBe(false);
    expect(firstRefusal(result)?.code).toBe("teams-unbalanced");
  });

  it("refuses a roster over the native cap of 8", () => {
    const result = guardEventMatch(guardInput({ teamSizes: [5, 5], teamSize: 5 }));
    expect(result.ok).toBe(false);
    const codes = result.refusals.map((r) => r.code);
    expect(codes).toContain("over-native-cap");
    expect(codes).toContain("team-size-illegal");
    expect(MAX_CARS).toBe(8);
  });

  it("refuses an UNLIMITED match, which an event cannot run", () => {
    const result = guardEventMatch(guardInput({ matchLength: 0 }));
    expect(result.ok).toBe(false);
    expect(firstRefusal(result)?.code).toBe("match-length-unlimited");
  });

  it("refuses incoherent pacing without throwing", () => {
    const negative = guardEventMatch(guardInput({ pacing: { ...EVENT_PACING, postMatchDwellMs: -1 } }));
    expect(negative.ok).toBe(false);
    expect(firstRefusal(negative)?.code).toBe("pacing-incoherent");

    const impossible = guardEventMatch(guardInput({ pacing: { ...EVENT_PACING, replayMs: 0 } }));
    expect(impossible.ok).toBe(false);
    expect(firstRefusal(impossible)?.code).toBe("pacing-incoherent");
  });

  it("returns a refusal instead of throwing, for every malformed input", () => {
    // The projector is the only screen in the room, so "it threw" is the worst
    // possible outcome. This asserts the promise across a spread of garbage.
    const garbage: unknown[] = [
      undefined,
      null,
      {},
      { players: "four" },
      { players: -1 },
      { players: 1, botFill: null },
      { players: 1, teamSize: 0 },
      { players: 1, teamSizes: null },
      { players: 1, matchLength: 7, pacing: null },
      { players: NaN },
      { players: Infinity, botFill: {}, teamSizes: [NaN, NaN] },
    ];
    for (const input of garbage) {
      const result = guardEventMatch(input as never);
      expect(result.ok).toBe(false);
      expect(result.refusals.length).toBeGreaterThan(0);
      expect(typeof result.summary).toBe("string");
    }
  });

  it("runEventMatch refuses rather than throws for an un-fillable room", () => {
    const hostile: EventModeSpec = {
      ...EVENT_MODE_SPEC,
      lobby: { ...EVENT_MODE_SPEC.lobby, botFill: "off" },
    };
    const plan = runEventMatch({ launch: "start", players: [{ playerId: "solo" }], spec: hostile });
    expect(plan.guard.ok).toBe(false);
    expect(firstRefusal(plan.guard)?.code).toBe("bots-disabled");
    // The plan is still returned, so a host can render the reason.
    expect(plan.seats).toHaveLength(1);
  });

  it("survives a non-array player list", () => {
    const plan = runEventMatch({ launch: "start", players: undefined as never });
    expect(plan.guard.ok).toBe(false);
    expect(plan.seatedHumans).toBe(0);
    expect(plan.totalCars).toBeLessThanOrEqual(MAX_CARS);
  });
});

/* ========================================================================== */
describe("roster scaling — 1 player and 6 players both produce legal, balanced rosters", () => {
  it("gives 1 player a full 2v2 with 3 bots", () => {
    const plan = runEventMatch({ launch: "start", players: [{ playerId: "solo" }] });
    expect(plan.guard.ok).toBe(true);
    expect(plan.seatedHumans).toBe(1);
    expect(plan.botFill.totalBots).toBe(3);
    expect(plan.totalCars).toBe(4);
    expect(plan.teamSizes).toEqual([2, 2]);
    expect(plan.totalCars).toBeLessThanOrEqual(MAX_CARS);
    expect(plan.eventMode.bots.resolution.mode).toBe("scripted");
  });

  it("gives 6 players a 3v3 with no bots, everyone seated", () => {
    const players = Array.from({ length: 6 }, (_, i) => ({ playerId: `p${i + 1}` }));
    const plan = runEventMatch({ launch: "start", players });
    expect(plan.guard.ok).toBe(true);
    expect(plan.seatedHumans).toBe(6);
    expect(plan.botFill.totalBots).toBe(0);
    expect(plan.totalCars).toBe(6);
    expect(plan.teamSizes).toEqual([3, 3]);
    expect(plan.waiting).toEqual([]);
    expect(plan.totalCars).toBeLessThanOrEqual(MAX_CARS);
  });

  it("scales the team size to the room and never past the native cap", () => {
    const expected: Array<[number, number]> = [
      [1, 2],
      [2, 2],
      [3, 2],
      [4, 2],
      [5, 3],
      [6, 3],
      [7, 4],
      [8, 4],
      [9, 4],
      [40, 4],
    ];
    for (const [players, teamSize] of expected) {
      expect(resolveEventTeamSize(players)).toBe(teamSize);
    }
  });

  it("keeps every player count legal, balanced and inside the cap", () => {
    for (let players = 1; players <= 12; players += 1) {
      const roster = Array.from({ length: players }, (_, i) => ({ playerId: `p${i + 1}` }));
      const plan = runEventMatch({ launch: "start", players: roster });
      expect(plan.teamSizes[0]).toBe(plan.teamSizes[1]);
      expect(plan.totalCars).toBeLessThanOrEqual(MAX_CARS);
      expect(plan.totalCars).toBeGreaterThanOrEqual(2);
      expect(plan.guard.ok).toBe(true);
      // Anyone who did not get a car is told so, never silently dropped.
      expect(plan.seatedHumans + plan.waiting.length).toBe(players);
    }
  });

  it("honours an explicit team request and objects when it unbalances the room", () => {
    const plan = runEventMatch({
      launch: "start",
      players: [
        { playerId: "a", team: 0 },
        { playerId: "b", team: 0 },
        { playerId: "c", team: 0 },
        { playerId: "d", team: 0 },
      ],
    });
    // The explicit request is honoured...
    expect(plan.seats.filter((s) => s.role === "human").every((s) => s.team === 0)).toBe(true);
    // ...and the guard is what objects, rather than the request being ignored.
    expect(plan.guard.ok).toBe(false);
    expect(firstRefusal(plan.guard)?.code).toBe("teams-unbalanced");
  });

  it("seats a reconnecting player once, and says so", () => {
    const plan = runEventMatch({
      launch: "start",
      players: [
        { playerId: "a" },
        { playerId: "a" },
        { playerId: "b" },
        { playerId: "c" },
      ],
    });
    expect(plan.seatedHumans).toBe(3);
    expect(plan.guard.notices.map((n) => n.code)).toContain("duplicate-player");
  });
});

/* ========================================================================== */
describe("the dry run — the whole pipeline against a null sim", () => {
  const report = dryRunEventMatch({ launch: "start", players: fourPlayers() });

  it("reports a full cycle time", () => {
    expect(report.ok).toBe(true);
    expect(report.cycle).not.toBeNull();
    expect(report.cycle?.worstCaseCycleMs).toBe(applyEventMode({ players: 4 }).cycle.worstCaseCycleMs);
    expect(report.cycle?.worstCaseCycleLabel).toBe("6:01");
    expect(report.cycle?.typicalCycleLabel).toBe("3:45");
    expect(report.summary).toContain("cycles in ~3:45");
    // The honest caveat is stated, not hidden.
    expect(report.summary).toContain("not measured");
  });

  it("walks every step of the pipeline, in order, all passing", () => {
    expect(report.steps.map((s) => s.step)).toEqual([
      "guard",
      "roster",
      "bots",
      "mutator",
      "quality",
      "lobby-actions",
      "reset",
      "cycle",
    ]);
    expect(report.steps.every((s) => s.ok)).toBe(true);
    expect(report.steps.map((s) => s.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("actually drives Phase 7's null sim bridge, and records the calls", () => {
    // Not a stub written here: `createNullSimBridge` and `applySimConfigToDonor`
    // are Phase 7's own. A stock NORMAL config writes nothing, which is itself
    // the thing worth proving.
    expect(report.simConfigApplication).not.toBeNull();
    expect(report.simConfigApplication?.noop).toBe(true);
    expect(report.simConfigApplication?.config.id).toBe("NORMAL");
    expect(report.bridgeCalls).toEqual(["resetKickoff", "step:1"]);
  });

  it("names the bot mode and says why donor AI is not driving", () => {
    const bots = report.steps.find((s) => s.step === "bots");
    expect(bots?.detail).toContain("scripted");
    expect(bots?.detail).toContain("MIT");
    expect(bots?.detail).toContain("1v1 policy");
  });

  it("stops at the guard and pushes nothing when the room cannot be filled", () => {
    const hostile: EventModeSpec = {
      ...EVENT_MODE_SPEC,
      lobby: { ...EVENT_MODE_SPEC.lobby, botFill: "off" },
    };
    const refused = dryRunEventMatch({
      launch: "start",
      players: [{ playerId: "solo" }],
      spec: hostile,
    });
    expect(refused.ok).toBe(false);
    expect(refused.refusal?.code).toBe("bots-disabled");
    expect(refused.bridgeCalls).toEqual([]);
    expect(refused.steps.map((s) => s.step)).toEqual(["guard"]);
    expect(refused.summary).toContain("STOPPED at the guard");
  });

  it("confirms a rematch dispatches no join and no leave", () => {
    const rematch = dryRunEventMatch({ launch: "rematch", players: fourPlayers(), matchNumber: 7 });
    expect(rematch.ok).toBe(true);
    const actions = rematch.steps.find((s) => s.step === "lobby-actions");
    expect(actions?.detail).toContain("match/rematch");
    expect(actions?.detail).toContain("joins 0, leaves 0");
    expect(rematch.plan?.issuedJoins).toBe(0);
    expect(rematch.plan?.issuedLeaves).toBe(0);
    expect(rematch.plan?.matchNumber).toBe(7);
  });

  it("is itself deterministic", () => {
    const input: EventMatchInput = { launch: "start", players: fourPlayers() };
    expect(dryRunEventMatch(input).steps).toEqual(dryRunEventMatch(input).steps);
  });
});
