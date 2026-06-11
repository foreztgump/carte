# Spec — `payments`

> **Linear:** PRO-727, PRO-728, PRO-732, PRO-735, PRO-737

## MODIFIED Requirements

### Requirement: Orders backend SHALL use Tender for checkout and refunds

`@carte/orders-backend@0.2.0-rc` SHALL route hosted checkout creation and refund
creation through the real `@tender/sdk` rather than direct Stripe API calls.
Carte SHALL remain outside raw card-data handling, and the rc SHALL remain a
release candidate for Vicky's Kitchen M5 rather than a GA cut.

#### Scenario: Hosted checkout delegates to Tender

- **GIVEN** a valid checkout request with cart and order identifiers
- **WHEN** `@carte/orders-backend` creates the payment session
- **THEN** it calls `createTenderClient({ baseUrl, pluginToken, fetch?, retry? }).charge`
  with `flow: "hosted"`
- **AND** the request includes `metadata.carte_order_id`,
  `metadata.carte_cart_id`, and `originatingPluginId: "carte-orders-backend"`
- **AND** the route returns `{ checkoutUrl }` using `ChargeResult.checkoutUrl`.

#### Scenario: Checkout contains no direct Stripe endpoint

- **GIVEN** the orders-backend source
- **WHEN** the checkout implementation is inspected
- **THEN** it contains no direct request to
  `https://api.stripe.com/v1/checkout/sessions`.

#### Scenario: Refund delegates to Tender

- **GIVEN** an admin refund request that matches the v0.1 route contract
- **WHEN** `@carte/orders-backend` processes the refund
- **THEN** it calls `tender.refund({ transactionId, amount, reason, reasonNote?,
idempotencyKey? })`
- **AND** maps free-form Carte reason text to Tender's closed enum
  `duplicate | fraudulent | requested-by-customer | other`
- **AND** preserves the original free-form text as `reasonNote`.

#### Scenario: Admin refund UI remains stable

- **GIVEN** `@carte/orders-admin` source
- **WHEN** the Tender adapter rc lands
- **THEN** the admin package is not changed for the refund flow
- **AND** the existing button continues to POST to
  `/_emdash/api/plugins/carte-orders-backend/refund`.

### Requirement: Tender SDK dependency SHALL be a peer dependency

`@carte/orders-backend` SHALL declare `@tender/sdk` as a peer dependency per the
OQ-2 decision in PRO-735. Operators SHALL install the three-plugin Tender model:
`@carte/orders-backend`, `tender-core`, and `tender-stripe`.

#### Scenario: Package metadata reflects OQ-2

- **GIVEN** `packages/orders-backend/package.json`
- **WHEN** dependencies are inspected
- **THEN** `peerDependencies["@tender/sdk"]` is present
- **AND** `dependencies["@tender/sdk"]` is absent.

#### Scenario: Migration guide explains the peer model

- **GIVEN** `MIGRATION.md`
- **WHEN** an operator reads the install instructions
- **THEN** the guide states that `@tender/sdk` is provided as a peer dependency
  and cites PRO-735's three-plugin decision.

### Requirement: Stripe-specific settings SHALL move out of Carte

`@carte/orders-backend` SHALL remove Stripe-specific settings from its settings
schema and introduce Tender settings needed by the SDK.

#### Scenario: Legacy Stripe settings removed

- **GIVEN** the orders-backend settings schema
- **WHEN** it is inspected
- **THEN** it does not declare `stripePublicKey`, `stripeSecretKey`, or
  `stripeWebhookSecret`.

#### Scenario: Tender settings present

- **GIVEN** the orders-backend settings schema
- **WHEN** it is inspected
- **THEN** it declares `tenderBaseUrl`, `tenderPluginToken`, and
  `tenderProvider`
- **AND** `tenderProvider` defaults to `stripe`.

#### Scenario: Stale Stripe key warning avoids secret leakage

- **GIVEN** an upgraded workspace still has a legacy `stripeSecretKey`
- **WHEN** the admin warning helper runs
- **THEN** it surfaces a one-time non-blocking warning telling the operator to
  move the key to `@tender/stripe`
- **AND** it never logs or renders the secret value.
