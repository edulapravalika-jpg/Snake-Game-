export class CyberSynth {
  ctx: AudioContext | null = null;
  isPlaying = false;
  currentTrack = 0;
  intervalId: number | null = null;
  step = 0;

  tracks = [
    { name: "TRK_00::AURAL_HEX", tempo: 140, sequence: [220, 0, 330, 440, 0, 220, 550, 0] },
    { name: "TRK_01::NULL_POINTER", tempo: 90, sequence: [110, 110, 0, 165, 110, 0, 55, 0] },
    { name: "TRK_02::STACK_OVERFLOW", tempo: 180, sequence: [880, 440, 220, 110, 220, 440, 880, 1760] }
  ];

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  playNote(freq: number, type: OscillatorType = 'square', duration = 0.1) {
    if (!this.ctx || freq === 0) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000 + Math.random() * 2000;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    if (Math.random() > 0.8) {
      osc.frequency.exponentialRampToValueAtTime(freq * 2, this.ctx.currentTime + duration);
    }
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  play() {
    this.init();
    if (this.ctx?.state === 'suspended') this.ctx.resume();
    this.isPlaying = true;
    this.scheduleNext();
  }

  pause() {
    this.isPlaying = false;
    if (this.intervalId) window.clearTimeout(this.intervalId);
  }

  skip() {
    this.currentTrack = (this.currentTrack + 1) % this.tracks.length;
    this.step = 0;
    if (this.isPlaying) {
      this.pause();
      this.play();
    }
  }

  getTrackName() {
    return this.tracks[this.currentTrack].name;
  }

  scheduleNext = () => {
    if (!this.isPlaying) return;
    const track = this.tracks[this.currentTrack];
    const freq = track.sequence[this.step % track.sequence.length];
    
    const type = Math.random() > 0.7 ? 'sawtooth' : 'square';
    
    this.playNote(freq, type, 60 / track.tempo);
    
    this.step++;
    this.intervalId = window.setTimeout(this.scheduleNext, (60 / track.tempo) * 1000);
  }
}
