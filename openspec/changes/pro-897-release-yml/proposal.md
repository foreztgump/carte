# Proposal: PRO-897 — release.yml workflow (OIDC trusted publishing, dry-run)

## Why

Carte has no release automation. PRD WS-B2 (gap G-REL, Decision §0.1) requires a
`.github/workflows/release.yml` modeled exactly on Dateline's, so that:

- a `push` of a `v*` tag publishes the family via `changeset publish` using
  tokenless **OIDC trusted publishing** with automatic provenance, and
- a `workflow_dispatch` **dry-run** verifies exactly which packages and versions
  would publish — without authenticating or pushing to the registry.

In R1 only the dry-run path matters; the first real publish is R2 (PRO-895 made
the repo public; PRO-894/A-track flip the `private` flags). This task ships the
workflow; the live 5-package dry-run is verified in Wave 2 once the publish flags
land.

## What Changes

- Add `.github/workflows/release.yml` mirroring Dateline:
  - Triggers: `push` of `v*` tags (real publish) + `workflow_dispatch` with a
    `dry_run` boolean input (default `true`).
  - `permissions: contents: read` + `id-token: write` (OIDC).
  - `setup-node` with `registry-url: https://registry.npmjs.org` (required even
    tokenless) and `cache: pnpm`.
  - `npm install -g "npm@^11.5.1"` — OIDC needs npm ≥ 11.5.1; Node 22 bundles 10.x.
  - `pnpm install --frozen-lockfile` → `pnpm -r build`.
  - Dry-run step (`pnpm -r publish --dry-run --no-git-checks`) gated on
    `workflow_dispatch && inputs.dry_run`.
  - Publish step (`pnpm exec changeset publish`) gated on `push`.
  - **NODE_AUTH_TOKEN is never set** — any value (even empty) makes npm skip OIDC.

## Deviation from Dateline (documented)

Dateline's workflow uses `node-version-file: .nvmrc`. Carte has **no `.nvmrc`**
yet (that is a separate A-track task) and its existing `ci.yml`/`canary.yml`
pin `node-version: "22"`. To avoid shipping a workflow that references a
nonexistent file, `release.yml` uses `node-version: "22"` to match carte's
established convention. When `.nvmrc` lands, this can switch to
`node-version-file` for full parity.

## Non-Goals

- No real publish in R1 (no `v*` tag is cut here).
- No flipping of package `private` flags (A-track).
- No `.nvmrc` creation (A-track WS-A5).
- No changes to `ci.yml` or `canary.yml`.

## Rollback

The workflow is additive and inert until a `v*` tag is pushed or a
`workflow_dispatch` is manually triggered. Rollback = delete the file. No
runtime, package, or CI-gate impact.
