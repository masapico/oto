import { useCallback, useEffect, useRef, useState } from "react";
import {
  chords,
  scales,
  roots,
  tones,
  invert,
  mod,
  color,
  degreeLabel,
  noteName,
  octave,
  scalePath,
  diatonic,
  interval,
  tuning,
  type Tone,
} from "./music";
import { Player } from "./audio";
import { readState, stateHash, type State, type Mode } from "./state";
import Staff from "./Staff";
import Fretboard from "./Fretboard";
const tabs: { id: Mode; num: string; label: string; english: string }[] = [
  { id: "notes", num: "01", label: "音符と指板", english: "NOTE EXPLORER" },
  { id: "chords", num: "02", label: "コードトーン", english: "CHORD TONES" },
  { id: "scales", num: "03", label: "スケール", english: "SCALE EXPLORER" },
  { id: "quiz", num: "04", label: "理解の確認", english: "QUICK PRACTICE" },
];
const suffix: Record<string, string> = {
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
};
export default function App() {
  const [state, setState] = useState<State>(readState);
  const [selected, setSelected] = useState<Tone>({
    midi: state.pitch,
    name: noteName(state.pitch, state.root.includes("♭")),
    degree: "1",
  });
  const [inspecting, setInspecting] = useState(false);
  const [descending, setDescending] = useState(false);
  const [active, setActive] = useState<number[]>([]);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");
  const [bpm, setBpm] = useState(80);
  const [volume, setVolume] = useState(0.55);
  const [names, setNames] = useState(true);
  const [degrees, setDegrees] = useState(true);
  const [colored, setColored] = useState(true);
  const [solfege, setSolfege] = useState(false);
  const [overlay, setOverlay] = useState(-1);
  const [sevenths, setSevenths] = useState(true);
  const [quizType, setQuizType] = useState("name");
  const [question, setQuestion] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const player = useRef(new Player());
  const stop = useCallback(() => {
    player.current.stop();
    setActive([]);
    setPlaying(false);
  }, []);
  const patch = (change: Partial<State>) => {
    stop();
    setState((s) => ({ ...s, ...change }));
    setOverlay(-1);
    setInspecting(false);
    setDescending(false);
    setAnswer(null);
  };
  useEffect(() => {
    const listener = () => {
      stop();
      setState(readState());
      setOverlay(-1);
      setInspecting(false);
      setDescending(false);
      setAnswer(null);
    };
    window.addEventListener("hashchange", listener);
    return () => {
      window.removeEventListener("hashchange", listener);
      player.current.stop();
    };
  }, [stop]);
  useEffect(() => {
    history.replaceState(
      null,
      "",
      `${location.pathname}${location.search}#${stateHash(state)}`,
    );
  }, [state]);
  useEffect(() => {
    const hide = () => {
      if (document.hidden) stop();
    };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, [stop]);
  useEffect(() => {
    if (state.mode === "notes")
      setSelected({
        midi: state.pitch,
        name: noteName(state.pitch, state.root.includes("♭")),
        degree: "1",
      });
  }, [state.mode, state.pitch, state.root]);
  const play = useCallback(
    (input: Tone[], together = false) => {
      setError("");
      setInspecting(false);
      setPlaying(true);
      void player.current
        .play(
          together ? [input.map((t) => t.midi)] : input.map((t) => [t.midi]),
          bpm,
          volume,
          setActive,
          () => setPlaying(false),
        )
        .catch(() => {
          setPlaying(false);
          setError(
            "音を開始できませんでした。もう一度、再生ボタンを押してください。",
          );
        });
    },
    [bpm, volume],
  );
  const playOne = useCallback(
    (tone: Tone) => {
      setSelected(tone);
      setState((s) => (s.mode === "notes" ? { ...s, pitch: tone.midi } : s));
      play([tone]);
      setInspecting(true);
    },
    [play],
  );
  const chord = chords.find((c) => c.id === state.chord)!;
  const scale = scales.find((s) => s.id === state.scale)!;
  const chordTones = invert(tones(state.root, chord.degrees), state.inversion);
  const displayedScale =
    state.scale === "melodic" && state.classic && descending
      ? scales[1]
      : scale;
  const scaleTones = tones(state.root, displayedScale.degrees);
  const scaleSequence = scalePath(state.root, scale, descending, state.classic);
  const harmonies = diatonic(state.root, sevenths);
  const overlayChord =
    overlay >= 0 && state.scale === "major" ? harmonies[overlay] : undefined;
  const overlayTones = overlayChord
    ? tones(overlayChord.root, overlayChord.formula.degrees)
    : [];
  const current =
    state.mode === "chords"
      ? chordTones
      : state.mode === "scales"
        ? scaleTones
        : [selected];
  const fretTones =
    state.mode === "scales" && overlayChord
      ? [
          ...overlayTones,
          ...scaleTones
            .filter(
              (t) => !overlayTones.some((o) => mod(o.midi) === mod(t.midi)),
            )
            .map((t) => ({ ...t, degree: "" })),
        ]
      : current;
  const quizMidi = [60, 64, 55, 62, 57, 65, 59][question % 7];
  const quizRoot = roots.filter((r) => !r.includes("♯"))[question % 12] || "C";
  const quizChord = chords[[0, 1, 4, 5, 6][question % 5]];
  const quizDegree =
    quizChord.degrees[question % 2 === 0 ? 1 : quizChord.degrees.length - 1];
  const quizTone = tones(quizRoot, [quizDegree])[0];
  const quizString = question % 6;
  const quizFret = state.start + (question % (state.end - state.start + 1));
  const fretAnswer = noteName(tuning[quizString] + quizFret);
  const correct =
    quizType === "name"
      ? noteName(quizMidi)
      : quizType === "fret"
        ? fretAnswer
        : quizTone.name;
  const quizNotes: Tone[] =
    quizType === "name"
      ? [{ midi: quizMidi, name: noteName(quizMidi), degree: "1" }]
      : quizType === "fret"
        ? [
            {
              midi: tuning[quizString] + quizFret,
              name: fretAnswer,
              degree: "1",
            },
          ]
        : [quizTone];
  const quizOptions = Array.from(
    new Set([
      correct,
      ...["C", "D♭", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"],
    ]),
  ).sort((a, b) => roots.indexOf(a) - roots.indexOf(b));
  const heading =
    state.mode === "notes"
      ? "音符と、指板をつなぐ。"
      : state.mode === "chords"
        ? "和音を、一音ずつほどく。"
        : state.mode === "scales"
          ? "音の並びを、耳と目で。"
          : "わかった、を確かめる。";
  return (
    <div className="app-shell">
      <header className="header">
        <a href="#view=chords" className="brand" aria-label="OTO ホーム">
          <span className="brand-mark">
            o<span>t</span>o
          </span>
          <span className="brand-caption">
            GUITAR REFERENCE
            <br />
            <b>音と、指板のあいだ。</b>
          </span>
        </a>
        <span className="header-note">
          <span className="status-dot" /> SEE. HEAR. UNDERSTAND.
        </span>
      </header>
      <nav className="tabs" aria-label="リファレンスの種類">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={state.mode === t.id ? "tab active" : "tab"}
            onClick={() => patch({ mode: t.id })}
            aria-current={state.mode === t.id ? "page" : undefined}
          >
            <span className="tab-number">{t.num}</span>
            <span>
              {t.label}
              <small>{t.english}</small>
            </span>
            <span className="tab-arrow">↗</span>
          </button>
        ))}
      </nav>
      <main>
        <div className="page-heading">
          <div>
            <p className="eyebrow">THE INTERACTIVE GUITAR COMPANION</p>
            <h1>{heading}</h1>
            <p className="intro">
              {state.mode === "notes"
                ? "音符をクリックして聴く。同じ音を、指板の別の場所で見つける。"
                : state.mode === "chords"
                  ? "ルート・3rd・5th・7th。それぞれの音が、響きをつくる。"
                  : state.mode === "scales"
                    ? "全音と半音、コードとの関係。気になる音から確かめよう。"
                    : "ヒントを外して、ひとつだけ。答えたら、音で確かめよう。"}
            </p>
          </div>
          <span className="chapter">
            {tabs.find((t) => t.id === state.mode)?.num}
            <span>/ 04</span>
          </span>
        </div>
        {state.mode !== "quiz" && (
          <section className="controls" aria-label="音楽の条件">
            {state.mode !== "notes" && (
              <label>
                ROOT / 主音
                <select
                  value={state.root}
                  onChange={(e) => patch({ root: e.target.value })}
                >
                  {roots.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
            )}
            {state.mode === "chords" ? (
              <>
                <label className="wide-control">
                  CHORD / コード
                  <select
                    value={state.chord}
                    onChange={(e) =>
                      patch({ chord: e.target.value, inversion: 0 })
                    }
                  >
                    {chords.map((c) => (
                      <option value={c.id} key={c.id}>
                        {state.root}
                        {suffix[c.id]} — {c.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  VOICING / 転回形
                  <select
                    value={state.inversion}
                    onChange={(e) =>
                      patch({ inversion: Number(e.target.value) })
                    }
                  >
                    {chord.degrees.map((_, i) => (
                      <option value={i} key={i}>
                        {i === 0 ? "基本形" : `第${i}転回形`}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : state.mode === "scales" ? (
              <>
                <label className="wide-control">
                  SCALE / スケール
                  <select
                    value={state.scale}
                    onChange={(e) => patch({ scale: e.target.value })}
                  >
                    {scales.map((s) => (
                      <option value={s.id} key={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
                {state.scale === "melodic" && (
                  <label>
                    下行の扱い
                    <select
                      value={state.classic ? "classic" : "jazz"}
                      onChange={(e) =>
                        patch({ classic: e.target.value === "classic" })
                      }
                    >
                      <option value="classic">クラシック式</option>
                      <option value="jazz">ジャズ式</option>
                    </select>
                  </label>
                )}
              </>
            ) : (
              <label className="wide-control">
                PITCH / 音の高さ
                <select
                  value={selected.midi}
                  onChange={(e) => {
                    const midi = Number(e.target.value);
                    playOne({
                      midi,
                      name: noteName(midi, state.root.includes("♭")),
                      degree: "1",
                    });
                  }}
                >
                  {Array.from({ length: 47 }, (_, i) => i + 40).map((m) => (
                    <option key={m} value={m}>
                      {noteName(m, state.root.includes("♭"))}
                      {Math.floor(m / 12) - 1}（実音）
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="controls-note">
              STANDARD
              <br />
              <strong>6弦 / E A D G B E</strong>
            </div>
          </section>
        )}
        {state.mode === "quiz" ? (
          <section className="quiz-card">
            <div className="section-top">
              <div>
                <p className="eyebrow">A LITTLE CHECK-IN</p>
                <h2>短い確認問題</h2>
              </div>
              <select
                aria-label="問題の種類"
                value={quizType}
                onChange={(e) => {
                  stop();
                  setQuizType(e.target.value);
                  setAnswer(null);
                }}
              >
                <option value="name">五線譜 → 音名</option>
                <option value="fret">指板の位置 → 音名</option>
                <option value="degree">コードの度数 → 音名</option>
              </select>
            </div>
            <h3>
              {quizType === "name"
                ? "この音の音名は？"
                : quizType === "fret"
                  ? `${quizString + 1}弦 ${quizFret}フレットの音名は？`
                  : `${quizRoot}${suffix[quizChord.id]} の ${degreeLabel(quizDegree)} はどの音？`}
            </h3>
            {quizType === "name" && (
              <Staff
                tones={quizNotes}
                active={active}
                colored={false}
                hidePitch={answer === null}
                onPlay={() => {
                  if (answer) play(quizNotes);
                }}
              />
            )}
            <div className="answer-options">
              {quizOptions.map((n) => (
                <button
                  key={n}
                  disabled={answer !== null}
                  onClick={() => setAnswer(n)}
                >
                  {n}
                </button>
              ))}
            </div>
            {answer !== null ? (
              <div className="answer" role="status">
                <strong>
                  {answer === correct
                    ? "正解です。"
                    : "もう一度、音の関係を確かめよう。"}{" "}
                  答え：{correct}
                </strong>
                <p>
                  {quizType === "degree"
                    ? `${quizRoot}${suffix[quizChord.id]} = ${tones(
                        quizRoot,
                        quizChord.degrees,
                      )
                        .map((t) => `${t.name} (${degreeLabel(t.degree)})`)
                        .join("・")}`
                    : `実音 ${quizNotes[0].name}${octave(quizNotes[0])} / 記音 ${quizNotes[0].name}${octave(quizNotes[0], true)}`}
                </p>
                <button className="primary" onClick={() => play(quizNotes)}>
                  ▶ 音で確認
                </button>
                <button
                  onClick={() => {
                    stop();
                    setQuestion((q) => q + 1);
                    setAnswer(null);
                  }}
                >
                  次の問題 →
                </button>
              </div>
            ) : (
              <p className="muted">
                解答後に、音と説明で確認できます。記録や採点履歴は残しません。
              </p>
            )}
          </section>
        ) : (
          <>
            <div className="workspace">
              <section className="notation-panel panel">
                <div className="section-top">
                  <div>
                    <p className="eyebrow">LISTEN & EXPLORE</p>
                    <h2>
                      {state.mode === "chords" ? (
                        <>
                          {state.root}
                          <span className="chord-suffix">
                            {suffix[state.chord] || "major"}
                          </span>
                        </>
                      ) : state.mode === "scales" ? (
                        `${state.root} ${scale.label}`
                      ) : (
                        `${selected.name}${octave(selected)}`
                      )}
                    </h2>
                  </div>
                  <span className="small-tag">
                    {state.mode === "chords"
                      ? `${chord.degrees.length} NOTES`
                      : state.mode === "scales"
                        ? `${scale.degrees.length} NOTES`
                        : "SINGLE NOTE"}
                  </span>
                </div>
                <Staff
                  tones={
                    inspecting
                      ? [selected]
                      : overlayChord
                        ? overlayTones
                        : state.mode === "scales"
                          ? scaleSequence
                          : current
                  }
                  active={active}
                  colored={colored}
                  onPlay={playOne}
                />
                {inspecting && state.mode !== "notes" && (
                  <div className="inspection">
                    <span>
                      選択中：実音 {selected.name}
                      {octave(selected)} / 記音 {selected.name}
                      {octave(selected, true)}
                    </span>
                    <button
                      onClick={() => {
                        stop();
                        setInspecting(false);
                      }}
                    >
                      全体に戻る ↩
                    </button>
                  </div>
                )}
                {state.mode === "scales" && (
                  <p className="direction-label">
                    {descending ? "下行" : "上行"}の音を表示
                    {state.scale === "melodic" && state.classic && descending
                      ? "（自然短音階）"
                      : ""}
                  </p>
                )}
                <div className="staff-caption">
                  <span>ト音記号 / ギターの記音</span>
                  <span>実音は譜面の1オクターブ下</span>
                </div>
                <div className="transport">
                  {state.mode === "chords" ? (
                    <>
                      <button
                        className="primary"
                        onClick={() => play(chordTones, true)}
                      >
                        ▶ 和音で聴く
                      </button>
                      <button onClick={() => play(chordTones)}>
                        ↗ アルペジオ
                      </button>
                    </>
                  ) : state.mode === "scales" ? (
                    <>
                      <button
                        className="primary"
                        onClick={() => {
                          setDescending(false);
                          setOverlay(-1);
                          play(
                            scalePath(state.root, scale, false, state.classic),
                          );
                        }}
                      >
                        ↗ 上行
                      </button>
                      <button
                        onClick={() => {
                          setDescending(true);
                          setOverlay(-1);
                          play(
                            scalePath(state.root, scale, true, state.classic),
                          );
                        }}
                      >
                        ↘ 下行
                      </button>
                    </>
                  ) : (
                    <button
                      className="primary"
                      onClick={() => play([selected])}
                    >
                      ▶ この音を聴く
                    </button>
                  )}
                  <button className="stop" onClick={stop} aria-label="停止">
                    ■
                  </button>
                  <span className="playing-state" aria-live="polite">
                    {playing ? "再生中" : "クリックして試聴"}
                  </span>
                </div>
              </section>
              <aside className="tone-panel panel">
                <p className="eyebrow">
                  {overlayChord
                    ? "CHORD / SCALE DEGREES"
                    : "THE BUILDING BLOCKS"}
                </p>
                <h3>
                  {overlayChord
                    ? `${overlayChord.root}${suffix[overlayChord.formula.id]} の構成音`
                    : state.mode === "notes"
                      ? "選択した音"
                      : "構成音と役割"}
                </h3>
                <div className="tone-list">
                  {(overlayChord ? overlayTones : current).map((t, i) => (
                    <button
                      key={`${t.name}-${i}`}
                      className={
                        active.includes(t.midi)
                          ? "tone-row sounding"
                          : "tone-row"
                      }
                      onClick={() => playOne(t)}
                    >
                      <span
                        className="degree-badge"
                        style={{
                          background: colored ? color(t.degree) : "#65736a",
                        }}
                      >
                        {degrees && state.mode !== "notes"
                          ? degreeLabel(t.degree)
                          : "♪"}
                      </span>
                      <strong>{names ? t.name : "—"}</strong>
                      <span className="tone-description">
                        {state.mode === "notes"
                          ? `実音 ${octave(t)}`
                          : !degrees
                            ? ""
                            : overlayChord
                              ? `スケールでは ${degreeLabel(scaleTones.find((s) => mod(s.midi) === mod(t.midi))?.degree || "")}`
                              : t.degree === "1"
                                ? "ルート"
                                : `${t.degree} 度`}
                      </span>
                      <span className="tiny-play">▷</span>
                    </button>
                  ))}
                </div>
                <p className="aside-note">
                  {state.mode === "notes"
                    ? `実音 ${selected.name}${octave(selected)} → 記音 ${selected.name}${octave(selected, true)}`
                    : "一音ずつ聴くと、和音の輪郭が見えてくる。"}
                </p>
              </aside>
            </div>
            <section className="panel fret-panel">
              <div className="section-top">
                <div>
                  <p className="eyebrow">ON THE FRETBOARD</p>
                  <h3>
                    指板で確かめる{" "}
                    <span className="inline-note">上が1弦（細い弦）</span>
                  </h3>
                </div>
                <div className="range-controls">
                  <label>
                    範囲{" "}
                    <select
                      aria-label="開始フレット"
                      value={state.start}
                      onChange={(e) => {
                        const start = Number(e.target.value);
                        patch({ start, end: Math.max(start + 1, state.end) });
                      }}
                    >
                      {Array.from({ length: 22 }, (_, i) => (
                        <option key={i} value={i}>
                          {i}
                        </option>
                      ))}
                    </select>
                  </label>
                  <span>—</span>
                  <select
                    aria-label="終了フレット"
                    value={state.end}
                    onChange={(e) => patch({ end: Number(e.target.value) })}
                  >
                    {Array.from(
                      { length: 22 - state.start },
                      (_, i) => state.start + i + 1,
                    ).map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                  <span>fr.</span>
                </div>
              </div>
              <Fretboard
                tones={fretTones}
                start={state.start}
                end={state.end}
                all={false}
                selected={selected.midi}
                active={active}
                names={names}
                degrees={state.mode !== "notes" && degrees}
                colored={colored}
                solfege={solfege}
                onPlay={playOne}
              />
              <div className="fret-footer">
                <div className="legend">
                  {(state.mode === "notes" ? ["1"] : ["1", "3", "5", "7"]).map(
                    (d) => (
                      <span key={d}>
                        <i
                          style={{ background: colored ? color(d) : "#65736a" }}
                        />
                        {d === "1"
                          ? "Root"
                          : `${d}rd`
                              .replace("5rd", "5th")
                              .replace("7rd", "7th")}
                      </span>
                    ),
                  )}
                </div>
                <span>
                  {state.mode === "notes"
                    ? "濃い輪郭＝選択した高さ / 同じ色＝オクターブ違いを含む同じ音名"
                    : "表示は構成音の位置です。押弦フォームではありません。"}
                </span>
              </div>
              <div className="display-options">
                <span>表示ヒント</span>
                <label>
                  <input
                    type="checkbox"
                    checked={names}
                    onChange={(e) => setNames(e.target.checked)}
                  />
                  音名
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={degrees}
                    onChange={(e) => setDegrees(e.target.checked)}
                  />
                  度数
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={colored}
                    onChange={(e) => setColored(e.target.checked)}
                  />
                  色分け
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={solfege}
                    onChange={(e) => setSolfege(e.target.checked)}
                  />
                  指板をドレミ表記
                </label>
              </div>
            </section>
            {state.mode === "scales" && (
              <section className="panel harmony-panel">
                <div className="section-top">
                  <div>
                    <p className="eyebrow">SCALE → CHORD</p>
                    <h3>スケールとコードの関係</h3>
                  </div>
                  {state.scale === "major" && (
                    <label className="check-label">
                      <input
                        type="checkbox"
                        checked={sevenths}
                        onChange={(e) => {
                          stop();
                          setSevenths(e.target.checked);
                          setOverlay(-1);
                        }}
                      />
                      七の和音
                    </label>
                  )}
                </div>
                {state.scale === "major" ? (
                  <>
                    <div className="harmonies">
                      {harmonies.map((h, i) => (
                        <button
                          key={i}
                          className={overlay === i ? "selected" : ""}
                          onClick={() => {
                            stop();
                            setOverlay(overlay === i ? -1 : i);
                          }}
                        >
                          <small>
                            {["I", "II", "III", "IV", "V", "VI", "VII"][i]}
                          </small>
                          <strong>
                            {h.root}
                            {suffix[h.formula.id]}
                          </strong>
                        </button>
                      ))}
                    </div>
                    <p className="muted">
                      コードを選ぶと、指板の色はそのコードのルート基準になります。構成音一覧ではスケールの度数も確認できます。
                    </p>
                    {overlayChord && (
                      <button onClick={() => play(overlayTones, true)}>
                        ▶ {overlayChord.root}
                        {suffix[overlayChord.formula.id]} を聴く
                      </button>
                    )}
                  </>
                ) : (
                  <p className="muted">
                    ダイアトニックコードの一覧はメジャースケールで表示します。
                  </p>
                )}
                <div className="compatibility">
                  <strong>
                    {state.root}
                    {suffix[state.chord]} と照合
                  </strong>
                  <span>
                    {tones(state.root, chord.degrees).every((t) =>
                      scaleTones.some((s) => mod(s.midi) === mod(t.midi)),
                    )
                      ? "すべての構成音が、このスケールに含まれます。"
                      : `スケール外の音：${tones(state.root, chord.degrees)
                          .filter(
                            (t) =>
                              !scaleTones.some(
                                (s) => mod(s.midi) === mod(t.midi),
                              ),
                          )
                          .map((t) => t.name)
                          .join("・")}`}
                  </span>
                  <select
                    aria-label="照合するコード"
                    value={state.chord}
                    onChange={(e) =>
                      patch({ chord: e.target.value, inversion: 0 })
                    }
                  >
                    {chords.map((c) => (
                      <option value={c.id} key={c.id}>
                        {state.root}
                        {suffix[c.id] || " major"}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="aside-note">
                  音が含まれることは、あらゆる場面でその組み合わせが適することを意味しません。
                </p>
              </section>
            )}
            <section className="explanation">
              <span className="explanation-icon">↳</span>
              <div>
                <p className="eyebrow">A NOTE TO TAKE WITH YOU</p>
                <h3>
                  {state.mode === "chords"
                    ? "響きの違いは、音と音の距離にある。"
                    : state.mode === "scales"
                      ? "形を覚える前に、音の間隔を聴こう。"
                      : "同じ音は、ひとつの場所だけにない。"}
                </h3>
                <p>
                  {state.mode === "chords"
                    ? chord.description
                    : state.mode === "scales"
                      ? scale.description
                      : "ギターでは、同じ高さの音を複数の弦で弾けます。濃い輪郭の音と同じ高さの場所を探し、オクターブ違いの音とも聴き比べてみましょう。指板の小さな点もクリックすると音が鳴ります。"}
                </p>
                {state.mode === "scales" && (
                  <div className="intervals">
                    {[...displayedScale.degrees, "8"]
                      .slice(0, -1)
                      .map((d, i) => {
                        const next = [...displayedScale.degrees, "8"][i + 1];
                        return (
                          <span key={d}>
                            {degreeLabel(d)}{" "}
                            <b>
                              {interval(next) - interval(d) === 1
                                ? "半音"
                                : interval(next) - interval(d) === 2
                                  ? "全音"
                                  : `${interval(next) - interval(d)}半音`}
                            </b>{" "}
                            →{" "}
                          </span>
                        );
                      })}
                    <span>R</span>
                  </div>
                )}
                <p className="try-this">
                  TRY THIS —{" "}
                  {state.mode === "chords"
                    ? "メジャーとマイナーを切り替えて、3rdだけを聴き比べよう。"
                    : state.mode === "scales"
                      ? "上行を聴いたら、同じ音をギターでゆっくりたどってみよう。"
                      : "開放弦のEと、別の弦のEを聴き比べよう。"}
                </p>
              </div>
            </section>
          </>
        )}
        <section className="audio-settings" aria-label="再生設定">
          <span>♫ 再生設定</span>
          <label>
            テンポ{" "}
            <input
              aria-label="テンポ"
              type="range"
              min="40"
              max="180"
              value={bpm}
              onChange={(e) => {
                stop();
                setBpm(Number(e.target.value));
              }}
            />
            <b>{bpm}</b> BPM
          </label>
          <label>
            音量{" "}
            <input
              aria-label="音量"
              type="range"
              min="0"
              max="1"
              step=".05"
              value={volume}
              onChange={(e) => {
                stop();
                setVolume(Number(e.target.value));
              }}
            />
            <b>{Math.round(volume * 100)}%</b>
          </label>
          <button onClick={stop}>■ 停止</button>
        </section>
        {error && <p role="alert">{error}</p>}
      </main>
      <footer>
        <span className="footer-logo">
          oto<span> / GUITAR REFERENCE</span>
        </span>
        <a
          href="https://github.com/masapico/ideas"
          target="_blank"
          rel="noreferrer"
        >
          SOURCE ↗
        </a>
      </footer>
    </div>
  );
}
