# Design

## Module decomposition (current change)

Two layers:

1. **Root scaffolding** — workspace plumbing only. Every file at the repo root is a build/test/style configuration that fans out across `packages/*` via pnpm or eslint glob discovery. Nothing here ships to npm.
2. **Per-plugin package** — six leaf packages under `packages/`. Each is structurally identical: `package.json` (name, version, peer-dep, scripts), `tsconfig.json` (extends root), `src/index.ts` (one default export), `src/index.test.ts` (one Vitest spec), `README.md` (one paragraph + status). Five of the six packages export a `definePlugin()` manifest factory; `@carte/views` exports a placeholder component shape (it is a peer-dep React/Astro library, not an EmDash plugin).

## Dependency direction

Root → packages, never the reverse. No package imports another package in this change (no real wiring yet). `emdash` is a peer dependency on every plugin package; `vitest` and `typescript` are dev dependencies on every package; the `emdash` runtime is also installed as a root dev dependency so the smoke tests can exercise the actual `definePlugin()` runtime.

## Capability declarations (canonical names, sourced from PRD §"Capability Manifests")

| Package | Type | Capabilities | allowedHosts | Routes |
|---|---|---|---|---|
| `@carte/core` | sandboxed | `content:read`, `content:write`, `media:read` | (none) | `admin`, `menu-feed`, `schema-jsonld` |
| `@carte/reservations` | sandboxed | `content:read`, `content:write`, `email:send` | (none) | `admin`, `submit`, `confirm`, `cancel-by-token` |
| `@carte/orders-backend` | sandboxed | `content:read`, `content:write`, `email:send`, `network:request` | `api.stripe.com`, `checkout.stripe.com` | `admin`, `checkout`, `webhook-stripe`, `refund` |
| `@carte/orders-admin` | native | `content:read`, `content:write` | (none) | `admin` |
| `@carte/views` | native (peer-dep library) | (none — ships no manifest) | (none) | (none) |
| `@carte/ai` | native (paid SKU) | `content:read`, `content:write`, `network:request` | `api.anthropic.com`, `api.openai.com`, `generativelanguage.googleapis.com`, `license.carteplugin.dev` | `admin`, `chat-stream`, `tool-call`, `history`, `license-check` |

All capability strings come from the union exported by `emdash@^0.9.0`'s `PluginCapability` type. Any deviation (e.g., `read:content`) is a deprecated alias; sources in this repo use only the current canonical names. `network:request:unrestricted` is forbidden — `@carte/orders-backend` and `@carte/ai` declare `allowedHosts` whitelists.

## Why hand-rolled (not `npm create emdash@latest`)

The scaffolder produces a single Astro app with the EmDash runtime mounted as one Astro integration. Carte is a multi-package plugin family that ships to npm (and a paid SKU via Lemon Squeezy). The two project shapes do not meaningfully overlap: there is no Astro app inside Carte (the storefront is consumer-side), and the workspace layout cannot be retrofitted from the starter's flat layout without throwing all of it away. The starter is a useful confirmation of the runtime API surface (`definePlugin` is exported, capability names match the locked list); we adopt those facts and discard the structure.

## TDD ordering

Per the mission's TDD policy, every plugin package commits the smoke test FIRST (a RED commit, where the test fails because `src/index.ts` does not exist) and the implementation SECOND (a GREEN commit, where the test passes). Six packages × two commits = 12 plugin commits. Plus one OpenSpec-tracking commit and one root-scaffolding commit. Commit log on `feature/PRO-m2-monorepo-scaffold` will show the test → impl ordering for each package, satisfying `A2.tdd.testsBeforeImpl`.

## Out of scope (explicit non-goals)

- No `wrangler.toml` (`f-m2-wrangler` follows).
- No `vitest.config.ts` with `projects:` field (`f-m2-test-frameworks` follows).
- No GitHub Actions, no Changesets, no LICENSE/CONTRIBUTING (`f-m2-ci-changesets-hygiene` follows).
- No real plugin logic (per-plugin missions follow).
