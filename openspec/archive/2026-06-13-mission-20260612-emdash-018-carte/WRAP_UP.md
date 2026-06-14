# Wrap-Up: mission-20260612-emdash-018-carte — EmDash 0.18 Modernization (v0.2 → v0.3-rc)

Epic: **PRO-848**. Six milestones (M0–M5) shipped across PRs #18–#23, all merged to
`main` (final: `c28012a`). This wrap-up was authored during a post-mission completeness
review that closed the bookkeeping gaps left open at merge time.

## Checklist

- [x] All 6 milestone PRs merged (#18–#23)
- [x] Tests green — 304/304 (46 files)
- [x] Typecheck clean across all packages
- [x] Grep gates implemented + green (`scripts/check-grep-gates.sh`, wired into `ci.yml`)
- [x] OpenSpec tasks reconciled (40/40 ticked)
- [x] WRAP_UP.md written
- [x] agentmemory saved
- [x] Linear issues closed (PRO-764/770/769/496 Done; epic PRO-848 closed)
- [ ] OpenSpec archived (this commit + `/opsx:archive`)

## What shipped

- **Sandboxed format** (`emdash-plugin.jsonc` + `src/plugin.ts`): `@carte/core`,
  `@carte/reservations`, `@carte/orders-backend` — built/validated/bundled by
  `@emdash-cms/plugin-cli@0.5.1` in CI.
- **Native format** (`definePlugin()` on 0.18 types): `@carte/orders-admin`,
  `@carte/ai` — React admin renders in the harness.
- **Capacity**: D1 single-writer with unique slot-key constraint, conflict-as-full,
  KV as cache only. `atomicDecrement` fiction removed. Oversell load test green.
- **Tender seam**: dead `tender:payment.*` placeholder hooks deleted; idempotent
  in-request `applyTenderTransaction(ctx, event)` seam kept (write-then-verify KV
  marker keyed on transaction id; no post-response primitive on 0.18 sandbox).
- **Per-runner budget**: `sandbox-cost-table.json` + `audit-sandbox-budget.ts`
  (Cloudflare blocking, workerd advisory).
- **Docs**: `MIGRATION.md` v0.2→v0.3, docs-site install pages + READMEs on the 0.18
  model, `LAUNCH_CHECKLIST.md` gates. Family bumped to `0.3.0-rc.1` (no publish).

## Post-review closure (this session)

Mission code was complete and green at merge, but five closure items were left open:

1. **OpenSpec change not archived** — 8 tasks were done-but-unticked. Verified each
   against source/tests and ticked (1.2, 1.6, 2.1, 2.2, 3.3, 5.1).
2. **CI grep gates (task 4.6) never wired** — acceptance #3 requires them. Implemented
   `scripts/check-grep-gates.sh` (scoped to `packages/*/src`; allow-regex for the two
   legitimate residual hits: test-only `as never` casts and the unrelated `untrusted`
   IP-bucket constant) and added a CI step after `pnpm -r test`. Runs green.
3. **Untracked files** — `.gitignore` updated to drop `.playwright-mcp/` and loose
   root `pro*-*.png` render scratch; the source-of-truth PRD committed.
4. **No WRAP_UP.md** — this file.
5. **Epic PRO-848 left in Todo** — closed with milestone-complete comment.

## Deferred / tracked (not gaps)

- Publisher DID — `did:plc` placeholder in all three sandboxed manifests, `TODO(PRO-848)`
  to swap to Tender's real DID before any registry publish.
- **npm publish — BLOCKED on PRO-766** (pre-existing release gate). Intentional.
- **PRO-889** — override parity for non-slot-aligned blocks (capacity tech debt).
- **PRO-888** — abandoned-hold reclamation (capacity tech debt).

## Follow-Up Items

- File the upstream `sandbox-workerd` capability-name divergence issue (pnpm patch
  `patches/@emdash-cms__sandbox-workerd@0.1.6.patch` carried meanwhile) — operator action.
- Resolve PRO-766 to unblock the `0.3.0-rc` → `0.3.0` publish.
