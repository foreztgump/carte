---
"@carte/orders-backend": patch
---

Reconcile `@tender/sdk` to a self-contained build input: the published package no longer declares Tender SDK as a dependency, it is bundled into dist at build time. Operators install tender-core and tender-stripe separately for payments to function.
