import { describe, expect, test } from "vitest";
import { guides } from "../site/content";
import { site, adsTxt } from "../site/config";
import {
  adMarkup,
  renderGuide,
  sitePages,
  sitemap,
  toolHref,
} from "../site/render";
import { readState } from "../src/state";
import { readFileSync } from "node:fs";

describe("editorial site and tool integration", () => {
  test("all 14 guides have unique URLs, complete sections, and valid related guides", () => {
    expect(guides).toHaveLength(14);
    expect(new Set(guides.map((g) => g.slug)).size).toBe(14);
    for (const guide of guides) {
      expect(guide.sections).toHaveLength(3);
      expect(guide.practice).toHaveLength(3);
      expect(guide.sections.every((s) => s.paragraphs.length >= 2)).toBe(true);
      expect(
        guide.related.every((slug) =>
          guides.some((g) => g.slug === slug && slug !== guide.slug),
        ),
      ).toBe(true);
      const state = readState(new URL(toolHref(guide), site.origin).hash);
      expect(state.mode).toBe(guide.example.view);
      expect(state.root).toBe(guide.example.root);
      if (guide.example.chord) expect(state.chord).toBe(guide.example.chord);
      if (guide.example.scale) expect(state.scale).toBe(guide.example.scale);
      if (guide.example.pitch) expect(state.pitch).toBe(guide.example.pitch);
      if (guide.example.inv) expect(state.inversion).toBe(guide.example.inv);
      if (guide.example.harmony !== undefined)
        expect(state.harmony).toBe(guide.example.harmony);
      if (guide.example.compare)
        expect(state.compareScale).toBe(guide.example.compare);
    }
  });

  test("all internal links resolve to generated pages or existing tool routes", () => {
    const pages = sitePages();
    const paths = new Set([
      site.base,
      ...pages.map((page) => site.base + page.path),
    ]);
    for (const page of pages) {
      for (const [, href] of page.html.matchAll(/href="([^"]+)"/g)) {
        if (
          !href.startsWith(site.base) ||
          href.endsWith(".css") ||
          href.endsWith(".svg")
        )
          continue;
        expect(paths.has(href.split("#")[0]), `${page.path} → ${href}`).toBe(
          true,
        );
      }
      expect(page.html).not.toContain("undefined");
      expect(page.html).toContain(
        'name="google-adsense-account" content="ca-pub-3056490289410063"',
      );
      expect(page.html).not.toContain("pagead/js/adsbygoogle.js");
    }
    expect((sitemap().match(/<loc>/g) ?? []).length).toBe(20);
  });

  test("article HTML contains its text, canonical, and valid structured data without executing JavaScript", () => {
    for (const guide of guides) {
      const html = renderGuide(guide);
      expect(html).toContain(guide.sections[0].paragraphs[0]);
      expect(html).toContain(
        `rel="canonical" href="${site.origin}${site.base}guides/${guide.slug}/"`,
      );
      const structured = JSON.parse(
        html.match(/application\/ld\+json">([\s\S]*?)<\/script>/)![1],
      );
      expect(structured["@graph"][0].headline).toBe(guide.title);
      expect(structured["@graph"][1].itemListElement).toHaveLength(3);
    }
  });

  test("static diagrams correctly distinguish string order, real pitch, and written pitch", () => {
    const notes = renderGuide(guides[0]);
    expect(notes).toContain("実音 A2 / ギターの記音 A3");
    expect(notes).toContain("6弦</th><td>E2</td><td>5フレット");
    expect(notes).toContain("5弦</th><td>A2</td><td>0フレット");
    expect(renderGuide(guides[1])).toContain("実音 E2 / ギターの記音 E3");
    expect(
      renderGuide(guides.find((g) => g.slug === "diatonic-chords")!),
    ).toContain("G7</td>");
  });
});

describe("AdSense activation", () => {
  test("does not request ads until explicitly enabled with a valid unit ID", () => {
    expect(adMarkup()).toBe("");
    expect(adMarkup(false, "1234567890")).toBe("");
    expect(adMarkup(true, "")).toBe("");
    expect(adMarkup(true, "<script>")).toBe("");
    const markup = adMarkup(true, "1234567890");
    expect((markup.match(/class="adsbygoogle"/g) ?? []).length).toBe(1);
    expect((markup.match(/pagead\/js\/adsbygoogle.js/g) ?? []).length).toBe(1);
    expect(markup).toContain('aria-label="広告"');
    expect(markup).toContain('data-ad-client="ca-pub-3056490289410063"');
  });

  test("root-site ads.txt matches the supplied publisher snippet", () => {
    expect(
      readFileSync(new URL("../hosting/ads.txt", import.meta.url), "utf8"),
    ).toBe(adsTxt);
    expect(adsTxt).toBe(
      "google.com, pub-3056490289410063, DIRECT, f08c47fec0942fa0\n",
    );
  });
});
