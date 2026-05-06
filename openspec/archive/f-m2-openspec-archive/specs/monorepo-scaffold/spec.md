# Spec — f-m2-openspec-archive (monorepo-scaffold capability)

## Scenario: Mission-close archive sweep

**Given** the Carte v0.1 mission has landed all four prior M2 features (`f-m2-workspace`, `f-m2-test-frameworks`, `f-m2-wrangler`, `f-m2-ci-changesets-hygiene`) on `feature/PRO-m2-monorepo-scaffold`,
**And** `openspec/changes/` contains 19 per-feature folders (6 × `f-m0-*`, 8 × `f-m1-*`, 5 × `f-m2-*` including this feature),
**And** `openspec/archive/` already contains the milestone WRAP_UP wrappers `2026-05-06-PRO-m0-competitive-analysis/` and `2026-05-06-PRO-m1-oq-resolution/`,

**When** the mission-close archive sweep runs (this feature),

**Then** every `f-m{0,1,2}-*` folder in `openspec/changes/` is moved (`git mv`) into `openspec/archive/`,
**And** the file history of each archived file is preserved (verifiable with `git log --follow`),
**And** `openspec/changes/` retains no per-feature folders (only the pre-existing empty `openspec/changes/archive/` subfolder remains, which is a separate scratch pad — out of scope for this feature),
**And** `CHANGELOG.md` exists at the repo root with a `0.0.1 — 2026-05-06 (mission close)` entry documenting the M0/M1/M2 deliverables.

## Scenario: Boundary preservation under git mv

**Given** any archived per-feature folder (e.g., `openspec/archive/f-m0-latepoint/`),

**When** a reviewer runs `git log --follow openspec/archive/f-m0-latepoint/proposal.md`,

**Then** the commit history shows the original authoring commit on the M0 milestone branch (not just the archive-sweep commit).

## Acceptance assertion

This spec fulfills `A2.openspec.archived`: at mission close, `openspec/changes/` contains zero per-feature folders for the just-completed mission, and every such folder is preserved under `openspec/archive/` with intact git history.
