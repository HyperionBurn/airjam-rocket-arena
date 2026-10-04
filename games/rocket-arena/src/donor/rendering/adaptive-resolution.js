// Frame cadence includes GPU stalls; CPU submission time alone does not.
// Change slowly, ignore pauses, and never alter the simulation or CSS resolution.
export class AdaptiveResolution {
  constructor(maximum = 1) {
    this.maximum = maximum;
    this.minimum = Math.min(0.7, maximum);
    this.scale = maximum;
    this.reset();
  }
  reset() {
    this.elapsed = 0;
    this.frames = 0;
    this.goodWindows = 0;
  }
  sample(delta, targetFps, active) {
    if (!active || delta <= 0 || delta > 150) {
      this.reset();
      return this.scale;
    }
    this.elapsed += delta;
    this.frames++;
    if (this.elapsed < 1500) return this.scale;
    const average = this.elapsed / this.frames;
    const budget = 1000 / targetFps;
    if (average > budget * 1.2) {
      this.scale = Math.max(this.minimum, +(this.scale - 0.1).toFixed(2));
      this.goodWindows = 0;
    } else if (average < budget * 1.06) {
      // Six healthy windows before trying a sharper image again.
      if (++this.goodWindows >= 6) {
        this.scale = Math.min(this.maximum, +(this.scale + 0.05).toFixed(2));
        this.goodWindows = 0;
      }
    } else {
      this.goodWindows = 0;
    }
    this.elapsed = 0;
    this.frames = 0;
    return this.scale;
  }
}
