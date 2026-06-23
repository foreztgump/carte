# Changelog

All notable changes to this project will be documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased — R1 packaging

### Added — WS4 Tender fulfillment wiring

- `@carte/orders-backend` now consumes the published `@tenderpay/sdk@^0.2.0`
  (replacing the workspace-private `@tender/sdk@0.0.0` build input) and wires the
  WS4 consumer-eventing path end to end. A new public return-URL route
  (`routes/return.ts`) short-polls the transaction to a terminal `paid` status
  (bounded by a 2s in-request budget) via `fulfillTransaction` + a durable KV
  dedup store, then drives the order's `paid` transition exactly once —
  idempotent under at-least-once delivery, with no `tender:*` hook and no
  Carte-side polling of storage. Checkout now returns
  `{ checkoutUrl, transactionId }` so the return trip can correlate.
- Resolved the `allowedHosts` trust contract (PRO-912): the manifest declares
  `network:request:unrestricted` and drops the static
  `license.carteplugin.dev` allowlist, since the Tender base URL is an
  operator-configured runtime setting unknown at authoring time. Card data still
  never transits Carte.

### Changed — public repository readiness

- Completed the PRO-895 pre-public secrets/URL audit and made
  `foreztgump/carte` public for npm provenance/source links.

### Added — build scripts for native + library packages

- `@carte/orders-admin` and `@carte/views` now ship a `build` script (tsdown)
  producing `dist/`, with `main`/`exports`/`files` pointed at the built output
  ([PRO-898](https://linear.app/projects-linear/issue/PRO-898)). orders-admin
  emits ESM + `.d.mts`; views compiles its TS modules and copies raw `.astro`
  components to `dist/components/`. Consumers (and the e2e views fixture) must
  run the build before importing from these packages. `@carte/ai` is excluded
  (deferred) and keeps its `src`-based setup.

## v0.2.0 — Tender adapter (rc)

### Changed — Tender payment handoff

- `@carte/orders-backend` now routes hosted checkout and refunds through the
  Tender adapter (`@tender/sdk`) instead of direct Stripe API calls, closing the
  core [PRO-727](https://linear.app/projects-linear/issue/PRO-727/carte-tender-adapter-route-carteorders-backend-through-tendersdk)
  path needed before Vicky's Kitchen M5 can consume Carte payments.
- Carte no longer owns the Stripe webhook route. Operators should move their
  Stripe dashboard webhook URL and provider secrets to the Tender Stripe
  provider before installing the rc; see the
  [v0.2.0-rc migration guide](./MIGRATION.md).
- This is an rc cut, not GA. The actual publish remains tracked by
  [PRO-737](https://linear.app/projects-linear/issue/PRO-737/publish-carteorders-backend020-rc-and-tag-release)
  and is gated on Tender publishing `@tender/sdk@0.1.0`, `tender-core`, and
  `tender-stripe`.

### Fixed — v0.1 tech-debt sweep

- Hardened the `@carte/ai` write-on-confirm flow for the
  [PRO-623](https://linear.app/projects-linear/issue/PRO-623/m8-follow-ups-pii-boundary-workspace-least-privilege-undo-correctness)
  follow-up: actor-bound confirmations, current-content price diffs, PII
  redaction in undo/audit KV, undo replay/expiry correctness, SSRF guardrails,
  KV namespace hygiene, and response-envelope consistency.
- Fixed the
  [PRO-638](https://linear.app/projects-linear/issue/PRO-638/carteviews-dietaryfilter-crashes-on-unknown-allergen-tag-tolowercase)
  `@carte/views` dietary-filter crash by making unknown allergen tags render as
  humanized fallback labels instead of throwing.
- Fixed
  [PRO-640](https://linear.app/projects-linear/issue/PRO-640/sandbox-budget-display-drift)
  sandbox-budget display drift so margin output reads the configured caps rather
  than hardcoded 10-subrequest / 50ms assumptions.

## v0.1.0 — Launch readiness (2026-05-09)

### Added — M3 through M9 plugin family

- M3 `@carte/core`: menus, restaurant info, hours, canonical EmDash manifest, Block Kit admin, timezone-aware 86 restore, allergen/dietary taxonomy, audit entries, and schema.org Restaurant/Menu JSON-LD.
- M4 `@carte/reservations`: reservation collections, public submit/confirm/cancel routes, HMAC guest tokens, email-first notifications, race-safe capacity holds, and read-time slot generation.
- M5 `@carte/orders-backend`: Stripe Checkout, PCI-minimized order flow, idempotent webhook handling, refund route, order snapshots, and sandboxed Block Kit admin.
- M6 `@carte/orders-admin`: native React order-management UI with list/detail views, refunds, status workflow, email template editing, and single-tier modifier editing.
- M7 `@carte/views`: Astro peer-dependency storefront components for restaurant info, menus, dietary filters, hours, reservations, cart/checkout, and success/status pages.
- M8 `@carte/ai`: native AI panel with license/trial state, BYO LLM key support, SSE chat, PII boundary enforcement, write-on-confirm tool calls, audit logs, 10-minute undo, inline actions, and MCP wrapper.
- M9 GDPR/security hardening: guest-data export and erasure, public-route rate limiting, pen-smoke coverage for replay/capacity/license-outage paths, and AgentShield CI coverage.

### Added — M10 launch readiness

- Public Astro Starlight docs site under `docs-site/` with plugin overview pages and end-to-end recipes.
- Rich Results verifier wired to `pnpm verify:rich-results`.
- Sandbox budget auditor for sandboxed plugin route handlers.
- AI launch Playwright suite covering 86 item, update price, block date, and move reservation flows.
- Root `LAUNCH_CHECKLIST.md` mapping PRO-418 success metrics to verification owners and HITL-deferred gates.
- README v0.2 roadmap section for successor work after the v0.1 launch package.

## 0.0.1 — 2026-05-06 (mission close)

This release closes the **WP Analysis + OQ Resolution + Monorepo Scaffolding** mission (Factory mission `d702a513-34b3-427e-85eb-59c759f31778`). It contains no plugin business logic — only documentation, locked decisions, and the empty monorepo skeleton against which the per-plugin missions will execute.

### Added — Milestone 0 (competitive analysis)

- `docs/competitive-analysis/latepoint.md` — full teardown of LatePoint (87 unique citations, ADAPT verdict on time-slot algorithm).
- `docs/competitive-analysis/orderable-pro.md` — full teardown of Orderable Pro (95 citations; OQ#11 single-tier modifier recommendation).
- `docs/competitive-analysis/restrofood.md` — full teardown of RestroFood (93 citations).
- `docs/competitive-analysis/adoptable-patterns.md` — synthesis (11 patterns, 4 MUST-ADOPT).
- `docs/competitive-analysis/avoid.md` — anti-patterns (6 chronic-problem sections + 7 footguns; includes RestroFood licensing footgun).
- Linear backlog reconciliation: 7 sub-tasks (PRO-470 through PRO-476).

### Added — Milestone 1 (open questions locked)

- All 12 PRD `Open Questions` resolved (9 RESOLVED, 3 DEFERRED to v0.2/v0.3).
- Canonical EmDash capability names (`content:read`, `content:write`, `media:read`, `media:write`, `network:request[:unrestricted]`, `email:send`, `users:read`) locked across PRD + AGENTS.
- EmDash plugin SDK pinned to `^0.9.0`; emdash@1.0.0 explicitly avoided.
- Sandbox runtime caps locked (50ms CPU + 10 subrequests + 30s wall + 128MB memory).
- `@carte/ai` trial licensing pattern locked (server-side check at `license.carteplugin.dev` + 24hr KV cache + graceful degrade + Lemon Squeezy billing).
- MCP interim plan documented (plugin routes + standalone wrapper Worker until EmDash ships custom MCP tool registration; upstream comment on emdash discussion #850).
- `AGENTS.md` Linear branch/commit prefix changed from CART to PRO.
- `PRD.md §Competitive Analysis` slimmed to a 4-bullet pointer into `docs/competitive-analysis/` (the marketing table moved out).

### Added — Milestone 2 (monorepo scaffolding)

- `pnpm-workspace.yaml` with 6 plugin packages: `@carte/{core, reservations, orders-backend, orders-admin, views, ai}`.
- TypeScript strict mode (noUncheckedIndexedAccess + exactOptionalPropertyTypes), ESLint flat config v9, Prettier, husky pre-commit + lint-staged.
- Vitest 2.1.9 workspace runner (vitest.workspace.ts) with per-package shims; 12 smoke tests passing (2 per package); TDD discipline (RED before GREEN) verifiable in commit log.
- Playwright 1.59.1 config at root (no specs — deferred to per-plugin missions).
- Wrangler 4.x configs for the 3 sandboxed plugins (`@carte/core`, `@carte/reservations`, `@carte/orders-backend`); `.dev.vars.example` at repo root.
- GitHub Actions CI: typecheck + lint + build (if-present) + test + AgentShield scan; runs on `pull_request` + `push: branches: [main]`.
- Changesets per-package semver (`@changesets/cli` + `@changesets/changelog-github`).
- `README.md`, `CONTRIBUTING.md`, root `LICENSE` (MIT), `packages/ai/LICENSE` (commercial NOTICE), `.editorconfig`.

### Notes

- `@carte/ai` is the only commercial plugin in v0.0.1 (commercial NOTICE; 14-day trial + $99/yr per PRD).
- `@carte/views` is a peer-dep library (no `definePlugin` manifest, no Wrangler config).
- All plugin packages start at `0.1.0` for the next per-plugin missions to bump.
- No plugin handler implementations land in this release — only `{ ok: true, plugin, route }` route stubs.

### Boundary

- GPL clean-room: vendored `research/sources/carte/` source files were never modified across the mission; PHP snippets in competitive-analysis docs ≤5 lines per quote.
