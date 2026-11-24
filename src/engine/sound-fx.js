/**
 * Beyond 3D — Procedural Web Audio Spatial Sound Engine
 * Zero external audio assets required; generates crisp tactile 4D feedback:
 * - W-axis crystal glass glide (pitch tracks W: -1.8 deep -> 0.0 clear -> +1.8 bright)
 * - Magnetic grab lock / release
 * - 4D rotation precision harmonic gear tick (resonates cleanly at 90° blade lock)
 * - Honest collision / slit-expansion block low obsidian thud
 * - Tab honest view unfold chime & victory cathedral triad
 */

export class SoundFxEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.muted = false;
    this.lastWBeepTime = 0;
    this.lastRotBeepTime = 0;
    this.ambienceNodes = null;
  }

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return true;
    }
    const AudioCtx = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioCtx) return false;
    try {
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 0.38;
      this.masterGain.connect(this.ctx.destination);
      return true;
    } catch {
      return false;
    }
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.38, this.ctx.currentTime, 0.04);
    }
  }

  startSanctuaryAmbience() {
    if (this.ambienceNodes || !this.unlock()) return;
    try {
      const now = this.ctx.currentTime;
      const droneGain = this.ctx.createGain();
      droneGain.gain.setValueAtTime(0.0001, now);
      droneGain.gain.exponentialRampToValueAtTime(0.055, now + 2.5);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 340;
      filter.Q.value = 1.8;

      const osc1 = this.ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.value = 73.42; // D2 cathedral fundamental

      const osc2 = this.ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.value = 110.0; // A2 fifth overtone

      const osc3 = this.ctx.createOscillator();
      osc3.type = 'sine';
      osc3.frequency.value = 146.83; // D3 octave shimmer

      const g3 = this.ctx.createGain();
      g3.gain.value = 0.28;

      osc1.connect(filter);
      osc2.connect(filter);
      osc3.connect(g3);
      g3.connect(filter);
      filter.connect(droneGain);
      droneGain.connect(this.masterGain);

      osc1.start(now);
      osc2.start(now);
      osc3.start(now);
      this.ambienceNodes = { osc1, osc2, osc3, droneGain };
    } catch {
      // Ignore if audio context is blocked
    }
  }

  /**
   * Crystal glass resonance glide as player translates along W.
   * w in [-2.2, +2.2]: -1.8 -> 240Hz (deep blue), 0.0 -> 392Hz (clear cyan), +1.8 -> 587Hz (bright gold).
   */
  playWShift(wValue) {
    if (this.muted || !this.unlock()) return;
    const now = this.ctx.currentTime;
    if (now - this.lastWBeepTime < 0.055) return;
    this.lastWBeepTime = now;

    const norm = Math.max(-1, Math.min(1, wValue / 1.8));
    const freq = 392 * Math.pow(1.48, norm);

    const osc = this.ctx.createOscillator();
    const overtone = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.03, now + 0.14);

    overtone.type = 'triangle';
    overtone.frequency.setValueAtTime(freq * 2, now);

    const ovGain = this.ctx.createGain();
    ovGain.gain.value = 0.16;

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.16, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.18);

    osc.connect(gain);
    overtone.connect(ovGain);
    ovGain.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    overtone.start(now);
    osc.stop(now + 0.2);
    overtone.stop(now + 0.2);
  }

  playGrabLock(isGrabbing) {
    if (this.muted || !this.unlock()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    if (isGrabbing) {
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(640, now + 0.09);
    } else {
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.1);
    }
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.15);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  /**
   * 4D rotation gear/forcefield resonance.
   * When aligned to 90° blade state, emits a pure harmonic fifth shimmer.
   */
  playRotate4D(thetaDeg, isBladeAligned = false) {
    if (this.muted || !this.unlock()) return;
    const now = this.ctx.currentTime;
    if (now - this.lastRotBeepTime < 0.04) return;
    this.lastRotBeepTime = now;

    const sinVal = Math.abs(Math.sin((thetaDeg * Math.PI) / 180));
    const baseFreq = 260 + sinVal * 420;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isBladeAligned ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * (isBladeAligned ? 1.5 : 1.04), now + 0.12);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(isBladeAligned ? 0.24 : 0.12, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + (isBladeAligned ? 0.28 : 0.11));

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  /**
   * Low obsidian resonance thud for all-W monolith wall or slit-expansion block.
   */
  playBlocked() {
    if (this.muted || !this.unlock()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(138, now);
    osc.frequency.exponentialRampToValueAtTime(76, now + 0.22);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(192, now);
    osc2.frequency.exponentialRampToValueAtTime(112, now + 0.2);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.28, now + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.25);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.27);
    osc2.stop(now + 0.27);
  }

  playTabViewSwitch(isSideView) {
    if (this.muted || !this.unlock()) return;
    const now = this.ctx.currentTime;
    const notes = isSideView ? [440, 659.25] : [587.33, 440];
    notes.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      const t0 = now + idx * 0.055;
      gain.gain.setValueAtTime(0.001, t0);
      gain.gain.exponentialRampToValueAtTime(0.14, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.2);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t0);
      osc.stop(t0 + 0.22);
    });
  }

  playBeatUnlock(beat) {
    if (this.muted || !this.unlock()) return;
    const now = this.ctx.currentTime;
    const chords = {
      1: [392.0, 493.88],
      2: [440.0, 587.33, 659.25],
      3: [523.25, 659.25, 783.99],
    };
    const freqs = chords[beat] || chords[1];
    freqs.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      const t0 = now + i * 0.07;
      gain.gain.setValueAtTime(0.001, t0);
      gain.gain.exponentialRampToValueAtTime(0.16, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.45);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t0);
      osc.stop(t0 + 0.48);
    });
  }

  playVictory() {
    if (this.muted || !this.unlock()) return;
    const now = this.ctx.currentTime;
    const triad = [293.66, 369.99, 440.0, 587.33, 880.0]; // Radiant D Major sanctuary chord
    triad.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = i < 2 ? 'triangle' : 'sine';
      osc.frequency.value = f;
      const t0 = now + i * 0.085;
      gain.gain.setValueAtTime(0.001, t0);
      gain.gain.exponentialRampToValueAtTime(0.2, t0 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0006, t0 + 2.1);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t0);
      osc.stop(t0 + 2.2);
    });
  }
}
