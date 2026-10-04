# Stability checklist — Rocket Arena (Phase 11)

**What this is for.** The automated half of the hardening story: every guarantee
this port makes about a running kiosk, where it is checked, and the exact command
that re-checks it. Everything here runs in Node, with no browser, no GPU and no
network.

**Who runs it.** Whoever is opening the doors. It takes about 20 seconds.

---

## 0. The one command

```bash
# from the air-jam workspace root
npx --yes pnpm@9.9.0 --filter rocket-arena exec tsc --noEmit
npx --yes pnpm@9.9.0 --filter rocket-arena exec vitest run src/airjam/harden
```

**Pass bar: `tsc` exits 0 with no output, and vitest reports `N passed` with
zero failures.** A non-zero `tsc` is a hard stop — do not open the doors with a
package that does not typecheck, because the invariant layer is the thing that
would have caught the fault you are about to walk into.

---

## 1. The seven invariants

Each one is enforced by a guard in `invariants.ts` that returns a **structured
violation** rather than throwing — a thrown error inside the host frame loop
turns "one car is stuck" into "the arena stopped", in front of a crowd.

Every guard is tested in **pairs**: a healthy observation must produce nothing,
*and* a deliberately broken one must produce the named violation. An invariant
that cannot fail is worse than none, because it reads in a review as though the
guarantee is covered.

| # | Invariant id | What it asserts | The deliberate break in `__tests__/invariants.test.ts` |
|---|---|---|---|
| 1 | `neutral-after-disruption` | After blur / tab-hide / disconnect / teardown, no car is left with non-neutral controls. | Keep `throttle: 1` through a global blur → fires on that slot. Also asserted per-player: a disconnect condemns only its own player. |
| 2 | `vanished-controller-neutral` | A car whose controller has vanished is neutral **on the same tick** — stronger than the required "within one tick". | `controllerPresent: false` with `throttle: 1` and **no event at all** → fires. This is the silent-dropout case. |
| 3 | `one-source-per-slot` | Every bound slot maps to exactly one live source. | (a) a bound slot with `sourceKey: null`; (b) two different sources on one slot. |
| 4 | `no-double-binding` | No source is bound twice; no player drives two cars. | One `sourceKey` on slots 0 and 4; and one `playerId` on slots 0 and 5. |
| 5 | `no-indefinite-hold` | Boost / steer / throttle / air-roll cannot persist without fresh input. | A held boost from a controller that has stopped publishing, for 31 ticks against a 30-tick window. |
| 6 | `arena-cap` | The arena never exceeds `MAX_CARS = 8`, and every slot is addressable. | A 9th car (fires twice: list over cap *and* slot 8 unaddressable); `simCarCount: 12`; slot `8`, `-1`, `1.5`. |
| 7 | `no-double-slot-assign` | Two players never hold the same car slot. | `c1` and `c2` both on slot 2. |

**The window in #5 is 30 ticks = 250 ms at `SIM_HZ = 120`.** It is deliberately
not tighter: the Air Jam input tick is 16 ms, so several 120 Hz reads can
legitimately see the same buffered level, and a guard that trips on that trains
the operator to ignore it.

**One thing #5 must NOT do:** flag a player who is *holding* a button. A live
controller republishes every 16 ms and refreshes the input layer's staleness clock
on every read, so a held level is fresh input no matter how long it goes on. Only
a controller that has gone **silent** is a fault. Both halves are asserted.

---

## 2. The end-to-end match harness

`match-harness.ts` drives a whole match through the **agent contract's own action
names**, with a deterministic fake sim, and runs the invariant gate on **every
tick**. Not a browser test.

`__tests__/match-harness.test.ts` does this with **2 players and with 4 players**,
each walking:

```
lobby → ready → kickoff → countdown → playing → goal → kickoff → countdown → playing → result → rematch
```

and asserts along the way:

- the phase machine is in the donor's own order, with the clock **held at 5:00**
  until the ball is touched (the donor's design, `machine.ts:595-596` — the single
  most mis-diagnosed "the game is frozen" report there is);
- every per-control action reaches the sim (`drive`, `throttle`, `steer`, `jump`,
  `boost`, `powerslide`, `ball_cam`);
- a car **actually moves** and a boost gauge **actually drains** — asserted
  before/after, because a match can advance against a sim that does nothing;
- goals are raised **by the sim** and reach the machine through the donor's own
  `pollGoal()` flag, are **attributed** to a scorer from the native touch serial,
  and hold for exactly `GOAL_TICKS`;
- every donor-facing command the machine emits is actually executed, including
  `final-horn` (which reaches no sim call at all and would be invisible if only
  sim writes were counted);
- the rematch rewinds score, clock, stats and the goal feed but **keeps the roster
  and its slots**;
- **zero invariant violations** across the whole run.

**Pass bar: `monitor.isHealthy()` is true and `violations()` is `[]` after a
complete match.** A match that completes with a violation is a **failed** match.

The harness is also self-defeating-proof: dedicated cases deliberately break the
arena (a 9th car), the bindings (two players on one slot), the controls (a
non-neutral level served through a global blur) and the presence feed (a vanished
controller), and assert the corresponding guard fires. **If those cases pass, a
green full-match run means something.**

---

## 3. The triage table

`triage.ts` maps the words an operator would actually say to the most likely
causes in rank order, the single next step, and a `file:line` citation per cause.

Five symptoms are covered, and each is tested for matching, for a plausible
rank-1 cause (a mechanism, a citation, and a way to confirm it), and for a single
concrete next step:

| Symptom | The rank-1 cause | Test |
|---|---|---|
| clock frozen at the opening value | **NOT A BUG** — the ball has not been touched since kickoff, and the donor holds the clock on purpose | flagged `benign`, so the operator is told this **before** they touch anything |
| a car will not move | the match is not in `playing`, so the sim is never stepped | asserted first; a car in kickoff/countdown/goal is *held*, not broken |
| one car drives alone | the donor only ever writes its own slot and the bot's — every other slot is the port's job | cites `startup.js:723` and `:753` |
| a phone is unresponsive | a sticky `neutralize()` that nothing re-arms — **silent** | next step is the one question to ask on the spot |
| boost drains unattended | a swallowed `pointerup`; the SDK only clears on player *leave* | next step rules out `INFINITE_BOOST` first, because it inverts the evidence |

`diagnose(symptom, violations?)` re-ranks with live invariant violations when you
have them, and **never invents a cause without them**. An unrelated symptom
returns a usable fallback rather than a false match.

---

## 4. Before the doors open

- [ ] `tsc --noEmit` → 0 errors
- [ ] `vitest run src/airjam/harden` → all pass
- [ ] The full suite is green: `vitest run` (other workers' directories included)
- [ ] Boot the donor once and confirm **no** `[rocket-arena/seam]` console error.
      An unpatched sim means phones cannot drive, and the donor's own catch
      handler swallows it — a resolved boot promise does **not** mean the game
      started.
- [ ] Confirm the host window is the FOCUSED window and the tab is visible. A
      kiosk that has lost focus is paused (`startup.js:836-838`) and looks broken.
- [ ] Unplug every gamepad and USB controller from the host machine. A connected
      gamepad wins the donor's arbitration and takes over its own car.
- [ ] Run `REAL-DEVICE-CHECKLIST.md` top to bottom. It covers what **cannot** be
      verified from here, and it is not optional.

---

## 5. While the event runs

The cheapest possible health signal, once the monitor is wired into the host:

```ts
import { createStabilityMonitor, formatViolations, summarizeViolations } from "@/airjam/harden";

const monitor = createStabilityMonitor();
const found = monitor.observe(observation);   // once per host tick
if (found.length > 0) console.warn(formatViolations(found, tick).join("\n"));
console.log(summarizeViolations(monitor.violations()));  // "stable: no invariant violated"
```

- `summary()` printing **`stable: no invariant violated`** is the healthy state.
- Anything else names the invariant, the slot, the offending field values **and
  the one remedy**. A guard that says "invariant violated" costs a debugging
  session; one that says "call `registry.neutralizeAll('blurred')`" costs a glance.

**If a car will not move, check the phase before anything else.** Cars are HELD
during `kickoff`, `countdown` and `goal`. Poking a working game is the mistake
that actually breaks a match.
