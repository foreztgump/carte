# Monorepo Scaffold — CI + Changesets + Repo Hygiene Spec

## Capability: GitHub Actions CI runs the full quality gauntlet

### Given the repo at `feature/PRO-m2-monorepo-scaffold` HEAD with `f-m2-workspace`, `f-m2-test-frameworks`, and `f-m2-wrangler` landed

### When I read `.github/workflows/ci.yml`

### Then

- The file parses as valid YAML
  (`python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))"`
  exits 0).
- The workflow declares triggers on `pull_request` and on
  `push: branches: [main]`.
- A single job named `ci` runs on `ubuntu-latest`.
- Steps execute in this order, with these majors pinned:
  1. `actions/checkout@v4`
  2. `pnpm/action-setup@v4` (with `version: 9` or higher)
  3. `actions/setup-node@v4` (with `node-version: '22'` and
     `cache: 'pnpm'`)
  4. `pnpm install --frozen-lockfile`
  5. `pnpm -r typecheck`
  6. `pnpm -r lint`
  7. `pnpm -r build --if-present`
  8. `pnpm -r test`
  9. `npx ecc-agentshield scan .factory/ .claude/`
     (with `continue-on-error: true`).

### Fulfills

- `A2.ci.workflow` — CI workflow file exists, parses, and runs the
  documented quality gauntlet on PR + push to main.
- `A2.security.agentShield` — CI step invokes
  `npx ecc-agentshield scan .factory/ .claude/`.

## Capability: Changesets supports independent per-plugin semver

### Given the repo after `pnpm add -Dw @changesets/cli` + `pnpm changeset init` + the Carte-tuned `.changeset/config.json`

### When I read `.changeset/config.json`

### Then

- The file parses as valid JSON
  (`python3 -m json.tool < .changeset/config.json` exits 0).
- `linked` is an empty array.
- `fixed` is an empty array.
- `baseBranch` is `"main"`.
- `commit` is `false`.
- `access` is `"public"`.
- `updateInternalDependencies` is `"patch"`.
- `changelog` is the two-element form
  `["@changesets/changelog-github", { "repo": "foreztgump/carte" }]`.

### And given root `package.json`

### Then

- `@changesets/cli` appears in `devDependencies`.

### Fulfills

- `A2.changesets.config` — Changesets is installed, configured for
  per-plugin independent semver, and points at the repo's GitHub
  identity for changelog rendering.

## Capability: Repo hygiene docs are present at root

### Given the repo root after this feature lands

### When I list the repo root

### Then

- `README.md` exists, is non-empty (>5 lines), and links to `PRD.md`,
  `docs/competitive-analysis/`, `AGENTS.md`, `CODE_PRINCIPLES.md`, and
  `CONTRIBUTING.md`.
- `CONTRIBUTING.md` exists, mentions the commit format
  `type(scope): desc [PRO-XXX]`, the branch convention
  `feature/PRO-XXX-desc` / `fix/PRO-XXX-desc`, and the `pnpm changeset`
  workflow.
- `LICENSE` exists at repo root, is the MIT license, has ≥20 lines,
  and names "Carte contributors" (placeholder OK for v0.1).
- `.editorconfig` exists at root with `indent_style`, `indent_size`,
  `end_of_line`, `charset`, and `insert_final_newline` declared (this
  was authored by `f-m2-workspace`; this feature only verifies).

### And when I read `packages/ai/LICENSE`

### Then

- The file exists.
- The file makes clear `@carte/ai` is NOT under MIT (e.g. literal
  phrases "Commercial" and "NOT licensed under MIT" or strong
  near-equivalents).
- The file mentions the 14-day free trial and a license URL
  placeholder.

### Fulfills

- `A2.docs.repoHygiene` — README, CONTRIBUTING, LICENSE,
  `.editorconfig` all present at root; `@carte/ai` carries a separate
  commercial NOTICE.

## Capability: package versions are unchanged

### Given each `packages/<plugin>/package.json` for `<plugin> ∈ {core, reservations, orders-backend, orders-admin, views, ai}`

### Then

- `version` is `"0.1.0"` (set by `f-m2-workspace`).
- This feature MUST NOT modify any `packages/*/package.json` `version`
  field. The mission-close `f-m2-openspec-archive` does not touch
  versions either; per-plugin missions decide first bumps via
  Changesets.
