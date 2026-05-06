# Spec

## Given/When/Then

### Scenario: pnpm workspace bootstrap is reproducible
- **Given** a clean checkout of `feature/PRO-m2-monorepo-scaffold`
- **When** an engineer runs `pnpm install --frozen-lockfile`
- **Then** all six `@carte/*` packages resolve from `packages/*`
- **And** the install exits 0 with no peer-dependency conflicts
- **And** `pnpm-lock.yaml` exists and is committed

### Scenario: every plugin skeleton declares only canonical capability names
- **Given** a `packages/<plugin>/src/index.ts` that exports a `definePlugin()` manifest
- **When** the colocated Vitest smoke test runs `pnpm -F @carte/<plugin> test`
- **Then** the test asserts the manifest id matches `carte-<plugin>`
- **And** every entry in `manifest.capabilities` is in the canonical allowlist (`content:read`, `content:write`, `media:read`, `media:write`, `network:request`, `email:send`, `users:read`)
- **And** no deprecated alias (e.g., `read:content`, `network:fetch`) appears in any source file

### Scenario: TypeScript strict mode catches indexed-access and optional-property violations
- **Given** the root `tsconfig.json` enables `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`
- **When** an engineer runs `pnpm -r typecheck`
- **Then** every package's TypeScript build exits 0 with no errors

### Scenario: ESLint flat config + Prettier are wired across packages
- **Given** root `eslint.config.js` (flat) and `.prettierrc`
- **When** an engineer runs `pnpm -r lint`
- **Then** every package's source passes the lint pass with zero warnings or errors

### Scenario: TDD ordering is provable from the commit log
- **Given** the feature branch `feature/PRO-m2-monorepo-scaffold`
- **When** an engineer runs `git log --oneline feature/PRO-m2-monorepo-scaffold ^main`
- **Then** for each plugin package, a `test(<plugin>): RED smoke test ...` commit precedes its `feat(<plugin>): manifest skeleton ...` commit

### Scenario: `@carte/views` is a peer-dep library, not an EmDash plugin
- **Given** `packages/views/`
- **When** an engineer inspects `src/index.ts`
- **Then** there is no `definePlugin` import
- **And** the package exports at least one named React/Astro placeholder (e.g., `MenuItem`)
- **And** its README states it is a peer-dep npm library
