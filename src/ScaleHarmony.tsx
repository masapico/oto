import {
  chords,
  chordSuffix,
  tones,
  mod,
  degreeLabel,
  type Formula,
  type Tone,
} from "./music";
type Harmony = { root: string; formula: Formula };
type Props = {
  root: string;
  chord: Formula;
  scaleTones: Tone[];
  harmonies: Harmony[];
  overlay: number;
  sevenths: boolean;
  melodicDescent: boolean;
  onOverlay: (index: number) => void;
  onSevenths: (value: boolean) => void;
  onChord: (id: string) => void;
  play: (tones: Tone[], together?: boolean) => void;
};
export default function ScaleHarmony({
  root,
  chord,
  scaleTones,
  harmonies,
  overlay,
  sevenths,
  melodicDescent,
  onOverlay,
  onSevenths,
  onChord,
  play,
}: Props) {
  const outside = tones(root, chord.degrees).filter(
    (t) => !scaleTones.some((s) => mod(s.midi) === mod(t.midi)),
  );
  return (
    <section className="panel harmony-panel">
      <div className="section-top">
        <div>
          <p className="eyebrow">SCALE → CHORD</p>
          <h3>スケールとコードの関係</h3>
        </div>
        {!!harmonies.length && (
          <label className="check-label">
            <input
              type="checkbox"
              checked={sevenths}
              onChange={(e) => onSevenths(e.target.checked)}
            />
            七の和音
          </label>
        )}
      </div>
      {harmonies.length ? (
        <>
          <div className="harmonies">
            {harmonies.map((h, i) => (
              <button
                key={i}
                className={overlay === i ? "selected" : ""}
                aria-pressed={overlay === i}
                onClick={() => {
                  onOverlay(i);
                  play(tones(h.root, h.formula.degrees), true);
                }}
              >
                <small>{degreeLabel(scaleTones[i].degree)} 度上</small>
                <strong>
                  {h.root}
                  {chordSuffix[h.formula.id]}
                </strong>
              </button>
            ))}
          </div>
          <p className="muted">
            表示中の音列から3度ずつ重ねたコードです。
            {melodicDescent
              ? "クラシック式下行では自然短音階から生成します。"
              : ""}
            コードをクリックすると和音が鳴ります。同じコードをもう一度クリックすると再生できます。指板の色はコードのルート基準になり、構成音一覧でスケールの度数も確認できます。
          </p>
          {harmonies[overlay] && (
            <button onClick={() => onOverlay(7)}>重ね表示を解除</button>
          )}
        </>
      ) : (
        <p className="muted comparison-intro">
          この音階では7音スケールの3度積みコード一覧を表示しません。下の照合で、コードの構成音が含まれるか確認できます。
        </p>
      )}
      <div className="compatibility">
        <strong>
          {root}
          {chordSuffix[chord.id]} と照合
        </strong>
        <span>
          {outside.length
            ? `スケール外の音：${outside.map((t) => t.name).join("・")}`
            : "すべての構成音が、このスケールに含まれます。"}
        </span>
        <select
          aria-label="照合するコード"
          value={chord.id}
          onChange={(e) => onChord(e.target.value)}
        >
          {chords.map((c) => (
            <option value={c.id} key={c.id}>
              {root}
              {chordSuffix[c.id] || " major"}
            </option>
          ))}
        </select>
      </div>
      <p className="aside-note">
        音が含まれることは、あらゆる場面でその組み合わせが適することを意味しません。
      </p>
    </section>
  );
}
