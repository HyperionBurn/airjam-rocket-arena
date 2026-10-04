/**
 * The donor-backed `BotInference` — a rename, not a reimplementation.
 *
 * ---------------------------------------------------------------------------
 * WHAT IS REUSED, EXACTLY
 * ---------------------------------------------------------------------------
 * All of the AI. `src/donor/bots/**` keeps the observation builders
 * (`observations.js`, `necto.js`, `seer.js`), the 90-entry action table
 * (`actions.js:39-57`), the scripted kickoff routine (`observations.js:67-86`),
 * the recurrent-state handling and the ONNXRuntime worker. This file adds no
 * inference of its own; it adapts the donor's `BotController` to the narrow
 * interface in `bot-inference.ts` so the rest of the layer can be unit-tested
 * with a fake and zero bytes of model.
 *
 * The donor's `decide()` already returns its canonical 8-field control object —
 * `bots/actions.js:26-37` produces byte-identical values to `keyboard.js`,
 * `gamepad.js` and `touch.js`, which is precisely the shape `seam.ts:87-100`
 * declares as `CarControls`. So no mapping table is needed: the donor's output
 * goes straight to the seam. That identity is asserted in the tests.
 *
 * ---------------------------------------------------------------------------
 * WHY `playerSlot` IS `1 - slot`
 * ---------------------------------------------------------------------------
 * The donor's own call is `o.decide(state, pads, humanSlot, botTeam)`
 * (`app/startup.js:730`), and every builder treats its FOURTH argument as the
 * perspective car (`[r, 1 - r]` in `necto.js:36` and `observations.js:10`) and
 * its FIFTH as the mirror flag. So in the donor the observation is built around
 * the HUMAN, with the bot as entity 1, and the flag is the bot's team.
 *
 * The port's bot is the driver, not the opponent, so the perspective has to be
 * the bot's car. In a two-car arena the opponent occupies the only other slot,
 * so `1 - slot` reproduces the donor's argument positions and meanings exactly
 * rather than guessing at a new ordering. That also means this adapter is only
 * valid at 1v1 — which is the same constraint the models themselves impose, and
 * the seat manager has already refused to build one for a larger arena.
 *
 * ---------------------------------------------------------------------------
 * WHY THE DONOR MODULE IS IMPORTED DYNAMICALLY
 * ---------------------------------------------------------------------------
 * `BotController` reaches for `Worker`, `window.setTimeout` and `location` as
 * soon as it runs, and it spawns `/assets/worker-iFqqV1m9.js` to hold
 * onnxruntime-web. A static import would drag all of that into any unit test
 * that touched this file. The import therefore happens inside `load()`, which
 * only a real match ever calls. `vitest.config.mjs` does not alias `@donor`, so
 * a test that never calls `load()` cannot resolve it — which is correct.
 */

import { BOTS_DISABLED_ID, getBotDifficulty } from "./bot-difficulty.js";
import type { CarControls } from "../seam.js";
import type { BotDifficultyId } from "./bot-difficulty.js";
import type { BotInference, BotInferenceFactory, BotObservation } from "./bot-inference.js";

/** Structural view of the one donor class this adapter touches. */
interface DonorBotController {
  readonly isReady: boolean;
  getKickoffControls(state: Float32Array, kickoffTick: number): Record<string, unknown> | null;
  load(): Promise<void>;
  reset(): void;
  decide(
    state: Float32Array,
    pads: readonly unknown[],
    playerSlot: number,
    botTeam: number,
  ): Promise<Record<string, unknown>>;
  dispose(): void;
}

class DonorBotInference implements BotInference {
  private controller: DonorBotController | null = null;
  private loading: Promise<void> | null = null;
  private disposed = false;

  constructor(readonly id: BotDifficultyId) {}

  get isReady(): boolean {
    return this.controller?.isReady === true;
  }

  /** Every donor policy needs onnxruntime-web and its WASM. */
  readonly requiresNeuralRuntime = true;

  /**
   * Build the donor's controller, then load the selected policy into its
   * worker. Idempotent: the donor's own controller already dedupes concurrent
   * loads (`bots/controller.js:53-79`), and so does the memo here.
   */
  load(): Promise<void> {
    if (this.loading) return this.loading;
    this.loading = (async () => {
      const { BotController } = await import("@donor/bots/controller.js");
      const controller = new BotController(this.id) as unknown as DonorBotController;
      this.controller = controller;
      await controller.load();
    })();
    return this.loading;
  }

  /**
   * One decision. The rejection is deliberately allowed to propagate out of
   * HERE, because the seat source is built to contain it: it is the containment
   * that stops a slow brain from pausing the match, and hiding the rejection
   * here would just move the same failure somewhere with no watchdog.
   */
  async decide(observation: BotObservation): Promise<CarControls> {
    const controller = this.controller;
    if (!controller) throw new Error("Bot controller is not loaded.");
    if (observation.slot > 1) {
      throw new Error(
        `${this.id} is a 1v1 policy and cannot observe slot ${observation.slot}.`,
      );
    }
    // The donor's `decide()` already resolves to its canonical 8-field control
    // object, which IS `CarControls` (see `bots/actions.js:26-37`), so this is a
    // cast and not a conversion.
    const controls = await controller.decide(
      observation.state,
      observation.pads,
      // The perspective car is the opponent; see the header for why.
      1 - observation.slot,
      observation.team,
    );
    return controls as unknown as CarControls;
  }

  getKickoffControls(observation: BotObservation): CarControls | null {
    if (!this.controller) return null;
    const controls = this.controller.getKickoffControls(observation.state, observation.kickoffTick);
    return controls === null ? null : (controls as unknown as CarControls);
  }

  reset(): void {
    this.controller?.reset();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.controller?.dispose();
    this.controller = null;
    this.loading = null;
  }
}

/**
 * The factory a browser host passes to `createBotSeatManager`.
 *
 * `disabled` deliberately does NOT build a donor controller: turning bots off
 * must cost zero bytes of download and zero workers, so the seat manager binds
 * the neutral brain for that id instead.
 */
export const createDonorBotInferenceFactory = (): BotInferenceFactory => (id) => {
  if (id === BOTS_DISABLED_ID || !getBotDifficulty(id).enabled) {
    throw new Error(`No donor inference for "${id}"; the entry is turned off.`);
  }
  return new DonorBotInference(id);
};
