# Spec

## Given/When/Then

- **Given** `PRD.md` describes EmDash architecture constraints for sandboxed plugins,
  **when** the sandbox quota update is applied,
  **then** the document states the full locked runtime envelope as 50ms CPU, 10 subrequests, 30s wall time, and ~128MB memory, citing `github.com/emdash-cms/emdash/blob/main/skills/creating-plugins/SKILL.md`.

- **Given** Carte may be deployed on Cloudflare Free,
  **when** an operator reads the PRD security guidance or `AGENTS.md`,
  **then** both documents state that Cloudflare Free cannot host sandboxed plugins because Dynamic Workers are unavailable (`emdash` Issue #149), and that the install flow must surface the loss of isolation.

- **Given** stale hedge language creates ambiguity,
  **when** verification is run after the edit,
  **then** the touched sections no longer contain "verify before lock" or "verify with maintainers" wording.
