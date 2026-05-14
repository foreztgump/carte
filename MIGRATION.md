# Migration — Carte v0.1 → v0.2.0-rc (Tender adapter)

Carte v0.2.0-rc moves `@carte/orders-backend` from direct Stripe calls to the
Tender adapter described in
[PRO-727](https://linear.app/projects-linear/issue/PRO-727/carte-tender-adapter-route-carteorders-backend-through-tendersdk).
This rc is the upstream prerequisite for Vicky's Kitchen M5 and is not a GA
release yet.

## What changed

1. `@carte/orders-backend` routes checkout and refunds through `@tender/sdk`
   instead of calling Stripe directly.
2. Stripe settings are removed from `@carte/orders-backend`; provider secrets
   now live with the Tender Stripe provider.
3. The old Carte `/webhook-stripe` route is deleted. Tender owns the Stripe
   webhook URL and forwards payment state to Carte through `tender:*` hooks.

## Required actions for operators

### 1. Install the three-plugin payment model

Install all three pieces for the rc:

- `@carte/orders-backend@^0.2.0-rc`
- `tender-core`
- `tender-stripe` (the Stripe provider whose settings surface is
  `@tender/stripe`)

`@tender/sdk` is a peer dependency of `@carte/orders-backend`, so install it in
the app root if your Tender install has not already provided it:

```sh
pnpm add @tender/sdk@^0.1.0
```

This peer-dependency shape is the OQ-2 decision: Tender plugins provide the
shared SDK, avoiding transitive duplication and matching the three-plugin ship
model
([PRO-735](https://linear.app/projects-linear/issue/PRO-735/resolve-oq-2-tendersdk-peer-vs-direct-dependency-for-carteordersbackend)).

### 2. Update the Stripe dashboard webhook URL

Old URL:

```text
https://<your-site>/_emdash/api/plugins/carte-orders-backend/webhook-stripe
```

New URL:

```text
https://<your-site>/_emdash/api/plugins/tender-stripe/webhook
```

### 3. Move Stripe secrets to the Tender Stripe provider

- Remove legacy `stripeSecretKey`, `stripePublicKey`, and
  `stripeWebhookSecret` values from `@carte/orders-backend` settings after the
  upgrade warning has been acknowledged.
- Install and configure `tender-stripe`.
- Set the same Stripe secret key, public key, and webhook secret in the
  `@tender/stripe` settings surface.

### 4. Note the OQ-1 hook namespace constraint

OQ-1 is resolved as "collapsed": the real `@tender/sdk` has no `events.list`
cursor API, so Carte cannot ship a polling fallback. Carte v0.2.0-rc ships
placeholder `tender:payment.succeeded` and `tender:payment.refunded` handlers
pending EmDash 0.10 custom inter-plugin hook dispatch. See
[PRO-733](https://linear.app/projects-linear/issue/PRO-733/resolve-oq-1-emdash-custom-hook-namespace-support-for-tender-events)
and the decision note:
[`docs/decisions/oq1-tender-hook-namespace.md`](./docs/decisions/oq1-tender-hook-namespace.md).

## Tender publish prerequisite

The actual `@carte/orders-backend@0.2.0-rc.1` publish is HITL-blocked until
`@tender/sdk@^0.1.0`, `tender-core`, and `tender-stripe` are available from the
registry. This is tracked under
[PRO-737](https://linear.app/projects-linear/issue/PRO-737/publish-carteorders-backend020-rc-and-tag-release)
by the future Tender publish-prereq sub-issue: "External prereq: Tender team
publishes `@tender/sdk@0.1.0` + `tender-core` + `tender-stripe` to npm."

## Rollback

If you need to revert to v0.1.0:

```sh
pnpm add @carte/orders-backend@^0.1.0
```

Then restore the old Stripe settings on `@carte/orders-backend` and reset the
Stripe dashboard webhook URL to
`https://<your-site>/_emdash/api/plugins/carte-orders-backend/webhook-stripe`.
