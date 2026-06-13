import type { PluginAdminExports } from "emdash";

// Spike: prove a native React admin page renders end-to-end.
//
// The admin registry (emdash/dist/astro/index.mjs generateAdminRegistryModule
// ~L1101) emits `import * as adminN from "<adminEntry>"` and stores the whole
// MODULE NAMESPACE as `pluginAdmins[pluginId] = adminN`. At runtime the admin
// app reads `pluginAdmins[pluginId]?.pages` (NOT `.default.pages`), so `pages`
// MUST be a NAMED export — a `default` export is invisible to the resolver.
//
// Resolution then calls `jsx(PluginComponent, {})` (PluginPage ~L40094), so
// each `pages[path]` value is invoked as a COMPONENT. We store a component
// function (cast through the typed shape, which annotates it as JSX.Element).
function ProbeReactAdmin() {
  return <div data-testid="probe-react-admin">Probe React Admin OK</div>;
}

export const pages = {
  "/probe-react": ProbeReactAdmin,
} as unknown as PluginAdminExports["pages"];

const adminExports = { pages } as unknown as PluginAdminExports;

export default adminExports;
