# Design: EmDash 0.18 modernization — Carte v0.3

Research basis: `/tmp/droid-findings/emdash-0.18-research-findings.md` (2026-06-12). Authoritative offline platform docs: `~/.claude/skills/emdash/SKILL.md` + `references/plugin-cheatsheet.md`. Everything not covered there is verified empirically in M0 and recorded in `docs/VERIFIED-PLATFORM-0.18-carte.md`.

## D1 — Self-verification replaces the Tender gate

The PRD gates WS2 on Tender's `VERIFIED-PLATFORM-0.17.md`, which does not exist (it is an unshipped Tender M0 deliverable). Decision (operator-ratified 2026-06-12): Carte self-verifies against installed `emdash@0.18` in its own harness. The verification doc is Carte-owned (`docs/VERIFIED-PLATFORM-0.18-carte.md`) and covers exactly the facts M1–M4 consume: manifest schema acceptance, both sandbox runners, hook names/signatures, route mount + auth, Block Kit schema, native react-admin mount, measured limits per runner.

## D2 — Sandboxed-format conversion shape

Per package (`core`, `reservations`, `orders-backend`):

- `emdash-plugin.jsonc`: `slug`, `publisher` (DID — see D5), `license`, `author`, `security`, minimal `capabilities`, `allowedHosts` (orders-backend: `["license.carteplugin.dev"]` only), `storage` with `indexes`/`uniqueIndexes` moved from inline descriptors. `version` lives in `package.json` only (build reconciles).
- Single `src/plugin.ts` bare default export `satisfies SandboxedPlugin` (type-only import from `emdash/plugin`); hooks/routes/admin-pages become internal modules. Delete `core/src/sandbox-entry.ts`.
- Build: `emdash-plugin build/validate/bundle` in CI; tarballs are the artifacts; bespoke `wrangler.toml` files deleted. `package.json` exports: `"."` → `dist/index.mjs`, `"./sandbox"` → `dist/plugin.mjs`; `peerDependencies: { "emdash": ">=0.13.0" }`.
- Install path documented as `astro.config.mjs` `sandboxed: [...]` + `sandboxRunner:` — there is no `emdash-plugin install` command.

## D3 — Native-format conversion shape

`orders-admin` and `ai` keep `definePlugin()` on real 0.18 types. The unverified `admin.entry: "admin/index.js"` is replaced by the documented mount: `./admin` export with React components (full pages) or `admin.settingsSchema` (auto-form) where sufficient. Registered in the harness site's `astro.config.mjs` `plugins: []`. Obsolete descriptor fields (`entrypoint`, `format`, `adminEntry`, `adminPages`) are purged and grep-gated.

## D4 — Reservation capacity without atomic KV

`ctx.kv` is plain get/set/delete/list — no atomic ops. Capacity becomes serialized writes against the reservations `storage` collection (D1 single-writer): unique constraint on slot key, insert-conflict-as-full semantics. KV remains a fast-path read cache only. Oversell load test: N concurrent bookings for M seats never exceeds M.

## D5 — Publisher DID (HITL)

`slug + publisher` is permanent marketplace identity. Decision deferred to a human gate in M2 before any registry interaction: reuse the Tender Atmosphere account vs create a Carte-family DID. `emdash-plugin login` (atproto OAuth) is itself a human gate; registry operations are deferred if blocked — bundle/validate do not require login.

## D6 — Tender eventing seam (WS4 excluded)

The `tender:*` hook namespace is confirmed absent from the platform; the placeholder dispatch never worked. During WS2's orders-backend conversion: delete the `tender:*` registrations and placeholder dispatch, keep the order state machine (pending → paid → refunded) behind a single idempotent trigger interface keyed on Tender transaction id. WS4 (PRO-859) wires the real trigger when Tender ships Candidate A (cross-plugin `content:afterSave`), B (callback route), or C (SDK polling). Carte must not invent its own mechanism.

## D7 — Budget tooling per-runner

Measured-limit model: Cloudflare runner enforces 50ms CPU / 10 subrequests / 30s wall; workerd runner enforces wall-clock only. `scripts/sandbox-cost-table.json` gains a runner dimension; `scripts/audit-sandbox-budget.ts` reads caps from the table (PRO-640 fix inherits) and marks checks blocking (Cloudflare) vs advisory (workerd). Numbers are sourced from M0 measurements, not assumptions.

## D8 — React 19 duplicate resolution (PRO-764)

Root cause: `orders-admin` pins react 19.2.5, `ai` pins 19.2.6 — two React copies in the pnpm workspace null the hooks dispatcher under Vitest+jsdom. Fix: align pins, root `pnpm.overrides` for react/react-dom, `resolve.dedupe: ["react", "react-dom"]` in package-level vitest configs. Then remove the two `.skip` quarantines (TODO(PRO-CARTE-AI-REACT19)) and confirm green.

## Grep gates (CI)

Zero hits post-mission: `sandbox-entry`, `tender:payment`, `atomicDecrement`, `as never` (plugin definitions), `"trusted"` (plugin sense), `ctx.logger`, `putIfAbsent`, `adminEntry`, `format: "native"`, `adminPages`.
