import { createSettingsStore, readNumber } from "../core/settings-store.js";
import { AudioMixer } from "./context.js";
// AIR JAM PATCH: embedded in Air Jam, the projector window is not the thing the
// players are looking at, so it is routinely unfocused. Mute on hidden only.
import { arenaBridge } from "../app/arena-bridge.js";
const audible = () => !document.hidden && (arenaBridge.embedded || document.hasFocus());

const f1 = "rocket-arena.audio-settings.v1";

const lg = { masterVolume: 0.6 };

const bA = createSettingsStore(
    f1,
    () => ({ ...lg }),
    (i, e) => {
      i.masterVolume = readNumber(e.masterVolume, i.masterVolume, { min: 0, max: 1 });
    },
  );

const Xd = "rocket-arena:audio-settings-changed";

const mc = globalThis;

const En = mc.__carSoccerAudio ?? (mc.__carSoccerAudio = p1());

function p1() {
  const i = { settings: bA.load(), context: null, mixer: null },
    e = () => {
      var t;
      (t = i.mixer) == null ||
        t.setActive(audible());
    };
  return (
    window.addEventListener("focus", e),
    window.addEventListener("blur", e),
    document.addEventListener("visibilitychange", e),
    window.addEventListener("pagehide", () => {
      var t;
      return (t = i.mixer) == null ? void 0 : t.setActive(!1);
    }),
    window.addEventListener("pageshow", e),
    window.addEventListener("storage", (t) => {
      var n;
      (t.key !== bA.key && t.key !== null) ||
        (bA.loadInto(i.settings),
        (n = i.mixer) == null || n.setVolume(i.settings.masterVolume),
        window.dispatchEvent(new Event(Xd)));
    }),
    i
  );
}

function getAudioSettings() {
  return En.settings;
}

function getAudioContext() {
  return (
    En.context ||
      ((En.context = new AudioContext()),
      (En.mixer = new AudioMixer(En.context)),
      En.mixer.setVolume(En.settings.masterVolume),
      En.mixer.setActive(audible())),
    En.context
  );
}

function getAudioInput() {
  return (getAudioContext(), En.mixer.input);
}

function setMasterVolume(i) {
  var e;
  Number.isFinite(i) &&
    ((En.settings.masterVolume = Math.min(1, Math.max(0, i))),
    (e = En.mixer) == null || e.setVolume(En.settings.masterVolume),
    bA.save(En.settings),
    window.dispatchEvent(new Event(Xd)));
}

export { Xd, getAudioContext, getAudioInput, getAudioSettings, lg, setMasterVolume };
