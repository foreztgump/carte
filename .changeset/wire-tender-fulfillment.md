---
"@carte/orders-backend": minor
---

Wire the WS4 Tender fulfillment path: `@carte/orders-backend` now consumes the published `@tenderpay/sdk@^0.2.0` (replacing the workspace-private `@tender/sdk@0.0.0` build input, still bundled into `dist/` with no published runtime dependency) and drives paid-order fulfillment in-request. A new public return-URL route short-polls the transaction to a terminal `paid` status (bounded 2s budget) via `fulfillTransaction` + a durable KV dedup store, transitioning the order exactly once — idempotent under at-least-once delivery, no `tender:*` hook, no Carte-side storage polling. Checkout now returns `{ checkoutUrl, transactionId }` for return-trip correlation. Resolves the PRO-912 `allowedHosts` trust contract: the manifest declares `network:request:unrestricted` and drops the static `license.carteplugin.dev` allowlist, since the operator-configured `tenderBaseUrl` is unknown at authoring time. Card data still never transits Carte.
