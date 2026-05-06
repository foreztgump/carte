# f-m2-wrangler — Design

## Decision: placeholder KV ids, not real ids

`wrangler.toml` requires a non-empty `id` and `preview_id` for every
`[[kv_namespaces]]` binding. Real ids are 32-character hex strings produced
by `wrangler kv:namespace create`, which talks to the Cloudflare API and
binds the namespace to a specific Cloudflare account.

This mission has no Cloudflare account in scope and explicitly forbids any
network call to `cloudflare.com`. Instead, we ship `PLACEHOLDER_KV_ID` /
`PLACEHOLDER_PREVIEW_KV_ID` as documented sentinels. The deploy mission
will:

1. Run `wrangler kv:namespace create PLUGIN_KV` for each sandboxed package.
2. Capture the printed id and preview_id.
3. Commit them via a follow-up change record.

Until then, `wrangler types` happily accepts any non-empty string for `id`
because it only generates `Env` typings — it never resolves the KV binding
to a live namespace. Sentinels make the substitution boundary unambiguous
(grep for `PLACEHOLDER_` to find every site that needs deploy-time edit).

## Decision: `compatibility_date = "2026-05-01"` (locked)

EmDash SDK `^0.9.0` was released 2026-05-01. Pinning the wrangler
compatibility date to the same day guarantees that any Workers-runtime
behavior changes after that date won't silently shift under us during the
scaffold mission. Per-plugin missions that need newer Workers features
(e.g. WebRTC, native fetch streaming improvements) can bump this date in
their own change record.

`compatibility_flags = ["nodejs_compat"]` is included because the EmDash
plugin SDK uses `node:buffer`, `node:crypto`, and `node:url` internally
(verified in `node_modules/emdash/dist/`). Without the flag, Workers
runtime will throw `ReferenceError: Buffer is not defined` at first
import. This is a fail-fast configuration, not a speculative one.

## Decision: env tables are empty placeholders

Wrangler's `[env.<name>]` table inherits all top-level keys when empty. So
`[env.development]` with no body means "use the same name, main, and KV
binding as the top of the file." The deploy mission will populate
per-env overrides (e.g. different KV ids per env, env-specific `vars`) at
that time.

Empty tables are intentional and self-documenting — they tell future
readers "yes, this env exists and inherits defaults" rather than relying
on implicit inheritance.

## Decision: native packages get no wrangler.toml

The Carte plugin family splits cleanly along the EmDash sandboxed/native
axis (locked in mission AGENTS.md hard rule #8):

| Package                 | Execution     | wrangler.toml? | Reason                                  |
| ----------------------- | ------------- | -------------- | --------------------------------------- |
| `@carte/core`           | Sandboxed     | YES            | Worker entry runs in EmDash sandbox     |
| `@carte/reservations`   | Sandboxed     | YES            | Worker entry runs in EmDash sandbox     |
| `@carte/orders-backend` | Sandboxed     | YES            | Worker entry runs in EmDash sandbox     |
| `@carte/orders-admin`   | Native React  | NO             | Mounted by EmDash host as React module  |
| `@carte/views`          | Astro library | NO             | Published as npm peer-dep; not deployed |
| `@carte/ai`             | Native React  | NO             | Mounted by EmDash host as React module  |

Adding `wrangler.toml` to any native package would create a misleading
deploy artifact and could trip a future CI step into trying to deploy a
non-Worker. The exclusion is enforced by an `ls` check in tasks.md Task 5.

## Decision: secrets in `.dev.vars`, names in `.dev.vars.example`

Wrangler's `.dev.vars` file is the canonical local-secrets store and is
already gitignored by `f-m2-workspace` (`.gitignore` line `.dev.vars`).
`.dev.vars.example` (with the `.example` suffix) IS committed and lists
the names of every secret a contributor must populate locally.

`LICENSE_SERVER_URL = https://license.carteplugin.dev` is the only value
present, because it is a public hostname (the `@carte/ai` license server
endpoint), not a secret. All other values are empty. The secret-scan
grep (`sk_|whsec_|pk_live_`) is run as part of Task 5 acceptance to
guarantee no real credentials leak into the example file.

## Out of scope

- D1 + R2 bindings (PRO-432 description mentions these as desirable). No
  skeleton handler currently uses D1 or R2; adding bindings now would
  violate YAGNI. The per-plugin missions that introduce real handlers
  will add bindings as needed.
- `wrangler dev` smoke test (PRO-432 acceptance criteria). `wrangler dev`
  would attempt to bind the placeholder KV id and fail; the deploy
  mission will exercise this once real ids land. `wrangler types` is the
  in-scope local validator for this mission.
- Per-env `vars` blocks. None are needed yet — the EmDash plugin SDK
  reads its own bindings from `ctx`, not from Worker-level `vars`.
