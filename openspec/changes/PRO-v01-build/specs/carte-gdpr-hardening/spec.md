# Spec — `carte-gdpr-hardening`

## ADDED Requirements

### Requirement: Guest data export

A handler under `@carte/core` SHALL export, given an email, all reservations and orders for that email as a downloadable JSON document. Unauthorised callers SHALL receive 401.

### Requirement: Guest data erasure with PII-strip retention

An erasure handler SHALL replace `name`, `email`, `phone`, and `notes` on the guest's reservations and orders with deterministic-hash placeholders and SHALL preserve revenue fields (`total`, `currency`, `lineItems`). The retention policy SHALL be documented in `packages/core/README.md` (or `RETENTION.md`).

#### Scenario: PII fields zeroed, revenue preserved

- **GIVEN** a guest with two prior orders
- **WHEN** the erasure handler runs for the guest's email
- **THEN** name/email/phone/notes are replaced with deterministic hashes; total/currency/lineItems are preserved.

### Requirement: KV per-IP rate limiting on public routes

`/submit` (reservations) and `/checkout` (orders-backend) SHALL apply a sliding-window per-IP rate limiter backed by KV. The added subrequest cost SHALL be ≤ 2 per route invocation.

#### Scenario: 100 requests in 60s throttled

- **GIVEN** 100 requests from a single IP within 60 seconds
- **WHEN** the threshold is crossed
- **THEN** subsequent requests return 429.

### Requirement: Pen-smoke tests

The mission SHALL include reproducible Vitest suites that verify (a) Stripe webhook replay is a no-op, (b) 1000-concurrent submit produces no oversell, (c) license-check graceful degrade leaves the restaurant usable on simulated outage.

### Requirement: AgentShield clean across all packages + CI step

`npx ecc-agentshield scan packages/ .factory/ .claude/` SHALL exit 0. `.github/workflows/ci.yml` SHALL include an AgentShield step that runs on every PR. Allowlist entries SHALL each carry a one-line rationale comment and SHALL be reviewed by `security-review-droid`.
