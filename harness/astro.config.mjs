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
const nativeProbeAdminEntry = resolve(HERE, "src/native-probe-admin.tsx");

const probePlugin = carteHarnessProbe;

function nativeProbePlugin() {
  return {
    id: "carte-native-probe",
    version: "0.1.0",
    entrypoint: nativeProbeEntrypoint,
    adminEntry: nativeProbeAdminEntry,
  };
}

// Real native plugins. `entrypoint` → the package's named `createPlugin`
// export; `adminEntry` → the package's `./admin` module (named `pages`
// export). Package specifiers resolve under both `astro dev` (Vite) and
// `astro build` (Rollup) because workspace packages are symlinked into
// node_modules with `exports` maps for `.` and `./admin`.
function nativeOrdersAdminPlugin() {
  return {
    id: "carte-orders-admin",
    version: "0.1.0",
    entrypoint: "@carte/orders-admin",
    adminEntry: "@carte/orders-admin/admin",
  };
}

function nativeAiPlugin() {
  return {
    id: "carte-ai",
    version: "0.1.0",
    entrypoint: "@carte/ai",
    adminEntry: "@carte/ai/admin",
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
      plugins: [nativeProbePlugin(), nativeOrdersAdminPlugin(), nativeAiPlugin()],
      sandboxed: [probePlugin, carteCore, carteReservations, carteOrdersBackend],
      sandboxRunner: "@emdash-cms/sandbox-workerd",
    }),
  ],
  server: {
    port: 4321,
  },
  vite: {
    // Native plugin admin entries (native-probe-admin.tsx) are pulled in via
    // emdash's generated `virtual:emdash/admin-registry`. Without deduping,
    // Vite's dep-optimized @emdash-cms/admin bundle and the freshly-compiled
    // admin entry resolve SEPARATE React instances → "Invalid hook call /
    // more than one copy of React". Force a single React copy.
    resolve: {
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@emdash-cms/admin",
      ],
    },
  },
});
