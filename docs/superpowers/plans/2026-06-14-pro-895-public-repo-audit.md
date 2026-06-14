# PRO-895 Public Repo Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce auditable evidence that `foreztgump/carte` is safe to publish, flip the GitHub repo to public, and verify public visibility plus secret-scanning posture.

**Architecture:** This is an evidence-gated release/security procedure, not a production-code feature. The irreversible-in-effect `gh repo edit --visibility public` command is blocked until secret scans, URL disposition, and gitignore posture are all clean and signed off.

**Tech Stack:** Git, GitHub CLI, jq, ripgrep/git grep, AgentShield, OpenSpec artifacts, Linear.

---

## File Structure

- Create: `openspec/changes/pro-895-public-repo-audit/validation/`
  - Audit evidence boundary. Every execution task writes a transcript or table here.
- Create: `openspec/changes/pro-895-public-repo-audit/validation/00-preconditions.txt`
  - Branch, GitHub visibility, viewer permission, auth status.
- Create: `openspec/changes/pro-895-public-repo-audit/validation/01-secret-scan-history.txt`
  - History-aware targeted scan over all refs plus scanner availability notes.
- Create: `openspec/changes/pro-895-public-repo-audit/validation/01-secret-scan-worktree.txt`
  - Working-tree token pattern scan plus AgentShield output.
- Create: `openspec/changes/pro-895-public-repo-audit/validation/02-url-candidates.txt`
  - Generated URL/IP candidate list.
- Create: `openspec/changes/pro-895-public-repo-audit/validation/02-url-disposition.md`
  - Human-reviewed disposition table for public exposure.
- Create: `openspec/changes/pro-895-public-repo-audit/validation/03-gitignore-posture.txt`
  - Tracked dotenv/secret file and ignore posture evidence.
- Create: `openspec/changes/pro-895-public-repo-audit/validation/04-audit-signoff.md`
  - Gate file. Task 5 may run only when this records `verdict: GO`.
- Create: `openspec/changes/pro-895-public-repo-audit/validation/05-flip-transcript.txt`
  - Visibility flip transcript.
- Create: `openspec/changes/pro-895-public-repo-audit/validation/06-post-flip-verification.txt`
  - Public visibility, secret scanning, push protection, alert count.
- Modify: `CHANGELOG.md`
  - Add a PRO-895 release-operations entry only if the repo keeps unreleased release notes.
- Modify: `openspec/changes/pro-895-public-repo-audit/tasks.md`
  - Check off completed OpenSpec tasks after evidence exists.

## Shared Quality Checklist

Apply to each task:

- [ ] Each function does one thing (SRP), or no functions are introduced.
- [ ] No magic values: every scan pattern and expected JSON field is named in evidence or command text.
- [ ] Functions stay within 40 lines, 3 params, 3 nesting levels, or no code is introduced.
- [ ] External boundaries (`gh`, scanners, GitHub API) check exit codes and record failures.
- [ ] Names reveal intent in evidence filenames and table headings.
- [ ] No duplicated logic blocks beyond intentionally repeated verification commands.
- [ ] YAGNI: no production code, no broad doc rewrites, no speculative tooling.
- [ ] Law of Demeter: commands talk directly to Git/GitHub, no wrapper chains.
- [ ] File structure follows this plan, with all evidence under `validation/`.

## Task 0: Preconditions and Evidence Directory

**Files:**

- Create: `openspec/changes/pro-895-public-repo-audit/validation/00-preconditions.txt`

- [ ] **Step 1: Create validation directory**

Run:

```bash
mkdir -p openspec/changes/pro-895-public-repo-audit/validation
```

Expected: command exits 0.

- [ ] **Step 2: Record branch, visibility, permission, and auth**

Run:

```bash
{
  echo "== branch =="
  git branch --show-current
  echo "== repo =="
  gh repo view foreztgump/carte --json visibility,viewerPermission,url
  echo "== auth =="
  gh auth status
} 2>&1 | tee openspec/changes/pro-895-public-repo-audit/validation/00-preconditions.txt
```

Expected:

- Branch is `feature/pro-895-public-repo-audit`.
- `visibility` is `PRIVATE`.
- `viewerPermission` is `ADMIN`.
- `gh auth status` succeeds.

- [ ] **Step 3: Stop on failed preconditions**

Run:

```bash
jq -e '.visibility == "PRIVATE" and .viewerPermission == "ADMIN"' \
  < <(gh repo view foreztgump/carte --json visibility,viewerPermission)
```

Expected: exits 0. If it fails, stop and report the exact missing precondition.

## Task 1: History and Working-Tree Secret Scan

**Files:**

- Create: `openspec/changes/pro-895-public-repo-audit/validation/01-secret-scan-history.txt`
- Create: `openspec/changes/pro-895-public-repo-audit/validation/01-secret-scan-worktree.txt`

- [ ] **Step 1: Record scanner availability**

Run:

```bash
{
  echo "== scanner availability =="
  printf 'gitleaks='; command -v gitleaks || true
  printf 'trufflehog='; command -v trufflehog || true
  printf 'ecc-agentshield='; command -v ecc-agentshield || true
} | tee openspec/changes/pro-895-public-repo-audit/validation/01-secret-scan-history.txt
```

Expected: transcript records installed scanners. In this environment, use the planned substitution if `gitleaks` and `trufflehog` are unavailable.

- [ ] **Step 2: Run history-aware targeted scan over all refs**

Run:

```bash
{
  echo "== history-aware targeted token scan over all refs =="
  echo "patterns: Stripe sk_live/sk_test, Stripe whsec, GitHub PAT/OAuth prefixes, GITHUB__USER_TOKEN, provider API key variable names"
  git grep -nI -E \
    'sk_(live|test)_[A-Za-z0-9]|whsec_[A-Za-z0-9]|gh[poprsu]_[A-Za-z0-9]|github_pat_[A-Za-z0-9]|GITHUB__USER_TOKEN|OPENAI_API_KEY|ANTHROPIC_API_KEY|STRIPE_SECRET|STRIPE_WEBHOOK' \
    $(git rev-list --all) -- \
    ':(exclude)pnpm-lock.yaml' \
    ':(exclude)docs/superpowers/plans/2026-06-14-pro-895-public-repo-audit.md' \
    || echo "no targeted history matches (clean)"
} | tee -a openspec/changes/pro-895-public-repo-audit/validation/01-secret-scan-history.txt
```

Expected: `no targeted history matches (clean)` or only clearly non-secret documentation placeholders. Any real credential blocks Task 5.

- [ ] **Step 3: Run AgentShield and targeted working-tree scan**

Run:

```bash
{
  echo "== AgentShield working-tree scan =="
  npx ecc-agentshield scan --min-severity low
  echo "== targeted tracked-tree token scan =="
  git grep -nIE \
    'sk_(live|test)_[A-Za-z0-9]|whsec_[A-Za-z0-9]|gh[poprsu]_[A-Za-z0-9]|github_pat_[A-Za-z0-9]|GITHUB__USER_TOKEN|OPENAI_API_KEY|ANTHROPIC_API_KEY|STRIPE_SECRET|STRIPE_WEBHOOK' \
    -- . \
    ':!pnpm-lock.yaml' \
    ':!docs/superpowers/plans/2026-06-14-pro-895-public-repo-audit.md' \
    || echo "no targeted working-tree matches (clean)"
} 2>&1 | tee openspec/changes/pro-895-public-repo-audit/validation/01-secret-scan-worktree.txt
```

Expected: AgentShield exits 0 or reports no high-confidence secrets; targeted scan is clean or contains only documented placeholder names. Any real credential blocks Task 5.

## Task 2: URL and Host Disposition

**Files:**

- Create: `openspec/changes/pro-895-public-repo-audit/validation/02-url-candidates.txt`
- Create: `openspec/changes/pro-895-public-repo-audit/validation/02-url-disposition.md`

- [ ] **Step 1: Generate candidate list**

Run:

```bash
git grep -nIE 'https?://[^ )"'"'"']+|[0-9]{1,3}(\.[0-9]{1,3}){3}:[0-9]+' \
  -- . \
  ':!pnpm-lock.yaml' \
  ':!docs/superpowers/plans/2026-06-14-pro-895-public-repo-audit.md' \
  | grep -viE 'github\.com|schema\.org|docs\.npmjs\.com|astro\.build' \
  | tee openspec/changes/pro-895-public-repo-audit/validation/02-url-candidates.txt
```

Expected: candidate references are recorded for disposition.

- [ ] **Step 2: Create disposition table**

Create `openspec/changes/pro-895-public-repo-audit/validation/02-url-disposition.md` with this structure:

```markdown
# PRO-895 URL / Host Disposition

| Reference class                               | Example locations                                   | Verdict                                  | Rationale                                                                                                                                                            |
| --------------------------------------------- | --------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `license.carteplugin.dev`                     | `.dev.vars.example`, `PRD.md`, docs-site, CHANGELOG | Intentionally public                     | Public license host by product design; not a secret or internal-only endpoint.                                                                                       |
| `linear.app/projects-linear/...`              | README, CHANGELOG, OpenSpec wrap-ups                | Intentionally public, follow-up optional | Reveals tracker URLs and issue names, but no credentials or infrastructure secrets. Acceptable for release history; can be scrubbed later if product policy changes. |
| `127.0.0.1:8317` / `OPENAI__API_BASE`         | `AGENTS.md`                                         | Intentionally public                     | Loopback-only local CLIProxy endpoint; no routable infrastructure or credential value.                                                                               |
| Other candidates from `02-url-candidates.txt` | See candidate file                                  | Intentionally public or must remove      | Fill each distinct non-filtered host with an explicit verdict before Task 4.                                                                                         |
```

Expected: no unclassified host remains.

- [ ] **Step 3: Verify table exists and has no placeholder row**

Run:

```bash
test -s openspec/changes/pro-895-public-repo-audit/validation/02-url-disposition.md
! grep -q 'Fill each distinct' openspec/changes/pro-895-public-repo-audit/validation/02-url-disposition.md
```

Expected: exits 0. If it fails, complete the disposition table before continuing.

## Task 3: Gitignore and Example-File Posture

**Files:**

- Create: `openspec/changes/pro-895-public-repo-audit/validation/03-gitignore-posture.txt`

- [ ] **Step 1: Record tracked secret-bearing files and ignore state**

Run:

```bash
{
  echo "== tracked dotenv/secret files, expect none beyond examples =="
  git ls-files | grep -E '(^|/)\.(env|dev\.vars)(\.|$)' | grep -v '\.example$' || echo "none tracked (clean)"
  echo "== ignored local secret paths =="
  git check-ignore -v .env .env.local .dev.vars .factory-state/ || true
  echo "== example file non-empty values, expect placeholders only =="
  if [ -f .dev.vars.example ]; then
    grep -nE '=[^[:space:]]' .dev.vars.example | grep -vE '=$|https://license\.carteplugin\.dev|example|placeholder|dummy' || echo "placeholders only (clean)"
  else
    echo ".dev.vars.example not present"
  fi
} | tee openspec/changes/pro-895-public-repo-audit/validation/03-gitignore-posture.txt
```

Expected: no tracked `.env` or `.dev.vars` except examples; local secret paths are ignored or absent; examples contain placeholders only.

- [ ] **Step 2: Stop if tracked secret files are present**

Run:

```bash
! git ls-files | grep -E '(^|/)\.(env|dev\.vars)(\.|$)' | grep -v '\.example$'
```

Expected: exits 0. If it fails, do not proceed to Task 5.

## Task 4: Audit Sign-Off Gate

**Files:**

- Create: `openspec/changes/pro-895-public-repo-audit/validation/04-audit-signoff.md`

- [ ] **Step 1: Create sign-off file**

Create `openspec/changes/pro-895-public-repo-audit/validation/04-audit-signoff.md`:

```markdown
# PRO-895 Audit Sign-Off

secret-scan: CLEAN
url-disposition: CLEAN
gitignore: CLEAN
actions-history-exposure-acknowledged: YES
verdict: GO

## Evidence

- `00-preconditions.txt`
- `01-secret-scan-history.txt`
- `01-secret-scan-worktree.txt`
- `02-url-candidates.txt`
- `02-url-disposition.md`
- `03-gitignore-posture.txt`

## Notes

The GitHub visibility change exposes Git history, Actions logs/artifacts, and GitHub text surfaces. Any later secret discovery requires provider-side rotation, not just reverting visibility.
```

Expected: use `verdict: BLOCKED` instead of `GO` if any earlier task is not clean.

- [ ] **Step 2: Verify gate is GO**

Run:

```bash
grep -E 'secret-scan:|url-disposition:|gitignore:|verdict:' \
  openspec/changes/pro-895-public-repo-audit/validation/04-audit-signoff.md
grep -q '^verdict: GO$' openspec/changes/pro-895-public-repo-audit/validation/04-audit-signoff.md
```

Expected: exits 0 before Task 5.

## Task 5: Flip GitHub Repository Public

**Files:**

- Create: `openspec/changes/pro-895-public-repo-audit/validation/05-flip-transcript.txt`

- [ ] **Step 1: Re-check gate and current visibility**

Run:

```bash
grep -q '^verdict: GO$' openspec/changes/pro-895-public-repo-audit/validation/04-audit-signoff.md
gh repo view foreztgump/carte --json visibility --jq '.visibility'
```

Expected: first command exits 0 and visibility is `PRIVATE`.

- [ ] **Step 2: Run the documented flip command**

Run:

```bash
{
  echo "== flip started $(date -u +%Y-%m-%dT%H:%M:%SZ) =="
  gh repo edit foreztgump/carte --visibility public --accept-visibility-change-consequences
  echo "exit: $?"
} 2>&1 | tee openspec/changes/pro-895-public-repo-audit/validation/05-flip-transcript.txt
```

Expected: command exits 0. If GitHub rejects for permission or org policy, stop and report.

## Task 6: Post-Flip Verification

**Files:**

- Create: `openspec/changes/pro-895-public-repo-audit/validation/06-post-flip-verification.txt`

- [ ] **Step 1: Verify visibility and security posture**

Run:

```bash
{
  echo "== visibility =="
  gh repo view foreztgump/carte --json visibility
  echo "== security_and_analysis =="
  gh api repos/foreztgump/carte --jq '.security_and_analysis'
  echo "== secret scanning alerts count =="
  gh api repos/foreztgump/carte/secret-scanning/alerts --jq 'length'
} 2>&1 | tee openspec/changes/pro-895-public-repo-audit/validation/06-post-flip-verification.txt
```

Expected:

- `visibility` is `PUBLIC` or API equivalent `public`.
- Secret scanning is enabled.
- Push protection is enabled, or explicitly enabled and re-verified.
- Secret scanning alert count is `0`.

- [ ] **Step 2: Enable push protection if off, then re-verify**

Run only if `security_and_analysis.secret_scanning_push_protection.status` is not `enabled`:

```bash
gh api \
  --method PATCH \
  repos/foreztgump/carte \
  -f security_and_analysis='{"secret_scanning_push_protection":{"status":"enabled"}}'
gh api repos/foreztgump/carte --jq '.security_and_analysis'
```

Expected: push protection reports `enabled`. If the API rejects the update, record the response and stop.

## Task 7: Docs, OpenSpec Task Checks, and Linear Close-Out

**Files:**

- Modify: `CHANGELOG.md`, only if an unreleased section exists.
- Modify: `openspec/changes/pro-895-public-repo-audit/tasks.md`
- Later workflow files: `openspec/changes/pro-895-public-repo-audit/WRAP_UP.md`

- [ ] **Step 1: Check stale private-repo copy**

Run:

```bash
grep -RniE 'private repo|repository is private|repo is private' README.md CHANGELOG.md docs-site/ || echo "no stale private-repo copy (clean)"
```

Expected: no stale public-facing copy. If a true stale statement exists, update only that line.

- [ ] **Step 2: Add minimal changelog entry if applicable**

If `CHANGELOG.md` has an `Unreleased` section, add one bullet:

```markdown
- Release operations: completed the PRO-895 pre-public audit and made `foreztgump/carte` public for npm provenance/source links.
```

Expected: no broad changelog rewrite.

- [ ] **Step 3: Mark OpenSpec tasks complete**

Edit `openspec/changes/pro-895-public-repo-audit/tasks.md` and mark Task 0 through Task 7 complete only after corresponding evidence exists.

Expected: each checked task has matching evidence in `validation/`.

- [ ] **Step 4: Save implementation checkpoint**

Call `memory_save` with content:

```text
[PRO-895 implementation] Implementation: completed evidence-backed pre-public audit, flipped foreztgump/carte public, verified secret scanning/push protection/zero alerts, and recorded validation artifacts under openspec/changes/pro-895-public-repo-audit/validation/.
```

Expected: memory checkpoint saved.

## Final Verification Before Commit

- [ ] Run OpenSpec evidence checks:

```bash
test -s openspec/changes/pro-895-public-repo-audit/validation/00-preconditions.txt
test -s openspec/changes/pro-895-public-repo-audit/validation/01-secret-scan-history.txt
test -s openspec/changes/pro-895-public-repo-audit/validation/01-secret-scan-worktree.txt
test -s openspec/changes/pro-895-public-repo-audit/validation/02-url-disposition.md
test -s openspec/changes/pro-895-public-repo-audit/validation/03-gitignore-posture.txt
grep -q '^verdict: GO$' openspec/changes/pro-895-public-repo-audit/validation/04-audit-signoff.md
grep -q 'public\\|PUBLIC' openspec/changes/pro-895-public-repo-audit/validation/06-post-flip-verification.txt
```

- [ ] Run repo validators:

```bash
pnpm lint
pnpm typecheck
pnpm test
```

If any script is absent, record the exact `pnpm` output and run the nearest available validator from `package.json`.

- [ ] Run mandatory security gate:

```bash
npx ecc-agentshield scan --min-severity high
```

- [ ] Review diff for secrets before commit:

```bash
git status
git diff --cached
git diff
```

Expected: no secrets, no `.env`/`.dev.vars`, no captured PATs, no production-code changes unless a stale doc line required correction.
