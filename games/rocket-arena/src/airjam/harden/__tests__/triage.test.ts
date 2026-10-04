/**
 * Phase 11 — the failure-mode triage table.
 *
 * The mission lists five symptoms an operator will actually report, and every
 * one of them lost this project real time. So each is tested for three things:
 *
 *   1. the wording a person would say out loud MATCHES an entry;
 *   2. that entry's rank-1 cause is a PLAUSIBLE cause — which here means it
 *      cites a file:line, names a mechanism, and says how to confirm it; and
 *   3. the entry's `nextStep` is a single concrete action, not a shrug.
 *
 * A triage table that returns a plausible string for everything is worthless,
 * so the negative cases matter as much as the positive ones: an unrelated
 * symptom must NOT match, and the benign entry must be flagged benign so the
 * operator is told "this is correct behaviour" before they poke a working game.
 */

import { describe, expect, it } from "vitest";

import type { StabilityViolation } from "../invariants.js";
import { diagnose, formatDiagnosis, triageEntry, TRIAGE_ENTRIES, type TriageSymptomId } from "../triage.js";

/** The five symptoms exactly as the mission states them. */
const MISSION_SYMPTOMS: ReadonlyArray<{ id: TriageSymptomId; phrase: string }> = [
  { id: "clock-frozen-at-opening-value", phrase: "the clock is frozen at the opening value" },
  { id: "car-will-not-move", phrase: "the car will not move" },
  { id: "one-car-drives-alone", phrase: "one car drives alone" },
  { id: "phone-unresponsive", phrase: "a phone is unresponsive" },
  { id: "boost-drains-unattended", phrase: "boost drains with nobody touching it" },
];

const violation = (invariant: string): StabilityViolation => ({
  invariant: invariant as StabilityViolation["invariant"],
  severity: "critical",
  slot: 0,
  playerId: "c1",
  detail: "",
  remedy: "",
});

describe("the mission's five symptoms", () => {
  it.each(MISSION_SYMPTOMS)("matches \"$phrase\" to $id as the top candidate", ({ id, phrase }) => {
    const diagnosis = diagnose(phrase);
    expect(diagnosis.matched).toBe(true);
    expect(diagnosis.ranked[0].entry.id).toBe(id);
  });

  it.each(MISSION_SYMPTOMS)("returns a plausible cause for \"$phrase\"", ({ id, phrase }) => {
    const entry = triageEntry(id);
    const top = entry.causes[0];

    // A plausible cause states a MECHANISM, not a vibe.
    expect(top.cause.length).toBeGreaterThan(30);
    expect(top.evidence.length).toBeGreaterThan(60);
    // …cites somewhere real: a `path/file.ext:line` inside the port or the donor.
    expect(top.source).toMatch(/[\w./\\-]+\.(ts|js):\d+/);
    // …and says how to tell it from the others.
    expect(top.check.length).toBeGreaterThan(20);

    // Every cause is ranked, and the ranks are a dense 1..n sequence.
    expect(entry.causes.map((cause) => cause.rank)).toEqual(
      entry.causes.map((_, index) => index + 1),
    );
    // The next step is one action.
    expect(entry.nextStep.length).toBeGreaterThan(40);

    // And the summary names both the cause and the step.
    const diagnosis = diagnose(phrase);
    expect(diagnosis.summary).toContain(entry.causes[0].cause.slice(0, 30));
    expect(diagnosis.summary).toContain(entry.nextStep.slice(0, 30));
  });
});

describe("the benign entry", () => {
  const entry = triageEntry("clock-frozen-at-opening-value");

  it("is flagged benign, because a clock at 5:00 is the donor's own design", () => {
    expect(entry.benign).toBe(true);
    expect(entry.causes[0].cause).toContain("NOT A BUG");
    expect(entry.causes[0].source).toContain("machine.ts:595-596");
  });

  it("tells the operator to check the benign cause FIRST, before touching anything", () => {
    const diagnosis = diagnose("the clock is frozen at the opening value");
    expect(diagnosis.ranked[0].entry.id).toBe("clock-frozen-at-opening-value");
    expect(diagnosis.summary).toContain("clock.started");
    expect(diagnosis.ranked[0].reasons.join(" ")).toContain("CORRECT behaviour");
  });

  it("surfaces the five real pause causes from the donor's own condition", () => {
    // `startup.js:836-838` is one expression with five terms. All five must be
    // reachable from this entry or the table is hiding the actual bug.
    const joined = entry.causes.map((cause) => `${cause.evidence} ${cause.source}`).join(" ");
    expect(joined).toContain("document.hidden");
    expect(joined).toContain("hasFocus()");
    expect(joined).toContain("J.size > 0");
    expect(joined).toContain("startup.js:838");
    expect(joined).toContain("p = !0");
  });
});

describe("the highest-value entries point at the code that actually fails", () => {
  it("car-will-not-move blames the phase before it blames anything else", () => {
    const entry = triageEntry("car-will-not-move");
    expect(entry.causes[0].cause).toContain("playing");
    expect(entry.causes[0].source).toContain("startup.js");
  });

  it("one-car-drives-alone names the donor writing only its own slot", () => {
    const entry = triageEntry("one-car-drives-alone");
    const top = entry.causes[0];
    // Both hardcoded slots the donor writes for itself: its own car `r` and the
    // bot `no`. Every other slot is the port's job.
    expect(top.source).toContain("startup.js:723");
    expect(top.source).toContain(":753");
    // The donor's per-slot fan-out means this is OUR bug, not a donor defect.
    expect(entry.causes.some((cause) => cause.source.includes("car-slot-registry.ts:12-17"))).toBe(true);
  });

  it("phone-unresponsive leads with the sticky neutralize that nothing re-arms", () => {
    const entry = triageEntry("phone-unresponsive");
    expect(entry.causes[0].cause).toContain("re-arm");
    expect(entry.causes[0].source).toContain("airjam-input-source.ts");
    expect(entry.nextStep).toContain("rearm()");
  });

  it("boost-drains-unattended tells you to rule out INFINITE_BOOST first", () => {
    const entry = triageEntry("boost-drains-unattended");
    expect(entry.causes.some((cause) => cause.source.includes("sim-bridge.ts"))).toBe(true);
    expect(entry.nextStep).toContain("INFINITE_BOOST");
    // The swallowed-release mechanism is the headline cause, with the SDK's
    // clear-on-leave-only behaviour as the reason it persists.
    expect(entry.causes[0].cause).toContain("swallowed");
    expect(entry.causes[0].evidence).toContain("clearInput");
  });

  it("names the mutator's no-op failure mode, because it inverts the evidence", () => {
    const entry = triageEntry("boost-drains-unattended");
    const mutator = entry.causes.find((cause) => cause.source.includes("sim-bridge.ts"));
    expect(mutator?.check).toContain("rule this out FIRST");
  });
});

describe("ranking with live evidence", () => {
  it("does not match an unrelated symptom", () => {
    const diagnosis = diagnose("the font is rendering wrong on the scoreboard");
    expect(diagnosis.matched).toBe(false);
    expect(diagnosis.ranked).toEqual([]);
    // The fallback has to be usable, not an apology.
    expect(diagnosis.summary).toContain("clock stuck at 5:00");
  });

  it("is case- and whitespace-insensitive", () => {
    for (const phrase of ["THE CAR WILL NOT MOVE", "  the   car   will   not   move  ", "car will not move"]) {
      expect(diagnose(phrase).ranked[0].entry.id).toBe("car-will-not-move");
    }
  });

  it("corroborates with live violations and never invents a cause without them", () => {
    const bare = diagnose("one car drives alone");
    const corroborated = diagnose("one car drives alone", [
      violation("no-double-slot-assign"),
      violation("one-source-per-slot"),
    ]);
    expect(corroborated.ranked[0].entry.id).toBe(bare.ranked[0].entry.id);
    expect(corroborated.ranked[0].score).toBeGreaterThan(bare.ranked[0].score);
    expect(corroborated.ranked[0].reasons.join(" ")).toContain("corroborated by live violation");
  });

  it("ignores a violation no entry claims, rather than forcing a match", () => {
    const nothing = diagnose("totally unrelated wording about audio latency");
    const withNoise = diagnose("totally unrelated wording about audio latency", [
      violation("arena-cap"),
    ]);
    expect(withNoise.matched).toBe(false);
    expect(nothing.matched).toBe(false);
  });

  it("keeps a benign candidate ahead of a more specific one until disproved", () => {
    // "frozen" is a strong keyword for the clock entry; a second hit on the
    // car entry must not let a possibly-benign clock symptom be dismissed.
    const diagnosis = diagnose("the arena is frozen and the car will not move");
    expect(diagnosis.ranked.map((candidate) => candidate.entry.id)).toContain(
      "clock-frozen-at-opening-value",
    );
  });
});

describe("the report", () => {
  it("prints every ranked candidate with its causes, sources and one next step", () => {
    const lines = formatDiagnosis(diagnose("a phone is unresponsive"));
    const text = lines.join("\n");
    expect(text).toContain("SYMPTOM:");
    expect(text).toContain("evidence :");
    expect(text).toContain("source   :");
    expect(text).toContain("check    :");
    // Exactly one NEXT STEP, on the top candidate only.
    expect(lines.filter((line) => line.includes("NEXT STEP"))).toHaveLength(1);
  });

  it("marks the benign entry in the report, before the operator touches anything", () => {
    const text = formatDiagnosis(diagnose("the clock is frozen at the opening value")).join("\n");
    expect(text).toContain("[MAY BE CORRECT BEHAVIOUR]");
    // The benign flag appears on the header line, BEFORE the ranked causes.
    const lines = formatDiagnosis(diagnose("the clock is frozen at the opening value"));
    const headerIndex = lines.findIndex((line) => line.includes("MAY BE CORRECT BEHAVIOUR"));
    const firstCauseIndex = lines.findIndex((line) => line.trimStart().startsWith("1. NOT A BUG"));
    expect(headerIndex).toBeGreaterThanOrEqual(0);
    expect(headerIndex).toBeLessThan(firstCauseIndex);
  });

  it("prints the unmatched fallback without pretending to diagnose", () => {
    const lines = formatDiagnosis(diagnose("something about the loading spinner"));
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain("No entry matched");
  });
});

describe("the table's own integrity", () => {
  it("has a unique id per entry and at least three causes each", () => {
    const ids = TRIAGE_ENTRIES.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const entry of TRIAGE_ENTRIES) {
      expect(entry.causes.length).toBeGreaterThanOrEqual(3);
      expect(entry.keywords.length).toBeGreaterThanOrEqual(3);
      expect(entry.title.length).toBeGreaterThan(20);
    }
  });

  it("gives every cause a check and a citation, because a cause you cannot confirm is a guess", () => {
    for (const entry of TRIAGE_ENTRIES) {
      for (const cause of entry.causes) {
        expect(cause.source, `${entry.id} rank ${cause.rank}`).toMatch(/:\d+/);
        expect(cause.check.length, `${entry.id} rank ${cause.rank}`).toBeGreaterThan(15);
      }
    }
  });

  it("only claims invariant ids that actually exist", () => {
    // The union of every `confirmedBy` must be a subset of the catalogue.
    const claimed = new Set(TRIAGE_ENTRIES.flatMap((entry) => entry.confirmedBy));
    for (const id of claimed) {
      expect(typeof id).toBe("string");
      expect([
        "neutral-after-disruption",
        "vanished-controller-neutral",
        "one-source-per-slot",
        "no-double-binding",
        "no-indefinite-hold",
        "arena-cap",
        "no-double-slot-assign",
      ]).toContain(id);
    }
  });
});
