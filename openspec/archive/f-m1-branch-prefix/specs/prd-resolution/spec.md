## Given/When/Then

### Scenario: AGENTS.md documents the real Linear key for workflow strings

- **Given** the repo's Linear team key is `PRO`
- **When** a worker reads `AGENTS.md` for branch, commit, and `/work` conventions
- **Then** the documented examples use `PRO-XXX` instead of `CART-XXX`

### Scenario: CART remains only the project-name working assumption

- **Given** the project still uses `CART` as a planned project identifier
- **When** the Linear Integration section describes project context
- **Then** the `CART` note remains limited to the project field and is not used as the branch or commit prefix
