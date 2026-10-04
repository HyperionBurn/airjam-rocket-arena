import { createSettingsStore, readBoolean, readChoice, readNumber } from '../core/settings-store.js';
import { REFERENCE_PALETTES } from './reference-palettes.js';

export const REFERENCE_LIGHT_DIRECTION = Object.freeze([-.48, .83, .29]);
export const REFERENCE_GRAPHICS_DEFAULTS = Object.freeze({
  renderer: 'makeup', palette: '8', sunset: 0, exposure: 1,
  roughness: .38, metalness: .73, pearlShift: .015, reflection: 2.5,
  lightPower: 3.5, ao: .53, bloom: .19, bloomThreshold: .6,
  makeupBloom: .27, makeupAO: .36, shadowBlur: 1.7, fog: .65,
  autoExposure: false, lightweightLook: false,
  sunAzimuth: Math.atan2(-.48, .29) * 180 / Math.PI,
  sunElevation: Math.atan2(.83, Math.hypot(.48, .29)) * 180 / Math.PI,
});

export const REFERENCE_GRAPHICS_RANGES = Object.freeze([
  { key: 'sunset', label: 'Daylight → golden hour', min: 0, max: 1, step: .01, group: 'lighting' },
  { key: 'exposure', label: 'Exposure', min: .7, max: 1.55, step: .01, group: 'lighting' },
  { key: 'lightPower', label: 'Sun strength', min: 0, max: 7, step: .05, group: 'lighting' },
  { key: 'sunAzimuth', label: 'Sun direction', min: -180, max: 180, step: 1, group: 'lighting' },
  { key: 'sunElevation', label: 'Sun height', min: 5, max: 85, step: 1, group: 'lighting' },
  { key: 'fog', label: 'Distance haze', min: 0, max: 2, step: .01, group: 'lighting' },
  { key: 'shadowBlur', label: 'Shadow softness · High', min: .1, max: 3, step: .1, group: 'lighting' },
  { key: 'roughness', label: 'Paint roughness', min: .09, max: .38, step: .005, group: 'paint' },
  { key: 'metalness', label: 'Paint metalness', min: 0, max: 1, step: .01, group: 'paint' },
  { key: 'pearlShift', label: 'Pearl balance', min: -.18, max: .18, step: .005, group: 'paint' },
  { key: 'reflection', label: 'Reflection strength', min: .45, max: 2.5, step: .025, group: 'paint' },
  { key: 'ao', label: 'Cavity & contact shading', min: 0, max: 1, step: .01, group: 'paint' },
  { key: 'makeupBloom', label: 'MakeUp bloom', min: 0, max: 2, step: .01, group: 'makeup' },
  { key: 'makeupAO', label: 'Screen-space shading · High', min: 0, max: .85, step: .01, group: 'makeup' },
  { key: 'bloom', label: 'Original highlight glow', min: 0, max: .8, step: .01, group: 'original' },
  { key: 'bloomThreshold', label: 'Original bloom threshold', min: .6, max: 2.2, step: .05, group: 'original' },
]);

export function sanitizeReferenceGraphics(value = {}) {
  const result = { ...REFERENCE_GRAPHICS_DEFAULTS };
  if (!value || typeof value !== 'object') return result;
  result.renderer = readChoice(value.renderer, ['makeup', 'original'], result.renderer);
  result.palette = readChoice(value.palette, REFERENCE_PALETTES.map((_, index) => String(index)), result.palette);
  result.autoExposure = readBoolean(value.autoExposure, result.autoExposure);
  result.lightweightLook = readBoolean(value.lightweightLook, result.lightweightLook);
  for (const range of REFERENCE_GRAPHICS_RANGES) result[range.key] = readNumber(value[range.key], result[range.key], range);
  return result;
}

export const referenceGraphicsSettings = createSettingsStore(
  'rocket-arena.reference-graphics.v1', () => ({ ...REFERENCE_GRAPHICS_DEFAULTS }),
  (target, value) => Object.assign(target, sanitizeReferenceGraphics(value)),
);

export function referencePaletteColors(settings) {
  const palette = REFERENCE_PALETTES[Number(settings.palette)] ?? REFERENCE_PALETTES[8];
  const blend = (day, dusk) => day.map((value, index) => value + (dusk[index] - value) * settings.sunset);
  return {
    sun: blend(palette.LIGHT_DAY_COLOR, palette.LIGHT_SUNSET_COLOR),
    zenith: blend(palette.ZENITH_DAY_COLOR, palette.ZENITH_SUNSET_COLOR),
    horizon: blend(palette.HORIZON_DAY_COLOR, palette.HORIZON_SUNSET_COLOR), omni: palette.omni,
  };
}

export function referenceSunDirection(settings) {
  const azimuth = settings.sunAzimuth * Math.PI / 180, elevation = settings.sunElevation * Math.PI / 180;
  return [Math.sin(azimuth) * Math.cos(elevation), Math.sin(elevation), Math.cos(azimuth) * Math.cos(elevation)];
}

export function referenceRenderPlan(preset, settings, theme = 'realistic') {
  const makeup = theme === 'realistic' && settings.renderer === 'makeup';
  const high = preset === 'high';
  return {
    makeup, fxaa: high, bloom: makeup ? settings.makeupBloom > 0 : settings.bloom > 0,
    bloomDivisor: preset === 'potato' ? 16 : high ? 4 : 8, denoiseBloom: high,
    wideBloom: high && !makeup, aoSteps: high && makeup && settings.makeupAO > 0 ? 7 : 0,
    autoExposure: makeup && settings.autoExposure,
  };
}

// A reversible MakeUp daylight recipe. Only existing uniforms change: no new
// passes, texture reads, targets, geometry, shader variants or resolution changes.
// Keep the persisted settings untouched so Off restores the user's exact look.
export function resolveLightweightLook(settings, theme = 'realistic') {
  if (!settings.lightweightLook || theme !== 'realistic' || settings.renderer !== 'makeup') return settings;
  return {
    ...settings,
    sunset: Math.min(1, settings.sunset + .12),
    sunElevation: Math.max(5, settings.sunElevation - 18),
    lightPower: settings.lightPower * 1.05,
    exposure: Math.max(.7, settings.exposure * .98),
    fog: settings.fog,
    ao: Math.min(1, settings.ao + .27),
    makeupBloom: settings.makeupBloom * .35,
  };
}
