# Spec — `carte-ai`

## ADDED Requirements

### Requirement: Native plugin, no sandbox quotas

`@carte/ai` SHALL be a native plugin (uncapped runtime). Its standalone MCP wrapper SHALL live under `packages/ai/mcp-wrapper/` with its own `wrangler.toml` and SHALL NOT bundle Carte secrets.

#### Scenario: No wrangler.toml on the main package

- **GIVEN** the directory `packages/ai/`
- **WHEN** listing the package root
- **THEN** no `wrangler.toml` is present at `packages/ai/wrangler.toml`; `packages/ai/mcp-wrapper/wrangler.toml` does exist for the standalone wrapper.

### Requirement: License check with 24h KV cache and graceful degrade

The license check SHALL hit `license.carteplugin.dev`, cache the result under `license:{workspaceId}` with TTL 86400 seconds, and on outage (DNS fail / 5xx) SHALL fall back to the cached value or — if no cache — to a configurable trial-mode banner. The system SHALL never lock the restaurant out of admin functions on license-server failure.

#### Scenario: Cached license honoured during outage

- **GIVEN** a cached license entry within 24h
- **WHEN** the license server returns 503
- **THEN** the AI plugin remains usable and surfaces no error to the operator.

### Requirement: 14-day trial state machine

The trial state SHALL transition `none → trial(14 days) → expired → licensed | blocked-with-grace`. State SHALL be persisted under `trial:{workspaceId}` and SHALL be read on every plugin entry.

#### Scenario: Trial expires at day 14

- **GIVEN** a workspace whose trial began 14 days ago
- **WHEN** the trial state machine evaluates state
- **THEN** the state transitions from `trial` to `expired`; downstream license check then resolves to `licensed` or `blocked-with-grace`.

### Requirement: BYO LLM key per workspace

LLM API keys (Anthropic / OpenAI / Gemini) SHALL be stored as plugin secrets, scoped to `workspaceId`. Cross-workspace key reads SHALL fail.

#### Scenario: Cross-workspace read rejected

- **GIVEN** workspace A has stored an Anthropic key
- **WHEN** workspace B's plugin instance attempts to read it
- **THEN** the read fails and no key material is returned to workspace B.

### Requirement: chat-stream is SSE; history retained 30 days

`/chat-stream` SHALL respond with `Content-Type: text/event-stream` and emit incremental chunks. Chat history SHALL persist under `chat:{userId}` with TTL 2592000 seconds.

#### Scenario: SSE Content-Type and incremental chunks

- **GIVEN** a chat request to `/chat-stream`
- **WHEN** the server begins responding
- **THEN** the response carries `Content-Type: text/event-stream` and emits incremental message chunks.

#### Scenario: Chat history TTL exact

- **GIVEN** a chat history persistence call
- **WHEN** the route writes `chat:{userId}` to KV
- **THEN** the put call uses `expirationTtl: 2592000`.

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

#### Scenario: Inline allergen suggest emits HR9 audit on apply

- **GIVEN** the inline allergen-suggest button on a menu item
- **WHEN** the user confirms the suggested edit
- **THEN** the change is applied through the `/tool-call` write-on-confirm path and an audit entry of HR9 shape (`actor`, `before`, `after`, `timestamp`) is persisted.

### Requirement: MCP interim plan documented

The `packages/ai/mcp-wrapper/` Worker SHALL proxy MCP-client traffic to `/_emdash/api/plugins/<id>/<route>` endpoints. The README SHALL include a concrete `claude_desktop_config.json` snippet pointing the MCP client at the wrapper. The mission SHALL post a comment on EmDash Discussion #850 noting Carte's interim plan.

#### Scenario: Wrapper compiles and README config snippet present

- **GIVEN** the directory `packages/ai/mcp-wrapper/`
- **WHEN** running `wrangler types` and inspecting the README
- **THEN** type generation succeeds and `README.md` contains a `claude_desktop_config.json` JSON snippet pointing the MCP client at the wrapper URL.
