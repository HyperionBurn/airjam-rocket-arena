import { _ } from "../core/class-fields.js";
import { Ks } from "../input/controller-selection.js";
import { Vt } from "./icons.js";
import { Yh } from "../settings/schema.js";

const ya = 260;

const bi = 54;

const sB = 6;

const xa = 10;

class GameHud {
  constructor(e, t, n, r, s = () => {}, renderTiming = () => null) {
    _(this, "root");
    this.renderTiming = renderTiming;
    _(this, "profiler");
    _(this, "renderer");
    _(this, "settings");
    _(this, "timer", 0);
    _(
      this,
      "compact",
      window.matchMedia("all"),
    );
    _(this, "summary");
    _(this, "details");
    _(this, "expanded", !1);
    _(this, "onDetailsChange");
    _(this, "padPoll", 0);
    _(this, "padKey", null);
    _(this, "padPrevious", []);
    _(this, "padDirection", 0);
    _(this, "padRepeatAt", 0);
    _(this, "padWaitForNeutral", !0);
    _(this, "pollPad", (e) => {
      if (!this.expanded) {
        this.padPoll = 0;
        return;
      }
      this.padPoll = requestAnimationFrame(this.pollPad);
      const t = Ks(),
        n = t ? JSON.stringify([t.id, t.index]) : null;
      if (n !== this.padKey) {
        ((this.padKey = n),
          (this.padPrevious = ((t == null ? void 0 : t.buttons) ?? []).map(
            (h) => h.pressed,
          )),
          (this.padWaitForNeutral = !0),
          (this.padDirection = 0));
        return;
      }
      if (!t) return;
      const r = (h) => {
          var d;
          return ((d = t.buttons[h]) == null ? void 0 : d.pressed) ?? !1;
        },
        s = (h) => {
          const d = r(h),
            u = d && !this.padPrevious[h];
          return ((this.padPrevious[h] = d), u);
        };
      if (s(1)) {
        this.hideDetails();
        return;
      }
      if (s(0)) {
        document.body.classList.add("pad-nav");
        const h = document.activeElement;
        h instanceof HTMLButtonElement && this.root.contains(h) && h.click();
        return;
      }
      const a = t.axes[1] ?? 0,
        o =
          (r(13) ? 1 : 0) - (r(12) ? 1 : 0) ||
          (Math.abs(a) > 0.55 ? Math.sign(a) : 0);
      if (this.padWaitForNeutral) {
        o === 0 && (this.padWaitForNeutral = !1);
        return;
      }
      if (o === 0) {
        this.padDirection = 0;
        return;
      }
      if (o !== this.padDirection)
        ((this.padDirection = o), (this.padRepeatAt = e + 380));
      else {
        if (e < this.padRepeatAt) return;
        this.padRepeatAt = e + 160;
      }
      document.body.classList.add("pad-nav");
      const A = Array.from(this.root.querySelectorAll("button")).filter(
          (h) => !h.disabled && h.getClientRects().length > 0,
        ),
        c = A.indexOf(document.activeElement) + o;
      c >= 0 && c < A.length
        ? A[c].focus()
        : this.details.scrollBy({ top: o * 70, behavior: "instant" });
    });
    ((this.profiler = t),
      (this.renderer = n),
      (this.settings = r),
      (this.onDetailsChange = s),
      e.insertAdjacentHTML(
        "beforeend",
        `
      <div id="status-overlay" class="status" hidden aria-hidden="true">
        <button id="status-summary" class="status__summary" type="button" hidden
                aria-expanded="false" aria-controls="status-details" aria-label="Show status details">
          <span id="status-summary-metrics" class="status__summary-metrics" data-el="summaryMetrics">
            <span><strong data-el="summaryFps">...</strong> fps</span>
            <span title="Average frame interval; not network ping or measured input-to-display delay"><strong data-el="summaryMs">...</strong> ms frame</span>
          </span>
          <span class="status__summary-label" data-el="summaryLabel" hidden>Status</span>
          <span class="status__summary-arrow" aria-hidden="true">${Vt("arrow-right", 16)}</span>
        </button>
        <div id="status-details" class="status__details">
        <p class="status__empty" data-el="statusEmpty" hidden>No readouts selected. Choose them in Settings.</p>
        <div class="status__section" data-section="frame" hidden>
          <div class="status__hero">
            <span class="status__pair" title="Rendered frames per second. Screen presentation follows the display refresh rate.">
              <span class="status__value" data-el="statFps">—</span>
              <span class="status__unit">fps</span>
            </span>
            <span class="status__pair status__pair--alt">
              <span class="status__value" data-el="statFrame">—</span>
              <span class="status__unit">ms</span>
            </span>
          </div>
          <dl class="status__figures">
            ${[
              ["p50", "statP50"],
              ["p95", "statP95"],
              ["p99", "statP99"],
              ["max", "statWorst"],
            ]
              .map(
                ([a, o]) => `<div><dt>${a}</dt><dd data-el="${o}">—</dd></div>`,
              )
              .join("")}
          </dl>
        </div>

        <div class="status__section" data-section="chart" hidden>
          <svg class="status__chart" viewBox="0 0 ${ya} ${bi}" preserveAspectRatio="none" aria-hidden="true">
            <g class="status__grid" data-el="chartGrid"></g>
            <line class="status__budget" data-el="chartBudget" x1="0" y1="${bi / 2}" x2="${ya}" y2="${bi / 2}" />
            <path class="status__over" data-el="chartOver" d="" />
            <polyline class="status__trace" data-el="chartTrace" points="" />
          </svg>
          <p class="status__caption" data-el="chartCaption">—</p>
        </div>

        <div class="status__section" data-section="phases" hidden>
          <button class="status__toggle" type="button" data-el="phasesToggle"
                  aria-expanded="true" aria-controls="status-phases">
            <span class="status__heading">Time · cpu</span>
            <span class="status__chevron" aria-hidden="true"></span>
          </button>
          <div class="status__rows" id="status-phases" data-el="statPhases"></div>
        </div>

        <div class="status__section" data-section="sim" hidden>
          <p class="status__heading">Simulation</p>
          <div class="status__rows" data-el="statSim"></div>
        </div>

        <div class="status__section" data-section="renderer" hidden>
          <p class="status__heading">Renderer</p>
          <div class="status__rows" data-el="statRenderer"></div>
        </div>
        </div>
      </div>
    `,
      ),
      (this.root = e.querySelector("#status-overlay")),
      (this.summary = this.root.querySelector("#status-summary")),
      (this.details = this.root.querySelector("#status-details")),
      this.summary.addEventListener("click", () => this.toggleDetails()),
      this.root.addEventListener("keydown", (a) => {
        (a.stopPropagation(),
          a.code === "Escape" &&
            this.expanded &&
            (a.preventDefault(), this.hideDetails()));
      }),
      this.compact.addEventListener("change", () => {
        (this.hideDetails(!1),
          this.applyDisclosure(),
          this.settings.enabled && this.draw());
      }),
      this.root
        .querySelector('[data-el="phasesToggle"]')
        .addEventListener("click", () => this.togglePhases()),
      this.applyPhaseCollapse(),
      this.apply(r));
  }
  get isDetailsOpen() {
    return this.expanded;
  }
  showDetails() {
    !this.settings.enabled ||
      !this.compact.matches ||
      this.expanded ||
      ((this.expanded = !0),
      (this.settings.details = true), Yh.save(this.settings),
      this.applyDisclosure(),
      this.onDetailsChange(!0),
      this.summary.focus(),
      this.draw(),
      (this.padKey = null),
      (this.padWaitForNeutral = !0),
      (this.padPoll = requestAnimationFrame(this.pollPad)));
  }
  hideDetails(e = !0) {
    this.expanded &&
      ((this.expanded = !1),
      (this.settings.details = false), Yh.save(this.settings),
      this.padPoll && cancelAnimationFrame(this.padPoll),
      (this.padPoll = 0),
      this.applyDisclosure(),
      this.onDetailsChange(!1),
      e &&
        this.settings.enabled &&
        this.compact.matches &&
        this.summary.focus());
  }
  toggleDetails() {
    this.expanded ? this.hideDetails() : this.showDetails();
  }
  applyDisclosure() {
    const e = this.compact.matches;
    (this.root.classList.toggle("is-compact", e),
      this.root.classList.toggle("is-details-open", e && this.expanded),
      (this.summary.hidden = !e),
      this.summary.setAttribute("aria-expanded", String(this.expanded)),
      this.summary.setAttribute(
        "aria-label",
        this.expanded ? "Hide status details" : "Show status details",
      ),
      this.settings.frame
        ? this.summary.setAttribute(
            "aria-describedby",
            "status-summary-metrics",
          )
        : this.summary.removeAttribute("aria-describedby"),
      (this.details.hidden = e && !this.expanded),
      (this.root.querySelector('[data-el="summaryMetrics"]').hidden =
        !this.settings.frame),
      (this.root.querySelector('[data-el="summaryLabel"]').hidden =
        this.settings.frame));
    const t =
      this.settings.frame ||
      this.settings.chart ||
      this.settings.phases ||
      this.settings.sim ||
      this.settings.renderer;
    this.root.querySelector('[data-el="statusEmpty"]').hidden = t || !e;
  }
  togglePhases() {
    ((this.settings.phasesCollapsed = !this.settings.phasesCollapsed),
      Yh.save(this.settings),
      this.applyPhaseCollapse(),
      this.settings.phasesCollapsed || this.draw());
  }
  applyPhaseCollapse() {
    const e = this.settings.phasesCollapsed,
      t = this.root.querySelector('[data-el="phasesToggle"]'),
      n = this.root.querySelector('[data-el="statPhases"]');
    (t == null || t.setAttribute("aria-expanded", String(!e)),
      n && (n.hidden = e),
      this.root.classList.toggle("is-phases-collapsed", e));
  }
  apply(e) {
    this.settings = e;
    const t = e.enabled;
    if (t && e.details && !this.expanded) this.showDetails();
    else if (!e.details && this.expanded) this.hideDetails(false);
    ((this.root.hidden = !t),
      this.root.setAttribute("aria-hidden", String(!t)),
      t || this.hideDetails(!1));
    for (const n of this.root.querySelectorAll("[data-section]")) {
      const r = n.dataset.section;
      n.hidden = !e[r];
    }
    (this.applyDisclosure(),
      this.applyPhaseCollapse(),
      t ? this.start() : this.stop(),
      t && this.draw());
  }
  start() {
    this.timer ||
      (this.draw(),
      (this.timer = window.setInterval(() => this.draw(), 1e3 / sB)));
  }
  stop() {
    (this.timer && window.clearInterval(this.timer), (this.timer = 0));
  }
  set(e, t) {
    const n = this.root.querySelector(`[data-el="${e}"]`);
    n && n.textContent !== t && (n.textContent = t);
  }
  rows(e, t) {
    const n = this.root.querySelector(`[data-el="${e}"]`);
    n &&
      (n.innerHTML = t
        .map(
          ([r, s, a]) => `
      <div class="status__row${a ? " is-warn" : ""}">
        <span>${r}</span><span class="status__figure">${s}</span>
      </div>
    `,
        )
        .join(""));
  }
  draw() {
    var n;
    const e = this.profiler.snapshot(ya / 2, xa);
    if (e.count === 0) return;
    const t = this.settings;
    const gpu = this.renderTiming();
    if (
      (t.frame &&
        (this.set("summaryFps", e.frame.fps.toFixed(0)),
        this.set("summaryMs", e.frame.avgMs.toFixed(1))),
      !(this.compact.matches && !this.expanded))
    ) {
      if (
        (t.frame &&
          (this.set("statFps", e.frame.fps.toFixed(0)),
          this.set("statFrame", e.frame.avgMs.toFixed(2)),
          this.set("statP50", e.frame.p50.toFixed(2)),
          this.set("statP95", e.frame.p95.toFixed(2)),
          this.set("statP99", e.frame.p99.toFixed(2)),
          this.set("statWorst", e.frame.worstMs.toFixed(1))),
        t.chart && this.drawChart(e),
        t.phases &&
          !t.phasesCollapsed &&
          this.rows("statPhases", [
            ...e.phases
              .filter((r) => r.phase !== "other" || r.avgMs >= 0.02)
              .map((r) => [r.phase, `${r.avgMs.toFixed(2)} ms`]),
            ["cpu total", `${e.cpu.avgMs.toFixed(2)} ms`],
            ...(gpu ? [["GPU scene + post", !gpu.supported ? "unavailable" : gpu.milliseconds === null ? "sampling…" : `${gpu.milliseconds.toFixed(2)} ms`]] : []),
          ]),
        t.sim)
      ) {
        const {
          ticksPerFrame: r,
          droppedTicks: s,
          clampedFrames: a,
          stalls: o,
        } = e.sim;
        this.rows("statSim", [
          ["ticks / frame", r.toFixed(2)],
          ["sim rate", `${Math.round(r * e.frame.fps)} / 120 Hz`],
          ["dropped", s === 0 ? "none" : `${s} · ${a}f`, s > 0],
          ["stalls", o === 0 ? "none" : String(o), o > 0],
        ]);
      }
      if (t.renderer) {
        const r = this.renderer.info;
        this.rows("statRenderer", [
          ["resolution", `${this.renderer.domElement.width} × ${this.renderer.domElement.height}`],
          ["render scale", `${Math.round(this.renderer.getPixelRatio() * 100)}%`],
          ["draw calls", String(r.render.calls)],
          ["triangles", r.render.triangles.toLocaleString("en")],
          ["geometries", String(r.memory.geometries)],
          ["textures", String(r.memory.textures)],
          [
            "programs",
            String(((n = r.programs) == null ? void 0 : n.length) ?? 0),
          ],
        ]);
      }
    }
  }
  drawChart(e) {
    const t = this.root.querySelector('[data-el="chartTrace"]'),
      n = this.root.querySelector('[data-el="chartBudget"]'),
      r = this.root.querySelector('[data-el="chartOver"]');
    if (!t || !n || !r) return;
    const s = e.history,
      a = s.length;
    if (a === 0) return;
    let o = e.budgetMs * 2;
    for (; o < e.frame.worstMs && o < e.budgetMs * 16; ) o += e.budgetMs;
    const A = (p) => (p / Math.max(1, a - 1)) * ya,
      l = (p) => bi - Math.min(1, p / o) * bi,
      c = [],
      h = [];
    for (let p = 0; p < a; p += 1) {
      const v = A(p).toFixed(1),
        g = l(s[p]).toFixed(1);
      (c.push(`${v},${g}`),
        s[p] > e.budgetMs * 1.02 && h.push(`M ${v} ${bi} L ${v} ${g}`));
    }
    (t.setAttribute("points", c.join(" ")), r.setAttribute("d", h.join(" ")));
    const d = l(e.budgetMs).toFixed(1);
    (n.setAttribute("y1", d), n.setAttribute("y2", d));
    const u = this.root.querySelector('[data-el="chartGrid"]');
    (u &&
      u.childElementCount !== xa - 1 &&
      (u.innerHTML = Array.from({ length: xa - 1 }, (p, v) => {
        const g = ((v + 1) / xa) * ya;
        return `<line x1="${g}" y1="0" x2="${g}" y2="${bi}" />`;
      }).join("")),
      this.set(
        "chartCaption",
        `${xa}s · ${e.budgetMs.toFixed(1)} ms at ~${e.refreshHz} Hz display · ${e.overBudgetPct.toFixed(0)}% over · peak ${o.toFixed(0)} ms`,
      ));
  }
}

export { GameHud };
