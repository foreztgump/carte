# f-m2-ci-changesets-hygiene — Tasks

Each task <2hr with explicit acceptance criteria. Assertions referenced
map to the M2 validation contract.

## Task 1 — Author `.github/workflows/ci.yml`

- **Action:** Write a single-job workflow per the SKILL §"D" template:
  triggers `pull_request` + `push: branches: [main]`; steps in order
  checkout → pnpm setup → Node setup with `cache: 'pnpm'` →
  `pnpm install --frozen-lockfile` → `pnpm -r typecheck` →
  `pnpm -r lint` → `pnpm -r build --if-present` → `pnpm -r test` →
  AgentShield scan (`continue-on-error: true`, see Task 8).
- **Acceptance:**
  - File exists at `.github/workflows/ci.yml`.
  - YAML parses via
    `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))"`
    exit 0.
  - All step `uses:` pins are at the SKILL-locked majors
    (`actions/checkout@v4`, `pnpm/action-setup@v4`,
    `actions/setup-node@v4`).
  - Single `ci` job (no matrix, no extra jobs).
  - Fulfills `A2.ci.workflow`.

## Task 2 — Install `@changesets/cli` + run `pnpm changeset init`

- **Action:** `pnpm add -Dw @changesets/cli` at repo root. Then
  `pnpm changeset init`.
- **Acceptance:**
  - `@changesets/cli` appears in root `package.json` `devDependencies`.
  - `.changeset/config.json` and `.changeset/README.md` exist.
  - `pnpm-lock.yaml` updates without errors.
  - No files are added under `packages/*/` by `init`. (If init does add
    per-package artifacts, STOP and escalate per task description.)

## Task 3 — Replace `.changeset/config.json`

- **Action:** Overwrite `.changeset/config.json` with the
  Carte-tuned config: `commit: false`, `linked: []`, `fixed: []`,
  `baseBranch: "main"`, `access: "public"`,
  `updateInternalDependencies: "patch"`, `ignore: []`,
  `changelog: ["@changesets/changelog-github", { "repo": "foreztgump/carte" }]`,
  `$schema` pointing at the public Changesets schema.
- **Acceptance:**
  - `cat .changeset/config.json | python3 -m json.tool` exits 0
    (valid JSON).
  - `linked` and `fixed` are both empty arrays (independent semver).
  - `baseBranch` is `"main"`.
  - Fulfills `A2.changesets.config`.

## Task 4 — Author root `README.md`

- **Action:** Write a one-paragraph intro plus a bullet list of links to
  `PRD.md`, `docs/competitive-analysis/`, `AGENTS.md`,
  `CODE_PRINCIPLES.md`, and `CONTRIBUTING.md`.
- **Acceptance:**
  - File exists at repo root `README.md`.
  - File is non-empty (>5 lines).
  - Contributes to `A2.docs.repoHygiene`.

## Task 5 — Author root `CONTRIBUTING.md`

- **Action:** Document commit format `type(scope): desc [PRO-XXX]`,
  branch convention `feature/PRO-XXX-desc` / `fix/PRO-XXX-desc`, the
  standard development loop (`pnpm install`, `pnpm test`,
  `pnpm typecheck`, `pnpm lint`), and the Changesets workflow
  (`pnpm changeset` to record any user-facing change). Point readers at
  `AGENTS.md` for the full guidelines.
- **Acceptance:**
  - File exists at repo root `CONTRIBUTING.md`.
  - References `AGENTS.md` and the commit format and branch convention.
  - Mentions `pnpm changeset`.
  - Contributes to `A2.docs.repoHygiene`.

## Task 6 — Author root `LICENSE` (MIT)

- **Action:** Write a standard MIT license, copyright year 2026,
  holder "Carte contributors".
- **Acceptance:**
  - File exists at repo root `LICENSE`.
  - File ≥20 lines (sanity check on completeness of MIT text).
  - Contributes to `A2.docs.repoHygiene`.

## Task 7 — Author `packages/ai/LICENSE` (commercial NOTICE)

- **Action:** Write a commercial license NOTICE that explicitly
  asserts `@carte/ai` is NOT under MIT and that production use requires
  a paid subscription. Mention 14-day free trial and the placeholder
  license URL `https://carteplugin.dev/license`.
- **Acceptance:**
  - File exists at `packages/ai/LICENSE`.
  - File contains the literal phrases "Commercial" and "NOT licensed
    under MIT" (or near-equivalent strong wording so a future search
    for "MIT" in this file finds it).
  - Contributes to `A2.docs.repoHygiene`.

## Task 8 — Run AgentShield baseline scan + decide

`continue-on-error`

- **Action:**
  `npx ecc-agentshield scan .factory/ .claude/ 2>&1 | tee /tmp/agentshield-baseline.txt`.
- **Acceptance:**
  - Outcome documented in `design.md` under "AgentShield baseline".
  - If the scan returns 0 findings, the SKILL says to keep
    `continue-on-error: true` until baseline is confirmed clean across
    runs — interpret strictly and keep the flag ON.
  - If the scan returns findings, list severity counts in `design.md`
    and keep `continue-on-error: true`.
  - If `npx ecc-agentshield` is not installed / 404, document the
    failure in `design.md` and keep `continue-on-error: true`. CI will
    be the first place AgentShield actually runs.
  - Fulfills `A2.security.agentShield` (the CI step is in place; baseline
    state is documented).

## Task 9 — Verify `.editorconfig` already exists at root

- **Action:** Read `/home/cownose/projects/carte/.editorconfig`.
- **Acceptance:**
  - File exists (authored by `f-m2-workspace`); has at minimum
    `indent_style`, `indent_size`, `end_of_line`, `charset`,
    `insert_final_newline`.
  - This task does NOT rewrite the file. If missing or malformed,
    escalate before touching it.
  - Contributes to `A2.docs.repoHygiene`.

## Task 10 — Verification gauntlet

- **Action:** Run the full gauntlet on a clean working tree:
  - `pnpm install --frozen-lockfile`
  - `pnpm -r typecheck`
  - `pnpm -r lint`
  - `pnpm test` (12 vitest cases, must not regress)
  - `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))"`
  - `cat .changeset/config.json | python3 -m json.tool`
  - `wc -l README.md CONTRIBUTING.md LICENSE packages/ai/LICENSE`
  - `git status --short` (after the final commit — must be empty).
- **Acceptance:**
  - All commands exit 0.
  - `git rev-parse HEAD` is captured for the handoff.
