# Tasks

- [ ] Update `PRD.md` §"EmDash Architecture Constraints" to state the locked sandbox caps as 50ms CPU, 10 subrequests, 30s wall time, and ~128MB memory, citing the EmDash SKILL.md source of truth.
  - Acceptance: the section contains the full quota string and no "verify before lock" / "verify with maintainers" hedge in that section.
- [ ] Update `PRD.md` §"Security Considerations" to state Cloudflare Free cannot host sandboxed plugins and that install flow must surface the loss of isolation, citing `emdash` Issue #149.
  - Acceptance: the free-plan behavior is explicit and aligned with validation assertion `A1.sandbox.freePlan`.
- [ ] Update `AGENTS.md` §"EmDash Plugin Constraints" to match the locked runtime caps and the Cloudflare Free plan constraint.
  - Acceptance: AGENTS wording matches the PRD decision and removes stale "verify before lock" language.
- [ ] Verify by grepping for sandbox/free-plan wording and commit the milestone-branch changes for PRO-427.
  - Acceptance: verification commands show updated quota text and no forbidden hedge in the touched sections.
