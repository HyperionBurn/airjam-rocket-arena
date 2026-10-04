// Sample actual GPU execution asynchronously, never fence latency or CPU time.
// At most two outstanding queries, two samples per second, and twenty results.
export class GpuFrameTimer {
  constructor(gl) {
    this.gl = gl;
    this.extension = gl.getExtension('EXT_disjoint_timer_query_webgl2');
    this.pending = [];
    this.active = null;
    this.samples = [];
    this.nextSample = 0;
    this.lastSample = 0;
  }
  begin(enabled, now = performance.now()) {
    if (!this.extension) return;
    if (!enabled || this.gl.isContextLost()) {
      if (!enabled || this.gl.isContextLost()) this.dispose();
      return;
    }
    if (now < this.nextSample || this.active) return;
    this.nextSample = now + 500;
    const gl = this.gl, extension = this.extension;
    if (gl.getParameter(extension.GPU_DISJOINT_EXT)) {
      this.dispose();
      this.nextSample = now + 500;
      return;
    }
    while (this.pending.length && gl.getQueryParameter(this.pending[0], gl.QUERY_RESULT_AVAILABLE)) {
      const query = this.pending.shift();
      const milliseconds = gl.getQueryParameter(query, gl.QUERY_RESULT) / 1e6;
      gl.deleteQuery(query);
      if (Number.isFinite(milliseconds) && milliseconds >= 0) {
        this.samples.push(milliseconds);
        if (this.samples.length > 20) this.samples.shift();
        this.lastSample = now;
      }
    }
    if (this.pending.length >= 2) return;
    const query = gl.createQuery();
    if (!query) return;
    gl.beginQuery(extension.TIME_ELAPSED_EXT, query);
    this.active = query;
  }
  end() {
    if (!this.active) return;
    if (!this.gl.isContextLost()) {
      this.gl.endQuery(this.extension.TIME_ELAPSED_EXT);
      this.pending.push(this.active);
    } else this.gl.deleteQuery(this.active);
    this.active = null;
  }
  snapshot(now = performance.now()) {
    const available = this.samples.length > 0 && now - this.lastSample < 15000;
    return {
      supported: !!this.extension,
      milliseconds: available ? this.samples.reduce((sum, value) => sum + value, 0) / this.samples.length : null,
    };
  }
  dispose() {
    if (this.active) {
      if (!this.gl.isContextLost()) this.gl.endQuery(this.extension.TIME_ELAPSED_EXT);
      this.gl.deleteQuery(this.active);
      this.active = null;
    }
    for (const query of this.pending) this.gl.deleteQuery(query);
    this.pending.length = this.samples.length = 0;
    this.lastSample = 0;
  }
}
