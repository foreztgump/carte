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
