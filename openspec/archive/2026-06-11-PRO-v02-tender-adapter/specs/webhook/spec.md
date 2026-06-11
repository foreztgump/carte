# Spec — `webhook`

> **Linear:** PRO-727, PRO-731, PRO-733, PRO-737

## MODIFIED Requirements

### Requirement: Tender SHALL own the Stripe webhook URL

Carte v0.2.0-rc SHALL remove the legacy
`/_emdash/api/plugins/carte-orders-backend/webhook-stripe` route. Stripe
dashboard webhooks SHALL point to Tender's Stripe provider route instead.

#### Scenario: Legacy Carte webhook route removed

- **GIVEN** the orders-backend source
- **WHEN** routes and plugin descriptor entries are inspected
- **THEN** no route named `webhook-stripe` exists
- **AND** no handler source for `routes/webhook-stripe.ts` remains.

#### Scenario: Operator migration points Stripe to Tender

- **GIVEN** `MIGRATION.md`
- **WHEN** an existing operator follows the v0.2.0-rc upgrade guide
- **THEN** they are instructed to change the Stripe dashboard webhook URL from
  `https://<your-site>/_emdash/api/plugins/carte-orders-backend/webhook-stripe`
  to `https://<your-site>/_emdash/api/plugins/tender-stripe/webhook`.

#### Scenario: Secret migration follows webhook ownership

- **GIVEN** the Tender webhook owns Stripe event verification
- **WHEN** the operator migrates secrets
- **THEN** `stripeSecretKey`, `stripePublicKey`, and `stripeWebhookSecret` are
  moved out of `@carte/orders-backend` settings and into `@tender/stripe`
  settings.

### Requirement: Carte SHALL NOT retain direct Stripe network hosts

The orders backend SHALL no longer whitelist Stripe API hosts because payment
provider network calls are delegated to Tender.

#### Scenario: Allowed hosts exclude Stripe

- **GIVEN** `@carte/orders-backend` manifest source
- **WHEN** `allowedHosts` is inspected
- **THEN** it contains `license.carteplugin.dev`
- **AND** it does not contain `api.stripe.com` or `checkout.stripe.com`.

#### Scenario: Runtime Stripe fetch is rejected

- **GIVEN** an orders-backend sandboxed handler with the v0.2.0-rc host list
- **WHEN** it attempts `ctx.http.fetch("https://api.stripe.com/...")`
- **THEN** the sandbox rejects the request because the host is not allowed.

### Requirement: OQ-1 webhook/event handoff SHALL be documented

Because OQ-1 collapsed in PRO-733, webhook ownership and event-forwarding
constraints SHALL be documented in the rc operator guide and decision note.

#### Scenario: Decision note records no polling fallback

- **GIVEN** `docs/decisions/oq1-tender-hook-namespace.md`
- **WHEN** the decision is read
- **THEN** it states that the real `@tender/sdk` has no `events.list` endpoint
- **AND** it states that the mission ships placeholder `tender:*` hooks pending
  EmDash 0.10 custom namespace dispatch.
