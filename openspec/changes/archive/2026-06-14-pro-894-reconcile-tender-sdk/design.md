# Design — pro-894-reconcile-tender-sdk

## Context

`@carte/orders-backend` is a **sandboxed** EmDash plugin. Its source imports the
Tender SDK at runtime:

- `src/routes/checkout.ts:1` — `import { createTenderClient } from "@tender/sdk"`
- `src/routes/refund.ts:1` — `import { createTenderClient } from "@tender/sdk"`
  plus `import type { TenderRefundRecordReason } from "@tender/sdk"`

`emdash-plugin build` compiles `src/plugin.ts` (and `src/index.ts`) into
`dist/plugin.mjs` / `dist/index.mjs`. The sandbox build inlines third-party
imports (the SDK is **not** a host-provided external like `emdash`), so the SDK
ends up **bundled into `dist/`**. The published `files` allowlist is
`["dist", "emdash-plugin.jsonc"]`, so the packed tarball already excludes `src/`
and the vendored `.tgz`.

The defect is therefore **not** in the runtime artifact — it is in the published
**manifest**: `package.json` carries

```jsonc
"devDependencies": { "@tender/sdk": "file:../../vendor/tender-sdk-0.0.0.tgz", ... }
```

npm/pnpm publish the full `devDependencies` map in the packed `package.json`. A
consumer doing a clean install of the tarball will see a `@tender/sdk` entry
resolving to a relative `file:` path that does not exist on their machine, or
(if it were a registry spec) to a version absent from npm. Separately,
`MIGRATION.md:208` documents the SDK as a `peerDependency` ("install it in the
app root… `pnpm add @tender/sdk@^0.1.0`"), which contradicts both the actual
`devDependency` shape and the self-contained-bundle reality.

Acceptance (WS-A4): a clean install of the packed tarball must not error while
`@tender/sdk` is absent from npm, and no package embeds the vendored `0.0.0`
tarball or leaks the `file:` devDependency shape.

## Goal / Non-goals

- **Goal:** make the published `@carte/orders-backend` manifest carry zero
  `@tender/sdk` references while keeping build, typecheck, and test green in the
  workspace.
- **Non-goal:** change checkout/refund handler behavior, swap to the real
  `@tender/sdk@0.1.0` (blocked on PRO-766), or alter the three other sandboxed
  plugins. Re-vendoring the real built SDK once PRO-766 lands is a follow-up, not
  this change.

## Approaches considered (design it twice)

### Approach A — Self-contained bundle (chosen)

Remove `@tender/sdk` from `@carte/orders-backend`'s `package.json` entirely. The
SDK stays a build/test input resolved from the **workspace root** (which is
`private: true` and never published). The build already inlines the SDK into
`dist/`, so the runtime artifact is unchanged and complete.

- **Where the build/test input lives:** declare the vendored tarball as a
  `devDependency` on the **workspace root** `package.json`
  (`"@tender/sdk": "file:./vendor/tender-sdk-0.0.0.tgz"`). Under pnpm the package
  resolves the SDK via the workspace `node_modules` (hoist the name with
  `public-hoist-pattern[]=@tender/sdk` in `.npmrc`, matching the existing
  `public-hoist-pattern[]=tsx` convention). Root devDependencies are never
  published.
- **Pros:** zero `@tender/sdk` reference in the published manifest (satisfies
  WS-A4 directly); no dependency on a nonexistent registry version; runtime
  artifact already self-contained; smallest manifest surface for consumers;
  matches PRD-production-release A4(a) explicitly.
- **Cons:** the SDK is hoisted to the root rather than co-located with its sole
  consumer (mild locality loss); a future re-vendor of the real SDK touches the
  root manifest. Both are acceptable and reversible.

### Approach B — Optional peer dependency

Declare `@tender/sdk` as an `optionalDependencies`-style peer via
`peerDependenciesMeta.optional`, so npm/pnpm warn-but-do-not-fail on absence
(npm: `optional: true` prevents automatic install and missing-peer errors; pnpm:
an omitted optional peer is not reported as an error).

- **Pros:** standards-blessed way to express "needed at runtime if present";
  honest about the eventual `tender-core`/`tender-stripe` runtime relationship.
- **Cons:** **redundant and misleading here** — the SDK is already inlined into
  `dist/`, so there is no unmet runtime import for a peer to satisfy. Declaring a
  peer on `@tender/sdk@^0.1.0` advertises a version that does not exist on npm,
  and if a consumer later installs a real `@tender/sdk` a second copy would load
  alongside the bundled one (dual-version risk). Adds manifest surface for no
  runtime benefit. Rejected.

### Approach C — Strip devDependency at pack time via `prepack`

Keep the `devDependency` for local dev and delete it in a `prepack` script before
`pnpm pack`.

- **Pros:** package stays self-resolving without root hoisting.
- **Cons:** mutating `package.json` in `prepack`/`postpack` is fragile (failure
  modes leave a dirty manifest), defeats reproducible packs, and is exactly the
  "shape leak" class the spec wants eliminated rather than papered over.
  Rejected.

**Decision: Approach A.** It removes the reference at the source (the published
manifest) rather than masking it, leans on the already-correct bundled `dist/`,
reuses the existing `.npmrc` hoist convention, and maps 1:1 to the PRD's stated
A4(a) self-contained option.

## Module depth / information hiding

- The **build** is the deep module: `emdash-plugin build` exposes a one-word
  interface and hides the decision that `@tender/sdk` is inlined (not external)
  inside `dist/`. Consumers see only `dist/` + `emdash-plugin.jsonc`.
- The **published manifest** is intentionally shallow and minimal: it encapsulates
  the decision "this package has no Tender runtime dependency" by simply not
  declaring one. The SDK-as-build-input decision is hidden in the workspace root,
  invisible to consumers.
- The **verification script** hides the mechanics of packing + clean-installing
  behind one assertion: "the published tarball is self-contained and installs
  with `@tender/sdk` absent."

## Dependency direction

High-level (the published package contract) depends on the abstraction "the build
produces a complete `dist/`," not on the concrete SDK source location. The SDK
build input is a low-level workspace detail the published artifact does not
reference. Nothing in `dist/` resolves `@tender/sdk` at the consumer's install
time.

## Risks / Mitigations

- **[The packed tarball still references `@tender/sdk` via a transitive field or
  lockfile snapshot]** → Add a pack-contents assertion (`pnpm pack` →
  inspect the tarball's `package.json` for any `@tender/sdk` key and any
  `vendor/` path) as a gating test; fail the task if found.
- **[`dist/` is not actually self-contained — SDK left external by the build]** →
  The clean-install + import smoke check loads the packed `dist/index.mjs` /
  `dist/plugin.mjs` with `@tender/sdk` absent from `node_modules`; an unresolved
  import throws and fails the check.
- **[pnpm strict `node_modules` cannot resolve the root-hoisted SDK for
  build/test]** → Use `public-hoist-pattern[]=@tender/sdk` in `.npmrc` (existing
  convention for `tsx`); verify `pnpm -F @carte/orders-backend test` (including
  the `tender-sdk-link.smoke.test.ts` resolution test) and `typecheck` pass.
- **[Vendored `0.0.0` ships to end users]** → Already excluded by `files`
  (`["dist","emdash-plugin.jsonc"]`); the spec adds an explicit assertion that no
  package embeds `tender-sdk-0.0.0.tgz`. Re-vendoring the real SDK is deferred to
  PRO-766 and called out as an Open Question.
- **[Doc drift persists]** → A docs task updates `MIGRATION.md` (remove the
  `pnpm add @tender/sdk@^0.1.0` peer instruction) and the orders-backend README to
  state the bundled/self-contained contract.

## Migration Plan

1. Move the `@tender/sdk` vendored input from the package to the workspace root
   `devDependencies`; add the `.npmrc` hoist entry.
2. Remove `@tender/sdk` from `packages/orders-backend/package.json`.
3. `pnpm install` to regenerate the lockfile; confirm build/typecheck/test green.
4. Add and run the pack-contents + clean-install verification.
5. Update docs (`MIGRATION.md`, README) and add a changeset note.

Reversible at each step; see proposal Rollback plan. No data migration, no
runtime behavior change, so no staged rollout needed.

## Open Questions

- **Re-vendor timing (PRO-766):** when `@tender/sdk@0.1.0` ships, do we re-vendor
  the real built SDK at the workspace root or switch the build input to the
  registry version? Either keeps the published-manifest contract (no SDK
  reference) intact; decision deferred to the PRO-766 follow-up, not blocking R1.
- **Hoist vs. workspace catalog:** if a pnpm catalog is later adopted for shared
  pins, the root `file:` input could move into it. Out of scope here.
