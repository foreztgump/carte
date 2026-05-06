# f-m2-ci-changesets-hygiene — CI + Changesets + Repo hygiene

## Why

Three concerns close out Milestone 2 monorepo scaffolding:

1. **GitHub Actions CI** (PRO-435): a single `ci` job that runs typecheck,
   lint, build (if-present), test, and an AgentShield scan on agent-config
   directories on every pull request and on `push` to `main`. Until CI is in
   place, every M2 feature is verified only by the worker who landed it; the
   milestone PR has no machine-checked floor.
2. **Changesets per-plugin semver** (PRO-433): all six packages publish on
   independent semver tracks (no `linked`, no `fixed`). Without Changesets in
   place at scaffold time, the first per-plugin mission would have to bolt
   it on retroactively and manually backfill the `0.1.0 → next` log.
3. **Repo hygiene** (PRO-413 misc): `README.md`, `CONTRIBUTING.md`, root
   `LICENSE` (MIT), `packages/ai/LICENSE` (commercial NOTICE — not MIT),
   and a verification of the `.editorconfig` already authored by
   `f-m2-workspace`. These are required before the milestone PR opens
   because forks/clones first see them and must understand the repo's
   conventions.

This change is bundled (not split into three features) because each
artifact is a single config file or short doc: total LoC is small, the
verification gauntlet is shared, and `features.json` lists them as one
feature deliverable.

This change fulfills the M2 validation-contract assertions
`A2.ci.workflow`, `A2.changesets.config`, `A2.docs.repoHygiene`, and
`A2.security.agentShield`.

## What changes

- **Author `.github/workflows/ci.yml`** — single `ci` job on
  `pull_request` + `push: branches: [main]` with these steps in order:
  checkout (`actions/checkout@v4`), pnpm setup (`pnpm/action-setup@v4`),
  Node setup (`actions/setup-node@v4`, Node 22, `cache: 'pnpm'`),
  `pnpm install --frozen-lockfile`, `pnpm -r typecheck`, `pnpm -r lint`,
  `pnpm -r build --if-present`, `pnpm -r test`, AgentShield scan
  (`npx ecc-agentshield scan .factory/ .claude/`, `continue-on-error: true`
  until baseline is clean).

- **Install `@changesets/cli`** as a workspace devDep at root, run
  `pnpm changeset init`, then **replace `.changeset/config.json`** with the
  Carte-tuned config: `commit: false` (humans run `pnpm changeset` by hand),
  `linked: []` + `fixed: []` (independent per-plugin semver), `baseBranch:
"main"`, `access: "public"`, `updateInternalDependencies: "patch"`,
  `changelog: ["@changesets/changelog-github", { "repo": "foreztgump/carte" }]`.

- **Author root `README.md`** — one-paragraph intro plus links to PRD,
  competitive-analysis docs, AGENTS.md, CODE_PRINCIPLES.md, and CONTRIBUTING.md.

- **Author root `CONTRIBUTING.md`** documenting the commit format
  `type(scope): desc [PRO-XXX]`, branch convention `feature/PRO-XXX-desc`
  / `fix/PRO-XXX-desc`, the standard `pnpm install / pnpm test / pnpm
typecheck / pnpm lint` flow, and the Changesets requirement
  (`pnpm changeset` to record any user-facing change). Points to AGENTS.md
  for full guidelines.

- **Author root `LICENSE`** — MIT, copyright year 2026, holder
  "Carte contributors" (placeholder; mission-close may tighten).

- **Author `packages/ai/LICENSE`** — commercial NOTICE that explicitly
  asserts `@carte/ai` is NOT under MIT; it requires a paid subscription
  with a 14-day free trial. Source code is published for transparency,
  not redistribution.

- **Verify `.editorconfig`** — `f-m2-workspace` already authored this;
  this feature only checks it exists with sensible defaults and does not
  duplicate.

- **Run a local AgentShield baseline scan** (`npx ecc-agentshield scan
.factory/ .claude/`) and document findings (or unavailability) in
  `design.md` to inform the `continue-on-error` flag in the CI workflow.

## What does NOT change

- **No release / deploy step in CI.** Publishing to npm is deferred to a
  per-plugin mission. Today's CI is a quality floor, not a release
  pipeline.
- **No package version bumps.** All six packages stay at `0.1.0`
  (already set by `f-m2-workspace`). This change MUST NOT rewrite any
  `packages/*/package.json` `version` field.
- **No commit-message lint, prose lint, or markdown lint.** Out of M2
  scaffold scope; can land later if needed.
- **No GitHub release-PR bot wiring.** The Changesets GitHub Action that
  opens release PRs is a separate concern; this feature only ships the
  CLI + config so `pnpm changeset` works locally.
- **AgentShield is not added as a hard repo dep.** The CI runs it via
  `npx`, matching the SKILL template.
- **No edits to `packages/*/package.json`** or other M2 artifacts that
  prior features (`f-m2-workspace`, `f-m2-test-frameworks`,
  `f-m2-wrangler`) authored.

## Fulfills

- `A2.ci.workflow` — `.github/workflows/ci.yml` exists, runs on PR + push
  to main, includes typecheck/lint/test/scan, YAML loads cleanly.
- `A2.changesets.config` — `.changeset/config.json` parses as JSON, has
  `linked: []` + `fixed: []` for independent versioning,
  `baseBranch: "main"`, and the GitHub changelog plugin.
- `A2.docs.repoHygiene` — root has `README.md`, `CONTRIBUTING.md`,
  `LICENSE` (MIT), `.editorconfig`; `packages/ai/LICENSE` is commercial.
- `A2.security.agentShield` — CI step invokes
  `npx ecc-agentshield scan .factory/ .claude/`. Baseline state is
  documented in `design.md`.
