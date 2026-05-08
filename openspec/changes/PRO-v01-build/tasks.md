# Tasks — Carte v0.1 Build (M3 → M9)

One task per feature in the mission's `features.json`. Status reflects the consolidated v0.1 build at the time of this sweep: every entry below is shipped on its respective milestone branch and passing the milestone validator. Each `[x]` lists the implementing commit SHA on the milestone branch — pair commits (`test(...)` then `feat/fix(...)`) are tracked together because TDD discipline is gated on the visible RED → GREEN sequence (mission-wide assertion `X.tdd.testsBeforeImpl`).

Per-feature TDD discipline (RED → GREEN → REFACTOR) is enforced via commit log; validator-droid checks `git log --oneline feature/PRO-mN-<slug>` for `test(<scope>): ...` commits before implementing commits.

---

## M3 — `@carte/core` foundation (branch: `feature/PRO-m3-carte-core`)

- [x] **f-m3-pro423-defer** — Patch PRD.md to mark OQ#3 (notifications) and OQ#12 (cancellation policy) as DEFERRED with rationale; close the stuck-In-Progress Linear issue PRO-423. (commit `62e0b7c`)
  - Acceptance: A3.pro423.deferred.
  - Tests: doc-only; `grep -nE 'OQ#(3|12)' PRD.md` returns deferred lines.
- [x] **f-m3-core-manifest** — Implement the `@carte/core` `definePlugin` manifest declaring capabilities `content:read`, `content:write`, `media:read`; settings (defaultCurrency, defaultMenuLocale, timezone, x402WalletAddress); routes `menu-feed`, `schema-jsonld`, `admin/*`. (commits `d8353b4`, `4346df8`, `c8f7d6d`)
  - Acceptance: A3.manifest.canonicalCaps, A3.manifest.validates, A3.hooks.beforeSave, A3.hooks.afterSave.waitUntil.
  - Tests: `packages/core/src/__tests__/index.test.ts`, `packages/core/src/__tests__/hooks.test.ts`.
- [x] **f-m3-core-blockkit-admin** — Block Kit JSON admin pages `/carte`, `/carte/restaurant`, `/carte/hours`, `/carte/settings` under `@carte/core` routes. (commits `b437966`, `72b9c06`)
  - Acceptance: A3.blockkit.canonical.
  - Tests: `packages/core/src/__tests__/admin.snapshot.test.ts`.
- [x] **f-m3-core-86-button** — 86 button on menu items: sets `available=false` and `unavailableUntil=<next 6am local>`; lazy-on-read auto-restore. (commits `61a6c1c`, `894feee`)
  - Acceptance: A3.button86.lazyRestore.
  - Tests: `packages/core/src/__tests__/availability.test.ts`.
- [x] **f-m3-core-jsonld** — Generate canonical schema.org `Restaurant` JSON-LD route (with `@type`, `address`, `openingHoursSpecification`, `acceptsReservations`, `priceRange`, `servesCuisine`, `hasMenu`); 30-min KV cache + invalidation on save. (commits `4e6a62d`, `572e09e`)
  - Acceptance: A3.jsonld.shape, A3.jsonld.cacheTtl, A3.jsonld.invalidation, A3.jsonld.richResults.
  - Tests: `packages/core/src/__tests__/jsonld.test.ts`, `packages/core/src/__tests__/jsonld.cache.test.ts`.
- [x] **f-m3-core-allergen-taxonomy** — Single source of truth in `packages/core/src/taxonomy/allergens.ts` for EU FIC 14 + US extensions and dietary tag → schema.org diet URI map. (commits `3f854f4`, `ff4f523`)
  - Acceptance: A3.taxonomy.fic14, A3.taxonomy.dietUris, A3.audit.allergenEdits.
  - Tests: `packages/core/src/taxonomy/__tests__/allergens.test.ts`.
- [x] **f-m3-core-pro409-sweep** — Triage any PRO-409 leaf sub-issues (PRO-428 admin pages already covered by `f-m3-core-blockkit-admin`; sweep stragglers). (rolled into milestone PR; tracked via Linear hygiene)
  - Acceptance: A3.linear.pro409sweep.

---

## M4 — `@carte/reservations` (branch: `feature/PRO-m4-reservations`)

- [x] **f-m4-reservations-manifest** — `definePlugin` manifest with capabilities `content:read`, `content:write`, `email:send`; declare collections `carte_reservations` and `carte_reservation_blocks`. (commits `2613304`, `de23b66`)
  - Acceptance: A4.manifest.canonicalCaps, A4.collections.declared.
  - Tests: `packages/reservations/src/__tests__/index.test.ts`.
- [x] **f-m4-reservations-capacity** — Implement `capacity:{date}:{slot}` atomic decrement pattern (HR6: never read-modify-write); 10-minute hold TTL. (commits `6d0655b`, `d06733e`)
  - Acceptance: A4.capacity.atomicDecrement, A4.capacity.raceSafe, A4.holds.tenMinTtl.
  - Tests: `packages/reservations/src/__tests__/capacity.workers.test.ts` (vitest-pool-workers).
- [x] **f-m4-reservations-routes** — Public routes: `submit` (rate-limited per IP via KV — coarse limit, refined in M9), `confirm?token=`, `cancel-by-token?token=`. (commits `270f3b7`, `178474f`)
  - Acceptance: A4.routes.submit, A4.routes.confirm, A4.routes.cancel, A4.email.viaWaitUntil.
  - Tests: `packages/reservations/src/__tests__/routes.test.ts`.
- [x] **f-m4-reservations-readtime-slots** — Compute available slots on read from hours minus blocks (`carte_reservation_blocks`) minus current bookings minus active holds. (commits `f4ab167`, `167d92e`)
  - Acceptance: A4.slots.readTime, A4.slots.subrequestBudget.
  - Tests: `packages/reservations/src/__tests__/slots.test.ts`, `packages/reservations/src/__tests__/slots.workers.test.ts`.

---

## M5 — `@carte/orders-backend` (branch: `feature/PRO-m5-orders-backend`)

- [x] **f-m5-orders-backend-manifest** — `definePlugin` manifest with capabilities `content:read`, `content:write`, `email:send`, `network:request` (allowedHosts: `['api.stripe.com', 'checkout.stripe.com']`); Stripe secrets marked `secret: true`. (commits `416860e`, `c33ddca`)
  - Acceptance: A5.manifest.canonicalCaps, A5.secrets.markedSecret.
  - Tests: `packages/orders-backend/src/__tests__/index.test.ts`.
- [x] **f-m5-orders-checkout-route** — POST `/checkout`: create Stripe Checkout session (no card data ever touches Carte — HR7), persist `cart-hold:{cartId}` in KV with `cartHoldTtlSeconds=600`. (commits `dd611e7`, `f7a56ae`)
  - Acceptance: A5.checkout.noCardData, A5.checkout.cartHoldKv, A5.checkout.subrequestBudget.
  - Tests: `packages/orders-backend/src/__tests__/checkout.workers.test.ts`.
- [x] **f-m5-orders-webhook-idempotency** — POST `/webhook-stripe`: verify signature FIRST (HR5), key idempotency on `event.id` with 7-day TTL; ≤ 7 subrequests. (commits `61aad62`, `1593765`)
  - Acceptance: A5.webhook.signatureFirst, A5.webhook.idempotency, A5.webhook.subrequestBudget, A5.webhook.waitUntil.
  - Tests: `packages/orders-backend/src/__tests__/webhook.workers.test.ts`.
- [x] **f-m5-orders-refund-route** — POST `/refund`: validates admin scope, calls Stripe refund API with deterministic Idempotency-Key, persists refund record on order. (commits `11b0293`, `c9ea7ef`)
  - Acceptance: A5.refund.idempotencyKey, A5.snapshots.lineItems.
  - Tests: `packages/orders-backend/src/__tests__/refund.test.ts`.
- [x] **f-m5-orders-blockkit-admin** — Block Kit admin pages `/carte-orders` (read-only summary) for the sandboxed plugin. (commits `8e3f2c5`, `505a15b`)
  - Acceptance: A5.blockkit.adminCanonical.
  - Tests: `packages/orders-backend/src/__tests__/admin.snapshot.test.ts`.

---

## M6 — `@carte/orders-admin` native React (branch: `feature/PRO-m6-orders-admin`)

- [x] **f-m6-orders-admin-react-shell** — Native plugin manifest declaring capabilities `content:read`, `content:write`; typed REST contracts imported from `@carte/core/contracts`. (commits `6f7dac5`, `569981c`)
  - Acceptance: A6.manifest.native, A6.contracts.fromCore.
  - Tests: `packages/orders-admin/src/__tests__/shell.test.tsx`.
- [x] **f-m6-orders-admin-list-detail** — Order list (filter by status, date range), order detail (line items + modifier snapshots from SG3), refund button calling orders-backend `/refund`; status-driven workflow + email-first templates. (commits `3aadc76`, `0705659`, `68e1277`)
  - Acceptance: A6.list.renders, A6.detail.snapshots, A6.refund.button, A6.workflow.statusDriven, A6.email.templating, A6.a11y.axeClean.
  - Tests: `packages/orders-admin/src/__tests__/{list,detail,workflow}.test.tsx`.
- [x] **f-m6-orders-admin-modifier-editor** — Admin UI to define single-tier modifier groups with per-option fee metadata; nested modifier groups rejected. (commits `46f5638`, `99c5d68`)
  - Acceptance: A6.modifier.singleTier, A6.a11y.axeClean.
  - Tests: `packages/orders-admin/src/__tests__/modifier-editor.test.tsx`.

---

## M7 — `@carte/views` Astro peer-dep (branch: `feature/PRO-m7-views`)

- [x] **f-m7-views-shell** — Astro components package (npm peer-dep — no `definePlugin`, no Wrangler config); Tailwind default + headless variants. (commits `3332c86`, `85eb86d`)
  - Acceptance: A7.peerDep.declared, A7.tailwind.default.
  - Tests: `packages/views/src/__tests__/exports.test.ts`.
- [x] **f-m7-views-restaurant-menu** — Astro components `<RestaurantHero>`, `<MenuDisplay>`, `<MenuSection>`, `<MenuItem>`, `<RestaurantInfo>`, `<DietaryFilter>`. (commits `9ea7653`, `a11ca3e`)
  - Acceptance: A7.props.notFetch, A7.components.menu, A7.dietaryFilter.taxonomy, A7.a11y.axeClean.
  - Tests: `playwright/views.menu.spec.ts`.
- [x] **f-m7-views-hours-reservation** — Astro components `<HoursWidget>` (renders today's open/close + week schedule from `carte_hours`) and `<ReservationForm>` (POSTs to `@carte/reservations` `/submit`). (commits `f264ba1`, `fc90693`)
  - Acceptance: A7.components.hours, A7.components.reservation, A7.a11y.axeClean.
  - Tests: `playwright/views.reservation.spec.ts`.
- [x] **f-m7-views-cart-checkout** — `<OrderingCart>` (line items, modifier display, totals) and `<OrderingCheckout>` with explicit summary toggle (mobile-first, per PRO-471). (commits `b69513c`, `7f65a3f`)
  - Acceptance: A7.components.cart, A7.components.checkout, A7.checkout.summaryToggle, A7.a11y.axeClean, A7.perf.benchmark.
  - Tests: `playwright/views.checkout.spec.ts`.
- [x] **f-m7-views-records** — Add components/conventions for explicit storefront-side order and reservation records (success pages, status-display components consumed by Astro pages). (commits `ffd9c99`, `d3e0b15`)
  - Acceptance: A7.records.successPages, A7.schemaRichResults.
  - Tests: `playwright/views.records.spec.ts`.

---

## M8 — `@carte/ai` native commercial (branch: `feature/PRO-m8-ai`)

- [x] **f-m8-ai-shell-license** — Native React plugin manifest; license check (24h KV cache, graceful degrade on outage); 14-day trial state machine; BYO LLM key per workspace. (commits `6ee1f20`, `48cf1aa`)
  - Acceptance: A8.manifest.native, A8.license.kvCache, A8.license.gracefulDegrade, A8.trial.stateMachine, A8.byoKey.workspaceScoped.
  - Tests: `packages/ai/src/__tests__/{license,trial,byo}.test.ts`.
- [x] **f-m8-ai-chat-panel** — React chat panel mounted in EmDash admin; SSE chat-stream; KV history with 30-day retention; PII redaction at boundary. (commits `bc256c6`, `fc4232a`)
  - Acceptance: A8.chat.sse, A8.history.kvRetention, A8.pii.boundary.
  - Tests: `packages/ai/src/__tests__/chat.test.tsx`.
- [x] **f-m8-ai-tool-call-confirm** — POST `/tool-call`: read-by-default; for any mutation tool, return a diff preview and require explicit user confirm (HR8); audit on apply; 10-min undo token. (commits `32c4c26`, `b1201ea`)
  - Acceptance: A8.toolcall.readDefault, A8.toolcall.writeOnConfirm, A8.toolcall.audit, A8.toolcall.undo.
  - Tests: `packages/ai/src/__tests__/tool-call.test.ts`.
- [x] **f-m8-ai-inline-actions** — Per-field AI buttons: generate description, suggest allergens (uses `@carte/core` taxonomy), generate alt text, translate. (commits `eb227cd`, `224cf69`)
  - Acceptance: A8.allergen.auditOnAi, A8.inline.actions.
  - Tests: `packages/ai/src/__tests__/inline-actions.test.tsx`.
- [x] **f-m8-ai-mcp-interim** — Document and stub the MCP interim plan: AI tools accessible via plugin routes + a standalone wrapper Worker that proxies to those routes (EmDash Discussion #850). (commits `a8cd0c7`, `e65fd9a`)
  - Acceptance: A8.mcp.wrapper, A8.mcp.discussion850.
  - Tests: `packages/ai/mcp-wrapper/src/__tests__/proxy.test.ts`.

---

## M9 — GDPR + security hardening (branch: `feature/PRO-m9-gdpr-hardening`)

- [x] **f-m9-gdpr-export** — Cross-plugin handler (mounted on `@carte/core`) that, given an email, exports all reservations and orders for that email as a downloadable JSON. (commits `ed531ee`, `7e3091b`)
  - Acceptance: A9.export.byEmail.
  - Tests: `packages/core/src/gdpr/__tests__/export.test.ts`.
- [x] **f-m9-gdpr-erasure** — Erasure handler removes guest PII (name, email, phone, notes) but preserves order/reservation revenue records (replace PII with deterministic hash for analytics). (commits `8d9346c`, `f8c2bbb`)
  - Acceptance: A9.erasure.piiStripped, A9.erasure.retentionDoc.
  - Tests: `packages/core/src/gdpr/__tests__/erase.test.ts`.
- [x] **f-m9-rate-limiting** — Implement KV-based rate limiter applied to `/submit` (reservations) and `/checkout` (orders-backend). (commits `11c6ac1`, `d658a31`)
  - Acceptance: A9.rateLimit.publicRoutes.
  - Tests: `packages/reservations/src/__tests__/rate-limit.workers.test.ts`, `packages/orders-backend/src/__tests__/rate-limit.workers.test.ts`.
- [x] **f-m9-pen-smokes** — Smoke-tests for: Stripe webhook idempotency (replay attack), capacity counter race (concurrent submits), license-check graceful degrade (DNS-fail simulated). (commits `610d3f8`, `9eb1f2f`)
  - Acceptance: A9.pen.replayWebhook, A9.pen.capacityRace, A9.pen.licenseOutage.
  - Tests: `pen-smokes/{webhook-replay,capacity-race,license-outage}.workers.test.ts`.
- [x] **f-m9-agentshield-clean** — Run `npx ecc-agentshield scan` across all 6 packages; resolve every finding (or document acknowledged false-positive in allowlist); CI step added. (commit `d2d30a1`)
  - Acceptance: A9.agentshield.clean, A9.agentshield.ciStep.
  - Tests: CI run on milestone PR head.

---

## M10 — Launch (GATED — DO NOT START)

- [ ] **GATED — requires explicit user approval before any task begins.** Open ZERO PRs against this milestone without an inbound user `continue` after M9 close.
