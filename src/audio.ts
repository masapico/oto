export class Player {
  private context?: AudioContext;
  private voices: AudioBufferSourceNode[] = [];
  private samples = new Map<number, AudioBuffer>();
  private timers: ReturnType<typeof setTimeout>[] = [];
  private generation = 0;
  // A plucked string: bright attack, faster decay of upper harmonics,
  // and a stable fundamental so chord tones stay easy to identify.
  private stringSample(ctx: AudioContext, midi: number) {
    const cached = this.samples.get(midi);
    if (cached) return cached;
    const frequency = 440 * 2 ** ((midi - 69) / 12);
    const buffer = ctx.createBuffer(
      1,
      Math.ceil(ctx.sampleRate * 3.2),
      ctx.sampleRate,
    );
    const data = buffer.getChannelData(0);
    const harmonics = Math.min(
      12,
      Math.floor((ctx.sampleRate * 0.45) / frequency),
    );
    for (let h = 1; h <= harmonics; h++) {
      const strength = h === 1 ? 1 : Math.sin(h * Math.PI * 0.22) / (h * 1.5);
      const decay = 1.15 + h * 0.55;
      for (let i = 0; i < data.length; i++) {
        const t = i / ctx.sampleRate;
        data[i] +=
          strength *
          Math.sin(2 * Math.PI * frequency * h * t) *
          Math.exp(-decay * t);
      }
    }
    let peak = 0;
    for (let i = 0; i < data.length; i++)
      peak = Math.max(peak, Math.abs(data[i]));
    for (let i = 0; i < data.length; i++) {
      const t = i / ctx.sampleRate;
      data[i] = (data[i] / Math.max(1, peak)) * Math.min(1, t / 0.003);
    }
    this.samples.set(midi, buffer);
    return buffer;
  }
  stop() {
    this.generation++;
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.voices.forEach((v) => {
      try {
        v.stop();
      } catch {
        /* already ended */
      }
    });
    this.voices = [];
  }
  async play(
    groups: number[][],
    bpm: number,
    volume: number,
    onActive: (midi: number[]) => void,
    onEnd: () => void,
  ) {
    this.stop();
    const generation = this.generation;
    this.context ??= new AudioContext();
    await this.context.resume();
    if (generation !== this.generation) return;
    const ctx = this.context;
    // Generate uncached notes before choosing the start time, so the first
    // chord keeps its stroke timing even on slower devices.
    for (const midi of new Set(groups.flat())) this.stringSample(ctx, midi);
    const step = 60 / bpm;
    const start = ctx.currentTime + 0.035;
    let endsAt = start;
    groups.forEach((group, i) => {
      // Low-to-high strokes separate the attacks without changing the voicing.
      const pitches = [...group].sort((a, b) => a - b);
      pitches.forEach((midi, voice) => {
        const osc = ctx.createBufferSource();
        osc.buffer = this.stringSample(ctx, midi);
        const gain = ctx.createGain();
        const at = start + i * step + voice * 0.014;
        const duration =
          groups.length === 1 ? (group.length > 1 ? 2.8 : 2) : step * 0.92;
        const level = (volume * 0.65) / Math.max(1, group.length);
        gain.gain.setValueAtTime(level, at);
        gain.gain.setValueAtTime(level, at + Math.max(0, duration - 0.06));
        gain.gain.linearRampToValueAtTime(0, at + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(at);
        osc.stop(at + duration);
        endsAt = Math.max(endsAt, at + duration);
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
          this.voices = this.voices.filter((v) => v !== osc);
        };
        this.voices.push(osc);
      });
      this.timers.push(
        setTimeout(() => onActive(group), (i * step + 0.035) * 1000),
      );
    });
    this.timers.push(
      setTimeout(
        () => {
          onActive([]);
          onEnd();
        },
        (endsAt - ctx.currentTime + 0.02) * 1000,
      ),
    );
  }
}
