# Spec — `carte-ai`

## ADDED Requirements

### Requirement: Native plugin, no sandbox quotas

`@carte/ai` SHALL be a native plugin (uncapped runtime). Its standalone MCP wrapper SHALL live under `packages/ai/mcp-wrapper/` with its own `wrangler.toml` and SHALL NOT bundle Carte secrets.

### Requirement: License check with 24h KV cache and graceful degrade

The license check SHALL hit `license.carteplugin.dev`, cache the result under `license:{workspaceId}` with TTL 86400 seconds, and on outage (DNS fail / 5xx) SHALL fall back to the cached value or — if no cache — to a configurable trial-mode banner. The system SHALL never lock the restaurant out of admin functions on license-server failure.

#### Scenario: Cached license honoured during outage

- **GIVEN** a cached license entry within 24h
- **WHEN** the license server returns 503
- **THEN** the AI plugin remains usable and surfaces no error to the operator.

### Requirement: 14-day trial state machine

The trial state SHALL transition `none → trial(14 days) → expired → licensed | blocked-with-grace`. State SHALL be persisted under `trial:{workspaceId}` and SHALL be read on every plugin entry.

### Requirement: BYO LLM key per workspace

LLM API keys (Anthropic / OpenAI / Gemini) SHALL be stored as plugin secrets, scoped to `workspaceId`. Cross-workspace key reads SHALL fail.

### Requirement: chat-stream is SSE; history retained 30 days

`/chat-stream` SHALL respond with `Content-Type: text/event-stream` and emit incremental chunks. Chat history SHALL persist under `chat:{userId}` with TTL 2592000 seconds.

### Requirement: Tool-call write-on-confirm with audit + undo (HR8)

Read tools SHALL execute without user confirm. Write tools SHALL return a diff preview + `confirmToken` on first call; only the second call carrying `confirmToken=<token>` SHALL apply the mutation. On apply, the system SHALL emit an audit entry capturing actor, tool, before, after, timestamp; and SHALL return an `undoToken` valid for 600 seconds.

#### Scenario: First call returns diff, no mutation

- **GIVEN** a write tool invocation without `confirmToken`
- **WHEN** the route runs
- **THEN** the response is `{ diff, confirmToken }` and no state changes.

#### Scenario: Audit entry on apply

- **GIVEN** a confirmed write tool
- **WHEN** the mutation executes
- **THEN** an audit entry is persisted with the full HR8 shape.

### Requirement: PII redacted at boundary (HR8)

PII (guest name, email, phone, notes) SHALL NOT enter LLM context unless the user has explicitly opted in for that turn. Redaction SHALL occur at the tool-call boundary BEFORE prompt assembly, NOT inside prompt templates.

#### Scenario: Default redaction

- **GIVEN** a chat turn with no opt-in
- **WHEN** the prompt is assembled
- **THEN** PII fields in the payload are replaced with deterministic redaction tokens before reaching the LLM call.

### Requirement: Inline AI actions go through tool-call confirm

Description gen / allergen suggest / alt text / translate SHALL all surface a diff preview and require confirm before applying. Allergen edits SHALL emit HR9 audit entries.

### Requirement: MCP interim plan documented

The `packages/ai/mcp-wrapper/` Worker SHALL proxy MCP-client traffic to `/_emdash/api/plugins/<id>/<route>` endpoints. The README SHALL include a concrete `claude_desktop_config.json` snippet pointing the MCP client at the wrapper. The mission SHALL post a comment on EmDash Discussion #850 noting Carte's interim plan.
