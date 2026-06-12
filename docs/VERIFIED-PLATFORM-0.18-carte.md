# Verified Platform Facts for EmDash 0.18 and Carte

Date: 2026-06-12

Harness: `harness/` on port `4321`, `emdash@0.18.0`, `@emdash-cms/plugin-cli@0.5.1`, `@emdash-cms/sandbox-workerd@0.1.6`.

This document records the empirical platform facts that gate the Carte v0.3 migration work. Each claim below includes command output, response capture, source references, or a harness test reference. The probe plugin is `harness/plugins/probe`.

## 1. Manifest schema acceptance, storage indexes, uniqueIndexes, and duplicate writes

**Claim.** `emdash-plugin.jsonc` accepts `storage.<collection>.indexes` and `storage.<collection>.uniqueIndexes`. The harness probe declares `probe_claims.uniqueIndexes = ["slotKey"]`, validates, builds, and loads. In the running harness, a duplicate write with the same `slotKey` was accepted, not rejected. SQLite `_plugin_indexes` had zero rows for the statically configured probe, so M2 capacity design must not assume this static harness path enforces plugin storage `uniqueIndexes`.

Evidence:

```console
$ pnpm --dir harness/plugins/probe exec emdash-plugin validate
✔ Manifest is valid: /home/cownose/projects/carte/harness/plugins/probe/emdash-plugin.jsonc
```

```console
$ pnpm --dir harness/plugins/probe build && ls harness/plugins/probe/dist/index.mjs harness/plugins/probe/dist/plugin.mjs harness/plugins/probe/dist/manifest.json
Hooks: content:beforeSave, content:afterSave
Routes: ping, private, admin, hookEvents, uniqueConflict, postResponsePrimitive, runtimeLimitProbe
✔ Plugin built: carte-harness-probe@0.1.0
harness/plugins/probe/dist/index.mjs
harness/plugins/probe/dist/plugin.mjs
harness/plugins/probe/dist/manifest.json
```

```json
{
  "storage": {
    "probe_claims": {
      "indexes": ["kind", "slotKey"],
      "uniqueIndexes": ["slotKey"]
    }
  }
}
```

```console
$ curl -s -H "Authorization: Bearer <dev-token>" \
  http://localhost:4321/_emdash/api/plugins/carte-harness-probe/uniqueConflict | jq .
{
  "data": {
    "duplicateWrite": "accepted",
    "slotKey": "slot-1781283593368-84bdf6be-91ac-4e27-9f34-bee568852dc1"
  }
}

$ sqlite3 harness/data.db \
  "select count(*) as probe_index_rows from _plugin_indexes where plugin_id='carte-harness-probe';"
0
```

Harness tests:

```console
$ pnpm --dir harness test
✓ test/probe-plugin.test.ts (8 tests)
```

## 2. Hook names and signatures

**Claim.** Sandboxed probe hooks named `content:beforeSave` and `content:afterSave` build and load. Both receive event objects with `content`, `collection`, and `isNew`. `beforeSave` runs in-request. `afterSave` fires after the draft content create succeeds.

Evidence:

```console
$ pnpm --dir harness/plugins/probe build
Hooks: content:beforeSave, content:afterSave
```

```console
$ curl -s -H "Authorization: Bearer <dev-token>" \
  -H "Content-Type: application/json" \
  -X POST http://localhost:4321/_emdash/api/content/posts \
  --data '{"data":{"title":"Hook Probe Final","content":[]},"slug":"hook-probe-final-1781283592","status":"draft"}' \
  | jq '{id:.data.item.id, slug:.data.item.slug, status:.data.item.status}'
{
  "id": "01KTYCD77YBW3XX8EHW61DR63P",
  "slug": "hook-probe-final-1781283592",
  "status": "draft"
}

$ curl -s -H "Authorization: Bearer <dev-token>" \
  http://localhost:4321/_emdash/api/plugins/carte-harness-probe/hookEvents | jq '.data.events[-4:]'
[
  {
    "id": "content:beforeSave-1781283593456-a11852b5-0cd1-4f87-8b3c-c29ccb0a77cc",
    "data": {
      "hook": "content:beforeSave",
      "contentKeys": ["content", "title"],
      "collection": "posts",
      "hookEventFields": ["collection", "content", "isNew"],
      "isNew": true
    }
  },
  {
    "id": "content:afterSave-1781283593480-6529c0b2-1ae5-4f8d-9447-a97c443fddc3",
    "data": {
      "hook": "content:afterSave",
      "contentKeys": [
        "authorId",
        "byline",
        "bylines",
        "createdAt",
        "data",
        "draftRevisionId",
        "id",
        "liveRevisionId",
        "locale",
        "primaryBylineId",
        "publishedAt",
        "scheduledAt",
        "slug",
        "status",
        "translationGroup",
        "type",
        "updatedAt",
        "version"
      ],
      "collection": "posts",
      "hookEventFields": ["collection", "content", "isNew"],
      "isNew": true
    }
  }
]
```

Source reference:

```text
node_modules/emdash/src/plugins/types.ts:
ContentHookEvent = { content: Record<string, unknown>; collection: string; isNew: boolean }
ContentBeforeSaveHandler(event: ContentHookEvent, ctx: PluginContext)
ContentAfterSaveHandler(event: ContentHookEvent, ctx: PluginContext)
```

## 3. Plugin route mount and auth behavior

**Claim.** Probe routes mount at `/_emdash/api/plugins/<slug>/<route>`. In this harness, global EmDash auth middleware returns 401 before plugin route dispatch unless a dev token is supplied, even for a route declared `public: true`. With a dev token, both public and private probe routes return 200.

Evidence:

```console
$ curl -s -i http://localhost:4321/_emdash/api/plugins/carte-harness-probe/ping | sed -n '1p;/^{/p'
HTTP/1.1 401 Unauthorized
{"error":{"code":"UNAUTHORIZED","message":"Authentication required"}}

$ curl -s -i -H "Authorization: Bearer <dev-token>" \
  http://localhost:4321/_emdash/api/plugins/carte-harness-probe/ping | sed -n '1p;/^{/p'
HTTP/1.1 200 OK
{"data":{"ok":true,"plugin":"carte-harness-probe"}}

$ curl -s -i http://localhost:4321/_emdash/api/plugins/carte-harness-probe/private | sed -n '1p;/^{/p'
HTTP/1.1 401 Unauthorized
{"error":{"code":"UNAUTHORIZED","message":"Authentication required"}}

$ curl -s -i -H "Authorization: Bearer <dev-token>" \
  http://localhost:4321/_emdash/api/plugins/carte-harness-probe/private | sed -n '1p;/^{/p'
HTTP/1.1 200 OK
{"data":{"ok":true,"auth":"required","plugin":"carte-harness-probe"}}
```

Source reference:

```text
node_modules/emdash/src/astro/routes/api/plugins/[pluginId]/[...path].ts:
Routes are mounted at /_emdash/api/plugins/{pluginId}/*
Routes marked as public skip auth only inside the plugin route handler.
```

## 4. Block Kit admin schema acceptance

**Claim.** Manifest admin pages require `label`, not `text`. Block Kit `stats` blocks require `items`, and stat items require `label`. `stats: [...]` with `text` fails validation.

Evidence:

```console
$ npx emdash-plugin validate /tmp/carte-probe-invalid-admin.jsonc --json
{"ok":false,"error":{"code":"MANIFEST_VALIDATION_ERROR","message":"Manifest validation failed:\n/tmp/carte-probe-invalid-admin.jsonc:27:15: admin.pages[0].label: Invalid input: expected string, received undefined\n/tmp/carte-probe-invalid-admin.jsonc:27:35: admin.pages[0]: Unrecognized key: \"text\""}}
```

```console
$ node --input-type=module
> validateBlocks([{ type: 'stats', items: [{ label: 'Schema', value: 'accepted' }] }])
{ valid: true, errors: [] }
> validateBlocks([{ type: 'stats', stats: [{ text: 'Schema', value: 'bad' }] }])
{
  valid: false,
  errors: [
    {
      path: 'blocks[0].items',
      message: "Required field 'items' must be an array"
    }
  ]
}
```

```console
$ curl -s -H "Authorization: Bearer <dev-token>" \
  http://localhost:4321/_emdash/api/plugins/carte-harness-probe/admin | jq .
{
  "data": {
    "blocks": [
      { "type": "header", "text": "Probe" },
      {
        "type": "stats",
        "items": [{ "label": "Schema", "value": "accepted" }]
      }
    ]
  }
}
```

## 5. Native admin mount shape

**Claim.** The 0.18 harness `plugins: []` path accepts a native plugin descriptor with an `entrypoint` module. That module must export `createPlugin()`, and the factory can return `definePlugin({ admin: { settingsSchema } })`. Directly returning a `definePlugin()` result in `plugins: []` is not the harness config shape, because the integration generates a virtual import of `createPlugin` from the descriptor `entrypoint`.

Evidence:

```js
// harness/astro.config.mjs
plugins: [nativeProbePlugin()];

function nativeProbePlugin() {
  return {
    id: "carte-native-probe",
    version: "0.1.0",
    entrypoint: "./src/native-probe.ts",
  };
}
```

```ts
// harness/src/native-probe.ts
import { definePlugin } from "emdash";

export function createPlugin() {
  return definePlugin({
    id: "carte-native-probe",
    version: "0.1.0",
    capabilities: [],
    admin: {
      settingsSchema: {
        probeEnabled: {
          type: "boolean",
          label: "Probe enabled",
        },
      },
    },
  });
}
```

```console
$ node --input-type=module
> import { createPlugin } from './harness/src/native-probe.ts'
> const plugin = createPlugin()
> JSON.stringify({ id: plugin.id, hasSettingsSchema: Boolean(plugin.admin.settingsSchema), settingsKeys: Object.keys(plugin.admin.settingsSchema ?? {}) }, null, 2)
{
  "id": "carte-native-probe",
  "hasSettingsSchema": true,
  "settingsKeys": ["probeEnabled"]
}
```

```console
$ curl -s -H "Authorization: Bearer <dev-token>" \
  http://localhost:4321/_emdash/api/manifest | jq '.data.plugins["carte-native-probe"]'
{
  "version": "0.1.0",
  "enabled": true,
  "adminMode": "none",
  "adminPages": [],
  "dashboardWidgets": []
}
```

Source reference:

```text
node_modules/emdash/src/astro/integration/virtual-modules.ts:
Native format imports `createPlugin` from `descriptor.entrypoint`.
node_modules/emdash/src/plugins/types.ts:
PluginAdminConfig has settingsSchema?: Record<string, SettingField>.
```

## 6. Runtime limits per runner

**Claim.** The local workerd runner accepted a route doing a 75 ms CPU loop and 12 bridge reads. This confirms no local 50 ms CPU or 10-subrequest enforcement in the workerd runner path. The only enforced local limit is wall time. Cloudflare runner facts are doc-sourced for this M0 because the harness has no `wrangler.*` Cloudflare config.

Evidence:

```console
$ curl -s -H "Authorization: Bearer <dev-token>" \
  http://localhost:4321/_emdash/api/plugins/carte-harness-probe/runtimeLimitProbe | jq .
{
  "data": {
    "cpuLoopMs": 75,
    "kvReads": 12,
    "note": "workerd accepted >50ms CPU loop and >10 bridge reads"
  }
}

real 0m0.220s
```

```console
$ pnpm exec wrangler --version
4.88.0
$ if ls harness/wrangler.* >/dev/null 2>&1; then echo present; else echo absent; fi
absent
```

Source reference for local workerd:

```text
node_modules/@emdash-cms/sandbox-workerd/src/sandbox/capnp.ts:
Standalone workerd does NOT support per-worker cpuMs/memoryMb/subrequests limits.
The only limit enforced on the Node path is wallTimeMs.

node_modules/@emdash-cms/sandbox-workerd/src/sandbox/runner.ts:
DEFAULT_LIMITS = { cpuMs: 50, memoryMb: 128, subrequests: 10, wallTimeMs: 30_000 }
cpuMs, memoryMb, and subrequests limits are not enforced by standalone workerd.
```

Doc-sourced Cloudflare runner facts:

```text
~/.claude/skills/emdash/references/plugin-cheatsheet.md:
The Cloudflare runner uses Worker Loader limits: 50 ms CPU, 10 subrequests, 30 s wall-clock per invocation.
Status: doc-sourced, not locally exercised, because no harness Cloudflare worker_loader/D1/R2 wrangler config exists in M0.
```

## 7. Post-response primitive in sandboxed handlers

**Claim.** Sandboxed handlers do not receive a `ctx.waitUntil` method, and no global `after` function exists inside the sandboxed handler. Plugin authors cannot schedule their own post-response work from sandboxed handlers. Any async work required by Carte sandboxed handlers must complete in-request unless the host runtime itself invokes plugin hooks after response.

Evidence:

```console
$ curl -s -H "Authorization: Bearer <dev-token>" \
  http://localhost:4321/_emdash/api/plugins/carte-harness-probe/postResponsePrimitive | jq .
{
  "data": {
    "ctxKeys": [
      "content",
      "email",
      "http",
      "kv",
      "log",
      "media",
      "plugin",
      "site",
      "storage",
      "url",
      "users"
    ],
    "ctxWaitUntilType": "undefined",
    "globalAfterType": "undefined",
    "hasCtxWaitUntil": false,
    "hasGlobalAfter": false
  }
}
```

Source reference:

```text
node_modules/@emdash-cms/sandbox-workerd/src/sandbox/wrapper.ts:
createContext() returns plugin, storage, kv, content, media, http, log, site, url, users, email.
It does not add waitUntil or after.
```

## Verification commands

```console
$ pnpm --dir harness test
✓ test/probe-plugin.test.ts (8 tests)

$ pnpm --dir harness typecheck
tsc --noEmit

$ pnpm --dir harness/plugins/probe typecheck
tsc --noEmit

$ pnpm --dir harness/plugins/probe exec emdash-plugin validate
✔ Manifest is valid: /home/cownose/projects/carte/harness/plugins/probe/emdash-plugin.jsonc

$ pnpm --dir harness/plugins/probe build && ls harness/plugins/probe/dist/index.mjs harness/plugins/probe/dist/plugin.mjs harness/plugins/probe/dist/manifest.json
✔ Plugin built: carte-harness-probe@0.1.0
harness/plugins/probe/dist/index.mjs
harness/plugins/probe/dist/plugin.mjs
harness/plugins/probe/dist/manifest.json
```

## 8. RESOLVED (was BLOCKING) — sandbox-workerd 0.1.6 enforced LEGACY capability names for `ctx.content` / `ctx.media`

**Status: RESOLVED via committed `pnpm patch` (PRO-852, M1). Originally BLOCKING — discovered during `@carte/core` conversion. Not covered by M0 — the M0 probe declared `content:read`/`content:write` but its routes only exercised `ctx.storage` + `ctx.kv`, never a real `ctx.content.*` bridge call. So the bridge's capability check was never hit until a content-backed route ran in-sandbox.**

### Applied resolution (2026-06-12)

Locked user decision: patch `@emdash-cms/sandbox-workerd@0.1.6` via `pnpm patch` so its bridge `requireCapability` accepts BOTH the deprecated and canonical capability names. Plugin manifests STAY canonical (`content:read`, …) — never reverted to legacy.

- Patch file: `patches/@emdash-cms__sandbox-workerd@0.1.6.patch`, wired via `pnpm.patchedDependencies` in root `package.json`. `pnpm install` re-applies it on every clone/CI run.
- Change: `requireCapability(opts, capability)` now resolves a minimal alias map (`read:content→content:read`, `write:content→content:write`, `read:media→media:read`, `write:media→media:write`, `read:users→users:read`, `network:fetch→network:request`) and passes if EITHER the requested legacy name OR its canonical alias is present in `opts.capabilities`. No other runner behavior changed.
- Regression guard: `harness/test/sandbox-capability-alias.test.ts` asserts the patch is wired and contains the alias map + dual-accept logic.
- Removal condition: drop the patch once upstream sandbox-workerd ships a bridge enforcer that uses canonical names (or applies its own `normalizeCapability()` inside `requireCapability`). Documented for downstream users in MIGRATION.md/READMEs (M4) and flagged for an upstream filing.

**Post-patch verification (2026-06-12, harness on :4321, dev-bypass bearer):**

```console
$ curl -s -H "Authorization: Bearer <dev-token>" \
  http://localhost:4321/_emdash/api/plugins/carte-core/menu-feed
{"data":{"items":[],"hasMore":false}}                     # real content/list round-trip — no Missing capability error

$ curl -s -H "Authorization: Bearer <dev-token>" \
  http://localhost:4321/_emdash/api/plugins/carte-core/schema-jsonld
{"error":{"code":"ROUTE_ERROR","message":"... carte_restaurants must include a restaurant profile."}}
#   ^ reaches domain logic AFTER a successful content/list bridge call (empty DB) — the capability gate no longer fires.

EmDash: Loaded sandboxed plugin carte-core:0.1.0 with capabilities: [content:read, content:write, media:read]
```

---

### Original analysis (retained for history)

**Claim.** `@emdash-cms/sandbox-workerd@0.1.6`'s in-sandbox bridge enforcer requires the **deprecated** capability names (`read:content`, `write:content`, `read:media`, …), while `emdash@0.18.0` + `@emdash-cms/plugin-cli@0.5.1` use and _require_ the **canonical** names (`content:read`, `content:write`, `media:read`). The two packages are mutually incompatible for any sandboxed plugin that touches `ctx.content` or `ctx.media`. There is **no manifest-level workaround**: plugin-cli `validate` rejects the legacy names, and the canonical names the host passes through unmodified fail the bridge check.

Evidence — a content-backed `@carte/core` route fails in-sandbox:

```console
$ curl -s -H "Authorization: Bearer <dev-token>" \
  http://localhost:4321/_emdash/api/plugins/carte-core/menu-feed
{"error":{"code":"ROUTE_ERROR","message":"Plugin carte-core:0.1.0 route menu-feed failed: Bridge call content/list failed: {\"error\":\"Missing capability: read:content\"}"}}
```

The same plugin's admin Block Kit page renders fine (load + dispatch confirmed; the page swallows content errors → empty counts):

```console
$ curl -s -H "Authorization: Bearer <dev-token>" \
  http://localhost:4321/_emdash/api/plugins/carte-core/admin | jq -c '.data | {type, title}'
{"type":"page","title":"Menus"}
```

Capabilities flow unmodified from descriptor → runner (no canonical→legacy remap on the load path):

```text
node_modules/emdash/dist/astro/index.mjs  (generateSandboxedPluginsModule, ~L1295):
  capabilities: ${JSON.stringify(descriptor.capabilities ?? [])}   // canonical, verbatim

node_modules/emdash/dist/astro/middleware.mjs:1187-1201 (loadSandboxedPlugins):
  manifest.capabilities = entry.capabilities ?? []                 // canonical, verbatim
  await sandboxRunner.load(manifest, entry.code)

node_modules/@emdash-cms/sandbox-workerd/dist/runner-DPvq5mbQ.mjs:90,93,95,99 (dispatch):
  case "content/list": requireCapability(opts, "read:content")     // LEGACY name required
  case "content/create": requireCapability(opts, "write:content")
  ... requireCapability throws `Missing capability: read:content`
```

No manifest workaround exists — the two enforcers disagree:

```console
# plugin-cli REJECTS legacy names:
$ emdash-plugin validate   # manifest with capabilities: ["read:content", ...]
ERROR  capability "read:content" is deprecated. Use "content:read" instead.

# host normalizeCapabilities() would collapse legacy→canonical anyway,
# so even if validate passed, the runner would still receive canonical names.
$ node -e "import('emdash').then(m=>console.log(m.normalizeCapabilities(['read:content'])))"
[ 'content:read' ]
```

**Impact.** Blocks the in-sandbox `ctx.content` / `ctx.media` round-trip for **all three** sandboxed plugins (`@carte/core`, `@carte/reservations`, `@carte/orders-backend`). `ctx.storage` + `ctx.kv` are unaffected (no capability gate). Plugin **load, dispatch, hooks, and Block Kit admin pages all work**; only content/media bridge calls fail.

**Resolution options (for orchestrator/operator — do NOT hack around in-plugin):**

1. Bump `@emdash-cms/sandbox-workerd` to a version whose bridge enforcer uses canonical names (verify upstream changelog; 0.1.6 is the locked pin per AGENTS.md "Stack Pins").
2. If no such version exists, file upstream against sandbox-workerd to apply `normalizeCapability()` inside `requireCapability` (accept both legacy and canonical).
3. Interim: a host-side shim that denormalizes canonical→legacy before `sandboxRunner.load` — but this contradicts AGENTS.md "Capability naming is locked" to canonical, so it must be an explicit operator decision, not a silent plugin change.
