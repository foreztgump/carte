# `@carte/orders-admin`

Status: **v0.1 shipped**.

Shipped surfaces:

- Native React admin mounted via the EmDash 0.18 `./admin` export
  (`src/admin/index.tsx`, `App.tsx`): the `./admin` module's named `pages`
  export maps `admin.pages[].path` to React **component functions** rendered in
  the host admin shell.
- Order list + detail views with status workflow transitions
  (accepted → preparing → ready → fulfilled / cancelled).
- Idempotent refund flow wired to `@carte/orders-backend`.
- Email template editing for receipts and status notifications.
- Single-tier modifier group editor (`src/modifiers/modifier-group-form.tsx`)
  per the OQ#11 locked decision.

Execution model: **native** (0.18 `definePlugin`, in-process and unsandboxed).
Capabilities declared: `content:read`, `content:write`. No outbound network.

## Install (EmDash 0.18)

`@carte/orders-admin` is a native plugin: it exports a `definePlugin(...)`
factory and runs in-process. **There is no `emdash-plugin install` command** —
register it in `astro.config.mjs` via the `plugins: []` array. The native
descriptor points `entrypoint` at the package's named `createPlugin` export; its
admin-module field resolves the package's `./admin` React module
(`@carte/orders-admin/admin`). See the complete, verified native descriptor in
`harness/astro.config.mjs`:

```js
// astro.config.mjs
import emdash from "emdash/astro";

function ordersAdminPlugin() {
  return {
    id: "carte-orders-admin",
    version: "0.1.0",
    entrypoint: "@carte/orders-admin",
    // admin module: "@carte/orders-admin/admin"
  };
}

emdash({
  plugins: [ordersAdminPlugin()],
  // ...database/storage options
});
```

The old `wrangler.toml`/wrangler-var install flow is gone. Native plugins run
in-process, so the Cloudflare Free sandbox-isolation caveat does not apply — but
they share the host Worker's trust boundary by design.

## Build

Run `pnpm -F @carte/orders-admin build` (tsdown) to produce `dist/`. The build
emits ESM (`.mjs`) + type declarations (`.d.mts`) in unbundle mode, preserving
the module structure (`dist/admin/`, `dist/modifiers/`) the runtime specifiers
depend on. `emdash` (peer) and `react`/`react-dom` (host-provided) stay external.
`main` and both `exports` subpaths (`.`, `./admin`) resolve from `dist/`.
