// Both playback paths use the same pitched string waveform and stroke timing.
export function stringSamples(midi: number, sampleRate: number) {
  const frequency = 440 * 2 ** ((midi - 69) / 12);
  const data = new Float32Array(Math.ceil(sampleRate * 3.2));
  const harmonics = Math.min(12, Math.floor((sampleRate * 0.45) / frequency));
  for (let h = 1; h <= harmonics; h++) {
    const strength = h === 1 ? 1 : Math.sin(h * Math.PI * 0.22) / (h * 1.5);
    const decay = 1.15 + h * 0.55;
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      data[i] +=
        strength *
        Math.sin(2 * Math.PI * frequency * h * t) *
        Math.exp(-decay * t);
    }
  }
  let peak = 0;
  for (const sample of data) peak = Math.max(peak, Math.abs(sample));
  for (let i = 0; i < data.length; i++) {
    data[i] =
      (data[i] / Math.max(1, peak)) * Math.min(1, i / sampleRate / 0.003);
  }
  return data;
}

export function noteDuration(
  groups: number[][],
  group: number[],
  step: number,
) {
  return groups.length === 1 ? (group.length > 1 ? 2.8 : 2) : step * 0.92;
}

export function renderWave(
  groups: number[][],
  bpm: number,
  volume: number,
  samples: Map<number, Float32Array>,
) {
  const sampleRate = 44100;
  const step = 60 / bpm;
  const end = Math.max(
    0,
    ...groups.map(
      (group, i) =>
        i * step +
        Math.max(0, group.length - 1) * 0.014 +
        noteDuration(groups, group, step),
    ),
  );
  const mix = new Float32Array(Math.ceil(end * sampleRate));
  groups.forEach((group, i) => {
    [...group]
      .sort((a, b) => a - b)
      .forEach((midi, voice) => {
        let data = samples.get(midi);
        if (!data) {
          data = stringSamples(midi, sampleRate);
          samples.set(midi, data);
        }
        const offset = Math.round((i * step + voice * 0.014) * sampleRate);
        const duration = noteDuration(groups, group, step);
        const length = Math.ceil(duration * sampleRate);
        const level = (volume * 0.65) / Math.max(1, group.length);
        for (
          let j = 0;
          j < length && j < data.length && offset + j < mix.length;
          j++
        ) {
          const fade = Math.min(
            1,
            Math.max(0, (duration - j / sampleRate) / 0.06),
          );
          mix[offset + j] += data[j] * level * fade;
        }
      });
  });
  const wave = new ArrayBuffer(44 + mix.length * 2);
  const view = new DataView(wave);
  const text = (at: number, value: string) => {
    for (let i = 0; i < value.length; i++)
      view.setUint8(at + i, value.charCodeAt(i));
  };
  text(0, "RIFF");
  view.setUint32(4, wave.byteLength - 8, true);
  text(8, "WAVE");
  text(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, "data");
  view.setUint32(40, mix.length * 2, true);
  for (let i = 0; i < mix.length; i++)
    view.setInt16(
      44 + i * 2,
      Math.round(Math.max(-1, Math.min(1, mix[i])) * 32767),
      true,
    );
  return wave;
}

export function usesMediaPlayback(userAgent: string) {
  // Safari on Mac and WebKit browsers on iOS can have a running yet silent
  // AudioContext. Native media playback uses their supported media output path.
  return (
    /AppleWebKit/.test(userAgent) &&
    !/Chrome\/|Chromium\/|Edg\/|OPR\/|Android/.test(userAgent)
  );
}
