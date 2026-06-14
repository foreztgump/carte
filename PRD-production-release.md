# Carte — Production Release PRD (v0.3.0-rc → v1.0)

**Date:** 2026-06-14
**Status:** Draft for review
**Repo:** github.com/foreztgump/carte
**Current state:** v0.3.0-rc.1 (merged to `main`, HEAD `4936413`) — EmDash 0.18 modernization complete (epic PRO-848, M0–M5), CI-green, **but not published**. Developer preview only.
**Model:** mirrors [Dateline](https://github.com/foreztgump/dateline-events-plugin)'s `PRD-production-release.md` (npm-only distribution, OIDC trusted publishing, marketplace deferred).
**Depends on:** [Tender](https://github.com/foreztgump/tender) payments plugin family for paid order flows — but **Carte ships first** (see §0). `docs/VERIFIED-PLATFORM-0.18-carte.md` for platform facts.

---

## 0. Decisions locked for this release (2026-06-14)

These three owner decisions shape the whole plan and are treated as settled, not open questions:

1. **Make the repository public.** Required for npm provenance and source links. This is a committed prep step (WS-B1), not a deferred HITL gate.
2. **Defer `@carte/ai` — do not release it.** There is no commercial distribution/licensing solution yet, and publishing source to public npm would expose a paid product. `@carte/ai` stays `private: true`, is excluded from every publish set, and gets its own future release track once a commercial path exists. All AI-specific release work (licensing, MCP tool reference) is out of scope here.
3. **Publish Carte before Tender.** The MIT family ships now even though the Tender payments family is still being completed and is not yet on npm. `@carte/orders-backend` is MIT and feature-complete, so it publishes with the rest; **paid order flows are inert until Tender is installable** (PRO-766) and this is disclosed in the README/docs. Tender reaching npm later unblocks paid-order _validation_ (WS-C), not the Carte publish.

**Publishable set (this release): 5 packages** — `@carte/core`, `@carte/reservations`, `@carte/orders-backend`, `@carte/orders-admin`, `@carte/views`.
**Deferred: 1 package** — `@carte/ai`.

---

## 1. Background

The EmDash 0.18 modernization (`PRD-emdash-0.17-modernization.md`, epic PRO-848) shipped in full as v0.3.0-rc.1: three real sandboxed plugins (`core`, `reservations`, `orders-backend`), two native React admins (`orders-admin`, `ai`), one Astro component library (`views`), 304 test cases, a workerd harness, a per-runner sandbox-budget audit, and a family-wide changeset staged to `0.3.0-rc`. That work made the existing feature surface **true** — but deliberately stopped short of what "production release" requires:

1. **It is not actually released.** No `emdash-plugin` registry publish and no npm publish have run — the M5 changeset only _staged_ the bump. `npm view @carte/core` returns `E404`. No operator can install Carte today without cloning and building from source.
2. **Distribution channel undecided in code.** The repo is **private**, five of six packages are still `private: true`, three packages have no `build` script or `dist/`, and there is no release workflow. The publish path exists only as documentation.

This PRD defines the path from "honest developer preview" to "installable, audited 1.0," following the distribution decision Dateline already validated: **npm-only**.

### 1.1 What ships today (the v0.3.0-rc.1 baseline — do not rebuild)

| Package                 | Role                                                                                    | Format               | License    | This release        |
| ----------------------- | --------------------------------------------------------------------------------------- | -------------------- | ---------- | ------------------- |
| `@carte/core`           | menu/sections/restaurant collections, Block Kit admin, schema.org JSON-LD, GDPR helpers | ✅ sandboxed plugin  | MIT        | ✅ publish          |
| `@carte/reservations`   | read-time slots, race-safe D1 capacity, waitlist, confirmation email                    | ✅ sandboxed plugin  | MIT        | ✅ publish          |
| `@carte/orders-backend` | Tender Checkout, refunds, order state machine, idempotent fulfillment                   | ✅ sandboxed plugin  | MIT        | ✅ publish (inert¹) |
| `@carte/orders-admin`   | React admin: order list/detail, status transitions, refund                              | ✅ native plugin     | MIT        | ✅ publish          |
| `@carte/views`          | Astro storefront components (menu, hours, reservation, cart, checkout)                  | ✅ component library | MIT        | ✅ publish          |
| `@carte/ai`             | React admin: BYO-LLM chat, MCP tool catalog, write-on-confirm                           | ✅ native plugin     | Commercial | ⛔ **deferred**     |

¹ `@carte/orders-backend` installs and loads, but paid order flows do nothing useful until the Tender family (`tender-core` + `tender-stripe` + `@tender/sdk`) is installable from npm (PRO-766). Disclosed at install.

Collections that exist: `carte_menu_items`, `carte_menu_sections`, `carte_menus`, `carte_restaurant`, `carte_reservations`, `carte_reservation_blocks`, `carte_orders`. Payment reconciliation is an idempotent in-request `applyTenderTransaction(ctx, event)` seam.

### 1.2 Honest gap list (the subject of this PRD)

- **G-REL** No npm publish; the M5 changeset is staged but unpublished (`npm view @carte/core` → `E404`). No real Cloudflare **Paid** deploy validation — only the local workerd harness (`docs/VERIFIED-PLATFORM-0.18-carte.md` §6); sandbox isolation never exercised on a real Dynamic Worker Loader.
- **G-PKG** Package metadata is not publish-ready: repo private, 5/6 packages `private: true`, `orders-admin`/`views`/`ai` have no `build` script (their `main` points at `src/*.ts`, not `dist/`), no `license` field on the native/library packages, and no `.nvmrc`.
- **G-PAY-EXT** `@carte/orders-backend` ships in this release but its paid flows stay inert until the **Tender** family is on npm (**PRO-766**, external, in progress). It currently consumes a **vendored tarball** (`file:../../vendor/tender-sdk-0.0.0.tgz`) at build time. MIGRATION.md documents `@tender/sdk` as a _peer dependency_ (OQ-2 / PRO-735) but `package.json` declares it a `devDependency` — a shape mismatch that **must** be reconciled because orders-backend publishes before `@tender/sdk@^0.1.0` exists on npm (an unmet/optional peer or a self-contained bundle, not a hard peer on a nonexistent version).
- **G-AUDIT** No production security audit, no production performance benchmarks (concurrency oversell at scale, query budgets, edge cache hit rate) against a real deployment.
- **G-DOCS** `@carte/docs` site exists but is not published to a public URL; recipe library not validated against a live reference site.

### 1.3 Out of scope here: `@carte/ai`

`@carte/ai` (commercial, $99/yr, 14-day trial per AGENTS.md) is **deferred to a separate future release** (Decision §0.2). No solution exists yet for distributing a commercial package: public npm exposes source, and a private-registry / source-available / artifacts-only path has not been chosen. Until then `@carte/ai` stays `private: true`, is never added to a publish set, and its MCP tool reference (former WS-E3) is deferred with it. This PRD does **not** decide the commercial model — it only ensures the AI package is cleanly excluded so the MIT family can ship.

---

## 2. Goals & Non-Goals

### Goals

- **G1 — Ship a real release (npm-only).** The **5 MIT** `@carte/*` packages installable from **npm**. Host sites consume the three sandboxed plugins as default imports into `sandboxed: []` (+ `sandboxRunner`); `@carte/orders-admin` registers in `plugins: []`; `@carte/views` installs as an Astro component dependency. A verified Cloudflare **Paid** deployment of a reference site proves sandbox isolation end-to-end. **The experimental EmDash marketplace/atproto-registry publish path is explicitly out of scope** — npm needs no publisher DID.
- **G2 — Publish-ready packaging.** Every shipped package builds to `dist/`, declares correct `exports`/`files`/`publishConfig`/`license`, and drops `private: true`. The repo is public; reproducible Node via `.nvmrc`.
- **G3 — Carte ships independent of Tender.** The MIT family — including `@carte/orders-backend` — publishes without waiting on Tender. Paid order flows are documented as inert until Tender is on npm (PRO-766); installing orders-backend must not error on a missing `@tender/sdk`.
- **G4 — MIT licensing clean.** The five published packages carry `license` fields + `LICENSE` files (MIT). `@carte/ai`'s commercial model is explicitly **not** decided here.
- **G5 — Production confidence.** A documented security review and a release-gating performance benchmark suite, both run against a real Paid deployment.
- **G6 — Operator-grade docs.** `@carte/docs` live on a public URL: quickstart, the 0.18 `astro.config.mjs` install model, capability reference, recipes, and the Tender payment-integration guide (with the "inert until Tender ships" disclosure).

### Non-Goals (this PRD)

- **Releasing `@carte/ai`.** Deferred until a commercial distribution/licensing solution exists (Decision §0.2). Tracked as separate future work.
- **Marketplace / atproto-registry publish.** EmDash's marketplace is built on an **experimental** atproto registry (`@emdash-cms/plugin-cli` README marks `registry.emdashcms.com` experimental; "NSIDs and shapes will change while RFC 0001 is in flight"). **Decision (mirrors Dateline): distribute via npm only.** The placeholder `did:plc:` in the manifests is irrelevant to npm and can stay. Marketplace publish is purely additive (same `emdash-plugin build` output) and revisited post-1.0.
- **Building a payment gateway.** Tender owns providers, webhook signature verification, refunds, and the customer vault. Carte never touches the Stripe SDK directly (PCI scope stays minimized — Stripe Checkout via Tender handles all card data).
- **New feature surface.** No new collections, plugins, or admin features beyond what v0.3.0-rc.1 already ships. Roadmap items (multi-location / Stripe Connect, nested modifiers, `@carte/ops` order-tracking) remain deferred (§7).
- **Changing the reservation capacity model or the Tender eventing seam.**

---

## 3. Workstreams

> Each workstream is independently shippable. **WS-A (packaging), WS-B (release), and WS-E (docs) have no dependency on Tender** and ship first. WS-C (paid-order validation) depends on Tender reaching npm (PRO-766) but does **not** block the Carte publish.

### WS-A — Publish-ready packaging _(gaps G-PKG, G-PAY-EXT)_

No publisher DID is required for npm. The same `emdash-plugin build` output (`dist/index.mjs` descriptor + `dist/plugin.mjs` runtime) ships through npm for the sandboxed plugins. **`@carte/ai` is excluded from all steps below** — it stays private and unbuilt-for-release.

- **A1. Build scripts for native + library.** Add a `build` script producing `dist/` for `@carte/orders-admin` (React → compiled JS + types) and `@carte/views` (Astro components packaged for consumption). Point `main`/`exports` at `dist/`, set `files`, and confirm each `exports` subpath resolves from the built output. (`@carte/ai` keeps its current src-based harness setup; not built for release.)
- **A2. Flip publish flags.** Remove `private: true` from the **five** publishable packages; add `publishConfig.access: public`. Keep `@carte/ai` `private: true`. Align the five versions onto the release line (bring `@carte/views` from `0.1.0` up; decide rc-vs-stable for the first cut in B-planning — default: drop `-rc` for `v0.3.0`).
- **A3. License files.** Add `license: "MIT"` fields + top-level `LICENSE` files to the five published packages.
- **A4. Reconcile `@tender/sdk` for publish-before-Tender.** This is the load-bearing packaging task given §0.3. Resolve so that installing `@carte/orders-backend` from npm **does not error** while `@tender/sdk@^0.1.0` is absent from the registry. Choose one and document it:
  - **(a) Self-contained bundle** — `@tender/sdk` stays a build-time-only input bundled into `dist/plugin.mjs` (the current sandbox-build behavior); orders-backend ships with no runtime `@tender/sdk` dependency at all. Operators still install `tender-core`/`tender-stripe` later for payments to function. Ensure the **vendored `0.0.0` tarball is not what end-users receive** — rebuild against real `@tender/sdk@0.1.0` once published, or vendor the real built SDK.
  - **(b) Optional peer** — declare `@tender/sdk` as an _optional_ `peerDependency` so npm warns but does not fail on absence.
  - The current `devDependency` + `file:` tarball shape must not leak into the published tarball regardless of choice.
- **A5. Reproducibility.** Add `.nvmrc` (Node 22) to match the `engines` pin and the release workflow's `node-version-file`.

**Acceptance:** `pnpm -r build` produces `dist/` for the five published packages; `pnpm -r publish --dry-run --no-git-checks` packs exactly those five (not `@carte/ai`) with correct contents (built `dist/` + `emdash-plugin.jsonc` for sandboxed; compiled components for `views`); a clean install of the packed `@carte/orders-backend` tarball does not error on a missing `@tender/sdk`; no package embeds the vendored `0.0.0` tarball.

### WS-B — Release automation + repo public _(gap G-REL, Decision §0.1)_

Mirror Dateline's `release.yml` exactly — tokenless OIDC trusted publishing with provenance.

- **B1. Make the repo public.** Committed (Decision §0.1). Provenance + source links require it. Do this before the first publish; audit for anything that must not go public first (secrets, internal URLs) — none expected, but verify.
- **B2. `release.yml` workflow.** Add `.github/workflows/release.yml` modeled on Dateline: `push` of a `v*` tag → `changeset publish`; `workflow_dispatch` with `dry_run` → `pnpm -r publish --dry-run`. `permissions: id-token: write`, `registry-url: https://registry.npmjs.org`, upgrade npm to `^11.5.1` (OIDC needs ≥ 11.5.1; Node 22 bundles 10.x), **never set `NODE_AUTH_TOKEN`**.
- **B3. First-publish exception (one-time, manual).** The first `0.3.0` publish cannot use trusted publishing (no package exists yet to map). Per Dateline's runbook: repo public, `pnpm -r build` + `pnpm -r publish --access public` locally for the **five** packages (no provenance), then configure [trusted publishing](https://docs.npmjs.com/trusted-publishers) per package on npmjs.com (repo `foreztgump/carte`, workflow `release.yml`). Every release `0.3.1+` uses the tagged CI flow with automatic provenance.
- **B4. CONTRIBUTING release runbook.** Add a "Releasing" section to `CONTRIBUTING.md` (changeset → version-packages → tag → CI publish), the first-publish exception, the provenance preconditions, the explicit `@carte/ai`-is-not-published note, and the rollback path (`npm deprecate`; never unpublish after 72h; ship-forward patch).

**Acceptance:** the repo is public; a `workflow_dispatch` dry-run of `release.yml` reports exactly the five packages and versions that would publish; the runbook is followable verbatim.

### WS-C — Paid-order validation _(gaps G-PAY-EXT, G-AUDIT partial)_

Does **not** gate the Carte publish (orders-backend already shipped in R2). This is end-to-end _validation_ of paid orders once Tender is installable. Carte is a **consumer** of Tender; it imports no gateway SDK.

- **C0. Tender on npm (PRO-766, external, in progress).** Tender team publishes `@tender/sdk@^0.1.0` + `tender-core` + `tender-stripe`. Until then, paid-order validation can only run against the workspace link / vendored SDK.
- **C1. Co-install validation.** On a fresh `npm create emdash` site, install the published `@carte/orders-backend` + `tender-core` + `tender-stripe` (+ `@tender/sdk` per the A4 shape) and complete a paid order end-to-end against a Paid deployment: Checkout → `applyTenderTransaction` → order `paid`; verify exactly-once under duplicate webhook delivery and refund reflection.
- **C2. Cloudflare Paid deploy validation.** Stand up a reference restaurant site on a **Workers Paid** account with Dynamic Worker Loader; prove the per-plugin capability boundary is enforced (the M0 work validated this only locally). Capture evidence in `docs/VERIFIED-DEPLOY-PAID-carte.md`.
- **C3. Flip the "inert" disclosure.** Once C1 passes, update README/docs to mark paid orders supported and remove the "inert until Tender ships" caveat.

**Acceptance:** an operator follows the docs install verbatim and completes a paid order on the reference site; oversell impossible under concurrency; duplicate fulfillment events advance state exactly once.

### WS-D — Security audit & performance benchmarks _(gap G-AUDIT)_

- **D1. Security review.** Full pass over the **five published** packages: capability minimality across the manifests, sandbox-boundary assumptions, GDPR export/erase correctness, the **Tender trust boundary** (Carte must never receive raw PAN/CVC — PCI scope minimized), and the Cloudflare WAF carve-out for Tender webhook delivery. Use `npx ecc-agentshield scan` + the repo's security-review tooling; record findings + resolutions. (AI PII-boundary review moves to the deferred `@carte/ai` track.)
- **D2. Performance suite.** Benchmark against the Paid deployment: storefront menu/schema render budget, reservation oversell under N-concurrent load, and all sandboxed handlers within the Cloudflare 50ms CPU / 10-subrequest ceiling (extends `scripts/audit-sandbox-budget.ts`). Wire as a release-gating CI job.
- **D3. Rich Results + a11y + Lighthouse on the deployed surface.** Execute the HITL-deferred items from `LAUNCH_CHECKLIST.md` against a live URL: Google Rich Results (Restaurant + Menu JSON-LD), axe zero serious+critical, Lighthouse ≥ 80.

**Acceptance:** a published security report with no open criticals; perf suite green and gating on the release branch; Rich Results / a11y / Lighthouse evidence captured.

### WS-E — Public documentation site _(gap G-DOCS)_

- **E1. Publish `@carte/docs`.** Build + deploy to a public URL; quickstart, the 0.18 `astro.config.mjs` install model (sandboxed `sandboxed: []` + `sandboxRunner`; native `plugins: []`), capability & security reference, Cloudflare-Free-no-isolation disclosure, capability-name-patch note. **Omit `@carte/ai` from install docs** (deferred); ensure no copy implies AI is installable yet.
- **E2. Tender payment-integration guide.** How to install the three-plugin payment model (`@carte/orders-backend` + `tender-core` + `tender-stripe`), wire the Stripe provider, and update the webhook URL — with the "paid flows inert until Tender is on npm" disclosure until WS-C3 flips it (gated on WS-C).
- **E3. Validate snippets.** All docs install snippets CI-validated against the reference site.

> _(Former E3 "MCP tool reference" is deferred with `@carte/ai`.)_

**Acceptance:** the docs site is the canonical install path; README points to it; snippets are CI-validated.

---

## 4. Milestones

| Milestone                                | Scope                                                                                                                                                                     | Gating                         |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| **R1 — Packaging (no publish)**          | WS-A (build scripts for orders-admin + views, publish flags on the 5, MIT LICENSE files, `@tender/sdk` reconcile, `.nvmrc`) + WS-B2/B4 (workflow + runbook, dry-run only) | none — can start now           |
| **R2 — Ship the MIT family (v0.3.0)**    | WS-B1 (repo public) + WS-B3 (first-publish) for the **5 MIT** packages, including `orders-backend` (inert paid flows, disclosed)                                          | after R1                       |
| **R3 — Docs live**                       | WS-E1 (publish docs site) + quickstart validated                                                                                                                          | after R2                       |
| **R4 — Paid orders validated (v0.3.x)**  | WS-C (co-install + Paid deploy validation; flip the inert disclosure)                                                                                                     | **gated on PRO-766 / Tender**  |
| **R5 — Hardening (v0.9.0-rc)**           | WS-D security audit + perf gates + Rich Results/a11y/Lighthouse; WS-E2 finalized                                                                                          | after R4                       |
| **R6 — v1.0**                            | All §6 criteria met; first live restaurant client (PRO-418)                                                                                                               | after R5                       |
| **(separate track) `@carte/ai` release** | Commercial distribution/licensing solution → build + publish path for AI                                                                                                  | when a commercial model exists |

> **Sequencing rationale:** packaging + MIT publish + docs (R1–R3) deliver operator value **without** waiting on Tender or on solving AI commercialization. Paid-order _validation_ (R4) is isolated behind the PRO-766 gate but no longer blocks shipping — `orders-backend` is already published, just inert. The `@carte/ai` release is fully decoupled onto its own track. The existing `LAUNCH_CHECKLIST.md` (PRO-418) is the R6 go-live gate.

---

## 5. Risks & Open Questions

- **R1 — `@tender/sdk` shape (load-bearing, WS-A4).** `orders-backend` publishes before `@tender/sdk@^0.1.0` exists on npm, so a naive hard `peerDependency` would make installs warn/fail. Must ship self-contained or optional-peer so a clean install never errors, and the vendored `0.0.0` tarball must not reach end users. **Mitigation:** A4 is the gating packaging task; acceptance includes a clean-install test of the packed tarball.
- **R2 — PRO-766 (external).** Tender not yet on npm. **Mitigation:** decoupled — only paid-order _validation_ (R4) waits; the publish (R1–R3) does not. Paid flows ship inert and disclosed.
- **R3 — Repo going public surfaces something sensitive.** Low likelihood, high consequence. **Mitigation:** B1 includes a pre-public audit (secrets, internal URLs, license-host references) before flipping visibility.
- **R4 — Cloudflare Free has no Dynamic Worker Loader.** Sandbox isolation only exists on Paid; on Free the sandboxed plugins run in-process (unsandboxed). Already disclosed in READMEs/MIGRATION; WS-C2 validates Paid explicitly.
- **R5 — `@carte/ai` commercial model (deferred, not solved).** Out of scope here by Decision §0.2; flagged so it is not forgotten. The AI release track cannot start until this is answered (public source-available license vs. private registry vs. artifacts-only).
- **Q1 — Publisher DID:** moot for npm-only (no atproto DID needed). Placeholder `did:plc:` stays in manifests; revisit only if the marketplace path is pursued post-1.0.
- **Q2 — `@carte/views` versioning:** join the family release line at `0.3.0` or keep an independent `0.x`? Decide in A2 (default: join at `0.3.0`).
- **Q3 — rc vs stable for the first cut:** publish the staged `0.3.0-rc` or drop `-rc` for a stable `0.3.0`? Default: stable `0.3.0` (mirrors Dateline), since the feature surface is verified.

---

## 6. Definition of Done (v1.0)

- The **5 MIT** `@carte/*` packages installable from **npm**; README/docs install works verbatim on a fresh EmDash site (sandboxed → `sandboxed: []` + `sandboxRunner`; native → `plugins: []`; `views` as an Astro dep). Repo is public.
- Release pipeline live: `release.yml` publishes `0.3.1+` via OIDC trusted publishing with provenance; runbook in `CONTRIBUTING.md`; `@carte/ai` documented as not-published.
- Five published packages carry MIT `LICENSE` files; `@carte/ai` cleanly excluded.
- Paid orders work end-to-end through Tender (post-PRO-766): Checkout → exactly-once order state; oversell impossible under concurrency; refunds reflected; the "inert" disclosure removed.
- Reference site deployed and verified on Cloudflare **Paid** with enforced sandbox isolation (`docs/VERIFIED-DEPLOY-PAID-carte.md`).
- Published security review with no open criticals; perf suite gating releases; Rich Results + a11y + Lighthouse evidence on the deployed surface.
- `@carte/docs` live with quickstart, recipes, capability reference, Tender payment guide.
- PRO-418 launch checklist satisfied: first live restaurant client signed off.

> `@carte/ai` is **not** part of v1.0 done. Its release is a separate track gated on a commercial solution (§4, R5).

---

## 7. Explicitly Deferred (post-1.0 / separate work)

Tracked in `LAUNCH_CHECKLIST.md` HITL-deferred items and the PRD open questions:

- **`@carte/ai` release** — commercial distribution/licensing unsolved; own track (Decision §0.2).
- **Multi-location / Stripe Connect** (PRD OQ#8) — v0.1 is single-location.
- **Nested/advanced modifier engine** (PRD OQ#11) — v0.1 keeps single-tier modifiers.
- **Order-tracking notifications / cancellation-policy enforcement** (PRO-423, OQ#3/#12) — future `@carte/ops`.
- **Capacity tech debt:** PRO-889 (override parity for non-slot-aligned blocks), PRO-888 (abandoned-hold reclamation).
- **EmDash marketplace listing** — additive; revisit when atproto RFC 0001 stabilizes.
- **Upstream `sandbox-workerd` capability-name divergence** — pnpm patch carried; operator to file upstream.
