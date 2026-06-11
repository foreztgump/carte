# Spec — `ai-tool-call`

> **Linear:** PRO-623, PRO-737

## MODIFIED Requirements

### Requirement: AI mutation confirmations SHALL be actor-bound

`@carte/ai` SHALL continue to use the v0.1 read-by-default,
write-on-confirm contract, and SHALL strengthen confirmation validation by
requiring the confirming actor to match the actor that created the pending call.

#### Scenario: Same actor confirms a pending call

- **GIVEN** a pending mutation call created by `actorId: "chef-1"` in
  `workspaceId: "workspace-1"`
- **WHEN** `chef-1` confirms the call in the same workspace
- **THEN** the confirmation may proceed if all other token checks pass.

#### Scenario: Different actor is rejected

- **GIVEN** a pending mutation call created by `actorId: "chef-1"`
- **WHEN** `actorId: "chef-2"` attempts to confirm the same token
- **THEN** the route returns a forbidden response
- **AND** no mutation is applied.

### Requirement: `priceDiff.before` SHALL be authoritative from current content

AI confirmation SHALL treat client-supplied `before` values as advisory and
compute authoritative `priceDiff.before` from current EmDash content at
confirmation time.

#### Scenario: Stale client price is overwritten

- **GIVEN** the client preview includes `before: 1200`
- **AND** current content now has price `1400`
- **WHEN** the mutation is confirmed
- **THEN** the persisted diff records `before: 1400`.

### Requirement: Undo and audit KV records SHALL redact PII at the boundary

Before writing undo or audit records to KV, `@carte/ai` SHALL redact PII fields
from tool input, `before`, and `after` payloads. Redaction SHALL happen at the
tool-call boundary, not in prompts.

#### Scenario: PII fields are redacted in KV

- **GIVEN** a mutation input containing an email, guest name, phone number, and
  postal address
- **WHEN** the undo and audit records are persisted
- **THEN** those values are stored as `[REDACTED]`
- **AND** non-PII routing metadata such as `workspaceId`, `actorId`, and tool
  name remains available for auditing.

### Requirement: Undo SHALL handle partial diffs, replay, and expiry clearly

Undo behavior SHALL remain available for ten minutes, support multi-field
reverts, treat replay after success as a no-op, and report expiry explicitly.

#### Scenario: Multi-field undo reverts each field

- **GIVEN** a mutation changes multiple independent fields
- **WHEN** the undo token is used before expiry
- **THEN** each changed field is restored from the stored `before` snapshot.

#### Scenario: Replayed undo is idempotent

- **GIVEN** an undo token has already completed successfully
- **WHEN** the same token is submitted again
- **THEN** the route returns a successful no-op response
- **AND** it does not apply a second inverse mutation.

#### Scenario: Expired undo returns structured error

- **GIVEN** an undo token past its ten-minute TTL
- **WHEN** the token is submitted
- **THEN** the response contains `ok: false`, `error: "undo_expired"`, and
  `expiredAt`.

### Requirement: Tool-call boundary SHALL guard URL and KV/API hygiene

The AI tool-call surface SHALL expose a defensive URL allow-list helper for
future URL-accepting tools, keep KV prefixes unique, and use a consistent route
envelope across confirm, undo, and audit-list responses.

#### Scenario: URL helper rejects private and disallowed hosts

- **GIVEN** `isAllowedToolUrl(url, allowedHosts)`
- **WHEN** the URL is `file:///etc/passwd`, `http://localhost:8787/debug`,
  `http://127.0.0.1:8787/debug`, or an unlisted host
- **THEN** the helper returns false.

#### Scenario: KV prefixes are unique

- **GIVEN** the documented tool-call KV prefix map
- **WHEN** prefixes for pending confirmations, undo records, undo status,
  audit records, and auto-approve records are inspected
- **THEN** every prefix is unique.

#### Scenario: Route envelopes are consistent

- **GIVEN** confirm-call, undo-call, and audit-list route responses
- **WHEN** they are inspected
- **THEN** they use the same top-level envelope convention with `ok` and either
  result data or structured error details.
