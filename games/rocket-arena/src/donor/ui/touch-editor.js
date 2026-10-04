import { _ } from "../core/class-fields.js";
import { B0, Fh, Hf, La, Lh, M0, Of, Ss, Ud, k0, qd, yA } from "../input/touch-layout.js";

class TouchLayoutEditor {
  constructor(e, t) {
    _(this, "settings", La.load());
    _(this, "draft", null);
    _(this, "selected", "drive");
    _(this, "panel");
    _(this, "preview");
    _(this, "tools");
    _(this, "select");
    _(this, "editButton");
    _(this, "onEditChange");
    _(this, "drag", null);
    ((this.panel = e),
      (this.onEditChange = t),
      (e.innerHTML = `<div class="touch-settings-content">
      <p class="panel-lede">Make the controls fit your hands. Training commands stay one tap away in free play.</p>
      <section class="zone touch-layout-intro">
        <header class="zone__head"><h2 class="zone__label">Your layout</h2></header>
        <p>Move the stick, buttons, and training bar. Resize each control to suit your reach.</p>
        <button class="act act--primary" type="button" data-touch-edit>Edit layout</button>
        <p class="touch-settings-note">Portrait and landscape layouts are saved separately on this device.</p>
      </section>
      <section class="zone">
        <header class="zone__head"><h2 class="zone__label">Extra buttons</h2><p class="zone__note">Add only what you use, then position it in your layout.</p></header>
        ${Ud.map(
          (s) => `<label class="touch-extra" for="touch-extra-${s}">
          <span><strong>${Of[s]}</strong><small>${s === "airRoll" ? "Hold and steer to roll. Does not powerslide." : `Roll ${s === "airRollLeft" ? "left" : "right"} while keeping steering free.`}</small></span>
          <input id="touch-extra-${s}" type="checkbox" data-touch-extra="${s}" />
        </label>`,
        ).join("")}
        <p class="touch-settings-note">Slide still combines powerslide and free air roll.</p>
      </section>
    </div>
    <div class="touch-editor" hidden>
      <div class="touch-controls touch-preview" aria-hidden="true">${B0()}</div>
      <section class="touch-editor-tools" aria-label="Layout adjustments">
        <header><div><h2>Edit touch layout</h2><p data-touch-orientation></p></div>
          <button class="act" type="button" data-touch-collapse aria-expanded="true" aria-controls="touch-editor-adjustments">Hide tools</button></header>
        <div id="touch-editor-adjustments">
          <p class="touch-editor-help">Drag a control, or adjust it below.</p>
          <label class="touch-editor-choice" for="touch-edit-control">Control<select class="pick" id="touch-edit-control"></select></label>
          <div class="touch-editor-ranges">
            ${[
              ["x", "Across", 0, 100],
              ["y", "Down", 0, 100],
              ["size", "Size", 75, 140],
            ]
              .map(
                ([
                  s,
                  a,
                  o,
                  A,
                ]) => `<label for="touch-edit-${s}">${a} <output data-touch-output="${s}"></output>
              <input id="touch-edit-${s}" class="dim__line" type="range" min="${o}" max="${A}" step="1" data-touch-adjust="${s}" /></label>`,
              )
              .join("")}
          </div>
        </div>
        <footer><button class="act" type="button" data-touch-reset>Reset layout</button><button class="act" type="button" data-touch-cancel>Cancel</button><button class="act act--primary" type="button" data-touch-save>Save</button></footer>
        <p class="touch-editor-help" data-touch-layout-status role="status" aria-live="polite"></p>
      </section>
    </div>`),
      (this.preview = e.querySelector(".touch-preview")),
      (this.tools = e.querySelector(".touch-editor-tools")));
    for (const s of ["touchstart", "touchend", "mousedown", "mouseup", "click"])
      this.tools.addEventListener(s, (a) => a.stopPropagation());
    let n = null,
      r = null;
    (window.addEventListener(
      "pointerdown",
      () => {
        r = null;
      },
      !0,
    ),
      window.addEventListener(
        "click",
        (s) => {
          r === null ||
            s.detail === 0 ||
            (s instanceof PointerEvent && s.pointerId !== r) ||
            ((r = null), s.preventDefault(), s.stopImmediatePropagation());
        },
        !0,
      ),
      this.tools.addEventListener("pointerdown", (s) => {
        const a = s.target.closest("button");
        s.pointerType === "mouse" ||
          !a ||
          n ||
          (s.preventDefault(),
          a.setPointerCapture(s.pointerId),
          (n = { id: s.pointerId, button: a }));
      }),
      this.tools.addEventListener("pointerup", (s) => {
        if ((n == null ? void 0 : n.id) !== s.pointerId) return;
        const { button: a } = n;
        ((n = null), (r = s.pointerId), s.preventDefault());
        const o = a.getBoundingClientRect();
        s.clientX >= o.left &&
          s.clientX <= o.right &&
          s.clientY >= o.top &&
          s.clientY <= o.bottom &&
          a.click();
      }));
    for (const s of ["pointercancel", "lostpointercapture"])
      this.tools.addEventListener(s, (a) => {
        (n == null ? void 0 : n.id) === a.pointerId && (n = null);
      });
    ((this.select = e.querySelector("#touch-edit-control")),
      (this.editButton = e.querySelector("[data-touch-edit]")),
      this.preview
        .querySelector("[data-touch-stick]")
        .insertAdjacentHTML(
          "afterbegin",
          '<span class="touch-preview-stick" aria-hidden="true"><span></span></span>',
        ));
    for (const s of this.preview.querySelectorAll("button")) s.tabIndex = -1;
    for (const s of this.preview.querySelectorAll("[data-touch-control]")) {
      (s.addEventListener("pointerdown", (o) => this.startDrag(o, s)),
        s.addEventListener("pointermove", (o) => this.moveDrag(o)));
      const a = (o) => {
        var A;
        ((A = this.drag) == null ? void 0 : A.pointerId) === o.pointerId &&
          (this.drag = null);
      };
      (s.addEventListener("pointerup", a),
        s.addEventListener("pointercancel", a),
        s.addEventListener("lostpointercapture", a),
        s.addEventListener("click", (o) => {
          (o.preventDefault(), o.stopPropagation());
        }));
    }
    (this.editButton.addEventListener("click", () => this.startEditing()),
      e
        .querySelector("[data-touch-save]")
        .addEventListener("click", () => this.finish(!0)),
      e
        .querySelector("[data-touch-cancel]")
        .addEventListener("click", () => this.finish(!1)),
      e.querySelector("[data-touch-reset]").addEventListener("click", () => {
        if (!this.draft) return;
        const s = Ss(window.innerWidth, window.innerHeight);
        ((this.draft.layouts[s] = {}),
          this.render(),
          (this.tools.querySelector("[data-touch-layout-status]").textContent =
            `${s === "portrait" ? "Portrait" : "Landscape"} reset. Save to keep it.`));
      }),
      e
        .querySelector("[data-touch-collapse]")
        .addEventListener("click", (s) => {
          const a = s.currentTarget,
            o = e.querySelector("#touch-editor-adjustments");
          ((o.hidden = !o.hidden),
            a.setAttribute("aria-expanded", String(!o.hidden)),
            (a.textContent = o.hidden ? "Show tools" : "Hide tools"));
        }),
      this.select.addEventListener("change", () => {
        ((this.selected = this.select.value), this.render());
      }),
      e.querySelectorAll("[data-touch-adjust]").forEach((s) => {
        s.addEventListener("input", () => {
          if (!this.draft) return;
          const a = this.currentPlacement();
          ((a[s.dataset.touchAdjust] = Number(s.value) / 100),
            (this.draft.layouts[Ss(window.innerWidth, window.innerHeight)][
              this.selected
            ] = a),
            this.render());
        });
      }),
      e.querySelectorAll("[data-touch-extra]").forEach((s) => {
        s.addEventListener("change", () => {
          ((this.settings.extras[s.dataset.touchExtra] = s.checked),
            this.persist());
        });
      }),
      window.addEventListener("resize", () => {
        ((this.drag = null), this.draft && this.render());
      }),
      window.addEventListener("blur", () => {
        this.drag = null;
      }),
      this.syncExtras());
  }
  get isEditing() {
    return this.draft !== null;
  }
  cancel() {
    this.draft && this.finish(!1);
  }
  restoreDefaults() {
    (Object.assign(this.settings, La.defaults()),
      this.syncExtras(),
      this.persist());
  }
  syncExtras() {
    this.panel.querySelectorAll("[data-touch-extra]").forEach((e) => {
      e.checked = this.settings.extras[e.dataset.touchExtra];
    });
  }
  persist() {
    (La.save(this.settings),
      window.dispatchEvent(
        new CustomEvent(M0, { detail: structuredClone(this.settings) }),
      ));
  }
  startEditing() {
    ((this.draft = structuredClone(this.settings)),
      (this.selected = "drive"),
      this.select.replaceChildren(
        ...qd
          .filter((e) => k0(e, this.settings))
          .map((e) => new Option(Of[e], e)),
      ),
      (this.panel.querySelector(".touch-editor").hidden = !1),
      (this.tools.querySelector("[data-touch-layout-status]").textContent = ""),
      this.onEditChange(!0),
      this.render(),
      this.select.focus());
  }
  finish(e) {
    var t, n;
    (e &&
      this.draft &&
      (Object.assign(this.settings, this.draft), this.persist()),
      (this.draft = null),
      (this.drag = null),
      (this.panel.querySelector(".touch-editor").hidden = !0),
      this.onEditChange(!1),
      this.editButton.offsetParent !== null
        ? this.editButton.focus()
        : (n =
            (t = this.panel.closest(".sheet")) == null
              ? void 0
              : t.querySelector("#controller-input")) == null || n.focus());
  }
  currentPlacement() {
    const e = Lh(this.preview),
      t = this.draft.layouts[Ss(e.width, e.height)][this.selected];
    return t ? { ...t } : Hf(Fh(this.draft, e)[this.selected], e);
  }
  render() {
    if (!this.draft) return;
    (yA(this.preview, this.draft), (this.select.value = this.selected));
    const e = Ss(window.innerWidth, window.innerHeight);
    this.tools.querySelector("[data-touch-orientation]").textContent =
      `${e === "portrait" ? "Portrait" : "Landscape"} · game controls paused`;
    const t = this.currentPlacement();
    (this.panel.querySelectorAll("[data-touch-adjust]").forEach((n) => {
      const r = n.dataset.touchAdjust;
      ((n.value = String(Math.round(t[r] * 100))),
        n.style.setProperty(
          "--dim-progress",
          `${((Number(n.value) - Number(n.min)) / (Number(n.max) - Number(n.min))) * 100}%`,
        ),
        (this.tools.querySelector(`[data-touch-output="${r}"]`).value =
          `${n.value}%`));
    }),
      this.preview.querySelectorAll("[data-touch-control]").forEach((n) => {
        n.classList.toggle(
          "is-selected",
          n.dataset.touchControl === this.selected,
        );
      }));
  }
  startDrag(e, t) {
    if (
      !this.draft ||
      this.drag ||
      (e.pointerType === "mouse" && e.button !== 0)
    )
      return;
    (e.preventDefault(),
      e.stopPropagation(),
      (this.selected = t.dataset.touchControl));
    const n = t.getBoundingClientRect();
    ((this.drag = {
      pointerId: e.pointerId,
      id: this.selected,
      x: e.clientX,
      y: e.clientY,
      left: n.left,
      top: n.top,
    }),
      t.setPointerCapture(e.pointerId),
      this.render());
  }
  moveDrag(e) {
    var r;
    if (
      !this.draft ||
      ((r = this.drag) == null ? void 0 : r.pointerId) !== e.pointerId
    )
      return;
    e.preventDefault();
    const t = Lh(this.preview),
      n = Fh(this.draft, t)[this.drag.id];
    ((n.left = this.drag.left + e.clientX - this.drag.x),
      (n.top = this.drag.top + e.clientY - this.drag.y),
      (this.draft.layouts[Ss(t.width, t.height)][this.drag.id] = Hf(
        n,
        t,
        this.currentPlacement().size,
      )),
      this.render());
  }
}

export { TouchLayoutEditor };
