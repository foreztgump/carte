import node from "@astrojs/node";
import react from "@astrojs/react";
// Built sandboxed descriptor for @carte/core (emdash-plugin build → dist/index.mjs).
// The harness `dev`/`build` scripts run `pnpm --filter @carte/core build` first so
// this import resolves. Do NOT hand-roll the descriptor — the plugin-cli emits it.
import carteCore from "@carte/core";
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

const probePlugin = {
  id: "carte-harness-probe",
  version: "0.1.0",
  format: "standard",
  entrypoint: "@carte/harness-probe/sandbox",
  capabilities: ["content:read", "content:write"],
  allowedHosts: [],
  storage: {
    probe_claims: {
      indexes: ["kind", "slotKey"],
      uniqueIndexes: ["slotKey"],
    },
    hook_events: {
      indexes: ["hook", "collection", "isNew"],
    },
  },
  adminPages: [{ path: "/probe", label: "Probe", icon: "TestTube" }],
};

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
