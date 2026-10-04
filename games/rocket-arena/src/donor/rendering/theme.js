import { createSettingsStore, readChoice } from "../core/settings-store.js";

const dl = ["arcade"];

const Gh = "arcade";

const I0 = createSettingsStore(
    "rocket-arena.theme.v1",
    () => ({ theme: Gh }),
    (i, e) => {
      i.theme = readChoice(e.theme, dl, i.theme);
    },
  );

let ao = I0.load().theme;

const Oh = new Set();

function L0() {
  var i;
  typeof document < "u" &&
    (i = document.documentElement) != null &&
    i.dataset &&
    (document.documentElement.dataset.theme = ao);
}

L0();

function getTheme() {
  return ao;
}

function setTheme(i, e = {}) {
  if (!dl.includes(i)) return;
  const t = i !== ao;
  if (((ao = i), L0(), e.persist !== !1 && I0.save({ theme: i }), t))
    for (const n of Oh) n(i);
}

function subscribeTheme(i) {
  return (
    Oh.add(i),
    i(ao),
    () => {
      Oh.delete(i);
    }
  );
}

export { Gh, dl, getTheme, setTheme, subscribeTheme };
