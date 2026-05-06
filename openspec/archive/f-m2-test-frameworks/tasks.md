# f-m2-test-frameworks — Tasks

Each task ≤ ~30min. Acceptance criteria map to validation-contract assertions.

## 1. Per-package `vitest.config.ts` shims

Add a one-line `vitest.config.ts` in each of the 6 packages:

```ts
import { defineConfig } from "vitest/config";
export default defineConfig({});
```

The empty config preserves zero-config Vitest behavior; the file's existence
lets the root workspace reference each package by directory path.

**Acceptance**: `pnpm -F @carte/<pkg> test` continues to exit 0 in every
package (≥ A2.test.vitest).

## 2. Root `vitest.workspace.ts`

Author `vitest.workspace.ts` at the repo root using `defineWorkspace` from
`vitest/config`. List each package directory:

```ts
import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "packages/core",
  "packages/reservations",
  "packages/orders-backend",
  "packages/orders-admin",
  "packages/views",
  "packages/ai",
]);
```

**Acceptance**: `pnpm exec vitest run` from the repo root reports 6 projects
and ≥ 12 passing tests (matches per-package fan-out count) → A2.test.vitest.

## 3. Install `@playwright/test`

Run `pnpm add -Dw @playwright/test`. Do NOT run `npx playwright install`
(browser binaries are a deploy-time concern, not config-time).

**Acceptance**: `pnpm exec playwright --version` prints a version string.

## 4. Root `playwright.config.ts`

Author `playwright.config.ts` at the repo root with `testDir: "./e2e"` (the
directory does not need to exist), 30s timeout, `fullyParallel: true`,
`reporter: "list"`, and a `use.baseURL` honoring `process.env.BASE_URL` with a
sensible default.

**Acceptance**: `pnpm exec playwright test --list` exits successfully (zero
specs is acceptable — we're validating the config shape, not test discovery).

## 5. Root `package.json` scripts

Replace the existing `test` script with `vitest run`, and add `test:watch`,
`e2e`, and `e2e:ui` scripts. Preserve `typecheck`, `lint`, `format`,
`format:check`, `prepare`.

**Acceptance**: `pnpm test` runs the workspace suite (≥ 12 tests across 6
projects); `pnpm e2e` does not error on the missing specs directory.

## 6. Verify and commit

Run the quality gauntlet (`pnpm install --frozen-lockfile`, `pnpm test`,
`pnpm -r test`, `pnpm exec playwright --version`, `pnpm -r typecheck`,
`pnpm -r lint`). All exit 0.

Commit on the milestone branch:

- `chore(openspec): track f-m2-test-frameworks [PRO-437]`
- `feat(workspace): vitest workspace + playwright.config.ts [PRO-437]`
