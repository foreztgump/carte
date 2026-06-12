# Spec delta: platform-verification

## ADDED Requirements

### Requirement: Empirical platform facts gate conversion work

The mission SHALL produce `docs/VERIFIED-PLATFORM-0.18-carte.md` recording empirically verified facts against installed `emdash@^0.18` in a local harness, before M1–M4 work relies on them: sandboxed load path under both runners, manifest schema acceptance (incl. storage indexes), hook names/signatures, route mount + auth, Block Kit admin schema, native react-admin mount shape, and measured runtime limits per runner.

#### Scenario: Every claim has evidence

- **WHEN** a platform fact is recorded in the verification doc
- **THEN** it carries provenance: a harness test, command output, or doc citation — never training-data assumption

#### Scenario: Unverifiable surface is rejected, not assumed

- **WHEN** a platform primitive cannot be demonstrated in the harness (e.g. post-response `waitUntil` in sandboxed handlers)
- **THEN** dependent code completes work in-request or the design is reworked — the primitive is not used on faith

### Requirement: Budget tooling reflects measured per-runner limits

`scripts/sandbox-cost-table.json` SHALL declare limits per runner (Cloudflare: CPU/subrequest/wall caps; workerd: wall-clock only) sourced from M0 measurements. `scripts/audit-sandbox-budget.ts` SHALL read caps from the cost table and mark checks blocking for the Cloudflare runner and advisory for workerd.

#### Scenario: No invented caps

- **WHEN** the audit script reports a margin
- **THEN** the cap value originates from the cost table's measured per-runner entry, not a hardcoded literal
