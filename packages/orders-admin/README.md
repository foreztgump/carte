# `@carte/orders-admin`

Status: **v0.1 shipped**.

Shipped surfaces:

- Native React admin entry (`src/admin/index.tsx`, `App.tsx`) mounting the live
  orders queue.
- Order list + detail views with status workflow transitions
  (accepted → preparing → ready → fulfilled / cancelled).
- Idempotent refund flow wired to `@carte/orders-backend`.
- Email template editing for receipts and status notifications.
- Single-tier modifier group editor (`src/modifiers/modifier-group-form.tsx`)
  per the OQ#11 locked decision.

Execution model: **native** (locally registered, trusted — not sandboxed).
Capabilities declared: `content:read`, `content:write`. No outbound network.
