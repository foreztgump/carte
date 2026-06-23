# wire-tender-fulfillment — Wire Carte order fulfillment to the published Tender consumer-eventing SDK

## Why

`@carte/orders-backend` already routes checkout and refunds through Tender, but
the **payment-event delivery mechanism is missing** — the keystone gap tracked
as [PRO-859](https://linear.app/projects-linear/issue/PRO-859/ws4-tender-reconciliation-rebuild-on-the-ws5-eventing-contract).
`events.ts` ships an idempotent `applyTenderTransaction` seam (keyed by Tender
transaction id) but **nothing calls it**: a paid order silently never flips to
`paid`. The v0.2 `tender:*` hook placeholders and any polling fallback were dead
(the old vendored `@tender/sdk@0.0.0` had no consumer-eventing API).

The published **`@tenderpay/sdk@0.2.0`** (now on npm, alongside
`@tenderpay/core` / `@tenderpay/stripe`) ships the **Candidate C** transport the
WS4 keystone requires: `fulfillTransaction` short-polls Tender's authenticated
`getTransaction` read route to a terminal status and delivers exactly one
deduped event, with a durable KV dedup store. This is the only supported channel
— Carte never reads Tender storage directly and never registers a `tender:*`
hook.

## What Changes

- **Migrate the SDK** from the vendored `@tender/sdk@0.0.0` to the published
  `@tenderpay/sdk@^0.2.0`. Replace the hand-rolled
  `createTenderClient({ baseUrl, pluginToken, fetch })` construction in
  `routes/checkout.ts` and `routes/refund.ts` with
  `createTenderClientFromContext(ctx, ctx.settings)` (the SDK now owns token
  sourcing, `ctx.http.fetch` injection, and base-URL resolution + boundary
  validation).
- **Add the return-URL fulfillment route** (`routes/return.ts`, public): on the
  customer's redirect back from hosted checkout, run a **bounded**
  `fulfillTransaction(transactionId, { client, delivered: createKvDedupStore(ctx.kv),
interestingStatuses: ["paid"], onEvent })`. The `onEvent` reaction calls the
  existing idempotent `applyTenderTransaction` seam keyed by the transaction id,
  reading `orderId` back off `event.transaction.metadata`. All work completes
  in-request (the sandbox has no `ctx.waitUntil` / `after()`); an `AbortSignal`
  caps the poll so the handler never approaches the 30s sandbox wall.
- **Declare the two consumer settings** in the manifest/README contract:
  `tenderBaseUrl` (EmDash site origin) and `tenderPluginToken` (admin-scoped
  `ec_pat_…`, masked/secret). These already exist as runtime reads; this makes
  them first-class and documents the masking requirement.
- **Resolve the `allowedHosts` trust contract** ([PRO-912](https://linear.app/projects-linear/issue/PRO-912/resolve-orders-backend-tender-allowedhosts-trust-contract)):
  the SDK calls the runtime `tenderBaseUrl`, which the static
  `allowedHosts: ["license.carteplugin.dev"]` does not cover. Switch to
  `network:request:unrestricted` (the operator-configured base URL is not known
  at authoring time), documented in the manifest.
- **Refresh the packaging build-input** from `@tender/sdk` →
  `@tenderpay/sdk@^0.2.0` as a `devDependency` (build-time-only input bundled
  into `dist/`; the published package still declares **no** SDK runtime
  dependency — PRO-894's self-contained-runtime contract is preserved). Remove
  the vendored `file:./vendor/tender-sdk-0.0.0.tgz` tarball and its `.npmrc`
  hoist. Update `scripts/verify-orders-backend-pack.ts` to assert the published
  tarball still carries no SDK dependency and no `vendor/` path.
- **Purge the stale `@tender/sdk` references**: the smoke test, the
  `stale-stripe-warning` copy, and README/MIGRATION dependency notes move to the
  `@tenderpay/*` naming.

## Capabilities

- **Added:** `payment-fulfillment` — the consumer-eventing reconciliation path
  (return-URL drive point, bounded poll, idempotent single fulfillment, durable
  dedup) (`specs/payment-fulfillment/spec.md`).

## Non-goals

- **No cron catch-up route.** Return-URL drive point only (confirmed). A lagged
  webhook past the return hit is a documented follow-up, not in scope.
- **No direct Stripe code.** Already removed in PRO-727; this change does not
  reintroduce any provider-specific path.
- **No Tender-side changes.** End-to-end validation against a deployed Tender
  Worker depends on Tender PRO-952; this change validates against a mocked SDK
  locally.
- **No subscription / embedded-flow wiring.** Hosted checkout + one-time charge
  only.

## Impact

- `packages/orders-backend/src/routes/checkout.ts`, `routes/refund.ts` — SDK
  construction swap to `createTenderClientFromContext`.
- `packages/orders-backend/src/routes/return.ts` — **new** public fulfillment
  route.
- `packages/orders-backend/src/plugin.ts` — register the `return` route.
- `packages/orders-backend/src/events.ts` — reused as-is (idempotent `onEvent`).
- `packages/orders-backend/emdash-plugin.jsonc` — `network:request:unrestricted`;
  document the two settings.
- `packages/orders-backend/package.json`, root `package.json`, `.npmrc` —
  `@tenderpay/sdk` build input; drop vendored tarball.
- `scripts/verify-orders-backend-pack.ts` — updated package-name + specifier
  assertions.
- Tests: `routes.test.ts`, `return.test.ts` (new), `plugin.test.ts`,
  `manifest.test.ts`, `tender-sdk-link.smoke.test.ts`, `test-support.ts`.
- Docs: `README.md`, `MIGRATION.md`, `CHANGELOG.md`.

## Fulfills

- PRD-emdash-0.17-modernization **WS4** / PRO-859: zero `tender:payment` hook
  hits; paid + refunded transitions driven by the real eventing contract;
  transitions idempotent under redelivery/replay; propagation latency documented.
- PRO-912: `allowedHosts` trust contract resolved for the runtime Tender base URL.

## Rollback plan

Revert the worktree branch. `dist/` is gitignored; no package is published
(`0.3.0-rc.1`, `npm view` → E404), so there are no external consumers to break.
Restoring the prior `package.json` (package + root), `.npmrc`, and the vendored
`.tgz` fully reverts the packaging change.
