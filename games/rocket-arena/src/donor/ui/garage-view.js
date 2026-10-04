import { GARAGE_CARS, CAR_FINISHES } from '../settings/car-customization.js';
import { garageReferenceIcons } from './garage-reference-icons.js';
import { Vt } from './icons.js';

export const garageCategories = [{ id: 'body', label: 'Body' }, { id: 'paint', label: 'Paint finish' }, { id: 'boost', label: 'Rocket boost' }];
const swatches = ['#00bacb', '#0039f7', '#ff9910', '#ff05b9', '#ff3333', '#9d4cff', '#eeeeee', '#252936'];

export function garageMarkup() { return `
  <button id="car-button" class="car-tab" type="button" aria-label="Open garage" aria-haspopup="dialog">
    <span class="car-tab__icon" aria-hidden="true">${Vt('car-profile', 36)}</span>
    <span class="car-tab__copy"><span class="car-tab__label">Garage</span><span class="car-tab__ride"></span></span>
  </button>
  <div id="car-overlay" class="car-overlay rl-garage" hidden aria-hidden="true">
    <section class="garage-layout" role="dialog" aria-modal="true" aria-labelledby="car-dialog-title">
      <header class="garage-heading"><h2 id="car-dialog-title">GARAGE</h2><span>Customize your ride</span><button type="button" data-car-close aria-label="Close garage">${Vt('x', 24)}</button></header>
      <div class="garage-content">
        <section class="inventory-panel" aria-label="Garage inventory">
          <nav class="categories"><div class="category-tabs" role="tablist" aria-label="Garage category">
            ${garageCategories.map(category => `<button class="category-tab" type="button" role="tab" id="garage-tab-${category.id}" data-garage-category="${category.id}" aria-controls="garage-panel-${category.id}" aria-selected="false">${garageReferenceIcons[category.id]}<span>${category.label}</span></button>`).join('')}
          </div></nav>
          <header class="inventory-header"><h1 data-category-title>BODY</h1><span class="collected" data-category-note>${GARAGE_CARS.length} collected</span></header>
          <div class="inventory-viewport">
            <div id="garage-panel-body" role="tabpanel" aria-labelledby="garage-tab-body" data-garage-panel="body">
              <div class="inventory-grid car-grid" role="radiogroup" aria-label="Car body">${GARAGE_CARS.map(car => `
                <button class="inventory-item car-card ${car.id === 'octane' ? 'rarity-common' : 'rarity-import'}" type="button" role="radio" aria-checked="false" data-car-choice="${car.id}">
                  <span class="car-card__stage" data-car-stage="${car.id}"><span class="car-card__status" data-car-status="${car.id}">Loading…</span></span>
                  <span class="item-name car-card__name">${car.label}</span><span class="car-card__state"></span>
                </button>`).join('')}</div>
              <p class="garage-note">Select a body to preview it, then equip it for your next kickoff.</p>
            </div>
            <div id="garage-panel-paint" role="tabpanel" aria-labelledby="garage-tab-paint" data-garage-panel="paint" hidden>
              <div class="garage-paint-preview" aria-hidden="true"><span></span><span></span><strong>LIVE TEAM PAINT</strong></div>
              <div class="garage-color-grid">
                <label class="garage-color-row">Primary color<input type="color" data-paint-color="primary" aria-label="Primary car color"></label>
                <label class="garage-color-row">Pearl color<input type="color" data-paint-color="pearl" aria-label="Pearl car color"></label>
              </div>
              <div class="garage-swatches" aria-label="Primary color swatches">${swatches.map(color => `<button type="button" data-color-swatch="${color}" aria-label="Set primary color ${color}" aria-pressed="false" style="--swatch:${color}"></button>`).join('')}</div>
              <label class="garage-field">Car material<select data-car-finish>${Object.entries(CAR_FINISHES).map(([id, value]) => `<option value="${id}">${value.label}</option>`).join('')}</select></label>
              ${[['roughness', 'Roughness', '.08'], ['metalness', 'Metalness', '0'], ['clearcoat', 'Clearcoat', '0']].map(([id, label, min]) => `<label class="garage-field">${label}<output data-material-output="${id}"></output><input type="range" min="${min}" max="1" step=".01" data-car-material="${id}"></label>`).join('')}
              <p class="garage-note">Original pearl follows the graphics editor. Other finishes apply to this car and team.</p>
            </div>
            <div id="garage-panel-boost" role="tabpanel" aria-labelledby="garage-tab-boost" data-garage-panel="boost" hidden>
              <div class="garage-boost-sample" aria-hidden="true"><span></span></div><h3 class="garage-section-label">ROCKET BOOST</h3>
              <label class="garage-color-row">Boost color<input type="color" data-paint-color="boostColor" aria-label="Boost color"></label>
              <button class="metal-button garage-reset-boost" type="button" data-reset-boost>Original golden boost</button>
              <p class="garage-note">Colors the flame, trail, exhaust and nozzle glow for this car and team.</p>
            </div>
          </div>
        </section>
        <section class="garage-showroom" aria-label="Live car preview">
          <aside class="item-details"><h2 data-detail-name>Fennec</h2><div class="detail-quality" data-detail-quality>Import Body</div><div class="detail-paint-row"><span class="paint-tag" data-detail-finish>Original pearl</span><span class="painted-word" data-detail-team>BLUE TEAM</span></div><div class="detail-rule"></div><p class="detail-description">Your paint. Your boost. Your ride.</p></aside>
          <canvas class="garage-hero" width="1280" height="720" aria-label="Selected car preview rendered at full scale"></canvas>
          <div class="garage-orbit-hint" aria-hidden="true"><span>↔</span> DRAG TO ORBIT CAMERA <b>·</b> SCROLL TO ZOOM</div>
          <button class="metal-button garage-equip" type="button" data-car-equip>Equipped</button>
        </section>
      </div>
      <footer class="garage-footer"><button class="footer-button" type="button" data-car-close>BACK</button><button class="footer-button team-toggle" type="button" data-garage-team>ORANGE TEAM</button><span role="status" data-car-result>Changes save automatically.</span></footer>
    </section>
  </div>`; }
