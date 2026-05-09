# `@carte/reservations`

Status: **skeleton (v0.1)** — no business logic yet.

The Carte reservations plugin will own:

- Reservation requests with capacity-aware availability
- Confirmation / cancellation by token (no login required)
- Email notifications to host + guest
- Manual or auto-confirm modes; closures and blocked windows

Execution model: **sandboxed**. Capabilities declared:
`content:read`, `content:write`, `email:send`. No outbound network beyond email.

Implementation note (later mission): capacity counters use `ctx.kv` atomic
decrement; email sends are wrapped in `ctx.waitUntil` per the EmDash 0.9.0
async-lifetime rule (Issue #710).

## Submit rate limit

The `submit` route enforces a per-IP sliding-window rate limit of 60 requests
per 60 seconds before reservation input parsing or capacity writes. The limiter
trusts only EmDash/Cloudflare request metadata and the `cf-connecting-ip`
header; client-controlled `x-forwarded-for` values are intentionally ignored.
Accepted requests write the rate-limit counter with a 120-second KV TTL.

The legacy route-context helper remains documented as best-effort because
EmDash 0.9 `KVAccess` only exposes `get / set / delete / list`; the public
submit route now uses the TTL-backed limiter above.
