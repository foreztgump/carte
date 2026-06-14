# Spec delta: maintenance-cleanup

## ADDED Requirements

### Requirement: Single React resolution in the workspace (PRO-764)

The pnpm workspace SHALL resolve exactly one copy of `react`/`react-dom` (pins aligned + root `pnpm.overrides`; `resolve.dedupe` in React-importing vitest configs). The two `@carte/ai` tests quarantined under `TODO(PRO-CARTE-AI-REACT19)` SHALL be re-enabled and pass.

#### Scenario: Quarantined tests green

- **WHEN** the @carte/ai test suite runs after dedupe
- **THEN** chat-panel and inline-actions tests run un-skipped and pass with no `useState` null-dispatcher error

### Requirement: SSRF helper covers IPv6 (PRO-769)

`isLocalOrPrivateHost` in `packages/ai/src/tool-call.ts` SHALL reject IPv6 loopback (`::1`), IPv4-mapped (`::ffff:` private/loopback), unique-local (`fc00::/7`), and link-local (`fe80::/10`) hosts, with tests for each class.

#### Scenario: IPv6 loopback blocked

- **WHEN** a tool call targets `http://[::1]:8080/`
- **THEN** the SSRF guard rejects it identically to `127.0.0.1`

### Requirement: pr-agent routing pins stay in sync (PRO-770)

The mission/project AGENTS.md pr-agent routing section SHALL contain the full required env-var set from `~/.factory/skills/pr-agent-runner/SKILL.md` (the authoritative block), eliminating the missing-variable failures seen in the PR #16 review.

#### Scenario: Worker starts clean

- **WHEN** a pr-agent worker is spawned using only the pinned AGENTS.md env block
- **THEN** it runs without missing-env failures

### Requirement: Core collection schema surface resolved (PRO-496)

The deferred core collection schema surface from the M3 sweep SHALL be resolved per PRO-496's scope, with the outcome reflected in the core plugin's manifest `storage` declarations (post-WS2 single trust contract).

#### Scenario: Schema surface documented and enforced

- **WHEN** the core plugin declares its collections in `emdash-plugin.jsonc`
- **THEN** the previously deferred schema decisions are explicit (fields, indexes) and validated by `emdash-plugin validate`
