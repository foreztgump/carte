# f-m2-test-frameworks — Design

## Vitest workspace API: `vitest.workspace.ts` over `projects:`

Vitest 2.1.x ships **two** ways to declare a multi-project workspace: a
top-level `projects:` field inside `defineConfig({ test: { projects: [...] }})`
and a separate `vitest.workspace.ts` file using `defineWorkspace`. The
`projects:` field is the v3+ idiomatic form, but **2.1.9 (the version locked
by f-m2-workspace) does NOT yet expose `projects:` in the top-level
`UserConfig`** — verified by grepping `node_modules/vitest/dist/node.d.ts`
and `node_modules/vitest/dist/config.d.ts`. The runtime knows about workspace
project files via the constant
`WORKSPACES_NAMES = ["vitest.workspace", "vitest.projects"]` in
`node_modules/vitest/dist/chunks/constants.fzPh7AOq.js`, and exposes
`defineWorkspace` from `vitest/config`.

Decision: use `vitest.workspace.ts` with `defineWorkspace`. It is the only
idiomatic multi-project shape supported on 2.1.9 without falling back to a
parallel install. When this repo upgrades to Vitest v3, swap the file for the
v3 `projects:` field inside `vitest.config.ts` — that is a one-commit migration
and out of scope for this feature.

## Why per-package `vitest.config.ts` shims

`defineWorkspace(["packages/core", ...])` resolves each entry as either a glob
matching test files OR a directory containing a `vitest.config.{ts,js,mjs}`.
Without a config file, Vitest 2.1.9 treats the entry as a glob, which then
finds **no spec files** (because the directory itself isn't a glob match for
`*.test.ts`) and reports the project as empty.

Two ways to resolve:

1. **Glob form**: list `"packages/*/src/**/*.test.ts"` instead of directories.
   Treats every package as one giant pile; loses per-project naming and any
   future per-package overrides (e.g., `orders-backend` adopting
   `@cloudflare/vitest-pool-workers`).
2. **Directory + per-package `vitest.config.ts` shim**: explicit, names every
   project after its directory, and lets each package later customize its test
   environment without touching the workspace file.

Decision: option (2). The shim is one line of code (`export default
defineConfig({})`) and pays for itself the moment any package needs a custom
test pool, environment, or alias — which `@carte/orders-backend` will when it
introduces the Workers vitest pool.

## Playwright at root, no specs

Playwright config lives at the repo root because Carte's eventual E2E surface
is cross-package (the storefront from `@carte/views` mounted on top of an
admin from `@carte/orders-admin`). Per-package Playwright configs would force
duplication of baseURL, retry, and reporter wiring. The single root config is
the simplest thing that works.

`testDir: "./e2e"` is declared but the directory does not yet exist. Playwright
does not error when its testDir is missing (verified via `playwright test
--list` in scratch testing during research) — it simply reports zero specs.
Per-plugin missions create `e2e/<plugin>/*.spec.ts` files when they have
something to test. Browser binaries (`npx playwright install`) are explicitly
NOT installed here; they're a deploy-time concern that the first plugin
mission to author a spec will handle.

## What's deferred

- **`@cloudflare/vitest-pool-workers` wiring** is mentioned in PRO-437 but
  belongs to the first sandboxed plugin that needs Workers-realistic unit
  tests (likely `@carte/orders-backend` for the Stripe webhook idempotency
  path). Adding it now would either pull in a Workers runtime for packages
  that don't need it, or require per-package pool configuration ahead of any
  consumer — both violate YAGNI. The per-package `vitest.config.ts` shim
  introduced in this feature is the natural extension point when the time
  comes.
- **Playwright specs**, browser install, and CI integration are deferred to
  the per-plugin missions and to `f-m2-ci-changesets-hygiene`.
