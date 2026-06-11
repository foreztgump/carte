# Carte v0.2.0-rc — Tender adapter + tech-debt sweep

> **Mission ID (Factory):** `297ade68-b255-4753-8fac-9c4f0b78a562`  
> **Branch:** `feat/PRO-tender-adapter`  
> **Linear:** PRO-727 (Tender adapter), PRO-623 (AI hardening), PRO-638
> (DietaryFilter fallback), PRO-640 (sandbox-budget display), PRO-737 (rc
> publish gate)

This OpenSpec change mirrors the Carte v0.2.0-rc mission. The rc routes
`@carte/orders-backend` through the Tender payment model, removes Carte-owned
Stripe webhook handling, and closes the v0.1 tech-debt follow-ups needed before
Vicky's Kitchen M5 can consume Carte.

Archive is intentionally out of scope for this mission. A separate post-merge
sweep will archive `openspec/changes/PRO-v02-tender-adapter/` after the rc PR
squash-merges.

## Why

Vicky's Kitchen M5 depends on Carte publishing an rc of
`@carte/orders-backend` that delegates payment-provider concerns to Tender
instead of hard-coding Stripe. PRO-727 therefore needs a release-candidate cut,
not a GA release, so downstream validation can happen before `0.2.0` promotion.

The same rc includes three v0.1 follow-ups that were intentionally deferred out
of the launch freeze:

- PRO-623 — harden the AI write-on-confirm boundary: actor checks,
  authoritative `priceDiff.before`, KV PII redaction, undo correctness, SSRF
  guard, KV prefix discipline, and consistent envelopes.
- PRO-638 — make unknown allergen tags render safely instead of crashing
  `DietaryFilter`.
- PRO-640 — make sandbox-budget margin display read the active cap table rather
  than stale literals.

## What changes

| Capability       | Linear                                | Change                                                                                                                   |
| ---------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `payments`       | PRO-727 / PRO-728 / PRO-732 / PRO-735 | Checkout and refunds call the real `@tender/sdk`; `@tender/sdk` is a peer dependency per OQ-2.                           |
| `webhook`        | PRO-727 / PRO-731 / PRO-733           | Carte deletes `/webhook-stripe`; Tender owns the Stripe webhook URL.                                                     |
| `events`         | PRO-727 / PRO-733 / PRO-734           | Placeholder `tender:payment.succeeded` and `tender:payment.refunded` hooks encode the future EmDash 0.10 event contract. |
| `ai-tool-call`   | PRO-623                               | AI confirmations and undo/audit KV writes are hardened without changing the public write-on-confirm contract.            |
| `sandbox-budget` | PRO-640                               | Budget reports use `costTable.caps` for displayed margins.                                                               |
| `views-taxonomy` | PRO-638                               | Unknown allergen tags humanize to a safe label.                                                                          |

## OQ decisions

- **OQ-1 (PRO-733):** collapsed. The real `@tender/sdk` has no `events.list`
  cursor API, so a polling fallback is not implementable. Carte ships
  placeholder `tender:*` hooks pending EmDash 0.10 custom hook namespace
  dispatch and documents this in `docs/decisions/oq1-tender-hook-namespace.md`.
- **OQ-2 (PRO-735):** `@tender/sdk` is a peer dependency. Operators install the
  three-plugin model (`@carte/orders-backend`, `tender-core`, `tender-stripe`)
  and provide `@tender/sdk@^0.1.0` once Tender publishes it.

## Impact

- Operators must follow `MIGRATION.md`: change the Stripe dashboard webhook URL
  to Tender, move Stripe secrets to `@tender/stripe`, and install the Tender
  payment packages.
- `@carte/orders-admin` is not changed; the existing refund button continues to
  POST to the same Carte backend route.
- `@carte/orders-backend@0.2.0-rc.1` publish remains HITL-gated by PRO-737 until
  Tender publishes the SDK/provider packages.

## Non-goals

- Publishing the real npm package from a worker session.
- Promoting `0.2.0-rc` to GA.
- Implementing Tender itself or changing the Tender repo.
- Modifying archived OpenSpec v0.1 changes.

## Rollback plan

Rollback for operators is documented in `MIGRATION.md`: install
`@carte/orders-backend@^0.1.0`, restore the legacy Stripe settings, and point the
Stripe dashboard webhook back to
`/_emdash/api/plugins/carte-orders-backend/webhook-stripe`. Repository rollback
is a normal revert of the squash commit for `feat/PRO-tender-adapter`.
