# f-m2-wrangler — Tasks

Each task <2hr with explicit acceptance criteria. Assertions referenced map to
the M2 validation contract.

## Task 1 — Install `wrangler` workspace devDep

- **Action:** `pnpm add -Dw wrangler` at repo root.
- **Acceptance:**
  - `wrangler` appears in root `package.json` `devDependencies`.
  - `pnpm-lock.yaml` updates without errors.
  - `pnpm -F @carte/core exec wrangler --version` prints a version.

## Task 2 — Author `packages/core/wrangler.toml`

- **Action:** Write the standard sandboxed shape (name, main,
  compatibility_date, compatibility_flags, KV placeholder, env split).
- **Acceptance:**
  - File exists at `packages/core/wrangler.toml`.
  - `pnpm -F @carte/core exec wrangler types` exits 0.
  - Fulfills `A2.wrangler.config` for `@carte/core`.

## Task 3 — Author `packages/reservations/wrangler.toml`

- **Action:** Same shape as core, with `name = "carte-reservations"`.
- **Acceptance:**
  - File exists at `packages/reservations/wrangler.toml`.
  - `pnpm -F @carte/reservations exec wrangler types` exits 0.
  - Fulfills `A2.wrangler.config` for `@carte/reservations`.

## Task 4 — Author `packages/orders-backend/wrangler.toml`

- **Action:** Same shape as core, with `name = "carte-orders-backend"`. Add a
  TOML comment block documenting which secrets the plugin will read from
  `.dev.vars` at runtime (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `STRIPE_PUBLIC_KEY`). Comment is informational only — no real values.
- **Acceptance:**
  - File exists at `packages/orders-backend/wrangler.toml`.
  - `pnpm -F @carte/orders-backend exec wrangler types` exits 0.
  - Fulfills `A2.wrangler.config` for `@carte/orders-backend`.
  - Fulfills `A2.wrangler.envSplit` (env tables present in all three
    sandboxed configs).

## Task 5 — Author root `.dev.vars.example` + verify exclusions

- **Action:** Write `.dev.vars.example` at repo root with every secret name
  used across the plugin family, all values empty (except
  `LICENSE_SERVER_URL` which holds its public hostname).
- **Action:** Confirm `ls packages/{orders-admin,views,ai}/wrangler.*` finds
  nothing — native packages must NOT carry a wrangler config.
- **Action:** Confirm `.dev.vars` (without `.example`) is in `.gitignore`.
- **Action:** Run `grep -nE 'sk_|whsec_|pk_live_' .dev.vars.example` — must
  return zero matches.
- **Acceptance:**
  - `.dev.vars.example` exists; every `=` is followed by either nothing or a
    public URL.
  - Native package wrangler globs return no results.
  - Secret-scan grep returns 0 matches.
  - `git status --short` is empty after commit.
