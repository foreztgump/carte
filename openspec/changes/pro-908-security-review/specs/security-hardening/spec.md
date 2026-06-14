# Spec delta: security-hardening

## ADDED Requirements

### Requirement: Published security report covering the five packages

The change SHALL produce one published security report at
`docs/security/PRO-908-security-review.md` that covers all five published
packages (`@carte/core`, `@carte/reservations`, `@carte/orders-backend`,
`@carte/orders-admin`, `@carte/views`) and every audit dimension (capability
minimality, sandbox-boundary assumptions, GDPR export/erase, Tender/PCI trust
boundary, Cloudflare WAF carve-out). Each finding SHALL record a severity
(P0/P1/P2/P3), an evidence path (`file:line` or command), and a
resolution/disposition. `@carte/ai` SHALL appear only as an explicit
deferred-PII-boundary note.

#### Scenario: Report enumerates every package and dimension

- **GIVEN** the five published packages and the five audit dimensions
- **WHEN** the report is generated
- **THEN** the report contains a section for each of the five packages, every
  audit dimension is addressed at least once, and `@carte/ai` is listed only as
  "PII-boundary review deferred to the @carte/ai track"

#### Scenario: Every finding carries severity, evidence, and disposition

- **GIVEN** any finding recorded in the report
- **WHEN** a reviewer reads that finding
- **THEN** it states a severity, an evidence path or command that substantiates
  it, and a resolution status (fixed-in-change / follow-up-issue / accepted-risk)

### Requirement: No open criticals at change completion

The change SHALL NOT be archived while any P0 (critical) finding is open. Every
P0/P1 finding SHALL be either resolved in this change or filed as a tracked
follow-up Linear issue referenced from the report; the report's summary SHALL
state "no open criticals".

#### Scenario: A critical blocks completion until resolved or tracked

- **GIVEN** the audit surfaces a P0 finding
- **WHEN** the change is checked for completion
- **THEN** completion is blocked unless the finding is fixed in this change or
  recorded as resolved/mitigated with a referenced follow-up issue, and the
  report summary asserts no open criticals

#### Scenario: AgentShield evidence is clean or explicitly allowlisted

- **GIVEN** `npx ecc-agentshield scan` is run over `packages/`, `.factory/`, and
  `.claude/`
- **WHEN** the scan output is attached as report evidence
- **THEN** any reported finding is either resolved or matched to an existing
  `.agentshield-allowlist.yaml` entry with a documented rationale, and no
  unreviewed high-or-critical AgentShield finding remains

### Requirement: Capability minimality across manifests and native plugins

The audit SHALL verify that every capability declared in each sandboxed
`emdash-plugin.jsonc` and each native `definePlugin` capability array is actually
used, that no used capability is undeclared, and that `network:request`
declarations enumerate a minimal `allowedHosts`. Capability documentation
(per-package README, `SECURITY.md`) SHALL match the manifest of record; confirmed
drift SHALL be corrected in place.

#### Scenario: Declared capabilities equal used capabilities

- **GIVEN** a package's declared capability set and its exercised capability set
  (from routes, hooks, and manifest tests)
- **WHEN** the two sets are compared
- **THEN** they are equal — no capability is declared-but-unused and none is
  used-but-undeclared

#### Scenario: Capability documentation matches the manifest

- **GIVEN** `packages/core/README.md` documents capabilities and
  `packages/core/emdash-plugin.jsonc` declares `["content:read","content:write"]`
- **WHEN** the README capability list is compared to the manifest
- **THEN** any divergence (e.g. a README mention of `media:read` not present in
  the manifest) is recorded as a finding and corrected in place so the README
  matches the manifest

#### Scenario: Network hosts are minimal and enumerated

- **GIVEN** `@carte/orders-backend` declares `network:request`
- **WHEN** its `allowedHosts` is inspected
- **THEN** the list is non-empty, contains no wildcards, and every host is
  justified in the report (license host enumerated; Tender SDK traffic routed via
  `ctx.http.fetch` is described against the declared allowlist)

### Requirement: Sandbox and Tender/PCI trust-boundary assumptions verified

The audit SHALL verify that sandboxed plugins rely only on runtime-enforced
isolation (capabilities + `allowedHosts` via the RPC bridge / `ctx.http`), that
native plugins are documented as in-process/advisory-capability, that the
Cloudflare Free no-isolation caveat is disclosed, and that no Carte code path
receives or persists raw PAN/CVC — card data stays with Stripe Checkout via
Tender.

#### Scenario: Sandboxed network egress is constrained to allowedHosts

- **GIVEN** a sandboxed handler that performs outbound network access
- **WHEN** its egress path is traced
- **THEN** it uses `ctx.http.fetch` constrained to declared `allowedHosts`, with
  no other outbound primitive, and the report records the subrequest count
  against the 10-subrequest Cloudflare runner cap

#### Scenario: Carte never receives raw card data

- **GIVEN** the orders checkout and refund paths
  (`packages/orders-backend/src/routes/checkout.ts`,
  `packages/orders-backend/src/routes/refund.ts`)
- **WHEN** their inputs, persisted values, and logs are reviewed
- **THEN** no PAN, CVC, or expiry is read, stored, or logged; only tokens/ids and
  Tender-hosted checkout URLs cross the boundary, and the report asserts PCI scope
  is minimized to "Carte consumes Tender results"

#### Scenario: Native and Free-plan caveats are documented

- **GIVEN** native plugins (`@carte/orders-admin`) run in-process with advisory
  capabilities, and Cloudflare Free has no Dynamic Worker Loader isolation
- **WHEN** the report's sandbox-boundary section is reviewed
- **THEN** both caveats are stated, with the Free-plan caveat cross-referenced to
  the per-plugin README/install disclosures

### Requirement: GDPR export and erase correctness verified

The audit SHALL verify that `@carte/core` GDPR export returns only the requesting
guest's reservation and order PII, and that erase replaces PII with the
deterministic `erased:<sha256>` placeholder while preserving non-PII revenue
records and writing an audit entry before mutation (HR9 order: audit-then-erase).

#### Scenario: Erase writes audit before mutating PII

- **GIVEN** an erase request for a guest email
- **WHEN** the erase path runs against `packages/core/src/gdpr.ts`
- **THEN** an audit entry is created before the PII update, a failed audit write
  aborts that item's erasure, and erased PII fields equal the deterministic
  `erased:<sha256(normalizedEmail)>` placeholder

#### Scenario: Export is scoped to the requesting guest

- **GIVEN** an export request for a guest email
- **WHEN** the export path runs
- **THEN** only items whose email matches the normalized request email are
  returned, and the behavior is substantiated by `packages/core/src/gdpr.test.ts`
  (cited as evidence in the report)

### Requirement: Cloudflare WAF carve-out for Tender webhook documented with evidence

The audit SHALL document the Cloudflare WAF carve-out required for Tender webhook
delivery using the Rulesets-API `Skip` model, with rule-ordering correctness
(the webhook skip/exception precedes managed execute rules) and the precise scope
(path/method/host) that is exempted. If no carve-out implementation exists in the
repo, the report SHALL record that gap and specify the intended ruleset rather
than asserting a deployed state.

#### Scenario: Carve-out uses Skip and correct ordering

- **GIVEN** the Tender webhook delivery path must bypass specific WAF protections
- **WHEN** the carve-out is described in the report (and `SECURITY.md` if durable)
- **THEN** it uses a custom rule with the `Skip` action (not legacy Allow/Bypass),
  is ordered before the managed execute rules it must skip, and names the exact
  path/method/host scope of the exemption

#### Scenario: Absent implementation is recorded as a gap, not asserted

- **GIVEN** the repository contains no Cloudflare WAF carve-out configuration
- **WHEN** the report's WAF section is written
- **THEN** it states the carve-out is not yet implemented in-repo, specifies the
  intended Rulesets-API definition, and files/links a follow-up rather than
  claiming a deployed carve-out
