import { STATE_LAYOUT as L, CAR_STATE as C, CAR_STATE_STRIDE as STRIDE } from '../physics/state-layout.js';
import { controlsObject, NEUTRAL, reorderState, SIM_HZ, INPUT_HZ, CONTROL_KEYS } from './protocol.js';
import { CHECKPOINT_HEADER, CHECKPOINT_CAR, hiddenStateAgrees } from './checkpoint.js';
import { TimingWindow } from './timing.js';
import { SnapshotBuffer } from './snapshot-buffer.js';
import { copyConfirmedEvents } from './presentation-events.js';
import { applyConfirmedLifecycle } from './presentation-lifecycle.js';
import { clamp, distance, interpolateBody, VisualCorrection } from './pose.js';
const DT = 1000 / SIM_HZ, COMMAND_TICKS = SIM_HZ / INPUT_HZ, MAX_PENDING = 60, MAX_REPLAY_TICKS = 120;
// This ABI still lacks a full rollback serializer. Compare ACK-aligned history
// first: do not reset jump/suspension internals on already matching snapshots.
// On divergence, reconcile physics immediately and smooth only the presentation.
export class Prediction {
    constructor(simulation, order) {
        this.sim = simulation;
        this.order = order;
        this.nativeCheckpoints = simulation.module._physics_netStateVersion?.() === 1;
        this.checkpointLength = this.nativeCheckpoints ? simulation.module._physics_getNetStateSize() : 0;
        this.pointer = simulation.module._malloc((this.nativeCheckpoints ? 510 + this.checkpointLength + order.length : 24) * 4);
        this.checkpointRestores = 0;
        this.pending = [];
        // Reuse bounded state storage instead of allocating a 510-float snapshot
        // on every predicted AND replayed tick. One spare slot avoids aliasing.
        this.packetPool = Array.from({ length: MAX_PENDING + 1 }, () => ({ seq: 0,
            controls: [...NEUTRAL], object: controlsObject(NEUTRAL), ticks: 0, at: 0,
            states: [simulation.state.slice(), simulation.state.slice()],
            hidden: this.nativeCheckpoints ? [new Float32Array(CHECKPOINT_CAR), new Float32Array(CHECKPOINT_CAR)] : null }));
        this.packetCursor = 0; this.frameTiming = new TimingWindow(); this.updateTiming = new TimingWindow();
        this.beforeScratch = simulation.state.slice();
        this.ballScratch = simulation.state.slice();
        this.frozenScratch = new Float32Array(STRIDE);
        this.latest = null;
        this.queuedSnapshot = null;
        this.epoch = -1;
        this.accumulator = 0;
        this.last = null; this.lastPresentation = null;
        this.seq = 0;
        this.timeline = new SnapshotBuffer();
        this.samples = this.timeline.samples;
        this.corrections = 0;
        this.error = 0;
        this.replayTicks = 0;
        this.maxReplayTicks = 0;
        this.skippedRestores = 0;
        this.droppedTicks = 0;
        this.simulatedTicks = 0;
        this.rate = 1;
        this.averageQueue = 3;
        this.prev = simulation.state.slice();
        this.curr = this.prev.slice();
        this.rendered = this.prev.slice();
        this.localVisual = new VisualCorrection(L.CARS);
        this.ballVisual = new VisualCorrection(L.BALL);
        this.ballWeight = 0;
        this.lastReceive = 0;
        this.wasPlaying = false;
        this.resynchronizations = 0;
        this.needsResync = false;
        this.authoritativeDemoed = null; this.lifecycleChanges = 0;
    }
    recordHidden(packet, tick) {
        if (!this.nativeCheckpoints) return;
        const pointer = this.sim.module._physics_captureNetState();
        if (!pointer) throw Error('Online checkpoint capture failed');
        packet.hidden[tick].set(new Float32Array(this.sim.module.HEAPF32.buffer, pointer + CHECKPOINT_HEADER * 4, CHECKPOINT_CAR));
    }
    restore(state, inputs, snapshot) {
        const m = this.sim.module, scratch = this.pointer / 4;
        if (this.nativeCheckpoints && snapshot?.checkpoint) {
            if (snapshot.checkpoint.length !== this.checkpointLength) throw Error('Checkpoint roster mismatch');
            m.HEAPF32.set(snapshot.state, scratch);
            m.HEAPF32.set(snapshot.checkpoint, scratch + 510);
            m.HEAP32.set(this.order, scratch + 510 + this.checkpointLength);
            if (m._physics_restoreNetState(this.pointer, this.pointer + 510 * 4, this.checkpointLength, this.pointer + (510 + this.checkpointLength) * 4) !== 1) throw Error('Online checkpoint restoration failed');
            for (let slot=0;slot<this.order.length;slot++) this.sim.setControls(slot, controlsObject(inputs?.[this.order[slot]]?.controls ?? NEUTRAL));
            this.checkpointRestores++; return;
        }
        m.HEAPF32.set(state.subarray(L.BALL, L.BALL + 18), scratch);
        m._physics_setBallState(this.pointer);
        for (let slot = 0; slot < this.order.length; slot++) {
            const at = L.CARS + slot * STRIDE;
            m.HEAPF32.fill(0, scratch, scratch + 24);
            m.HEAPF32.set(state.subarray(at, at + 19), scratch);
            m.HEAPF32[scratch + 19] = state[at + C.ON_GROUND];
            m.HEAPF32[scratch + 20] = +(state[at + C.ON_GROUND] !== 1);
            m.HEAPF32[scratch + 21] = +(state[at + C.HAS_FLIP_OR_JUMP] !== 1);
            m.HEAPF32[scratch + 22] = state[at + C.IS_FLIPPING];
            if (m._physics_setCarState(slot, this.pointer) !== 1)
                throw Error('Prediction state restoration failed');
            this.sim.setControls(slot, controlsObject(inputs?.[this.order[slot]]?.controls ?? NEUTRAL));
        }
        this.sim.step(0);
    }
    receive(snapshot, self, now = performance.now()) {
        const previous = this.latest;
        if (previous && (snapshot.epoch < previous.epoch || snapshot.epoch === previous.epoch && snapshot.tick < previous.tick))
            return;
        if (previous && snapshot.epoch === previous.epoch && snapshot.tick === previous.tick && snapshot.match.phase === previous.match.phase)
            return;
        if (previous && now - this.lastReceive > 300) {
            this.needsResync = true;
            this.timeline.clear();
        }
        this.latest = snapshot;
        this.lastReceive = now;
        const state = reorderState(snapshot.state, this.order);
        this.timeline.add(snapshot, state, now);
        this.queuedSnapshot = { snapshot, state, self };
        // Never alter the render/simulation clock here. Doing so loses frame time
        // each time a network packet arrives, especially at 30 or 144 FPS.
    }
    agrees(history, state) {
        if (!history)
            return false;
        for (let slot = 0; slot < this.order.length; slot++) {
            const at = L.CARS + slot * STRIDE;
            if (distance(history, state, at) > 2 || distance(history, state, at + 12) > 10 || distance(history, state, at + 3) > .015 || distance(history, state, at + 9) > .015)
                return false;
            for (const flag of [C.ON_GROUND, C.DEMOED, C.HAS_FLIP_OR_JUMP, C.IS_FLIPPING])
                if (history[at + flag] !== state[at + flag])
                    return false;
        }
        return distance(history, state, L.BALL) < 4 && distance(history, state, L.BALL + 12) < 15;
    }
    reconcile() {
        if (!this.queuedSnapshot)
            return;
        const { snapshot, state, self } = this.queuedSnapshot;
        this.queuedSnapshot = null;
        const reset = snapshot.epoch !== this.epoch, playing = snapshot.match.phase === 'playing';
        const demoed = state[L.CARS + C.DEMOED] === 1;
        const lifecycleChanged = this.authoritativeDemoed !== null && this.authoritativeDemoed !== demoed;
        if (lifecycleChanged) this.lifecycleChanges++;
        this.authoritativeDemoed = demoed;
        const resync = this.needsResync;
        this.needsResync = false;
        if (resync)
            this.resynchronizations++;
        const meta = snapshot.inputStates?.[self] ?? { seq: snapshot.acknowledgements[self], ticks: COMMAND_TICKS, queued: 0, idle: 0 };
        const acknowledged = this.pending.find(p => p.seq === meta.seq);
        const historical = acknowledged && meta.ticks > 0 && meta.ticks <= acknowledged.ticks
            ? acknowledged.states[meta.ticks - 1] : null;
        const hidden = historical ? acknowledged?.hidden?.[meta.ticks - 1] : null;
        const hiddenAgrees = !snapshot.checkpoint || this.nativeCheckpoints && hiddenStateAgrees(hidden, snapshot.checkpoint, self)
          && historical && Math.abs(historical[L.CARS+C.BOOST]-state[L.CARS+C.BOOST]) < .1 && historical[L.CARS+C.IS_BOOSTING] === state[L.CARS+C.IS_BOOSTING];
        const agrees = !reset && !resync && !lifecycleChanged && playing && !meta.idle && this.agrees(historical, state) && hiddenAgrees;
        this.seq = Math.max(this.seq, meta.seq);
        this.epoch = snapshot.epoch;
        if (reset || !playing) {
            this.pending.length = 0;
            this.accumulator = 0;
            this.rate = 1;
            this.averageQueue = 3;
        }
        else
            this.pending = this.pending.filter(p => (!resync || this.lastReceive - p.at < 250) && (p.seq > meta.seq || p.seq === meta.seq && p.ticks > meta.ticks)).slice(-MAX_PENDING);
        this.replayTicks = 0;
        if (agrees) {
            this.skippedRestores++;
            this.error = 0;
        }
        else {
            const before = this.beforeScratch; before.set(this.sim.state);
            if (resync) {
                before.set(this.rendered.subarray(L.CARS, L.CARS + 18), L.CARS);
                before.set(this.rendered.subarray(L.BALL, L.BALL + 18), L.BALL);
                this.localVisual.reset();
                this.ballVisual.reset();
            }
            this.restore(state, snapshot.inputStates, snapshot);
            this.prev.set(this.sim.state);
            if (playing)
                for (const packet of this.pending) {
                    const skip = packet.seq === meta.seq ? meta.ticks : 0;
                    this.sim.setControls(0, packet.object);
                    for (let t = skip; t < packet.ticks && this.replayTicks < MAX_REPLAY_TICKS; t++) {
                        this.prev.set(this.sim.state);
                        this.sim.step(1);
                        packet.states[t].set(this.sim.state); this.recordHidden(packet, t);
                        this.replayTicks++;
                    }
                }
            this.curr.set(this.sim.state);
            this.error = distance(before, this.curr, L.CARS);
            if (!reset && this.error > .5)
                this.corrections++;
            const teleport = reset || !playing || lifecycleChanged || before[L.CARS + C.DEMOED] !== this.curr[L.CARS + C.DEMOED];
            this.localVisual.rebase(before, this.curr, teleport);
            this.ballVisual.rebase(before, this.curr, reset || !playing);
        }
        this.maxReplayTicks = Math.max(this.maxReplayTicks, this.replayTicks);
        if (playing && meta.seq) {
            this.averageQueue += (meta.queued - this.averageQueue) * .125;
            const target = 1 + clamp((3 - this.averageQueue) / 150, -.02, .02);
            this.rate += (target - this.rate) * .15;
        }
    }
    update(now, controls, send, clock, connected, { render = true } = {}) {
        if (!this.latest || !Number.isFinite(now))
            return;
        const elapsed = this.last === null ? 0 : Math.max(0, now - this.last);
        this.last = now;
        const updateStarted = performance.now();
        this.reconcile();
        const playing = connected && now - this.lastReceive < 300 && this.latest.match.phase === 'playing';
        if (playing) {
            this.accumulator += Math.min(elapsed, 100) * this.rate;
            const due = Math.floor(this.accumulator / DT + 1e-9), count = Math.min(12, due);
            this.accumulator = Math.max(0, this.accumulator - due * DT);
            this.droppedTicks += Math.max(0, due - count) + Math.floor(Math.max(0, elapsed - 100) / DT);
            for (let tick = 0; tick < count; tick++) {
                let packet = this.pending.at(-1);
                if (!packet || packet.ticks === COMMAND_TICKS) {
                    packet = this.packetPool[this.packetCursor++ % this.packetPool.length];
                    packet.seq = ++this.seq; packet.ticks = 0; packet.at = now;
                    for (let i = 0; i < 8; i++) packet.controls[i] = controls[i];
                    // Keep the same object consumed by PhysicsSimulation.setControls.
                    for (let i = 0; i < 8; i++) packet.object[CONTROL_KEYS[i]] = i < 5 ? controls[i] : !!controls[i];
                    this.pending.push(packet);
                    if (this.pending.length > MAX_PENDING)
                        this.pending.shift();
                    send(packet.seq, packet.controls, { epoch: this.epoch });
                }
                this.sim.setControls(0, packet.object);
                this.prev.set(this.sim.state);
                this.sim.step(1);
                packet.states[packet.ticks].set(this.sim.state); this.recordHidden(packet, packet.ticks++);
                this.curr.set(this.sim.state);
                this.simulatedTicks++;
            }
        }
        else {
            this.accumulator = 0;
            this.sim.setControls(0, controlsObject(NEUTRAL));
        }
        if (!render) {
            this.updateTiming.add(performance.now() - updateStarted);
            return;
        }
        const renderElapsed = this.lastPresentation === null ? 0 : Math.max(0, now - this.lastPresentation);
        this.lastPresentation = now;
        if (renderElapsed) this.frameTiming.add(renderElapsed);
        const frozenLocal = !playing && this.latest.match.phase === 'playing';
        if (frozenLocal) this.frozenScratch.set(this.rendered.subarray(L.CARS, L.CARS + STRIDE));
        if (!this.timeline.render(now, this.rendered))
            return;
        if (playing) {
            const alpha = clamp(this.accumulator / DT, 0, 1);
            // Predicted movement/boost/jump/wheels share a timeline; event counters are confirmed below.
            this.rendered.set(this.curr.subarray(L.CARS, L.CARS + STRIDE), L.CARS);
            interpolateBody(this.rendered, this.prev, this.curr, L.CARS, alpha, DT / 1000, false);
            this.localVisual.apply(this.rendered, renderElapsed / 1000);
            // Predict nearby ball contact with the same simulation as the local car.
            // Far-away ball remains on the stable snapshot timeline; crossfade avoids a jump.
            const separation = Math.hypot(...[0, 1, 2].map(i => this.curr[L.CARS + i] - this.curr[L.BALL + i]));
            const target = this.authoritativeDemoed ? 0 : clamp((900 - separation) / 400, 0, 1);
            this.ballWeight += (target - this.ballWeight) * (1 - Math.exp(-Math.min(renderElapsed, 100) / 65));
            const ball = this.ballScratch; ball.set(this.curr);
            interpolateBody(ball, this.prev, this.curr, L.BALL, alpha, DT / 1000, false);
            this.ballVisual.apply(ball, renderElapsed / 1000);
            interpolateBody(this.rendered, this.rendered, ball, L.BALL, this.ballWeight, 0, false);
        }
        else if (frozenLocal) {
            // Hold the last rendered local pose during a genuine update gap. Do not
            // jump backwards onto the delayed remote timeline when prediction pauses.
            this.rendered.set(this.frozenScratch, L.CARS);
        }
        else {
            this.localVisual.reset();
            this.ballVisual.reset();
            this.ballWeight = 0;
        }
        applyConfirmedLifecycle(this.rendered, this.latest.state, this.order[0]);
        copyConfirmedEvents(this.rendered, this.latest.state, this.order[0]);
        this.wasPlaying = playing;
        clock.prevState.set(this.rendered);
        clock.currState.set(this.rendered);
        clock.alpha = 1;
        clock.lastTicks = 0;
        clock.lastDropped = 0;
        clock.tick = this.latest.tick;
        this.updateTiming.add(performance.now() - updateStarted);
    }
    resetConnection(ack) {
        this.seq = Math.max(this.seq, ack);
        this.pending.length = 0;
        this.needsResync = true;
        this.accumulator = 0;
        this.rate = 1;
        this.averageQueue = 3;
        this.timeline.clear();
    }
    metrics() { return { protocol: 2, nativeCheckpoint: +this.nativeCheckpoints, authoritativeLifecycleChanges: this.lifecycleChanges, checkpointRestores: this.checkpointRestores, hiddenHistoryBytes: this.nativeCheckpoints ? this.packetPool.length * 2 * CHECKPOINT_CAR * 4 : 0, frameTiming: this.frameTiming.summary(), predictionWork: this.updateTiming.summary(), historyBytes: this.packetPool.length * 2 * this.curr.byteLength, playbackRebases: this.timeline.rebases, playbackAgeMs: this.timeline.ageMs, resynchronizations: this.resynchronizations, predictionPaused: !this.wasPlaying, simulatedTicks: this.simulatedTicks, droppedTicks: this.droppedTicks, corrections: this.corrections, skippedRestores: this.skippedRestores, correctionUnits: this.error, visualOffsetUnits: Math.hypot(...this.localVisual.position), hardSnaps: this.localVisual.hardSnaps, jitterMs: this.timeline.jitterMs, interpolationMs: this.timeline.delayMs, interpolationUnderruns: this.timeline.underflows, inputQueueTicks: this.averageQueue, inputTimeScale: this.rate, maxReplayTicks: this.maxReplayTicks }; }
    dispose() { this.sim.module._free(this.pointer); this.pending.length = 0; this.timeline.clear(); this.latest = this.queuedSnapshot = null; this.packetPool.length = 0; }
}
