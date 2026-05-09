# Spec — `carte-orders-admin`

## ADDED Requirements

### Requirement: Native plugin (no Wrangler)

`@carte/orders-admin` SHALL be a native plugin and SHALL NOT include a `wrangler.toml`. Capabilities declared: `content:read`, `content:write`.

#### Scenario: No wrangler.toml present

- **GIVEN** the package directory `packages/orders-admin/`
- **WHEN** listing files
- **THEN** no `wrangler.toml` file exists.

### Requirement: Typed REST contracts via @carte/core (SG6)

All cross-plugin calls from orders-admin to orders-backend SHALL go through documented REST routes using TypeScript request/response types imported from `@carte/core/contracts`. orders-admin SHALL NOT import internals of orders-backend.

#### Scenario: Contracts imported from core

- **GIVEN** the orders-admin source
- **WHEN** searching imports
- **THEN** order/refund/modifier-update types come from `@carte/core/contracts` only; no `from "@carte/orders-backend/...`" imports exist.

### Requirement: Order list and detail render with snapshots

The order list SHALL render orders filtered by status and date range. The order detail SHALL display the snapshotted line items (itemName, unitPrice, modifier names) without re-resolution against the live menu.

#### Scenario: Detail shows snapshotted modifier names

- **GIVEN** an order persisted with line item "Margherita 12.00" and modifier "Extra Basil"
- **WHEN** the order detail view renders
- **THEN** "Margherita", "12.00", and "Extra Basil" are displayed from the snapshot, not re-resolved against the current menu.

### Requirement: Refund button POSTs to orders-backend /refund

The refund button SHALL POST to `/_emdash/api/plugins/carte-orders-backend/refund` and update the UI on response.

#### Scenario: Refund click POSTs and updates UI

- **GIVEN** an order detail view with the refund button enabled
- **WHEN** the operator clicks refund
- **THEN** the UI POSTs to `/_emdash/api/plugins/carte-orders-backend/refund` and surfaces the returned refund metadata on success.

### Requirement: Modifier groups are single-tier with per-option fees

The modifier editor SHALL accept single-tier modifier groups with per-option fee metadata. Nested modifier groups SHALL be rejected with a descriptive validation error.

#### Scenario: Nested modifier rejected

- **GIVEN** an attempt to create a nested modifier group
- **WHEN** the editor submits
- **THEN** the request is rejected with a clear error message.

### Requirement: Status-driven workflow

Orders SHALL transition `pending → preparing → ready → completed`. Invalid transitions SHALL be disabled in the UI.

#### Scenario: Invalid transitions disabled

- **GIVEN** an order in `pending`
- **WHEN** the workflow controls render
- **THEN** the `preparing` action is enabled and any non-adjacent transition action (e.g., direct-to-`completed`) is disabled.

### Requirement: Email-first notification templates

The admin SHALL provide a template editor for transactional emails (received / confirmed / receipt / refund). Templates SHALL be rendered server-side by orders-backend, NOT in this admin (admin saves only).

#### Scenario: Template save persists, rendering happens server-side

- **GIVEN** the admin template editor with edits to the receipt template
- **WHEN** the operator saves
- **THEN** the template body is persisted; the admin does NOT render or send the email — orders-backend renders it inside `ctx.waitUntil` on the next webhook event.

### Requirement: a11y AA baseline

The rendered admin SHALL have zero serious or critical WCAG 2.1 AA violations under axe-core.

#### Scenario: axe-core run on rendered pages is clean

- **GIVEN** the orders-admin pages rendered under Playwright with axe-core injected
- **WHEN** the audit runs
- **THEN** zero serious or critical WCAG 2.1 AA violations are reported.
