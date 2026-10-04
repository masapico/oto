import { test, expect } from "@playwright/test";
test("reference navigation, sound, chord relations and bookmark restoration", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("./");
  await expect(
    page.getByRole("heading", { name: "和音を、一音ずつほどく。" }),
  ).toBeVisible();
  await page.getByLabel("CHORD / コード").selectOption("maj7");
  await expect(page.locator(".tone-row").last()).toContainText("B");
  await page.getByRole("button", { name: "▶ 和音で聴く" }).click();
  await expect(page.locator(".playing-state")).toHaveText("再生中");
  await expect(page.locator(".tone-row.sounding")).toHaveCount(4);
  await page.getByRole("button", { name: "停止", exact: true }).click();
  await expect(page.locator(".tone-row.sounding")).toHaveCount(0);
  await page.getByLabel("VOICING / 転回形").selectOption("1");
  await expect(page.locator(".tone-row").first()).toContainText("E");
  const url = page.url();
  await page.reload();
  expect(page.url()).toBe(url);
  await expect(page.getByLabel("VOICING / 転回形")).toHaveValue("1");
  await page.getByRole("button", { name: "03 スケール" }).click();
  await page.locator(".harmonies button").nth(1).click();
  await expect(page.locator(".tone-panel")).toContainText("Dm7");
  await expect(page.locator(".tone-panel")).toContainText("スケールでは 4");
  await page.getByLabel("SCALE / スケール").selectOption("melodic");
  await expect(page.getByLabel("下行の扱い")).toBeVisible();
  await page.getByRole("button", { name: "↘ 下行" }).click();
  await page.getByRole("button", { name: "04 理解の確認" }).click();
  await expect(page.locator(".answer")).toHaveCount(0);
  await page
    .locator(".answer-options button")
    .filter({ hasText: /^C$/ })
    .click();
  await expect(page.locator(".answer")).toContainText("正解です");
  await page.getByRole("button", { name: "01 音符と指板" }).click();
  await page
    .getByRole("button", { name: "6弦 0フレット E2", exact: true })
    .click();
  await expect(page.locator(".aside-note").first()).toContainText(
    "実音 E2 → 記音 E3",
  );
  await page.reload();
  await expect(page.getByLabel("PITCH / 音の高さ")).toHaveValue("40");
  expect(errors).toEqual([]);
});
test("mobile layout, invalid URL and keyboard interaction", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#view=bad&root=bad&from=22&to=-1");
  await expect(page.getByLabel("ROOT / 主音")).toHaveValue("C");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const note = page.getByRole("button", {
    name: "1弦 0フレット E4",
    exact: true,
  });
  await note.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".playing-state")).toHaveText("再生中");
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
});

test("actual audio output, stop, alternate pitches, and melodic descent", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const Native = window.AudioContext;
    const meters: AnalyserNode[] = [];
    (window as unknown as { meters: AnalyserNode[] }).meters = meters;
    window.AudioContext = class extends Native {
      createGain() {
        const gain = super.createGain();
        const meter = this.createAnalyser();
        const mute = super.createGain();
        mute.gain.value = 0;
        gain.connect(meter);
        meter.connect(mute);
        mute.connect(this.destination);
        meters.push(meter);
        return gain;
      }
    };
  });
  await page.goto("./");
  await page.getByRole("button", { name: "▶ 和音で聴く" }).click();
  const energy = () =>
    page.evaluate(() =>
      Math.max(
        ...(window as unknown as { meters: AnalyserNode[] }).meters.map((m) => {
          const data = new Float32Array(m.fftSize);
          m.getFloatTimeDomainData(data);
          return data.reduce((s, v) => s + v * v, 0);
        }),
        0,
      ),
    );
  await expect.poll(energy).toBeGreaterThan(0.0001);
  await page.getByRole("button", { name: "停止", exact: true }).click();
  await expect.poll(energy).toBe(0);
  await page
    .getByRole("button", { name: "1弦 0フレット E4", exact: true })
    .click();
  await expect(page.locator(".inspection")).toContainText("実音 E4 / 記音 E5");
  await expect(page.locator(".staff-scroll [role=button]")).toHaveAttribute(
    "aria-label",
    "E4を再生",
  );
  await page.getByRole("button", { name: "03 スケール" }).click();
  await page.getByLabel("SCALE / スケール").selectOption("melodic");
  await page.getByRole("button", { name: "↘ 下行" }).click();
  await expect(page.locator(".tone-panel")).toContainText("B♭");
  await expect(page.locator(".tone-panel")).toContainText("A♭");
  await expect(page.locator(".direction-label")).toContainText("自然短音階");
  await page.getByLabel("下行の扱い").selectOption("jazz");
  await page.getByRole("button", { name: "↘ 下行" }).click();
  await expect(page.locator(".tone-row").last()).toContainText("B");
  await expect(page.locator(".tone-panel")).not.toContainText("B♭");
});

test("all chord and scale spellings render; desktop reference is usable", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("./");
  for (const root of ["C♯", "G♭", "B"]) {
    await page.getByLabel("ROOT / 主音").selectOption(root);
    for (const chord of [
      "maj",
      "min",
      "dim",
      "aug",
      "maj7",
      "7",
      "m7",
      "mMaj7",
      "m7b5",
      "dim7",
    ]) {
      await page.getByLabel("CHORD / コード").selectOption(chord);
      await expect(page.locator(".staff-scroll svg")).toBeVisible();
    }
  }
  await page.getByRole("button", { name: "03 スケール" }).click();
  for (const scale of [
    "major",
    "natural",
    "harmonic",
    "melodic",
    "majorPent",
    "minorPent",
    "blues",
  ]) {
    await page.getByLabel("SCALE / スケール").selectOption(scale);
    await expect(page.locator(".staff-scroll svg")).toBeVisible();
  }
  await page.goto("./#view=chords&root=C&chord=maj7");
  await expect(page.locator(".staff-scroll svg")).toBeVisible();
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
  expect(errors).toEqual([]);
});

test("guitar chord has staggered attacks, pitched string samples and audible sustain", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const Native = window.AudioContext;
    const sources: { buffer: AudioBufferSourceNode; at: number }[] = [];
    (window as unknown as { stringSources: typeof sources }).stringSources =
      sources;
    window.AudioContext = class extends Native {
      createBufferSource() {
        const source = super.createBufferSource();
        const start = source.start.bind(source);
        source.start = (at = 0) => {
          sources.push({ buffer: source, at });
          start(at);
        };
        return source;
      }
    };
  });
  await page.goto("./#view=chords&root=C&chord=maj");
  await page.getByRole("button", { name: "▶ 和音で聴く" }).click();
  const sound = await page.evaluate(() => {
    const sources = (
      window as unknown as {
        stringSources: { buffer: AudioBufferSourceNode; at: number }[];
      }
    ).stringSources;
    return sources.map(({ buffer: source, at }, index) => {
      const buffer = source.buffer!;
      const samples = buffer.getChannelData(0);
      const frequency = 440 * 2 ** (([48, 52, 55][index] - 69) / 12);
      let real = 0,
        imaginary = 0,
        peak = 0,
        tail = 0;
      const begin = Math.floor(buffer.sampleRate * 0.1);
      const end = Math.floor(buffer.sampleRate * 0.3);
      for (let i = 0; i < samples.length; i++) {
        peak = Math.max(peak, Math.abs(samples[i]));
        if (i >= begin && i < end) {
          const phase = (2 * Math.PI * frequency * i) / buffer.sampleRate;
          real += samples[i] * Math.cos(phase);
          imaginary += samples[i] * Math.sin(phase);
        }
        if (i >= buffer.sampleRate && i < buffer.sampleRate * 1.1)
          tail += samples[i] ** 2;
      }
      return {
        at,
        peak,
        fundamental: (2 * Math.hypot(real, imaginary)) / (end - begin),
        tail,
      };
    });
  });
  expect(sound).toHaveLength(3);
  expect(sound[1].at - sound[0].at).toBeCloseTo(0.014, 5);
  expect(sound[2].at - sound[1].at).toBeCloseTo(0.014, 5);
  for (const voice of sound) {
    expect(voice.peak).toBeLessThanOrEqual(1.000001);
    expect(voice.fundamental).toBeGreaterThan(0.3);
    expect(voice.tail).toBeGreaterThan(1);
  }
  await page.waitForTimeout(1000);
  await expect(page.locator(".playing-state")).toHaveText("再生中");
  await expect(page.locator(".playing-state")).toHaveText("クリックして試聴", {
    timeout: 4000,
  });
  await expect(page.locator(".tone-row.sounding")).toHaveCount(0);
});
