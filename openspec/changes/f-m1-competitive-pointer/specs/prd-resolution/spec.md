# prd-resolution — competitive-analysis pointer

## Scenario: PRD §"Competitive Analysis" replaced with docs pointer

**Given** `PRD.md` §"Competitive Analysis" contains a 7-row marketing-level table comparing Carte to WPCafe, FoodMaster, Orderable, GloriaFood, RestroFood, Five Star Restaurant Reservations, and Toast/Square POS,

**When** the worker replaces that section with a 3-line pointer to the evidence-grounded teardowns under `docs/competitive-analysis/` plus the synthesis doc,

**Then** `grep -c 'docs/competitive-analysis/' PRD.md` returns ≥4 (one reference per teardown — latepoint, orderable-pro, restrofood — plus the adoptable-patterns synthesis).

## Scenario: PRD §"Problem Statement" six-chronic-problems narrative preserved

**Given** PRD §"Problem Statement" enumerates six chronic WordPress restaurant problems (plugin sprawl, update anxiety, AI bolted on or absent, performance during peak hours, mobile checkout afterthought, broken schema.org),

**When** the worker edits §"Competitive Analysis" only,

**Then** `grep -c 'plugin sprawl\|chronic problems' PRD.md` returns ≥1 and the six numbered problems remain in §"Problem Statement" unmodified.

## Scenario: marketing table fully removed

**Given** the previous §"Competitive Analysis" table contained a row beginning with `| **WPCafe** |`,

**When** the worker applies the pointer rewrite,

**Then** `grep -E '\| \*\*WPCafe\*\*' PRD.md` returns 0 matches.
