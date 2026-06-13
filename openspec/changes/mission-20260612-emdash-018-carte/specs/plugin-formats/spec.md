# Spec delta: plugin-formats

## ADDED Requirements

### Requirement: Sandboxed-format plugins carry a manifest trust contract

`@carte/core`, `@carte/reservations`, and `@carte/orders-backend` SHALL each ship an `emdash-plugin.jsonc` declaring slug, publisher, license, author, security contact, minimal capabilities, allowedHosts, and storage collections (with indexes/uniqueIndexes). No capability, allowedHost, or storage declaration SHALL remain inline in plugin source.

#### Scenario: Manifest is the single trust contract

- **WHEN** `emdash-plugin validate` runs in CI for each sandboxed package
- **THEN** validation passes, and grep finds no inline `capabilities:`/`allowedHosts:`/`storage:` declarations in plugin descriptors

#### Scenario: Sandboxed plugins load under both runners

- **WHEN** the harness site loads core, reservations, and orders-backend via `sandboxed: []` with the Node-workerd runner and with `wrangler dev`
- **THEN** all three plugins activate, register hooks/routes, and serve admin pages under both runners

### Requirement: Sandboxed packages use the single-entrypoint plugin-cli shape

Each sandboxed package SHALL be a single `src/plugin.ts` bare default export `satisfies SandboxedPlugin` (type-only emdash import), built by `@emdash-cms/plugin-cli` (exact-pinned). The pre-v0.13 two-entrypoint layout and bespoke `wrangler.toml` packaging SHALL be removed.

#### Scenario: Obsolete layout purged

- **WHEN** CI grep gates run
- **THEN** zero hits for `sandbox-entry`, runtime `from "emdash"` imports in sandboxed packages, and per-package `wrangler.toml` plugin packaging

### Requirement: Native-format plugins use the documented 0.18 surface

`@carte/orders-admin` and `@carte/ai` SHALL use `definePlugin()` on real `emdash@^0.18` types, register via the harness `astro.config.mjs` `plugins: []`, and mount React admin via the documented 0.18 path. The documented path is: set `admin.entry` to the package's `./admin` **module specifier** (e.g. `@carte/orders-admin/admin`) — this is the canonical field the 0.18 runtime reads to flip a plugin to `adminMode: "react"` (verified: `node_modules/emdash/dist/astro/middleware.mjs` — `hasAdminEntry → adminMode = "react"`; the JSDoc on `PluginAdminConfig.entry` gives `"@emdash-cms/plugin-audit-log/admin"` as the example value) — and/or express settings via `admin.settingsSchema`. Obsolete descriptor fields (`entrypoint`, `format`, `adminEntry`, `adminPages`) SHALL NOT appear, and `admin.entry` SHALL NOT carry the dead pre-v0.13 **relative value** (`"admin/index.js"` or any relative `./…`/`.js` path) — only a bare package specifier is permitted.

#### Scenario: Native admin renders

- **WHEN** the harness site starts with both native plugins registered
- **THEN** each plugin's React admin renders in the panel (e2e evidence captured)
