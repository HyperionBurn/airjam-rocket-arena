/**
 * Host-side arena growth: the one place that turns "N players claimed slots"
 * into "the simulation holds N cars".
 *
 * ---------------------------------------------------------------------------
 * WHY THE HOST HAS TO DO THIS ITSELF
 * ---------------------------------------------------------------------------
 * The donor creates ONE physics car during boot (`app/startup.js:247`) and then
 * drives two fixed slots: the human at 0 and its bot at 1 (`startup.js:723` and
 * `:753`, where `_C = 0` and `no = 1` — `physics/state-layout.js:4-6`). Nothing
 * in the donor ever grows the roster, so the ONLY supported way to add a car is
 * the WASM export `_physics_addCar`, which `seam.ts:287-293` already declares as
 * the host's job. This module is that adapter.
 *
 * The two native calls it makes, in the donor's own order:
 *   addCar       → sim.addCar(team, style)      `physics/simulation.js:68-74`
 *                → module._physics_addCar(team, preset)
 *   setCarState  → module._malloc → HEAPF32 → module._physics_setCarState
 *                  mirroring `online/prediction.js:78-89`, the donor's only
 *                  other `_physics_setCarState` call site
 *
 * `PhysicsSimulation.addCar` is preferred over the bare export because it also
 * records `sim.carConfigs[index]` (`simulation.js:72`), which the renderer reads
 * for car geometry (`startup.js:298`). Growing through the export alone would
 * leave a physics car with no visual and no config.
 *
 * `preset` follows the donor's own mapping `t === "flat" ? 1 : 0`
 * (`simulation.js:71`): 1 is Dominus, anything else Octane. This host asks for
 * Octane (0) so a grown car matches the donor's default car.
 *
 * ---------------------------------------------------------------------------
 * CONTROLS FOR CARS THE DONOR NEVER ASKS ABOUT
 * ---------------------------------------------------------------------------
 * The donor only calls `setControls` for slots 0 and 1, so a car added at slot
 * 2 would sit in the arena forever with no input. `writeSlotControls` writes a
 * slot's 8 ABI floats straight into the controls block, the same buffer
 * `seam.writeNeutralControls` already zeroes, because that is the only way to
 * reach a slot the donor does not itself set — the seam patches
 * `setControls` only (`seam.ts:336`), and calling the patched method would
 * recurse.
 *
 * The donor's own write for slots 0 and 1 happens AFTER this hook returns
 * (`seam.ts:363` calls the original with the hook's result), so writing those
 * slots here is harmless: the donor's value lands last and wins.
 *
 * ---------------------------------------------------------------------------
 * REFUSAL IS A PRODUCT STATE, NOT A FAULT
 * ---------------------------------------------------------------------------
 * `bridge.cpp` refuses past `MAX_CARS = 8` or on a team that is not 0/1. Six
 * phones joining is ordinary, and a seventh is an ordinary overflow. Every
 * method here returns a value, reports once, and never throws, so a WASM trap
 * on the projector cannot take down a match that is currently running fine.
 *
 * ---------------------------------------------------------------------------
 * WHY THE SIM IS INJECTED
 * ---------------------------------------------------------------------------
 * The sim arrives through a getter; nothing here imports WASM, Three.js or a
 * donor module, so the whole file runs under `environment: "node"` with a plain
 * object literal standing in for `sim.module`.
 */

import {
  CONTROL_KEYS,
  type CarControls,
  type PortedSim,
  readCarCount,
  toControlArray,
} from "@/airjam/seam";
import { CAR_POSE_FLOATS, NATIVE_MAX_CARS, growArena, readCarPose } from "@/airjam/slots";
import type {
  ArenaGrowthCapability,
  ArenaRefusal,
  GrowArenaResult,
  SlotTeams,
  Team,
} from "@/airjam/slots";

/**
 * Only the WASM exports growth needs. Everything is optional on purpose: the
 * audit confirmed `_physics_addCar` and `_physics_setCarState` are in the
 * export table, but a missing one must degrade, never crash.
 */
export interface PhysicsGrowthExports {
  _physics_addCar?: (team: number, preset: number) => number;
  _physics_setCarState?: (slot: number, posePtr: number) => number;
  _physics_resetKickoff?: (carIndex: number) => number | void;
  _physics_getControlsPtr?: () => number;
  _malloc?: (bytes: number) => number;
  _free?: (ptr: number) => void;
  HEAPF32?: Float32Array;
}

/**
 * The donor's own sim, plus the two methods this host reuses. `PortedSim` is
 * the seam's minimum; `simulation.js:15` makes `module` a real own property,
 * set by `init()`, so it is read live and never captured at construction.
 */
export interface GrowthSim extends PortedSim {
  /** `physics/simulation.js:68` — the donor's wrapper over `_physics_addCar`. */
  addCar?: (team: 0 | 1, style?: string) => number;
  /** `physics/simulation.js:178` — `_physics_resetKickoff`, defaulting to -1. */
  resetKickoff?: (carIndex?: number) => void;
  readonly module?: PhysicsGrowthExports;
}

export interface ArenaGrowthHost extends ArenaGrowthCapability {
  /**
   * Redefined as REQUIRED. `ArenaGrowthCapability` declares `carCount?` because
   * the seam's hooks are optional; a host capability always has one, so callers
   * never have to null-check it.
   */
  carCount(): number;
  /** `_physics_setCarState` for one car. False when the export is missing. */
  setCarState(slot: number, pose: readonly number[]): boolean;
  /** False until a sim is live AND some way to add a car exists. */
  readonly available: boolean;
  /** `_physics_resetKickoff(-1)`. False when the sim cannot do it. Never throws. */
  resetKickoff(): boolean;
  /**
   * Write one slot's controls straight into the WASM controls block. The only
   * way to drive a slot the donor never calls `setControls` for.
   */
  writeSlotControls(slot: number, controls: CarControls): boolean;
  /** Why the last failure happened, for the host readout. */
  readonly lastFailure: string | null;
}

export interface ArenaGrowthOptions {
  /** 0 = Octane (the donor's default), 1 = Dominus. */
  preset?: number;
  /** Log sink. Defaults to one `console.warn` per failure. */
  report?: (message: string, error?: unknown) => void;
}

const CAR_POSE_BYTES = CAR_POSE_FLOATS * 4;

const defaultReport = (message: string, error?: unknown): void => {
  if (error === undefined) console.warn(`[rocket-arena/host] ${message}`);
  else console.warn(`[rocket-arena/host] ${message}`, error);
};

/**
 * Build the growth capability around a live sim handle.
 *
 * `getSim` is a getter, not a value: the sim only exists once the donor has
 * booted, and can be swapped if the donor replaces its physics
 * (`simulation.js:136`), so nothing is captured at construction time.
 */
export const createArenaGrowthHost = (
  getSim: () => GrowthSim | null,
  options: ArenaGrowthOptions = {},
): ArenaGrowthHost => {
  const preset = options.preset ?? 0;
  const style = preset === 1 ? "flat" : "default";
  const report = options.report ?? defaultReport;

  let failure: string | null = null;
  const fail = (message: string, error?: unknown): void => {
    failure = message;
    report(message, error);
  };

  const carCount = (): number => {
    const sim = getSim();
    if (!sim) return 0;
    try {
      // The real, live count: the state header's NUM_CARS at offset 2, which
      // the bridge rewrites on every `addCar`.
      return readCarCount(sim.state);
    } catch (error) {
      fail("could not read the sim state header; reporting zero cars", error);
      return 0;
    }
  };

  const addCar = (team: Team): number => {
    const sim = getSim();
    if (!sim) {
      fail("cannot add a car before the donor's simulation is live");
      return -1;
    }
    if (team !== 0 && team !== 1) {
      // Checked here as well as in the bridge: the bridge's refusal is the
      // documented contract, this is just a clearer message for it.
      fail(`addCar refused: team ${String(team)} is neither 0 nor 1`);
      return -1;
    }
    try {
      if (typeof sim.addCar === "function") return sim.addCar(team, style);
      const wasm = sim.module;
      if (typeof wasm?._physics_addCar === "function") return wasm._physics_addCar(team, preset);
      fail("neither PhysicsSimulation.addCar nor _physics_addCar is available");
      return -1;
    } catch (error) {
      fail("addCar threw; the arena stays as it is", error);
      return -1;
    }
  };

  const setCarState = (slot: number, pose: readonly number[]): boolean => {
    const wasm = getSim()?.module;
    if (
      typeof wasm?._physics_setCarState !== "function" ||
      typeof wasm._malloc !== "function" ||
      typeof wasm._free !== "function"
    ) {
      fail("no _physics_setCarState/_malloc pair; kickoff poses cannot be written");
      return false;
    }
    if (!Number.isInteger(slot) || slot < 0 || slot >= NATIVE_MAX_CARS) {
      fail(`setCarState refused slot ${String(slot)}; the bridge allows 0..${NATIVE_MAX_CARS - 1}`);
      return false;
    }
    let at = 0;
    try {
      at = wasm._malloc(CAR_POSE_BYTES);
      if (!at) {
        fail(`could not allocate ${CAR_POSE_BYTES} bytes for a kickoff pose`);
        return false;
      }
      const heap = wasm.HEAPF32;
      if (!heap) {
        fail("the WASM heap view (HEAPF32) is not available");
        return false;
      }
      const start = at >> 2;
      heap.fill(0, start, start + CAR_POSE_FLOATS);
      for (let i = 0; i < CAR_POSE_FLOATS; i += 1) {
        const value = pose[i];
        heap[start + i] = typeof value === "number" && Number.isFinite(value) ? value : 0;
      }
      // `prediction.js:88` treats only an exact 1 as success.
      return wasm._physics_setCarState(slot, at) === 1;
    } catch (error) {
      fail(`setCarState(${slot}) threw; the car keeps the engine's own placement`, error);
      return false;
    } finally {
      try {
        wasm._free(at);
      } catch {
        // A failed free leaks 96 bytes. Reporting it would drown the failure
        // that is already on screen, so it is deliberately silent.
      }
    }
  };

  const resetKickoff = (): boolean => {
    const sim = getSim();
    if (!sim) return false;
    try {
      if (typeof sim.resetKickoff === "function") {
        sim.resetKickoff();
        return true;
      }
      const wasm = sim.module;
      if (typeof wasm?._physics_resetKickoff === "function") {
        // -1 is the donor's own all-cars reset (`simulation.js:178`).
        wasm._physics_resetKickoff(-1);
        return true;
      }
      return false;
    } catch (error) {
      fail("resetKickoff threw; cars keep the placements they already have", error);
      return false;
    }
  };

  const writeSlotControls = (slot: number, controls: CarControls): boolean => {
    const wasm = getSim()?.module;
    const ptr = wasm?._physics_getControlsPtr?.();
    const heap = wasm?.HEAPF32;
    if (!ptr || !heap || !Number.isInteger(slot) || slot < 0 || slot >= NATIVE_MAX_CARS) return false;
    try {
      const stride = CONTROL_KEYS.length;
      const values = toControlArray(controls);
      const start = (ptr >> 2) + slot * stride;
      // `HEAPF32` is re-read every call: the view is replaced when the heap
      // grows, so a cached one would write into a detached buffer.
      for (let i = 0; i < stride; i += 1) heap[start + i] = values[i] ?? 0;
      return true;
    } catch (error) {
      fail(`could not write controls for slot ${slot}`, error);
      return false;
    }
  };

  return {
    get available(): boolean {
      const sim = getSim();
      if (!sim) return false;
      return typeof sim.addCar === "function" || typeof sim.module?._physics_addCar === "function";
    },
    get state(): Float32Array | undefined {
      return getSim()?.state;
    },
    get lastFailure(): string | null {
      return failure;
    },
    carCount,
    addCar,
    setCarState,
    resetKickoff,
    writeSlotControls,
  };
};

/**
 * How far a car may drift from the pose the engine gave it and still count as
 * "the match has not started". 1 uu (1 cm) is deliberate: a car being teleported
 * by a native kickoff reset in a LIVE match is unrecoverable, while failing this
 * test only costs the nicer native placement — `growArena` falls back to Phase
 * 3's mirrored poses, which are still symmetric.
 */
export const KICKOFF_DRIFT_UU = 1;

/**
 * True while every car is still where the engine placed it, i.e. the arena has
 * not started playing. The donor only calls `n.step(1)` while its match phase
 * is `"playing"` (`startup.js:748-753`), so the whole countdown is one long
 * true — which is exactly the window a lobby join should grow into.
 *
 * `snapshot` is the state captured on the first frame the host saw the sim.
 * Pure: it reads two arrays and never writes or throws.
 */
export const isStillAtKickoff = (
  snapshot: Float32Array | null,
  state: Float32Array | null,
  tolerance: number = KICKOFF_DRIFT_UU,
): boolean => {
  if (!snapshot || !state) return false;
  const count = Math.min(readCarCount(state), NATIVE_MAX_CARS);
  if (count === 0) return false;
  const limit = tolerance * tolerance;
  for (let slot = 0; slot < count; slot += 1) {
    const was = readCarPose(snapshot, slot);
    const now = readCarPose(state, slot);
    let drift = 0;
    for (let axis = 0; axis < 3; axis += 1) {
      const delta = (now[axis] ?? 0) - (was[axis] ?? 0);
      drift += delta * delta;
    }
    if (drift > limit) return false;
  }
  return true;
};

export interface EnsureArenaOptions {
  /**
   * slot → team for every seat the host has claimed. New cars are created on
   * the team the registry already assigned that slot, so the sim and the port's
   * own book-keeping cannot disagree.
   */
  readonly teams: SlotTeams;
  /**
   * Run the donor's own all-cars kickoff reset. The host passes this ONLY while
   * `isStillAtKickoff` holds; otherwise a mid-match join would teleport a
   * running match back to kickoff, so Phase 3's mirrored poses are used instead.
   */
  readonly allowNativeReset?: boolean;
  /** Ceiling to respect. Defaults to the bridge's own `MAX_CARS`. */
  readonly ceiling?: number;
  readonly onRefusal?: (refusal: ArenaRefusal) => void;
}

const failedGrowth = (wanted: number, ceiling: number, refusal: ArenaRefusal): GrowArenaResult => ({
  requested: wanted,
  capacity: 0,
  added: [],
  ceiling,
  refusal,
  teams: {},
  symmetricKickoff: true,
});

/**
 * Grow the arena to `target` cars, one team-consistent car at a time.
 *
 * The plan is Phase 3's, unchanged and un-duplicated: `growArena` owns the
 * add/verify loop and `planKickoffPlacement` owns the mirrored kickoff poses.
 * This function only decides WHICH team each new slot gets and whether the
 * engine's native reset is allowed to run, then delegates.
 *
 * Never throws — a refusal, a broken capability and an exception all come back
 * as a `GrowArenaResult` with a `refusal` and the capacity actually reached.
 */
export const ensureArenaCapacity = (
  capability: ArenaGrowthCapability,
  target: number,
  options: EnsureArenaOptions,
): GrowArenaResult => {
  const requested = Math.floor(target);
  const wanted = Number.isFinite(requested) ? Math.max(0, requested) : 0;
  const ceiling = options.ceiling ?? NATIVE_MAX_CARS;

  /**
   * One team per new slot, in the order the bridge will hand the slots out.
   *
   * The new cars occupy slots `carCount … wanted-1`, so the walk starts at the
   * current car count — not at slot 0. That matters as soon as the arena does
   * not begin at slot 0 with a full team pair: the donor makes ONE car
   * (`startup.js:247`), so a first join grows slot 1, and reading slot 0's team
   * for it would hand a phone's car to the wrong side.
   *
   * The registry is the authority, so this can never contradict the port's own
   * slot→team map; an unclaimed slot falls back to the alternating convention so
   * a batch of additions can never stack on one team.
   */
  const teamOrder = (): Team[] => {
    const current = typeof capability.carCount === "function" ? capability.carCount() : 0;
    const order: Team[] = [];
    for (let slot = current; order.length < wanted - current && slot < NATIVE_MAX_CARS; slot += 1) {
      const team = options.teams[slot];
      order.push(team === 0 || team === 1 ? team : ((slot % 2) as Team));
    }
    return order;
  };

  // `resetKickoff` is present ONLY when the host vouches for it. `growArena`
  // prefers a real reset and verifies symmetry afterwards, so withholding it
  // here is what routes growth to the mirrored-pose fallback.
  //
  // `addCar` is present only when the capability can actually add. Phase 3
  // distinguishes "this sim cannot add cars" (`no-addCar`) from "the bridge
  // said no" (`addCar-refused`), and forwarding a stub would collapse the first
  // into the second — blaming the arena for a missing capability.
  const canAdd = (capability as { available?: boolean }).available ?? true;
  const view = {
    get state() {
      return capability.state;
    },
    carCount: () => (typeof capability.carCount === "function" ? capability.carCount() : 0),
    setCarState: (slot: number, pose: readonly number[]) =>
      capability.setCarState?.(slot, pose) ?? false,
    ...(canAdd ? { addCar: (team: Team) => capability.addCar(team) } : {}),
    ...(options.allowNativeReset && typeof capability.resetKickoff === "function"
      ? { resetKickoff: () => void capability.resetKickoff?.() }
      : {}),
  } as ArenaGrowthCapability;

  try {
    return growArena(view, wanted, {
      teamOrder: teamOrder(),
      ...(options.ceiling === undefined ? {} : { ceiling: options.ceiling }),
      existingTeams: options.teams,
      ...(options.onRefusal ? { onRefusal: options.onRefusal } : {}),
    });
  } catch (error) {
    const refusal: ArenaRefusal = {
      kind: "addCar-threw",
      detail: error instanceof Error ? error.message : String(error),
    };
    options.onRefusal?.(refusal);
    return failedGrowth(wanted, ceiling, refusal);
  }
};
