export type Tone = { midi: number; name: string; degree: string };
export type Formula = {
  id: string;
  label: string;
  degrees: string[];
  description: string;
};
export const roots = [
  "C",
  "C♯",
  "D♭",
  "D",
  "E♭",
  "E",
  "F",
  "F♯",
  "G♭",
  "G",
  "A♭",
  "A",
  "B♭",
  "B",
];
export const chords: Formula[] = [
  {
    id: "maj",
    label: "メジャー",
    degrees: ["1", "3", "5"],
    description:
      "明るい響きの三和音。ルートから長3度、その上に短3度を重ねます。",
  },
  {
    id: "min",
    label: "マイナー",
    degrees: ["1", "♭3", "5"],
    description:
      "メジャーの3rdを半音下げた三和音。3rdが響きの性格を大きく変えます。",
  },
  {
    id: "dim",
    label: "ディミニッシュ",
    degrees: ["1", "♭3", "♭5"],
    description:
      "短3度を2つ重ねた三和音。5thも半音低く、緊張感のある響きです。",
  },
  {
    id: "aug",
    label: "オーギュメント",
    degrees: ["1", "3", "♯5"],
    description:
      "長3度を2つ重ねた三和音。5thを半音上げた響きを確かめましょう。",
  },
  {
    id: "maj7",
    label: "メジャー7th",
    degrees: ["1", "3", "5", "7"],
    description:
      "メジャー三和音に長7度を加えます。ルートと7thは半音で隣り合います。",
  },
  {
    id: "7",
    label: "ドミナント7th",
    degrees: ["1", "3", "5", "♭7"],
    description:
      "メジャー三和音に短7度を加えます。maj7との違いは7thの高さです。",
  },
  {
    id: "m7",
    label: "マイナー7th",
    degrees: ["1", "♭3", "5", "♭7"],
    description:
      "マイナー三和音に短7度を加えた和音。3rdと7thの位置に注目しましょう。",
  },
  {
    id: "mMaj7",
    label: "マイナーメジャー7th",
    degrees: ["1", "♭3", "5", "7"],
    description: "マイナー三和音に長7度。暗さと緊張感が同居する響きです。",
  },
  {
    id: "m7b5",
    label: "ハーフディミニッシュ",
    degrees: ["1", "♭3", "♭5", "♭7"],
    description:
      "ディミニッシュ三和音に短7度を加えます。dim7と7thを聴き比べてみましょう。",
  },
  {
    id: "dim7",
    label: "ディミニッシュ7th",
    degrees: ["1", "♭3", "♭5", "♭♭7"],
    description:
      "短3度を3つ重ねます。減7度は長7度より2半音低く、理論上は♭♭7と表します。",
  },
];
export const scales: Formula[] = [
  {
    id: "major",
    label: "メジャー",
    degrees: ["1", "2", "3", "4", "5", "6", "7"],
    description: "全・全・半・全・全・全・半。3–4度と7–8度が半音です。",
  },
  {
    id: "natural",
    label: "ナチュラルマイナー",
    degrees: ["1", "2", "♭3", "4", "5", "♭6", "♭7"],
    description: "自然短音階。メジャーに対して3・6・7度が半音低くなります。",
  },
  {
    id: "harmonic",
    label: "ハーモニックマイナー",
    degrees: ["1", "2", "♭3", "4", "5", "♭6", "7"],
    description: "自然短音階の7度を半音上げます。♭6–7の間は3半音です。",
  },
  {
    id: "melodic",
    label: "メロディックマイナー",
    degrees: ["1", "2", "♭3", "4", "5", "6", "7"],
    description:
      "上行は自然短音階の6・7度を上げます。クラシック式の下行は自然短音階、ジャズ式は上下同形です。",
  },
  {
    id: "majorPent",
    label: "メジャーペンタトニック",
    degrees: ["1", "2", "3", "5", "6"],
    description: "メジャースケールから4・7度を除いた5音のスケールです。",
  },
  {
    id: "minorPent",
    label: "マイナーペンタトニック",
    degrees: ["1", "♭3", "4", "5", "♭7"],
    description: "ルート・短3度・4度・5度・短7度からなる5音のスケールです。",
  },
  {
    id: "blues",
    label: "ブルース",
    degrees: ["1", "♭3", "4", "♭5", "5", "♭7"],
    description:
      "マイナーペンタトニックに♭5を加えた6音。4–♭5–5の動きを聴いてみましょう。",
  },
];
const letters = ["C", "D", "E", "F", "G", "A", "B"];
const naturals = [0, 2, 4, 5, 7, 9, 11];
export const mod = (n: number, d = 12) => ((n % d) + d) % d;
export function pc(name: string) {
  return mod(
    naturals[letters.indexOf(name[0])] +
      [...name.slice(1)].reduce(
        (n, c) => n + (c === "♯" ? 1 : c === "♭" ? -1 : 0),
        0,
      ),
  );
}
export function interval(degree: string) {
  const d = Number(degree.match(/\d+/)?.[0] || 1);
  return (
    naturals[(d - 1) % 7] +
    12 * Math.floor((d - 1) / 7) +
    [...degree].reduce((n, c) => n + (c === "♯" ? 1 : c === "♭" ? -1 : 0), 0)
  );
}
export function spell(root: string, degree: string) {
  const index = mod(
    letters.indexOf(root[0]) + Number(degree.match(/\d+/)?.[0] || 1) - 1,
    7,
  );
  let delta = mod(pc(root) + interval(degree) - naturals[index]);
  if (delta > 6) delta -= 12;
  return letters[index] + (delta < 0 ? "♭".repeat(-delta) : "♯".repeat(delta));
}
export function tones(root: string, degrees: string[], base = 48): Tone[] {
  return degrees.map((degree) => ({
    name: spell(root, degree),
    degree,
    midi: base + pc(root) + interval(degree),
  }));
}
export function invert(input: Tone[], inversion: number) {
  const result = input.map((t) => ({ ...t }));
  for (let i = 0; i < inversion; i++) {
    const t = result.shift()!;
    result.push({ ...t, midi: t.midi + 12 });
  }
  return result;
}
export function noteName(midi: number, flat = false) {
  return (
    flat
      ? ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"]
      : ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"]
  )[mod(midi)];
}
export function octave(tone: Tone, written = false) {
  const accidental = [...tone.name.slice(1)].reduce(
    (n, c) => n + (c === "♯" ? 1 : -1),
    0,
  );
  return Math.floor((tone.midi + (written ? 12 : 0) - accidental) / 12) - 1;
}
export const degreeLabel = (d: string) => (d === "1" || d === "8" ? "R" : d);
export function color(d: string) {
  const n = d === "8" ? "1" : d.replace(/[♭♯]/g, "");
  return (
    (
      {
        "1": "#be593b",
        "3": "#3877af",
        "5": "#438067",
        "7": "#855da6",
        "2": "#a37a21",
        "4": "#398790",
        "6": "#a1637d",
      } as Record<string, string>
    )[n] || "#7b817c"
  );
}
export const tuning = [64, 59, 55, 50, 45, 40];
export function scalePath(
  root: string,
  formula: Formula,
  down: boolean,
  classic: boolean,
) {
  const degrees =
    formula.id === "melodic" && classic && down
      ? scales[1].degrees
      : formula.degrees;
  const result = tones(root, [...degrees, "8"]);
  return down ? result.reverse() : result;
}
export function diatonic(root: string, seventh: boolean) {
  const base = tones(root, scales[0].degrees);
  return base.map((t, i) => ({
    root: t.name,
    formula: chords.find(
      (c) =>
        c.id ===
        (seventh
          ? ["maj7", "m7", "m7", "maj7", "7", "m7", "m7b5"]
          : ["maj", "min", "min", "maj", "maj", "min", "dim"])[i],
    )!,
  }));
}
