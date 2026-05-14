# PR-Agent Local Review

- Target branch: main
- Head branch: feat/PRO-tender-adapter
- Head SHA: 0f01e84de562d4f7ca2312a08016a87e0221917c
- Model: openai/glm-5.1-syn
- CONFIG\_\_CUSTOM_REASONING_MODEL: true
- MAX_MODEL_TOKENS: 256000
- Started: 2026-05-14T10:14:39-07:00

## Command Output

```text
2026-05-14 10:14:42.775 | WARNING  | pr_agent.custom_merge_loader:load:63 - Settings file not found: /home/cownose/code/pr-agent/pr_agent/settings/.secrets.toml. Skipping it.
2026-05-14 10:14:42.775 | WARNING  | pr_agent.custom_merge_loader:load:63 - Settings file not found: /home/cownose/code/pr-agent/pr_agent/settings_prod/.secrets.toml. Skipping it.
[32m2026-05-14 10:14:43.299[0m | [1mINFO    [0m | [36mpr_agent.tools.pr_reviewer[0m:[36mrun[0m:[36m134[0m - [1mReviewing PR: main ...[0m
[32m2026-05-14 10:14:43.356[0m | [1mINFO    [0m | [36mpr_agent.algo.pr_processing[0m:[36mget_pr_diff[0m:[36m63[0m - [1mPR main language: json[0m
[32m2026-05-14 10:14:43.408[0m | [1mINFO    [0m | [36mpr_agent.algo.pr_processing[0m:[36mget_pr_diff[0m:[36m74[0m - [1mTokens: 55729, total tokens under limit: 256000, returning full diff.[0m
[32m2026-05-14 10:14:43.416[0m | [1mINFO    [0m | [36mpr_agent.algo.ai_handlers.litellm_ai_handler[0m:[36mchat_completion[0m:[36m323[0m - [1mUsing model openai/glm-5.1-syn, combining system and user prompts[0m
/home/cownose/.local/share/pipx/venvs/pr-agent/lib/python3.12/site-packages/pydantic/main.py:364: UserWarning: Pydantic serializer warnings:
  Expected `Union[Choices, StreamingChoices]` but got `Choices` - serialized value may not be as expected
  return self.__pydantic_serializer__.to_python(
[32m2026-05-14 10:16:18.319[0m | [31m[1mERROR   [0m | [36mpr_agent.algo.utils[0m:[36mset_file_languages[0m:[36m1461[0m - [31m[1mFailed to set file languages: 'NoneType' object has no attribute 'rsplit'[0m
[33m[1mTraceback (most recent call last):[0m

  File "/home/cownose/.local/bin/pr-agent", line 6, in <module>
    sys.exit(run())
    │   │    └ <function run at 0x7b3152e1f740>
    │   └ <built-in function exit>
    └ <module 'sys' (built-in)>

  File "[32m/home/cownose/code/pr-agent/pr_agent/[0m[32m[1mcli.py[0m", line [33m99[0m, in [35mrun[0m
    [1mresult[0m [35m[1m=[0m [1masyncio[0m[35m[1m.[0m[1mrun[0m[1m([0m[1minner[0m[1m([0m[1m)[0m[1m)[0m
    [36m         │       │   └ [0m[36m[1m<function run.<locals>.inner at 0x7b3152e1f7e0>[0m
    [36m         │       └ [0m[36m[1m<function run at 0x7b315ccba8e0>[0m
    [36m         └ [0m[36m[1m<module 'asyncio' from '/usr/lib/python3.12/asyncio/__init__.py'>[0m

  File "/usr/lib/python3.12/asyncio/runners.py", line 194, in run
    return runner.run(main)
           │      │   └ <coroutine object run.<locals>.inner at 0x7b3152da9a20>
           │      └ <function Runner.run at 0x7b315c3b6340>
           └ <asyncio.runners.Runner object at 0x7b31531e2870>
  File "/usr/lib/python3.12/asyncio/runners.py", line 118, in run
    return self._loop.run_until_complete(task)
           │    │     │                  └ <Task pending name='Task-1' coro=<run.<locals>.inner() running at /home/cownose/code/pr-agent/pr_agent/cli.py:84> wait_for=<T...
           │    │     └ <function BaseEventLoop.run_until_complete at 0x7b315c3aff60>
           │    └ <_UnixSelectorEventLoop running=True closed=False debug=False>
           └ <asyncio.runners.Runner object at 0x7b31531e2870>
  File "/usr/lib/python3.12/asyncio/base_events.py", line 674, in run_until_complete
    self.run_forever()
    │    └ <function BaseEventLoop.run_forever at 0x7b315c3afec0>
    └ <_UnixSelectorEventLoop running=True closed=False debug=False>
  File "/usr/lib/python3.12/asyncio/base_events.py", line 641, in run_forever
    self._run_once()
    │    └ <function BaseEventLoop._run_once at 0x7b315c3b5d00>
    └ <_UnixSelectorEventLoop running=True closed=False debug=False>
  File "/usr/lib/python3.12/asyncio/base_events.py", line 1987, in _run_once
    handle._run()
    │      └ <function Handle._run at 0x7b315c314220>
    └ <Handle Task.task_wakeup(<Future finished result=None>)>
  File "/usr/lib/python3.12/asyncio/events.py", line 88, in _run
    self._context.run(self._callback, *self._args)
    │    │            │    │           │    └ <member '_args' of 'Handle' objects>
    │    │            │    │           └ <Handle Task.task_wakeup(<Future finished result=None>)>
    │    │            │    └ <member '_callback' of 'Handle' objects>
    │    │            └ <Handle Task.task_wakeup(<Future finished result=None>)>
    │    └ <member '_context' of 'Handle' objects>
    └ <Handle Task.task_wakeup(<Future finished result=None>)>

  File "[32m/home/cownose/code/pr-agent/pr_agent/agent/[0m[32m[1mpr_agent.py[0m", line [33m123[0m, in [35mhandle_request[0m
    [35m[1mreturn[0m [35m[1mawait[0m [1mself[0m[35m[1m.[0m[1m_handle_request[0m[1m([0m[1mpr_url[0m[1m,[0m [1mrequest[0m[1m,[0m [1mnotify[0m[1m)[0m
    [36m             │    │               │       │        └ [0m[36m[1mNone[0m
    [36m             │    │               │       └ [0m[36m[1m['review'][0m
    [36m             │    │               └ [0m[36m[1m'main'[0m
    [36m             │    └ [0m[36m[1m<function PRAgent._handle_request at 0x7b3152e1f600>[0m
    [36m             └ [0m[36m[1m<pr_agent.agent.pr_agent.PRAgent object at 0x7b31532b8950>[0m

  File "[32m/home/cownose/code/pr-agent/pr_agent/agent/[0m[32m[1mpr_agent.py[0m", line [33m116[0m, in [35m_handle_request[0m
    [35m[1mawait[0m [1mcommand2class[0m[1m[[0m[1maction[0m[1m][0m[1m([0m[1mpr_url[0m[1m,[0m [1mai_handler[0m[35m[1m=[0m[1mself[0m[35m[1m.[0m[1mai_handler[0m[1m,[0m [1margs[0m[35m[1m=[0m[1margs[0m[1m)[0m[35m[1m.[0m[1mrun[0m[1m([0m[1m)[0m
    [36m      │             │       │                  │    │                └ [0m[36m[1m[][0m
    [36m      │             │       │                  │    └ [0m[36m[1m<class 'pr_agent.algo.ai_handlers.litellm_ai_handler.LiteLLMAIHandler'>[0m
    [36m      │             │       │                  └ [0m[36m[1m<pr_agent.agent.pr_agent.PRAgent object at 0x7b31532b8950>[0m
    [36m      │             │       └ [0m[36m[1m'main'[0m
    [36m      │             └ [0m[36m[1m'review'[0m
    [36m      └ [0m[36m[1m{'auto_review': <class 'pr_agent.tools.pr_reviewer.PRReviewer'>, 'answer': <class 'pr_agent.tools.pr_reviewer.PRReviewer'>, '...[0m

  File "[32m/home/cownose/code/pr-agent/pr_agent/tools/[0m[32m[1mpr_reviewer.py[0m", line [33m160[0m, in [35mrun[0m
    [1mpr_review[0m [35m[1m=[0m [1mself[0m[35m[1m.[0m[1m_prepare_pr_review[0m[1m([0m[1m)[0m
    [36m            │    └ [0m[36m[1m<function PRReviewer._prepare_pr_review at 0x7b3152e1d4e0>[0m
    [36m            └ [0m[36m[1m<pr_agent.tools.pr_reviewer.PRReviewer object at 0x7b3152f680e0>[0m

  File "[32m/home/cownose/code/pr-agent/pr_agent/tools/[0m[32m[1mpr_reviewer.py[0m", line [33m258[0m, in [35m_prepare_pr_review[0m
    [1mmarkdown_text[0m [35m[1m=[0m [1mconvert_to_markdown_v2[0m[1m([0m[1mdata[0m[1m,[0m [1mself[0m[35m[1m.[0m[1mgit_provider[0m[35m[1m.[0m[1mis_supported[0m[1m([0m[36m"gfm_markdown"[0m[1m)[0m[1m,[0m
    [36m                │                      │     │    │            └ [0m[36m[1m<function LocalGitProvider.is_supported at 0x7b315352f9c0>[0m
    [36m                │                      │     │    └ [0m[36m[1m<pr_agent.git_providers.local_git_provider.LocalGitProvider object at 0x7b31530edf40>[0m
    [36m                │                      │     └ [0m[36m[1m<pr_agent.tools.pr_reviewer.PRReviewer object at 0x7b3152f680e0>[0m
    [36m                │                      └ [0m[36m[1m{'review': {'estimated_effort_to_review_[1-5]': '4\n', 'relevant_tests': 'Yes\n', 'security_concerns': 'No\n', 'key_issues_to...[0m
    [36m                └ [0m[36m[1m<function convert_to_markdown_v2 at 0x7b3154e36c00>[0m

  File "[32m/home/cownose/code/pr-agent/pr_agent/algo/[0m[32m[1mutils.py[0m", line [33m290[0m, in [35mconvert_to_markdown_v2[0m
    [1mrelevant_lines_str[0m [35m[1m=[0m [1mextract_relevant_lines_str[0m[1m([0m[1mend_line[0m[1m,[0m [1mfiles[0m[1m,[0m [1mrelevant_file[0m[1m,[0m [1mstart_line[0m[1m,[0m [1mdedent[0m[35m[1m=[0m[36m[1mTrue[0m[1m)[0m
    [36m                     │                          │         │      │              └ [0m[36m[1m136[0m
    [36m                     │                          │         │      └ [0m[36m[1m'packages/orders-backend/src/routes/refund.ts'[0m
    [36m                     │                          │         └ [0m[36m[1m[FilePatchInfo(base_file='', head_file='---\n"@carte/orders-backend": minor\n---\n\nRoute `@carte/orders-backend` through the...[0m
    [36m                     │                          └ [0m[36m[1m136[0m
    [36m                     └ [0m[36m[1m<function extract_relevant_lines_str at 0x7b3154e36ca0>[0m

  File "[32m/home/cownose/code/pr-agent/pr_agent/algo/[0m[32m[1mutils.py[0m", line [33m335[0m, in [35mextract_relevant_lines_str[0m
    [1mfiles[0m [35m[1m=[0m [1mset_file_languages[0m[1m([0m[1mfiles[0m[1m)[0m
    [36m        │                  └ [0m[36m[1m[FilePatchInfo(base_file='', head_file='---\n"@carte/orders-backend": minor\n---\n\nRoute `@carte/orders-backend` through the...[0m
    [36m        └ [0m[36m[1m<function set_file_languages at 0x7b3154e37e20>[0m

> File "[32m/home/cownose/code/pr-agent/pr_agent/algo/[0m[32m[1mutils.py[0m", line [33m1455[0m, in [35mset_file_languages[0m
    [1mextension_s[0m [35m[1m=[0m [36m'.'[0m [35m[1m+[0m [1mfile[0m[35m[1m.[0m[1mfilename[0m[35m[1m.[0m[1mrsplit[0m[1m([0m[36m'.'[0m[1m)[0m[1m[[0m[35m[1m-[0m[34m[1m1[0m[1m][0m
    [36m                    │    └ [0m[36m[1mNone[0m
    [36m                    └ [0m[36m[1mFilePatchInfo(base_file='import type { RouteContext } from "emdash";\n\n// Two-phase idempotency: a synchronous `in-progress`...[0m

[31m[1mAttributeError[0m:[1m 'NoneType' object has no attribute 'rsplit'[0m
[32m2026-05-14 10:16:18.340[0m | [31m[1mERROR   [0m | [36mpr_agent.tools.pr_reviewer[0m:[36mset_review_labels[0m:[36m415[0m - [31m[1mFailed to set review labels, error: Getting labels is not implemented for the local git provider[0m
sys:1: RuntimeWarning: coroutine 'Logging.async_success_handler' was never awaited
RuntimeWarning: Enable tracemalloc to get the object allocation traceback
```

- Exit code: 0
- Wall time seconds: 100
- Finished: 2026-05-14T10:16:19-07:00

## Generated Review

## PR Reviewer Guide 🔍

Here are some key observations to aid the review process:

### ⏱️ Estimated effort to review: 4 🔵🔵🔵🔵⚪

### 🧪 PR contains tests

### 🔒 No security concerns identified

### ⚡ Recommended focus areas for review

####

**Possible Issue**

When `input.amount` is undefined (omitted by the caller for a full refund), `input.amount ?? 0` sends `amount: 0` to the Tender SDK. The old Stripe code omitted the amount parameter, which triggered a full refund of the charge. Sending 0 will either attempt a $0 refund or cause Tender to reject the request. A caller that relied on the v0.1 optional-amount-for-full-refund contract will silently get a no-op refund instead of the intended full refund.

**Data Accumulation**

`markUndoCompleted` and `markUndoExpired` write `UndoStatusRecord` entries to KV without `expirationTtl`. These status records persist indefinitely while the original undo records expire after 600 seconds. Over time, `tool-undo-status:*` keys accumulate without cleanup, consuming plugin KV quota. Add an `expirationTtl` aligned with the undo TTL or slightly longer (e.g., 900s) to allow expired-undo lookups while still ensuring eventual reclamation.

**Race Condition**

Between the `kv.get` idempotency check and the `kv.set` write in `prepareTenderPaymentEvent`, a concurrently delivered duplicate Tender event could also see a null marker and proceed to schedule a duplicate `markOrderPaid`/`markOrderRefunded` via `ctx.waitUntil`. The old Stripe webhook handler used a two-phase "in-progress" → "completed" approach to narrow this window. Under concurrent Tender event redelivery, this can cause duplicate order status content updates. Impact is limited because the update is idempotent in nature (setting status to the same value), but it wastes subrequest budget and could briefly create inconsistent audit trails.
