import { _ } from "../core/class-fields.js";

class AudioMixer {
  constructor(e) {
    _(this, "input");
    _(this, "output");
    _(this, "volume", 1);
    _(this, "active", !1);
    _(this, "connected", !1);
    _(this, "context");
    ((this.context = e),
      (this.input = e.createGain()),
      (this.output = e.createGain()),
      (this.output.gain.value = 0),
      this.input.connect(this.output));
  }
  setVolume(e) {
    ((this.volume = e), this.apply());
  }
  setActive(e) {
    ((this.active = e), this.apply());
  }
  apply() {
    const { context: e, output: t } = this,
      n = e.currentTime,
      r = this.active ? this.volume : 0,
      s = t.gain.value;
    if ((t.gain.cancelScheduledValues(n), r === 0)) {
      (t.gain.setValueAtTime(0, n),
        this.connected && t.disconnect(e.destination),
        (this.connected = !1));
      return;
    }
    (e.state === "running" && this.connected
      ? (t.gain.setValueAtTime(s, n),
        t.gain.linearRampToValueAtTime(r, n + 0.02))
      : t.gain.setValueAtTime(r, n),
      this.connected || t.connect(e.destination),
      (this.connected = !0));
  }
}

export { AudioMixer };
