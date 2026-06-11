# Wrap-Up: PRO-727 — PRO-v02-tender-adapter

## Checklist

- [x] Quality fan-out clean (quality-review-droid + applicable QA droids; see validation commits 514ca09/f1b128e/1557731)
- [x] AgentShield clean
- [x] OpenSpec verified (tasks.md all checked)
- [x] Docs updated (CHANGELOG v0.2.0-rc, MIGRATION.md, orders-backend README)
- [x] Committed and pushed
- [x] PR open: https://github.com/foreztgump/carte/pull/16
- [x] agentmemory saved
- [x] PR merged
- [x] OpenSpec archived
- [x] Branch deleted: feat/PRO-tender-adapter
- [x] Worktree removed: n/a (work done on branch in main checkout)

## PR Review Triage

**Reviewer:** PR-Agent local (persistent review, updated through commit 7c706ef)
**Risk Classification:** standard
**Review path:** .factory-state/pr-agent-review-15.md, pr-agent-review-15-rerun.md, GitHub persistent comment on PR #16
**Comments Posted:** 1 (persistent review comment)

- [Actionable] (PR-Agent) packages/ai/src/tool-call.ts `isLocalOrPrivateHost`: SSRF guard misses IPv6 loopback (`::1`), IPv4-mapped IPv6 (`::ffff:127.0.0.1`), and IPv6 private ranges (`fe80::`, `fc00::`/`fd00::`) — Deferred: helper is exported but has **no active caller** at merge time (reviewer confirms "no exploitable vulnerability at merge time"). Must be closed before any tool adopts the helper. Tracked as follow-up under the 0.17 modernization epic (PRO-848 / WS3 native conversion scope).
- [Resolved] (PR-Agent) refund amount `?? 0` full-refund regression — fixed on branch (refund route omits amount for full refunds).
- [Resolved] (PR-Agent) stale Stripe unique index — fixed in 7c706ef.
- [Nitpick] (PR-Agent) `markUndoCompleted`/`markUndoExpired` KV records lack `expirationTtl` — accepted for rc; revisit in WS6 budget realignment (PRO-862).

## Follow-Up Items

- Close IPv6 SSRF gap in `isAllowedToolUrl`/`isLocalOrPrivateHost` before any AI tool accepts caller-supplied URLs (fold into PRO-856 WS3 or file dedicated issue).
- Add `expirationTtl` to undo status KV records (PRO-862 WS6).
- Remove `vendor/tender-sdk-0.0.0.tgz` and switch back to a registry dependency once `@tender/sdk` publishes to npm (PRO-766/PRO-787).
- 0.17 modernization retargeted to emdash ^0.18 (npm latest 2026-06-11; no plugin-breaking changes per release notes).
