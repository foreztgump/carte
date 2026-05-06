# Competitive Analysis Spec

## Requirement: Adoptable pattern synthesis exists

### Scenario: MUST-ADOPT reservation availability pattern is captured
- **Given** the LatePoint, Orderable Pro, and RestroFood teardowns identify read-time availability behavior
- **When** Carte authors `docs/competitive-analysis/adoptable-patterns.md`
- **Then** the document includes a MUST-ADOPT pattern mapping those findings to Carte reservation/order package targets with source citations and a target Linear issue ID.

### Scenario: Modifier complexity recommendation is preserved
- **Given** Orderable Pro shows a single-tier addon structure with fee-bearing options
- **When** the synthesis document is authored
- **Then** it records a MUST-ADOPT pattern recommending single-tier modifier groups for Carte v0.1 and links that choice to the future Linear reconciliation step.

### Scenario: Explicit rejections are documented
- **Given** the WP plugins depend on ambient global/transient state and slot persistence assumptions
- **When** the synthesis is complete
- **Then** `docs/competitive-analysis/adoptable-patterns.md` includes EXPLICITLY-REJECT entries describing the rejected pattern, the evidence citation, and the Carte-native alternative.
