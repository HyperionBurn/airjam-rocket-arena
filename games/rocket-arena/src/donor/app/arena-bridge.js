// AIR JAM PATCH (new file, not in the upstream donor).
//
// A tiny registry shared by the donor's `startup.js` and the Air Jam host shell.
// It exists so the host can reach the donor's local multi-car match without any
// window globals, and so the donor can tell whether it is embedded in Air Jam.
//
//   embedded    The host sets this to true BEFORE calling boot(). Embedded mode
//               skips the donor's home screen / online intent restore: in Air
//               Jam the lobby lives on the projector, not in the donor's menus.
//   controller  Set by startup.js once the game is built. See
//               local-multiplayer.js for its API.
//
// Nothing in here touches the DOM or the simulation.

const waiters = [];

export const arenaBridge = {
  embedded: false,
  controller: null,

  attach(controller) {
    this.controller = controller;
    for (const resolve of waiters.splice(0)) resolve(controller);
  },

  /** Resolves with the controller as soon as the donor has finished booting. */
  whenReady() {
    return this.controller ? Promise.resolve(this.controller) : new Promise((resolve) => waiters.push(resolve));
  },
};
