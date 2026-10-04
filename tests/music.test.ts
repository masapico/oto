import { describe, it, expect } from "vitest";
import {
  tones,
  pc,
  spell,
  invert,
  chords,
  scales,
  scalePath,
  diatonic,
  octave,
  tuning,
  mod,
} from "../src/music";
describe("music reference", () => {
  it("distinguishes major/minor thirds and sevenths", () => {
    expect(
      tones("C", chords.find((c) => c.id === "maj7")!.degrees).map(
        (t) => t.name,
      ),
    ).toEqual(["C", "E", "G", "B"]);
    expect(
      tones("C", chords.find((c) => c.id === "7")!.degrees).map((t) => t.name),
    ).toEqual(["C", "E", "G", "B♭"]);
    expect(
      tones("C", chords.find((c) => c.id === "m7")!.degrees).map((t) => t.midi),
    ).toEqual([48, 51, 55, 58]);
  });
  it("preserves enharmonic spelling, including double flats", () => {
    expect(pc("C♯")).toBe(pc("D♭"));
    expect(spell("C♯", "3")).toBe("E♯");
    expect(spell("G♭", "4")).toBe("C♭");
    expect(spell("C", "♭♭7")).toBe("B♭♭");
    expect(spell("B", "♯5")).toBe("F♯♯");
  });
  it("rotates voices without changing their role", () => {
    const c = tones("C", ["1", "3", "5"]);
    expect(invert(c, 1).map((t) => t.midi)).toEqual([52, 55, 60]);
    expect(invert(c, 2).map((t) => t.degree)).toEqual(["5", "1", "3"]);
    expect(c[0].midi).toBe(48);
  });
  it("uses the guitar written octave and correct accidental octaves", () => {
    const low = { midi: 40, name: "E", degree: "1" };
    expect(octave(low)).toBe(2);
    expect(octave(low, true)).toBe(3);
    expect(octave({ midi: 60, name: "B♯", degree: "1" })).toBe(3);
    expect(octave({ midi: 59, name: "C♭", degree: "1" })).toBe(4);
  });
  it("finds equivalent fingerboard pitches", () => {
    expect(tuning[0]).toBe(tuning[1] + 5);
    expect(mod(tuning[0])).toBe(mod(tuning[5]));
  });
  it("handles melodic minor descending styles", () => {
    const s = scales.find((s) => s.id === "melodic")!;
    expect(scalePath("A", s, true, true).map((t) => t.name)).toEqual([
      "A",
      "G",
      "F",
      "E",
      "D",
      "C",
      "B",
      "A",
    ]);
    expect(scalePath("A", s, true, false).map((t) => t.name)).toEqual([
      "A",
      "G♯",
      "F♯",
      "E",
      "D",
      "C",
      "B",
      "A",
    ]);
  });
  it("builds diatonic chords in major keys", () => {
    expect(diatonic("D♭", true).map((h) => h.root)).toEqual([
      "D♭",
      "E♭",
      "F",
      "G♭",
      "A♭",
      "B♭",
      "C",
    ]);
    expect(diatonic("C", true)[6].formula.id).toBe("m7b5");
  });
});
