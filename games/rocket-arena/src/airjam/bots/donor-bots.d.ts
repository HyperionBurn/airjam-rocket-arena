/*
 * Ambient declaration for the ONE donor module this layer reuses.
 *
 * `src/types/donor.d.ts` is owned by another worker and is not editable from
 * here, so the declaration for `@donor/bots/controller.js` lives in the
 * subtree that actually depends on it. It is deliberately narrow: the donor is
 * minified and untyped, and this layer only ever touches the six members the
 * adapter calls. Everything else is re-derived as a structural type in
 * `donor-inference.ts`.
 *
 * `@donor/*` is a Vite `resolve.alias` and is deliberately NOT a tsconfig
 * `paths` entry, so this specifier is unresolvable to TypeScript and falls
 * through to the ambient block below — the same mechanism the existing donor
 * declarations rely on. The import in `donor-inference.ts` is DYNAMIC and sits
 * inside a method, so no unit test ever loads it: `vitest.config.mjs` does not
 * alias `@donor` on purpose.
 */
declare module "@donor/bots/controller.js" {
  /**
   * The donor's own bot driver. One instance drives one car: it holds a single
   * `action` field that is fed into every observation it builds.
   */
  export class BotController {
    /** `botId` is one of the donor's catalog ids; unknown ids fall back to nexto. */
    constructor(botId?: string);
    /** The selected difficulty id. */
    readonly id: string;
    /** The matching entry from the donor's own catalog. */
    readonly option: { scriptedKickoff: boolean; tickSkip: number };
    /** False until the ONNX policy is loaded. */
    readonly isReady: boolean;
    /** The last decoded action, as the donor's canonical 8-field object. */
    readonly controls: import("../seam.js").CarControls;
    /** Switch difficulty. Resets the controller. */
    select(botId: string): void;
    /**
     * The scripted kickoff routine, or null. Only Nexto has one
     * (`bots/catalog.js:37`). Throws/returns null outside a kickoff.
     */
    getKickoffControls(state: Float32Array, kickoffTick: number): import("../seam.js").CarControls | null;
    /** Load every catalog policy. Not used by this layer. */
    preloadAll(): Promise<void>;
    /** Load the selected policy's weights into the worker. */
    load(): Promise<void>;
    /** Load one specific policy. */
    loadPolicy(botId: string): Promise<void>;
    /** Drop recurrent state and the held action. */
    reset(): void;
    /** Force the held action, used by the kickoff routine. */
    overrideControls(controls: import("../seam.js").CarControls): void;
    /**
     * One decision. `playerSlot` is the PERSPECTIVE car the observation is built
     * around and `botTeam` doubles as the donor's mirror flag — see
     * `donor-inference.ts` for why that argument order is preserved verbatim.
     *
     * REJECTS when the brain is not ready, when the worker times out (15 s,
     * `bots/controller.js:124`), or when the observation builder rejects the
     * arena — which it does for any car count other than two.
     */
    decide(
      state: Float32Array,
      pads: readonly unknown[],
      playerSlot: number,
      botTeam: number,
    ): Promise<import("../seam.js").CarControls>;
    /** Terminate the worker, reject everything pending, clear ready state. */
    dispose(): void;
  }
}
