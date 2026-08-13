import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

// Requires a live Supabase project with migrations + seed.sql applied, and
// PLAYWRIGHT_STAFF_EMAIL / PLAYWRIGHT_STAFF_PASSWORD for the login->POS flow — see
// tests/e2e/README.md.
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "pnpm dev",
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
