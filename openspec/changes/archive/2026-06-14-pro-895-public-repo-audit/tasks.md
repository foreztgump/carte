# pro-895-public-repo-audit — Tasks

Each task is <2hr, produces committed evidence under
`openspec/changes/pro-895-public-repo-audit/validation/`, and ends with a
verification command whose output is asserted. Tasks run **in order**: the
flip (Task 5) is gated on Tasks 1–4 all recording CLEAN. No production code
changes; "tests" here are executable verification steps.

> Evidence dir: `openspec/changes/pro-895-public-repo-audit/validation/`
> Substitution rule: if a named scanner is unavailable, swap an equivalent
> history-aware detector and record the substitution in the evidence file.

## Task 0 — Confirm preconditions and create evidence directory

- **Action:** Verify the worktree is on `feature/pro-895-public-repo-audit`,
  the repo is currently PRIVATE, and `gh` is authenticated with admin rights on
  `foreztgump/carte`. Create the `validation/` evidence directory.
- **Files:**
  - Create: `openspec/changes/pro-895-public-repo-audit/validation/00-preconditions.txt`
- **Error handling:** If `gh auth status` fails or the token lacks `repo`
  admin scope, STOP and report — the flip cannot run without it.
- **CODE_PRINCIPLES:** evidence captures WHY (preconditions), not just WHAT.
- **Acceptance:**
  - [x] Current branch is `feature/pro-895-public-repo-audit`.
  - [x] Visibility recorded as `PRIVATE` pre-flip.
  - [x] `gh` admin auth confirmed.
- **Verify:**
  ```bash
  gh repo view foreztgump/carte --json visibility,viewerPermission \
    | tee openspec/changes/pro-895-public-repo-audit/validation/00-preconditions.txt
  # expect: visibility "PRIVATE", viewerPermission "ADMIN"
  ```

## Task 1 — History-aware secret scan (all refs) + working-tree scan

- **Action:** Run a history-aware secret scanner across **all** Git refs and a
  working-tree scan over the checkout. Capture full transcripts. Targeted token
  shapes to confirm absent: Stripe live/test/webhook secrets, LLM provider
  keys, GitHub PAT / OAuth captures, CLIProxy captured tokens.
- **Files:**
  - Create: `validation/01-secret-scan-history.txt`
  - Create: `validation/01-secret-scan-worktree.txt`
- **Error handling:** Any non-zero finding count = STOP; do not proceed to
  Task 5. Record finding location for provider-side rotation (see proposal
  rollback). Tool crash/!installed → substitute and note it.
- **CODE_PRINCIPLES:** no magic values — assert on explicit zero-finding
  output, not a glance.
- **Acceptance:**
  - [x] History scan over all refs completed; transcript committed.
  - [x] Working-tree scan completed; transcript committed.
  - [x] Zero unresolved secret findings (or STOP triggered).
- **Verify:**
  ```bash
  # History (all branches/refs). gitleaks scans full history by default.
  gitleaks detect --source . --no-banner --redact \
    --report-path openspec/changes/pro-895-public-repo-audit/validation/01-secret-scan-history.json \
    | tee openspec/changes/pro-895-public-repo-audit/validation/01-secret-scan-history.txt
  # Second detector over history (independent confirmation):
  trufflehog git file://. --only-verified --no-update \
    | tee -a openspec/changes/pro-895-public-repo-audit/validation/01-secret-scan-history.txt
  # Targeted token-shape grep over tracked tree (lock excluded). Bracket classes
  # match GitHub PAT/OAuth prefixes without embedding any literal token string:
  git grep -nIE 'sk_(live|test)_|whsec_|gh[poprsu][_][A-Za-z0-9]|github[_]pat[_]' -- . ':!pnpm-lock.yaml' \
    | tee openspec/changes/pro-895-public-repo-audit/validation/01-secret-scan-worktree.txt || echo "no matches (clean)"
  # expect: gitleaks "no leaks found"; trufflehog 0 verified; grep no matches
  ```

## Task 2 — URL / host reference disposition table

- **Action:** Enumerate every non-`github.com` external/internal reference that
  becomes public and classify each as "intentionally public" or "must remove"
  with a one-line rationale. Cover the known classes: `license.carteplugin.dev`
  (public license host), `linear.app/projects-linear/...` (tracker links),
  `127.0.0.1:8317` / `OPENAI__API_BASE` (loopback dev), plus anything new the
  scan surfaces.
- **Files:**
  - Create: `validation/02-url-disposition.md` (table: reference | locations | verdict | rationale)
- **Error handling:** Any reference that cannot be confidently classified
  defaults to "must remove / confirm with owner" and blocks the flip until
  resolved.
- **CODE_PRINCIPLES:** names reveal intent — each verdict is explicit, no
  unclassified rows.
- **Acceptance:**
  - [x] Every reference class has a verdict + rationale.
  - [x] `license.carteplugin.dev`, `linear.app/...`, `127.0.0.1:8317`
        explicitly dispositioned.
  - [x] No row left unclassified.
- **Verify:**
  ```bash
  # Regenerate the candidate reference list the table must cover:
  git grep -nIE 'https?://[^ )"'"'"']+|[0-9]{1,3}(\.[0-9]{1,3}){3}:[0-9]+' \
    -- . ':!pnpm-lock.yaml' \
    | grep -viE 'github\.com|emdash\.dev|schema\.org|docs\.npmjs\.com|astro\.build' \
    | tee openspec/changes/pro-895-public-repo-audit/validation/02-url-candidates.txt
  # Then confirm every distinct host in candidates appears in the disposition table:
  test -s openspec/changes/pro-895-public-repo-audit/validation/02-url-disposition.md
  ```

## Task 3 — Gitignore + example-file posture check

- **Action:** Confirm secret-bearing files are gitignored and untracked, and
  that tracked example files contain only placeholders. Targets: `.dev.vars`,
  `.env*`, `.factory-state/`, any credential file; `.dev.vars.example` must be
  empty/placeholder values only.
- **Files:**
  - Create: `validation/03-gitignore-posture.txt`
- **Error handling:** A tracked `.dev.vars`/`.env` or a non-placeholder example
  value = STOP and remediate (untrack + gitignore, scrub value) before
  re-running.
- **CODE_PRINCIPLES:** error handling at the boundary — the boundary here is
  "what git tracks vs what is ignored."
- **Acceptance:**
  - [x] No `.dev.vars`/`.env` file is tracked by git.
  - [x] `.factory-state/` is ignored and untracked.
  - [x] `.dev.vars.example` holds only empty/placeholder values.
- **Verify:**
  ```bash
  {
    echo "== tracked dotenv/secret files (expect none beyond *.example) =="
    git ls-files | grep -E '(^|/)\.(env|dev\.vars)(\.|$)' | grep -v '\.example$' || echo "none tracked (clean)"
    echo "== .dev.vars / .factory-state ignored? =="
    git check-ignore -v .dev.vars .factory-state/ || echo "WARNING: not ignored"
    echo "== example file has no real values =="
    grep -nE '=[^[:space:]]' .dev.vars.example | grep -vE '=$|https://license\.carteplugin\.dev' || echo "placeholders only (clean)"
  } | tee openspec/changes/pro-895-public-repo-audit/validation/03-gitignore-posture.txt
  ```

## Task 4 — Audit sign-off (the gate)

- **Action:** Aggregate Tasks 1–3 evidence into a single sign-off recording
  CLEAN / NOT CLEAN per check. This file is the precondition gate for Task 5.
  Also record acknowledgement that the flip exposes Actions logs/artifacts and
  full history (GitHub's documented consequence).
- **Files:**
  - Create: `validation/04-audit-signoff.md`
- **Error handling:** If any check is NOT CLEAN, the sign-off records BLOCKED
  with the named finding and Task 5 MUST NOT run.
- **CODE_PRINCIPLES:** single responsibility — this task only decides
  go/no-go; it performs no scanning itself.
- **Acceptance:**
  - [x] Each of secret-scan / URL-disposition / gitignore recorded CLEAN.
  - [x] Actions-log/history exposure consequence explicitly acknowledged.
  - [x] Overall verdict = GO (or BLOCKED with reason).
- **Verify:**
  ```bash
  grep -E 'secret-scan:|url-disposition:|gitignore:|verdict:' \
    openspec/changes/pro-895-public-repo-audit/validation/04-audit-signoff.md
  # expect: each check CLEAN; verdict: GO
  ```

## Task 5 — Flip repository visibility to public (gated, irreversible-in-effect)

- **Action:** ONLY after Task 4 verdict = GO, flip visibility to public.
- **Files:**
  - Create: `validation/05-flip-transcript.txt`
- **Error handling:** If `gh repo edit` errors (permissions, org policy), STOP
  and report; do not retry blindly. Per proposal rollback, `--visibility
private` re-hides but does NOT un-expose — never treat it as undo.
- **CODE_PRINCIPLES:** KISS — exactly the documented command, no extra flags.
- **Acceptance:**
  - [x] Command runs only with a recorded GO verdict.
  - [x] Command exits 0.
- **Verify:**
  ```bash
  # Precondition guard: refuse if verdict is not GO.
  grep -q 'verdict: GO' openspec/changes/pro-895-public-repo-audit/validation/04-audit-signoff.md \
    || { echo "ABORT: audit verdict is not GO"; exit 1; }
  gh repo edit foreztgump/carte --visibility public --accept-visibility-change-consequences \
    | tee openspec/changes/pro-895-public-repo-audit/validation/05-flip-transcript.txt
  echo "exit: $?"
  ```

## Task 6 — Post-flip verification + secret-scanning enablement

- **Action:** Confirm the repo is public, GitHub secret scanning + push
  protection are enabled, and no secret-scanning alert fired on the now-public
  history. Capture all outputs as evidence.
- **Files:**
  - Create: `validation/06-post-flip-verification.txt`
- **Error handling:** If visibility is not `public`, re-check Task 5 output. If
  secret scanning is off, enable it via `gh api` and re-verify. If any alert
  fired, treat as a real exposure → rotate the credential at the provider
  immediately (do not just close the alert).
- **CODE_PRINCIPLES:** verification before completion — assert on JSON fields
  and zero counts, not on the absence of an error.
- **Acceptance:**
  - [x] `visibility` == `public`.
  - [x] Secret scanning + push protection enabled.
  - [x] Secret-scanning alert count == 0.
- **Verify:**
  ```bash
  {
    gh repo view foreztgump/carte --json visibility
    gh api repos/foreztgump/carte --jq '.security_and_analysis'
    gh api repos/foreztgump/carte/secret-scanning/alerts --jq 'length'
  } | tee openspec/changes/pro-895-public-repo-audit/validation/06-post-flip-verification.txt
  # expect: visibility "public"; secret_scanning + push_protection "enabled"; alerts length 0
  ```

## Task 7 — Update docs + Linear; close out

- **Action:** Note the public-repo state where relevant (e.g. CHANGELOG entry
  for PRO-895; confirm no doc copy still says "private"). Update Linear PRO-895
  to In Review/Done with evidence links. Confirm `repo:carte` label present.
- **Files:**
  - Modify: `CHANGELOG.md` (PRO-895 line, if maintained)
- **Error handling:** Docs-only; if no CHANGELOG section applies, record N/A in
  the sign-off rather than inventing one.
- **CODE_PRINCIPLES:** YAGNI — only touch docs that actually reference repo
  visibility; no speculative edits.
- **Acceptance:**
  - [x] CHANGELOG/docs reflect public repo (or N/A recorded).
  - [x] Linear PRO-895 updated with `repo:carte` label and evidence links.
- **Verify:**
  ```bash
  grep -niE 'private repo|repository is private' -- README.md CHANGELOG.md docs-site/ \
    || echo "no stale 'private repo' copy (clean)"
  ```
