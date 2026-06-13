import node from "@astrojs/node";
import react from "@astrojs/react";
// Built sandboxed descriptor for @carte/core (emdash-plugin build → dist/index.mjs).
// The harness `dev`/`build` scripts run `pnpm --filter @carte/core build` first so
// this import resolves. Do NOT hand-roll the descriptor — the plugin-cli emits it.
import carteCore from "@carte/core";
// Built sandboxed descriptor for @carte/harness-probe (emdash-plugin build →
// dist/index.mjs). The harness `dev`/`build` scripts run the probe build first
// so this import resolves. The plugin-cli emits the canonical descriptor the
// sandboxed-plugins virtual module consumes — do NOT hand-roll it.
import carteHarnessProbe from "@carte/harness-probe";
import carteOrdersBackend from "@carte/orders-backend";
import carteReservations from "@carte/reservations";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "astro/config";
import emdash, { local } from "emdash/astro";
import { sqlite } from "emdash/db";

// Native-plugin entrypoints are inlined into the `virtual:emdash/plugins`
// module as `import { createPlugin } from "<entrypoint>"`. A relative path
// (e.g. "./src/native-probe.ts") only resolves under the Vite dev server,
// which anchors it to the project root; `astro build`'s Rollup pass anchors
// it to the synthetic virtual module id and fails to resolve. An absolute
// path resolves identically in both modes.
const HERE = dirname(fileURLToPath(import.meta.url));
const nativeProbeEntrypoint = resolve(HERE, "src/native-probe.ts");

const probePlugin = carteHarnessProbe;

function nativeProbePlugin() {
  return {
    id: "carte-native-probe",
    version: "0.1.0",
    entrypoint: nativeProbeEntrypoint,
  };
}

export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [
    react(),
    emdash({
      database: sqlite({ url: "file:./data.db" }),
      storage: local({
        directory: "./uploads",
        baseUrl: "/_emdash/api/media/file",
      }),
      plugins: [nativeProbePlugin()],
      sandboxed: [probePlugin, carteCore, carteReservations, carteOrdersBackend],
      sandboxRunner: "@emdash-cms/sandbox-workerd",
    }),
  ],
  server: {
    port: 4321,
  },
});
