# PRO-908 Security Review

**Issue:** PRO-908
**Scope:** `@carte/core`, `@carte/reservations`, `@carte/orders-backend`,
`@carte/orders-admin`, `@carte/views`
**Deferred:** `@carte/ai` PII-boundary review is deferred to the `@carte/ai`
track.
**Summary:** No open criticals. One high-priority trust-contract finding is
tracked in PRO-912, and the WAF implementation gap is tracked in PRO-911.

## Methodology

- AgentShield scans over `packages/`, `.factory/`, and `.claude/`.
- Manual package review for capabilities, sandbox assumptions, GDPR, Tender/PCI,
  and WAF carve-out.
- Validation commands recorded in the evidence log.
- Findings are recorded only when substantiated by command output or a
  `file:line` evidence path.

## Findings

| ID       | Severity | Area         | Evidence                                                                                                                                                                                                                                   | Disposition                                                                                                                                                                                                                                                                                       |
| -------- | -------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AS-001   | P3       | AgentShield  | `npx --yes ecc-agentshield scan -p .factory/`                                                                                                                                                                                              | 20 low docs/example command findings matched existing allowlist entries.                                                                                                                                                                                                                          |
| CAP-001  | P3       | Capabilities | `packages/core/README.md:15-16`; `packages/core/emdash-plugin.jsonc:19`                                                                                                                                                                    | Fixed in change. README capability list now matches the manifest and no longer lists `media:read`.                                                                                                                                                                                                |
| CAP-002  | P1       | Capabilities | `packages/orders-backend/emdash-plugin.jsonc:17-20`; `packages/orders-backend/src/routes/checkout.ts:124-135`; `packages/orders-backend/src/routes/refund.ts:162-173`                                                                      | Tracked in PRO-912. Manifest allowlist is non-empty and wildcard-free, but observed Tender SDK traffic uses `ctx.http.fetch` against `settings.tenderBaseUrl`, while the only declared host is `license.carteplugin.dev`. Changing that trust contract requires the Tender host decision.         |
| CAP-003  | P2       | Capabilities | `packages/orders-backend/emdash-plugin.jsonc:17-20`; command `rg "ctx\\.email\|email\\.send" packages/orders-backend/src`                                                                                                                  | Fixed in change. `email:send` was declared for guest emails, but no `ctx.email` or `email.send` usage was observed in `packages/orders-backend/src`; the manifest, manifest test, and package README now remove that unused capability.                                                           |
| DOC-001  | P3       | SECURITY.md  | `SECURITY.md:41-44`; `packages/orders-backend/src/events.ts:3-8`; `packages/orders-backend/src/routes/checkout.ts:101-113`                                                                                                                 | Fixed in change. SECURITY.md no longer says `@carte/orders-backend` verifies Stripe webhook signatures directly; it now describes the Tender-owned checkout/webhook boundary and Carte's Tender SDK/result consumption.                                                                           |
| SBOX-001 | P3       | Sandbox      | `docs/VERIFIED-PLATFORM-0.18-carte.md:448-453`; `packages/core/README.md:41-44`; `packages/reservations/README.md:41-45`; `packages/orders-backend/README.md:48-52`                                                                        | Accepted environmental caveat. Cloudflare Free lacks Dynamic Worker Loader isolation, so sandboxed plugins run in-process on Free; per-package README disclosures already state this operator limitation.                                                                                         |
| SBOX-002 | P3       | Sandbox      | `packages/orders-admin/src/index.ts:1-8`; `packages/orders-admin/src/index.ts:30-40`; `packages/orders-admin/README.md:18-19`; `packages/orders-admin/README.md:50-52`                                                                     | Accepted native-plugin caveat. `@carte/orders-admin` runs in-process with advisory capabilities; its browser admin uses same-origin host plugin routes, not sandbox egress.                                                                                                                       |
| SBOX-003 | P2       | Reservations | `docs/VERIFIED-PLATFORM-0.18-carte.md:635`; `packages/reservations/src/capacity.ts:12-19`; `packages/reservations/src/capacity.ts:31-35`; `packages/reservations/src/capacity.ts:182-185`; `packages/reservations/src/capacity.ts:198-208` | Accepted known limitation. Same-isolate reservations claims are serialized by the module-scoped per-slot queue; cross-isolate Cloudflare capacity races remain a documented residual risk and fail loud via `CapacitySurveyLimitExceededError` instead of silently authorizing a truncated count. |
| WAF-001  | P2       | WAF          | Targeted config grep for ruleset/WAF/firewall/http_request_firewall over Terraform, wrangler, and workflow config; `docs/superpowers/plans/2026-06-14-pro-908-security-review.md:247-255`                                                  | Follow-up required: PRO-911. No in-repo Cloudflare WAF carve-out config was found. Intended implementation is a Rulesets API custom rule with `Skip`, scoped to the exact Tender webhook host/path/method after infra ownership confirms it, ordered before managed execute rules it must skip.   |

## Package × Dimension Matrix

| Package                 | Capability minimality                                                                                                                                               | Sandbox boundary                                                                                                                                                                                                  | GDPR     | Tender/PCI                                                                                                       | WAF                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `@carte/core`           | Complete. Declared `content:read`, `content:write`; observed `ctx.content` list/update/create usage; README drift fixed.                                            | Complete. Sandboxed, no outbound network primitives observed; relies on runtime capability enforcement and has the Cloudflare Free no-isolation caveat.                                                           | Complete | N/A                                                                                                              | Gap: no WAF config in repo; follow-up needed. |
| `@carte/reservations`   | Complete. Declared `content:read`, `content:write`, `email:send`; observed reservation storage reads/writes and `ctx.email.send`.                                   | Complete with known limitation. No outbound network primitives observed; capacity same-isolate serialization and cross-isolate residual risk are documented.                                                      | N/A      | N/A                                                                                                              | Gap: no WAF config in repo; follow-up needed. |
| `@carte/orders-backend` | Finding tracked. Declared `content:read`, `content:write`, `network:request`; unused `email:send` was removed, but Tender host coverage remains tracked in PRO-912. | Finding tracked. Sandbox egress uses `ctx.http.fetch`, but CAP-002/PRO-912 tracks that observed Tender egress is driven by `settings.tenderBaseUrl` while `allowedHosts` declares only `license.carteplugin.dev`. | N/A      | Complete. Carte consumes Tender-hosted checkout URLs and Tender transaction/refund ids; no raw PAN/CVC observed. | Gap: no WAF config in repo; follow-up needed. |
| `@carte/orders-admin`   | Complete. Native `definePlugin` declares `content:read`, `content:write`, with no `network:request`.                                                                | Complete. Native/in-process plugin; capabilities are advisory, not isolate-enforced. Browser admin fetches same-origin host plugin routes.                                                                        | N/A      | N/A                                                                                                              | Gap: no WAF config in repo; follow-up needed. |
| `@carte/views`          | Complete. Not an EmDash plugin; no manifest or capability declaration.                                                                                              | N/A. Peer-dependency component library with no sandbox or plugin capability boundary.                                                                                                                             | N/A      | Complete. Redirect and script-JSON helpers enforce checkout/script context boundaries.                           | Gap: no WAF config in repo; follow-up needed. |

## Capability Minimality Audit

### `@carte/core`

- Manifest source of truth declares `content:read`, `content:write` and an empty
  host allowlist (`packages/core/emdash-plugin.jsonc:19-20`).
- Observed usage matches those capabilities: routes and helpers use
  `ctx.content` for list/update/create paths (`packages/core/src/routes.ts:11-18`,
  `packages/core/src/gdpr.ts:45-50`,
  `packages/core/src/audit/log.ts:72-73`), and no `ctx.email`, `ctx.http`,
  `ctx.media`, or `ctx.users` usage was observed under `packages/core/src`.
- Manifest tests pin the minimal set
  (`packages/core/src/__tests__/manifest.test.ts:14`,
  `packages/core/src/__tests__/manifest.test.ts:174-175`).
- README drift was confirmed and corrected. The README now lists only
  `content:read`, `content:write` (`packages/core/README.md:15-16`), matching
  the manifest.

### `@carte/reservations`

- Manifest source of truth declares `content:read`, `content:write`,
  `email:send` and an empty host allowlist
  (`packages/reservations/emdash-plugin.jsonc:17-18`).
- Observed usage matches the package's collection and email surfaces:
  reservation records are read and written through the reservation collection
  (`packages/reservations/src/routes/context.ts:17-41`,
  `packages/reservations/src/routes/submit.ts:31-33`,
  `packages/reservations/src/routes/confirm.ts:10-12`,
  `packages/reservations/src/routes/cancel.ts:13-15`), capacity rows are queried
  and written (`packages/reservations/src/capacity.ts:170-183`), and reservation
  email sends use `ctx.email.send`
  (`packages/reservations/src/routes/email.ts:53-64`).
- No `network:request` capability is declared, and no `ctx.http` usage was
  observed under `packages/reservations/src`.

### `@carte/orders-backend`

- Manifest source of truth declares `content:read`, `content:write`,
  `network:request`, with `allowedHosts` set to
  `["license.carteplugin.dev"]`
  (`packages/orders-backend/emdash-plugin.jsonc:17-21`). The manifest test also
  asserts that Stripe hosts and `network:request:unrestricted` stay absent
  (`packages/orders-backend/src/manifest.test.ts:16-26`).
- The allowlist is non-empty and contains no wildcard. The declared host is
  justified by the manifest comment as the license host, but this Task 2 audit
  did not observe an orders-backend source path that calls
  `license.carteplugin.dev`.
- Observed Tender SDK traffic is through `ctx.http.fetch`: checkout and refund
  both read `settings.tenderBaseUrl`, require `ctx.http`, and pass
  `requireHttp(ctx).fetch` to `createTenderClient`
  (`packages/orders-backend/src/routes/checkout.ts:124-135`,
  `packages/orders-backend/src/routes/refund.ts:162-173`). Tests exercise a
  Tender base URL of `https://restaurant.example`
  (`packages/orders-backend/src/test-support.ts:65`,
  `packages/orders-backend/src/test-support.ts:107`) and assert the SDK receives
  that base URL plus a fetch function
  (`packages/orders-backend/src/routes.test.ts:80-83`).
- Finding CAP-002/PRO-912 records the trust-contract mismatch: observed Tender egress is
  against `settings.tenderBaseUrl`, while the only declared allowlist host is
  `license.carteplugin.dev`.
- Finding CAP-003 was fixed in this change: `email:send` was removed from the
  manifest, manifest test, and package README after
  `rg "ctx\\.email|email\\.send" packages/orders-backend/src` found no source
  usage.

### `@carte/orders-admin`

- Native plugin source declares `content:read`, `content:write` in
  `definePlugin` and registers only local admin routes/pages
  (`packages/orders-admin/src/index.ts:30-40`).
- Tests assert canonical capability names and explicitly reject
  `network:request` (`packages/orders-admin/src/index.test.ts:32-39`).
- No `ctx.http`, `ctx.email`, `ctx.media`, or `ctx.users` usage was observed
  under `packages/orders-admin/src`. Because this package is native, the
  sandbox-boundary task will separately document that these capabilities are
  advisory rather than isolate-enforced.

### `@carte/views`

- `@carte/views` is a peer-dependency component library, not an EmDash plugin:
  the README states "NOT an EmDash plugin" and "No sandbox, no manifest, no
  `definePlugin()` call" (`packages/views/README.md:5-7`), and `package.json`
  describes it as a peer-dep library
  (`packages/views/package.json:2-5`).
- `Glob packages/views/**/emdash-plugin.jsonc` returned no manifest, and grep
  found no package capability declarations.

## Sandbox Boundary Audit

### Runtime boundary facts

- EmDash 0.18 sandboxed packages rely on host runtime enforcement of declared
  capabilities and `allowedHosts`. The verified platform notes record
  Cloudflare Worker Loader limits of 50 ms CPU, 10 subrequests, and 30 s
  wall-clock per invocation, while the local workerd path enforces wall-clock
  only (`docs/VERIFIED-PLATFORM-0.18-carte.md:448-453`).
- Sandboxed handlers do not receive `ctx.waitUntil`, and no global `after`
  primitive exists inside the sandbox (`docs/VERIFIED-PLATFORM-0.18-carte.md:456-493`).
  The orders-backend sandbox adapter therefore settles deferred route tasks
  in-request (`packages/orders-backend/src/plugin.ts:12-14`,
  `packages/orders-backend/src/plugin.ts:54-58`).
- The three sandboxed package READMEs disclose the Cloudflare Free plan caveat:
  Free has no Dynamic Worker Loader isolation, so sandboxed plugins run
  in-process and the whole Worker is one application-code trust boundary
  (`packages/core/README.md:41-44`,
  `packages/reservations/README.md:41-45`,
  `packages/orders-backend/README.md:48-52`).

### Egress trace

- `@carte/core`: source search found no sandbox outbound egress primitive under
  non-test source. The only `Request` construction reconstructs the serialized
  route request for internal route adapters (`packages/core/src/plugin.ts:16-21`).
- `@carte/reservations`: source search found no sandbox outbound egress
  primitive under non-test source. The only `Request` construction reconstructs
  the serialized route request (`packages/reservations/src/plugin.ts:54-59`).
  Email delivery uses the declared `email:send` capability, not arbitrary
  outbound HTTP.
- `@carte/orders-backend`: checkout and refund both require `ctx.http` and pass
  only `requireHttp(ctx).fetch` into `createTenderClient`
  (`packages/orders-backend/src/routes/checkout.ts:116-135`,
  `packages/orders-backend/src/routes/refund.ts:154-173`). No alternate
  sandbox egress primitive was observed in non-test sandboxed source. CAP-002 is
  tracked in PRO-912 because the observed Tender base URL is runtime-configured
  (`settings.tenderBaseUrl`) while the manifest allowlist currently declares
  only `license.carteplugin.dev`
  (`packages/orders-backend/emdash-plugin.jsonc:17-21`).
- `@carte/orders-admin`: native React admin code uses browser `fetch()` to
  same-origin host plugin routes (`packages/orders-admin/src/admin/App.tsx:435-439`,
  `packages/orders-admin/src/modifiers/modifier-group-form.tsx:225-229`;
  base path at `packages/orders-admin/src/admin/order-utils.ts:1-3`). This is
  not sandbox egress. The plugin is native/in-process and declares no
  `network:request` (`packages/orders-admin/src/index.ts:1-8`,
  `packages/orders-admin/src/index.ts:30-40`), so capabilities are advisory
  rather than isolate-enforced.
- `@carte/views`: not an EmDash plugin and has no sandbox boundary
  (`packages/views/README.md:5-7`).

### Subrequest budget

- Checkout source comment records the intended worst case as 6/10 subrequests:
  rate-limit KV get/set, cart-hold KV set, and a Tender charge fetch with up to
  three retry attempts (`packages/orders-backend/src/routes/checkout.ts:4-7`).
- Refund source comment records 2/10: one Tender refund fetch plus one content
  update, with unauthorized callers returning before side effects
  (`packages/orders-backend/src/routes/refund.ts:5-8`).
- `pnpm audit:sandbox-budget` could not run directly in the isolated worktree
  because `node_modules` is absent (`tsx: not found`). The safe read-only
  fallback used the main checkout's installed dependencies and the audit script
  with `--root /home/cownose/projects/carte-pro-908-security-review`; it exited 0. The fallback reports orders-backend checkout as PASS at 3 subrequests and
  refund as PASS at 1 subrequest, and reports reservations submit/cancel-token
  as WARN below the 10-subrequest cap. Full command outcome is in the evidence
  log.

### Reservations capacity residual risk

- The capacity store keeps a module-scoped per-slot promise queue
  (`packages/reservations/src/capacity.ts:12-19`,
  `packages/reservations/src/capacity.ts:198-208`) and routes claims through
  that queue (`packages/reservations/src/capacity.ts:151-160`).
- The verified platform document confirms local workerd same-isolate module
  state reuse, while noting the residual risk that Cloudflare may run multiple
  isolates and no in-process queue can serialize across those isolates
  (`docs/VERIFIED-PLATFORM-0.18-carte.md:635`).
- The mitigation is fail-loud, not a redesign: slot surveys use
  `CLAIM_QUERY_LIMIT = 1000`, and saturated/truncated surveys throw
  `CapacitySurveyLimitExceededError` before authorizing the claim
  (`packages/reservations/src/capacity.ts:4`,
  `packages/reservations/src/capacity.ts:31-35`,
  `packages/reservations/src/capacity.ts:182-185`).

## GDPR Export/Erase Audit

### `@carte/core`

- Export is scoped to the normalized requesting email. The route parses and
  normalizes the `email` query parameter, then filters reservations and orders
  through `matchingItems`/`itemEmailMatches`, which lowercases stored item email
  values before comparing to the normalized request email
  (`packages/core/src/gdpr.ts:33-41`,
  `packages/core/src/gdpr.ts:84-112`,
  `packages/core/src/gdpr.ts:216-227`). The test
  `exports reservations and orders matching the requested email` verifies that
  `guest@example.com` returns the matching reservation and order while excluding
  an order for `other@example.com`
  (`packages/core/src/gdpr.test.ts:42-72`).
- Erase uses the deterministic `erased:<sha256(normalizedEmail)>` placeholder:
  `gdprEraseRoute` computes the placeholder from the normalized request email,
  and `dataWithErasedPii` writes it over every field in `PII_FIELDS`
  (`packages/core/src/gdpr.ts:15`,
  `packages/core/src/gdpr.ts:60-61`,
  `packages/core/src/gdpr.ts:114-123`,
  `packages/core/src/gdpr.ts:237-248`). The revenue-preservation test confirms
  PII is replaced by `erased:[a-f0-9]{64}` while non-PII `currency` and
  `depositTotal` remain present
  (`packages/core/src/gdpr.test.ts:76-125`).
- Erase is audit-then-mutate. `auditThenEraseItem` writes to
  `carte_audit_log` before calling `content.update`; if the audit write throws,
  it returns a per-item failure and does not run the PII update
  (`packages/core/src/gdpr.ts:129-167`,
  `packages/core/src/gdpr.ts:170-185`). Tests verify one audit entry per erased
  record without raw PII and verify that a failing audit write prevents erasure
  of that item while allowing other items to proceed
  (`packages/core/src/gdpr.test.ts:128-169`,
  `packages/core/src/gdpr.test.ts:171-212`).

## Tender/PCI Trust Boundary Audit

### `@carte/orders-backend`

- Checkout accepts cart, order, customer email, return/cancel URLs, and line-item
  name/amount/quantity fields only; no PAN, CVC/CVV, or expiry fields are part
  of `CheckoutInput` or validation
  (`packages/orders-backend/src/routes/checkout.ts:12-22`,
  `packages/orders-backend/src/routes/checkout.ts:50-64`). The only persisted
  checkout value is a short-lived cart hold containing `cartId`, line items,
  `createdAt`, and `expiresAt`
  (`packages/orders-backend/src/routes/checkout.ts:73-86`).
- Hosted checkout creation goes through the Tender SDK with `flow: "hosted"`,
  amount/currency/email/return URLs, and Carte cart/order metadata. Carte returns
  only the Tender-provided `checkoutUrl` to the caller
  (`packages/orders-backend/src/routes/checkout.ts:101-113`,
  `packages/orders-backend/src/routes/checkout.ts:155-160`). The route tests
  confirm the Tender-hosted checkout URL is the response surface and the mocked
  SDK receives cart/order metadata, not card data
  (`packages/orders-backend/src/routes.test.ts:69-98`).
- Refund accepts `orderId`, `transactionId`, optional amount, and reason only;
  the Tender refund request carries `transactionId`, optional amount, mapped
  reason, and an idempotency key
  (`packages/orders-backend/src/routes/refund.ts:21-26`,
  `packages/orders-backend/src/routes/refund.ts:139-151`). Persisted refund
  metadata is limited to refund id, Tender transaction id, optional amount,
  status, and timestamp (`packages/orders-backend/src/routes/refund.ts:50-56`,
  `packages/orders-backend/src/routes/refund.ts:187-194`). The only refund log is
  an operator reconciliation error containing order id, refund id, and failure
  reason, not payment-card fields
  (`packages/orders-backend/src/routes/refund.ts:85-94`).
- The order state-machine seam consumes Tender transaction events only:
  `transactionId`, `orderId`, and `trigger`; order transitions persist
  `tenderTransactionId` plus timestamps and use an idempotency key derived from
  the Tender transaction id and trigger
  (`packages/orders-backend/src/events.ts:21-25`,
  `packages/orders-backend/src/events.ts:66-75`). The module comment explicitly
  records that there is no webhook delivery mechanism in this package and that
  all work completes in-request (`packages/orders-backend/src/events.ts:3-8`).
- Conclusion: based on the reviewed inputs, persisted values, logs, and docs,
  Carte consumes Tender-hosted checkout URLs and Tender transaction/refund
  results only. No code evidence showed Carte receiving, storing, or logging raw
  PAN, CVC/CVV, or expiry values. PCI scope is therefore minimized to consuming
  Tender results, with card entry remaining outside Carte.

### `@carte/views`

- `safe-redirect.ts` enforces HTTPS and an exact host allowlist. The default
  allowlist contains only `checkout.stripe.com`, with caller-supplied additional
  hosts also matched exactly and no wildcard matching
  (`packages/views/src/safe-redirect.ts:9-10`,
  `packages/views/src/safe-redirect.ts:23-31`). Tests cover accepting the
  canonical HTTPS Stripe Checkout host, rejecting HTTP, rejecting look-alike
  hosts, and supporting only explicit additional allowlist hosts
  (`packages/views/src/safe-redirect.test.ts:9-17`,
  `packages/views/src/safe-redirect.test.ts:20-27`,
  `packages/views/src/safe-redirect.test.ts:37-48`).
- `safe-json.ts` escapes script-context data by replacing `</script>`,
  `</style>`, U+2028, and U+2029 before embedding JSON in inline script
  contexts (`packages/views/src/safe-json.ts:1-11`). Tests verify those escapes,
  round-trip parsing, and that script-embedding components import
  `safeJsonForScript` instead of raw `JSON.stringify`
  (`packages/views/src/safe-json.test.ts:10-38`,
  `packages/views/src/safe-json.test.ts:42-49`).

## Cloudflare WAF Carve-Out Audit

- PRO-908 prior research records the required Cloudflare WAF model: use the
  Rulesets API/custom rules surface, a `Skip` action, exact Tender webhook
  host/path/method scope once infrastructure ownership confirms it, and ordering
  before the managed execute rules the webhook must skip
  (`docs/superpowers/plans/2026-06-14-pro-908-security-review.md:247-255`).
  This aligns with the named Cloudflare docs surfaces already captured for this
  task: Rulesets API, custom rules `Skip`, and WAF exceptions/managed rules
  ordering. The legacy Allow/Bypass model is not the documented target.
- In-repo configuration check found no Cloudflare WAF or Rulesets API carve-out
  implementation in Terraform, wrangler config, package wrangler config, or
  GitHub workflow config. The targeted audit command was:
  `rg "(?i)(cloudflare[_ -]?ruleset|ruleset|waf|firewall|http_request_firewall)" --glob "*.tf" --glob "*.tf.json" --glob "**/wrangler*.toml" --glob "**/wrangler*.json" --glob "**/wrangler*.jsonc" --glob ".github/workflows/*"`.
- Gap: no deployed WAF state is asserted from this repository. Intended rule
  shape for the follow-up is:
  - **Surface:** Cloudflare Rulesets API, or Terraform generated from that
    surface.
  - **Expression:** exact Tender webhook host, path, and method after the infra
    owner confirms the delivery URL.
  - **Action:** `Skip` for only the WAF/security features that would otherwise
    block Tender webhook delivery.
  - **Ordering:** placed before the managed execute rules it must skip, because
    WAF exceptions/custom rules are order-sensitive and affect only execute
    rules listed after the exception.
  - **Tracking:** PRO-911.

### Follow-up issue created

**Title:** Implement Cloudflare WAF Skip carve-out for Tender webhook delivery

**Body:**

```markdown
PRO-908 found no in-repo Cloudflare WAF/Rulesets API configuration for the
Tender webhook carve-out.

Implement a Cloudflare Rulesets API custom rule using `Skip`, not legacy
Allow/Bypass. Scope it to the exact Tender webhook host, path, and method after
the infra owner confirms the delivery URL. Order the rule before the managed
execute rules it must skip, because WAF exceptions/custom rules only affect
execute rules evaluated after the skip/exception.

Acceptance:

- Exact Tender webhook host/path/method are confirmed and encoded.
- Action is `Skip` for only the necessary WAF/security features.
- Rule is ordered before the managed execute rules it must skip.
- PRO-908 report links this follow-up issue.

Labels: repo:carte
```

## AgentShield Allowlist Reconciliation

`.agentshield-allowlist.yaml` was read before reconciliation. No allowlist
entries were added or changed.

| AgentShield output                                                                    | Allowlist reconciliation                                                                                                                                              |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/`: 0 findings, 0 high, 0 critical. The scanner reported `Files scanned: 0`. | No findings to reconcile. The `Files scanned: 0` output means this is AgentShield coverage of supported config files in `packages/`, not a source-code security scan. |
| `.claude/`: 0 findings, 0 high, 0 critical. The scanner reported `Files scanned: 0`.  | No findings to reconcile. The `Files scanned: 0` output means this is AgentShield coverage of supported config files in `.claude/`.                                   |
| `.factory/`: 20 low docs/example findings across 10 `opsx-*` command docs.            | All 20 findings matched existing allowlist entries listed below.                                                                                                      |

### Matched `.factory/` allowlist entries

| Finding class from scan                        | Matched allowlist IDs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Missing observation hooks and feedback hooks   | `skills-missing-telemetry-commands/opsx-apply.md`, `skills-missing-telemetry-commands/opsx-archive.md`, `skills-missing-telemetry-commands/opsx-bulk-archive.md`, `skills-missing-telemetry-commands/opsx-continue.md`, `skills-missing-telemetry-commands/opsx-explore.md`, `skills-missing-telemetry-commands/opsx-ff.md`, `skills-missing-telemetry-commands/opsx-new.md`, `skills-missing-telemetry-commands/opsx-onboard.md`, `skills-missing-telemetry-commands/opsx-sync.md`, `skills-missing-telemetry-commands/opsx-verify.md`           |
| Missing version metadata and rollback metadata | `skills-missing-governance-commands/opsx-apply.md`, `skills-missing-governance-commands/opsx-archive.md`, `skills-missing-governance-commands/opsx-bulk-archive.md`, `skills-missing-governance-commands/opsx-continue.md`, `skills-missing-governance-commands/opsx-explore.md`, `skills-missing-governance-commands/opsx-ff.md`, `skills-missing-governance-commands/opsx-new.md`, `skills-missing-governance-commands/opsx-onboard.md`, `skills-missing-governance-commands/opsx-sync.md`, `skills-missing-governance-commands/opsx-verify.md` |

## Evidence Log

| Command or file                                                                                                                                                                                                                                            | Result                                                                                                                                                                                                     |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npx --yes ecc-agentshield scan -p packages/`                                                                                                                                                                                                              | PASS. Grade A, 100/100. Findings: 0 total, 0 critical, 0 high, 0 medium, 0 low. Scanner reported `Files scanned: 0`.                                                                                       |
| `npx --yes ecc-agentshield scan -p .factory/`                                                                                                                                                                                                              | PASS. Grade A, 98/100. Findings: 20 total, 0 critical, 0 high, 0 medium, 20 low. All 20 are docs/example findings matched to `.agentshield-allowlist.yaml`.                                                |
| `npx --yes ecc-agentshield scan -p .claude/`                                                                                                                                                                                                               | PASS. Grade A, 100/100. Findings: 0 total, 0 critical, 0 high, 0 medium, 0 low. Scanner reported `Files scanned: 0`.                                                                                       |
| `npx --yes ecc-agentshield scan -p packages/ --min-severity high --format markdown > docs/security/evidence/agentshield-packages-high.md`                                                                                                                  | PASS. Exact markdown output was supported and captured. Findings: 0 high or critical. Scanner reported `Files scanned: 0`.                                                                                 |
| `.agentshield-allowlist.yaml`                                                                                                                                                                                                                              | READ. Existing allowlist contains 20 low `.factory/commands/opsx-*` entries; no changes made.                                                                                                              |
| `pnpm exec prettier --check docs/security/PRO-908-security-review.md docs/security/evidence/agentshield-packages-high.md`                                                                                                                                  | FAIL. Local worktree has no installed `prettier` binary.                                                                                                                                                   |
| `npx --yes prettier --check docs/security/PRO-908-security-review.md docs/security/evidence/agentshield-packages-high.md`                                                                                                                                  | PASS after formatting both created files with `npx --yes prettier --write`.                                                                                                                                |
| `pnpm exec prettier --write docs/security/PRO-908-security-review.md packages/core/README.md`                                                                                                                                                              | FAIL. Local worktree has no installed `prettier` binary.                                                                                                                                                   |
| `rg "ctx\\.email\|email\\.send" packages/orders-backend/src`                                                                                                                                                                                               | PASS. No output, confirming no `ctx.email` or `email.send` source usage was observed in `packages/orders-backend/src`.                                                                                     |
| `npx --yes prettier --check docs/security/PRO-908-security-review.md packages/core/README.md`                                                                                                                                                              | PASS. Both modified Markdown files use Prettier style.                                                                                                                                                     |
| `pnpm -r test -- --runInBand`                                                                                                                                                                                                                              | FAIL. Worktree had no `node_modules`; package test scripts could not find `vitest`.                                                                                                                        |
| `pnpm install --frozen-lockfile`                                                                                                                                                                                                                           | FAIL. Lockfile is out of sync with `tender/packages/sdk/package.json`; no install was performed.                                                                                                           |
| `pnpm -r test`                                                                                                                                                                                                                                             | FAIL after using a temporary `node_modules` symlink for binaries. Tests started, but `@carte/orders-backend` failed to resolve `@tender/sdk`.                                                              |
| `./node_modules/.bin/vitest run packages/core/src/__tests__/manifest.test.ts packages/reservations/src/manifest.test.ts packages/orders-backend/src/manifest.test.ts`                                                                                      | PASS. 3 test files, 10 tests passed.                                                                                                                                                                       |
| `./node_modules/.bin/tsx -e '<orders-admin capability assertion>'`                                                                                                                                                                                         | PASS. `@carte/orders-admin` factory returned `["content:read","content:write"]` and no `network:request`.                                                                                                  |
| `pnpm --dir /home/cownose/projects/carte-pro-908-security-review audit:sandbox-budget`                                                                                                                                                                     | FAIL. Isolated worktree has no `node_modules`; `tsx: not found`.                                                                                                                                           |
| `pnpm --dir /home/cownose/projects/carte exec tsx scripts/audit-sandbox-budget.ts --root /home/cownose/projects/carte-pro-908-security-review`                                                                                                             | PASS. Safe read-only fallback using main checkout dependencies. Orders-backend checkout PASS at 3 subrequests, refund PASS at 1; reservations submit/cancel-token WARN below cap; no FAIL rows.            |
| `packages/core/src/gdpr.ts`; `packages/core/src/gdpr.test.ts`                                                                                                                                                                                              | READ. GDPR audit evidence confirmed normalized-email export scoping, audit-then-erase ordering, deterministic PII placeholder, and revenue-record preservation.                                            |
| `pnpm --dir /home/cownose/projects/carte-pro-908-security-review -F @carte/core test`                                                                                                                                                                      | FAIL. Isolated worktree has no `node_modules`; package script could not find `vitest`.                                                                                                                     |
| `pnpm --dir /home/cownose/projects/carte exec vitest run src/gdpr.test.ts --config /home/cownose/projects/carte/packages/core/vitest.config.ts --root /home/cownose/projects/carte-pro-908-security-review/packages/core`                                  | PASS. Safe fallback using main checkout dependencies while targeting the isolated worktree core package. `src/gdpr.test.ts`: 1 file, 7 tests passed.                                                       |
| `packages/orders-backend/src/routes/checkout.ts`; `packages/orders-backend/src/routes/refund.ts`; `packages/orders-backend/src/events.ts`; `packages/views/src/safe-redirect.ts`; `packages/views/src/safe-json.ts`                                        | READ. Tender/PCI audit evidence confirmed Carte consumes Tender-hosted checkout URLs and Tender transaction/refund results only; safe redirect and script-JSON helpers enforce checkout/script boundaries. |
| `rg "(?i)(cloudflare[_ -]?ruleset\|ruleset\|waf\|firewall\|http_request_firewall)"` over Terraform, wrangler, package wrangler, and GitHub workflow config                                                                                                 | PASS. No matches found; no in-repo Cloudflare WAF/Rulesets API carve-out implementation was observed.                                                                                                      |
| `SECURITY.md`                                                                                                                                                                                                                                              | UPDATED. Replaced the stale direct Stripe-webhook verification bullet with Tender-owned checkout/webhook boundary wording.                                                                                 |
| `pnpm --dir /home/cownose/projects/carte exec prettier --write SECURITY.md docs/security/PRO-908-security-review.md` (absolute worktree paths used)                                                                                                        | PASS. SECURITY.md unchanged by formatter; PRO-908 report formatted.                                                                                                                                        |
| `pnpm --dir /home/cownose/projects/carte-pro-908-security-review -F @carte/views test`                                                                                                                                                                     | FAIL. Isolated worktree has no `node_modules`; package script could not find `vitest`.                                                                                                                     |
| `pnpm --dir /home/cownose/projects/carte exec vitest run --config /home/cownose/projects/carte/packages/views/vitest.config.ts --root /home/cownose/projects/carte-pro-908-security-review/packages/views`                                                 | FAIL. Safe full-suite fallback executed 47 passing tests, then `src/hours.test.ts` failed to resolve workspace dependency `@carte/core/taxonomy` because the isolated worktree has no `node_modules`.      |
| `pnpm --dir /home/cownose/projects/carte exec vitest run src/safe-redirect.test.ts src/safe-json.test.ts --config /home/cownose/projects/carte/packages/views/vitest.config.ts --root /home/cownose/projects/carte-pro-908-security-review/packages/views` | PASS. Safe focused fallback for the touched boundary helpers: 2 files, 15 tests passed.                                                                                                                    |
| `pnpm --dir /home/cownose/projects/carte exec prettier --check SECURITY.md docs/security/PRO-908-security-review.md` (absolute worktree paths used)                                                                                                        | PASS. All matched files use Prettier code style.                                                                                                                                                           |
| `git diff --check`                                                                                                                                                                                                                                         | PASS. No whitespace errors in the current diff.                                                                                                                                                            |
| `pnpm -C /home/cownose/projects/carte-pro-908-security-review -r typecheck`                                                                                                                                                                                | PASS after local dependency symlinks were added for the isolated worktree. Scope included Carte workspace projects plus the external `@tender/sdk` typecheck.                                              |
| `pnpm -C /home/cownose/projects/carte-pro-908-security-review -r lint`                                                                                                                                                                                     | PASS. Recursive lint completed across the Carte workspace and external `@tender/sdk`.                                                                                                                      |
| `pnpm -C /home/cownose/projects/carte-pro-908-security-review --filter '!@tender/sdk' -r test`                                                                                                                                                             | PASS. Carte-scoped recursive tests passed: core, reservations, orders-backend, orders-admin, views, ai, harness, and probe package tests.                                                                  |
| `pnpm -C /home/cownose/projects/carte-pro-908-security-review -r test`                                                                                                                                                                                     | FAIL only in the external `../tender/packages/sdk` workspace when run under Carte's dependency context: Tender's integration test could not resolve `sqlite`. The same package passed from Tender's root.  |
| `pnpm -C /home/cownose/projects/tender --filter @tender/sdk test`                                                                                                                                                                                          | PASS. External Tender SDK baseline passed from its own workspace root: 3 files, 30 tests.                                                                                                                  |
| `pnpm -C /home/cownose/projects/carte-pro-908-security-review audit:sandbox-budget`                                                                                                                                                                        | PASS. No FAIL rows; reservations submit/cancel-token remain WARN below the 10-subrequest cap.                                                                                                              |
| `./scripts/check-grep-gates.sh`                                                                                                                                                                                                                            | PASS. All grep gates green; no obsolete plugin patterns in `packages/*/src`.                                                                                                                               |
| `cd /home/cownose/projects/carte-pro-908-security-review && npx --yes ecc-agentshield scan -p packages/ --min-severity high`                                                                                                                               | PASS. Grade A, 100/100; 0 findings, 0 critical, 0 high. Scanner reported `Files scanned: 0`, so this remains AgentShield config-file coverage rather than source-code SAST.                                |

## Deferred `@carte/ai` Note

`@carte/ai` is intentionally out of scope for PRO-908. Its PII-boundary review is
deferred to the `@carte/ai` track.
