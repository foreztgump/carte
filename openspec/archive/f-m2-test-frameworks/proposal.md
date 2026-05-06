# f-m2-test-frameworks — Vitest workspace runner + Playwright config

## Why

`f-m2-workspace` (PRO-429/PRO-430) landed 6 plugin packages, each shipping its
own colocated Vitest smoke test (12 cases total). They run today only via
`pnpm -r test` — i.e. one isolated Vitest invocation per package. There is no
unified runner, no Playwright wiring, and no `pnpm test`/`pnpm e2e` entry point
at the workspace root.

This change wires those existing tests into a single Vitest workspace runner
and adds a Playwright config (no specs — those are deferred to per-plugin
missions). It fulfills the M2 validation-contract assertions
`A2.test.vitest` and `A2.test.playwright`.

## What changes

- **Add root `vitest.workspace.ts`** listing all 6 packages as workspace
  projects. Vitest 2.1.9 is the locked version; `defineWorkspace` is the
  v2-idiomatic API for multi-project workspaces (see `design.md`).
- **Add a per-package `vitest.config.ts`** (one-line zero-extra-config wrapper)
  in each of the 6 packages so the workspace can reference them by directory.
- **Install `@playwright/test`** as a root devDependency (config-time only —
  browser binaries are deploy-time and not installed here).
- **Add root `playwright.config.ts`** with `testDir: "./e2e"`, no specs
  declared, and reasonable defaults (30s timeout, parallel, list reporter,
  baseURL via env).
- **Update root `package.json` scripts**:
  - `test` → `vitest run` (replaces the current `pnpm -r test` fan-out so
    `pnpm test` runs all 6 projects through one Vitest invocation)
  - `test:watch` → `vitest`
  - `e2e` → `playwright test`
  - `e2e:ui` → `playwright test --ui`
  - `pnpm -r typecheck`/`-r lint` keep their current top-level scripts.

## What does NOT change

- No new test cases. The 12 cases from f-m2-workspace are the ones that run.
- No Playwright specs. Plugin missions (e.g. `@carte/views`, `@carte/ai`)
  will author their own E2E specs against their own surfaces.
- No package source files in `packages/*/src/**` are touched.
- Vitest version stays at `^2.1.6` (resolved to `2.1.9`); no major bump.
- `@cloudflare/vitest-pool-workers` is NOT added in this feature. The Linear
  ticket mentions it as a desirable wiring, but no sandboxed package yet has a
  Workers handler that would benefit. It will be wired by the first sandboxed
  plugin mission that needs it (likely `@carte/orders-backend` for the Stripe
  webhook path) — that mission can introduce the pool config inside its own
  per-package `vitest.config.ts` without touching this workspace shape.

## Fulfills

- `A2.test.vitest` — a single root command runs every package's Vitest suite.
- `A2.test.playwright` — `playwright test` resolves a valid config and prints a
  version; specs are intentionally absent.
