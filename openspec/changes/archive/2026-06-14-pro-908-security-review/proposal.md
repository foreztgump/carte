# Proposal: PRO-908 — Security review across the 5 published packages

**Linear:** PRO-908 (R5-D1 · PRD WS-D1) · label `repo:carte` · priority medium · milestone **Release R5 hardening**
**Change:** `pro-908-security-review`
**Source PRD:** `PRD-production-release.md` §WS-D1 (D1. Security review)

## Why

Carte's five MIT packages publish to npm in R1–R3 ahead of Tender. Before the
publish hardens, the family needs a single auditable security pass that proves —
with evidence, not assertion — that the published trust contract holds:
capability manifests are minimal, the sandbox boundary assumptions are sound,
GDPR export/erase is correct, the Tender boundary keeps raw PAN/CVC out of Carte
(PCI scope minimized), and the Cloudflare WAF carve-out for Tender webhook
delivery is documented. The PRD acceptance gate is **a published security report
with no open criticals**.

## What changes

This is an **audit-and-report** change, not a feature change. The primary
deliverable is a security report committed to the repo. Source/doc edits happen
**only where the audit confirms a concrete finding**; this proposal does not
pre-commit to code fixes.

1. **Published security report** (`docs/security/PRO-908-security-review.md`):
   one report covering all five published packages, every audit dimension, each
   finding with severity, evidence path, and resolution/disposition.
2. **AgentShield scan of record:** run `npx ecc-agentshield scan` over
   `packages/`, `.factory/`, `.claude/`; capture output as report evidence;
   reconcile any new findings against `.agentshield-allowlist.yaml`.
3. **Capability-minimality audit** across the five manifests + native
   `definePlugin` capability arrays; confirm each declared capability is used and
   no used capability is undeclared.
4. **Doc-drift corrections (only if confirmed):** e.g. `packages/core/README.md`
   capability list vs. the manifest; `SECURITY.md` threat-model wording vs. the
   current Tender-delegated payment/webhook model. Corrected in place when the
   audit confirms the drift.
5. **Cloudflare WAF carve-out documentation/evidence** for Tender webhook
   delivery, recorded in the report (and `SECURITY.md` if a durable operator note
   is warranted), using the Rulesets-API `Skip` model with correct rule ordering.
6. **Findings register:** any P0/P1 not fixed in this change is filed as a
   tracked follow-up Linear issue and referenced in the report; the change does
   not archive with an unresolved critical.

## Scope

- **In:** `@carte/core`, `@carte/reservations`, `@carte/orders-backend`,
  `@carte/orders-admin`, `@carte/views`.
- **Audit dimensions:** capability minimality; sandbox-boundary assumptions
  (capabilities/allowedHosts enforcement, in-process native caveat, Cloudflare
  Free no-isolation caveat); GDPR export/erase correctness; Tender trust boundary
  / PCI scope (no raw PAN/CVC into Carte); Cloudflare WAF carve-out for the Tender
  webhook; AgentShield + existing repo checks as evidence.
- **In (conditional):** in-place corrections to confirmed stale docs and confirmed
  capability drift; follow-up issue creation for confirmed code-level criticals.

## Non-goals

- **`@carte/ai`** is excluded except to explicitly record that its PII-boundary
  review is **deferred to the `@carte/ai` track** (per PRD WS-D1).
- **No re-architecture.** The reservations cross-isolate capacity _residual risk_
  is reviewed and documented as a known limitation; redesigning it is out of scope
  (owned by the capacity track).
- **No new security features** (no new rate limiters, auth schemes, or crypto).
- **No live Cloudflare account changes** or Terraform apply; WAF work is
  documentation + evidence of the intended ruleset, not an infra deploy.
- **No registry publish**; this change can run fully offline.
- **No invented findings.** The report records only what the audit actually
  observes against the listed evidence paths.

## Rollback plan

- The report and any follow-up issue references are **additive docs** — reverting
  the change is `git revert` of the doc commits with no runtime impact.
- Doc-drift corrections (README/SECURITY.md/manifests) are isolated, reviewable
  edits; each can be reverted independently without affecting plugin behavior.
- If a confirmed finding requires a code fix that lands in this change, that fix
  ships behind the standard review gate (local review + `pr-agent-runner`, 0 P0/P1)
  and is independently revertible; capability-manifest edits are validated by
  `emdash-plugin validate`/`bundle` in CI before merge, so a bad edit fails closed
  at the packaging gate rather than at runtime.
