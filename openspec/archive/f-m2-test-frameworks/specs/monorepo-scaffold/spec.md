# Monorepo Scaffold — Test Frameworks Spec

## Capability: Unified Vitest workspace runner

### Given the repo at `feature/PRO-m2-monorepo-scaffold` HEAD with f-m2-workspace landed

### When I run `pnpm test` from the repo root

### Then

- The command exits 0.
- A single Vitest process discovers and runs the smoke tests in all 6
  packages (`@carte/{core,reservations,orders-backend,orders-admin,views,ai}`).
- The reported test count is ≥ 12 (2 cases per package × 6 packages).
- The output identifies each package's project by its directory name, so
  failures are unambiguously attributed.

### Fulfills

- `A2.test.vitest` — one root command runs every package's Vitest suite.

## Capability: Playwright configured (no specs)

### Given the repo with `@playwright/test` installed at the root devDependency

### When I run `pnpm exec playwright --version`

### Then

- The command prints a version string and exits 0.

### And when I run `pnpm e2e` (mapped to `playwright test`)

### Then

- Playwright loads `playwright.config.ts` without error.
- It reports zero specs found (the `e2e/` directory is intentionally empty
  until per-plugin missions author specs).
- Exit code is 0 OR Playwright's documented "no tests found" non-zero code —
  either is acceptable since this feature only validates the config shape.

### Fulfills

- `A2.test.playwright` — Playwright config is loadable and the binary is
  reachable; specs are intentionally deferred.

## Capability: Per-package isolation preserved

### Given a developer running `pnpm -F @carte/<pkg> test` for any single package

### Then

- The package's local `vitest.config.ts` is honored.
- Only that package's tests run.
- Exit code is 0 when its tests pass.

This guarantees the workspace runner does not break per-package iteration.
