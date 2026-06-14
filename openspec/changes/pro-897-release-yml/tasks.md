# Tasks: PRO-897 — release.yml workflow

## 1. Author `.github/workflows/release.yml` (S)

- [x] Create `.github/workflows/release.yml` mirroring Dateline's structure.
- [x] Triggers: `push` of `v*` tags + `workflow_dispatch` with `dry_run` boolean
      input (default `true`).
- [x] `permissions: contents: read` + `id-token: write`.
- [x] `concurrency` group `release-${{ github.ref }}`, `cancel-in-progress: false`.
- [x] Steps: checkout → pnpm/action-setup → setup-node (`node-version: "22"`,
      `registry-url: https://registry.npmjs.org`, `cache: pnpm`) →
      `npm install -g "npm@^11.5.1"` → `pnpm install --frozen-lockfile` →
      `pnpm -r build`.
- [x] Dry-run step (`pnpm -r publish --dry-run --no-git-checks`) gated on
      `workflow_dispatch && inputs.dry_run`.
- [x] Publish step (`pnpm exec changeset publish`) gated on `push`.
- [x] No `NODE_AUTH_TOKEN` anywhere.
- **Acceptance:** file parses as valid YAML; `actionlint` (if available) passes;
  structure matches the Dateline reference except the documented
  `node-version` deviation.

## 2. Validate (S)

- [x] Validate YAML syntax (`python -c yaml.safe_load` or `actionlint`).
- [x] Confirm action versions match carte's existing `ci.yml` pins
      (`actions/checkout@v4`, `pnpm/action-setup@v4`, `actions/setup-node@v4`).
- [x] Grep-assert `NODE_AUTH_TOKEN` does not appear in the file.
- **Acceptance:** YAML valid; no `NODE_AUTH_TOKEN`; pnpm version aligns with
  `packageManager` (pnpm@10.19.0).
