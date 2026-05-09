# Carte v0.1 Mission — Wrap-Up

End-of-mission summary for the Carte v0.1 plugin family build (M3 → M10).
This document is the canonical narrative artifact for the mission close;
detailed evidence lives in the per-milestone validation/PR/OpenSpec records
referenced below.

## Mission identity

- **Mission ID:** `343410ef-f054-4252-b8e2-7a108ff4e717`
- **Mission directory (orchestrator-owned):**
  `/home/cownose/.factory/missions/343410ef-f054-4252-b8e2-7a108ff4e717/`
- **Started:** 2026-05-05 (M3 kickoff after monorepo scaffolding mission close)
- **Shipped:** 2026-05-09 (M10 PR #12 squash-merged to `main`)
- **Final mission commit on `main`:**
  `52926ca92828b09688ced5cb77e7963a93149540` —
  "M10: launch readiness — docs site, verifier scripts, AI launch e2e, checklist [PRO-418]"
- **Linear initiative / project:**
  [Carte — EmDash Restaurant Plugin Family](https://linear.app/projects-linear/project/carte-emdash-restaurant-plugin-family)
  (`d76f6d70-ad1a-497a-8e9d-1895647c035c`, team `NetworkReef`, key `PRO`)
- **Mission close epic:**
  [PRO-418 — Epic: Launch — first live restaurant client](https://linear.app/projects-linear/issue/PRO-418/epic-launch-first-live-restaurant-client)

## What shipped

Each milestone is one squash-merged PR against `main` (with M9 as a documented
exception below). The merged mission PRs landed between 2026-05-06 and
2026-05-09; SHAs are the squash-merge commits on `main`. PR #13 (OpenSpec
archive) is open at mission close and dispatched separately.

| Milestone | Scope                                                                                                                                                                                          | PR                                                                         | Merge SHA       | Linear epic |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | --------------- | ----------- |
| M3        | `@carte/core` — allergen/dietary taxonomy, schema.org JSON-LD route, structured price, timezone-aware 86 restore (sandboxed)                                                                   | [#4](https://github.com/foreztgump/carte/pull/4)                           | `4f93b1f`       | PRO-410     |
| M4        | `@carte/reservations` — capacity holds (atomic KV decrement), HMAC guest tokens, public submit/confirm/cancel, calendar feed (sandboxed)                                                       | [#5](https://github.com/foreztgump/carte/pull/5)                           | `a2f1c05`       | PRO-411     |
| M5        | `@carte/orders-backend` — Stripe Checkout (no PAN/CVC on Carte infra), idempotent webhook, refund route, order snapshots (sandboxed)                                                           | [#6](https://github.com/foreztgump/carte/pull/6)                           | `7b1a20a`       | PRO-412     |
| M6        | `@carte/orders-admin` — native React admin: list/detail, idempotent refunds, status workflow, email templating, single-tier modifier editor                                                    | [#7](https://github.com/foreztgump/carte/pull/7)                           | `d6e812e`       | PRO-413     |
| M7        | `@carte/views` — Astro peer-dep storefront components (XSS-safe; props in, no fetch); menu, hours, reservation, cart, checkout, records                                                        | [#8](https://github.com/foreztgump/carte/pull/8)                           | `46a1fa7`       | PRO-414     |
| M8        | `@carte/ai` — native React AI panel; license/trial state, BYO LLM key, SSE chat, PII boundary, write-on-confirm tool calls, audit + 10-min undo, MCP wrapper Worker                            | [#9](https://github.com/foreztgump/carte/pull/9)                           | `46729be`       | PRO-415     |
| —         | OpenSpec sweep — M3-M9 spec coverage and Given/When/Then scenarios consolidated                                                                                                                | [#11](https://github.com/foreztgump/carte/pull/11)                         | `dca88cb`       | PRO-417     |
| M9        | GDPR + security hardening — guest-data export/erasure, public-route rate limiting, pen-smoke tests (replay/capacity/license outage), AgentShield CI step                                       | (no PR — direct squash, see note)                                          | `7e60cbe`       | PRO-411     |
| M10       | Launch readiness — Astro Starlight docs site, rich-results verifier, sandbox-budget auditor, AI launch Playwright suite, `LAUNCH_CHECKLIST.md`, `## v0.1.0` CHANGELOG, `## What's next` README | [#12](https://github.com/foreztgump/carte/pull/12)                         | `52926ca`       | PRO-418     |
| —         | OpenSpec mission archive — `openspec/changes/PRO-v01-build/` → `openspec/archive/2026-05-09-PRO-v01-build/`                                                                                    | [#13](https://github.com/foreztgump/carte/pull/13) (open at mission close) | (pending merge) | PRO-418     |

Note on M9 ship path: `gh pr list --state merged` shows #4-#9, #11, #12 as the
merged mission PRs. The original M9 PR #10 (`@carte/ai MCP wrapper —
audit-then-erase ordering`) was closed without merge; M9 GDPR/hardening landed
directly on `main` as the conventional-commit squash `7e60cbe feat(ai): M9 —
GDPR export/erase routes + rate limiting [PRO-411]` plus the two M9 doc-sweep
follow-ups (`cbe5266`, `4176373`). The mission's PR roster for the wrap-up is
therefore: M3-M8 (#4-#9), OpenSpec sweep (#11), M10 (#12), and OpenSpec
archive (#13) — eight PRs total across mission orchestration.

## Architecture decisions locked

These are binding for v0.1 and were enforced by the M3-M10 validation gauntlet.
Source: `AGENTS.md` (repo root, "EmDash Plugin Constraints" + "Stack Pins") and
mission `AGENTS.md` (Hard rules section, mission-id `343410ef-...`).

- **EmDash plugin SDK pinned to `^0.9.0`** (released 2026-05-01). Do NOT pull
  in `emdash@1.0.0` — it is on npm but not `latest`-tagged and removes
  `locals.emdash.invalidateManifest`.
- **Sandbox runtime caps are HARD**: 50 ms CPU, 10 subrequests, 30 s wall, ~128
  MB memory per sandboxed plugin invocation. Audited statically for every
  sandboxed handler by `scripts/audit-sandbox-budget.ts` and runtime-asserted
  by `@cloudflare/vitest-pool-workers`. Approaching the ceiling means redesign,
  not "make it fit."
- **Native vs sandboxed boundary**: `@carte/core`, `@carte/reservations`,
  `@carte/orders-backend` are sandboxed; `@carte/orders-admin` and `@carte/ai`
  are native React; `@carte/views` is an Astro npm peer-dep library (no
  `definePlugin` manifest, no Wrangler config). Native plugins talk to
  sandboxed plugins via typed REST contracts in `@carte/core/contracts` only.
- **MCP wrapper interim plan** (M8): EmDash 0.9.0 does not yet expose custom
  MCP tool registration (upstream emdash Discussion #850). Carte ships a
  standalone MCP wrapper Worker under `packages/ai/mcp-wrapper/` that proxies
  to the existing plugin routes at `/_emdash/api/plugins/<id>/<route>`. To be
  replaced when EmDash ships a first-class MCP API.
- **License server interim** (M8): server-side check at
  `license.carteplugin.dev` with a 24 h KV cache and graceful degrade on
  outage (NEVER lock out the restaurant). Lemon Squeezy is the recommended
  billing provider. The license-server stack itself is OUT OF SCOPE for v0.1
  — this mission only consumes it.
- **Stripe Checkout PCI scope** (HR7, M5): Carte infrastructure NEVER receives
  raw PAN/CVC/expiry. Only PaymentIntent IDs. The `@carte/orders-backend`
  webhook verifies signature first, then dedupes via `idempotency:{eventId}`
  in KV with a 7-day TTL, then enqueues post-response work via
  `ctx.waitUntil`.
- **Capacity counters use atomic KV decrement** (HR6, M4). No
  read-modify-write. Race-tested with 1000 concurrent reservation submits in
  `packages/reservations`'s pen-smoke suite at M9.
- **GDPR export + erasure** (M9): public routes for guest-data export by email
  and erasure (PII stripped, retention documented). Public routes are
  rate-limited via `packages/{core,reservations,orders-backend}/src/rate-limit.ts`.
- **AI write actions = diff preview + explicit user confirm + audit + 10-min
  undo** (HR8, M8). Auto-approve lists are scoped per-tool, per-workspace.
  Audit entries cover all allergen edits regardless of source (manual, AI,
  imported — HR9).
- **PII boundary at the tool-call layer**, not in prompts (M8). PII never
  leaves to the LLM without explicit per-turn user opt-in.

## Validation evidence

- **Total verified deliverables: 212.** Source:
  `validation/M10/scrutiny/synthesis.json` —
  > "All 6 workspace package suites green: core 41, reservations 26,
  > orders-backend 20, views 51, ai 48, orders-admin 18 = 204 tests
  > (M3-M9 baseline preserved; no regressions from M10 work). Plus scripts
  > package: verify-rich-results 2 + audit-sandbox-budget 2 = 4. Plus
  > Playwright ai-chat-launch project: 4 specs (86-item, update-price,
  > block-date, move-reservation). Total verified deliverables: 212."
- **Per-milestone validation synthesis files** are at
  `/home/cownose/.factory/missions/343410ef-f054-4252-b8e2-7a108ff4e717/validation/M{3..10}/{scrutiny,user-testing}/synthesis.json`.
  All eight milestones report `overallStatus: "pass"` in
  `validation-state.json`.
- **PR-Agent rounds**: one clean round per milestone for M3-M7 and M9-M10.
  **M8 took 6 rounds** to converge — the longest tail was the `workspaceId`
  discipline class (least-privilege scoping for AI auto-approve lists). Final
  M10 pr-agent run on `feature/PRO-m10-launch` vs `main`: zero
  P0/P1/Critical/unresolved-Important; one non-blocking suggestion tracked as
  PRO-640 (sandbox-budget display polish). Source:
  `validation/M10/scrutiny/synthesis.json` `featureReviews[f-pragent-m10]`.
- **6 packages green** repo-wide: `pnpm -r typecheck && pnpm -r lint && pnpm
-r test` exits 0 across `core`, `reservations`, `orders-backend`,
  `orders-admin`, `views`, `ai` plus the M10-introduced `docs-site` workspace
  (8 packages total at mission close).
- **Deferred-but-tracked assertions** (gauntlet PASS, owner-listed in
  `LAUNCH_CHECKLIST.md`):
  - `A5.perf.benchmark` and `A7.perf.benchmark` — Lighthouse, deferred to
    M9, then to PR-prep / HITL.
  - `A6.a11y.axeClean` — axe a11y URL audit, deferred to PR-prep / HITL.
  - `A10.docs.lighthouse` — docs-site Lighthouse, deferred to PR-prep / HITL.

## Mission learnings (infrastructure)

Three orchestration decisions were promoted to standing policy during the
mission and are recorded in mission `AGENTS.md` ("Standing infrastructure
decisions inherited from M3-M9 phases" and "Validator authorship"). They will
re-apply on v0.2.

1. **Validator authorship is orchestrator-direct.** After repeated
   `factoryd` spawn-timeout failures on `scrutiny-validator-*` and
   `user-testing-validator-*` features at M4, M6, and M7, the orchestrator now
   authors all `validation/MN/{scrutiny,user-testing}/synthesis.json` files
   directly using the M6 layout as template. Per-feature scrutiny reviews are
   still fanned out to `scrutiny-feature-reviewer` workers in parallel.
   `validation-state.json` is owned by the orchestrator at milestone close.

2. **PR-Agent local routing pins** (locked after M8 round 1 surfaced fewer
   real blockers than expected):
   - Provider: `openai/glm-5.1-syn` (NOT `openai/glm-5.1` — the latter
     returns `content:null` because the model output lands in
     `reasoning_content` and pr-agent strips it).
   - `CONFIG__CUSTOM_REASONING_MODEL=true` env required.
   - `MAX_MODEL_TOKENS=256000` — the default 179K silently prunes diff
     context.
   - Worktree caveat: pr-agent rejects worktrees because their `.git` is a
     file, not a directory. Orchestrator runs pr-agent from a `git clone
--no-local` of the worktree to a temp dir.
   - High-risk findings escalate to a GPT-5.2 cascade (single per-tier
     fallback; double-fail returns BLOCKED — surfaced to orchestrator).

3. **Per-milestone `WRAP_UP.md` is hard-required by the merge-gate hook**
   (discovered at M10). Each milestone PR description must include a
   `## PR Review Triage` section. Surface this requirement on every future
   mission's bootstrap checklist.

## Discovered follow-ups (carried into v0.2)

Filed during M3-M10 and intentionally NOT patched in this mission (M10 hard
rule #2: do not modify `packages/*/src/` to "fix" things found during launch
verification — file follow-ups instead).

- [PRO-638](https://linear.app/projects-linear/issue/PRO-638/carteviews-dietaryfilter-crashes-on-unknown-allergen-tag-tolowercase)
  — `@carte/views` `<DietaryFilter>` crashes on unknown allergen tag
  (`.toLowerCase()` on undefined). Discovered while running the views
  fixture for the M10 AI launch e2e suite.
- [PRO-640](https://linear.app/projects-linear/issue/PRO-640/audit-sandbox-budget-budgetmargin-display-formatting-uses-hardcoded-caps)
  — `scripts/audit-sandbox-budget.ts` `budgetMargin` display formatting
  hardcodes the 50ms/10subreq caps instead of reading from
  `scripts/sandbox-cost-table.json` `costTable.caps`. Display drift only;
  pr-agent classified as "suggestion."
- [PRO-623](https://linear.app/projects-linear/issue/PRO-623/m8-follow-ups-pii-boundary-workspace-least-privilege-undo-correctness)
  — M8 non-blocking AI hardening follow-ups (PII boundary edge cases,
  workspace least-privilege scoping, undo correctness on partial diffs).

## HITL deferrals (user-owned post-merge)

Verbatim from `LAUNCH_CHECKLIST.md` — these items intentionally cannot be
completed by autonomous workers because they require a live restaurant, a
deployed URL, authenticated external tooling, or business approval.

- **Real restaurant onboarding** — owner: `restaurant-client`. Menu import,
  hours, branding, reservation settings, Stripe account, AI workspace.
- **Lighthouse perf ≥ 80 on storefront / ≥ 85 on docs** — owner:
  `external-tool`. Verify with Lighthouse in Chrome DevTools or PageSpeed
  Insights against the live URL.
- **axe a11y zero serious+critical on deployed pages** — owner:
  `external-tool`. axe browser extension or Playwright/axe against the live
  restaurant URL.
- **Google Rich Results live pass** — owner: `external-tool`. Run `pnpm
verify:rich-results --url
https://<restaurant-domain>/_emdash/api/plugins/carte-core/schema-jsonld`
  and confirm the live page in
  <https://search.google.com/test/rich-results>.
- **EmDash marketplace listing** — owner: `external-tool`. Verify in the
  EmDash marketplace when that marketplace is available.

## Mission close artifacts

- **OpenSpec mission archive**: `openspec/changes/PRO-v01-build/` → archived
  to `openspec/archive/2026-05-09-PRO-v01-build/` via PR
  [#13](https://github.com/foreztgump/carte/pull/13)
  (`chore/openspec-archive-v01-build`, dispatched separately).
- **Launch checklist**: [`LAUNCH_CHECKLIST.md`](./LAUNCH_CHECKLIST.md) — maps
  PRO-418 success metrics to verification owners and the HITL-deferred gates
  above.
- **Changelog**: [`CHANGELOG.md`](./CHANGELOG.md) `## v0.1.0 — Launch
readiness` section enumerates every M3-M10 deliverable.
- **README v0.2 roadmap**: [`README.md`](./README.md) `## What's next (v0.2
roadmap)` section lists the named successor work and links the existing
  follow-up Linear issues (PRO-623, PRO-638).

## What's next (v0.2)

The README's `## What's next (v0.2 roadmap)` section is the canonical pointer
for v0.2 scoping: `@carte/floor-plan`, limited-quantity inventory, an embedded
Payment Element option, kitchen order-status PWA, and an advanced modifier
engine. New `PRO-419+` v0.2 epics will be linked from that section as they are
opened.

## PR Review Triage

pr-agent local review on PR #14 (2026-05-09): pending post-open run; will be
recorded here at merge time.

For the mission as a whole, every milestone PR (M3–M10) plus PR #13 (OpenSpec
archive) passed pr-agent local review with **0 P0 / 0 P1 / 0 Critical / 0
unresolved Important** findings. Aggregate triage outcome across the mission:

- 0 Critical findings carried to merge
- 0 P0 actionable
- 0 P1 actionable
- 0 unresolved Important

Saved review artifacts live under
`~/.factory/missions/343410ef-f054-4252-b8e2-7a108ff4e717/validation/<milestone>/pr-agent/`
and `validation/PR-13-archive/pr-agent/review.md`.

This PR is documentation-only (the mission retrospective itself) — no code
changes, no functional impact. There is nothing to triage beyond the routing
note above.
