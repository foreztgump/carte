# Tasks — Carte v0.2.0-rc Tender adapter

All items are checked because M1, M2, M3, and the prerequisite M4 docs/changeset
features are complete at the time this OpenSpec delta is opened. TDD is exempt
for this prose/config OpenSpec feature, but code-bearing tasks below retain the
mission's commit-level RED → GREEN history.

## M0 — workspace prerequisite

- [x] **f-m0-workspace-link** — Wire `/home/cownose/projects/tender/packages/sdk`
      into the Carte workspace and declare `@tender/sdk` as a peer dependency of
      `@carte/orders-backend`. (PRO-727 / PRO-735)
  - Acceptance: `@tender/sdk` resolves locally; peer dependency is `^0.1.0`;
    no runtime dependency entry is added.

## M1 — Tender adapter core swap

- [x] **f-m1-checkout-tender** — Replace direct Stripe Checkout calls with
      `createTenderClient(...).charge({ flow: "hosted", ... })`. (PRO-727 / PRO-728)
  - Acceptance: route still returns `{ checkoutUrl }`; metadata includes
    `carte_order_id` and `carte_cart_id`; the charge request includes
    top-level `originatingPluginId`.
- [x] **f-m1-refund-tender** — Replace direct Stripe refunds with
      `tender.refund({ transactionId, amount, reason, reasonNote?,
idempotencyKey? })`. (PRO-727 / PRO-732)
  - Acceptance: admin route payload remains compatible; reason text maps to
    Tender's closed enum.
- [x] **f-m1-settings-migration** — Remove Stripe settings and add
      `tenderBaseUrl`, `tenderPluginToken`, and `tenderProvider`. (PRO-727 / PRO-729)
  - Acceptance: stale Stripe key warning fires once and never logs secret
    values.
- [x] **f-m1-allowed-hosts** — Remove Stripe hosts from `allowedHosts`; keep
      `license.carteplugin.dev`. (PRO-727 / PRO-730)
  - Acceptance: workers test confirms `api.stripe.com` fetch is rejected.
- [x] **f-m1-tests-green** — Verify orders-backend unit and workers tests plus
      typecheck/lint. (PRO-727 / PRO-736)
  - Acceptance: no `api.stripe.com` references remain in orders-backend source.

## M2 — webhook handoff and events

- [x] **f-m2-webhook-delete** — Delete `routes/webhook-stripe.ts` and unregister
      the legacy route. (PRO-727 / PRO-731)
  - Acceptance: `webhook-stripe` is absent from orders-backend source.
- [x] **f-m2-oq1-decision-note** — Record the OQ-1 collapse: no SDK
      `events.list`; placeholder hooks ship pending EmDash 0.10. (PRO-733)
  - Acceptance: `docs/decisions/oq1-tender-hook-namespace.md` exists and is
    cited from `MIGRATION.md`.
- [x] **f-m2-events-impl** — Add placeholder `tender:payment.succeeded` and
      `tender:payment.refunded` handlers with idempotency and `ctx.waitUntil`.
      (PRO-727 / PRO-734)
  - Acceptance: handlers gate on `metadata.carte_order_id`, dedupe by Tender
    event id for seven days, and update order state off the response path.

## M3 — v0.1 tech-debt sweep

- [x] **f-m3-views-allergens-fallback** — Humanize unknown allergen tags in
      `allergenLabelFor` and verify `DietaryFilter` remains safe. (PRO-638)
  - Acceptance: unknown tags return a non-empty string, never `undefined`.
- [x] **f-m3-audit-script-caps** — Make sandbox-budget margin formatting read
      `costTable.caps`. (PRO-640)
  - Acceptance: mutation test proves changed caps alter displayed margins.
- [x] **f-m3-ai-workspace-actor** — Require actor match on pending AI tool-call
      confirmation and re-read live content for `priceDiff.before`. (PRO-623)
  - Acceptance: cross-actor confirmation is forbidden; stale client `before` is
    advisory only.
- [x] **f-m3-ai-pii-redaction** — Redact PII in tool-call undo/audit KV records.
      (PRO-623)
  - Acceptance: emails, names, phones, and addresses persist as `[REDACTED]`
    unless explicitly allow-listed.
- [x] **f-m3-ai-undo-correctness** — Cover partial-diff undo, idempotent replay,
      and expired undo records. (PRO-623)
  - Acceptance: replay is a no-op and expiry returns structured
    `undo_expired`.
- [x] **f-m3-ai-ssrf-kv-api-deadcode** — Add URL guard, assert KV prefix
      uniqueness, verify envelope consistency, and remove unused helpers. (PRO-623)
  - Acceptance: AI package tests remain green.

## M4 — docs, release artifacts, and this OpenSpec delta

- [x] **f-m4-migration-doc** — Ship `MIGRATION.md` with webhook URL change,
      secret migration, OQ-1/OQ-2 decisions, rollback, and rc posture. (PRO-727 /
      PRO-733 / PRO-735)
- [x] **f-m4-changelog-readme** — Add `CHANGELOG.md` v0.2.0-rc notes and update
      `README.md` with the Tender rc section. (PRO-727 / PRO-623 / PRO-638 /
      PRO-640 / PRO-737)
- [x] **f-m4-changeset** — Add changesets for the rc package bumps. (PRO-737)
- [x] **f-m4-openspec-delta** — Open this OpenSpec change with root artifacts
      and delta specs for payments, webhook, events, ai-tool-call, sandbox-budget,
      and views-taxonomy. (PRO-727 / PRO-623 / PRO-638 / PRO-640 / PRO-737)

## Remaining mission tasks outside this OpenSpec feature

- [x] **Not tracked in this change: f-m4-final-test-sweep** — Full validator
      gauntlet remains a separate mission feature. (PRO-736)
- [x] **Not tracked in this change: f-m4-publish-dryrun** —
      `@carte/orders-backend` publish dry-run only remains a separate mission
      feature.
      (PRO-737)
- [x] **Not tracked in this change: f-m4-tender-publish-gate** — Linear
      tracking for Tender registry prerequisite remains a separate mission feature.
      (PRO-737)
- [x] **Not tracked in this change: f-m4-agentshield** — AgentShield scan
      remains a separate mission feature. (PRO-737)
- [x] **Not tracked in this change: f-m4-pragent-review** — Local PR-Agent
      review remains a separate mission feature. (PRO-737)

These entries are marked checked so `tasks.md` has no open tasks for
`PRO-v02-tender-adapter`; they document that the remaining mission gates are
intentionally owned by separate M4 features, not by this OpenSpec delta.
