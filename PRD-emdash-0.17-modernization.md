# Carte — EmDash 0.17 Modernization PRD

**Date:** 2026-06-11
**Status:** Draft for review
**Repo:** github.com/foreztgump/carte
**Current state:** v0.2.0-rc (Tender adapter), pinned `emdash ^0.9.0` — eight minors behind `0.17.2` (npm `latest`, 2026-06-05), pre-dating the v0.13 plugin-CLI migration
**Depends on:** Tender modernization M0 (`VERIFIED-PLATFORM-0.17.md`) and M4 (consumer eventing contract) — see `/home/cownose/projects/tender/PRD-emdash-0.17-modernization.md`

---

## 1. Background & Problem

Carte is a six-package restaurant plugin family. Unlike Tender it has a real `emdash` peer dependency — but at `^0.9.0`, and every plugin uses shapes the v0.13 migration removed or reclassified:

1. **All five plugins — including the three claiming "sandboxed" — use `definePlugin()`** (`core/src/index.ts:7,282`, `reservations/src/index.ts:11,78`, `orders-backend/src/index.ts:10,220`). In 0.17, `definePlugin()` is **native-format only**. As written, Carte's "sandboxed" plugins are native plugins: in-process, no isolation, no marketplace path, no capability enforcement beyond convention.
2. **No `emdash-plugin.jsonc` anywhere.** Capabilities/allowedHosts/storage live inline in descriptors (e.g. `orders-backend/src/index.ts:223-235`) — the trust contract is invisible to operators and the registry.
3. **Obsolete two-entrypoint layout**: `core/src/sandbox-entry.ts:1-13` is the removed pre-v0.13 shape.
4. **No `@emdash-cms/plugin-cli`**; bespoke per-package `wrangler.toml` files with manual `PLUGIN_KV` bindings (`core/wrangler.toml:8-12` etc.) stand in for the real packaging story.
5. **The v0.2 Tender reconciliation path is dead against the 0.17 baseline.** `orders-backend/src/index.ts:237-240` registers `"tender:payment.succeeded"` / `"tender:payment.refunded"` hooks cast `as never`; `events.ts:56-66` admits these are "PLACEHOLDERS pending EmDash 0.10 custom inter-plugin hook namespace dispatch." That dispatch never shipped. **On real EmDash, paid/refunded order state silently never updates.**
6. Invented/unverified surface treated as platform contract: `ctx.kv.atomicDecrement` (claimed in `reservations/src/index.ts:5` comments + costed in `scripts/sandbox-cost-table.json`, never actually called), hard "50ms CPU / 10 subrequests" budget caps encoded in `sandbox-cost-table.json:2-5` and enforced by `scripts/audit-sandbox-budget.ts`, and the native `admin.entry: "admin/index.js"` shape (`orders-admin/src/index.ts:35`, `ai/src/index.ts:73`) which needs verification against the documented react-admin path.
7. Pre-v0.13 terminology ("locally registered and trusted", `orders-admin/src/index.ts:4-6`) and design docs that codify the stale pin ("EmDash SDK remains pinned to ^0.9.0", `openspec/changes/PRO-v02-tender-adapter/design.md`).

**What already conforms (keep as-is):** `@carte/views` as a pure-props Astro library that is correctly _not_ a plugin (no `fetch(` in components — enforced by `views/src/index.test.ts:63`); JSON-LD per component; capability minimalism; plugin-scoped KV usage; Block Kit admin pages for sandboxed surfaces; React admin correctly implying native format for `orders-admin` and `ai`; the GDPR routes; the MIT/commercial licensing split.

## 2. Goals

- **G1** — `@carte/core`, `@carte/reservations`, `@carte/orders-backend` become true **sandboxed-format** plugins: `emdash-plugin.jsonc` + single `src/plugin.ts` bare default export `satisfies SandboxedPlugin`, built by `@emdash-cms/plugin-cli`.
- **G2** — `@carte/orders-admin`, `@carte/ai` become true **native-format** plugins via `definePlugin()` on `emdash@^0.17`, registered in `astro.config.mjs`, React admin mounted per the documented native path.
- **G3** — Order payment reconciliation works end-to-end on real EmDash using the **verified consumer eventing contract from Tender WS5** — no `tender:*` placeholder hooks remain.
- **G4** — Reservation capacity is race-safe **without** `ctx.kv.atomicDecrement`.
- **G5** — Family-wide e2e (menu publish → order → Tender charge → fulfilled; reservation request → confirm) green on a real EmDash 0.17 site in Node-workerd and `wrangler dev` modes.
- **G6** — `MIGRATION.md` v0.2→v0.3 operator guide; docs-site and all comments free of pre-v0.13 framing.

**Non-goals:** v0.3 feature roadmap (`@carte/floor-plan`, inventory, kitchen PWA, modifier engine); changing the Tender three-plugin payment model; rewriting `@carte/views` components; re-running competitive analysis.

## 3. Dependency contract with Tender

| Carte needs                                                                                                 | Provided by Tender PRD                                      | Gate                                                                          |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Verified 0.17 platform facts (hooks, routes, KV, post-response, Block Kit schema, native admin entry shape) | `VERIFIED-PLATFORM-0.17.md` (Tender M0/WS0)                 | Hard — do not start WS2 before it merges                                      |
| Payment event consumption mechanism                                                                         | Eventing contract + `@tender/sdk` typed API (Tender M4/WS5) | Hard for WS4; WS1–WS3 can proceed in parallel                                 |
| Charge/refund call path                                                                                     | `@tender/sdk` against real plugin routes                    | Already designed (Approach A); re-verify route mount + auth against WS0 facts |

If Tender WS5 lands Candidate A (afterSave on Tender's transaction collection), Carte consumes hooks; Candidate B, Carte exposes a callback route; Candidate C, the SDK polls. Carte must not re-invent its own mechanism.

## 4. Workstreams

### WS1 — Dependency bump & terminology purge

- `emdash ^0.9.0 → ^0.17` across root + all packages; add `@emdash-cms/plugin-cli`.
- Typecheck against real 0.17 types; remove every `as never` / `as unknown` cast that papered over 0.9 types — each cast site becomes either a verified API call or a WS-tracked rework item.
- Purge "trusted/locally registered" comments and the design-doc pin language. Update `AGENTS.md` baseline facts.
- CI canary job against `emdash@latest`.

### WS2 — Sandboxed conversion (core, reservations, orders-backend)

- Author `emdash-plugin.jsonc` per package: slug, Atmosphere publisher DID (reuse the Tender account or create a Carte one — decide once), license, security contact, minimal capabilities, `allowedHosts` (orders-backend: none external — Tender is reached via plugin routes, verify whether that requires an allowedHosts entry or `ctx.url()` per WS0 facts), `storage` (move the inline `storage: { carte_orders: { indexes... } }` schema from `orders-backend/src/index.ts:227-232` and `PluginStorageConfig` from `reservations/src/index.ts:29-37` into manifests, re-validated against the real manifest schema).
- Collapse each to single `src/plugin.ts` bare default export; delete `core/src/sandbox-entry.ts`; hooks/routes/admin-pages become internal modules.
- Replace bespoke `wrangler.toml` packaging with `emdash-plugin build/validate/bundle` in CI; tarballs are the artifacts.
- Re-validate Block Kit admin pages (`core/src/admin-pages.ts:13-37`) against the verified schema.
- Re-verify hook names `content:beforeSave/afterSave` registration shape (`core/src/index.ts:286-289`) against 0.17.

### WS3 — Native conversion (orders-admin, ai)

- Keep `definePlugin()` but on real 0.17 types; replace the unverified `admin.entry: "admin/index.js"` wiring with the documented react-admin mount; register in the harness site's `astro.config.mjs` `plugins: []`.
- `@carte/ai`: re-validate the BYO-LLM settings surface and the external `mcp-wrapper` Worker's route calls against verified route auth; confirm write-on-confirm/undo hardening (PRO-623 work) still holds under 0.17 semantics.

### WS4 — Tender reconciliation rebuild (the keystone)

- Delete the `tender:*` hook registrations (`orders-backend/src/index.ts:237-240`) and the placeholder dispatch in `events.ts`.
- Implement the WS5-contract consumer path; wire order state machine transitions (pending → paid → refunded) off it.
- Failure-mode handling: event delivery is at-least-once or polled — make order transitions idempotent by Tender transaction id.
- Integration test co-installing real Tender + Carte in the harness: checkout → Stripe test charge → order flips to paid; refund → order flips to refunded. This closes the gap that v0.1 deferred as M7-A034.

### WS5 — Reservations capacity without atomic KV

- Remove `atomicDecrement` claims (`reservations/src/index.ts:5`) and its row in `sandbox-cost-table.json`.
- Re-implement capacity as serialized writes against the reservations `storage` collection (D1 single-writer; unique constraint on slot key) with conflict-as-full semantics; KV remains a fast-path cache only.
- Load-sanity test: N concurrent bookings for M seats never oversells.

### WS6 — Budget tooling realignment

- Replace invented hard caps in `scripts/sandbox-cost-table.json` and `scripts/audit-sandbox-budget.ts` with measured limits from `VERIFIED-PLATFORM-0.17.md`; keep the audit script (it's good discipline) but mark advisory vs blocking based on real platform numbers. PRO-640's cap-display fix inherits the corrected numbers.

### WS7 — Docs, migration guide, release

- `MIGRATION.md`: v0.2→v0.3 section — manifest-based install replaces wrangler-var wiring; new Tender eventing; no operator-visible Stripe changes beyond what v0.2 already moved.
- docs-site (`docs-site/`): update plugin install pages to one-click/tarball + `astro.config.mjs` flows; regenerate per-plugin READMEs.
- Changesets: minor bump family-wide to v0.3.0-rc; update `LAUNCH_CHECKLIST.md` gates.

## 5. Acceptance criteria

1. Three sandboxed plugins load under both sandbox runners in the harness; `emdash-plugin validate` green in CI for all three.
2. Two native plugins register via `astro.config.mjs` and render their React admin in the panel.
3. Grep gates: zero hits for `sandbox-entry`, `tender:payment`, `atomicDecrement`, `as never` on plugin definitions, "trusted" (plugin sense).
4. Co-installed Tender+Carte e2e green: order paid + refunded state transitions driven by the real eventing contract.
5. Reservation oversell test green under concurrency.
6. No inline capability/storage declarations remain — manifests are the single trust contract.
7. PRO-623/PRO-638/PRO-640 fixes still pass their regression tests post-bump.

## 6. Risks & open questions

- **Tender WS5 outcome reshapes WS4** — if Candidate C (polling), order-state latency becomes a UX consideration for the kitchen/orders queue; document expected propagation time.
- **`storage` index schema in manifests** may not support the indexes orders-backend declares — fall back to query-shape changes, not schema hacks.
- **Vicky's Kitchen M5** (downstream install) is blocked on this work; rc timeline pressure — mitigate by landing WS1+WS2 for `core` first so menu features unblock independently of payments.
- **Publisher DID strategy** (one DID for Tender+Carte+Dateline vs per-family) — decide once in WS2, affects marketplace identity permanently.

## 7. Milestones

1. **M1** — WS1 bump + purge; core converted (WS2 partial) and loading sandboxed.
2. **M2** — reservations + orders-backend converted; WS5 capacity rework.
3. **M3** — WS3 native conversions.
4. **M4** — WS4 reconciliation on Tender contract; co-install e2e green. _(Gated on Tender M4.)_
5. **M5** — WS6 + WS7; tag v0.3.0-rc; unblock Vicky's Kitchen M5.
