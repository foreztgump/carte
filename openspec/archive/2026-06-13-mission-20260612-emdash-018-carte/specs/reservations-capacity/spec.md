# Spec delta: reservations-capacity

## ADDED Requirements

### Requirement: Capacity is race-safe without atomic KV

Reservation capacity SHALL be enforced via serialized writes against the reservations `storage` collection (D1 single-writer) with a unique constraint on the slot key and conflict-as-full semantics. `ctx.kv.atomicDecrement` claims SHALL be removed from source comments and the sandbox cost table. KV MAY serve only as a fast-path read cache.

#### Scenario: Concurrent bookings never oversell

- **WHEN** N concurrent booking requests target a slot with M < N remaining seats
- **THEN** exactly M bookings succeed and N−M receive a "full" response; total confirmed never exceeds capacity

#### Scenario: Conflict is reported as full

- **WHEN** a capacity write hits the unique-constraint conflict
- **THEN** the request resolves as slot-full (a user-facing outcome), not a 500

## REMOVED Requirements

### Requirement: KV atomic decrement for capacity

**Reason**: `ctx.kv.atomicDecrement` does not exist on the EmDash platform (invented surface; never actually called).
**Migration**: D1 single-writer with unique slot-key constraint, per the added requirement above.
