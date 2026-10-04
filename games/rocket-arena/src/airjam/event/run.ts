/**
 * ============================================================================
 * PHASE 12 — EVENT MODE. THE RUNNER. `runEventMatch()`.
 * ============================================================================
 *
 * OWNER: the Event Mode worker (`src/airjam/event/**`).
 *
 * ---------------------------------------------------------------------------
 * ONE FUNCTION, TWO JOBS
 * ---------------------------------------------------------------------------
 * `runEventMatch` resolves a STARTING STATE into a complete, runnable match
 * plan: seats, teams, bots, mutator, quality and timings. It is the whole
 * "tap start" path in one pure call, which is what makes the pipeline verifiable
 * before an arena is ever involved.
 *
 * It is also the rematch path, because at an event the two are the same operation
 * with a different history. `launch: "rematch"` re-derives the ENTIRE plan from
 * the same starting state and changes only the reset — which is the strongest
 * available demonstration that a rematch is not a special case that can drift.
 *
 * ---------------------------------------------------------------------------
 * IDEMPOTENCE — HOW IT IS ACTUALLY GUARANTEED
 * ---------------------------------------------------------------------------
 * A plan is a function of its input and nothing else. Concretely, this module
 * contains:
 *
 *   - no `Date.now()` / `performance.now()` / `new Date()`
 *   - no `Math.random()` and no `crypto`
 *   - no module-level mutable state
 *   - no `Map`/`Set` iteration in any order that depends on insertion of
 *     non-deterministic values
 *   - no reference to the previous plan or a previous match
 *
 * The roster is rebuilt from `input.players` on EVERY launch, including a
 * rematch, so a second call sees exactly the state the first saw. Two calls with
 * equal input therefore produce equal plans, and `eventPlanSignature` makes that
 * a one-line test rather than a claim.
 *
 * ---------------------------------------------------------------------------
 * WHAT A REMATCH DOES AND DOES NOT DO — THE CONTRACT
 * ---------------------------------------------------------------------------
 * Preserved, byte for byte:
 *   - every player's identity (`playerId`) and team
 *   - every human's seat index
 *   - the bot seats and which brain drives them
 *   - the settings, the mutator, the quality preset and the timings
 *
 * Reset, and nothing else:
 *   - score            -> 0 - 0
 *   - clock            -> the full match length again
 *   - car positions    -> kickoff spawns
 *   - per-player stats -> empty
 *   - the goal feed    -> empty
 *
 * NOT issued, and asserted by the test suite:
 *   - `player/join`    — nobody rejoins
 *   - `player/leave`   — nobody leaves
 *   - `settings/*`     — the room is already configured; re-applying it would
 *                        be the "pile of toggles" this mode exists to avoid
 *   - any seat claim or release — `issuedJoins`/`issuedLeaves` are both 0
 *
 * The only action a rematch dispatches is `match/rematch`, which is the lobby
 * reducer's own single-dispatch rematch (`lobby-reducer.ts:521`) and which
 * carries players, teams, ready flags and cars over untouched.
 */

import { planMatchRoster } from "@/airjam/slots/car-slot-registry";
import type { BotFillPlan } from "@/airjam/bots/bot-fill-plan";
import { planBotFill } from "@/airjam/bots/bot-fill-plan";
import { MAX_CARS } from "@/airjam/seam";
import { matchDurationMs } from "@/lobby/settings";
import type { LobbyAction, LobbyTeam } from "@/lobby/types";
import type { DeviceCapability } from "@/airjam/perf/preset-resolver";
import { applyEventMode, eventPlanSignature, type EventModePlan } from "./plan.js";
import { guardEventMatch, type EventGuardResult, type EventNotice } from "./guard.js";
import { EVENT_MODE_SPEC, resolveEventTeamSize, type EventModeSpec } from "./spec.js";
import type { EventCycle, EventPacing } from "./pacing.js";

/* -------------------------------------------------------------------------- */
/* Input                                                                        */
/* -------------------------------------------------------------------------- */

export interface EventPlayerInput {
  /** Air Jam player id. The identity key, preserved verbatim across a rematch. */
  readonly playerId: string;
  /** Display name. Falls back to the id. */
  readonly name?: string;
  /**
   * An EXPLICIT team request. `"auto"`-style players omit this and are placed on
   * whichever side is smaller — which is Phase 3's `planRoster`, not a rule
   * invented here. An explicit request is honoured even when it unbalances the
   * room, and the guard is what objects.
   */
  readonly team?: LobbyTeam;
}

/** Which side of the loop this call is. Changes the reset, nothing else. */
export type EventLaunchKind = "start" | "rematch";

export interface EventMatchInput {
  readonly launch: EventLaunchKind;
  /** Everybody currently in the room, in join order. */
  readonly players: readonly EventPlayerInput[];
  /** Renderer capability, forwarded to the quality resolver. */
  readonly capability?: DeviceCapability;
  /**
   * The match number to run. The HOST owns the counter and passes
   * `previous + 1`; this module deliberately keeps no counter of its own,
   * because a module-level counter would be exactly the hidden state that makes
   * idempotence untestable. Defaults to 1.
   */
  readonly matchNumber?: number;
  /** Override the spec. Present for tests and for a future venue preset. */
  readonly spec?: EventModeSpec;
}

/* -------------------------------------------------------------------------- */
/* Output                                                                       */
/* -------------------------------------------------------------------------- */

export interface EventSeatPlan {
  /** Stable car slot index. Preserved across a rematch. */
  readonly seat: number;
  readonly role: "human" | "bot";
  /** `null` for a bot seat. */
  readonly playerId: string | null;
  /** `null` for a bot seat. */
  readonly name: string | null;
  readonly team: LobbyTeam;
  /** The slot the CAR should be created on, per the seam's `addBotSeat`. */
  readonly needsArenaSeat: boolean;
}

/** Exactly what a rematch is allowed to touch. */
export interface EventMatchReset {
  readonly score: Readonly<Record<LobbyTeam, number>>;
  readonly clockMs: number | null;
  /** Cars back to their kickoff spawns. */
  readonly positions: "kickoff";
  /** Per-player stats cleared. */
  readonly stats: "reset";
  /** The goal feed cleared. */
  readonly goalFeed: "reset";
  /** What was deliberately NOT touched. Recorded so a regression is visible. */
  readonly preserved: readonly ["players", "teams", "seats", "settings", "botSeats"];
}

export interface EventMatchPlan {
  readonly launch: EventLaunchKind;
  readonly matchNumber: number;
  readonly specId: EventModeSpec["id"];

  /** The configuration half of the plan, from `applyEventMode`. */
  readonly eventMode: EventModePlan;

  /** The actions the host dispatches, in order. */
  readonly lobbyActions: readonly LobbyAction[];
  /** Always 0. Present so a test can assert it rather than infer it. */
  readonly issuedJoins: number;
  /** Always 0. Same reason. */
  readonly issuedLeaves: number;

  /** The full car roster, humans then bots, in seat order. */
  readonly seats: readonly EventSeatPlan[];
  /** Cars per team including bots. Equal, or the guard refuses. */
  readonly teamSizes: readonly [number, number];
  /** Humans in the room but not in the arena; they wait for the next match. */
  readonly waiting: readonly string[];
  /** Humans actually seated. */
  readonly seatedHumans: number;
  /** Human + bot car count. Never above `MAX_CARS`. */
  readonly totalCars: number;

  /** Phase 8's roster policy, verbatim. */
  readonly botFill: BotFillPlan;

  readonly pacing: EventPacing;
  readonly cycle: EventCycle;

  /** Exactly what this launch resets. See the contract in the module header. */
  readonly reset: EventMatchReset;

  /** The single decision. `ok: false` means DO NOT START. */
  readonly guard: EventGuardResult;

  /** `JSON.stringify` of everything above. The idempotency witness. */
  readonly signature: string;
}

/* -------------------------------------------------------------------------- */
/* The runner                                                                   */
/* -------------------------------------------------------------------------- */

const normaliseName = (player: EventPlayerInput): string => {
  const name = typeof player.name === "string" ? player.name.trim() : "";
  return name.length > 0 ? name : player.playerId;
};

const isDuplicate = (seen: ReadonlySet<string>, playerId: string): boolean => seen.has(playerId);

/**
 * Resolve a starting state into a complete, runnable EVENT MODE match plan.
 *
 * IDEMPOTENT. Running it twice with the same input yields the same plan, and
 * `plan.signature` is the same string both times. See the module header for how
 * that is achieved and why it matters at an event.
 *
 * NEVER THROWS for a roster that cannot launch: an un-fillable room comes back
 * with `guard.ok === false` and a structured reason, because a crash on the
 * projector is the worst possible outcome. A malformed INPUT is still handled
 * without a throw — the guard's `invalid-input` path covers it and the seats are
 * simply empty.
 */
export function runEventMatch(input: EventMatchInput): EventMatchPlan {
  const spec = input?.spec ?? EVENT_MODE_SPEC;
  const launch: EventLaunchKind = input?.launch === "rematch" ? "rematch" : "start";

  // Defensive: a caller that hands over a non-array must not take the page down.
  const players: EventPlayerInput[] = Array.isArray(input?.players) ? input.players : [];

  // De-duplicate by player id BEFORE anything else. A reconnect must never
  // consume two cars, and Phase 3's `planRoster` would drop the duplicate
  // silently — better to do it here where the count is visible.
  const seen = new Set<string>();
  const distinct: EventPlayerInput[] = [];
  const notices: EventNotice[] = [];
  for (const player of players) {
    const playerId = typeof player?.playerId === "string" ? player.playerId : "";
    if (playerId.length === 0) {
      notices.push({
        code: "player-without-id",
        message: "A player with no id was ignored — a phone may not have finished joining.",
      });
      continue;
    }
    if (isDuplicate(seen, playerId)) {
      notices.push({
        code: "duplicate-player",
        message: `"${playerId}" appears more than once and was seated only once.`,
      });
      continue;
    }
    seen.add(playerId);
    distinct.push(player);
  }

  // The configuration half. `players` drives both the team size and the
  // viewport count, so this is the one call that has to see the whole room.
  const eventMode = applyEventMode({
    players: distinct.length,
    capability: input?.capability,
    spec,
  });

  const teamSize = resolveEventTeamSize(distinct.length, spec);

  // Counts come from Phase 8, which is the module that owns the roster policy.
  const botFill: BotFillPlan = planBotFill({
    humanCount: distinct.length,
    teamSize,
    policy: eventMode.lobbySettings.botFill === "fill" ? "fill-teams" : "off",
  });

  // Seat indices and team placement come from Phase 3, which is the module that
  // owns player→slot identity. `requestedTeams` carries only EXPLICIT choices;
  // everyone else is placed on the smaller side by `planRoster` itself.
  const requestedTeams: Record<string, LobbyTeam> = {};
  for (const player of distinct) {
    if (player.team === 0 || player.team === 1) requestedTeams[player.playerId] = player.team;
  }

  const roster = planMatchRoster({
    playerIds: distinct.map((player) => player.playerId),
    requestedTeams,
    fillBots: false, // Phase 8 already decided how many; see below.
    capacity: MAX_CARS,
  });

  const nameById = new Map<string, string>();
  for (const player of distinct) nameById.set(player.playerId, normaliseName(player));

  // Humans first, in Phase 3's order, then the bots Phase 8 asked for, team 0
  // before team 1. Appending rather than interleaving is deliberate: the human
  // seat indices must not move when a bot is added, or a phone's car would swap
  // sides between matches for no reason a player could understand.
  const seats: EventSeatPlan[] = roster.seats.map((seat) => ({
    seat: seat.seat,
    role: "human",
    playerId: seat.playerId,
    name: seat.playerId === null ? null : (nameById.get(seat.playerId) ?? seat.playerId),
    team: seat.team,
    needsArenaSeat: true,
  }));

  let nextSeat = seats.length;
  for (const team of [0, 1] as const) {
    for (let i = 0; i < botFill.bots[team]; i += 1) {
      seats.push({
        seat: nextSeat,
        role: "bot",
        playerId: null,
        name: null,
        team,
        needsArenaSeat: true,
      });
      nextSeat += 1;
    }
  }

  const teamSizes: [number, number] = [
    seats.filter((seat) => seat.team === 0).length,
    seats.filter((seat) => seat.team === 1).length,
  ];
  const totalCars = seats.length;

  const waiting = roster.dropped.map((seat) => seat.playerId).filter((id): id is string => id !== null);
  if (waiting.length > 0) {
    notices.push({
      code: "players-waiting",
      message: `${waiting.length} player${waiting.length === 1 ? "" : "s"} waiting for the next match.`,
    });
  }

  // The bot downgrade is a NOTICE, not a refusal: the system handled it, and
  // refusing a 2v2 match because the donor's ONNX cannot drive four cars would be
  // refusing to run the event at all.
  const resolution = eventMode.bots.resolution;
  if (resolution.downgraded && resolution.downgradeReason) {
    notices.push({ code: "bot-mode-downgraded", message: resolution.downgradeReason });
  }

  const guard = guardEventMatch({
    players: distinct.length,
    botFill,
    teamSize,
    teamSizes,
    matchLength: eventMode.matchLength,
    pacing: eventMode.pacing,
    notices,
  });

  const matchNumber = Number.isFinite(input?.matchNumber) && (input?.matchNumber ?? 0) >= 1
    ? Math.floor(input?.matchNumber as number)
    : 1;

  const lobbyActions: LobbyAction[] =
    launch === "rematch"
      ? // ONE dispatch. No joins, no leaves, no settings — see the header.
        [{ type: "match/rematch" }]
      : // Configure then launch. `settings/eventMode` is already implied by
        // EVENT MODE being on, but dispatching it keeps a host that entered
        // through a custom path on the same footing as the one-click button.
        [...eventMode.lobbyActions, { type: "match/start" }];

  const reset: EventMatchReset = {
    score: { 0: 0, 1: 0 },
    clockMs: matchDurationMs(eventMode.matchLength),
    positions: "kickoff",
    stats: "reset",
    goalFeed: "reset",
    preserved: ["players", "teams", "seats", "settings", "botSeats"],
  };

  const body = {
    launch,
    matchNumber,
    specId: spec.id,
    eventMode,
    lobbyActions,
    issuedJoins: 0,
    issuedLeaves: 0,
    seats,
    teamSizes,
    waiting,
    seatedHumans: seats.filter((seat) => seat.role === "human").length,
    totalCars,
    botFill,
    pacing: eventMode.pacing,
    cycle: eventMode.cycle,
    guard,
    reset,
  };

  return Object.freeze({ ...body, signature: eventPlanSignature(body) });
}

/* -------------------------------------------------------------------------- */
/* Convenience                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * "A 4-player match cycles in ~3:44."
 *
 * The one sentence an operator asks for. Derived, not authored: it comes out of
 * `EventCycle.headline`, which comes out of the pacing profile. The `size` is
 * the number of humans in the room, so the line changes as the room fills.
 */
export function eventCycleHeadline(players: number, spec: EventModeSpec = EVENT_MODE_SPEC): string {
  return applyEventMode({ players, spec }).cycle.headline;
}

/** The full plan for the documented four-player event. */
export function planDocumentedEvent(spec: EventModeSpec = EVENT_MODE_SPEC): EventMatchPlan {
  return runEventMatch({ launch: "start", players: fourPlayers(), spec });
}

/** The brief's room: four people, `p1`..`p4`, no explicit teams. */
export function fourPlayers(): EventPlayerInput[] {
  return [
    { playerId: "p1", name: "Ada" },
    { playerId: "p2", name: "Bo" },
    { playerId: "p3", name: "Cyd" },
    { playerId: "p4", name: "Dev" },
  ];
}
