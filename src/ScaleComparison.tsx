import { useState } from "react";
import {
  compareTones,
  displayedScale,
  scales,
  scalePath,
  tones,
  degreeLabel,
  type Tone,
} from "./music";
import type { State } from "./state";
import Staff from "./Staff";
import Fretboard from "./Fretboard";
import ScaleOptions from "./ScaleOptions";

type Props = {
  state: State;
  patch: (change: Partial<State>) => void;
  play: (input: Tone[]) => void;
  onPlay: (tone: Tone) => void;
  active: number[];
  colored: boolean;
  names: boolean;
  degrees: boolean;
  solfege: boolean;
};
export default function ScaleComparison({
  state,
  patch,
  play,
  onPlay,
  active,
  colored,
  names,
  degrees,
  solfege,
}: Props) {
  const [board, setBoard] = useState(0);
  const a = scales.find((s) => s.id === state.scale)!;
  const b = scales.find((s) => s.id === state.compareScale);
  const formulas = b ? [a, b] : [];
  const sets = formulas.map((s) =>
    tones(
      state.root,
      displayedScale(s, state.descending, state.classic).degrees,
    ),
  );
  return (
    <section className="panel comparison-panel" aria-label="スケール比較">
      <div className="section-top">
        <div>
          <p className="eyebrow">COMPARE THE SOUND</p>
          <h3>同じ主音でスケールを比較</h3>
        </div>
        <label className="check-label">
          <input
            type="checkbox"
            checked={!!b}
            onChange={(e) => {
              setBoard(0);
              patch({
                compareScale: e.target.checked
                  ? state.scale === "major"
                    ? "natural"
                    : "major"
                  : "",
              });
            }}
          />
          比較する
        </label>
      </div>
      {b ? (
        <>
          <label className="comparison-select">
            比較対象 B
            <select
              value={b.id}
              onChange={(e) => patch({ compareScale: e.target.value })}
            >
              <ScaleOptions />
            </select>
          </label>
          <p className="muted">
            共通音は実線、片方だけの音は破線と「Aのみ／Bのみ」で表示します。同じ主音・音域・テンポで聴き比べられます。
          </p>
          <div className="comparison-grid">
            {formulas.map((s, i) => (
              <div
                className="comparison-card"
                role="group"
                key={i}
                aria-label={`スケール ${i ? "B" : "A"}`}
              >
                <h3>
                  {i ? "B" : "A"}：{state.root} {s.label}
                </h3>
                <p className="muted">
                  {state.descending ? "下行" : "上行"}
                  {s.id === "melodic" && state.classic && state.descending
                    ? "（自然短音階）"
                    : ""}
                </p>
                <div className="comparison-tones">
                  {compareTones(sets[i], sets[1 - i]).map((t) => (
                    <button
                      key={t.degree}
                      className={`comparison-tone ${t.common ? "common" : "unique"}`}
                      onClick={() => onPlay(t)}
                    >
                      <strong>{t.name}</strong>
                      <span>{degreeLabel(t.degree)}</span>
                      <small>
                        {t.common ? "共通" : `${i ? "B" : "A"}のみ`}
                      </small>
                    </button>
                  ))}
                </div>
                <Staff
                  tones={scalePath(
                    state.root,
                    s,
                    state.descending,
                    state.classic,
                  )}
                  active={active}
                  colored={colored}
                  onPlay={onPlay}
                />
                <button
                  className="primary"
                  onClick={() =>
                    play(
                      scalePath(state.root, s, state.descending, state.classic),
                    )
                  }
                >
                  ▶ {i ? "B" : "A"}を聴く
                </button>
              </div>
            ))}
          </div>
          <div
            className="comparison-board-controls"
            aria-label="比較指板の選択"
          >
            <span>比較用指板</span>
            {["A", "B"].map((label, i) => (
              <button
                key={label}
                aria-pressed={board === i}
                onClick={() => setBoard(i)}
              >
                {label}の指板
              </button>
            ))}
          </div>
          <p className="muted">
            {board ? "B" : "A"}：{state.root} {formulas[board].label} ·
            構成音の位置を表示
          </p>
          <Fretboard
            tones={sets[board]}
            start={state.start}
            end={state.end}
            all={false}
            selected={-1}
            active={active}
            names={names}
            degrees={degrees}
            colored={colored}
            solfege={solfege}
            onPlay={onPlay}
          />
        </>
      ) : (
        <p className="muted comparison-intro">
          例えば、ナチュラルマイナーとドリアンの6度の違いを、音名・五線譜・指板で確認できます。
        </p>
      )}
    </section>
  );
}
