# `@carte/orders-backend`

Status: **v0.2.0-rc.1 publish candidate**.

Shipped surfaces:

- Tender-hosted checkout creation (`routes/checkout.ts`) — Carte never sees
  raw PAN/CVC.
- Placeholder Tender payment hook handlers (`events.ts`) — dedupe via KV
  `idempotency:tender:{eventId}` with 7-day TTL per AGENTS.md.
- Admin-authenticated refund route (`routes/refund.ts`) with order snapshot
  updates.
- Order snapshots at checkout time (line items, pricing, customer contact).
- Sandboxed Block Kit admin route (`routes/admin.ts`) for basic order ops.

Execution model: **sandboxed**. Capabilities declared:
`content:read`, `content:write`, `email:send`, `network:request` — `allowedHosts`
is intentionally limited to `license.carteplugin.dev`. PCI scope is minimized
by Tender-hosted checkout — Carte infrastructure NEVER receives raw PAN/CVC.

Subrequest budget note (per AGENTS.md): the Tender transaction trigger handler
budget is 3 of the 10 sandbox subrequests per invocation. Stay within budget; do
not add speculative outbound calls.

## Install (EmDash 0.18)

`@carte/orders-backend` is a sandboxed plugin: an `emdash-plugin.jsonc` manifest
plus `src/plugin.ts`, built with the `emdash-plugin` CLI. **There is no
`emdash-plugin install` command** — installation is an `astro.config.mjs` edit.
Add the built descriptor to the `sandboxed: []` array and set a `sandboxRunner`:

```js
// astro.config.mjs
import emdash from "emdash/astro";
import carteOrdersBackend from "@carte/orders-backend";

emdash({
  sandboxed: [carteOrdersBackend],
  sandboxRunner: "@emdash-cms/sandbox-workerd",
  // ...database/storage options
});
```

Run `emdash-plugin build` before the Astro build, then redeploy. The old
`wrangler.toml`/wrangler-var install flow is gone. See `MIGRATION.md` for the
full Tender three-plugin payment setup.

**Cloudflare Free plan note:** the Dynamic Worker Loader that isolates sandboxed
plugins is unavailable on the Cloudflare Free plan, so on Free
`@carte/orders-backend` runs unsandboxed (in-process) — treat the whole Worker as
one application-code trust boundary. Use a Paid plan (or a self-hosted workerd
runner) for real isolation.

### Known issue: sandbox-workerd capability-name divergence

`@emdash-cms/sandbox-workerd` **<= 0.1.6** enforces the **deprecated** capability
names (`read:content`, `write:content`, …) in its bridge, while `emdash@0.18` +
`@emdash-cms/plugin-cli@0.5.1` require the **canonical** names (`content:read`,
…). A stock 0.1.6 runner therefore rejects this plugin's canonical manifest on
the first `ctx.content.*` bridge call. This repo ships a committed `pnpm patch`
(`patches/@emdash-cms__sandbox-workerd@0.1.6.patch`, wired via
`pnpm.patchedDependencies`) that makes `requireCapability` accept both spellings;
manifests stay canonical. Downstream operators on their own `<=0.1.6` runner must
carry the same patch until upstream fixes it — an upstream issue should be filed
with emdash-cms. See `MIGRATION.md` and `docs/VERIFIED-PLATFORM-0.18-carte.md` §8.
