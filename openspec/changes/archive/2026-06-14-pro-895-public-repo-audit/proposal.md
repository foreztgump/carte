# pro-895-public-repo-audit — Pre-public secrets/URL audit + flip `foreztgump/carte` to public

## Why

npm provenance (OIDC trusted publishing) and source links for the five MIT
`@carte/*` packages require the GitHub repository to be **public**
(`PRD-production-release.md` WS-B1, R2 release gate). The repo is currently
**PRIVATE**. Flipping visibility is irreversible in effect — once public, the
entire Git history on all branches, all GitHub Actions run logs/artifacts, and
all issue/PR text become world-readable and are crawled by GitHub secret
scanning. Before the flip we MUST prove nothing sensitive ships: no secrets,
no captured tokens in history, no internal-only URLs that leak infrastructure.

## What changes

This is a **release/security-operations** change. No production package code
changes. The deliverable is an **evidence-backed audit** followed by the
**visibility flip** and **post-flip verification**.

- **Pre-public audit (evidence collection).** Scan the working tree AND the
  full Git history (all branches, all refs) for: hardcoded secrets / API keys
  / tokens (Stripe `sk_`/`whsec_`, LLM keys, `GITHUB__USER_TOKEN`/PAT,
  CLIProxy captures), committed `.env`/`.dev.vars` files, and internal-only
  URLs. Capture tool output as committed evidence under the change's
  `validation/` directory.
- **Classify URL/host references.** Confirm each non-public reference is
  intentionally shippable: `license.carteplugin.dev` (public license host, by
  design per PRD §AI), `linear.app/projects-linear/...` issue links (internal
  tracker URLs embedded across docs), and the CLIProxy `127.0.0.1:8317` /
  `OPENAI__API_BASE` lines in `AGENTS.md` (local-only dev loopback, no
  secret). Produce a written disposition for each class.
- **Verify gitignore + example-file posture.** Confirm `.dev.vars`, `.env`,
  `.factory-state/`, and credential files are gitignored and that only
  placeholder example files (`.dev.vars.example`) are tracked.
- **Flip visibility** via
  `gh repo edit foreztgump/carte --visibility public --accept-visibility-change-consequences`
  once the audit is signed off.
- **Post-flip verification.** Confirm the repo reports `public`, GitHub secret
  scanning + push protection are enabled, and re-confirm no secret-scanning
  alert fired on history.

## Capabilities

- **New:** `repository-publication` — the audited, evidence-backed procedure
  for taking `foreztgump/carte` from private to public, with a clean pre-flip
  audit and post-flip verification as required outcomes.

## Impact

- **Affected systems:** GitHub repository `foreztgump/carte` visibility
  setting; GitHub secret scanning / push protection configuration.
- **Affected files (evidence + docs only):**
  - `openspec/changes/pro-895-public-repo-audit/validation/` — new audit
    evidence artifacts (scan transcripts, URL disposition table, sign-off).
  - No changes to `packages/**` production code.
  - Possible follow-up doc note only if the audit finds a real exposure (see
    rollback plan); none expected.
- **Out of scope:** the first npm publish (WS-B3), `release.yml` automation
  (WS-B), docs-site publication (WS-E), and any `@carte/ai` work (deferred).

## What does NOT change

- No production source, no `package.json` flags, no CI workflow logic.
- No history rewrite **unless** the audit finds a real committed secret
  (that is the rollback/remediation branch, not the happy path).
- `@carte/ai` stays `private: true` and is untouched.

## Rollback plan

- **Before the flip:** the change is pure evidence + artifacts; deleting the
  worktree fully reverts. Nothing is irreversible until the `gh repo edit`
  command runs.
- **If the pre-flip audit finds a secret:** do NOT flip. Treat the credential
  as compromised — **rotate/revoke at the provider first** (the secret is in
  history and rotation is the only true fix), then purge from history
  (`git filter-repo` or BFG) on a coordinated force-push, re-run the audit,
  and only then proceed. Record the incident in the evidence directory.
- **After the flip (un-flip):**
  `gh repo edit foreztgump/carte --visibility private --accept-visibility-change-consequences`
  returns the repo to private. NOTE: this does **not** undo exposure —
  anything public for any window must be assumed cloned/cached, so any secret
  discovered post-flip is rotated, not just hidden. Reverting visibility is a
  containment step, not an undo.
