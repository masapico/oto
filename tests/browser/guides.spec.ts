import { test, expect } from "@playwright/test";
import { guides } from "../../site/content";
import { renderGuide } from "../../site/render";
import { site } from "../../site/config";

test("guides are readable without JavaScript and work at deep URLs", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}guides/`);
    await expect(page.locator(".guide-card")).toHaveCount(14);
    await page.getByRole("link", { name: "最初のガイドを読む" }).click();
    await expect(page.locator("h1")).toHaveText(
      "ギターの指板の音名：開放弦から覚える",
    );
    await expect(page.locator(".tone-figure")).toContainText(
      "実音 A2 / ギターの記音 A3",
    );
    await page.reload();
    await expect(page.locator(".article-section")).toHaveCount(3);
    await page.getByText("確認のポイント", { exact: true }).click();
    await expect(page.locator("details p")).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://masapico.github.io/oto/guides/fretboard-notes/",
    );
  } finally {
    await context.close();
  }
});

test("article links restore tool conditions and preserve existing bookmarks", async ({
  page,
}) => {
  const adRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("googlesyndication"))
      adRequests.push(request.url());
  });
  await page.goto("./guides/modes/");
  await page.getByRole("link", { name: "この例を試す" }).click();
  await expect(page.getByLabel("ROOT / 主音")).toHaveValue("C");
  await expect(page.getByLabel("SCALE / スケール")).toHaveValue("dorian");
  await expect(page.getByLabel("比較対象 B")).toHaveValue("natural");
  const bookmark = page.url();
  await page.reload();
  expect(page.url()).toBe(bookmark);
  await expect(page.getByLabel("SCALE / スケール")).toHaveValue("dorian");
  expect(adRequests).toEqual([]);
});

test("an enabled ad has one slot and a blocked ad script does not interrupt reading", async ({
  page,
}) => {
  const requests: string[] = [];
  await page.route("**/pagead/js/adsbygoogle.js?**", async (route) => {
    requests.push(route.request().url());
    await route.abort();
  });
  await page.goto("./guides/chord-tones/");
  await page.setContent(
    renderGuide(
      guides.find((guide) => guide.slug === "chord-tones")!,
      { ...site.adsense, enabled: true, slot: "1234567890" },
    ),
  );
  await expect(page.locator(".article-ad")).toHaveCount(1);
  await expect(page.locator(".adsbygoogle")).toHaveCount(1);
  await expect(page.locator(".article-section").first()).toContainText(
    "コードトーンは和音を構成する音です",
  );
  await expect(page.getByRole("link", { name: "この例を試す" })).toBeVisible();
  expect(requests).toHaveLength(1);
  await page.getByRole("link", { name: "この例を試す" }).click();
  await expect(page.getByLabel("CHORD / コード")).toHaveValue("maj");
});

test("mobile articles, topic navigation, contact and policy links", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./guides/");
  await page.getByRole("link", { name: "スケール / 06" }).click();
  expect(page.url()).toContain("#scales");
  await page.goto("./guides/diatonic-chords/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("link", { name: "音と指板で確かめる", exact: true })
    .click();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "この例を試す" })).toBeFocused();
  await page.screenshot({
    path: "test-results/guide-mobile.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "お問い合わせ", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "GitHubで問い合わせる" }),
  ).toHaveAttribute("href", "https://github.com/masapico/oto/issues/new");
  await page.getByRole("link", { name: "プライバシー", exact: true }).click();
  await expect(page.locator("h1")).toHaveText("プライバシーポリシー");
});

test("search and sharing assets are served under the production base path", async ({
  request,
}) => {
  const root = await request.get("./");
  expect(root.ok()).toBe(true);
  expect(await root.text()).toContain(
    'name="google-adsense-account" content="ca-pub-3056490289410063"',
  );
  const map = await request.get("./sitemap.xml");
  expect(map.ok()).toBe(true);
  expect((await map.text()).match(/<loc>/g)).toHaveLength(20);
  const image = await request.get("./ogp.png");
  expect(image.ok()).toBe(true);
  expect((await image.body()).subarray(0, 8).toString("hex")).toBe(
    "89504e470d0a1a0a",
  );
});
