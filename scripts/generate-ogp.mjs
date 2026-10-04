import { chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";

const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    (process.platform === "darwin"
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : undefined),
});
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.setContent(`<!doctype html><html lang="ja"><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{margin:0;background:#f5f3ed;color:#293e35;font-family:"Helvetica Neue","Hiragino Kaku Gothic ProN",Arial,sans-serif}
    main{width:1200px;height:630px;padding:66px 80px;position:relative;overflow:hidden}
    .label{font-size:18px;letter-spacing:5px;color:#63715f}.brand{font-size:116px;letter-spacing:-12px;font-weight:600;line-height:1;margin:18px 0 35px}.brand span{color:#be593b}
    h1{font-size:48px;font-weight:500;letter-spacing:4px;margin:0 0 20px}p{font-size:24px;line-height:1.6;margin:0;color:#63715f}
    .diagram{position:absolute;right:75px;top:120px;width:290px;height:310px;opacity:.8;background:repeating-linear-gradient(0deg,transparent,transparent 49px,#aab8a4 49px,#aab8a4 51px)}
    .note{position:absolute;width:48px;height:48px;border-radius:50%;background:#285748;color:#fffef9;display:grid;place-items:center;font-size:22px;font-weight:600}
    .c{left:20px;top:260px;background:#be593b}.e{left:112px;top:159px}.g{left:204px;top:59px}
    footer{position:absolute;bottom:50px;left:80px;right:80px;border-top:1px solid #bfc9b7;padding-top:20px;font-size:17px;letter-spacing:2px}
    </style><main><div class="label">GUITAR REFERENCE & LEARNING GUIDES</div><div class="brand">o<span>t</span>o</div><h1>音と、指板のあいだ。</h1><p>五線譜・指板・音をつなぐ。<br>ギターの音楽理論を、目と耳で。</p><div class="diagram"><span class="note c">C</span><span class="note e">E</span><span class="note g">G</span></div><footer>SEE. HEAR. UNDERSTAND.　/　14 LEARNING GUIDES</footer></main></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: fileURLToPath(new URL("../public/ogp.png", import.meta.url)),
  });
} finally {
  await browser.close();
}
