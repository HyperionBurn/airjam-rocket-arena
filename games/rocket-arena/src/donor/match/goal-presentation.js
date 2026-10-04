import { sampleReplay } from "./goal-replay.js";

// Replay is presentation-only; celebration motion is delegated to live physics.
export class GoalPresentation {
  constructor({ world, camera, buffer, effects, root, playerIndex = 0,
    carStride = 51, carOffset = 22, boostOffset = 18,
    neutralControls = {}, celebration = null, onReplay = () => {}, onStart = () => {}, onFinish = () => {}, onBoost = () => {} }) {
    Object.assign(this, { world, camera, buffer, effects, root, playerIndex,
      carStride, carOffset, boostOffset, neutralControls, celebration, onReplay, onStart, onFinish, onBoost });
    this._active = false;
    this.document = root.ownerDocument;
    this.window = this.document.defaultView;
    this.element = this.document.createElement("section");
    this.element.className = "goal-presentation";
    this.element.hidden = true;
    this.element.setAttribute("aria-label", "Goal celebration and replay");
    this.element.innerHTML = `
      <div class="goal-presentation__announcement" role="status" aria-live="polite">
        <img class="goal-presentation__goal-graphic" src="/assets/ui/goal-scored.webp" alt="Goal scored!" />
      </div>
      <div class="goal-presentation__replay" hidden>
        <div class="goal-presentation__replay-top"><span class="goal-presentation__record-dot" aria-hidden="true"></span><strong>REPLAY</strong><span class="goal-presentation__view">MATCH RECORDING</span></div>
        <div class="goal-presentation__replay-bottom"><span class="goal-presentation__countdown"></span></div>
        <div class="goal-presentation__timeline"><div class="goal-presentation__progress"></div></div>
      </div>
      <button type="button" class="goal-presentation__skip" aria-label="Skip replay">
        <kbd class="goal-presentation__skip-key goal-presentation__skip-key--keyboard">ESC</kbd><span>SKIP</span><kbd class="goal-presentation__skip-key goal-presentation__skip-key--controller">X</kbd>
      </button>`;
    this.root.appendChild(this.element);
    this.announcement = this.element.querySelector(".goal-presentation__announcement");
    this.goalGraphic = this.element.querySelector(".goal-presentation__goal-graphic");
    this.replayUI = this.element.querySelector(".goal-presentation__replay");
    this.viewLabel = this.element.querySelector(".goal-presentation__view");
    this.countdown = this.element.querySelector(".goal-presentation__countdown");
    this.progress = this.element.querySelector(".goal-presentation__progress");
    this.skipButton = this.element.querySelector(".goal-presentation__skip");
    this.skip = () => this.finish();
    this.keydown = (event) => {
      if (event.code === "Space" && !this.replaying) return;
      if (!this.active || event.repeat || !["Escape", "Space"].includes(event.code)) return;
      if (event.target?.closest?.("input, textarea, select, [contenteditable='true']")) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      this.finish();
    };
    this.skipButton.addEventListener("click", this.skip);
  }

  syncSkipPrompt() {
    const pads = this.window.navigator?.getGamepads?.() ?? [];
    this.skipButton.classList.toggle("has-controller", [...pads].some(pad => pad?.connected));
  }

  get active() { return this._active; }

  begin({ time, state, scorerIndex = this.playerIndex, team = 0, scorerName = "PLAYER", mode }) {
    if (this.active) return false;
    this.clip = this.buffer.clip(time, scorerIndex);
    this.state = Float64Array.from(state);
    this.scorerIndex = scorerIndex;
    this.mode = mode;
    this.elapsed = 0;
    this.replaying = false;
    this.lastCountdown = "";
    this.origin = this.world.ball.position.clone();
    this.savedCamera = {
      position: this.camera.position.clone(),
      quaternion: this.camera.quaternion.clone(),
      fov: this.camera.fov,
    };
    this.savedCars = this.world.cars.map(car => ({
      position:car.position.clone(),quaternion:car.quaternion.clone(),visible:car.visible,
    }));
    this.hiddenObjects = [this.world.indicatorRing, this.world.indicatorHeightRing,
      this.world.ballLocatorArrow?.object, this.world.ballSpeedTrail?.object]
      .filter(Boolean).map((object) => ({ object, visible: object.visible }));
    this.ballVisible = this.world.ball.visible;
    this._active = true;
    this.element.hidden = false;
    this.element.style.setProperty("--goal-team", team === 0 ? "#55baff" : "#ffab47");
    this.announcement.hidden = false;
    this.replayUI.hidden = true;
    this.syncSkipPrompt();
    const playerScored = scorerIndex === this.playerIndex;
    this.goalGraphic.src = playerScored ? "/assets/ui/goal-you-scored.webp" : "/assets/ui/goal-scored.webp";
    this.goalGraphic.alt = playerScored ? "You scored!" : "Goal scored!";
    this.root.classList.add("goal-presentation-active");
    this.window.addEventListener("keydown", this.keydown, true);
    this.onStart();
    this.celebration?.begin();
    this.effects?.goal(this.origin, team === 0 ? 0x55baff : 0xffab47);
    this.update(0);
    return true;
  }

  update(delta) {
    if (!this.active) return false;
    if (Number.isFinite(delta) && delta > 0) this.elapsed += delta;
    const world = this.world;
    if (this.elapsed < 2) {
      this.celebration?.update(Number.isFinite(delta) ? Math.max(0,delta) : 0);
      world.ball.visible = false;
      for (const { object } of this.hiddenObjects) object.visible = false;
      return true;
    }
    if (!this.clip || this.clip.duration <= 0 || this.elapsed - 2 >= this.clip.duration) {
      this.finish();
      return false;
    }
    const replayTime = this.elapsed - 2;
    const sample = sampleReplay(this.clip, replayTime);
    if (!sample?.camera) { this.finish(); return false; }
    if (!this.replaying) {
      this.replaying = true;
      this.onReplay();
      this.effects?.clear();
      this.announcement.hidden = true;
      this.replayUI.hidden = false;
      this.root.classList.add("goal-presentation-replaying");
      for (const { object, visible } of this.hiddenObjects) object.visible = visible;
    }
    this.syncSkipPrompt();
    world.update(sample.previous.state, sample.next.state, sample.alpha, 0, 0,
      this.neutralControls, this.neutralControls, false);
    world.ball.visible = true;
    this.camera.position.fromArray(sample.camera.position);
    this.camera.quaternion.fromArray(sample.camera.quaternion);
    if (this.camera.fov !== sample.camera.fov) {
      this.camera.fov = sample.camera.fov;
      this.camera.updateProjectionMatrix();
    }
    const boost = sample.previous.state[this.carOffset + this.scorerIndex * this.carStride + this.boostOffset];
    this.onBoost(boost);
    this.progress.style.transform = `scaleX(${replayTime / this.clip.duration})`;
    const countdown = `${(this.clip.duration - replayTime).toFixed(1)}s`;
    if (countdown !== this.lastCountdown) {
      this.countdown.textContent = countdown;
      this.lastCountdown = countdown;
    }
    return true;
  }

  finish({ cancel = false } = {}) {
    if (!this.active) return;
    this._active = false;
    this.window.removeEventListener("keydown", this.keydown, true);
    this.effects?.clear();
    this.world.ball.visible = this.ballVisible;
    for (const { object, visible } of this.hiddenObjects) object.visible = visible;
    for (let i = 0; i < this.savedCars.length; i++) {
      const saved = this.savedCars[i], car = this.world.cars[i];
      car.position.copy(saved.position);
      car.quaternion.copy(saved.quaternion);
      car.visible = saved.visible;
    }
    this.camera.position.copy(this.savedCamera.position);
    this.camera.quaternion.copy(this.savedCamera.quaternion);
    this.camera.fov = this.savedCamera.fov;
    this.camera.updateProjectionMatrix();
    this.element.hidden = true;
    this.root.classList.remove("goal-presentation-active", "goal-presentation-replaying");
    this.clip = null;
    this.state = null;
    this.onFinish({ cancel, scorerIndex: this.scorerIndex });
  }

  dispose() {
    this.finish({ cancel: true });
    this.skipButton.removeEventListener("click", this.skip);
    this.element.remove();
  }
}
