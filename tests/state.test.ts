import { describe, it, expect } from "vitest";
import { readState, stateHash } from "../src/state";
describe("bookmark state", () => {
  it("round trips musical context and selected pitch", () => {
    const s = readState(
      "#view=notes&root=G♭&chord=m7b5&scale=harmonic&from=8&to=19&inv=3&melodic=jazz&pitch=42",
    );
    expect(readState("#" + stateHash(s))).toEqual(s);
    expect(s.pitch).toBe(42);
  });
  it("clamps invalid ranges and inversion safely", () => {
    const s = readState("#view=oops&root=oops&from=21&to=0&inv=3&pitch=999");
    expect(s).toMatchObject({
      mode: "chords",
      root: "C",
      start: 21,
      end: 22,
      inversion: 2,
      pitch: 60,
    });
  });
});
