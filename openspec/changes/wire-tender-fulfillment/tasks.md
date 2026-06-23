# wire-tender-fulfillment — Tasks

Each task <2hr with explicit acceptance criteria mapping to the
`payment-fulfillment` delta spec. TDD: write/extend the failing test, then make
it pass. All edits inside the worktree.

## Task 1 — Refresh the SDK build input to `@tenderpay/sdk@^0.2.0`

- **Modify:** root `package.json` — replace
  `"@tender/sdk": "file:./vendor/tender-sdk-0.0.0.tgz"` with
  `"@tenderpay/sdk": "^0.2.0"` in `devDependencies`.
- **Modify:** `packages/orders-backend/package.json` — add
  `"@tenderpay/sdk": "^0.2.0"` to `devDependencies` (build input; bundled into
  `dist/`).
- **Modify:** `.npmrc` — replace `public-hoist-pattern[]=@tender/sdk` with
  `public-hoist-pattern[]=@tenderpay/sdk`.
- **Delete:** `vendor/tender-sdk-0.0.0.tgz` and `vendor/README.md` (remove the
  now-empty `vendor/` directory).
- **Run:** `pnpm install`.
- **Acceptance:**
  - [x] `pnpm install` exits 0; `node_modules/@tenderpay/sdk` resolves to
        `0.2.0`.
  - [x] No `@tender/sdk` and no `vendor/` reference remains in any
        `package.json` or `.npmrc`.
  - [x] Workspace root stays `private: true`.
- **CODE_PRINCIPLES:** KISS — reuse the existing `.npmrc` hoist convention; no
  new mechanism.

## Task 2 — Migrate imports + client construction to the published SDK

- **Add:** a shared `tenderConsumerSettings(ctx)` helper (new
  `src/routes/tender-client.ts`) returning `{ tenderBaseUrl, tenderPluginToken }`
  narrowed from `ctx.settings`, plus a thin
  `tenderClientFromContext(ctx)` wrapper over
  `createTenderClientFromContext`.
- **Modify:** `src/routes/checkout.ts` and `src/routes/refund.ts` — import from
  `@tenderpay/sdk`; replace the local `createTenderClient({ baseUrl,
pluginToken, fetch })` + `requireHttp` + presence checks with the shared
  helper. Preserve refund's `TenderRefundClient` narrowing cast and all existing
  behavior.
- **Modify:** `src/__tests__/tender-sdk-link.smoke.test.ts` — import
  `describeTenderPackage` from `@tenderpay/sdk`; assert name `@tenderpay/sdk`.
- **Modify:** `src/routes.test.ts` — `vi.mock("@tenderpay/sdk", …)` exposing
  `createTenderClientFromContext` (returns `{ charge, refund, getTransaction }`).
  Update the checkout assertion from `createTenderClientMock(...)` to
  `createTenderClientFromContext(ctx, { tenderBaseUrl, tenderPluginToken })`.
- **Acceptance:**
  - [x] No `@tender/sdk` specifier remains anywhere under `packages/` or
        `scripts/` (grep gate).
  - [x] `checkout.ts` / `refund.ts` build their client only via
        `createTenderClientFromContext`.
  - [x] Existing checkout + refund tests pass with the new mock.
  - [x] Fulfills spec "client is built from the route context and consumer
        settings".
- **CODE_PRINCIPLES:** DRY — one settings helper for 3 call sites (real, not
  speculative); SRP — helper does only settings-narrowing + client build.

## Task 3 — Add the bounded return-URL fulfillment route (TDD)

- **Add (test-first):** `src/routes/return.test.ts` —
  - processing→paid drives a single order `paid` update and returns
    `{ status: "paid" }`;
  - a second observation of the same `txn:paid` performs no further order write
    (idempotent);
  - a still-`processing` transaction within an aborted budget returns
    `{ status: "processing" }` and writes no order update;
  - a `paid` transaction whose metadata lacks `carte_order_id` is a no-op.
- **Add:** `src/routes/return.ts` — validate `transactionId` from `ctx.input`;
  build client via the Task 2 helper; run
  `fulfillTransaction(transactionId, { client, delivered:
createKvDedupStore(ctx.kv), interestingStatuses: ["paid"], signal, onEvent })`
  under an `AbortController` capped at `RETURN_POLL_BUDGET_MS = 2000`; `onEvent`
  reads `event.transaction.metadata.carte_order_id`, guards non-string/empty,
  and calls `applyTenderTransaction` with `trigger: "paid"` (returning the
  promise); catch `TenderEventWatchAbortedError` → `{ status: "processing" }`.
- **Add:** a `tenderReturnContext` builder in `src/test-support.ts` (mocked SDK
  client with a scriptable `getTransaction`, recording KV + content writes).
- **Acceptance:**
  - [x] All four `return.test.ts` scenarios pass.
  - [x] Single fulfillment verified on duplicate observation.
  - [x] Function ≤40 lines, ≤3 params, ≤3 nesting; budget is a named constant.
  - [x] Fulfills spec "Fulfillment is driven in-request", "idempotent under
        at-least-once delivery", "poll is bounded", "correlation round-trips".
- **CODE_PRINCIPLES:** error handling at the boundary (abort + missing-id
  guards); no magic values (named budget + interesting status).

## Task 4 — Register the `return` route on the sandboxed surface

- **Modify:** `src/plugin.ts` — add `return: { handler: adaptRoute(returnRoute),
public: true }` to the `routes` map (public: the customer hits it post-redirect
  without an admin token).
- **Modify:** `src/plugin.test.ts` — add `return` to `EXPECTED_ROUTE_KEYS`;
  assert `routes.return` is `public: true`; keep the `plugin.hooks` undefined
  assertion (zero `tender:*` hooks).
- **Acceptance:**
  - [x] `plugin.routes` exposes `admin`, `checkout`, `refund`, `return`.
  - [x] `return` is `public: true`; `admin`/`refund` stay private.
  - [x] `plugin.hooks` remains `undefined`.
- **CODE_PRINCIPLES:** consistency — mirror the existing `adaptRoute` wiring; no
  new abstraction.

## Task 5 — Return `transactionId` from checkout for return-trip correlation

- **Modify:** `src/routes/checkout.ts` — extend `CheckoutRouteResponse` to
  `{ checkoutUrl, transactionId }`; surface `result.transactionId` from the
  charge result (already returned by the SDK). Keep `metadata.carte_order_id`
  unchanged (the PRO-728 join).
- **Modify:** `src/routes.test.ts` — assert the checkout response includes the
  `transactionId` from the charge result.
- **Acceptance:**
  - [x] Checkout returns `{ checkoutUrl, transactionId }` as JSON; still no
        server redirect.
  - [x] `metadata.carte_order_id` round-trip unchanged.
- **CODE_PRINCIPLES:** YAGNI — surface only the id the return trip needs.

## Task 6 — Resolve the `allowedHosts` trust contract (PRO-912)

- **Modify:** `packages/orders-backend/emdash-plugin.jsonc` — replace
  `"capabilities": ["content:read", "content:write", "network:request"]` +
  `"allowedHosts": ["license.carteplugin.dev"]` with
  `"capabilities": ["content:read", "content:write",
"network:request:unrestricted"]`; remove `allowedHosts`; document why (runtime
  operator-configured `tenderBaseUrl` is unknown at authoring time).
- **Modify:** `src/manifest.test.ts` — assert
  `network:request:unrestricted`; assert no `allowedHosts`/`license.carteplugin.dev`;
  keep the no-`api.stripe.com` / no-`checkout.stripe.com` assertions.
- **Acceptance:**
  - [x] Manifest declares `network:request:unrestricted`, no `allowedHosts`.
  - [x] Canonical capability name (per EmDash SKILL.md).
  - [x] `manifest.test.ts` green.
- **CODE_PRINCIPLES:** least surprise — canonical capability names only.

## Task 7 — Update the pack-verification script for the new SDK name

- **Modify:** `scripts/verify-orders-backend-pack.ts` — `TENDER_PACKAGE_NAME =
"@tenderpay/sdk"`; drop the `TENDER_TARBALL_FILE` / `vendor` tarball-name
  assertions that referenced the deleted `tender-sdk-0.0.0.tgz` (keep the generic
  `vendor/` path + `file:` specifier forbiddance and the no-SDK-dependency
  assertion across all dependency fields).
- **Run:** `pnpm verify:orders-backend-pack`.
- **Acceptance:**
  - [x] Script asserts the published tarball declares no `@tenderpay/sdk` in any
        dependency field, carries no `vendor/`, no `src/`, no `file:` specifier.
  - [x] `pnpm verify:orders-backend-pack` exits 0 (self-contained, clean-install).
- **CODE_PRINCIPLES:** keep the contract; rename the target, don't weaken it.

## Task 8 — Settings docs, migration purge, changelog

- **Modify:** `packages/orders-backend/README.md` — document the two settings
  (`tenderBaseUrl`, `tenderPluginToken` masked/secret); describe the return-URL
  fulfillment flow + propagation-latency note; update the SDK dependency note to
  `@tenderpay/sdk` (bundled build input, still no published runtime dep);
  refresh the subrequest-budget note (return path audited 9/10 worst case);
  update the `network:request:unrestricted` capability line.
- **Modify:** `MIGRATION.md` — add a short "v0.3 → fulfillment wired" note: the
  WS4 consumer-eventing path is live; `@tender/sdk` → `@tenderpay/sdk`; the
  return-URL drive point; no `tender:*` hook / no Carte polling-of-storage.
- **Modify:** `src/stale-stripe-warning.ts` copy + `CHANGELOG.md` (or a
  changeset) — reference `@tenderpay/stripe`.
- **Acceptance:**
  - [x] README documents both settings + masking + the fulfillment flow.
  - [x] No stale `@tender/sdk` naming remains in shipped docs/copy.
  - [x] CHANGELOG/changeset records the WS4 fulfillment wiring.
- **CODE_PRINCIPLES:** docs match code; no aspirational claims.

## Task 9 — Full verification gate

- **Run, from the worktree:** `pnpm -F @carte/orders-backend test`,
  `pnpm -F @carte/orders-backend typecheck`, `pnpm -F @carte/orders-backend lint`,
  `pnpm -F @carte/orders-backend build`, `pnpm verify:orders-backend-pack`,
  `pnpm audit:sandbox-budget`, and the grep gate
  `! grep -rn "@tender/sdk" packages scripts` (expect no hits).
- **Acceptance:**
  - [x] Test + typecheck + lint + build all green.
  - [x] Pack-verify + sandbox-budget green.
  - [x] Zero `@tender/sdk` and zero `tender:payment` hits (grep gate).
  - [x] Fulfills every `payment-fulfillment` spec requirement.
- **CODE_PRINCIPLES:** evidence-based completion — paste command output.
