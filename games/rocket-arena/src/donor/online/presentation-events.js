import { STATE_LAYOUT as L, CAR_STATE as C, CAR_STATE_STRIDE as STRIDE } from '../physics/state-layout.js';
// Native pose restoration resets some event serials and replay can create others.
// Movement/boost/jump eligibility are predicted; one-shot audiovisual events use
// confirmed counters, never speculative replay counters. No native state mutation.
export const EVENT_FIELDS = Object.freeze([
  C.FLIP_RESET_SERIAL, C.JUMP_SERIAL, C.DODGE_SERIAL, C.DOUBLE_JUMP_SERIAL,
  C.WHEEL_IMPACT_SERIAL, C.WHEEL_IMPACT_SPEED, C.BALL_HIT_SERIAL, C.BALL_HIT_SPEED,
  C.BALL_WORLD_IMPACT_SERIAL, C.BALL_WORLD_IMPACT_SPEED, C.BALL_WORLD_SURFACE,
]);
export function copyConfirmedEvents(rendered, authoritative, serverSlot) {
  const from = L.CARS + serverSlot * STRIDE;
  for (const field of EVENT_FIELDS) rendered[L.CARS + field] = authoritative[from + field];
}
