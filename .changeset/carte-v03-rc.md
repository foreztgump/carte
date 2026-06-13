---
"@carte/core": minor
"@carte/reservations": minor
"@carte/orders-backend": minor
"@carte/orders-admin": minor
"@carte/ai": minor
---

Carte v0.3.0-rc.1 — EmDash 0.18 modernization (epic PRO-848). The plugin family migrates to the 0.18 authoring model: `@carte/core`, `@carte/reservations`, and `@carte/orders-backend` ship as sandboxed plugins (`emdash-plugin.jsonc` manifests built with `emdash-plugin`), while `@carte/orders-admin` and `@carte/ai` ship as native `definePlugin()` plugins with rendered React admin. Includes the per-runner sandbox budget caps, terminology purge, dead `tender:*` eventing removal, and the manifest-based install flow documented in `MIGRATION.md`. Release candidate cut tracked by PRO-865; npm publish remains blocked on PRO-766.
