/**
 * Test double for `@donor/physics/simulation.js`.
 *
 * WHY IT EXISTS. `seam.ts` imports `PhysicsSimulation` as a VALUE (it patches
 * `PhysicsSimulation.prototype.setControls` in `installSimSeam`). Loading the
 * real donor module under Vitest would drag in `source-runtime.js`'s dynamic
 * `import("/physics/rocketsim-core.js")` and `legacy-physics.js`'s browser
 * externals — browser/WASM-only code that cannot initialise in Node and is
 * irrelevant to what these tests check.
 *
 * Nothing here is faked that matters. The shape matches exactly what the seam
 * depends on: a class whose prototype carries `setControls`. The pure-logic
 * tests never call `installSimSeam`, so the body of `setControls` is never
 * reached; it exists so a future seam test in this directory keeps working
 * without the browser-only import graph.
 *
 * This file is wired in by `src/controller/vitest.config.mjs` and by nothing
 * else. It must never be imported by product code.
 */

import type { CarControls } from "@/airjam/seam";

/** Per-car control slots, matching the donor's `MAX_CARS`-style flat array. */
const MAX_CARS = 8;

export class PhysicsSimulation {
  /** The 8 ABI floats per car, exactly as the bridge expects them. */
  readonly state = new Float32Array(MAX_CARS * 8);

  readonly lastControls: Array<number[] | null> = Array.from(
    { length: MAX_CARS },
    () => null,
  );

  setControls(slot: number, controls: number[] | CarControls): void {
    const values = Array.isArray(controls)
      ? controls
      : [
          controls.throttle,
          controls.steer,
          controls.pitch,
          controls.yaw,
          controls.roll,
          controls.jump ? 1 : 0,
          controls.boost ? 1 : 0,
          controls.handbrake ? 1 : 0,
        ];
    this.lastControls[slot] = values;
    this.state.set(values, slot * 8);
  }

  step(): void {
    /* No-op: the donor's fixed-step loop is out of scope for these tests. */
  }
}
