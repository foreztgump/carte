# Design — wire-tender-fulfillment

## Context

- **Runtime:** sandboxed EmDash 0.18 plugin on the Cloudflare Dynamic Worker
  Loader. Hard ceiling per invocation: **50ms CPU / 10 subrequests / 30s wall**.
  **No post-response primitive** (`ctx.waitUntil` / `after()`) —
  `VERIFIED-PLATFORM-0.18-carte.md` §7. All async work must complete in-request.
- **Existing seam:** `events.ts::applyTenderTransaction(ctx, { transactionId,
orderId, trigger })` is already idempotent — keyed by `transactionId:trigger`
  with a write-then-verify KV marker (narrows the concurrent-redelivery race),
  then a 7-day `processed` marker. It returns `true` on the transition, `false`
  on duplicate. **Reused unchanged** as the fulfillment reaction.
- **Published SDK (verified from the `@tenderpay/sdk@0.2.0` tarball types):**
  - `createTenderClientFromContext(ctx, { tenderBaseUrl, tenderPluginToken })` —
    owns token sourcing, `ctx.http.fetch` injection, base-URL resolution, and
    boundary validation (throws `TenderError` on missing fetch/url/token).
  - `fulfillTransaction(txId, opts)` — semantic alias of `watchTransaction`:
    short-polls `getTransaction` with exponential backoff (500ms→2×→cap 30s)
    until `status ∈ stopStatuses`, then `deliverOnce`: react **before**
    recording the dedup key (so a thrown `onEvent` re-delivers — at-least-once),
    keyed by `transactionEventDedupKey(event) = "{transactionId}:{status}"`.
  - `createKvDedupStore(ctx.kv)` — durable dedup, namespaced `tender:dedup:`,
    7-day TTL. `has` = `kv.get !== null`; `add` = `kv.set(marker, ttl)`.
  - `signal?: AbortSignal` — `watchTransaction` throws
    `TenderEventWatchAbortedError` on abort (checked before each poll and after
    each in-flight read).

## Goals / Non-Goals

- **Goal:** close the loop — an order observed `paid` flips exactly once,
  idempotent under redelivery, entirely in-request.
- **Goal:** preserve PRO-894's self-contained-runtime packaging (SDK bundled
  into `dist/`, no published runtime dep).
- **Non-goal:** cron catch-up, subscriptions, embedded flow, Tender-side work.

## Decision 1 — Return-URL drive point with a bounded poll

The return-URL handler is the in-request drive point. It runs
`fulfillTransaction` capped by an `AbortController` so the unbounded backoff loop
can never approach the 30s wall.

```ts
// routes/return.ts (sketch)
const RETURN_POLL_BUDGET_MS = 2_000; // ≈ first two polls (500ms + 1000ms backoff)

export const returnRoute = async (ctx: RouteContext): Promise<ReturnRouteResponse> => {
  const { transactionId } = validateReturnInput(ctx.input);
  const client = createTenderClientFromContext(ctx, tenderConsumerSettings(ctx));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RETURN_POLL_BUDGET_MS);
  try {
    const transaction = await fulfillTransaction(transactionId, {
      client,
      delivered: createKvDedupStore(ctx.kv),
      interestingStatuses: ["paid"],
      signal: controller.signal,
      onEvent: (event) => markOrderPaid(ctx, event), // returns the promise
    });
    return { status: transaction.status };
  } catch (error) {
    if (error instanceof TenderEventWatchAbortedError) return { status: "processing" };
    throw error;
  } finally {
    clearTimeout(timer);
  }
};
```

**Why bounded:** `interestingStatuses: ["paid"]` makes `paid` the only stop
status, so a not-yet-`paid` transaction polls until abort. The budget returns a
benign `{ status: "processing" }` instead of hanging — the order stays `pending`
and a later return-page refresh (or Tender PRO-952 deployed QA) re-drives it.

**Subrequest audit (repo convention — KV/content bridge calls count):** happy
path (already `paid`): `getTransaction` (1) + `dedup.has` (1) +
`applyTenderTransaction` (kv.get, kv.set, kv.get, content.update, kv.set = 5) +
`dedup.add` (1) = **8/10**. The 2s budget caps re-polls so a delivery on the
second poll is **9/10** worst case. If this ever tightens, lower the budget — do
not raise it.

## Decision 2 — `onEvent` adapts the transaction to the existing seam

```ts
const markOrderPaid = (ctx: RouteContext, event: TenderTransactionEvent) => {
  const orderId = event.transaction.metadata.carte_order_id;
  if (typeof orderId !== "string" || orderId === "") return; // boundary guard
  return applyTenderTransaction(transitionCtx(ctx), {
    transactionId: event.transactionId,
    orderId,
    trigger: "paid",
  });
};
```

- **Correlation** round-trips through `metadata.carte_order_id` (set by
  `checkout.ts`, the PRO-728 join). Read back off `event.transaction.metadata`.
- **Returns the promise** so `fulfillTransaction` awaits the reaction before
  recording the dedup key (the at-least-once contract).
- **Idempotent** twice over: the SDK dedup store skips a second delivery of the
  same `txnId:paid`, and `applyTenderTransaction` is itself a no-op on the second
  call. Either layer alone guarantees single fulfillment; together they cover
  both redelivery (same handler) and cross-request replay (return hit twice).

## Decision 3 — `transactionId` is explicit route input (not a guessed redirect param)

The return route reads `transactionId` from `ctx.input`. `checkout.ts` is
extended to return `{ checkoutUrl, transactionId }` so the frontend round-trips
the id into the return navigation. This keeps the contract **Tender-redirect-
agnostic** — Carte never depends on an unverified `?transaction_id=` param name
Tender may or may not append. The frontend already owns the redirect (the
"return checkoutUrl as JSON, no server redirect" rule), so it also owns carrying
the id back. No server redirect is introduced.

## Decision 4 — `createTenderClientFromContext` everywhere; drop hand-rolled construction

`checkout.ts` and `refund.ts` drop their local `createTenderClient({ baseUrl,
pluginToken, fetch })` + `requireHttp` + manual presence checks in favor of
`createTenderClientFromContext(ctx, tenderConsumerSettings(ctx))`. A single
shared `tenderConsumerSettings(ctx)` helper (3 call sites — a real DRY need, not
speculative) narrows `ctx.settings` to `{ tenderBaseUrl, tenderPluginToken }`.
The SDK now owns boundary validation. `refund.ts` keeps its existing
`TenderRefundClient` narrowing cast (full-refund omits `amount`, which the
published `RefundInput` types as required) — behavior unchanged.

## Decision 5 — `network:request:unrestricted` resolves the PRO-912 trust contract

The SDK calls the operator-configured runtime `tenderBaseUrl`, unknown at
authoring time, so a static `allowedHosts` cannot cover it. Switch the manifest
from `network:request` + `allowedHosts: ["license.carteplugin.dev"]` (a stale
license-host artifact unrelated to Tender) to `network:request:unrestricted`,
documented inline. This is the canonical capability name per the EmDash SKILL.md
source of truth. `manifest.test.ts` updates accordingly.

## Decision 6 — `@tenderpay/sdk` as a bundled `devDependency`

Per the confirmed packaging choice: `@tenderpay/sdk@^0.2.0` is a build-time-only
`devDependency` on `@carte/orders-backend`, inlined into `dist/` by
`emdash-plugin build`. The **published** package still declares no SDK
dependency in any field — PRO-894's self-contained-runtime contract holds. The
vendored `file:./vendor/tender-sdk-0.0.0.tgz` and its `.npmrc` hoist are removed;
the workspace resolves the SDK from the registry. `verify-orders-backend-pack.ts`
keeps asserting the published tarball carries no SDK dep, no `vendor/`, no `src/`.

## Risks / Mitigations

- **Subrequest budget at delivery** → bounded 2s poll; audited 9/10 worst case;
  documented "lower, never raise."
- **Unbounded backoff on a never-`paid` txn** → `AbortSignal`;
  `TenderEventWatchAbortedError` caught → `{ status: "processing" }`.
- **Packaging regression** → `verify-orders-backend-pack.ts` + clean-install
  smoke gate stays green.
- **Propagation latency (Candidate C)** → documented: return hit usually sees
  `paid` in 1 poll; lag past budget surfaces as `processing` and reconciles on a
  later drive. Recorded for the kitchen/orders queue UX per PRO-859 acceptance.
