# Proposal: EmDash 0.18 modernization — Carte v0.2 → v0.3

**Mission:** `mission-20260612-emdash-018-carte`
**Linear epic:** PRO-848 (sub-issues PRO-852, PRO-855, PRO-856, PRO-860, PRO-862, PRO-865; cleanup PRO-764, PRO-770, PRO-769, PRO-496)
**Source PRD:** `PRD-emdash-0.17-modernization.md` (repo root, retargeted to `^0.18`)
**Brief:** `.factory-state/mission-brief-mission-20260612-emdash-018-carte.md`

## Why

Carte is pinned to `emdash ^0.9.0`, eight minors behind and pre-dating the v0.13 plugin-CLI migration. All five plugins use `definePlugin()`, which is native-format-only on 0.17+ — so the three "sandboxed" plugins actually run in-process with no isolation, no capability enforcement, and no marketplace path. No `emdash-plugin.jsonc` exists; the trust contract is invisible. Invented platform surface (`ctx.kv.atomicDecrement`, hard budget caps without runner context) is treated as contract. Downstream, Vicky's Kitchen M5 is blocked on this work.

## What changes

1. **Platform self-verification (new M0):** Tender's `VERIFIED-PLATFORM` doc does not exist; Carte stands up its own EmDash 0.18 harness and records empirical platform facts in `docs/VERIFIED-PLATFORM-0.18-carte.md` before conversion work relies on them.
2. **WS1 (PRO-852):** dep bump `^0.9.0 → ^0.18` + `@emdash-cms/plugin-cli` (exact 0.5.1), cast elimination, terminology purge, CI canary; `@carte/core` converted to sandboxed format first.
3. **WS2 (PRO-855):** `reservations` + `orders-backend` converted to sandboxed format — manifests as single trust contract, plugin-cli build/validate/bundle in CI, publisher DID decided once (HITL).
4. **WS5 (PRO-860):** reservation capacity race-safe via D1 single-writer + conflict-as-full; `atomicDecrement` claims removed.
5. **WS3 (PRO-856):** `orders-admin` + `ai` become true native-format plugins on real 0.18 types with the documented react-admin mount.
6. **WS6 (PRO-862) + WS7 (PRO-865):** budget tooling realigned to measured per-runner limits; MIGRATION.md v0.2→v0.3, docs-site, changesets to v0.3.0-rc.
7. **Bug cleanup:** PRO-764 (React 19 dup resolution), PRO-770 (pr-agent pins doc sync), PRO-769 (IPv6 SSRF coverage), PRO-496 (core collection schema surface).

## Out of scope

- **WS4 / PRO-859** Tender reconciliation — hard-gated on Tender's unshipped WS5 consumer eventing contract. This mission only deletes the dead `tender:*` placeholder hooks during WS2 and leaves a clean idempotent trigger interface.
- PRO-766/PRO-737 (npm publish — external Tender prereq), PRO-459/PRO-461 (live-client launch tasks).
- v0.3 feature roadmap; `@carte/views` rewrite; Tender payment-model changes.

## Impact

- All 5 plugin packages restructured (3 sandboxed-format, 2 native-format); `@carte/views` untouched.
- CI: plugin-cli validate/bundle jobs + emdash@latest canary.
- Docs: MIGRATION.md, docs-site install flows, per-plugin READMEs, AGENTS.md baseline facts.
- Release: family-wide minor bump to v0.3.0-rc (publish itself stays HITL-blocked on PRO-766).
