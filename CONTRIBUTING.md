# Contributing to Carte

Thanks for your interest in contributing! This file covers the conventions
required for every patch. For the full agent / human guidelines (including
EmDash plugin constraints and the canonical capability names), read
[AGENTS.md](./AGENTS.md) first.

## Commit messages

Use Conventional Commits with the Linear ticket id appended in brackets:

```
type(scope): desc [PRO-XXX]
```

Examples:

- `feat(core): add menu-feed route handler [PRO-441]`
- `fix(reservations): clamp capacity counter to non-negative [PRO-455]`
- `chore(workspace): bump emdash to 0.9.1 [PRO-460]`

`type` is one of `feat`, `fix`, `chore`, `docs`, `test`, `refactor`,
`perf`, or `build`. `scope` is the affected package short name (e.g.
`core`, `reservations`, `orders-backend`, `workspace`, `openspec`).

## Branches

- Feature branches: `feature/PRO-XXX-short-desc`
- Bug-fix branches: `fix/PRO-XXX-short-desc`
- Open the PR against `main`. Do NOT push directly to `main`.

## Local development loop

The repo is a pnpm 10 workspace pinned to Node 22 (captured in `.nvmrc`; run
`nvm use` to match CI and the release workflow).

```bash
pnpm install          # install all workspace deps (frozen lockfile in CI)
pnpm test             # run vitest across all packages
pnpm typecheck        # tsc --build across all packages
pnpm lint             # eslint across all packages
pnpm format           # prettier --write
```

For Cloudflare Workers config validation in the sandboxed packages
(`@carte/core`, `@carte/reservations`, `@carte/orders-backend`):

```bash
pnpm -F @carte/<pkg> exec wrangler types
```

## Recording user-facing changes (Changesets)

Carte uses [Changesets](https://github.com/changesets/changesets) for
per-plugin semver. Every PR that introduces a user-facing change in any
package MUST include a changeset:

```bash
pnpm changeset
```

Pick the affected package(s), the bump type (`patch` / `minor` /
`major`), and a summary. The CLI writes a markdown file under
`.changeset/`; commit it alongside your code change. Internal-only edits
(test refactors, doc-only changes) do not need a changeset.

## Releasing

Carte releases use Changesets for package versioning and the GitHub
`release.yml` workflow for npm publishing. The normal release path is:

1. Confirm every user-facing package change has a committed changeset from
   `pnpm changeset`.
2. Create the version-packages change:

   ```bash
   pnpm changeset version
   pnpm install --lockfile-only
   ```

3. Review and commit the generated package versions, changelogs, consumed
   `.changeset/` removals, and lockfile updates:

   ```bash
   git add -A
   git commit -m "chore(release): version packages [PRO-XXX]"
   ```

4. Tag the release from `main` after the version-packages commit lands:

   ```bash
   git checkout main
   git pull --ff-only
   git tag v0.3.0
   git push origin v0.3.0
   ```

5. The `release.yml` tag workflow runs `changeset publish` in CI and publishes
   the packages with pending Changesets output.

Before relying on CI publishing, verify the provenance preconditions:

- The GitHub repository is public. npm provenance is not generated for packages
  published from private source repositories.
- Each published npm package has trusted publishing configured for
  `foreztgump/carte` and the `release.yml` workflow.
- The workflow grants OIDC with `permissions: id-token: write` and does not use
  a long-lived `NODE_AUTH_TOKEN`.
- CI uses Node `>=22.14.0` and npm `>=11.5.1`, because npm trusted publishing
  requires those versions or newer.

### First publish exception

The first `0.3.0` publish is a one-time manual exception because new package
names do not yet have trusted publisher mappings on npm. For that first publish
only:

1. Confirm the repository is public.
2. Build and publish the five MIT packages locally:

   ```bash
   pnpm -r build
   pnpm -r publish --access public
   ```

3. Configure trusted publishing on npmjs.com for each published package, using
   repo `foreztgump/carte` and workflow `release.yml`.
4. Use the tagged CI flow for `0.3.1+` releases.

`@carte/ai` is not published in the R1 release. It stays `private: true`, is
excluded from publish sets, and remains on its own future commercial release
track.

### Rollback and recovery

npm package contents are immutable once published. If a bad release ships,
prefer a ship-forward patch:

1. Fix the issue in a new PR with a changeset.
2. Run the normal version-packages, tag, and CI publish flow for the patch.
3. Deprecate the bad version so new installs see a warning:

   ```bash
   npm deprecate <package>@<bad-version> "Use <fixed-version>; this release is superseded."
   ```

Do not unpublish after 72 hours. If the release is inside npm's unpublish
window, still prefer deprecation unless removal is required for a legal,
security, or secret-exposure incident.

## Pull request checklist

Before opening a PR:

- [ ] All gauntlet commands above exit 0 locally.
- [ ] Commit messages follow `type(scope): desc [PRO-XXX]`.
- [ ] User-facing change has a `pnpm changeset` entry.
- [ ] Linear ticket(s) are linked in the PR description.

CI runs the same gauntlet on every PR plus an AgentShield scan of agent
configuration directories.
