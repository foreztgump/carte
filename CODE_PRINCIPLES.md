# Carte Code Principles

> Hard rules are non-negotiable. Soft guidelines are defaults — deviate only with reason in the design doc or PR description.

Carte is the EmDash restaurant plugin family. It runs on Cloudflare Workers (D1/R2/KV) via the EmDash plugin SDK, with Astro for the storefront and React for native admin surfaces. Some plugins (`@carte/core`, `@carte/reservations`, `@carte/orders-backend`) are **sandboxed** — they run under hard runtime caps (50ms CPU, 10 subrequests, no filesystem, no raw SQL, no arbitrary network). Others (`@carte/orders-admin`, `@carte/ai`, `@carte/views`) are **native/trusted**. The two contexts have different rules, and this file calls out which is which.

Naming conventions across the codebase:
- File names: kebab-case (`menu-items.ts`, `reservation-hold.ts`)
- Variables / functions: camelCase (`menuItem`, `decrementCapacity`)
- Types / React components / Astro components: PascalCase (`MenuItem`, `<ReservationForm />`)
- Collection names: snake_case prefixed with `carte_` (`carte_menu_items`)
- KV keys: kebab-case prefixed with the resource (`capacity:{date}:{slot}`, `idempotency:{eventId}`)

---

## Hard Rules (non-negotiable)

### HR1 — Sandboxed plugins MUST stay within Workers caps
Sandboxed plugins (`@carte/core`, `@carte/reservations`, `@carte/orders-backend`) MUST execute every request handler within **50ms CPU and 10 subrequests**. Count subrequests at design time (KV gets, content reads, fetch calls, email sends, signature verifies all count). If a handler approaches the budget, move work into `ctx.waitUntil(...)` rather than blocking the response. Native plugins (`@carte/orders-admin`, `@carte/ai`) are uncapped but still SHOULD be deliberate about latency.

### HR2 — `ctx.waitUntil` is mandatory for any post-response async work
Any side effect that does not affect the response (emails, cache invalidation, audit log writes, kitchen notifications, capacity restore on cancellation) MUST be wrapped in `ctx.waitUntil(...)`. Never `await` post-response work in the handler path. This is EmDash issue #710 and it is non-negotiable.

### HR3 — No raw SQL; use `ctx.content.*`
Sandboxed plugins MUST NOT execute SQL or call D1 bindings directly. All persistence goes through `ctx.content.*` operations. This includes ad-hoc migrations, batch updates, and "quick" debugging queries. If you find yourself wanting raw SQL, add the operation to the EmDash content API or restructure the data model — do not bypass.

### HR4 — Capability declarations are mandatory and minimal
Every plugin MUST declare every capability it uses in `definePlugin({ capabilities, allowedHosts })`. Never request a capability you do not use. Network-using plugins MUST enumerate `allowedHosts`. New external host = capability change = explicit PR + design note. No hostnames behind feature flags, no wildcards.

### HR5 — Webhook receivers MUST be idempotent
Any route that receives an external webhook (Stripe today, others later) MUST verify the provider signature **before** any state read or write, then key idempotency on the provider's event id in KV with a 7-day TTL. The pattern is: verify → check `idempotency:{eventId}` → set key → enqueue work in `ctx.waitUntil` → return 200. Re-delivery MUST be a no-op.

### HR6 — Capacity counters MUST use KV atomic operations
Any resource with a hard limit (reservation slots, future limited-quantity items) MUST use the documented atomic-counter + TTL-hold pattern. Read-modify-write on KV is forbidden for capacity. The flow is: atomic decrement → reject on negative → write `hold:{id}` with TTL → create the row in `pending` → restore on expiry/cancel. Anything that races a customer through a "fully booked" gate is a release-blocker.

### HR7 — Stripe Checkout only; never touch card data
Carte uses Stripe Checkout for v0.1. PAN, CVV, expiry, and any card-derived secret MUST NOT enter Carte code, logs, KV, D1, R2, env vars, or LLM context. Tokens (`PaymentIntent` ids, customer ids) are fine. If a future plan requires the embedded Payment Element, it goes through a dedicated design doc and PCI scope re-evaluation — not a drive-by change.

### HR8 — AI write actions require diff preview + explicit user confirm
Per the PRD trust model: `@carte/ai` is **read-by-default, write-on-confirm**. Every AI tool that mutates state (menu, reservations, orders, restaurant info, hours) MUST surface a diff preview, MUST require explicit user confirmation, MUST emit an audit log entry, and MUST return an undo token (10-min validity). Auto-approve lists are scoped per-tool, per-workspace — never global. PII (guest names, emails, phone, notes) MUST NOT be sent to the LLM unless the user has explicitly opted in for that turn.

### HR9 — Allergen edits MUST be auditable
Allergen tagging is regulated (EU FIC 14 mandatory allergens). Every change to `carte_menu_items.allergens` — manual, AI-assisted, or imported — MUST write an audit entry capturing the actor, before/after sets, and timestamp. AI bulk-tag operations MUST be reviewed item-by-item with the diff-preview flow from HR8; no silent batch writes.

### HR10 — Secrets stay in EmDash settings storage; never commit them
Stripe keys, webhook secrets, LLM API keys, and license keys live in plugin `storage.settings` marked secret, surfaced via the EmDash admin. They MUST NOT appear in source, fixtures, snapshots, error messages, log output, or LLM prompts. `.env` files used for local fixtures MUST be gitignored and accompanied by a committed `.env.example` with placeholder values.

### HR11 — Block Kit JSON only for sandboxed admin; no markdown, no redirects
Sandboxed plugins' admin pages MUST emit valid Block Kit JSON. Use `label` (not `text`), `items` (not `stats`), no markdown inside section text, no HTTP redirects from plugin routes. React/HTML/JS rendering belongs in native plugins (`orders-admin`, `ai`). Mixing the two breaks isolation guarantees and the EmDash docs site.

---

## Soft Guidelines (defaults)

### SG1 — Prefer the simplest solution that fits the budget
Within the Workers budget (HR1), prefer straightforward code over clever abstractions. The 50ms / 10-subrequest cap *is* the simplicity forcing function — if a handler needs more than that, redesign rather than optimize. Don't precompute, don't introduce caching layers, don't spin out helper modules until profiling says otherwise.

### SG2 — Read-time computation beats persisted denormalization
Time-slots, open/closed status, and JSON-LD blobs are derived data. Compute them on read (with a short KV cache where measured) rather than persisting and keeping them in sync. The PRD's reservation slot model is the canonical example: no slot rows, just hours minus blocks minus current bookings.

### SG3 — Snapshot user-visible values at write time
Order line items snapshot `itemName`, `unitPrice`, and modifier names at order creation. Do not resolve them by reference at read time. Menus change; receipts must not.

### SG4 — Plugin-scoped KV is the default cache
Use plugin-scoped KV (`ctx.kv`) for cache-like state with explicit TTLs that match the invalidation strategy (5 min for menu fragments, 30 min for JSON-LD, 24h for license check). Don't reach for D1 or R2 when KV with a TTL is sufficient.

### SG5 — Lazy restore over scheduled jobs
Where possible (86'd items auto-restoring at next 6am, expired reservation holds), prefer lazy restoration on next read over scheduled cron. Cron is a separate failure mode and a separate operational surface; lazy reads are self-healing.

### SG6 — Native plugins ship typed contracts to sandboxed plugins
When `@carte/orders-admin` (native) calls into `@carte/orders-backend` (sandboxed), the call goes through a documented REST route with a typed request/response contract checked into `@carte/core`. No reaching into another plugin's internals; no shared in-process state.

### SG7 — Astro components in `@carte/views` accept data, not fetch it
Components in `@carte/views` are presentational. Data fetching happens in the consuming Astro page via `getEmDashCollection` / `getEmDashEntry` and gets passed in as props. This keeps the components testable, theme-friendly, and composable inside the user's own page templates.

### SG8 — Test what fails on Cloudflare, not just what passes locally
Local self-hosted Node runs plugins in-process; sandbox limits don't apply. Tests that only exercise the local path will miss subrequest-budget regressions, KV-vs-Map semantics, and `waitUntil` timing bugs. Critical sandboxed paths (reservation submit, Stripe webhook, menu feed) get an integration test against a local `wrangler dev` or equivalent before merge.
