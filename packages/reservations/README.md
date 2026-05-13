# `@carte/reservations`

Status: **v0.1 shipped**.

Shipped surfaces:

- Reservation collection with capacity-aware availability (read-time slot
  generation in `availability/read-time-slots.ts`).
- Public routes: `submit`, `confirm`, `cancel`, plus admin route.
- HMAC-signed guest tokens for tokenless confirm/cancel flows (`routes/tokens.ts`).
- Race-safe capacity holds via KV atomic decrement (`capacity.ts`).
- Email notifications to host and guest, wrapped in `ctx.waitUntil` per the
  EmDash 0.9.0 async-lifetime rule (Issue #710).
- Block Kit admin pages with reservations + closures views.

Execution model: **sandboxed**. Capabilities declared:
`content:read`, `content:write`, `email:send`. No outbound network beyond email.

## Submit rate limit

The `submit` route enforces a per-IP sliding-window rate limit of 60 requests
per 60 seconds before reservation input parsing or capacity writes. The limiter
trusts only EmDash/Cloudflare request metadata and the `cf-connecting-ip`
header; client-controlled `x-forwarded-for` values are intentionally ignored.
Accepted requests write the rate-limit counter with a 120-second KV TTL.

The legacy route-context helper remains documented as best-effort because
EmDash 0.9 `KVAccess` only exposes `get / set / delete / list`; the public
submit route now uses the TTL-backed limiter above.
