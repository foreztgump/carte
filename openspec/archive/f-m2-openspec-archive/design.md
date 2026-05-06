# Design — f-m2-openspec-archive

## Archive naming convention

Per-feature folders archive **flat** under `openspec/archive/` using their original folder names (e.g., `f-m0-latepoint/` becomes `openspec/archive/f-m0-latepoint/`). No date prefix is added at the per-feature level; the milestone WRAP_UP wrappers (`2026-05-06-PRO-m0-competitive-analysis/`, `2026-05-06-PRO-m1-oq-resolution/`) already provide the date-keyed milestone context.

This keeps per-feature folder names short and stable, and matches the on-disk naming the workers used during the mission (which is what their commit history references). If a future mission ever produces a folder name collision with an already-archived feature, the next archive job will add a `<date>-` suffix to the colliding folder; for this mission no collisions exist (all M0/M1/M2 names are unique).

`git mv` is used (not `cp` + `rm`) so file history is preserved. Reviewers can `git log --follow openspec/archive/f-m0-latepoint/proposal.md` and see the original M0 commits.
