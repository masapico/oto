export type Tone = { midi: number; name: string; degree: string };
export type Formula = {
  id: string;
  label: string;
  degrees: string[];
  description: string;
  group?: string;
  modeDegree?: number;
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
      "メジャー三和音に長7度を加えます。7thはルートの11半音上で、1オクターブ上のルートとは半音で隣り合います。",
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
  {
    id: "augMaj7",
    label: "メジャー7th ♯5",
    degrees: ["1", "3", "♯5", "7"],
    description:
      "オーギュメント三和音に長7度を加えます。ハーモニック／メロディックマイナーの第3音上にも現れます。",
  },
];
export const chordSuffix: Record<string, string> = {
  maj: "",
  min: "m",
  dim: "dim",
  aug: "aug",
  maj7: "maj7",
  "7": "7",
  m7: "m7",
  mMaj7: "m(maj7)",
  m7b5: "m7♭5",
  dim7: "dim7",
  augMaj7: "maj7♯5",
};
export const scaleGroups = [
  "メジャー系のモード",
  "マイナー系のモード",
  "その他のマイナー",
  "ペンタトニック／ブルース",
];
export const scales: Formula[] = [
  {
    id: "major",
    label: "メジャー（イオニアン）",
    group: scaleGroups[0],
    modeDegree: 1,
    degrees: ["1", "2", "3", "4", "5", "6", "7"],
    description: "全・全・半・全・全・全・半。3–4度と7–8度が半音です。",
  },
  {
    id: "natural",
    label: "ナチュラルマイナー（エオリアン）",
    group: scaleGroups[1],
    modeDegree: 6,
    degrees: ["1", "2", "♭3", "4", "5", "♭6", "♭7"],
    description: "自然短音階。メジャーに対して3・6・7度が半音低くなります。",
  },
  {
    id: "harmonic",
    group: scaleGroups[2],
    label: "ハーモニックマイナー",
    degrees: ["1", "2", "♭3", "4", "5", "♭6", "7"],
    description: "自然短音階の7度を半音上げます。♭6–7の間は3半音です。",
  },
  {
    id: "melodic",
    group: scaleGroups[2],
    label: "メロディックマイナー",
    degrees: ["1", "2", "♭3", "4", "5", "6", "7"],
    description:
      "上行は自然短音階の6・7度を上げます。クラシック式の下行は自然短音階、ジャズ式は上下同形です。",
  },
  {
    id: "majorPent",
    group: scaleGroups[3],
    label: "メジャーペンタトニック",
    degrees: ["1", "2", "3", "5", "6"],
    description: "メジャースケールから4・7度を除いた5音のスケールです。",
  },
  {
    id: "minorPent",
    group: scaleGroups[3],
    label: "マイナーペンタトニック",
    degrees: ["1", "♭3", "4", "5", "♭7"],
    description: "ルート・短3度・4度・5度・短7度からなる5音のスケールです。",
  },
  {
    id: "blues",
    group: scaleGroups[3],
    label: "ブルース",
    degrees: ["1", "♭3", "4", "♭5", "5", "♭7"],
    description:
      "マイナーペンタトニックに♭5を加えた6音。4–♭5–5の動きを聴いてみましょう。",
  },
  {
    id: "dorian",
    label: "ドリアン",
    group: scaleGroups[1],
    modeDegree: 2,
    degrees: ["1", "2", "♭3", "4", "5", "6", "♭7"],
    description:
      "ナチュラルマイナーの♭6を半音上げたモード。短3度と長6度の組み合わせが特徴です。",
  },
  {
    id: "phrygian",
    label: "フリジアン",
    group: scaleGroups[1],
    modeDegree: 3,
    degrees: ["1", "♭2", "♭3", "4", "5", "♭6", "♭7"],
    description:
      "ナチュラルマイナーの2度を半音下げたモード。ルートと♭2の半音に注目しましょう。",
  },
  {
    id: "lydian",
    label: "リディアン",
    group: scaleGroups[0],
    modeDegree: 4,
    degrees: ["1", "2", "3", "♯4", "5", "6", "7"],
    description:
      "メジャーの4度を半音上げたモード。ルートと♯4の距離が特徴です。",
  },
  {
    id: "mixolydian",
    label: "ミクソリディアン",
    group: scaleGroups[0],
    modeDegree: 5,
    degrees: ["1", "2", "3", "4", "5", "6", "♭7"],
    description:
      "メジャーの7度を半音下げたモード。長3度と短7度の組み合わせを聴きましょう。",
  },
  {
    id: "locrian",
    label: "ロクリアン",
    group: scaleGroups[1],
    modeDegree: 7,
    degrees: ["1", "♭2", "♭3", "4", "♭5", "♭6", "♭7"],
    description:
      "ナチュラルマイナーの2・5度を半音下げたモード。♭2と♭5が特徴で、主音上に減三和音ができます。",
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
  const degrees = displayedScale(formula, down, classic).degrees;
  const result = tones(root, [...degrees, "8"]);
  return down ? result.reverse() : result;
}
export function displayedScale(
  formula: Formula,
  down: boolean,
  classic: boolean,
) {
  return formula.id === "melodic" && classic && down ? scales[1] : formula;
}
export function parentMajor(root: string, formula: Formula) {
  if (!formula.modeDegree) return undefined;
  return spell(root, formula.degrees[(8 - formula.modeDegree) % 7]);
}
export function compareTones(a: Tone[], b: Tone[]) {
  return a.map((t) => ({
    ...t,
    common: b.some((other) => mod(other.midi) === mod(t.midi)),
  }));
}
export function diatonic(
  root: string,
  seventh: boolean,
  formula: Formula = scales[0],
) {
  if (formula.degrees.length !== 7) return [];
  const base = tones(root, formula.degrees);
  return base.map((t, i) => {
    const stacked = Array.from({ length: seventh ? 4 : 3 }, (_, j) => {
      const index = i + j * 2;
      return base[index % 7].midi + 12 * Math.floor(index / 7) - t.midi;
    });
    const chord = chords.find(
      (c) =>
        c.degrees.length === stacked.length &&
        c.degrees.every((d, j) => interval(d) === stacked[j]),
    );
    if (!chord) throw new Error("Unsupported diatonic chord");
    return { root: t.name, formula: chord };
  });
}
