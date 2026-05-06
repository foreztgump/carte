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

The repo is a pnpm 10 workspace pinned to Node 22.

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

## Pull request checklist

Before opening a PR:

- [ ] All gauntlet commands above exit 0 locally.
- [ ] Commit messages follow `type(scope): desc [PRO-XXX]`.
- [ ] User-facing change has a `pnpm changeset` entry.
- [ ] Linear ticket(s) are linked in the PR description.

CI runs the same gauntlet on every PR plus an AgentShield scan of agent
configuration directories.
