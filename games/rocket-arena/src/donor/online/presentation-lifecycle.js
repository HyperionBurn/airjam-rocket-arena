import { STATE_LAYOUT as L, CAR_STATE as C, CAR_STATE_STRIDE as STRIDE } from '../physics/state-layout.js';

// Demolition/respawn is an authoritative lifecycle, not a smoothable movement.
// The native engine chooses respawn locations randomly. Predicting that choice
// can reveal a car on one side, then teleport it to the server's other side.
// While demolition is confirmed, keep both visible pose and camera target at
// the confirmed location. Ordinary driving prediction is left untouched.
export function applyConfirmedLifecycle(rendered, authoritative, serverSlot) {
  const from = L.CARS + serverSlot * STRIDE;
  const demoed = authoritative[from + C.DEMOED] === 1;
  if (demoed) rendered.set(authoritative.subarray(from, from + STRIDE), L.CARS);
  // A speculative collision must not independently hide/reveal a player's car.
  rendered[L.CARS + C.DEMOED] = +demoed;
  return demoed;
}
