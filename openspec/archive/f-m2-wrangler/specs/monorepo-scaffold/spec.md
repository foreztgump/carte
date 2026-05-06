# Monorepo Scaffold — Wrangler Spec

## Capability: Each sandboxed package has a loadable `wrangler.toml`

### Given the repo at `feature/PRO-m2-monorepo-scaffold` HEAD with f-m2-workspace + f-m2-test-frameworks landed and `wrangler` installed as a workspace devDep

### When I run `pnpm -F @carte/<pkg> exec wrangler types` for `<pkg> ∈ {core, reservations, orders-backend}`

### Then

- The command exits 0.
- Wrangler emits a `worker-configuration.d.ts` (or equivalent typings file)
  in the package, indicating the toml was parsed and validated as a Worker
  config.
- No call is made to the Cloudflare API (`wrangler types` is local-only).

### Fulfills

- `A2.wrangler.config` — sandboxed packages each have a wrangler config
  loadable by `wrangler types`.

## Capability: Three-env split is declared per sandboxed package

### Given each of the three sandboxed `wrangler.toml` files

### Then

- The file declares all three of `[env.development]`, `[env.preview]`, and
  `[env.production]` tables (empty bodies are acceptable; they inherit the
  top-level config by Wrangler's documented behavior).
- The top-level `name`, `main`, `compatibility_date`, and KV binding are
  present and populate every env via inheritance.

### Fulfills

- `A2.wrangler.envSplit` — every sandboxed plugin's wrangler config splits
  into the three named envs.

## Capability: Native packages carry no wrangler config

### Given the three native packages `@carte/orders-admin`, `@carte/views`, `@carte/ai`

### When I run `ls packages/{orders-admin,views,ai}/wrangler.*`

### Then

- The shell glob finds no files.

### Rationale

Native packages are not Workers and must not be deployed as Workers. A stray
`wrangler.toml` in a native package would mislead a future CI step into
trying to deploy them. The absence is part of the contract.

## Capability: `.dev.vars.example` lists every secret name with no real values

### Given the repo root after this feature lands

### When I read `.dev.vars.example`

### Then

- Every `=` is followed by either nothing or a public URL (no secret
  material).
- `grep -nE 'sk_|whsec_|pk_live_' .dev.vars.example` returns 0 matches.
- The names cover the secrets the v0.1 plugin family will need:
  `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLIC_KEY`,
  `LICENSE_SERVER_URL`, `LEMON_SQUEEZY_API_KEY`,
  `LEMON_SQUEEZY_WEBHOOK_SECRET`.

### And given `.gitignore`

### Then

- `.dev.vars` (without the `.example` suffix) is ignored, so contributor
  copies of the file with real values cannot accidentally be committed.

### Fulfills

- The mission-wide hard rule "no real secrets committed" (mission AGENTS.md
  rule #11), exercised at the boundary where contributors first encounter
  the secret-name list.
