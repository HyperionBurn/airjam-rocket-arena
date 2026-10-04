// Browser/server contract. Only inputs travel client -> server; never poses/results.
import { CHECKPOINT_TAG, checkpointSize, validCheckpoint } from './checkpoint.js';
import { STATE_LAYOUT, CAR_STATE_STRIDE, ro } from '../physics/state-layout.js';
export const PROTOCOL = 2;
export const INPUT_META_BYTES = 40;
export const SIM_HZ = 120;
export const SNAPSHOT_HZ = 20;
export const INPUT_HZ = 60;
export const PHYSICS_SHA256 = '4d3b9c9f2c2227bc72d292fb5f294ab1f435e34b8ac8300527ee9d833a829405';
export const MAGIC = 0x52415731;
export const MAX_CARS = 6;
export const STATE_SIZE = 510;
export const PHASES = ['waiting', 'kickoff', 'playing', 'goal', 'ended'];
export const CONTROL_KEYS = ['throttle', 'steer', 'pitch', 'yaw', 'roll', 'jump', 'boost', 'handbrake'];
export const NEUTRAL = Object.freeze([0, 0, 0, 0, 0, 0, 0, 0]);
export const CAR_VISUALS = Object.freeze(['fennec', 'octane-original', 'challenger', 'spectre', 'vesper', 'amethyst']);
export function controlsArray(controls) { return CONTROL_KEYS.map((key, i) => i < 5 ? (controls[key] || 0) : +!!controls[key]); }
export function controlsObject(values) { return Object.fromEntries(CONTROL_KEYS.map((key, i) => [key, i < 5 ? values[i] : !!values[i]])); }
export function validControls(values) {
    return Array.isArray(values) && values.length === 8 && values.every((v, i) => typeof v === 'number' && Number.isFinite(v) && (i < 5 ? v >= -1 && v <= 1 : v === 0 || v === 1));
}
export function validSequence(seq) { return Number.isSafeInteger(seq) && seq >= 0 && seq < 0xffffffff; }
export function validName(value) {
    if (typeof value !== 'string' || value !== value.normalize('NFKC') || value !== value.trim())
        return false;
    return /^[\p{L}\p{N}][\p{L}\p{N} _-]{1,23}$/u.test(value) && !/^(admin|system|moderator|support|rocket[ _-]?arena)(?:\b|[_\d-])/iu.test(value);
}
export function readMessage(raw) {
    if (typeof raw !== 'string' || raw.length > 8192)
        throw new Error('invalid_message');
    const message = JSON.parse(raw);
    if (!message || Array.isArray(message) || typeof message !== 'object' || typeof message.type !== 'string')
        throw new Error('invalid_message');
    return message;
}
// Protocol v2: 40-byte header, per-player consumed command/partial ticks + inputs, active
// native car states, then pads. Unused native slots are never transmitted.
export function encodeSnapshot({ tick, epoch = 0, time = 0, state, match, acknowledgements, inputStates, checkpoint }) {
    const cars = state[STATE_LAYOUT.NUM_CARS], pads = state[STATE_LAYOUT.NUM_PADS];
    if (!Number.isInteger(cars) || cars < 2 || cars > MAX_CARS || pads !== 34)
        throw new Error('invalid_native_layout');
    const prefix = STATE_LAYOUT.CARS + cars * CAR_STATE_STRIDE;
    const baseBytes = 40 + cars * INPUT_META_BYTES + (prefix + pads * 2) * 4;
    if (checkpoint && !validCheckpoint(checkpoint, cars, pads)) throw new Error('invalid_checkpoint');
    const buffer = new ArrayBuffer(baseBytes + (checkpoint ? 8 + checkpoint.byteLength : 0));
    const view = new DataView(buffer);
    view.setUint32(0, MAGIC, true);
    view.setUint16(4, PROTOCOL, true);
    view.setUint8(6, cars);
    view.setUint8(7, pads);
    view.setUint32(8, tick, true);
    view.setUint32(12, time >>> 0, true);
    view.setUint8(16, PHASES.indexOf(match.phase));
    view.setUint8(17, +match.overtime);
    view.setUint8(18, match.winner === null ? 0 : match.winner + 1);
    view.setUint8(19, match.scorer === null ? 0 : match.scorer + 1);
    view.setUint16(20, match.blueScore, true);
    view.setUint16(22, match.orangeScore, true);
    view.setFloat32(24, match.remainingSeconds, true);
    view.setFloat32(28, match.overtimeSeconds, true);
    view.setFloat32(32, match.countdown, true);
    view.setUint32(36, epoch, true);
    for (let index = 0; index < cars; index++) {
        const meta = inputStates?.[index] ?? { seq: acknowledgements[index], ticks: 2, queued: 0, idle: 0, controls: NEUTRAL };
        const at = 40 + index * INPUT_META_BYTES;
        view.setUint32(at, meta.seq, true);
        view.setUint8(at + 4, meta.ticks);
        view.setUint8(at + 5, Math.min(255, meta.queued));
        view.setUint16(at + 6, meta.idle ?? 0, true);
        for (let c = 0; c < 8; c++)
            view.setFloat32(at + 8 + c * 4, meta.controls[c], true);
    }
    let offset = 40 + cars * INPUT_META_BYTES;
    for (let index = 0; index < prefix; index++, offset += 4)
        view.setFloat32(offset, state[index], true);
    for (let index = 0; index < pads * 2; index++, offset += 4)
        view.setFloat32(offset, state[ro + index], true);
    if (checkpoint) {
        view.setUint32(baseBytes, CHECKPOINT_TAG, true);
        view.setUint32(baseBytes + 4, checkpoint.length, true);
        for (let i = 0; i < checkpoint.length; i++) view.setFloat32(baseBytes + 8 + 4*i, checkpoint[i], true);
    }
    return buffer;
}
export function decodeSnapshot(data) {
    const buffer = data instanceof ArrayBuffer ? data : data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    const view = new DataView(buffer);
    if (view.byteLength < 40 || view.getUint32(0, true) !== MAGIC || view.getUint16(4, true) !== PROTOCOL)
        throw new Error('update_required');
    const cars = view.getUint8(6), pads = view.getUint8(7), phase = PHASES[view.getUint8(16)];
    const prefix = STATE_LAYOUT.CARS + cars * CAR_STATE_STRIDE;
    const baseBytes = 40 + cars * INPUT_META_BYTES + (prefix + pads * 2) * 4;
    const extendedBytes = baseBytes + 8 + checkpointSize(cars, pads) * 4;
    if (cars < 2 || cars > MAX_CARS || pads !== 34 || !phase || (view.byteLength !== baseBytes && view.byteLength !== extendedBytes))
        throw new Error('invalid_snapshot');
    if ([24, 28, 32].some(at => !Number.isFinite(view.getFloat32(at, true)) || view.getFloat32(at, true) < 0)
        || view.getUint8(17) > 1 || view.getUint8(18) > 2 || view.getUint8(19) > 2)
        throw new Error('invalid_snapshot');
    const state = new Float32Array(STATE_SIZE), acknowledgements = [], inputStates = [];
    for (let i = 0; i < cars; i++) {
        const at = 40 + i * INPUT_META_BYTES, seq = view.getUint32(at, true), ticks = view.getUint8(at + 4);
        const controls = Array.from({ length: 8 }, (_, j) => view.getFloat32(at + 8 + j * 4, true));
        if (ticks > 2 || !validControls(controls))
            throw new Error('invalid_snapshot');
        acknowledgements.push(seq);
        inputStates.push({ seq, ticks, queued: view.getUint8(at + 5), idle: view.getUint16(at + 6, true), controls });
    }
    let offset = 40 + cars * INPUT_META_BYTES;
    for (let i = 0; i < prefix; i++, offset += 4)
        state[i] = view.getFloat32(offset, true);
    for (let i = 0; i < pads * 2; i++, offset += 4)
        state[ro + i] = view.getFloat32(offset, true);
    if (!state.every(Number.isFinite) || state[STATE_LAYOUT.NUM_CARS] !== cars)
        throw new Error('invalid_snapshot');
    let checkpoint;
    if (view.byteLength !== baseBytes) {
        if (view.getUint32(baseBytes, true) !== CHECKPOINT_TAG || view.getUint32(baseBytes+4, true) !== checkpointSize(cars,pads)) throw Error('invalid_checkpoint');
        checkpoint = new Float32Array(checkpointSize(cars,pads));
        for (let i = 0; i < checkpoint.length; i++) checkpoint[i] = view.getFloat32(baseBytes+8+4*i,true);
        if (!validCheckpoint(checkpoint,cars,pads)) throw Error('invalid_checkpoint');
    }
    return { checkpoint, tick: view.getUint32(8, true), time: view.getUint32(12, true), epoch: view.getUint32(36, true), acknowledgements, inputStates, state,
        match: { mode: 'match', phase, paused: false, blueScore: view.getUint16(20, true), orangeScore: view.getUint16(22, true),
            remainingSeconds: view.getFloat32(24, true), overtime: !!view.getUint8(17), overtimeSeconds: view.getFloat32(28, true),
            countdown: view.getFloat32(32, true), winner: view.getUint8(18) ? view.getUint8(18) - 1 : null,
            scorer: view.getUint8(19) ? view.getUint8(19) - 1 : null } };
}
export function reorderState(state, order) {
    const result = state.slice();
    order.forEach((serverSlot, localSlot) => result.set(state.subarray(STATE_LAYOUT.CARS + serverSlot * CAR_STATE_STRIDE, STATE_LAYOUT.CARS + (serverSlot + 1) * CAR_STATE_STRIDE), STATE_LAYOUT.CARS + localSlot * CAR_STATE_STRIDE));
    return result;
}
