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

## v0.2.0 — Tender adapter (rc)

Carte v0.2.0-rc moves `@carte/orders-backend` from direct Stripe calls to the
Tender adapter tracked by
[PRO-727](https://linear.app/projects-linear/issue/PRO-727/carte-tender-adapter-route-carteorders-backend-through-tendersdk).
The rc also closes the v0.1 tech-debt follow-ups for AI write-on-confirm
hardening
([PRO-623](https://linear.app/projects-linear/issue/PRO-623/m8-follow-ups-pii-boundary-workspace-least-privilege-undo-correctness)),
DietaryFilter fallback rendering
([PRO-638](https://linear.app/projects-linear/issue/PRO-638/carteviews-dietaryfilter-crashes-on-unknown-allergen-tag-tolowercase)),
and sandbox-budget cap display
([PRO-640](https://linear.app/projects-linear/issue/PRO-640/sandbox-budget-display-drift)).

Existing operators should follow the
[v0.2.0-rc migration guide](./MIGRATION.md) before installing the rc: update the
Stripe dashboard webhook URL to Tender, move Stripe secrets to the
`@tender/stripe` settings surface, and install the three-plugin Tender payment
model. The rc publish and tag remain tracked by
[PRO-737](https://linear.app/projects-linear/issue/PRO-737/publish-carteorders-backend020-rc-and-tag-release).

## What's next (v0.3 roadmap)

After the Tender rc unblocks Vicky's Kitchen M5, v0.3 can return to the PRD's
operations and UX roadmap: `@carte/floor-plan`, limited-quantity inventory,
kitchen order-status PWA, advanced modifier engine, and the production feedback
that comes from running the Tender payment model in downstream installs.
