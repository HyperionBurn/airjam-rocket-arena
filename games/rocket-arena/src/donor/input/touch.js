import { _ } from "../core/class-fields.js";
import { nb } from "../vendor/joystick.js";
import { B0, La, M0, yA } from "./touch-layout.js";

const tA = 0.08;

const Uf = new Set([
    "Space",
    "Enter",
    "Tab",
    "Escape",
    "ArrowDown",
    "ArrowUp",
    "ArrowLeft",
    "ArrowRight",
    "Home",
    "End",
  ]);

const qf = (i, e, t) => Math.max(e, Math.min(t, i));

class TouchInput {
  constructor(e) {
    _(this, "onReset", null);
    _(this, "onBallCamToggle", null);
    _(this, "onBallControl", null);
    _(this, "root");
    _(this, "stickZone");
    _(this, "trainingGroup");
    _(this, "settings", La.load());
    _(this, "resetButton");
    _(this, "coarsePointer", window.matchMedia("(any-pointer: coarse)"));
    _(this, "manager", null);
    _(this, "inputEnabled", !0);
    _(this, "matchActive", !1);
    _(this, "prefersTouch", !0);
    _(this, "stickEngaged", !1);
    _(this, "stickX", 0);
    _(this, "stickY", 0);
    _(this, "resizeTimer", 0);
    _(this, "heldPointers", {
      jump: new Set(),
      boost: new Set(),
      handbrake: new Set(),
      airRollLeft: new Set(),
      airRollRight: new Set(),
      airRoll: new Set(),
    });
    _(this, "keyboardHeld", new Set());
    _(this, "tapPointers", new Map());
    _(this, "controls", {
      throttle: 0,
      steer: 0,
      pitch: 0,
      yaw: 0,
      roll: 0,
      jump: !1,
      boost: !1,
      handbrake: !1,
    });
    _(this, "hideForExternalInput", () => {
      this.prefersTouch && ((this.prefersTouch = !1), this.syncVisibility());
    });
    _(this, "syncVisibility", () => {
      const e = this.inputEnabled && this.available() && this.prefersTouch;
      this.root.hidden !== !e &&
        ((this.root.hidden = !e),
        document.body.classList.toggle("touch-controls-enabled", e),
        e
          ? (yA(this.root, this.settings, this.matchActive),
            this.rebuildJoystick())
          : (this.clearState(), this.destroyJoystick()));
    });
    _(this, "scheduleJoystickRebuild", () => {
      (this.clearState(),
        this.resizeTimer && window.clearTimeout(this.resizeTimer),
        (this.resizeTimer = window.setTimeout(() => {
          ((this.resizeTimer = 0),
            this.root.hidden ||
              (yA(this.root, this.settings, this.matchActive),
              this.rebuildJoystick()));
        }, 120)));
    });
    _(this, "clearState", () => {
      ((this.stickEngaged = !1),
        (this.stickX = 0),
        (this.stickY = 0),
        this.tapPointers.clear(),
        this.keyboardHeld.clear(),
        this.root.querySelectorAll("[data-touch-tap]").forEach((e) => {
          e.classList.remove("is-active");
        }));
      for (const e of Object.keys(this.heldPointers)) {
        this.heldPointers[e].clear();
        const t = this.root.querySelector(`[data-touch-hold="${e}"]`);
        t && this.syncHoldButton(t, e);
      }
      this.resetControls();
    });
    (e.insertAdjacentHTML(
      "beforeend",
      `<div id="touch-controls" class="touch-controls" hidden aria-label="Touch controls">${B0()}</div>`,
    ),
      (this.root = e.querySelector("#touch-controls")),
      (this.stickZone = this.root.querySelector("[data-touch-stick]")),
      (this.trainingGroup = this.root.querySelector(".touch-ball-actions")),
      (this.resetButton = this.root.querySelector('[data-touch-tap="reset"]')));
    const t = (n) => {
      Uf.has(n.code) && n.stopPropagation();
    };
    (this.root.addEventListener("keydown", t),
      this.root.addEventListener("keyup", t),
      this.root.querySelectorAll("[data-touch-hold]").forEach((n) => {
        this.bindHoldButton(n, n.dataset.touchHold);
      }),
      this.root.querySelectorAll("[data-touch-tap]").forEach((n) => {
        this.bindTapButton(n, n.dataset.touchTap);
      }));
    for (const n of [
      "pointerdown",
      "pointerup",
      "pointercancel",
      "mousedown",
      "mouseup",
      "click",
      "dblclick",
      "auxclick",
      "touchstart",
      "touchend",
    ])
      this.root.addEventListener(n, (r) => r.stopPropagation());
    (this.coarsePointer.addEventListener("change", this.syncVisibility),
      window.addEventListener(
        "keydown",
        (n) => {
          (this.root.contains(n.target) && Uf.has(n.code)) ||
            n.repeat ||
            this.hideForExternalInput();
        },
        !0,
      ),
      window.addEventListener(
        "pointerdown",
        (n) => {
          if (n.pointerType === "mouse" && !this.root.contains(n.target)) {
            this.hideForExternalInput();
            return;
          }
          (n.pointerType !== "touch" && n.pointerType !== "pen") ||
            this.prefersTouch ||
            ((this.prefersTouch = !0), this.syncVisibility());
        },
        { capture: !0, passive: !0 },
      ),
      window.addEventListener(M0, (n) => {
        this.clearState();
        const r = n.detail;
        (r
          ? Object.assign(this.settings, structuredClone(r))
          : La.loadInto(this.settings),
          yA(this.root, this.settings, this.matchActive),
          this.rebuildJoystick());
      }),
      window.addEventListener("resize", this.scheduleJoystickRebuild),
      window.addEventListener("blur", this.clearState),
      document.addEventListener("visibilitychange", () => {
        document.hidden && this.clearState();
      }),
      this.syncVisibility());
  }
  get enabled() {
    return this.inputEnabled;
  }
  set enabled(e) {
    e !== this.inputEnabled &&
      ((this.inputEnabled = e), this.clearState(), this.syncVisibility());
  }
  setMatchActive(e) {
    if (
      e !== this.matchActive &&
      ((this.matchActive = e),
      (this.trainingGroup.hidden = e),
      (this.resetButton.hidden = e),
      e)
    ) {
      this.resetButton.classList.remove("is-active");
      for (const [t, n] of this.tapPointers)
        n !== "ballCam" && this.tapPointers.delete(t);
    }
  }
  active() {
    return (
      this.inputEnabled &&
      !this.root.hidden &&
      (this.stickEngaged ||
        this.isHeld("jump") ||
        this.isHeld("boost") ||
        this.isHeld("handbrake") ||
        this.isHeld("airRollLeft") ||
        this.isHeld("airRollRight") ||
        this.isHeld("airRoll"))
    );
  }
  read() {
    if (!this.inputEnabled || this.root.hidden)
      return (this.resetControls(), this.controls);
    const e = this.axisWithDeadzone(this.stickX),
      t = this.axisWithDeadzone(this.stickY),
      n = this.isHeld("handbrake");
    ((this.controls.throttle = t),
      (this.controls.steer = e),
      (this.controls.pitch = -t));
    const r = this.isHeld("airRollLeft"),
      s = this.isHeld("airRollRight"),
      a = n || this.isHeld("airRoll");
    return (
      (this.controls.yaw = r || s || !a ? e : 0),
      (this.controls.roll = r || s ? Number(s) - Number(r) : a ? e : 0),
      (this.controls.jump = this.isHeld("jump")),
      (this.controls.boost = this.isHeld("boost")),
      (this.controls.handbrake = n),
      this.controls
    );
  }
  available() {
    return navigator.maxTouchPoints > 0 || this.coarsePointer.matches;
  }
  joystickSize() {
    return Math.round(this.stickZone.getBoundingClientRect().width * 0.9);
  }
  rebuildJoystick() {
    if ((this.destroyJoystick(), this.root.hidden)) return;
    this.manager = nb.create({
      zone: this.stickZone,
      mode: "static",
      position: { left: "50%", top: "50%" },
      size: this.joystickSize(),
      threshold: tA,
      restOpacity: 0.72,
      fadeTime: 100,
      color: {
        front: "rgba(221, 229, 239, 0.28)",
        back: "rgba(14, 20, 29, 0.72)",
      },
    });
    const e = this.manager;
    (e.on("start", () => {
      this.stickEngaged = !0;
    }),
      e.on("move", ({ data: t }) => {
        ((this.stickEngaged = !0),
          (this.stickX = qf(t.vector.x, -1, 1)),
          (this.stickY = qf(t.vector.y, -1, 1)),
          (this.root.dataset.stickX = this.stickX.toFixed(3)),
          (this.root.dataset.stickY = this.stickY.toFixed(3)));
      }),
      e.on("end", () => {
        ((this.stickEngaged = !1),
          (this.stickX = 0),
          (this.stickY = 0),
          (this.root.dataset.stickX = "0.000"),
          (this.root.dataset.stickY = "0.000"));
      }));
  }
  destroyJoystick() {
    var e;
    ((e = this.manager) == null || e.destroy(),
      (this.manager = null),
      (this.stickEngaged = !1),
      (this.stickX = 0),
      (this.stickY = 0),
      (this.root.dataset.stickX = "0.000"),
      (this.root.dataset.stickY = "0.000"));
  }
  bindHoldButton(e, t) {
    const n = (s) => {
        !this.inputEnabled ||
          this.root.hidden ||
          (this.heldPointers[t].add(s), this.syncHoldButton(e, t));
      },
      r = (s) => {
        (this.heldPointers[t].delete(s), this.syncHoldButton(e, t));
      };
    (e.addEventListener("pointerdown", (s) => {
      (s.preventDefault(),
        s.stopPropagation(),
        e.setPointerCapture(s.pointerId),
        n(s.pointerId));
    }),
      e.addEventListener("pointerup", (s) => {
        (s.preventDefault(), r(s.pointerId));
      }),
      e.addEventListener("pointercancel", (s) => r(s.pointerId)),
      e.addEventListener("lostpointercapture", (s) => r(s.pointerId)),
      e.addEventListener("keydown", (s) => {
        !this.inputEnabled ||
          this.root.hidden ||
          (s.code !== "Space" && s.code !== "Enter") ||
          (s.preventDefault(),
          this.keyboardHeld.add(t),
          this.syncHoldButton(e, t));
      }),
      e.addEventListener("keyup", (s) => {
        (s.code !== "Space" && s.code !== "Enter") ||
          (s.preventDefault(),
          this.keyboardHeld.delete(t),
          this.syncHoldButton(e, t));
      }),
      e.addEventListener("blur", () => {
        (this.keyboardHeld.delete(t), this.syncHoldButton(e, t));
      }),
      e.addEventListener("click", (s) => s.preventDefault()));
  }
  bindTapButton(e, t) {
    (e.addEventListener("pointerdown", (r) => {
      !this.inputEnabled ||
        this.root.hidden ||
        (r.preventDefault(),
        r.stopPropagation(),
        e.setPointerCapture(r.pointerId),
        this.tapPointers.set(r.pointerId, t),
        e.classList.add("is-active"));
    }),
      e.addEventListener("pointerup", (r) => {
        (r.preventDefault(),
          this.tapPointers.get(r.pointerId) === t && this.fireTap(t),
          this.tapPointers.delete(r.pointerId),
          e.classList.remove("is-active"));
      }));
    const n = (r) => {
      (this.tapPointers.delete(r.pointerId), e.classList.remove("is-active"));
    };
    (e.addEventListener("pointercancel", n),
      e.addEventListener("lostpointercapture", n),
      e.addEventListener("click", (r) => {
        r.detail === 0 && this.fireTap(t);
      }));
  }
  fireTap(e) {
    var t, n, r;
    !this.inputEnabled ||
      this.root.hidden ||
      (this.matchActive && e !== "ballCam") ||
      (e === "ballCam"
        ? (t = this.onBallCamToggle) == null || t.call(this)
        : e === "reset"
          ? (n = this.onReset) == null || n.call(this)
          : (r = this.onBallControl) == null || r.call(this, e));
  }
  isHeld(e) {
    return this.heldPointers[e].size > 0 || this.keyboardHeld.has(e);
  }
  syncHoldButton(e, t) {
    const n = this.isHeld(t);
    (e.classList.toggle("is-active", n),
      e.setAttribute("aria-pressed", String(n)),
      (this.root.dataset[t] = n ? "1" : "0"));
  }
  axisWithDeadzone(e) {
    const t = Math.abs(e);
    return t <= tA ? 0 : Math.sign(e) * ((t - tA) / (1 - tA));
  }
  resetControls() {
    ((this.controls.throttle = 0),
      (this.controls.steer = 0),
      (this.controls.pitch = 0),
      (this.controls.yaw = 0),
      (this.controls.roll = 0),
      (this.controls.jump = !1),
      (this.controls.boost = !1),
      (this.controls.handbrake = !1));
  }
}

export { TouchInput };
