# Carte v0.1 — Business-Logic Build (M3 → M9)

> **Mission ID (Factory):** `2f89fbaa-74d4-4207-9c5c-0e7039d70ee2`
> **Linear project:** Carte — EmDash Restaurant Plugin Family (`d76f6d70-ad1a-497a-8e9d-1895647c035c`)
> **Branches:** `feature/PRO-m3-carte-core` … `feature/PRO-m9-gdpr-hardening` (one per milestone, squash-merged)
> **Default branch:** `main`

This OpenSpec change is the portability mirror for the Factory mission of the same id. It captures the full v0.1 product build across 7 milestones (M3-M9) for the Carte EmDash restaurant plugin family. M10 (Launch) is **gated** and explicitly out of scope for this change.

## Why

Carte's monorepo, tooling, CI, and competitive analysis are in place (M0/M1/M2 archived). Plugin manifests are stubs that return `{ ok: true }`. To ship v0.1 to a real restaurant client, we now need:

- A real `@carte/core` (manifests, hooks, Block Kit admin, JSON-LD, taxonomy, 86 button).
- A real `@carte/reservations` with race-safe capacity counters and read-time slot computation.
- A real `@carte/orders-backend` with idempotent Stripe webhook handling and 600s cart hold.
- A native React `@carte/orders-admin` for order/modifier/refund management.
- The Astro peer-dep `@carte/views` component library, mobile-first and a11y-AA.
- The commercial `@carte/ai` plugin with a 14-day trial, license-server graceful degrade, MCP interim plan, and HR8-compliant write-on-confirm tool calls.
- GDPR (export + erasure) plus security hardening (rate limit, AgentShield, pen-smokes) before any live deploy.

Each milestone is a single squash-merged PR with a passing validator-droid gate. The mission pauses after M9 for explicit user go-ahead before M10 (live-restaurant deploy).

## What Changes

| Capability                                                  | Milestone | Branch                          |
| ----------------------------------------------------------- | --------- | ------------------------------- |
| `carte-core` (foundation)                                   | M3        | `feature/PRO-m3-carte-core`     |
| `carte-reservations` (booking + capacity)                   | M4        | `feature/PRO-m4-reservations`   |
| `carte-orders-backend` (Stripe Checkout + webhook + refund) | M5        | `feature/PRO-m5-orders-backend` |
| `carte-orders-admin` (native React admin)                   | M6        | `feature/PRO-m6-orders-admin`   |
| `carte-views` (Astro components)                            | M7        | `feature/PRO-m7-views`          |
| `carte-ai` (commercial chat + tool-call + MCP wrapper)      | M8        | `feature/PRO-m8-ai`             |
| `carte-gdpr-hardening` (GDPR + rate limit + AgentShield)    | M9        | `feature/PRO-m9-gdpr-hardening` |

Each capability gets its own spec under `specs/<capability>/spec.md`. The `tasks.md` file lists every feature in checkbox form, tagged by milestone.

## Capabilities (added)

- `carte-core`
- `carte-reservations`
- `carte-orders-backend`
- `carte-orders-admin`
- `carte-views`
- `carte-ai`
- `carte-gdpr-hardening`

## Impact

- All 6 packages (`packages/{core,reservations,orders-backend,orders-admin,views,ai}/`) get real implementations replacing the M2 stubs.
- `@carte/ai` adds a sub-package: `packages/ai/mcp-wrapper/` (standalone Worker) for the MCP interim plan.
- `.github/workflows/ci.yml` gains an AgentShield job (M9).
- `PRD.md` is patched once: OQ#3+#12 marked DEFERRED with rationale (M3 / f-m3-pro423-defer / closes PRO-423).
- Per-package CHANGELOG entries via Changesets every milestone (independent semver per `linked: []`).
- No production deploy. M10 is gated.

## Non-Goals

- M10 — first-live-restaurant deploy (gated; user approval required).
- Multi-location data model (v0.3).
- Embedded Stripe Payment Element (v0.1 is Checkout-only).
- WordPress import tooling.
- License-server stack itself (we consume `license.carteplugin.dev`; we do not build it).
- Custom MCP tool registration in EmDash core (waiting upstream Discussion #850; v0.1 ships interim plan).

## Rollback Plan

Each milestone is a single squash commit on `main`. Rollback = `git revert <sha>` + open follow-up issue. Within a milestone, individual feature commits stack on the milestone branch — drop a problematic commit before squash if validator surfaces a blocker. No production database/KV state is at risk during this change (local Vitest + `@cloudflare/vitest-pool-workers` only). Linear status changes are reversible.

## Risks

| Risk                                                            | Mitigation                                                                                                                                 |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Sandbox subrequest budget exceeded on Stripe webhook (~7 of 10) | Design-time audit per route + `@cloudflare/vitest-pool-workers` runtime assertion (≤ 7)                                                    |
| Capacity counter race (reservation oversell)                    | KV atomic decrement only (HR6); 100-concurrent Vitest fuzz (A4.capacity.raceSafe); 1000-concurrent pen-smoke (A9.pen.capacityRace)         |
| Stripe webhook re-delivery double-processing                    | KV `idempotency:{eventId}` 7-day TTL; replay test (A5.webhook.idempotency) + adversarial replay (A9.pen.replayWebhook)                     |
| License server outage locks restaurant out of AI                | Graceful-degrade pattern: 24hr KV cache + last-known-good fallback + trial-mode banner; pen-smoke A9.pen.licenseOutage verifies            |
| Schema.org JSON-LD breaks Google rich-results                   | Generator passes Rich Results Test (A3.jsonld.richResults); storefront page also (A7.schemaRichResults)                                    |
| AI write actions cause silent destructive edits                 | HR8: diff preview + explicit confirm + audit + 10-min undo; PII redacted unless per-turn opt-in; per-tool/per-workspace auto-approve scope |
| EmDash 0.9.0 ↔ 1.0.0 drift surprises                            | SDK pin `^0.9.0` enforced in every manifest + CI smoke; never bump in this mission                                                         |
| Cloudflare Free degrades sandbox isolation                      | Documented in plugin READMEs (M3, M4, M5); install-flow surface                                                                            |
| AgentShield false positives blocking merge                      | Allowlist with rationale comments + security-review-droid sign-off (M9)                                                                    |
