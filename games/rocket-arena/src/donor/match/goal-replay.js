// Stores the rendered world and the camera that was actually used for each frame.
// Physics flags deliberately remain discrete: consumers choose previous/next state.
export class GoalReplayBuffer {
  constructor({ seconds = 10, maxFps = 120, stateSize } = {}) {
    if (!Number.isFinite(seconds) || seconds <= 0 || !Number.isFinite(maxFps) || maxFps <= 0 || !Number.isInteger(stateSize) || stateSize < 1) {
      throw new RangeError("Replay needs positive seconds/maxFps and an integer stateSize.");
    }
    this.seconds = seconds;
    this.capacity = Math.ceil(seconds * maxFps) + 2;
    this.stateSize = stateSize;
    this.slots = Array.from({ length: this.capacity }, () => ({
      time: 0,
      state: new Float64Array(stateSize),
      cameras: [new Float64Array(8), new Float64Array(8)],
      cameraCount: 0,
    }));
    this.clear();
  }

  clear() {
    this.head = 0;
    this.count = 0;
  }

  record(timeSeconds, state, cameras = []) {
    if (!Number.isFinite(timeSeconds) || state.length !== this.stateSize) {
      throw new RangeError("Replay timestamp must be finite and state must match stateSize.");
    }
    let index = (this.head + this.count) % this.capacity;
    let replace = false;
    if (this.count) {
      const lastIndex = (index + this.capacity - 1) % this.capacity;
      const last = this.slots[lastIndex];
      if (timeSeconds < last.time) throw new RangeError("Replay timestamps must be monotonic; clear before restarting time.");
      replace = timeSeconds === last.time;
      if (replace) index = lastIndex;
    }
    const slot = this.slots[index];
    slot.time = timeSeconds;
    slot.state.set(state);
    slot.cameraCount = cameras.length;
    for (let i = 0; i < cameras.length; i++) {
      // The usual player and opponent cameras allocate nothing during record().
      const target = slot.cameras[i] ?? (slot.cameras[i] = new Float64Array(8));
      const camera = cameras[i];
      if (!camera) {
        target[7] = NaN;
        continue;
      }
      target.set(camera.position, 0);
      target.set(camera.quaternion, 3);
      target[7] = camera.fov;
    }
    if (!replace) {
      if (this.count === this.capacity) this.head = (this.head + 1) % this.capacity;
      else this.count++;
    }
    const cutoff = timeSeconds - this.seconds;
    while (this.count > 1 && this.slots[this.head].time < cutoff) {
      this.head = (this.head + 1) % this.capacity;
      this.count--;
    }
  }

  clip(endTime, scorerIndex = 0) {
    if (!Number.isFinite(endTime) || !Number.isInteger(scorerIndex) || scorerIndex < 0) {
      throw new RangeError("Replay endTime must be finite and scorerIndex a nonnegative integer.");
    }
    const frames = [];
    let start;
    for (let i = 0; i < this.count; i++) {
      const slot = this.slots[(this.head + i) % this.capacity];
      if (slot.time < endTime - this.seconds || slot.time > endTime) continue;
      start ??= slot.time;
      const cameras = [];
      for (let c = 0; c < slot.cameraCount; c++) {
        const values = slot.cameras[c];
        cameras.push(Number.isNaN(values[7]) ? null : Object.freeze({
          position: Object.freeze(Array.from(values.subarray(0, 3))),
          quaternion: Object.freeze(Array.from(values.subarray(3, 7))),
          fov: values[7],
        }));
      }
      frames.push(Object.freeze({
        time: slot.time - start,
        state: Object.freeze(Array.from(slot.state)),
        cameras: Object.freeze(cameras),
      }));
    }
    if (!frames.length) return null;
    const duration = frames[frames.length - 1].time;
    return Object.freeze({ start, end: start + duration, duration, scorerIndex, frames: Object.freeze(frames) });
  }
}

function normalized(q) {
  const length = Math.hypot(...q);
  return length > 0 ? q.map((v) => v / length) : [0, 0, 0, 1];
}

function interpolateCamera(a, b, alpha) {
  if (!a || !b) return null; // Never silently replay another driver's viewpoint.
  const qa = normalized(a.quaternion);
  const qb = normalized(b.quaternion);
  let dot = qa.reduce((sum, value, index) => sum + value * qb[index], 0);
  if (dot < 0) {
    dot = -dot;
    for (let i = 0; i < 4; i++) qb[i] = -qb[i];
  }
  let quaternion;
  if (dot > 0.9995) quaternion = normalized(qa.map((v, i) => v + (qb[i] - v) * alpha));
  else {
    const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
    const denominator = Math.sin(angle);
    const wa = Math.sin((1 - alpha) * angle) / denominator;
    const wb = Math.sin(alpha * angle) / denominator;
    quaternion = normalized(qa.map((v, i) => v * wa + qb[i] * wb));
  }
  return {
    position: a.position.map((v, i) => v + (b.position[i] - v) * alpha),
    quaternion,
    fov: a.fov + (b.fov - a.fov) * alpha,
  };
}

export function sampleReplay(clip, timeSeconds) {
  if (!clip || !clip.frames.length) return null;
  if (!Number.isFinite(timeSeconds)) throw new RangeError("Replay time must be finite.");
  const frames = clip.frames;
  const time = Math.max(0, Math.min(clip.duration, timeSeconds));
  let low = 0;
  let high = frames.length - 1;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (frames[middle].time <= time) low = middle;
    else high = middle - 1;
  }
  const previous = frames[low];
  const next = frames[Math.min(low + 1, frames.length - 1)];
  const span = next.time - previous.time;
  const alpha = span > 0 ? (time - previous.time) / span : 0;
  return {
    previous,
    next,
    alpha,
    camera: interpolateCamera(previous.cameras[clip.scorerIndex], next.cameras[clip.scorerIndex], alpha),
  };
}
