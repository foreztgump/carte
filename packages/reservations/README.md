# `@carte/reservations`

Status: **v0.1 shipped**.

Shipped surfaces:

- Reservation collection with capacity-aware availability (read-time slot
  generation in `availability/read-time-slots.ts`).
- Public routes: `submit`, `confirm`, `cancel`, plus admin route.
- HMAC-signed guest tokens for tokenless confirm/cancel flows (`routes/tokens.ts`).
- Race-safe capacity holds via a single-writer claim path (`capacity.ts`).
- Email notifications to host and guest, sent in-request (sandboxed handlers
  have no post-response primitive — VERIFIED-PLATFORM §7).
- Block Kit admin pages with reservations + closures views.

Execution model: **sandboxed**. Capabilities declared:
`content:read`, `content:write`, `email:send`. No outbound network beyond email.

## Install (EmDash 0.18)

`@carte/reservations` is a sandboxed plugin: an `emdash-plugin.jsonc` manifest
plus `src/plugin.ts`, built with the `emdash-plugin` CLI. **There is no
`emdash-plugin install` command** — installation is an `astro.config.mjs` edit.
Add the built descriptor to the `sandboxed: []` array and set a `sandboxRunner`:

```js
// astro.config.mjs
import emdash from "emdash/astro";
import carteReservations from "@carte/reservations";

emdash({
  sandboxed: [carteReservations],
  sandboxRunner: "@emdash-cms/sandbox-workerd",
  // ...database/storage options
});
```

Run `emdash-plugin build` before the Astro build, then redeploy. The old
`wrangler.toml`/wrangler-var install flow is gone.

**Cloudflare Free plan note:** the Dynamic Worker Loader that isolates sandboxed
plugins is unavailable on the Cloudflare Free plan, so on Free
`@carte/reservations` runs unsandboxed (in-process) — treat the whole Worker as
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

## Submit rate limit

The `submit` route enforces a per-IP sliding-window rate limit of 60 requests
per 60 seconds before reservation input parsing or capacity writes. The limiter
trusts only EmDash/Cloudflare request metadata and the `cf-connecting-ip`
header; client-controlled `x-forwarded-for` values are intentionally ignored.
Accepted requests write the rate-limit counter with a 120-second KV TTL.

The legacy route-context helper remains documented as best-effort because
EmDash 0.9 `KVAccess` only exposes `get / set / delete / list`; the public
submit route now uses the TTL-backed limiter above.
