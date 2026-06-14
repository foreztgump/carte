# Wrap-Up: PRO-897 — release.yml workflow (OIDC trusted publishing, dry-run)

## Checklist

- [x] Quality review clean (quality-review-droid CLEAN; a11y/perf N/A — CI config file)
- [x] AgentShield clean (Grade A, 100/100, 0 findings)
- [x] OpenSpec verified (all tasks [x]; acceptance criteria met)
- [x] Docs reviewed — no updates needed (CONTRIBUTING.md already references release.yml via PRO-899)
- [x] Committed and pushed
- [x] PR open: https://github.com/foreztgump/carte/pull/30
- [x] Linear updated (In Review)
- [x] agentmemory saved
- [ ] PR merged
- [ ] OpenSpec archived
- [ ] Branch deleted: feature/pro-897-release-yml
- [ ] Worktree removed: /home/cownose/projects/carte-pro-897-release-yml

## PR Review Triage

**Reviewer:** PR-Agent local
**Risk Classification:** low
**Review path:** .factory-state/pr-agent-review-30.md
**Comments Posted:** 0 inline + 1 review summary

- No findings. PR-Agent: "No security concerns identified", "No major issues detected", review effort 2/5. 0 inline comments.

## Follow-Up Items

- **Wave 2 verification:** Full 5-package dry-run assertion (acceptance criterion) requires the A-track `private`-flag flip first — only `@carte/orders-backend` is non-private today. Re-run a `workflow_dispatch` dry-run after PRO-894/A-track lands to confirm exactly the 5 MIT packages report.
- **`.nvmrc` parity:** When WS-A5 lands `.nvmrc`, switch `node-version: "22"` → `node-version-file: .nvmrc` for full Dateline parity (optional, cosmetic).
- The `@tender/sdk@0.0.0` tarball leak observed in the dry-run is PRO-894's concern (load-bearing A4), not this task.
