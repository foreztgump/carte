import { defineConfig } from "@playwright/test";

const E2E_DEFAULT_BASE_URL = "http://localhost:5173";
const E2E_TIMEOUT_MS = 30_000;

// Specs are intentionally absent — per-plugin missions (storefront, admin,
// AI chat) author their own under e2e/<plugin>/*.spec.ts. Browser binaries
// (`npx playwright install`) are a deploy-time concern and not installed by
// this scaffolding feature.
export default defineConfig({
  testDir: "./e2e",
  timeout: E2E_TIMEOUT_MS,
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: process.env.BASE_URL ?? E2E_DEFAULT_BASE_URL,
    trace: "on-first-retry",
  },
});
