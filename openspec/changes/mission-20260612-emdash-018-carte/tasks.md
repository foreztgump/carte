# Tasks: mission-20260612-emdash-018-carte

One milestone = one PR through `pr-agent-runner` (mission_dir set; 0 P0/P1 before merge). Update mapped Linear issues on start/complete.

## M0 — Platform self-verification (new Linear sub-issue of PRO-848)

- [x] 0.1 Stand up minimal EmDash 0.18 harness site (Astro + emdash, Node-workerd runner; `wrangler dev` mode secondary)
- [x] 0.2 Verify sandboxed-format load path: hello plugin with `emdash-plugin.jsonc` + `src/plugin.ts` loads under the workerd harness; record Cloudflare runner probe infeasibility and doc-sourced facts
- [x] 0.3 Verify manifest schema acceptance: capabilities, allowedHosts, storage `indexes` + `uniqueIndexes`; `emdash-plugin validate` behavior
- [x] 0.4 Verify hook names/signatures (`content:beforeSave/afterSave`, config-object form), route mount `/_emdash/api/plugins/<slug>/<route>` + auth, Block Kit admin schema
- [x] 0.5 Verify native react-admin mount shape (`./admin` export / `admin.settingsSchema`) with the harness descriptor entrypoint plus `definePlugin()` settings schema
- [x] 0.6 Measure runtime limits per runner; record everything in `docs/VERIFIED-PLATFORM-0.18-carte.md` with evidence per claim

## M1 — WS1 bump + purge; core converted (PRO-852, PRO-855 partial)

- [x] 1.1 Bump `emdash ^0.9.0 → ^0.18` root + all packages; add `@emdash-cms/plugin-cli` exact-pinned 0.5.1
- [ ] 1.2 Typecheck on real 0.18 types; eliminate every `as never`/`as unknown` cast (verified call or tracked rework item) — baseline `as never` at `allergens.test.ts:77` eliminated (typed `AllergenAuditEvent`); `orders-backend/src/index.ts:236` cast eliminated in M2 (died with the tender purge — orders-backend surface is now `as never`/`as unknown` zero-hit)
- [x] 1.3 Purge pre-v0.13 terminology ("trusted", "locally registered") + stale design-doc pin language; update `AGENTS.md` baseline facts (incl. `^0.9.0` pin note, subrequest-cap correction)
- [x] 1.4 CI canary job against `emdash@latest` — scheduled non-blocking workflow `.github/workflows/canary.yml` (daily cron + `workflow_dispatch`, `continue-on-error: true`) installs `emdash@latest` (overriding the pin via `pnpm update -r emdash@latest`) and runs `pnpm -r typecheck` + plugin-cli `validate`/`build` for `@carte/core`. Main `ci.yml` now also runs `emdash-plugin validate` + `build` for `packages/core` (M2 extends to reservations + orders-backend). Both YAMLs parse.
- [x] 1.5 Convert `@carte/core`: author `emdash-plugin.jsonc`, collapse to `src/plugin.ts` (was `src/index.ts`), delete `wrangler.toml`, plugin-cli build/validate green, harness load confirmed (`Loaded sandboxed plugin carte-core:0.1.0`), admin Block Kit renders. **RESOLVED**: the sandbox-workerd 0.1.6 LEGACY-vs-CANONICAL capability divergence is fixed by a committed `pnpm patch` (`patches/@emdash-cms__sandbox-workerd@0.1.6.patch` + `pnpm.patchedDependencies`) that makes the bridge `requireCapability` accept both forms; manifests stay canonical. In-sandbox `ctx.content` round-trip re-verified (`menu-feed` returns real JSON). See `docs/VERIFIED-PLATFORM-0.18-carte.md` §8.
- [ ] 1.6 Regression: PRO-623/PRO-638/PRO-640 tests pass post-bump

## M2 — WS2 remainder + WS5 capacity (PRO-855, PRO-860)

- [ ] 2.1 HITL: decide publisher DID strategy (reuse Tender account vs Carte-family DID)
- [ ] 2.2 Convert `@carte/reservations`: manifest (storage schema from `PluginStorageConfig`), `src/plugin.ts`, plugin-cli CI
- [x] 2.3 Convert `@carte/orders-backend`: `emdash-plugin.jsonc` manifest (inline `storage`/`capabilities`/`allowedHosts` moved out; `carte_orders` storage; allowedHosts = `["license.carteplugin.dev"]`; publisher DID placeholder), `src/plugin.ts` `SandboxedPlugin` const with two-arg `adaptRoute` bridge; `@tender/sdk` made a build-time-only dependency so it is bundled into the self-contained sandbox output; harness registration; self-contained `emdash-plugin build` verified (no external imports, `hooks: []`); `as never`/`as unknown` gate now zero-hit on the orders-backend surface
- [x] 2.4 Delete dead `tender:*` hook registrations + placeholder dispatch; leave idempotent order-state trigger interface (WS4 seam, keyed on transaction id) — single exported `applyTenderTransaction(ctx, event)` with write-then-verify KV idempotency marker keyed on transaction id, in-request only (no post-response primitive); RED test `events.test.ts` covers exactly-once, paid→refunded progression, duplicate no-op, concurrent dedup
- [x] 2.5 Remove `atomicDecrement` claims; reimplement capacity as D1 single-writer with unique slot-key constraint, conflict-as-full; KV as cache only
- [x] 2.6 Oversell load test: N concurrent bookings for M seats never oversells
- [x] 2.7 Re-validate Block Kit admin pages against verified schema; delete bespoke `wrangler.toml` packaging; tarball artifacts in CI — `ci.yml` now loops `emdash-plugin validate` + `build` + `bundle` over `core`, `reservations`, `orders-backend` (dist/ asserted via `ls`, exit-code-unreliable workaround), and an `actions/upload-artifact@v4` step uploads `packages/*/dist/*.tar.gz` (`if-no-files-found: error`); no `wrangler.toml` packaging exists anywhere (removed in M1); all three plugins load in the harness (`Loaded sandboxed plugin carte-{core,reservations,orders-backend}`) with Block Kit admin pages rendering client-side (agent-browser: core `actions` block buttons, reservations + orders stats/sections, no ActionsBlock crash); zero registry ops in CI; local `emdash-plugin bundle` spot-check produced `carte-core-0.1.0.tar.gz`

## M3 — WS3 native conversions (PRO-856)

- [x] 3.1 `@carte/orders-admin`: `definePlugin()` on 0.18 types; documented react-admin mount replaces `admin.entry`; register in harness `astro.config.mjs` (named `createPlugin` export + flat `entrypoint`/`adminEntry` package specifiers; `astro build` Rollup green)
- [x] 3.2 `@carte/ai`: same conversion; re-validate BYO-LLM settings surface + mcp-wrapper route auth against verified facts
- [ ] 3.3 Confirm PRO-623 write-on-confirm/undo hardening holds under 0.18 semantics
- [x] 3.4 Both natives render React admin in the harness panel (e2e evidence) — manifest `adminMode:"react"` for both; `carte-orders` renders "Carte Orders" queue, `carte-ai` renders "Carte AI" chat panel; only benign `use-sync-external-store` advisory in console. Screenshots: `validation/M3/pro856-orders-admin-RENDERS.png`, `validation/M3/pro856-ai-admin-RENDERS.png`

## M4 — WS6 budget + WS7 docs/release (PRO-862, PRO-865)

- [x] 4.1 `sandbox-cost-table.json`: per-runner columns with M0 measured numbers; remove `atomicDecrement` row
- [x] 4.2 `audit-sandbox-budget.ts`: read caps from cost table (closes the PRO-640 pattern); blocking (Cloudflare) vs advisory (workerd)
- [ ] 4.3 `MIGRATION.md` v0.2→v0.3: manifest-based install, no `emdash-plugin install` command (astro.config.mjs `sandboxed:[]` + `sandboxRunner`), Tender eventing status
- [ ] 4.4 docs-site install pages + per-plugin READMEs (incl. Cloudflare Free = no sandboxed isolation note)
- [ ] 4.5 Changesets: family-wide minor to v0.3.0-rc; update `LAUNCH_CHECKLIST.md` gates (publish stays blocked on PRO-766)
- [ ] 4.6 CI grep gates green: `sandbox-entry`, `tender:payment`, `atomicDecrement`, plugin-def `as never`, "trusted", `ctx.logger`, `putIfAbsent`, `adminEntry`, `format: "native"`, `adminPages`

## M5 — Bug cleanup (PRO-764, PRO-770, PRO-769, PRO-496)

- [ ] 5.1 PRO-764: align react/react-dom pins; root `pnpm.overrides`; `resolve.dedupe` in vitest configs; un-skip TODO(PRO-CARTE-AI-REACT19) tests, confirm green
- [ ] 5.2 PRO-770: sync pr-agent env-var pins in mission AGENTS.md from `~/.factory/skills/pr-agent-runner/SKILL.md`
- [ ] 5.3 PRO-769: IPv6 coverage (`::1`, `::ffff:` mapped, ULA `fc00::/7`, link-local `fe80::/10`) in `isLocalOrPrivateHost` + tests
- [ ] 5.4 PRO-496: resolve deferred core collection schema surface per issue scope
- [ ] 5.5 Close all mapped Linear issues; final epic comment on PRO-848
