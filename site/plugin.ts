import type { Plugin } from "vite";
import { readFileSync } from "node:fs";
import { site } from "./config";
import { metaTags, sitePages, sitemap } from "./render";

export function editorialSite(): Plugin {
  const css = () =>
    readFileSync(new URL("../src/style.css", import.meta.url), "utf8") +
    "\n" +
    readFileSync(new URL("./style.css", import.meta.url), "utf8");
  return {
    name: "oto-editorial-site",
    transformIndexHtml(html) {
      return html
        .replace(/<meta\s+name="description"[\s\S]*?\/>/, "")
        .replace(
          "</head>",
          `${metaTags("OTO — ギターリファレンス", "五線譜・指板・音をつなぐ、ギターのための音楽理論リファレンス。14の学習ガイドで音名、コードトーン、スケールを学び、音を鳴らして確かめる。")}</head>`,
        );
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = new URL(request.url ?? "/", "http://localhost")
          .pathname;
        if (pathname === `${site.base}site.css`) {
          response.setHeader("Content-Type", "text/css; charset=utf-8");
          response.end(css());
          return;
        }
        if (pathname === `${site.base}sitemap.xml`) {
          response.setHeader("Content-Type", "application/xml");
          response.end(sitemap());
          return;
        }
        const found = sitePages().find(
          (page) =>
            pathname === site.base + page.path ||
            pathname === (site.base + page.path).slice(0, -1),
        );
        if (!found) {
          next();
          return;
        }
        if (!pathname.endsWith("/")) {
          response.writeHead(301, { Location: `${pathname}/` });
          response.end();
          return;
        }
        response.setHeader("Content-Type", "text/html; charset=utf-8");
        response.end(found.html);
      });
    },
    generateBundle() {
      for (const page of sitePages())
        this.emitFile({
          type: "asset",
          fileName: `${page.path}index.html`,
          source: page.html,
        });
      this.emitFile({ type: "asset", fileName: "site.css", source: css() });
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: sitemap(),
      });
      this.emitFile({
        type: "asset",
        fileName: "404.html",
        source: `<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>ページが見つかりません | OTO</title><link rel="stylesheet" href="${site.base}site.css"><main class="info-page"><h1>ページが見つかりません</h1><p>URLをご確認いただくか、学習ガイドからお探しください。</p><a href="${site.base}guides/">学習ガイドへ</a> / <a href="${site.base}">リファレンスへ</a></main></html>`,
      });
    },
  };
}
