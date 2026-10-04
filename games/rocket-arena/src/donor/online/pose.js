// Pure render math. None of these smoothed poses are written into physics.
import { STATE_LAYOUT as L, CAR_STATE as C, CAR_STATE_STRIDE as S } from '../physics/state-layout.js';
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export const distance = (a, b, at) => Math.hypot(a[at] - b[at], a[at + 1] - b[at + 1], a[at + 2] - b[at + 2]);
export function quaternion(state, at) {
    const m00 = state[at + 3], m01 = state[at + 6], m02 = state[at + 9], m10 = state[at + 4], m11 = state[at + 7], m12 = state[at + 10], m20 = state[at + 5], m21 = state[at + 8], m22 = state[at + 11];
    const trace = m00 + m11 + m22;
    let q;
    if (trace > 0) {
        const s = 2 * Math.sqrt(trace + 1);
        q = [(m21 - m12) / s, (m02 - m20) / s, (m10 - m01) / s, s / 4];
    }
    else if (m00 > m11 && m00 > m22) {
        const s = 2 * Math.sqrt(Math.max(0, 1 + m00 - m11 - m22));
        q = [s / 4, (m01 + m10) / s, (m02 + m20) / s, (m21 - m12) / s];
    }
    else if (m11 > m22) {
        const s = 2 * Math.sqrt(Math.max(0, 1 + m11 - m00 - m22));
        q = [(m01 + m10) / s, s / 4, (m12 + m21) / s, (m02 - m20) / s];
    }
    else {
        const s = 2 * Math.sqrt(Math.max(0, 1 + m22 - m00 - m11));
        q = [(m02 + m20) / s, (m12 + m21) / s, s / 4, (m10 - m01) / s];
    }
    const n = Math.hypot(...q);
    return n > 1e-8 && Number.isFinite(n) ? q.map(v => v / n) : [0, 0, 0, 1];
}
export const conjugate = q => [-q[0], -q[1], -q[2], q[3]];
export const multiply = (a, b) => [a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1], a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0], a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3], a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]];
export function slerp(a, b, t) {
    let dot = a.reduce((s, v, i) => s + v * b[i], 0);
    if (dot < 0) {
        b = b.map(v => -v);
        dot = -dot;
    }
    dot = clamp(dot, -1, 1);
    if (dot > .9995) {
        const q = a.map((v, i) => v + (b[i] - v) * t), n = Math.hypot(...q);
        return q.map(v => v / n);
    }
    const angle = Math.acos(dot), sin = Math.sin(angle), u = Math.sin((1 - t) * angle) / sin, v = Math.sin(t * angle) / sin;
    return a.map((x, i) => x * u + b[i] * v);
}
export function writeQuaternion(state, at, [x, y, z, w]) {
    state.set([1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w), 2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w), 2 * (x * z + y * w), 2 * (y * z - x * w), 1 - 2 * (x * x + y * y)], at + 3);
}
export function interpolateBody(out, a, b, at, t, seconds, hermite = true) {
    const teleport = distance(a, b, at) > 1500;
    if (teleport) {
        out.set(b.subarray(at, at + 18), at);
        return;
    }
    for (let i = 0; i < 3; i++) {
        const p = a[at + i], q = b[at + i], v = a[at + 12 + i], w = b[at + 12 + i];
        const linear = p + (q - p) * t;
        // Prevent a cubic crossing outside the endpoints at a bounce/contact.
        const cubic = (2 * t ** 3 - 3 * t * t + 1) * p + (t ** 3 - 2 * t * t + t) * seconds * v + (-2 * t ** 3 + 3 * t * t) * q + (t ** 3 - t * t) * seconds * w;
        out[at + i] = hermite && seconds > 0 && seconds < .2 ? clamp(cubic, Math.min(p, q) - 2, Math.max(p, q) + 2) : linear;
        out[at + 12 + i] = v + (w - v) * t;
        out[at + 15 + i] = a[at + 15 + i] + (b[at + 15 + i] - a[at + 15 + i]) * t;
    }
    writeQuaternion(out, at, slerp(quaternion(a, at), quaternion(b, at), t));
}
export function interpolateState(out, a, b, t, seconds) {
    out.set(b);
    interpolateBody(out, a, b, L.BALL, t, seconds);
    for (let slot = 0; slot < b[L.NUM_CARS]; slot++) {
        const at = L.CARS + slot * S;
        if (a[at + C.DEMOED] !== b[at + C.DEMOED])
            continue;
        interpolateBody(out, a, b, at, t, seconds);
        for (let wheel = 0; wheel < 4; wheel++)
            for (let j = 0; j < 2; j++) {
                const i = at + C.WHEELS + wheel * 3 + j;
                out[i] = a[i] + (b[i] - a[i]) * t;
            }
    }
    return out;
}
export class VisualCorrection {
    constructor(at) { this.at = at; this.position = [0, 0, 0]; this.rotation = [0, 0, 0, 1]; this.hardSnaps = 0; }
    reset() { this.position.fill(0); this.rotation = [0, 0, 0, 1]; }
    rebase(before, after, hard = false) {
        const at = this.at, d = distance(before, after, at);
        if (hard || d > 1500) {
            if (d > 1500 && !hard)
                this.hardSnaps++;
            this.reset();
            return;
        }
        this.position = this.position.map((v, i) => v + before[at + i] - after[at + i]);
        if (Math.hypot(...this.position) > 1500) {
            this.hardSnaps++;
            this.reset();
            return;
        }
        this.rotation = multiply(multiply(this.rotation, quaternion(before, at)), conjugate(quaternion(after, at)));
    }
    apply(out, dt) {
        // Time-based decay, not "multiply by .9 per rendered frame".
        const magnitude = Math.hypot(...this.position), halfLife = magnitude > 100 ? .025 : .055;
        const decay = Math.pow(.5, Math.min(.1, Math.max(0, dt)) / halfLife);
        this.position = this.position.map(v => Math.abs(v) < .001 ? 0 : v * decay);
        this.rotation = slerp([0, 0, 0, 1], this.rotation, decay);
        for (let i = 0; i < 3; i++)
            out[this.at + i] += this.position[i];
        writeQuaternion(out, this.at, multiply(this.rotation, quaternion(out, this.at)));
    }
}
