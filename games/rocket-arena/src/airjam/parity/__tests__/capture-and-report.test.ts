import { describe, expect, it } from "vitest";

import {
  ALL_SCENARIOS,
  CAPTURE_PROVENANCE,
  SCENARIOS,
  buildCapturePlan,
  buildHudDump,
  buildUrl,
  describePlan,
  diffHudDumps,
  meetsGate,
  normalizeHudText,
} from "../capture.js";
import {
  OPENING_PHASES,
  assessSimProgress,
  parsePhysicsSnapshot,
} from "../snapshot.js";
import {
  buildParityPass,
  checklistRows,
  formatParityTable,
  gradeOf,
  physicsRows,
  summarizePass,
  type DimensionResult,
} from "../report.js";
import { diffRgba } from "../image-diff.js";
import { comparePhysicsToBaseline } from "../physics-parity.js";
import { summarizeParity } from "../checklist.js";

/* -------------------------------------------------------------------------- */
/* Capture plan                                                                */
/* -------------------------------------------------------------------------- */

describe("buildCapturePlan — deterministic by construction", () => {
  it("always installs the physics hook, whatever the scenario", () => {
    for (const scenario of ALL_SCENARIOS) {
      expect(buildUrl("http://127.0.0.1:4173/", scenario)).toContain("physicsDebug=1");
    }
  });

  it("refuses to let a scenario switch the instrument OFF", () => {
    // Even if a caller tries, the flag is re-set after the scenario's own
    // query is applied, so the instrument cannot be removed.
    const url = buildUrl("http://127.0.0.1:4173/?physicsDebug=0", "home");
    expect(url).toContain("physicsDebug=1");
  });

  it("keeps other query parameters the caller supplied", () => {
    expect(buildUrl("http://127.0.0.1:4173/?foo=bar", "home")).toContain("foo=bar");
  });

  it("pins the viewport and the software-renderer launch args", () => {
    const plan = buildCapturePlan("http://127.0.0.1:4173/", "home");
    expect(plan.provenance.viewport).toEqual({ width: 1600, height: 900 });
    expect(plan.provenance.deviceScaleFactor).toBe(1);
    expect(plan.provenance.launchArgs).toContain("--use-angle=swiftshader");
    expect(plan.provenance.launchArgs).toContain("--enable-unsafe-swiftshader");
  });

  it("labels the software renderer as NOT a performance measurement", () => {
    expect(CAPTURE_PROVENANCE.performanceCaveat).toMatch(/not a performance measurement/);
  });

  it("is deterministic: the same inputs produce the same plan", () => {
    const a = buildCapturePlan("http://127.0.0.1:4173/", "match-running");
    const b = buildCapturePlan("http://127.0.0.1:4173/", "match-running");
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("ends every plan with a HUD dump, a physics dump and a capture", () => {
    for (const scenario of ALL_SCENARIOS) {
      const plan = buildCapturePlan("http://127.0.0.1:4173/", scenario);
      const kinds = plan.steps.map((s) => s.kind);
      expect(kinds).toContain("dump-hud");
      expect(kinds).toContain("dump-physics");
      expect(kinds[kinds.length - 1]).toBe("capture");
    }
  });

  it("clicks nothing on the home screen and something on a match scenario", () => {
    expect(SCENARIOS.home.clicks).toEqual([]);
    expect(SCENARIOS["match-kickoff"].clicks).toEqual(["PLAY", "BOTS", "START"]);
  });

  it("gives every scenario a gate and a stated expectation", () => {
    for (const scenario of ALL_SCENARIOS) {
      const spec = SCENARIOS[scenario];
      expect(spec.gate.length, scenario).toBeGreaterThan(15);
      expect(spec.expect.length, scenario).toBeGreaterThan(20);
    }
  });

  it("flattens to a readable script", () => {
    const lines = describePlan(buildCapturePlan("http://127.0.0.1:4173/", "match-kickoff"));
    expect(lines[0]).toMatch(/^goto http/);
    expect(lines.join("\n")).toMatch(/click text "START"/);
  });
});

/* -------------------------------------------------------------------------- */
/* HUD text                                                                    */
/* -------------------------------------------------------------------------- */

describe("normalizeHudText — removes churn, keeps content", () => {
  it("collapses whitespace but keeps every distinct line", () => {
    expect(normalizeHudText("  PLAY  \n\n  BOTS \n")).toBe("PLAY\nBOTS");
  });

  it("replaces a free-running clock with a placeholder, keeping the rest of the line", () => {
    // Dropping the whole line would also delete the score or the team names
    // sitting next to the clock, which are exactly what a port gets wrong.
    expect(normalizeHudText("5:00\nPLAY")).toBe("<clock>\nPLAY");
    expect(normalizeHudText("4:59 remaining")).toBe("<clock> remaining");
    expect(normalizeHudText("BLUE 3 - 2 ORANGE 5:00")).toBe("BLUE 3 - 2 ORANGE <clock>");
  });

  it("drops the FPS line entirely, because it is a property of the host", () => {
    expect(normalizeHudText("57 fps\nPLAY")).toBe("PLAY");
    expect(normalizeHudText("59.5 FPS")).toBe("");
  });

  it("keeps a changed label, because that IS a parity break", () => {
    // The over-eager normaliser that deletes this line would hide the exact
    // defect the text dump exists to find.
    expect(normalizeHudText("START MATCH")).toBe("START MATCH");
  });
});

describe("diffHudDumps — a comparison that CAN legitimately be exact", () => {
  const dump = (text: string) => buildHudDump({ url: "http://x/", text });

  it("reports identical HUDs as identical", () => {
    const diff = diffHudDumps(dump("PLAY\nBOTS"), dump("PLAY\nBOTS"));
    expect(diff.identical).toBe(true);
    expect(diff.lineSimilarity).toBe(1);
  });

  it("ignores a reordering, which a port may legitimately do", () => {
    const diff = diffHudDumps(dump("PLAY\nBOTS"), dump("BOTS\nPLAY"));
    expect(diff.identical).toBe(true);
  });

  it("catches a missing entry", () => {
    const diff = diffHudDumps(dump("PLAY\nBOTS\nTRAINING"), dump("PLAY\nBOTS"));
    expect(diff.identical).toBe(false);
    expect(diff.onlyInDonor).toEqual(["TRAINING"]);
    expect(diff.lineSimilarity).toBeCloseTo(2 / 3, 6);
  });

  it("catches a renamed entry", () => {
    const diff = diffHudDumps(dump("START"), dump("BEGIN"));
    expect(diff.identical).toBe(false);
    expect(diff.onlyInDonor).toEqual(["START"]);
    expect(diff.onlyInPort).toEqual(["BEGIN"]);
  });
});

describe("meetsGate — a capture that reached nothing claims nothing", () => {
  const empty = buildHudDump({ url: "http://x/" });

  it("fails the home gate with no canvas at all", () => {
    const gate = meetsGate(empty, "home");
    expect(gate.ok).toBe(false);
    expect(gate.reason).toMatch(/canvas/);
  });

  it("fails a match gate when the physics hook never appeared", () => {
    const withCanvas = buildHudDump({
      url: "http://x/",
      canvases: [{ width: 800, height: 600, contextLost: false }],
    });
    const gate = meetsGate(withCanvas, "match-kickoff");
    expect(gate.ok).toBe(false);
    expect(gate.reason).toMatch(/rocketArenaPhysics was absent/);
  });

  it("fails a match gate when the hook answered with zero samples", () => {
    const withCanvas = buildHudDump({
      url: "http://x/",
      canvases: [{ width: 800, height: 600, contextLost: false }],
      rawSnapshot: {},
      snapshot: parsePhysicsSnapshot({ schema: 1, metrics: {}, samples: [] }),
    });
    expect(meetsGate(withCanvas, "match-kickoff").reason).toMatch(/zero samples/);
  });

  it("fails the running gate when the native tick never ADVANCED", () => {
    // The open defect. Note the tick is NOT zero: a frozen sim keeps whatever
    // opening value the arena was created with, so only the SPAN reveals it.
    const frozen = buildHudDump({
      url: "http://x/",
      canvases: [{ width: 800, height: 600, contextLost: false }],
      rawSnapshot: {},
      snapshot: parsePhysicsSnapshot({
        schema: 1,
        metrics: { schedulerTick: 30 },
        samples: [
          { schedulerTick: 10, state: [7, 0, 1], mode: "match", phase: "kickoff" },
          { schedulerTick: 30, state: [7, 0, 1], mode: "match", phase: "kickoff" },
        ],
      }),
    });
    expect(frozen.nativeTick).toBe(7);
    expect(frozen.nativeTickSpan).toBe(0);
    const gate = meetsGate(frozen, "match-running");
    expect(gate.ok).toBe(false);
    expect(gate.reason).toMatch(/never stepped/);
  });

  it("fails the running gate with only one sample, which cannot show movement", () => {
    const single = buildHudDump({
      url: "http://x/",
      canvases: [{ width: 800, height: 600, contextLost: false }],
      rawSnapshot: {},
      snapshot: parsePhysicsSnapshot({
        schema: 1,
        metrics: { schedulerTick: 10 },
        samples: [{ schedulerTick: 10, state: [400, 0, 2], mode: "match", phase: "playing" }],
      }),
    });
    expect(meetsGate(single, "match-running").ok).toBe(false);
    expect(meetsGate(single, "match-running").reason).toMatch(/cannot show whether/);
  });

  it("passes when the canvas is live and the sim advanced", () => {
    const healthy = buildHudDump({
      url: "http://x/",
      canvases: [{ width: 800, height: 600, contextLost: false }],
      rawSnapshot: {},
      snapshot: parsePhysicsSnapshot({
        schema: 1,
        metrics: { schedulerTick: 400 },
        samples: [
          { schedulerTick: 399, state: [399, 0, 2], mode: "match", phase: "playing" },
          { schedulerTick: 400, state: [400, 0, 2], mode: "match", phase: "playing" },
        ],
      }),
    });
    expect(healthy.nativeTickSpan).toBe(1);
    expect(meetsGate(healthy, "match-running").ok).toBe(true);
    expect(meetsGate(healthy, "match-kickoff").ok).toBe(true);
  });
});

/* -------------------------------------------------------------------------- */
/* Sim progress — the open defect, detected                                    */
/* -------------------------------------------------------------------------- */

describe("assessSimProgress", () => {
  const snap = (samples: readonly unknown[]) =>
    parsePhysicsSnapshot({ schema: 1, metrics: { schedulerTick: 0 }, samples, limitations: [] });

  it("reports blocked-upstream when the hook was never installed", () => {
    const verdict = assessSimProgress(null);
    expect(verdict.status).toBe("blocked-upstream");
    expect(verdict.detail).toMatch(/physicsDebug=1/);
  });

  it("reports blocked-upstream when the hook recorded nothing", () => {
    const verdict = assessSimProgress(snap([]));
    expect(verdict.status).toBe("blocked-upstream");
    expect(verdict.detail).toMatch(/never fired/);
  });

  it("detects the OPEN DEFECT: a match that never leaves its opening phase", () => {
    // The scheduler tick moves (the render loop runs, and the donor itself
    // warns that scheduler ticks include countdown ticks) while the NATIVE tick
    // does not. That combination is the frozen sim.
    const verdict = assessSimProgress(
      snap([
        { schedulerTick: 10, state: [0, 0, 0, 0], mode: "match", phase: "kickoff" },
        { schedulerTick: 20, state: [0, 0, 0, 0], mode: "match", phase: "kickoff" },
        { schedulerTick: 30, state: [0, 0, 0, 0], mode: "match", phase: "kickoff" },
      ]),
    );
    expect(verdict.status).toBe("blocked-upstream");
    expect(verdict.nativeTickSpan).toBe(0);
    expect(verdict.schedulerTickSpan).toBe(20);
    expect(verdict.phasesBeyondOpening).toEqual([]);
    expect(verdict.detail).toMatch(/upstream of parity/);
    // It must explicitly NOT be confused with the donor's benign clock hold.
    expect(verdict.detail).toMatch(/NOT the donor's benign clock hold/);
  });

  it("calls it a FAILURE, not a block, when the arena is loaded but frozen", () => {
    const verdict = assessSimProgress(
      snap([
        { schedulerTick: 1, state: [0, 0, 2], mode: "match", phase: "kickoff" },
        { schedulerTick: 2, state: [0, 0, 2], mode: "match", phase: "kickoff" },
      ]),
    );
    expect(verdict.status).toBe("fail");
  });

  it("passes when the native tick advanced, even if the phase is still kickoff", () => {
    const verdict = assessSimProgress(
      snap([
        { schedulerTick: 1, state: [0, 0, 2], mode: "match", phase: "kickoff" },
        { schedulerTick: 2, state: [120, 0, 2], mode: "match", phase: "kickoff" },
      ]),
    );
    expect(verdict.status).toBe("pass");
    expect(verdict.nativeTickSpan).toBe(120);
  });

  it("knows which phases count as opening", () => {
    expect(OPENING_PHASES).toContain("kickoff");
    expect(OPENING_PHASES).toContain("playing");
  });
});

describe("parsePhysicsSnapshot — refuses a half-legible instrument", () => {
  it("returns null for null, undefined and a non-object", () => {
    expect(parsePhysicsSnapshot(null)).toBeNull();
    expect(parsePhysicsSnapshot(undefined)).toBeNull();
    expect(parsePhysicsSnapshot("nope")).toBeNull();
  });

  it("returns null when there is no samples array", () => {
    expect(parsePhysicsSnapshot({ schema: 1, metrics: {} })).toBeNull();
  });

  it("skips samples whose state array is missing rather than inventing one", () => {
    const snapshot = parsePhysicsSnapshot({
      schema: 1,
      metrics: {},
      samples: [{ schedulerTick: 1 }, { schedulerTick: 2, state: [1, 0, 2] }],
    });
    expect(snapshot?.samples).toHaveLength(1);
    expect(snapshot?.samples[0].schedulerTick).toBe(2);
  });

  it("fills in the donor's own limitations when the snapshot omits them", () => {
    const snapshot = parsePhysicsSnapshot({ schema: 1, metrics: {}, samples: [] });
    expect(snapshot?.limitations.length).toBeGreaterThan(0);
  });
});

/* -------------------------------------------------------------------------- */
/* The report                                                                  */
/* -------------------------------------------------------------------------- */

describe("the pass/fail/BLOCKED table", () => {
  const results: DimensionResult[] = [
    { dimensionId: "physics-gravity", status: "pass", evidence: "650.0 UU/s^2" },
    { dimensionId: "physics-top-speed", status: "pass", evidence: "1410.0 UU/s" },
    { dimensionId: "match-leaves-opening-phase", status: "blocked-upstream", evidence: "state[0] frozen" },
  ];

  it("renders a row per dimension with a four-state status column", () => {
    const table = formatParityTable(checklistRows(results), "T");
    expect(table).toMatch(/^T\n/);
    expect(table).toMatch(/STATUS/);
    expect(table).toMatch(/PASS/);
    expect(table).toMatch(/BLOCKED_UPSTREAM/);
    expect(table).toMatch(/UNVERIFIED/);
  });

  it("labels the un-evidenced dimensions instead of leaving them blank", () => {
    const rows = checklistRows(results);
    const unproven = rows.find((r) => r.id === "visual-donor-bytes-unmodified");
    expect(unproven?.status).toBe("unverified");
    expect(unproven?.detail).toMatch(/No evidence recorded/);
  });

  it("breaks the roll-up down by area and states the release gate", () => {
    const pass = buildParityPass({ checklistResults: results });
    expect(pass.table).toMatch(/BY AREA/);
    expect(pass.table).toMatch(/RELEASE not blocked/);
    expect(pass.exitCode).toBe(0);
    expect(summarizePass(pass)).toMatch(/Release not blocked/);
  });

  it("exits non-zero and names the culprit when a BLOCKING dimension fails", () => {
    const pass = buildParityPass({
      checklistResults: [...results, { dimensionId: "physics-core-binary", status: "fail" }],
    });
    expect(pass.releaseBlocked).toBe(true);
    expect(pass.exitCode).toBe(1);
    expect(pass.table).toMatch(/RELEASE BLOCKED by: physics-core-binary/);
  });

  it("does not exit non-zero merely because a dimension is blocked or unverified", () => {
    // A harness that fails on "could not measure" is a harness that gets
    // switched off. The table says so in words instead.
    const pass = buildParityPass({ checklistResults: results });
    expect(pass.exitCode).toBe(0);
    expect(pass.table).toMatch(/still to prove/);
  });

  it("prints physics metric rows with the baseline and tolerance beside them", () => {
    const report = comparePhysicsToBaseline({ gravityUUps2: 650.0 });
    const rows = physicsRows(report);
    const gravity = rows.find((r) => r.id === "physics.gravity");
    expect(gravity?.status).toBe("pass");
    expect(gravity?.detail).toMatch(/baseline 650/);
    expect(gravity?.detail).toMatch(/tol 0.5/);
  });

  it("reports a frame diff as unverified with its grade, never as a pass", () => {
    // A graded WebGL ratio is a review prompt. Rendering it as `pass` would be
    // the exact dishonesty the module header warns about.
    const frame = { width: 4, height: 4, data: new Uint8Array(64).fill(0) };
    const other = { width: 4, height: 4, data: new Uint8Array(64).fill(255) };
    const diff = diffRgba(frame, other);
    if ("ok" in diff) throw new Error("expected a diff");
    const grade = gradeOf(diff);
    expect(grade).toBe("regression");
  });

  it("keeps the checklist and the physics report consistent in one pass", () => {
    const report = comparePhysicsToBaseline({ gravityUUps2: 650.0 });
    const pass = buildParityPass({
      checklistResults: results,
      rows: physicsRows(report),
      physics: report,
    });
    expect(pass.summary.total).toBe(summarizeParity(results).total);
    expect(pass.table).toMatch(/physics\.gravity/);
    expect(pass.table).toMatch(/650/);
  });
});
