# Spec — `events`

> **Linear:** PRO-727, PRO-733, PRO-734, PRO-737

## ADDED Requirements

### Requirement: Placeholder Tender payment hooks SHALL encode the event contract

`@carte/orders-backend` SHALL declare placeholder `tender:payment.succeeded` and
`tender:payment.refunded` hook handlers so the contract is ready when EmDash
0.10 supports custom inter-plugin hook namespaces.

#### Scenario: Manifest declares Tender hook keys

- **GIVEN** the orders-backend plugin descriptor
- **WHEN** hooks are inspected
- **THEN** it declares handlers for `tender:payment.succeeded` and
  `tender:payment.refunded`.

#### Scenario: Events without Carte metadata are ignored

- **GIVEN** a Tender payment event without `metadata.carte_order_id`
- **WHEN** either Tender hook handler receives the event
- **THEN** the handler returns without mutating Carte order state.

#### Scenario: Successful payment marks order paid asynchronously

- **GIVEN** a `tender:payment.succeeded` event with `metadata.carte_order_id`
- **WHEN** the handler receives the event for the first time
- **THEN** it enqueues `markOrderPaid` via `ctx.waitUntil`
- **AND** records Tender event idempotency using the event id.

#### Scenario: Refunded payment marks order refunded asynchronously

- **GIVEN** a `tender:payment.refunded` event with `metadata.carte_order_id`
- **WHEN** the handler receives the event for the first time
- **THEN** it enqueues `markOrderRefunded` via `ctx.waitUntil`
- **AND** records Tender event idempotency using the event id.

### Requirement: Tender event handling SHALL be idempotent

Carte's event-subscription path SHALL dedupe Tender event re-deliveries for
seven days using a plugin-scoped KV key.

#### Scenario: Duplicate Tender event is a no-op

- **GIVEN** a Tender event id already recorded at `idempotency:tender:{eventId}`
- **WHEN** the same event is delivered again
- **THEN** no additional order-state update is enqueued
- **AND** the handler returns successfully.

#### Scenario: Idempotency marker expires after seven days

- **GIVEN** a Tender event processed for the first time
- **WHEN** the handler writes the idempotency marker
- **THEN** the marker uses a seven-day retention TTL.

### Requirement: Event handlers SHALL stay within sandbox budget

Tender hook handling SHALL fit within the hard sandbox cap of 10 subrequests and
50ms CPU.

#### Scenario: Hook budget has headroom

- **GIVEN** the sandbox budget auditor
- **WHEN** it analyzes Tender payment hook handlers
- **THEN** each hook remains below the configured subrequest and CPU caps
- **AND** the expected design uses roughly three subrequests: KV read, content
  update, and KV write.

### Requirement: OQ-1 collapse SHALL prevent fake polling implementations

Because PRO-733 resolved that the real `@tender/sdk` has no `events.list`, Carte
SHALL NOT ship a polling route that invents an SDK event cursor.

#### Scenario: No Tender polling route is introduced

- **GIVEN** the orders-backend source
- **WHEN** event subscription code is inspected
- **THEN** it does not call `tender.events.list`
- **AND** it relies on the placeholder hook contract documented for EmDash 0.10.
