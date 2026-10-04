/**
 * Fakes for the slots unit tests.
 *
 * The slots core takes the sim and the input sources through narrow interfaces
 * precisely so that these can be hand-written: no WASM, no Three.js, no DOM,
 * no input worker. Everything below is therefore a plain object literal.
 */

import { NEUTRAL_CONTROLS, sanitizeControls } from "../../seam.js";
import type { CarControls, CarInputSource, NeutralizeReason, PortedSim } from "../../seam.js";
import { CAR_STATE_STRIDE, STATE_HEADER } from "../donor-facts.js";
import type { Team } from "../team-balance.js";

export interface FakeSource extends CarInputSource {
  /** The LIVE control object. Mutate it to simulate a player pressing things. */
  controls: CarControls;
  /** Every reason this source was neutralized, in order. */
  readonly neutralized: NeutralizeReason[];
  /** Set false to simulate a disconnected / hidden player. */
  live: boolean;
}

/** A `CarInputSource` whose controls the test owns directly. */
export const makeFakeSource = (
  playerId: string,
  slot: number,
  team: Team,
): FakeSource => {
  const source: FakeSource = {
    playerId,
    slot,
    team,
    controls: { ...NEUTRAL_CONTROLS },
    neutralized: [],
    live: true,
    read() {
      return { ...source.controls };
    },
    neutralize(reason: NeutralizeReason) {
      source.neutralized.push(reason);
      source.controls = { ...NEUTRAL_CONTROLS };
      source.live = false;
    },
    isLive() {
      return source.live;
    },
  };
  return source;
};

export interface RecordedControl {
  readonly slot: number;
  readonly controls: CarControls;
}

export interface FakeSim extends PortedSim {
  /** Every `setControls` write, in order, so ordering can be asserted. */
  readonly writes: RecordedControl[];
  /** Last controls written for a slot, or null. */
  lastFor(slot: number): CarControls | null;
  reset(): void;
}

/** A `PortedSim` that records control writes and holds a 510-float state. */
export const makeFakeSim = (state = new Float32Array(510)): FakeSim => {
  const writes: RecordedControl[] = [];
  return {
    state,
    writes,
    setControls(slot, controls) {
      writes.push({ slot, controls: sanitizeControls(controls as CarControls) });
    },
    step() {},
    lastFor(slot) {
      for (let i = writes.length - 1; i >= 0; i -= 1) {
        if (writes[i].slot === slot) return writes[i].controls;
      }
      return null;
    },
    reset() {
      writes.length = 0;
    },
  };
};

/**
 * Write a car pose straight into the state buffer, as the engine would.
 * `x` is the along-field coordinate; the arena end swap negates X and Z.
 */
export const putCarPose = (
  state: Float32Array,
  slot: number,
  x: number,
  y: number,
  facingX = 1,
): void => {
  const base = STATE_HEADER.CARS + slot * CAR_STATE_STRIDE;
  // Native axes: X/Y horizontal, Z up.
  state[base + 0] = x;
  state[base + 1] = y;
  state[base + 2] = 0; // height (Z)
  state[base + 3] = facingX; // FWD.x
  state[base + 5] = 0; // FWD.z
  state[base + 19] = 1; // ON_GROUND
  state[base + 20] = 0; // SUPERSONIC
  state[base + 21] = 0; // DEMOED
  state[STATE_HEADER.NUM_CARS] = 8;
};

/** A distinct-value pose, so mirroring is observable float-for-float. */
export const distinctPose = (seed: number): number[] => {
  const pose = new Array<number>(24).fill(0);
  for (let i = 0; i < 18; i += 1) pose[i] = seed * 100 + i + 1;
  pose[18] = 33; // BOOST
  pose[19] = 1; // ON_GROUND
  pose[20] = 0; // SUPERSONIC
  pose[21] = 0; // DEMOED
  return pose;
};
