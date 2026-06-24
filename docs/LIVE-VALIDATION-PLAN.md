# Carte — Live / E2E Validation Plan

Status: **draft** · Last updated: 2026-06-24

This plan covers the validation **not yet exercised live**: payment levels
(L1–L6) that need a real Tender deploy, a Cloudflare Workers **Paid** account, a
live URL, authenticated external tooling (Google Rich Results, Lighthouse), or a
real restaurant; plus non-payment levels (L7–L9) for reservations, email, and
GDPR — most of which are runnable against the **existing** harness today and only
need G1 to gate in CI. It is the bridge between "all mocked/fixture e2e is green"
(today) and "launch-ready with live evidence" (PRO-418 sign-off).

## Where we are today (mocked/fixture coverage)

What is **already green** and gates every PR:

- **Unit/integration (vitest):** `pnpm -r test` — order state machine,
  `applyTenderTransaction` idempotency, Stripe webhook dedupe, capacity atomic
  decrement, manifest validation. Runs in CI.
- **Storefront browser e2e (Playwright, fixture host pages):**
  `pnpm exec playwright test --project=views` — menu/hours/cart/checkout render,
  axe a11y (zero serious+critical on the fixture), schema.org JSON-LD emission,
  and — after **PRO-963** — the **checkout → `transactionId` threading → return
  route → `paid`** chain with `processing` retry. **Not run in CI** (see Gap G1).
- **AI chat e2e (Playwright):** `e2e/ai-chat-launch` — the 86 / price-update /
  block-date / move-reservation flows against mocked tool calls.
- **Packaging:** `pnpm verify:orders-backend-pack` (published tarball carries no
  SDK dep / no `vendor/` / no `src/`), CI `emdash-plugin validate|build|bundle`.
- **Sandbox budget (static):** `pnpm audit:sandbox-budget` — Cloudflare-runner
  cap breaches FAIL; workerd wall-clock concerns WARN.

What is **mocked** in all of the above, and therefore **not yet validated live**:

| Mocked seam                                                     | Mocked by                           | Validated live in               |
| --------------------------------------------------------------- | ----------------------------------- | ------------------------------- |
| Tender transaction lifecycle (`getTransaction`, charge, refund) | Playwright route stubs / SDK fakes  | **L1** (PRO-859)                |
| Stripe Checkout + webhook delivery                              | test charge stubs, synthetic events | **L1 / L2** (PRO-859 / PRO-901) |
| Cloudflare Dynamic Worker Loader isolation                      | local `workerd` runner              | **L3** (PRO-906)                |
| Real-traffic CPU/subrequest distributions                       | static cost table                   | **L5** (PRO-461)                |
| Google Rich Results, Lighthouse, deployed-page axe              | offline JSON-LD assertion           | **L4** (PRO-907)                |
| Real menu/hours/branding/owner workflow                         | fixture data                        | **L6** (PRO-459)                |
| Reservation booking lifecycle + capacity concurrency            | unit tests / fetch-free fixture     | **L7** (PRO-979)                |
| Transactional email delivery (`email:send`)                     | `ctx.email` mocked in unit tests    | **L8** (PRO-980)                |
| GDPR export/erase on real content                               | unit tests only                     | **L9** (PRO-981)                |

> **Direct answer to "are live e2e tests for all functionality complete?"** No.
> Only mocked/fixture e2e exists today. Levels L1–L9 below are the live work that
> remains, and most is intentionally HITL-deferred (see `LAUNCH_CHECKLIST.md`).

> **Scope note — `@carte/ai` is excluded.** The AI plugin (real-LLM chat, the
> PII-redaction boundary, trial/license enforcement) is **not** part of this
> plan: it is commercial, stays `private: true`, and is **not releasing yet**.
> Its mocked `e2e/ai-chat-launch` flows remain in CI, but no live AI validation
> level is defined here. Add one when `@carte/ai` is slated for release.

## Gaps in the harness that block live validation

- **G1 — CI does not run the browser e2e suite.** CI runs `pnpm -r test`
  (vitest) only; the Playwright `views` and `ai-chat-launch` suites are not
  wired into `.github/workflows/ci.yml`. Pre-existing fixture failures stayed
  silently red until PRO-963. **Action:** add a CI job that runs
  `pnpm test:e2e` (already defined: `node scripts/run-playwright.mjs`) with
  `playwright install --with-deps` before L1, so the live levels build on a
  CI-enforced mocked baseline.
- **G2 — No co-install harness for real Tender + Carte.** The `harness/` site
  loads Carte's own plugins but does not install Tender. L1 needs a harness
  profile that installs the published `tender-core` + `tender-stripe`
  (+ `@tenderpay/sdk`) alongside `@carte/orders-backend`.
- **G3 — No deploy automation to a Paid Cloudflare account.** L3/L4 need a
  reference site deploy (wrangler) on a Workers Paid plan; none exists yet.

## Validation levels

Each level lists: **gate** (Linear issue), **preconditions**, **procedure**,
**pass criteria**, **evidence artifact**. Levels are ordered by dependency.

---

### L1 — Real-Tender co-install reconciliation (PRO-859, **Urgent**, keystone)

The keystone. Everything paid-order depends on this; PRO-963 shipped the
storefront caller half, PR #32 shipped the backend return-route drive point, but
**neither has been exercised against a real Tender transaction.**

- **Gate:** PRO-859 (only its co-install e2e acceptance item remains open).
- **Preconditions:** PRO-766 (Tender published to npm) ✅ Done; G2 co-install
  harness; a Stripe **test-mode** account with a test card; Tender configured
  against that Stripe account.
- **Procedure (harness, automated where possible):**
  1. Co-install real `tender-core` + `tender-stripe` + `@tenderpay/sdk` with
     `@carte/orders-backend` in a harness profile (G2).
  2. Drive a checkout via the storefront flow → Stripe **test charge** (`4242…`).
  3. Land on the order-success page; confirm it POSTs `transactionId` to
     `/_emdash/api/plugins/carte-orders-backend/return` (the PRO-963 path) and
     that the order flips **`pending → paid`**.
  4. **Duplicate-delivery:** replay the same Tender event / re-hit the return
     route; assert the order advances **exactly once** (dedup via
     `tender:dedup:` + `applyTenderTransaction` no-op).
  5. **Refund:** issue a refund in Stripe/Tender; assert **`paid → refunded`**.
  6. **Latency (Candidate C):** record observed propagation time from charge to
     `paid` for the kitchen/orders queue UX note.
- **Pass criteria (PRO-859 acceptance):**
  - [ ] Zero `tender:payment` hits (grep gate — already enforced in CI).
  - [ ] Co-install e2e green: `paid` + `refunded` driven by the real eventing
        contract.
  - [ ] Transitions idempotent under redelivery/replay.
  - [ ] Candidate-C propagation latency documented.
- **Evidence:** new `e2e/tender-coinstall/*.spec.ts` (committed, runs in the
  G2 harness) + a short results note appended here.

---

### L2 — Co-install paid order on a Paid deploy (PRO-901)

Same flow as L1 but against a **deployed** Paid site following the published
operator docs verbatim — proves the _operator experience_, not just the harness.

- **Gate:** PRO-901 (R4). Depends on **L1** green and **L3** deploy standing up.
- **Preconditions:** fresh `npm create emdash` site; published `@carte/*`
  packages (PRO-893 first manual publish); Stripe account; Tender installed per
  the A4 shape.
- **Procedure:** operator follows `docs` install steps with **no insider
  knowledge**; completes a paid order end-to-end; runs the duplicate-webhook and
  refund checks from L1 against the live deploy; attempts a concurrency oversell.
- **Pass criteria:** operator completes a paid order from docs alone; oversell
  impossible under concurrency; duplicate fulfillment advances state exactly
  once; refunds reflected.
- **Evidence:** operator run log + screenshots attached to PRO-901.

---

### L3 — Cloudflare Paid sandbox isolation (PRO-906)

- **Gate:** PRO-906 (R4). Unblocks L2/L4 (provides the deploy).
- **Preconditions:** Workers **Paid** account with **Dynamic Worker Loader**
  (Free has none — sandboxed plugins silently run in-process; see CLAUDE.md).
- **Procedure:** deploy the reference restaurant site; prove the per-plugin
  capability boundary is enforced at runtime (a plugin cannot exceed its declared
  capabilities; cross-plugin isolation holds) — M0 validated this only locally on
  `workerd`.
- **Pass criteria:** sandbox isolation enforced on a real Paid deploy.
- **Evidence:** `docs/VERIFIED-DEPLOY-PAID-carte.md` (committed).

---

### L4 — Rich Results + a11y + Lighthouse on the live URL (PRO-907)

Re-runs the storefront quality gates against the **deployed** surface (fixture
axe/JSON-LD already pass offline; this proves the real rendered page).

- **Gate:** PRO-907 (R5). Depends on **L3** (live URL).
- **Preconditions:** deployed storefront URL with real-ish menu data.
- **Procedure:**
  1. **JSON-LD:** `pnpm verify:rich-results --url https://<domain>/_emdash/api/plugins/carte-core/schema-jsonld`,
     then confirm in <https://search.google.com/test/rich-results> (Restaurant +
     Menu).
  2. **axe:** run axe (extension or Playwright/axe) against the live pages —
     zero serious+critical.
  3. **Lighthouse:** Chrome DevTools or PageSpeed Insights — performance **≥ 80**.
- **Pass criteria:** Rich Results valid for Restaurant + Menu; axe zero
  serious+critical; Lighthouse ≥ 80 — all on the deployed surface.
- **Evidence:** screenshots / report exports attached to PRO-907 and referenced
  from `LAUNCH_CHECKLIST.md` HITL-deferred items.

---

### L5 — Sandbox quota audit on real traffic (PRO-461)

Static `audit:sandbox-budget` proves the _modeled_ cost; this proves the _observed_
cost under load.

- **Gate:** PRO-461 (launch). Depends on **L3** (a live deploy taking traffic).
- **Procedure:** after the site takes real traffic, capture Workers analytics for
  each sandboxed handler's CPU-time and subrequest-count distributions.
- **Pass criteria:** CPU/subrequest **p95 within quota** for every sandboxed
  handler (Cloudflare cap: 50ms CPU / 10 subrequests / 30s wall per invocation).
  The return route's audited worst case is 9/10 subrequests — watch it closely.
- **Evidence:** findings in `docs/architecture/sandbox-budget.md`.

---

### L6 — Real restaurant onboarding (PRO-459, HITL)

The business-acceptance capstone; folds in L1/L4/L5 against a real client.

- **Gate:** PRO-459 (launch). Depends on L1–L5.
- **Procedure:** import the client's real menu (CSV / WordPress / manual); set
  hours, branding, photos; configure Stripe **live** key with idempotent webhook;
  demo the AI chat panel with the owner; run the live Google Rich Results Test.
- **Pass criteria (PRD v0.1 metrics):**
  - [ ] Live restaurant client launches successfully.
  - [ ] Schema.org passes Rich Results for Restaurant + Menu on the live URL.
  - [ ] AI chat handles 86 / price update / block date / move reservation
        end-to-end against **real** data.
  - [ ] All sandboxed handlers within quota under real traffic (L5).
- **Evidence:** HITL sign-off recorded in PRO-418 + PRO-459.

---

### L7 — Reservations end-to-end live (PRO-979)

The reservations plugin has 9 routes but only unit coverage; no live booking
lifecycle exists. **Mostly runnable in the existing harness now** (it already
loads `carte-reservations`) — only the at-scale traffic dimension needs G3.

- **Gate:** PRO-979. Depends on **G1/PRO-976** (CI e2e); the concurrency-at-scale
  dimension benefits from **G3/PRO-978** (Paid deploy).
- **Procedure:**
  1. Drive submit → confirm (token) → cancel (token) against the harness.
  2. **Oversell:** fire N simultaneous submits at a slot with capacity k; assert
     exactly k granted, rest rejected — the KV atomic-decrement / unique `holdKey`
     is the whole point, and has never been hammered concurrently.
  3. A closure (`carte_reservation_blocks`) prevents a booking in its window.
  4. Rate-limit path triggers under repeated submits.
- **Pass criteria:** token round-trip works; closure blocks; **zero oversell**
  under concurrency with no leaked holds (cross-check PRO-888); rate-limit fires.
- **Evidence:** committed `e2e/reservations/*` + run note here.

---

### L8 — Transactional email delivery: Resend + SMTP (PRO-980)

`@carte/reservations` sends three emails (`received` / `confirmed` / `cancelled`)
via the EmDash host `ctx.email.send(...)`; none has ever been delivered through a
real provider. **Resend vs SMTP is host configuration**, not Carte code — this
level validates Carte's emails actually deliver under each, and that the dedup is
correct.

- **Gate:** PRO-980. Pairs with **L7** (the booking lifecycle triggers the sends).
- **Procedure:** configure the EmDash host for **Resend** (API key + verified
  sender), trigger each kind, confirm delivery; repeat with **SMTP** (e.g.
  Mailpit/Ethereal or a real relay). Verify idempotent confirm/cancel
  (`email:{reservationId}:{kind}` dedup — no double-send) and graceful skip when
  `ctx.email` is unconfigured.
- **Pass criteria:** all three kinds deliver via Resend **and** via SMTP;
  re-dispatch doesn't double-send; unconfigured host → graceful skip; accepted-
  submit path stays within the 10-subrequest budget.
- **Evidence:** provider setup doc (secret names, no committed creds) + run note.

---

### L9 — GDPR export/erase on real content (PRO-981)

`@carte/core` exposes `gdpr/export` + `gdpr/erase` (`core/src/gdpr.ts`) — a
regulatory surface with no live validation. **Runnable in the existing harness
now** (loads `carte-core`).

- **Gate:** PRO-981. Depends on **G1/PRO-976** (CI e2e).
- **Procedure:** seed real reservation + order content; **export** by email
  (assert no cross-email leakage); **erase** (assert PII → deterministic
  `erased:<sha256(email)>`, non-PII preserved, audit entry per item); simulate an
  audit-write failure and assert the erase is **blocked** (HR9 audit-first); re-run
  erase (safe no-op); verify pagination past `EXPORT_PAGE_SIZE`.
- **Pass criteria:** export scoped correctly; erase deterministic + audited;
  audit-first ordering holds; idempotent re-run; pagination/cap verified.
- **Evidence:** committed `e2e/gdpr/*` (or core route test) + run note.

## Dependency order

```
PRO-766 (Tender npm) ✅
        │
        ▼
L1 PRO-859  ──►  L2 PRO-901
   (harness)         ▲
        │            │
        ▼            │
   PRO-963 ✅        │
                     │
L3 PRO-906 ──────────┴──►  L4 PRO-907
   (Paid deploy)            L5 PRO-461
        │                       │
        └───────────┬───────────┘
                    ▼
              L6 PRO-459 (real client) ──► PRO-418 sign-off

Non-payment levels (run in the EXISTING harness; only G1 to gate in CI):

G1 PRO-976 ──► L7 PRO-979 (reservations) ──► L8 PRO-980 (email: Resend + SMTP)
                    │
                    └──► L9 PRO-981 (GDPR export/erase)

   (L7 oversell-at-scale + L8/L9 also feed the L6 real-client capstone)
```

## Immediate next actions

1. **Close G1:** wire `pnpm test:e2e` into CI (`playwright install --with-deps`
   - run `views` and `ai-chat-launch`). Cheap; stops silent fixture rot.
2. **Build G2:** a co-install harness profile (real Tender + Carte) — the
   critical path to L1/PRO-859, the Urgent keystone.
3. **PRO-893:** first manual npm publish of the `@carte/*` family (unblocks L2's
   "fresh site installs published packages" precondition).
4. **L7/L9 (PRO-979 / PRO-981) are runnable now** in the existing harness
   (reservations + GDPR don't need Tender, a Paid deploy, or a real client) —
   the highest-value non-payment validation available pre-launch. L8/PRO-980
   adds a Resend + SMTP provider setup.
5. Everything L3–L6 is HITL/external and stays deferred per `LAUNCH_CHECKLIST.md`
   until a Paid account and a real client are available. `@carte/ai` validation
   is out of scope until the plugin is slated for release.

## References

- `LAUNCH_CHECKLIST.md` — PRO-418 success metrics + HITL-deferred items.
- `docs/VERIFIED-PLATFORM-0.18-carte.md` — sandbox runtime budget (§6) and the
  no-post-response-primitive constraint (§7).
- `openspec/changes/archive/2026-06-23-wire-tender-fulfillment/design.md` —
  return-route drive point, bounded poll, `transactionId` round-trip (Decision 3).
- Linear: PRO-859 (L1), PRO-901 (L2), PRO-906 (L3), PRO-907 (L4), PRO-461 (L5),
  PRO-459 (L6), PRO-979 (L7 reservations), PRO-980 (L8 email), PRO-981 (L9 GDPR),
  PRO-963 (storefront caller, done), PRO-893 (first publish).
- Harness gaps: PRO-976 (G1 CI e2e), PRO-977 (G2 Tender co-install),
  PRO-978 (G3 Paid deploy).
