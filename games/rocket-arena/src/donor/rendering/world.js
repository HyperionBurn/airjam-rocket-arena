import { PARK_ART, updateParkSceneryDetail } from "../arena/park.js";
import { createReferenceBoostPadBatch, updateReferenceBoostPad } from '../arena/reference-boost-pads.js';
import { applyCarCustomization } from '../vehicles/customization.js';
import { applyNativeHitbox, createNativeWheelDiagnostics, disposeNativeWheelDiagnostics, updateNativeWheelDiagnostics } from "../physics/geometry.js";
import { _ } from "../core/class-fields.js";
import { Ct, Ed, Ee, F, Gi, It, Ke, Ne, Nm, Tn, Wa, Xt, Ya, cn, dt, e0, el, eo, jn, lt, zi } from "../vendor/three.js";
import { CAR_STATE, CAR_STATE_STRIDE, EC, STATE_LAYOUT, getTeamAssignment, no, ro } from "../physics/state-layout.js";
import { subscribeTheme } from "./theme.js";
import { Ji, N0, Nr, vn } from "./theme-materials.js";
import { Wb, q0 } from "../vehicles/rocket-hatch.js";
import { Uh, isSketchfabCar, sketchfabModels } from "../vehicles/imported-models.js";
import { V0, W0, z0 } from "../vehicles/mesh-utils.js";
import { J0, Q0, Qb, X0, Y0, Z0, e1, t1 } from "../vehicles/flat-car.js";
import { r1 } from "../vehicles/arcade-car.js";
import { Rs, lp } from "../physics/coordinates.js";
import { rg } from "../vehicles/body.js";
import { h1, resolveWheelVisualHeight } from "../vehicles/wheels.js";
import { VA, Wd, sg, zA } from "../vehicles/suspension.js";
import { Ag, og } from "../vehicles/model-loader.js";
import { BoostEffect } from "../effects/boost.js";
import { DemolitionEffect } from "../effects/demolition.js";
import { BallSpeedTrail } from "../effects/ball-speed-trail.js";
import { BallLocator } from "../effects/ball-locator.js";
import { GS, JS, KS, OS, RS, WS, loadParkArt } from "../arena/geometry.js";
import { Dp, Fp, Hp, Lp, Np, Wh, XA, Xh, YS, bc, cA, ew, gg, jg, mg, pg, vg, xn } from "../vehicles/diagnostics.js";
import { localQualityProfiles } from "../settings/schema.js";

// AIR JAM PATCH: give every car its OWN paint materials.
//
// Cars built from one imported model are `Object3D.clone(true)`s of the same
// source, and a clone shares its materials. The car paint (`applyCarCustomization`)
// writes team colours into those materials' uniforms, so two cars of the same
// model on different teams ended up the same colour (whichever team was applied
// last). In a local match everybody can pick the same car, so this matters.
//
// `Material.clone()` would also clone every texture uniform (and re-upload it per
// car), so the textures are pointed back at the originals: only the small
// per-car paint uniforms are actually separate.
function cloneWithOwnPaint(source) {
  const copy = source.clone(true);
  const own = new Map();
  const ownMaterial = (material) => {
    if (!material?.userData?.fennecV2) return material;
    let result = own.get(material);
    if (!result) {
      result = material.clone();
      for (const [name, uniform] of Object.entries(material.uniforms ?? {})) {
        if (uniform?.value?.isTexture) result.uniforms[name].value = uniform.value;
      }
      result.precision = material.precision;
      result.toneMapped = material.toneMapped;
      result.side = material.side;
      result.name = material.name;
      result.map = material.map;
      result.defaultAttributeValues = { ...material.defaultAttributeValues };
      own.set(material, result);
    }
    return result;
  };
  copy.traverse((object) => {
    if (!object.material) return;
    object.material = Array.isArray(object.material) ? object.material.map(ownMaterial) : ownMaterial(object.material);
  });
  return copy;
}

class GameWorld {
  constructor(e, t = "game-car", n = localQualityProfiles.balanced, r = !0) {
    _(this, "scene", new el());
    _(this, "ball");
    _(this, "cars", []);
    _(this, "carVisuals", []);
    _(this, "pads", []);
    _(this, "carHitboxes", []);
    _(this, "carHitboxesVisible", !1);
    _(this, "padTemplates", null);
    _(this, "gameCarAsset", null);
    _(this, "flatCarAsset", null);
    _(this, "realisticCarAsset", null);
    _(this, "carGimbals", []);
    _(this, "carSuspension", []);
    _(this, "carWheels", []);
    _(this, "carWheelSpecs", []);
    _(this, "wheelSpin", []);
    _(this, "carBoosts", []);
    _(this, "carDemolitions", []);
    _(this, "carJets", []);
    _(this, "jumpPrev", []);
    _(this, "jumpTimer", []);
    _(this, "flipPrev", []);
    _(this, "dodgeBurst", []);
    _(this, "dodgeRoll", []);
    _(this, "dodgeYaw", []);
    _(this, "dodgePitch", []);
    _(this, "indicatorRing");
    _(this, "indicatorHeightRing");
    _(this, "ballRadius");
    _(this, "ballSpeedTrail", new BallSpeedTrail());
    _(this, "ballLocatorArrow", new BallLocator());
    _(this, "ballVelocity", new F());
    _(this, "_renderTreeVersion", 0);
    _(this, "pA", new F());
    _(this, "pB", new F());
    _(this, "qA", new jn());
    _(this, "qB", new jn());
    _(this, "carSun");
    _(this, "ballSun");
    _(this, "opponentSun", null);
    _(this, "opponentCarAssets", new Map());
    _(this, "opponentSunTarget", new It());
    _(this, "carSunTarget", new It());
    _(this, "ballSunTarget", new It());
    _(this, "shadowFocus", new F());
    _(this, "carVisual");
    _(this, "quality", n);
    _(this, "turf");
    _(this, "sky");
    _(this, "stadium", null);
    _(this, "stadiumVisible", r);
    ((this.carVisual = t),
      (this.scene.background = new Ne(PARK_ART.sky)),
      (this.scene.fog = new Ed(PARK_ART.horizonColor, 24000, 65000)),
      this.scene.add(new e0(13164543, 2569e3, 1.15)),
      (this.carSun = this.makeSubjectSun(this.carSunTarget, cA)),
      (this.ballSun = this.makeSubjectSun(this.ballSunTarget, Lp)),
      this.scene.add(
        this.carSunTarget,
        this.ballSunTarget,
        this.carSun,
        this.ballSun,
      ));
    const s = new eo(8956671, 0.35);
    (s.position.set(-2e3, 2e3, -2e3),
      this.scene.add(s),
      (this.turf = GS()),
      (this.sky = KS()),
      this.scene.add(this.turf),
      r && this.scene.add(this.sky),
      (this.ball = new dt()),
      this.scene.add(this.ball),
      this.scene.add(this.ballLocatorArrow.object),
      n.effects && this.scene.add(this.ballSpeedTrail.object),
      (this.ballRadius = e));
    const a = e * 1.15,
      o = new Ya(a * 0.92, a, 48),
      A = new cn({
        color: 16777215,
        transparent: !0,
        opacity: 0.55,
        depthWrite: !1,
      });
    ((this.indicatorRing = new Ee(o, A)),
      (this.indicatorHeightRing = new Ee(o, A)));
    for (const l of [this.indicatorRing, this.indicatorHeightRing])
      ((l.rotation.x = -Math.PI / 2), (l.renderOrder = 2), this.scene.add(l));
    this.markRenderTreeChanged();
    const l = new WeakRef(this);
    subscribeTheme(() => {
      var c;
      return (c = l.deref()) == null ? void 0 : c.markRenderTreeChanged();
    });
  }
  resetBallTrail() {
    this.ballSpeedTrail.reset();
  }
  get renderTreeVersion() {
    return this._renderTreeVersion;
  }
  get boostBloomActive() {
    for (const e of this.carBoosts)
      for (const t of e) if (t.bloomActive) return !0;
    return !1;
  }
  markRenderTreeChanged() {
    this._renderTreeVersion += 1;
  }
  async loadBall() {
    const e = await sketchfabModels.loadBall(this.ballRadius);
    (Dp(e, this.ballSun.shadow.camera),
      this.ball.add(e),
      this.markRenderTreeChanged());
  }
  updateBallLocatorArrow(e, t = 0) {
    this.ballLocatorArrow.update(this.cars[t], this.ball, e);
  }
  async loadCarAndPadAssets() {
    if (isSketchfabCar(this.carVisual)) this.sketchfabCarAsset = await sketchfabModels.loadCar(this.carVisual);
    [this.gameCarAsset, this.flatCarAsset, this.realisticCarAsset] =
      await Promise.all([
        this.carVisual === "game-car" ? Uh() : null,
        this.carVisual === "flat-car" ? Y0() : null,
        this.carVisual === "realistic" ? og() : null,
      ]);
    // Shared procedural pads need no additional model or texture download.
  }
  async prepareLiveCar(visual, team) {
    this.liveCarCache ??= new Map();
    if (this.liveCarCache.has(visual)) return this.liveCarCache.get(visual);
    // A lightweight, isolated car builder; do not construct another arena/renderer.
    const draft = Object.assign(Object.create(GameWorld.prototype), this);
    for (const key of Object.keys(draft)) if (Array.isArray(draft[key])) draft[key] = [];
    draft.scene = new el(); draft.carVisual = visual;
    await draft.loadCarAndPadAssets();
    draft.addCar(team);
    await Promise.all(draft.carBoosts[0].map(boost => boost.preload()));
    this.liveCarCache.set(visual, draft);
    return draft;
  }
  commitLiveCar(draft) {
    const keys = ["cars", "carVisuals", "carHitboxes", "carGimbals", "carSuspension", "carWheels", "carWheelSpecs", "wheelSpin", "carBoosts", "carDemolitions", "carJets", "jumpPrev", "jumpTimer", "flipPrev", "dodgeBurst", "dodgeRoll", "dodgeYaw", "dodgePitch"];
    // Keep one reusable package per visual, avoiding repeated GPU allocations.
    const parked = { carVisual: this.carVisual, scene: new el() };
    for (const key of keys) parked[key] = [this[key][0]];
    for (const boost of this.carBoosts[0]) {
      boost.audio?.setBoosting(false); boost.resetVisual(); boost.realistic.reset();
      parked.scene.add(boost.trail.mesh, boost.realistic.trail.mesh);
    }
    parked.scene.add(this.cars[0], this.carDemolitions[0].object);
    this.liveCarCache.set(this.carVisual, parked);
    disposeNativeWheelDiagnostics(this.nativeWheelDiagnostics?.[0]);
    if (this.nativeWheelDiagnostics) this.nativeWheelDiagnostics[0] = null;
    for (const key of keys) this[key][0] = draft[key][0];
    this.carVisual = draft.carVisual;
    this.liveCarCache.delete(draft.carVisual);
    for (const child of [...draft.scene.children]) this.scene.add(child);
    this.setCarHitboxesVisible(this.carHitboxesVisible);
    this.markRenderTreeChanged();
  }
  async loadArena() {
    const [boundary, scenery, backdrop] = await Promise.all([
      WS(), this.stadiumVisible ? JS() : null, loadParkArt(this.turf),
    ]);
    this.sky.removeFromParent(); this.sky = backdrop;
    this.parkProps = backdrop.getObjectByName('Park / supplied 3D gardens and stone banks');
    this.parkTrees = backdrop.getObjectByName('Park / painted poplar belt');
    this.updateSceneryDetail({ position: this.scene.position });
    this.stadium = scenery;
    this.scene.add(boundary, backdrop);
    if (this.stadiumVisible && scenery) this.scene.add(scenery);
    this.markRenderTreeChanged();
  }
  async setStadiumVisible(e) {
    if (this.stadiumVisible !== e) {
      this.stadiumVisible = e;
      for (const t of [this.stadium])
        t && (e ? this.scene.add(t) : t.removeFromParent());
      ((this.scene.background = new Ne(PARK_ART.sky)),
        this.markRenderTreeChanged());
    }
    if (e && !this.stadium) {
      this.stadiumLoading ??= JS(!this.quality.shadows).finally(() => { this.stadiumLoading = null; });
      this.stadium = await this.stadiumLoading;
      if (this.stadiumVisible) this.scene.add(this.stadium);
      this.markRenderTreeChanged();
    }
  }
  removeOpponent() {
    if (this.cars.length < 2) return;
    for (const boost of this.carBoosts[1]) {
      boost.resetVisual(); boost.realistic.reset(); boost.disposeAudio();
      boost.trail.mesh.removeFromParent(); boost.realistic.trail.mesh.removeFromParent();
    }
    this.cars[1].removeFromParent();
    this.carDemolitions[1].object.removeFromParent();
    disposeNativeWheelDiagnostics(this.nativeWheelDiagnostics?.[1]);
    for (const key of ["cars", "carVisuals", "carHitboxes", "carGimbals", "carSuspension", "carWheels", "carWheelSpecs", "wheelSpin", "carBoosts", "carDemolitions", "carJets", "jumpPrev", "jumpTimer", "flipPrev", "dodgeBurst", "dodgeRoll", "dodgeYaw", "dodgePitch", "carPhysicsConfigs", "nativeWheelDiagnostics"])
      this[key]?.splice(1, 1);
    this.markRenderTreeChanged();
  }
  async ensureOpponent(visual = 'octane-original') {
    if (this.cars.length > 1 && this.carVisuals[1] !== visual) this.removeOpponent();
    this.cars.length > 1 ||
      (this.opponentCarAsset = this.opponentCarAssets.get(visual) ?? await sketchfabModels.loadCar(visual),
      this.opponentCarAssets.set(visual, this.opponentCarAsset),
      !(this.cars.length > 1) &&
        ((this.opponentSun = this.makeSubjectSun(this.opponentSunTarget, cA)),
        (this.opponentSun.visible = !1),
        this.scene.add(this.opponentSun, this.opponentSunTarget),
        this.addCar(getTeamAssignment(false).botTeam, visual)));
  }
  async prepareOnlineRoster(roster) {
    while (this.cars.length > 1) this.removeOpponent();
    this.cars[0].userData.garageTeam = roster[0].team;
    this.applyGarageCustomization(this.carVisual);
    for (const player of roster.slice(1)) {
      const asset = this.opponentCarAssets.get(player.visual) ?? await sketchfabModels.loadCar(player.visual);
      this.opponentCarAssets.set(player.visual, asset);
      this.addCar(player.team, player.visual, asset);
    }
    await Promise.all(this.carBoosts.flatMap(boosts => boosts.map(boost => boost.preload())));
    this.markRenderTreeChanged();
  }
  async prepareAssets() {
    (await this.ensureOpponent(),
      (this.cars[no].visible = !1),
      await Promise.all(
        this.carBoosts.flatMap((e) => e.map((t) => t.preload())),
      ));
  }
  addCar(e, t = this.carVisual, assetOverride = null) {
    const n = new dt(),
      r = this.cars.length === no,
      s = t === "realistic",
      a = t === "flat-car",
      custom = assetOverride ?? (isSketchfabCar(t) ? (r ? this.opponentCarAsset : this.sketchfabCarAsset) : null);
    let o = null,
      A;
    if (s) {
      const u = new dt();
      ((u.name = "realistic-car"), (o = sg(xn[e])), u.add(o.group));
      const p = rg();
      if (!this.realisticCarAsset)
        throw new Error("Realistic car asset was not loaded");
      (Ag(this.realisticCarAsset, o, p, xn[e]),
        (p.hitbox.visible = this.carHitboxesVisible),
        this.carHitboxes.push(p.hitbox),
        this.carGimbals.push(p),
        n.add(u, p.root),
        (A = [o.boostOutlet]));
    } else {
      if (custom) {
        n.add(cloneWithOwnPaint(custom.body));
      } else if (a) {
        if (!this.flatCarAsset)
          throw new Error("Flat Car asset was not loaded");
        n.add(Z0(this.flatCarAsset, xn[e]));
      } else {
        if (!this.gameCarAsset)
          throw new Error("Default Car asset was not loaded");
        n.add(z0(this.gameCarAsset, xn[e], r ? r1(this.carVisual) : void 0));
      }
      const u = RS(a ? Qb : void 0);
      ((u.visible = this.carHitboxesVisible),
        this.carHitboxes.push(u),
        this.carGimbals.push(null),
        n.add(u),
        (A = custom ? custom.outlets : a ? t1 : Wb));
    }
    const l = custom ? custom.wheelSpecs : s ? VA : a ? X0 : q0,
      c = [];
    for (let u = 0; u < l.length; u += 1) {
      const [p, v, g] = l[u],
        m = new dt();
      const restOffset = custom?.wheelOffsets[u] || 0;
      const restHeight = custom ? [12.5, 12.5, 15, 15][u] - zA : a ? J0[u] : g - zA;
      m.position.set(p, restHeight + restOffset, v);
      const y = new dt();
      let C;
      (custom
        ? (C = cloneWithOwnPaint(custom.wheels[u]))
        : s
        ? (m.add(vg(o.suspension[u].innerZ - v)),
          (C = gg(g, Wd, {
            tire: new lt({ color: 1447965, roughness: 0.96 }),
            lug: new lt({ color: 987412, roughness: 0.98 }),
            rim: new lt({ color: 1909033, roughness: 0.3, metalness: 0.9 }),
            accent: new lt({ color: xn[e], roughness: 0.3, metalness: 0.7 }),
          })),
          (C.rotation.x = Math.PI / 2))
        : a
          ? (C = Q0(this.flatCarAsset, u, xn[e]))
          : ((C = V0(this.gameCarAsset, u)), m.add(W0(this.gameCarAsset, u))),
        y.add(C),
        m.add(y),
        n.add(m),
        c.push({ steer: m, spin: y, restOffset, restHeight }));
    }
    (this.carWheels.push(c),
      this.carWheelSpecs.push(l),
      this.wheelSpin.push([0, 0, 0, 0]));
    const h = [];
    if (s && o) {
      const u = new lt({ color: xn[e], roughness: 0.28, metalness: 0.7 }),
        p = new lt({ color: 15133423, roughness: 0.1, metalness: 1 }),
        v = new lt({ color: 1711652, roughness: 0.3, metalness: 0.9 }),
        g = new lt({ color: 2830134, roughness: 0.45, metalness: 0.8 });
      for (let m = 0; m < l.length; m++) {
        const y = l[m][2],
          { top: C, innerZ: E, foreRoot: w, aftRoot: S } = o.suspension[m],
          k = y - zA,
          x = Math.hypot(k - C.y, E - C.z),
          T = mg(x, u, p, v);
        T.group.position.copy(C);
        const R = new Ee(new Xt(1.5, 1.5, 1, 10), g),
          D = new Ee(new Xt(1.5, 1.5, 1, 10), g);
        ((R.castShadow = !0),
          (D.castShadow = !0),
          o.group.add(T.group, R, D),
          h.push({
            ...T,
            top: C,
            botZ: E,
            armFore: R,
            armAft: D,
            foreRoot: w,
            aftRoot: S,
            innerZ: E,
          }));
      }
    }
    (this.carSuspension.push(h),
      N0(n),
      this.carJets.push(s && o ? jg(o) : null),
      this.jumpPrev.push(!1),
      this.jumpTimer.push(-1),
      this.flipPrev.push(!1),
      this.dodgeBurst.push(0),
      this.dodgeRoll.push(0),
      this.dodgeYaw.push(0),
      this.dodgePitch.push(0),
      this.carBoosts.push(
        A.map((u, p) => new BoostEffect(this.scene, n, u, p === 0, r)),
      ));
    if (custom) {
      n.userData.garageTeam = e;
      const customization = applyCarCustomization(n, t, e);
      for (const boost of this.carBoosts.at(-1)) boost.setColor(customization.boostColor);
    }
    const d = new DemolitionEffect();
    (this.carDemolitions.push(d),
      this.scene.add(d.object),
      Dp(
        n,
        (r && this.opponentSun ? this.opponentSun : this.carSun).shadow.camera,
      ),
      this.cars.push(n),
      this.carVisuals.push(t),
      this.scene.add(n),
      this.markRenderTreeChanged());
  }
  setCarHitboxesVisible(e) {
    this.carHitboxesVisible = e;
    for (const t of this.carHitboxes) t.visible = e;
    for (const t of this.nativeWheelDiagnostics ?? []) if (t) t.visible = e;
  }
  applyGarageCustomization(carId) {
    const update = world => {
      world.cars.forEach((car, index) => {
        if (world.carVisuals[index] !== carId) return;
        const settings = applyCarCustomization(car, carId, car.userData.garageTeam ?? 0);
        for (const boost of world.carBoosts[index]) boost.setColor(settings.boostColor);
      });
    };
    update(this);
    for (const cached of this.liveCarCache?.values() ?? []) update(cached);
    this.markRenderTreeChanged();
  }
  setNativeCarConfig(index, config) {
    if (!this.cars[index] || !this.carHitboxes[index]) throw new Error("Missing car for native geometry synchronization");
    this.carPhysicsConfigs ??= [];
    this.nativeWheelDiagnostics ??= [];
    this.carPhysicsConfigs[index] = config;
    const T = { Group: dt, BufferGeometry: Ct, Float32BufferAttribute: Ke,
      LineSegments: Wa, LineBasicMaterial: Gi, BoxGeometry: Tn, EdgesGeometry: Nm, SphereGeometry: zi };
    applyNativeHitbox(T, this.carHitboxes[index], config);
    disposeNativeWheelDiagnostics(this.nativeWheelDiagnostics[index]);
    const guides = createNativeWheelDiagnostics(T, config);
    guides.visible = this.carHitboxesVisible;
    this.nativeWheelDiagnostics[index] = guides;
    this.cars[index].add(guides);
    this.markRenderTreeChanged();
  }
  prepareBallSpeedTrail(e) {
    this.ballSpeedTrail.prepare(e);
  }
  addPads(e) {
    const reference = createReferenceBoostPadBatch(e);
    OS(this.turf, e);
    this.pads.push(...reference.pads);
    this.scene.add(reference.root);
    this.markRenderTreeChanged();
  }
  update(e, t, n, r = 0, s = 0, a, o, A = !0) {
    (this.applyPhys(this.ball, e, t, STATE_LAYOUT.BALL, n),
      Rs(this.ballVelocity, t[STATE_LAYOUT.BALL + 12], t[STATE_LAYOUT.BALL + 13], t[STATE_LAYOUT.BALL + 14]));
    this.quality.effects &&
      this.ballSpeedTrail.update(this.ball.position, this.ballVelocity, r);
    const l = this.ball.position;
    (this.indicatorRing.position.set(l.x, 2, l.z),
      this.indicatorHeightRing.position.set(l.x, 2, l.z));
    const c = Math.max(0, l.y - this.ballRadius),
      d = 0.86 - 0.68 * Math.min(1, c / 1600);
    this.indicatorHeightRing.scale.set(d, d, 1);
    for (let u = 0; u < this.cars.length; u++) {
      const p = STATE_LAYOUT.CARS + u * CAR_STATE_STRIDE;
      if (u >= t[STATE_LAYOUT.NUM_CARS]) {
        ((this.cars[u].visible = !1),
          this.carDemolitions[u].update(r, !1, this.cars[u].position, !1));
        continue;
      }
      // AIR JAM PATCH: per-car controls (set by a local match) so every car's jets,
      // flip flames and wheel spin follow its own input, not one shared "others".
      const perCar = this.controlsByCar?.[u],
        v = perCar ?? (u === 0 ? a : o),
        g = perCar ? perCar.throttle : u === 0 ? s : ((o == null ? void 0 : o.throttle) ?? 0),
        m = e[p + CAR_STATE.DEMOED] === 1 && t[p + CAR_STATE.DEMOED] !== 1;
      this.applyPhys(this.cars[u], m ? t : e, t, p, n);
      const y = t[p + CAR_STATE.DEMOED] !== 1;
      (this.carDemolitions[u].update(r, !y, this.cars[u].position, A),
        (this.cars[u].visible = y));
      const C = this.carGimbals[u];
      C && h1(this.cars[u].quaternion, t[p + CAR_STATE.VEL], t[p + CAR_STATE.VEL + 1], r, C);
      const E =
          t[p + CAR_STATE.VEL] * t[p + CAR_STATE.FWD] +
          t[p + CAR_STATE.VEL + 1] * t[p + CAR_STATE.FWD + 1] +
          t[p + CAR_STATE.VEL + 2] * t[p + CAR_STATE.FWD + 2],
        w = this.carWheels[u],
        S = this.carWheelSpecs[u],
        k = this.carSuspension[u],
        x = this.wheelSpin[u];
      const onGround = t[p + CAR_STATE.ON_GROUND] === 1;
      for (let R = 0; R < 4; R++) {
        const D = p + CAR_STATE.WHEELS + R * EC,
          N = t[D],
          X = t[D + 1],
          Y = t[D + 2] === 1,
          [H, V, J] = S[R],
          connectionHeight = this.carPhysicsConfigs?.[u]?.wheels[R].connectionXYZ[2] ?? (this.carVisuals[u] === "flat-car" ? e1 : YS),
          le = resolveWheelVisualHeight(onGround, Y, N, connectionHeight, w[R].restHeight);
        (w[R].steer.position.set(H, le + (w[R].restOffset || 0), V), (w[R].steer.rotation.y = -X));
        const je = k[R];
        if (je) {
          const pe = new F(0, 0, je.innerZ - V)
            .applyAxisAngle(pg, -X)
            .add(new F(H, le, V));
          (ew(je, pe),
            Np(je.armFore, je.foreRoot, pe),
            Np(je.armAft, je.aftRoot, pe));
        }
        const de = Y ? E / J : (g * 1410) / J;
        ((x[R] += de * r), (w[R].spin.rotation.z = -x[R]));
      }
      if (this.nativeWheelDiagnostics?.[u]) updateNativeWheelDiagnostics(this.nativeWheelDiagnostics[u], t, p, CAR_STATE.WHEELS, EC);
      const T = this.carJets[u];
      if (T) {
        const R = t[p + CAR_STATE.ON_GROUND] !== 1 ? 1 : 0,
          D = (v == null ? void 0 : v.roll) ?? 0,
          N = (v == null ? void 0 : v.yaw) ?? 0,
          X = (v == null ? void 0 : v.pitch) ?? 0,
          Y = R * Math.max(0, D),
          H = R * Math.max(0, -D),
          V = R * Math.max(0, N),
          J = R * Math.max(0, -N),
          ne = t[p + CAR_STATE.IS_FLIPPING] === 1;
        (ne &&
          !this.flipPrev[u] &&
          ((this.dodgeBurst[u] = Hp),
          (this.dodgeRoll[u] = D),
          (this.dodgeYaw[u] = N),
          (this.dodgePitch[u] = X)),
          (this.flipPrev[u] = ne));
        let le = 0;
        this.dodgeBurst[u] > 0 &&
          ((this.dodgeBurst[u] -= r),
          (le = 2 * Math.max(0, this.dodgeBurst[u] / Hp)));
        const je = le * Math.max(0, this.dodgeRoll[u]),
          de = le * Math.max(0, -this.dodgeRoll[u]),
          pe = le * Math.max(0, this.dodgeYaw[u]),
          Se = le * Math.max(0, -this.dodgeYaw[u]),
          gt = le * Math.max(0, this.dodgePitch[u]),
          ct = le * Math.max(0, -this.dodgePitch[u]),
          oe = Math.max(H, de) - Math.max(Y, je);
        (this.setJet(T.roll.fP, Math.max(0, oe)),
          this.setJet(T.roll.bP, Math.max(0, oe)),
          this.setJet(T.roll.fN, Math.max(0, -oe)),
          this.setJet(T.roll.bN, Math.max(0, -oe)));
        const xe = Math.max(J, Se) - Math.max(V, pe),
          ge = Math.max(V, pe) - Math.max(J, Se);
        (this.setJet(T.yaw.fP, Math.max(0, xe)),
          this.setJet(T.yaw.fN, Math.max(0, -xe)),
          this.setJet(T.yaw.bP, Math.max(0, ge)),
          this.setJet(T.yaw.bN, Math.max(0, -ge)));
        const qe =
          Math.max(R * Math.max(0, X), gt) - Math.max(R * Math.max(0, -X), ct);
        (this.setJet(T.pitchBack, Math.max(0, qe)),
          this.setJet(T.pitchFront, Math.max(0, -qe)));
        const Xe = (v == null ? void 0 : v.jump) ?? !1,
          We = R === 1 && (D !== 0 || N !== 0 || X !== 0);
        (Xe && !this.jumpPrev[u] && !We && (this.jumpTimer[u] = 0),
          (this.jumpPrev[u] = Xe),
          ne && (this.jumpTimer[u] = -1));
        let ft = 0;
        if (this.jumpTimer[u] >= 0) {
          this.jumpTimer[u] += r;
          const st = this.jumpTimer[u],
            ue = t[p + CAR_STATE.VEL + 2] > 0 || st < 0.05;
          st <= 0.2 && ue && (Xe || st < 0.07)
            ? (ft = 1)
            : (this.jumpTimer[u] = -1);
        }
        this.setJet(T.jump, ft, 2);
      }
    }
    (this.opponentSun &&
      ((this.opponentSun.visible = t[STATE_LAYOUT.NUM_CARS] > 1),
      (this.carSun.intensity = this.ballSun.intensity =
        this.opponentSun.visible ? 2 / 3 : 1),
      (this.opponentSun.intensity = 2 / 3)),
      this.quality.shadows && this.updateSubjectShadows());
    this.padVisualTime = (this.padVisualTime ?? 0) + Math.max(0, r);
    for (let u = 0; u < this.pads.length; u++) {
      const p = t[ro + u * 2] === 1;
      ((this.pads[u].full.visible = p), (this.pads[u].base.visible = !p));
      updateReferenceBoostPad(this.pads[u].full, this.padVisualTime);
    }
    this.updateBoostVisuals(t, s, r, (o == null ? void 0 : o.throttle) ?? 0, A);
  }
  setJet(e, t, n = 1) {
    const r = t > 0.04;
    if (Array.isArray(e)) {
      for (const s of e) this.setJetFlame(s, r, t, n);
      return;
    }
    this.setJetFlame(e, r, t, n);
  }
  setJetFlame(e, t, n, r) {
    if (((e.visible = t), !t)) return;
    const s = Math.min(2, n),
      a = 0.8 + Math.random() * 0.4,
      o = Math.max(0, s - 1),
      A = (1 + 0.4 * Math.min(s, 1) + 1.1 * o) * r;
    e.scale.set(A, (6 + 13 * s) * a * r, A);
  }
  makeSubjectSun(e, t) {
    const n = new eo(16777215, 1);
    return (
      n.position.copy(this.referenceSunOffset ?? Wh),
      (n.castShadow = !0),
      (n.target = e),
      n.shadow.mapSize.set(bc, bc),
      (n.shadow.camera.left = -t),
      (n.shadow.camera.right = t),
      (n.shadow.camera.top = t),
      (n.shadow.camera.bottom = -t),
      (n.shadow.camera.near = 100),
      (n.shadow.camera.far = 8500),
      (n.shadow.bias = -0.55 / (n.shadow.camera.far - n.shadow.camera.near)),
      (n.shadow.normalBias = 1.5),
      n.shadow.camera.updateProjectionMatrix(),
      n
    );
  }
  updateSceneryDetail(camera) {
    updateParkSceneryDetail(this.parkTrees, this.parkProps, camera.position);
  }

  releaseShadowMaps() {
    // Disabling Three's shadow renderer alone retains the High GPU targets.
    this.scene.traverse(object => {
      const shadow = object.shadow;
      if (!shadow) return;
      shadow.map?.dispose();
      shadow.mapPass?.dispose();
      shadow.map = null;
      shadow.mapPass = null;
    });
  }
  updateSubjectShadows() {
    var t, n;
    const e = this.cars[0];
    (e &&
      this.updateSubjectShadow(this.carSun, this.carSunTarget, e.position, cA),
      (t = this.opponentSun) != null &&
        t.visible &&
        (n = this.cars[1]) != null &&
        n.visible &&
        this.updateSubjectShadow(
          this.opponentSun,
          this.opponentSunTarget,
          this.cars[1].position,
          cA,
        ),
      this.updateSubjectShadow(
        this.ballSun,
        this.ballSunTarget,
        this.ball.position,
        Lp,
      ));
  }
  updateSubjectShadow(e, t, n, r) {
    const s = (r * 2) / bc,
      a = Math.round(n.dot(Xh) / s) * s,
      o = Math.round(n.dot(Fp) / s) * s,
      A = n.dot(XA);
    (this.shadowFocus
      .copy(Xh)
      .multiplyScalar(a)
      .addScaledVector(Fp, o)
      .addScaledVector(XA, A),
      t.position.copy(this.shadowFocus),
      e.position.copy(this.shadowFocus).add(this.referenceSunOffset ?? Wh),
      t.updateMatrixWorld());
  }
  updateBoostVisuals(e, t, n, r = 0, s = !0) {
    for (let a = 0; a < this.cars.length; a++) {
      const o = s && e[STATE_LAYOUT.CARS + a * CAR_STATE_STRIDE + CAR_STATE.IS_BOOSTING] === 1;
      for (const A of this.carBoosts[a])
        A.update(
          o,
          s && (this.controlsByCar?.[a] ? this.controlsByCar[a].throttle : a === 0 ? t : r) > 0.01,
          this.cars[a].visible,
          n,
          s,
          !0,
        );
    }
  }
  applyPhys(e, t, n, r, s) {
    (Rs(this.pA, t[r], t[r + 1], t[r + 2]),
      Rs(this.pB, n[r], n[r + 1], n[r + 2]),
      e.position.lerpVectors(this.pA, this.pB, s),
      lp(this.qA, t, r + 3),
      lp(this.qB, n, r + 3),
      e.quaternion.slerpQuaternions(this.qA, this.qB, s));
  }
}

export { GameWorld };
