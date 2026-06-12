import type { SandboxedPlugin } from "emdash/plugin";

/**
 * Sandboxed plugin entry. Keep the const annotation form because
 * the inline satisfies form fails plugin-cli declaration generation
 * under pnpm.
 */
const plugin: SandboxedPlugin = {
  routes: {
    ping: {
      public: true,
      handler: async () => ({
        ok: true,
        plugin: "carte-harness-probe",
      }),
    },
  },
};

export default plugin;
