/**
 * Phase 9 — THE PARITY PASS REPORT (pure).
 *
 * OWNER: the Phase 9 parity worker (`src/airjam/parity/**`).
 *
 * ---------------------------------------------------------------------------
 * WHY A TABLE AND NOT A SCORE
 * ---------------------------------------------------------------------------
 * A single "82 % parity" number is worse than no number: it invites a
 * threshold, and once there is a threshold someone will move a dimension across
 * it. So there is no score. The output is a table in which every row is a
 * dimension, every row carries one of four statuses, and the reader can see
 * exactly which rows have no evidence behind them.
 *
 * The four statuses, and why each exists:
 *
 *   PASS              evidence observed, and it meets the stated definition.
 *   FAIL              evidence observed, and it does not. Only a FAIL is a
 *                     claim that something is wrong.
 *   BLOCKED_UPSTREAM  somebody tried; an upstream defect stopped the
 *                     measurement. Neither a pass nor a failure.
 *   UNVERIFIED        nobody has checked it. The default state of every
 *                     dimension, and the honest answer for most of them today.
 *
 * ---------------------------------------------------------------------------
 * WHY THE EXIT CODE IS DELIBERATELY CONSERVATIVE
 * ---------------------------------------------------------------------------
 * `exitCodeFor` returns non-zero only for a blocking FAIL. A BLOCKED_UPSTREAM or
 * UNVERIFIED does not fail a run, because a harness that fails on "could not
 * measure" is a harness that gets switched off. It does not pass one either:
 * the table says so in words, and `releaseBlocked` is the field a release
 * pipeline should gate on.
 */

import {
  PARITY_CHECKLIST,
  summarizeParity,
  type DimensionResult,
  type ParityArea,
  type ParitySummary,
} from "./checklist.js";
import type { PhysicsParityReport } from "./physics-parity.js";
import type { AssetDiff, RequiredAssetsReport } from "./asset-manifest.js";
import type { HudDiff, HudDump } from "./capture.js";
import {
  gradeDiff,
  isDiffError,
  type DiffGrade,
  type DiffInputError,
  type ImageDiffResult,
} from "./image-diff.js";
import type { ParityStatus } from "./physics-parity.js";

export type { ParityStatus };

/**
 * Re-exported so a script can build a report with one import. `DimensionResult`
 * is the only way a status can enter this system, so it belongs next to the
 * table that renders it.
 */
export type { DimensionResult, ParitySummary } from "./checklist.js";

/* -------------------------------------------------------------------------- */
/* Row                                                                         */
/* -------------------------------------------------------------------------- */

/** One row of the table. `detail` is the evidence, in one line. */
export interface ParityRow {
  readonly id: string;
  readonly area: ParityArea | "physics-run" | "assets-run" | "capture";
  readonly status: ParityStatus;
  readonly blocking: boolean;
  readonly dimension: string;
  readonly detail: string;
}

const row = (
  id: string,
  area: ParityRow["area"],
  status: ParityStatus,
  blocking: boolean,
  dimension: string,
  detail: string,
): ParityRow => Object.freeze({ id, area, status, blocking, dimension, detail });

/* -------------------------------------------------------------------------- */
/* Section builders                                                            */
/* -------------------------------------------------------------------------- */

/** Physics comparator verdicts as rows, keyed by metric id. */
export function physicsRows(report: PhysicsParityReport): readonly ParityRow[] {
  return report.verdicts.map((verdict) =>
    row(
      `physics.${verdict.id}`,
      "physics-run",
      verdict.status,
      true,
      verdict.label,
      `${verdict.unit} | baseline ${verdict.baseline} | tol ${verdict.tolerance} | ${verdict.why}`,
    ),
  );
}

/** The asset manifest as rows: the tree diff and the required-set check. */
export function assetRows(
  diff: AssetDiff,
  required: RequiredAssetsReport,
  dimensions: readonly { id: string; blocking: boolean }[],
): readonly ParityRow[] {
  const idFor = (needle: string, fallback: string): string =>
    dimensions.find((d) => d.id.includes(needle))?.id ?? fallback;
  const treeFail = diff.missing.length > 0 || diff.extra.length > 0 || diff.sizeMismatch.length > 0 || diff.hashMismatch.length > 0;
  const rows: ParityRow[] = [
    row(
      "assets.tree",
      "assets-run",
      treeFail ? "fail" : "pass",
      true,
      "Donor vs port asset tree",
      `${diff.shared} shared, ${diff.hashed} hashed | missing ${diff.missing.length}, extra ${diff.extra.length}, size-diff ${diff.sizeMismatch.length}, hash-diff ${diff.hashMismatch.length}.`,
    ),
    row(
      "assets.required",
      "assets-run",
      required.canPhysicsInitialise ? "pass" : "fail",
      true,
      "Required physics assets",
      required.detail,
    ),
  ];
  if (diff.missing.length > 0) {
    rows.push(
      row(idFor("physics-arena-collision", "physics-arena-collision-meshes"), "assets-run", "fail", true, "Collision mesh completeness", `missing: ${diff.missing.slice(0, 6).join(", ")}${diff.missing.length > 6 ? ` (+${diff.missing.length - 6} more)` : ""}`),
    );
  }
  return rows;
}

/** A capture comparison as rows: the frame diff and the HUD text diff. */
export function captureRows(
  label: string,
  diff: ImageDiffResult | DiffInputError,
  grade: DiffGrade | null,
  hud: HudDiff | null,
  gates: readonly { readonly scenario: string; readonly ok: boolean; readonly reason: string }[],
): readonly ParityRow[] {
  const rows: ParityRow[] = [];
  for (const gate of gates) {
    rows.push(
      row(
        `capture.${label}.${gate.scenario}.gate`,
        "capture",
        gate.ok ? "pass" : "blocked-upstream",
        true,
        `Capture gate: ${gate.scenario}`,
        gate.reason,
      ),
    );
  }
  if (isDiffError(diff)) {
    rows.push(row(`capture.${label}.diff`, "capture", "fail", false, "Frame diff", `diff could not run: ${diff.reason}`));
    return Object.freeze(rows);
  }
  if (grade) {
    rows.push(
      row(
        `capture.${label}.diff`,
        "capture",
        "unverified",
        false,
        `Frame diff: ${label}`,
        `${(diff.ratio * 100).toFixed(3)}% of pixels moved | grade ${grade} | a graded result is a review prompt, not a verdict`,
      ),
    );
  }
  if (hud) {
    rows.push(
      row(
        `capture.${label}.hud`,
        "capture",
        hud.identical ? "pass" : "fail",
        true,
        `HUD text: ${label}`,
        hud.detail,
      ),
    );
  }
  return Object.freeze(rows);
}

/** Checklist dimensions plus their results as rows. */
export function checklistRows(
  results: readonly DimensionResult[],
  dimensions = PARITY_CHECKLIST,
): readonly ParityRow[] {
  const byId = new Map(results.map((r) => [r.dimensionId, r]));
  return dimensions.map((dimension) => {
    const result = byId.get(dimension.id);
    return row(
      dimension.id,
      dimension.area,
      result?.status ?? "unverified",
      dimension.blocking,
      dimension.title,
      result?.evidence ?? `No evidence recorded. ${dimension.verification.kind} verification defined but not run.`,
    );
  });
}

/* -------------------------------------------------------------------------- */
/* The table                                                                   */
/* -------------------------------------------------------------------------- */

const LABEL: Readonly<Record<ParityStatus, string>> = Object.freeze({
  pass: "PASS",
  fail: "FAIL",
  "blocked-upstream": "BLOCKED_UPSTREAM",
  unverified: "UNVERIFIED",
});

const WIDTH_STATUS = 17;
const WIDTH_BLOCKING = 5;
const WIDTH_AREA = 13;
const WIDTH_ID = 34;

/** A fixed-width table, so a diff between two runs is readable. */
export function formatParityTable(rows: readonly ParityRow[], title?: string): string {
  const header =
    `${"STATUS".padEnd(WIDTH_STATUS)} ${"BLK".padEnd(WIDTH_BLOCKING)} ${"AREA".padEnd(WIDTH_AREA)} ${"ID".padEnd(WIDTH_ID)} DETAIL`;
  const rule = "-".repeat(header.length);
  const body = rows.map((r) =>
    [
      LABEL[r.status].padEnd(WIDTH_STATUS),
      (r.blocking ? "yes" : "-").padEnd(WIDTH_BLOCKING),
      r.area.padEnd(WIDTH_AREA),
      r.id.padEnd(WIDTH_ID),
      r.detail,
    ].join(" "),
  );
  return [title, rule, header, rule, ...body].filter((line) => line !== undefined).join("\n");
}

export interface ParityPassInput {
  readonly checklistResults: readonly DimensionResult[];
  readonly rows?: readonly ParityRow[];
  readonly physics?: PhysicsParityReport;
  readonly assets?: { readonly diff: AssetDiff; readonly required: RequiredAssetsReport };
  readonly notes?: readonly string[];
}

/** Everything the run produced, plus the roll-up. */
export interface ParityPass {
  readonly summary: ParitySummary;
  readonly rows: readonly ParityRow[];
  readonly table: string;
  readonly releaseBlocked: boolean;
  readonly exitCode: number;
  readonly notes: readonly string[];
}

/** The order a reader should work the sections in: blockers first, presentation later. */
export const PASS_SECTION_ORDER: readonly string[] = Object.freeze([
  "physics",
  "assets",
  "capture",
  "checklist",
]);

/**
 * Assemble the whole pass: the per-area roll-up, every row, and the exit code.
 *
 * The rows are grouped in the order a reader should work — the things that
 * block everything else first (the sim, the engine, the assets), then the
 * presentation layers, then the checklist. `notes` are appended verbatim,
 * because the caveats (SwiftShader, the un-graded capture) are the part a
 * reader must not have to go looking for.
 */
export function buildParityPass(input: ParityPassInput): ParityPass {
  const summary = summarizeParity(input.checklistResults);
  const extra: readonly ParityRow[] = input.rows ?? [];
  const checklist = checklistRows(input.checklistResults);
  const rows = Object.freeze([...extra, ...checklist]);

  const notes = [
    ...(input.physics?.notes ?? []),
    ...(input.assets?.diff.notes ?? []),
    ...(input.notes ?? []),
    ...(summary.questions.length > 0
      ? [
          `${summary.questions.length} dimension(s) still to prove: ${summary.questions.join(", ")}`,
        ]
      : []),
  ];

  const table = [
    formatParityTable(rows, "ROCKET ARENA — PARITY PASS"),
    "",
    "BY AREA",
    ...summary.byArea.map((a) =>
      `  ${a.area.padEnd(12)} total ${String(a.total).padStart(3)}  blocking ${String(a.blocking).padStart(3)}  pass ${String(a.pass).padStart(3)}  fail ${String(a.fail).padStart(3)}  blocked ${String(a.blocked).padStart(3)}  unverified ${String(a.unverified).padStart(3)}`,
    ),
    "",
    `TOTAL ${summary.total} dimensions, ${summary.blockingTotal} blocking.`,
    `pass ${summary.byStatus.pass} / fail ${summary.byStatus.fail} / blocked-upstream ${summary.byStatus["blocked-upstream"]} / unverified ${summary.byStatus.unverified}`,
    `RELEASE ${summary.releaseBlocked ? "BLOCKED by: " + summary.blockingFailures.join(", ") : "not blocked by a failing dimension"}`,
    ...(notes.length ? ["", "NOTES", ...notes.map((n) => `  - ${n}`)] : []),
  ].join("\n");

  return Object.freeze({
    summary,
    rows,
    table,
    releaseBlocked: summary.releaseBlocked,
    exitCode: summary.releaseBlocked ? 1 : 0,
    notes: Object.freeze(notes),
  });
}

/** Grade a diff for display, tolerating the error variant. */
export function gradeOf(diff: ImageDiffResult | DiffInputError): DiffGrade | null {
  if (isDiffError(diff)) return null;
  return gradeDiff(diff.ratio);
}

/** Human label for a status. Exported so a CI summary cannot invent its own. */
export const STATUS_LABEL = LABEL;

/** One-line roll-up, for a log line. */
export function summarizePass(pass: ParityPass): string {
  const s = pass.summary;
  return `${s.total} dimensions (${s.blockingTotal} blocking): ${s.byStatus.pass} pass, ${s.byStatus.fail} fail, ${s.byStatus["blocked-upstream"]} blocked-upstream, ${s.byStatus.unverified} unverified. Release ${pass.releaseBlocked ? "BLOCKED" : "not blocked"}.`;
}

/** Re-exported so a caller can build a dump from raw input without a second import. */
export type { HudDump, HudDiff };
