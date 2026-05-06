# Spec

## Given/When/Then

### Scenario: PRD documents the interim MCP plan
- **Given** EmDash 0.9.0 does not expose a public custom MCP tool registration API
- **When** the PRO-424 documentation change is applied
- **Then** `PRD.md` explains that Carte v0.1 uses plugin routes at `/_emdash/api/plugins/<id>/<route>` plus a standalone MCP wrapper Worker
- **And** `PRD.md` points OQ#2 at the same interim plan instead of leaving the API as an unresolved verification task
- **And** the upstream Discussion #850 contains a comment noting Carte's interest in first-class custom MCP tool registration
