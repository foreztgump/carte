# Spec

## Given/When/Then

### Scenario: PRD and agent guidance use canonical capability names
- **Given** `PRD.md` and `AGENTS.md` previously referenced deprecated EmDash capability names
- **When** the capability naming resolution is applied
- **Then** every capability reference in those files uses canonical resource:verb names from `github.com/emdash-cms/emdash/blob/main/skills/creating-plugins/SKILL.md`
- **And** all five manifest examples in `PRD.md` show canonical capabilities only
- **And** a search for deprecated names across those files returns zero matches
