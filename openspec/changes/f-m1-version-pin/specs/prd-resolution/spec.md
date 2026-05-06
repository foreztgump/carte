# Spec

## Given/When/Then

### Scenario: EmDash SDK version is pinned consistently
- **Given** Carte's mission research has locked the EmDash plugin SDK to `^0.9.0`
- **When** the version-pin update is applied
- **Then** `AGENTS.md` documents the locked EmDash SDK pin with its release date and the reason Carte avoids `emdash@1.0.0`
- **And** `openspec/config.yaml` mirrors the same `^0.9.0` stack pin
- **And** no "verify before lock" hedge remains in `openspec/config.yaml`
