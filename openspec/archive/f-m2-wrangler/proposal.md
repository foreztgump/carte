# f-m2-wrangler — Wrangler config per sandboxed plugin + .dev.vars.example

## Why

Three of the six Carte plugin packages run as Cloudflare Workers under the
EmDash sandboxed runtime: `@carte/core`, `@carte/reservations`,
`@carte/orders-backend`. Each needs a `wrangler.toml` describing its Worker
name, entry, KV bindings, and dev/preview/production env split so that future
deploy missions and local sandbox testing have a known-good config to lean on.

The other three packages (`@carte/orders-admin`, `@carte/views`, `@carte/ai`)
are NOT deployed as Workers and therefore must NOT carry `wrangler.toml`:

- `@carte/orders-admin` — native React admin module, mounted by EmDash directly.
- `@carte/views` — published as an npm peer-dep library of Astro components.
- `@carte/ai` — native React admin module (paid SKU); calls LLM APIs from the
  EmDash host process, not from a standalone Worker.

This change also adds a root `.dev.vars.example` listing every secret name
used across the plugin family with empty values, so contributors know what to
populate in their own `.dev.vars` (which is gitignored).

This change fulfills the M2 validation-contract assertions
`A2.wrangler.config` and `A2.wrangler.envSplit`.

## What changes

- **Install `wrangler`** as a root workspace devDependency (latest stable;
  no major pin — let pnpm pick).
- **Author `packages/<pkg>/wrangler.toml`** for the three sandboxed packages:
  - `name = "carte-<pkg>"`
  - `main = "src/index.ts"`
  - `compatibility_date = "2026-05-01"` (locked; future bumps belong to the
    plugin missions that introduce them)
  - `compatibility_flags = ["nodejs_compat"]`
  - One placeholder `[[kv_namespaces]]` binding (`binding = "PLUGIN_KV"`,
    `id = "PLACEHOLDER_KV_ID"`, `preview_id = "PLACEHOLDER_PREVIEW_KV_ID"`).
    Real ids are supplied by the deploy mission via `wrangler kv:namespace
create`; this scaffold deliberately keeps placeholders.
  - Three empty env tables: `[env.development]`, `[env.preview]`,
    `[env.production]`. They exist so deploy time can fill them without
    touching the file shape.
- **Document expected secrets** as a TOML comment block on
  `packages/orders-backend/wrangler.toml` (informational only; real values
  live in `.dev.vars` which is gitignored).
- **Author root `.dev.vars.example`** listing every secret name across the
  plugin family. All values are empty (or, for the public license server URL,
  the public hostname). No real keys are ever committed.
- **Verify** each sandboxed package's `wrangler.toml` is loadable by running
  `pnpm -F @carte/<pkg> exec wrangler types` (local validation; no deploy,
  no Cloudflare API call).

## What does NOT change

- No `wrangler.toml` for `@carte/orders-admin`, `@carte/views`, `@carte/ai`.
- No real KV namespace ids. Real ids are 32-character hex strings produced by
  `wrangler kv:namespace create`; ours stay as `PLACEHOLDER_KV_ID` until the
  deploy mission.
- No `wrangler deploy` / `wrangler login` / any Cloudflare API call. Only
  `wrangler types` is exercised here, and it is local-only.
- No D1 or R2 bindings. The PRO-432 description mentions them as desirable,
  but no skeleton handler yet uses D1 or R2 — wiring them now would violate
  capability minimization (CODE_PRINCIPLES YAGNI). They can be added by the
  per-plugin missions that actually need them.
- No real secrets. `.dev.vars.example` only lists names + empty values.

## Fulfills

- `A2.wrangler.config` — each sandboxed package has a loadable `wrangler.toml`
  with `name`, `main`, `compatibility_date`, `compatibility_flags`, and a KV
  binding (placeholder id).
- `A2.wrangler.envSplit` — each sandboxed package's config declares the
  `[env.development]` / `[env.preview]` / `[env.production]` tables.
