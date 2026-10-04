import { createSettingsStore } from '../core/settings-store.js';
import { Ks } from '../input/controller-selection.js';
import { GARAGE_CARS, CAR_FINISHES, TEAM_CAR_COLORS, getCarCustomization, normalizeGarageCar, saveCarCustomization } from '../settings/car-customization.js';
import { GaragePreview } from './garage-preview.js';
import { garageMarkup, garageCategories } from './garage-view.js';

export const Qh = createSettingsStore('rocket-arena.local-display.v3', () => ({ carVisual: 'fennec' }), (target, saved) => {
  target.carVisual = normalizeGarageCar(saved.carVisual);
});
export class Garage {
  constructor(container, onOpenChange) {
    this.onOpenChange = onOpenChange; this.display = Qh.load(); this.selected = this.display.carVisual;
    this.team = 'orange'; this.category = 'body'; this.openState = false; this.stage = new GaragePreview();
    this.padPoll = 0; this.padPrev = []; this.padRepeatAt = 0;
    container.insertAdjacentHTML('beforeend', garageMarkup());
    this.overlay = container.querySelector('#car-overlay');
    this.stage.setHero(this.overlay.querySelector('.garage-hero'));
    container.querySelector('#car-button').addEventListener('click', () => this.show());
    this.overlay.querySelectorAll('[data-car-close]').forEach(button => button.addEventListener('click', () => this.hide()));
    this.cards().forEach(button => button.addEventListener('click', () => this.select(button.dataset.carChoice)));
    this.overlay.querySelector('[data-car-equip]').addEventListener('click', () => this.choose(this.selected));
    this.overlay.querySelectorAll('[data-garage-category]').forEach(button => button.addEventListener('click', () => this.setCategory(button.dataset.garageCategory)));
    this.overlay.querySelector('[data-garage-team]').addEventListener('click', () => { this.team = this.team === 'blue' ? 'orange' : 'blue'; this.syncControls(); this.stage.select(this.selected, this.team); });
    this.overlay.querySelectorAll('[data-paint-color]').forEach(input => input.addEventListener('input', () => this.savePaint({ [input.dataset.paintColor]: input.value })));
    this.overlay.querySelectorAll('[data-color-swatch]').forEach(button => button.addEventListener('click', () => this.savePaint({ primary: button.dataset.colorSwatch })));
    this.overlay.querySelector('[data-car-finish]').addEventListener('change', event => { const finish = event.target.value, values = CAR_FINISHES[finish]; this.savePaint({ finish, roughness: values.roughness, metalness: values.metalness, clearcoat: values.clearcoat }); });
    this.overlay.querySelectorAll('[data-car-material]').forEach(input => input.addEventListener('input', () => this.savePaint({ finish: 'custom', [input.dataset.carMaterial]: Number(input.value) })));
    this.overlay.querySelector('[data-reset-boost]').addEventListener('click', () => this.savePaint({ boostColor: TEAM_CAR_COLORS[this.team].boostColor }));
    window.addEventListener('keydown', event => this.handleKey(event));
    this.syncCards(); this.syncControls(); this.setCategory('body');
  }
  get isOpen() { return this.openState; }
  show() {
    if (this.openState) return;
    this.openState = true; this.overlay.hidden = false; this.overlay.setAttribute('aria-hidden', 'false');
    this.onOpenChange(true); requestAnimationFrame(() => this.overlay.classList.add('is-open'));
    this.preload().catch(() => {}); this.stage.select(this.selected, this.team); this.startPreviews();
    this.overlay.querySelector('[aria-selected="true"]').focus(); this.startPadNav();
  }
  hide() {
    if (!this.openState) return;
    this.openState = false; this.overlay.classList.remove('is-open'); this.overlay.setAttribute('aria-hidden', 'true');
    this.onOpenChange(false); this.stage.stop(); this.stopPadNav();
    window.setTimeout(() => { if (!this.openState) this.overlay.hidden = true; }, 180);
    document.querySelector('#car-button')?.focus();
  }
  preload() {
    if (this.preparing) return this.preparing;
    this.preparing = (async () => {
      for (const { id } of [...GARAGE_CARS].sort((a, b) => Number(b.id === this.selected) - Number(a.id === this.selected))) {
        const { canvas, ready } = this.stage.attach(id);
        this.overlay.querySelector(`[data-car-stage="${id}"]`).append(canvas);
        try {
          await ready;
          this.overlay.querySelector(`[data-car-status="${id}"]`)?.remove();
        } catch (error) {
          this.overlay.querySelector(`[data-car-status="${id}"]`).textContent = 'Model unavailable';
          throw error;
        }
        // Yield between previews so input and loading feedback remain responsive.
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      await this.stage.preload();
    })();
    return this.preparing;
  }
  startPreviews() { if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) this.stage.start(); }
  cards() { return Array.from(this.overlay.querySelectorAll('[data-car-choice]')); }
  select(carId) {
    this.selected = normalizeGarageCar(carId);
    this.syncCards(); this.syncControls(); this.stage.select(this.selected, this.team);
    // Choosing a body is the equip action; the old explicit button remains as a
    // status affordance while the selected car is being prepared.
    if (this.committing) this.pendingChoice = this.selected;
    else void this.choose(this.selected);
  }
  setCategory(id) {
    this.category = id;
    for (const button of this.overlay.querySelectorAll('[data-garage-category]')) { const active = button.dataset.garageCategory === id; button.classList.toggle('active', active); button.setAttribute('aria-selected', String(active)); }
    for (const panel of this.overlay.querySelectorAll('[data-garage-panel]')) panel.hidden = panel.dataset.garagePanel !== id;
    this.overlay.querySelector('[data-category-title]').textContent = garageCategories.find(category => category.id === id).label.toUpperCase();
    this.overlay.querySelector('[data-category-note]').textContent = id === 'body' ? `${GARAGE_CARS.length} collected` : `Customize ${GARAGE_CARS.find(car => car.id === this.selected).label}`;
  }
  syncCards() {
    document.querySelector('.car-tab__ride').textContent = GARAGE_CARS.find(car => car.id === this.display.carVisual).label;
    for (const card of this.cards()) { const equipped = card.dataset.carChoice === this.display.carVisual; card.classList.toggle('selected', card.dataset.carChoice === this.selected); card.classList.toggle('equipped', equipped); card.classList.toggle('is-selected', equipped); card.setAttribute('aria-checked', String(equipped)); card.querySelector('.car-card__state').textContent = equipped ? 'Equipped' : 'Select'; }
    const equipped = this.selected === this.display.carVisual;
    this.overlay.querySelector('[data-car-equip]').textContent = equipped ? 'EQUIPPED' : 'EQUIP CAR';
    this.overlay.querySelector('[data-car-equip]').disabled = equipped;
  }
  syncControls() {
    const settings = getCarCustomization(this.selected, this.team);
    for (const input of this.overlay.querySelectorAll('[data-paint-color]')) input.value = settings[input.dataset.paintColor];
    for (const button of this.overlay.querySelectorAll('[data-color-swatch]')) {
      const active = button.dataset.colorSwatch.toLowerCase() === settings.primary;
      button.classList.toggle('is-active', active); button.setAttribute('aria-pressed', String(active));
    }
    for (const input of this.overlay.querySelectorAll('[data-car-material]')) { input.value = settings[input.dataset.carMaterial]; this.overlay.querySelector(`[data-material-output="${input.dataset.carMaterial}"]`).textContent = Number(input.value).toFixed(2); }
    this.overlay.querySelector('[data-car-finish]').value = settings.finish;
    this.overlay.querySelector('[data-detail-name]').textContent = GARAGE_CARS.find(car => car.id === this.selected).label;
    this.overlay.querySelector('[data-detail-quality]').textContent = this.selected === 'octane' ? 'Common Body' : 'Import Body';
    this.overlay.querySelector('[data-detail-finish]').textContent = CAR_FINISHES[settings.finish].label;
    this.overlay.querySelector('[data-detail-team]').textContent = `${this.team.toUpperCase()} TEAM`;
    this.overlay.querySelector('[data-garage-team]').textContent = this.team === 'blue' ? 'ORANGE TEAM' : 'BLUE TEAM';
    this.overlay.style.setProperty('--boost-color', settings.boostColor);
    this.overlay.style.setProperty('--car-primary', settings.primary);
    this.overlay.style.setProperty('--car-pearl', settings.pearl);
    this.overlay.dataset.team = this.team;
  }
  savePaint(patch) { saveCarCustomization(this.selected, this.team, patch); this.syncControls(); this.stage.select(this.selected, this.team); this.overlay.querySelector('[data-car-result]').textContent = `${this.team === 'blue' ? 'Blue' : 'Orange'} team customization applied.`; }
  async choose(carId) {
    if (this.committing || this.display.carVisual === carId) return;
    this.committing = true; const status = this.overlay.querySelector('[data-car-result]'); status.textContent = 'Preparing car…';
    try { await this.onChoose(carId); this.display.carVisual = carId; Qh.save(this.display); this.syncCards(); status.textContent = 'Car equipped. Ready for kickoff.'; }
    catch (error) { status.textContent = error.message; }
    finally {
      this.committing = false;
      const pendingChoice = this.pendingChoice;
      this.pendingChoice = null;
      if (pendingChoice && pendingChoice !== this.display.carVisual) void this.choose(pendingChoice);
    }
  }
  focusable() { return Array.from(this.overlay.querySelectorAll('button:not(:disabled), input, select')).filter(element => !element.closest('[hidden]')); }
  moveFocus(direction) { const buttons = this.focusable(), index = buttons.indexOf(document.activeElement); buttons[(index + direction + buttons.length) % buttons.length]?.focus(); }
  handleKey(event) {
    if (!this.openState) return;
    if (event.code === 'Escape') { event.preventDefault(); this.hide(); return; }
    if (event.key === 'Tab') { event.preventDefault(); this.moveFocus(event.shiftKey ? -1 : 1); return; }
    if (/INPUT|SELECT/.test(event.target.tagName)) return;
    if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') { event.preventDefault(); this.moveFocus(event.code === 'ArrowRight' ? 1 : -1); }
  }
  startPadNav() {
    if (this.padPoll) return;
    this.padPrev = [];
    const poll = time => {
      if (!this.openState) return;
      this.padPoll = requestAnimationFrame(poll); const pad = Ks(); if (!pad) return;
      const pressed = pad.buttons.map(button => button.pressed);
      if (pressed[1] && !this.padPrev[1]) this.hide();
      else if (pressed[0] && !this.padPrev[0]) document.activeElement?.click();
      const direction = (pressed[15] || pressed[13] || pad.axes[0] > .55 || pad.axes[1] > .55 ? 1 : 0) - (pressed[14] || pressed[12] || pad.axes[0] < -.55 || pad.axes[1] < -.55 ? 1 : 0);
      if (direction && time >= this.padRepeatAt) { this.moveFocus(direction); this.padRepeatAt = time + 220; }
      this.padPrev = pressed;
    };
    this.padPoll = requestAnimationFrame(poll);
  }
  stopPadNav() { if (this.padPoll) cancelAnimationFrame(this.padPoll); this.padPoll = 0; }
}
