# Design

This feature is a documentation-only application of already-locked mission decisions, so the simplest design is a surgical rewrite of `PRD.md`'s `## Open Questions` section plus corresponding Linear status updates. The key architectural note is OQ#11: it must point at `docs/competitive-analysis/orderable-pro.md` because the single-tier modifier ceiling is justified by Orderable's flat field-group model rather than by a new Carte abstraction.
