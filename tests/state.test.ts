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

describe("scale reference bookmarks", () => {
  it("restores comparison, descent, harmony degree and chord size", () => {
    const s = readState(
      "#view=scales&scale=dorian&compare=natural&direction=down&harmony=0&sevenths=0",
    );
    expect(s).toMatchObject({
      scale: "dorian",
      compareScale: "natural",
      descending: true,
      harmony: 0,
      sevenths: false,
    });
    expect(readState("#" + stateHash(s))).toEqual(s);
  });
  it("preserves legacy defaults and rejects invalid added fields", () => {
    for (const hash of [
      "#scale=major",
      "#compare=bad&direction=bad&harmony=99",
    ]) {
      const s = readState(hash);
      expect(s).toMatchObject({
        compareScale: "",
        descending: false,
        harmony: 7,
        sevenths: true,
      });
      expect(readState("#" + stateHash(s))).toEqual(s);
    }
  });
});
