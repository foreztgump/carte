---
"@carte/core": patch
---

Add the PRO-638 taxonomy fallback so unknown allergen tags return a humanized label instead of `undefined`, preventing downstream DietaryFilter rendering crashes.
