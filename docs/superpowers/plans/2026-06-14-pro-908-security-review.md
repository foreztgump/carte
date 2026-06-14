# PRO-908 Security Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish an evidence-backed security report for the five published Carte packages with no open criticals.

**Architecture:** Use an audit-report-first flow. `docs/security/PRO-908-security-review.md` is the single report interface; scan output, source citations, and confirmed doc corrections are supporting evidence. Product code changes are out of scope unless the audit confirms a blocking security finding.

**Tech Stack:** TypeScript, pnpm, Vitest, ESLint, EmDash 0.18 sandboxed/native plugin manifests, AgentShield, Cloudflare WAF Rulesets API documentation.

---

## File Structure

- Create `docs/security/PRO-908-security-review.md`: published report with scope, methodology, package×dimension matrix, findings table, evidence log, and no-open-criticals summary.
- Create `docs/security/evidence/agentshield-packages-high.md`: machine-readable or markdown AgentShield high-severity evidence for `packages/`.
- Modify `packages/core/README.md` only if the manifest drift is confirmed, keeping `packages/core/emdash-plugin.jsonc` as the source of truth.
- Modify `SECURITY.md` only if Tender/Stripe or WAF wording is confirmed stale, with a minimal correction.
- Modify `openspec/changes/pro-908-security-review/tasks.md` to mark completed tasks after implementation verification.
- Do not modify `@carte/ai` code or docs except the report's deferred-PII note.

## Quality Checklist Applied to Every Task

- [ ] Each function or document section does one thing.
- [ ] No magic values; literal paths, hosts, and commands are named or cited.
- [ ] Functions ≤40 lines, ≤3 parameters, ≤3 nesting levels for any code fix.
- [ ] External boundaries and scan failures are handled explicitly.
- [ ] Names reveal intent.
- [ ] No duplicated capability lists beyond cited evidence.
- [ ] YAGNI: no new hardening features unless a confirmed finding requires them.
- [ ] Law of Demeter: audit source files directly, do not infer through unrelated docs.
- [ ] File structure follows this plan.

## Task 1: Scaffold Report and Capture AgentShield Evidence

**Files:**

- Create: `docs/security/PRO-908-security-review.md`
- Create: `docs/security/evidence/agentshield-packages-high.md`
- Read: `.agentshield-allowlist.yaml`

- [ ] **Step 1: Create the report skeleton**

Use this initial structure:

```markdown
# PRO-908 Security Review

**Issue:** PRO-908
**Scope:** @carte/core, @carte/reservations, @carte/orders-backend, @carte/orders-admin, @carte/views
**Deferred:** @carte/ai PII-boundary review is deferred to the @carte/ai track.
**Summary:** Pending audit completion.

## Methodology

- AgentShield scans over packages, .factory, and .claude.
- Manual package review for capabilities, sandbox assumptions, GDPR, Tender/PCI, and WAF carve-out.
- Validation commands recorded in the evidence log.

## Findings

| ID  | Severity | Area | Evidence | Disposition |
| --- | -------- | ---- | -------- | ----------- |

## Package × Dimension Matrix

| Package               | Capability minimality | Sandbox boundary | GDPR    | Tender/PCI | WAF     |
| --------------------- | --------------------- | ---------------- | ------- | ---------- | ------- |
| @carte/core           | Pending               | Pending          | Pending | N/A        | Pending |
| @carte/reservations   | Pending               | Pending          | N/A     | N/A        | Pending |
| @carte/orders-backend | Pending               | Pending          | N/A     | Pending    | Pending |
| @carte/orders-admin   | Pending               | Pending          | N/A     | Pending    | Pending |
| @carte/views          | Pending               | N/A              | N/A     | Pending    | Pending |

## Evidence Log

| Command or file | Result |
| --------------- | ------ |
```

- [ ] **Step 2: Run AgentShield scans**

Run:

```bash
npx --yes ecc-agentshield scan -p packages/
npx --yes ecc-agentshield scan -p .factory/
npx --yes ecc-agentshield scan -p .claude/
npx --yes ecc-agentshield scan -p packages/ --min-severity high --format markdown > docs/security/evidence/agentshield-packages-high.md
```

Expected: each scan completes. Any high/critical finding is copied into the report's findings table.

- [ ] **Step 3: Reconcile allowlist**

Read `.agentshield-allowlist.yaml`. For each AgentShield finding, record either:

```markdown
Matched allowlist entry: <entry id or description>
```

or:

```markdown
Open finding: not allowlisted, requires disposition before completion.
```

## Task 2: Capability Minimality Audit

**Files:**

- Read: `packages/core/emdash-plugin.jsonc`
- Read: `packages/reservations/emdash-plugin.jsonc`
- Read: `packages/orders-backend/emdash-plugin.jsonc`
- Read: `packages/orders-admin/src/index.ts`
- Read/modify if confirmed: `packages/core/README.md`
- Update: `docs/security/PRO-908-security-review.md`

- [ ] **Step 1: Compare declared capabilities to usage**

Inspect the sandboxed manifests and native `definePlugin` capabilities. Record one matrix note per package:

```markdown
@carte/<package>: declared capabilities <list>; observed usage <list>; disposition <declared==used | finding>.
```

- [ ] **Step 2: Verify orders-backend allowedHosts**

Confirm `packages/orders-backend/emdash-plugin.jsonc` uses a non-wildcard `allowedHosts` list and justify each host in the report.

- [ ] **Step 3: Correct confirmed core README drift**

If `packages/core/README.md` still lists `media:read` while `packages/core/emdash-plugin.jsonc` does not, replace the capability sentence with:

```markdown
Execution model: **sandboxed** (Cloudflare Worker per invocation). Capabilities declared:
`content:read`, `content:write`. No outbound network, no email.
```

- [ ] **Step 4: Run focused manifest tests**

Run:

```bash
pnpm -r test -- --runInBand
```

If the runner rejects `--runInBand`, rerun:

```bash
pnpm -r test
```

Expected: manifest tests for core, reservations, and orders-backend pass.

## Task 3: Sandbox Boundary Audit

**Files:**

- Read: `docs/VERIFIED-PLATFORM-0.18-carte.md`
- Read: `packages/orders-backend/src/routes/checkout.ts`
- Read: `packages/orders-backend/src/routes/refund.ts`
- Read: `packages/reservations/src/capacity.ts`
- Update: `docs/security/PRO-908-security-review.md`

- [ ] **Step 1: Trace sandbox egress**

Record whether outbound access is limited to `ctx.http.fetch` and declared `allowedHosts`. If any other egress primitive appears in published package source, add a P0/P1 finding.

- [ ] **Step 2: Record runtime caveats**

Add report entries for:

```markdown
- Sandboxed packages rely on runtime-enforced capabilities and allowedHosts.
- @carte/orders-admin is native/in-process; capabilities are advisory.
- Cloudflare Free has no Dynamic Worker Loader isolation; this is disclosed in sandboxed package READMEs.
```

- [ ] **Step 3: Run sandbox budget audit**

Run:

```bash
pnpm audit:sandbox-budget
```

Expected: command exits 0. Record output summary in the evidence log.

## Task 4: GDPR Export and Erase Audit

**Files:**

- Read: `packages/core/src/gdpr.ts`
- Read: `packages/core/src/gdpr.test.ts`
- Update: `docs/security/PRO-908-security-review.md`

- [ ] **Step 1: Trace export scope**

Confirm export uses the normalized request email and does not return other guests' PII. Cite `gdpr.ts` and `gdpr.test.ts` lines in the report.

- [ ] **Step 2: Trace erase order**

Confirm audit entry creation happens before PII mutation, failed audit write aborts that item, and PII fields are replaced with `erased:<sha256(normalizedEmail)>`.

- [ ] **Step 3: Run core tests**

Run:

```bash
pnpm -F @carte/core test
```

Expected: core tests pass. If they fail, fix only a confirmed implementation bug or record the blocker.

## Task 5: Tender/PCI and WAF Audit

**Files:**

- Read: `packages/orders-backend/src/routes/checkout.ts`
- Read: `packages/orders-backend/src/routes/refund.ts`
- Read: `packages/orders-backend/src/events.ts`
- Read: `packages/views/src/safe-redirect.ts`
- Read: `packages/views/src/safe-json.ts`
- Read/modify if confirmed: `SECURITY.md`
- Update: `docs/security/PRO-908-security-review.md`

- [ ] **Step 1: Trace card-data boundary**

Confirm no PAN, CVC, or expiry values appear in inputs, storage, logs, or docs for the published payment flow. Record that Carte consumes Tender-hosted checkout URLs and Tender results only.

- [ ] **Step 2: Verify view boundary helpers**

Confirm `safe-redirect.ts` uses HTTPS and a fixed checkout host allowlist, and `safe-json.ts` escapes script-context data. Cite their tests.

- [ ] **Step 3: Correct confirmed SECURITY.md drift**

If `SECURITY.md` still claims `@carte/orders-backend` verifies Stripe webhook signatures directly, replace that bullet with Tender-boundary wording:

```markdown
- **Tender payment boundary.** Tender owns checkout and webhook verification.
  `@carte/orders-backend` consumes Tender SDK results and idempotent Tender
  transaction events; Carte never receives raw PAN/CVC and does not implement a
  direct Stripe webhook receiver in the published v0.9 package set.
```

- [ ] **Step 4: Document WAF Skip carve-out**

Use the previously researched Cloudflare citations. If no WAF config exists in the repo, record it as a gap and write the intended rule shape:

```markdown
Action: Skip
Scope: exact Tender webhook host/path/method once owned infrastructure confirms it
Ordering: before managed execute rules it must skip
Status: not implemented in this repository
```

If the gap needs tracking, create a Linear follow-up with label `repo:carte` and link it in the report.

## Task 6: Final Validation and OpenSpec Completion

**Files:**

- Modify: `openspec/changes/pro-908-security-review/tasks.md`
- Read/update: `docs/security/PRO-908-security-review.md`

- [ ] **Step 1: Finalize findings table**

Set the report summary to `No open criticals` only if every P0 is fixed or resolved. Every P1+ must have a disposition: fixed-in-change, linked follow-up, or accepted-risk rationale.

- [ ] **Step 2: Run full validators**

Run:

```bash
pnpm -r typecheck
pnpm -r lint
pnpm -r test
pnpm audit:sandbox-budget
./scripts/check-grep-gates.sh
```

Expected: all commands exit 0. If a command fails, fix the cause before proceeding.

- [ ] **Step 3: Mark OpenSpec tasks complete**

After evidence and validators pass, mark completed task checkboxes in:

```text
openspec/changes/pro-908-security-review/tasks.md
```

- [ ] **Step 4: Run review gate**

Dispatch `quality-review-droid` and the applicable auditors, then run AgentShield and OpenSpec verify in the workflow-defined order.

## Self-Review

- Spec coverage: Tasks 1-6 cover published report, no open criticals, capability minimality, sandbox/Tender/PCI, GDPR, and WAF requirements.
- Placeholder scan: no `TBD`, `TODO`, or unscoped "handle edge cases" steps remain.
- Type consistency: no new product APIs or types are introduced; all paths match the OpenSpec artifacts.
