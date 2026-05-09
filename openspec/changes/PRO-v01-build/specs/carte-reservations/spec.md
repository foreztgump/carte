# carte-reservations

## ADDED Requirements

### Requirement: Reservations manifest uses canonical capabilities

The `@carte/reservations` plugin manifest SHALL declare only the canonical capabilities required for reservation content and email flows.

#### Scenario: Manifest declares minimal canonical capabilities

- **GIVEN** the reservations plugin manifest is created
- **WHEN** its capabilities are inspected
- **THEN** they are exactly `content:read`, `content:write`, and `email:send`

### Requirement: Reservations collections are declared

The reservations plugin manifest SHALL declare `carte_reservations` and `carte_reservation_blocks` as plugin collections so route handlers can access reservation records and blocks through the EmDash content boundary.

#### Scenario: Manifest exposes reservation collection declarations

- **GIVEN** the reservations plugin manifest is created
- **WHEN** its collection declarations are inspected
- **THEN** `carte_reservations` and `carte_reservation_blocks` are present with query indexes for booking and block lookups

### Requirement: Reservation capacity holds are atomic

The reservations plugin SHALL reserve seats by atomically decrementing `capacity:{date}:{slot}` counters, rejecting requests that would make the counter negative, and writing `hold:{holdId}` with a 10-minute TTL.

#### Scenario: Concurrent reservation holds do not oversell

- **GIVEN** a slot has capacity for 50 one-person reservation holds
- **WHEN** 100 concurrent reservation hold attempts run for that same slot
- **THEN** exactly 50 attempts succeed and exactly 50 attempts are rejected
- **AND** the remaining capacity for `capacity:{date}:{slot}` is 0

#### Scenario: Expired or cancelled holds restore capacity after the response

- **GIVEN** a reservation hold exists at `hold:{holdId}` with a 600-second TTL
- **WHEN** the hold expires or is cancelled
- **THEN** the capacity restoration is scheduled through `ctx.waitUntil`
- **AND** the original party size is restored to `capacity:{date}:{slot}`

### Requirement: Public reservation routes manage reservation lifecycle

The reservations plugin SHALL expose public `submit`, `confirm`, and `cancel-by-token` routes that create pending reservations, confirm by HMAC token, and cancel by HMAC token while keeping capacity and email side effects consistent.

#### Scenario: Submit creates a pending reservation and queues receipt email

- **GIVEN** a reservable slot has enough remaining capacity
- **WHEN** a guest submits a reservation request
- **THEN** a pending reservation is persisted
- **AND** slot capacity is decremented by the party size
- **AND** the received email is queued through `ctx.waitUntil`

#### Scenario: Confirm token flips reservation state

- **GIVEN** a pending reservation exists with a valid confirmation token
- **WHEN** the `confirm` route receives that token
- **THEN** the reservation status becomes `confirmed`
- **AND** the confirmation email is queued through `ctx.waitUntil`

#### Scenario: Cancel token restores capacity after response

- **GIVEN** a confirmed reservation exists with a valid cancellation token
- **WHEN** the `cancel-by-token` route receives that token
- **THEN** the reservation status becomes `cancelled`
- **AND** capacity restoration and cancellation email are queued through `ctx.waitUntil`

### Requirement: Reservations admin lists active bookings

The reservations plugin SHALL render a sandbox-safe Block Kit admin page listing pending and confirmed reservations without forbidden Block Kit primitives.

#### Scenario: Admin page excludes cancelled reservations

- **GIVEN** pending, confirmed, and cancelled reservations exist
- **WHEN** the reservations admin route renders
- **THEN** pending and confirmed reservations are listed
- **AND** cancelled reservations are omitted
- **AND** the response uses `label` and `items`, not `text` or `stats`

### Requirement: Reservation slots are read-time projections

The reservations plugin SHALL derive available slots at read time from restaurant hours, reservation blocks, current bookings, and active holds, without persisting slot rows.

#### Scenario: Slot generation subtracts mutable booking state

- **GIVEN** a restaurant has opening hours, closure blocks, a per-slot capacity override, current reservations, and active holds
- **WHEN** available reservation slots are computed for that date
- **THEN** slots outside hours and inside closure blocks are omitted
- **AND** remaining capacity is bounded by the default setting or per-slot override
- **AND** pending and confirmed bookings plus unexpired holds reduce remaining capacity
- **AND** cancelled bookings and expired holds do not reduce remaining capacity

#### Scenario: Slot reads stay inside sandbox budgets

- **GIVEN** the worst-case day contains 5-minute reservation slots
- **WHEN** availability is computed at read time
- **THEN** the bounded read plan uses no more than 10 sandbox subrequests
- **AND** the pure slot projection completes under the 50ms CPU budget
