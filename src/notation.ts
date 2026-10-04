import { VexFlow } from "vexflow/core";
import bravuraUrl from "@vexflow-fonts/bravura/bravura.woff2?url";
import academicoUrl from "@vexflow-fonts/academico/academico.woff2?url";
// Load only the two fonts used by this reference, from the site's own assets.
export const notationReady = Promise.all([
  new FontFace("Bravura", `url(${bravuraUrl})`).load(),
  new FontFace("Academico", `url(${academicoUrl})`).load(),
]).then((fonts) => {
  fonts.forEach((font) => document.fonts.add(font));
  VexFlow.setFonts("Bravura", "Academico");
});
