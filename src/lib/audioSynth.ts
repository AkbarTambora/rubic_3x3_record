/**
 * High-Precision Web Audio API Synthesizer (Singleton)
 * Eliminates garbage collection latency and audio context spam
 */

class AudioSynthService {
  private ctx: AudioContext | null = null;
  private isUnlocked: boolean = false;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended' && this.isUnlocked) {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public unlock() {
    if (this.isUnlocked) return;
    const ctx = this.getContext();
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      this.isUnlocked = true;
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, gainVal = 0.15) {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Ignore audio failure
    }
  }

  public playReady() {
    this.playTone(880, 'sine', 0.12, 0.2); // Crisp high tone
  }

  public playInspection8s() {
    this.playTone(587.33, 'triangle', 0.25, 0.25); // D5 warning
  }

  public playInspection12s() {
    this.playTone(783.99, 'sawtooth', 0.35, 0.3); // G5 urgent warning
  }

  public playPenaltyTone() {
    this.playTone(220, 'square', 0.4, 0.25); // Low buzz
  }

  public playFinishChime() {
    this.playTone(659.25, 'sine', 0.15, 0.15);
    setTimeout(() => {
      this.playTone(880, 'sine', 0.2, 0.2);
    }, 80);
  }
}

export const AudioSynth = new AudioSynthService();
