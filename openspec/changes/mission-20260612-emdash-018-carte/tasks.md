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
- [ ] 1.2 Typecheck on real 0.18 types; eliminate every `as never`/`as unknown` cast (verified call or tracked rework item) — baseline `as never` at `allergens.test.ts:77` eliminated (typed `AllergenAuditEvent`); `orders-backend/src/index.ts:236` cast deferred to M2 (dies with tender purge)
- [ ] 1.3 Purge pre-v0.13 terminology ("trusted", "locally registered") + stale design-doc pin language; update `AGENTS.md` baseline facts (incl. `^0.9.0` pin note, subrequest-cap correction)
- [ ] 1.4 CI canary job against `emdash@latest`
- [ ] 1.5 Convert `@carte/core`: author `emdash-plugin.jsonc`, collapse to `src/plugin.ts`, delete `src/sandbox-entry.ts`, plugin-cli build/validate in CI
- [ ] 1.6 Regression: PRO-623/PRO-638/PRO-640 tests pass post-bump

## M2 — WS2 remainder + WS5 capacity (PRO-855, PRO-860)

- [ ] 2.1 HITL: decide publisher DID strategy (reuse Tender account vs Carte-family DID)
- [ ] 2.2 Convert `@carte/reservations`: manifest (storage schema from `PluginStorageConfig`), `src/plugin.ts`, plugin-cli CI
- [ ] 2.3 Convert `@carte/orders-backend`: manifest (inline `storage`/`capabilities`/`allowedHosts` moved out; allowedHosts = `["license.carteplugin.dev"]`), `src/plugin.ts`
- [ ] 2.4 Delete dead `tender:*` hook registrations + placeholder dispatch; leave idempotent order-state trigger interface (WS4 seam, keyed on transaction id)
- [ ] 2.5 Remove `atomicDecrement` claims; reimplement capacity as D1 single-writer with unique slot-key constraint, conflict-as-full; KV as cache only
- [ ] 2.6 Oversell load test: N concurrent bookings for M seats never oversells
- [ ] 2.7 Re-validate Block Kit admin pages against verified schema; delete bespoke `wrangler.toml` packaging; tarball artifacts in CI

## M3 — WS3 native conversions (PRO-856)

- [ ] 3.1 `@carte/orders-admin`: `definePlugin()` on 0.18 types; documented react-admin mount replaces `admin.entry`; register in harness `astro.config.mjs`
- [ ] 3.2 `@carte/ai`: same conversion; re-validate BYO-LLM settings surface + mcp-wrapper route auth against verified facts
- [ ] 3.3 Confirm PRO-623 write-on-confirm/undo hardening holds under 0.18 semantics
- [ ] 3.4 Both natives render React admin in the harness panel (e2e evidence)

## M4 — WS6 budget + WS7 docs/release (PRO-862, PRO-865)

- [ ] 4.1 `sandbox-cost-table.json`: per-runner columns with M0 measured numbers; remove `atomicDecrement` row
- [ ] 4.2 `audit-sandbox-budget.ts`: read caps from cost table (closes the PRO-640 pattern); blocking (Cloudflare) vs advisory (workerd)
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
