// AIR JAM PATCH (new file, not upstream): the match-event sounds the donor never
// had. Its audio covers engines, boost, jumps and impacts; a match also needs the
// moments that make a football-with-cars game feel like one: kickoff ticks, the
// goal explosion + stadium horn + crowd, demolitions, boost pad pickups and the
// final buzzer.
//
// Everything is synthesised with Web Audio (no new assets, nothing to license) and
// routed through the donor's own mixer, so master volume, mute-when-hidden and the
// "click to enable sound" unlock all apply. Nothing plays while the context is
// suspended: a sound that arrives a second late is worse than none.
import { getAudioContext, getAudioInput } from "./settings.js";

const NOISE_SECONDS = 2;

export class ArenaSfx {
  constructor() {
    this.noise = null;
    this.bus = null;
    this.lastPad = 0;
    this.lastDemo = 0;
  }

  /**
   * Everything goes through one limiter before the donor's mixer: a goal stacks a
   * blast, a horn and a crowd, and their sum would clip without it.
   */
  output(context) {
    if (!this.bus || this.bus.context !== context) {
      const limiter = context.createDynamicsCompressor();
      limiter.threshold.value = -14;
      limiter.knee.value = 8;
      limiter.ratio.value = 10;
      limiter.attack.value = 0.002;
      limiter.release.value = 0.2;
      limiter.connect(getAudioInput());
      this.bus = limiter;
    }
    return this.bus;
  }

  /** The context if sound can play right now, else null. */
  ready() {
    let context;
    try {
      context = getAudioContext();
    } catch {
      return null;
    }
    return context.state === "running" ? context : null;
  }

  noiseBuffer(context) {
    if (!this.noise || this.noise.sampleRate !== context.sampleRate) {
      const length = Math.floor(context.sampleRate * NOISE_SECONDS);
      const buffer = context.createBuffer(1, length, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
      this.noise = buffer;
    }
    return this.noise;
  }

  /** A gain node with an attack/hold/release envelope, already connected to the mixer. */
  envelope(context, t, { peak, attack, hold, release }) {
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
    gain.gain.setValueAtTime(Math.max(peak, 0.0002), t + attack + hold);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);
    gain.connect(this.output(context));
    return gain;
  }

  tone(context, t, { type, freq, freqEnd, duration, peak, attack = 0.005, hold = 0 }) {
    const osc = context.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + duration);
    const gain = this.envelope(context, t, { peak, attack, hold, release: Math.max(0.02, duration - attack - hold) });
    osc.connect(gain);
    osc.start(t);
    osc.stop(t + duration + 0.05);
    return gain;
  }

  burst(context, t, { duration, peak, from, to, type = "lowpass", q = 0.7, attack = 0.004 }) {
    const source = context.createBufferSource();
    source.buffer = this.noiseBuffer(context);
    source.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = type;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(from, t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(to, 20), t + duration);
    const gain = this.envelope(context, t, { peak, attack, hold: 0, release: Math.max(0.03, duration - attack) });
    source.connect(filter).connect(gain);
    source.start(t, Math.random() * (NOISE_SECONDS - 0.5));
    source.stop(t + duration + 0.05);
  }

  /** A brass-ish stadium horn: detuned saw stack through a gently opening low-pass. */
  horn(context, t, { root, duration, peak }) {
    const gain = this.envelope(context, t, { peak, attack: 0.06, hold: duration * 0.55, release: duration * 0.45 });
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = 2.2;
    filter.frequency.setValueAtTime(500, t);
    filter.frequency.linearRampToValueAtTime(1500, t + 0.35);
    filter.frequency.linearRampToValueAtTime(900, t + duration);
    filter.connect(gain);
    for (const [ratio, detune, level] of [[1, 0, 1], [1, 9, 0.8], [1.5, -6, 0.5], [2, 4, 0.45]]) {
      const osc = context.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = root * ratio;
      osc.detune.value = detune;
      const mix = context.createGain();
      mix.gain.value = level;
      osc.connect(mix).connect(filter);
      osc.start(t);
      osc.stop(t + duration + 0.1);
    }
  }

  crowd(context, t, { duration, peak }) {
    for (const [from, level] of [[850, 1], [2400, 0.45]]) {
      const source = context.createBufferSource();
      source.buffer = this.noiseBuffer(context);
      source.loop = true;
      const filter = context.createBiquadFilter();
      filter.type = "bandpass";
      filter.Q.value = 0.6;
      filter.frequency.setValueAtTime(from, t);
      filter.frequency.linearRampToValueAtTime(from * 1.25, t + duration * 0.35);
      const gain = this.envelope(context, t, { peak: peak * level, attack: 0.55, hold: duration * 0.3, release: duration * 0.7 });
      source.connect(filter).connect(gain);
      source.start(t, Math.random() * (NOISE_SECONDS - 0.5));
      source.stop(t + duration + 0.6);
    }
  }

  /** Kickoff countdown tick: one short, dry blip per second. */
  tick() {
    const context = this.ready();
    if (!context) return;
    const t = context.currentTime;
    this.tone(context, t, { type: "sine", freq: 700, duration: 0.16, peak: 0.28 });
    this.tone(context, t, { type: "triangle", freq: 1400, duration: 0.08, peak: 0.08 });
  }

  /** Whistle-bright "go" as the ball drops. */
  go() {
    const context = this.ready();
    if (!context) return;
    const t = context.currentTime;
    this.tone(context, t, { type: "sine", freq: 1050, duration: 0.5, peak: 0.3, hold: 0.12 });
    this.tone(context, t, { type: "triangle", freq: 1575, duration: 0.42, peak: 0.12, hold: 0.1 });
    this.tone(context, t, { type: "sine", freq: 525, duration: 0.5, peak: 0.16, hold: 0.12 });
  }

  /** Ball in the net: the blast, the horn and the crowd. */
  goal() {
    const context = this.ready();
    if (!context) return;
    const t = context.currentTime;
    // Blast: a sub drop and a low-passed noise crack.
    this.tone(context, t, { type: "sine", freq: 95, freqEnd: 32, duration: 1.2, peak: 0.85, attack: 0.008 });
    this.burst(context, t, { duration: 1.3, peak: 0.55, from: 3200, to: 140, q: 0.8 });
    this.burst(context, t, { duration: 0.18, peak: 0.4, from: 5200, to: 1600, type: "bandpass", q: 1.2 });
    // Horn + crowd come in just behind the blast.
    this.horn(context, t + 0.18, { root: 116.5, duration: 2.1, peak: 0.2 });
    this.crowd(context, t + 0.1, { duration: 3.6, peak: 0.34 });
  }

  /** A car blown up: crack, thud and a short metallic ring. */
  demolish() {
    const context = this.ready();
    if (!context) return;
    const now = performance.now();
    if (now - this.lastDemo < 150) return;
    this.lastDemo = now;
    const t = context.currentTime;
    this.burst(context, t, { duration: 0.55, peak: 0.5, from: 4200, to: 180, q: 0.9 });
    this.tone(context, t, { type: "sine", freq: 110, freqEnd: 38, duration: 0.5, peak: 0.6, attack: 0.004 });
    this.tone(context, t, { type: "square", freq: 1900, freqEnd: 700, duration: 0.18, peak: 0.07 });
  }

  /** Boost pad taken near the camera. Big pads ring brighter and longer. */
  pickup(big) {
    const context = this.ready();
    if (!context) return;
    const now = performance.now();
    if (now - this.lastPad < (big ? 60 : 140)) return;
    this.lastPad = now;
    const t = context.currentTime;
    if (big) {
      this.tone(context, t, { type: "sine", freq: 520, freqEnd: 1560, duration: 0.42, peak: 0.2, attack: 0.01 });
      this.tone(context, t + 0.04, { type: "triangle", freq: 1040, freqEnd: 2600, duration: 0.34, peak: 0.08 });
    } else {
      this.tone(context, t, { type: "sine", freq: 880, freqEnd: 1320, duration: 0.14, peak: 0.1, attack: 0.004 });
    }
  }

  /** Full time: a long arena buzzer with the crowd rising under it. */
  finalWhistle() {
    const context = this.ready();
    if (!context) return;
    const t = context.currentTime;
    this.horn(context, t, { root: 98, duration: 2.0, peak: 0.24 });
    this.crowd(context, t + 0.2, { duration: 3.2, peak: 0.22 });
  }
}
