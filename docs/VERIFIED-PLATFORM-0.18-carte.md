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
