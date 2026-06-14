# Wrap-Up: PRO-898 — Build scripts → dist/ for @carte/orders-admin + @carte/views

## Checklist

- [x] Quality fan-out clean (quality-review-droid: CLEAN; a11y/perf N/A — build-config only)
- [x] AgentShield clean (Grade A, 0 findings)
- [x] OpenSpec verified (`openspec validate pro-898-build-dist --strict` → valid)
- [x] Docs updated (orders-admin + views READMEs, CHANGELOG)
- [x] Committed and pushed
- [x] PR open: https://github.com/foreztgump/carte/pull/27
- [x] Linear updated (In Review, PR linked)
- [x] agentmemory saved
- [ ] PR merged
- [ ] OpenSpec archived
- [ ] Branch deleted: feature/pro-898-build-dist
- [ ] Worktree removed: /home/cownose/projects/carte-pro-898-build-dist

## PR Review Triage

**Reviewer:** PR-Agent local
**Risk Classification:** low
**Review path:** .factory-state/pr-agent-review-27.md
**Comments Posted:** 0 (top-level review guide only; 0 inline)

- No findings. PR-Agent: "No security concerns identified", "No major issues detected", review effort 2/5.

## Verification Summary

- `pnpm -F @carte/orders-admin build` + `pnpm -F @carte/views build` → dist/ produced; clean rebuild verified.
- Exports resolution script: PASS (every subpath resolves under dist/, none under src/).
- Runtime imports of both dist entries succeed (orders-admin plugin instantiates; views exports 16 keys).
- orders-admin 26 tests pass; views 51 tests pass.
- typecheck + astro check clean; eslint + prettier clean.

## Follow-Up Items

- Whole-workspace `pnpm -r build` has PRE-EXISTING unrelated breakage in `../tender/packages/sdk`
  (references `@tender/core@workspace:*` not present in the tender workspace) and `docs-site`
  (missing node_modules). Both affect the main checkout too and are out of scope for PRO-898.
  The 5 carte packages build cleanly. A separate issue should track restoring the tender sibling
  workspace if full `pnpm -r build` parity is required for R1.
- When the e2e views fixture or any consumer imports `@carte/views/...`, `pnpm -F @carte/views build`
  must run first (exports now point at dist/). Documented in views README.
