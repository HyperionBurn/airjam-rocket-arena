/**
 * The skill-based scripted bot: goal-aware, deterministic, three levels.
 *
 * Native axes: X/Y horizontal, Z up. Team 0 (blue) attacks +Y and defends -Y;
 * team 1 is the mirror image. Everything is driven by hand-built state blocks.
 */
import { describe, expect, it } from "vitest";

import { STATE } from "../../seam";
import { SCRIPTED_POLICIES, createScriptedPolicy } from "../scripted-bot";
import type { BotObservation } from "../bot-inference";

const CAR0 = STATE.CARS;
const CAR_STRIDE = STATE.CAR_STRIDE;

interface Scene {
  car: { x: number; y: number; fx: number; fy: number; boost?: number; onGround?: boolean };
  ball: { x: number; y: number; z?: number };
  team?: 0 | 1;
  tick?: number;
  slot?: number;
}

const observe = (scene: Scene): BotObservation => {
  const state = new Float32Array(510);
  const slot = scene.slot ?? 0;
  state[STATE.NUM_CARS] = slot + 1;
  const at = CAR0 + slot * CAR_STRIDE;
  state[at] = scene.car.x;
  state[at + 1] = scene.car.y;
  state[at + 3] = scene.car.fx;
  state[at + 4] = scene.car.fy;
  state[at + 18] = scene.car.boost ?? 60;
  state[at + 19] = (scene.car.onGround ?? true) ? 1 : 0;
  state[STATE.BALL] = scene.ball.x;
  state[STATE.BALL + 1] = scene.ball.y;
  state[STATE.BALL + 2] = scene.ball.z ?? 93;
  return {
    state,
    pads: [],
    slot,
    team: scene.team ?? 0,
    current: { throttle: 0, steer: 0, pitch: 0, yaw: 0, roll: 0, jump: false, boost: false, handbrake: false },
    kickoffTick: scene.tick ?? 0,
  };
};

const ace = SCRIPTED_POLICIES.ace;
const pro = SCRIPTED_POLICIES.pro;
const rookie = SCRIPTED_POLICIES.rookie;

describe("lining up behind the ball", () => {
  const behindAndAligned: Scene = { car: { x: 0, y: -2500, fx: 0, fy: 1 }, ball: { x: 0, y: 0 } };

  it("drives straight and boosts when it is behind the ball and pointing at it", () => {
    const controls = ace(observe(behindAndAligned));
    expect(controls.throttle).toBe(1);
    expect(Math.abs(controls.steer)).toBeLessThan(0.05);
    expect(controls.boost).toBe(true);
    expect(controls.handbrake).toBe(false);
  });

  it("the other team mirrors it: it attacks -Y", () => {
    const controls = ace(observe({ car: { x: 0, y: 2500, fx: 0, fy: -1 }, ball: { x: 0, y: 0 }, team: 1 }));
    expect(Math.abs(controls.steer)).toBeLessThan(0.05);
    expect(controls.boost).toBe(true);
  });

  it("aims BEHIND an off-centre ball (on the ball-to-goal line), not at it", () => {
    // Ball to the right of centre: lining up to shoot at the goal means aiming a
    // little to the right of the ball's far side, so a car pointing straight at
    // the ball is already slightly off its set-up line and must steer.
    const toBall = observe({ car: { x: 0, y: -2500, fx: 0, fy: 1 }, ball: { x: 1500, y: -200 } });
    const controls = ace(toBall);
    expect(Math.abs(controls.steer)).toBeGreaterThan(0.05);
  });

  it("strikes the ball directly once it is close", () => {
    const controls = ace(observe({ car: { x: 0, y: -300, fx: 0, fy: 1 }, ball: { x: 0, y: 0 } }));
    expect(Math.abs(controls.steer)).toBeLessThan(0.05);
  });
});

describe("getting back into position", () => {
  it("swings round, wide, when it is AHEAD of the ball instead of pushing the ball toward its own goal", () => {
    // Car is nearer the opponent's goal than the ball and facing it.
    const controls = ace(observe({ car: { x: 200, y: 1500, fx: 0, fy: 1 }, ball: { x: 0, y: 0 } }));
    // It must turn hard (its target is behind it), not charge on.
    expect(controls.steer === 1 || controls.steer === -1).toBe(true);
  });

  it("goes goal-side when the ball is deep in its own half and it is out of position", () => {
    // Own goal is at -Y for team 0. Ball at y=-3500, car far upfield facing +Y.
    const controls = ace(observe({ car: { x: 0, y: 500, fx: 0, fy: 1 }, ball: { x: 0, y: -3500 } }));
    // Target is behind it (toward its own goal): hard turn.
    expect(Math.abs(controls.steer)).toBe(1);
  });

  it("a rookie does not defend: it keeps chasing", () => {
    const rookieControls = rookie(observe({ car: { x: 0, y: 500, fx: 0, fy: -1 }, ball: { x: 0, y: -3500 } }));
    const aceControls = ace(observe({ car: { x: 0, y: 500, fx: 0, fy: -1 }, ball: { x: 0, y: -3500 } }));
    // Both are facing -Y toward the ball/goal; the difference is the target.
    expect(rookieControls).not.toEqual(aceControls);
  });
});

describe("skill levels", () => {
  const scene: Scene = { car: { x: 0, y: -2500, fx: 0, fy: 1 }, ball: { x: 0, y: 0, z: 300 } };

  it("a rookie never boosts and never jumps, and does not floor the throttle", () => {
    for (const tick of [0, 100, 777]) {
      const controls = rookie(observe({ ...scene, tick }));
      expect(controls.boost).toBe(false);
      expect(controls.jump).toBe(false);
      expect(controls.throttle).toBeLessThan(1);
    }
  });

  it("a rookie steers with a wobble; an ace does not", () => {
    const rookieSteer = [0, 60, 120, 180].map((tick) => rookie(observe({ ...scene, tick })).steer);
    expect(new Set(rookieSteer.map((v) => v.toFixed(3))).size).toBeGreaterThan(1);
    const aceSteer = [0, 60, 120, 180].map((tick) => ace(observe({ ...scene, tick })).steer);
    expect(new Set(aceSteer.map((v) => v.toFixed(3))).size).toBe(1);
  });

  it("pro and ace jump for a ball that is up in the air and close", () => {
    const close: Scene = { car: { x: 0, y: -250, fx: 0, fy: 1 }, ball: { x: 0, y: 0, z: 400 } };
    expect(pro(observe(close)).jump).toBe(true);
    expect(ace(observe(close)).jump).toBe(true);
    // ...but not for a ball on the ground.
    expect(ace(observe({ ...close, ball: { x: 0, y: 0, z: 93 } })).jump).toBe(false);
  });

  it("never boosts with an empty tank or in the air", () => {
    expect(ace(observe({ ...scene, car: { ...scene.car, boost: 0 } })).boost).toBe(false);
    expect(ace(observe({ ...scene, car: { ...scene.car, boost: 5 } })).boost).toBe(false);
    expect(ace(observe({ ...scene, car: { ...scene.car, onGround: false } })).boost).toBe(false);
  });
});

describe("safety", () => {
  it("is a pure function: the same observation always gives the same controls", () => {
    const scene: Scene = { car: { x: 300, y: -1800, fx: 0.3, fy: 0.95 }, ball: { x: -400, y: 200 }, tick: 321, slot: 0 };
    expect(pro(observe(scene))).toEqual(pro(observe(scene)));
  });

  it("every output stays inside the control ABI, wherever the car and ball are", () => {
    const places = [-4000, -1500, 0, 1500, 4000];
    for (const cx of places)
      for (const cy of places)
        for (const bx of [-3000, 0, 3000])
          for (const by of [-4800, 0, 4800]) {
            for (const policy of [rookie, pro, ace]) {
              const c = policy(observe({ car: { x: cx, y: cy, fx: 1, fy: 0 }, ball: { x: bx, y: by } }));
              expect(c.steer).toBeGreaterThanOrEqual(-1);
              expect(c.steer).toBeLessThanOrEqual(1);
              expect(c.throttle).toBeGreaterThanOrEqual(-1);
              expect(c.throttle).toBeLessThanOrEqual(1);
              expect(Number.isFinite(c.steer + c.throttle)).toBe(true);
            }
          }
  });

  it("returns neutral for a car that does not exist or a ball under the car", () => {
    const missing = observe({ car: { x: 0, y: 0, fx: 0, fy: 1 }, ball: { x: 0, y: 0 } });
    expect(ace({ ...missing, slot: 3 })).toMatchObject({ throttle: 0, steer: 0, boost: false, jump: false });
    expect(ace(missing)).toMatchObject({ throttle: 0, boost: false });
    expect(ace({ ...missing, state: new Float32Array(10) })).toMatchObject({ throttle: 0 });
  });

  it("createScriptedPolicy builds independent policies per skill", () => {
    expect(createScriptedPolicy("pro")).not.toBe(createScriptedPolicy("pro"));
  });
});
