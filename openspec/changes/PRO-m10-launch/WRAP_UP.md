# M10 — Launch readiness package — wrap-up

## Summary

Shipped M10 launch readiness onto `feature/PRO-m10-launch`: public docs site (Astro Starlight), 5 launch recipes, schema.org Rich Results verifier, sandbox-budget static auditor, AI chat launch e2e suite, and the PRO-418 LAUNCH_CHECKLIST.md. PR #12 (https://github.com/foreztgump/carte/pull/12) is open against `main` at HEAD `4e30d4a`. All 26 mission assertions PASS (1 deferred-to-prprep per validation contract); pr-agent post-PR-open gate CLEAN.

## Deliverables

| Feature                        | Path / surface                                                                                                                   | Commits                     |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `f-m10-docs-site-scaffold`     | `docs-site/` workspace; `astro.config.mjs` Starlight integration; sidebar enumerates all 6 v0.1 plugins                          | `fff7c84`                   |
| `f-m10-docs-recipes`           | `docs-site/src/content/docs/recipes/{quickstart,menu-page,reservation-form,first-order,ai-panel}.mdx`                            | `9012da6`                   |
| `f-m10-rich-results-verifier`  | `scripts/verify-rich-results.ts` + `verify:rich-results` root script (RED→GREEN)                                                 | `a0f0739` → `8e7d9a1`       |
| `f-m10-sandbox-budget-auditor` | `scripts/audit-sandbox-budget.ts` + `scripts/sandbox-cost-table.json` + `audit:sandbox-budget` root script (RED→GREEN)           | `9638c59` → `bd84eeb`       |
| `f-m10-ai-chat-e2e`            | `e2e/ai-chat-launch/{86-item,update-price,block-date,move-reservation}.spec.ts` registered in `playwright.config.ts` (RED→GREEN) | `2240c0e` → `101db93`       |
| `f-m10-readiness-checklist`    | `LAUNCH_CHECKLIST.md`; `CHANGELOG.md` `## v0.1.0 — Launch readiness`; `README.md` `## What's next (v0.2 roadmap)`                | `5bb06c4`                   |
| `f-pragent-m10`                | `validation/M10/pr-agent/review.md` (in-mission) + `review-postopen.md` (post-PR-open)                                           | n/a (review artifacts only) |

## Validation

- `pnpm -r run typecheck`: PASS across all 8 workspace packages (added: `docs-site`); `packages/views` astro check 0 errors / 0 warnings / 0 hints.
- `pnpm -r run lint`: PASS for core, reservations, orders-backend, ai, orders-admin, views; `docs-site` has no separate lint script (Starlight scaffold).
- `pnpm -r run test`: PASS — 212 verified deliverables = 204 package tests (M3-M9 baseline preserved; no regressions) + 4 scripts tests + 4 ai-chat-launch specs.
- `pnpm --filter @carte/docs build`: PASS — 13 pages built, **0** `[WARN]` lines on stderr; pagefind index + `sitemap-index.xml` generated.
- pr-agent post-PR-open gate: **CLEAN** — 0 P0/P1/Critical/unresolved-Important findings; 25,997 diff tokens under the 256K cap (no pruning); single re-finding tracked as PRO-640 (non-blocking suggestion). Source: `validation/M10/pr-agent/review-postopen.md`.
- All 26 M10 assertions PASS; `A10.docs.lighthouse` is the lone deferred-to-prprep entry per the validation contract.

## Commits

```
4e30d4a fix(scripts): tests resolve binaries via repo-root pnpm scripts [PRO-418]
5bb06c4 docs(launch): add readiness checklist [PRO-418]
101db93 feat(ai-e2e): add launch fixture wiring [PRO-418]
2240c0e test(ai-e2e): cover launch chat flows [PRO-418]
bd84eeb feat(sandbox-budget): add static auditor [PRO-418]
9638c59 test(sandbox-budget): cover auditor thresholds [PRO-418]
8e7d9a1 feat(rich-results): add JSON-LD verifier [PRO-418]
a0f0739 test(rich-results): cover verifier fixtures [PRO-418]
9012da6 docs(recipes): add M10 launch recipes [PRO-418]
fff7c84 feat(docs): scaffold M10 public docs site [PRO-634]
```

The three code-bearing features (`rich-results`, `sandbox-budget`, `ai-e2e`) each show a `test(<scope>):` RED commit preceding the corresponding `feat(<scope>):` GREEN commit, satisfying `A10.commit.tdd`. Doc-only features are exempt per contract.

## In-flight orchestrator fix

Commit `4e30d4a` (`fix(scripts): tests resolve binaries via repo-root pnpm scripts [PRO-418]`) is an orchestrator-direct test-portability fix landed after the worker-claimed pass: it adds `.npmrc`, defines the `audit:sandbox-budget` root script, and switches `scripts/__tests__/` to invoke binaries via `pnpm run …` so the validator gauntlet's invocation context resolves the same way as a fresh shell. The pr-agent post-PR-open gate confirmed this commit introduced no new findings.

## Discovered follow-ups (non-blocking)

- **PRO-638** — M7 `@carte/views` fixture `DietaryFilter` crash, surfaced incidentally while wiring the `ai-chat-launch` Playwright fixture. Out-of-M10-scope (M7 territory, locked per AGENTS.md M10 hard rule #2). Tracked as a successor.
- **PRO-640** — `scripts/audit-sandbox-budget.ts` `budgetMargin` display drift: hardcodes the subrequest cap (10) and CPU cap (50) in the margin column instead of reading `project.costTable.caps`. PASS/WARN/FAIL gating is correct (it reads the cost table); only the margin string can disagree if caps change. pr-agent classified as a non-blocking "suggestion".

## HITL deferrals

Verbatim from `LAUNCH_CHECKLIST.md`:

- **Real restaurant onboarding** (`restaurant-client`) — import client's real menu, hours, branding, reservation settings, Stripe account, and AI workspace.
- **Lighthouse perf ≥ 80 on the deployed storefront/docs surface** (`external-tool`) — Chrome DevTools Lighthouse / PageSpeed Insights against the live URL.
- **axe a11y zero serious+critical on deployed pages** (`external-tool`) — axe browser extension or Playwright/axe against the live restaurant URL.
- **Google Rich Results live pass** (`external-tool`) — `pnpm verify:rich-results --url https://<restaurant-domain>/_emdash/api/plugins/carte-core/schema-jsonld` then <https://search.google.com/test/rich-results>.
- **EmDash marketplace listing** (`external-tool`) — verify in the EmDash marketplace when available.
- **PRO-423 / PRD OQ#3 order-tracking notifications** (`developer`) — deferred to v0.2 / future `@carte/ops`.
- **PRD OQ#8 Stripe Connect for multi-location** (`developer`) — deferred to v0.3 multi-location work.
- **PRD OQ#11 nested/advanced modifier engine** (`developer`) — v0.2 roadmap.
- **PRO-423 / PRD OQ#12 cancellation policy enforcement** (`developer`) — deferred to v0.2 / future `@carte/ops`.
- **PRO-623 M8 follow-ups** (`developer`) — non-blocking AI hardening successors tracked in Linear.

## Mission close pointer

The broader OpenSpec consolidation for v0.1 — the per-feature change set under `openspec/changes/PRO-v01-build/` and its archival to `openspec/archive/2026-05-09-PRO-v01-build/` — and the mission-wide `WRAP_UP.md` are out of scope for this commit. Both happen post-merge in a separate worker dispatch. This file exists solely to satisfy the local merge-gate hook for PR #12.

## References

- PR: https://github.com/foreztgump/carte/pull/12
- Linear: PRO-418 (launch gate); PRO-634 (docs scaffold); PRO-638, PRO-640 (non-blocking follow-ups)
- Validation: `/home/cownose/.factory/missions/343410ef-f054-4252-b8e2-7a108ff4e717/validation/M10/scrutiny/synthesis.json`
- User-testing: `/home/cownose/.factory/missions/343410ef-f054-4252-b8e2-7a108ff4e717/validation/M10/user-testing/synthesis.json`
- pr-agent post-PR-open gate: `/home/cownose/.factory/missions/343410ef-f054-4252-b8e2-7a108ff4e717/validation/M10/pr-agent/review-postopen.md`
- Launch checklist: `LAUNCH_CHECKLIST.md`
