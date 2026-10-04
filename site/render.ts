import { guides, type Guide } from "./content";
import { site } from "./config";
import {
  chords,
  scales,
  tones,
  invert,
  tuning,
  noteName,
  octave,
  diatonic,
  chordSuffix,
} from "../src/music";

export const escape = (input: string | number) =>
  String(input).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const json = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");
export const url = (path = "") => `${site.origin}${site.base}${path}`;
const href = (path = "") => `${site.base}${path}`;
const guideHref = (slug: string) => href(`guides/${slug}/`);
const p = (paragraphs: string[]) =>
  paragraphs.map((text) => `<p>${escape(text)}</p>`).join("");

export function toolHref(guide: Guide) {
  return `${href()}#${new URLSearchParams(Object.entries(guide.example).map(([key, value]) => [key, String(value)]))}`;
}

export function siteNavigation() {
  return `<nav class="site-nav" aria-label="サイト全体"><a href="${href("guides/")}">学習ガイド</a><a href="${href()}">リファレンス</a><a href="${href("about/")}">このサイトについて</a></nav>`;
}

export function metaTags(
  title: string,
  description: string,
  path = "",
  structured?: unknown,
) {
  const isArticle = path.startsWith("guides/") && path !== "guides/";
  return `<meta name="description" content="${escape(description)}"><link rel="canonical" href="${url(path)}">
    <meta name="google-adsense-account" content="${site.adsense.client}">
    <meta property="og:type" content="${isArticle ? "article" : "website"}"><meta property="og:locale" content="ja_JP"><meta property="og:site_name" content="OTO — ギターリファレンス">
    <meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${url(path)}">
    <meta property="og:image" content="${url("ogp.png")}"><meta name="twitter:card" content="summary_large_image">
    ${structured ? `<script type="application/ld+json">${json(structured)}</script>` : ""}`;
}

function page(
  title: string,
  description: string,
  path: string,
  body: string,
  structured?: unknown,
) {
  return `<!doctype html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#f5f3ed"><title>${escape(title)} | OTO</title>${metaTags(title, description, path, structured)}<link rel="icon" href="${href("favicon.svg")}"><link rel="stylesheet" href="${href("site.css")}"></head>
  <body class="editorial"><a class="skip-link" href="#main">本文へ</a><div class="app-shell"><header class="header"><a href="${href()}" class="brand" aria-label="OTO ホーム"><span class="brand-mark">o<span>t</span>o</span><span class="brand-caption">GUITAR REFERENCE<br><b>音と、指板のあいだ。</b></span></a><span class="header-note">SEE. HEAR. UNDERSTAND.</span></header>${siteNavigation()}<main id="main">${body}</main><footer class="site-footer"><span class="footer-logo">oto / GUITAR REFERENCE</span><nav aria-label="運営情報"><a href="${href("about/")}">運営・編集方針</a><a href="${href("contact/")}">お問い合わせ</a><a href="${href("privacy/")}">プライバシー</a><a href="${href("terms/")}">利用条件</a><a href="${site.repository}">GitHub ↗</a></nav></footer></div></body></html>`;
}

const cards = (items: Guide[]) =>
  `<div class="guide-grid">${items.map((guide) => `<a class="guide-card" href="${guideHref(guide.slug)}"><span class="eyebrow">${escape(guide.category)} / ${String(guides.indexOf(guide) + 1).padStart(2, "0")}</span><h3>${escape(guide.title)}</h3><p>${escape(guide.description)}</p><span class="card-link">読む →</span></a>`).join("")}</div>`;

export function renderIndex() {
  return page(
    "ギターの音楽理論・学習ガイド",
    "指板の音名、読譜、コードトーン、スケールを学ぶ14のガイド。解説から音と指板のリファレンスへ。",
    "guides/",
    `
    <div class="page-heading"><div><p class="eyebrow">LEARN. TRY. CONNECT.</p><h1>読んで、聴いて、つながる。</h1><p class="intro">指板の音名から、コードとスケールの関係へ。<br>一つずつ読み、音を鳴らして確かめる14のガイド。</p></div><span class="chapter">14<span>GUIDES</span></span></div>
    <section class="learning-start"><h2>はじめての方へ</h2><p>音名や読譜に不安があれば「音と読譜」から。コードの形は知っているけれど構成音がわからない方は「コード」へ。各記事の「この例を試す」でリファレンスを開き、図と音を照合できます。</p><a class="text-link" href="${guideHref("fretboard-notes")}">最初のガイドを読む →</a></section>
    <nav class="category-links" aria-label="テーマから探す"><a href="#notes">音と読譜 / 04</a><a href="#chords">コード / 04</a><a href="#scales">スケール / 06</a></nav>
    ${(
      [
        ["音と読譜", "notes", "01"],
        ["コード", "chords", "02"],
        ["スケール", "scales", "03"],
      ] as const
    )
      .map(
        ([category, id, num]) =>
          `<section class="guide-category" id="${id}"><p class="eyebrow">CHAPTER ${num}</p><h2>${category}</h2>${cards(guides.filter((guide) => guide.category === category))}</section>`,
      )
      .join("")}
  `,
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "OTO 学習ガイド",
      url: url("guides/"),
      inLanguage: "ja",
      mainEntity: {
        "@type": "ItemList",
        itemListElement: guides.map((guide, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: guide.title,
          url: url(`guides/${guide.slug}/`),
        })),
      },
    },
  );
}

function diagram(guide: Guide) {
  if (guide.example.view === "notes") {
    const midi = guide.example.pitch!;
    const rows = [...tuning]
      .reverse()
      .map((open, i) => {
        const fret = midi - open;
        return `<tr><th scope="row">${6 - i}弦</th><td>${noteName(open)}${octave({ midi: open, name: noteName(open), degree: "1" })}</td><td>${fret >= 0 && fret <= 22 ? `${fret}フレット` : "この弦の0〜22フレットにはありません"}</td></tr>`;
      })
      .join("");
    const tone = { midi, name: noteName(midi), degree: "1" };
    return `<figure class="tone-figure"><figcaption>同じ音高を探す：実音 ${tone.name}${octave(tone)} / ギターの記音 ${tone.name}${octave(tone, true)}</figcaption><div class="table-scroll"><table><thead><tr><th scope="col">弦</th><th scope="col">開放弦の実音</th><th scope="col">選んだ音の位置</th></tr></thead><tbody>${rows}</tbody></table></div></figure>`;
  }
  const formula = (guide.example.view === "chords" ? chords : scales).find(
    (item) => item.id === (guide.example.chord ?? guide.example.scale),
  )!;
  const groups = [{ label: `${guide.example.root} ${formula.label}`, formula }];
  if (guide.example.compare)
    groups.push({
      label: `${guide.example.root} ${scales.find((s) => s.id === guide.example.compare)!.label}`,
      formula: scales.find((s) => s.id === guide.example.compare)!,
    });
  if (guide.slug === "seventh-chords")
    for (const id of ["7", "m7"])
      groups.push({
        label: `C ${chords.find((c) => c.id === id)!.label}`,
        formula: chords.find((c) => c.id === id)!,
      });
  if (guide.slug === "major-minor")
    groups.push({ label: "C メジャー", formula: chords[0] });
  let markup = groups
    .map(({ label, formula }, i) => {
      const notes = invert(
        tones(guide.example.root, formula.degrees),
        i === 0 ? (guide.example.inv ?? 0) : 0,
      );
      return `<div class="diagram-row"><strong>${escape(label)}</strong><ol class="tone-diagram">${notes.map((tone) => `<li><span>${escape(tone.name)}</span><small>${tone.degree === "1" ? "R" : `${escape(tone.degree)}度`}</small></li>`).join("")}</ol></div>`;
    })
    .join("");
  if (guide.slug === "diatonic-chords") {
    markup += `<div class="table-scroll"><table><thead><tr><th scope="col">ルート</th><th scope="col">三和音</th><th scope="col">七の和音</th></tr></thead><tbody>${diatonic(
      "C",
      false,
      scales[0],
    )
      .map((chord, i) => {
        const seventh = diatonic("C", true, scales[0])[i];
        return `<tr><th scope="row">${chord.root}</th><td>${chord.root}${escape(chordSuffix[chord.formula.id])}</td><td>${seventh.root}${escape(chordSuffix[seventh.formula.id])}</td></tr>`;
      })
      .join("")}</tbody></table></div>`;
  }
  return `<figure class="tone-figure"><figcaption>音名と度数で見る構成音</figcaption>${markup}</figure>`;
}

export function adMarkup(
  enabled = site.adsense.enabled,
  slot = site.adsense.slot,
) {
  if (!enabled || !/^\d+$/.test(slot)) return "";
  // The script is article-only; no client-side navigation or automatic ad refresh.
  return `<aside class="article-ad" aria-label="広告"><p>広告</p><ins class="adsbygoogle" style="display:block" data-ad-client="${site.adsense.client}" data-ad-slot="${escape(slot)}" data-ad-format="auto" data-full-width-responsive="true"></ins></aside>
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${site.adsense.client}" crossorigin="anonymous"></script><script>(window.adsbygoogle=window.adsbygoogle||[]).push({});</script>`;
}

export function renderGuide(guide: Guide, ads = site.adsense) {
  const path = `guides/${guide.slug}/`;
  const published = guide.published ?? site.published;
  const updated = guide.updated ?? published;
  const index = guides.indexOf(guide);
  const structured = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: guide.title,
        description: guide.description,
        mainEntityOfPage: url(path),
        image: url("ogp.png"),
        author: { "@type": "Person", name: site.author, url: url("about/") },
        datePublished: published,
        dateModified: updated,
        inLanguage: "ja",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "OTO", item: url() },
          {
            "@type": "ListItem",
            position: 2,
            name: "学習ガイド",
            item: url("guides/"),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: guide.title,
            item: url(path),
          },
        ],
      },
    ],
  };
  return page(
    guide.title,
    guide.description,
    path,
    `<nav class="breadcrumbs" aria-label="パンくず"><a href="${href()}">OTO</a><span>/</span><a href="${href("guides/")}">学習ガイド</a><span>/</span><span>${escape(guide.category)}</span></nav>
    <article class="guide-article"><header class="article-header"><p class="eyebrow">${escape(guide.category)} / GUIDE ${String(index + 1).padStart(2, "0")}</p><h1>${escape(guide.title)}</h1><p class="intro">${escape(guide.description)}</p><p class="article-meta">執筆・編集：<a href="${href("about/")}">${site.author}</a> / 更新：<time datetime="${escape(updated)}">${escape(updated.replaceAll("-", "."))}</time></p></header>
    <nav class="article-toc" aria-label="この記事の目次"><h2>この記事で学ぶこと</h2><ol>${guide.sections.map((section, i) => `<li><a href="#section-${i + 1}">${escape(section.heading)}</a></li>`).join("")}<li><a href="#practice">音と指板で確かめる</a></li></ol></nav>
    ${guide.sections.map((section, i) => `<section class="article-section" id="section-${i + 1}"><h2>${escape(section.heading)}</h2>${p(section.paragraphs)}${i === 0 ? diagram(guide) : ""}</section>`).join("")}
    <section class="practice-box" id="practice"><p class="eyebrow">TRY THIS</p><h2>音と指板で確かめる</h2><ol>${guide.practice.map((step) => `<li>${escape(step)}</li>`).join("")}</ol><a class="try-link" href="${escape(toolHref(guide))}">この例を試す ↗</a><p class="practice-note">リファレンスが開きます。再生ボタンを押すと音が鳴ります。</p><details><summary>確認のポイント</summary><p>${escape(guide.answer)}</p></details></section>
    </article>${adMarkup(ads.enabled, ads.slot)}<section class="related-guides"><h2>理解をつなげる次のガイド</h2>${cards(guide.related.map((slug) => guides.find((item) => item.slug === slug)!))}</section><p class="back-to-guides"><a class="text-link" href="${href("guides/")}">← 学習ガイド一覧へ</a></p>`,
    structured,
  );
}

export function renderInfoPages() {
  const info = [
    {
      path: "about/",
      title: "このサイトについて・編集方針",
      description: "OTOの目的、運営者、解説と図の編集方針を紹介します。",
      sections: [
        {
          heading: "音と、指板のあいだ。",
          paragraphs: [
            "OTOは五線譜・指板・音をつなぐ、日本語のギター学習用リファレンスです。運営・編集はmasapico。読譜を学ぶ方や、コードの押さえ方から音楽理論へ進みたい方が、目と耳で音の関係を確認できる場所を目指しています。",
          ],
        },
        {
          heading: "編集方針",
          paragraphs: [
            "解説は音名・度数・構成音と具体例を結びつけて作成しています。記事内の構成音の図とリファレンスには共通の音楽理論データを使用し、表記と再生の対応を検証します。教本の譜例・音源は収録せず、説明と例はサイト独自に作成します。",
            "コードの構成音表示と押弦フォーム、スケール内に含まれる音と和声的な適合性、音名と音高を区別して説明します。誤りや不明点の連絡を受けた場合は内容を確認し、必要に応じて修正します。更新日は各記事に表示します。",
          ],
        },
        {
          heading: "リファレンスでできること",
          paragraphs: [
            "標準6弦ギターの0〜22フレット、コードトーンと転回形、スケール比較、スケールから生まれる和音、短い確認問題を扱います。選択条件はURLに保持でき、ブックマークして再利用できます。音は端末内で生成する合成音で、録音や実際の演奏の判定は行いません。",
          ],
        },
      ],
    },
    {
      path: "contact/",
      title: "お問い合わせ",
      description: "OTOの不具合、解説の訂正、改善提案についての連絡方法。",
      sections: [
        {
          heading: "不具合・訂正・ご提案",
          paragraphs: [
            "お問い合わせはGitHub Issuesで受け付けています。記事の訂正は該当ページのURLと気になる箇所を、不具合は端末・ブラウザ・再現手順を添えてお知らせください。GitHubへの投稿にはアカウントが必要です。",
            "投稿内容は公開されます。メールアドレス、住所などの個人情報や機密情報は書き込まないでください。個別の演奏指導や返信期限を保証するものではありません。",
          ],
        },
      ],
    },
    {
      path: "privacy/",
      title: "プライバシーポリシー",
      description:
        "OTOのデータの扱い、Google AdSenseとCookie、外部サービスについて。",
      sections: [
        {
          heading: "学習ツールのデータ",
          paragraphs: [
            "OTOはログイン、演奏の録音、マイク入力、学習履歴のサーバー保存を行いません。主音やスケールなどの選択条件はURLのハッシュ部分に反映します。音声は端末内で合成し、演奏データを送信しません。",
          ],
        },
        {
          heading: "広告とCookie",
          paragraphs: [
            "当サイトはGoogle AdSenseによる広告掲載を予定しています。広告の配信を有効にしたページでは、Googleなどの第三者配信事業者がCookieや類似技術を使い、当サイトや他のサイトへのアクセスに基づいて広告を配信することがあります。Googleの広告Cookieにより、Googleとそのパートナーは利用者に合わせた広告を表示できます。",
            "広告に関連してIPアドレス、端末やブラウザの情報、広告とのやり取りなどが事業者に送信される場合があります。Googleの広告設定からパーソナライズ広告を管理できます。対象地域では同意管理メッセージにより、利用する目的や提供先を確認し、選択・変更できます。",
            "Cookieはブラウザの設定でも制御できます。広告を制限しても学習記事とリファレンスは利用できます。",
            site.adsense.enabled && /^\d+$/.test(site.adsense.slot)
              ? "現在は解説記事の本文末尾にGoogle AdSenseの広告枠を設置しています。学習ツール・確認問題・記事一覧・運営情報には広告を掲載していません。"
              : "現在は広告配信用スクリプトを読み込まず、所有確認用のmetaタグのみ設置しています。広告の配信を開始した際は本ページに掲載状況を表示します。",
          ],
        },
        {
          heading: "公開基盤と外部サービス",
          paragraphs: [
            "サイトはGitHub Pagesで公開します。ホスティング提供者はサービスの運用・保護のためにアクセス情報を扱う場合があります。お問い合わせはGitHub Issuesを利用し、投稿者の情報と投稿内容はGitHub上で公開されます。",
            "検索流入の把握にはGoogle Search Consoleの集計を使用する方針です。Google Analyticsは導入していません。外部リンク先のデータの扱いは、各サービスのポリシーをご確認ください。",
          ],
        },
        {
          heading: "変更とお問い合わせ",
          paragraphs: [
            "広告設定や外部サービスの利用が変わった場合は本ページを更新します。データの扱いについてのご質問はお問い合わせページからお寄せください。制定・更新日：2026年10月4日。運営者：masapico。",
          ],
        },
      ],
    },
    {
      path: "terms/",
      title: "利用条件",
      description:
        "OTOの利用にあたっての学習上の注意点、著作物と外部サービスについて。",
      sections: [
        {
          heading: "学習用途での利用",
          paragraphs: [
            "記事とリファレンスはギターの音楽理論を学ぶために無料で利用できます。解説は一般的な理論の理解を助けるもので、個々の楽曲や演奏に対する唯一の解釈を示すものではありません。音声再生時は音量を調整してご利用ください。",
            "情報の正確性と動作の改善に努めますが、内容の完全性やすべての環境での動作を保証するものではありません。内容や機能は更新・変更・終了する場合があります。",
          ],
        },
        {
          heading: "文章・図・ソフトウェア",
          paragraphs: [
            "当サイトの文章・図の無断転載はご遠慮ください。引用の際は適用される法令に従い、出典を明示してください。記事や設定済みURLへのリンクは歓迎します。",
            "公開ソースコードおよび使用ライブラリは、リポジトリや各配布物に記載されたライセンス条件を確認してください。第三者の教本、譜面、録音の権利を当サイトが許諾するものではありません。",
          ],
        },
        {
          heading: "外部サービス",
          paragraphs: [
            "GitHubやGoogleなどの外部サービスは、それぞれの利用条件に従ってご利用ください。広告の内容やリンク先は広告主が提供します。サイトの不具合や解説の訂正はお問い合わせページへお知らせください。制定・更新日：2026年10月4日。",
          ],
        },
      ],
    },
  ];
  return info.map((item) => ({
    path: item.path,
    html: page(
      item.title,
      item.description,
      item.path,
      `<div class="info-page"><p class="eyebrow">ABOUT OTO</p><h1>${item.title}</h1>${item.sections.map((section) => `<section class="article-section"><h2>${section.heading}</h2>${p(section.paragraphs)}</section>`).join("")}${item.path === "contact/" ? `<a class="try-link" href="${site.repository}/issues/new">GitHubで問い合わせる ↗</a>` : ""}${item.path === "privacy/" ? `<ul class="policy-links"><li><a href="https://policies.google.com/technologies/partner-sites?hl=ja">Googleによるサイト利用情報の取り扱い</a></li><li><a href="https://myadcenter.google.com/">Googleの広告設定</a></li><li><a href="https://www.aboutads.info/choices/">第三者配信事業者の広告設定</a></li><li><a href="https://docs.github.com/ja/site-policy/privacy-policies/github-general-privacy-statement">GitHubのプライバシーポリシー</a></li></ul>` : ""}<p class="back-to-guides"><a class="text-link" href="${href("contact/")}">お問い合わせ</a> / <a class="text-link" href="${href("guides/")}">学習ガイドへ</a></p></div>`,
    ),
  }));
}

export function sitePages() {
  return [
    { path: "guides/", html: renderIndex() },
    ...guides.map((guide) => ({
      path: `guides/${guide.slug}/`,
      html: renderGuide(guide),
    })),
    ...renderInfoPages(),
  ];
}

export function sitemap() {
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[
    "",
    ...sitePages().map((page) => page.path),
  ]
    .map((path) => {
      const guide = guides.find((guide) => path === `guides/${guide.slug}/`);
      const updated = guide
        ? (guide.updated ?? guide.published ?? site.published)
        : site.updated;
      return `<url><loc>${url(path)}</loc><lastmod>${escape(updated)}</lastmod></url>`;
    })
    .join("")}</urlset>`;
}
