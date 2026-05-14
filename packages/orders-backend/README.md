# `@carte/orders-backend`

Status: **v0.2.0-rc.1 publish candidate**.

Shipped surfaces:

- Tender-hosted checkout creation (`routes/checkout.ts`) — Carte never sees
  raw PAN/CVC.
- Placeholder Tender payment hook handlers (`events.ts`) — dedupe via KV
  `idempotency:tender:{eventId}` with 7-day TTL per AGENTS.md.
- Admin-authenticated refund route (`routes/refund.ts`) with order snapshot
  updates.
- Order snapshots at checkout time (line items, pricing, customer contact).
- Sandboxed Block Kit admin route (`routes/admin.ts`) for basic order ops.

Execution model: **sandboxed**. Capabilities declared:
`content:read`, `content:write`, `email:send`, `network:request` — `allowedHosts`
is intentionally limited to `license.carteplugin.dev`. PCI scope is minimized
by Tender-hosted checkout — Carte infrastructure NEVER receives raw PAN/CVC.

Subrequest budget note (per AGENTS.md): the Tender event hook handler budget is
3 of the 10 sandbox subrequests per invocation. Stay within budget; do not add
speculative outbound calls.
