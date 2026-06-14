# Design — pro-895-public-repo-audit

## Context

`foreztgump/carte` is PRIVATE and must become PUBLIC to unlock npm provenance
(OIDC trusted publishing) and source links for the five MIT `@carte/*`
packages (`PRD-production-release.md` WS-B1, risk R3). The flip is effectively
one-way: GitHub warns that public conversion exposes the **entire Git history
on all branches**, all **Actions run logs and artifacts**, and all
**issue/PR/discussion** text, and GitHub secret scanning then crawls that
history continuously. So the engineering problem is not "run a command" — it
is "prove the blast radius is empty, then flip, then verify."

Three properties make this a procedure-with-evidence rather than a code change:

1. **History matters as much as HEAD.** A secret deleted from the working tree
   still lives in history. A working-tree-only scan is insufficient; the audit
   MUST cover all refs.
2. **The flip precondition is a gate.** Flipping with an unresolved finding is
   the failure mode. The design makes "clean, signed-off audit" a hard
   precondition, not a soft recommendation.
3. **Rotation, not hiding, is the only real fix.** If a secret is found, the
   correct response is provider-side revocation — reverting visibility does not
   un-expose anything that was briefly public.

### Known audit surface (from working-tree reconnaissance)

| Reference                             | Where (examples)                                     | Pre-classification                            |
| ------------------------------------- | ---------------------------------------------------- | --------------------------------------------- |
| `license.carteplugin.dev`             | `PRD.md`, `.dev.vars.example`, docs-site, CHANGELOG  | Intentionally public license host (PRD §AI)   |
| `linear.app/projects-linear/...`      | `WRAP_UP.md`, `CHANGELOG.md`, `README.md`, `PRD.md`  | Internal tracker links — confirm OK to expose |
| `127.0.0.1:8317` / `OPENAI__API_BASE` | `AGENTS.md` (pr-agent env table)                     | Local loopback dev endpoint — non-secret      |
| `foreztgump/carte` blob/PR links      | docs-site, `WRAP_UP.md`                              | Already assume public repo — fine             |
| `.dev.vars`                           | gitignored; only `.dev.vars.example` (empty) tracked | Verify still true at audit time               |

This recon is the _starting hypothesis_ for the disposition table, not the
audit result — the executed audit re-derives it from a fresh scan.

## Approaches considered (design it twice)

### Approach A — One-shot flip with a manual eyeball pass (rejected)

Operator greps the working tree for `sk_`, glances at it, runs `gh repo edit`.
**Pros:** fastest. **Cons:** misses history entirely (the single highest-risk
surface per GitHub's own warning); no reproducible evidence; no signed-off
gate; nothing to point auditors/reviewers at; "design-it-twice" and the PRD's
R3 mitigation both demand a real audit. Rejected — it optimizes the one
irreversible action for speed.

### Approach B — Gated pipeline: history-aware scan → disposition → flip → verify (chosen)

A linear, evidence-producing pipeline with a hard gate before the
irreversible step:

```
[scan working tree + ALL history]  --> evidence: scan transcripts
            |
            v
[classify every URL/host reference] --> evidence: disposition table
            |
            v
[verify gitignore/example posture]  --> evidence: tracked-file check
            |
   all clean + signed off? --- no --> STOP (remediate; rotate if secret)
            | yes
            v
[gh repo edit --visibility public]  --> evidence: flip transcript
            |
            v
[verify public + secret-scanning]   --> evidence: post-flip checks
```

**Decision: Approach B.** It treats the flip as a one-way door guarded by
reproducible evidence, directly satisfies the PRD R3 mitigation ("pre-public
audit before flipping visibility"), and gives downstream reviewers committed
artifacts rather than trust-me assertions. The extra cost over Approach A is
minutes of tooling; the downside it removes (exposing a historical secret to
the entire internet) is unbounded.

## Module depth / information hiding

The "module" here is the **audit procedure**, and its deep-module shape is:
a simple public interface — _"is the repo safe to make public? yes/no + flip"_
— hiding complex implementation (multi-tool history scanning, ref enumeration,
URL triage, secret-scanning API checks). Each pipeline stage encapsulates one
decision and hides its mechanics:

- **Scan stage** hides _which_ tools run (gitleaks/trufflehog over `--all`
  refs + a working-tree grep pass) behind a single "no unresolved findings"
  output. Swapping scanners later doesn't change the gate's contract.
- **Disposition stage** hides the per-reference reasoning behind a binary
  "intentionally public | must remove" verdict per class.
- **Verification stage** hides the GitHub API surface (visibility JSON,
  secret-scanning alert list, push-protection state) behind "public + scanning
  on + zero alerts."

The evidence directory is the encapsulation boundary: downstream consumers read
verdicts, not raw transcripts.

## Dependency direction

The high-level gate ("flip only if audit clean") depends on **abstractions**
("a clean secret scan", "a complete URL disposition"), not on a specific
scanner binary. Tooling (`gitleaks`, `gh`, `trufflehog`) is a swappable
low-level detail beneath the procedure. The procedure depends only on GitHub's
documented `gh repo edit --visibility` contract and the secret-scanning API —
external boundaries we don't control and therefore pin explicitly.

## Tooling note (no production code)

No production code changes, so there is no TDD in the unit-test sense. The
equivalent of "tests" here is **executable verification at every stage**: each
task produces a command whose output is asserted (exit code, JSON field, zero
counts) and committed as evidence. "Red→green" maps to "finding present →
remediated → re-scan clean." Tasks are ordered so verification gates the
irreversible action, mirroring test-before-implementation discipline.

## Risks / Mitigations

- **[A historical secret exists in an old branch/commit]** → History-aware scan
  over `--all` refs (not just HEAD) before the flip; on any hit, STOP and
  rotate at the provider before remediating history. This is the PRD R3 risk,
  mitigated exactly as the PRD prescribes.
- **[Flip is irreversible in effect — un-flip ≠ un-expose]** → Gate the
  `gh repo edit` command behind a signed-off clean audit; document that
  reverting visibility is containment, not undo, and that any exposed secret
  must be rotated regardless.
- **[Scanner false-negative misses a novel secret format]** → Run two
  independent detectors (e.g. gitleaks + trufflehog) plus targeted greps for
  repo-specific token shapes (`STRIPE_*`, `GITHUB__USER_TOKEN`, CLIProxy
  captures), and rely on GitHub secret scanning as a post-flip backstop with
  push protection enabled.
- **[Intentional public references mistaken for leaks, or vice-versa]** →
  Explicit written disposition per reference class with rationale; ambiguous
  cases default to "must remove / confirm with owner" rather than silent pass.
- **[Actions logs/artifacts expose tokens]** → Acknowledge in the audit that
  public conversion exposes Actions history; confirm CI workflows
  (`ci.yml`, `canary.yml`) mask secrets via `${{ secrets.* }}` and never echo
  them, and note log exposure in the evidence.
- **[Stale captured PAT in `.factory-state/` or local files]** → Confirm
  `.factory-state/` is gitignored and untracked; the audit's tracked-file check
  covers this.

## Migration Plan

1. Land this change's artifacts (proposal/spec/design/tasks) on
   `feature/pro-895-public-repo-audit`.
2. Execute tasks in order; commit evidence under `validation/` as each stage
   passes.
3. Reach the gate. If clean + signed off, run the flip. If not, STOP and follow
   the remediation/rotation path in `proposal.md`.
4. Run post-flip verification; commit evidence.
5. Hand off to WS-B3 (first npm publish) — out of scope here.

**Reversibility:** everything before step 3's flip is fully reversible (delete
worktree). The flip itself is reversible _as a setting_
(`--visibility private`) but NOT as an exposure event — hence the gate.

## Open Questions

- **Tracker-link exposure policy.** Are `linear.app/projects-linear/...` issue
  URLs acceptable to ship publicly (they reveal internal issue IDs/titles but
  no secrets), or should a follow-up scrub them from `README.md`/`CHANGELOG.md`?
  Default assumption: acceptable to expose (they're already product-facing in
  README); flag for owner confirmation, do not block the flip on it.
- **Which scanner(s) are installed.** Tasks name `gitleaks` + `trufflehog` +
  `gh secret-scanning`; if a tool is unavailable in the environment, substitute
  an equivalent history-aware detector and record the substitution in evidence
  (the contract is "history-aware scan", not a specific binary).
- **Secret-scanning enablement timing.** GitHub enables secret scanning
  automatically for public repos, but push protection may need an explicit API
  call (`gh api`); confirm whether it's on by default for this org or must be
  set post-flip.
