# `@carte/orders-backend`

Status: **v0.1 shipped**.

Shipped surfaces:

- Stripe Checkout session creation (`routes/checkout.ts`) — Carte never sees
  raw PAN/CVC.
- Idempotent Stripe webhook (`routes/webhook-stripe.ts`) — dedupe via KV
  `idempotency:{stripeEventId}` with 7-day TTL per AGENTS.md.
- Admin-authenticated refund route (`routes/refund.ts`) with order snapshot
  updates.
- Order snapshots at checkout time (line items, pricing, customer contact).
- Sandboxed Block Kit admin route (`routes/admin.ts`) for basic order ops.

Execution model: **sandboxed**. Capabilities declared:
`content:read`, `content:write`, `email:send`, `network:request` — `allowedHosts`
restricted to `api.stripe.com` and `checkout.stripe.com`. PCI scope is minimized
by Stripe Checkout — Carte infrastructure NEVER receives raw PAN/CVC.

Subrequest budget note (per AGENTS.md): the future webhook handler is expected
to consume ~7 of the 10 sandbox subrequests per invocation. Stay within budget;
do not add speculative outbound calls.
