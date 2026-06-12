import node from "@astrojs/node";
import react from "@astrojs/react";
import { defineConfig } from "astro/config";
import emdash, { local } from "emdash/astro";
import { sqlite } from "emdash/db";

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
    entrypoint: "./src/native-probe.ts",
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
      sandboxed: [probePlugin],
      sandboxRunner: "@emdash-cms/sandbox-workerd",
    }),
  ],
  server: {
    port: 4321,
  },
});
