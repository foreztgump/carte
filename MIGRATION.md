# Migration

This document tracks operator migrations between Carte releases, newest first.

- [v0.2 → v0.3.0-rc — EmDash 0.18 manifest-based install](#v02--v030-rc--emdash-018-manifest-based-install)
- [v0.1 → v0.2.0-rc — Tender adapter](#v01--v020-rc--tender-adapter)

---

# v0.2 → v0.3.0-rc — EmDash 0.18 manifest-based install

Carte v0.3.0-rc moves the whole plugin family onto **EmDash 0.18**. The largest
operator-visible change is how plugins are installed: the old per-plugin
`wrangler.toml` + wrangler-var wiring is gone. Plugins are now described by a
manifest (`emdash-plugin.jsonc`) and registered in a single place — your site's
`astro.config.mjs`.

## What changed

1. **Install is an `astro.config.mjs` edit, not a CLI step.** There is **no
   `emdash-plugin install` command** — it does not exist. You wire each plugin
   into the `emdash()` integration by hand: sandboxed plugins go in the
   `sandboxed: []` array (with a `sandboxRunner`), native plugins go in the
   `plugins: []` array. Redeploy to apply.
2. **`wrangler.toml` / wrangler-var wiring is replaced.** The bespoke
   per-plugin `wrangler.toml` files that v0.2 used to declare bindings and vars
   are deleted. Sandbox bindings (D1/R2/KV/Dynamic Worker Loader) are owned by
   the EmDash host; plugins declare what they need through the manifest
   (`capabilities`, `allowedHosts`, `storage`) and read it through `ctx.*`.
   Plugin settings/secrets are entered in the EmDash admin settings surface, not
   as wrangler vars.
3. **Two plugin formats.** Sandboxed plugins (`@carte/core`,
   `@carte/reservations`, `@carte/orders-backend`) ship an
   `emdash-plugin.jsonc` manifest and a `src/plugin.ts`, built with the
   `emdash-plugin` CLI. Native plugins (`@carte/orders-admin`, `@carte/ai`)
   export a `definePlugin(...)` factory and run in-process (unsandboxed).
4. **`@carte/views` is unchanged** — it remains a peer-dependency Astro
   component library, not an EmDash plugin (no manifest, no `definePlugin`).

## Required actions for operators

### 1. Bump EmDash and install the Carte family

Carte v0.3.0-rc targets EmDash `^0.18`. Install (or upgrade) EmDash to the 0.18
line, then add the Carte packages:

```sh
pnpm add @carte/core @carte/reservations @carte/orders-backend
pnpm add @carte/orders-admin @carte/ai
pnpm add -D @carte/views
```

### 2. Register the plugins in `astro.config.mjs`

There is **no install command**. Replace any old `wrangler.toml`/wrangler-var
wiring with a single `emdash()` integration block. Sandboxed plugins are listed
in `sandboxed: []` with a `sandboxRunner`; native plugins are listed in
`plugins: []`:

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import react from "@astrojs/react";
import emdash, { local } from "emdash/astro";
import { sqlite } from "emdash/db";

// Built sandboxed descriptors (emdash-plugin build → dist/index.mjs).
import carteCore from "@carte/core";
import carteReservations from "@carte/reservations";
import carteOrdersBackend from "@carte/orders-backend";

// Native plugins expose a named `createPlugin` (via `entrypoint`) plus their
// React admin `./admin` module. The descriptor's admin-module field
// (`@carte/<pkg>/admin`) registers the React pages; see the complete, verified
// native descriptor shape in `harness/astro.config.mjs`.
function ordersAdminPlugin() {
  return {
    id: "carte-orders-admin",
    version: "0.3.0-rc.1",
    entrypoint: "@carte/orders-admin",
    // admin module: "@carte/orders-admin/admin" (see harness/astro.config.mjs)
  };
}

function aiPlugin() {
  return {
    id: "carte-ai",
    version: "0.3.0-rc.1",
    entrypoint: "@carte/ai",
    // admin module: "@carte/ai/admin" (see harness/astro.config.mjs)
  };
}

export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [
    react(),
    emdash({
      database: sqlite({ url: "file:./data.db" }),
      storage: local({ directory: "./uploads", baseUrl: "/_emdash/api/media/file" }),
      // Native (in-process) plugins:
      plugins: [ordersAdminPlugin(), aiPlugin()],
      // Sandboxed plugins + the runner that isolates them:
      sandboxed: [carteCore, carteReservations, carteOrdersBackend],
      sandboxRunner: "@emdash-cms/sandbox-workerd",
    }),
  ],
});
```

`sandboxRunner` is a **package-specifier string**, not a function call. Build
the sandboxed plugins (`emdash-plugin build`) before the Astro build so the
`@carte/*` descriptor imports resolve.

> **Cloudflare Free plan has no sandboxed isolation.** The Dynamic Worker Loader
> that isolates sandboxed plugins is not available on the Cloudflare Free plan.
> On Free, sandboxed plugins lose isolation and run **unsandboxed (in-process)**
> — treat the whole Worker as one application-code trust boundary. Use a Paid
> plan (or a self-hosted workerd runner) for real sandbox isolation.

### 3. Move payment to the Tender three-plugin model

If you have not already migrated payments per the v0.1 → v0.2.0-rc section
below, do so now: `@carte/orders-backend` routes checkout and refunds through
Tender (`tender-core` + `tender-stripe`), not direct Stripe calls. The dead
inter-plugin payment-hook namespace from v0.2 is gone — v0.3 keeps only the
idempotent order-state trigger seam (`applyTenderTransaction`, keyed by Tender
transaction id). No webhook/polling/event-bus delivery mechanism ships in v0.3;
consumption is deferred to PRO-859/WS4.

## Known issue: sandbox-workerd capability-name divergence

`@emdash-cms/sandbox-workerd` **<= 0.1.6** enforces the **deprecated** capability
names in its in-sandbox bridge (`read:content`, `write:content`, `read:media`,
…), while `emdash@0.18` + `@emdash-cms/plugin-cli@0.5.1` require the **canonical**
names (`content:read`, `content:write`, `media:read`, …). The two disagree, so a
stock 0.1.6 runner rejects a canonical manifest the moment a sandboxed handler
makes a real `ctx.content.*` / `ctx.media.*` bridge call
(`Missing capability: read:content`). There is no manifest-level workaround:
`emdash-plugin validate` rejects the legacy names, and the host normalizes them
back to canonical anyway.

**This repository ships a committed `pnpm patch`** (see `patches/`,
`@emdash-cms__sandbox-workerd@0.1.6.patch`, wired via `pnpm.patchedDependencies`
in the root `package.json`) that makes the runner's `requireCapability` accept
**both** the canonical and the deprecated alias for each capability. Carte plugin
manifests stay **canonical** — never revert them to the legacy spelling. The
patch re-applies automatically on every `pnpm install` (fresh clone or CI).

**Downstream operators** who run Carte sandboxed plugins on their own
`@emdash-cms/sandbox-workerd@<=0.1.6` install will hit the same divergence. Carry
this patch (copy `patches/@emdash-cms__sandbox-workerd@0.1.6.patch` and add the
`pnpm.patchedDependencies` entry) until upstream ships a runner whose bridge
normalizes capability names. **An upstream issue should be filed with
emdash-cms** to fix `requireCapability` to accept canonical names (or run
`normalizeCapability()` internally); the Carte team has not yet filed it —
operators should track or open that upstream issue. Remove the patch once a fixed
sandbox-workerd is released. Full evidence: `docs/VERIFIED-PLATFORM-0.18-carte.md`
§8.

## v0.3.0-rc publish prerequisite

The v0.3.0-rc family publish remains HITL-blocked on the same Tender registry
prerequisite as v0.2 — see
[PRO-766](https://linear.app/projects-linear/issue/PRO-766/external-prereq-tender-team-publishes-tendersdk010-tender-core-tender)
in the section below. No registry publish happens until that clears.

## Rollback

To revert to v0.2.0-rc, reinstall the v0.2 family ranges and restore the
three-plugin Tender payment wiring described below. To revert further to v0.1,
follow the v0.1 rollback steps. The 0.18 install model itself is rolled back by
restoring your previous `astro.config.mjs` (or `wrangler.toml`) from version
control.

---

# v0.1 → v0.2.0-rc — Tender adapter

Carte v0.2.0-rc moves `@carte/orders-backend` from direct Stripe calls to the
Tender adapter described in
[PRO-727](https://linear.app/projects-linear/issue/PRO-727/carte-tender-adapter-route-carteorders-backend-through-tendersdk).
This rc is the upstream prerequisite for Vicky's Kitchen M5 and is not a GA
release yet.

## What changed

1. `@carte/orders-backend` routes checkout and refunds through `@tender/sdk`
   instead of calling Stripe directly.
2. Stripe settings are removed from `@carte/orders-backend`; provider secrets
   now live with the Tender Stripe provider.
3. The old Carte `/webhook-stripe` route is deleted. Tender owns the Stripe
   webhook URL and forwards payment state to Carte through `tender:*` hooks.

## Required actions for operators

### 1. Install the three-plugin payment model

Install all three pieces for the rc:

- `@carte/orders-backend@^0.2.0-rc`
- `tender-core`
- `tender-stripe` (the Stripe provider whose settings surface is
  `@tender/stripe`)

`@tender/sdk` is a peer dependency of `@carte/orders-backend`, so install it in
the app root if your Tender install has not already provided it:

```sh
pnpm add @tender/sdk@^0.1.0
```

This peer-dependency shape is the OQ-2 decision: Tender plugins provide the
shared SDK, avoiding transitive duplication and matching the three-plugin ship
model
([PRO-735](https://linear.app/projects-linear/issue/PRO-735/resolve-oq-2-tendersdk-peer-vs-direct-dependency-for-carteordersbackend)).

### 2. Update the Stripe dashboard webhook URL

Old URL:

```text
https://<your-site>/_emdash/api/plugins/carte-orders-backend/webhook-stripe
```

New URL:

```text
https://<your-site>/_emdash/api/plugins/tender-stripe/webhook
```

### 3. Move Stripe secrets to the Tender Stripe provider

- Remove legacy `stripeSecretKey`, `stripePublicKey`, and
  `stripeWebhookSecret` values from `@carte/orders-backend` settings after the
  upgrade warning has been acknowledged.
- Install and configure `tender-stripe`.
- Set the same Stripe secret key, public key, and webhook secret in the
  `@tender/stripe` settings surface.

### 4. Note the OQ-1 hook namespace constraint

OQ-1 is resolved as "collapsed": the real `@tender/sdk` has no `events.list`
cursor API, so Carte cannot ship a polling fallback. Carte v0.2.0-rc shipped
placeholder Tender payment-state handlers pending EmDash custom inter-plugin
hook dispatch; v0.3 removes those placeholders entirely, keeping only the
idempotent order-state trigger seam (see the v0.3 section above). See
[PRO-733](https://linear.app/projects-linear/issue/PRO-733/resolve-oq-1-emdash-custom-hook-namespace-support-for-tender-events)
and the decision note:
[`docs/decisions/oq1-tender-hook-namespace.md`](./docs/decisions/oq1-tender-hook-namespace.md).

## Tender publish prerequisite

The actual `@carte/orders-backend@0.2.0-rc.1` publish is HITL-blocked until
`@tender/sdk@^0.1.0`, `tender-core`, and `tender-stripe` are available from the
registry. This is tracked under
[PRO-766](https://linear.app/projects-linear/issue/PRO-766/external-prereq-tender-team-publishes-tendersdk010-tender-core-tender):
"External prereq: Tender team publishes `@tender/sdk@0.1.0` + `tender-core` +
`tender-stripe` to npm." The sub-issue sits under
[PRO-737](https://linear.app/projects-linear/issue/PRO-737/publish-carteorders-backend020-rc-and-tag-release).

## Rollback

If you need to revert to v0.1.0:

```sh
pnpm add @carte/orders-backend@^0.1.0
```

Then restore the old Stripe settings on `@carte/orders-backend` and reset the
Stripe dashboard webhook URL to
`https://<your-site>/_emdash/api/plugins/carte-orders-backend/webhook-stripe`.
