# Tasks

- [ ] Inspect `npm create emdash@latest` output and capture API-surface facts.
  - Acceptance: proposal.md records what the starter ships and why we hand-roll, plus confirmation that `definePlugin` is exported from the `emdash` package and that the canonical capability set in 0.9.0 matches the names locked in `AGENTS.md`.

- [ ] Author root scaffolding: `pnpm-workspace.yaml`, `package.json` (with `packageManager: pnpm@10.19.0`, `engines.node: ">=22"`, `private: true`), `tsconfig.json` (strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`), `eslint.config.js` (flat), `.prettierrc`, `.editorconfig`, `.gitignore` additions, husky pre-commit + lint-staged.
  - Acceptance: `pnpm install` exits 0 and produces a `pnpm-lock.yaml`; `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm format` scripts exist at root and fan out across packages.

- [ ] For each of the 6 packages, create the directory + `package.json` (`name: @carte/<plugin>`, `version: 0.1.0`, peer dep `emdash: ^0.9.0`), `tsconfig.json` extending root, `README.md`, then commit a RED smoke test FIRST and a GREEN `src/index.ts` SECOND.
  - Acceptance: 12 plugin commits in the order test → feat for each package; `pnpm -r test` passes ≥12 cases (2 per package); every plugin manifest declares only canonical capability names.

- [ ] `@carte/views` is special: it is an Astro/React peer-dep library, not an EmDash plugin. Its `src/index.ts` exports a `MenuItem` placeholder shape; its smoke test asserts the named export exists. README states "peer-dep npm library — not an EmDash plugin".
  - Acceptance: `@carte/views` has no `definePlugin` import; its tests still run via `pnpm -F @carte/views test`.

- [ ] Run the milestone-feature gauntlet: `pnpm install --frozen-lockfile`, `pnpm -r typecheck`, `pnpm -r lint`, `pnpm -r test`, `git status --short`, `git log --oneline ^main`.
  - Acceptance: all four pnpm commands exit 0; working tree is clean; commit log shows test → feat ordering for all six packages.

- [ ] Update Linear PRO-429 and PRO-430 to `In Review` after the local commits land on `feature/PRO-m2-monorepo-scaffold`.
  - Acceptance: both issues are `In Review`; the milestone-end PR opened by the orchestrator will move them to `Done`.
