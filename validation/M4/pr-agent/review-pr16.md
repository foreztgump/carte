# PR-Agent PR-Mode Review — PR #16 (Carte v0.2 Tender adapter rc)

- PR URL: https://github.com/foreztgump/carte/pull/16
- Branch: `feat/PRO-tender-adapter`
- Git provider: `github`
- Model: `openai/glm-5.1-syn` (via CLIProxyAPI at `http://127.0.0.1:8317/v1`)
- Fallback: `openai/gpt-5.4-mini`
- `CONFIG__CUSTOM_REASONING_MODEL`: `true`
- `MAX_MODEL_TOKENS` / `CONFIG__MAX_MODEL_TOKENS` / `CONFIG__CUSTOM_MODEL_MAX_TOKENS`: `256000`
- Diff tokens: 59,985 (well under 256k cap; full diff sent — no pruning)
- Exit code: `0`
- Wall time: ~90s (start 13:15:38 → label-set 13:17:08)
- Posted comment: https://github.com/foreztgump/carte/pull/16#issuecomment-4454384563
- Label set on PR: `Review effort 4/5`

## Command

```bash
OPENAI__KEY=sk-dummy \
OPENAI__API_BASE=http://127.0.0.1:8317/v1 \
GITHUB__USER_TOKEN="$(gh auth token)" \
LITELLM_DROP_PARAMS=true \
CONFIG__CUSTOM_REASONING_MODEL=true \
CONFIG__MODEL=openai/glm-5.1-syn \
CONFIG__FALLBACK_MODELS='["openai/gpt-5.4-mini"]' \
CONFIG__MAX_MODEL_TOKENS=256000 \
CONFIG__CUSTOM_MODEL_MAX_TOKENS=256000 \
MAX_MODEL_TOKENS=256000 \
PR_REVIEWER__REQUIRE_SECURITY_REVIEW=true \
PR_REVIEWER__REQUIRE_TESTS_REVIEW=true \
PR_REVIEWER__NUM_MAX_FINDINGS=5 \
PR_REVIEWER__INLINE_CODE_COMMENTS=true \
pr-agent --pr_url=https://github.com/foreztgump/carte/pull/16 review
```

> Note: the initial attempt followed the mission AGENTS.md env block verbatim and failed because pr-agent v0.34.3 requires `OPENAI__KEY` + `OPENAI__API_BASE` (CLIProxy routing) and `CONFIG__CUSTOM_MODEL_MAX_TOKENS` (the model `openai/glm-5.1-syn` is not in LiteLLM's MAX_TOKENS table, so the bare `MAX_MODEL_TOKENS` env is insufficient). The full block from `~/.factory/skills/pr-agent-runner/SKILL.md` is the authoritative source. This was already documented in the SKILL but not in the mission AGENTS.md routing pins section. Surfacing as a `discoveredIssue` for orchestrator follow-up.

## Review Output (posted to PR #16 as comment 4454384563)

## PR Reviewer Guide 🔍

Here are some key observations to aid the review process:

⏱️ **Estimated effort to review**: 4 🔵🔵🔵🔵⚪
🧪 **PR contains tests**
🔒 **No security concerns identified**
⚡ **Recommended focus areas for review**

### Finding 1 — Stale unique index

**File**: `packages/orders-backend/src/storage.ts` (approx. lines 228–232 per diff anchor `R228-R232`)

The `carte_orders` storage definition still lists `stripeCheckoutSessionId` in both `indexes` and `uniqueIndexes`, but the Stripe webhook route that populated it is deleted in this PR and no new code writes that field. If the storage engine enforces uniqueness on `uniqueIndexes` and does not treat null/undefined values as exempt, every new Tender-sourced order would violate the unique constraint on the absent field, blocking order creation. Even if nulls are exempt, the index is dead weight tied to a removed payment flow and should be updated or removed alongside the Tender migration.

```typescript
carte_orders: {
  indexes: ["status", "orderType", "email", "createdAt", "stripeCheckoutSessionId"],
  uniqueIndexes: ["orderNumber", "stripeCheckoutSessionId"],
},
```

### Finding 2 — SSRF gap (IPv6)

**File**: line anchor `R664-R671` of the diff (helper named `isLocalOrPrivateHost`)

`isLocalOrPrivateHost` does not check IPv6 private/loopback addresses (`::1`, `::ffff:127.0.0.1`, `fe80::`). Since this is an exported security helper intended for future URL-accepting tools, callers who rely on it for SSRF protection could be bypassed via IPv6 URLs. Currently the function is not gating any active request path, so the practical risk is limited, but the gap should be closed before the helper is adopted.

```typescript
function isLocalOrPrivateHost(hostname: string): boolean {
  return (
    LOCALHOST_NAMES.has(hostname) ||
    hostname.startsWith("127.") ||
    hostname.startsWith("10.") ||
    hostname.startsWith("192.168.") ||
    isPrivate172Host(hostname)
  );
```

## Triage

| #   | Severity (proposed)                                                        | Blocking?                    | Title                                        | File / Anchor                                                           |
| --- | -------------------------------------------------------------------------- | ---------------------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| 1   | P1 (potential merge blocker if storage engine enforces uniqueness on null) | **YES — needs verification** | Stale unique index `stripeCheckoutSessionId` | `packages/orders-backend/src/storage.ts:228-232`                        |
| 2   | P3 (latent, no active call site)                                           | No                           | IPv6 SSRF gap in `isLocalOrPrivateHost`      | `packages/orders-backend/src/ai/url-utils.ts` (line anchor `R664-R671`) |

## Comparison to local-diff run (review.md)

The previous run (`pr-agent --pr_url main review`, local provider) returned "No major issues detected." This PR-mode run found two findings that the local-diff pass missed — likely because pr-agent's `improve`/`review` heuristics differ when the provider is `github` (richer description + label/repo metadata) versus `local` (raw diff only). This validates the mission decision to run pr-agent in PR-mode as a second-pass guard.

## Command Log

```
2026-05-14 13:15:38.413 | INFO     | pr_agent.tools.pr_reviewer:run:134 - Reviewing PR: https://github.com/foreztgump/carte/pull/16 ...
2026-05-14 13:15:38.413 | INFO     | pr_agent.git_providers.git_provider:get_user_description:229 - Existing description was not generated by the pr-agent
2026-05-14 13:15:57.027 | INFO     | pr_agent.git_providers.github_provider:get_diff_files:340 - Filtered out files with invalid extensions: ['pnpm-lock.yaml']
2026-05-14 13:15:57.242 | INFO     | pr_agent.algo.pr_processing:get_pr_diff:63 - PR main language: TypeScript
2026-05-14 13:15:57.287 | INFO     | pr_agent.algo.pr_processing:get_pr_diff:74 - Tokens: 59985, total tokens under limit: 256000, returning full diff.
2026-05-14 13:15:57.294 | INFO     | pr_agent.algo.ai_handlers.litellm_ai_handler:chat_completion:323 - Using model openai/glm-5.1-syn, combining system and user prompts
2026-05-14 13:17:08.159 | INFO     | pr_agent.tools.pr_reviewer:set_review_labels:410 - Setting review labels: ['Review effort 4/5']
```
