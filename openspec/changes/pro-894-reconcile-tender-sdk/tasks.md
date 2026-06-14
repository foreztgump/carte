# pro-894-reconcile-tender-sdk — Tasks

Each task <2hr with explicit acceptance criteria mapping to the
`release-packaging` delta spec. No checkout/refund handler logic changes in any
task.

## Task 1 — Relocate the `@tender/sdk` build input to the workspace root

- **Modify:** `package.json` (workspace root) — add
  `"@tender/sdk": "file:./vendor/tender-sdk-0.0.0.tgz"` to root `devDependencies`.
- **Modify:** `.npmrc` — add `public-hoist-pattern[]=@tender/sdk` (mirrors the
  existing `public-hoist-pattern[]=tsx` entry) so the package resolves the SDK
  under pnpm's strict `node_modules`.
- **Acceptance:**
  - [x] Root `devDependencies` declares the vendored SDK via a `file:./vendor/...`
        spec; the path resolves from the repo root.
  - [x] `.npmrc` hoists `@tender/sdk`.
  - [x] Root stays `private: true` (never published).
- **Error handling:** none (declarative manifest/config edit); resolution failures
  surface in Task 3's install.
- **CODE_PRINCIPLES:** No magic values — reference the real relative path; KISS —
  reuse the existing `.npmrc` hoist convention rather than inventing a new
  mechanism.

## Task 2 — Remove `@tender/sdk` from the `@carte/orders-backend` manifest

- **Modify:** `packages/orders-backend/package.json` — delete the
  `@tender/sdk` entry from `devDependencies`. Leave `peerDependencies`
  (`emdash`), `files` (`["dist","emdash-plugin.jsonc"]`), `main`, and `exports`
  unchanged. Add **no** `@tender/sdk` to any other field.
- **Acceptance:**
  - [x] `packages/orders-backend/package.json` contains zero `@tender/sdk` keys
        across all dependency fields.
  - [x] `files` still excludes `src/` and `vendor/` (no change required, confirm).
  - [x] Fulfills spec "published manifest declares no `@tender/sdk` dependency".
- **Error handling:** none (manifest edit).
- **CODE_PRINCIPLES:** YAGNI — do not add a peer/optional declaration the bundled
  `dist/` does not need; minimal manifest surface.

## Task 3 — Reinstall, rebuild, and confirm the in-workspace toolchain stays green

- **Run:** `pnpm install` (regenerates `pnpm-lock.yaml`), then
  `pnpm -F @carte/orders-backend build`,
  `pnpm -F @carte/orders-backend typecheck`,
  `pnpm -F @carte/orders-backend test`.
- **Acceptance:**
  - [x] `pnpm install` exits 0; lockfile regenerated.
  - [x] `pnpm-workspace.yaml` removes the stale external
        `../tender/packages/sdk` workspace member because the root vendored file
        dependency is now the reproducible build input.
  - [x] `build`, `typecheck`, `test` each exit 0.
  - [x] `tender-sdk-link.smoke.test.ts` and `routes.test.ts` (which mocks
        `@tender/sdk`) pass — SDK still resolves for build/test.
  - [x] `dist/index.mjs` and `dist/plugin.mjs` exist after build.
  - [x] Fulfills spec "Workspace build, typecheck, and tests resolve `@tender/sdk`
        from the build input".
- **Error handling:** if pnpm cannot resolve `@tender/sdk` from the package, the
  install/test fails loudly — fix the `.npmrc` hoist (Task 1), do not add the dep
  back to the package.
- **CODE_PRINCIPLES:** Evidence-based completion — capture command exit codes; do
  not mark done without green output.

## Task 4 — Add a pack-contents + clean-install verification script

- **Create:** `scripts/verify-orders-backend-pack.ts` (mirrors the existing
  `scripts/verify-rich-results.ts` / `scripts/audit-sandbox-budget.ts` `tsx`
  pattern). The script SHALL:
  1. `pnpm -F @carte/orders-backend pack` (or `pnpm pack` in the package dir) to a
     temp dir;
  2. read the tarball's `package.json` and assert **no** `@tender/sdk` key in any
     dependency field and **no** `file:`/`vendor/` specifier;
  3. assert the tarball file list contains only `dist/**` + `emdash-plugin.jsonc`
     (+ npm-standard `package.json`/README) — no `src/`, no `vendor/`, no
     `tender-sdk-0.0.0.tgz`;
  4. install the tarball into an empty temp project with `@tender/sdk` absent and
     dynamically `import()` `dist/index.mjs` and `dist/plugin.mjs`, asserting no
     unresolved-module error.
- **Modify:** root `package.json` `scripts` — add
  `"verify:orders-backend-pack": "tsx scripts/verify-orders-backend-pack.ts"`.
- **Run:** `pnpm verify:orders-backend-pack`.
- **Acceptance:**
  - [x] Script exits 0 against the reconciled package.
  - [x] Removing the fix (re-adding the `@tender/sdk` devDependency) makes the
        script fail — proves it actually guards the leak.
  - [x] Fulfills spec "Packed manifest carries no Tender SDK reference", "Clean
        install … does not error with `@tender/sdk` absent", and "No published
        package embeds the vendored Tender SDK tarball or `src/`".
- **Error handling:** clean up temp dirs in a `finally`; treat a thrown
  unresolved-module error from the dynamic import as a hard failure (non-zero
  exit) with the offending specifier in the message.
- **CODE_PRINCIPLES:** Functions do one thing — separate `pack`, `assertManifest`,
  `assertFileList`, `assertCleanInstall`; no magic values — name the tarball glob,
  temp prefix, and forbidden-path constants; max 3 nesting levels — guard clauses
  for the assertions.

## Task 5 — Update docs to the self-contained contract

- **Modify:** `MIGRATION.md` — replace the `@tender/sdk` _peer dependency_
  instruction (the `pnpm add @tender/sdk@^0.1.0` block around line 208) with the
  self-contained-bundle statement: the SDK is bundled into `@carte/orders-backend`'s
  `dist/`; operators install `tender-core` / `tender-stripe` for payments to
  function, not `@tender/sdk` directly. Keep the "inert until Tender ships"
  disclosure.
- **Modify:** `packages/orders-backend/README.md` — state the bundled/self-contained
  dependency shape where it describes the execution model and Tender integration.
- **Modify:** add a changeset under `.changeset/` (patch for
  `@carte/orders-backend`) noting the dependency-shape reconciliation; update
  `CHANGELOG.md` if hand-maintained.
- **Acceptance:**
  - [x] `MIGRATION.md` no longer instructs installing `@tender/sdk` as a peer;
        states the self-contained shape.
  - [x] README reflects the bundled SDK contract.
  - [x] A changeset entry exists for the reconciliation.
- **Error handling:** none (docs).
- **CODE_PRINCIPLES:** Names reveal intent — describe the contract accurately; no
  duplicated logic — single source of truth for the dependency-shape statement,
  cross-referenced rather than restated.

## Task 6 — Full-workspace regression gate

- **Run:** `pnpm -r build`, `pnpm -r typecheck`, `pnpm test` from repo root.
- **Acceptance:**
  - [x] All exit 0; the other four publishable packages and `@carte/ai` are
        unaffected.
  - [x] `pnpm -r publish --dry-run --no-git-checks` (if run) packs
        `@carte/orders-backend` without any `@tender/sdk` reference.
- **Error handling:** any regression in a sibling package is a hard stop — this
  change must be dependency-shape-only.
- **CODE_PRINCIPLES:** Evidence-based completion — attach command output before
  marking the change ready for `/opsx:verify`.

### Validation evidence

Captured on 2026-06-14 from the worktree root:

```text
$ pnpm verify:orders-backend-pack
OK: @carte/orders-backend pack is self-contained and clean-installable.
Exit code: 0

$ pnpm -r build
Scope: 10 of 11 workspace projects
... all recursive build scripts completed, including docs-site and harness ...
Exit code: 0

$ pnpm -r typecheck
Scope: 10 of 11 workspace projects
Result (packages/views Astro check): 0 errors, 0 warnings, 0 hints
Exit code: 0

$ pnpm test
Test Files: 46 passed (46)
Tests: 304 passed (304)
Exit code: 0

$ openspec validate pro-894-reconcile-tender-sdk --strict
Change 'pro-894-reconcile-tender-sdk' is valid
Exit code: 0

$ git diff --check
Exit code: 0
```
