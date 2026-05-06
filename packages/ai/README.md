# `@carte/ai`

Status: **skeleton (v0.1, paid SKU)** — no business logic yet.

The Carte AI plugin will own:

- BYO-LLM chat (Anthropic / OpenAI / Google) with tool-call streaming
- Read-by-default, write-on-confirm contract — PII never leaves to the
  LLM without explicit user consent. Enforced at the tool-call boundary,
  not in prompts.
- Server-side license check at `license.carteplugin.dev` with a 24-hour
  KV cache and **graceful degrade on outage** — never lock out the
  restaurant.
- 14-day free trial, then $99/yr via Lemon Squeezy.

Execution model: **native** (locally registered, trusted). Capabilities
declared: `content:read`, `content:write`, `network:request`. `allowedHosts`
restricted to the LLM provider domains plus the license server.
