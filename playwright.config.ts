import { defineConfig } from "@playwright/test";
const webkit = process.env.BROWSER_ENGINE === "webkit";
const production = process.env.PRODUCTION === "1";
const baseURL = "http://127.0.0.1:5173" + (production ? "/ideas/" : "/");
export default defineConfig({
  testDir: "tests/browser",
  use: {
    baseURL,
    browserName: webkit ? "webkit" : "chromium",
    launchOptions: webkit
      ? {}
      : {
          executablePath:
            process.env.CHROME_PATH ||
            (process.platform === "darwin"
              ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
              : undefined),
        },
    headless: true,
  },
  webServer: {
    command: production
      ? "npm run preview -- --port 5173 --base /ideas/"
      : "npm run dev -- --port 5173",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
