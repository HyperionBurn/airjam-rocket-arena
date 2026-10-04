import { REFERENCE_GRAPHICS_RANGES, referenceGraphicsSettings, sanitizeReferenceGraphics } from '../settings/reference-graphics.js';
import { REFERENCE_PALETTES } from '../settings/reference-palettes.js';

export function graphicsEditorMarkup() {
  const rangeMarkup = range => `<div class="dim">
    <label class="dim__label" for="reference-${range.key}">${range.label}</label>
    <span class="dim__leader" aria-hidden="true"></span><span class="dim__control">
    <input class="dim__line" id="reference-${range.key}" type="range" min="${range.min}" max="${range.max}" step="${range.step}" data-reference-setting="${range.key}"></span>
    <output class="figure" for="reference-${range.key}" data-reference-value="${range.key}"></output></div>`;
  const rows = group => REFERENCE_GRAPHICS_RANGES.filter(range => range.group === group).map(rangeMarkup).join('');
  return `<section class="zone" data-reference-editor>
    <header class="zone__head"><h2 class="zone__label">Shader & lighting editor</h2>
    <p class="zone__note" data-reference-note>Original OPEN_ME pearl materials and park lighting. Changes preview live and are saved.</p></header>
    <fieldset class="reference-editor__fields"><legend class="sr-only">Realistic shader and lighting</legend>
      <div class="dim"><label class="dim__label" for="reference-renderer">Shader</label><span class="dim__leader"></span><span class="dim__control">
        <select class="pick" id="reference-renderer" data-reference-setting="renderer"><option value="makeup">MakeUp 9.5e</option><option value="original">Original lighting</option></select></span></div>
      <div class="dim"><label class="dim__label" for="reference-palette">Color scheme</label><span class="dim__leader"></span><span class="dim__control">
        <select class="pick" id="reference-palette" data-reference-setting="palette">${REFERENCE_PALETTES.map((palette, index) => `<option value="${index}">${palette.name}</option>`).join('')}</select></span></div>
      <div data-reference-group="makeup">
        <label class="reference-editor__check"><input id="reference-lightweightLook" type="checkbox" data-reference-setting="lightweightLook"> Natural daylight · experimental</label>
        <p class="zone__note">Warmer sunlight, softer distant haze and deeper contact shading using the existing MakeUp shader. Turn off to restore your saved look exactly. Adds no rendering passes; compare FPS on your device.</p>
        ${rows('makeup')}
        <label class="reference-editor__check"><input type="checkbox" data-reference-setting="autoExposure"> Auto exposure</label>
      </div><div data-reference-group="original">${rows('original')}</div>
      <details open><summary>Lighting</summary><div class="zone__rows">${rows('lighting')}</div></details>
      <details><summary>Pearl paint & materials</summary><div class="zone__rows">${rows('paint')}</div></details>
      <p class="zone__note">All presets share the same car textures, pearl finish and park reflections. Render Scale controls resolution independently. High adds soft shadows and screen-space shading.</p>
      <button type="button" class="pick" data-reference-reset>Reset shader & lighting</button>
    </fieldset></section>`;
}

export class GraphicsEditor {
  constructor(root, onChange, onPreview = () => {}) {
    this.root = root.querySelector('[data-reference-editor]');
    this.onChange = onChange;
    this.settings = referenceGraphicsSettings.load();
    this.root.querySelectorAll('[data-reference-setting]').forEach(control => {
      const update = () => {
        const key = control.dataset.referenceSetting;
        const value = control.type === 'checkbox' ? control.checked : control.type === 'range' ? Number(control.value) : control.value;
        this.settings = sanitizeReferenceGraphics({ ...this.settings, [key]: value });
        this.commit(); onPreview();
      };
      control.addEventListener(control.type === 'range' ? 'input' : 'change', update);
    });
    this.root.querySelector('[data-reference-reset]').addEventListener('click', () => { this.reset(); onPreview(); });
    this.sync();
  }
  commit() { referenceGraphicsSettings.save(this.settings); this.sync(); this.onChange(this.settings); }
  reset() { this.settings = referenceGraphicsSettings.defaults(); this.commit(); }
  setTheme(theme) {
    this.root.querySelector('fieldset').disabled = theme !== 'realistic';
    this.root.querySelector('[data-reference-note]').textContent = theme === 'realistic'
      ? 'Original OPEN_ME pearl materials and park lighting. Changes preview live and are saved.'
      : 'Select Realistic to use MakeUp and the lighting editor. Your Realistic settings are saved.';
  }
  sync() {
    this.root.querySelectorAll('[data-reference-setting]').forEach(control => {
      const value = this.settings[control.dataset.referenceSetting];
      if (control.type === 'checkbox') control.checked = value;
      else control.value = value;
      if (control.type === 'range') {
        this.root.querySelector(`[data-reference-value="${control.dataset.referenceSetting}"]`).value = Number(value).toFixed(Number(control.step) < .01 ? 3 : 2);
        control.style.setProperty('--fill', `${(value - Number(control.min)) / (Number(control.max) - Number(control.min)) * 100}%`);
      }
    });
    this.root.querySelectorAll('[data-reference-group]').forEach(group => { group.hidden = group.dataset.referenceGroup !== this.settings.renderer; });
    this.root.querySelector('#reference-palette').disabled = this.settings.renderer !== 'makeup';
  }
}
