# Real-device checklist — Rocket Arena (Phase 11)

**Read this first.** Everything in `STABILITY-CHECKLIST.md` runs in Node. None of
it touches a real GPU, a real touchscreen, a real Wi-Fi radio or a real audio
context. This file is the honest boundary of the automated work: the things that
**genuinely cannot be verified without hardware**, each with a pass/fail bar you
can check at a table in five minutes.

**Rule for the day.** Anything marked **BLOCKER** must pass before the doors open.
Anything marked **UNKNOWN** is unverified right now — not "probably fine". If you
cannot test it, write it down as untested rather than as working.

---

## 0. The device matrix

Test on **every** model in the "must test" column, not one of each. A kiosk
attracts whatever phones people are actually carrying.

| Priority | Class | Devices |
|---|---|---|
| **BLOCKER** | Small / old | One iPhone SE-class, one budget Android (~2020) |
| **BLOCKER** | Mainstream | One recent iPhone, one recent flagship Android |
| High | Large | One iPhone Pro Max / large Android |
| High | Browser edge | iOS Safari, Chrome Android, and **one** in-app browser (the QR may open in one) |
| Medium | Odd | A foldable/tablet if the venue will have one |

**Record for every device:** model, OS version, browser, and the result of each
test below. Write failures down. A written failure is worth ten remembered ones.

---

## 1. Touch and multitouch — **BLOCKER, entirely unverifiable here**

The donor's own touch path composes **one** stick plus separate hold buttons from
a single touch surface, and its arbitration collapses to a single winner
(`gamepad > touch > keyboard`, `startup.js:712-713`). Two thumbs on one element
resolve to one pointer.

- [ ] **Stick + boost simultaneously.** Drive with the left thumb, hold boost
      with the right. Both must register.
      **Pass: the car accelerates AND boosts at the same time, for 10 s.**
- [ ] **Stick + jump + boost, three contacts.** **Pass: all three respond,
      independently, for 10 s.**
- [ ] **Palm rejection.** Rest a palm on the screen while driving with a thumb.
      **Pass: the car does not jump, spin, or stop.**
- [ ] **Thumb drift off the button.** Drag a thumb off the boost button while
      holding it, then lift. **Pass: boost releases.** If it sticks, this is the
      swallowed-release class — the `engaged` pointer policy only honours a
      release whose `pointerId` it saw pressed on the host window
      (`stuck-input-guard.ts:154-163`).
- [ ] **Two players, one phone is irrelevant — two phones, one host.** No
      cross-talk: moving one phone must not move the other car.
- [ ] **Rapid double-tap on jump.** **Pass: two distinct jumps.** A fast double
      tap can collapse to one press (the SDK latches pulses into a `Set`), which
      is a known, documented limit, not a regression.

## 2. Orientation change — **BLOCKER, entirely unverifiable here**

A rotation fires `visibilitychange` on some platforms, and the guard's response
is a **sticky** `neutralize()` that only `rearm()` clears. Nothing re-arms
automatically, by design. A player who rotates once and is never re-armed is dead
for the rest of the match, silently.

- [ ] Rotate portrait → landscape mid-match. **Pass: the car still responds
      within 2 s without a page reload.**
- [ ] Rotate while holding boost. **Pass: boost does not stay held.**
- [ ] Rotate, then leave and re-join. **Pass: the player gets their old car back
      and can drive.**
- [ ] **If any rotation test fails, the fix is `rearm()` on the reconnect path,
      not a workaround.** Confirm the reconnect path calls it.

## 3. Stuck input and the swallowed release — **BLOCKER**

- [ ] Start boosting, then **lock the phone**. **Pass: within 1 s the car stops
      boosting.** This is the single most expensive bug in the product.
- [ ] Same with a **phone call** and a **notification shade swipe**.
- [ ] Background the phone (home button / app switch) mid-boost. **Pass: stops.**
- [ ] Play with the phone in a **pocket / against a table**, which generates
      spurious pointer events. **Pass: no runaway car.**
- [ ] Leave the match while boosting. **Pass: the car is neutral immediately.**
- [ ] Watch the `no-indefinite-hold` guard on the host console during a normal
      5-minute match. **Pass: it never fires.** If it fires while people are
      playing, the input path is broken, not the game.

## 4. Disconnect and reconnect — **BLOCKER**

- [ ] Turn Wi-Fi off mid-match. **Pass: the car goes neutral within ~1 s** (not
      "when the socket finally notices"). The input layer's own staleness window
      is **1000 ms**, so this is the number to expect.
- [ ] Turn Wi-Fi back on. **Pass: the player rejoins into the SAME car** — the
      slot is retained on purpose, and re-assigning would swap which goal they
      are attacking.
- [ ] Run the guards on the host after a reconnect. **Pass: zero violations of
      `no-double-binding`, `one-source-per-slot` and `no-double-slot-assign`.**
- [ ] Have the player walk away and a new player take their phone. **Pass: the
      new player gets a free car and the old car is not still being driven.**

## 5. QR join latency — **BLOCKER, entirely unverifiable here**

Nobody technical is present. A person walks up, scans, and must be playing within
a minute or the interaction has already failed.

- [ ] Time scan → car moving, on each device, on the venue's real Wi-Fi.
      **Pass bar: under 20 s at p50 and under 45 s at p95.**
- [ ] Time it on **crowded venue Wi-Fi** specifically, not on office Wi-Fi.
      **Pass: still under 45 s at p95.** This is the number that will fail if
      anything does.
- [ ] Scan **during a live match**. **Pass: the lobby is shown again, or the
      player is told to wait — and the join is NOT silently refused.** The roster
      is frozen once the match starts (`machine.ts:193-200`); a scan that appears
      to work and then does nothing is the worst possible outcome.
- [ ] Scan with the phone's camera app, **not** a QR scanner app. **Pass: it
      opens the right URL.**
- [ ] Scan twice. **Pass: one session, not two.**

## 6. Audio unlock — **HIGH, entirely unverifiable here**

Every mobile browser suspends audio until a user gesture. A kiosk has none.

- [ ] First interaction: is there **any** sound without a prior tap? **Pass: yes,
      or the UI tells the player to tap once.** A silent game reads as a broken
      game.
- [ ] Check the **countdown and the final horn** are audible. **Pass: both.**
- [ ] Confirm the audio context is not re-created per match (a leak that shows up
      as a mute after 3 or 4 matches). **Pass: audio still works in match 5.**

## 7. Haptics — **HIGH, entirely unverifiable here**

A haptics tick on a goal is the difference between a game and a screen.

- [ ] On a device **with** haptics, does a goal buzz? **Pass: yes, once, not
      continuously.**
- [ ] On a device **without** haptics (and with the OS-level setting off), is
      anything thrown? **Pass: no error, silent.**
- [ ] iOS Safari requires a user gesture for `navigator.vibrate`. **Pass: no
      unhandled rejection in the console.**

## 8. A real GPU — **BLOCKER, entirely unverifiable here**

Node has no GPU. The donor clamps every frame delta to 0.1 s
(`startup.js:833`), so an overloaded machine does not crash — it goes **slow**,
which is much harder to notice in a crowd.

- [ ] On the host machine, with 4 viewports live: **Pass: 60 fps sustained for a
      full 5-minute match**, with no drop below 50.
- [ ] Check the frame-time readout. **Pass: p99 frame time under 20 ms.**
- [ ] Watch the clock against a phone's stopwatch for 60 s. **Pass: it loses no
      measurable time.** A clock that drifts is the honest signal of a CPU-bound
      machine; the clamped delta hides it as "just a bit slow".
- [ ] Deliberately overload the host (4 viewports + shadows + a video playing).
      **Pass: the preset governor drops quality and the match stays playable**
      rather than the arena freezing.
- [ ] **Confirm the host is NOT battery-throttling.** A laptop on AC, or a
      plugged-in kiosk. A throttled laptop looks exactly like a weak GPU.
- [ ] Check the WebGL renderer string is what you expect for the venue hardware.
      **Pass: not SwiftShader / software rendering.** Software rendering will not
      hold 60 fps with 4 viewports and must be caught before the doors open.

## 9. Weak Wi-Fi — **BLOCKER, entirely unverifiable here**

- [ ] Venue Wi-Fi, 4 players live, full match. **Pass: no player drops.**
- [ ] Deliberately degrade the host's connection (walk to the edge of range, or
      put the AP far away). **Pass: cars neutral within ~1 s, the match
      continues, and reconnection restores the same cars.**
- [ ] Watch the host console for a **reconnect storm** when the AP comes back.
      **Pass: no storm.** Many phones reconnecting at once is a real event-mode
      failure and it is not testable in an office.

---

## 10. What is verified without devices, and what is not

### Verified here (Node, no hardware) — the automated layer

- All seven invariants, each proven to fail on a deliberate break.
- A complete 2-player and 4-player match through the agent contract, with zero
  invariant violations across every tick.
- The whole phase machine in the donor's order, the held clock, goal attribution,
  the goal hold, the final horn and the rematch.
- The triage table's five symptoms, their causes, citations and next steps.
- The match core, the machine and the slot registry's own unit tests.

### NOT verified — genuinely requires hardware (this file)

| Area | Why it cannot be verified here |
|---|---|
| Multitouch, palm rejection, thumb drift | No touch surface exists in Node. Single-pointer arbitration cannot be inferred. |
| Orientation change | `visibilitychange` behaviour is platform-specific; the sticky `neutralize()` consequence cannot be triggered. |
| Real stuck-input / swallowed release | Needs a real pointer event pipeline and a real phone to swallow it. |
| Disconnect timing | The real socket and the real 1000 ms staleness window need a radio. |
| QR join latency | Needs the venue's Wi-Fi, its load, and a real camera. |
| Audio unlock | No audio context in Node; mobile autoplay policy is a browser concern. |
| Haptics | No vibration hardware. |
| Real GPU / frame pacing | No GPU. The 0.1 s delta clamp actively hides overload from a timing test. |
| Weak / crowded Wi-Fi | Needs the venue's radio and a reconnect storm. |
| Thermal throttling | Needs a hot device over time. |
| Portrait vs landscape layout of the host | Needs a real viewport and a real resize. |

**Three more that are not in the list above but are worth naming**, because they
are the ones that have actually cost this project time:

- **A clock stuck at 5:00 is the donor's own design**, not a bug
  (`machine.ts:595-596`). It is flagged `benign` in the triage table precisely so
  nobody "fixes" a working game. This is verified by code reading and by the
  harness, and it needs no device — but it needs to be *known*.
- **The bot holds its last action while an inference is in flight**
  (`startup.js:752-754`). A bot car that freezes for a few frames is the design,
  not a fault.
- **An unpatched sim fails silently**: the donor's own catch handler swallows the
  error, so a resolved boot promise does not mean the game started. The only
  authoritative success signal is `#loading`'s `data-state`
  (`shell/donor-bridge.ts`).
