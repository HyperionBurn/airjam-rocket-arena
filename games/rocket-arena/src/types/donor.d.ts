/*
 * The donor tree under `src/donor/` is plain ESM JavaScript copied verbatim from
 * the Rocket Arena donor. `allowJs` is deliberately off so `tsc` never tries to
 * typecheck 183 minified/optimised donor modules; the shell only needs the one
 * entry point's shape.
 *
 * `@donor/*` is a Vite `resolve.alias` (see `vite.config.ts`). It is deliberately
 * NOT a tsconfig `paths` entry: a path that resolves to a real `.js` file would
 * make TypeScript look for a declaration next to it and fail, whereas an
 * unresolvable specifier falls through to the ambient module below.
 */
declare module "@donor/app/startup.js" {
  /**
   * Boots the donor game. Resolves once the donor's frame scheduler is running.
   * The donor swallows its own startup failure (it renders into `#loading` and
   * calls `console.error`), so a resolved promise does not imply success — watch
   * the `#loading` element's `data-state` for the authoritative signal.
   */
  export function boot(): Promise<unknown>;
}

/**
 * `src/donor/physics/simulation.js` exports exactly one binding: the class the
 * donor instantiates internally during boot. The port never constructs it — it
 * patches `prototype.setControls` (see `src/airjam/seam.ts`) to intercept the
 * per-slot controls the donor feeds the WASM heap.
 *
 * Declared as a VALUE export, not a type-only one, because the seam needs
 * `PhysicsSimulation.prototype` at runtime.
 */
declare module "@donor/physics/simulation.js" {
  /**
   * The subset of the donor sim that is contractually stable for this port. The
   * donor is minified and untyped, so this is deliberately the smallest surface
   * the port depends on — see `PortedSim` in `src/airjam/seam.ts` for the
   * structural type the seam actually programs against.
   */
  export class PhysicsSimulation {
    /**
     * Writes one car's controls. Called by the donor once per car per frame from
     * its own keyboard/gamepad/touch arbitration (`startup.js:721-723` for the
     * human, `:753` for a bot). Accepts the donor's canonical control object OR
     * an 8-float array; the seam normalises both.
     */
    setControls(slot: number, controls: unknown): void;
    /** Advances the fixed 120 Hz simulation. */
    step(ticks?: number): void;
    /** Live view of the 510-float WASM state block. */
    readonly state: Float32Array;
    /** Emscripten module, for the `_physics_*` exports (addCar, setCarState, ...). */
    readonly module: unknown;
  }
}

/**
 * AIR JAM PATCH — `src/donor/app/arena-bridge.js` is a small file added to the
 * donor tree (not upstream). It is the one rendezvous point between the donor's
 * `startup.js` and this shell: the shell sets `embedded` before `boot()`, and
 * the donor publishes its local-match controller once it has finished loading.
 * The controller's real shape lives in `src/host/local-match.ts`.
 */
declare module "@donor/app/arena-bridge.js" {
  export const arenaBridge: {
    /** Set to true BEFORE `boot()`: skips the donor's home screen and online restore. */
    embedded: boolean;
    controller: unknown;
    attach(controller: unknown): void;
    whenReady(): Promise<unknown>;
  };
}
