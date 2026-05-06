# `@carte/orders-admin`

Status: **skeleton (v0.1)** — no business logic yet.

The Carte orders admin will own:

- Native React UI for the live orders queue
- Modifier management (admin-only mutations)
- Order state transitions (accepted → preparing → ready → fulfilled / cancelled)

Execution model: **native** (locally registered, trusted — not sandboxed).
Capabilities declared: `content:read`, `content:write`. No outbound network.
The future React entry will live at `admin/index.js` and is hooked through
`admin.entry` in the manifest.
