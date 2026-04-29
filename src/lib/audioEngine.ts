class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private currentOscillators: OscillatorNode[] = [];
  private isPlaying = false;
  private sequenceInterval: number | null = null;

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
    this.masterGain.gain.value = 0.5;
  }

  getAnalyser() {
    return this.analyser;
  }

  private playTone(freq: number, type: OscillatorType, duration: number, startTime: number, volume = 0.1) {
    if (!this.ctx || !this.masterGain) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
    
    this.currentOscillators.push(osc);
    setTimeout(() => {
      this.currentOscillators = this.currentOscillators.filter(o => o !== osc);
    }, duration * 1000 + 100);
  }

  stop() {
    this.isPlaying = false;
    if (this.sequenceInterval) {
      clearInterval(this.sequenceInterval);
      this.sequenceInterval = null;
    }
    this.currentOscillators.forEach(osc => {
      try { osc.stop(); } catch(e) {}
    });
    this.currentOscillators = [];
  }

  playTrack(type: 'ambient' | 'lofi' | 'fast', bpm: number) {
    this.stop();
    this.init();
    if (!this.ctx) return;
    
    this.isPlaying = true;
    const stepDuration = 60 / bpm / 2; // eighth notes
    let step = 0;

    const scales = {
      ambient: [261.63, 293.66, 329.63, 392.00, 440.00], // C Major Pentatonic
      lofi: [233.08, 277.18, 311.13, 349.23, 415.30], // Bb Minor Pentatonic
      fast: [130.81, 155.56, 174.61, 196.00, 233.08] // C Minor Pentatonic (Lower)
    };

    const scale = scales[type];

    this.sequenceInterval = window.setInterval(() => {
      if (!this.isPlaying || !this.ctx) return;
      const now = this.ctx.currentTime;

      // Kick drum simulation
      if (step % 4 === 0) {
        this.playTone(60, 'sine', 0.2, now, 0.3);
      }

      // Snare/Hat simulation
      if (step % 4 === 2) {
        this.playTone(800, 'square', 0.05, now, 0.05);
      }

      // Melody/Arp
      if (type === 'fast') {
        const freq = scale[Math.floor(Math.random() * scale.length)];
        this.playTone(freq * 2, 'sawtooth', stepDuration * 0.8, now, 0.1);
      } else if (type === 'lofi') {
        if (step % 2 === 0) {
          const freq = scale[Math.floor(Math.random() * scale.length)];
          this.playTone(freq, 'triangle', stepDuration * 1.5, now, 0.15);
        }
      } else {
        // Ambient
        if (step % 8 === 0) {
          const freq = scale[Math.floor(Math.random() * scale.length)];
          this.playTone(freq, 'sine', stepDuration * 4, now, 0.2);
        }
      }

      step = (step + 1) % 16;
    }, stepDuration * 1000);
  }

  playDeathSound() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [200, 150, 100, 50].forEach((freq, i) => {
      this.playTone(freq, 'square', 0.2, now + i * 0.15, 0.2);
    });
  }

  playLevelUpSound() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [261.63, 329.63, 392.00, 523.25].forEach((freq, i) => {
      this.playTone(freq, 'sine', 0.15, now + i * 0.1, 0.2);
    });
  }

  setVolume(v: number) {
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(v, this.ctx?.currentTime || 0);
    }
  }
}

export const audioEngine = new AudioEngine();
