import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  workers: 1,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "desktop", use: { browserName: "chromium", viewport: { width: 1366, height: 900 } } },
    { name: "tablet", use: { browserName: "chromium", viewport: { width: 768, height: 1024 } } },
    { name: "mobile", use: { browserName: "chromium", viewport: { width: 375, height: 812 } } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    env: {
      CANTU_E2E_AUTH_MOCK: "1",
      CANTU_E2E_STT_MOCK: "1",
      CANTU_E2E_ANALYSIS_MOCK: "1",
      CANTU_E2E_PRACTICE_MOCK: "1",
    },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
