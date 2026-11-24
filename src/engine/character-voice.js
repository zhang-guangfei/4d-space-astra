/**
 * Beyond 3D — Dual-Character Voice Engine (D12)
 * Supports:
 * - 'linxia' (先遣员 · 林夏 07 号): warm, clear female timbre + subtle crystalline comm chirp
 * - 'tomb'   (遗迹 AI · 「墓地」): deep ancient metallic resonance (196Hz -> 147Hz dual triangle-wave
 *            metallic shimmer with algorithmic reverb tail + 0.84x pitch-shifted speech synthesis)
 *
 * Always emits clean subtitle callbacks even when audio is muted or SpeechSynthesis is absent.
 */

export const SPEAKERS = Object.freeze({
  linxia: {
    id: 'linxia',
    displayName: '林夏 · 07 号',
    roleTag: '先遣领航员',
    color: '#4DE6D3',
    pitch: 1.08,
    rate: 1.02,
  },
  tomb: {
    id: 'tomb',
    displayName: '遗迹 AI ·「墓地」',
    roleTag: '高维方舟意识',
    color: '#F7C346',
    pitch: 0.84, // D12 exact 0.84x lowered pitch
    rate: 0.86,
  },
});

export class CharacterVoiceEngine {
  constructor(options = {}) {
    this.enabled = true;
    this.onSubtitle = options.onSubtitle ?? (() => {});
    this.audioCtx = null;
    this.reverbBuffer = null;
    this.subtitleTimer = null;
  }

  _ensureAudio() {
    if (this.audioCtx) {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return true;
    }
    const AudioCtx = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioCtx) return false;
    try {
      this.audioCtx = new AudioCtx();
      this.reverbBuffer = this._createCathedralImpulse(this.audioCtx, 1.8, 2.6);
      return true;
    } catch {
      return false;
    }
  }

  _createCathedralImpulse(ctx, durationSec, decay) {
    const rate = ctx.sampleRate;
    const length = Math.floor(rate * durationSec);
    const impulse = ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch += 1) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i += 1) {
        const t = i / length;
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay);
      }
    }
    return impulse;
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    if (!this.enabled && globalThis.speechSynthesis) {
      try {
        globalThis.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }

  /**
   * Play Tomb's signature 196Hz -> 147Hz dual triangle-wave metallic resonance cue with reverb (D12).
   */
  _playTombMetallicResonance() {
    if (!this.enabled || !this._ensureAudio()) return;
    try {
      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      const oscA = ctx.createOscillator();
      const oscB = ctx.createOscillator();
      oscA.type = 'triangle';
      oscB.type = 'triangle';

      // Exact G3 (196 Hz) -> D3 (147 Hz) descending dual-triangle resonance with slight metallic detune
      oscA.frequency.setValueAtTime(196.0, now);
      oscA.frequency.exponentialRampToValueAtTime(147.0, now + 0.55);

      oscB.frequency.setValueAtTime(196.0 * 1.007, now);
      oscB.frequency.exponentialRampToValueAtTime(147.0 * 0.993, now + 0.55);

      // Metallic harmonic overtone ring
      const metalOsc = ctx.createOscillator();
      metalOsc.type = 'sine';
      metalOsc.frequency.setValueAtTime(588.0, now);
      metalOsc.frequency.exponentialRampToValueAtTime(441.0, now + 0.45);
      const metalGain = ctx.createGain();
      metalGain.gain.value = 0.08;

      const dryGain = ctx.createGain();
      dryGain.gain.setValueAtTime(0.001, now);
      dryGain.gain.exponentialRampToValueAtTime(0.16, now + 0.04);
      dryGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.85);

      const wetGain = ctx.createGain();
      wetGain.gain.value = 0.42;

      const convolver = ctx.createConvolver();
      convolver.buffer = this.reverbBuffer;

      oscA.connect(dryGain);
      oscB.connect(dryGain);
      metalOsc.connect(metalGain);
      metalGain.connect(dryGain);

      dryGain.connect(ctx.destination);
      dryGain.connect(convolver);
      convolver.connect(wetGain);
      wetGain.connect(ctx.destination);

      oscA.start(now);
      oscB.start(now);
      metalOsc.start(now);
      oscA.stop(now + 0.9);
      oscB.stop(now + 0.9);
      metalOsc.stop(now + 0.9);
    } catch {
      // Ignore audio errors
    }
  }

  /**
   * Play Lin Xia's warm comm-link crystalline chirp cue.
   */
  _playLinXiaChirp() {
    if (!this.enabled || !this._ensureAudio()) return;
    try {
      const ctx = this.audioCtx;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.11, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // Ignore audio errors
    }
  }

  _selectZhVoice(speakerId) {
    const synth = globalThis.speechSynthesis;
    if (!synth || typeof synth.getVoices !== 'function') return null;
    const voices = synth.getVoices() || [];
    const zhVoices = voices.filter((v) => /zh|cmn|chinese/i.test(v.lang));
    if (zhVoices.length === 0) return null;
    if (speakerId === 'linxia') {
      return (
        zhVoices.find((v) => /female|xiaoxiao|ting|huihui|yaoyao|mei|sin/i.test(v.name)) ||
        zhVoices[0]
      );
    }
    return (
      zhVoices.find((v) => /male|yunxi|kangkang|yunjian|li/i.test(v.name)) || zhVoices[0]
    );
  }

  /**
   * Speak a character line with acoustic signature + Web Speech synthesis + HUD subtitle callback.
   */
  speak(speakerId, text, options = {}) {
    const profile = SPEAKERS[speakerId] || SPEAKERS.tomb;
    const durationMs = options.durationMs ?? Math.max(4200, Math.min(7200, text.length * 165));

    this.onSubtitle({
      visible: true,
      speaker: profile,
      text,
      tierLabel: options.tierLabel ?? null,
    });

    if (this.subtitleTimer) {
      clearTimeout(this.subtitleTimer);
    }
    this.subtitleTimer = setTimeout(() => {
      this.onSubtitle({ visible: false, speaker: profile, text: '' });
    }, durationMs);

    if (!this.enabled) return;

    if (speakerId === 'tomb') {
      this._playTombMetallicResonance();
    } else {
      this._playLinXiaChirp();
    }

    const synth = globalThis.speechSynthesis;
    if (synth && typeof globalThis.SpeechSynthesisUtterance === 'function') {
      try {
        synth.cancel();
        const utter = new globalThis.SpeechSynthesisUtterance(text);
        utter.lang = 'zh-CN';
        utter.pitch = profile.pitch;
        utter.rate = profile.rate;
        utter.volume = 0.88;
        const voice = this._selectZhVoice(speakerId);
        if (voice) utter.voice = voice;
        synth.speak(utter);
      } catch {
        // Gracefully rely on signature cue + subtitle
      }
    }
  }
}
