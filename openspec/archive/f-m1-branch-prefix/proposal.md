## Why

Milestone 1 locked the actual Linear team key as `PRO`, but `AGENTS.md` still documents the placeholder `CART` prefix for branch, commit, and `/work` examples. That mismatch would cause future workers to create the wrong branch names and commit references.

## What Changes

Update `AGENTS.md` so the Linear Integration section uses `PRO-XXX` for branch and commit conventions, while keeping `CART` only as the project-name working assumption. Also update the `/work` workflow example to match the real team key.

## Rollback Plan

Revert the `AGENTS.md` edits and remove this OpenSpec change directory if the team key guidance changes again.
