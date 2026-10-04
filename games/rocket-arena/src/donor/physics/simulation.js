import { NETWORK_CORE_SHA256 } from './network-core.js';
import { PHYSICS_PRESETS, resolvePhysicsSelection, resolveVisualHitboxFamily } from "./presets.js";
import { initializeGameplayPhysics } from "./source-runtime.js";
import { addConfiguredCar, readNativeCarConfig } from "./car-config.js";
import { _ } from "../core/class-fields.js";
import { jC } from "../vendor/legacy-physics.js";
import { BALL_ACTIONS, CAR_STATE, STATE_LAYOUT, _C, getTeamAssignment, kf, no, u0 } from "./state-layout.js";

class PhysicsSimulation {
  constructor(selection = resolvePhysicsSelection("")) {
    this.physicsSelection = selection;
    this.carConfigs = [];
    this.lastLaunch = null;
    this.ballActionHistory = [];
    _(this, "module");
    _(this, "statePtr", 0);
    _(this, "controlsPtr", 0);
    _(this, "viewPtr", 0);
    _(this, "stateLen", 0);
    _(this, "stateView", null);
    _(this, "controlsView", null);
    _(this, "viewView", null);
  }
  get state() {
    const e = this.module.HEAPF32.buffer;
    return (
      (!this.stateView || this.stateView.buffer !== e) &&
        (this.stateView = new Float32Array(e, this.statePtr, this.stateLen)),
      this.stateView
    );
  }
  async init(dependencies) {
    this.module = await initializeGameplayPhysics(jC, this.physicsSelection, dependencies);
    const e = await (
        await fetch("/assets/arena/collision/manifest.json")
      ).json(),
      t = await Promise.all(
        e.map(
          async (A) =>
            new Uint8Array(
              await (await fetch(`/assets/arena/collision/${A}`)).arrayBuffer(),
            ),
        ),
      ),
      n = t.reduce((A, l) => A + l.length, 0),
      r = this.module._malloc(n),
      s = this.module._malloc(t.length * 4);
    let a = 0;
    t.forEach((A, l) => {
      (this.module.HEAPU8.set(A, r + a),
        (this.module.HEAP32[s / 4 + l] = A.length),
        (a += A.length));
    });
    const o = this.module._physics_init(r, s, t.length);
    if ((this.module._free(r), this.module._free(s), o !== 1))
      throw new Error("Physics initialization failed — check collision meshes");
    if (this.module._physics_createArena() !== 1)
      throw new Error("Arena creation failed");
    ((this.statePtr = this.module._physics_getStatePtr()),
      (this.stateLen = this.module._physics_getStateSize()),
      (this.controlsPtr = this.module._physics_getControlsPtr()),
      (this.viewPtr = this.module._v0()),
      (this.stateView = null),
      (this.controlsView = null),
      (this.viewView = null),
      this.module._v2());
  }
  addCar(e, t = "default") {
    const index = this.physicsSelection.engine === "experimental" && this.carConfigs.length === 0
      ? addConfiguredCar(this.module, e, PHYSICS_PRESETS[this.physicsSelection.family])
      : this.module._physics_addCar(e, t === "flat" ? 1 : 0);
    if (index >= 0) this.carConfigs[index] = readNativeCarConfig(this.module, index);
    return index;
  }
  configureCars(e, t, n = 0) {
    const { playerTeam: r, botTeam: s } = getTeamAssignment(e === "flat");
    if (this.module._physics_createArena() !== 1)
      throw new Error("Arena creation failed");
    this.carConfigs = [];
    if (this.addCar(t ? r : n, e) !== _C)
      throw new Error("Player creation failed");
    if (t && this.addCar(s, "default") !== no)
      throw new Error("Opponent creation failed");
    (this.resetKickoff(), this.resetView());
  }
  configureOnline(roster) {
    if (this.physicsSelection.engine !== "experimental") throw new Error("Online requires the default source physics. Remove physics=original from the URL and reload.");
    if (this.module._physics_createArena() !== 1) throw new Error("Arena creation failed");
    this.carConfigs = [];
    roster.forEach((player, index) => {
      if (addConfiguredCar(this.module, player.team, PHYSICS_PRESETS[resolveVisualHitboxFamily(player.visual)]) !== index) throw new Error("Online car creation failed");
      this.carConfigs.push(readNativeCarConfig(this.module, index));
    });
    this.setUnlimitedBoost(false); this.resetKickoff(); this.resetView();
  }
  async prepareOnline(roster, descriptor, canCommit = () => true) {
    if (!descriptor?.nativeCheckpoint) { this.configureOnline(roster); return; }
    if (descriptor.nativeCheckpoint !== 1 || descriptor.nativePhysics !== NETWORK_CORE_SHA256) throw Error('Online physics version differs. Reload after both deployments are updated.');
    if (this.physicsSelection.engine !== 'experimental') throw Error('Online requires the source physics engine.');
    const candidate = new PhysicsSimulation(this.physicsSelection);
    try {
      await candidate.init({
        expectedHash: NETWORK_CORE_SHA256,
        fetchBytes: async () => {
          const response = await fetch('/physics/rocketsim-network.wasm', { cache: 'no-cache' });
          if (!response.ok) throw Error(`Online physics unavailable (HTTP ${response.status})`);
          return new Uint8Array(await response.arrayBuffer());
        },
        loadFactory: async () => (await import('/physics/rocketsim-network.js')).default,
      });
      candidate.configureOnline(roster); candidate.setGoalExplosionEnabled(false);
      if (candidate.module._physics_netStateVersion?.() !== 1 || !candidate.state.every(Number.isFinite)) throw Error('Invalid online physics checkpoint ABI');
      if (!canCommit()) throw Error('Online load cancelled');
      this.releaseOnline();
      const backup = Object.fromEntries(Object.getOwnPropertyNames(candidate).map(key => [key, this[key]]));
      // Existing clock/scene references retain this object and the unchanged camera ABI.
      for (const key of Object.getOwnPropertyNames(candidate)) this[key] = candidate[key];
      this.offlinePhysics = backup;
    } catch (error) { candidate.module?._physics_destroy?.(); throw error; }
  }
  releaseOnline() {
    if (!this.offlinePhysics) return;
    const backup = this.offlinePhysics; this.offlinePhysics = null;
    this.module._physics_destroy?.();
    if (this.viewPtr) this.module._free(this.viewPtr);
    for (const [key, value] of Object.entries(backup)) this[key] = value;
  }
  async switchPhysics(selection, kind, match, team, unlimited, canCommit = () => true) {
    const candidate = new PhysicsSimulation(selection);
    await candidate.init();
    candidate.configureCars(kind, match, team);
    candidate.setUnlimitedBoost(unlimited);
    if (!candidate.state.every(Number.isFinite)) throw new Error("Invalid replacement physics state");
    if (!canCommit()) throw new Error("Session changed while loading; please apply again.");
    // Commit only after successful preparation; preserve clock/camera bridge identity.
    for (const key of Object.getOwnPropertyNames(candidate)) this[key] = candidate[key];
  }
  setControls(e, t) {
    const n = this.module.HEAPF32.buffer;
    (!this.controlsView || this.controlsView.buffer !== n) &&
      (this.controlsView = new Float32Array(n, this.controlsPtr, u0 * kf));
    const r = this.controlsView,
      s = e * kf;
    ((r[s] = t.throttle),
      (r[s + 1] = t.steer),
      (r[s + 2] = t.pitch),
      (r[s + 3] = t.yaw),
      (r[s + 4] = t.roll),
      (r[s + 5] = t.jump ? 1 : 0),
      (r[s + 6] = t.boost ? 1 : 0),
      (r[s + 7] = t.handbrake ? 1 : 0));
  }
  stepView(e) {
    const t = this.module.HEAPF64.buffer;
    return (
      (!this.viewView || this.viewView.buffer !== t) &&
        (this.viewView = new Float64Array(t, this.viewPtr, 42)),
      this.viewView.set(e, 0),
      this.module._v1(),
      this.viewView
    );
  }
  resetView() {
    (this.module._v2(), (this.viewView = null));
  }
  step(e) {
    this.module._physics_step(e);
    if (e > 0 && this.lastLaunch && !this.lastLaunch.nextStep) {
      this.lastLaunch.nextStep = Array.from(this.state.slice(STATE_LAYOUT.BALL + CAR_STATE.VEL, STATE_LAYOUT.BALL + CAR_STATE.VEL + 3));
    }
  }
  setGoalExplosionEnabled(enabled) {
    this.module._physics_setGoalExplosionEnabled?.(enabled ? 1 : 0);
  }
  applyGoalExplosion() {
    return this.module._physics_goalExplosion?.() ?? 0;
  }
  resetKickoff(e = -1) {
    this.module._physics_resetKickoff(e);
    this.lastLaunch = null;
    this.ballActionHistory = [];
  }
  controlBall(e, t) {
    const before = Array.from(this.state.slice(STATE_LAYOUT.BALL + CAR_STATE.VEL, STATE_LAYOUT.BALL + CAR_STATE.VEL + 3));
    const ok = this.module._physics_controlBall(e, BALL_ACTIONS.indexOf(t)) === 1;
    if (ok) {
      this.ballActionHistory.push(`${this.state[STATE_LAYOUT.TICK]}:${t}`);
      this.ballActionHistory = this.ballActionHistory.slice(-6);
      if (t === "launchBall") this.lastLaunch = {
        before,
        after: Array.from(this.state.slice(STATE_LAYOUT.BALL + CAR_STATE.VEL, STATE_LAYOUT.BALL + CAR_STATE.VEL + 3)),
        nextStep: null,
      };
    }
    return ok;
  }
  setUnlimitedBoost(e) {
    this.module._physics_setUnlimitedBoost(e ? 1 : 0);
  }
  pollGoal() {
    const e = this.state[STATE_LAYOUT.GOAL];
    return (e !== 0 && this.module._physics_clearGoalFlag(), e);
  }
  get ballRadius() {
    return this.module._physics_getBallRadius();
  }
  get ballOnGround() {
    return this.module._physics_getBallOnGround() === 1;
  }
  getPads() {
    const e = this.state[STATE_LAYOUT.NUM_PADS],
      t = this.module._physics_getPadInfoPtr(),
      n = new Float32Array(this.module.HEAPF32.buffer, t, e * 4);
    return Array.from({ length: e }, (r, s) => ({
      pos: [n[s * 4], n[s * 4 + 1], n[s * 4 + 2]],
      isBig: n[s * 4 + 3] === 1,
    }));
  }
}

export { PhysicsSimulation };
