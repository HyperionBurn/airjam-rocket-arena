/**
 * Phase 9 — THE DETERMINISTIC CAPTURE PLAN (pure).
 *
 * OWNER: the Phase 9 parity worker (`src/airjam/parity/**`).
 *
 * ---------------------------------------------------------------------------
 * WHAT IS HERE AND WHAT IS NOT
 * ---------------------------------------------------------------------------
 * Everything in this file is a pure function of its arguments: which state to
 * drive to, what to click, at what size, and how to normalise the text that
 * comes back. The Playwright driving — launching Chromium with SwiftShader,
 * clicking, decoding the PNG, writing files — lives in
 * `_scratch/parity/capture.mjs`, which reads a plan from here. That split is
 * the reason a plan can be unit-tested at all: a test asserts the plan is right
 * without a browser, and the script does one thing.
 *
 * ---------------------------------------------------------------------------
 * WHY "DETERMINISTIC" IS SCOPED, NOT ABSOLUTE
 * ---------------------------------------------------------------------------
 * What IS deterministic here: the viewport, the device scale factor, the exact
 * sequence of clicks by visible button text, the query flag that installs the
 * physics hook, the wait budget at each step, and the fact that a capture is
 * always taken with the same launch flags (recorded in `CAPTURE_PROVENANCE`).
 * Given the same build, the same machine and the same software rasteriser, two
 * captures of the same scenario differ only by effect timing — see
 * `image-diff.ts` for why that residue is not eliminable and how it is graded.
 *
 * What is NOT claimed: that two machines produce the same bytes, that the
 * capture represents any real GPU's output, or that any single frame implies
 * anything about frame rate. Under SwiftShader the harness runs at single-digit
 * FPS. That number is a property of software rasterisation, not a measurement
 * of this product's performance, and no part of this module reports it.
 *
 * ---------------------------------------------------------------------------
 * WHY THE HOOK QUERY IS PART OF THE PLAN AND NOT AN OPTION
 * ---------------------------------------------------------------------------
 * `?physicsDebug=1` is the only way `window.rocketArenaPhysics` gets defined
 * (`app/startup.js:772`). A capture taken without it yields no sim state, and a
 * harness that quietly reported that as "no physics differences" would be
 * claiming a verification it never performed. The plan therefore always sets
 * the flag, and `hudDump` records whether the hook answered.
 */

import type { PhysicsDebugSnapshot } from "./snapshot.js";

/* -------------------------------------------------------------------------- */
/* Provenance — recorded with every capture                                    */
/* -------------------------------------------------------------------------- */

export interface CaptureProvenance {
  readonly viewport: { readonly width: number; readonly height: number };
  readonly deviceScaleFactor: number;
  /** Chromium MUST be launched with these or WebGL does not come up at all. */
  readonly launchArgs: readonly string[];
  readonly renderer: "swiftshader (software)";
  readonly performanceCaveat: string;
}

export const CAPTURE_PROVENANCE: CaptureProvenance = Object.freeze({
  viewport: Object.freeze({ width: 1600, height: 900 }),
  deviceScaleFactor: 1,
  launchArgs: Object.freeze([
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
    "--enable-webgl",
  ]),
  renderer: "swiftshader (software)",
  performanceCaveat:
    "Captures run under a software rasteriser and are expected to be single-digit FPS. That is not a performance measurement and must not be reported as one.",
});

/* -------------------------------------------------------------------------- */
/* Scenarios                                                                   */
/* -------------------------------------------------------------------------- */

export type CaptureScenario = "home" | "match-kickoff" | "match-running" | "physics-run";

/**
 * Which known state each scenario drives to, and why. The click sequences are
 * the donor's own visible button labels, matched case-insensitively as a
 * substring — the same approach the working `capture.mjs` uses, because CSS
 * selectors over a minified donor DOM are a far more fragile contract than
 * text a human can read on screen.
 */
export interface ScenarioSpec {
  readonly scenario: CaptureScenario;
  readonly title: string;
  /** Button labels to click in order. Empty for states reached on load. */
  readonly clicks: readonly string[];
  /** Extra query parameters beyond the physics hook. */
  readonly query: Readonly<Record<string, string>>;
  /** Wait after load, in ms. The donor loads ~36 MB of art under SwiftShader. */
  readonly settleMs: number;
  /** Wait after the last click, in ms. */
  readonly postClickMs: number;
  /** What a correct capture looks like, in terms a reader can check. */
  readonly expect: string;
  /** A capture that does not reach this cannot claim anything about the frame. */
  readonly gate: string;
}

const spec = (entry: ScenarioSpec): ScenarioSpec => Object.freeze(entry);

export const SCENARIOS: Readonly<Record<CaptureScenario, ScenarioSpec>> = Object.freeze({
  home: spec({
    scenario: "home",
    title: "Home / garage screen",
    clicks: Object.freeze([]),
    query: Object.freeze({}),
    settleMs: 30_000,
    postClickMs: 2_000,
    expect: "The donor home screen with its menu entries visible and a WebGL canvas present and not context-lost.",
    gate: "at least one canvas with a live WebGL context",
  }),
  "match-kickoff": spec({
    scenario: "match-kickoff",
    title: "Match, at kickoff",
    clicks: Object.freeze(["PLAY", "BOTS", "START"]),
    query: Object.freeze({}),
    settleMs: 30_000,
    postClickMs: 12_000,
    expect: "A loaded arena, clock at its opening value, cars spawned, and the physics hook reporting samples.",
    gate: "the physics hook answered with at least one sample",
  }),
  "match-running": spec({
    scenario: "match-running",
    title: "Match, camera after the ball has moved",
    clicks: Object.freeze(["PLAY", "BOTS", "START"]),
    query: Object.freeze({}),
    settleMs: 30_000,
    postClickMs: 25_000,
    expect: "The chase camera has settled and the ball has been touched, i.e. the match has genuinely left kickoff.",
    gate: "the physics hook reports a native tick span greater than zero",
  }),
  "physics-run": spec({
    scenario: "physics-run",
    title: "Physics probe run (samples, no frame claim)",
    clicks: Object.freeze(["PLAY", "BOTS", "START"]),
    query: Object.freeze({}),
    settleMs: 30_000,
    postClickMs: 20_000,
    expect:
      "A long enough window for the donor's bounded sample ring (600 entries) to hold a useful number of scheduler ticks.",
    gate: "at least two samples, with a native tick span greater than zero",
  }),
});

export const ALL_SCENARIOS: readonly CaptureScenario[] = Object.freeze([
  "home",
  "match-kickoff",
  "match-running",
  "physics-run",
] as const);

/* -------------------------------------------------------------------------- */
/* The plan                                                                    */
/* -------------------------------------------------------------------------- */

export type CaptureStep =
  | { readonly kind: "goto"; readonly url: string }
  | { readonly kind: "wait"; readonly ms: number }
  | { readonly kind: "click-text"; readonly text: string }
  | { readonly kind: "capture"; readonly name: string }
  | { readonly kind: "dump-hud" }
  | { readonly kind: "dump-physics" };

export interface CapturePlan {
  readonly scenario: CaptureScenario;
  readonly provenance: CaptureProvenance;
  readonly steps: readonly CaptureStep[];
  /** The URL actually requested, with the physics hook guaranteed present. */
  readonly url: string;
  /**
   * The button labels this plan clicked. Present on the plan so a capture
   * records HOW it reached the state, not just that it reached one.
   */
  readonly clicks: readonly string[];
}

/**
 * Per-run overrides. These exist because the port is NOT the donor's UI: it
 * wraps the donor in an Air Jam lobby whose start button reads START MATCH
 * where the donor's reads START. A harness that hard-coded one click sequence
 * would silently capture the lobby and then report a 100 % frame diff, which
 * is true but useless — it describes the harness, not the game.
 */
export interface PlanOverrides {
  /** Replaces the scenario's click sequence. */
  readonly clicks?: readonly string[];
  /** Replaces the post-click wait, in ms. */
  readonly postClickMs?: number;
  /** Replaces the post-load settle wait, in ms. */
  readonly settleMs?: number;
}

/**
 * Build the query string. The physics flag is always on and cannot be switched
 * off; an extra `physicsDebug` in `query` is ignored rather than allowed to
 * remove the instrument.
 */
export function buildUrl(base: string, scenario: CaptureScenario): string {
  const url = new URL(base);
  url.searchParams.set("physicsDebug", "1");
  for (const [key, value] of Object.entries(SCENARIOS[scenario].query)) {
    if (key === "physicsDebug") continue;
    url.searchParams.set(key, value);
  }
  return url.toString();
}

/**
 * The full ordered step list a driver must execute, for one scenario.
 *
 * `overrides.clicks` replaces the scenario's sequence outright rather than
 * appending, because a port's start button and the donor's are different
 * controls — clicking both would double-drive the match.
 */
export function buildCapturePlan(
  baseUrl: string,
  scenario: CaptureScenario,
  overrides: PlanOverrides = {},
): CapturePlan {
  const spec_ = SCENARIOS[scenario];
  const clicks = overrides.clicks ?? spec_.clicks;
  const settleMs = overrides.settleMs ?? spec_.settleMs;
  const postClickMs = overrides.postClickMs ?? spec_.postClickMs;

  const steps: CaptureStep[] = [
    { kind: "goto", url: buildUrl(baseUrl, scenario) },
    { kind: "wait", ms: settleMs },
  ];
  for (const text of clicks) {
    steps.push({ kind: "click-text", text });
    steps.push({ kind: "wait", ms: 3_000 });
  }
  if (clicks.length > 0) steps.push({ kind: "wait", ms: postClickMs });
  steps.push({ kind: "dump-hud" });
  steps.push({ kind: "dump-physics" });
  steps.push({ kind: "capture", name: scenario });
  return Object.freeze({
    scenario,
    provenance: CAPTURE_PROVENANCE,
    steps: Object.freeze(steps),
    url: buildUrl(baseUrl, scenario),
    clicks: Object.freeze([...clicks]),
  });
}

/** Flatten a plan to a human-readable script, for a run log. */
export function describePlan(plan: CapturePlan): readonly string[] {
  return plan.steps.map((step) => {
    switch (step.kind) {
      case "goto":
        return `goto ${step.url}`;
      case "wait":
        return `wait ${step.ms}ms`;
      case "click-text":
        return `click text "${step.text}"`;
      case "capture":
        return `capture frame -> ${step.name}.png`;
      case "dump-hud":
        return "dump DOM/HUD text -> hud.txt";
      case "dump-physics":
        return "dump window.rocketArenaPhysics.snapshot() -> physics.json";
    }
  });
}

/* -------------------------------------------------------------------------- */
/* The HUD / DOM text dump                                                     */
/* -------------------------------------------------------------------------- */

export interface HudDump {
  readonly title: string;
  /** Whitespace-normalised body text. Stable enough to compare between runs. */
  readonly text: string;
  readonly lines: readonly string[];
  readonly canvasCount: number;
  readonly canvases: readonly {
    readonly width: number;
    readonly height: number;
    readonly contextLost: boolean | "no-context" | "err";
  }[];
  readonly physicsHookPresent: boolean;
  readonly sampleCount: number;
  readonly schedulerTick: number;
  /** `state[0]` of the LAST sample. Not a health signal on its own — see `nativeTickSpan`. */
  readonly nativeTick: number;
  /**
   * Last minus first `state[0]` across the window. This is the health signal:
   * a sim that has not stepped holds a non-zero opening tick for the whole
   * capture, so an absolute tick cannot distinguish "running" from "frozen".
   */
  readonly nativeTickSpan: number;
  readonly phase: string;
  readonly mode: string;
  readonly url: string;
}

/**
 * Normalise DOM text so two runs can be compared.
 *
 * Three classes of churn are handled, and only these three:
 *  - runs of whitespace, which differ with font loading and layout rounding;
 *  - a free-running clock, whose digits differ with wall-clock time by
 *    construction. The digits are REPLACED with {@link CLOCK_PLACEHOLDER} rather
 *    than the line being dropped: dropping a whole line would also delete the
 *    score, the team names or the word next to the clock, which are exactly the
 *    things a port is most likely to get wrong.
 *  - the FPS counter, which differs with the machine. That line IS dropped in
 *    full, because an FPS readout is a property of the capture host and is
 *    never a parity signal.
 *
 * Everything else is preserved verbatim. An over-eager normaliser here would
 * delete exactly the HUD differences this dump exists to find — a changed
 * label, a missing element, a wrong state.
 */
export const CLOCK_PLACEHOLDER = "<clock>";

export function normalizeHudText(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[^\S\n]+/g, " ").trim())
    .filter((line) => line.length > 0)
    .map((line) => line.replace(/\b\d{1,2}:\d{2}\b/g, CLOCK_PLACEHOLDER))
    .filter((line) => !/\d+(\.\d+)?\s?fps\b/i.test(line))
    .join("\n");
}

export interface HudDiff {
  readonly identical: boolean;
  readonly donorLines: number;
  readonly portLines: number;
  /** Lines in the donor that are not in the port. */
  readonly onlyInDonor: readonly string[];
  readonly onlyInPort: readonly string[];
  /** Jaccard similarity of the two line sets, 0..1. */
  readonly lineSimilarity: number;
  readonly detail: string;
}

/**
 * Compare two HUD dumps by their normalised line SETS.
 *
 * Set comparison, not sequence comparison: HUD elements are laid out in a
 * document order that legitimately differs between the donor and a port that
 * adds its own overlays, and asserting on order would report that as a parity
 * break. What matters is that the same information is on screen.
 *
 * Unlike the pixel diff, this comparison CAN legitimately be exact, so a
 * non-zero `lineSimilarity` gap is real evidence rather than a graded prompt.
 */
export function diffHudDumps(donor: HudDump, port: HudDump): HudDiff {
  const donorLines = new Set(normalizeHudText(donor.text).split("\n").filter(Boolean));
  const portLines = new Set(normalizeHudText(port.text).split("\n").filter(Boolean));
  const onlyInDonor = [...donorLines].filter((line) => !portLines.has(line)).sort();
  const onlyInPort = [...portLines].filter((line) => !donorLines.has(line)).sort();
  const union = new Set([...donorLines, ...portLines]);
  const intersection = [...donorLines].filter((line) => portLines.has(line)).length;
  const lineSimilarity = union.size === 0 ? 1 : intersection / union.size;
  const identical = onlyInDonor.length === 0 && onlyInPort.length === 0;
  return Object.freeze({
    identical,
    donorLines: donorLines.size,
    portLines: portLines.size,
    onlyInDonor: Object.freeze(onlyInDonor),
    onlyInPort: Object.freeze(onlyInPort),
    lineSimilarity,
    detail: identical
      ? "The two HUDs present exactly the same normalised text lines."
      : `${onlyInDonor.length} line(s) only in the donor, ${onlyInPort.length} only in the port; line-set similarity ${(lineSimilarity * 100).toFixed(1)}%.`,
  });
}

/** Does this dump satisfy the scenario's own gate? Pure, and checked before anything is claimed. */
export function meetsGate(hud: HudDump, scenario: CaptureScenario): { readonly ok: boolean; readonly reason: string } {
  const spec_ = SCENARIOS[scenario];
  const liveCanvas = hud.canvasCount > 0 && hud.canvases.some((c) => c.contextLost === false);
  if (!liveCanvas) {
    return Object.freeze({
      ok: false,
      reason: `scenario "${scenario}" gate not met: ${spec_.gate}. Observed ${hud.canvasCount} canvas(es), contextLost=${hud.canvases.map((c) => c.contextLost).join(",") || "none"}.`,
    });
  }
  if (scenario !== "home") {
    if (!hud.physicsHookPresent) {
      return Object.freeze({
        ok: false,
        reason: `scenario "${scenario}" gate not met: ${spec_.gate}. window.rocketArenaPhysics was absent even though the URL carried ?physicsDebug=1.`,
      });
    }
    if (hud.sampleCount === 0) {
      return Object.freeze({
        ok: false,
        reason: `scenario "${scenario}" gate not met: ${spec_.gate}. The hook answered with zero samples, so clock.onTick never fired.`,
      });
    }
  }
  if (scenario === "match-running" || scenario === "physics-run") {
    if (hud.sampleCount < 2) {
      return Object.freeze({
        ok: false,
        reason: `scenario "${scenario}" gate not met: ${spec_.gate}. Only ${hud.sampleCount} sample(s), so the window cannot show whether the simulation advanced at all.`,
      });
    }
    if (hud.nativeTickSpan <= 0) {
      return Object.freeze({
        ok: false,
        reason: `scenario "${scenario}" gate not met: ${spec_.gate}. The native tick held at state[0] = ${hud.nativeTick} across ${hud.sampleCount} samples (span 0), so the simulation never stepped. Note the tick is NOT zero — a frozen sim keeps whatever opening value the arena was created with, which is why the span is the gate and not the absolute value.`,
      });
    }
  }
  return Object.freeze({ ok: true, reason: `gate met: ${spec_.gate}` });
}

/**
 * Build a `HudDump` from whatever the driver managed to read, tolerating every
 * field being absent. Used both to build a real dump and to build a dump for a
 * capture that failed, so a failed capture still produces a comparable record
 * rather than an exception.
 */
export function buildHudDump(input: {
  readonly url: string;
  readonly title?: string;
  readonly text?: string;
  readonly canvases?: readonly { width: number; height: number; contextLost: boolean | "no-context" | "err" }[];
  readonly snapshot?: PhysicsDebugSnapshot | null;
  readonly rawSnapshot?: unknown;
}): HudDump {
  const snapshot = input.snapshot ?? null;
  const samples = snapshot?.samples ?? [];
  const lastSample = samples.length > 0 ? samples[samples.length - 1] : null;
  const firstSample = samples.length > 0 ? samples[0] : null;
  const text = normalizeHudText(input.text ?? "");
  return Object.freeze({
    title: input.title ?? "",
    text,
    lines: Object.freeze(text.split("\n").filter(Boolean)),
    canvasCount: input.canvases?.length ?? 0,
    canvases: Object.freeze([...(input.canvases ?? [])]),
    physicsHookPresent: Boolean(input.rawSnapshot ?? snapshot),
    sampleCount: samples.length,
    schedulerTick: snapshot?.metrics.schedulerTick ?? lastSample?.schedulerTick ?? 0,
    nativeTick: lastSample?.state[0] ?? 0,
    nativeTickSpan:
      firstSample && lastSample ? (lastSample.state[0] ?? 0) - (firstSample.state[0] ?? 0) : 0,
    phase: lastSample?.phase ?? "unknown",
    mode: lastSample?.mode ?? "unknown",
    url: input.url,
  });
}
