# Proposal

Bootstrap the Carte monorepo as a pnpm workspace housing the six v0.1 plugin packages (`@carte/{core, reservations, orders-backend, orders-admin, views, ai}`). Each package gets a minimal `definePlugin()` skeleton declaring **only canonical capability names** (per the locked PR #816 names in EmDash 0.9.0) plus a Vitest smoke test asserting manifest shape. Root tooling lands in this change: TypeScript strict (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), ESLint flat config, Prettier, husky + lint-staged pre-commit. No plugin business logic — that is the job of later, per-plugin missions.

## What changes

- New `pnpm-workspace.yaml`, root `package.json` (with `packageManager: pnpm@10.19.0`), root `tsconfig.json`, root `eslint.config.js` (flat), `.prettierrc`, `.editorconfig`, `.gitignore` additions, husky pre-commit hook, lint-staged config.
- Six `packages/<plugin>/` directories, each with `package.json`, `tsconfig.json`, `src/index.ts`, `src/index.test.ts`, `README.md`. The `@carte/views` package is an Astro/React peer-dep library — it ships no `definePlugin` manifest and its smoke test asserts the named export shape only.

## What does NOT change

- No `wrangler.toml` files (deferred to `f-m2-wrangler`).
- No Vitest root config (`vitest.config.ts`) — deferred to `f-m2-test-frameworks`. Smoke tests in this change run via Vitest's zero-config defaults and the per-package `test` script.
- No CI workflows or Changesets (deferred to `f-m2-ci-changesets-hygiene`).
- No edits to `research/sources/carte/`, `CODE_PRINCIPLES.md`, `CLAUDE.md`, `PRD.md`, `AGENTS.md`.

## Discovered: `npm create emdash@latest` is incompatible with our workspace pattern

Ran `npm create emdash@latest` in `/tmp/emdash-scaffold-<ts>/` for inspection. It scaffolds a single Astro site (`my-site/`) with a flat layout — Astro app + Cloudflare adapter + the `emdash` runtime as a dependency. There is no workspace layout and no plugin-package template. We hand-roll the workspace per the SKILL pattern. The starter did confirm two useful facts: `definePlugin` is exported from the `emdash` package (`emdash/src/plugins/define-plugin.ts`), and the canonical capability list in 0.9.0 matches the names locked in `AGENTS.md`. The runtime accepts deprecated aliases at `definePlugin` time but rewrites them silently — Carte uses **canonical names only** in source.

## Type-shape note (worth recording)

`PluginDefinition.routes` in `emdash@^0.9.0` is `Record<string, PluginRoute>` where `PluginRoute = { handler: (ctx) => Promise<unknown>, public?, input? }`. The skill / PRD examples that show `routes: ["admin", "menu-feed"]` (string array) plus a sibling `export const handlers = {...}` would not satisfy `tsc --strict`. Carte's skeletons author routes as the canonical Record shape with stub handlers returning `{ ok: true, plugin, route }`.
