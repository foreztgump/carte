# WRAP_UP: PRO-m8-ai

## Summary

Shipped `@carte/ai` v0.1: native React chat panel with tool-call PII boundary, workspace-isolated KV state, inline AI actions, and read-by-default / write-on-confirm contract. PII redacted before chat-history KV persistence; PII never leaves to LLM without explicit user consent at the tool-call boundary.

## Linear Tickets

- PRO-412: ai plugin (chat + tool-call with PII boundary + workspace isolation)
- PRO-469: inline AI actions
- PRO-623: follow-ups

## PR

- #9 — https://github.com/foreztgump/carte/pull/9
- HEAD (post-rebase): `a4e27f8`
- Base: `main` at `46a1fa7`
- Merge mode: squash

## Validation Trail

- Mission validation: PASS
- pr-agent rounds: 6 rounds (initial + 5 reruns); final rerun #6 CLEAN — no security concerns, no P0/P1 raised
- Tests: passing per `review-rerun6.md` (chat panel behavior, inline tools, PII redaction, workspace KV isolation, tool-call consent boundary)
- typecheck + lint: green

## PR Review Triage

**Final verdict**: CLEAN — all prior blockers RESOLVED across 6 rerun rounds, no new P0/P1 in final round.

**Resolved during multi-round fix-pass**:

- PII boundary at tool-call layer (read-by-default, write-on-confirm)
- Workspace-isolated KV state (no cross-tenant bleed)
- PII redaction before chat-history KV persistence (final fix `bc2be37`)
- Inline AI actions component contract (`224cf69` + follow-ups)

## HITL Pre-Merge Checklist (deferred to post-merge for v0.1 batch)

- [ ] axe-core a11y (M6, M7, M8) — deferred
- [ ] Free-trial enforcement strategy for `@carte/ai` (PRD Open Question) — deferred to PRO-623
- [x] EmDash sandbox budget — N/A (native React, not sandboxed)
- [x] PII boundary enforcement — confirmed by validator at tool-call boundary

## Rebase Notes

- Conflicts resolved: `pnpm-lock.yaml` (Rule B `--theirs`, twice), `packages/core/src/taxonomy/allergens.ts` (Rule A `--theirs`), `packages/core/package.json` (Rule C union — both `./taxonomy` and `./taxonomy/allergens` keys retained, since M7's views imports the former and M8's ai imports the latter; both map to the same source file `./src/taxonomy/allergens.ts`).
- Lockfile regenerated post-rebase via `pnpm install --no-frozen-lockfile` and committed as `chore(deps): regenerate lockfile post-rebase [PRO-412]` (`a4e27f8`).

## References

- pr-agent (6 rounds total):
  - `/home/cownose/.factory/missions/343410ef-f054-4252-b8e2-7a108ff4e717/validation/M8/pr-agent/review.md`
  - `/home/cownose/.factory/missions/343410ef-f054-4252-b8e2-7a108ff4e717/validation/M8/pr-agent/review-rerun.md`
  - `/home/cownose/.factory/missions/343410ef-f054-4252-b8e2-7a108ff4e717/validation/M8/pr-agent/review-rerun2.md`
  - `/home/cownose/.factory/missions/343410ef-f054-4252-b8e2-7a108ff4e717/validation/M8/pr-agent/review-rerun3.md`
  - `/home/cownose/.factory/missions/343410ef-f054-4252-b8e2-7a108ff4e717/validation/M8/pr-agent/review-rerun4.md`
  - `/home/cownose/.factory/missions/343410ef-f054-4252-b8e2-7a108ff4e717/validation/M8/pr-agent/review-rerun5.md`
  - `/home/cownose/.factory/missions/343410ef-f054-4252-b8e2-7a108ff4e717/validation/M8/pr-agent/review-rerun6.md`
- Mission synthesis: `/home/cownose/.factory/missions/343410ef-f054-4252-b8e2-7a108ff4e717/validation/M8/`
