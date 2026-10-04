import { _ } from "../core/class-fields.js";
import { Rh } from "../input/bindings.js";
import { Ks } from "../input/controller-selection.js";
import { Vt } from "./icons.js";
import { JA, pl } from "../bots/catalog.js";
import { qM, sm } from "../match/defaults.js";

class MatchMenu {
  constructor(e, t) {
    _(this, "options");
    _(this, "tab");
    _(this, "overlay");
    _(this, "dialog");
    _(this, "hud");
    _(this, "message");
    _(this, "startButton");
    _(this, "resumeButton");
    _(this, "leaveButton");
    _(this, "error");
    _(this, "loading");
    _(this, "legend");
    _(this, "botButtons");
    _(this, "selectedBotId");
    _(this, "view", { ...qM });
    _(this, "openState", !1);
    _(this, "starting", !1);
    _(this, "startAbort", null);
    _(this, "errorMessage", "");
    _(this, "padPoll", 0);
    _(this, "padPrev", []);
    _(this, "padDirection", 0);
    _(this, "padRepeatAt", 0);
    _(this, "padKey", null);
    _(this, "padWaitForNeutral", !1);
    _(this, "closeTimer", 0);
    _(this, "renderKey", "");
    _(this, "onKeyDown", (e) => {
      this.openState &&
        (e.stopImmediatePropagation(),
        this.markKeyboard(),
        e.code === "Escape" || e.code === "KeyM"
          ? (e.preventDefault(), e.repeat || this.hide())
          : e.code === "Tab"
            ? (e.preventDefault(), this.moveFocus(e.shiftKey ? -1 : 1))
            : ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"].includes(
                e.code,
              ) &&
              (e.preventDefault(),
              this.moveFocus(
                e.code === "ArrowDown" || e.code === "ArrowRight" ? 1 : -1,
              )));
    });
    _(this, "pollPad", (e) => {
      if (!this.openState) return;
      this.padPoll = requestAnimationFrame(this.pollPad);
      const t = this.firstPad(),
        n = t ? JSON.stringify([t.id, t.index]) : null;
      if (n !== this.padKey) {
        ((this.padKey = n),
          (this.padPrev = ((t == null ? void 0 : t.buttons) ?? []).map(
            (c) => c.pressed,
          )),
          (this.padDirection = 0),
          (this.padWaitForNeutral = !0),
          this.markKeyboard());
        return;
      }
      if (!t) return;
      const r = t.buttons.map((c) => c.pressed),
        s = r[0] && !this.padPrev[0],
        a = r[1] && !this.padPrev[1];
      if (((this.padPrev = r), a)) {
        this.hide();
        return;
      }
      if (s) {
        (this.markPad(t),
          this.dialog.contains(document.activeElement)
            ? document.activeElement.click()
            : this.focusInitial());
        return;
      }
      const o = t.axes[1] ?? 0,
        A = t.axes[0] ?? 0;
      let l = (r[13] ? 1 : 0) - (r[12] ? 1 : 0);
      if (
        (!l && Math.abs(o) > 0.55 && (l = Math.sign(o)),
        l || (l = (r[15] ? 1 : 0) - (r[14] ? 1 : 0)),
        !l && Math.abs(A) > 0.55 && (l = Math.sign(A)),
        this.padWaitForNeutral)
      ) {
        if (l) return;
        this.padWaitForNeutral = !1;
      }
      if (!l) {
        this.padDirection = 0;
        return;
      }
      if (l !== this.padDirection)
        ((this.padDirection = l), (this.padRepeatAt = e + 380));
      else {
        if (e < this.padRepeatAt) return;
        this.padRepeatAt = e + 110;
      }
      (this.markPad(t), this.moveFocus(l));
    });
    ((this.options = t),
      (this.selectedBotId = t.botId ?? "nexto"),
      e.insertAdjacentHTML(
        "beforeend",
        `
      <button id="match-button" class="match-tab" type="button"
              aria-label="Open play menu" aria-controls="match-dialog" aria-expanded="false"
              title="Play">
        <span class="match-tab__icon" aria-hidden="true">${Vt("play", 30)}</span>
        <span class="match-tab__label">Play<span class="match-tab__mode">1v1 match</span></span>
        <kbd class="match-tab__key" aria-hidden="true">M</kbd>
      </button>

      <section class="match-scoreboard" aria-label="Match score" hidden>
        <div class="match-scoreboard__team match-scoreboard__team--blue">
          <span class="match-scoreboard__name" data-match="blue-name"></span>
          <span class="match-scoreboard__score" data-match="blue-score">0</span>
        </div>
        <div class="match-scoreboard__clock">
          <span class="match-scoreboard__time" data-match="clock">5:00</span>
          <span class="match-scoreboard__period" data-match="period">1v1</span>
        </div>
        <div class="match-scoreboard__team match-scoreboard__team--orange">
          <span class="match-scoreboard__score" data-match="orange-score">0</span>
          <span class="match-scoreboard__name" data-match="orange-name"></span>
        </div>
      </section>

      <div class="match-message" role="status" aria-live="polite" aria-atomic="true" hidden>
        <span class="match-message__eyebrow" data-match="message-eyebrow"></span>
        <strong class="match-message__title" data-match="message-title"></strong>
        <span class="match-message__detail" data-match="message-detail"></span>
      </div>

      <div id="match-overlay" class="match-overlay" hidden inert aria-hidden="true">
        <section id="match-dialog" class="match-panel" role="dialog" aria-modal="true"
                 aria-labelledby="match-title" tabindex="-1">
          <header class="match-panel__head">
            <div>
              <h2 id="match-title">Bots · Offline 1v1</h2>
              <p>Play solo against AI. Choose an opponent, then hit the field.</p>
            </div>
            <button class="match-panel__close" type="button" data-match="close" aria-label="Close play menu">
              ${Vt("x", 24)}
            </button>
          </header>

          <div class="match-panel__body">
            <fieldset class="match-difficulty" aria-describedby="match-difficulty-help">
              <legend>1 · Choose your opponent</legend>
              <div class="match-difficulty__options">
                ${pl
                  .map(
                    (n) => `
                  <button class="match-difficulty__option" type="button" data-bot-id="${n.id}"
                          aria-pressed="false" aria-label="${n.rank}: ${n.name}">
                    <img class="match-difficulty__badge" src="/assets/menu/rank-${n.id}.webp" alt="" width="80" height="80" draggable="false">
                    <span class="match-difficulty__rank">${({seer: "Challenging", necto: "Advanced", nexto: "Expert"})[n.id]}</span>
                    <span class="match-difficulty__name">${n.name}</span><span class="match-difficulty__level">${n.rank === "GC" ? "Grand Champion" : n.rank} level</span><span class="match-difficulty__selected">Selected</span>
                  </button>
                `,
                  )
                  .join("")}
              </div>
              <p id="match-difficulty-help" class="match-difficulty__help" data-match="difficulty-help">Left to right: increasing difficulty. All opponents are AI; ranks are approximate.</p>
            </fieldset>
            <div class="match-panel__section-label"><span>2 · Your matchup</span><span>You vs AI</span></div>
            <div class="match-opponent" data-player-team="${t.playerTeam === 0 ? "blue" : "orange"}">
              <span class="match-opponent__artwork">
                <img src="/assets/menu/you-vs-bot.webp" alt="" width="800" height="400" draggable="false">
                <span class="match-opponent__art-labels"><span>YOU</span><span>VS</span><span>BOT</span></span>
              </span>
              <span class="match-opponent__body">
                <span class="match-opponent__type">Your opponent</span>
                <strong class="match-opponent__name" data-match="bot-name"></strong>
                <span class="match-opponent__description" data-match="bot-description"></span>
              </span>
            </div>

            <dl class="match-rules">
              <div><dt>Format</dt><dd>1 vs 1</dd></div>
              <div><dt>Match time</dt><dd>5 minutes</dd></div>
              <div><dt>Overtime</dt><dd>Next goal wins</dd></div>
            </dl>

            <section class="match-current" data-match="current" aria-label="Current match" hidden>
              <div class="match-panel__section-label"><span data-match="current-label">Match paused</span><span data-match="current-clock">5:00</span></div>
              <div class="match-current__result">
                <span class="match-current__team--blue" data-match="blue-name"></span><strong data-match="current-score">0 — 0</strong><span class="match-current__team--orange" data-match="orange-name"></span>
              </div>
            </section>

            <p class="match-panel__loading" role="status" data-match="loading" hidden>
              <span class="match-panel__loading-mark" aria-hidden="true"></span>
              Preparing your opponent… Close to cancel.
            </p>
            <p class="match-panel__error" role="alert" data-match="error" hidden></p>
          </div>

          <footer class="match-panel__footer">
            <div class="match-panel__actions">
              <button class="match-action match-action--primary" type="button" data-match="resume" hidden>Resume match <span aria-hidden="true">${Vt("play", 24)}</span></button>
              <button class="match-action match-action--primary" type="button" data-match="start">Start match <span aria-hidden="true">${Vt("play", 24)}</span></button>
              <button class="match-action match-action--quiet" type="button" data-match="leave" hidden>Return to free play</button>
            </div>
            <p class="match-panel__shortcut" data-match="legend"><kbd>M</kbd> Play menu <span>·</span> <kbd>Esc</kbd> Close</p>
            <a class="match-panel__credit" data-match="credit" target="_blank" rel="noopener noreferrer"></a>
          </footer>
        </section>
      </div>
    `,
      ),
      (this.tab = e.querySelector("#match-button")),
      (this.overlay = e.querySelector("#match-overlay")),
      (this.dialog = this.overlay.querySelector(".match-panel")),
      (this.hud = e.querySelector(".match-scoreboard")),
      (this.message = e.querySelector(".match-message")),
      (this.startButton = this.element("start")),
      (this.resumeButton = this.element("resume")),
      (this.leaveButton = this.element("leave")),
      (this.error = this.element("error")),
      (this.loading = this.element("loading")),
      (this.legend = this.element("legend")),
      (this.botButtons = Array.from(
        this.overlay.querySelectorAll("[data-bot-id]"),
      )));
    for (const n of this.botButtons)
      n.addEventListener("click", () => {
        var s, a;
        if (this.starting || this.view.mode === "match") return;
        const r = n.dataset.botId;
        r !== this.selectedBotId &&
          ((this.selectedBotId = r),
          (this.errorMessage = ""),
          (a = (s = this.options).onSelectBot) == null || a.call(s, r),
          this.render());
      });
    (this.tab.addEventListener("click", () =>
      this.openState ? this.hide() : this.show(),
    ),
      this.element("close").addEventListener("click", () => this.hide()),
      this.resumeButton.addEventListener("click", () => {
        var n, r;
        ((r = (n = this.options).onResume) == null || r.call(n), this.hide());
      }),
      this.startButton.addEventListener("click", () => {
        this.start();
      }),
      this.leaveButton.addEventListener("click", () => {
        this.starting || (t.onLeave(), (this.errorMessage = ""), this.hide());
      }),
      this.overlay.addEventListener("click", (n) => {
        n.target === this.overlay && this.hide();
      }));
    for (const n of [this.tab, this.overlay])
      for (const r of [
        "pointerdown",
        "pointerup",
        "mousedown",
        "mouseup",
        "click",
        "dblclick",
        "auxclick",
        "touchstart",
        "touchend",
      ])
        n.addEventListener(r, (s) => s.stopPropagation());
    (this.overlay.addEventListener("pointerdown", () => this.markKeyboard()),
      window.addEventListener("keydown", this.onKeyDown, !0),
      document.addEventListener("focusin", (n) => {
        this.openState &&
          !this.dialog.contains(n.target) &&
          this.focusInitial();
      }),
      this.render());
  }
  get isOpen() {
    return this.openState;
  }
  show() {
    var e;
    this.openState ||
      (window.clearTimeout(this.closeTimer),
      (this.openState = !0),
      (this.overlay.hidden = !1),
      (this.overlay.inert = !1),
      this.overlay.setAttribute("aria-hidden", "false"),
      this.tab.setAttribute("aria-expanded", "true"),
      this.options.onOpenChange(!0),
      this.render(),
      requestAnimationFrame(() => {
        this.openState &&
          (this.overlay.classList.add("is-open"), this.focusInitial());
      }),
      (this.padPrev = (
        ((e = this.firstPad()) == null ? void 0 : e.buttons) ?? []
      ).map((t) => t.pressed)),
      (this.padPoll = requestAnimationFrame(this.pollPad)));
  }
  hide() {
    var e;
    this.openState &&
      ((e = this.startAbort) == null || e.abort(),
      (this.startAbort = null),
      (this.starting = !1),
      (this.openState = !1),
      this.markKeyboard(),
      this.overlay.classList.remove("is-open"),
      (this.overlay.inert = !0),
      this.overlay.setAttribute("aria-hidden", "true"),
      this.tab.setAttribute("aria-expanded", "false"),
      cancelAnimationFrame(this.padPoll),
      (this.padPoll = 0),
      (this.padDirection = 0),
      this.options.onOpenChange(!1),
      this.render(),
      this.overlay.contains(document.activeElement) &&
        this.tab.focus({ preventScroll: !0 }),
      (this.closeTimer = window.setTimeout(() => {
        this.openState || (this.overlay.hidden = !0);
      }, 240)));
  }
  update(e) {
    (e.botId && (this.selectedBotId = e.botId),
      (this.view = { ...e }),
      this.render());
  }
  showError(e) {
    ((this.errorMessage = e), (this.starting = !1), this.render(), this.show());
  }
  element(e) {
    return this.overlay.querySelector(`[data-match="${e}"]`);
  }
  setText(e, t, n) {
    const r = e.querySelector(`[data-match="${t}"]`);
    r.textContent !== n && (r.textContent = n);
  }
  async start() {
    var t, n;
    if (this.starting) return;
    const e = new AbortController();
    ((this.startAbort = e),
      (this.starting = !0),
      (this.errorMessage = ""),
      this.render(),
      this.element("close").focus({ preventScroll: !0 }));
    try {
      if ((await this.options.onStart(e.signal), e.signal.aborted)) return;
      ((this.startAbort = null),
        (this.starting = !1),
        this.render(),
        (n = (t = this.options).onResume) == null || n.call(t),
        this.hide());
    } catch (r) {
      if (e.signal.aborted) return;
      ((this.startAbort = null),
        this.showError(
          r instanceof Error
            ? r.message
            : "The opponent could not be prepared. Please try again.",
        ),
        this.startButton.focus({ preventScroll: !0 }));
    }
  }
  render() {
    var d;
    const e = this.view,
      t = JA(this.selectedBotId),
      n = this.options.playerTeam,
      r = [
        e.mode,
        e.phase,
        e.blueScore,
        e.orangeScore,
        Math.ceil(e.remainingSeconds),
        e.overtime,
        Math.floor(e.overtimeSeconds),
        Math.ceil(e.countdown),
        e.winner,
        e.scorer,
        e.paused,
        this.openState,
        this.starting,
        this.errorMessage,
        n,
        this.selectedBotId,
      ].join("|");
    if (r === this.renderKey) return;
    this.renderKey = r;
    const s = e.mode === "match",
      a = s && e.phase === "ended";
    for (const u of this.botButtons)
      ((u.disabled = s || this.starting),
        u.setAttribute(
          "aria-pressed",
          String(u.dataset.botId === this.selectedBotId),
        ));
    (this.setText(this.overlay, "bot-name", t.name),
      this.setText(this.overlay, "bot-description", t.description),
      this.setText(
        this.overlay,
        "difficulty-help",
        s
          ? "Return to free play to change difficulty."
          : "Left to right: increasing difficulty. All opponents are AI; ranks are approximate.",
      ));
    const o = this.element("credit");
    ((o.href = t.noticeUrl),
      (o.textContent = t.credit),
      (this.overlay.querySelector(".match-opponent").dataset.playerTeam =
        n === 0 ? "blue" : "orange"));
    const A = e.overtime
        ? `+${sm(e.overtimeSeconds, !1)}`
        : sm(e.remainingSeconds, !0),
      l = n === 0 ? "You" : t.name,
      c = n === 1 ? "You" : t.name;
    ((this.hud.hidden = !s),
      this.setText(this.hud, "blue-name", l),
      this.setText(this.hud, "orange-name", c),
      this.setText(this.hud, "blue-score", String(e.blueScore)),
      this.setText(this.hud, "orange-score", String(e.orangeScore)),
      this.setText(this.hud, "clock", A),
      this.setText(
        this.hud,
        "period",
        a
          ? "Final"
          : e.paused || this.openState
            ? "Paused"
            : e.overtime
              ? "Overtime"
              : "1v1",
      ),
      this.hud.classList.toggle("is-overtime", e.overtime),
      this.hud.setAttribute(
        "aria-label",
        `${l} ${e.blueScore}, ${c} ${e.orangeScore}. ${e.overtime ? "Overtime " : ""}${A}`,
      ),
      (this.element("current").hidden = !s),
      this.setText(this.overlay, "blue-name", l),
      this.setText(this.overlay, "orange-name", c),
      this.setText(this.overlay, "current-clock", A),
      this.setText(
        this.overlay,
        "current-score",
        `${e.blueScore} — ${e.orangeScore}`,
      ),
      this.setText(
        this.overlay,
        "current-label",
        a ? "Final score" : "Match paused",
      ),
      (this.resumeButton.hidden = !s || a),
      (this.resumeButton.disabled = this.starting),
      (this.leaveButton.hidden = !s),
      (this.leaveButton.disabled = this.starting),
      (this.startButton.disabled = this.starting),
      this.startButton.classList.toggle("match-action--primary", !s || a),
      this.startButton.classList.toggle("match-action--secondary", s && !a));
    const h = this.starting
      ? "Preparing opponent…"
      : this.errorMessage
        ? "Try again"
        : a
          ? "Play again"
          : s
            ? "Restart match"
            : `Start 1v1 vs ${t.name}`;
    (((d = this.startButton.firstChild) == null ? void 0 : d.textContent) !==
      `${h} ` && (this.startButton.firstChild.textContent = `${h} `),
      (this.loading.hidden = !this.starting),
      (this.error.hidden = !this.errorMessage),
      this.error.textContent !== this.errorMessage &&
        (this.error.textContent = this.errorMessage),
      this.dialog.setAttribute("aria-busy", String(this.starting)),
      this.renderMessage());
  }
  renderMessage() {
    const e = this.view,
      t = JA(this.selectedBotId).name,
      n = this.options.playerTeam,
      r = n === 0 ? 1 : 0;
    let s = "",
      a = "",
      o = "",
      A = "";
    (e.mode === "match" &&
      (e.phase === "ended"
        ? ((s = "Full time"),
          (a =
            e.winner === n
              ? "You win"
              : e.winner === r
                ? "You lose"
                : "Match complete"),
          (o = e.winner === r ? `${t} takes the match · Open Play for a rematch` : "Open Play for a rematch"),
          (A = e.winner === 0 ? "blue" : e.winner === 1 ? "orange" : ""))
        : e.paused
          ? ((a = "Paused"), (o = "Ready when you are"))
          : e.phase === "kickoff"
            ? ((s = e.overtime ? "Overtime · Next goal wins" : "Get ready"),
              (a = e.countdown > 0 ? String(Math.ceil(e.countdown)) : "Go!"))
            : e.phase === "goal"
              ? ((s = "Goal"),
                (a =
                  e.scorer === n
                    ? "You scored"
                    : e.scorer === r
                      ? `${t} scored`
                      : "Goal scored"),
                (A = e.scorer === 0 ? "blue" : e.scorer === 1 ? "orange" : ""))
              : !e.overtime &&
                e.remainingSeconds <= 0 &&
                ((a = "Keep it up"),
                (o = "The clock is at zero. The ball is still live."))),
      (this.message.hidden = !a || this.openState),
      (this.message.dataset.team = A),
      (this.message.dataset.kind = e.phase === "ended"
        ? e.winner === n ? "win" : e.winner === r ? "loss" : "result"
        : e.phase === "kickoff" ? "countdown"
        : e.phase === "goal" ? "goal"
        : a === "Keep it up" ? "encouragement" : "status"),
      this.message.classList.toggle(
        "is-countdown",
        e.phase === "kickoff" && !e.paused,
      ),
      this.setText(this.message, "message-eyebrow", s),
      this.setText(this.message, "message-title", a),
      this.setText(this.message, "message-detail", o));
  }
  focusables() {
    return Array.from(
      this.dialog.querySelectorAll(
        'button:not(:disabled), input:not(:disabled), a[href], [tabindex="0"]',
      ),
    ).filter((e) => !e.hidden && e.offsetParent !== null);
  }
  focusInitial() {
    const e = this.resumeButton.hidden ? this.startButton : this.resumeButton;
    (e.disabled ? this.element("close") : e).focus({ preventScroll: !0 });
  }
  moveFocus(e) {
    const t = this.focusables();
    if (!t.length) {
      this.dialog.focus();
      return;
    }
    const n = t.indexOf(document.activeElement),
      r = n < 0 ? (e > 0 ? 0 : t.length - 1) : (n + e + t.length) % t.length;
    (t[r].focus({ preventScroll: !0 }),
      t[r].scrollIntoView({ block: "nearest" }));
  }
  firstPad() {
    return Ks();
  }
  markKeyboard() {
    this.overlay.classList.contains("is-pad-nav") &&
      (this.overlay.classList.remove("is-pad-nav"),
      (this.legend.innerHTML =
        "<kbd>M</kbd> Play menu <span>·</span> <kbd>Esc</kbd> Close"));
  }
  markPad(e) {
    if (this.overlay.classList.contains("is-pad-nav")) return;
    this.overlay.classList.add("is-pad-nav");
    const t = Rh(e.id) === "playstation";
    this.legend.innerHTML = `<kbd>D-pad</kbd> Move <span>·</span> <kbd>${t ? "Cross" : "A"}</kbd> Select <span>·</span> <kbd>${t ? "Circle" : "B"}</kbd> Close`;
  }
}

export { MatchMenu };
