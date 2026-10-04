import { createSettingsStore, isRecord, readChoice, readNumber } from '../core/settings-store.js';

export const GARAGE_CARS = Object.freeze([
  { id: 'fennec', label: 'Fennec' },
  { id: 'octane-original', label: 'Octane Original' },
  { id: 'challenger', label: 'Dodge Challenger SRT8' },
  { id: 'spectre', label: 'Spectre' },
  { id: 'vesper', label: 'Vesper' },
  { id: 'amethyst', label: 'Amethyst' },
]);
export const CAR_FINISHES = Object.freeze({
  original: { label: 'Original pearl', roughness: .38, metalness: .73, clearcoat: 1 },
  glossy: { label: 'Glossy', roughness: .22, metalness: .3, clearcoat: 1 },
  metallic: { label: 'Metallic', roughness: .32, metalness: .92, clearcoat: .8 },
  matte: { label: 'Matte', roughness: .85, metalness: .08, clearcoat: 0 },
  custom: { label: 'Custom', roughness: .38, metalness: .73, clearcoat: 1 },
});
const readColor = (value, fallback) => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : fallback;
export const DEFAULT_CAR_MATERIAL = Object.freeze({ primary:'#007bff', pearl:'#007bff', finish:'glossy', roughness:.22, metalness:.35, clearcoat:1 });
export const TEAM_CAR_COLORS = Object.freeze({
  blue: Object.freeze({ primary: '#007bff', pearl: '#007bff', boostColor: '#007bff' }),
  orange: Object.freeze({ primary: '#ff8c00', pearl: '#ff8c00', boostColor: '#ff8c00' }),
});
const defaultPaint = team => ({ ...DEFAULT_CAR_MATERIAL, ...TEAM_CAR_COLORS[team] });
const defaults = () => Object.fromEntries(GARAGE_CARS.map(({ id }) => [id, { blue: defaultPaint('blue'), orange: defaultPaint('orange') }]));
export const carCustomizationStore = createSettingsStore('rocket-arena.garage-paint.v2', defaults, (result, raw) => {
  for (const { id } of GARAGE_CARS) for (const team of ['blue', 'orange']) {
    const source = raw[id]?.[team], target = result[id][team];
    if (!isRecord(source)) continue;
    for (const key of ['primary', 'pearl', 'boostColor']) target[key] = readColor(source[key], target[key]);
    target.finish = readChoice(source.finish, Object.keys(CAR_FINISHES), target.finish);
    for (const key of ['roughness', 'metalness', 'clearcoat']) target[key] = readNumber(source[key], target[key], { min: key === 'roughness' ? .08 : 0, max: 1 });
  }
});
const listeners = new Set();
const teamKey = team => team === 1 || team === 'orange' ? 'orange' : 'blue';
export const normalizeGarageCar = id => GARAGE_CARS.some(car => car.id === id) ? id : 'fennec';
export function getCarCustomization(carId, team = 'blue') {
  return { ...DEFAULT_CAR_MATERIAL, ...carCustomizationStore.load()[normalizeGarageCar(carId)][teamKey(team)] };
}
export function saveCarCustomization(carId, team, patch) {
  const id = normalizeGarageCar(carId), key = teamKey(team), saved = carCustomizationStore.load();
  Object.assign(saved[id][key], patch);
  carCustomizationStore.save(saved);
  const customization = getCarCustomization(id, key);
  // Save the validated form as well, so malformed values never persist.
  saved[id][key] = customization; carCustomizationStore.save(saved);
  for (const listener of listeners) listener({ carId: id, team: key, customization });
  return customization;
}
export function subscribeCarCustomization(listener) {
  listeners.add(listener); return () => listeners.delete(listener);
}
