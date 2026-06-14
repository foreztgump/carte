# pro-898-build-dist — Build scripts → `dist/` for `@carte/orders-admin` + `@carte/views`

## Why

Carte's three sandboxed plugins (`@carte/core`, `@carte/reservations`,
`@carte/orders-backend`) already produce `dist/` via `emdash-plugin build`. The
two remaining release-bound packages do not build at all — they point `main`
and `exports` directly at TypeScript/`.astro` source:

- `@carte/orders-admin` — native React admin. `main: src/index.ts`,
  `exports` resolve to `./src/index.ts` and `./src/admin/index.tsx`.
- `@carte/views` — peer-dep Astro component library. `main: src/index.ts`,
  `exports` resolve to `./src/index.ts` plus 13 raw `./src/components/*.astro`
  subpaths.

For the R1 packaging milestone (`PRD-production-release.md` WS-A1) every
release package must ship a built `dist/` and resolve every `exports` subpath
from that built output — never from `src/`. This change adds the missing
`build` scripts and repoints package metadata.

`@carte/ai` is **excluded** — deferred per parent PRO-892; it keeps its
current `src`-based harness setup and is not built for release.

## What changes

- **`@carte/orders-admin`** — add a `tsdown` build (unbundle mode + `dts`)
  that compiles `src/**/*.{ts,tsx}` to `dist/`, preserving module structure so
  the runtime `./admin/App.js` / `./admin/index.js` specifiers resolve from
  built output. Repoint `main` → `dist/index.js`, `exports["."]` →
  `dist/index.js` (+ `types`), `exports["./admin"]` → `dist/admin/index.js`
  (+ `types`). Add `files: ["dist"]`.
- **`@carte/views`** — add a build that (a) compiles the package's TypeScript
  modules (`src/*.ts`: `format`, `styles`, `types`, `hours`, `schema`,
  `safe-json`, `safe-redirect`, `index`) to `dist/` in unbundle mode with
  `dts`, and (b) copies the raw `.astro` component files to
  `dist/components/*.astro` (Astro source ships uncompiled — the consumer's
  Astro compiler handles it; the copied `.astro` files keep their relative
  `../format.js` / `../styles.js` imports which now resolve against the
  compiled `dist/*.js`). Repoint `main` → `dist/index.js`, `exports["."]` →
  `dist/index.js` (+ `types`), and every `./components/*.astro` subpath →
  `./dist/components/*.astro`. Add `files: ["dist"]`.
- **Build-specific tsconfig per package** — the root `tsconfig.json` sets
  `noEmit: true`; `tsdown` drives emit itself via its own config, so no global
  tsconfig change is needed, but each package gets a `tsdown.config.ts`.
- **Verify** `pnpm -r build` produces `dist/` for both packages and every
  `exports` subpath resolves from built output (Node `require.resolve` /
  `import` against the package export map).

## What does NOT change

- No build for `@carte/ai` (deferred).
- No change to the three sandboxed plugins' `emdash-plugin build`.
- No change to test setup — Vitest continues to run against `src/` (tests
  import source directly; only the published `exports` map points at `dist/`).
- No new runtime dependencies. `tsdown` is already a root devDependency
  (`0.20.3`).
- No publish — that is a later R1 task. `private: true` stays as-is.

## Fulfills

- WS-A1 acceptance: `pnpm -r build` produces `dist/` for `@carte/orders-admin`
  - `@carte/views`; every `exports` subpath resolves from built output.

## Rollback plan

Revert the `package.json` and `tsconfig`/`tsdown.config.ts` edits. `dist/` is
gitignored, so no build artifacts are committed; deleting the worktree fully
reverts. No consumers outside the workspace depend on these packages yet
(both `private: true`), so repointing `exports` cannot break an external
install.
