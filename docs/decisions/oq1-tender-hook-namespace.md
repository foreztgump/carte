# OQ-1 — Tender hook namespace decision

**Status:** Resolved — collapsed  
**Date:** 2026-05-12  
**Linear:** PRO-733

## Constraint

The original M2 plan considered a polling fallback if EmDash 0.9.0 could not
dispatch custom inter-plugin hook namespaces such as `tender:*`. That fallback is
not implementable against the real `@tender/sdk`: the SDK has no `events.list`
endpoint or equivalent cursor API for Carte to poll.

As a result, OQ-1 closes as: **RESOLVED — collapsed; placeholder hooks shipped
pending EmDash 0.10.** The upstream EmDash discussion is not opened in this
mission because there is no viable SDK polling path to use while waiting.

## Placeholder handler shape

Carte still ships the contract shape expected by the Tender adapter so the
orders backend is ready once EmDash supports custom hook dispatch:

```ts
hooks: {
  "tender:payment.succeeded": async (event, ctx) => {
    if (!event.metadata?.carte_order_id) return;
    ctx.waitUntil(markOrderPaid(ctx, event));
  },
  "tender:payment.refunded": async (event, ctx) => {
    if (!event.metadata?.carte_order_id) return;
    ctx.waitUntil(markOrderRefunded(ctx, event));
  },
}
```

The handler shape is intentionally minimal: each Tender event must carry
`metadata.carte_order_id`, order-state changes must run in `ctx.waitUntil`, and
event idempotency remains keyed by the Tender event id with seven-day retention.

## TODO — EmDash 0.10 custom hook namespaces

When EmDash 0.10 exposes custom inter-plugin hook namespaces, verify that
`tender:payment.succeeded` and `tender:payment.refunded` dispatch to Carte's
placeholder handlers without a polling route. If EmDash changes the namespace or
payload shape before 0.10 lands, update the hook keys and event metadata join
contract in the same PRO-733 follow-up.

`MIGRATION.md` should cite this decision note when the v0.2.0-rc operator guide
is authored, so operators understand why the cutover relies on Tender-owned
webhooks plus future `tender:*` hooks rather than a Carte polling fallback.
