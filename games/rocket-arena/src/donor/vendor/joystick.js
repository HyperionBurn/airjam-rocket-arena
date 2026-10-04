// Preserved bundled dependency. See SOURCE.md and public/licenses/.

const HA = "dynamic";

const Qo = "semi";

const Ac = "static";

const JC = typeof window < "u" && "ontouchstart" in window;

const Lf = {
    start: "mousedown",
    move: "mousemove",
    end: "mouseup, mouseleave",
    pressure: "webkitmouseforcechanged",
  };

let EA;

let _0;

typeof window < "u" && window.PointerEvent
  ? (EA = {
      start: "pointerdown",
      move: "pointermove",
      end: "pointerup, pointercancel, pointerleave",
      pressure: "webkitmouseforcechanged",
    })
  : JC
    ? ((EA = {
        start: "touchstart",
        move: "touchmove",
        end: "touchend, touchcancel",
        pressure: "webkitmouseforcechanged",
      }),
      (_0 = Lf))
    : (EA = Lf);

const Ff = EA;

const Yr = _0;

const vs = Math.PI / 4;

const Df = Math.PI / 2;

const eA = (i, e) => {
    const t = e.x - i.x,
      n = e.y - i.y;
    return Math.sqrt(t * t + n * n);
  };

const Ph = (i) => i * (Math.PI / 180);

const KC = (i) => i * (180 / Math.PI);

const lc = new Map();

const Nf = (i) => {
    (lc.has(i) && clearTimeout(lc.get(i)), lc.set(i, setTimeout(i, 100)));
  };

const UA = (i, e, t) => {
    const n = e.split(/[ ,]+/g);
    for (let r = 0; r < n.length; r += 1) i.addEventListener(n[r], t, !1);
  };

const qA = (i, e, t) => {
    const n = e.split(/[ ,]+/g);
    for (let r = 0; r < n.length; r += 1) i.removeEventListener(n[r], t);
  };

const E0 = (i) =>
    "force" in i
      ? i.force
      : "pressure" in i
        ? i.pressure
        : "webkitForce" in i
          ? i.webkitForce / 3
          : "buttons" in i && i.buttons !== 0
            ? 1
            : 0;

const y0 = (i, e) => ({
    identifier:
      "identifier" in e ? e.identifier : "pointerId" in e ? e.pointerId : 1,
    isTouch: "touches" in i || "changedTouches" in i,
    position: { x: e.pageX, y: e.pageY },
    pressure: E0(e),
    type: i.type,
    initial: i,
    raw: e,
  });

const Ih = () => ({ x: window.scrollX, y: window.scrollY });

const Gf = (i, e) => {
    const { left: t, top: n, right: r, bottom: s, x: a, y: o } = e;
    n || r || s || t
      ? Zn(i.style, { top: n, right: r, bottom: s, left: t })
      : (yn(a) || yn(o)) &&
        Zn(i.style, {
          left: yn(a) ? `${a}px` : void 0,
          top: yn(o) ? `${o}px` : void 0,
        });
  };

const ua = (i, e = "") => ({ [i]: e });

const Zn = (i, e) => {
    for (const t in e) Object.hasOwn(e, t) && (i[t] = e[t]);
    return i;
  };

const yn = (i) => typeof i == "number" && !isNaN(i);

const Zr = { debug: 0, info: 1, warning: 2, error: 3, none: 4 };

let js = "warning";

class co {
  constructor(e) {
    ((this.uid = 0),
      (this.index = 0),
      (this.name = "super"),
      (this._domHandlers_ = new Map()),
      (this._handlers_ = {}),
      (this.name = e),
      this.log("construct", this.name, this.index));
  }
  mapOnEvents(e, t) {
    const n = e.split(/[ ,]+/g);
    for (let r = 0; r < n.length; r += 1) t(n[r]);
  }
  on(e, t) {
    this.mapOnEvents(e, (n) => {
      ((this._handlers_[n] = this._handlers_[n] || new Set()),
        this._handlers_[n].add(t));
    });
  }
  off(e, t) {
    e === void 0
      ? (this._handlers_ = {})
      : this.mapOnEvents(e, (n) => {
          t === void 0
            ? (this._handlers_[n] = new Set())
            : this._handlers_[n] && this._handlers_[n].delete(t);
        });
  }
  trigger(e, t) {
    this.mapOnEvents(e, (n) => {
      this.log(`- "${n}" [trigger]`);
      const r = this._handlers_[n];
      if (r && r.size) {
        const s = [...r];
        for (const a of s) a.call(this, { type: n, target: this, data: t });
      }
    });
  }
  bindEvt(e, t, n) {
    const r = (s) => {
      for (const a of ((o) => {
        o.type.toLowerCase().includes("move") && o.preventDefault();
        const A = [];
        if ("changedTouches" in o)
          for (const l of Array.from(o.changedTouches)) l && A.push(l);
        else A.push(o);
        return A.map((l) => y0(o, l));
      })(s))
        (this.log(`- "${t}" [dom:trigger:${a.identifier}]`), n.call(this, a));
    };
    (this._domHandlers_.set(n, r),
      UA(e, Ff[t], r),
      Yr != null && Yr[t] && UA(e, Yr[t], r));
  }
  unbindEvt(e, t, n) {
    const r = this._domHandlers_.get(n);
    r
      ? (qA(e, Ff[t], r),
        Yr != null && Yr[t] && qA(e, Yr[t], r),
        this._domHandlers_.delete(n))
      : this.error(`Internal handler not found for event ${t}.`, n);
  }
  logPrefix() {
    return { super: "", joystick: "  ", collection: "    ", factory: "      " }[
      this.name
    ];
  }
  logSuffix() {
    return `[${this.name}|${this.uid}]`;
  }
  static get logLevel() {
    return js;
  }
  static set logLevel(e) {
    js = e;
  }
  log(...e) {
    Zr[js] <= Zr.debug && console.log(this.logPrefix(), ...e, this.logSuffix());
  }
  info(...e) {
    Zr[js] <= Zr.info && console.info(this.logPrefix(), ...e, this.logSuffix());
  }
  warn(...e) {
    Zr[js] <= Zr.warning &&
      console.warn(this.logPrefix(), ...e, this.logSuffix());
  }
  error(...e) {
    Zr[js] <= Zr.error &&
      console.error(this.logPrefix(), ...e, this.logSuffix());
  }
}

const x0 = class C0 extends co {
  constructor(e, t) {
    (super("joystick"),
      (this.direction = {}),
      (this.defaults = {
        size: 100,
        threshold: 0.1,
        color: "white",
        fadeTime: 250,
        dataOnly: !1,
        restJoystick: !0,
        restOpacity: 0.5,
        mode: "dynamic",
        zone: document.body,
        lockX: !1,
        lockY: !1,
        shape: "circle",
      }),
      (this.position = t.position),
      (this.frontPosition = t.frontPosition),
      (this.collection = e),
      (this.options = { ...this.defaults, ...t }),
      this.options.mode === "dynamic" && (this.options.restOpacity = 0),
      (this.uid = C0.index++),
      (this.ui = {
        el: document.createElement("div"),
        back: document.createElement("div"),
        front: document.createElement("div"),
      }));
  }
  init() {
    (this.options.dataOnly || this.buildEl(),
      this.trigger("added", this),
      this.trigger("joystickCreated", this));
  }
  get identifier() {
    return this._identifier;
  }
  set identifier(e) {
    yn(e)
      ? ((this._identifier = e),
        this.trigger("attached", {
          collection: this.collection,
          joystick: this,
          identifier: e,
        }))
      : (this.trigger("detached", {
          collection: this.collection,
          joystick: this,
          identifier: this._identifier,
        }),
        (this._identifier = void 0));
  }
  resolveColors() {
    const e = this.options.color;
    return typeof e == "object" && e !== null ? e : { front: e, back: e };
  }
  buildEl() {
    ((this.ui.el.className = `joystick collection_${this.collection.uid}`),
      (this.ui.back.className = "back"),
      (this.ui.front.className = "front"),
      this.ui.el.setAttribute(
        "id",
        `joystick_${this.collection.uid}_${this.uid}`,
      ),
      this.ui.el.appendChild(this.ui.back),
      this.ui.el.appendChild(this.ui.front));
    const e = `${this.options.fadeTime}ms`,
      t = ua("borderRadius", "50%"),
      n = ua("transition", `opacity ${e}`),
      r = this.resolveColors();
    (Zn(this.ui.el.style, {
      position: "absolute",
      opacity: this.options.restOpacity.toString(),
      display: "block",
      zIndex: "999",
      touchAction: "none",
      userSelect: "none",
      ...n,
    }),
      Zn(this.ui.back.style, {
        position: "absolute",
        display: "block",
        width: `${this.options.size}px`,
        height: `${this.options.size}px`,
        left: "0",
        marginLeft: -this.options.size / 2 + "px",
        marginTop: -this.options.size / 2 + "px",
        background: r.back,
        ...(this.options.shape === "circle" ? t : {}),
      }),
      Zn(this.ui.front.style, {
        width: this.options.size / 2 + "px",
        height: this.options.size / 2 + "px",
        position: "absolute",
        display: "block",
        left: "0",
        marginLeft: -this.options.size / 4 + "px",
        marginTop: -this.options.size / 4 + "px",
        background: r.front,
        opacity: ".5",
        transform: "translate(0px, 0px)",
        ...t,
      }));
  }
  get pressure() {
    return this._pressure ?? 0;
  }
  set pressure(e) {
    e !== this._pressure && ((this._pressure = e), this.trigger("pressure", e));
  }
  startPressureInterval(e) {
    this.pressureInterval ||
      (this.pressureInterval = window.setInterval(() => {
        this.pressure = E0(e);
      }, 100));
  }
  stopPressureInterval() {
    (clearInterval(this.pressureInterval), (this.pressureInterval = void 0));
  }
  addToDom() {
    this.options.dataOnly ||
      this.options.zone.contains(this.ui.el) ||
      this.options.zone.appendChild(this.ui.el);
  }
  removeFromDom() {
    !this.options.dataOnly &&
      this.options.zone.contains(this.ui.el) &&
      this.options.zone.removeChild(this.ui.el);
  }
  clearTimeouts() {
    (clearTimeout(this.removeTimeout),
      clearTimeout(this.showTimeout),
      clearTimeout(this.restTimeout),
      clearTimeout(this.activeTimeout),
      (this.removeTimeout = void 0),
      (this.showTimeout = void 0),
      (this.restTimeout = void 0),
      (this.activeTimeout = void 0));
  }
  start(e, t) {
    (this.trigger("start", this),
      this.clearTimeouts(),
      this.options.dataOnly
        ? typeof t == "function" && t.call(this)
        : (this.addToDom(),
          this.startPressureInterval(e),
          requestAnimationFrame(() => {
            this.ui.el.style.opacity = "1";
          }),
          (this.showTimeout = window.setTimeout(() => {
            ((this.showTimeout = void 0),
              this.trigger("shown", this),
              typeof t == "function" && t.call(this));
          }, this.options.fadeTime))));
  }
  end(e) {
    if (
      (this.resetDirection(),
      this.clearTimeouts(),
      this.stopPressureInterval(),
      (this.pressure = 0),
      this.trigger("end", this),
      this.options.dataOnly)
    )
      typeof e == "function" && e.call(this);
    else {
      if (
        ((this.ui.el.style.opacity = this.options.restOpacity.toString()),
        this.options.restJoystick)
      ) {
        const t = this.options.restJoystick,
          n = {
            x: t === !0 || t.x !== !1 ? 0 : this.frontPosition.x,
            y: t === !0 || t.y !== !1 ? 0 : this.frontPosition.y,
          };
        this.setPosition(e, n);
      }
      (clearTimeout(this.removeTimeout),
        (this.removeTimeout = window.setTimeout(() => {
          ((this.removeTimeout = void 0),
            (this.ui.el.style.display =
              this.options.mode === HA ? "none" : "block"),
            this.trigger("hidden", this),
            this.options.mode === HA &&
              (this.trigger("removed", this), this.destroy()),
            typeof e == "function" && e.call(this));
        }, this.options.fadeTime)));
    }
  }
  setTransition(e = !1, t) {
    if (e) {
      const r = Zn(
        ua("transition", "transform 100ms"),
        ua(
          "transform",
          `translate(${this.frontPosition.x}px, ${this.frontPosition.y}px)`,
        ),
      );
      (Zn(this.ui.front.style, r),
        clearTimeout(this.activeTimeout),
        (this.activeTimeout = window.setTimeout(() => {
          ((this.activeTimeout = void 0),
            typeof t == "function" && t.call(this));
        }, 100)));
    } else Zn(this.ui.front.style, ua("transition", "none"));
  }
  setPosition(e, t) {
    ((this.frontPosition = { x: t.x, y: t.y }),
      this.setTransition(!0),
      clearTimeout(this.restTimeout),
      (this.restTimeout = window.setTimeout(() => {
        ((this.restTimeout = void 0),
          typeof e == "function" && e.call(this),
          this.setTransition(!1),
          this.trigger("rested", this));
      }, this.options.fadeTime)));
  }
  resetDirection() {
    this.direction = {};
  }
  computeDirectionAndTriggerEvents(e) {
    const t = e.angle.radian,
      n = {};
    return (
      t > vs && t < 3 * vs && !e.lockX
        ? (n.angle = "up")
        : t > -vs && t <= vs && !e.lockY
          ? (n.angle = "left")
          : t > 3 * -vs && t <= -vs && !e.lockX
            ? (n.angle = "down")
            : e.lockY || (n.angle = "right"),
      e.lockY || (n.x = t > -Df && t < Df ? "left" : "right"),
      e.lockX || (n.y = t > 0 ? "up" : "down"),
      (e.angle = {
        radian: Ph(180 - e.angle.degree),
        degree: 180 - e.angle.degree,
      }),
      this.triggerDirectionEvents(e, n),
      e
    );
  }
  triggerDirectionEvents(e, t) {
    if (e.force > this.options.threshold) {
      const n = {
        x: this.direction.x,
        y: this.direction.y,
        angle: this.direction.angle,
      };
      ((this.direction = t),
        (e.direction = t),
        n.x !== t.x && this.trigger(`plain plain:${t.x}`, e),
        n.y !== t.y && this.trigger(`plain plain:${t.y}`, e),
        n.angle !== t.angle && this.trigger(`dir dir:${t.angle}`, e));
    } else this.resetDirection();
    this.trigger("move", e);
  }
  destroy() {
    (this.clearTimeouts(),
      (this.identifier = void 0),
      this.removeFromDom(),
      this.trigger("joystickDestroyed", this),
      this.off());
  }
};

x0.index = 0;

let YC = x0;

const b0 = class S0 extends co {
  constructor(e, t) {
    (super("collection"),
      (this.all = new Map()),
      (this.idles = new Set()),
      (this.actives = new Map()),
      (this.resting = new Map()),
      (this.parentIsFlex = !1),
      (this.defaults = {
        catchDistance: 200,
        color: "white",
        dataOnly: !1,
        dynamicPage: !1,
        fadeTime: 250,
        follow: !1,
        lockX: !1,
        lockY: !1,
        maxNumberOfJoysticks: 10,
        mode: HA,
        multitouch: !1,
        position: { top: "0px", left: "0px" },
        restJoystick: !0,
        restOpacity: 0.5,
        shape: "circle",
        size: 100,
        threshold: 0.1,
        zone: document.body,
      }),
      (this.factory = e),
      (this.uid = S0.index++),
      (this.options = { ...this.defaults, ...t }),
      (this.options.mode !== Ac && this.options.mode !== Qo) ||
        (this.options.multitouch = !1),
      this.options.multitouch || (this.options.maxNumberOfJoysticks = 1));
    const n =
      this.options.zone.parentElement &&
      getComputedStyle(this.options.zone.parentElement);
    ((n == null ? void 0 : n.display) === "flex" && (this.parentIsFlex = !0),
      getComputedStyle(this.options.zone).position === "static" &&
        this.warn(
          'The zone element has no CSS "position" set (it is "static").',
          "Joysticks may not be positioned correctly.",
          'Set "position: relative" (or absolute/fixed) on the zone element.',
        ),
      (this.box = this.options.zone.getBoundingClientRect()),
      this.bindEvt(this.options.zone, "start", this.processOnStart),
      Zn(this.options.zone.style, {
        touchAction: "none",
        userSelect: "none",
        webkitUserSelect: "none",
      }),
      typeof ResizeObserver < "u" &&
        ((this.resizeObserver = new ResizeObserver(() => {
          this.reposition();
        })),
        this.resizeObserver.observe(this.options.zone)));
  }
  init() {
    (this.trigger("collectionCreated", this),
      this.options.mode === Ac &&
        this.createJoystick(this.options.position).addToDom());
  }
  getJoystickByUid(e) {
    return e === void 0 ? this.all.values().next().value : this.all.get(e);
  }
  bindJoystick(e) {
    (e.on("joystickDestroyed", () => {
      this.deleteJoystickFromLists(e);
    }),
      e.on("attached", (t) => {
        (this.idles.delete(t.data.joystick.uid),
          this.actives.set(t.data.identifier, e));
      }),
      e.on("detached", (t) => {
        (this.idles.add(t.data.joystick.uid),
          this.deleteIdentifierFromLists(t.data.identifier));
      }),
      e.on("end", (t) => {
        (yn(t.data.identifier) &&
          (this.actives.delete(t.data.identifier),
          this.resting.set(t.data.identifier, e)),
          this.idles.add(t.data.uid));
      }),
      e.on("start", (t) => {
        yn(t.data.identifier) && this.resting.delete(t.data.identifier);
      }),
      e.on("hidden", (t) => {
        yn(t.data.identifier) && this.resting.delete(t.data.identifier);
      }),
      e.on("pressure", (t) => {
        this.trigger(`pressure ${e.uid}:pressure`, t.data);
      }),
      e.on("attached detached", (t) => {
        const n = `${t.type} ${t.data.joystick.uid}:${t.type}`;
        this.trigger(n, t.data);
      }),
      e.on(
        "added start shown hidden rested removed end joystickCreated joystickDestroyed",
        (t) => {
          const n = `${t.type} ${t.data.uid}:${t.type}`;
          this.trigger(n, t.data);
        },
      ),
      e.on("move", (t) => {
        this.trigger(`move ${t.data.instance.uid}:move`, t.data);
      }),
      e.on("dir dir:up dir:right dir:down dir:left", (t) => {
        const n = `${t.type} ${t.data.instance.uid}:${t.type}`;
        this.trigger(n, t.data);
      }),
      e.on("plain plain:up plain:right plain:down plain:left", (t) => {
        const n = `${t.type} ${t.data.instance.uid}:${t.type}`;
        this.trigger(n, t.data);
      }));
  }
  deleteJoystickFromLists(e) {
    (this.deleteUidFromLists(e.uid),
      yn(e.identifier) && this.deleteIdentifierFromLists(e.identifier));
  }
  deleteUidFromLists(e) {
    (this.all.delete(e), this.idles.delete(e));
  }
  deleteIdentifierFromLists(e) {
    (this.actives.delete(e), this.resting.delete(e));
  }
  getOrCreate(e) {
    if (this.options.mode === Qo || this.options.mode === Ac) {
      const t = this.idles.values().next().value;
      if (yn(t)) {
        const n = this.all.get(t);
        if (n) return n;
        (this.error(`Couldn't find the joystick ${t}. Creating a new one.`),
          this.deleteUidFromLists(t));
      }
      if (this.options.mode === Qo) return this.createJoystick(e);
      this.warn("Couldn't find the expected joystick. Creating a new one.");
    }
    return this.createJoystick(e);
  }
  createJoystick(e) {
    const t = this.factory.scroll,
      n = this.parentIsFlex ? t.x : t.x + this.box.left,
      r = this.parentIsFlex ? t.y : t.y + this.box.top;
    let s, a;
    if (yn(e.x) && yn(e.y))
      ((s = { x: e.x - n, y: e.y - r }), (a = { x: e.x, y: e.y }));
    else {
      if (!(e.top || e.right || e.bottom || e.left))
        return void this.error("Invalid or missing position.", e);
      {
        const A = document.createElement("DIV");
        (Zn(A.style, {
          visibility: "hidden",
          position: "absolute",
          top: e.top,
          right: e.right,
          bottom: e.bottom,
          left: e.left,
        }),
          this.options.zone.appendChild(A));
        const l = A.getBoundingClientRect();
        (this.options.zone.removeChild(A),
          (s = e),
          (a = { x: l.left + t.x, y: l.top + t.y }));
      }
    }
    const o = new YC(this, {
      color: this.options.color,
      size: this.options.size,
      threshold: this.options.threshold,
      fadeTime: this.options.fadeTime,
      dataOnly: this.options.dataOnly,
      restJoystick: this.options.restJoystick,
      restOpacity: this.options.restOpacity,
      mode: this.options.mode,
      position: a,
      zone: this.options.zone,
      frontPosition: { x: 0, y: 0 },
      shape: this.options.shape,
    });
    return (
      this.all.has(o.uid) &&
        this.error(`Joystick with uid ${o.uid} already exists.`),
      this.options.dataOnly ||
        (Gf(o.ui.el, s), Gf(o.ui.front, o.frontPosition)),
      this.all.set(o.uid, o),
      this.idles.add(o.uid),
      this.bindJoystick(o),
      o.init(),
      o
    );
  }
  processOnStart(e, t = 0) {
    if (
      ((this.box = this.options.zone.getBoundingClientRect()),
      !this.actives.has(e.identifier) &&
        this.actives.size >= this.options.maxNumberOfJoysticks)
    )
      return void this.warn("No more joysticks allowed.");
    const n =
        this.actives.get(e.identifier) ||
        this.resting.get(e.identifier) ||
        this.getOrCreate(e.position),
      r = () => {
        (n.start(e.raw),
          (n.identifier = e.identifier),
          this.processOnMove(e, !0));
      };
    this.options.mode === Qo
      ? eA(e.position, n.position) <= this.options.catchDistance
        ? r()
        : t < 3
          ? (n.destroy(), this.processOnStart(e, t + 1))
          : this.error("Max semi-mode recursion depth reached.")
      : r();
  }
  processOnMove(e, t = !1) {
    const n = this.actives.get(e.identifier),
      r = this.factory.scroll;
    if (!n)
      return (
        this.error(
          `Found zombie joystick onMove with identifier ${e.identifier}`,
        ),
        void this.deleteIdentifierFromLists(e.identifier)
      );
    this.options.dynamicPage && this.reposition();
    const s = n.options.size / 2;
    let a = { x: e.position.x, y: e.position.y };
    (this.options.lockX && (a.y = n.position.y),
      this.options.lockY && (a.x = n.position.x));
    let o = eA(a, n.position);
    const A = ((y, C) => {
        const E = C.x - y.x,
          w = C.y - y.y;
        return KC(Math.atan2(w, E));
      })(a, n.position),
      l = Ph(A),
      c = o / s,
      h = { distance: o, position: a };
    let d, u;
    n.options.shape === "circle"
      ? ((d = Math.min(o, s)),
        (u = ((y, C, E) => {
          const w = Ph(E);
          return { x: y.x - C * Math.cos(w), y: y.y - C * Math.sin(w) };
        })(n.position, d, A)))
      : ((u = ((y, C, E) => ({
          x: Math.min(Math.max(y.x, C.x - E), C.x + E),
          y: Math.min(Math.max(y.y, C.y - E), C.y + E),
        }))(a, n.position, s)),
        (d = eA(u, n.position)));
    let p = { x: 0, y: 0 };
    if (this.options.follow) {
      if (o > s) {
        const y = a.x - u.x,
          C = a.y - u.y;
        ((p = { x: y, y: -C }),
          (n.position.x += y),
          (n.position.y += C),
          Zn(n.ui.el.style, {
            top: n.position.y - (this.box.top + r.y) + "px",
            left: n.position.x - (this.box.left + r.x) + "px",
          }),
          (o = eA(a, n.position)));
      }
    } else ((a = u), (o = d));
    const v = a.x - n.position.x,
      g = a.y - n.position.y;
    ((n.frontPosition = { x: v, y: g }),
      this.options.dataOnly ||
        (t &&
          n.setTransition(!0, () => {
            n.setTransition(!1);
          }),
        (n.ui.front.style.transform = `translate(${v}px,${g}px)`)));
    const m = {
      position: a,
      force: c,
      pressure: e.pressure,
      distance: o,
      angle: { radian: l, degree: A },
      vector: { x: v / s, y: -g / s },
      raw: h,
      instance: n,
      lockX: this.options.lockX,
      lockY: this.options.lockY,
      baseDelta: p,
    };
    n.computeDirectionAndTriggerEvents(m);
  }
  processOnEnd(e) {
    const t = this.actives.get(e.identifier);
    if (!t)
      return (
        this.error(
          `Found zombie joystick onEnd with identifier ${e.identifier}`,
        ),
        void this.deleteIdentifierFromLists(e.identifier)
      );
    t.end();
  }
  reposition() {
    ((this.factory.scroll = Ih()),
      (this.box = this.options.zone.getBoundingClientRect()));
    const e = this.factory.scroll;
    this.all.forEach((t) => {
      if (t.options.dataOnly) return;
      const n = t.ui.el.getBoundingClientRect();
      t.position = { x: e.x + n.left, y: e.y + n.top };
    });
  }
  destroy() {
    (this.resizeObserver &&
      (this.resizeObserver.disconnect(), (this.resizeObserver = void 0)),
      this.unbindEvt(this.options.zone, "start", this.processOnStart),
      this.all.forEach((e) => {
        e.destroy();
      }),
      this.all.clear(),
      this.idles.clear(),
      this.actives.clear(),
      this.resting.clear(),
      this.trigger("collectionDestroyed", this),
      this.off());
  }
};

b0.index = 0;

let ZC = b0;

const w0 = new (class extends co {
    constructor() {
      (super("factory"),
        (this.scroll = Ih()),
        (this.binded = !1),
        (this.joysticksByUid = new Map()),
        (this.joysticksByIdentifier = new Map()),
        (this.collections = new Set()),
        (this.resizeHandler = null),
        (this.scrollHandler = null),
        (this.repositionAll = () => {
          this.collections.forEach((i) => {
            i.reposition();
          });
        }),
        (this.refreshScroll = () => {
          this.scroll = Ih();
        }),
        this.bindResize(),
        this.bindScroll(),
        this.trigger("factoryCreated", this));
    }
    bindResize() {
      ((this.resizeHandler = () => Nf(this.repositionAll)),
        UA(window, "resize", this.resizeHandler));
    }
    bindScroll() {
      ((this.scrollHandler = () => Nf(this.refreshScroll)),
        UA(window, "scroll", this.scrollHandler));
    }
    getJoystickByUid(i) {
      return this.joysticksByUid.get(i);
    }
    getJoystickByIdentifier(i) {
      return this.joysticksByIdentifier.get(i);
    }
    create(i) {
      const e = new ZC(this, i);
      return (this.bindCollection(e), this.collections.add(e), e.init(), e);
    }
    removeJoystickFromLists(i) {
      (this.joysticksByUid.delete(i.uid),
        yn(i.identifier) && this.joysticksByIdentifier.delete(i.identifier));
    }
    bindCollection(i) {
      (i.on("collectionDestroyed", (e) => {
        (this.collections.delete(e.data),
          e.data.all.forEach((t) => {
            this.removeJoystickFromLists(t);
          }),
          this.unbindDocument());
      }),
        i.on("joystickDestroyed", (e) => {
          (this.removeJoystickFromLists(e.data), this.unbindDocument());
        }),
        i.on("end", (e) => {
          (yn(e.data.identifier) &&
            this.joysticksByIdentifier.delete(e.data.identifier),
            this.unbindDocument());
        }),
        i.on("added", (e) => {
          (this.joysticksByUid.set(e.data.uid, e.data), this.bindDocument());
        }),
        i.on("attached", (e) => {
          this.joysticksByIdentifier.set(e.data.identifier, e.data.joystick);
        }),
        i.on("pressure", (e) => {
          this.trigger(`pressure ${e.target.uid}:pressure`, e.data);
        }),
        i.on("collectionCreated collectionDestroyed", (e) => {
          const t = `${e.type} ${e.data.uid}:${e.type}`;
          this.trigger(t, e.data);
        }),
        i.on("attached detached", (e) => {
          const t = `${e.type} ${e.data.joystick.uid}:${e.type}`;
          this.trigger(t, e.data);
        }),
        i.on(
          "added start shown hidden rested removed end joystickCreated joystickDestroyed",
          (e) => {
            const t = `${e.type} ${e.data.uid}:${e.type}`;
            this.trigger(t, e.data);
          },
        ),
        i.on("move", (e) => {
          this.trigger(`move ${e.data.instance.uid}:move`, e.data);
        }),
        i.on("dir dir:up dir:right dir:down dir:left", (e) => {
          const t = `${e.type} ${e.data.instance.uid}:${e.type}`;
          this.trigger(t, e.data);
        }),
        i.on("plain plain:up plain:right plain:down plain:left", (e) => {
          const t = `${e.type} ${e.data.instance.uid}:${e.type}`;
          this.trigger(t, e.data);
        }));
    }
    cleanInactiveTouches(i) {
      if (!("touches" in i.initial)) return;
      const e = Array.from(i.initial.touches).map((n) => n.identifier);
      this.log(
        "Cleaning inactive",
        e,
        Array.from(this.joysticksByIdentifier.keys()),
      );
      const t = Array.from(this.joysticksByIdentifier.entries());
      for (const [n, r] of t)
        if (r.collection.options.mode === HA && !e.includes(n)) {
          if (!r)
            return void this.error(
              `No collection found for cleaning identifier ${n}`,
            );
          this.log("💣 Cleaning", n);
          const s = i.raw;
          r.collection.processOnEnd(
            y0(i.initial, {
              identifier: n,
              pageX: s.pageX,
              pageY: s.pageY,
              clientX: s.clientX,
              clientY: s.clientY,
            }),
          );
        }
    }
    bindDocument() {
      this.binded ||
        (this.log("bind dom"),
        this.bindEvt(document, "start", this.onstart),
        this.bindEvt(document, "move", this.onmove),
        this.bindEvt(document, "end", this.onend),
        this.bindEvt(document, "pressure", this.onpressure),
        (this.binded = !0));
    }
    unbindDocument(i = !1) {
      !this.binded ||
        (this.joysticksByUid.size && i !== !0) ||
        (this.log((i ? "force " : "") + "unbind dom"),
        this.unbindEvt(document, "start", this.onstart),
        this.unbindEvt(document, "move", this.onmove),
        this.unbindEvt(document, "end", this.onend),
        this.unbindEvt(document, "pressure", this.onpressure),
        (this.binded = !1));
    }
    onstart(i) {
      this.cleanInactiveTouches(i);
    }
    onmove(i) {
      this.handleEventInCollection(i, (e) => {
        e.processOnMove(i);
      });
    }
    onend(i) {
      (this.cleanInactiveTouches(i),
        this.handleEventInCollection(i, (e) => {
          e.processOnEnd(i);
        }));
    }
    onpressure(i) {
      i.initial.preventDefault();
      const e = this.joysticksByIdentifier.get(i.identifier);
      e
        ? (e.pressure = i.pressure)
        : this.error(`No joystick found for pressure event ${i.identifier}`);
    }
    handleEventInCollection(i, e) {
      const t = this.joysticksByIdentifier.get(i.identifier);
      t && e(t.collection);
    }
    destroy() {
      (this.unbindDocument(!0),
        this.collections.forEach((i) => {
          i.destroy();
        }),
        this.resizeHandler &&
          (qA(window, "resize", this.resizeHandler),
          (this.resizeHandler = null)),
        this.scrollHandler &&
          (qA(window, "scroll", this.scrollHandler),
          (this.scrollHandler = null)),
        this.trigger("factoryDestroyed", this),
        this.off());
    }
  })();

const QC = (i) => w0.create(i);

const eb = (i) => {
    co.logLevel = i;
  };

const tb = () => co.logLevel;

var nb = { create: QC, factory: w0, setLogLevel: eb, getLogLevel: tb };

export { nb };
