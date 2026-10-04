import { useEffect, useRef, useState } from "react";
import {
  Accidental,
  Formatter,
  Renderer,
  Stave,
  StaveNote,
  Voice,
} from "vexflow/core";
import { notationReady } from "./notation";
import { color, octave, type Tone } from "./music";
export default function Staff({
  tones,
  active,
  colored,
  onPlay,
  hidePitch = false,
}: {
  tones: Tone[];
  active: number[];
  colored: boolean;
  hidePitch?: boolean;
  onPlay: (t: Tone) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    notationReady
      .then(() => {
        if (live) setReady(true);
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    const el = host.current!;
    el.replaceChildren();
    const width = Math.max(520, tones.length * 68 + 100);
    const renderer = new Renderer(el, Renderer.Backends.SVG);
    renderer.resize(width, 175);
    const ctx = renderer.getContext();
    const stave = new Stave(12, 24, width - 24);
    stave.addClef("treble");
    stave.setContext(ctx).draw();
    const notes = tones.map((t) => {
      const note = new StaveNote({
        keys: [`${t.name[0].toLowerCase()}/${octave(t, true)}`],
        duration: "q",
        autoStem: true,
      });
      const acc = t.name.slice(1).replaceAll("♭", "b").replaceAll("♯", "#");
      if (acc) note.addModifier(new Accidental(acc));
      const ink = active.includes(t.midi)
        ? "#d27c23"
        : colored
          ? color(t.degree)
          : "#273b35";
      note.setStyle({ fillStyle: ink, strokeStyle: ink });
      return note;
    });
    const voice = new Voice({
      numBeats: Math.max(notes.length, 1),
      beatValue: 4,
    });
    voice.addTickables(notes);
    new Formatter().joinVoices([voice]).format([voice], width - 115);
    voice.draw(ctx, stave);
    const svg = el.querySelector("svg")!;
    svg.setAttribute("viewBox", `0 0 ${width} 175`);
    svg.setAttribute("role", "group");
    svg.style.minWidth = `${Math.min(width, tones.length * 45 + 100)}px`;
    svg.setAttribute(
      "aria-label",
      "ギターの五線譜。記音は実音より1オクターブ上",
    );
    if (!hidePitch)
      notes.forEach((note, i) => {
        const hit = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect",
        );
        hit.setAttribute("x", String(note.getAbsoluteX() - 12));
        hit.setAttribute("y", "10");
        hit.setAttribute("width", "40");
        hit.setAttribute("height", "155");
        hit.setAttribute("fill", "transparent");
        hit.setAttribute("stroke", "none");
        hit.setAttribute("role", "button");
        hit.setAttribute("tabindex", "0");
        hit.setAttribute(
          "aria-label",
          `${tones[i].name}${octave(tones[i])}を再生`,
        );
        hit.style.cursor = "pointer";
        hit.addEventListener("click", () => onPlay(tones[i]));
        hit.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onPlay(tones[i]);
          }
        });
        svg.append(hit);
      });
  }, [tones, active, colored, onPlay, hidePitch, ready]);
  return (
    <div className="staff-scroll" ref={host}>
      {!ready && (
        <p className="muted">
          {failed
            ? "楽譜フォントを読み込めませんでした。ページを再読み込みしてください。"
            : "五線譜を準備しています…"}
        </p>
      )}
    </div>
  );
}
