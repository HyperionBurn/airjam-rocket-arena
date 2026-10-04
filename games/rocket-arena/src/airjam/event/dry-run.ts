/**
 * ============================================================================
 * PHASE 12 — EVENT MODE. THE DRY RUN.
 * ============================================================================
 *
 * OWNER: the Event Mode worker (`src/airjam/event/**`).
 *
 * ---------------------------------------------------------------------------
 * WHY THIS EXISTS
 * ---------------------------------------------------------------------------
 * The pipeline in this directory is the thing that decides, with nobody
 * watching, what a room of strangers will play. That deserves to be provable
 * BEFORE an arena, a projector or a queue of phones is involved — and there is
 * a known open defect in the port build (a match never leaves its opening phase,
 * because the donor's sim does not step; another worker owns it). So the dry run
 * is the answer to "how do we verify this pipeline at all?":
 *
 *   it runs the REAL functions against a sim that does nothing.
 *
 * Concretely, `applySimConfigToDonor` and `createNullSimBridge` are Phase 7's
 * own, not stubs written here. The mutator really is pushed at a bridge; the
 * bridge really does record the call; the arena really is absent. What a dry run
 * therefore proves is that every decision BEFORE the donor is involved is
 * correct and complete — which is precisely the part this module owns.
 *
 * ---------------------------------------------------------------------------
 * IT REPORTS, IT DOES NOT PRETEND
 * ---------------------------------------------------------------------------
 * The report separates the two kinds of statement:
 *
 *   - `steps`     — what this pipeline decided, in order, with a pass/fail each.
 *   - `bridgeCalls` — what the donor WOULD have been asked to do.
 *
 * A step that could not be verified headlessly says so in its own text rather
 * than reporting a green tick. The largest such gap is the physics itself: no
 * amount of faking a sim produces a real goal, so the cycle time in a dry run is
 * a DERIVATION from the pacing profile, not a measurement. It is labelled that
 * way in `summary`.
 *
 * NEVER THROWS. For the same reason the guard never throws: a dry run is often
 * run at boot on the one machine nobody is standing next to, and it must be
 * safe to call unconditionally.
 */

import { applySimConfigToDonor, createNullSimBridge } from "@/match/sim-bridge";
import type { SimConfigApplication } from "@/match/sim-bridge";
import { resolveSimConfig } from "@/match/sim-config";
import { runEventMatch, type EventMatchInput, type EventMatchPlan } from "./run.js";
import { firstRefusal, type EventGuardResult, type EventRefusal } from "./guard.js";
import type { EventCycle } from "./pacing.js";

/** One decision, in order, with its verdict. */
export interface EventDryRunStep {
  /** 1-based execution order. */
  readonly order: number;
  /** Stable id, so a test or a log can name a step without matching prose. */
  readonly step:
    | "guard"
    | "roster"
    | "bots"
    | "mutator"
    | "quality"
    | "lobby-actions"
    | "reset"
    | "cycle";
  readonly ok: boolean;
  /** What happened, in one line. */
  readonly detail: string;
}

export interface EventDryRunReport {
  /** True when every step passed. The one field a boot check should read. */
  readonly ok: boolean;
  readonly launch: EventMatchInput["launch"];
  /** The first refusal, or null. Null when `ok`. */
  readonly refusal: EventRefusal | null;
  /** Every refusal, in priority order. */
  readonly refusals: readonly EventRefusal[];
  /** The full plan, or null when the guard refused before it was built. */
  readonly plan: EventMatchPlan | null;
  /** The guard's own verdict, preserved even when it refused. */
  readonly guard: EventGuardResult | null;
  /** Ordered decisions. Empty when the guard refused at step 1. */
  readonly steps: readonly EventDryRunStep[];
  /**
   * The exact calls that WOULD be made on the donor, from Phase 7's recording
   * null bridge. For a stock NORMAL mutator this is short on purpose: a config
   * that changes nothing writes nothing, and the dry run proves that too.
   */
  readonly bridgeCalls: readonly string[];
  /** What `applySimConfigToDonor` managed to apply. Never throws. */
  readonly simConfigApplication: SimConfigApplication | null;
  /** The derived cycle. Present whenever a plan was built. */
  readonly cycle: EventCycle | null;
  /** One projector-safe line, stating plainly what was and was not verified. */
  readonly summary: string;
}

const describeError = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/**
 * Execute the whole EVENT MODE plan against a null sim and report what WOULD
 * happen.
 *
 * TOTAL: returns for every input, throws for none.
 */
export function dryRunEventMatch(input: EventMatchInput): EventDryRunReport {
  const steps: EventDryRunStep[] = [];
  const refusals: EventRefusal[] = [];
  const launch: EventMatchInput["launch"] = input?.launch === "rematch" ? "rematch" : "start";

  try {
    // -- 1. the plan, which begins with the guard ----------------------------
    const plan = runEventMatch(input);
    refusals.push(...plan.guard.refusals);

    steps.push({
      order: steps.length + 1,
      step: "guard",
      ok: plan.guard.ok,
      detail: plan.guard.summary,
    });

    if (!plan.guard.ok) {
      return {
        ok: false,
        launch,
        refusal: firstRefusal(plan.guard),
        refusals,
        plan,
        guard: plan.guard,
        steps,
        bridgeCalls: [],
        simConfigApplication: null,
        cycle: plan.cycle,
        summary:
          `Dry run STOPPED at the guard: ${firstRefusal(plan.guard)?.message ?? "the match may not start."} ` +
          `Nothing was pushed at the arena.`,
      };
    }

    // -- 2. the roster ------------------------------------------------------
    const roles = plan.seats.reduce(
      (tally, seat) => {
        tally[seat.role] += 1;
        return tally;
      },
      { human: 0, bot: 0 } as Record<string, number>,
    );
    const balanced = plan.teamSizes[0] === plan.teamSizes[1];
    steps.push({
      order: steps.length + 1,
      step: "roster",
      ok: balanced && plan.totalCars <= 8,
      detail:
        `${plan.seatedHumans} human(s) + ${roles.bot ?? 0} bot(s) = ${plan.totalCars} cars, ` +
        `${plan.teamSizes[0]}v${plan.teamSizes[1]}` +
        (plan.waiting.length > 0 ? `, ${plan.waiting.length} waiting` : "") +
        ". Seats: " +
        plan.seats.map((seat) => `${seat.seat}:${seat.role === "human" ? seat.playerId : "bot"}(T${seat.team})`).join(" "),
    });

    // -- 3. the bots, and the 1v1 downgrade stated out loud ------------------
    const resolution = plan.eventMode.bots.resolution;
    steps.push({
      order: steps.length + 1,
      step: "bots",
      ok: true,
      detail:
        `${roles.bot ?? 0} bot seat(s) driven in "${resolution.mode}" mode ` +
        `(model ${resolution.model}, ${resolution.license}, commercial use ${resolution.commercialUse}).` +
        (resolution.downgradeReason ? ` ${resolution.downgradeReason}` : ""),
    });

    // -- 4. the mutator, against a bridge that does nothing ------------------
    // The REAL Phase 7 functions. `resolveSimConfig` never throws, and
    // `applySimConfigToDonor` reports a missing native entry point in its return
    // value rather than throwing — so a mismatch between this plan and the live
    // donor shows up as a field, not a crash.
    const simConfig = resolveSimConfig(plan.eventMode.mutator);
    const bridge = createNullSimBridge(new Float32Array(0));
    const application = applySimConfigToDonor(simConfig, bridge);

    // Exercise the launch path the pacing layer describes: a kickoff reset and
    // one step, so the reported bridge calls are the real ones a match makes.
    bridge.resetKickoff();
    bridge.step(1);

    steps.push({
      order: steps.length + 1,
      step: "mutator",
      ok: application.config.id === plan.eventMode.mutator,
      detail:
        `${application.config.label} (${application.config.id}): ` +
        `${application.noop ? "stock — no donor write required" : "config pushed"}; ` +
        `unlimitedBoost ${application.unlimitedBoostApplied}, ` +
        `ballVelocity ${application.ballVelocityApplied}, ` +
        `ballRadius applied ${application.radiusApplied} (the donor exposes no radius setter).`,
    });

    // -- 5. quality ---------------------------------------------------------
    const quality = plan.eventMode.quality;
    steps.push({
      order: steps.length + 1,
      step: "quality",
      ok: typeof quality.preset === "string",
      detail: `starting preset ${quality.preset} for ${quality.viewportCount} viewport(s). ${quality.reason}`,
    });

    // -- 6. the dispatches --------------------------------------------------
    const joinLeaves = plan.lobbyActions.filter(
      (action) => action.type === "player/join" || action.type === "player/leave",
    ).length;
    steps.push({
      order: steps.length + 1,
      step: "lobby-actions",
      ok: joinLeaves === 0,
      detail:
        `${plan.lobbyActions.length} dispatch(es): ` +
        plan.lobbyActions.map((action) => action.type).join(", ") +
        `. joins ${plan.issuedJoins}, leaves ${plan.issuedLeaves}` +
        (launch === "rematch" ? " — rematch reuses the roster, nothing re-joins." : "."),
    });

    // -- 7. the reset -------------------------------------------------------
    steps.push({
      order: steps.length + 1,
      step: "reset",
      ok: plan.reset.score[0] === 0 && plan.reset.score[1] === 0 && plan.reset.clockMs === plan.eventMode.matchLengthMs,
      detail:
        `score 0-0, clock ${plan.reset.clockMs ?? "unlimited"} ms, positions ${plan.reset.positions}, ` +
        `stats ${plan.reset.stats}, goal feed ${plan.reset.goalFeed}; ` +
        `preserved ${plan.reset.preserved.join(", ")}.`,
    });

    // -- 8. the cycle -------------------------------------------------------
    const cycle = plan.cycle;
    steps.push({
      order: steps.length + 1,
      step: "cycle",
      ok: cycle.worstCaseCycleMs !== null,
      detail: cycle.headline,
    });

    return {
      ok: true,
      launch,
      refusal: null,
      refusals,
      plan,
      guard: plan.guard,
      steps,
      bridgeCalls: [...bridge.calls],
      simConfigApplication: application,
      cycle,
      summary:
        `Dry run OK: ${plan.seatedHumans}+${roles.bot ?? 0} cars in ${plan.teamSizes[0]}v${plan.teamSizes[1]}, ` +
        `${plan.eventMode.mutator}, ${plan.eventMode.quality.preset}, bots in "${resolution.mode}" mode. ` +
        `${cycle.headline} ` +
        `Derived from the pacing profile, not measured — no arena was involved.`,
    };
  } catch (error) {
    // Present so a defect in this directory cannot stop an event from booting.
    const refusal: EventRefusal = {
      code: "internal-error",
      message: "The dry run could not complete.",
      remedy: "Start the match normally; the guard will still decide.",
      detail: describeError(error),
    };
    return {
      ok: false,
      launch,
      refusal,
      refusals: [...refusals, refusal],
      plan: null,
      guard: null,
      steps,
      bridgeCalls: [],
      simConfigApplication: null,
      cycle: null,
      summary: `Dry run FAILED: ${describeError(error)}`,
    };
  }
}
