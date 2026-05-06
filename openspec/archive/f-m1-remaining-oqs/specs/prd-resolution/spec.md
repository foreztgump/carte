# Spec

## Given/When/Then

### Scenario: Every remaining Milestone 1 open question is explicitly closed

- **Given** `PRD.md` contains the remaining open questions for Milestone 1
- **When** the remaining OQ resolution feature is applied
- **Then** OQ#3, #4, #6, #7, #8, #9, #10, #11, and #12 each begin with `**RESOLVED**` or `**DEFERRED to v0.2/v0.3**`
- **And** each entry includes a 1–3 sentence resolution or deferral rationale plus a pointer to the locking section, issue, or target version
- **And** OQ#11 explicitly cites `docs/competitive-analysis/orderable-pro.md` as the basis for the v0.1 single-tier modifier ceiling
- **And** the related Linear issues reflect the same resolved vs deferred split
