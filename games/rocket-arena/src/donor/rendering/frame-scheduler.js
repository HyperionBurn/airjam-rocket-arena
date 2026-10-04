import { _ } from "../core/class-fields.js";

// Schedules rendering around GPU completion fences and the selected frame cap.
class FrameScheduler {
  constructor(e, t, n, maintain = null) {
    this.maintain = maintain; this.lastMaintenance = 0;
    _(this, "channel", new MessageChannel());
    _(this, "pending", []);
    _(this, "gl");
    _(this, "render");
    _(this, "displayFrame");
    _(this, "running", !1);
    _(this, "queued", !1);
    _(this, "displayRequest", null);
    _(this, "frameTimer", null);
    _(this, "frameTask", null);
    _(this, "frameInterval", 0);
    _(this, "nextFrameTime", 0);
    _(this, "idleUntil", 0);
    _(this, "wake", () => {
      if (!this.active()) {
        (this.clearFrameTimer(),
          (this.nextFrameTime = 0),
          (this.idleUntil = 0),
          this.clearPending(),
          this.displayRequest !== null &&
            cancelAnimationFrame(this.displayRequest),
          (this.displayRequest = null));
        return;
      }
      (this.displayRequest === null &&
        (this.displayRequest = requestAnimationFrame(this.measureDisplay)),
        this.schedule());
    });
    _(this, "measureDisplay", (e) => {
      ((this.displayRequest = null),
        this.active() &&
          (this.displayFrame(e),
          (this.displayRequest = requestAnimationFrame(this.measureDisplay))));
    });
    _(this, "queueTick", () => {
      ((this.frameTimer = null),
        (this.frameTask = null),
        !(this.queued || !this.active()) &&
          ((this.queued = !0), this.channel.port2.postMessage(null)));
    });
    _(this, "tick", () => {
      if (((this.queued = !1), !this.active())) return;
      const e = performance.now();
      if ((this.frameInterval > 0 && e < this.nextFrameTime) || e < this.idleUntil) {
        this.schedule();
        return;
      }
      const t = this.gl;
      for (; this.pending.length > 0; ) {
        const n = t.clientWaitSync(this.pending[0], 0, 0);
        if (n === t.TIMEOUT_EXPIRED) break;
        if (n === t.WAIT_FAILED)
          throw (
            this.dispose(),
            new Error("Could not check completion of a rendered frame.")
          );
        t.deleteSync(this.pending.shift());
      }
      if (this.pending.length >= 2 && this.maintain && e - this.lastMaintenance >= 1000 / 120) {
        // GPU completion must not starve online input/physics. This optional
        // callback does not draw, change a preset, or run offline networking.
        this.lastMaintenance = e; this.maintain(e);
      }
      if (this.pending.length < 2) {
        if (this.frameInterval > 0) {
          const r = this.nextFrameTime + this.frameInterval;
          this.nextFrameTime = r > e ? r : e + this.frameInterval;
        }
        if (this.render(e) === false) {
          // A clean home/pause screen drew nothing: no GPU fence or flush needed.
          this.idleUntil = e + 16;
          this.schedule();
          return;
        }
        this.idleUntil = 0;
        const n = t.fenceSync(t.SYNC_GPU_COMMANDS_COMPLETE, 0);
        if (n) this.pending.push(n);
        else if (!t.isContextLost())
          throw (
            this.dispose(),
            new Error("Could not track completion of a rendered frame.")
          );
        t.flush();
      }
      this.schedule();
    });
    ((this.gl = e),
      (this.render = t),
      (this.displayFrame = n),
      (this.channel.port1.onmessage = this.tick),
      document.addEventListener("visibilitychange", this.wake),
      e.canvas.addEventListener("webglcontextlost", this.wake),
      e.canvas.addEventListener("webglcontextrestored", this.wake));
  }
  start() {
    ((this.running = !0), this.wake());
  }
  setFpsLimit(e) {
    const t = e !== null && Number.isFinite(e) && e > 0 ? 1e3 / e : 0;
    t !== this.frameInterval &&
      ((this.frameInterval = t),
      (this.nextFrameTime = 0),
      this.clearFrameTimer(),
      this.schedule());
  }
  dispose() {
    ((this.running = !1),
      this.clearFrameTimer(),
      this.clearPending(),
      this.displayRequest !== null && cancelAnimationFrame(this.displayRequest),
      this.channel.port1.close(),
      this.channel.port2.close(),
      document.removeEventListener("visibilitychange", this.wake),
      this.gl.canvas.removeEventListener("webglcontextlost", this.wake),
      this.gl.canvas.removeEventListener("webglcontextrestored", this.wake));
  }
  active() {
    return this.running && !document.hidden && !this.gl.isContextLost();
  }
  clearPending() {
    for (const e of this.pending) this.gl.deleteSync(e);
    this.pending.length = 0;
  }
  clearFrameTimer() {
    var e;
    (this.frameTimer !== null && clearTimeout(this.frameTimer),
      (this.frameTimer = null),
      (e = this.frameTask) == null || e.abort(),
      (this.frameTask = null));
  }
  schedule() {
    var e;
    if (
      !(
        this.queued ||
        this.frameTimer !== null ||
        this.frameTask !== null ||
        !this.active()
      )
    ) {
      // Yield while both GPU slots are occupied, even with no FPS cap.
      // Posting messages immediately here busy-spins on clientWaitSync.
      if (this.frameInterval > 0 || this.pending.length >= 2 || this.idleUntil > 0) {
        const t = Math.max(
          this.frameInterval > 0 ? this.nextFrameTime - performance.now() : 0,
          this.pending.length >= 2 ? 1 : 0,
          this.idleUntil - performance.now(),
        );
        if (t > 0) {
          const n = Math.max(1, Math.floor(t));
          if ((e = globalThis.scheduler) != null && e.postTask) {
            const r = new AbortController();
            ((this.frameTask = r),
              globalThis.scheduler
                .postTask(this.queueTick, { delay: n, signal: r.signal })
                .catch((s) => {
                  if (!r.signal.aborted) throw s;
                }));
          } else this.frameTimer = setTimeout(this.queueTick, n);
          return;
        }
      }
      this.queueTick();
    }
  }
}

export { FrameScheduler };
