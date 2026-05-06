# Proposal — f-m2-openspec-archive

## Why

Mission `d702a513-34b3-427e-85eb-59c759f31778` (Carte v0.1: WP Analysis + OQ Resolution + Monorepo Scaffolding) is closing. Across three milestones, individual feature workers each authored their own `openspec/changes/<feature-id>/` directory:

- Milestone 0 (competitive analysis): 6 features.
- Milestone 1 (open-question resolution): 8 features.
- Milestone 2 (monorepo scaffolding): 5 features (including this one).

`openspec/changes/` is meant to scope **active** work. Now that the mission's last code-bearing milestone (M2) has landed, those 19 per-feature folders should move to `openspec/archive/` so that future per-plugin missions start with a clean `openspec/changes/`.

## What changes

1. `git mv openspec/changes/f-m0-* openspec/archive/` (6 folders).
2. `git mv openspec/changes/f-m1-* openspec/archive/` (8 folders).
3. `git mv openspec/changes/f-m2-* openspec/archive/` (5 folders, including this one).
4. Author root `CHANGELOG.md` with a `0.0.1 — 2026-05-06 (mission close)` entry summarizing what shipped across all three milestones (WP analysis docs, OQs locked, monorepo skeleton).

`openspec/archive/2026-05-06-PRO-m0-competitive-analysis/` and `openspec/archive/2026-05-06-PRO-m1-oq-resolution/` already exist — those are the milestone-level WRAP_UP wrappers placed by the orchestrator. They are NOT touched by this feature.

## Out of scope

- No plugin business logic.
- No PR opened (the orchestrator opens the M2 PR after this feature lands).
- No Linear status transition (this feature has no per-feature ticket; PRO-413 is the umbrella scaffolding epic, transitioned by the orchestrator).
- No edits to research/, PRD.md, AGENTS.md, CODE_PRINCIPLES.md.
