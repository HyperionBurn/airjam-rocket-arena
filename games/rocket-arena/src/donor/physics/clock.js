// Authoritative scheduling stays in seconds at 120 Hz; rendering only interpolates.
export class PhysicsClock {
  constructor(sim, { ballOffset = 0, ballSize = 18, maxCatchUpTicks = 12 } = {}) {
    this.sim = sim;
    this.ballOffset = ballOffset;
    this.ballSize = ballSize;
    this.maxCatchUpTicks = maxCatchUpTicks;
    this.dt = 1 / 120;
    this.prevState = sim.state.slice();
    this.currState = sim.state.slice();
    this.alpha = this.accumulator = 0;
    this.lastTime = -1;
    this.lastTicks = this.lastDropped = this.lastBlocked = 0;
    this.lastStalled = false;
    this.tick = this.totalDropped = this.totalBlocked = 0;
    this.onTick = null;
  }

  syncBall() {
    const ball = this.sim.state.subarray(this.ballOffset, this.ballOffset + this.ballSize);
    this.prevState.set(ball, this.ballOffset);
    this.currState.set(ball, this.ballOffset);
  }

  sync(now = performance.now()) {
    this.prevState.set(this.sim.state);
    this.currState.set(this.sim.state);
    this.accumulator = this.alpha = 0;
    this.lastTime = now;
    this.lastTicks = this.lastDropped = this.lastBlocked = 0;
    this.lastStalled = false;
  }

  update(now, sampleControls = () => {}, advance) {
    if (!Number.isFinite(now)) throw new TypeError("Frame time must be finite");
    if (this.lastTime < 0) this.lastTime = now;
    const elapsed = Math.max(0, (now - this.lastTime) / 1000);
    this.lastTime = now;
    this.lastStalled = elapsed > 0.25;
    this.accumulator += elapsed;
    // Epsilon only compensates floating point boundaries, not missing time.
    const due = Math.floor(this.accumulator / this.dt + 1e-9);
    this.accumulator = Math.max(0, this.accumulator - due * this.dt);
    const count = Math.min(due, this.maxCatchUpTicks);
    this.lastDropped = due - count;
    this.totalDropped += this.lastDropped;
    this.lastTicks = this.lastBlocked = 0;
    for (let index = 0; index < count; index++) {
      sampleControls(this.tick + 1);
      let advanced = true;
      if (advance) advanced = advance() !== false;
      else this.sim.step(1);
      if (!advanced) {
        // Pauses/goals intentionally stop the batch, unlike slow bot inference.
        this.lastBlocked = count - index;
        this.totalBlocked += this.lastBlocked;
        this.accumulator = 0;
        this.prevState.set(this.currState);
        break;
      }
      this.prevState.set(this.currState);
      this.currState.set(this.sim.state);
      this.lastTicks++;
      this.tick++;
      this.onTick?.(this.tick, this.currState);
    }
    this.alpha = Math.min(this.accumulator / this.dt, 1);
  }

  metrics() {
    return Object.freeze({
      physicsHz: 120, schedulerTick: this.tick,
      scheduledSeconds: this.tick * this.dt,
      lastTicks: this.lastTicks, lastDropped: this.lastDropped,
      totalDropped: this.totalDropped, lastBlocked: this.lastBlocked,
      totalBlocked: this.totalBlocked, lastStalled: this.lastStalled,
      alpha: this.alpha,
    });
  }
}
