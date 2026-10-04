/**
 * The concrete `MatchSimBridge`: a live Emscripten module, reached through the
 * donor's own sim instance.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS FILE NOW EXISTS
 * ---------------------------------------------------------------------------
 * `sim-bridge.ts` cites this module as the one place allowed to know the WASM
 * surface. It did not exist, so nothing implemented `MatchSimBridge` except
 * `createNullSimBridge` and a test harness, and the whole mutator/EVENT MODE
 * story was decorative: `applySimConfigToDonor` had no way to reach
 * `_physics_*`. This file closes that gap and is the ONLY module under
 * `src/match/**` that names a `_physics_*` export.
 *
 * ---------------------------------------------------------------------------
 * THE HANDLE: the donor's own sim instance
 * ---------------------------------------------------------------------------
 * `src/airjam/seam.ts:474-483` (`writeNeutralControls`) already reaches the WASM
 * the same way, and that is the precedent: the handle is `sim.module`, because
 * `PhysicsSimulation.init` assigns the module to a field of itself
 * (`src/donor/physics/simulation.js:33`) and the seam hands the host the donor's
 * live instance as the third argument of `onControls`
 * (`seam.ts:282`). Nothing else in the donor exposes the module.
 *
 * Everything here is structural: no `src/donor/**` import, not even for types.
 * A unit test injects a plain object; the browser passes the real sim.
 *
 * ---------------------------------------------------------------------------
 * THE NATIVE SURFACE, VERIFIED (not assumed)
 * ---------------------------------------------------------------------------
 * The export table was read out of the SHIPPED build, not the legacy vendor:
 *
 *  - `public/physics/rocketsim-core.js:7` assigns, verbatim,
 *      Module["_physics_setUnlimitedBoost"] = wasmExports["physics_setUnlimitedBoost"]
 *      Module["_physics_setBallState"]     = wasmExports["physics_setBallState"]
 *      Module["_physics_setCarState"]      = wasmExports["physics_setCarState"]
 *      Module["_physics_goalExplosion"]    = wasmExports["physics_goalExplosion"]
 *      Module["_physics_getStatePtr"] / ["_physics_getStateSize"] / ["_physics_getControlsPtr"]
 *      Module["_physics_resetKickoff"] / ["_physics_clearGoalFlag"] / ["_physics_step"]
 *      Module["_physics_addCar"] / ["_physics_controlBall"] / ["_physics_getBallRadius"]
 *      Module["_malloc"] / ["_free"]
 *    It also exports `_physics_setGoalExplosionEnabled` and `_physics_destroy`.
 *
 *  - `src/donor/vendor/legacy-physics.js:5174-5197` is the ORIGINAL upstream
 *    build and its table has NO `setBallState`, NO `setCarState` and NO
 *    `goalExplosion`. It also contains zero `ORIGINAL_*` symbols, so the
 *    `ORIGINAL_*` name set some port notes refer to is not in either build.
 *    The shipped core is the source-built RocketSim and its names are the real
 *    ones; this file uses only the shipped core's names.
 *
 *  - Signatures, from the donor's own callers:
 *      `_physics_setBallState(ptr) -> int` (1 = applied, 0 = rejected)
 *        `src/donor/online/prediction.js:78-79` writes `state[BALL .. BALL+18]`
 *        straight to the pointer.
 *      `_physics_setCarState(slot, ptr) -> int` (1 = applied)
 *        `src/donor/online/prediction.js:82-88` fills 24 floats.
 *      `_physics_goalExplosion() -> int`; `src/donor/physics/simulation.js:176`
 *        reads it through `?? 0`, i.e. the donor itself treats it as optional.
 *
 *  - MEASURED, in Node against `rocketsim-core.wasm` (see
 *    `__tests__/wasm-roundtrip.test.ts`): both setters return 1 for a block
 *    copied from the live state, and they return 0 — silently changing nothing —
 *    for a block whose orientation basis is degenerate (a zero forward vector).
 *    So a rejected write is a real, reachable outcome and is reported as one.
 *
 * There is NO radius setter. `PhysicsSimulation.ballRadius`
 * (`src/donor/physics/simulation.js:204-205`) is a read-only getter over
 * `_physics_getBallRadius`, which is why a radius mutator cannot be applied.
 */

import { BALL_STATE_FLOATS, CAR_POSE_FLOATS } from "./donor-facts.js";
import type { MatchSimBridge } from "./sim-bridge.js";

/* -------------------------------------------------------------------------- */
/* The module surface, structurally typed                                       */
/* -------------------------------------------------------------------------- */

/**
 * The subset of the Emscripten module this bridge calls. Every member is
 * OPTIONAL on purpose: the bridge must be able to run against a module that is
 * missing an entry point and report that honestly, rather than crashing.
 */
export interface EmscriptenPhysicsModule {
  readonly HEAPF32: Float32Array;
  _malloc?(bytes: number): number;
  _free?(pointer: number): void;
  _physics_setUnlimitedBoost?(enabled: number): void;
  _physics_setBallState?(pointer: number): number;
  _physics_setCarState?(slot: number, pointer: number): number;
  _physics_goalExplosion?(): number;
  _physics_resetKickoff?(car: number): void;
  _physics_clearGoalFlag?(): void;
  _physics_step?(ticks: number): void;
  _physics_getStatePtr?(): number;
  _physics_getStateSize?(): number;
}

/**
 * The donor's sim instance, structurally.
 *
 * `seam.ts` hands the host exactly this object as the third argument of
 * `onControls` (`seam.ts:282`), and `writeNeutralControls` already treats
 * `sim.module` as the WASM handle (`seam.ts:474-483`).
 *
 * The donor's own methods are declared OPTIONAL and are preferred over the raw
 * exports when present, because they do the bookkeeping the raw export does not:
 * `resetKickoff` clears `lastLaunch` and `ballActionHistory`, and `step` records
 * the post-step ball velocity for the launch diff
 * (`src/donor/physics/simulation.js:166-182`).
 */
export interface DonorSimLike {
  readonly module?: EmscriptenPhysicsModule | null;
  readonly state?: Float32Array | null;
  step?(ticks?: number): void;
  setUnlimitedBoost?(enabled: boolean): void;
  resetKickoff?(car?: number): void;
  applyGoalExplosion?(): number | null | undefined;
}

/* -------------------------------------------------------------------------- */
/* The bridge                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * A real bridge, plus the reason each call could not reach the module.
 *
 * `reason(call)` returns `null` when that call is currently reachable, and a
 * human-readable string when it is not — either because the entry point is
 * absent, or because the module rejected the write. `applySimConfigToDonor`
 * copies those strings into its `notApplied` list so a mutator can never be
 * reported as applied when it was not.
 */
export interface WasmSimBridge extends MatchSimBridge {
  /** `null` if reachable, else why the last attempt at `call` failed. */
  reason(call: string): string | null;
  /** Every `_physics_*` entry point this module actually exposes. */
  readonly available: readonly string[];
  /** Free the scratch buffer. Safe to call twice; never throws. */
  dispose(): void;
}

/** The call names `reason()` understands, matching `MatchSimBridge` members. */
export const BRIDGE_CALLS = [
  "setUnlimitedBoost",
  "writeBallState",
  "writeCarState",
  "goalExplosion",
  "resetKickoff",
  "clearGoalFlag",
  "step",
] as const;

export type BridgeCall = (typeof BRIDGE_CALLS)[number];

/**
 * Scratch floats. `_physics_setBallState` reads 18 and `_physics_setCarState`
 * reads 24 (`online/prediction.js:78-88`); the donor's own headless harness
 * allocates a 51-float buffer and zeroes it before every fixture
 * (reference `server/native.mjs:66-71`). One lazily-allocated buffer serves both,
 * always zero-filled over its whole width so no stale orientation survives.
 */
const SCRATCH_FLOATS = 51;

const ENTRY_POINTS = {
  setUnlimitedBoost: "_physics_setUnlimitedBoost",
  writeBallState: "_physics_setBallState",
  writeCarState: "_physics_setCarState",
  goalExplosion: "_physics_goalExplosion",
  resetKickoff: "_physics_resetKickoff",
  clearGoalFlag: "_physics_clearGoalFlag",
  step: "_physics_step",
} as const satisfies Record<BridgeCall, string>;

/**
 * Wrap a live donor sim. The module is read LAZILY on every call, because the
 * donor replaces it wholesale: `prepareOnline` and `switchPhysics` copy every own
 * property off a fresh candidate instance onto the live one
 * (`src/donor/physics/simulation.js:115-117` and `:136`). A bridge that captured
 * the module once would keep writing into a destroyed heap.
 */
export const createWasmSimBridge = (sim: DonorSimLike): WasmSimBridge => {
  const failures = new Map<string, string>();
  let scratch = 0;
  /** The module `scratch` was allocated in. A swap invalidates the pointer. */
  let scratchModule: EmscriptenPhysicsModule | null = null;
  let stateFallback: Float32Array | null = null;

  const module = (): EmscriptenPhysicsModule | null => sim?.module ?? null;

  const fail = (call: BridgeCall, reason: string): never => {
    failures.set(call, reason);
    throw new Error(reason);
  };

  /**
   * The module, or a thrown `not applied`. Returns a narrowed type so callers
   * never have to re-check for null after the guard.
   */
  const requireModule = (call: BridgeCall): EmscriptenPhysicsModule => {
    const wasm = module();
    if (!wasm) {
      const reason = `the sim has no WASM module yet, so ${ENTRY_POINTS[call]} was never called`;
      failures.set(call, reason);
      throw new Error(reason);
    }
    return wasm;
  };

  /**
   * Narrow an optional module export to a callable, or fail with `reason`.
   * Returns the narrowed function so the caller never has to re-check.
   */
  const entry = <K extends keyof EmscriptenPhysicsModule>(
    wasm: EmscriptenPhysicsModule,
    key: K,
    call: BridgeCall,
    reason: string,
  ): NonNullable<EmscriptenPhysicsModule[K]> => {
    const value = wasm[key];
    if (typeof value !== "function") {
      fail(call, reason);
    }
    return value as NonNullable<EmscriptenPhysicsModule[K]>;
  };

  /** The scratch pointer, re-allocated if the module behind it changed. */
  const scratchPointer = (wasm: EmscriptenPhysicsModule): number => {
    if (scratch !== 0 && scratchModule === wasm) return scratch;
    const malloc = entry(
      wasm,
      "_malloc",
      "writeBallState",
      `${ENTRY_POINTS.writeBallState} needs _malloc for a scratch block, which this module does not export`,
    );
    // The previous pointer belonged to a module that has been swapped out and
    // very likely destroyed. Freeing it now would be a double free, so it is
    // deliberately dropped rather than freed.
    scratch = malloc(SCRATCH_FLOATS * 4);
    scratchModule = wasm;
    if (!Number.isFinite(scratch) || scratch === 0) {
      scratch = 0;
      scratchModule = null;
      return fail("writeBallState", "_malloc returned no usable pointer for the ball/car state scratch block");
    }
    return scratch;
  };

  /**
   * Copy `block` into the scratch buffer as float32 and hand the pointer to
   * `apply`. Float64 in, float32 out: the interface's block type is `Float64Array`
   * but the heap is float32 (`HEAPF32`).
   */
  const writeBlock = (
    call: "writeBallState" | "writeCarState",
    block: Float64Array,
    width: number,
    apply: (wasm: EmscriptenPhysicsModule, pointer: number) => number,
  ): void => {
    const wasm = requireModule(call);
    const pointer = scratchPointer(wasm);
    const base = pointer >> 2;
    wasm.HEAPF32.fill(0, base, base + SCRATCH_FLOATS);
    for (let i = 0; i < width; i += 1) {
      const value = block[i];
      wasm.HEAPF32[base + i] = typeof value === "number" && Number.isFinite(value) ? value : 0;
    }
    const accepted = apply(wasm, pointer);
    if (accepted !== 1) {
      fail(
        call,
        `${ENTRY_POINTS[call]} returned ${String(accepted)} instead of 1 — the module rejected the state block (a non-finite value or a degenerate orientation basis will do it)`,
      );
    }
    failures.delete(call);
  };

  /** A `Float32Array` view of the live state block. */
  const readState = (): Float32Array => {
    const fromSim = sim?.state;
    if (fromSim) return fromSim;
    const wasm = module();
    if (!wasm || typeof wasm._physics_getStatePtr !== "function" || typeof wasm._physics_getStateSize !== "function") {
      return new Float32Array(0);
    }
    const size = wasm._physics_getStateSize();
    const pointer = wasm._physics_getStatePtr();
    // The heap can grow under us, which detaches every existing view. Re-check
    // the buffer identity rather than caching a stale array.
    if (!stateFallback || stateFallback.buffer !== wasm.HEAPF32.buffer || stateFallback.length !== size) {
      stateFallback = new Float32Array(wasm.HEAPF32.buffer, pointer, size);
    }
    return stateFallback;
  };

  return {
    reason: (call) => failures.get(call) ?? null,
    available: BRIDGE_CALLS.filter((call) => {
      const wasm = module();
      if (!wasm) return false;
      const name = ENTRY_POINTS[call] as keyof EmscriptenPhysicsModule;
      return typeof wasm[name] === "function";
    }),

    setUnlimitedBoost: (enabled) => {
      if (sim?.setUnlimitedBoost) {
        sim.setUnlimitedBoost(enabled);
      } else {
        // `requireModule` first, so a sim with no module says so rather than
        // blaming the export table.
        const setter = entry(
          requireModule("setUnlimitedBoost"),
          "_physics_setUnlimitedBoost",
          "setUnlimitedBoost",
          `${ENTRY_POINTS.setUnlimitedBoost} is not exported by this module, so unlimited boost cannot be applied`,
        );
        setter(enabled ? 1 : 0);
      }
      failures.delete("setUnlimitedBoost");
    },

    writeBallState: (block) => {
      // The block is RELATIVE to the ball, because that is exactly what
      // `_physics_setBallState(pointer)` reads (`online/prediction.js:78-79`).
      writeBlock("writeBallState", block, BALL_STATE_FLOATS, (wasm, pointer) =>
        wasm._physics_setBallState?.(pointer) ?? 0,
      );
    },

    writeCarState: (slot, pose) => {
      writeBlock("writeCarState", pose, CAR_POSE_FLOATS, (wasm, pointer) =>
        wasm._physics_setCarState?.(slot, pointer) ?? 0,
      );
      // A rejected write has already thrown by now, so reaching this line IS the
      // confirmation. `false` would be unreachable rather than informative.
      return true;
    },

    goalExplosion: () => {
      const wasm = module();
      const viaSim = sim?.applyGoalExplosion?.();
      if (typeof viaSim === "number") return viaSim;
      if (wasm && typeof wasm._physics_goalExplosion === "function") {
        failures.delete("goalExplosion");
        return wasm._physics_goalExplosion();
      }
      failures.set("goalExplosion", `${ENTRY_POINTS.goalExplosion} is not exported by this module`);
      return 0;
    },

    resetKickoff: () => {
      if (sim?.resetKickoff) {
        sim.resetKickoff(-1);
      } else {
        entry(
          requireModule("resetKickoff"),
          "_physics_resetKickoff",
          "resetKickoff",
          `${ENTRY_POINTS.resetKickoff} is not exported by this module, so a kickoff cannot be reset`,
        )(-1);
      }
      failures.delete("resetKickoff");
    },

    clearGoalFlag: () => {
      entry(
        requireModule("clearGoalFlag"),
        "_physics_clearGoalFlag",
        "clearGoalFlag",
        `${ENTRY_POINTS.clearGoalFlag} is not exported by this module, so the goal flag cannot be cleared`,
      )();
      failures.delete("clearGoalFlag");
    },

    step: (ticks = 1) => {
      if (sim?.step) {
        sim.step(ticks);
      } else {
        entry(
          requireModule("step"),
          "_physics_step",
          "step",
          `${ENTRY_POINTS.step} is not exported by this module, so the simulation cannot advance`,
        )(ticks);
      }
      failures.delete("step");
    },

    get state() {
      return readState();
    },

    dispose: () => {
      const wasm = scratchModule;
      if (scratch !== 0 && wasm && typeof wasm._free === "function") {
        wasm._free(scratch);
      }
      scratch = 0;
      scratchModule = null;
      stateFallback = null;
    },
  };
};
