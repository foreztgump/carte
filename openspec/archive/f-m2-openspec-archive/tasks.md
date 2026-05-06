# Tasks — f-m2-openspec-archive

Each task is bounded by one acceptance criterion that maps to validation-contract assertion `A2.openspec.archived` (mission-close cleanup) and `X.boundary.openspec` (per-feature folder shape preserved through `git mv`).

## 1. Archive Milestone 0 feature folders

`git mv openspec/changes/f-m0-* openspec/archive/` for all 6 M0 folders:
`f-m0-avoid`, `f-m0-latepoint`, `f-m0-linear-reconcile`, `f-m0-orderable`, `f-m0-restrofood`, `f-m0-synthesis`.

**Acceptance**: `ls openspec/archive/ | grep -c '^f-m0-'` returns `6`. None of the original folder contents are mutated (only the parent path changes — `git mv` preserves history).

## 2. Archive Milestone 1 feature folders

`git mv openspec/changes/f-m1-* openspec/archive/` for all 8 M1 folders:
`f-m1-branch-prefix`, `f-m1-capability-naming`, `f-m1-competitive-pointer`, `f-m1-mcp-interim`, `f-m1-remaining-oqs`, `f-m1-sandbox-quotas`, `f-m1-trial-licensing`, `f-m1-version-pin`.

**Acceptance**: `ls openspec/archive/ | grep -c '^f-m1-'` returns `8`.

## 3. Archive Milestone 2 feature folders (including self)

`git mv openspec/changes/f-m2-* openspec/archive/` for all 5 M2 folders:
`f-m2-ci-changesets-hygiene`, `f-m2-openspec-archive` (this one), `f-m2-test-frameworks`, `f-m2-workspace`, `f-m2-wrangler`.

**Acceptance**: `ls openspec/archive/ | grep -c '^f-m2-'` returns `5`. After the move, `openspec/changes/` contains only the existing `archive/` empty subfolder (no per-feature folders remain).

## 4. Author root CHANGELOG.md (v0.0.1 mission-close entry)

Create `CHANGELOG.md` at the repo root with a Keep-a-Changelog-formatted `0.0.1 — 2026-05-06 (mission close)` entry summarizing what shipped: M0 competitive analysis docs, M1 OQ resolutions + canonical capability lock + EmDash 0.9.0 pin + sandbox runtime caps + trial-licensing pattern, M2 monorepo skeleton (pnpm workspace + 6 plugin packages + TS strict + ESLint + Prettier + Vitest + Playwright + Wrangler + GitHub Actions CI + Changesets + LICENSE/CONTRIBUTING/README/.editorconfig).

**Acceptance**: `wc -l CHANGELOG.md` ≥ 40; the v0.0.1 entry alone is ≥ 30 lines and explicitly lists the locked decisions (capability names, SDK pin, sandbox caps).
