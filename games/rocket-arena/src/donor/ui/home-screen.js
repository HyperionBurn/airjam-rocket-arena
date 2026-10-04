// DOM overlay over the existing arena. The game owns the paused scene and camera.
export function mountHome(root, actions) {
  const panel = document.createElement('section');
  panel.className = 'arcade-home arena-home';
  panel.hidden = true;
  panel.setAttribute('aria-label', 'Rocket Arena home');
  panel.innerHTML = `
    <header class="arena-home__header"><img class="arena-home__logo" src="/assets/ui/rocket-arena-mark.webp" width="1254" height="1254" alt=""><div class="arcade-brand">ROCKET <span>ARENA</span></div></header>
    <div class="arena-home__navigation" data-home-page="main"><nav aria-label="Home menu">
      <button type="button" class="arena-home__choice is-play" data-home="play"><span class="play-key" aria-hidden="true">A</span><span class="play-copy"><strong>PLAY</strong><small>HIT THE FIELD</small></span></button>
      <button type="button" class="arena-home__choice" data-home="garage"><span>GARAGE</span></button>
      <button type="button" class="arena-home__choice" data-home="settings"><span>SETTINGS</span></button>
    </nav></div>
    <section class="arena-play" data-home-page="play" hidden aria-label="Choose a game mode">
      <h1 class="arena-play__title">PLAY</h1>
      <div class="arena-play__grid">
        <button class="arena-mode" type="button" data-home="casual"><img src="/assets/menu/casual-original.webp" alt="" draggable="false"><span><strong>CASUAL</strong><small>Online · 1v1, 2v2, 3v3</small></span></button>
        <button class="arena-mode" type="button" data-home="ranked"><img src="/assets/online/ranked.webp" alt="" draggable="false"><span><strong>RANKED</strong><small>Online · Account required</small></span></button>
        <button class="arena-mode" type="button" data-home="match"><img src="/assets/online/bots.webp" alt="" draggable="false"><span><strong>BOTS</strong><small>Offline · Three AI difficulties</small></span></button>
        <button class="arena-mode" type="button" data-home="freeplay"><img src="/assets/menu/freeplay-original.webp" alt="" draggable="false"><span><strong>FREE PLAY</strong><small>Offline · Solo practice</small></span></button>
      </div>
      <nav class="arena-play__actions" aria-label="Play menu actions"><button type="button" data-home="back">BACK</button></nav>
    </section>
    `;
  const homeButton = document.createElement('button');
  homeButton.className = 'arcade-home-button';
  homeButton.textContent = 'HOME';
  homeButton.type = 'button';
  homeButton.setAttribute('aria-label', 'Open home screen');
  (root.querySelector('.hud-tools') ?? root).append(homeButton);
  root.append(panel);
  let visible = false, dirty = true, drag = null, poll = 0, page = 'main';
  let lastDirection = 0, lastMove = 0, previousConfirm = false, previousCancel = false;
  const orbit = { yaw: 2.087180175781252, pitch: 0.08, distance: 1 };
  const buttons = () => [...panel.querySelectorAll('[data-home]')].filter(button => !button.hidden && !button.closest('[hidden]'));
  function setPage(next) {
    page = next;
    for (const section of panel.querySelectorAll('[data-home-page]')) section.hidden = section.dataset.homePage !== next;
    panel.classList.toggle('is-play-menu', next === 'play');
    buttons()[0]?.focus({ preventScroll: true });
  }
  function cancel() {
    if (page === 'play') setPage('main');
  }
  function moveFocus(direction) {
    const list = buttons();
    const index = list.indexOf(document.activeElement);
    list[(index + direction + list.length) % list.length].focus({ preventScroll: true });
  }
  function gamepad(now) {
    if (!visible) return;
    const pad = [...(navigator.getGamepads?.() ?? [])].find(Boolean);
    if (pad) {
      const axis = pad.axes[1] ?? 0;
      const direction = pad.buttons[12]?.pressed || axis < -0.55 ? -1 : pad.buttons[13]?.pressed || axis > 0.55 ? 1 : 0;
      if (direction && (direction !== lastDirection || now - lastMove > 240)) { moveFocus(direction); lastMove = now; }
      lastDirection = direction;
      const confirm = !!pad.buttons[0]?.pressed, cancelPressed = !!pad.buttons[1]?.pressed;
      if (confirm && !previousConfirm && panel.contains(document.activeElement)) document.activeElement.click();
      if (cancelPressed && !previousCancel) cancel();
      previousConfirm = confirm; previousCancel = cancelPressed;
    } else { lastDirection = 0; previousConfirm = previousCancel = false; }
    if (visible) poll = requestAnimationFrame(gamepad);
  }
  function close() {
    if (!visible) return;
    visible = false; panel.hidden = true; root.classList.remove('home-open');
    if (drag && panel.hasPointerCapture?.(drag.id)) panel.releasePointerCapture(drag.id);
    drag = null; panel.classList.remove('is-orbiting');
    cancelAnimationFrame(poll); poll = 0;
    actions.pause(false);
  }
  function show() {
    if (visible) return;
    visible = true; dirty = true; panel.hidden = false; root.classList.add('home-open');
    actions.pause(true);
    setPage('main');
    const pad = [...(navigator.getGamepads?.() ?? [])].find(Boolean);
    previousConfirm = !!pad?.buttons[0]?.pressed; previousCancel = !!pad?.buttons[1]?.pressed;
    lastDirection = 0;
    poll = requestAnimationFrame(gamepad);
  }
  homeButton.addEventListener('click', show);
  panel.addEventListener('click', event => {
    const button = event.target.closest('[data-home]');
    if (!button) return;
    const action = button.dataset.home;
    if (action === 'play') { setPage('play'); return; }
    if (action === 'back') { cancel(); return; }
    close();
    actions[action]?.();
  });
  panel.addEventListener('keydown', event => {
    // Keep menu navigation from reaching gameplay shortcuts.
    event.stopPropagation();
    if (event.key === 'Escape') { event.preventDefault(); cancel(); }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); moveFocus(['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : -1); }
    if (event.key === 'Tab') { event.preventDefault(); moveFocus(event.shiftKey ? -1 : 1); }
  });
  panel.addEventListener('pointerdown', event => {
    if (page !== 'main' || event.button !== 0 || event.target.closest('button, nav, header, footer')) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    panel.setPointerCapture(event.pointerId); panel.classList.add('is-orbiting');
    event.preventDefault();
  });
  panel.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    orbit.yaw -= (event.clientX - drag.x) * 0.006;
    orbit.pitch = Math.max(0.08, Math.min(0.75, orbit.pitch + (event.clientY - drag.y) * 0.003));
    drag.x = event.clientX; drag.y = event.clientY; dirty = true;
  });
  const stopDrag = () => { drag = null; panel.classList.remove('is-orbiting'); };
  panel.addEventListener('pointerup', stopDrag);
  panel.addEventListener('pointercancel', stopDrag);
  panel.addEventListener('lostpointercapture', stopDrag);
  panel.addEventListener('wheel', event => {
    if (page !== 'main' || event.target.closest('nav')) return;
    event.preventDefault();
    orbit.distance = Math.max(0.65, Math.min(1.7, orbit.distance + Math.sign(event.deltaY) * 0.07));
    dirty = true;
  }, { passive: false });
  return { show, close, get visible() { return visible; }, get orbit() { return { ...orbit }; }, consumeDirty() { const value = dirty; dirty = false; return value; } };
}
