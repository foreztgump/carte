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
Carte ships 6 plugins on the EmDash plugin SDK (target v0.9.x — verify before lock). The constraints below are non-negotiable; violating any one is grounds for blocking review.

- **Sandboxed CPU/subrequest budget is HARD**: 50ms CPU + 10 subrequests per invocation. Audit subrequest count when authoring sandboxed handlers (Stripe webhook example uses ~7 of 10). If you approach the ceiling, redesign — do not "try to fit it."
- **`ctx.waitUntil` / `after()` is mandatory** for any async work that must run after the response is returned (EmDash Issue #710). Fire-and-forget without it will be killed mid-flight.
- **Block Kit gotchas**: use `label` not `text`; use `items` not `stats`; no markdown in section text; no HTTP redirects from plugin routes.
- **No raw SQL** — plugins use `ctx.content.*`. Plugin KV is auto-scoped; do not declare it in the manifest.
- **Plugin routes mount at** `/_emdash/api/plugins/<plugin-id>/<route>`. Never assume root paths or hardcode prefixes.
- **Capability naming is locked**: use only canonical resource:verb names from `github.com/emdash-cms/emdash/blob/main/skills/creating-plugins/SKILL.md` — `content:read`, `content:write`, `media:read`, `media:write`, `network:request` / `network:request:unrestricted`, `email:send`, `users:read`, plus `hooks.<x>:register` forms.
- **Cloudflare Free plan has no Dynamic Workers** — sandboxed plugins lose isolation on Free. Document this in plugin READMEs and surface in install flow.
- **Stripe webhook MUST be idempotent**: dedupe via KV `idempotency:{stripeEventId}` with 7-day TTL. Re-deliveries are routine, not exceptional.
- **Reservation capacity uses KV atomic decrement** — race-safe pattern is non-negotiable. No read-modify-write on capacity counters.
- **AI plugin contract**: read-by-default, write-on-confirm. PII never leaves to LLM without explicit user consent — enforce at the tool-call boundary, not in prompts.
- **PCI scope minimized**: Stripe Checkout handles all card data. Carte infrastructure must NEVER receive raw PAN/CVC. If you find yourself touching card fields, stop — you've taken a wrong turn.
- **Schema.org JSON-LD**: validate against Google Rich Results Test before shipping any storefront component.

## Plugin Inventory (v0.1)
| Plugin | License | Execution |
|---|---|---|
| `@carte/core` | MIT | Sandboxed |
| `@carte/reservations` | MIT | Sandboxed |
| `@carte/orders-backend` | MIT | Sandboxed |
| `@carte/orders-admin` | MIT | Native React |
| `@carte/views` | MIT (npm peer-dep) | Astro components |
| `@carte/ai` | Commercial $99/yr (14-day trial) | Native React |

Stack: TypeScript, EmDash plugin SDK (target v0.9.x), Cloudflare Workers (D1/R2/KV/Dynamic Workers), Astro storefront, React native admin, Stripe Checkout, Portable Text rich content, schema.org JSON-LD.

## Existing Conventions
[Document what was found, not what we wish existed]
- Commits: only one initial commit so far (`chore: initial commit`) — establish conventional-commit pattern going forward (`type(scope): desc`)
- Branches: only `main` so far — feature/fix branches to follow Linear convention below once PREFIX is locked
- Code style: TBD — TypeScript strict + ESLint + Prettier expected; not yet configured. Lock these in the first scaffolding change.

## Linear Integration
- **Repo Label**: `repo:carte` — all issues MUST have this label
- **Project**: `CART` (PLANNED — Linear not yet configured; PREFIX is TBD pending Linear setup, treat `CART` as the working assumption)
- **Branch**: `feature/CART-XXX-desc` or `fix/CART-XXX-desc`
- **Commit**: `type(scope): desc [CART-XXX]`

## Tool Workflow
- **Research**: Context7 (`resolve-library-id` → `query-docs`) → Tavily (`tavily_search`, `tavily_extract`, `tavily_research`, `tavily_crawl`, `tavily_map`) → OpenMemory (`openmemory query`). Never use built-in WebSearch or WebFetch.
- **Linear**: Update status on start/complete. All issues need `repo:carte` label.
- **Spec**: `/opsx:new` → `/opsx:ff` → review → implement → `/opsx:verify` → `/opsx:archive`
- **Plan & Execute**: `/superpowers:brainstorming` → `/superpowers:writing-plans` → `/superpowers:executing-plans`
- **Review**: Local review droid before every commit. `pr-agent-runner` skill for PR-level review (replaces CodeRabbit). `npx ecc-agentshield scan` for `.claude/` and `.factory/` config security.
- **Navigate**: LSP (`goToDefinition`, `findReferences`, `documentSymbol`, `workspaceSymbol`) — prefer over grep. Requires `ENABLE_LSP_TOOL=1`.
- **Test**: Playwright for E2E and visual validation.

## OpenMemory Checkpoints
Mandatory at every workflow phase boundary. Run `openmemory query` before starting, `openmemory store` after completing.
See `skills/openmemory_checkpoints` for the full checkpoint schedule.

## Workflows
- `/work CART-XXX` — Linear issue to PR
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
