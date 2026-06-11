import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    poolMatchGlobs: [["src/**/*.workers.test.ts", "@cloudflare/vitest-pool-workers"]],
    poolOptions: {
      workers: {
        wrangler: { configPath: "./wrangler.toml" },
      },
    },
  },
});
