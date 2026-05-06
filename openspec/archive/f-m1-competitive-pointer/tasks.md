# f-m1-competitive-pointer — tasks

## T1. Replace PRD §"Competitive Analysis" table with pointer

**File:** `PRD.md` (section "Competitive Analysis", around line 941)

**Before:** A 7-row marketing-level table (WPCafe, FoodMaster, Orderable, GloriaFood, RestroFood, Five Star, Toast/Square) plus a "Carte's positioning" callout, followed by the "Out of scope for v0.1" subsection.

**After:** A 3-line pointer to `docs/competitive-analysis/{latepoint,orderable-pro,restrofood}.md` plus `adoptable-patterns.md` synthesis, a single sentence redirecting positioning context to PRD §"Problem Statement", and the preserved "Out of scope for v0.1" subsection.

**Acceptance:**

- `grep -c 'docs/competitive-analysis/' PRD.md` returns ≥4
- `grep -E '\| \*\*WPCafe\*\*' PRD.md` returns 0 lines
- `grep -c 'plugin sprawl\|chronic problems' PRD.md` returns ≥1 (Problem Statement intact)
- §"Out of scope for v0.1" subsection preserved verbatim
