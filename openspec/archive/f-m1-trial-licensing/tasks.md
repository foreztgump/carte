# Tasks

- [ ] Update `PRD.md` §"Trial & licensing" to document the locked server-side license-check flow, KV cache window, outage behavior, billing split, and license-server stack.
  - Acceptance: the section states `license.carteplugin.dev`, 24hr cache, graceful degrade on outage, Lemon Squeezy, and Worker + D1.
- [ ] Mark OQ#5 as `**RESOLVED**` in `PRD.md` with a pointer back to §"Trial & licensing".
  - Acceptance: Open Questions entry #5 no longer reads as a recommendation or open trade-off.
- [ ] Update Linear PRO-421 to reflect the completed doc decision and keep the milestone branch clean with a local commit.
  - Acceptance: PRO-421 moves out of In Progress and `git status --short` is empty after commit.
