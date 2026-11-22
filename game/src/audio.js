// audio.js — one job: every sound, synthesized, no audio files.
// A tiny WebAudio synth: short oscillator blips with an envelope.
// Created lazily on the first user gesture (browsers demand that);
// every call before that is a silent no-op. M toggles mute.

export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  // Call from a key or click handler: browsers only allow audio after one.
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
    } catch (e) {
      this.ctx = null;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  // One note: frequency, seconds, shape, volume. The envelope keeps it soft.
  tone(freq, seconds, shape, volume, when) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + (when || 0);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = shape || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume || 0.12, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.05);
  }

  // A coin: two bright ticks, up a fifth.
  coin() {
    this.tone(880, 0.09, 'sine', 0.1);
    this.tone(1318, 0.14, 'sine', 0.09, 0.07);
  }

  // Loot: a rising triad.
  loot() {
    this.tone(523, 0.12, 'triangle', 0.12);
    this.tone(659, 0.12, 'triangle', 0.12, 0.09);
    this.tone(784, 0.2, 'triangle', 0.12, 0.18);
  }

  // The diamond: a bright arpeggio.
  diamond() {
    [1046, 1318, 1568, 2093].forEach((f, i) => this.tone(f, 0.22, 'sine', 0.11, i * 0.09));
  }

  // First spotted: a short dissonant sting.
  sting() {
    this.tone(220, 0.22, 'sawtooth', 0.07);
    this.tone(233, 0.22, 'sawtooth', 0.07, 0.02);
  }

  // The alarm, while it is high: a low two-note pulse.
  alarmPulse() {
    this.tone(196, 0.16, 'square', 0.045);
    this.tone(147, 0.16, 'square', 0.045, 0.18);
  }

  // A tossed coin: a single metallic tick.
  toss() {
    this.tone(2093, 0.05, 'square', 0.05);
  }

  // Smoke: a soft hush.
  smoke() {
    this.tone(320, 0.3, 'sine', 0.05);
    this.tone(240, 0.35, 'sine', 0.04, 0.08);
  }

  // Caught: a falling buzz.
  caught() {
    this.tone(160, 0.5, 'sawtooth', 0.1);
    this.tone(110, 0.7, 'sawtooth', 0.1, 0.15);
  }

  // Getaway: a short major fanfare.
  fanfare() {
    [523, 659, 784, 1046, 784, 1046].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.11, i * 0.11));
  }
}
