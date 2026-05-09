# WRAP_UP: PRO-m4-reservations

## Summary

Shipped `@carte/reservations` v0.1: capacity reservations with KV atomic decrement, HMAC-signed confirm/cancel tokens, and ICS calendar feed.

## Linear Tickets

- PRO-414: reservations plugin (capacity, HMAC tokens, calendar feed)

## PR

- #5 — https://github.com/foreztgump/carte/pull/5
- HEAD (post-rebase): `35cdc66`
- Base: `main` at `4f93b1f`
- Merge mode: squash

## Validation Trail

- Mission validation: PASS (scrutiny + user-testing-flow synthesis green)
- pr-agent rounds: 2 rounds (GLM-5.1 + GPT-5.2 rerun); final rerun CLEAN — no security concerns, no P0/P1 raised
- Tests: passing per `review-rerun.md` (test files: `index.test.ts`, `routes.test.ts`, `routes/context.test.ts`, `routes/email.test.ts`, `routes/rate-limit.test.ts`, `availability/read-time-slots.test.ts`, `capacity.test.ts`)
- typecheck + lint: green

## PR Review Triage

**Final verdict**: CLEAN — no P0/P1/unresolved-Important findings on rerun.

**Resolved during fix-pass** (per `review-rerun.md` Prior Blocker Resolution table):

- B1 (P0) Hardcoded HMAC token-secret default — RESOLVED in `packages/reservations/src/routes/context.ts:10-15`
- B2 Double capacity-restore on cancel — RESOLVED in `packages/reservations/src/routes/cancel.ts:11-13`
- B3 Email dedup boolean/object shape mismatch — RESOLVED in `packages/reservations/src/routes/email.ts:13-17,29`
- B4 Rate-limit counter no expirationTtl — RESOLVED in `packages/reservations/src/routes/context.ts:38-60`
- B5 Rate-limit non-atomic — DOCUMENTED with HR6 follow-up reference

**Non-blocking nits accepted as-is** (5 P2/P3 items in rerun, none meet blocking severity):

- P2: confirm.ts lacks status guard equivalent to cancel.ts (re-confirm after cancel flips status without re-decrement)
- P2: submit.ts capacity leak if reserveCapacity succeeds but put() throws (10-min hold TTL provides bound)
- P3: listActiveReservations ignores hasMore (silent truncation past 100)
- P3: rate-limit uses discrete window bucketing (vs sliding window)
- P3: time parsing lacks validation for out-of-range inputs

## HITL Pre-Merge Checklist (deferred to post-merge for v0.1 batch)

- [ ] Google Rich Results Test for new schema.org JSON-LD (M3, M7)
- [ ] Lighthouse perf audit on storefront pages (M7) ≥80
- [ ] axe-core a11y audit (M6, M7) zero serious+critical WCAG 2.1 AA
- [x] EmDash sandbox CPU + subrequest budget visual check — confirmed by mission validator

## References

- pr-agent reviews:
  - `/home/cownose/.factory/missions/343410ef-f054-4252-b8e2-7a108ff4e717/validation/M4/pr-agent/review.md`
  - `/home/cownose/.factory/missions/343410ef-f054-4252-b8e2-7a108ff4e717/validation/M4/pr-agent/review-rerun.md`
- Mission synthesis:
  - `/home/cownose/.factory/missions/343410ef-f054-4252-b8e2-7a108ff4e717/validation/M4/scrutiny/synthesis.json`
  - `/home/cownose/.factory/missions/343410ef-f054-4252-b8e2-7a108ff4e717/validation/M4/user-testing/synthesis.json`
