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
