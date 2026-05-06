## Given/When/Then

### Scenario: chronic WordPress restaurant problems are evidenced

Given the vendored LatePoint, Orderable Pro, and RestroFood sources
When `docs/competitive-analysis/avoid.md` is authored
Then at least four chronic problems from the PRD problem statement are backed by file:line citations from those sources.

### Scenario: implementation footguns are rejected explicitly

Given the vendored plugin sources contain concrete architectural and licensing traps
When the avoid document lists footguns
Then each footgun includes a file:line citation and a one-line "instead, we will…" remediation, including the RestroFood licensing bypass and Carte's server-side trial-enforcement plan.
