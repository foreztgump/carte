# Spec — `carte-reservations`

## ADDED Requirements

### Requirement: Manifest with canonical capabilities

`@carte/reservations` SHALL declare exactly `content:read`, `content:write`, `email:send`, register collections `carte_reservations` and `carte_reservation_blocks`, and mount routes `submit`, `confirm`, `cancel-by-token`, `admin/*`.

#### Scenario: emdash plugin validate clean

- **GIVEN** a developer running `pnpm -F @carte/reservations exec emdash plugin validate`
- **WHEN** the command executes
- **THEN** it exits 0.

### Requirement: Capacity counter uses KV atomic decrement (HR6)

Capacity per slot SHALL be tracked in KV under key `capacity:{date}:{slot}` using an atomic decrement primitive. The system SHALL NOT read-then-write the same key on the capacity path. On reservation cancellation or hold expiry, the counter SHALL be restored via the equivalent atomic increment inside `ctx.waitUntil`.

#### Scenario: 100 concurrent submits for capacity 50

- **GIVEN** capacity `50` for a date/slot
- **WHEN** 100 concurrent submit calls arrive
- **THEN** exactly 50 reservations succeed and 50 are rejected with conflict.

#### Scenario: Hold expiry restores counter

- **GIVEN** a 10-minute hold that expires
- **WHEN** the TTL fires
- **THEN** the capacity counter is incremented inside `ctx.waitUntil`.

### Requirement: Submit / confirm / cancel routes via HMAC tokens

The `submit` route SHALL create a pending reservation, decrement capacity, write `hold:{holdId}` with TTL 600 seconds, and queue a "received" email via `ctx.waitUntil`. The `confirm` route SHALL accept an HMAC-signed token and flip the reservation to confirmed. The `cancel-by-token` route SHALL accept an HMAC-signed token, flip to cancelled, and restore capacity inside `ctx.waitUntil`.

#### Scenario: Invalid token on confirm

- **GIVEN** a confirm request with a malformed token
- **WHEN** the route handler executes
- **THEN** the response is 400 and no state changes.

### Requirement: Slots computed at read

The system SHALL NOT persist slot rows. Available slots SHALL be derived at read time from hours minus blocks (`carte_reservation_blocks`) minus current bookings minus active holds.

#### Scenario: Slot generator under sandbox budget

- **GIVEN** a worst-case slot fetch on a busy day
- **WHEN** the generator executes
- **THEN** subrequest count is ≤ 10 and CPU time ≤ 50ms.

### Requirement: Email side-effects in waitUntil (HR2)

Every email send (`received`, `confirmed`, `cancelled`) SHALL be scheduled inside `ctx.waitUntil`, never awaited inline on the response path.

#### Scenario: Email send scheduled, not awaited

- **GIVEN** any of submit / confirm / cancel
- **WHEN** the handler returns
- **THEN** the email send is recorded as a `ctx.waitUntil` argument; the response was sent before the email completed.
