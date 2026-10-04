/**
 * Phase 11 — hardening and stability verification.
 *
 * Three things live in this directory and nothing else does:
 *
 *   `invariants.ts`  the stability invariant layer — pure guards that assert what
 *                    must ALWAYS hold, each returning a structured violation
 *                    rather than throwing.
 *   `triage.ts`      the failure-mode triage table: an observed symptom in, the
 *                    most likely cause and the next diagnostic step out, with a
 *                    file:line citation for every cause.
 *   `match-harness.ts` the agent-driven end-to-end match harness: a whole match
 *                    from lobby to rematch, driven through the agent contract's
 *                    own action names, with a deterministic fake sim and the
 *                    invariant gate running on every single tick.
 *
 * Plus the two checklists that make the automated layer and the un-automatable
 * layer together into something an event can actually run:
 *
 *   `STABILITY-CHECKLIST.md`   what is verified here, and how to re-verify it.
 *   `REAL-DEVICE-CHECKLIST.md` what CANNOT be verified here, with a pass/fail bar
 *                             for each, and an explicit unverified list.
 *
 * NOTHING in this directory imports the donor, the DOM, Three or WASM, and
 * nothing outside it is modified. The only import that leaves the directory is
 * `../seam.js`, and only for the read-only types and constants the whole port
 * agrees on (`CarControls`, `NeutralizeReason`, `NEUTRAL_CONTROLS`, `MAX_CARS`)
 * plus the match core the harness drives.
 */

export {
  activeControlFields,
  checkArenaCap,
  checkNeutralAfterDisruption,
  checkNoDoubleBinding,
  checkNoDoubleSlotAssign,
  checkNoIndefiniteHold,
  checkOneSourcePerSlot,
  checkStability,
  checkVanishedControllerNeutral,
  createStabilityMonitor,
  DEFAULT_MAX_STALE_HOLD_TICKS,
  formatViolations,
  INVARIANTS,
  invariantMeta,
  isNeutralControls,
  summarizeViolations,
  type InvariantId,
  type InvariantMeta,
  type NeutralizeEvent,
  type ObservedCar,
  type StabilityMonitor,
  type StabilityMonitorOptions,
  type StabilityViolation,
  type TickObservation,
} from "./invariants.js";

export {
  diagnose,
  formatDiagnosis,
  triageEntry,
  TRIAGE_ENTRIES,
  type RankedTriage,
  type TriageCause,
  type TriageDiagnosis,
  type TriageEntry,
  type TriageSymptomId,
} from "./triage.js";

export {
  createHarnessSim,
  createMatchHarness,
  UnsupportedAgentAction,
  type AgentActionInvoker,
  type HarnessPlayer,
  type HarnessSim,
  type HarnessSimControlWrite,
  type HarnessTraceEntry,
  type MatchHarness,
  type MatchHarnessOptions,
} from "./match-harness.js";
