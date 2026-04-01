import type { Team } from '../../types/game';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

type LegacyWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

class WebAudioSfx {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted = false;

  setMuted(muted: boolean) {
    this.muted = muted;

    if (!this.masterGain || !this.audioContext) {
      return;
    }

    this.masterGain.gain.cancelScheduledValues(this.audioContext.currentTime);
    this.masterGain.gain.setValueAtTime(muted ? 0 : 1, this.audioContext.currentTime);
  }

  playShot(intensity: number) {
    const context = this.prepareContext();
    if (!context || this.muted) {
      return;
    }

    const normalizedIntensity = clamp(intensity, 0, 1);
    const startTime = context.currentTime;
    const duration = 0.12 + normalizedIntensity * 0.06;

    this.playTone({
      context,
      frequency: 160 + normalizedIntensity * 160,
      startTime,
      duration,
      gain: 0.038 + normalizedIntensity * 0.03,
      type: 'triangle',
      attack: 0.002,
      endFrequency: 110,
    });

    this.playTone({
      context,
      frequency: 520 + normalizedIntensity * 280,
      startTime: startTime + 0.012,
      duration: 0.05,
      gain: 0.012 + normalizedIntensity * 0.008,
      type: 'square',
      attack: 0.001,
      endFrequency: 220,
    });
  }

  playGoal(scoringTeam: Team) {
    const context = this.prepareContext();
    if (!context || this.muted) {
      return;
    }

    const frequencies =
      scoringTeam === 'player'
        ? [523.25, 659.25, 783.99]
        : [349.23, 293.66, 246.94];

    frequencies.forEach((frequency, index) => {
      const startTime = context.currentTime + index * 0.085;

      this.playTone({
        context,
        frequency,
        startTime,
        duration: 0.2,
        gain: scoringTeam === 'player' ? 0.048 : 0.038,
        type: scoringTeam === 'player' ? 'sine' : 'triangle',
        attack: 0.008,
        endFrequency: scoringTeam === 'player' ? frequency * 1.06 : frequency * 0.92,
      });
    });
  }

  private prepareContext() {
    const context = this.getAudioContext();
    if (!context) {
      return null;
    }

    if (context.state === 'suspended') {
      void context.resume().catch(() => undefined);
    }

    return context;
  }

  private getAudioContext() {
    if (typeof window === 'undefined') {
      return null;
    }

    if (this.audioContext) {
      return this.audioContext;
    }

    const AudioContextCtor =
      window.AudioContext ?? (window as LegacyWindow).webkitAudioContext;

    if (!AudioContextCtor) {
      return null;
    }

    const context = new AudioContextCtor();
    const masterGain = context.createGain();

    masterGain.gain.setValueAtTime(this.muted ? 0 : 1, context.currentTime);
    masterGain.connect(context.destination);

    this.audioContext = context;
    this.masterGain = masterGain;

    return context;
  }

  private playTone({
    context,
    frequency,
    startTime,
    duration,
    gain,
    type,
    attack,
    endFrequency,
  }: {
    context: AudioContext;
    frequency: number;
    startTime: number;
    duration: number;
    gain: number;
    type: OscillatorType;
    attack: number;
    endFrequency: number;
  }) {
    if (!this.masterGain) {
      return;
    }

    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const endTime = startTime + duration;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(endFrequency, 40),
      endTime,
    );

    envelope.gain.setValueAtTime(0.0001, startTime);
    envelope.gain.exponentialRampToValueAtTime(gain, startTime + attack);
    envelope.gain.exponentialRampToValueAtTime(0.0001, endTime);

    oscillator.connect(envelope);
    envelope.connect(this.masterGain);

    oscillator.start(startTime);
    oscillator.stop(endTime);

    oscillator.addEventListener(
      'ended',
      () => {
        oscillator.disconnect();
        envelope.disconnect();
      },
      { once: true },
    );
  }
}

export const webAudioSfx = new WebAudioSfx();
