# pro-898-build-dist — Tasks

Each task <2hr with explicit acceptance criteria mapping to the
release-packaging spec.

## Task 1 — `@carte/orders-admin` build via tsdown ✅

- **Action:** Add `packages/orders-admin/tsdown.config.ts` (unbundle, dts,
  esm; entries `src/index.ts` + `src/admin/index.tsx`). Add `"build": "tsdown"`
  to `scripts`. Repoint `main` → `dist/index.js`; `exports["."]` →
  `{types, default}` at `dist/index.js`; `exports["./admin"]` →
  `{types, default}` at `dist/admin/index.js`. Add `files: ["dist"]`. Add
  `tsdown` to the package `devDependencies` (or rely on root — confirm it
  resolves).
- **Acceptance:**
  - `pnpm -F @carte/orders-admin build` exits 0.
  - `dist/index.js`, `dist/index.d.ts`, `dist/admin/index.js`,
    `dist/admin/index.d.ts`, `dist/admin/App.js` all exist.
  - `emdash` / `react` / `react-dom` are not inlined into emitted files.
  - Fulfills spec "orders-admin builds to `dist/` with resolvable exports".
- **Test:** none new (build verified by Task 4 resolution check).

## Task 2 — `@carte/views` build via tsdown (TS compile + `.astro` copy) ✅

- **Action:** Add `packages/views/tsdown.config.ts` (unbundle, dts, esm;
  entries = all non-test `src/*.ts` so every module an `.astro` imports is
  emitted; `copy` `src/components` → `dist/components`). Add
  `"build": "tsdown"` to `scripts`. Repoint `main` → `dist/index.js`;
  `exports["."]` → `{types, default}` at `dist/index.js`; every
  `./components/*.astro` subpath → `./dist/components/*.astro`. Add
  `files: ["dist"]`. Confirm `tsdown` resolves.
- **Acceptance:**
  - `pnpm -F @carte/views build` exits 0.
  - `dist/index.js` + `dist/index.d.ts` exist.
  - All 13 `dist/components/*.astro` exist (verbatim copies).
  - `dist/format.js`, `dist/styles.js`, `dist/types.js`, `dist/hours.js`,
    `dist/schema.js`, `dist/safe-json.js` exist (so copied `.astro` relative
    imports resolve).
  - Fulfills spec "views builds to `dist/` with raw `.astro` + compiled TS".
- **Test:** none new (build verified by Task 4 resolution check).

## Task 3 — Workspace build passes ✅

- **Action:** Run `pnpm -r build` from repo root.
- **Acceptance:**
  - Exits 0.
  - `packages/orders-admin/dist/` and `packages/views/dist/` exist & non-empty.
  - Sandboxed plugins' `emdash-plugin build` still succeeds.
  - Fulfills spec "Workspace-wide build produces both `dist/` trees".

## Task 4 — Exports resolution verification ✅

- **Action:** For each package, resolve every `exports` subpath against the
  built export map (e.g. a small Node script using
  `import.meta.resolve` / `require.resolve` with `exports` conditions, or
  `node --input-type=module -e "await import(...)"`). Confirm no subpath
  resolves under `src/` and every target exists under `dist/`.
- **Acceptance:**
  - Every orders-admin + views `exports` subpath resolves to a `dist/` file
    that exists.
  - No subpath resolves to `src/`.
  - Fulfills spec "Every published `exports` subpath resolves from built
    output".

## Task 5 — Confirm `@carte/ai` untouched + docs ✅

- **Action:** Confirm `packages/ai/package.json` has no `build` added and its
  exports stay `src`-based. Update `packages/views/README.md` +
  `packages/orders-admin` notes if needed to mention the build step (e2e/consumers
  require `pnpm build` first). Update root `CHANGELOG.md` if maintained.
- **Acceptance:**
  - `@carte/ai` unchanged.
  - Docs note the new build requirement where consumers read components from
    the export map.
  - Fulfills spec "`@carte/ai` is not built".
