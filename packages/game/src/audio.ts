/**
 * RyftAudio v2 — cinematic battle audio engine.
 *
 * Architecture
 * ─────────────
 *  SFX bus   : one-shot effects routed here
 *  Music bus : ambient drone + rhythmic beat engine (80 BPM)
 *
 * The beat engine uses a 80 ms lookahead scheduler so beats stay locked
 * regardless of JS GC pauses.  All sound is synthesised — zero audio files.
 */
export class RyftAudio {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  private sfxEnabled = true;
  private musicEnabled = true;
  private sfxVolume = 0.7;
  private musicVolume = 0.28;

  /* continuous ambient oscillators (need explicit .stop()) */
  private ambientOscs: OscillatorNode[] = [];
  private ambientGain: GainNode | null = null;
  private ambientRunning = false;

  /* beat scheduler state */
  private beatInterval: ReturnType<typeof setInterval> | null = null;
  private nextBeatTime = 0;
  private beatCount = 0;
  private readonly BEAT = 60 / 80; // 80 BPM = 0.75 s

  /* ────────────────────────────────────────────────────────────────── */
  /*  Init (lazy — must be triggered from a user gesture)              */
  /* ────────────────────────────────────────────────────────────────── */
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
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  /* ────────────────────────────────────────────────────────────────── */
  /*  Volume / toggle                                                   */
  /* ────────────────────────────────────────────────────────────────── */
  setSfxEnabled(v: boolean) {
    this.sfxEnabled = v;
    if (this.sfxGain) this.sfxGain.gain.value = v ? this.sfxVolume : 0;
  }
  setMusicEnabled(v: boolean) {
    this.musicEnabled = v;
    if (this.musicGain) this.musicGain.gain.value = v ? this.musicVolume : 0;
    if (!v) this.stopAmbient();
  }
  setSfxVolume(v: number) {
    this.sfxVolume = Math.max(0, Math.min(1, v));
    if (this.sfxGain && this.sfxEnabled) this.sfxGain.gain.value = this.sfxVolume;
  }
  setMusicVolume(v: number) {
    this.musicVolume = Math.max(0, Math.min(1, v));
    if (this.musicGain && this.musicEnabled) this.musicGain.gain.value = this.musicVolume;
  }
  getSfxEnabled() { return this.sfxEnabled; }
  getMusicEnabled() { return this.musicEnabled; }
  getSfxVolume() { return this.sfxVolume; }
  getMusicVolume() { return this.musicVolume; }

  /* ────────────────────────────────────────────────────────────────── */
  /*  Low-level SFX helpers                                            */
  /* ────────────────────────────────────────────────────────────────── */

  /** Single oscillator note through the SFX bus. */
  private tone(
    freq: number,
    type: OscillatorType,
    dur: number,
    peak = 0.8,
    attack = 0.008,
    freqEnd?: number,
    delayStart = 0,
  ) {
    if (!this.sfxEnabled) return;
    const ctx = this.ensure();
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    const t = ctx.currentTime + delayStart;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (freqEnd !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), t + dur * 0.85);
    }
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(peak, t + attack);
    env.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(env);
    env.connect(this.sfxGain!);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  /** Short noise burst (for whoosh / crunch / crash). */
  private noise(
    dur: number,
    peak: number,
    filterFreq: number,
    filterType: BiquadFilterType = "bandpass",
    Q = 1,
    delayStart = 0,
  ) {
    if (!this.sfxEnabled) return;
    const ctx = this.ensure();
    const len = Math.ceil(ctx.sampleRate * (dur + 0.05));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = filterType;
    filt.frequency.value = filterFreq;
    filt.Q.value = Q;
    const env = ctx.createGain();
    const t = ctx.currentTime + delayStart;
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(peak, t + 0.004);
    env.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filt);
    filt.connect(env);
    env.connect(this.sfxGain!);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  /* ────────────────────────────────────────────────────────────────── */
  /*  Public SFX                                                        */
  /* ────────────────────────────────────────────────────────────────── */

  /** Card slams onto the board — heavy thud + sharp shimmer. */
  playCardPlace() {
    // sub-bass thud
    this.tone(120, "sine", 0.18, 0.95, 0.002, 55);
    // bright click
    this.tone(2200, "sine", 0.06, 0.5, 0.001);
    // body whoosh
    this.noise(0.09, 0.35, 700, "bandpass", 2.5);
  }

  /** Your attack — explosive punch with sub-bass. */
  playAttack() {
    // sawtooth crunch sweep
    this.tone(900, "sawtooth", 0.08, 1.0, 0.001, 160);
    // square body hit
    this.tone(420, "square", 0.14, 0.75, 0.001, 70);
    // sub punch
    this.tone(75, "sine", 0.22, 0.9, 0.001, 35);
    // high crack noise
    this.noise(0.1, 0.55, 2500, "highpass", 1);
  }

  /** Damage landed on you — visceral impact. */
  playDamage() {
    // deep sub thud
    this.tone(60, "sine", 0.28, 1.0, 0.001, 28);
    // pain sting — quick chirp up then fall
    this.tone(380, "triangle", 0.14, 0.65, 0.002, 600);
    // metallic ring
    this.tone(1100, "triangle", 0.09, 0.35, 0.002);
    this.noise(0.07, 0.4, 1400, "bandpass", 3);
  }

  /** Opponent attacks — heavier, darker, more menacing. */
  playOpponentAttack() {
    // massive low impact
    this.tone(50, "sine", 0.35, 1.0, 0.001, 25);
    // grinding square descend
    this.tone(200, "square", 0.22, 0.85, 0.001, 55);
    // crash noise
    this.noise(0.18, 0.65, 500, "lowpass", 2);
  }

  /** Draw a card — crystalline ascending sparkle. */
  playDraw() {
    [880, 1100, 1320, 1760].forEach((f, i) => {
      this.tone(f, "sine", 0.14, 0.48, 0.004, undefined, i * 0.045);
    });
  }

  /** New turn starts — sharp metallic gong. */
  playTurnStart() {
    // bell body (long decay)
    this.tone(440, "sine", 0.7, 0.85, 0.004);
    this.tone(880, "triangle", 0.35, 0.45, 0.004);
    // sub dong for weight
    this.tone(110, "sine", 0.5, 0.6, 0.01);
    // sharp transient click
    this.noise(0.04, 0.4, 3500, "highpass", 1);
  }

  /** Victory — triumphant multi-layer fanfare. */
  playVictory() {
    if (!this.sfxEnabled) return;
    const ctx = this.ensure();
    // melody: C major with added 9th
    [523.25, 659.25, 783.99, 987.77, 1046.5].forEach((f, i) => {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = f;
      const t = ctx.currentTime + i * 0.11;
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.75, t + 0.01);
      env.gain.setValueAtTime(0.75, t + 0.28);
      env.gain.linearRampToValueAtTime(0, t + (i === 4 ? 1.4 : 0.42));
      osc.connect(env); env.connect(this.sfxGain!);
      osc.start(t); osc.stop(t + 1.5);
    });
    // bass support
    [130.81, 196, 261.63].forEach((f, i) => {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = f;
      const t = ctx.currentTime + i * 0.07;
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.55, t + 0.015);
      env.gain.linearRampToValueAtTime(0, t + 0.7);
      osc.connect(env); env.connect(this.sfxGain!);
      osc.start(t); osc.stop(t + 0.75);
    });
    this.noise(0.35, 0.2, 4500, "highpass", 1);
  }

  /** Defeat — dark descending crash with sub rumble. */
  playDefeat() {
    if (!this.sfxEnabled) return;
    const ctx = this.ensure();
    [493.88, 440, 392, 349.23, 261.63].forEach((f, i) => {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = i > 2 ? "sawtooth" : "triangle";
      osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.18);
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(f * 0.8, 1),
        ctx.currentTime + i * 0.18 + 0.5,
      );
      const t = ctx.currentTime + i * 0.18;
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.65, t + 0.015);
      env.gain.linearRampToValueAtTime(0, t + (i === 4 ? 1.2 : 0.55));
      osc.connect(env); env.connect(this.sfxGain!);
      osc.start(t); osc.stop(t + 1.3);
    });
    // sub rumble
    this.tone(38, "sine", 1.4, 0.9, 0.06);
    this.noise(0.45, 0.6, 350, "lowpass", 2);
  }

  /* ────────────────────────────────────────────────────────────────── */
  /*  Ambient music — layered drone + 80 BPM beat engine               */
  /* ────────────────────────────────────────────────────────────────── */

  startAmbient() {
    if (this.ambientRunning || !this.musicEnabled) return;
    const ctx = this.ensure();
    this.ambientRunning = true;

    /* master ambient gain — fade in over 3 s */
    this.ambientGain = ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0, ctx.currentTime);
    this.ambientGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 3);
    this.ambientGain.connect(this.musicGain!);

    /* continuous drones ─ A minor sonority (A-C#-E) for ominous weight */
    this.spawnDrone(55,     "sine",     0.55);
    this.spawnDrone(110,    "sine",     0.30);  // octave above
    this.spawnDrone(138.59, "triangle", 0.14);  // C#3 — minor-third tension
    this.spawnDrone(164.81, "triangle", 0.11);  // E3 — fifth

    /* nervous high-frequency tremolo (8 Hz shimmer) */
    const shimOsc = ctx.createOscillator();
    const shimGain = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    shimOsc.type = "triangle";
    shimOsc.frequency.value = 440;
    shimGain.gain.value = 0.08;
    lfo.type = "sine";
    lfo.frequency.value = 8;      // 8 Hz = nervous flutter
    lfoGain.gain.value = 0.07;
    lfo.connect(lfoGain);
    lfoGain.connect(shimGain.gain);
    shimOsc.connect(shimGain);
    shimGain.connect(this.ambientGain);
    shimOsc.start(); lfo.start();
    this.ambientOscs.push(shimOsc, lfo);

    /* start beat scheduler — first beat after 1.8 s (drones fade in first) */
    this.nextBeatTime = ctx.currentTime + 1.8;
    this.beatCount = 0;
    this.beatInterval = setInterval(() => this.tick(), 80);
  }

  /** Spawn a continuous drone oscillator into the ambient bus. */
  private spawnDrone(freq: number, type: OscillatorType, vol: number) {
    if (!this.ctx || !this.ambientGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = vol;
    osc.connect(g);
    g.connect(this.ambientGain);
    osc.start();
    this.ambientOscs.push(osc);
  }

  /** Lookahead scheduler — fires every 80 ms, schedules beats within next 250 ms. */
  private tick() {
    if (!this.ctx || !this.ambientRunning || !this.ambientGain) return;
    const lookahead = 0.25;
    while (this.nextBeatTime < this.ctx.currentTime + lookahead) {
      this.scheduleBeat(this.nextBeatTime, this.beatCount);
      this.beatCount++;
      this.nextBeatTime += this.BEAT;
    }
  }

  /** Lay down one beat at audio time `t` (beat index `n`). */
  private scheduleBeat(t: number, n: number) {
    const ctx = this.ctx!;
    const ag = this.ambientGain!;

    /* ── KICK (every beat, pitch sweep 180 → 50 Hz) ── */
    {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.13);
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.85, t + 0.003);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.connect(env); env.connect(ag);
      osc.start(t); osc.stop(t + 0.32);
    }

    /* ── HI-HAT (off-beats) ── */
    if (n % 2 === 1) {
      const len = Math.ceil(ctx.sampleRate * 0.055);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const hpf = ctx.createBiquadFilter();
      hpf.type = "highpass";
      hpf.frequency.value = 7500;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.12, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.055);
      src.connect(hpf); hpf.connect(env); env.connect(ag);
      src.start(t); src.stop(t + 0.065);
    }

    /* ── SNARE (beat 3 of every 4-beat bar, i.e. n%4 === 2) ── */
    if (n % 4 === 2) {
      const len = Math.ceil(ctx.sampleRate * 0.14);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const bpf = ctx.createBiquadFilter();
      bpf.type = "bandpass";
      bpf.frequency.value = 1100;
      bpf.Q.value = 0.9;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.22, t + 0.003);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
      src.connect(bpf); bpf.connect(env); env.connect(ag);
      src.start(t); src.stop(t + 0.15);
      // snare body tone
      const bodyOsc = ctx.createOscillator();
      const bodyEnv = ctx.createGain();
      bodyOsc.type = "triangle";
      bodyOsc.frequency.setValueAtTime(200, t);
      bodyOsc.frequency.exponentialRampToValueAtTime(100, t + 0.08);
      bodyEnv.gain.setValueAtTime(0, t);
      bodyEnv.gain.linearRampToValueAtTime(0.18, t + 0.002);
      bodyEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      bodyOsc.connect(bodyEnv); bodyEnv.connect(ag);
      bodyOsc.start(t); bodyOsc.stop(t + 0.1);
    }

    /* ── DARK ARPEGGIO (A-minor: A C# E G A — cycles each beat) ── */
    {
      const arpNotes = [110, 130.81, 164.81, 196, 220, 164.81, 130.81, 110];
      const freq = arpNotes[n % arpNotes.length]!;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.18, t + 0.012);
      env.gain.exponentialRampToValueAtTime(0.001, t + this.BEAT * 0.75);
      osc.connect(env); env.connect(ag);
      osc.start(t); osc.stop(t + this.BEAT);
    }

    /* ── TENSION SWELL every 8 beats (measure end accent) ── */
    if (n > 0 && n % 8 === 0) {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(55, t);
      osc.frequency.exponentialRampToValueAtTime(220, t + 0.35);
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.38, t + 0.05);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
      osc.connect(env); env.connect(ag);
      osc.start(t); osc.stop(t + 0.48);
    }

    /* ── SUB ACCENT on beat 1 of every 2-bar phrase ── */
    if (n % 8 === 4) {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 55;
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.5, t + 0.005);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.connect(env); env.connect(ag);
      osc.start(t); osc.stop(t + 0.5);
    }
  }

  stopAmbient() {
    if (!this.ambientRunning) return;
    this.ambientRunning = false;

    if (this.beatInterval !== null) {
      clearInterval(this.beatInterval);
      this.beatInterval = null;
    }

    if (this.ambientGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.ambientGain.gain.cancelScheduledValues(now);
      this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, now);
      this.ambientGain.gain.linearRampToValueAtTime(0, now + 0.5);
    }

    const oscs = [...this.ambientOscs];
    this.ambientOscs = [];
    setTimeout(() => {
      oscs.forEach((o) => { try { o.stop(); } catch { /* already stopped */ } });
    }, 600);
    this.ambientGain = null;
  }
}

/** Singleton shared across all scenes. */
export const ryftAudio = new RyftAudio();
