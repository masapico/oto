import { test, expect } from "@playwright/test";

const bookmark =
  "root=E&chord=maj&scale=major&from=0&to=5&inv=0&melodic=classic&pitch=65&compare=&direction=up&harmony=&sevenths=1";

for (const view of ["notes", "chords", "scales", "quiz"]) {
  test(`${view}: Safari native media plays, stops, replays and releases audio`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "userAgent", {
        value:
          "Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 Version/27.0 Safari/605.1.15",
      });
      const probe = {
        media: null as HTMLAudioElement | null,
        plays: [] as boolean[],
        waves: [] as ArrayBuffer[],
        released: [] as string[],
      };
      (window as any).mediaProbe = probe;
      // A Safari-specific silent AudioContext cannot affect this playback path.
      window.AudioContext = class {
        constructor() {
          throw new Error("Web Audio unavailable");
        }
      } as unknown as typeof AudioContext;
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () {
        probe.media = this as HTMLAudioElement;
        probe.plays.push(navigator.userActivation.isActive);
        return play.call(this);
      };
      const create = URL.createObjectURL.bind(URL);
      URL.createObjectURL = (blob) => {
        if (blob instanceof Blob)
          void blob.arrayBuffer().then((wave) => probe.waves.push(wave));
        return create(blob);
      };
      const revoke = URL.revokeObjectURL.bind(URL);
      URL.revokeObjectURL = (url) => {
        probe.released.push(url);
        revoke(url);
      };
    });
    await page.goto(`./#view=${view}&${bookmark}`);
    expect(
      await page.evaluate(() => (window as any).mediaProbe.media),
    ).toBeNull();
    if (view === "quiz")
      await page.locator(".answer-options button").first().click();
    const button = page.getByRole("button", {
      name: {
        notes: "▶ この音を聴く",
        chords: "▶ 和音で聴く",
        scales: "↗ 上行",
        quiz: "▶ 音で確認",
      }[view],
      exact: true,
    });
    await button.click();
    await expect
      .poll(() =>
        page.evaluate(() => (window as any).mediaProbe.media.currentTime),
      )
      .toBeGreaterThan(0.1);
    expect(await page.evaluate(() => (window as any).mediaProbe.plays)).toEqual(
      [true],
    );
    expect(
      await page.evaluate(() => {
        const view = new DataView((window as any).mediaProbe.waves[0]);
        let energy = 0;
        for (let i = 44; i < view.byteLength; i += 2)
          energy += (view.getInt16(i, true) / 32767) ** 2;
        return energy;
      }),
    ).toBeGreaterThan(1);
    if (view !== "quiz")
      await expect(page.locator(".tone-row.sounding")).not.toHaveCount(0);
    await page
      .locator(".audio-settings")
      .getByRole("button", { name: "■ 停止", exact: true })
      .click();
    expect(
      await page.evaluate(() => (window as any).mediaProbe.media.paused),
    ).toBe(true);
    expect(
      await page.evaluate(() => (window as any).mediaProbe.released.length),
    ).toBe(1);
    await button.click();
    await expect
      .poll(() =>
        page.evaluate(() => (window as any).mediaProbe.media.currentTime),
      )
      .toBeGreaterThan(0.1);
    if (view !== "quiz") {
      await expect(page.locator(".playing-state")).toHaveText(
        "クリックして試聴",
        { timeout: 10000 },
      );
      await expect(page.locator(".tone-row.sounding")).toHaveCount(0);
    } else
      await expect
        .poll(() =>
          page.evaluate(() => (window as any).mediaProbe.released.length),
        )
        .toBe(2);
    expect(
      await page.evaluate(() => (window as any).mediaProbe.released.length),
    ).toBe(2);
    await expect(page.getByRole("alert")).toHaveCount(0);
  });
}

test("Safari rejected play is reported", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "userAgent", {
      value: "AppleWebKit/605.1.15 Safari/605.1.15",
    });
    HTMLMediaElement.prototype.play = () =>
      Promise.reject(new DOMException("Playback blocked", "NotAllowedError"));
  });
  await page.goto(`./#view=chords&${bookmark}`);
  await page.getByRole("button", { name: "▶ 和音で聴く" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "音を開始できませんでした",
  );
  await expect(page.locator(".playing-state")).toHaveText("クリックして試聴");
});

test("stopping a pending Safari play prevents late highlights or errors", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "userAgent", {
      value: "AppleWebKit/605.1.15 Safari/605.1.15",
    });
    HTMLMediaElement.prototype.play = () =>
      new Promise((_resolve, reject) => {
        (window as any).rejectPendingPlay = reject;
      });
  });
  await page.goto(`./#view=chords&${bookmark}`);
  await page.getByRole("button", { name: "▶ 和音で聴く" }).click();
  await page
    .locator(".audio-settings")
    .getByRole("button", { name: "■ 停止", exact: true })
    .click();
  await page.evaluate(() =>
    (window as any).rejectPendingPlay(
      new DOMException("Stopped", "AbortError"),
    ),
  );
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.locator(".tone-row.sounding")).toHaveCount(0);
  await expect(page.locator(".playing-state")).toHaveText("クリックして試聴");
});
