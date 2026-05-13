# Carte — EmDash Restaurant Plugin Family

Carte is the restaurant plugin family for [EmDash](https://emdash.dev) —
menus, reservations, Stripe ordering, and AI-native admin for independent
restaurants on Cloudflare Workers. The v0.1 family ships six plugins:
`@carte/core`, `@carte/reservations`, `@carte/orders-backend`,
`@carte/orders-admin`, `@carte/views`, and `@carte/ai`.

- **Spec:** [PRD.md](./PRD.md)
- **Competitive analysis:** [docs/competitive-analysis/](./docs/competitive-analysis/)
- **Conventions:** [AGENTS.md](./AGENTS.md), [CODE_PRINCIPLES.md](./CODE_PRINCIPLES.md)
- **Contributing:** [CONTRIBUTING.md](./CONTRIBUTING.md)
- **License:** [LICENSE](./LICENSE) (MIT for the open-source plugins;
  `@carte/ai` ships under a separate commercial NOTICE — see
  [packages/ai/LICENSE](./packages/ai/LICENSE)).

## Documentation

- [CHANGELOG.md](./CHANGELOG.md) — release history.
- [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md) — v0.1 launch gate.
- [WRAP_UP.md](./WRAP_UP.md) — v0.1 mission retrospective.
- [SECURITY.md](./SECURITY.md) — vulnerability reporting + threat model.
- [docs-site/](./docs-site/) — public Starlight documentation site
  (build via `pnpm --filter @carte/docs build`).
- Per-plugin overviews:
  - [`@carte/core`](./packages/core/README.md)
  - [`@carte/reservations`](./packages/reservations/README.md)
  - [`@carte/orders-backend`](./packages/orders-backend/README.md)
  - [`@carte/orders-admin`](./packages/orders-admin/README.md)
  - [`@carte/views`](./packages/views/README.md)
  - [`@carte/ai`](./packages/ai/README.md)

## What's next (v0.2 roadmap)

After the PRO-418 launch gate, v0.2 focuses on operations and UX work from the
PRD roadmap: `@carte/floor-plan`, limited-quantity inventory, an embedded
Payment Element option, kitchen order-status PWA, and an advanced modifier
engine. Successor Linear issues already tracking follow-up hardening include
[PRO-623](https://linear.app/projects-linear/issue/PRO-623/m8-follow-ups-pii-boundary-workspace-least-privilege-undo-correctness),
[PRO-638](https://linear.app/projects-linear/issue/PRO-638/carteviews-dietaryfilter-crashes-on-unknown-allergen-tag-tolowercase),
[PRO-640](https://linear.app/projects-linear/issue/PRO-640/sandbox-budget-display-drift),
and the Tender-migration epic
[PRO-727](https://linear.app/projects-linear/issue/PRO-727/carte-tender-adapter-route-carteorders-backend-through-tendersdk)
(carte → tender adapter for `@carte/orders-backend`); new PRO-419+ v0.2
epics should be linked here as they are opened.
