# PR-Agent Local Review — feat/PRO-tender-adapter vs main

- Command: `pr-agent --pr_url main review`
- Git provider: `local`
- Model: `openai/glm-5.1-syn`
- CONFIG\_\_CUSTOM_REASONING_MODEL: `true`
- MAX_MODEL_TOKENS: `256000`
- Exit code: `0`

## Review Output

## PR Reviewer Guide 🔍

Here are some key observations to aid the review process:

### ⏱️ Estimated effort to review: 4 🔵🔵🔵🔵⚪

### 🧪 PR contains tests

### 🔒 No security concerns identified

### ⚡ No major issues detected

## Command Log

```text
2026-05-14 11:33:21.587 | WARNING  | pr_agent.custom_merge_loader:load:63 - Settings file not found: /home/cownose/code/pr-agent/pr_agent/settings/.secrets.toml. Skipping it.
2026-05-14 11:33:21.587 | WARNING  | pr_agent.custom_merge_loader:load:63 - Settings file not found: /home/cownose/code/pr-agent/pr_agent/settings_prod/.secrets.toml. Skipping it.
[32m2026-05-14 11:33:22.095[0m | [1mINFO    [0m | [36mpr_agent.tools.pr_reviewer[0m:[36mrun[0m:[36m134[0m - [1mReviewing PR: main ...[0m
[32m2026-05-14 11:33:22.154[0m | [1mINFO    [0m | [36mpr_agent.algo.pr_processing[0m:[36mget_pr_diff[0m:[36m63[0m - [1mPR main language: json[0m
[32m2026-05-14 11:33:22.206[0m | [1mINFO    [0m | [36mpr_agent.algo.pr_processing[0m:[36mget_pr_diff[0m:[36m74[0m - [1mTokens: 64435, total tokens under limit: 256000, returning full diff.[0m
[32m2026-05-14 11:33:22.215[0m | [1mINFO    [0m | [36mpr_agent.algo.ai_handlers.litellm_ai_handler[0m:[36mchat_completion[0m:[36m323[0m - [1mUsing model openai/glm-5.1-syn, combining system and user prompts[0m
/home/cownose/.local/share/pipx/venvs/pr-agent/lib/python3.12/site-packages/pydantic/main.py:364: UserWarning: Pydantic serializer warnings:
  Expected `Union[Choices, StreamingChoices]` but got `Choices` - serialized value may not be as expected
  return self.__pydantic_serializer__.to_python(
[32m2026-05-14 11:34:01.106[0m | [31m[1mERROR   [0m | [36mpr_agent.tools.pr_reviewer[0m:[36mset_review_labels[0m:[36m415[0m - [31m[1mFailed to set review labels, error: Getting labels is not implemented for the local git provider[0m
sys:1: RuntimeWarning: coroutine 'Logging.async_success_handler' was never awaited
RuntimeWarning: Enable tracemalloc to get the object allocation traceback
```
