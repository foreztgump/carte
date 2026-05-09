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

## Submit rate limit (best-effort)

The `submit` route enforces a per-IP sliding-window rate limit of 30 requests
per 60 seconds. EmDash 0.9 `KVAccess` only exposes `get / set / delete / list`
— there is no atomic compare-and-swap or atomic increment, so the limit is
**best-effort** under concurrency: two requests arriving in the same tick may
both observe the pre-increment counter and each write `count+1`, allowing a
small overshoot. The window expiry is embedded in the stored value because
`KVAccess.set` does not accept an `expirationTtl` option in 0.9. Tightening
this to a strict atomic counter is tracked under the HR6 atomic-decrement
follow-up alongside the capacity counter work.
