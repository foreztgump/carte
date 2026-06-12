# Carte EmDash 0.18 Harness

Local validation site for Carte's EmDash 0.18 migration.

## Dev server

```sh
pnpm --dir harness dev -- --port 4321
```

The harness is configured for port `4321`, server output, SQLite at
`harness/data.db`, and local uploads in `harness/uploads/`. The dev script
builds the probe plugin before starting Astro.

## Fresh database behavior

On a fresh database, `http://localhost:4321/_emdash/admin` redirects to the
EmDash setup wizard. This is expected and is the validator entry point for
creating the first local admin account.

## Seeded admin for validators

For repeat validation, keep a previously initialized `harness/data.db` outside
git and copy it into `harness/data.db` before starting the dev server. The
database is intentionally ignored so seeded admin state stays local.

Validators can also create a local dev admin and API token in development mode:

```sh
curl 'http://localhost:4321/_emdash/api/setup/dev-bypass?token'
```

Use the returned token as `Authorization: Bearer <token>` for authenticated
plugin-route checks.

## Probe plugin

The scaffolded sandboxed probe plugin lives at `harness/plugins/probe`. To
verify the build directly:

```sh
pnpm --dir harness/plugins/probe build
ls harness/plugins/probe/dist/index.mjs harness/plugins/probe/dist/plugin.mjs harness/plugins/probe/dist/manifest.json
```

After the harness starts, the probe route is available at
`/_emdash/api/plugins/carte-harness-probe/ping`. It returns
`{"data":{"ok":true,"plugin":"carte-harness-probe"}}` when called with a seeded
admin session or bearer token.
