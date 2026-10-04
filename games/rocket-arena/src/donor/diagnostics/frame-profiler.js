import { _ } from "../core/class-fields.js";

const Yn = 1e4;

const Nc = 120;

const bs = ["sim", "scene", "camera", "prep", "bloom", "final"];

const fm = 1e3;

const rB = [
    30, 48, 50, 60, 72, 75, 90, 100, 120, 144, 165, 175, 200, 240, 360, 480,
    500, 540, 600,
  ];

class FrameProfiler {
  constructor() {
    _(this, "frameMs", new Float32Array(Yn));
    _(this, "cpuMs", new Float32Array(Yn));
    _(this, "stamp", new Float64Array(Yn));
    _(
      this,
      "phaseMs",
      bs.map(() => new Float32Array(Yn)),
    );
    _(this, "ticks", new Float32Array(Yn));
    _(this, "scratch", new Float32Array(Yn));
    _(this, "write", 0);
    _(this, "count", 0);
    _(this, "frameStartedAt", 0);
    _(this, "previousFrameAt", 0);
    _(this, "lastMarkAt", 0);
    _(this, "phaseIndex", 0);
    _(this, "pending", new Float32Array(bs.length));
    _(this, "droppedTicks", 0);
    _(this, "clampedFrames", 0);
    _(this, "stalls", 0);
    _(this, "resumes", 0);
    _(this, "displayMs", new Float32Array(Nc));
    _(this, "previousDisplayAt", -1);
    _(this, "displayWrite", 0);
    _(this, "displayCount", 0);
  }
  displayFrame(e) {
    const t = e - this.previousDisplayAt;
    (this.previousDisplayAt >= 0 &&
      t > 0 &&
      t < fm &&
      ((this.displayMs[this.displayWrite] = t),
      (this.displayWrite = (this.displayWrite + 1) % Nc),
      (this.displayCount = Math.min(this.displayCount + 1, Nc))),
      (this.previousDisplayAt = e));
  }
  frameStart() {
    const e = performance.now();
    ((this.previousFrameAt = this.frameStartedAt),
      (this.frameStartedAt = e),
      (this.lastMarkAt = e),
      (this.phaseIndex = 0),
      this.pending.fill(0));
  }
  mark() {
    if (this.phaseIndex >= bs.length) return;
    const e = performance.now();
    ((this.pending[this.phaseIndex] = e - this.lastMarkAt),
      (this.lastMarkAt = e),
      (this.phaseIndex += 1));
  }
  frameEnd(e, t, n) {
    if (this.previousFrameAt === 0) return;
    const r = performance.now() - this.frameStartedAt;
    if (this.frameStartedAt - this.previousFrameAt > fm) {
      this.resumes += 1;
      return;
    }
    const s = this.frameStartedAt - this.previousFrameAt,
      a = this.write;
    ((this.frameMs[a] = s),
      (this.cpuMs[a] = r),
      (this.stamp[a] = this.frameStartedAt));
    for (let o = 0; o < bs.length; o += 1) this.phaseMs[o][a] = this.pending[o];
    ((this.ticks[a] = e),
      (this.write = (this.write + 1) % Yn),
      this.count < Yn && (this.count += 1),
      t > 0 && ((this.droppedTicks += t), (this.clampedFrames += 1)),
      n && (this.stalls += 1));
  }
  resetCounters() {
    ((this.droppedTicks = 0),
      (this.clampedFrames = 0),
      (this.stalls = 0),
      (this.resumes = 0));
  }
  at(e) {
    return (((this.write - this.count + Yn) % Yn) + e) % Yn;
  }
  percentile(e, t, n) {
    if (t === 0) return 0;
    const r = Math.min(t - 1, Math.max(0, Math.round(n * (t - 1))));
    return e[r];
  }
  statsOf(e, t) {
    let n = 0;
    for (let a = 0; a < t; a += 1) {
      const o = e[this.at(a)];
      ((this.scratch[a] = o), (n += o));
    }
    const r = this.scratch.subarray(0, t);
    r.sort();
    const s = n / t;
    return {
      avgMs: s,
      p50: this.percentile(r, t, 0.5),
      p95: this.percentile(r, t, 0.95),
      p99: this.percentile(r, t, 0.99),
      worstMs: r[t - 1],
      fps: s > 0 ? 1e3 / s : 0,
    };
  }
  snapshot(e = 240, t = 10) {
    if (this.count > 0) {
      const k = this.stamp[this.at(this.count - 1)] - t * 1e3;
      for (; this.count > 1 && this.stamp[this.at(0)] < k; ) this.count -= 1;
    }
    const n = this.count,
      r = { avgMs: 0, p50: 0, p95: 0, p99: 0, worstMs: 0, fps: 0 };
    if (n === 0)
      return {
        count: 0,
        windowSeconds: 0,
        frame: r,
        cpu: r,
        refreshHz: 60,
        budgetMs: 1e3 / 60,
        overBudgetPct: 0,
        phases: [],
        sim: { ticksPerFrame: 0, droppedTicks: 0, clampedFrames: 0, stalls: 0 },
        history: new Float32Array(0),
        historySeconds: 0,
      };
    const s = this.statsOf(this.frameMs, n),
      a = this.statsOf(this.cpuMs, n);
    this.scratch.set(this.displayMs.subarray(0, this.displayCount));
    const o = this.scratch.subarray(0, this.displayCount);
    o.sort();
    const A = this.percentile(o, this.displayCount, 0.1);
    let l = A > 0 ? 1e3 / A : 60,
      c = !1;
    for (const k of rB)
      if (Math.abs(l - k) / k < 0.08) {
        ((l = k), (c = !0));
        break;
      }
    c || (l = Math.round(l));
    const h = 1e3 / l;
    let d = 0;
    for (let k = 0; k < n; k += 1)
      this.frameMs[this.at(k)] > h * 1.02 && (d += 1);
    const u = [];
    let p = 0;
    for (let k = 0; k < bs.length; k += 1) {
      let x = 0;
      for (let R = 0; R < n; R += 1) x += this.phaseMs[k][this.at(R)];
      const T = x / n;
      ((p += T), u.push({ phase: bs[k], avgMs: T, share: 0 }));
    }
    const v = Math.max(0, a.avgMs - p);
    u.push({ phase: "other", avgMs: v, share: 0 });
    for (const k of u) k.share = a.avgMs > 0 ? k.avgMs / a.avgMs : 0;
    let g = 0;
    for (let k = 0; k < n; k += 1) g += this.ticks[this.at(k)];
    const m = Math.max(1, Math.round(e)),
      y = new Float32Array(m),
      C = this.stamp[this.at(n - 1)],
      E = t * 1e3,
      w = E / m;
    let S = C;
    for (let k = 0; k < n; k += 1) {
      const x = this.at(k),
        T = C - this.stamp[x];
      if (T > E) continue;
      this.stamp[x] < S && (S = this.stamp[x]);
      const R = Math.min(m - 1, m - 1 - Math.floor(T / w));
      this.frameMs[x] > y[R] && (y[R] = this.frameMs[x]);
    }
    for (let k = 1; k < m; k += 1) y[k] === 0 && (y[k] = y[k - 1]);
    for (let k = m - 2; k >= 0; k -= 1) y[k] === 0 && (y[k] = y[k + 1]);
    return {
      count: n,
      windowSeconds: (C - S) / 1e3,
      frame: s,
      cpu: a,
      refreshHz: l,
      budgetMs: h,
      overBudgetPct: (d / n) * 100,
      phases: u,
      sim: {
        ticksPerFrame: g / n,
        droppedTicks: this.droppedTicks,
        clampedFrames: this.clampedFrames,
        stalls: this.stalls,
      },
      history: y,
      historySeconds: Math.min(t, (C - S) / 1e3),
    };
  }
}

export { FrameProfiler };
