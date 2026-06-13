# `@carte/orders-admin`

Status: **v0.1 shipped**.

Shipped surfaces:

- Native React admin mounted via the EmDash 0.18 `./admin` export
  (`src/admin/index.tsx`, `App.tsx`): `definePlugin`'s admin `entry` field is the
  package module specifier `@carte/orders-admin/admin`, which exports
  `PluginAdminExports` (React elements keyed by `admin.pages[].path`).
- Order list + detail views with status workflow transitions
  (accepted → preparing → ready → fulfilled / cancelled).
- Idempotent refund flow wired to `@carte/orders-backend`.
- Email template editing for receipts and status notifications.
- Single-tier modifier group editor (`src/modifiers/modifier-group-form.tsx`)
  per the OQ#11 locked decision.

Execution model: **native** (0.18 `definePlugin`, in-process and unsandboxed).
Capabilities declared: `content:read`, `content:write`. No outbound network.
