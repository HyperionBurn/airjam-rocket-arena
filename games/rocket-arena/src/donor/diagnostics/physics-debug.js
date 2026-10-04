// Opt-in, bounded, raw (non-interpolated) observations. Never exposes WASM memory.
export function createPhysicsDebug(clock, { capacity = 600, metadata = {}, context = () => ({}) } = {}) {
  const samples = new Array(capacity);
  let count = 0;
  let next = 0;
  clock.onTick = (tick, state) => {
    samples[next] = { schedulerTick: tick, state: Array.from(state), ...structuredClone(context()) };
    next = (next + 1) % capacity;
    count = Math.min(count + 1, capacity);
  };
  return Object.freeze({
    snapshot: () => ({
      schema: 1, metadata: structuredClone(typeof metadata === "function" ? metadata() : metadata), metrics: clock.metrics(),
      samples: Array.from({ length: count }, (_, i) =>
        structuredClone(samples[(next - count + i + capacity) % capacity])),
      limitations: ["Scheduler ticks include match countdown ticks; consult raw state for native progress.",
        "Native contact impulses, hidden jump timers, and full-state initialization are not exposed.",
        "Live controls are sampled per scheduled tick, not reconstructed historically during catch-up."],
    }),
  });
}
