import { SIM_HZ } from './protocol.js';
import { clamp, interpolateState } from './pose.js';
// A monotonic SERVER-tick playback timeline. Arrival jitter is a buffer-sizing
// signal, never the time coordinate used to interpolate between physics states.
export class SnapshotBuffer {
    constructor() { this.samples = []; this.epoch = -1; this.playhead = null; this.lastRender = null; this.jitterMs = 0; this.delayMs = 100; this.underflows = 0; this.rejected = 0; this.rebases = 0; this.ageMs = 0; }
    add(snapshot, state, now) {
        const last = this.samples.at(-1), time = snapshot.tick * 1000 / SIM_HZ;
        if (last && (snapshot.epoch < this.epoch || snapshot.epoch === this.epoch && snapshot.tick <= last.tick)) {
            this.rejected++;
            return;
        }
        if (snapshot.epoch !== this.epoch) {
            this.samples.length = 0;
            this.epoch = snapshot.epoch;
            this.playhead = null;
            this.lastRender = null;
            this.jitterMs = 0;
            this.delayMs = 100;
        }
        else if (last) {
            const deviation = Math.abs((now - last.arrival) - (time - last.time));
            this.jitterMs += .1 * (Math.min(200, deviation) - this.jitterMs);
        }
        this.delayMs = clamp(100 + this.jitterMs * 2, 100, 200);
        this.samples.push({ state, time, tick: snapshot.tick, arrival: now });
        if (this.samples.length > 48)
            this.samples.shift();
    }
    render(now, out) {
        const newest = this.samples.at(-1);
        if (!newest)
            return false;
        const dt = this.lastRender === null ? 0 : clamp(now - this.lastRender, 0, 100);
        this.lastRender = now;
        const desired = newest.time + Math.max(0, now - newest.arrival) - this.delayMs;
        if (this.playhead === null)
            this.playhead = desired;
        else if (desired - this.playhead > Math.max(250, this.delayMs + 100)
            || this.playhead < this.samples[0].time - this.delayMs) {
            // Suspension/alt-tab recovery is an explicit rebase, not a hidden
            // many-second slowdown. Ordinary jitter still uses monotonic slew.
            this.playhead = Math.min(newest.time, desired); this.rebases++;
        }
        else {
            const error = desired - this.playhead;
            this.playhead += dt * (Math.abs(error) < 8 ? 1 : clamp(1 + error / 1000, .95, 1.05));
        }
        // Do not extrapolate rigid bodies blindly through walls after packet gaps.
        if (this.playhead > newest.time) {
            this.underflows++;
            this.playhead = newest.time;
        }
        this.ageMs = Math.max(0, newest.time - this.playhead);
        let lower = this.samples[0], upper = lower;
        for (let i = 1; i < this.samples.length; i++) {
            upper = this.samples[i];
            if (upper.time >= this.playhead)
                break;
            lower = upper;
        }
        const span = upper.time - lower.time, t = span > 0 ? clamp((this.playhead - lower.time) / span, 0, 1) : 1;
        interpolateState(out, lower.state, upper.state, t, span / 1000);
        return true;
    }
    clear() { this.samples.length = 0; this.playhead = this.lastRender = null; this.epoch = -1; this.jitterMs = 0; this.delayMs = 100; }
}
