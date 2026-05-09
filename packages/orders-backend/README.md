# `@carte/orders-backend`

Status: **skeleton (v0.1)** — no business logic yet.

The Carte orders backend will own:

- Stripe Checkout session creation
- Stripe webhook receiver (idempotent via `ctx.kv` `idempotency:{stripeEventId}` 7-day TTL)
- Admin-authenticated refund route
- Block Kit admin route for basic order ops

Execution model: **sandboxed**. Capabilities declared:
`content:read`, `content:write`, `email:send`, `network:request` — `allowedHosts`
restricted to `api.stripe.com` and `checkout.stripe.com`. PCI scope is minimized
by Stripe Checkout — Carte infrastructure NEVER receives raw PAN/CVC.

Subrequest budget note (per AGENTS.md): the future webhook handler is expected
to consume ~7 of the 10 sandbox subrequests per invocation. Stay within budget;
do not add speculative outbound calls.
