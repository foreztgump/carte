# Design — Carte v0.2.0-rc Tender adapter

> **Linear:** PRO-727, PRO-623, PRO-638, PRO-640, PRO-733, PRO-735, PRO-737  
> **Downstream consumer:** Vicky's Kitchen M5  
> **Release posture:** `v0.2.0-rc`, not GA

## Module map

```
packages/orders-backend/              (sandboxed)
  src/index.ts                        manifest, settings, allowedHosts, tender hooks
  src/routes/checkout.ts              hosted Tender charge path
  src/routes/refund.ts                Tender refund path, admin route contract stable
  src/events.ts                       placeholder tender:* hook handlers + idempotency

packages/ai/                          (native React)
  src/tool-call.ts                    actor-bound confirm, authoritative diff, redacted KV,
                                      undo replay/expiry, URL guard, envelope consistency

packages/core/
  src/taxonomy/allergens.ts           allergenLabelFor fallback for unknown tags

packages/views/
  src/components/DietaryFilter.astro  consumes safe taxonomy labels

scripts/
  audit-sandbox-budget.ts             reports margins from costTable.caps
  sandbox-cost-table.json             active sandbox caps and operation costs
```

## Two approaches considered

### Approach A — chosen: consume the real Tender SDK and ship placeholder hooks

Carte imports `createTenderClient({ baseUrl, pluginToken, fetch?, retry? })`
from the workspace-linked `@tender/sdk`, calls `charge` and `refund`, declares
`@tender/sdk` as a peer dependency, and records Tender payment state via
placeholder `tender:*` hook handlers.

**Pros:** matches the real SDK surface, preserves EmDash sandbox boundaries,
keeps `@carte/orders-admin` stable, and makes the future EmDash 0.10 hook
activation a dispatch concern rather than another Carte rewrite.

**Cons:** event hooks are contract-bearing placeholders until EmDash 0.10 can
dispatch custom namespaces.

### Approach B — rejected: keep a Carte polling route until hooks ship

The original fallback was a cron or route that called `tender.events.list`.

**Reason rejected:** OQ-1 (PRO-733) collapsed because the real SDK has no
`events.list` cursor API. Inventing one would violate the mission's "consume
Tender, do not implement Tender" boundary and hide a release-blocking contract
gap from operators.

## Information hiding

- `checkout.ts` hides Tender charge wiring. Callers still receive
  `{ checkoutUrl }`; they do not know whether the URL came from Stripe or Tender.
- `refund.ts` hides Tender's closed refund-reason enum. Callers keep the
  existing refund route payload shape; free-form reason text is mapped internally
  with the original text preserved as `reasonNote`.
- `events.ts` hides Tender idempotency key shape
  (`idempotency:tender:{eventId}`) and seven-day TTL. Hook callers see only
  `tenderPaymentSucceededHook` and `tenderPaymentRefundedHook`.
- `tool-call.ts` hides KV redaction, undo-status records, and actor validation
  behind the existing AI route envelope.
- `allergens.ts` hides the known-label map and fallback humanization behind
  `allergenLabelFor(tag): string`.
- `audit-sandbox-budget.ts` hides cost-table parsing behind report generation so
  displayed cap margins always come from the active table.

## Sequence diagrams

### Hosted Tender checkout — PRO-727 / PRO-728

```
Storefront             @carte/orders-backend             @tender/sdk / Tender
   |                            |                                |
   |-- POST /checkout --------->|                                |
   |                            | validate cart + hold           |
   |                            | KV put cart-hold:{cartId}      |
   |                            | tender.charge({                |
   |                            |   flow: "hosted",              |
   |                            |   amount, currency,            |
   |                            |   metadata: {                  |
   |                            |     carte_order_id,            |
   |                            |     carte_cart_id              |
   |                            |   },                           |
   |                            |   originatingPluginId          |
   |                            | }) --------------------------->|
   |                            |<--------- ChargeResult --------|
   |<--- { checkoutUrl } -------|                                |
```

PCI scope remains unchanged: Carte never receives PAN, CVC, expiry, or raw card
data. Tender and its Stripe provider own that path.

### Tender event hook placeholder — PRO-733 / PRO-734

```
Tender / EmDash 0.10          @carte/orders-backend
       |                               |
       |-- tender:payment.succeeded -->|
       |                               | if !metadata.carte_order_id return
       |                               | KV get idempotency:tender:{eventId}
       |                               | if seen return
       |                               | ctx.waitUntil(
       |                               |   markOrderPaid(...)
       |                               |   KV put idempotency marker, 7d
       |                               | )
       |<------------ ok --------------|
```

The same shape applies to `tender:payment.refunded`, calling
`markOrderRefunded`. Budget remains under 10 subrequests: idempotency read,
content update, idempotency write.

### AI write-on-confirm hardening — PRO-623

```
Admin client          @carte/ai tool-call boundary          EmDash content / KV
    |                              |                                  |
    |-- preview mutation --------->| read current content for diff     |
    |<-- diff + confirm token -----| KV pending call includes actorId   |
    |                              |                                  |
    |-- confirm token ------------>| compare workspaceId + actorId      |
    |                              | re-read live content for before     |
    |                              | apply mutation                      |
    |                              | redact before/after/input           |
    |                              | KV undo + audit records             |
    |<-- { ok, result, undoToken }-|                                  |
```

This strengthens HR8 without changing the public read-by-default,
write-on-confirm behavior.

## Dependency direction

```
@carte/orders-backend ─peer→ @tender/sdk
@carte/orders-backend ─runtime→ Tender plugin routes via SDK baseUrl/pluginToken
@carte/orders-admin ─HTTP→ @carte/orders-backend /refund (unchanged)
@carte/views ─import→ @carte/core taxonomy
@carte/ai ─native plugin→ EmDash content + KV
```

High-level packages depend on stable contracts (`@tender/sdk`, plugin route
payloads, taxonomy helpers) rather than reaching into provider internals.

## Sandbox and operational constraints

- EmDash SDK remains pinned to `^0.9.0`.
- `allowedHosts` for `@carte/orders-backend` stays minimal:
  `["license.carteplugin.dev"]`; Tender SDK calls route through EmDash plugin
  routes, not direct Stripe hosts.
- `ctx.waitUntil` wraps event-driven order-state changes.
- No raw SQL; sandboxed handlers use EmDash content/KV surfaces.
- Actual publish is not automated by this change; PRO-737 tracks the HITL gate
  and Tender registry prerequisite.
