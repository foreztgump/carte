# Spec: Release Workflow (release.yml)

## Requirement: Tag push triggers a real OIDC publish

Given a `v*` tag is pushed to the repository
When the `release.yml` workflow runs
Then it builds all packages and runs `pnpm exec changeset publish`
And it authenticates via OIDC (no `NODE_AUTH_TOKEN` is set anywhere)
And the publish step is gated on `github.event_name == 'push'`.

## Requirement: Manual dispatch performs a dry-run

Given a maintainer triggers `workflow_dispatch` with `dry_run: true` (default)
When the `release.yml` workflow runs
Then it runs `pnpm -r publish --dry-run --no-git-checks`
And it does NOT authenticate or push to the registry
And the dry-run step is gated on
`github.event_name == 'workflow_dispatch' && inputs.dry_run`.

## Requirement: OIDC trusted publishing preconditions are met

Given the workflow needs tokenless trusted publishing
When the job sets up its environment
Then `permissions` grants `id-token: write` (and `contents: read`)
And `setup-node` sets `registry-url: https://registry.npmjs.org`
And npm is upgraded to `^11.5.1` before any publish
And `NODE_AUTH_TOKEN` is never set (not even empty).

## Requirement: Concurrency guard

Given two releases could race on the same ref
When the workflow starts
Then a `concurrency` group keyed on `github.ref` serializes runs
And `cancel-in-progress` is `false` (never cancel an in-flight publish).

## Requirement: Dry-run reports exactly the five published packages

Given the package `private` flags are set for the 5 MIT packages (Wave 2)
When a `workflow_dispatch` dry-run runs
Then the output lists exactly `@carte/core`, `@carte/reservations`,
`@carte/orders-backend`, `@carte/orders-admin`, `@carte/views` with their
versions
And `@carte/ai` is absent (it remains `private: true`).

Note: in R1/Wave 1, only `@carte/orders-backend` is non-private, so the live
dry-run output reflects current flags; the full five-package assertion is
verified in Wave 2 after the A-track flip.
