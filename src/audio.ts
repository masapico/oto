import {
  noteDuration,
  renderWave,
  stringSamples,
  usesMediaPlayback,
} from "./audio-render";

export class Player {
  private context?: AudioContext;
  private voices: AudioBufferSourceNode[] = [];
  private samples = new Map<number, AudioBuffer>();
  private timers: ReturnType<typeof setTimeout>[] = [];
  private generation = 0;
  private media?: HTMLAudioElement;
  private mediaUrl?: string;
  private mediaSamples = new Map<number, Float32Array>();
  // A plucked string: bright attack, faster decay of upper harmonics,
  // and a stable fundamental so chord tones stay easy to identify.
  private stringSample(ctx: AudioContext, midi: number) {
    const cached = this.samples.get(midi);
    if (cached) return cached;
    const buffer = ctx.createBuffer(
      1,
      Math.ceil(ctx.sampleRate * 3.2),
      ctx.sampleRate,
    );
    buffer.copyToChannel(stringSamples(midi, ctx.sampleRate), 0);
    this.samples.set(midi, buffer);
    return buffer;
  }
  stop() {
    this.generation++;
    this.timers.forEach(clearTimeout);
    this.timers = [];
    if (this.media) {
      this.media.onended = null;
      this.media.pause();
      this.media.removeAttribute("src");
      this.media.load();
    }
    if (this.mediaUrl) {
      URL.revokeObjectURL(this.mediaUrl);
      this.mediaUrl = undefined;
    }
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
    // iOS otherwise treats Web Audio as ambient audio and mutes it with the
    // ring/silent switch. Request media playback within the user gesture.
    const session = (
      navigator as Navigator & {
        audioSession?: { type: string };
      }
    ).audioSession;
    if (session) {
      try {
        session.type = "playback";
      } catch {
        // Unsupported session settings must not prevent normal Web Audio.
      }
    }
    if (usesMediaPlayback(navigator.userAgent)) {
      const wave = renderWave(groups, bpm, volume, this.mediaSamples);
      const media = (this.media ??= new Audio());
      this.mediaUrl = URL.createObjectURL(
        new Blob([wave], { type: "audio/wav" }),
      );
      media.src = this.mediaUrl;
      media.onended = () => {
        if (generation !== this.generation) return;
        this.stop();
        onActive([]);
        onEnd();
      };
      // Call play synchronously in the click handler: Safari's media playback
      // permission must be acquired before any await or timer.
      try {
        await media.play();
      } catch (error) {
        if (generation !== this.generation) return;
        this.stop();
        throw error;
      }
      if (generation !== this.generation) return;
      let activeGroup = -1;
      const update = () => {
        if (generation !== this.generation) return;
        const index = Math.min(
          groups.length - 1,
          Math.floor(media.currentTime / (60 / bpm)),
        );
        if (index !== activeGroup) {
          activeGroup = index;
          onActive(groups[index] ?? []);
        }
        // Follow the media clock so buffering cannot make highlights run ahead.
        this.timers = [setTimeout(update, 30)];
      };
      update();
      return;
    }
    if (!this.context || this.context.state === "closed") {
      this.context = new AudioContext();
      this.samples.clear();
    }
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
        const duration = noteDuration(groups, group, step);
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
