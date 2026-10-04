import { roots, chords, scales } from "./music";
export type Mode = "notes" | "chords" | "scales" | "quiz";
export type State = {
  mode: Mode;
  root: string;
  chord: string;
  scale: string;
  start: number;
  end: number;
  inversion: number;
  classic: boolean;
  pitch: number;
};
export function readState(hash = location.hash): State {
  const p = new URLSearchParams(hash.replace(/^#\/?/, ""));
  const numeric = (key: string, fallback: number, max: number) => {
    const value = p.get(key);
    const n = value === null ? fallback : Number(value);
    return Number.isInteger(n) && n >= 0 && n <= max ? n : fallback;
  };
  const start = numeric("from", 0, 21),
    end = Math.max(start + 1, numeric("to", 5, 22));
  const chord = chords.find((c) => c.id === p.get("chord")) || chords[0];
  return {
    mode: ["notes", "chords", "scales", "quiz"].includes(p.get("view") || "")
      ? (p.get("view") as Mode)
      : "chords",
    root: roots.includes(p.get("root") || "") ? p.get("root")! : "C",
    chord: chord.id,
    scale: scales.find((s) => s.id === p.get("scale"))?.id || "major",
    start,
    end,
    inversion: Math.min(numeric("inv", 0, 3), chord.degrees.length - 1),
    classic: p.get("melodic") !== "jazz",
    pitch: Math.max(40, numeric("pitch", 60, 86)),
  };
}
export function stateHash(s: State) {
  return new URLSearchParams({
    view: s.mode,
    root: s.root,
    chord: s.chord,
    scale: s.scale,
    from: String(s.start),
    to: String(s.end),
    inv: String(s.inversion),
    melodic: s.classic ? "classic" : "jazz",
    pitch: String(s.pitch),
  }).toString();
}
