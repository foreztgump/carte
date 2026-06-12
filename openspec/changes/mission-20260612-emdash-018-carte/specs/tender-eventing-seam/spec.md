# Spec delta: tender-eventing-seam

## ADDED Requirements

### Requirement: Dead placeholder eventing is removed; a clean WS4 seam remains

The `tender:*` hook registrations in `orders-backend` and the placeholder dispatch in `events.ts` SHALL be deleted (the platform has no custom inter-plugin hook namespaces; the dispatch never shipped). The order state machine (pending → paid → refunded) SHALL remain behind a single trigger interface that is idempotent by Tender transaction id, so WS4 (PRO-859) can wire the real Tender WS5 contract (hooks, callback route, or polling) without reshaping order logic.

#### Scenario: No placeholder namespace remains

- **WHEN** CI grep gates run
- **THEN** zero hits for `tender:payment` and for `as never` casts on hook registrations

#### Scenario: Transitions are idempotent

- **WHEN** the trigger interface receives the same transaction-id event twice
- **THEN** the order state transitions exactly once; the duplicate is a no-op

#### Scenario: Reconciliation mechanism is out of scope

- **WHEN** this mission completes
- **THEN** no Carte-invented payment-event mechanism exists; consuming the Tender contract is explicitly deferred to PRO-859
