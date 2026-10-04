// Negotiated server->client extension. No player message can submit this state.
// This includes exposed Soccar gameplay state, NOT Bullet solver/manifold caches.
export const CHECKPOINT_VERSION = 1;
export const CHECKPOINT_TAG = 0x4e435031;
export const CHECKPOINT_HEADER = 24;
export const CHECKPOINT_CAR = 80;
export const CHECKPOINT_PAD = 4;
export const checkpointSize = (cars, pads) => CHECKPOINT_HEADER + cars * CHECKPOINT_CAR + pads * CHECKPOINT_PAD;
export function validCheckpoint(value, cars, pads) {
  return value instanceof Float32Array && value.length === checkpointSize(cars, pads)
    && value[0] === 202617 && value[1] === CHECKPOINT_VERSION && value[2] === cars && value[3] === pads
    && value.every(Number.isFinite);
}
// Comparison excludes event counters and world-relative car IDs. The local
// jump/flip/boost timers and button history must match, not merely position.
export function hiddenStateAgrees(history, checkpoint, self) {
  if (!checkpoint) return true;
  if (!history) return false;
  const base = CHECKPOINT_HEADER + self * CHECKPOINT_CAR;
  for (const i of [4,5,6,7,10,20,23,30,35,36,37,38,39]) if (history[i] !== checkpoint[base+i]) return false;
  for (const i of [8,9,11,12,13,14,15,16,17,18,19,21,22,28,29,31,32,33,34])
    if (Math.abs(history[i]-checkpoint[base+i]) > .0001) return false;
  return true;
}
