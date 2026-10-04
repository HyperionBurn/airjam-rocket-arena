/**
 * Phase 4 — THE PER-PLAYER CAMERA POOL.
 *
 * OWNER: the Phase 4 worker (`src/airjam/viewports/**`).
 *
 * ===========================================================================
 * IS A SECOND INDEPENDENT CAMERA CLEANLY CONSTRUCTIBLE? — the precise answer
 * ===========================================================================
 * PARTLY. Split it in two, because the two halves have different answers:
 *
 * 1. THE `ChaseCamera` OBJECT: yes, cleanly and cheaply.
 *    `constructor(aspect, kernel)` (camera.js:27-38) allocates ONLY per-instance
 *    state — `this.settings = {...Ps}`, `this._ballCam = true`,
 *    `this.input = new Float64Array(32)`, `this.direction = new Vector3()`,
 *    `this.target = new Vector3()`, and `this.camera = new PerspectiveCamera(
 *    fov, aspect, 4, 40000)`. N instances are therefore N real cameras with N
 *    independent `ballCam` flags, N independent FOV values and N independent
 *    aspect ratios. The donor itself constructs extra cameras this way
 *    (`startup.js:991`, a `PerspectiveCamera` for the bot replay).
 *
 * 2. THE CAMERA *SOLVER*: no. This is the blocker, and it is not fixable from
 *    outside the donor.
 *    `kernel` is the shared `PhysicsSimulation` (`startup.js:308`), and
 *    `stepView` funnels into ONE minified WASM export over ONE malloc'd buffer
 *    (`simulation.js:62,153-165`; `legacy-physics.js:5189-5191`; see
 *    `view-kernel.ts` for the full trace). The smoothing that `stiffness` and
 *    `transitionSpeed` describe is WASM global state, and `stepView` is
 *    destructive — it overwrites that state and returns the same 42-float
 *    output every time. Constructing a second `ChaseCamera` over the same
 *    kernel does not produce a second camera: whichever view stepped last
 *    defines the numbers ALL of them read.
 *
 * WHAT THIS POOL THEREFORE DOES
 * It constructs N real donor `ChaseCamera`s (half 1, intact), and it gives each
 * one its OWN kernel:
 *
 *   - the first `exactViews` views get `DonorViewKernel` — the real WASM
 *     solver, exact donor feel, and the only configuration that is bit-exact;
 *   - every remaining view gets a `MirroredViewKernel` — a per-instance,
 *     pure-JS reimplementation of the same smoothing contract, driven by the
 *     donor's own `Ps` numbers. It is an APPROXIMATION and is labelled as one
 *     on every record it touches.
 *
 * `exactViews` defaults to 1. It is deliberately not 0: the local player's view
 * is the one place where exactness is worth a per-frame mismatch between
 * players. A host that would rather every player see the SAME camera may pass
 * `exactViews: 0`, and should — mixed quality is a worse competitive artefact
 * than uniformly approximate quality.
 *
 * NOTHING HERE EDITS DONOR SOURCE, and no donor change is required for any of
 * the above. If exact per-player cameras are wanted later, the only lever is
 * upstream: a second view-solver export in the WASM, or a per-car view state
 * in the bridge. That is a donor change, so it is reported, not attempted.
 */

import type { PlayerView, ViewportRect } from "../seam.js";
import { viewportAspect } from "./layouts.js";
import {
  DonorViewKernel,
  MirroredViewKernel,
  type MirroredViewKernelOptions,
  type ViewKernel,
} from "./view-kernel.js";

// The donor ships untyped JS and the package does not enable `allowJs`, so this
// import cannot be resolved by tsc. The real shape is modelled by
// `ChaseCameraLike` below, and every use of the constructor goes through
// `constructChaseCamera`, so `any` never escapes this file. `@ts-ignore` rather
// than `@ts-expect-error` so that enabling `allowJs` later does not turn the
// suppression itself into an error.
//
// The path is RELATIVE rather than the `@donor` alias on purpose. The package's
// `vitest.config.mjs` deliberately does not alias `@donor`, so that pure unit
// tests never pull in the browser-only WASM glue; an aliased import would make
// this module untestable and its per-player ball-cam invariant unverified. This
// donor module reaches only `three.js` and `class-fields.js`, so it loads fine
// in node and the pool is covered by `__tests__/camera-pool.test.ts`.
// @ts-ignore -- untyped donor module, shape modelled by ChaseCameraLike
import { ChaseCamera as DonorChaseCamera } from "../../donor/rendering/camera.js";

/* -------------------------------------------------------------------------- */
/* Structural models of the donor objects we touch                             */
/* -------------------------------------------------------------------------- */

export interface Vec3Like {
  x: number;
  y: number;
  z: number;
  set(x: number, y: number, z: number): unknown;
}

/** The parts of a car / ball `Object3D` the donor passes to `update`. */
export interface TransformLike {
  position: Vec3Like;
  quaternion: { x: number; y: number; z: number; w: number };
}

/** The `be` state object built at `startup.js:896-903`. */
export interface CarCameraStateLike {
  onGround?: boolean;
  groundNormal?: Vec3Like;
  velocity?: Vec3Like;
  supersonic?: boolean;
  lookX?: number;
  lookY?: number;
}

export interface PerspectiveCameraLike {
  aspect: number;
  fov: number;
  near: number;
  far: number;
  position: Vec3Like;
  up: Vec3Like;
  lookAt(x: number | Vec3Like, y?: number, z?: number): unknown;
  updateProjectionMatrix(): unknown;
}

/** The donor's own feel settings, writable per instance (camera.js:30). */
export interface ChaseCameraSettings {
  cameraShake: boolean;
  fov: number;
  distance: number;
  height: number;
  angleDeg: number;
  stiffness: number;
  swivelSpeed: number;
  transitionSpeed: number;
  invertSwivel: boolean;
}

/** `class ChaseCamera` (camera.js:26-104), modelled rather than inferred. */
export interface ChaseCameraLike {
  settings: ChaseCameraSettings;
  ballCam: boolean;
  input: Float64Array;
  camera: PerspectiveCameraLike;
  kernel: ViewKernel;
  /** `update(car, ball, swivel, state)` — camera.js:45. */
  update(car: TransformLike, ball: TransformLike, swivel: number, state: CarCameraStateLike | null): void;
}

type ChaseCameraCtor = new (aspect: number, kernel: ViewKernel) => ChaseCameraLike;

function constructChaseCamera(aspect: number, kernel: ViewKernel): ChaseCameraLike {
  const Ctor = DonorChaseCamera as unknown as ChaseCameraCtor;
  return new Ctor(aspect, kernel);
}

/* -------------------------------------------------------------------------- */
/* The pool                                                                    */
/* -------------------------------------------------------------------------- */

/** One view's per-player state. All of it is per-player by construction. */
export interface PlayerCamera {
  /** The donor instance. Own `PerspectiveCamera`, own `ballCam`, own settings. */
  readonly chase: ChaseCameraLike;
  /** The seam's `PlayerView`, with `camera` = this view's own donor instance. */
  readonly view: PlayerView;
  /** True when driven by the real WASM solver; false when mirrored. */
  readonly exact: boolean;
  /** This view's own kernel. Never shared with another view. */
  readonly kernel: ViewKernel;
}

export interface PlayerViewPoolOptions {
  /**
   * How many views get the donor's real WASM kernel. Default 1. See the header:
   * 1 is exact and the rest are approximate, 0 is uniformly approximate, and
   * anything above 1 is NOT supported because there is only one kernel.
   */
  readonly exactViews?: number;
  /** Tuning forwarded to each `MirroredViewKernel`. */
  readonly mirror?: MirroredViewKernelOptions;
}

interface Entry {
  readonly playerId: string;
  slot: number;
  rect: ViewportRect;
  ballCam: boolean;
  readonly camera: PlayerCamera;
}

export class PlayerViewPool {
  private readonly donorKernel: ViewKernel;
  private readonly exactViews: number;
  private readonly mirrorOptions: MirroredViewKernelOptions;
  private readonly entries = new Map<string, Entry>();
  private order: string[] = [];

  /**
   * @param donorKernel The single `PhysicsSimulation`-backed view solver, i.e.
   *   what the donor passes at `startup.js:308`. Wrapped, not shared: the pool
   *   hands it to at most `exactViews` views.
   */
  constructor(donorKernel: ViewKernel, options: PlayerViewPoolOptions = {}) {
    const exactViews = options.exactViews ?? 1;
    if (!Number.isInteger(exactViews) || exactViews < 0) {
      throw new RangeError(`exactViews must be a non-negative integer, got ${exactViews}`);
    }
    this.donorKernel = new DonorViewKernel(donorKernel);
    this.exactViews = exactViews;
    this.mirrorOptions = options.mirror ?? {};
  }

  /**
   * Resize every live view's camera to its rect's aspect.
   *
   * The donor sets `camera.aspect = innerWidth / innerHeight` — the CANVAS
   * aspect (`startup.js:308`, `startup.js:675`). That is right for one view and
   * wrong for every sub-rect: a 960x1080 column is 0.89, and feeding it 1.78
   * shears the image. Must be called after every resize.
   */
  syncAspects(): void {
    for (const entry of this.entries.values()) {
      const aspect = viewportAspect(entry.rect);
      entry.camera.chase.camera.aspect = aspect;
      entry.camera.chase.camera.updateProjectionMatrix();
    }
  }

  /** Bind the rects the renderer is using, in the same order. */
  setRects(rects: readonly ViewportRect[]): void {
    const ids = this.order;
    for (let i = 0; i < rects.length && i < ids.length; i++) {
      const entry = this.entries.get(ids[i]);
      if (entry) entry.rect = rects[i];
    }
    this.syncAspects();
  }

  /**
   * Claim a viewport for a player, creating its camera on first use. Pooling is
   * by playerId so a player who leaves and rejoins keeps their camera, ball-cam
   * state and smoothing continuity.
   */
  acquire(playerId: string, slot: number, rect: ViewportRect): PlayerView {
    const existing = this.entries.get(playerId);
    if (existing) {
      existing.slot = slot;
      existing.rect = rect;
      existing.camera.chase.camera.aspect = viewportAspect(rect);
      existing.camera.chase.camera.updateProjectionMatrix();
      return existing.camera.view;
    }

    const index = this.order.length;
    const exact = index < this.exactViews;
    // Never shared: exact views get the one donor kernel, the rest get their
    // own mirror with its own state.
    const kernel: ViewKernel = exact
      ? this.donorKernel
      : new MirroredViewKernel(this.mirrorOptions);
    const chase = constructChaseCamera(viewportAspect(rect), kernel);

    const camera: PlayerCamera = {
      chase,
      kernel,
      exact,
      view: undefined as unknown as PlayerView,
    };
    const view: PlayerView = {
      playerId,
      slot,
      rect,
      ballCam: chase.ballCam,
      camera: chase,
    };
    (camera as { view: PlayerView }).view = view;

    this.entries.set(playerId, { playerId, slot, rect, ballCam: chase.ballCam, camera });
    this.order.push(playerId);
    return view;
  }

  release(playerId: string): void {
    const entry = this.entries.get(playerId);
    if (!entry) return;
    // Drop this view's smoothing state so a rejoining player does not inherit
    // a camera that was flying in from a car they no longer drive.
    entry.camera.kernel.resetView();
    this.entries.delete(playerId);
    this.order = this.order.filter((id) => id !== playerId);
  }

  /**
   * Set ONE player's ball-cam. Per-player by construction: the flag lives on
   * that view's own donor `ChaseCamera` instance (`camera.js:39-44`), never on
   * the pool, so two players can never share a mode.
   */
  setBallCam(playerId: string, enabled: boolean): void {
    const entry = this.entries.get(playerId);
    if (!entry) return;
    entry.camera.chase.ballCam = enabled;
    entry.ballCam = enabled;
    entry.camera.view.ballCam = enabled;
  }

  toggleBallCam(playerId: string): boolean {
    const entry = this.entries.get(playerId);
    if (!entry) return false;
    this.setBallCam(playerId, !entry.ballCam);
    return entry.ballCam;
  }

  /**
   * Run ONE view's camera for this frame, from that player's own car and the
   * shared ball. `swivel` is the donor's third argument, which its own call
   * sites pass the frame delta (see `view-kernel.ts`: input slot 0 is delta).
   */
  updateView(
    playerId: string,
    car: TransformLike,
    ball: TransformLike,
    swivel: number,
    state: CarCameraStateLike | null,
  ): boolean {
    const entry = this.entries.get(playerId);
    if (!entry) return false;
    entry.camera.chase.update(car, ball, swivel, state);
    return true;
  }

  /** Every live view, in acquisition order. */
  views(): readonly PlayerView[] {
    return this.order.map((id) => this.entries.get(id)!.camera.view);
  }

  /** The seam's `PlayerView` for a player, or null. */
  viewOf(playerId: string): PlayerView | null {
    return this.entries.get(playerId)?.camera.view ?? null;
  }

  /** The per-view camera record, including the exactness flag. */
  cameraOf(playerId: string): PlayerCamera | null {
    return this.entries.get(playerId)?.camera ?? null;
  }

  /** Per-player camera state for the HUD layer. */
  ballCamOf(playerId: string): boolean {
    return this.entries.get(playerId)?.ballCam ?? false;
  }

  /** How many live views are driven by the real WASM solver. */
  exactViewCount(): number {
    let n = 0;
    for (const id of this.order) if (this.entries.get(id)!.camera.exact) n++;
    return n;
  }

  /** Drop every view. For teardown only. */
  dispose(): void {
    for (const entry of this.entries.values()) entry.camera.kernel.resetView();
    this.entries.clear();
    this.order = [];
  }
}
