import { _ } from "../core/class-fields.js";
import { PC, Pf, RC, Rh, TC, Yo, getActionLabel, getBindingLabel, io, kC, saveBindings } from "../input/bindings.js";
import { $C, Hd, Ks, OA } from "../input/controller-selection.js";

import { Xd, getAudioSettings, lg, setMasterVolume } from "../audio/settings.js";
import { Ps } from "../rendering/camera.js";
import { Vt } from "./icons.js";
import { TouchLayoutEditor } from "./touch-editor.js";
import { CM, Ma, SA, SM, Yh, Zh, _g, cameraSettings, graphicsSettings, localQualityPresetIds, localQualityProfile, localQualityProfiles, trainingDefaults, trainingSettings, wM } from "../settings/schema.js";
import { MM, Na, Pr, im } from "./settings-controls.js";


class SettingsPanel {
  constructor(e, t, n, r, s, a, o, A) {
    _(this, "overlay");
    _(this, "sheet");
    _(this, "touchPanel");
    _(this, "target");
    _(this, "trainingTarget");
    _(this, "onOpenChange");
    _(this, "onTrainingChange");
    _(this, "onBindingsChange");
    _(this, "onCaptureChange");
    _(this, "bindings");
    _(this, "openState", !1);
    _(this, "activeTab", "camera");
    _(this, "padLayout", "xbox");
    _(this, "capture", null);
    _(this, "capturedMouseButton", null);
    _(this, "capturePoll", 0);
    _(this, "capturePrevButtons", []);
    _(this, "capturePrevAxes", []);
    _(this, "capturePadKey", null);
    _(this, "padNavKey", null);
    _(this, "padNavWaitForNeutral", !1);
    _(this, "padNavPoll", 0);
    _(this, "padNavPrev", []);
    _(this, "padNavDir", null);
    _(this, "padNavRepeatAt", 0);
    _(this, "inputSource", "keyboard");
    _(this, "asideMode", !1);
    _(this, "asidePinned", !1);
    _(this, "status", Yh.load());
    _(this, "onStatusChange", null);
    _(this, "onStatusDetails", null);
    _(this, "graphics", graphicsSettings.load());
    _(this, "onGraphicsChange", null);
    _(this, "onCaptureKey", (e) => {
      if (this.capture) {
        if ((e.preventDefault(), e.stopPropagation(), e.code === "Escape")) {
          (this.cancelCapture(), this.setStatus("Capture cancelled."));
          return;
        }
        this.capture.device === "keyboard" &&
          this.applyCapture({ kind: "key", code: e.code });
      }
    });
    _(this, "onCaptureMouse", (e) => {
      !this.capture ||
        this.capture.device !== "keyboard" ||
        (e.preventDefault(),
        e.stopPropagation(),
        (this.capturedMouseButton = e.button),
        this.applyCapture({ kind: "mouse", button: e.button }));
    });
    _(this, "onCapturedMouseClick", (e) => {
      e.button === this.capturedMouseButton &&
        ((this.capturedMouseButton = null),
        e.preventDefault(),
        e.stopImmediatePropagation());
    });
    _(this, "pollPadCapture", () => {
      var t;
      if (!this.capture || this.capture.device !== "pad") return;
      const e = this.firstPad();
      if (this.controllerKey(e) !== this.capturePadKey) {
        (this.cancelCapture(),
          this.refreshPadStatus(),
          this.setStatus("Controller changed. Select a binding to try again."));
        return;
      }
      if (e) {
        for (let n = 0; n < e.buttons.length; n += 1) {
          const r = ((t = e.buttons[n]) == null ? void 0 : t.pressed) ?? !1;
          if (r && !this.capturePrevButtons[n]) {
            this.applyCapture({ kind: "padButton", index: n });
            return;
          }
          this.capturePrevButtons[n] = r;
        }
        for (let n = 0; n < e.axes.length; n += 1) {
          const r = e.axes[n] ?? 0,
            s = this.capturePrevAxes[n] ?? 0;
          if (
            ((this.capturePrevAxes[n] = r),
            Math.abs(r) > 0.7 &&
              (Math.abs(s) <= 0.7 || Math.sign(s) !== Math.sign(r)))
          ) {
            this.applyCapture({
              kind: "padAxis",
              axis: n,
              dir: r > 0 ? 1 : -1,
            });
            return;
          }
        }
      }
      this.capturePoll = requestAnimationFrame(this.pollPadCapture);
    });
    _(this, "pollPadNav", (e) => {
      if (
        ((this.padNavPoll = requestAnimationFrame(this.pollPadNav)),
        !this.openState || this.capture)
      )
        return;
      const t = this.firstPad(),
        n = this.controllerKey(t);
      if (n !== this.padNavKey) {
        ((this.padNavKey = n),
          (this.padNavPrev = ((t == null ? void 0 : t.buttons) ?? []).map(
            (d) => d.pressed,
          )),
          (this.padNavDir = null),
          (this.padNavWaitForNeutral = !0),
          this.refreshPadStatus());
        return;
      }
      if (!t) return;
      const r = (d) => {
          var u;
          return ((u = t.buttons[d]) == null ? void 0 : u.pressed) ?? !1;
        },
        s = (d) => {
          const u = r(d),
            p = this.padNavPrev[d] ?? !1;
          return ((this.padNavPrev[d] = u), u && !p);
        };
      if (s(1)) {
        (this.markPadNav(),
          this.touchPanel.isEditing ? this.touchPanel.cancel() : this.hide());
        return;
      }
      (s(0) && (this.markPadNav(), this.padActivate()),
        s(4) && (this.markPadNav(), this.stepTab(-1)),
        s(5) && (this.markPadNav(), this.stepTab(1)));
      const a = 0.55,
        o = t.axes[0] ?? 0,
        A = t.axes[1] ?? 0;
      let l = (r(13) ? 1 : 0) - (r(12) ? 1 : 0),
        c = (r(15) ? 1 : 0) - (r(14) ? 1 : 0);
      (l === 0 && Math.abs(A) > a && (l = Math.sign(A)),
        c === 0 && Math.abs(o) > a && (c = Math.sign(o)),
        l !== 0 && (c = 0));
      const h = l !== 0 ? `v${l}` : c !== 0 ? `h${c}` : null;
      if (this.padNavWaitForNeutral) {
        if (h !== null) return;
        this.padNavWaitForNeutral = !1;
      }
      if (h === null) {
        this.padNavDir = null;
        return;
      }
      if (h !== this.padNavDir)
        ((this.padNavDir = h), (this.padNavRepeatAt = e + 380));
      else {
        if (e < this.padNavRepeatAt) return;
        this.padNavRepeatAt = e + 110;
      }
      (this.markPadNav(),
        l !== 0 ? this.movePadFocus(l) : this.adjustFocused(c));
    });
    var l;
    ((this.target = t),
      (this.trainingTarget = n),
      (this.bindings = r),
      (this.onOpenChange = s),
      (this.onTrainingChange = a),
      (this.onBindingsChange = o),
      (this.onCaptureChange = A),
      cameraSettings.loadInto(this.target),
      trainingSettings.loadInto(this.trainingTarget),
      (this.padLayout = Rh((l = this.firstPad()) == null ? void 0 : l.id)),
      e.insertAdjacentHTML(
        "beforeend",
        `
      <div class="hud-tools">
        <button id="fullscreen-button" class="hud-tool" type="button"
                aria-label="Enter fullscreen" title="Fullscreen">
          <span data-el="fullscreenIcon">${Vt("expand")}</span>
        </button>
        <button id="settings-button" class="hud-tool" type="button"
                aria-label="Open settings" title="Settings">
          ${Vt("gear")}
        </button>
      </div>

      <div id="settings-overlay" class="sheet-overlay" hidden aria-hidden="true">
        <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="settings-title">
          <button class="sheet-handle" type="button" data-el="handle"
                  aria-pressed="false" aria-label="Move the sheet aside to see the arena">
            <span class="sheet-handle__grip" aria-hidden="true"></span>
            <span class="sheet-handle__arrow">${Vt("arrow-right", 19)}</span>
          </button>
          <header class="sheet-head">
            <div class="sheet-head__ident">
              ${Vt("gear", 32)}<h1 id="settings-title">Settings</h1>
            </div>
            <button class="sheet-head__close" type="button" data-settings-close
                    aria-label="Close settings">
              ${Vt("x")}
            </button>
          </header>

          <nav class="sheet-tabs" aria-label="Settings categories" role="tablist">
            <span class="tab-hint" data-el="hintPrev" aria-hidden="true" hidden></span>
            ${[
              ["camera", "Camera", "camera"],
              ["controls", "Controls", "game-controller"],
              ["graphics", "Graphics", "monitor"],
              ["audio", "Audio", "speaker"],
              ["training", "Training", "target"],
              ["diagnostics", "Status", "chart"],
            ]
              .map(
                ([c, h, d]) => `
              <button id="settings-tab-${c}" class="sheet-tab${c === "camera" ? " is-active" : ""}"
                      type="button" role="tab" aria-selected="${c === "camera"}"
                      aria-controls="settings-panel-${c}" data-settings-tab="${c}">
                ${Vt(d, 24)}
                <span class="sheet-tab__name">${h}</span>
              </button>
            `,
              )
              .join("")}
            <span class="tab-hint tab-hint--next" data-el="hintNext" aria-hidden="true" hidden></span>
          </nav>

          <div class="sheet-body">
            <section id="settings-panel-camera" class="sheet-panel" role="tabpanel"
                     aria-labelledby="settings-tab-camera" data-settings-panel="camera" tabindex="0">
              ${SM.map(
                (c) => `
                <section class="zone">
                  <header class="zone__head">
                    <span class="zone__letter" aria-hidden="true">${c.letter}</span>
                    <h2 class="zone__label">${c.label}</h2>
                    <p class="zone__note">${c.note}</p>
                  </header>
                  <div class="zone__rows">
                    ${c.ranges.map((h) => MM(Zh.get(h))).join("")}
                    ${c.checks.map((h) => Pr(h.key, h.label, h.note, "camera")).join("")}
                  </div>
                </section>
              `,
              ).join("")}
            </section>

            <section id="settings-panel-controls" class="sheet-panel" role="tabpanel"
                     aria-labelledby="settings-tab-controls" data-settings-panel="controls" tabindex="0" hidden>
              <details class="touch-settings-section" ${navigator.maxTouchPoints > 0 || window.matchMedia("(any-pointer: coarse)").matches ? "open" : ""}>
                <summary>Touch controls<span>Edit layout and add extra buttons</span></summary>
                <div id="touch-settings-panel"></div>
              </details>
              <p class="panel-lede">
                Select a key or button to change it. Press your new input to save, or Esc to cancel.
                Use + to add an alternate input and × to remove one. Changes save automatically.
              </p>
              <div class="controller-choice">
                <label for="controller-input" class="parts-head__title">Controller input</label>
                <select id="controller-input" class="pick" aria-describedby="controller-input-note"></select>
                <p id="controller-input-note">Choose the device for driving, menus, and bindings. Press a button on your controller if it is missing.</p>
              </div>
              <div class="parts-head">
                <h3 id="parts-title" class="parts-head__title">Control assignments</h3>
                <span class="parts__pad" data-el="padStatus">No controller detected</span>
              </div>
              <div class="control-device-tabs" role="group" aria-label="Show bindings for"><button type="button" data-control-device="keyboard" aria-pressed="true">Keyboard &amp; mouse</button><button type="button" data-control-device="controller" aria-pressed="false">Controller</button></div>
              <div class="parts-wrap" data-control-view="keyboard">
                <table class="parts" aria-labelledby="parts-title">
                  <thead>
                    <tr>
                      <th scope="col" class="parts__col-item">Item</th>
                      <th scope="col">Action</th>
                      <th scope="col">Keyboard / Mouse</th>
                      <th scope="col">Controller</th>
                    </tr>
                  </thead>
                  <tbody data-el="partsBody"></tbody>
                </table>
              </div>

              <section class="zone">
                <header class="zone__head">
                  <span class="zone__letter" aria-hidden="true">S</span>
                  <h2 class="zone__label">Stick Roles</h2>
                  <p class="zone__note">Sticks steer and pitch as analog axes, the way the game does.</p>
                </header>
                <div class="zone__rows" data-el="axisRows"></div>
              </section>
            </section>

            <section id="settings-panel-graphics" class="sheet-panel" role="tabpanel"
                     aria-labelledby="settings-tab-graphics" data-settings-panel="graphics" tabindex="0" hidden>
              <section class="zone">
                <header class="zone__head">
                  <h2 class="zone__label">Quality Preset</h2>
                  <p class="zone__note">Resolution, effects, reflections, shadows and FPS apply live. Antialiasing and stadium material quality take effect next launch; no automatic restart.</p>
                </header>
                <div class="zone__rows">
                  <div class="dim">
                    <label class="dim__label" for="graphics-quality-preset">Preset</label>
                    <span class="dim__leader" aria-hidden="true"></span>
                    <span class="dim__control">
                      <select id="graphics-quality-preset" class="pick" data-graphics-setting="qualityPreset">
                        ${localQualityPresetIds
                          .map(
                            (c) =>
                              `<option value="${c}">${localQualityProfiles[c].label}</option>`,
                          )
                          .join("")}
                      </select>
                    </span>
                  </div>
                  <div class="dim">
                    <label class="dim__label" for="graphics-renderScale">Render Scale</label>
                    <span class="dim__leader" aria-hidden="true"></span>
                    <span class="dim__control">
                      <input id="graphics-renderScale" class="dim__line" type="range"
                             min="0.1" max="1" step="0.05" data-graphics-setting="renderScale"
                             aria-describedby="graphics-renderScale-note" />
                    </span>
                    <output class="figure" data-graphics-value-for="renderScale" for="graphics-renderScale"></output>
                  </div>
                  <p id="graphics-renderScale-note" class="zone__note">Lower values improve performance. 1 is full resolution; menus stay sharp. Saved independently of the preset.</p>
                </div>
              </section>
              <section class="zone">
                <header class="zone__head">
                  <h2 class="zone__label">Frame Rate</h2>
                  <p class="zone__note">Choose how much rendering power to use.</p>
                </header>
                <div class="zone__rows">
                  ${Pr("limitFps", "Limit FPS", "Reduce GPU usage by capping the frame rate.", "graphics")}
                  ${Pr("enabled", "FPS + Latency", "Show FPS and average frame latency. This local game has no network ping.", "status", "graphics-status-enabled")}
                  ${Pr("details", "Detailed Stats", "Expand frame timing, CPU and rendering details. You can also click the FPS readout.", "status", "graphics-status-details")}

                  <div class="dim" data-dim-row="maxFps">
                    <label class="dim__label" for="graphics-maxFps">Maximum FPS</label>
                    <span class="dim__leader" aria-hidden="true"></span>
                    <span class="dim__control">
                      <input id="graphics-maxFps" class="dim__line" type="range"
                             min="${Ma}" max="${SA}" step="1" data-graphics-setting="maxFps" />
                    </span>
                    <output class="figure" data-graphics-value-for="maxFps" for="graphics-maxFps"></output>
                  </div>
                </div>
              </section>
              <section class="zone">
                <header class="zone__head">
                  <span class="zone__letter" aria-hidden="true">S</span>
                  <h2 class="zone__label">Scenery</h2>
                  <p class="zone__note">The surroundings outside the playable arena.</p>
                </header>
                <div class="zone__rows">
                  ${Pr("showStadium", "Park Scenery", "Adds low stands and floodlight towers. All presets share the same trees, gardens and mountain backdrop.", "graphics")}
                </div>
              </section>
            </section>

            <section id="settings-panel-audio" class="sheet-panel" role="tabpanel"
                     aria-labelledby="settings-tab-audio" data-settings-panel="audio" tabindex="0" hidden>
              <p class="panel-lede">
                Set the overall output level for every game sound. Changes take
                effect immediately and are remembered for the next session.
              </p>
              <section class="zone">
                <header class="zone__head">
                  <span class="zone__letter" aria-hidden="true">A</span>
                  <h2 class="zone__label">Master Output</h2>
                  <p class="zone__note">One level for vehicle, impact, boost, and event audio.</p>
                </header>
                <div class="zone__rows">
                  <div class="dim" data-dim-row="masterVolume">
                    <label class="dim__label" for="audio-master-volume">Overall Volume</label>
                    <span class="dim__leader" aria-hidden="true"></span>
                    <span class="dim__control">
                      <input id="audio-master-volume" class="dim__line" type="range"
                             min="0" max="100" step="1" data-audio-setting="masterVolume" />
                    </span>
                    <output class="figure" data-audio-value-for="masterVolume"
                            for="audio-master-volume"></output>
                  </div>
                </div>
              </section>
            </section>

            <section id="settings-panel-diagnostics" class="sheet-panel" role="tabpanel"
                     aria-labelledby="settings-tab-diagnostics" data-settings-panel="diagnostics"
                     tabindex="0" hidden>
              <p class="panel-lede">
                The status overlay draws in the top-left corner while you play.
                These options decide what
                is shown.
              </p>
              <section class="zone">
                <header class="zone__head">
                  <span class="zone__letter" aria-hidden="true">O</span>
                  <h2 class="zone__label">Overlay</h2>
                  <p class="zone__note">What the corner readout carries.</p>
                </header>
                <div class="status-master">
                  ${Pr("enabled", "Show Status Overlay", "Draws the readout over the game.", "status")}
                  <button class="act status-open-details" type="button" data-status-details disabled>View status details</button>
                </div>
                <div class="zone__rows">
                  ${_g.map((c) => Pr(c.key, c.label, c.note, "status")).join("")}
                </div>
              </section>
            </section>

            <section id="settings-panel-training" class="sheet-panel" role="tabpanel"
                     aria-labelledby="settings-tab-training" data-settings-panel="training" tabindex="0" hidden>
              <section class="zone">
                <header class="zone__head">
                  <span class="zone__letter" aria-hidden="true">F</span>
                  <h2 class="zone__label">Free Play</h2>
                  <p class="zone__note">Session rules for practice.</p>
                </header>
                <div class="zone__rows">
                  ${Pr("disableGoalReset", "Disable Restart on Goal", "Play on after the ball goes in.", "training")}
                  <div class="dim">
                    <label class="dim__label" for="training-boost-option">Boost</label>
                    <span class="dim__leader" aria-hidden="true"></span>
                    <span class="dim__control">
                      <select id="training-boost-option" class="pick" data-training-setting="boostOption">
                        <option value="unlimited">Unlimited</option>
                        <option value="standard">Standard</option>
                      </select>
                    </span>
                  </div>
                  ${Pr("showCarHitbox", "Show Car Hitbox", "Draws the collision box around the car.", "training")}
                </div>
              </section>
            </section>
          </div>

          <footer class="title-block">
            <div class="title-block__info">
              <p class="title-block__status" data-el="status" role="status" aria-live="polite"></p>
            </div>
            <p class="pad-legend" data-el="padLegend" aria-hidden="true" hidden></p>
            <div class="title-block__actions">
              <button class="act" type="button" data-settings-defaults>Restore defaults</button>
              <button class="act act--primary" type="button" data-settings-close>Done</button>
            </div>
          </footer>
        </section>
      </div>
    `,
      ),
      (this.overlay = e.querySelector("#settings-overlay")),
      (this.sheet = this.overlay.querySelector(".sheet")),
      (this.touchPanel = new TouchLayoutEditor(
        this.overlay.querySelector("#touch-settings-panel"),
        (c) => {
          (this.setAside(!1, !1),
            this.overlay.classList.toggle("is-touch-editing", c));
        },
      )),
      this.sheet.addEventListener("keydown", (c) => {
        c.code === "Escape" &&
          this.touchPanel.isEditing &&
          (c.preventDefault(), c.stopPropagation(), this.touchPanel.cancel());
      }),
      this.renderParts(),
      this.renderAxisRows(),
      e
        .querySelector("#settings-button")
        .addEventListener("click", () => this.show()),
      e
        .querySelector("#fullscreen-button")
        .addEventListener("click", () => this.toggleFullscreen()),
      document.addEventListener("fullscreenchange", () =>
        this.syncFullscreenButton(),
      ),
      this.overlay.querySelectorAll("[data-settings-close]").forEach((c) => {
        c.addEventListener("click", () => this.hide());
      }),
      this.overlay.addEventListener("mousedown", (c) => {
        c.target === this.overlay && this.hide();
      }),
      this.overlay
        .querySelector("[data-settings-defaults]")
        .addEventListener("click", () => this.restoreDefaults()),
      this.overlay.querySelectorAll("[data-camera-setting]").forEach((c) => {
        (c.addEventListener("input", () => {
          (this.setAside(!0, !1), this.updateCameraSetting(c));
        }),
          c.addEventListener("change", () => {
            (this.setAside(!0, !1), this.updateCameraSetting(c));
          }));
      }),
      this.overlay.querySelectorAll("[data-training-setting]").forEach((c) => {
        c.addEventListener("change", () => {
          (this.setAside(!1, !1), this.updateTrainingSetting(c));
        });
      }),
      this.overlay.querySelectorAll("[data-audio-setting]").forEach((c) => {
        const h = () => {
          (this.setAside(!1, !1), this.updateAudioSetting(c));
        };
        (c.addEventListener("input", h), c.addEventListener("change", h));
      }),
      this.overlay.querySelectorAll("[data-status-setting]").forEach((c) => {
        c.addEventListener("change", () => {
          (this.setAside(!1, !1), this.updateStatusSetting(c));
        });
      }),
      this.overlay
        .querySelector("[data-status-details]")
        .addEventListener("click", () => {
          !this.status.enabled ||
            !this.onStatusDetails ||
            (this.hide(), this.onStatusDetails());
        }),
      this.overlay.querySelectorAll("[data-graphics-setting]").forEach((c) => {
        const h = () => {
          (this.setAside(!1, !1), this.updateGraphicsSetting(c));
        };
        (c.type === "range" && c.addEventListener("input", h),
          c.addEventListener("change", h));
      }),
      this.overlay
        .querySelector('[data-el="handle"]')
        .addEventListener("click", () => this.setAside(!this.asideMode, !0)),
      this.overlay.querySelectorAll('[data-control-device]').forEach(button => {
        button.addEventListener('click', () => {
          this.cancelCapture();
          this.overlay.querySelector('.parts-wrap').dataset.controlView = button.dataset.controlDevice;
          this.overlay.querySelectorAll('[data-control-device]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
        });
      }),
      this.overlay.querySelectorAll("[data-settings-tab]").forEach((c) => {
        c.addEventListener("click", () => {
          const h = c.dataset.settingsTab;
          h && this.selectTab(h);
        });
      }),
      this.overlay.addEventListener("click", (c) => {
        const h = c.target,
          d = h == null ? void 0 : h.closest("[data-bind-action]");
        if (d) {
          (this.setAside(!1, !1),
            this.beginCapture(
              d.dataset.bindDevice,
              d.dataset.bindAction,
              Number(d.dataset.bindSlot),
            ));
          return;
        }
        const u = h == null ? void 0 : h.closest("[data-clear-action]");
        u &&
          this.clearBindingAt(
            u.dataset.clearDevice,
            u.dataset.clearAction,
            Number(u.dataset.clearSlot),
          );
      }),
      this.sheet.addEventListener("keydown", (c) => this.trapFocus(c)),
      this.overlay
        .querySelector("#controller-input")
        .addEventListener("change", (c) => {
          const h = c.target.value,
            d = OA().find(
              (u) =>
                (u == null ? void 0 : u.connected) && String(u.index) === h,
            );
          h === "auto" || d ? $C(d ?? null) : this.refreshPadStatus();
        }),
      window.addEventListener("controllerselectionchanged", () => {
        this.cancelCapture();
        const c = this.firstPad(),
          h = this.controllerKey(c);
        (h !== this.padNavKey &&
          ((this.padNavKey = h),
          (this.padNavPrev = ((c == null ? void 0 : c.buttons) ?? []).map(
            (d) => d.pressed,
          )),
          (this.padNavDir = null),
          (this.padNavWaitForNeutral = !0)),
          this.refreshPadStatus());
      }),
      window.addEventListener("gamepadconnected", () =>
        this.refreshPadStatus(),
      ),
      window.addEventListener("gamepaddisconnected", () =>
        this.refreshPadStatus(),
      ),
      window.addEventListener(
        "keydown",
        () => {
          ((this.capturedMouseButton = null), this.setInputSource("keyboard"));
        },
        !0,
      ),
      window.addEventListener(
        "mousedown",
        () => {
          ((this.capturedMouseButton = null), this.setInputSource("keyboard"));
        },
        !0,
      ),
      window.addEventListener("click", this.onCapturedMouseClick, !0),
      window.addEventListener("auxclick", this.onCapturedMouseClick, !0),
      this.syncCameraControls(),
      this.syncAudioControls(),
      window.addEventListener(Xd, () => this.syncAudioControls()),
      this.syncTrainingControls(),
      this.syncGraphicsControls(),
      this.refreshPadStatus(),
      this.onTrainingChange(this.trainingTarget),
      this.onBindingsChange(this.bindings));
  }
  get isOpen() {
    return this.openState;
  }
  toggleFullscreen() {
    document.fullscreenElement
      ? document.exitFullscreen().catch(() => {})
      : document.documentElement.requestFullscreen().catch(() => {
          this.setStatus("Fullscreen was refused by the browser.");
        });
  }
  syncFullscreenButton() {
    const e = document.querySelector("#fullscreen-button"),
      t = e == null ? void 0 : e.querySelector('[data-el="fullscreenIcon"]');
    if (!e || !t) return;
    const n = !!document.fullscreenElement;
    (e.setAttribute("aria-label", n ? "Exit fullscreen" : "Enter fullscreen"),
      (e.title = n ? "Exit fullscreen" : "Fullscreen"),
      (t.innerHTML = Vt(n ? "collapse" : "expand")));
  }
  toggle() {
    this.openState ? this.hide() : this.show();
  }
  show() {
    this.openState ||
      ((this.openState = !0),
      (this.overlay.hidden = !1),
      this.overlay.setAttribute("aria-hidden", "false"),
      document.body.classList.add("settings-open"),
      this.onOpenChange(!0),
      requestAnimationFrame(() => this.overlay.classList.add("is-open")),
      this.focusPanelStart(),
      this.refreshPadStatus(),
      document.body.classList.toggle("pad-nav", this.inputSource === "pad"),
      this.updatePadHints(),
      this.startPadNav());
  }
  hide() {
    var e;
    this.openState &&
      (this.touchPanel.cancel(),
      this.cancelCapture(),
      this.stopPadNav(),
      (this.asidePinned = !1),
      this.setAside(!1, !1),
      (this.openState = !1),
      this.overlay.classList.remove("is-open"),
      this.overlay.setAttribute("aria-hidden", "true"),
      document.body.classList.remove("settings-open"),
      this.onOpenChange(!1),
      window.setTimeout(() => {
        this.openState || (this.overlay.hidden = !0);
      }, 180),
      (e = document.querySelector("#settings-button")) == null || e.focus());
  }
  updateCameraSetting(e) {
    const t = e.dataset.cameraSetting;
    if (t) {
      if (e.type === "checkbox") this.target[t] = e.checked;
      else {
        const n = Number(e.value);
        if (!Number.isFinite(n)) return;
        this.target[t] = n;
      }
      (this.updateRangePresentation(e), this.persistCamera());
    }
  }
  syncCameraControls() {
    this.overlay.querySelectorAll("[data-camera-setting]").forEach((e) => {
      const t = e.dataset.cameraSetting,
        n = this.target[t];
      (e.type === "checkbox" ? (e.checked = !!n) : (e.value = String(n)),
        this.updateRangePresentation(e));
    });
  }
  updateRangePresentation(e) {
    if (e.type !== "range") return;
    const t = e.dataset.cameraSetting,
      n = Zh.get(t);
    if (!n) return;
    const r = Number(e.value),
      s = ((r - n.min) / (n.max - n.min)) * 100;
    e.style.setProperty("--dim-progress", `${s}%`);
    const a = this.overlay.querySelector(`[data-value-for="${t}"]`);
    a && (a.value = `${r.toFixed(n.decimals)}${n.suffix ?? ""}`);
  }
  updateAudioSetting(e) {
    if (e.dataset.audioSetting !== "masterVolume") return;
    const t = Number(e.value);
    Number.isFinite(t) && (setMasterVolume(t / 100), this.updateAudioRangePresentation(e));
  }
  syncAudioControls() {
    const e = Math.round(getAudioSettings().masterVolume * 100);
    this.overlay.querySelectorAll("[data-audio-setting]").forEach((t) => {
      ((t.value = String(e)), this.updateAudioRangePresentation(t));
    });
  }
  updateAudioRangePresentation(e) {
    const t = Math.round(Number(e.value));
    (e.style.setProperty("--dim-progress", `${t}%`),
      e.setAttribute("aria-valuetext", `${t} percent`));
    const n = this.overlay.querySelector(
      '[data-audio-value-for="masterVolume"]',
    );
    n && (n.value = `${t}%`);
  }
  updateTrainingSetting(e) {
    const t = e.dataset.trainingSetting;
    t &&
      (e instanceof HTMLInputElement && e.type === "checkbox"
        ? (this.trainingTarget[t] = e.checked)
        : t === "boostOption" &&
          (e.value === "unlimited" || e.value === "standard") &&
          (this.trainingTarget.boostOption = e.value),
      this.persistTraining(),
      this.onTrainingChange(this.trainingTarget));
  }
  syncTrainingControls() {
    this.overlay.querySelectorAll("[data-training-setting]").forEach((e) => {
      const t = e.dataset.trainingSetting,
        n = this.trainingTarget[t];
      e instanceof HTMLInputElement && e.type === "checkbox"
        ? (e.checked = !!n)
        : (e.value = String(n));
    });
  }
  firstPad() {
    return Ks();
  }
  controllerKey(e) {
    return e ? JSON.stringify([e.id, e.index]) : null;
  }
  refreshPadStatus() {
    var a;
    const e = this.firstPad();
    ((a = this.capture) == null ? void 0 : a.device) === "pad" &&
      this.controllerKey(e) !== this.capturePadKey &&
      (this.cancelCapture(),
      this.setStatus("Controller changed. Select a binding to try again."));
    const t = Hd(),
      n = this.overlay.querySelector("#controller-input"),
      r = [new Option("Automatic (prefer game controller)", "auto")];
    for (const o of OA())
      o != null &&
        o.connected &&
        r.push(
          new Option(
            `${o.id || "Controller"} · ${o.index + 1}`,
            String(o.index),
          ),
        );
    if (t.id !== null && !e) {
      const o = new Option(`${t.id} (disconnected)`, "disconnected");
      ((o.disabled = !0), r.push(o));
    }
    (n.replaceChildren(...r),
      (n.value = t.id === null ? "auto" : e ? String(e.index) : "disconnected"),
      (this.padLayout = Rh(e == null ? void 0 : e.id)));
    const s = this.overlay.querySelector('[data-el="padStatus"]');
    (s &&
      ((s.textContent = e
        ? `${e.id.replace(/\s*\(.*\)\s*/g, "").trim() || "Controller"} · ${this.padLayout === "playstation" ? "PlayStation" : "Xbox"} layout`
        : t.id !== null
          ? "Selected controller disconnected"
          : "No controller detected"),
      s.classList.toggle("is-live", !!e)),
      this.capture || this.renderParts(),
      this.updatePadHints());
  }
  renderParts() {
    const e = this.overlay.querySelector('[data-el="partsBody"]');
    if (!e) return;
    let t = 0;
    const n = [];
    for (const r of kC) {
      const s = io.filter((a) => a.group === r);
      if (s.length !== 0) {
        n.push(`
        <tr class="parts__group">
          <th scope="rowgroup" colspan="4">${r}</th>
        </tr>
      `);
        for (const a of s) {
          t += 1;
          const o = this.bindings.keyboard[a.id],
            A = this.bindings.pad[a.id];
          n.push(`
          <tr data-action-row="${a.id}">
            <td class="parts__col-item">
              <span class="balloon">${String(t).padStart(2, "0")}</span>
            </td>
            <th scope="row" class="parts__desc">
              <span class="parts__name">${a.label}</span>
              <span class="parts__note">${a.note}</span>
            </th>
            <td class="parts__binds parts__binds--keyboard">
              ${this.slotMarkup("keyboard", a.id, o)}
            </td>
            <td class="parts__binds parts__binds--controller">
              ${this.slotMarkup("pad", a.id, A)}
              ${this.axisHintFor(a.id)}
            </td>
          </tr>
        `);
        }
      }
    }
    e.innerHTML = n.join("");
  }
  slotMarkup(e, t, n) {
    const r = n.map((s, a) => im(e, t, a, s, this.padLayout));
    return (
      n.length < 2 && r.push(im(e, t, n.length, void 0, this.padLayout)),
      r.join("")
    );
  }
  axisHintFor(e) {
    const { steer: t, pitch: n } = this.bindings.axes,
      r = (a) => `<span class="axis-hint">${a}</span>`,
      s = `${Yo(t.axis)}${t.invert ? " (inv)" : ""}`;
    return e === "steerLeft" || e === "steerRight"
      ? r(s)
      : e === "throttleForward" || e === "throttleReverse"
        ? r(`pitch: ${Yo(n.axis)}${n.invert ? " (inv)" : ""}`)
        : e === "airRoll"
          ? r(`held: ${s} rolls`)
          : "";
  }
  renderAxisRows() {
    const e = this.overlay.querySelector('[data-el="axisRows"]');
    if (!e) return;
    const t = (n) =>
      wM
        .map(
          (r) =>
            `<option value="${r}"${r === n ? " selected" : ""}>${Yo(r)}</option>`,
        )
        .join("");
    ((e.innerHTML = `
      <div class="dim">
        <label class="dim__label" for="axis-steer">Steer / Yaw Axis</label>
        <span class="dim__leader" aria-hidden="true"></span>
        <span class="dim__control">
          <select id="axis-steer" class="pick" data-axis-role="steer">${t(this.bindings.axes.steer.axis)}</select>
        </span>
      </div>
      ${Pr("steerInvert", "Invert Steer", "Flips the steering axis.", "axisflag")}
      <div class="dim">
        <label class="dim__label" for="axis-pitch">Pitch Axis</label>
        <span class="dim__leader" aria-hidden="true"></span>
        <span class="dim__control">
          <select id="axis-pitch" class="pick" data-axis-role="pitch">${t(this.bindings.axes.pitch.axis)}</select>
        </span>
      </div>
      ${Pr("pitchInvert", "Invert Pitch", "Stick up noses down when off.", "axisflag")}
      <div class="dim">
        <label class="dim__label" for="axis-deadzone">Stick Deadzone</label>
        <span class="dim__leader" aria-hidden="true"></span>
        <span class="dim__control">
          <input id="axis-deadzone" class="dim__line" type="range" min="0" max="0.5" step="0.01"
                 data-axis-number="deadzone" />
        </span>
        <output class="figure" data-axis-value="deadzone" for="axis-deadzone"></output>
      </div>
      <div class="dim">
        <label class="dim__label" for="axis-trigger">Trigger Threshold</label>
        <span class="dim__leader" aria-hidden="true"></span>
        <span class="dim__control">
          <input id="axis-trigger" class="dim__line" type="range" min="0.02" max="0.9" step="0.01"
                 data-axis-number="triggerThreshold" />
        </span>
        <output class="figure" data-axis-value="triggerThreshold" for="axis-trigger"></output>
      </div>
    `),
      e.querySelectorAll("[data-axis-role]").forEach((n) => {
        n.addEventListener("change", () => {
          const r = n.dataset.axisRole;
          ((this.bindings.axes[r].axis = Number(n.value)),
            this.commitBindings(
              `${r === "steer" ? "Steer" : "Pitch"} axis set to ${Yo(Number(n.value))}.`,
            ),
            this.renderParts());
        });
      }),
      e.querySelectorAll("[data-axisflag-setting]").forEach((n) => {
        n.addEventListener("change", () => {
          const r = n.dataset.axisflagSetting;
          (r === "steerInvert" && (this.bindings.axes.steer.invert = n.checked),
            r === "pitchInvert" &&
              (this.bindings.axes.pitch.invert = n.checked),
            this.commitBindings(
              n.checked ? "Axis inverted." : "Axis restored.",
            ),
            this.renderParts());
        });
      }),
      e.querySelectorAll("[data-axis-number]").forEach((n) => {
        const r = () => {
          const s = n.dataset.axisNumber,
            a = Number(n.value);
          Number.isFinite(a) &&
            ((this.bindings.axes[s] = a),
            this.syncAxisControls(),
            this.commitBindings());
        };
        (n.addEventListener("input", r), n.addEventListener("change", r));
      }),
      this.syncAxisControls());
  }
  syncAxisControls() {
    const e = this.overlay.querySelector('[data-el="axisRows"]');
    if (!e) return;
    const t = e.querySelector('[data-axis-role="steer"]');
    t && (t.value = String(this.bindings.axes.steer.axis));
    const n = e.querySelector('[data-axis-role="pitch"]');
    n && (n.value = String(this.bindings.axes.pitch.axis));
    const r = e.querySelector('[data-axisflag-setting="steerInvert"]');
    r && (r.checked = this.bindings.axes.steer.invert);
    const s = e.querySelector('[data-axisflag-setting="pitchInvert"]');
    s && (s.checked = this.bindings.axes.pitch.invert);
    for (const a of ["deadzone", "triggerThreshold"]) {
      const o = e.querySelector(`[data-axis-number="${a}"]`),
        A = e.querySelector(`[data-axis-value="${a}"]`),
        l = this.bindings.axes[a];
      if (o) {
        o.value = String(l);
        const c = Number(o.min),
          h = Number(o.max);
        o.style.setProperty("--dim-progress", `${((l - c) / (h - c)) * 100}%`);
      }
      A && (A.value = l.toFixed(2));
    }
  }
  beginCapture(e, t, n) {
    var s, a;
    (this.cancelCapture(),
      (this.capture = { device: e, action: t, slot: n }),
      this.onCaptureChange(!0));
    const r = this.overlay.querySelector(
      `[data-bind-device="${e}"][data-bind-action="${t}"][data-bind-slot="${n}"]`,
    );
    (r &&
      (r.classList.add("is-capturing"),
      (r.textContent =
        e === "keyboard" ? "press key / mouse…" : "press button…")),
      this.setStatus(
        e === "keyboard"
          ? `Listening for a key or mouse button for ${getActionLabel(t)}. Esc cancels.`
          : `Listening for a controller button or stick direction for ${getActionLabel(t)}. Esc cancels.`,
      ),
      e === "keyboard"
        ? (window.addEventListener("keydown", this.onCaptureKey, !0),
          window.addEventListener("mousedown", this.onCaptureMouse, !0))
        : (window.addEventListener("keydown", this.onCaptureKey, !0),
          (this.capturePrevButtons = (
            ((s = this.firstPad()) == null ? void 0 : s.buttons) ?? []
          ).map((o) => o.pressed)),
          (this.capturePrevAxes = [
            ...(((a = this.firstPad()) == null ? void 0 : a.axes) ?? []),
          ]),
          (this.capturePadKey = this.controllerKey(this.firstPad())),
          (this.capturePoll = requestAnimationFrame(this.pollPadCapture))));
  }
  applyCapture(e) {
    const t = this.capture;
    if (!t) return;
    const n = TC(this.bindings, t.device, t.action, t.slot, e);
    if ((this.cancelCapture(), !n.changed)) {
      (this.setStatus("Unchanged."), this.renderParts());
      return;
    }
    const r = getBindingLabel(e, this.padLayout);
    (this.commitBindings(`${r} bound to ${getActionLabel(t.action)}.`), this.renderParts());
    const s = this.overlay.querySelector(`[data-action-row="${t.action}"]`);
    (s == null || s.classList.add("is-changed"),
      window.setTimeout(
        () => (s == null ? void 0 : s.classList.remove("is-changed")),
        900,
      ));
  }
  cancelCapture() {
    var s;
    if (!this.capture) return;
    const { device: e, action: t, slot: n } = this.capture;
    ((this.capture = null),
      window.removeEventListener("keydown", this.onCaptureKey, !0),
      window.removeEventListener("mousedown", this.onCaptureMouse, !0),
      this.capturePoll && cancelAnimationFrame(this.capturePoll),
      (this.capturePoll = 0),
      this.onCaptureChange(!1),
      (this.padNavPrev = (
        ((s = this.firstPad()) == null ? void 0 : s.buttons) ?? []
      ).map((a) => a.pressed)));
    const r = this.overlay.querySelector(
      `[data-bind-device="${e}"][data-bind-action="${t}"][data-bind-slot="${n}"]`,
    );
    (r == null || r.classList.remove("is-capturing"), this.renderParts());
  }
  clearBindingAt(e, t, n) {
    const s = this.bindings[e][t][n];
    s &&
      (RC(this.bindings, e, t, n),
      this.commitBindings(`${getBindingLabel(s, this.padLayout)} removed from ${getActionLabel(t)}.`),
      this.renderParts());
  }
  commitBindings(e) {
    (saveBindings(this.bindings),
      this.onBindingsChange(this.bindings),
      e && this.setStatus(e));
  }
  setStatus(e) {
    const t = this.overlay.querySelector('[data-el="status"]');
    t && (t.textContent = e);
  }
  attachGraphics(e) {
    return (
      (this.onGraphicsChange = e),
      this.syncGraphicsControls(),
      e(this.graphics),
      this.graphics
    );
  }
  updateGraphicsSetting(e) {
    var n;
    const t = e.dataset.graphicsSetting;
    if (t === "qualityPreset") {
      if (!localQualityPresetIds.includes(e.value)) return;
      const r = localQualityProfile(e.value);
      Object.assign(this.graphics, {
        qualityPreset: e.value,
        showStadium: r.showStadium,
      });
      graphicsSettings.save(this.graphics);
      this.onGraphicsChange?.(this.graphics); this.syncGraphicsControls();
      return;
    }
    if (t === "showStadium") {
      this.graphics.showStadium = e.checked;
      graphicsSettings.save(this.graphics);
      this.onGraphicsChange?.(this.graphics); this.syncGraphicsControls();
      return;
    }
    if (t === "limitFps") this.graphics[t] = e.checked;
    else if (t === "renderScale") {
      if (!Number.isFinite(e.valueAsNumber)) return;
      this.graphics.renderScale = Math.max(0.1, Math.min(1, e.valueAsNumber));
    }
    else if (t === "maxFps")
      this.graphics.maxFps = Math.round(
        Math.max(Ma, Math.min(SA, e.valueAsNumber)),
      );
    else return;
    (graphicsSettings.save(this.graphics),
      (n = this.onGraphicsChange) == null || n.call(this, this.graphics),
      this.syncGraphicsControls());
  }
  syncGraphicsControls() {
    (this.overlay.querySelectorAll("[data-graphics-setting]").forEach((e) => {
      var n;
      const t = e.dataset.graphicsSetting;
      if (t === "renderScale") {
        e.value = String(this.graphics.renderScale);
        e.setAttribute("aria-valuetext", `${Math.round(this.graphics.renderScale * 100)} percent`);
        e.style.setProperty("--dim-progress", `${((this.graphics.renderScale - 0.1) / 0.9) * 100}%`);
        this.overlay.querySelector('[data-graphics-value-for="renderScale"]').value = this.graphics.renderScale.toFixed(2);
        return;
      }
      t === "qualityPreset"
        ? (e.value = this.graphics.qualityPreset)
        : t === "showStadium" || t === "limitFps"
          ? (e.checked = this.graphics[t])
          : t === "maxFps" &&
            ((e.value = String(this.graphics.maxFps)),
            (e.disabled = !this.graphics.limitFps),
            e.setAttribute(
              "aria-valuetext",
              `${this.graphics.maxFps} frames per second`,
            ),
            e.style.setProperty(
              "--dim-progress",
              `${((this.graphics.maxFps - Ma) / (SA - Ma)) * 100}%`,
            ),
            (n = e.closest(".dim")) == null ||
              n.classList.toggle("is-disabled", !this.graphics.limitFps));
    }),
      (this.overlay.querySelector('[data-graphics-value-for="maxFps"]').value =
        String(this.graphics.maxFps)));
  }
  attachStatus(e, t) {
    return (
      (this.onStatusChange = e),
      (this.onStatusDetails = t ?? null),
      this.syncStatusControls(),
      this.status
    );
  }
  updateStatusSetting(e) {
    var n;
    const t = e.dataset.statusSetting;
    if (e.id === "graphics-status-enabled" && e.checked) this.status.frame = !0;
    if (t === "details" && e.checked) { this.status.frame = true; this.status.renderer = true; }
    t &&
      ((this.status[t] = e.checked),
      Yh.save(this.status),
      (n = this.onStatusChange) == null || n.call(this, this.status),
      this.syncStatusControls());
  }
  syncStatusControls() {
    const e = this.overlay.querySelector("[data-status-details]");
    (e && (e.disabled = !this.status.enabled || !this.onStatusDetails),
      this.overlay.querySelectorAll("[data-status-setting]").forEach((t) => {
        var r;
        const n = t.dataset.statusSetting;
        ((t.checked = !!this.status[n]),
          n !== "enabled" &&
            ((t.disabled = !this.status.enabled),
            (r = t.closest(".dim")) == null ||
              r.classList.toggle("is-disabled", !this.status.enabled)));
      }));
  }
  setAside(e, t) {
    if (t) this.asidePinned = e;
    else if (this.asidePinned) return;
    if (this.asideMode === e) return;
    ((this.asideMode = e), this.overlay.classList.toggle("is-aside", e));
    const n = this.overlay.querySelector('[data-el="handle"]');
    n &&
      (n.setAttribute("aria-pressed", String(e)),
      n.setAttribute(
        "aria-label",
        e
          ? "Bring the sheet back to the centre"
          : "Move the sheet aside to see the arena",
      ));
  }
  startPadNav() {
    var e;
    this.padNavPoll ||
      ((this.padNavPrev = (
        ((e = this.firstPad()) == null ? void 0 : e.buttons) ?? []
      ).map((t) => t.pressed)),
      (this.padNavKey = this.controllerKey(this.firstPad())),
      (this.padNavDir = null),
      (this.padNavPoll = requestAnimationFrame(this.pollPadNav)));
  }
  stopPadNav() {
    (this.padNavPoll && cancelAnimationFrame(this.padNavPoll),
      (this.padNavPoll = 0),
      (this.padNavDir = null),
      document.body.classList.remove("pad-nav"));
  }
  setInputSource(e) {
    this.inputSource !== e &&
      ((this.inputSource = e),
      document.body.classList.toggle("pad-nav", e === "pad"),
      this.updatePadHints());
  }
  markPadNav() {
    this.setInputSource("pad");
  }
  updatePadHints() {
    const e = this.padLayout === "playstation",
      t = e ? "L1" : "LB",
      n = e ? "R1" : "RB",
      r = e ? "Cross" : "A",
      s = e ? "Circle" : "B",
      a = this.inputSource === "pad",
      o = this.overlay.querySelector('[data-el="hintPrev"]'),
      A = this.overlay.querySelector('[data-el="hintNext"]');
    (o && ((o.textContent = t), (o.hidden = !a)),
      A && ((A.textContent = n), (A.hidden = !a)));
    const l = this.overlay.querySelector('[data-el="padLegend"]');
    l &&
      ((l.hidden = !a),
      (l.innerHTML = [
        ["D-pad", "Move"],
        ["← →", "Adjust"],
        [r, "Select"],
        [s, "Close"],
      ]
        .map(
          ([c, h]) =>
            `<span class="pad-legend__item"><kbd>${Na(c)}</kbd>${Na(h)}</span>`,
        )
        .join("")));
  }
  focusables() {
    return Array.from(
      this.sheet.querySelectorAll(
        'button, summary, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter(
      (e) =>
        !e.hasAttribute("disabled") &&
        e.offsetParent !== null &&
        !e.closest(".touch-preview"),
    );
  }
  padFocusables() {
    return this.focusables().filter(
      (e) =>
        e.dataset.settingsTab === void 0 && e.dataset.settingsPanel === void 0,
    );
  }
  movePadFocus(e) {
    const t = this.padFocusables();
    if (t.length === 0) return;
    const n = t.indexOf(document.activeElement),
      r = n === -1 ? (e > 0 ? 0 : t.length - 1) : (n + e + t.length) % t.length,
      s = t[r];
    (s.focus(), s.scrollIntoView({ block: "nearest" }));
  }
  focusPanelStart() {
    var n;
    const e = this.overlay.querySelector(
      `[data-settings-panel="${this.activeTab}"]`,
    );
    (n =
      (e ? this.padFocusables().find((r) => e.contains(r)) : void 0) ??
      this.overlay.querySelector('[data-el="handle"]')) == null || n.focus();
  }
  adjustFocused(e) {
    var n;
    const t = document.activeElement;
    if (t instanceof HTMLInputElement && t.type === "range") {
      const r = Number(t.step) || 1,
        s = Number(t.min),
        a = Number(t.max),
        o = Math.max(s, Math.min(a, Number(t.value) + e * r));
      ((t.value = String(Math.round(o / r) * r)),
        t.dispatchEvent(new Event("input", { bubbles: !0 })),
        t.dispatchEvent(new Event("change", { bubbles: !0 })));
      return;
    }
    if (t instanceof HTMLInputElement && t.type === "checkbox") {
      const r = e > 0;
      if (t.checked === r) return;
      ((t.checked = r), t.dispatchEvent(new Event("change", { bubbles: !0 })));
      return;
    }
    if (t instanceof HTMLSelectElement) {
      let r = t.selectedIndex + e;
      for (; (n = t.options[r]) != null && n.disabled; ) r += e;
      if (r < 0 || r >= t.options.length) return;
      ((t.selectedIndex = r),
        t.dispatchEvent(new Event("change", { bubbles: !0 })));
      return;
    }
    t instanceof HTMLElement && t.dataset.settingsTab && this.stepTab(e);
  }
  padActivate() {
    const e = document.activeElement;
    e instanceof HTMLElement && this.sheet.contains(e) && e.click();
  }
  stepTab(e) {
    if (this.touchPanel.isEditing) return;
    const t = CM,
      n = t.indexOf(this.activeTab),
      r = t[(n + e + t.length) % t.length];
    (this.selectTab(r), this.focusPanelStart());
  }
  restoreDefaults() {
    var e;
    if (this.activeTab === "graphics") {
      (Object.assign(this.graphics, graphicsSettings.defaults()),
        graphicsSettings.save(this.graphics),
        this.onGraphicsChange?.(this.graphics), this.syncGraphicsControls());
      return;
    }
    if (this.activeTab === "camera") {
      (Object.assign(this.target, Ps),
        this.syncCameraControls(),
        this.persistCamera(),
        this.setStatus("Camera restored to defaults."));
      return;
    }
    if (this.activeTab === "training") {
      (Object.assign(this.trainingTarget, trainingDefaults),
        this.syncTrainingControls(),
        this.persistTraining(),
        this.onTrainingChange(this.trainingTarget),
        this.setStatus("Training restored to defaults."));
      return;
    }
    if (this.activeTab === "audio") {
      (setMasterVolume(lg.masterVolume),
        this.syncAudioControls(),
        this.setStatus("Audio restored to defaults."));
      return;
    }
    (this.touchPanel.restoreDefaults(),
      Pf(this.bindings, "keyboard"),
      Pf(this.bindings, "pad"),
      PC(this.bindings),
      this.renderParts(),
      this.syncAxisControls(),
      this.commitBindings("All controls restored to defaults."));
  }
  selectTab(e) {
    if (!CM.includes(e)) return;
    var t;
    (this.touchPanel.cancel(),
      this.cancelCapture(),
      (this.asidePinned = !1),
      this.setAside(!1, !1),
      (this.activeTab = e),
      this.overlay.querySelectorAll("[data-settings-tab]").forEach((n) => {
        const r = n.dataset.settingsTab === e;
        (n.classList.toggle("is-active", r),
          n.setAttribute("aria-selected", String(r)),
          r && n.scrollIntoView({ block: "nearest", inline: "nearest" }));
      }),
      this.overlay.querySelectorAll("[data-settings-panel]").forEach((n) => {
        n.hidden = n.dataset.settingsPanel !== e;
      }),
      (t = this.overlay.querySelector(".sheet-body")) == null ||
        t.scrollTo({ top: 0 }),
      e === "controls" && this.refreshPadStatus());
  }
  trapFocus(e) {
    if (e.key !== "Tab" || this.capture) return;
    const t = this.focusables();
    if (t.length === 0) return;
    const n = t[0],
      r = t[t.length - 1];
    e.shiftKey && document.activeElement === n
      ? (e.preventDefault(), r.focus())
      : !e.shiftKey &&
        document.activeElement === r &&
        (e.preventDefault(), n.focus());
  }
  persistCamera() {
    cameraSettings.save(this.target);
  }
  persistTraining() {
    trainingSettings.save(this.trainingTarget);
  }
}

export { SettingsPanel };
