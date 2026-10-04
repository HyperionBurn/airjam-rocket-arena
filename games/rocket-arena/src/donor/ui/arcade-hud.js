/** Supplied HUD artwork, baked to small textures; state changes alone update the DOM. */
export class ArcadeBoostMeter {
  constructor(root) {
    root.insertAdjacentHTML("beforeend", `
      <div class="boost arcade-boost" data-el="boost" role="meter" aria-label="Boost"
        aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
        <span class="arcade-boost__dial" aria-hidden="true"></span>
        <span class="arcade-boost__fill" data-el="boostFill" aria-hidden="true"></span>
        <span class="arcade-boost__number" data-el="boostFigure">0</span>
      </div>`);
    this.root = root.querySelector('[data-el="boost"]');
    this.fill = this.root.querySelector('[data-el="boostFill"]');
    this.figure = this.root.querySelector('[data-el="boostFigure"]');
    this.lastValue = -1;
    this.lastUnlimited = null;
    this.lastSpendingBoost = null;
  }

  update(value, spending, unlimited) {
    const infinite = Boolean(unlimited);
    const amount = infinite ? 100 : Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
    if (amount !== this.lastValue || infinite !== this.lastUnlimited) {
      this.figure.textContent = infinite ? "∞" : String(amount);
      this.fill.style.setProperty("--boost-sweep", `${amount * 2.25}deg`);
      this.fill.style.setProperty("--boost-level", `${amount}%`);
      this.root.setAttribute("aria-valuenow", String(amount));
      this.root.classList.toggle("is-unlimited", infinite);
      this.root.classList.toggle("is-empty", amount === 0);
      if (infinite) this.root.setAttribute("aria-valuetext", "Unlimited");
      else this.root.removeAttribute("aria-valuetext");
      this.lastValue = amount;
      this.lastUnlimited = infinite;
    }
    const firing = Boolean(spending) && !infinite && amount > 0;
    if (firing !== this.lastSpendingBoost) {
      this.root.classList.toggle("is-firing", firing);
      this.lastSpendingBoost = firing;
    }
  }
}
