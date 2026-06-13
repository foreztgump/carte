# Carte v0.1 Launch Checklist

This checklist tracks the PRO-418 launch gate for the first live restaurant client and maps each success metric to a concrete verification surface. Sources: Linear PRO-418 success metrics; `PRD.md:1041-1051`; M10 mission scope in `/home/cownose/.factory/missions/343410ef-f054-4252-b8e2-7a108ff4e717/mission.md`.

## PRO-418 success metrics

| metric                                                                       | verification command/URL                                                                                                                                                               | owner             |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| Live restaurant client launches successfully                                 | HITL sign-off after menu import, hours, branding, test reservation, and test Stripe Checkout on the client's EmDash site; record evidence in PRO-418                                   | restaurant-client |
| Schema.org passes Google Rich Results Test for Restaurant + Menu             | `pnpm verify:rich-results --url https://<restaurant-domain>/_emdash/api/plugins/carte-core/schema-jsonld`, then confirm the live page in <https://search.google.com/test/rich-results> | external-tool     |
| All sandboxed handlers stay within the EmDash sandbox quota                  | `pnpm tsx scripts/audit-sandbox-budget.ts`                                                                                                                                             | developer         |
| AI chat handles 86 / price update / block date / move reservation end-to-end | `pnpm exec playwright test e2e/ai-chat-launch` plus a restaurant-client smoke pass against real data before go-live                                                                    | developer         |
| Public docs site is live                                                     | `pnpm --filter @carte/docs build`, then publish the build output to the chosen docs host and verify the public URL returns 200                                                         | developer         |

## EmDash 0.18 build & release gates (v0.3.0-rc)

These gates verify the v0.3.0-rc family on the EmDash 0.18 manifest-based model.
Installation is an `astro.config.mjs` edit (`sandboxed: []` + `sandboxRunner` for
the three sandboxed plugins; `plugins: []` for the two natives) — there is **no
`emdash-plugin install` command**. See `MIGRATION.md` for the full install model.

| gate                                                                             | verification command/URL                                                                                                                                                                                                                                                                                 | owner           | status                                   |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ---------------------------------------- |
| Sandboxed manifests validate, build, and bundle in CI                            | `ci.yml` loops `emdash-plugin validate` + `build` + `bundle` over `core`, `reservations`, `orders-backend`; dist/ asserted via `ls` (exit code unreliable when piped)                                                                                                                                    | developer       | [x] wired in `.github/workflows/ci.yml`  |
| Sandboxed bundle tarballs uploaded as CI artifacts                               | `actions/upload-artifact@v4` step uploads `packages/*/dist/*.tar.gz` (`if-no-files-found: error`)                                                                                                                                                                                                        | developer       | [x] wired in `.github/workflows/ci.yml`  |
| Harness e2e evidence: all three sandboxed plugins load + Block Kit admin renders | Start `harness/` (`pnpm --dir harness dev`), confirm `Loaded sandboxed plugin carte-{core,reservations,orders-backend}` and admin pages render (agent-browser screenshots)                                                                                                                               | developer       | [x] evidence in mission `validation/`    |
| Harness e2e evidence: both native React admins render                            | Confirm `carte-orders` + `carte-ai` admin panels render in the harness shell (no error boundary); screenshots captured                                                                                                                                                                                   | developer       | [x] evidence in mission `validation/M3/` |
| Per-runner sandbox budget audit passes                                           | `pnpm audit:sandbox-budget` — Cloudflare-runner cap breaches FAIL (exit 1), workerd wall-clock concerns are advisory (WARN, exit 0)                                                                                                                                                                      | developer       | [x] `scripts/audit-sandbox-budget.ts`    |
| Capability-name patch applied on install                                         | `pnpm install` re-applies `patches/@emdash-cms__sandbox-workerd@0.1.6.patch` (see `MIGRATION.md` known issue); manifests stay canonical                                                                                                                                                                  | developer       | [x] wired via `pnpm.patchedDependencies` |
| Changesets stage the family minor bump to `0.3.0-rc`                             | `pnpm changeset status` lists the family at minor level                                                                                                                                                                                                                                                  | developer       | tracked under M4                         |
| **npm publish of the v0.3.0-rc family**                                          | `emdash-plugin` registry publish — **BLOCKED on [PRO-766](https://linear.app/projects-linear/issue/PRO-766/external-prereq-tender-team-publishes-tendersdk010-tender-core-tender)** (Tender team must publish `@tender/sdk@0.1.0` + `tender-core` + `tender-stripe`). No registry ops until this clears. | external-prereq | [ ] BLOCKED (PRO-766)                    |

## HITL-deferred items

The following items are intentionally not completed by autonomous workers because they require a live restaurant, a deployed URL, authenticated external tooling, or business approval.

- **Real restaurant onboarding** — Owner: `restaurant-client`. Verify by importing the client's real menu, hours, branding, reservation settings, Stripe account, and AI workspace; source: PRO-418 scope and `PRD.md:1001-1018`.
- **Lighthouse perf ≥ 80 on the deployed storefront/docs surface** — Owner: `external-tool`. Verify with Lighthouse in Chrome DevTools or PageSpeed Insights against the live URL; mission gate is HITL-deferred per `/home/cownose/.factory/missions/343410ef-f054-4252-b8e2-7a108ff4e717/mission.md`.
- **axe a11y zero serious+critical on deployed pages** — Owner: `external-tool`. Verify with an axe browser extension or Playwright/axe against the live restaurant URL; mission gate is HITL-deferred per `/home/cownose/.factory/missions/343410ef-f054-4252-b8e2-7a108ff4e717/mission.md`.
- **Google Rich Results live pass** — Owner: `external-tool`. Verify with `pnpm verify:rich-results --url https://<restaurant-domain>/_emdash/api/plugins/carte-core/schema-jsonld` and <https://search.google.com/test/rich-results>; source: PRO-418 and `PRD.md:1043-1051`.
- **EmDash marketplace listing** — Owner: `external-tool`. Verify in the EmDash marketplace when that marketplace is available; source: PRO-418 scope and mission out-of-scope guidance.
- **PRO-423 / PRD OQ#3 order-tracking notifications** — Owner: `developer`. Deferred to v0.2 / future `@carte/ops`; v0.1 is email-first. Source: `PRD.md:1066-1068`.
- **PRD OQ#8 Stripe Connect for multi-location** — Owner: `developer`. Deferred to v0.3 multi-location work because v0.1 is single-location. Source: `PRD.md:1074`.
- **PRD OQ#11 nested/advanced modifier engine** — Owner: `developer`. v0.1 keeps single-tier modifiers; nested modifier trees are a v0.2 roadmap item. Source: `PRD.md:1077`.
- **PRO-423 / PRD OQ#12 cancellation policy enforcement** — Owner: `developer`. Deferred to v0.2 / future `@carte/ops`; v0.1 stores and communicates policies without automated late-cancellation charges. Source: `PRD.md:1078-1080`.
- **PRO-623 M8 follow-ups** — Owner: `developer`. Non-blocking AI hardening follow-ups from M8 review remain tracked as successor work; verify via Linear PRO-623.

## Sign-off

- [ ] Developer sign-off recorded in PRO-418
- [ ] Restaurant-client sign-off recorded in PRO-418
- [ ] External-tool evidence attached for Rich Results, Lighthouse, and axe
- [ ] PRO-418 moved to Done after PR merge and launch evidence
