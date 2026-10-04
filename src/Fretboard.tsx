import {
  color,
  degreeLabel,
  mod,
  noteName,
  octave,
  tuning,
  type Tone,
} from "./music";
type Props = {
  tones: Tone[];
  start: number;
  end: number;
  all: boolean;
  selected: number;
  active: number[];
  names: boolean;
  degrees: boolean;
  colored: boolean;
  solfege: boolean;
  onPlay: (tone: Tone) => void;
};
export default function Fretboard({
  tones,
  start,
  end,
  all,
  selected,
  active,
  names,
  degrees,
  colored,
  solfege,
  onPlay,
}: Props) {
  const frets = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  const width = Math.max(630, frets.length * 75 + 65);
  const hasOpenStrings = start === 0;
  const openWidth = 60;
  const boardLeft = hasOpenStrings ? 45 + openWidth : 45;
  const cell = (width - boardLeft - 10) / (hasOpenStrings ? end : frets.length);
  const fretLeft = (fret: number) =>
    fret === 0 ? 45 : boardLeft + cell * (fret - Math.max(start, 1));
  const fretWidth = (fret: number) => (fret === 0 ? openWidth : cell);
  const fretCenter = (fret: number) => fretLeft(fret) + fretWidth(fret) / 2;
  return (
    <div className="fret-scroll">
      <svg
        className="fretboard"
        viewBox={`0 0 ${width} 290`}
        style={{ minWidth: Math.max(570, frets.length * 52) }}
        role="group"
        aria-label="ギター指板。上が1弦、下が6弦"
      >
        <rect
          x={boardLeft}
          y="39"
          width={width - boardLeft - 10}
          height="215"
          rx="8"
          fill="#ece6da"
        />
        {hasOpenStrings && (
          <g className="fret-nut" aria-label="ナット">
            <rect
              x={boardLeft - 5}
              y="38"
              width="10"
              height="217"
              rx="2"
              fill="#faf7e9"
              stroke="#aaa18d"
              strokeWidth="1.5"
            />
            <line
              x1={boardLeft + 3}
              x2={boardLeft + 3}
              y1="40"
              y2="253"
              stroke="#d5ccb7"
            />
          </g>
        )}
        {frets.map((f) => (
          <g key={f}>
            <text
              x={fretCenter(f)}
              y="20"
              textAnchor="middle"
              className="fret-number"
            >
              {f === 0 ? "OPEN" : f}
            </text>
            {f !== 0 && (
              <line
                x1={fretLeft(f) + cell}
                x2={fretLeft(f) + cell}
                y1="39"
                y2="254"
                stroke="#c5bfae"
                strokeWidth="1.5"
              />
            )}
            {[3, 5, 7, 9, 12, 15, 17, 19, 21].includes(f) && (
              <>
                <circle
                  cx={fretCenter(f)}
                  cy={f === 12 ? 119 : 147}
                  r="5"
                  fill="#d2cabc"
                />
                {f === 12 && (
                  <circle cx={fretCenter(f)} cy="177" r="5" fill="#d2cabc" />
                )}
              </>
            )}
          </g>
        ))}
        {tuning.map((open, string) => (
          <g key={open}>
            <text
              x="18"
              y={59 + string * 36}
              textAnchor="middle"
              className="string-label"
            >
              {string + 1}
            </text>
            <line
              x1="45"
              x2={width - 10}
              y1={54 + string * 36}
              y2={54 + string * 36}
              stroke="#aaa28e"
              strokeWidth={0.8 + string * 0.35}
            />
            {frets.map((f) => {
              const midi = open + f;
              const matched = tones.find((t) => mod(t.midi) === mod(midi));
              const tone: Tone = {
                midi,
                name: matched?.name || noteName(midi),
                degree: matched?.degree || "1",
              };
              const visible = all || !!matched;
              const playing = active.includes(midi);
              const exact = midi === selected;
              const fill = playing
                ? "#d18c29"
                : colored && visible
                  ? color(tone.degree)
                  : "#52665c";
              return (
                <g
                  key={f}
                  role="button"
                  tabIndex={0}
                  aria-label={`${string + 1}弦 ${f}フレット ${tone.name}${octave(tone)}`}
                  onClick={() => onPlay(tone)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onPlay(tone);
                    }
                  }}
                  className="fret-hit"
                >
                  <rect
                    x={fretLeft(f)}
                    y={36 + string * 36}
                    width={fretWidth(f)}
                    height="36"
                    fill="transparent"
                  />
                  {visible ? (
                    <>
                      <circle
                        cx={fretCenter(f)}
                        cy={54 + string * 36}
                        r={playing ? 17 : 15}
                        fill={fill}
                        stroke={exact ? "#203d33" : "#faf8f0"}
                        strokeWidth={exact ? 3 : 1.5}
                      />
                      <text
                        x={fretCenter(f)}
                        y={58 + string * 36}
                        textAnchor="middle"
                        fill="white"
                        fontSize="11"
                        fontWeight="650"
                      >
                        {names
                          ? solfege
                            ? ({
                                C: "ド",
                                D: "レ",
                                E: "ミ",
                                F: "ファ",
                                G: "ソ",
                                A: "ラ",
                                B: "シ",
                              }[tone.name[0]] || "") + tone.name.slice(1)
                            : tone.name
                          : degrees
                            ? degreeLabel(tone.degree)
                            : ""}
                      </text>
                      {names && degrees && (
                        <text
                          x={fretCenter(f) + 20}
                          y={44 + string * 36}
                          textAnchor="middle"
                          fontSize="9"
                          fill="#40574b"
                          fontWeight="700"
                        >
                          {degreeLabel(tone.degree)}
                        </text>
                      )}
                    </>
                  ) : (
                    <circle
                      cx={fretCenter(f)}
                      cy={54 + string * 36}
                      r={f === 0 ? 6 : 3}
                      fill={f === 0 ? "#f5f3ed" : "#bab3a3"}
                      stroke={f === 0 ? "#aaa28e" : "none"}
                      strokeWidth="1.5"
                    />
                  )}
                </g>
              );
            })}
          </g>
        ))}
        <text x="45" y="281" className="fret-number">
          STANDARD TUNING · E A D G B E
        </text>
      </svg>
    </div>
  );
}
