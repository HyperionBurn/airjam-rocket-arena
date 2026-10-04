/**
 * The donor-side match controller (`src/donor/app/local-multiplayer.js`) with its
 * heavy collaborators replaced by fakes: no WebGL, no WASM, no audio.
 *
 * What is real: the donor's `MatchSession` (clock / phases / score), its
 * `PhysicsClock`, the state layout, the tiling and FOV math. What is fake: the
 * physics module (a plain Float32Array "heap"), the world and its effects, the
 * cameras, the audio. That is enough to pin the behaviours that are the
 * controller's own: roster setup, event-mode tuning, events, seat takeover.
 */
// @ts-nocheck -- exercising an untyped donor module through fakes
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../donor/vendor/three.js", () => ({
  F: class {
    x = 0;
    y = 0;
    z = 0;
    set(x: number, y: number, z: number) {
      this.x = x;
      this.y = y;
      this.z = z;
      return this;
    }
    distanceToSquared() {
      return 0;
    }
    setFromMatrixColumn() {
      return this;
    }
  },
  mt: class {
    makeRotationFromQuaternion() {
      return this;
    }
  },
}));
vi.mock("../../donor/vendor/legacy-physics.js", () => ({
  jC: async () => ({
    HEAPF64: new Float64Array(64),
    _v0: () => 0,
    _v1: () => {},
    _v2: () => {},
  }),
}));
vi.mock("../../donor/rendering/camera.js", () => ({
  ChaseCamera: class {
    settings = { fov: 110 };
    ballCam = true;
    kernel: unknown;
    camera = {
      aspect: 1.78,
      fov: 110,
      position: { toArray: () => [0, 0, 0] },
      quaternion: { toArray: () => [0, 0, 0, 1] },
      updateProjectionMatrix() {},
    };
    constructor(_aspect: number, kernel: unknown) {
      this.kernel = kernel;
    }
    update() {}
  },
}));
vi.mock("../../donor/effects/speed-lines.js", () => ({
  SpeedLines: class {
    pass = { enabled: false };
    update() {}
  },
}));
vi.mock("../../donor/effects/ball-locator.js", () => ({
  BallLocator: class {
    object = { visible: false, removeFromParent() {} };
    update() {}
  },
}));
vi.mock("../../donor/audio/engine.js", () => ({ EngineAudio: class { update() {} } }));
vi.mock("../../donor/audio/vehicle.js", () => ({ VehicleAudio: class { update() {} } }));
vi.mock("../../donor/rendering/arena-look.js", () => ({ applyDuskLook() {} }));
vi.mock("../../donor/effects/arena-fx.js", () => ({
  GoalBurst: class {
    trigger() {}
    update() {}
    clear() {}
  },
  BoostGlow: class {
    update() {}
    clear() {}
  },
}));
vi.mock("../../donor/audio/arena-sfx.js", () => ({
  ArenaSfx: class {
    tick() {}
    go() {}
    goal() {}
    demolish() {}
    pickup() {}
    finalWhistle() {}
  },
}));

// eslint-disable-next-line import/first
import { createLocalMultiplayer, DEFAULT_TUNING } from "../../donor/app/local-multiplayer.js";
// eslint-disable-next-line import/first
import { MatchSession } from "../../donor/match/session.js";
// eslint-disable-next-line import/first
import { PhysicsClock } from "../../donor/physics/clock.js";

const CARS = 22;
const STRIDE = 51;
const CONTROLS_PTR = 4000 * 4; // byte offset into the fake heap
const ballHitAt = (car: number) => CARS + car * STRIDE + 46;
const ballHitSpeedAt = (car: number) => CARS + car * STRIDE + 47;

const makeCtx = () => {
  const state = new Float32Array(510);
  const heap = new Float32Array(8192);
  const setBallState = vi.fn(() => 1);
  const sim = {
    state,
    controlsPtr: CONTROLS_PTR,
    module: {
      HEAPF32: heap,
      _malloc: () => 100 * 4,
      _free: () => {},
      _physics_setBallState: setBallState,
    },
    configureOnline: vi.fn((cars: unknown[]) => {
      state[2] = cars.length;
    }),
    setUnlimitedBoost: vi.fn(),
    setGoalExplosionEnabled: vi.fn(),
    setControls: vi.fn((car: number) => {
      heap.fill(0, CONTROLS_PTR / 4 + car * 8, CONTROLS_PTR / 4 + car * 8 + 8);
    }),
    step: vi.fn(() => {
      state[0] += 1;
    }),
    pollGoal: vi.fn(() => 0),
    ballOnGround: false,
  };
  const session = new MatchSession();
  const body = () => ({ position: { x: 0, y: 0, z: 0, distanceToSquared: () => 0 }, quaternion: {}, visible: true });
  const cars: Array<ReturnType<typeof body>> = [];
  const world = {
    carVisual: "fennec",
    ball: body(),
    scene: { add() {} },
    cars,
    carWheels: [],
    carWheelSpecs: [],
    ballLocatorArrow: { object: { visible: false } },
    controlsByCar: undefined as unknown,
    prepareOnlineRoster: vi.fn(async (roster: unknown[]) => {
      cars.length = 0;
      roster.forEach(() => cars.push(body()));
    }),
    update: vi.fn(),
    prepareBallSpeedTrail: vi.fn(),
  };
  const clock = new PhysicsClock({ state }, { ballOffset: 4 });
  const goalPresentation = { active: false, playerIndex: 0, finish: vi.fn(), update: vi.fn(), begin: vi.fn(), elapsed: 0, replaying: false };
  const posts: Array<{ dispose: ReturnType<typeof vi.fn> }> = [];
  const ctx = {
    sim,
    world,
    session,
    clock,
    renderer: {
      getPixelRatio: () => 1,
      setViewport() {},
      setScissor() {},
      setScissorTest() {},
      autoClear: true,
      render() {},
      shadowMap: { needsUpdate: false },
    },
    root: { classList: { add() {}, remove() {} } },
    baseCamera: { settings: { fov: 110 }, camera: { aspect: 1.78, updateProjectionMatrix() {} } },
    profiler: { frameStart() {}, mark() {}, frameEnd() {} },
    quality: { shadows: false, effects: false },
    goalPresentation,
    arenaEffects: { update() {}, pickup() {} },
    motionEffects: { update() {}, orient() {}, clear() {} },
    replayBuffer: { record() {} },
    engines: [{ update() {} }, { update() {} }],
    vehicleAudio: { update() {} },
    impactAudio: { update() {} },
    ballAudio: { update() {} },
    impactSerials: [0, 0],
    neutralControls: { throttle: 0, steer: 0, pitch: 0, yaw: 0, roll: 0, jump: false, boost: false, handbrake: false },
    pads: [],
    wheelStride: 3,
    setAudioListener: vi.fn(),
    makePost: vi.fn(() => {
      const post = { render() {}, dispose: vi.fn() };
      posts.push(post);
      return post;
    }),
    resetKickoff: vi.fn(() => {
      // Mirrors the donor's `_e`, which always ends by calling the local hook.
      controller.afterReset();
    }),
    syncNativeGeometry: vi.fn(),
    garageVisual: () => "fennec",
    setPrimaryVisual: vi.fn(async () => {}),
    leave: vi.fn(),
  };
  const controller = createLocalMultiplayer(ctx);
  return { ctx, controller, sim, state, heap, world, session, setBallState, goalPresentation, posts };
};

let h: ReturnType<typeof makeCtx>;
beforeEach(() => {
  vi.stubGlobal("window", { innerWidth: 1600, innerHeight: 900 });
  vi.stubGlobal("document", { hidden: false });
  h = makeCtx();
});

const twoCars = [{ team: 0 }, { team: 1 }] as const;

describe("start", () => {
  it("builds the roster, gives every human car a viewport and none to bots", async () => {
    const result = await h.controller.start([
      { team: 0, visual: "spectre" },
      { team: 1, visual: "vesper" },
      { team: 0, human: false, visual: "challenger" },
    ]);
    expect(result).toEqual({ cars: 3, views: 2 });
    expect(h.world.prepareOnlineRoster).toHaveBeenCalledWith([
      { team: 0, visual: "spectre", human: true },
      { team: 1, visual: "vesper", human: true },
      { team: 0, visual: "challenger", human: false },
    ]);
    expect(h.sim.configureOnline).toHaveBeenCalledTimes(1);
    const hud = h.controller.hud();
    expect(hud.cars.map((c: { human: boolean }) => c.human)).toEqual([true, true, false]);
    expect(h.controller.active).toBe(true);
  });

  it("swaps the donor's boot car to the first player's chosen body, only when it differs", async () => {
    await h.controller.start([{ team: 0, visual: "spectre" }, { team: 1 }]);
    expect(h.ctx.setPrimaryVisual).toHaveBeenCalledWith("spectre", 0);
    h.ctx.setPrimaryVisual.mockClear();
    h.world.carVisual = "fennec";
    await h.controller.start([{ team: 0, visual: "fennec" }, { team: 1 }]);
    expect(h.ctx.setPrimaryVisual).not.toHaveBeenCalled();
  });

  it("uses the garage car for car 0 and a default body for others when none is chosen", async () => {
    await h.controller.start([...twoCars]);
    expect(h.world.prepareOnlineRoster.mock.calls[0][0].map((c: { visual: string }) => c.visual)).toEqual(["fennec", "octane-original"]);
  });

  it("refuses an empty or oversized roster", async () => {
    await expect(h.controller.start([])).rejects.toThrow(RangeError);
    await expect(h.controller.start(Array.from({ length: 7 }, () => ({ team: 0 })))).rejects.toThrow(RangeError);
  });

  it("applies the regulation length", async () => {
    await h.controller.start([...twoCars], { matchSeconds: 90 });
    expect(h.session.state.remainingSeconds).toBe(90);
    expect(h.session.remaining).toBe(90 * 120);
  });

  it("every car's controls start neutral and the first kickoff keeps its full countdown", async () => {
    await h.controller.start([...twoCars], { tuning: { kickoffReset: "fast" } });
    expect(h.session.state.phase).toBe("kickoff");
    expect(h.session.state.countdown).toBe(3);
  });
});

describe("event-mode tuning", () => {
  it("defaults to a stock match", async () => {
    await h.controller.start([...twoCars]);
    expect(h.controller.hud().tuning).toEqual(DEFAULT_TUNING);
    expect(h.sim.setUnlimitedBoost).toHaveBeenLastCalledWith(false);
  });

  it("turbo boost is unlimited boost", async () => {
    await h.controller.start([...twoCars], { tuning: { boost: "turbo" } });
    expect(h.sim.setUnlimitedBoost).toHaveBeenLastCalledWith(true);
  });

  it("fast kickoff shortens every countdown after the first, never the first", async () => {
    await h.controller.start([...twoCars], { tuning: { kickoffReset: "fast" } });
    // A goal happened; the donor starts a new kickoff and calls its reset.
    h.session.kickoff();
    h.ctx.resetKickoff();
    expect(h.session.state.phase).toBe("kickoff");
    expect(h.session.phaseTicks).toBeLessThanOrEqual(120);
    expect(h.session.state.countdown).toBe(1);
  });

  it("normal kickoffs keep the full 3 s", async () => {
    await h.controller.start([...twoCars]);
    h.session.kickoff();
    h.ctx.resetKickoff();
    expect(h.session.state.countdown).toBe(3);
  });

  it("a heavy ball gives back only part of its speed after a car touch", async () => {
    await h.controller.start([...twoCars], { tuning: { ball: "heavy" } });
    h.session.state.phase = "playing";
    h.session.state.paused = false;
    // The physics step "touches" the ball with car 1.
    h.sim.step.mockImplementation(() => {
      h.state[ballHitAt(1)] += 1;
      h.state[ballHitSpeedAt(1)] = 2000;
    });
    const edits: number[][] = [];
    h.setBallState.mockImplementation(() => {
      edits.push(Array.from(h.heap.slice(100, 118)));
      return 1;
    });
    h.state[4 + 12] = 1000; // ball velocity x
    h.controller.frame(performance.now() + 20);
    // `editBall` copies the ball block from the state, scales velocity, writes it back.
    expect(edits.length).toBeGreaterThan(0);
    expect(edits[0][12]).toBeCloseTo(780, 0);
  });

  it("a stock ball is never rewritten", async () => {
    await h.controller.start([...twoCars]);
    h.session.state.phase = "playing";
    h.sim.step.mockImplementation(() => {
      h.state[ballHitAt(1)] += 1;
    });
    h.controller.frame(performance.now() + 20);
    expect(h.setBallState).not.toHaveBeenCalled();
  });

  it("a short goal celebration skips the replay once the celebration has played", async () => {
    await h.controller.start([...twoCars], { tuning: { goalCelebration: "short" } });
    h.goalPresentation.finish.mockClear(); // start() cancels any celebration once
    h.goalPresentation.active = true;
    h.goalPresentation.elapsed = 1.0;
    h.controller.frame(performance.now() + 16);
    expect(h.goalPresentation.finish).not.toHaveBeenCalled();
    h.goalPresentation.elapsed = 2.1;
    h.controller.frame(performance.now() + 32);
    expect(h.goalPresentation.finish).toHaveBeenCalledTimes(1);
  });

  it("a full celebration is left alone", async () => {
    await h.controller.start([...twoCars]);
    h.goalPresentation.finish.mockClear();
    h.goalPresentation.active = true;
    h.goalPresentation.elapsed = 5;
    h.goalPresentation.replaying = true;
    h.controller.frame(performance.now() + 16);
    expect(h.goalPresentation.finish).not.toHaveBeenCalled();
  });
});

describe("events", () => {
  it("publishes ball touches with the touching car and its speed", async () => {
    const events: unknown[] = [];
    await h.controller.start([...twoCars]);
    h.controller.onEvent((event: unknown) => events.push(event));
    h.session.state.phase = "playing";
    h.sim.step.mockImplementation(() => {
      h.state[ballHitAt(0)] += 1;
      h.state[ballHitSpeedAt(0)] = 1234;
    });
    h.controller.frame(performance.now() + 20);
    expect(events).toContainEqual({ type: "hit", car: 0, speed: 1234 });
  });

  it("publishes phase changes and demolitions, and stops after unsubscribe", async () => {
    const events: Array<{ type: string }> = [];
    await h.controller.start([...twoCars]);
    const off = h.controller.onEvent((event: { type: string }) => events.push(event));
    h.controller.frame(performance.now() + 20);
    expect(events.some((e) => e.type === "phase")).toBe(true);
    h.state[CARS + 1 * STRIDE + 21] = 1; // car 1 demolished
    h.controller.frame(performance.now() + 40);
    expect(events).toContainEqual({ type: "demolished", car: 1 });
    off();
    const seen = events.length;
    h.state[CARS + 0 * STRIDE + 21] = 1;
    h.controller.frame(performance.now() + 60);
    expect(events).toHaveLength(seen);
  });

  it("a throwing listener cannot break the frame", async () => {
    await h.controller.start([...twoCars]);
    h.controller.onEvent(() => {
      throw new Error("boom");
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => h.controller.frame(performance.now() + 20)).not.toThrow();
    warn.mockRestore();
  });
});

describe("seat takeover", () => {
  it("gives a bot's car a viewport and takes it away again", async () => {
    await h.controller.start([{ team: 0 }, { team: 1 }, { team: 0, human: false }, { team: 1, human: false }]);
    expect(h.controller.hud().views.map((v: { car: number }) => v.car)).toEqual([0, 1]);

    expect(h.controller.addHumanView(3)).toBe(true);
    expect(h.controller.hud().views.map((v: { car: number }) => v.car)).toEqual([0, 1, 3]);
    expect(h.controller.hud().cars[3].human).toBe(true);
    // One post-processing chain per view.
    expect(h.ctx.makePost).toHaveBeenCalledTimes(3);

    expect(h.controller.removeHumanView(3)).toBe(true);
    expect(h.controller.hud().views.map((v: { index: number }) => v.index)).toEqual([0, 1]);
    expect(h.posts[2].dispose).toHaveBeenCalled();
  });

  it("refuses nonsense and never removes the last view", async () => {
    await h.controller.start([{ team: 0 }, { team: 1, human: false }]);
    expect(h.controller.addHumanView(0)).toBe(false); // already has one
    expect(h.controller.addHumanView(9)).toBe(false);
    expect(h.controller.addHumanView(-1)).toBe(false);
    expect(h.controller.addHumanView(1.5)).toBe(false);
    expect(h.controller.removeHumanView(0)).toBe(false); // the only view
    expect(h.controller.removeHumanView(1)).toBe(false); // has no view
  });

  it("does nothing when no match is running", () => {
    expect(h.controller.addHumanView(0)).toBe(false);
    expect(h.controller.removeHumanView(0)).toBe(false);
  });
});

describe("controls", () => {
  it("asks the sim for every car's controls each tick, using a bot's controls where there is one", async () => {
    await h.controller.start([{ team: 0 }, { team: 1, human: false }]);
    const botControls = { ...h.ctx.neutralControls, throttle: 1 };
    h.controller.setBotDriver({ tick: vi.fn(), controls: (slot: number) => (slot === 1 ? botControls : null) });
    h.session.state.phase = "playing";
    h.controller.frame(performance.now() + 20);
    const calls = h.sim.setControls.mock.calls;
    expect(calls.some(([car, c]) => car === 0 && c === h.ctx.neutralControls)).toBe(true);
    expect(calls.some(([car, c]) => car === 1 && c === botControls)).toBe(true);
  });

  it("keeps asking during the countdown, so phones are never read as vanished", async () => {
    await h.controller.start([...twoCars]);
    expect(h.session.state.phase).toBe("kickoff");
    h.sim.setControls.mockClear();
    h.controller.frame(performance.now() + 40);
    expect(h.sim.setControls).toHaveBeenCalled();
    expect(h.sim.step).not.toHaveBeenCalled(); // the sim does not step in the countdown
  });

  it("only ticks the bot driver while the ball is live", async () => {
    await h.controller.start([{ team: 0 }, { team: 1, human: false }]);
    const tick = vi.fn();
    h.controller.setBotDriver({ tick, controls: () => null });
    h.controller.frame(performance.now() + 40); // kickoff countdown
    expect(tick).not.toHaveBeenCalled();
    h.session.state.phase = "playing";
    h.controller.frame(performance.now() + 80);
    expect(tick).toHaveBeenCalled();
  });

  it("feeds each car's own applied controls to the world for jets and flames", async () => {
    await h.controller.start([...twoCars]);
    h.session.state.phase = "playing";
    h.session.state.paused = false;
    h.sim.setControls.mockImplementation((car: number) => {
      const at = CONTROLS_PTR / 4 + car * 8;
      h.heap[at] = car === 1 ? 1 : 0; // throttle
      h.heap[at + 6] = car === 1 ? 1 : 0; // boost
    });
    h.controller.frame(performance.now() + 20);
    const applied = h.world.controlsByCar as Array<{ throttle: number; boost: boolean }>;
    expect(applied[0].boost).toBe(false);
    expect(applied[1]).toMatchObject({ throttle: 1, boost: true });
  });

  it("a one-tick jump pulse is not lost between frames", async () => {
    await h.controller.start([...twoCars]);
    h.session.state.phase = "playing";
    h.session.state.paused = false;
    let tickNo = 0;
    h.sim.setControls.mockImplementation((car: number) => {
      const at = CONTROLS_PTR / 4 + car * 8;
      // Only the first tick of the frame carries the jump.
      h.heap[at + 5] = car === 0 && tickNo === 0 ? 1 : 0;
    });
    h.sim.step.mockImplementation(() => {
      tickNo += 1;
      h.state[0] += 1;
    });
    h.controller.frame(performance.now() + 40); // several 120 Hz ticks in one frame
    expect((h.world.controlsByCar as Array<{ jump: boolean }>)[0].jump).toBe(true);
  });
});

describe("stop", () => {
  it("tears everything down and hands control back to the donor", async () => {
    await h.controller.start([...twoCars]);
    await h.controller.stop();
    expect(h.controller.active).toBe(false);
    expect(h.ctx.leave).toHaveBeenCalledTimes(1);
    expect(h.world.controlsByCar).toBeNull();
    expect(h.posts.every((p) => p.dispose.mock.calls.length === 1)).toBe(true);
    // Idempotent.
    await h.controller.stop();
    expect(h.ctx.leave).toHaveBeenCalledTimes(1);
  });
});
