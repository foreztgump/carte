# Tasks — Carte v0.1 Build (M3 → M9)

One task per feature in `features.json`. Each task is < 2 hours of focused work, has acceptance criteria, lists test files, and cites applicable CODE_PRINCIPLES constraints. Error handling is mandatory at every external boundary (`ctx.content.*`, `ctx.kv`, `ctx.email.send`, `fetch` to `api.stripe.com`, license-server fetch, LLM provider fetch).

Per-feature TDD discipline (RED → GREEN → REFACTOR) is enforced via commit log; validator-droid checks `git log --oneline feature/PRO-mN-<slug>` for `test(<scope>): ...` commits before implementing commits.

---

## M3 — `@carte/core` foundation (branch: `feature/PRO-m3-carte-core`)

- [ ] **f-m3-pro423-defer** — Patch `PRD.md` to mark OQ#3 (notifications) and OQ#12 (cancellation policy) as DEFERRED with rationale; close Linear PRO-423.
  - Acceptance: A3.pro423.deferred passes; PRO-423 state = `Done` with closing comment.
  - Tests: none (doc-only); `grep -nE 'OQ#(3|12)' PRD.md` returns deferred lines.
  - Constraints: descriptive section headers; YAGNI (no extra OQ touches).
- [x] **f-m3-core-manifest** — `definePlugin` manifest + hooks for `@carte/core`.
  - Acceptance: A3.manifest.canonicalCaps, A3.manifest.validates, A3.hooks.beforeSave, A3.hooks.afterSave.waitUntil.
  - Tests: `packages/core/src/__tests__/index.test.ts`, `packages/core/src/__tests__/hooks.test.ts`.
  - Constraints: SRP per hook handler; no magic strings (collection prefix `carte_` as named const).
- [x] **f-m3-core-blockkit-admin** — Block Kit admin pages.
  - Acceptance: A3.blockkit.canonical.
  - Tests: `packages/core/src/__tests__/admin.snapshot.test.ts`.
  - Constraints: `label` not `text`; `items` not `stats`; no markdown in section text; max 40 LoC per page builder.
- [x] **f-m3-core-86-button** — 86 button + lazy-on-read auto-restore.
  - Acceptance: A3.button86.lazyRestore.
  - Tests: `packages/core/src/__tests__/availability.test.ts` (uses fake timers).
  - Constraints: pure function for `shouldRestore(item, now)`; no cron references anywhere in the package.
- [x] **f-m3-core-jsonld** — schema.org JSON-LD generator + KV cache + invalidation.
  - Acceptance: A3.jsonld.shape, A3.jsonld.cacheTtl, A3.jsonld.invalidation, A3.jsonld.richResults.
  - Tests: `packages/core/src/__tests__/jsonld.test.ts`, `packages/core/src/__tests__/jsonld.cache.test.ts`.
  - Constraints: deep module — caller sees `getJsonLd(restaurantId)`; KV/composition hidden.
- [ ] **f-m3-core-allergen-taxonomy** — EU FIC 14 + US extensions + diet URI map.
  - Acceptance: A3.taxonomy.fic14, A3.taxonomy.dietUris, A3.audit.allergenEdits.
  - Tests: `packages/core/src/taxonomy/__tests__/allergens.test.ts`.
  - Constraints: enum members stable (test asserts exact membership); diet URIs are canonical schema.org URIs (no shortened forms).
- [ ] **f-m3-core-pro409-sweep** — Triage remaining PRO-409 leaf children.
  - Acceptance: A3.linear.pro409sweep.
  - Tests: none (Linear hygiene).
  - Constraints: every still-open child has explicit triage state.

---

## M4 — `@carte/reservations` (branch: `feature/PRO-m4-reservations`)

- [ ] **f-m4-reservations-manifest** — Manifest + collections.
  - Acceptance: A4.manifest.canonicalCaps, A4.collections.declared.
  - Tests: `packages/reservations/src/__tests__/index.test.ts`.
  - Constraints: minimal capabilities; only `email:send` for outgoing notifications.
- [ ] **f-m4-reservations-capacity** — KV atomic capacity counter + 10-min holds.
  - Acceptance: A4.capacity.atomicDecrement, A4.capacity.raceSafe, A4.holds.tenMinTtl.
  - Tests: `packages/reservations/src/__tests__/capacity.workers.test.ts` (vitest-pool-workers).
  - Constraints: HR6 atomic decrement only; pure deep-module API `decrement(date, slot)` / `restore(date, slot)`.
- [ ] **f-m4-reservations-routes** — submit / confirm / cancel-by-token routes.
  - Acceptance: A4.routes.submit, A4.routes.confirm, A4.routes.cancel, A4.email.viaWaitUntil.
  - Tests: `packages/reservations/src/__tests__/routes.test.ts`.
  - Constraints: HMAC token via `crypto.subtle`; no homemade token; emails inside `ctx.waitUntil`.
- [ ] **f-m4-reservations-readtime-slots** — Read-time slot computation.
  - Acceptance: A4.slots.readTime, A4.slots.subrequestBudget.
  - Tests: `packages/reservations/src/__tests__/slots.test.ts`, `packages/reservations/src/__tests__/slots.workers.test.ts` (subreq counter).
  - Constraints: pure function (no I/O inside core algorithm); SG2 read-time computation.

---

## M5 — `@carte/orders-backend` (branch: `feature/PRO-m5-orders-backend`)

- [ ] **f-m5-orders-backend-manifest** — Manifest + collection schema + secrets.
  - Acceptance: A5.manifest.canonicalCaps, A5.secrets.markedSecret.
  - Tests: `packages/orders-backend/src/__tests__/index.test.ts`.
  - Constraints: `allowedHosts` whitelist explicit; `network:request:unrestricted` absent.
- [ ] **f-m5-orders-checkout-route** — Stripe Checkout route + cart hold.
  - Acceptance: A5.checkout.noCardData, A5.checkout.cartHoldKv, A5.checkout.subrequestBudget.
  - Tests: `packages/orders-backend/src/__tests__/checkout.workers.test.ts`.
  - Constraints: HR7 — never log card-derived fields; subreq counter ≤ 4.
- [ ] **f-m5-orders-webhook-idempotency** — Idempotent Stripe webhook.
  - Acceptance: A5.webhook.signatureFirst, A5.webhook.idempotency, A5.webhook.subrequestBudget, A5.webhook.waitUntil.
  - Tests: `packages/orders-backend/src/__tests__/webhook.workers.test.ts`.
  - Constraints: HR5 ordering enforced (signature → idempotency → enqueue → 200); subreq counter ≤ 7.
- [ ] **f-m5-orders-refund-route** — Refund route with Stripe idempotency-key.
  - Acceptance: A5.refund.idempotencyKey, A5.snapshots.lineItems (verify on refund flow).
  - Tests: `packages/orders-backend/src/__tests__/refund.test.ts`.
  - Constraints: idempotency key derived deterministically from orderId; refund record persisted.
- [ ] **f-m5-orders-blockkit-admin** — Read-only Block Kit admin summary.
  - Acceptance: A5.blockkit.adminCanonical.
  - Tests: `packages/orders-backend/src/__tests__/admin.snapshot.test.ts`.
  - Constraints: same Block Kit gotchas as M3.

---

## M6 — `@carte/orders-admin` native React (branch: `feature/PRO-m6-orders-admin`)

- [ ] **f-m6-orders-admin-react-shell** — Native shell + typed contracts.
  - Acceptance: A6.manifest.native, A6.contracts.fromCore.
  - Tests: `packages/orders-admin/src/__tests__/shell.test.tsx`.
  - Constraints: NO Wrangler config; contracts imported from `@carte/core/contracts`.
- [ ] **f-m6-orders-admin-list-detail** — Order list + detail UI + refund button.
  - Acceptance: A6.list.renders, A6.detail.snapshots, A6.refund.button, A6.workflow.statusDriven, A6.email.templating.
  - Tests: `packages/orders-admin/src/__tests__/{list,detail,workflow}.test.tsx`.
  - Constraints: components ≤ 40 LoC body; status state-machine extracted to `state-machine.ts` (deep module).
- [ ] **f-m6-orders-admin-modifier-editor** — Single-tier modifier editor.
  - Acceptance: A6.modifier.singleTier, A6.a11y.axeClean.
  - Tests: `packages/orders-admin/src/__tests__/modifier-editor.test.tsx`, Playwright + axe-core.
  - Constraints: nested-modifier validation rejects with descriptive error message (no swallowing).

---

## M7 — `@carte/views` Astro peer-dep (branch: `feature/PRO-m7-views`)

- [ ] **f-m7-views-shell** — Package shell + Tailwind + headless variants.
  - Acceptance: A7.peerDep.declared, A7.tailwind.default.
  - Tests: `packages/views/src/__tests__/exports.test.ts`.
  - Constraints: `astro` is peerDependency; no `definePlugin`.
- [ ] **f-m7-views-restaurant-menu** — Hero/Menu/Section/Item/Info/DietaryFilter.
  - Acceptance: A7.props.notFetch, A7.components.menu, A7.dietaryFilter.taxonomy, A7.a11y.axeClean.
  - Tests: `playwright/views.menu.spec.ts` + axe injection.
  - Constraints: SG7 — no fetching inside components.
- [ ] **f-m7-views-hours-reservation** — HoursWidget + ReservationForm.
  - Acceptance: A7.components.hours, A7.components.reservation, A7.a11y.axeClean.
  - Tests: `playwright/views.reservation.spec.ts`.
  - Constraints: form posts to `/_emdash/api/plugins/carte-reservations/submit`.
- [ ] **f-m7-views-cart-checkout** — Mobile-first cart + checkout summary toggle.
  - Acceptance: A7.components.cart, A7.components.checkout, A7.checkout.summaryToggle, A7.a11y.axeClean, A7.perf.benchmark.
  - Tests: `playwright/views.checkout.spec.ts` (mobile viewport 375×812).
  - Constraints: PRO-471 explicit summary toggle; CWV pass.
- [ ] **f-m7-views-records** — Order/reservation success records.
  - Acceptance: A7.records.successPages, A7.schemaRichResults.
  - Tests: `playwright/views.records.spec.ts`.
  - Constraints: success page is purely presentational.

---

## M8 — `@carte/ai` native commercial (branch: `feature/PRO-m8-ai`)

- [ ] **f-m8-ai-shell-license** — Native shell + license check + 14-day trial + BYO key.
  - Acceptance: A8.manifest.native, A8.license.kvCache, A8.license.gracefulDegrade, A8.trial.stateMachine, A8.byoKey.workspaceScoped.
  - Tests: `packages/ai/src/__tests__/{license,trial,byo}.test.ts`.
  - Constraints: HR-graceful-degrade — never throw on license outage; deep module hides cache TTL + last-known-good.
- [ ] **f-m8-ai-chat-panel** — React chat panel + SSE chat-stream + history.
  - Acceptance: A8.chat.sse, A8.history.kvRetention, A8.pii.boundary.
  - Tests: `packages/ai/src/__tests__/chat.test.tsx`.
  - Constraints: PII redaction at boundary BEFORE prompt assembly.
- [ ] **f-m8-ai-tool-call-confirm** — tool-call route with diff preview + confirm + audit + undo.
  - Acceptance: A8.toolcall.readDefault, A8.toolcall.writeOnConfirm, A8.toolcall.audit, A8.toolcall.undo.
  - Tests: `packages/ai/src/__tests__/tool-call.test.ts`.
  - Constraints: HR8 — write-on-confirm is non-negotiable; no auto-apply path even for "low-risk" tools.
- [ ] **f-m8-ai-inline-actions** — Description gen / allergen tagging / alt text / translate.
  - Acceptance: A8.allergen.auditOnAi, A8.inline.actions.
  - Tests: `packages/ai/src/__tests__/inline-actions.test.tsx`.
  - Constraints: every mutation goes through tool-call confirm flow; HR9 audit on allergen edits.
- [ ] **f-m8-ai-mcp-interim** — Standalone MCP wrapper Worker.
  - Acceptance: A8.mcp.wrapper, A8.mcp.discussion850.
  - Tests: `packages/ai/mcp-wrapper/src/__tests__/proxy.test.ts`.
  - Constraints: wrapper is its own Wrangler config; README documents `claude_desktop_config.json` snippet.

---

## M9 — GDPR + security hardening (branch: `feature/PRO-m9-gdpr-hardening`)

- [ ] **f-m9-gdpr-export** — Guest data export handler.
  - Acceptance: A9.export.byEmail.
  - Tests: `packages/core/src/gdpr/__tests__/export.test.ts`.
  - Constraints: admin-scope guard at boundary; output includes reservations + orders only.
- [ ] **f-m9-gdpr-erasure** — Erasure with PII-strip retention.
  - Acceptance: A9.erasure.piiStripped, A9.erasure.retentionDoc.
  - Tests: `packages/core/src/gdpr/__tests__/erase.test.ts`.
  - Constraints: deterministic hash for retention; revenue fields preserved.
- [ ] **f-m9-rate-limiting** — KV per-IP rate limiter on /submit and /checkout.
  - Acceptance: A9.rateLimit.publicRoutes.
  - Tests: `packages/reservations/src/__tests__/rate-limit.workers.test.ts`, `packages/orders-backend/src/__tests__/rate-limit.workers.test.ts`.
  - Constraints: ≤ 2 added subrequests per route; sliding window.
- [ ] **f-m9-pen-smokes** — Stripe replay / capacity race / license outage smokes.
  - Acceptance: A9.pen.replayWebhook, A9.pen.capacityRace, A9.pen.licenseOutage.
  - Tests: `pen-smokes/{webhook-replay,capacity-race,license-outage}.workers.test.ts`.
  - Constraints: tests are the deliverable; if existing impl already passes, that's fine — record the test commit.
- [ ] **f-m9-agentshield-clean** — AgentShield clean across all 6 plugins + CI step.
  - Acceptance: A9.agentshield.clean, A9.agentshield.ciStep.
  - Tests: CI run on milestone PR head; allowlist (if any) reviewed by security-review-droid.
  - Constraints: minimal CI diff; allowlist entries each have a rationale comment.

---

## M10 — Launch (GATED — DO NOT START)

- [ ] **GATED — requires explicit user approval before any task begins.** Open ZERO PRs against this milestone without an inbound user `continue` after M9 close.
