import { definePlugin } from "emdash";

export function createPlugin() {
  return definePlugin({
    id: "carte-native-probe",
    version: "0.1.0",
    capabilities: [],
    admin: {
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
