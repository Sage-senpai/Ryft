/**
 * RyftAudio — procedural sound effects using the Web Audio API.
 *
 * Every SFX is synthesised from oscillators + gain envelopes so the game
 * ships zero audio files.  A subtle ambient drone provides background
 * atmosphere and loops indefinitely.
 */

export class RyftAudio {
  private ctx: AudioContext | null = null;

  /* master buses */
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  /* state */
  private sfxEnabled = true;
  private musicEnabled = true;
  private sfxVolume = 0.6;
  private musicVolume = 0.25;

  /* ambient nodes (so we can stop them) */
  private ambientOscs: OscillatorNode[] = [];
  private ambientGain: GainNode | null = null;
  private ambientRunning = false;

  /* ------------------------------------------------------------------ */
  /*  Lazy-init (must be called from a user-gesture on some browsers)   */
  /* ------------------------------------------------------------------ */
  private ensure(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  /* ------------------------------------------------------------------ */
  /*  Toggles / volume                                                  */
  /* ------------------------------------------------------------------ */
  setSfxEnabled(v: boolean) {
    this.sfxEnabled = v;
    if (this.sfxGain) {
      this.sfxGain.gain.value = v ? this.sfxVolume : 0;
    }
  }

  setMusicEnabled(v: boolean) {
    this.musicEnabled = v;
    if (this.musicGain) {
      this.musicGain.gain.value = v ? this.musicVolume : 0;
    }
    if (!v) this.stopAmbient();
  }

  setSfxVolume(v: number) {
    this.sfxVolume = Math.max(0, Math.min(1, v));
    if (this.sfxGain && this.sfxEnabled) {
      this.sfxGain.gain.value = this.sfxVolume;
    }
  }

  setMusicVolume(v: number) {
    this.musicVolume = Math.max(0, Math.min(1, v));
    if (this.musicGain && this.musicEnabled) {
      this.musicGain.gain.value = this.musicVolume;
    }
  }

  getSfxEnabled() { return this.sfxEnabled; }
  getMusicEnabled() { return this.musicEnabled; }
  getSfxVolume() { return this.sfxVolume; }
  getMusicVolume() { return this.musicVolume; }

  /* ------------------------------------------------------------------ */
  /*  Private helpers                                                    */
  /* ------------------------------------------------------------------ */

  /** Play a short oscillator note routed through the SFX bus. */
  private playTone(
    freq: number,
    type: OscillatorType,
    duration: number,
    attack = 0.01,
    release?: number,
    detune = 0,
  ) {
    if (!this.sfxEnabled) return;
    const ctx = this.ensure();
    const osc = ctx.createOscillator();
    const env = ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;

    const now = ctx.currentTime;
    const rel = release ?? duration * 0.4;
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(1, now + attack);
    env.gain.setValueAtTime(1, now + duration - rel);
    env.gain.linearRampToValueAtTime(0, now + duration);

    osc.connect(env);
    env.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  /** Play two stacked tones for a richer SFX. */
  private playChord(
    freqs: number[],
    type: OscillatorType,
    duration: number,
    attack = 0.01,
    release?: number,
  ) {
    freqs.forEach((f, i) =>
      this.playTone(f, type, duration, attack, release, i * 3),
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Public SFX methods                                                */
  /* ------------------------------------------------------------------ */

  /** Card lands on the board — short bright click. */
  playCardPlace() {
    this.playTone(880, "sine", 0.09, 0.005, 0.06);
    this.playTone(1320, "sine", 0.06, 0.005, 0.04);
  }

  /** Your attack connects — aggressive buzz sweep. */
  playAttack() {
    if (!this.sfxEnabled) return;
    const ctx = this.ensure();
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

    env.gain.setValueAtTime(0, ctx.currentTime);
    env.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 0.02);
    env.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.18);

    osc.connect(env);
    env.connect(this.sfxGain!);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  }

  /** Damage number appears — quick low thud. */
  playDamage() {
    this.playTone(110, "triangle", 0.16, 0.005, 0.12);
    this.playTone(85, "sine", 0.2, 0.01, 0.14);
  }

  /** Draw a card — ascending sparkle. */
  playDraw() {
    this.playTone(660, "sine", 0.08, 0.005, 0.05);
    this.playTone(990, "sine", 0.08, 0.005, 0.05);
    // slight delay on the top note for a sparkle feel
    if (!this.sfxEnabled) return;
    const ctx = this.ensure();
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 1320;
    const t = ctx.currentTime + 0.06;
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.6, t + 0.005);
    env.gain.linearRampToValueAtTime(0, t + 0.1);
    osc.connect(env);
    env.connect(this.sfxGain!);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  /** Victory — triumphant ascending arpeggio. */
  playVictory() {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((f, i) => {
      if (!this.sfxEnabled) return;
      const ctx = this.ensure();
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = f;
      const t = ctx.currentTime + i * 0.12;
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.7, t + 0.02);
      env.gain.setValueAtTime(0.7, t + 0.18);
      env.gain.linearRampToValueAtTime(0, t + (i === notes.length - 1 ? 0.6 : 0.28));
      osc.connect(env);
      env.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.7);
    });
  }

  /** Defeat — descending minor arpeggio. */
  playDefeat() {
    const notes = [493.88, 415.3, 329.63, 261.63]; // B4 Ab4 E4 C4
    notes.forEach((f, i) => {
      if (!this.sfxEnabled) return;
      const ctx = this.ensure();
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = f;
      const t = ctx.currentTime + i * 0.16;
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.6, t + 0.02);
      env.gain.setValueAtTime(0.6, t + 0.2);
      env.gain.linearRampToValueAtTime(0, t + (i === notes.length - 1 ? 0.7 : 0.34));
      osc.connect(env);
      env.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.8);
    });
  }

  /** New turn — short bell chime. */
  playTurnStart() {
    this.playChord([440, 554.37, 659.25], "sine", 0.25, 0.005, 0.18);
  }

  /** Opponent attacks — heavier, darker buzz than our attack. */
  playOpponentAttack() {
    if (!this.sfxEnabled) return;
    const ctx = this.ensure();
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const env = ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(160, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.2);

    osc2.type = "sawtooth";
    osc2.frequency.setValueAtTime(200, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);

    env.gain.setValueAtTime(0, ctx.currentTime);
    env.gain.linearRampToValueAtTime(0.7, ctx.currentTime + 0.015);
    env.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);

    osc.connect(env);
    osc2.connect(env);
    env.connect(this.sfxGain!);
    osc.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
    osc2.stop(ctx.currentTime + 0.3);
  }

  /* ------------------------------------------------------------------ */
  /*  Ambient music — layered low drones                                */
  /* ------------------------------------------------------------------ */

  startAmbient() {
    if (this.ambientRunning || !this.musicEnabled) return;
    const ctx = this.ensure();
    this.ambientRunning = true;

    this.ambientGain = ctx.createGain();
    this.ambientGain.gain.value = 0;
    this.ambientGain.connect(this.musicGain!);

    // fade in
    this.ambientGain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 2);

    const makeOsc = (freq: number, type: OscillatorType, detune = 0) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      o.detune.value = detune;
      o.connect(this.ambientGain!);
      o.start();
      this.ambientOscs.push(o);
    };

    // sub bass drone
    makeOsc(55, "sine");
    // eerie fifth
    makeOsc(82.41, "sine", 5);
    // shimmer
    makeOsc(110, "triangle", -3);

    // slow LFO on the shimmer detune for movement
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = "sine";
    lfo.frequency.value = 0.15; // very slow
    lfoGain.gain.value = 8;
    lfo.connect(lfoGain);
    // connect to last osc detune
    const last = this.ambientOscs[this.ambientOscs.length - 1];
    if (last) {
      lfoGain.connect(last.detune);
    }
    lfo.start();
    this.ambientOscs.push(lfo);
  }

  stopAmbient() {
    if (!this.ambientRunning) return;
    this.ambientRunning = false;

    // fade out quickly
    if (this.ambientGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.ambientGain.gain.cancelScheduledValues(now);
      this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, now);
      this.ambientGain.gain.linearRampToValueAtTime(0, now + 0.5);
    }

    // stop oscillators after fade
    const oscs = [...this.ambientOscs];
    this.ambientOscs = [];
    setTimeout(() => {
      oscs.forEach((o) => {
        try { o.stop(); } catch { /* already stopped */ }
      });
    }, 600);
    this.ambientGain = null;
  }
}

/** Singleton instance shared across all scenes. */
export const ryftAudio = new RyftAudio();
