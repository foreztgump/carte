# Design: PRO-908 security review

## Context

PRD WS-D1 requires a security pass over the five published packages whose
acceptance gate is "a published security report with no open criticals." The
audit dimensions are fixed (capability minimality, sandbox boundary, GDPR
export/erase, Tender/PCI boundary, Cloudflare WAF carve-out). `@carte/ai` is out
of scope except for a deferred-PII note. The deliverable is primarily a report
plus evidence; code/doc edits happen only where the audit confirms a finding.

## Approach: audit-report-first (chosen)

Treat the security report as the single deep module. The report is the stable,
simple interface ("read this one file to know the security posture of the
published family"); behind it sits the complex, per-dimension audit work
(reading manifests and routes, running AgentShield and the repo checks, tracing
the Tender boundary, researching the Cloudflare WAF model). Source/doc changes
are _outputs_ of the audit, gated on confirmed findings, not the primary unit of
work.

**Why this is the deep module.** Callers (release manager, future auditors,
PR-Agent) need one answer: "is the published family safe to ship, and what's the
evidence?" They should not have to reassemble that from scattered diffs across
five packages. The report encapsulates the audit methodology, the
evidence-to-finding mapping, and the disposition of every finding behind a flat
table-of-contents interface.

### Design it twice — alternative considered: fix-first, report-as-byproduct

The alternative is to walk the code, fix issues as found, and let the PR diffs
plus a thin summary stand as the "report."

| Dimension                 | Audit-report-first (chosen)                                            | Fix-first (rejected)                                                              |
| ------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Acceptance fit            | Direct — PRD asks for a _published report_; the report is the artifact | Indirect — diffs are not a report; summary risks being assertion without evidence |
| Evidence integrity        | Every claim carries a `file:line`/command path; reproducible           | Evidence scattered across commits; hard to audit later                            |
| Scope control             | Findings gate edits → minimal, justified changes (YAGNI)               | Tempts drive-by refactors and speculative "hardening" beyond the task             |
| Risk of invented findings | Low — report records only observed evidence                            | Higher — fixing-as-you-go blurs "confirmed" vs "suspected"                        |
| Reviewability             | One coherent document + isolated, revertible edits                     | Many entangled edits; rollback is messy                                           |

Audit-report-first wins on acceptance fit, evidence integrity, and scope
control. It also matches the existing repo pattern (`docs/VERIFIED-PLATFORM-0.18-carte.md`
is an evidence-per-claim document; this report mirrors that shape).

## Information hiding

- **Report module** (`docs/security/PRO-908-security-review.md`) hides the audit
  _methodology_ and the evidence-gathering mechanics behind a fixed
  package×dimension matrix. Consumers read conclusions + evidence pointers, not
  raw scan dumps.
- **AgentShield invocation** hides scanner specifics; the report records only the
  command, the summarized result, and the allowlist reconciliation — not the
  tool's internals.
- **WAF carve-out section** hides Cloudflare Rulesets-API detail behind a stated
  intent (path/method/host scope + `Skip` + ordering rule). Operators get the
  decision; the API mechanics are referenced, not inlined.
- **Doc-drift corrections** are localized: each confirmed drift (e.g. core README
  capability list) is fixed at its source so the manifest stays the single source
  of truth and the doc stops leaking a stale contract.

## Dependency direction

High-level → low-level, depending on stable abstractions:

```
PRD WS-D1 acceptance
      │
      ▼
docs/security/PRO-908-security-review.md   (high-level: the published report)
      │  cites (read-only)            │  triggers (only on confirmed finding)
      ▼                               ▼
evidence sources                 in-place corrections
 - emdash-plugin.jsonc × N        - core README capability list
 - src routes / hooks / gdpr.ts   - SECURITY.md threat-model wording
 - AgentShield scan output        - manifest/allowlist (if confirmed)
 - repo checks (typecheck/lint/   - follow-up Linear issue refs
   test/audit:sandbox-budget)
 - Cloudflare Rulesets-API docs (researched, not training-recalled)
```

The report depends on evidence sources; evidence sources do not depend on the
report. Corrections depend on confirmed findings, never the reverse. No new
abstraction or module is introduced in product code.

## Evidence paths (read-only audit anchors)

These are the anchors the audit reads; they are inputs, not guaranteed findings.

- **Capability minimality:**
  `packages/core/emdash-plugin.jsonc` (`["content:read","content:write"]`),
  `packages/reservations/emdash-plugin.jsonc` (`+ email:send`),
  `packages/orders-backend/emdash-plugin.jsonc`
  (`+ network:request`, `allowedHosts:["license.carteplugin.dev"]` after the
  audit removes the unused `email:send` declaration),
  `packages/orders-admin/src/index.ts` (`definePlugin` capabilities),
  manifest tests `packages/core/src/__tests__/manifest.test.ts`,
  `packages/reservations/src/manifest.test.ts`,
  `packages/orders-backend/src/manifest.test.ts`.
  Known candidate drift: `packages/core/README.md:16` lists `media:read` while the
  manifest and its test (`EXPECTED_CAPABILITIES`) do not.
- **Sandbox boundary:** `docs/VERIFIED-PLATFORM-0.18-carte.md` §6 (per-runner
  limits), §7 (no post-response primitive), AGENTS.md EmDash constraints,
  per-plugin READMEs (Cloudflare Free no-isolation note).
- **GDPR export/erase:** `packages/core/src/gdpr.ts`,
  `packages/core/src/gdpr.test.ts`.
- **Tender/PCI boundary:** `packages/orders-backend/src/routes/checkout.ts`,
  `.../refund.ts`, `.../events.ts`, `packages/orders-backend/src/stale-stripe-warning.ts`,
  `packages/views/src/safe-redirect.ts` (Stripe-only checkout-redirect allowlist),
  `packages/views/src/safe-json.ts`.
- **WAF carve-out:** no in-repo config found in the read-only audit → expected to
  be a documented gap + intended ruleset; Cloudflare Rulesets-API `Skip` semantics
  to be cited from current Cloudflare docs (research, not recall).
- **Stale-doc candidates:** `SECURITY.md` threat model still describes Stripe
  webhook signature verification inside `@carte/orders-backend`, while the code
  now delegates payment/webhook handling to Tender (`@tender/sdk`,
  `applyTenderTransaction` seam) — confirm and correct only if the audit verifies
  the divergence.

## Validation commands

Run from the worktree root; capture output as report evidence.

- `npx --yes ecc-agentshield scan -p packages/`
- `npx --yes ecc-agentshield scan -p .factory/`
- `npx --yes ecc-agentshield scan -p .claude/`
- `npx --yes ecc-agentshield scan -p packages/ --min-severity high` (focused gate;
  formats `json`/`markdown`/`sarif` available for attaching machine-readable
  evidence)
- `pnpm -r typecheck`
- `pnpm -r lint`
- `pnpm -r test` (exercises `gdpr.test.ts`, `manifest.test.ts`, views safe-\*
  tests)
- `pnpm audit:sandbox-budget` (subrequest/budget evidence for sandboxed handlers)
- `./scripts/check-grep-gates.sh` (obsolete-pattern gate, included for a clean bill)

## Risks / Mitigations

- **Invented or speculative findings** → Mitigation: the report records only what
  an evidence path or command output substantiates; every finding cites
  `file:line` or a command. No finding without evidence.
- **Scope creep into re-architecture** (e.g. "fix" the reservations cross-isolate
  capacity residual risk) → Mitigation: that residual risk is _documented as a
  known limitation_ with its existing fail-loud mitigation
  (`packages/reservations/src/capacity.ts` `CapacitySurveyLimitExceededError`);
  redesign is explicitly out of scope and stays on the capacity track.
- **WAF claim without infra** → Mitigation: if no carve-out exists in-repo, record
  it as a gap with the intended Rulesets-API definition and a follow-up issue;
  never assert a deployed state.
- **Capability/doc edits breaking packaging** → Mitigation: any manifest edit is
  validated by `emdash-plugin validate`/`bundle` in CI (fail-closed at the
  packaging gate) and by the per-package manifest test before merge.
- **Stale-doc correction overreach** → Mitigation: correct wording only where the
  audit confirms a factual divergence from current code; otherwise record as a
  note. No editorial rewrites.
- **Tender SDK real network behavior unverified by tests** (tests mock the SDK) →
  Mitigation: record as an audit observation with the allowedHosts/`ctx.http`
  boundary reasoning; flag live verification as a follow-up rather than asserting
  runtime-verified egress.
- **AgentShield surfaces a new high/critical** → Mitigation: treat as a finding —
  resolve, or allowlist with rationale in `.agentshield-allowlist.yaml`, before
  the report can claim "no open criticals."

## Migration plan

1. Land the report and any confirmed in-place corrections behind the standard
   review gate (local review + `pr-agent-runner`, 0 P0/P1).
2. File follow-up Linear issues for any P1+ not fixed in-change; reference them in
   the report. `repo:carte` label on every issue.
3. Archive the OpenSpec change only after the report asserts no open criticals and
   all dimensions are addressed.
4. Rollback: `git revert` the doc/correction commits — additive, no runtime
   coupling.

## Open questions

- **WAF carve-out ownership:** is the Cloudflare ruleset owned in this repo
  (Terraform/Rulesets API config) or by an external infra repo? If external, this
  change documents intent + cross-references; if in-repo, a follow-up implements
  it. Confirm with the release owner before finalizing the WAF section.
- **SECURITY.md scope:** SECURITY.md still lists six plugins and a Stripe-webhook
  threat model. Confirm whether to (a) correct only the now-inaccurate Stripe
  webhook wording, or (b) also re-scope the doc to the five published packages +
  Tender boundary. Default to the minimal correction unless the owner asks for the
  broader re-scope.
- **Follow-up vs. fix-in-change threshold:** for a confirmed P1, default is
  fix-in-change if it is a localized doc/manifest edit; defer to a follow-up issue
  if it requires code redesign. Confirm the threshold with the reviewer if a
  borderline P1 appears.
