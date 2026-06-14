# Tasks: PRO-908 — Security review across the 5 published packages

Primarily audit/report + evidence work. Source/doc edits happen **only on
confirmed findings**. Each task ≤ 2 hours. One PR through `pr-agent-runner`
(0 P0/P1 before merge). Update Linear PRO-908 on start/complete; `repo:carte`
label on any follow-up issue. Do not invent findings — record only what evidence
substantiates.

## T0 — Scaffold the report + run the scans of record

- [x] 0.1 Create `docs/security/PRO-908-security-review.md` with a fixed
      package×dimension matrix (5 packages × 5 dimensions), a findings table
      (id, severity P0–P3, evidence `file:line`/command, disposition), a summary
      line reserved for "no open criticals", and a `@carte/ai` deferred-PII note.
- [x] 0.2 Run and capture as evidence: `npx --yes ecc-agentshield scan -p packages/`,
      `-p .factory/`, `-p .claude/`, plus `-p packages/ --min-severity high`.
      Save the high-severity run as machine-readable evidence (e.g. `--format
markdown`/`json`) under `docs/security/evidence/` or inline in the report.
- [x] 0.3 Reconcile every AgentShield finding against `.agentshield-allowlist.yaml`;
      record matched/unmatched in the report.
- **Acceptance:** report file exists with all five packages and five dimensions
  stubbed; AgentShield run three+ scopes with output captured; every finding is
  matched to an allowlist entry or flagged for triage.
- **Check:** `ls docs/security/PRO-908-security-review.md`;
  `npx --yes ecc-agentshield scan -p packages/`
- **Error handling:** if AgentShield emits a new high/critical not in the
  allowlist, record it as an open finding (do not silently allowlist); a new
  critical blocks completion until resolved/tracked.

## T1 — Capability-minimality audit (5 packages)

- [x] 1.1 For each sandboxed manifest (`packages/{core,reservations,orders-backend}/emdash-plugin.jsonc`)
      and the native `packages/orders-admin/src/index.ts` `definePlugin`
      capabilities, compare declared vs. used (routes/hooks/manifest tests).
      Confirm `@carte/views` is not a plugin (no manifest/capabilities) and record
      that explicitly.
- [x] 1.2 Audit `@carte/orders-backend` `allowedHosts` (`license.carteplugin.dev`):
      non-empty, no wildcards, every host justified; describe Tender SDK traffic
      via `ctx.http.fetch` against the declared allowlist.
- [x] 1.3 Capability-doc drift check: compare `packages/core/README.md`
      capability list to the manifest (candidate: README:16 lists `media:read`
      not in the manifest/`EXPECTED_CAPABILITIES`). If confirmed, correct the
      README in place so it matches the manifest.
- **Acceptance:** report's capability section states declared==used per package;
  `allowedHosts` justified; any confirmed README drift corrected so docs match the
  manifest of record.
- **Check:** `pnpm -r test` (manifest tests green:
  `packages/core/src/__tests__/manifest.test.ts`,
  `packages/{reservations,orders-backend}/src/manifest.test.ts`)
- **Code-quality constraints (if README/manifest edited):** HR4 (capabilities
  minimal + declared), no magic values, names reveal intent; keep the manifest the
  single source of truth (no duplicated capability lists drifting).
- **Error handling:** if a used-but-undeclared capability is found, record as P0/P1
  and either fix the manifest (validated by `emdash-plugin validate`) or file a
  follow-up; never leave an undeclared used capability unrecorded.

## T2 — Sandbox-boundary assumptions audit

- [x] 2.1 Verify sandboxed egress uses only `ctx.http.fetch` constrained to
      `allowedHosts`; trace `orders-backend` checkout/refund subrequest counts
      against the 10-subrequest Cloudflare cap (checkout worst-case ~6/10 per
      header comment; refund 2/10). Cite `docs/VERIFIED-PLATFORM-0.18-carte.md`
      §6/§7.
- [x] 2.2 Document native in-process / advisory-capability caveat
      (`@carte/orders-admin`) and the Cloudflare Free no-isolation caveat;
      cross-reference per-plugin READMEs and SECURITY.md "Known limitations".
- [x] 2.3 Review reservations cross-isolate capacity **residual risk** as a known
      limitation only: confirm fail-loud mitigation
      (`packages/reservations/src/capacity.ts` `CapacitySurveyLimitExceededError`,
      module-scoped per-slot queue). Record; do **not** redesign.
- **Acceptance:** report's sandbox section states the egress constraint,
  subrequest counts with the cap, both caveats, and the documented capacity
  residual risk with its mitigation.
- **Check:** `pnpm audit:sandbox-budget`
- **Error handling:** if a handler is found to exceed the subrequest cap or use a
  non-`ctx.http` egress, record as P0/P1 with a follow-up; do not "fit the
  ceiling" by trimming the audit.

## T3 — GDPR export/erase correctness audit

- [x] 3.1 Read `packages/core/src/gdpr.ts`: confirm export is scoped to the
      normalized requesting email; confirm erase writes the audit entry **before**
      the PII update (HR9 audit-then-erase), aborts an item on audit-write
      failure, and writes the deterministic `erased:<sha256(normalizedEmail)>`
      placeholder over `PII_FIELDS` while preserving non-PII fields.
- [x] 3.2 Cite `packages/core/src/gdpr.test.ts` as evidence (run it); record the
      retention-preservation behavior (revenue records kept, PII replaced).
- **Acceptance:** report's GDPR section asserts scoped export + audit-then-erase +
  deterministic placeholder, each with a `file:line`/test citation.
- **Check:** `pnpm -F @carte/core test` (or `pnpm -r test`)
- **Error handling:** if erase can mutate PII without a preceding successful audit
  write, record as P0 (HR9 violation) and block completion until fixed/tracked.

## T4 — Tender trust boundary / PCI scope audit

- [x] 4.1 Trace `packages/orders-backend/src/routes/checkout.ts`, `.../refund.ts`,
      `.../events.ts`: confirm inputs/persisted values/logs carry no PAN/CVC/expiry
      — only tokens/ids and the Tender-hosted checkout URL. Confirm card data stays
      in Stripe Checkout via Tender (Carte is a consumer).
- [x] 4.2 Review `packages/views/src/safe-redirect.ts` (Stripe-only host
      allowlist, https-only, no wildcards) and `safe-json.ts` (script-context
      escaping) as boundary controls; cite their tests.
- [x] 4.3 Stale-doc check: `SECURITY.md` threat model describes Stripe webhook
      signature verification inside `@carte/orders-backend`; current code delegates
      to Tender (`@tender/sdk`, `applyTenderTransaction`). If the divergence is
      confirmed, correct the SECURITY.md wording in place (minimal correction;
      broader re-scope only if the owner requests it — see design Open Questions).
- **Acceptance:** report asserts "Carte never receives raw PAN/CVC; PCI scope
  minimized" with citations; any confirmed SECURITY.md drift corrected.
- **Check:** `pnpm -F @carte/views test`; `pnpm -r typecheck`
- **Code-quality constraints (if SECURITY.md edited):** comments/wording explain
  WHY; no magic values; HR7 (no card data) reflected accurately; no editorial
  rewrite beyond the confirmed factual correction.
- **Error handling:** if any code path is found to read/store/log card data,
  record as P0 (HR7) and block completion.

## T5 — Cloudflare WAF carve-out documentation/evidence

- [x] 5.1 Research current Cloudflare Rulesets-API WAF semantics (`Skip` action,
      custom-rule ordering, managed-rules exception precedence) via Context7/Tavily
      — not training recall. Record the citation.
- [x] 5.2 Confirm whether any WAF carve-out config exists in-repo (read-only audit
      found none). If absent, document it as a gap and specify the intended ruleset
      for Tender webhook delivery: exact path/method/host scope, `Skip` action,
      ordered before the managed execute rules it must skip.
- [x] 5.3 Add a durable operator note to `SECURITY.md` only if warranted; file a
      follow-up Linear issue (`repo:carte`) for the actual ruleset implementation
      and reference it in the report.
- **Acceptance:** report's WAF section uses the `Skip` model + correct ordering +
  named scope; records absent implementation as a gap with intended definition and
  a follow-up reference (no asserted deployed state).
- **Check:** report WAF section cites current Cloudflare docs; follow-up issue
  linked.
- **Error handling:** do not assert a deployed carve-out; if ownership is unclear
  (in-repo vs external infra), record the Open Question and the documented intent
  rather than guessing.

## T6 — Consolidate, gate, and finalize the report

- [x] 6.1 Fill the findings table: every finding has severity, evidence path, and
      disposition (fixed-in-change / follow-up-issue / accepted-risk). Set the
      summary to "no open criticals" only when true.
- [x] 6.2 Run the full evidence suite and attach results: `pnpm -r typecheck`,
      `pnpm -r lint`, `pnpm -r test`, `pnpm audit:sandbox-budget`,
      `./scripts/check-grep-gates.sh`, and the three AgentShield scopes.
- [x] 6.3 Update docs touched by confirmed findings only (core README capability
      list, SECURITY.md wording) and ensure CHANGELOG/`.changeset` entry if any
      package-facing doc changed; confirm `@carte/ai` appears only as a deferred
      note.
- [x] 6.4 Request local code review; fix Critical/Important before commit; run
      `pr-agent-runner` (0 P0/P1) before merge.
- **Acceptance:** report complete across all five dimensions and packages; no open
  P0; every P1+ resolved or tracked with a referenced follow-up; all checks green;
  review gate passed.
- **Check:** `pnpm -r typecheck && pnpm -r lint && pnpm -r test && pnpm audit:sandbox-budget && ./scripts/check-grep-gates.sh`
- **Code-quality constraints:** AAA in any touched test; no magic values; DRY
  (manifest stays single source of truth); YAGNI (no new security features); edits
  limited to confirmed findings.
- **Error handling:** if any check fails or a critical remains open, the change is
  not complete — keep the task in progress and do not archive.
