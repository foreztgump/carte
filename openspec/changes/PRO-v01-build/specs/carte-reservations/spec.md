# carte-reservations

## ADDED Requirements

### Requirement: Reservations manifest uses canonical capabilities

The `@carte/reservations` plugin manifest SHALL declare only the canonical capabilities required for reservation content and email flows.

#### Scenario: Manifest declares minimal canonical capabilities

- **Given** the reservations plugin manifest is created
- **When** its capabilities are inspected
- **Then** they are exactly `content:read`, `content:write`, and `email:send`

### Requirement: Reservations collections are declared

The reservations plugin manifest SHALL declare `carte_reservations` and `carte_reservation_blocks` as plugin collections so route handlers can access reservation records and blocks through the EmDash content boundary.

#### Scenario: Manifest exposes reservation collection declarations

- **Given** the reservations plugin manifest is created
- **When** its collection declarations are inspected
- **Then** `carte_reservations` and `carte_reservation_blocks` are present with query indexes for booking and block lookups

### Requirement: Reservation capacity holds are atomic

The reservations plugin SHALL reserve seats by atomically decrementing `capacity:{date}:{slot}` counters, rejecting requests that would make the counter negative, and writing `hold:{holdId}` with a 10-minute TTL.

#### Scenario: Concurrent reservation holds do not oversell

- **Given** a slot has capacity for 50 one-person reservation holds
- **When** 100 concurrent reservation hold attempts run for that same slot
- **Then** exactly 50 attempts succeed and exactly 50 attempts are rejected
- **And** the remaining capacity for `capacity:{date}:{slot}` is 0

#### Scenario: Expired or cancelled holds restore capacity after the response

- **Given** a reservation hold exists at `hold:{holdId}` with a 600-second TTL
- **When** the hold expires or is cancelled
- **Then** the capacity restoration is scheduled through `ctx.waitUntil`
- **And** the original party size is restored to `capacity:{date}:{slot}`

### Requirement: Public reservation routes manage reservation lifecycle

The reservations plugin SHALL expose public `submit`, `confirm`, and `cancel-by-token` routes that create pending reservations, confirm by HMAC token, and cancel by HMAC token while keeping capacity and email side effects consistent.

#### Scenario: Submit creates a pending reservation and queues receipt email

- **Given** a reservable slot has enough remaining capacity
- **When** a guest submits a reservation request
- **Then** a pending reservation is persisted
- **And** slot capacity is decremented by the party size
- **And** the received email is queued through `ctx.waitUntil`

#### Scenario: Confirm token flips reservation state

- **Given** a pending reservation exists with a valid confirmation token
- **When** the `confirm` route receives that token
- **Then** the reservation status becomes `confirmed`
- **And** the confirmation email is queued through `ctx.waitUntil`

#### Scenario: Cancel token restores capacity after response

- **Given** a confirmed reservation exists with a valid cancellation token
- **When** the `cancel-by-token` route receives that token
- **Then** the reservation status becomes `cancelled`
- **And** capacity restoration and cancellation email are queued through `ctx.waitUntil`

### Requirement: Reservations admin lists active bookings

The reservations plugin SHALL render a sandbox-safe Block Kit admin page listing pending and confirmed reservations without forbidden Block Kit primitives.

#### Scenario: Admin page excludes cancelled reservations

- **Given** pending, confirmed, and cancelled reservations exist
- **When** the reservations admin route renders
- **Then** pending and confirmed reservations are listed
- **And** cancelled reservations are omitted
- **And** the response uses `label` and `items`, not `text` or `stats`

### Requirement: Reservation slots are read-time projections

The reservations plugin SHALL derive available slots at read time from restaurant hours, reservation blocks, current bookings, and active holds, without persisting slot rows.

#### Scenario: Slot generation subtracts mutable booking state

- **Given** a restaurant has opening hours, closure blocks, a per-slot capacity override, current reservations, and active holds
- **When** available reservation slots are computed for that date
- **Then** slots outside hours and inside closure blocks are omitted
- **And** remaining capacity is bounded by the default setting or per-slot override
- **And** pending and confirmed bookings plus unexpired holds reduce remaining capacity
- **And** cancelled bookings and expired holds do not reduce remaining capacity

#### Scenario: Slot reads stay inside sandbox budgets

- **Given** the worst-case day contains 5-minute reservation slots
- **When** availability is computed at read time
- **Then** the bounded read plan uses no more than 10 sandbox subrequests
- **And** the pure slot projection completes under the 50ms CPU budget
