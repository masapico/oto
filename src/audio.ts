export class Player {
  private context?: AudioContext;
  private voices: OscillatorNode[] = [];
  private timers: ReturnType<typeof setTimeout>[] = [];
  private generation = 0;
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
    const step = 60 / bpm;
    const start = ctx.currentTime + 0.035;
    groups.forEach((group, i) => {
      group.forEach((midi) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = 440 * 2 ** ((midi - 69) / 12);
        const at = start + i * step;
        const duration = Math.min(step * 0.9, 1.6);
        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(
          (volume * 0.24) / Math.sqrt(group.length),
          at + 0.012,
        );
        gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(at);
        osc.stop(at + duration + 0.02);
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
        (groups.length * step + 0.05) * 1000,
      ),
    );
  }
}
