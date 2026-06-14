# Spec — `pro-898-build-dist`

## ADDED Requirements

### Requirement: `@carte/orders-admin` builds to `dist/` with resolvable exports

The `@carte/orders-admin` package SHALL provide a `build` script that emits
compiled JavaScript and type declarations to `dist/`, preserving module
structure so runtime specifiers (e.g. `./admin/App.js`) resolve from built
output. The package `main` and every `exports` subpath SHALL resolve from
`dist/`, never from `src/`. The host-provided dependencies `emdash`, `react`,
and `react-dom` SHALL remain external (not inlined) in the build output.

#### Scenario: Build emits resolvable dist output

- **GIVEN** the `@carte/orders-admin` package with its `build` script and tsdown config
- **WHEN** I run `pnpm -F @carte/orders-admin build`
- **THEN** the command exits 0; `dist/index.mjs`, `dist/index.d.mts`, `dist/admin/index.mjs`, `dist/admin/index.d.mts`, and `dist/admin/App.mjs` all exist; `main` and both `exports` subpaths (`.`, `./admin`) resolve to existing `dist/` files; `emdash`/`react`/`react-dom` are not inlined.

### Requirement: `@carte/views` builds to `dist/` with raw `.astro` plus compiled TS

The `@carte/views` package SHALL provide a `build` script that compiles its
TypeScript modules to `dist/*.js` and copies every `.astro` component verbatim
to `dist/components/`. The compiled TS modules that `.astro` files import
relatively (`../format.js`, `../styles.js`, `../types.js`, `../hours.js`,
`../schema.js`, `../safe-json.js`) SHALL exist in `dist/` so those imports
resolve. The package `main` and every `exports` subpath SHALL resolve from
`dist/`, never from `src/`.

#### Scenario: Build compiles TS and copies all astro components

- **GIVEN** the `@carte/views` package with its `build` script and tsdown config
- **WHEN** I run `pnpm -F @carte/views build`
- **THEN** the command exits 0; `dist/index.js` and `dist/index.d.ts` exist; all 13 components are copied to `dist/components/<Name>.astro`; `dist/format.js`, `dist/styles.js`, `dist/types.js`, `dist/hours.js`, `dist/schema.js`, and `dist/safe-json.js` exist; and every `exports` subpath resolves to an existing `dist/` file.

### Requirement: Every published `exports` subpath resolves from built output

Both packages SHALL expose an export map backed entirely by built artifacts. No
`exports` subpath SHALL resolve to a path under `src/`, and every resolved
target SHALL exist on disk under `dist/`.

#### Scenario: No export resolves to src

- **GIVEN** both packages built
- **WHEN** I resolve each `exports` subpath against the package export map
- **THEN** no subpath resolves under `src/` and every resolved target exists under `dist/`.

### Requirement: `@carte/ai` remains unbuilt

The `@carte/ai` package SHALL NOT receive a `build` script in this change and
its `main`/`exports` SHALL remain `src`-based (deferred per PRO-892).

#### Scenario: ai package untouched

- **GIVEN** the `@carte/ai` package
- **WHEN** I inspect its `package.json`
- **THEN** it has no `build` script and its `main`/`exports` still point at `src/`.
