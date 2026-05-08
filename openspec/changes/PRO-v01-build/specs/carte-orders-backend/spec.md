# Spec — `carte-orders-backend`

## ADDED Requirements

### Requirement: Manifest with allowedHosts whitelist

`@carte/orders-backend` SHALL declare capabilities `content:read`, `content:write`, `email:send`, `network:request` with `allowedHosts: ['api.stripe.com', 'checkout.stripe.com']`, and SHALL NOT declare `network:request:unrestricted`.

#### Scenario: Manifest validates and host whitelist explicit

- **GIVEN** the manifest source
- **WHEN** validated by `emdash plugin validate`
- **THEN** validation passes and the `allowedHosts` array contains exactly the two Stripe hosts.

### Requirement: Stripe Checkout only (HR7)

The system SHALL never receive, store, log, or transmit raw card numbers, CVC/CVV, expiry, or any card-derived secret. All card-data handling SHALL occur within Stripe Checkout.

#### Scenario: No card-data tokens in source

- **GIVEN** the orders-backend source and tests
- **WHEN** searching `grep -inE "card_number|pan|cvv|cvc"`
- **THEN** zero matches are returned.

### Requirement: Cart hold persisted with TTL 600s

The `checkout` route SHALL persist a `cart-hold:{cartId}` entry in KV with `expirationTtl: 600` and SHALL issue ≤ 4 subrequests per invocation.

#### Scenario: Cart hold TTL exact

- **GIVEN** a checkout call
- **WHEN** the route writes the cart hold
- **THEN** the put call uses TTL 600 seconds.

### Requirement: Idempotent Stripe webhook (HR5)

The `webhook-stripe` route SHALL verify the Stripe signature FIRST (before any KV read or write or content access), THEN read `idempotency:{event.id}` and return 200 no-op if present, THEN write `idempotency:{event.id}` with TTL 7 days, THEN enqueue order persistence and email send via `ctx.waitUntil`, THEN return 200. Replay of the same event id SHALL be a no-op. The route SHALL issue ≤ 7 subrequests per invocation.

#### Scenario: Replay is no-op

- **GIVEN** a Stripe event already processed within 7 days
- **WHEN** Stripe redelivers
- **THEN** the route returns 200 with no new order, no duplicate email.

#### Scenario: Subrequest budget under cap

- **GIVEN** a webhook invocation under vitest-pool-workers
- **WHEN** the handler completes
- **THEN** subrequest count is ≤ 7.

### Requirement: Refund route uses Stripe Idempotency-Key

The `refund` route SHALL include an `Idempotency-Key` header derived deterministically from `orderId` on every Stripe API call.

#### Scenario: Refund header set

- **GIVEN** a refund call for `order_123`
- **WHEN** the Stripe call is made
- **THEN** the request includes `Idempotency-Key: refund-order_123`.

### Requirement: Order line items snapshot at write (SG3)

When an order is created from a Checkout session, the system SHALL snapshot `itemName`, `unitPrice`, and modifier names at write time. Subsequent menu changes SHALL NOT affect the persisted line items.

#### Scenario: Snapshot survives menu change

- **GIVEN** an order persisted with item "Margherita 12.00"
- **WHEN** the menu price for "Margherita" changes to 14.00
- **THEN** the order's line item still reads "Margherita 12.00".
