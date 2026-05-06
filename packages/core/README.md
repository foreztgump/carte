# `@carte/core`

Status: **skeleton (v0.1)** — no business logic yet.

The Carte core plugin will own:

- Menu items, sections, and menus
- Restaurant settings (currency, locale, timezone, address)
- Hours of operation
- Schema.org JSON-LD output for menus and the restaurant entity

Execution model: **sandboxed** (Cloudflare Worker per invocation). Capabilities declared:
`content:read`, `content:write`, `media:read`. No outbound network, no email.
