# Design — Carte v0.1 Build (M3 → M9)

## Module map (deep modules per CODE_PRINCIPLES SG / module-depth rule)

```
packages/core/                       (sandboxed)
  src/index.ts                       definePlugin manifest + hooks
  src/admin/{root,restaurant,hours,settings}.ts   Block Kit JSON pages
  src/menu/{86-button,availability}.ts            lazy-on-read availability
  src/jsonld/{generator,cache}.ts                 schema.org Restaurant generator + KV cache
  src/taxonomy/allergens.ts                       EU FIC 14 + US extensions + diet URIs
  src/audit/log.ts                                allergen + content audit log emitter
  src/contracts/                                  shared TS types: orders/refund/modifier-update
  src/gdpr/{export,erase}.ts        (M9)          guest data export + erasure handlers

packages/reservations/               (sandboxed)
  src/index.ts                       definePlugin manifest + hooks
  src/capacity.ts                    KV atomic decrement helper
  src/holds.ts                       hold:{holdId} 10-min TTL
  src/slots.ts                       read-time slot computation
  src/routes/{submit,confirm,cancel-by-token,admin}.ts
  src/email/{received,confirmed,cancelled}.ts     templates
  src/rate-limit.ts                  (M9)         KV per-IP throttle on /submit

packages/orders-backend/             (sandboxed)
  src/index.ts                       definePlugin manifest + hooks
  src/cart/hold.ts                   cart-hold:{cartId} 10-min TTL
  src/routes/{checkout,webhook-stripe,refund,admin}.ts
  src/stripe/{client,signature,idempotency}.ts    HR5 pattern + Idempotency-Key header
  src/order/{state-machine,line-item-snapshot}.ts
  src/rate-limit.ts                  (M9)         KV per-IP throttle on /checkout

packages/orders-admin/               (native React)
  src/index.ts                       native plugin manifest (NO Wrangler)
  src/components/{OrderList,OrderDetail,ModifierEditor,RefundButton,TemplateEditor}.tsx
  src/hooks/useOrderApi.ts           typed REST client (contracts from @carte/core/contracts)
  src/state-machine.ts               status-driven workflow

packages/views/                      (npm peer-dep)
  src/components/{RestaurantHero,MenuDisplay,MenuSection,MenuItem,RestaurantInfo,
                   DietaryFilter,HoursWidget,ReservationForm,OrderingCart,
                   OrderingCheckout}.astro
  src/styles/tailwind.css
  src/headless/                      headless variants

packages/ai/                         (native React, commercial)
  src/index.ts                       native plugin manifest
  src/license/{check,cache,degrade}.ts            24hr KV cache + graceful degrade
  src/trial/state-machine.ts                      14-day trial transitions
  src/llm/{anthropic,openai,gemini}.ts            BYO-key provider adapters
  src/components/{ChatPanel,DiffPreview,ConfirmDialog,InlineActions}.tsx
  src/tool-call/{registry,boundary,audit,undo}.ts HR8 enforcement at boundary
  src/pii/redact.ts                               opt-in-per-turn redaction
  src/routes/{chat-stream,tool-call,history,license-check}.ts
  mcp-wrapper/                                    standalone Worker proxying to plugin routes
    wrangler.toml
    src/index.ts
    README.md (claude_desktop_config.json snippet)
```

## Two design approaches considered (per OpenSpec design rule)

### Approach A — chosen: per-plugin sandboxed/native split with typed REST contracts in `@carte/core/contracts`

**Pros:** matches EmDash's runtime model exactly; leverages native vs sandboxed isolation; cross-plugin calls go through documented routes (SG6). Each plugin remains independently testable and shippable. Failure of one plugin doesn't take the rest down.

**Cons:** more files; some duplication (e.g., rate-limit logic in two packages). Worth it for isolation.

### Approach B — rejected: shared in-process service modules in a `@carte/internal` package

**Pros:** less duplication; single source for rate limit / audit / capacity helpers.

**Cons:** breaks sandboxed isolation guarantees; would couple sandboxed plugin lifecycles; no clean way to type-share without circular dependencies if `@carte/internal` consumes both `@carte/core` types and emits utilities back. Rejected — violates the EmDash plugin model, and CODE_PRINCIPLES (Law of Demeter, deep modules over coupling).

## Information hiding (per module)

- `capacity.ts` hides KV key shape and atomic-counter mechanics. Caller sees `decrement(date, slot)` returning success/failure.
- `idempotency.ts` hides KV key shape (`idempotency:{eventId}`) and TTL. Caller sees `markAndProceed(eventId)` returning `'first' | 'replay'`.
- `pii/redact.ts` hides which fields are PII and the opt-in cookie/setting. Caller sees `redactForPrompt(payload, optInState)`.
- `license/check.ts` hides cache TTL and degrade behaviour. Caller sees `getLicenseStatus(workspaceId)` returning a value usable for gating; never throws on outage.

## Sequence diagrams

### Stripe webhook (M5) — HR5 + 7-of-10 subrequest budget

```
External                Worker (sandboxed)
   |                          |
   |-- POST /webhook-stripe ->|
   |                          | 1. verify signature       (1 subreq via stripe.webhooks.constructEvent — 0 net)
   |                          | 2. read idempotency:{id}  (subreq #1)
   |                          | 3. if 'replay' → 200 ok   (return early; total = 1)
   |                          | 4. write idempotency:{id} TTL 7d (subreq #2)
   |                          | 5. ctx.waitUntil(
   |                          |       persist order      (subreq #3)
   |                          |       update line items  (subreq #4)
   |                          |       send receipt email (subreq #5)
   |                          |       audit log entry    (subreq #6)
   |                          |       invalidate cache   (subreq #7)
   |                          |    )
   |                          | 6. return 200            (response sent BEFORE waitUntil completes)
   |<------------ 200 --------|
```

Budget audit: ≤ 7 of 10 subrequests. Headroom = 3 (used by future ops, e.g. fraud-check). Crossing 7 triggers redesign — DO NOT "try to fit it."

### Reservation submit (M4) — capacity atomic + waitUntil emails

```
Client                Worker (sandboxed)
   |                       |
   |-- POST /submit ------>|
   |                       | 1. rate-limit (M9 → KV per-IP, subreq #1)
   |                       | 2. atomic decrement capacity:{date}:{slot} (subreq #2)
   |                       | 3. if negative → 409 conflict; restore atomic (subreq #3); return
   |                       | 4. write hold:{holdId} TTL 600s (subreq #3)
   |                       | 5. ctx.content.create('carte_reservations', pending) (subreq #4)
   |                       | 6. ctx.waitUntil(send 'received' email)
   |                       | 7. return { reservationId, status: 'pending' }
   |<-------- 200 ---------|
```

Budget: ≤ 5 of 10 in normal path. Comfortable headroom.

### AI tool-call write (M8) — HR8 boundary enforcement

```
Client (admin React)         Plugin (native)
   |                              |
   |-- POST /tool-call (write) -->|
   |                              | 1. license check (cache hit; HR-graceful-degrade safe)
   |                              | 2. PII redact (boundary, NOT in prompt template)
   |                              | 3. compute diff vs current state
   |                              | 4. emit confirmToken (10-min TTL in KV)
   |                              | 5. return { diff, confirmToken }   ← NO mutation yet
   |<-------- 200 ----------------|
   |
   |-- POST /tool-call             |
   |       confirmToken=<token> -->|
   |                              | 6. validate confirmToken (consume)
   |                              | 7. apply mutation
   |                              | 8. emit audit entry (HR9 if allergen)
   |                              | 9. issue undo token (10-min TTL in KV)
   |                              |10. return { applied, undoToken }
   |<-------- 200 ----------------|
```

## Dependency direction

```
@carte/views     ─peer-dep→  consumer Astro project
                            ↑
@carte/orders-admin (native React)
        ↓ typed REST contracts (re-exported from @carte/core/contracts)
@carte/orders-backend (sandboxed)
@carte/reservations (sandboxed)
@carte/core      ←── all other packages depend on its taxonomy + contracts
@carte/ai (native)
        ↓ runtime ony
@carte/ai/mcp-wrapper (standalone Worker)
        ↓ HTTP fetch
plugin routes /_emdash/api/plugins/<id>/<route>
```

High-level modules (orders-admin, ai) depend on abstractions (typed contracts in `@carte/core/contracts`); low-level details (KV key shape, Stripe SDK) live inside the consuming plugin's deep modules. Sandboxed plugins NEVER import from native plugins or from each other.

## Rejected designs / footguns

- **Persisted slot rows for reservations** — rejected (SG2): denormalisation creates sync drift. Slots computed at read.
- **Cron job for 86 button auto-restore** — rejected (SG5): lazy-on-read is self-healing, no scheduled-job operational surface.
- **Inline `await` for emails on response path** — rejected (HR2): bare promises cancel mid-flight; `ctx.waitUntil` mandatory.
- **Read-modify-write on capacity counter** — rejected (HR6): race-unsafe.
- **Hard-fail on license-server outage** — rejected (graceful degrade): never lock the restaurant out of admin functions.
- **Auto-apply AI write actions for "trusted" tools** — rejected (HR8): every mutation requires explicit user confirm, full stop. Per-tool / per-workspace auto-approve lists may grow over time but never globally.
- **Workspace-global PII opt-in for AI** — rejected (HR8): opt-in is per-turn at the tool-call boundary.
- **Embedded Stripe Payment Element** — rejected for v0.1 (HR7 + scope creep): Carte never receives card data; Stripe Checkout only.
