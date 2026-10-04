import { describe, expect, it } from "vitest";
import { renderWave, usesMediaPlayback } from "../src/audio-render";

function readWave(groups: number[][], bpm = 80, volume = 0.55) {
  const view = new DataView(renderWave(groups, bpm, volume, new Map()));
  const samples = Array.from(
    { length: (view.byteLength - 44) / 2 },
    (_, i) => view.getInt16(44 + i * 2, true) / 32767,
  );
  return { view, samples };
}

describe("native media waveform", () => {
  it("encodes playable PCM with E major pitches and sustained sound", () => {
    const { view, samples } = readWave([[52, 56, 59]]);
    expect(view.getUint32(24, true)).toBe(44100);
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint16(34, true)).toBe(16);
    expect(view.getUint32(40, true)).toBe(samples.length * 2);
    expect(samples.length / 44100).toBeCloseTo(2.828, 4);
    for (const midi of [52, 56, 59]) {
      const frequency = 440 * 2 ** ((midi - 69) / 12);
      let real = 0,
        imaginary = 0;
      for (let i = 4410; i < 13230; i++) {
        real += samples[i] * Math.cos((2 * Math.PI * frequency * i) / 44100);
        imaginary +=
          samples[i] * Math.sin((2 * Math.PI * frequency * i) / 44100);
      }
      expect((2 * Math.hypot(real, imaginary)) / 8820).toBeGreaterThan(0.015);
    }
    expect(
      samples.slice(44100, 48510).reduce((s, v) => s + v * v, 0),
    ).toBeGreaterThan(0.1);
    expect(samples.every(Number.isFinite)).toBe(true);
  });
  it("keeps arpeggios in sequence and applies volume in the encoded audio", () => {
    const { samples } = readWave([[52], [56], [59]], 120);
    expect(samples.length / 44100).toBeCloseTo(1.46, 4);
    expect(
      samples
        .slice(Math.ceil(0.46 * 44100), Math.floor(0.5 * 44100))
        .every((v) => v === 0),
    ).toBe(true);
    expect(readWave([[65]], 80, 0).samples.every((v) => v === 0)).toBe(true);
    expect(Math.abs(samples.at(-1)!)).toBeLessThanOrEqual(1 / 32767);
  });
  it("selects native media for Mac Safari and iOS WebKit, and Web Audio for desktop Chrome", () => {
    expect(
      usesMediaPlayback(
        "Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 Version/27.0 Safari/605.1.15",
      ),
    ).toBe(true);
    expect(
      usesMediaPlayback(
        "Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 CriOS/140 Mobile/15E148 Safari/604.1",
      ),
    ).toBe(true);
    expect(
      usesMediaPlayback(
        "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/140 Safari/537.36",
      ),
    ).toBe(false);
    expect(
      usesMediaPlayback(
        "Mozilla/5.0 (Android) AppleWebKit/537.36 Chrome/140 Safari/537.36",
      ),
    ).toBe(false);
    expect(
      usesMediaPlayback("Mozilla/5.0 (Macintosh) Gecko/20100101 Firefox/140.0"),
    ).toBe(false);
  });
});
