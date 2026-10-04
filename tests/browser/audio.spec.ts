import { test, expect } from "@playwright/test";

const bookmark =
  "root=E&chord=maj&scale=major&from=0&to=5&inv=0&melodic=classic&pitch=65&compare=&direction=up&harmony=&sevenths=1";

for (const view of ["notes", "chords", "scales", "quiz"]) {
  test(`${view} bookmark produces audio with a playback session`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      // Exercise the Web Audio backend independently of the host browser.
      Object.defineProperty(navigator, "userAgent", {
        value: "Chrome/140 AppleWebKit/537.36",
      });
      const session = { type: "auto" };
      Object.defineProperty(navigator, "audioSession", {
        configurable: true,
        value: session,
      });
      const Native = window.AudioContext;
      const probe = {
        meters: [] as AnalyserNode[],
        sessionTypes: [] as string[],
        contexts: [] as AudioContext[],
      };
      (window as unknown as { audioProbe: typeof probe }).audioProbe = probe;
      window.AudioContext = class extends Native {
        constructor() {
          super();
          probe.sessionTypes.push(session.type);
          probe.contexts.push(this);
        }
        createGain() {
          const gain = super.createGain();
          const meter = this.createAnalyser();
          const mute = super.createGain();
          mute.gain.value = 0;
          gain.connect(meter);
          meter.connect(mute);
          mute.connect(this.destination);
          probe.meters.push(meter);
          return gain;
        }
      };
    });
    await page.goto(`./#view=${view}&${bookmark}`);
    expect(
      await page.evaluate(() => (window as any).audioProbe.contexts.length),
    ).toBe(0);
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
    const energy = () =>
      page.evaluate(() =>
        Math.max(
          0,
          ...(window as any).audioProbe.meters.map((meter: AnalyserNode) => {
            const data = new Float32Array(meter.fftSize);
            meter.getFloatTimeDomainData(data);
            return data.reduce((sum, value) => sum + value * value, 0);
          }),
        ),
      );
    await button.click();
    await expect.poll(energy).toBeGreaterThan(0.0001);
    expect(
      await page.evaluate(() => (window as any).audioProbe.sessionTypes),
    ).toEqual(["playback"]);
    await page
      .locator(".audio-settings")
      .getByRole("button", { name: "■ 停止", exact: true })
      .click();
    await expect.poll(energy).toBe(0);
    // The shared player also recovers if the browser closes its audio context.
    await page.evaluate(() => (window as any).audioProbe.contexts[0].close());
    await button.click();
    await expect.poll(energy).toBeGreaterThan(0.0001);
    expect(
      await page.evaluate(() => (window as any).audioProbe.sessionTypes),
    ).toEqual(["playback", "playback"]);
    await expect(page.getByRole("alert")).toHaveCount(0);
  });
}

test("a rejected audio session setting still allows Web Audio playback", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "userAgent", {
      value: "Chrome/140 AppleWebKit/537.36",
    });
    Object.defineProperty(navigator, "audioSession", {
      value: {
        set type(_value: string) {
          throw new Error("Unsupported setting");
        },
      },
    });
  });
  await page.goto(`./#view=notes&${bookmark}`);
  await page.getByRole("button", { name: "▶ この音を聴く" }).click();
  await expect(page.locator(".playing-state")).toHaveText("再生中");
  await expect(page.getByRole("alert")).toHaveCount(0);
});
