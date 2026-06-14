# Spec — `pro-895-public-repo-audit`

## ADDED Requirements

### Requirement: Pre-public secret audit over working tree and full history

Before the repository visibility is changed, the change SHALL run a secret/
credential scan over BOTH the current working tree AND the complete Git history
(all branches, all refs), and SHALL capture the scan output as committed
evidence. The flip MUST NOT proceed while any unresolved secret finding exists.
The audit covers, at minimum: Stripe secrets (`sk_live`/`sk_test`/`whsec_`),
LLM provider keys, GitHub PATs / `GITHUB__USER_TOKEN` captures, CLIProxy
captured tokens, and any committed `.env` / `.dev.vars` file content.

#### Scenario: History scan finds no secrets

- **GIVEN** the `foreztgump/carte` repository is still PRIVATE
- **WHEN** a history-aware secret scanner (e.g. `gitleaks detect --no-banner`)
  runs over all refs and a working-tree scan runs over the checkout
- **THEN** the scan reports zero unresolved secret findings, and the full
  transcript is written to the change's `validation/` directory as evidence

#### Scenario: A real secret blocks the flip

- **GIVEN** the pre-public scan reports a hardcoded credential in history
- **WHEN** the audit result is evaluated against the flip precondition
- **THEN** the visibility flip is NOT performed, the credential is recorded for
  provider-side rotation, and history remediation is required before any retry

### Requirement: Internal URL and host-reference disposition

The change SHALL enumerate every non-`github.com` external/internal reference
that would become public (license host, issue-tracker links, loopback dev
endpoints) and SHALL record a written disposition classifying each as
"intentionally public" or "must remove" before the flip. Loopback/localhost
references (e.g. CLIProxy `127.0.0.1:8317`) and the public license host
(`license.carteplugin.dev`) are documented as non-secret by design; tracker
links (`linear.app/...`) are confirmed acceptable to expose or scoped for
follow-up.

#### Scenario: Every reference class has a recorded disposition

- **GIVEN** the working tree contains references to `license.carteplugin.dev`,
  `linear.app/projects-linear/...`, and `127.0.0.1:8317`
- **WHEN** the URL/host disposition table is produced for the audit
- **THEN** each reference class has an explicit "intentionally public" or
  "must remove" decision with a one-line rationale, and no class is left
  unclassified

#### Scenario: A leaking internal endpoint is flagged

- **GIVEN** the disposition review finds an internal-only infrastructure URL
  that is not safe to expose
- **WHEN** the table is finalized
- **THEN** that reference is marked "must remove", remediated in the working
  tree, and re-verified absent before the flip precondition is met

### Requirement: Gitignore and example-file posture verified

The change SHALL verify that secret-bearing files (`.dev.vars`, `.env*`,
`.factory-state/`, credential files) are gitignored and NOT tracked, and that
only placeholder example files (e.g. `.dev.vars.example`) with empty/dummy
values are committed.

#### Scenario: No tracked secret files; examples are placeholders

- **GIVEN** the repository `.gitignore` and tracked file list
- **WHEN** the audit checks tracked files against the ignore rules
- **THEN** no `.dev.vars` or `.env` file is tracked, `.dev.vars.example`
  contains only empty/placeholder values, and the result is recorded as
  evidence

### Requirement: Visibility flip is gated on a signed-off clean audit

The repository SHALL be made public via
`gh repo edit foreztgump/carte --visibility public --accept-visibility-change-consequences`
only after the secret audit, URL disposition, and gitignore checks are all
recorded clean and signed off. The flip command and its outcome SHALL be
captured as evidence.

#### Scenario: Flip proceeds on a clean, signed-off audit

- **GIVEN** the secret scan, URL disposition, and gitignore checks are all
  recorded clean in the `validation/` evidence directory
- **WHEN** the operator runs the `gh repo edit ... --visibility public
--accept-visibility-change-consequences` command
- **THEN** the command exits 0 and the repository visibility becomes `public`

#### Scenario: Flip is refused on an unresolved finding

- **GIVEN** any audit check is recorded as failed or unresolved
- **WHEN** the flip precondition gate is evaluated
- **THEN** the flip command is NOT run and the blocking finding is named in the
  evidence directory

### Requirement: Post-flip verification and secret-scanning enablement

After the flip, the change SHALL verify that the repository reports `public`,
that GitHub secret scanning and push protection are enabled, and that no
secret-scanning alert was raised against the now-public history. Results SHALL
be captured as evidence.

#### Scenario: Repo is public with secret scanning active and no alerts

- **GIVEN** the visibility flip command has completed
- **WHEN** `gh repo view foreztgump/carte --json visibility` and the GitHub
  secret-scanning alert list are queried
- **THEN** visibility is `public`, secret scanning + push protection are
  enabled, the secret-scanning alert count is zero, and all outputs are
  recorded as post-flip evidence
