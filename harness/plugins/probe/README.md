# Carte harness probe

A sandboxed probe plugin for the in-repo Carte EmDash 0.18 harness.

## Develop

```sh
pnpm install
pnpm typecheck
pnpm test
```

The parent harness runs `pnpm --dir plugins/probe build` before Astro starts.
The build output must include `dist/index.mjs`, `dist/plugin.mjs`, and
`dist/manifest.json`.

## Version bumps

Bump `version` in `package.json` when you ship a release. The
scaffold's `emdash-plugin.jsonc` deliberately omits `version` because
the build pipeline reads it from `package.json` so there's a single
source of truth. **Bump major** for breaking changes, **bump minor**
for new routes or hooks, **bump patch** for fixes.

You MUST bump version whenever you change `capabilities`, `allowedHosts`,
or `storage` in the manifest. Installed users have consented to the
old trust contract; a change without a version bump would let new
behaviour slip past consent.
