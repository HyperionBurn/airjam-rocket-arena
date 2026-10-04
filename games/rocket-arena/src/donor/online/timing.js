// Bounded telemetry: record cheaply, summarize only when the HUD/diagnostic asks.
// These are measurements, not a competitive-readiness certification.
export class TimingWindow {
  constructor(capacity = 240) {
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 4096) throw Error('Invalid timing capacity');
    this.values = new Float32Array(capacity); this.cursor = 0; this.count = 0; this.total = 0; this.maximum = 0;
  }
  add(value) {
    if (!Number.isFinite(value) || value < 0) return;
    this.values[this.cursor++ % this.values.length] = value;
    this.count = Math.min(this.values.length, this.count + 1); this.total++; this.maximum = Math.max(this.maximum, value);
  }
  summary() {
    const sorted = Array.from(this.values.subarray(0, this.count)).sort((a,b)=>a-b);
    const at = q => sorted[Math.max(0, Math.ceil(sorted.length*q)-1)] ?? 0;
    return { samples: this.count, total: this.total, p50Ms: at(.5), p95Ms: at(.95), p99Ms: at(.99), maxMs: this.maximum };
  }
}
