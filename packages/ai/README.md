# `@carte/ai`

Status: **v0.1 shipped** (paid SKU).

Shipped surfaces:

- License + trial state machine (`license.ts`) — server-side check at
  `license.carteplugin.dev` with 24-hour KV cache and graceful degrade on
  outage; 14-day trial, then $99/yr via Lemon Squeezy.
- BYO-LLM SSE chat route (`routes/chat.ts`) with chat history persistence
  (`chat-history.ts`).
- PII boundary enforcement at the tool-call layer (`pii-boundary.ts`) —
  PII never leaves to the LLM without explicit user consent.
- Write-on-confirm tool calls (`tool-call.ts`) with diff preview, audit
  log, and 10-minute undo window.
- Native React admin (`components/ChatPanel.tsx`,
  `components/InlineAiActions.tsx`) with inline action buttons.
- Rate limiting on chat routes (`rate-limit.ts`).
- Workspace-scoped secrets (`workspace-secrets.ts`) and PII KV egress
  discipline tests.

Execution model: **native** (0.18 `definePlugin`, in-process and unsandboxed). Capabilities
declared: `content:read`, `content:write`, `network:request`. `allowedHosts`
restricted to the LLM provider domains plus the license server.

## MCP interim wrapper

EmDash 0.9.0 has no public plugin-defined MCP registration API yet, so Carte
v0.1 exposes AI tools through plugin routes and ships a standalone wrapper
Worker in [`mcp-wrapper/`](./mcp-wrapper/). The wrapper README includes the
`claude_desktop_config.json` snippet for pointing an MCP client at the Worker.
