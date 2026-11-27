import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",

  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,

  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],

  timeout: 30000,
  expect: {
    timeout: 10000,
  },

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10000,
    navigationTimeout: 20000,
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],

  outputDir: "test-results",
});
