# Changelog

All notable changes to this project will be documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.0.1 — 2026-05-06 (mission close)

This release closes the **WP Analysis + OQ Resolution + Monorepo Scaffolding** mission (Factory mission `d702a513-34b3-427e-85eb-59c759f31778`). It contains no plugin business logic — only documentation, locked decisions, and the empty monorepo skeleton against which the per-plugin missions will execute.

### Added — Milestone 0 (competitive analysis)

- `docs/competitive-analysis/latepoint.md` — full teardown of LatePoint (87 unique citations, ADAPT verdict on time-slot algorithm).
- `docs/competitive-analysis/orderable-pro.md` — full teardown of Orderable Pro (95 citations; OQ#11 single-tier modifier recommendation).
- `docs/competitive-analysis/restrofood.md` — full teardown of RestroFood (93 citations).
- `docs/competitive-analysis/adoptable-patterns.md` — synthesis (11 patterns, 4 MUST-ADOPT).
- `docs/competitive-analysis/avoid.md` — anti-patterns (6 chronic-problem sections + 7 footguns; includes RestroFood licensing footgun).
- Linear backlog reconciliation: 7 sub-tasks (PRO-470 through PRO-476).

### Added — Milestone 1 (open questions locked)

- All 12 PRD `Open Questions` resolved (9 RESOLVED, 3 DEFERRED to v0.2/v0.3).
- Canonical EmDash capability names (`content:read`, `content:write`, `media:read`, `media:write`, `network:request[:unrestricted]`, `email:send`, `users:read`) locked across PRD + AGENTS.
- EmDash plugin SDK pinned to `^0.9.0`; emdash@1.0.0 explicitly avoided.
- Sandbox runtime caps locked (50ms CPU + 10 subrequests + 30s wall + 128MB memory).
- `@carte/ai` trial licensing pattern locked (server-side check at `license.carteplugin.dev` + 24hr KV cache + graceful degrade + Lemon Squeezy billing).
- MCP interim plan documented (plugin routes + standalone wrapper Worker until EmDash ships custom MCP tool registration; upstream comment on emdash discussion #850).
- `AGENTS.md` Linear branch/commit prefix changed from CART to PRO.
- `PRD.md §Competitive Analysis` slimmed to a 4-bullet pointer into `docs/competitive-analysis/` (the marketing table moved out).

### Added — Milestone 2 (monorepo scaffolding)

- `pnpm-workspace.yaml` with 6 plugin packages: `@carte/{core, reservations, orders-backend, orders-admin, views, ai}`.
- TypeScript strict mode (noUncheckedIndexedAccess + exactOptionalPropertyTypes), ESLint flat config v9, Prettier, husky pre-commit + lint-staged.
- Vitest 2.1.9 workspace runner (vitest.workspace.ts) with per-package shims; 12 smoke tests passing (2 per package); TDD discipline (RED before GREEN) verifiable in commit log.
- Playwright 1.59.1 config at root (no specs — deferred to per-plugin missions).
- Wrangler 4.x configs for the 3 sandboxed plugins (`@carte/core`, `@carte/reservations`, `@carte/orders-backend`); `.dev.vars.example` at repo root.
- GitHub Actions CI: typecheck + lint + build (if-present) + test + AgentShield scan; runs on `pull_request` + `push: branches: [main]`.
- Changesets per-package semver (`@changesets/cli` + `@changesets/changelog-github`).
- `README.md`, `CONTRIBUTING.md`, root `LICENSE` (MIT), `packages/ai/LICENSE` (commercial NOTICE), `.editorconfig`.

### Notes

- `@carte/ai` is the only commercial plugin in v0.0.1 (commercial NOTICE; 14-day trial + $99/yr per PRD).
- `@carte/views` is a peer-dep library (no `definePlugin` manifest, no Wrangler config).
- All plugin packages start at `0.1.0` for the next per-plugin missions to bump.
- No plugin handler implementations land in this release — only `{ ok: true, plugin, route }` route stubs.

### Boundary

- GPL clean-room: vendored `research/sources/carte/` source files were never modified across the mission; PHP snippets in competitive-analysis docs ≤5 lines per quote.
