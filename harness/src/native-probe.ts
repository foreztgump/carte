import { definePlugin } from "emdash";

export function createPlugin() {
  return definePlugin({
    id: "carte-native-probe",
    version: "0.1.0",
    capabilities: [],
    admin: {
      // Nested `admin.entry` flips runtime adminMode → "react"
      // (middleware.mjs ~L1439). A non-relative module specifier is enough;
      // runtime never resolves it (only used as a truthy flag).
      entry: "@carte/harness/native-probe-admin",
      pages: [{ path: "/probe-react", label: "Probe React", icon: "TestTube" }],
      settingsSchema: {
        probeEnabled: {
          type: "boolean",
          label: "Probe enabled",
          description: "Minimal settingsSchema probe for native admin mount.",
        },
      },
    },
  });
}
