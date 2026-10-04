// A small menu above the frozen arena; simulation ownership stays with the game.
export function mountPauseMenu(root, actions) {
  const panel = document.createElement('section');
  panel.className = 'arena-pause';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-labelledby', 'arena-pause-title');
  panel.innerHTML = `<div class="arena-pause__menu"><h2 id="arena-pause-title">PAUSED</h2><nav aria-label="Pause menu"><button type="button" data-pause="resume">RESUME GAME</button><button type="button" data-pause="settings">SETTINGS</button><button type="button" data-pause="home">MAIN MENU</button></nav></div>`;
  root.append(panel);
  const buttons = [...panel.querySelectorAll('[data-pause]')];
  let open = false, poll = 0, previousConfirm = false, previousCancel = false, previousDirection = 0;
  const activePad = () => [...(navigator.getGamepads?.() ?? [])].find(Boolean);
  const directionOf = pad => pad?.buttons[12]?.pressed || (pad?.axes[1] ?? 0) < -0.55 ? -1 : pad?.buttons[13]?.pressed || (pad?.axes[1] ?? 0) > 0.55 ? 1 : 0;
  function moveFocus(direction) {
    const index = buttons.indexOf(document.activeElement);
    buttons[index < 0 ? (direction < 0 ? buttons.length - 1 : 0) : (index + direction + buttons.length) % buttons.length].focus({ preventScroll: true });
  }
  function hide() {
    if (!open) return;
    open = false;
    panel.hidden = true;
    root.classList.remove('pause-open');
    cancelAnimationFrame(poll); poll = 0;
    if (panel.contains(document.activeElement)) document.activeElement.blur();
    actions.pause(false);
  }
  function choose(action) {
    if (!open) return;
    hide();
    actions[action]?.();
  }
  function gamepad() {
    if (!open) return;
    const pad = activePad();
    const direction = directionOf(pad);
    const confirm = !!pad?.buttons[0]?.pressed, cancel = !!pad?.buttons[1]?.pressed;
    if (direction && direction !== previousDirection) moveFocus(direction);
    previousDirection = direction;
    if (confirm && !previousConfirm) {
      const button = panel.contains(document.activeElement) ? document.activeElement : buttons[0];
      choose(button.dataset.pause);
    } else if (cancel && !previousCancel) choose('resume');
    previousConfirm = confirm; previousCancel = cancel;
    if (open) poll = requestAnimationFrame(gamepad);
  }
  function show() {
    if (open) return;
    open = true;
    panel.hidden = false;
    root.classList.add('pause-open');
    actions.pause(true);
    buttons[0].focus({ preventScroll: true });
    const pad = activePad();
    previousDirection = directionOf(pad);
    previousConfirm = !!pad?.buttons[0]?.pressed;
    previousCancel = !!pad?.buttons[1]?.pressed;
    poll = requestAnimationFrame(gamepad);
  }
  panel.addEventListener('click', event => {
    const button = event.target.closest('[data-pause]');
    if (button) choose(button.dataset.pause);
  });
  panel.addEventListener('keydown', event => {
    event.stopPropagation();
    if (event.key === 'Escape') { event.preventDefault(); choose('resume'); }
    else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); moveFocus(event.key === 'ArrowDown' ? 1 : -1); }
    else if (event.key === 'Tab') { event.preventDefault(); moveFocus(event.shiftKey ? -1 : 1); }
  });
  // Pointer interaction with the menu must not reach gameplay input handlers.
  for (const type of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'dblclick', 'contextmenu']) {
    panel.addEventListener(type, event => event.stopPropagation());
  }
  return { show, hide, get isOpen() { return open; } };
}
