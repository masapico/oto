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
  roots,
  interval,
  parentMajor,
  compareTones,
  displayedScale,
  chordSuffix,
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

describe("scale expansion and harmonization", () => {
  it("covers seven modes with distinct formulas and preserves their parent collection", () => {
    const expected: Record<string, number[]> = {
      major: [0, 2, 4, 5, 7, 9, 11],
      dorian: [0, 2, 3, 5, 7, 9, 10],
      phrygian: [0, 1, 3, 5, 7, 8, 10],
      lydian: [0, 2, 4, 6, 7, 9, 11],
      mixolydian: [0, 2, 4, 5, 7, 9, 10],
      natural: [0, 2, 3, 5, 7, 8, 10],
      locrian: [0, 1, 3, 5, 6, 8, 10],
    };
    expect(scales).toHaveLength(12);
    expect(new Set(scales.map((s) => s.degrees.join(","))).size).toBe(12);
    for (const [id, semitones] of Object.entries(expected)) {
      const scale = scales.find((s) => s.id === id)!;
      expect(scale.degrees.map(interval)).toEqual(semitones);
      for (const root of roots) {
        const parent = parentMajor(root, scale)!;
        expect(
          tones(root, scale.degrees)
            .map((t) => t.name)
            .sort(),
        ).toEqual(
          tones(parent, scales[0].degrees)
            .map((t) => t.name)
            .sort(),
        );
      }
    }
    expect(
      parentMajor(
        "D",
        scales.find((s) => s.id === "dorian")!,
      ),
    ).toBe("C");
    expect(
      parentMajor(
        "G♭",
        scales.find((s) => s.id === "mixolydian")!,
      ),
    ).toBe("C♭");
  });
  it("identifies the natural minor / Dorian difference by pitch, including enharmonics", () => {
    const a = tones("C", scales.find((s) => s.id === "dorian")!.degrees);
    const b = tones("C", scales[1].degrees);
    expect(
      compareTones(a, b)
        .filter((t) => !t.common)
        .map((t) => t.name),
    ).toEqual(["A"]);
    expect(
      compareTones(b, a)
        .filter((t) => !t.common)
        .map((t) => t.name),
    ).toEqual(["A♭"]);
    expect(compareTones(tones("C♯", ["1"]), tones("D♭", ["1"]))[0].common).toBe(
      true,
    );
  });
  it("generates harmonic minor chords and keeps all chord tones inside every seven-note scale", () => {
    const h = diatonic(
      "A",
      true,
      scales.find((s) => s.id === "harmonic")!,
    );
    expect(h.map((c) => `${c.root}${chordSuffix[c.formula.id]}`)).toEqual([
      "Am(maj7)",
      "Bm7♭5",
      "Cmaj7♯5",
      "Dm7",
      "E7",
      "Fmaj7",
      "G♯dim7",
    ]);
    for (const root of roots)
      for (const scale of scales.filter((s) => s.degrees.length === 7)) {
        const collection = tones(root, scale.degrees).map((t) => mod(t.midi));
        for (const seventh of [false, true]) {
          const result = diatonic(root, seventh, scale);
          expect(result).toHaveLength(7);
          for (const chord of result) {
            expect(
              tones(chord.root, chord.formula.degrees).every((t) =>
                collection.includes(mod(t.midi)),
              ),
            ).toBe(true);
          }
        }
      }
    expect(
      diatonic(
        "C",
        true,
        scales.find((s) => s.id === "blues")!,
      ),
    ).toEqual([]);
  });
  it("harmonizes the displayed melodic minor descent and retains raised sixth/seventh in jazz", () => {
    const melodic = scales.find((s) => s.id === "melodic")!;
    expect(
      diatonic("A", true, displayedScale(melodic, true, true))[4].formula.id,
    ).toBe("m7");
    expect(
      diatonic("A", true, displayedScale(melodic, true, false))[4].formula.id,
    ).toBe("7");
  });
});
