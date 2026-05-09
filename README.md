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

## What's next (v0.2 roadmap)

After the PRO-418 launch gate, v0.2 focuses on operations and UX work from the
PRD roadmap: `@carte/floor-plan`, limited-quantity inventory, an embedded
Payment Element option, kitchen order-status PWA, and an advanced modifier
engine. Successor Linear issues already tracking follow-up hardening include
[PRO-623](https://linear.app/projects-linear/issue/PRO-623/m8-follow-ups-pii-boundary-workspace-least-privilege-undo-correctness)
and
[PRO-638](https://linear.app/projects-linear/issue/PRO-638/carteviews-dietaryfilter-crashes-on-unknown-allergen-tag-tolowercase);
new PRO-419+ v0.2 epics should be linked here as they are opened.
