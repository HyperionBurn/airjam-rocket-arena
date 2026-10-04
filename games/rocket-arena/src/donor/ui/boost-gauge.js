import { _ } from "../core/class-fields.js";
import { Vt } from "./icons.js";
import { Ba, Pi, eB, ri, tB } from "../bots/settings.js";

function um(i) {
  return Pi + (Math.max(0, Math.min(100, i)) / 100) * eB;
}

class BoostGauge {
  constructor(e) {
    _(this, "root");
    _(this, "fill");
    _(this, "mark");
    _(this, "figure");
    _(this, "lastValue", -1);
    _(this, "lastSpendingBoost", !1);
    _(this, "lastUnlimited", null);
    (e.insertAdjacentHTML(
      "beforeend",
      `
      <div class="boost" data-el="boost" role="meter" aria-valuemin="0" aria-valuemax="100"
           aria-valuenow="0" aria-label="Boost">
        <div class="boost__head">
          <p class="boost__label">${Vt("bolt", 18)}Boost</p>
          <p class="boost__figure" data-el="boostFigure">0</p>
        </div>
        <svg class="boost__scale" viewBox="0 0 160 18" aria-hidden="true">
          <line class="boost__track" x1="${Pi}" y1="${ri}" x2="${Ba}" y2="${ri}" />
          ${tB
            .map((t) => {
              const n = um(t),
                r = t === 0 || t === 100;
              return `<line class="boost__tick${r ? " boost__tick--major" : ""}"
                          x1="${n}" y1="${ri}" x2="${n}" y2="${ri - (r ? 8 : 4)}" />`;
            })
            .join("")}
          <line class="boost__fill" data-el="boostFill"
                x1="${Pi}" y1="${ri}" x2="${Pi}" y2="${ri}" />
          <line class="boost__mark" data-el="boostMark"
                x1="${Pi}" y1="${ri - 10}" x2="${Pi}" y2="${ri + 4}" />
        </svg>
      </div>
    `,
    ),
      (this.root = e.querySelector('[data-el="boost"]')),
      (this.fill = this.root.querySelector('[data-el="boostFill"]')),
      (this.mark = this.root.querySelector('[data-el="boostMark"]')),
      (this.figure = this.root.querySelector('[data-el="boostFigure"]')));
  }
  update(e, t, n) {
    const r = Math.round(e);
    if (
      (n !== this.lastUnlimited &&
        ((this.lastUnlimited = n),
        this.root.classList.toggle("is-unlimited", n),
        n
          ? ((this.figure.textContent = "∞"),
            this.root.setAttribute("aria-valuetext", "Unlimited"))
          : (this.root.removeAttribute("aria-valuetext"),
            (this.lastValue = -1))),
      !n && r !== this.lastValue)
    ) {
      this.lastValue = r;
      const a = um(r);
      (this.fill.setAttribute("x2", String(a)),
        this.mark.setAttribute("x1", String(a)),
        this.mark.setAttribute("x2", String(a)),
        (this.figure.textContent = String(r)),
        this.root.setAttribute("aria-valuenow", String(r)));
    } else
      n &&
        this.lastValue !== 100 &&
        ((this.lastValue = 100),
        this.fill.setAttribute("x2", String(Ba)),
        this.mark.setAttribute("x1", String(Ba)),
        this.mark.setAttribute("x2", String(Ba)),
        this.root.setAttribute("aria-valuenow", "100"));
    const s = t && !n;
    s !== this.lastSpendingBoost &&
      ((this.lastSpendingBoost = s),
      this.root.classList.toggle("is-firing", s));
  }
}
