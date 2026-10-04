import { getActionLabel, getBindingLabel } from "../input/bindings.js";

function Na(i) {
  return i.replace(/[&<>"']/g, (e) => {
    switch (e) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

function MM(i) {
  return `
    <div class="dim" data-dim-row="${i.key}">
      <label class="dim__label" for="camera-${i.key}">${i.label}</label>
      <span class="dim__leader" aria-hidden="true"></span>
      <span class="dim__control">
        <input
          id="camera-${i.key}"
          class="dim__line"
          type="range"
          min="${i.min}"
          max="${i.max}"
          step="${i.step}"
          data-camera-setting="${i.key}"
        />
      </span>
      <output class="figure" data-value-for="${i.key}" for="camera-${i.key}"></output>
    </div>
  `;
}

function Pr(i, e, t, n, id) {
  const r = id ?? `${n}-${i}`;
  return `
    <div class="dim dim--flag">
      <label class="dim__label" for="${r}">${e}</label>
      <span class="dim__leader" aria-hidden="true"></span>
      <span class="dim__control dim__control--flag">
        <input id="${r}" class="tick" type="checkbox" data-${n}-setting="${i}" />
        <span class="tick__mark" aria-hidden="true"></span>
        <span class="dim__note">${t}</span>
      </span>
    </div>
  `;
}

function im(i, e, t, n, r) {
  const s = i === "keyboard" ? "keyboard / mouse" : "controller";
  return n
    ? `
    <span class="chip-pair">
      <button class="chip" type="button"
              data-bind-device="${i}" data-bind-action="${e}" data-bind-slot="${t}"
              aria-label="Change ${s} binding for ${getActionLabel(e)}, currently ${Na(getBindingLabel(n, r))}">
        ${Na(getBindingLabel(n, r))}
      </button>
      <button class="chip__clear" type="button"
              data-clear-device="${i}" data-clear-action="${e}" data-clear-slot="${t}"
              aria-label="Remove ${Na(getBindingLabel(n, r))} from ${getActionLabel(e)}">
        <span aria-hidden="true">×</span>
      </button>
    </span>
  `
    : `
      <button class="chip chip--empty" type="button"
              data-bind-device="${i}" data-bind-action="${e}" data-bind-slot="${t}"
              aria-label="Add ${s} binding for ${getActionLabel(e)}">
        <span aria-hidden="true">+</span>
      </button>
    `;
}

export { MM, Na, Pr, im };
