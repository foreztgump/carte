# Spec — `pro-894-reconcile-tender-sdk`

## ADDED Requirements

### Requirement: `@carte/orders-backend` published manifest declares no `@tender/sdk` dependency

The published `@carte/orders-backend` `package.json` SHALL NOT declare
`@tender/sdk` in any dependency field — not `dependencies`, `devDependencies`,
`peerDependencies`, `peerDependenciesMeta`, or `optionalDependencies`. The
`@tender/sdk` build/test input SHALL be resolved from a workspace-private source
(the `private: true` workspace root) that is never published, and the published
manifest SHALL NOT contain any `file:` specifier pointing at
`vendor/tender-sdk-0.0.0.tgz` or any other vendored path.

#### Scenario: Packed manifest carries no Tender SDK reference

- **GIVEN** the `@carte/orders-backend` package built and packed via `pnpm pack`
- **WHEN** I inspect the `package.json` inside the produced tarball
- **THEN** no dependency field contains a `@tender/sdk` key, and no field contains
  a `file:` specifier referencing `vendor/tender-sdk-0.0.0.tgz` or any `vendor/`
  path.

### Requirement: Clean install of the packed tarball MUST succeed when Tender SDK is absent

A clean install of the packed `@carte/orders-backend` tarball MUST exit 0 in an
empty project while `@tender/sdk` is absent from the registry and from the
consumer's `node_modules`. Loading the package's built entrypoints
(`dist/index.mjs` and `dist/plugin.mjs`) after that install SHALL NOT throw an
unresolved-module error for `@tender/sdk`, because the SDK is inlined into `dist/`
at build time.

#### Scenario: Clean install and import succeed without the SDK present

- **GIVEN** the packed `@carte/orders-backend` tarball and an empty consumer
  project whose registry view of `@tender/sdk` is E404 (absent)
- **WHEN** I install the tarball and import `dist/index.mjs` and `dist/plugin.mjs`
- **THEN** the install command exits 0 and both imports resolve and load without an
  unresolved-module error for `@tender/sdk`.

### Requirement: No published package embeds the vendored Tender SDK tarball or `src/`

No package in the publishable set SHALL embed `vendor/tender-sdk-0.0.0.tgz` (or
any copy of it) in its packed contents, and the `@carte/orders-backend` tarball
SHALL contain only its built `dist/` output plus `emdash-plugin.jsonc` as declared
by `files` — never `src/` and never `vendor/`.

#### Scenario: Tarball contents are limited to built output

- **GIVEN** the `@carte/orders-backend` package packed via `pnpm pack`
- **WHEN** I list the files inside the produced tarball
- **THEN** every entry is under `dist/` or is `emdash-plugin.jsonc` (plus the
  npm-standard `package.json`/`README`), and no entry is under `src/` or `vendor/`
  nor is named `tender-sdk-0.0.0.tgz`.

### Requirement: Workspace build, typecheck, and tests resolve `@tender/sdk` from the build input

Relocating `@tender/sdk` to the workspace-private build input SHALL keep the
in-workspace developer workflow green: `@carte/orders-backend` SHALL build,
typecheck, and run its test suite — including the `@tender/sdk` workspace-link
resolution smoke test — with `@tender/sdk` resolvable from the workspace root.

#### Scenario: In-workspace toolchain still resolves the SDK

- **GIVEN** the reconciled workspace after `pnpm install`
- **WHEN** I run `pnpm -F @carte/orders-backend build`,
  `pnpm -F @carte/orders-backend typecheck`, and
  `pnpm -F @carte/orders-backend test`
- **THEN** each command exits 0, and the `tender-sdk-link.smoke.test.ts`
  resolution test passes (the SDK resolves from the workspace build input).
