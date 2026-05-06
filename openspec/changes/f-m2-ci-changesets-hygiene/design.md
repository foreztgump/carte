# f-m2-ci-changesets-hygiene — Design

## Decision: bundle three concerns into one feature

`features.json` lists CI, Changesets, and repo-hygiene docs as a single
deliverable (`f-m2-ci-changesets-hygiene`). Each individual artifact is a
single config file or short doc — splitting into three features would
triple the OpenSpec overhead (proposal/tasks/design/spec ×3) for ~200
LoC of total content. Bundle is correct here; the per-feature
documentation cost would dwarf the implementation.

## Decision: CI runs on `pull_request` + `push: branches: [main]`

Two trigger modes cover the full lifecycle without redundant runs:

- **`pull_request`** validates every PR before review, including
  fork-originating PRs (GitHub Actions runs them with a read-only token,
  which is fine — CI does not need write).
- **`push: branches: [main]`** validates `main` after merge, catching
  any merge-induced break (e.g., two PRs that pass independently but
  conflict semantically when both land).

Skipping `push` on feature branches avoids double-running every PR
(once on push, once on PR). Skipping `pull_request` for `main` is not
applicable — PRs to main always trigger PR-mode by definition.

## Decision: AgentShield uses `continue-on-error: true`

The SKILL example carries `continue-on-error: true` until the
AgentShield baseline is clean. This feature follows that guidance
strictly:

- The flag stays ON for the initial CI run regardless of local baseline
  scan outcome. The local scan is a single-environment snapshot;
  baseline-clean across CI runs is what proves the flag can be
  removed.
- A follow-up change record (post-mission, when CI has actually
  observed several green AgentShield runs) will flip the flag to
  default behavior. That belongs to the orchestrator, not this
  feature.

The semantic intent: AgentShield findings should be VISIBLE in CI
output but should not block the milestone PR from merging today,
because we do not yet have a stable signal-to-noise baseline on the
Carte agent configs.

## AgentShield baseline (local scan)

Recorded by Task 8. Captured to `/tmp/agentshield-baseline.txt`.

**Status:** _filled in after the scan runs_ — see "Status update" at
the bottom of this file. The text below describes the three possible
outcomes and how each is interpreted:

- **Zero findings:** confirms the local environment is clean. `continue-
on-error: true` STAYS until CI confirms the same across multiple
  runs.
- **>0 findings:** list severity counts and the decision to defer
  triage. `continue-on-error: true` STAYS.
- **Tool unavailable (404 / not installed):** document the unavailability
  and rely on CI as the first execution site. `continue-on-error: true`
  STAYS.

## Decision: Changesets `commit: false` + GitHub changelog plugin

- **`commit: false`** — humans run `pnpm changeset` and `pnpm changeset
version` deliberately. Auto-committing changeset files inside CI
  introduces a write-loop that would have to be carefully guarded with
  the right token; for v0.1 the human-driven path is simpler and matches
  the SKILL guidance.
- **`@changesets/changelog-github` (not built-in)** — the GitHub-aware
  plugin renders changelog entries with PR numbers and commit author
  links, which is the conventional Changesets shape on GitHub-hosted
  repos. The built-in changelog renderer omits PR/author links and
  produces sparse, hard-to-skim entries. The marginal install cost is
  worth the readability win.
- **`linked: []` + `fixed: []`** — every plugin in the family ships on
  its own semver track. Carte explicitly does NOT want a `@carte/core`
  bump to force a `@carte/ai` bump. This matches PRO-433's "per-plugin
  semver" requirement.

## Decision: action pins are major-only

- `actions/checkout@v4`
- `pnpm/action-setup@v4`
- `actions/setup-node@v4`

Major-pin (not SHA-pin) is the SKILL-locked default. Pros: gets
security patches automatically; matches the wider ecosystem norm. Cons:
a malicious major-version push could in principle compromise CI. Given
this repo has no production deploy step in CI yet (no secrets exposed
beyond the default `GITHUB_TOKEN` scope), the risk is low. SHA-pinning
is a future hardening; not in this feature's scope.

## Decision: README is link-heavy, not marketing

The README is the first file forks/clones see. Two competing impulses:

1. **Marketing page** — ~200-line README selling Carte to potential
   adopters.
2. **Developer landing page** — short paragraph + links to the docs
   that actually answer questions.

Carte is pre-v0.1 and has zero adopters. There is no marketing audience
yet. The README is for contributors, who need to find the PRD,
conventions, and contribution guide. We pick option 2: terse, link-heavy.
A marketing-shaped README can be authored at v0.1 release by a doc
mission with the actual feature inventory in hand.

## Decision: `packages/ai/LICENSE` is a NOTICE, not a long EULA

`@carte/ai` is shipped commercially. The LICENSE file at this path
needs to:

1. Make clear the package is NOT MIT.
2. Direct readers to the canonical license terms (placeholder URL —
   `carteplugin.dev/license` is not yet live; that's flagged as a known
   placeholder for mission-close).
3. Acknowledge the source is published for transparency / security
   review, not redistribution.

A full multi-page EULA belongs at the canonical URL, not in the repo.
The LICENSE file's job is to disambiguate the licensing posture for
anyone who reads the source tree.

## Decision: `.editorconfig` is verified, not authored

`f-m2-workspace` already shipped a working `.editorconfig` at root
(`indent_style = space`, `indent_size = 2`, `end_of_line = lf`,
`charset = utf-8`, `insert_final_newline = true`, with markdown
trailing-whitespace exemption). This feature only verifies the file
exists; rewriting it would be churn for no semantic gain. If a future
mission needs to extend it (e.g., 4-space indentation for Python tools
that haven't landed yet), that's their change record, not ours.

## Out of scope

- **Release-PR bot** (`changesets/action`). Today's feature ships only
  the CLI and config so `pnpm changeset` works locally. The bot that
  opens release PRs on `main` is a follow-up; it requires deciding
  publish credentials and `NPM_TOKEN` scope, which is a separate
  conversation.
- **`commitlint` + `husky commit-msg` hook.** Out of scope; would
  ban the existing pre-mission commits retroactively. Better landed
  alongside a CONTRIBUTING.md update that includes a migration plan.
- **PR template, issue template.** Out of scope for v0.1 scaffolding;
  the `repo:carte` Linear label is the canonical issue tracker for now.
- **Conventional-commit linting in CI.** Linked to commitlint; same
  reasoning.
- **AgentShield as a hard repo dep.** CI runs it via `npx`; adding it
  to `devDependencies` would slow `pnpm install` for every contributor
  for a tool that runs only in CI.

## Status update — AgentShield baseline (filled at Task 8 execution time)

See "AgentShield baseline" section above; the executable scan output
is appended below by Task 8.
