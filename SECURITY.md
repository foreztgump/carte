# Security Policy

Status: **v0.1 — pre-launch.** The contact address below is a placeholder; a
permanent security mailbox will be finalized before the public v1.0
announcement.

## Reporting a vulnerability

Email <security@carteplugin.dev> with:

- A clear description of the issue and the affected plugin or component.
- Steps to reproduce (proof-of-concept welcome; please avoid testing against
  production restaurant tenants).
- The Carte version (or commit SHA) and EmDash SDK version you observed.

We acknowledge new reports within **5 business days**. Please do not file
public GitHub issues for suspected vulnerabilities.

## Scope

In scope:

- The six v0.1 plugins: `@carte/core`, `@carte/reservations`,
  `@carte/orders-backend`, `@carte/orders-admin`, `@carte/views`, `@carte/ai`.
- The standalone MCP wrapper Worker shipped under `packages/ai/mcp-wrapper/`.
- Configuration and CI workflows in this repository.

Out of scope:

- Third-party services Carte integrates with: Cloudflare, Stripe, EmDash, LLM
  providers (Anthropic / OpenAI / Google), Lemon Squeezy, and the
  `license.carteplugin.dev` license server. Report issues with those services
  to their respective vendors.

## Threat model (summary)

- **GDPR data flows.** `@carte/core` exposes admin-only export and erasure
  routes for reservation and order guest data. Erasure replaces PII with a
  deterministic `erased:<sha256>` placeholder while preserving revenue
  records for the statutory retention period.
- **Stripe webhook integrity.** `@carte/orders-backend` verifies webhook
  signatures and deduplicates events via KV `idempotency:{stripeEventId}` with
  a 7-day TTL. Re-deliveries are routine, not exceptional.
- **AI tool-call boundary.** `@carte/ai` enforces a read-by-default,
  write-on-confirm contract. PII redaction happens at the tool-call layer,
  not in prompts, so jailbreaks cannot bypass it.
- **Public-route rate limiting.** Reservation submit and AI chat routes apply
  per-IP sliding-window limits backed by KV TTL. Client-controlled
  `x-forwarded-for` headers are ignored; only EmDash / Cloudflare request
  metadata and `cf-connecting-ip` are trusted.
- **Sandbox runtime constraints.** Sandboxed plugins operate under a hard
  budget of 50 ms CPU, 10 subrequests, 30 s wall time, and ~128 MB memory per
  invocation. Handlers must stay within budget; speculative outbound calls
  are not added.

## Hardening posture

- AgentShield CI scan runs clean on every PR.
- Stripe Checkout handles all card data — Carte infrastructure never receives
  raw PAN or CVC.
- HMAC-signed guest tokens for tokenless reservation confirm / cancel flows.
- KV-based per-IP rate limiting on every public route.
- AI write-on-confirm with audit log and 10-minute undo window.

## Known limitations

- **Cloudflare Free plan has no Dynamic Workers.** EmDash cannot host
  sandboxed plugins with isolation on Free, so sandboxed Carte plugins run
  trusted there. This is documented in plugin READMEs and surfaced in the
  install flow. Restaurants on Free should treat the whole Worker as trusted
  application code.
- v0.1 ships an interim MCP wrapper Worker because the EmDash 0.9.0 plugin
  SDK does not yet expose a public MCP tool registration API.
