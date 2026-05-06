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
