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

## MCP interim wrapper

EmDash 0.9.0 has no public plugin-defined MCP registration API yet, so Carte
v0.1 exposes AI tools through plugin routes and ships a standalone wrapper
Worker in [`mcp-wrapper/`](./mcp-wrapper/). The wrapper README includes the
`claude_desktop_config.json` snippet for pointing an MCP client at the Worker.
