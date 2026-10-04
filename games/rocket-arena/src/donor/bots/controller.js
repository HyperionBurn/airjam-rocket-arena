import { _ } from "../core/class-fields.js";
import { JA, pl } from "./catalog.js";
import { wA } from "./actions.js";
import { XM } from "./observations.js";
import { NextoAgent } from "./nexto.js";
import { NectoAgent } from "./necto.js";
import { SeerAgent } from "./seer.js";

function Dc(i) {
  return i === "seer" ? new SeerAgent() : i === "necto" ? new NectoAgent() : new NextoAgent();
}

class BotController {
  constructor(e = "nexto") {
    _(this, "worker", null);
    _(this, "loading", new Map());
    _(this, "ready", new Set());
    _(this, "pending", new Map());
    _(this, "sequence", 0);
    _(this, "generation", 0);
    _(this, "action", { ...wA });
    _(this, "selectedId");
    _(this, "adapter");
    _(this, "error", null);
    _(this, "onError", null);
    ((this.selectedId = e), (this.adapter = Dc(e)));
  }
  get id() {
    return this.selectedId;
  }
  get option() {
    return JA(this.selectedId);
  }
  get isReady() {
    return this.ready.has(this.selectedId);
  }
  get controls() {
    return { ...this.action };
  }
  select(e) {
    e !== this.selectedId &&
      (this.reset(), (this.selectedId = e), (this.adapter = Dc(e)));
  }
  getKickoffControls(e, t) {
    return this.option.scriptedKickoff ? XM(e, t) : null;
  }
  async preloadAll() {
    for (const e of pl) await this.loadPolicy(e.id);
  }
  load() {
    return this.loadPolicy(this.selectedId);
  }
  async loadPolicy(e) {
    if (this.ready.has(e)) return;
    const t = this.loading.get(e);
    if (t) return t;
    this.error = null;
    const n = this.worker ?? this.createWorker(),
      r = Dc(e),
      s = this.send(
        {
          kind: "load",
          botId: e,
          url: new URL(JA(e).modelUrl, location.href).href,
          inputs: r.initialInputs(),
          outputNames: r.outputNames,
        },
        12e4,
      )
        .then(() => {
          this.worker === n && this.ready.add(e);
        })
        .catch((a) => {
          throw (this.worker === n && this.fail(a), a);
        })
        .finally(() => {
          this.loading.get(e) === s && this.loading.delete(e);
        });
    return (this.loading.set(e, s), s);
  }
  createWorker() {
    const e = new Worker(
      new URL("/assets/worker-iFqqV1m9.js", import.meta.url),
      { type: "module" },
    );
    return (
      (this.worker = e),
      (e.onmessage = ({ data: t }) => {
        const n = this.pending.get(t.id);
        n &&
          (window.clearTimeout(n.timer),
          this.pending.delete(t.id),
          t.kind === "error" ? n.reject(new Error(t.error)) : n.resolve(t));
      }),
      (e.onerror = (t) =>
        this.fail(
          new Error(t.message || "The bot worker stopped unexpectedly."),
        )),
      (e.onmessageerror = () =>
        this.fail(
          new Error("The bot worker returned an unreadable response."),
        )),
      e
    );
  }
  reset() {
    (this.generation++, (this.action = { ...wA }), this.adapter.reset());
  }
  overrideControls(e) {
    this.action = { ...e };
  }
  async decide(e, t, n, r) {
    if (!this.isReady) throw new Error(this.error || "Bot is not ready.");
    const s = this.generation;
    try {
      const a = this.adapter.build(e, t, this.action, n, r),
        o = await this.send(
          {
            kind: "decide",
            botId: this.selectedId,
            inputs: a,
            outputNames: this.adapter.outputNames,
          },
          15e3,
        );
      return s !== this.generation
        ? this.controls
        : ((this.action = this.adapter.decode(o.outputs)), this.controls);
    } catch (a) {
      if (s !== this.generation) return this.controls;
      throw (this.fail(a instanceof Error ? a : new Error(String(a))), a);
    }
  }
  dispose() {
    var e;
    (this.reset(),
      (e = this.worker) == null || e.terminate(),
      (this.worker = null),
      this.ready.clear(),
      this.loading.clear());
    for (const t of this.pending.values())
      (window.clearTimeout(t.timer),
        t.reject(new Error("Bot session closed.")));
    (this.pending.clear(), (this.action = { ...wA }));
  }
  send(e, t) {
    return new Promise((n, r) => {
      if (!this.worker) {
        r(new Error("Bot worker is unavailable."));
        return;
      }
      const s = ++this.sequence,
        a = window.setTimeout(() => {
          (this.pending.delete(s),
            r(
              new Error(
                "The bot took too long to respond. Please try starting the match again.",
              ),
            ));
        }, t);
      (this.pending.set(s, { resolve: n, reject: r, timer: a }),
        this.worker.postMessage({ ...e, id: s }));
    });
  }
  fail(e) {
    var t, n;
    ((this.error = e.message), this.ready.clear(), this.loading.clear());
    for (const r of this.pending.values())
      (window.clearTimeout(r.timer), r.reject(e));
    (this.pending.clear(),
      (t = this.worker) == null || t.terminate(),
      (this.worker = null),
      (n = this.onError) == null || n.call(this, e.message));
  }
}

export { BotController };
