# payment-fulfillment Specification

## Purpose

TBD - created by archiving change wire-tender-fulfillment. Update Purpose after archive.

## Requirements

### Requirement: Fulfillment is driven in-request via the SDK consumer-eventing API

The plugin SHALL reconcile terminal Tender payment state by calling
`fulfillTransaction` from `@tenderpay/sdk` against a Tender client built with
`createTenderClientFromContext(ctx, settings)`. The plugin SHALL NOT read
Tender storage directly, SHALL NOT register any `tender:*` hook, and SHALL NOT
poll any endpoint other than the SDK-wrapped authenticated `getTransaction` read
route. All fulfillment work SHALL complete within the originating request (no
`ctx.waitUntil` / `after()` reliance).

#### Scenario: Return-URL drive point fulfills a paid transaction

- **GIVEN** a return-URL request carrying a `transactionId` whose Tender
  transaction is `paid` with `metadata.carte_order_id = "order_123"`
- **WHEN** the return route runs `fulfillTransaction` with
  `interestingStatuses: ["paid"]` and a durable KV dedup store
- **THEN** the matching order `order_123` is updated to `status: "paid"` exactly
  once, the handler returns `{ status: "paid" }`, and no `tender:*` hook is
  registered on the plugin.

#### Scenario: No direct Tender storage access or hook registration

- **GIVEN** the built `@carte/orders-backend` plugin surface
- **WHEN** its descriptor and source are inspected
- **THEN** `plugin.hooks` is `undefined`, no code reads a Tender collection
  directly, and the only Tender network call is through the SDK client.

### Requirement: Order fulfillment is idempotent under at-least-once delivery

The fulfillment reaction SHALL be idempotent and key off the transaction's
absolute state, not arrival order. Observing the same terminal transaction more
than once — within one poll loop, across a duplicate return hit, or across a
restart — SHALL transition the order at most once. The plugin SHALL use the
durable KV-backed dedup store (`createKvDedupStore`), never the in-memory store,
in the shipped path.

#### Scenario: Duplicate observation fulfills exactly once

- **GIVEN** an order reconciled to `paid` for transaction `txn_paid_123`
- **WHEN** the return route observes `txn_paid_123` as `paid` a second time
- **THEN** the order content store receives exactly one `paid` update across both
  observations and the second `fulfillTransaction` performs no further order
  write.

#### Scenario: A failed reaction re-delivers rather than being lost

- **GIVEN** a terminal `paid` transaction whose `onEvent` reaction throws on the
  first attempt
- **WHEN** the transaction is observed again
- **THEN** the dedup key was not recorded for the failed attempt and the reaction
  runs again (at-least-once, not at-most-once).

### Requirement: The poll is bounded to the sandbox budget

The return-URL fulfillment poll SHALL be bounded by an `AbortSignal` so it never
approaches the sandbox 30s wall-clock or exhausts the 10-subrequest ceiling. When
the transaction has not reached an interesting status within the budget, the
handler SHALL return a non-terminal `{ status: "processing" }` response without
throwing, leaving the order in its prior state for a later drive.

#### Scenario: A not-yet-paid transaction returns processing within budget

- **GIVEN** a return-URL request whose transaction is still `processing`
- **WHEN** the bounded `fulfillTransaction` poll exhausts its abort budget
- **THEN** the handler catches `TenderEventWatchAbortedError`, returns
  `{ status: "processing" }`, and the order is not transitioned.

### Requirement: Order correlation round-trips through transaction metadata

The plugin SHALL correlate a Tender transaction to a Carte order by writing the
order id into the charge `metadata` at checkout and reading it back off
`event.transaction.metadata` at fulfillment. A fulfillment event whose
transaction metadata lacks a usable order id SHALL be a no-op (no order write,
no throw).

#### Scenario: Missing order id in metadata is a safe no-op

- **GIVEN** a `paid` transaction whose `metadata` carries no `carte_order_id`
- **WHEN** the fulfillment reaction runs
- **THEN** no order content update is attempted and the handler does not throw.

### Requirement: The Tender client is built from the route context and consumer settings

The plugin SHALL construct every Tender client with
`createTenderClientFromContext(ctx, settings)`, sourcing `tenderBaseUrl` and
`tenderPluginToken` from plugin settings. The `tenderPluginToken` setting SHALL
be documented as secret/masked (admin-scoped `ec_pat_…`). The plugin SHALL NOT
hand-derive the token, `fetch`, or base URL, and SHALL NOT pass raw card data
(PAN/CVV/expiry) on any path.

#### Scenario: Client construction delegates boundary validation to the SDK

- **GIVEN** a route context whose settings carry `tenderBaseUrl` and
  `tenderPluginToken`
- **WHEN** the checkout, refund, or return route builds its Tender client
- **THEN** the client is produced by `createTenderClientFromContext(ctx,
settings)` and a missing base URL, token, or `http.fetch` surfaces as a
  descriptive error from the SDK boundary rather than an opaque later failure.
