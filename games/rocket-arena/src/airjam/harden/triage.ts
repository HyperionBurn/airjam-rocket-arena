/**
 * Phase 11 — failure-mode triage.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS FILE EXISTS
 *
 * The three dominant failure modes of this product at a live event are a stuck
 * input, a disconnect, and a frozen-looking arena. All three are fatal in front
 * of a crowd, and all three are ambiguous: the symptom alone does not identify
 * the cause, and the wrong guess costs more time than reading this table.
 *
 * So: given the words a person would actually say out loud, hand back the most
 * likely causes IN RANK ORDER, the single next diagnostic step, and the code
 * fact behind each cause with a file:line citation. The citations were read out
 * of the read-only donor and out of the port's own modules; none of them are
 * from memory.
 *
 * The most valuable entry is the FIRST one, and it is the one everybody gets
 * wrong: the clock sitting at 5:00 is the DONOR'S OWN DESIGN, not a bug. Rocket
 * Arena holds the clock until the ball has moved since kickoff
 * (`match/session.js:70`, kept at `machine.ts:596`). At an event, half of all
 * "the game is frozen" reports are this, and the operator's first instinct —
 * to poke the game — is what turns a normal countdown into an actual fault.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS IS NOT
 *
 * It is not a monitor and it does not replace one. It takes an optional set of
 * `StabilityViolation`s and uses them to RE-RANK the candidates, which is the
 * only thing live evidence can honestly do: it can demote a candidate, it
 * cannot invent one. When no violations are supplied the ranking is the static
 * order below, which is the order of probability as read from the code.
 */

import type { InvariantId, StabilityViolation } from "./invariants.js";

/* -------------------------------------------------------------------------- */
/* The vocabulary                                                               */
/* -------------------------------------------------------------------------- */

export type TriageSymptomId =
  | "clock-frozen-at-opening-value"
  | "car-will-not-move"
  | "one-car-drives-alone"
  | "phone-unresponsive"
  | "boost-drains-unattended";

/** One candidate cause, with the code fact that makes it plausible. */
export interface TriageCause {
  /** 1 = most likely. Ties are resolved by the declared order. */
  readonly rank: number;
  readonly cause: string;
  /** What in the code makes this possible. Stated so it can be checked. */
  readonly evidence: string;
  /** Where that fact lives. Always `file:line`. */
  readonly source: string;
  /** The observable that confirms or kills this candidate. */
  readonly check: string;
}

export interface TriageEntry {
  readonly id: TriageSymptomId;
  readonly title: string;
  /**
   * Lowercase phrases that select this entry. Matched as substrings, so
   * "clock frozen" and "frozen clock" both hit.
   */
  readonly keywords: readonly string[];
  readonly causes: readonly TriageCause[];
  /** THE next step. One action, not a checklist. */
  readonly nextStep: string;
  /**
   * Invariant ids whose violations corroborate this entry. Used for re-ranking
   * when live evidence is available; never used to invent a cause.
   */
  readonly confirmedBy: readonly InvariantId[];
  /**
   * True when the symptom is EXPECTED, CORRECT BEHAVIOUR. The operator must be
   * told this before they touch anything, because "fixing" it is the mistake
   * that actually breaks a match.
   */
  readonly benign?: boolean;
}

/* -------------------------------------------------------------------------- */
/* The table                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Typed constructor for `confirmedBy`.
 *
 * `Object.freeze(["no-indefinite-hold"])` infers `readonly string[]`, which is
 * NOT assignable to `readonly InvariantId[]` — so an id typo in this table would
 * be a silent `any` at the call site rather than a compile error. Routing the
 * literals through a parameterised helper is what turns them back into
 * `InvariantId`s and makes the check real.
 */
const confirmed = (...ids: InvariantId[]): readonly InvariantId[] => Object.freeze(ids);

export const TRIAGE_ENTRIES: readonly TriageEntry[] = Object.freeze([
  /* ---------------------------------------------------------------------- */
  Object.freeze({
    id: "clock-frozen-at-opening-value",
    title: "The clock is stuck on its opening value (5:00) and the arena is not moving",
    keywords: Object.freeze([
      "clock",
      "frozen",
      "stuck at 5:00",
      "stuck at the opening",
      "nothing is happening",
      "not moving",
      "frozen arena",
      "game is frozen",
      "screen frozen",
      "arena frozen",
    ]),
    benign: true,
    causes: Object.freeze([
      Object.freeze({
        rank: 1,
        cause: "NOT A BUG — the ball has not been touched since kickoff, and the donor deliberately holds the clock until it is.",
        evidence:
          "The clock only advances when `clock.started || input.kickoffTouched`, and `started` is sticky once the first touch lands (machine.ts:595-596, donor session.js:70). `reduceKickoff` also clears `started` on every kickoff (machine.ts:353), so the hold RESUMES after every goal.",
        source: "match/machine.ts:595-596, :353",
        check: "Read the agent snapshot: `clock.started === false` means this. If it is false, stop — the game is correct.",
      }),
      Object.freeze({
        rank: 2,
        cause: "The host window lost focus or the tab was hidden, which pauses the entire match.",
        evidence:
          "`a.state.paused = !online?.active && a.state.mode === \"match\" && (ne || J.size > 0 || document.hidden || !document.hasFocus() || p)`, and a paused match only calls `s.sync(W)` — the simulation is never stepped.",
        source: "donor/app/startup.js:836-838, :840",
        check: "In the console: `document.hidden` and `document.hasFocus()`. A kiosk whose screensaver or a notification stole focus reports `hasFocus() === false` here.",
      }),
      Object.freeze({
        rank: 3,
        cause: "A key is physically held down on the host keyboard.",
        evidence:
          "`J` is the Set of held keys (`J = new Set()`, startup.js:310) and `J.size > 0` is one of the five pause terms (startup.js:838). `J.size === 0` is also required for the `game-playing` CSS class, so a stuck key changes the cursor and the hint text too (startup.js:343-344).",
        source: "donor/app/startup.js:310, :343-344",
        check: "The hint line under the arena says \"Click field to play\" or shows a binding key. Tap the host keyboard, or press and release each key.",
      }),
      Object.freeze({
        rank: 4,
        cause: "\"Click field to play\" mode is latched — the donor is waiting for a click and refuses to play until it gets one.",
        evidence:
          "`ne` is set by a pointerdown landing on `#settings-button, #car-button, #match-button` (startup.js:444-446) and by Escape (startup.js:542-545, which also toggles the pause menu). Both feed the pause expression, and `ne` is only cleared by a real click or a gamepad event (startup.js:328, :451).",
        source: "donor/app/startup.js:444-446, :542-545, :836-838",
        check: "The cursor hint reads \"Click field to play\". One click on the canvas clears it. An Escape that reached the host is the usual cause and it is invisible to the crowd.",
      }),
      Object.freeze({
        rank: 5,
        cause: "The bot/opponent inference rejected and the donor paused the whole match on purpose.",
        evidence:
          "`o.decide(n.state, Le, no, t.botTeam)` is awaited; its `.catch` sets `p = !0`, sets `a.state.paused = !0`, and calls `pe.showError(...)` with either the error message or the literal \"The opponent stopped responding.\".",
        source: "donor/app/startup.js:730-744",
        check: "An error toast is on screen. `p` is only cleared by re-entering a match (startup.js:511, :522), so the match stays paused until the host restarts it.",
      }),
      Object.freeze({
        rank: 6,
        cause: "The donor's own HOME or PAUSE overlay is up, short-circuiting the frame before the arena is drawn.",
        evidence:
          "`if (home?.visible && !online?.active) { ...; return false; }` and the same for `pauseMenu?.isOpen` both return from the frame callback BEFORE `renderGame`, so the last rendered image simply stays on screen with no error anywhere.",
        source: "donor/app/startup.js:807-817",
        check: "Is there a menu overlay on top of the arena? Esc or the match button dismisses it.",
      }),
      Object.freeze({
        rank: 7,
        cause: "The frame loop is alive but the world runs slow, because the donor clamps every frame delta to 0.1 s.",
        evidence:
          "`const fe = Math.min((W - ze) / 1e3, 0.1)` — a stall longer than 100 ms advances the world by 100 ms, so a badly overloaded machine looks like a slow game rather than a crashed one.",
        source: "donor/app/startup.js:833",
        check: "Watch the clock over 10 s of wall time. If it lost time, the machine is CPU-bound: drop the preset and the shadow count (see the stability checklist).",
      }),
    ]),
    nextStep:
      "Read `clock.started` from the agent snapshot first. If it is false, NOTHING IS WRONG — the ball has not been touched since kickoff and the donor is holding the clock on purpose. Only if it is true, work down the ranks above.",
    confirmedBy: confirmed(),
  }),

  /* ---------------------------------------------------------------------- */
  Object.freeze({
    id: "car-will-not-move",
    title: "One car responds to input and the others never move at all",
    keywords: Object.freeze([
      "will not move",
      "won't move",
      "not moving",
      "car stuck",
      "car is stuck",
      "car frozen",
      "dead car",
      "no response from the car",
      "car does not respond",
      "not driving",
    ]),
    causes: Object.freeze([
      Object.freeze({
        rank: 1,
        cause: "The match is not in `playing`, so the simulation is never stepped at all.",
        evidence:
          "The donor's step function returns false unless `a.state.phase === \"playing\"`, and it is called only on the else-branch of the frame (startup.js:748, :769). During kickoff, countdown and goal the cars are held at their spawns by design.",
        source: "donor/app/startup.js:746-753, :769",
        check: "Read `phase` from the match snapshot. `kickoff`, `countdown` and `goal` all hold the cars still, and the HUD label (`GET READY`, `3`, `2`, `1`, `GO`, `GOAL`) tells the crowd which one it is.",
      }),
      Object.freeze({
        rank: 2,
        cause: "The sim seam was never installed, so nothing this port writes reaches the WASM heap.",
        evidence:
          "`installSimSeam` returns `false` and `console.error`s when `PhysicsSimulation.prototype.setControls` is missing, and the caller is required to treat that as a hard failure. The donor then writes only its OWN slot and leaves every other slot holding whatever was last in the control buffer.",
        source: "airjam/seam.ts:317-334, :345-352",
        check: "Look for the seam's console error at boot. `isSimSeamInstalled()` is exported for exactly this.",
      }),
      Object.freeze({
        rank: 3,
        cause: "The host's own input arbitration gave the donor's car to a different device, and it wrote that to the donor's slot only.",
        evidence:
          "`const Pn = R.active() ? \"gamepad\" : D.active() ? \"touch\" : \"keyboard\"; const on = Pn === \"gamepad\" ? Rn : Pn === \"touch\" ? zn : Sr; n.setControls(r, on)` — exactly ONE winner, written to exactly ONE slot `r`. A connected gamepad also hides the donor's touch input entirely (startup.js:451).",
        source: "donor/app/startup.js:712-713, :723, :451",
        check: "Is a gamepad or USB controller attached to the host machine? Unplug everything and the donor's own car starts obeying the keyboard again.",
      }),
      Object.freeze({
        rank: 4,
        cause: "The phone's source is reporting NOT live, so the host is correctly writing NEUTRAL for it.",
        evidence:
          "`pushControls` writes `live.source.isLive() ? sanitizeControls(live.source.read()) : NEUTRAL_CONTROLS`, and `isLive()` is false when the source is stickily neutralized, the player is absent, the slot is unassigned, the document is hidden, or no payload has arrived for `staleAfterMs` (default 1000 ms). A car that is live-but-idle and a car that is dead look IDENTICAL from the arena.",
        source: "airjam/slots/index.ts:293-305, airjam/input/airjam-input-source.ts:293-309, :167",
        check: "Watch the phone's own screen. If its stick does not move, the payload is not arriving. If it moves but the car does not, the write is not landing.",
      }),
      Object.freeze({
        rank: 5,
        cause: "A sticky neutralize was latched and nobody re-armed the source.",
        evidence:
          "`neutralize(reason)` sets `stickyReason`, which `read()` short-circuits on forever. It is only cleared by `rearm()`, and NOTHING calls `rearm()` automatically — that is deliberate, and it means a source neutralized by a blur, a tab-hide or a presence loss stays dead for the rest of the match.",
        source: "airjam/input/airjam-input-source.ts:272-281, :312-314, :359",
        check: "Was the phone backgrounded, rotated, or did it drop Wi-Fi mid-match? Any of those latch it. The reconnect path must call `rearm()`.",
      }),
      Object.freeze({
        rank: 6,
        cause: "The BOT car is holding its last action, which is normal and brief.",
        evidence:
          "`else if (c === 0) Ie(); ... if (!W && c > 0) c--;` — while an inference is in flight the donor deliberately holds the previous action, and during kickoff `getKickoffControls` overrides it entirely.",
        source: "donor/app/startup.js:749-754",
        check: "Is the car in question the bot's? If so, a few frozen frames are the design. A human car that is frozen for seconds is not.",
      }),
      Object.freeze({
        rank: 7,
        cause: "The roster entry and the registry disagree about which slot this player owns.",
        evidence:
          "The match state carries a `slot` per player and the registry carries its own mapping, and the simulation is addressed by integer slot only. If they drift, the host writes a car that belongs to somebody else.",
        source: "airjam/seam.ts:36-37, match/types.ts:69-70",
        check: "Run the `no-double-slot-assign` and `one-source-per-slot` guards. Either firing means exactly this.",
      }),
    ]),
    nextStep:
      "Establish the phase before anything else: a car in `kickoff`, `countdown` or `goal` is HELD, not broken. If the phase is `playing` and the car is still dead, check whether the phone's stick is moving on the phone's own screen — that splits rank 4/5 (input never arrived) from ranks 2/3/7 (input arrived and was not written).",
    confirmedBy: confirmed(
      "no-indefinite-hold",
      "vanished-controller-neutral",
      "one-source-per-slot",
      "no-double-slot-assign",
    ),
  }),

  /* ---------------------------------------------------------------------- */
  Object.freeze({
    id: "one-car-drives-alone",
    title: "Only one car responds; the rest of the arena is decorative",
    keywords: Object.freeze([
      "one car drives",
      "only one car",
      "one car moves",
      "only one player",
      "car drives alone",
      "other cars frozen",
      "everyone else is stuck",
      "only the first car",
    ]),
    causes: Object.freeze([
      Object.freeze({
        rank: 1,
        cause: "Only the donor's own slot is being written, because that is all the donor ever writes for itself.",
        evidence:
          "Inside the frame the donor calls `n.setControls(r, on)` for its own car `r` and `n.setControls(no, l)` for the bot `no` — two slots, hardcoded. EVERY other slot is the port's job, and the fan-out is already per-slot in the engine (8 floats at `slot * CONTROL_KEYS`), so nothing about this needs a donor change.",
        source: "donor/app/startup.js:723, :753; airjam/slots/car-slot-registry.ts:12-17",
        check: "Is the one moving car the donor's own keyboard car, or the bot's? Either way the other N-2 cars are unclaimed by the donor.",
      }),
      Object.freeze({
        rank: 2,
        cause: "The seam is installed but the host is not fanning out to the other slots.",
        evidence:
          "`pushControls(registry, sim)` walks `registry.liveSlots()` and writes one `setControls` per controlled slot. A host that calls `setControls` once per frame instead of once per slot produces exactly this symptom, with no error.",
        source: "airjam/slots/index.ts:293-305",
        check: "Count the `setControls` calls per tick. It must be one per CONTROLLED slot, not one per frame.",
      }),
      Object.freeze({
        rank: 3,
        cause: "Every other source is reporting not-live, so the host is writing NEUTRAL to every other slot.",
        evidence:
          "A source is not live when it is stickily neutralized, when the player is absent, when the document is hidden, or when `staleAfterMs` (1000 ms) has elapsed with no payload. Staleness is judged on the state ENTERING a read, precisely so a stale controller cannot vouch for itself by re-serving its last payload.",
        source: "airjam/input/airjam-input-source.ts:293-309, :322-327; airjam/slots/index.ts:300",
        check: "The neutral-on-not-live fork is correct behaviour. The bug is upstream: find out WHY the sources are not live. Check presence, then the 1000 ms staleness clock.",
      }),
      Object.freeze({
        rank: 4,
        cause: "The other players are real, joined, and holding — but their `boost`/axes are `pulse`-shaped and the host is re-reading a stale buffer.",
        evidence:
          "Air Jam booleans default to `pulse` and the donor ABI is purely level-triggered, which is the mismatch the seam's `InputSource` exists to bridge. A source that reports `jump: true` from a held thumb is a different bug entirely (it re-jumps every tick); the queue in `read()` is what prevents that.",
        source: "airjam/seam.ts:30-34, :161-174; airjam/input/airjam-input-source.ts:339-349",
        check: "Ask the other players to move the stick in a big, slow circle. If nothing at all happens, it is ranks 1-3, not this.",
      }),
      Object.freeze({
        rank: 5,
        cause: "The other players were never really in the match — the roster froze before they joined.",
        evidence:
          "The roster is locked in `kickoff`, `countdown`, `playing` and `goal`, and `reduceJoinPlayer` returns the state UNCHANGED in those phases. A phone that scans the QR mid-match is a real player in the lobby and does not exist in the match.",
        source: "match/machine.ts:193-200, :206-211",
        check: "Compare the lobby roster with the match roster. If the counts differ, this is it, and the fix is product-level: show the lobby again.",
      }),
    ]),
    nextStep:
      "Count the controlled slots in the registry and the `setControls` calls per tick. Those two numbers are equal, the fan-out is fine and the fault is upstream (ranks 3-5); they are not, and the fault is the host loop (ranks 1-2).",
    confirmedBy: confirmed(
      "no-double-slot-assign",
      "one-source-per-slot",
      "no-double-binding",
      "vanished-controller-neutral",
    ),
  }),

  /* ---------------------------------------------------------------------- */
  Object.freeze({
    id: "phone-unresponsive",
    title: "One phone is dead: no input, no join, or a car that stopped responding mid-match",
    keywords: Object.freeze([
      "phone",
      "unresponsive",
      "not responding",
      "dead phone",
      "controller not working",
      "nothing happens on the phone",
      "controller is dead",
      "scanned but nothing",
    ]),
    causes: Object.freeze([
      Object.freeze({
        rank: 1,
        cause: "The source was stickily neutralized and never re-armed. This is the number one cause and it is SILENT.",
        evidence:
          "`neutralize()` sets `stickyReason` and `read()` returns NEUTRAL while it is set. Blur, `visibilitychange` and presence loss all fire it (stuck-input-guard.ts:176-186, :207-209), and the ONLY thing that clears it is `rearm()`, which nothing calls automatically by design.",
        source: "airjam/input/airjam-input-source.ts:272-281, :312-314; airjam/input/stuck-input-guard.ts:176-186",
        check: "Did this phone lock, get a call, rotate, or switch apps at any point? Then it is this, and the reconnect path must call `rearm()`.",
      }),
      Object.freeze({
        rank: 2,
        cause: "The controller published nothing at all, and the host correctly refuses to guess.",
        evidence:
          "`if (raw === undefined || raw === null) return NEUTRAL_CONTROLS` — and critically, this path does NOT refresh the staleness clock, so a controller that has never published goes stale and stays gone.",
        source: "airjam/input/airjam-input-source.ts:329-334, :167",
        check: "Does the phone's own controller screen show its inputs moving? If not, the problem is join/network, not the host.",
      }),
      Object.freeze({
        rank: 3,
        cause: "The phone joined the LOBBY but not the MATCH, because the roster was frozen when it scanned.",
        evidence:
          "`ROSTER_LOCKED` is `kickoff`, `countdown`, `playing`, `goal`; `reduceJoinPlayer` is a no-op in all four. The agent contract's own description of `join_player` says so: \"The roster is frozen once a match starts.\"",
        source: "match/machine.ts:193-200, :206-211; contracts/agent.ts:267",
        check: "Count the lobby roster against the match roster. The QR panel must not advertise a join that the machine will silently refuse.",
      }),
      Object.freeze({
        rank: 4,
        cause: "The phone's inputs are arriving but the SIM never sees them, because the write went to a slot this player does not own.",
        evidence:
          "The player kept a slot across a reconnect on purpose, so a returning player is usually in the RIGHT car — but a player who was moved between teams has had their slot REASSIGNED (`reduceSetTeam` recomputes it), and a host writing the pre-move slot is writing somebody else's car.",
        source: "match/machine.ts:239-250; airjam/slots/car-slot-registry.ts:184-207",
        check: "Run `one-source-per-slot` and `no-double-slot-assign`. Ask the player to look at the HUD: is the highlighted car theirs?",
      }),
      Object.freeze({
        rank: 5,
        cause: "Multitouch: the second thumb is not registering as a separate control.",
        evidence:
          "The donor's own touch path composes ONE stick plus separate hold buttons from a single touch surface (`donor/input/touch.js:204-224`, cited by the input layer's header). Two thumbs on the same element resolve to one pointer, and the donor's arbitration collapses to a single winner anyway (`gamepad > touch > keyboard`).",
        source: "airjam/input/airjam-input-source.ts:70-74; donor/app/startup.js:712-713",
        check: "Cannot be settled without a real device. It belongs in the real-device checklist, not in this table.",
      }),
      Object.freeze({
        rank: 6,
        cause: "The phone's browser throttled the Air Jam tick in the background and has not caught up.",
        evidence:
          "The SDK's `useControllerTick` is a plain `setInterval` with no visibility check and no pause on blur — the port's own guard exists because of it. A controller page that was backgrounded comes back with a burst of buffered input or none at all.",
        source: "airjam/input/stuck-input-guard.ts:13-19",
        check: "Ask the player to leave the controller screen and come back. If it recovers, this is it, and the fix is the guard's blur/visibility handling on the CONTROLLER side too.",
      }),
    ]),
    nextStep:
      "Ask one question on the spot — \"did your phone lock, ring, or get a notification during the match?\" A yes makes rank 1 almost certain and the fix is a single `rearm()` on reconnect. A no sends you to the join path (ranks 2-3).",
    confirmedBy: confirmed(
      "vanished-controller-neutral",
      "neutral-after-disruption",
      "no-indefinite-hold",
    ),
  }),

  /* ---------------------------------------------------------------------- */
  Object.freeze({
    id: "boost-drains-unattended",
    title: "Boost is draining and the car is accelerating with nobody touching it",
    keywords: Object.freeze([
      "boost drains",
      "boost draining",
      "boost on its own",
      "driving by itself",
      "car drives itself",
      "stuck accelerating",
      "car accelerates itself",
      "boost stuck",
      "nobody is touching it",
      "driving itself",
    ]),
    causes: Object.freeze([
      Object.freeze({
        rank: 1,
        cause: "A pointer release was swallowed, and the SDK keeps re-serving the last buffered payload forever.",
        evidence:
          "The held `boost` boolean is re-sent every tick because the donor ABI is level-triggered. `boost`/`handbrake` are only cleared by `clearInput`, which happens on PLAYER LEAVE — not on release, not on blur. A dropped `pointercancel` (a phone call, a notification shade) therefore means `boost: true` until the player walks away.",
        source: "airjam/input/stuck-input-guard.ts:4-12, :21-46; airjam/seam.ts:30-34",
        check: "Did this phone lock, ring, or get pulled into another app? That is the release that never arrived.",
      }),
      Object.freeze({
        rank: 2,
        cause: "The release WAS delivered, but the guard's `engaged` pointer policy discarded it because it never saw the matching press.",
        evidence:
          "Under the default `\"engaged\"` policy `shouldReactToRelease` requires the exact `pointerId` to have been seen in `pointerdown` on the HOST window, and a release with no id — or with an id it has not seen — is ignored. A phone that pressed before the guard was installed can stick this way.",
        source: "airjam/input/stuck-input-guard.ts:40-44, :154-163, :196",
        check: "Does it happen on the FIRST match after boot, and then not again? That is the signature of a press the guard never saw.",
      }),
      Object.freeze({
        rank: 3,
        cause: "The match core's own control LATCH is holding boost, with no phone behind it at all.",
        evidence:
          "`setControls` MERGES: `sanitizeControls({ ...cell.controls, ...controls })` and increments `boostHeldTicks` on every call that leaves boost true. The latch is the automation hook, so an agent or a test that set boost once keeps boosting that car until something overwrites every field — and a partial payload does NOT clear it.",
        source: "match/core.ts:234-246",
        check: "Is a headless test or an agent session running? `match/core.ts` is explicitly designed to be driven without a controller.",
      }),
      Object.freeze({
        rank: 4,
        cause: "It is not draining at all — the INFINITE_BOOST mutator is on, and the gauge is simply full.",
        evidence:
          "`applySimConfigToDonor` calls `_physics_setUnlimitedBoost(true)` and swallows a missing entry point rather than throwing, so a mutator can be active with no visible confirmation. Under it, holding boost costs nothing and the gauge never moves.",
        source: "match/sim-bridge.ts:169-208, :177-183",
        check: "Read `mutator.id` from the snapshot. If it is `INFINITE_BOOST`, the gauge is not your evidence — rule this out FIRST, before interpreting any drain rate.",
      }),
      Object.freeze({
        rank: 5,
        cause: "The guard never fired because no DOM event was involved — the input is arriving from the network, not from a pointer.",
        evidence:
          "The guard listens for `pointerdown/up/cancel`, `lostpointercapture`, `touchcancel`, `blur` and `visibilitychange` on the HOST window. An Air Jam payload arriving over the wire from a remote phone produces none of those, so nothing here can catch a stuck value on the remote side.",
        source: "airjam/input/stuck-input-guard.ts:188-196",
        check: "The `no-indefinite-hold` guard exists exactly for this case: it measures how long a non-neutral level has persisted with no fresh input, with no DOM involved. Run it and read the tick count.",
      }),
    ]),
    nextStep:
      "Rule out INFINITE_BOOST first (rank 4) — it inverts the evidence and costs ten seconds. Then run the `no-indefinite-hold` guard on that slot: if it fires, the level is stale and the `NEUTRAL_CONTROLS` write is the fix; if it does not, the level is genuinely fresh and the player really is holding the button.",
    confirmedBy: confirmed("no-indefinite-hold", "vanished-controller-neutral"),
  }),
]);

/* -------------------------------------------------------------------------- */
/* Matching and ranking                                                         */
/* -------------------------------------------------------------------------- */

export interface RankedTriage {
  readonly entry: TriageEntry;
  /** Higher is more likely. Explained by `reasons` — never a black box. */
  readonly score: number;
  /** Why it scored what it scored. Shown to the operator. */
  readonly reasons: readonly string[];
}

export interface TriageDiagnosis {
  /** The symptom as given. */
  readonly symptom: string;
  /** True when at least one entry matched. */
  readonly matched: boolean;
  /** Candidates, best first. */
  readonly ranked: readonly RankedTriage[];
  /** One line naming the single most likely cause and the next step. */
  readonly summary: string;
}

/**
 * How many keywords a phrase hit. Two hits is strong evidence the operator meant
 * this entry; one is a guess. The weights are deliberately lopsided so a single
 * generic word ("frozen") cannot outrank a specific phrase.
 */
const scoreKeywords = (haystack: string, entry: TriageEntry): { score: number; hits: readonly string[] } => {
  const hits = entry.keywords.filter((keyword) => haystack.includes(keyword));
  if (hits.length === 0) return { score: 0, hits };
  const specific = hits.filter((hit) => hit.includes(" ")).length;
  return { score: 1 + hits.length * 0.5 + specific, hits };
};

/**
 * Rank the entries for a symptom, optionally corroborated by live violations.
 *
 * Corroboration adds 3 per matching invariant and nothing else. A violation
 * whose invariant no entry claims is ignored, and an empty violation list is a
 * perfectly normal input — the table stands on its own.
 */
export const diagnose = (
  symptom: string,
  violations: readonly StabilityViolation[] = [],
): TriageDiagnosis => {
  const haystack = ` ${symptom.toLowerCase().replace(/\s+/g, " ").trim()} `;

  const ranked: RankedTriage[] = [];
  for (const entry of TRIAGE_ENTRIES) {
    const { score, hits } = scoreKeywords(haystack, entry);
    if (score === 0) continue;

    const reasons: string[] = [`symptom matched ${hits.length} keyword(s): ${hits.join(", ")}`];

    // A benign entry is a warning, not a diagnosis: tell the operator this is
    // probably correct behaviour BEFORE the ranked causes, because the instinct
    // to poke a working game is what breaks it.
    if (entry.benign) {
      reasons.push("this symptom is often CORRECT behaviour — check the benign cause at rank 1 first");
    }

    const confirmed = new Set(violations.map((violation) => violation.invariant));
    const corroborating = entry.confirmedBy.filter((id) => confirmed.has(id));
    if (corroborating.length > 0) {
      reasons.push(`corroborated by live violation(s): ${corroborating.join(", ")}`);
    }

    ranked.push({
      entry,
      score: score + corroborating.length * 3,
      reasons,
    });
  }

  ranked.sort((a, b) => b.score - a.score);

  if (ranked.length === 0) {
    return {
      symptom,
      matched: false,
      ranked: [],
      summary:
        "No entry matched that wording. Re-state the symptom as one of: the clock stuck at 5:00, " +
        "a car that will not move, only one car driving, one phone unresponsive, or boost draining unattended.",
    };
  }

  const best = ranked[0];
  return {
    symptom,
    matched: true,
    ranked,
    summary: `${best.entry.title} → most likely: ${best.entry.causes[0].cause} Next: ${best.entry.nextStep}`,
  };
};

/** The full report for `symptom`: every ranked candidate with its causes. */
export const formatDiagnosis = (diagnosis: TriageDiagnosis): readonly string[] => {
  if (!diagnosis.matched) return [diagnosis.summary];

  const lines: string[] = [`SYMPTOM: ${diagnosis.symptom}`];
  for (const [index, candidate] of diagnosis.ranked.entries()) {
    const { entry } = candidate;
    lines.push("");
    lines.push(
      `${index + 1}. ${entry.title}${entry.benign ? "  [MAY BE CORRECT BEHAVIOUR]" : ""}  (score ${candidate.score})`,
    );
    for (const reason of candidate.reasons) lines.push(`   · ${reason}`);
    for (const cause of entry.causes) {
      lines.push(`   ${cause.rank}. ${cause.cause}`);
      lines.push(`      evidence : ${cause.evidence}`);
      lines.push(`      source   : ${cause.source}`);
      lines.push(`      check    : ${cause.check}`);
    }
    if (index === 0) {
      lines.push(`   NEXT STEP: ${entry.nextStep}`);
    }
  }
  return lines;
};

/** Look one entry up by id, for a caller that already knows the symptom class. */
export const triageEntry = (id: TriageSymptomId): TriageEntry => {
  const found = TRIAGE_ENTRIES.find((entry) => entry.id === id);
  if (!found) throw new Error(`Unknown triage symptom: ${id}`);
  return found;
};
