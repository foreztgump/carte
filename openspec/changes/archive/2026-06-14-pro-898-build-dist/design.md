# Design — pro-898-build-dist

## Context

Two packages need a `build` producing `dist/`. They have different shapes:

- `@carte/orders-admin` — pure TS/TSX (React). Runtime ESM specifiers in
  source already assume compiled `.js` output (e.g. `export { ... } from
"./admin/App.js"`). Needs a transpile that preserves the module graph and
  emits `.d.ts`.
- `@carte/views` — mixed: TS modules (`format`, `styles`, `types`, etc.) AND
  `.astro` single-file components. `.astro` is NOT JavaScript and is NOT
  compiled at library-build time — it ships as source for the consumer's own
  Astro toolchain to compile. The `.astro` files import the TS modules
  relatively, so the TS must be compiled into `dist/` alongside the copied
  `.astro` files at matching relative paths.

## Approaches considered (design it twice)

### Approach A — `tsc` per package with a build tsconfig

Use the TypeScript compiler directly (`tsc -p tsconfig.build.json`) to emit
`.js` + `.d.ts`. Pros: zero new tooling, exact module structure preserved.
Cons: the root `tsconfig.json` sets `noEmit: true` and is `extends`-ed by both
packages, so each needs a separate build tsconfig overriding `noEmit`,
`declaration`, `outDir`. `tsc` does not bundle, which is fine, but `tsc` alone
won't copy `.astro` files — still need a copy step. For orders-admin, `tsc`
emits JSX per `jsx: react-jsx` (already set) — works.

### Approach B — `tsdown` (chosen)

`tsdown` is already a root devDependency (`0.20.3`), used nowhere yet but
present. Run it in **unbundle mode** (`unbundle: true`, `root: "."`) so each
source file maps 1:1 into `dist/` preserving structure — exactly what the
runtime `./admin/App.js` specifiers and the `.astro` relative imports need. It
generates `.d.ts` with `dts: true` and externalizes `node_modules`
(peer/runtime deps `emdash`, `react`, `react-dom`, `astro`) by default, so the
host-provided packages are not inlined. For `.astro` copying, `tsdown` has a
`copy` option (`copy: [{ from: "src/components", to: "dist/components" }]`)
that handles the raw `.astro` files.

**Decision: Approach B.** It uses tooling already vendored, gives unbundle +
dts + asset-copy in one config, and keeps both packages on an identical build
strategy (deep module: simple `build` script, complex emit hidden in config).
The `.astro` copy is declarative rather than a separate shell `cp`.

## orders-admin build

`packages/orders-admin/tsdown.config.ts`:

```ts
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/admin/index.tsx"],
  unbundle: true, // 1:1 file mapping → ./admin/App.js etc. resolve
  dts: true,
  format: "esm",
  // emdash (peer), react, react-dom (runtime, host-provided) stay external
  // by default — node_modules is not bundled in unbundle mode.
});
```

`package.json` changes:

```jsonc
"main": "dist/index.js",
"exports": {
  ".":      { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
  "./admin":{ "types": "./dist/admin/index.d.ts", "default": "./dist/admin/index.js" }
},
"files": ["dist"],
"scripts": { "build": "tsdown", ... }
```

`entry` lists both `index.ts` and `admin/index.tsx` so both are treated as
entry points (and get `.d.ts`); unbundle still emits every transitively-imported
file (`admin/App.tsx`, `admin/order-*.ts`, `modifiers/*.tsx`) at its mirrored
path. Test files (`*.test.ts(x)`) are excluded from entry and are not reachable
from the entries, so they stay out of `dist/`.

## views build

`packages/views/tsdown.config.ts`:

```ts
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  unbundle: true,
  dts: true,
  format: "esm",
  copy: [{ from: "src/components", to: "dist/components" }],
});
```

The single `entry` (`index.ts`) imports `format`, `styles`, `types`,
`safe-json`, `safe-redirect`; `hours` and `schema` are imported only by
`.astro` files, not by `index.ts`. Unbundle only emits files reachable from
entries, so `hours.ts` / `schema.ts` would be missed. To guarantee every TS
module an `.astro` imports is present in `dist/`, the `entry` glob must cover
all non-test source TS:

```ts
entry: ["src/index.ts", "src/format.ts", "src/styles.ts", "src/types.ts",
        "src/hours.ts", "src/schema.ts", "src/safe-json.ts", "src/safe-redirect.ts"],
```

(`env.d.ts` is a type-only ambient file; not an entry.) This ensures
`dist/hours.js`, `dist/schema.js`, etc. all exist for the copied `.astro`
files to import. `.astro` files are copied verbatim via `copy`.

## Module depth / information hiding

Each package exposes a one-word public interface (`pnpm build`) hiding the
emit complexity (unbundle, dts, externals, asset copy) inside
`tsdown.config.ts`. Consumers and CI see only `dist/` + the export map.

## Dependency direction

Build config depends on `tsdown` (already vendored). No package depends on
another's build output at build time — `@carte/core` (a `workspace:*` dep of
both) is consumed as a resolved workspace package, not rebuilt here.

## Risks / edge cases

- **e2e views fixture** imports `@carte/views/components/*.astro` through the
  package export map. After repointing exports to `dist/`, the views package
  must be built before e2e runs. This is the intended release behavior; note
  it in the package README / task acceptance. Tests that import package
  _source_ directly (Vitest unit tests use relative `./` imports, not the
  `@carte/views` specifier) are unaffected.
- **`exactOptionalPropertyTypes` / strict dts** — `tsdown` dts generation runs
  through the package's TS settings; if a strict-mode dts error surfaces it is
  a real type issue to fix, not a config workaround.
- **`@carte/core` taxonomy import** — `views/types.ts` imports from
  `@carte/core/taxonomy` (a `src`-based export of core). dts generation for
  views resolves that against core's export map; since it points at
  `src/taxonomy/allergens.ts` it resolves fine.
