# Project Guidelines

## Code Quality

Mandatory: SRP, no magic values, descriptive names, error handling on boundaries,
max 40 lines / 3 params / 3 nesting, no duplication, YAGNI, Law of Demeter, AAA tests.
Prefer: KISS (simplest solution wins), deep modules, composition over inheritance,
strategic programming. See CODE_PRINCIPLES.md for full details.

## Behavioral Rules

- Never guess versions, APIs, or config syntax from training knowledge — always research first (see Tool Workflow below).
- When a task feels too complex or requires touching many files, stop and ask before proceeding. Over-engineering is the most common failure mode.
- When encountering an unfamiliar pattern in the codebase, use LSP (`goToDefinition`, `findReferences`) to understand it before modifying it. Don't assume based on naming alone.
- Before creating any abstraction (interface, base class, wrapper, utility), ask: does the current task require this? If not, don't build it.
- When stuck or confused for more than 2 attempts at the same problem, say so explicitly rather than trying more variations. The codebase may need fixing, not the approach.
- Prefer modifying existing patterns over introducing new ones. If the codebase does auth one way, do auth the same way unless explicitly told otherwise.
- Always request local code review before committing. Fix Critical and Important issues before proceeding. Never push unreviewed code.

# Append project-specific gotchas below — silent footguns, API traps, conversion

# boundaries, fallback values, platform constraints. Pull from audit_findings.

## EmDash Plugin Constraints

Carte ships 6 plugins on EmDash `0.18` (`@emdash-cms/plugin-cli@0.5.1` exact). The constraints below are non-negotiable; violating any one is grounds for blocking review.

- **0.18 plugin formats**: plugins are authored in one of two formats — **sandboxed** (declared via an `emdash-plugin.jsonc` manifest, built with the `emdash-plugin` CLI) or **native** (`definePlugin(...)` exported from an `entrypoint`, in-process and unsandboxed). There is **no `emdash-plugin install` command** — installation is an `astro.config.mjs` edit (`sandboxed: []` + `sandboxRunner` for sandboxed; `plugins: []` for native) plus redeploy.
- **Sandboxed runtime budget is per-runner**: on the **Cloudflare** runner (Dynamic Worker Loader) the HARD per-invocation limits are 50ms CPU + 10 subrequests + 30s wall time; the local **workerd** runner enforces **wall-clock only** (no CPU/subrequest/memory ceiling) — see `docs/VERIFIED-PLATFORM-0.18-carte.md` §6. Design to the Cloudflare ceiling regardless. Audit subrequest count when authoring sandboxed handlers (Stripe webhook example uses ~7 of 10). If you approach the ceiling, redesign — do not "try to fit it." (Note: the 10-subrequest figure is the sandbox runner's Worker Loader cap, distinct from the Workers platform subrequest limit — 50 on the Free plan, 10,000 on Paid; old docs that quote "50 on paid" are wrong.)
- **No post-response primitive exists for sandboxed handlers** (verified: `docs/VERIFIED-PLATFORM-0.18-carte.md` §7 — no `ctx.waitUntil`, no `after()`). ALL async work in sandboxed hooks/routes must complete in-request (await it before returning). Fire-and-forget will be killed mid-flight.
- **Block Kit gotchas**: use `label` not `text`; use `items` not `stats`; no markdown in section text; no HTTP redirects from plugin routes.
- **No raw SQL** — plugins use `ctx.content.*`. Plugin KV is auto-scoped; do not declare it in the manifest.
- **Plugin routes mount at** `/_emdash/api/plugins/<plugin-id>/<route>`. Never assume root paths or hardcode prefixes.
- **Capability naming is locked**: use only canonical resource:verb names from `github.com/emdash-cms/emdash/blob/main/skills/creating-plugins/SKILL.md` — `content:read`, `content:write`, `media:read`, `media:write`, `network:request` / `network:request:unrestricted`, `email:send`, `users:read`, plus `hooks.<x>:register` forms.
- **Cloudflare Free plan has no Dynamic Worker Loader** — Cloudflare Free cannot isolate sandboxed plugins (see `emdash` Issue #149), so sandboxed plugins lose isolation and run unsandboxed (in-process) on Free. Document this in plugin READMEs and surface in install flow.
- **Stripe webhook MUST be idempotent**: dedupe via KV `idempotency:{stripeEventId}` with 7-day TTL. Re-deliveries are routine, not exceptional.
- **Reservation capacity uses KV atomic decrement** — race-safe pattern is non-negotiable. No read-modify-write on capacity counters.
- **AI plugin contract**: read-by-default, write-on-confirm. PII never leaves to LLM without explicit user consent — enforce at the tool-call boundary, not in prompts.
- **PCI scope minimized**: Stripe Checkout handles all card data. Carte infrastructure must NEVER receive raw PAN/CVC. If you find yourself touching card fields, stop — you've taken a wrong turn.
- **Schema.org JSON-LD**: validate against Google Rich Results Test before shipping any storefront component.

## Plugin Inventory (v0.1)

| Plugin                  | License                          | Execution        |
| ----------------------- | -------------------------------- | ---------------- |
| `@carte/core`           | MIT                              | Sandboxed        |
| `@carte/reservations`   | MIT                              | Sandboxed        |
| `@carte/orders-backend` | MIT                              | Sandboxed        |
| `@carte/orders-admin`   | MIT                              | Native React     |
| `@carte/views`          | MIT (npm peer-dep)               | Astro components |
| `@carte/ai`             | Commercial $99/yr (14-day trial) | Native React     |

## Stack Pins (EmDash 0.18 — locked 2026-06-12)

- EmDash: `0.18.0`. `@emdash-cms/plugin-cli@0.5.1` (exact pin — provides the `emdash-plugin` binary). `@emdash-cms/sandbox-workerd@0.1.6`. `@emdash-cms/blocks` + `@emdash-cms/cloudflare` `0.18.0` (version-locked to emdash — bump together). Supporting: astro 6.4.6, react 19.2.6, wrangler ^4.88.0.

Stack: TypeScript, EmDash `0.18` (sandboxed `emdash-plugin.jsonc` manifests + native `definePlugin`), Cloudflare Workers (D1/R2/KV/Dynamic Worker Loader), Astro storefront, React native admin, Stripe Checkout, Portable Text rich content, schema.org JSON-LD.

## Existing Conventions

- Commits: conventional commits with `[PRO-XXX]` trailer (locked; see CONTRIBUTING.md).
- Branches: `feature/PRO-XXX-desc` / `fix/PRO-XXX-desc` (locked).
- Code style: TypeScript strict (`noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`), ESLint flat config v9, Prettier, husky pre-commit + lint-staged (locked at v0.1).

## Linear Integration

- **Repo Label**: `repo:carte` — all issues MUST have this label
- **Project**: `CART` (working project assumption only; if the Linear team key is ever renamed in future, revisit this separately)
- **Branch**: `feature/PRO-XXX-desc` or `fix/PRO-XXX-desc`
- **Commit**: `type(scope): desc [PRO-XXX]`

## Tool Workflow

- **Research**: Context7 (`resolve-library-id` → `query-docs`) → Tavily (`tavily_search`, `tavily_extract`, `tavily_research`, `tavily_crawl`, `tavily_map`) → OpenMemory (`openmemory query`). Never use built-in WebSearch or WebFetch.
- **Linear**: Update status on start/complete. All issues need `repo:carte` label.
- **Spec**: `/opsx:new` → `/opsx:ff` → review → implement → `/opsx:verify` → `/opsx:archive`
- **Plan & Execute**: `/superpowers:brainstorming` → `/superpowers:writing-plans` → `/superpowers:executing-plans`
- **Review**: Local review droid before every commit. `pr-agent-runner` skill for PR-level review (replaces CodeRabbit). `npx ecc-agentshield scan` for `.claude/` and `.factory/` config security.
- **Navigate**: LSP (`goToDefinition`, `findReferences`, `documentSymbol`, `workspaceSymbol`) — prefer over grep. Requires `ENABLE_LSP_TOOL=1`.
- **Test**: Playwright for E2E and visual validation.

### pr-agent local review env pins

`pr-agent-runner` is the authoritative source for the runnable shell block. Repo
documentation keeps only env names, documented pins, and intent here. Never
commit a live API key, PAT, or captured token value.

| Env var                                       | Documented pin or source                                                                                          | Intent                                                                                                                                               |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENAI__KEY`                                 | Non-empty dummy value such as `sk-dummy`                                                                          | Satisfies PR-Agent/OpenAI client validation while CLIProxy ignores the value.                                                                        |
| `OPENAI__API_BASE`                            | `http://127.0.0.1:8317/v1`                                                                                        | Routes every model call through local CLIProxyAPI.                                                                                                   |
| `GITHUB__USER_TOKEN`                          | Fresh `${GITHUB_PAT:-$(gh auth token)}` at invocation time                                                        | Lets pr-agent post PR comments without reusing a stale captured token.                                                                               |
| `LITELLM_DROP_PARAMS`                         | `true`                                                                                                            | Drops parameters such as temperature that GPT-5 rejects.                                                                                             |
| `CONFIG__MODEL`                               | `$MODEL` selected by review risk tier                                                                             | Keeps all requests on the `openai/` provider path through CLIProxy.                                                                                  |
| `CONFIG__FALLBACK_MODELS`                     | JSON list that excludes the primary model                                                                         | Provides one non-primary fallback per tier, for example `["openai/gpt-5.4-mini"]` for `openai/glm-5.1` or `["openai/glm-5.1"]` for `openai/gpt-5.5`. |
| `CONFIG__MAX_MODEL_TOKENS`                    | `128000`                                                                                                          | Pins the context cap pr-agent enforces.                                                                                                              |
| `CONFIG__CUSTOM_MODEL_MAX_TOKENS`             | `128000`                                                                                                          | Mirrors the cap for models LiteLLM may not know.                                                                                                     |
| `PR_REVIEWER__REQUIRE_SECURITY_REVIEW`        | `true`                                                                                                            | Requires the security review pass.                                                                                                                   |
| `PR_REVIEWER__REQUIRE_TESTS_REVIEW`           | `true`                                                                                                            | Requires the tests review pass.                                                                                                                      |
| `PR_REVIEWER__REQUIRE_TICKET_ANALYSIS_REVIEW` | `false`                                                                                                           | Skips the GraphQL sub-issue fetch that emits benign NOT_FOUND noise.                                                                                 |
| `PR_REVIEWER__NUM_MAX_FINDINGS`               | `5`                                                                                                               | Caps key review findings.                                                                                                                            |
| `PR_REVIEWER__INLINE_CODE_COMMENTS`           | `true`                                                                                                            | Posts line-anchored review comments.                                                                                                                 |
| `PR_REVIEWER__EXTRA_INSTRUCTIONS`             | CODE_PRINCIPLES hard rules, P0/P1/P2/P3 severity, file:line precision, skip nitpicks, no commented-out code fixes | Keeps review output actionable and aligned with repository rules.                                                                                    |
| `PR_CODE_SUGGESTIONS__NUM_CODE_SUGGESTIONS`   | `5`                                                                                                               | Caps generated improvement suggestions.                                                                                                              |
| `PR_CODE_SUGGESTIONS__EXTRA_INSTRUCTIONS`     | Applicable-as-is suggestions, problem explanation, replacement diff, skip non-functional style preferences        | Keeps `--improve` suggestions directly usable.                                                                                                       |

## OpenMemory Checkpoints

Mandatory at every workflow phase boundary. Run `openmemory query` before starting, `openmemory store` after completing.
See `skills/openmemory_checkpoints` for the full checkpoint schedule.

## Workflows

- `/work PRO-XXX` — Linear issue to PR
- `/work-local '<description>'` — standalone workflow
- `/resume` — continue where you left off
- `/fix '<bug>'` — debug and fix

## Session Strategy

- **New session** for: new features, unrelated bugs, fresh context needed
- **Resume** (`/resume`) for: continuing in-progress work, returning after a break
- Run `/compact` proactively at natural phase boundaries (after research, after planning, after implementation)
- If a session exceeds ~200k tokens, start fresh and use OpenMemory + WRAP_UP.md to restore context

## Documentation Updates

After every implementation, check and update: README.md, CHANGELOG.md, API docs, AGENTS.md, OpenSpec specs.

## Reference Documents

- `PRD.md` — full v0.1 product requirements (~1040 lines, exhaustive spec for all 6 plugins)
- `research/` — supporting research notes (EmDash SDK behavior, Cloudflare Workers limits, Stripe integration patterns)
- **Open Questions**: PRD §"Open Questions" lists 12 items that MUST be resolved before code lock — including MCP tool registration API surface and free-trial enforcement strategy for `@carte/ai`. Follow the locked canonical capability names from the EmDash SKILL.md source of truth rather than any deprecated aliases.
